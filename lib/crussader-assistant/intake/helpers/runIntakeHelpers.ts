// lib/crussader-assistant/intake/helpers/runIntakeHelpers.ts
export function isCapabilitiesQuestion(raw: string) {
  const text = raw.trim().toLowerCase();

  if (text.includes("qué puedes hacer")) return true;
  if (text.includes("que puedes hacer")) return true;

  if (text.includes("en qué me puedes ayudar")) return true;
  if (text.includes("en que me puedes ayudar")) return true;

  if (text.includes("qué sabes hacer")) return true;
  if (text.includes("que sabes hacer")) return true;

  if (text.includes("dime todo lo que sabes hacer")) return true;

  return false;
}

export function isGeneralInformationQuestion(raw: string) {
  const text = raw.trim().toLowerCase();

  if (!text) return false;

  if (isCapabilitiesQuestion(text)) return false;

  if (text.includes("dame el evangelio")) return false;
  if (text.includes("dame el salmo")) return false;
  if (text.includes("dame la lectura")) return false;
  if (text.includes("dame el rezo")) return false;

  if (text.startsWith("quién ")) return true;
  if (text.startsWith("quien ")) return true;

  if (text.startsWith("qué ")) return true;
  if (text.startsWith("que ")) return true;

  if (text.startsWith("cómo ")) return true;
  if (text.startsWith("como ")) return true;

  if (text.startsWith("cuándo ")) return true;
  if (text.startsWith("cuando ")) return true;

  if (text.startsWith("dónde ")) return true;
  if (text.startsWith("donde ")) return true;

  if (text.startsWith("cuál ")) return true;
  if (text.startsWith("cual ")) return true;

  return false;
}