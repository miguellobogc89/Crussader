"use client";

import { useState } from "react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

interface UsePreviewResponseOptions {
  review: { content: string };
  settings: ResponseSettings;
}

export interface PreviewResponseData {
  result: string;
  full: string;
  system: string;
  user: string;
  model: string;
  temperature: number;
  targetChars: number;
  applied: Record<string, any>;
}

interface UsePreviewResponseResult {
  loading: boolean;
  error: string | null;
  data: PreviewResponseData | null;
  fetchResponse: () => Promise<void>;
}

export function usePreviewResponse(
  opts: UsePreviewResponseOptions
): UsePreviewResponseResult {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PreviewResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchResponse() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/responses/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: opts.review,
          settings: opts.settings,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "preview_failed");
      }

      setData({
        result: json.result || "",
        full: json.full || "",
        system: json.system || "",
        user: json.user || "",
        model: json.model || "unknown",
        temperature: json.temperature ?? 0.7,
        targetChars: json.targetChars ?? 400,
        applied: json.applied || {},
      });
    } catch (e: any) {
      setError(e?.message || "preview_failed");
    } finally {
      setLoading(false);
    }
  }

  return { loading, data, error, fetchResponse };
}
