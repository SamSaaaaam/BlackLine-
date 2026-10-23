/* Caractère de l'équipe (Partie 13 · C4) : loyauté, affinités et tensions, dispute, mission personnelle, départ / trahison évitables.
   Logique pure, déterministe. État dans s.crew.m[id] : loy (0–100, 60 au départ), bond (mission faite : lien), mis, away (parti), st (avertissement 0–2),
   cd (secondes restantes avant le départ, comptées en ligne seulement), gu (prime possible à partir de), q (palier du multiplicateur).
   Et s.crew.ev = { dis : { a, b, u } ou null, rest : date }.
   Règles de sécurité : aucun départ hors ligne, deux avertissements avant tout départ (le 2e avec 10 min), la prime, la mission ou le rappel
   l'évitent ou le réparent ; un équipier parti reste dans la liste avec son niveau et peut être rappelé ; jamais de perte permanente. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.bonds; } function P() { return D().params; } function E() { return BL.economy; } function C() { return BL.crew; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function ch(id) { return D().chars[id] || null; }
  function rec(s, id) { return C().rec(s, id); }
  function ev(s) { if (!s.crew.ev || !isObj(s.crew.ev)) s.crew.ev = { dis: null, rest: 0 }; return s.crew.ev; }
  function loy(s, id) { var r = rec(s, id); return r && typeof r.loy === "number" ? r.loy : P().start; }
  function temper(id) { var c = ch(id); return c ? c.temper : "steady"; }
  /* Relation entre deux équipiers : "clash" l'emporte sur "like" ; symétrique (l'un des deux suffit à la déclarer). */
  function relation(a, b) {
    var x = ch(a), y = ch(b); if (!x || !y || a === b) return null;
    if (x.clashes.indexOf(b) >= 0 || y.clashes.indexOf(a) >= 0) return "clash"; if (x.likes.indexOf(b) >= 0 || y.likes.indexOf(a) >= 0) return "like"; return null;
  }
  function pairs(s, kind) {
    var act = C().active(s).map(function (m) { return m.id; }), out = [];
    for (var i = 0; i < act.length; i++) for (var j = i + 1; j < act.length; j++) if (relation(act[i], act[j]) === kind) out.push([act[i], act[j]]);
    return out;
  }
  function partners(id, kind) { var o = []; Object.keys(D().chars).forEach(function (k) { if (relation(id, k) === kind) o.push(k); }); return o; }
  /* Synergie : +0,5 % de revenus par paire d'affinités (les deux actifs), plafonné. */
  function synergy(s) { if (!s.crew) return 0; return Math.min(P().synergyCap, P().synergyPer * pairs(s, "like").length); }
  function disputing(s, id) { var d = s.crew && s.crew.ev && s.crew.ev.dis; return !!(d && d.u > s.t && (d.a === id || d.b === id)); }
  /* Multiplicateur d'efficacité d'un équipier : loyauté (0,9 à 1,1) × dispute (0,8). Lu par crew.js. */
  function loyMul(s, id) { var L = loy(s, id), p = P(); return L < p.start ? p.mulLo + (1 - p.mulLo) * L / p.start : 1 + (p.mulHi - 1) * (L - p.start) / (p.max - p.start); }   /* 1,00 à la loyauté de départ (60) : 0,90 à 0 → 1,10 à 100 */
  function mul(s, id) { if (!rec(s, id)) return 1; return loyMul(s, id) * (disputing(s, id) ? P().disputeMul : 1); }
  function away(s, id) { var r = rec(s, id); return !!(r && r.away); }
  function stage(s, id) { var r = rec(s, id); return r && r.st ? r.st : 0; }

  /* Un pas de temps (dt secondes). offline : plafonné, aucun avertissement avancé, aucun départ. Renvoie les événements à annoncer. */
  function advance(s, dt, offline) {
    var out = []; if (!s.crew || !(dt > 0)) return out; var p = P(), min = dt / 60, e = ev(s), act = {};
    if (offline) min = Math.min(min, p.offlineCapMin);
    C().active(s).forEach(function (m) { act[m.id] = 1; });
    var likes = pairs(s, "like"), clashes = pairs(s, "clash"), bumpNeed = false;
    C().owned(s).forEach(function (m) {
      var r = rec(s, m.id), t = temper(m.id), L = loy(s, m.id), d = 0; if (r.away) return;
      if (act[m.id]) d += p.activeRate + (t === "steady" ? p.steadyBonus : 0); else d += t === "proud" ? p.benchProud : t === "steady" ? 0 : p.benchOther;
      if (t !== "loner") {
        likes.forEach(function (pr) { if (pr[0] === m.id || pr[1] === m.id) d += p.likeRate * (t === "warm" ? p.warmMul : 1); });
        clashes.forEach(function (pr) { if (pr[0] === m.id || pr[1] === m.id) d += p.clashRate; });
      }
      if (t === "greedy") d += p.greedyDrain;
      L = clamp(L + d * min, r.bond ? p.floorBond : p.min, p.max); r.loy = L;
      var q = Math.round(loyMul(s, m.id) * 50); if (q !== r.q) { r.q = q; bumpNeed = true; }
      if (!offline) stageStep(s, m, r, L, dt, out);
    });
    /* dispute : une paire en tension dont l'un des deux est en dessous du seuil se dispute 5 min (puis repos 20 min). */
    if (e.dis && e.dis.u <= s.t) { e.dis = null; bumpNeed = true; out.push({ type: "disputeEnd" }); }
    if (!offline && !e.dis && s.t >= (e.rest || 0)) {
      for (var i = 0; i < clashes.length; i++) { var a = clashes[i][0], b = clashes[i][1]; if (loy(s, a) < p.disputeBelow || loy(s, b) < p.disputeBelow) { e.dis = { a: a, b: b, u: s.t + p.disputeSec }; e.rest = s.t + p.disputeSec + p.disputeRest; bumpNeed = true; out.push({ type: "dispute", a: a, b: b }); break; } }
    }
    if (bumpNeed) C().bump(s); return out;
  }
  function stageStep(s, m, r, L, dt, out) {
    var p = P(); if (r.bond) { r.st = 0; r.cd = 0; return; }
    if (L >= p.warn1 + 5) { if (r.st) { r.st = 0; r.cd = 0; out.push({ type: "calm", id: m.id }); } return; }
    if (L < p.warn1 && !r.st) { r.st = 1; out.push({ type: "warn1", id: m.id }); }
    if (L < p.warn2 && r.st === 1) { r.st = 2; r.cd = p.countdown; out.push({ type: "warn2", id: m.id, left: p.countdown }); }
    else if (r.st === 2) {
      if (L >= p.warn2 + 3) { r.st = 1; r.cd = 0; out.push({ type: "calm", id: m.id }); }
      else { r.cd = Math.max(0, (r.cd || 0) - dt); if (r.cd <= 0) leave(s, m, r, out); }
    }
  }
  function leave(s, m, r, out) {
    var betray = temper(m.id) === "greedy" || temper(m.id) === "proud", loss = 0, heat = 0;
    r.away = true; r.on = false; r.st = 0; r.cd = 0; C().bump(s);
    if (betray) {   /* trahison : annoncée deux fois, bornée (chaleur +10, 3 minutes de revenus), réparable par un rappel */
      heat = P().betrayHeat; if (BL.heat) { var h = BL.heat.state(s); h.v = clamp(h.v + heat, 0, 100); }
      loss = Math.min(s.money, Math.ceil(Math.max(0, E().incomeBase(s)) * 60 * P().betrayMin)); if (loss > 0) E().spend(s, loss);
    }
    out.push({ type: betray ? "betray" : "leave", id: m.id, heat: heat, loss: loss });
  }
  /* Actions du joueur */
  function giftCost(s) { return Math.ceil(Math.max(P().giftFloor, E().incomeBase(s) * 60 * P().giftMin)); }
  function giftLeft(s, id) { var r = rec(s, id); return r ? Math.max(0, (r.gu || 0) - s.t) : 0; }
  function whyGift(s, id) {
    var r = rec(s, id); if (!r) return "Pas dans ton équipe."; if (r.away) return "Parti : rappelle-le d'abord."; if (giftLeft(s, id) > 0) return "Prochaine prime dans " + Math.ceil(giftLeft(s, id) / 60) + " min.";
    if (r.loy >= P().max - 1e-9) return "Loyauté déjà au maximum."; if (s.money + 1e-9 < giftCost(s)) return "Il te manque de l'argent."; return "";
  }
  function gift(s, id) { if (whyGift(s, id)) return null; var r = rec(s, id), c = giftCost(s), g = temper(id) === "greedy" ? P().giftGreedy : P().gift; E().spend(s, c); r.loy = clamp(loy(s, id) + g, 0, P().max); r.gu = s.t + P().giftCd; settle(s, id); return { cost: c, gain: g, loy: r.loy }; }
  function missionOf(id) { var c = ch(id); return c ? c.mission : null; }
  function whyMission(s, id, opt) {
    var r = rec(s, id), m = missionOf(id); if (!r || !m) return "Pas dans ton équipe."; if (r.mis) return "Moment personnel déjà vécu."; if (r.away) return "Parti : rappelle-le d'abord."; if (r.lv < P().minLvMission) return "Niveau " + P().minLvMission + " du personnage requis (niveau " + r.lv + ").";
    if (opt === "a" && s.money + 1e-9 < giftCost(s)) return "Il te manque de l'argent."; return "";
  }
  function mission(s, id, opt) {
    if ((opt !== "a" && opt !== "b") || whyMission(s, id, opt)) return null; var r = rec(s, id), c = 0, g = opt === "a" ? P().missionA : P().missionB;
    if (opt === "a") { c = giftCost(s); E().spend(s, c); } r.mis = 1; r.bond = 1; r.loy = clamp(loy(s, id) + g, 0, P().max); r.st = 0; r.cd = 0; settle(s, id); if (E().addLog) E().addLog(s, "Moment personnel : « " + missionOf(id).title + " » (" + C().get(id).name + ", loyauté " + Math.round(r.loy) + ")."); return { cost: c, gain: g, loy: r.loy };
  }
  function recallCost(s) { return Math.ceil(Math.max(P().giftFloor, E().incomeBase(s) * 60 * P().recallMin)); }
  function recall(s, id) { var r = rec(s, id); if (!r || !r.away || s.money + 1e-9 < recallCost(s)) return null; var c = recallCost(s); E().spend(s, c); r.away = false; r.loy = P().recallLoy; r.st = 0; r.cd = 0; settle(s, id); return { cost: c }; }
  function settle(s, id) { var r = rec(s, id); r.q = Math.round(loyMul(s, id) * 50); C().bump(s); }

  function sanitize(r, s) {
    var c = r && r.crew; if (!s.crew) return; s.crew.ev = { dis: null, rest: 0 }; var T0 = typeof r.t === "number" && isFinite(r.t) ? Math.max(0, r.t) : 0;
    if (!isObj(c) || !isObj(c.m)) return; var p = P();
    Object.keys(s.crew.m).forEach(function (id) {
      var x = c.m[id], d = s.crew.m[id]; if (!isObj(x)) return;
      d.loy = clamp(typeof x.loy === "number" && isFinite(x.loy) ? x.loy : p.start, 0, p.max); d.bond = x.bond === 1 || x.bond === true ? 1 : 0; d.mis = x.mis === 1 || x.mis === true ? 1 : 0; if (d.mis) d.bond = 1;
      d.away = x.away === true || x.away === 1 ? true : false; if (d.away) d.on = false; d.st = Math.floor(clamp(+x.st || 0, 0, 2)); d.cd = clamp(+x.cd || 0, 0, p.countdown); d.gu = clamp(+x.gu || 0, 0, T0 + p.giftCd);
      if (d.bond) { d.loy = Math.max(d.loy, p.floorBond); d.st = 0; d.cd = 0; } if (d.st !== 2) d.cd = 0; if (d.st === 2 && d.cd <= 0) d.cd = p.countdown;
      if (d.loy >= p.warn1 + 5) { d.st = 0; d.cd = 0; }
      d.q = Math.round(loyMul(s, id) * 50);
    });
    var e = c.ev; if (isObj(e) && isObj(e.dis) && ch(e.dis.a) && ch(e.dis.b) && s.crew.m[e.dis.a] && s.crew.m[e.dis.b] && relation(e.dis.a, e.dis.b) === "clash") s.crew.ev.dis = { a: e.dis.a, b: e.dis.b, u: clamp(+e.dis.u || 0, 0, T0 + p.disputeSec) };
    if (isObj(e)) s.crew.ev.rest = clamp(+e.rest || 0, 0, T0 + p.disputeSec + p.disputeRest);
    C().bump(s);
  }
  BL.bonds = { params: BL.data.bonds.params, loy: loy, temper: temper, relation: relation, partners: partners, pairs: pairs, synergy: synergy, disputing: disputing, loyMul: loyMul, mul: mul, away: away, stage: stage, advance: advance,
    giftCost: giftCost, giftLeft: giftLeft, whyGift: whyGift, gift: gift, missionOf: missionOf, whyMission: whyMission, mission: mission, recallCost: recallCost, recall: recall, sanitize: sanitize, char: ch };
})(typeof globalThis !== "undefined" ? globalThis : this);
