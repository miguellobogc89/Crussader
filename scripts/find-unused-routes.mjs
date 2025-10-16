// scripts/find-unused-routes.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, "app", "api");
const SRC_DIRS = [
  "app", "components", "lib", "hooks", "pages", "server", "react-email-starter",
].map(p => path.join(ROOT, p)).filter(fs.existsSync);

const EXTERNAL_HINTS = [
  "webhook", "callback", "oauth", "auth", "google", "realtime", "webchat", "whatsapp", "tel",
  "connect", "integrations", "session"
];

function walkFiles(dir, exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) stack.push(p);
      else if (exts.includes(path.extname(f))) out.push(p);
    }
  }
  return out;
}

function listApiRoutes() {
  const files = walkFiles(API_DIR, [".ts", ".js"]);
  return files
    .filter(f => /[\\/]route\.(ts|js)$/.test(f))
    .map(file => {
      // app/api/.../route.ts  ->  /api/...
      const rel = file.replace(ROOT + path.sep, "").replace(/\\/g, "/");
      const apiPath = rel
        .replace(/^app\//, "/")
        .replace(/\/route\.(ts|js)$/, "")
        .replace(/^\/api/, "/api"); // ensure leading /api
      // Para matching en código, quitamos segmentos dinámicos [id]
      const staticKey = apiPath.replace(/\/\[[^/]+\]/g, "");
      const isPossiblyExternal = EXTERNAL_HINTS.some(k => apiPath.includes(k));
      return { file: rel, apiPath, staticKey, isPossiblyExternal };
    });
}

function fileContains(p, needles) {
  try {
    const txt = fs.readFileSync(p, "utf8");
    return needles.some(n => txt.includes(n));
  } catch {
    return false;
  }
}

function findReferences(routes) {
  const allSrcFiles = SRC_DIRS.flatMap(d => walkFiles(d));
  const results = routes.map(r => {
    // Buscamos "/api/xxxx" y también `api/xxxx` por si hay baseURL
    const needles = [
      `"${r.apiPath}"`, `'${r.apiPath}'`, r.apiPath, // exacto
      `"${r.staticKey}"`, `'${r.staticKey}'`, r.staticKey, // sin dinámicos
      `fetch("${r.apiPath}`, `fetch('${r.apiPath}`, `fetch(${r.apiPath}`,
      `fetch("${r.staticKey}`, `fetch('${r.staticKey}`, `fetch(${r.staticKey}`,
      `axios.get("${r.apiPath}`, `axios.post("${r.apiPath}`, `axios(${r.apiPath}`,
      `useSWR("${r.apiPath}`, `useSWR('${r.apiPath}`, `useSWR(${r.apiPath}`,
      `useSWR("${r.staticKey}`, `useSWR('${r.staticKey}`, `useSWR(${r.staticKey}`,
    ];
    const referenced = allSrcFiles.some(f => fileContains(f, needles));
    return { ...r, referenced };
  });
  return results;
}

const routes = listApiRoutes();
const results = findReferences(routes);

const referenced = results.filter(r => r.referenced);
const possiblyExternal = results.filter(r => !r.referenced && r.isPossiblyExternal);
const noRefs = results.filter(r => !r.referenced && !r.isPossiblyExternal);

console.log(`\n=== API routes scan ===`);
console.log(`Total route handlers: ${results.length}`);
console.log(`Referenced in repo:   ${referenced.length}`);
console.log(`Possibly external:    ${possiblyExternal.length}`);
console.log(`No references found:  ${noRefs.length}\n`);

if (possiblyExternal.length) {
  console.log("— Possibly external (check webhooks/callbacks/OAuth/voice/etc):");
  for (const r of possiblyExternal) console.log(`  ${r.apiPath}   ← ${r.file}`);
  console.log("");
}

if (noRefs.length) {
  console.log("— No references found (candidatas a borrar o revisar):");
  for (const r of noRefs) console.log(`  ${r.apiPath}   ← ${r.file}`);
  console.log("");
}
