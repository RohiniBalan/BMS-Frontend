import { AlertTriangle, BatteryLow, Zap, WifiOff } from "lucide-react";

interface Props {
  data: any[];
}

export default function RecentAlerts({ data }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((a, i) => {
        const Icon =
          a.type === "critical"
            ? AlertTriangle
            : a.type === "battery"
              ? BatteryLow
              : a.type === "network"
                ? WifiOff
                : Zap;
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background:
                  a.type === "critical"
                    ? "rgba(255,82,82,0.15)"
                    : a.type === "battery"
                      ? "rgba(255,179,0,0.15)"
                      : "rgba(0,230,118,0.15)",
              }}
            >
              <Icon
                size={13}
                style={{
                  color:
                    a.type === "critical"
                      ? "#FF5252"
                      : a.type === "battery"
                        ? "#FFB300"
                        : "#00E676",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {a.title}
              </p>
              <p className="text-xs truncate" style={{ color: "#4A5A7A" }}>
                {a.sub}
              </p>
            </div>
            <span
              className="text-xs flex-shrink-0"
              style={{ color: "#4A5A7A" }}
            >
              {a.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}
