// app/auth/login/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // si intenta ir a /auth/login ya logueado, lo mandamos al dashboard
  if (session) {
    redirect("/dashboard/home"); // o "/dashboard"
  }

  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
