"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "../context/app-context";
// TODO(T-API): replace participationWeeks with GET /weeks API response once backend is integrated
import { participationWeeks } from "../data/mock-data";

type WeekDropdownProps = {
  currentWeekId: string;
};

/**
 * Week switcher rendered in the marking page header.
 * Reads UC-enabled weeks from context and navigates on selection change.
 */
export function WeekDropdown({ currentWeekId }: WeekDropdownProps) {
  const router = useRouter();
  const { configWeeks } = useAppContext();

  const enabledIds = new Set(configWeeks.filter((w) => w.enabled).map((w) => w.id));
  const weeks = participationWeeks.filter((w) => enabledIds.has(w.id));

  return (
    <select
      value={currentWeekId}
      onChange={(e) => router.push(`/marking/${e.target.value}`)}
      className="week-dropdown-select"
      aria-label="Switch week"
    >
      {weeks.map((week) => (
        <option key={week.id} value={week.id}>
          {week.label}
        </option>
      ))}
    </select>
  );
}
