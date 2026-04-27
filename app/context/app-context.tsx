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
import {
  createBackendWorkshop,
  deleteBackendWorkshop,
  getBackendUsers,
  getBackendWorkshops,
  getCurrentSystemConfig,
  getEnabledWeeks,
  getWorkshopWeekMarks,
  updateBackendWorkshop,
  createMark as createBackendMark,
  updateMark as updateBackendMark,
} from "../lib/services/participation";
import { ApiError } from "../interface/apiTypes";

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
  tutorUserId?: string | null;
};

// weekId → studentId → Score
type SessionMarks = Record<string, Record<string, Score>>;

interface AppContextValue {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  authRole: AuthRole | null;
  currentUserId: string | null;
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
  submitWeekMarks: (weekId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "pms-app-config";

type PersistedState = Partial<{
  isAuthenticated: boolean;
  authRole: AuthRole;
  currentUserId: string | null;
  currentUserName: string;
  currentUserEmail: string;
  viewRole: ViewRole;
  workshops: WorkshopRecord[];
  workshopStudents: Record<string, WorkshopStudent[]>;
  configWeeks: ConfigWeek[];
  maxWeeklyScore: number;
  totalAssessmentWeighting: number;
  sessionMarks: SessionMarks;
  activeWorkshopId: string | null;
}>;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getStoredToken()));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  const hasHydratedFromApi = useRef(false);

  const isBackendWorkshopId = (id: string) => /^\d+$/.test(id);

  const mapBackendRole = (role: string): AuthRole =>
    role === "UC" ? "coordinator" : "tutor";

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
    if (typeof saved.activeWorkshopId === "string" || saved.activeWorkshopId === null) {
      setActiveWorkshopId(saved.activeWorkshopId ?? null);
    }
    if (typeof saved.currentUserId === "string" || saved.currentUserId === null) {
      setCurrentUserId(saved.currentUserId ?? null);
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
        setCurrentUserId(String(user.id));
        setCurrentUserName(user.name);
        setCurrentUserEmail(user.email);
        setViewRoleState(user.role);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearStoredToken();
        setIsAuthenticated(false);
        setAuthRole(null);
        setCurrentUserId(null);
        setCurrentUserName("");
        setCurrentUserEmail("");
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Pull read-only API-backed configuration/workshops into the frontend workflow when available.
  useEffect(() => {
    if (hasHydratedFromApi.current) return;
    hasHydratedFromApi.current = true;

    async function hydrateFromApi() {
      try {
        const [backendUsers, backendWorkshops, enabledWeeks, systemConfig] = await Promise.all([
          getBackendUsers().catch(() => []),
          getBackendWorkshops().catch(() => []),
          getEnabledWeeks().catch(() => []),
          getCurrentSystemConfig().catch(() => null),
        ]);

        if (backendWorkshops.length > 0) {
          const usersById = new Map(backendUsers.map((user) => [user.user_id, user]));
          setWorkshops((existing) => {
            const localOnly = existing.filter((workshop) => !isBackendWorkshopId(workshop.id));
            const apiWorkshops = backendWorkshops
              .filter((workshop) => workshop.is_active)
              .map((workshop) => {
                const tutor = workshop.tutor_user_id
                  ? usersById.get(workshop.tutor_user_id)
                  : undefined;

                return {
                  id: String(workshop.workshop_id),
                  name: workshop.workshop_name,
                  tutorName: tutor?.display_name ?? null,
                  tutorEmail: tutor?.email ?? null,
                  tutorUserId: workshop.tutor_user_id,
                } satisfies WorkshopRecord;
              });

            return [...apiWorkshops, ...localOnly];
          });
        }

        if (enabledWeeks.length > 0) {
          const enabledWeekNumbers = new Set(enabledWeeks.map((week) => week.week_number));
          setConfigWeeks((existing) =>
            existing.map((week) => ({
              ...week,
              enabled: enabledWeekNumbers.has(week.weekNumber),
            })),
          );
        }

        if (systemConfig) {
          setMaxWeeklyScore(systemConfig.max_weekly_score);
          setTotalAssessmentWeighting(systemConfig.total_participation_points);
        }
      } catch {
        // Keep local/offline workflow available when the backend is not running or configured.
      }
    }

    void hydrateFromApi();
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
          currentUserId,
          currentUserName,
          currentUserEmail,
          viewRole,
          workshops,
          workshopStudents,
          configWeeks,
          maxWeeklyScore,
          totalAssessmentWeighting,
          sessionMarks,
          activeWorkshopId,
        }),
      );
    } catch {
      // ignore write errors
    }
  }, [
    isAuthenticated,
    authRole,
    currentUserId,
    currentUserName,
    currentUserEmail,
    viewRole,
    workshops,
    workshopStudents,
    configWeeks,
    maxWeeklyScore,
    totalAssessmentWeighting,
    sessionMarks,
    activeWorkshopId,
  ]);

  async function loginWithCredentials(email: string, password: string): Promise<void> {
    const response = await loginApi({ email, password });
    setStoredToken(response.access_token);
    setAuthRole(response.user.role);
    setCurrentUserId(String(response.user.id));
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
        ? { name: "Dr. Joachim Strand", email: "joachim.strand@uwa.edu.au", id: null }
        : { name: "Alex Chen", email: "alex.chen@uwa.edu.au", id: null };
    setAuthRole(role);
    setCurrentUserId(defaults.id);
    setCurrentUserName(defaults.name);
    setCurrentUserEmail(defaults.email);
    setViewRoleState(role);
    setIsAuthenticated(true);
  }

  function logout() {
    clearStoredToken();
    setIsAuthenticated(false);
    setAuthRole(null);
    setCurrentUserId(null);
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

    void (async () => {
      try {
        const users = tutorEmail
          ? await getBackendUsers().catch(() => [])
          : [];
        const tutor = users.find((user) => user.email.toLowerCase() === tutorEmail?.trim().toLowerCase());
        const backendWorkshop = await createBackendWorkshop({
          workshop_name: trimmed,
          tutor_user_id: tutor?.user_id ?? null,
          is_active: true,
        });
        setWorkshops((prev) =>
          prev.map((workshop) =>
            workshop.id === id
              ? {
                  ...workshop,
                  id: String(backendWorkshop.workshop_id),
                  tutorUserId: backendWorkshop.tutor_user_id,
                }
              : workshop,
          ),
        );
        setWorkshopStudents((prev) => {
          if (!prev[id]) return prev;
          const next = { ...prev, [String(backendWorkshop.workshop_id)]: prev[id] };
          delete next[id];
          return next;
        });
        setActiveWorkshopId((current) =>
          current === id ? String(backendWorkshop.workshop_id) : current,
        );
      } catch {
        // The local workflow remains usable if the API is offline or the tutor is not in backend users yet.
      }
    })();
    return id;
  }

  function deleteWorkshop(workshopId: string) {
    const workshop = workshops.find((item) => item.id === workshopId);
    if (!workshop) return;
    const removedStudentIds = new Set((workshopStudents[workshopId] ?? []).map((student) => student.studentId));

    setWorkshops((prev) => prev.filter((item) => item.id !== workshopId));

    if (isBackendWorkshopId(workshopId)) {
      void deleteBackendWorkshop(Number(workshopId)).catch(() => undefined);
    }

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

    if (isBackendWorkshopId(workshopId)) {
      void (async () => {
        const users = tutorEmail ? await getBackendUsers().catch(() => []) : [];
        const tutor = users.find((user) => user.email.toLowerCase() === tutorEmail?.trim().toLowerCase());
        await updateBackendWorkshop(Number(workshopId), {
          tutor_user_id: tutor?.user_id ?? null,
        });
      })().catch(() => undefined);
    }
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

    if (isBackendWorkshopId(workshopId)) {
      void (async () => {
        const users = await getBackendUsers().catch(() => []);
        const currentUser = users.find(
          (user) => user.email.toLowerCase() === currentUserEmail.toLowerCase(),
        );
        if (!currentUser) return;
        setCurrentUserId(currentUser.user_id);
        await updateBackendWorkshop(Number(workshopId), {
          tutor_user_id: currentUser.user_id,
        });
      })().catch(() => undefined);
    }
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

  async function submitWeekMarks(weekId: string): Promise<void> {
    if (!activeWorkshopId || !isBackendWorkshopId(activeWorkshopId)) return;

    const week = configWeeks.find((item) => item.id === weekId);
    if (!week) return;

    const workshopId = Number(activeWorkshopId);
    const markedStudents = Object.entries(sessionMarks[weekId] ?? {});
    if (markedStudents.length === 0) return;

    let markerUserId = currentUserId;
    if (!markerUserId && currentUserEmail) {
      const users = await getBackendUsers();
      const currentUser = users.find(
        (user) => user.email.toLowerCase() === currentUserEmail.toLowerCase(),
      );
      markerUserId = currentUser?.user_id ?? null;
      if (markerUserId) {
        setCurrentUserId(markerUserId);
        setAuthRole(mapBackendRole(currentUser?.role ?? "tutor"));
      }
    }

    if (!markerUserId) {
      throw new ApiError("Cannot submit marks until the current tutor exists in backend users.", 400);
    }

    let existingMarks = await getWorkshopWeekMarks(workshopId, week.weekNumber).catch((error) => {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    });
    const existingByStudentId = new Map(existingMarks.map((mark) => [mark.student_id, mark]));

    for (const [studentId, score] of markedStudents) {
      const existing = existingByStudentId.get(studentId);
      if (existing) {
        const updated = await updateBackendMark(existing.mark_id, {
          score,
          marked_by_user_id: markerUserId,
        });
        existingByStudentId.set(studentId, updated);
        continue;
      }

      try {
        const created = await createBackendMark({
          student_id: studentId,
          workshop_id: workshopId,
          week_number: week.weekNumber,
          score,
          marked_by_user_id: markerUserId,
        });
        existingByStudentId.set(studentId, created);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 400) throw error;
        existingMarks = await getWorkshopWeekMarks(workshopId, week.weekNumber);
        const duplicate = existingMarks.find((mark) => mark.student_id === studentId);
        if (!duplicate) throw error;
        const updated = await updateBackendMark(duplicate.mark_id, {
          score,
          marked_by_user_id: markerUserId,
        });
        existingByStudentId.set(studentId, updated);
      }
    }
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
        currentUserId,
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
        submitWeekMarks,
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
