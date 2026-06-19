"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Battery,
  Thermometer,
  Zap,
  Activity,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import SocDonut from "@/components/dashboard/SocDonut";
import { getMyDevices } from "@/services/deviceService";
import { getUserAnalytics } from "@/services/analyticsService";

// ─── Constants ────────────────────────────────────────────────────────────────

type Range = "24h" | "7d" | "30d";

const C = {
  green: "#00E676",
  blue: "#448AFF",
  yellow: "#FFB300",
  red: "#FF5252",
  purple: "#AB47BC",
  card: "#0C1426",
  border: "rgba(255,255,255,0.06)",
  dim: "#4A5A7A",
  sub: "#8899BB",
  text: "#E8F0FF",
} as const;

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: C.red,
  WARNING: C.yellow,
  INFO: C.blue,
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: C.card,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    fontSize: 12,
    color: C.text,
  },
  labelStyle: { color: C.sub },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string, range: Range): string {
  const d = new Date(iso);
  if (range === "24h") return `${d.getHours()}:00`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mapTrend(raw: any[], key: string, range: Range) {
  return (raw ?? []).map((item) => ({
    time: formatTime(item.recordedAt, range),
    [key]: Math.round(item.value * 10) / 10,
  }));
}

function healthColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  return C.red;
}

function healthLabel(score: number) {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Critical";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message = "No data for this period" }: { message?: string }) {
  return (
    <div
      className="flex items-center justify-center h-28 text-xs"
      style={{ color: C.dim }}
    >
      {message}
    </div>
  );
}

