/* Suite complète : chaque fichier tests/*.test.js (logique puis navigateur), puis les contrôles rapides de l'audit (tests/simulate.js sans AUDIT). */
const { spawnSync } = require("child_process"), fs = require("fs"), path = require("path");
const dir = __dirname, files = fs.readdirSync(dir).filter(f => /\.test\.js$/.test(f)).sort((a, b) => (/browser/.test(a) - /browser/.test(b)) || a.localeCompare(b));
let bad = 0; const t0 = Date.now();
for (const f of files.concat(["simulate.js"])) {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: "utf8", env: Object.assign({}, process.env, { QUIET: "1" }), timeout: 900000 });
  const out = (r.stdout || "") + (r.stderr || ""), last = out.trim().split("\n").filter(l => /^(OK|ÉCHEC)\b/.test(l)).pop() || "(pas de bilan) " + out.trim().split("\n").slice(-3).join(" | ");
  const fails = out.split("\n").filter(l => /ÉCHEC /.test(l) && !/^ÉCHEC\b/.test(l));
  if (r.status !== 0) bad++; console.log((r.status === 0 ? "✔ " : "✘ ") + f + " — " + last); fails.forEach(l => console.log("    " + l.trim()));
}
console.log("\n" + (bad ? bad + " fichier(s) en échec" : "Tout est vert") + " · " + files.length + " fichiers de tests + audit · " + Math.round((Date.now() - t0) / 1000) + " s");
process.exitCode = bad ? 1 : 0;
