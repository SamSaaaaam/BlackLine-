/* Partie 19 · F : nouvelles activités, nouveaux bâtiments de quartier, rive sud (3 quartiers).
   Données complètes, déblocage après le niveau d'empire 50, anciennes sauvegardes (valeurs par défaut), identifiants hostiles, achats, conquête, carte. */
const { load, check, done } = require("./_load"), { V13 } = require("./_seed"), { lateState } = require("./_late");
const { BL } = load({ extra: ["js/map-data.js"] }), E = BL.economy, D = BL.data, S = BL.save, T = BL.territory, DB = BL.dbuild, W = BL.works;
const NEW = ["maritime", "shell", "guard"], SOUTH = ["marina", "franche", "faubourg"], TYPES = ["forgery", "pier", "exchange", "hotel", "garrison"];
const rng = v => () => v;

/* ---- données ---- */
check(D.activities.length === 8 && new Set(D.activities.map(a => a.id)).size === 8, "8 activités, identifiants uniques");
NEW.forEach((id, k) => {
  const a = E.find(D.activities, id), prev = D.activities[4 + k];
  check(a && a.unlock && a.unlock.id === prev.id && a.unlock.emp >= 51, id + " : débloquée par " + prev.id + " et le niveau d'empire " + (a && a.unlock.emp));
  check(a.baseCost / a.baseIncome > prev.baseCost / prev.baseIncome, id + " : retour sur investissement plus lent que " + prev.id);
  check(D.upgrades.filter(u => u.req[id]).length === 2, id + " : 2 améliorations u_* associées");
  check(D.data === undefined && BL.heat.params.act[id] !== undefined && W.P.scale[id] > W.P.scale[prev.id] && W.P.offset[id] > 0, id + " : chaleur et chantiers réglés");
  check(/^[^<>]+$/.test(a.name + a.desc + a.cat), id + " : texte sans balise");
});
check(D.upgrades.every(u => Object.keys(u.req).every(k => E.find(D.activities, k))), "toutes les améliorations visent une activité connue");
check(D.territory.districts.length === 11 && SOUTH.every(id => T.dist(id)), "11 quartiers dont la rive sud");
SOUTH.forEach(id => { const d = T.dist(id); check(d.neighbors.every(n => T.dist(n) && T.dist(n).neighbors.indexOf(id) >= 0), id + " : voisins réciproques");
  check(d.req.lvl > 50 && d.req.owned && NEW.indexOf(Object.keys(d.req.owned)[0]) >= 0, id + " : niveau " + d.req.lvl + " et une nouvelle activité requis");
  check(D.war.bosses[id] && DB.slots(id) >= 3 && D.dbuild.style[id].aff.every(t => DB.find(t)), id + " : boss, emplacements et affinités"); });
check(D.dbuild.types.length === 17 && TYPES.every(t => DB.find(t)), "17 types de bâtiments de quartier (+5)");
TYPES.forEach(t => check(D.dbuild.cats.indexOf(DB.find(t).cat) >= 0, t + " : catégorie existante (" + DB.find(t).cat + ")"));
check(E.find(D.achievements, "a8").cond.of === 5 && /cinq premières/.test(E.find(D.achievements, "a8").desc), "succès a8 : toujours les cinq premières activités");

