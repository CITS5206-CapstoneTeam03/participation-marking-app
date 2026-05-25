export type Score = 0 | 1 | 2 | 3;

export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "navy" | "gold" | "mint";
};

export type ParticipationWeek = {
  id: string;
  weekNumber: number;
  label: string;
  workshop: string;
  date: string;
  status: "ready" | "locked" | "in-progress";
  completion: number;
  submissions: string;
};

export type StudentMark = {
  id: string;
  name: string;
  studentNumber: string;
  team: string;
  notes: string;
  score: 0 | 1 | 2 | 3;
  previousAverage: number;
  /** Student photo URL for display during marking (FR-2.3 — mandatory) */
  photoUrl: string;
};

export type ConfigWeek = {
  id: string;
  weekNumber: number;
  label: string;
  enabled: boolean;
  locked: boolean;
};

export const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Overview of weekly marking progress.",
  },
  {
    href: "/marking",
    label: "Mark Participation",
    description: "Select a week and enter 0-3 marks quickly.",
  },
  {
    href: "/config",
    label: "Unit Configuration",
    description: "Choose active weeks and participation weights.",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Weeks Completed",
    value: "4 / 8",
    helper: "Weeks 1-4 are marked and published.",
    tone: "navy",
  },
  {
    label: "Overall Marking Progress",
    value: "68%",
    helper: "34 of 50 students marked for the active week.",
    tone: "gold",
  },
  {
    label: "Avg Participation",
    value: "2.1 / 3",
    helper: "Cohort average across enabled weeks.",
    tone: "mint",
  },
];

