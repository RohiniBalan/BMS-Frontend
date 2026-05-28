"use client";
import { Bell, Maximize2, RefreshCw } from "lucide-react";

export default function DashboardHeader({
    onMenuClick,
    userName = "Admin User",
    userRole = "Administrator",
    initials = "AU",
  }: {
    onMenuClick?: () => void;
    userName?: string;
    userRole?: string;
    initials?: string;
  }) {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "#080F1E",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2">
        <button
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
          onClick={onMenuClick}
          style={{ color: "#8899BB" }}
        >
          ☰
        </button>
      </div>
      <div />
      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "#8899BB" }}
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
        {/* Fullscreen */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "#8899BB" }}
          title="Fullscreen"
        >
          <Maximize2 size={15} />
        </button>
        {/* Notifications */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center relative transition-colors"
          style={{ color: "#8899BB" }}
          title="Notifications"
        >
          <Bell size={15} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: "#FF5252" }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* User */}
        <div className="flex items-center gap-2">
          <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "rgba(0,230,118,0.15)", color: "#00E676" }}
        >
            {initials}
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">{userName}</p>
            <p className="text-xs leading-none mt-0.5" style={{ color: "#4A5A7A" }}>{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