/* ---- déblocage : rien avant le niveau d'empire requis ---- */
let s = E.newState(0); ["backroom", "freight", "fence", "estate", "holding"].forEach(id => E.setOwned(s, id, 25)); s.money = 1e15;
s.total = 9e12; check(E.level(s) === 50 && !E.actUnlocked(s, E.find(D.activities, "maritime")), "niveau 50 : Fret des Brumes verrouillé");
check(!E.buyActivity(s, "maritime", 0) && !W.order(s, "maritime", 0), "achat et chantier refusés tant que c'est verrouillé");
check(/niveau d’empire 51/.test(E.unlockText(s, E.find(D.activities, "maritime"))) && E.unlockProgress(s, E.find(D.activities, "maritime")) < 1, "condition affichée en clair, barre incomplète");
s.total = 1.01e13; check(E.level(s) >= 51 && E.actUnlocked(s, E.find(D.activities, "maritime")), "niveau 51 : Fret des Brumes ouvert");
const m0 = s.money; check(E.buyActivity(s, "maritime", 0) && E.best(s, "maritime") === 1 && m0 - s.money > 1e10, "achat du premier niveau");
const o = W.order(s, "maritime", 0); check(!!o && W.duration("maritime", 0, 2) >= 600, "chantier du niveau 2 commandé (" + Math.round(W.duration("maritime", 0, 2) / 60) + " min)");
check(!E.actUnlocked(s, E.find(D.activities, "shell")), "Banque Aubépine encore verrouillée");
E.setOwned(s, "maritime", 12); check(E.unlocked(s, E.find(D.upgrades, "u_cranes")) && E.unlocked(s, E.find(D.upgrades, "u_pilots")), "améliorations du fret disponibles");
const i0 = E.income(s); check(E.buyUpgrade(s, "u_cranes") && E.income(s) > i0, "Grues de nuit : revenus en hausse");
check(E.progress(s, E.find(D.achievements, "a8").cond).done && !E.progress(s, E.find(D.achievements, "a25").cond).done, "a8 acquis avec 5 activités, a25 demande les 8");

/* ---- anciennes sauvegardes : nouveaux identifiants absents = valeurs par défaut ---- */
const r = S.importText(V13, Date.now()); check(r.ok, "sauvegarde v13 réelle importée");
check(NEW.every(id => (r.state.owned[id] || 0) === 0 && E.levels(r.state, id).length === 0), "nouvelles activités à 0");
check(SOUTH.every(id => T.lv(r.state, id) === 0 && !r.state.districts[id]), "rive sud non contrôlée, aucun bâtiment");
check(JSON.stringify(T.agg(r.state)) === JSON.stringify(T.agg(S.importText(V13, Date.now()).state)), "bonus des quartiers inchangés");
check(SOUTH.every(id => T.state(r.state, T.dist(id)) === "locked"), "rive sud verrouillée sur cette sauvegarde");
/* les factions ne comptent pas encore la rive sud (même équilibre qu'avant) */
const hb = D.territory.factions.map(f => T.held(r.state, f.id)).join("/"); check(D.territory.factions.every(f => T.held(r.state, f.id) === D.territory.districts.filter(d => !d.city && d.holder === f.id && T.lv(r.state, d.id) === 0).length), "factions : rive sud hors jeu avant son niveau (" + hb + ")");

