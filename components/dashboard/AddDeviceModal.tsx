"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { registerDevice } from "@/services/deviceService";

export default function AddDeviceModal({
  open,
  onClose,
  prefill,
}: any) {
  const [form, setForm] = useState({
    deviceId: "",
    deviceName: "",
    dataSubscription: "",
    batteryType: "",
  });

  useEffect(() => {
    if (prefill) setForm(prefill);
  }, [prefill]);

  if (!open) return null;

  const handleSubmit = async () => {
    await registerDevice(form);
    onClose();
  };

  const isFormValid =
  form.deviceId.trim() !== "" &&
  form.deviceName.trim() !== "" &&
  form.dataSubscription.trim() !== "" &&
  form.batteryType.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-[#0B1220] p-6 rounded-xl w-full max-w-md border border-[#00E676]/20 shadow-2xl">

        <h2 className="text-[#00E676] text-lg font-bold mb-4 text-center">Add Device</h2>

        <Input
          label="Device ID"
          value={form.deviceId}
          className="mb-3"
          onChange={(e) =>
            setForm({ ...form, deviceId: e.target.value })
          }
          disabled={!!prefill}
        />

        <Input
          label="Device Name"
          value={form.deviceName}
          className="mb-3"
          onChange={(e) =>
            setForm({ ...form, deviceName: e.target.value })
          }
        />

        <Input
          label="Data Subscription"
          value={form.dataSubscription}
          className="mb-3"
          onChange={(e) =>
            setForm({ ...form, dataSubscription: e.target.value })
          }
        />

        {/* <select
          className="input-field mt-3 w-full"
          value={form.dataSubscription}
          onChange={(e) =>
            setForm({ ...form, dataSubscription: e.target.value })
          }
        >
          <option>BASIC</option>
          <option>STANDARD</option>
          <option>PREMIUM</option>
        </select> */}
        <label className="text-xs mb-1 block" style={{ color: "#8899BB" }}>
          Battery Type
        </label>
        <select
          className="input-field mb-3 w-full"
          value={form.batteryType}
          onChange={(e) =>
            setForm({ ...form, batteryType: e.target.value })
          }
        >
          <option value="">Select battery type</option>
          <option value="LITHIUM_IRON">Lithium Iron</option>
          <option value="LITHIUM_IRON_PHOSPHATE">Lithium Iron Phosphate</option>
          <option value="NICKEL_METAL_HYDRIDE">Nickle Metal Hydride</option>
          <option value="LEAD_ACID_BATTERIES">Lead Acid</option>
        </select>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid}>
            Add Device
          </Button>
        </div>
      </div>
    </div>
  );
}