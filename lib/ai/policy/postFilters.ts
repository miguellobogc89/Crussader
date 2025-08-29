export function clampLength(text: string, maxChars = 900) {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

export function sanitize(text: string) {
  // ejemplo simple: elimina posibles números largos (teléfonos)
  return text.replace(/\b\d{9,}\b/g, "");
}

export function applyPostFilters(text: string) {
  return sanitize(clampLength(text));
}
