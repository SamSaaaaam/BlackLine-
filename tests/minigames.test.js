/* Partie 17 · E : mini-jeux — résultats déterministes (graine), scores, récompenses bornées, délais, sauvegarde. */
const { load, check, done } = require("./_load");
const { BL } = load(), E = BL.economy, G = BL.minigames, S = BL.save;
/* 1. crochetage */
const lp = G.genLock(123), lp2 = G.genLock(123); check(JSON.stringify(lp) === JSON.stringify(lp2), "crochetage : même graine → même serrure");
check(JSON.stringify(G.genLock(124)) !== JSON.stringify(lp), "crochetage : autre graine → autre serrure");
check(G.scoreLock(lp, lp.pins.map(p => p.c)).score === 1, "crochetage parfait : 100 %");
check(G.scoreLock(lp, [5, 5, 5, 5]).score === 0 && G.scoreLock(lp, [5, 5, 5]).done, "3 ratés : le ressort lâche, 0 %");
const part = G.scoreLock(lp, [lp.pins[0].c, -1, lp.pins[1].c, -1, -1]); check(part.set === 2 && part.miss === 3 && Math.abs(part.score - 0.25) < 1e-9, "crochetage partiel : 2 goupilles, 3 ratés → 25 %");
check(G.scoreLock(lp, ["x", null, NaN]).score === 0, "entrées hostiles : 0 %, pas d'erreur");
/* 2. plan */
const pl = G.genPlan(7); check(JSON.stringify(pl) === JSON.stringify(G.genPlan(7)), "plan : déterministe");
const bestC = { opt: pl.phases.map(ph => ph.opts.findIndex(o => o.risk === Math.min(...ph.opts.map(q => q.risk)))), role: pl.phases.map(ph => ph.role) };
const worstC = { opt: pl.phases.map(ph => ph.opts.findIndex(o => o.risk === Math.max(...ph.opts.map(q => q.risk)))), role: pl.phases.map(ph => (ph.role + 1) % 3) };
const rb = G.scorePlan(pl, bestC), rw = G.scorePlan(pl, worstC);
check(rb.score === 1 && Math.abs(rb.chance - 0.10) < 1e-9 && rb.heat === -3, "plan parfait : +10 points, chaleur −3");
check(rw.score < 0.15 && rw.chance >= 0 && rw.heat <= 1, "plan bâclé : ≈ 0 point (jamais négatif), chaleur +1 au pire");
check(G.scorePlan(pl, null).score === 0 && G.scorePlan(pl, { opt: [9, 9, 9], role: ["a"] }).heat <= 9, "plan hostile : aucun plantage");
/* 3. interrogatoire */
["indic", "rival", "insp"].forEach(w => { const p = G.genInterro(99, w); check(JSON.stringify(p) === JSON.stringify(G.genInterro(99, w)) && p.rounds.length === 4 && p.rounds.some(r => r.lie) && p.rounds.some(r => !r.lie), "interrogatoire " + w + " : déterministe, au moins un mensonge et une vérité");
  check(G.scoreInterro(p, p.rounds.map(r => ({ q: r.good, v: r.lie ? "lie" : "true" }))).score === 1, "interrogatoire " + w + " : parfait = 100 %");
  check(G.scoreInterro(p, p.rounds.map(r => ({ q: 1 - r.good }))).score === 0.25, w + " : banalités seulement = 25 %");
  check(G.scoreInterro(p, p.rounds.map(r => ({ q: r.good, v: r.lie ? "true" : "lie" }))).score === 0, w + " : tous les jugements faux = 0 %"); });
