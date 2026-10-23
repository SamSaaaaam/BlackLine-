/* Territoires : logique pure (quartiers, factions rivales, conflits abstraits).
   Aucun DOM, aucun stockage, aucune connexion : tout se joue dans l'état local. Réglages : BL.data.territory. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function Cw() { return BL.crew; } function F() { return BL.factions; }
  function E() { return BL.economy; } function T() { return BL.data.territory; } function P() { return T().params; } function C() { return T().params.conflict; }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, max) { return typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(v, max || 1e300) : d; }
  function dist(id) { return find(T().districts, id); }
  function faction(id) { return find(T().factions, id); }
  function lv(s, id) { return (s.terr && s.terr.lv[id]) || 0; }
  function controlled(s) { return T().districts.filter(function (d) { return lv(s, d.id) > 0; }); }
  function count(s) { return controlled(s).length; }

  function initState(s) {
    s.terr = { lv: {}, imp: {}, conflict: null, nextConflict: C().first, won: 0, lost: 0 };
    s.fac = {}; T().factions.forEach(function (f) { s.fac[f.id] = { power: f.base, truce: 0 }; });
    s.pendingFac = null;
  }

  /* ---- Bonus des quartiers ---- */
  function bonusVal(s, d, b) { return b.per * lv(s, d.id) * (s.terr.imp[d.id + ":boost"] ? P().impBoost : 1); }
  function agg(s) {
    var r = { inc: 0, act: {}, upkeep: 0, cost: 0, rep: 0, infl: 0 };
    if (!s.terr) return r;
    if (BL.dbuild) r.inc += BL.dbuild.incSum(s);
    T().districts.forEach(function (d) {
      var L = lv(s, d.id); if (!L) return;
      r.infl += L * d.strategic * P().inflPerStrategic;
      d.bonus.forEach(function (b) {
        var v = bonusVal(s, d, b);
        if (b.type === "income") r.inc += v;
        else if (b.type === "act") b.targets.forEach(function (a) { r.act[a] = (r.act[a] || 1) * (1 + v); });
        else if (b.type === "upkeep") r.upkeep += v; else if (b.type === "cost") r.cost += v;
        else if (b.type === "rep") r.rep += v; else if (b.type === "infl") r.infl += v;
      });
    });
    return r;
  }
  function incMult(s, actId) { var a = agg(s); return (1 + a.inc) * (a.act[actId] || 1); }
  function upkeepMult(s) { return Math.max(P().upkeepFloor, 1 - agg(s).upkeep); }
  function costMult(s) { return Math.max(P().costFloor, 1 - agg(s).cost); }
  function repBonus(s) { return Math.floor(agg(s).rep + EPS); }
  function inflBonus(s) { return Math.floor(agg(s).infl + EPS); }
  function bonusText(b) {
    var p = function (x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; };
    if (b.type === "income") return "Revenus +" + p(b.per) + " par niveau";
    if (b.type === "act") return b.targets.map(function (a) { return E().find(BL.data.activities, a).name; }).join(" et ") + " : revenus +" + p(b.per) + " par niveau";
    if (b.type === "upkeep") return "Entretien −" + p(b.per) + " par niveau"; if (b.type === "cost") return "Coût des activités −" + p(b.per) + " par niveau";
    if (b.type === "rep") return "Réputation +" + b.per + " par niveau"; return "Influence +" + b.per + " par niveau";
  }
  /* Part de revenus que ce quartier apporte réellement (différence avec et sans lui). */
  function contribution(s, id) {
    var L = lv(s, id); if (!L) return 0;
    var base = E().incomeBase(s); s.terr.lv[id] = 0; var without = E().incomeBase(s); s.terr.lv[id] = L; return base - without;
  }

  /* ---- Conditions et états ---- */
  function reqList(s, d) {
    var q = d.req, out = [], L = E().level(s), I = E().influence(s);
    if (q.lvl) out.push({ label: "Niveau d’empire " + q.lvl, ok: L >= q.lvl, cur: L, need: q.lvl });
    if (q.infl) out.push({ label: "Influence " + q.infl, ok: I >= q.infl, cur: I, need: q.infl });
    for (var k in q.owned || {}) { var n = s.owned[k] || 0; out.push({ label: E().find(BL.data.activities, k).name + " : meilleur bâtiment niveau " + q.owned[k], ok: n >= q.owned[k], cur: n, need: q.owned[k] }); }
    if (q.adj) { var ok = d.neighbors.some(function (n) { return lv(s, n) > 0; }); out.push({ label: "Contrôler un quartier voisin", ok: ok, cur: ok ? 1 : 0, need: 1 }); }
    if (d.holder && F() && F().allied(s, d.holder)) out.push({ label: "Alliance avec " + faction(d.holder).name + " : quartier protégé", ok: false });
    return out;
  }
  /* Ce qu'il manque, en phrases courtes (pour « il te manque : … »). */
  function missing(s, d) {
    return reqList(s, d).filter(function (r) { return !r.ok; }).map(function (r) { return r.need === undefined ? r.label : r.label + " (" + Math.floor(r.cur) + " / " + r.need + ")"; });
  }
  function reqsOk(s, d) { return reqList(s, d).every(function (r) { return r.ok; }); }
  function state(s, d) {
    if (lv(s, d.id) > 0) return s.terr.conflict && s.terr.conflict.did === d.id ? "contested" : "controlled";
    return reqsOk(s, d) ? "available" : "locked";
  }

  /* ---- Prise de contrôle ---- */
  function holderPower(s, d) { var f = d.holder && s.fac[d.holder]; return f ? f.power : 0; }
  function takeDefense(s, d) { return d.rivalry * P().rivalryDefense + P().powerShare * holderPower(s, d); }
  function takeChance(s, d) { var me = E().influence(s) + P().inflBase; return clamp(me / (me + takeDefense(s, d)) + (Cw() ? Cw().agg(s).force : 0), P().minChance, P().maxChance); }
  function takeCost(d, mode, s) { return Math.ceil(d.cost * (mode === "force" ? P().forceRatio : 1) * (1 - (s && Cw() ? Cw().agg(s).terrCost : 0)) - EPS); }
  /* mode : "negotiate" (réussite certaine) ou "force" (moins cher, peut échouer). */
  function take(s, id, mode, rng) {
    var d = dist(id); if (!d || (mode !== "negotiate" && mode !== "force") || state(s, d) !== "available") return null;
    var c = takeCost(d, mode, s); if (!(s.money + EPS >= c)) return null;
    var p = mode === "force" ? takeChance(s, d) : 1, f = d.holder && s.fac[d.holder];
    E().spend(s, c);
    if (mode === "force" && !(rng() < p)) { if (f) f.power *= 1 + P().failPower; if (F()) F().onTake(s, d.holder, false); return { district: d, success: false, cost: c, chance: p }; }
    s.terr.lv[id] = 1; if (f) f.power *= P().takePower; if (F()) F().onTake(s, d.holder, true); if (Cw()) Cw().award(s, BL.data.crew.params.award.take);
    return { district: d, success: true, cost: c, chance: p };
  }

  /* ---- Investissements ---- */
  function investCost(d, n) { return Math.ceil(d.cost * P().investRatio * Math.pow(P().investGrowth, n - 1) - EPS); }
  function invest(s, id) {
    var d = dist(id), n = lv(s, id); if (!d || n < 1 || n >= P().maxControl) return false;
    var c = investCost(d, n); if (!(s.money + EPS >= c)) return false;
    E().spend(s, c); s.terr.lv[id] = n + 1; return true;
  }
  function impCost(d, im) { return Math.ceil(d.cost * im.cost - EPS); }
  function hasImp(s, id, slot) { return !!(s.terr && s.terr.imp[id + ":" + slot]); }
  function buyImp(s, id, slot) {
    var d = dist(id), im = find(T().improvements.map(function (x) { return { id: x.slot, x: x }; }), slot); if (!d || !im) return false; im = im.x;
    if (lv(s, id) < im.req || hasImp(s, id, slot)) return false;
    var c = impCost(d, im); if (!(s.money + EPS >= c)) return false;
    E().spend(s, c); s.terr.imp[id + ":" + slot] = true; return true;
  }

  /* ---- Factions rivales ---- */
  function held(s, fid) { return T().districts.filter(function (d) { return d.holder === fid && lv(s, d.id) === 0; }).length; }
  function target(s, f) { return f.base * (1 + P().powerPerLevel * (E().level(s) - 1)) * (1 + P().powerPerHeld * held(s, f.id)); }
  function tick(s, dt) {
    if (!(dt > 0) || !s.fac) return;
    T().factions.forEach(function (f) { var st = s.fac[f.id], tg = target(s, f); st.power += (tg - st.power) * Math.min(1, P().powerRate * dt); });
  }

  /* ---- Conflits abstraits (résolus par statistiques et décisions) ---- */
  function defense(s, d) {
    var v = C().defBase + lv(s, d.id) * d.strategic * C().defPerStrat + E().influence(s) * C().defPerInfl;
    if (hasImp(s, d.id, "guard")) v *= C().impDefense;
    if (BL.dbuild) v *= 1 + BL.dbuild.defBonus(s, d.id);
    return v * (1 + (Cw() ? Cw().agg(s).def : 0) + (F() ? F().defBonus(s) : 0) + (BL.equip ? BL.equip.defBonus(s) : 0));
  }
  function defendChance(s) { var c = s.terr.conflict; if (!c) return 0; var d = dist(c.did); var df = defense(s, d); return clamp(df / (df + c.atk), C().minChance, C().maxChance); }
  function defendCost(d) { return Math.ceil(d.cost * C().defendRatio - EPS); }
  function truceCost(d, s) { return Math.ceil(d.cost * C().negotiateRatio * (1 - (s && Cw() ? Cw().agg(s).terrCost : 0)) - EPS); }
  function schedule(s, rng) { s.terr.nextConflict = s.t + C().minGap + rng() * (C().maxGap - C().minGap); }
  function startConflict(s, rng, force) {
    if (s.terr.conflict || (!force && s.t < s.terr.nextConflict)) return null;
    var mine = controlled(s); if (!mine.length) return null;
    if (force) {   /* pression rivale arrivée à son terme (C8) : la cible est connue, pas de tirage */
      var fd = dist(force.did), ff = faction(force.fid); if (!fd || !ff || lv(s, fd.id) < 1 || !s.fac[ff.id]) return null;
      s.terr.conflict = { fid: ff.id, did: fd.id, atk: s.fac[ff.id].power * (C().atkBase + C().atkPerAggr * ff.aggression) * (F() ? F().atkMul(s, ff.id) : 1) * (1 - (Cw() ? Cw().agg(s).atk : 0)), until: s.t + C().duration };
      return s.terr.conflict;
    }
    var tot = 0; mine.forEach(function (d) { tot += d.strategic; });
    var r = rng() * tot, d = mine[mine.length - 1]; for (var i = 0; i < mine.length; i++) { r -= mine[i].strategic; if (r < 0) { d = mine[i]; break; } }
    var cands = T().factions.filter(function (f) { return s.fac[f.id].truce <= s.t && !(F() && F().allied(s, f.id)); });
    var near = cands.filter(function (f) { return d.neighbors.some(function (n) { var x = dist(n); return x.holder === f.id && lv(s, n) === 0; }); });
    var pool = near.length ? near : cands;
    if (!pool.length) { s.terr.nextConflict = s.t + 60; return null; }
    var W = function (x) { return x.aggression * (F() ? F().weight(s, x.id) : 1); }, wt = 0; pool.forEach(function (f) { wt += W(f); });
    var q = rng() * wt, f = pool[pool.length - 1]; for (i = 0; i < pool.length; i++) { q -= W(pool[i]); if (q < 0) { f = pool[i]; break; } }
    var atk = s.fac[f.id].power * (C().atkBase + C().atkPerAggr * f.aggression) * (F() ? F().atkMul(s, f.id) : 1) * (1 - (Cw() ? Cw().agg(s).atk : 0));
    s.terr.conflict = { fid: f.id, did: d.id, atk: atk, until: s.t + C().duration };
    return s.terr.conflict;
  }
  function applyLoss(s, rng, type) {
    var c = s.terr.conflict, d = dist(c.did), f = s.fac[c.fid], dropped = false;
    if (lv(s, d.id) > 1) { s.terr.lv[d.id] -= 1; dropped = true; }
    f.power *= C().losePower; s.terr.lost += 1; s.terr.conflict = null; schedule(s, rng);
    return { type: type, district: d, faction: faction(c.fid), dropped: dropped };
  }
  /* mode : "defend" (coûte, peut échouer) ou "negotiate" (coûte plus cher, garanti, trêve avec la faction). */
  function resolve(s, mode, rng) {
    var c = s.terr.conflict; if (!c) return null;
    var d = dist(c.did), cost = mode === "defend" ? defendCost(d) : mode === "negotiate" ? truceCost(d, s) : null;
    if (cost === null || !(s.money + EPS >= cost)) return null;
    E().spend(s, cost);
    if (mode === "negotiate") { s.fac[c.fid].truce = s.t + C().truce; var f = faction(c.fid); s.terr.conflict = null; schedule(s, rng); if (F()) F().onConflict(s, c.fid, "truce"); if (Cw()) Cw().award(s, BL.data.crew.params.award.truce); return { type: "truce", district: d, faction: f, cost: cost }; }
    var p = defendChance(s);
    if (rng() < p) { s.fac[c.fid].power *= C().winPower; s.terr.won += 1; var w = faction(c.fid); s.terr.conflict = null; schedule(s, rng); if (F()) F().onConflict(s, c.fid, "won"); if (Cw()) Cw().award(s, BL.data.crew.params.award.defend); return { type: "won", district: d, faction: w, cost: cost, chance: p }; }
    var r = applyLoss(s, rng, "lost"); r.cost = cost; r.chance = p; return r;
  }
  /* Appelée régulièrement : déclenche les conflits et gère l'expiration. Renvoie la liste des notifications. */
  function step(s, rng) {
    var out = [], c = s.terr && s.terr.conflict;
    if (c && s.t >= c.until) out.push(applyLoss(s, rng, "ignored"));
    else if (!c) { var n = startConflict(s, rng); if (n) out.push({ type: "start", conflict: n, district: dist(n.did), faction: faction(n.fid) }); }
    return out;
  }

  /* ---- Sauvegarde ---- */
  function sanitize(r, s) {
    var t = r.terr;
    if (t && typeof t === "object") {
      T().districts.forEach(function (d) {
        var n = Math.floor(num(t.lv && t.lv[d.id], 0, P().maxControl)); if (n > 0) s.terr.lv[d.id] = n;
        T().improvements.forEach(function (im) { if (t.imp && t.imp[d.id + ":" + im.slot] === true) s.terr.imp[d.id + ":" + im.slot] = true; });
      });
      var c = t.conflict;
      if (c && typeof c === "object" && faction(c.fid) && dist(c.did) && lv(s, c.did) > 0 && typeof c.atk === "number" && isFinite(c.atk) && c.atk >= 0 && typeof c.until === "number" && isFinite(c.until) && c.until >= 0)
        s.terr.conflict = { fid: c.fid, did: c.did, atk: c.atk, until: c.until };
      s.terr.nextConflict = num(t.nextConflict, s.t + C().first);
      s.terr.won = Math.floor(num(t.won, 0, 1e6)); s.terr.lost = Math.floor(num(t.lost, 0, 1e6));
    }
    if (r.fac && typeof r.fac === "object") T().factions.forEach(function (f) { var x = r.fac[f.id]; if (x && typeof x === "object") s.fac[f.id] = { power: Math.max(1, num(x.power, f.base, 1e12)), truce: num(x.truce, 0) }; });
    if (typeof r.pendingFac === "string" && faction(r.pendingFac)) s.pendingFac = r.pendingFac;
  }

  BL.territory = { initState: initState, agg: agg, incMult: incMult, upkeepMult: upkeepMult, costMult: costMult, repBonus: repBonus, inflBonus: inflBonus, bonusText: bonusText, contribution: contribution,
    dist: dist, faction: faction, lv: lv, controlled: controlled, count: count, reqList: reqList, missing: missing, reqsOk: reqsOk, state: state,
    holderPower: holderPower, takeDefense: takeDefense, takeChance: takeChance, takeCost: takeCost, take: take, investCost: investCost, invest: invest, impCost: impCost, hasImp: hasImp, buyImp: buyImp,
    held: held, target: target, tick: tick, defense: defense, defendChance: defendChance, defendCost: defendCost, truceCost: truceCost, startConflict: startConflict, resolve: resolve, step: step, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
