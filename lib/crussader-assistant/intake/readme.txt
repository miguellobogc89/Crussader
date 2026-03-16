CRUSSADER ASSISTANT
INTAKE MODULE – README
Descripción del sistema de interpretación de mensajes del usuario

================================================================
OBJETIVO DEL MÓDULO INTAKE
==========================

El módulo Intake es la primera capa del cerebro del asistente.
Su función es entender lo que dice el usuario y convertir ese mensaje en un paquete estructurado que el resto del sistema pueda procesar.
El Intake NO ejecuta acciones. Solo interpreta, clasifica y empaqueta información.

Arquitectura conceptual:
Usuario → Intake → Routing → Actions → Resultado

================================================================
PROBLEMA QUE RESUELVE
=====================

Los mensajes del usuario son lenguaje natural y pueden ser ambiguos.

Ejemplos:
"Avísame del tiempo mañana"
"Quiero crear un recordatorio"
"Ir al gimnasio"
"Mañana a las 8"

El sistema necesita convertir eso en algo estructurado como:

requestedInstruction: CREATE_EVENT
action: CREATE
product: EVENT
data: { eventName: "Ir al gimnasio", date: "...", time: "08:00" }

El módulo Intake se encarga de hacer esta traducción.

================================================================
FILOSOFÍA DE DISEÑO
===================

Principios utilizados:

* Separación de responsabilidades
* Arquitectura modular
* No ejecutar lógica de negocio dentro del intake
* No hardcodear keywords siempre que sea posible
* Traducir intención usando IA

El Intake no decide qué hacer, solo explica qué quiere el usuario.

================================================================
TRADUCTOR DE INTENCIÓN
======================

Para evitar listas rígidas como:
createKeywords = ["avísame", "recuérdame", "envíame"]

se creó un módulo llamado:
translateUserIntent

Este módulo usa IA para responder a la pregunta:
"Dado este mensaje del usuario, ¿a cuál de mis instrucciones se refiere?"

La salida incluye:
rewrittenUserText, requestedInstruction, action, product, subtype, confidence, data, missingFields.

Ejemplo:

Mensaje:
"Quiero crear un recordatorio"

Salida:
requestedInstruction: CREATE_EVENT
action: CREATE
product: EVENT

================================================================
INTAKE PACKET
=============

El Intake genera un objeto estructurado llamado IntakePacket.

Estructura simplificada:

rawUserText
rewrittenUserText

session

* sessionId
* status
* turnType
* dependsOnPreviousTurn

understanding

* requestedNeed
* product
* subtype
* confidence
* needsClarification

entities

* rawDateExpressions
* rawTimeExpressions
* rawLocations
* rawTopics

data
missingFields
feedback
memory
routing

Este objeto es el contrato entre el Intake y el resto del sistema.

================================================================
MEMORIA DEL ASISTENTE
=====================

Se definieron dos tipos de memoria.

MEMORIA GLOBAL
Información duradera del usuario: nombre, preferencias, gustos, historial.

MEMORIA DE SESIÓN
Información temporal de la conversación actual: intención abierta, datos recogidos, última pregunta del asistente, últimos mensajes del usuario.

================================================================
IMPLEMENTACIÓN DE MEMORIA DE SESIÓN
===================================

Se creó el módulo: assistantSessionMemory.ts

La memoria se almacena en la tabla: messaging_conversation
Columna: assistant_memory (JSON)

Estructura:
profile
state

================================================================
STATE
=====

Dentro de state existen dos bloques:

pendingIntent
context

================================================================
PENDING INTENT
==============

Representa la intención actual del usuario (ejemplo: crear recordatorio).

Campos:
requestedInstruction
action
product
subtype
status
collectedData
missingFields

Ejemplo:

requestedInstruction: CREATE_EVENT
action: CREATE
product: EVENT
collectedData: { eventName: "Ir al gimnasio" }
missingFields: ["date","time"]

================================================================
CONTEXT
=======

Información reciente de conversación.

Campos:
lastAssistantQuestion
lastUserMessages

Ejemplo:

lastAssistantQuestion:
"A qué hora quieres el recordatorio"

lastUserMessages:
["Quiero crear un recordatorio","Ir al gimnasio"]

Esto permite mantener contexto entre mensajes.

================================================================
SESIÓN LÓGICA
=============

Actualmente se utiliza conversationId como identificador de sesión.
Esto actúa como puente hasta implementar una relación directa con AgentSession.

================================================================
FLUJO DE PROCESAMIENTO
======================

Flujo completo de un mensaje:

1. WhatsApp envía mensaje al webhook
2. El webhook guarda el mensaje
3. El webhook llama a /api/crussader-assistant/ai-reply
4. ai-reply ejecuta Intake

Dentro de ai-reply:

* se guarda el mensaje en memoria de sesión
* se carga el estado de la conversación
* se ejecuta translateUserIntent
* se genera un log estructurado
* se ejecuta assistantPipeline
* se envía respuesta al usuario

================================================================
LOG DE DEPURACIÓN
=================

El sistema imprime en consola:

ASSISTANT SESSION DEBUG

Incluye:
conversationId
incomingText
sessionState
translatedIntent

Esto permite ver exactamente cómo el sistema interpreta cada mensaje.

================================================================
COMPATIBILIDAD CON SISTEMA ANTIGUO
==================================

El archivo antiguo sessionMemory.ts no se modificó para evitar romper partes del sistema.

El nuevo sistema usa assistantSessionMemory.ts.
Esto permite migrar progresivamente.

================================================================
ESTADO ACTUAL
=============

Actualmente el sistema ya puede:

* interpretar intención
* mantener contexto básico
* almacenar memoria de sesión
* estructurar mensajes del usuario
* preparar acciones futuras

================================================================
PENDIENTE DE IMPLEMENTAR
========================

Todavía falta implementar:

* motor de acciones completo
* resolución automática de campos faltantes
* cierre automático de sesión
* detección de cambio de tema
