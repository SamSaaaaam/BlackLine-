/* Illustrations des opérations : une scène SVG STATIQUE par opération (aucune animation : elles faisaient ramer la section Opérations).
   Format fixe 640×280 (ratio 16:7). Rendu plus réaliste : dégradés d’éclairage, textures (tôle ondulée, parquet, grillage), perspective, reflets sur sol mouillé.
   Ambiance polar de nuit, aucune violence. BL.opsArt.scene(opOuId, cls) → chaîne SVG. Scène générique de repli pour toute opération sans image. */
(function (root) {
  var BL = root.BL = root.BL || {}, n = 0;
  function rnd(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function f1(x) { return Math.round(x * 10) / 10; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rect(x, y, w, h, f, ex) { return '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function circ(x, y, r, f, ex) { return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function ell(x, y, rx, ry, f, ex) { return '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function path(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function line(d, s, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + s + '" stroke-width="' + w + '"' + (ex || "") + "/>"; }
  function poly(pts, f, ex) { return '<polygon points="' + pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") + '" fill="' + f + '"' + (ex || "") + "/>"; }
  /* dégradé linéaire (vertical par défaut) et radial ; stops = [[offset, couleur, opacité?]] */
  function lg(id, stops, h) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (h ? 1 : 0) + '" y2="' + (h ? 0 : 1) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</linearGradient>"; }
  function rg(id, stops) { return '<radialGradient id="' + id + '" cx="50%" cy="50%" r="50%">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</radialGradient>"; }
  function halo(x, y, r, id, op) { return circ(x, y, r, "url(#" + id + ")", op ? ' opacity="' + op + '"' : ""); }
  function person(x, y, s, f) { s = s || 1; return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')" fill="' + (f || "#04070b") + '"><circle cx="0" cy="-33" r="5.2"/><path d="M-8 -27q8-4 16 0l3 17-4 1-1 12 0 21h-5l-1-18-1 18h-5V3l-1-12-4-1z"/></g>'; }
  function vignette(id, a) { return '<defs>' + rg("vg" + id, [[0.5, "#000", 0], [1, "#000", a || 0.66]]) + '</defs><rect width="640" height="280" fill="url(#vg' + id + ')"/>'; }
  function rainStatic(seed, count, col, op) { var r = rnd(seed), o = ""; for (var i = 0; i < count; i++) { var x = Math.round(r() * 680 - 20), y = Math.round(r() * 280), L = 8 + Math.round(r() * 14); o += "M" + x + " " + y + "l-2.5 " + L; } return '<g opacity="' + (op || 0.22) + '">' + line(o, col || "#c4dcea", 0.9) + "</g>"; }
  /* point de fuite : interpolation vers (vx,vy) */
  function toward(x, y, vx, vy, t) { return [lerp(x, vx, t), lerp(y, vy, t)]; }

  /* ---------------------------------------------------------------- 1. Entrepôt du port */
  function entrepot(u) {
    var o = "<defs>" + lg("es" + u, [[0, "#050b13"], [0.5, "#0f2d3b"], [0.78, "#2c5662"], [1, "#3b6a70"]]) + lg("eg" + u, [[0, "#0d1a22"], [1, "#05090d"]]) + rg("eh" + u, [[0, "#fff2c4", 0.95], [0.35, "#ffd27a", 0.4], [1, "#ffb347", 0]]) + rg("er" + u, [[0, "#ff5a4a", 0.85], [1, "#ff5a4a", 0]]) +
      lg("ec" + u, [[0, "#ffe9b0", 0.55], [1, "#ffe9b0", 0]]) + lg("ed" + u, [[0, "#ffcf80", 0.95], [1, "#b8742a", 0.9]]) + lg("ew" + u, [[0, "#26343f"], [1, "#0f1820"]]) + lg("ef" + u, [[0, "#9ec3d4", 0], [0.5, "#9ec3d4", 0.2], [1, "#9ec3d4", 0]]) +
      '<pattern id="ek' + u + '" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H9M0 0V9" stroke="#0b1218" stroke-width="1.2" fill="none"/></pattern></defs>';
    o += rect(0, 0, 640, 280, "url(#es" + u + ")");
    var r = rnd(21); for (var c = 0; c < 7; c++) o += ell(r() * 640, 20 + r() * 90, 60 + r() * 90, 8 + r() * 10, "#a8c8d6", ' opacity="' + f1(0.05 + r() * 0.07) + '"');
    o += circ(548, 46, 26, "#cfe4ee", ' opacity=".5"') + circ(548, 46, 60, "#9cc8d8", ' opacity=".10"') + ell(548, 46, 90, 14, "#cfe4ee", ' opacity=".06"');
    /* horizon : navire, grues lointaines */
    o += rect(0, 150, 640, 14, "#10303a", ' opacity=".9"') + path("M410 150l14-12h130l16 12z", "#0a1820") + rect(440, 128, 58, 12, "#122630") + rect(446, 120, 30, 8, "#1a3440") + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return rect(430 + i * 20, 134, 18, 12, ["#6a2a26", "#2a526a", "#7a6a2a", "#2a6a54"][i % 4], ' opacity=".75"'); }).join("");
    [[40, 1.0], [150, 0.78], [300, 0.5]].forEach(function (c) { var x = c[0], k = c[1], g = '<g transform="translate(' + x + " " + f1(166 - 150 * k) + ") scale(" + k + ')" fill="#05101a">'; g += rect(0, 40, 5, 110, "#05101a") + rect(70, 40, 5, 110, "#05101a") + rect(-24, 34, 160, 8, "#05101a") + path("M2 40L36 -6 72 40z", "#05101a") + rect(34, -22, 4, 20, "#05101a") + line("M36 -6L-22 36M36 -6L132 36", "#05101a", 2) + line("M2 100H72M2 70H72M2 60L72 100M72 60L2 100", "#05101a", 1.4) + rect(100, 42, 3, 16, "#05101a") + rect(96, 58, 12, 10, "#05101a"); g += "</g>"; o += g + halo(x + 36 * k, 166 - 150 * k - 22 * k, 9 * k + 4, "er" + u) + circ(x + 36 * k, 166 - 150 * k - 22 * k, 1.8, "#ff6a5a"); });
    o += rect(0, 160, 640, 12, "url(#ef" + u + ")");
    /* entrepôt : tôle ondulée, toit, porte roulante entrouverte */
    o += rect(206, 104, 244, 100, "url(#ew" + u + ")") + path("M196 106L328 80 460 106z", "#0a1117") + rect(196, 104, 264, 5, "#33444f") + rect(206, 109, 244, 3, "#000", ' opacity=".35"');
    var cor = ""; for (var i = 210; i < 450; i += 5) cor += "M" + i + " 112V204"; o += line(cor, "#000", 1, ' opacity=".28"') + line(cor.replace(/M(\d+)/g, function (m, d) { return "M" + (+d + 2); }), "#5a7384", 0.7, ' opacity=".16"');
    o += rect(206, 150, 244, 2, "#000", ' opacity=".3"') + rect(216, 116, 30, 14, "#0a1319") + rect(216, 116, 30, 14, "#ffd27a", ' opacity=".12"') + rect(410, 116, 30, 14, "#0a1319") + rect(410, 116, 30, 14, "#ffd27a", ' opacity=".10"');
    o += rect(288, 140, 64, 64, "#05080b") + rect(288, 140, 64, 30, "#2c3a44") + (function () { var s = ""; for (var k = 142; k < 170; k += 4) s += rect(288, k, 64, 1.1, "#0a1015", ' opacity=".7"'); return s; })() + rect(288, 168, 64, 3, "#4a5d6a") + rect(288, 171, 64, 33, "url(#ed" + u + ")", ' opacity=".9"') + rect(288, 171, 64, 33, "url(#ew" + u + ")", ' opacity=".18"');
    o += rect(284, 138, 4, 66, "#3a4a56") + rect(352, 138, 4, 66, "#3a4a56") + rect(284, 136, 72, 4, "#4a5d6a");
    o += rect(262, 120, 14, 7, "#2a3a46") + halo(266, 128, 26, "eh" + u) + circ(266, 127, 2.6, "#fff6d8") + path("M252 128L280 128 304 204 228 204z", "url(#ec" + u + ")", ' opacity=".55"');
    /* conteneurs : tôle, arêtes, rouille */
    var C = ["#7e3027", "#2c5878", "#8a6a28", "#2c6a52", "#5a3a6c", "#7a4a26", "#3a4650"], rr = rnd(11);
    function box(x, y, w, h, tag) { var col = C[Math.floor(rr() * C.length)], s = rect(x, y, w, h, col) + rect(x, y, w, h, "url(#ew" + u + ")", ' opacity=".45"'); for (var i2 = 4; i2 < w - 2; i2 += 4.5) s += rect(x + i2, y + 3, 1.3, h - 6, "#000", ' opacity=".28"') + rect(x + i2 + 1.3, y + 3, 0.7, h - 6, "#fff", ' opacity=".07"'); s += rect(x, y, w, 2.4, "#fff", ' opacity=".2"') + rect(x, y + h - 2.6, w, 2.6, "#000", ' opacity=".4"') + rect(x, y, 2.4, h, "#000", ' opacity=".3"') + rect(x + w - 2.4, y, 2.4, h, "#000", ' opacity=".3"'); if (tag) s += rect(x + 5, y + 5, 10, 3, "#fff", ' opacity=".5"') + rect(x + 5, y + 10, 16, 2, "#fff", ' opacity=".3"'); if (rr() > 0.5) s += rect(x + rr() * (w - 8), y + 4, 3, h - 8, "#6a2a14", ' opacity=".28"'); return s; }
    for (var a = 0; a < 4; a++) { o += box(2 + a * 44, 172, 43, 32, a % 2) + (a < 3 ? box(10 + a * 44, 140, 43, 32, !(a % 2)) : "") + (a < 2 ? box(18 + a * 44, 108, 43, 32, a % 2) : ""); }
    for (var b = 0; b < 4; b++) { o += box(462 + b * 44, 176, 43, 28, b % 2) + (b > 0 ? box(472 + b * 44, 148, 43, 28, !(b % 2)) : "") + (b > 1 ? box(480 + b * 44, 120, 43, 28, b % 2) : ""); }
    /* sol mouillé : reflets */
    o += rect(0, 204, 640, 76, "url(#eg" + u + ")") + path("M296 204H344L400 280H240z", "#ffd27a", ' opacity=".22"') + path("M296 204H344L372 280H268z", "#fff2c4", ' opacity=".14"');
    [[40, 0.5, "#7e3027"], [100, 0.4, "#2c5878"], [520, 0.5, "#2c6a52"], [580, 0.4, "#8a6a28"]].forEach(function (q) { o += rect(q[0], 206, 40, 54, q[2], ' opacity="' + q[1] * 0.35 + '"'); });
    var pr = rnd(4); for (var p2 = 0; p2 < 7; p2++) { var px = 20 + pr() * 600, py = 218 + pr() * 54; o += ell(px, py, 18 + pr() * 34, 2.2 + pr() * 3, "#8fb4c4", ' opacity="' + f1(0.10 + pr() * 0.12) + '"') + ell(px, py, 10 + pr() * 18, 1, "#fff", ' opacity=".12"'); }
    o += line("M0 262L90 250L130 258M470 270L540 256L600 262M180 246L214 252", "#000", 1.2, ' opacity=".5"');
    o += rect(0, 192, 640, 22, "url(#ef" + u + ")", ' opacity=".8"');
    o += person(312, 204, 0.95) + person(330, 204, 0.8) + ell(321, 206, 26, 3, "#000", ' opacity=".4"');
    /* grillage au premier plan */
    o += '<g opacity=".55">' + rect(-4, 90, 128, 190, "url(#ek" + u + ")") + rect(-4, 90, 3, 190, "#06090c") + rect(58, 90, 3, 190, "#06090c") + rect(120, 90, 3, 190, "#06090c") + rect(-4, 90, 128, 2.6, "#06090c") + "</g>";
    o += rainStatic(5, 110) + vignette(u); return o;
  }

  /* ---------------------------------------------------------------- 2. Fourgon blindé */
  function fourgon(u) {
    var VX = 320, VY = 122, o = "<defs>" + lg("fs" + u, [[0, "#07080f"], [1, "#1c1530"]]) + rg("fl" + u, [[0, "#fff6d0", 1], [0.25, "#ffe2a0", 0.7], [1, "#ffb347", 0]]) + rg("fo" + u, [[0, "#ffb347", 0.9], [1, "#ffb347", 0]]) + rg("ft" + u, [[0, "#ff3a3a", 0.95], [0.4, "#ff3a3a", 0.35], [1, "#ff3a3a", 0]]) +
      lg("fv" + u, [[0, "#8792ab"], [0.12, "#6a7590"], [0.6, "#4c566e"], [1, "#2c3345"]]) + lg("fd" + u, [[0, "#5d6781"], [1, "#363d52"]]) + lg("fr" + u, [[0, "#171421"], [0.5, "#0e0d16"], [1, "#07070b"]]) + lg("fw" + u, [[0, "#2d2744"], [1, "#171326"]]) + lg("fz" + u, [[0, "#ff3a3a", 0.5], [1, "#ff3a3a", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#fs" + u + ")");
    /* tunnel : cadres successifs vers le point de fuite */
    var T = []; for (var i = 0; i <= 9; i++) T.push(1 - Math.pow(0.7, i));
    for (var j = 9; j >= 0; j--) { var t = T[j], a = toward(-70, -30, VX, VY, t), b = toward(710, 330, VX, VY, t), w = b[0] - a[0], h = b[1] - a[1]; o += '<rect x="' + f1(a[0]) + '" y="' + f1(a[1]) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="' + f1(w * 0.28) + '" fill="' + (j % 2 ? "url(#fw" + u + ")" : "#1d1832") + '" stroke="#3d3260" stroke-width="' + f1(Math.max(0.8, 5 * (1 - t))) + '" opacity="' + f1(0.5 + 0.5 * (1 - t)) + '"/>'; }
    o += circ(VX, VY, 56, "url(#fl" + u + ")") + circ(VX, VY, 11, "#fffbe8");
    /* lampes de paroi qui convergent */
    for (var k = 1; k <= 7; k++) { var tt = T[k], lp = toward(-70, 96, VX, VY, tt), rp = toward(710, 96, VX, VY, tt), s2 = 1 - tt; [lp, rp].forEach(function (p) { o += halo(p[0], p[1], 20 * s2 + 4, "fo" + u) + circ(p[0], p[1], 1.2 + 3 * s2, "#fff0c0"); }); var cp = toward(VX, -20, VX, VY, tt); o += rect(cp[0] - 40 * s2, cp[1], 80 * s2, 2 + 4 * s2, "#fff0c0", ' opacity="' + f1(0.35 + 0.4 * s2) + '"'); }
    /* chaussée */
    var rl = toward(-70, 330, VX, VY, 0.9), rr2 = toward(710, 330, VX, VY, 0.9);
    o += poly([[-70, 330], [710, 330], [rr2[0], rr2[1]], [rl[0], rl[1]]], "url(#fr" + u + ")") + poly([[-70, 330], [90, 330], [VX - 6, VY + 8]], "#2a2146", ' opacity=".6"') + poly([[550, 330], [710, 330], [VX + 6, VY + 8]], "#2a2146", ' opacity=".6"');
    for (var m = 0; m < 9; m++) { var t0 = 1 - Math.pow(0.78, m + 1.1), t1 = 1 - Math.pow(0.78, m + 1.55), p0 = toward(VX, 330, VX, VY, t0), p1 = toward(VX, 330, VX, VY, t1), w0 = 7 * (1 - t0), w1 = 7 * (1 - t1); o += poly([[p0[0] - w0, p0[1]], [p0[0] + w0, p0[1]], [p1[0] + w1, p1[1]], [p1[0] - w1, p1[1]]], "#e8e0c4", ' opacity=".7"'); }
    o += line("M120 330L" + VX + " " + VY + "M520 330L" + VX + " " + VY, "#8a76c4", 1.4, ' opacity=".4"');
    o += path("M330 128L340 128 400 280H350z", "#fff0c0", ' opacity=".07"') + ell(320, 236, 110, 14, "url(#fz" + u + ")");
    /* fourgon blindé vu de l'arrière */
    o += ell(320, 258, 118, 11, "#000", ' opacity=".65"');
    o += rect(244, 142, 152, 100, "url(#fv" + u + ")") + rect(244, 142, 152, 8, "#a4aec6", ' opacity=".55"') + rect(250, 134, 140, 10, "#3a4258") + rect(256, 130, 128, 5, "#252b3c") + rect(250, 134, 140, 2, "#c2cae0", ' opacity=".5"');
    o += rect(240, 150, 6, 84, "#323a4e") + rect(394, 150, 6, 84, "#323a4e") + rect(252, 154, 66, 74, "url(#fd" + u + ")") + rect(322, 154, 66, 74, "url(#fd" + u + ")") + rect(318, 152, 4, 80, "#1e2434");
    [[0, 0], [1, 0]].forEach(function (d) { var x0 = 252 + d[0] * 70; o += rect(x0, 154, 66, 74, "none", ' stroke="#1e2434" stroke-width="2"') + rect(x0 + 4, 158, 58, 3, "#fff", ' opacity=".12"') + rect(x0 + 6, 170, 54, 34, "none", ' stroke="#2a3146" stroke-width="1.4"'); [[10, 163], [56, 163], [10, 222], [56, 222], [10, 190], [56, 190]].forEach(function (q) { o += circ(x0 + q[0], q[1], 1.8, "#9aa5bf") + circ(x0 + q[0] - 0.4, q[1] - 0.4, 0.7, "#e0e6f4"); }); });
    o += rect(308, 186, 24, 12, "#1b2030") + circ(320, 192, 3.2, "#d8b04c") + rect(263, 164, 36, 4, "#10141f") + rect(341, 164, 36, 4, "#10141f");
    o += rect(244, 232, 152, 12, "#222838") + rect(244, 232, 152, 2, "#8a94ad", ' opacity=".4"') + rect(290, 234, 60, 12, "#d8dce6") + rect(292, 236, 56, 8, "#f4f4ee") + [0, 1, 2, 3, 4, 5].map(function (q) { return rect(296 + q * 8, 238, 4, 4, "#2a3042"); }).join("");
    o += halo(256, 224, 32, "ft" + u) + halo(384, 224, 32, "ft" + u) + rect(248, 214, 18, 16, "#d6303c") + rect(374, 214, 18, 16, "#d6303c") + rect(250, 216, 14, 4, "#ff9a90") + rect(376, 216, 14, 4, "#ff9a90");
    o += ell(270, 250, 28, 14, "#0a0a10") + ell(370, 250, 28, 14, "#0a0a10") + rect(244, 244, 152, 5, "#13151f") + ell(320, 262, 90, 6, "#ff3a3a", ' opacity=".18"');
    o += rect(266, 128, 30, 4, "#ff8a4a", ' opacity=".8"') + rect(344, 128, 30, 4, "#4aa0ff", ' opacity=".7"');
    o += rainStatic(9, 36, "#b8c8ff", 0.16) + vignette(u, 0.7); return o;
  }

  /* ---------------------------------------------------------------- 3. Galerie d'art */
  function galerie(u) {
    var VX = 320, VY = 186, o = "<defs>" + lg("gs" + u, [[0, "#1a1424"], [0.7, "#2c2036"], [1, "#3a2a40"]]) + lg("gf" + u, [[0, "#3a2a2c"], [1, "#0e090b"]]) + lg("gg" + u, [[0, "#f3d98a"], [0.5, "#b98a2c"], [1, "#6e4c14"]]) + lg("gc" + u, [[0, "#fff4d0", 0.5], [1, "#fff4d0", 0]]) +
      rg("gh" + u, [[0, "#9af0ff", 0.85], [1, "#9af0ff", 0]]) + rg("gp" + u, [[0, "#ffe9b0", 0.5], [1, "#ffe9b0", 0]]) + lg("gm" + u, [[0, "#f0ece2"], [1, "#b8b2a2"]]) + lg("gl" + u, [[0, "#ff3a4a", 0], [0.5, "#ff3a4a", 0.95], [1, "#ff3a4a", 0]], 1) + lg("gk" + u, [[0, "#bfefff", 0.35], [1, "#bfefff", 0.08]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#gs" + u + ")");
    /* mur : lambris, moulures */
    o += rect(0, 0, 640, 20, "#0a0710") + rect(0, 20, 640, 4, "#6a5030") + rect(0, 24, 640, 2, "#000", ' opacity=".4"') + rect(0, 150, 640, 40, "#241a2a") + rect(0, 148, 640, 3, "#7a5c34") + rect(0, 151, 640, 2, "#000", ' opacity=".4"');
    for (var p = 0; p < 9; p++) o += rect(10 + p * 80, 156, 60, 28, "none", ' stroke="#3a2c3e" stroke-width="1.2"');
    /* parquet en perspective */
    o += rect(0, 190, 640, 90, "url(#gf" + u + ")") + rect(0, 188, 640, 4, "#4a3438");
    var par = ""; for (var i = -12; i <= 12; i++) par += "M" + (VX + i * 60) + " 280L" + (VX + i * 6) + " 190"; for (var j = 0; j < 7; j++) { var y = 190 + Math.pow(j / 6, 1.7) * 90; par += "M0 " + f1(y) + "H640"; }
    o += line(par, "#000", 0.9, ' opacity=".5"') + line(par, "#a87850", 0.5, ' opacity=".12"') + ell(320, 232, 190, 20, "url(#gp" + u + ")") + ell(110, 224, 70, 10, "url(#gp" + u + ")", ' opacity=".7"') + ell(530, 224, 70, 10, "url(#gp" + u + ")", ' opacity=".7"');
    /* tableaux */
    function frame(x, y, w, h, kind) {
      var s = rect(x - 7, y - 7, w + 14, h + 14, "url(#gg" + u + ")") + rect(x - 4, y - 4, w + 8, h + 8, "#3a2a10") + rect(x - 2, y - 2, w + 4, h + 4, "#e8e0cc") + '<clipPath id="gq' + u + kind + x + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath><g clip-path="url(#gq' + u + kind + x + ')">';
      if (kind === 0) s += rect(x, y, w, h, "#d6924a") + rect(x, y, w, h * 0.55, "#e8b86a") + circ(x + w * 0.7, y + h * 0.35, h * 0.14, "#fff0b8") + path("M" + x + " " + (y + h * 0.7) + "Q" + (x + w * 0.3) + " " + (y + h * 0.35) + " " + (x + w * 0.6) + " " + (y + h * 0.65) + "T" + (x + w) + " " + (y + h * 0.6) + "V" + (y + h) + "H" + x + "z", "#4a5a3a") + path("M" + x + " " + (y + h * 0.85) + "Q" + (x + w * 0.5) + " " + (y + h * 0.6) + " " + (x + w) + " " + (y + h * 0.8) + "V" + (y + h) + "H" + x + "z", "#2a3624");
      else if (kind === 1) s += rect(x, y, w, h, "#1c2a3a") + ell(x + w / 2, y + h * 0.4, w * 0.26, h * 0.26, "#d8b494") + path("M" + (x + w * 0.12) + " " + (y + h) + "Q" + (x + w / 2) + " " + (y + h * 0.55) + " " + (x + w * 0.88) + " " + (y + h) + "z", "#6a2a3a") + path("M" + (x + w * 0.26) + " " + (y + h * 0.3) + "Q" + (x + w / 2) + " " + (y + h * 0.04) + " " + (x + w * 0.74) + " " + (y + h * 0.3) + "Q" + (x + w / 2) + " " + (y + h * 0.18) + " " + (x + w * 0.26) + " " + (y + h * 0.3) + "z", "#1a1410");
      else if (kind === 2) s += rect(x, y, w, h, "#e8e0cc") + circ(x + w * 0.35, y + h * 0.4, h * 0.22, "#c43a2e") + rect(x + w * 0.5, y + h * 0.18, w * 0.3, h * 0.5, "#1c3a8a") + path("M" + x + " " + (y + h * 0.8) + "L" + (x + w) + " " + (y + h * 0.5) + "V" + (y + h) + "H" + x + "z", "#e3b34c") + line("M" + x + " " + (y + h * 0.3) + "L" + (x + w) + " " + (y + h * 0.9), "#111", 2);
      else s += lg_(x, y, w, h, u) + path("M" + x + " " + (y + h * 0.62) + "Q" + (x + w * 0.25) + " " + (y + h * 0.5) + " " + (x + w * 0.5) + " " + (y + h * 0.62) + "T" + (x + w) + " " + (y + h * 0.58) + "V" + (y + h) + "H" + x + "z", "#1e4a6a") + path("M" + (x + w * 0.45) + " " + (y + h * 0.6) + "L" + (x + w * 0.55) + " " + (y + h * 0.3) + "L" + (x + w * 0.58) + " " + (y + h * 0.6) + "z", "#e8e4d8") + rect(x, y + h * 0.78, w, h * 0.22, "#0a1a2a", ' opacity=".5"');
      s += "</g>" + rect(x, y, w, h, "#000", ' opacity=".12"') + path("M" + x + " " + y + "l" + w * 0.4 + " 0l-" + w * 0.4 + " " + h * 0.5 + "z", "#fff", ' opacity=".07"') + rect(x + w / 2 - 14, y + h + 11, 28, 5, "#d8cfae", ' opacity=".8"') + rect(x + w / 2 - 16, y - 16, 32, 3, "#2a2230");
      return s + path("M" + (x + w / 2 - 16) + " " + (y - 13) + "L" + (x + w / 2 + 16) + " " + (y - 13) + "L" + (x + w + 8) + " " + (y + h) + "H" + (x - 8) + "z", "url(#gc" + u + ")", ' opacity=".5"');
    }
    function lg_(x, y, w, h, uu) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h * 0.62 + '" fill="#f0c898"/><rect x="' + x + '" y="' + (y + h * 0.62) + '" width="' + w + '" height="' + h * 0.38 + '" fill="#2a6a8a"/>'; }
    o += frame(36, 54, 100, 70, 0) + frame(172, 40, 70, 92, 1) + frame(398, 40, 70, 92, 2) + frame(506, 54, 100, 70, 3);
    /* vitrine centrale */
    o += ell(320, 190, 80, 7, "#000", ' opacity=".55"') + rect(284, 156, 72, 34, "url(#gm" + u + ")") + rect(278, 150, 84, 8, "#f6f2e6") + rect(278, 158, 84, 2, "#000", ' opacity=".25"') + rect(288, 168, 64, 1.5, "#000", ' opacity=".12"');
    o += rect(290, 110, 60, 40, "url(#gk" + u + ")") + rect(290, 110, 60, 40, "none", ' stroke="#d8f4ff" stroke-width="1.4" opacity=".8"') + path("M294 112L318 112 294 148z", "#fff", ' opacity=".18"');
    o += halo(320, 132, 44, "gh" + u) + poly([[320, 112], [336, 128], [320, 148], [304, 128]], "#6ee0f0") + poly([[320, 112], [336, 128], [320, 128]], "#c4faff") + poly([[320, 112], [304, 128], [320, 128]], "#9aeaf8") + poly([[304, 128], [320, 128], [320, 148]], "#38b4cc") + poly([[336, 128], [320, 128], [320, 148]], "#2a94b0") + line("M320 100V90M308 104L302 98M332 104L338 98", "#fff", 1.4, ' opacity=".7"');
    /* faisceaux laser */
    o += '<g>' + line("M0 176L640 128M0 130L640 182M0 156H640M150 190L560 40M110 40L520 190", "#ff3a4a", 4, ' opacity=".10"') + line("M0 176L640 128M0 130L640 182M0 156H640M150 190L560 40M110 40L520 190", "#ff4658", 1.3, ' opacity=".9"') + line("M0 176L640 128M0 130L640 182M0 156H640", "#ffd0d0", 0.5, ' opacity=".6"') + "</g>";
    [176, 130, 156].forEach(function (q) { o += rect(0, q - 6, 9, 12, "#1a1620") + circ(9, q, 2.6, "#ff5a5a") + circ(9, q, 8, "#ff3a4a", ' opacity=".3"'); });
    /* caméra de surveillance */
    o += rect(596, 20, 26, 4, "#1c1822") + path("M600 24h18l4 12h-26z", "#2c2832") + rect(598, 26, 22, 8, "#15121a") + circ(606, 31, 2.2, "#ff3a3a") + circ(606, 31, 5, "#ff3a3a", ' opacity=".25"');
    /* cordons et silhouette */
    [[60], [180]].forEach(function (q) { o += rect(q[0] - 2, 192, 4, 40, "#2a2430") + circ(q[0], 192, 5, "#c9a24a") + ell(q[0], 234, 10, 3, "#c9a24a"); }); o += line("M60 196Q120 222 180 196", "#7a1a24", 3) + line("M60 196Q120 218 180 196", "#c43a4a", 1, ' opacity=".5"');
    o += person(470, 232, 1.45, "#04030a") + path("M458 212c8-5 18-5 26 0", "none") + ell(470, 234, 24, 3, "#000", ' opacity=".5"');
    o += vignette(u, 0.7); return o;
  }

  /* ---------------------------------------------------------------- 4. Coffre du casino */
  function casino(u) {
    var o = "<defs>" + lg("cs" + u, [[0, "#14060f"], [0.7, "#2a0f1d"], [1, "#3a1426"]]) + rg("cg" + u, [[0, "#ffd980", 0.5], [0.5, "#ffb347", 0.15], [1, "#ffb347", 0]]) + lg("cm" + u, [[0, "#f2f5fb"], [0.25, "#8f9bb4"], [0.5, "#d9deea"], [0.75, "#6b7690"], [1, "#a8b2c8"]], 1) + lg("cd" + u, [[0, "#4a5266"], [0.5, "#323949"], [1, "#1f2430"]]) + lg("cb" + u, [[0, "#fff2a8"], [0.35, "#f0c248"], [1, "#a8741c"]]) + lg("cf" + u, [[0, "#3a0f1c"], [1, "#12060b"]]) + lg("cc" + u, [[0, "#ffe0a0", 0.55], [1, "#ffe0a0", 0]]) + rg("cn" + u, [[0, "#ff4f8b", 0.7], [1, "#ff4f8b", 0]]) + rg("cy" + u, [[0, "#ffd36e", 0.7], [1, "#ffd36e", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#cs" + u + ")") + rect(0, 0, 640, 280, "url(#cg" + u + ")");
    for (var i = 0; i < 9; i++) { o += rect(i * 80 + 4, 30, 72, 160, "#1c0a14", ' opacity=".6"') + rect(i * 80 + 4, 30, 72, 160, "none", ' stroke="#6a4a2a" stroke-width="1" opacity=".5"') + path("M" + (i * 80 + 40) + " 190q-26 -60 0 -120q26 60 0 120", "none", ' stroke="#8a6a38" stroke-width="1" opacity=".3"'); }
    o += rect(0, 20, 640, 10, "#0a0408") + rect(0, 28, 640, 3, "#8a6a38", ' opacity=".7"');
    [90, 320, 550].forEach(function (x) { o += path("M" + (x - 10) + " 24L" + (x + 10) + " 24L" + (x + 80) + " 200L" + (x - 80) + " 200z", "url(#cc" + u + ")", ' opacity=".45"') + rect(x - 10, 20, 20, 6, "#2a2030") + circ(x, 27, 3, "#fff6d8"); });
    /* sol moquette */
    o += rect(0, 200, 640, 80, "url(#cf" + u + ")") + rect(0, 196, 640, 5, "#7a5a2a") + rect(0, 201, 640, 2, "#000", ' opacity=".5"') + (function () { var s = ""; for (var k = 0; k < 14; k++) s += path("M" + (k * 50 + 25) + " 206l12 10-12 10-12-10z", "none", ' stroke="#8a6a38" stroke-width=".8" opacity=".35"'); return s; })() + ell(320, 240, 200, 18, "#ffb347", ' opacity=".12"');
    /* enseigne néon */
    o += halo(320, 36, 120, "cn" + u, 0.5) + '<g fill="none" stroke-linecap="round">' + rect(206, 8, 228, 36, "none", ' stroke="#ff4f8b" stroke-width="3" rx="9"') + rect(206, 8, 228, 36, "none", ' stroke="#ff9ac0" stroke-width="1" rx="9" opacity=".7"') + circ(238, 26, 9, "none", ' stroke="#ff4f8b" stroke-width="3"') + path("M262 26l9-11 9 11-9 11z", "none", ' stroke="#ffd36e" stroke-width="3"') + path("M308 36q-10 -8 -10 -14a6 6 0 0 1 10 -3 6 6 0 0 1 10 3q0 6 -10 14z", "none", ' stroke="#ff4f8b" stroke-width="3"') + path("M338 38l9-22 9 22M341 31h12", "none", ' stroke="#ffd36e" stroke-width="3"') + path("M372 16h26M372 26h20M372 36h26", "none", ' stroke="#ff4f8b" stroke-width="3"') + "</g>";
    /* porte de coffre */
    var cx = 320, cy = 134;
    o += circ(cx + 6, cy + 8, 96, "#000", ' opacity=".5"') + rect(210, 54, 20, 56, "url(#cm" + u + ")") + rect(210, 150, 20, 56, "url(#cm" + u + ")") + rect(208, 52, 24, 4, "#e8edf6") + circ(cx, cy, 90, "#1c212c") + circ(cx, cy, 86, "url(#cm" + u + ")") + circ(cx, cy, 76, "#2a303f") + circ(cx, cy, 72, "url(#cd" + u + ")") + circ(cx, cy, 72, "none", ' stroke="#9aa6bf" stroke-width="2"') + circ(cx, cy, 60, "none", ' stroke="#12151d" stroke-width="2"') + circ(cx, cy, 58, "none", ' stroke="#8793ac" stroke-width="1" opacity=".5"');
    for (var a = 0; a < 12; a++) { var an = a * 30 * Math.PI / 180, bx = cx + Math.cos(an) * 81, by = cy + Math.sin(an) * 81; o += circ(bx, by, 5.2, "url(#cm" + u + ")") + circ(bx, by, 5.2, "none", ' stroke="#12151d" stroke-width="1"') + circ(bx - 0.8, by - 0.8, 1.6, "#fff", ' opacity=".7"'); }
    o += circ(cx, cy, 36, "#12151d") + circ(cx, cy, 33, "url(#cm" + u + ")") + circ(cx, cy, 24, "#2a303f") + [0, 60, 120, 180, 240, 300].map(function (g) { return '<g transform="rotate(' + g + " " + cx + " " + cy + ')">' + rect(cx - 3.5, cy - 56, 7, 38, "url(#cm" + u + ")", ' rx="3"') + circ(cx, cy - 58, 7, "#d8b04c") + circ(cx - 1.4, cy - 59.4, 2.2, "#fff6c0", ' opacity=".8"') + "</g>"; }).join("") + circ(cx, cy, 12, "#d8b04c") + circ(cx - 3, cy - 3, 4, "#fff6c0", ' opacity=".7"');
    o += rect(cx + 40, cy + 38, 30, 22, "#12151d", ' rx="3"') + circ(cx + 55, cy + 49, 7, "url(#cm" + u + ")") + line("M" + (cx + 55) + " " + (cy + 49) + "L" + (cx + 58) + " " + (cy + 44), "#12151d", 1.4) + path("M262 84a74 74 0 0 1 48-30", "none", ' stroke="#fff" stroke-width="3" opacity=".5"') + path("M250 100a82 82 0 0 1 10-18", "none", ' stroke="#fff" stroke-width="2" opacity=".3"');
    /* lingots et jetons */
    function bars(x, y, rows, dir) { var s = ""; for (var r = 0; r < rows; r++) for (var c = 0; c < rows - r; c++) { var bx = x + c * 38 + r * 19, by = y - r * 15; s += path("M" + bx + " " + by + "l5-9h28l5 9z", "#fff6c0", ' opacity=".95"') + rect(bx, by, 38, 13, "url(#cb" + u + ")") + rect(bx, by, 38, 2.6, "#fff", ' opacity=".5"') + rect(bx, by + 10.4, 38, 2.6, "#000", ' opacity=".28"') + rect(bx + 10, by + 4, 18, 5, "#a8741c", ' opacity=".55" rx="1"'); } return s; }
    o += bars(14, 244, 4) + bars(448, 244, 4);
    [[232, 4], [394, 3]].forEach(function (q) { for (var k = 0; k < q[1] + 2; k++) o += ell(q[0] + 20, 250 - k * 5, 17, 5, ["#d6303c", "#2d8aa8", "#e3b34c", "#1e1e24"][k % 4]) + rect(q[0] + 3, 245 - k * 5, 34, 5, ["#d6303c", "#2d8aa8", "#e3b34c", "#1e1e24"][k % 4]) + ell(q[0] + 20, 245 - k * 5, 17, 5, ["#e86a74", "#5ec0d8", "#f6d884", "#3a3a44"][k % 4]); });
    o += ell(320, 258, 130, 6, "#000", ' opacity=".4"');
    [[150, 76], [494, 92], [64, 138], [580, 150], [196, 168], [444, 66]].forEach(function (q) { o += path("M" + q[0] + " " + (q[1] - 8) + "l2 6 6 2-6 2-2 6-2-6-6-2 6-2z", "#fff6c0", ' opacity=".8"'); });
    o += person(566, 238, 1.3, "#07030a") + ell(566, 240, 20, 3, "#000", ' opacity=".5"') + vignette(u, 0.68); return o;
  }

  /* ---------------------------------------------------------------- 5. Convoi rival (route côtière de nuit) */
  function convoi(u) {
    var VX = 392, VY = 128, o = "<defs>" + lg("ks" + u, [[0, "#04080f"], [0.6, "#0f2438"], [1, "#2a4a5e"]]) + lg("kr" + u, [[0, "#1a1d27"], [1, "#07080c"]]) + lg("ksea" + u, [[0, "#0f2c40"], [1, "#05121c"]]) + rg("kh" + u, [[0, "#fff6d0", 0.95], [0.3, "#ffe2a0", 0.4], [1, "#ffb347", 0]]) + rg("kt" + u, [[0, "#ff3a3a", 0.95], [0.4, "#ff3a3a", 0.3], [1, "#ff3a3a", 0]]) + lg("kv" + u, [[0, "#3c4458"], [0.4, "#1f2432"], [1, "#0b0d14"]]) + lg("kz" + u, [[0, "#cfe4ee", 0], [0.5, "#cfe4ee", 0.5], [1, "#cfe4ee", 0]], 1) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#ks" + u + ")");
    var r = rnd(8); for (var c = 0; c < 6; c++) o += ell(r() * 640, 16 + r() * 70, 70 + r() * 80, 7 + r() * 8, "#a8c8d6", ' opacity="' + f1(0.05 + r() * 0.06) + '"');
    for (var s = 0; s < 40; s++) o += circ(r() * 640, r() * 90, 0.6 + r() * 0.7, "#fff", ' opacity="' + f1(0.3 + r() * 0.5) + '"');
    o += circ(130, 48, 24, "#dbeaf2", ' opacity=".55"') + circ(130, 48, 64, "#9cc8d8", ' opacity=".10"');
    /* collines et ville lointaine */
    o += path("M300 128L360 100 430 116 500 92 570 112 640 96V132H300z", "#0a1a28") + path("M0 128L90 112 180 124 300 110V132H0z", "#0a1a28", ' opacity=".7"');
    var cr = rnd(5); for (var b = 0; b < 26; b++) { var bx = 420 + b * 9, bh = 8 + cr() * 26; o += rect(bx, 128 - bh, 7, bh, "#07121c"); if (cr() > 0.4) o += rect(bx + 2, 128 - bh + 3, 2, 2, "#ffd27a", ' opacity=".85"'); }
    /* mer et reflet de lune */
    o += rect(0, 128, 392, 70, "url(#ksea" + u + ")") + rect(100, 128, 60, 70, "url(#kz" + u + ")", ' opacity=".35"') + line("M104 134h52M110 142h40M114 150h32M118 160h24M122 172h16", "#e8f4fa", 1.4, ' opacity=".35"');
    /* route en perspective */
    o += poly([[VX - 4, VY], [VX + 4, VY], [900, 280], [-120, 280]], "url(#kr" + u + ")") + poly([[VX - 4, VY], [VX - 8, VY], [-260, 280], [-120, 280]], "#2c3446", ' opacity=".7"');
    for (var m = 0; m < 10; m++) { var t0 = 1 - Math.pow(0.76, m + 1.2), t1 = 1 - Math.pow(0.76, m + 1.7), p0 = toward(VX + 40, 280, VX, VY, t0), p1 = toward(VX + 40, 280, VX, VY, t1), w0 = 3.4 * (1 - t0), w1 = 3.4 * (1 - t1); o += poly([[p0[0] - w0, p0[1]], [p0[0] + w0, p0[1]], [p1[0] + w1, p1[1]], [p1[0] - w1, p1[1]]], "#e8e0c4", ' opacity=".75"'); }
    var gl = toward(120, 280, VX, VY, 0), gl2 = toward(120, 280, VX, VY, 0.86); o += line("M" + gl[0] + " " + gl[1] + "L" + f1(gl2[0]) + " " + f1(gl2[1]), "#7a8498", 3, ' opacity=".8"') + line("M" + gl[0] + " " + (gl[1] - 12) + "L" + f1(gl2[0]) + " " + f1(gl2[1] - 4), "#aab4c8", 1.4, ' opacity=".7"');
    for (var q = 0; q < 14; q++) { var tq = 1 - Math.pow(0.8, q + 1), pp = toward(120, 280, VX, VY, tq); o += rect(pp[0] - 1, pp[1] - 12 * (1 - tq), 2, 12 * (1 - tq), "#5a6478"); }
    /* lampadaires qui convergent */
    for (var l = 1; l <= 7; l++) { var tl = 1 - Math.pow(0.74, l), pl = toward(690, 280, VX, VY, tl), sc = 1 - tl; o += rect(pl[0] - 1.2 * sc * 2, pl[1] - 150 * sc, 2.4 * sc * 2, 150 * sc, "#0a0e16") + rect(pl[0] - 20 * sc, pl[1] - 152 * sc, 22 * sc, 3 * sc, "#0a0e16") + halo(pl[0] - 18 * sc, pl[1] - 148 * sc, 34 * sc + 4, "kh" + u) + circ(pl[0] - 18 * sc, pl[1] - 148 * sc, 2 * sc + 0.6, "#fff6d8") + path("M" + f1(pl[0] - 18 * sc) + " " + f1(pl[1] - 148 * sc) + "l-" + f1(26 * sc) + " " + f1(150 * sc) + "h" + f1(52 * sc) + "z", "#ffe2a0", ' opacity=".06"'); }
    /* véhicules du convoi, vus de l'arrière */
    function suv(cx, base, k, lim) {
      var w = 150 * k, h = (lim ? 46 : 58) * k, x = cx - w / 2, y = base - h, s = ell(cx, base + 2 * k, w * 0.62, 7 * k, "#000", ' opacity=".6"');
      s += rect(x + w * 0.06, y + h * 0.56, w * 0.88, h * 0.4, "url(#kv" + u + ")", ' rx="' + f1(4 * k) + '"') + path("M" + f1(x + w * 0.16) + " " + f1(y + h * 0.58) + "L" + f1(x + w * 0.22) + " " + f1(y + h * 0.04) + "H" + f1(x + w * 0.78) + "L" + f1(x + w * 0.84) + " " + f1(y + h * 0.58) + "z", "#1b2030");
      s += path("M" + f1(x + w * 0.24) + " " + f1(y + h * 0.5) + "L" + f1(x + w * 0.28) + " " + f1(y + h * 0.14) + "H" + f1(x + w * 0.72) + "L" + f1(x + w * 0.76) + " " + f1(y + h * 0.5) + "z", "#0a0d14") + path("M" + f1(x + w * 0.3) + " " + f1(y + h * 0.18) + "H" + f1(x + w * 0.5) + "L" + f1(x + w * 0.44) + " " + f1(y + h * 0.48) + "H" + f1(x + w * 0.27) + "z", "#8fb0d0", ' opacity=".18"');
      s += rect(x + w * 0.06, y + h * 0.56, w * 0.88, 1.6 * k, "#8a94ad", ' opacity=".35"') + rect(x + w * 0.1, y + h * 0.86, w * 0.8, h * 0.12, "#07080c") + rect(x + w * 0.4, y + h * 0.68, w * 0.2, h * 0.12, "#e8e8e0") + rect(x + w * 0.04, y + h * 0.86, w * 0.16, h * 0.2, "#05060a") + rect(x + w * 0.8, y + h * 0.86, w * 0.16, h * 0.2, "#05060a");
      s += halo(x + w * 0.14, y + h * 0.66, 30 * k, "kt" + u) + halo(x + w * 0.86, y + h * 0.66, 30 * k, "kt" + u) + rect(x + w * 0.08, y + h * 0.6, w * 0.16, h * 0.14, "#d6303c", ' rx="' + f1(1.5 * k) + '"') + rect(x + w * 0.76, y + h * 0.6, w * 0.16, h * 0.14, "#d6303c", ' rx="' + f1(1.5 * k) + '"') + rect(x + w * 0.1, y + h * 0.62, w * 0.12, h * 0.04, "#ffb0a8") + rect(x + w * 0.78, y + h * 0.62, w * 0.12, h * 0.04, "#ffb0a8");
      s += rect(cx - w * 0.14, y - 2 * k, w * 0.28, 2.6 * k, "#4aa0ff", ' opacity=".85"') + ell(cx, base + 10 * k, w * 0.46, 7 * k, "#ff3a3a", ' opacity=".16"');
      return s;
    }
    o += suv(436, 154, 0.36) + suv(430, 170, 0.56, 1) + suv(410, 214, 0.98);
    o += rainStatic(14, 40, "#c8d8f0", 0.14) + vignette(u, 0.7); return o;
  }

  /* ---------------------------------------------------------------- 6. Raid de quartier (rue barricadée) */
  function raid(u) {
    var VX = 320, VY = 128, o = "<defs>" + lg("rs" + u, [[0, "#070a14"], [1, "#1c1a2e"]]) + lg("rb" + u, [[0, "#171b28"], [1, "#0a0c14"]]) + lg("rw" + u, [[0, "#1d2232"], [1, "#0d1019"]]) + rg("rn" + u, [[0, "#3affc0", 0.8], [1, "#3affc0", 0]]) + rg("rp" + u, [[0, "#ff4f8b", 0.8], [1, "#ff4f8b", 0]]) + rg("rl" + u, [[0, "#fff0c0", 0.9], [0.35, "#ffd27a", 0.35], [1, "#ffb347", 0]]) + lg("rr" + u, [[0, "#20232f"], [1, "#07080c"]]) + rg("rf" + u, [[0, "#ffe0a0", 0.65], [1, "#ffe0a0", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#rs" + u + ")") + circ(VX, VY - 6, 70, "url(#rl" + u + ")", ' opacity=".5"');
    /* immeubles de part et d'autre, en perspective */
    function side(sign) {
      var s = "", x0 = sign < 0 ? -40 : 680, rr = rnd(sign < 0 ? 3 : 6);
      for (var i = 0; i < 5; i++) {
        var ta = 1 - Math.pow(0.66, i), tb = 1 - Math.pow(0.66, i + 1), a = toward(x0, 0, VX, VY, ta), b = toward(x0, 0, VX, VY, tb), a2 = toward(x0, 330, VX, VY, ta), b2 = toward(x0, 330, VX, VY, tb);
        var topA = a[1] - (i % 2 ? 20 : 0) * (1 - ta), topB = b[1] - (i % 2 ? 20 : 0) * (1 - tb);
        s += poly([[a[0], topA], [b[0], topB], [b2[0], b2[1]], [a2[0], a2[1]]], "url(#rw" + u + ")", ' stroke="#05060a" stroke-width="1"');
        for (var fl = 0; fl < 4; fl++) for (var wn = 0; wn < 2; wn++) {
          var u0 = 0.18 + wn * 0.4, u1 = u0 + 0.24, yy0 = 0.1 + fl * 0.17, yy1 = yy0 + 0.1, lit = rr() > 0.45, col = lit ? (rr() > 0.5 ? "#ffd27a" : "#9ad8ff") : "#07090f";
          function P(uu, vv) { var X = lerp(a[0], b[0], uu), top = lerp(topA, topB, uu), bot = lerp(a2[1], b2[1], uu); return [X, lerp(top, bot, vv)]; }
          var p1 = P(u0, yy0), p2 = P(u1, yy0), p3 = P(u1, yy1), p4 = P(u0, yy1); s += poly([p1, p2, p3, p4], col, ' opacity="' + (lit ? 0.85 : 0.9) + '"');
        }
      }
      return s;
    }
    o += side(-1) + side(1);
    /* enseignes néon rivales */
    o += halo(96, 74, 54, "rn" + u) + rect(60, 62, 70, 20, "none", ' stroke="#3affc0" stroke-width="3" rx="4"') + path("M72 72h14M96 72h8M112 72h10", "none", ' stroke="#bfffe8" stroke-width="3"') + halo(552, 90, 50, "rp" + u) + path("M526 78l16-16 16 16-16 16z", "none", ' stroke="#ff4f8b" stroke-width="3"') + path("M566 70h22M566 80h16M566 90h22", "none", ' stroke="#ffc0d8" stroke-width="3"');
    /* chaussée mouillée */
    o += poly([[VX - 4, VY + 2], [VX + 4, VY + 2], [760, 280], [-120, 280]], "url(#rr" + u + ")");
    for (var m = 0; m < 8; m++) { var t0 = 1 - Math.pow(0.74, m + 1.1), t1 = 1 - Math.pow(0.74, m + 1.5), p0 = toward(VX, 280, VX, VY, t0), p1 = toward(VX, 280, VX, VY, t1), w0 = 3.4 * (1 - t0), w1 = 3.4 * (1 - t1); o += poly([[p0[0] - w0, p0[1]], [p0[0] + w0, p0[1]], [p1[0] + w1, p1[1]], [p1[0] - w1, p1[1]]], "#d8d0b4", ' opacity=".4"'); }
    o += path("M120 270L220 200 210 280z", "#3affc0", ' opacity=".08"') + path("M520 270L440 200 450 280z", "#ff4f8b", ' opacity=".08"') + ell(320, 250, 150, 12, "#ffd27a", ' opacity=".08"');
    /* lampadaires */
    [[-1, 1], [1, 1], [-1, 3], [1, 3]].forEach(function (q) { var tt = 1 - Math.pow(0.66, q[1]), pl = toward(q[0] < 0 ? 40 : 600, 280, VX, VY, tt), sc = 1 - tt; o += rect(pl[0] - 1.5, pl[1] - 150 * sc, 3, 150 * sc, "#06080d") + halo(pl[0], pl[1] - 150 * sc, 38 * sc + 6, "rl" + u) + circ(pl[0], pl[1] - 150 * sc, 2.4 * sc + 0.8, "#fff6d8"); });
    /* barricade : caisses, palettes, pneus, grillage */
    var bx = 214, by = 236;
    o += ell(320, 238, 120, 9, "#000", ' opacity=".55"');
    function crate(x, y, w, h, c) { var s = rect(x, y, w, h, c) + rect(x, y, w, 3, "#fff", ' opacity=".16"') + rect(x, y + h - 3, w, 3, "#000", ' opacity=".35"'); for (var k = 1; k < 4; k++) s += rect(x, y + (h / 4) * k, w, 1.2, "#000", ' opacity=".35"'); return s + line("M" + x + " " + y + "L" + (x + w) + " " + (y + h), "#000", 1, ' opacity=".25"'); }
    o += crate(bx, by - 30, 40, 30, "#5a4126") + crate(bx + 40, by - 30, 40, 30, "#4a3820") + crate(bx + 80, by - 30, 44, 30, "#654a2a") + crate(bx + 124, by - 30, 40, 30, "#4a3820") + crate(bx + 164, by - 30, 40, 30, "#5a4126") + crate(bx + 20, by - 58, 44, 28, "#4a3820") + crate(bx + 64, by - 58, 40, 28, "#5a4126") + crate(bx + 104, by - 58, 44, 28, "#654a2a") + crate(bx + 148, by - 58, 40, 28, "#4a3820");
    for (var tI = 0; tI < 3; tI++) o += ell(bx + 12 + tI * 90, by + 6, 15, 9, "#07080b") + ell(bx + 12 + tI * 90, by + 4, 9, 4, "#1a1c24");
    o += line("M" + (bx + 6) + " " + (by - 70) + "V" + (by - 58) + "M" + (bx + 196) + " " + (by - 70) + "V" + (by - 58), "#2a2e3a", 2) + line("M" + (bx + 6) + " " + (by - 66) + "H" + (bx + 196), "#4a5262", 1.2, ' opacity=".7"');
    o += halo(bx + 100, by - 76, 52, "rf" + u) + rect(bx + 94, by - 84, 12, 3, "#1a1a22") + circ(bx + 100, by - 80, 2.4, "#fff6d8") + path("M" + (bx + 100) + " " + (by - 78) + "L" + (bx + 150) + " " + by + "H" + (bx + 50) + "z", "#ffe0a0", ' opacity=".07"');
    /* graffiti rival (couronne) sur le mur de gauche */
    o += path("M30 190l8-14 8 10 8-10 8 14z", "#3affc0", ' opacity=".65"') + line("M30 196q16 6 32 0", "#3affc0", 2, ' opacity=".6"') + line("M28 206q20 10 40 0", "#3affc0", 1.4, ' opacity=".4"');
    /* silhouettes, vapeur */
    o += person(300, 150, 0.46, "#05070c") + person(318, 152, 0.4, "#05070c") + person(338, 150, 0.46, "#05070c") + person(560, 244, 1.2) + ell(130, 262, 34, 6, "#9ab", ' opacity=".12"') + ell(122, 252, 22, 10, "#9ab", ' opacity=".08"');
    o += rainStatic(12, 50, "#c8d8f0", 0.15) + vignette(u, 0.72); return o;
  }

  /* repli : silhouette de ville générique */
  function generic(u) {
    var o = "<defs>" + lg("xs" + u, [[0, "#070c18"], [0.7, "#16243c"], [1, "#2c4060"]]) + "</defs>" + rect(0, 0, 640, 280, "url(#xs" + u + ")") + circ(500, 56, 24, "#d8e6ff", ' opacity=".5"') + circ(500, 56, 56, "#9cc0f0", ' opacity=".10"'), r = rnd(3);
    for (var i = 0; i < 15; i++) { var w = 30 + r() * 36, h = 70 + r() * 130, x = i * 44 - 10; o += rect(x, 280 - h, w, h, "#0a101c") + rect(x, 280 - h, w, 3, "#2a3a56", ' opacity=".6"'); for (var k = 0; k < 9; k++) if (r() > 0.5) o += rect(x + 5 + (k % 3) * 9, 280 - h + 10 + Math.floor(k / 3) * 15, 5, 7, "#ffd27a", ' opacity=".75"'); }
    return o + rect(0, 250, 640, 30, "#05080e") + rainStatic(2, 60) + vignette(u);
  }

  var SCENES = { scene_entrepot: entrepot, scene_fourgon: fourgon, scene_galerie: galerie, scene_casino: casino, scene_convoi: convoi, scene_raid: raid, scene_generic: generic };
  var ALT = {
    scene_entrepot: "Entrepôt du port la nuit : conteneurs, grues au loin, porte roulante entrouverte sous la pluie", scene_fourgon: "Fourgon blindé vu de l’arrière, roulant dans un tunnel éclairé", scene_galerie: "Salle de galerie d’art avec tableaux, vitrine et faisceaux laser autour d’une gemme",
    scene_casino: "Salle du coffre du casino : porte blindée, lingots et enseigne néon", scene_convoi: "Convoi de trois véhicules noirs sur une route côtière de nuit", scene_raid: "Rue d’un quartier la nuit, barricade de caisses et enseignes néon rivales", scene_generic: "Silhouette de la ville la nuit"
  };
  function key(op) { var o = typeof op === "string" ? (BL.equip && BL.equip.op ? BL.equip.op(op) : null) : op; var k = o && o.img; return SCENES[k] ? k : "scene_generic"; }
  function scene(op, cls) { var k = key(op), u = "o" + (++n); return '<svg class="oa ' + (cls || "") + '" viewBox="0 0 640 280" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + ALT[k] + '">' + SCENES[k](u) + "</svg>"; }
  /* Scènes supplémentaires (ops-art2.js) : enregistrées avec leur description pour lecteur d'écran */
  function register(k, fn, alt) { SCENES[k] = fn; ALT[k] = alt; BL.opsArt.KEYS = Object.keys(SCENES); }
  BL.opsArt = { scene: scene, key: key, KEYS: Object.keys(SCENES), ALT: ALT, register: register, H: { rnd: rnd, f1: f1, lerp: lerp, rect: rect, circ: circ, ell: ell, path: path, line: line, poly: poly, lg: lg, rg: rg, halo: halo, person: person, vignette: vignette, rainStatic: rainStatic, toward: toward } };
})(typeof window !== "undefined" ? window : globalThis);
