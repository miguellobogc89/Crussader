import { openai } from "@/lib/ai";
import { ACTIONS } from "@/lib/agents/actions";

type BuildFreeChatReplyArgs = {
  sessionId: string;
  userText: string;
  phone: string; // digits (from WA)
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
content:
  "Eres la recepcionista virtual por WhatsApp de una clínica. Tu trabajo incluye pedir y guardar datos de contacto del cliente para gestionar su cita (nombre, apellidos, email, teléfono, DNI o cualquier tipo de dato que te de el cliente que sea habitual recoger en clínicas). Cuando el cliente proporcione cualquiera de esos datos, llama a customer_data_upsert. Los datos pueden venir sueltos o en conjunto. Después de guardar, responde de forma natural y continúa la conversación.",
     },
      { role: "user", content: userText },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "customer_data_upsert",
          description:
            "Guarda/actualiza datos del cliente (email, nombre/apellido si era Unknown, o cambio de teléfono). Devuelve un mensaje corto tipo: 'email actualizado'.",
          parameters: {
            type: "object",
            properties: {
              companyId: { type: "string", description: "Company id actual" },
              phone: {
                type: "string",
                description:
                  "Teléfono actual desde el que escribe el cliente (digits).",
              },
              email: { type: "string", description: "Email del cliente" },
              firstName: { type: "string", description: "Nombre" },
              lastName: { type: "string", description: "Apellido" },
              newPrimaryPhone: {
                type: "string",
                description:
                  "Si el cliente dice que su número correcto es otro, aquí va el nuevo (digits).",
              },
            },
            required: ["companyId", "phone"],
          },
        },
      },
    ],
    tool_choice: "auto",
    max_tokens: 180,
  });

  const choice = completion.choices?.[0];

  // 1) Tool calling (si viene)
  if (choice && choice.finish_reason === "tool_calls") {
    const toolCallsAny: any =
      choice && choice.message ? (choice.message as any).tool_calls : null;

    const toolCall = Array.isArray(toolCallsAny) ? toolCallsAny[0] : null;

    const fn = toolCall && toolCall.function ? toolCall.function : null;
    const fnName = fn && typeof fn.name === "string" ? fn.name : "";
    const fnArgsRaw =
      fn && typeof fn.arguments === "string" ? fn.arguments : "{}";

    if (fnName === "customer_data_upsert") {
      let parsedArgs: any = {};
      try {
        parsedArgs = JSON.parse(fnArgsRaw);
      } catch {
        parsedArgs = {};
      }

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

      const changes = Array.isArray((res as any).changes)
        ? (res as any).changes
        : [];

      // Si no hubo cambios, NO “se lo comas” al usuario: responde normal (sin tools)
      if (changes.length === 0 || (changes.length === 1 && changes[0] === "NO_CHANGES")) {
        const retry = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente conversacional de WhatsApp. No llames herramientas. Responde normal y útil.",
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

// Si sí hubo cambios, NO devolvemos res.message al usuario.
// Generamos una respuesta normal (sin tools) y guardamos el upsert en internal.
const follow = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0.2,
  messages: [
    {
      role: "system",
      content:
        "Eres un asistente conversacional de WhatsApp. Responde normal y útil. No menciones actualizaciones internas de datos.",
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
    changes: changes.map((c: any) => String(c)),
    customerId: String((res as any).customerId || ""),
  },
};
    }
  }

  // 2) Respuesta normal si no llamó tool
  const text = safeTrim(
    choice && choice.message ? (choice.message as any).content : ""
  );
  return { botText: text || "OK" };
}