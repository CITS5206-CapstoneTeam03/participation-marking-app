"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { TutorShell } from "../../components/tutor-shell";
import { MarkingSession } from "../../components/marking-session";
import { WeekDropdown } from "../../components/week-dropdown";
import { getWeekById } from "../../data/mock-data";
import type { StudentMark } from "../../data/mock-data";
import { useAppContext } from "../../context/app-context";

export default function WeekMarkingPage() {
  const params = useParams();
  const weekId = typeof params.weekId === "string" ? params.weekId : "";
  const week = getWeekById(weekId);

  const { activeWorkshopId, workshopStudents } = useAppContext();

  if (!week) {
    notFound();
  }

  const rosterStudents = activeWorkshopId ? (workshopStudents[activeWorkshopId] ?? []) : [];
  const students: StudentMark[] = rosterStudents.map((s) => ({
    id: s.studentId,
    name: `${s.preferredName ?? s.firstName} ${s.lastName}`,
    studentNumber: s.studentId,
    team: "",
    notes: "",
    score: 0,
    previousAverage: 0,
    photoUrl: "",
  }));

  return (
    <TutorShell>
      <header className="prototype-header marking-page-header">
        <div>
          <h1>Mark Participation</h1>
          <p>
            {week.workshop} – {week.label}
          </p>
        </div>

        <div className="marking-header-controls">
          <WeekDropdown currentWeekId={weekId} />
          <Link href={`/marking/${weekId}/review`} className="review-all-btn">
            Review All
          </Link>
        </div>
      </header>

      <div className="real-page-panel">
        <MarkingSession
          students={students}
          weekId={weekId}
          weekLabel={week.label}
        />
      </div>
    </TutorShell>
  );
}
