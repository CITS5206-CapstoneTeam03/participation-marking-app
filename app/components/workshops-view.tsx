"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppContext } from "../context/app-context";

export function WorkshopsView() {
  const {
    workshops,
    workshopStudents,
    createWorkshop,
    deleteWorkshop,
    updateWorkshopTutor,
    assignCurrentUserAsTutor,
    currentUserName,
    sessionMarks,
    configWeeks,
  } = useAppContext();

  const [newWorkshopName, setNewWorkshopName] = useState("");
  const [newWorkshopTutorEmail, setNewWorkshopTutorEmail] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);
  const [editingTutorEmail, setEditingTutorEmail] = useState("");
  const [confirmDeleteWorkshopId, setConfirmDeleteWorkshopId] = useState<string | null>(null);
  const [workshopError, setWorkshopError] = useState<string | null>(null);

  const enabledWeekIds = useMemo(
    () => new Set(configWeeks.filter((week) => week.enabled).map((week) => week.id)),
    [configWeeks],
  );

  const workshopStats = useMemo(() => {
    const enabledWeekIdList = [...enabledWeekIds];
    return workshops.map((workshop) => {
      const students = workshopStudents[workshop.id] ?? [];
      const studentCount = students.length;
      const studentIds = new Set(students.map((student) => student.studentId));

      const weeksCompleted = enabledWeekIdList.filter((weekId) => {
        if (studentCount === 0) return false;
        const weekMarks = sessionMarks[weekId] ?? {};
        const markedStudents = Object.keys(weekMarks).filter((studentId) => studentIds.has(studentId));
        return markedStudents.length >= studentCount;
      }).length;

      const markEntries = enabledWeekIdList.flatMap((weekId) => {
        const weekMarks = sessionMarks[weekId] ?? {};
        return Object.entries(weekMarks)
          .filter(([studentId]) => studentIds.has(studentId))
          .map(([, score]) => score);
      });
      const totalMarksRecorded = markEntries.length;

      const totalPossibleMarks = studentCount * enabledWeekIdList.length;
      const progress = totalPossibleMarks > 0 ? (totalMarksRecorded / totalPossibleMarks) * 100 : 0;

      const avgScore = totalMarksRecorded > 0
        ? markEntries.reduce<number>((sum, score) => sum + score, 0) / totalMarksRecorded
        : 0;

      return {
        workshop,
        studentCount,
        weeksCompleted,
        totalWeeks: enabledWeekIdList.length,
        progress,
        avgScore,
      };
    });
  }, [workshops, workshopStudents, sessionMarks, enabledWeekIds]);

  const onCreateWorkshop = async () => {
    if (!newWorkshopName.trim()) return;
    setWorkshopError(null);
    try {
      await createWorkshop(newWorkshopName, null, newWorkshopTutorEmail);
      setNewWorkshopName("");
      setNewWorkshopTutorEmail("");
      setShowCreateModal(false);
    } catch {
      setWorkshopError("Unable to create workshop. Check the workshop name and tutor email.");
    }
  };

  const onStartEditTutor = (workshopId: string, tutorEmail: string | null) => {
    setEditingWorkshopId(workshopId);
    setEditingTutorEmail(tutorEmail ?? "");
  };

  const onSaveTutor = async (workshopId: string) => {
    setWorkshopError(null);
    try {
      await updateWorkshopTutor(workshopId, null, editingTutorEmail || null);
      setEditingWorkshopId(null);
      setEditingTutorEmail("");
    } catch {
      setWorkshopError("Unable to update workshop tutor. Use an existing tutor email.");
    }
  };

  const onCancelTutorEdit = () => {
    setEditingWorkshopId(null);
    setEditingTutorEmail("");
  };

  const onConfirmDeleteWorkshop = async () => {
    if (!confirmDeleteWorkshopId) return;
    setWorkshopError(null);
    try {
      await deleteWorkshop(confirmDeleteWorkshopId);
      setConfirmDeleteWorkshopId(null);
    } catch {
      setWorkshopError("Unable to delete workshop.");
    }
  };

  return (
    <>
      <header className="prototype-header">
        <div
          className="workshop-header-row"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1>Workshops</h1>
            <p style={{ marginTop: "8px" }}>Manage tutor assignment and progress by workshop</p>
          </div>
          <button
            type="button"
            className="workshop-create-top-btn"
            onClick={() => setShowCreateModal(true)}
            style={{
              marginLeft: "auto",
              marginTop: "6px",
              height: "42px",
              borderRadius: "12px",
              border: "none",
              background: "#3f5efb",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span>Create Workshop</span>
          </button>
        </div>
      </header>

      {workshopError && (
        <section className="real-page-panel">
          <p className="dashboard-empty">{workshopError}</p>
        </section>
      )}

      <section className="real-page-panel workshops-list">
        {workshopStats.length === 0 ? (
          <article className="prototype-card workshop-empty-card">
            <h2 className="section-card-title">No workshops configured</h2>
            <p className="dashboard-empty">Create a workshop to start assigning tutors and viewing student memberships.</p>
          </article>
        ) : (
          workshopStats.map(({ workshop, studentCount, weeksCompleted, totalWeeks, progress, avgScore }) => {
            const isEditing = editingWorkshopId === workshop.id;
            const assignedToCurrentUser = workshop.tutorName && currentUserName && workshop.tutorName === currentUserName;

            return (
              <article key={workshop.id} className="prototype-card workshop-card">
                <div className="workshop-card-top">
                  <div className="workshop-card-title-wrap">
                    <h2 className="section-card-title workshop-card-title">{workshop.name}</h2>

                    {isEditing ? (
                      <div className="workshop-tutor-edit-row">
                        <input
                          value={editingTutorEmail}
                          onChange={(e) => setEditingTutorEmail(e.target.value)}
                          placeholder="Tutor email"
                          className="workshop-input"
                        />
                        <button type="button" className="workshop-secondary-btn" onClick={() => onSaveTutor(workshop.id)}>
                          Save
                        </button>
                        <button type="button" className="workshop-secondary-btn" onClick={onCancelTutorEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="workshop-tutor-row">
                        <span>Tutor: {workshop.tutorName ?? "Unassigned"}</span>
                        <button
                          type="button"
                          className="workshop-text-btn"
                          onClick={() => onStartEditTutor(workshop.id, workshop.tutorEmail)}
                        >
                          Change
                        </button>
                        {!assignedToCurrentUser && (
                          <button
                            type="button"
                            className="workshop-assign-self-btn"
                            onClick={() => {
                              setWorkshopError(null);
                              assignCurrentUserAsTutor(workshop.id).catch(() => {
                                setWorkshopError("Unable to assign the current user as tutor.");
                              });
                            }}
                          >
                            Assign Myself as Tutor
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="workshop-card-actions">
                    <button
                      type="button"
                      className="workshop-delete-btn"
                      onClick={() => setConfirmDeleteWorkshopId(workshop.id)}
                      style={{
                        height: "42px",
                        borderRadius: "12px",
                        border: "1px solid #efb5b5",
                        background: "#fff1f1",
                        color: "#9f3b3b",
                        fontSize: "15px",
                        fontWeight: 700,
                        padding: "0 16px",
                        minWidth: "114px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="2" />
                        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      className="workshop-upload-btn"
                      style={{
                        height: "42px",
                        borderRadius: "12px",
                        border: "1px solid #d7deec",
                        background: "#f5f8fd",
                        color: "#33445f",
                        fontSize: "15px",
                        fontWeight: 700,
                        padding: "0 16px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      Upload CSV
                    </button>
                    <Link href={`/workshops/${workshop.id}`} className="workshop-view-btn">
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="workshop-stats-row">
                  <div>
                    <p className="workshop-stat-label">Students</p>
                    <p className="workshop-stat-value">{studentCount}</p>
                  </div>
                  <div>
                    <p className="workshop-stat-label">Weeks Completed</p>
                    <p className="workshop-stat-value">{weeksCompleted} / {totalWeeks}</p>
                  </div>
                  <div>
                    <p className="workshop-stat-label">Progress</p>
                    <p className="workshop-stat-value">{progress.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="workshop-stat-label">Avg Score</p>
                    <p className="workshop-stat-value">{avgScore.toFixed(2)}</p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {confirmDeleteWorkshopId && (
        <div className="milestone-overlay" role="dialog" aria-modal="true" aria-labelledby="workshop-delete-title">
          <div className="milestone-modal">
            <h2 className="milestone-modal-title" id="workshop-delete-title">
              Delete Workshop?
            </h2>
            <p className="milestone-modal-body">
              Are you sure you want to delete this workshop? This action removes recorded marks for that workshop.
            </p>
            <div className="milestone-modal-actions">
              <button type="button" className="milestone-modal-btn-primary" onClick={onConfirmDeleteWorkshop}>
                Yes, delete
              </button>
              <button type="button" className="workshop-modal-cancel-btn" onClick={() => setConfirmDeleteWorkshopId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="milestone-overlay" role="dialog" aria-modal="true" aria-labelledby="create-workshop-title">
          <div
            className="workshop-create-modal"
            style={{
              background: "#fff",
              borderRadius: "18px",
              width: "min(560px, 96vw)",
              padding: "28px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            }}
          >
            <h2
              className="workshop-create-modal-title"
              id="create-workshop-title"
              style={{ margin: 0, color: "#121826", fontSize: "42px", fontWeight: 700 }}
            >
              Create New Workshop
            </h2>

            <div className="workshop-create-form" style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
              <label className="workshop-create-label" style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#33445f" }}>Workshop Name</span>
                <input
                  value={newWorkshopName}
                  onChange={(e) => setNewWorkshopName(e.target.value)}
                  placeholder="e.g., Workshop 04"
                  className="workshop-create-field"
                  style={{
                    width: "100%",
                    height: "44px",
                    border: "1px solid #d3dced",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontSize: "16px",
                    color: "#172033",
                  }}
                />
              </label>

              <label className="workshop-create-label" style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#33445f" }}>Tutor Email (Optional)</span>
                <input
                  value={newWorkshopTutorEmail}
                  onChange={(e) => setNewWorkshopTutorEmail(e.target.value)}
                  placeholder="tutor@uwa.edu.au"
                  className="workshop-create-field"
                  style={{
                    width: "100%",
                    height: "44px",
                    border: "1px solid #d3dced",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontSize: "16px",
                    color: "#172033",
                  }}
                />
              </label>
              <p className="workshop-create-help" style={{ margin: "0", color: "#64758b", fontSize: "13px" }}>
                Tutor assignment uses an existing tutor email.
              </p>
            </div>

            <div
              className="workshop-create-actions"
              style={{ marginTop: "18px", display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}
            >
              <button
                type="button"
                className="workshop-create-submit"
                onClick={onCreateWorkshop}
                disabled={!newWorkshopName.trim()}
                style={{
                  height: "42px",
                  border: "none",
                  borderRadius: "12px",
                  background: !newWorkshopName.trim() ? "#b9c7dc" : "#3f5efb",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: !newWorkshopName.trim() ? "not-allowed" : "pointer",
                }}
              >
                Create Workshop
              </button>
              <button
                type="button"
                className="workshop-create-cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkshopName("");
                  setNewWorkshopTutorEmail("");
                }}
                style={{
                  height: "42px",
                  borderRadius: "12px",
                  border: "1px solid #d6deeb",
                  background: "#edf2f9",
                  color: "#172033",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
