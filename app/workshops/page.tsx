"use client";

import { CoordinatorShell } from "../components/coordinator-shell";
import { WorkshopsView } from "../components/workshops-view";

export default function WorkshopsPage() {
  return (
    <CoordinatorShell>
      <WorkshopsView />
    </CoordinatorShell>
  );
}
