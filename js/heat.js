/* Chaleur (C9) : l'attention de la police et des rivaux. Logique pure et déterministe.
   dv/dt = gain net (points/min) − K·v  → la jauge tend vers un équilibre = gain net / K, jamais au-delà de 100.
   Sources : activités (certaines salissent, d'autres blanchissent), bâtiments de quartier, opération en cours.
   Blanchiment : les activités légales absorbent au plus 60 % de la chaleur illégale (jamais plus).
   Paliers : conséquences bornées et annoncées. Descente = amende plafonnée précédée d'un avertissement évitable ;
   jamais de descente ni d'amende hors ligne ; jamais de game over. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var P = {
    k: 0.03,                                    /* refroidissement naturel : 3 % de l'écart par minute */
    tiers: [{ id: "calm", name: "Calme", min: 0 }, { id: "watch", name: "Surveillé", min: 25 }, { id: "probe", name: "Sous enquête", min: 50 }, { id: "hunt", name: "Traqué", min: 75 }],
    act: { backroom: 0.20, freight: 0.25, fence: 0.30, estate: -0.10, holding: -0.25 },   /* points/min par activité (×(1+0,5·log10(1+possédés))) */
    opMin: 0.6,                                 /* opération en cours : points/min */
    launder: 0.6,                               /* part maximale de la chaleur illégale absorbable */
    opPenalty: { probe: 0.05, hunt: 0.10 },     /* chances de réussite des opérations */
    rivalMul: { probe: 1.15, hunt: 1.3 },       /* les rivaux flairent la faiblesse */
    raidAt: 75, raidKeep: 70, raidWarn: 120, raidFineMoney: 0.04, raidFineSec: 600, raidAfter: 50,
    bribe: { cd: 180, drop: 20, sec: 600, floor: 2000 }, lay: { cd: 600, drop: 10 },
    offlineCap: 60, maxOfflineSec: 6 * 3600,
    /* Partie 13 · C2 : conséquences d'une descente. Toutes bornées, annoncées, réversibles (durée ou paiement). Coûts en minutes de revenu net. */
    r2: { closeSec: 480, seizeSec: 720, arrestSec: 600, defendMin: 3, ransomMin: 4, redeemMin: 2, floor: 1500, layIncSec: 300, layInc: 0.10, maxSeized: 3, maxClosed: 3, maxArrested: 1, maxHold: 3600 }
  };
  function E() { return BL.economy; } function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, a, b) { return typeof v === "number" && isFinite(v) ? clamp(v, a, b) : d; }
  function tierIdx(v) { var i = 0; P.tiers.forEach(function (x, k) { if (v >= x.min) i = k; }); return i; }
  function st(s) { if (!s.heat || typeof s.heat !== "object") s.heat = { v: 0, t: 0 }; var h = s.heat; h.v = num(h.v, 0, 0, 100); if (h.ta !== undefined && !(typeof h.ta === "number" && h.ta >= 0 && h.ta < P.tiers.length)) delete h.ta;   /* ta : palier déjà annoncé (conservé dans la sauvegarde → jamais ré-annoncé) ; initialisé par step(), jamais par une simple lecture */ h.raid = num(h.raid, 0, 0, 1e15); h.bribeAt = num(h.bribeAt, 0, 0, 1e15); h.layAt = num(h.layAt, 0, 0, 1e15);
    if (!Array.isArray(h.cl)) h.cl = []; if (!Array.isArray(h.sz)) h.sz = []; if (!Array.isArray(h.ar)) h.ar = []; if (typeof h.tg !== "string") h.tg = ""; h.rc = Math.floor(num(h.rc, 0, 0, 1e9)); h.def = h.def === true; h.low = num(h.low, 0, 0, 1e15); return h; }
  function tierOf(v) { var t = P.tiers[0]; P.tiers.forEach(function (x) { if (v >= x.min) t = x; }); return t; }
  /* Détail des sources, en points par minute, pour pouvoir tout expliquer à l'écran. */
  function sources(s) {
    var rows = [], G = 0, L = 0, add = function (label, v, kind) { if (Math.abs(v) < 1e-9) return; rows.push({ label: label, v: v, kind: kind }); if (v > 0) G += v; else L += -v; };
    (BL.data.activities || []).forEach(function (a) { var w = P.act[a.id]; if (!w) return; var n = (s.owned && s.owned[a.id]) || 0; if (n > 0) add(a.name, w * (1 + 0.5 * Math.log(1 + n) / Math.LN10), w > 0 ? "illegal" : "legal"); });
    var dh = BL.dbuild ? BL.dbuild.heatRate(s) : 0, dp = 0, dn = 0;
    if (BL.dbuild) { for (var did in (s.districts || {})) BL.dbuild.list(s, did).forEach(function (id) { var t = BL.dbuild.find(id); if (t && t.heat > 0) dp += t.heat; else if (t && t.heat < 0) dn += -t.heat; }); }
    if (dp) add("Bâtiments illégaux de quartier", dp, "illegal"); if (dn) add("Bâtiments légaux de quartier", -dn, "legal");
    if (s.eq && s.eq.op && BL.equip && s.eq.op.end > s.t) add("Opération en cours", P.opMin, "op");
    G *= (BL.saga ? BL.saga.heatMul(s) : 1) * (BL.meta ? BL.meta.heatMul(s) : 1);                               /* Partie 13 : choix de l'histoire (borné) */
    var absorbed = Math.min(L, P.launder * G), net = G - absorbed;
    return { rows: rows, gain: G, launder: L, absorbed: absorbed, net: net, eq: Math.min(100, net / P.k), dh: dh };
  }
  /* dt en secondes ; offline : jamais au-delà de offlineCap, rendement identique, aucune descente. */
  function advance(s, dt, offline) {
    var h = st(s); if (!(dt > 0)) return h; if (offline) dt = Math.min(dt, P.maxOfflineSec);
    var src = sources(s), eq = src.eq, m = dt / 60, v0 = h.v;
    var v = eq + (h.v - eq) * Math.exp(-P.k * m);
    if (offline) v = Math.min(v, Math.max(v0, P.offlineCap));
    h.v = clamp(v, 0, 100); h.t = s.t;
    if (offline && h.raid) h.raid = 0;                                    /* un avertissement n'attend pas ton retour */
    return h;
  }
  function tier(s) { return tierOf(st(s).v); }
  function opPenalty(s) { var t = tier(s); return P.opPenalty[t.id] || 0; }
  function rivalMul(s) { var t = tier(s); return P.rivalMul[t.id] || 1; }
  /* ---- Partie 13 · C2 : descente ciblée sur un quartier ---- */
  function cost(s, mins) { return Math.ceil(Math.max(P.r2.floor, E().incomeBase(s) * 60 * mins)); }
  function ctrlDistricts(s) { var o = []; if (!BL.territory || !BL.data.territory) return o; BL.data.territory.districts.forEach(function (d, i) { if (BL.territory.lv(s, d.id) >= 1) o.push({ id: d.id, i: i }); }); return o; }
  /* Quartier visé : le plus « chargé » (bâtiments construits, bâtiments illégaux comptés double), départage par l'ordre des quartiers ; la graine est le compteur de descentes (déterministe). */
  function pickTarget(s) {
    var h = st(s), c = ctrlDistricts(s); if (!c.length) return "";
    c.forEach(function (d) { var sc = 0; if (BL.dbuild) BL.dbuild.list(s, d.id).forEach(function (id) { var t = BL.dbuild.find(id); sc += 1 + (t && t.heat > 0 ? 1 : 0); }); d.sc = sc; });
    c.sort(function (a, b) { return b.sc - a.sc || a.i - b.i; }); return c[h.rc % Math.min(3, c.length)].id;
  }
  function districtName(id) { var d = BL.territory && BL.territory.dist && BL.territory.dist(id); return d ? d.name : ""; }
  function isClosed(s, did, bid) { var h = s.heat; if (!h || !Array.isArray(h.cl)) return false; for (var i = 0; i < h.cl.length; i++) { var c = h.cl[i]; if (c.d === did && c.id === bid && c.u > s.t) return true; } return false; }
  function isArrested(s, id) { var h = s.heat; if (!h || !Array.isArray(h.ar)) return false; for (var i = 0; i < h.ar.length; i++) if (h.ar[i].id === id && h.ar[i].u > s.t) return true; return false; }
  function incMul(s) { var h = s.heat; return h && h.low > s.t ? 1 - P.r2.layInc : 1; }
  function crewSlotsFree(s) { return BL.crew ? BL.crew.active(s).length < BL.crew.slots(s) : false; }
  function consequences(s, h, out) {
    var rec = { closed: null, seized: null, arrested: null }, v = h.rc % 2;
    /* 1. Fermeture temporaire d'un bâtiment du quartier visé (le plus rentable). */
    if (h.tg && BL.dbuild && h.cl.length < P.r2.maxClosed) {
      var best = null, bv = -1; BL.dbuild.list(s, h.tg).forEach(function (id) { var t = BL.dbuild.find(id); if (t && !isClosed(s, h.tg, id) && t.inc > bv) { bv = t.inc; best = id; } });
      if (best) { h.cl.push({ d: h.tg, id: best, u: s.t + P.r2.closeSec }); rec.closed = best; }
    }
    if (v === 0) {   /* 2a. Saisie d'un objet de l'Arsenal (jamais un objet équipé, jamais détruit : il est mis sous scellés et revient). */
      if (BL.equip && h.sz.length < P.r2.maxSeized) {
        var inv = BL.equip.st(s).inv, bi = -1, bp = -1; inv.forEach(function (x, i) { if (x.on == null) { var pr = BL.equip.price(s, x.id); if (pr > bp) { bp = pr; bi = i; } } });
        if (bi >= 0) { var it = inv.splice(bi, 1)[0]; h.sz.push({ id: it.id, w: it.w, b: it.b === 1 ? 1 : 0, u: s.t + P.r2.seizeSec }); rec.seized = it.id; }
      }
    } else if (BL.crew) {   /* 2b. Arrestation d'un équipier actif (jamais le dernier) : il revient seul ou contre rançon. */
      var act = BL.crew.active(s); if (act.length >= 2 && h.ar.length < P.r2.maxArrested) {
        var pick = act[0]; act.forEach(function (m) { if (BL.crew.lvl(s, m.id) > BL.crew.lvl(s, pick.id)) pick = m; });
        var r = s.crew.m[pick.id]; r.on = false; s.crew.v = (s.crew.v || 0) + 1; h.ar.push({ id: pick.id, u: s.t + P.r2.arrestSec }); rec.arrested = pick.id;
      }
    }
    return rec;
  }
  /* Libération automatique à l'échéance : bâtiments rouverts, objets rendus (si le coffre est plein, ils attendent), équipiers libérés. */
  function release(s, h, out) {
    h.cl = h.cl.filter(function (c) { if (c.u > s.t) return true; out.push({ type: "reopen", district: c.d, id: c.id }); return false; });
    h.sz = h.sz.filter(function (z) { if (z.u > s.t) return true; if (!BL.equip || BL.equip.space(s) <= 0) { z.u = s.t + 60; return true; } BL.equip.st(s).inv.push({ id: z.id, w: z.w, on: null }); out.push({ type: "itemBack", id: z.id }); return false; });
    h.ar = h.ar.filter(function (a) { if (a.u > s.t) return true; freeCrew(s, a.id); out.push({ type: "crewBack", id: a.id }); return false; });
  }
  function freeCrew(s, id) { if (BL.crew && BL.crew.has(s, id) && crewSlotsFree(s)) { s.crew.m[id].on = true; s.crew.v = (s.crew.v || 0) + 1; } }
  function defend(s) { var h = st(s), c = cost(s, P.r2.defendMin); if (!(h.raid > s.t) || h.def || !(s.money + 1e-9 >= c)) return null; E().spend(s, c); h.def = true; return { cost: c }; }
  function ransom(s, id) { var h = st(s), c = cost(s, P.r2.ransomMin), i = -1; h.ar.forEach(function (a, k) { if (a.id === id) i = k; }); if (i < 0 || !(s.money + 1e-9 >= c)) return null; E().spend(s, c); h.ar.splice(i, 1); freeCrew(s, id); return { cost: c }; }
  function redeem(s, idx) { var h = st(s), c = cost(s, P.r2.redeemMin), z = h.sz[idx]; if (!z || !BL.equip || BL.equip.space(s) <= 0 || !(s.money + 1e-9 >= c)) return null; E().spend(s, c); h.sz.splice(idx, 1); BL.equip.st(s).inv.push({ id: z.id, w: z.w, on: null }); return { cost: c, id: z.id }; }
  /* Descente : avertissement 2 min avant (quartier visé annoncé), annulée si la chaleur est retombée ; amende plafonnée. */
  function step(s) {
    var h = st(s), out = [];
    release(s, h, out);
    if (!h.raid && h.v >= P.raidAt) { h.raid = s.t + P.raidWarn; h.def = false; h.tg = pickTarget(s); out.push({ type: "raidWarn", left: P.raidWarn, target: h.tg }); }
    else if (h.raid) {
      if (h.v < P.raidKeep) { h.raid = 0; h.def = false; h.tg = ""; out.push({ type: "raidAvoided" }); }
      else if (s.t >= h.raid) {
        var fine = Math.floor(Math.min(s.money * P.raidFineMoney, E().incomeBase(s) * P.raidFineSec)); if (h.def) fine = Math.floor(fine / 2); fine = Math.max(0, Math.min(fine, s.money));
        if (fine > 0) E().spend(s, fine);
        var defended = h.def, tg = h.tg, rec = defended ? { closed: null, seized: null, arrested: null } : consequences(s, h, out);
        h.rc++; h.v = P.raidAfter; h.raid = 0; h.def = false; h.tg = ""; out.push({ type: "raid", fine: fine, target: tg, defended: defended, closed: rec.closed, seized: rec.seized, arrested: rec.arrested });
      }
    }
    /* C10 (Partie 11) : changement de palier, annoncé une seule fois. Hystérésis de 3 points à la descente pour qu'une valeur qui oscille autour d'un seuil ne répète rien. */
    if (h.ta === undefined) h.ta = tierIdx(h.v);
    var ti = tierIdx(h.v); if (ti > h.ta) { out.push({ type: "tierUp", from: h.ta, to: ti, id: P.tiers[ti].id, name: P.tiers[ti].name, v: h.v }); h.ta = ti; }
    else if (ti < h.ta && h.v < P.tiers[h.ta].min - 3) { out.push({ type: "tierDown", from: h.ta, to: ti, id: P.tiers[ti].id, name: P.tiers[ti].name, v: h.v }); h.ta = ti; }
    return out;
  }
  function bribeCost(s) { return Math.ceil(Math.max(P.bribe.floor, E().incomeBase(s) * P.bribe.sec)); }
  function bribeLeft(s) { return Math.max(0, st(s).bribeAt - s.t); }
  function bribe(s) { var h = st(s), c = bribeCost(s); if (bribeLeft(s) > 0 || h.v <= 0 || !(s.money + 1e-9 >= c)) return null; E().spend(s, c); h.v = Math.max(0, h.v - P.bribe.drop); h.bribeAt = s.t + P.bribe.cd; return { cost: c, v: h.v }; }
  function layLeft(s) { return Math.max(0, st(s).layAt - s.t); }
  function lay(s) { var h = st(s); if (layLeft(s) > 0 || h.v <= 0) return null; h.v = Math.max(0, h.v - P.lay.drop); h.layAt = s.t + P.lay.cd; h.low = s.t + P.r2.layIncSec; return { v: h.v, low: P.r2.layIncSec, pct: P.r2.layInc }; }
  /* Impulsion à la fin d'une opération (certaines opérations attirent l'attention) : +1 point par palier. */
  function opDone(s, tierN) { var h = st(s); h.v = clamp(h.v + 1 + (tierN || 0), 0, 100); }
  BL.heat = { tierIdx: tierIdx, params: P, state: st, tierOf: tierOf, tier: tier, sources: sources, advance: advance, step: step, opPenalty: opPenalty, rivalMul: rivalMul, bribeCost: bribeCost, bribeLeft: bribeLeft, bribe: bribe, layLeft: layLeft, lay: lay, opDone: opDone,
    cost: cost, pickTarget: pickTarget, districtName: districtName, isClosed: isClosed, isArrested: isArrested, incMul: incMul, defend: defend, ransom: ransom, redeem: redeem };
})(typeof window !== "undefined" ? window : globalThis);
