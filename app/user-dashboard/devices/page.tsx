"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Cpu } from "lucide-react";
import AddDeviceModal from "@/components/dashboard/AddDeviceModal";
import { getMyDevices } from "@/services/deviceService";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import DeviceCard from "@/components/dashboard/devices/DeviceCard";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";

export default function DevicesPage() {
  const router = useRouter();
  const { options, loading: optionsLoading } = useDropdownOptions();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [batteryTypeFilter, setBatteryTypeFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);

  const onlineDevices = devices.filter(
    (d: any) => d.status === "ONLINE",
  ).length;

  const offlineDevices = devices.filter(
    (d: any) => d.status === "OFFLINE",
  ).length;

  const filteredDevices = devices.filter((device: any) => {
    const searchMatch = device.deviceName
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const statusMatch = !statusFilter || device.status === statusFilter;

    const batteryMatch =
      !batteryTypeFilter ||
      device.registration?.batteryType === batteryTypeFilter;

    return searchMatch && statusMatch && batteryMatch;
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async (pageNumber = 1) => {
    try {
      const res = await getMyDevices({
        page: pageNumber,
        limit: 12,
      });

      const formattedDevices =
        res.data?.map((item: any) => ({
          ...item.device,

          registration: {
            batteryType: item.batteryType,
            dataSubscription: item.dataSubscription,
          },
        })) || [];

      setDevices(formattedDevices);
      setTotalDevices(res.pagination?.total || 0);

      setTotalPages(res.pagination?.totalPages || 1);

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

        <Button
          onClick={() => setShowAddDevice(true)}
          className="btn-primary px-4 py-2"
        >
          Add Device
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-[#8899BB]">
          Showing {filteredDevices.length} device(s)
        </div>

        <div className="text-sm text-[#8899BB]">Total: {totalDevices}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
      <div
        className="rounded-xl p-3"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device name..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0C1426] border border-white/10 rounded-xl px-4 py-3 text-white"
            disabled={optionsLoading}
          >
            <option value="">All Status</option>
            {options.deviceStatuses
              .filter((s) => s.value === "ONLINE" || s.value === "OFFLINE")
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
          </select>

          <select
            value={batteryTypeFilter}
            onChange={(e) => setBatteryTypeFilter(e.target.value)}
            className="bg-[#0C1426] border border-white/10 rounded-xl px-4 py-3 text-white"
            disabled={optionsLoading}
          >
            <option value="">All Battery Types</option>
            {options.batteryTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Cpu size={60} className="text-[#2D3A57]" />

          <h3 className="text-white text-lg mt-4">No devices assigned yet.</h3>

          <p className="text-[#8899BB] mt-2">
            Register you first battery device to start monitoring.
          </p>

          <Button
            onClick={() => setShowAddDevice(true)}
            className="btn-primary mt-5 px-5 py-2"
          >
            Register Device
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevices.map((device: any) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={(device: any) => {
                router.push(`/user-dashboard/devices/${device.id}`);
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button disabled={page === 1} onClick={() => loadDevices(page - 1)}>
          Prev
        </Button>

        <div className="text-[#8899BB]">
          Page {page} of {totalPages}
        </div>

        <Button
          disabled={page === totalPages}
          onClick={() => loadDevices(page + 1)}
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
    </div>
  );
}
