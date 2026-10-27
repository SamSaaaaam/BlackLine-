/* Partie 19 · E : défis enrichis, série (« streak ») avec pardon, titres locaux, récap du lundi (Paris), sauvegarde v15. */
process.env.TZ = "Europe/Paris";
const { load, check, done } = require("./_load"), { V13 } = require("./_seed");
const { BL, clock } = load(), E = BL.economy, M = BL.meta, F = BL.dfs, S = BL.save, D = BL.data.meta;
const NEW = ["heist", "visit", "cool", "crew", "works", "mini", "income"];
check(Object.keys(D.templates).length === 12 && NEW.every(t => D.templates[t] && D.templates[t].steps.length === 3), "12 modèles (5 + 7 nouveaux), 3 paliers chacun");
check(D.params.dailyGold === 1 && D.params.weeklyGold === 2, "récompenses inchangées : 1 lingot par défi du jour, 2 par défi de la semaine");
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function mid() { const s = E.newState(0); s.total = E.levelAt(35); s.money = 1e12; ["backroom", "freight", "fence", "estate"].forEach(id => E.setOwned(s, id, 20)); ["gino", "rocco", "maya"].forEach(id => s.crew.m[id] = { lv: 1, xp: 0, on: true }); BL.crew.bump(s); s.terr.lv.center = 1; BL.heat.state(s).v = 50; return s; }
/* tirage : déterministe, sans doublon, toujours éligible */
let dup = 0, inel = 0, det = 0, newSeen = {};
for (let d = 0; d < 400; d++) { const key = "2026-" + String(1 + d % 12).padStart(2, "0") + "-" + String(1 + d % 28).padStart(2, "0"), r = rng(d), s = r() < 0.5 ? E.newState(0) : mid(); if (r() < 0.5) BL.heat.state(s).v = r() * 100;
  ["dc", "wc"].forEach(k => { const a = M.pickList(k, key, s), b = M.pickList(k, key, s); if (JSON.stringify(a) !== JSON.stringify(b)) det++; if (new Set(a.map(x => x.t)).size !== a.length) dup++; a.forEach(x => { if (!M.eligible(s, x.t, x.n)) inel++; newSeen[x.t] = 1; }); }); }
