import { apiFetch } from "./apiClient";

export const getDevices = (userId?: string) =>
  apiFetch(`/devices?userId=${userId}`);

export const getDeviceMap = () => apiFetch("/devices/map");

export const getDeviceById = (id: string) =>
  apiFetch(`/devices/${id}`);