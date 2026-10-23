/* Événements en cours : liste PURE (sans DOM) de tout ce qui est actif dans la partie, pour l'afficher sur la carte.
   Sources réelles de l'état : conflit de quartier (s.terr.conflict), événement narratif en attente (s.pending), opération (s.eq.op),
   bonus temporaire (s.boost), alliances et trêves (s.fac[id].ally / .truce). Jamais de faux compte à rebours : left vaut null quand le jeu n'en connaît pas. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var KINDS = {
    conflict: { label: "Attaque", glyph: "!", col: "#e0584a", prio: 0, desc: "Une faction attaque un de tes quartiers : une décision t’attend dans Territoires." },
    event: { label: "Événement", glyph: "?", col: "#e3b34c", prio: 1, desc: "Un événement attend ta réponse (fenêtre de décision)." },
    op: { label: "Opération", glyph: "»", col: "#5ea8e0", prio: 2, desc: "Ton équipe est en mission : braquage, convoi ou raid." },
    boost: { label: "Bonus", glyph: "+", col: "#8fd07a", prio: 3, desc: "Un bonus temporaire de revenus est actif." },
    ally: { label: "Alliance", glyph: "♦", col: "#b07ae8", prio: 4, desc: "Une faction est ton alliée du moment." },
    truce: { label: "Trêve", glyph: "=", col: "#7fd6c8", prio: 5, desc: "Une trêve est en cours avec une faction." }
  };
  function T() { return BL.territory; } function Fa() { return BL.factions; } function Eq() { return BL.equip; } function Ec() { return BL.economy; }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }
  function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); if (sec >= 3600) { var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h + " h " + (m < 10 ? "0" : "") + m; } if (sec >= 60) { var mm = Math.floor(sec / 60), ss = sec % 60; return mm + " min " + (ss < 10 ? "0" : "") + ss + " s"; } return sec + " s"; }
  function fname(fid) { var i = Fa() && Fa().info(fid); return i ? i.name : "Une faction"; }
  function fcol(fid, d) { var i = Fa() && Fa().info(fid); return i && i.color ? i.color : d; }
  /* quartier qui représente une faction sur la carte : un quartier qu'elle tient et que tu ne contrôles pas encore, sinon n'importe lequel des siens */
  function homeOf(s, fid) {
    var ds = BL.data.territory.districts.filter(function (d) { return d.holder === fid; }); if (!ds.length) return { type: "hq" };
    var free = ds.filter(function (d) { return T().lv(s, d.id) === 0; }); return { type: "district", id: (free[0] || ds[0]).id };
  }
  function active(s) {
    var out = [], t = num(s && s.t); if (!s || typeof s !== "object") return out;
    var c = s.terr && s.terr.conflict;
    if (c && T().dist(c.did)) { var dd = T().dist(c.did); out.push({ key: "conflict:" + c.did, kind: "conflict", target: { type: "district", id: c.did }, title: fname(c.fid) + " attaque " + dd.name, sub: "Défends ce quartier ou négocie.", short: "Attaque", col: fcol(c.fid, KINDS.conflict.col), left: Math.max(0, num(c.until) - t), total: null, fid: c.fid }); }
    if (s.pending && Ec()) { var ev = Ec().find(BL.data.events, s.pending); if (ev) out.push({ key: "event:" + s.pending, kind: "event", target: { type: "hq" }, title: Ec().fText(ev.title, s.pendingFac, s.pendingCrew), sub: "Une décision t’attend.", short: "Événement", col: KINDS.event.col, left: null, total: null }); }
    var op = s.eq && s.eq.op, od = op && Eq() && Eq().op(op.id);
    if (od) { var tg = od.fac ? homeOf(s, od.fac) : { type: "hq" }; var left = Math.max(0, num(op.end) - t); out.push({ key: "op:" + op.id, kind: "op", target: tg, title: od.name, sub: left <= 0 ? "Équipe de retour : récupère le butin." : "Équipe en mission.", short: left <= 0 ? "Retour" : "Mission", col: od.fac ? fcol(od.fac, KINDS.op.col) : KINDS.op.col, left: left, total: Math.max(1, num(op.end) - num(op.start)), fid: od.fac || null }); }
    if (s.boost && t < num(s.boost.until)) out.push({ key: "boost", kind: "boost", target: { type: "hq" }, title: "Bonus de revenus ×" + String(Math.round(num(s.boost.mult) * 100) / 100).replace(".", ","), sub: "Temporaire.", short: "Bonus", col: KINDS.boost.col, left: num(s.boost.until) - t, total: null });
    if (s.fac && BL.data && BL.data.territory) BL.data.territory.factions.forEach(function (f) {
      var x = s.fac[f.id]; if (!x) return;
      if (num(x.ally) > t) out.push({ key: "ally:" + f.id, kind: "ally", target: homeOf(s, f.id), title: "Alliance avec " + f.name, sub: "Alliée du moment.", short: "Alliance", col: fcol(f.id, KINDS.ally.col), left: num(x.ally) - t, total: null, fid: f.id });
      else if (num(x.truce) > t) out.push({ key: "truce:" + f.id, kind: "truce", target: homeOf(s, f.id), title: "Trêve avec " + f.name, sub: "Pas d’attaque de leur part.", short: "Trêve", col: fcol(f.id, KINDS.truce.col), left: num(x.truce) - t, total: null, fid: f.id });
    });
    out.sort(function (a, b) { return KINDS[a.kind].prio - KINDS[b.kind].prio || (a.left === null ? 1e18 : a.left) - (b.left === null ? 1e18 : b.left); });
    return out;
  }
  BL.events = { KINDS: KINDS, active: active, fmt: fmt };
})(typeof globalThis !== "undefined" ? globalThis : this);
