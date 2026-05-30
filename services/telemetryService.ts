const AUTH_BASE = process.env.NEXT_PUBLIC_API;

// ALL LATEST TELEMETRY
export const getAllLatestTelemetry = async () => {
  const res = await fetch(`${AUTH_BASE}/telemetry/all/latest`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Failed telemetry");

  return data.data;
};

// DEVICE HISTORY
export const getDeviceHistory = async (deviceId: string) => {
  const res = await fetch(`${AUTH_BASE}/telemetry/${deviceId}/history`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Failed history");

  return data.data;
};