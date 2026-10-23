/* Factions : relations avec le joueur, alliances temporaires, rivalités, négociations. Logique pure.
   Réglages : BL.data.diplomacy. État : s.fac[id] = { power, truce, rel, ally, cd, gcd } et s.dip = { formed }. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function E() { return BL.economy; } function T() { return BL.territory; } function Cw() { return BL.crew; } function P() { return BL.data.diplomacy.params; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, max) { return typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(v, max || 1e300) : d; }
  function list() { return BL.data.territory.factions; }
  function meta(fid) { return BL.data.diplomacy.factions[fid]; }
  function info(fid) { var f = T().faction(fid), m = meta(fid); return f && m ? { id: f.id, name: f.name, trait: f.trait, aggression: f.aggression, base: f.base, color: m.color, shape: m.shape, rival: m.rival, disp: m.disp, motto: m.motto } : null; }

  function initState(s) { s.dip = { formed: 0 }; list().forEach(function (f) { var x = s.fac[f.id]; x.rel = meta(f.id).disp; x.ally = 0; x.cd = 0; x.gcd = 0; }); }
  function rel(s, fid) { var f = s.fac && s.fac[fid]; return f && typeof f.rel === "number" ? f.rel : 0; }
  function allied(s, fid) { var f = s.fac && s.fac[fid]; return !!(f && f.ally > s.t); }
  function allyCount(s) { var n = 0; list().forEach(function (f) { if (allied(s, f.id)) n++; }); return n; }
  function status(s, fid) {
    if (allied(s, fid)) return { id: "ally", name: "Alliée" };
    var r = rel(s, fid), st = BL.data.diplomacy.status; for (var i = 0; i < st.length; i++) if (r < st[i].max) return st[i]; return st[st.length - 1];
  }
  /* Une variation positive est amplifiée par la diplomatie de l'équipe et freinée quand la relation est déjà haute. */
  function gain(s, fid, delta) {
    var f = s.fac[fid]; if (!f || !isFinite(delta)) return 0; var r = rel(s, fid), v = delta;
    if (delta > 0) v = delta * (1 + (Cw() ? Cw().agg(s).relGain : 0)) * (1 - Math.max(0, r) / 150);
    f.rel = clamp(r + v, P().relMin, P().relMax); return f.rel - r;
  }
  function incMult(s) { return 1 + P().allyIncome * allyCount(s); }
  function defBonus(s) { return P().allyDef * allyCount(s); }
  function atkMul(s, fid) { return clamp(1 - rel(s, fid) / P().atkRelDiv, P().atkMin, P().atkMax); }
  function weight(s, fid) { if (allied(s, fid)) return 0; var r = rel(s, fid); return r < 0 ? 1 + (-r) / P().weightHostile : 1 / (1 + r / 50); }

  /* ---- Coûts : plancher selon le niveau d'empire, sinon quelques secondes de revenus ---- */
  function refCost(s, sec) { return Math.ceil(Math.max(P().refFloor * Math.pow(P().refGrowth, E().level(s) - 1) * sec / 100, E().incomeBase(s) * sec)); }
  function crewAgg(s) { return Cw() ? Cw().agg(s) : { terrCost: 0, chance: 0, negChance: 0 }; }
  function cost(s, action) {
    var p = P()[action]; if (!p) return 0;
    var c = refCost(s, p.sec); return action === "truce" ? Math.ceil(c * (1 - crewAgg(s).terrCost)) : c;
  }
  function chance(s, fid, action) {
    var a = crewAgg(s), f = T().faction(fid), r = rel(s, fid), p = P();
    if (action === "gift") return 1;
    if (action === "truce") return clamp(p.truce.base + p.truce.perRel * r + a.negChance, 0.05, 0.95);
    if (action === "ally") return clamp(p.ally.base + p.ally.perRel * r - p.ally.perAggr * (f.aggression - 3) + a.chance, 0.05, 0.9);
    if (action === "press") {
      var me = E().influence(s) + 5 + p.press.stratWeight * (Cw() ? Cw().score(s, "strat") : 0), them = s.fac[fid].power * p.press.powerShare + 5;
      return clamp(me / (me + them), p.press.minChance, p.press.maxChance);
    }
    return 0;
  }
  /* Pourquoi une action est impossible (texte), ou null si elle est possible hors argent. */
  function blocked(s, fid, action) {
    var f = s.fac[fid], p = P(), m = meta(fid), rv = m && m.rival;
    if (!f) return "Faction inconnue";
    if (action === "gift") return f.gcd > s.t ? "Patiente " + Math.ceil(f.gcd - s.t) + " s" : (rel(s, fid) >= p.relMax - 1 ? "Relation au maximum" : null);
    if (allied(s, fid)) return action === "ally" ? "Alliance en cours" : action === "truce" ? "Alliance en cours" : "Tu ne peux pas presser un allié";
    if (action === "truce") return f.truce > s.t ? "Trêve en cours" : null;
    if (action === "ally") {
      if (allyCount(s) >= p.maxAllies) return "Maximum " + p.maxAllies + " alliances";
      if (rel(s, fid) < p.allyMinRel) return "Relation " + p.allyMinRel + " requise";
      if (rv && allied(s, rv)) return "Alliée avec sa rivale";
      return f.cd > s.t ? "Patiente " + Math.ceil(f.cd - s.t) + " s" : null;
    }
    return null;
  }
  function act(s, fid, action, rng) {
    var f = s.fac[fid], p = P(), fa = info(fid); if (!f || !fa || !p[action] || blocked(s, fid, action)) return null;
    var c = cost(s, action); if (!(s.money + EPS >= c)) return null;
    var pr = chance(s, fid, action), ok = action === "gift" || rng() < pr, res = { type: action, faction: fa, cost: c, chance: pr, success: ok };
    if (action === "gift") { E().spend(s, c); f.gcd = s.t + p.gift.cd; res.rel = gain(s, fid, p.gift.rel); }
    else if (action === "truce") {
      if (ok) { E().spend(s, c); f.truce = s.t + p.truce.len; gain(s, fid, p.truceRel); } else { res.cost = Math.ceil(c / 2); E().spend(s, res.cost); gain(s, fid, -p.truce.failRel); }
    } else if (action === "ally") {
      if (ok) { E().spend(s, c); formAlliance(s, fid, p.ally.dur || p.allyDur * (1 + Cw().agg(s).relGain / 2)); gain(s, fid, 8); }
      else { res.cost = Math.ceil(c / 2); E().spend(s, res.cost); gain(s, fid, -p.ally.failRel); f.cd = s.t + p.allyCd; }
    } else if (action === "press") {
      E().spend(s, c);
      if (ok) { f.power *= p.press.win; gain(s, fid, p.press.rel); if (Cw()) Cw().award(s, p.press.xp); } else { f.power *= p.press.lose; gain(s, fid, p.press.loseRel); }
    }
    return res;
  }
  /* Alliance (acceptée par une négociation ou un événement) : durée limitée, la rivale s'en offusque. */
  function formAlliance(s, fid, dur) {
    var f = s.fac[fid], was = allied(s, fid), rv = meta(fid).rival;
    f.ally = Math.max(f.ally, s.t + dur); if (!was) s.dip.formed += 1;
    if (rv && s.fac[rv]) gain(s, rv, -P().rivalPenalty);
  }

  /* ---- Conséquences des affrontements territoriaux (appelées par territory.js) ---- */
  function onTake(s, fid, success) {
    if (!fid || !s.fac[fid]) return;
    if (success) { gain(s, fid, P().takeRel); var rv = meta(fid).rival; if (rv && s.fac[rv]) gain(s, rv, P().takeRivalRel); } else gain(s, fid, P().failRel);
  }
  function onConflict(s, fid, type) { if (!fid || !s.fac[fid]) return; if (type === "won") gain(s, fid, P().winRel); else if (type === "truce") gain(s, fid, P().truceRel); }

  function tick(s, dt) {
    if (!(dt > 0) || !s.fac) return;
    list().forEach(function (f) {
      var x = s.fac[f.id]; if (typeof x.rel !== "number" || allied(s, f.id)) return;
      var d = meta(f.id).disp - x.rel, step = P().drift * dt; x.rel += Math.abs(d) <= step ? d : (d > 0 ? step : -step);
    });
  }
  function step(s) {
    var out = [];
    list().forEach(function (f) { var x = s.fac[f.id]; if (x && x.ally > 0 && x.ally <= s.t) { x.ally = 0; out.push({ type: "allyEnd", faction: info(f.id) }); } });
    return out;
  }
  /* Choix d'une faction pour un événement, selon ses conditions (needRel, maxRel, noAlly). */
  function pickFor(s, rng, ev) {
    var pool = list().filter(function (f) {
      var r = rel(s, f.id); if (ev.needRel !== undefined && r < ev.needRel) return false; if (ev.maxRel !== undefined && r > ev.maxRel) return false;
      return !(ev.noAlly && allied(s, f.id));
    });
    return pool.length ? pool[Math.floor(rng() * pool.length) % pool.length].id : null;
  }
  function eligible(s, ev) { return pickFor(s, function () { return 0; }, ev) !== null; }

  function sanitize(r, s) {
    list().forEach(function (f) {
      var x = r.fac && r.fac[f.id], y = s.fac[f.id];
      if (typeof y.rel !== "number") y.rel = meta(f.id).disp; y.ally = y.ally || 0; y.cd = y.cd || 0; y.gcd = y.gcd || 0;
      if (!x || typeof x !== "object") return;
      if (typeof x.rel === "number" && isFinite(x.rel)) y.rel = clamp(x.rel, P().relMin, P().relMax);
      y.ally = num(x.ally, 0); y.cd = num(x.cd, 0); y.gcd = num(x.gcd, 0);
    });
    if (r.dip && typeof r.dip === "object") s.dip.formed = Math.floor(num(r.dip.formed, 0, 1e6));
    var n = 0; list().forEach(function (f) { if (s.fac[f.id].ally > s.t) { n++; if (n > P().maxAllies) s.fac[f.id].ally = 0; } });
    if (typeof r.pendingCrew === "string" && Cw() && Cw().get(r.pendingCrew)) s.pendingCrew = r.pendingCrew;
  }

  BL.factions = { meta: meta, info: info, list: list, initState: initState, rel: rel, allied: allied, allyCount: allyCount, status: status, gain: gain, incMult: incMult, defBonus: defBonus,
    atkMul: atkMul, weight: weight, refCost: refCost, cost: cost, chance: chance, blocked: blocked, act: act, formAlliance: formAlliance, onTake: onTake, onConflict: onConflict,
    tick: tick, step: step, pickFor: pickFor, eligible: eligible, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
