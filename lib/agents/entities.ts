// lib/agents/entities.ts

export type AgentEntityName =
  | "service"
  | "appointment"
  | "customer"
  | "location"
  | "knowledge";

type EntityConfig = {
  name: AgentEntityName;
  description: string;
  allowLookup: boolean;
  allowCreate: boolean;
  allowUpdate: boolean;
};

export const AGENT_ENTITY_REGISTRY: Record<AgentEntityName, EntityConfig> = {
  service: {
    name: "service",
    description: "Servicios ofrecidos por la empresa (tratamientos, consultas, etc.)",
    allowLookup: true,
    allowCreate: false,
    allowUpdate: false,
  },
  appointment: {
    name: "appointment",
    description: "Citas o reservas en el calendario",
    allowLookup: true,
    allowCreate: true,
    allowUpdate: true,
  },
  customer: {
    name: "customer",
    description: "Clientes registrados en la empresa",
    allowLookup: true,
    allowCreate: true,
    allowUpdate: true,
  },
  location: {
    name: "location",
    description: "Centros o sedes de la empresa",
    allowLookup: true,
    allowCreate: false,
    allowUpdate: false,
  },
  knowledge: {
    name: "knowledge",
    description: "Información pública definida en el knowledge",
    allowLookup: true,
    allowCreate: false,
    allowUpdate: false,
  },
};