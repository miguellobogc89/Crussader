// app/api/stt/debug/projects/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

async function tryListProjects(authHeader: string) {
  const res = await fetch("https://api.deepgram.com/v1/projects", {
    method: "GET",
    headers: { Authorization: authHeader },
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  return { ok: res.ok, status: res.status, json };
}

export async function GET() {
  const KEY = process.env.DEEPGRAM_API_KEY;
  if (!KEY) return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });

  const attempts = [
    { name: "raw",     header: KEY },
    { name: "Token",   header: `Token ${KEY}` },
    { name: "Bearer",  header: `Bearer ${KEY}` },
  ];

  const results: any[] = [];
  for (const a of attempts) {
    // eslint-disable-next-line no-await-in-loop
    const r = await tryListProjects(a.header);
    results.push({ mode: a.name, ok: r.ok, status: r.status, sample: r.json?.projects ? r.json.projects.map((p: any) => ({ id: p.project_id || p.id, name: p.name })).slice(0, 3) : r.json });
    if (r.ok) break;
  }

  return NextResponse.json({ tried: results });
}
