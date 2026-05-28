"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { time: "00:0", soc: 72 },
  { time: "04:0", soc: 68 },
  { time: "08:0", soc: 74 },
  { time: "12:0", soc: 76 },
  { time: "16:0", soc: 70 },
  { time: "20:0", soc: 78 },
  { time: "24:0", soc: 76 },
];

export default function SocTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E676" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#00E676" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: "#4A5A7A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#4A5A7A", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[50, 100]}
          ticks={[50, 75, 100]}
        />
        <Tooltip
          contentStyle={{
            background: "#0C1426",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 12,
            color: "#E8F0FF",
          }}
          itemStyle={{ color: "#00E676" }}
          labelStyle={{ color: "#8899BB" }}
        />
        <Area
          type="monotone"
          dataKey="soc"
          stroke="#00E676"
          strokeWidth={2}
          fill="url(#socGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#00E676" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
