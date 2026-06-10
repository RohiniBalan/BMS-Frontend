import { apiFetch } from "./apiClient";

export const getDevices = (params?: {
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.page) {
    query.append("page", String(params.page));
  }

  if (params?.limit) {
    query.append("limit", String(params.limit));
  }

  return apiFetch(`/devices?${query.toString()}`);
};

export const getDeviceMap = () => apiFetch("/devices/map");

// Get My Devices
export const getMyDevices = (params?: {
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.page) {
    query.append("page", String(params.page));
  }

  if (params?.limit) {
    query.append("limit", String(params.limit));
  }

  return apiFetch(`/devices/my-devices?${query.toString()}`);
};

// Get Device by ID
export const getDeviceById = (id: string) =>
  apiFetch(`/devices/${id}`);

// Register new device
export const registerDevice = (payload: any) => {
  return apiFetch("/devices/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Assign device to user
export const assignDevice = (deviceId: string, userId: string) =>{
  apiFetch(`/devices/${deviceId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({userId})
  })
}

// Update device 
export const updateDevice = (deviceId: string, payload: any) => {
  return apiFetch(`/devices/${deviceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// Delete device
export const deleteDevice = (deviceId: string) => {
  return apiFetch(`/devices/${deviceId}`, {
    method: "DELETE",
  });
};