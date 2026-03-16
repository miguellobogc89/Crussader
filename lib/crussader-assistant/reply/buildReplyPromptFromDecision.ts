// lib/crussader-assistant/reply/buildReplyPromptFromDecision.ts
import type { ReplyDecision } from "./generateReplyFromDecision";

function asText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function buildAskForMissingFieldsPrompt(
  decision: Extract<ReplyDecision, { type: "ASK_FOR_MISSING_FIELDS" }>
): string {
  const requestedInstruction = asText(decision.requestedInstruction);
  const action = asText(decision.action);
  const product = asText(decision.product);
  const subtype = asText(decision.subtype);

  return `
Eres la voz conversacional final de un asistente por WhatsApp.

Tu trabajo es redactar el mensaje final para el usuario.
NO decides lógica.
NO ejecutas nada.
NO inventas datos.
Solo formulas una respuesta natural a partir de la decisión recibida.

TIPO DE DECISIÓN:
ASK_FOR_MISSING_FIELDS

OBJETIVO:
Pedir únicamente los datos que faltan para poder continuar.
No confirmes que la tarea ya está hecha.
No inventes campos.
No menciones estados internos, módulos, pipeline ni arquitectura.

DATOS DE CONTEXTO:
- requestedInstruction: ${requestedInstruction}
- action: ${action}
- product: ${product}
- subtype: ${subtype}

DATOS RECOGIDOS:
${safeJson(decision.collectedData)}

CAMPOS QUE FALTAN:
${safeJson(decision.missingFields)}

REGLAS DE ESTILO:
- Español natural
- Breve
- Humano
- Claro
- Sin sonar robótico
- No hagas preguntas extra innecesarias
- Formula una sola petición clara
- No cierres con preguntas genéricas del tipo "¿te ayudo en algo más?"

Devuelve solo el texto final para el usuario.
`.trim();
}

function buildConfirmActionPrompt(
  decision: Extract<ReplyDecision, { type: "CONFIRM_ACTION" }>
): string {
  let executionPayload: Record<string, unknown> = {};

  if (decision.executionPayload && typeof decision.executionPayload === "object") {
    executionPayload = decision.executionPayload;
  }

  let eventResult: Record<string, unknown> = {};
  if (
    executionPayload.eventResult &&
    typeof executionPayload.eventResult === "object"
  ) {
    eventResult = executionPayload.eventResult as Record<string, unknown>;
  }

  let eventData: Record<string, unknown> = {};
  if (eventResult.data && typeof eventResult.data === "object") {
    eventData = eventResult.data as Record<string, unknown>;
  }

  let listedEvents: unknown[] = [];
  if (Array.isArray(eventData.events)) {
    listedEvents = eventData.events;
  }

  const requestedInstruction = asText(decision.requestedInstruction);
  const action = asText(decision.action);
  const product = asText(decision.product);
  const subtype = asText(decision.subtype);
  const executionMessage = asText(decision.executionMessage);

  return `
Eres la voz conversacional final de un asistente por WhatsApp.

Tu trabajo es redactar el mensaje final para el usuario.
NO decides lógica.
La acción ya ha salido bien.
No inventes datos que no estén presentes.

TIPO DE DECISIÓN:
CONFIRM_ACTION

OBJETIVO:
Confirmar de forma natural que la acción ha quedado realizada o configurada correctamente.

DATOS DE CONTEXTO:
- requestedInstruction: ${requestedInstruction}
- action: ${action}
- product: ${product}
- subtype: ${subtype}

DATOS RECOGIDOS:
${safeJson(decision.collectedData)}

MENSAJE DE EJECUCIÓN:
${executionMessage || "(vacío)"}

RESULTADO DE EJECUCIÓN COMPLETO:
${safeJson(executionPayload)}

EVENTOS LISTADOS:
${safeJson(listedEvents)}

REGLAS DE ESTILO:
- Español natural
- Breve
- Humano
- No hables como sistema
- No hagas preguntas finales genéricas
- No cierres con "¿te ayudo en algo más?"
- Puedes cerrar con una frase útil tipo que se puede modificar o cancelar, pero sin sonar repetitivo
- Si faltan detalles concretos, no los inventes
- Si requestedInstruction es "LIST_EVENTS":
  - Si no hay eventos, explica claramente que no hay recordatorios activos
  - Si hay eventos, enuméralos de forma natural y breve
  - Usa los títulos de los eventos si existen
  - Si hay hora o estado y aparecen en los datos, puedes mencionarlos
  - No respondas como si se hubiera creado un recordatorio nuevo
  - No uses una confirmación genérica tipo "Todo listo" si en realidad estás listando

Devuelve solo el texto final para el usuario.
`.trim();
}

function buildExecutionErrorPrompt(
  decision: Extract<ReplyDecision, { type: "EXECUTION_ERROR" }>
): string {
  const requestedInstruction = asText(decision.requestedInstruction);
  const action = asText(decision.action);
  const product = asText(decision.product);
  const subtype = asText(decision.subtype);
  const executionMessage = asText(decision.executionMessage);

  return `
Eres la voz conversacional final de un asistente por WhatsApp.

Tu trabajo es redactar el mensaje final para el usuario.
NO decides lógica.
La ejecución ha fallado o no se ha podido completar.

TIPO DE DECISIÓN:
EXECUTION_ERROR

OBJETIVO:
Explicar de forma natural y breve que no se ha podido completar la acción.
Si el mensaje de ejecución ya explica el problema, úsalo sin sonar técnico.
No inventes causas.
No confirmes que la acción está hecha.

DATOS DE CONTEXTO:
- requestedInstruction: ${requestedInstruction}
- action: ${action}
- product: ${product}
- subtype: ${subtype}

DATOS RECOGIDOS:
${safeJson(decision.collectedData)}

MENSAJE DE EJECUCIÓN:
${executionMessage || "(vacío)"}

REGLAS DE ESTILO:
- Español natural
- Breve
- Humano
- Nada técnico
- Nada de arquitectura interna
- No cierres con preguntas genéricas
- Si procede, pide reformular o aportar un dato, pero solo si tiene sentido

Devuelve solo el texto final para el usuario.
`.trim();
}

function buildFallbackPrompt(
  decision: Extract<ReplyDecision, { type: "FALLBACK" }>
): string {
  const reason = asText(decision.reason);

  return `
Eres la voz conversacional final de un asistente por WhatsApp.

Tu trabajo es redactar el mensaje final para el usuario.

TIPO DE DECISIÓN:
FALLBACK

MOTIVO:
${reason || "(vacío)"}

OBJETIVO:
Responder de forma breve y natural cuando no se puede continuar o no se ha entendido bien la petición.

REGLAS DE ESTILO:
- Español natural
- Breve
- Humano
- No técnico
- No menciones arquitectura interna
- No inventes capacidades
- No cierres con preguntas genéricas innecesarias

Devuelve solo el texto final para el usuario.
`.trim();
}

export function buildReplyPromptFromDecision(decision: ReplyDecision): string {
  if (decision.type === "ASK_FOR_MISSING_FIELDS") {
    return buildAskForMissingFieldsPrompt(decision);
  }

  if (decision.type === "CONFIRM_ACTION") {
    return buildConfirmActionPrompt(decision);
  }

  if (decision.type === "EXECUTION_ERROR") {
    return buildExecutionErrorPrompt(decision);
  }

  return buildFallbackPrompt(decision);
}