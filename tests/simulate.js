/* Audit d'économie (Partie 17). Usage : AUDIT=1 node tests/simulate.js   (sans AUDIT : contrôles rapides, code de sortie ≠ 0 si un objectif n'est pas tenu)
   Options : SIM_H=48 (heures simulées), PARAMS=old (anciens réglages hors-ligne 50 % / 8 h), WORKS=0 (sans chantiers : achats instantanés, comme avant la Partie 17).
   Joueur simulé : tests/_bot.js (cœur de l'économie seulement : voir ses limites en tête du fichier). */
const { load } = require("./_load"), { makeBot } = require("./_bot");
const AUDIT = !!process.env.AUDIT, H = +(process.env.SIM_H || 48), OLD = { eff: 0.5, cap: 8 * 3600 };
function fresh(opts) { const env = load(); const BL = env.BL; if (opts && opts.noWorks) BL.works = null; return BL; }
function clone(BL, s) { return BL.economy && JSON.parse(JSON.stringify(s)); }
function fmt(n) { if (!isFinite(n)) return String(n); const a = Math.abs(n); if (a >= 1e12) return (n / 1e12).toFixed(2) + " T"; if (a >= 1e9) return (n / 1e9).toFixed(2) + " Md"; if (a >= 1e6) return (n / 1e6).toFixed(2) + " M"; if (a >= 1e3) return (n / 1e3).toFixed(1) + " k"; return n.toFixed(a < 10 ? 2 : 0); }
function hm(sec) { if (sec === undefined || sec === null) return "—"; sec = Math.round(sec); if (sec < 60) return sec + " s"; if (sec < 3600) return Math.round(sec / 60) + " min"; const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60); return h + " h " + String(m).padStart(2, "0"); }
function pct(x) { return (x * 100).toFixed(1).replace(".", ",") + " %"; }
const noWorks = process.env.WORKS === "0";

/* 1. partie active de référence */
function activeRun(hours, o) {
  const BL = fresh({ noWorks: o && o.noWorks }), s = BL.economy.newState(0), bot = makeBot(BL, s, o), snaps = {}, marks = (o && o.marks) || [300, 900, 3600, 4 * 3600, 10 * 3600, 24 * 3600, 48 * 3600];
  let t = 0; for (const m of marks) { if (m > hours * 3600) break; bot.run(m - t); t = m; snaps[m] = { s: clone(BL, s), inc: BL.economy.income(s), lvl: BL.economy.level(s), total: s.total }; }
  if (t < hours * 3600) bot.run(hours * 3600 - t);
  return { BL, s, bot, snaps };
}
/* 2. hors-ligne vs actif au même stade */
function offlineVsActive(base, stageSec, awaySec, params) {
  const snap = base.snaps[stageSec]; if (!snap) return null;
  const BL = fresh({ noWorks }), sa = JSON.parse(JSON.stringify(snap.s)), bot = makeBot(BL, sa); const t0 = sa.total; bot.run(awaySec); const active = sa.total - t0;
  const B = BL.data.balance, eff = params === "old" ? OLD.eff : B.offlineEfficiency, cap = params === "old" ? OLD.cap : B.offlineCapSec;
  const so = JSON.parse(JSON.stringify(snap.s)), rate = BL.economy.incomeBase(so), off = rate * Math.min(awaySec, cap) * eff;
  return { active, off, ratio: active > 0 ? off / active : 0, rate };
}
/* 3. profil réaliste : sessions actives entrecoupées d'absences */
function sessions(params, pattern, days) {
  const BL = fresh({ noWorks }), E = BL.economy, B = BL.data.balance, s = E.newState(0), bot = makeBot(BL, s);
  if (params === "old") { B.offlineEfficiency = OLD.eff; B.offlineCapSec = OLD.cap; }
  let wall = 0; const out = [];
  for (let d = 0; d < days; d++) for (const [on, off] of pattern) {
    bot.run(on); wall += on; const ms = wall * 1000; s.saved = ms; wall += off;
    const o = E.offline(s, wall * 1000); if (BL.works) BL.works.absence(s, o.elapsed);
  }
  out.push({ total: s.total, lvl: E.level(s), inc: E.income(s), best: Math.max(...BL.data.activities.map(a => E.best(s, a.id))) });
  return out[0];
}

