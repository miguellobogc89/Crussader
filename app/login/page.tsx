// app/login/page.tsx
import { Suspense } from "react";
import AuthClient from "./AuthClient";

export default async function LoginPage({
  searchParams,
}: {
  // Next 15: searchParams llega como Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const initialTab: "login" | "register" =
    sp?.tab === "register" ? "register" : "login";

  const initialError =
    typeof sp?.error === "string" ? sp.error : undefined;

  // Blindaje con Suspense por si en el cliente hay hooks de navegación
  return (
    <Suspense fallback={null}>
      <AuthClient initialTab={initialTab} initialError={initialError} />
    </Suspense>
  );
}
