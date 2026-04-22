"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { TutorShell } from "../../../components/tutor-shell";
import { ReviewSession } from "../../../components/review-session";
import { getWeekById } from "../../../data/mock-data";
import type { StudentMark } from "../../../data/mock-data";
import { useAppContext } from "../../../context/app-context";

export function ReviewView() {
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
      <header className="prototype-header">
        <Link href={`/marking/${weekId}`} className="marking-breadcrumb">
          ← Back to Marking
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1>Review &amp; Submit</h1>
            <p>
              {week.workshop} · {week.label}
            </p>
          </div>
        </div>
      </header>

      <div className="real-page-panel">
        <ReviewSession
          students={students}
          weekId={weekId}
          weekLabel={week.label}
        />
      </div>
    </TutorShell>
  );
}
