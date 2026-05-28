import React from "react";

interface BmsLogoProps {
  iconSize?: number;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export default function BmsLogo({
  iconSize = 56,
  showText = true,
  showTagline = false,
  className = "",
}: BmsLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Battery icon with lightning */}
      <div
        className="animate-float glow-green flex items-center justify-center rounded-2xl"
        style={{
          width: iconSize,
          height: iconSize,
          background: "linear-gradient(135deg, #00E676 0%, #00BFA5 100%)",
          borderRadius: Math.round(iconSize * 0.22),
          position: "relative",
        }}
      >
        {/* Battery nubs */}
        <div
          style={{
            position: "absolute",
            top: -Math.round(iconSize * 0.06),
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 3,
          }}
        >
          <div
            style={{
              width: Math.round(iconSize * 0.12),
              height: Math.round(iconSize * 0.07),
              background: "#00E676",
              borderRadius: 2,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              width: Math.round(iconSize * 0.12),
              height: Math.round(iconSize * 0.07),
              background: "#00E676",
              borderRadius: 2,
              opacity: 0.7,
            }}
          />
        </div>

        {/* Lightning bolt SVG */}
        <svg
          width={iconSize * 0.42}
          height={iconSize * 0.52}
          viewBox="0 0 20 26"
          fill="none"
        >
          <path
            d="M12 2L2 15H10L8 24L18 11H10L12 2Z"
            fill="#050B18"
          />
        </svg>
      </div>

      {showText && (
        <div className="text-center">
          <h1
            className="font-bold tracking-widest text-white"
            style={{ fontSize: Math.round(iconSize * 0.45), letterSpacing: "0.15em" }}
          >
            BMS
          </h1>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#8899BB", letterSpacing: "0.2em", fontSize: Math.round(iconSize * 0.16) }}
          >
            Battery Management System
          </p>
          {showTagline && (
            <p className="text-sm mt-2" style={{ color: "#8899BB", maxWidth: 260 }}>
              Monitor, Protect and Optimize your battery performance in real-time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
