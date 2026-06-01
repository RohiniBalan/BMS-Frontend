import { API_BASE} from "./apiClient";

class LiveStreamService {
  private eventSource: EventSource | null = null;

  connect(
    onData: (data: any) => void,
    onError?: (err: any) => void
  ) {
    this.disconnect(); // prevent duplicate connections

    const url = `${API_BASE}/live/stream`;
    
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      const raw = JSON.parse(event.data);

      onData({
        time: Number(raw.time) || 0,
        soc: Number(raw.soc) || 0,
        alerts: raw.alerts || [],
      });
    };

    this.eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      onError?.(err);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const liveStreamService = new LiveStreamService();