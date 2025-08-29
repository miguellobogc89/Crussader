// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) {
        return token?.role === "system_admin";
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
