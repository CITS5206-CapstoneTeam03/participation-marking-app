"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppContext } from "../context/app-context";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    exact: true,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/workshops",
    label: "Workshops",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="4"  stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
        <line x1="6"  y1="20" x2="6"  y2="14" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/students",
    label: "Students",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/config",
    label: "Settings",
    exact: false,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke={active ? "#3f5efb" : "#4b5d75"} strokeWidth="2" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke={active ? "#3f5efb" : "#4b5d75"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

type CoordinatorShellProps = {
  children: ReactNode;
};

export function CoordinatorShell({ children }: CoordinatorShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthLoading,
    isAuthenticated,
    authRole,
    currentUserName,
    viewRole,
    setViewRole,
    logout,
  } = useAppContext();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (authRole !== "coordinator") {
      router.replace("/");
    } else if (viewRole !== "coordinator") {
      router.replace("/");
    }
  }, [isAuthLoading, isAuthenticated, authRole, viewRole, router]);

  if (isAuthLoading || !isAuthenticated || authRole !== "coordinator" || viewRole !== "coordinator") return null;

  const handleSignOut = () => {
    logout();
    router.push("/login");
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

        {/* Role switcher + user info */}
        <div className="prototype-sidebar-footer">
          <p className="mb-3 text-sm font-medium text-[#5a6a81]">View Mode</p>
          <div className="mode-toggle">
            <button
              type="button"
              className="mode-chip active"
              onClick={() => setViewRole("coordinator")}
            >
              Coordinator
            </button>
            <button
              type="button"
              className="mode-chip"
              onClick={() => { setViewRole("tutor"); router.push("/"); }}
            >
              Tutor
            </button>
          </div>
          <div className="mt-4">
            <p className="text-[15px] font-semibold text-[#172033]">{currentUserName}</p>
            <p className="text-sm text-[#708097]">{authRole === "coordinator" ? "Coordinator" : "Tutor"}</p>
          </div>
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
