"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { configWeeks as defaultConfigWeeks } from "../data/mock-data";
import type { ConfigWeek, Score } from "../data/mock-data";
import {
  loginApi,
  getMe,
  clearStoredToken,
  setStoredToken,
  getStoredToken,
} from "../lib/services/auth";

export type { Score };
export type ViewRole = "coordinator" | "tutor";
export type AuthRole = "coordinator" | "tutor";

export type WorkshopStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  preferredName?: string;
};

export type WorkshopRecord = {
  id: string;
  name: string;
  tutorName: string | null;
  tutorEmail: string | null;
};

// weekId → studentId → Score
type SessionMarks = Record<string, Record<string, Score>>;

interface AppContextValue {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  authRole: AuthRole | null;
  currentUserName: string;
  currentUserEmail: string;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: ViewRole) => void;
  logout: () => void;
  viewRole: ViewRole;
  setViewRole: (role: ViewRole) => void;
  workshops: WorkshopRecord[];
  setWorkshops: (workshops: WorkshopRecord[]) => void;
  createWorkshop: (name: string, tutorName?: string | null, tutorEmail?: string | null) => string | null;
  deleteWorkshop: (workshopId: string) => void;
  updateWorkshopTutor: (
    workshopId: string,
    tutorName: string | null,
    tutorEmail: string | null,
  ) => void;
  assignCurrentUserAsTutor: (workshopId: string) => void;
  workshopStudents: Record<string, WorkshopStudent[]>;
  upsertWorkshopStudentsFromCsv: (workshopId: string, students: WorkshopStudent[]) => void;
  configWeeks: ConfigWeek[];
  setConfigWeeks: (weeks: ConfigWeek[]) => void;
  maxWeeklyScore: number;
  setMaxWeeklyScore: (score: number) => void;
  totalAssessmentWeighting: number;
  setTotalAssessmentWeighting: (weight: number) => void;
  activeWorkshopId: string | null;
  setActiveWorkshopId: (id: string | null) => void;
  sessionMarks: SessionMarks;
  setMark: (weekId: string, studentId: string, score: Score) => void;
  clearWeekMarks: (weekId: string) => void;
  getWeekMarkedCount: (weekId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "pms-app-config";

type PersistedState = Partial<{
  isAuthenticated: boolean;
  authRole: AuthRole;
  currentUserName: string;
  currentUserEmail: string;
  viewRole: ViewRole;
  workshops: WorkshopRecord[];
  workshopStudents: Record<string, WorkshopStudent[]>;
  configWeeks: ConfigWeek[];
  maxWeeklyScore: number;
  totalAssessmentWeighting: number;
  sessionMarks: SessionMarks;
}>;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getStoredToken()));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [viewRole, setViewRoleState] = useState<ViewRole>("tutor");
  const [workshops, setWorkshops] = useState<WorkshopRecord[]>([]);
  const [workshopStudents, setWorkshopStudents] = useState<Record<string, WorkshopStudent[]>>({});
  const [configWeeks, setConfigWeeks] = useState<ConfigWeek[]>(defaultConfigWeeks);
  const [maxWeeklyScore, setMaxWeeklyScore] = useState(3);
  const [totalAssessmentWeighting, setTotalAssessmentWeighting] = useState(20);
  const [sessionMarks, setSessionMarks] = useState<SessionMarks>({});
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | null>(null);
  const hasHydratedFromStorage = useRef(false);

  function applyPersistedState(saved: PersistedState) {
    if (Array.isArray(saved.workshops)) {
      setWorkshops(saved.workshops);
    }
    if (saved.workshopStudents && typeof saved.workshopStudents === "object") {
      setWorkshopStudents(saved.workshopStudents);
    }
    if (Array.isArray(saved.configWeeks) && saved.configWeeks.length === defaultConfigWeeks.length) {
      setConfigWeeks(saved.configWeeks);
    }
    if (typeof saved.maxWeeklyScore === "number") setMaxWeeklyScore(saved.maxWeeklyScore);
    if (typeof saved.totalAssessmentWeighting === "number") {
      setTotalAssessmentWeighting(saved.totalAssessmentWeighting);
    }
    if (saved.sessionMarks && typeof saved.sessionMarks === "object") {
      setSessionMarks(saved.sessionMarks);
    }
  }

  // Hydrate persisted state only after mount to avoid SSR/client HTML mismatches.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        hasHydratedFromStorage.current = true;
        return;
      }
      const saved = JSON.parse(raw) as PersistedState;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyPersistedState(saved);
    } catch {
      // ignore read/parse issues and keep defaults
    } finally {
      hasHydratedFromStorage.current = true;
    }
  }, []);

  // Validate stored JWT on mount. If valid, sync session from server; if not, clear auth state.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }
    getMe()
      .then((user) => {
        setAuthRole(user.role);
        setCurrentUserName(user.name);
        setCurrentUserEmail(user.email);
        setViewRoleState(user.role);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearStoredToken();
        setIsAuthenticated(false);
        setAuthRole(null);
        setCurrentUserName("");
        setCurrentUserEmail("");
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Persist on every state change.
  useEffect(() => {
    if (!hasHydratedFromStorage.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isAuthenticated,
          authRole,
          currentUserName,
          currentUserEmail,
          viewRole,
          workshops,
          workshopStudents,
          configWeeks,
          maxWeeklyScore,
          totalAssessmentWeighting,
          sessionMarks,
        }),
      );
    } catch {
      // ignore write errors
    }
  }, [
    isAuthenticated,
    authRole,
    currentUserName,
    currentUserEmail,
    viewRole,
    workshops,
    workshopStudents,
    configWeeks,
    maxWeeklyScore,
    totalAssessmentWeighting,
    sessionMarks,
  ]);

  async function loginWithCredentials(email: string, password: string): Promise<void> {
    const response = await loginApi({ email, password });
    setStoredToken(response.access_token);
    setAuthRole(response.user.role);
    setCurrentUserName(response.user.name ?? email);
    setCurrentUserEmail(response.user.email ?? email);
    setViewRoleState(response.user.role);
    setIsAuthenticated(true);
  }

  function setViewRole(role: ViewRole) {
    if (authRole === "tutor" && role === "coordinator") return;
    setViewRoleState(role);
  }

  function loginAsRole(role: ViewRole) {
    // TODO(T-304): remove dev test login path once backend auth is fully integrated in all environments.
    const defaults =
      role === "coordinator"
        ? { name: "Dr. Joachim Strand", email: "joachim.strand@uwa.edu.au" }
        : { name: "Alex Chen", email: "alex.chen@uwa.edu.au" };
    setAuthRole(role);
    setCurrentUserName(defaults.name);
    setCurrentUserEmail(defaults.email);
    setViewRoleState(role);
    setIsAuthenticated(true);
  }

  function logout() {
    clearStoredToken();
    setIsAuthenticated(false);
    setAuthRole(null);
    setCurrentUserName("");
    setCurrentUserEmail("");
    setViewRoleState("tutor");
  }

  function createWorkshop(name: string, tutorName?: string | null, tutorEmail?: string | null): string | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (workshops.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) return null;

    const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setWorkshops((prev) => [
      ...prev,
      {
        id,
        name: trimmed,
        tutorName: tutorName?.trim() || null,
        tutorEmail: tutorEmail?.trim() || null,
      },
    ]);
    return id;
  }

  function deleteWorkshop(workshopId: string) {
    const workshop = workshops.find((item) => item.id === workshopId);
    if (!workshop) return;
    const removedStudentIds = new Set((workshopStudents[workshopId] ?? []).map((student) => student.studentId));

    setWorkshops((prev) => prev.filter((item) => item.id !== workshopId));

    setWorkshopStudents((prev) => {
      const next = { ...prev };
      delete next[workshopId];
      return next;
    });

    if (removedStudentIds.size > 0) {
      setSessionMarks((prev) => {
        let changed = false;
        const next: SessionMarks = {};

        Object.entries(prev).forEach(([weekId, weekMarks]) => {
          const filteredWeekMarks = Object.fromEntries(
            Object.entries(weekMarks).filter(([studentId]) => !removedStudentIds.has(studentId)),
          );
          if (Object.keys(filteredWeekMarks).length > 0) {
            next[weekId] = filteredWeekMarks;
          }
          if (Object.keys(filteredWeekMarks).length !== Object.keys(weekMarks).length) {
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }
  }

  function updateWorkshopTutor(
    workshopId: string,
    tutorName: string | null,
    tutorEmail: string | null,
  ) {
    setWorkshops((prev) =>
      prev.map((workshop) =>
        workshop.id === workshopId
          ? {
              ...workshop,
              tutorName: tutorName?.trim() || null,
              tutorEmail: tutorEmail?.trim() || null,
            }
          : workshop,
      ),
    );
  }

  function assignCurrentUserAsTutor(workshopId: string) {
    if (!currentUserName) return;
    setWorkshops((prev) =>
      prev.map((workshop) =>
        workshop.id === workshopId
          ? {
              ...workshop,
              tutorName: currentUserName,
              tutorEmail: currentUserEmail || null,
            }
          : workshop,
      ),
    );
  }

  function upsertWorkshopStudentsFromCsv(workshopId: string, students: WorkshopStudent[]) {
    const cleaned = students.filter((student) => student.studentId && student.email);
    setWorkshopStudents((prev) => ({ ...prev, [workshopId]: cleaned }));
  }

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
        isAuthLoading,
        isAuthenticated,
        authRole,
        currentUserName,
        currentUserEmail,
        loginWithCredentials,
        loginAsRole,
        logout,
        viewRole, setViewRole,
        workshops, setWorkshops, createWorkshop, deleteWorkshop, updateWorkshopTutor, assignCurrentUserAsTutor,
        workshopStudents, upsertWorkshopStudentsFromCsv,
        configWeeks, setConfigWeeks,
        maxWeeklyScore, setMaxWeeklyScore,
        totalAssessmentWeighting, setTotalAssessmentWeighting,
        activeWorkshopId, setActiveWorkshopId,
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
