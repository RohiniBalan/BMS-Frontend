"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Cpu,
  LayoutGrid,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SocDonut from "@/components/dashboard/SocDonut";
import SocTrendChart from "@/components/dashboard/SocTrendChart";
import DeviceTable from "@/components/dashboard/DeviceTable";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import { getDevicesForUser } from "@/components/dashboard/userDeviceData";
import { useDashboard } from "@/hooks/useDashboard";
import { useLiveStream } from "@/hooks/useLiveStream";

export default function UserDashboardPage() {
  const { loading, summary, fleet, devices, alerts, socDist, socTrend } =
    useDashboard();
  const { chartData, alerts: liveAlerts } = useLiveStream();

  const activeAlertCount = alerts.length;
  const [loginEmail, setLoginEmail] = useState("user@bms.io");
  const userDevices = useMemo(
    () => getDevicesForUser(loginEmail),
    [loginEmail],
  );
  const userLabel = loginEmail.split("@")[0] || "user";
  const assignedDevices = devices.length;
  const averageSoc = assignedDevices
    ? Math.round(
        userDevices.reduce((sum, d) => sum + (d.soc || 0), 0) / assignedDevices,
      )
    : 0;
  const onlineDevices = devices.filter((d) => d.status === "ONLINE").length;
  const excellentDevices = devices.filter((d) => d.soc >= 80).length;
  const goodDevices = devices.filter((d) => d.soc >= 40 && d.soc < 80).length;

  useEffect(() => {
    setLoginEmail(
      window.localStorage.getItem("bmsLoginEmail") || "user@bms.io",
    );
  }, []);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">My Battery Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#8899BB" }}>
            Real-time overview of {userLabel}&apos;s assigned battery systems
          </p>
        </div>
        <button
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
          style={{ borderRadius: 8 }}
        >
          <LayoutGrid size={13} />
          My Devices
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Average SOC"
          value={`${averageSoc}%`}
          subtext={`↑ ${summary?.socChangeFromYesterday ?? 0}% from yesterday`}
          subtextColor="#00E676"
          icon={<BatteryCharging size={13} style={{ color: "#00E676" }} />}
          iconBg="rgba(0,230,118,0.12)"
        >
          <div className="flex justify-center">
            <SocDonut value={averageSoc} size={76} />
          </div>
        </StatCard>

        <StatCard
          title="Assigned Devices"
          value={devices.length}
          subtext={`${devices.filter((d) => d.status === "ONLINE").length} Online`}
          subtextColor="#00E676"
          icon={<Cpu size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />

        <StatCard
          title="Active Alerts"
          value={activeAlertCount}
          subtext={`${summary?.criticalAlerts ?? 0} Critical · ${summary?.warningAlerts ?? 0} Warnings`}
          subtextColor="#FFB300"
          icon={<AlertTriangle size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />

        <StatCard
          title="Live Sessions"
          value={onlineDevices}
          subtext="Monitoring now"
          subtextColor="#448AFF"
          icon={<Activity size={13} style={{ color: "#448AFF" }} />}
          iconBg="rgba(68,138,255,0.12)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-xl p-4"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              My Device Status
            </h2>
            <button className="text-xs" style={{ color: "#00E676" }}>
              View devices
            </button>
          </div>
          <DeviceTable data={devices} />
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">
            Fleet Summary
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                label: "Assigned Devices",
                value: assignedDevices,
                color: "white",
              },
              { label: "Excellent", value: excellentDevices, color: "#00E676" },
              { label: "Good", value: goodDevices, color: "#FFB300" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-sm" style={{ color: "#8899BB" }}>
                  {row.label}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: row.color }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#00E676" }}
            />
            <span className="text-xs" style={{ color: "#8899BB" }}>
              Fleet Health:{" "}
              <span
                style={{
                  color:
                    averageSoc >= 80
                      ? "#00E676"
                      : averageSoc >= 40
                        ? "#FFB300"
                        : "#FF5252",
                }}
              >
                {averageSoc >= 80
                  ? "Excellent"
                  : averageSoc >= 40
                    ? "Good"
                    : "Critical"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 rounded-xl p-4"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              SOC Trend (My Devices)
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(0,230,118,0.08)", color: "#00E676" }}
            >
              24 Hours
            </span>
          </div>
          {/* <SocTrendChart data={socTrend} /> */}
          <SocTrendChart data={chartData} />
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">My Alerts</h2>
            <button className="text-xs" style={{ color: "#00E676" }}>
              View All
            </button>
          </div>
          {/* <RecentAlerts data={alerts} /> */}
          <RecentAlerts data={[...liveAlerts, ...alerts]} />
        </div>
      </div>
    </div>
  );
}
