// app/dashboard/settings/general/page.tsx
"use client";

import UserPersonalInfoCard from "@/app/components/settings/UserPersonalInfoCard";
import AccountDangerZone from "@/app/components/settings/account/AccountDangerZone";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-8">
      <UserPersonalInfoCard />
      <AccountDangerZone />
    </div>
  );
}

