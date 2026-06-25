"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import StatCard from "@/components/dashboard/StatCard";
import AlertBadge from "@/components/dashboard/alerts/AlertBadge";
import AlertDetailsDrawer from "@/components/dashboard/alerts/AlertDetailsDrawer";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getDevices } from "@/services/deviceService";
import {
  acknowledgeAlert,
  deleteAlert,
  getAlerts,
  getAlertStats,
  getRecentAlerts,
  resolveAlert,
} from "@/services/alertService";
import Button from "@/components/ui/Button";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";

type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
type ChartRange = "daily" | "weekly" | "monthly";
type ChartType = "line" | "bar";

const severityColors: Record<string, string> = {
  CRITICAL: "#FF5252",
  WARNING: "#FFB300",
  INFO: "#448AFF",
};

const limit = 30;

export default function AlertsPage() {
  const { options, loading: optionsLoading } = useDropdownOptions();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [alertToDelete, setAlertToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("daily");
  const [chartType, setChartType] = useState<ChartType>("line");

  const loadAlerts = async (pageNumber = page) => {
    try {
      setLoading(true);

      const res = await getAlerts({
        page: pageNumber,
        limit,
        search: search.trim(),
        severity: severityFilter === "All" ? undefined : severityFilter,
        status: statusFilter === "All" ? undefined : statusFilter,
        deviceId: deviceFilter,
        from: fromDate,
        to: toDate,
      });

      setAlerts(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalAlerts(res.pagination?.total || 0);
      setPage(pageNumber);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getAlertStats();
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRecentAlerts = async () => {
    try {
      const res = await getRecentAlerts(8);
      setRecentAlerts(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await getDevices({ page: 1, limit: 100 });
        setDevices(res.data || res.devices || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadDevices();
    loadStats();
    loadRecentAlerts();

    const timer = window.setInterval(loadRecentAlerts, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAlerts(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, severityFilter, statusFilter, deviceFilter, fromDate, toDate]);

  const cards = useMemo(
    () => [
      {
        title: "Total Alerts",
        value: stats?.totalAlerts ?? totalAlerts,
        color: "#448AFF",
        icon: <Bell size={13} style={{ color: "#448AFF" }} />,
      },
      {
        title: "Active Alerts",
        value: stats?.activeAlerts ?? 0,
        color: "#FF5252",
        icon: <AlertTriangle size={13} style={{ color: "#FF5252" }} />,
      },
      {
        title: "Critical Alerts",
        value: stats?.criticalAlerts ?? 0,
        color: "#FF5252",
        icon: <AlertTriangle size={13} style={{ color: "#FF5252" }} />,
      },
      {
        title: "Warning Alerts",
        value: stats?.warningAlerts ?? 0,
        color: "#FFB300",
        icon: <AlertTriangle size={13} style={{ color: "#FFB300" }} />,
      },
      {
        title: "Resolved Alerts",
        value: stats?.resolvedAlerts ?? 0,
        color: "#00E676",
        icon: <CheckCircle2 size={13} style={{ color: "#00E676" }} />,
      },
      {
        title: "Acknowledged",
        value: stats?.acknowledgedAlerts ?? 0,
        color: "#FFB300",
        icon: <CheckCircle2 size={13} style={{ color: "#FFB300" }} />,
      },
    ],
    [stats, totalAlerts],
  );

  const trendData = useMemo(
    () => aggregateTrend(stats?.trend || [], chartRange),
    [stats, chartRange],
  );

  const refreshAfterAction = async () => {
    await Promise.all([loadAlerts(page), loadStats(), loadRecentAlerts()]);
  };

  const handleAcknowledge = async (alert: any) => {
    await acknowledgeAlert(alert.id);
    await refreshAfterAction();
  };

  const handleResolve = async (alert: any) => {
    await resolveAlert(alert.id);
    await refreshAfterAction();
  };

  const handleDelete = async (alert: any) => {
    setAlertToDelete(alert);
  };

  const confirmDelete = async () => {
    if (!alertToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteAlert(alertToDelete.id);
      if (selectedAlert?.id === alertToDelete.id) {
        setSelectedAlert(null);
      }
      setAlertToDelete(null);
      await refreshAfterAction();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportRows = alerts.map((alert) => ({
    "Alert ID": formatAlertId(alert.id),
    Device: alert.device?.deviceName || "--",
    "Serial Number": alert.device?.serialNumber || "--",
    "Alert Type": formatType(alert.alertType),
    Severity: alert.severity,
    Message: alert.message,
    Time: formatDateTime(alert.createdAt),
    Status: getStatus(alert),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm mt-1 text-[#8899BB]">
            Monitor, acknowledge, resolve, and export battery alerts
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-[#0C1426] p-2">
          <ExportButton
            icon={<Download size={15} />}
            label="CSV"
            tone="csv"
            onClick={() => exportCsv(exportRows)}
          />
          <ExportButton
            icon={<FileSpreadsheet size={15} />}
            label="Excel"
            tone="excel"
            onClick={() => exportExcel(exportRows)}
          />
          <ExportButton
            icon={<FileText size={15} />}
            label="PDF"
            tone="pdf"
            onClick={() => exportPdf(exportRows)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtext="Current fleet"
            subtextColor={card.color}
            icon={card.icon}
            iconBg={`${card.color}1F`}
          />
        ))}
      </div>

      <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5A7A]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search device, serial number, alert ID..."
              className="h-10 w-full rounded-lg bg-[#09111F] border border-white/10 pl-9 pr-3 text-sm text-white outline-none"
            />
          </div>

          <Select value={severityFilter} onChange={setSeverityFilter} disabled={optionsLoading}>
            <option value="All">All Severities</option>
            {options.alertSeverities.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Select value={statusFilter} onChange={setStatusFilter} disabled={optionsLoading}>
            <option value="All">All Status</option>
            {options.alertStatuses.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          {/* <Select value={deviceFilter} onChange={setDeviceFilter}>
            <option value="">All Devices</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.deviceName}
              </option>
            ))}
          </Select> */}

          <div className="flex gap-3">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 rounded-lg bg-[#09111F] border border-white/10 px-3 text-sm text-white outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 rounded-lg bg-[#09111F] border border-white/10 px-3 text-sm text-white outline-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Alert Table</h2>
          <span className="text-xs text-[#8899BB]">Showing {alerts.length} of {totalAlerts}</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#4A5A7A]">
                <th className="text-left py-3 px-4">Alert ID</th>
                <th className="text-left py-3 px-4">Device</th>
                <th className="text-left py-3 px-4">Alert Type</th>
                <th className="text-left py-3 px-4">Severity</th>
                <th className="text-left py-3 px-4">Message</th>
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8899BB]">
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8899BB]">
                    No alerts found
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white font-medium">{formatAlertId(alert.id)}</td>
                    <td className="py-4 px-4">
                      <p className="text-white font-medium">{alert.device?.deviceName || "--"}</p>
                      <p className="text-xs text-[#4A5A7A]">{alert.device?.serialNumber || "--"}</p>
                    </td>
                    <td className="py-4 px-4 text-white">{formatType(alert.alertType)}</td>
                    <td className="py-4 px-4">
                      <AlertBadge
                        label={alert.severity}
                        tone={alert.severity === "CRITICAL" ? "critical" : alert.severity === "WARNING" ? "warning" : "info"}
                      />
                    </td>
                    <td className="py-4 px-4 text-[#C7D2EA] max-w-[260px] truncate">{alert.message}</td>
                    <td className="py-4 px-4 text-[#8899BB]">{formatDateTime(alert.createdAt)}</td>
                    <td className="py-4 px-4">
                      <AlertBadge label={getStatus(alert)} tone={getStatusTone(alert)} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <IconButton label="View Details" onClick={() => setSelectedAlert(alert)}>
                          <Eye size={14} />
                        </IconButton>
                        <IconButton
                          label="Acknowledge"
                          disabled={alert.isAcknowledged || alert.isResolved}
                          onClick={() => handleAcknowledge(alert)}
                        >
                          <Check size={14} />
                        </IconButton>
                        <IconButton
                          label="Resolve"
                          disabled={alert.isResolved}
                          onClick={() => handleResolve(alert)}
                        >
                          <CheckCircle2 size={14} />
                        </IconButton>
                        <IconButton label="Delete" onClick={() => handleDelete(alert)} danger>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[#8899BB]">
          <Button
            onClick={() => loadAlerts(page - 1)}
            disabled={page === 1}
            className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-2 text-white disabled:opacity-40"
          >
            Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            onClick={() => loadAlerts(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-2 text-white disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Alert Trend</h2>
            <div className="flex flex-wrap gap-2">
              {(["daily", "weekly", "monthly"] as ChartRange[]).map((range) => (
                <Segment key={range} active={chartRange === range} onClick={() => setChartRange(range)}>
                  {range}
                </Segment>
              ))}
              <Segment active={chartType === "line"} onClick={() => setChartType("line")}>Line</Segment>
              <Segment active={chartType === "bar"} onClick={() => setChartType("bar")}>Bar</Segment>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            {chartType === "line" ? (
              <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E676" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#4A5A7A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5A7A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8899BB" }} />
                <Area type="monotone" dataKey="alerts" stroke="#00E676" strokeWidth={2} fill="url(#alertTrend)" />
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#4A5A7A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A5A7A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8899BB" }} />
                <Bar dataKey="alerts" fill="#00E676" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={stats?.severityDistribution || []}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={4}
              >
                {(stats?.severityDistribution || []).map((entry: any) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {(stats?.severityDistribution || []).map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#8899BB]">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Device-wise Alerts</h2>
          <div className="flex flex-col gap-3">
            {(stats?.deviceAlerts || []).length === 0 ? (
              <p className="text-sm text-[#8899BB]">No device alert data available</p>
            ) : (
              stats.deviceAlerts.map((device: any) => (
                <div key={device.deviceId} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#09111F] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{device.deviceName}</p>
                    <p className="text-xs text-[#4A5A7A]">{device.serialNumber}</p>
                  </div>
                  <span className="text-lg font-bold text-white">{device.count}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Real-Time Alert Feed</h2>
            <span className="text-xs text-[#00E676]">Auto-refresh 5s</span>
          </div>
          <div className="flex flex-col gap-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-[#8899BB]">No recent alerts</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-[#4A5A7A]">{new Date(alert.createdAt).toLocaleTimeString()}</p>
                    <span className="h-2 w-2 rounded-full" style={{ background: severityColors[alert.severity] || "#448AFF" }} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{alert.device?.deviceName || "--"}</p>
                  <p className="mt-1 text-xs text-[#8899BB]">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AlertDetailsDrawer
        alert={selectedAlert}
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />

      <DeleteConfirmModal
        open={!!alertToDelete}
        onClose={() => setAlertToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Alert"
        entityName={alertToDelete ? formatAlertId(alertToDelete.id) : "this alert"}
        description={
          alertToDelete
            ? `Are you sure you want to delete ${formatAlertId(alertToDelete.id)} for ${alertToDelete.device?.deviceName || "this device"}? This action cannot be undone.`
            : undefined
        }
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-10 rounded-lg bg-[#09111F] border border-white/10 px-3 text-sm text-white outline-none disabled:opacity-50"
    >
      {children}
    </select>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center disabled:opacity-35"
      style={{ color: danger ? "#FF5252" : "#8899BB", background: "#09111F" }}
    >
      {children}
    </button>
  );
}

function ExportButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone: "csv" | "excel" | "pdf";
  onClick: () => void;
}) {
  const tones = {
    csv: {
      color: "#448AFF",
      bg: "rgba(68,138,255,0.12)",
      border: "rgba(68,138,255,0.26)",
    },
    excel: {
      color: "#00E676",
      bg: "rgba(0,230,118,0.12)",
      border: "rgba(0,230,118,0.26)",
    },
    pdf: {
      color: "#FF5252",
      bg: "rgba(255,82,82,0.12)",
      border: "rgba(255,82,82,0.26)",
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Export ${label}`}
      className="group min-w-[92px] rounded-lg px-3 py-2 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
      style={{
        background: tones.bg,
        border: `1px solid ${tones.border}`,
        boxShadow: `0 0 18px ${tones.bg}`,
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{ background: "#09111F", color: tones.color }}
      >
        {icon}
      </span>
      <span style={{ color: tones.color }}>{label}</span>
    </button>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize"
      style={{
        background: active ? "rgba(0,230,118,0.14)" : "#09111F",
        color: active ? "#00E676" : "#8899BB",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}

const tooltipStyle = {
  background: "#09111F",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#E8F0FF",
};

function getStatus(alert: any): string {
  if (alert.isResolved) return "Resolved";
  if (alert.isAcknowledged) return "Acknowledged";
  return "Active";
}

function getStatusTone(alert: any): "active" | "acknowledged" | "resolved" {
  if (alert.isResolved) return "resolved";
  if (alert.isAcknowledged) return "acknowledged";
  return "active";
}

function formatAlertId(id: string) {
  return `ALT-${String(id).slice(0, 6).toUpperCase()}`;
}

function formatType(type?: string) {
  return String(type || "--")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleString();
}

function aggregateTrend(items: any[], range: ChartRange) {
  if (range === "daily") {
    return items.map((item) => ({
      label: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      alerts: item.alerts,
    }));
  }

  const buckets = new Map<string, number>();

  items.forEach((item) => {
    const date = new Date(item.date);
    const key =
      range === "weekly"
        ? `${date.getFullYear()} W${Math.ceil((date.getDate() + 6) / 7)}`
        : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });

    buckets.set(key, (buckets.get(key) || 0) + item.alerts);
  });

  return Array.from(buckets.entries()).map(([label, alerts]) => ({ label, alerts }));
}

function exportCsv(rows: Record<string, any>[]) {
  const csv = toCsv(rows);
  downloadBlob(csv, "alerts.csv", "text/csv;charset=utf-8;");
}

function exportExcel(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] || {});
  const html = `<table><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

  downloadBlob(html, "alerts.xls", "application/vnd.ms-excel");
}

function exportPdf(rows: Record<string, any>[]) {
  const popup = window.open("", "_blank");
  if (!popup) return;

  const headers = Object.keys(rows[0] || {});
  popup.document.write(`
    <html>
      <head><title>Alerts Report</title></head>
      <body>
        <h1>Alerts Report</h1>
        <table border="1" cellspacing="0" cellpadding="6">
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows
            .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
            .join("")}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.print();
}

function toCsv(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] || {});
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
