"use client";

import { formatDistanceToNow } from "date-fns";

interface Device {
  id: string;
  deviceName: string;
  serialNumber?: string;
  status: string;
  deviceType?: string;
  user?: { fullName: string };
  registration?: {
    batteryType?: string;
    dataSubscription?: string;
  };
  telemetry?: any[];
  createdAt?: string;
}

interface DeviceTableProps {
  devices: Device[];
  onView: (device: Device) => void;
  onAssign?: (device: Device) => void;
  onEdit?: (device: Device) => void;
}

export default function DeviceTable({
  devices,
  onView,
  onAssign,
  onEdit,
}: DeviceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[#4A5A7A]">
            <th className="text-left py-3 px-4">Device</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Battery</th>
            <th className="text-left py-3 px-4">Subscription</th>
            <th className="text-left py-3 px-4">Owner</th>
            <th className="text-left py-3 px-4">SOC</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-[#4A5A7A]">
                No devices found
              </td>
            </tr>
          ) : (
            devices.map((d) => {
              const telemetry = d.telemetry?.[0];

              return (
                <tr
                  key={d.id}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                  onClick={() => onView(d)}
                >
                  <td className="py-4 px-4 text-white">
                    <div className="font-medium">{d.deviceName}</div>
                    <div className="text-xs text-[#4A5A7A]">{d.id}</div>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={
                        d.status === "ONLINE"
                          ? "text-green-400"
                          : d.status === "OFFLINE"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }
                    >
                      {d.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-white">
                    {d.registration?.batteryType || "--"}
                  </td>

                  <td className="py-4 px-4 text-white">
                    {d.registration?.dataSubscription || "--"}
                  </td>

                  <td className="py-4 px-4 text-white">
                    {d.user?.fullName || "Unassigned"}
                  </td>

                  <td className="py-4 px-4 text-white">
                    {telemetry?.soc ?? "--"}%
                  </td>

                  <td className="py-4 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(d);
                        }}
                        className="text-blue-400"
                      >
                        View
                      </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}