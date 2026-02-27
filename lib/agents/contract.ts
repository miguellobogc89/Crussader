// lib/agents/contract.ts
import { z } from "zod";

/**
 * Intents CORE reutilizables para cualquier agente.
 * Mantén esto estable: añadir es ok, cambiar rompe compatibilidad.
 */
export const AgentIntent = z.enum([
  "faq_query",        // responder usando knowledge / info estática
  "lookup_entity",    // buscar algo existente (cliente, cita, review, etc.)
  "list_options",     // devolver opciones (slots disponibles, servicios, etc.)
  "create_record",    // crear entidad (cita, lead, etc.) -> backend lo ejecuta
  "update_record",    // actualizar entidad (confirmar/cancelar cita, etc.)
  "handoff_human",    // derivar a humano
]);

export type AgentIntent = z.infer<typeof AgentIntent>;

/**
 * Acción estructurada que devuelve la IA.
 * - intent: obligatorio
 * - args: parámetros (siempre JSON)
 * - confidence: 0..1 (opcional)
 * - user_facing: texto que el bot puede decir al usuario (opcional)
 */
export const AgentActionSchema = z.object({
  intent: AgentIntent,
  args: z.record(z.any()).default({}),
  confidence: z.number().min(0).max(1).optional(),
  user_facing: z.string().optional(),
});

export type AgentAction = z.infer<typeof AgentActionSchema>;

/**
 * Envelope: lo que tu backend recibe para ejecutar,
 * incluyendo el agente que lo solicita y el scope (company/location).
 */
export const AgentRequestSchema = z.object({
  agentKey: z.string().min(1), // ej: "whatsapp", "reviews", "voice"
  companyId: z.string().min(1),
  locationId: z.string().optional(),
  conversationId: z.string().optional(),
  customerId: z.string().optional(),
  customerPhoneE164: z.string().optional(),
  action: AgentActionSchema,
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

/**
 * Respuesta estándar del executor (backend -> IA o backend -> canal).
 * - ok: ejecución válida
 * - data: payload para que la IA continúe (slots, entidad encontrada, etc.)
 * - error: mensaje corto para logs/UI
 */
export const AgentResultSchema = z.object({
  ok: z.boolean(),
  data: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

export const AgentTraceStepSchema = z.object({
  // understanding | plan | action | decision (o lo que quieras ampliar)
  kind: z.string().min(1),
  at: z.number().optional(), // epoch ms si quieres
  summary: z.string().optional(), // frase corta para humanos

  // payload libre pero estructurado por convención
  data: z.record(z.any()).optional(),
});

export type AgentTraceStep = z.infer<typeof AgentTraceStepSchema>;

export const AgentTraceSchema = z.object({
  agentKey: z.string().min(1),   // "whatsapp"
  requestId: z.string().optional(),
  steps: z.array(AgentTraceStepSchema).default([]),
});

export type AgentTrace = z.infer<typeof AgentTraceSchema>;

// Extiende AgentResult (executor) para poder devolver trace cuando debug=1
export const AgentResultSchemaV2 = AgentResultSchema.extend({
  trace: AgentTraceSchema.optional(),
});

// Si no quieres renombrar imports ahora, NO lo uses aún.
// Solo lo dejamos listo para el paso 2.
export type AgentResultV2 = z.infer<typeof AgentResultSchemaV2>;

export const AgentNeedType = z.enum([
  "info",        // duda informativa (horarios, dirección, precios, etc.)
  "booking",     // quiere reservar / disponibilidad
  "modify",      // reprogramar / cancelar / confirmar
  "status",      // consultar estado / próxima cita
  "complaint",   // queja / incidencia
  "human",       // quiere hablar con alguien
  "other",       // otro tipo de petición
  "unknown",     // no se entiende aún
]);

export type AgentNeedType = z.infer<typeof AgentNeedType>;

export const AgentUnderstandingSchema = z.object({
  need: z.object({
    type: AgentNeedType,
    summary: z.string().min(1),      // “quiere una endodoncia”
    confidence: z.number().min(0).max(1).optional(),
  }),
  entities: z.object({
    service_name: z.string().optional(),     // “endodoncia”
    location_hint: z.string().optional(),    // “clínica de X”, barrio, etc.
    time_hint: z.string().optional(),        // “mañana por la tarde”
    customer_name: z.string().optional(),    // si lo da
    customer_phone: z.string().optional(),   // si lo da
  }),
  missing: z.array(z.string()).max(2).default([]), // datos imprescindibles
});

export type AgentUnderstanding = z.infer<typeof AgentUnderstandingSchema>;