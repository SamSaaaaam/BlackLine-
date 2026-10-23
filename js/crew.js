/* Équipe : logique pure (recrutement, places, statistiques, expérience, bonus). Aucun DOM, aucun stockage.
   Réglages : BL.data.crew. État : s.crew = { m: { id: { lv, xp, on } } }. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function E() { return BL.economy; } function C() { return BL.data.crew; } function P() { return BL.data.crew.params; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, max) { return typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(v, max || 1e300) : d; }
  function get(id) { for (var i = 0, l = C().members; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function initState(s) { s.crew = { m: {}, v: 0 }; }
  function bump(s) { s.crew.v = (s.crew.v || 0) + 1; }
  var memo = { s: null, v: -1, val: null };
  function rec(s, id) { return s.crew && s.crew.m[id] || null; }
  function has(s, id) { return !!rec(s, id); }
  function isActive(s, id) { var r = rec(s, id); return !!(r && r.on); }
  function lvl(s, id) { var r = rec(s, id); return r ? r.lv : 0; }
  function owned(s) { return C().members.filter(function (m) { return has(s, m.id); }); }
  function active(s) { return C().members.filter(function (m) { return isActive(s, m.id); }); }
  function slots(s) { return Math.min(P().maxSlots, P().baseSlots + Math.floor(E().level(s) / P().slotEvery)); }
  function trait(m) { return C().traits[m.trait] || {}; }

  /* ---- Statistiques effectives : (base + trait) × (1 + croissance × (niveau - 1)) ---- */
  function effStat(s, id, stat) {
    var m = get(id), r = rec(s, id), L = r ? r.lv : 1, t = trait(m);
    return Math.max(0, (m.st[stat] + ((t.stat && t.stat[stat]) || 0)) * (1 + P().statGrowth * (L - 1))) * (BL.bonds ? BL.bonds.mul(s, id) : 1);   /* Partie 13 · C4 : loyauté 0,9–1,1, dispute 0,8 */
  }
  function score(s, stat) { var t = 0; active(s).forEach(function (m) { t += effStat(s, m.id, stat); }); return t; }
  function frac(s, stat) { var x = score(s, stat); return x / (x + P().k[stat]); }
  function upkeepOf(s, id) { var m = get(id), r = rec(s, id); return m.upkeep * (1 + P().upkeepGrowth * ((r ? r.lv : 1) - 1)) * (trait(m).upkeep || 1); }
  function upkeepTotal(s) { var t = 0; active(s).forEach(function (m) { t += upkeepOf(s, m.id); }); return t; }
  function passiveScale(s, id) { return (1 + P().passiveGrowth * (lvl(s, id) - 1)) * (BL.bonds ? BL.bonds.mul(s, id) : 1); }

  /* ---- Agrégat de tous les effets de l'équipe active ---- */
  function agg(s) {
    if (s.crew && memo.s === s && memo.v === s.crew.v && memo.val) return memo.val;
    var r = aggCompute(s); if (s.crew) { memo.s = s; memo.v = s.crew.v; memo.val = r; } return r;
  }
  function aggCompute(s) {
    var M = P().max, r = { inc: 0, act: {}, upkeep: 0, cost: 0, rep: 0, infl: 0, terrCost: 0, def: 0, force: 0, relGain: 0, loss: 0, atk: 0, chance: 0, negChance: 0 };
    if (!s.crew) return r;
    var list = active(s); if (!list.length) return r;
    r.upkeep = M.upkeep * frac(s, "gest"); r.inc = M.income * frac(s, "fin"); r.terrCost = M.terrCost * frac(s, "neg"); r.negChance = M.negChance * frac(s, "neg");
    var fs = frac(s, "strat"), fp = frac(s, "prot"), fd = frac(s, "dipl");
    r.force = M.force * fs; r.def = M.def * fs; r.loss = M.loss * fp; r.atk = M.atk * fp; r.relGain = M.relGain * fd; r.chance = M.chance * fd;
    list.forEach(function (m) {
      var k = passiveScale(s, m.id);
      m.passive.forEach(function (p) {
        var v = p.per * k;
        if (p.type === "income") r.inc += v; else if (p.type === "act") p.targets.forEach(function (a) { r.act[a] = (r.act[a] || 1) * (1 + v); });
        else if (p.type === "rep" || p.type === "infl") r[p.type] += v; else r[p.type] += v;
      });
    });
    if (BL.bonds) r.inc += BL.bonds.synergy(s);   /* Partie 13 · C4 : affinités entre équipiers actifs (+0,5 % par paire, plafonné) */
    return r;
  }
  function incMult(s, actId) { var a = agg(s); return (1 + a.inc) * (a.act[actId] || 1); }
  function upkeepMult(s) { return Math.max(0.3, 1 - agg(s).upkeep); }
  function costMult(s) { return Math.max(0.7, 1 - agg(s).cost); }
  function repBonus(s) { return Math.floor(agg(s).rep + EPS); }
  function inflBonus(s) { return Math.floor(agg(s).infl + EPS); }
  function passiveText(m, k) {
    var p = function (x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }, out = [];
    m.passive.forEach(function (b) {
      var v = b.per * (k || 1), n = function (a) { return E().find(BL.data.activities, a).name; };
      var t = { income: "Revenus +" + p(v), act: b.targets && b.targets.map(n).join(" et ") + " : revenus +" + p(v), upkeep: "Entretien des activités −" + p(v), cost: "Coût des activités −" + p(v), rep: "Réputation +" + Math.round(v * 10) / 10,
        infl: "Influence +" + Math.round(v * 10) / 10, terrCost: "Prix des quartiers −" + p(v), def: "Défense des quartiers +" + p(v), force: "Chance d’imposer +" + p(v), relGain: "Gains de relation +" + p(v), loss: "Pertes d’événements −" + p(v), atk: "Force des attaques rivales −" + p(v) };
      out.push(t[b.type]);
    });
    return out.join(" · ");
  }

  /* ---- Conditions de déblocage ---- */
  function reqList(s, m) {
    var q = m.unlock, out = [], L = E().level(s), T = BL.territory, F = BL.factions;
    if (q.lvl) out.push({ label: "Niveau d’empire " + q.lvl, ok: L >= q.lvl, cur: L, need: q.lvl });
    if (q.terr) { var n = T ? T.count(s) : 0; out.push({ label: "Contrôler " + q.terr + " quartier" + (q.terr > 1 ? "s" : ""), ok: n >= q.terr, cur: n, need: q.terr }); }
    if (q.dist) { var d = T && T.dist(q.dist), ok = !!(d && T.lv(s, q.dist) > 0); out.push({ label: "Contrôler : " + (d ? d.name : q.dist), ok: ok, cur: ok ? 1 : 0, need: 1 }); }
    if (q.rel) { var rel = F ? F.rel(s, q.rel.fid) : 0, f = T && T.faction(q.rel.fid); out.push({ label: "Relation avec " + (f ? f.name : q.rel.fid) + " : " + q.rel.min, ok: rel >= q.rel.min, cur: Math.round(rel), need: q.rel.min }); }
    if (q.ally) { var a = s.dip ? s.dip.formed : 0; out.push({ label: "Sceller " + q.ally + " alliance", ok: a >= q.ally, cur: a, need: q.ally }); }
    return out;
  }
  function unlocked(s, m) { return reqList(s, m).every(function (r) { return r.ok; }); }
  function state(s, m) { return has(s, m.id) ? (isActive(s, m.id) ? "active" : "reserve") : unlocked(s, m) ? "available" : "locked"; }

  /* ---- Recrutement, places, niveaux ---- */
  function recruit(s, id) {
    var m = get(id); if (!m || has(s, id) || !unlocked(s, m) || !(s.money + EPS >= m.cost)) return null;
    E().spend(s, m.cost); var on = active(s).length < slots(s);
    s.crew.m[id] = { lv: 1, xp: 0, on: on }; bump(s); return { member: m, active: on };
  }
  function setActive(s, id, on) {
    var r = rec(s, id); if (!r || r.on === !!on) return false;
    if (on && active(s).length >= slots(s)) return false;
    if (on && BL.bonds && BL.bonds.away(s, id)) return false;   /* parti : à rappeler d'abord */
    if (on && BL.heat && BL.heat.isArrested && BL.heat.isArrested(s, id)) return false;   /* arrêté : revient à l'échéance ou contre rançon */
    r.on = !!on; bump(s); return true;
  }
  function xpNeed(L) { return P().xpBase * Math.pow(P().xpGrowth, L - 1); }
  function levelCost(m, L) { return Math.ceil(m.cost * P().levelCostRatio * Math.pow(P().levelCostGrowth, L - 1) - EPS); }
  function canLevel(s, id) { var r = rec(s, id); return !!(r && r.lv < P().maxLevel && r.xp + EPS >= xpNeed(r.lv)); }
  function levelUp(s, id) {
    var r = rec(s, id), m = get(id); if (!r || !m || !canLevel(s, id)) return false;
    var c = levelCost(m, r.lv); if (!(s.money + EPS >= c)) return false;
    E().spend(s, c); r.xp -= xpNeed(r.lv); r.lv += 1; if (r.lv >= P().maxLevel) r.xp = 0; bump(s); return true;
  }
  function addXp(r, m, amount) { var need = r.lv >= P().maxLevel ? 0 : xpNeed(r.lv); r.xp = Math.min(need, r.xp + amount * (trait(m).xp || 1)); }
  function tick(s, dt) { if (!(dt > 0) || !s.crew) return; active(s).forEach(function (m) { addXp(s.crew.m[m.id], m, dt); }); }
  function award(s, amount) { if (!s.crew || !(amount > 0)) return; active(s).forEach(function (m) { addXp(s.crew.m[m.id], m, amount); }); }
  function pick(s, rng) { var l = active(s); return l.length ? l[Math.floor(rng() * l.length) % l.length] : null; }
  function maxLevel(s) { var n = 0; owned(s).forEach(function (m) { n = Math.max(n, lvl(s, m.id)); }); return n; }
  function stars(s, min) { return owned(s).filter(function (m) { return m.rarity >= min; }).length; }

  function sanitize(r, s) {
    var c = r.crew; if (!c || typeof c !== "object" || !c.m || typeof c.m !== "object") return;
    C().members.forEach(function (m) {
      var x = c.m[m.id]; if (!x || typeof x !== "object") return;
      var L = Math.max(1, Math.floor(num(x.lv, 1, P().maxLevel)));
      s.crew.m[m.id] = { lv: L, xp: L >= P().maxLevel ? 0 : Math.min(num(x.xp, 0), xpNeed(L)), on: x.on === true };
    });
    var list = active(s), cap = slots(s); /* un niveau d'empire plus bas ne peut pas laisser plus d'actifs que de places */
    for (var i = list.length - 1; i >= cap; i--) s.crew.m[list[i].id].on = false;
    bump(s);
  }

  BL.crew = { get: get, initState: initState, bump: bump, rec: rec, has: has, isActive: isActive, lvl: lvl, owned: owned, active: active, slots: slots, trait: trait, effStat: effStat, score: score, frac: frac,
    upkeepOf: upkeepOf, upkeepTotal: upkeepTotal, passiveScale: passiveScale, agg: agg, incMult: incMult, upkeepMult: upkeepMult, costMult: costMult, repBonus: repBonus, inflBonus: inflBonus,
    passiveText: passiveText, reqList: reqList, unlocked: unlocked, state: state, recruit: recruit, setActive: setActive, xpNeed: xpNeed, levelCost: levelCost, canLevel: canLevel, levelUp: levelUp,
    tick: tick, award: award, pick: pick, maxLevel: maxLevel, stars: stars, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
