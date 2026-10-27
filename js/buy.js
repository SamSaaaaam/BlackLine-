/* Partie 19 · A : achat rapide. Logique pure (aucun DOM). Quantité globale (réglage buyqty : "1" | "10" | "25" | "max"),
   prix exact d'un achat ×N (somme des N prix successifs, voir BL.works.canOrder), gain de revenu net, et « meilleur achat maintenant ».
   Le meilleur achat compare le coût ÷ le gain de revenu net par seconde (le plus petit gagne) entre les niveaux de bâtiments (×1),
   les nouveaux bâtiments et les bonus permanents ; il respecte les ouvriers et la file de chantiers (jamais contournés). */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9, QTY = ["1", "10", "25", "max"];
  function E() { return BL.economy; } function W() { return BL.works; } function D() { return BL.data; }
  function qty(v) { return QTY.indexOf(String(v)) >= 0 ? String(v) : "1"; }
  function qArg(q) { q = qty(q); return q === "max" ? "max" : +q; }
  /* gain de revenu net si le bâtiment i passe du niveau n au niveau n2 (l'entretien ne monte que si ce bâtiment devient le meilleur) */
  function gain(s, a, i, n, n2) { var e = E(), b = e.best(s, a.id); return e.bldIncome(s, a, i, n2) - e.bldIncome(s, a, i, n) - (Math.max(b, n2) - b) * a.baseIncome * a.upkeep * e.upkeepMult(s); }
  /* plan d'un achat pour le bâtiment i d'une activité, avec la quantité choisie */
  function plan(s, id, i, q) {
    var a = E().find(D().activities, id); if (!a) return { ok: false, why: "inconnu" }; var c = W() ? W().canOrder(s, id, i, qArg(q)) : null;
    if (!c) return { ok: false, why: "inconnu" }; if (c.k) c.gain = gain(s, a, i, E().bLevel(s, id, i), c.to); c.wait = W() && W().active(s).length >= W().workers(s); return c;
  }
  function eta(s, cost) { var inc = Math.max(E().incomeBase(s), 0); return cost <= s.money ? 0 : inc > 0 ? Math.ceil((cost - s.money) / inc) : Infinity; }
  /* toutes les options ×1 (niveaux, nouveaux bâtiments, bonus permanents), avec coût et gain de revenu net par seconde */
  function options(s) {
    var e = E(), w = W(), out = [], qf = w && w.full(s);
    D().activities.forEach(function (a) {
      if (qf || !e.actUnlocked(s, a)) return; var cnt = e.buildings(s, a.id);
      for (var i = 0; i < Math.max(1, cnt); i++) { var c = w ? w.canOrder(s, a.id, i, 1) : null; if (!c || !c.k) continue; var g = gain(s, a, i, e.bLevel(s, a.id, i), c.to); if (g > EPS) out.push({ kind: "lvl", id: a.id, i: i, name: a.name, cost: c.cost, gain: g, n: 1 }); }
      var nb = e.nextBuilding(s, a); if (nb && nb.ok && !(w && w.busyLot(s, a.id, nb.idx))) { var g2 = e.bldIncome(s, a, nb.idx, 1); if (g2 > EPS) out.push({ kind: "bld", id: a.id, i: nb.idx, name: a.name, cost: nb.cost, gain: g2, n: 1 }); }
    });
    var base = e.incomeBase(s);
    D().upgrades.forEach(function (u) { if (s.upg[u.id] || !e.unlocked(s, u)) return; s.upg[u.id] = true; var g = e.incomeBase(s) - base; delete s.upg[u.id]; if (g > EPS) out.push({ kind: "upg", id: u.id, name: u.name, cost: u.cost, gain: g, n: 1 }); });
    out.forEach(function (o) { o.ratio = o.cost / o.gain; }); return out;
  }
  /* meilleur achat abordable maintenant ; sinon { none:true, eta } (secondes avant le prochain achat possible) */
  function best(s) {
    var o = options(s), aff = o.filter(function (x) { return s.money + EPS >= x.cost; });
    aff.sort(function (x, y) { return x.ratio - y.ratio || x.cost - y.cost || (x.id < y.id ? -1 : 1); });
    if (aff.length) return aff[0];
    var nx = null; o.forEach(function (x) { var t = eta(s, x.cost); if (nx === null || t < nx) nx = t; }); return { none: true, eta: nx };
  }
  BL.buy = { QTY: QTY, qty: qty, plan: plan, gain: gain, options: options, best: best, eta: eta };
})(typeof globalThis !== "undefined" ? globalThis : this);
