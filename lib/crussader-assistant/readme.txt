El asistente de Crussader está diseñado como un sistema modular orientado a estados conversacionales persistentes. Su objetivo es interpretar las necesidades del usuario en lenguaje natural, recopilar progresivamente los datos necesarios y ejecutar acciones concretas (como crear recordatorios, enviar información o gestionar suscripciones). La arquitectura está dividida en módulos independientes que separan claramente comprensión del lenguaje, memoria conversacional, control de flujo y ejecución de acciones.

El flujo general del sistema sigue seis etapas principales: entrada del usuario, interpretación de intención, actualización de memoria, decisión de flujo, generación de respuesta y ejecución de acciones. Cada una de estas etapas está implementada por un módulo específico del asistente.

Esquema general del sistema



Usuario (WhatsApp / Chat)
        │
        ▼
┌─────────────────────────┐
│  Webhook / Entrada      │
│  (recepción del mensaje)│
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Intake / Intent Parser │
│  Traducción de intención│
│  Extracción de datos    │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Session Memory         │
│  Estado conversacional  │
│  pendingIntent          │
│  contexto reciente      │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Pipeline               │
│  Router de estado       │
│  decide siguiente paso  │
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Reply Generator        │
│  Construcción respuesta │
│  pregunta o confirmación│
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  Action Executor        │
│  ejecución de acciones  │
│  (crear eventos, etc.)  │
└─────────────────────────┘