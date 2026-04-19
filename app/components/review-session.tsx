"use client";

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

  const weekMarks = sessionMarks[weekId] ?? {};

  const totalStudents = students.length;
  const markedCount = Object.keys(weekMarks).length;
  const unmarkedCount = totalStudents - markedCount;
  const canSubmit = unmarkedCount === 0;
  
  // Sort students alphabetically by name (matches Figma)
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  function handleSubmit() {
    // Submission stub — in production this would POST to the backend
    router.push("/marking");
  }

  return (
      <div>
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
                  {/* Photo */}
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="review-photo"
                    />
                  </td>

                  {/* Student ID */}
                  <td>
                    <span className="review-student-id">{student.studentNumber}</span>
                  </td>

                  {/* Name */}
                  <td>
                    <span className="review-student-name">{student.name}</span>
                  </td>

                  {/* Inline score buttons */}
                  <td>
                    <div className="review-score-group" role="group" aria-label={`Score for ${student.name}`}>
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

                  {/* Status label */}
                  <td>
                    <span className="review-status">
                      {isMarked ? SCORE_LABELS[score as Score] : "—"}
                    </span>
                  </td>

                  {/* Marked indicator */}
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

      {/* Footer actions */}
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
    </div>
  );
}
