/* Audit d'économie (Partie 17). Usage : AUDIT=1 node tests/simulate.js   (sans AUDIT : contrôles rapides, code de sortie ≠ 0 si un objectif n'est pas tenu)
   Options : SIM_H=24 (heures simulées), PARAMS=old (anciens réglages hors-ligne 50 % / 8 h), WORKS=0 (sans chantiers : achats instantanés, comme avant la Partie 17).
   Joueur simulé : tests/_bot.js (cœur de l'économie seulement : voir ses limites en tête du fichier). */
const { load } = require("./_load"), { makeBot } = require("./_bot");
const AUDIT = !!process.env.AUDIT, H = +(process.env.SIM_H || 24), OLD = { eff: 0.5, cap: 8 * 3600 };
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
const stages = [[300, "début (5 min)"], [3600, "≈ 1 h"], [10 * 3600, "≈ 10 h"], [Math.min(H, 48) * 3600, "fin (" + Math.min(H, 48) + " h)"]].filter(x => base.snaps[x[0]]);
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
/* ===== Partie 17 · D : chantiers ===== */
function cumul(BL, id, upTo, mode) {   /* temps de chantier cumulé (bâtiment principal) pour aller du niveau 0 au niveau upTo */
  const W = BL.works, F = W.P.foreman, Bb = W.P.bribe; let t = 0;
  for (let L = 1; L <= upTo; L++) {
    let rem = W.duration(id, 0, L), tt = 0, b = 0;
    if (mode === "bribe") while (b < Bb.per) { const floor = Math.max(Bb.minLeft, W.duration(id, 0, L) * Bb.minFrac), cut = Math.min(rem * Bb.cut, rem - floor); if (cut < 1) break; rem -= cut; b++; }
    if (mode === "foreman" || mode === "bribe") { while (rem > F.cd) { tt += F.cd; rem -= F.cd; rem *= 1 - W.foremanPct(0.5); } }
    t += tt + rem;
  }
  return t;
}
if (AUDIT && base.BL.works) {
  const BL = base.BL, W = BL.works, acts = BL.data.activities.map(a => a.id);
  console.log("\n# Chantiers (Partie 17 · D)\n\nOuvriers : 1 au départ, 2 au niveau d'empire " + W.P.workers[1] + ", 3 au niveau " + W.P.workers[2] + ". File d'attente : " + W.P.queueMax + " chantiers payés d'avance. Plafond : " + hm(W.P.maxDur) + " par chantier.\n");
  console.log("## Durée d'un chantier (bâtiment principal ; bâtiments 2 à 4 : ×" + W.P.annex + ")\n\n| Activité | niv. 1 | 5 | 10 | 20 | 30 | 45 | 60 | 80 | 100 |\n|---|---|---|---|---|---|---|---|---|---|");
  acts.forEach(id => console.log("| " + id + " | " + [1, 5, 10, 20, 30, 45, 60, 80, 100].map(L => hm(W.duration(id, 0, L))).join(" | ") + " |"));
  console.log("\n## Temps de chantier cumulé pour atteindre un niveau (bâtiment principal, un ouvrier dessus en continu)\n\nContremaître : joué dès qu'il est prêt (toutes les 10 min) avec un score moyen (−" + Math.round(W.foremanPct(0.5) * 100) + " % du temps restant). Pot-de-vin : 3 par chantier (−30 % chacun, jamais jusqu'au bout).\n\n| Activité | Aides | niv. 5 | 10 | 25 | 50 | 100 |\n|---|---|---|---|---|---|---|");
  acts.forEach(id => [["sans mini-jeu", "none"], ["Contremaître", "foreman"], ["Contremaître + pots-de-vin", "bribe"]].forEach(([n, m]) => console.log("| " + id + " | " + n + " | " + [5, 10, 25, 50, 100].map(L => hm(cumul(BL, id, L, m))).join(" | ") + " |")));
  console.log("\n## Joueur simulé : progression avec et sans chantiers (" + Math.min(H, 10) + " h de jeu actif)\n");
  const pols = [["sans chantiers (avant)", { works: false }], ["chantiers, sans aide", {}], ["chantiers + Contremaître", { foreman: 0.5 }], ["chantiers + Contremaître + pots-de-vin", { foreman: 0.5, bribe: 0.25 }]];
  const marks = [900, 3600, 4 * 3600, 10 * 3600].filter(m => m <= H * 3600), res = [];
  pols.forEach(([name, o]) => { const env = load(), B2 = env.BL; if (o.works === false) B2.works = null; const E2 = B2.economy, s2 = E2.newState(0), bot = makeBot(B2, s2, o), row = { name, at: [] };
    marks.forEach(m => { bot.run(m - s2.t); row.at.push({ lvl: E2.level(s2), inc: E2.income(s2), best: B2.data.activities.map(a => E2.best(s2, a.id)).join("/") }); });
    const sp = bot.stats.idleSpans.concat(bot.stats.idleCur ? [[bot.stats.idleStart, bot.stats.idleCur]] : []).filter(x => x[0] < 4 * 3600);
    row.idleMax = Math.max(0, ...sp.map(x => x[1])); row.idleTot = sp.reduce((a, x) => a + Math.min(x[1], 4 * 3600 - x[0]), 0);
    const gp = bot.stats.gaps.filter(x => x[0] < 4 * 3600); row.gapMax = Math.max(0, ...gp.map(x => x[1])); row.gap1h = Math.max(0, ...gp.filter(x => x[0] < 3600).map(x => x[1])); row.orders4h = gp.length; row.first = bot.stats.firstAt; row.foreman = bot.stats.foreman; row.bribes = bot.stats.bribes; res.push(row); });
  console.log("| Joueur | " + marks.map(m => hm(m)).join(" | ") + " |\n|---|" + marks.map(() => "---|").join(""));
  res.forEach(r => console.log("| " + r.name + " | " + r.at.map(x => "niv. " + x.lvl + ", " + fmt(x.inc) + "/s, meilleurs " + x.best).join(" | ") + " |"));
  console.log("\n| Joueur | plus long écart entre deux commandes de bâtiment (1re heure) | idem (4 premières heures) | commandes en 4 h | temps « file pleine » (4 h) | Contremaître joués | pots-de-vin |\n|---|---|---|---|---|---|---|");
  res.forEach(r => console.log("| " + r.name + " | " + hm(r.gap1h) + " | " + hm(r.gapMax) + " | " + r.orders4h + " | " + hm(r.idleTot) + " | " + r.foreman + " | " + r.bribes + " |"));
  console.log("\nÉcart entre deux commandes : temps pendant lequel le joueur ne peut rien construire de nouveau (faute d'argent, d'ouvrier ou de place dans la file). « File pleine » : 3 ouvriers occupés et 5 chantiers en attente ; les travaux avancent, mais rien de neuf à commander.\n\n| Palier (bâtiment principal) | " + res.map(r => r.name).join(" | ") + " |\n|---|" + res.map(() => "---|").join(""));
  ["backroom@5", "backroom@10", "backroom@25", "freight@10", "freight@25", "fence@10", "fence@25", "estate@10", "holding@10", "backroom@50"].forEach(k => console.log("| " + k.replace("@", " niveau ") + " | " + res.map(r => hm(r.first[k])).join(" | ") + " |"));
  goals.push(["chantiers : jamais plus de 10 min sans pouvoir commander un bâtiment pendant les 4 premières heures (sans aide) : " + hm(res[1].gapMax), res[1].gapMax <= 600]);
  goals.push(["chantiers : premier achat ≤ 10 s, niveau 10 ≤ 3 min, plafond 24 h", W.duration("backroom", 0, 1) <= 10 && acts.every(id => W.duration(id, 0, 1) >= 2 && W.duration(id, 0, 1) <= 10 && W.duration(id, 0, 10) <= 180 && W.duration(id, 0, 100) <= 86400)]);
}
/* ===== Partie 17 · E : mini-jeux, gains maximaux (bornes calculées depuis les réglages) ===== */
if (AUDIT && base.BL.minigames) {
  const BL = base.BL, R = BL.minigames.R, EP = BL.data.equip.params, HP = BL.data.heist.params, W = BL.works;
  const compta = (R.compta.inc * R.compta.dur) / R.compta.cd, rival = R.interro.money / R.interro.cd, ops = 0.15 * EP.rewardPerSec, heist = 2 * R.lockpick.heist * (HP.loot[3] - HP.loot[2]) * HP.rewardMin * 60 / HP.cdSec;
  const rows = [["Comptabilité « optimiser » (+6 % pendant 10 min, toutes les 30 min)", compta], ["Interrogatoire du rival (120 s de revenus, toutes les heures)", rival], ["Plan du coup + crochetage sur les opérations (+15 points de chance en continu)", ops], ["Crochetage du braquage (+8 points sur 2 étapes, un braquage toutes les 8 h)", heist]];
  console.log("\n# Mini-jeux (Partie 17 · E) : gain maximal en jouant parfaitement\n\nEn % du revenu net, moyenné sur une heure de jeu actif (borne haute : score parfait à chaque fois, sans compter le temps passé à jouer). « Résoudre automatiquement » donne la moitié des bonus.\n\n| Mini-jeu | Gain maximal |\n|---|---|");
  rows.forEach(r => console.log("| " + r[0] + " | +" + (r[1] * 100).toFixed(1).replace(".", ",") + " % |"));
  const tot = rows.reduce((a, r) => a + r[1], 0); console.log("| **Total si tout est joué parfaitement** | **+" + (tot * 100).toFixed(1).replace(".", ",") + " %** |");
  console.log("\nNon monétaires : indic (pression d'un rival −5 à −20, chaleur −0 à −3), inspecteur (loyauté +2 à +10, plafonnée à 100), comptabilité « traces » (chaleur −2 à −10). Contremaître : voir le tableau des chantiers (−5 à −20 % du temps restant, une fois toutes les " + Math.round(W.P.foreman.cd / 60) + " min). Aucun lingot n'est jamais gagné ni dépensé.");
  goals.push(["mini-jeux : gain monétaire maximal ≤ 10 % du revenu actif : +" + (tot * 100).toFixed(1).replace(".", ",") + " %", tot <= 0.10]);
}
if (process.env.JSON_OUT) require("fs").writeFileSync(process.env.JSON_OUT, JSON.stringify({ firstAt: base.bot.stats.firstAt, snaps: Object.fromEntries(Object.entries(base.snaps).map(([k, v]) => [k, { inc: v.inc, lvl: v.lvl, total: v.total }])), stats: base.bot.stats }));
if (AUDIT) { console.log("\n## Objectifs\n"); goals.forEach(g => console.log("- " + (g[1] ? "✔" : "✘") + " " + g[0])); console.log("\n(" + ((Date.now() - t0) / 1000).toFixed(1) + " s de calcul)"); }
module.exports = { activeRun, offlineVsActive, sessions };
const bad = goals.filter(g => !g[1]); if (!AUDIT) { goals.forEach(g => console.log((g[1] ? "  ok  " : "  ÉCHEC ") + g[0])); console.log((bad.length ? "ÉCHEC" : "OK") + " simulate"); }
process.exitCode = bad.length ? 1 : 0;
