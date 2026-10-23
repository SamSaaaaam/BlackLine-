/* Radio du jeu, façon autoradio de GTA : plusieurs stations, la radio est « en direct » (changer de station te fait
   rejoindre le morceau là où il en est, comme une vraie radio), bruit de réglage entre deux stations.
   Ce module contient les stations (données) et le moteur de lecture. L'interface est dans radio-ui.js. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var DIR = "assets/audio/radio/";
  var T = {
    lounge: { file: DIR + "night-summer-lounge.mp3", title: "Night Summer Lounge", artist: "Bransboynd", dur: 101.85 },
    jazz: { file: DIR + "jazz-club-new-orleans.mp3", title: "The Best Jazz Club in New Orleans", artist: "PaoloArgento", dur: 120.14 },
    beat: { file: DIR + "vlog-beat.mp3", title: "Vlog Beat", artist: "Vaitsez", dur: 133.41 },
    atlas: { file: DIR + "atlasaudio-jazz-music-617577.mp3", title: "Jazz Music", artist: "AtlasAudio", dur: 97.93 },
    nightjazz: { file: DIR + "aurec-night-jazz-604811.mp3", title: "Night Jazz", artist: "Aurec", dur: 179.64 },
    chops: { file: DIR + "coma-media-jazzy-abstract-beat-chops-11254.mp3", title: "Jazzy Abstract Beat (Chops)", artist: "Coma-Media", dur: 85.24 },
    weeknds: { file: DIR + "dayfox-weeknds-122592.mp3", title: "Weeknds", artist: "Dayfox", dur: 209.01 }
  };
  var STATIONS = [
    { id: "lounge", name: "Night Lounge FM", freq: "88.1", genre: "Lounge", desc: "Ambiance feutrée pour compter les billets.", col: "#6b8fd6", col2: "#1d2a4a", mono: "NL", kind: "file", tracks: [T.lounge, T.weeknds], seed: 11 },
    { id: "jazz", name: "Bourbon Jazz", freq: "101.7", genre: "Jazz", desc: "Le club le plus enfumé de La Nouvelle-Orléans.", col: "#e3a85a", col2: "#4a2a10", mono: "BJ", kind: "file", tracks: [T.jazz, T.atlas, T.nightjazz], seed: 47 },
    { id: "beat", name: "Beat Street", freq: "99.3", genre: "Beat", desc: "Rythmes de rue, pour garder le tempo.", col: "#e0584a", col2: "#40130f", mono: "BS", kind: "file", tracks: [T.beat, T.chops], seed: 83 },
    { id: "mix", name: "Blackline Mix", freq: "104.5", genre: "Mix", desc: "Toutes les stations en rotation, sans pause.", col: "#c8a24a", col2: "#2c2410", mono: "BM", kind: "file", tracks: [T.lounge, T.jazz, T.beat, T.weeknds, T.atlas, T.chops, T.nightjazz], seed: 5 },
    { id: "synth", name: "Blackline FM", freq: "92.0", genre: "Synthé", desc: "L’ambiance d’origine de la ville, générée en direct.", col: "#7fd6c8", col2: "#0f3a36", mono: "BF", kind: "synth", tracks: [{ file: "", title: "Ambiance de la ville", artist: "Blackline", dur: 0 }], seed: 0 },
    { id: "off", name: "Radio coupée", freq: "—", genre: "Silence", desc: "Aucune musique, seulement les bruitages.", col: "#8a8f99", col2: "#1b1d22", mono: "—", kind: "off", tracks: [], seed: 0 }
  ];
  var DEFAULT = "mix";
  var cfg = { sound: true, music: 0.6 }, cur = DEFAULT, manual = null, el = null, active = false, playing = null, playingSt = "", fade = 0, blocked = false, listeners = [], vol = 0, gain = 0, token = 0;

  function find(id) { for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === id) return STATIONS[i]; return null; }
  function valid(id) { return !!find(id); }
  function total(st) { var n = 0; st.tracks.forEach(function (t) { n += t.dur; }); return n; }
  /* Position « en direct » : quel morceau passe maintenant, et à quelle seconde. Dépend seulement de l'horloge,
     sauf si le joueur a choisi un morceau : la lecture démarre alors à 0 sur ce morceau (man = { id, i, t0 }) puis enchaîne. */
  function live(st, nowMs, man) {
    if (!st || st.kind !== "file" || !st.tracks.length) return null; var tot = total(st), p, i = 0;
    if (man && man.id === st.id && man.i >= 0 && man.i < st.tracks.length) { var off = 0; for (var k = 0; k < man.i; k++) off += st.tracks[k].dur; p = (off + 1e-6 + Math.max(0, nowMs - man.t0) / 1000) % tot; }
    else p = ((nowMs / 1000) + st.seed * 7.7) % tot;
    while (i < st.tracks.length - 1 && p >= st.tracks[i].dur) { p -= st.tracks[i].dur; i++; }
    return { i: i, at: Math.max(0, p), track: st.tracks[i], left: st.tracks[i].dur - p, chosen: !!(man && man.id === st.id) };
  }
  function emit() { listeners.forEach(function (f) { try { f(status()); } catch (e) {} }); }
  function status() { var st = find(cur), lv = live(st, Date.now(), manual); return { id: cur, station: st, live: lv, playing: !!playing && !!el && !el.paused, blocked: blocked, active: active }; }
  function handles() { var st = find(cur); return !!st && st.kind !== "synth"; }   /* la radio gère elle-même la lecture (fichiers ou silence) */

  function ensure() {
    if (el || !root.Audio) return el; el = new Audio(); el.preload = "auto"; el.loop = false;
    el.addEventListener("ended", function () { if (active) playLive(false); });
    el.addEventListener("error", function () { if (!playing) return; playing = null; blocked = false; if (BL.ui && BL.ui.toast) BL.ui.toast("Cette station est introuvable : retour à Blackline FM.", "evt"); tune("synth", true); });
    return el;
  }
  var dk = 1, dkT = 0;
  function setVol() { if (el) el.volume = Math.max(0, Math.min(1, vol * gain * dk)); }
  /* Ducking par le moteur de mixage (C17) : atténuation douce de la station fichier quand un son marquant joue (descente 60 ms, remontée progressive). */
  function duck(to, holdMs, relMs) { clearInterval(dkT); var from = dk, t0 = Date.now(), up = false, hold = Math.max(0, holdMs || 0), rel = Math.max(80, relMs || 600);
    dkT = setInterval(function () { var e = Date.now() - t0, k; if (e < 60) { k = e / 60; dk = from + (to - from) * k; } else if (e < 60 + hold) dk = to; else { k = Math.min(1, (e - 60 - hold) / rel); dk = to + (1 - to) * k; if (k >= 1) clearInterval(dkT); } setVol(); }, 40); }
  function rampTo(g, ms, done) {
    clearInterval(fade); var from = gain, t0 = Date.now(); if (ms <= 0) { gain = g; setVol(); done && done(); return; }
    fade = setInterval(function () { var k = Math.min(1, (Date.now() - t0) / ms); gain = from + (g - from) * k; setVol(); if (k >= 1) { clearInterval(fade); done && done(); } }, 40);
  }
  function playLive(first) {
    var st = find(cur); if (!st || st.kind !== "file" || !ensure()) return; var lv = live(st, Date.now(), manual), my = ++token;
    var tr = lv.track; playing = tr; playingSt = cur; var go = function () { if (my !== token) return; try { el.currentTime = Math.min(lv.at, Math.max(0, (el.duration || tr.dur) - 0.5)); } catch (e) {} var p = el.play(); if (p && p.then) p.then(function () { if (my === token) { blocked = false; emit(); } }).catch(function () { if (my === token) { blocked = true; emit(); } }); };
    var src = tr.file; if (el.getAttribute("data-src") !== src) { el.setAttribute("data-src", src); el.src = src; el.addEventListener("loadedmetadata", function once() { el.removeEventListener("loadedmetadata", once); go(); }); el.load(); } else go();
    gain = 0; setVol(); rampTo(1, first ? 900 : 500); emit();
  }
  function stopFile(ms) { token++; playing = null; playingSt = ""; if (!el) return; clearInterval(fade); var e = el; rampTo(0, ms == null ? 300 : ms, function () { if (!playing) { try { e.pause(); } catch (x) {} } }); }

  /* Le jeu est en cours (pas dans le menu) : la radio joue la station choisie. */
  function enter() { active = true; var st = find(cur); if (st && st.kind === "file") { if (!el || el.paused || !playing || playingSt !== cur) playLive(true); } else stopFile(200); emit(); }
  function leave() { active = false; stopFile(250); emit(); }
  /* Changer de station : bruit de réglage, puis on rejoint le morceau en cours. */
  function tune(id, silent) {
    if (!valid(id)) return false; var changed = id !== cur; cur = id; if (changed) manual = null; if (changed && BL.audio && !silent) BL.audio.sfx("tune");
    if (onTune && changed) onTune(id);
    if (BL.audio && active !== undefined && !(BL.menu && BL.menu.visible && BL.menu.visible())) BL.audio.play("game");   /* audio.js : choisit entre radio et synthé */
    else emit();
    return true;
  }
  var onTune = null;
  /* Lancer un morceau précis de la station en cours (il démarre à 0, puis la station enchaîne). */
  function playTrack(i) {
    var st = find(cur); if (!st || st.kind !== "file" || !(i >= 0 && i < st.tracks.length)) return false; manual = { id: st.id, i: i, t0: Date.now() };
    if (BL.audio && !(BL.menu && BL.menu.visible && BL.menu.visible())) BL.audio.play("game"); if (active) playLive(false); emit(); return true;
  }
  function step(d) { var i = 0; STATIONS.forEach(function (s, k) { if (s.id === cur) i = k; }); var n = STATIONS[(i + d + STATIONS.length) % STATIONS.length]; return tune(n.id); }
  function apply(s) {
    if (!s) return; var was = cfg.sound; cfg.sound = !!s.sound; cfg.music = typeof s.music === "number" ? s.music : cfg.music; vol = cfg.sound ? Math.max(0, Math.min(1, cfg.music)) : 0; setVol();
    if (s.radio && valid(s.radio) && s.radio !== cur) { cur = s.radio; if (active) tune(cur, true); } else if (s.radio && valid(s.radio) && !active && cur !== s.radio) cur = s.radio;
    if (el && playing && !cfg.sound) { try { el.pause(); } catch (e) {} } else if (el && playing && cfg.sound && !was && active) playLive(false);
  }
  function retry() { if (blocked && active) playLive(false); }
  var DOC = typeof document !== "undefined" && document.addEventListener ? document : null;
  if (DOC) ["pointerdown", "keydown", "touchstart"].forEach(function (e) { DOC.addEventListener(e, retry, true); });
  if (DOC) DOC.addEventListener("visibilitychange", function () { if (!el || !active) return; if (DOC.hidden) { try { el.pause(); } catch (e) {} } else if (playing && cfg.sound) playLive(false); });
  BL.radio = {
    STATIONS: STATIONS, DEFAULT: DEFAULT, find: find, valid: valid, live: live, total: total, status: status, handles: handles,
    enter: enter, leave: leave, duck: duck, tune: tune, playTrack: playTrack, step: step, apply: apply, retry: retry, current: function () { return cur; }, volume: function () { return { sound: cfg.sound, music: cfg.music }; },
    onChange: function (f) { listeners.push(f); }, onTune: function (f) { onTune = f; }, _el: function () { return el; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
