/* Gestionnaire audio central : musique du menu, musique du jeu, effets, volumes séparés, coupure globale, fondus enchaînés.
   - Par défaut tout est SYNTHÉTISÉ par le code (Web Audio) : aucun fichier requis, aucune licence à gérer.
   - Pour utiliser tes propres fichiers (libres de droits / originaux), dépose-les dans assets/audio/ puis passe USE_FILES à true.
     Si un fichier est introuvable, le jeu retombe automatiquement sur la version synthétisée.
   - Le navigateur interdit de lancer du son avant un geste du joueur : la musique démarre au premier clic / touche. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var USE_FILES = false;
  var FILES = { menu: "assets/audio/menu-music.mp3", game: "assets/audio/game-music.mp3", click: "assets/audio/ui-click.mp3", buy: "assets/audio/purchase.mp3" };
  var FADE = 1.6, MUSIC_LEVEL = 0.5;
  var lastEl = null, cfg = { sound: true, music: 0.6, sfx: 0.7, amb: 0.5, ambient: true }, ambBus = null, ctx = null, master = null, musBus = null, sfxBus = null, verb = null, noiseBuf = null, musDuck = null, ambDuck = null, softDuck = null, softBus = null, majorBus = null;
  var want = null, cur = null, intensity = 0, unlocked = false, rng = mulberry(7), fileTracks = {};

  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---------- graphe audio ---------- */
  function ensure() {
    if (ctx) return true; var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { ctx = null; return false; }
    master = ctx.createGain(); musBus = ctx.createGain(); sfxBus = ctx.createGain(); ambBus = ctx.createGain();
    /* limiteur doux en sortie : aucune saturation même en rafale */
    var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -14; lim.knee.value = 12; lim.ratio.value = 6; lim.attack.value = 0.004; lim.release.value = 0.22; master.connect(lim); lim.connect(ctx.destination);
    /* ducking : chaque famille passe par un gain « duck » piloté par les sons marquants (C17) */
    musDuck = ctx.createGain(); ambDuck = ctx.createGain(); softDuck = ctx.createGain(); softBus = ctx.createGain(); majorBus = ctx.createGain(); softBus.gain.value = 0.85;
    musBus.connect(musDuck); musDuck.connect(master); ambBus.connect(ambDuck); ambDuck.connect(master); softBus.connect(softDuck); softDuck.connect(sfxBus); majorBus.connect(sfxBus); sfxBus.connect(master);
    var len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);                       /* réverbération : bruit à décroissance exponentielle */
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb = ctx.createConvolver(); verb.buffer = ir; var vg = ctx.createGain(); vg.gain.value = 0.35; verb.connect(vg); vg.connect(musBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var nd = noiseBuf.getChannelData(0); for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    levels(); return true;
  }
  function levels() {
    if (!ctx) return; var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(cfg.sound ? 1 : 0, t, 0.03);
    musBus.gain.setTargetAtTime(cfg.music * MUSIC_LEVEL, t, 0.05); sfxBus.gain.setTargetAtTime(cfg.sfx * 0.9, t, 0.05); ambBus.gain.setTargetAtTime(cfg.ambient ? cfg.amb * 0.8 : 0, t, 0.08);
    Object.keys(fileTracks).forEach(function (k) { applyFile(fileTracks[k]); });
  }

  /* ---------- instruments ---------- */
  function env(g, t, a, d, peak, sus) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * (sus || 0.0001)), t + a + d); }
  function osc(type, f, t, dur, dest, peak, att, filt, send) {
    var o = ctx.createOscillator(), g = ctx.createGain(), out = g; o.type = type; o.frequency.setValueAtTime(f, t);
    if (filt) { var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = filt; g.connect(lp); out = lp; }
    env(g, t, att || 0.01, dur, peak, 0.0001); o.connect(g); out.connect(dest); if (send && verb) { var s = ctx.createGain(); s.gain.value = send; out.connect(s); s.connect(verb); }
    o.start(t); o.stop(t + dur + (att || 0.01) + 0.05); return o;
  }
  function rhodes(m, t, dur, v, dest) { var f = hz(m); osc("sine", f, t, dur, dest, v, 0.008, 2600, 0.5); osc("triangle", f * 2, t, dur * 0.5, dest, v * 0.25, 0.005, 3000, 0.4); osc("sine", f * 5.01, t, 0.25, dest, v * 0.1, 0.002, 6000, 0.2); }
  function bass(m, t, dur, v, dest) { var f = hz(m); osc("sine", f, t, dur, dest, v, 0.012, 500, 0); osc("triangle", f * 2, t, dur * 0.6, dest, v * 0.28, 0.01, 700, 0); }
  function pad(ms, t, dur, v, dest) { ms.forEach(function (m) { [-7, 7].forEach(function (c) { var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = c; lp.type = "lowpass"; lp.frequency.value = 650;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(lp); lp.connect(g); g.connect(dest); var s = ctx.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(verb); o.start(t); o.stop(t + dur + 0.1); }); }); }
  function noise(t, dur, type, f, v, dest, q) { var s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; if (q) fl.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, rng() * 0.5); s.stop(t + dur + 0.02); }
  function kick(t, v, dest) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.32); }
  function lead(m, t, dur, v, dest) { var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain(); o.type = "triangle"; o.frequency.value = hz(m); lfo.frequency.value = 5.2; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.detune);
    lp.type = "lowpass"; lp.frequency.value = 1900; env(g, t, 0.05, dur, v, 0.0001); o.connect(lp); lp.connect(g); g.connect(dest); var s = ctx.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(verb); o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1); }

  /* ---------- casino : briques sonores (Partie 13 bis) ---------- */
  function loopNoise(t, dur, type, f, v, dest, q) { var s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; if (q) fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.08); g.gain.setValueAtTime(v, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, dur)); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.05); return { f: fl, g: g }; }
  function coin(t, d, v, send) { var f = 2400 + rng() * 1800, p = v || 0.12; osc("sine", f, t, 0.24, d, p, 0.001, 8500, send === undefined ? 0.3 : send); osc("sine", f * 2.76, t, 0.08, d, p * 0.35, 0.001, 9500, 0); osc("triangle", f * 1.5, t + 0.012, 0.13, d, p * 0.3, 0.001, 8500, 0); }
  function chip(t, d, v) { var p = v || 1, f = 2000 + rng() * 500; noise(t, 0.03, "bandpass", 3000 + rng() * 500, 0.22 * p, d, 2.2); osc("triangle", f, t, 0.05, d, 0.12 * p, 0.001, 5200, 0); osc("sine", 620, t + 0.004, 0.05, d, 0.08 * p, 0.001, 1800, 0.05); }
  function cardSound(t, d, kind) {
    if (kind === "flip") { noise(t, 0.05, "bandpass", 6500, 0.13, d, 1.2); noise(t + 0.045, 0.035, "lowpass", 2200, 0.15, d); return; }
    noise(t, 0.11, "bandpass", 5200, 0.15, d, 0.7); noise(t + 0.015, 0.06, "highpass", 3000, 0.09, d); noise(t + 0.085, 0.035, "lowpass", 1800, 0.2, d); osc("sine", 190, t + 0.088, 0.05, d, 0.08, 0.002, 600, 0);
  }
  function riffle(t, d) { var i; for (i = 0; i < 16; i++) noise(t + i * 0.042 + rng() * 0.01, 0.05, "bandpass", 3600 + rng() * 2400, 0.09, d, 0.8); for (i = 0; i < 8; i++) noise(t + 0.72 + i * 0.026, 0.04, "bandpass", 4200 + rng() * 2000, 0.1, d, 1); noise(t + 0.98, 0.07, "lowpass", 1500, 0.2, d); osc("sine", 140, t + 0.98, 0.06, d, 0.1, 0.002, 500, 0); }
  function bell(m, t, dur, v, d) { var f = hz(m); osc("sine", f, t, dur, d, v, 0.002, 9000, 0.45); osc("sine", f * 2.76, t, dur * 0.4, d, v * 0.3, 0.002, 9500, 0.3); osc("triangle", f * 4.07, t, dur * 0.2, d, v * 0.12, 0.002, 9500, 0.2); }
  function brass(m, t, dur, v, d) { var f = hz(m); osc("sawtooth", f, t, dur, d, v, 0.03, 2600, 0.25); osc("square", f / 2, t, dur, d, v * 0.35, 0.04, 1200, 0.2); }
  function coinShower(t, n, span, d, v) { for (var i = 0; i < n; i++) coin(t + Math.pow(rng(), 0.8) * span, d, v || 0.09, 0.35); }
  function winSound(kind, t, d) {
    var i;
    if (kind === "winSmall") { [72, 76, 79].forEach(function (m, k) { bell(m, t + k * 0.07, 0.35, 0.12, d); }); coinShower(t + 0.1, 6, 0.5, d, 0.08); }
    else if (kind === "winMed") { [67, 72, 76, 79, 84].forEach(function (m, k) { bell(m, t + k * 0.07, 0.4, 0.12, d); }); coinShower(t + 0.1, 11, 0.9, d, 0.08); for (i = 0; i < 3; i++) chip(t + 0.2 + i * 0.07, d, 0.8); }
    else if (kind === "winBig") { [72, 76, 79, 84, 88, 91].forEach(function (m, k) { bell(m, t + k * 0.08, 0.6, 0.12, d); }); [60, 64, 67].forEach(function (m) { brass(m, t + 0.45, 0.9, 0.05, d); }); coinShower(t + 0.1, 24, 1.8, d, 0.09); for (i = 0; i < 5; i++) chip(t + 0.25 + i * 0.09, d, 0.9); noise(t + 0.05, 0.45, "highpass", 5000, 0.07, d, 0.6); }
    else if (kind === "jackpot") {
      [[67, 0, 0.18], [72, 0.17, 0.18], [76, 0.34, 0.18], [79, 0.51, 0.18], [84, 0.72, 0.55], [79, 1.34, 0.18], [84, 1.5, 0.18], [88, 1.68, 1.3]].forEach(function (n) { brass(n[0], t + n[1], n[2] + 0.12, 0.075, d); brass(n[0] - 12, t + n[1], n[2] + 0.12, 0.04, d); });
      kick(t, 0.5, d); kick(t + 0.72, 0.5, d); kick(t + 1.68, 0.55, d);
      for (i = 0; i < 14; i++) bell(84 + (i % 4) * 2, t + 0.2 + i * 0.16, 0.5, 0.07, d);
      coinShower(t + 0.15, 48, 3.3, d, 0.1); for (i = 0; i < 8; i++) chip(t + 0.4 + i * 0.12, d, 1);
      noise(t, 0.6, "highpass", 4500, 0.09, d, 0.5); noise(t + 1.68, 1.2, "highpass", 6000, 0.06, d, 0.5);
    }
    else if (kind === "bjwin") { [72, 79, 84, 88].forEach(function (m, k) { bell(m, t + k * 0.09, 0.5, 0.13, d); }); cardSound(t, d, "flip"); coinShower(t + 0.2, 8, 0.8, d, 0.08); }
  }
  /* séquences longues (roulette, rouleaux, distribution) : un seul nœud de sortie par séquence → annulable d'un coup */
  /* Partie 14 : tirage de machine à sous mécanique. Levier (ressort, cliquet, claquement), cliquets de chaque rouleau (tic-tic-tic qui ralentit), arrêt net (« clac » sourd + rebond), petite note qui monte à chaque rouleau arrêté. */
  function seqSlots(o, d) {
    var t0 = ctx.currentTime + 0.02, stops = o.stops && o.stops.length ? o.stops : [1.2, 1.65, 2.1], last = 0, i, k, quick = stops[stops.length - 1] < 1;
    /* 1. levier : ressort tendu, 4 crans de cliquet de plus en plus rapides, claquement de fin de course */
    for (i = 0; i < 4; i++) { var tc = t0 + i * (0.055 - i * 0.008); noise(tc, 0.018, "bandpass", 2200 + i * 260, 0.2, d, 3); osc("square", 520 + i * 70, tc, 0.012, d, 0.05, 0.001, 2600, 0); }
    noise(t0 + 0.02, 0.2, "bandpass", 900, 0.07, d, 6); osc("sine", 70, t0 + 0.2, 0.16, d, 0.42, 0.002, 300, 0); noise(t0 + 0.2, 0.05, "lowpass", 1200, 0.28, d, 0.8); osc("triangle", 1600, t0 + 0.205, 0.05, d, 0.07, 0.001, 3600, 0.05);
    var st = t0 + (quick ? 0.12 : 0.24);
    stops.forEach(function (T, r) {
      var e = t0 + Math.max(0.36, T), a = st + r * 0.03, span = Math.max(0.12, e - a), t = a, n = 0, f0 = 2300 + r * 260;
      /* souffle mécanique du rouleau (grave, discret) */
      var ns = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); ns.buffer = noiseBuf; ns.loop = true; lp.type = "lowpass"; lp.frequency.setValueAtTime(900 - r * 60, a); lp.frequency.exponentialRampToValueAtTime(260, e); g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.045, a + 0.06); g.gain.setValueAtTime(0.045, e - 0.1); g.gain.linearRampToValueAtTime(0, e); ns.connect(lp); lp.connect(g); g.connect(d); ns.start(a); ns.stop(e + 0.02);
      /* cliquets : un tic par tige qui passe, l'intervalle s'allonge jusqu'à l'arrêt */
      while (t < e - 0.07 && n < 70) {
        var u = (t - a) / span, gap = 0.028 + 0.17 * Math.pow(u, 2.3), v = 0.16 * (1 - 0.35 * u);
        noise(t, 0.012, "bandpass", f0 + rng() * 500, v, d, 3.2); osc("triangle", 1250 + r * 90 + rng() * 120, t, 0.016, d, 0.06 * (1 - 0.3 * u), 0.0008, 3800, 0); t += gap * (0.92 + rng() * 0.16); n++;
      }
      /* arrêt : choc sourd, claquement métallique, rebond léger, note qui monte */
      osc("sine", 150 - r * 8, e, 0.15, d, 0.46, 0.002, 520, 0); osc("sine", 62, e, 0.11, d, 0.3, 0.002, 200, 0); noise(e, 0.04, "bandpass", 1900, 0.3, d, 1.6); osc("triangle", 840 + r * 40, e + 0.002, 0.05, d, 0.08, 0.001, 3200, 0);
      noise(e + 0.07, 0.025, "bandpass", 2600, 0.12, d, 2.4); osc("sine", 120, e + 0.07, 0.07, d, 0.15, 0.002, 380, 0);
      bell(72 + r * 4, e + 0.03, 0.28, 0.045, d); last = Math.max(last, e - t0 + 0.3);
    });
    return last;
  }
  function seqRoulette(o, d) {
    var T = Math.max(0.6, o.dur || 4.6), t0 = ctx.currentTime + 0.02, sc = T / 4.6, tt = 0.12, i, u = T * 0.8;
    noise(t0, 0.1, "bandpass", 3200, 0.12, d, 1.5); osc("triangle", 1800, t0, 0.05, d, 0.1, 0.002, 5000, 0);
    loopNoise(t0, T * 0.96, "lowpass", 230, 0.17, d);
    var hs = loopNoise(t0 + 0.05, u, "bandpass", 3200, 0.06, d, 6); hs.f.frequency.setValueAtTime(3200, t0 + 0.05); hs.f.frequency.exponentialRampToValueAtTime(1700, t0 + u);
    while (tt < u) { var tau = tt / u, dt = 0.028 + 0.27 * Math.pow(tau, 2.2); noise(t0 + tt, 0.013, "bandpass", 3600 + rng() * 900, 0.1 * (1 - tau * 0.3), d, 3); osc("sine", 2200 + rng() * 600, t0 + tt, 0.012, d, 0.045, 0.001, 5000, 0); tt += dt * (0.85 + rng() * 0.3); }
    [0, 0.16, 0.29, 0.39, 0.47, 0.53].forEach(function (off, k) { var tm = t0 + u + off * sc, dc = 1 - k * 0.13; noise(tm, 0.05, "bandpass", 1500 + rng() * 500, 0.26 * dc, d, 2); osc("triangle", 1100 + rng() * 300, tm, 0.07, d, 0.12 * dc, 0.001, 3500, 0.1); osc("sine", 330 - k * 15, tm, 0.06, d, 0.1 * dc, 0.001, 900, 0); });
    osc("sine", 250, t0 + T * 0.97, 0.12, d, 0.2, 0.002, 700, 0); noise(t0 + T * 0.97, 0.05, "lowpass", 1100, 0.18, d);
    return T + 0.4;
  }
  function seqDeal(o, d) { var n = Math.max(1, Math.min(8, o.n | 0 || 1)), gap = o.gap || 0.17, t0 = ctx.currentTime + 0.02 + (o.delay || 0), i; if (o.shuffle) { riffle(t0, d); t0 += 1.15; } for (i = 0; i < n; i++) cardSound(t0 + i * gap, d, "deal"); return (o.shuffle ? 1.15 : 0) + n * gap + 0.3; }
  var seqList = [];
  function playSeq(name, o) {
    o = o || {}; if (!cfg.sound || cfg.sfx <= 0 || !unlocked || !ensure()) return null; if (ctx.state === "suspended") ctx.resume();
    var sg = ctx.createGain(), total = 0; sg.gain.value = name === "slots" ? 0.55 : 1; sg.connect(softBus);
    try { if (name === "slots") total = seqSlots(o, sg); else if (name === "roulette") total = seqRoulette(o, sg); else if (name === "deal") total = seqDeal(o, sg); else { sg.disconnect(); return null; } } catch (e) { if (root.console) console.warn("seq", name, e && e.message); try { sg.disconnect(); } catch (e2) {} return null; }
    var hd = { name: name, total: total, stop: function () { try { var n = ctx.currentTime; sg.gain.cancelScheduledValues(n); sg.gain.setTargetAtTime(0, n, 0.03); } catch (e) {} setTimeout(function () { try { sg.disconnect(); } catch (e) {} }, 350); } };
    seqList.push(hd); setTimeout(function () { try { sg.disconnect(); } catch (e) {} var k = seqList.indexOf(hd); if (k >= 0) seqList.splice(k, 1); }, (total + 0.8) * 1000); mixStats.played++; return hd;
  }
  function stopSeqs() { seqList.slice().forEach(function (x) { x.stop(); }); seqList = []; }

  /* ---------- musique de salon de casino : swing, contrebasse, balais, piano ---------- */
  var CASINO = { bpm: 116, chords: [
    { r: 38, v: [53, 57, 60, 64], s: [62, 65, 69, 72] }, { r: 43, v: [53, 59, 62, 65], s: [67, 71, 74, 77] }, { r: 36, v: [55, 59, 62, 64], s: [60, 64, 67, 71] }, { r: 45, v: [55, 61, 64, 67], s: [69, 73, 76, 79] },
    { r: 38, v: [53, 57, 60, 64], s: [62, 65, 69, 72] }, { r: 43, v: [53, 59, 62, 65], s: [67, 71, 74, 77] }, { r: 36, v: [55, 59, 62, 64], s: [60, 64, 67, 71] }, { r: 43, v: [53, 59, 62, 65], s: [67, 71, 74, 77] }] };
  function barCasino(t0, n, dest) {
    var P = CASINO, spb = 60 / P.bpm, sw = spb * 0.667, c = P.chords[n % 8], nx = P.chords[(n + 1) % 8], i;
    var walk = [c.r, c.r + (n % 2 ? 4 : 3), c.r + 7, nx.r + (nx.r > c.r ? -1 : 1)]; walk.forEach(function (m, b) { bass(m, t0 + b * spb + (b % 2 ? 0.012 : 0), spb * 0.92, 0.23, dest); });
    for (i = 0; i < 4; i++) { noise(t0 + i * spb, 0.16, "highpass", 9000, i % 2 ? 0.03 : 0.04, dest); if (i % 2 === 1) noise(t0 + i * spb + sw, 0.12, "highpass", 9500, 0.03, dest); }
    noise(t0 + spb, 0.07, "bandpass", 2600, 0.03, dest, 1.2); noise(t0 + spb * 3, 0.07, "bandpass", 2600, 0.03, dest, 1.2); noise(t0 + spb, 0.06, "highpass", 6500, 0.035, dest); noise(t0 + spb * 3, 0.06, "highpass", 6500, 0.035, dest);
    [[0.0 + sw, 0.075], [spb * 2 + sw, 0.065]].forEach(function (h, k) { c.s.slice(0, 3).forEach(function (m, j) { rhodes(m, t0 + h[0] + j * 0.012, spb * (k ? 1.1 : 1.4), h[1] * 0.8, dest); }); });
    if (rng() < 0.55) c.s.slice(1).forEach(function (m, j) { rhodes(m - 12, t0 + spb * 3.5 + j * 0.01, spb * 0.8, 0.04, dest); });
    if (rng() < 0.7) { var k = 3 + Math.floor(rng() * 3), st = Math.floor(rng() * 4), tt = t0 + spb * (rng() < 0.5 ? 0 : 1) + (rng() < 0.5 ? sw : 0); for (i = 0; i < k; i++) { lead(c.s[(st + i * (rng() < 0.6 ? 1 : 2)) % 4] + (rng() < 0.25 ? 12 : 0), tt, spb * (0.5 + rng() * 0.5), 0.065, dest); tt += (i % 2 ? sw : spb - sw) * (rng() < 0.2 ? 2 : 1); } }
    if (rng() < 0.3) coin(t0 + rng() * spb * 3.5, dest, 0.03, 0.6);
    return spb * 4;
  }

  /* ---------- morceaux synthétisés (une mesure à la fois) ---------- */
  var MENU = { bpm: 68, chords: [{ r: 38, v: [53, 57, 60, 64] }, { r: 43, v: [53, 59, 64] }, { r: 36, v: [55, 59, 62, 64] }, { r: 45, v: [55, 61, 64, 70] }], scale: [74, 77, 79, 81, 84] };
  var GAME = { bpm: 86, chords: [{ r: 33, v: [57, 60, 64] }, { r: 29, v: [57, 60, 65] }, { r: 36, v: [55, 60, 64] }, { r: 31, v: [55, 59, 62] }], scale: [69, 72, 74, 76, 79] };
  function barMenu(t0, n, dest) {
    var P = MENU, spb = 60 / P.bpm, c = P.chords[n % 4], sw = spb * 0.667;
    pad(c.v.map(function (m) { return m - 12; }), t0, spb * 4, 0.018, dest);
    c.v.forEach(function (m, i) { rhodes(m, t0 + i * 0.018, spb * 2.6, 0.09, dest); }); if (rng() < 0.7) c.v.slice(1).forEach(function (m, i) { rhodes(m, t0 + spb * 2.5 + i * 0.02, spb * 1.2, 0.055, dest); });
    var off = [0, 7, 12, 10]; for (var b = 0; b < 4; b++) bass(c.r + off[b] - (b === 2 ? 0 : 0), t0 + b * spb + (b % 2 ? 0.02 : 0), spb * 0.9, 0.2, dest);
    for (var q = 0; q < 4; q++) { noise(t0 + q * spb, 0.05, "highpass", 7500, 0.05, dest); noise(t0 + q * spb + sw, 0.04, "highpass", 8000, 0.03, dest); if (q % 2) noise(t0 + q * spb, 0.09, "bandpass", 1900, 0.05, dest, 1.5); }
    if (rng() < 0.55) { var k = 2 + Math.floor(rng() * 3), st = Math.floor(rng() * 4), tt = t0 + spb * (0.5 + Math.floor(rng() * 2)); for (var i2 = 0; i2 < k; i2++) { lead(P.scale[(st + i2 * (rng() < 0.5 ? 1 : 2)) % P.scale.length], tt, spb * (0.9 + rng()), 0.07, dest); tt += spb * (0.7 + rng() * 0.8); } }
    return spb * 4;
  }
  function barGame(t0, n, dest) {
    var P = GAME, spb = 60 / P.bpm, c = P.chords[n % 4], I = intensity;
    pad(c.v.map(function (m) { return m - 12; }), t0, spb * 4, 0.012, dest);
    bass(c.r, t0, spb * 1.8, 0.22, dest); bass(c.r, t0 + spb * 2.5, spb * 1.2, 0.18, dest); if (I > 0.3) bass(c.r + 12, t0 + spb * 3.5, spb * 0.45, 0.1, dest);
    kick(t0, 0.5, dest); kick(t0 + spb * 2.5, 0.42, dest); if (I > 0.65) kick(t0 + spb * 1.75, 0.3, dest);
    noise(t0 + spb, 0.1, "bandpass", 1800, 0.07, dest, 1.2); noise(t0 + spb * 3, 0.1, "bandpass", 1800, 0.07, dest, 1.2);
    for (var h = 0; h < 8; h++) noise(t0 + h * spb / 2, 0.035, "highpass", 8000, h % 2 ? 0.025 : 0.04, dest);
    c.v.forEach(function (m, i) { rhodes(m + 12, t0 + spb * (i * 0.5), spb * 1.3, 0.04 + I * 0.03, dest); });
    if (I > 0.3) c.v.forEach(function (m, i) { rhodes(m + 12, t0 + spb * (2 + i * 0.5), spb * 1.0, 0.03 + I * 0.03, dest); });
    if (I > 0.6 && rng() < 0.6) { var tt = t0 + spb * (rng() < 0.5 ? 0.5 : 1.5), st = Math.floor(rng() * 5); for (var i2 = 0; i2 < 3; i2++) { lead(P.scale[(st + i2) % 5], tt, spb * 0.9, 0.05, dest); tt += spb * 0.75; } }
    return spb * 4;
  }

  /* ---------- pistes ---------- */
  function synthTrack(name) {
    var tg = ctx.createGain(); tg.gain.value = 0.0001; tg.connect(musBus); var tr = { name: name, kind: "synth", g: tg, bar: 0, next: ctx.currentTime + 0.15, timer: 0, dead: false }, fn = name === "menu" ? barMenu : name === "casino" ? barCasino : barGame;
    function pump() { if (tr.dead) return; while (tr.next < ctx.currentTime + 1.4) { tr.next += fn(tr.next, tr.bar++, tg); } }
    pump(); tr.timer = setInterval(pump, 120); return tr;
  }
  function fileTrack(name) {
    var a = new Audio(FILES[name]); a.loop = true; a.preload = "auto"; var tr = { name: name, kind: "file", a: a, v: 0, dead: false, target: 1, timer: 0, failed: false };
    a.addEventListener("error", function () { tr.failed = true; if (cur === tr && !tr.dead) { var n = synthTrack(name); n.g.gain.setTargetAtTime(1, ctx.currentTime, 0.4); cur = n; stopTrack(tr, 0); } });
    fileTracks[name] = tr; applyFile(tr); var p = a.play(); if (p && p.catch) p.catch(function () { tr.failed = true; if (cur === tr && !tr.dead) { var n = synthTrack(name); n.g.gain.setTargetAtTime(1, ctx.currentTime, 0.4); cur = n; stopTrack(tr, 0); } });
    tr.timer = setInterval(function () { var d = tr.target - tr.v; if (Math.abs(d) < 0.01) { tr.v = tr.target; } else tr.v += Math.sign(d) * 0.05 / FADE; applyFile(tr); }, 50); return tr;
  }
  function applyFile(tr) { if (tr.a) tr.a.volume = Math.max(0, Math.min(1, cfg.sound ? cfg.music * tr.v : 0)); }
  function fadeTo(tr, v, sec) { if (tr.kind === "synth") tr.g.gain.setTargetAtTime(v ? 1 : 0.0001, ctx.currentTime, sec / 3); else tr.target = v; }
  function stopTrack(tr, delay) {
    tr.dead = true; fadeTo(tr, 0, Math.max(0.1, delay || FADE)); setTimeout(function () { clearInterval(tr.timer); if (tr.kind === "synth") { try { tr.g.disconnect(); } catch (e) {} } else { try { tr.a.pause(); tr.a.removeAttribute("src"); tr.a.load(); } catch (e) {} delete fileTracks[tr.name]; } }, ((delay || FADE) + 0.4) * 1000);
  }
  function start(name) {
    if (!ensure()) return; if (ctx.state === "suspended") ctx.resume();
    if (cur && cur.name === name && !cur.dead) return; var old = cur;
    cur = USE_FILES && root.Audio ? fileTrack(name) : synthTrack(name); fadeTo(cur, 1, FADE); if (old) stopTrack(old, FADE);
  }
  function halt() { if (cur) { stopTrack(cur, 0.25); cur = null; } }

  /* ---------- effets ---------- */
  /* ===== Moteur de mixage (C17) : TOUS les sons passent par sfx() → admit() → synth(). Aucun module ne joue de son en direct. =====
     Niveaux : 0 = discret (clics, survol, erreurs…), 1 = courant (achat, succès, or…), 2 = marquant (déblocage, promotion, niveau, design, butin, coffre, événement, alerte).
     gap = écart minimal (ms) avant que le MÊME son se rejoue (anti-mitraillette) ; dur = durée estimée (s) pour compter les voix. */
  var MIX = {
    shot: [0, 120, 0.9], hit: [0, 110, 0.3], step: [0, 150, 0.1], ricochet: [0, 140, 0.25], metal: [0, 130, 0.5], glass: [0, 160, 0.5], siren: [1, 2500, 1.6], engine: [0, 900, 1.3], alarm: [1, 2500, 1.1], lock: [0, 300, 0.5], tire: [0, 400, 0.5], hover: [0, 90, 0.1], click: [0, 55, 0.15], select: [0, 70, 0.15], place: [0, 120, 0.2], open: [0, 140, 0.5], tune: [0, 300, 0.45], error: [0, 160, 0.3],
    buy: [1, 110, 0.5], upgrade: [1, 90, 0.4], gold: [1, 140, 0.6], success: [1, 140, 0.6], claim: [1, 200, 0.6], expire: [1, 400, 0.7], boost: [1, 400, 0.7],
    chip: [0, 50, 0.15], chips: [1, 200, 0.5], cardDeal: [0, 60, 0.25], cardFlip: [0, 60, 0.15], shuffle: [1, 500, 1.1], coin: [0, 30, 0.3], loseCasino: [1, 400, 0.8], bust: [1, 400, 0.6], winSmall: [1, 300, 1.0], winMed: [1, 300, 1.6], winBig: [2, 800, 2.6], jackpot: [2, 1500, 4.6], bjwin: [1, 400, 1.5],
    unlock: [2, 700, 1.1], saga: [2, 800, 1.3], promo: [2, 1200, 1.6], levelup: [2, 900, 1.0], design: [2, 900, 1.0], loot: [2, 600, 1.0], vault: [2, 900, 1.0], event: [2, 700, 0.8], alert: [2, 1500, 0.9], heat1: [2, 1500, 1.2], heat2: [2, 1800, 1.6], heat3: [2, 2400, 2.3]
  };
  var MAXV = [4, 5, 7], WIN = 1000, WINMAX = [6, 10, 12], MAJOR_GAP = 350, SOFT_GAP = 30;
  var lastBy = {}, voices = [], stamps = [], lastMajor = -1e9, lastAny = -1e9, mixStats = { played: 0, dropped: { gap: 0, voices: 0, rate: 0, major: 0, off: 0 } };
  function nowMs() { return root.performance && performance.now ? performance.now() : Date.now(); }
  /* Décision pure (testable sans AudioContext) : faut-il jouer ce son maintenant ? */
  function admit(name, at) {
    var m = MIX[name]; if (!m) return { ok: false, reason: "inconnu" }; var lvl = m[0], t = typeof at === "number" ? at : nowMs();
    voices = voices.filter(function (v) { return v.end > t; }); stamps = stamps.filter(function (x) { return t - x[0] < WIN; });
    if (lastBy[name] !== undefined && t - lastBy[name] < m[1]) return { ok: false, reason: "gap", lvl: lvl };
    if (lvl < 2 && t - lastAny < SOFT_GAP) return { ok: false, reason: "gap", lvl: lvl };
    if (lvl === 2 && t - lastMajor < MAJOR_GAP) return { ok: false, reason: "major", lvl: lvl };
    if (voices.length >= MAXV[lvl]) return { ok: false, reason: "voices", lvl: lvl };
    var cnt = stamps.length, softCnt = stamps.filter(function (x) { return x[1] === 0; }).length;
    if (lvl === 0 ? softCnt >= WINMAX[0] : cnt >= WINMAX[lvl]) return { ok: false, reason: "rate", lvl: lvl };
    return { ok: true, lvl: lvl, dur: m[2] };
  }
  function commit(name, lvl, dur, at) { var t = typeof at === "number" ? at : nowMs(); lastBy[name] = t; lastAny = t; if (lvl === 2) lastMajor = t; voices.push({ end: t + dur * 1000 }); if (name !== "hover") stamps.push([t, lvl]); mixStats.played++; }
  /* Ducking doux : un son marquant baisse brièvement le discret, la musique, l'ambiance et la radio fichier (descente 40 ms, remontée lente, jamais de coupure). */
  function duck(dur) {
    if (!ctx || !musDuck) return; var t = ctx.currentTime, hold = Math.max(0.2, dur * 0.7);
    [[musDuck, 0.55, 0.45], [ambDuck, 0.4, 0.6], [softDuck, 0.5, 0.35]].forEach(function (p) { var g = p[0].gain; g.cancelScheduledValues(t); g.setTargetAtTime(p[1], t, 0.04); g.setTargetAtTime(1, t + hold, p[2]); });
    if (root.BL && root.BL.radio && root.BL.radio.duck) root.BL.radio.duck(0.55, hold * 1000, 900);
  }
  var seq = 0, SEL = "button, .btn, a[href], summary, input:not([type=range]), [role=button], [role=tab], [role=switch], [role=radio], [role=checkbox], [role=menuitem], [role=option], [data-sfx]";
  function sfxFor(t) {
    var b = t && t.closest ? t.closest(SEL) : null; if (!b || b.disabled || b.getAttribute("aria-disabled") === "true" || b.closest("[data-nosfx]")) return null;
    var d = b.getAttribute("data-sfx"); if (d) return d === "none" ? null : d;
    if (b.matches("select, input[type=range]")) return null;
    if (b.matches(".buy, .can")) return "buy";
    if (b.matches("input, [role=switch], [role=checkbox], [role=radio]")) return "tune";
    if (b.matches("[data-view], .rtab, .sntab, .stabs button, .mchip, .mdock .dk, .mbtn, [role=tab]")) return "select";
    if (b.matches("summary, .close, [data-b=close], [aria-label*=ermer]")) return "open";
    return "click";
  }
  function sfx(name) {
    seq++;
    if (!cfg.sound || cfg.sfx <= 0 || !unlocked || !ensure()) { mixStats.dropped.off++; return; } var a0 = admit(name);
    if (!a0.ok) { if (mixStats.dropped[a0.reason] !== undefined) mixStats.dropped[a0.reason]++; return; }
    if (ctx.state === "suspended") ctx.resume(); commit(name, a0.lvl, a0.dur); if (a0.lvl === 2) duck(a0.dur);
    synth(name, a0.lvl === 2 ? majorBus : softBus);
  }
  function synth(name, d) {
    var t = ctx.currentTime + 0.005;
    if (USE_FILES && root.Audio && FILES[name]) { try { var a = new Audio(FILES[name]); a.volume = cfg.sfx; a.play().catch(function () {}); return; } catch (e) {} }
    if (name === "shot") {   /* tir en couches : claquement sec, corps grave, queue et deux échos de rue */
      noise(t, 0.03, "highpass", 3500, 0.42, d); noise(t, 0.11, "bandpass", 1800, 0.26, d); osc("sine", 118, t, 0.2, d, 0.4, 0.002, 500, 0); osc("square", 240, t, 0.03, d, 0.05, 0.001, 1400, 0);
      noise(t + 0.03, 0.5, "lowpass", 950, 0.12, d); noise(t + 0.2, 0.32, "lowpass", 720, 0.065, d); noise(t + 0.38, 0.25, "lowpass", 520, 0.035, d);
    }
    else if (name === "hit") { noise(t, 0.06, "bandpass", 1100, 0.2, d); osc("sine", 72, t, 0.13, d, 0.3, 0.002, 300, 0); noise(t + 0.04, 0.1, "lowpass", 500, 0.1, d); }
    else if (name === "step") { noise(t, 0.04, "lowpass", 520, 0.2, d); osc("sine", 78, t, 0.06, d, 0.18, 0.002, 250, 0); noise(t + 0.22, 0.04, "lowpass", 560, 0.1, d); osc("sine", 70, t + 0.22, 0.06, d, 0.09, 0.002, 250, 0); }
    else if (name === "ricochet") { [3300, 2700, 2150, 1750].forEach(function (f, i) { osc("sine", f, t + i * 0.022, 0.045, d, 0.12, 0.002, 6000, 0); }); noise(t, 0.05, "highpass", 5200, 0.16, d); }
    else if (name === "metal") { noise(t, 0.07, "bandpass", 2500, 0.18, d); [820, 1230, 1890].forEach(function (f, i) { osc("triangle", f, t, 0.28 - i * 0.06, d, 0.09 - i * 0.02, 0.002, 5000, 0.3); }); }
    else if (name === "glass") { noise(t, 0.22, "highpass", 6500, 0.2, d); [3520, 4200, 5100, 4700].forEach(function (f, i) { osc("sine", f, t + i * 0.035, 0.09, d, 0.05, 0.001, 8000, 0); }); }
    else if (name === "siren") { for (var si = 0; si < 4; si++) osc("sine", si % 2 ? 930 : 700, t + si * 0.4, 0.38, d, 0.14, 0.05, 1800, 0.4); }
    else if (name === "engine") { osc("sawtooth", 52, t, 1.3, d, 0.2, 0.1, 380, 0.7); osc("sawtooth", 78, t, 1.3, d, 0.1, 0.1, 380, 0.7); noise(t, 1.2, "lowpass", 260, 0.08, d); }
    else if (name === "alarm") { for (var ai = 0; ai < 6; ai++) osc("square", ai % 2 ? 660 : 880, t + ai * 0.14, 0.12, d, 0.12, 0.004, 2600, 0); }
    else if (name === "lock") { osc("sine", 92, t, 0.22, d, 0.34, 0.002, 380, 0); noise(t, 0.1, "lowpass", 650, 0.14, d); osc("triangle", 1500, t + 0.2, 0.05, d, 0.08, 0.001, 5000, 0); osc("triangle", 1100, t + 0.3, 0.05, d, 0.06, 0.001, 5000, 0); }
    else if (name === "tire") { noise(t, 0.35, "bandpass", 1500, 0.16, d); osc("sawtooth", 330, t, 0.3, d, 0.05, 0.01, 1200, 0.2); osc("sine", 70, t + 0.05, 0.2, d, 0.25, 0.003, 260, 0); }
    else if (name === "click") { osc("triangle", 980, t, 0.05, d, 0.22, 0.003, 4000, 0); osc("sine", 1460, t, 0.03, d, 0.08, 0.002, 5000, 0); }
    else if (name === "buy") { osc("sine", 1175, t, 0.22, d, 0.22, 0.004, 5000, 0.2); osc("sine", 1568, t + 0.07, 0.35, d, 0.2, 0.004, 5500, 0.3); osc("sine", 3136, t + 0.07, 0.15, d, 0.05, 0.002, 7000, 0); noise(t, 0.06, "highpass", 6500, 0.07, d); }
    else if (name === "success") { [72, 76, 79, 84].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.09, 0.4, d, 0.18, 0.005, 4500, 0.35); }); }
    else if (name === "error") { osc("square", 150, t, 0.14, d, 0.12, 0.005, 500, 0); osc("square", 110, t + 0.09, 0.16, d, 0.1, 0.005, 400, 0); }
    else if (name === "gold") { noise(t, 0.05, "highpass", 5000, 0.1, d); osc("sine", 2093, t, 0.5, d, 0.16, 0.002, 7000, 0.45); osc("sine", 3136, t + 0.04, 0.45, d, 0.1, 0.002, 8000, 0.4); osc("triangle", 1568, t + 0.1, 0.5, d, 0.1, 0.003, 6000, 0.4); }
    else if (name === "place") { osc("sine", 140, t, 0.16, d, 0.3, 0.002, 600, 0); noise(t, 0.05, "lowpass", 900, 0.18, d); osc("triangle", 520, t + 0.03, 0.1, d, 0.07, 0.002, 2500, 0); }
    else if (name === "boost") { [60, 67, 72, 79, 84].forEach(function (m, i) { osc("sawtooth", hz(m), t + i * 0.05, 0.28, d, 0.07, 0.004, 3500, 0.2); }); osc("sine", hz(48), t, 0.5, d, 0.2, 0.01, 400, 0.3); noise(t + 0.2, 0.25, "highpass", 4000, 0.06, d, 0.5); }
    else if (name === "select") { osc("triangle", 660, t, 0.06, d, 0.16, 0.003, 3500, 0); osc("triangle", 990, t + 0.045, 0.08, d, 0.14, 0.003, 4000, 0.1); }
    else if (name === "hover") { osc("sine", 1900, t, 0.03, d, 0.045, 0.002, 5000, 0); }
    else if (name === "upgrade") { [64, 69, 76].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.06, 0.2, d, 0.17, 0.004, 4800, 0.2); }); noise(t + 0.12, 0.1, "highpass", 6000, 0.05, d); }
    else if (name === "design") { osc("sine", 90, t, 0.25, d, 0.35, 0.003, 400, 0); noise(t, 0.12, "lowpass", 1200, 0.2, d); osc("sine", 1047, t + 0.14, 0.7, d, 0.16, 0.004, 6000, 0.5); osc("sine", 1568, t + 0.2, 0.6, d, 0.1, 0.004, 7000, 0.5); }
    else if (name === "chip") chip(t, d, 1);
    else if (name === "chips") { for (var cq = 0; cq < 6; cq++) chip(t + cq * 0.055 + rng() * 0.012, d, 0.8); }
    else if (name === "cardDeal") cardSound(t, d, "deal");
    else if (name === "cardFlip") cardSound(t, d, "flip");
    else if (name === "shuffle") riffle(t, d);
    else if (name === "coin") coin(t, d, 0.12, 0.3);
    else if (name === "loseCasino") { [64, 60, 55].forEach(function (m, k) { osc("sine", hz(m), t + k * 0.2, 0.34, d, 0.1, 0.01, 900, 0.2); osc("triangle", hz(m), t + k * 0.2, 0.3, d, 0.04, 0.01, 800, 0); }); }
    else if (name === "bust") { osc("sawtooth", 120, t, 0.26, d, 0.12, 0.004, 500, 0); osc("square", 90, t + 0.12, 0.3, d, 0.09, 0.004, 400, 0); noise(t, 0.15, "lowpass", 400, 0.16, d); }
    else if (name === "winSmall" || name === "winMed" || name === "winBig" || name === "jackpot" || name === "bjwin") winSound(name, t, d);
    else if (name === "saga") { [57, 62, 66, 69].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.16, 0.7, d, 0.12, 0.01, 3200, 0.45); }); osc("sine", hz(45), t, 1.2, d, 0.08, 0.01, 800, 0.2); }
    else if (name === "unlock") { [60, 67, 72].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.1, 0.45, d, 0.14, 0.006, 4200, 0.35); }); osc("sine", hz(84), t + 0.3, 0.6, d, 0.07, 0.004, 7000, 0.5); noise(t, 0.1, "highpass", 5000, 0.05, d); }
    else if (name === "promo") { [[60, 0], [64, 0], [67, 0], [72, 0.22], [76, 0.22], [79, 0.22], [84, 0.5]].forEach(function (n) { osc("sawtooth", hz(n[0]), t + n[1], n[1] === 0.5 ? 1 : 0.34, d, 0.075, 0.01, 3200, 0.35); }); osc("sine", hz(84), t + 0.5, 1.1, d, 0.1, 0.01, 6000, 0.6); noise(t + 0.5, 0.5, "highpass", 5500, 0.05, d, 0.6); }
    else if (name === "levelup") { [67, 71, 74, 79, 83].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.075, 0.3, d, 0.17, 0.004, 5000, 0.3); }); osc("sine", hz(95), t + 0.38, 0.5, d, 0.06, 0.004, 8000, 0.5); }
    else if (name === "event") { osc("square", 880, t, 0.09, d, 0.1, 0.004, 3000, 0); osc("square", 880, t + 0.16, 0.09, d, 0.1, 0.004, 3000, 0); osc("square", 1175, t + 0.32, 0.18, d, 0.1, 0.004, 3200, 0.1); }
    else if (name === "alert") { for (var k = 0; k < 4; k++) osc("sawtooth", k % 2 ? 560 : 780, t + k * 0.17, 0.17, d, 0.1, 0.006, 2600, 0); noise(t, 0.1, "bandpass", 400, 0.1, d); }
    else if (name === "claim") { osc("sine", 1568, t, 0.25, d, 0.18, 0.003, 7000, 0.3); osc("sine", 2093, t + 0.11, 0.45, d, 0.18, 0.003, 7500, 0.4); osc("triangle", 3136, t + 0.11, 0.3, d, 0.06, 0.003, 8000, 0.3); }
    else if (name === "expire") { [72, 67, 60].forEach(function (m, i) { osc("triangle", hz(m), t + i * 0.13, 0.35, d, 0.14, 0.006, 2600, 0.3); }); }
    else if (name === "loot") { [[67, 0], [71, 0.09], [74, 0.18], [79, 0.27], [86, 0.38]].forEach(function (n) { osc("triangle", hz(n[0]), t + n[1], 0.5, d, 0.1, 0.005, 6000, 0.3); }); noise(t + 0.38, 0.25, "highpass", 6000, 0.08, d); }
    else if (name === "vault") { osc("square", 82, t, 0.22, d, 0.2, 0.002, 300, 0); noise(t, 0.18, "bandpass", 1500, 0.2, d); osc("sine", 1760, t + 0.1, 0.8, d, 0.12, 0.002, 7000, 0.5); osc("sine", 2349, t + 0.1, 0.6, d, 0.06, 0.002, 7500, 0.5); }
    else if (name === "heat1") { osc("sawtooth", 196, t, 0.32, d, 0.13, 0.01, 900, 0); osc("sawtooth", 196, t + 0.42, 0.32, d, 0.13, 0.01, 900, 0); osc("sine", 55, t, 0.7, d, 0.14, 0.02, 200, 0); }
    else if (name === "heat2") { for (var h2 = 0; h2 < 3; h2++) { osc("sawtooth", 330, t + h2 * 0.36, 0.3, d, 0.12, 0.01, 1600, 0); osc("sawtooth", 247, t + h2 * 0.36 + 0.15, 0.2, d, 0.12, 0.01, 1600, 0); } osc("sine", 48, t, 1.0, d, 0.18, 0.02, 180, 0); noise(t, 0.3, "bandpass", 500, 0.12, d); }
    else if (name === "heat3") { osc("sine", 40, t, 1.6, d, 0.26, 0.01, 160, 0); noise(t, 0.35, "lowpass", 300, 0.3, d); for (var h3 = 0; h3 < 5; h3++) { osc("sawtooth", h3 % 2 ? 311 : 466, t + 0.15 + h3 * 0.3, 0.26, d, 0.14, 0.006, 2200, 0); osc("square", h3 % 2 ? 156 : 233, t + 0.15 + h3 * 0.3, 0.26, d, 0.07, 0.006, 900, 0); } }
    else if (name === "tune") { noise(t, 0.38, "bandpass", 2400, 0.16, d, 0.3); noise(t + 0.05, 0.3, "highpass", 5000, 0.07, d); osc("sine", 520, t + 0.05, 0.07, d, 0.06, 0.003, 3000, 0); osc("sine", 780, t + 0.17, 0.07, d, 0.05, 0.003, 3000, 0); osc("sine", 1240, t + 0.27, 0.06, d, 0.04, 0.003, 3500, 0); }
    else if (name === "open") { noise(t, 0.45, "bandpass", 700, 0.12, d, 0.8); osc("sine", 196, t, 0.5, d, 0.08, 0.1, 800, 0.3); }
  }

  /* ---------- API ---------- */
  /* La radio (radio.js) prend la main pour la musique du jeu quand la station est un fichier ou « coupée » ; le synthé reste pour le menu et pour Blackline FM. */
  function route(name) { var R = root.BL && root.BL.radio; if (!R) return false; if (name === "game" && R.handles()) { halt(); R.enter(); return true; } R.leave(); return false; }
  function unlock() { if (unlocked) return; unlocked = true; if (!ensure()) return; if (ctx.state === "suspended") ctx.resume(); if (want && cfg.sound && !route(want)) start(want); if (root.BL && root.BL.ambience) root.BL.ambience.refresh(); }
  function play(name) { want = name; if (root.BL && root.BL.ambience) setTimeout(root.BL.ambience.refresh, 0); if (!unlocked) return; if (!name || !cfg.sound) { if (!name) halt(); if (root.BL && root.BL.radio) root.BL.radio.leave(); return; } if (route(name)) return; start(name); }
  function apply(s) {
    var was = cfg.sound; cfg.sound = !!s.sound; cfg.music = Math.max(0, Math.min(1, s.music)); cfg.sfx = Math.max(0, Math.min(1, s.sfx)); cfg.ambient = s.ambient !== false; cfg.amb = typeof s.amb === "number" ? Math.max(0, Math.min(1, s.amb)) : cfg.amb;
    if (root.BL && root.BL.radio) root.BL.radio.apply(s); if (ctx) levels(); if (!cfg.sound) halt(); else if (!was && unlocked && want) start(want); if (root.BL && root.BL.ambience) root.BL.ambience.apply(s);
  }
  function setIntensity(x) { intensity = Math.max(0, Math.min(1, x || 0)); }
  function configure(o) { if (o && typeof o.useFiles === "boolean") USE_FILES = o.useFiles; if (o && o.files) Object.keys(o.files).forEach(function (k) { FILES[k] = o.files[k]; }); }
  function graph() { if (!unlocked || !cfg.sound || !ensure()) return null; return { ctx: ctx, bus: ambBus, noise: noiseBuf, verb: verb }; }
  function status() { return { want: want, sound: cfg.sound, unlocked: unlocked, ctx: ctx ? ctx.state : "none", track: cur && !cur.dead ? cur.name : null, kind: cur ? cur.kind : null, master: master ? master.gain.value : null, music: musBus ? musBus.gain.value : null, sfx: sfxBus ? sfxBus.gain.value : null, want: want, running: !!(cur && !cur.dead), files: USE_FILES, duck: ctx && musDuck ? { music: musDuck.gain.value, amb: ambDuck.gain.value, soft: softDuck.gain.value } : null }; }
  function boot() {
    var go = function () { unlock(); ["pointerdown", "keydown", "touchstart"].forEach(function (e) { document.removeEventListener(e, go, true); }); };
    ["pointerdown", "keydown", "touchstart"].forEach(function (e) { document.addEventListener(e, go, true); });
    /* C8 (Partie 11) : un son pour chaque clic. sfxFor() décide (pur, testable) ; data-sfx="nom" impose un son, data-sfx="none" ou data-nosfx le coupe. */
    document.addEventListener("click", function (e) {
      var t = e.target; if (!t || !t.closest) return; var nm = sfxFor(t); if (!nm) return;
      if (nm === "buy") { var s0 = seq; setTimeout(function () { if (seq === s0) sfx("buy"); }, 0); return; }   /* achat : le module joue déjà son propre son (succès, erreur…) ; sinon, le son d'achat par défaut */
      sfx(nm);
    }, true);
    document.addEventListener("change", function (e) { var t = e.target; if (!t || !t.matches) return; if (t.matches("select, input[type=range]") && sfxFor(t)) sfx("tune"); }, true);
    var lastHov = 0; document.addEventListener("pointerover", function (e) { if (e.pointerType !== "mouse" || !unlocked) return; var b = e.target.closest && e.target.closest("[data-view], .mchip, .mdock .dk, .mbtn"); if (!b) { lastEl = null; return; } if (b.disabled || b === lastEl) return; lastEl = b; var n = Date.now(); if (n - lastHov < 90) return; lastHov = n; sfx("hover"); }, true);
    document.addEventListener("visibilitychange", function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (cfg.sound) ctx.resume(); });
  }
  BL.audio = { sequence: playSeq, stopSeqs: stopSeqs, admit: admit, mix: function () { return { stats: JSON.parse(JSON.stringify(mixStats)), voices: voices.length, MIX: MIX }; }, resetMix: function () { lastBy = {}; voices = []; stamps = []; lastMajor = lastAny = -1e9; mixStats = { played: 0, dropped: { gap: 0, voices: 0, rate: 0, major: 0, off: 0 } }; }, commit: commit, graph: graph, levels: function () { if (ctx) levels(); }, apply: apply, play: play, sfx: sfx, sfxFor: sfxFor, seq: function () { return seq; }, unlock: unlock, setIntensity: setIntensity, configure: configure, status: status, boot: boot, FILES: FILES };
})(window);
