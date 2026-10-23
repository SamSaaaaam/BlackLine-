/* Scène d'opération (Partie 15) : chronologie PURE (aucun DOM, aucun hasard, aucun état modifié).
   Elle transforme un compte rendu DÉJÀ CALCULÉ (BL.equip.resolve) en liste d'événements datés. Elle ne décide de rien :
   réussite, blessés, butin et argent sont recopiés tels quels dans `result`, et chaque blessé du compte rendu (et lui seul) reçoit un événement « hurt ». */
(function (root) {
  var BL = root.BL = root.BL || {};
  function hash(a, b) { var h = 2166136261 ^ a; h = Math.imul(h ^ (b | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function seedOf(r) { var s = 7, k = String(r.op) + "|" + (r.team || []).join(","); for (var i = 0; i < k.length; i++) s = (s * 31 + k.charCodeAt(i)) | 0; return (s ^ Math.floor((+r.at || 0) * 1000)) | 0; }
  /* r : compte rendu ; o : opération ; opt.name(id) : nom court ; opt.fem(id) : équipière ?
     Retourne { fam, fac, enemies, team, events, dur, result }. Trois familles : « raid » (rue), « convoy » (route), « heist » (coffre). */
  function timeline(r, o, opt) {
    opt = opt || {}; var nm = opt.name || function (id) { return String(id); }, fam = o && o.fam === "convoy" ? "convoy" : o && o.fam === "heist" ? "heist" : "raid";
    var team = (r.team || []).slice(0, 4), seed = seedOf(r), ev = [], t = 0, tier = o && o.tier ? o.tier : 1;
    var ne = fam === "heist" ? Math.max(1, Math.min(3, tier)) : fam === "convoy" ? (tier >= 3 ? 3 : 2) : Math.max(2, Math.min(4, tier + 1));
    var hurt = (r.hurt || []).filter(function (id) { return team.indexOf(id) >= 0; }), i;
    function add(at, kind, who, text, extra) { var e = { t: Math.round(at * 100) / 100, k: kind, who: who === undefined ? null : who, text: text }; if (extra) for (var q in extra) e[q] = extra[q]; ev.push(e); }
    function hurtEv() { hurt.forEach(function (id) { add(t, "hurt", id, nm(id) + (opt.fem && opt.fem(id) ? " est touchée" : " est touché") + ". Aucune perte : seulement indisponible un moment.", { close: true }); t += 1.4; }); }
    function lootEv() { add(t, "loot", null, (r.loot && r.loot.length ? "Du butin : " + r.loot.length + " objet" + (r.loot.length > 1 ? "s" : "") + "." : "Le coup est joué.") + (r.money > 0 ? " Argent récupéré." : ""), { loot: (r.loot || []).slice() }); t += 1.2; }
    function volleys(verb) {
      for (var rd = 0; rd < 2; rd++) {
        team.forEach(function (id, n) { var tg = Math.floor(hash(seed + rd * 7 + n, 3) * ne); add(t, "shoot", id, nm(id) + " " + verb + ". Un ennemi recule.", { target: tg }); add(t + 0.18, "recoil", null, "", { target: tg }); t += 0.55; });
        for (i = 0; i < Math.min(2, ne); i++) { add(t, "enemyShoot", null, "", { target: i }); t += 0.3; }
        t += 0.3; if (rd === 0) { add(t, "advance", null, fam === "convoy" ? "L’équipe serre le convoi de plus près." : "Nouvelle poussée : l’équipe gagne du terrain."); t += 1.1; }
      }
    }
    if (fam === "raid") {
      add(0, "enter", null, (team.length > 1 ? "Ton équipe arrive" : nm(team[0]) + " arrive") + " dans la rue. Les ennemis ne l’ont pas encore vue.");
      add(2.2, "advance", null, "Le groupe avance, en silence.");
      add(4.2, "cover", null, "Il se met à couvert derrière les voitures. Premiers cris côté ennemi."); t = 5.4; volleys("tire"); hurtEv();
      if (r.ok) { for (i = 0; i < ne; i++) { add(t, "collapse", null, i === 0 ? "Les ennemis lâchent prise." : "", { target: i }); t += 0.35; } if (r.crit) { add(t, "close", team[0], "Coup éclatant : " + nm(team[0]) + " finit le travail.", { close: true }); t += 1.4; } lootEv(); add(t, "victory", null, "Réussite. L’équipe repart sans se retourner."); t += 1.6; }
      else { if (!hurt.length) { add(t, "cover", null, "L’équipe encaisse sans casse."); t += 1; } add(t, "retreat", null, r.near ? "Échec de justesse : repli sous les tirs." : "Échec : repli. Mieux vaut vivre pour recommencer."); t += 1.8; }
    } else if (fam === "convoy") {
      add(0, "enter", null, "Ton équipe prend la route, phares éteints.");
      add(2.2, "chase", null, "Le convoi apparaît au loin. L’équipe accélère.");
      add(4.2, "chase", null, "Elle se glisse à la hauteur du dernier véhicule."); t = 5.4; volleys("tire sur le convoi"); hurtEv();
      if (r.ok) { add(t, "tire", null, "Un pneu éclate : le convoi ralentit, puis s’arrête.", { target: 0 }); t += 1.3; add(t, "stop", null, ""); t += 0.8; for (i = 0; i < ne; i++) { add(t, "collapse", null, i === 0 ? "Les gardes descendent, mains en l’air." : "", { target: i }); t += 0.35; } if (r.crit) { add(t, "close", team[0], "Coup éclatant : " + nm(team[0]) + " bloque la route.", { close: true }); t += 1.4; } lootEv(); add(t, "victory", null, "Réussite. Le chargement change de camp."); t += 1.6; }
      else { if (!hurt.length) { add(t, "cover", null, "L’équipe encaisse sans casse."); t += 1; } add(t, "retreat", null, r.near ? "Échec de justesse : le convoi file, l’équipe décroche." : "Échec : le convoi prend de la vitesse, l’équipe décroche."); t += 1.8; }
    } else {
      add(0, "enter", null, "L’équipe se glisse dans le bâtiment, lumières éteintes.");
      add(2.2, "sneak", null, "Elle progresse dans l’ombre, le long des murs.");
      add(4.2, "laser", null, "Un réseau de faisceaux : elle l’évite, pas à pas."); t = 6;
      add(t, "crack", team[0], nm(team[0]) + " s’attaque à la serrure du coffre.", { target: 0 }); t += 2;
      if (hurt.length || !r.ok) { add(t, "alarm", null, "Une alarme se déclenche. Les gardes arrivent."); t += 1.2; for (i = 0; i < ne; i++) { add(t, "enemyShoot", null, "", { target: i }); t += 0.3; } t += 0.3; hurtEv(); }
      if (r.ok) { add(t, "open", null, "Le coffre s’ouvre."); t += 1.2; for (i = 0; i < ne; i++) { add(t, "collapse", null, "", { target: i }); t += 0.2; } if (r.crit) { add(t, "close", team[0], "Coup éclatant : " + nm(team[0]) + " vide le coffre sans un bruit.", { close: true }); t += 1.4; } lootEv(); add(t, "victory", null, "Réussite. L’équipe disparaît avant l’aube."); t += 1.6; }
      else { add(t, "retreat", null, r.near ? "Échec de justesse : repli par la porte de service." : "Échec : repli. Le coffre restera fermé."); t += 1.8; }
    }
    add(t, "end", null, "");
    return { fam: fam, fac: o ? o.fac : null, enemies: ne, team: team, events: ev, dur: t,
      result: { ok: !!r.ok, near: !!r.near, crit: !!r.crit, hurt: (r.hurt || []).slice(), loot: (r.loot || []).slice(), sold: (r.sold || []).slice(), money: r.money || 0 } };
  }
  /* Texte du résumé final : mêmes mots que le compte rendu existant */
  function summary(r, o, nm) {
    var title = r.crit ? "Réussite éclatante" : r.ok ? "Opération réussie" : r.near ? "Échec de justesse" : "Opération ratée";
    return title + (o ? " : " + o.name : "") + (r.money > 0 ? ". Argent : +" + Math.round(r.money) : "") + (r.hurt && r.hurt.length ? ". Blessé" + (r.hurt.length > 1 ? "s" : "") + " : " + r.hurt.map(nm || String).join(", ") : ". Aucun blessé") + ".";
  }
  BL.opsScene = { timeline: timeline, summary: summary, hash: hash };
})(typeof globalThis !== "undefined" ? globalThis : this);
