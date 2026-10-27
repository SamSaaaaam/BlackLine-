/* Vérification avant publication : chemins relatifs, casse exacte des fichiers référencés, polices locales, et UN SEUL appel réseau possible dans tout le jeu
   (le fetch de js/leaderboard.js, classement facultatif). Réécrit en Partie 17 (le fichier d'origine n'était pas dans le dépôt). */
const fs = require("fs"), path = require("path"), { check, done, ROOT } = require("./_load");
function exists(rel) { /* casse exacte : chaque segment doit apparaître tel quel dans son dossier */
  let dir = ROOT; for (const seg of rel.split("/")) { if (!seg || seg === ".") continue; if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(seg)) return false; dir = path.join(dir, seg); } return true;
}
function walk(d, out) { for (const f of fs.readdirSync(d)) { if (/^(\.git|node_modules|tests|shots|docs)$/.test(f)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; }
const files = walk(ROOT, []), rel = f => path.relative(ROOT, f).split(path.sep).join("/");
for (const page of ["index.html", "about.html"]) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  const refs = [...html.matchAll(/\b(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(mailto:|data:)/.test(u));
  refs.forEach(u => { check(!/^(\/|https?:|\/\/)/.test(u), page + " : chemin relatif « " + u + " »"); if (!/^(\/|https?:|\/\/)/.test(u)) check(exists(u.split("?")[0]), page + " : fichier présent (casse comprise) « " + u + " »"); });
}
const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8");
[...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]).filter(u => !/^(data:|#)/.test(u)).forEach(u => { check(!/^https?:|^\/\//.test(u), "CSS : ressource locale « " + u + " »"); check(exists(path.posix.normalize("css/" + u)), "CSS : fichier présent « " + u + " »"); });
check(!/@import\s+url\(["']?https?:/.test(css) && !/fonts\.googleapis|fonts\.gstatic/.test(css + fs.readFileSync(path.join(ROOT, "index.html"), "utf8")), "polices locales (aucun service de polices externe)");
const js = files.filter(f => /\.js$/.test(f));
let fetches = [];
js.forEach(f => { const t = fs.readFileSync(f, "utf8"); const n = (t.match(/\bfetch\s*\(/g) || []).length; if (n) fetches.push(rel(f) + "×" + n);
  check(!/XMLHttpRequest|new WebSocket|sendBeacon|new EventSource|importScripts\(|navigator\.connection/.test(t), rel(f) + " : aucun autre canal réseau"); });
check(fetches.length === 1 && fetches[0] === "js/leaderboard.js×1", "un seul fetch dans tout le jeu, dans js/leaderboard.js (" + fetches.join(", ") + ")");
/* le manifeste des illustrations ne référence que des fichiers locaux existants */
const man = fs.readFileSync(path.join(ROOT, "assets/crew/manifest.js"), "utf8");
check(!/https?:\/\//.test(man.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")), "manifest des illustrations : aucune adresse externe");
/* CSP Vercel : connect-src limité au site et à Supabase */
const v = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")), csp = v.headers[0].headers.find(h => h.key === "Content-Security-Policy").value;
check(/connect-src 'self' https:\/\/\*\.supabase\.co;/.test(csp) && /font-src 'self'/.test(csp) && /script-src 'self';/.test(csp), "CSP : réseau limité au site et à Supabase, polices et scripts locaux");
done("pages-ready");
