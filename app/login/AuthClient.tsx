"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initialTab: "login" | "register";
  initialError?: string;
};

export default function AuthClient({ initialTab, initialError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-purple-600">Bienvenido</h2>

        {initialError && (
          <p className="text-red-600 text-center mt-2 mb-4">{initialError}</p>
        )}

        <p className="text-gray-500 text-center mb-6">
          {tab === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta para empezar"}
        </p>

        {/* Tabs mínimas */}
        <div className="flex mb-6">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2 text-center rounded-l-lg border ${
              tab === "login" ? "bg-purple-100 text-purple-700" : "bg-gray-100"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2 text-center rounded-r-lg border ${
              tab === "register" ? "bg-purple-100 text-purple-700" : "bg-gray-100"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Formularios placeholder (ajusta a tu gusto) */}
        {tab === "login" ? (
          <form className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Contraseña</label>
              <input type="password" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Iniciar Sesión
            </button>
          </form>
        ) : (
          <form className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Nombre</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Contraseña</label>
              <input type="password" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Crear Cuenta
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-2 text-gray-400 text-sm">O CONTINÚA CON</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-2 border py-2 rounded-lg hover:bg-gray-50 mb-3"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="text-gray-700">
            {tab === "login" ? "Entrar con Google" : "Crear cuenta con Google"}
          </span>
        </button>

        {/* Acceso directo */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Ir directamente al Dashboard
        </button>
      </div>
    </div>
  );
}
