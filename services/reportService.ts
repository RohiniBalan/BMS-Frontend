import { apiFetch, API_BASE } from "./apiClient";

export interface ReportFilters {
  from?: string;    // ISO date string
  to?: string;      // ISO date string
  deviceId?: string;
  severity?: string;
  status?: string;
}

function buildQuery(filters: ReportFilters & { type?: string }) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) p.append(k, v);
  });
  return p.toString();
}

export const getFleetReport = () =>
  apiFetch("/reports/fleet");

export const getDeviceReport = (filters: Pick<ReportFilters, "deviceId" | "status"> = {}) =>
  apiFetch(`/reports/devices?${buildQuery(filters)}`);

export const getAlertReport = (filters: ReportFilters = {}) =>
  apiFetch(`/reports/alerts?${buildQuery(filters)}`);

export const getBatteryHealthReport = () =>
  apiFetch("/reports/battery-health");

export const getAuditReport = (filters: Pick<ReportFilters, "from" | "to"> = {}) =>
  apiFetch(`/reports/audit?${buildQuery(filters)}`);

// Returns a URL for browser download (CSV)
export function getExportURL(type: string, filters: ReportFilters = {}): string {
  const q = buildQuery({ type, ...filters });
  return `${API_BASE}/reports/export?${q}`;
}

// ─── User-scoped report API calls ───────────────────────────────────────────

export interface UserReportFilters {
  deviceId: string;
  from?: string;
  to?: string;
  severity?: string;
  limit?: number;
}

export const getUserPerformanceReport = (filters: UserReportFilters) =>
  apiFetch(`/reports/user-performance?${buildQuery(filters as any)}`);

export const getUserTelemetryReport = (filters: UserReportFilters) =>
  apiFetch(`/reports/user-telemetry?${buildQuery(filters as any)}`);

export const getUserAlertReport = (filters: UserReportFilters) =>
  apiFetch(`/reports/user-alerts?${buildQuery(filters as any)}`);

export async function downloadUserCSV(
  type: "performance" | "telemetry" | "alerts",
  filters: UserReportFilters,
) {
  const token = localStorage.getItem("accessToken");
  const q = buildQuery({ type, ...filters } as any);
  const res = await fetch(`${API_BASE}/reports/user-export?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `my-battery-${type}-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Trigger a CSV download in the browser
export async function downloadCSV(type: string, filters: ReportFilters = {}) {
  const token = localStorage.getItem("accessToken");
  const url = getExportURL(type, filters);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `bms-${type}-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
