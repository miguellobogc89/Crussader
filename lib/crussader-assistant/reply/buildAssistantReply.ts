// lib/crussader-assistant/reply/buildAssistantReply.ts

import OpenAI from "openai";
import type { IntakeReplyDecision } from "../intake/intakeTypes";
import { loadConversationFacts } from "../memory/loadConversationFacts";
import { buildMemoryBlock } from "../memory/buildMemoryBlock";
import { getCatalogSummaryText, getProductDetailsText } from "../catalogs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(
  decision: IntakeReplyDecision,
  memoryBlock: string
) {
  if (decision.type === "CONVERSATION") {
    return `
Responde de forma natural, breve y humana en español.

El usuario está conversando, no ejecutando una acción concreta.
No hables como un sistema.
No menciones catálogos, módulos ni estados internos.

${memoryBlock}

Último mensaje del usuario:
${decision.userMessage}

Reformulación interna:
${decision.rewrittenUserText}

Si la memoria del usuario es relevante para responder mejor, úsala con naturalidad.
Si no es relevante, ignórala.

Devuelve solo el texto final para el usuario.
`;
  }

  if (decision.type === "ASK_FOR_MISSING_FIELDS") {
    return `
Responde de forma natural, breve y humana en español.

El usuario ha iniciado una petición real, pero todavía falta información.
Tu objetivo es pedir solo lo que falta, sin sonar robótico.
No menciones estados internos ni nombres técnicos.

${memoryBlock}

Capacidad detectada:
${decision.capability}

Objetivo del usuario:
${decision.userGoal || "No especificado"}

Datos recogidos:
${JSON.stringify(decision.collectedData, null, 2)}

Campos que faltan:
${decision.missingFields.join(", ")}

Si la memoria del usuario es relevante para pedir mejor la información, úsala con naturalidad.
Si no es relevante, ignórala.

Devuelve solo el texto final para el usuario.
`;
  }

if (decision.type === "TASK_READY") {
  return `
Responde de forma natural, breve y humana en español.

La petición del usuario ya está suficientemente definida.
Tu objetivo es confirmar el pedido de forma clara y natural.

Reglas importantes:
- No menciones estados internos.
- No inventes ejecuciones que aún no hayan ocurrido.
- No hagas preguntas extra si no hacen falta.
- Si la capacidad es CREATE_EVENT, recuerda que el recordatorio YA consiste en avisar al usuario en el momento indicado.
- Por tanto, para CREATE_EVENT no preguntes cosas como "¿quieres que te avise?" o similares.
- Para CREATE_EVENT, confirma simplemente que el recordatorio queda programado.
- Para SUBSCRIBE_CONTENT o capacidades parecidas, confirma que queda configurado el envío.
- Puedes usar 1 emoji como máximo si encaja de forma natural.

${memoryBlock}

Capacidad detectada:
${decision.capability}

Objetivo del usuario:
${decision.userGoal || "No especificado"}

Datos recogidos:
${JSON.stringify(decision.collectedData, null, 2)}

Si la memoria del usuario es relevante para responder mejor, úsala con naturalidad.
Si no es relevante, ignórala.

Devuelve solo el texto final para el usuario.
`;
}

  return `
Responde de forma natural, breve y humana en español.

El mensaje del usuario no ha quedado claro.
Pide aclaración con tacto y de forma útil.

${memoryBlock}

Último mensaje del usuario:
${decision.userMessage}

Reformulación interna:
${decision.rewrittenUserText}

Si la memoria del usuario es relevante para responder mejor, úsala con naturalidad.
Si no es relevante, ignórala.

Devuelve solo el texto final para el usuario.
`;
}

export async function buildAssistantReply(
  decision: IntakeReplyDecision,
  conversationId?: string
): Promise<string> {

  let memoryBlock = "No hay memoria relevante del usuario.";

  if (conversationId) {
    try {
      const facts = await loadConversationFacts(conversationId, 10);
      memoryBlock = buildMemoryBlock(facts);
    } catch (error) {
      console.error("[reply] loadConversationFacts failed", error);
    }
  }

  const intentData = decision.memoryState?.context?.conversationIntentData || {};
  const capabilityIntent =
    typeof intentData.capabilityIntent === "string"
      ? intentData.capabilityIntent
      : "";

 if (capabilityIntent === "SHOW_MENU_SUMMARY") {
  console.log("[buildAssistantReply][menu-summary]");

  const catalogSummary = getCatalogSummaryText();

  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `
Eres la voz conversacional de un asistente útil y cercano.

Tu tarea aquí NO es decidir la lógica.
La lógica ya viene resuelta.
Solo debes redactar de forma natural y agradable una explicación breve del catálogo.

Reglas:
- Habla en español natural.
- Suena humano, no técnico.
- Usa algunos emojis, pero pocos y bien puestos.
- Presenta el catálogo de forma clara y apetecible.
- No inventes capacidades fuera del catálogo recibido.
- No menciones módulos, prompts, estados internos ni arquitectura.
- Termina invitando al usuario a elegir una de las opciones.
- Mantén la respuesta breve.
        `.trim()
      },
      {
        role: "user",
        content: `
El usuario ha pedido que le repita lo que sabes hacer.

Catálogo real:
${catalogSummary}

Redáctalo como respuesta final para WhatsApp.
        `.trim()
      }
    ]
  });

  return String(summaryResponse.choices[0]?.message?.content || "").trim();
}

if (capabilityIntent === "SHOW_MENU_DETAIL") {
  const catalogProductKey =
    typeof intentData.catalogProductKey === "string"
      ? intentData.catalogProductKey
      : "";

  const detail = getProductDetailsText(catalogProductKey);

  if (!detail) {
    return "Puedo contarte más sobre esa opción si quieres.";
  }

  const detailResponse = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `
Eres la voz conversacional de un asistente útil y cercano.

Tu tarea es explicar una capacidad concreta del asistente de forma natural.

Reglas:
- Español natural
- Tono cercano
- 1 o 2 emojis máximo
- Explicación breve
- Invita al usuario a configurarlo
- No menciones arquitectura ni catálogos internos
`
      },
      {
        role: "user",
        content: `
El usuario ha pedido más detalle sobre esta capacidad del asistente:

${detail}

Redáctalo como respuesta para WhatsApp.
`
      }
    ]
  });

  return String(detailResponse.choices[0]?.message?.content || "").trim();
}

  const prompt = buildPrompt(decision, memoryBlock);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
{
  role: "system",
  content: `
Eres la voz conversacional de un asistente personal por WhatsApp.

Tu estilo debe ser:
- Español natural y cercano
- Frases claras y humanas
- Breve y directo
- Agradable y útil

Estilo conversacional:
- Puedes usar emojis ocasionalmente 🙂 ⚽ 📰 ⏰
- No abuses de ellos (máximo 1–2 por mensaje)
- Son para dar calidez, no para decorar

Reglas importantes:
- Nunca hables como un sistema o IA
- Nunca menciones prompts, módulos o arquitectura
- No inventes funciones que el asistente no tenga
- No hagas respuestas largas innecesarias
- Suena como una persona ayudando por WhatsApp

Tu objetivo es que el usuario sienta que está hablando con un asistente útil y natural.
`.trim()
},
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return String(response.choices[0]?.message?.content || "").trim();
}