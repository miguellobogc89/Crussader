// app/providers/AppProviders.tsx
"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/app/components/ui/sidebar";
import type { Session } from "next-auth";

export default function AppProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SidebarProvider>{children}</SidebarProvider>
    </SessionProvider>
  );
}