function TrendChart({
  data,
  dataKey,
  color,
  unit,
  height = 130,
}: {
  data: any[];
  dataKey: string;
  color: string;
  unit: string;
  height?: number;
}) {
  const gradId = `ugrad_${dataKey}`;
  if (!data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: C.dim, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          {...TOOLTIP_STYLE}
          itemStyle={{ color }}
          formatter={(v: any) => [
            `${Number(v).toFixed(1)} ${unit}`,
            dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
          ]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Health Score Ring ────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = healthColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle
          cx={55}
          cy={55}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center" style={{ marginTop: -80 }}>
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs" style={{ color: C.sub }}>
          / 100
        </span>
        <span className="text-xs font-medium mt-0.5" style={{ color }}>
          {healthLabel(score)}
        </span>
      </div>
      {/* spacer to keep card height */}
      <div style={{ height: 28 }} />
    </div>
  );
}

// ─── Device Selector ─────────────────────────────────────────────────────────

function DeviceSelector({
  devices,
  selectedId,
  onChange,
}: {
  devices: { id: string; name: string; status: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = devices.find((d) => d.id === selectedId);

  if (devices.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ background: "rgba(68,138,255,0.1)", color: C.blue, border: `1px solid rgba(68,138,255,0.25)` }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background:
              selected?.status === "ONLINE"
                ? C.green
                : selected?.status === "WARNING"
                ? C.yellow
                : C.red,
          }}
        />
        {selected?.name ?? "Select device"}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-52 rounded-xl py-1 z-20"
          style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
        >
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => { onChange(d.id); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5"
              style={{ color: d.id === selectedId ? C.green : C.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background:
                    d.status === "ONLINE" ? C.green : d.status === "WARNING" ? C.yellow : C.red,
                }}
              />
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserAnalyticsPage() {
  const [range, setRange] = useState<Range>("24h");
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load user's devices once on mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await getMyDevices();
        const list = res?.data ?? [];
        setDevices(list);
        if (list.length > 0) setSelectedDeviceId(list[0].deviceId);
      } catch (err) {
        console.error("Failed to load devices:", err);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Load analytics when device or range changes
  const loadAnalytics = useCallback(async () => {
    if (!selectedDeviceId) return;
    try {
      setLoadingAnalytics(true);
      const res = await getUserAnalytics(selectedDeviceId, range);
      setAnalytics(res?.data ?? null);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedDeviceId, range]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Export CSV using existing reports endpoint
  const handleExport = async () => {
    const token = localStorage.getItem("accessToken");
    const base = process.env.NEXT_PUBLIC_API;
    const params = selectedDeviceId ? `?deviceId=${encodeURIComponent(selectedDeviceId)}` : "";
    const res = await fetch(`${base}/reports/export${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `battery-report.csv`;
    link.click();
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const device = analytics?.device;
  const trends = analytics?.trends;
  const alerts = analytics?.alerts;
  const monthly = analytics?.monthly;

  const socTrend = mapTrend(trends?.soc ?? [], "soc", range);
  const tempTrend = mapTrend(trends?.temperature ?? [], "temperature", range);
  const voltageTrend = mapTrend(trends?.voltage ?? [], "voltage", range);
  const currentTrend = mapTrend(trends?.current ?? [], "current", range);

  const alertPieData = [
    { name: "Critical", value: alerts?.critical ?? 0, color: C.red },
    { name: "Warning", value: alerts?.warning ?? 0, color: C.yellow },
    { name: "Info", value: alerts?.info ?? 0, color: C.blue },
  ].filter((d) => d.value > 0);

  // ── No devices state ─────────────────────────────────────────────────────

  if (loadingDevices) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm animate-pulse" style={{ color: C.dim }}>
          Loading your devices…
        </span>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Battery size={40} style={{ color: C.dim }} />
        <p className="text-sm" style={{ color: C.sub }}>
          No devices assigned to your account yet.
        </p>
        <a
          href="/user-dashboard"
          className="px-4 py-2 rounded-lg text-xs font-medium"
          style={{ background: "rgba(0,230,118,0.1)", color: C.green }}
        >
          Go to Dashboard to add a device
        </a>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  const deviceList = devices.map((d: any) => ({
    id: d.deviceId,
    name: d.deviceName,
    status: d.device?.status ?? "OFFLINE",
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">My Battery Analytics</h1>
          <p className="text-xs mt-0.5" style={{ color: C.dim }}>
            Performance insights for your assigned device
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DeviceSelector
            devices={deviceList}
            selectedId={selectedDeviceId}
            onChange={setSelectedDeviceId}
          />

          {/* Range selector */}
          <div
            className="flex rounded-lg overflow-hidden text-xs"
            style={{ border: `1px solid ${C.border}` }}
          >
            {(["24h", "7d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5 font-medium transition-colors"
                style={{
                  background: range === r ? C.green : "transparent",
                  color: range === r ? C.card : C.sub,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,230,118,0.1)", color: C.green }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(68,138,255,0.1)", color: C.blue }}
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Loading overlay for analytics */}
      {loadingAnalytics && (
        <div className="text-xs text-center py-2 animate-pulse" style={{ color: C.dim }}>
          Fetching analytics…
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Battery Health"
          value={`${device?.healthScore ?? 0}%`}
          subtext={healthLabel(device?.healthScore ?? 0)}
          subtextColor={healthColor(device?.healthScore ?? 0)}
          icon={
            <ShieldCheck
              size={13}
              style={{ color: healthColor(device?.healthScore ?? 0) }}
            />
          }
          iconBg={`rgba(${(device?.healthScore ?? 0) >= 80 ? "0,230,118" : "255,82,82"},0.12)`}
        />
        <StatCard
          title="Current SOC"
          value={`${device?.soc ?? 0}%`}
          subtext="State of charge"
          icon={<Battery size={13} style={{ color: C.green }} />}
          iconBg="rgba(0,230,118,0.12)"
        >
          <div className="flex justify-center pt-1">
            <SocDonut value={device?.soc ?? 0} size={58} />
          </div>
        </StatCard>
        <StatCard
          title="Temperature"
          value={`${device?.temperature ?? 0}°C`}
          subtext={
            (device?.temperature ?? 0) > 45
              ? "⚠ High temperature"
              : "Normal range"
          }
          subtextColor={
            (device?.temperature ?? 0) > 45 ? C.red : C.green
          }
          icon={<Thermometer size={13} style={{ color: C.yellow }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
        <StatCard
          title="Voltage"
          value={`${device?.voltage ?? 0}V`}
          subtext={`${device?.status ?? "—"}`}
          subtextColor={
            device?.status === "ONLINE"
              ? C.green
              : device?.status === "WARNING"
              ? C.yellow
              : C.red
          }
          icon={<Zap size={13} style={{ color: C.blue }} />}
          iconBg="rgba(68,138,255,0.12)"
        />
      </div>

      {/* ── SOC Trend (full width) ── */}
      <ChartCard
        title="SOC Trend"
        badge={
          <span className="text-xs font-medium" style={{ color: C.green }}>
            {range}
          </span>
        }
      >
        <TrendChart data={socTrend} dataKey="soc" color={C.green} unit="%" height={150} />
      </ChartCard>

      {/* ── Temperature & Voltage Trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Temperature Trend"
          badge={
            <span className="text-xs font-medium" style={{ color: C.yellow }}>
              {range}
            </span>
          }
        >
          <TrendChart data={tempTrend} dataKey="temperature" color={C.yellow} unit="°C" />
        </ChartCard>

        <ChartCard
          title="Voltage Trend"
          badge={
            <span className="text-xs font-medium" style={{ color: C.blue }}>
              {range}
            </span>
          }
        >
          <TrendChart data={voltageTrend} dataKey="voltage" color={C.blue} unit="V" />
        </ChartCard>
      </div>

      {/* ── Current & Battery Health ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Current Consumption"
          badge={
            <span className="text-xs font-medium" style={{ color: C.purple }}>
              {range}
            </span>
          }
        >
          <TrendChart data={currentTrend} dataKey="current" color={C.purple} unit="A" />
        </ChartCard>

        {/* Battery Health Score */}
        <ChartCard title="Battery Health Score">
          <div className="flex items-center gap-8">
            <HealthRing score={device?.healthScore ?? 0} />
            <div className="flex flex-col gap-3 flex-1">
              <HealthFactor
                label="SOC Level"
                value={device?.soc ?? 0}
                suffix="%"
                good={device?.soc >= 40}
              />
              <HealthFactor
                label="Temperature"
                value={device?.temperature ?? 0}
                suffix="°C"
                good={(device?.temperature ?? 0) <= 40}
              />
              <HealthFactor
                label="Device Status"
                value={device?.status ?? "—"}
                good={device?.status === "ONLINE"}
              />
              <HealthFactor
                label="Capacity"
                value={`${device?.capacity ?? 0} kWh`}
                good
              />
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Alert Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Severity Pie */}
        <ChartCard
          title="Alert Summary"
          badge={
            <span className="text-xs font-medium" style={{ color: C.sub }}>
              {range}
            </span>
          }
        >
          {alertPieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={150}>
                <PieChart>
                  <Pie
                    data={alertPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {alertPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-3">
                {[
                  { label: "Critical", value: alerts?.critical ?? 0, color: C.red },
                  { label: "Warning", value: alerts?.warning ?? 0, color: C.yellow },
                  { label: "Info", value: alerts?.info ?? 0, color: C.blue },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: row.color }}
                    />
                    <span style={{ color: C.sub }}>{row.label}</span>
                    <span className="font-bold text-white ml-1">{row.value}</span>
                  </div>
                ))}
                <div
                  className="pt-2 mt-1 text-xs font-medium"
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    color: (alerts?.total ?? 0) > 0 ? C.yellow : C.green,
                  }}
                >
                  {(alerts?.total ?? 0) > 0
                    ? `${alerts?.total} alert(s) in this period`
                    : "No alerts in this period"}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="No alerts in this period" />
          )}
        </ChartCard>

        {/* Alert Types Breakdown */}
        <ChartCard title="Alert Types">
          {alerts?.byType?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {alerts.byType.map((item: any, i: number) => {
                const maxCount = alerts.byType[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span
                      className="flex-shrink-0 truncate"
                      style={{ color: C.sub, width: 148 }}
                    >
                      {item.type.replace(/_/g, " ")}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: C.red }}
                      />
                    </div>
                    <span className="font-semibold text-white w-5 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No alerts in this period" />
          )}
        </ChartCard>
      </div>

      {/* ── Monthly Summary ── */}
      <ChartCard title="Monthly Summary (Last 30 Days)">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Avg SOC",
              value: `${monthly?.avgSoc ?? 0}%`,
              color:
                (monthly?.avgSoc ?? 0) >= 60
                  ? C.green
                  : (monthly?.avgSoc ?? 0) >= 30
                  ? C.yellow
                  : C.red,
            },
            {
              label: "Avg Temperature",
              value: `${monthly?.avgTemp ?? 0}°C`,
              color:
                (monthly?.avgTemp ?? 0) > 45
                  ? C.red
                  : (monthly?.avgTemp ?? 0) > 35
                  ? C.yellow
                  : C.green,
            },
            {
              label: "Max Temperature",
              value: `${monthly?.maxTemp ?? 0}°C`,
              color: (monthly?.maxTemp ?? 0) > 50 ? C.red : C.yellow,
            },
            {
              label: "Avg Voltage",
              value: `${monthly?.avgVoltage ?? 0}V`,
              color: C.blue,
            },
            {
              label: "Total Alerts",
              value: monthly?.alertCount ?? 0,
              color: (monthly?.alertCount ?? 0) > 0 ? C.yellow : C.green,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 flex flex-col gap-1"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}
            >
              <span className="text-xs" style={{ color: C.dim }}>
                {item.label}
              </span>
              <span
                className="text-xl font-bold"
                style={{ color: item.color }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Health score summary */}
        <div
          className="mt-4 flex items-center gap-3 rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}
        >
          <ShieldCheck size={18} style={{ color: healthColor(monthly?.healthScore ?? 0) }} />
          <div>
            <p className="text-xs text-white font-semibold">
              Battery Health Score:{" "}
              <span style={{ color: healthColor(monthly?.healthScore ?? 0) }}>
                {monthly?.healthScore ?? 0} / 100 — {healthLabel(monthly?.healthScore ?? 0)}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.dim }}>
              Computed from SOC level, temperature stability, and device status.
            </p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Health Factor Row ────────────────────────────────────────────────────────

function HealthFactor({
  label,
  value,
  suffix,
  good,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: C.sub }}>{label}</span>
      <span
        className="font-semibold"
        style={{ color: good ? C.green : C.yellow }}
      >
        {value}
        {suffix}
      </span>
    </div>
  );
}
