// app/api/webchat/messages/route.ts
import { NextResponse } from "next/server";
import { prismaRaw } from "@/lib/prisma";
import OpenAI from "openai";

import { getServerSession } from "next-auth";
// ⛳️ AJUSTA ESTA RUTA si tu export de authOptions está en otro fichero:
// por ejemplo "@/app/api/auth/[...nextauth]/route" o "@/lib/auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Body = {
  siteId: string;
  sessionId: string;
  text: string;
  payload?: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const text = (body?.text || "").trim();
    if (!body?.siteId || !body?.sessionId || !text) {
      return NextResponse.json({ error: "Missing siteId, sessionId or text" }, { status: 400 });
    }

    // 1) Validar sesión de webchat ↔ site
    const session = await prismaRaw.webchatSession.findUnique({
      where: { id: body.sessionId },
      select: { id: true, siteId: true },
    });
    if (!session || session.siteId !== body.siteId) {
      return NextResponse.json({ error: "Invalid session/site" }, { status: 400 });
    }

    // 2) Guardar mensaje del usuario + tocar actividad
    const userMsg = await prismaRaw.webchatMessage.create({
      data: {
        siteId: body.siteId,
        sessionId: body.sessionId,
        role: "USER",
        text,
        payload: body.payload ?? undefined,
      },
      select: { id: true, createdAt: true },
    });
    await prismaRaw.webchatSession.update({
      where: { id: body.sessionId },
      data: { lastActivityAt: new Date() },
    });

    // 3) Cargar site (compañía y settings)
    const site = await prismaRaw.webchatSite.findUnique({
      where: { id: body.siteId },
      select: { id: true, name: true, companyId: true, settings: true },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    // 4) ¿Usuario autenticado y de la misma company?
    const nextAuthSession = await getServerSession(authOptions);
    let allowPrivate = false;
    let currentUser: { id: string; name: string | null; email: string | null } | null = null;

    if (nextAuthSession?.user?.email) {
      const user = await prismaRaw.user.findUnique({
        where: { email: nextAuthSession.user.email },
        select: { id: true, name: true, email: true },
      });
      if (user) {
        const membership = await prismaRaw.userCompany.findFirst({
          where: { userId: user.id, companyId: site.companyId },
          select: { id: true },
        });
        allowPrivate = Boolean(membership);
        currentUser = user;
      }
    }

    // 5) KNOWLEDGE: empresa global (siteId = null) + específico de site
    const whereKnowledge: any = {
      OR: [
        { siteId: body.siteId },
        { siteId: null, companyId: site.companyId },
      ],
      ...(allowPrivate ? {} : { visibility: "PUBLIC" }),
    };

    const allItems = await prismaRaw.knowledgeItem.findMany({
      where: whereKnowledge,
      select: { title: true, content: true, visibility: true },
      orderBy: { createdAt: "asc" },
    });

    // 6) Ranking naive por solapamiento de términos (MVP)
    const qWords = new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const scored = allItems
      .map(it => {
        const blob = (it.title + " " + it.content).toLowerCase();
        let score = 0;
        qWords.forEach(w => { if (blob.includes(w)) score += 1; });
        return { it, score };
      })
      .sort((a, b) => b.score - a.score);

    const topItems = scored.slice(0, 8).map(s => s.it);
    const knowledgeContext = topItems
      .map((it, i) => `### Item ${i + 1} [${it.visibility}]\nTitle: ${it.title}\nContent:\n${it.content}`)
      .join("\n\n")
      .slice(0, 4000);

    // 7) PRIVATE CONTEXT: datos vivos de la cuenta (solo si allowPrivate)
    let privateContext = "";
    if (allowPrivate) {
      const [company, locationsCount, respSettings] = await Promise.all([
        prismaRaw.company.findUnique({
          where: { id: site.companyId },
          select: { name: true, plan: true, stripeSubscriptionId: true },
        }),
        prismaRaw.location.count({ where: { companyId: site.companyId } }),
        prismaRaw.responseSettings.findUnique({
          where: { companyId: site.companyId },
          select: { id: true },
        }),
      ]);

      privateContext = [
        `USER_GREETING: si conoces el nombre del usuario, salúdalo por su nombre (name="${currentUser?.name ?? ""}").`,
        `ACCOUNT_SUMMARY: company="${company?.name ?? ""}", plan="${company?.plan ?? "free"}", locations=${locationsCount}, billing=${company?.stripeSubscriptionId ? "active" : "none"}.`,
        `RESPONSE_SETTINGS: ${respSettings ? "configured" : "not_configured"}.`,
        `ACTIONS_HELP:`,
        `- Cambiar voz de marca: Dashboard → Ajustes → Respuestas.`,
        `- Ver facturación: Dashboard → Ajustes → Billing.`,
        `- Configurar webchat: Dashboard → Conocimiento (público/privado) y Webchat.`,
      ].join("\n");
    }

    // 8) Construir mensajes para OpenAI
    const systemPrompt = [
      `Eres el asistente de ${site.name ?? "esta empresa"}.`,
      `Usa SOLO la información del CONTEXTO proporcionado; si falta, dilo claramente y sugiere el camino en el panel cuando proceda.`,
      `Mantén el idioma del usuario, sé breve y profesional.`,
      `Si estás en entorno autenticado (PRIVATE CONTEXT presente), puedes saludar por el nombre y guiar por el panel.`,
      `Nunca reveles contenido privado en público.`,
    ].join(" ");

    const ctxParts: string[] = [];
    if (privateContext) ctxParts.push(`### PRIVATE CONTEXT\n${privateContext}`);
    if (knowledgeContext) ctxParts.push(`### KNOWLEDGE ITEMS\n${knowledgeContext}`);
    const ctxContent = ctxParts.join("\n\n").slice(0, 7000);

    const messages: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    if (ctxContent) {
      messages.push({ role: "system", content: `CONTEXT START\n${ctxContent}\nCONTEXT END` });
    }
    messages.push({ role: "user", content: text });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 400,
      messages,
    });

    const botText =
      completion.choices?.[0]?.message?.content?.trim()
      || "Lo siento, ahora mismo no puedo responder con la información disponible.";

    // 9) Guardar respuesta del BOT
    const bot = await prismaRaw.webchatMessage.create({
      data: {
        siteId: body.siteId,
        sessionId: body.sessionId,
        role: "BOT",
        text: botText,
      },
      select: { id: true, text: true, createdAt: true },
    });

    // 10) respuesta + debug útil temporal
    return NextResponse.json({
      ok: true,
      messageId: userMsg.id,
      botMessage: bot,
      allowPrivate,
      debug: {
        email: nextAuthSession?.user?.email ?? null,
        userId: currentUser?.id ?? null,
      },
    });
  } catch (e: any) {
    console.error("[webchat/messages]", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
