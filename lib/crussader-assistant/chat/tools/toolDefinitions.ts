// lib/crussader-assistant/chat/tools/toolDefinitions.ts
// lib/crussader-assistant/chat/tools/toolDefinitions.ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const toolDefinitions: ChatCompletionTool[] = [

  {
    type: "function",
    function: {
      name: "get_news",
      description:
        "Obtiene noticias actuales filtradas por categoría, país y tema. Para deportes, usa category='sports' y topic para indicar el deporte concreto o competición.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "general o sports",
          },
          topic: {
            type: "string",
            description:
              "Deporte o competición específica cuando aplique. Ejemplos: basketball, football, tennis, formula1, motogp, acb, nba, euroliga",
          },
          topics: {
            type: "array",
            items: { type: "string" },
            description:
              "Lista opcional de temas o deportes concretos relacionados",
          },
          query: {
            type: "string",
            description:
              "Consulta libre opcional para afinar la búsqueda",
          },
          country: {
            type: "string",
            description: "Código de país, por ejemplo es",
          },
          limit: {
            type: "number",
          },
          include: {
            type: "array",
            items: { type: "string" },
          },
          exclude: {
            type: "array",
            items: { type: "string" },
          },
          match_scope: {
            type: "string",
            enum: ["title", "title_description"],
          },
        },
      },
    },
  },

{
  type: "function",
  function: {
    name: "get_prayer",
    description:
      "Obtiene una o varias partes de las lecturas del día. Si el usuario pide varias partes, usa kind='all' y marca include_parts con las partes concretas.",
    parameters: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["evangelio", "salmo", "primera_lectura", "all"],
          description:
            "Parte principal solicitada. Usa 'all' si el usuario pide más de una parte o las lecturas completas.",
        },
        include_parts: {
          type: "array",
          items: {
            type: "string",
            enum: ["evangelio", "salmo", "primera_lectura"],
          },
          description:
            "Partes concretas que quiere el usuario cuando pide varias a la vez. Ejemplo: ['salmo','primera_lectura']",
        },
      },
      required: ["kind"],
    },
  },
},

  {
    type: "function",
    function: {
      name: "upsert_assistant_event",
      description: "Crea un evento programado del usuario. Puede ser recurrente o puntual.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["GOSPEL", "NEWS", "REMINDER", "CUSTOM"],
          },
          title: { type: "string" },
          prompt: { type: "string" },

          isOneTime: {
            type: "boolean",
            description: "true si el evento es puntual; false si es recurrente",
          },
          timeExpression: {
            type: "string",
            description:
              "Expresión temporal natural para eventos puntuales. Ejemplos: 'en 2 minutos', 'en media hora', 'mañana a las 8', 'esta noche'",
          },

          localTime: {
            type: "string",
            description:
              "Hora local en formato HH:mm cuando el evento es recurrente",
          },
          daysOfWeek: {
            type: "array",
            items: { type: "number" },
            description:
              "Días de la semana cuando el evento es recurrente",
          },

          timezone: { type: "string" },
          status: {
            type: "string",
            enum: ["ACTIVE", "PAUSED", "CANCELLED"],
          },
        },
        required: ["type", "title", "prompt"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "list_assistant_events",
      description:
        "Obtiene la lista de eventos programados del usuario (noticias, oración diaria, recordatorios, etc).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },

  {
    type: "function",
    function: {
      name: "pause_event",
      description: "Pausa un envío automático del usuario.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID del evento (si se conoce)",
          },
          type: {
            type: "string",
            enum: ["GOSPEL", "NEWS", "REMINDER", "CUSTOM"],
            description: "Tipo de evento si no se conoce el id",
          },
        },
      },
    },
  },

  {
    type: "function",
    function: {
      name: "resume_event",
      description: "Reactiva un envío automático que estaba pausado.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "ID del evento si se conoce",
          },
          type: {
            type: "string",
            enum: ["GOSPEL", "NEWS", "REMINDER", "CUSTOM"],
            description: "Tipo de evento si no se conoce el id",
          },
        },
      },
    },
  },
];