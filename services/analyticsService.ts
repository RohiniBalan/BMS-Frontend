import { apiFetch } from "./apiClient";

export const getDashboardSummary = (userId?: string) =>
  apiFetch(`/dashboard/summary?userId=${userId}`);

export const getSocDistribution = () =>
  apiFetch("/dashboard/soc-distribution");

export const getSocTrend = (range: string = "24h", deviceId?: string) => {
  const params = new URLSearchParams({ range });
  if (deviceId) params.append("deviceId", deviceId);
  return apiFetch(`/analytics/soc-trend?${params}`);
};

export const getTemperatureTrend = (range: string = "24h", deviceId?: string) => {
  const params = new URLSearchParams({ range });
  if (deviceId) params.append("deviceId", deviceId);
  return apiFetch(`/analytics/temperature-trend?${params}`);
};

export const getVoltageTrend = (range: string = "24h", deviceId?: string) => {
  const params = new URLSearchParams({ range });
  if (deviceId) params.append("deviceId", deviceId);
  return apiFetch(`/analytics/voltage-trend?${params}`);
};

export const getCurrentTrend = (range: string = "24h", deviceId?: string) => {
  const params = new URLSearchParams({ range });
  if (deviceId) params.append("deviceId", deviceId);
  return apiFetch(`/analytics/current-trend?${params}`);
};

export const getFleetSummary = (range: string = "24h") =>
  apiFetch(`/analytics/fleet-summary?range=${range}`);

export const getAlertAnalytics = (range: string = "30d") =>
  apiFetch(`/analytics/alert-analytics?range=${range}`);

export const getDeviceComparison = () =>
  apiFetch("/analytics/device-comparison");

export const getUserAnalytics = (deviceId: string, range: string = "24h") =>
  apiFetch(`/analytics/user-analytics?deviceId=${encodeURIComponent(deviceId)}&range=${range}`);

export const getHealthPopupData = () =>
  apiFetch("/analytics/health-popup");