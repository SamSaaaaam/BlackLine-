/* Partie 19 · B : navigation en 4 groupes et pastilles d'ACTION (jamais décoratives). Logique pure, aucun DOM.
   Une pastille de vue = nombre d'actions possibles maintenant dans cette vue ; une pastille de groupe = somme de ses vues.
   Sources : récompense à réclamer (Journal), chantier commandable avec un ouvrier libre (Activités), événement en cours (Tableau de bord),
   opération terminée (Opérations), attaque ou quartier prenable (Territoires), équipier recrutable (Équipiers), chapitre prêt (Histoire),
   défi accompli à réclamer (Journal), coffre plein (QG). */
(function (root) {
  var BL = root.BL = root.BL || {};
  /* [id, intitulé, icône, description (3 mots au plus), vues] — les identifiants de vue (data-view) ne changent pas */
  var GROUPS = [["empire", "Empire", "empire", "Argent et objectifs", ["dash", "empire", "upg", "goals"]], ["field", "Terrain", "map", "Carte et territoires", ["map", "ops", "terr"]],
    ["crew", "Équipe", "team", "Équipiers et Arsenal", ["team", "arsenal"]], ["more", "Plus", "vault", "QG, histoire, aide", ["hq", "shop", "boxes", "radio", "saga", "board", "glossary"]]];
  function safe(f) { try { return f(); } catch (e) { return 0; } }
  function counts(s) {
    var c = {}, E = BL.economy; if (!s || typeof s !== "object") return c;
    c.dash = safe(function () { return s.pending ? 1 : 0; });
    c.goals = safe(function () { var n = BL.journal ? BL.journal.zones(s).now.length : 0; return n; });
    c.empire = safe(function () { var W = BL.works; if (!W) return 0; if (W.active(s).length >= W.workers(s)) return 0; var b = BL.buy && BL.buy.best(s); return b && !b.none && b.kind !== "upg" ? 1 : 0; });
    c.ops = safe(function () { return BL.equip && BL.equip.status(s).state === "ready" ? 1 : 0; });
    c.terr = safe(function () { if (s.terr && s.terr.conflict) return 1; var T = BL.territory, n = 0; BL.data.territory.districts.forEach(function (d) { if (T.state(s, d) === "available" && s.money + 1e-9 >= T.takeCost(d, "negotiate", s)) n = 1; }); return n; });
    c.team = safe(function () { var C = BL.crew, n = 0; BL.data.crew.members.forEach(function (m) { if (C.state(s, m) === "available" && s.money + 1e-9 >= m.cost) n = 1; }); return n; });
    c.saga = safe(function () { var cur = BL.saga && BL.saga.current(s); return cur && cur.ready ? 1 : 0; });
    c.hq = safe(function () { return BL.gold && s.gold >= BL.gold.capacity(s) ? 1 : 0; });
    Object.keys(c).forEach(function (k) { var v = c[k]; c[k] = typeof v === "number" && isFinite(v) && v > 0 ? Math.min(99, Math.floor(v)) : 0; });
    return c;
  }
  function groupCounts(s, groups) { var c = counts(s), g = {}; (groups || GROUPS).forEach(function (x) { g[x[0]] = x[4].reduce(function (a, v) { return a + (c[v] || 0); }, 0); }); return { views: c, groups: g }; }
  BL.nav = { GROUPS: GROUPS, counts: counts, groupCounts: groupCounts };
})(typeof globalThis !== "undefined" ? globalThis : this);
