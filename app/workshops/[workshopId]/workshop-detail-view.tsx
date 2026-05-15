"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CoordinatorShell } from "../../components/coordinator-shell";
import { participationWeeks } from "../../data/mock-data";
import { useAppContext, type Score, type WorkshopRecord } from "../../context/app-context";
import { getUsers } from "../../lib/services/user";
import { getWorkshopById, getWorkshopStudents } from "../../lib/services/workshop";

export function WorkshopDetailView() {
  const params = useParams<{ workshopId: string }>();
  const { workshops, sessionMarks, configWeeks } = useAppContext();
  const [apiWorkshop, setApiWorkshop] = useState<WorkshopRecord | null>(null);
  const [loadedWorkshopId, setLoadedWorkshopId] = useState<string | null>(null);
  const [loadedStudentData, setLoadedStudentData] = useState<{
    workshopId: string;
    students: {
      studentId: string;
      firstName: string;
      lastName: string;
      preferredName?: string;
      email: string;
    }[];
  } | null>(null);

  const contextWorkshop = workshops.find((item) => item.id === params.workshopId) ?? null;
  const loadedApiWorkshop = apiWorkshop?.id === params.workshopId ? apiWorkshop : null;
  const workshop = contextWorkshop ?? loadedApiWorkshop;
  const hasLoadedWorkshop = Boolean(contextWorkshop) || loadedWorkshopId === params.workshopId;

  useEffect(() => {
    if (contextWorkshop) {
      return;
    }

    let isCurrent = true;

    Promise.all([getWorkshopById(params.workshopId), getUsers()])
      .then(([workshopDto, users]) => {
        if (!isCurrent) return;
        const tutor = workshopDto.tutor_user_id
          ? users.find((user) => user.user_id === workshopDto.tutor_user_id)
          : null;
        setApiWorkshop({
          id: String(workshopDto.workshop_id),
          name: workshopDto.workshop_name,
          tutorName: tutor?.display_name ?? null,
          tutorEmail: tutor?.email ?? null,
        });
        setLoadedWorkshopId(params.workshopId);
      })
      .catch(() => {
        if (!isCurrent) return;
        setApiWorkshop(null);
        setLoadedWorkshopId(params.workshopId);
      });

    return () => {
      isCurrent = false;
    };
  }, [contextWorkshop, params.workshopId]);

  useEffect(() => {
    let isCurrent = true;

    getWorkshopStudents(params.workshopId)
      .then((studentDtos) => {
        if (!isCurrent) return;
        setLoadedStudentData({
          workshopId: params.workshopId,
          students: studentDtos
            .filter((student) => student.status === "active")
            .map((student) => ({
              studentId: student.student_id,
              firstName: student.first_name,
              lastName: student.last_name,
              preferredName: student.preferred_name ?? undefined,
              email: student.email,
            })),
        });
      })
      .catch(() => {
        if (!isCurrent) return;
        setLoadedStudentData({
          workshopId: params.workshopId,
          students: [],
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [params.workshopId]);

  if (!hasLoadedWorkshop) {
    return null;
  }

  if (!workshop) {
    return (
      <CoordinatorShell>
        <header className="prototype-header">
          <h1>Workshop not found</h1>
          <p>The workshop you requested does not exist.</p>
        </header>
      </CoordinatorShell>
    );
  }

  const enabledWeekIds = new Set(configWeeks.filter((week) => week.enabled).map((week) => week.id));
  const workshopWeekIds = participationWeeks
    .filter((week) => enabledWeekIds.has(week.id))
    .map((week) => week.id);
  const students = loadedStudentData?.workshopId === params.workshopId
    ? loadedStudentData.students
    : [];
  const hasLoadedStudents = loadedStudentData?.workshopId === params.workshopId;

  return (
    <CoordinatorShell>
      <header className="prototype-header">
        <h1>{workshop.name}</h1>
        <p>Student details and participation summary</p>
      </header>

      <section className="real-page-panel">
        <Link href="/workshops" className="marking-breadcrumb">← Back to Workshops</Link>
      </section>

      <section className="real-page-panel">
        <article className="prototype-card dashboard-list-card">
          <h2 className="section-card-title">Students</h2>
          {!hasLoadedStudents ? (
            <p className="dashboard-empty">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="dashboard-empty">No students are assigned to this workshop yet.</p>
          ) : (
            <div className="review-table-wrapper">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Weeks Completed</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const scores = workshopWeekIds
                      .map((weekId) => sessionMarks[weekId]?.[student.studentId])
                      .filter((score): score is Score => typeof score === "number");

                    const avgScore = scores.length > 0
                      ? scores.reduce<number>((sum, score) => sum + score, 0) / scores.length
                      : 0;

                    return (
                      <tr key={student.studentId}>
                        <td>{student.studentId}</td>
                        <td>{student.preferredName || student.firstName} {student.lastName}</td>
                        <td>{student.email}</td>
                        <td>{scores.length} / {workshopWeekIds.length}</td>
                        <td>{avgScore.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </CoordinatorShell>
  );
}
