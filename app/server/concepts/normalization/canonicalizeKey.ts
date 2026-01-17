// app/server/concepts/normalization/canonicalizeKey.ts

/**
 * Convierte un texto libre (display_name, aspect, etc.)
 * en una clave canónica estable y comparable.
 *
 * Objetivos:
 * - Quitar acentos
 * - Pasar a minúsculas
 * - Eliminar stopwords (de, del, la, etc.)
 * - Singularizar de forma básica
 * - Unificar en snake_case
 *
 * Ej:
 *  "Sabor del helado"     → "sabor_helado"
 *  "Sabor de helados"    → "sabor_helado"
 *  "Tiempo de espera"    → "tiempo_espera"
 */

const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "o",
  "en",
  "con",
  "por",
  "para",
  "un",
  "una",
  "unos",
  "unas",
]);

function removeAccents(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Singularización MUY básica y segura (no lingüística completa)
function basicSingularize(word: string): string {
  if (word.endsWith("es") && word.length > 3) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && word.length > 2) {
    return word.slice(0, -1);
  }
  return word;
}

export function canonicalizeKey(input: string): string {
  if (!input) return "";

  const cleaned = removeAccents(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => basicSingularize(w));

  return words.join("_");
}
