"use client";

import { useEffect, useState, useCallback } from "react";
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
  Thermometer,
  Zap,
  Battery,
  AlertTriangle,
  Activity,
  Download,
  RefreshCw,
  Cpu,
  ShieldCheck,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import SocDonut from "@/components/dashboard/SocDonut";
import {
  getDashboardSummary,
  getFleetSummary,
  getSocTrend,
  getTemperatureTrend,
  getVoltageTrend,
  getCurrentTrend,
  getAlertAnalytics,
  getDeviceComparison,
} from "@/services/analyticsService";

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

function mapTrend(result: PromiseSettledResult<any>, key: string, range: Range) {
  if (result.status !== "fulfilled") return [];
  return (result.value?.data ?? []).map((item: any) => ({
    time: formatTime(item.recordedAt, range),
    [key]: Math.round(item.value * 10) / 10,
  }));
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

function RangeBadge({ range }: { range: Range }) {
  const color = range === "24h" ? C.green : range === "7d" ? C.blue : C.yellow;
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {range}
    </span>
  );
}

function EmptyState({ message = "No data for this period" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-28 text-xs" style={{ color: C.dim }}>
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
  const gradId = `grad_${dataKey}_${color.replace("#", "")}`;
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
        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("24h");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [fleet, setFleet] = useState<any>(null);
  const [socTrend, setSocTrend] = useState<any[]>([]);
  const [tempTrend, setTempTrend] = useState<any[]>([]);
  const [voltageTrend, setVoltageTrend] = useState<any[]>([]);
  const [currentTrend, setCurrentTrend] = useState<any[]>([]);
  const [alertAnalytics, setAlertAnalytics] = useState<any>(null);
  const [deviceComparison, setDeviceComparison] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = storedUser?.id;

      const [s, f, st, tt, vt, ct, aa, dc] = await Promise.allSettled([
        getDashboardSummary(userId),
        getFleetSummary(range),
        getSocTrend(range),
        getTemperatureTrend(range),
        getVoltageTrend(range),
        getCurrentTrend(range),
        getAlertAnalytics(range),
        getDeviceComparison(),
      ]);

      if (s.status === "fulfilled") setSummary(s.value?.data ?? null);
      if (f.status === "fulfilled") setFleet(f.value?.data ?? null);
      setSocTrend(mapTrend(st, "soc", range));
      setTempTrend(mapTrend(tt, "temperature", range));
      setVoltageTrend(mapTrend(vt, "voltage", range));
      setCurrentTrend(mapTrend(ct, "current", range));
      if (aa.status === "fulfilled") setAlertAnalytics(aa.value?.data ?? null);
      if (dc.status === "fulfilled") setDeviceComparison(dc.value?.data ?? []);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Derived values
  const fleetHealthScore =
    deviceComparison.length > 0
      ? Math.round(
          deviceComparison.reduce((sum, d) => sum + d.healthScore, 0) /
            deviceComparison.length
        )
      : 0;

  const alertPieData = (alertAnalytics?.bySeverity ?? []).map((s: any) => ({
    name: s.severity,
    value: s.count,
    color: SEVERITY_COLOR[s.severity] ?? C.blue,
  }));

  const handleExport = async () => {
    const token = localStorage.getItem("accessToken");
    const base = process.env.NEXT_PUBLIC_API;
    const res = await fetch(`${base}/reports/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bms-report.csv";
    link.click();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm animate-pulse" style={{ color: C.dim }}>
          Loading analytics…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Fleet Analytics</h1>
          <p className="text-xs mt-0.5" style={{ color: C.dim }}>
            Historical trends, battery health &amp; performance insights
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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
            onClick={load}
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

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          title="Total Devices"
          value={summary?.totalDevices ?? 0}
          subtext={`${summary?.onlineDevices ?? 0} Online`}
          subtextColor={C.green}
          icon={<Cpu size={13} style={{ color: C.yellow }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
        <StatCard
          title="Active Devices"
          value={summary?.onlineDevices ?? 0}
          subtext="Currently online"
          subtextColor={C.green}
          icon={<Activity size={13} style={{ color: C.green }} />}
          iconBg="rgba(0,230,118,0.12)"
        />
        <StatCard
          title="Avg SOC"
          value={`${summary?.averageSOC ?? 0}%`}
          subtext="Fleet average"
          icon={<Battery size={13} style={{ color: C.green }} />}
          iconBg="rgba(0,230,118,0.12)"
        >
          <div className="flex justify-center pt-1">
            <SocDonut value={summary?.averageSOC ?? 0} size={58} />
          </div>
        </StatCard>
        <StatCard
          title="Avg Temperature"
          value={`${fleet?._avg?.temperature != null ? fleet._avg.temperature.toFixed(1) : "—"}°C`}
          subtext={`Max: ${fleet?._max?.temperature != null ? fleet._max.temperature.toFixed(1) : "—"}°C`}
          subtextColor={C.yellow}
          icon={<Thermometer size={13} style={{ color: C.yellow }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
        <StatCard
          title="Avg Voltage"
          value={`${fleet?._avg?.voltage != null ? fleet._avg.voltage.toFixed(1) : "—"}V`}
          subtext={`Min: ${fleet?._min?.voltage != null ? fleet._min.voltage.toFixed(1) : "—"}V`}
          icon={<Zap size={13} style={{ color: C.blue }} />}
          iconBg="rgba(68,138,255,0.12)"
        />
        <StatCard
          title="Critical Alerts"
          value={summary?.criticalAlerts ?? 0}
          subtext={`${summary?.totalAlerts ?? 0} total active`}
          subtextColor={C.red}
          icon={<AlertTriangle size={13} style={{ color: C.red }} />}
          iconBg="rgba(255,82,82,0.12)"
        />
        <StatCard
          title="Fleet Health"
          value={`${fleetHealthScore}%`}
          subtext={
            fleetHealthScore >= 80 ? "Good" : fleetHealthScore >= 60 ? "Fair" : "Critical"
          }
          subtextColor={
            fleetHealthScore >= 80 ? C.green : fleetHealthScore >= 60 ? C.yellow : C.red
          }
          icon={
            <ShieldCheck
              size={13}
              style={{ color: fleetHealthScore >= 80 ? C.green : C.red }}
            />
          }
          iconBg={`rgba(${fleetHealthScore >= 80 ? "0,230,118" : "255,82,82"},0.12)`}
        />
      </div>

      {/* ── SOC & Temperature Trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="SOC Trend" badge={<RangeBadge range={range} />}>
          <TrendChart data={socTrend} dataKey="soc" color={C.green} unit="%" />
        </ChartCard>

        <ChartCard title="Temperature Trend" badge={<RangeBadge range={range} />}>
          <TrendChart data={tempTrend} dataKey="temperature" color={C.yellow} unit="°C" />
        </ChartCard>
      </div>

      {/* ── Voltage & Current Trends ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Voltage Trend" badge={<RangeBadge range={range} />}>
          <TrendChart data={voltageTrend} dataKey="voltage" color={C.blue} unit="V" />
        </ChartCard>

        <ChartCard title="Current Consumption" badge={<RangeBadge range={range} />}>
          <TrendChart data={currentTrend} dataKey="current" color={C.purple} unit="A" />
        </ChartCard>
      </div>

      {/* ── Alert Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Severity Pie */}
        <ChartCard title="Alerts by Severity" badge={<RangeBadge range={range} />}>
          {alertPieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={160}>
                <PieChart>
                  <Pie
                    data={alertPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {alertPieData.map((entry: any, i: number) => (
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
                {alertPieData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: entry.color }}
                    />
                    <span style={{ color: C.sub }}>{entry.name}</span>
                    <span className="font-bold text-white ml-1">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No alerts in this period" />
          )}
        </ChartCard>

        {/* Most Frequent Alert Types */}
        <ChartCard title="Most Frequent Alert Types" badge={<RangeBadge range={range} />}>
          {alertAnalytics?.byType?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {alertAnalytics.byType.map((item: any, i: number) => {
                const maxCount = alertAnalytics.byType[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span
                      className="flex-shrink-0 truncate"
                      style={{ color: C.sub, width: 140 }}
                    >
                      {item.type.replace(/_/g, " ")}
                    </span>
                    <div
                      className="flex-1 h-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
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

      {/* ── Device Comparison ── */}
      <ChartCard title="Device Comparison & Battery Health">
        {deviceComparison.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: C.dim }}>
                  <th className="text-left py-2 pr-6 font-medium">Device</th>
                  <th className="text-center py-2 px-3 font-medium">Status</th>
                  <th className="text-right py-2 px-3 font-medium">SOC</th>
                  <th className="text-right py-2 px-3 font-medium">Voltage</th>
                  <th className="text-right py-2 px-3 font-medium">Temp</th>
                  <th className="text-right py-2 pl-3 font-medium">Health Score</th>
                </tr>
              </thead>
              <tbody>
                {deviceComparison.map((device, i) => {
                  const healthColor =
                    device.healthScore >= 80
                      ? C.green
                      : device.healthScore >= 60
                      ? C.yellow
                      : C.red;
                  const socColor =
                    device.soc >= 60 ? C.green : device.soc >= 30 ? C.yellow : C.red;
                  const tempColor =
                    device.temperature > 45
                      ? C.red
                      : device.temperature > 35
                      ? C.yellow
                      : C.text;
                  const statusMeta: Record<
                    string,
                    { bg: string; color: string }
                  > = {
                    ONLINE: { bg: "rgba(0,230,118,0.1)", color: C.green },
                    OFFLINE: { bg: "rgba(255,82,82,0.1)", color: C.red },
                    WARNING: { bg: "rgba(255,179,0,0.1)", color: C.yellow },
                  };
                  const sm = statusMeta[device.status] ?? statusMeta.OFFLINE;

                  return (
                    <tr
                      key={device.id}
                      style={{
                        borderTop:
                          i === 0
                            ? "none"
                            : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td className="py-3 pr-6 font-medium text-white truncate max-w-[160px]">
                        {device.name}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: sm.bg, color: sm.color }}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3 text-right font-semibold"
                        style={{ color: socColor }}
                      >
                        {device.soc.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right text-white">
                        {device.voltage.toFixed(1)}V
                      </td>
                      <td
                        className="py-3 px-3 text-right font-medium"
                        style={{ color: tempColor }}
                      >
                        {device.temperature.toFixed(1)}°C
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className="w-20 h-1.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          >
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${device.healthScore}%`,
                                background: healthColor,
                              }}
                            />
                          </div>
                          <span
                            className="font-bold text-xs w-8 text-right"
                            style={{ color: healthColor }}
                          >
                            {device.healthScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No device data available" />
        )}
      </ChartCard>

      {/* ── SOC Distribution Bar ── */}
      <ChartCard title="SOC Distribution Overview">
        <SocDistributionBars deviceComparison={deviceComparison} />
      </ChartCard>
    </div>
  );
}

