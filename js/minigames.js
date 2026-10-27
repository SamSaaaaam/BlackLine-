/* Partie 17 · E : mini-jeux liés à l'histoire (facultatifs, jamais bloquants). Logique pure : génération à partir d'une graine, score 0 à 1, récompenses bornées.
   Règles communes : chaque mini-jeu peut être passé (« Résoudre automatiquement » = score moyen 0,5) ; un mauvais score donne moins de bonus,
   jamais de perte de progression (au pire un peu plus de chaleur pour un plan bâclé) ; jamais de lingots ; violence seulement suggérée.
   1 crochetage (braquage, cambriolage) · 2 plan du coup (opération) · 3 interrogatoire (indic, rival, inspecteur) · 4 comptabilité (Gino) · 5 contremaître (chantier, voir works.js).
   État : s.mini = { n, cd: { clé: temps de jeu de fin }, hlp: { seed, b, h } | null, prep: { op, b, h, lp, plan } | null, acc: { until, mult } | null, best: { jeu: score } }. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function E() { return BL.economy; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, a, b) { return typeof v === "number" && isFinite(v) ? clamp(v, a, b) : d; }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) | 0; var x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var AUTO = 0.5;
  /* récompenses (toutes bornées) ; mesurées par l'audit (tests/simulate.js) */
  var R = {
    lockpick: { heist: 0.08, heistHeat: 2, op: 0.05, opHeat: 1 },             /* braquage : jusqu'à +8 points de chance sur l'exécution et la fuite, −2 de chaleur par étape ; opération : +5 points, −1 */
    plan: { b: 0.10, heatBest: -3, heatWorst: 1 },                            /* opération : 0 à +10 points de chance ; chaleur de +1 (plan bâclé) à −3 */
    interro: { cd: 3600, intel: 20, intelHeat: 3, money: 120, moneyMin: 30, loy: 10, loyMin: 2 },
    compta: { cd: 1800, heat: 10, heatMin: 2, inc: 0.06, incMin: 0.01, dur: 600 },
    foreman: { min: 0.05, max: 0.2 }                                          /* repris de BL.works.P.foreman */
  };
  function st(s) { if (!isObj(s.mini)) s.mini = { n: 0, cd: {}, hlp: null, prep: null, acc: null, best: {} }; return s.mini; }
  function initState(s) { s.mini = { n: 0, cd: {}, hlp: null, prep: null, acc: null, best: {} }; }
  function t(s) { return typeof s.t === "number" && isFinite(s.t) ? s.t : 0; }
  /* graine d'une partie : jamais Math.random (les tests rejouent exactement la même partie) */
  function seedFor(s, kind) { var m = st(s); return hash(kind + ":" + Math.floor(t(s)) + ":" + (m.n || 0)); }
  function cdLeft(s, key) { return Math.max(0, (st(s).cd[key] || 0) - t(s)); }

  /* ===== 1. Crochetage : 5 goupilles ; un repère va et vient, il faut « caler » quand il est dans la zone. 3 ratés : le ressort lâche (on garde ce qui est calé). ===== */
  function genLock(seed) { var r = rng(seed), pins = []; for (var i = 0; i < 5; i++) pins.push({ c: 0.2 + r() * 0.6, w: 0.2 - i * 0.02, sp: 0.55 + r() * 0.35 + i * 0.08 }); return { seed: seed, pins: pins, maxMiss: 3 }; }
  /* presses : positions (0 à 1) du repère au moment de chaque appui */
  function scoreLock(p, presses) {
    var k = 0, miss = 0; (Array.isArray(presses) ? presses : []).forEach(function (x) { if (k >= p.pins.length || miss >= p.maxMiss) return; var q = p.pins[k], v = num(x, -1, -1, 2); if (Math.abs(v - q.c) <= q.w / 2 + EPS) k++; else miss++; });
    return { set: k, miss: miss, done: k >= p.pins.length || miss >= p.maxMiss, score: clamp(k / p.pins.length - 0.05 * miss, 0, 1) };
  }
  /* ===== 2. Plan du coup : 3 phases (entrée, cible, sortie), une approche et un rôle par phase. Chaque choix change la chance et la chaleur affichées. ===== */
  var PLAN = {
    phases: [{ id: "in", name: "Entrée", opts: ["Porte de service", "Toit", "Livraison déguisée"] }, { id: "tg", name: "Cible", opts: ["Coffre principal", "Réserve discrète", "Bureau du gérant"] }, { id: "out", name: "Sortie", opts: ["Ruelle arrière", "Parking souterrain", "Quai de chargement"] }],
    roles: ["Guetteur", "Technicien", "Chauffeur"]
  };
  function genPlan(seed) {
    var r = rng(seed), ph = PLAN.phases.map(function (x) { var risks = shuffle([0.15, 0.45, 0.8], r), heat = risks.map(function (k) { return Math.round(k * 3); }); return { id: x.id, name: x.name, opts: x.opts.map(function (o, i) { return { label: o, risk: risks[i], heat: heat[i] }; }) }; });
    var fit = shuffle([0, 1, 2], r); ph.forEach(function (x, i) { x.role = fit[i]; });   /* le rôle idéal de chaque phase */
    return { seed: seed, phases: ph, roles: PLAN.roles };
  }
  function scorePlan(p, choice) {
    var c = isObj(choice) ? choice : {}, opt = Array.isArray(c.opt) ? c.opt : [], role = Array.isArray(c.role) ? c.role : [], tot = 0, used = {}, heat = 0;
    p.phases.forEach(function (x, i) { var oi = opt[i], ri = role[i], o = x.opts[oi]; if (!o) { tot += 0; heat += 3; return; } var q = 1 - o.risk; if (ri === x.role) q *= 1; else if (typeof ri === "number" && ri >= 0 && ri < 3) q *= 0.6; else q *= 0.4; if (used[ri]) q *= 0.7; used[ri] = 1; tot += q; heat += o.heat; });
    var sc = clamp((tot / p.phases.length - 0.2 * 0.6) / (0.85 - 0.12), 0, 1);   /* 0 = pire plan raisonnable, 1 = plan parfait */
    return { score: sc, chance: R.plan.b * sc, heat: Math.round(R.plan.heatWorst + (R.plan.heatBest - R.plan.heatWorst) * sc) };
  }
  /* ===== 3. Interrogatoire : 4 tours ; choisir la bonne question (celle que le dossier permet de vérifier), puis juger la réponse : vraie ou mensonge. ===== */
  var IN = {
    indic: { name: "L’indic du port", who: "Un indic nerveux, qui vend ce qu’il sait au plus offrant.", reward: "Renseignements : la pression du rival le plus menaçant baisse, et un peu de chaleur avec.",
      facts: [["Le dernier convoi rival est arrivé quai 4.", "Quel quai pour le dernier convoi ?", "Quai 4, comme d’habitude.", "Quai 9, tout au bout."], ["Leur chef de dock s’appelle « le Gris ».", "Qui commande les docks chez eux ?", "Le Gris. Tout le monde le sait.", "Un nouveau, je connais pas son nom."], ["Ils livrent le mardi soir.", "Quel soir pour leurs livraisons ?", "Le mardi, à la nuit tombée.", "Le dimanche matin, au marché."], ["Leur entrepôt a une porte bleue.", "À quoi ressemble leur entrepôt ?", "Une porte bleue, écaillée.", "Un rideau de fer tout neuf."], ["Ils paient leurs guetteurs en espèces.", "Comment paient-ils leurs guetteurs ?", "En liquide, toujours.", "Par virement, comme des gens sérieux."], ["Leur bateau s’appelle la Mouette.", "Quel bateau utilisent-ils ?", "La Mouette, le vieux chalutier.", "L’Albatros, un yacht blanc."]],
      small: ["Il fait froid sur les quais, non ?", "Tu veux un café ?", "Belle soirée, hein ?"], vague: ["Euh… oui. Sans doute.", "Je sais pas, moi.", "Si tu le dis…"] },
    rival: { name: "Un lieutenant rival", who: "Un lieutenant d’une faction rivale, pris à traîner devant tes commerces.", reward: "Argent : il « rembourse » le dérangement (quelques minutes de tes revenus).",
      facts: [["Il conduit une berline grise.", "Quelle voiture conduis-tu ?", "Une berline grise, banale.", "Je prends le bus, monsieur."], ["Il a été vu au casino lundi.", "Où étais-tu lundi soir ?", "Au casino, j’ai perdu un peu.", "Chez ma mère, toute la soirée."], ["Il travaille pour eux depuis 3 ans.", "Depuis quand bosses-tu pour eux ?", "Trois ans, à peu près.", "Je travaille pour personne."], ["Il porte une chevalière au lion.", "D’où vient ta bague ?", "Un cadeau de mon patron. Le lion.", "Quelle bague ? J’en porte pas."], ["Il avait une enveloppe brune.", "Qu’y avait-il dans l’enveloppe ?", "Des factures. Rien d’intéressant.", "Quelle enveloppe ?"], ["Il connaît le gérant de ta salle de jeux.", "Tu connais mon gérant ?", "On a joué aux cartes, une fois.", "Jamais vu ce type."]],
      small: ["Tu fumes ?", "Tu as faim ?", "Joli costume."], vague: ["Pas de commentaire.", "Je réponds pas à ça.", "Demande à mon avocat."] },
    insp: { name: "Un inspecteur trop curieux", who: "Un inspecteur qui pose plus de questions qu’il n’en résout.", reward: "Loyauté : tu sais qui il essayait de retourner ; ton équipe se resserre.",
      facts: [["Il a rencontré un de tes équipiers jeudi.", "Qui avez-vous vu jeudi ?", "Un de vos gars, au café d’en face.", "Personne, j’étais au bureau."], ["Son dossier tient en deux pages.", "Que contient votre dossier ?", "Deux pages, des rumeurs surtout.", "Trois cartons pleins de preuves."], ["Son chef veut des résultats avant l’été.", "Votre chef est pressé ?", "Il veut un nom avant l’été.", "Il s’en moque complètement."], ["Il a promis l’immunité à un témoin.", "Avez-vous un témoin ?", "Quelqu’un qui veut un arrangement.", "Aucun témoin, aucun arrangement."], ["Il gare sa voiture derrière le marché couvert.", "Où garez-vous votre voiture ?", "Derrière le marché couvert.", "Je viens à pied, toujours."], ["Il n’a pas de mandat.", "Avez-vous un mandat ?", "Pas encore. Mais bientôt.", "Bien sûr, il est dans ma poche."]],
      small: ["Un café, inspecteur ?", "Belle cravate.", "Longue journée ?"], vague: ["Je pose les questions ici.", "Ça ne vous regarde pas.", "Nous verrons bien."] }
  };
  function genInterro(seed, who) {
    var d = IN[who] || IN.indic, r = rng(seed), idx = shuffle(d.facts.map(function (_, i) { return i; }), r).slice(0, 4), nl = 1 + Math.floor(r() * 3), lies = shuffle([0, 1, 2, 3], r).slice(0, nl);
    var rounds = idx.map(function (fi, k) { var f = d.facts[fi], lie = lies.indexOf(k) >= 0, good = r() < 0.5 ? 0 : 1, sm = d.small[k % d.small.length]; return { fact: f[0], qs: good === 0 ? [f[1], sm] : [sm, f[1]], good: good, answer: lie ? f[3] : f[2], lie: lie, vague: d.vague[k % d.vague.length] }; });
    return { seed: seed, who: who in IN ? who : "indic", name: d.name, intro: d.who, reward: d.reward, dossier: rounds.map(function (x) { return x.fact; }), rounds: rounds };
  }
  /* réponses : [{ q: indice de la question posée, v: "true" | "lie" }] ; bonne question + bon jugement = 1, bonne question + mauvais jugement = 0, banalité = 0,25 */
  function scoreInterro(p, ans) {
    var tot = 0, a = Array.isArray(ans) ? ans : []; p.rounds.forEach(function (r, i) { var x = isObj(a[i]) ? a[i] : {}; if (x.q !== r.good) { tot += 0.25; return; } var said = x.v === "lie"; tot += said === r.lie ? 1 : 0; });
    return { score: clamp(tot / p.rounds.length, 0, 1) };
  }
  /* ===== 4. Comptabilité avec Gino : un registre de 7 lignes ; repérer les 2 lignes qui ne collent pas aux reçus. ===== */
  var LED = ["Loyer de l’entrepôt", "Fournitures de bureau", "Réparation du camion", "Café et croissants", "Salaire du gardien", "Location de tables", "Électricité de la salle", "Peinture de façade", "Assurance des murs"];
  function genCompta(seed) {
    var r = rng(seed), names = shuffle(LED.slice(), r).slice(0, 7), bad = shuffle([0, 1, 2, 3, 4, 5, 6], r).slice(0, 2);
    var lines = names.map(function (n, i) { var v = (Math.floor(r() * 90) + 10) * 10 + Math.floor(r() * 9) + 1, w = v; if (bad.indexOf(i) >= 0) { var s1 = String(v), k = Math.floor(r() * (s1.length - 1)); var sw = s1.slice(0, k) + s1[k + 1] + s1[k] + s1.slice(k + 2); w = sw === s1 ? v + 90 : +sw; } return { label: n, book: w, receipt: v, bad: w !== v }; });
    return { seed: seed, lines: lines };
  }
  function scoreCompta(p, picks) {
    var sel = Array.isArray(picks) ? picks.filter(function (x, i, a) { return Number.isInteger(x) && x >= 0 && x < p.lines.length && a.indexOf(x) === i; }) : [], good = 0, wrong = 0, nb = p.lines.filter(function (l) { return l.bad; }).length;
    sel.forEach(function (i) { if (p.lines[i].bad) good++; else wrong++; });
    return { score: clamp((good - 0.5 * wrong) / nb, 0, 1), good: good, wrong: wrong };
  }
  /* ===== 5. Contremaître : répartir 6 ouvriers sur 3 tâches (béton, ferraillage, toiture) avant la fin du temps. ===== */
  var TASKS = ["Béton", "Ferraillage", "Toiture", "Électricité"];
  function genForeman(seed) {
    var r = rng(seed), names = shuffle(TASKS.slice(), r).slice(0, 3), need = [1, 2, 3]; shuffle(need, r);
    return { seed: seed, workers: 6, time: 25, tasks: names.map(function (n, i) { return { name: n, need: need[i] }; }) };
  }
  function scoreForeman(p, assign, late) {
    var a = Array.isArray(assign) ? assign : [], miss = 0, sum = 0; p.tasks.forEach(function (tk, i) { var v = Math.floor(num(a[i], 0, 0, p.workers)); sum += v; miss += Math.abs(v - tk.need); });
    if (sum > p.workers) miss += sum - p.workers;
    var sc = clamp(1 - miss / p.workers, 0, 1) * (late ? 0.7 : 1); return { score: sc, pct: R.foreman.min + (R.foreman.max - R.foreman.min) * sc };
  }

  /* ===== récompenses appliquées à l'état (appelées par main.js) ===== */
  function heatAdd(s, d) { if (!BL.heat || !d) return 0; var hs = BL.heat.state(s), v0 = hs.v; hs.v = clamp(hs.v + d, 0, 100); return hs.v - v0; }
  function best(s, kind, sc) { var m = st(s); m.n = (m.n || 0) + 1; m.best[kind] = Math.max(m.best[kind] || 0, sc); }
  /* crochetage d'un braquage en cours (avant l'exécution) : une fois par braquage */
  function heistLockOk(s) { var x = BL.heist && BL.heist.state(s), run = x && x.run; if (!run) return { ok: false, why: "Aucun braquage en cours." }; if (run.step > 3) return { ok: false, why: "Trop tard : l’exécution est passée." }; var m = st(s); if (m.hlp && m.hlp.seed === run.seed) return { ok: false, why: "Serrure déjà travaillée pour ce braquage." }; return { ok: true, run: run }; }
  function applyHeistLock(s, score) { var c = heistLockOk(s); if (!c.ok) return null; var sc = clamp(num(score, AUTO, 0, 1), 0, 1); st(s).hlp = { seed: c.run.seed, b: R.lockpick.heist * sc, h: Math.round(R.lockpick.heistHeat * sc) }; best(s, "lockpick", sc); return st(s).hlp; }
  function heistBonus(s, run, i) { var m = s.mini; return m && m.hlp && run && m.hlp.seed === run.seed && i >= 3 ? m.hlp.b : 0; }
  function heistHeatCut(s, run, i) { var m = s.mini; return m && m.hlp && run && m.hlp.seed === run.seed && i >= 3 ? m.hlp.h : 0; }
  /* préparation d'une opération (plan et/ou crochetage) : vaut pour son prochain lancement */
  function prepOk(s, opId) { var Q = BL.equip, o = Q && Q.op(opId); if (!o) return { ok: false, why: "Opération inconnue." }; if (Q.st(s).op) return { ok: false, why: "Une opération est déjà en cours." }; return { ok: true, op: o }; }
  function prepOf(s, opId) { var p = s.mini && s.mini.prep; return p && p.op === opId ? p : null; }
  function applyPrep(s, opId, kind, score) {
    var c = prepOk(s, opId); if (!c.ok) return null; var sc = clamp(num(score, AUTO, 0, 1), 0, 1), m = st(s); if (!m.prep || m.prep.op !== opId) m.prep = { op: opId, b: 0, h: 0, lp: -1, plan: -1, pb: 0, ph: 0, lb: 0, lh: 0 };
    var p = m.prep; if (kind === "plan") { var r0 = { score: sc, chance: R.plan.b * sc, heat: Math.round(R.plan.heatWorst + (R.plan.heatBest - R.plan.heatWorst) * sc) }; p.plan = sc; p.pb = r0.chance; p.ph = r0.heat; }
    else if (kind === "lockpick") { if (c.op.fam !== "heist") return null; p.lp = sc; p.lb = R.lockpick.op * sc; p.lh = -Math.round(R.lockpick.opHeat * sc); }
    else return null;
    p.b = clamp((p.pb || 0) + (p.lb || 0), 0, 0.15); p.h = clamp((p.ph || 0) + (p.lh || 0), -4, 2); best(s, kind, sc); return p;
  }
  function opBonus(s, opId) { var p = prepOf(s, opId); return p ? p.b : 0; }
  /* fin d'une opération : la chaleur du plan est appliquée, la préparation est consommée */
  function opDone(s, opId) { var p = prepOf(s, opId); if (!p) return 0; var d = heatAdd(s, p.h); s.mini.prep = null; return d; }
  /* interrogatoire : 1 h de jeu entre deux scènes du même personnage */
  function interroOk(s, who) { if (!IN[who]) return { ok: false, why: "Inconnu." }; var l = cdLeft(s, "in_" + who); return l > 0 ? { ok: false, why: "Disponible dans " + Math.ceil(l / 60) + " min de jeu.", left: l } : { ok: true }; }
  function applyInterro(s, who, score) {
    var c = interroOk(s, who); if (!c.ok) return null; var sc = clamp(num(score, AUTO, 0, 1), 0, 1), P = R.interro, out = { who: who, score: sc };
    if (who === "indic") { var top = BL.rivals ? BL.rivals.list(s)[0] : null, cut = Math.round(5 + (P.intel - 5) * sc); if (top && s.rivals && s.rivals.st[top.fid]) { var x = s.rivals.st[top.fid]; x.p = Math.max(0, x.p - cut); out.fid = top.fid; out.press = -cut; } out.heat = heatAdd(s, -Math.round(P.intelHeat * sc)); }
    else if (who === "rival") { var g = Math.floor(Math.max(1, E().incomeBase(s)) * (P.moneyMin + (P.money - P.moneyMin) * sc)); s.money += g; s.total += g; if (s.st) s.st.rewards += g; out.money = g; }
    else { var k = Math.round(P.loyMin + (P.loy - P.loyMin) * sc), mx = BL.bonds ? BL.bonds.params.max : 100, n = 0; if (BL.crew) BL.crew.active(s).forEach(function (mb) { var r = BL.crew.rec(s, mb.id); if (r) { r.loy = clamp((typeof r.loy === "number" ? r.loy : (BL.bonds ? BL.bonds.params.start : 60)) + k, 0, mx); n++; } }); if (n && BL.crew.bump) BL.crew.bump(s); out.loy = k; out.n = n; }
    st(s).cd["in_" + who] = t(s) + P.cd; best(s, "interro", sc); return out;
  }
  /* comptabilité : 30 min de jeu entre deux séances ; but au choix : effacer des traces (chaleur) ou optimiser (revenus +1 à +6 % pendant 10 min) */
  function comptaOk(s) { var l = cdLeft(s, "compta"); return l > 0 ? { ok: false, why: "Gino range encore ses classeurs : " + Math.ceil(l / 60) + " min de jeu.", left: l } : { ok: true }; }
  function applyCompta(s, mode, score) {
    var c = comptaOk(s); if (!c.ok) return null; var sc = clamp(num(score, AUTO, 0, 1), 0, 1), P = R.compta, out = { mode: mode === "heat" ? "heat" : "inc", score: sc };
    if (out.mode === "heat") out.heat = heatAdd(s, -Math.round(P.heatMin + (P.heat - P.heatMin) * sc));
    else { out.mult = 1 + P.incMin + (P.inc - P.incMin) * sc; st(s).acc = { until: t(s) + P.dur, mult: out.mult }; out.dur = P.dur; }
    st(s).cd.compta = t(s) + P.cd; best(s, "compta", sc); return out;
  }
  function incMul(s) { var a = s.mini && s.mini.acc; return a && t(s) < a.until ? a.mult : 1; }

  /* ===== sauvegarde : nettoyage strict ===== */
  function sanitize(r, s) {
    initState(s); var q = isObj(r) && isObj(r.mini) ? r.mini : null; if (!q) return; var m = s.mini, T = t(s);
    m.n = Math.floor(num(q.n, 0, 0, 1e9));
    if (isObj(q.cd)) ["in_indic", "in_rival", "in_insp", "compta"].forEach(function (k) { var v = num(q.cd[k], 0, 0, 1e15); if (v > T) m.cd[k] = Math.min(v, T + Math.max(R.interro.cd, R.compta.cd)); });
    if (isObj(q.hlp) && typeof q.hlp.seed === "number") m.hlp = { seed: Math.floor(num(q.hlp.seed, 0, 0, 4294967295)), b: num(q.hlp.b, 0, 0, R.lockpick.heist), h: Math.floor(num(q.hlp.h, 0, 0, R.lockpick.heistHeat)) };
    if (isObj(q.prep) && typeof q.prep.op === "string" && BL.equip && BL.equip.op(q.prep.op)) m.prep = { op: q.prep.op, b: num(q.prep.b, 0, 0, 0.15), h: Math.round(num(q.prep.h, 0, -4, 2)), lp: num(q.prep.lp, -1, -1, 1), plan: num(q.prep.plan, -1, -1, 1), pb: num(q.prep.pb, 0, 0, R.plan.b), ph: Math.round(num(q.prep.ph, 0, R.plan.heatBest, R.plan.heatWorst)), lb: num(q.prep.lb, 0, 0, R.lockpick.op), lh: Math.round(num(q.prep.lh, 0, -R.lockpick.opHeat, 0)) };
    if (isObj(q.acc) && num(q.acc.until, 0, 0, 1e15) > T) m.acc = { until: Math.min(num(q.acc.until, 0, 0, 1e15), T + R.compta.dur), mult: num(q.acc.mult, 1, 1, 1 + R.compta.inc) };
    if (isObj(q.best)) ["lockpick", "plan", "interro", "compta", "foreman"].forEach(function (k) { if (typeof q.best[k] === "number") m.best[k] = num(q.best[k], 0, 0, 1); });
  }
  BL.minigames = { R: R, AUTO: AUTO, IN: IN, PLAN: PLAN, initState: initState, state: st, seedFor: seedFor, rng: rng, cdLeft: cdLeft,
    genLock: genLock, scoreLock: scoreLock, genPlan: genPlan, scorePlan: scorePlan, genInterro: genInterro, scoreInterro: scoreInterro, genCompta: genCompta, scoreCompta: scoreCompta, genForeman: genForeman, scoreForeman: scoreForeman,
    heistLockOk: heistLockOk, applyHeistLock: applyHeistLock, heistBonus: heistBonus, heistHeatCut: heistHeatCut, prepOk: prepOk, prepOf: prepOf, applyPrep: applyPrep, opBonus: opBonus, opDone: opDone,
    interroOk: interroOk, applyInterro: applyInterro, comptaOk: comptaOk, applyCompta: applyCompta, incMul: incMul, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
