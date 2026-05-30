type RangeItem = {
  label: string;
  count: number;
  pct: number;
  color: string;
};

export default function SocDistribution({ data }: { data?: RangeItem[] }) {
  const safeData = Array.isArray(data) ? data : [];

  const ranges: RangeItem[] = safeData;
  if (!ranges.length) {
  return (
    <div className="text-xs" style={{ color: "#8899BB" }}>
      No SOC distribution data available
    </div>
  );
}

  return (
    <div className="flex flex-col gap-4">
      {/* Mini chart */}
      <div className="flex items-end gap-1 h-16 px-2">
        {ranges.map((r) => (
          <div
            key={r.label}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max((r.pct / 100) * 64, 4)}px`,
                background: r.color,
                opacity: 0.8,
              }}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {ranges.map((r: RangeItem) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: r.color }}
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
        style={{
          background: "rgba(0,230,118,0.06)",
          border: "1px solid rgba(0,230,118,0.1)",
        }}
      >
        <p className="text-2xl font-bold" style={{ color: "#00E676" }}>
          {ranges.reduce((sum, r) => sum + r.count, 0)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#8899BB" }}>
          Total Devices
        </p>
      </div>
    </div>
  );
}
