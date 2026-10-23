/* Scène d'opération (Partie 15) : rendu et contrôles. Ne décide de rien : lit la chronologie pure (BL.opsScene) calculée à partir d'un compte rendu déjà appliqué.
   Fermer, passer ou ne jamais la voir ne change rien au résultat. Animation : transform / opacity uniquement. Mouvement réduit : images fixes narrées. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, X = { open: false }, st = null;
  function $(id) { return doc.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function reduced() { return doc.body.classList.contains("nomotion") || !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function setting(k) { try { var s = BL.main && BL.main.settings && BL.main.settings(); return s ? s[k] : undefined; } catch (e) { return undefined; } }
  function first(id) { var m = BL.crew && BL.crew.get(id); return m ? String(m.name).split(" ")[0] : String(id); }
  function weaponOf(id) {
    try { var s = BL.main.state(), inv = BL.equip.st(s).inv, w = "pistol"; inv.forEach(function (x) { if (x.on === id) { var it = BL.equip.item(x.id); if (it && it.slot === "weapon") { if (/fusil|carabine|pompe|sniper|mitrail/i.test(it.name)) w = "rifle"; else if (/batte|couteau|lame|matraque|poing/i.test(it.name)) w = "bat"; } } }); return w; } catch (e) { return "pistol"; }
  }
  function sfx(n) { try { if (BL.audio && !st.mute) BL.audio.sfx(n); } catch (e) {} }
  function build() {
    var box = $("oscene"); if (box) return box;
    box = doc.createElement("div"); box.id = "oscene"; box.className = "oscene"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Scène de l’opération"); box.hidden = true;
    box.innerHTML = '<div class="osc-box"><div class="osc-ask" id="oscAsk" hidden><h2>Voir la scène de l’opération ?</h2><p>Une courte animation raconte ce qui s’est passé. Le résultat est déjà calculé : la voir ou non ne change rien. Tu pourras changer d’avis dans Système, rubrique « Graphismes et animations ».</p><div class="osc-asks"><button class="btn pri" id="oscAlways" type="button">Toujours voir</button><button class="btn" id="oscOnce" type="button">Voir cette fois</button><button class="btn" id="oscSumm" type="button">Résumé cette fois</button><button class="btn can" id="oscNever" type="button">Jamais</button></div></div><div class="osc-stage" id="oscStage"></div><p id="oscText" class="osc-text" aria-live="polite"></p><div class="osc-bar"><button class="btn" id="oscSpeed" type="button">Vitesse : normale</button><button class="btn can" id="oscSkip" type="button">Passer</button></div></div>';
    doc.body.appendChild(box);
    $("oscSkip").onclick = function () { finish(); };
    $("oscSpeed").onclick = function () { st.fast = !st.fast; this.textContent = "Vitesse : " + (st.fast ? "rapide" : "normale"); };
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(); return; }
      if (e.key === "Tab") { var f = [].filter.call(box.querySelectorAll("button"), function (b) { return !b.hidden && !b.disabled && b.offsetParent !== null; }); if (!f.length) return; var i = f.indexOf(doc.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    return box;
  }
  function fig(m, enemy, i, tag) {
    var d = doc.createElement("div"); d.className = "of " + (enemy ? "en" : "ally") + " pose-idle"; d.dataset.tag = tag;
    d.innerHTML = BL.opsSceneArt.figure({ look: m ? m.look : {}, weapon: enemy ? (i % 2 ? "rifle" : "pistol") : weaponOf(m && m.id), enemy: enemy });
    return d;
  }
  function pose(d, p) { if (!d) return; d.className = d.className.replace(/\bpose-\w+/g, "").trim() + " pose-" + p; }
  function place(d, x, y, flip) { d.style.transform = "translate3d(" + Math.round(x) + "px," + (y || 0) + "px,0)" + (flip ? " scaleX(-1)" : ""); }
  function layout() {
    var W = st.stage.clientWidth || 640, n = st.team.length, f = st.fam, j;
    st.sx = []; st.ex = [];
    for (var i = 0; i < n; i++) st.sx.push(W * (0.07 + i * 0.1));
    for (j = 0; j < st.tl.enemies; j++) st.ex.push(W * (f === "convoy" ? 0.74 - j * 0.07 : f === "heist" ? 0.64 - j * 0.08 : 0.76 - j * 0.085));
    st.W = W;
  }
  function tf(d, x, y, flip) { place(d, x, y, flip); }
  function say(t) { if (t) { $("oscText").textContent = t; } }
  function closeup(id, text) {
    if (st.low) return; var m = BL.crew.get(id), c = doc.createElement("div"); c.className = "osc-close"; c.innerHTML = '<div class="osc-rays"></div><div class="osc-pt">' + BL.portraits.portrait(m.look, { label: m.name, id: m.id }) + '</div><b>' + esc(text) + "</b>";
    st.stage.appendChild(c); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1100 / (st.fast ? 2 : 1));
  }
  /* Effets légers : petits <div> animés en transform/opacity, plafonnés, absents en « effets réduits » */
  function fxAt(el, cls, dx, dy) {
    if (st.low || !el) return; var ol = st.stage.querySelectorAll(".osc-fx"); if (ol.length > 14) return;
    var a = el.getBoundingClientRect(), s = st.stage.getBoundingClientRect(), d = doc.createElement("i"); d.className = "osc-fx " + cls;
    d.style.left = Math.round(a.left - s.left + a.width * (dx === undefined ? 0.5 : dx)) + "px"; d.style.top = Math.round(a.top - s.top + a.height * (dy === undefined ? 0.45 : dy)) + "px";
    st.stage.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 900);
  }
  function shake() { if (st.low || !st.world) return; st.world.classList.remove("shake"); void st.world.offsetWidth; st.world.classList.add("shake"); }
  function flash(el) { if (st.low || !st.mz) return; var a = el.getBoundingClientRect(), s = st.stage.getBoundingClientRect(); st.mz.style.transform = "translate3d(" + Math.round(a.left - s.left + a.width * 0.6 - 90) + "px," + Math.round(a.top - s.top + a.height * 0.4 - 90) + "px,0)"; st.mz.classList.remove("on"); void st.mz.offsetWidth; st.mz.classList.add("on"); }
  function showEnemies() { st.enemies.forEach(function (d) { d.classList.remove("hid"); }); }
  function apply(e) {
    var A = st.allies, E = st.enemies, i, f = st.fam, S = st.stage;
    if (e.k === "enter") {
      A.forEach(function (d, k) { place(d, st.sx[k], 0); pose(d, f === "heist" ? "cover" : "walk"); d.style.transition = "transform 2s linear"; place(d, st.sx[k] + st.W * 0.1, 0); }); sfx(f === "convoy" ? "engine" : "step");
      if (f === "convoy") { S.classList.add("moving"); if (st.truck) { st.truck.classList.add("run"); st.truck.style.transition = "transform 4s ease-out"; place(st.truck, st.W * 0.64, 0); } }
    }
    else if (e.k === "advance") { A.forEach(function (d, k) { pose(d, "walk"); d.style.transition = "transform 1.6s linear"; st.sx[k] += st.W * 0.07; place(d, st.sx[k], 0); }); sfx("step"); st.scroll += 1; S.style.setProperty("--pan", (st.scroll * -26) + "px"); }
    else if (e.k === "chase") { A.forEach(function (d, k) { pose(d, "walk"); d.style.transition = "transform 1.8s linear"; st.sx[k] += st.W * 0.06; place(d, st.sx[k], 0); }); sfx("engine"); }
    else if (e.k === "sneak") { A.forEach(function (d, k) { pose(d, "cover"); d.style.transition = "transform 2s linear"; st.sx[k] += st.W * 0.1; place(d, st.sx[k], 0); }); sfx("step"); }
    else if (e.k === "laser") { S.classList.add("lasers-on"); sfx("lock"); A.forEach(function (d, k) { d.style.transition = "transform 1.8s linear"; st.sx[k] += st.W * 0.05; place(d, st.sx[k], 0); }); }
    else if (e.k === "crack") { S.classList.remove("lasers-on"); S.classList.add("cracking"); var l = A[0]; if (l) { pose(l, "aim"); } sfx("lock"); }
    else if (e.k === "alarm") { S.classList.add("alarm"); showEnemies(); sfx("alarm"); shake(); }
    else if (e.k === "open") { S.classList.remove("cracking"); S.classList.add("opened"); sfx("metal"); shake(); if (!st.low) { var vd = S.querySelector(".vdoor"); fxAt(vd, "glint", 0.5, 0.5); setTimeout(function () { if (st) { sfx("lock"); shake(); } }, 450); } }
    else if (e.k === "cover") { A.forEach(function (d) { pose(d, "cover"); }); if (f === "raid") sfx("ricochet"); }
    else if (e.k === "shoot") { var d = A[st.team.indexOf(e.who)]; if (d) { pose(d, "shoot"); d.classList.remove("fire"); void d.offsetWidth; d.classList.add("fire"); sfx("shot"); flash(d); fxAt(d, "smoke", 0.75, 0.38); fxAt(d, "shell", 0.55, 0.4); setTimeout(function () { pose(d, "aim"); }, 260 / (st.fast ? 2 : 1)); } }
    else if (e.k === "recoil") { var en = E[e.target]; if (en) { en.classList.remove("rc"); void en.offsetWidth; en.classList.add("rc"); sfx(f === "convoy" ? "metal" : "hit"); fxAt(en, "spark"); } }
    else if (e.k === "enemyShoot") { var en2 = E[e.target]; if (en2) { pose(en2, "shoot"); en2.classList.remove("fire"); void en2.offsetWidth; en2.classList.add("fire"); sfx("shot"); flash(en2); fxAt(en2, "smoke", 0.2, 0.38); var tg = A[(e.target + 1) % A.length]; if (tg) { setTimeout(function () { if (st) { sfx(f === "heist" ? "glass" : "ricochet"); fxAt(tg, "spark", 0.5, 0.6); } }, 200); } } }
    else if (e.k === "hurt") { var d2 = A[st.team.indexOf(e.who)]; if (d2) { pose(d2, "hurt"); sfx("hit"); shake(); closeup(e.who, "Touché !"); } }
    else if (e.k === "tire") { sfx("tire"); if (st.truck) { st.truck.classList.add("wob"); fxAt(st.truck, "spark", 0.2, 0.8); } shake(); }
    else if (e.k === "stop") { S.classList.remove("moving"); if (st.truck) { st.truck.classList.remove("run", "wob"); st.truck.style.transition = "transform 1.2s ease-out"; place(st.truck, st.W * 0.66, 0); } sfx("metal"); }
    else if (e.k === "collapse") { var en3 = E[e.target]; if (en3) { showEnemies(); if (st.low) pose(en3, "down"); else { en3.classList.add("stag"); setTimeout(function () { if (st) { en3.classList.remove("stag"); pose(en3, "down"); } }, 320 / (st.fast ? 2 : 1)); } } }
    else if (e.k === "close") { closeup(e.who, "Coup éclatant !"); sfx("hit"); }
    else if (e.k === "loot") { if (!st.low) { var c = doc.createElement("div"); c.className = "osc-loot"; c.textContent = "◆ ◆ ◆"; S.appendChild(c); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1800); } sfx(st.tl.result.ok ? "success" : "error"); }
    else if (e.k === "victory") { S.classList.remove("moving", "alarm"); A.forEach(function (d) { if (!d.classList.contains("pose-hurt")) pose(d, "win"); }); }
    else if (e.k === "retreat") { sfx(f === "convoy" ? "engine" : "siren"); S.classList.remove("alarm"); if (f === "convoy") { S.classList.add("moving"); if (st.truck) { st.truck.classList.add("run"); st.truck.style.transition = "transform 3s ease-in"; place(st.truck, st.W * 1.2, 0); } } A.forEach(function (d, k) { if (!d.classList.contains("pose-hurt")) pose(d, "walk"); d.classList.add("back"); d.style.transition = "transform 1.8s ease-in"; place(d, -140, 0); }); }
    else if (e.k === "end") { finishSoon(); }
    if (e.text) say(e.text);
  }
  function finishSoon() { if (st.ended) return; st.ended = true; showSummary(); }
  function showSummary() {
    var r = st.report, o = st.op, t = BL.opsScene.summary(r, o, first);
    st.timer = null; if (st.raf) { root.cancelAnimationFrame(st.raf); st.raf = null; }
    say(t); $("oscSpeed").hidden = true; $("oscSkip").textContent = "Continuer"; $("oscSkip").focus(); $("oscSkip").dataset.done = "1";
    $("oscStage").classList.toggle("osc-win", !!r.ok); $("oscStage").classList.toggle("osc-lose", !r.ok);
  }
  function finish() {
    if (!st) return; if (st.ask) { $("oscSumm").click(); return; } if (!st.ended && !$("oscSkip").dataset.done) { st.ended = true; if (st.raf) { root.cancelAnimationFrame(st.raf); st.raf = null; } showSummary(); return; }
    var cb = st.done; if (st.raf) root.cancelAnimationFrame(st.raf); $("oscene").hidden = true; X.open = false; var prev = st.prevFocus; st = null; if (prev && prev.focus) try { prev.focus(); } catch (e) {}
    if (cb) cb();
  }
  /* Images fixes narrées (mouvement réduit) : 5 vues par famille, aucune animation */
  function staticFrames() {
    var tl = st.tl, A = st.allies, E = st.enemies, k = 0, f = st.fam, hurtTxt = tl.result.hurt.length ? tl.result.hurt.map(first).join(", ") + (tl.result.hurt.length > 1 ? " sont touchés" : " est touché(e)") + ", sans être perdu(e) : seulement indisponible un moment." : (tl.result.ok ? "Les adversaires lâchent prise." : "L’équipe encaisse sans casse.");
    var t1 = f === "convoy" ? "Le convoi apparaît ; l’équipe le rattrape sur la route." : f === "heist" ? "L’équipe se glisse dans le bâtiment et évite les faisceaux." : "Le groupe avance, puis se met à couvert derrière les voitures.";
    var t2 = f === "convoy" ? "Échange de tirs : " + first(st.team[0]) + " vise les pneus du convoi." : f === "heist" ? first(st.team[0]) + " s’attaque à la serrure du coffre." : "Échange de tirs : " + first(st.team[0]) + " tire, un ennemi recule.";
    var frames = [
      { t: tl.events[0].text, f: function () { A.forEach(function (d, i) { place(d, st.W * (0.1 + i * 0.1), 0); pose(d, "idle"); }); E.forEach(function (d, i) { place(d, st.ex[i], 0, true); pose(d, "idle"); if (f === "heist") d.classList.add("hid"); }); if (st.truck) place(st.truck, st.W * 0.64, 0); } },
      { t: t1, f: function () { A.forEach(function (d, i) { place(d, st.W * (0.25 + i * 0.09), 0); pose(d, f === "convoy" ? "walk" : "cover"); }); if (f === "heist") st.stage.classList.add("lasers-on"); } },
      { t: t2, f: function () { st.stage.classList.remove("lasers-on"); A.forEach(function (d) { pose(d, "aim"); }); if (A[0]) pose(A[0], "shoot"); if (f !== "heist") E.forEach(function (d, i) { place(d, st.ex[i] + (i === 0 ? 24 : 0), 0, true); }); } },
      { t: hurtTxt, f: function () { if (f === "heist" && (tl.result.hurt.length || !tl.result.ok)) { showEnemies(); st.stage.classList.add("alarm"); } tl.result.hurt.forEach(function (id) { pose(A[st.team.indexOf(id)], "hurt"); }); if (tl.result.ok) { showEnemies(); E.forEach(function (d) { pose(d, "down"); }); } if (f === "convoy" && st.truck) place(st.truck, st.W * 0.66, 0); } },
      { t: BL.opsScene.summary(st.report, st.op, first), f: function () { st.stage.classList.remove("alarm"); A.forEach(function (d) { if (!d.classList.contains("pose-hurt")) pose(d, tl.result.ok ? "win" : "idle"); }); $("oscSkip").textContent = "Continuer"; $("oscSkip").dataset.done = "1"; } }
    ];
    function show(i) { frames[i].f(); say("Image " + (i + 1) + " sur " + frames.length + " : " + frames[i].t); $("oscSkip").textContent = i === frames.length - 1 ? "Continuer" : "Image suivante"; }
    $("oscSpeed").hidden = true; show(0); var skip = $("oscSkip"); skip.onclick = function () { if (k >= frames.length - 1) { skip.dataset.done = "1"; finish(); return; } k++; show(k); };
  }
  function run() {
    var tl = st.tl, ev = tl.events, i = 0, t0 = null, last = null, clock = 0;
    function loop(ts) {
      if (!st || st.ended) return; if (last === null) last = ts; var dt = Math.min(0.1, (ts - last) / 1000); last = ts; clock += dt * (st.fast ? 2 : 1);
      while (i < ev.length && ev[i].t <= clock) { apply(ev[i]); i++; }
      st.raf = root.requestAnimationFrame(loop);
    }
    st.raf = root.requestAnimationFrame(loop);
  }
  function opts() { return { name: first, fem: function (id) { var m = BL.crew.get(id); return !!(m && m.look && m.look.female); } }; }
  function start(r, o, done) {
    var box = build(), tl = BL.opsScene.timeline(r, o, opts()), fi = BL.factions && o.fac ? BL.factions.info(o.fac) : null, f = tl.fam, acc = fi ? fi.color : "#c8a45e";
    st = { report: r, op: o, tl: tl, fam: f, team: tl.team, done: done, fast: false, low: setting("fx") === "low", mute: false, scroll: 0, prevFocus: st && st.prevFocus || doc.activeElement, ended: false };
    var stage = $("oscStage"); st.stage = stage; stage.className = "osc-stage fam-" + f;
    stage.innerHTML = '<div class="osc-world">' + (f === "convoy" ? BL.opsSceneArt.road(acc) : f === "heist" ? BL.opsSceneArt.vault(acc) : BL.opsSceneArt.street(acc)) + "</div>" + '<i class="osc-mz"></i><i class="osc-alarm"></i>';
    st.world = stage.firstChild; st.mz = stage.querySelector(".osc-mz");
    if (f === "convoy") { var tr = doc.createElement("div"); tr.className = "osc-truck"; tr.innerHTML = BL.opsSceneArt.truck(); st.world.appendChild(tr); st.truck = tr; }
    st.allies = []; st.enemies = [];
    tl.team.forEach(function (id, i) { var m = BL.crew.get(id); if (!m) return; var d = fig(m, null, i, id); st.world.appendChild(d); st.allies.push(d); });
    for (var j = 0; j < tl.enemies; j++) { var en = fi ? { color: fi.color, shape: fi.shape, fid: fi.id } : { color: "#8a8f99", fid: "x" }, d2 = fig({ look: { skin: ["#c9a07a", "#a87850", "#e0b898", "#8a5a3c"][j % 4], hair: "#1a1512" } }, en, j, "e" + j); if (f === "heist") d2.classList.add("hid"); st.world.appendChild(d2); st.enemies.push(d2); }
    if (!st.allies.length) { st = null; return false; }
    $("oscAsk").hidden = true; stage.hidden = false; $("oscText").hidden = false; $("oscSpeed").hidden = false; $("oscSpeed").textContent = "Vitesse : normale"; $("oscSkip").hidden = false; $("oscSkip").textContent = "Passer"; delete $("oscSkip").dataset.done; $("oscSkip").onclick = function () { finish(); };
    box.hidden = false; X.open = true; layout();
    st.allies.forEach(function (d, i) { place(d, -140 + i * 10, 0); d.style.transition = "none"; }); st.enemies.forEach(function (d, i) { d.style.transition = "none"; place(d, st.ex[i], 0, true); });
    if (st.truck) { st.truck.style.transition = "none"; place(st.truck, st.W * 1.05, 0); }
    stage.classList.toggle("lowfx", st.low); say(f === "convoy" ? "Interception d’un convoi" + (fi ? " de " + fi.name : "") + "." : f === "heist" ? "Braquage" + (fi ? " : " + fi.name : "") + "." : fi ? "Descente de quartier contre " + fi.name + "." : "Descente de quartier.");
    void stage.offsetWidth; st.allies.forEach(function (d) { d.style.transition = ""; });
    $("oscSkip").focus();
    if (reduced()) { st.reducedMode = true; stage.classList.add("static"); staticFrames(); } else run();
    return true;
  }
  /* Question posée une seule fois (réglage « Demander ») : montre la carte avant toute scène */
  function ask(r, o, done) {
    var box = build(); st = { ask: true, done: done, prevFocus: doc.activeElement, mute: true, ended: true };
    $("oscStage").hidden = true; $("oscText").hidden = true; $("oscSpeed").hidden = true; $("oscSkip").hidden = true; $("oscAsk").hidden = false; box.hidden = false; X.open = true;
    function leave(then) { $("oscAsk").hidden = true; var prev = st && st.prevFocus; st = null; if (then === "scene") { X.open = false; if (!start(r, o, done)) { box.hidden = true; X.open = false; if (done) done(); } else if (prev) st.prevFocus = prev; return; } box.hidden = true; X.open = false; if (prev && prev.focus) try { prev.focus(); } catch (e) {} if (done) done(); }
    function remember(v) { try { if (BL.main.setSetting) BL.main.setSetting("opscene", v); else BL.main.settings().opscene = v; } catch (e) {} }
    $("oscAlways").onclick = function () { remember("full"); leave("scene"); }; $("oscOnce").onclick = function () { leave("scene"); };
    $("oscSumm").onclick = function () { leave("none"); }; $("oscNever").onclick = function () { remember("off"); leave("none"); };
    $("oscAlways").focus();
  }
  /* r : compte rendu déjà appliqué ; o : opération ; done : appelé quand la scène se ferme (affiche alors le compte rendu habituel).
     Retourne true si une scène (ou la question) a été lancée, sinon l'appelant continue comme avant. */
  function play(r, o, done) {
    try {
      if (!r || !o || !/^(raid|heist)$/.test(o.fam) || !BL.opsScene || !BL.opsSceneArt || X.open || setting("opscene") === "off" || !(r.team && r.team.length)) return false;
      if (setting("opscene") === "ask") { ask(r, o, done); return true; }
      return start(r, o, done);
    } catch (e) { st = null; X.open = false; var bx = $("oscene"); if (bx) bx.hidden = true; return false; }
  }
  BL.opsSceneUI = { play: play, isOpen: function () { return X.open; }, skip: function () { if (st) { if (st.ask) { var b = $("oscSumm"); if (b) b.click(); } else finish(); } }, _state: function () { return st; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
