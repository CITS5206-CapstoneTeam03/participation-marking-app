"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/app-context";
import { getMarksByWorkshopAndWeek, type MarkDto } from "../lib/services/marks";

export function TutorDashboard() {
  const {
    configWeeks,
    maxWeeklyScore,
    workshops,
    workshopStudents,
    currentUserName,
  } = useAppContext();
  const [marksByWorkshopWeek, setMarksByWorkshopWeek] = useState<Record<string, Record<number, MarkDto[]>>>({});

  const enabledWeeks = useMemo(
    () => configWeeks.filter((week) => week.enabled),
    [configWeeks],
  );
  const totalWeeksConfigured = enabledWeeks.length;
  const totalParticipationPoints = totalWeeksConfigured * maxWeeklyScore;

  const assignedWorkshops = useMemo(() => {
    return workshops.filter((workshop) => workshop.tutorName && workshop.tutorName === currentUserName);
  }, [workshops, currentUserName]);

  useEffect(() => {
    if (assignedWorkshops.length === 0 || enabledWeeks.length === 0) {
      return;
    }

    let isCurrent = true;

    Promise.all(
      assignedWorkshops.map(async (workshop) => {
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
      .catch((error) => {
        if (!isCurrent) return;
        console.error("Unable to load tutor dashboard marks.", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [assignedWorkshops, enabledWeeks]);

  const stats = useMemo(() => {
    const perWorkshop = assignedWorkshops.map((workshop) => {
      const students = workshopStudents[workshop.id] ?? [];
      const studentCount = students.length;
      const studentIds = new Set(students.map((student) => student.studentId));

      const workshopMarksByWeek = marksByWorkshopWeek[workshop.id] ?? {};
      const marksRecorded = enabledWeeks.reduce((sum, week) => {
        const weekMarks = workshopMarksByWeek[week.weekNumber] ?? [];
        const markedStudents = weekMarks.filter((mark) => studentIds.has(mark.student_id));
        return sum + markedStudents.length;
      }, 0);

      const workshopCompletedWeeks = enabledWeeks.filter((week) => {
        if (studentCount === 0) return false;
        const weekMarks = workshopMarksByWeek[week.weekNumber] ?? [];
        const markedStudents = weekMarks.filter((mark) => studentIds.has(mark.student_id));
        return markedStudents.length >= studentCount;
      }).length;

      const possibleMarks = studentCount * enabledWeeks.length;

      return {
        workshop,
        studentCount,
        workshopWeekCount: enabledWeeks.length,
        marksRecorded,
        completedWeeks: workshopCompletedWeeks,
        possibleMarks,
      };
    });

    const totalStudents = perWorkshop.reduce((sum, item) => sum + item.studentCount, 0);
    const completedWeeks = perWorkshop.reduce((sum, item) => sum + item.completedWeeks, 0);
    const totalWorkshopWeeks = perWorkshop.reduce((sum, item) => sum + item.workshopWeekCount, 0);
    const totalMarksRecorded = perWorkshop.reduce((sum, item) => sum + item.marksRecorded, 0);
    const totalPossibleMarks = perWorkshop.reduce((sum, item) => sum + item.possibleMarks, 0);
    const completionPercentage = totalPossibleMarks > 0 ? (totalMarksRecorded / totalPossibleMarks) * 100 : 0;

    return {
      perWorkshop,
      totalStudents,
      completedWeeks,
      totalWorkshopWeeks,
      completionPercentage,
    };
  }, [assignedWorkshops, workshopStudents, marksByWorkshopWeek, enabledWeeks]);

  const workshopLabel = assignedWorkshops.length === 1 ? assignedWorkshops[0].name : `${assignedWorkshops.length} workshops`;

  return (
    <div className="tutor-dashboard">
      <header className="prototype-header">
        <h1>Welcome back, {currentUserName}</h1>
        <p>Managing {workshopLabel} • {stats.totalStudents} students</p>
      </header>

      <section className="real-page-panel">
        <article className="prototype-card tutor-config-banner">
          <div className="tutor-config-head">
            <span className="tutor-config-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="section-card-title">Unit Configuration</h2>
          </div>
          <p className="dashboard-config-copy tutor-config-copy">
            This unit has <strong>{totalWeeksConfigured} participation weeks</strong> configured by the Unit Coordinator.
          </p>
          <p className="dashboard-config-copy tutor-config-copy">
            Total participation points: <strong>{totalParticipationPoints}</strong> ({totalWeeksConfigured} weeks × {maxWeeklyScore} max score)
          </p>
        </article>
      </section>

      <section className="dashboard-metric-grid dashboard-metric-grid--three">
        <article className="prototype-card dashboard-metric-card">
          <span className="tutor-stat-icon tutor-stat-icon--blue" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.2" />
              <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="dashboard-metric-label tutor-metric-label">Total Students</p>
          <p className="dashboard-metric-value">{stats.totalStudents}</p>
        </article>

        <article className="prototype-card dashboard-metric-card">
          <span className="tutor-stat-icon tutor-stat-icon--green" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l6 3v5c0 5-3.4 8-6 9-2.6-1-6-4-6-9V6l6-3z" stroke="currentColor" strokeWidth="2.2" />
              <path d="M9.5 12.5l2 2L14.8 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="dashboard-metric-label tutor-metric-label">Weeks Completed</p>
          <p className="dashboard-metric-value">{stats.completedWeeks} / {stats.totalWorkshopWeeks}</p>
        </article>

        <article className="prototype-card dashboard-metric-card">
          <span className="tutor-stat-icon tutor-stat-icon--indigo" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2.2" />
              <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <p className="dashboard-metric-label tutor-metric-label">Progress</p>
          <p className="dashboard-metric-value">{stats.completionPercentage.toFixed(0)}%</p>
        </article>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card dashboard-progress-card">
          <h2 className="section-card-title">Overall Marking Progress</h2>
          <div className="dashboard-progress-track">
            <div className="dashboard-progress-fill" style={{ width: `${stats.completionPercentage}%` }} />
          </div>
          <p className="dashboard-progress-copy">
            {stats.completedWeeks} of {stats.totalWorkshopWeeks} workshop-weeks fully marked
          </p>
        </article>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Assigned Workshops</h2>
          {stats.perWorkshop.length === 0 ? (
            <p className="dashboard-empty">No workshops are assigned to your account yet.</p>
          ) : (
            <div className="dashboard-list">
              {stats.perWorkshop.map((item) => (
                <div key={item.workshop.id} className="dashboard-list-row">
                  <div>
                    <p className="dashboard-list-title">{item.workshop.name}</p>
                    <p className="dashboard-list-sub">{item.studentCount} students • {item.completedWeeks}/{item.workshopWeekCount} weeks completed</p>
                  </div>
                  <span className="dashboard-badge">{item.marksRecorded} marks</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Quick Actions</h2>
          <div className="dashboard-cta-grid dashboard-cta-grid--two">
            <Link href="/marking" className="dashboard-cta dashboard-cta--tutor">
              Mark Participation
              <span className="dashboard-cta-sub">Record student participation for selected weeks</span>
            </Link>
            <Link href="/analytics" className="dashboard-cta dashboard-cta--tutor dashboard-cta--secondary">
              View Analytics
              <span className="dashboard-cta-sub">See detailed student performance reports</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
