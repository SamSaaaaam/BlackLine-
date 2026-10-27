/* Partie 19 · A : achat rapide — prix ×N exact (comparé à N achats successifs), Max, plafond niveau 100, chantiers et ouvriers,
   meilleur achat sur 200 états aléatoires déterministes (comparé à une recherche exhaustive), réglage hostile. */
const { load, check, done } = require("./_load");
const { BL } = load(), E = BL.economy, W = BL.works, Y = BL.buy, S = BL.save, D = BL.data;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function clone(s) { return JSON.parse(JSON.stringify(s)); }
/* 1. prix exact : somme des N prix successifs = ce que coûtent N achats un par un (instantanés, économie seule) */
let bad = 0, cases = 0;
D.activities.forEach(a => [0, 1, 7, 24, 25, 26, 49, 50, 51, 80, 95].forEach(n0 => [1, 10, 25].forEach(N => {
  const s = E.newState(0); s.total = 0; if (n0) E.setOwned(s, a.id, n0, 1); D.activities.forEach(b => { if (b.id !== a.id && !E.actUnlocked(s, a)) E.setOwned(s, b.id, Math.max(E.best(s, b.id), 5)); }); s.money = 1e300;
  const c = W.canOrder(s, a.id, 0, N); if (!c.k) return; const s2 = clone(s); s2.money = c.cost * 1.5; const m0 = s2.money; for (let k = 0; k < c.k; k++) E.buyActivity(s2, a.id, 0);
  cases++; if (Math.abs((m0 - s2.money) - c.cost) > Math.max(1e-6, c.cost * 1e-12) || E.bLevel(s2, a.id, 0) !== c.to) bad++; })));
