/* Joueur simulé « optimisé » pour l'audit d'économie (Partie 17, réécrit : l'ancien tests/simulate.js n'est pas dans le dépôt).
   Il joue seulement le cœur de l'économie : niveaux des bâtiments, bâtiments annexes, améliorations, missions, succès.
   Il ne recrute pas, ne prend pas de quartiers, ne lance pas d'opérations : ses revenus sont donc PLUS BAS qu'un vrai joueur actif,
   ce qui rend les mesures relatives (avant / après) fiables, mais pas les durées absolues.
   Achat : parmi ce qui est débloqué, celui qui minimise « attente pour pouvoir le payer + temps de retour sur investissement ».
   Chantiers (Partie 17 · D) : si BL.works existe, un achat de niveau passe par la file de chantiers (opts.works), sinon il est instantané. */
function makeBot(BL, s, opts) {
  opts = opts || {}; const E = BL.economy, D = BL.data, W = opts.works !== false ? BL.works : null;
  const stats = { buys: 0, waitMax: 0, lastBuyT: 0, firstAt: {}, idle: 0, bribes: 0, bribeSpent: 0, foreman: 0, idleSpans: [], idleCur: 0, idleStart: 0, gaps: [], lastOrderT: 0 };
  /* aides aux chantiers (opts.foreman = score 0..1 du mini-jeu, joué dès qu'il est prêt sur le chantier le plus long ; opts.bribe = part max de l'argent pour un pot-de-vin) */
  function helpers() {
    if (!W) return; const act = W.active(s); if (!act.length) return;
    if (opts.foreman !== undefined && opts.foreman !== null && W.foremanReady(s)) { const e = act.slice().sort((a, b) => W.left(s, b) - W.left(s, a))[0]; if (W.left(s, e) > 30 && W.foreman(s, e.id, e.i, opts.foreman)) stats.foreman++; }
    if (opts.bribe) act.forEach(e => { const b = W.bribeInfo(s, e); if (b.ok && b.cost <= s.money * opts.bribe && b.cut >= 30) { const r = W.bribe(s, e.id, e.i); if (r) { stats.bribes++; stats.bribeSpent += r.cost; } } });
  }
  function inc() { return Math.max(E.income(s), 1e-9); }
  function busy(id, i) { return W ? W.busyLot(s, id, i) : false; }
  function candidates() {
    const out = [];
    const qfull = W && W.full(s);   /* file de chantiers pleine : seuls les bonus permanents restent achetables */
    D.activities.forEach(a => {
      if (qfull || !E.actUnlocked(s, a)) return; const L = E.levels(s, a.id);
      if (!L.length) { if (busy(a.id, 0)) return; const c = E.cost(a, 0, s, 0); out.push({ k: "act", id: a.id, i: 0, cost: c, gain: Math.max(1e-9, E.bldIncome(s, a, 0, 1) - a.baseIncome * a.upkeep * E.upkeepMult(s)) }); return; }
      L.forEach((n, i) => { if (n >= a.maxLevel || busy(a.id, i)) return; out.push({ k: "act", id: a.id, i, cost: E.cost(a, n, s, i), gain: Math.max(1e-9, E.netGainOf(s, a, i)) }); });
      const nb = E.nextBuilding(s, a); if (nb && nb.ok && !busy(a.id, nb.idx)) out.push({ k: "bld", id: a.id, i: nb.idx, cost: nb.cost, gain: Math.max(1e-9, E.bldIncome(s, a, nb.idx, 1)) });
    });
    const base = E.income(s);
    D.upgrades.forEach(u => {
      if (s.upg[u.id] || !E.unlocked(s, u)) return; s.upg[u.id] = true; let g = E.income(s) - base; s.upg[u.id] = false;
      if (u.fx.cost) g = Math.max(g, base * (1 - u.fx.cost) * 0.6); if (u.fx.rep || u.fx.infl) g = Math.max(g, base * 0.03);
      out.push({ k: "upg", id: u.id, cost: u.cost, gain: Math.max(1e-9, g) });
    });
    return out;
  }
  /* sans chantiers : retour sur investissement (attente + coût / gain).
     avec chantiers, quand l'argent n'est plus le facteur limitant : le meilleur gain par seconde de chantier (le temps des ouvriers est la ressource rare). */
  function pick() {
    const r = inc(); let best = null, bs = Infinity;
    candidates().forEach(c => {
      const wait = Math.max(0, (c.cost - s.money) / r); let sc = wait + c.cost / c.gain;
      if (W && c.k !== "upg" && wait === 0) { const d = c.k === "bld" ? W.duration(c.id, c.i, 1) : W.duration(c.id, c.i, (E.bLevel(s, c.id, c.i) || 0) + 1); sc = Math.min(sc, d / Math.max(1e-9, c.gain / r) * 1e-3); }
      if (sc < bs) { bs = sc; best = c; } });
    return best;
  }
  function buy(c) {
    let ok;
    if (c.k === "upg") ok = E.buyUpgrade(s, c.id);
    else if (W) ok = c.k === "bld" ? W.orderBuilding(s, c.id) : W.order(s, c.id, c.i);
    else ok = c.k === "bld" ? E.buyBuilding(s, c.id) : E.buyActivity(s, c.id, c.i);
    if (ok) { stats.buys++; stats.waitMax = Math.max(stats.waitMax, s.t - stats.lastBuyT); stats.lastBuyT = s.t;
      if (c.k !== "upg") { stats.gaps.push([stats.lastOrderT, s.t - stats.lastOrderT]); stats.lastOrderT = s.t; } }
    return ok;
  }
  function housekeeping() {
    D.missions.forEach(m => { if (!s.claimed[m.id]) E.claim(s, m.id); }); E.checkAch(s);
    D.activities.forEach(a => E.levels(s, a.id).forEach((n, i) => { [5, 10, 25, 50, 100].forEach(L => { const k = a.id + (i ? "#" + (i + 1) : "") + "@" + L; if (n >= L && stats.firstAt[k] === undefined) stats.firstAt[k] = s.t; }); }));
  }
  /* avance de `sec` secondes de jeu actif */
  function run(sec) {
    const end = s.t + sec;
    while (s.t < end - 1e-6) {
      housekeeping();
      helpers();
      let c = pick(), guard = 0;
      while (c && s.money + 1e-9 >= c.cost && guard++ < 50) { if (!buy(c)) break; housekeeping(); c = pick(); }
      /* pas d'achat possible : on avance jusqu'à pouvoir payer, ou jusqu'à la fin du prochain chantier (au plus 60 s, au moins 0,5 s) */
      let dt = c ? (c.cost - s.money) / inc() : 60;
      if (W) { const nx = W.nextEnd(s); if (nx !== null) dt = Math.min(dt, Math.max(0.5, nx - W.now(s))); }
      dt = Math.max(0.5, Math.min(60, dt, end - s.t));
      /* attente forcée : plus aucun chantier commandable (file pleine, ou tous les bâtiments déjà en chantier) */
      if (W && !candidates().some(x => x.k !== "upg")) { if (!stats.idleCur) stats.idleStart = s.t; stats.idleCur += dt; stats.idle += dt; } else if (stats.idleCur) { stats.idleSpans.push([stats.idleStart, stats.idleCur]); stats.idleCur = 0; }
      step(dt);
    }
  }
  function step(dt) { E.tick(s, dt); if (W) W.advance(s, dt); }
  return { s, run, stats, pick, step, housekeeping };
}
module.exports = { makeBot };
