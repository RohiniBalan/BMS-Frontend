"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BatteryHealthPopup from "@/components/dashboard/BatteryHealthPopup";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";


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
  const [userProfile, setUserProfile] = useState({
    userName: "User",
    userRole: "User",
    initials: "U",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHealthPopup, setShowHealthPopup] = useState(
    searchParams.get("showHealthPopup") === "1"
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      const userName =
        user.fullName ||
        user.name ||
        user.email?.split("@")[0] ||
        "User";

      const initials = userName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();

      setUserProfile({
        userName,
        userRole:
          user.role === "ADMIN"
            ? "Administrator"
            : "User",
        initials,
      });
    }
  }, []);

  

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
        <Sidebar role="USER" {...userProfile} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-[260px] h-full bg-[#080F1E]">
            <Sidebar role="USER" {...userProfile} />
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
  const userProfile = {
    userName: "User",
    userRole: "User",
    initials: "U",
  };

  return (
    <div className="flex h-screen bg-[#050B18] overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar role="USER" {...userProfile} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onMenuClick={() => {}}
          {...userProfile}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
