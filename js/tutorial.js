/* Didacticiel de premier lancement : 8 étapes courtes, chacune pointe un vrai élément de l'écran (halo) et attend,
   quand c'est possible, une vraie action du joueur. Il ne bloque jamais le jeu (le halo laisse passer les clics),
   se passe, se quitte, se rejoue depuis Paramètres, et ne modifie JAMAIS la progression : il lit l'état, rien de plus.
   Réglages enregistrés : tutorial = "todo" | "done" | "skipped", tstep = étape en cours (0 à 7). */
(function (root) {
  var BL = root.BL = root.BL || {};
  var doc = root.document;
  function $(id) { return doc.getElementById(id); }
  function vis(id) { var e = $(id); return !!e && !e.hidden; }
  /* C14 : l'onglet visé est dans un groupe ; s'il est masqué, on montre l'entrée de groupe (QG, Terrain…) */
  function navTarget(view) { var b = doc.querySelector('[data-view="' + view + '"]'); if (b && !b.hidden) return b; var g = view === "shop" || view === "radio" || view === "hq" ? "more" : "empire"; return doc.querySelector('[data-group="' + g + '"]') || b; }
  function mobile() { return root.innerWidth <= 900; }

  /* bouton « Construire » de la fiche de la carte, seulement s'il est réellement à l'écran */
  function panelBuy() {
    var b = doc.querySelector("#mapPanel .buy"); if (!b) return null; var r = b.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && r.top < root.innerHeight && r.bottom > 0 && r.left < root.innerWidth && r.right > 0 ? b : null;
  }
  /* chemin vers la radio selon l'écran : bouton du bandeau, roue dans la section Radio, ou menu (petits écrans) */
  function radioMode() {
    var b = $("radioBtn"), r = b ? b.getBoundingClientRect() : null;
    if (r && r.width > 2 && r.height > 2) return "btn"; if (vis("v_radio")) return "wheel";
    return doc.getElementById("side").classList.contains("open") ? "nav" : "menu";
  }
  /* ---------- étapes ---------- */
  /* target(c) : élément à entourer (ou null) · done(c) : action accomplie · auto : passe seule à la suivante une fois faite
     before(c) : prépare l'écran à l'entrée · after(c) : ménage à la sortie (bouton Suivant) · text peut être une fonction */
  var STEPS = [
    { id: "map", title: "Ta ville",
      text: "Voici la carte de ton empire. Glisse pour te déplacer, molette ou deux doigts pour zoomer. Chaque bâtiment et chaque quartier se touche pour ouvrir sa fiche.",
      target: function () { return $("mapWrap"); }, before: function (c) { if (!vis("v_map")) c.go("map"); } },
    { id: "buy", title: "Ta première activité", auto: true,
      text: function (c) { var a = BL.data.activities[0], st0 = c.state(); if (st0 && BL.works && BL.works.busyLot(st0, a.id, 0)) return "Les travaux ont commencé : quelques secondes et ta salle ouvre ses portes. Chaque achat ou amélioration passe désormais par un court chantier."; return panelBuy() ? "Parfait. Touche maintenant le bouton de construction : elle coûte " + c.money(a.baseCost) + " et tu as de quoi la payer." : "Touche « " + a.name + " » dans la liste sous la carte, puis « Construire »."; },
      doneText: "Bien joué : ta première activité tourne.",
      target: function () { return panelBuy() || doc.querySelector("#mapChips .mchip:nth-child(2)") || $("mapWrap"); },
      done: function (c) { var s = c.state(); return !!s && BL.economy.best(s, BL.data.activities[0].id) >= 1; },
      before: function (c) { if (!vis("v_map")) c.go("map"); } },
    { id: "income", title: "Tes revenus",
      text: "En haut, ton argent et ton revenu par seconde. Ta salle rapporte toute seule, et un peu quand tu fermes le jeu (20 %, 4 h au plus : jouer rapporte bien plus). Un chiffre avec « ? » s’explique au survol ou au toucher.",
      target: function () { return $("res"); } },
    { id: "todo", title: "Que faire maintenant ?", auto: true,
      text: "Ce bouton te propose la meilleure action du moment, avec un bouton direct. Ouvre-le pour voir.",
      doneText: "Tu sauras toujours quoi faire ensuite.",
      target: function () { return $("todoBtn"); },
      done: function () { return vis("todoMap"); },
      before: function (c) { if (!vis("v_map")) c.go("map"); } },
    { id: "hq1", title: "Entre dans ton QG", auto: true,
      text: "Ton quartier général est un vrai lieu : on y entre. Touche le bouton « QG » (ou le bâtiment doré sur la carte).",
      doneText: "Te voilà dans ton QG.",
      target: function () { return doc.querySelector(".mdock .dk"); },
      done: function () { return !!BL.roomUI && BL.roomUI.isOpen(); },
      before: function (c) { if (!vis("v_map") && !(BL.roomUI && BL.roomUI.isOpen())) c.go("map"); } },
    { id: "hq2", title: "Ton repaire",
      text: "Ici, tu ranges tes lingots d’or et tu installes des objets. Les lingots servent au QG et à la Boutique, jamais aux activités, et ils ne s’achètent pas avec de l’argent réel. « Suivant » te ramène sur la carte.",
      target: function () { return null; },
      after: function () { if (BL.roomUI && BL.roomUI.isOpen()) BL.roomUI.exit(); } },
    { id: "shop", title: "La Boutique", auto: true,
      text: function () { return mobile() && !doc.getElementById("side").classList.contains("open") ? "Ouvre le menu (☰), puis « QG » et l’onglet « Boutique » : boosts, décors et objets, payés en lingots." : "Choisis « QG » puis l’onglet « Boutique » : boosts, décors et objets, payés en lingots."; },
      doneText: "Voilà la Boutique.",
      target: function () { return mobile() && !doc.getElementById("side").classList.contains("open") ? $("menuBtn") : navTarget("shop"); },
      done: function () { return vis("v_shop"); },
      before: function () { return; } },
    { id: "radio", title: "La radio", auto: true, last: true,
      text: function () { var m = radioMode(); return m === "btn" ? "Ta ville a sa musique. Ouvre la roue des stations (touche T, ou ce bouton) et choisis ce qui te plaît." : m === "wheel" ? "Touche « Roue des stations » pour choisir ta musique." : m === "menu" ? "Ouvre le menu (☰), puis « QG » et l’onglet « Radio »." : "Choisis « QG » puis l’onglet « Radio »."; },
      doneText: "Tout est prêt. Tu peux revoir ce didacticiel dans Paramètres.",
      target: function () { var m = radioMode(); return m === "btn" ? $("radioBtn") : m === "wheel" ? $("rdWheel") : m === "menu" ? $("menuBtn") : navTarget("radio"); },
      done: function () { return !!BL.radioUI && BL.radioUI.isWheelOpen(); } }
  ];

  /* ---------- logique pure (testée sans navigateur) ---------- */
  var MODES = ["todo", "done", "skipped"];
  function clampStep(n) { n = Math.floor(Number(n)); return isFinite(n) ? Math.max(0, Math.min(STEPS.length - 1, n)) : 0; }
  function cleanMode(m, fallback) { return MODES.indexOf(m) >= 0 ? m : fallback; }
  /* affichage automatique : seulement pour une nouvelle partie dont le didacticiel n'a pas été fait ni refusé */
  function shouldRun(settings) { return !!settings && settings.tutorial === "todo"; }

  /* ---------- interface ---------- */
  var c = null, root_ = null, hole = null, card = null, el = {}, active = false, idx = 0, done = false, doneAt = 0, timer = 0, shown = false, adv = 0, scrolled = false;

  function say(step) { var t = step.text; return typeof t === "function" ? t(c) : t; }
  function build() {
    root_ = doc.createElement("div"); root_.id = "tut"; root_.hidden = true;
    root_.innerHTML = '<div class="tuthole" id="tutHole" aria-hidden="true"></div>' +
      '<section class="tutcard" id="tutCard" role="region" aria-label="Didacticiel">' +
      '<div class="tuthead"><span class="tutn" id="tutN"></span><span class="tutdots" id="tutDots" aria-hidden="true"></span></div>' +
      '<h2 class="tutt" id="tutT"></h2><p class="tutx" id="tutX" aria-live="polite"></p><p class="tutok" id="tutOk" hidden></p>' +
      '<div class="tutbtns"><button type="button" class="btn ghost" id="tutBack">Retour</button><button type="button" class="btn ghost" id="tutSkip">Passer cette étape</button><button type="button" class="btn" id="tutNext">Suivant</button></div>' +
      '<button type="button" class="tutquit" id="tutQuit">Quitter le didacticiel</button></section>';
    doc.body.insertBefore(root_, doc.body.firstChild);
    hole = $("tutHole"); card = $("tutCard");
    ["tutN", "tutDots", "tutT", "tutX", "tutOk", "tutBack", "tutSkip", "tutNext", "tutQuit"].forEach(function (k) { el[k] = $(k); });
    el.tutBack.onclick = function () { go(idx - 1, true); };
    el.tutSkip.onclick = function () { next(); };
    el.tutNext.onclick = function () { next(); };
    el.tutQuit.onclick = function () { finish("skipped"); };
    el.tutDots.innerHTML = STEPS.map(function () { return "<i></i>"; }).join("");
    root.addEventListener("resize", place);
  }

  function setStore(mode, step) { if (!c) return; if (mode) c.setting("tutorial", mode); if (step !== undefined) c.setting("tstep", step); }

  function go(n, back) {
    if (!active) return; clearTimeout(adv);
    if (n < 0) n = 0; if (n >= STEPS.length) { finish("done"); return; }
    var prev = STEPS[idx]; if (!back && prev && prev.after && n > idx) { try { prev.after(c); } catch (e) { } }
    idx = n; done = false; doneAt = 0; shown = false; scrolled = false; var st = STEPS[idx]; setStore(null, idx);
    if (st.before) { try { st.before(c); } catch (e) { } }
    render();
  }
  function next() { go(idx + 1, false); }

  function render() {
    var st = STEPS[idx]; if (!st) return;
    el.tutN.textContent = "Étape " + (idx + 1) + " sur " + STEPS.length;
    Array.prototype.forEach.call(el.tutDots.children, function (d, i) { d.className = i < idx ? "d" : i === idx ? "on" : ""; });
    el.tutT.textContent = st.title; el.tutX.textContent = say(st);
    var initiallyDone = st.done ? !!safeDone(st) : false;
    el.tutOk.hidden = true; done = false;
    el.tutBack.disabled = idx === 0;
    el.tutNext.textContent = st.last ? "Terminer" : "Suivant";
    /* étape à action : « Passer cette étape » reste proposé ; sans action, seul « Suivant » compte */
    el.tutSkip.hidden = !st.done; el.tutNext.hidden = !!st.done;
    if (st.done && initiallyDone) markDone(true);
    place();
  }
  function safeDone(st) { try { return st.done(c); } catch (e) { return false; } }
  function markDone(already) {
    var st = STEPS[idx]; done = true; doneAt = Date.now();
    el.tutOk.hidden = false; el.tutOk.textContent = already ? "Déjà fait ✓" : (st.doneText || "Fait ✓");
    el.tutNext.hidden = false; el.tutSkip.hidden = true;
    if (!st.last && st.auto && !already) { clearTimeout(adv); var at = idx; adv = setTimeout(function () { if (active && idx === at) next(); }, 1100); }
  }

  function targetRect(st) {
    var t = null; try { t = st.target ? st.target(c) : null; } catch (e) { t = null; }
    if (!t || !t.getBoundingClientRect) return null;
    var r = t.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null;
    var cs = root.getComputedStyle(t); if (cs.visibility === "hidden" || cs.display === "none") return null;
    return r;
  }
  function place() {
    if (!active || !hole) return; var st = STEPS[idx]; if (!st) return;
    var r = targetRect(st), vw = root.innerWidth, vh = root.innerHeight;
    if (r && !scrolled && (r.top < 0 || r.bottom > vh) && !(BL.roomUI && BL.roomUI.isOpen())) { scrolled = true; var tg = null; try { tg = st.target(c); } catch (e) { } if (tg && tg.scrollIntoView) { try { tg.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) { } r = targetRect(st); } }
    if (r && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) {
      var p = 6, x = Math.max(2, r.left - p), y = Math.max(2, r.top - p), w = Math.min(vw - 4 - x, r.width + p * 2), h = Math.min(vh - 4 - y, r.height + p * 2);
      hole.style.cssText = "display:block;left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px";
    } else { r = null; hole.style.display = "none"; }
    /* la carte se met en bas ; si elle cache l'élément pointé, elle passe en haut */
    card.classList.remove("top"); var cr = card.getBoundingClientRect();
    if (r && r.bottom > cr.top - 8 && r.top < cr.bottom && r.right > cr.left && r.left < cr.right) card.classList.add("top");
  }

  function paused() {
    if (BL.menu && BL.menu.visible && BL.menu.visible()) return true;
    var sh = $("sheet"); if (sh && !sh.hidden) return true;
    var md = doc.querySelector(".modal"); if (md && !md.hidden && md.offsetParent !== null) return true;
    return false;
  }
  function tick() {
    if (!active) return;
    var hide = paused(); root_.hidden = hide; if (hide) return;
    var st = STEPS[idx]; if (!st) return;
    if (!shown) { shown = true; render(); }
    if (st.done && !done && safeDone(st)) markDone(false);
    else if (typeof st.text === "function") { var tx = say(st); if (el.tutX.textContent !== tx) el.tutX.textContent = tx; }
    place();
  }

  function finish(mode) {
    clearTimeout(adv); active = false; if (root_) root_.hidden = true; if (hole) hole.style.display = "none";
    setStore(mode, 0);
    if (c && c.toast) c.toast(mode === "done" ? "Didacticiel terminé. Tu peux le revoir dans Paramètres." : "Didacticiel ignoré. Tu peux le lancer plus tard depuis Paramètres.", "ok");
  }

  /* start : lance (ou relance) le didacticiel. Sans effet sur la progression. */
  function start(from) {
    if (!c) return false; if (!root_) build(); active = true; idx = clampStep(from || 0); shown = false;
    setStore("todo", idx); root_.hidden = false; clearInterval(timer); timer = setInterval(tick, 250); go(idx, true); return true;
  }
  /* init : ctx = { state(), settings(), setting(k,v), go(view), money(n), toast(msg,kind) } */
  function init(ctx) {
    c = ctx; if (!root_) build();
    var s = c.settings(); if (shouldRun(s)) { active = true; idx = clampStep(s.tstep); shown = false; root_.hidden = true; clearInterval(timer); timer = setInterval(tick, 250); }
  }

  BL.tutorial = {
    STEPS: STEPS, init: init, start: start, stop: function () { if (active) finish("skipped"); },
    isActive: function () { return active; }, step: function () { return idx; },
    clampStep: clampStep, cleanMode: cleanMode, shouldRun: shouldRun, MODES: MODES,
    _debug: function () { return { active: active, idx: idx, done: done, hidden: root_ ? root_.hidden : null }; }
  };
})(typeof window !== "undefined" ? window : globalThis);
