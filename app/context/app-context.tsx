"use client";

import { createContext, useCallback, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { ConfigWeek, Score } from "../data/mock-data";
import {
  loginApi,
  getAuthenticatedUserByEmail,
  clearStoredToken,
  setStoredToken,
  setStoredEmail,
  getStoredToken,
  getStoredEmail,
} from "../lib/services/auth";
import { getUsers, type UserDto } from "../lib/services/user";
import { ApiError } from "../interface/apiTypes";
import {
  createWorkshopApi,
  deleteWorkshopApi,
  getWorkshopStudents,
  getWorkshops,
  updateWorkshopApi,
  type WorkshopDto,
  type WorkshopStudentDto,
} from "../lib/services/workshop";
import {
  createSystemConfig,
  getCurrentSystemConfig,
  updateCurrentSystemConfig,
  type SystemConfigDto,
  type SystemConfigPayload,
} from "../lib/services/system-config";
import {
  getEnabledWeeks,
  replaceEnabledWeeks,
  type EnabledWeekDto,
} from "../lib/services/enabled-weeks";

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
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  viewRole: ViewRole;
  setViewRole: (role: ViewRole) => void;
  workshops: WorkshopRecord[];
  setWorkshops: (workshops: WorkshopRecord[]) => void;
  createWorkshop: (name: string, tutorName?: string | null, tutorEmail?: string | null) => Promise<string | null>;
  deleteWorkshop: (workshopId: string) => Promise<void>;
  updateWorkshopTutor: (
    workshopId: string,
    tutorName: string | null,
    tutorEmail: string | null,
  ) => Promise<void>;
  assignCurrentUserAsTutor: (workshopId: string) => Promise<void>;
  workshopStudents: Record<string, WorkshopStudent[]>;
  configWeeks: ConfigWeek[];
  setConfigWeeks: (weeks: ConfigWeek[]) => void;
  maxWeeklyScore: number;
  setMaxWeeklyScore: (score: number) => void;
  totalAssessmentWeighting: number;
  setTotalAssessmentWeighting: (weight: number) => void;
  saveSystemConfig: (options?: { weeks?: ConfigWeek[]; maxWeeklyScore?: number }) => Promise<void>;
  saveEnabledWeeks: (weeks: ConfigWeek[]) => Promise<void>;
  activeWorkshopId: string | null;
  setActiveWorkshopId: (id: string | null) => void;
  sessionMarks: SessionMarks;
  setMark: (weekId: string, studentId: string, score: Score) => void;
  clearWeekMarks: (weekId: string) => void;
  getWeekMarkedCount: (weekId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "pms-app-config";
const defaultConfigWeeks: ConfigWeek[] = Array.from({ length: 12 }, (_, index) => {
  const weekNumber = index + 1;
  return {
    id: `week-${weekNumber}`,
    weekNumber,
    label: `Week ${weekNumber}`,
    enabled: false,
    locked: false,
  };
});

function mapWorkshop(dto: WorkshopDto, users: UserDto[]): WorkshopRecord {
  const tutor = dto.tutor_user_id
    ? users.find((user) => user.user_id === dto.tutor_user_id)
    : null;
  return {
    id: String(dto.workshop_id),
    name: dto.workshop_name,
    tutorName: tutor?.display_name ?? null,
    tutorEmail: tutor?.email ?? null,
  };
}

function mapWorkshopStudent(dto: WorkshopStudentDto): WorkshopStudent {
  return {
    studentId: dto.student_id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    preferredName: dto.preferred_name ?? undefined,
  };
}

type PersistedState = Partial<{
  viewRole: ViewRole;
  sessionMarks: SessionMarks;
  activeWorkshopId: string | null;
}>;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getStoredToken()));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [viewRole, setViewRoleState] = useState<ViewRole>("tutor");
  const [workshops, setWorkshops] = useState<WorkshopRecord[]>([]);
  const [workshopStudents, setWorkshopStudents] = useState<Record<string, WorkshopStudent[]>>({});
  const [configWeeks, setConfigWeeks] = useState<ConfigWeek[]>(defaultConfigWeeks);
  const [maxWeeklyScore, setMaxWeeklyScore] = useState(3);
  const [totalAssessmentWeighting, setTotalAssessmentWeighting] = useState(20);
  const [systemConfigExists, setSystemConfigExists] = useState(false);
  const [sessionMarks, setSessionMarks] = useState<SessionMarks>({});
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | null>(null);
  const hasHydratedFromStorage = useRef(false);

  const refreshWorkshops = useCallback(async () => {
    const [workshopDtos, users] = await Promise.all([getWorkshops(), getUsers()]);
    const activeWorkshops = workshopDtos.filter((workshop) => workshop.is_active);
    setWorkshops(activeWorkshops.map((workshop) => mapWorkshop(workshop, users)));

    const studentEntries = await Promise.all(
      activeWorkshops.map(async (workshop) => {
        const students = await getWorkshopStudents(String(workshop.workshop_id));
        return [
          String(workshop.workshop_id),
          students
            .filter((student) => student.status === "active")
            .map(mapWorkshopStudent),
        ] as const;
      }),
    );
    setWorkshopStudents(Object.fromEntries(studentEntries));
  }, []);

  function applyEnabledWeeks(enabledWeeks: EnabledWeekDto[]) {
    const enabledNumbers = new Set(enabledWeeks.map((week) => week.week_number));
    setConfigWeeks((currentWeeks) =>
      defaultConfigWeeks.map((week) => ({
        ...week,
        enabled: enabledNumbers.has(week.weekNumber),
        locked: currentWeeks.find((currentWeek) => currentWeek.id === week.id)?.locked ?? false,
      })),
    );
  }

  function applySystemConfig(config: SystemConfigDto) {
    setMaxWeeklyScore(config.max_weekly_score);
    setConfigWeeks((currentWeeks) =>
      defaultConfigWeeks.map((week, index) => ({
        ...week,
        enabled: currentWeeks.find((currentWeek) => currentWeek.id === week.id)?.enabled ?? false,
        locked:
          (index < 6 && config.week6_lock_enabled) ||
          (index >= 6 && index < 12 && config.week12_lock_enabled),
      })),
    );
  }

  const refreshSystemConfig = useCallback(async () => {
    try {
      const [config, enabledWeeks] = await Promise.all([
        getCurrentSystemConfig(),
        getEnabledWeeks(),
      ]);
      applySystemConfig(config);
      applyEnabledWeeks(enabledWeeks);
      setSystemConfigExists(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSystemConfigExists(false);
        const enabledWeeks = await getEnabledWeeks();
        applyEnabledWeeks(enabledWeeks);
        return;
      }
      throw error;
    }
  }, []);

  async function findTutorUserIdByEmail(email: string | null | undefined): Promise<string | null> {
    const trimmed = email?.trim();
    if (!trimmed) return null;
    const users = await getUsers();
    const tutor = users.find((user) => user.email.toLowerCase() === trimmed.toLowerCase());
    if (!tutor) {
      throw new Error("Tutor email does not match an existing user.");
    }
    return tutor.user_id;
  }

  function applyPersistedState(saved: PersistedState) {
    if (saved.sessionMarks && typeof saved.sessionMarks === "object") {
      setSessionMarks(saved.sessionMarks);
    }
    if (typeof saved.activeWorkshopId === "string" || saved.activeWorkshopId === null) {
      setActiveWorkshopId(saved.activeWorkshopId ?? null);
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

  // Validate stored token on mount. If valid, sync session from the existing backend users endpoint.
  useEffect(() => {
    const token = getStoredToken();
    const email = getStoredEmail();
    if (!token || !email) {
      clearStoredToken();
      setIsAuthLoading(false);
      return;
    }
    getAuthenticatedUserByEmail(email)
      .then((user) => {
        setAuthRole(user.role);
        setCurrentUserId(user.id);
        setCurrentUserName(user.name);
        setCurrentUserEmail(user.email);
        setViewRoleState(user.role);
        setIsAuthenticated(true);
        return Promise.all([refreshWorkshops(), refreshSystemConfig()]);
      })
      .catch(() => {
        clearStoredToken();
        setIsAuthenticated(false);
        setAuthRole(null);
        setCurrentUserId("");
        setCurrentUserName("");
        setCurrentUserEmail("");
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, [refreshSystemConfig, refreshWorkshops]);

  // Persist on every state change.
  useEffect(() => {
    if (!hasHydratedFromStorage.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          viewRole,
          sessionMarks,
          activeWorkshopId,
        }),
      );
    } catch {
      // ignore write errors
    }
  }, [
    viewRole,
    sessionMarks,
    activeWorkshopId,
  ]);

  async function loginWithCredentials(email: string, password: string): Promise<void> {
    const trimmedEmail = email.trim();
    const response = await loginApi({ email: trimmedEmail, password });
    setStoredToken(response.access_token);
    setStoredEmail(trimmedEmail);

    try {
      const user = await getAuthenticatedUserByEmail(trimmedEmail);
      setAuthRole(user.role);
      setCurrentUserId(user.id);
      setCurrentUserName(user.name);
      setCurrentUserEmail(user.email);
      setViewRoleState(user.role);
      setIsAuthenticated(true);
      await Promise.all([refreshWorkshops(), refreshSystemConfig()]);
    } catch (error) {
      clearStoredToken();
      throw error;
    }
  }

  function setViewRole(role: ViewRole) {
    if (authRole === "tutor" && role === "coordinator") return;
    setViewRoleState(role);
  }

  function logout() {
    clearStoredToken();
    setIsAuthenticated(false);
    setAuthRole(null);
    setCurrentUserId("");
    setCurrentUserName("");
    setCurrentUserEmail("");
    setViewRoleState("tutor");
  }

  async function createWorkshop(name: string, tutorName?: string | null, tutorEmail?: string | null): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (workshops.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) return null;

    const tutorUserId = await findTutorUserIdByEmail(tutorEmail);
    const created = await createWorkshopApi({
      workshop_name: trimmed,
      tutor_user_id: tutorUserId,
      is_active: true,
    });
    await refreshWorkshops();
    return String(created.workshop_id);
  }

  async function deleteWorkshop(workshopId: string) {
    const workshop = workshops.find((item) => item.id === workshopId);
    if (!workshop) return;
    const removedStudentIds = new Set((workshopStudents[workshopId] ?? []).map((student) => student.studentId));

    try {
      await deleteWorkshopApi(workshopId);
    } catch {
      await updateWorkshopApi(workshopId, {
        workshop_name: workshop.name,
        tutor_user_id: null,
        is_active: false,
      });
    }
    await refreshWorkshops();

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

  async function updateWorkshopTutor(
    workshopId: string,
    tutorName: string | null,
    tutorEmail: string | null,
  ) {
    const workshop = workshops.find((item) => item.id === workshopId);
    if (!workshop) return;
    const tutorUserId = await findTutorUserIdByEmail(tutorEmail);
    await updateWorkshopApi(workshopId, {
      workshop_name: workshop.name,
      tutor_user_id: tutorUserId,
      is_active: true,
    });
    await refreshWorkshops();
  }

  async function assignCurrentUserAsTutor(workshopId: string) {
    if (!currentUserId) return;
    const workshop = workshops.find((item) => item.id === workshopId);
    if (!workshop) return;
    await updateWorkshopApi(workshopId, {
      workshop_name: workshop.name,
      tutor_user_id: currentUserId,
      is_active: true,
    });
    await refreshWorkshops();
  }

  async function saveSystemConfig(options?: { weeks?: ConfigWeek[]; maxWeeklyScore?: number }) {
    if (!currentUserId) return;

    const weeks = options?.weeks ?? configWeeks;
    const weeklyScore = options?.maxWeeklyScore ?? maxWeeklyScore;
    const now = new Date().toISOString();
    const selectedWeeks = weeks.filter((week) => week.enabled);
    const week6Locked = weeks
      .filter((week) => ["week-1", "week-2", "week-3", "week-4", "week-5", "week-6"].includes(week.id))
      .every((week) => week.locked);
    const week12Locked = weeks
      .filter((week) => ["week-7", "week-8", "week-9", "week-10", "week-11", "week-12"].includes(week.id))
      .every((week) => week.locked);

    const payload: SystemConfigPayload = {
      coordinator_user_id: currentUserId,
      max_weekly_score: weeklyScore,
      total_participation_points: selectedWeeks.length * weeklyScore,
      is_configured: selectedWeeks.length > 0,
      week6_lock_enabled: week6Locked,
      week6_locked_at: week6Locked ? now : null,
      week12_lock_enabled: week12Locked,
      week12_locked_at: week12Locked ? now : null,
      updated_by_user_id: currentUserId,
    };

    const savedConfig = systemConfigExists
      ? await updateCurrentSystemConfig(payload)
      : await createSystemConfig(payload);
    const savedWeeks = await replaceEnabledWeeks(selectedWeeks.map((week) => week.weekNumber));

    applySystemConfig(savedConfig);
    applyEnabledWeeks(savedWeeks);
    setSystemConfigExists(true);
  }

  async function saveEnabledWeeks(weeks: ConfigWeek[]) {
    const savedWeeks = await replaceEnabledWeeks(
      weeks
        .filter((week) => week.enabled)
        .map((week) => week.weekNumber),
    );
    applyEnabledWeeks(savedWeeks);

    if (currentUserId) {
      const now = new Date().toISOString();
      const selectedWeekCount = savedWeeks.length;
      const week6Locked = weeks
        .filter((week) => ["week-1", "week-2", "week-3", "week-4", "week-5", "week-6"].includes(week.id))
        .every((week) => week.locked);
      const week12Locked = weeks
        .filter((week) => ["week-7", "week-8", "week-9", "week-10", "week-11", "week-12"].includes(week.id))
        .every((week) => week.locked);
      const payload: SystemConfigPayload = {
        coordinator_user_id: currentUserId,
        max_weekly_score: maxWeeklyScore,
        total_participation_points: selectedWeekCount * maxWeeklyScore,
        is_configured: selectedWeekCount > 0,
        week6_lock_enabled: week6Locked,
        week6_locked_at: week6Locked ? now : null,
        week12_lock_enabled: week12Locked,
        week12_locked_at: week12Locked ? now : null,
        updated_by_user_id: currentUserId,
      };

      const savedConfig = systemConfigExists
        ? await updateCurrentSystemConfig(payload)
        : await createSystemConfig(payload);
      applySystemConfig(savedConfig);
      setSystemConfigExists(true);
    }
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
        currentUserId,
        currentUserName,
        currentUserEmail,
        loginWithCredentials,
        logout,
        viewRole, setViewRole,
        workshops, setWorkshops, createWorkshop, deleteWorkshop, updateWorkshopTutor, assignCurrentUserAsTutor,
        workshopStudents,
        configWeeks, setConfigWeeks,
        maxWeeklyScore, setMaxWeeklyScore,
        totalAssessmentWeighting, setTotalAssessmentWeighting,
        saveSystemConfig,
        saveEnabledWeeks,
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
