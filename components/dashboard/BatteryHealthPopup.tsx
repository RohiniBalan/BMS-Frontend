"use client";

import { Activity, BatteryCharging, ShieldCheck, Thermometer } from "lucide-react";

export default function BatteryHealthPopup({
  onOk,
  okHref,
}: {
  onOk: () => void;
  okHref: string;
}) {
  const healthMetrics = [
    {
      label: "SOC",
      value: "76%",
      helper: "Average charge",
      icon: <BatteryCharging size={16} style={{ color: "#00E676" }} />,
      bg: "rgba(0,230,118,0.12)",
      color: "#00E676",
    },
    {
      label: "SOH",
      value: "94%",
      helper: "Pack health",
      icon: <ShieldCheck size={16} style={{ color: "#448AFF" }} />,
      bg: "rgba(68,138,255,0.12)",
      color: "#448AFF",
    },
    {
      label: "Temperature",
      value: "31 C",
      helper: "Normal range",
      icon: <Thermometer size={16} style={{ color: "#FFB300" }} />,
      bg: "rgba(255,179,0,0.12)",
      color: "#FFB300",
    },
    {
      label: "Anomaly Score",
      value: "0.08",
      helper: "Low risk",
      icon: <Activity size={16} style={{ color: "#00BFA5" }} />,
      bg: "rgba(0,191,165,0.12)",
      color: "#00BFA5",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#050B18] relative overflow-hidden flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 20%, rgba(0,230,118,0.07) 0%, transparent 62%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-[520px] rounded-xl p-5 sm:p-6 animate-fade-in"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Battery Health Summary</h1>
            <p className="text-sm mt-1" style={{ color: "#8899BB" }}>
              Latest system snapshot before opening dashboard
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,230,118,0.12)" }}
          >
            <BatteryCharging size={20} style={{ color: "#00E676" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {healthMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg p-4"
              style={{
                background: "#080F1E",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "#8899BB" }}>
                  {metric.label}
                </span>
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: metric.bg }}
                >
                  {metric.icon}
                </span>
              </div>
              <div className="text-3xl font-bold text-white">{metric.value}</div>
              <p className="text-xs mt-1" style={{ color: metric.color }}>
                {metric.helper}
              </p>
            </div>
          ))}
        </div>

        <a
          href={okHref}
          onClick={onOk}
          className="btn-primary w-full mt-5 py-3 text-sm font-semibold flex items-center justify-center"
          style={{ borderRadius: 8, textDecoration: "none" }}
        >
          OK
        </a>
      </div>
    </div>
  );
}
