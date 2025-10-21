// app/auth/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = { title: "Iniciar sesión — Crussader" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
