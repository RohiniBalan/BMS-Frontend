"use client";

import { X } from "lucide-react";
import AlertBadge from "./AlertBadge";

type AlertDetailsDrawerProps = {
  alert: any | null;
  open: boolean;
  onClose: () => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  return new Date(value).toLocaleString();
};

const formatDuration = (from?: string, to?: string) => {
  if (!from) return "--";
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) return `${remaining} min`;
  return `${hours}h ${remaining}m`;
};

const getSeverityTone = (severity: string): "critical" | "warning" | "info" => {
  if (severity === "CRITICAL") return "critical";
  if (severity === "WARNING") return "warning";
  return "info";
};

export default function AlertDetailsDrawer({
  alert,
  open,
  onClose,
}: AlertDetailsDrawerProps) {
  if (!open || !alert) return null;

  const status = alert.isResolved
    ? "Resolved"
    : alert.isAcknowledged
    ? "Acknowledged"
    : "Active";

  const statusTone = alert.isResolved
    ? "resolved"
    : alert.isAcknowledged
    ? "acknowledged"
    : "active";

  const snapshot = alert.sensorSnapshot;

  const timeline = [
    { label: "Alert Triggered", time: alert.createdAt },
    alert.acknowledgedAt
      ? { label: "User Acknowledged", time: alert.acknowledgedAt }
      : null,
    alert.resolvedAt ? { label: "Alert Resolved", time: alert.resolvedAt } : null,
  ].filter(Boolean) as { label: string; time: string }[];

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60">
      <button
        aria-label="Close alert details"
        className="flex-1 cursor-default"
        onClick={onClose}
      />

      <aside className="h-full w-full max-w-xl overflow-y-auto bg-[#080F1E] border-l border-white/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4A5A7A]">
              Alert Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              ALT-{String(alert.id).slice(0, 6).toUpperCase()}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-white/10 flex items-center justify-center text-[#8899BB] hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <AlertBadge
            label={alert.severity}
            tone={getSeverityTone(alert.severity)}
          />
          <AlertBadge label={status} tone={statusTone} />
        </div>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Device Information</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Info label="Device Name" value={alert.device?.deviceName} />
            <Info label="Serial Number" value={alert.device?.serialNumber} />
            <Info label="Battery Type" value={alert.device?.registration?.batteryType} />
            <Info label="Assigned User" value={alert.device?.user?.fullName || "Unassigned"} />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Alert Information</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Info label="Alert Type" value={alert.alertType} />
            <Info label="Severity" value={alert.severity} />
            <Info label="Triggered Time" value={formatDateTime(alert.createdAt)} />
            <Info label="Duration" value={formatDuration(alert.createdAt, alert.resolvedAt)} />
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#4A5A7A]">Message</p>
            <p className="mt-1 text-sm text-white">{alert.message || "--"}</p>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Sensor Snapshot</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="SOC" value={snapshot?.soc ?? "--"} suffix={snapshot ? "%" : ""} />
            <Metric label="Voltage" value={snapshot?.voltage ?? "--"} suffix={snapshot ? "V" : ""} />
            <Metric label="Current" value={snapshot?.current ?? "--"} suffix={snapshot ? "A" : ""} />
            <Metric label="Temperature" value={snapshot?.temperature ?? "--"} suffix={snapshot ? "C" : ""} />
          </div>
          <p className="mt-3 text-xs text-[#4A5A7A]">
            Snapshot time: {formatDateTime(snapshot?.recordedAt)}
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-[#0C1426] p-4">
          <h3 className="text-sm font-semibold text-white">Alert Timeline</h3>
          <div className="mt-4 flex flex-col gap-4">
            {timeline.map((item) => (
              <div key={`${item.label}-${item.time}`} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#00E676]" />
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#8899BB]">{formatDateTime(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-[#4A5A7A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value || "--"}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix: string;
}) {
  return (
    <div className="rounded-lg bg-[#09111F] border border-white/10 p-3">
      <p className="text-xs text-[#4A5A7A]">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">
        {value}
        {suffix}
      </p>
    </div>
  );
}
