/* Interface "système" : fenêtre de confirmation, bandeau d'alerte, bilan de retour, paramètres, export / import. */
(function (root) {
  var BL = root.BL = root.BL || {}, u, h, mActive = null, lastFocus = null;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ""; if (html) e.innerHTML = html; return e; }
  function dur(sec) { sec = Math.max(0, Math.floor(sec)); var d = Math.floor(sec / 86400), a = Math.floor(sec % 86400 / 3600), b = Math.floor(sec % 3600 / 60);
    return d ? d + " j " + a + " h" : a ? a + " h " + (b < 10 ? "0" : "") + b + " min" : b ? b + " min " + (sec % 60) + " s" : sec + " s"; }

  /* ---------- Fenêtre de confirmation ----------
     opts : { title, text, list[], word (à saisir pour valider), ok (libellé), danger, extra:[{label, fn}], onOk } */
  function modal(o) {
    closeModal(); lastFocus = document.activeElement;
    var m = $("modal"), box = $("mBox"); box.innerHTML = "";
    box.appendChild(el("h2", "mt", "")).textContent = o.title; box.firstChild.id = "mTitle";
    var p = el("p", "mp"); p.textContent = o.text; box.appendChild(p);
    if (o.list) { var ul = el("ul", "ml"); o.list.forEach(function (x) { var li = document.createElement("li"); li.textContent = x; ul.appendChild(li); }); box.appendChild(ul); }
    var inp = null;
    if (o.word) { var lab = el("label", "mw"); lab.appendChild(document.createTextNode("Pour confirmer, tape ")); var b = document.createElement("b"); b.textContent = o.word; lab.appendChild(b);
      inp = document.createElement("input"); inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false; inp.setAttribute("aria-label", "Mot de confirmation"); lab.appendChild(inp); box.appendChild(lab); }
    var row = el("div", "mrow"), ok = el("button", "btn " + (o.danger ? "danger" : "")); ok.textContent = o.ok || "Confirmer";
    var cancel = el("button", "btn ghost"); cancel.textContent = "Annuler";
    (o.extra || []).forEach(function (x) { var b2 = el("button", "btn ghost"); b2.textContent = x.label; b2.onclick = function () { x.fn(); }; row.appendChild(b2); });
    row.appendChild(cancel); row.appendChild(ok); box.appendChild(row);
    function valid() { return !o.word || (inp.value || "").trim().toUpperCase() === o.word.toUpperCase(); }
    function sync() { ok.disabled = !valid(); }
    if (inp) { inp.oninput = sync; inp.onkeydown = function (e) { if (e.key === "Enter" && valid()) ok.click(); }; } sync();
    ok.onclick = function () { if (!valid()) return; closeModal(); o.onOk(); };
    cancel.onclick = closeModal; m.onclick = function (e) { if (e.target === m) closeModal(); };
    m.hidden = false; mActive = true; (inp || cancel).focus();
  }
  function closeModal() { var m = $("modal"); if (!m || m.hidden) return; m.hidden = true; mActive = null; try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {} }

  /* ---------- Bandeau d'alerte (problème persistant : sauvegarde en échec, autre onglet…) ---------- */
  var alertKey = "";
  function alertBar(key, text, acts) {
    if (alertKey === key) return; alertKey = key;
    $("alertText").textContent = text; var box = $("alertActs"); box.innerHTML = "";
    (acts || []).forEach(function (a) { var b = el("button", "btn"); b.textContent = a.label; b.onclick = a.fn; box.appendChild(b); });
    $("alert").hidden = false;
  }
  function clearAlert(key) { if (key && alertKey !== key) return; alertKey = ""; $("alert").hidden = true; }

  /* ---------- Bilan de retour ---------- */
  function bilan(r) {
    $("offlineTitle").textContent = r.title; var dl = $("offlineRows"), ul = $("offlineNotes"); dl.innerHTML = ""; ul.innerHTML = "";
    r.rows.forEach(function (x) { var d = el("div", "rw2"), a = document.createElement("dt"), b = document.createElement("dd"); a.textContent = x[0]; b.textContent = x[1]; if (x[2]) b.className = x[2]; d.appendChild(a); d.appendChild(b); dl.appendChild(d); });
    r.notes.forEach(function (x) { var li = document.createElement("li"); li.textContent = x; ul.appendChild(li); });
    ul.hidden = !r.notes.length; var ac = $("offlineActs"); if (ac) { ac.innerHTML = ""; (r.acts || []).slice(0, 3).forEach(function (a) { var b = el("button", "btn can oact", "<b></b><small></small>"); b.type = "button"; b.firstChild.textContent = a.label; b.setAttribute("aria-label", (a.btn ? a.btn + " : " : "") + a.label); b.lastChild.textContent = a.sub || ""; b.onclick = function () { $("offline").hidden = true; a.run(); }; ac.appendChild(b); }); ac.hidden = !ac.children.length; }
    $("offline").hidden = false;
  }

  /* ---------- Informations de sauvegarde ---------- */
  function saveInfo(text, bad) { var e = $("saveinfo"); if (e.textContent !== text) e.textContent = text; e.classList.toggle("bad", !!bad); }

  /* ---------- Paramètres ---------- */
  var cur = null;
  /* C11 (Partie 11) : onglet caché → toutes les animations CSS en pause (classe body.tabhidden, règle globale dans style.css) ; elles reprennent au retour. */
  (function () { var d = document; function tog() { if (d.body) d.body.classList.toggle("tabhidden", !!d.hidden); } d.addEventListener("visibilitychange", tog); tog(); })();
  /* C11 : régulateur global. Si l'écran de jeu tourne durablement sous ~22 images/s (intervalle lissé > 45 ms pendant ~3 s), les effets visuels sont allégés automatiquement
     (même effet que Réglages › Effets visuels › Réduits : classes autolow + lowfx : moins de particules, pas de secousse, pas de halos coûteux). Une seule fois par session ; le choix du joueur n'est pas modifié. */
  var PERF = { ema: 0, bad: 0, auto: false };
  (function () { var d = document, last = 0; function f(t) { requestAnimationFrame(f); if (d.hidden || !d.body || d.body.classList.contains("inmenu")) { last = 0; PERF.bad = 0; return; } if (!last) { last = t; return; } var dt = Math.min(250, t - last); last = t; PERF.ema = PERF.ema ? PERF.ema * 0.95 + dt * 0.05 : dt;
    if (PERF.ema > 45) { if (++PERF.bad > 180 && !PERF.auto) { PERF.auto = true; d.body.classList.add("autolow", "lowfx"); try { BL.ui && BL.ui.toast && BL.ui.toast("Appareil lent détecté : effets visuels allégés automatiquement (Réglages › Graphismes pour changer).", "ok"); } catch (e) {} } } else PERF.bad = Math.max(0, PERF.bad - 2); }
    if (window.requestAnimationFrame) requestAnimationFrame(f); })();
  function applySettings(s) {
    cur = s; var b = document.body; b.classList.toggle("nomotion", !s.motion); b.classList.toggle("large", !!s.large); b.classList.toggle("notoast", !s.toasts); b.classList.toggle("lowfx", s.fx === "low" || b.classList.contains("autolow")); b.classList.toggle("boxfast", s.boxspeed === "fast");
    BL.ui && BL.ui.setToasts && BL.ui.setToasts(s.toasts); BL.ui && BL.ui.setNumbers && BL.ui.setNumbers(s.numbers); BL.ui && BL.ui.setTips && BL.ui.setTips(s.tips); BL.audio && BL.audio.apply(s); BL.wallsUI && BL.wallsUI.setUse(s); BL.notify && BL.notify.setMode(s.notif); BL.assistantUI && BL.assistantUI.setMode(s.assistant); BL.profile && BL.profile.refresh && BL.profile.refresh(s);
    sync(document, s);
  }
  function sync(scope, s) {
    Array.prototype.forEach.call(scope.querySelectorAll("[data-set]"), function (c) {
      var k = c.dataset.set, v = s[k]; if (c.type === "checkbox") c.checked = !!v; else if (c.type === "range") { var n = Math.round(v * 100); if (+c.value !== n) c.value = n; var o = c.parentNode.querySelector("output"); if (o) o.textContent = n + " %"; } else if (c.tagName === "SELECT") c.value = v; else if (c.tagName === "INPUT") { if (document.activeElement !== c) c.value = v; }
      if (c.dataset.dep) c.disabled = !s[c.dataset.dep];
    });
  }
  /* Panneau de réglages en catégories (utilisé dans Statistiques, dans le menu principal et dans la fenêtre « Paramètres » en jeu). */
  function settingsPanel() {
    var root = el("div", "setp");
    function group(title, items) { var g = el("div", "sgrp", "<h3>" + title + "</h3>"); items.forEach(function (x) { g.appendChild(x); }); root.appendChild(g); }
    function sw(k, t, d, dep) { var l = el("label", "opt", '<span class="ot"><b>' + t + '</b><small>' + d + '</small></span><span class="sw"><input type="checkbox" data-set="' + k + '"' + (dep ? ' data-dep="' + dep + '"' : "") + '><i></i></span>'); l.querySelector("input").onchange = function (e) { h.setting(k, e.target.checked); }; return l; }
    function sl(k, t, d, dep) { var l = el("label", "opt sl", '<span class="ot"><b>' + t + '</b><small>' + d + '</small></span><span class="rg"><input type="range" min="0" max="100" step="1" data-set="' + k + '" data-dep="' + dep + '" aria-label="' + t + '"><output></output></span>'); l.querySelector("input").oninput = function (e) { h.setting(k, e.target.value / 100); }; return l; }
    function sel(k, t, d, opts) { var l = el("label", "opt", '<span class="ot"><b>' + t + '</b><small>' + d + '</small></span><select class="sel" data-set="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join("") + '</select>'); l.querySelector("select").onchange = function (e) { h.setting(k, e.target.value); }; return l; }
    var test = el("div", "opt", '<span class="ot"><b>Test sonore</b><small>Joue un effet pour vérifier le volume.</small></span>'), tb = el("button", "btn ghost"); tb.textContent = "Tester"; tb.dataset.nosfx = "1"; tb.onclick = function () { BL.audio && BL.audio.unlock(); BL.audio && BL.audio.sfx("buy"); }; test.appendChild(tb);
    group("Audio", [sw("sound", "Son", "Coupe toute la musique et tous les effets."), sl("music", "Volume de la musique", "Ambiance du menu et de la ville.", "sound"), sl("sfx", "Volume des effets", "Clics, achats, réussites.", "sound"), sw("ambient", "Ambiance de ville", "Bruits de fond de la ville (circulation, vent, pluie, sirènes lointaines) quand la radio est coupée.", "sound"), sel("ambmode", "Ambiance de la ville", "Ville vivante : klaxons, sirènes de police, d’ambulance et de pompiers, circulation. Calme : bruits de fond discrets. Aucune : pas d’ambiance (la musique reste).", [["live", "Ville vivante (klaxons, sirènes)"], ["calm", "Calme"], ["off", "Aucune"]]), sl("amb", "Volume de l’ambiance", "Se règle séparément de la musique.", "sound"), test]);
    group("Graphismes et animations", [sw("motion", "Animations", "Transitions, véhicules et passants. Désactive-les si elles te fatiguent."), sel("fx", "Effets visuels", "Réduit particules, halos et lumières pour les machines modestes.", [["full", "Complets"], ["low", "Réduits"]]), sel("opscene", "Scènes d’opérations", "Une courte scène animée raconte raids, convois et braquages. Au premier lancement, la question te sera posée. Le résultat est calculé avant : la passer ne change rien.", [["ask", "Demander à chaque opération"], ["full", "Toujours voir la scène"], ["off", "Jamais (résumé seulement)"]]), sel("boxspeed", "Vitesse d’ouverture des box", "Normale : animation complète. Rapide : environ 25 % plus courte, mêmes effets.", [["normal", "Normale"], ["fast", "Rapide"]])]);
    group("Décor de ville", [sel("wall", "Où afficher ton décor", "Le fond de ville équipé à la boutique (onglet « Fonds de ville ») : écran d’accueil, QG, ou aucun. Purement décoratif.", BL.data.walls ? BL.data.walls.USES : [["all", "Accueil et QG"]])]);
    group("Jeu", [sel("numbers", "Nombres", "Courts : 1,2 K · Détaillés : 1,23 K. Les valeurs exactes restent au survol.", [["short", "Courts"], ["detailed", "Détaillés"]]), sw("tips", "Infobulles", "Affiche la valeur exacte au survol."), sw("toasts", "Petits messages", "Courts messages après chaque action."), sw("large", "Grand affichage", "Agrandit légèrement textes et boutons.")]);
    var nt = el("button", "btn ghost"); nt.textContent = "Tester"; nt.dataset.nosfx = "1"; nt.onclick = function () { BL.audio && BL.audio.unlock(); BL.notify && BL.notify.test(); };
    var no = el("div", "opt", '<span class="ot"><b>Aperçu</b><small>Affiche une notification importante avec le réglage actuel.</small></span>'); no.appendChild(nt);
    group("Notifications importantes", [sel("notif", "Intensité", "Complètes : grande bannière, son et repère sur la carte. Discrètes : bannière courte, sans son. Désactivées : petit message seulement.", [["full", "Complètes"], ["quiet", "Discrètes"], ["off", "Désactivées"]]), no]);
    group("Assistante", [sel("assistant", "Assistante (Inès)", "Active : elle te prévient de tout ce qui est utile. Discrète : seulement l’important (attaque, événement, coffre plein). Désactivée : aucune bulle.", [["on", "Active"], ["quiet", "Discrète"], ["off", "Désactivée"]])]);
    if (cur) sync(root, cur); return root;
  }
  function download(name, text) {
    var blob = new Blob([text], { type: "application/json" }), a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  /* Carte « Données » : exporter, importer, réinitialiser (affichée dans la fenêtre Paramètres) */
  function dataPanel() {
    var data = el("div", "card", '<h2>Données</h2><p class="muted dnote">Ta progression est enregistrée dans ce navigateur. Exporte-la régulièrement : c’est ta protection si tu vides les données du site ou changes d’appareil.</p><div class="drow"></div><div class="muted" id="dMsg" role="status"></div>');
    var row = data.querySelector(".drow"), ex = el("button", "btn"), im = el("button", "btn ghost"), rs = el("button", "btn ghost danger"), file = document.createElement("input");
    ex.textContent = "Exporter la sauvegarde"; im.textContent = "Importer une sauvegarde"; rs.textContent = "Tout réinitialiser"; file.type = "file"; file.accept = ".json,application/json"; file.hidden = true; file.id = "importFile";
    ex.onclick = function () { h.exportSave(); }; im.onclick = function () { file.click(); }; rs.onclick = function () { h.reset(); };
    file.onchange = function () { var f = file.files && file.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { h.importSave(String(rd.result)); file.value = ""; }; rd.onerror = function () { msg("Lecture du fichier impossible."); }; rd.readAsText(f); };
    row.appendChild(ex); row.appendChild(im); row.appendChild(rs); data.appendChild(file); return data;
  }
  function build() { }
  function msg(t) { var e = $("dMsg"); if (e) e.textContent = t; }

  function init(handlers, util) {
    h = handlers; u = util; build();
    $("offlineClose").onclick = function () { $("offline").hidden = true; };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mActive) closeModal(); });
  }
  BL.perf = { status: function () { return { ema: Math.round(PERF.ema * 10) / 10, auto: PERF.auto }; }, force: function () { PERF.auto = true; document.body.classList.add("autolow", "lowfx"); } };
  BL.sysUI = { init: init, modal: modal, closeModal: closeModal, alert: alertBar, clearAlert: clearAlert, bilan: bilan, saveInfo: saveInfo, applySettings: applySettings, settingsPanel: settingsPanel, dataPanel: dataPanel, download: download, msg: msg, dur: dur };
})(window);
