"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BatteryHealthPopup from "@/components/dashboard/BatteryHealthPopup";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

const userProfile = {
  userName: "Standard User",
  userRole: "User",
  initials: "SU",
};

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<UserDashboardShell>{children}</UserDashboardShell>}>
      <UserDashboardLayoutContent>{children}</UserDashboardLayoutContent>
    </Suspense>
  );
}

function UserDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHealthPopup, setShowHealthPopup] = useState(
    searchParams.get("showHealthPopup") === "1"
  );

  const handleHealthPopupOk = () => {
    setShowHealthPopup(false);
    router.replace("/user-dashboard");
  };

  if (showHealthPopup) {
    return <BatteryHealthPopup onOk={handleHealthPopupOk} okHref="/user-dashboard" />;
  }

  return (
    <div className="flex h-screen bg-[#050B18] overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar role="user" {...userProfile} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-[260px] h-full bg-[#080F1E]">
            <Sidebar role="user" {...userProfile} />
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} {...userProfile} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function UserDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#050B18] overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar role="user" {...userProfile} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader {...userProfile} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
