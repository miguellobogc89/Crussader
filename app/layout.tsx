import "./globals.css";
import Providers from "./providers";
import "bootstrap/dist/css/bootstrap.min.css";

export const metadata = { title: "Crussader", description: "Login test" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