check(det === 0 && dup === 0 && inel === 0, "800 tirages : déterministes, sans doublon, jamais impossibles à ce stade");
check(NEW.every(t => newSeen[t]), "chaque nouveau modèle est effectivement tiré (" + Object.keys(newSeen).length + " modèles vus)");
let s0 = E.newState(0); check(!M.pickList("dc", "2026-10-27", s0).some(x => ["ops", "def", "casino", "heist"].includes(x.t)), "début de partie : ni opérations, ni défense, ni casino, ni braquage");
/* chaque nouveau modèle est réalisable : on force le modèle, on joue l'action, le défi se termine */
function force(s, t, n) { const x = { t, n, tg: 0, b: M.metric(s, t), cl: false, hit: false }; x.tg = (function () { const ss = M.state(s); ss.dc = { key: "2026-10-27", list: [x] }; return x; })() && 0; ss2(s, x); return x; }
function ss2(s, x) { const st = D.templates[x.t].steps[x.n]; if (x.t === "cool") x.tg = st; else if (x.t === "income") x.tg = Math.ceil(Math.max(1, E.incomeBase(s)) * st); else x.tg = st; }
function doneNow(s) { M.latch(s); return M.progress(s, "dc", 0).done; }
let s = mid(); force(s, "heist", 0); BL.heist.start(s, "aurelle"); ["watch", "duo", "quiet", "silent", "sewer"].forEach(c => BL.heist.choose(s, c)); check(doneNow(s), "« Grand braquage » réalisable (un braquage terminé)");
s = mid(); force(s, "visit", 2); ["center", "port", "market"].forEach(id => F.visit(s, id, 1.7e12)); check(doneNow(s), "« Tournée » réalisable (3 quartiers différents)");
s = mid(); force(s, "visit", 1); F.visit(s, "center", 1.7e12); F.visit(s, "center", 1.7e12); check(!doneNow(s), "« Tournée » : le même quartier deux fois ne compte qu'une fois par jour");
s = mid(); BL.heat.state(s).v = 70; force(s, "cool", 1); check(!doneNow(s), "« Profil bas » : pas encore (chaleur 70 > 25)"); BL.heat.state(s).v = 20; check(doneNow(s), "« Profil bas » réalisable (chaleur ≤ 25)");
BL.heat.state(s).v = 90; check(M.progress(s, "dc", 0).done, "« Profil bas » reste acquis si la chaleur remonte");
s = mid(); force(s, "crew", 1); BL.crew.recruit(s, "ines"); BL.crew.recruit(s, "theo"); check(doneNow(s), "« Recrutement » réalisable (2 recrues)");
s = mid(); force(s, "works", 0); BL.works.order(s, "backroom", 0, 1); BL.works.order(s, "freight", 0, 1); BL.works.absence(s, 86400); check(doneNow(s), "« Chantiers » réalisable (2 chantiers terminés)");
s = mid(); force(s, "mini", 1); BL.minigames.applyCompta(s, "inc", 0.5); s.t += 4000; BL.minigames.applyInterro(s, "rival", 0.5); check(doneNow(s), "« Savoir-faire » réalisable (2 mini-jeux)");
s = mid(); force(s, "income", 0); check(!doneNow(s), "« Rendement » : pas encore"); let nb = 0; while (!doneNow(s) && nb++ < 200) BL.data.activities.forEach(a => E.buyActivity(s, a.id, 0)); check(doneNow(s), "« Rendement » réalisable (+10 % de revenus, " + nb + " tours d’achats)");
/* série, pardon, horloge */
const day = (y, m, d, h) => new Date(y, m - 1, d, h || 12).getTime();
s = mid(); const st = () => F.state(s).st;
F.onClaim(s, day(2026, 11, 2)); check(st() === 1, "lundi : série 1");
F.onClaim(s, day(2026, 11, 2, 18)); check(st() === 1, "deuxième défi le même jour : série inchangée");
F.onClaim(s, day(2026, 11, 3)); check(st() === 2, "mardi : série 2");
F.onClaim(s, day(2026, 11, 5)); check(st() === 3 && F.state(s).fz === "2026-11-02", "jeudi (mercredi manqué) : pardonné, série 3");
F.onClaim(s, day(2026, 11, 7)); check(st() === 1, "samedi (vendredi manqué, pardon déjà utilisé cette semaine) : série repart à 1");
F.onClaim(s, day(2026, 11, 8)); F.onClaim(s, day(2026, 11, 10)); check(st() === 3, "nouvelle semaine : le pardon revient");
F.onClaim(s, day(2026, 11, 1)); check(st() === 3, "horloge qui recule : la série ne bouge pas");
check(F.current(s, day(2026, 11, 13)) === 0, "série affichée à 0 si elle est rompue");
s = mid(); F.onClaim(s, day(2026, 10, 24, 23)); F.onClaim(s, day(2026, 10, 25, 23)); F.onClaim(s, day(2026, 10, 26, 0)); check(st() === 3, "changement d'heure (25 octobre, jour de 25 h) : jours comptés sans saut ni double");
s = mid(); F.state(s).st = 400; F.onClaim(s, day(2026, 11, 2)); check(F.state(s).st <= F.CAP, "série plafonnée à " + F.CAP);
/* titres locaux */
s = mid(); for (let d = 0; d < 7; d++) F.onClaim(s, day(2026, 11, 2 + d)); check(F.titles(s).map(t => t.id).join(",").includes("s3") && F.titles(s).some(t => t.id === "s7"), "titres « Régulier » et « Assidu » obtenus localement");
check(!F.TITLES.some(t => /top|rang|classement/i.test(t.name + t.text)), "aucun titre qui dépendrait du serveur (pas de « Top 3 »)");
/* récap du lundi, heure de Paris (même règle que le classement) */
s = mid(); s.total = 1000; F.roll(s, day(2026, 11, 8, 23)); s.total = 6000; F.onClaim(s, day(2026, 11, 8, 23)); check(!F.roll(s, new Date(2026, 10, 8, 23, 59).getTime()), "dimanche 23 h 59 : pas encore de récap");
const rc = F.roll(s, new Date(2026, 10, 9, 0, 1).getTime()); check(rc && rc.key === "2026-11-02" && rc.n === 1 && rc.gain === 5000, "lundi 0 h 01 (Paris) : récap de la semaine (défis, gain)");
check(BL.lbCore.weekKey(new Date(2026, 10, 9, 0, 1).getTime()) === "2026-11-09", "même clé de semaine que le classement");
check(F.recap(s) && (F.seen(s), !F.recap(s)), "récap affiché une seule fois");
/* lingots : rien de plus */
s = mid(); M.ensure(s, new Date(2026, 10, 2, 12)); const g0 = s.gold; let gained = 0; ["dc", "wc"].forEach(k => s.meta[k].list.forEach((x, i) => { x.b = -1e30; x.hit = true; const r = M.claim(s, k, i, day(2026, 11, 2)); if (r) gained += r.gold; }));
check(gained === 3 * 1 + 2 * 2 && s.gold - g0 === gained, "tous les défis d'un jour + de la semaine : 7 lingots, comme avant");
/* sauvegarde v15 */
check(S.VERSION === 15, "sauvegarde v15");
s = mid(); for (let d = 0; d < 4; d++) F.onClaim(s, day(2026, 11, 2 + d)); F.visit(s, "port", day(2026, 11, 5));
const back = S.sanitize(S.migrate(JSON.parse(JSON.stringify({ v: 15, savedAt: 1, state: s }))), 2); check(JSON.stringify(back.dfs) === JSON.stringify(s.dfs), "aller-retour : série, titres, visites identiques");
const v14 = { v: 14, savedAt: 1, state: { money: 5, total: 5, works: { q: [], clk: 3, fcd: 0 } } }, m14 = S.migrate(JSON.parse(JSON.stringify(v14))); check(m14.v === 15, "migration 14 → 15");
const b14 = S.sanitize(m14, 2); check(b14.dfs.st === 0 && b14.dfs.ti.length === 0 && b14.works.n === 0, "v14 : série 0, titres vides, compteur de chantiers 0");
const imp = S.importText(V13, Date.now()); check(imp.ok && imp.state.dfs.st === 0, "import d'une vraie sauvegarde v13 → v15");
const hostile = [null, 3, "x", [], { st: 1e9, best: -4, last: "hier", fz: 5, vis: NaN, ti: ["s3", "top3", "__proto__", 7, "s3"], wk: { key: "x" }, rc: { key: "2026-11-02", n: -1, gain: Infinity, st: 1e5 }, vd: { k: "2026-11-02", ids: ["port", "atlantis", 3] } }];
hostile.forEach((h, k) => { let ok = true, d; try { d = S.sanitize({ v: 15, savedAt: 1, state: { money: 1, total: 1, dfs: h } }, 2).dfs; } catch (e) { ok = false; }
  check(ok && d.st >= 0 && d.st <= F.CAP && d.best >= d.st && d.ti.every(id => F.TITLES.some(t => t.id === id)) && new Set(d.ti).size === d.ti.length && (!d.rc || isFinite(d.rc.gain) && d.rc.n >= 0) && (!d.vd || d.vd.ids.every(id => typeof id === "string" && id !== "atlantis")), "valeurs hostiles n°" + k + " : bornées, titres connus seulement"); });
const lst = S.sanitize({ v: 15, savedAt: 1, state: { money: 1, total: 1, meta: { dc: { key: "2026-11-02", list: [{ t: "heist", n: 9, tg: -5, b: "x", hit: "oui" }, { t: "zzz" }, { t: "heist" }] } } } }, 2).meta.dc;
check(lst.list.length === 1 && lst.list[0].n === 2 && lst.list[0].tg >= 1 && lst.list[0].hit === false, "défis enregistrés hostiles : modèle inconnu et doublon retirés, valeurs bornées");
done("challenges");
