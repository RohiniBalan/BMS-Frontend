"use client";

interface SocDonutProps {
  value: number;
  size?: number;
}

export default function SocDonut({ value, size = 80 }: SocDonutProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const strokeWidth = 6;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    value >= 60 ? "#00E676" : value >= 30 ? "#FFB300" : "#FF5252";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontSize: 14, fontWeight: 700, color }}
      >
        {value}%
      </div>
    </div>
  );
}
