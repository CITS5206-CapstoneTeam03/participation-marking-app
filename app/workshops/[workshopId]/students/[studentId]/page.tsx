import { StudentDetailView } from "./student-detail-view";

// Required for static export with dynamic routes.
export async function generateStaticParams() {
  return [{ workshopId: "workshop-01", studentId: "22001234" }];
}

export default function StudentDetailPage() {
  return <StudentDetailView />;
}
