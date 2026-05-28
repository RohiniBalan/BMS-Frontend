// import Sidebar from "@/components/dashboard/Sidebar";
// import DashboardHeader from "@/components/dashboard/Header";

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  
//   return (
//     <div className="flex h-screen overflow-hidden" style={{ background: "#050B18" }}>
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <DashboardHeader />
//         <main className="flex-1 overflow-y-auto p-6">{children}</main>
//       </div>
//     </div>
//   );
// }
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BatteryHealthPopup from "@/components/dashboard/BatteryHealthPopup";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShell>{children}</DashboardShell>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHealthPopup, setShowHealthPopup] = useState(
    searchParams.get("showHealthPopup") === "1"
  );

  const handleHealthPopupOk = () => {
    setShowHealthPopup(false);
    router.replace("/dashboard");
  };

  if (showHealthPopup) {
    return <BatteryHealthPopup onOk={handleHealthPopupOk} okHref="/dashboard" />;
  }

  return (
    <div className="flex h-screen bg-[#050B18] overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">

          {/* Sidebar LEFT */}
          <div className="w-[260px] h-full bg-[#080F1E]">
            <Sidebar />
          </div>

          {/* Overlay RIGHT */}
          <div
            className="flex-1 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#050B18] overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
