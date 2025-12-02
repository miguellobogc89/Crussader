// app/dashboard/home/page.tsx
"use client";

import WelcomePanel from "@/app/components/home/WelcomePanel";
import ReputationStatsPanel from "@/app/components/home/ReputationStatsPanel";
import AlertsPanel from "@/app/components/home/AlertsPanel";
import IntegrationsPanel from "@/app/components/home/IntegrationsPanel";
import ActivityPanel from "@/app/components/home/ActivityPanel";
import QuickActionsPanel from "@/app/components/home/QuickActionsPanel";
import FreeTrialPanel from "@/app/components/home/FreeTrialPanel";

export default function DashboardHomePage() {
  const name = "Miguel"; // ya lo tienes con session.user

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 xl:px-32 py-8">

      <WelcomePanel name={name} />

      <ReputationStatsPanel />

      <AlertsPanel unread={3} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntegrationsPanel />
        <ActivityPanel />
      </div>

      <QuickActionsPanel />

      <FreeTrialPanel />
    </div>
  );
}
