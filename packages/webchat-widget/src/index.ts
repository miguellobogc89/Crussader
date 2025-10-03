// Webchat Crussader — Widget conectado a backend (site + session + messages + bootstrap)
export {};

declare global {
  interface Window {
    crussaderChat?: (...args: any[]) => void;
    __crussaderChatLoaded?: boolean;
    __CRUSSADER_API_BASE__?: string; // opcional si sirves el API en otro dominio
  }
}

(() => {
  if (typeof window === "undefined") return;
  if (window.__crussaderChatLoaded) return;
  window.__crussaderChatLoaded = true;

  const queue: any[] = [];
  window.crussaderChat = (...args: any[]) => queue.push(args);

  // ===== Helpers =====
  function ready(fn: () => void) {
    if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(fn, 0);
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function apiBase(path: string) {
    const base = window.__CRUSSADER_API_BASE__ || "";
    return base + path;
  }

  ready(() => {
    // === 0) Script & key ===
    const currentScript =
      document.currentScript ||
      document.querySelector<HTMLScriptElement>('script[src*="wc.js"]');
    const publicKey = currentScript?.getAttribute("data-key") || "demo-public-key-123"; // <-- usa tu key real

    // === Estado local del widget ===
    let siteId: string | null = null;
    let sessionId: string | null = null;

    // === API ===
    const API = {
      async bootstrap(key: string) {
        const r = await fetch(apiBase(`/api/webchat/bootstrap?key=${encodeURIComponent(key)}`));
        if (!r.ok) throw new Error("bootstrap error");
        return r.json() as Promise<{
          ok: boolean;
          allowPrivate: boolean;
          site: { id: string; settings?: any; name?: string };
          user: { id: string; name: string | null; email: string | null } | null;
          company: { name: string | null; plan: string | null } | null;
          counts: { locations: number } | null;
          billing?: { hasStripe?: boolean } | null;
          responseSettings: { configured: boolean; updatedAt?: string | null } | null;
          debug?: any;
        }>;
      },
      sessionLSKey(key: string) {
        return `crussader:webchat:session:${key}`;
      },
      readSessionFromLS(key: string) {
        try {
          return JSON.parse(localStorage.getItem(API.sessionLSKey(key)) || "null");
        } catch {
          return null;
        }
      },
      writeSessionToLS(key: string, value: any) {
        try {
          localStorage.setItem(API.sessionLSKey(key), JSON.stringify(value));
        } catch {}
      },
      async ensureSessionByKey(key: string) {
        const existing = API.readSessionFromLS(key);
        let visitorId = existing?.visitorId || (crypto?.randomUUID?.() ?? String(Date.now()));
        if (existing?.sessionId && existing?.siteId) {
          siteId = existing.siteId;
          sessionId = existing.sessionId;
          return { siteId: existing.siteId, sessionId: existing.sessionId };
        }
        const r = await fetch(apiBase(`/api/webchat/sessions`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            visitorId,
            meta: { ua: navigator.userAgent, lang: navigator.language, ref: document.referrer },
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "session error");
        API.writeSessionToLS(key, { visitorId, sessionId: j.sessionId, siteId: j.siteId });
        siteId = j.siteId;
        sessionId = j.sessionId;
        return { siteId, sessionId };
      },
      async sendUserMessage(text: string) {
        if (!siteId || !sessionId) throw new Error("No session");
        const r = await fetch(apiBase(`/api/webchat/messages`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, sessionId, role: "USER", text }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "send error");
        return j as { ok: true; messageId: string; botMessage?: { text: string } };
      },
    };

    // === 1) Host + Shadow DOM + UI ===
    const host = document.createElement("div");
    host.id = "crussader-chat-host";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.bottom = "20px";
    host.style.right = "20px";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });

    const color = "#7c3aed";
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .btn { width:56px; height:56px; border-radius:9999px; display:grid; place-items:center; background:${color};
             color:#fff; border:none; box-shadow:0 8px 24px rgba(0,0,0,.18); cursor:pointer; }
      .panel { position:fixed; right:0; bottom:86px; width:min(360px,90vw); height:520px; background:#fff;
               border-radius:16px; box-shadow:0 16px 48px rgba(0,0,0,.16); border:1px solid rgba(0,0,0,.06);
               display:none; overflow:hidden; }
      .header { height:56px; background:${color}; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font:600 14px system-ui,sans-serif; }
      .body { display:flex; flex-direction:column; height:calc(100% - 56px); background:#fafafa; }
      .msgs { flex:1; overflow:auto; padding:12px; font:14px/1.4 system-ui,sans-serif; color:#111; }
      .row { margin:8px 0; display:flex; }
      .row.user { justify-content:flex-end; }
      .bubble { max-width:80%; padding:10px 12px; border-radius:12px; border:1px solid #e5e7eb; background:#fff; white-space:pre-wrap; }
      .row.user .bubble { background:#eef2ff; }
      .input { display:flex; gap:8px; padding:10px; background:#fff; border-top:1px solid #eee; }
      .input input { flex:1; border:1px solid #e5e7eb; border-radius:10px; padding:10px; font:14px system-ui,sans-serif; }
      .input button { background:${color}; color:#fff; border:none; padding:10px 14px; border-radius:10px; cursor:pointer; }
      .close { background:rgba(255,255,255,.2); color:#fff; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; }
    `;
    shadow.appendChild(style);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.setAttribute("aria-label", "Abrir chat");
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12c0 4.418-4.03 8-9 8-1.003 0-1.966-.146-2.86-.416L3 20l1.52-4.28C4.191 14.79 4 13.915 4 13c0-4.418 4.03-8 9-8s9 3.582 9 7z"
        stroke="white" stroke-width="1.5" fill="none"/></svg>`;
    shadow.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="header">
        <div>Chat con Crussader</div>
        <button class="close">Cerrar</button>
      </div>
      <div class="body">
        <div class="msgs" id="msgs"></div>
        <div class="input">
          <input id="msgInput" placeholder="Escribe tu mensaje..." />
          <button id="sendBtn">Enviar</button>
        </div>
      </div>
    `;
    shadow.appendChild(panel);

    const msgs = panel.querySelector("#msgs") as HTMLDivElement;
    const input = panel.querySelector("#msgInput") as HTMLInputElement;
    const send = panel.querySelector("#sendBtn") as HTMLButtonElement;
    const close = panel.querySelector(".close") as HTMLButtonElement;

    let isOpen = false;
    function open() { if (!isOpen) { panel.style.display = "block"; isOpen = true; } }
    function closePanel() { if (isOpen) { panel.style.display = "none"; isOpen = false; } }

    function addMsg(role: "user" | "bot", text: string) {
      const row = document.createElement("div");
      row.className = "row " + role;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    btn.addEventListener("click", () => (isOpen ? closePanel() : open()));
    close.addEventListener("click", closePanel);

    // === 2) Inicialización: bootstrap + asegura sesión ===
    (async () => {
      try {
        const boot = await API.bootstrap(publicKey);
        siteId = boot.site.id;

        await API.ensureSessionByKey(publicKey);

        // Saludo:
        if (boot.allowPrivate && boot.user) {
          // Panel (usuario logado y perteneciente a la misma company)
          const name = boot.user.name || boot.user.email || "usuario";
          const plan = boot.company?.plan ?? "free";
          const locs = boot.counts?.locations ?? 0;
          const rs = boot.responseSettings?.configured ? "✅ voz de marca configurada" : "⚠️ voz de marca sin configurar";
          addMsg("bot", `¡Hola ${name}! 👋`);
          addMsg("bot", `Estás en ${boot.company?.name ?? "tu empresa"} · plan: ${plan} · ubicaciones: ${locs} · ${rs}.`);
          addMsg("bot", `¿En qué te ayudo? Puedo guiarte para configurar el webchat o tus respuestas.`);
        } else {
          // Landing (anónimo)
          const greeting = boot.site?.settings?.greeting as string | undefined;
          if (greeting) { addMsg("bot", greeting); }
        }
      } catch (err) {
        console.error("[webchat] init error:", err);
      }
    })();

    // === 3) Envío de mensajes ===
    async function handleSend() {
      const v = (input.value || "").trim();
      if (!v) return;
      addMsg("user", v);
      input.value = "";
      try {
        const res = await API.sendUserMessage(v);
        if (res?.botMessage?.text) addMsg("bot", res.botMessage.text);
      } catch (err) {
        console.error("[webchat] send error:", err);
        addMsg("bot", "⚠️ No he podido enviar tu mensaje ahora mismo.");
      }
    }

    send.addEventListener("click", handleSend);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

    // === 4) API pública simple ===
    function publicApi(cmd: string, payload?: any) {
      switch (cmd) {
        case "open": open(); break;
        case "close": closePanel(); break;
        case "identify":
          // MVP: solo mostrar; (si quieres, puedes enviarlo al backend como payload)
          addMsg("bot", "✅ Usuario: " + JSON.stringify(payload));
          break;
        case "message":
          if (payload?.text) addMsg(payload.role === "user" ? "user" : "bot", payload.text);
          break;
        default:
          console.warn("[crussaderChat] comando desconocido:", cmd);
      }
    }

    queue.forEach((args) => publicApi(args[0], args[1]));
    window.crussaderChat = publicApi;

    console.info("[crussaderChat] Widget cargado");
  });
})();
