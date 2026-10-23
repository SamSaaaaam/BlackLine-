/* Boxs : LOGIQUE PURE (aucun DOM, aucun stockage, hasard injecté). Le tirage est décidé ENTIÈREMENT ici, avant toute animation, puis l'état est modifié d'un coup :
   lingots débités une seule fois, objets ajoutés, compteurs de pitié et dernier résultat enregistrés. L'interface se contente de raconter ce résultat.
   État : s.boxes = { pity:{ id:{l,m} }, opened:{ id:n }, total, last:{box,n,at,items:[{id,rar,dup,full,money,pity}]}|null }. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function B() { return BL.data.boxes; } function Q() { return BL.equip; }
  function list() { return B().BOXES; }
  function box(id) { var a = list(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function fresh() { var o = { pity: {}, opened: {}, total: 0, last: null }; list().forEach(function (b) { o.pity[b.id] = { l: 0, m: 0 }; o.opened[b.id] = 0; }); return o; }
  function initState(s) { s.boxes = fresh(); }
  function st(s) { return s.boxes || (s.boxes = fresh()); }
  function rollOdds(odds, rng) {
    var sum = 0, i; for (i = 0; i < odds.length; i++) sum += odds[i]; var r = rng() * sum, last = 0;
    for (i = 0; i < odds.length; i++) { if (odds[i] > 0) { last = i; r -= odds[i]; if (r < 0) return i; } } return last;
  }
  function pool(rar) { return BL.data.equip.ITEMS.filter(function (x) { return x.rar === rar; }); }
  /* tirage d'une rareté pour une box, avec ou sans pitié (mutation des compteurs p) */
  function roll(b, p, rng, nopity) {
    var pt = nopity ? null : b.pity, rar, why = "";
    if (pt && pt.myth && b.odds[4] > 0 && p.m + 1 >= pt.myth) { rar = 4; why = "myth"; }
    else if (pt && pt.leg && p.l + 1 >= pt.leg) { rar = rollOdds([0, 0, 0, b.odds[3] || 0, b.odds[4] || 0], rng); why = "leg"; }
    else rar = rollOdds(b.odds, rng);
    if (rar >= 3) p.l = 0; else p.l++; if (rar === 4) p.m = 0; else p.m++;
    return { rar: rar, pity: why };
  }
  function pick(rar, rng) { var a = pool(rar); return a[Math.floor(rng() * a.length) % a.length].id; }
  function rates(b) { var sum = 0; b.odds.forEach(function (x) { sum += x; }); return b.odds.map(function (x, i) { return { rar: i, pct: sum > 0 ? x * 100 / sum : 0 }; }).filter(function (r) { return r.pct > 0; }); }
  function maxMulti(s, id) { var b = box(id); if (!b) return 0; return Math.max(0, Math.min(B().params.maxMulti, Math.floor((s.gold || 0) / b.cost))); }
  function canOpen(s, id, n) { var b = box(id); n = Math.floor(n); return !!b && n >= 1 && n <= B().params.maxMulti && !!BL.gold && BL.gold.canSpend(s, b.cost * n); }
  function compensation(s, itemId) { return Math.floor(Q().price(s, itemId) * B().params.dupRatio + EPS); }
  /* ouverture : renvoie le résultat enregistré, ou null (rien n'est débité) */
  function open(s, id, n, rng) {
    var b = box(id); n = Math.floor(n); if (!b || typeof rng !== "function" || !canOpen(s, id, n)) return null;
    BL.gold.spend(s, b.cost * n);
    var q = st(s), p = q.pity[id], e = Q().st(s), items = [];
    for (var i = 0; i < n; i++) {
      var r = roll(b, p, rng), itemId = pick(r.rar, rng), it = Q().item(itemId), dup = e.inv.some(function (x) { return x.id === itemId; }), full = !dup && Q().space(s) < 1, money = 0;
      if (dup || full) { money = compensation(s, itemId); s.money += money; } else e.inv.push({ id: itemId, w: 100, on: null, b: 1 });
      items.push({ id: itemId, rar: it.rar, dup: dup, full: full, money: money, pity: r.pity });
    }
    q.opened[id] += n; q.total += n; q.last = { box: id, n: n, at: typeof s.t === "number" && isFinite(s.t) ? Math.floor(s.t) : 0, items: items };
    /* historique persisté (v10) : 5 dernières ouvertures, la plus récente d'abord */
    if (!Array.isArray(s.boxHist)) s.boxHist = [];
    s.boxHist.unshift({ b: id, at: Date.now(), it: items.slice(0, 12).map(function (x) { return { id: x.id, dup: !!(x.dup || x.full) }; }) });
    if (s.boxHist.length > 5) s.boxHist.length = 5;
    return q.last;
  }
  function status(s, id) {
    var b = box(id), p = st(s).pity[id] || { l: 0, m: 0 }; if (!b) return null; var pt = b.pity;
    return { leg: pt && pt.leg ? { have: p.l, need: pt.leg, left: Math.max(1, pt.leg - p.l) } : null, myth: pt && pt.myth ? { have: p.m, need: pt.myth, left: Math.max(1, pt.myth - p.m) } : null, opened: st(s).opened[id] || 0 };
  }
  /* Aperçu (Partie 14) : tout ce que la box peut donner, lu dans les MÊMES données que le tirage (odds, pity, pool). Aucun nombre n'est recopié à la main.
     pct d'une rareté = rates(b) ; pct d'un objet = pct de sa rareté / nombre d'objets de cette rareté (le tirage choisit un objet au hasard dans la rareté). */
  function preview(s, id) {
    var b = box(id); if (!b) return null; var inv = {}; ((Q().st(s) || {}).inv || []).forEach(function (x) { inv[x.id] = 1; });
    var rs = rates(b).map(function (r) { var a = pool(r.rar); return { rar: r.rar, pct: r.pct, count: a.length, each: a.length ? r.pct / a.length : 0, items: a.map(function (x) { return { id: x.id, name: x.name, slot: x.slot, rar: x.rar, pct: a.length ? r.pct / a.length : 0, owned: !!inv[x.id] }; }) }; });
    var g = [], pt = b.pity || {};
    if (pt.leg) { var lo = [b.odds[3] || 0, b.odds[4] || 0], ls = lo[0] + lo[1]; g.push({ kind: "leg", every: pt.leg, rars: [3].concat(lo[1] > 0 ? [4] : []), pct: ls ? [lo[0] * 100 / ls, lo[1] * 100 / ls] : [100, 0] }); }
    if (pt.myth && (b.odds[4] || 0) > 0) g.push({ kind: "myth", every: pt.myth, rars: [4], pct: [100] });
    return { box: b, rarities: rs, guaranteed: g, total: rs.reduce(function (a, r) { return a + r.count; }, 0), sum: rs.reduce(function (a, r) { return a + r.pct; }, 0) };
  }
  function sanitize(raw, s) {
    s.boxes = fresh(); var r = raw && raw.boxes; if (!r || typeof r !== "object" || Array.isArray(r)) return; var q = s.boxes;
    function n(v, hi) { return typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(0, Math.floor(v))) : 0; }
    list().forEach(function (b) {
      var p = r.pity && typeof r.pity === "object" ? r.pity[b.id] : null, pt = b.pity || {};
      if (p && typeof p === "object") q.pity[b.id] = { l: pt.leg ? Math.min(n(p.l, 1e6), pt.leg - 1) : n(p.l, 1e6), m: pt.myth ? Math.min(n(p.m, 1e6), pt.myth - 1) : n(p.m, 1e6) };
      if (r.opened && typeof r.opened === "object") q.opened[b.id] = n(r.opened[b.id], 1e7);
    });
    q.total = n(r.total, 1e8);
    var l = r.last; if (l && typeof l === "object" && box(l.box) && Array.isArray(l.items) && l.items.length >= 1 && l.items.length <= B().params.maxMulti) {
      var its = []; l.items.forEach(function (x) { if (x && typeof x === "object" && Q().item(x.id)) its.push({ id: x.id, rar: Q().item(x.id).rar, dup: !!x.dup, full: !!x.full && !x.dup, money: n(x.money, 1e18), pity: x.pity === "leg" || x.pity === "myth" ? x.pity : "" }); });
      if (its.length) q.last = { box: l.box, n: its.length, at: n(l.at, 1e12), items: its };
    }
  }
  BL.boxes = { preview: preview, pool: pool, list: list, box: box, initState: initState, sanitize: sanitize, st: st, roll: roll, pick: pick, rates: rates, maxMulti: maxMulti, canOpen: canOpen, compensation: compensation, open: open, status: status, rollOdds: rollOdds };
})(typeof globalThis !== "undefined" ? globalThis : this);
