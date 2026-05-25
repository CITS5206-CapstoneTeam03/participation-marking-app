import { Suspense } from "react";
import { WorkshopDetailView } from "./workshop-detail-view";

export default function WorkshopDetailPage() {
  return (
    <Suspense>
      <WorkshopDetailView />
    </Suspense>
  );
}
