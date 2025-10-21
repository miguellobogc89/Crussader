// app/auth/register/page.tsx
import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const metadata = { title: "Crear cuenta — Crussader" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
