"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Eye,
  Mail,
  MessageSquare,
  MonitorDot,
  X,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import AlertBadge from "@/components/dashboard/alerts/AlertBadge";
import {
  getAlerts,
  getAlertStats,
  getRecentAlerts,
} from "@/services/alertService";

const limit = 30;

type PreferenceKey = "inApp" | "email" | "sms";

const recommendations: Record<string, string[]> = {
  HIGH_TEMPERATURE: [
    "Stop charging immediately.",
    "Inspect the cooling system.",
    "Contact administrator if temperature exceeds 70C.",
  ],
  LOW_BATTERY: [
    "Recharge battery soon.",
    "Avoid deep discharge.",
    "Plan the next trip only after adequate charge.",
  ],
  OVERVOLTAGE: [
    "Disconnect charger.",
    "Check charging parameters.",
    "Report repeated high-voltage events to the administrator.",
  ],
  UNDERVOLTAGE: [
    "Reduce load on the battery.",
    "Recharge before continued operation.",
    "Ask the administrator to inspect voltage limits.",
  ],
  CELL_IMBALANCE: [
    "Avoid high-load usage until inspected.",
    "Request battery balancing support.",
    "Monitor SOC and temperature closely.",
  ],
  CONNECTION_LOST: [
    "Check device power and network signal.",
    "Move the battery to an area with better connectivity.",
    "Contact administrator if telemetry does not resume.",
  ],
};

