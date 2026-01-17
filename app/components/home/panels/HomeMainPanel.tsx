"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import HomeCardsRow from "@/app/components/home/panels//HomeCardsRow";

type Props = {
  companyId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  employeesText: string;
};

export default function HomeMainPanel({
  companyId,
  name,
  email,
  phone,
  address,
  employeesText,
}: Props) {
  return (
    <Card className="bg-white border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800 text-lg">Vista general de tu negocio</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <HomeCardsRow
          companyId={companyId}
          name={name}
          email={email}
          phone={phone}
          address={address}
          employeesText={employeesText}
        />
      </CardContent>
    </Card>
  );
}
