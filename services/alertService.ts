import { apiFetch } from "./apiClient";

export const getAlerts = () => apiFetch("/alerts");

export const getRecentAlerts = () => apiFetch("/alerts/recent");

export const getAlertSummary = () => apiFetch("/alerts/summary");