export const participationWeeks: ParticipationWeek[] = [
  {
    id: "week-1",
    weekNumber: 1,
    label: "Week 1",
    workshop: "Workshop 01",
    date: "Intro and group setup",
    status: "locked",
    completion: 100,
    submissions: "50 / 50 students marked",
  },
  {
    id: "week-2",
    weekNumber: 2,
    label: "Week 2",
    workshop: "Workshop 02",
    date: "Requirements discussion",
    status: "locked",
    completion: 100,
    submissions: "50 / 50 students marked",
  },
  {
    id: "week-3",
    weekNumber: 3,
    label: "Week 3",
    workshop: "Workshop 03",
    date: "Architecture checkpoint",
    status: "locked",
    completion: 100,
    submissions: "50 / 50 students marked",
  },
  {
    id: "week-4",
    weekNumber: 4,
    label: "Week 4",
    workshop: "Workshop 04",
    date: "Database schema review",
    status: "ready",
    completion: 68,
    submissions: "34 / 50 students marked",
  },
  {
    id: "week-5",
    weekNumber: 5,
    label: "Week 5",
    workshop: "Workshop 05",
    date: "Mid-semester check-in",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
  {
    id: "week-6",
    weekNumber: 6,
    label: "Week 6",
    workshop: "Workshop 06",
    date: "Prototype usability walkthrough",
    status: "ready",
    completion: 0,
    submissions: "Opens after Week 4 lock",
  },
  {
    id: "week-7",
    weekNumber: 7,
    label: "Week 7",
    workshop: "Workshop 07",
    date: "Design review",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
  {
    id: "week-8",
    weekNumber: 8,
    label: "Week 8",
    workshop: "Workshop 08",
    date: "Implementation sprint",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
  {
    id: "week-9",
    weekNumber: 9,
    label: "Week 9",
    workshop: "Workshop 09",
    date: "Iteration review",
    status: "in-progress",
    completion: 24,
    submissions: "12 / 50 students pre-marked",
  },
  {
    id: "week-10",
    weekNumber: 10,
    label: "Week 10",
    workshop: "Workshop 10",
    date: "Feedback implementation",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
  {
    id: "week-11",
    weekNumber: 11,
    label: "Week 11",
    workshop: "Workshop 11",
    date: "Final polish",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
  {
    id: "week-12",
    weekNumber: 12,
    label: "Week 12",
    workshop: "Workshop 12",
    date: "Final presentations",
    status: "ready",
    completion: 0,
    submissions: "Available for tutors",
  },
];

export const weeklyMarks: Record<string, StudentMark[]> = {
  "week-4": [
    {
      id: "std-1",
      name: "Aanya Perera",
      studentNumber: "23910451",
      team: "Team 03",
      notes: "Led the schema discussion and clarified API contracts.",
      score: 3,
      previousAverage: 2.7,
      photoUrl: "https://i.pravatar.cc/96?img=47",
    },
    {
      id: "std-2",
      name: "Jared Lee",
      studentNumber: "23917502",
      team: "Team 03",
      notes: "Contributed to planning, but needed prompting on blockers.",
      score: 2,
      previousAverage: 2.2,
      photoUrl: "https://i.pravatar.cc/96?img=12",
    },
    {
      id: "std-3",
      name: "Mina Silva",
      studentNumber: "23899117",
      team: "Team 05",
      notes: "Present but passive. Limited verbal contribution this week.",
      score: 1,
      previousAverage: 1.6,
      photoUrl: "https://i.pravatar.cc/96?img=23",
    },
    {
      id: "std-4",
      name: "Noah Chen",
      studentNumber: "23922180",
      team: "Team 07",
      notes: "Absent and no workshop artefact submitted.",
      score: 0,
      previousAverage: 1.3,
      photoUrl: "https://i.pravatar.cc/96?img=33",
    },
  ],
  "week-6": [
    {
      id: "std-5",
      name: "Sara Wijesekera",
      studentNumber: "23928701",
      team: "Team 06",
      notes: "Prototype walkthrough and evidence uploaded.",
      score: 2,
      previousAverage: 2.4,
      photoUrl: "https://i.pravatar.cc/96?img=44",
    },
    {
      id: "std-6",
      name: "Ethan Wong",
      studentNumber: "23911567",
      team: "Team 02",
      notes: "Clear evidence of facilitation and peer support.",
      score: 3,
      previousAverage: 2.8,
      photoUrl: "https://i.pravatar.cc/96?img=15",
    },
  ],
  "week-9": [
    {
      id: "std-7",
      name: "Leila Fernando",
      studentNumber: "23950117",
      team: "Team 01",
      notes: "Identified defects and assigned owners during iteration review.",
      score: 3,
      previousAverage: 2.5,
      photoUrl: "https://i.pravatar.cc/96?img=38",
    },
    {
      id: "std-8",
      name: "Ben Hart",
      studentNumber: "23941702",
      team: "Team 04",
      notes: "Participated in demo, limited documentation evidence.",
      score: 2,
      previousAverage: 1.9,
      photoUrl: "https://i.pravatar.cc/96?img=52",
    },
  ],
};

export const configWeeks: ConfigWeek[] = [
  { id: "week-1",  weekNumber: 1,  label: "Week 1",  enabled: true,  locked: false },
  { id: "week-2",  weekNumber: 2,  label: "Week 2",  enabled: true,  locked: false },
  { id: "week-3",  weekNumber: 3,  label: "Week 3",  enabled: true,  locked: false },
  { id: "week-4",  weekNumber: 4,  label: "Week 4",  enabled: true,  locked: false },
  { id: "week-5",  weekNumber: 5,  label: "Week 5",  enabled: false, locked: false },
  { id: "week-6",  weekNumber: 6,  label: "Week 6",  enabled: true,  locked: false },
  { id: "week-7",  weekNumber: 7,  label: "Week 7",  enabled: false, locked: false },
  { id: "week-8",  weekNumber: 8,  label: "Week 8",  enabled: false, locked: false },
  { id: "week-9",  weekNumber: 9,  label: "Week 9",  enabled: true,  locked: false },
  { id: "week-10", weekNumber: 10, label: "Week 10", enabled: true,  locked: false },
  { id: "week-11", weekNumber: 11, label: "Week 11", enabled: true,  locked: false },
  { id: "week-12", weekNumber: 12, label: "Week 12", enabled: false, locked: false },
];

export function getWeekById(weekId: string) {
  return participationWeeks.find((week) => week.id === weekId);
}

export function isWeekEnabled(weekId: string): boolean {
  return configWeeks.some((week) => week.id === weekId && week.enabled);
}

export function getMarksForWeek(weekId: string) {
  return weeklyMarks[weekId] ?? [];
}
