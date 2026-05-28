"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Bell,
  BarChart2,
  FileText,
  Map,
  Users,
  Settings,
  ClipboardList,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

type UserRole = "admin" | "user";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

const buildMainNav = (basePath: string): NavItem[] => [
  { label: "Dashboard", href: basePath, icon: LayoutDashboard },
  { label: "Devices", href: `${basePath}/devices`, icon: Cpu },
  { label: "Live Monitor", href: `${basePath}/monitor`, icon: Activity },
  { label: "Alerts", href: `${basePath}/alerts`, icon: Bell, badge: 3 },
];

const buildAnalyticsNav = (basePath: string): NavItem[] => [
  { label: "Analytics", href: `${basePath}/analytics`, icon: BarChart2 },
  { label: "Reports", href: `${basePath}/reports`, icon: FileText },
  { label: "Map View", href: `${basePath}/map`, icon: Map },
];

const adminNav: NavItem[] = [
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Audit Logs", href: "/dashboard/audit", icon: ClipboardList },
  { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];

const buildUserNav = (basePath: string): NavItem[] => [
  { label: "Settings", href: `${basePath}/settings`, icon: Settings },
  { label: "Help & Support", href: `${basePath}/help`, icon: HelpCircle },
];

interface NavSectionProps {
  title: string;
  items: NavItem[];
  pathname: string;
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-3" style={{ color: "#4A5A7A" }}>
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group"
                style={{
                  background: active ? "rgba(0,230,118,0.1)" : "transparent",
                  color: active ? "#00E676" : "#8899BB",
                  borderLeft: active ? "2px solid #00E676" : "2px solid transparent",
                }}
              >
                <Icon
                  size={16}
                  style={{ color: active ? "#00E676" : "#4A5A7A" }}
                />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="text-xs font-bold rounded-full px-1.5 py-0.5"
                    style={{ background: "#FF5252", color: "white", fontSize: 10 }}
                  >
                    {badge}
                  </span>
                )}
                {active && <ChevronRight size={12} style={{ color: "#00E676" }} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar({
  role = "admin",
  userName = "Admin User",
  userRole = "Administrator",
  initials = "AU",
}: {
  role?: UserRole;
  userName?: string;
  userRole?: string;
  initials?: string;
}) {
  const pathname = usePathname();
  const basePath = role === "admin" ? "/dashboard" : "/user-dashboard";
  const mainNav = buildMainNav(basePath);
  const analyticsNav = buildAnalyticsNav(basePath);
  const accountNav = role === "admin" ? adminNav : buildUserNav(basePath);

  return (
    <aside
      // className="flex flex-col w-[200px] min-h-screen flex-shrink-0"
      className="flex flex-col w-[220px] min-h-screen flex-shrink-0"
      style={{
        background: "#080F1E",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #00E676, #00BFA5)",
          }}
        >
          <svg width={14} height={17} viewBox="0 0 20 26" fill="none">
            <path d="M12 2L2 15H10L8 24L18 11H10L12 2Z" fill="#050B18" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wider">BMS</p>
          <p className="text-xs" style={{ color: "#4A5A7A" }}>Battery Mgmt System</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: "#0C1426", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: "#4A5A7A" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-xs" style={{ color: "#4A5A7A" }}>Search devices, serial num...</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-5 overflow-y-auto">
        <NavSection title="Main" items={mainNav} pathname={pathname} />
        <NavSection title="Analytics" items={analyticsNav} pathname={pathname} />
        <NavSection title={role === "admin" ? "Admin" : "Account"} items={accountNav} pathname={pathname} />
      </nav>

      {/* User */}
      <div
        className="px-3 py-4 flex items-center gap-2.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(0,230,118,0.15)", color: "#00E676" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-xs truncate" style={{ color: "#4A5A7A" }}>{userRole}</p>
        </div>
      </div>
    </aside>
  );
}
