"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ReviewSession } from "../../../components/review-session";
import { TutorShell } from "../../../components/tutor-shell";
import { useAppContext } from "../../../context/app-context";
import type { Score, StudentMark, StudentScoreMap } from "../../../lib/marking-types";
import type { MarkDto } from "../../../lib/services/marks";
import { createMark, getMarksByWorkshopAndWeek, updateMark } from "../../../lib/services/marks";
import { getConfigWeekById } from "../../../lib/week";

export function ReviewView() {
  const params = useParams();
  const weekId = typeof params.weekId === "string" ? params.weekId : "";
  const {
    activeWorkshopId,
    configWeeks,
    currentUserName,
    workshops,
    workshopStudents,
  } = useAppContext();

  const week = getConfigWeekById(configWeeks, weekId);
  const [loadedMarkData, setLoadedMarkData] = useState<{
    workshopId: string;
    weekNumber: number;
    marks: MarkDto[];
  } | null>(null);
  const [loadErrorData, setLoadErrorData] = useState<{
    workshopId: string;
    weekNumber: number;
    message: string;
  } | null>(null);

  const assignedWorkshops = useMemo(
    () => workshops.filter((workshop) => workshop.tutorName && workshop.tutorName === currentUserName),
    [workshops, currentUserName],
  );
  const selectedWorkshop = assignedWorkshops.find((workshop) => workshop.id === activeWorkshopId)
    ?? assignedWorkshops[0]
    ?? null;
  const selectedWorkshopId = selectedWorkshop?.id ?? null;
  const activeWeekNumber = week?.weekNumber ?? 0;

  if (!week || !week.enabled || week.locked) {
    notFound();
  }

  const rosterStudents = selectedWorkshopId ? (workshopStudents[selectedWorkshopId] ?? []) : [];
  const students: StudentMark[] = rosterStudents.map((student) => ({
    id: student.studentId,
    name: `${student.preferredName ?? student.firstName} ${student.lastName}`,
    studentNumber: student.studentId,
    photoUrl: "",
  }));
  const marks = loadedMarkData?.workshopId === selectedWorkshopId
    && loadedMarkData.weekNumber === activeWeekNumber
    ? loadedMarkData.marks
    : [];
  const scoresByStudent: StudentScoreMap = Object.fromEntries(
    marks.map((mark) => [mark.student_id, mark.score]),
  );
  const loadError = loadErrorData?.workshopId === selectedWorkshopId
    && loadErrorData.weekNumber === activeWeekNumber
    ? loadErrorData.message
    : null;
  const isLoadingMarks = Boolean(
    selectedWorkshopId
    && !loadError
    && !(loadedMarkData?.workshopId === selectedWorkshopId && loadedMarkData.weekNumber === activeWeekNumber),
  );

  useEffect(() => {
    if (!selectedWorkshopId) {
      return;
    }

    let isCurrent = true;

    getMarksByWorkshopAndWeek(selectedWorkshopId, activeWeekNumber)
      .then((loadedMarks) => {
        if (!isCurrent) return;
        setLoadedMarkData({
          workshopId: selectedWorkshopId,
          weekNumber: activeWeekNumber,
          marks: loadedMarks,
        });
        setLoadErrorData(null);
      })
      .catch(() => {
        if (!isCurrent) return;
        setLoadErrorData({
          workshopId: selectedWorkshopId,
          weekNumber: activeWeekNumber,
          message: "Unable to load existing marks for this week.",
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedWorkshopId, activeWeekNumber]);

  async function saveScore(studentId: string, score: Score) {
    if (!selectedWorkshopId) return;

    try {
      const existingMark = marks.find((mark) => mark.student_id === studentId);
      const savedMark = existingMark
        ? await updateMark(existingMark.mark_id, { score })
        : await createMark({
            student_id: studentId,
            workshop_id: Number(selectedWorkshopId),
            week_number: activeWeekNumber,
            score,
          });

      setLoadedMarkData((currentData) => {
        const currentMarks = currentData?.workshopId === selectedWorkshopId
          && currentData.weekNumber === activeWeekNumber
          ? currentData.marks
          : [];
        const otherMarks = currentMarks.filter((mark) => mark.mark_id !== savedMark.mark_id);
        return {
          workshopId: selectedWorkshopId,
          weekNumber: activeWeekNumber,
          marks: [...otherMarks, savedMark],
        };
      });
    } catch (error) {
      console.error("Unable to save participation mark.", {
        error,
        score,
        studentId,
        weekNumber: activeWeekNumber,
        workshopId: selectedWorkshopId,
      });
      throw error;
    }
  }

  return (
    <TutorShell>
      <header className="prototype-header">
        <Link href={`/marking/${weekId}`} className="marking-breadcrumb">
          Back to Marking
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1>Review &amp; Submit</h1>
            <p>{selectedWorkshop?.name ?? "No assigned workshop"} - {week.label}</p>
          </div>
        </div>
      </header>

      <div className="real-page-panel">
        {loadError && <p className="review-warning" role="alert">{loadError}</p>}
        {isLoadingMarks ? (
          <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "48px 0" }}>
            Loading marks...
          </p>
        ) : (
          <ReviewSession
            students={students}
            weekId={weekId}
            weekLabel={week.label}
            scoresByStudent={scoresByStudent}
            onScoreChange={saveScore}
          />
        )}
      </div>
    </TutorShell>
  );
}
