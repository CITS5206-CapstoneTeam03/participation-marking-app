import { WorkshopDetailView } from "./workshop-detail-view";

// Required for static export (output: 'export') with dynamic routes.
// We provide at least one sample ID to satisfy the build requirement.
export async function generateStaticParams() {
  return [{ workshopId: "workshop-01" }];
}

export default function WorkshopDetailPage() {
  return <WorkshopDetailView />;
}
