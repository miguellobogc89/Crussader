import type { ResponseSettings } from "@/app/schemas/response-settings";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(\+?\d[\s-]?){6,}/g;
const COMPENSATION_ES = /(descuento|vale|compensaci[oó]n|reembolso|dinero|bono)/gi;

type Opts = {
  maxChars: number;
  lang: "es" | "en" | "pt";
  signature?: string | null;
  customerName?: string | null;
};

export function sanitizeAndConstrain(text: string, cfg: ResponseSettings, opts: Opts) {
  let out = (text || "").trim();

  // 1) Frases prohibidas
  if (cfg.bannedPhrases?.length) {
    for (const phrase of cfg.bannedPhrases) {
      if (!phrase) continue;
      const re = new RegExp(escapeRegExp(phrase), "gi");
      out = out.replace(re, "");
    }
  }

  // 2) Datos personales
  if (cfg.avoidPersonalData) {
    out = out.replace(EMAIL, "");
    out = out.replace(PHONE, "");
  }

  // 3) Compensaciones públicas (ES)
  if (cfg.noPublicCompensation && opts.lang === "es") {
    out = out.replace(COMPENSATION_ES, " ");
  }

  // 4) Evitar saludo con el nombre de la firma (p.ej., "Gracias, Miguel")
  const sigName = (opts.signature ?? cfg.standardSignature ?? "").trim().replace(/^—\s*/, "");
  if (sigName) {
    const reWrong = new RegExp(`^(\\s*[¡!]?(hola|gracias)[,!\\s]+)${escapeRegExp(sigName)}\\b`, "i");
    if (reWrong.test(out)) {
      const firstCustomer =
        (opts.customerName ?? "").split(/\s+/)[0] ||
        (opts.lang === "pt" ? "cliente" : opts.lang === "en" ? "customer" : "cliente");
      out = out.replace(reWrong, (_m, prefix) => `${prefix}${firstCustomer}`);
    }
  }

  // 5) Longitud: recortaremos dejando hueco para la firma
  const normalizedSig = sigName ? (sigName.startsWith("—") ? sigName : `— ${sigName}`) : "";
  const sigLen = normalizedSig ? normalizedSig.length + 1 /* salto de línea */ : 0;
  const bodyLimit = Math.max(20, (opts.maxChars ?? 300) - sigLen);

  if (out.length > bodyLimit) {
    out = out.slice(0, bodyLimit).trim().replace(/[“”"']$/g, "").trim();
  }

  // 6) Añadir firma al final si procede
  if (normalizedSig) {
    const endsWithSig = out.trim().endsWith(normalizedSig);
    if (!endsWithSig) {
      out = `${out.trim()}\n${normalizedSig}`;
    }
  }

  // 7) Limpieza final
  out = out.replace(/\s{2,}/g, " ").replace(/\s+\n/g, "\n").trim();
  return out;
}

// Compat con engine legacy
export function applyPostFilters(text: string): string;
export function applyPostFilters(text: string, cfg?: ResponseSettings, opts?: Opts): string;
export function applyPostFilters(text: string, cfg?: ResponseSettings, opts?: Opts): string {
  if (!cfg || !opts) return (text || "").toString().trim();
  return sanitizeAndConstrain(text, cfg, opts);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
