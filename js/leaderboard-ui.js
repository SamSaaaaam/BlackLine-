/* Classement en ligne (facultatif) : vue « Classement ». Aucun calcul de jeu ici ; tout texte reçu du serveur est échappé (jamais de HTML interprété). */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, u, host = null, built = false, cat = "all", rows = null, myRow = null, loading = false, lastLoad = 0, status = "", statusType = "", mode = "", renaming = false, confirmDel = false, reported = {}, nameDraft = "";
  function $(id) { return doc.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function L() { return BL.lb; }
  function cfgOn() { return L() && L().configured(); }
  function sett() { return BL.main && BL.main.settings ? BL.main.settings() : {}; }
  function money(n) { return u && u.money ? u.money(n) : String(Math.floor(n)); }
  function errText(e) { var c = e && e.code || "net"; if (/^name_/.test(c)) { var k = c.slice(5); return k === "taken" ? BL.lbCore.nameMessage("taken") : BL.lbCore.nameMessage(k); } if (c === "rename_rate") return BL.lbCore.nameMessage("rate"); return L().MSG[c] || L().MSG.server; }
  function curMode() { var s = sett(); if (!cfgOn()) return "off"; if (s.lbon === true) return L().state().lost ? "lost" : "on"; return s.lbname ? "paused" : "intro"; }

  var PRIV = '<p><b>Ce qui est envoyé</b> (seulement si tu actives le classement) : ton pseudo, ton total d’argent gagné, ton niveau d’empire, la version du jeu et la date de l’envoi. Un identifiant technique anonyme est créé pour te reconnaître ; il ne contient ni nom, ni e-mail.</p>'
    + '<p><b>Ce qui n’est jamais envoyé</b> : ton nom réel, ton e-mail, ton adresse, ton âge, ta position, ton appareil, le contenu de ta partie.</p>'
    + '<p><b>Qui voit quoi</b> : tous les joueurs voient ton pseudo, ton score et ton niveau dans le classement. Rien d’autre.</p>'
    + '<p><b>Combien de temps</b> : tant que tu restes dans le classement. Le bouton « Se retirer et effacer mes données » supprime ton profil, tes signalements et l’identifiant anonyme du serveur.</p>'
    + '<p><b>Pseudo</b> : choisis un pseudo inventé, sans nom réel ni contact. Les pseudos inappropriés sont refusés ; chacun peut en signaler un.</p>'
    + '<p class="lb-small">Éditeur et contact : à compléter par l’éditeur du jeu (voir docs/supabase-installation.md). Ce texte n’est pas un avis juridique.</p>';

  function introHtml(kind) {
    var s = sett(), t = kind === "lost" ? "Ton profil de classement est introuvable" : kind === "paused" ? "Classement en pause" : "Classement en ligne";
    var p = kind === "lost" ? "Choisis ton pseudo à nouveau pour te remettre dans le classement." : kind === "paused" ? "Tu n’envoies plus de score. Tu peux le réactiver ou effacer tes données du serveur." : "Compare ton empire à celui des autres joueurs. C’est facultatif : le jeu fonctionne exactement pareil sans.";
    var h = '<section class="lb-card"><h2>' + t + '</h2><p class="lb-lead">' + p + '</p>';
    if (kind === "paused") h += '<p>Pseudo : <b>' + esc(s.lbname || "") + '</b></p><div class="lb-actions"><button class="btn can" data-act="reactivate">Réactiver</button><button class="btn" data-act="delete">Se retirer et effacer mes données</button></div>';
    else h += '<ul class="lb-facts"><li><b>Envoyé :</b> ton pseudo, ton total gagné et ton niveau d’empire.</li><li><b>Jamais envoyé :</b> ton nom, ton e-mail, ton adresse, ta position.</li><li>Tu peux te retirer et tout effacer quand tu veux.</li></ul><p class="lb-warn">N’utilise pas ton vrai nom : invente un pseudo.</p>'
      + '<label class="lb-lab" for="lbName">Ton pseudo (3 à 16 caractères)</label><div class="lb-form"><input id="lbName" class="lb-in" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(nameDraft || s.lbname || "") + '" aria-describedby="lbErr"><button class="btn can" data-act="enable">Activer le classement</button></div>';
    h += '<p id="lbErr" class="lb-err" role="alert"></p><details class="lb-priv"><summary>Confidentialité : ce qui est envoyé, ce qui ne l’est pas</summary>' + PRIV + '</details></section>';
    return h;
  }
  function tabsHtml() { return '<div class="lb-tabs" role="tablist" aria-label="Type de classement">' + [["week", "Cette semaine"], ["all", "Tout temps"]].map(function (t) { return '<button class="lb-tab" role="tab" data-act="tab" data-cat="' + t[0] + '" aria-selected="' + (cat === t[0]) + '" tabindex="' + (cat === t[0] ? 0 : -1) + '">' + t[1] + "</button>"; }).join("") + "</div>"; }
  function onHtml() {
    var s = sett();
    return '<section class="lb-card"><div class="lb-head"><div><h2>Classement</h2><p class="lb-lead">Ton pseudo : <b id="lbMe">' + esc(s.lbname || "") + '</b></p></div>' + tabsHtml() + '</div>'
      + '<p id="lbStatus" class="lb-status" role="status"></p><p class="lb-hint" id="lbHint"></p><ol id="lbRows" class="lb-rows" aria-label="Classement"></ol>'
      + '<div id="lbActs" class="lb-actions"></div><div id="lbRen" class="lb-form lb-ren" hidden><label class="lb-lab" for="lbNew">Nouveau pseudo (1 changement par 24 h)</label><input id="lbNew" class="lb-in" maxlength="16" autocomplete="off" spellcheck="false"><button class="btn can" data-act="doRename">Valider</button><button class="btn ghost" data-act="cancelRename">Annuler</button></div>'
      + '<p id="lbErr" class="lb-err" role="alert"></p><details class="lb-priv"><summary>Confidentialité</summary>' + PRIV + '</details></section>';
  }
  function actsHtml() {
    if (confirmDel) return '<div class="lb-conf" role="alertdialog" aria-labelledby="lbCT"><p id="lbCT"><b>Effacer tes données du classement ?</b> Ton pseudo, ton score et ton identifiant anonyme seront supprimés du serveur. Ta partie, elle, reste sur cet appareil.</p><button class="btn" data-act="delNo">Annuler</button><button class="btn can" data-act="delYes">Oui, effacer</button></div>';
    return '<button class="btn" data-act="refresh"' + (loading ? " disabled" : "") + '>Actualiser</button><button class="btn" data-act="rename">Changer de pseudo</button><button class="btn ghost" data-act="pause">Mettre en pause</button><button class="btn ghost" data-act="delete">Se retirer et effacer mes données</button>';
  }
  function rowsHtml() {
    if (!rows) return ""; if (!rows.length) return '<li class="lb-empty">Personne dans ce classement pour l’instant.</li>';
    return rows.map(function (r) {
      var rep = r.me ? '<span class="lb-you">Toi</span>' : r.pub ? (reported[r.pub] ? '<span class="lb-done">Signalé</span>' : '<button class="lb-rep" data-act="report" data-pub="' + r.pub + '" aria-label="Signaler le pseudo ' + esc(r.name) + '">Signaler</button>') : "";
      var pod = r.rank >= 1 && r.rank <= 3 ? r.rank : 0, medal = ["", "1re place, or", "2e place, argent", "3e place, bronze"][pod], crown = pod === 1 ? '<svg class="lb-crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z"/></svg>' : "";
      return '<li class="lb-row' + (pod ? " p" + pod : "") + (r.me ? " me" : "") + '"><span class="lb-rk">' + (r.rank || "–") + (pod ? '<span class="sr"> ' + medal + "</span>" : "") + '</span><span class="lb-nm">' + crown + esc(r.name) + '</span><span class="lb-lv">Niv. ' + r.level + '</span><span class="lb-sc">' + esc(money(r.score)) + '</span><span class="lb-ac">' + rep + "</span></li>";
    }).join("");
  }
  function setStatus(t, type) { status = t || ""; statusType = type || ""; var e = $("lbStatus"); if (e) { e.textContent = status; e.dataset.t = statusType; } }
  function setErr(t) { var e = $("lbErr"); if (e) e.textContent = t || ""; }
  function paintRows() { var o = $("lbRows"), a = $("lbActs"), hnt = $("lbHint"); if (o) o.innerHTML = rowsHtml(); if (a) a.innerHTML = actsHtml(); if (hnt) hnt.textContent = cat === "week" ? "Le classement de la semaine compte l’argent gagné depuis lundi (heure de Paris). Il repart de zéro chaque lundi." : "Le classement « Tout temps » compte tout l’argent gagné depuis le début. Les envois sont vérifiés par le serveur ; les scores impossibles sont refusés."; }
  function V() { return host || $("v_board"); }
  function paintAll() {
    var v = V(); if (!v) return; mode = curMode(); v.innerHTML = mode === "off" ? "" : mode === "on" ? onHtml() : introHtml(mode);
    if (mode === "on") { paintRows(); setStatus(status, statusType); }
  }
  function load(force) {
    if (!cfgOn() || sett().lbon !== true || loading) return; var now = Date.now(); if (!force && now - lastLoad < 60000) return; lastLoad = now; loading = true; setStatus("Chargement…", "load"); paintRows();
    L().submit(!!force).then(function () { return L().board(cat); }).then(function (r) { rows = r; loading = false; setStatus(L().state().err ? L().MSG[L().state().err] || "" : "", "err"); paintRows(); }, function (e) { loading = false; rows = rows || []; setStatus(errText(e), "err"); paintRows(); });
  }
  function act(a, b) {
    if (a === "tab") { cat = b.dataset.cat === "week" ? "week" : "all"; rows = null; paintAll(); load(true); var t = V().querySelector('[data-act="tab"][aria-selected="true"]'); if (t) t.focus(); }
    else if (a === "refresh") load(true);
    else if (a === "enable" || a === "doRename") {
      var inp = $(a === "enable" ? "lbName" : "lbNew"); if (!inp) return; var c = BL.lbCore.checkName(inp.value); nameDraft = inp.value; if (!c.ok) { setErr(c.message); inp.focus(); return; }
      setErr(""); b.disabled = true; setErr("Un instant…");
      (a === "enable" ? L().register(c.name) : L().rename(c.name)).then(function () { setErr(""); nameDraft = ""; renaming = false; rows = null; lastLoad = 0; paintAll(); load(true); }, function (e) { setErr(errText(e)); b.disabled = false; });
    }
    else if (a === "rename") { renaming = true; var r = $("lbRen"); if (r) { r.hidden = false; var n = $("lbNew"); if (n) n.focus(); } }
    else if (a === "cancelRename") { renaming = false; var r2 = $("lbRen"); if (r2) r2.hidden = true; setErr(""); }
    else if (a === "pause") { if (BL.main) BL.main.setSetting("lbon", false); rows = null; paintAll(); }
    else if (a === "reactivate") { if (BL.main) BL.main.setSetting("lbon", true); lastLoad = 0; paintAll(); load(true); }
    else if (a === "delete") { confirmDel = true; if (mode === "on") { var ac = $("lbActs"); if (ac) { ac.innerHTML = actsHtml(); var no = ac.querySelector('[data-act="delNo"]'); if (no) no.focus(); } } else { paintAll(); var v = V(); if (v) { v.querySelector(".lb-actions").innerHTML = actsHtml(); var n2 = v.querySelector('[data-act="delNo"]'); if (n2) n2.focus(); } } }
    else if (a === "delNo") { confirmDel = false; paintAll(); if (mode === "on") paintRows(); }
    else if (a === "delYes") { b.disabled = true; L().deleteMe().then(function () { confirmDel = false; rows = null; cat = "all"; paintAll(); setErr("Tes données ont été effacées du serveur."); }, function (e) { b.disabled = false; setErr(errText(e)); }); }
    else if (a === "report") { var pub = b.dataset.pub; b.disabled = true; L().report(pub).then(function () { reported[pub] = 1; paintRows(); setStatus("Merci, le pseudo a été signalé.", "ok"); }, function (e) { b.disabled = false; setStatus(errText(e), "err"); }); }
  }
  function build() {
    var v = V(); if (!v || v.__lb) return; v.__lb = 1; built = true;
    v.addEventListener("click", function (e) { var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; act(b.dataset.act, b); });
    v.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.classList && e.target.classList.contains("lb-in")) { e.preventDefault(); var b = e.target.parentNode.querySelector('[data-act="enable"],[data-act="doRename"]'); if (b && !b.disabled) act(b.dataset.act, b); }
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.target.dataset && e.target.dataset.act === "tab") { var o = v.querySelector('[data-act="tab"][aria-selected="false"]'); if (o) { e.preventDefault(); o.click(); } }
    });
  }
  function update() {
    if (host) return; var v = $("v_board"); if (!v || v.hidden) return; build(); var m = curMode(); if (m !== mode || !v.firstChild && m !== "off") { paintAll(); if (m === "on") { lastLoad = 0; } }
    if (m === "on") load(false);
  }
  /* affichage dans une fenêtre du menu principal (même contenu que la page) : un seul exemplaire à la fois dans la page, pour que les identifiants restent uniques */
  function mount(c) { if (!c) return; var vb = $("v_board"); if (vb) vb.innerHTML = ""; host = c; mode = ""; confirmDel = false; renaming = false; build(); paintAll(); if (mode === "on") { lastLoad = 0; load(true); } }
  function unmount() { if (host) host.innerHTML = ""; host = null; mode = ""; confirmDel = false; }
  function init(h, util) { u = util || BL.ui; }
  BL.lbUI = { init: init, mount: mount, unmount: unmount, update: update, render: function () { paintAll(); }, _state: function () { return { mode: mode, cat: cat, rows: rows ? rows.length : -1, loading: loading }; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
