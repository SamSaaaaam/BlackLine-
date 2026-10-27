/* Partie 17 · D : chantiers. Logique pure (aucun DOM, aucun stockage).
   Acheter ou améliorer un bâtiment d'activité n'est plus instantané : le prix est payé tout de suite, puis le bâtiment passe en chantier.
   - Pendant le chantier, le bâtiment continue de produire à son niveau ACTUEL ; le niveau cible n'est appliqué qu'à la fin.
   - Ouvriers = chantiers simultanés : 1 au départ, puis 2 et 3 gagnés par le niveau d'empire (jamais en lingots). Au-delà, file d'attente (payée d'avance).
   - Le temps des chantiers avance en jeu ET hors ligne à 100 % (horloge propre s.works.clk, qui n'avance jamais en arrière ; une absence compte au plus 24 h).
   - Raccourcis : mini-jeu « Contremaître » (−5 à −20 % du temps restant, délai de récupération) et pot-de-vin en argent du jeu (coût croissant, jamais jusqu'au bout).
     Jamais de lingots.
   État : s.works = { q: [{ id, i, to, at, dur, b }], clk, fcd } ; at = horloge de début (null = en file), dur = durée en secondes, b = pots-de-vin déjà versés. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function E() { return BL.economy; } function D() { return BL.data; }
  var P = {
    /* niveau visé → secondes (salle de jeux, bâtiment principal) ; interpolation logarithmique entre deux points */
    anchors: [[1, 2], [2, 3], [3, 4], [5, 6], [10, 40], [15, 75], [20, 150], [25, 300], [30, 600], [40, 1500], [50, 3000], [60, 6000], [70, 9000], [80, 14400], [90, 21600], [100, 28800]],
    scale: { backroom: 1, freight: 1.3, fence: 1.7, estate: 2.2, holding: 2.8 },   /* les activités avancées sont plus lentes */
    annex: 0.75,              /* bâtiments 2 à 4 (moins chers, moins rentables) : un peu plus rapides */
    maxDur: 86400,            /* plafond absolu : 24 h par chantier */
    workers: [1, 3, 8],       /* niveau d'empire requis pour le 1er, 2e et 3e ouvrier (≈ 15 min et ≈ 1 h de jeu actif) */
    queueMax: 5,              /* chantiers en attente au plus (en plus de ceux en cours) */
    absenceMax: 86400,        /* une absence (ou un saut d'horloge) compte au plus 24 h pour les chantiers */
    bribe: { cut: 0.3, per: 3, floor: 100, costSec: 1, grow: 1.6, minLeft: 5, minFrac: 0.1 },
    foreman: { min: 0.05, max: 0.2, cd: 600 }
  };
  function num(v, d, max) { return typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(v, max === undefined ? 1e300 : max) : d; }
  function act(id) { return E().find(D().activities, id); }
  function st(s) { if (!s.works || typeof s.works !== "object") s.works = { q: [], clk: 0, fcd: 0 }; return s.works; }
  function initState(s) { s.works = { q: [], clk: 0, fcd: 0, n: 0 }; }   /* n : chantiers terminés (défi « Chantiers », Partie 19) */
  function durAt(L) {
    var A = P.anchors; L = Math.max(1, L);
    if (L <= A[0][0]) return A[0][1];
    for (var k = 1; k < A.length; k++) if (L <= A[k][0]) { var a = A[k - 1], b = A[k], t = (L - a[0]) / (b[0] - a[0]); return Math.exp(Math.log(a[1]) + t * (Math.log(b[1]) - Math.log(a[1]))); }
    return A[A.length - 1][1];
  }
  /* durée du chantier qui amène le bâtiment i de l'activité au niveau `to` (nouveau bâtiment : to = 1, durée du palier qui le débloque) */
  function duration(id, i, to) {
    var a = act(id); if (!a) return 0; var ref = to; if (to === 1 && i > 0) ref = E().BLD_NEED[i] || 1;
    return Math.round(Math.min(P.maxDur, Math.max(1, durAt(ref) * (P.scale[id] || 1) * (i > 0 ? P.annex : 1))));
  }
  function workers(s) { var L = E().level(s), n = 0; P.workers.forEach(function (lv) { if (L >= lv) n++; }); return Math.max(1, n); }
  function nextWorker(s) { var L = E().level(s); for (var k = 0; k < P.workers.length; k++) if (L < P.workers[k]) return P.workers[k]; return null; }
  function list(s) { return st(s).q; }
  function active(s) { return list(s).filter(function (e) { return e.at !== null; }); }
  function waiting(s) { return list(s).filter(function (e) { return e.at === null; }); }
  function entry(s, id, i) { var q = list(s); for (var k = 0; k < q.length; k++) if (q[k].id === id && q[k].i === i) return q[k]; return null; }
  function busyLot(s, id, i) { return !!entry(s, id, i); }
  function now(s) { return st(s).clk; }
  function left(s, e) { return e.at === null ? e.dur : Math.max(0, e.at + e.dur - st(s).clk); }
  function progress(s, e) { return e.at === null ? 0 : Math.max(0, Math.min(1, (st(s).clk - e.at) / Math.max(EPS, e.dur))); }
  function full(s) { return waiting(s).length >= P.queueMax && active(s).length >= workers(s); }
  function nextEnd(s) { var m = null; active(s).forEach(function (e) { var t = e.at + e.dur; if (m === null || t < m) m = t; }); return m; }
  /* démarre les chantiers en attente tant qu'il reste des ouvriers ; t = horloge de démarrage */
  function fill(s, t) { var w = workers(s), a = active(s).length; list(s).forEach(function (e) { if (e.at === null && a < w) { e.at = t; a++; } }); }
  /* commande : vérifie exactement ce que vérifiait l'achat instantané, paie, met en chantier (ou en file) */
  /* Partie 19 · A : achat ×N. Prix = somme exacte des N prix successifs ; durée = somme des N durées successives (comme N chantiers à la suite).
     Règle simple : si cette somme dépasse 24 h, la quantité est réduite au plus grand N qui tient dans 24 h (le plafond ne fait jamais gagner de temps).
     qty : 1, 10, 25… ou "max" (le plus grand N abordable). Toujours plafonné au niveau maximal (100). */
  function canOrder(s, id, i, qty) {
    var a = act(id); if (!a) return { ok: false, why: "inconnu" }; var e = E(), c0 = e.buildings(s, id);
    if (i === undefined) i = 0; if (!Number.isInteger(i) || i < 0 || i >= Math.max(1, c0) || !e.actUnlocked(s, a)) return { ok: false, why: "lot" };
    if (busyLot(s, id, i)) return { ok: false, why: "busy" };
    var n = e.bLevel(s, id, i); if (n >= a.maxLevel) return { ok: false, why: "max" };
    if (full(s)) return { ok: false, why: "full" };
    var max = qty === "max", want = max ? a.maxLevel - n : Math.max(1, Math.floor(+qty) || 1), cost = 0, dur = 0, k = 0, lim = "", best = null;
    for (var j = 0; j < a.maxLevel - n; j++) {
      var c1 = e.cost(a, n + j, s, i), d1 = duration(id, i, n + j + 1);
      if (j > 0 && dur + d1 > P.maxDur) { lim = "dur"; break; }
      if (max && j > 0 && s.money + EPS < cost + c1) break;
      cost += c1; dur += d1; k = j + 1; if (!max && k >= want) break;
    }
    if (!max && k < want && !lim) lim = "lvl";
    return { ok: s.money + EPS >= cost, why: s.money + EPS >= cost ? "" : "money", cost: cost, to: n + k, i: i, dur: dur, k: k, want: max ? "max" : want, lim: lim, missing: Math.max(0, cost - s.money) };
  }
  function push(s, id, i, to, cost, dur) {
    E().spend(s, cost); var W = st(s), e = { id: id, i: i, to: to, at: null, dur: dur || duration(id, i, to), b: 0 }; W.q.push(e); fill(s, W.clk); return e;
  }
  function order(s, id, i, qty) { var c = canOrder(s, id, i, qty); if (!c.ok) return null; return push(s, id, c.i, c.to, c.cost, c.dur); }
  function canBuilding(s, id) {
    var a = act(id); if (!a) return { ok: false, why: "inconnu" }; var nb = E().nextBuilding(s, a); if (!nb || !nb.ok) return { ok: false, why: "lot" };
    if (busyLot(s, id, nb.idx)) return { ok: false, why: "busy" }; if (full(s)) return { ok: false, why: "full" };
    return { ok: s.money + EPS >= nb.cost, why: s.money + EPS >= nb.cost ? "" : "money", cost: nb.cost, to: 1, i: nb.idx, dur: duration(id, nb.idx, 1) };
  }
  function orderBuilding(s, id) { var c = canBuilding(s, id); if (!c.ok) return null; return push(s, id, c.i, 1, c.cost); }
  /* fin d'un chantier : le niveau cible est appliqué (un nouveau bâtiment apparaît au niveau 1) */
  function apply(s, e) {
    var e0 = E(), arr = e0.levels(s, e.id).slice(); if (e.i > arr.length) return false;
    if ((arr[e.i] || 0) >= e.to) return false; arr[e.i] = e.to; e0.setLevels(s, e.id, arr); return true;
  }
  /* avance l'horloge des chantiers de dt secondes ; termine dans l'ordre chronologique (plusieurs fins pendant une absence comprises) */
  function advance(s, dt) {
    var W = st(s), done = []; if (!(dt > 0) || !isFinite(dt)) return done; var target = W.clk + dt, guard = 0; fill(s, W.clk);   /* ouvrier gagné entre-temps : la file repart */
    while (guard++ < 200) {
      var nx = null, ne = null; active(s).forEach(function (e) { var t = e.at + e.dur; if (nx === null || t < nx) { nx = t; ne = e; } });
      if (nx === null || nx > target + EPS) break;
      W.clk = Math.max(W.clk, nx); W.q.splice(W.q.indexOf(ne), 1); if (apply(s, ne)) { W.n = Math.min(1e9, (W.n || 0) + 1); done.push({ id: ne.id, i: ne.i, to: ne.to, at: nx }); } fill(s, W.clk);
    }
    W.clk = Math.max(W.clk, target); return done;
  }
  /* absence (hors ligne, veille, onglet gelé) : 100 % du temps, au plus 24 h ; horloge qui recule : rien */
  function absence(s, sec) { var x = typeof sec === "number" && isFinite(sec) ? Math.max(0, Math.min(P.absenceMax, sec)) : 0; return advance(s, x); }
  /* ouvrier gagné (niveau d'empire) : un chantier en file démarre tout de suite */
  function sync(s) { fill(s, st(s).clk); }

  /* ---- pot-de-vin : −30 % du temps restant, 3 fois au plus par chantier, jamais jusqu'au bout ; prix = revenus nets × secondes gagnées × 1,6^(pots déjà versés) ---- */
  function bribeInfo(s, e) {
    if (!e || e.at === null) return { ok: false, why: "wait" }; var B = P.bribe, l = left(s, e), floor = Math.max(B.minLeft, e.dur * B.minFrac), cut = Math.min(l * B.cut, l - floor);
    if ((e.b || 0) >= B.per) return { ok: false, why: "max" }; if (cut < 1) return { ok: false, why: "short" };
    var cost = Math.ceil(Math.max(B.floor, E().incomeBase(s) * cut * B.costSec) * Math.pow(B.grow, e.b || 0));
    return { ok: s.money + EPS >= cost, why: s.money + EPS >= cost ? "" : "money", cost: cost, cut: cut, left: l };
  }
  function bribe(s, id, i) { var e = entry(s, id, i), b = bribeInfo(s, e); if (!b.ok) return null; E().spend(s, b.cost); e.dur -= b.cut; e.b = (e.b || 0) + 1; return { cost: b.cost, cut: b.cut, left: left(s, e) }; }
  /* ---- contremaître (mini-jeu) : score 0 à 1 → −5 à −20 % du temps restant, puis 10 min de récupération (horloge des chantiers) ---- */
  function foremanReady(s) { return st(s).clk >= (st(s).fcd || 0); }
  function foremanWait(s) { return Math.max(0, (st(s).fcd || 0) - st(s).clk); }
  function foremanPct(score) { var f = P.foreman, x = typeof score === "number" && isFinite(score) ? Math.max(0, Math.min(1, score)) : 0; return f.min + (f.max - f.min) * x; }
  function foreman(s, id, i, score) {
    var e = entry(s, id, i); if (!e || e.at === null || !foremanReady(s)) return null; var pct = foremanPct(score), l = left(s, e), cut = l * pct;
    e.dur -= cut; st(s).fcd = st(s).clk + P.foreman.cd; return { pct: pct, cut: cut, left: left(s, e) };
  }

  /* ---- sauvegarde : nettoyage strict à la lecture (après la reconstruction des niveaux) ---- */
  function sanitize(r, s) {
    initState(s); var w = r && r.works; if (!w || typeof w !== "object" || Array.isArray(w)) return;
    var W = s.works; W.clk = num(w.clk, 0, 1e11); W.n = Math.floor(num(w.n, 0, 1e9)); W.fcd = Math.min(num(w.fcd, 0, 1e11), W.clk + P.foreman.cd);
    if (!Array.isArray(w.q)) return; var seen = {}, out = [];
    w.q.slice(0, 32).forEach(function (x) {
      if (!x || typeof x !== "object" || Array.isArray(x)) return; var a = typeof x.id === "string" ? act(x.id) : null; if (!a) return;
      var i = x.i, to = x.to; if (!Number.isInteger(i) || i < 0 || i >= E().BLD_NEED.length || !Number.isInteger(to) || to < 1 || to > a.maxLevel) return;
      var k = a.id + "#" + i; if (seen[k]) return;
      var cnt = E().buildings(s, a.id), n = E().bLevel(s, a.id, i);
      if (i < cnt) { if (to <= n) return; }                                        /* amélioration : un ou plusieurs niveaux au-dessus (achat ×N, Partie 19) */
      else if (i === cnt) { if (to !== 1) return; if (i > 0) { var nb = E().nextBuilding(s, a); if (!nb || !nb.ok || nb.idx !== i) return; } else if (!E().actUnlocked(s, a)) return; }   /* nouveau bâtiment */
      else return;
      var dur = typeof x.dur === "number" && isFinite(x.dur) && x.dur > 0 ? Math.min(P.maxDur, Math.max(1, x.dur)) : duration(a.id, i, to);
      var at = typeof x.at === "number" && isFinite(x.at) && x.at >= 0 ? Math.min(x.at, W.clk) : null;   /* début dans le futur (horloge qui recule) : ramené à maintenant */
      seen[k] = 1; out.push({ id: a.id, i: i, to: to, at: at, dur: dur, b: Math.floor(num(x.b, 0, P.bribe.per)) });
    });
    var wk = workers(s), started = 0;
    out.forEach(function (e) { if (e.at !== null) { if (started < wk) started++; else e.at = null; } });   /* jamais plus de chantiers en cours que d'ouvriers */
    var waitN = 0; W.q = out.filter(function (e) { return e.at !== null || waitN++ < P.queueMax; });
    fill(s, W.clk);
  }
  BL.works = { P: P, initState: initState, duration: duration, durAt: durAt, workers: workers, nextWorker: nextWorker, list: list, active: active, waiting: waiting, entry: entry, busyLot: busyLot, now: now, left: left, progress: progress, full: full,
    nextEnd: nextEnd, canOrder: canOrder, order: order, canBuilding: canBuilding, orderBuilding: orderBuilding, advance: advance, absence: absence, sync: sync,
    bribeInfo: bribeInfo, bribe: bribe, foremanReady: foremanReady, foremanWait: foremanWait, foremanPct: foremanPct, foreman: foreman, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
