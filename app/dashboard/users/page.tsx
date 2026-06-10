"use client";

import { Users, UserCheck, Shield } from "lucide-react";
import { useState } from "react";
import { User } from "@/types/user";
import StatCard from "@/components/dashboard/StatCard";
import UserTable from "@/components/dashboard/users/UserTable";
import { useUsers } from "@/hooks/useUsers";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { loading, users } =  useUsers();

  const totalUsers = users.length;

const activeUsers = users.filter(
  (u) => u.status === "Active"
).length;

const adminUsers = users.filter(
  (u) => u.role === "ADMIN"
).length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
  return <div className="text-white">Loading...</div>;
}

  return (
    <div className="flex flex-col gap-5">
      {/* SUMMARY CARDS */}
      {/* Total User */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtext="Registered users"
          subtextColor="#00E676"
          icon={<Users size={13} style={{ color: "#00E676" }} />}
          iconBg="rgba(0,230,118,0.12)"
        />

        {/* Active User */}
        <StatCard
          title="Active Users"
          value={activeUsers}
          subtext="Currently active"
          subtextColor="#00E676"
          icon={<UserCheck size={13} style={{ color: "#448AFF" }} />}
          iconBg="rgba(68,138,255,0.12)"
        />

        {/* Admin's Count */}
        <StatCard
          title="Admin Users"
          value={adminUsers}
          subtext="System administrators"
          subtextColor="#FFB300"
          icon={<Shield size={13} style={{ color: "#FFB300" }} />}
          iconBg="rgba(255,179,0,0.12)"
        />
      </div>

      {/* USERS TABLE CARD */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "#0C1426",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Users Management</h3>

          <button
            className="text-xs transition-colors"
            style={{ color: "#00E676" }}
          >
            Export CSV
          </button>
        </div>

        {/* Filters */}
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user..."
            className="flex-1 h-10 rounded-lg px-3 text-sm outline-none"
            style={{
              background: "#09111F",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg px-3 text-sm"
            style={{
              background: "#09111F",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          >
            <option value="All">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg px-3 text-sm"
            style={{
              background: "#09111F",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <UserTable
          users={filteredUsers}
          onView={(user) => {
            setSelectedUser(user);
          }}
        />
      </div>
    </div>
  );
}
