"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  RefreshCw,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Battery,
  Thermometer,
  Zap,
  Clock,
  CheckCircle,
  Radio,
} from "lucide-react";
import { apiFetch, API_BASE } from "@/services/apiClient";

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

const STATUS_COLOR: Record<string, string> = {
  ONLINE: C.green,
  OFFLINE: C.sub,
  WARNING: C.yellow,
  CRITICAL: C.red,
  MAINTENANCE: C.orange,
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: C.red,
  WARNING: C.yellow,
  INFO: C.blue,
};

const REFRESH_OPTIONS = [5, 10, 30, 60];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceRow {
  id: string;
  name: string;
  type: string;
  status: string;
  soc: number;
  voltage: number;
  temperature: number;
  current: number;
  capacity: number;
  healthScore: number;
  batteryType: string | null;
  assignedTo: string | null;
  activeAlerts: number;
  lastSeen: string | null;
}

interface FleetSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  criticalAlerts: number;
  warningAlerts: number;
  totalActiveAlerts: number;
  avgSOC: number;
  avgTemperature: number;
  avgVoltage: number;
  fleetHealthScore: number;
}

interface AlertItem {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  isResolved: boolean;
  isAcknowledged: boolean;
  createdAt: string;
  device?: { deviceName: string };
}

interface TelemetryPoint {
  recordedAt: string;
  soc: number;
  voltage: number;
  temperature: number;
  current: number;
}

interface StreamEntry {
  id: number;
  time: string;
  label: string;
  value: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 10) return "Just now";
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function signalLabel(iso: string | null): { label: string; color: string } {
  if (!iso) return { label: "No Signal", color: C.sub };
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 30) return { label: "Excellent", color: C.green };
  if (diff < 120) return { label: "Good", color: C.blue };
  if (diff < 600) return { label: "Fair", color: C.yellow };
  return { label: "Poor", color: C.red };
}

function healthColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  return C.red;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub }: { label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: 0 }}>{label}</p>
        <p style={{ color, fontSize: 26, fontWeight: 700, margin: "2px 0 0", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: C.sub, fontSize: 11, margin: "3px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: "asc" | "desc" }) {
  if (sortBy !== field) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} style={{ color: C.blue }} /> : <ChevronDown size={12} style={{ color: C.blue }} />;
}

