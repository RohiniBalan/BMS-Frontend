import { DashboardDevice } from "@/components/dashboard/userDeviceData";

function SocBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)", maxWidth: 60 }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs" style={{ color: "#8899BB" }}>
        {value}%
      </span>
    </div>
  );
}

interface Props {
  data: DashboardDevice[];
}

export default function DeviceTable({ data }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {["DEVICE NAME", "SOC", "VOLTAGE", "CURRENT", "TEMPERATURE", "STATUS"].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider"
                style={{ color: "#4A5A7A" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            >
              <td className="px-3 py-2.5 text-xs font-medium text-white">{d.name}</td>
              <td className="px-3 py-2.5">
                <SocBar value={d.soc} color={d.socColor} />
              </td>
              <td className="px-3 py-2.5 text-xs" style={{ color: "#8899BB" }}>{d.voltage}</td>
              <td className="px-3 py-2.5 text-xs" style={{ color: "#8899BB" }}>{d.current}</td>
              <td className="px-3 py-2.5 text-xs" style={{ color: "#8899BB" }}>{d.temp}</td>
              <td className="px-3 py-2.5">
                <span
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: d.statusColor }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: d.statusColor }}
                  />
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}