export interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  serialNumber: string;

  status: "ONLINE" | "OFFLINE" | "WARNING";

  totalCapacityKWh: number;

  locationName?: string;

  userId?: string;

  telemetry?: {
    soc: number;
    voltage: number;
    current: number;
    temperature: number;
  };
}