// app/auth/reset/page.tsx
import { Suspense } from "react";
import ResetClient from "./ResetClient";

export const metadata = { title: "Restablecer contraseña — Crussader" };

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetClient />
    </Suspense>
  );
}
