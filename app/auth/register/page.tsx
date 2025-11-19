// app/auth/register/page.tsx
import { Suspense } from "react";
import RegisterClient from "./RegisterClient_old";

export const metadata = { title: "Crear cuenta — Crussader" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
