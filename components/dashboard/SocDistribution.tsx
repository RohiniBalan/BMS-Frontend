const ranges = [
  { label: "0 – 20%", count: 4, pct: 8, color: "#FF5252" },
  { label: "20 – 40%", count: 8, pct: 15, color: "#FF8C00" },
  { label: "40 – 60%", count: 12, pct: 23, color: "#FFB300" },
  { label: "60 – 80%", count: 16, pct: 31, color: "#4CAF50" },
  { label: "80 – 100%", count: 12, pct: 23, color: "#00E676" },
];

export default function SocDistribution() {
  return (
    <div className="flex flex-col gap-4">
      {/* Mini grid chart */}
      <div className="flex items-end gap-1 h-16 px-2">
        {ranges.map((r) => (
          <div key={r.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${r.pct * 2}px`,
                background: r.color,
                opacity: 0.8,
                minHeight: 4,
              }}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {ranges.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: r.color, display: "inline-block" }}
              />
              <span className="text-xs" style={{ color: "#8899BB" }}>
                {r.label}
              </span>
            </div>
            <span className="text-xs font-medium text-white">
              {r.count} ({r.pct}%)
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="mt-1 p-3 rounded-lg text-center"
        style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.1)" }}
      >
        <p className="text-2xl font-bold" style={{ color: "#00E676" }}>52</p>
        <p className="text-xs mt-0.5" style={{ color: "#8899BB" }}>Total Devices</p>
      </div>
    </div>
  );
}
