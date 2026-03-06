import { openai } from "@/lib/ai";
import { ACTIONS } from "@/lib/agents/actions";
import { getSessionMemory } from "@/lib/agents/memory/getSessionMemory";

type BuildFreeChatReplyArgs = {
  sessionId: string;
  userText: string;
  phone: string;
  companyId: string;
};

type BuildFreeChatReplyResult = {
  botText: string;
  internal?: {
    kind: "CUSTOMER_UPSERT";
    message: string;
    changes: string[];
    customerId: string;
  };
};

function safeTrim(v: unknown): string {
  return String(v || "").trim();
}

function memoryValueToText(v: unknown): string {
  const t = safeTrim(v);

  if (!t) {
    return "desconocido";
  }

  return t;
}

function buildMemoryBlock(
  memory: {
    profile: Record<string, unknown>;
    state: Record<string, unknown>;
  },
  phone: string
): string {
  const profile = memory.profile || {};
  const state = memory.state || {};

  const firstName = memoryValueToText(profile.firstName);
  const lastName = memoryValueToText(profile.lastName);
  const email = memoryValueToText(profile.email);
  const profilePhone = memoryValueToText(profile.phone);

  let effectivePhone = phone;
  if (profilePhone !== "desconocido") {
    effectivePhone = profilePhone;
  }

  const flow = memoryValueToText(state.flow);
  const step = memoryValueToText(state.step);
  const requestedServiceText = memoryValueToText(state.requestedServiceText);
  const selectedLocationId = memoryValueToText(state.selectedLocationId);
  const selectedServiceId = memoryValueToText(state.selectedServiceId);

  return [
    "Memoria disponible de la sesión:",
    "- profile.firstName: " + firstName,
    "- profile.lastName: " + lastName,
    "- profile.email: " + email,
    "- profile.phone: " + memoryValueToText(effectivePhone),
    "- state.flow: " + flow,
    "- state.step: " + step,
    "- state.requestedServiceText: " + requestedServiceText,
    "- state.selectedLocationId: " + selectedLocationId,
    "- state.selectedServiceId: " + selectedServiceId,
    "",
    "Instrucciones importantes:",
    "- Si ya conoces algún dato por esta memoria, no lo vuelvas a pedir.",
    "- Pide solo los datos que falten para continuar.",
    "- Si state.flow es appointment_management, mantén el contexto de cita.",
    "- Si state.step es awaiting_service y el usuario responde con un posible nombre de servicio, intenta resolverlo usando la tool appointment_service_lookup.",
    "- No trates una respuesta corta dentro de un flujo de cita como una consulta informativa genérica, salvo que el usuario cambie claramente de tema.",
  ].join("\n");
}

