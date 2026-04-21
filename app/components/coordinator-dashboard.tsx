"use client";

import Link from "next/link";
// TODO(T-API): replace participationWeeks with GET /weeks API response once backend is integrated
import { participationWeeks } from "../data/mock-data";
import { useAppContext } from "../context/app-context";

export function CoordinatorDashboard() {
  const { configWeeks, sessionMarks, workshops, workshopStudents, currentUserName } = useAppContext();

  const enabledWeeks = configWeeks
    .filter((week) => week.enabled)
    .map((week) => participationWeeks.find((p) => p.id === week.id))
    .filter((week): week is (typeof participationWeeks)[number] => Boolean(week));

  const isUnitConfigured = enabledWeeks.length > 0;
  // TODO(T-API): derive the active/current week from the backend rather than assuming the last enabled week
  const activeWeekId = enabledWeeks[enabledWeeks.length - 1]?.id;
  const markedThisWeek = activeWeekId ? Object.keys(sessionMarks[activeWeekId] ?? {}).length : 0;

  const marksAcrossEnabled = enabledWeeks.flatMap((week) =>
    Object.entries(sessionMarks[week.id] ?? {}).map(([studentId, score]) => ({
      id: studentId,
      name: studentId,
      score,
    })),
  );

  const avgParticipation = marksAcrossEnabled.length
    ? (
        marksAcrossEnabled.reduce((sum, mark) => sum + mark.score, 0) /
        marksAcrossEnabled.length
      ).toFixed(2)
    : "0.00";

  const studentAverages = new Map<string, { name: string; total: number; count: number }>();
  marksAcrossEnabled.forEach((mark) => {
    const current = studentAverages.get(mark.id) ?? { name: mark.name, total: 0, count: 0 };
    current.total += mark.score;
    current.count += 1;
    studentAverages.set(mark.id, current);
  });
  const atRiskCount = [...studentAverages.values()].filter(
    (student) => student.count > 0 && student.total / student.count < 1.5,
  ).length;

  const totalStudents = workshops.reduce(
    (sum, workshop) => sum + (workshopStudents[workshop.id]?.length ?? 0),
    0,
  );

  const recentWeekSummaries = [...enabledWeeks]
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .slice(0, 5)
    .map((week) => ({
      week: week.weekNumber,
      marks: Object.keys(sessionMarks[week.id] ?? {}).length,
    }))
    .filter((item) => item.marks > 0);

  return (
    <>
      <header className="prototype-header">
        <h1>Welcome back, {currentUserName || "Coordinator"}</h1>
        <p>Overview of all workshops and participation tracking</p>
      </header>

      {!isUnitConfigured && (
        <section className="real-page-panel">
          <article className="prototype-card dashboard-alert">
            <h2 className="dashboard-alert-title">Unit Not Configured</h2>
            <p className="dashboard-alert-body">
            Please configure participation weeks and weighting before tutors start marking.
            </p>
            <Link href="/config" className="dashboard-alert-btn">Go to Settings</Link>
          </article>
        </section>
      )}

      <section className="real-page-panel dashboard-metric-grid">
        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">Total Students</p>
          <p className="dashboard-metric-value">{totalStudents}</p>
        </article>
        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">Marked This Week</p>
          <p className="dashboard-metric-value">{markedThisWeek}</p>
        </article>
        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">At-Risk Students</p>
          <p className="dashboard-metric-value">{atRiskCount}</p>
        </article>
        <article className="prototype-card dashboard-metric-card">
          <p className="dashboard-metric-label">Avg Participation</p>
          <p className="dashboard-metric-value">{avgParticipation}</p>
        </article>
      </section>

      <section className="dashboard-section-grid">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Workshops</h2>
          <div className="dashboard-list">
            {workshops.map((workshop) => {
              const workshopStudentList = workshopStudents[workshop.id] ?? [];
              const workshopStudentCount = workshopStudentList.length;
              const workshopStudentIds = new Set(workshopStudentList.map((student) => student.studentId));
              const workshopMarks = isUnitConfigured
                ? enabledWeeks.reduce((sum, week) => {
                    const markedCount = Object.keys(sessionMarks[week.id] ?? {}).filter((studentId) =>
                      workshopStudentIds.has(studentId),
                    ).length;
                    return sum + markedCount;
                  }, 0)
                : 0;
              return (
                <div
                  key={workshop.id}
                  className="dashboard-list-row"
                >
                  <div>
                    <p className="dashboard-list-title">{workshop.name}</p>
                    <p className="dashboard-list-sub">{workshopStudentCount} students</p>
                  </div>
                  <span className="dashboard-badge">{workshopMarks} marks</span>
                </div>
              );
            })}
            {workshops.length === 0 && <p className="dashboard-empty">No workshops configured yet.</p>}
          </div>
        </article>

        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Recent Activity</h2>
          <div className="dashboard-list">
            {recentWeekSummaries.length > 0 ? (
              recentWeekSummaries.map((activity, idx) => (
                <div
                  key={`${activity.week}-${idx}`}
                  className="dashboard-list-row"
                >
                  <div>
                    <p className="dashboard-list-title">Week {activity.week} update</p>
                    <p className="dashboard-list-sub">Participation entries recorded</p>
                  </div>
                  <span className="dashboard-badge">{activity.marks} marks</span>
                </div>
              ))
            ) : (
              <p className="dashboard-empty">No participation marks recorded yet</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
