"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentMark, Score } from "../data/mock-data";
import { useAppContext } from "../context/app-context";

const SCORE_LABELS: Record<Score, string> = {
  0: "Absent",
  1: "Present but disengaged",
  2: "Active participation",
  3: "Highly engaged",
};

const SCORE_VALUES: Score[] = [0, 1, 2, 3];

type ReviewSessionProps = {
  students: StudentMark[];
  weekId: string;
  weekLabel: string;
};

/**
 * Review & Submit table — shows all students for the week with their
 * current scores (from context). Allows inline score correction before
 * final submission.
 */
export function ReviewSession({ students, weekId, weekLabel }: ReviewSessionProps) {
  const router = useRouter();
  const { sessionMarks, setMark } = useAppContext();
  const [showMilestone, setShowMilestone] = useState(false);

  const weekMarks = sessionMarks[weekId] ?? {};

  const totalStudents = students.length;
  const markedCount = students.filter((student) => weekMarks[student.id] !== undefined).length;
  const unmarkedCount = totalStudents - markedCount;
  const canSubmit = unmarkedCount === 0;

  // Sort students alphabetically by name (matches Figma)
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  function handleSubmit() {
    if (!canSubmit) return;

    // Show Week 6 milestone popup before navigating away
    if (weekId === "week-6") {
      setShowMilestone(true);
      return;
    }

    router.push("/marking");
  }

  function dismissMilestone() {
    setShowMilestone(false);
    router.push("/marking");
  }

  return (
    <>
      {/* Week 6 milestone modal */}
      {showMilestone && (
        <div
          className="milestone-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-title"
        >
          <div className="milestone-modal">
            <div className="milestone-modal-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--mint)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="milestone-modal-title" id="milestone-title">
              Week 6 Milestone Reached
            </h2>
            <p className="milestone-modal-body">
              You have completed participation marking for the first half of semester.
              The Unit Coordinator can now review and lock Weeks 1–6 in Settings.
            </p>
            <div className="milestone-modal-actions">
              <button
                type="button"
                className="milestone-modal-btn-primary"
                onClick={dismissMilestone}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="review-summary" aria-label="Review summary">
        <div className="review-summary-card">
          <span className="review-summary-label">Total students</span>
          <strong className="review-summary-value">{totalStudents}</strong>
        </div>
        <div className="review-summary-card">
          <span className="review-summary-label">Marked</span>
          <strong className="review-summary-value">{markedCount}</strong>
        </div>
        <div className="review-summary-card">
          <span className="review-summary-label">Unmarked</span>
          <strong className="review-summary-value">{unmarkedCount}</strong>
        </div>
      </section>

      {unmarkedCount > 0 && (
        <p className="review-warning" role="alert">
          {unmarkedCount} student{unmarkedCount === 1 ? "" : "s"} still need{" "}
          mark{unmarkedCount === 1 ? "" : "s"} before submission.
        </p>
      )}

      <div className="review-table-wrapper">
        <table className="review-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => {
              const score = weekMarks[student.id] ?? null;
              const isMarked = score !== null;

              return (
                <tr key={student.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="review-photo"
                    />
                  </td>

                  <td>
                    <span className="review-student-id">{student.studentNumber}</span>
                  </td>

                  <td>
                    <span className="review-student-name">{student.name}</span>
                  </td>

                  <td>
                    <div
                      className="review-score-group"
                      role="group"
                      aria-label={`Score for ${student.name}`}
                    >
                      {SCORE_VALUES.map((val) => (
                        <button
                          key={val}
                          type="button"
                          data-score={val}
                          className={`review-score-btn${score === val ? " selected" : ""}`}
                          onClick={() => setMark(weekId, student.id, val)}
                          aria-pressed={score === val}
                          aria-label={`Score ${val}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className="review-status">
                      {isMarked ? SCORE_LABELS[score as Score] : "—"}
                    </span>
                  </td>

                  <td>
                    {isMarked ? (
                      <span className="review-marked">✓ Marked</span>
                    ) : (
                      <span className="review-unmarked">Not marked</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="review-actions">
        <button
          type="button"
          className="marking-nav-btn marking-nav-btn--primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          style={{ padding: "13px 28px" }}
        >
          Submit &amp; Complete
        </button>
        <button
          type="button"
          className="marking-nav-btn"
          onClick={() => router.push(`/marking/${weekId}`)}
        >
          Back to Marking
        </button>
      </div>
    </>
  );
}
