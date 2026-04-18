"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppContext } from "../context/app-context";

// Navigation items visible to the Tutor role (FR-1.4 access control)
const navItems = [
  {
    href: "/",
    label: "Dashboard",
    exact: true,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/marking",
    label: "Mark Participation",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <path d="M8 12.5l2.5 2.5L16 9.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <line x1="5" y1="20" x2="5" y2="10" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="19" y1="20" x2="19" y2="13" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

type TutorShellProps = {
  children: ReactNode;
};

/**
 * Persistent sidebar layout for all tutor-facing pages.
 * Extracted from page.tsx to avoid duplication across routes.
 */
export function TutorShell({ children }: TutorShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthLoading, isAuthenticated, authRole, currentUserName, logout, setViewRole } = useAppContext();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || !isAuthenticated) return null;

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const handleSwitchToCoordinator = () => {
    if (authRole !== "coordinator") return;
    setViewRole("coordinator");
    router.push("/");
  };

  return (
    <div className="prototype-shell">
      <aside className="prototype-sidebar">
        {/* Brand */}
        <div className="prototype-logo">
          <Image src="/uwa-logo.png" alt="UWA logo" width={52} height={52} priority />
          <div>
            <p className="text-[15px] font-semibold leading-5 text-[#172033]">UWA Participation</p>
            <p className="text-[15px] leading-5 text-[#5a6a81]">Marking System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="prototype-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`prototype-nav-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon(isActive)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tutor profile */}
        <div className="prototype-sidebar-footer">
          <div className="mt-2">
            <p className="text-[15px] font-semibold text-[#172033]">{currentUserName || "Tutor"}</p>
            <p className="text-sm text-[#708097]">Tutor</p>
          </div>
          {authRole === "coordinator" && (
            <button type="button" className="tutor-switch-btn" onClick={handleSwitchToCoordinator}>
              Switch to Coordinator
            </button>
          )}
          <button type="button" className="tutor-signout-btn" onClick={handleSignOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="prototype-main">{children}</main>
    </div>
  );
}
