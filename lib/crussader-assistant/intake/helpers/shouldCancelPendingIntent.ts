// lib/crussader-assistant/intake/helpers/shouldCancelPendingIntent.ts
export function shouldCancelPendingIntent(rawUserText: string): boolean {
  const text = rawUserText.trim().toLowerCase();

  const cancelPhrases = [
    "olvídalo",
    "olvidalo",
    "ya no",
    "cancela",
    "cancelar",
    "déjalo",
    "dejalo",
    "da igual",
    "no importa",
    "olvida eso",
    "mejor no"
  ];

  for (const phrase of cancelPhrases) {
    if (text.includes(phrase)) {
      return true;
    }
  }

  return false;
}