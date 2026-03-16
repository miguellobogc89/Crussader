// app/api/crussader-assistant/integrations/web/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/crussader-assistant/integrations/web/providers";
import type { WebProviderName } from "@/lib/crussader-assistant/integrations/web/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidProvider(value: string): value is WebProviderName {
  return value === "wikipedia" || value === "duckduckgo";
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    const lang = req.nextUrl.searchParams.get("lang")?.trim() || "es";
    const providerRaw = req.nextUrl.searchParams.get("provider")?.trim() || "";

    let provider: WebProviderName | undefined = undefined;

    if (providerRaw) {
      if (!isValidProvider(providerRaw)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid provider",
            allowedProviders: ["wikipedia", "duckduckgo"]
          },
          { status: 400 }
        );
      }

      provider = providerRaw;
    }

    const result = await searchWeb({
      query,
      lang,
      provider
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}