"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Battery,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Activity,
  Thermometer,
  Zap,
  Clock,
  ChevronDown,
  CheckCircle,
  Info,
  Navigation,
} from "lucide-react";
import { apiFetch } from "@/services/apiClient";
import { getMyDevices } from "@/services/deviceService";
import { getUserAlertReport } from "@/services/reportService";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  green: "#00E676",
  blue: "#448AFF",
  yellow: "#FFB300",
  red: "#FF5252",
  purple: "#AB47BC",
  card: "#0C1426",
  card2: "#0A1020",
  border: "rgba(255,255,255,0.06)",
  dim: "#2A3A5A",
  sub: "#6B7FA3",
  text: "#E8F0FF",
  bg: "#070E1B",
} as const;

const STATUS_COLOR: Record<string, string> = {
  ONLINE: "#00E676",
  OFFLINE: "#6B7FA3",
  WARNING: "#FFB300",
  CRITICAL: "#FF5252",
  MAINTENANCE: "#FF6D00",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#FF5252",
  WARNING: "#FFB300",
  INFO: "#448AFF",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 10) return "Just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function healthScore(soc: number, temperature: number, status: string): number {
  let score = 100;
  if (soc < 20) score -= 25;
  else if (soc < 40) score -= 10;
  if (temperature > 50) score -= 25;
  else if (temperature > 40) score -= 10;
  if (status === "OFFLINE") score -= 15;
  else if (status === "WARNING") score -= 8;
  return Math.max(0, score);
}

function healthColor(s: number) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.yellow;
  return C.red;
}

function socColor(soc: number) {
  if (soc >= 50) return C.green;
  if (soc >= 20) return C.yellow;
  return C.red;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, margin: 0 }}>{label}</p>
        <p style={{ color, fontSize: 22, fontWeight: 700, margin: "2px 0 0", lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "pulseRing 1.5s ease-out infinite" }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
    </span>
  );
}

