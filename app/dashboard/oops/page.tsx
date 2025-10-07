// app/dashboard/oops/page.tsx
export default function Oops() {
  // Se ejecuta al render, así que caerá en app/dashboard/error.tsx
  throw new Error("Crash de prueba en /dashboard/oops");
}
