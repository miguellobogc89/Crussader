// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "App",
  description: "Sanity check",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body>{children}</body>
    </html>
  );
}
