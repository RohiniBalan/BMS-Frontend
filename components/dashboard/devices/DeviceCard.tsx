"use client";

import { BatteryCharging, Thermometer, Zap, Cpu, Gauge } from "lucide-react";
import StatCard from "../StatCard";

export default function DeviceCard({ device, onClick }: any) {
  const telemetry = device.telemetry?.[0];
  const soc = telemetry?.soc || 0;

  return (
    <div
      onClick={() => onClick?.(device)}
      className="cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#00E676]/30"
      style={{
        background: "#0C1426",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-semibold text-lg">
            {device.deviceName}
          </h3>

          <p className="text-xs text-[#8899BB] mt-1">
            SN: {device.serialNumber}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[#00E676]/10 text-[#00E676]">
              {device.deviceType}
            </span>
          </div>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full ${
            device.status === "ONLINE"
              ? "bg-green-500/10 text-green-400"
              : device.status === "WARNING"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-red-500/10 text-red-400"
          }`}
        >
          {device.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <Metric
          icon={<BatteryCharging size={14} />}
          label="SOC"
          value={`${soc}%`}
        />

        <Metric
          icon={<Zap size={14} />}
          label="Voltage"
          value={`${telemetry?.voltage ?? "--"} V`}
        />

        <Metric
          icon={<Gauge size={14} />}
          label="Capacity"
          value={`${device.totalCapacityKWh ?? "--"} kWh`}
        />

        <Metric
          icon={<Thermometer size={14} />}
          label="Temp"
          value={`${telemetry?.temperature ?? "--"} °C`}
        />

        <Metric
          icon={<Cpu size={14} />}
          label="Assigned To"
          value={device.user?.fullName || "Unassigned"}
        />
      </div>

      {/* Battery Bar */}
      <div className="mt-5">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#8899BB]">Battery Health</span>
          <span className="text-white">{soc}%</span>
        </div>

        <div className="w-full bg-[#1B2438] rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              soc > 70
                ? "bg-green-500"
                : soc > 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${soc}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#8899BB]">Battery Type</span>

          <span className="text-white">
            {device.registration?.batteryType?.replaceAll("_", " ") || "--"}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#8899BB]">Plan</span>

          <span className="text-white">
            {device.registration?.dataSubscription || "--"}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
        <span className="text-[#00E676] text-sm font-medium">
          View Details →
        </span>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <div>
      {" "}
      <div className="flex items-center gap-1 text-[#8899BB] text-xs">
        {" "}
        {icon} {label}{" "}
      </div>{" "}
      <div className="text-white font-semibold mt-1">{value}</div>{" "}
    </div>
  );
}
