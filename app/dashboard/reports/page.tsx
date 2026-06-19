"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  FileText,
  RefreshCw,
  Server,
  AlertTriangle,
  ShieldCheck,
  Users,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";

import {
  getFleetReport,
  getDeviceReport,
  getAlertReport,
  getBatteryHealthReport,
  getAuditReport,
  downloadCSV,
} from "@/services/reportService";
import { getDevices } from "@/services/deviceService";

// ─── Constants ───────────────────────────────────────────────────────────────

type ReportType = "fleet" | "devices" | "alerts" | "battery-health" | "audit";

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

const REPORT_TABS: { key: ReportType; label: string; icon: React.ReactNode }[] = [
  { key: "fleet", label: "Fleet Summary", icon: <LayoutGrid size={13} /> },
  { key: "devices", label: "Device Report", icon: <Server size={13} /> },
  { key: "alerts", label: "Alert Report", icon: <AlertTriangle size={13} /> },
  { key: "battery-health", label: "Battery Health", icon: <ShieldCheck size={13} /> },
  { key: "audit", label: "User Activity", icon: <Users size={13} /> },
];

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: C.red,
  WARNING: C.yellow,
  INFO: C.blue,
};

const STATUS_COLOR: Record<string, string> = {
  ONLINE: C.green,
  OFFLINE: C.red,
  WARNING: C.yellow,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, opts);
}

function fmtDate(iso: string | null | undefined) {
  return fmt(iso, { dateStyle: "medium" });
}

function healthColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  return C.red;
}

function healthLabel(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Warning";
  return "Critical";
}

// Default date range: last 30 days
function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">{children}</table>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`py-2 px-3 font-medium whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      style={{ color: C.dim, borderBottom: `1px solid ${C.border}` }}
    >
      {children}
    </th>
  );
}

function Td({ children, right, color }: { children: React.ReactNode; right?: boolean; color?: string }) {
  return (
    <td
      className={`py-3 px-3 ${right ? "text-right" : "text-left"}`}
      style={{ color: color ?? C.text, borderBottom: `1px solid rgba(255,255,255,0.03)` }}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? C.sub;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color }}
    >
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLOR[severity] ?? C.sub;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color }}
    >
      {severity}
    </span>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = healthColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-semibold" style={{ color }}>{score}%</span>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
    >
      <span className="text-sm" style={{ color: C.sub }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: color ?? C.text }}>{value}</span>
    </div>
  );
}

function EmptyTable({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-xs" style={{ color: C.dim }}>
      <FileText size={16} className="mr-2" />
      {message}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {count !== undefined && (
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: C.sub }}>
          {count} records
        </span>
      )}
    </div>
  );
}

// ─── Report Sections ──────────────────────────────────────────────────────────

