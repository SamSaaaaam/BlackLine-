/* Charge la logique du jeu (sans interface) dans un bac à sable Node : mêmes fichiers, même ordre que index.html, en s'arrêtant avant les scripts d'interface.
   Date.now peut être piloté (horloge simulée) pour les tests de temps. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
function scripts() { return [...fs.readFileSync(path.join(ROOT, "index.html"), "utf8").matchAll(/<script src="([^"]+)"/g)].map(m => m[1]); }
function load(opts) {
  opts = opts || {}; const clock = { now: opts.now || 1.7e12 };
  const FakeDate = function (...a) { return a.length ? new Date(...a) : new Date(clock.now); }; FakeDate.now = () => clock.now; FakeDate.UTC = Date.UTC; FakeDate.parse = Date.parse;
  const store = {}, ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const ctx = { console, Math, JSON, Intl, Date: opts.realDate ? Date : FakeDate, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {}, localStorage: ls, Promise, AbortController, fetch: opts.fetch };
  ctx.globalThis = ctx; vm.createContext(ctx);
  const stop = opts.until || "js/ui.js";
  for (const s of scripts()) { if (s === stop) break; vm.runInContext(fs.readFileSync(path.join(ROOT, s), "utf8"), ctx, { filename: s }); }
  (opts.extra || []).forEach(s => vm.runInContext(fs.readFileSync(path.join(ROOT, s), "utf8"), ctx, { filename: s }));
  return { BL: ctx.BL, ctx, clock, store };
}
let fails = 0, passes = 0;
function check(cond, msg) { if (cond) { passes++; if (!process.env.QUIET) console.log("  ok  " + msg); } else { fails++; console.log("  ÉCHEC " + msg); } }
function done(name) { console.log((fails ? "ÉCHEC" : "OK") + " " + name + " : " + passes + " vérifications, " + fails + " échec(s)"); process.exitCode = fails ? 1 : 0; }
module.exports = { load, check, done, ROOT, scripts };
