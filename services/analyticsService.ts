import { apiFetch } from "./apiClient";

// export const getDashboardSummary = () =>
//   apiFetch("/dashboard/summary");

export const getDashboardSummary = (userId?: string) =>
  apiFetch(`/dashboard/summary?userId=${userId}`);

export const getSocDistribution = () =>
  apiFetch("/dashboard/soc-distribution");

export const getSocTrend = () =>
  apiFetch("/analytics/soc-trend");

export const getFleetSummary = () =>
  apiFetch("/analytics/fleet-summary");

export const getHealthPopupData = () =>
  apiFetch("/analytics/health-popup");