import { apiFetch } from "./apiClient";

export type AlertQuery = {
  page?: number;
  limit?: number;
  search?: string;
  severity?: string;
  status?: string;
  isResolved?: boolean;
  deviceId?: string;
  from?: string;
  to?: string;
};

export const getAlerts = (params?: AlertQuery) => {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return apiFetch(`/alerts${queryString ? `?${queryString}` : ""}`);
};

export const getRecentAlerts = (limit = 10) => apiFetch(`/alerts/recent?limit=${limit}`);

export const getAlertSummary = () => apiFetch("/alerts/summary");

export const getAlertStats = () => apiFetch("/alerts/stats");

export const acknowledgeAlert = (id: string) =>
  apiFetch(`/alerts/${id}/acknowledge`, { method: "PATCH" });

export const resolveAlert = (id: string) =>
  apiFetch(`/alerts/${id}/resolve`, { method: "PATCH" });

export const deleteAlert = (id: string) =>
  apiFetch(`/alerts/${id}`, { method: "DELETE" });
