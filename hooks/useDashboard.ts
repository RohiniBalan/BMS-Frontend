import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getFleetSummary,
  getSocDistribution,
  getSocTrend,
} from "@/services/analyticsService";
import { getDevices } from "@/services/deviceService";
import { getRecentAlerts } from "@/services/alertService";

export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [fleet, setFleet] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [socDist, setSocDist] = useState<any>(null);
  const [socTrend, setSocTrend] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const loginEmail = localStorage.getItem("bmsLoginEmail") || "";

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        const userId = storedUser?.id;

        const [s, f, d, a, sd, st] = await Promise.all([
          getDashboardSummary(userId),
          getFleetSummary(),
          getDevices(),
          getRecentAlerts(),
          getSocDistribution(),
          getSocTrend(),
        ]);

        setSummary(s.data);

        setFleet(f.data);

        setDevices(
          (d.data || []).map((device: any) => {
            const latest = device.telemetry?.[0];

            const soc = latest?.soc || 0;

            return {
              id: device.id,
              name: device.deviceName,
              soc,
              socColor:
                soc >= 80 ? "#00E676" : soc >= 40 ? "#FFB300" : "#FF5252",

              voltage: latest?.voltage ? `${latest.voltage} V` : "-",

              current: latest?.current ? `${latest.current} A` : "-",

              temp: latest?.temperature ? `${latest.temperature}°C` : "-",

              status: device.status,

              statusColor: device.status === "ONLINE" ? "#00E676" : "#FF5252",
            };
          }),
        );

        setAlerts(
          (a.data || []).map((alert: any) => ({
            title: alert.title || alert.message || "Alert",
            sub: alert.device?.deviceName || "Unknown Device",
            time: "Recently",
            type: alert.severity === "CRITICAL" ? "critical" : "battery",
          })),
        );

        const socData = sd.data || {};

        const formattedSoc = [
          {
            label: "0 – 20%",
            count: socData["0-20"] || 0,
            pct: 0,
            color: "#FF5252",
          },
          {
            label: "20 – 40%",
            count: socData["20-40"] || 0,
            pct: 0,
            color: "#FF8C00",
          },
          {
            label: "40 – 60%",
            count: socData["40-60"] || 0,
            pct: 0,
            color: "#FFB300",
          },
          {
            label: "60 – 80%",
            count: socData["60-80"] || 0,
            pct: 0,
            color: "#4CAF50",
          },
          {
            label: "80 – 100%",
            count: socData["80-100"] || 0,
            pct: 0,
            color: "#00E676",
          },
        ];

        const total = formattedSoc.reduce((sum, item) => sum + item.count, 0);

        formattedSoc.forEach((item) => {
          item.pct = total ? Math.round((item.count / total) * 100) : 0;
        });

        setSocDist(formattedSoc);

        const trendData = (st.data || []).map((item: any) => ({
          time: new Date(item.recordedAt).getHours() + ":00",
          soc: Math.round(item.value),
        }));

        setSocTrend(trendData);

        setSocTrend(
          (st.data || []).map((item: any) => ({
            time: new Date(item.recordedAt).getHours() + ":00",
            soc: Math.round(item.value),
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    loading,
    summary,
    fleet,
    devices,
    alerts,
    socDist,
    socTrend,
  };
};
