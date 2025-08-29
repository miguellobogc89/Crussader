"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  // Si ya está logueado, redirigir al dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return null; // Evita renderizar landing mientras redirige
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-4">
          Bienvenido a Crussader
        </h1>
        <p className="text-gray-500 mb-6">
          Centraliza y gestiona tus reseñas fácilmente
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/auth?tab=login")}
            className="w-64 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Log In
          </button>
          <button
            onClick={() => router.push("/auth?tab=register")}
            className="w-64 border border-purple-600 text-purple-600 py-2 rounded-lg hover:bg-purple-50 transition"
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}
