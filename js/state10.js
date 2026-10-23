/* État ajouté en v10 : historique des box, bâtiments par quartier, casino, chaleur, rivalités, fil narratif, notifications déjà vues.
   Ce module ne contient QUE le schéma sûr (valeurs par défaut + nettoyage strict) ; la logique de chaque système vit dans son propre module.
   Toute valeur inattendue est ramenée dans les limites, jamais d'exception : une sauvegarde ancienne ou abîmée reste toujours chargeable. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var LIM = { boxHist: 5, boxItems: 12, districts: 24, perDistrict: 24, casinoHist: 20, seen: 60, story: 40, rivals: 12, str: 40 };
  function num(x, lo, hi, d) { return typeof x === "number" && isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; }
  function int(x, lo, hi, d) { return Math.floor(num(x, lo, hi, d)); }
  function id(x, n) { return typeof x === "string" && x.length > 0 && x.length <= (n || LIM.str) && /^[A-Za-z0-9_:.\-]+$/.test(x) ? x : null; }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }

  function initState(s) {
    s.boxHist = [];
    s.districts = {}; s.razed = [];
    s.casino = { hist: [], played: 0, won: 0, lost: 0, net: 0 };
    s.heat = { v: 0, t: 0, raid: 0, bribeAt: 0, layAt: 0 };
    s.rivals = { t: 0, st: {} };
    s.story = { seen: [] };
    s.notifSeen = [];
  }
  function sanitize(r, s) {
    initState(s); if (!r || typeof r !== "object") return;
    /* 5 dernières ouvertures de box : { b: identifiant de la box, at: date, it: [ { id, dup } ] } */
    if (Array.isArray(r.boxHist)) r.boxHist.slice(0, LIM.boxHist).forEach(function (h) {
      if (!isObj(h) || !id(h.b)) return; var items = Array.isArray(h.it) ? h.it.slice(0, LIM.boxItems).map(function (x) { return isObj(x) && id(x.id) ? { id: x.id, dup: x.dup === true } : null; }).filter(Boolean) : [];
      s.boxHist.push({ b: h.b, at: num(h.at, 0, 8.64e15, 0), it: items });
    });
    /* bâtiments par quartier : { identifiantQuartier: [identifiants de bâtiments construits] } (un bâtiment spécial n'apparaît qu'une fois par quartier) */
    s.razed = Array.isArray(r.razed) ? r.razed.slice(0, 12).map(function (q) { return id(q, 30); }).filter(Boolean) : [];   /* v13 : parcs / places démolis (nettoyés plus finement par dbuild.clean) */
    if (isObj(r.districts)) Object.keys(r.districts).slice(0, LIM.districts).forEach(function (k) {
      if (!id(k) || !Array.isArray(r.districts[k])) return; var seen = {}, out = [];
      r.districts[k].forEach(function (b) { var q = id(b); if (q && !seen[q] && out.length < LIM.perDistrict) { seen[q] = 1; out.push(q); } }); if (out.length) s.districts[k] = out;
    });
    if (isObj(r.casino)) {
      var c = r.casino; s.casino.played = int(c.played, 0, 1e9, 0); s.casino.won = int(c.won, 0, 1e9, 0); s.casino.lost = int(c.lost, 0, 1e9, 0); s.casino.net = num(c.net, -1e300, 1e300, 0);
      if (BL.casino && c.round) { var rd = BL.casino.sanitizeRound(c.round); if (rd) s.casino.round = rd; }
      if (Array.isArray(c.hist)) c.hist.slice(0, LIM.casinoHist).forEach(function (h) { if (isObj(h) && id(h.g, 16)) s.casino.hist.push({ g: h.g, bet: num(h.bet, 0, 1e300, 0), net: num(h.net, -1e300, 1e300, 0), at: num(h.at, 0, 8.64e15, 0) }); });
    }
    if (isObj(r.heat)) s.heat = { v: num(r.heat.v, 0, 100, 0), t: num(r.heat.t, 0, 1e12, 0), raid: num(r.heat.raid, 0, 1e12, 0), bribeAt: num(r.heat.bribeAt, 0, 1e12, 0), layAt: num(r.heat.layAt, 0, 1e12, 0), ta: Number.isInteger(r.heat.ta) && r.heat.ta >= 0 && r.heat.ta <= 3 ? r.heat.ta : undefined };
    if (isObj(r.heat)) {   /* Partie 13 · C2 : conséquences de descente (bornées ; échéances au plus 1 h après l'horloge sauvegardée) */
      var T0 = num(r.t, 0, 1e15, 0), mx = 3600, hh = s.heat, rh = r.heat, dd = function (x) { return id(x, 24); };
      hh.tg = typeof rh.tg === "string" && dd(rh.tg) ? rh.tg : ""; hh.rc = int(rh.rc, 0, 1e9, 0); hh.def = rh.def === true; hh.low = num(rh.low, 0, T0 + 600, 0);
      hh.cl = []; hh.sz = []; hh.ar = [];
      if (Array.isArray(rh.cl)) rh.cl.slice(0, 3).forEach(function (c) { if (isObj(c) && dd(c.d) && dd(c.id) && BL.dbuild && BL.dbuild.find(c.id)) hh.cl.push({ d: c.d, id: c.id, u: num(c.u, 0, T0 + mx, 0) }); });
      if (Array.isArray(rh.sz)) rh.sz.slice(0, 3).forEach(function (z) { if (isObj(z) && dd(z.id) && (!BL.equip || BL.equip.item(z.id))) hh.sz.push({ id: z.id, w: num(z.w, 0, 100, 100), b: z.b === 1 ? 1 : 0, u: num(z.u, 0, T0 + mx, 0) }); });
      if (Array.isArray(rh.ar)) rh.ar.slice(0, 1).forEach(function (a) { if (isObj(a) && dd(a.id) && (!BL.crew || BL.crew.get(a.id))) hh.ar.push({ id: a.id, u: num(a.u, 0, T0 + mx, 0) }); });
    }
    if (isObj(r.rivals)) {
      s.rivals.t = num(r.rivals.t, 0, 1e12, 0);
      if (isObj(r.rivals.st)) Object.keys(r.rivals.st).slice(0, LIM.rivals).forEach(function (k) { var x = r.rivals.st[k]; if (id(k) && isObj(x)) s.rivals.st[k] = { p: num(x.p, 0, 100, 0), seen: x.seen === true, g: int(x.g, 0, 3, 0), w: int(x.w, 0, 99, 0), l: int(x.l, 0, 99, 0) }; });
      s.rivals.cd = num(r.rivals.cd, 0, num(r.t, 0, 1e15, 0) + 1800, 0);
      var co = r.rivals.co; if (isObj(co) && id(co.a) && id(co.b) && co.a !== co.b && BL.data && BL.data.territory && BL.data.territory.factions.some(function (f) { return f.id === co.a; }) && BL.data.territory.factions.some(function (f) { return f.id === co.b; })) s.rivals.co = { a: co.a, b: co.b, u: num(co.u, 0, num(r.t, 0, 1e15, 0) + 1200, 0) };
    }
    if (isObj(r.story) && Array.isArray(r.story.seen)) r.story.seen.slice(0, LIM.story).forEach(function (x) { var q = id(x); if (q && s.story.seen.indexOf(q) < 0) s.story.seen.push(q); });
    if (BL.saga) BL.saga.sanitize(r, s);
    if (BL.war) BL.war.sanitize(r, s);
    if (BL.bonds) BL.bonds.sanitize(r, s);
    if (BL.meta) BL.meta.sanitize(r, s);
    if (BL.heist) BL.heist.sanitize(r, s);
    if (BL.casinoEv) BL.casinoEv.sanitize(r, s);
    if (Array.isArray(r.notifSeen)) r.notifSeen.slice(-LIM.seen).forEach(function (x) { var q = id(x, 60); if (q && s.notifSeen.indexOf(q) < 0) s.notifSeen.push(q); });
  }
  BL.state10 = { LIM: LIM, initState: initState, sanitize: sanitize };
})(typeof globalThis !== "undefined" ? globalThis : this);
