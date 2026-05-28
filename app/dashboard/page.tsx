"use client";
import { LayoutGrid, Zap, AlertTriangle, Cpu, ArrowUpRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SocDonut from "@/components/dashboard/SocDonut";
import SocTrendChart from "@/components/dashboard/SocTrendChart";
import DeviceTable from "@/components/dashboard/DeviceTable";
import SocDistribution from "@/components/dashboard/SocDistribution";
import RecentAlerts from "@/components/dashboard/RecentAlerts";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Page title + filter */}
      {/* <div className="flex items-start justify-between"> */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "#8899BB" }}>
            Real-time overview of all your battery systems
          </p>
        </div>
        <button
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
          style={{ borderRadius: 8 }}
        >
          <LayoutGrid size={13} />
          All Devices
        </button>
      </div>

      {/* Top stat cards */}
      {/* <div className="grid grid-cols-4 gap-4"> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average SOC */}
        <StatCard
          title="Average SOC"
          value="76%"
          subtext="↑ 6% from yesterday"
          subtextColor="#00E676"
          icon={<LayoutGrid size={13} style={{ color: "#00E676" }} />}
          iconBg="rgba(0,230,118,0.12)"
        >
          <div className="flex justify-center">
            <SocDonut value={76} size={76} />
          </div>
        </StatCard>

        {/* Total Capacity */}
        <StatCard
          title="Total Capacity"
          value="2.45"
          unit="MWh"
          subtext="↑ 120 kWh today"
          subtextColor="#00E676"
          icon={<Zap size={13} style={{ color: "#448AFF" }} />}
          iconBg="rgba(68,138,255,0.12)"
        />

        {/* Active Alerts */}
        <StatCard
          title="Active Alerts"
          value="8"
          subtext="3 Critical · 5 Warnings"
          subtextColor="#FF5252"
          icon={<AlertTriangle size={13} style={{ color: "#FF5252" }} />}
          iconBg="rgba(255,82,82,0.12)"
        />

        {/* Total Devices */}
        <StatCard
          title="Total Devices"
          value="52"
          subtext="38 Online"
          subtextColor="#00E676"
          icon={<Cpu size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
      </div>

      {/* Middle section: Device Table + SOC Distribution */}
      {/* <div className="grid grid-cols-3 gap-4"> */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device Status table – 2/3 width */}
        <div
          // className="col-span-2 rounded-xl p-4"
          className="lg:col-span-2 rounded-xl p-4"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Device Status</h2>
            <button
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "#00E676" }}
            >
              View all devices
              <ArrowUpRight size={12} />
            </button>
          </div>
          <DeviceTable />
        </div>

        {/* SOC Distribution – 1/3 width */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">SOC Distribution</h2>
          <SocDistribution />
        </div>
      </div>

      {/* Bottom section: Fleet Summary + SOC Trend + Recent Alerts */}
      {/* <div className="grid grid-cols-3 gap-4"> */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fleet Summary */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">Fleet Summary</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "Total Devices", value: "52", color: "white" },
              { label: "Online Devices", value: "38", color: "#00E676" },
              { label: "Total Alerts", value: "8", color: "#FF5252" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-sm" style={{ color: "#8899BB" }}>{row.label}</span>
                <span className="text-sm font-bold" style={{ color: row.color }}>
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
              System Status:{" "}
              <span style={{ color: "#00E676" }}>All Systems Operational</span>
            </span>
          </div>
        </div>

        {/* SOC Trend */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">SOC Trend (All Devices)</h2>
            <span
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(0,230,118,0.08)", color: "#00E676" }}
            >
              24 Hours
            </span>
          </div>
          <SocTrendChart />
        </div>

        {/* Recent Alerts */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Alerts</h2>
            <button className="text-xs" style={{ color: "#00E676" }}>
              View All
            </button>
          </div>
          <RecentAlerts />
        </div>
      </div>
    </div>
  );
}