/* ---- identifiants hostiles ou inconnus ---- */
const hostile = JSON.parse(V13), st = hostile.state;
st.bl.maritime = ["x", -4, 1e9]; st.owned.maritime = 1e9; st.bl.zz_inconnue = [5]; st.owned.zz_inconnue = 5;
st.terr.lv.marina = 99; st.terr.lv.zz_quartier = 3; st.terr.imp = { "marina:boost": true, "zz:boost": true };
st.districts = { marina: ["pier:0", "zz_type:1", "pier:2", "hotel:99"], zz_quartier: ["club:0"], franche: ["exchange:0"] };
st.razed = ["marina:99999", "zz:1", "franche:abc", 42];
st.upg = { u_cranes: true, u_zz: true }; st.ach = { a25: true, zz: true };
st.works = { q: [{ id: "guard", i: 0, to: 9999, at: 0, dur: 1e99 }, { id: "zz", i: 0, to: 1, at: 0, dur: 5 }], clk: 0 };
let x; try { x = S.importText(JSON.stringify(hostile), Date.now()); } catch (e) { x = { ok: false, err: e.message }; }
check(x.ok, "sauvegarde hostile acceptée sans plantage" + (x.err ? " (" + x.err + ")" : ""));
const h = x.state;
check(E.levels(h, "maritime").every(n => n >= 0 && n <= 100) && h.owned.maritime <= 100, "niveaux du fret bornés (" + E.levels(h, "maritime").join("/") + ")");
check(!h.bl.zz_inconnue && !h.owned.zz_inconnue, "activité inconnue ignorée");
check(T.lv(h, "marina") === 5 && !("zz_quartier" in h.terr.lv), "contrôle borné à 5, quartier inconnu ignoré");
check(!h.terr.imp["zz:boost"], "amélioration de quartier inconnue ignorée");
check(!h.districts.zz_quartier && !h.districts.franche, "bâtiments d'un quartier inconnu ou non contrôlé retirés");
check((h.districts.marina || []).every(e => DB.find(e.split(":")[0])) && DB.list(h, "marina").length <= DB.slots("marina", h), "bâtiments inconnus retirés, emplacements respectés (" + (h.districts.marina || []).join(",") + ")");
check(h.razed.length === 0, "démolitions invalides retirées");
check(!h.upg.u_zz && !h.ach.zz, "améliorations et succès inconnus ignorés");
check(h.works.q.every(w => E.find(D.activities, w.id) && w.dur <= 86400 && w.to <= 100), "chantiers : identifiant inconnu retiré, durée et niveau bornés");
const txt = S.exportText(h, x.settings), back = S.importText(txt, Date.now()); const strip = q => { const c = JSON.parse(JSON.stringify(q)); delete c.saved; return JSON.stringify(c); };
check(back.ok && strip(back.state) === strip(h), "aller-retour identique après nettoyage");

/* ---- conquête de la rive sud ---- */
const L = lateState({ southFree: true }), s2 = L.s, T2 = L.BL.territory, E2 = L.BL.economy, DB2 = L.BL.dbuild;
s2.bonus.infl = 400;
SOUTH.forEach(id => { const d = T2.dist(id); check(T2.state(s2, d) === "available", id + " : disponible quand les conditions sont remplies (" + T2.missing(s2, d).join(", ") + ")"); });
const before = E2.incomeBase(s2), cm = s2.money, tk = T2.take(s2, "marina", "negotiate", rng(0.5));
check(tk && tk.success && T2.lv(s2, "marina") === 1 && cm - s2.money === T2.takeCost(T2.dist("marina"), "negotiate", s2), "Marina négociée au prix affiché");
check(E2.incomeBase(s2) > before, "bonus de la Marina appliqué aux revenus");
const tf = T2.take(s2, "franche", "force", rng(0.999)); check(tf && !tf.success && T2.lv(s2, "franche") === 0, "Zone franche : échec possible en imposant");
const tf2 = T2.take(s2, "franche", "force", rng(0)); check(tf2 && tf2.success && T2.lv(s2, "franche") === 1, "Zone franche : prise en imposant");
check(T2.invest(s2, "marina") && T2.lv(s2, "marina") === 2, "investissement : contrôle 2");
check(DB2.check(s2, "marina", "pier").ok && DB2.build(s2, "marina", "pier") && DB2.affine("marina", "pier"), "Ponton construit à la Marina (affinité)");
check(!DB2.check(s2, "franche", "forgery").ok && /niveau 2/.test(DB2.check(s2, "franche", "forgery").why), "Faux papiers : contrôle 2 requis");
check(DB2.build(s2, "franche", "exchange") && DB2.defBonus(s2, "franche") === 0, "Bureau de change construit");
T2.invest(s2, "franche"); check(DB2.build(s2, "franche", "garrison") && DB2.defBonus(s2, "franche") > 0.2, "Caserne : défense du quartier en hausse");
check(T2.state(s2, T2.dist("faubourg")) === "available" && T2.take(s2, "faubourg", "negotiate", rng(0.5)).success && T2.count(s2) === 11, "Faubourg pris : 11 quartiers");
check(E2.progress(s2, E2.find(L.BL.data.achievements, "a26").cond).done, "succès « Port-Mirage entière »");
check(L.BL.war.list(s2).filter(b => SOUTH.indexOf(b.id) >= 0).length === 3, "3 boss de plus dans la guerre des quartiers");
check(isFinite(E2.income(s2)) && E2.income(s2) > 0, "revenus finis");
/* plafond de plausibilité du classement (2e11 $/s, aussi dans le SQL) : une partie très avancée reste en dessous */
const far = E2.newState(0); far.total = 1e16; L.BL.data.activities.forEach((a, i) => E2.setLevels(far, a.id, [[100, 100, 100, 100, 100, 60, 45, 30][i], 40, 30, 20])); L.BL.data.upgrades.forEach(u => { if (E2.unlocked(far, u)) far.upg[u.id] = true; }); L.BL.data.territory.districts.forEach(d => { far.terr.lv[d.id] = 5; });
check(E2.income(far) < L.BL.lbCore.C.RATE, "partie extrême (anciennes activités au niveau 100, nouvelles 60/45/30, 11 quartiers au contrôle 5) : " + E2.income(far).toExponential(2) + " $/s < plafond du classement " + L.BL.lbCore.C.RATE.toExponential(0));

