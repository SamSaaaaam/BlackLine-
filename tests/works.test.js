/* Partie 17 · D : chantiers (logique pure + sauvegarde v14). */
const { load, check, done } = require("./_load");
const { BL, clock } = load(), E = BL.economy, W = BL.works, S = BL.save, D = BL.data;
function fresh(money) { const s = E.newState(0); s.money = money || 1e12; s.total = 0; return s; }
function chain(s) { ["backroom", "freight", "fence", "estate"].forEach(id => { if (E.best(s, id) < 5) E.setOwned(s, id, 5); }); return s; }
/* durées */
D.activities.forEach(a => { check(W.duration(a.id, 0, 1) >= 2 && W.duration(a.id, 0, 1) <= 10, a.id + " : premier achat 2 à 10 s (" + W.duration(a.id, 0, 1) + " s)");
  check(W.duration(a.id, 0, 10) <= 180, a.id + " : niveau 10 ≤ 3 min"); check(W.duration(a.id, 0, 30) >= 60 && W.duration(a.id, 0, 30) <= 3600, a.id + " : niveau 30 en minutes");
  check(W.duration(a.id, 0, 60) >= 600 && W.duration(a.id, 0, 60) <= 6 * 3600, a.id + " : niveau 60 entre 10 min et quelques heures"); check(W.duration(a.id, 0, 100) >= 3 * 3600 && W.duration(a.id, 0, 100) <= 86400, a.id + " : fin de partie plusieurs heures, ≤ 24 h");
  let mono = true; for (let L = 2; L <= 100; L++) if (W.duration(a.id, 0, L) < W.duration(a.id, 0, L - 1)) mono = false; check(mono, a.id + " : durée croissante"); });
