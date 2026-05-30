"use client";

import { LayoutGrid, Zap, AlertTriangle, Cpu } from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import SocDonut from "@/components/dashboard/SocDonut";
import SocTrendChart from "@/components/dashboard/SocTrendChart";
import DeviceTable from "@/components/dashboard/DeviceTable";
import SocDistribution from "@/components/dashboard/SocDistribution";
import RecentAlerts from "@/components/dashboard/RecentAlerts";

import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { loading, summary, fleet, devices, alerts, socDist, socTrend } =
    useDashboard();

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average SOC"
          value={`${summary?.averageSOC ?? 0}%`}
          subtext="↑ 6% from yesterday"
          subtextColor="#00E676"
          icon={<LayoutGrid size={13} style={{ color: "#00E676" }} />}
          iconBg="rgba(0,230,118,0.12)"
        >
          <div className="flex justify-center">
            <SocDonut value={summary?.averageSOC ?? 0} size={76} />
          </div>
        </StatCard>

        <StatCard
          title="Total Capacity"
          value={`${summary?.totalCapacityMWh ?? 0} MWh`}
  subtext={`↑ ${summary?.capacityChangeTodayKWh ?? 0} kWh today`}
          subtextColor="#00E676"
          icon={<Zap size={13} style={{ color: "#448AFF" }} />}
          iconBg="rgba(68,138,255,0.12)"
        />

        <StatCard
          title="Active Alerts"
          value={summary?.totalAlerts ?? 0}
  subtext={`${summary?.criticalAlerts ?? 0} Critical · ${summary?.warningAlerts ?? 0} Warnings`}
          subtextColor="#FF5252"
          icon={<AlertTriangle size={13} style={{ color: "#FF5252" }} />}
          iconBg="rgba(255,82,82,0.12)"
        />

        <StatCard
          title="Total Devices"
          value={summary?.totalDevices ?? 0}
          subtext={`${summary?.onlineDevices ?? 0} Online`}
          subtextColor="#00E676"
          icon={<Cpu size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
      </div>

      {/* Middle section: Device Table + SOC Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* LEFT */}
        {/* DEVICE TABLE CARD */}
        <div
          className="xl:col-span-2 rounded-2xl p-5"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white mb-4">
              Device Status
            </h3>

            <button
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "#00E676" }}
            >
              View all devices ↗
            </button>
          </div>

          <DeviceTable data={devices} />
        </div>

        {/* RIGHT */}
        {/* SOC */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            SOC Distribution
          </h3>

          <SocDistribution data={socDist} />
        </div>
      </div>

      {/* Bottom section: Fleet Summary + SOC Trend + Recent Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* FLEET SUMMARY */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            Fleet Summary
          </h3>

          <div className="flex flex-col gap-5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#4A5A7A" }}>Total Devices</span>

              <span className="text-white font-semibold">
                {summary?.totalDevices ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: "#4A5A7A" }}>Online Devices</span>

              <span className="text-green-400 font-semibold">
                {summary?.onlineDevices ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: "#4A5A7A" }}>Total Alerts</span>

              <span className="text-red-400 font-semibold">
                {summary?.totalAlerts ?? 0}
              </span>
            </div>

            <div
              className="pt-4 text-xs"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-green-400">
                ● System Status: All Systems Operational
              </span>
            </div>
          </div>
        </div>

        {/* SOC TREND */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex justify-between mb-4">
            <h3 className="text-sm font-semibold text-white mb-4">
              SOC Trend (All Devices)
            </h3>

            <span className="text-xs text-green-400">24 Hours</span>
          </div>

          <SocTrendChart data={socTrend} />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {/* ALERTS */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "#0C1426",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Recent Alerts
              </h3>

              <button className="text-xs text-green-400">View All</button>
            </div>

            <RecentAlerts data={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
