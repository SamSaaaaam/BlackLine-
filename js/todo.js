/* Partie 19 · C : « À faire maintenant ». Module PUR : next(state, now) → au plus 3 actions { id, text (≤ 60 caractères), view, urgency (0 à 3), go? },
   par priorité décroissante : récompense à réclamer · chantier terminé / ouvrier libre · meilleur achat abordable · opération ou braquage disponible ·
   défi presque accompli · attaque de rival · chaleur élevée · événement en cours. Aucune écriture dans l'état ; tolère n'importe quel état. */
(function (root) {
  var BL = root.BL = root.BL || {}, MAX = 3, LEN = 60;
  function cut(t) { t = String(t); return t.length <= LEN ? t : t.slice(0, LEN - 1).replace(/\s+\S*$/, "") + "…"; }
  function money(n) { return BL.fmt ? BL.fmt.money(n) : BL.ui && BL.ui.money ? BL.ui.money(n) : "$" + Math.round(n); }
  function obj(o) { return !!o && typeof o === "object" && !Array.isArray(o); }   /* les modules du jeu initialisent l'état à la lecture : on ne les appelle que si leur partie existe déjà */
  function tryIt(f) { try { return f(); } catch (e) { return null; } }
  function next(s, now) {
    var out = [], E = BL.economy; if (!s || typeof s !== "object" || !E) return out;
    function add(o) { if (o && out.length < MAX && !out.some(function (x) { return x.id === o.id; })) { o.text = cut(o.text); out.push(o); } }
    /* 1. récompense à réclamer (objectif ou défi) */
    tryIt(function () { var m = BL.data.missions.filter(function (x) { return !s.claimed[x.id] && E.progress(s, x.cond).done; })[0]; if (m) add({ id: "claim", text: "Réclame ta récompense : " + m.name, view: "goals", urgency: 2 }); });
    tryIt(function () { var M = BL.meta; if (!M || !obj(s.meta)) return; ["dc", "wc"].forEach(function (k) { var ch = s.meta[k]; if (ch && Array.isArray(ch.list)) ch.list.forEach(function (_, i) { var p = M.progress(s, k, i); if (p && p.done && !p.claimed && !M.whyClaim(s, k, i)) add({ id: "chal", text: "Défi accompli : réclame tes lingots", view: "goals", urgency: 2 }); }); }); });
    /* 2. ouvrier libre (chantier terminé ou jamais occupé) */
    tryIt(function () { var W = BL.works; if (!W || !obj(s.works) || !Array.isArray(s.works.q)) return; var free = W.workers(s) - W.active(s).length; if (free > 0 && !W.full(s)) { var b = BL.buy && BL.buy.best(s); if (b && !b.none && b.kind !== "upg") add({ id: "worker", text: (free > 1 ? free + " ouvriers libres" : "Un ouvrier est libre") + " : lance un chantier", view: "empire", urgency: 2 }); } });
    /* 3. meilleur achat abordable */
    tryIt(function () { if (!obj(s.works) || !obj(s.upg)) return; var b = BL.buy && BL.buy.best(s); if (b && !b.none) add({ id: "buy", text: "Achète : " + b.name + " · " + money(b.cost), view: b.kind === "upg" ? "upg" : "empire", urgency: 1 }); });
    /* 4. opération terminée ou disponible, braquage disponible */
    tryIt(function () { var Q = BL.equip; if (!Q || !obj(s.eq)) return; var st = Q.status(s); if (st.state === "ready") add({ id: "op", text: "Opération terminée : récupère le butin", view: "ops", urgency: 2 }); else if (st.state === "none" && BL.crew && BL.crew.owned(s).length && Q.opsList().some(function (o) { return Q.opUnlock(s, o).ok; })) add({ id: "op", text: "Lance une opération avec ton équipe", view: "ops", urgency: 1 }); });
    tryIt(function () { var H = BL.heist; if (H && obj(s.heist) && !s.heist.run && !H.why(s)) add({ id: "heist", text: "Un braquage est prêt : prépare le coup", view: "dash", urgency: 1, go: "heist" }); });
    /* 5. défi presque accompli (80 % ou plus) */
    tryIt(function () { var M = BL.meta; if (!M || !obj(s.meta)) return; ["dc", "wc"].forEach(function (k) { var ch = s.meta[k]; if (ch && Array.isArray(ch.list)) ch.list.forEach(function (_, i) { var p = M.progress(s, k, i); if (p && !p.done && p.p >= 0.8) add({ id: "chalnear", text: "Défi presque accompli (" + Math.floor(p.p * 100) + " %)", view: "goals", urgency: 1 }); }); }); });
    /* 6. attaque de rival à repousser */
    tryIt(function () { var c = obj(s.terr) && obj(s.terr.conflict) ? s.terr.conflict : null; if (c && BL.territory) { var d = BL.territory.dist(c.did); add({ id: "attack", text: "Attaque sur " + (d ? d.name : "un quartier") + " : défends-le", view: "terr", urgency: 3 }); } });
    /* 7. chaleur élevée */
    tryIt(function () { var v = obj(s.heat) && typeof s.heat.v === "number" && isFinite(s.heat.v) ? s.heat.v : 0; if (v >= 60) add({ id: "heat", text: "Chaleur à " + Math.round(v) + " : fais-la baisser", view: "map", urgency: v >= 75 ? 3 : 2, go: "heat" }); });
    /* 8. événement en cours */
    tryIt(function () { if (s.pending) { var ev = E.find(BL.data.events, s.pending); if (ev) add({ id: "event", text: "Décide : " + E.fText(ev.title, s.pendingFac, s.pendingCrew), view: "dash", urgency: 2 }); } });
    return out;
  }
  /* état vide : prochain événement connu (en temps de jeu) */
  function empty(s) {
    var left = s && typeof s.nextEvent === "number" && typeof s.t === "number" && isFinite(s.nextEvent - s.t) ? Math.max(0, s.nextEvent - s.t) : null;
    return { text: "Rien d’urgent. Profite de la ville.", sub: left === null ? "" : left < 60 ? "Prochain événement dans moins d’une minute." : "Prochain événement dans environ " + Math.ceil(left / 60) + " min." };
  }
  BL.todo = { next: next, empty: empty, MAX: MAX, LEN: LEN };
})(typeof globalThis !== "undefined" ? globalThis : this);
