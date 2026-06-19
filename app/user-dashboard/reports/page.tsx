"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  FileText,
  Activity,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  ChevronDown,
  Zap,
  Battery,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { getMyDevices } from "@/services/deviceService";
import {
  getUserPerformanceReport,
  getUserTelemetryReport,
  getUserAlertReport,
  downloadUserCSV,
} from "@/services/reportService";

// ─── Constants ────────────────────────────────────────────────────────────────

type ReportType = "performance" | "telemetry" | "alerts" | "monthly";

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

const TABS: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: "performance", label: "Performance", icon: <Activity size={14} /> },
  { id: "telemetry", label: "Telemetry", icon: <Zap size={14} /> },
  { id: "alerts", label: "Alerts", icon: <AlertTriangle size={14} /> },
  { id: "monthly", label: "Monthly Summary", icon: <Calendar size={14} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmt(v: number | null | undefined, dec = 1) {
  if (v == null) return "—";
  return v.toFixed(dec);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMonthlyGroups(records: any[]) {
  const map: Record<string, { count: number; totalSOC: number; totalTemp: number; totalVoltage: number }> = {};
  for (const r of records ?? []) {
    const d = new Date(r.time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { count: 0, totalSOC: 0, totalTemp: 0, totalVoltage: 0 };
    map[key].count++;
    map[key].totalSOC += r.soc ?? 0;
    map[key].totalTemp += r.temperature ?? 0;
    map[key].totalVoltage += r.voltage ?? 0;
  }
  return Object.entries(map)
    .map(([month, v]) => ({
      month,
      avgSOC: +(v.totalSOC / v.count).toFixed(1),
      avgTemp: +(v.totalTemp / v.count).toFixed(1),
      avgVoltage: +(v.totalVoltage / v.count).toFixed(1),
      readings: v.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
  style: extraStyle,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
      {label}
    </p>
  );
}

function StatRow({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.sub, fontSize: 13 }}>{label}</span>
      <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
        {value}
        {unit && <span style={{ color: C.sub, fontWeight: 400, marginLeft: 3, fontSize: 12 }}>{unit}</span>}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.sub }}>
      <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <RefreshCw size={28} style={{ color: C.blue, animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Performance Report ────────────────────────────────────────────────────────

function PerformanceReport({ data }: { data: any }) {
  if (!data) return <EmptyState message="No performance data available." />;

  const score = data.healthScore ?? 0;
  const scoreColor = healthColor(score);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Device Info */}
      <Card>
        <SectionTitle label="Device Information" />
        <StatRow label="Device Name" value={data.device?.name ?? "—"} />
        <StatRow label="Device Type" value={data.device?.type ?? "—"} />
        <StatRow label="Status" value={data.device?.status ?? "—"} />
        <StatRow label="Battery Type" value={data.device?.batteryType ?? "—"} />
        <StatRow label="Capacity" value={fmt(data.device?.capacity, 1)} unit="kWh" />
        <StatRow label="Registered" value={data.device?.registeredAt ? new Date(data.device.registeredAt).toLocaleDateString() : "—"} />
      </Card>

      {/* Health Score */}
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <SectionTitle label="Battery Health Score" />
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
          <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={70} cy={70} r={56} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
            <circle
              cx={70} cy={70} r={56} fill="none"
              stroke={scoreColor} strokeWidth={12}
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>{score}</span>
            <span style={{ fontSize: 11, color: C.sub }}>/ 100</span>
          </div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: scoreColor }}>{healthLabel(score)}</span>
        <span style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Battery health status</span>
      </Card>

      {/* Current Readings */}
      <Card>
        <SectionTitle label="Current Readings" />
        <StatRow label="State of Charge" value={fmt(data.current?.soc)} unit="%" />
        <StatRow label="Voltage" value={fmt(data.current?.voltage)} unit="V" />
        <StatRow label="Temperature" value={fmt(data.current?.temperature)} unit="°C" />
        <StatRow label="Current" value={fmt(data.current?.current)} unit="A" />
      </Card>

      {/* Period Stats */}
      <Card>
        <SectionTitle label="Period Statistics" />
        <StatRow label="Avg SOC" value={fmt(data.periodStats?.avgSOC)} unit="%" />
        <StatRow label="Avg Voltage" value={fmt(data.periodStats?.avgVoltage)} unit="V" />
        <StatRow label="Avg Temperature" value={fmt(data.periodStats?.avgTemperature)} unit="°C" />
        <StatRow label="Avg Current" value={fmt(data.periodStats?.avgCurrent)} unit="A" />
        <StatRow label="Max Temperature" value={fmt(data.periodStats?.maxTemperature)} unit="°C" />
        <StatRow label="Min SOC" value={fmt(data.periodStats?.minSOC)} unit="%" />
        <StatRow label="Total Readings" value={data.periodStats?.totalReadings ?? 0} />
      </Card>

      {/* Alert Summary */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionTitle label="Alert Summary" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { label: "Critical", value: data.alertSummary?.critical ?? 0, color: C.red },
            { label: "Warning", value: data.alertSummary?.warning ?? 0, color: C.yellow },
            { label: "Info", value: data.alertSummary?.info ?? 0, color: C.blue },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
                borderRadius: 10,
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{label} Alerts</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Telemetry Report ──────────────────────────────────────────────────────────

function TelemetryReport({ data }: { data: any }) {
  if (!data || !data.records?.length) return <EmptyState message="No telemetry data for the selected period." />;

  const records: any[] = [...(data.records ?? [])].reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* SOC trend */}
      <Card>
        <SectionTitle label="State of Charge Trend" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tSOC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fill: C.sub, fontSize: 10 }} tickFormatter={(v) => v.slice(0, 10)} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.sub, fontSize: 10 }} domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="soc" name="SOC (%)" stroke={C.green} fill="url(#tSOC)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Voltage + Temperature */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle label="Voltage Trend" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tVolt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: C.sub, fontSize: 10 }} tickFormatter={(v) => v.slice(5, 10)} interval="preserveStartEnd" />
              <YAxis tick={{ fill: C.sub, fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="voltage" name="Voltage (V)" stroke={C.blue} fill="url(#tVolt)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle label="Temperature Trend" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: C.sub, fontSize: 10 }} tickFormatter={(v) => v.slice(5, 10)} interval="preserveStartEnd" />
              <YAxis tick={{ fill: C.sub, fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke={C.red} fill="url(#tTemp)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <SectionTitle label={`Telemetry Records (${data.records?.length ?? 0})`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Time", "SOC (%)", "Voltage (V)", "Current (A)", "Temp (°C)", "Capacity"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "8px 12px", color: C.sub, fontSize: 12 }}>{fmtDate(r.time)}</td>
                  <td style={{ padding: "8px 12px", color: C.green, fontWeight: 600 }}>{fmt(r.soc)}</td>
                  <td style={{ padding: "8px 12px", color: C.blue }}>{fmt(r.voltage)}</td>
                  <td style={{ padding: "8px 12px", color: C.yellow }}>{fmt(r.current)}</td>
                  <td style={{ padding: "8px 12px", color: r.temperature > 45 ? C.red : C.text }}>{fmt(r.temperature)}</td>
                  <td style={{ padding: "8px 12px", color: C.sub }}>{fmt(r.capacity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length > 50 && (
            <p style={{ color: C.sub, fontSize: 12, textAlign: "center", marginTop: 10 }}>Showing 50 of {records.length} records. Export CSV for full data.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Alerts Report ─────────────────────────────────────────────────────────────

function AlertsReport({ data }: { data: any }) {
  if (!data || !data.alerts?.length) return <EmptyState message="No alerts for the selected period." />;

  const pieData = [
    { name: "Critical", value: data.summary?.critical ?? 0, color: C.red },
    { name: "Warning", value: data.summary?.warning ?? 0, color: C.yellow },
    { name: "Info", value: data.summary?.info ?? 0, color: C.blue },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle label="Alert Breakdown" />
          {pieData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                      {d.name}
                    </span>
                    <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 20 }}>No alerts</p>
          )}
        </Card>

        <Card>
          <SectionTitle label="Summary" />
          <StatRow label="Total Alerts" value={data.summary?.total ?? 0} />
          <StatRow label="Critical" value={data.summary?.critical ?? 0} />
          <StatRow label="Warning" value={data.summary?.warning ?? 0} />
          <StatRow label="Info" value={data.summary?.info ?? 0} />
        </Card>
      </div>

      {/* Alert table */}
      <Card>
        <SectionTitle label={`Alert List (${data.alerts?.length ?? 0})`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Date", "Type", "Severity", "Message", "Resolved", "Acknowledged"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.alerts.map((a: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "8px 12px", color: C.sub, fontSize: 12 }}>{fmtDate(a.createdAt)}</td>
                  <td style={{ padding: "8px 12px", color: C.text, fontSize: 12 }}>{a.alertType}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      background: `${SEVERITY_COLOR[a.severity] ?? C.sub}20`,
                      color: SEVERITY_COLOR[a.severity] ?? C.sub,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {a.severity}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: C.text, maxWidth: 300 }}>{a.message}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {a.isResolved
                      ? <CheckCircle size={14} color={C.green} />
                      : <XCircle size={14} color={C.dim} />}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {a.isAcknowledged
                      ? <CheckCircle size={14} color={C.blue} />
                      : <XCircle size={14} color={C.dim} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Monthly Summary ───────────────────────────────────────────────────────────

function MonthlyReport({ telemetryData }: { telemetryData: any }) {
  if (!telemetryData || !telemetryData.records?.length) return <EmptyState message="No telemetry data for monthly summary. Try a wider date range." />;

  const monthly = buildMonthlyGroups(telemetryData.records);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle label="Monthly Avg SOC (%)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: C.sub, fontSize: 11 }} />
              <YAxis tick={{ fill: C.sub, fontSize: 11 }} domain={[0, 100]} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgSOC" name="Avg SOC (%)" fill={C.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle label="Monthly Avg Temperature (°C)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: C.sub, fontSize: 11 }} />
              <YAxis tick={{ fill: C.sub, fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTemp" name="Avg Temp (°C)" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle label="Monthly Summary Table" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Month", "Avg SOC (%)", "Avg Voltage (V)", "Avg Temp (°C)", "Readings"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 16px", color: C.text, fontWeight: 600 }}>{m.month}</td>
                  <td style={{ padding: "10px 16px", color: C.green }}>{m.avgSOC}</td>
                  <td style={{ padding: "10px 16px", color: C.blue }}>{m.avgVoltage}</td>
                  <td style={{ padding: "10px 16px", color: m.avgTemp > 45 ? C.red : C.text }}>{m.avgTemp}</td>
                  <td style={{ padding: "10px 16px", color: C.sub }}>{m.readings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserReportsPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ReportType>("performance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [severity, setSeverity] = useState("");

  const [perfData, setPerfData] = useState<any>(null);
  const [telData, setTelData] = useState<any>(null);
  const [alertData, setAlertData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // Load user's devices
  useEffect(() => {
    getMyDevices()
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setDevices(list);
        if (list.length > 0) setDeviceId(list[0].deviceId);
      })
      .catch(() => setError("Failed to load devices."));
  }, []);

  const fetchData = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    setGenerated(false);

    const filters = { deviceId, from: from || undefined, to: to || undefined };

    try {
      if (activeTab === "performance") {
        const res = await getUserPerformanceReport(filters);
        setPerfData((res as any)?.data ?? null);
      } else if (activeTab === "telemetry") {
        const res = await getUserTelemetryReport({ ...filters, limit: 200 });
        setTelData((res as any)?.data ?? null);
      } else if (activeTab === "alerts") {
        const res = await getUserAlertReport({ ...filters, severity: severity || undefined });
        setAlertData((res as any)?.data ?? null);
      } else if (activeTab === "monthly") {
        // Monthly summary uses telemetry with a wider range
        const res = await getUserTelemetryReport({ ...filters, limit: 500 });
        setTelData((res as any)?.data ?? null);
      }
      setGenerated(true);
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [deviceId, activeTab, from, to, severity]);

  // Auto-generate when tab or device changes
  useEffect(() => {
    if (deviceId) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, deviceId]);

  const handleExport = async () => {
    if (!deviceId) return;
    const exportType = (activeTab === "monthly" ? "telemetry" : activeTab) as "performance" | "telemetry" | "alerts";
    setExporting(true);
    try {
      await downloadUserCSV(exportType, {
        deviceId,
        from: from || undefined,
        to: to || undefined,
        severity: severity || undefined,
      });
    } catch {
      setError("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const selectedDevice = devices.find((d) => d.deviceId === deviceId);
  const canExport = activeTab !== "monthly" && generated && !loading && !!deviceId;

  if (devices.length === 0 && !error) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: C.sub, marginTop: 80 }}>
        <Battery size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
        <p style={{ fontSize: 16, color: C.text }}>No devices assigned to your account.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Contact your administrator to get a device assigned.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", minHeight: "100vh", background: "#080F1E" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>My Battery Reports</h1>
          <p style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>
            {selectedDevice ? `${selectedDevice.deviceName} · ${selectedDevice.device?.deviceType ?? selectedDevice.batteryType ?? "Battery"}` : "Select a device to get started"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchData}
            disabled={loading || !deviceId}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
              background: "transparent", color: C.sub, cursor: "pointer", fontSize: 13,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport || exporting}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: canExport ? C.blue : C.dim, color: "#fff",
              cursor: canExport ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600,
              opacity: canExport ? 1 : 0.5,
            }}
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        {/* Device selector */}
        {devices.length > 1 && (
          <div>
            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>DEVICE</label>
            <div style={{ position: "relative" }}>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                style={{
                  appearance: "none", background: "#111B2E", border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "8px 32px 8px 12px", color: C.text, fontSize: 13,
                  cursor: "pointer", minWidth: 200,
                }}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.deviceName}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.sub, pointerEvents: "none" }} />
            </div>
          </div>
        )}

        {/* From */}
        <div>
          <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>FROM</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              background: "#111B2E", border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", color: C.text, fontSize: 13,
            }}
          />
        </div>

        {/* To */}
        <div>
          <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>TO</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              background: "#111B2E", border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 12px", color: C.text, fontSize: 13,
            }}
          />
        </div>

        {/* Severity — only for alerts tab */}
        {activeTab === "alerts" && (
          <div>
            <label style={{ display: "block", color: C.sub, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>SEVERITY</label>
            <div style={{ position: "relative" }}>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{
                  appearance: "none", background: "#111B2E", border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "8px 32px 8px 12px", color: C.text, fontSize: 13, cursor: "pointer",
                }}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.sub, pointerEvents: "none" }} />
            </div>
          </div>
        )}

        <button
          onClick={fetchData}
          disabled={loading || !deviceId}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: C.green, color: "#000", fontWeight: 700, fontSize: 13,
            cursor: deviceId ? "pointer" : "not-allowed", opacity: deviceId ? 1 : 0.5,
          }}
        >
          Generate Report
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: activeTab === tab.id ? "#1A2B4A" : "transparent",
              color: activeTab === tab.id ? C.text : C.sub,
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: 13, cursor: "pointer",
              boxShadow: activeTab === tab.id ? `inset 0 0 0 1px ${C.border}` : "none",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: C.red, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Report content */}
      <div>
        {loading ? (
          <Spinner />
        ) : activeTab === "performance" ? (
          <PerformanceReport data={perfData} />
        ) : activeTab === "telemetry" ? (
          <TelemetryReport data={telData} />
        ) : activeTab === "alerts" ? (
          <AlertsReport data={alertData} />
        ) : (
          <MonthlyReport telemetryData={telData} />
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #111B2E; color: #E8F0FF; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
      `}</style>
    </div>
  );
}
