"use client";

import { Users, UserCheck, Shield, CircleUserRound  } from "lucide-react";
import { useState, useEffect } from "react";
import { User } from "@/types/user";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import UserTable from "@/components/dashboard/users/UserTable";
import { getUsers } from "@/services/userService";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const limit = 30;

  const activeUsers = users.filter((u) => u.status === "Active").length;

  const adminUsers = users.filter((u) => u.role === "ADMIN").length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const loadUsers = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await getUsers(pageNumber, 30);

      console.log("Users API Response:", res);

      setUsers(res.data || []);
      setTotalUsers(res.data?.length || 0);
      setTotalPages(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

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
        {filteredUsers.length > 0 ? (
          <UserTable
            users={filteredUsers}
            onView={(user) => {
              setSelectedUser(user);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
          <CircleUserRound  size={64} className="text-[#2D3A57]" />

          <h3 className="text-white text-lg mt-4">No Users Found</h3>
        </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-white">
        <Button
          onClick={() => {
            if (page > 1) setPage(page - 1);
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
            if (page < totalPages) setPage(page + 1);
          }}
          disabled={page === totalPages}
          className="px-4 py-2 bg-[#0C1426] border border-white/10 rounded disabled:opacity-40"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
