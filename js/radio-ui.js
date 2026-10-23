/* Radio (interface) : section « Radio » avec l'autoradio, roue de stations façon GTA (touche T ou bouton), carte « en écoute ». */
(function (root) {
  var BL = root.BL = root.BL || {}, h, u, R, $ = function (id) { return document.getElementById(id); }, uid = 0, lastOn = "mix", view = null, npT = 0, wheelOpen = false, tick = 0, lastSig = "", prevFocus = null;
  function el(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ""; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function logo(st, size) {
    var g = "rlg" + (++uid), f = st.kind === "off" ? "" : '<text x="32" y="56" text-anchor="middle" font-size="9" font-weight="700" fill="' + st.col + '" opacity=".85" font-family="IBM Plex Sans,sans-serif">' + st.freq + " FM</text>";
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + st.col2 + '"/><stop offset="1" stop-color="#0c0d10"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#' + g + ')"/><rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="' + st.col + '" stroke-opacity=".55" stroke-width="2"/><circle cx="32" cy="29" r="19" fill="none" stroke="' + st.col + '" stroke-opacity=".28" stroke-width="2"/><text x="32" y="' + (st.kind === "off" ? 37 : 36) + '" text-anchor="middle" font-size="' + (st.kind === "off" ? 24 : 21) + '" font-weight="800" fill="' + st.col + '" font-family="IBM Plex Sans,sans-serif">' + st.mono + "</text>" + f + "</svg>";
  }
  function eq(on) { return '<span class="eqz' + (on ? " on" : "") + '" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'; }
  function nowText(s) { var st = s.station; if (st.kind === "off") return "Aucune musique"; var tr = s.live ? s.live.track : st.tracks[0]; return tr.title + " — " + tr.artist; }


  /* ---------- liste des morceaux de la station ---------- */
  function origin(tr) { var a = ["lounge", "jazz", "beat"]; for (var i = 0; i < a.length; i++) { var st = R.find(a[i]); if (st.tracks.indexOf(tr) >= 0) return st; } return null; }
  function trItem(tr, i) { return '<li><button class="rtk" data-i="' + i + '" aria-label="Lancer ' + esc(tr.title) + '"><span class="rtk-n">' + eq(false) + '</span><span class="rtk-t"><b>' + esc(tr.title) + '</b><small>' + esc(tr.artist) + '</small></span><span class="rtk-d">' + mmss(tr.dur) + '</span></button></li>'; }
  function buildTracks(st) {
    var box = $("rdTr"); if (!box) return; if (st.kind !== "file") { box.hidden = true; box.innerHTML = ""; return; }
    var h2 = '<h2 id="rdTrH">Morceaux de la station</h2><p class="muted rtr-sub">' + st.tracks.length + ' morceaux · ' + mmss(R.total(st)) + ' au total. Clique sur un titre pour l’écouter depuis le début.</p>', body = "";
    if (st.id === "mix") {
      ["lounge", "jazz", "beat"].forEach(function (id) { var o = R.find(id), l = ""; o.tracks.forEach(function (tr) { var i = st.tracks.indexOf(tr); if (i >= 0) l += trItem(tr, i); }); if (l) body += '<h3 class="rtr-g"><i style="background:' + o.col + '"></i>' + esc(o.name) + '</h3><ul class="rtr-l">' + l + '</ul>'; });
    } else body = '<ul class="rtr-l">' + st.tracks.map(trItem).join("") + "</ul>";
    box.innerHTML = h2 + body; box.hidden = false;
    Array.prototype.forEach.call(box.querySelectorAll(".rtk"), function (b) { b.onclick = function () { R.playTrack(+b.dataset.i); }; });
  }
  function markTracks(s) {
    var box = $("rdTr"); if (!box || box.hidden) return; var chosen = s.live && s.live.chosen;
    Array.prototype.forEach.call(box.querySelectorAll(".rtk"), function (b) { var on = s.live && +b.dataset.i === s.live.i; b.classList.toggle("on", !!on); b.setAttribute("aria-current", on ? "true" : "false"); var e = b.querySelector(".eqz"); if (e) e.classList.toggle("on", !!on && s.playing); });
    var sub = box.querySelector(".rtr-sub"); if (sub && s.station.kind === "file") sub.dataset.chosen = chosen ? "1" : "";
  }

  /* ---------- section Radio ---------- */
  function build() {
    view = $("v_radio"); if (!view) return;
    view.innerHTML = '<div class="rdeck" id="rdDeck"></div><section class="rtr card" id="rdTr" hidden aria-labelledby="rdTrH"></section><div class="rlist" id="rdList" role="list"></div><p class="rcred muted">Musiques fournies pour le jeu : « Night Summer Lounge » (Bransboynd), « The Best Jazz Club in New Orleans » (PaoloArgento), « Vlog Beat » (Vaitsez). Blackline FM est générée par le jeu. La radio est « en direct » : en changeant de station, tu rejoins le morceau là où il en est.</p>';
    var deck = $("rdDeck");
    deck.innerHTML = '<div class="rd-top"><div class="rd-logo" id="rdLogo"></div><div class="rd-main"><div class="rd-live" id="rdLive"></div><div class="rd-name" id="rdName"></div><div class="rd-now" id="rdNow"></div></div><div class="rd-freq"><b id="rdFreq"></b><small>FM</small></div></div>' +
      '<div class="rd-bar"><i id="rdBar"></i></div><div class="rd-time muted"><span id="rdAt"></span><span id="rdLeft"></span></div>' +
      '<div class="rd-ctl"><button class="btn ghost" id="rdPrev" aria-label="Station précédente">◀ Précédente</button><button class="btn" id="rdPower" aria-label="Couper ou rallumer la radio"></button><button class="btn ghost" id="rdNext" aria-label="Station suivante">Suivante ▶</button><label class="rd-vol"><span>Volume</span><input type="range" id="rdVol" min="0" max="100" step="1" aria-label="Volume de la musique"><output id="rdVolO"></output></label><button class="btn ghost" id="rdWheel">Roue des stations <kbd>T</kbd></button></div>';
    var list = $("rdList"); R.STATIONS.forEach(function (st) {
      var b = el("button", "rs", ""); b.dataset.id = st.id; b.setAttribute("role", "listitem"); b.innerHTML = '<span class="rs-l">' + logo(st, 54) + '</span><span class="rs-t"><b>' + esc(st.name) + '</b><small>' + (st.kind === "off" ? "Silence" : st.freq + " FM · " + esc(st.genre)) + '</small><em>' + esc(st.desc) + '</em></span><span class="rs-e"></span>';
      b.onclick = function () { tune(st.id); }; list.appendChild(b);
    });
    $("rdPrev").onclick = function () { R.step(-1); }; $("rdNext").onclick = function () { R.step(1); };
    $("rdPower").onclick = function () { var s = R.status(); if (s.id === "off") tune(lastOn || "mix"); else { lastOn = s.id; tune("off"); } };
    $("rdVol").oninput = function (e) { h.setting("music", +e.target.value / 100); $("rdVolO").textContent = e.target.value + " %"; };
    $("rdWheel").onclick = function () { openWheel(); };
  }
  function tune(id) { if (id !== "off") lastOn = id; R.tune(id); }
  function render(force) {
    var s = R.status(), st = s.station, pc = R.volume(), sig = s.id + "|" + (s.live ? s.live.i + (s.live.chosen ? "c" : "") : "") + "|" + s.playing + "|" + s.blocked + "|" + pc.sound + "|" + Math.round(pc.music * 100);
    if (view && !view.hidden) {
      var live = s.live, off = st.kind === "off";
      if (view.dataset.id !== s.id) { view.dataset.id = s.id; buildTracks(st); $("rdLogo").innerHTML = logo(st, 92); $("rdName").textContent = st.name; $("rdFreq").textContent = off ? "—" : st.freq; Array.prototype.forEach.call($("rdList").children, function (b) { var on = b.dataset.id === s.id; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "true" : "false"); }); }
      markTracks(s); $("rdNow").textContent = nowText(s); $("rdLive").innerHTML = (off ? "Radio coupée" : s.blocked ? "Touche l’écran pour lancer le son" : s.live && s.live.chosen ? '<i class="dot"></i>Ton choix' : '<i class="dot"></i>En direct') + eq(s.playing || (st.kind === "synth" && pc.sound));
      BL.bar($("rdBar"), live ? Math.round(live.at / live.track.dur * 100) : off ? 0 : 100); $("rdAt").textContent = live ? mmss(live.at) : ""; $("rdLeft").textContent = live ? "−" + mmss(live.left) : "";
      $("rdPower").textContent = off ? "Rallumer" : "Couper"; var v = $("rdVol"); if (document.activeElement !== v) { v.value = Math.round(pc.music * 100); $("rdVolO").textContent = v.value + " %"; v.disabled = !pc.sound; }
      Array.prototype.forEach.call($("rdList").children, function (b) { var e = b.querySelector(".rs-e"), cur = b.dataset.id === s.id, html = cur && !off ? eq(s.playing || st.kind === "synth") + "<small>En écoute</small>" : ""; if (e.dataset.h !== html) { e.dataset.h = html; e.innerHTML = html; } });
    }
    if (wheelOpen) wheelText();
    lastSig = sig;
  }
  function update() { if (view && !view.hidden || wheelOpen) { var t = Date.now(); if (t - tick > 400) { tick = t; render(); } } }

  /* ---------- carte « en écoute » ---------- */
  function showNP() {
    var s = R.status(), st = s.station, n = $("np"); if (!n || (BL.menu && BL.menu.visible && BL.menu.visible())) return;
    n.innerHTML = '<span class="np-l">' + logo(st, 46) + '</span><span class="np-t"><small>' + (st.kind === "off" ? "Radio" : "En écoute · " + st.freq + " FM") + "</small><b>" + esc(st.name) + "</b><span>" + (st.kind === "off" ? "Coupée" : "♪ " + esc(nowText(s))) + "</span></span>" + eq(st.kind !== "off");
    n.hidden = false; n.classList.remove("show"); void n.offsetWidth; n.classList.add("show"); clearTimeout(npT); npT = setTimeout(function () { n.classList.remove("show"); setTimeout(function () { if (!n.classList.contains("show")) n.hidden = true; }, 400); }, 4200);
  }

  /* ---------- roue des stations ---------- */
  function buildWheel() {
    var w = $("rwheel"); if (!w) return; var st = R.STATIONS, n = st.length, items = "";
    st.forEach(function (s, i) { var a = -90 + i * 360 / n, x = 50 + 37 * Math.cos(a * Math.PI / 180), y = 50 + 37 * Math.sin(a * Math.PI / 180); items += '<button class="rw-i" data-id="' + s.id + '" style="left:' + x + "%;top:" + y + '%" aria-label="' + esc(s.name) + (s.kind === "file" || s.kind === "synth" ? ", " + s.freq + " FM" : "") + '">' + logo(s, 64) + "<span>" + esc(s.name) + "</span></button>"; });
    w.innerHTML = '<div class="rw-back"></div><div class="rw" role="dialog" aria-modal="true" aria-label="Radio : choisis une station"><div class="rw-ring">' + items + '<div class="rw-mid"><small>Radio</small><b id="rwN"></b><span id="rwT"></span></div></div><button class="rw-x" aria-label="Fermer la radio">&times;</button></div><p class="rw-hint">Flèches : choisir · Entrée ou clic : écouter · Échap : fermer</p>';
    w.querySelector(".rw-back").onclick = closeWheel; w.querySelector(".rw-x").onclick = closeWheel;
    Array.prototype.forEach.call(w.querySelectorAll(".rw-i"), function (b) {
      b.onclick = function () { tune(b.dataset.id); setTimeout(closeWheel, 450); }; b.onmouseenter = b.onfocus = function () { wheelText(b.dataset.id); };
    });
  }
  function wheelText(id) {
    var s = R.status(), st = R.find(id || s.id), cur = st.id === s.id; $("rwN").textContent = st.name; $("rwT").textContent = st.kind === "off" ? "Silence" : cur ? "♪ " + nowText(s) : st.genre + " · " + st.freq + " FM";
    Array.prototype.forEach.call($("rwheel").querySelectorAll(".rw-i"), function (b) { b.classList.toggle("on", b.dataset.id === s.id); });
  }
  function openWheel() {
    if (wheelOpen || (BL.menu && BL.menu.visible && BL.menu.visible())) return; var w = $("rwheel"); if (!w) return; wheelOpen = true; prevFocus = document.activeElement; w.hidden = false; void w.offsetWidth; w.classList.add("show"); wheelText();
    var c = w.querySelector(".rw-i.on") || w.querySelector(".rw-i"); c && c.focus({ preventScroll: true }); if (BL.audio) BL.audio.sfx("open");
  }
  function closeWheel() { if (!wheelOpen) return; wheelOpen = false; var w = $("rwheel"); w.classList.remove("show"); setTimeout(function () { if (!wheelOpen) w.hidden = true; }, 220); if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {} }
  function key(e) {
    var tg = document.activeElement && document.activeElement.tagName, typing = /INPUT|TEXTAREA|SELECT/.test(tg || "") && document.activeElement.type !== "range";
    if (wheelOpen) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeWheel(); return; }
      var its = Array.prototype.slice.call($("rwheel").querySelectorAll(".rw-i")), i = its.indexOf(document.activeElement), d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (d) { e.preventDefault(); its[(i + d + its.length) % its.length].focus(); } else if (e.key === "t" || e.key === "T") { e.preventDefault(); closeWheel(); } return;
    }
    if ((e.key === "t" || e.key === "T") && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { var m = $("modal"), sh = $("sheet"); if ((m && !m.hidden) || (sh && !sh.hidden)) return; e.preventDefault(); openWheel(); }
  }
  function init(handlers, util) {
    h = handlers; u = util; R = BL.radio; build(); buildWheel(); R.onChange(function () { render(); }); R.onTune(function (id) { h.setting("radio", id); showNP(); });
    document.addEventListener("keydown", key, true);
    var b = $("radioBtn"); if (b) b.onclick = openWheel;
  }
  BL.radioUI = { init: init, update: update, render: render, openWheel: openWheel, closeWheel: closeWheel, isWheelOpen: function () { return wheelOpen; }, showNP: showNP };
})(window);
