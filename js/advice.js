/* « Que faire maintenant ? » : logique pure (aucun accès au DOM). Calcule les meilleures actions du moment à partir de l'état du jeu.
   top(s, n) → [{ id, kind, score, can, cost, gain, eta, act }] ; act décrit l'action directe : { type: "buy"|"build"|"upg"|"claim"|"go", ... }. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function E() { return BL.economy; } function D() { return BL.data; }
  function candidates(s) {
    var out = [], e = E(), d = D(), net = Math.max(e.incomeBase(s), 0), tr = BL.territory, cw = BL.crew;
    function eta(cost) { return cost > s.money && net > 0 ? Math.ceil((cost - s.money) / net) : 0; }
    function add(o) { o.can = o.cost === undefined ? true : s.money + EPS >= o.cost; o.eta = o.cost !== undefined && !o.can ? eta(o.cost) : 0; out.push(o); }
    try { if (s.terr && s.terr.conflict && tr) { var c = s.terr.conflict, dd = tr.dist(c.did); if (dd) add({ id: "conflict", kind: "conflict", score: 100, did: c.did, name: dd.name, act: { type: "go", view: "terr", district: c.did } }); } } catch (x) {}
    try { for (var i = 0; i < d.missions.length; i++) { var m = d.missions[i]; if (!s.claimed[m.id] && e.progress(s, m.cond).done) { add({ id: "claim:" + m.id, kind: "claim", score: 95, name: m.name, reward: m.reward, act: { type: "claim", id: m.id } }); break; } } } catch (x) {}
    try { if (s.pending) { var ev = e.find(d.events, s.pending); if (ev) add({ id: "event", kind: "event", score: 90, name: e.fText(ev.title, s.pendingFac, s.pendingCrew), act: { type: "go", view: "dash" } }); } } catch (x) {}
    /* C14 : ce qui attend vraiment le joueur (opération terminée, rival qui menace, chaleur critique) : lu dans l'état, aucun texte inventé */
    try { if (BL.equip && s.eq) { var os = BL.equip.status(s); var un = BL.results ? BL.results.unseen(s) : [], uo = un.length ? BL.equip.op(un[0].op) : null; if (os.state === "ready") add({ id: "opready", kind: "opready", score: 97, name: os.def ? os.def.name : "Opération", act: { type: "go", view: "ops" } }); else if (uo) add({ id: "opready", kind: "opready", score: 97, name: uo.name, act: { type: "go", view: "ops" } }); } } catch (x) {}
    try { if (BL.rivals && s.rivals && !(s.terr && s.terr.conflict)) { var rl = BL.rivals.list(s).filter(function (r) { return r.p >= BL.rivals.params.threat; })[0]; if (rl) { var rd = tr && tr.dist(rl.did), rf = tr && tr.faction(rl.fid); if (rd && rf) add({ id: "rival:" + rl.fid, kind: "rival", score: 92, name: rf.name, dname: rd.short || rd.name, p: rl.p, act: { type: "go", view: "terr", district: rl.did } }); } } } catch (x) {}
    try { if (BL.heat && s.heat && BL.heat.state(s).v >= 75) add({ id: "heat", kind: "heat", score: 88, name: "Chaleur", v: Math.round(BL.heat.state(s).v), act: { type: "go", view: "map", heat: true } }); } catch (x) {}
    /* achats rentables : meilleur rapport gain / coût en premier */
    var econ = [];
    d.activities.forEach(function (a) {
      if (!e.actUnlocked(s, a)) return;
      var cnt = e.buildings(s, a.id);
      if (cnt === 0) { var c0 = e.cost(a, 0, s), g0 = e.gainOf(s, a, 0) - a.baseIncome * a.upkeep * e.upkeepMult(s); if (g0 > 0) econ.push({ kind: "upgrade", first: true, a: a, i: 0, cost: c0, gain: g0 }); return; }
      for (var i = 0; i < cnt; i++) { var L = e.bLevel(s, a.id, i); if (L >= a.maxLevel) continue; var c1 = e.cost(a, L, s, i), g1 = e.netGainOf(s, a, i); if (g1 > 0) econ.push({ kind: "upgrade", a: a, i: i, cost: c1, gain: g1, level: L }); }
      var nb = e.nextBuilding(s, a); if (nb && nb.ok) { var g2 = e.bldIncome(s, a, nb.idx, 1); if (g2 > 0) econ.push({ kind: "build", a: a, i: nb.idx, cost: nb.cost, gain: g2 }); }
    });
    d.upgrades.forEach(function (u) {
      if (s.upg[u.id] || !e.unlocked(s, u)) return; var base = e.incomeBase(s); s.upg[u.id] = true; var g = e.incomeBase(s) - base; delete s.upg[u.id];
      if (g > 0) econ.push({ kind: "bonus", u: u, cost: u.cost, gain: g });
    });
    econ.forEach(function (x) { x.r = x.gain / Math.max(1, x.cost); });
    econ.sort(function (p, q) { return q.r - p.r; });
    var aff = econ.filter(function (x) { return s.money + EPS >= x.cost; });
    aff.slice(0, 3).forEach(function (x, k) { add(pack(x, 80 - k * 3)); });
    if (!aff.length && econ.length) { var near = econ.slice().sort(function (p, q) { return p.cost - q.cost; })[0], pick = econ[0]; if (near && near.cost < pick.cost * 3) pick = near; add(pack(pick, 40)); }
    function pack(x, score) {
      if (x.kind === "bonus") return { id: "bonus:" + x.u.id, kind: "bonus", score: score, cost: x.cost, gain: x.gain, name: x.u.name, act: { type: "upg", id: x.u.id } };
      if (x.kind === "build") return { id: "build:" + x.a.id, kind: "build", score: score + 2, cost: x.cost, gain: x.gain, name: x.a.name, n: x.i + 1, act: { type: "build", id: x.a.id } };
      return { id: "up:" + x.a.id + ":" + x.i, kind: "upgrade", score: score, cost: x.cost, gain: x.gain, name: x.a.name, n: x.i + 1, first: !!x.first, level: x.level, act: { type: "buy", id: x.a.id, idx: x.i } };
    }
    try { if (tr) { var best = null; d.territory.districts.forEach(function (dist) { if (tr.state(s, dist) === "available") { var c2 = tr.takeCost(dist, "negotiate", s); if (!best || c2 < best.c) best = { d: dist, c: c2 }; } }); if (best && s.money + EPS >= best.c) add({ id: "district:" + best.d.id, kind: "district", score: 65, cost: best.c, name: best.d.name, act: { type: "go", view: "terr", district: best.d.id } }); } } catch (x) {}
    try { if (cw) { var rc = null; d.crew.members.forEach(function (m) { if (cw.state(s, m) === "available" && s.money + EPS >= m.cost && (!rc || m.cost < rc.cost)) rc = m; }); if (rc) add({ id: "crew:" + rc.id, kind: "crew", score: 60, cost: rc.cost, name: rc.name, act: { type: "go", view: "team" } }); } } catch (x) {}
    try { if (BL.gold && s.gold >= BL.gold.capacity(s)) add({ id: "vault", kind: "vault", score: 55, name: "Coffre", act: { type: "go", view: "hq" } }); } catch (x) {}
    return out;
  }
  /* au plus n suggestions, la plus utile d'abord, jamais deux fois la même ; toujours au moins une (économiser) si le joueur peut progresser */
  function top(s, n) {
    var seen = {}, l = candidates(s).sort(function (a, b) { return b.score - a.score || (a.cost || 0) - (b.cost || 0); }).filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
    return l.slice(0, n || 3);
  }
  BL.advice = { top: top, candidates: candidates };
})(typeof globalThis !== "undefined" ? globalThis : this);
