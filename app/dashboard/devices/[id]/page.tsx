"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getDeviceById,
  updateDevice,
  deleteDevice,
} from "@/services/deviceService";
import Button from "@/components/ui/Button";
import AssignDeviceModal from "@/components/dashboard/devices/AssignDeviceModal";
import AddDeviceModal from "@/components/dashboard/AddDeviceModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import StatCard from "@/components/dashboard/StatCard";
import { BatteryCharging, Gauge, Thermometer, Zap } from "lucide-react";

export default function DeviceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  useEffect(() => {
    loadDevice();
  }, []);

  const loadDevice = async () => {
    try {
      const res = await getDeviceById(params.id);

      setDevice(res.data || res.device);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading device...</div>;
  }

  if (!device) {
    return <div className="text-red-400">Device not found</div>;
  }

  const telemetry = device.telemetry?.[0];

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = currentUser?.role === "ADMIN";

  // ownership / assignment checks
  const isAssignedUser = device.userId === currentUser.id;
  const isRegisteredByUser =
    device.registration?.registeredById === currentUser.id;

  // optional safety fallback
  const registeredByRole = device.registration?.registeredBy?.role;

  const canEdit = isAdmin || isAssignedUser || isRegisteredByUser;

  const canDelete = canEdit;

  // Handle Edit
  const handleUpdateDevice = async (form: any) => {
    try {
      await updateDevice(device.id, form);

      toast.success("✅ Device updated");
      setShowEditModal(false);
      loadDevice();
    } catch (err) {
      toast.error("❌ Update failed");
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    try {
      setShowDeleteLoading(true);

      await deleteDevice(device.id);

      toast.success("✅ Device deleted");

      window.location.href = "/dashboard/devices";
    } catch (err) {
      toast.error("❌ Delete failed");
    } finally {
      setShowDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-2xl p-6 flex justify-between items-start"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">
              {device.deviceName}
            </h1>

            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                device.status === "ONLINE"
                  ? "bg-green-500/20 text-green-400"
                  : device.status === "OFFLINE"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {device.status}
            </span>
          </div>

          <p className="text-[#8899BB] mt-2">Device ID: {device.id}</p>

          <p className="text-[#8899BB]">
            Owner: {device.user?.fullName || "Unassigned"}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && !device.userId && (
            <Button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600"
            >
              Assign User
            </Button>
          )}

          {canEdit && (
            <Button onClick={() => setShowEditModal(true)}>Edit</Button>
          )}

          {canDelete && (
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="SOC" value={`${telemetry?.soc ?? "--"}%`} icon={<BatteryCharging size={13} style={{ color: "#00E676" }} />} />

        <StatCard title="Voltage" value={`${telemetry?.voltage ?? "--"} V`} icon={<Zap size={13} style={{ color: "#FFB300" }} />} />

        <StatCard
          title="Temperature"
          value={`${telemetry?.temperature ?? "--"} °C`} icon={<Thermometer size={13} style={{ color: "#FF5252" }} />}
        />

        <StatCard title="Capacity" value={`${device.totalCapacityKWh} kWh`} icon={<Gauge size={13} style={{ color: "#60a5fa" }} />} />
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#0C1426",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2 className="text-lg text-green-400 mb-6">Device Information</h2>

            <div className="space-y-5">
              <Info label="Device Name" value={device.deviceName} />

              <Info label="Device ID" value={device.id} />

              <Info label="Serial Number" value={device.serialNumber} />

              <Info label="Status" value={device.status} />
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: "#0C1426",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2 className="text-lg text-green-400 mb-6">
              Assignment & Configuration
            </h2>

            <div className="space-y-5">
              <Info
                label="Assigned User"
                value={device.user?.fullName || "Unassigned"}
              />

              <Info
                label="Battery Type"
                value={device.registration?.batteryType || "--"}
              />

              <Info
                label="Data Subscription"
                value={device.registration?.dataSubscription || "--"}
              />

              <Info label="Capacity" value={`${device.totalCapacityKWh} kWh`} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg text-green-400">Live Telemetry</h2>

          <span className="text-green-400 text-sm">● LIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="SOC" value={`${telemetry?.soc ?? "--"}%`} icon={<BatteryCharging size={13} style={{ color: "#00E676" }} />}  />

          <StatCard
            title="Voltage"
            value={`${telemetry?.voltage ?? "--"} V`} icon={<Zap size={13} style={{ color: "#FFB300" }} />}
          />

          <StatCard
            title="Temperature"
            value={`${telemetry?.temperature ?? "--"} °C`} icon={<Thermometer size={13} style={{ color: "#FF5252" }} />}
          />
        </div>
      </div>
      <AssignDeviceModal
        open={showAssignModal}
        deviceId={device.id}
        onClose={() => setShowAssignModal(false)}
        onAssigned={() => {
          loadDevice();
        }}
      />

      <AddDeviceModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        prefill={{
          deviceId: device.id,
          deviceName: device.deviceName,
          dataSubscription: device.registration?.dataSubscription || "",
          batteryType: device.registration?.batteryType || "",
        }}
        onSubmit={handleUpdateDevice}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        loading={loading}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Device"
        entityName="this device"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <span className="text-[#8899BB] text-sm">{label}</span>

      <span className="text-white font-medium text-sm text-right">{value}</span>
    </div>
  );
}


