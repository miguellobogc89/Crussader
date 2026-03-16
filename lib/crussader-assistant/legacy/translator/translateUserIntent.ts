// lib/crussader-assistant/translator/translateUserIntent.ts
import OpenAI from "openai";
import {
  TranslateUserIntentInput,
  TranslatorResult
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPreviousMessagesBlock(
  previousMessages: Array<{
    role: "user" | "assistant";
    text: string;
  }>
) {
  if (!previousMessages.length) {
    return "Sin contexto previo relevante.";
  }

  const lines: string[] = [];

  for (const message of previousMessages) {
    lines.push(`${message.role}: ${message.text}`);
  }

  return lines.join("\n");
}

function buildPrompt(input: TranslateUserIntentInput) {
  const previousMessagesBlock = buildPreviousMessagesBlock(
    input.previousMessages
  );

  return `
Analiza el mensaje del usuario y determina qué quiere hacer.

Debes intentar mapear la intención del usuario al catálogo disponible, pero el usuario también puede estar simplemente conversando.

Tu trabajo ocurre en dos fases:

1) Entender qué intenta hacer el usuario.
2) Si esa intención corresponde a algo del catálogo, clasificarla usando EXCLUSIVAMENTE los valores disponibles.

Si el mensaje no corresponde a ninguna acción del catálogo, trátalo como conversación normal.

No inventes instrucciones nuevas.

CONTEXTO PREVIO DE LA SESIÓN:
${previousMessagesBlock}

MENSAJE ACTUAL DEL USUARIO:
${input.rawUserText}

INSTRUCCIONES DISPONIBLES:
${input.availableInstructions.join(", ")}

ACCIONES DISPONIBLES:
${input.availableActions.join(", ")}

PRODUCTOS DISPONIBLES:
${input.availableProducts.join(", ")}

SUBTIPOS DISPONIBLES:
${input.availableSubtypes.join(", ")}

REGLAS:

1. "requestedInstruction" solo puede ser un valor de INSTRUCCIONES DISPONIBLES o null.
2. "action" solo puede ser un valor de ACCIONES DISPONIBLES o null.
3. "product" solo puede ser un valor de PRODUCTOS DISPONIBLES o null.
4. "subtype" solo puede ser un valor de SUBTIPOS DISPONIBLES o null.

5. Si detectas una acción clara del catálogo, clasifícala usando los valores disponibles.

Ejemplo:
"quiero crear un recordatorio"

requestedInstruction: CREATE_EVENT
action: CREATE
product: EVENT

6. Si el mensaje es una continuación de una petición anterior (por ejemplo una hora o fecha), usa el contexto previo para completar la intención pendiente.

Ejemplo:
mensaje anterior → "quiero crear un recordatorio"
mensaje actual → "mañana a las 8"

extraer data:
date: mañana
time: 08:00

7. Si el mensaje es conversación social o charla casual (hola, buenas, gracias, ok, etc.), entonces:

requestedInstruction = null  
action = CHAT  
product = null  
subtype = null

8. "rewrittenUserText" debe ser una reformulación breve de lo que quiere el usuario.

9. "confidence" debe ir de 0 a 1.

10. "data" solo debe contener información realmente presente o claramente inferible.

11. "missingFields" solo debe incluir campos obligatorios que falten para ejecutar una acción del catálogo.

12. Si el mensaje no activa ninguna acción del catálogo y tampoco aporta datos relevantes, clasifícalo como conversación (action: CHAT).

EJEMPLOS:

"hola"
requestedInstruction: null
action: CHAT
product: null

"buenas"
requestedInstruction: null
action: CHAT
product: null

"gracias"
requestedInstruction: null
action: CHAT
product: null

"quiero crear un recordatorio"
requestedInstruction: CREATE_EVENT
action: CREATE
product: EVENT

"mañana a las 8"
(con recordatorio pendiente)
data:
date: mañana
time: 08:00

Devuelve únicamente JSON válido con esta estructura exacta:

{
  "rewrittenUserText": string,
  "requestedInstruction": string | null,
  "action": string | null,
  "product": string | null,
  "subtype": string | null,
  "confidence": number,
  "data": {},
  "missingFields": []
} 
`;
}

function parseTranslatorResponse(
  content: string,
  fallbackText: string
): TranslatorResult {
  try {
    const parsed = JSON.parse(content);

    let rewrittenUserText = fallbackText;
    if (typeof parsed.rewrittenUserText === "string") {
      rewrittenUserText = parsed.rewrittenUserText;
    }

    let requestedInstruction: string | null = null;
    if (typeof parsed.requestedInstruction === "string") {
      requestedInstruction = parsed.requestedInstruction;
    }

    let action: string | null = null;
    if (typeof parsed.action === "string") {
      action = parsed.action;
    }

    let product: string | null = null;
    if (typeof parsed.product === "string") {
      product = parsed.product;
    }

    let subtype: string | null = null;
    if (typeof parsed.subtype === "string") {
      subtype = parsed.subtype;
    }

    let confidence = 0;
    if (typeof parsed.confidence === "number") {
      confidence = parsed.confidence;
    }

    let data: Record<string, unknown> = {};
    if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
      data = parsed.data;
    }

    let missingFields: string[] = [];
    if (Array.isArray(parsed.missingFields)) {
      missingFields = parsed.missingFields.filter(
        (item: unknown) => typeof item === "string"
      );
    }

    return {
      rewrittenUserText,
      requestedInstruction,
      action,
      product,
      subtype,
      confidence,
      data,
      missingFields
    };
  } catch {
    return {
      rewrittenUserText: fallbackText,
      requestedInstruction: null,
      action: null,
      product: null,
      subtype: null,
      confidence: 0,
      data: {},
      missingFields: []
    };
  }
}

export async function translateUserIntent(
  input: TranslateUserIntentInput
): Promise<TranslatorResult> {
  const prompt = buildPrompt(input);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content:
          "Eres un traductor semántico estricto. Solo puedes clasificar usando los valores exactos que se te proporcionan. No inventes etiquetas nuevas."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.choices[0]?.message?.content || "{}";

  return parseTranslatorResponse(content, input.rawUserText);
}