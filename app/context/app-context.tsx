"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { configWeeks as defaultConfigWeeks } from "../data/mock-data";
import type { ConfigWeek, Score } from "../data/mock-data";

export type { Score };
export type ViewRole = "coordinator" | "tutor";

// weekId → studentId → Score
type SessionMarks = Record<string, Record<string, Score>>;

interface AppContextValue {
  viewRole: ViewRole;
  setViewRole: (role: ViewRole) => void;
  configWeeks: ConfigWeek[];
  setConfigWeeks: (weeks: ConfigWeek[]) => void;
  maxWeeklyScore: number;
  setMaxWeeklyScore: (score: number) => void;
  sessionMarks: SessionMarks;
  setMark: (weekId: string, studentId: string, score: Score) => void;
  clearWeekMarks: (weekId: string) => void;
  getWeekMarkedCount: (weekId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "pms-app-config";

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewRole, setViewRole] = useState<ViewRole>("tutor");
  const [configWeeks, setConfigWeeks] = useState<ConfigWeek[]>(defaultConfigWeeks);
  const [maxWeeklyScore, setMaxWeeklyScore] = useState(3);
  const [sessionMarks, setSessionMarks] = useState<SessionMarks>({});
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state after mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<{
          viewRole: ViewRole;
          configWeeks: ConfigWeek[];
          maxWeeklyScore: number;
          sessionMarks: SessionMarks;
        }>;
        if (saved.viewRole) setViewRole(saved.viewRole);
        if (Array.isArray(saved.configWeeks)) setConfigWeeks(saved.configWeeks);
        if (typeof saved.maxWeeklyScore === "number") setMaxWeeklyScore(saved.maxWeeklyScore);
        if (saved.sessionMarks && typeof saved.sessionMarks === "object") {
          setSessionMarks(saved.sessionMarks);
        }
      }
    } catch {
      // localStorage unavailable — use defaults
    }
    setHydrated(true);
  }, []);

  // Persist on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ viewRole, configWeeks, maxWeeklyScore, sessionMarks }),
      );
    } catch {
      // ignore write errors
    }
  }, [viewRole, configWeeks, maxWeeklyScore, sessionMarks, hydrated]);

  function setMark(weekId: string, studentId: string, score: Score) {
    setSessionMarks((prev) => ({
      ...prev,
      [weekId]: { ...(prev[weekId] ?? {}), [studentId]: score },
    }));
  }

  function clearWeekMarks(weekId: string) {
    setSessionMarks((prev) => {
      const next = { ...prev };
      delete next[weekId];
      return next;
    });
  }

  function getWeekMarkedCount(weekId: string): number {
    return Object.keys(sessionMarks[weekId] ?? {}).length;
  }

  return (
    <AppContext.Provider
      value={{
        viewRole, setViewRole,
        configWeeks, setConfigWeeks,
        maxWeeklyScore, setMaxWeeklyScore,
        sessionMarks, setMark, clearWeekMarks, getWeekMarkedCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/** Hook — must be called inside <AppProvider>. */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
