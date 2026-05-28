import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  subtextColor?: string;
  icon?: ReactNode;
  iconBg?: string;
  children?: ReactNode;
}

export default function StatCard({
  title,
  value,
  unit,
  subtext,
  subtextColor = "#8899BB",
  icon,
  iconBg,
  children,
}: StatCardProps) {
  return (
    <div
      className="card p-5 flex flex-col gap-3"
      style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#8899BB" }}>
          {title}
        </span>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: iconBg || "rgba(0,230,118,0.1)" }}
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-bold text-white">{value}</span>
          {unit && (
            <span className="text-sm font-medium pb-1" style={{ color: "#8899BB" }}>
              {unit}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: subtextColor }}>
            {subtext}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
