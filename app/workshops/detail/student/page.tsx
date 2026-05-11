import { Suspense } from "react";
import { StudentDetailView } from "./student-detail-view";

export default function StudentDetailPage() {
  return (
    <Suspense>
      <StudentDetailView />
    </Suspense>
  );
}
