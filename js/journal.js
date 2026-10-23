/* Journal unifié (chantier 4) : événements, opérations, bonus, missions et objectifs dans UN modèle commun, rangés en 3 zones.
   Logique PURE (aucun DOM). Tout vient de l'état réel : jamais de faux compte à rebours (left = null quand le jeu n'en connaît pas).
   Entrée : { id, kind, zone, title, sub, p (0..1 ou null), left (s ou null), cta {label, type:"claim"|"go", id, view, target}, prio, tier }
   zone "now"   = À faire maintenant : demande une action du joueur (attaque, événement, mission à réclamer)
   zone "doing" = En cours : ça avance tout seul (opération, bonus, alliance, trêve) + missions déjà entamées
   zone "goals" = Objectifs : le reste des missions (court, moyen, long terme)
   Le badge du menu = nombre d'entrées « À faire maintenant ». */
(function (root) {
  var BL = root.BL = root.BL || {};
  var ZONES = [["now", "À faire maintenant"], ["doing", "En cours"], ["goals", "Objectifs"]];
  var TIER_LABEL = { short: "Court terme", mid: "Moyen terme", long: "Long terme" };
  function E() { return BL.economy; }
  function condText(c) { return BL.ui && BL.ui.condText ? BL.ui.condText(c) : ""; }
  function entries(s) {
    var out = [], ev = BL.events ? BL.events.active(s) : [], D = BL.data;
    ev.forEach(function (e) {
      var now = e.kind === "conflict" || e.kind === "event" || (e.kind === "op" && e.left !== null && e.left <= 0);
      var view = e.kind === "conflict" ? "terr" : e.kind === "op" ? "ops" : e.kind === "event" ? "dash" : e.kind === "boost" ? "shop" : "terr";
      out.push({ id: e.key, kind: e.kind, zone: now ? "now" : "doing", title: e.title, sub: e.sub || "", p: e.total && e.left !== null ? Math.max(0, Math.min(1, 1 - e.left / e.total)) : null, left: e.left === undefined ? null : e.left,
        cta: { label: e.kind === "conflict" ? "Décider" : e.kind === "event" ? "Décider" : e.kind === "op" ? (now ? "Récupérer" : "Voir") : "Voir", type: "go", view: view, target: e.target }, prio: e.kind === "conflict" ? 0 : e.kind === "event" ? 1 : 3 });
    });
    D.missions.forEach(function (m) {
      if (s.claimed[m.id]) return; var p = E().progress(s, m.cond), r = m.reward || {}, rw = (r.money ? "+$" + Math.round(r.money) : "") + (r.rep ? " +" + r.rep + " réputation" : "") + (r.infl ? " +" + r.infl + " influence" : "");
      var zone = p.done ? "now" : p.p > 0 ? "doing" : "goals";
      out.push({ id: "mission:" + m.id, kind: "mission", zone: zone, tier: m.tier, title: m.name, sub: p.done ? "Terminée : récompense " + rw.trim() : condText(m.cond), p: p.done ? null : p.p, left: null, cta: p.done ? { label: "Réclamer", type: "claim", id: m.id } : null, prio: p.done ? 2 : 5 - p.p });
    });
    out.sort(function (a, b) { return a.prio - b.prio; });
    return out;
  }
  /* « En cours » : on ne garde que les 3 missions les plus avancées ; les autres retombent dans « Objectifs » (la liste reste courte). */
  function zones(s) {
    var all = entries(s), z = { now: [], doing: [], goals: [] }, nm = 0;
    all.forEach(function (e) { if (e.zone === "doing" && e.kind === "mission") { if (nm++ >= 3) e.zone = "goals"; } z[e.zone].push(e); });
    return z;
  }
  function badge(s) { return zones(s).now.length; }
  BL.journal = { ZONES: ZONES, TIER_LABEL: TIER_LABEL, entries: entries, zones: zones, badge: badge };
})(typeof globalThis !== "undefined" ? globalThis : this);
