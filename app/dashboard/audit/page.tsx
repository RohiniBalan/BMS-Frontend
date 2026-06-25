"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Users,
  XCircle,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import Button from "@/components/ui/Button";
import {
  getAuditLogs,
  getAuditStats,
  getAuditFilterOptions,
  downloadAuditCSV,
  type AuditLog,
  type AuditStats,
} from "@/services/auditService";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  green: "#00E676",
  blue: "#448AFF",
  yellow: "#FFB300",
  red: "#FF5252",
  purple: "#AB47BC",
  orange: "#FF6D00",
  card: "#0C1426",
  card2: "#09111F",
  border: "rgba(255,255,255,0.06)",
  dim: "#4A5A7A",
  sub: "#8899BB",
  text: "#E8F0FF",
} as const;

const LIMIT = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getActionTone(action: string): { color: string; bg: string } {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("REMOVE") || a.includes("FAILED") || a.includes("ERROR") || a.includes("DENIED")) {
    return { color: C.red, bg: "rgba(255,82,82,0.12)" };
  }
  if (a.includes("CREATE") || a.includes("ADD") || a.includes("REGISTER") || a.includes("SUCCESS") || a.includes("LOGIN") || a.includes("ASSIGN")) {
    return { color: C.green, bg: "rgba(0,230,118,0.12)" };
  }
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("CHANGE") || a.includes("PATCH") || a.includes("RESOLVE") || a.includes("ACKNOWLEDGE")) {
    return { color: C.blue, bg: "rgba(68,138,255,0.12)" };
  }
  if (a.includes("EXPORT") || a.includes("DOWNLOAD") || a.includes("GENERATE") || a.includes("REPORT")) {
    return { color: C.yellow, bg: "rgba(255,179,0,0.12)" };
  }
  if (a.includes("LOGOUT") || a.includes("VIEW") || a.includes("READ") || a.includes("GET")) {
    return { color: C.purple, bg: "rgba(171,71,188,0.12)" };
  }
  return { color: C.sub, bg: "rgba(136,153,187,0.10)" };
}

function getModuleIcon(entity: string): ReactNode {
  const e = entity.toUpperCase();
  if (e.includes("DEVICE")) return <Database size={11} />;
  if (e.includes("USER")) return <Users size={11} />;
  if (e.includes("ALERT")) return <Bell size={11} />;
  if (e.includes("REPORT")) return <BarChart2 size={11} />;
  if (e.includes("SETTING")) return <Settings size={11} />;
  if (e.includes("AUTH") || e.includes("LOGIN") || e.includes("SESSION")) return <Shield size={11} />;
  return <Activity size={11} />;
}

function isCritical(action: string): boolean {
  const a = action.toUpperCase();
  return (
    a.includes("DELETE") ||
    a.includes("REMOVE") ||
    a.includes("FAILED") ||
    a.includes("DENIED") ||
    a.includes("BLOCK") ||
    a.includes("LOCK")
  );
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const tone = getActionTone(action);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: tone.bg, color: tone.color }}
    >
      {formatAction(action)}
    </span>
  );
}

function StatusBadge({ action }: { action: string }) {
  const failed =
    action.toUpperCase().includes("FAILED") ||
    action.toUpperCase().includes("ERROR") ||
    action.toUpperCase().includes("DENIED");
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: failed ? "rgba(255,82,82,0.12)" : "rgba(0,230,118,0.12)",
        color: failed ? C.red : C.green,
      }}
    >
      {failed ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
      {failed ? "Failed" : "Success"}
    </span>
  );
}

function ModuleBadge({ entity }: { entity: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
      {getModuleIcon(entity)}
      {entity}
    </span>
  );
}