check(G.genInterro(1, "zzz").who === "indic", "personnage inconnu → indic");
/* 4. comptabilité */
const ac = G.genCompta(5), bad = ac.lines.map((l, i) => l.bad ? i : -1).filter(i => i >= 0);
check(JSON.stringify(ac) === JSON.stringify(G.genCompta(5)) && bad.length === 2 && ac.lines.every(l => l.bad === (l.book !== l.receipt)), "comptabilité : déterministe, 2 lignes fausses exactement");
check(G.scoreCompta(ac, bad).score === 1, "comptabilité parfaite : 100 %");
const one = ac.lines.findIndex(l => !l.bad); check(G.scoreCompta(ac, bad.concat([one])).score === 0.75, "une ligne cochée à tort : −½ point");
check(G.scoreCompta(ac, []).score === 0 && G.scoreCompta(ac, [99, -1, "a", 1.5]).score === 0, "rien / hostile : 0 %");
/* 5. contremaître */
const fm = G.genForeman(11); check(JSON.stringify(fm) === JSON.stringify(G.genForeman(11)) && fm.tasks.reduce((a, t) => a + t.need, 0) === fm.workers, "contremaître : déterministe, besoins = 6 ouvriers");
const perfect = G.scoreForeman(fm, fm.tasks.map(t => t.need)); check(perfect.score === 1 && Math.abs(perfect.pct - 0.2) < 1e-9, "contremaître parfait : −20 % (jamais plus)");
check(Math.abs(G.scoreForeman(fm, [0, 0, 0]).pct - 0.05) < 1e-9, "contremaître raté : −5 % (jamais 0)");
check(Math.abs(G.scoreForeman(fm, fm.tasks.map(t => t.need), true).score - 0.7) < 1e-9, "hors délai : ×0,7");
check(G.scoreForeman(fm, [99, 99, 99]).score === 0, "répartition hostile bornée");
check(G.AUTO === 0.5, "« Résoudre automatiquement » = résultat moyen (50 %)");

