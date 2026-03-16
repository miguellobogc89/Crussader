EVENTS ORCHESTRATOR
handleEventRequest()

Este módulo es el "cerebro" del sistema de eventos.

Recibe una petición estructurada desde el chat (ya interpretada por la IA)
y decide qué acción ejecutar sobre los eventos del usuario.

El chat NO decide la lógica de eventos.
El chat solo pasa la petición.

Metáfora:
Chat = camarero
Events = cocina


ENTRADAS ACEPTADAS

action: "list"
Significado:
El usuario quiere ver sus envíos activos.

Actuación:
Se listan los eventos activos del usuario.


action: "list_paused"
Significado:
El usuario quiere ver los envíos pausados.

Actuación:
Se listan los eventos pausados.


action: "pause"
Significado:
El usuario quiere parar un envío automático.

Actuación:
Se pausa el evento indicado.


action: "resume"
Significado:
El usuario quiere reactivar un envío pausado.

Actuación:
Se reactiva el evento indicado.


action: "update"
Significado:
El usuario quiere modificar un evento existente.

Actuación:
Se actualiza el evento con los nuevos datos.


action: "create"
Significado:
El usuario quiere crear un envío automático nuevo.

Actuación:
Se crea un nuevo evento.


action: "auto"
Significado:
El usuario quiere programar un envío pero no sabemos
si hay que crear uno nuevo o modificar uno existente.

Actuación:

1. Revisar eventos activos del mismo tipo/contenido.

   - Si existe uno activo:
       • Si la configuración es igual → NO_CHANGE
       • Si la configuración cambia → UPDATE_EVENT

2. Si no hay activos, revisar eventos pausados.

   - Si existe uno pausado:
       • Si la configuración es igual → RESUME_EVENT
       • Si cambia → UPDATE + REACTIVATE

3. Si no existe ninguno:

   → CREATE_EVENT


SALIDAS POSIBLES

DONE
La operación se ejecutó correctamente.

NO_CHANGE
El evento ya estaba configurado igual.

NEEDS_INFO
Falta información para ejecutar la acción.

NEEDS_DECISION
Hay varios eventos similares y el sistema no puede decidir.


REGLA ACTUAL DEL SISTEMA

No se piden confirmaciones al usuario.

Si la acción es segura → se ejecuta automáticamente.


FUTURO

Los eventos se basarán en un catálogo de contenidos.

Ejemplo:

catalog:
- gospel_daily
- news_morning
- news_evening

Esto permitirá gestionar los eventos como si fueran
"platos de un menú".