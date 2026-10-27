/* Lieux de quartier : UN SEUL dessin par type de bâtiment (C3/C4/C5, Partie 12).
   Les 12 types (casino, boîte de nuit, blanchisserie…) sont décrits ici comme des listes d'opérations (volumes, faces décorées, lueurs, personnages)
   dans un terrain de 136 × 104. Le moteur de la carte (map-render.js, canvas) et les illustrations (SVG ci-dessous) lisent exactement la même description :
   un bâtiment a donc le même aspect dans tous les quartiers, sur la carte comme dans son panneau. Aucun nom complet n'est écrit sur le bâtiment :
   un emblème (badge) flotte au-dessus. Logique pure, sans DOM (sauf BL.venues.svg qui fabrique du texte SVG). */
(function (root) {
  var BL = root.BL = root.BL || {}, cache = {}, scache = {};
  var ACC = { racket: "#d9534f", lab: "#7bd36d", contraband: "#d9a441", chop: "#e0803a", betting: "#c05cd0", restaurant: "#f0c070", laundry: "#6fb3d9", club: "#ff4f9a", transport: "#8fb0c9", watch: "#9aa6b8", bunker: "#8a9a82", casino: "#ffd35a", forgery: "#d8c08a", pier: "#5fb0c8", exchange: "#7fd0a0", hotel: "#e0805a", garrison: "#a4adbd" };
  var NAMES = { racket: "Racket", lab: "Laboratoire", contraband: "Entrepôt", chop: "Atelier", betting: "Paris", restaurant: "Restaurant", laundry: "Blanchisserie", club: "Boîte de nuit", transport: "Transport", watch: "Poste de guet", bunker: "Bunker", casino: "Casino", forgery: "Faux papiers", pier: "Ponton", exchange: "Bureau de change", hotel: "Hôtel", garrison: "Caserne" };
  var BADGE = { racket: "shieldS", lab: "flask", contraband: "crate", chop: "gear", betting: "die", restaurant: "cloche", laundry: "drum", club: "disco", transport: "truck", watch: "eye", bunker: "shield", casino: "chip", forgery: "doc", pier: "anchor", exchange: "coin", hotel: "key", garrison: "helmet" };
  var ACTBADGE = { backroom: "spade", freight: "truck", fence: "gem", estate: "house", holding: "bank", maritime: "anchor", shell: "columns", guard: "shield" };
  var ACTACC = { backroom: "#ff6f9c", freight: "#8fb0c9", fence: "#c8a45e", estate: "#9ab4dd", holding: "#e3c680", maritime: "#5fb0c8", shell: "#b9c7a0", guard: "#a4adbd" };
  var IMPORTANT = { casino: 1, club: 1, laundry: 1, bunker: 0 };

  /* ---- fabriques de formes (repère de la face : u vers la droite, v vers le haut) ---- */
  function R(x, y, w, h, f, a) { return { k: "r", x: x, y: y, w: w, h: h, f: f, a: a }; }
  function C(x, y, r, f, a) { return { k: "c", x: x, y: y, r: r, f: f, a: a }; }
  function P(pts, f, a) { return { k: "p", pts: pts, f: f, a: a }; }
  function L(x1, y1, x2, y2, f, lw, a) { return { k: "l", x1: x1, y1: y1, x2: x2, y2: y2, f: f, lw: lw || 1, a: a }; }
  function T(t, x, y, s, f, a) { return { k: "t", t: t, x: x, y: y, s: s, f: f, a: a }; }
  /* rangée de fenêtres : n colonnes × m lignes */
  function wins(u0, v0, n, m, gu, gv, w, h, f, a) { var o = []; for (var j = 0; j < m; j++) for (var i = 0; i < n; i++) o.push(R(u0 + i * gu, v0 + j * gv, w, h, f, a)); return o; }
  /* opérations */
  function B(x, y, w, d, z, h, c, r, ns) { return { o: "box", x: x, y: y, w: w, d: d, z: z, h: h, c: c, r: r, ns: ns }; }
  function G(x, y, w, d, z, rh, c, r) { return { o: "gab", x: x, y: y, w: w, d: d, z: z, rh: rh, c: c, r: r }; }
  function FL(x, y, d, z, sh) { return { o: "fl", x: x, y: y, d: d, z: z, sh: sh }; }            /* face avant-gauche d'un volume (x, y, profondeur d) */
  function FR(x, y, w, d, z, sh) { return { o: "fr", x: x, y: y, w: w, d: d, z: z, sh: sh }; }  /* face avant-droite */
  function TP(x, y, z, sh) { return { o: "top", x: x, y: y, z: z, sh: sh }; }                  /* dessus : u le long de x, v le long de y */
  function GL(x, y, z, r, c, a) { return { o: "glow", x: x, y: y, z: z, r: r, c: c, a: a }; }
  function M(x, y, c) { return { o: "man", x: x, y: y, c: c }; }

  /* ---- emblèmes (24 × 24, y vers le haut ; A = couleur du lieu, D = fond sombre, W = clair) ---- */
  function gearPts() { var o = [], i, a; for (i = 0; i < 8; i++) { a = i * Math.PI / 4; var cx = 12 + Math.cos(a) * 9.4, cy = 12 + Math.sin(a) * 9.4, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux; o.push(P([[cx - vx * 2.3 - ux * 1.6, cy - vy * 2.3 - uy * 1.6], [cx + vx * 2.3 - ux * 1.6, cy + vy * 2.3 - uy * 1.6], [cx + vx * 2.3 + ux * 1.6, cy + vy * 2.3 + uy * 1.6], [cx - vx * 2.3 + ux * 1.6, cy - vy * 2.3 + uy * 1.6]], "A")); } return o; }
  function arc(cx, cy, r, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
  var GLY = {
    chip: [C(12, 12, 11.2, "A"), C(12, 12, 8.4, "D"), C(12, 12, 6.6, "A"), C(12, 12, 3.4, "D"), R(11, 0.8, 2, 3.2, "D"), R(11, 20, 2, 3.2, "D"), R(0.8, 11, 3.2, 2, "D"), R(20, 11, 3.2, 2, "D")],
    spade: [P([[12, 22.5], [4, 12.5], [4, 8.8], [7.6, 6], [10.6, 7], [11.6, 8.3], [10.3, 2], [13.7, 2], [12.4, 8.3], [13.4, 7], [16.4, 6], [20, 8.8], [20, 12.5]], "A")],
    die: [R(2.5, 2.5, 19, 19, "A"), C(7.5, 7.5, 1.9, "D"), C(16.5, 7.5, 1.9, "D"), C(12, 12, 1.9, "D"), C(7.5, 16.5, 1.9, "D"), C(16.5, 16.5, 1.9, "D")],
    flask: [P([[9, 22], [15, 22], [15, 15], [21.5, 4.5], [19.5, 2], [4.5, 2], [2.5, 4.5], [9, 15]], "A"), P([[5.6, 6.5], [18.4, 6.5], [20, 4.4], [4, 4.4]], "D", 0.55), C(10, 10.5, 1.5, "D"), C(14, 8.5, 1.1, "D")],
    crate: [R(2.5, 2.5, 19, 19, "A"), R(4.5, 4.5, 15, 15, "D"), L(4.5, 4.5, 19.5, 19.5, "A", 2), L(19.5, 4.5, 4.5, 19.5, "A", 2)],
    gear: gearPts().concat([C(12, 12, 8, "A"), C(12, 12, 3.6, "D")]),
    cloche: [P(arc(12, 9, 9.5, 0, Math.PI, 14), "A"), R(1.5, 6, 21, 2.6, "A"), C(12, 19.8, 1.9, "A"), R(4, 10, 3, 1.2, "W", 0.5)],
    drum: [C(12, 12, 11, "A"), C(12, 12, 8.4, "D"), C(12, 12, 6.6, "A"), P(arc(12, 11, 5, Math.PI, 2 * Math.PI, 8).concat(arc(12, 11, 2.6, 2 * Math.PI, Math.PI, 8)), "W", 0.5), C(8.6, 15.2, 1.2, "W", 0.8)],
    disco: [R(11, 19.5, 2, 4, "A"), C(12, 11, 8.6, "A"), L(3.4, 11, 20.6, 11, "D", 1.1), L(12, 2.4, 12, 19.6, "D", 1.1), P(arc(12, 11, 8.6, 0.2, 2.9, 8), "D", 0.25), L(5.5, 6, 18.5, 16, "D", 0.9), L(5.5, 16, 18.5, 6, "D", 0.9), P([[20, 20], [21, 22.5], [22, 20], [24, 19], [22, 18], [21, 15.5], [20, 18], [18, 19]], "W")],
    truck: [R(1.5, 7, 13.5, 9.5, "A"), P([[15, 7], [15, 14], [19, 14], [22.5, 10.2], [22.5, 7]], "A"), C(6.5, 6.2, 2.8, "D"), C(18, 6.2, 2.8, "D"), C(6.5, 6.2, 1, "W"), C(18, 6.2, 1, "W"), R(16.2, 10.4, 3, 2.6, "D", 0.7)],
    eye: [P([[0.8, 12], [6.5, 17.2], [12, 19], [17.5, 17.2], [23.2, 12], [17.5, 6.8], [12, 5], [6.5, 6.8]], "A"), C(12, 12, 5, "D"), C(12, 12, 2.2, "A")],
    shield: [P([[12, 22.5], [21, 19.5], [21, 11.5], [12, 1.5], [3, 11.5], [3, 19.5]], "A"), C(12, 13.4, 2.9, "D"), P([[10.8, 12.4], [13.2, 12.4], [14.4, 5.6], [9.6, 5.6]], "D")],
    shieldS: [P([[12, 22.5], [21, 19.5], [21, 11.5], [12, 1.5], [3, 11.5], [3, 19.5]], "A"), T("$", 12, 7.6, 13, "D")],
    gem: [P([[6, 19.5], [18, 19.5], [22.5, 13.2], [12, 2], [1.5, 13.2]], "A"), L(1.5, 13.2, 22.5, 13.2, "D", 1), L(6, 19.5, 9.4, 13.2, "D", 1), L(18, 19.5, 14.6, 13.2, "D", 1), L(9.4, 13.2, 12, 2, "D", 1), L(14.6, 13.2, 12, 2, "D", 1)],
    house: [P([[1.5, 12.2], [12, 22], [22.5, 12.2]], "A"), R(4.6, 2.5, 14.8, 10, "A"), R(10.4, 2.5, 3.2, 6.4, "D"), R(6.2, 7, 2.6, 2.6, "D"), R(15.2, 7, 2.6, 2.6, "D")],
    anchor: [C(12, 19.4, 2.6, "A"), C(12, 19.4, 1.1, "D"), R(11, 4, 2, 13.4, "A"), R(6.5, 14.2, 11, 2, "A"), P(arc(12, 9, 8.6, Math.PI * 1.05, Math.PI * 1.95, 10).concat(arc(12, 9, 6.4, Math.PI * 1.95, Math.PI * 1.05, 10)), "A"), P([[2.2, 7.2], [3.4, 11.4], [5.8, 8.6]], "A"), P([[21.8, 7.2], [20.6, 11.4], [18.2, 8.6]], "A")],
    columns: [P([[1.5, 16.5], [12, 22.5], [22.5, 16.5]], "A"), R(2.5, 2, 19, 2.4, "A"), R(4.6, 5, 3, 10, "A"), R(10.5, 5, 3, 10, "A"), R(16.4, 5, 3, 10, "A"), R(2.5, 15, 19, 1.6, "A"), C(12, 18.2, 1.3, "D")],
    doc: [R(4, 1.5, 14, 19, "A"), P([[18, 20.5], [21, 17.5], [18, 17.5]], "A"), R(7, 15, 8, 1.4, "D"), R(7, 12, 8, 1.4, "D"), R(7, 9, 6, 1.4, "D"), C(15.5, 5.5, 3.2, "D"), C(15.5, 5.5, 2, "A")],
    coin: [C(12, 12, 10.5, "A"), C(12, 12, 8, "D"), T("$", 12, 6.8, 12, "A")],
    key: [C(7, 15, 5.6, "A"), C(7, 15, 2.4, "D"), R(11, 13.8, 11.5, 2.6, "A"), R(17, 9.5, 2.4, 4.4, "A"), R(20.2, 10.5, 2.3, 3.4, "A")],
    helmet: [P(arc(12, 8, 9.5, 0, Math.PI, 14), "A"), R(1, 6.5, 22, 2.6, "A"), R(10.8, 9, 2.4, 8.4, "D"), C(12, 13.2, 2, "D")],
    bank: [P([[1.5, 15.5], [12, 22.2], [22.5, 15.5]], "A"), R(3, 3, 18, 2.6, "A"), R(4.4, 6, 2.6, 8.4, "A"), R(9, 6, 2.6, 8.4, "A"), R(13.4, 6, 2.6, 8.4, "A"), R(17.4, 6, 2.6, 8.4, "A"), R(1.5, 14.4, 21, 1.4, "A")]
  };

  /* ---- les 12 lieux ---- */
  var BLD = {};
  BLD.casino = { h: 84, ops: [
    B(10, 12, 116, 66, 0, 48, "#7b1f30", "#3a1018"), B(28, 22, 80, 40, 48, 22, "#8d2638", "#2c0c12"),
    B(48, 33, 40, 22, 70, 5, "#e3c680", "#f1d98f", 1), B(57, 39, 22, 11, 75, 5, "#e3c680", "#f6e4a8", 1), B(66, 43, 4, 4, 80, 13, "#e3c680", "#fff0b0", 1),
    FL(28, 22, 40, 48, [R(6, 3, 68, 17, "#1a0a10"), T("CASINO", 40, 6.5, 15, "#ffd35a", "p"), C(10, 11, 4, "#ffd35a", "p"), C(70, 11, 4, "#ffd35a", "p"), R(9, 1.5, 62, 1.3, "#ffd35a", "p")]),
    FL(10, 12, 66, 0, wins(8, 14, 7, 1, 15, 0, 7, 24, "#ffd98a", 0.85).concat([R(52, 0, 12, 24, "#2a0d14"), R(54, 0, 8, 22, "#ffcf6a", 0.5)])),
    B(6, 78, 124, 18, 40, 4, "#e3c680", "#f6e4a8", 1),
    B(12, 80, 6, 6, 0, 40, "#f2e6c8", "#fff4d8", 1), B(34, 80, 6, 6, 0, 40, "#f2e6c8", "#fff4d8", 1), B(96, 80, 6, 6, 0, 40, "#f2e6c8", "#fff4d8", 1), B(118, 80, 6, 6, 0, 40, "#f2e6c8", "#fff4d8", 1),
    B(50, 82, 36, 16, 0, 0.8, "#b11b2c", "#c8283a", 1),
    FL(6, 78, 18, 40, (function () { var o = [R(0, 0, 124, 4, "#c9a54e")], i; for (i = 0; i < 14; i++) o.push(C(5 + i * 8.8, 1.6, 2, "#fff0b0", "p")); return o; })()),
    GL(68, 60, 60, 80, "#ffd35a", 0.22), GL(68, 90, 40, 70, "#ff6a8a", 0.14),
    B(2, 92, 18, 9, 0, 6, "#0f1115", "#1b1e24"), FL(2, 92, 9, 0, [R(3, 2.4, 12, 3, "#4a5566"), C(4, 0.4, 1.7, "#05060a"), C(14, 0.4, 1.7, "#05060a")]),
    M(46, 101, "#14171c"), M(90, 101, "#14171c")
  ] };
  BLD.club = { h: 50, ops: [
    B(14, 14, 108, 70, 0, 38, "#17111f", "#241a33"),
    FL(14, 14, 70, 0, [R(0, 0, 108, 3, "#ff4f9a", "p")].concat(wins(8, 14, 1, 1, 0, 0, 4, 22, "#ff4f9a", "p"), wins(22, 14, 1, 1, 0, 0, 4, 22, "#3be0ff", "p"), wins(78, 14, 1, 1, 0, 0, 4, 22, "#3be0ff", "p"), wins(92, 14, 1, 1, 0, 0, 4, 22, "#ff4f9a", "p"), [C(54, 24, 12, "#0e0a14"), C(54, 24, 10.5, "#ff4f9a", "p"), C(54, 24, 7, "#0e0a14"), C(54, 24, 5.6, "#3be0ff", "p"), R(0, 33.2, 108, 2, "#3be0ff", "p")])),
    FR(14, 14, 108, 70, 0, [R(4, 8, 62, 2, "#a56bff", "p"), R(4, 18, 62, 2, "#ff4f9a", "p"), R(4, 28, 62, 2, "#3be0ff", "p")]),
    B(46, 84, 28, 12, 22, 3, "#a01828", "#c8283a", 1), B(47, 90, 2.5, 2.5, 0, 22, "#d8c27a", "#e8d68a", 1), B(70.5, 90, 2.5, 2.5, 0, 22, "#d8c27a", "#e8d68a", 1),
    B(104, 70, 12, 12, 38, 6, "#2a2a30", "#3a3a44", 1), B(18, 70, 10, 10, 38, 5, "#2a2a30", "#3a3a44", 1),
    GL(60, 50, 54, 74, "#ff4f9a", 0.3), GL(60, 50, 60, 54, "#3be0ff", 0.22),
    M(56, 98, "#e8e0cc"), M(62, 102, "#b15a7a"), M(68, 100, "#3a6a9a"), M(74, 104, "#d8b060")
  ] };
  BLD.laundry = { h: 52, ops: [
    B(16, 18, 104, 62, 0, 34, "#d3e6f0", "#a9c3d2"),
    FL(16, 18, 62, 0, (function () { var o = [R(0, 0, 104, 4, "#6fb3d9")], i; for (i = 0; i < 4; i++) { o.push(C(17 + i * 23, 18, 10.5, "#ffffff"), C(17 + i * 23, 18, 8.6, "#4a7da0"), C(17 + i * 23, 18, 6.4, "#9fd0ee"), C(14.5 + i * 23, 20.5, 1.6, "#ffffff", 0.9)); } return o; })()),
    B(44, 62, 46, 4, 34, 18, "#3a7fb5", "#5a9fd5", 1),
    FL(44, 62, 4, 34, [R(0, 0, 46, 18, "#2f6a9c"), C(14, 9, 6.8, "#ffffff"), C(14, 9, 5, "#2f6a9c"), C(14, 9, 3.4, "#9fd0ee"), C(30, 12, 2.2, "#ffffff", 0.8), C(35, 6, 1.6, "#ffffff", 0.8), C(26, 5, 1.2, "#ffffff", 0.8)]),
    B(96, 24, 12, 12, 34, 20, "#8a9aa6", "#a0aeb8", 1), GL(102, 30, 66, 34, "#ffffff", 0.22), GL(106, 28, 84, 26, "#ffffff", 0.16),
    B(24, 80, 60, 10, 18, 3, "#4a90c4", "#ffffff", 1),
    TP(24, 80, 21, (function () { var o = [], i; for (i = 0; i < 10; i++) if (i % 2 === 0) o.push(R(i * 6, 0, 6, 10, "#ffffff")); return o; })()),
    FR(16, 18, 104, 62, 0, [R(4, 8, 44, 1.6, "#6a7a86"), R(8, 10, 5, 8, "#ff7a9a"), R(16, 10, 5, 8, "#ffffff"), R(24, 10, 5, 8, "#7ad39a"), R(32, 10, 5, 8, "#ffd35a"), R(40, 10, 5, 8, "#6fb3d9")]),
    B(100, 84, 16, 8, 0, 8, "#dfe6ee", "#f4f8fc"), FL(100, 84, 8, 0, [R(2, 2, 12, 3, "#4a7da0"), C(3, 0.4, 1.6, "#05060a"), C(13, 0.4, 1.6, "#05060a")]),
    M(92, 98, "#4a7da0")
  ] };
  BLD.racket = { h: 50, ops: [
    B(18, 16, 100, 60, 0, 36, "#4a3030", "#2e2020"),
    FL(18, 16, 60, 0, wins(8, 14, 4, 1, 22, 0, 12, 14, "#ffcf7a", 0.7).concat(wins(8, 14, 4, 1, 22, 0, 12, 14, "#0c0a0a", 0.0), (function () { var o = [], i, j; for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) o.push(L(10 + i * 22 + j * 3, 14, 10 + i * 22 + j * 3, 28, "#1a1212", 1)); return o; })(), [R(70, 0, 20, 26, "#1a1010"), R(72, 0, 16, 24, "#3a2a20"), R(0, 33, 100, 3, "#6a2a2a"), R(0, 30, 100, 1.4, "#d9534f", "p")])),
    FR(18, 16, 100, 60, 0, wins(6, 12, 3, 1, 18, 0, 10, 14, "#ffcf7a", 0.45)),
    B(60, 76, 50, 10, 24, 3, "#7a1f1f", "#9a2a2a", 1),
    B(106, 88, 26, 12, 0, 8, "#0e1013", "#1a1d22"), FL(106, 88, 12, 0, [R(4, 3, 18, 4, "#3a4556"), C(5, 0.6, 2, "#05060a"), C(21, 0.6, 2, "#05060a")]),
    GL(98, 56, 28, 44, "#d9534f", 0.2), M(54, 90, "#14171c"), M(70, 94, "#1a1c22")
  ] };
  BLD.lab = { h: 52, ops: [
    B(14, 20, 96, 56, 0, 28, "#3f4d3c", "#4a5a46"),
    B(24, 28, 14, 14, 28, 10, "#5a6a58", "#6a7a66", 1), B(46, 34, 12, 12, 28, 18, "#5a6a58", "#6a7a66", 1),
    B(80, 26, 22, 22, 28, 14, "#7a8a78", "#8a9a88", 1),
    FL(14, 20, 56, 0, wins(8, 12, 5, 1, 17, 0, 11, 10, "#9aff8a", "p").concat([R(66, 0, 22, 20, "#1a2018"), R(68, 0, 18, 18, "#f1c24b"), L(68, 0, 86, 18, "#1a1a1a", 2), L(77, 0, 86, 9, "#1a1a1a", 2), L(68, 9, 77, 18, "#1a1a1a", 2), R(0, 25, 96, 3, "#5a7a50")])),
    FR(14, 20, 96, 56, 0, wins(6, 12, 3, 1, 16, 0, 10, 10, "#9aff8a", 0.6)),
    GL(66, 40, 52, 56, "#7bd36d", 0.3), GL(48, 40, 60, 44, "#7bd36d", 0.2), GL(30, 36, 50, 34, "#bfffb0", 0.14),
    B(92, 84, 22, 12, 0, 12, "#e8ecef", "#ffffff"), FL(92, 84, 12, 0, [R(2, 5, 18, 3, "#7bd36d"), C(5, 0.6, 2.2, "#05060a"), C(18, 0.6, 2.2, "#05060a")]),
    M(60, 86, "#e8ecef")
  ] };
  BLD.contraband = { h: 56, ops: [
    B(10, 14, 100, 66, 0, 30, "#5d4b37", "#4a3a2a"), G(10, 14, 100, 66, 30, 14, "#5d4b37", "#3a2e22"),
    FL(10, 14, 66, 0, (function () { var o = [], i, j; for (i = 0; i < 3; i++) { o.push(R(8 + i * 31, 0, 26, 22, "#2a2218")); for (j = 0; j < 5; j++) o.push(R(8 + i * 31, 3 + j * 4, 26, 1.2, "#6a5a46")); } o.push(R(0, 28, 100, 2, "#b38a3a", "p")); return o; })()),
    FR(10, 14, 100, 66, 0, wins(8, 10, 3, 1, 20, 0, 8, 8, "#f1c24b", 0.5)),
    B(8, 84, 14, 12, 0, 12, "#b88a4a", "#d8a858"), B(22, 86, 12, 10, 0, 9, "#a87a3a", "#c89848"), B(10, 88, 12, 10, 12, 9, "#a87a3a", "#c89848", 1),
    FL(8, 84, 12, 0, [L(0, 6, 14, 6, "#6a4a22", 1), L(7, 0, 7, 12, "#6a4a22", 1)]),
    B(84, 86, 28, 14, 0, 12, "#dfe6ee", "#f4f8fc"), B(112, 88, 12, 10, 0, 9, "#d9a441", "#e8b858", 1),
    FL(84, 86, 14, 0, [R(2, 3, 24, 2, "#d9a441"), C(6, 0.4, 2, "#05060a"), C(22, 0.4, 2, "#05060a")]),
    GL(66, 44, 40, 40, "#d9a441", 0.18)
  ] };
  BLD.chop = { h: 44, ops: [
    B(16, 22, 96, 52, 0, 26, "#4e3d33", "#3a2d26"),
    FL(16, 22, 52, 0, [R(6, 0, 36, 21, "#17120e"), R(8, 0, 32, 19, "#2a221c"), R(52, 0, 36, 21, "#17120e"), R(54, 0, 32, 19, "#2a221c"), R(0, 22, 96, 4, "#6a5a4c"), C(24, 10, 3, "#3a3a40"), R(12, 8, 24, 6, "#b3472f"), R(58, 7, 24, 7, "#3a5a8a"), C(18, 6, 3, "#05060a"), C(31, 6, 3, "#05060a"), C(64, 6, 3, "#05060a"), C(77, 6, 3, "#05060a")]),
    FR(16, 22, 96, 52, 0, wins(8, 10, 3, 1, 14, 0, 8, 8, "#ffb35a", 0.4)),
    B(14, 82, 18, 14, 0, 4, "#1a1a1e", "#2a2a30"), B(14, 82, 18, 14, 4, 4, "#1a1a1e", "#2a2a30", 1), B(14, 82, 18, 14, 8, 4, "#1a1a1e", "#2a2a30", 1),
    B(60, 84, 36, 12, 0, 14, "#7a5a3c", "#9a7a56"), B(62, 86, 8, 8, 14, 3, "#b3472f", "#c05a3f", 1),
    FL(60, 84, 12, 0, [R(10, 8, 22, 3, "#2a2a30"), C(8, 1, 2, "#05060a"), C(28, 1, 2, "#05060a")]),
    B(100, 80, 10, 10, 0, 18, "#3a3a40", "#4a4a52"), GL(104, 84, 14, 30, "#ffb35a", 0.28), GL(40, 74, 8, 28, "#ffe08a", 0.2), M(50, 100, "#c8601f")
  ] };
  BLD.betting = { h: 46, ops: [
    B(24, 20, 88, 56, 0, 32, "#38244a", "#2a1a38"),
    FL(24, 20, 56, 0, [R(0, 29, 88, 3, "#c05cd0", "p"), R(5, 9, 24, 15, "#0b0610"), R(6, 10, 22, 13, "#3be07a", 0.8), L(8, 12, 14, 18, "#0b0610", 1.2), L(14, 18, 20, 14, "#0b0610", 1.2), L(20, 14, 26, 21, "#0b0610", 1.2),
      R(33, 9, 24, 15, "#0b0610"), R(34, 10, 22, 13, "#ffd35a", 0.8), R(37, 12, 3, 9, "#0b0610"), R(42, 12, 3, 6, "#0b0610"), R(47, 12, 3, 11, "#0b0610"),
      R(61, 0, 18, 22, "#14091c"), R(63, 0, 14, 20, "#c05cd0", 0.45)]),
    FR(24, 20, 88, 56, 0, [R(6, 8, 48, 14, "#0b0610"), R(8, 10, 44, 10, "#c05cd0", 0.7), C(18, 15, 3.5, "#fff", 0.9), C(30, 15, 3.5, "#fff", 0.9), C(42, 15, 3.5, "#fff", 0.9)]),
    B(52, 76, 28, 8, 20, 3, "#7a2a8a", "#a04aaa", 1), TP(52, 76, 23, [R(0, 0, 4, 8, "#ffffff", 0.9), R(8, 0, 4, 8, "#ffffff", 0.9), R(16, 0, 4, 8, "#ffffff", 0.9), R(24, 0, 4, 8, "#ffffff", 0.9)]),
    B(34, 44, 44, 3, 32, 14, "#1d1026", "#2a1a38", 1), FL(34, 44, 3, 32, [R(0, 0, 44, 14, "#12091a"), R(2, 2, 40, 10, "#c05cd0", 0.3), C(11, 7, 3.8, "#ffffff"), C(22, 7, 3.8, "#ffd35a"), C(33, 7, 3.8, "#ffffff"), C(11, 7, 1, "#12091a"), C(22, 7, 1, "#12091a"), C(33, 7, 1, "#12091a")]),
    B(98, 90, 16, 6, 0, 6, "#2a2a30", "#3a3a44"), FL(98, 90, 6, 0, [C(3, 1.2, 2.2, "#05060a"), C(13, 1.2, 2.2, "#05060a"), R(5, 3, 7, 2, "#c05cd0")]),
    GL(70, 48, 34, 60, "#c05cd0", 0.26), M(66, 94, "#14171c"), M(80, 98, "#b15a7a")
  ] };
  BLD.restaurant = { h: 56, ops: [
    B(14, 18, 86, 60, 0, 30, "#94603f", "#6a3a2a"), G(14, 18, 86, 60, 30, 18, "#94603f", "#7a3a2a"),
    B(80, 22, 10, 10, 30, 22, "#6a3a2a", "#7a4a3a", 1),
    FL(14, 18, 60, 0, wins(8, 12, 4, 1, 20, 0, 12, 14, "#ffd58a", 0.85).concat([R(34, 0, 14, 24, "#2a1a12"), R(36, 0, 10, 22, "#f6c870", 0.55), R(0, 26, 86, 4, "#b3472f")])),
    FR(14, 18, 86, 60, 0, wins(8, 12, 3, 1, 18, 0, 10, 14, "#ffd58a", 0.8)),
    B(18, 78, 62, 12, 20, 3, "#c0392b", "#efe6d0", 1),
    TP(18, 78, 23, (function () { var o = [], i; for (i = 0; i < 9; i++) if (i % 2 === 0) o.push(R(i * 62 / 9, 0, 62 / 9, 12, "#efe6d0")); return o; })()),
    B(26, 94, 10, 10, 0, 7, "#5a3a22", "#7a5232"), B(22, 90, 18, 18, 14, 1.6, "#d9534f", "#ef6a5f", 1),
    B(58, 96, 10, 10, 0, 7, "#5a3a22", "#7a5232"), B(54, 92, 18, 18, 14, 1.6, "#f0c070", "#ffd58a", 1),
    GL(44, 70, 24, 54, "#ffc870", 0.3), M(44, 100, "#efe6d0")
  ] };
  BLD.transport = { h: 40, ops: [
    B(12, 22, 112, 52, 0, 28, "#34495c", "#2a3a4a"),
    FL(12, 22, 52, 0, (function () { var o = [R(0, 22, 112, 6, "#6fa8dc")], i; for (i = 0; i < 3; i++) o.push(R(8 + i * 36, 0, 28, 20, "#111c26"), R(10 + i * 36, 0, 24, 18, "#2a3d50")); return o; })()),
    FR(12, 22, 112, 52, 0, wins(6, 10, 3, 1, 16, 0, 10, 8, "#bfe0ff", 0.5)),
    B(16, 80, 40, 14, 0, 14, "#e6ecf2", "#f8fbfe"), B(56, 82, 14, 12, 0, 10, "#6fa8dc", "#8fc0ea", 1),
    FL(16, 80, 14, 0, [R(2, 4, 36, 3, "#6fa8dc"), C(10, 0.5, 2.2, "#05060a"), C(30, 0.5, 2.2, "#05060a")]), FL(56, 82, 12, 0, [C(9, 0.5, 2.2, "#05060a"), R(2, 4, 8, 3, "#8fc0ea")]),
    B(78, 84, 38, 14, 0, 14, "#d9a441", "#ecbd5a"), B(116, 86, 12, 12, 0, 10, "#34495c", "#4a6074", 1),
    FL(78, 84, 14, 0, [R(2, 4, 34, 3, "#34495c"), C(10, 0.5, 2.2, "#05060a"), C(30, 0.5, 2.2, "#05060a")]), FL(116, 86, 12, 0, [C(9, 0.5, 2.2, "#05060a"), R(2, 4, 8, 3, "#6a8aa4")]),
    GL(68, 50, 30, 40, "#6fa8dc", 0.16)
  ] };
  BLD.watch = { h: 74, ops: [
    B(24, 44, 54, 38, 0, 18, "#535a66", "#646c78"),
    FL(24, 44, 38, 0, wins(8, 6, 3, 1, 15, 0, 8, 9, "#ffe08a", 0.6).concat([R(40, 0, 10, 14, "#1d2127")])),
    B(92, 52, 20, 20, 0, 44, "#4a505b", "#5a626e"), B(88, 48, 28, 28, 44, 14, "#2f343c", "#3f4650"), B(86, 46, 32, 32, 58, 3, "#6a7380", "#7a8390", 1),
    FL(88, 48, 28, 44, [R(3, 3, 22, 8, "#ffe9a0", "p")]), FR(88, 48, 28, 28, 44, [R(3, 3, 22, 8, "#ffe9a0", 0.6)]),
    B(101, 61, 2, 2, 61, 10, "#8a93a2", "#9aa3b2", 1),
    GL(102, 62, 66, 80, "#fff2c0", 0.3), GL(102, 62, 50, 40, "#fff2c0", 0.2),
    B(10, 88, 100, 2, 0, 8, "#3a3f48", "#4a505a", 1), M(40, 92, "#14171c")
  ] };
  BLD.bunker = { h: 30, ops: [
    B(18, 26, 100, 58, 0, 18, "#707a6c", "#7d8879"), B(24, 32, 88, 46, 18, 4, "#5f6a5c", "#6c7769", 1),
    FL(18, 26, 58, 0, [R(8, 8, 20, 3, "#10130f"), R(40, 8, 20, 3, "#10130f"), R(72, 8, 20, 3, "#10130f"), R(46, 0, 14, 12, "#2a2f28"), R(48, 0, 10, 10, "#8a9482"), R(0, 17, 100, 1.2, "#8a9482", 0.7)]),
    FR(18, 26, 100, 58, 0, [R(8, 8, 18, 3, "#10130f"), R(32, 8, 18, 3, "#10130f")]),
    B(18, 90, 14, 6, 0, 5, "#b9a278", "#cdb78a"), B(32, 90, 14, 6, 0, 5, "#a8916a", "#bda57c"), B(46, 90, 14, 6, 0, 5, "#b9a278", "#cdb78a"), B(104, 90, 14, 6, 0, 5, "#b9a278", "#cdb78a"),
    B(110, 40, 2, 2, 22, 22, "#9aa3b2", "#aab3c2", 1), GL(110, 40, 46, 24, "#ff4d4d", 0.2)
  ] };

  /* ---- Partie 19 · F : cinq lieux de plus, même grammaire ---- */
  BLD.forgery = { h: 48, ops: [
    B(20, 22, 92, 54, 0, 30, "#4a4238", "#3a332b"), G(20, 22, 92, 54, 30, 12, "#4a4238", "#2e2822"),
    FL(20, 22, 54, 0, wins(8, 12, 4, 1, 18, 0, 11, 11, "#ffe2a0", 0.75).concat([R(76, 0, 14, 22, "#1c1814"), R(78, 0, 10, 20, "#d8c08a", 0.35), R(0, 27, 92, 3, "#d8c08a", "p")])),
    FR(20, 22, 92, 54, 0, [R(6, 10, 30, 14, "#1c1814"), R(8, 12, 26, 10, "#efe6d0", 0.85), L(10, 15, 30, 15, "#4a4238", 1), L(10, 18, 24, 18, "#4a4238", 1), C(30, 19, 2.4, "#b3473f")]),
    B(92, 30, 10, 10, 30, 16, "#3a332b", "#4a4238", 1), GL(102, 34, 52, 26, "#d8c08a", 0.18),
    B(24, 82, 30, 12, 0, 8, "#6b5a40", "#8a7552"), TP(24, 82, 8, [R(3, 2, 10, 8, "#efe6d0"), R(16, 3, 10, 6, "#efe6d0", 0.85), C(20, 6, 1.6, "#b3473f")]),
    GL(60, 50, 26, 46, "#ffe2a0", 0.22), M(70, 96, "#14171c")
  ] };
  BLD.pier = { h: 42, ops: [
    B(-4, 60, 144, 46, -2, 1, "#123a46", "#1a4d5c", 1),
    B(8, 18, 72, 44, 0, 24, "#2d4a58", "#22394a"), FL(8, 18, 44, 0, [R(8, 0, 22, 18, "#0e1a20"), R(36, 6, 10, 8, "#9fd4de", 0.6), R(52, 6, 10, 8, "#9fd4de", 0.5), R(0, 21, 72, 3, "#5fb0c8", "p")]),
    B(84, 20, 46, 8, 0, 3, "#6b5a40", "#8a7552"), B(84, 34, 46, 8, 0, 3, "#6b5a40", "#8a7552"), B(84, 48, 46, 8, 0, 3, "#6b5a40", "#8a7552"),
    B(30, 66, 62, 18, 0, 8, "#2f3640", "#465060"), B(40, 70, 26, 10, 8, 10, "#e8e2d2", "#f6f1e4", 1), B(70, 70, 10, 10, 8, 4, "#5fb0c8", "#7fc8de", 1),
    B(96, 66, 20, 18, 0, 10, "#7a3b34", "#8c4a40"), B(96, 66, 20, 18, 10, 10, "#35506b", "#476a8c", 1),
    B(124, 22, 3, 3, 3, 22, "#8a93a2", "#9aa3b2", 1), GL(125, 23, 28, 30, "#ff4d4d", 0.22), GL(60, 40, 30, 40, "#5fb0c8", 0.18), M(20, 92, "#14171c")
  ] };
  BLD.exchange = { h: 46, ops: [
    B(22, 20, 92, 58, 0, 32, "#e3e6dc", "#c9cdc0"),
    FL(22, 20, 58, 0, [R(6, 6, 34, 18, "#16301f"), R(8, 8, 30, 14, "#7fd0a0", 0.75), T("€ $ £", 23, 11.5, 8, "#0d1a12"), R(48, 0, 16, 24, "#1b2a22"), R(50, 0, 12, 22, "#7fd0a0", 0.35), R(70, 6, 16, 18, "#16301f"), R(72, 8, 12, 14, "#ffd35a", 0.7), R(0, 29, 92, 3, "#7fd0a0", "p")]),
    FR(22, 20, 92, 58, 0, wins(6, 10, 3, 1, 18, 0, 10, 12, "#bfe0ff", 0.55)),
    B(40, 78, 46, 10, 22, 3, "#2f6a48", "#3f8a5c", 1), B(98, 82, 10, 8, 0, 14, "#3a3f48", "#4a505a"), FL(98, 82, 8, 0, [R(2, 6, 6, 5, "#7fd0a0", "p")]),
    GL(56, 50, 28, 40, "#7fd0a0", 0.2), M(60, 98, "#14171c"), M(74, 100, "#3a6a9a")
  ] };
  BLD.hotel = { h: 70, ops: [
    B(26, 18, 74, 60, 0, 56, "#5a3a34", "#3e2824"), B(30, 22, 66, 52, 56, 6, "#4a302a", "#2e1e1a", 1),
    FL(26, 18, 60, 0, wins(8, 18, 4, 3, 16, 12, 9, 8, "#ffcf8a", 0.8).concat([R(26, 0, 22, 14, "#1a100e"), R(28, 0, 18, 12, "#e0805a", 0.4), R(4, 50, 66, 4, "#e0805a", "p")])),
    FR(26, 18, 74, 60, 0, wins(6, 18, 3, 3, 16, 12, 9, 8, "#ffcf8a", 0.6)),
    B(46, 78, 34, 12, 14, 3, "#8b2f3a", "#a83a46", 1), B(47, 86, 2.5, 2.5, 0, 14, "#d8c27a", "#e8d68a", 1), B(76.5, 86, 2.5, 2.5, 0, 14, "#d8c27a", "#e8d68a", 1),
    B(98, 40, 6, 26, 30, 22, "#2a2026", "#3a2e34", 1), FL(98, 40, 26, 30, [R(1, 2, 4, 18, "#e0805a", "p")]),
    GL(62, 60, 50, 50, "#ffcf8a", 0.2), GL(100, 52, 42, 30, "#e0805a", 0.26), M(64, 98, "#efe6d0")
  ] };
  BLD.garrison = { h: 46, ops: [
    B(14, 24, 84, 52, 0, 26, "#3a404c", "#2c313b"), B(14, 24, 84, 4, 26, 4, "#a4adbd", "#b8c0ce", 1),
    FL(14, 24, 52, 0, wins(8, 10, 5, 1, 15, 0, 9, 9, "#ffe08a", 0.6).concat([R(36, 0, 16, 18, "#14161a"), R(0, 22, 84, 2, "#a4adbd", "p")])),
    FR(14, 24, 84, 52, 0, wins(6, 10, 3, 1, 16, 0, 9, 9, "#ffe08a", 0.45)),
    B(104, 30, 16, 16, 0, 36, "#4a505b", "#5a626e"), B(100, 26, 24, 24, 36, 10, "#2f343c", "#3f4650", 1), FL(100, 26, 24, 36, [R(3, 3, 18, 5, "#ffe9a0", "p")]),
    B(6, 86, 124, 2, 0, 9, "#4a505a", "#5a606a", 1), B(54, 80, 22, 10, 0, 7, "#2a2e36", "#3a3f48"), FL(54, 80, 10, 0, [R(3, 3, 16, 2, "#a4adbd"), C(4, 0.4, 1.6, "#05060a"), C(18, 0.4, 1.6, "#05060a")]),
    GL(112, 38, 50, 50, "#fff2c0", 0.22), M(36, 96, "#2f343c"), M(90, 96, "#2f343c")
  ] };

  /* ---- QG : 4 styles (C6). Mêmes opérations que les lieux, sur l'emprise du QG (136 × 100). Purement cosmétique. ---- */
  var HQB = {}, HQACC = { classic: "#c8a45e", dark: "#e0394f", fashion: "#f0d28a", tower: "#7fb8ff" };
  function slits(u0, v0, n, gu, w, h, f, a) { return wins(u0, v0, n, 1, gu, 0, w, h, f, a); }
  HQB.classic = { h: 80, ops: [
    B(0, 0, 136, 100, 0, 66, "#6a4638", "#2e333d"), B(-2, -2, 140, 104, 62, 4, "#c8a45e", "#8f7640", 1), B(24, 20, 88, 60, 66, 16, "#5a3a2e", "#2a2f38", 1),
    FL(0, 0, 100, 0, wins(10, 30, 5, 1, 25, 0, 14, 22, "#f6e3a8", 0.85).concat([R(52, 0, 28, 24, "#1a1410"), R(50, 24, 32, 3, "#c8a45e"), R(8, 50, 120, 9, "#503024", 0.9), T("QG", 66, 52, 9, "#c8a45e", "p")])),
    FR(0, 0, 136, 100, 0, wins(8, 30, 4, 1, 22, 0, 12, 22, "#f6e3a8", 0.7)),
    B(8, 8, 3, 3, 82, 36, "#8a8f99", "#9aa0aa", 1), GL(68, 50, 70, 26, "#f6e3a8", 0.1), M(54, 108, "#c8a45e"), M(86, 110, "#d8d4c8")
  ] };
  HQB.dark = { h: 76, ops: [
    B(0, 0, 136, 100, 0, 58, "#262a31", "#15171c"), B(22, 18, 92, 64, 58, 14, "#1d2026", "#101216"),
    B(-3, -3, 142, 3, 58, 3, "#6b6f78", "#7b7f88", 1), B(-3, 100, 142, 3, 58, 3, "#6b6f78", "#7b7f88", 1),
    FL(0, 0, 100, 0, slits(12, 34, 8, 15, 7, 15, "#e0394f", 0.9).concat(slits(12, 14, 8, 15, 7, 8, "#e0394f", 0.6), [R(50, 0, 36, 26, "#0c0d10"), R(54, 0, 28, 22, "#1b1e24"), R(46, 27, 44, 9, "#0c0d10"), T("QG", 68, 28.5, 8, "#ff4d63", "p"), R(46, 36, 44, 1.4, "#ff4d63", "p")])),
    FR(0, 0, 136, 100, 0, [R(8, 8, 3, 40, "#e0394f", 0.55), R(22, 8, 3, 40, "#e0394f", 0.55), R(36, 8, 3, 40, "#e0394f", 0.55), R(0, 52, 100, 1.2, "#6b6f78", 0.8)]),
    FL(22, 18, 64, 58, slits(8, 4, 8, 10, 6, 8, "#e0394f", 0.7)),
    TP(22, 18, 72, [L(2, 2, 90, 2, "#8a8f99", 1), L(2, 60, 90, 60, "#8a8f99", 1), L(2, 2, 2, 60, "#8a8f99", 1), L(90, 2, 90, 60, "#8a8f99", 1), C(45, 30, 9, "#e0394f", 0.35)]),
    B(60, 34, 14, 10, 72, 5, "#3a3e46", "#4a4e58", 1), GL(68, 50, 70, 30, "#e0394f", 0.12), GL(68, 100, 14, 30, "#ff4d63", 0.25), M(60, 108, "#1a1c20"), M(78, 110, "#1a1c20")
  ] };
  HQB.fashion = { h: 84, ops: [
    B(0, 0, 136, 100, 0, 66, "#e7e1d3", "#cfc8b8"), B(10, 10, 116, 80, 66, 8, "#d7cfbd", "#bdb59f", 1), B(30, 28, 76, 44, 74, 10, "#eee9dc", "#d0c9b8", 1),
    B(-3, -3, 142, 4, 62, 4, "#f0d28a", "#c8a45e", 1),
    FL(0, 0, 100, 0, [R(6, 8, 18, 46, "#8fc3de", 0.9), R(32, 8, 18, 46, "#8fc3de", 0.9), R(86, 8, 18, 46, "#8fc3de", 0.9), R(112, 8, 18, 46, "#8fc3de", 0.9), R(56, 0, 24, 30, "#2a2216"), R(58, 0, 20, 28, "#f0d28a", 0.35), R(54, 30, 28, 14, "#1c1810"), T("QG", 68, 34, 11, "#f0d28a", "p"), R(0, 56, 136, 1.4, "#f0d28a"), R(26, 0, 3, 56, "#f0d28a"), R(80, 0, 3, 56, "#f0d28a"), L(0, 4, 136, 4, "#f0d28a", 1)]),
    FR(0, 0, 136, 100, 0, [R(10, 8, 20, 46, "#8fc3de", 0.78), R(40, 8, 20, 46, "#8fc3de", 0.78), R(70, 8, 20, 46, "#8fc3de", 0.78), R(0, 56, 100, 1.4, "#f0d28a", 0.8)]),
    FL(30, 28, 44, 74, [R(6, 2, 64, 6, "#8fc3de", 0.9), R(0, 9, 76, 1.2, "#f0d28a")]),
    TP(10, 10, 74, [R(60, 50, 40, 16, "#58b3d6", 0.95), L(60, 50, 100, 50, "#fff", 1, 0.6), C(24, 24, 7, "#7ec17a", 0.9), C(36, 50, 5, "#7ec17a", 0.9)]),
    GL(68, 105, 14, 30, "#f0d28a", 0.25), M(54, 108, "#f0d28a"), M(84, 110, "#f3efe4")
  ] };
  HQB.tower = { h: 168, ops: [
    B(0, 0, 136, 100, 0, 24, "#2c3f55", "#1c2a3a"), B(26, 20, 84, 60, 24, 104, "#3d6590", "#26425f"), B(40, 32, 56, 36, 128, 12, "#2f5075", "#1d3750", 1),
    B(34, 26, 68, 48, 140, 4, "#9aa6b4", "#b2bcc8", 1), B(66, 48, 3, 3, 144, 24, "#9aa6b4", "#aab4c0", 1),
    FL(0, 0, 100, 0, [R(10, 6, 116, 12, "#9ccdf0", 0.55), R(52, 0, 32, 18, "#10202f"), R(48, 18, 40, 6, "#10202f"), T("QG", 68, 19.5, 9, "#7fb8ff", "p"), R(0, 22, 136, 1.2, "#7fb8ff", "p")]),
    FL(26, 20, 60, 24, wins(4, 6, 8, 11, 10, 9, 6, 5, "#bfe0ff", 0.65).concat(wins(8, 12, 7, 6, 10, 18, 4, 3, "#ffe6a8", 0.9))),
    FR(26, 20, 84, 60, 24, wins(4, 6, 7, 11, 8, 9, 5, 5, "#bfe0ff", 0.5).concat([R(24, 6, 2, 96, "#7fb8ff", 0.4)])),
    FL(40, 32, 36, 128, [R(4, 3, 48, 6, "#bfe0ff", 0.7)]),
    TP(34, 26, 144, [C(34, 24, 22, "#d8dde4"), C(34, 24, 18, "#7a8591"), T("H", 34, 17, 20, "#ffd35a"), L(22, 24, 46, 24, "#ffd35a", 1.4, 0.0)]),
    GL(68, 50, 172, 16, "#ff4d4d", 0.4), GL(68, 106, 14, 30, "#7fb8ff", 0.25), M(54, 108, "#c8d4e0"), M(86, 110, "#c8d4e0")
  ] };
  var HQSTY = ["classic", "dark", "fashion", "tower"];

  function spec(id) { var hq = /^hq:/.test(id) ? id.slice(3) : null, b = hq ? HQB[hq] : BLD[id]; if (!b) return null; if (cache[id]) return cache[id]; return (cache[id] = { id: id, h: b.h, acc: hq ? HQACC[hq] : ACC[id] || "#c8a45e", badge: hq ? "house" : BADGE[id] || "chip", ops: b.ops, important: !!IMPORTANT[id] || !!hq, name: hq ? "QG" : NAMES[id] || id }); }
  function glyph(name) { return GLY[name] || GLY.chip; }
  function types() { return Object.keys(BLD); }
  function actBadge(act) { return { glyph: ACTBADGE[act] || "chip", acc: ACTACC[act] || "#e3c680" }; }

  /* ---- rendu SVG (panneaux, menu de construction) : même description, projection isométrique identique à la carte ---- */
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function sh(h, k) { if (!/^#[0-9a-f]{6}$/i.test(h)) return h; var c = rgb(h); return "rgb(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + ")"; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function gcol(c, acc) { return c === "A" ? acc : c === "D" ? "#12151b" : c === "W" ? "#f3efe4" : c; }
  function shapesSvg(list, acc, k) {
    var out = [];
    list.forEach(function (s) {
      var a = s.a === "p" ? 0.92 : s.a === undefined ? 1 : s.a, col = sh(gcol(s.f, acc), k || 1), op = a < 1 ? ' opacity="' + f1(a * 100) / 100 + '"' : "";
      if (a === 0) return;
      if (s.k === "r") out.push('<rect x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" fill="' + col + '"' + op + "/>");
      else if (s.k === "c") out.push('<circle cx="' + s.x + '" cy="' + s.y + '" r="' + s.r + '" fill="' + col + '"' + op + "/>");
      else if (s.k === "p") out.push('<polygon points="' + s.pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") + '" fill="' + col + '"' + op + "/>");
      else if (s.k === "l") out.push('<line x1="' + s.x1 + '" y1="' + s.y1 + '" x2="' + s.x2 + '" y2="' + s.y2 + '" stroke="' + col + '" stroke-width="' + s.lw + '"' + op + "/>");
      else if (s.k === "t") out.push('<text x="' + s.x + '" y="' + -s.y + '" font-size="' + s.s + '" font-weight="700" text-anchor="middle" fill="' + col + '" font-family="IBM Plex Sans, sans-serif" transform="scale(1,-1)"' + op + ">" + s.t + "</text>");
    });
    return out.join("");
  }
  function svg(id, opts) {
    opts = opts || {}; var key = id + "|" + (opts.badge === false ? 0 : 1); if (scache[key]) return scache[key];
    var V = spec(id); if (!V) return ""; var S = 1.4, CX = 0, GY = 0, out = [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    function X(x, y) { return (x - y) * 0.5 * S + CX; } function Y(x, y, z) { return (x + y) * 0.25 * S - z * S + GY; }
    function pt(x, y, z) { var a = X(x, y), b = Y(x, y, z); if (a < x0) x0 = a; if (a > x1) x1 = a; if (b < y0) y0 = b; if (b > y1) y1 = b; return f1(a) + "," + f1(b); }
    function poly(pts, fill) { out.push('<polygon points="' + pts.join(" ") + '" fill="' + fill + '"/>'); }
    function box(o) { var x = o.x, y = o.y, w = o.w, d = o.d, z = o.z, h = o.h;
      poly([pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], sh(o.c, 1)); poly([pt(x + w, y + d, z), pt(x + w, y, z), pt(x + w, y, z + h), pt(x + w, y + d, z + h)], sh(o.c, 0.66)); poly([pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], sh(o.r || o.c, 1.18)); }
    function gab(o) { var x = o.x, y = o.y, w = o.w, d = o.d, z = o.z, rh = o.rh; poly([pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d / 2, z + rh)], sh(o.c, 0.66)); poly([pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d / 2, z + rh), pt(x, y + d / 2, z + rh)], sh(o.r, 1.05)); }
    function face(mat, shp, k) { out.push('<g transform="matrix(' + mat.map(f1).join(",") + ')">' + shapesSvg(shp, V.acc, k) + "</g>"); }
    out.push('<polygon points="' + [pt(-6, -6, 0), pt(142, -6, 0), pt(142, 110, 0), pt(-6, 110, 0)].join(" ") + '" fill="#222831" stroke="#313947" stroke-width="1"/>');
    V.ops.forEach(function (o) {
      if (o.o === "box") box(o); else if (o.o === "gab") gab(o);
      else if (o.o === "fl") face([0.5 * S, 0.25 * S, 0, -S, X(o.x, o.y + o.d), Y(o.x, o.y + o.d, o.z)], o.sh, 1);
      else if (o.o === "fr") face([0.5 * S, -0.25 * S, 0, -S, X(o.x + o.w, o.y + o.d), Y(o.x + o.w, o.y + o.d, o.z)], o.sh, 0.78);
      else if (o.o === "top") face([0.5 * S, 0.25 * S, -0.5 * S, 0.25 * S, X(o.x, o.y), Y(o.x, o.y, o.z)], o.sh, 1.1);
      else if (o.o === "glow") out.push('<circle cx="' + f1(X(o.x, o.y)) + '" cy="' + f1(Y(o.x, o.y, o.z)) + '" r="' + f1(o.r * 0.38) + '" fill="' + o.c + '" opacity="' + f1(Math.min(0.3, o.a * 0.9)) + '"/>');
      else if (o.o === "man") { var mx = X(o.x, o.y), my = Y(o.x, o.y, 0); out.push('<rect x="' + f1(mx - 2) + '" y="' + f1(my - 9) + '" width="4" height="8" fill="' + o.c + '"/><circle cx="' + f1(mx) + '" cy="' + f1(my - 11) + '" r="2.6" fill="#d9b48f"/>'); }
    });
    if (opts.badge !== false) {                              /* emblème flottant au-dessus du lieu */
      var cx = X(68, 52), cy = Y(68, 52, V.h) - 22, r = V.important ? 17 : 14; if (cy - r < y0) y0 = cy - r - 2; if (cx + r > x1) x1 = cx + r; if (cx - r < x0) x0 = cx - r;
      out.push('<g><circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + (r + 3) + '" fill="' + V.acc + '" opacity=".16"/><circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + r + '" fill="#0d1014" stroke="' + V.acc + '" stroke-width="2"/>' +
        '<g transform="translate(' + f1(cx - r * 0.62) + "," + f1(cy + r * 0.62) + ") scale(" + f1(r * 1.24 / 24) + "," + f1(-r * 1.24 / 24) + ')">' + shapesSvg(glyph(V.badge), V.acc, 1) + "</g></g>");
    }
    var pad = 8, vx = f1(x0 - pad), vy = f1(y0 - pad), vw = f1(x1 - x0 + 2 * pad), vh = f1(y1 - y0 + 2 * pad);
    return (scache[key] = '<svg viewBox="' + vx + " " + vy + " " + vw + " " + vh + '" style="stroke:none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + V.name + '"><circle cx="' + f1(vx + vw / 2) + '" cy="' + f1(vy + vh * 0.62) + '" r="' + f1(vw * 0.42) + '" fill="' + V.acc + '" opacity=".07"/>' + out.join("") + "</svg>");
  }
  /* emblème seul (pastille) : activités du centre-ville et types de quartier */
  function badgeSvg(glyphName, acc, size) { var s = size || 32; return '<svg viewBox="0 0 32 32" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px;stroke:none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#0d1014" stroke="' + acc + '" stroke-width="2"/><g transform="translate(5.2,26.8) scale(' + f1(21.6 / 24) + "," + f1(-21.6 / 24) + ')">' + shapesSvg(glyph(glyphName), acc, 1) + "</g></svg>"; }

  BL.venues = { spec: spec, glyph: glyph, types: types, svg: svg, badgeSvg: badgeSvg, actBadge: actBadge, ACC: ACC, BADGE: BADGE, NAMES: NAMES, plot: { w: 136, d: 104 }, hqStyles: HQSTY, hqSpec: function (st) { return spec("hq:" + st); }, hqSvg: function (st) { return svg("hq:" + st, { badge: false }); } };
})(typeof globalThis !== "undefined" ? globalThis : this);
