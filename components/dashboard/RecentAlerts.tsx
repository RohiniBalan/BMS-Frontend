import { AlertTriangle, BatteryLow, Zap, WifiOff } from "lucide-react";

const alerts = [
  {
    icon: AlertTriangle,
    iconColor: "#FF5252",
    iconBg: "rgba(255,82,82,0.12)",
    title: "High Temperature",
    sub: "Industrial Pack 04",
    time: "2m ago",
  },
  {
    icon: BatteryLow,
    iconColor: "#FFB300",
    iconBg: "rgba(255,179,0,0.12)",
    title: "Low Battery",
    sub: "Drone Battery 05",
    time: "5m ago",
  },
  {
    icon: Zap,
    iconColor: "#FF8C00",
    iconBg: "rgba(255,140,0,0.12)",
    title: "Cell Imbalance",
    sub: "EV Battery Pack 01",
    time: "8m ago",
  },
  {
    icon: WifiOff,
    iconColor: "#FF5252",
    iconBg: "rgba(255,82,82,0.12)",
    title: "Connection Lost",
    sub: "Solar Storage 02",
    time: "10m ago",
  },
];

export default function RecentAlerts() {
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a, i) => {
        const Icon = a.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: a.iconBg }}
            >
              <Icon size={13} style={{ color: a.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{a.title}</p>
              <p className="text-xs truncate" style={{ color: "#4A5A7A" }}>
                {a.sub}
              </p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: "#4A5A7A" }}>
              {a.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}
