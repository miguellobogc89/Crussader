// lib/whatsapp/configuration/phone.ts
export type PhoneValidation =
  | { ok: true; e164: string; digits: string; countryCode: string }
  | { ok: false; reason: string };

function onlyDigits(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

/**
 * Normaliza a E.164 (con '+') y valida formato básico.
 * - Si el usuario mete 9 dígitos, asumimos ES (34)
 * - Si mete 11 dígitos empezando por 34, asumimos ES
 * - Si mete 10-15 dígitos (sin +), lo aceptamos como internacional (sin suposiciones)
 */
export function validatePhoneE164(raw: string): PhoneValidation {
  const d = onlyDigits(raw);

  if (d.length === 0) return { ok: false, reason: "Número vacío." };

  // ES: 9 dígitos nacionales (sin prefijo)
  if (d.length === 9) {
    // reglas ES mínimas: móvil suele empezar por 6/7, fijo por 8/9
    const first = d[0];
    if (first !== "6" && first !== "7" && first !== "8" && first !== "9") {
      return { ok: false, reason: "Formato ES no válido (9 dígitos, pero prefijo raro)." };
    }

    const digits = `34${d}`;
    return { ok: true, e164: `+${digits}`, digits, countryCode: "34" };
  }

  // ES: ya con 34 delante
  if (d.length === 11 && d.startsWith("34")) {
    const national = d.slice(2);
    const first = national[0];
    if (first !== "6" && first !== "7" && first !== "8" && first !== "9") {
      return { ok: false, reason: "Formato ES no válido (34 + número con prefijo raro)." };
    }

    return { ok: true, e164: `+${d}`, digits: d, countryCode: "34" };
  }

  // Genérico internacional: E.164 permite hasta 15 dígitos (sin contar '+')
  if (d.length < 10 || d.length > 15) {
    return { ok: false, reason: "Longitud inválida (E.164 requiere 10–15 dígitos)."};
  }

  // Evita country code 0xx (muy típico de meter prefijo de salida)
  if (d.startsWith("00")) {
    return { ok: false, reason: "No uses 00. Usa prefijo internacional sin 00 (ej: +34...)." };
  }

  // Extra: no permitimos empezar por 0 en E.164
  if (d[0] === "0") {
    return { ok: false, reason: "E.164 no puede empezar por 0." };
  }

  const countryCode = d.slice(0, 3); // aproximación (no intentamos parsear país)
  return { ok: true, e164: `+${d}`, digits: d, countryCode };
}

/**
 * Para APIs que quieren dígitos sin '+' (WhatsApp Cloud suele aceptar sin '+')
 */
export function toWaDigits(raw: string): PhoneValidation {
  const r = validatePhoneE164(raw);
  if (!r.ok) return r;
  return { ok: true, e164: r.e164, digits: r.digits, countryCode: r.countryCode };
}