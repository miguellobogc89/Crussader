// app/dashboard/layout.tsx
import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Header fijo (tu componente ya lleva sticky/z-index) */}
      <Header />

      {/* Sidebar fijo bajo el header */}
      <Sidebar />

      {/* Contenido: desplazado por el ancho del sidebar y alto del header */}
      <section className="ml-72 pt-16 min-h-screen bg-gray-50 px-6 md:px-8 pb-10">
        {children}
      </section>
    </AuthGuard>
  );
}