// ─── SOC Distribution Bars ────────────────────────────────────────────────────

function SocDistributionBars({ deviceComparison }: { deviceComparison: any[] }) {
  const buckets = [
    { label: "0 – 20%", color: C.red, min: 0, max: 20 },
    { label: "20 – 40%", color: "#FF8C00", min: 20, max: 40 },
    { label: "40 – 60%", color: C.yellow, min: 40, max: 60 },
    { label: "60 – 80%", color: "#4CAF50", min: 60, max: 80 },
    { label: "80 – 100%", color: C.green, min: 80, max: 101 },
  ];

  const counts = buckets.map((b) => ({
    ...b,
    count: deviceComparison.filter((d) => d.soc >= b.min && d.soc < b.max).length,
  }));

  const max = Math.max(...counts.map((c) => c.count), 1);

  if (!deviceComparison.length) return <EmptyState />;

  return (
    <div className="flex flex-col gap-3">
      {counts.map((bucket) => (
        <div key={bucket.label} className="flex items-center gap-3 text-xs">
          <span className="w-20 flex-shrink-0" style={{ color: C.sub }}>
            {bucket.label}
          </span>
          <div
            className="flex-1 h-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${(bucket.count / max) * 100}%`,
                background: bucket.color,
              }}
            />
          </div>
          <span className="font-semibold text-white w-4 text-right">{bucket.count}</span>
        </div>
      ))}
    </div>
  );
}
