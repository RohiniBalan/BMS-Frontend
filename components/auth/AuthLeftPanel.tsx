"use client";

const footerItems = [
  "Real-time Monitoring",
  "Smart Alerts",
  "Analytics",
  "Secure & Reliable",
];

export default function AuthLeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col items-center justify-between flex-1 min-h-screen relative overflow-hidden py-16 px-12"
      style={{ background: "#080F1E" }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,230,118,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Radial green glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,230,118,0.07) 0%, transparent 70%)",
        }}
      />

      {/* TOP: Logo + text */}
      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        {/* Battery icon */}
        <div
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg, #00E676 0%, #00BFA5 100%)",
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 32px rgba(0,230,118,0.4), 0 0 64px rgba(0,230,118,0.12)",
            animation: "float 4s ease-in-out infinite",
            position: "relative",
          }}
        >
          {/* nubs */}
          <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            <div style={{ width: 10, height: 5, background: "#00E676", borderRadius: 2, opacity: 0.6 }} />
            <div style={{ width: 10, height: 5, background: "#00E676", borderRadius: 2, opacity: 0.6 }} />
          </div>
          <svg width={32} height={38} viewBox="0 0 20 26" fill="none">
            <path d="M12 2L2 15H10L8 24L18 11H10L12 2Z" fill="#050B18" />
          </svg>
        </div>

        <div>
          <h1
            className="font-bold text-white"
            style={{ fontSize: 32, letterSpacing: "0.18em" }}
          >
            BMS
          </h1>
          <p
            className="text-xs uppercase tracking-widest mt-1"
            style={{ color: "#8899BB", letterSpacing: "0.2em" }}
          >
            Battery Management System
          </p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#8899BB", maxWidth: 280 }}>
            Monitor, Protect and Optimize your battery
            <br />performance in real-time.
          </p>
        </div>
      </div>

      {/* CENTER: Phone/device card mockup */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Card frame */}
        <div
          style={{
            width: 200,
            height: 240,
            background: "linear-gradient(160deg, #0D1626 0%, #0a1220 100%)",
            border: "1px solid rgba(0,230,118,0.15)",
            borderRadius: 24,
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner battery icon animated */}
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #00E676 0%, #00BFA5 100%)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(0,230,118,0.4)",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <svg width={36} height={44} viewBox="0 0 20 26" fill="none">
              <path d="M12 2L2 15H10L8 24L18 11H10L12 2Z" fill="#050B18" />
            </svg>
          </div>

          {/* Bottom gradient */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: "linear-gradient(to top, rgba(0,230,118,0.07), transparent)",
            }}
          />
        </div>
      </div>

      {/* BOTTOM: Feature badges */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {footerItems.map((item) => (
            <span
              key={item}
              className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: "rgba(0,230,118,0.06)",
                border: "1px solid rgba(0,230,118,0.12)",
                color: "#8899BB",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#00E676",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {item}
            </span>
          ))}
        </div>
        <p className="text-xs" style={{ color: "#2A3A5A" }}>
          © 2024 BMS Platform. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
