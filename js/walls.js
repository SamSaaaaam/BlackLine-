/* Décors de ville : LOGIQUE PURE (aucun DOM). État : s.walls = { own:{id:1}, on:"id"|"" }. Achat en lingots uniquement ; purement décoratif (aucun effet sur le jeu).
   Où le décor s'affiche (accueil, QG, les deux, aucun) est un RÉGLAGE (settings.wall), pas un état de partie. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function list() { return BL.data.walls.LIST; }
  function find(id) { var a = list(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function fresh() { return { own: {}, on: "" }; }
  function initState(s) { s.walls = fresh(); }
  function st(s) { return s.walls || (s.walls = fresh()); }
  function owned(s, id) { return !!st(s).own[id]; }
  function buy(s, id) { var w = find(id); if (!w || owned(s, id) || !BL.gold || !BL.gold.canSpend(s, w.cost)) return false; BL.gold.spend(s, w.cost); st(s).own[id] = 1; st(s).on = id; return true; }
  function equip(s, id) { if (!find(id) || !owned(s, id)) return false; st(s).on = id; return true; }
  function unequip(s) { if (!st(s).on) return false; st(s).on = ""; return true; }
  function current(s) { var w = find(st(s).on); return w && owned(s, w.id) ? w : null; }
  function sanitize(raw, s) {
    s.walls = fresh(); var r = raw && raw.walls; if (!r || typeof r !== "object" || Array.isArray(r)) return;
    if (r.own && typeof r.own === "object" && !Array.isArray(r.own)) Object.keys(r.own).forEach(function (id) { if (find(id) && r.own[id]) s.walls.own[id] = 1; });
    if (typeof r.on === "string" && s.walls.own[r.on]) s.walls.on = r.on;
  }
  function use(settings) { var u = settings && settings.wall; return u === "home" || u === "hq" || u === "off" ? u : "all"; }
  function showHome(settings) { var u = use(settings); return u === "all" || u === "home"; }
  function showHq(settings) { var u = use(settings); return u === "all" || u === "hq"; }
  BL.walls = { list: list, find: find, initState: initState, sanitize: sanitize, st: st, owned: owned, buy: buy, equip: equip, unequip: unequip, current: current, use: use, showHome: showHome, showHq: showHq };
})(typeof globalThis !== "undefined" ? globalThis : this);
