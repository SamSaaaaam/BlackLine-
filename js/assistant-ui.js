/* Interface de l'assistante (Inès) : petit portrait ancré en bas de l'écran + bulle de dialogue avec 1 ou 2 boutons réels.
   Toutes les décisions (quand parler, quoi dire) viennent du moteur BL.assistant ; ici : affichage, placement, et exécution des boutons
   par les VRAIES fonctions du jeu (main.js). Jamais de bulle pendant le menu, un panneau, le didacticiel, le QG, une bannière ou la roue radio. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var doc = root.document, A = null, eng = null, c = null, el = {}, built = false, modeSetting = "on", curKey = "", manual = null, hold = false, lastScan = 0, openRecap = false, lastPlace = "", lastSig = "";
  function $(id) { return doc.getElementById(id); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[m]; }); }
  function portrait(label) { return BL.portraits ? BL.portraits.portrait(A.PERSON.look, { label: label || A.PERSON.full }) : ""; }

  function build() {
    A = BL.assistant; var r = doc.createElement("aside"); r.id = "asst"; r.hidden = true; r.setAttribute("aria-label", "Assistante");
    r.innerHTML = '<button type="button" class="asstbtn" id="asstBtn" aria-label="' + A.PERSON.name + ', ton assistante : afficher le récapitulatif" title="' + A.PERSON.name + ' : où en est-on ?">' + portrait() + '</button>' +
      '<section class="asstbub" id="asstBub" role="status" aria-live="polite" hidden>' +
      '<div class="ab-p" id="asstPic" role="button" tabindex="0" aria-label="Voir le récapitulatif de ' + A.PERSON.name + '">' + portrait() + '</div>' +
      '<div class="ab-b"><small>' + A.PERSON.name + ' · ' + A.PERSON.role + '</small><p class="ab-t" id="asstT"></p><p class="ab-a" id="asstA"></p><dl class="ab-r" id="asstR" hidden></dl>' +
      '<div class="ab-btn"><button type="button" class="btn ab-go" id="asstGo"></button><button type="button" class="btn ghost ab-later" id="asstLater">Plus tard</button></div></div>' +
      '<button type="button" class="ab-x" id="asstX" aria-label="Fermer la bulle">×</button></section>';
    doc.body.appendChild(r); el.root = r;
    ["asstBtn", "asstBub", "asstPic", "asstT", "asstA", "asstR", "asstGo", "asstLater", "asstX"].forEach(function (k) { el[k] = $(k); });
    el.asstBtn.onclick = function () { showManual(); };
    el.asstPic.onclick = function () { toggleRecap(); }; el.asstPic.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRecap(); } };
    el.asstT.onclick = el.asstA.onclick = function () { toggleRecap(); };
    el.asstLater.onclick = function () { closeCur("later"); }; el.asstX.onclick = function () { closeCur("later"); };
    el.asstGo.onclick = function () { runAction(); };
    el.asstBub.addEventListener("pointerenter", function () { hold = true; }); el.asstBub.addEventListener("pointerleave", function () { hold = false; });
    el.asstBub.addEventListener("focusin", function () { hold = true; }); el.asstBub.addEventListener("focusout", function () { hold = false; });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.asstBub.hidden && el.asstBub.contains(doc.activeElement)) { e.stopPropagation(); closeCur("later"); } }, true);
    root.addEventListener("resize", place); built = true;
  }

  /* ---------- exécution des boutons : vraies actions du jeu ---------- */
  function runAction() {
    var cu = eng.current(), btn = manual ? null : cu && cu.buttons && cu.buttons[0]; if (!btn) { closeManual(); return; }
    var run = btn.run, h = c.handlers();
    if (run === "defend") h.defend(); else if (run === "truce") h.truce();
    else if (run && run.claim) h.claim(run.claim); else if (run && run.build) h.buyBuilding(run.build);
    else if (run && run.go) { if (BL.notify && BL.notify.jump && run.go === "terr" && cu.type === "attack") { var cf = c.state().terr.conflict; if (cf) BL.notify.jump({ type: "district", id: cf.did }); else c.go("terr"); } else c.go(run.go); }
    closeCur("action");
  }
  function closeCur(why) { if (manual) { closeManual(); return; } if (eng) eng.close(why); curKey = ""; lastSig = ""; render(); }
  function closeManual() { manual = null; openRecap = false; lastSig = ""; render(); }
  function showManual() { if (blocked()) return; manual = { until: Date.now() + 16000 }; openRecap = true; lastSig = ""; render(); }
  function toggleRecap() { openRecap = !openRecap; if (manual && !openRecap) { closeManual(); return; } renderRecap(); place(); if (eng.current()) eng.extend(8000); }

  /* ---------- affichage ---------- */
  function renderRecap() {
    var rows = el.asstR; if (!openRecap) { rows.hidden = true; rows.innerHTML = ""; return; }
    var list = A.recap(c.state(), { money: c.money }); rows.innerHTML = list.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join(""); rows.hidden = !list.length;
  }
  function render() {
    if (!built) return; var cu = eng && eng.current(), b = el.asstBub, shown = !!(cu || manual);
    el.asstBtn.hidden = shown || modeSetting === "off" || blocked();
    if (!shown) { b.hidden = true; b.classList.remove("show"); el.root.hidden = el.asstBtn.hidden; curKey = ""; return; }
    el.root.hidden = false; b.hidden = false;
    if (manual) {
      el.asstT.textContent = "Patron, voici où en est l’empire."; el.asstA.textContent = ""; el.asstA.hidden = true; el.asstGo.hidden = true; el.asstLater.textContent = "Fermer"; renderRecap();
    } else {
      var k = cu.key + "|" + cu.shownAt; if (k !== curKey) { curKey = k; openRecap = false; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show"); }
      el.asstT.textContent = cu.text; el.asstA.textContent = cu.advice || ""; el.asstA.hidden = !cu.advice;
      var btn = cu.buttons && cu.buttons[0]; el.asstGo.hidden = !btn; el.asstGo.textContent = btn ? btn.label : ""; el.asstLater.textContent = "Plus tard"; renderRecap();
    }
    b.setAttribute("data-type", cu ? cu.type : "recap"); place();
  }
  /* ancrage : coin bas-gauche de la zone principale, au-dessus du bandeau de raccourcis de la carte s'il est visible */
  function place() {
    if (!built || !el.root) return; var vw = root.innerWidth, vh = root.innerHeight, left = 12, bottom = 12;
    var side = $("side"); if (vw > 900 && side) left = Math.round(side.getBoundingClientRect().right) + 14;
    var dk = doc.querySelector(".mdock"); if (dk && dk.offsetParent !== null) { var r = dk.getBoundingClientRect(); if (r.height > 0 && r.top > vh * 0.55 && r.top < vh) bottom = Math.max(bottom, Math.round(vh - r.top + 8)); }
    var key = left + "|" + bottom; if (key !== lastPlace) { lastPlace = key; el.root.style.setProperty("--al", left + "px"); el.root.style.setProperty("--ab", bottom + "px"); }
  }

  /* ---------- quand ne PAS parler ---------- */
  function blocked() {
    if (doc.hidden) return true;
    if (BL.menu && BL.menu.visible && BL.menu.visible()) return true;
    var mn = $("menu"); if (mn && !mn.hidden) return true;                             /* même pendant le fondu de fermeture du menu */
    var sh = $("sheet"); if (sh && !sh.hidden) return true;
    var md = doc.querySelector(".modal"); if (md && !md.hidden && md.offsetParent !== null) return true;
    if (BL.tutorial && BL.tutorial.isActive()) return true;
    if (BL.roomUI && BL.roomUI.isOpen()) return true;                                   /* QG (placement compris) : silence */
    if (BL.notify && BL.notify.pending && BL.notify.pending() > 0) return true;         /* une bannière est à l'écran ou attend : elle passe d'abord */
    if (BL.radioUI && BL.radioUI.isWheelOpen && BL.radioUI.isWheelOpen()) return true;
    return false;
  }

  /* appelée par main.js à chaque pas de jeu : légère, travaille au plus une fois par seconde */
  function tick(s) {
    if (!built || !eng) return; var t = Date.now(); if (t - lastScan < 1000) return; lastScan = t;
    if (modeSetting === "off") { if (!el.root.hidden) { el.root.hidden = true; el.asstBub.hidden = true; } return; }
    eng.scan(s); var bl = blocked();
    if (manual) { if (bl || t > manual.until && !hold) closeManual(); else render(); return; }
    var cu = eng.current(); if (cu && bl) { eng.close("blocked"); cu = null; }               /* le menu s'ouvre : elle se tait, l'alerte pourra revenir peu après */
    cu = eng.next(s, { blocked: bl }); if (cu && hold) eng.extend(4000);
    var sig = (cu ? cu.key + "|" + cu.shownAt : "") + "|" + (bl ? 1 : 0) + "|" + modeSetting; if (sig !== lastSig) { lastSig = sig; render(); } else place();
  }

  function init(ctx) { c = ctx; if (!built) build(); eng = A.create({ money: ctx.money }); eng.setMode(modeSetting); render(); }
  function setMode(m) { modeSetting = m === "quiet" || m === "off" ? m : "on"; if (eng) { eng.setMode(modeSetting); if (modeSetting === "off") { manual = null; curKey = ""; } render(); } }

  /* remet moteur ET affichage à zéro (utilisé par les tests et pour rejouer une alerte) */
  function reset() { if (eng) eng.reset(); manual = null; curKey = ""; lastSig = ""; lastScan = 0; openRecap = false; hold = false; render(); }
  BL.assistantUI = { init: init, reset: reset, tick: tick, setMode: setMode, show: showManual, blocked: blocked, engine: function () { return eng; }, _debug: function () { return { cur: eng && eng.current(), manual: manual, built: built, hidden: el.root ? el.root.hidden : null }; } };
})(typeof window !== "undefined" ? window : globalThis);