export async function buildFreeChatReply(
  args: BuildFreeChatReplyArgs
): Promise<BuildFreeChatReplyResult> {
  const sessionId = safeTrim(args.sessionId);
  const userText = safeTrim(args.userText);
  const phone = safeTrim(args.phone);
  const companyId = safeTrim(args.companyId);

  if (!sessionId) throw new Error("Missing sessionId");
  if (!userText) throw new Error("Missing userText");
  if (!phone) throw new Error("Missing phone");
  if (!companyId) throw new Error("Missing companyId");

  const memory = await getSessionMemory(sessionId);
  const memoryBlock = buildMemoryBlock(memory, phone);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
          Eres la recepcionista virtual por WhatsApp de una clínica.

          Tienes acceso a una memoria de sesión con datos conocidos del cliente y con el estado actual del flujo conversacional.

          Reglas obligatorias:
          - Si un dato ya está en la memoria, no lo pidas otra vez.
          - Solo pide los datos que falten de verdad para continuar.
          - Si el cliente repite un dato que ya tienes, confírmalo brevemente y sigue con la conversación.
          - No vuelvas a pedir nombre, apellidos, email o teléfono si ya están en la memoria.
          - No pidas datos "por completar ficha" si no son necesarios en ese momento.
          - Tu prioridad es ayudar al cliente con lo que pide, no recopilar datos innecesariamente.
          - Debes respetar el flujo conversacional guardado en memoria.state.
          - Si memory.state.flow = appointment_management, mantén el contexto de gestión de cita.

          Regla crítica para citas:

          Si memory.state.flow = appointment_management:
          - Nunca interpretes el mensaje del usuario como una pregunta informativa.
          - El usuario está intentando reservar una cita.

          Si memory.state.step = awaiting_service:
          - Debes intentar resolver el servicio usando la tool appointment_service_lookup.
          - Incluso si el mensaje es corto como "higiene", "limpieza", "revisión", "implantes", etc.
          - No respondas con una explicación general del servicio.
          - Primero llama a appointment_service_lookup para intentar identificar el servicio real.

          - Si una tool devuelve información estructurada útil, utilízala para continuar sin inventar datos.
          - No menciones herramientas internas, memoria interna ni procesos internos.

          Cuando el cliente proporcione un dato nuevo o una corrección de nombre, apellido, email o teléfono, llama a customer_data_upsert para guardarlo.
          `,
      },
      {
        role: "system",
        content: memoryBlock,
      },
      {
        role: "user",
        content: userText,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "customer_data_upsert",
          description:
            "Guarda o actualiza datos del cliente (email, nombre, apellido o cambio de teléfono).",
          parameters: {
            type: "object",
            properties: {
              companyId: { type: "string", description: "Company id actual" },
              phone: {
                type: "string",
                description: "Teléfono actual desde el que escribe el cliente",
              },
              email: { type: "string", description: "Email del cliente" },
              firstName: { type: "string", description: "Nombre" },
              lastName: { type: "string", description: "Apellido" },
              newPrimaryPhone: {
                type: "string",
                description: "Nuevo teléfono correcto si el cliente indica otro",
              },
            },
            required: ["companyId", "phone"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "appointment_service_lookup",
          description:
            "Resuelve el servicio solicitado por el cliente contra los servicios reales disponibles de la empresa y detecta si existe, si es ambiguo o en qué sedes está.",
          parameters: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Sesión actual",
              },
              companyId: {
                type: "string",
                description: "Company id actual",
              },
              userText: {
                type: "string",
                description: "Texto libre del usuario con el servicio que pide",
              },
            },
            required: ["sessionId", "companyId", "userText"],
          },
        },
      },
    ],
    tool_choice: "auto",
    max_tokens: 180,
  });

  const choice = completion.choices?.[0];

  if (choice && choice.finish_reason === "tool_calls") {
    const toolCallsAny =
      choice.message ? (choice.message as any).tool_calls : null;

    const toolCall = Array.isArray(toolCallsAny) ? toolCallsAny[0] : null;

    const fn = toolCall && toolCall.function ? toolCall.function : null;
    const fnName = fn && typeof fn.name === "string" ? fn.name : "";
    const fnArgsRaw =
      fn && typeof fn.arguments === "string" ? fn.arguments : "{}";

    let parsedArgs: Record<string, unknown> = {};

    try {
      parsedArgs = JSON.parse(fnArgsRaw);
    } catch {
      parsedArgs = {};
    }

    if (fnName === "customer_data_upsert") {
      const res = await ACTIONS.customer_data_upsert({
        sessionId,
        companyId,
        phone,
        email: typeof parsedArgs.email === "string" ? parsedArgs.email : null,
        firstName:
          typeof parsedArgs.firstName === "string" ? parsedArgs.firstName : null,
        lastName:
          typeof parsedArgs.lastName === "string" ? parsedArgs.lastName : null,
        newPrimaryPhone:
          typeof parsedArgs.newPrimaryPhone === "string"
            ? parsedArgs.newPrimaryPhone
            : null,
      });

      const changesRaw = (res as any).changes;
      const changes: string[] = Array.isArray(changesRaw)
        ? changesRaw.map((c) => String(c))
        : [];

      if (
        changes.length === 0 ||
        (changes.length === 1 && changes[0] === "NO_CHANGES")
      ) {
        const retry = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `
              Eres un asistente conversacional de WhatsApp.

              Reglas obligatorias:
              - No pidas datos que ya estén en la memoria.
              - Si el usuario repite un dato ya conocido, no lo vuelvas a solicitar.
              - Responde útil, breve y natural.
              `,
            },
            {
              role: "system",
              content: memoryBlock,
            },
            { role: "user", content: userText },
          ],
          max_tokens: 180,
        });

        const retryText = safeTrim(retry.choices?.[0]?.message?.content);

        return {
          botText: retryText || "OK",
          internal: {
            kind: "CUSTOMER_UPSERT",
            message: "no se ha modificado nada",
            changes: ["NO_CHANGES"],
            customerId: String((res as any).customerId || ""),
          },
        };
      }

      const updatedMemory = await getSessionMemory(sessionId);
      const updatedMemoryBlock = buildMemoryBlock(updatedMemory, phone);

      const follow = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
            Eres un asistente conversacional de WhatsApp.

            Reglas obligatorias:
            - No pidas datos que ya estén en la memoria.
            - No menciones actualizaciones internas ni procesos internos.
            - Responde natural, útil y continúa la conversación.
            `,
          },
          {
            role: "system",
            content: updatedMemoryBlock,
          },
          { role: "user", content: userText },
        ],
        max_tokens: 180,
      });

      const followText = safeTrim(follow.choices?.[0]?.message?.content);

      return {
        botText: followText || "OK",
        internal: {
          kind: "CUSTOMER_UPSERT",
          message: safeTrim((res as any).message) || "datos actualizados",
          changes,
          customerId: String((res as any).customerId || ""),
        },
      };
    }

    if (fnName === "appointment_service_lookup") {
      const res = await ACTIONS.appointment_service_lookup({
        sessionId,
        companyId,
        userText,
      });

      const updatedMemory = await getSessionMemory(sessionId);
      const updatedMemoryBlock = buildMemoryBlock(updatedMemory, phone);

      const toolResultBlock = [
        "Resultado interno de appointment_service_lookup:",
        "- status: " + String(res.status),
        "- requestedText: " + String(res.requestedText),
        "- selectedServiceId: " + String(res.selectedServiceId),
        "- selectedLocationId: " + String(res.selectedLocationId),
        "- candidates:",
        JSON.stringify(res.candidates),
        "",
        "Cómo responder:",
        "- Si status = NOT_FOUND, di con naturalidad que no encuentras ese servicio y pide que indique cuál necesita.",
        "- Si status = AMBIGUOUS, pide aclaración mencionando las opciones de forma natural.",
        "- Si status = RESOLVED y selectedLocationId existe, confirma brevemente el servicio entendido y continúa pidiendo el siguiente dato que falte para la cita.",
        "- Si status = RESOLVED y selectedLocationId no existe, confirma brevemente el servicio y pregunta en cuál de las sedes disponibles lo quiere.",
        "- No inventes disponibilidad todavía.",
      ].join("\n");

      const follow = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
            Eres un asistente conversacional de WhatsApp.

            Reglas obligatorias:
            - Mantén el contexto de cita.
            - Usa el resultado de la tool para responder.
            - No menciones herramientas internas ni ids internos.
            - No inventes disponibilidad real todavía.
            - Responde breve, natural y orientado a avanzar la reserva.
            `,
          },
          {
            role: "system",
            content: updatedMemoryBlock,
          },
          {
            role: "system",
            content: toolResultBlock,
          },
          { role: "user", content: userText },
        ],
        max_tokens: 180,
      });

      const followText = safeTrim(follow.choices?.[0]?.message?.content);

      return {
        botText: followText || "OK",
      };
    }
  }

  const text = safeTrim(
    choice && choice.message ? (choice.message as any).content : ""
  );

  return { botText: text || "OK" };
}