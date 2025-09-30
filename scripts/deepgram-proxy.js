// scripts/deepgram-proxy.js
// Proxy WSS → Deepgram STT (multi-tenant, con JWT)
// Ejecuta con: ts-node scripts/start-proxy.ts  (que importa este archivo)

import "dotenv/config";
import WebSocket, { WebSocketServer } from "ws";
import { createServer } from "http";
import jwt from "jsonwebtoken";

const {
  DEEPGRAM_API_KEY,
  CRUSSADER_JWT_SECRET,
  PROXY_PORT = "8787",
} = process.env;

if (!DEEPGRAM_API_KEY) {
  console.error("❌ Falta DEEPGRAM_API_KEY");
  process.exit(1);
}
if (!CRUSSADER_JWT_SECRET) {
  console.error("❌ Falta CRUSSADER_JWT_SECRET");
  process.exit(1);
}

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (clientWs, req) => {
  // 1) Validar token ?token=...
  const url = new URL(req.url || "", "http://localhost");
  const token = url.searchParams.get("token");
  let claims = null;
  try {
    claims = jwt.verify(token || "", CRUSSADER_JWT_SECRET);
  } catch {
    clientWs.close(4001, "token inválido");
    return;
  }

  // 2) Conectar a Deepgram (usa Opus 48k desde navegador)
  //    Si tu front manda MediaRecorder (default Opus 48k), NO transcodifiques: encoding=opus&sample_rate=48000
  const dgUrl =
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-2" +
    "&language=es" +
    "&encoding=opus" +
    "&sample_rate=48000" +
    "&interim_results=true" +
    "&smart_format=true";

  const dgWs = new WebSocket(dgUrl, {
    headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
  });

  let aliveClient = true;
  let aliveDeepgram = false;

  const pingClient = setInterval(() => {
    if (!aliveClient) return clientWs.terminate();
    aliveClient = false;
    try {
      clientWs.ping();
    } catch {}
  }, 15000);

  const pingDeepgram = setInterval(() => {
    if (!aliveDeepgram) return dgWs.terminate();
    aliveDeepgram = false;
    try {
      dgWs.ping();
    } catch {}
  }, 15000);

  clientWs.on("pong", () => (aliveClient = true));
  dgWs.on("pong", () => (aliveDeepgram = true));

  dgWs.on("open", () => {
    aliveDeepgram = true;
    console.log("🔗 Proxy conectado a Deepgram", {
      companyId: claims?.companyId,
      agentId: claims?.agentId,
    });
  });

  dgWs.on("message", (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  dgWs.on("error", (err) => {
    console.error("❌ Error WS Deepgram:", err?.message || err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, "Deepgram error");
    }
  });

  dgWs.on("close", () => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
  });

  clientWs.on("message", (msg) => {
    // Reenvía audio binario/JSON al WS de Deepgram
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.send(msg);
    }
  });

  clientWs.on("error", (err) => {
    console.error("❌ Error WS cliente:", err?.message || err);
  });

  clientWs.on("close", () => {
    try {
      dgWs.close();
    } catch {}
    clearInterval(pingClient);
    clearInterval(pingDeepgram);
  });
});

server.listen(Number(PROXY_PORT), () => {
  console.log(`✅ Proxy WSS escuchando en ws://localhost:${PROXY_PORT}`);
});
