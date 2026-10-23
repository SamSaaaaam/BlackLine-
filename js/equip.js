/* Équipement, Arsenal et opérations : LOGIQUE PURE (aucun DOM, aucun stockage, hasard injecté).
   État : s.eq = { inv:[{id, w, on}], lvl, hurt:{équipier:date}, op:{id, ids, start, end, chance}|null, report, won, done }.
   Règles fixes : un objet n'est JAMAIS détruit ni perdu (l'usure réduit seulement son efficacité, jusqu'à 50 %) ; un équipier blessé est indisponible
   un moment, jamais perdu ; aucune statistique de combat ne s'achète avec des lingots (cette tranche n'en vend aucune). */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9, KEYS = ["pow", "def", "stl", "spd"];
  function D() { return BL.data.equip; } function P() { return BL.data.equip.params; } function E() { return BL.economy; } function Cw() { return BL.crew; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function num(v, d, lo, hi) { return typeof v === "number" && isFinite(v) ? clamp(v, lo === undefined ? -1e300 : lo, hi === undefined ? 1e300 : hi) : d; }
  var BYID = null, BYOP = null;
  function idx() { if (!BYID) { BYID = {}; BYOP = {}; D().ITEMS.forEach(function (i) { BYID[i.id] = i; }); D().OPS.forEach(function (o) { BYOP[o.id] = o; }); } }
  function item(id) { idx(); return Object.prototype.hasOwnProperty.call(BYID, id) ? BYID[id] : null; }
  function op(id) { idx(); return Object.prototype.hasOwnProperty.call(BYOP, id) ? BYOP[id] : null; }
  var HIST_MAX = 12;
  function fresh() { return { inv: [], lvl: 0, hurt: {}, op: null, report: null, hist: [], won: 0, done: 0, fin: { own: [], on: "" } }; }
  function initState(s) { s.eq = fresh(); }
  function st(s) { return s.eq || (s.eq = fresh()); }
  function t(s) { return typeof s.t === "number" && isFinite(s.t) ? s.t : 0; }

  /* ---------- prix : suivent ta progression (unité = max(30, revenu × 40 s)) ---------- */
  function unit(s) { return Math.max(P().unitFloor, E().incomeBase(s) * P().unitIncomeSec); }
  function price(s, id) { var it = item(id); return it ? Math.ceil(unit(s) * P().rarMult[it.rar] * it.p - EPS) : 0; }
  function sellValue(s, id, fromBox) { return Math.floor(price(s, id) * (fromBox ? (BL.data.boxes ? BL.data.boxes.params.dupRatio : P().sellRatio) : P().sellRatio) + EPS); }
  function repairCost(s, i) { var x = st(s).inv[i]; if (!x || x.w >= 100) return 0; return Math.max(1, Math.ceil(price(s, x.id) * P().repairRatio * (1 - x.w / 100) - EPS)); }
  function repairAllCost(s) { var c = 0; st(s).inv.forEach(function (x, i) { c += repairCost(s, i); }); return c; }
  function capacity(s) { return P().capBase + P().capPerLevel * st(s).lvl; }
  function space(s) { return Math.max(0, capacity(s) - st(s).inv.length); }
  function capCost(s) { var l = st(s).lvl; return l >= P().capMaxLevel ? 0 : Math.ceil(unit(s) * P().capCostUnits * Math.pow(P().capCostGrowth || 2, l) - EPS); }

  /* ---------- statistiques ---------- */
  function wearFactor(x) { return P().wearMin + (1 - P().wearMin) * clamp(x.w, 0, 100) / 100; }
  function statsOf(x) { var it = item(x.id), o = { pow: 0, def: 0, stl: 0, spd: 0 }; if (!it) return o; var f = wearFactor(x); KEYS.forEach(function (k) { o[k] = (it.st[k] || 0) * f; }); return o; }
  function memberBase(s, id) {
    var c = Cw(); if (!c || !c.get(id)) return { pow: 0, def: 0, stl: 0, spd: 0 };
    var g = function (k) { return c.effStat(s, id, k); };
    return { pow: 1 + 0.5 * g("strat") + 0.5 * g("prot"), def: 1 + g("prot") + 0.3 * g("gest"), stl: 1 + 0.6 * g("neg") + 0.4 * g("dipl"), spd: 1 + 0.4 * g("fin") + 0.4 * g("strat") + 0.2 * g("gest") };
  }
  function gear(s, id) { var o = {}; st(s).inv.forEach(function (x, i) { if (x.on === id) { var it = item(x.id); if (it) o[it.slot] = i; } }); return o; }
  function gearStats(s, id) { var o = { pow: 0, def: 0, stl: 0, spd: 0 }; st(s).inv.forEach(function (x) { if (x.on === id) { var q = statsOf(x); KEYS.forEach(function (k) { o[k] += q[k]; }); } }); return o; }
  function memberStats(s, id) { var b = memberBase(s, id), g = gearStats(s, id), o = {}; KEYS.forEach(function (k) { o[k] = Math.max(0, b[k] + g[k]); }); return o; }

  /* ---------- Arsenal : acheter, équiper, retirer, vendre, réparer, agrandir ---------- */
  function locked(s, member) { var o = st(s).op; return !!(o && member && o.ids.indexOf(member) >= 0); }
  /* Achat : communs et rares ; plus une SÉLECTION d'épiques (à partir d'un niveau d'empire), à un prix nettement supérieur (jamais rentable avec la revente). */
  function listed(s, id) { var it = item(id); return !!it && (it.rar <= P().buyMaxRar || (it.rar === 2 && P().epicBuy.indexOf(id) >= 0)); }
  function buyPrice(s, id) {
    var it = item(id), p = price(s, id); if (!it) return 0; if (it.rar === 2) p = Math.max(Math.ceil(p * P().epicBuyMul - EPS), BL.gold ? Math.ceil(P().epicBuyGold * BL.gold.price(s) - EPS) : 0);
    return p;
  }
  /* État d'achat : { ok, reason, price } ; reason = la raison précise quand c'est impossible. */
  function buyState(s, id) {
    var it = item(id), p = buyPrice(s, id); if (!listed(s, id)) return { ok: false, reason: it ? "Se gagne en box ou en opération" : "Objet inconnu", price: p };
    if (it.rar === 2 && E().level(s) < P().epicMinLevel) return { ok: false, reason: "Niveau d’empire " + P().epicMinLevel + " requis", price: p };
    if (space(s) < 1) return { ok: false, reason: "Arsenal plein : " + st(s).inv.length + " / " + capacity(s) + " objets", price: p };
    if (!(s.money + EPS >= p)) return { ok: false, reason: "Il te manque " + Math.ceil(p - s.money) + " (argent du jeu)", price: p };
    return { ok: true, reason: "", price: p };
  }
  function canBuy(s, id) { var it = item(id); return !!it && listed(s, id) && (it.rar !== 2 || E().level(s) >= P().epicMinLevel); }
  function buy(s, id) {
    if (!canBuy(s, id) || space(s) < 1) return false; var c = buyPrice(s, id); if (!(s.money + EPS >= c)) return false;
    E().spend(s, c); st(s).inv.push({ id: id, w: 100, on: null }); return true;
  }
  /* Déplacer un objet vers un équipier (glisser-déposer, tap, clavier) : même règle partout. Échange si l'emplacement est occupé. */
  function mName(id) { var m = Cw() && Cw().get(id); return m ? m.name : "?"; }
  function canMove(s, i, member, slot) {
    var e = st(s), x = e.inv[i]; if (!x) return { ok: false, reason: "Objet introuvable" }; var it = item(x.id); if (!it) return { ok: false, reason: "Objet inconnu" };
    if (!Cw() || !Cw().has(s, member)) return { ok: false, reason: "Équipier inconnu" };
    if (slot && slot !== it.slot) return { ok: false, reason: "Cet emplacement reçoit : " + D().SLOTS[slot].toLowerCase() + " (cet objet est : " + D().SLOTS[it.slot].toLowerCase() + ")" };
    if (locked(s, member)) return { ok: false, reason: mName(member) + " est en mission" };
    if (x.on === member) return { ok: false, reason: "Déjà porté par " + mName(member) };
    if (x.on && locked(s, x.on)) return { ok: false, reason: mName(x.on) + " est en mission : son équipement est verrouillé" };
    return { ok: true, reason: "" };
  }
  function moveTo(s, i, member, slot) {
    var c = canMove(s, i, member, slot); if (!c.ok) return c; var e = st(s), x = e.inv[i], it = item(x.id), from = x.on, cur = null;
    e.inv.forEach(function (y) { if (y !== x && y.on === member) { var z = item(y.id); if (z && z.slot === it.slot) cur = y; } });
    if (cur) cur.on = from;                 /* échange : l'ancien objet part chez le précédent porteur (ou retourne à l'inventaire) */
    x.on = member; return { ok: true, swapped: cur ? e.inv.indexOf(cur) : -1, from: from };
  }
  /* comparaison d'un objet du catalogue (neuf) avec ce que porte déjà l'équipier dans cet emplacement */
  function compareNew(s, id, member) {
    var e = st(s), it = item(id); if (!it) return null; var nw = statsOf({ id: id, w: 100 }), cur = { pow: 0, def: 0, stl: 0, spd: 0 }, cid = null;
    e.inv.forEach(function (y) { if (y.on === member) { var z = item(y.id); if (z && z.slot === it.slot) { cid = y.id; cur = statsOf(y); } } });
    var d = {}; KEYS.forEach(function (k) { d[k] = Math.round((nw[k] - cur[k]) * 10) / 10; }); return { diff: d, current: cid };
  }
  function equip(s, i, member) {
    var e = st(s), x = e.inv[i]; if (!x || !Cw() || !Cw().has(s, member) || locked(s, member) || locked(s, x.on)) return false; var it = item(x.id); if (!it) return false;
    e.inv.forEach(function (y) { if (y !== x && y.on === member) { var z = item(y.id); if (z && z.slot === it.slot) y.on = null; } }); x.on = member; return true;
  }
  function unequip(s, i) { var x = st(s).inv[i]; if (!x || !x.on || locked(s, x.on)) return false; x.on = null; return true; }
  function sell(s, i) { var e = st(s), x = e.inv[i]; if (!x || x.on) return false; var v = sellValue(s, x.id, !!x.b); s.money += v; e.inv.splice(i, 1); return v; }
  function repair(s, i) { var x = st(s).inv[i], c = repairCost(s, i); if (!x || c <= 0 || !(s.money + EPS >= c)) return false; E().spend(s, c); x.w = 100; return true; }
  function repairAll(s) { var c = repairAllCost(s); if (c <= 0 || !(s.money + EPS >= c)) return false; E().spend(s, c); st(s).inv.forEach(function (x) { x.w = 100; }); return c; }
  function expand(s) { var c = capCost(s); if (c <= 0 || !(s.money + EPS >= c)) return false; E().spend(s, c); st(s).lvl++; return true; }
  /* comparaison avant d'équiper : différence de statistiques pour CET équipier */
  function compare(s, i, member) {
    var e = st(s), x = e.inv[i]; if (!x) return null; var it = item(x.id), nw = statsOf(x), cur = { pow: 0, def: 0, stl: 0, spd: 0 }, cidx = -1;
    e.inv.forEach(function (y, j) { if (y.on === member && j !== i) { var z = item(y.id); if (z && z.slot === it.slot) { cidx = j; cur = statsOf(y); } } });
    var d = {}; KEYS.forEach(function (k) { d[k] = Math.round((nw[k] - cur[k]) * 10) / 10; }); return { diff: d, current: cidx };
  }
  function diffText(d) { var n = { pow: "puissance", def: "défense", stl: "discrétion", spd: "vitesse" }; var o = []; KEYS.forEach(function (k) { if (Math.abs(d[k]) >= 0.05) o.push((d[k] > 0 ? "+" : "−") + String(Math.abs(d[k])).replace(".", ",") + " " + n[k]); }); return o.length ? o.join(", ") : "aucun changement"; }

  /* ---------- opérations ---------- */
  function isHurt(s, id) { return (st(s).hurt[id] || 0) > t(s) + EPS; }
  function hurtLeft(s, id) { return Math.max(0, (st(s).hurt[id] || 0) - t(s)); }
  function available(s, id) { return !!Cw() && Cw().has(s, id) && !isHurt(s, id) && !locked(s, id); }
  function opsList() { return D().OPS; }
  function opUnlock(s, o) { var lvl = E().level(s); if (lvl < o.minLvl) return { ok: false, why: "Niveau d’empire " + o.minLvl + " requis (tu es niveau " + lvl + ")." }; if (!Cw() || !Cw().owned(s).length) return { ok: false, why: "Recrute au moins un équipier dans la section Équipe." };
    if (o.fac && BL.factions && BL.factions.allied(s, o.fac)) { var fi = BL.factions.info(o.fac); return { ok: false, why: (fi ? fi.name : "Cette faction") + " est ton alliée du moment : tu ne peux pas la viser." }; }
    return { ok: true }; }
  function preview(s, o, ids) {
    var tot = { pow: 0, def: 0, stl: 0, spd: 0 }; (ids || []).forEach(function (m) { var q = memberStats(s, m); KEYS.forEach(function (k) { tot[k] += q[k]; }); });
    var sumNeed = 0, sumHave = 0, rows = []; KEYS.forEach(function (k) { var nd = o.need[k]; sumNeed += nd; sumHave += Math.min(P().covCap * nd, tot[k]); rows.push({ k: k, have: tot[k], need: nd, ok: tot[k] + EPS >= nd }); });
    var cov = sumNeed > 0 ? sumHave / sumNeed : 1, ch = (ids && ids.length) ? clamp(P().chanceBase + P().chanceSlope * cov - (BL.heat ? BL.heat.opPenalty(s) : 0), P().chanceMin, P().chanceMax) : 0;
    return { tot: tot, rows: rows, cov: cov, chance: ch };
  }
  /* Meilleure équipe pour une opération : essaie toutes les équipes de 1 à maxTeam équipiers disponibles, garde la plus haute chance (à égalité : la plus petite équipe, puis le moins de stats gaspillées). Pure, aucun effet sur l'état. */
  function bestTeam(s, o) {
    var av = (Cw() ? Cw().owned(s) : []).map(function (m) { return m.id; }).filter(function (id) { return available(s, id); }), max = P().maxTeam, best = null, bc = -1;
    function rec(start, cur) {
      if (cur.length) { var pv = preview(s, o, cur); if (pv.chance > bc + 1e-9 || (Math.abs(pv.chance - bc) <= 1e-9 && best && cur.length < best.length)) { bc = pv.chance; best = cur.slice(); } }
      if (cur.length >= max) return; for (var i = start; i < av.length; i++) { cur.push(av[i]); rec(i + 1, cur); cur.pop(); }
    }
    rec(0, []); return best ? { ids: best, chance: bc } : { ids: [], chance: 0 };
  }
  function status(s) { var o = st(s).op; if (!o) return { state: "none" }; var left = Math.max(0, o.end - t(s)); return { state: left <= 0 ? "ready" : "running", left: left, op: o, def: op(o.id) }; }
  function start(s, opId, ids) {
    var e = st(s), o = op(opId); if (!o || e.op || !Array.isArray(ids) || ids.length < 1 || ids.length > P().maxTeam) return false;
    if (!opUnlock(s, o).ok) return false; var seen = {}; for (var i = 0; i < ids.length; i++) { if (seen[ids[i]] || !available(s, ids[i])) return false; seen[ids[i]] = 1; }
    e.op = { id: o.id, ids: ids.slice(), start: t(s), end: t(s) + o.dur, chance: preview(s, o, ids).chance }; return true;
  }
  function cancel(s) { var e = st(s); if (!e.op) return false; e.op = null; return true; }
  function rollLoot(odds, rng) {
    var sum = 0; odds.forEach(function (x) { sum += x; }); var r = rng() * sum, rar = 0; for (var i = 0; i < odds.length; i++) { r -= odds[i]; if (r < 0) { rar = i; break; } rar = i; }
    while (odds[rar] <= 0 && rar > 0) rar--; var pool = D().ITEMS.filter(function (x) { return x.rar === rar; }); return pool[Math.floor(rng() * pool.length) % pool.length].id;
  }
  function resolve(s, rng) {
    var e = st(s), cur = e.op; if (!cur || t(s) + EPS < cur.end) return null; var o = op(cur.id); if (!o) { e.op = null; return null; }
    var ids = cur.ids.filter(function (m) { return Cw() && Cw().has(s, m); }), pv = preview(s, o, ids), ch = pv.chance, roll = rng();
    var ok = roll < ch, crit = ok && roll < ch * P().crit, near = !ok && roll < ch + P().nearMiss, inc = Math.max(E().incomeBase(s), 0);
    var full = Math.min(inc * o.dur * P().rewardPerSec, inc * P().rewardCapSec), money = ok ? full : near ? full * P().partialShare : 0; money = Math.floor(money + EPS);
    if (money > 0) { s.money += money; s.total += money; if (s.st) s.st.rewards += money; }
    if (BL.heat) BL.heat.opDone(s, o.tier);          /* C9 : certaines opérations attirent l'attention */
    var loot = [], sold = [], nw = [], had = {}, hasLoot = ok ? (crit ? 2 : 1) : 0; e.inv.forEach(function (x) { had[x.id] = 1; });
    for (var i = 0; i < hasLoot; i++) { var id = rollLoot(o.loot, rng); if (space(s) > 0) { e.inv.push({ id: id, w: 100, on: null }); loot.push(id); nw.push(had[id] ? 0 : 1); had[id] = 1; } else { s.money += sellValue(s, id); sold.push(id); } }
    var wear = (P().wearBase + P().wearPerTier * o.tier) * (ok ? 1 : P().wearFail); e.inv.forEach(function (x) { if (ids.indexOf(x.on) >= 0) x.w = clamp(x.w - wear, 0, 100); });
    var defR = o.need.def > 0 ? Math.min(1, pv.tot.def / o.need.def) : 1, hurt = [];
    ids.forEach(function (m) { var p = ok ? o.inj * 0.3 : clamp(o.inj + 0.25 - 0.3 * defR, 0.05, 0.7); if (rng() < p) { e.hurt[m] = t(s) + P().hurtBase + P().hurtPerTier * o.tier; hurt.push(m); } });
    var fx = null, F = BL.factions, fm = D().FAMS[o.fam];
    if (o.fac && fm && fm.win && s.fac && s.fac[o.fac]) { var fr = ok ? fm.win : fm.lose, fb = s.fac[o.fac].power; s.fac[o.fac].power = Math.max(1, fb * fr.pow); var rb = F ? F.rel(s, o.fac) : 0; if (F) F.gain(s, o.fac, fr.rel); fx = { fac: o.fac, pow: Math.round((s.fac[o.fac].power / fb - 1) * 1000) / 10, rel: Math.round(((F ? F.rel(s, o.fac) : 0) - rb) * 10) / 10 }; }
    e.done++; if (ok) e.won++; e.op = null;
    e.report = { op: o.id, ok: ok, near: near, crit: crit, chance: ch, roll: Math.round(roll * 100), tot: pv.tot, need: o.need, money: money, loot: loot, sold: sold, nw: nw, hurt: hurt, team: ids, wear: Math.round(wear * 10) / 10, at: t(s), fx: fx, seen: false };
    e.hist.unshift(JSON.parse(JSON.stringify(e.report))); if (e.hist.length > HIST_MAX) e.hist.length = HIST_MAX;
    return e.report;
  }
  /* Absence : le temps réel écoulé compte pour l'opération en cours et pour les blessures (plafonné par l'appelant). */
  function credit(s, sec) {
    var e = st(s); if (!(sec > 0) || !isFinite(sec)) return 0;
    if (e.op) e.op.end = Math.max(e.op.start, e.op.end - sec);
    Object.keys(e.hurt).forEach(function (m) { var v = e.hurt[m] - sec; if (v <= t(s)) delete e.hurt[m]; else e.hurt[m] = v; });
    return sec;
  }
  /* Opération terminée : se résout toute seule (une seule fois : e.op passe à null), le compte rendu est conservé dans l'historique. */
  function autoResolve(s, rng) { return status(s).state === "ready" ? resolve(s, rng) : null; }
  function history(s) { return st(s).hist; }
  function markSeen(s, at) { var e = st(s), n = 0; e.hist.forEach(function (r) { if (!r.seen && (at === undefined || r.at === at)) { r.seen = true; n++; } }); if (e.report && (at === undefined || e.report.at === at)) e.report.seen = true; return n; }
  /* finitions cosmétiques : lingots uniquement, aucune statistique */
  function fin(id) { var a = D().FINS; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function finOwned(s, id) { return st(s).fin.own.indexOf(id) >= 0; }
  function finBuy(s, id) { var f = fin(id), e = st(s); if (!f || finOwned(s, id) || !BL.gold || !BL.gold.canSpend(s, f.gold)) return false; BL.gold.spend(s, f.gold); e.fin.own.push(id); e.fin.on = id; return true; }
  function finSet(s, id) { var e = st(s); if (id === "") { e.fin.on = ""; return true; } if (!fin(id) || !finOwned(s, id)) return false; e.fin.on = id; return true; }
  function finCol(s) { var f = fin(st(s).fin.on); return f ? f.col : ""; }
  /* défense de quartier : l'équipement des équipiers ACTIFS renforce un peu la défense (plafonné) */
  function defBonus(s) {
    if (!s.eq || !Cw()) return 0; var sum = 0; Cw().active(s).forEach(function (m) { sum += gearStats(s, m.id).def; });
    return Math.min(P().defCap, Math.max(0, sum) * P().defPerPoint);
  }

  /* ---------- sauvegarde : tout est borné, rien d'inconnu n'est accepté ---------- */
  function sanitize(raw, s) {
    s.eq = fresh(); var r = raw && raw.eq; if (!r || typeof r !== "object" || Array.isArray(r)) return; var e = s.eq, c = Cw(), owns = function (m) { return typeof m === "string" && !!c && c.has(s, m); };
    if (r.fin && typeof r.fin === "object" && Array.isArray(r.fin.own)) { r.fin.own.forEach(function (id) { if (typeof id === "string" && fin(id) && e.fin.own.indexOf(id) < 0) e.fin.own.push(id); }); if (typeof r.fin.on === "string" && e.fin.own.indexOf(r.fin.on) >= 0) e.fin.on = r.fin.on; }
    e.lvl = Math.floor(num(r.lvl, 0, 0, P().capMaxLevel)); e.won = Math.floor(num(r.won, 0, 0, 1e9)); e.done = Math.max(e.won, Math.floor(num(r.done, 0, 0, 1e9)));
    if (Array.isArray(r.inv)) {
      var used = {}; r.inv.slice(0, capacity(s)).forEach(function (x) {
        if (!x || typeof x !== "object" || !item(x.id)) return; var it = item(x.id), on = owns(x.on) ? x.on : null, key = on + "|" + it.slot;
        if (on) { if (used[key]) on = null; else used[key] = 1; } var ni = { id: x.id, w: num(x.w, 100, 0, 100), on: on }; if (x.b === 1) ni.b = 1; e.inv.push(ni);
      });
    }
    if (r.hurt && typeof r.hurt === "object" && !Array.isArray(r.hurt)) Object.keys(r.hurt).forEach(function (m) { if (owns(m)) { var v = num(r.hurt[m], 0, 0, t(s) + 7200); if (v > t(s)) e.hurt[m] = v; } });
    if (r.op && typeof r.op === "object" && op(r.op.id) && Array.isArray(r.op.ids)) {
      var o = op(r.op.id), seen = {}, ids = r.op.ids.filter(function (m) { if (!owns(m) || seen[m]) return false; seen[m] = 1; return true; }).slice(0, P().maxTeam);
      if (ids.length) { var a = num(r.op.start, t(s), 0, t(s)), b = clamp(num(r.op.end, a + o.dur, a, a + o.dur), a, a + o.dur); e.op = { id: o.id, ids: ids, start: a, end: b, chance: num(r.op.chance, 0.5, P().chanceMin, P().chanceMax) }; }
    }
    var clean = function (q) {
      if (!q || typeof q !== "object" || !op(q.op)) return null;
      var nz = function (v, hi) { return num(v, 0, 0, hi); }, ids2 = function (a) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === "string" && item(x); }).slice(0, 4) : []; };
      var tot = {}, need = op(q.op).need; KEYS.forEach(function (k) { tot[k] = nz(q.tot && q.tot[k], 1e6); });
      var lt = ids2(q.loot), rep = { op: q.op, ok: !!q.ok, near: !!q.near && !q.ok, crit: !!q.crit && !!q.ok, chance: num(q.chance, 0.5, 0, 1), roll: Math.floor(nz(q.roll, 100)), tot: tot, need: need, money: nz(q.money, 1e18), loot: lt, sold: ids2(q.sold),
        nw: lt.map(function (_, i) { return Array.isArray(q.nw) && q.nw[i] ? 1 : 0; }), hurt: Array.isArray(q.hurt) ? q.hurt.filter(owns).slice(0, 3) : [], team: Array.isArray(q.team) ? q.team.filter(owns).slice(0, 3) : [], wear: nz(q.wear, 100), at: nz(q.at, t(s)), fx: null, seen: q.seen !== false };
      var qf = q.fx; if (qf && typeof qf === "object" && op(q.op).fac && qf.fac === op(q.op).fac) rep.fx = { fac: qf.fac, pow: num(qf.pow, 0, -100, 100), rel: num(qf.rel, 0, -100, 100) };
      return rep;
    };
    e.report = clean(r.report); if (Array.isArray(r.hist)) r.hist.slice(0, HIST_MAX).forEach(function (q) { var c = clean(q); if (c) e.hist.push(c); });
    if (e.report && !e.hist.length) e.hist.push(JSON.parse(JSON.stringify(e.report)));      /* anciennes sauvegardes : le dernier compte rendu entre dans l'historique */
  }

  BL.equip = { bestTeam: bestTeam, KEYS: KEYS, item: item, op: op, initState: initState, sanitize: sanitize, unit: unit, price: price, sellValue: sellValue, repairCost: repairCost, repairAllCost: repairAllCost, capacity: capacity, space: space, capCost: capCost,
    wearFactor: wearFactor, statsOf: statsOf, memberBase: memberBase, memberStats: memberStats, gear: gear, gearStats: gearStats, canBuy: canBuy, buy: buy, equip: equip, unequip: unequip, sell: sell, repair: repair, repairAll: repairAll, expand: expand,
    compare: compare, compareNew: compareNew, canMove: canMove, moveTo: moveTo, listed: listed, buyPrice: buyPrice, buyState: buyState, diffText: diffText, locked: locked, isHurt: isHurt, hurtLeft: hurtLeft, available: available, opsList: opsList, opUnlock: opUnlock, preview: preview, status: status, start: start, cancel: cancel, resolve: resolve, credit: credit, autoResolve: autoResolve, history: history, markSeen: markSeen, rollLoot: rollLoot, defBonus: defBonus, st: st, fin: fin, finOwned: finOwned, finBuy: finBuy, finSet: finSet, finCol: finCol };
})(typeof globalThis !== "undefined" ? globalThis : this);
