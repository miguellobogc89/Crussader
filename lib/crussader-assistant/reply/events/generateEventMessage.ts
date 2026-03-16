// lib/crussader-assistant/reply/events/generateEventMessage.ts
import { openai } from "@/lib/ai"

export async function generateEventMessage(args: {
  reminderText: string
  userName?: string | null
}) {

  const reminderText = String(args.reminderText || "").trim()

  if (!reminderText) {
    return ""
  }

  const userName =
    args.userName && String(args.userName).trim()
      ? String(args.userName).trim()
      : null

  const systemPrompt = `
Eres un asistente personal que envía recordatorios por WhatsApp.

Convierte el recordatorio en una frase natural y amistosa.

Reglas:
- Usa emojis adecuados según la acción
- Si hay nombre del usuario puedes usarlo
- No inventes información
- Máximo una frase

Ejemplos:

"llamar a María"
→ 📞 Miguel, recuerda que tienes que llamar a María.

"ir al gimnasio"
→ 💪 Miguel, es hora de ir al gimnasio.

"despertarme"
→ ⏰ Miguel, es hora de despertarse.
`

  const userPrompt = `
Recordatorio: "${reminderText}"
Nombre del usuario: ${userName || "desconocido"}

Genera el mensaje.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  })

  return response.choices?.[0]?.message?.content?.trim() || reminderText
}