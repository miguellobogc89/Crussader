// lib/crussader-assistant/intake/translator/translateUserMessageForIntake.ts

import OpenAI from "openai";
import { intakeCatalog } from "../intakeCatalog";
import type { IntakeTranslatorResult } from "../intakeTypes";
import type { IntakeCapabilityKey } from "../intakeCatalog";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type TranslateUserMessageForIntakeInput = {
  rawUserText: string;
  previousMessages: Array<{
    role: "user" | "assistant";
    text: string;
  }>;
  catalog: Array<{
    key: string;
    name: string;
    description: string;
    allowedActions: Array<{
      key: string;
      name: string;
      description: string;
    }>;
  }>;
  catalogSummary: string;
};

function buildPreviousMessagesBlock(
  previousMessages: Array<{
    role: "user" | "assistant";
    text: string;
  }>
) {
  if (!previousMessages.length) {
    return "Sin contexto previo relevante.";
  }

  return previousMessages
    .map((message) => `${message.role}: ${message.text}`)
    .join("\n");
}

function buildLegacyCapabilitiesBlock() {
  return intakeCatalog.capabilities
    .map((capability) => {
      let requiredFields = "none";
      let optionalFields = "none";

      if (capability.requiredFields.length > 0) {
        requiredFields = capability.requiredFields.join(", ");
      }

      if (capability.optionalFields.length > 0) {
        optionalFields = capability.optionalFields.join(", ");
      }

      return [
        `- key: ${capability.key}`,
        `  label: ${capability.label}`,
        `  description: ${capability.description}`,
        `  requiredFields: ${requiredFields}`,
        `  optionalFields: ${optionalFields}`
      ].join("\n");
    })
    .join("\n");
}

function buildCatalogBlock(input: TranslateUserMessageForIntakeInput) {
  return [
    "CATÃLOGO REAL DEL ASISTENTE",
    "",
    "RESUMEN:",
    input.catalogSummary,
    "",
    "DETALLE JSON:",
    JSON.stringify(input.catalog, null, 2)
  ].join("\n");
}

function asCapabilityKey(value: unknown): IntakeCapabilityKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const exists = intakeCatalog.capabilities.some(
    (capability) => capability.key === value
  );

  if (!exists) {
    return null;
  }

  return value as IntakeCapabilityKey;
}

