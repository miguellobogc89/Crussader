"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";

export default function DebugReviewsSample() {
  const [json, setJson] = useState<any>(null);

  useEffect(() => {
    fetch("/api/debug/reviews-sample", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        console.log("[DebugReviewsSample] /api/debug/reviews-sample ->", j);
        setJson(j);
      })
      .catch((e) => setJson({ ok: false, error: String(e) }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DEBUG · /api/debug/reviews-sample</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs overflow-auto max-h-[400px] bg-muted/30 border rounded p-2">
{JSON.stringify(json, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
