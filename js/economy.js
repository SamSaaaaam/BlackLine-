/* Logique économique pure : aucun accès au DOM ni au stockage. Tous les chiffres viennent de BL.data.balance. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data; } function B() { return BL.data.balance; }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  var EPS = 1e-9;

  function newState(now) {
    var s = { money: B().startMoney, total: B().startMoney, owned: {}, upg: {}, boost: null, t: 0, nextEvent: 60, pending: null, saved: now || 0, log: [],
      bl: {}, claimed: {}, ach: {}, bonus: { rep: 0, infl: 0 }, st: { earned: 0, spent: 0, upkeep: 0, rewards: 0 } };
    if (BL.territory) BL.territory.initState(s);
    if (BL.crew) BL.crew.initState(s);
    if (BL.factions) BL.factions.initState(s);
    if (BL.gold) BL.gold.initState(s);
    if (BL.equip) BL.equip.initState(s);
    if (BL.hq) BL.hq.initState(s);
    if (BL.shop) BL.shop.initState(s);
    if (BL.boxes) BL.boxes.initState(s);
    if (BL.walls) BL.walls.initState(s);
    if (BL.state10) BL.state10.initState(s);
    if (BL.saga) BL.saga.initState(s);
    if (BL.war) BL.war.initState(s);
    if (BL.meta) BL.meta.initState(s);
    return s;
  }
  function count(o) { var n = 0; for (var k in o) n += typeof o[k] === "number" ? o[k] : (o[k] ? 1 : 0); return n; }
  function fxSum(s, key) { var n = 0; D().upgrades.forEach(function (u) { if (s.upg[u.id] && u.fx[key]) n += u.fx[key]; }); return n; }
  function fxProd(s, key) { var m = 1; D().upgrades.forEach(function (u) { if (s.upg[u.id] && u.fx[key]) m *= u.fx[key]; }); return m; }

  function levelAt(L) { L = Math.floor(L); var f = B().levelFrom2 || 1e9; if (L <= f) return Math.round(B().levelBase * Math.pow(L - 1, B().levelExp)); return Math.round(B().levelBase2 * Math.pow(B().levelRatio2, L - f - 1)); }
  function level(s) {
    var max = B().maxEmpireLevel, f = B().levelFrom2 || 1e9, t = Math.max(0, s.total), L;
    if (t >= levelAt(f + 1) && max > f) L = Math.min(max, f + 1 + Math.floor(Math.log(t / B().levelBase2) / Math.log(B().levelRatio2) + 1e-9));
    else L = Math.min(max, f, 1 + Math.floor(Math.pow(t / B().levelBase, 1 / B().levelExp)));
    while (L < max && t >= levelAt(L + 1)) L++;
    while (L > 1 && t < levelAt(L)) L--;
    return L;
  }
  function tr() { return BL.territory; } function cw() { return BL.crew; } function fc() { return BL.factions; } function sa() { return BL.saga; }
  function reputation(s) { return Math.floor(Math.sqrt(Math.max(0, s.total)) / B().repDivisor) + s.bonus.rep + fxSum(s, "rep") + count(s.ach) + (tr() ? tr().repBonus(s) : 0) + (cw() ? cw().repBonus(s) : 0) + (sa() ? sa().repBonus(s) : 0); }
  function influence(s) { return Math.floor(count(s.owned) / 2) + s.bonus.infl + fxSum(s, "infl") + (tr() ? tr().inflBonus(s) : 0) + (cw() ? cw().inflBonus(s) : 0); }
  function repMult(s) { return 1 + Math.min(B().repIncomeCap, reputation(s) * B().repIncomePerPoint); }
  function levelMult(s) { return 1 + (level(s) - 1) * B().levelIncomePerLevel; }
  function lossCut(s) { return Math.min(0.8, Math.min(B().influenceLossCap, influence(s) * B().influenceLossPerPoint) + (cw() ? cw().agg(s).loss : 0)); }

  function upgMult(s, id) { var m = fxProd(s, "incAll"); D().upgrades.forEach(function (u) { if (s.upg[u.id] && u.fx.inc && u.fx.inc[id]) m *= u.fx.inc[id]; }); return m; }
  function upkeepMult(s) { return fxProd(s, "upkeep") * (tr() ? tr().upkeepMult(s) : 1) * (cw() ? cw().upkeepMult(s) : 1) * (sa() ? sa().upkeepMult(s) : 1); }
  function costMult(s) { return fxProd(s, "cost") * (tr() ? tr().costMult(s) : 1) * (cw() ? cw().costMult(s) : 1) * (BL.meta ? BL.meta.costMul(s) : 1); }
  function msMult(n) { var m = 1; B().milestones.forEach(function (x) { if (n >= x.lvl) m *= x.mult; }); return m; }
  /* Designs de bâtiments : un nouveau look tous les 5 niveaux jusqu'à 45, puis tous les 10 niveaux : 15 paliers (1-4, 5-9, …, 45-49, 50-59, …, 90-100) ; affichage seulement, aucun effet sur les revenus. */
  var DESIGN_LEVELS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90], DESIGN_NAMES = ["Délabré", "Modeste", "Soigné", "Élégant", "Prestigieux", "Légendaire", "Impérial", "Somptueux", "Monumental", "Éternel", "Sacré", "Souverain", "Céleste", "Divin", "Absolu"];
  function designTier(n) { var t = 0; for (var i = 1; i < DESIGN_LEVELS.length; i++) if (n >= DESIGN_LEVELS[i]) t = i; return t; }
  function nextDesign(n) { for (var i = 0; i < DESIGN_LEVELS.length; i++) if (n < DESIGN_LEVELS[i]) return DESIGN_LEVELS[i]; return null; }
  function nextMs(n) { var ms = B().milestones; for (var i = 0; i < ms.length; i++) if (n < ms[i].lvl) return ms[i]; return null; }
  function baseCostAt(a, n) {
    var f = B().lateFrom, f2 = B().lateFrom2 || 1e9, g2 = a.growth2 || (a.growth + B().lateGrowthAdd), g3 = a.growth3 || (a.growth + (B().lateGrowthAdd2 || 0));
    return a.baseCost * Math.pow(a.growth, Math.min(n, f)) * Math.pow(g2, Math.max(0, Math.min(n, f2) - f)) * Math.pow(g3, Math.max(0, n - f2));
  }
  function cost(a, n, s, i) { return Math.ceil(baseCostAt(a, n) * (s ? costMult(s) : 1) * (BLD_LC[i || 0] || 1) - EPS); }
  function actUnlocked(s, a) { return !a.unlock || (s.owned[a.unlock.id] || 0) >= a.unlock.lvl; }
  function isMax(s, a) { var L = levels(s, a.id); return L.length > 0 && L.every(function (n) { return n >= a.maxLevel; }); }

  /* Bâtiments : chaque bâtiment a SON niveau (s.bl[activité] = [niveau du bâtiment 1, du 2, …], 4 au plus).
     - Améliorer un bâtiment ne change que lui. Le revenu d'une activité est la somme de ses bâtiments ; le bâtiment n° i compte pour BLD_W[i] (1, 0,4, 0,3, 0,2).
     - Le prix d'un niveau ne dépend que du niveau de CE bâtiment ; un bâtiment annexe (2 à 4) coûte BLD_LC = 50 % du prix du bâtiment principal au même niveau (il rapporte moins, mais coûte moins).
     - Un nouveau bâtiment (2 à 4) se débloque quand le MEILLEUR bâtiment de l'activité atteint le palier BLD_NEED (5, 10, 15), démarre au niveau 1 et coûte
       baseCost × growth^(0,7×réf) × réf × 0,06 × (nombre de bâtiments déjà construits), réf = max(palier, meilleur niveau).
     - s.owned[activité] reste le niveau du MEILLEUR bâtiment : c'est lui que lisent les conditions de déblocage, objectifs, succès, influence et l'entretien.
     - Entretien : inchangé, il dépend du meilleur bâtiment seulement (un bâtiment annexe ne coûte pas d'entretien supplémentaire).
     - Ancien système (+20 % par bâtiment) supprimé : remplacé par les poids ci-dessus (plateau +19 % de revenu à 4 bâtiments au maximum, rythme de jeu inchangé à ±5 % en simulation). */
  var BLD_LC = [1, 0.5, 0.5, 0.5], BLD_NEED = [1, 5, 10, 15], BLD_W = [1, 0.4, 0.3, 0.2], BLD_ENTRY = 0.06, BLD_EXP = 0.7, BLD_LEGACY = 0.2;
  function levels(s, id) {
    var b = s.bl && s.bl[id]; if (Array.isArray(b) && b.length) return b;
    var n = s.owned[id] || 0; return n > 0 ? [n] : [];
  }
  function buildings(s, id) { return levels(s, id).length; }
  function bLevel(s, id, i) { return levels(s, id)[i] || 0; }
  function best(s, id) { var m = 0; levels(s, id).forEach(function (n) { if (n > m) m = n; }); return m; }
  function setLevels(s, id, arr) { if (!s.bl) s.bl = {}; s.bl[id] = arr; s.owned[id] = Math.max.apply(null, arr); }
  function setOwned(s, id, n, count) { var arr = []; for (var i = 0; i < Math.max(1, count || 1); i++) arr.push(i === 0 ? n : 1); if (n > 0) setLevels(s, id, arr); else { s.owned[id] = 0; if (s.bl) delete s.bl[id]; } }
  function nextBuilding(s, a) {
    var c = buildings(s, a.id); if (c < 1 || c >= BLD_NEED.length) return null; var b = best(s, a.id), need = BLD_NEED[c], ref = Math.max(need, b);
    return { idx: c, need: need, ok: b >= need, cost: Math.ceil(a.baseCost * Math.pow(a.growth, BLD_EXP * ref) * costMult(s) * ref * BLD_ENTRY * c - EPS) };
  }
  function buyBuilding(s, id) {
    var a = find(D().activities, id); if (!a) return false; var nb = nextBuilding(s, a); if (!nb || !nb.ok || !(s.money + EPS >= nb.cost)) return false;
    spend(s, nb.cost); var arr = levels(s, id).slice(); arr.push(1); setLevels(s, id, arr); return true;
  }
  /* Niveaux de départ des bâtiments supplémentaires d'une ancienne sauvegarde : le plus petit niveau n tel que BLD_W[i] × n × paliers(n) ≥ 0,2 × N × paliers(N)
     (l'ancien bonus de +20 % par bâtiment). Le revenu brut ne baisse donc jamais, et l'entretien ne change pas : le revenu net non plus. */
  function legacyLevels(a, N, k) {
    N = Math.max(1, Math.min(a.maxLevel, Math.floor(N) || 1)); k = Math.max(1, Math.min(BLD_NEED.length, Math.floor(k) || 1)); var out = [N];
    for (var i = 1; i < k; i++) { var tgt = BLD_LEGACY * N * msMult(N), n = 1; while (n < N && BLD_W[i] * n * msMult(n) + EPS < tgt) n++; out.push(n); }
    return out;
  }
  function mults(s, id) { return upgMult(s, id) * repMult(s) * levelMult(s) * (tr() ? tr().incMult(s, id) : 1) * (cw() ? cw().incMult(s, id) : 1) * (fc() ? fc().incMult(s) : 1) * (sa() ? sa().incMult(s) : 1) * (BL.heat && BL.heat.incMul ? BL.heat.incMul(s) : 1) * (BL.war ? BL.war.incMult(s) : 1) * (BL.meta ? BL.meta.incMul(s) : 1); }
  function bldIncome(s, a, i, n) { return n * a.baseIncome * (BLD_W[i] || 0) * msMult(n) * mults(s, a.id); }
  function actIncome(s, a) { var m = mults(s, a.id), t = 0; levels(s, a.id).forEach(function (n, i) { t += n * a.baseIncome * (BLD_W[i] || 0) * msMult(n) * m; }); return t; }
  /* gain de revenu brut si le bâtiment i passe au niveau suivant */
  function gainOf(s, a, i) { var n = bLevel(s, a.id, i); return bldIncome(s, a, i, n + 1) - bldIncome(s, a, i, n); }
  /* gain net d'un niveau de plus au bâtiment i : l'entretien n'augmente que si ce bâtiment devient le meilleur */
  function netGainOf(s, a, i) { var n = bLevel(s, a.id, i); return gainOf(s, a, i) - (n + 1 > best(s, a.id) ? a.baseIncome * a.upkeep * upkeepMult(s) : 0); }
  function upkeepOf(s, a) { return best(s, a.id) * a.baseIncome * a.upkeep * upkeepMult(s); }
  function sum(f) { var t = 0; D().activities.forEach(function (a) { t += f(a); }); return t; }
  function grossBase(s) { return sum(function (a) { return actIncome(s, a); }); }
  function upkeepTotal(s) { return sum(function (a) { return upkeepOf(s, a); }) + (cw() ? cw().upkeepTotal(s) : 0); }
  function boostMult(s) { return s.boost && s.t < s.boost.until ? s.boost.mult : 1; }
  function incomeBase(s) { return Math.max(0, grossBase(s) - upkeepTotal(s)); }
  function income(s) { return Math.max(0, grossBase(s) * boostMult(s) - upkeepTotal(s)); }
  function breakdown(s) { var g = grossBase(s) * boostMult(s), u = Math.min(upkeepTotal(s), g); return { gross: g, upkeep: u, net: g - u }; }

  function tick(s, dt) {
    if (!(dt > 0)) return;
    var b = breakdown(s);
    s.money += b.net * dt; s.total += b.net * dt; s.t += dt;
    s.st.earned += b.gross * dt; s.st.upkeep += b.upkeep * dt;
    if (tr()) tr().tick(s, dt);
    if (cw()) cw().tick(s, dt);
    if (fc()) fc().tick(s, dt);
  }
  function spend(s, c) { s.money = Math.max(0, s.money - c); s.st.spent += c; }
  /* Achète le prochain niveau du bâtiment i (0 = premier bâtiment ; pour une activité pas encore possédée, achète son premier bâtiment). */
  function buyActivity(s, id, i) {
    var a = find(D().activities, id); if (!a) return false;
    var c0 = buildings(s, id); if (i === undefined) i = 0; if (!Number.isInteger(i) || i < 0 || i >= Math.max(1, c0) || !actUnlocked(s, a)) return false;
    var n = bLevel(s, id, i); if (n >= a.maxLevel) return false;
    var c = cost(a, n, s, i); if (!(s.money + EPS >= c)) return false;
    spend(s, c); var arr = c0 ? levels(s, id).slice() : []; arr[i] = n + 1; setLevels(s, id, arr); return true;
  }
  function unlocked(s, u) { for (var k in u.req) if ((s.owned[k] || 0) < u.req[k]) return false; return true; }
  function buyUpgrade(s, id) {
    var u = find(D().upgrades, id);
    if (!u || s.upg[id] || !unlocked(s, u) || !(s.money + EPS >= u.cost)) return false;
    spend(s, u.cost); s.upg[id] = true; return true;
  }

  /* Missions et succès */
  function progress(s, c) {
    var cur = 0, tg = c.n;
    if (c.t === "owned") cur = s.owned[c.id] || 0; else if (c.t === "income") cur = incomeBase(s); else if (c.t === "level") cur = level(s);
    else if (c.t === "total") cur = s.total; else if (c.t === "upgrades") cur = count(s.upg); else if (c.t === "rep") cur = reputation(s); else if (c.t === "infl") cur = influence(s);
    else if (c.t === "terr") cur = tr() ? tr().count(s) : 0; else if (c.t === "dlv") cur = tr() ? tr().lv(s, c.id) : 0; else if (c.t === "won") cur = s.terr ? s.terr.won : 0;
    else if (c.t === "crew") cur = cw() ? cw().owned(s).length : 0; else if (c.t === "clv") cur = cw() ? cw().maxLevel(s) : 0; else if (c.t === "star") { cur = cw() ? cw().stars(s, c.n) : 0; tg = 1; } else if (c.t === "ally") cur = s.dip ? s.dip.formed : 0;
    else if (c.t === "all") { D().activities.forEach(function (a) { if ((s.owned[a.id] || 0) >= c.n) cur++; }); tg = D().activities.length; }
    else if (BL.meta) { var mv = BL.meta.achProgress(s, c); if (mv !== null && mv !== undefined) cur = mv; }   /* Partie 13 : histoire, boss, liens, prestige, défis, mode difficile */
    return { cur: cur, tg: tg, p: tg > 0 ? Math.min(1, cur / tg) : 1, done: cur + EPS >= tg };
  }
  function claim(s, id) {
    var m = find(D().missions, id); if (!m || s.claimed[id] || !progress(s, m.cond).done) return null;
    var r = m.reward, amt = r.money || 0;
    s.money += amt; s.total += amt; s.st.rewards += amt; s.bonus.rep += r.rep || 0; s.bonus.infl += r.infl || 0; s.claimed[id] = true;
    return { mission: m, amount: amt };
  }
  function checkAch(s) {
    var out = []; D().achievements.forEach(function (a) { if (!s.ach[a.id] && progress(s, a.cond).done) { s.ach[a.id] = true; out.push(a); } }); return out;
  }
  function nextStep(s) {
    var L = level(s), lo = levelAt(L), hi = levelAt(L + 1), best = null;
    if (L < B().maxEmpireLevel) best = { kind: "level", label: "Niveau d’empire " + (L + 1), p: (s.total - lo) / (hi - lo), need: hi - s.total };
    D().missions.forEach(function (m) {
      if (s.claimed[m.id]) return; var p = progress(s, m.cond);
      if (p.done) { if (!best || best.kind !== "claim") best = { kind: "claim", label: m.name, p: 1, id: m.id }; return; }
      if (!best || (best.kind !== "claim" && p.p > best.p)) best = { kind: "mission", label: m.name, p: p.p, id: m.id };
    });
    return best;
  }

  /* Revenus hors ligne : plafonnés, à rendement réduit, sans boost temporaire.
     La période compte de `fromMs` (par défaut la dernière sauvegarde) jusqu'à `nowMs`. Après calcul, la date de référence passe à `nowMs` :
     un second appel immédiat ne rapporte donc rien (pas de double réclamation). Une date dans le futur (horloge modifiée) ne rapporte rien. */
  function offline(s, nowMs, fromMs) {
    var from = fromMs === undefined ? s.saved : fromMs, raw = (nowMs - from) / 1000, future = !(raw >= 0) || !isFinite(raw);
    var elapsed = future ? 0 : raw, sec = Math.min(elapsed, B().offlineCapSec), rate = incomeBase(s), gain = rate * sec * B().offlineEfficiency;
    if (!isFinite(gain) || gain < 0) gain = 0;
    var boostLost = !!(s.boost && s.t < s.boost.until && elapsed > 0);
    s.money += gain; s.total += gain; s.st.earned += gain; if (elapsed > 0) s.boost = null;
    s.saved = isFinite(nowMs) ? nowMs : s.saved;
    return { elapsed: elapsed, sec: sec, gain: gain, rate: rate, capped: elapsed > B().offlineCapSec, future: future, boostLost: boostLost };
  }
  /* Faits notables à signaler au retour (ce qui attend le joueur ou a été perdu). */
  function offlineNotes(s, off) {
    var n = [], ev = s.pending && find(D().events, s.pending), c = s.terr && s.terr.conflict;
    if (off.future) n.push("L’horloge de l’appareil indique une date antérieure à ta dernière sauvegarde : aucun revenu n’a été compté.");
    if (off.capped) n.push("Plafond atteint : seules " + Math.round(B().offlineCapSec / 3600) + " h sont comptées.");
    if (off.boostLost) n.push("Ton bonus temporaire a expiré pendant ton absence.");
    if (ev) n.push("Un événement t’attend : " + fText(ev.title, s.pendingFac, s.pendingCrew) + ".");
    if (c && tr()) { var d = tr().dist(c.did), f = find(D().territory.factions, c.fid); if (d && f) n.push(f.name + " menace " + d.name + " : une décision t’attend dans Territoires."); }
    if (off.heat && off.heat.to >= 25) n.push("Chaleur à " + Math.round(off.heat.to) + " % (" + off.heat.name.toLowerCase() + ") après ton absence. Aucune descente n’a eu lieu : fais-la redescendre dans Chaleur.");
    if (off.rivals && BL.rivals) { var rn = BL.rivals.note(off.rivals); if (rn) n.push(rn); }   /* C8 : une seule phrase, jamais une rafale */
    return n;
  }
  function schedule(s, rng) { s.nextEvent = s.t + 45 + rng() * 45; }
  function updateEvents(s, rng) {
    if (s.pending || s.t < s.nextEvent || income(s) <= 0) return null;
    var list = D().events.filter(function (e) {
      if (e.terr && !(tr() && tr().count(s) > 0)) return false;
      if (e.crew && !(cw() && cw().active(s).length)) return false;
      if (e.minLvl && level(s) < e.minLvl) return false;
      if (e.heatMin && !(BL.heat && BL.heat.state(s).v >= e.heatMin)) return false;
      if ((e.fac || e.terr) && fc() && (e.needRel !== undefined || e.maxRel !== undefined || e.noAlly) && !fc().eligible(s, e)) return false;
      return true;
    }), ev = list[Math.floor(rng() * list.length) % list.length];
    s.pending = ev.id; s.pendingFac = null; s.pendingCrew = null;
    if (ev.terr || ev.fac) { var fs = D().territory.factions; s.pendingFac = fc() ? fc().pickFor(s, rng, ev) : fs[Math.floor(rng() * fs.length) % fs.length].id; }
    if (ev.crew && cw()) { var cm = cw().pick(s, rng); s.pendingCrew = cm ? cm.id : null; }
    return ev;
  }
  /* Une option peut exiger un équipier ACTIF d'un rôle donné : renvoie { ok, who, why } (l'équipier le plus expérimenté si plusieurs). */
  function need(s, c) {
    if (!c || !c.need) return { ok: true, who: null, why: "" };
    var cwm = cw(), role = BL.data.crew && BL.data.crew.roles[c.need.role], rn = role ? role.name : c.need.role;
    var list = cwm ? cwm.active(s).filter(function (m) { return m.role === c.need.role; }) : [];
    list.sort(function (a, b) { return cwm.lvl(s, b.id) - cwm.lvl(s, a.id); });
    return list.length ? { ok: true, who: list[0].id, why: list[0].name + " (" + rn.toLowerCase() + ") ouvre cette porte." } : { ok: false, who: null, why: "Demande un équipier actif de rôle " + rn.toLowerCase() + "." };
  }
  function pct(x) { return String(Math.round(Math.abs(x) * 1000) / 10).replace(".", ","); }
  function durTxt(d) { return d < 120 ? d + " s" : Math.round(d / 60) + " min"; }
  /* Effets d'une issue, en phrases. real : montant réellement appliqué (sinon estimé avec les revenus du moment). */
  function parts(s, out, fmt, real) {
    var r = [], sg = function (v) { return v > 0 ? "+" : "−"; };
    if (out.sec) { var v = real !== undefined ? real : out.sec * Math.max(incomeBase(s), 1); r.push((real !== undefined ? "" : "≈ ") + sg(v) + fmt(Math.abs(v))); }
    if (out.boost) r.push("revenus ×" + String(out.boost.mult).replace(".", ",") + " pendant " + durTxt(out.boost.dur));
    if (out.heat) r.push("chaleur " + sg(out.heat) + Math.abs(out.heat));
    if (out.infl) r.push(sg(out.infl) + Math.abs(out.infl) + " influence");
    if (out.rel) r.push("relation avec {f} " + sg(out.rel) + Math.abs(out.rel));
    if (out.relG) r.push("relation avec {g} " + sg(out.relG) + Math.abs(out.relG));
    if (out.fpow) r.push("influence de {f} " + (out.fpow > 1 ? "+" : "−") + pct(out.fpow - 1) + " %");
    if (out.press) r.push("pression de {f} " + sg(out.press) + Math.abs(out.press));
    if (out.ally) r.push("alliance de " + durTxt(out.ally));
    if (out.truce) r.push("trêve de " + durTxt(out.truce));
    if (out.xp) r.push("l’équipe progresse");
    return r;
  }
  /* Indication de risque / récompense AFFICHÉE : générée depuis la règle (pourcentages exacts), sauf texte écrit à la main (anciens événements). */
  function hint(s, ev, i, fmt) {
    var c = ev && ev.choices[i]; if (!c) return "";
    var f = function (x) { return fText(x, s.pendingFac, s.pendingCrew); };
    if (c.hint) return f(c.hint);
    var o = c.out, j = function (a) { return a.length ? a.join(", ") : "rien ne change"; };
    if (o.chance !== undefined) return f(pct(o.chance) + " % de réussite : " + j(parts(s, o.win, fmt)) + ". Sinon : " + j(parts(s, o.lose, fmt)) + ".");
    return f(parts(s, o, fmt).length ? j(parts(s, o, fmt)).replace(/^./, function (m) { return m.toUpperCase(); }) : "Rien ne change");
  }
  function resolve(s, choiceIdx, rng) {
    var ev = find(D().events, s.pending); if (!ev || !ev.choices[choiceIdx]) return null;
    var ch = ev.choices[choiceIdx], nd = need(s, ch); if (!nd.ok) return null;
    var out = ch.out, won = null, chance = null;
    if (out.chance !== undefined) { chance = out.chance; won = rng() < out.chance; out = won ? out.win : out.lose; }
    var amt = 0, pf = s.pendingFac, F = pf && s.fac && s.fac[pf];
    if (out.sec) {
      amt = out.sec * Math.max(incomeBase(s), 1);
      if (amt < 0) { amt *= 1 - lossCut(s); amt = -Math.min(-amt, s.money); }
      s.money += amt; if (amt > 0) s.total += amt;
    }
    if (out.boost) s.boost = { mult: out.boost.mult, until: s.t + out.boost.dur };
    if (out.infl) s.bonus.infl += out.infl;
    if (out.heat && BL.heat) { var hh = BL.heat.state(s); hh.v = Math.max(0, Math.min(100, hh.v + out.heat)); }
    if (F && out.fpow) F.power *= out.fpow;
    if (F && out.truce) F.truce = s.t + out.truce;
    if (F && out.rel && fc()) fc().gain(s, pf, out.rel);
    if (pf && out.relG && fc()) { var rv = fc().meta(pf).rival; if (rv) fc().gain(s, rv, out.relG); }
    if (pf && out.press && s.rivals) { var rx = s.rivals.st[pf] || (s.rivals.st[pf] = { p: 0, seen: false }); rx.p = Math.max(0, Math.min(100, rx.p + out.press)); }
    if (F && out.ally && fc()) fc().formAlliance(s, pf, out.ally);
    if (out.xp && cw()) cw().award(s, out.xp);
    var pc = s.pendingCrew; s.pending = null; s.pendingFac = null; s.pendingCrew = null; schedule(s, rng);
    return { event: ev, choice: ch, amount: amt, faction: pf, crew: pc, out: out, won: won, chance: chance, who: nd.who };
  }
  function fText(str, fid, cid) {
    var f = fid && D().territory ? find(D().territory.factions, fid) : null, m = fid && fc() ? fc().meta(fid) : null, g = m && m.rival ? find(D().territory.factions, m.rival) : null, c = cid && cw() ? cw().get(cid) : null;
    return str.replace(/\{f\}/g, f ? f.name : "Un rival").replace(/\{g\}/g, g ? g.name : "ses rivaux").replace(/\{c\}/g, c ? c.name : "Un équipier");
  }
  function addLog(s, msg) { s.log.unshift(msg); if (s.log.length > 20) s.log.length = 20; }

  BL.economy = { BLD_EXP: BLD_EXP, BLD_ENTRY: BLD_ENTRY, BLD_NEED: BLD_NEED, BLD_W: BLD_W, BLD_LC: BLD_LC, buildings: buildings, levels: levels, bLevel: bLevel, best: best, setLevels: setLevels, setOwned: setOwned, legacyLevels: legacyLevels, bldIncome: bldIncome, gainOf: gainOf, netGainOf: netGainOf, nextBuilding: nextBuilding, buyBuilding: buyBuilding, newState: newState, find: find, count: count, level: level, levelAt: levelAt, reputation: reputation, influence: influence, repMult: repMult, levelMult: levelMult, lossCut: lossCut,
    designTier: designTier, nextDesign: nextDesign, DESIGN_LEVELS: DESIGN_LEVELS, DESIGN_NAMES: DESIGN_NAMES, upgMult: upgMult, upkeepMult: upkeepMult, costMult: costMult, msMult: msMult, nextMs: nextMs, cost: cost, baseCostAt: baseCostAt, actUnlocked: actUnlocked, isMax: isMax,
    actIncome: actIncome, upkeepOf: upkeepOf, grossBase: grossBase, upkeepTotal: upkeepTotal, boostMult: boostMult, incomeBase: incomeBase, income: income, breakdown: breakdown,
    tick: tick, buyActivity: buyActivity, unlocked: unlocked, buyUpgrade: buyUpgrade, progress: progress, claim: claim, checkAch: checkAch, nextStep: nextStep,
    spend: spend, fText: fText, need: need, parts: parts, hint: hint, offline: offline, offlineNotes: offlineNotes, schedule: schedule, updateEvents: updateEvents, resolve: resolve, addLog: addLog };
})(typeof globalThis !== "undefined" ? globalThis : this);
