// app/auth/page.tsx
import { Suspense } from "react";
import AuthClient from "./AuthClient";

export default async function AuthPage({
  searchParams,
}: {
  // Next 15: searchParams llega como Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialTab: "login" | "register" =
    sp?.tab === "register" ? "register" : "login";

  return (
    <Suspense fallback={null}>
      <AuthClient initialTab={initialTab} />
    </Suspense>
  );
}
