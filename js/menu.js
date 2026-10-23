/* Menu principal (fond animé : « Les toits sous la pluie », voir menu-bg.js), fenêtre Profil, Paramètres, Quitter.
   Le menu ne possède aucun état de jeu : il lit l'état réel via les fonctions fournies par main.js. */
(function (root) {
  var BL = root.BL = root.BL || {}, VERSION = "1.0.0", h, E, T, D, M, $ = function (id) { return document.getElementById(id); };
  var sheetTimer = 0, sheetKind = "";
  function el(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ""; if (html !== undefined) e.innerHTML = html; return e; }
  function hms(s) { s = Math.floor(s); var a = Math.floor(s / 3600), b = Math.floor(s % 3600 / 60); return a ? a + " h " + (b < 10 ? "0" : "") + b + " min" : b ? b + " min " + (s % 60) + " s" : s + " s"; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }

  /* ---------- fond animé : géré par BL.menuBg (menu-bg.js) ---------- */
  function bg(on) { if (!BL.menuBg) return; if (on) BL.menuBg.refresh(E.level(h.state())); BL.menuBg.run(on); }

  /* ---------- menu ---------- */
  function build() {
    var m = $("menu"); m.innerHTML = "";
    if (BL.menuBg) BL.menuBg.build(m); m.appendChild(el("div", "mshade"));
    var box = el("div", "mbox2"); m.appendChild(box);
    box.appendChild(el("div", "mlogo", '<span id="menuCrest"></span><div class="brand mbrand"><span class="bt"><span class="wm">BLACKLINE</span><span class="sub"><span class="subt">Underworld Empire</span></span></span></div>'));
    box.appendChild(el("h1", "mtitle", '<span>IDLE</span><span>EMPIRE</span><span class="neon">CRIMINEL</span>'));
    box.appendChild(el("p", "mtag", "Bâtis ton empire dans l’ombre de la ville."));
    var nav = el("nav", "mnav"); nav.setAttribute("aria-label", "Menu principal"); box.appendChild(nav);
    function btn(id, label, sub, cls) { var b = el("button", "mbtn " + (cls || ""), "<span>" + label + "</span>" + (sub ? "<small>" + sub + "</small>" : "")); b.id = id; nav.appendChild(b); return b; }
    btn("mPlay", "JOUER", "", "primary"); btn("mStory", "HISTOIRE", "", "story"); btn("mNew", "NOUVELLE PARTIE", "", "sec"); btn("mProfile", "PROFIL"); btn("mSettings", "PARAMÈTRES"); btn("mQuit", "QUITTER");
    var sn = el("button", "msoon", '<span class="sn-b">Bientôt</span><span class="sn-t"><b>Une nouvelle ville arrive</b><small>Nouvelles activités, nouveaux quartiers, personnages iconiques</small></span>'); sn.id = "mSoon"; sn.type = "button"; sn.setAttribute("aria-haspopup", "dialog"); box.appendChild(sn);
    box.appendChild(el("div", "mfoot", '<span id="mHello" class="mhello"></span><span>v' + VERSION + "</span>")); box.appendChild(el("div", "mcredit", "Créé par Samy Snéoual"));
    $("menuCrest").innerHTML = BL.art.crest();
    $("mSoon").onclick = function () { BL.audio.sfx("open"); openSheet("soon"); };
    $("mPlay").onclick = play; $("mStory").onclick = function () { play(); setTimeout(function () { if (BL.sagaUI) BL.sagaUI.open(); }, 600); }; $("mNew").onclick = function () { h.newGame(); }; $("mProfile").onclick = function () { openSheet("profile"); }; $("mSettings").onclick = function () { openSheet("settings"); }; $("mQuit").onclick = function () { openSheet("quit"); };
  }
  function refresh() {
    var has = h.hasSave(), s = h.state(), L = E.level(s), nm = h.settings().name;
    var p = $("mPlay"); p.querySelector("span").textContent = has ? "JOUER" : "NOUVELLE PARTIE";
    var sub = p.querySelector("small"); if (has) { if (!sub) { sub = document.createElement("small"); p.appendChild(sub); } sub.textContent = "Niveau " + L + " · " + BL.ui.money(E.income(s)) + "/s"; } else if (sub) sub.remove();
    var sb = $("mStory"); if (sb) { sb.hidden = !has || !BL.saga; if (!sb.hidden) { var cur = BL.saga.current(s), sm = sb.querySelector("small"); if (!sm) { sm = document.createElement("small"); sb.appendChild(sm); } sm.textContent = cur ? "Chapitre " + (cur.index + 1) + " sur " + BL.saga.chapters().length + (cur.ready ? " · à lire" : " · verrouillé") : "Histoire terminée"; } }
    $("mNew").hidden = !has; BL.profile.header(L); BL.profile.refresh(h.settings());
  }
  function show() {
    var m = $("menu"); refresh(); m.hidden = false; m.classList.remove("out"); m.classList.remove("in"); void m.offsetWidth; m.classList.add("in"); $("app").inert = true; document.body.classList.add("inmenu");
    bg(true); BL.audio.play("menu"); setTimeout(function () { var p = $("mPlay"); if (p && $("sheet").hidden) p.focus({ preventScroll: true }); }, 60);
  }
  function hide() {
    var m = $("menu"); m.classList.add("out"); $("app").inert = false; document.body.classList.remove("inmenu");
    setTimeout(function () { if (m.classList.contains("out")) { m.hidden = true; bg(false); } }, 520);
  }
  function play() { BL.audio.unlock(); BL.audio.sfx("open"); h.play(); hide(); BL.audio.play("game"); setTimeout(function () { BL.radioUI && BL.radioUI.showNP(); }, 900); }
  function visible() { return !$("menu").hidden && !$("menu").classList.contains("out"); }

  /* ---------- fenêtres : profil, paramètres, quitter ---------- */
  function closeSheet() { var s = $("sheet"); if (s.hidden || sheetKind === "setup" && !h.settings().setup) return; s.hidden = true; clearInterval(sheetTimer); sheetKind = ""; if (visible()) { var p = $("mPlay"); p && p.focus({ preventScroll: true }); } }
  function openSheet(kind) {
    var s = $("sheet"), box = $("sheetBox"); clearInterval(sheetTimer); sheetKind = kind; box.innerHTML = "";
    var head = el("div", "sh", "<h2></h2>"), x = el("button", "pclose", "&times;"); x.setAttribute("aria-label", "Fermer"); x.onclick = closeSheet; head.querySelector("h2").textContent = { profile: "Profil", settings: "Paramètres", quit: "Quitter et à propos", setup: "Crée ton personnage", soon: "La nouvelle ville" }[kind]; if (kind !== "setup") head.appendChild(x); box.appendChild(head);
    var body = el("div", "sb"); box.appendChild(body);
    if (kind === "settings") {
      body.appendChild(BL.sysUI.settingsPanel());
      var help = el("div", "card", '<h2>Aide</h2><p class="muted dnote">Un mot ou un chiffre que tu ne comprends pas ? Le glossaire explique tout, et chaque chiffre a une petite icône « ? ». Le didacticiel peut se rejouer à tout moment, sans toucher à ta partie.</p><div class="drow"></div>'), gb = el("button", "btn", "Ouvrir le glossaire"); gb.onclick = function () { closeSheet(); hide(); BL.ui.go("glossary"); }; help.querySelector(".drow").appendChild(gb); var tb = el("button", "btn ghost", "Revoir le didacticiel"); tb.onclick = function () { closeSheet(); hide(); BL.ui.go("map"); BL.tutorial.start(0); }; help.querySelector(".drow").appendChild(tb); body.appendChild(help);
      body.appendChild(BL.sysUI.dataPanel());
    }
    else if (kind === "profile") profile(body);
    else if (kind === "setup") setup(body);
    else if (kind === "soon") soon(body);
    else quit(body);
    s.hidden = false; s.onclick = function (e) { if (e.target === s && sheetKind !== "setup") closeSheet(); }; (box.querySelector("input,button.btn,select") || x).focus({ preventScroll: true });
  }
  function soon(body) {
    body.appendChild(el("div", "soon", '<p class="soon-k">Prochainement</p><h3 class="soon-h">Une autre ville. D’autres règles.</h3><p class="soon-p">Les quartiers que tu connais ne sont que le début. Une nouvelle ville ouvre ses portes : de nouveaux terrains à prendre, d’autres façons de faire tourner l’argent, des visages que personne n’oublie.</p><ul class="soon-l"><li><b>Nouvelles activités</b><span>De quoi faire autrement fructifier ton empire.</span></li><li><b>Nouveaux quartiers</b><span>Une autre carte, d’autres puissances, d’autres frontières.</span></li><li><b>Personnages iconiques</b><span>Alliés, rivaux et figures de l’ombre à rencontrer.</span></li></ul><p class="soon-d">Aucune date annoncée : « bientôt », c’est tout ce que l’on peut promettre. Ta partie actuelle ne changera pas.</p>'));
  }
  function card(label, val, sub, cls) { return '<div class="pstat ' + (cls || "") + '"><span>' + label + '</span><b>' + val + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>"; }
  function profile(body) {
    var top = el("div", "pf-top"), av = el("div", "pf-av", BL.profile.avatar(h.settings().avatar, 84)), form = el("div", "pf-form", '<label for="pfName">Pseudonyme</label><div class="pf-row"><input id="pfName" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ton nom de boss"><button class="btn" id="pfSave">Enregistrer</button></div><small class="muted">Profil local : enregistré avec ta partie, dans ce navigateur. Aucun compte n’est nécessaire pour jouer.</small>');
    top.appendChild(av); top.appendChild(form); body.appendChild(top);
    var st = el("div", "pf-status"); body.appendChild(st);
    var ch = el("details", "pdet pf-more", "<summary>Changer d’avatar</summary>"); ch.appendChild(BL.profile.picker(h.settings().avatar, function (id) { h.setting("avatar", id); av.innerHTML = BL.profile.avatar(id, 84); })); body.appendChild(ch);
    var stats = el("div", "pf-grid"); body.appendChild(stats);
    var sx = el("details", "pdet pf-more", "<summary>Les statuts : comment ça marche</summary><p class=\"muted\">Ton statut dépend de ton niveau d’empire (de 1 à " + D.balance.maxEmpireLevel + "). Les premiers statuts arrivent vite, tous les 4 niveaux environ, pour que tu sentes la progression dès le début. Au milieu, il faut 4 à 6 niveaux par statut. Le dernier, « Légende de l’ombre », demande le niveau maximal. Chaque promotion est annoncée avec une bannière et te donne le prochain objectif.</p><div id=\"pfSt\"></div>"); body.appendChild(sx);
    var more = el("details", "pdet pf-more", "<summary>Statistiques détaillées</summary><dl class=\"dl\" id=\"pfDetail\"></dl>"); body.appendChild(more);
    body.appendChild(el("div", "pf-acc", "<h3>Compte en ligne</h3><p>Pas de compte pour l’instant : ce jeu fonctionne entièrement dans ton navigateur, sans serveur, donc il ne peut ni créer de compte ni vérifier un mot de passe de façon sûre. Je n’ai volontairement pas ajouté de faux formulaire de connexion.</p><details class=\"pdet\"><summary>Comment ajouter un vrai compte plus tard</summary><ul class=\"pf-ul\"><li>Un petit serveur d’authentification (e-mail + mot de passe haché côté serveur, ou « se connecter avec Google/Discord »), avec session en cookie HttpOnly.</li><li>Une API de sauvegarde en ligne qui reçoit l’enveloppe versionnée de <code>save.js</code> (déjà prête : version, date, état, réglages).</li><li>À la première connexion, la partie locale est proposée à l’envoi : aucune progression perdue.</li><li>Aucun mot de passe ne doit jamais être stocké dans le navigateur.</li></ul></details>"));
    var inp = $("pfName"); inp.value = h.settings().name || "";
    function saveName() { var v = inp.value; h.setting("name", v); inp.value = h.settings().name; BL.audio.sfx("success"); if (visible()) refresh(); var b = $("pfSave"); b.textContent = "Enregistré ✓"; setTimeout(function () { b.textContent = "Enregistrer"; }, 1200); }
    $("pfSave").onclick = saveName; inp.onkeydown = function (e) { if (e.key === "Enter") saveName(); };
    function fill() {
      var s = h.state(), L = E.level(s), B = D.balance, lo = E.levelAt(L), hi = E.levelAt(L + 1), pct = L >= B.maxEmpireLevel ? 100 : Math.min(100, (s.total - lo) / (hi - lo) * 100), own = 0, mx = 0, acts = 0, bld = 0, th = M.LOTS.thresholds;
      D.activities.forEach(function (a) { var n = s.owned[a.id] || 0; own += n; mx += a.maxLevel; if (n > 0) acts++; bld += E.buildings(s, a.id); });
      var gl = mx ? Math.round(own / mx * 100) : 0, money = BL.ui.money, cs = BL.status.of(L), ns = BL.status.next(L);
      st.innerHTML = '<div class="stnow"><small>Statut</small><b>' + cs.name + '</b><span>' + cs.tag + '</span></div><div class="stnext">' + (ns ? "Prochain : <b>" + ns.name + "</b> au niveau " + ns.lvl + '<i class="mt"><i style="width:' + Math.round(BL.status.progress(L) * 100) + '%"></i></i>' : "Statut maximal atteint.") + "</div>"; var tb = $("pfSt"); if (tb && tb.dataset.l !== String(L)) { tb.dataset.l = String(L); tb.innerHTML = BL.profile.statusTable(L); }
      stats.innerHTML = card("Niveau de l’empire", L + (L >= B.maxEmpireLevel ? " (max)" : ""), '<i class="mt"><i style="width:' + pct + '%"></i></i>', "wide") + card("Argent", money(s.money), "$" + BL.ui.exact(s.money)) + card("Revenus", money(E.income(s)) + "/s", "nets") +
        card("Établissements", acts + " / " + D.activities.length, bld + " bâtiments construits") + card("Quartiers", T.count(s) + " / " + D.territory.districts.length, "contrôlés") + card("Temps de jeu", hms(s.t), "") +
        card("Progression globale", gl + " %", '<i class="mt"><i style="width:' + gl + '%"></i></i>', "wide") + card("Lingots d’or", s.gold + " / " + BL.gold.capacity(s), s.goldLife.bought + " achetés · " + s.goldLife.spent + " dépensés") + card("Succès", E.count(s.ach) + " / " + D.achievements.length, "") + card("Missions", E.count(s.claimed) + " / " + D.missions.length, "") + (BL.meta ? (function () { var x = BL.meta.state(s), c = BL.meta.clan(s); return card("Mode de partie", x.hard ? "Difficile" : "Normal", (c ? "Clan « " + c.name + " »" : "Sans clan") + (x.pr ? " · prestige " + x.pr : "")); })() : "");
      $("pfDetail").innerHTML = [["Total gagné", money(s.total)], ["Dépenses (achats)", money(s.st.spent)], ["Récompenses reçues", money(s.st.rewards)], ["Réputation", BL.ui.fmt(E.reputation(s))], ["Influence territoriale", BL.ui.fmt(E.influence(s))]].map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    }
    fill(); sheetTimer = setInterval(function () { if (sheetKind === "profile" && !(BL.press && BL.press.active())) fill(); }, 1000);
  }
  function setup(body) {
    var pick = BL.avatars.DEFAULT, msg = el("p", "setmsg muted", "Choisis un pseudo et un avatar. Tu pourras les changer plus tard dans Profil.");
    var f = el("div", "pf-form", '<label for="suName">Pseudonyme</label><div class="pf-row"><input id="suName" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ton nom de boss"></div>');
    body.appendChild(f); var pk = BL.profile.picker(pick, function (id) { pick = id; }); body.appendChild(pk);
    var hd = el("label", "suhard", '<input type="checkbox" id="suHard"> <span><b>Mode difficile</b> (facultatif) : chaleur +20 %, rivaux +20 %, prix +5 %. À choisir maintenant : il ne se change plus après les 10 premières minutes.</span>'); body.appendChild(hd); body.appendChild(msg);
    var go = el("button", "btn buy can", "Commencer"); go.id = "suGo"; go.dataset.nosfx = "1"; body.appendChild(go);
    function done() {
      var v = $("suName").value.replace(/[\u0000-\u001f<>]/g, "").trim(); if (v.length < 2) { msg.textContent = "Choisis un pseudo d’au moins 2 caractères."; msg.classList.add("bad"); BL.audio.sfx("error"); $("suName").focus(); return; }
      h.setting("name", v); h.setting("avatar", pick); h.setting("setup", true); if (h.hard) h.hard(!!($("suHard") && $("suHard").checked)); BL.audio.unlock(); BL.audio.sfx("success"); closeSheet(); refresh();
    }
    go.onclick = done; $("suName").onkeydown = function (e) { if (e.key === "Enter") done(); };
  }
  function quit(body) {
    body.appendChild(el("p", "mp", "Un jeu dans un navigateur ne peut pas fermer l’onglet de force. Pour quitter, ferme simplement l’onglet : ta progression est enregistrée automatiquement toutes les 10 secondes et à la fermeture."));
    var inf = el("div", "pf-grid", card("Sauvegarde", '<span id="qSave">…</span>', "") + card("Version", "v" + VERSION, "sauvegarde v" + BL.save.VERSION)); body.appendChild(inf);
    var row = el("div", "mrow"), sv = el("button", "btn"), cl = el("button", "btn ghost"); sv.textContent = "Sauvegarder maintenant"; cl.textContent = "Retour au menu";
    body.appendChild(el("p", "mcred2", "<b>BLACKLINE</b> · Créé par Samy Snéoual<br><small>Un jeu 100 % local : aucun compte, aucun serveur.</small><br><a class=\"mabout\" href=\"about.html\" target=\"_blank\" rel=\"noopener\">Crédits et licences</a>"));
    sv.onclick = function () { h.save(); $("qSave").textContent = $("saveinfo").textContent; }; cl.onclick = closeSheet; row.appendChild(cl); row.appendChild(sv); body.appendChild(row); $("qSave").textContent = $("saveinfo").textContent;
  }

  function init(handlers) {
    h = handlers; E = BL.economy; T = BL.territory; D = BL.data; M = BL.mapData; build();
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("sheet").hidden && $("modal").hidden && sheetKind !== "setup") closeSheet(); });
  }
  BL.menu = { init: init, show: show, hide: hide, visible: visible, openSheet: openSheet, closeSheet: closeSheet, VERSION: VERSION, _debug: function () { return { vis: !!(BL.menuBg && BL.menuBg.isOn()), hasBg: !!BL.menuBg, level: BL.menuBg && BL.menuBg.level() }; } };
})(window);
