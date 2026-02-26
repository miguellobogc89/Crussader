// lib/ai/webchatAssistant.ts
import { prismaRaw } from "@/lib/prisma";
import { openai } from "@/lib/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type BuildReplyArgs = {
  siteId: string;
  text: string;
};

type BuildReplyResult = {
  botText: string;
  allowPrivate: boolean;
  debug: {
    email: string | null;
    userId: string | null;
  };
};

export async function buildWebchatAssistantReply(args: BuildReplyArgs): Promise<BuildReplyResult> {
  const text = args.text.trim();
  if (!args.siteId || !text) {
    throw new Error("Missing siteId or text");
  }

  // 1) Cargar site (compañía y settings)
  const site = await prismaRaw.webchatSite.findUnique({
    where: { id: args.siteId },
    select: { id: true, name: true, companyId: true, settings: true },
  });
  if (!site) {
    throw new Error("Site not found");
  }

  // 2) ¿Usuario autenticado y de la misma company?
  const nextAuthSession = await getServerSession(authOptions);

  let allowPrivate = false;
  let currentUser: { id: string; name: string | null; email: string | null } | null = null;

  if (nextAuthSession && nextAuthSession.user && nextAuthSession.user.email) {
    const user = await prismaRaw.user.findUnique({
      where: { email: nextAuthSession.user.email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const membership = await prismaRaw.userCompany.findFirst({
        where: { userId: user.id, companyId: site.companyId },
        select: { id: true },
      });

      if (membership) {
        allowPrivate = true;
      } else {
        allowPrivate = false;
      }

      currentUser = user;
    }
  }

  // 3) KNOWLEDGE: empresa global (siteId = null) + específico de site
  const whereKnowledge: any = {
    OR: [{ siteId: args.siteId }, { siteId: null, companyId: site.companyId }],
  };

  if (!allowPrivate) {
    whereKnowledge.visibility = "PUBLIC";
  }

  const allItems = await prismaRaw.knowledgeItem.findMany({
    where: whereKnowledge,
    select: { title: true, content: true, visibility: true },
    orderBy: { createdAt: "asc" },
  });

  // 4) Ranking naive por solapamiento de términos (MVP)
  const qWords = new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2)
  );

  const scored = allItems
    .map((it) => {
      const blob = (it.title + " " + it.content).toLowerCase();
      let score = 0;

      qWords.forEach((w) => {
        if (blob.includes(w)) {
          score += 1;
        }
      });

      return { it, score };
    })
    .sort((a, b) => b.score - a.score);

  const topItems = scored.slice(0, 8).map((s) => s.it);

  const knowledgeContext = topItems
    .map((it, i) => {
      return `### Item ${i + 1} [${it.visibility}]\nTitle: ${it.title}\nContent:\n${it.content}`;
    })
    .join("\n\n")
    .slice(0, 4000);

  // 5) PRIVATE CONTEXT (solo si allowPrivate)
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

    const userName = currentUser && currentUser.name ? currentUser.name : "";

    let billingState = "none";
    if (company && company.stripeSubscriptionId) {
      billingState = "active";
    }

    let respState = "not_configured";
    if (respSettings) {
      respState = "configured";
    }

    privateContext = [
      `USER_GREETING: si conoces el nombre del usuario, salúdalo por su nombre (name="${userName}").`,
      `ACCOUNT_SUMMARY: company="${company ? company.name ?? "" : ""}", plan="${company ? company.plan ?? "free" : "free"}", locations=${locationsCount}, billing=${billingState}.`,
      `RESPONSE_SETTINGS: ${respState}.`,
      `ACTIONS_HELP:`,
      `- Cambiar voz de marca: Dashboard → Ajustes → Respuestas.`,
      `- Ver facturación: Dashboard → Ajustes → Billing.`,
      `- Configurar webchat: Dashboard → Conocimiento (público/privado) y Webchat.`,
    ].join("\n");
  }

  // 6) Prompt + mensajes
  const systemPrompt = [
    `Eres el asistente de ${site.name ? site.name : "esta empresa"}.`,
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

  let botText = "";
  const choice = completion.choices && completion.choices[0] ? completion.choices[0] : null;
  if (choice && choice.message && choice.message.content) {
    botText = choice.message.content.trim();
  }

  if (!botText) {
    botText = "Lo siento, ahora mismo no puedo responder con la información disponible.";
  }

  let debugEmail: string | null = null;
  if (nextAuthSession && nextAuthSession.user && nextAuthSession.user.email) {
    debugEmail = nextAuthSession.user.email;
  }

  let debugUserId: string | null = null;
  if (currentUser) {
    debugUserId = currentUser.id;
  }

  return {
    botText,
    allowPrivate,
    debug: {
      email: debugEmail,
      userId: debugUserId,
    },
  };
}