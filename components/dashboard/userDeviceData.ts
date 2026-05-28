export type DeviceHealth = "Excellent" | "Good";

export type DashboardDevice = {
  name: string;
  soc: number;
  socColor: string;
  voltage: string;
  current: string;
  temp: string;
  status: string;
  statusColor: string;
  health: DeviceHealth;
};

export const allDevices: DashboardDevice[] = [
  {
    name: "EV Battery Pack 01",
    soc: 85,
    socColor: "#00E676",
    voltage: "48.2 V",
    current: "-12.4 A",
    temp: "28.5 C",
    status: "Online",
    statusColor: "#00E676",
    health: "Excellent",
  },
  {
    name: "Solar Storage 02",
    soc: 62,
    socColor: "#FFB300",
    voltage: "518 V",
    current: "8.7 A",
    temp: "31.2 C",
    status: "Online",
    statusColor: "#00E676",
    health: "Good",
  },
  {
    name: "UPS System 03",
    soc: 92,
    socColor: "#00E676",
    voltage: "52.8 V",
    current: "-4.3 A",
    temp: "26.1 C",
    status: "Online",
    statusColor: "#00E676",
    health: "Excellent",
  },
  {
    name: "Industrial Pack 04",
    soc: 72,
    socColor: "#00E676",
    voltage: "471 V",
    current: "15.6 A",
    temp: "33.8 C",
    status: "Online",
    statusColor: "#00E676",
    health: "Good",
  },
  {
    name: "Drone Battery 05",
    soc: 88,
    socColor: "#00E676",
    voltage: "44.2 V",
    current: "-2.1 A",
    temp: "29.3 C",
    status: "Online",
    statusColor: "#00E676",
    health: "Excellent",
  },
];

const userDeviceMap: Record<string, DashboardDevice[]> = {
  "user@bms.io": [allDevices[0], allDevices[1], allDevices[2]],
  "operator@bms.io": [allDevices[3], allDevices[4]],
  "technician@bms.io": [allDevices[1], allDevices[3], allDevices[4]],
};

export function getDevicesForUser(email?: string | null) {
  if (!email) {
    return userDeviceMap["user@bms.io"];
  }

  return userDeviceMap[email.toLowerCase()] || userDeviceMap["user@bms.io"];
}
