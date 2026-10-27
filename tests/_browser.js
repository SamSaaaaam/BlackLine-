/* Outils communs des tests navigateur : petit serveur statique local (aucun réseau extérieur) + Chromium (Playwright préinstallé).
   Toute requête vers Supabase est interceptée : soit simulée (mock), soit coupée. Aucune requête ne sort de la machine. */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain" };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html";
      const f = path.join(ROOT, path.normalize(p)); if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end("404"); } r.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); });
    });
    srv.listen(0, "127.0.0.1", () => res({ srv, url: "http://127.0.0.1:" + srv.address().port }));
  });
}
/* sauvegarde de départ : joueur qui revient (réglages faits, didacticiel fini) */
function saveEnv(extra) {
  const e = Object.assign({ v: 13, savedAt: Date.now(), rev: 0, owner: "test", settings: { setup: true, tutorial: "done", name: "Testeur", opscene: "off" }, state: { money: 5000, total: 50000, t: 3600 } }, extra || {});
  return JSON.stringify(e);
}
async function launch() { const { chromium } = require("playwright"); return chromium.launch(); }
/* ouvre le jeu ; opts : { w, h, save (texte), sb: function(route, url) | "abort", cfg: {url, anonKey} | null (non configuré), motion } */
async function open(browser, base, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1366, height: opts.h || 768 }, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const save = opts.save === undefined ? saveEnv() : opts.save;
  if (save) await ctx.addInitScript(s => { try { if (!sessionStorage.getItem("__seeded")) { localStorage.setItem("blackline.save.v1", s); sessionStorage.setItem("__seeded", "1"); } } catch (e) {} }, save);
  const p = await ctx.newPage(); p.errors = []; p.requests = [];
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p.errors.push(m.text()); });
  p.on("pageerror", e => p.errors.push(e.message));
  p.on("request", r => { if (!r.url().startsWith(base)) p.requests.push({ url: r.url(), method: r.method(), headers: r.headers() }); });
  if (opts.cfg !== undefined) await p.route(/config-classement\.js$/, r => r.fulfill({ contentType: "text/javascript", body: "(function(r){var BL=r.BL=r.BL||{};BL.lbConfig=" + JSON.stringify(opts.cfg || { url: "", anonKey: "" }) + ";})(globalThis);" }));
  await p.route(u => !String(u).startsWith(base), async r => { if (typeof opts.sb === "function") return opts.sb(r, r.request().url()); return r.abort(); });
  await p.goto(base + "/index.html" + (opts.query || ""));
  await p.waitForFunction(() => window.BL && BL.main && BL.main.state, null, { timeout: 15000 });
  await p.waitForTimeout(opts.wait || 600);
  return p;
}
/* captures lisibles : masque bulles, bannières et petits messages qui passent par-dessus (n'affecte pas les vérifications) */
async function calm(p) { await p.addStyleTag({ content: "#asst,#np,#toasts,#banner,.nbn,.tutcard,#rwheel{display:none!important}" }); }
async function noHScroll(p) { return p.evaluate(() => { const d = document.documentElement; return d.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1; }); }
/* éléments plus larges que l'écran ou texte plus petit que 12 px dans un conteneur visible */
async function smallText(p, sel) {
  return p.evaluate(s => { const out = []; document.querySelectorAll(s + " *").forEach(e => { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width && r.height && cs.visibility !== "hidden" && parseFloat(cs.fontSize) < 12 && !e.closest(".sr")) out.push(e.className + ":" + cs.fontSize + ":" + e.textContent.trim().slice(0, 20)); }); return out; }, sel);
}
let fails = 0, passes = 0;
function check(cond, msg) { if (cond) { passes++; console.log("  ok  " + msg); } else { fails++; console.log("  ÉCHEC " + msg); } }
function done(name) { console.log((fails ? "ÉCHEC" : "OK") + " " + name + " : " + passes + " vérifications, " + fails + " échec(s)"); process.exitCode = fails ? 1 : 0; }
const WIDTHS = [[1366, 768], [390, 844], [320, 568]];
/* captures : dans shots/ seulement avec SHOTS=1 (livrables) ; sinon dans un dossier temporaire, pour ne jamais écraser les captures validées */
const SHOTS = process.env.SHOTS === "1" ? path.join(ROOT, "shots") : path.join(require("os").tmpdir(), "blackline-shots");
function shotPath(n) { if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS); return path.join(SHOTS, n + ".png"); }
module.exports = { calm, serve, launch, open, saveEnv, noHScroll, smallText, check, done, WIDTHS, shotPath, ROOT };
