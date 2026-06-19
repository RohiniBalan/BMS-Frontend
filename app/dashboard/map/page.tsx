"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Battery,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  CheckCircle,
  MapPin,
  Activity,
  Thermometer,
  Zap,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/services/apiClient";

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

const STATUS_ORDER = ["ONLINE", "WARNING", "CRITICAL", "OFFLINE", "MAINTENANCE"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapDevice {
  id: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  status: string;
  latestSoc: number | null;
}

interface DeviceDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  soc: number;
  voltage: number;
  temperature: number;
  current: number;
  capacity: number;
  healthScore: number;
  batteryType: string | null;
  assignedTo: string | null;
  activeAlerts: number;
  lastSeen: string | null;
}

interface Fleet {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  criticalAlerts: number;
  fleetHealthScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 10) return "Just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function healthColor(s: number) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.yellow;
  return C.red;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub }: { label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, margin: 0 }}>{label}</p>
        <p style={{ color, fontSize: 24, fontWeight: 700, margin: "1px 0 0", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: C.sub, fontSize: 11, margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MapViewPage() {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const leafletLoadedRef = useRef(false);

  const [mapDevices, setMapDevices] = useState<MapDevice[]>([]);
  const [allDevices, setAllDevices] = useState<DeviceDetail[]>([]);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<(MapDevice & Partial<DeviceDetail>) | null>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(STATUS_ORDER));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Load Leaflet from CDN ─────────────────────────────────────────────────

  useEffect(() => {
    if (leafletLoadedRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      leafletLoadedRef.current = true;
      setMapReady(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  // ── Initialize Leaflet map ────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapElRef.current || mapRef.current) return;

    const L = (window as any).L;
    const map = L.map(mapElRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapReady]);

  // ── Fetch data ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [mapRes, devRes, fleetRes] = await Promise.allSettled([
        apiFetch("/devices/map"),
        apiFetch("/reports/devices"),
        apiFetch("/reports/fleet"),
      ]);
      if (mapRes.status === "fulfilled") setMapDevices(mapRes.value?.data ?? []);
      if (devRes.status === "fulfilled") setAllDevices(devRes.value?.data ?? []);
      if (fleetRes.status === "fulfilled") setFleet(fleetRes.value?.data ?? null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Refresh every 30s ─────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => fetchData(), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Sync markers whenever map/data/filter changes ─────────────────────────

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const L = (window as any).L;
    if (!L) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const visible = mapDevices.filter((d) => statusFilter.has(d.status));

    if (visible.length === 0) return;

    const bounds: [number, number][] = [];

    visible.forEach((d) => {
      const color = STATUS_COLOR[d.status] ?? C.sub;
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:30px;height:30px;border-radius:50%;
          background:${color};
          border:3px solid ${d.status === 'ONLINE' ? '#fff' : color};
          box-shadow:0 0 10px ${color}88;
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:800;color:#000;
          cursor:pointer;
          transition:transform 0.15s;
        ">${d.latestSoc != null ? Math.round(d.latestSoc) + "%" : "?"}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -20],
      });

      const detail = allDevices.find((a) => a.id === d.id);

      const popupContent = `
        <div style="
          background:#0C1426;color:#E8F0FF;border-radius:10px;
          padding:14px;min-width:200px;font-family:system-ui,sans-serif;
        ">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px">${d.deviceName}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>
            <span style="color:${color};font-weight:700;font-size:12px">${d.status}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:#0A1020;padding:6px 8px;border-radius:6px">
              <div style="color:#6B7FA3;font-size:10px">SOC</div>
              <div style="font-weight:700;color:#00E676">${d.latestSoc != null ? d.latestSoc.toFixed(1) + "%" : "—"}</div>
            </div>
            <div style="background:#0A1020;padding:6px 8px;border-radius:6px">
              <div style="color:#6B7FA3;font-size:10px">Voltage</div>
              <div style="font-weight:700;color:#448AFF">${detail ? detail.voltage.toFixed(1) + "V" : "—"}</div>
            </div>
            <div style="background:#0A1020;padding:6px 8px;border-radius:6px">
              <div style="color:#6B7FA3;font-size:10px">Temperature</div>
              <div style="font-weight:700;color:${detail && detail.temperature > 45 ? "#FF5252" : "#E8F0FF"}">${detail ? detail.temperature.toFixed(1) + "°C" : "—"}</div>
            </div>
            <div style="background:#0A1020;padding:6px 8px;border-radius:6px">
              <div style="color:#6B7FA3;font-size:10px">Health</div>
              <div style="font-weight:700;color:${detail ? healthColor(detail.healthScore) : "#6B7FA3"}">${detail ? detail.healthScore + "/100" : "—"}</div>
            </div>
          </div>
          ${d.locationName ? `<div style="margin-top:8px;color:#6B7FA3;font-size:11px">📍 ${d.locationName}</div>` : ""}
          ${detail ? `<div style="margin-top:6px;color:#6B7FA3;font-size:11px">Last seen: ${timeAgo(detail.lastSeen)}</div>` : ""}
        </div>`;

      const popup = L.popup({
        maxWidth: 240,
        className: "bms-popup",
      }).setContent(popupContent);

      const marker = L.marker([d.latitude, d.longitude], { icon })
        .bindPopup(popup)
        .addTo(mapRef.current);

      marker.on("click", () => {
        const merged = { ...d, ...(detail ?? {}) };
        setSelectedDevice(merged as any);
      });

      markersRef.current.set(d.id, marker);
      bounds.push([d.latitude, d.longitude]);
    });

    if (bounds.length > 0 && !selectedDevice) {
      try {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } catch { /* ignore */ }
    }
  }, [mapDevices, allDevices, statusFilter, mapReady, selectedDevice]);

  // ── Inject popup CSS once ─────────────────────────────────────────────────

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .bms-popup .leaflet-popup-content-wrapper {
        background: #0C1426 !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        padding: 0 !important;
      }
      .bms-popup .leaflet-popup-content { margin: 0 !important; }
      .bms-popup .leaflet-popup-tip { background: #0C1426 !important; }
      .bms-popup .leaflet-popup-close-button { color: #6B7FA3 !important; top: 8px !important; right: 10px !important; }
    `;
    document.head.appendChild(style);
    const cleanup: () => void = () => { document.head.removeChild(style); };
    return cleanup;
  }, []);

  // ── Fly to device ─────────────────────────────────────────────────────────

  const flyTo = (d: MapDevice) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([d.latitude, d.longitude], 13, { duration: 1.2 });
    const marker = markersRef.current.get(d.id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 1300);
    }
    const detail = allDevices.find((a) => a.id === d.id);
    setSelectedDevice({ ...d, ...(detail ?? {}) } as any);
  };

  // ── Filtered device lists ──────────────────────────────────────────────────

  const filteredList = allDevices.filter((d) => {
    if (!statusFilter.has(d.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.type ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const criticalDevices = allDevices
    .filter((d) => d.status === "WARNING" || d.activeAlerts > 0 || d.healthScore < 60 || d.temperature > 45 || d.soc < 15)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 8);

  const toggleStatus = (s: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", flexDirection: "column", gap: 12 }}>
        <MapPin size={36} style={{ color: C.blue, animation: "bounce 1s ease infinite" }} />
        <p style={{ color: C.sub, fontSize: 14 }}>Loading map data…</p>
        <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Fleet Map View</h1>
          <p style={{ color: C.sub, fontSize: 12, margin: "3px 0 0" }}>
            {mapDevices.length} devices with GPS · {allDevices.length} total
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent",
            color: C.text, cursor: "pointer", fontSize: 13,
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Fleet KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total" value={fleet?.totalDevices ?? 0} icon={<Battery size={18} />} color={C.blue} />
        <KpiCard label="Online" value={fleet?.onlineDevices ?? 0} icon={<Wifi size={18} />} color={C.green} />
        <KpiCard label="Warning" value={fleet?.warningDevices ?? 0} icon={<AlertTriangle size={18} />} color={C.yellow} />
        <KpiCard label="Critical Alerts" value={fleet?.criticalAlerts ?? 0} icon={<AlertTriangle size={18} />} color={C.red} />
        <KpiCard label="Offline" value={fleet?.offlineDevices ?? 0} icon={<WifiOff size={18} />} color={C.sub} sub={`${fleet?.fleetHealthScore ?? 0}% fleet health`} />
      </div>

      {/* ── Status Filters ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ color: C.sub, fontSize: 12, fontWeight: 600 }}>Filter:</span>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${statusFilter.has(s) ? STATUS_COLOR[s] : C.border}`,
              background: statusFilter.has(s) ? `${STATUS_COLOR[s]}18` : "transparent",
              color: statusFilter.has(s) ? STATUS_COLOR[s] : C.sub,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusFilter.has(s) ? STATUS_COLOR[s] : C.dim }} />
            {s}
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              ({allDevices.filter((d) => d.status === s).length})
            </span>
          </button>
        ))}
        <button
          onClick={() => setStatusFilter(new Set(STATUS_ORDER))}
          style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, cursor: "pointer" }}
        >
          Show All
        </button>
      </div>

      {/* ── Map + Right panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

        {/* Map */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", position: "relative" }}>
          {/* Map tile layer + Leaflet goes here */}
          <div
            ref={mapElRef}
            style={{ height: 520, width: "100%", zIndex: 0 }}
          />

          {!mapReady && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 10, background: C.card,
            }}>
              <MapPin size={32} style={{ color: C.blue, animation: "bounce 1s ease infinite" }} />
              <p style={{ color: C.sub, fontSize: 13 }}>Loading map…</p>
            </div>
          )}

          {mapReady && mapDevices.filter((d) => statusFilter.has(d.status)).length === 0 && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 8, pointerEvents: "none",
            }}>
              <MapPin size={32} style={{ color: C.dim }} />
              <p style={{ color: C.sub, fontSize: 13 }}>No devices match the current filter</p>
            </div>
          )}

          {/* Legend */}
          {mapReady && (
            <div style={{
              position: "absolute", bottom: 20, left: 12, zIndex: 1000,
              background: "rgba(7,14,27,0.9)", border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px", backdropFilter: "blur(8px)",
            }}>
              <p style={{ color: C.sub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "0 0 6px" }}>Legend</p>
              {[
                { label: "Online", color: C.green },
                { label: "Warning", color: C.yellow },
                { label: "Critical", color: C.red },
                { label: "Offline", color: C.sub },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ color: C.text, fontSize: 11 }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Device list + Critical */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.sub }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices…"
              style={{
                width: "100%", background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 10px 8px 30px", color: C.text, fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.sub }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Device list */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} color={C.blue} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>
                Device List
              </span>
              <span style={{ color: C.sub, fontSize: 11, marginLeft: "auto" }}>{filteredList.length} shown</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filteredList.length === 0 ? (
                <p style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: "24px 16px" }}>No devices match</p>
              ) : filteredList.map((d) => {
                const mapD = mapDevices.find((m) => m.id === d.id);
                const isSelected = selectedDevice?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => mapD ? flyTo(mapD) : setSelectedDevice(d as any)}
                    style={{
                      padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                      background: isSelected ? `${C.blue}10` : "transparent",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isSelected ? `${C.blue}10` : "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[d.status] ?? C.sub, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                        <p style={{ color: C.sub, fontSize: 10, margin: "1px 0 0" }}>
                          {mapD?.locationName ?? "No GPS"} · SOC: {d.soc}%
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {!mapD && <span style={{ fontSize: 9, color: C.dim, background: C.dim + "30", padding: "1px 5px", borderRadius: 3 }}>NO GPS</span>}
                      <ChevronRight size={13} color={C.dim} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Devices */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={13} color={C.yellow} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Needs Attention</span>
              {criticalDevices.length > 0 && (
                <span style={{ marginLeft: "auto", background: C.yellow, color: "#000", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                  {criticalDevices.length}
                </span>
              )}
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {criticalDevices.length === 0 ? (
                <div style={{ padding: "16px 14px", textAlign: "center" }}>
                  <CheckCircle size={22} color={C.green} style={{ margin: "0 auto 6px" }} />
                  <p style={{ color: C.green, fontSize: 12 }}>All devices healthy</p>
                </div>
              ) : criticalDevices.map((d) => {
                const issues: string[] = [];
                if (d.soc < 15) issues.push("Low SOC");
                if (d.temperature > 45) issues.push("High Temp");
                if (d.status === "WARNING") issues.push("Warning");
                if (d.activeAlerts > 0) issues.push(`${d.activeAlerts} Alert${d.activeAlerts > 1 ? "s" : ""}`);
                if (d.healthScore < 60) issues.push("Poor Health");

                const mapD = mapDevices.find((m) => m.id === d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => mapD ? flyTo(mapD) : setSelectedDevice(d as any)}
                    style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0 }}>{d.name}</p>
                      <span style={{ color: healthColor(d.healthScore), fontSize: 12, fontWeight: 700 }}>{d.healthScore}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      {issues.map((iss) => (
                        <span key={iss} style={{ background: `${C.red}15`, color: C.red, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{iss}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Selected Device Detail Panel ── */}
      {selectedDevice && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[selectedDevice.status] ?? C.sub }} />
              <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{selectedDevice.deviceName ?? (selectedDevice as any).name}</span>
              {(selectedDevice as any).locationName && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.sub, fontSize: 12 }}>
                  <MapPin size={11} /> {(selectedDevice as any).locationName}
                </span>
              )}
              <span style={{ color: STATUS_COLOR[selectedDevice.status], fontWeight: 700, fontSize: 12, background: `${STATUS_COLOR[selectedDevice.status]}18`, padding: "2px 8px", borderRadius: 5 }}>
                {selectedDevice.status}
              </span>
            </div>
            <button onClick={() => setSelectedDevice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
            {[
              { icon: <Battery size={16} />, label: "SOC", value: `${(selectedDevice as any).soc ?? selectedDevice.latestSoc ?? "—"}%`, color: C.green },
              { icon: <Zap size={16} />, label: "Voltage", value: `${(selectedDevice as any).voltage?.toFixed(2) ?? "—"} V`, color: C.blue },
              { icon: <Activity size={16} />, label: "Current", value: `${(selectedDevice as any).current?.toFixed(2) ?? "—"} A`, color: C.yellow },
              { icon: <Thermometer size={16} />, label: "Temperature", value: `${(selectedDevice as any).temperature?.toFixed(1) ?? "—"} °C`, color: (selectedDevice as any).temperature > 45 ? C.red : C.text },
              { icon: <Activity size={16} />, label: "Health", value: `${(selectedDevice as any).healthScore ?? "—"}/100`, color: healthColor((selectedDevice as any).healthScore ?? 0) },
              { icon: <AlertTriangle size={16} />, label: "Alerts", value: String((selectedDevice as any).activeAlerts ?? 0), color: (selectedDevice as any).activeAlerts > 0 ? C.red : C.green },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{ background: C.card2, borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, marginBottom: 6 }}>
                  <span style={{ color: C.dim }}>{icon}</span>
                  <span style={{ fontSize: 11 }}>{label}</span>
                </div>
                <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 20, color: C.sub, fontSize: 12 }}>
            <span>Type: <strong style={{ color: C.text }}>{(selectedDevice as any).type ?? "—"}</strong></span>
            <span>Assigned to: <strong style={{ color: C.text }}>{(selectedDevice as any).assignedTo ?? "—"}</strong></span>
            <span>Last seen: <strong style={{ color: C.text }}>{timeAgo((selectedDevice as any).lastSeen)}</strong></span>
            <span>Capacity: <strong style={{ color: C.text }}>{(selectedDevice as any).capacity ?? "—"} kWh</strong></span>
          </div>
        </div>
      )}

      {/* ── Full Device Table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={C.blue} />
          <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>All Devices — Location Table</span>
          <span style={{ color: C.sub, fontSize: 12, marginLeft: "auto" }}>{allDevices.length} total</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.card2 }}>
                {["Device", "Location", "Status", "SOC", "Voltage", "Temp", "Health", "Alerts", "Last Seen"].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: C.sub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDevices.slice(0, 50).map((d) => {
                const mapD = mapDevices.find((m) => m.id === d.id);
                return (
                  <tr
                    key={d.id}
                    onClick={() => mapD ? flyTo(mapD) : setSelectedDevice(d as any)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{d.name}</div>
                      <div style={{ color: C.sub, fontSize: 11 }}>{d.type}</div>
                    </td>
                    <td style={{ padding: "9px 14px", color: C.sub, fontSize: 12 }}>
                      {mapD?.locationName
                        ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />{mapD.locationName}</span>
                        : <span style={{ color: C.dim, fontSize: 11 }}>No GPS</span>}
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: `${STATUS_COLOR[d.status] ?? C.sub}18`,
                        color: STATUS_COLOR[d.status] ?? C.sub,
                        padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[d.status] ?? C.sub }} />
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ color: d.soc < 20 ? C.red : d.soc < 40 ? C.yellow : C.green, fontWeight: 700 }}>{d.soc}%</span>
                    </td>
                    <td style={{ padding: "9px 14px", color: C.blue, fontWeight: 600 }}>{d.voltage.toFixed(1)}V</td>
                    <td style={{ padding: "9px 14px", color: d.temperature > 45 ? C.red : C.text, fontWeight: 600 }}>{d.temperature.toFixed(1)}°C</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ color: healthColor(d.healthScore), fontWeight: 700 }}>{d.healthScore}</span>
                      <span style={{ color: C.sub, fontSize: 11 }}>/100</span>
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      {d.activeAlerts > 0
                        ? <span style={{ background: `${C.red}20`, color: C.red, fontWeight: 700, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{d.activeAlerts}</span>
                        : <CheckCircle size={14} color={C.green} />}
                    </td>
                    <td style={{ padding: "9px 14px", color: C.sub, fontSize: 12 }}>{timeAgo(d.lastSeen)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {allDevices.length > 50 && (
            <p style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: "12px 0" }}>
              Showing 50 of {allDevices.length} devices
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .leaflet-container { font-family: inherit !important; }
        input::placeholder { color: #6B7FA3; }
      `}</style>
    </div>
  );
}
