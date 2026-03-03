// lib/agents/chat/loadChatRuntimeConfig.ts
import { prisma } from "@/lib/prisma";

export type AgentChannelLike = "WHATSAPP" | "VOICE" | "WEBCHAT" | string;

export type ChatRuntimeConfig = {
  agentId: string;
  chatAgentId: string;
  settingsId: string | null;
  prompt: string;
  model: string;
  temperature: number;
};

type LoadArgs = {
  companyId: string;
  channel: AgentChannelLike;
};

function coerceNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
}

/**
 * Render simple de variables tipo {companyId}, {agentName}, etc.
 * - No hace lógica, solo sustitución.
 * - Si falta la variable, la deja tal cual.
 */
export function renderPromptTemplate(
  template: string,
  vars: Record<string, string>
): string {
  const base = String(template || "");
  return base.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const k = String(key || "");
    if (Object.prototype.hasOwnProperty.call(vars, k)) {
      return String(vars[k]);
    }
    return match;
  });
}

/**
 * Carga el agente de chat ACTIVO para una company + channel (ej: WHATSAPP)
 * y devuelve el prompt/model/temp ya resueltos desde BBDD.
 *
 * No hardcodea prompts. Si no hay prompt en BBDD => error (fase 1).
 */
export async function loadChatRuntimeConfig(
  args: LoadArgs
): Promise<ChatRuntimeConfig> {
  const { companyId, channel } = args;

  const agent = await prisma.agent.findFirst({
    where: {
      companyId,
      channel: channel as any,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      chat: {
        select: {
          id: true,
          defaultModel: true,
          defaultTemperature: true,
          defaultPrompt: true,
          settings: {
            where: { isActive: true },
            orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
            take: 1,
            select: {
              id: true,
              prompt: true,
              model: true,
              temperature: true,
            },
          },
        },
      },
    },
  });

  if (!agent) {
    throw new Error(`No ACTIVE agent for companyId=${companyId} channel=${channel}`);
  }

  if (!agent.chat) {
    throw new Error(`Agent ${agent.id} has no ChatAgent row`);
  }

  const active = agent.chat.settings.length > 0 ? agent.chat.settings[0] : null;

  const promptFromSettings = active ? active.prompt : null;
  const promptFromChatDefault = agent.chat.defaultPrompt;

  const finalPrompt = (promptFromSettings || promptFromChatDefault || "").trim();
  if (!finalPrompt) {
    throw new Error(
      `Missing prompt in DB (ChatAgentSettings.prompt or ChatAgent.defaultPrompt) for agentId=${agent.id}`
    );
  }

  const modelFromSettings = active ? active.model : null;
  const modelFromChatDefault = agent.chat.defaultModel;
  const envModel = process.env.AI_MODEL_DEFAULT;

  const finalModel = String(modelFromSettings || modelFromChatDefault || envModel || "").trim();
  if (!finalModel) {
    throw new Error(
      `Missing model (ChatAgentSettings.model / ChatAgent.defaultModel / AI_MODEL_DEFAULT) for agentId=${agent.id}`
    );
  }

  const tempFromSettings = active ? active.temperature : null;
  const tempFromChatDefault = agent.chat.defaultTemperature;

  const finalTemp = coerceNumber(tempFromSettings, coerceNumber(tempFromChatDefault, 0.3));

  return {
    agentId: agent.id,
    chatAgentId: agent.chat.id,
    settingsId: active ? active.id : null,
    prompt: finalPrompt,
    model: finalModel,
    temperature: finalTemp,
  };
}