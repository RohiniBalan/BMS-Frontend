"use client";
import { User } from "@/types/user";
import { formatDistanceToNow } from "date-fns";

interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
}

export default function UserTable({ users, onView }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <th className="text-left py-3 text-[#4A5A7A] font-medium">Name</th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">Email</th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">
              Phone Number
            </th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">
              Devices
            </th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">Role</th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">
              Status
            </th>

            <th className="text-left py-3 text-[#4A5A7A] font-medium">
              Last Login
            </th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-[#4A5A7A]">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <td className="py-4 text-white">{user.name}</td>

                <td className="py-4 text-white">{user.email}</td>

                <td className="py-4 text-white">{user.phoneNumber || "N/A"}</td>

                <td className="py-4">
                  <span
                    className="px-2 py-1 rounded-md text-xs"
                    style={{
                      background: "rgba(68,138,255,0.15)",
                      color: "#448AFF",
                    }}
                  >
                    {user.assignedDevices} Devices
                  </span>
                </td>

                <td className="py-4">
                  <span
                    className={
                      user.role === "ADMIN"
                        ? "text-yellow-400"
                        : "text-blue-400"
                    }
                  >
                    {user.role}
                  </span>
                </td>

                <td className="py-4">
                  <span
                    className={
                      user.status === "Active"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {user.status}
                  </span>
                </td>

                <td className="py-4 text-white">
                  {user.lastLoginAt
                    ? formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                      })
                    : "Never"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
