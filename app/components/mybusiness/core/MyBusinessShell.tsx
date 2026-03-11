// app/components/mybusiness/core/MyBusinessShell.tsx
"use client";

import React from "react";

import ValidationReputationCard from "@/app/components/mybusiness/core/widgets/ValidationReputationCard";
import BillingCostsCard from "@/app/components/mybusiness/core/widgets/BillingCostsCard";
import AppointmentsCard from "@/app/components/mybusiness/core/widgets/AppointmentsCard";
import CommunicationsCard from "@/app/components/mybusiness/core/widgets/CommunicationsCard";
import CustomersCard from "@/app/components/mybusiness/core/widgets/CustomersCard";
import IntegrationsActiveCard from "@/app/components/mybusiness/core/widgets/IntegrationsActiveCard";
import RisksAlertsCard from "@/app/components/mybusiness/core/widgets/RisksAlertsCard";
import CapacityUtilizationCard from "@/app/components/mybusiness/core/widgets/CapacityUtilizationCard";
import QualityServiceCard from "@/app/components/mybusiness/core/widgets/QualityServiceCard";
import ActivityFeedCard from "@/app/components/mybusiness/core/widgets/ActivityFeedCard";

export default function MyBusinessShell() {
  return (
    <div className="w-full">
      {/* Root: 1 columna hasta xl; en xl vuelve a 12 cols + sidebar */}
        <div className="space-y-4 xl:col-span-8">
          {/* cards en 1 col hasta xl; en xl se parten a 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ValidationReputationCard />
            <AppointmentsCard />

            <BillingCostsCard />
            <CommunicationsCard />

            <CustomersCard />
            <IntegrationsActiveCard />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CapacityUtilizationCard />
            <QualityServiceCard />
          </div>

          <ActivityFeedCard />
        </div>


      </div>
  );
}