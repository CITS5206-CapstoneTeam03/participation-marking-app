import { WorkshopDetailView } from "./workshop-detail-view";

export async function generateStaticParams() {
  return [{ workshopId: "workshop-01" }];
}

export default function WorkshopDetailPage() {
  return <WorkshopDetailView />;
}