function buildPrompt(input: TranslateUserMessageForIntakeInput) {
  const previousMessagesBlock = buildPreviousMessagesBlock(input.previousMessages);
  const legacyCapabilitiesBlock = buildLegacyCapabilitiesBlock();
  const catalogBlock = buildCatalogBlock(input);

  return `
Eres el mÃ³dulo de intake conversacional de un asistente.

Tu trabajo NO es ejecutar nada.
Tu trabajo es entender quÃ© estÃ¡ haciendo el usuario en este turno concreto.

IMPORTANTE:
El contexto previo ayuda, pero NO manda sobre el mensaje actual.
Si el mensaje actual parece una nueva conversaciÃ³n, una reacciÃ³n emocional, una charla casual o un comentario social, debes tratarlo como conversaciÃ³n aunque antes hubiera una tarea pendiente.
No debes arrastrar automÃ¡ticamente una intenciÃ³n anterior si el mensaje actual no aporta datos claros para continuarla.

TambiÃ©n debes detectar dudas y peticiones implÃ­citas.
El usuario NO siempre pide informaciÃ³n de forma directa.
Frases como "no sabÃ­a la capital de PerÃº", "no me acuerdo", "me preguntaron esto y no lo sÃ©", "sigo sin saberlo" suelen implicar una peticiÃ³n real de informaciÃ³n.

El usuario puede:
- simplemente conversar
- hacer una peticiÃ³n real
- continuar una peticiÃ³n anterior aportando mÃ¡s datos
- cancelar o abandonar una tarea pendiente
- hablar de forma ambigua
- preguntar quÃ© sabe hacer el asistente
- pedir mÃ¡s detalle sobre una capacidad concreta del asistente

Debes devolver JSON vÃ¡lido.

CONTEXTO PREVIO:
${previousMessagesBlock}

MENSAJE ACTUAL:
${input.rawUserText}

CATÃLOGO LEGACY DE CAPACIDADES INTERNAS:
${legacyCapabilitiesBlock}

${catalogBlock}

REGLAS:

1. Si el usuario estÃ¡ conversando, desahogÃ¡ndose, reaccionando, saludando, agradeciendo, comentando algo personal o hablando de forma social, devuelve:
   interactionMode = "CONVERSATION"
   detectedCapability = null

2. Si el usuario expresa una peticiÃ³n que encaja claramente con una capacidad ejecutable del catÃ¡logo interno, devuelve:
   interactionMode = "TASK_DETECTED"
   detectedCapability = la key exacta del catÃ¡logo interno

3. Debes detectar tambiÃ©n peticiones implÃ­citas de informaciÃ³n.
   Si el usuario expresa que no sabe, no recuerda o quiere aclarar un dato concreto, eso cuenta como tarea informativa.
   En esos casos devuelve:
   interactionMode = "TASK_DETECTED"
   detectedCapability = "QUERY_INFORMATION"
3.b. Si el usuario pregunta por recordatorios, avisos, eventos o suscripciones que ya existen en el sistema, NO uses QUERY_INFORMATION.
Debes usar la capacidad interna del dominio EVENTS que corresponda.

Ejemplos orientativos:
- "Â¿QuÃ© recordatorios tengo activos?" -> detectedCapability = "LIST_EVENTS"
- "Dime mis recordatorios" -> detectedCapability = "LIST_EVENTS"
- "CÃ¡mbiame el recordatorio de maÃ±ana a las 7" -> detectedCapability = "UPDATE_EVENT"
- "Pausa ese recordatorio" -> detectedCapability = "PAUSE_EVENT"
- "ReanÃºdalo" -> detectedCapability = "RESUME_EVENT"
- "Borra ese recordatorio" -> detectedCapability = "CANCEL_EVENT"
- "Cancela todos mis recordatorios" -> detectedCapability = "CANCEL_ALL_EVENTS"

Para el usuario, expresiones como "borrar", "eliminar", "quitar", "cancelar", "parar" o "desactivar" suelen significar cancelar un evento existente.
Si habla de todos, usa CANCEL_ALL_EVENTS.

3.c. Si el usuario quiere cambiar, mover, editar o modificar un recordatorio, aviso o suscripciÃ³n existente, usa la capacidad interna "UPDATE_EVENT".

Ejemplos:
- "Cambia el recordatorio de llamar a mamÃ¡ a las 9" -> detectedCapability = "UPDATE_EVENT"
- "MuÃ©velo a maÃ±ana" -> detectedCapability = "UPDATE_EVENT"
- "PÃ¡salo a las 7" -> detectedCapability = "UPDATE_EVENT"
- "Cambia el recordatorio de llamar a mamÃ¡ por llamar al dentista" -> detectedCapability = "UPDATE_EVENT"
- "Haz el recordatorio de llamar a mamÃ¡ todos los dÃ­as" -> detectedCapability = "UPDATE_EVENT"

En estos casos devuelve:
interactionMode = "TASK_DETECTED" o "TASK_DATA_CONTINUATION" si claramente continÃºa una tarea previa
detectedCapability = "UPDATE_EVENT"
data = solo los datos realmente presentes en el mensaje

Campos posibles en data para UPDATE_EVENT:
- eventName
- title
- date
- time
- recurrence
- days

4. Si el usuario pregunta quÃ© puede hacer el asistente, quÃ© servicios ofrece, quÃ© opciones hay, quÃ© sabe hacer, en quÃ© puede ayudar, cuÃ¡l es el menÃº, que repitas el menÃº, que digas todo lo que sabes hacer o algo equivalente, NO lo trates como tarea ejecutable.
   TambiÃ©n cuenta si el usuario lo pide de forma informal o imperfecta, por ejemplo:
   - "quÃ© sabes hacer"
   - "en quÃ© puedes ayudarme"
   - "dime todo lo que sabes hacer"
   - "repÃ­teme lo que sabes hacer"
   - "repite lo que sabes hacer"
   - "quÃ© cosas puedes hacer"
   - "quÃ© me puedes ofrecer"
   - "quÃ© tienes"
   Devuelve:
   interactionMode = "CONVERSATION"
   detectedCapability = null
   data.capabilityIntent = "SHOW_MENU_SUMMARY"

5. Si el usuario pide detalle sobre una capacidad concreta del catÃ¡logo real, por ejemplo:
   - "cuÃ©ntame mÃ¡s sobre los avisos deportivos"
   - "quÃ© incluyen los envÃ­os"
   - "explÃ­came los recordatorios"
   entonces devuelve:
   interactionMode = "CONVERSATION"
   detectedCapability = null
   data.capabilityIntent = "SHOW_MENU_DETAIL"
   data.catalogProductKey = la key exacta del producto si estÃ¡ clara

6. Solo devuelve:
   interactionMode = "TASK_DATA_CONTINUATION"
   si el mensaje actual aporta datos claros para completar una tarea previa.
   Ejemplos vÃ¡lidos:
   - una fecha
   - una hora
   - una recurrencia
   - unos dÃ­as de la semana
   - un nombre de evento
   - un tema
   - una localizaciÃ³n
   - una confirmaciÃ³n claramente ligada a lo que se estaba pidiendo

7. NO marques TASK_DATA_CONTINUATION si el mensaje actual es una frase emocional, un comentario social, una opiniÃ³n, una queja, una reacciÃ³n general o un cambio natural de conversaciÃ³n.
   Ejemplos que deben ser CONVERSATION:
   - "he tenido un mal dÃ­a"
   - "vaya ridÃ­culo he hecho hoy"
   - "menos mal"
   - "quÃ© vergÃ¼enza"
   - "ya..."
   - "madre mÃ­a"

8. Si hay una tarea pendiente en el contexto y el usuario expresa claramente que quiere cancelarla, abandonarla o dejarla, devuelve:
   interactionMode = "TASK_CANCEL"
   detectedCapability = null

   Esto aplica a mensajes como:
   - "olvÃ­dalo"
   - "ya no"
   - "cancela eso"
   - "dÃ©jalo"
   - "mejor no"
   - "da igual"

   IMPORTANTE:
   - Solo usa TASK_CANCEL si el mensaje claramente indica abandonar o cancelar la tarea pendiente.
   - Si el mensaje parece una conversaciÃ³n nueva o un cambio de tema, usa CONVERSATION, no TASK_CANCEL.

9. Si no estÃ¡ claro quÃ© quiere, devuelve:
   interactionMode = "UNCLEAR"
   detectedCapability = null

10. "userGoal" debe resumir en una frase breve lo que realmente intenta conseguir el usuario.
   Si solo conversa, puede ser null.

11. "data" solo debe incluir datos realmente presentes o claramente inferibles.
   Ejemplos:
   eventName, date, time, recurrence, days, contentType, topic, location, frequency, question, capabilityIntent, catalogProductKey

12. Para QUERY_INFORMATION, si el usuario menciona claramente una duda concreta, rellena "data.question" con una pregunta limpia y directa.

13. "missingFields" solo debe contener los campos que faltan para que la capacidad detectada quede suficientemente definida.

14. No inventes capacidades fuera del catÃ¡logo interno.
    No inventes productos fuera del catÃ¡logo real.

15. "rewrittenUserText" debe ser una reformulaciÃ³n breve y fiel del mensaje actual, no una respuesta del asistente.
    Debe expresar lo que el usuario quiso decir, sin cambiar de persona ni inventar intenciÃ³n nueva.

16. "confidence" debe ser un nÃºmero entre 0 y 1.

17. Si el mensaje actual contiene una duda o peticiÃ³n nueva suficientemente clara, prioriza el mensaje actual frente al contexto previo.

18. Si el mensaje actual no ayuda a completar la tarea previa y parece una conversaciÃ³n nueva, clasifÃ­calo como CONVERSATION.

19. IMPORTANTE SOBRE EL CATÃLOGO REAL:
   - REMINDER = recordatorios libres del usuario
   - CONTENT_DELIVERY = envÃ­os programados de noticias, tiempo, oraciones, horÃ³scopo, jornada de liga
   - SPORT_EVENT_ALERT = avisos de inicio, final, goles o rojas en partidos

20. MAPEO ORIENTATIVO ENTRE CATÃLOGO REAL Y CAPACIDADES INTERNAS:
   - Si el usuario quiere que se le recuerde algo, usa detectedCapability = "CREATE_EVENT"
   - Si el usuario quiere recibir algo programado o recurrente, usa detectedCapability = "SUBSCRIBE_CONTENT"
   - Si el usuario quiere saber un dato, usa detectedCapability = "QUERY_INFORMATION"

   21. AdemÃ¡s de la capacidad interna legacy, debes intentar mapear el mensaje al catÃ¡logo real del asistente.

22. "detectedCatalogCapabilityKey" debe contener la key exacta de la capability del catÃ¡logo real si estÃ¡ clara. Si no estÃ¡ clara, usa null.

23. "detectedCatalogActionKey" debe contener la key exacta de la action del catÃ¡logo real si estÃ¡ clara. Si no estÃ¡ clara, usa null.

24. "detectedCatalogProductKey" debe contener la key exacta del product del catÃ¡logo real si estÃ¡ claro. Si no estÃ¡ claro, usa null.

25. "detectedCatalogItemKey" debe contener la key exacta del item del catÃ¡logo real si aplica claramente. Si no aplica o no estÃ¡ claro, usa null.

26. No inventes keys del catÃ¡logo real. Solo usa keys existentes en el catÃ¡logo proporcionado.

27. Aunque rellenes los campos del catÃ¡logo real, debes seguir rellenando "detectedCapability" con la capacidad legacy mÃ¡s adecuada para no romper el sistema actual.

EJEMPLOS ORIENTATIVOS:

- mensaje: "buenas"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  rewrittenUserText: "Buenas"

- mensaje: "he tenido un mal dÃ­a"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  rewrittenUserText: "He tenido un mal dÃ­a"

- mensaje: "vaya ridÃ­culo he hecho hoy"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  rewrittenUserText: "He hecho el ridÃ­culo hoy"

- mensaje: "quiero que me recuerdes llamar a mi madre"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "CREATE_EVENT"
  data: { eventName: "Llamar a mi madre" }
  missingFields: ["time"]

- contexto: el usuario ya pidiÃ³ un recordatorio
  mensaje: "maÃ±ana a las 8"
  interactionMode: "TASK_DATA_CONTINUATION"
  detectedCapability: "CREATE_EVENT"
  data: { date: "maÃ±ana", time: "08:00" }

- contexto: antes se hablÃ³ de geografÃ­a
  mensaje: "vaya ridÃ­culo he hecho hoy"
  interactionMode: "CONVERSATION"
  detectedCapability: null

- mensaje: "si, me preguntaron la capital de tÃºnez y no la sabÃ­a"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "QUERY_INFORMATION"
  data: { question: "Â¿CuÃ¡l es la capital de TÃºnez?" }

  - mensaje: "Cambia el recordatorio de llamar a mamÃ¡ a las 9"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "UPDATE_EVENT"
  data: { eventName: "llamar a mamÃ¡", time: "09:00" }

- mensaje: "MuÃ©velo a maÃ±ana"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "UPDATE_EVENT"
  data: { date: "maÃ±ana" }

- mensaje: "Haz el recordatorio de llamar a mamÃ¡ todos los dÃ­as"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "UPDATE_EVENT"
  data: { eventName: "llamar a mamÃ¡", recurrence: "daily" }

- mensaje: "no sabÃ­a la capital de PerÃº"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "QUERY_INFORMATION"
  data: { question: "Â¿CuÃ¡l es la capital de PerÃº?" }

- mensaje: "no me acuerdo de la capital de Marruecos"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "QUERY_INFORMATION"
  data: { question: "Â¿CuÃ¡l es la capital de Marruecos?" }

- mensaje: "quÃ© puedes hacer"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_SUMMARY" }

- mensaje: "explÃ­came los avisos deportivos"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_DETAIL", catalogProductKey: "SPORT_EVENT_ALERT" }
- mensaje: "Â¿QuÃ© recordatorios tengo activos?"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "LIST_EVENTS"

- mensaje: "dime mis recordatorios"
  interactionMode: "TASK_DETECTED"
  detectedCapability: "LIST_EVENTS"

- mensaje: "quÃ© envÃ­os tienes"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_DETAIL", catalogProductKey: "CONTENT_DELIVERY" }
  - mensaje: "dime todo lo que sabes hacer"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_SUMMARY" }

- mensaje: "repite lo que sabes hacer"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_SUMMARY" }

- mensaje: "en quÃ© puedes ayudarme"
  interactionMode: "CONVERSATION"
  detectedCapability: null
  data: { capabilityIntent: "SHOW_MENU_SUMMARY" }

  - contexto: el usuario tenÃ­a una tarea pendiente
  mensaje: "olvÃ­dalo"
  interactionMode: "TASK_CANCEL"
  detectedCapability: null

- contexto: el usuario tenÃ­a una tarea pendiente
  mensaje: "ya no"
  interactionMode: "TASK_CANCEL"
  detectedCapability: null

- contexto: el usuario tenÃ­a una tarea pendiente
  mensaje: "mejor dÃ©jalo"
  interactionMode: "TASK_CANCEL"
  detectedCapability: null

SALIDA EXACTA:

{
  "rewrittenUserText": string,
  "interactionMode": "CONVERSATION" | "TASK_DETECTED" | "TASK_DATA_CONTINUATION" | "TASK_CANCEL" | "TASK_CONFIRM" | "UNCLEAR",
  "detectedCapability": string | null,
  "detectedCatalogCapabilityKey": string | null,
  "detectedCatalogActionKey": string | null,
  "detectedCatalogProductKey": string | null,
  "detectedCatalogItemKey": string | null,
  "confidence": number,
  "data": {},
  "missingFields": [],
  "userGoal": string | null
}
`;
}

