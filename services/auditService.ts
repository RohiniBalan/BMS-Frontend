import { apiFetch, API_BASE } from "./apiClient";

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditStats {
  totalActivities: number;
  todayActivities: number;
  activeUsers: number;
  failedActions: number;
  criticalEvents: number;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  search?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
}

function buildQuery(filters: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.append(k, String(v));
  });
  return p.toString();
}

export const getAuditLogs = (filters: AuditFilters = {}): Promise<{ success: boolean; data: AuditLogsResponse }> =>
  apiFetch(`/audit?${buildQuery(filters as any)}`);

export const getAuditStats = (): Promise<{ success: boolean; data: AuditStats }> =>
  apiFetch("/audit/stats");

export const getAuditFilterOptions = (): Promise<{ success: boolean; data: { entities: string[]; actions: string[] } }> =>
  apiFetch("/audit/filters");

export async function downloadAuditCSV(filters: Omit<AuditFilters, "page" | "limit"> = {}) {
  const token = localStorage.getItem("accessToken");
  const query = buildQuery(filters as any);
  const res = await fetch(`${API_BASE}/audit/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