function ExportButton({
  icon,
  label,
  tone,
  onClick,
  loading = false,
}: {
  icon: ReactNode;
  label: string;
  tone: "csv" | "excel" | "pdf";
  onClick: () => void;
  loading?: boolean;
}) {
  const tones = {
    csv: { color: C.blue, bg: "rgba(68,138,255,0.12)", border: "rgba(68,138,255,0.26)" },
    excel: { color: C.green, bg: "rgba(0,230,118,0.12)", border: "rgba(0,230,118,0.26)" },
    pdf: { color: C.red, bg: "rgba(255,82,82,0.12)", border: "rgba(255,82,82,0.26)" },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={`Export ${label}`}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
      style={{ background: tones.bg, border: `1px solid ${tones.border}`, color: tones.color }}
    >
      {loading ? <RefreshCw size={11} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ─── Export Utilities ─────────────────────────────────────────────────────────

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function exportExcel(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const html = `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
  downloadBlob(html, `audit-logs-${new Date().toISOString().slice(0, 10)}.xls`, "application/vnd.ms-excel");
}

function exportPdf(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const popup = window.open("", "_blank");
  if (!popup) return;
  const headers = Object.keys(rows[0]);
  popup.document.write(`
    <html>
      <head>
        <title>Audit Logs</title>
        <style>
          body { font-family: sans-serif; font-size: 11px; }
          h1 { font-size: 16px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Audit Logs — ${new Date().toLocaleDateString()}</h1>
        <table>
          <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows
            .map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join("")}</tr>`)
            .join("")}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.print();
}

function buildExportRows(logs: AuditLog[]): Record<string, unknown>[] {
  return logs.map((log) => ({
    Timestamp: formatDateTime(log.createdAt),
    User: log.user?.fullName ?? "—",
    Email: log.user?.email ?? "—",
    Role: log.user?.role ?? "—",
    Module: log.entity,
    Action: formatAction(log.action),
    "Entity ID": log.entityId,
    "IP Address": log.ipAddress ?? "—",
    Status: log.action.toUpperCase().includes("FAILED") || log.action.toUpperCase().includes("ERROR") ? "Failed" : "Success",
  }));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [entityOptions, setEntityOptions] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<string[]>([]);

  const [logsLoading, setLogsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getAuditStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load audit stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const res = await getAuditFilterOptions();
      setEntityOptions(res.data.entities ?? []);
      setActionOptions(res.data.actions ?? []);
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  };

  const loadLogs = useCallback(
    async (pageNum = 1) => {
      try {
        setLogsLoading(true);
        const res = await getAuditLogs({
          page: pageNum,
          limit: LIMIT,
          search: search.trim() || undefined,
          entity: entityFilter || undefined,
          action: actionFilter || undefined,
          from: from || undefined,
          to: to || undefined,
        });
        setLogs(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLogsLoading(false);
      }
    },
    [search, entityFilter, actionFilter, from, to],
  );

  useEffect(() => {
    loadStats();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadLogs(1), 300);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  // ── Export handlers ───────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await downloadAuditCSV({
        search: search.trim() || undefined,
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      });
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => exportExcel(buildExportRows(logs));
  const handleExportPDF = () => exportPdf(buildExportRows(logs));

  // ── Derived data ──────────────────────────────────────────────────────────
  const criticalLogs = logs.filter((l) => isCritical(l.action)).slice(0, 6);
  const timelineLogs = logs.slice(0, 10);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm mt-1" style={{ color: C.sub }}>
            Track all user actions, system events, and security activities
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { loadStats(); loadLogs(page); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(0,230,118,0.1)", color: C.green, border: "1px solid rgba(0,230,118,0.2)" }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
          <ExportButton icon={<Download size={12} />} label="CSV" tone="csv" onClick={handleExportCSV} loading={exporting} />
          <ExportButton icon={<FileSpreadsheet size={12} />} label="Excel" tone="excel" onClick={handleExportExcel} />
          <ExportButton icon={<FileText size={12} />} label="PDF" tone="pdf" onClick={handleExportPDF} />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Activities"
          value={statsLoading ? "—" : (stats?.totalActivities ?? 0).toLocaleString()}
          subtext="All time records"
          subtextColor={C.blue}
          icon={<Activity size={13} style={{ color: C.blue }} />}
          iconBg="rgba(68,138,255,0.12)"
        />
        <StatCard
          title="Today's Activities"
          value={statsLoading ? "—" : stats?.todayActivities ?? 0}
          subtext="Since midnight"
          subtextColor={C.green}
          icon={<Clock size={13} style={{ color: C.green }} />}
          iconBg="rgba(0,230,118,0.12)"
        />
        <StatCard
          title="Active Users"
          value={statsLoading ? "—" : stats?.activeUsers ?? 0}
          subtext="Active today"
          subtextColor={C.yellow}
          icon={<Users size={13} style={{ color: C.yellow }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
        <StatCard
          title="Failed Actions"
          value={statsLoading ? "—" : stats?.failedActions ?? 0}
          subtext="Requires attention"
          subtextColor={C.red}
          icon={<AlertTriangle size={13} style={{ color: C.red }} />}
          iconBg="rgba(255,82,82,0.12)"
        />
      </div>

      {/* ── Search & Filters ── */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.dim }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, module, action, entity ID..."
              className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none"
              style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
            />
          </div>

          {/* Module */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-10 rounded-lg px-3 text-sm outline-none"
            style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
          >
            <option value="">All Modules</option>
            {entityOptions.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* Action */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-lg px-3 text-sm outline-none"
            style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
          >
            <option value="">All Actions</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{formatAction(a)}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 flex-1 min-w-0 rounded-lg px-2 text-xs outline-none"
              style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 flex-1 min-w-0 rounded-lg px-2 text-xs outline-none"
              style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text }}
            />
          </div>
        </div>
      </Card>

      {/* ── Main Audit Table ── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Audit Logs Table</h2>
          <span className="text-xs" style={{ color: C.sub }}>
            Showing {logs.length} of {total.toLocaleString()} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Timestamp", "User", "Module", "Action", "Entity ID", "IP Address", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-medium whitespace-nowrap"
                    style={{ color: C.dim }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm" style={{ color: C.sub }}>
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="animate-spin" style={{ color: C.dim }} />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm" style={{ color: C.sub }}>
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} style={{ color: C.dim, opacity: 0.5 }} />
                      <span>No audit logs found for the selected filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: `1px solid rgba(255,255,255,0.025)` }}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs" style={{ color: C.sub }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium text-white leading-tight">{log.user?.fullName ?? "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.dim }}>{log.user?.email ?? "—"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <ModuleBadge entity={log.entity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs" style={{ color: C.dim }}>
                      {log.entityId
                        ? log.entityId.length > 14
                          ? `${log.entityId.slice(0, 14)}…`
                          : log.entityId
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs" style={{ color: C.dim }}>
                      {log.ipAddress ?? "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge action={log.action} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <Button
            onClick={() => loadLogs(page - 1)}
            disabled={page === 1 || logsLoading}
            className="px-4 py-2 text-sm rounded-lg disabled:opacity-40"
            style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text } as React.CSSProperties}
          >
            ← Prev
          </Button>
          <span className="text-xs" style={{ color: C.sub }}>
            Page {page} of {totalPages} · {total.toLocaleString()} total records
          </span>
          <Button
            onClick={() => loadLogs(page + 1)}
            disabled={page === totalPages || logsLoading}
            className="px-4 py-2 text-sm rounded-lg disabled:opacity-40"
            style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text } as React.CSSProperties}
          >
            Next →
          </Button>
        </div>
      </Card>

      {/* ── Critical Events + Activity Timeline ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Critical Events */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Critical Events</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,82,82,0.12)", color: C.red }}>
              {criticalLogs.length} shown
            </span>
          </div>

          {criticalLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckCircle2 size={28} style={{ color: C.green, opacity: 0.6 }} />
              <p className="text-sm" style={{ color: C.sub }}>No critical events found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {criticalLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,82,82,0.06)", border: "1px solid rgba(255,82,82,0.14)" }}
                >
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{formatAction(log.action)}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.sub }}>
                      <span className="font-medium" style={{ color: C.text }}>{log.user?.fullName ?? "Unknown"}</span>
                      {" · "}{log.entity}{" · "}{formatDateTime(log.createdAt)}
                    </p>
                  </div>
                  <StatusBadge action={log.action} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Activity Timeline */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Activity Timeline</h2>
            <span className="text-xs" style={{ color: C.sub }}>Recent {timelineLogs.length} events</span>
          </div>

          {timelineLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Clock size={28} style={{ color: C.dim, opacity: 0.6 }} />
              <p className="text-sm" style={{ color: C.sub }}>No recent activity</p>
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute left-[7px] top-2 bottom-2 w-px"
                style={{ background: C.border }}
              />
              <div className="flex flex-col gap-4 pl-7">
                {timelineLogs.map((log) => {
                  const tone = getActionTone(log.action);
                  return (
                    <div key={log.id} className="relative">
                      <div
                        className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0C1426]"
                        style={{ background: tone.color }}
                      />
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white leading-tight">
                            {log.user?.fullName ?? "System"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: C.sub }}>
                            <span style={{ color: tone.color }}>{formatAction(log.action)}</span>
                            {" · "}{log.entity}
                          </p>
                        </div>
                        <span className="text-xs whitespace-nowrap shrink-0 mt-0.5" style={{ color: C.dim }}>
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── User Activity + Device Activity Summaries ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* User Activity Logs */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">User Activity</h2>
          <div className="flex flex-col gap-2">
            {logs
              .filter((l) => l.entity.toUpperCase().includes("USER") || l.entity.toUpperCase().includes("AUTH"))
              .slice(0, 6)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: C.card2, border: `1px solid ${C.border}` }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: getActionTone(log.action).color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{log.user?.fullName ?? "—"}</p>
                    <p className="text-xs truncate" style={{ color: C.sub }}>{formatAction(log.action)}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: C.dim }}>
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))}
            {logs.filter((l) => l.entity.toUpperCase().includes("USER") || l.entity.toUpperCase().includes("AUTH")).length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: C.sub }}>No user activity in current view</p>
            )}
          </div>
        </Card>

        {/* Device Activity Logs */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Device Activity</h2>
          <div className="flex flex-col gap-2">
            {logs
              .filter((l) => l.entity.toUpperCase().includes("DEVICE"))
              .slice(0, 6)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: C.card2, border: `1px solid ${C.border}` }}
                >
                  <Database size={11} className="shrink-0" style={{ color: C.blue }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{formatAction(log.action)}</p>
                    <p className="text-xs truncate" style={{ color: C.sub }}>{log.user?.fullName ?? "—"}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: C.dim }}>
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))}
            {logs.filter((l) => l.entity.toUpperCase().includes("DEVICE")).length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: C.sub }}>No device activity in current view</p>
            )}
          </div>
        </Card>

        {/* Alert Activity Logs */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Alert Activity</h2>
          <div className="flex flex-col gap-2">
            {logs
              .filter((l) => l.entity.toUpperCase().includes("ALERT"))
              .slice(0, 6)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: C.card2, border: `1px solid ${C.border}` }}
                >
                  <Bell size={11} className="shrink-0" style={{ color: C.yellow }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{formatAction(log.action)}</p>
                    <p className="text-xs truncate" style={{ color: C.sub }}>{log.user?.fullName ?? "—"}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: C.dim }}>
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))}
            {logs.filter((l) => l.entity.toUpperCase().includes("ALERT")).length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: C.sub }}>No alert activity in current view</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}

// React import for CSSProperties (used in Button style prop)
import React from "react";
