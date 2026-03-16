CRUSSADER ASSISTANT
Módulo de eventos
=================

Ruta:
lib/crussader-assistant/actions/events/

Objetivo
--------
Esta carpeta contiene la lógica de negocio de los eventos del asistente.
Un evento es una acción programada para un cliente, como por ejemplo:
- enviar el evangelio,
- mandar noticias,
- lanzar un recordatorio,
- o ejecutar una tarea personalizada.

La responsabilidad de esta carpeta no es “hablar con el usuario”,
sino gestionar correctamente los eventos en base de datos:
crear, buscar, listar, pausar, reanudar y actualizar.

Arquitectura general
--------------------
La carpeta está organizada por acciones concretas.
Cada fichero hace una sola cosa reconocible.

Árbol actual
------------
lib/crussader-assistant/actions/events/
│
├── createEvent.ts
├── findEvent.ts
├── index.ts
├── listEvents.ts
├── listPausedEvents.ts
├── pauseEvent.ts
├── resumeEvent.ts
└── updateEvent.ts


DESCRIPCIÓN DE CADA FICHERO
===========================

1) createEvent.ts
-----------------
Qué hace:
Crea un evento nuevo para un cliente.

Responsabilidad funcional:
- valida los datos mínimos necesarios,
- comprueba límites de eventos activos,
- evita crear duplicados evidentes,
- interpreta el horario recibido,
- calcula la próxima ejecución,
- y guarda el evento en base de datos.

Cuándo se usa:
Cuando el asistente detecta que el usuario quiere programar algo nuevo.

Ejemplos de uso:
- “Envíame el evangelio cada día a las 8”
- “Avísame dentro de dos horas”
- “Mándame noticias del Betis los lunes y viernes”

Notas:
Este archivo contiene una parte importante de la lógica de scheduling:
decide si el evento es puntual o recurrente y prepara `run_at` o `next_run_at`.


2) findEvent.ts
---------------
Qué hace:
Busca un evento concreto ya existente.

Responsabilidad funcional:
- localizar un evento por identificador,
- o localizar uno por criterios como tipo, contentKey o estado,
- para poder operarlo después.

Cuándo se usa:
Cuando otra acción necesita encontrar antes el evento correcto.

Ejemplos de uso:
- antes de actualizar un evento,
- antes de pausarlo,
- antes de reanudarlo,
- o para comprobar si ya existe uno parecido.

Notas:
Es una pieza base del módulo.
No suele ser una acción final para el usuario, sino un apoyo para otras acciones.


3) index.ts
-----------
Qué hace:
Reexporta el módulo de eventos desde un único punto de entrada.

Responsabilidad funcional:
- centralizar las exportaciones,
- evitar imports largos o inconsistentes,
- y dar una API limpia al resto del asistente.

Cuándo se usa:
Cuando otro fichero quiere importar funciones de eventos sin apuntar archivo por archivo.

Ejemplo:
Permite hacer imports desde:
@/lib/crussader-assistant/actions/events

en vez de:
@/lib/crussader-assistant/actions/events/createEvent
@/lib/crussader-assistant/actions/events/updateEvent
etc.

Notas:
No contiene lógica de negocio.
Su valor es organizativo y arquitectónico.


4) listEvents.ts
----------------
Qué hace:
Lista los eventos del cliente.

Responsabilidad funcional:
- devolver los eventos programados,
- normalmente para que la IA o el usuario puedan revisarlos,
- y ofrecer una vista rápida del estado actual del sistema.

Cuándo se usa:
Cuando el usuario pregunta qué tiene programado.

Ejemplos de uso:
- “¿Qué eventos tengo?”
- “Enséñame mis recordatorios”
- “¿Qué tengo activo ahora mismo?”

Notas:
Esta función sirve como base para que la IA tenga contexto antes de pausar,
editar o reanudar un evento.


5) listPausedEvents.ts
----------------------
Qué hace:
Lista solo los eventos que están actualmente en pausa.

Responsabilidad funcional:
- recuperar rápidamente qué eventos no están activos,
- para que la IA pueda reanudarlos o revisarlos sin mezclar con los activos.

Cuándo se usa:
Cuando el usuario pregunta específicamente por lo que está parado,
o cuando la IA necesita saber qué puede reactivar.

