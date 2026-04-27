"use client";

import { useEffect, useMemo, useState } from "react";
import { CoordinatorShell } from "../components/coordinator-shell";
import { getStudents, updateStudent, type StudentDto } from "../lib/services/student";

function buildStudentDisplayName(student: StudentDto): string {
  if (student.preferred_name?.trim()) {
    return `${student.preferred_name} ${student.last_name}`;
  }
  return `${student.first_name} ${student.last_name}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadStudentList();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadStudentList() {
    try {
      setIsLoadingStudents(true);
      setLoadError(null);
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);
      setLoadError("Failed to load students.");
    } finally {
      setIsLoadingStudents(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeBytes) {
      setMessage("Please upload an image smaller than 2MB.");
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setMessage(null);
  }

  function clearSelectedPhoto() {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMessage(null);
  }

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return students;

    return students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const preferredName = (student.preferred_name ?? "").toLowerCase();
      const email = student.email.toLowerCase();
      const studentId = student.student_id.toLowerCase();

      return (
        fullName.includes(q) ||
        preferredName.includes(q) ||
        email.includes(q) ||
        studentId.includes(q)
      );
    });
  }, [students, searchTerm]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  async function handleMatchPhoto() {
    if (!selectedFile) {
      setMessage("Please select a photo first.");
      return;
    }

    if (!selectedStudentId) {
      setMessage("Please select a student first.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const dataUrl = await fileToDataUrl(selectedFile);

      const updated = await updateStudent(selectedStudentId, {
        image_url: dataUrl,
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.student_id === updated.student_id ? updated : student,
        ),
      );

      setMessage(`Photo matched successfully to ${buildStudentDisplayName(updated)}.`);

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      setMessage("Failed to match photo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CoordinatorShell>
      <div className="prototype-header mb-6">
        <h1>Manual Photo Matching</h1>
        <p>Upload a student photo and manually link it to a student profile.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.2fr]">
        <section className="panel p-7">
          <div className="mb-4">
            <p className="text-lg font-bold tracking-tight text-[var(--navy)]">
              Photo Preview
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Upload a photo file and preview it before linking.
            </p>
          </div>

          <label
            htmlFor="student-photo-upload"
            className="mb-4 inline-flex cursor-pointer items-center rounded-xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy)] hover:border-[var(--brand)]"
          >
            Choose Photo
          </label>
          <input
            id="student-photo-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Selected student preview"
                  className="h-[320px] w-full rounded-2xl border border-[var(--line)] object-cover bg-white"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={clearSelectedPhoto}
                    className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--navy)] hover:bg-white"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white text-center">
                <div>
                  <p className="text-sm font-semibold text-[var(--navy)]">
                    No photo selected
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Upload a PNG, JPG, or WEBP image to start matching.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel p-7">
          <div className="mb-4">
            <p className="text-lg font-bold tracking-tight text-[var(--navy)]">
              Match to Student
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Search by student ID, name, or email and then link the uploaded photo.
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-[var(--navy)]">
              Search Student
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by ID, name, or email"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-[var(--navy)]">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            >
              <option value="">Select a student</option>
              {filteredStudents.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.student_id} — {buildStudentDisplayName(student)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            {isLoadingStudents ? (
              <p className="text-sm text-[var(--ink-soft)]">Loading students...</p>
            ) : loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : selectedStudent ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--navy)]">
                    Selected Student
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                        Student ID
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--navy)]">
                        {selectedStudent.student_id}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-semibold capitalize text-[var(--navy)]">
                        {selectedStudent.status}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                        Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--navy)]">
                        {buildStudentDisplayName(selectedStudent)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-white p-3 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--navy)]">
                        {selectedStudent.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--navy)]">
                    Current Photo
                  </p>
                  {selectedStudent.image_url ? (
                    <img
                      src={selectedStudent.image_url}
                      alt={`${buildStudentDisplayName(selectedStudent)} current profile`}
                      className="h-40 w-40 rounded-2xl border border-[var(--line)] object-cover bg-white"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white text-center text-sm text-[var(--ink-soft)]">
                      No photo linked
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">
                Search for a student and select one to continue.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleMatchPhoto}
              disabled={isSaving || !selectedFile || !selectedStudentId}
              className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Matching..." : "Match Photo"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedStudentId("");
                setMessage(null);
              }}
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--navy)] hover:bg-white"
            >
              Clear Selection
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--navy)]">
              {message}
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel mt-6 p-7">
        <div className="mb-4">
          <p className="text-lg font-bold tracking-tight text-[var(--navy)]">
            Student Photo Status
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Quick overview of which students already have a linked photo.
          </p>
        </div>

        {isLoadingStudents ? (
          <p className="text-sm text-[var(--ink-soft)]">Loading students...</p>
        ) : loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Photo</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id} className="rounded-2xl bg-[var(--panel)]">
                    <td className="px-3 py-3 text-sm font-semibold text-[var(--navy)]">
                      {student.student_id}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--navy)]">
                      {buildStudentDisplayName(student)}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--navy)]">
                      {student.email}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--navy)]">
                      {student.image_url ? "Matched" : "Not matched"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CoordinatorShell>
  );
}