// lib/agents/whatsapp/whatsappOrchestrator.ts
import { prisma } from "@/lib/prisma";
import { buildFreeChatReply } from "@/lib/agents/chat/freeChatReply";
import { extractPersonName } from "@/lib/agents/actions/extractPersonName";
import { upsertCustomer } from "@/lib/agents/actions/upsertCustomer";
import { detectCustomer } from "@/lib/agents/actions/detectCustomer";
import {
  ensureWhatsappAgentSession,
  createAgentTurn,
} from "@/lib/agents/chat/agentSessionStore";
import {
  hydrateSessionBoard,
  readSessionBoard,
} from "@/lib/agents/chat/sessionBoardHydrator";
import { buildWhatsappSystemContext } from "@/lib/agents/chat/whatsappContext";

type HandleArgs = {
  conversationId: string;
  incomingText: string;
  phoneE164: string;
  phoneNumberId: string;
  companyId: string;
  installationId: string;
  whatsappDisplayName?: string | null;
  debug?: boolean;
};

export async function handleWhatsappAiReply(args: HandleArgs) {
  const {
    conversationId,
    incomingText,
    phoneE164,
    phoneNumberId,
    companyId,
    installationId,
    whatsappDisplayName,
    debug,
  } = args;

  // ==========================================================
  // 1) Buscar agent activo
  // ==========================================================
  const agent = await prisma.agent.findFirst({
    where: {
      companyId,
      channel: "WHATSAPP",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!agent) {
    throw new Error("No ACTIVE WHATSAPP agent for this company");
  }

  // ==========================================================
  // 2) Crear/reusar sesión
  // ==========================================================
  const ensured = await ensureWhatsappAgentSession({
    agentId: agent.id,
    companyId,
    conversationId,
    caller: phoneE164,
    callee: phoneNumberId,
    environment: "TEST",
    language: "es",
  });

  const sessionId = ensured.sessionId;

  // ==========================================================
  // 3) Hidratar pizarra base (company + locations + knowledge)
  // ==========================================================
  await hydrateSessionBoard({
    sessionId,
    companyId,
  });

  // ==========================================================
  // 4) Detectar cliente silenciosamente
  // ==========================================================
  await detectCustomer({
    companyId,
    sessionId,
    conversationId,
    phoneE164,
  });

  // ==========================================================
  // 5) Persistir turno USER
  // ==========================================================
  await createAgentTurn({
    sessionId,
    role: "USER",
    text: incomingText,
    payload: {
      conversationId,
      installationId,
      whatsappDisplayName: whatsappDisplayName ?? null,
    },
  });

  // ==========================================================
  // 6) Intentar identificar nombre completo si aún no hay customer
  // ==========================================================
  const convo = await prisma.messaging_conversation.findUnique({
    where: { id: conversationId },
    select: { customer_id: true },
  });

  if (!convo?.customer_id) {
    const parsedName = await extractPersonName({ text: incomingText });

    if (parsedName) {
      await upsertCustomer({
        companyId,
        agentId: agent.id,
        sessionId,
        conversationId,
        phoneE164,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        email: null,
      });
    }
  }

  // ==========================================================
  // 7) Leer pizarra final (ya puede incluir customer)
  // ==========================================================
  const board = await readSessionBoard(sessionId);

  // ==========================================================
  // 8) Construir contexto system (PROMPT FUERA DEL ROUTE)
  // ==========================================================
  const contextSystem = buildWhatsappSystemContext({
    board: board ?? null,
    whatsappDisplayName: whatsappDisplayName ?? null,
  });

  // ==========================================================
  // 9) Llamar a LLM libre
  // ==========================================================
  const built = await buildFreeChatReply({
    companyId,
    channel: "WHATSAPP",
    userText: incomingText,
    agentName: null,
    contextSystem,
  });

  const botText = built.botText;

  // ==========================================================
  // 10) Persistir turno ASSISTANT
  // ==========================================================
  await createAgentTurn({
    sessionId,
    role: "ASSISTANT",
    text: botText,
    payload: {
      model: built.debug.model,
      temperature: built.debug.temperature,
      settingsId: built.debug.settingsId,
    },
  });

  if (debug) {
    console.log("[WA][orchestrator]", {
      conversationId,
      companyId,
      agentId: agent.id,
      sessionId,
    });
  }

  return {
    botText,
    sessionId,
    agentId: agent.id,
    board,
    runtime: built.debug,
  };
}