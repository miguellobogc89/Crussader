// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    // si ya hay sesión, directo al dashboard
    redirect("/dashboard/home"); // cambia a "/dashboard" si lo prefieres
  }

  // si no hay sesión, a login
  redirect("/auth/login");
}
