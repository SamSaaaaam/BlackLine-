/* Rivalités (C8) : une pression par faction qui borde tes quartiers. Logique pure, déterministe.
   - La pression (0–100) monte avec le temps passé, plus vite si la faction est agressive, hostile, forte face à ta défense.
   - Hors ligne : le temps compté est celui de l'absence (déjà plafonné), à rendement réduit, et la pression ne dépasse
     jamais OFFLINE_CAP : aucune attaque ne se déclenche sans que tu aies pu réagir. Pas de rattrapage au retour.
   - À 100 en jeu, la faction attaque : c'est le conflit existant (décision avec minuteur), jamais une perte directe.
   - Trêve ou alliance : la pression retombe. « Calmer le jeu » coûte de l'argent et la fait baisser. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var P = { watch: 35, threat: 70, offlineCap: 80, offlineEff: 0.5, maxOfflineSec: 6 * 3600, base: 5, perAggr: 5, decay: 12, atk: 100, afterAtk: 40, calm: 50, calmRatio: 0.12 };
  /* Partie 13 · C3 : personnalités, mémoire et coalition. Tout est borné et expliqué à l'écran (why). */
  var PERS = { lames: "aggressive", corbeaux: "opportunist", meridian: "diplomat", valcourt: "opportunist" };
  var PINFO = {
    aggressive: { name: "Agressive", text: "Frappe vite, là où ta défense est la plus faible, et garde rancune d'une défaite.", mul: 1.2 },
    opportunist: { name: "Opportuniste", text: "Attend ta faiblesse : plus rapide quand la police te surveille ou qu'elle t'a déjà battu.", mul: 0.95 },
    diplomat: { name: "Diplomate", text: "Préfère négocier : avance plus lentement et vend la paix moins cher.", mul: 0.8 }
  };
  var CO = { sec: 1200, rest: 1800, mul: 1.15, maxGrudge: 3, grudgeStep: 0.1, lossStep: 0.08, weakHeat: 1, weakMul: 1.25, counterMul: 2, counterMin: 0.2, counterMax: 0.85, counterGain: 0.65, counterPower: 0.9, counterFail: 10, diploCalm: 0.6 };
  function pers(fid) { return PERS[fid] || "diplomat"; }
  function mem(s, fid) { var x = st(s, fid); x.g = Math.floor(clamp(typeof x.g === "number" ? x.g : 0, 0, CO.maxGrudge)); x.w = Math.floor(clamp(typeof x.w === "number" ? x.w : 0, 0, 99)); x.l = Math.floor(clamp(typeof x.l === "number" ? x.l : 0, 0, 99)); return x; }
  function inCoalition(s, fid) { var c = s.rivals && s.rivals.co; return !!(c && (c.a === fid || c.b === fid) && c.u > s.t); }
  /* Multiplicateur de personnalité / mémoire / coalition, avec le détail en phrases. */
  function mods(s, fid) {
    var x = mem(s, fid), p = pers(fid), info = PINFO[p], lines = [], pm = info.mul, mm = 1, cm = 1, wm = 1;
    lines.push("Personnalité " + info.name.toLowerCase() + " : " + Math.round((pm - 1) * 100 >= 0 ? (pm - 1) * 100 : (pm - 1) * 100) + " % de pression (" + info.text + ")");
    if (p === "aggressive" && x.g > 0) { mm = 1 + CO.grudgeStep * x.g; lines.push("Rancune " + x.g + " / " + CO.maxGrudge + " : tu l'as repoussée, elle veut se venger (+" + Math.round((mm - 1) * 100) + " %)"); }
    if (p === "opportunist") {
      if (BL.heat && BL.heat.tier(s) && BL.heat.tierIdx(BL.heat.state(s).v) >= 1) { wm = CO.weakMul; lines.push("Elle flaire ta faiblesse : la police te surveille (+" + Math.round((wm - 1) * 100) + " %)"); }
      if (x.l > 0) { mm = 1 + CO.lossStep * Math.min(3, x.l); lines.push("Elle t'a déjà pris un quartier " + x.l + " fois (+" + Math.round((mm - 1) * 100) + " %)"); }
    }
    if (inCoalition(s, fid)) { cm = CO.mul; var o = s.rivals.co.a === fid ? s.rivals.co.b : s.rivals.co.a, of = T().faction(o); lines.push("Coalition avec " + (of ? of.name : o) + " (+" + Math.round((cm - 1) * 100) + " %)"); }
    return { pers: p, info: info, mem: mm, weak: wm, coal: cm, total: clamp(pm * mm * wm * cm, 0.6, 1.8), lines: lines };
  }
  function T() { return BL.territory; } function TD() { return BL.data.territory; } function F() { return BL.factions; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function st(s, fid) { if (!s.rivals) s.rivals = { t: 0, st: {} }; if (!s.rivals.st[fid]) s.rivals.st[fid] = { p: 0, seen: false }; return s.rivals.st[fid]; }
  /* Quartier à toi, voisin d'un quartier tenu par la faction : le plus stratégique d'abord (ordre stable). */
  function front(s, fid) {
    var best = null;
    TD().districts.forEach(function (d) {
      if (T().lv(s, d.id) < 1) return;
      var touch = d.neighbors.some(function (n) { var x = T().dist(n); return x && x.holder === fid && T().lv(s, n) === 0 && (!T().inPlay || T().inPlay(s, x)); });
      if (!touch) return;
      /* agressive / opportuniste : le quartier le moins bien défendu ; diplomate : le plus stratégique (ordre stable) */
      if (!best) { best = d; return; }
      if (pers(fid) === "diplomat") { if (d.strategic > best.strategic) best = d; }
      else { var a = T().defense(s, d), b = T().defense(s, best); if (a < b - 1e-9 || (Math.abs(a - b) <= 1e-9 && d.strategic > best.strategic)) best = d; }
    });
    return best;
  }
  function calmed(s, fid) { var f = s.fac && s.fac[fid]; return !f || f.truce > s.t || (F() && F().allied(s, fid)); }
  /* Pression gagnée par heure, avec le détail pour l'expliquer. */
  function rate(s, fid) {
    var f = T().faction(fid), d = front(s, fid); if (!f || !d || calmed(s, fid)) return { perHour: 0, why: [] };
    var pw = s.fac[fid].power, df = T().defense(s, d), ratio = pw / (pw + df), m = clamp(0.4 + 1.2 * ratio, 0.4, 1.6), w = F() ? F().weight(s, fid) : 1;
    var base = P.base + P.perAggr * f.aggression;
    var hm = (BL.heat ? BL.heat.rivalMul(s) : 1) * (BL.saga ? BL.saga.rivalMul(s) : 1) * (BL.meta ? BL.meta.rivalMul(s) : 1); var md = mods(s, fid); return { perHour: base * m * clamp(w, 0.5, 2) * hm * md.total, heatMul: hm, base: base, force: pw, defense: df, mult: m, weight: w, persMul: md.total, why: md.lines };
  }
  function lvl(p) { return p >= P.threat ? "threat" : p >= P.watch ? "watch" : "none"; }
  function advance(s, dt, offline) {
    if (!s.rivals || !(dt > 0)) return [];
    var rep = [], sec = offline ? Math.min(dt, P.maxOfflineSec) * P.offlineEff : dt;
    TD().factions.forEach(function (f) {
      var x = st(s, f.id), r = rate(s, f.id), before = x.p, d = front(s, f.id);
      if (r.perHour > 0) x.p = Math.min(offline ? Math.max(before, P.offlineCap) : 100, x.p + r.perHour * sec / 3600);
      else x.p = Math.max(0, x.p - P.decay * sec / 3600);
      if (offline && x.p > before && d) rep.push({ fid: f.id, did: d.id, from: before, to: x.p, lvl: lvl(x.p) });
    });
    s.rivals.t = s.t; return rep;
  }
  function list(s) {
    var out = []; if (!s.rivals) return out;
    TD().factions.forEach(function (f) {
      var x = s.rivals.st[f.id], d = front(s, f.id); if (!x || !d || x.p < P.watch) return;
      out.push({ fid: f.id, did: d.id, p: Math.round(x.p), lvl: lvl(x.p), rate: rate(s, f.id).perHour });
    });
    return out.sort(function (a, b) { return b.p - a.p; });
  }
  function at(s, did) { var l = list(s).filter(function (e) { return e.did === did; }); return l[0] || null; }
  function calmCost(s, did, fid) { var d = T().dist(did); return d ? Math.ceil(d.cost * P.calmRatio * (fid && pers(fid) === "diplomat" ? CO.diploCalm : 1)) : 0; }
  function calm(s, fid) {
    var e = list(s).filter(function (x) { return x.fid === fid; })[0]; if (!e) return null;
    var c = calmCost(s, e.did, fid); if (!(s.money + 1e-9 >= c)) return null;
    BL.economy.spend(s, c); var x = st(s, fid); x.p = Math.max(0, x.p - P.calm); record(s, fid, "paid"); return { cost: c, p: x.p };
  }
  /* Mémoire : ce que tu fais d'une faction change son comportement. */
  function record(s, fid, kind) {
    if (!s.fac || !s.fac[fid]) return; var x = mem(s, fid), a = pers(fid) === "aggressive";
    if (kind === "won" || kind === "cwin") { x.w = Math.min(99, x.w + 1); if (a) x.g = Math.min(CO.maxGrudge, x.g + 1); }
    else if (kind === "lost") { x.l = Math.min(99, x.l + 1); x.g = Math.max(0, x.g - 1); }
    else if (kind === "truce") x.g = Math.max(0, x.g - 2); else if (kind === "paid") x.g = Math.max(0, x.g - 1);
  }
  /* Contre-attaque : coûte, peut échouer (chance affichée, exacte). */
  function counterInfo(s, fid) {
    var e = list(s).filter(function (x) { return x.fid === fid; })[0]; if (!e || !s.fac[fid]) return null;
    var d = T().dist(e.did), df = T().defense(s, d), pw = s.fac[fid].power, ch = clamp(CO.counterMin + CO.counterGain * df / (df + pw), CO.counterMin, CO.counterMax);
    return { did: e.did, cost: Math.ceil(calmCost(s, e.did, fid) * CO.counterMul), chance: ch };
  }
  function counter(s, fid, rng) {
    var i = counterInfo(s, fid); if (!i || !(s.money + 1e-9 >= i.cost)) return null; BL.economy.spend(s, i.cost); var x = st(s, fid), ok = rng() < i.chance;
    if (ok) { x.p = 0; s.fac[fid].power *= CO.counterPower; record(s, fid, "cwin"); if (F()) F().gain(s, fid, -4); }
    else x.p = Math.min(99, x.p + CO.counterFail);
    return { ok: ok, cost: i.cost, chance: i.chance, did: i.did };
  }
  /* Coalition : deux factions sous tension en même temps s'allient 20 minutes (visible, rompue si l'une est calmée). */
  function coalition(s, out) {
    var co = s.rivals.co, act = list(s).filter(function (e) { return !calmed(s, e.fid); });
    if (co) {
      var pa = st(s, co.a).p, pb = st(s, co.b).p;
      if (co.u <= s.t || calmed(s, co.a) || calmed(s, co.b) || pa < 20 || pb < 20) { s.rivals.co = null; s.rivals.cd = s.t + CO.rest; out.push({ type: "coalitionEnd", a: co.a, b: co.b }); }
    } else if (act.length >= 2 && s.t >= (s.rivals.cd || 0)) {
      var seen = {}, u = act.filter(function (e) { if (seen[e.fid]) return false; seen[e.fid] = 1; return true; }); if (u.length >= 2) { s.rivals.co = { a: u[0].fid, b: u[1].fid, u: s.t + CO.sec }; out.push({ type: "coalition", a: u[0].fid, b: u[1].fid }); }
    }
  }
  /* Appelée régulièrement : à 100, la faction passe à l'attaque (conflit classique), puis la pression retombe. */
  function step(s, rng) {
    if (!s.rivals) return [];
    var out = []; coalition(s, out);
    if (s.terr.conflict) return out;
    TD().factions.forEach(function (f) {
      if (s.terr.conflict) return;
      var x = st(s, f.id); if (x.p < P.atk) return;
      var d = front(s, f.id); if (!d || calmed(s, f.id)) { x.p = Math.min(x.p, P.threat); return; }
      var c = T().startConflict(s, rng, { fid: f.id, did: d.id });
      if (c) { x.p = P.afterAtk; out.push({ type: "start", conflict: c, district: d, faction: f }); }
    });
    return out;
  }
  /* Une seule phrase pour le bilan de retour (jamais une rafale). */
  function note(rep) {
    if (!rep || !rep.length) return "";
    var a = rep.slice().sort(function (x, y) { return y.to - x.to; }), top = a[0], f = T().faction(top.fid), d = T().dist(top.did);
    var more = a.length > 1 ? " (et " + (a.length - 1) + " autre" + (a.length > 2 ? "s" : "") + " faction" + (a.length > 2 ? "s" : "") + " qui gagne" + (a.length > 2 ? "nt" : "") + " du terrain)" : "";
    return f.name + " ont gagné du terrain face à " + d.short + " : pression " + Math.round(top.to) + " %" + more + ". Aucune perte : calme le jeu ou renforce la défense dans Territoires.";
  }
  BL.rivals = { personality: pers, info: PINFO, co: CO, mods: mods, mem: mem, record: record, counterInfo: counterInfo, counter: counter, inCoalition: inCoalition, params: P, front: front, rate: rate, lvl: lvl, advance: advance, list: list, at: at, calmCost: calmCost, calm: calm, step: step, note: note };
})(typeof window !== "undefined" ? window : globalThis);
