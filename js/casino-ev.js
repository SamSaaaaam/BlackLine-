/* Événements du casino (Partie 13 · C6) : client VIP, tournoi, blanchiment. Logique pure, aucun DOM. ARGENT DU JEU UNIQUEMENT.
   État : s.cev = { next [prochain VIP], vip { id, u } | null, served, tour { u, pts, tier, claim } | null, tourNext, tourDone, wash [prochain lavage], played }.
   Les jeux ne sont pas touchés : seul BL.casino.record prévient ce module qu'une partie vient d'être jouée (pour les points du tournoi). */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.casinoEv; } function P() { return D().params; } function E() { return BL.economy; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function num(x, a, b, d) { return typeof x === "number" && isFinite(x) ? clamp(x, a, b) : d; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function t(s) { return typeof s.t === "number" && isFinite(s.t) ? s.t : 0; }
  function initState(s) { s.cev = { next: 0, vip: null, served: 0, tour: null, tourNext: 0, tourDone: 0, wash: 0 }; }
  function c(s) { if (!s.cev || !isObj(s.cev)) initState(s); return s.cev; }
  function available(s) { return !!(BL.casino && BL.casino.available(s)); }
  function mins(s, m) { return Math.round(m * 60 * Math.max(P().minIncome, E().incomeBase(s))); }
  function spanVip(s, k) { return P().vipMinSec + (hash("vip:" + k + ":" + Math.floor(t(s))) % 1000) / 1000 * (P().vipMaxSec - P().vipMinSec); }

  /* ---- Avancement (en ligne seulement) : un VIP arrive, un tournoi s'ouvre ---- */
  function step(s) {
    var x = c(s), ev = [], now = t(s); if (!available(s)) return ev;
    if (x.vip && now >= x.vip.u) { x.vip = null; ev.push({ type: "vipgone" }); }
    if (!x.vip && now >= x.next) { if (x.next > 0) { var v = D().vips[hash("who:" + x.served + ":" + Math.floor(now)) % D().vips.length]; x.vip = { id: v.id, u: now + P().vipStaySec }; ev.push({ type: "vip", id: v.id }); } x.next = now + spanVip(s, x.served); }
    if (x.tour && !x.tour.claim && now >= x.tour.u) { x.tour.claim = true; ev.push({ type: "tourend", tier: tierOf(x.tour.pts) }); }
    if (x.tourNext === 0) x.tourNext = now + 600;      /* premier tournoi 10 min après l'ouverture du casino */
    return ev;
  }
  /* ---- VIP ---- */
  function vipNow(s) { var x = c(s); if (!x.vip || t(s) >= x.vip.u) return null; var v = D().vips.filter(function (q) { return q.id === x.vip.id; })[0]; return v ? { vip: v, left: x.vip.u - t(s), opts: Object.keys(D().vipOpts).map(function (k) { var o = D().vipOpts[k]; return { id: k, label: o.label, text: o.text, gain: mins(s, o.gainMin), heat: o.heat }; }) } : null; }
  function serve(s, optId) {
    var v = vipNow(s), o = D().vipOpts[optId]; if (!v || !o) return null; var x = c(s), g = mins(s, o.gainMin);
    s.money += g; s.total += g; if (BL.heat && o.heat) { var hs = BL.heat.state(s); hs.v = clamp(hs.v + o.heat, 0, 100); }
    x.vip = null; if (g > 0) x.served = Math.min(1e6, x.served + 1); if (E().addLog) E().addLog(s, "Casino · " + v.vip.name + " : " + o.label + (g ? " (+" + g + ")" : "") + ".");
    return { gain: g, heat: o.heat, vip: v.vip };
  }
  /* ---- Tournoi ---- */
  function tierOf(pts) { var r = -1; D().tiers.forEach(function (q, i) { if (pts >= q.pts) r = i; }); return r; }
  function tourInfo(s) {
    var x = c(s), now = t(s), entry = mins(s, P().tourEntryMin), o = { entry: entry, minBet: tourMinBet(s), tiers: D().tiers.map(function (q) { return { pts: q.pts, name: q.name, prize: mins(s, q.prizeMin) }; }) };
    if (x.tour) { o.state = x.tour.claim ? "claim" : "on"; o.pts = x.tour.pts; o.left = Math.max(0, x.tour.u - now); o.tier = tierOf(x.tour.pts); } else o.state = now >= x.tourNext && x.tourNext > 0 ? "open" : "wait", o.in = Math.max(0, x.tourNext - now);
    return o;
  }
  function tourMinBet(s) { return BL.casino ? BL.casino.limits(s).min * P().tourBetMul : 0; }
  function whyJoin(s) { var x = c(s); if (!available(s)) return "Construis un casino dans un quartier que tu contrôles."; if (x.tour) return "Un tournoi est déjà en cours ou à récupérer."; if (t(s) < x.tourNext || x.tourNext === 0) return "Prochain tournoi dans " + Math.ceil(Math.max(0, x.tourNext - t(s)) / 60) + " min de jeu."; if (s.money + 1e-9 < mins(s, P().tourEntryMin)) return "Il te manque de l’argent pour l’inscription."; return ""; }
  function join(s) { if (whyJoin(s)) return null; var x = c(s), fee = mins(s, P().tourEntryMin); E().spend(s, fee); x.tour = { u: t(s) + P().tourLenSec, pts: 0, claim: false }; if (E().addLog) E().addLog(s, "Casino · inscription au tournoi (−" + fee + ")."); return { fee: fee, until: x.tour.u }; }
  /* Appelé à chaque partie jouée : 1 point par partie à la mise minimale du tournoi ou plus, +1 si elle est gagnée. Pas de point pour une mise plus grosse : on ne gagne pas à miser davantage. */
  function onPlay(s, game, bet, net) {
    var x = c(s); if (!x.tour || x.tour.claim || t(s) >= x.tour.u) return 0; if (bet < tourMinBet(s)) return 0;
    var add = 1 + (net > 0 ? 1 : 0); x.tour.pts = Math.min(P().tourMaxPts, x.tour.pts + add); return add;
  }
  function claim(s) {
    var x = c(s); if (!x.tour) return null; if (!x.tour.claim && t(s) < x.tour.u) return null; var ti = tierOf(x.tour.pts), prize = ti >= 0 ? mins(s, D().tiers[ti].prizeMin) : 0;
    s.money += prize; s.total += prize; x.tour = null; x.tourNext = t(s) + P().tourEverySec; x.tourDone = Math.min(1e6, x.tourDone + 1);
    if (E().addLog) E().addLog(s, "Casino · tournoi terminé" + (ti >= 0 ? " : " + D().tiers[ti].name + " (+" + prize + ")" : " sans place.")); return { tier: ti, prize: prize };
  }
  /* ---- Blanchiment : frais fixes contre une baisse de chaleur bornée ---- */
  function whyWash(s) {
    var x = c(s); if (!available(s)) return "Construis un casino dans un quartier que tu contrôles."; if (t(s) < x.wash) return "Les livres sont encore chauds : " + Math.ceil((x.wash - t(s)) / 60) + " min de jeu."; var hs = BL.heat ? BL.heat.state(s) : { v: 0 };
    if (hs.v <= 0) return "Aucune chaleur à effacer."; if (s.money + 1e-9 < mins(s, P().washCostMin)) return "Il te manque de l’argent pour les frais."; return "";
  }
  function wash(s) { if (whyWash(s)) return null; var fee = mins(s, P().washCostMin), hs = BL.heat.state(s), d = Math.min(P().washHeat, hs.v); E().spend(s, fee); hs.v = clamp(hs.v - d, 0, 100); c(s).wash = t(s) + P().washCdSec; if (E().addLog) E().addLog(s, "Casino · argent lavé (−" + fee + "), chaleur −" + d + "."); return { fee: fee, drop: d }; }

  function sanitize(r, s) {
    initState(s); if (!isObj(r) || !isObj(r.cev)) return; var q = r.cev, x = s.cev; x.next = num(q.next, 0, 1e15, 0); x.tourNext = num(q.tourNext, 0, 1e15, 0); x.wash = num(q.wash, 0, 1e15, 0); x.served = Math.floor(num(q.served, 0, 1e6, 0)); x.tourDone = Math.floor(num(q.tourDone, 0, 1e6, 0));
    if (isObj(q.vip) && D().vips.some(function (v) { return v.id === q.vip.id; })) x.vip = { id: q.vip.id, u: num(q.vip.u, 0, 1e15, 0) };
    if (isObj(q.tour)) x.tour = { u: num(q.tour.u, 0, 1e15, 0), pts: Math.floor(num(q.tour.pts, 0, P().tourMaxPts, 0)), claim: q.tour.claim === true };
  }
  BL.casinoEv = { initState: initState, state: c, sanitize: sanitize, step: step, vipNow: vipNow, serve: serve, tourInfo: tourInfo, whyJoin: whyJoin, join: join, onPlay: onPlay, claim: claim, whyWash: whyWash, wash: wash, tierOf: tierOf, mins: mins, available: available };
})(typeof globalThis !== "undefined" ? globalThis : this);