function parseTranslatorResponse(
  content: string,
  fallbackText: string
): IntakeTranslatorResult {
  try {
    const parsed = JSON.parse(content);

    let interactionMode: IntakeTranslatorResult["interactionMode"] = "UNCLEAR";

    if (parsed.interactionMode === "CONVERSATION") {
      interactionMode = "CONVERSATION";
    } else if (parsed.interactionMode === "TASK_DETECTED") {
      interactionMode = "TASK_DETECTED";
    } else if (parsed.interactionMode === "TASK_DATA_CONTINUATION") {
      interactionMode = "TASK_DATA_CONTINUATION";
    } else if (parsed.interactionMode === "TASK_CANCEL") {
      interactionMode = "TASK_CANCEL";
    } else if (parsed.interactionMode === "TASK_CONFIRM") {
      interactionMode = "TASK_CONFIRM";
    } else if (parsed.interactionMode === "UNCLEAR") {
      interactionMode = "UNCLEAR";
    }

    const detectedCapability = asCapabilityKey(parsed.detectedCapability);

    let confidence = 0;
    if (typeof parsed.confidence === "number") {
      confidence = parsed.confidence;
    }

    let rewrittenUserText = fallbackText;
    if (typeof parsed.rewrittenUserText === "string") {
      rewrittenUserText = parsed.rewrittenUserText;
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

    let userGoal: string | null = null;
    if (typeof parsed.userGoal === "string") {
      userGoal = parsed.userGoal;
    }

    // NUEVOS CAMPOS DEL CATÃLOGO
    let detectedCatalogCapabilityKey: string | null = null;
    if (typeof parsed.detectedCatalogCapabilityKey === "string") {
      detectedCatalogCapabilityKey = parsed.detectedCatalogCapabilityKey;
    }

    let detectedCatalogActionKey: string | null = null;
    if (typeof parsed.detectedCatalogActionKey === "string") {
      detectedCatalogActionKey = parsed.detectedCatalogActionKey;
    }

    let detectedCatalogProductKey: string | null = null;
    if (typeof parsed.detectedCatalogProductKey === "string") {
      detectedCatalogProductKey = parsed.detectedCatalogProductKey;
    }

    let detectedCatalogItemKey: string | null = null;
    if (typeof parsed.detectedCatalogItemKey === "string") {
      detectedCatalogItemKey = parsed.detectedCatalogItemKey;
    }

    return {
      rewrittenUserText,
      interactionMode,
      detectedCapability,

      detectedCatalogCapabilityKey,
      detectedCatalogActionKey,
      detectedCatalogProductKey,
      detectedCatalogItemKey,

      confidence,
      data,
      missingFields,
      userGoal
    };
  } catch {
    return {
      rewrittenUserText: fallbackText,
      interactionMode: "UNCLEAR",
      detectedCapability: null,

      detectedCatalogCapabilityKey: null,
      detectedCatalogActionKey: null,
      detectedCatalogProductKey: null,
      detectedCatalogItemKey: null,

      confidence: 0,
      data: {},
      missingFields: [],
      userGoal: null
    };
  }
}

export async function translateUserMessageForIntake(
  input: TranslateUserMessageForIntakeInput
): Promise<IntakeTranslatorResult> {
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
          "Eres un intake conversacional. Entiendes conversaciÃ³n humana, detectas peticiones reales, detectas preguntas sobre el menÃº del asistente y extraes datos Ãºtiles sin ejecutar acciones. El mensaje actual manda sobre el contexto previo y debes detectar tambiÃ©n preguntas implÃ­citas."
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
