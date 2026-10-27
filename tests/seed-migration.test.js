/* Migration d'une sauvegarde v13 réelle (tests/_seed.js) vers la version actuelle : aucune perte, chantiers vides, aller-retour, valeurs hostiles. */
const { load, check, done } = require("./_load"), { V13 } = require("./_seed");
const { BL } = load(), S = BL.save, E = BL.economy, raw = JSON.parse(V13);
check(raw.v === 13, "graine : sauvegarde v13");
const r = S.importText(V13, Date.now()); check(r.ok, "import accepté");
const s = r.state;
BL.data.activities.forEach(a => { const want = (raw.state.bl[a.id] || []).join("/"); check(E.levels(s, a.id).join("/") === want, a.id + " : niveaux conservés (" + want + ")"); });
check(Math.abs(s.money - raw.state.money) < 1e-6 && Math.abs(s.total - raw.state.total) < 1e-6, "argent et total conservés");
check(Object.keys(raw.state.crew.m).length === 3 && Object.keys(raw.state.crew.m).every(id => s.crew.m[id] && s.crew.m[id].lv === raw.state.crew.m[id].lv), "équipe conservée");
check(JSON.stringify(s.terr.lv) === JSON.stringify(raw.state.terr.lv), "quartiers conservés");
check(Object.keys(raw.state.claimed).every(k => s.claimed[k]), "missions réclamées conservées");
check(s.gold === raw.state.gold && JSON.stringify(s.hq.own || null) === JSON.stringify(raw.state.hq.own || null), "lingots et QG conservés");
check(s.works && s.works.q.length === 0 && s.works.clk === 0, "chantiers vides");
check(s.mini && s.mini.n === 0, "mini-jeux vides");
check(r.settings.name === raw.settings.name && r.settings.lbhome === true, "réglages conservés, nouveau réglage par défaut");
/* aller-retour */
const txt = S.exportText(s, r.settings), r2 = S.importText(txt, Date.now());
check(r2.ok && JSON.parse(txt).v === S.VERSION, "réexport en version " + S.VERSION);
const strip = x => { const c = JSON.parse(JSON.stringify(x)); delete c.saved; return JSON.stringify(c); };
check(strip(r2.state) === strip(s), "aller-retour identique");
/* valeurs hostiles injectées dans la vraie sauvegarde */
const mut = [st => { st.bl.backroom = ["x", -5, 1e9, null]; }, st => { st.works = { q: [{ id: "backroom", i: 0, to: 999, at: -1, dur: 1e99 }], clk: -3 }; }, st => { st.money = -1; st.total = "beaucoup"; }, st => { st.crew = "?"; }, st => { st.terr = null; }, st => { st.mini = { prep: { op: "__proto__" }, acc: { mult: 1e9, until: 1e18 } }; }, st => { st.owned = { holding: 1e9 }; }];
mut.forEach((f, k) => { const e = JSON.parse(V13); f(e.state); let ok = true, x; try { x = S.importText(JSON.stringify(e), Date.now()); } catch (er) { ok = false; }
  check(ok && x.ok && isFinite(x.state.money) && x.state.money >= 0 && E.levels(x.state, "backroom").every(n => n >= 0 && n <= 100) && x.state.works.q.every(w => w.dur <= 86400) && (!x.state.mini.acc || x.state.mini.acc.mult <= 1.06), "valeurs hostiles n°" + k + " dans une vraie sauvegarde : lue sans erreur, bornée"); });
done("seed-migration");
