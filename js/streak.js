/* Partie 19 · E : série de défis (« streak »), titres cosmétiques, récap de la semaine. Logique pure, aucun DOM, aucun réseau.
   - Série : jours consécutifs (calendrier local) avec au moins un défi réclamé. Un jour manqué est pardonné une fois par semaine
     (semaine du classement : lundi, heure de Paris, même règle que BL.lbCore.weekKey). Plafond 365. Aucun lingot en plus.
   - Titres : obtenus par des critères LOCAUX uniquement (série, défis réclamés, semaine complète, visites). Aucun titre qui dépendrait du serveur.
   - Récap : au premier passage d'un lundi (Paris), bilan de la semaine écoulée : défis réclamés, argent gagné, série.
   État : s.dfs = { st, best, last, fz, vis, ti [], wk { key, t0, n, w }, rc { key, n, gain, st, w } | null, rcSeen }. */
(function (root) {
  var BL = root.BL = root.BL || {}, CAP = 365;
  var TITLES = [
    { id: "s3", name: "Régulier", text: "Série de 3 jours", ok: function (d, s) { return d.best >= 3; } },
    { id: "s7", name: "Assidu", text: "Série de 7 jours", ok: function (d) { return d.best >= 7; } },
    { id: "s14", name: "Inébranlable", text: "Série de 14 jours", ok: function (d) { return d.best >= 14; } },
    { id: "s30", name: "Pilier de la ville", text: "Série de 30 jours", ok: function (d) { return d.best >= 30; } },
    { id: "c10", name: "Chasseur de défis", text: "10 défis réclamés", ok: function (d, s) { return !!s.meta && s.meta.cl >= 10; } },
    { id: "c50", name: "Collectionneur", text: "50 défis réclamés", ok: function (d, s) { return !!s.meta && s.meta.cl >= 50; } },
    { id: "wk", name: "Semaine parfaite", text: "Les 2 défis d’une semaine réclamés", ok: function (d) { return d.wk && d.wk.w >= 2 || !!(d.rc && d.rc.w >= 2); } },
    { id: "v20", name: "Arpenteur", text: "20 quartiers visités", ok: function (d) { return d.vis >= 20; } }
  ];
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function num(v, d, a, b) { return typeof v === "number" && isFinite(v) ? Math.max(a, Math.min(b, v)) : d; }
  function initState(s) { s.dfs = { st: 0, best: 0, last: "", fz: "", vis: 0, vd: null, ti: [], wk: null, rc: null, rcSeen: "" }; }
  function st(s) { if (!isObj(s.dfs)) initState(s); return s.dfs; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dayNum(key) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || ""); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : null; }   /* jours calendaires : insensible aux changements d'heure */
  function weekKey(ms) { return BL.lbCore && BL.lbCore.weekKey ? BL.lbCore.weekKey(ms) : dayKey(ms); }
  /* série affichée aujourd'hui : 0 si elle est déjà rompue (plus d'un jour manqué, ou un jour manqué sans pardon disponible) */
  function current(s, now) {
    var d = st(s), t = dayNum(dayKey(now)), l = dayNum(d.last); if (l === null || t === null) return 0; var gap = t - l;
    if (gap <= 1) return d.st; if (gap === 2 && d.fz !== weekKey(now)) return d.st; return 0;
  }
  /* un défi vient d'être réclamé : met à jour la série (une fois par jour), la semaine et les titres. Horloge qui recule : la série ne bouge pas. */
  function onClaim(s, now, weekly) {
    var d = st(s), k = dayKey(now), t = dayNum(k), l = dayNum(d.last); roll(s, now); if (d.wk) { d.wk.n++; if (weekly) d.wk.w++; }
    if (t !== null && (l === null || t > l)) {
      var gap = l === null ? 99 : t - l;
      if (gap === 1) d.st++; else if (gap === 2 && d.fz !== weekKey(now)) { d.st++; d.fz = weekKey(now); } else d.st = 1;
      d.st = Math.min(CAP, d.st); d.best = Math.max(d.best, d.st); d.last = k;
    }
    return award(s);
  }
  /* visite d'un quartier (fiche ouverte sur la carte ou dans Territoires) : comptée une fois par quartier et par jour */
  function visit(s, id, now) { var d = st(s), k = dayKey(now === undefined ? Date.now() : now); if (typeof id !== "string" || !id) return []; if (!d.vd || d.vd.k !== k) d.vd = { k: k, ids: [] }; if (d.vd.ids.indexOf(id) >= 0) return []; d.vd.ids.push(id); d.vis = Math.min(1e6, d.vis + 1); return award(s); }
  function award(s) { var d = st(s), got = []; TITLES.forEach(function (x) { if (d.ti.indexOf(x.id) < 0 && x.ok(d, s)) { d.ti.push(x.id); got.push(x); } }); return got; }
  /* changement de semaine (lundi, heure de Paris) : le récap de la semaine écoulée est figé, une nouvelle semaine commence */
  function roll(s, now) {
    var d = st(s), k = weekKey(now), tot = typeof s.total === "number" && isFinite(s.total) ? s.total : 0;
    if (!d.wk) { d.wk = { key: k, t0: tot, n: 0, w: 0 }; return null; }
    if (d.wk.key === k || k < d.wk.key) return null;   /* même semaine, ou horloge qui recule */
    d.rc = { key: d.wk.key, n: d.wk.n, w: d.wk.w, gain: Math.max(0, tot - d.wk.t0), st: current(s, now) }; d.wk = { key: k, t0: tot, n: 0, w: 0 }; award(s); return d.rc;
  }
  function recap(s) { var d = st(s); return d.rc && d.rcSeen !== d.rc.key ? d.rc : null; }
  function seen(s) { var d = st(s); if (d.rc) d.rcSeen = d.rc.key; }
  function titles(s) { var d = st(s); return TITLES.filter(function (x) { return d.ti.indexOf(x.id) >= 0; }); }
  function sanitize(r, s) {
    initState(s); var q = isObj(r) && isObj(r.dfs) ? r.dfs : null; if (!q) return; var d = s.dfs, okW = function (k) { return typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k); };
    d.st = Math.floor(num(q.st, 0, 0, CAP)); d.best = Math.max(d.st, Math.floor(num(q.best, 0, 0, CAP))); d.last = okW(q.last) ? q.last : ""; if (!d.last) d.st = 0;
    d.fz = okW(q.fz) ? q.fz : ""; d.vis = Math.floor(num(q.vis, 0, 0, 1e6)); d.rcSeen = okW(q.rcSeen) ? q.rcSeen : "";
    if (Array.isArray(q.ti)) q.ti.slice(0, 32).forEach(function (id) { if (typeof id === "string" && TITLES.some(function (x) { return x.id === id; }) && d.ti.indexOf(id) < 0) d.ti.push(id); });
    if (isObj(q.vd) && okW(q.vd.k) && Array.isArray(q.vd.ids)) d.vd = { k: q.vd.k, ids: q.vd.ids.filter(function (id) { return typeof id === "string" && BL.data.territory.districts.some(function (x) { return x.id === id; }); }).slice(0, 32) };
    if (isObj(q.wk) && okW(q.wk.key)) d.wk = { key: q.wk.key, t0: num(q.wk.t0, 0, 0, 1e300), n: Math.floor(num(q.wk.n, 0, 0, 1e4)), w: Math.floor(num(q.wk.w, 0, 0, 2)) };
    if (isObj(q.rc) && okW(q.rc.key)) d.rc = { key: q.rc.key, n: Math.floor(num(q.rc.n, 0, 0, 1e4)), w: Math.floor(num(q.rc.w, 0, 0, 2)), gain: num(q.rc.gain, 0, 0, 1e300), st: Math.floor(num(q.rc.st, 0, 0, CAP)) };
  }
  BL.dfs = { TITLES: TITLES, CAP: CAP, initState: initState, state: st, current: current, onClaim: onClaim, visit: visit, award: award, roll: roll, recap: recap, seen: seen, titles: titles, sanitize: sanitize, dayKey: dayKey, weekKey: weekKey };
})(typeof globalThis !== "undefined" ? globalThis : this);