/* ===== récompenses appliquées ===== */
function game(extra) { const s = E.newState(0); s.t = 5000; s.money = 1e6; s.total = 1e9; E.setOwned(s, "backroom", 30); Object.assign(s, extra || {}); return s; }
let s = game(); const g0 = s.gold;
/* braquage : seulement pendant un braquage, une fois, avant l'exécution */
check(G.applyHeistLock(s, 1) === null, "crochetage sans braquage en cours : refusé");
s.heist.run = { id: "aurelle", step: 2, pick: ["watch", "duo"], ok: [1, 1], team: [], seed: 777, ch: [50, 50], cost: 0, heat: 0 };
const def = BL.heist.def("aurelle"), c3a = BL.heist.chance(s, def, 3, "silent"), c1a = BL.heist.chance(s, def, 1, "duo");
const hl = G.applyHeistLock(s, 1); check(hl && hl.b === 0.08 && hl.h === 2, "crochetage parfait : +8 points, −2 de chaleur par étape");
check(Math.abs(BL.heist.chance(s, def, 3, "silent") - Math.min(BL.data.heist.params.chanceMax, c3a + 0.08)) < 1e-9 && BL.heist.chance(s, def, 1, "duo") === c1a, "bonus appliqué à l'exécution, pas aux étapes précédentes");
check(G.applyHeistLock(s, 1) === null, "une seule fois par braquage");
s.heist.run.seed = 778; check(BL.heist.chance(s, def, 3, "silent") === c3a, "autre braquage : le bonus ne suit pas");
s.heist.run.step = 4; check(G.applyHeistLock(s, 1) === null, "après l'exécution : trop tard");
/* opérations : plan et crochetage, consommés à la fin */
s = game(); const op = BL.data.equip.OPS.find(o => o.fam === "heist"), opR = BL.data.equip.OPS.find(o => o.fam !== "heist");
check(G.applyPrep(s, "nope", "plan", 1) === null, "opération inconnue : refusé");
check(G.applyPrep(s, opR.id, "lockpick", 1) === null, "crochetage réservé aux braquages");
let pr = G.applyPrep(s, op.id, "plan", 1); check(pr && Math.abs(pr.b - 0.10) < 1e-9 && pr.h === -3, "plan parfait préparé");
pr = G.applyPrep(s, op.id, "lockpick", 1); check(pr && pr.b <= 0.15 + 1e-9 && Math.abs(pr.b - 0.15) < 1e-9 && pr.h === -4, "plan + crochetage : +15 points au plus, chaleur −4 au plus");
check(G.opBonus(s, op.id) === pr.b && G.opBonus(s, opR.id) === 0, "bonus seulement pour l'opération préparée");
BL.heat.state(s).v = 30; G.opDone(s, op.id); check(BL.heat.state(s).v === 26 && !s.mini.prep, "fin de l'opération : chaleur du plan appliquée, préparation consommée");
G.applyPrep(s, opR.id, "plan", 0); BL.heat.state(s).v = 0; G.opDone(s, opR.id); check(BL.heat.state(s).v === 1, "plan bâclé : +1 de chaleur au pire");
/* interrogatoires */
s = game(); BL.heat.state(s).v = 50; s.rivals.st.lames = { p: 60, seen: true };
let inc = E.incomeBase(s), m0 = s.money, r = G.applyInterro(s, "rival", 1); check(r && r.money === Math.floor(inc * 120) && s.money - m0 === r.money, "rival parfait : 120 s de revenus, pas plus");
check(G.applyInterro(s, "rival", 1) === null && G.interroOk(s, "rival").left > 0, "délai d'une heure de jeu");
s.t += 3600; m0 = s.money; G.applyInterro(s, "rival", 0); check(s.money - m0 === Math.floor(E.incomeBase(s) * 30), "rival raté : 30 s de revenus (jamais de perte)");
r = G.applyInterro(s, "indic", 1); check(r && r.heat <= 0 && BL.heat.state(s).v >= 0, "indic : chaleur baisse, jamais sous 0");
s = game(); s.crew.m.rocco = { lv: 1, xp: 0, on: true, loy: 95 }; s.crew.m.gino = { lv: 1, xp: 0, on: true, loy: 40 }; BL.crew.bump(s);
r = G.applyInterro(s, "insp", 1); check(r && r.loy === 10 && s.crew.m.rocco.loy === 100 && s.crew.m.gino.loy === 50, "inspecteur : loyauté +10, plafonnée à 100");
/* comptabilité */
s = game(); BL.heat.state(s).v = 5; r = G.applyCompta(s, "heat", 1); check(r && BL.heat.state(s).v === 0, "comptes « traces » : chaleur −10, jamais sous 0");
check(G.applyCompta(s, "inc", 1) === null, "délai de 30 min de jeu");
s.t += 1800; const i0 = E.grossBase(s); r = G.applyCompta(s, "inc", 1); check(Math.abs(r.mult - 1.06) < 1e-9 && Math.abs(E.grossBase(s) / i0 - 1.06) < 1e-6, "comptes « optimiser » : revenus +6 % au plus");
s.t += 601; check(G.incMul(s) === 1, "bonus de revenus terminé après 10 min");
check(s.gold === g0, "aucun lingot gagné ni dépensé par les mini-jeux");
/* ===== sauvegarde ===== */
s = game(); BL.heist.state(s).run = { id: "aurelle", step: 1, pick: ["watch"], ok: [1], team: [], seed: 555, ch: [50], cost: 0, heat: 0 }; G.applyHeistLock(s, 0.5); G.applyPrep(s, op.id, "plan", 0.5); G.applyCompta(s, "inc", 0.5); G.applyInterro(s, "rival", 0.5);
const back = S.sanitize(S.migrate(JSON.parse(JSON.stringify({ v: 14, savedAt: 1, state: s }))), 2);
const canon = o => JSON.stringify(o, (k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
check(canon(back.mini) === canon(s.mini), "aller-retour : état des mini-jeux identique");
const hostile = [null, 3, "x", [], { n: -5, cd: { compta: 1e300, in_rival: "x" }, hlp: { seed: "a" }, prep: { op: "zzz" }, acc: { until: 1e300, mult: 99 }, best: { plan: 9 } }, { prep: { op: op.id, b: 9, h: -99 }, acc: { until: 99999, mult: 5 }, hlp: { seed: 1, b: 5, h: 50 } }];
hostile.forEach((h, k) => { let ok = true, m; try { m = S.sanitize({ v: 14, savedAt: 1, state: { money: 1, total: 1, t: 100, mini: h } }, 2).mini; } catch (e) { ok = false; }
  check(ok && m && m.n >= 0 && (!m.prep || m.prep.b <= 0.15 && m.prep.h >= -4) && (!m.acc || m.acc.mult <= 1.06 && m.acc.until <= 100 + 600) && (!m.hlp || m.hlp.b <= 0.08 && m.hlp.h <= 2) && Object.values(m.cd).every(v => v <= 100 + 3600) && (m.best.plan === undefined || m.best.plan <= 1), "valeurs hostiles n°" + k + " : bornées"); });
const old = S.sanitize(S.migrate({ v: 13, savedAt: 1, state: { money: 5, total: 5 } }), 2); check(old.mini && old.mini.n === 0 && !old.mini.prep, "ancienne sauvegarde v13 : mini-jeux vides");
done("minigames");
