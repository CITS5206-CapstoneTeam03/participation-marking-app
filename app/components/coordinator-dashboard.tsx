"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/app-context";
import { getMarksByWorkshopAndWeek, type MarkDto } from "../lib/services/marks";

export function CoordinatorDashboard() {
  const { configWeeks, workshops, workshopStudents, currentUserName } = useAppContext();
  const [marksByWorkshopWeek, setMarksByWorkshopWeek] = useState<Record<string, Record<number, MarkDto[]>>>({});

  const enabledWeeks = useMemo(
    () => configWeeks.filter((week) => week.enabled),
    [configWeeks],
  );
  const isUnitConfigured = enabledWeeks.length > 0;
  const activeWeek = enabledWeeks[enabledWeeks.length - 1] ?? null;

  useEffect(() => {
    if (workshops.length === 0 || enabledWeeks.length === 0) {
      return;
    }

    let isCurrent = true;

    Promise.all(
      workshops.map(async (workshop) => {
        const weekEntries = await Promise.all(
          enabledWeeks.map(async (week) => {
            const marks = await getMarksByWorkshopAndWeek(workshop.id, week.weekNumber);
            return [week.weekNumber, marks] as const;
          }),
        );
        return [workshop.id, Object.fromEntries(weekEntries)] as const;
      }),
    )
      .then((entries) => {
        if (!isCurrent) return;
        setMarksByWorkshopWeek(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!isCurrent) return;
        setMarksByWorkshopWeek({});
      });

    return () => {
      isCurrent = false;
    };
  }, [workshops, enabledWeeks]);

  const allMarks = workshops.flatMap((workshop) =>
    enabledWeeks.flatMap((week) => marksByWorkshopWeek[workshop.id]?.[week.weekNumber] ?? []),
  );
  const avgParticipation = allMarks.length
    ? (allMarks.reduce((sum, mark) => sum + mark.score, 0) / allMarks.length).toFixed(2)
    : "0.00";

  const markedThisWeek = activeWeek
    ? workshops.reduce((sum, workshop) => {
        const workshopStudentIds = new Set((workshopStudents[workshop.id] ?? []).map((student) => student.studentId));
        const marks = marksByWorkshopWeek[workshop.id]?.[activeWeek.weekNumber] ?? [];
        return sum + marks.filter((mark) => workshopStudentIds.has(mark.student_id)).length;
      }, 0)
    : 0;

  const studentAverages = new Map<string, { total: number; count: number }>();
  allMarks.forEach((mark) => {
    const current = studentAverages.get(mark.student_id) ?? { total: 0, count: 0 };
    current.total += mark.score;
    current.count += 1;
    studentAverages.set(mark.student_id, current);
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
      marks: workshops.reduce((sum, workshop) => {
        const workshopStudentIds = new Set((workshopStudents[workshop.id] ?? []).map((student) => student.studentId));
        const marks = marksByWorkshopWeek[workshop.id]?.[week.weekNumber] ?? [];
        return sum + marks.filter((mark) => workshopStudentIds.has(mark.student_id)).length;
      }, 0),
    }))
    .filter((item) => item.marks > 0);

  return (
    <>
      <header className="prototype-header">
        <h1>Welcome back, {currentUserName}</h1>
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
              const workshopMarks = enabledWeeks.reduce((sum, week) => {
                const marks = marksByWorkshopWeek[workshop.id]?.[week.weekNumber] ?? [];
                return sum + marks.filter((mark) => workshopStudentIds.has(mark.student_id)).length;
              }, 0);
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