const t0 = Date.now(), base = activeRun(H, { noWorks });
const B = base.BL.data.balance, rows = [];
if (AUDIT) {
  console.log("# Audit d'économie · Partie 17 (joueur simulé, " + H + " h, " + (noWorks ? "sans chantiers" : base.BL.works ? "avec chantiers" : "sans chantiers") + ")\n");
  console.log("Réglages hors-ligne actuels : rendement " + pct(B.offlineEfficiency) + ", plafond " + hm(B.offlineCapSec) + ", pause comptée comme absence au-delà de " + hm(B.sleepGapSec) + ".\n");
  console.log("## Progression en jeu actif\n\n| Temps | Niveau d'empire | Revenu net |\n|---|---|---|");
  Object.keys(base.snaps).forEach(k => console.log("| " + hm(+k) + " | " + base.snaps[k].lvl + " | " + fmt(base.snaps[k].inc) + "/s |"));
  console.log("\n## Absence : gain hors-ligne / gain en jeu actif pendant la même durée (même stade)\n");
  console.log("| Stade | Absence | Jeu actif | Hors-ligne avant (50 % / 8 h) | ratio | Hors-ligne après (" + pct(B.offlineEfficiency) + " / " + hm(B.offlineCapSec) + ") | ratio |\n|---|---|---|---|---|---|---|");
}
const stages = [[300, "début (5 min)"], [3600, "≈ 1 h"], [10 * 3600, "≈ 10 h"], [Math.min(H, 48) * 3600, "fin (" + Math.min(H, 48) + " h)"]];
const goals = [];
stages.forEach(([st, name]) => [300, 3600, 8 * 3600].forEach(aw => {
  const a = offlineVsActive(base, st, aw, "old"), b = offlineVsActive(base, st, aw, "new"); if (!a) return;
  if (AUDIT) console.log("| " + name + " | " + hm(aw) + " | " + fmt(a.active) + " | " + fmt(a.off) + " | " + pct(a.ratio) + " | " + fmt(b.off) + " | " + pct(b.ratio) + " |");
  if (aw === 8 * 3600) goals.push(["8 h d'absence ≤ 25 % de 8 h actives (" + name + ") : " + pct(b.ratio), b.ratio <= 0.25]);
  if (st === 300 && aw === 300) goals.push(["premier retour (5 min d'absence après 5 min) : +" + fmt(b.off) + " $ (≥ 30 s de revenu actif : " + fmt(b.rate * 30) + ")", b.off >= b.rate * 30]);
}));
if (AUDIT) {
  console.log("\n## Profil réaliste : 3 jours de « 45 min de jeu, 7 h 15 d'absence » (×3 par jour)\n");
  const pat = [[2700, 26100], [2700, 26100], [2700, 26100]], o = sessions("old", pat, 3), n = sessions("new", pat, 3);
  console.log("| Réglages | Niveau d'empire | Meilleur bâtiment | Revenu net | Total gagné |\n|---|---|---|---|---|");
  console.log("| avant (50 % / 8 h) | " + o.lvl + " | " + o.best + " | " + fmt(o.inc) + "/s | " + fmt(o.total) + " |");
  console.log("| après (" + pct(B.offlineEfficiency) + " / " + hm(B.offlineCapSec) + ") | " + n.lvl + " | " + n.best + " | " + fmt(n.inc) + "/s | " + fmt(n.total) + " |");
}
/* paliers en jeu actif (pour l'objectif « pas plus de +15 % ») */
const ms = ["backroom@10", "backroom@25", "backroom@50", "freight@10", "freight@25", "fence@10", "fence@25", "estate@10", "holding@10"];
if (AUDIT) { console.log("\n## Paliers en jeu actif (premier bâtiment de chaque activité)\n\n| Palier | Atteint à |\n|---|---|"); ms.forEach(k => console.log("| " + k.replace("@", " niveau ") + " | " + hm(base.bot.stats.firstAt[k]) + " |")); }
if (process.env.JSON_OUT) require("fs").writeFileSync(process.env.JSON_OUT, JSON.stringify({ firstAt: base.bot.stats.firstAt, snaps: Object.fromEntries(Object.entries(base.snaps).map(([k, v]) => [k, { inc: v.inc, lvl: v.lvl, total: v.total }])), stats: base.bot.stats }));
if (AUDIT) { console.log("\n## Objectifs\n"); goals.forEach(g => console.log("- " + (g[1] ? "✔" : "✘") + " " + g[0])); console.log("\n(" + ((Date.now() - t0) / 1000).toFixed(1) + " s de calcul)"); }
module.exports = { activeRun, offlineVsActive, sessions };
const bad = goals.filter(g => !g[1]); if (!AUDIT) { goals.forEach(g => console.log((g[1] ? "  ok  " : "  ÉCHEC ") + g[0])); console.log((bad.length ? "ÉCHEC" : "OK") + " simulate"); }
process.exitCode = bad.length ? 1 : 0;