/* ---- carte : rien ne bouge pour l'existant ---- */
const M = BL.mapData.build(), lots = {}; M.lots.forEach(l => (lots[l.act] = lots[l.act] || []).push(l.cell));
check(JSON.stringify({ backroom: lots.backroom, freight: lots.freight, fence: lots.fence, estate: lots.estate, holding: lots.holding }) === '{"backroom":[111,115,100,124],"freight":[102,126,137,109],"fence":[117,98,122,104],"estate":[128,135,139,148],"holding":[150,106,130,133]}', "terrains des 5 premières activités : mêmes cellules qu'avant");
check(M.dplots.filter(p => SOUTH.indexOf(p.did) < 0).map(p => p.id + "@" + p.cell).join(" ") === "center#0@53 center#1@42 industrial#0@52 industrial#1@63 industrial#2@77 market#0@58 market#1@43 market#2@32 market#3@45 oldtown#0@49 oldtown#1@60 oldtown#2@74 oldtown#3@28 port#0@83 port#1@70 port#2@66 port#3@55 residential#0@33 residential#1@35 residential#2@9 residential#3@11 business#0@5 business#1@30 business#2@19 business#3@16 prestige#0@0 prestige#1@13 prestige#2@24 prestige#3@27", "emplacements des 8 anciens quartiers : mêmes cellules qu'avant");
check(BL.mapData.COLS === 12 && M.cells.every(c => c.i === c.r * 12 + c.c), "numéro de cellule inchangé (r × 12 + c) : les démolitions sauvegardées restent valides");
const allLots = [].concat(...Object.values(lots)); check(new Set(allLots).size === 32 && NEW.every(id => lots[id] && lots[id].length === 4 && lots[id].every(c => M.cells[c].district === "hq")), "nouvelles activités : 4 terrains chacune sur le QG (cases libres puis extension), aucun doublon");
check(["shell", "guard"].every(id => lots[id].every(c => M.cells[c].r >= 13)), "Banque et Vigilance : dans l'extension du QG (rangées 13-14)");
SOUTH.forEach(id => { const cs = M.cells.filter(c => c.district === id); check(cs.length === 12 && cs.every(c => c.r >= 15) && M.dplots.filter(p => p.did === id).length === 4, id + " : 12 cellules au sud, 4 emplacements"); });
const park = M.cells.find(c => SOUTH.indexOf(c.district) >= 0 && (c.deco === "park" || c.deco === "plaza"));
check(!!park, "rive sud : au moins un parc ou une place à démolir");
if (park) { const s3 = L.s, n0 = DB2.slots(park.district, s3); s3.money = 1e18; check(DB2.raze(s3, park.district, park.i) && DB2.slots(park.district, s3) === n0 + 1, "démolition d'un parc (" + park.district + ", cellule " + park.i + ") : un terrain de plus"); }
check(M.edges.every(e => e.cellIdx.every(i => M.cells[i] && M.cells[i].land)), "routes : toutes bordées de cellules terrestres");
done("endgame");
