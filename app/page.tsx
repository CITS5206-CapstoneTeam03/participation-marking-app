"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CoordinatorDashboard } from "./components/coordinator-dashboard";
import { CoordinatorShell } from "./components/coordinator-shell";
import { TutorDashboard } from "./components/tutor-dashboard";
import { TutorShell } from "./components/tutor-shell";
import { useAppContext } from "./context/app-context";

export default function Home() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticated, viewRole } = useAppContext();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  if (viewRole === "coordinator") {
    return (
      <CoordinatorShell>
        <CoordinatorDashboard />
      </CoordinatorShell>
    );
  }

  return (
    <TutorShell>
      <TutorDashboard />
    </TutorShell>
  );
}