function NoGPS() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: 32 }}>
      <MapPin size={48} style={{ color: C.dim, opacity: 0.5 }} />
      <p style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>No GPS Coordinates</p>
      <p style={{ color: C.sub, fontSize: 13, textAlign: "center", margin: 0 }}>
        This device does not have GPS coordinates configured.
        Contact your administrator to enable location tracking.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserMapPage() {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);

  const [devices, setDevices] = useState<any[]>([]);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [live, setLive] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Derived values ────────────────────────────────────────────────────────

  const device = selectedReg?.device;
  const deviceId = selectedReg?.deviceId;
  const status = device?.status ?? "OFFLINE";
  const lat: number | null = device?.latitude ?? null;
  const lng: number | null = device?.longitude ?? null;
  const locationName: string | null = device?.locationName ?? null;
  const score = live ? healthScore(live.soc ?? 0, live.temperature ?? 0, status) : 0;

  // ── Load Leaflet ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (leafletLoadedRef.current) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => { leafletLoadedRef.current = true; setMapReady(true); };
    document.head.appendChild(script);

    const popupStyle = document.createElement("style");
    popupStyle.textContent = `
      .bms-user-popup .leaflet-popup-content-wrapper {
        background: #0C1426 !important; border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important; padding: 0 !important;
      }
      .bms-user-popup .leaflet-popup-content { margin: 0 !important; }
      .bms-user-popup .leaflet-popup-tip { background: #0C1426 !important; }
      .bms-user-popup .leaflet-popup-close-button { color: #6B7FA3 !important; top: 8px !important; right: 10px !important; }
    `;
    document.head.appendChild(popupStyle);
  }, []);

  // ── Init map ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapElRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(mapElRef.current, { center: [20.5937, 78.9629], zoom: 5, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [mapReady]);

  // ── Update marker when device or live data changes ─────────────────────

  useEffect(() => {
    if (!mapRef.current || !mapReady || lat === null || lng === null) return;
    const L = (window as any).L;
    if (!L) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const color = STATUS_COLOR[status] ?? C.sub;
    const socVal = live?.soc != null ? Math.round(live.soc) + "%" : "—";

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center">
          <div style="
            position:absolute;width:52px;height:52px;border-radius:50%;
            background:${color};opacity:0.2;
            animation:pulseMap 2s ease-out infinite;
          "></div>
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:${color};border:3px solid #fff;
            box-shadow:0 0 16px ${color}88;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:800;color:#000;
            position:relative;z-index:1;
          ">${socVal}</div>
        </div>`,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      popupAnchor: [0, -30],
    });

    const popupHtml = `
      <div style="background:#0C1426;color:#E8F0FF;border-radius:10px;padding:16px;min-width:220px;font-family:system-ui,sans-serif;">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${selectedReg?.deviceName ?? "My Device"}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>
          <span style="color:${color};font-weight:700;font-size:12px">${status}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#0A1020;padding:8px;border-radius:7px">
            <div style="color:#6B7FA3;font-size:10px">SOC</div>
            <div style="font-weight:700;color:#00E676;font-size:16px">${live?.soc != null ? live.soc.toFixed(1) + "%" : "—"}</div>
          </div>
          <div style="background:#0A1020;padding:8px;border-radius:7px">
            <div style="color:#6B7FA3;font-size:10px">Voltage</div>
            <div style="font-weight:700;color:#448AFF;font-size:16px">${live?.voltage != null ? live.voltage.toFixed(1) + "V" : "—"}</div>
          </div>
          <div style="background:#0A1020;padding:8px;border-radius:7px">
            <div style="color:#6B7FA3;font-size:10px">Temperature</div>
            <div style="font-weight:700;color:${live?.temperature > 45 ? "#FF5252" : "#E8F0FF"};font-size:16px">${live?.temperature != null ? live.temperature.toFixed(1) + "°C" : "—"}</div>
          </div>
          <div style="background:#0A1020;padding:8px;border-radius:7px">
            <div style="color:#6B7FA3;font-size:10px">Health</div>
            <div style="font-weight:700;font-size:16px;color:${score >= 80 ? "#00E676" : score >= 60 ? "#FFB300" : "#FF5252"}">${score}/100</div>
          </div>
        </div>
        ${locationName ? `<div style="margin-top:10px;color:#6B7FA3;font-size:12px;display:flex;align-items:center;gap:4px">📍 ${locationName}</div>` : ""}
        <div style="margin-top:6px;color:#6B7FA3;font-size:11px">Updated: ${timeAgo(live?.recordedAt)}</div>
      </div>`;

    const marker = L.marker([lat, lng], { icon })
      .bindPopup(L.popup({ maxWidth: 260, className: "bms-user-popup" }).setContent(popupHtml))
      .addTo(mapRef.current);

    markerRef.current = marker;
    mapRef.current.flyTo([lat, lng], 13, { duration: 1 });
    setTimeout(() => marker.openPopup(), 1200);
  }, [lat, lng, status, live, selectedReg, mapReady, score]);

  // ── Load devices ──────────────────────────────────────────────────────────

  useEffect(() => {
    getMyDevices()
      .then((res: any) => {
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        setDevices(list);
        if (list.length > 0) setSelectedReg(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch telemetry + alerts ───────────────────────────────────────────────

  const fetchLive = useCallback(async (id: string, reg: any, showRefreshing = false) => {
    if (!id) return;
    if (showRefreshing) setRefreshing(true);
    try {
      const [telRes, alertRes] = await Promise.allSettled([
        apiFetch(`/telemetry/${id}/latest`),
        getUserAlertReport({ deviceId: id }),
      ]);
      if (telRes.status === "fulfilled" && telRes.value?.data) {
        setLive(telRes.value.data);
      }
      if (alertRes.status === "fulfilled") {
        const data = (alertRes.value as any)?.data;
        setAlerts((data?.alerts ?? []).filter((a: any) => !a.isResolved).slice(0, 10));
      }
    } finally {
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    if (deviceId) fetchLive(deviceId, selectedReg);
  }, [deviceId, selectedReg, fetchLive]);

  useEffect(() => {
    if (!deviceId) return;
    const id = setInterval(() => fetchLive(deviceId, selectedReg), 30_000);
    return () => clearInterval(id);
  }, [deviceId, selectedReg, fetchLive]);

  // ── Switch device ─────────────────────────────────────────────────────────

  const switchDevice = (reg: any) => {
    setSelectedReg(reg);
    setLive(null);
    setAlerts([]);
    setDropdownOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 12 }}>
        <MapPin size={32} style={{ color: C.blue, animation: "bounce 1s ease infinite" }} />
        <p style={{ color: C.sub, fontSize: 14 }}>Loading your map…</p>
        <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
        <Battery size={48} style={{ color: C.dim }} />
        <p style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>No device assigned</p>
        <p style={{ color: C.sub, fontSize: 13 }}>Contact your administrator to assign a battery device.</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pulse color={STATUS_COLOR[status] ?? C.sub} />
          <div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>My Device Map</h1>
            <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>
              {lat !== null ? `📍 ${locationName ?? `${lat.toFixed(4)}, ${lng!.toFixed(4)}`}` : "No GPS location available"} · Updated {timeAgo(lastRefresh.toISOString())}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Device selector */}
          {devices.length > 1 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.card, color: C.text, cursor: "pointer", fontSize: 13,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status] ?? C.sub }} />
                {selectedReg?.deviceName ?? "Select"}
                <ChevronDown size={13} color={C.sub} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", background: C.card2,
                  border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 9999, minWidth: 200, overflow: "hidden",
                }}>
                  {devices.map((reg) => (
                    <button
                      key={reg.deviceId}
                      onClick={() => switchDevice(reg)}
                      style={{
                        width: "100%", textAlign: "left", padding: "10px 14px", background: "none",
                        border: "none", cursor: "pointer", fontSize: 13,
                        color: reg.deviceId === deviceId ? C.green : C.text,
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[reg.device?.status ?? "OFFLINE"] ?? C.sub, display: "inline-block", flexShrink: 0 }} />
                      {reg.deviceName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Center map */}
          {lat !== null && mapRef.current && (
            <button
              onClick={() => { mapRef.current?.flyTo([lat, lng], 14, { duration: 1 }); markerRef.current?.openPopup(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.blue, cursor: "pointer", fontSize: 13 }}
            >
              <Navigation size={13} />
              Center
            </button>
          )}

          <button
            onClick={() => fetchLive(deviceId, selectedReg, true)}
            disabled={refreshing || !deviceId}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Status strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <StatBadge icon={<Battery size={18} />} label="State of Charge"
          value={live?.soc != null ? `${live.soc.toFixed(1)}%` : "—"}
          color={live?.soc != null ? socColor(live.soc) : C.sub} />
        <StatBadge icon={status === "ONLINE" ? <Wifi size={18} /> : <WifiOff size={18} />} label="Status"
          value={status} color={STATUS_COLOR[status] ?? C.sub} />
        <StatBadge icon={<Activity size={18} />} label="Health Score"
          value={`${score}/100`} color={healthColor(score)} />
        <StatBadge icon={<Clock size={18} />} label="Last Updated"
          value={timeAgo(live?.recordedAt)} color={C.blue} />
      </div>

      {/* ── Map + side panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>

        {/* Map */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", position: "relative", minHeight: 500 }}>
          <div ref={mapElRef} style={{ height: 500, width: "100%" }} />

          {!mapReady && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, background: C.card }}>
              <MapPin size={32} style={{ color: C.blue, animation: "bounce 1s ease infinite" }} />
              <p style={{ color: C.sub, fontSize: 13 }}>Loading map…</p>
            </div>
          )}

          {mapReady && lat === null && <NoGPS />}

          {/* Coordinate badge */}
          {mapReady && lat !== null && (
            <div style={{
              position: "absolute", bottom: 14, left: 12, zIndex: 1000,
              background: "rgba(7,14,27,0.88)", border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <MapPin size={12} color={STATUS_COLOR[status] ?? C.sub} />
              <div>
                <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0 }}>
                  {locationName ?? "Location"}
                </p>
                <p style={{ color: C.sub, fontSize: 10, margin: "1px 0 0" }}>
                  {lat.toFixed(5)}, {lng!.toFixed(5)}
                </p>
              </div>
            </div>
          )}

          {/* Status legend overlay */}
          {mapReady && lat !== null && (
            <div style={{
              position: "absolute", top: 10, right: 10, zIndex: 1000,
              background: "rgba(7,14,27,0.88)", border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px", backdropFilter: "blur(6px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[status] ?? C.sub }} />
                <span style={{ color: STATUS_COLOR[status] ?? C.sub, fontSize: 12, fontWeight: 700 }}>{status}</span>
              </div>
              <p style={{ color: C.sub, fontSize: 10, margin: "3px 0 0" }}>{selectedReg?.deviceName}</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Device Info */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={14} color={C.blue} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Device Information</span>
            </div>
            <div style={{ padding: "8px 16px" }}>
              {[
                { label: "Device Name", value: selectedReg?.deviceName },
                { label: "Type", value: device?.deviceType },
                { label: "Serial No.", value: device?.serialNumber },
                { label: "Battery Type", value: selectedReg?.batteryType },
                { label: "Capacity", value: device?.totalCapacityKWh ? `${device.totalCapacityKWh} kWh` : null },
                { label: "Status", value: status },
                { label: "Location", value: locationName },
                { label: "Coordinates", value: lat !== null ? `${lat!.toFixed(4)}, ${lng!.toFixed(4)}` : null },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
                  <span style={{
                    color: label === "Status" ? (STATUS_COLOR[value ?? ""] ?? C.text) : C.text,
                    fontSize: 12, fontWeight: label === "Status" ? 700 : 500,
                  }}>
                    {value ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Readings */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={14} color={C.green} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Live Readings</span>
              <span style={{ marginLeft: "auto", color: C.sub, fontSize: 11 }}>{timeAgo(live?.recordedAt)}</span>
            </div>
            <div style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: <Battery size={14} />, label: "SOC", value: live?.soc != null ? `${live.soc.toFixed(1)}%` : "—", color: live?.soc != null ? socColor(live.soc) : C.sub },
                { icon: <Zap size={14} />, label: "Voltage", value: live?.voltage != null ? `${live.voltage.toFixed(2)} V` : "—", color: C.blue },
                { icon: <Activity size={14} />, label: "Current", value: live?.current != null ? `${live.current.toFixed(2)} A` : "—", color: C.yellow },
                { icon: <Thermometer size={14} />, label: "Temp", value: live?.temperature != null ? `${live.temperature.toFixed(1)} °C` : "—", color: live?.temperature > 45 ? C.red : C.text },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ background: C.card2, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, marginBottom: 4 }}>
                    <span style={{ color: C.dim }}>{icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
                  </div>
                  <div style={{ color, fontSize: 16, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Alerts + Location Info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Active Alerts */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} color={C.red} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Active Alerts</span>
            {alerts.length > 0 && (
              <span style={{ marginLeft: "auto", background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>{alerts.length}</span>
            )}
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {alerts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px", gap: 8 }}>
                <CheckCircle size={28} color={C.green} />
                <p style={{ color: C.green, fontSize: 13, fontWeight: 600, margin: 0 }}>No Active Alerts</p>
                <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>Battery operating normally</p>
              </div>
            ) : alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${SEVERITY_COLOR[a.severity] ?? C.sub}`,
                  background: `${SEVERITY_COLOR[a.severity] ?? C.sub}08`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: SEVERITY_COLOR[a.severity], fontWeight: 700, fontSize: 11 }}>{a.severity}</span>
                  <span style={{ color: C.sub, fontSize: 10 }}>{timeAgo(a.createdAt)}</span>
                </div>
                <p style={{ color: C.text, fontSize: 13, margin: "4px 0 2px" }}>{a.message}</p>
                <p style={{ color: C.sub, fontSize: 11, margin: 0 }}>{a.alertType}</p>
                {locationName && (
                  <p style={{ color: C.sub, fontSize: 10, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={9} /> {locationName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Location Details */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={14} color={C.blue} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Location Details</span>
          </div>
          <div style={{ padding: 16 }}>
            {lat !== null ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${STATUS_COLOR[status] ?? C.sub}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={20} color={STATUS_COLOR[status] ?? C.sub} />
                  </div>
                  <div>
                    <p style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{locationName ?? "Known Location"}</p>
                    <p style={{ color: C.sub, fontSize: 12, margin: "2px 0 0" }}>GPS coordinates available</p>
                  </div>
                </div>

                {[
                  { label: "Latitude", value: lat.toFixed(6) },
                  { label: "Longitude", value: lng!.toFixed(6) },
                  { label: "Location Name", value: locationName ?? "Not set" },
                  { label: "GPS Status", value: "Active" },
                  { label: "Last Location Update", value: timeAgo(live?.recordedAt) },
                  { label: "Device Status at Location", value: status },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.sub, fontSize: 12 }}>{label}</span>
                    <span style={{ color: label === "Device Status at Location" ? (STATUS_COLOR[value] ?? C.text) : C.text, fontSize: 12, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

                {/* Open in maps button */}
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 14, padding: "9px 0", borderRadius: 8,
                    background: `${C.blue}18`, border: `1px solid ${C.blue}30`,
                    color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  <Navigation size={14} />
                  Open in Google Maps
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 8 }}>
                <MapPin size={36} style={{ color: C.dim }} />
                <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>No GPS Data</p>
                <p style={{ color: C.sub, fontSize: 12, textAlign: "center", margin: 0 }}>
                  Location tracking is not enabled for this device.
                  Contact your administrator to configure GPS coordinates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes pulseMap { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.2); opacity: 0; } }
        .leaflet-container { font-family: inherit !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
