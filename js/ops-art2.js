/* Illustrations des convois rivaux (4) et des raids de quartier (3) : une scène STATIQUE propre à chaque mission, aux couleurs de la faction visée.
   Format 640×280. Aucune animation, aucun personnage en action violente : lieux, véhicules, lumières, silhouettes. Dépend de ops-art.js (BL.opsArt.H). */
(function (root) {
  var BL = root.BL = root.BL || {}, A = BL.opsArt; if (!A || !A.H) return;
  var H = A.H, rnd = H.rnd, f1 = H.f1, lerp = H.lerp, rect = H.rect, circ = H.circ, ell = H.ell, path = H.path, line = H.line, poly = H.poly, lg = H.lg, rg = H.rg, halo = H.halo, person = H.person, vignette = H.vignette, toward = H.toward;
  function emblem(shape, col, x, y, k, op) { var fn = BL.portraits && BL.portraits.shapes && BL.portraits.shapes[shape]; if (!fn) return ""; return '<g transform="translate(' + f1(x) + " " + f1(y) + ") scale(" + f1(k) + ')"' + (op ? ' opacity="' + op + '"' : "") + ">" + fn(col) + "</g>"; }
  function stars(seed, n, h) { var r = rnd(seed), o = ""; for (var i = 0; i < n; i++) o += circ(r() * 640, r() * h, 0.6 + r() * 0.8, "#fff", ' opacity="' + f1(0.35 + r() * 0.5) + '"'); return o; }
  function lamp(x, base, h, col, sc) { sc = sc || 1; return rect(x - 1.2 * sc, base - h, 2.4 * sc, h, "#0a0d14") + circ(x, base - h, 3 * sc, "#fff6d8") + circ(x, base - h, 14 * sc, col, ' opacity=".28"') + circ(x, base - h, 30 * sc, col, ' opacity=".10"'); }
  function tail(x, y, w, col) { return rect(x, y, w, 4, col) + ell(x + w / 2, y + 2, w * 1.2, 7, col, ' opacity=".25"'); }

  /* ---- Convoi des Lames du Nord : motards en formation, route côtière au crépuscule (bleu) ---- */
  function cvLames(u) {
    var VX = 330, VY = 150, o = "<defs>" + lg("a" + u, [[0, "#0b1f3d"], [0.55, "#2f6aa3"], [1, "#f0b27a"]]) + lg("b" + u, [[0, "#1c3a5c"], [1, "#0a1626"]]) + lg("c" + u, [[0, "#222a38"], [1, "#0b0e15"]]) + rg("d" + u, [[0, "#ffe2b0", 0.9], [1, "#ffb070", 0]]) + "</defs>";
    o += rect(0, 0, 640, 150, "url(#a" + u + ")") + stars(7, 30, 70) + circ(470, 146, 70, "url(#d" + u + ")") + circ(470, 146, 22, "#ffe9c4");
    o += rect(0, 146, 640, 134, "url(#b" + u + ")"); for (var i = 0; i < 9; i++) o += rect(330 + i * 22 - 90, 150 + i * 5, 150 - i * 6, 1.6, "#ffd9a8", ' opacity="' + f1(0.5 - i * 0.045) + '"');
    o += path("M0 150L60 140 130 148 210 138 300 150z", "#07101c", ' opacity=".85"') + path("M560 150L610 142 640 146V150z", "#07101c");
    o += poly([[VX - 3, VY], [VX + 3, VY], [820, 280], [-120, 280]], "url(#c" + u + ")") + poly([[VX - 3, VY], [VX - 6, VY], [-200, 280], [-120, 280]], "#33405a");
    for (var m = 0; m < 9; m++) { var t0 = 1 - Math.pow(0.76, m + 1.1), t1 = 1 - Math.pow(0.76, m + 1.5), p0 = toward(VX, 280, VX, VY, t0), p1 = toward(VX, 280, VX, VY, t1); o += line("M" + f1(p0[0]) + " " + f1(p0[1]) + "L" + f1(p1[0]) + " " + f1(p1[1]), "#d8dde8", f1(4.5 * (1 - t0)), ' opacity=".7"'); }
    o += line("M-60 280L" + VX + " " + VY, "#8fb4e0", 2.2, ' opacity=".6"') + line("M-60 262L" + VX + " " + VY, "#2a3650", 5, ' opacity=".9"');
    for (var l = 1; l <= 6; l++) { var tl = 1 - Math.pow(0.72, l), pl = toward(700, 280, VX, VY, tl), sc = 1 - tl; o += lamp(pl[0], pl[1], 130 * sc, "#ffc880", Math.max(0.35, sc * 1.4)); }
    function bike(cx, base, k, rider) {
      var s = ell(cx, base + 1, 30 * k, 4 * k, "#000", ' opacity=".6"') + ell(cx, base - 8 * k, 7 * k, 12 * k, "#06080d") + rect(cx - 5 * k, base - 22 * k, 10 * k, 12 * k, "#0c1018") + ell(cx, base - 14 * k, 14 * k, 5 * k, "#1b2740") + line("M" + (cx - 14 * k) + " " + (base - 22 * k) + "L" + (cx - 24 * k) + " " + (base - 30 * k) + "M" + (cx + 14 * k) + " " + (base - 22 * k) + "L" + (cx + 24 * k) + " " + (base - 30 * k), "#2a3650", 2.2 * k);
      s += tail(cx - 4 * k, base - 20 * k, 8 * k, "#ff3a3a") + ell(cx, base + 6 * k, 20 * k, 3.5 * k, "#6fa8ff", ' opacity=".35"');
      s += '<g transform="translate(' + f1(cx) + " " + f1(base - 24 * k) + ") scale(" + f1(k * 1.1) + ')"><path d="M-9 -28q9-6 18 0l4 20-8 6h-10l-8-6z" fill="#0a0d14"/><circle cx="0" cy="-34" r="7" fill="#101a2e"/><path d="M-6 -35h12" stroke="#6fa8ff" stroke-width="1.6" opacity=".8"/><path d="M-9 -22h18" stroke="#6f9cc0" stroke-width="1.6" opacity=".7"/></g>';
      return s + (rider ? emblem("blades", "#6f9cc0", cx - 6 * k, base - 50 * k, 0.12 * k, ".9") : "");
    }
    o += bike(300, 190, 0.7, 0) + bike(372, 188, 0.66, 0) + bike(336, 232, 1.05, 1) + bike(226, 258, 1.35, 1) + bike(470, 262, 1.3, 0);
    o += '<path d="M0 0h640v280H0z" fill="#0a1a33" opacity=".06"/>' + vignette(u, 0.5); return o;
  }
  /* ---- Convoi des Corbeaux : camion-conteneur sur la route des docks (violet) ---- */
  function cvCorbeaux(u) {
    var VX = 320, VY = 138, o = "<defs>" + lg("a" + u, [[0, "#140d26"], [0.7, "#3a2a5e"], [1, "#6a4a8a"]]) + lg("c" + u, [[0, "#2a2438"], [1, "#0c0a14"]]) + lg("k" + u, [[0, "#3a4a6a"], [1, "#222c44"]]) + rg("h" + u, [[0, "#d8c4ff", 0.6], [1, "#9b86b8", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")") + stars(11, 36, 90) + circ(110, 56, 22, "#e8dcff", ' opacity=".7"') + circ(110, 56, 58, "url(#h" + u + ")");
    o += line("M470 140V28L560 28M470 56L560 28M520 28V140M40 140V50L120 50M40 70L120 50", "#0a0814", 3.4, ' opacity=".9"') + circ(560, 30, 2.6, "#ff4a4a") + circ(560, 30, 10, "#ff4a4a", ' opacity=".25"');
    [[0, 1], [1, 1]].forEach(function (d) { var sg = d[0] ? 1 : -1; for (var i = 0; i < 6; i++) { var t = 1 - Math.pow(0.72, i + 1), t2 = 1 - Math.pow(0.72, i + 1.6), a = toward(sg > 0 ? 700 : -60, 200 + i * 0, VX, VY, t), b = toward(sg > 0 ? 700 : -60, 200, VX, VY, t2), h = 120 * (1 - t); var col = ["#7e3027", "#2c5878", "#6b5a2f", "#3d5a4a", "#5a3d6b", "#8a4a2a"][(i + d[0] * 2) % 6]; o += poly([[a[0], a[1] - h], [b[0], b[1] - h * 0.7], [b[0], b[1]], [a[0], a[1]]], col, ' opacity=".95"') + poly([[a[0], a[1] - h], [b[0], b[1] - h * 0.7], [b[0], b[1] - h * 0.7 + 4], [a[0], a[1] - h + 6]], "#fff", ' opacity=".12"'); } });
    o += poly([[VX - 3, VY], [VX + 3, VY], [820, 280], [-180, 280]], "url(#c" + u + ")");
    for (var m = 0; m < 9; m++) { var t0 = 1 - Math.pow(0.76, m + 1.1), t1 = 1 - Math.pow(0.76, m + 1.5), p0 = toward(VX, 280, VX, VY, t0), p1 = toward(VX, 280, VX, VY, t1); o += line("M" + f1(p0[0]) + " " + f1(p0[1]) + "L" + f1(p1[0]) + " " + f1(p1[1]), "#d8dde8", f1(4.5 * (1 - t0)), ' opacity=".55"'); }
    for (var l = 1; l <= 5; l++) { var tl = 1 - Math.pow(0.7, l), pl = toward(l % 2 ? 640 : 0, 270, VX, VY, tl), sc = 1 - tl; o += lamp(pl[0], pl[1], 120 * sc, "#c8a8ff", Math.max(0.35, sc * 1.5)); }
    /* escorte au loin */
    o += rect(288, 160, 44, 18, "#0b0d14") + rect(296, 152, 28, 10, "#10141e") + tail(290, 168, 8, "#ff3a3a") + tail(322, 168, 8, "#ff3a3a") + ell(310, 180, 30, 3, "#000", ' opacity=".5"');
    /* camion-conteneur vu de l'arrière */
    o += ell(320, 268, 128, 9, "#000", ' opacity=".7"') + rect(236, 96, 168, 140, "url(#k" + u + ")") + rect(236, 96, 168, 6, "#8a96b8", ' opacity=".5"');
    for (var r = 0; r < 14; r++) o += rect(244 + r * 11.4, 104, 2, 124, "#000", ' opacity=".22"');
    o += rect(318, 104, 4, 124, "#0a0c12") + rect(236, 148, 168, 3, "#0a0c12", ' opacity=".6"') + rect(236, 196, 168, 3, "#0a0c12", ' opacity=".6"') + emblem("raven", "#c0a8e8", 252, 104, 0.52, ".95") + emblem("raven", "#c0a8e8", 322, 104, 0.52, ".95");
    o += rect(242, 232, 156, 10, "#14161e") + rect(250, 238, 24, 4, "#d8dce6") + rect(366, 238, 24, 4, "#d8dce6") + tail(240, 222, 14, "#ff3030") + tail(386, 222, 14, "#ff3030") + ell(320, 252, 110, 10, "#ff3a3a", ' opacity=".14"');
    o += ell(262, 252, 26, 14, "#07080c") + ell(378, 252, 26, 14, "#07080c") + rect(236, 242, 168, 5, "#101218") + rect(296, 126, 48, 4, "#a8b0c8", ' opacity=".18"');
    [[40, 126], [596, 118]].forEach(function (q, i) { o += path("M" + q[0] + " " + q[1] + "q6-8 14-6 5 2 8 8-4-2-8-1-6 1-14-1z", "#05040a") + (i ? "" : path("M" + (q[0] + 40) + " " + (q[1] - 14) + "q6-8 14-6 5 2 8 8-4-2-8-1-6 1-14-1z", "#05040a")); });
    o += rect(0, 0, 640, 280, "#3a2a5e", ' opacity=".07"') + vignette(u, 0.5); return o;
  }
  /* ---- Convoi du Consortium Meridian : fourgons blancs dans un tunnel de verre (turquoise) ---- */
  function cvMeridian(u) {
    var VX = 320, VY = 124, o = "<defs>" + lg("a" + u, [[0, "#06161a"], [1, "#0e3a40"]]) + rg("g" + u, [[0, "#e8fffa", 1], [0.4, "#7fe6d4", 0.6], [1, "#2aa89a", 0]]) + lg("f" + u, [[0, "#1c3036"], [1, "#05090c"]]) + lg("v" + u, [[0, "#f4fbfa"], [1, "#9ab8b4"]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")");
    for (var i = 0; i < 9; i++) { var t = 1 - Math.pow(0.78, i + 0.5), x0 = lerp(-20, VX - 40, t), x1 = lerp(660, VX + 40, t), y0 = lerp(-10, VY - 30, t), y1 = lerp(290, VY + 20, t); o += rect(x0, y0, x1 - x0, y1 - y0, "none", ' stroke="#2aa89a" stroke-width="' + f1(5 * (1 - t) + 0.6) + '" opacity="' + f1(0.8 - i * 0.07) + '"') + (i % 2 ? "" : rect(x0, y0, x1 - x0, y1 - y0, "none", ' stroke="#7fe6d4" stroke-width="1" opacity=".5"')); }
    o += circ(VX, VY, 56, "url(#g" + u + ")") + circ(VX, VY, 18, "#f4fffd");
    o += poly([[VX - 22, VY + 18], [VX + 22, VY + 18], [760, 280], [-120, 280]], "url(#f" + u + ")") + line("M-60 280L" + (VX - 12) + " " + (VY + 18) + "M700 280L" + (VX + 12) + " " + (VY + 18), "#7fe6d4", 2.4, ' opacity=".6"');
    for (var m = 0; m < 8; m++) { var t0 = 1 - Math.pow(0.76, m + 1.1), t1 = 1 - Math.pow(0.76, m + 1.5), p0 = toward(VX, 280, VX, VY + 18, t0), p1 = toward(VX, 280, VX, VY + 18, t1); o += line("M" + f1(p0[0]) + " " + f1(p0[1]) + "L" + f1(p1[0]) + " " + f1(p1[1]), "#c8f0ea", f1(4 * (1 - t0)), ' opacity=".55"'); }
    o += ell(320, 262, 150, 14, "#7fe6d4", ' opacity=".12"');
    function van(cx, base, k, lead) {
      var w = 150 * k, h = 96 * k, x = cx - w / 2, y = base - h, s = ell(cx, base + 3 * k, w * 0.6, 8 * k, "#000", ' opacity=".6"') + path("M" + f1(x) + " " + f1(base - 10 * k) + "V" + f1(y + h * 0.25) + "Q" + f1(x) + " " + f1(y) + " " + f1(x + w * 0.16) + " " + f1(y) + "H" + f1(x + w * 0.84) + "Q" + f1(x + w) + " " + f1(y) + " " + f1(x + w) + " " + f1(y + h * 0.25) + "V" + f1(base - 10 * k) + "z", "url(#v" + u + ")");
      s += rect(x + w * 0.1, y + h * 0.14, w * 0.8, h * 0.22, "#0c2a30") + rect(x + w * 0.1, y + h * 0.14, w * 0.8, h * 0.05, "#7fe6d4", ' opacity=".4"') + rect(x + w * 0.495, y + h * 0.4, w * 0.01, h * 0.5, "#4a6a66", ' opacity=".6"');
      s += emblem("hex", "#1f8a7e", x + w * 0.5 - 14 * k, y + h * 0.43, 0.3 * k) + rect(x + w * 0.04, base - 14 * k, w * 0.92, 8 * k, "#1a2a2c") + tail(x + w * 0.04, y + h * 0.7, 9 * k, "#ff3a3a") + tail(x + w * 0.96 - 9 * k, y + h * 0.7, 9 * k, "#ff3a3a") + rect(cx - 14 * k, base - 12 * k, 28 * k, 5 * k, "#f4f4ee");
      return s + ell(x + w * 0.2, base - 2 * k, 15 * k, 8 * k, "#07090c") + ell(x + w * 0.8, base - 2 * k, 15 * k, 8 * k, "#07090c") + rect(cx - 10 * k, y - 4 * k, 20 * k, 3 * k, lead ? "#4aa0ff" : "#7fe6d4", ' opacity=".9"');
    }
    o += van(320, 182, 0.55, 0) + van(320, 262, 1.28, 1);
    o += rect(0, 0, 640, 280, "#0e3a40", ' opacity=".06"') + vignette(u, 0.45); return o;
  }
  /* ---- Convoi de la Maison Valcourt : trois limousines dans l'avenue de la vieille ville (ocre et rouge) ---- */
  function cvValcourt(u) {
    var o = "<defs>" + lg("a" + u, [[0, "#2a1210"], [0.6, "#6a3322"], [1, "#e0905a"]]) + lg("g" + u, [[0, "#3a2a22"], [1, "#120c0a"]]) + lg("b" + u, [[0, "#1a1418"], [0.5, "#4a4048"], [1, "#0e0c10"]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")") + circ(100, 70, 40, "#ffd9a8", ' opacity=".3"') + circ(100, 70, 16, "#fff0d0", ' opacity=".8"');
    var r = rnd(5); for (var i = 0; i < 9; i++) { var x = i * 74 - 20, h = 110 + r() * 60, w = 70; o += rect(x, 200 - h, w, h, ["#4a2a22", "#5a3a2a", "#3a2430", "#6a4a30"][i % 4]) + rect(x, 200 - h, w, 5, "#2a1410") + path("M" + x + " " + (200 - h) + "h" + w + "l-" + w / 2 + " -18z", "#3a1c16"); for (var k = 0; k < 6; k++) if (r() > 0.3) { var wx = x + 8 + (k % 3) * 20, wy = 200 - h + 18 + Math.floor(k / 3) * 34; o += path("M" + wx + " " + (wy + 22) + "v-14q8-10 16 0v14z", "#ffcf80", ' opacity=".8"') + line("M" + (wx + 8) + " " + (wy - 2) + "v24", "#6a3a14", 1); } }
    o += rect(0, 200, 640, 80, "url(#g" + u + ")"); for (var c = 0; c < 40; c++) o += rect((c * 53) % 640, 206 + ((c * 37) % 70), 16, 3, "#000", ' opacity=".18"');
    o += rect(0, 198, 640, 6, "#8a5a3a", ' opacity=".7"') + rect(0, 204, 640, 2, "#000", ' opacity=".5"');
    [60, 220, 380, 540].forEach(function (x, i) { o += lamp(x, 204, 100 - (i % 2) * 8, "#ffc070", 1.1) + rect(x - 5, 200, 10, 5, "#0a0d14"); });
    function limo(cx, base, k, lit) {
      var w = 300 * k, h = 62 * k, x = cx - w / 2, y = base - h, s = ell(cx, base + 3 * k, w * 0.55, 6 * k, "#000", ' opacity=".6"') + path("M" + f1(x) + " " + f1(base - 8 * k) + "V" + f1(y + h * 0.5) + "L" + f1(x + w * 0.06) + " " + f1(y + h * 0.38) + "H" + f1(x + w * 0.26) + "L" + f1(x + w * 0.34) + " " + f1(y) + "H" + f1(x + w * 0.76) + "L" + f1(x + w * 0.84) + " " + f1(y + h * 0.38) + "H" + f1(x + w * 0.96) + "L" + f1(x + w) + " " + f1(y + h * 0.6) + "V" + f1(base - 8 * k) + "z", "url(#b" + u + ")");
      s += path("M" + f1(x + w * 0.35) + " " + f1(y + h * 0.1) + "H" + f1(x + w * 0.75) + "L" + f1(x + w * 0.82) + " " + f1(y + h * 0.36) + "H" + f1(x + w * 0.3) + "z", "#0a0c14") + rect(x + w * 0.3, y + h * 0.36, w * 0.52, 1.4 * k, "#d0a860", ' opacity=".8"') + rect(x + w * 0.04, y + h * 0.56, w * 0.92, 1.8 * k, "#d0a860", ' opacity=".5"');
      s += ell(x + w * 0.22, base - 2 * k, 14 * k, 14 * k, "#07080c") + ell(x + w * 0.78, base - 2 * k, 14 * k, 14 * k, "#07080c") + circ(x + w * 0.22, base - 2 * k, 6 * k, "#8a8f9a") + circ(x + w * 0.78, base - 2 * k, 6 * k, "#8a8f9a");
      s += rect(x + w * 0.985, y + h * 0.62, 6 * k, 5 * k, "#fff3c8") + circ(x + w + 6 * k, y + h * 0.65, 14 * k, "#ffe9a8", ' opacity=".3"') + rect(x - 4 * k, y + h * 0.62, 5 * k, 5 * k, "#ff3a3a") + (lit ? emblem("crown", "#e0b050", x + w * 0.5 - 8 * k, y - 10 * k, 0.16 * k) : "");
      return s;
    }
    o += limo(430, 214, 0.42) + limo(330, 236, 0.62) + limo(190, 268, 0.92, 1);
    o += rect(0, 0, 640, 280, "#e0905a", ' opacity=".05"') + vignette(u, 0.5); return o;
  }

  /* ---- Raid sur le squat des Lames : immeuble délabré, grande fresque bleue, barrière (bleu) ---- */
  function rdLames(u) {
    var o = "<defs>" + lg("a" + u, [[0, "#0a1428"], [1, "#1c3050"]]) + lg("w" + u, [[0, "#3a3f48"], [1, "#1c2028"]]) + rg("f" + u, [[0, "#ffb060", 0.9], [1, "#ff7a20", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")") + stars(3, 24, 60);
    o += rect(120, 20, 400, 200, "url(#w" + u + ")") + rect(116, 14, 408, 10, "#14181e") + path("M110 20h420l-20-14H130z", "#101318");
    var r = rnd(9); for (var rr = 0; rr < 5; rr++) for (var c = 0; c < 9; c++) { var x = 134 + c * 42, y = 36 + rr * 36, st = r(); o += st < 0.25 ? rect(x, y, 24, 22, "#ffcf80", ' opacity=".8"') + rect(x, y, 24, 22, "none", ' stroke="#1a1208" stroke-width="2"') : st < 0.6 ? rect(x, y, 24, 22, "#07090e") + line("M" + x + " " + (y + 5) + "h24M" + x + " " + (y + 14) + "h24", "#6a5a40", 2.4) : rect(x, y, 24, 22, "#0a1018"); }
    o += poly([[150, 170], [330, 120], [500, 160], [500, 214], [150, 214]], "#0f2036", ' opacity=".92"') + emblem("blades", "#6f9cc0", 250, 118, 1.05, ".95") + emblem("blades", "#a8d0f0", 252, 120, 1.05, ".25");
    o += line("M130 200l30-20 40 22 50-24 60 26 70-22 60 20 70-24", "#6f9cc0", 2.4, ' opacity=".5"');
    o += rect(0, 214, 640, 66, "#0a0d14") + rect(0, 214, 640, 3, "#2a3446") + ell(320, 262, 300, 14, "#6f9cc0", ' opacity=".08"');
    for (var k = 0; k < 28; k++) o += line("M" + (60 + k * 18) + " 226V268", "#5a6678", 1.1, ' opacity=".6"'); o += line("M60 232H570M60 262H570", "#5a6678", 1.6, ' opacity=".8"') + rect(300, 226, 44, 42, "#05070c", ' opacity=".9"');
    o += circ(576, 240, 26, "url(#f" + u + ")") + rect(566, 238, 20, 28, "#1a1410") + path("M570 238q6-14 12 0q-6-4-12 0z", "#ff9a40") + circ(576, 236, 4, "#ffe08a");
    o += lamp(80, 246, 120, "#8fc0ff", 1.2) + lamp(600, 246, 110, "#8fc0ff", 1);
    o += person(262, 262, 1.05) + person(286, 264, 1.12) + person(360, 262, 1.0) + '<path d="M276 244l12-8" stroke="#000" stroke-width="2" opacity=".6"/>' + ell(300, 270, 96, 6, "#000", ' opacity=".5"');
    o += rect(0, 0, 640, 280, "#6f9cc0", ' opacity=".05"') + vignette(u, 0.45); return o;
  }
  /* ---- Raid sur les docks des Corbeaux : grand hangar, grues, eau noire (violet) ---- */
  function rdCorbeaux(u) {
    var o = "<defs>" + lg("a" + u, [[0, "#120c20"], [1, "#2c2046"]]) + lg("w" + u, [[0, "#242034"], [1, "#0e0c18"]]) + lg("s" + u, [[0, "#1c1632"], [1, "#05040a"]]) + rg("l" + u, [[0, "#d8c4ff", 0.85], [1, "#9b86b8", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")") + stars(5, 26, 70) + circ(560, 50, 18, "#e8dcff", ' opacity=".7"') + circ(560, 50, 50, "url(#l" + u + ")", ' opacity=".5"');
    o += line("M30 190V30L140 30M30 58L140 30M110 30V190M470 190V50L600 50M470 76L600 50M560 50V190", "#07060e", 4, ' opacity=".95"') + line("M140 30V70M600 50V90", "#07060e", 1.4);
    o += rect(90, 90, 460, 110, "url(#w" + u + ")") + path("M80 92L320 56 560 92z", "#0b0914") + rect(90, 92, 460, 5, "#3a3058");
    for (var i = 0; i < 38; i++) o += rect(96 + i * 12, 100, 1.6, 98, "#000", ' opacity=".28"');
    o += rect(250, 120, 140, 80, "#05040a") + rect(250, 120, 140, 80, "none", ' stroke="#6a5a90" stroke-width="2.4"') + rect(250, 120, 70, 80, "#0c0a16") + rect(320, 120, 70, 80, "#0c0a16", ' opacity=".6"') + rect(310, 120, 20, 80, "#c8b4ff", ' opacity=".18"') + emblem("raven", "#c0a8e8", 288, 90, 0.64, ".95");
    o += circ(130, 112, 3, "#ff4a4a") + circ(130, 112, 12, "#ff4a4a", ' opacity=".25"') + circ(510, 112, 3, "#ffd27a") + circ(510, 112, 12, "#ffd27a", ' opacity=".25"');
    [[40, 0.7, "#7e3027"], [100, 0.55, "#2c5878"], [520, 0.8, "#2c6a52"], [580, 0.6, "#8a6a28"]].forEach(function (q) { o += rect(q[0], 200 - 56 * q[1], 44 * q[1] + 18, 56 * q[1], q[2]) + rect(q[0], 200 - 56 * q[1], 44 * q[1] + 18, 3, "#fff", ' opacity=".15"'); });
    o += rect(0, 200, 640, 80, "url(#s" + u + ")"); for (var w = 0; w < 14; w++) o += line("M" + (w * 50 - 40) + " " + (222 + (w % 3) * 16) + "q30-5 60 0", "#9b86b8", 1.2, ' opacity=".2"');
    o += line("M0 200H640", "#6a5a90", 2.2, ' opacity=".6"') + ell(320, 206, 160, 8, "#d8c4ff", ' opacity=".12"');
    o += path("M360 246l40-6 16 6-12 8h-40z", "#0a0814") + rect(384, 232, 14, 12, "#12101c") + line("M391 232V218", "#0a0814", 1.6) + circ(391, 217, 2, "#ffd27a");
    o += person(214, 214, 0.75) + person(232, 216, 0.8) + person(402, 214, 0.76) + ell(310, 218, 130, 4, "#000", ' opacity=".4"');
    o += rect(0, 150, 640, 50, "#9b86b8", ' opacity=".05"') + rect(0, 0, 640, 280, "#3a2a5e", ' opacity=".05"') + vignette(u, 0.45); return o;
  }
  /* ---- Raid sur la tour Meridian : tour de verre, plaza, enseigne hexagonale (turquoise) ---- */
  function rdMeridian(u) {
    var o = "<defs>" + lg("a" + u, [[0, "#04121a"], [1, "#0e3640"]]) + lg("t" + u, [[0, "#0e2a34"], [1, "#061018"]]) + lg("p" + u, [[0, "#122a30"], [1, "#04080c"]]) + rg("h" + u, [[0, "#9ff5e6", 0.8], [1, "#2aa89a", 0]]) + "</defs>";
    o += rect(0, 0, 640, 280, "url(#a" + u + ")") + stars(13, 28, 70);
    var r = rnd(2); for (var i = 0; i < 14; i++) { var x = i * 48 - 8, h = 60 + r() * 80; o += rect(x, 210 - h, 40, h, "#07131a", ' opacity=".9"'); for (var k = 0; k < 12; k++) if (r() > 0.6) o += rect(x + 4 + (k % 4) * 9, 210 - h + 8 + Math.floor(k / 4) * 14, 5, 6, "#7fe6d4", ' opacity=".5"'); }
    o += poly([[240, 214], [250, 14], [390, 14], [400, 214]], "url(#t" + u + ")") + poly([[250, 14], [390, 14], [386, 24], [254, 24]], "#2aa89a", ' opacity=".6"');
    for (var rw = 0; rw < 14; rw++) for (var c = 0; c < 9; c++) { var lit = r() > 0.55; o += rect(258 + c * 14.4, 34 + rw * 12.6, 9.6, 8, lit ? "#9ff5e6" : "#0a1c24", lit ? ' opacity="' + f1(0.35 + r() * 0.5) + '"' : ""); }
    o += line("M250 14L240 214M390 14L400 214M320 14V214", "#2aa89a", 1.4, ' opacity=".5"') + circ(320, 28, 46, "url(#h" + u + ")", ' opacity=".6"') + emblem("hex", "#9ff5e6", 296, 6, 0.48);
    o += rect(200, 196, 240, 20, "#0a1c24") + rect(200, 196, 240, 3, "#7fe6d4", ' opacity=".7"') + rect(298, 200, 44, 14, "#02060a") + rect(298, 200, 44, 14, "#7fe6d4", ' opacity=".18"');
    o += rect(0, 214, 640, 66, "url(#p" + u + ")"); for (var s = 0; s < 6; s++) o += rect(150 + s * 4, 214 + s * 4, 340 - s * 8, 4, "#1c3a42", ' opacity="' + f1(0.9 - s * 0.1) + '"');
    for (var g = 0; g < 9; g++) o += line("M" + (g * 80 - 20) + " 280L" + (320 + (g - 4) * 18) + " 218", "#7fe6d4", 1, ' opacity=".12"');
    o += ell(320, 262, 200, 10, "#7fe6d4", ' opacity=".1"');
    [[180, 232], [470, 232]].forEach(function (q) { o += rect(q[0], q[1] - 28, 3, 28, "#0a1218") + rect(q[0] - 6, q[1] - 34, 15, 8, "#0a1218") + circ(q[0] + 8, q[1] - 30, 2, "#ff4a4a") + path("M" + (q[0] + 8) + " " + (q[1] - 28) + "L" + (q[0] + 50) + " " + (q[1] + 6) + "L" + (q[0] - 20) + " " + (q[1] + 6) + "z", "#ff4a4a", ' opacity=".06"'); });
    o += person(288, 258, 1.0) + person(312, 260, 1.08) + person(346, 258, 0.98) + ell(318, 268, 90, 5, "#000", ' opacity=".5"');
    o += lamp(110, 252, 100, "#7fe6d4", 1) + lamp(540, 252, 100, "#7fe6d4", 1);
    o += rect(0, 0, 640, 280, "#2aa89a", ' opacity=".04"') + vignette(u, 0.45); return o;
  }
  A.register("scene_cv_lames", cvLames, "Quatre motards en formation sur une route côtière au crépuscule, aux couleurs bleues des Lames du Nord");
  A.register("scene_cv_corbeaux", cvCorbeaux, "Camion-conteneur frappé d’un corbeau et sa voiture d’escorte sur la route des docks, de nuit");
  A.register("scene_cv_meridian", cvMeridian, "Deux fourgons blancs du Consortium Meridian dans un tunnel de lumières turquoise");
  A.register("scene_cv_valcourt", cvValcourt, "Trois limousines de la Maison Valcourt dans une avenue de vieille ville éclairée au gaz");
  A.register("scene_rd_lames", rdLames, "Immeuble squatté des Lames du Nord, grande fresque bleue, barrière et silhouettes devant le portail");
  A.register("scene_rd_corbeaux", rdCorbeaux, "Hangar des docks des Corbeaux, grues, conteneurs et eau noire sous des projecteurs violets");
  A.register("scene_rd_meridian", rdMeridian, "Tour de verre du Consortium Meridian la nuit, enseigne hexagonale et plaza éclairée");
})(typeof window !== "undefined" ? window : globalThis);
