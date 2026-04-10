"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkingCard } from "./marking-card";
import type { Score } from "../data/mock-data";
import type { StudentMark } from "../data/mock-data";
import { useAppContext } from "../context/app-context";

type MarkingSessionProps = {
  students: StudentMark[];
  weekId: string;
  weekLabel: string;
};

/**
 * Sequential single-student marking session (T-201 / FR-3.1, FR-3.2).
 *
 * Mark state is lifted to AppContext so that:
 *  - The week selection screen can show accurate "X / Y marked" counts.
 *  - The Review & Submit page can read marks without prop drilling.
 *  - T-202 (auto-advance, FR-3.3) can extend handleSelect here without
 *    touching the card component at all.
 *
 * To implement auto-advance (T-202), add after setMark:
 *   setTimeout(() => goToNext(), AUTO_ADVANCE_DELAY_MS);
 */
export function MarkingSession({ students, weekId, weekLabel }: MarkingSessionProps) {
  const { sessionMarks, setMark } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const isLastStudent = currentIndex === students.length - 1;

  const weekMarks = sessionMarks[weekId] ?? {};
  const currentStudent = students[currentIndex];
  const currentScore: Score | null = currentStudent
    ? ((weekMarks[currentStudent.id] ?? null) as Score | null)
    : null;
  const markedCount = Object.keys(weekMarks).length;
  const progressPercent = students.length > 0 ? (markedCount / students.length) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelect(score: Score) {
    if (!currentStudent) return;
    setMark(weekId, currentStudent.id, score);
    // T-202: add auto-advance here — e.g. setTimeout(() => goToNext(), 300);
  }

  function goToPrevious() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function goToNext() {
    setCurrentIndex((i) => Math.min(students.length - 1, i + 1));
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!currentStudent) {
    return (
      <div className="marking-session">
        <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "48px 0" }}>
          No students found for {weekLabel}.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="marking-session">
      {/* Progress (FR-3.4 — visible marking status) */}
      <div className="marking-progress" role="status" aria-live="polite">
        <div className="marking-progress-labels">
          <span className="marking-progress-student">Progress</span>
          <span className="marking-progress-count">
            {markedCount} of {students.length}
          </span>
        </div>
        <div className="marking-progress-track">
          <div
            className="marking-progress-fill"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={markedCount}
            aria-valuemin={0}
            aria-valuemax={students.length}
            aria-label={`${markedCount} of ${students.length} students marked`}
          />
        </div>
      </div>

      {/* Marking card (FR-3.1, FR-3.2) */}
      <MarkingCard
        student={currentStudent}
        score={currentScore}
        onSelect={handleSelect}
      />

      {/* Navigation — T-202 replaces manual Next with auto-advance */}
      <nav className="marking-nav" aria-label="Student navigation">
        <button
          type="button"
          className="marking-nav-btn"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          aria-label="Previous student"
        >
          ‹ Previous
        </button>

        {isLastStudent ? (
          <button
            type="button"
            className="marking-nav-btn marking-nav-btn--complete"
            onClick={() => router.push(`/marking/${weekId}/review`)}
            aria-label="Review all marks"
          >
            Complete
          </button>
        ) : (
          <button
            type="button"
            className="marking-nav-btn"
            onClick={goToNext}
            aria-label="Next student"
          >
            Next ›
          </button>
        )}
      </nav>
    </div>
  );
}
