"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Battery,
  Thermometer,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  Clock,
  Info,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { apiFetch } from "@/services/apiClient";
import { getMyDevices } from "@/services/deviceService";
import { getUserAlertReport } from "@/services/reportService";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  green: "#00E676",
  blue: "#448AFF",
  yellow: "#FFB300",
  red: "#FF5252",
  purple: "#AB47BC",
  orange: "#FF6D00",
  card: "#0C1426",
  card2: "#0A1020",
  border: "rgba(255,255,255,0.06)",
  dim: "#2A3A5A",
  sub: "#6B7FA3",
  text: "#E8F0FF",
  bg: "#070E1B",
} as const;

const TOOLTIP_STYLE = {
  contentStyle: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.text },
  labelStyle: { color: C.sub },
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: C.red,
  WARNING: C.yellow,
  INFO: C.blue,
};

const STATUS_COLOR: Record<string, string> = {
  ONLINE: C.green,
  OFFLINE: C.sub,
  WARNING: C.yellow,
  CRITICAL: C.red,
  MAINTENANCE: C.orange,
};

const REFRESH_OPTIONS = [5, 10, 30];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveReading {
  soc: number;
  voltage: number;
  current: number;
  temperature: number;
  capacity: number;
  recordedAt: string;
}

interface TrendPoint {
  t: string;
  soc: number;
  temp: number;
  volt: number;
  curr: number;
}

interface FeedEntry {
  id: number;
  time: string;
  metric: string;
  value: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function healthScore(soc: number, temperature: number, status: string): number {
  let score = 100;
  if (soc < 20) score -= 25;
  else if (soc < 40) score -= 10;
  if (temperature > 50) score -= 25;
  else if (temperature > 40) score -= 10;
  if (status === "OFFLINE") score -= 15;
  else if (status === "WARNING") score -= 8;
  return Math.max(0, score);
}

function healthColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  return C.red;
}

function healthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Fair";
  return "Critical";
}

function socColor(soc: number): string {
  if (soc >= 50) return C.green;
  if (soc >= 20) return C.yellow;
  return C.red;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 5) return "Just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function mapHistory(records: any[]): TrendPoint[] {
  return [...records].reverse().map((r) => ({
    t: fmtTime(r.recordedAt),
    soc: +(r.soc ?? 0).toFixed(1),
    temp: +(r.temperature ?? 0).toFixed(1),
    volt: +(r.voltage ?? 0).toFixed(2),
    curr: +(r.current ?? 0).toFixed(2),
  }));
}

// ─── SOC Gauge ────────────────────────────────────────────────────────────────

function SocGauge({ soc, size = 180 }: { soc: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (soc / 100) * circumference;
  const color = socColor(soc);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        {/* Glow ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeOpacity={0.15} />
        {/* Progress */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.5s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{soc.toFixed(0)}</span>
        <span style={{ fontSize: size * 0.09, color: C.sub, fontWeight: 600 }}>% SOC</span>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon, label, value, unit, color, sub,
}: {
  icon: React.ReactNode; label: string; value: string | number; unit: string; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px",
      borderTop: `2px solid ${color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px" }}>{label}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 14, color: C.sub }}>{unit}</span>
          </div>
          {sub && <p style={{ color: C.sub, fontSize: 11, margin: "4px 0 0" }}>{sub}</p>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({
  title, children, badge,
}: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{title}</span>
        {badge && (
          <span style={{ background: `${C.blue}20`, color: C.blue, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Charging Badge ───────────────────────────────────────────────────────────

function ChargingBadge({ current }: { current: number }) {
  const abs = Math.abs(current);
  if (abs < 0.5) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${C.sub}18`, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
        <Minus size={18} color={C.sub} />
        <div>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Idle</p>
          <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>No charge flow</p>
        </div>
      </div>
    );
  }

  const charging = current > 0;
  const color = charging ? C.green : C.yellow;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 10, padding: "10px 16px" }}>
      {charging ? <TrendingUp size={18} color={color} /> : <TrendingDown size={18} color={color} />}
      <div>
        <p style={{ color: color, fontWeight: 700, fontSize: 14, margin: 0 }}>{charging ? "Charging" : "Discharging"}</p>
        <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>{charging ? "+" : "-"}{abs.toFixed(1)} A</p>
      </div>
    </div>
  );
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "pulseRing 1.5s ease-out infinite" }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
    </span>
  );
}

// ─── No Device Empty State ────────────────────────────────────────────────────

