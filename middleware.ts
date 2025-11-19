// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// Middleware de auth solo para /admin
const adminAuthMiddleware = withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Solo /admin y subrutas requieren system_admin
      if (path.startsWith("/admin")) {
        return token?.role === "system_admin";
      }

      return true;
    },
  },
});

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl;

  const isDashboardDomain = host.startsWith("dashboard.crussader.com");

  // 1) Si vienen a dashboard.crussader.com raíz, mandamos a /auth/login
  if (isDashboardDomain && url.pathname === "/") {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 2) Si es una ruta /admin, usamos el middleware de next-auth
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    // @ts-ignore: compatibilidad de tipos entre NextRequest y withAuth
    return adminAuthMiddleware(req);
  }

  // 3) El resto de rutas siguen su curso normal
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"], // aplicamos el middleware a todas las rutas
};