function FleetReport({ data }: { data: any }) {
  if (!data) return <EmptyTable message="Generate report to view fleet summary" />;

  const metrics = [
    { label: "Total Devices", value: data.totalDevices, color: C.text },
    { label: "Online Devices", value: data.onlineDevices, color: C.green },
    { label: "Offline Devices", value: data.offlineDevices, color: C.red },
    { label: "Warning Devices", value: data.warningDevices, color: C.yellow },
    { label: "Total Active Alerts", value: data.totalActiveAlerts, color: C.red },
    { label: "Critical Alerts", value: data.criticalAlerts, color: C.red },
    { label: "Warning Alerts", value: data.warningAlerts, color: C.yellow },
    { label: "Total Capacity", value: `${data.totalCapacityMWh} MWh`, color: C.blue },
    { label: "Average SOC", value: `${data.avgSOC}%`, color: C.green },
    { label: "Average Temperature", value: `${data.avgTemperature}°C`, color: C.yellow },
    { label: "Average Voltage", value: `${data.avgVoltage}V`, color: C.blue },
    { label: "Fleet Health Score", value: `${data.fleetHealthScore}%`, color: healthColor(data.fleetHealthScore) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: metrics */}
      <Card>
        <SectionHeader title="Fleet Overview" />
        <div>
          {metrics.slice(0, 6).map((m) => (
            <MetricRow key={m.label} label={m.label} value={m.value} color={m.color} />
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Performance Metrics" />
        <div>
          {metrics.slice(6).map((m) => (
            <MetricRow key={m.label} label={m.label} value={m.value} color={m.color} />
          ))}
        </div>
      </Card>

      {/* Status breakdown */}
      <Card className="lg:col-span-2">
        <SectionHeader title="Device Status Breakdown" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Online", value: data.onlineDevices, color: C.green, pct: Math.round((data.onlineDevices / Math.max(data.totalDevices, 1)) * 100) },
            { label: "Offline", value: data.offlineDevices, color: C.red, pct: Math.round((data.offlineDevices / Math.max(data.totalDevices, 1)) * 100) },
            { label: "Warning", value: data.warningDevices, color: C.yellow, pct: Math.round((data.warningDevices / Math.max(data.totalDevices, 1)) * 100) },
            { label: "Total", value: data.totalDevices, color: C.text, pct: 100 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
              <p className="text-xs mb-1" style={{ color: C.dim }}>{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs mt-1" style={{ color: C.sub }}>{item.pct}% of fleet</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DevicesReport({ data }: { data: any[] }) {
  if (!data.length) return <EmptyTable message="No devices found for selected filters" />;
  return (
    <Card>
      <SectionHeader title="Device Report" count={data.length} />
      <TableWrap>
        <thead>
          <tr>
            <Th>Device</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th right>SOC</Th>
            <Th right>Voltage</Th>
            <Th right>Temp</Th>
            <Th right>Capacity</Th>
            <Th>Battery Type</Th>
            <Th>Assigned To</Th>
            <Th right>Alerts</Th>
            <Th right>Health</Th>
            <Th>Last Seen</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <Td><span className="font-medium text-white">{d.name}</span></Td>
              <Td color={C.sub}>{d.type}</Td>
              <Td><StatusBadge status={d.status} /></Td>
              <Td right color={d.soc >= 60 ? C.green : d.soc >= 30 ? C.yellow : C.red}>{d.soc.toFixed(1)}%</Td>
              <Td right>{d.voltage.toFixed(1)}V</Td>
              <Td right color={d.temperature > 45 ? C.red : d.temperature > 35 ? C.yellow : C.text}>{d.temperature.toFixed(1)}°C</Td>
              <Td right>{d.capacity} kWh</Td>
              <Td color={C.sub}>{d.batteryType?.replace(/_/g, " ") ?? "—"}</Td>
              <Td color={C.sub}>{d.assignedTo ?? "—"}</Td>
              <Td right color={d.activeAlerts > 0 ? C.red : C.green}>{d.activeAlerts}</Td>
              <Td right><HealthBar score={d.healthScore} /></Td>
              <Td color={C.dim}>{fmtDate(d.lastSeen)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

function AlertsReport({ data }: { data: any[] }) {
  if (!data.length) return <EmptyTable message="No alerts found for selected filters" />;
  return (
    <Card>
      <SectionHeader title="Alert Report" count={data.length} />
      <TableWrap>
        <thead>
          <tr>
            <Th>Date & Time</Th>
            <Th>Device</Th>
            <Th>Alert Type</Th>
            <Th>Severity</Th>
            <Th>Message</Th>
            <Th>Status</Th>
            <Th>Resolved By</Th>
            <Th>Acknowledged By</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id}>
              <Td color={C.sub}>{fmt(a.createdAt)}</Td>
              <Td><span className="font-medium text-white">{a.device?.deviceName ?? "—"}</span></Td>
              <Td color={C.sub}>{a.alertType.replace(/_/g, " ")}</Td>
              <Td><SeverityBadge severity={a.severity} /></Td>
              <Td color={C.sub}><span className="max-w-[200px] block truncate">{a.message}</span></Td>
              <Td>
                {a.isResolved ? (
                  <span className="text-xs" style={{ color: C.green }}>Resolved</span>
                ) : a.isAcknowledged ? (
                  <span className="text-xs" style={{ color: C.yellow }}>Acknowledged</span>
                ) : (
                  <span className="text-xs" style={{ color: C.red }}>Active</span>
                )}
              </Td>
              <Td color={C.sub}>{a.resolvedBy?.fullName ?? "—"}</Td>
              <Td color={C.sub}>{a.acknowledgedBy?.fullName ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

function BatteryHealthReport({ data }: { data: any[] }) {
  if (!data.length) return <EmptyTable message="No device data available" />;
  return (
    <Card>
      <SectionHeader title="Battery Health Report" count={data.length} />
      <TableWrap>
        <thead>
          <tr>
            <Th>Device</Th>
            <Th>Status</Th>
            <Th right>SOC</Th>
            <Th right>Voltage</Th>
            <Th right>Temperature</Th>
            <Th right>Total Alerts</Th>
            <Th right>Health Score</Th>
            <Th>Condition</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <Td><span className="font-medium text-white">{d.name}</span></Td>
              <Td><StatusBadge status={d.status} /></Td>
              <Td right color={d.soc >= 60 ? C.green : d.soc >= 30 ? C.yellow : C.red}>{d.soc.toFixed(1)}%</Td>
              <Td right>{d.voltage.toFixed(1)}V</Td>
              <Td right color={d.temperature > 45 ? C.red : d.temperature > 35 ? C.yellow : C.text}>{d.temperature.toFixed(1)}°C</Td>
              <Td right color={d.totalAlerts > 0 ? C.red : C.green}>{d.totalAlerts}</Td>
              <Td right><HealthBar score={d.healthScore} /></Td>
              <Td>
                <span className="text-xs font-medium" style={{ color: healthColor(d.healthScore) }}>
                  {healthLabel(d.healthScore)}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

function AuditReport({ data }: { data: any[] }) {
  if (!data.length) return <EmptyTable message="No audit logs found for selected filters" />;
  return (
    <Card>
      <SectionHeader title="User Activity Report" count={data.length} />
      <TableWrap>
        <thead>
          <tr>
            <Th>Date & Time</Th>
            <Th>User</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Action</Th>
            <Th>Entity</Th>
            <Th>IP Address</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => (
            <tr key={log.id}>
              <Td color={C.sub}>{fmt(log.createdAt)}</Td>
              <Td><span className="font-medium text-white">{log.user?.fullName ?? "—"}</span></Td>
              <Td color={C.sub}>{log.user?.email ?? "—"}</Td>
              <Td>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: log.user?.role === "ADMIN" ? "rgba(171,71,188,0.15)" : "rgba(68,138,255,0.12)",
                    color: log.user?.role === "ADMIN" ? C.purple : C.blue,
                  }}
                >
                  {log.user?.role ?? "—"}
                </span>
              </Td>
              <Td color={C.sub}>{log.action.replace(/_/g, " ")}</Td>
              <Td color={C.sub}>{log.entity}</Td>
              <Td color={C.dim}>{log.ipAddress ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("fleet");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [deviceId, setDeviceId] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deviceList, setDeviceList] = useState<{ id: string; name: string }[]>([]);

  // Report data per type
  const [fleetData, setFleetData] = useState<any>(null);
  const [devicesData, setDevicesData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);

  // Load device list for selector
  useEffect(() => {
    getDevices({ limit: 200 })
      .then((res) => {
        const list = (res?.data ?? []).map((d: any) => ({ id: d.id, name: d.deviceName }));
        setDeviceList(list);
      })
      .catch(() => {});
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
        deviceId: deviceId || undefined,
        severity: severity || undefined,
        status: status || undefined,
      };

      if (reportType === "fleet") {
        const res = await getFleetReport();
        setFleetData(res?.data ?? null);
      } else if (reportType === "devices") {
        const res = await getDeviceReport({ deviceId: filters.deviceId, status: filters.status });
        setDevicesData(res?.data ?? []);
      } else if (reportType === "alerts") {
        const res = await getAlertReport({ from: filters.from, to: filters.to, deviceId: filters.deviceId, severity: filters.severity });
        setAlertsData(res?.data ?? []);
      } else if (reportType === "battery-health") {
        const res = await getBatteryHealthReport();
        setHealthData(res?.data ?? []);
      } else if (reportType === "audit") {
        const res = await getAuditReport({ from: filters.from, to: filters.to });
        setAuditData(res?.data ?? []);
      }
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [reportType, from, to, deviceId, severity, status]);

  // Auto-generate on mount and type change
  useEffect(() => { generate(); }, [generate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
        deviceId: deviceId || undefined,
        severity: severity || undefined,
        status: status || undefined,
      };
      await downloadCSV(reportType, filters);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Reports</h1>
          <p className="text-xs mt-0.5" style={{ color: C.dim }}>
            Generate, view and export system reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: "rgba(0,230,118,0.1)", color: C.green }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Generating…" : "Generate"}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: "rgba(68,138,255,0.1)", color: C.blue }}
          >
            <Download size={12} />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── Report Type Tabs ── */}
      <div className="flex gap-1 flex-wrap" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {REPORT_TABS.map((tab) => {
          const active = reportType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: active ? C.green : C.sub,
                borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-end gap-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        {/* Date From */}
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: C.dim }}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: C.dim }}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
          />
        </div>

        {/* Device selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: C.dim }}>Device</label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs text-white outline-none appearance-none min-w-[160px]"
            style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
          >
            <option value="">All Devices</option>
            {deviceList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status — shown for device report */}
        {(reportType === "devices" || reportType === "battery-health") && (
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: C.dim }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs text-white outline-none appearance-none"
              style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
            >
              <option value="">All</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        )}

        {/* Severity — shown for alert report */}
        {reportType === "alerts" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: C.dim }}>Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs text-white outline-none appearance-none"
              style={{ background: "#0A1020", border: `1px solid ${C.border}` }}
            >
              <option value="">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ background: C.green, color: "#050B18" }}
        >
          {loading ? "Loading…" : "Generate Report"}
        </button>
      </div>

      {/* ── Report Content ── */}
      {loading ? (
        <div
          className="rounded-2xl flex items-center justify-center py-20 text-sm animate-pulse"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.dim }}
        >
          Generating report…
        </div>
      ) : (
        <>
          {reportType === "fleet" && <FleetReport data={fleetData} />}
          {reportType === "devices" && <DevicesReport data={devicesData} />}
          {reportType === "alerts" && <AlertsReport data={alertsData} />}
          {reportType === "battery-health" && <BatteryHealthReport data={healthData} />}
          {reportType === "audit" && <AuditReport data={auditData} />}
        </>
      )}

      {/* ── Export Footer ── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div>
          <p className="text-sm font-semibold text-white">Export Report</p>
          <p className="text-xs mt-0.5" style={{ color: C.dim }}>
            Download the current report view as CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: C.blue, color: "#fff" }}
          >
            <Download size={13} />
            {exporting ? "Exporting…" : `Export ${REPORT_TABS.find((t) => t.key === reportType)?.label} CSV`}
          </button>
        </div>
      </div>
    </div>
  );
}
