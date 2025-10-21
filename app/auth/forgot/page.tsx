// app/auth/forgot/page.tsx
import { Suspense } from "react";
import ForgotClient from "./ForgotClient";

export const metadata = { title: "Recuperar contraseña — Crussader" };

export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <ForgotClient />
    </Suspense>
  );
}
