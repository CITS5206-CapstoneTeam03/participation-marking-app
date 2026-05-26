"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/app-context";
import { getMarksByWorkshopAndWeek, type MarkDto } from "../lib/services/marks";

export function CoordinatorDashboard() {
  const { configWeeks, workshops, workshopStudents, currentUserName, maxWeeklyScore } = useAppContext();
  const [marksByWorkshopWeek, setMarksByWorkshopWeek] = useState<Record<string, Record<number, MarkDto[]>>>({});

  const enabledWeeks = useMemo(
    () => configWeeks.filter((week) => week.enabled),
    [configWeeks],
  );
  const isUnitConfigured = enabledWeeks.length > 0;

  useEffect(() => {
    if (workshops.length === 0 || enabledWeeks.length === 0) {
      return;
    }

    let isCurrent = true;

    Promise.all(
      workshops.map(async (workshop) => {
        const weekResults = await Promise.allSettled(
          enabledWeeks.map(async (week) => {
            const marks = await getMarksByWorkshopAndWeek(workshop.id, week.weekNumber);
            return [week.weekNumber, marks] as const;
          }),
        );
        const weekEntries = weekResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        return [workshop.id, Object.fromEntries(weekEntries)] as const;
      }),
    )
      .then((entries) => {
        if (!isCurrent) return;
        setMarksByWorkshopWeek(Object.fromEntries(entries));
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

  const activeWeek = [...enabledWeeks]
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .find((week) =>
      workshops.some((workshop) => (marksByWorkshopWeek[workshop.id]?.[week.weekNumber] ?? []).length > 0),
    )
    ?? enabledWeeks[enabledWeeks.length - 1]
    ?? null;
  const markedThisWeek = activeWeek
    ? workshops.reduce((sum, workshop) => {
        const workshopStudentIds = new Set((workshopStudents[workshop.id] ?? []).map((student) => student.studentId));
        const marks = marksByWorkshopWeek[workshop.id]?.[activeWeek.weekNumber] ?? [];
        return sum + marks.filter((mark) => workshopStudentIds.has(mark.student_id)).length;
      }, 0)
    : 0;

  const studentTotals = new Map<string, number>();
  workshops.forEach((workshop) => {
    (workshopStudents[workshop.id] ?? []).forEach((student) => {
      studentTotals.set(student.studentId, 0);
    });
  });
  allMarks.forEach((mark) => {
    studentTotals.set(mark.student_id, (studentTotals.get(mark.student_id) ?? 0) + mark.score);
  });
  const maxPossible = enabledWeeks.length * maxWeeklyScore;
  const atRiskCount = maxPossible > 0
    ? [...studentTotals.values()].filter((total) => total / maxPossible < 0.5).length
    : 0;

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