Ejemplos de uso:
- “¿Qué tengo pausado?”
- “Reanuda lo que paré ayer”
- “Muéstrame mis eventos detenidos”

Notas:
Este archivo mejora mucho la claridad del módulo,
porque separa el listado general del listado operativo de eventos pausados.


6) pauseEvent.ts
----------------
Qué hace:
Pone un evento en pausa.

Responsabilidad funcional:
- localizar el evento correcto,
- cambiar su estado a pausado,
- y evitar que siga ejecutándose mientras esté detenido.

Cuándo se usa:
Cuando el usuario quiere parar temporalmente un evento, pero no borrarlo.

Ejemplos de uso:
- “Pausa el evangelio”
- “Deja de enviarme noticias por ahora”
- “Para ese recordatorio”

Notas:
La idea funcional de pausa es:
el evento sigue existiendo, pero no corre.


7) resumeEvent.ts
-----------------
Qué hace:
Reanuda un evento pausado.

Responsabilidad funcional:
- localizar un evento que estaba detenido,
- volver a activarlo,
- y dejar preparada su siguiente ejecución.

Cuándo se usa:
Cuando el usuario quiere recuperar un evento que había pausado.

Ejemplos de uso:
- “Reanuda el evangelio”
- “Vuelve a activar las noticias”
- “Recupera ese recordatorio”

Notas:
La idea funcional de resume es:
el evento no se crea de nuevo, sino que vuelve a vivir el mismo registro existente.


8) updateEvent.ts
-----------------
Qué hace:
Modifica un evento existente.

Responsabilidad funcional:
- localizar el evento correcto,
- actualizar campos como título, prompt, contentKey, horario o estado,
- recalcular la programación si cambia el schedule,
- y guardar los nuevos valores.

Cuándo se usa:
Cuando el usuario quiere cambiar algo de un evento ya creado.

Ejemplos de uso:
- “Ponlo a las 9 en vez de a las 8”
- “Ahora solo los martes”
- “Cámbialo por noticias generales”
- “Haz que sea puntual”

Notas:
Es la pieza de edición del módulo.
No crea un evento nuevo; transforma uno existente.


LECTURA FUNCIONAL DEL MÓDULO
============================

Si lo miras como flujo, esta carpeta cubre este ciclo:

1. createEvent.ts
   Crear evento nuevo

2. listEvents.ts / listPausedEvents.ts
   Revisar qué existe

3. findEvent.ts
   Localizar el correcto

4. pauseEvent.ts
   Pararlo temporalmente

5. resumeEvent.ts
   Volver a activarlo

6. updateEvent.ts
   Modificarlo

7. index.ts
   Exponer todo de forma limpia


MAPA RÁPIDO
===========

Si quiero...
------------

Crear algo nuevo:
- createEvent.ts

Buscar un evento concreto:
- findEvent.ts

Ver todos los eventos:
- listEvents.ts

Ver solo los pausados:
- listPausedEvents.ts

Pausar un evento:
- pauseEvent.ts

Reanudar un evento:
- resumeEvent.ts

Cambiar un evento existente:
- updateEvent.ts

Importar todo desde un solo sitio:
- index.ts


QUÉ NO DEBERÍA HACER ESTA CARPETA
=================================

Esta carpeta no debería encargarse de:
- construir respuestas conversacionales,
- decidir el tono del asistente,
- hablar directamente con OpenAI,
- enviar mensajes por WhatsApp,
- ni interpretar toda la intención del usuario a nivel natural.

Eso pertenece a otras capas del sistema.

Esta carpeta debe mantenerse como capa de negocio de eventos:
clara, predecible y reutilizable.


OBJETIVO ARQUITECTÓNICO
=======================

La dirección correcta de este módulo es esta:

- un archivo por acción clara,
- sin mezclar crear con actualizar,
- sin mezclar pausa con reanudación,
- sin depender de un “upsert gigante”,
- y con imports centralizados desde index.ts.

Eso hace que:
- sea más fácil depurar,
- la IA tenga herramientas más explícitas,
- y el Event Manager crezca de forma limpia.


RESUMEN FINAL
=============

Esta carpeta es el núcleo operativo de los eventos del asistente.

Contiene acciones separadas para:
- crear,
- buscar,
- listar,
- listar pausados,
- pausar,
- reanudar,
- y actualizar.

La filosofía correcta aquí es:
una acción, un archivo, una responsabilidad.