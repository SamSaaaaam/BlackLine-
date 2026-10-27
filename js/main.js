/* Orchestration : boucle de jeu, sauvegarde automatique, branchement interface / économie. */
(function () {
  var BL = window.BL, E = BL.economy, T = BL.territory, C = BL.crew, F = BL.factions, S = BL.save, U = BL.ui, resetting = false;
  var SY = BL.sysUI, B = BL.data.balance, now = Date.now(), loaded = S.loadFull(now), state = loaded.state, settings = loaded.settings, last = now, lastSave = now;
  var off = E.offline(state, now);                       /* revenus hors ligne : calculés une seule fois, puis la date de référence passe à "maintenant" */
  E.checkAch(state);
  function clock() { return new Date().toLocaleTimeString("fr-FR"); }
  function exportNow() { settings.exportAt = Date.now(); SY.download("blackline-sauvegarde-" + new Date().toISOString().slice(0, 10) + ".json", S.exportText(state, settings)); doSave(false); SY.clearAlert("exportRemind"); SY.msg("Sauvegarde exportée dans tes téléchargements."); }
  function doSave(force) {
    if (resetting) return false;
    var ok = S.save(state, settings, force), st = S.status();
    if (ok) { SY.saveInfo("Sauvegardé à " + clock(), false); SY.clearAlert("quota"); SY.clearAlert("unavailable"); return true; }
    if (st.error === "other") {
      SY.saveInfo("Sauvegarde en pause", true);
      SY.alert("other", "BLACKLINE est ouvert dans un autre onglet. Cet onglet ne sauvegarde plus, pour ne pas écraser ta progression.", [{ label: "Reprendre ici", fn: function () { resetting = true; location.reload(); } }]);
    } else {
      SY.saveInfo("Sauvegarde en échec", true);
      SY.alert(st.error || "unavailable", "La sauvegarde automatique ne fonctionne pas (stockage plein ou bloqué par le navigateur). Exporte ta progression pour ne rien perdre.", [{ label: "Exporter", fn: exportNow }]);
    }
    return false;
  }
  /* Bilan d'une absence : durée, gains, faits notables. */
  function report(o, title) {
    var rows = [["Durée d’absence", SY.dur(o.elapsed) + (o.capped ? " (comptés : " + SY.dur(o.sec) + ")" : "")], ["Rendement hors ligne", Math.round(B.offlineEfficiency * 100) + " % de tes revenus nets, " + SY.dur(B.offlineCapSec) + " au plus"], ["Revenus obtenus", "+" + U.money(o.gain), "pos"]];
    var tot = 0, parts = BL.data.activities.map(function (a) { var v = E.actIncome(state, a); tot += v; return { a: a, v: v }; }).filter(function (x) { return x.v > 0; }).sort(function (x, y) { return y.v - x.v; }).slice(0, 3);
    if (o.works && o.works.length) rows.push(["Chantiers terminés", o.works.length + " (" + o.works.slice(0, 3).map(function (e) { var a = E.find(BL.data.activities, e.id); return a.name + " niv. " + e.to; }).join(" · ") + (o.works.length > 3 ? "…" : "") + ")", "pos"]);
    if (BL.works && BL.works.list(state).length) rows.push(["Chantiers en cours", BL.works.active(state).length + " (" + BL.works.waiting(state).length + " en file)"]);
    if (tot > 0 && parts.length) rows.push(["Principaux contributeurs", parts.map(function (x) { return x.a.name + " " + Math.round(x.v / tot * 100) + " %"; }).join(" · ")]);
    var notes = E.offlineNotes(state, o); notes.push("Reste actif : tes gains hors-ligne sont limités (" + Math.round(B.offlineEfficiency * 100) + " %, " + SY.dur(B.offlineCapSec) + " au plus)." + (BL.works ? " Tes chantiers, eux, avancent à 100 % pendant ton absence." : ""));   /* Partie 17 · B */
    SY.bilan({ title: title, rows: rows, notes: notes, acts: BL.ui && BL.ui.welcome ? BL.ui.welcome(state) : [] });
  }
  function applyAbsence(o, title) {
    if (BL.bonds && o.sec > 0) BL.bonds.advance(state, o.sec, true);   /* loyauté hors ligne : plafonnée, aucun avertissement ni départ */
    if (BL.heat && o.sec > 0) { var h0 = BL.heat.state(state).v; BL.heat.advance(state, o.sec, true); o.heat = { from: h0, to: BL.heat.state(state).v, name: BL.heat.tier(state).name }; }   /* C9 : jamais de descente ni d'amende hors ligne */
    if (BL.rivals && o.sec > 0) o.rivals = BL.rivals.advance(state, o.sec, true);   /* les rivaux avancent pendant l'absence : plafonné, sans attaque automatique */
    if (o.sec > 0 && BL.equip) BL.equip.credit(state, o.sec);        /* le temps d'absence compte pour l'opération en cours et les blessures */
    if (BL.works) { o.works = BL.works.absence(state, o.elapsed); worksDone(o.works, true); }   /* Partie 17 · D : les chantiers avancent à 100 % pendant l'absence (24 h au plus, rien si l'horloge recule) */
    if (o.gain > 0) E.addLog(state, "Revenus hors ligne : +" + U.money(o.gain) + " (" + SY.dur(o.sec) + ").");
    if ((o.elapsed >= 60 && o.gain > 0) || (o.elapsed >= 60 && E.offlineNotes(state, o).length) || (o.works && o.works.length)) report(o, title);
    doSave(false);                                       /* enregistré tout de suite : un rechargement ne peut pas réclamer deux fois */
  }
  /* Locks anti double clic : après un achat réussi, la même cible est ignorée pendant buyLockMs. */
  var lock = {}, stamp = "";
  function locked(key) { var t = Date.now(); return !!lock[key] && t - lock[key] < BL.data.balance.buyLockMs; }
  function arm(key) { lock[key] = Date.now(); }

  function decide(mode) {
    if (locked("cf")) return false; var r = T.resolve(state, mode, Math.random); if (!r) return false; arm("cf"); if (BL.rivals && r.faction) BL.rivals.record(state, r.faction.id, r.type === "won" ? "won" : r.type === "truce" ? "truce" : "lost");
    var m = r.type === "won" ? "Attaque repoussée : " + r.district.name + " tient bon face à " + r.faction.name + "." : r.type === "truce" ? "Trêve conclue avec " + r.faction.name + " pour protéger " + r.district.name + "." :
      "Défense perdue : " + r.district.name + (r.dropped ? " perd un niveau de contrôle." : " résiste de justesse.");
    E.addLog(state, m); U.toast(m, r.type === "lost" ? "evt" : "ok"); return true;
  }
  /* Partie 17 · D : chantier terminé (inauguration) */
  function worksDone(list, away) {
    if (!list.length) return; var acts = BL.data.activities;
    list.forEach(function (e) { var a = E.find(acts, e.id), m = e.to === 1 ? (e.i ? "Inauguration : nouveau bâtiment " + (e.i + 1) + " de " + a.name + "." : "Inauguration : " + a.name + " ouvre ses portes.") : "Chantier terminé : " + a.name + " · bâtiment " + (e.i + 1) + " au niveau " + e.to + "."; E.addLog(state, m); if (!away) { U.toast(m, "ok"); if (BL.worksUI) BL.worksUI.inaugurate(e); } });
    if (away) return; var last = list[list.length - 1], la = E.find(acts, last.id), big = list.some(function (e) { return BL.works.duration(e.id, e.i, e.to) >= 120; });
    if (big && BL.notify) BL.notify.push({ type: "design", key: "works-" + last.id + last.i, title: list.length > 1 ? list.length + " chantiers terminés" : "Chantier terminé", text: la.name + " · bâtiment " + (last.i + 1) + " : niveau " + last.to + ".", target: { type: "lot", act: last.id, id: last.id + "#" + last.i }, mark: { type: "lot", act: last.id, id: last.id + "#" + last.i } });
    BL.audio.sfx(big ? "inaug" : "success");
  }
  function bondNotice(n) {
    var m = n.id && BL.crew.get(n.id), nm = m ? m.name : "Un équipier", a = n.a && BL.crew.get(n.a), b = n.b && BL.crew.get(n.b), tx, ty = "attack", key = "bond-" + n.type + (n.id || "");
    if (n.type === "warn1") { tx = nm + " est distant : sa loyauté baisse. Une prime ou un moment personnel peut tout arranger."; }
    else if (n.type === "warn2") { tx = nm + " pense à partir : il te reste 10 minutes en ligne pour réagir (prime, mission personnelle, ou écarter la cause de tension)."; }
    else if (n.type === "calm") { E.addLog(state, nm + " reprend confiance."); U.toast(nm + " reprend confiance.", "ok"); return; }
    else if (n.type === "dispute") { tx = (a ? a.name : "?") + " et " + (b ? b.name : "?") + " se disputent : leur efficacité baisse de 20 % pendant 5 minutes."; key = "bond-dis" + n.a + n.b; }
    else if (n.type === "disputeEnd") { E.addLog(state, "La dispute est terminée."); return; }
    else if (n.type === "leave") { tx = nm + " est parti. Il garde son niveau : rappelle-le depuis l’onglet Équipe."; }
    else if (n.type === "betray") { tx = nm + " t’a trahi : chaleur +" + n.heat + ", " + U.money(n.loss) + " perdus. Il peut être rappelé depuis l’onglet Équipe."; }
    else return;
    E.addLog(state, tx); BL.notify.push({ type: ty, key: key, title: n.type === "betray" ? "Trahison" : n.type === "leave" ? "Départ" : n.type === "dispute" ? "Dispute" : "Équipe : " + nm, text: tx, target: { view: "team" } });
  }
  var sagaDue = 0, metaScanT = 0, metaDayAt = 0, remindChk = 0, remindShown = false;
  /* Rappel d'export (Partie 13 · C11) : au plus une fois par session, après 7 jours sans export et au moins 30 min de jeu ; « Plus tard » repousse de 2 jours. */
  function exportRemind() {
    var DAY = 864e5, t = Date.now(); if (!settings.exportAt) { settings.exportAt = t; return; }
    if (remindShown || state.t < 1800 || t - settings.exportAt < 7 * DAY) return; remindShown = true; var d = Math.floor((t - settings.exportAt) / DAY);
    SY.alert("exportRemind", "Tu n’as pas exporté ta sauvegarde depuis " + d + " jours. Le navigateur peut effacer ses données : un export (un petit fichier) protège ta progression.", [{ label: "Exporter", fn: exportNow }, { label: "Plus tard", fn: function () { settings.exportAt = Date.now() - 5 * DAY; doSave(false); SY.clearAlert("exportRemind"); } }]);
  }   /* délai avant l'annonce d'un chapitre : une promotion ou une alerte passe d'abord */
  function heatNotice(n) {
    if (n.type === "raidWarn") { var dn = BL.heat.districtName(n.target), wm = "Descente imminente" + (dn ? " à " + dn : "") + " dans 2 minutes : la chaleur est trop haute. Corromps un inspecteur, fais profil bas ou prépare la défense du quartier."; E.addLog(state, wm); BL.notify.push({ type: "attack", key: "raidwarn", title: "Descente imminente" + (dn ? " · " + dn : ""), text: "Fais redescendre la chaleur sous 70, ou défends le quartier (amende réduite de moitié, aucune saisie).", target: { view: "dash" } }); }
    else if (n.type === "raid") {
      var dn2 = BL.heat.districtName(n.target), rm = "Descente de police" + (dn2 ? " à " + dn2 : "") + " : amende de " + U.money(n.fine) + (n.defended ? " (réduite : quartier défendu)" : "") + ". La chaleur retombe à " + BL.heat.params.raidAfter + ".";
      if (n.closed) { var bt = BL.dbuild && BL.dbuild.find(n.closed); rm += " Bâtiment fermé 8 min : " + (bt ? bt.name : n.closed) + "."; }
      if (n.seized) { var it = BL.equip && BL.equip.item(n.seized); rm += " Objet saisi (rendu dans 12 min, ou rachetable) : " + (it ? it.name : n.seized) + "."; }
      if (n.arrested) { var mb = BL.crew && BL.crew.get(n.arrested); rm += " " + (mb ? mb.name : "Un équipier") + " est en garde à vue 10 min (rançon possible)."; }
      if (BL.report) { var rows = [{ k: "Quartier visé", v: dn2 || "inconnu" }, { k: "Amende", v: U.money(n.fine) + (n.defended ? " (réduite : quartier défendu)" : ""), ok: !!n.defended }]; if (n.closed) rows.push({ k: "Bâtiment fermé 8 min", v: (BL.dbuild && BL.dbuild.find(n.closed) ? BL.dbuild.find(n.closed).name : n.closed), ok: false }); if (n.seized) rows.push({ k: "Objet saisi (rendu dans 12 min)", v: (BL.equip && BL.equip.item(n.seized) ? BL.equip.item(n.seized).name : n.seized), ok: false }); if (n.arrested) rows.push({ k: "Garde à vue 10 min", v: (BL.crew && BL.crew.get(n.arrested) ? BL.crew.get(n.arrested).name : "un équipier"), ok: false }); rows.push({ k: "Chaleur", v: "retombe à " + BL.heat.params.raidAfter, ok: true }); BL.report.show(BL.report.police({ title: "Descente de police", stamp: n.defended ? "Limitée" : "Subie", good: !!n.defended, rows: rows, foot: "Tout ce qui est fermé, saisi ou retenu revient : rien n’est perdu pour toujours." }), "Descente de police"); }
      E.addLog(state, rm); U.toast(rm, "evt"); BL.notify.push({ type: "attack", key: "raid-" + (BL.heat.state(state).rc || 0), title: "Descente de police", text: "Détails dans la fenêtre Chaleur.", target: { view: "dash" } });
    }
    else if (n.type === "reopen") { var m1 = "Bâtiment rouvert" + (BL.dbuild && BL.dbuild.find(n.id) ? " : " + BL.dbuild.find(n.id).name : "") + "."; E.addLog(state, m1); U.toast(m1, "ok"); }
    else if (n.type === "itemBack") { var it2 = BL.equip && BL.equip.item(n.id), m2 = "Objet rendu par la police" + (it2 ? " : " + it2.name : "") + "."; E.addLog(state, m2); U.toast(m2, "ok"); }
    else if (n.type === "crewBack") { var mb2 = BL.crew && BL.crew.get(n.id), m3 = (mb2 ? mb2.name : "Ton équipier") + " est libéré."; E.addLog(state, m3); U.toast(m3, "ok"); }
    else if (n.type === "tierUp") {   /* C10 : montée de palier = grande bannière brève, une seule fois (palier mémorisé dans la sauvegarde) */
      var TT = { 1: ["Tu es surveillé", "La police a ouvert un dossier sur ton réseau."], 2: ["Sous enquête", "Les enquêteurs fouillent tes activités : opérations plus risquées."], 3: ["TRAQUÉ", "Descente possible à tout moment. Fais retomber la chaleur, vite."] }[n.to] || ["Chaleur en hausse", ""], jm = "Chaleur : palier « " + n.name + " » atteint (" + Math.round(n.v) + " / 100).";
      E.addLog(state, jm); BL.notify.push({ type: "heat", level: n.to, key: "heat-" + n.to, title: TT[0], text: TT[1], target: { view: "map" }, mark: null });
    }
    else if (n.type === "tierDown") { var dm = "La chaleur retombe : palier « " + n.name + " »."; E.addLog(state, dm); U.toast(dm, "ok"); }
    else if (n.type === "raidAvoided") { var am = "Descente évitée : la chaleur est retombée à temps."; E.addLog(state, am); U.toast(am, "ok"); }
  }
  function notice(n) {
    if (n.type === "coalition" || n.type === "coalitionEnd") {
      var fa = BL.data.territory.factions, nm = function (id) { var f = fa.filter(function (x) { return x.id === id; })[0]; return f ? f.name : id; };
      var cm = n.type === "coalition" ? nm(n.a) + " et " + nm(n.b) + " s’allient contre toi pour 20 minutes : leur pression monte plus vite. Calme l’une des deux pour rompre l’alliance." : "L’alliance entre " + nm(n.a) + " et " + nm(n.b) + " est rompue.";
      E.addLog(state, cm); if (n.type === "coalition") BL.notify.push({ type: "attack", key: "coal-" + n.a + n.b, title: "Coalition rivale", text: nm(n.a) + " + " + nm(n.b) + " : ouvre Rivalités.", target: { view: "dash" } }); else U.toast(cm, "ok"); return;
    }
    var m = n.type === "start" ? "Alerte : " + n.faction.name + " attaque " + n.district.name + ". Décide dans la section Territoires."
      : "Sans réponse : " + n.district.name + (n.dropped ? " perd un niveau de contrôle." : " tient de justesse.") + " (" + n.faction.name + ")";
    E.addLog(state, m);
    if (n.type === "start") BL.notify.push({ type: "attack", key: "atk", title: n.faction.name + " attaque " + n.district.name, text: "Décide dans Territoires avant la fin du délai.", target: { type: "district", id: n.district.id }, mark: { type: "district", id: n.district.id } });
    else U.toast(m, "evt");
  }
  BL.city.build(document.getElementById("city"));
  U.init({
    /* Partie 17 · D : acheter ou améliorer un bâtiment lance un CHANTIER (payé tout de suite, niveau appliqué à la fin) */
    buyActivity: function (id, idx) {
      idx = idx || 0; if (locked("a" + id + "_" + idx)) return false; var W = BL.works, a = E.find(BL.data.activities, id), ck = W.canOrder(state, id, idx);
      if (!ck.ok) { if (ck.why === "full") U.toast("File de chantiers pleine : attends qu’un ouvrier se libère.", "warn"); else if (ck.why === "busy") U.toast("Ce bâtiment est déjà en chantier.", "warn"); return false; }
      var e = W.order(state, id, idx); if (!e) return false; arm("a" + id + "_" + idx); BL.audio.sfx(e.to === 1 ? "buy" : "upgrade");
      var m = (e.to === 1 ? "Chantier lancé : " + a.name : a.name + " · bâtiment " + (idx + 1) + " : chantier vers le niveau " + e.to) + (e.at === null ? " (en file d’attente)" : " · " + SY.dur(e.dur)) + ".";
      U.toast(m, "ok"); if (e.dur >= 60) E.addLog(state, m); doSave(false); return true;
    },
    buyBuilding: function (id) {
      if (locked("b" + id)) return false; var a = E.find(BL.data.activities, id), ck = BL.works.canBuilding(state, id);
      if (!ck.ok) { BL.audio.sfx("error"); if (ck.why === "full") U.toast("File de chantiers pleine : attends qu’un ouvrier se libère.", "warn"); return false; }
      var e = BL.works.orderBuilding(state, id); if (!e) { BL.audio.sfx("error"); return false; } arm("b" + id); BL.audio.sfx("buy");
      var m = "Chantier lancé : nouveau bâtiment " + a.name + " (" + (e.i + 1) + " / " + BL.mapData.LOTS.perActivity + ", −" + U.money(ck.cost) + ", " + (e.at === null ? "en file d’attente" : SY.dur(e.dur)) + ")."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    /* Partie 17 · E : mini-jeux (récompenses bornées, appliquées et enregistrées ici) */
    miniHeistLock: function (score) { var r = BL.minigames.applyHeistLock(state, score); if (!r) return null; E.addLog(state, "Crochetage : serrure travaillée (+" + Math.round(r.b * 100) + " points sur l’exécution et la fuite, chaleur −" + r.h + " par étape)."); doSave(true); return r; },
    miniPrep: function (opId, kind, score) { var r = BL.minigames.applyPrep(state, opId, kind, score); if (!r) return null; E.addLog(state, (kind === "plan" ? "Plan du coup" : "Crochetage") + " préparé pour « " + BL.equip.op(opId).name + " » : +" + Math.round(r.b * 100) + " points de chance, chaleur " + (r.h > 0 ? "+" + r.h : r.h < 0 ? "−" + (-r.h) : "0") + "."); doSave(true); return r; },
    miniInterro: function (who, score) { var r = BL.minigames.applyInterro(state, who, score); if (!r) return null; E.addLog(state, "Interrogatoire (" + BL.minigames.IN[who].name + ") : score " + Math.round(score * 100) + " %."); doSave(true); return r; },
    miniCompta: function (mode, score) { var r = BL.minigames.applyCompta(state, mode, score); if (!r) return null; E.addLog(state, "Comptes avec Gino : " + (r.mode === "heat" ? "chaleur " + Math.round(r.heat) : "revenus ×" + String(Math.round(r.mult * 1000) / 1000).replace(".", ",") + " pendant 10 min") + "."); doSave(true); return r; },
    worksBribe: function (id, i) {
      if (locked("wb" + id + i)) return null; var r = BL.works.bribe(state, id, i); if (!r) { BL.audio.sfx("error"); return null; } arm("wb" + id + i); BL.audio.sfx("buy");
      var m = "Pot-de-vin versé (−" + U.money(r.cost) + ") : le chantier gagne " + SY.dur(r.cut) + "."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return r;
    },
    worksForeman: function (id, i, score) {
      var r = BL.works.foreman(state, id, i, score); if (!r) return null; BL.audio.sfx("success");
      var m = "Contremaître : −" + Math.round(r.pct * 100) + " % sur le chantier (" + SY.dur(r.cut) + " gagnées)."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return r;
    },
    casinoSaved: function () { doSave(true); },
    heatBribe: function () { var r = BL.heat.bribe(state); if (!r) return false; E.addLog(state, "Un inspecteur a perdu un dossier (−" + U.money(r.cost) + ") : chaleur " + Math.round(r.v) + "."); doSave(true); return true; },
    heatLay: function () { var r = BL.heat.lay(state); if (!r) return false; E.addLog(state, "Profil bas : chaleur " + Math.round(r.v) + ". Revenus −" + Math.round(r.pct * 100) + " % pendant " + Math.round(r.low / 60) + " min."); doSave(true); return true; },
    heatDefend: function () { var r = BL.heat.defend(state); if (!r) return false; E.addLog(state, "Le quartier se prépare à la descente (−" + U.money(r.cost) + ") : amende réduite de moitié, aucune fermeture, saisie ni arrestation."); doSave(true); return true; },
    heatRansom: function (id) { var r = BL.heat.ransom(state, id); if (!r) return false; E.addLog(state, "Rançon versée (−" + U.money(r.cost) + ") : ton équipier est libéré."); doSave(true); return true; },
    heatRedeem: function (i) { var r = BL.heat.redeem(state, i); if (!r) return false; E.addLog(state, "Objet racheté aux scellés (−" + U.money(r.cost) + ")."); doSave(true); return true; },
    metaPrestige: function (clanId, hard) {
      var r = BL.meta.prestige(state, clanId, hard, Date.now()); if (!r) { BL.audio.sfx("error"); return null; }
      E.addLog(state, "Nouvelle partie+ : prestige " + r.pr + ", clan « " + BL.data.meta.clans[clanId].name + " »" + (hard ? ", mode difficile" : "") + "."); resetting = true; S.save(state, settings, true); setTimeout(function () { location.reload(); }, 60); return r;
    },
    metaHard: function (on) { var ok = BL.meta.setHard(state, on); if (ok) doSave(true); return ok; },
    cevServe: function (opt) { if (locked("cv")) return null; var r = BL.casinoEv.serve(state, opt); if (!r) { BL.audio.sfx("error"); return null; } arm("cv"); BL.audio.sfx(r.gain ? "success" : "click"); doSave(true); return r; },
    cevJoin: function () { if (locked("cj")) return null; var r = BL.casinoEv.join(state); if (!r) { BL.audio.sfx("error"); return null; } arm("cj"); BL.audio.sfx("click"); doSave(true); return r; },
    cevClaim: function () { if (locked("cc")) return null; var r = BL.casinoEv.claim(state); if (!r) { BL.audio.sfx("error"); return null; } arm("cc"); BL.audio.sfx(r.prize ? "success" : "click"); doSave(true); return r; },
    cevWash: function () { if (locked("cw")) return null; var r = BL.casinoEv.wash(state); if (!r) { BL.audio.sfx("error"); return null; } arm("cw"); BL.audio.sfx("success"); doSave(true); return r; },
    heistStart: function () { if (locked("hs")) return null; var r = BL.heist.start(state, "aurelle"); if (!r) { BL.audio.sfx("error"); return null; } arm("hs"); BL.audio.sfx("click"); E.addLog(state, "Braquage : « " + BL.heist.def(r.id).title + " » est lancé."); doSave(true); return r; },
    heistChoose: function (id) { if (locked("hc")) return null; var r = BL.heist.choose(state, id); if (!r) { BL.audio.sfx("error"); return null; } arm("hc"); BL.audio.sfx(r.ok ? "success" : "error"); U.toast(r.step.title + " : " + (r.ok ? "réussi" : "raté"), r.ok ? "good" : "warn"); if (r.last) U.toast("Braquage terminé : " + state.heist.last.k + " étape" + (state.heist.last.k > 1 ? "s" : "") + " sur " + state.heist.last.n + ", butin " + U.money(state.heist.last.money) + ".", "good"); doSave(true); return r; },
    heistAbandon: function () { if (locked("ha")) return null; var ok = BL.heist.abandon(state); if (!ok) return false; arm("ha"); doSave(true); return true; },
    metaClaim: function (kind, i) { if (locked("mc" + kind + i)) return null; var r = BL.meta.claim(state, kind, i); if (!r) { BL.audio.sfx("error"); return null; } arm("mc" + kind + i); BL.audio.sfx("success"); E.addLog(state, "Défi réclamé : +" + r.gold + " lingot" + (r.gold > 1 ? "s" : "") + "."); doSave(true); return r; },
    bondGift: function (id) { if (locked("bg" + id)) return null; var r = BL.bonds.gift(state, id); if (!r) { BL.audio.sfx("error"); return null; } arm("bg" + id); E.addLog(state, "Prime versée (−" + U.money(r.cost) + ") : loyauté +" + r.gain + "."); doSave(true); return r; },
    bondMission: function (id, opt) { if (locked("bm" + id)) return null; var r = BL.bonds.mission(state, id, opt); if (!r) { BL.audio.sfx("error"); return null; } arm("bm" + id); doSave(true); return r; },
    bondRecall: function (id) { if (locked("br" + id)) return null; var r = BL.bonds.recall(state, id); if (!r) { BL.audio.sfx("error"); return null; } arm("br" + id); E.addLog(state, BL.crew.get(id).name + " est de retour (−" + U.money(r.cost) + ")."); doSave(true); return r; },
    rivalCounter: function (fid) {
      if (locked("rc")) return null; var r = BL.rivals.counter(state, fid, Math.random); if (!r) { BL.audio.sfx("error"); return null; } arm("rc");
      var f = BL.data.territory.factions.filter(function (x) { return x.id === fid; })[0], m = r.ok ? "Contre-attaque réussie contre " + f.name + " (−" + U.money(r.cost) + ", chance " + Math.round(r.chance * 100) + " %) : leur pression retombe à 0." : "Contre-attaque ratée contre " + f.name + " (−" + U.money(r.cost) + ", chance " + Math.round(r.chance * 100) + " %) : leur pression monte de 10.";
      E.addLog(state, m); U.toast(m, r.ok ? "ok" : "evt"); doSave(true); return r;
    },
    warStart: function (did) { if (locked("ws")) return null; var r = BL.war.start(state, did); if (!r) { BL.audio.sfx("error"); return null; } arm("ws"); E.addLog(state, "Guerre de gangs lancée contre " + BL.war.bossOf(did).name + " (mise " + U.money(r.stake) + ")."); doSave(true); return r; },
    warPick: function (tac) { if (locked("wp")) return null; var r = BL.war.pick(state, tac); if (!r) return null; arm("wp"); if (r.end) { var m = r.end.victory ? "Guerre gagnée ! +" + U.money(r.end.money) + " et un trophée." : "Guerre perdue : la mise est perdue."; U.toast(m, r.end.victory ? "ok" : "evt"); } doSave(true); return r; },
    warAbandon: function () { var r = BL.war.abandon(state); doSave(true); return r; },
    calmRival: function (fid) {
      var r = BL.rivals.calm(state, fid); if (!r) return false;
      var f = BL.data.territory.factions.filter(function (x) { return x.id === fid; })[0];
      E.addLog(state, "Tu calmes le jeu avec " + f.name + " (−" + U.money(r.cost) + ")."); U.toast("Tension apaisée avec " + f.name + ".", "ok"); doSave(true); return true;
    },
    buildDistrict: function (did, id, idx) {
      var d = T.dist(did), t = BL.dbuild && BL.dbuild.find(id); if (!d || !t || locked("db" + did + id)) return false;
      var c = BL.dbuild.cost(state, did, id); if (!BL.dbuild.build(state, did, id, idx)) { BL.audio.sfx("error"); return false; } arm("db" + did + id); BL.audio.sfx("buy");
      var m = "Construit : " + t.name + " à " + d.name + " (−" + U.money(c) + ")."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    razeDecor: function (did, cell) {                    /* Partie 15 : démolir un parc ou une place pour libérer un terrain */
      var d = T.dist(did); if (!d || locked("rz" + did + cell)) return false; var c = BL.dbuild.razeCost(state);
      if (!BL.dbuild.raze(state, did, cell)) { BL.audio.sfx("error"); return false; } arm("rz" + did + cell); BL.audio.sfx("buy");
      var m = "Démoli à " + d.name + " (−" + U.money(c) + ") : un terrain constructible est libéré."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    /* boutique */
    shopBuy: function (id) {
      var c = BL.shop.find(id); if (!c || locked("s" + id)) return false; if (!BL.shop.buy(state, id)) { BL.audio.sfx("error"); return false; } arm("s" + id); BL.audio.sfx("buy");
      var m = "Acheté : " + c.name + " (−" + c.cost + " lingot" + (c.cost > 1 ? "s" : "") + ")."; E.addLog(state, m); U.toast(m, "ok"); BL.shop.equip(state, id); doSave(false); return true;
    },
    shopEquip: function (id) { if (!BL.shop.equip(state, id)) { BL.audio.sfx("error"); return false; } BL.audio.sfx("success"); doSave(false); return true; },
    shopUnequip: function (slot) { if (!BL.shop.unequip(state, slot)) return false; BL.audio.sfx("click"); doSave(false); return true; },
    shopBoost: function (id) {
      var b = BL.shop.boost(id); if (!b || locked("sb")) return false; if (!BL.shop.activate(state, id)) { BL.audio.sfx("error"); return false; } arm("sb"); BL.audio.sfx("boost");
      var m = "Boost activé : ×" + String(b.mult).replace(".", ",") + " pendant " + Math.round(b.dur / 60) + " min (−" + b.cost + " lingots)."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    /* boxs : le tirage est fait et ENREGISTRÉ ici, avant toute animation */
    boxOpen: function (id, n) {
      var bx = BL.boxes.box(id); if (!bx || locked("bx")) return null; var r = BL.boxes.open(state, id, +n, Math.random);
      if (!r) { BL.audio.sfx("error"); U.toast("Pas assez de lingots pour cette ouverture.", "warn"); return null; } arm("bx");
      E.addLog(state, bx.name + " ×" + r.n + " ouverte (−" + bx.cost * r.n + " lingot" + (bx.cost * r.n > 1 ? "s" : "") + ")."); doSave(false); return r;
    },
    /* fonds de ville : achat en lingots, purement décoratif */
    wallBuy: function (id) {
      var w = BL.walls.find(id); if (!w || locked("w" + id)) return false; if (!BL.walls.buy(state, id)) { BL.audio.sfx("error"); return false; } arm("w" + id); BL.audio.sfx("buy");
      var m = "Acheté : fond de ville « " + w.name + " » (−" + w.cost + " lingots)."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    wallEquip: function (id) { if (!BL.walls.equip(state, id)) { BL.audio.sfx("error"); return false; } BL.audio.sfx("success"); doSave(false); return true; },
    wallUnequip: function () { if (!BL.walls.unequip(state)) return false; BL.audio.sfx("click"); doSave(false); return true; },
    /* QG : pièce isométrique */
    hqBuy: function (id) {
      var d = BL.hq.dec(id); if (!d || locked("hq" + id)) return false; if (!BL.hq.buy(state, id)) { BL.audio.sfx("error"); return false; } arm("hq" + id); BL.audio.sfx("buy");
      var m = "Acheté pour le QG : " + d.name + " (−" + d.cost + " lingot" + (d.cost > 1 ? "s" : "") + ")."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    hqPlace: function (id, x, y, r) { var u = BL.hq.place(state, id, x, y, r); if (!u) { BL.audio.sfx("error"); return 0; } BL.audio.sfx("place"); doSave(false); return u; },
    hqMove: function (u, x, y) { if (!BL.hq.move(state, u, x, y)) { BL.audio.sfx("error"); return false; } BL.audio.sfx("place"); doSave(false); return true; },
    hqRotate: function (u) { if (!BL.hq.rotate(state, u)) { BL.audio.sfx("error"); return false; } BL.audio.sfx("place"); doSave(false); return true; },
    hqRemove: function (u) { if (!BL.hq.remove(state, u)) return false; BL.audio.sfx("click"); U.toast("Objet rangé dans l’inventaire.", "ok"); doSave(false); return true; },
    hqUpgrade: function (k) {
      var c = BL.hq.upgradeCost(state, k); if (locked("hu" + k)) return false; if (!BL.hq.upgrade(state, k)) { BL.audio.sfx("error"); return false; } arm("hu" + k); BL.audio.sfx("success");
      var m = BL.hq.UPG[k].name + " : " + BL.hq.UPG[k].names[state.hq[k]] + " (−" + c + " lingots)."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    hqStyle: function (id, buy) {
      var x = BL.hq.styleInfo(id); if (!x || locked("hs" + id)) return false; var ok = buy ? BL.hq.styleBuy(state, id) : BL.hq.styleSet(state, id); if (!ok) { BL.audio.sfx("error"); return false; } arm("hs" + id); BL.audio.sfx(buy ? "success" : "click");
      var m = "Style du QG : " + x.name + (buy ? " (−" + x.cost + " lingots)." : "."); if (buy) E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    sagaChoose: function (chId, dId, oId) {
      if (locked("sg" + chId + dId)) return null; var r = BL.saga.choose(state, chId, dId, oId); if (!r) { BL.audio.sfx("error"); return null; } arm("sg" + chId + dId); BL.audio.sfx(r.ending ? "success" : "claim");
      if (r.ending) { var m = "Histoire · fin : « " + r.ending.title + " »."; E.addLog(state, m); U.toast(m, "ok"); } doSave(false); return r;
    },
    hqBase: function () { state.hq.baseOff = state.hq.baseOff ? 0 : 1; BL.audio.sfx("click"); doSave(false); return !state.hq.baseOff; },   /* Partie 15 : afficher / masquer le décor de base */
    hqClear: function (after) {
      SY.modal({ title: "Tout remettre à zéro ?", text: "Tous les objets posés dans ton QG retournent dans ton inventaire. Rien n’est perdu ni remboursé, et les améliorations de la pièce sont conservées.", ok: "Tout ranger", danger: true, onOk: function () { var n = BL.hq.clear(state); BL.audio.sfx("click"); U.toast(n + " objet" + (n > 1 ? "s rangés" : " rangé") + " dans l’inventaire.", "ok"); doSave(false); if (after) after(); } });
    },
    buyUpgrade: function (id) {
      if (locked("u" + id)) return false;
      var ok = E.buyUpgrade(state, id);
      if (ok) { arm("u" + id); BL.audio.sfx("buy"); var n = E.find(BL.data.upgrades, id).name; E.addLog(state, "Amélioration acquise : " + n + "."); U.toast("Amélioration acquise : " + n + ".", "ok"); }
      return ok;
    },
    claim: function (id) {
      if (locked("m" + id)) return false;
      var r = E.claim(state, id); if (!r) return false; arm("m" + id); BL.audio.sfx("success");
      var m = "Mission accomplie : " + r.mission.name + (r.amount ? " (+" + U.money(r.amount) + ")" : "") + "."; E.addLog(state, m); U.toast(m, "ok"); return true;
    },
    choose: function (i) {
      if (locked("ev")) return; var r = E.resolve(state, i, Math.random); if (!r) return; arm("ev");
      var a = r.amount ? " (" + (r.amount > 0 ? "+" : "−") + U.money(Math.abs(r.amount)) + ")" : "", ft = function (x) { return E.fText(x, r.faction, r.crew); }, title = ft(r.event.title);
      var fx = E.parts(state, r.out, U.money, r.amount).map(ft), m = title + " : " + ft(r.choice.label) + (r.won === null ? "" : r.won ? " — réussi" : " — raté") + a + ".";
      E.addLog(state, m); BL.audio.sfx(r.won === false ? "error" : "success");
      var who = r.who && C.get(r.who), nd = r.choice.need && who ? BL.data.crew.roles[r.choice.need.role].name + " de ton équipe : cette option n’existait que grâce à ce profil." : "";
      BL.evResult.show({ title: title, choice: ft(r.choice.label), who: who ? { name: who.name, look: who.look, id: who.id } : null, why: nd,
        outcome: r.won === null ? null : { label: (r.won ? "Réussi" : "Raté") + " — " + Math.round(r.chance * 100) + " % de chances, tirage fait à l’instant", cls: r.won ? "win" : "lose" },
        effects: fx, note: r.amount < 0 && r.out.sec && -r.amount < -r.out.sec * Math.max(E.incomeBase(state), 1) - 1 ? "Perte limitée par ton argent disponible et la protection de ton influence." : "" });
      doSave(true);
    },
    take: function (id, mode) {
      var d = T.dist(id); if (!d || locked("t" + id)) return false;
      var r = T.take(state, id, mode, Math.random); if (!r) return false; arm("t" + id); BL.audio.sfx(r.success ? "success" : "error");
      var m = r.success ? "Quartier conquis : " + d.name + (mode === "force" ? " (imposé, −" : " (négocié, −") + U.money(r.cost) + ")." : "Échec : " + d.name + " résiste, " + T.faction(d.holder).name + " se renforce (−" + U.money(r.cost) + ").";
      E.addLog(state, m); U.toast(m, r.success ? "ok" : "evt"); return r.success;
    },
    invest: function (id) {
      var d = T.dist(id); if (!d || locked("i" + id)) return false; var ok = T.invest(state, id); if (!ok) return false; arm("i" + id);
      var m = "Influence renforcée : " + d.name + " (contrôle " + T.lv(state, id) + " / " + BL.data.territory.params.maxControl + ")."; E.addLog(state, m); U.toast(m, "ok"); return true;
    },
    imp: function (id, slot) {
      var d = T.dist(id); if (!d || locked("p" + id + slot)) return false; var ok = T.buyImp(state, id, slot); if (!ok) return false; arm("p" + id + slot);
      var m = "Amélioration de quartier : " + d.imps[slot === "boost" ? 0 : 1] + " (" + d.name + ")."; E.addLog(state, m); U.toast(m, "ok"); return true;
    },
    eqBuy: function (id) {
      var it = BL.equip.item(id); if (!it || locked("eb" + id)) return false; if (!BL.equip.buy(state, id)) { BL.audio.sfx("error"); return false; } arm("eb" + id); BL.audio.sfx("buy");
      var m = it.name + " rejoint ton arsenal."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    eqMove: function (i, mid, slot) {
      if (locked("em")) return { ok: false, reason: "action en cours" }; var Q = BL.equip, x = Q.st(state).inv[+i], it = x && Q.item(x.id), r = Q.moveTo(state, +i, mid, slot || undefined);
      if (!r.ok) { BL.audio.sfx("error"); U.toast("Impossible : " + r.reason + ".", "warn"); return r; }
      arm("em"); BL.audio.sfx("success"); E.addLog(state, it.name + " équipé sur " + (C.get(mid) ? C.get(mid).name : "?") + "."); doSave(true); return r;
    },
    eqEquip: function (i, mid) {
      if (locked("ee")) return false; if (!BL.equip.equip(state, +i, mid)) { BL.audio.sfx("error"); U.toast("Impossible d’équiper cet objet (équipier en mission ?).", "warn"); return false; } arm("ee"); BL.audio.sfx("success"); U.toast("Objet équipé.", "ok"); doSave(false); return true;
    },
    eqUnequip: function (i) { if (locked("eu")) return false; if (!BL.equip.unequip(state, +i)) { BL.audio.sfx("error"); return false; } arm("eu"); BL.audio.sfx("click"); doSave(true); return true; },
    eqSell: function (i) {
      if (locked("es")) return false; var x = BL.equip.st(state).inv[+i], it = x && BL.equip.item(x.id), v = BL.equip.sell(state, +i); if (v === false) { BL.audio.sfx("error"); return false; } arm("es"); BL.audio.sfx("buy");
      var m = it.name + " vendu pour " + U.money(v) + "."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    eqRepair: function (i) { if (locked("er")) return false; if (!BL.equip.repair(state, +i)) { BL.audio.sfx("error"); return false; } arm("er"); BL.audio.sfx("success"); U.toast("Objet réparé.", "ok"); doSave(false); return true; },
    eqRepairAll: function () { if (locked("era")) return false; var c = BL.equip.repairAll(state); if (!c) { BL.audio.sfx("error"); return false; } arm("era"); BL.audio.sfx("success"); U.toast("Tout le matériel est réparé (" + U.money(c) + ").", "ok"); doSave(false); return true; },
    eqExpand: function () { if (locked("ex")) return false; if (!BL.equip.expand(state)) { BL.audio.sfx("error"); return false; } arm("ex"); BL.audio.sfx("buy"); var m = "L’arsenal est agrandi : " + BL.equip.capacity(state) + " places."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true; },
    finBuy: function (id) { if (locked("fb")) return false; var f = BL.equip.fin(id); if (!BL.equip.finBuy(state, id)) { BL.audio.sfx("error"); U.toast("Finition indisponible (lingots insuffisants ou déjà possédée).", "warn"); return false; } arm("fb"); BL.audio.sfx("buy"); var m = "Finition « " + f.name + " » obtenue et appliquée à l’Arsenal."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true; },
    finSet: function (id) { if (!BL.equip.finSet(state, id)) return false; BL.audio.sfx("click"); doSave(false); return true; },
    opStart: function (id, ids) {
      if (locked("os")) return false; if (!BL.equip.start(state, id, ids)) { BL.audio.sfx("error"); U.toast("Opération impossible pour le moment.", "warn"); return false; } arm("os"); BL.audio.sfx("success");
      var o = BL.equip.op(id), m = "Opération lancée : " + o.name + "."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    opCancel: function () { if (!BL.equip.cancel(state)) return false; BL.audio.sfx("click"); U.toast("Opération annulée : l’équipe est revenue, rien n’est perdu.", "ok"); doSave(false); return true; },
    opClaim: function () {
      if (locked("oc")) return null; var r = BL.equip.resolve(state, Math.random); if (!r) return null; arm("oc"); var o = BL.equip.op(r.op), D = BL.data.equip, rare = false;
      r.loot.forEach(function (id) { if (BL.equip.item(id).rar >= 2) rare = true; });
      BL.audio.sfx(r.ok ? (rare ? "loot" : "success") : "error"); var m = o.name + " : " + (r.crit ? "réussite éclatante" : r.ok ? "réussite" : r.near ? "échec de justesse" : "échec") + (r.money ? ", +" + U.money(r.money) : "") + "."; E.addLog(state, m);
      if (rare && BL.notify) { var best = BL.equip.item(r.loot.filter(function (id) { return BL.equip.item(id).rar >= 2; })[0]); BL.notify.push({ type: "loot", key: "loot:" + r.at, once: "loot:" + r.at, title: "Butin rare : " + best.name, text: D.RAR[best.rar][0].toUpperCase() + D.RAR[best.rar].slice(1) + " : ajouté à ton arsenal.", target: { view: "arsenal" } }); }
      doSave(false); return r;
    },
    recruit: function (id) {
      var m = C.get(id); if (!m || locked("r" + id)) return false; var r = C.recruit(state, id); if (!r) return false; arm("r" + id); BL.audio.sfx("buy");
      var msg = m.name + " rejoint ton équipe" + (r.active ? "." : " (en réserve, aucune place libre)."); E.addLog(state, msg); U.toast(msg, "ok"); doSave(false); return true;
    },
    toggle: function (id) {
      var m = C.get(id); if (!m || locked("g" + id)) return false; var on = !C.isActive(state, id); if (!C.setActive(state, id, on)) return false; arm("g" + id);
      U.toast(m.name + (on ? " est affecté à l’équipe." : " passe en réserve."), "ok"); doSave(false); return true;
    },
    levelUp: function (id) {
      var m = C.get(id); if (!m || locked("l" + id)) return false; if (!C.levelUp(state, id)) return false; arm("l" + id);
      var msg = m.name + " passe au niveau " + C.lvl(state, id) + "."; E.addLog(state, msg); U.toast(msg, "ok"); doSave(false); return true;
    },
    dip: function (fid, action) {
      if (locked("d" + fid + action)) return false; var r = F.act(state, fid, action, Math.random); if (!r) return false; arm("d" + fid + action);
      var n = r.faction.name, m = { gift: "Tribut remis à " + n + " (relation +" + Math.round(r.rel) + ").",
        truce: r.success ? "Trêve conclue avec " + n + " (5 min)." : "Trêve refusée par " + n + " (−" + U.money(r.cost) + ").",
        ally: r.success ? "Alliance scellée avec " + n + " : elle ne t’attaquera pas pendant un temps." : "Alliance refusée par " + n + " (−" + U.money(r.cost) + ").",
        press: r.success ? "Pression réussie : " + n + " perd de l’influence." : "Pression sans effet : " + n + " se renforce." }[action];
      E.addLog(state, m); U.toast(m, r.success ? "ok" : "evt"); return r.success;
    },
    convertGold: function (n) {
      if (locked("gold")) return false; var r = BL.gold.convert(state, n); if (!r) { BL.audio.sfx("error"); return false; } arm("gold"); BL.audio.sfx("gold");
      var m = r.n + " lingot" + (r.n > 1 ? "s" : "") + " d’or ajouté" + (r.n > 1 ? "s" : "") + " au coffre (−" + U.money(r.cost) + ")."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    upgradeVault: function () {
      if (locked("vault")) return false; var c = BL.gold.vaultCost(state); if (!BL.gold.upgradeVault(state)) { BL.audio.sfx("error"); return false; } arm("vault"); BL.audio.sfx("buy");
      var m = "Coffre agrandi : capacité " + BL.gold.capacity(state) + " lingots (−" + c + " lingots)."; E.addLog(state, m); U.toast(m, "ok"); doSave(false); return true;
    },
    defend: function () { return decide("defend"); },
    truce: function () { return decide("negotiate"); },
    save: function () { U.toast(doSave(false) ? "Progression sauvegardée." : "Sauvegarde impossible : voir l’alerte en haut de page.", "ok"); },
    setting: function (k, v) { if (k === "lbon" && v === true && !settings.lbname) { if (BL.menu && BL.menu.visible && BL.menu.visible()) BL.menu.openSheet("board"); else if (U.go) U.go("board"); SY.applySettings(settings); return; } settings[k] = v; var c = S.sanitizeSettings(settings); Object.keys(c).forEach(function (q) { settings[q] = c[q]; }); SY.applySettings(settings); doSave(false); },
    exportSave: exportNow,
    importSave: function (text) {
      var r = S.importText(text, Date.now()); if (!r.ok) { SY.msg(r.error); U.toast(r.error, "evt"); return; }
      SY.modal({ title: "Remplacer ta progression ?", text: "La sauvegarde du fichier va remplacer la progression actuelle de cet onglet. L’ancienne ne sera pas conservée : exporte-la d’abord si tu veux la garder.", ok: "Remplacer par le fichier", danger: true,
        extra: [{ label: "Exporter l’actuelle", fn: exportNow }], onOk: function () { if (S.save(r.state, r.settings, true)) { resetting = true; location.reload(); } else SY.msg("Écriture impossible : import annulé."); } });
    },
    reset: function () {
      SY.modal({ title: "Tout effacer ?", text: "Cette action est définitive. Ta progression sera supprimée de ce navigateur, y compris la copie de secours :", list: ["argent, activités et améliorations", "quartiers, équipe, factions et alliances", "missions, succès et paramètres"],
        word: "EFFACER", ok: "Effacer définitivement", danger: true, extra: [{ label: "Exporter d’abord", fn: exportNow }], onOk: function () { resetting = true; S.wipe(); location.reload(); } });
    }
  });

  var designSeen = {}, boostSeen = !!(state.boost && state.boost.until > state.t), vaultFull = null;
  var played = loaded.status !== "new";                    /* une sauvegarde existait au lancement */
  BL.audio.boot(); if (BL.ambience) BL.ambience.init(); SY.applySettings(settings);
  BL.menu.init({
    hasSave: function () { return played; }, state: function () { return state; }, settings: function () { return settings; },
    setting: function (k, v) { U.handlers.setting(k, v); }, hard: function (on) { return U.handlers.metaHard(on); }, play: function () { played = true; doSave(false); }, newGame: function () { U.handlers.reset(); }, save: function () { U.handlers.save(); }
  });
  document.getElementById("btnMenu").onclick = function () { doSave(false); BL.menu.show(); };
  document.getElementById("gearBtn").onclick = function () { BL.menu.openSheet("settings"); };
  var emp = document.querySelector(".bar .emp"); emp.setAttribute("role", "button"); emp.tabIndex = 0; emp.title = "Ouvrir le profil"; emp.style.cursor = "pointer";
  emp.onclick = function () { BL.menu.openSheet("profile"); }; emp.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); BL.menu.openSheet("profile"); } };
  BL.explainUI.init({ state: function () { return state; }, money: U.money });
  if (BL.worksUI) { BL.worksUI.init(U.handlers, U); BL.worksUI.update(state); }   /* Partie 17 · D */
  BL.results.init({ state: function () { return state; }, go: U.go, money: U.money, save: function () { doSave(false); } });
  BL.bus.on("ops", function () { BL.equipUI.render(); U.invalidate(); });
  BL.bus.on("hurt", function () { BL.equipUI.render(); });
  BL.bus.on("events", function () { U.invalidate(); });
  BL.bus.on("missions", function () { U.invalidate(); });
  BL.bus.on("boost", function () { U.invalidate(); BL.shopUI.render(); });
  BL.bus.on("gold", function () { BL.shopUI.render(); if (BL.boxesUI && BL.boxesUI.render) BL.boxesUI.render(); });
  BL.menu.show(); BL.notify.init({ go: U.go }); BL.notify.bindSeen(function () { return state.notifSeen; }); BL.profile.refresh(settings);
  BL.tutorial.init({ state: function () { return state; }, settings: function () { return settings; }, setting: function (k, v) { U.handlers.setting(k, v); }, go: U.go, money: U.money, toast: U.toast });   /* didacticiel : lit l'état, ne le modifie jamais */
  BL.assistantUI.init({ state: function () { return state; }, handlers: function () { return U.handlers; }, go: U.go, money: U.money }); BL.assistantUI.setMode(settings.assistant);   /* assistante : conseille, les boutons appellent les vraies actions */
  if (loaded.status === "new" && !settings.setup) BL.menu.openSheet("setup");
  if (loaded.status === "restored") SY.alert("restored", "La sauvegarde principale était illisible : la copie de secours a été restaurée. Tu peux avoir perdu quelques minutes de progression.", [{ label: "Compris", fn: function () { SY.clearAlert("restored"); } }]);
  else if (loaded.status === "corrupt") SY.alert("corrupt", "La sauvegarde était illisible : une nouvelle partie a été créée. L’ancien contenu est conservé dans le navigateur (clé .corrupt) en cas de besoin.", [{ label: "Compris", fn: function () { SY.clearAlert("corrupt"); } }]);
  else if (loaded.status === "newer") SY.alert("newer", "Cette sauvegarde vient d’une version plus récente du jeu : elle est lue au mieux, et une copie a été conservée.", [{ label: "Compris", fn: function () { SY.clearAlert("newer"); } }]);
  else if (!loaded.storage) SY.alert("nostore", "Ce navigateur bloque le stockage local : la progression ne sera pas conservée. Utilise Exporter pour la garder.", [{ label: "Exporter", fn: exportNow }]);
  doSave(false);                                          /* prise de main de cet onglet : un autre onglet ouvert passe en pause */
  applyAbsence(off, "Bon retour");
  /* C1 (Partie 12) : un redessin de liste entre l'appui et le relâchement supprime le bouton visé et le clic est perdu (« il faut cliquer deux fois »).
     Tant qu'un appui est en cours sur un contrôle (et 80 ms après, le temps que « click » parte), l'interface n'est pas reconstruite ; le redessin suit juste après. Plafond de sécurité : 1,5 s. */
  var press = { t: 0, rel: 0 };
  BL.press = { active: function () { var n = Date.now(); return (press.t > 0 && n - press.t < 1500) || n < press.rel; } };
  document.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button !== 0) return; var el = e.target; if (el && el.closest && el.closest("button,[data-a],[data-act],a,summary,label,input,select,[role=button],[role=tab]")) press.t = Date.now(); }, true);
  ["pointerup", "pointercancel", "click", "dragend"].forEach(function (ev) { document.addEventListener(ev, function () { if (press.t) { press.t = 0; press.rel = Date.now() + 80; } }, true); });
  /* garde anti-doublon : un double clic involontaire ne répète pas un achat d'objet, une vente ou une réparation (les améliorations de bâtiments, volontairement répétables, ne sont pas concernées) */
  var lastBuy = { k: "", t: 0 };
  document.addEventListener("click", function (e) { var b = e.target && e.target.closest && e.target.closest('[data-a="buy"],[data-a="finbuy"],[data-a="expand"],[data-a="repairall"],[data-a="repair"],[data-act="buy"],[data-act="equip"]'); if (!b) return;
    var k = (b.dataset.a || b.dataset.act) + ":" + (b.dataset.id || b.dataset.i || ""), n = Date.now(); if (e.detail > 1 && k === lastBuy.k && n - lastBuy.t < 450) { e.stopImmediatePropagation(); e.preventDefault(); return; } lastBuy = { k: k, t: n }; }, true);
  var uiFail = 0, uiAt = 0; ["click", "keydown", "change"].forEach(function (e) { document.addEventListener(e, function () { uiAt = 0; }, true); });   /* après une action du joueur : redessin au prochain tick (≤ 100 ms) */
  function step() {
    var t = Date.now(), gap = (t - last) / 1000, from = last; last = t;
    if (gap > B.sleepGapSec) { applyAbsence(E.offline(state, t, from), "Reprise après une pause"); gap = 0; }   /* veille, onglet gelé : comptée comme une absence */
    else if (gap < 0) gap = 0;                                                                                  /* horloge reculée : rien */
    var dt = gap;
    E.tick(state, dt);
    if (BL.works) worksDone(BL.works.advance(state, dt), false);
    E.checkAch(state).forEach(function (a) { var m = "Succès débloqué : " + a.name + " (+1 réputation)."; E.addLog(state, m); U.toast(m, "ok"); });
    var ev = E.updateEvents(state, Math.random); if (ev) { var et = E.fText(ev.title, state.pendingFac, state.pendingCrew); E.addLog(state, "Nouvel événement : " + et + "."); BL.notify.push({ type: "event", key: "evt", title: "Nouvel événement", text: et + ".", target: { view: "dash" }, mark: { type: "hq" } }); }
    T.step(state, Math.random).forEach(notice);
    if (BL.heat) { BL.heat.advance(state, dt, false); BL.heat.step(state).forEach(heatNotice); }
    if (BL.bonds) BL.bonds.advance(state, dt, false).forEach(bondNotice);
    if (BL.casinoEv) BL.casinoEv.step(state).forEach(function (e) { if (e.type === "vip") { var v = BL.data.casinoEv.vips.filter(function (q) { return q.id === e.id; })[0]; U.toast("Casino : " + (v ? v.name : "un client VIP") + " vient d’arriver (5 min).", "evt"); } else if (e.type === "tourend") U.toast("Casino : le tournoi est terminé, récupère ton prix.", "evt"); });
    if (Date.now() - remindChk > 60000) { remindChk = Date.now(); exportRemind(); }
    if (BL.meta) { if (state.t - metaScanT >= BL.data.meta.params.collScan) { metaScanT = state.t; BL.meta.scan(state); } if (Date.now() - metaDayAt > 30000) { metaDayAt = Date.now(); if (BL.meta.ensure(state, new Date())) doSave(false); } }
    if (BL.rivals) { BL.rivals.advance(state, dt, false); BL.rivals.step(state, Math.random).forEach(notice); }
    F.step(state).forEach(function (n) { var m = "L’alliance avec " + n.faction.name + " prend fin."; E.addLog(state, m); U.toast(m, "evt"); });
    if (t - lastSave >= 10000) { lastSave = t; doSave(false); }
    BL.data.activities.forEach(function (a) {                  /* nouveau design d'un bâtiment : message + son (un par bâtiment) */
      E.levels(state, a.id).forEach(function (L, i) {
        var k = a.id + "#" + i, dt = E.designTier(L), prev = designSeen[k];
        if (prev !== undefined && dt > prev) { var chs = BL.story ? BL.story.reach(state, dt) : [], chN = chs.length ? chs[chs.length - 1] : null; chs.forEach(function (c) { E.addLog(state, "Chapitre « " + c.title + " » — " + BL.story.text(c)); }); var m = a.name + " · bâtiment " + (i + 1) + " : nouveau design « " + E.DESIGN_NAMES[dt] + " » (niveau " + L + ")."; E.addLog(state, m); BL.notify.push({ type: "design", key: "dsg" + k, once: "dsg:" + k + "@" + dt, art: BL.buildArt ? BL.buildArt.svg(a.id, dt) : "", title: chN ? "Chapitre : " + chN.title : a.name + " : design « " + E.DESIGN_NAMES[dt] + " »", text: chN ? a.name + " (« " + E.DESIGN_NAMES[dt] + " ») — " + BL.story.name(chN) + " : « " + chN.react + " »" : "Bâtiment " + (i + 1) + ", niveau " + L + " : il change d’allure.", target: { type: "lot", act: a.id, id: k }, mark: { type: "lot", act: a.id, id: k } }); }
        designSeen[k] = dt;
      });
    });
    var bo = !!(state.boost && state.boost.until > state.t);               /* boost terminé (y compris pendant une absence) */
    if (boostSeen && !bo) BL.notify.push({ type: "expire", key: "bexp", title: "Boost terminé", text: "Ton boost de revenus est fini. Tu peux en activer un autre dans la Boutique.", target: { view: "shop" }, mark: { type: "hq" } }); boostSeen = bo;
    var full = state.gold >= BL.gold.capacity(state);
    if (vaultFull === false && full) BL.notify.push({ type: "vault", key: "vault", title: "Coffre plein", text: "Ton coffre contient " + state.gold + " lingots : agrandis-le pour en stocker plus.", target: { view: "hq" }, mark: { type: "hq" } }); vaultFull = full;
    finishOps();
    BL.watch.scan(state).forEach(function (d) { BL.bus.emit(d, state); });
    if (BL.saga && !(BL.notify.current && BL.notify.current())) { var pc_ = BL.saga.pending(state); if (pc_ && !sagaDue) { sagaDue = Date.now() + 2500; pc_ = null; } else if (pc_ && Date.now() < sagaDue) pc_ = null; else if (!pc_) sagaDue = 0;   /* l'annonce d'un chapitre attend qu'aucune autre bannière (promotion, alerte) ne soit à l'écran */ if (pc_) { BL.saga.markSeen(state, pc_.id); BL.notify.push({ type: "saga", key: "saga-" + pc_.id, title: "Histoire : " + pc_.title, text: "Un nouveau chapitre de ta trame est ouvert.", target: { saga: 1 }, mark: null }); } }
    if (!BL.press.active() && (t - uiAt >= 200 || gap > 5 || (U.dirty && U.dirty()))) { uiAt = t; [function () { U.update(state); }, function () { if (BL.worksUI) BL.worksUI.update(state); }, function () { BL.results.tick(state); }, function () { BL.audio.setIntensity(E.level(state) / B.maxEmpireLevel); }, function () { BL.assistantUI.tick(state); }].forEach(function (f) { try { f(); } catch (e) { if (!uiFail) { uiFail = 1; try { console.error("[BLACKLINE] erreur d'interface (le jeu continue) :", e); } catch (x) {} } } }); }   /* C11 : l'économie avance toutes les 100 ms, mais l'interface ne se redessine que 5 fois par seconde */
  }
  /* Opération terminée : résolue ici, une seule fois, et sauvegardée tout de suite (un rechargement ne la rejoue pas). */
  function finishOps() {
    var r = BL.equip.autoResolve(state, Math.random); if (!r) return; var o = BL.equip.op(r.op);
    E.addLog(state, o.name + " : " + (r.crit ? "réussite éclatante" : r.ok ? "réussite" : r.near ? "échec de justesse" : "échec") + (r.money ? ", +" + U.money(r.money) : "") + "."); doSave(false);
  }
  BL.main = { state: function () { return state; }, settings: function () { return settings; }, setSetting: function (k, v) { U.handlers.setting(k, v); } };     /* lecture seule pour les tests et le diagnostic */
  setInterval(step, 100);
  document.addEventListener("visibilitychange", function () { if (document.hidden) doSave(false); else step(); });   /* retour sur l'onglet : rattrapage immédiat, pas d'attente du prochain tick */
  window.addEventListener("beforeunload", function () { doSave(false); });
  window.addEventListener("storage", function (e) { S.onStorage(e); if (S.status().frozen) doSave(false); });
})();