export default function UserAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    inApp: true,
    email: true,
    sms: false,
  });

  const loadAlerts = async (pageNumber = page) => {
    try {
      setLoading(true);

      const res = await getAlerts({
        page: pageNumber,
        limit,
        severity: severityFilter === "All" ? undefined : severityFilter,
        isResolved:
          statusFilter === "All" ? undefined : statusFilter === "RESOLVED",
        from: fromDate,
        to: toDate,
      });

      setAlerts(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
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
      const res = await getRecentAlerts(6);
      setRecentAlerts(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadHistory = async () => {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);

      const res = await getAlerts({
        page: 1,
        limit: 100,
        from: from.toISOString().slice(0, 10),
      });

      setHistoryAlerts(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const savedPreferences = localStorage.getItem("alertNotificationPreferences");
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    loadStats();
    loadRecentAlerts();
    loadHistory();

    const timer = window.setInterval(loadRecentAlerts, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAlerts(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [severityFilter, statusFilter, fromDate, toDate]);

  const history = useMemo(
    () => ({
      critical: historyAlerts.filter((alert) => alert.severity === "CRITICAL").length,
      warning: historyAlerts.filter((alert) => alert.severity === "WARNING").length,
    }),
    [historyAlerts],
  );

  const setPreference = (key: PreferenceKey) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    localStorage.setItem("alertNotificationPreferences", JSON.stringify(next));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Alerts</h1>
        <p className="text-sm mt-1 text-[#8899BB]">
          Alerts from your assigned battery devices
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Alerts"
          value={stats?.activeAlerts ?? 0}
          subtext="Need attention"
          subtextColor="#FFB300"
          icon={<Bell size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
        <StatCard
          title="Critical Alerts"
          value={stats?.criticalAlerts ?? 0}
          subtext="High priority"
          subtextColor="#FF5252"
          icon={<AlertTriangle size={13} style={{ color: "#FF5252" }} />}
          iconBg="rgba(255,82,82,0.12)"
        />
        <StatCard
          title="Resolved Alerts"
          value={stats?.resolvedAlerts ?? 0}
          subtext="Closed alerts"
          subtextColor="#00E676"
          icon={<CheckCircle2 size={13} style={{ color: "#00E676" }} />}
          iconBg="rgba(0,230,118,0.12)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">My Alerts Table</h2>
              <p className="text-xs text-[#8899BB] mt-1">
                View alert status and details for assigned devices
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Select value={severityFilter} onChange={setSeverityFilter}>
                <option value="All">All Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </Select>
              <Select value={statusFilter} onChange={setStatusFilter}>
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="RESOLVED">Resolved</option>
              </Select>
              <DateInput value={fromDate} onChange={setFromDate} label="From Date" />
              <DateInput value={toDate} onChange={setToDate} label="To Date" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#4A5A7A]">
                  <th className="text-left py-3 px-4">Alert ID</th>
                  <th className="text-left py-3 px-4">Device</th>
                  <th className="text-left py-3 px-4">Alert Type</th>
                  <th className="text-left py-3 px-4">Severity</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8899BB]">
                      Loading alerts...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8899BB]">
                      No alerts found
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 text-white font-medium">
                        {formatAlertId(alert.id)}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white font-medium">
                          {alert.device?.deviceName || "--"}
                        </p>
                        <p className="text-xs text-[#4A5A7A]">
                          {alert.device?.serialNumber || "--"}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-white">
                        {formatType(alert.alertType)}
                      </td>
                      <td className="py-4 px-4">
                        <AlertBadge
                          label={formatSeverity(alert.severity)}
                          tone={getSeverityTone(alert.severity)}
                        />
                      </td>
                      <td className="py-4 px-4 text-[#8899BB]">
                        {formatDateTime(alert.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <AlertBadge
                          label={alert.isResolved ? "Resolved" : "Active"}
                          tone={alert.isResolved ? "resolved" : "active"}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="h-8 w-8 rounded-lg border border-white/10 bg-[#09111F] text-[#8899BB] hover:text-white flex items-center justify-center"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-[#8899BB]">
            <button
              type="button"
              onClick={() => loadAlerts(page - 1)}
              disabled={page === 1}
              className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-2 text-white disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => loadAlerts(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-2 text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Panel title="Recent Alerts Feed" subtitle="Auto-refresh 5s">
            <div className="flex flex-col gap-3">
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-[#8899BB]">No recent alerts</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-white/10 bg-[#09111F] px-4 py-3"
                  >
                    <p className="text-xs text-[#4A5A7A]">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatType(alert.alertType)}
                    </p>
                    <p className="mt-1 text-xs text-[#8899BB]">
                      {alert.device?.deviceName || "--"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Notification Preferences">
            <div className="flex flex-col gap-3">
              <Preference
                icon={<MonitorDot size={15} />}
                label="In-App Notifications"
                checked={preferences.inApp}
                onChange={() => setPreference("inApp")}
              />
              <Preference
                icon={<Mail size={15} />}
                label="Email Notifications"
                checked={preferences.email}
                onChange={() => setPreference("email")}
              />
              <Preference
                icon={<MessageSquare size={15} />}
                label="SMS Notifications"
                checked={preferences.sms}
                onChange={() => setPreference("sms")}
              />
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel title="Alert History" subtitle="Last 30 Days">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HistoryCard
              label="Critical Alerts"
              value={history.critical}
              color="#FF5252"
            />
            <HistoryCard
              label="Warning Alerts"
              value={history.warning}
              color="#FFB300"
            />
          </div>
        </Panel>

        <Panel title="Alert Recommendations">
          <div className="flex flex-col gap-3">
            {Object.entries(recommendations).slice(0, 3).map(([type, items]) => (
              <div
                key={type}
                className="rounded-lg border border-white/10 bg-[#09111F] p-4"
              >
                <p className="text-sm font-semibold text-white">{formatType(type)}</p>
                <p className="text-xs text-[#4A5A7A] mt-1">Recommendation</p>
                <ul className="mt-2 space-y-1 text-sm text-[#8899BB]">
                  {items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <AlertDetailsModal
        alert={selectedAlert}
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}

function AlertDetailsModal({
  alert,
  open,
  onClose,
}: {
  alert: any | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !alert) return null;

  const snapshot = alert.sensorSnapshot;
  const recommendationItems =
    recommendations[alert.alertType] || [
      "Review the alert details.",
      "Monitor the battery condition.",
      "Contact administrator if the alert continues.",
    ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-white/10 bg-[#080F1E] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4A5A7A]">
              Alert Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {formatAlertId(alert.id)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-white/10 flex items-center justify-center text-[#8899BB] hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModalSection title="Device Info">
            <Info label="Device Name" value={alert.device?.deviceName} />
            <Info label="Serial Number" value={alert.device?.serialNumber} />
            <Info label="Battery Type" value={alert.device?.registration?.batteryType} />
          </ModalSection>

          <ModalSection title="Alert Info">
            <Info label="Alert Type" value={formatType(alert.alertType)} />
            <Info label="Severity" value={formatSeverity(alert.severity)} />
            <Info label="Status" value={alert.isResolved ? "Resolved" : "Active"} />
            <Info label="Generated Time" value={formatDateTime(alert.createdAt)} />
          </ModalSection>
        </div>

        <section className="mt-4 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Battery Snapshot</h3>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="SOC" value={snapshot?.soc ?? "--"} suffix={snapshot ? "%" : ""} />
            <Metric label="Voltage" value={snapshot?.voltage ?? "--"} suffix={snapshot ? "V" : ""} />
            <Metric label="Current" value={snapshot?.current ?? "--"} suffix={snapshot ? "A" : ""} />
            <Metric label="Temperature" value={snapshot?.temperature ?? "--"} suffix={snapshot ? "C" : ""} />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Recommendation</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#C7D2EA]">
            {recommendationItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg bg-[#09111F] border border-white/10 px-3 text-sm text-white outline-none"
    >
      {children}
    </select>
  );
}

function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="relative">
      <CalendarDays
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5A7A]"
      />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-10 w-full rounded-lg bg-[#09111F] border border-white/10 pl-9 pr-3 text-sm text-white outline-none"
      />
    </label>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <span className="text-xs text-[#00E676]">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Preference({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#09111F] px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-white">
        <span className="text-[#8899BB]">{icon}</span>
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[#00E676]"
      />
    </label>
  );
}

function HistoryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#09111F] p-4">
      <div className="flex items-center gap-2 text-sm text-[#8899BB]">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ModalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0C1426] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {children}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-[#4A5A7A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value || "--"}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix: string;
}) {
  return (
    <div className="rounded-lg bg-[#09111F] border border-white/10 p-3">
      <p className="text-xs text-[#4A5A7A]">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function formatAlertId(id: string) {
  return `ALT-${String(id).slice(0, 6).toUpperCase()}`;
}

function formatSeverity(severity?: string) {
  return String(severity || "--")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function getSeverityTone(severity?: string): "critical" | "warning" | "info" {
  if (severity === "CRITICAL") return "critical";
  if (severity === "WARNING") return "warning";
  return "info";
}
