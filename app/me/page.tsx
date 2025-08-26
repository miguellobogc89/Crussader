"use client";
import { useSession } from "next-auth/react";
export default function Me() {
  const { data: session, status } = useSession();
  return (
    <main style={{ padding: 24 }}>
      <h2>Mis datos</h2>
      <p>Estado: {status}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </main>
  );
}