function NoDevice() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
      <Battery size={56} style={{ color: C.dim, opacity: 0.5 }} />
      <p style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>No device assigned</p>
      <p style={{ color: C.sub, fontSize: 13 }}>Contact your administrator to get a battery assigned.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserLiveMonitorPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const [live, setLive] = useState<LiveReading | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);

  const [refreshRate, setRefreshRate] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noTelemetry, setNoTelemetry] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const feedIdRef = useRef(0);

  // ── Load devices ──────────────────────────────────────────────────────────

  useEffect(() => {
    getMyDevices()
      .then((res: any) => {
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        setDevices(list);
        if (list.length > 0) {
          setDeviceId(list[0].deviceId);
          setDeviceInfo(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch live data ───────────────────────────────────────────────────────

  const fetchLive = useCallback(async (id: string, showRefreshing = false) => {
    if (!id) return;
    if (showRefreshing) setRefreshing(true);

    try {
      const [telRes, histRes, alertRes] = await Promise.allSettled([
        apiFetch(`/telemetry/${id}/latest`),
        apiFetch(`/telemetry/${id}/history?limit=40`),
        getUserAlertReport({ deviceId: id }),
      ]);

      // Latest reading
      if (telRes.status === "fulfilled" && telRes.value?.data) {
        const d = telRes.value.data;
        setLive({
          soc: d.soc ?? 0,
          voltage: d.voltage ?? 0,
          current: d.current ?? 0,
          temperature: d.temperature ?? 0,
          capacity: d.capacity ?? 0,
          recordedAt: d.recordedAt ?? new Date().toISOString(),
        });
        setLastUpdated(d.recordedAt ?? new Date().toISOString());
        setNoTelemetry(false);

        // Append to feed
        const metrics = [
          { metric: "SOC", value: `${d.soc?.toFixed(1)}%`, color: C.green },
          { metric: "Temp", value: `${d.temperature?.toFixed(1)}°C`, color: C.red },
          { metric: "Voltage", value: `${d.voltage?.toFixed(2)}V`, color: C.blue },
          { metric: "Current", value: `${d.current?.toFixed(2)}A`, color: C.yellow },
        ];
        const pick = metrics[feedIdRef.current % metrics.length];
        const entry: FeedEntry = {
          id: ++feedIdRef.current,
          time: fmtTime(new Date().toISOString()),
          metric: pick.metric,
          value: pick.value,
          color: pick.color,
        };
        setFeed((prev) => [entry, ...prev.slice(0, 59)]);
      } else {
        setNoTelemetry(true);
      }

      // History
      if (histRes.status === "fulfilled") {
        const records = histRes.value?.data ?? [];
        setTrend(mapHistory(records));
      }

      // Alerts
      if (alertRes.status === "fulfilled") {
        const data = (alertRes.value as any)?.data;
        const all: any[] = data?.alerts ?? [];
        setActiveAlerts(all.filter((a: any) => !a.isResolved).slice(0, 10));
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    if (!deviceId) return;
    fetchLive(deviceId);
  }, [deviceId, fetchLive]);

  useEffect(() => {
    if (!deviceId) return;
    const id = setInterval(() => {
      fetchLive(deviceId);
    }, refreshRate * 1000);
    return () => clearInterval(id);
  }, [deviceId, refreshRate, fetchLive]);



  // ── Device switch ─────────────────────────────────────────────────────────

  const selectDevice = (reg: any) => {
    setDeviceId(reg.deviceId);
    setDeviceInfo(reg);
    setLive(null);
    setTrend([]);
    setActiveAlerts([]);
    setFeed([]);
    setDropdownOpen(false);
    setNoTelemetry(false);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const deviceStatus = deviceInfo?.device?.status ?? "OFFLINE";
  const score = live ? healthScore(live.soc, live.temperature, deviceStatus) : 0;
  const power = live ? +(Math.abs(live.voltage * live.current)).toFixed(0) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 12 }}>
        <RefreshCw size={32} style={{ color: C.blue, animation: "spin 1s linear infinite" }} />
        <p style={{ color: C.sub, fontSize: 14 }}>Loading monitor…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (devices.length === 0) return <NoDevice />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pulse color={deviceStatus === "ONLINE" ? C.green : STATUS_COLOR[deviceStatus] ?? C.sub} />
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Live Monitor</h1>
            <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>
              {lastUpdated ? `Last updated ${timeAgo(lastUpdated)}` : "Waiting for data…"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Device selector */}
          {devices.length > 1 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.card, color: C.text, cursor: "pointer", fontSize: 13,
                }}
              >
                <Battery size={14} color={C.blue} />
                {deviceInfo?.deviceName ?? "Select device"}
                <ChevronDown size={13} style={{ color: C.sub }} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#0A1020",
                  border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 20, minWidth: 200, overflow: "hidden",
                }}>
                  {devices.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={() => selectDevice(d)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px", background: "none",
                        border: "none", cursor: "pointer", color: d.deviceId === deviceId ? C.green : C.text,
                        fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[d.device?.status ?? "OFFLINE"] ?? C.sub, display: "inline-block", flexShrink: 0 }} />
                      {d.deviceName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh rate */}
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {REFRESH_OPTIONS.map((r) => (
              <button key={r} onClick={() => setRefreshRate(r)} style={{
                padding: "7px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: refreshRate === r ? C.blue : "transparent",
                color: refreshRate === r ? "#fff" : C.sub,
              }}>
                {r}s
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchLive(deviceId, true)}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Updating…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── No telemetry notice ── */}
      {noTelemetry && (
        <div style={{ background: `${C.yellow}12`, border: `1px solid ${C.yellow}30`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: C.yellow, fontSize: 13 }}>
          <Info size={14} />
          No telemetry data found for this device. Data will appear once the device starts reporting.
        </div>
      )}

      {/* ── Row 1: SOC Gauge · Status Card · Health Score ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, marginBottom: 16, alignItems: "stretch" }}>

        {/* SOC Gauge */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <SocGauge soc={live?.soc ?? 0} size={170} />
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: 0 }}>State of Charge</p>
        </div>

        {/* Battery Status */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 14px" }}>Battery Status</p>

          {/* Status badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${STATUS_COLOR[deviceStatus] ?? C.sub}15`, border: `1px solid ${STATUS_COLOR[deviceStatus] ?? C.sub}30`, borderRadius: 8, padding: "6px 14px", marginBottom: 16 }}>
            {deviceStatus === "ONLINE" ? <Wifi size={14} color={C.green} /> : <WifiOff size={14} color={C.sub} />}
            <span style={{ color: STATUS_COLOR[deviceStatus] ?? C.sub, fontWeight: 700, fontSize: 14 }}>{deviceStatus}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "SOC", value: `${live?.soc?.toFixed(1) ?? "—"}%`, color: socColor(live?.soc ?? 0) },
              { label: "Voltage", value: `${live?.voltage?.toFixed(2) ?? "—"} V`, color: C.blue },
              { label: "Current", value: `${live?.current?.toFixed(2) ?? "—"} A`, color: C.yellow },
              { label: "Temperature", value: `${live?.temperature?.toFixed(1) ?? "—"} °C`, color: live?.temperature && live.temperature > 45 ? C.red : C.text },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.card2, borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ color: C.sub, fontSize: 11, margin: "0 0 4px" }}>{label}</p>
                <p style={{ color, fontWeight: 700, fontSize: 16, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Charging badge */}
          <div style={{ marginTop: 12 }}>
            <ChargingBadge current={live?.current ?? 0} />
          </div>
        </div>

        {/* Health Score */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 160 }}>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px" }}>Battery Health</p>

          {/* Ring */}
          <div style={{ position: "relative", width: 110, height: 110 }}>
            <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={55} cy={55} r={42} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
              <circle cx={55} cy={55} r={42} fill="none"
                stroke={healthColor(score)} strokeWidth={10}
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: healthColor(score) }}>{score}</span>
              <span style={{ fontSize: 10, color: C.sub }}>/100</span>
            </div>
          </div>

          <span style={{
            background: `${healthColor(score)}18`, color: healthColor(score),
            fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
          }}>
            {healthLabel(score)}
          </span>

          {/* Last updated */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
            <Clock size={11} color={C.sub} />
            <span style={{ color: C.sub, fontSize: 11 }}>{timeAgo(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Metric Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <MetricCard icon={<Zap size={18} />} label="Voltage" value={live?.voltage?.toFixed(2) ?? "—"} unit="V" color={C.blue} sub="Pack voltage" />
        <MetricCard icon={<Activity size={18} />} label="Current" value={live?.current?.toFixed(2) ?? "—"} unit="A" color={C.yellow} sub={live ? (live.current > 0 ? "Charging" : live.current < 0 ? "Discharging" : "Idle") : "—"} />
        <MetricCard icon={<Thermometer size={18} />} label="Temperature" value={live?.temperature?.toFixed(1) ?? "—"} unit="°C" color={live?.temperature && live.temperature > 45 ? C.red : live?.temperature && live.temperature > 35 ? C.yellow : C.text} sub={live?.temperature && live.temperature > 45 ? "⚠ High" : "Normal"} />
        <MetricCard icon={<Battery size={18} />} label="Power" value={power} unit="W" color={C.purple} sub={`${live?.capacity?.toFixed(1) ?? "—"} kWh capacity`} />
      </div>

      {/* ── Row 3: SOC Trend (full width) ── */}
      <ChartCard title="Live SOC Trend" badge="Real-time">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gSoc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fill: C.sub, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.sub, fontSize: 10 }} domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, "SOC"]} />
            <ReferenceLine y={20} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="soc" stroke={C.green} fill="url(#gSoc)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        {trend.length === 0 && (
          <p style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: "8px 0" }}>No trend data yet</p>
        )}
      </ChartCard>

      {/* ── Row 4: Temperature + Voltage ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, marginBottom: 16 }}>
        <ChartCard title="Temperature Trend" badge="°C">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fill: C.sub, fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: C.sub, fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}°C`, "Temp"]} />
              <ReferenceLine y={45} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="temp" stroke={C.red} fill="url(#gTemp)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Voltage Trend" badge="V">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gVolt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fill: C.sub, fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: C.sub, fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}V`, "Voltage"]} />
              <Area type="monotone" dataKey="volt" stroke={C.blue} fill="url(#gVolt)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 5: Alerts + Device Info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Active Alerts */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} color={C.red} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Active Alerts</span>
            {activeAlerts.length > 0 && (
              <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginLeft: "auto" }}>
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div style={{ padding: 4, maxHeight: 220, overflowY: "auto" }}>
            {activeAlerts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 20px", gap: 8 }}>
                <CheckCircle size={28} color={C.green} />
                <p style={{ color: C.green, fontSize: 13, fontWeight: 600, margin: 0 }}>No Active Alerts</p>
                <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>Your battery is operating normally</p>
              </div>
            ) : activeAlerts.map((a) => (
              <div key={a.id} style={{
                padding: "10px 14px", margin: "4px", borderRadius: 8,
                background: `${SEVERITY_COLOR[a.severity] ?? C.sub}10`,
                border: `1px solid ${SEVERITY_COLOR[a.severity] ?? C.sub}25`,
                borderLeft: `3px solid ${SEVERITY_COLOR[a.severity] ?? C.sub}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: SEVERITY_COLOR[a.severity], fontWeight: 700, fontSize: 12 }}>{a.severity}</span>
                  <span style={{ color: C.sub, fontSize: 11 }}>{timeAgo(a.createdAt)}</span>
                </div>
                <p style={{ color: C.text, fontSize: 13, margin: "4px 0 0" }}>{a.message}</p>
                <p style={{ color: C.sub, fontSize: 11, margin: "2px 0 0" }}>{a.alertType}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Device Info */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={14} color={C.blue} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Device Information</span>
          </div>
          <div style={{ padding: "8px 16px" }}>
            {[
              { label: "Device Name", value: deviceInfo?.deviceName ?? "—" },
              { label: "Device Type", value: deviceInfo?.device?.deviceType ?? "—" },
              { label: "Battery Type", value: deviceInfo?.batteryType ?? "—" },
              { label: "Capacity", value: deviceInfo?.device?.totalCapacityKWh ? `${deviceInfo.device.totalCapacityKWh} kWh` : "—" },
              { label: "Serial Number", value: deviceInfo?.device?.serialNumber ?? "—" },
              { label: "Status", value: deviceStatus },
              { label: "Registered", value: deviceInfo?.registeredAt ? new Date(deviceInfo.registeredAt).toLocaleDateString() : "—" },
              { label: "Subscription", value: deviceInfo?.dataSubscription ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
                <span style={{
                  color: label === "Status" ? (STATUS_COLOR[value] ?? C.text) : C.text,
                  fontSize: 13, fontWeight: label === "Status" ? 700 : 500,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 6: Telemetry Feed ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={14} color={C.green} style={{ animation: "spin 3s linear infinite" }} />
          <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Telemetry Feed</span>
          <span style={{ background: `${C.green}20`, color: C.green, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>LIVE</span>
          <span style={{ color: C.sub, fontSize: 11, marginLeft: 4 }}>Updates every {refreshRate}s</span>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, maxHeight: 180, overflowY: "auto", padding: "4px 0" }}>
          {feed.length === 0 ? (
            <p style={{ color: C.sub, padding: "16px 18px", fontSize: 12 }}>Waiting for telemetry…</p>
          ) : feed.map((e) => (
            <div key={e.id} style={{ padding: "5px 18px", display: "flex", gap: 16, alignItems: "center", borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
              <span style={{ color: C.dim, minWidth: 60 }}>{e.time}</span>
              <span style={{ color: C.sub, minWidth: 70 }}>{e.metric}</span>
              <span style={{ color: e.color, fontWeight: 700 }}>{e.value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        select option { background: #111B2E; color: #E8F0FF; }
      `}</style>
    </div>
  );
}
