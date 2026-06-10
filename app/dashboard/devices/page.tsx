"use client";

import { useEffect, useState } from "react";
import { Cpu, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import AddDeviceModal from "@/components/dashboard/AddDeviceModal";
import { getDevices } from "@/services/deviceService";
import StatCard from "@/components/dashboard/StatCard";
import Input from "@/components/ui/Input";
import AssignDeviceModal from "@/components/dashboard/devices/AssignDeviceModal";
import DeviceTable from "@/components/dashboard/devices/DeviceTable";
import Button from "@/components/ui/Button";

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [batteryTypeFilter, setBatteryTypeFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);

  const limit = 30;

  const isAdmin = user?.role === "ADMIN";

  const onlineDevices = devices.filter(
    (d: any) => d.status === "ONLINE",
  ).length;

  const offlineDevices = devices.filter(
    (d: any) => d.status === "OFFLINE",
  ).length;

  const warningDevices = devices.filter(
    (d: any) => d.status === "WARNING",
  ).length;

  const filteredDevices = devices.filter((device: any) => {
    const searchMatch = device.deviceName
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const statusMatch = !statusFilter || device.status === statusFilter;

    const batteryMatch =
      !batteryTypeFilter ||
      device.registration?.batteryType === batteryTypeFilter;

    const assignmentMatch =
      !assignmentFilter ||
      (assignmentFilter === "ASSIGNED" ? !!device.user : !device.user);

    return searchMatch && statusMatch && batteryMatch && assignmentMatch;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    loadDevices();
  }, []);

  const loadDevices = async (pageNumber = 1) => {
    try {
      const res = await getDevices({
        page: pageNumber,
        limit: 30,
      });

      setDevices(res.devices || res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalDevices(res.pagnation?.total || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading devices...</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Devices</h1>

          <p className="text-sm mt-1" style={{ color: "#8899BB" }}>
            Manage and monitor battery devices
          </p>
        </div>

        <button
          onClick={() => setShowAddDevice(true)}
          className="btn-primary px-4 py-2"
        >
          {isAdmin ? "+ Add Device" : "+ Register Device"}
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-[#8899BB]">
          Showing {filteredDevices.length} device(s)
        </div>

        <div className="text-sm text-[#8899BB]">Total: {totalDevices}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Devices"
          value={totalDevices}
          icon={<Cpu size={13} style={{ color: "#FFB300" }} />}
        />

        <StatCard
          title="Online Devices"
          value={onlineDevices}
          icon={<Cpu size={13} style={{ color: "#00E676" }} />}
        />

        <StatCard
          title="Offline Devices"
          value={offlineDevices}
          icon={<Cpu size={13} style={{ color: "#FF5252" }} />}
        />

        <StatCard
          title="Warnings"
          value={warningDevices}
          icon={<AlertTriangle size={13} style={{ color: "#FF5252" }} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by device name..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0C1426] border border-white/10 rounded-xl px-4 py-3 text-white"
        >
          <option value="">All Status</option>
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="WARNING">WARNING</option>
        </select>

        <select
          value={batteryTypeFilter}
          onChange={(e) => setBatteryTypeFilter(e.target.value)}
          className="bg-[#0C1426] border border-white/10 rounded-xl px-4 py-3 text-white"
        >
          <option value="">All Battery Types</option>
          <option value="LITHIUM_IRON">Lithium Iron</option>
          <option value="LITHIUM_IRON_PHOSPHATE">Lithium Iron Phosphate</option>
          <option value="NICKEL_METAL_HYDRIDE">Nickel Metal Hydride</option>
          <option value="LEAD_ACID_BATTERIES">Lead Acid Batteries</option>
        </select>

        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
          className="bg-[#0C1426] border border-white/10 rounded-xl px-4 py-3 text-white"
        >
          <option value="">All Devices</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="UNASSIGNED">Unassigned</option>
        </select>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Cpu size={60} className="text-[#2D3A57]" />

          <h3 className="text-white text-lg mt-4">No Devices Found</h3>

          <p className="text-[#8899BB] mt-2">
            Register a battery device to start monitoring.
          </p>

          <Button
            onClick={() => setShowAddDevice(true)}
            className="btn-primary mt-5 px-5 py-2"
          >
            Register Device
          </Button>
        </div>
      ) : (
        <DeviceTable
          devices={filteredDevices}
          onView={(d) => router.push(`/dashboard/devices/${d.id}`)}
        />
      )}

      <div className="flex items-center justify-between mt-4 text-white">
        <Button
          onClick={() => {
            if (page > 1) loadDevices(page - 1);
          }}
          disabled={page === 1}
          className="px-4 py-2 bg-[#0C1426] border border-white/10 rounded disabled:opacity-40"
        >
          Prev
        </Button>

        <div className="text-sm text-[#8899BB]">
          Page {page} of {totalPages}
        </div>

        <Button
          onClick={() => {
            if (page < totalPages) loadDevices(page + 1);
          }}
          disabled={page === totalPages}
          className="px-4 py-2 bg-[#0C1426] border border-white/10 rounded disabled:opacity-40"
        >
          Next
        </Button>
      </div>

      <AddDeviceModal
        open={showAddDevice}
        onClose={() => {
          setShowAddDevice(false);
          loadDevices();
        }}
      />

      <AssignDeviceModal
        open={showAssignModal}
        deviceId={selectedDevice?.id}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedDevice(null);
        }}
        onAssigned={() => {
          loadDevices();
        }}
      />
    </div>
  );
}
