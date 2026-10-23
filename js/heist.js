/* Le grand braquage (Partie 13 · C5) : opération rare en 5 étapes (repérage, équipe, matériel, exécution, fuite). Logique pure, aucun DOM.
   État : s.heist = { run : { id, step, pick [choix], ok [réussites], team [équipiers], seed, ch [chances affichées], cost, heat } | null, cd, done { id : n }, trophies [ids], last : dossier | null }.
   Principes :
   - les tirages viennent d'une graine fixée au départ (id + temps + nombre de braquages) : recharger la page ne change JAMAIS un résultat ;
   - la chance affichée est exactement celle tirée ; elle dépend de l'équipe, de l'Arsenal (objets équipés) et de la chaleur ;
   - un échec réduit le butin et ajoute de la chaleur, mais ne bloque jamais, ne détruit aucun objet et ne fait perdre aucun équipier ;
   - la récompense est versée UNE fois (la run passe à null) ; le trophée n'est donné qu'une fois. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.heist; } function P() { return D().params; } function E() { return BL.economy; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function num(x, a, b, d) { return typeof x === "number" && isFinite(x) ? clamp(x, a, b) : d; }
  function heistDef(id) { var r = null; D().heists.forEach(function (h) { if (h.id === id) r = h; }); return r; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) | 0; var x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function initState(s) { s.heist = { run: null, cd: 0, done: {}, trophies: [], last: null }; }
  function h(s) { if (!s.heist || !isObj(s.heist)) initState(s); return s.heist; }
  function stepOf(def, i) { return def.steps[i] || null; }
  function choiceOf(step, id) { var r = null; step.choices.forEach(function (c) { if (c.id === id) r = c; }); return r; }
  function t(s) { return typeof s.t === "number" && isFinite(s.t) ? s.t : 0; }

  /* ---- Équipe ---- */
  function avail(s) { var Q = BL.equip, C = BL.crew; return C ? C.owned(s).map(function (m) { return m.id; }).filter(function (id) { return Q.available(s, id) && !(BL.heat && BL.heat.isArrested && BL.heat.isArrested(s, id)); }) : []; }
  function topN(s, n) {
    var Q = BL.equip, K = Q.KEYS; return avail(s).map(function (id) { var st = Q.memberStats(s, id), sum = 0; K.forEach(function (k) { sum += st[k]; }); return { id: id, v: sum }; }).sort(function (a, b) { return b.v - a.v || (a.id < b.id ? -1 : 1); }).slice(0, n).map(function (x) { return x.id; });
  }
  /* Couverture : (statistiques de base + objets équipés) / statistiques de base. Sans objet : 1 ; chaque bon objet de l'Arsenal la fait monter. */
  function cover(s, ids, stat) {
    var Q = BL.equip, b = 0, g = 0; ids.forEach(function (id) { if (!Q.available(s, id)) return; var bs = Q.memberBase(s, id), gs = Q.gearStats(s, id); b += bs[stat] || 0; g += gs[stat] || 0; });
    return b > 0 ? clamp(1 + g / b, 1, P().covCap) : 1;
  }
  /* ---- Chances ---- */
  function heatPen(s) { var v = BL.heat ? BL.heat.state(s).v : 0; return clamp(v / 100, 0, 1) * P().heatPen; }
  function sizeBonus(run) { return run && run.team ? 0.04 * (run.team.length - 2) : 0; }
  function chance(s, def, i, choiceId, runX) {
    var step = stepOf(def, i), c = step && choiceOf(step, choiceId); if (!c) return 0; var run = runX || h(s).run, stat = c.stat || step.stat, ids = i === 1 ? topN(s, c.n || 2) : (run && run.team) || [];
    var cov = ids.length && stat ? cover(s, ids, stat) : 1, extra = i >= 3 ? sizeBonus(run) : 0;
    return clamp(P().base + P().slope * (cov - 1) + c.bonus + extra - heatPen(s), P().chanceMin, P().chanceMax);
  }
  /* ---- Disponibilité ---- */
  function why(s) {
    var x = h(s); if (x.run) return "Un braquage est déjà en cours."; var L = E().level(s);
    if (L < P().lvl) return "Niveau d’empire " + P().lvl + " requis (tu es niveau " + L + ")."; if (avail(s).length < 2) return "Il faut au moins deux équipiers disponibles.";
    if (t(s) < x.cd) return "Le quartier est sur ses gardes : encore " + Math.ceil((x.cd - t(s)) / 60) + " min de temps de jeu."; return "";
  }
  function start(s, id) {
    var def = heistDef(id || D().heists[0].id); if (!def || why(s)) return null; var x = h(s);
    x.run = { id: def.id, step: 0, pick: [], ok: [], team: [], seed: hash(def.id + ":" + Math.floor(t(s)) + ":" + (x.done[def.id] || 0)), ch: [], cost: 0, heat: 0 }; return x.run;
  }
  function costOf(s, c) { var inc = Math.max(P().minIncome, E().incomeBase(s)); return Math.round(clamp(c.cost || 0, 0, P().moneyCapMin) * 60 * inc); }
  function current(s) {
    var x = h(s), run = x.run; if (!run) return null; var def = heistDef(run.id); if (!def) return null; var step = stepOf(def, run.step); if (!step) return null;
    var choices = step.choices.map(function (c) {
      var o = { id: c.id, label: c.label, text: c.text, heat: c.heat, cost: costOf(s, c), costMin: c.cost || 0, chance: chance(s, def, run.step, c.id, run), stat: c.stat || step.stat, why: "" };
      if (run.step === 1) { var ids = topN(s, c.n); o.team = ids; if (ids.length < c.n) o.why = "Il te faut " + c.n + " équipiers disponibles (tu en as " + avail(s).length + ")."; }
      if (!o.why && o.cost > 0 && s.money + 1e-9 < o.cost) o.why = "Il te manque de l’argent pour ce choix.";
      return o;
    });
    return { def: def, step: step, index: run.step, total: def.steps.length, run: run, choices: choices };
  }
  /* ---- Un choix : coût, chaleur, tirage fixé par la graine. Retourne le résultat de l'étape ({ ok, ... }), plus le dossier quand c'est la dernière étape. ---- */
  function choose(s, choiceId) {
    var x = h(s), run = x.run; if (!run) return null; var cur = current(s); if (!cur) return null; var c = cur.choices.filter(function (q) { return q.id === choiceId; })[0]; if (!c || c.why) return null;
    var def = cur.def, i = run.step, step = cur.step, cd = choiceOf(step, choiceId), ch = c.chance;
    if (c.cost > 0) { E().spend(s, c.cost); run.cost += c.cost; }
    if (i === 1) run.team = c.team.slice();
    var rolled = rng(run.seed ^ hash(step.id + ":" + choiceId))(), ok = rolled < ch, hp = (cd.heat || 0) + (ok ? 0 : P().failHeat);
    if (BL.heat && hp) { var hs = BL.heat.state(s); hs.v = clamp(hs.v + hp, 0, 100); } run.heat += hp;
    run.pick.push(choiceId); run.ok.push(ok ? 1 : 0); run.ch.push(Math.round(ch * 1000) / 10); run.step = i + 1;
    var res = { ok: ok, step: step, choice: cd, chance: ch, heat: hp, cost: c.cost, last: false };
    if (E().addLog) E().addLog(s, "Braquage · " + step.title + " : " + cd.label + (ok ? " — réussi." : " — raté (butin réduit)."));
    if (run.step >= def.steps.length) { res.last = true; res.report = finish(s, def); }
    return res;
  }
  function finish(s, def) {
    var x = h(s), run = x.run, k = run.ok.reduce(function (a, b) { return a + b; }, 0), mult = P().loot[clamp(k, 0, P().loot.length - 1)], inc = Math.max(P().minIncome, E().incomeBase(s)), money = Math.round(P().rewardMin * 60 * inc * mult), first = x.trophies.indexOf(def.trophy.id) < 0, gold = 0;
    s.money += money; s.total += money;
    if (first) { x.trophies.push(def.trophy.id); if (BL.gold) { gold = Math.min(P().goldFirst, BL.gold.space(s)); s.gold += gold; } }
    x.done[def.id] = Math.min(999, (x.done[def.id] || 0) + 1); x.cd = t(s) + P().cdSec;
    x.last = { id: def.id, title: def.title, t: Math.floor(t(s)), k: k, n: def.steps.length, mult: mult, money: money, gold: gold, trophy: first ? def.trophy.id : "", cost: run.cost, heat: run.heat, steps: def.steps.map(function (st, i) { var c = choiceOf(st, run.pick[i]); return { title: st.title, label: c ? c.label : "", ok: !!run.ok[i], chance: run.ch[i] || 0 }; }) };
    x.run = null; if (E().addLog) E().addLog(s, "Braquage terminé : " + k + " étape(s) sur " + def.steps.length + ", butin " + Math.round(money) + ".");
    return x.last;
  }
  /* Abandon : permis à tout moment, ne rembourse rien, le délai avant un nouveau braquage est réduit de moitié. Aucun butin. */
  function abandon(s) { var x = h(s); if (!x.run) return false; x.run = null; x.cd = t(s) + P().cdSec * P().abandonCdMul; if (E().addLog) E().addLog(s, "Braquage abandonné."); return true; }

  /* ---- Sauvegarde : nettoyage strict ---- */
  function sanitize(r, s) {
    initState(s); if (!isObj(r) || !isObj(r.heist)) return; var q = r.heist, x = s.heist; x.cd = num(q.cd, 0, 1e15, 0);
    if (isObj(q.done)) D().heists.forEach(function (d) { if (typeof q.done[d.id] === "number") x.done[d.id] = Math.floor(num(q.done[d.id], 0, 999, 0)); });
    if (Array.isArray(q.trophies)) q.trophies.slice(0, 20).forEach(function (id) { if (typeof id === "string" && D().heists.some(function (d) { return d.trophy.id === id; }) && x.trophies.indexOf(id) < 0) x.trophies.push(id); });
    if (isObj(q.last) && heistDef(q.last.id)) { var l = q.last, d = heistDef(l.id); x.last = { id: d.id, title: d.title, t: Math.floor(num(l.t, 0, 1e15, 0)), k: Math.floor(num(l.k, 0, d.steps.length, 0)), n: d.steps.length, mult: num(l.mult, 0, 10, 0), money: num(l.money, 0, 1e300, 0), gold: Math.floor(num(l.gold, 0, 100, 0)), trophy: l.trophy === d.trophy.id ? d.trophy.id : "", cost: num(l.cost, 0, 1e300, 0), heat: num(l.heat, 0, 100, 0), steps: [] };
      d.steps.forEach(function (st, i) { var e = Array.isArray(l.steps) && isObj(l.steps[i]) ? l.steps[i] : {}, c = choiceOf(st, typeof e.pick === "string" ? e.pick : ""); x.last.steps.push({ title: st.title, label: typeof e.label === "string" ? String(e.label).slice(0, 60) : "", ok: e.ok === true, chance: num(e.chance, 0, 100, 0) }); }); }
    if (isObj(q.run) && heistDef(q.run.id)) {
      var d2 = heistDef(q.run.id), n = Math.floor(num(q.run.step, 0, d2.steps.length - 1, 0)), run = { id: d2.id, step: 0, pick: [], ok: [], team: [], seed: Math.floor(num(q.run.seed, 0, 4294967295, 0)), ch: [], cost: num(q.run.cost, 0, 1e300, 0), heat: num(q.run.heat, 0, 200, 0) };
      for (var i = 0; i < n; i++) { var pk = Array.isArray(q.run.pick) ? q.run.pick[i] : null; if (typeof pk !== "string" || !choiceOf(d2.steps[i], pk)) break; run.pick.push(pk); run.ok.push(Array.isArray(q.run.ok) && q.run.ok[i] === 1 ? 1 : 0); run.ch.push(num(Array.isArray(q.run.ch) ? q.run.ch[i] : 0, 0, 100, 0)); run.step = i + 1; }
      if (Array.isArray(q.run.team)) q.run.team.slice(0, 4).forEach(function (id) { if (typeof id === "string" && BL.crew && BL.crew.get(id) && run.team.indexOf(id) < 0) run.team.push(id); });
      if (run.step >= 2 && !run.team.length) { run.step = 1; run.pick.length = 1; run.ok.length = 1; run.ch.length = 1; }
      x.run = run;
    }
  }
  BL.heist = { initState: initState, sanitize: sanitize, state: h, def: heistDef, why: why, start: start, current: current, choose: choose, abandon: abandon, chance: chance, avail: avail, topN: topN, cover: cover, heatPen: heatPen };
})(typeof globalThis !== "undefined" ? globalThis : this);
