"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAppContext } from "../context/app-context";

// Navigation items visible to the Tutor role (FR-1.4 access control)
const navItems = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/marking", label: "Mark Participation", exact: false },
] as const;

function NavIcon({ active }: { active: boolean }) {
  const colour = active ? "#3f5efb" : "#4b5d75";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke={colour} strokeWidth="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke={colour} strokeWidth="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke={colour} strokeWidth="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke={colour} strokeWidth="2" />
    </svg>
  );
}

type TutorShellProps = {
  children: ReactNode;
};

/**
 * Persistent sidebar layout for all tutor-facing pages.
 * Extracted from page.tsx to avoid duplication across routes.
 */
export function TutorShell({ children }: TutorShellProps) {
  const pathname = usePathname();
  const { viewRole, setViewRole } = useAppContext();

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
                <NavIcon active={isActive} />
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
              className={`mode-chip${viewRole === "coordinator" ? " active" : ""}`}
              onClick={() => setViewRole("coordinator")}
            >
              Coordinator
            </button>
            <button
              type="button"
              className={`mode-chip${viewRole === "tutor" ? " active" : ""}`}
              onClick={() => setViewRole("tutor")}
            >
              Tutor
            </button>
          </div>
          <div className="mt-4">
            <p className="text-[15px] font-semibold text-[#172033]">Dr. Joachim Strand</p>
            <p className="text-sm text-[#708097]">Coordinator</p>
            <p className="mt-1 text-sm font-medium text-[#3f5efb]">Viewing as: {viewRole}</p>
          </div>
        </div>
      </aside>

      <main className="prototype-main">{children}</main>
    </div>
  );
}
