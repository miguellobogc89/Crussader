import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Header arriba, ancho completo */}
      <Header />

      {/* Cuerpo: sidebar + contenido */}
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex">
        <Sidebar />
        <section className="flex-1 p-6 md:p-8">{children}</section>
      </div>
    </AuthGuard>
  );
}
