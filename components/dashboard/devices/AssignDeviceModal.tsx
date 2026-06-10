"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/services/userService";
import { assignDevice } from "@/services/deviceService";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";

export default function AssignDeviceModal({
  open,
  deviceId,
  onClose,
  onAssigned,
}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();

      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
  if (!selectedUser) {
    toast.error("Select a user");
    return;
  }

  try {
    await assignDevice(deviceId, selectedUser);

    toast.success("Device assigned successfully 🎉");

    onAssigned?.();
    onClose();
  } catch (err: any) {
    toast.error(err?.message || "Assignment failed");
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0C1426] rounded-2xl p-6 w-[450px]">
        <h2 className="text-xl text-white mb-4">Assign Device</h2>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#111827] text-white"
        >
          <option value="">Select User</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleAssign}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