// ─── Live Pulse dot ───────────────────────────────────────────────────────────

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4,
        animation: "pulseRing 1.5s ease-out infinite",
      }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveMonitorPage() {
  const [fleet, setFleet] = useState<FleetSummary | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceRow | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [streamLog, setStreamLog] = useState<StreamEntry[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [refreshRate, setRefreshRate] = useState(10);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const streamIdRef = useRef(0);
  const sseRef = useRef<EventSource | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [fleetRes, devicesRes, alertsRes] = await Promise.allSettled([
        apiFetch("/reports/fleet"),
        apiFetch("/reports/devices"),
        apiFetch("/alerts/recent?limit=25"),
      ]);

      if (fleetRes.status === "fulfilled") setFleet(fleetRes.value?.data ?? null);
      if (devicesRes.status === "fulfilled") setDevices(devicesRes.value?.data ?? []);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value?.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  }, []);

  const fetchDeviceTelemetry = useCallback(async (deviceId: string) => {
    try {
      const res = await apiFetch(`/telemetry/${deviceId}/history?limit=30`);
      const records = (res?.data ?? []).reverse();
      setTelemetryHistory(records);
    } catch {
      setTelemetryHistory([]);
    }
  }, []);

  // ── SSE for telemetry stream log ───────────────────────────────────────────

  useEffect(() => {
    const url = `${API_BASE}/live-stream/stream`;
    const es = new EventSource(url);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        const metrics = [
          { label: "SOC", value: `${d.soc?.toFixed(1)}%`, color: C.green },
          { label: "Temp", value: `${d.temperature?.toFixed(1)}°C`, color: C.red },
          { label: "Voltage", value: `${d.voltage?.toFixed(1)}V`, color: C.blue },
          { label: "Current", value: `${d.current?.toFixed(1)}A`, color: C.yellow },
        ];
        const pick = metrics[Math.floor(Math.random() * metrics.length)];
        const entry: StreamEntry = {
          id: ++streamIdRef.current,
          time: fmtTime(new Date().toISOString()),
          label: pick.label,
          value: pick.value,
          color: pick.color,
        };
        setStreamLog((prev) => [entry, ...prev.slice(0, 49)]);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => { /* SSE may not be available, ignore */ };

    return () => { es.close(); };
  }, []);

  // ── Auto-refresh ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => fetchAll(), refreshRate * 1000);
    return () => clearInterval(id);
  }, [refreshRate, fetchAll]);

  // ── Device selection ───────────────────────────────────────────────────────

  const handleSelectDevice = (d: DeviceRow) => {
    setSelectedDevice(d);
    fetchDeviceTelemetry(d.id);
  };

  // ── Filtering / sorting / pagination ──────────────────────────────────────

  const sortHandle = (field: string) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = devices
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "soc") return (a.soc - b.soc) * dir;
      if (sortBy === "temperature") return (a.temperature - b.temperature) * dir;
      if (sortBy === "voltage") return (a.voltage - b.voltage) * dir;
      if (sortBy === "status") return a.status.localeCompare(b.status) * dir;
      if (sortBy === "healthScore") return (a.healthScore - b.healthScore) * dir;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const criticalDevices = devices
    .filter((d) => d.status === "WARNING" || d.status === "OFFLINE" || d.healthScore < 60 || d.temperature > 45 || d.soc < 15)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 8);

  const statusDist = [
    { name: "Online", value: fleet?.onlineDevices ?? 0, color: C.green },
    { name: "Offline", value: fleet?.offlineDevices ?? 0, color: C.sub },
    { name: "Warning", value: fleet?.warningDevices ?? 0, color: C.yellow },
  ].filter((d) => d.value > 0);

  // ── Telemetry chart data ───────────────────────────────────────────────────

  const chartData = telemetryHistory.map((r) => ({
    t: fmtTime(r.recordedAt),
    soc: r.soc,
    temp: r.temperature,
    volt: r.voltage,
    curr: r.current,
  }));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", flexDirection: "column", gap: 12 }}>
        <Radio size={36} style={{ color: C.blue, animation: "spin 2s linear infinite" }} />
        <p style={{ color: C.sub, fontSize: 14 }}>Initializing Live Monitor…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 24px", fontFamily: "inherit" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pulse color={C.green} />
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Live Monitor</h1>
            <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh: {refreshRate}s
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Refresh rate selector */}
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {REFRESH_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRefreshRate(r)}
                style={{
                  padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: refreshRate === r ? C.blue : "transparent",
                  color: refreshRate === r ? "#fff" : C.sub,
                }}
              >
                {r}s
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* ── Fleet KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total Devices" value={fleet?.totalDevices ?? 0} icon={<Battery size={20} />} color={C.blue} sub={`${fleet?.fleetHealthScore ?? 0}% fleet health`} />
        <KpiCard label="Online" value={fleet?.onlineDevices ?? 0} icon={<Wifi size={20} />} color={C.green} sub="Active now" />
        <KpiCard label="Offline" value={fleet?.offlineDevices ?? 0} icon={<WifiOff size={20} />} color={C.sub} sub={`${fleet?.warningDevices ?? 0} in warning`} />
        <KpiCard label="Critical Alerts" value={fleet?.criticalAlerts ?? 0} icon={<AlertTriangle size={20} />} color={C.red} sub={`${fleet?.totalActiveAlerts ?? 0} total active`} />
      </div>

      {/* ── Secondary KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Avg SOC", value: `${fleet?.avgSOC ?? 0}%`, color: C.green },
          { label: "Avg Temperature", value: `${fleet?.avgTemperature ?? 0}°C`, color: C.red },
          { label: "Avg Voltage", value: `${fleet?.avgVoltage ?? 0}V`, color: C.blue },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
            <span style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Main content: Device Table + Right sidebar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

        {/* Device Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 14, marginRight: 4 }}>
              Device Monitor
            </span>
            <span style={{ background: `${C.blue}20`, color: C.blue, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
              {filtered.length} devices
            </span>

            <div style={{ flex: 1 }} />

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.sub }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search device…"
                style={{ background: "#111B2E", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 10px 6px 28px", color: C.text, fontSize: 12, width: 160 }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.sub }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ background: "#111B2E", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 10px", color: C.text, fontSize: 12, cursor: "pointer" }}
            >
              <option value="ALL">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0A1020" }}>
                  {[
                    { key: "name", label: "Device" },
                    { key: "status", label: "Status" },
                    { key: "soc", label: "SOC" },
                    { key: "voltage", label: "Voltage" },
                    { key: "temperature", label: "Temp" },
                    { key: null, label: "Current" },
                    { key: "healthScore", label: "Health" },
                    { key: null, label: "Last Seen" },
                    { key: null, label: "Signal" },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={() => key && sortHandle(key)}
                      style={{ padding: "10px 12px", textAlign: "left", color: C.sub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, cursor: key ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {label}
                        {key && <SortIcon field={key} sortBy={sortBy} sortDir={sortDir} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: C.sub }}>No devices match the filter</td>
                  </tr>
                ) : paged.map((d) => {
                  const sig = signalLabel(d.lastSeen);
                  const isSelected = selectedDevice?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDevice(d)}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isSelected ? "rgba(68,138,255,0.08)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? "rgba(68,138,255,0.08)" : "transparent"; }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{d.name}</div>
                        <div style={{ color: C.sub, fontSize: 11 }}>{d.type}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: `${STATUS_COLOR[d.status] ?? C.sub}18`,
                          color: STATUS_COLOR[d.status] ?? C.sub,
                          padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[d.status] ?? C.sub }} />
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 4, background: C.dim, borderRadius: 2, minWidth: 50 }}>
                            <div style={{ height: "100%", width: `${d.soc}%`, background: d.soc < 20 ? C.red : d.soc < 40 ? C.yellow : C.green, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: d.soc < 20 ? C.red : d.soc < 40 ? C.yellow : C.green, fontWeight: 700, fontSize: 12, minWidth: 32 }}>{d.soc}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: C.blue, fontWeight: 600 }}>{d.voltage.toFixed(1)}V</td>
                      <td style={{ padding: "10px 12px", color: d.temperature > 45 ? C.red : d.temperature > 35 ? C.yellow : C.text, fontWeight: 600 }}>
                        {d.temperature.toFixed(1)}°C
                      </td>
                      <td style={{ padding: "10px 12px", color: C.yellow }}>{d.current.toFixed(1)}A</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: healthColor(d.healthScore), fontWeight: 700 }}>{d.healthScore}</span>
                        <span style={{ color: C.sub, fontSize: 11 }}>/100</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: C.sub, fontSize: 12 }}>{timeAgo(d.lastSeen)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: sig.color, fontSize: 12, fontWeight: 600 }}>{sig.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: C.sub, fontSize: 12 }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                      background: p === page ? C.blue : C.dim,
                      color: p === page ? "#fff" : C.sub,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Alert Feed + Critical Devices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Live Alert Feed */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", flex: "0 0 auto" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={C.red} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Live Alert Feed</span>
              {alerts.filter((a) => !a.isResolved).length > 0 && (
                <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginLeft: "auto" }}>
                  {alerts.filter((a) => !a.isResolved).length}
                </span>
              )}
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {alerts.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <CheckCircle size={24} style={{ color: C.green, margin: "0 auto 8px" }} />
                  <p style={{ color: C.sub, fontSize: 12 }}>No active alerts</p>
                </div>
              ) : alerts.slice(0, 15).map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${SEVERITY_COLOR[a.severity] ?? C.sub}`,
                    background: a.isResolved ? "transparent" : `${SEVERITY_COLOR[a.severity] ?? C.sub}08`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[a.severity] ?? C.sub }}>{a.severity}</span>
                      <span style={{ color: C.sub, fontSize: 10, marginLeft: 6 }}>{a.alertType}</span>
                    </div>
                    {a.isResolved && <CheckCircle size={11} color={C.green} />}
                  </div>
                  <p style={{ color: C.text, fontSize: 12, margin: "3px 0 2px" }}>{a.message}</p>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: C.sub, fontSize: 10 }}>{a.device?.deviceName ?? "Unknown"}</span>
                    <span style={{ color: C.sub, fontSize: 10 }}>{timeAgo(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Devices */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={14} color={C.yellow} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Devices Needing Attention</span>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {criticalDevices.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <CheckCircle size={24} style={{ color: C.green, margin: "0 auto 8px" }} />
                  <p style={{ color: C.sub, fontSize: 12 }}>All devices healthy</p>
                </div>
              ) : criticalDevices.map((d) => {
                const issues: string[] = [];
                if (d.soc < 15) issues.push("Low SOC");
                if (d.temperature > 45) issues.push("High Temp");
                if (d.status === "OFFLINE") issues.push("Offline");
                if (d.status === "WARNING") issues.push("Warning");
                if (d.healthScore < 60) issues.push("Poor Health");

                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDevice(d)}
                    style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0 }}>{d.name}</p>
                        <p style={{ color: C.sub, fontSize: 11, margin: "2px 0 0" }}>{d.type}</p>
                      </div>
                      <span style={{ color: healthColor(d.healthScore), fontSize: 14, fontWeight: 700 }}>{d.healthScore}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                      {issues.map((iss) => (
                        <span key={iss} style={{ background: `${C.red}18`, color: C.red, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3 }}>
                          {iss}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Device Detail Panel ── */}
      {selectedDevice && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Pulse color={STATUS_COLOR[selectedDevice.status] ?? C.sub} />
              <div>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{selectedDevice.name}</span>
                <span style={{ color: C.sub, fontSize: 12, marginLeft: 10 }}>{selectedDevice.type}</span>
              </div>
              <span style={{
                background: `${STATUS_COLOR[selectedDevice.status] ?? C.sub}20`,
                color: STATUS_COLOR[selectedDevice.status] ?? C.sub,
                fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5,
              }}>
                {selectedDevice.status}
              </span>
            </div>
            <button onClick={() => { setSelectedDevice(null); setTelemetryHistory([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
              {/* Stats */}
              <div>
                <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 12px" }}>Live Metrics</p>
                {[
                  { icon: <Battery size={14} />, label: "SOC", value: `${selectedDevice.soc}%`, color: selectedDevice.soc < 20 ? C.red : selectedDevice.soc < 40 ? C.yellow : C.green },
                  { icon: <Zap size={14} />, label: "Voltage", value: `${selectedDevice.voltage.toFixed(1)} V`, color: C.blue },
                  { icon: <Activity size={14} />, label: "Current", value: `${selectedDevice.current.toFixed(1)} A`, color: C.yellow },
                  { icon: <Thermometer size={14} />, label: "Temperature", value: `${selectedDevice.temperature.toFixed(1)} °C`, color: selectedDevice.temperature > 45 ? C.red : C.text },
                  { icon: <Activity size={14} />, label: "Health Score", value: `${selectedDevice.healthScore}/100`, color: healthColor(selectedDevice.healthScore) },
                  { icon: <AlertTriangle size={14} />, label: "Active Alerts", value: String(selectedDevice.activeAlerts), color: selectedDevice.activeAlerts > 0 ? C.red : C.green },
                  { icon: <Clock size={14} />, label: "Last Seen", value: timeAgo(selectedDevice.lastSeen), color: C.sub },
                  { icon: <Wifi size={14} />, label: "Signal", value: signalLabel(selectedDevice.lastSeen).label, color: signalLabel(selectedDevice.lastSeen).color },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub, fontSize: 12 }}>
                      <span style={{ color: C.dim }}>{icon}</span>{label}
                    </span>
                    <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div>
                {chartData.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.sub, fontSize: 13 }}>
                    <div style={{ textAlign: "center" }}>
                      <Activity size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                      <p>No telemetry history available</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    {[
                      { key: "soc", label: "SOC (%)", color: C.green, unit: "%" },
                      { key: "temp", label: "Temperature (°C)", color: C.red, unit: "°C" },
                      { key: "volt", label: "Voltage (V)", color: C.blue, unit: "V" },
                    ].map(({ key, label, color, unit }) => (
                      <div key={key}>
                        <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 8px" }}>{label}</p>
                        <ResponsiveContainer width="100%" height={110}>
                          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="t" tick={{ fill: C.sub, fontSize: 9 }} tickFormatter={(v) => v.slice(0, 5)} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: C.sub, fontSize: 9 }} />
                            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}${unit}`, label]} />
                            <Area type="monotone" dataKey={key} stroke={color} fill={`url(#g-${key})`} strokeWidth={2} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom row: SOC chart + Temp chart + Status distribution + Telemetry stream ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16, marginBottom: 16 }}>

        {/* SOC trend (all devices avg) */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>Fleet SOC Distribution</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))", gap: 8 }}>
            {devices.slice(0, 12).map((d) => (
              <div key={d.id} onClick={() => handleSelectDevice(d)} style={{ cursor: "pointer", textAlign: "center" }}>
                <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 4px" }}>
                  <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={24} cy={24} r={18} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
                    <circle cx={24} cy={24} r={18} fill="none"
                      stroke={d.soc < 20 ? C.red : d.soc < 40 ? C.yellow : C.green}
                      strokeWidth={5}
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - d.soc / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: d.soc < 20 ? C.red : d.soc < 40 ? C.yellow : C.green }}>{d.soc}%</span>
                  </div>
                </div>
                <p style={{ color: C.sub, fontSize: 9, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name.slice(0, 8)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Temperature heatmap */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>Temperature Status</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {devices.slice(0, 8).map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.sub, fontSize: 11, width: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{d.name}</span>
                <div style={{ flex: 1, height: 14, background: C.dim, borderRadius: 3, position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", inset: 0, width: `${Math.min((d.temperature / 60) * 100, 100)}%`,
                    background: d.temperature > 50 ? C.red : d.temperature > 40 ? C.yellow : d.temperature > 30 ? C.orange : C.green,
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <span style={{ color: d.temperature > 45 ? C.red : C.text, fontSize: 11, fontWeight: 700, width: 40, textAlign: "right", flexShrink: 0 }}>
                  {d.temperature.toFixed(0)}°C
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution donut */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>Status Distribution</p>
          {statusDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={3}>
                    {statusDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                {statusDist.map((d) => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                      {d.name}
                    </span>
                    <span style={{ color: d.color, fontWeight: 700, fontSize: 13 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: C.sub, fontSize: 12, textAlign: "center", paddingTop: 20 }}>No data</p>
          )}
        </div>
      </div>

      {/* ── Telemetry Stream Log ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Radio size={14} color={C.green} style={{ animation: "spin 3s linear infinite" }} />
          <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Live Telemetry Stream</span>
          <span style={{ background: `${C.green}20`, color: C.green, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>LIVE</span>
          <span style={{ color: C.sub, fontSize: 11, marginLeft: 4 }}>{streamLog.length} events received</span>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, maxHeight: 200, overflowY: "auto", padding: "8px 0" }}>
          {streamLog.length === 0 ? (
            <p style={{ color: C.sub, padding: "16px 18px", fontSize: 12 }}>Waiting for telemetry stream…</p>
          ) : streamLog.map((e) => (
            <div key={e.id} style={{ padding: "4px 18px", display: "flex", gap: 14, alignItems: "center", borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
              <span style={{ color: C.dim, minWidth: 64 }}>{e.time}</span>
              <span style={{ color: C.sub, minWidth: 50 }}>{e.label}</span>
              <span style={{ color: e.color, fontWeight: 700 }}>{e.value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        select option { background: #111B2E; color: #E8F0FF; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
