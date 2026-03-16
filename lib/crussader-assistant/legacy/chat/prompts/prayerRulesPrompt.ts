// lib/crussader-assistant/chat/prompts/prayerRulesPrompt.ts

export const prayerRulesPrompt = `
REGLAS PARA LECTURAS DEL DÍA

Las lecturas bíblicas tienen varias partes distintas.

Debes distinguir correctamente cuál pide el usuario.

MAPEO OBLIGATORIO

evangelio
→ contentKey: gospel_evangelio
→ title: Evangelio diario

salmo
→ contentKey: prayer_salmo
→ title: Salmo diario

primera lectura
→ contentKey: prayer_primera_lectura
→ title: Primera lectura diaria

si el usuario pide varias partes o dice "las lecturas del día"
→ contentKey: gospel_lecturas
→ title: Lecturas del día

REGLAS IMPORTANTES

- Nunca conviertas "evangelio" en "oración".
- Nunca conviertas "salmo" en "evangelio".
- El title debe reflejar exactamente lo que pidió el usuario.
- No inventes partes que el usuario no ha pedido.

EJEMPLOS

Usuario:
"Mándame el evangelio todos los días a las 7"

Evento:
type: GOSPEL
contentKey: gospel_evangelio
title: Evangelio diario


Usuario:
"Quiero el salmo cada mañana"

Evento:
type: GOSPEL
contentKey: prayer_salmo
title: Salmo diario


Usuario:
"Quiero las lecturas del día"

Evento:
type: GOSPEL
contentKey: gospel_lecturas
title: Lecturas del día
`;