check(cases > 100 && bad === 0, "prix ×N = somme exacte de N achats successifs (" + cases + " cas, phases de prix 1 à 3 comprises)");
/* 2. plafond niveau 100, Max, durée ≤ 24 h */
let s = E.newState(0); E.setOwned(s, "backroom", 98); s.money = 1e300; let c = W.canOrder(s, "backroom", 0, 25);
check(c.k === 2 && c.to === 100 && c.lim === "lvl", "×25 au niveau 98 : plafonné à ×2 (niveau 100)");
s = E.newState(0); E.setOwned(s, "backroom", 100); check(!W.canOrder(s, "backroom", 0, "max").ok && W.canOrder(s, "backroom", 0, "max").why === "max", "niveau 100 : plus d'achat");
s = E.newState(0); E.setOwned(s, "backroom", 10); const c10 = W.canOrder(s, "backroom", 0, 1); s.money = c10.cost * 3.5;
c = W.canOrder(s, "backroom", 0, "max"); check(c.ok && c.cost <= s.money && W.canOrder(Object.assign(clone(s), {}), "backroom", 0, c.k + 1).cost > s.money, "Max = le plus grand N abordable (" + c.k + ")");
s.money = 1; c = W.canOrder(s, "backroom", 0, "max"); check(!c.ok && c.k === 1 && c.missing > 0, "Max sans argent : 1 niveau proposé, « il te manque » calculé");
s = E.newState(0); E.setOwned(s, "holding", 60); ["backroom", "freight", "fence", "estate"].forEach(id => E.setOwned(s, id, 5)); s.money = 1e300;
c = W.canOrder(s, "holding", 0, 25); check(c.dur <= 86400 && c.lim === "dur" && c.k < 25, "×25 en fin de partie : réduit pour tenir dans 24 h (×" + c.k + ", " + Math.round(c.dur / 3600) + " h)");
let sumD = 0; for (let j = 0; j < c.k; j++) sumD += W.duration("holding", 0, 61 + j); check(Math.abs(sumD - c.dur) < 1e-9, "durée ×N = somme des N durées (même règle que N chantiers à la suite)");
/* 3. chantiers : un seul chantier vers le niveau cible, jamais de contournement de la file */
s = E.newState(0); E.setOwned(s, "backroom", 10); E.setOwned(s, "freight", 5); s.money = 1e12; s.total = 0;
const e = W.order(s, "backroom", 0, 10); check(e && e.to === 20 && W.list(s).length === 1 && E.bLevel(s, "backroom", 0) === 10, "×10 : un seul chantier vers le niveau 20, niveau inchangé pendant les travaux");
W.order(s, "freight", 0, 10); check(W.waiting(s).length === 1 && Y.plan(s, "freight", 0, "1").why === "busy", "1 ouvrier : le second ×10 attend en file ; bâtiment occupé signalé");
s = E.newState(0); E.setOwned(s, "backroom", 10); E.setOwned(s, "freight", 5); s.money = 1e12; s.total = 0; W.order(s, "freight", 0, 1);
const pw = Y.plan(s, "backroom", 0, "10"); check(pw.ok && pw.wait === true, "aucun ouvrier libre : le plan le dit avant le clic (en file)");
W.advance(s, 1e6); check(E.bLevel(s, "freight", 0) === 6, "fin du chantier ×1");
/* 4. gain affiché = vrai gain de revenu net */
s = E.newState(0); E.setOwned(s, "backroom", 12); s.money = 1e9; const before = E.incomeBase(s), p10 = Y.plan(s, "backroom", 0, "10"); const s3 = clone(s); for (let k = 0; k < 10; k++) E.buyActivity(s3, "backroom", 0);
check(Math.abs((E.incomeBase(s3) - before) - p10.gain) < 1e-9, "gain ×10 affiché = vraie hausse du revenu net");
/* 5. meilleur achat : 200 états aléatoires déterministes, comparé à une recherche exhaustive */
let okB = 0, noneOk = 0;
for (let k = 0; k < 200; k++) {
  const r = rng(1000 + k), st = E.newState(0); st.total = Math.floor(r() * 1e9);
  D.activities.forEach((a, ai) => { if (r() < 0.8 - ai * 0.12) { const n = 1 + Math.floor(r() * 60); E.setOwned(st, a.id, n, 1 + Math.floor(r() * Math.min(4, E.BLD_NEED.filter(t => n >= t).length))); } });
  D.upgrades.forEach(u => { if (r() < 0.3) st.upg[u.id] = true; });
  st.money = Math.pow(10, r() * 9); if (r() < 0.3) { const a = D.activities[0]; if (E.levels(st, a.id).length) W.order(Object.assign(st, { money: st.money + 1e15 }), a.id, 0, 1); st.money = Math.pow(10, r() * 9); }
  const b = Y.best(st), all = Y.options(st).filter(o => st.money + 1e-9 >= o.cost);
  if (b.none) { if (!all.length) noneOk++; continue; }
  const min = Math.min(...all.map(o => o.cost / o.gain)); if (Math.abs(b.cost / b.gain - min) <= min * 1e-12 && st.money + 1e-9 >= b.cost) okB++;
  if (b.kind === "lvl" && W.busyLot(st, b.id, b.i)) okB -= 1000;
}
check(okB + noneOk === 200, "meilleur achat : 200 états aléatoires, toujours le meilleur retour abordable, jamais un bâtiment en chantier (" + okB + " + " + noneOk + " sans achat)");
s = E.newState(0); E.setOwned(s, "backroom", 30); s.money = 0; const nb = Y.best(s); check(nb.none && nb.eta > 0 && isFinite(nb.eta), "rien d'abordable : délai avant le prochain achat (" + nb.eta + " s)");
/* file pleine : plus d'option d'activité */
s = E.newState(0); s.total = E.levelAt(W.P.workers[2]); ["backroom", "freight", "fence", "estate", "holding"].forEach(id => E.setOwned(s, id, 10, 4)); s.money = 1e15;
let n = 0; for (const a of D.activities) for (let i = 0; i < 4; i++) if (W.order(s, a.id, i, 1)) n++;
check(W.full(s) && Y.options(s).every(o => o.kind === "upg"), "file pleine : le meilleur achat ne propose plus que des bonus permanents");
/* 6. réglage */
["1", "10", "25", "max"].forEach(v => check(S.sanitizeSettings({ buyqty: v }).buyqty === v, "buyqty " + v + " conservé"));
check(S.sanitizeSettings({ buyqty: 10 }).buyqty === "10", "buyqty numérique 10 → \"10\"");
[undefined, null, "100", "MAX", {}, [], "__proto__", -1].forEach(v => check(S.sanitizeSettings({ buyqty: v }).buyqty === "1", "buyqty hostile " + JSON.stringify(v) + " → 1"));
check(S.sanitizeSettings({ buyqty: "max" }).buyqty === "max" && S.VERSION === 15, "le réglage ne crée pas de nouvelle version (v15 vient des défis)");
done("buy");
