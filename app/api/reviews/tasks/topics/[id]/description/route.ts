// app/api/reviews/tasks/topics/[id]/description/route.ts
import { NextResponse } from "next/server";
import { generateAndStoreTopicDescription } from "@/app/server/topics/generateTopicDescription";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const topicId = params?.id;
  if (!topicId) {
    return NextResponse.json({ ok: false, error: "Missing topic id" }, { status: 400 });
  }

  try {
    const description = await generateAndStoreTopicDescription(topicId);
    return NextResponse.json({ ok: true, topicId, description });
  } catch (err: any) {
    // 🔎 Diagnóstico explícito (para entorno local)
    const message = err?.message ?? "Unexpected error";
    const name = err?.name ?? "Error";
    const stack = typeof err?.stack === "string" ? err.stack.split("\n").slice(0, 10) : [];
    console.error("[topics/description] Error:", name, message, err);

    return NextResponse.json(
      {
        ok: false,
        error: message,
        errorName: name,
        // En producción NO devuelvas stack. Para depurar localmente sí.
        stack,
      },
      { status: 500 }
    );
  }
}