check(W.duration("holding", 0, 50) > W.duration("backroom", 0, 50), "activités avancées plus lentes");
/* commande, file, ouvriers */
let s = fresh(); const m0 = s.money, c = E.cost(D.activities[0], 0, s, 0), e = W.order(s, "backroom", 0);
check(!!e && s.money === m0 - c && E.bLevel(s, "backroom", 0) === 0 && e.at !== null, "commande : payée tout de suite, niveau inchangé, chantier démarré");
check(W.order(s, "backroom", 0) === null, "un même bâtiment ne peut pas avoir deux chantiers");
check(W.workers(s) === 1, "1 ouvrier au départ");
W.advance(s, W.duration("backroom", 0, 1) - 0.5); check(E.bLevel(s, "backroom", 0) === 0, "avant la fin : toujours niveau 0");
let d = W.advance(s, 1); check(d.length === 1 && E.bLevel(s, "backroom", 0) === 1 && !W.list(s).length, "fin : niveau 1 appliqué, chantier retiré");
/* production pendant le chantier : au niveau ACTUEL */
s = fresh(); E.setOwned(s, "backroom", 20); const inc0 = E.income(s); W.order(s, "backroom", 0); check(Math.abs(E.income(s) - inc0) < 1e-9, "pendant le chantier : revenus au niveau actuel");
const t0 = s.money; E.tick(s, 10); check(s.money > t0, "pendant le chantier : le bâtiment produit");
/* file d'attente, 2e et 3e ouvriers gagnés par le niveau d'empire */
s = fresh(); ["backroom", "freight", "fence", "estate", "holding"].forEach(id => E.setOwned(s, id, 10)); s.total = 0;
W.order(s, "backroom", 0); W.order(s, "freight", 0); check(W.active(s).length === 1 && W.waiting(s).length === 1, "1 ouvrier : le 2e chantier attend en file");
s.total = E.levelAt(W.P.workers[1]); W.sync(s); check(W.workers(s) === 2 && W.active(s).length === 2, "niveau " + W.P.workers[1] + " : 2e ouvrier, la file repart");
s.total = E.levelAt(W.P.workers[2]); check(W.workers(s) === 3, "niveau " + W.P.workers[2] + " : 3e ouvrier");
W.order(s, "fence", 0); W.order(s, "estate", 0); W.order(s, "holding", 0); E.setOwned(s, "backroom", 10, 4);
for (let i = 1; i < 4; i++) W.order(s, "backroom", i);
check(W.active(s).length === 3 && W.waiting(s).length === W.P.queueMax && W.full(s), "3 en cours + " + W.P.queueMax + " en file : file pleine");
const mm = s.money; check(W.order(s, "freight", 0) === null && !W.canOrder(s, "freight", 0).ok && s.money === mm, "file pleine : commande refusée, rien payé");
/* plusieurs chantiers qui se terminent pendant une absence, dans l'ordre */
s = fresh(); ["backroom", "freight", "fence"].forEach(id => E.setOwned(s, id, 20)); s.total = E.levelAt(W.P.workers[2]);
W.order(s, "backroom", 0); W.order(s, "freight", 0); W.order(s, "fence", 0); E.setOwned(s, "backroom", 20, 2); W.order(s, "backroom", 1);
d = W.absence(s, 6 * 3600); check(d.length === 4 && W.list(s).length === 0, "absence de 6 h : les 4 chantiers (dont 1 en file) sont terminés");
check(d.every((x, i) => i === 0 || x.at >= d[i - 1].at), "terminés dans l'ordre chronologique");
check(E.bLevel(s, "backroom", 0) === 21 && E.bLevel(s, "freight", 0) === 21 && E.bLevel(s, "backroom", 1) === 2, "niveaux appliqués");
s = chain(fresh(1e15)); E.setOwned(s, "holding", 99); W.order(s, "holding", 0); d = W.absence(s, 1e9); check(d.length === 1 && W.now(s) <= 86400 + 1, "saut d'horloge énorme : borné à 24 h (le chantier de 24 h au plus finit)");
s = chain(fresh(1e15)); E.setOwned(s, "holding", 99); W.order(s, "holding", 0); [-5, NaN, Infinity, "x", null].forEach(v => W.absence(s, v)); check(W.now(s) === 0 && W.list(s).length === 1, "horloge qui recule / valeurs absurdes : rien n'avance");
/* nouveau bâtiment : apparaît à la fin */
s = fresh(); E.setOwned(s, "backroom", 5); const nb = W.orderBuilding(s, "backroom"); check(!!nb && E.buildings(s, "backroom") === 1, "nouveau bâtiment : pas avant la fin");
W.advance(s, nb.dur + 1); check(E.buildings(s, "backroom") === 2 && E.bLevel(s, "backroom", 1) === 1, "nouveau bâtiment : apparaît au niveau 1");
/* pot-de-vin : coût croissant, jamais jusqu'au bout, 3 au plus, jamais de lingots */
s = fresh(); E.setOwned(s, "backroom", 59); W.order(s, "backroom", 0); const g0 = s.gold; let costs = [], lefts = [];
for (let k = 0; k < 5; k++) { const r = W.bribe(s, "backroom", 0); if (r) { costs.push(r.cost); lefts.push(r.left); } }
check(costs.length === 3 && costs[1] > costs[0] && costs[2] > costs[1], "pot-de-vin : 3 au plus, coût croissant (" + costs.join(", ") + ")");
check(lefts[2] > 0 && lefts[2] >= W.P.bribe.minLeft && s.gold === g0, "pot-de-vin : jamais jusqu'au bout, aucun lingot");
s = fresh(1); E.setOwned(s, "backroom", 59); s.money = E.cost(D.activities[0], 59, s, 0); W.order(s, "backroom", 0); check(W.bribe(s, "backroom", 0) === null, "pot-de-vin sans argent : refusé");
/* contremaître : 5 à 20 %, délai de récupération */
s = fresh(); E.setOwned(s, "backroom", 59); W.order(s, "backroom", 0); W.advance(s, 10); let l0 = W.left(s, W.entry(s, "backroom", 0)), r = W.foreman(s, "backroom", 0, 1);
check(Math.abs(r.pct - 0.2) < 1e-9 && Math.abs(W.left(s, W.entry(s, "backroom", 0)) - l0 * 0.8) < 1e-6, "contremaître parfait : −20 % du temps restant (jamais plus)");
check(W.foreman(s, "backroom", 0, 1) === null && W.foremanWait(s) > 0, "délai de récupération");
W.advance(s, W.P.foreman.cd); r = W.foreman(s, "backroom", 0, 0); check(Math.abs(r.pct - 0.05) < 1e-9, "contremaître raté : −5 % (jamais 0, jamais de pénalité)");
check(W.foremanPct(99) === 0.2 && W.foremanPct(-3) === 0.05 && W.foremanPct(NaN) === 0.05, "score hostile borné");
/* ===== sauvegarde v14 ===== */
check(S.VERSION >= 14, "sauvegarde v14 ou plus récente");
s = fresh(); E.setOwned(s, "backroom", 30); E.setOwned(s, "freight", 10); s.total = E.levelAt(W.P.workers[2]); W.order(s, "backroom", 0); W.order(s, "freight", 0); W.advance(s, 3); W.bribe(s, "backroom", 0);
let env = JSON.parse(JSON.stringify({ v: 14, savedAt: 1000, state: s })), back = S.sanitize(S.migrate(env), 2000);
check(JSON.stringify(back.works) === JSON.stringify(s.works), "aller-retour : chantiers identiques");
/* ancienne sauvegarde v13 : aucun chantier, rien d'autre ne change */
const v13 = { v: 13, savedAt: 1000, state: { money: 500, total: 5000, bl: { backroom: [12, 3] }, owned: { backroom: 12 } } }; const mg = S.migrate(JSON.parse(JSON.stringify(v13)));
check(mg.v === S.VERSION, "migration 13 → " + S.VERSION); back = S.sanitize(mg, 2000); check(back.works && Array.isArray(back.works.q) && back.works.q.length === 0 && back.works.clk === 0, "v13 : aucun chantier");
check(E.bLevel(back, "backroom", 0) === 12 && E.bLevel(back, "backroom", 1) === 3 && back.money === 500, "v13 : niveaux et argent conservés");
const imp = S.importText(JSON.stringify(v13), 5000); check(imp.ok && imp.state.works.q.length === 0, "import d'une sauvegarde v13");
/* valeurs hostiles */
function san(works, extraState) { return S.sanitize({ v: 14, savedAt: 1, state: Object.assign({ money: 1e9, total: E.levelAt(W.P.workers[2]), bl: { backroom: [12, 3], freight: [6] }, owned: { backroom: 12, freight: 6 }, works: works }, extraState || {}) }, 2000).works; }
const hostile = [null, 5, "x", [], { q: "x" }, { q: [null, 1, "a", [], {}] }, { clk: -5, q: [] }, { clk: NaN }, { clk: 1e300 }, { q: [{ id: "__proto__", i: 0, to: 13, at: 0, dur: 5 }] }, { q: [{ id: "constructor", i: 0, to: 1 }] }];
hostile.forEach((h, k) => { let ok = true, w; try { w = san(h); } catch (e) { ok = false; } check(ok && w && Array.isArray(w.q) && w.q.length === 0 && isFinite(w.clk) && w.clk >= 0 && w.clk <= 1e11, "valeur hostile n°" + k + " → aucun chantier, horloge saine"); });
let w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 101, at: 0, dur: 50 }] }); check(w.q.length === 0, "niveau au-delà du maximum : retiré");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 22, at: 0, dur: 50 }] }); check(w.q.length === 1 && w.q[0].to === 22, "achat ×10 (Partie 19) : chantier vers niveau +10 conservé");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 12, at: 0, dur: 50 }] }); check(w.q.length === 0, "niveau déjà atteint : retiré");
w = san({ clk: 100, q: [{ id: "backroom", i: 3, to: 1, at: 0, dur: 50 }] }); check(w.q.length === 0, "bâtiment inexistant / non débloqué : retiré");
w = san({ clk: 100, q: [{ id: "backroom", i: 2, to: 1, at: 0, dur: 50 }] }); check(w.q.length === 1, "nouveau bâtiment débloqué (meilleur niveau 12 ≥ 10) : conservé");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 13, at: 0, dur: -50 }] }); check(w.q.length === 1 && w.q[0].dur === W.duration("backroom", 0, 13), "durée négative → durée normale");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 13, at: 0, dur: 1e12 }] }); check(w.q[0].dur === 86400, "durée énorme → 24 h");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 13, at: 5000, dur: 50 }] }); check(w.q[0].at === 100, "début dans le futur (horloge qui recule) → maintenant");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 13, at: 0, dur: 50, b: 99 }] }); check(w.q[0].b === 3, "pots-de-vin hostiles bornés");
w = san({ clk: 100, fcd: 1e9, q: [] }); check(w.fcd <= 100 + W.P.foreman.cd, "délai du contremaître borné");
w = san({ clk: 100, q: [{ id: "backroom", i: 0, to: 13, at: 0, dur: 50 }, { id: "backroom", i: 0, to: 13, at: 0, dur: 50 }] }); check(w.q.length === 1, "doublon retiré");
w = S.sanitize({ v: 14, savedAt: 1, state: { money: 100, total: 0, bl: { backroom: [12, 3], freight: [6] }, owned: { backroom: 12, freight: 6 }, works: { clk: 10, q: [{ id: "backroom", i: 0, to: 13, at: 1, dur: 50 }, { id: "backroom", i: 1, to: 4, at: 1, dur: 50 }, { id: "freight", i: 0, to: 7, at: 1, dur: 50 }] } } }, 2000).works;
check(w.q.filter(e => e.at !== null).length === 1 && w.q.length === 3, "plus de chantiers démarrés que d'ouvriers : les autres repassent en file");
const many = []; for (let i = 0; i < 40; i++) many.push({ id: "freight", i: 0, to: 7, at: null, dur: 9 }); w = san({ clk: 1, q: many }); check(w.q.length <= 8, "liste énorme : tronquée");
/* sauvegarde → texte → relecture avec chantiers en cours */
s = fresh(); E.setOwned(s, "backroom", 30); W.order(s, "backroom", 0); W.advance(s, 100);
const txt = S.exportText(s, S.defaultSettings()), im2 = S.importText(txt, Date.now()); check(im2.ok && im2.state.works.q.length === 1 && Math.abs(im2.state.works.clk - 100) < 1e-9, "export / import : chantier conservé, avancement compris");
/* tutoriel : le premier achat finit en quelques secondes */
s = E.newState(0); W.order(s, "backroom", 0); W.advance(s, 10); check(E.best(s, "backroom") >= 1, "tutoriel : première salle ouverte en ≤ 10 s");
done("works");
