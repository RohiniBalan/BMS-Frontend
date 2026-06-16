type AlertBadgeProps = {
  label: string;
  tone: "critical" | "warning" | "info" | "active" | "acknowledged" | "resolved";
};

const styles: Record<AlertBadgeProps["tone"], { bg: string; color: string }> = {
  critical: { bg: "rgba(255,82,82,0.12)", color: "#FF5252" },
  warning: { bg: "rgba(255,179,0,0.14)", color: "#FFB300" },
  info: { bg: "rgba(68,138,255,0.14)", color: "#448AFF" },
  active: { bg: "rgba(255,82,82,0.12)", color: "#FF5252" },
  acknowledged: { bg: "rgba(255,179,0,0.14)", color: "#FFB300" },
  resolved: { bg: "rgba(0,230,118,0.12)", color: "#00E676" },
};

export default function AlertBadge({ label, tone }: AlertBadgeProps) {
  const style = styles[tone];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}
