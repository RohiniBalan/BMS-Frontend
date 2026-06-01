import { useEffect, useState } from "react";
import { liveStreamService } from "@/services/liveStreamService";
import { toast } from "react-toastify";

export function useLiveStream() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    liveStreamService.connect((data) => {
      setChartData((prev) => {
        const updated = [...prev, data];
        return updated.slice(-20);
      });

      if (data.alerts?.length) {
        setAlerts((prev) => [...prev, ...data.alerts]);

        data.alerts.forEach((a: any) => {
          toast.warn(`${a.title} - ${a.sub}`);
        });
      }
    });

    return () => {
      liveStreamService.disconnect();
    };
  }, []);

  return { chartData, alerts };
}
