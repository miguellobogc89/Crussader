// app/api/crussader-assistant/integrations/prayer/daily/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cleanText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&iexcl;/g, "¡")
    .replace(/&iquest;/g, "¿")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPart(html: string, part: string): string {
  if (part === "primera_lectura") {
    const match = html.match(
      /<h2[^>]*>\s*Primera Lectura\s*<\/h2>([\s\S]*?)Palabra de Dios/i
    );

    if (!match) {
      return "";
    }

    return cleanText(match[1] + "\n\nPalabra de Dios");
  }

  if (part === "salmo") {
    const match = html.match(
      /<h2[^>]*>\s*Salmo\s*<\/h2>([\s\S]*?)<h2[^>]*>\s*Evangelio\s*<\/h2>/i
    );

    if (!match) {
      return "";
    }

    return cleanText(match[1]);
  }

  if (part === "evangelio") {
    const match = html.match(
      /<h2[^>]*>\s*Evangelio\s*<\/h2>([\s\S]*?)Palabra del Señor/i
    );

    if (!match) {
      return "";
    }

    return cleanText(match[1] + "\n\nPalabra del Señor");
  }

  return "";
}

function splitReferenceAndText(part: string, text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      title: part,
      reference: "",
      text: "",
    };
  }

  const firstLine = lines[0];

  if (part === "evangelio") {
    const match = firstLine.match(/según\s+san\s+(.+?)\s*\((.*?)\):?$/i);

    const evangelist = match ? match[1].trim() : "";
    const passage = match ? match[2].trim() : "";

    return {
      title: "Evangelio",
      reference: evangelist !== "" ? evangelist + " " + passage : passage,
      text,
    };
  }

  if (part === "primera_lectura") {
    const match = firstLine.match(/Lectura de\s+.+?\s+de\s+(.+?)\s*\((.*?)\):?$/i);

    const book = match ? match[1].trim() : "";
    const passage = match ? match[2].trim() : "";

    return {
      title: "Primera Lectura",
      reference: book !== "" ? book + " " + passage : passage,
      text,
    };
  }

  if (part === "salmo") {
    return {
      title: "Salmo",
      reference: firstLine,
      text,
    };
  }

  return {
    title: part,
    reference: "",
    text,
  };
}

export async function GET(req: NextRequest) {
  try {
    const part = req.nextUrl.searchParams.get("part") ?? "evangelio";

    const res = await fetch(
      "https://www.ciudadredonda.org/evangelio-lecturas-hoy/",
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,application/xhtml+xml",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo obtener la liturgia. Status ${res.status}`,
        },
        { status: 500 }
      );
    }

    const html = await res.text();

    if (part === "all") {
      const primeraLectura = splitReferenceAndText(
        "primera_lectura",
        extractPart(html, "primera_lectura")
      );

      const salmo = splitReferenceAndText(
        "salmo",
        extractPart(html, "salmo")
      );

      const evangelio = splitReferenceAndText(
        "evangelio",
        extractPart(html, "evangelio")
      );

      return NextResponse.json({
        ok: true,
        source: "ciudad-redonda",
        part: "all",
        data: {
          primera_lectura: primeraLectura,
          salmo,
          evangelio,
        },
      });
    }

    const rawText = extractPart(html, part);
    const parsed = splitReferenceAndText(part, rawText);

    return NextResponse.json({
      ok: true,
      source: "ciudad-redonda",
      part,
      title: parsed.title,
      reference: parsed.reference,
      text: parsed.text,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}