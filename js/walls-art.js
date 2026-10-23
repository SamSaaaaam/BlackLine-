/* Décors de ville : les 8 scènes, dessinées en SVG par du code (aucune image externe). Statiques : aucune animation, aucun filtre coûteux. 1600 × 900, cadrage « slice ».
   BL.wallsArt = { svg(id) → texte SVG, url(id) → adresse (Blob ou data:) à mettre dans <img> / background-image, size(id) → octets } */
(function (root) {
  var BL = root.BL = root.BL || {}, cache = {}, urls = {};
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function n1(x) { return Math.round(x * 10) / 10; }
  function R(x, y, w, h, f, ex) { return '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function C(x, y, r, f, ex) { return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(r) + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function P(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function L(d, s, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + s + '" stroke-width="' + w + '" stroke-linecap="round"' + (ex || "") + "/>"; }
  function G(id, stops, x2, y2) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 === undefined ? 1 : y2) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</linearGradient>"; }
  function RG(id, stops) { return '<radialGradient id="' + id + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</radialGradient>"; }
  /* rangée de tours : corps (un seul chemin), fenêtres (un chemin par couleur), antennes ; renvoie le texte SVG */
  function skyline(o) {
    var r = rnd(o.seed), x = o.x0, body = "", w1 = "", w2 = "", ant = "", roof = "";
    while (x < o.x1) {
      var w = o.minW + r() * (o.maxW - o.minW), h = o.minH + r() * (o.maxH - o.minH), y = o.base - h; w = Math.round(w); h = Math.round(h); y = o.base - h;
      body += "M" + n1(x) + " " + o.base + "V" + y + (o.roof === "step" && r() > 0.5 ? "h" + n1(w * 0.2) + "v-" + Math.round(h * 0.06) + "h" + n1(w * 0.6) + "v" + Math.round(h * 0.06) + "h" + n1(w * 0.2) : "h" + w) + "V" + o.base + "z";
      if (o.win) { var cw = o.win[0], ch = o.win[1], gx = o.win[2], gy = o.win[3], cols = Math.max(1, Math.floor((w - 8) / gx)), rows = Math.max(1, Math.floor((h - 14) / gy)); for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) { var q = r(); if (q < o.lit) w1 += "M" + n1(x + 5 + i * gx) + " " + n1(y + 8 + j * gy) + "h" + cw + "v" + ch + "h-" + cw + "z"; else if (o.lit2 && q < o.lit + o.lit2) w2 += "M" + n1(x + 5 + i * gx) + " " + n1(y + 8 + j * gy) + "h" + cw + "v" + ch + "h-" + cw + "z"; } }
      if (o.ant && r() < o.ant) ant += "M" + n1(x + w / 2) + " " + y + "v-" + Math.round(14 + r() * 40);
      x += w * (o.gap === undefined ? 0.95 : o.gap) + r() * (o.jit || 6);
    }
    return P(body, o.fill) + (w1 ? P(w1, o.win[4]) : "") + (w2 ? P(w2, o.win[5] || o.win[4], ' opacity=".7"') : "") + (ant ? L(ant, o.edge || o.fill, 2) : "");
  }
  function stars(seed, n, y1, col) { var r = rnd(seed), d = ""; for (var i = 0; i < n; i++) d += "M" + Math.round(r() * 1600) + " " + Math.round(r() * y1) + "h" + (r() < 0.2 ? 2 : 1.2) + "v1.2h-" + (r() < 0.2 ? 2 : 1.2) + "z"; return P(d, col || "#dfe8ff", ' opacity=".8"'); }
  function rain(seed, n, col) { var r = rnd(seed), d = ""; for (var i = 0; i < n; i++) { var x = Math.round(r() * 1700), y = Math.round(r() * 900), l = 14 + Math.round(r() * 22); d += "M" + x + " " + y + "l-" + Math.round(l * 0.25) + " " + l; } return L(d, col, 1.2, ' opacity=".35"'); }
  function wrap(inner, defs) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>' + defs + "</defs>" + inner + "</svg>"; }
  function glowDot(x, y, r, col, op) { return C(x, y, r, col, ' opacity="' + (op || 0.5) + '"'); }
  function neonSign(x, y, w, h, col) { return R(x - 6, y - 6, w + 12, h + 12, col, ' opacity=".18" rx="8"') + R(x, y, w, h, "#0a0710", ' rx="4" stroke="' + col + '" stroke-width="3"') + R(x + 8, y + h / 2 - 2, w - 16, 4, col, ' rx="2"'); }

  var SCENES = {
    pluie: function () {
      var d = G("a", [[0, "#050a18"], [0.55, "#0e1c3a"], [1, "#1b3358"]]) + G("b", [[0, "#17294a", 0], [1, "#17294a", 0.9]]) + G("w", [[0, "#2c5ea0", 0.5], [1, "#050a18", 0.95]]) + RG("h", [[0, "#6fb6ff", 0.55], [1, "#6fb6ff", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + glowDot(1180, 210, 260, "url(#h)", 0.5);
      s += skyline({ seed: 11, x0: -20, x1: 1620, base: 640, minH: 160, maxH: 330, minW: 60, maxW: 120, fill: "#0f1d3a", win: [6, 8, 14, 20, "#5c86c4"], lit: 0.12, ant: 0.4, edge: "#0f1d3a", gap: 0.9 });
      s += R(0, 560, 1600, 120, "url(#b)");
      s += skyline({ seed: 23, x0: -30, x1: 1630, base: 700, minH: 220, maxH: 520, minW: 90, maxW: 170, fill: "#08101f", win: [7, 10, 17, 25, "#f0c978", "#8fd2ff"], lit: 0.22, lit2: 0.1, ant: 0.5, edge: "#08101f", roof: "step", gap: 0.96 });
      s += R(0, 700, 1600, 200, "#05090f") + R(0, 700, 1600, 5, "#3a69a8", ' opacity=".4"');
      s += R(0, 705, 1600, 195, "url(#w)", ' opacity=".8"');
      var r = rnd(5), refl = ""; for (var i = 0; i < 36; i++) { var x = r() * 1600, c = ["#f0c978", "#ff5fa8", "#59d6ff"][i % 3]; refl += R(x, 712 + r() * 150, 3 + r() * 5, 30 + r() * 80, c, ' opacity=".35"'); } s += refl;
      s += neonSign(180, 420, 140, 46, "#ff4f9a") + neonSign(1320, 380, 130, 40, "#4fd9ff") + R(0, 840, 1600, 60, "#05090f", ' opacity=".6"');
      s += rain(7, 260, "#bcd8ff"); return wrap(s, d);
    },
    brume: function () {
      var d = G("a", [[0, "#2a2620"], [0.6, "#6b5f4a"], [1, "#a59377"]]) + G("f", [[0, "#cdbf9f", 0], [0.5, "#cdbf9f", 0.55], [1, "#cdbf9f", 0]]) + RG("l", [[0, "#ffd98a", 0.9], [1, "#ffd98a", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + glowDot(520, 190, 220, "#f6e2b0", 0.22);
      var r = rnd(31), far = "", x = -20; while (x < 1620) { var w = 70 + r() * 80, h = 130 + r() * 160, y = 640 - h; far += "M" + n1(x) + " 640V" + y + "l" + n1(w / 2) + " -" + n1(30 + r() * 30) + "l" + n1(w / 2) + " " + n1(30 + r() * 30) + "V640z"; x += w + r() * 8; } s += P(far, "#4a4033", ' opacity=".7"');
      s += R(0, 380, 1600, 160, "url(#f)");
      var near = "", win = "", chim = ""; x = -30; r = rnd(37); while (x < 1640) { var w2 = 110 + r() * 110, h2 = 200 + r() * 220, y2 = 760 - h2; near += "M" + n1(x) + " 760V" + y2 + "L" + n1(x + w2 / 2) + " " + n1(y2 - 55 - r() * 25) + "L" + n1(x + w2) + " " + y2 + "V760z"; for (var j = 0; j < 4; j++) for (var i = 0; i < Math.floor(w2 / 32); i++) if (r() < 0.3) win += "M" + n1(x + 12 + i * 30) + " " + n1(y2 + 20 + j * 46) + "h12v20h-12z"; chim += "M" + n1(x + w2 * 0.72) + " " + n1(y2 - 20) + "v-" + Math.round(30 + r() * 24) + "h12v" + Math.round(34 + r() * 20) + "z"; x += w2 + r() * 6; }
      s += P(near, "#1f1a15") + P(chim, "#1f1a15") + P(win, "#ffd27a", ' opacity=".8"');
      s += R(0, 760, 1600, 140, "#14110d") + R(0, 760, 1600, 4, "#6b5a3e", ' opacity=".5"');
      for (var k = 0; k < 6; k++) { var lx = 140 + k * 280; s += R(lx - 2, 600, 4, 170, "#0d0b08") + glowDot(lx, 600, 70, "url(#l)", 0.6) + C(lx, 600, 7, "#ffe7a8"); }
      s += R(0, 520, 1600, 190, "url(#f)", ' opacity=".7"') + R(0, 700, 1600, 140, "url(#f)", ' opacity=".5"'); return wrap(s, d);
    },
    port: function () {
      var d = G("a", [[0, "#2b1650"], [0.45, "#b2486a"], [0.72, "#ff9a5c"], [1, "#ffd08a"]]) + G("w", [[0, "#ff9a5c", 0.7], [0.4, "#6a2a58", 0.8], [1, "#1a0f2e"]]) + RG("s", [[0, "#fff1c8", 1], [0.35, "#ffc27a", 0.6], [1, "#ff9a5c", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + glowDot(1000, 560, 330, "url(#s)", 0.9) + C(1000, 560, 64, "#fff3d2");
      s += stars(3, 40, 220, "#ffe9ff");
      s += R(0, 580, 1600, 320, "url(#w)");
      var r = rnd(9), rf = ""; for (var i = 0; i < 22; i++) rf += R(1000 - 90 + r() * 180 - i * 4, 600 + i * 12, 40 + r() * 120, 3, "#ffe3a8", ' opacity="' + n1(0.5 - i * 0.02) + '"'); s += rf;
      s += P("M0 600V560h40V470h12V560h30V540h60V500h40V560h120V470h14V560h60V590z", "#150b24", ' opacity=".9"');
      function crane(x, h, sc) { return P("M" + x + " 620V" + (620 - h) + "h" + 14 * sc + "V620z", "#120a1f") + P("M" + (x - 160 * sc) + " " + (620 - h) + "h" + 400 * sc + "v" + 14 * sc + "h-" + 400 * sc + "z", "#120a1f") + L("M" + (x + 7 * sc) + " " + (620 - h) + "L" + (x - 150 * sc) + " " + (620 - h + 14 * sc) + "M" + (x + 7 * sc) + " " + (620 - h) + "L" + (x + 230 * sc) + " " + (620 - h + 14 * sc), "#120a1f", 3) + R(x + 120 * sc, 620 - h + 14 * sc, 6 * sc, 60 * sc, "#120a1f"); }
      s += crane(1130, 300, 1) + crane(1380, 260, 0.9) + crane(300, 220, 0.8);
      var cont = "", cc = ["#7a2a3a", "#2a4a6a", "#8a6a2a", "#3a5a4a"]; r = rnd(13); for (var j = 0; j < 4; j++) for (var k = 0; k < 7 - j; k++) cont += R(60 + k * 66 + j * 20, 586 - j * 28, 62, 26, cc[Math.floor(r() * 4)], ' stroke="#0d0618" stroke-width="2"'); s += cont;
      s += P("M600 600h300l-30 60H640z", "#0f0818") + R(660, 560, 150, 40, "#0f0818") + R(700, 530, 60, 30, "#0f0818") + R(716, 510, 8, 22, "#0f0818") + C(740, 620, 3, "#ffd27a") + C(800, 620, 3, "#ffd27a");
      s += R(0, 880, 1600, 20, "#0b0614"); return wrap(s, d);
    },
    neon: function () {
      var d = G("a", [[0, "#07030f"], [0.6, "#190a2e"], [1, "#2e0f4a"]]) + G("w", [[0, "#ff2fa0", 0.35], [1, "#07030f", 0.95]]) + RG("h", [[0, "#ff2fa0", 0.5], [1, "#ff2fa0", 0]]) + RG("c", [[0, "#2fd8ff", 0.45], [1, "#2fd8ff", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + glowDot(320, 360, 420, "url(#h)", 0.8) + glowDot(1260, 300, 420, "url(#c)", 0.8);
      s += skyline({ seed: 41, x0: -20, x1: 1620, base: 700, minH: 200, maxH: 440, minW: 70, maxW: 140, fill: "#0b0618", win: [6, 8, 14, 20, "#ff58b8", "#58e0ff"], lit: 0.2, lit2: 0.15, ant: 0.5, edge: "#0b0618", gap: 0.94 });
      var r = rnd(43), nn = ""; var cols = ["#ff3fa8", "#3fe0ff", "#ffb13f", "#a96bff"]; for (var i = 0; i < 9; i++) { var x = 90 + i * 175 + r() * 30, y = 220 + r() * 220, h = 90 + r() * 150, c = cols[i % 4]; nn += R(x - 6, y - 4, 22, h + 8, c, ' opacity=".2" rx="10"') + R(x, y, 10, h, c, ' rx="5"') + R(x - 14, y + 12, 38, 6, c, ' rx="3" opacity=".9"') + R(x - 14, y + h / 2, 38, 6, c, ' rx="3" opacity=".9"'); } s += nn;
      s += skyline({ seed: 47, x0: -30, x1: 1630, base: 730, minH: 90, maxH: 190, minW: 110, maxW: 220, fill: "#05020b", win: [10, 12, 22, 28, "#ffb13f", "#ff58b8"], lit: 0.25, lit2: 0.1, gap: 0.97 });
      s += R(0, 730, 1600, 170, "#05020b") + R(0, 730, 1600, 170, "url(#w)", ' opacity=".9"');
      r = rnd(49); for (var k = 0; k < 40; k++) s += R(r() * 1600, 742 + r() * 130, 3 + r() * 4, 20 + r() * 90, cols[k % 4], ' opacity=".4"');
      s += neonSign(660, 520, 200, 56, "#ff3fa8") + P("M1200 470l30 -18 30 18v36l-30 18-30-18z", "none", ' stroke="#3fe0ff" stroke-width="5"') + rain(17, 110, "#d8b8ff"); return wrap(s, d);
    },
    lune: function () {
      var d = G("a", [[0, "#04081a"], [0.6, "#101c40"], [1, "#223a6a"]]) + RG("m", [[0, "#ffffff", 1], [0.12, "#f4f1e4", 1], [0.3, "#cfd8ff", 0.35], [1, "#9fb4ff", 0]]) + G("g", [[0, "#050810", 0.2], [1, "#050810", 0.95]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + stars(21, 160, 520, "#ffffff") + glowDot(1130, 230, 360, "url(#m)", 0.9) + C(1130, 230, 96, "#f6f2e2") + C(1105, 208, 18, "#e0dac4", ' opacity=".7"') + C(1160, 262, 26, "#e0dac4", ' opacity=".6"') + C(1146, 196, 10, "#e0dac4", ' opacity=".6"');
      s += skyline({ seed: 51, x0: -20, x1: 1620, base: 620, minH: 100, maxH: 220, minW: 90, maxW: 170, fill: "#0e1730", win: [7, 9, 18, 24, "#ffd27a"], lit: 0.14, gap: 0.98 });
      var r = rnd(53), roofs = "", x = -40, tanks = ""; while (x < 1640) { var w = 120 + r() * 140, y = 700 - r() * 110; roofs += "M" + n1(x) + " 900V" + n1(y) + "h" + n1(w) + "V900z"; if (r() < 0.45) tanks += R(x + w * 0.3, y - 56, 46, 40, "#060a16", ' rx="3"') + P("M" + n1(x + w * 0.3 - 4) + " " + n1(y - 56) + "h54l-27 -18z", "#060a16") + R(x + w * 0.3 + 6, y - 16, 4, 16, "#060a16") + R(x + w * 0.3 + 36, y - 16, 4, 16, "#060a16"); if (r() < 0.5) tanks += L("M" + n1(x + w * 0.75) + " " + n1(y) + "v-" + Math.round(40 + r() * 40) + "m-8 18h16m-14 14h12", "#060a16", 3); x += w + r() * 14; }
      s += P(roofs, "#070b19") + tanks;
      s += L("M60 700q90 30 180 0", "#0b1022", 3) + P("M140 770l-6-30h14z", "#0b1022", ' opacity=".9"');
      s += P("M1230 700c0-26 12-40 22-40s22 14 22 40z", "#02040a") + C(1252, 646, 12, "#02040a") + P("M1232 640h40l-4 -8h-32z", "#02040a") + R(0, 840, 1600, 60, "url(#g)"); return wrap(s, d);
    },
    casino: function () {
      var d = G("a", [[0, "#07050a"], [0.7, "#1a1020"], [1, "#2e1a28"]]) + G("g", [[0, "#ffe9a0"], [0.5, "#e3b34c"], [1, "#8a6420"]]) + RG("h", [[0, "#ffd98a", 0.7], [1, "#ffd98a", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + stars(61, 70, 260, "#ffe9c8");
      var rays = ""; for (var i = 0; i < 17; i++) { var a = (-80 + i * 10) * Math.PI / 180; rays += "M800 520L" + n1(800 + Math.sin(a) * 1500) + " " + n1(520 - Math.cos(a) * 1500) + "L" + n1(800 + Math.sin(a + 0.08) * 1500) + " " + n1(520 - Math.cos(a + 0.08) * 1500) + "z"; } s += P(rays, "#e3b34c", ' opacity=".07"') + glowDot(800, 480, 520, "url(#h)", 0.55);
      s += skyline({ seed: 63, x0: -20, x1: 1620, base: 700, minH: 150, maxH: 340, minW: 80, maxW: 150, fill: "#0e0a14", win: [6, 8, 14, 20, "#e3b34c"], lit: 0.1, gap: 0.96 });
      s += P("M470 760V330h60V270h60V210h40V150h340v60h40v60h60v60h60V760z", "#150d18") + P("M470 760V330h60V270h60V210h40V150h340v60h40v60h60v60h60V760z", "none", ' stroke="url(#g)" stroke-width="5"');
      s += P("M700 150l100-80 100 80z", "#e3b34c") + R(790, 40, 20, 30, "#e3b34c") + C(800, 34, 10, "#fff3c8");
      var col = ""; for (var c = 0; c < 8; c++) col += R(540 + c * 66, 330, 22, 430, "#241520") + R(536 + c * 66, 330, 30, 8, "#e3b34c") + R(536 + c * 66, 752, 30, 8, "#e3b34c"); s += col;
      var bulbs = ""; for (var b = 0; b < 25; b++) bulbs += C(480 + b * 24.5, 372, 4, "#ffe9a0") + C(480 + b * 24.5, 760, 4, "#ffe9a0", ' opacity=".7"'); s += bulbs + R(560, 410, 480, 90, "#0a060c", ' rx="6" stroke="#e3b34c" stroke-width="4"') + R(600, 440, 400, 8, "#ff4f6a") + R(640, 462, 320, 6, "#e3b34c");
      var dr = ""; for (var k = 0; k < 6; k++) dr += P("M" + (590 + k * 76) + " 760V600a30 30 0 0 1 60 0V760z", "#f0c56a", ' opacity="' + n1(0.35 + (k % 3) * 0.12) + '"'); s += dr;
      s += R(0, 760, 1600, 140, "#0b070d") + R(0, 760, 1600, 4, "#e3b34c", ' opacity=".5"') + P("M240 836h220l16-26h56l16 26h60v22H240z", "#05030a") + C(310, 862, 18, "#05030a") + C(500, 862, 18, "#05030a") + R(330, 816, 80, 12, "#e3b34c", ' opacity=".4"');
      s += P("M200 760l60-640 50 640z", "#fff3c8", ' opacity=".08"') + P("M1400 760L1320 120l-70 640z", "#fff3c8", ' opacity=".08"'); return wrap(s, d);
    },
    aube: function () {
      var d = G("a", [[0, "#3a2a6a"], [0.4, "#d8607a"], [0.75, "#ffb48a"], [1, "#ffe2b0"]]) + G("t", [[0, "#6a5aa0", 0.9], [0.5, "#2e2a58", 0.95], [1, "#1a1838"]]) + G("t2", [[0, "#ffd0a8", 0.9], [1, "#3a2a5a", 0.9]], 1, 0.3) + RG("s", [[0, "#fff3d8", 1], [0.4, "#ffc88a", 0.55], [1, "#ff9a8a", 0]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + glowDot(800, 600, 640, "url(#s)", 0.9) + C(800, 600, 80, "#fff6dc");
      var cl = ""; var r = rnd(71); for (var i = 0; i < 12; i++) { var x = r() * 1600, y = 120 + r() * 300; cl += R(x, y, 200 + r() * 260, 10 + r() * 14, "#ffc0b0", ' rx="10" opacity="' + n1(0.12 + r() * 0.2) + '"'); } s += cl;
      s += skyline({ seed: 73, x0: -20, x1: 1620, base: 700, minH: 220, maxH: 480, minW: 70, maxW: 120, fill: "#5a4a8a", win: [4, 5, 9, 12, "#ffd9b0"], lit: 0.1, gap: 0.9, ant: 0.6, edge: "#5a4a8a" });
      var gl = "", facets = "", x2 = -20, r2 = rnd(77); while (x2 < 1620) { var w = 90 + r2() * 90, h = 300 + r2() * 360, y2 = 760 - h; gl += P("M" + n1(x2) + " 760V" + y2 + "h" + n1(w) + "V760z", "url(#t)") + P("M" + n1(x2) + " 760V" + y2 + "h" + n1(w * 0.45) + "V760z", "url(#t2)", ' opacity=".55"') + R(x2 + w - 6, y2, 6, h, "#ffd0b0", ' opacity=".35"') + R(x2, y2, w, 5, "#ffd9c4", ' opacity=".6"'); for (var j = 1; j < h / 40; j++) facets += "M" + n1(x2) + " " + n1(y2 + j * 40) + "h" + n1(w); if (r2() < 0.35) gl += L("M" + n1(x2 + w / 2) + " " + y2 + "v-" + Math.round(40 + r2() * 60), "#3a2e66", 3); x2 += w + 4 + r2() * 10; }
      s += gl + L(facets, "#1a1838", 1, ' opacity=".25"') + R(0, 760, 1600, 140, "#1a1430") + R(0, 760, 1600, 4, "#ffb48a", ' opacity=".5"'); return wrap(s, d);
    },
    aurore: function () {
      var d = G("a", [[0, "#03030d"], [0.55, "#0f0a28"], [1, "#2a0f40"]]) + G("r1", [[0, "#ff5fd2", 0], [0.5, "#ff5fd2", 0.65], [1, "#7a4fff", 0]]) + G("r2", [[0, "#3fe8ff", 0], [0.5, "#3fe8ff", 0.5], [1, "#5fa8ff", 0]]) + G("r3", [[0, "#b8ff8a", 0], [0.5, "#7affb8", 0.4], [1, "#3fe8ff", 0]]) + RG("m", [[0, "#ffffff", 1], [0.2, "#ffe9fb", 1], [0.4, "#ff9fe6", 0.3], [1, "#ff5fd2", 0]]) + G("w", [[0, "#ff5fd2", 0.35], [1, "#03030d", 0.95]]);
      var s = R(0, 0, 1600, 900, "url(#a)") + stars(81, 220, 560, "#ffffff");
      s += P("M-20 330C250 150 520 420 800 240S1350 120 1640 300V420C1350 250 1060 430 800 330S250 560 -20 430z", "url(#r1)") + P("M-20 250C300 60 560 330 860 160S1380 60 1640 180V270C1380 160 1100 330 860 240S300 450 -20 340z", "url(#r2)", ' opacity=".8"') + P("M-20 420C300 280 600 500 900 340S1400 280 1640 400V470C1400 360 1100 520 900 410S300 600 -20 500z", "url(#r3)", ' opacity=".6"');
      s += glowDot(1260, 200, 300, "url(#m)", 0.9) + C(1260, 200, 70, "#fff3fc") + C(1240, 184, 14, "#e8d6ea", ' opacity=".6"') + glowDot(360, 150, 150, "url(#m)", 0.6) + C(360, 150, 34, "#e8f6ff");
      s += skyline({ seed: 83, x0: -20, x1: 1620, base: 700, minH: 180, maxH: 380, minW: 70, maxW: 130, fill: "#120a2a", win: [6, 8, 14, 20, "#ff7ad9", "#6af0ff"], lit: 0.2, lit2: 0.14, ant: 0.5, edge: "#120a2a", gap: 0.93 });
      s += P("M690 700V430l30-30V300l30-50 30 50V400l30 30V700z", "#0a0620") + P("M690 700V430l30-30V300l30-50 30 50V400l30 30V700z", "none", ' stroke="#ff5fd2" stroke-width="4"') + P("M720 250l30-90 30 90-30-22z", "#ffd36a") + C(750, 150, 8, "#fff3c8") + L("M750 250V160", "#ffd36a", 3);
      s += skyline({ seed: 87, x0: -30, x1: 1630, base: 760, minH: 100, maxH: 260, minW: 100, maxW: 200, fill: "#07031a", win: [8, 10, 18, 24, "#ffc4ee", "#8affff"], lit: 0.26, lit2: 0.12, roof: "step", gap: 0.97 });
      var r = rnd(89), fl = ""; for (var i = 0; i < 60; i++) fl += C(r() * 1600, 120 + r() * 520, 1.5 + r() * 2.5, ["#ffb3ec", "#9ff4ff", "#fff6c8"][i % 3], ' opacity="' + n1(0.5 + r() * 0.5) + '"'); s += fl;
      s += R(0, 760, 1600, 140, "#07031a") + R(0, 760, 1600, 140, "url(#w)", ' opacity=".9"'); r = rnd(91); for (var k = 0; k < 40; k++) s += R(r() * 1600, 772 + r() * 110, 3 + r() * 4, 14 + r() * 70, ["#ff7ad9", "#6af0ff", "#ffd36a"][k % 3], ' opacity=".35"'); return wrap(s, d);
    }
  };
  function svg(id) { if (!SCENES[id]) return ""; return cache[id] || (cache[id] = SCENES[id]()); }
  function url(id) {
    if (urls[id]) return urls[id]; var t = svg(id); if (!t) return ""; var u = "";
    try { if (root.URL && root.URL.createObjectURL && root.Blob) u = root.URL.createObjectURL(new root.Blob([t], { type: "image/svg+xml" })); } catch (e) { u = ""; }
    return urls[id] = u || "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t);
  }
  function size(id) { var t = svg(id); return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(t).length : t.length; }
  BL.wallsArt = { svg: svg, url: url, size: size, ids: Object.keys(SCENES) };
})(typeof globalThis !== "undefined" ? globalThis : this);
