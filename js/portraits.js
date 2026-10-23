/* Portraits : bustes stylisés générés en SVG à partir d'une description (aucune image externe) + emblèmes de factions. */
(function (root) {
  var BL = root.BL = root.BL || {}, uid = 0;
  function mix(hex, to, k) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), r = [16, 8, 0].map(function (s) { var x = a >> s & 255, y = b >> s & 255; return Math.round(x + (y - x) * k); });
    return "#" + r.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
  }
  function dark(h, k) { return mix(h, "#000000", k); } function light(h, k) { return mix(h, "#ffffff", k); }
  var HEAD = {
    round: "M60 27C80 27 84 46 81 62C79 78 71 92 60 92C49 92 41 78 39 62C36 46 40 27 60 27Z",
    square: "M60 27C80 27 83 44 82 60L81 76C80 86 72 92 60 92C48 92 40 86 39 76L38 60C37 44 40 27 60 27Z",
    oval: "M60 27C78 27 82 45 79 62C77 78 69 93 60 93C51 93 43 78 41 62C38 45 42 27 60 27Z",
    long: "M60 24C78 24 82 44 79 64C77 82 69 96 60 96C51 96 43 82 41 64C38 44 42 24 60 24Z"
  };
  var HAIR_TOP = {
    short: "M39 58C36 30 50 20 60 20C72 20 84 30 81 58C79 46 75 40 70 38C64 42 54 42 48 38C44 41 40 48 39 58Z",
    slick: "M38 60C34 28 52 18 62 19C76 20 86 32 81 60C80 48 77 42 72 38C64 36 50 38 46 44C42 48 40 54 38 60Z",
    pomp: "M37 58C30 22 52 8 64 10C78 12 88 28 82 58C80 46 76 40 70 36C62 34 52 36 47 42C42 46 39 52 37 58Z",
    bob: "M40 54C37 30 52 22 62 23C74 24 84 34 80 54C75 42 65 37 56 39C50 41 43 46 40 54Z",
    long: "M39 58C34 30 50 20 61 20C73 20 85 30 81 58C78 44 70 36 58 38C50 40 42 48 39 58Z",
    curly: "M40 56C38 40 46 34 60 34C74 34 82 40 80 56C76 46 70 42 60 42C50 42 44 46 40 56Z",
    braids: "M39 58C35 30 50 20 60 20C72 20 85 30 81 58C79 45 74 38 62 38C50 38 42 46 39 58Z",
    bun: "M39 58C36 30 50 20 60 20C72 20 84 30 81 58C79 46 75 40 70 38C64 42 54 42 48 38C44 41 40 48 39 58Z",
    afro: "M42 52C40 38 48 33 60 33C72 33 80 38 78 52C74 44 68 41 60 41C52 41 46 44 42 52Z"
  };
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || "") + "/>"; }
  function S(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || "") + "/>"; }


  /* Décors : silhouettes et lumières d'un univers de gangsters (statiques, aucune animation) */
  function bokeh(cols, pts) { return pts.map(function (q, i) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="' + cols[i % cols.length] + '" opacity="' + (q[3] || 0.3) + '"/>'; }).join(""); }
  var SCENES = {
    blinds: function (a) { var o = '<rect width="120" height="140" fill="' + a + '" opacity=".06"/>'; for (var i = 0; i < 9; i++) o += '<path d="M' + (-30 + i * 20) + ' 0L' + (-14 + i * 20) + ' 0L' + (34 + i * 20) + ' 140L' + (18 + i * 20) + ' 140Z" fill="#fff" opacity=".075"/>'; return o; },
    skyline: function (a) { var o = '<circle cx="92" cy="30" r="11" fill="#f3ecd0" opacity=".16"/>', b = [[0, 62, 16], [14, 48, 14], [28, 70, 12], [40, 40, 16], [54, 58, 12], [66, 36, 15], [80, 56, 14], [94, 44, 14], [106, 64, 16]]; b.forEach(function (r) { o += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + (140 - r[1]) + '" fill="#06080b" opacity=".62"/>'; for (var y = r[1] + 6; y < 96; y += 9) for (var x = r[0] + 3; x < r[0] + r[2] - 3; x += 5) if ((x * 7 + y * 3) % 4 < 2) o += '<rect x="' + x + '" y="' + y + '" width="2" height="3" fill="' + a + '" opacity=".55"/>'; }); return o; },
    brick: function (a) { var o = '<circle cx="22" cy="34" r="30" fill="' + a + '" opacity=".14"/>'; for (var r = 0; r < 14; r++) { o += '<path d="M0 ' + (r * 10) + 'H120" stroke="#000" stroke-width=".8" opacity=".35"/>'; for (var x = (r % 2) * 9; x < 120; x += 18) o += '<path d="M' + x + ' ' + (r * 10) + 'v10" stroke="#000" stroke-width=".8" opacity=".35"/>'; } return o + '<path d="M14 0V16M10 16H34L30 24H14Z" fill="#05060a" opacity=".75"/><circle cx="22" cy="30" r="3" fill="' + a + '" opacity=".9"/>'; },
    neon: function (a, c) { c = c || "#4ad8e8"; return '<path d="M8 70C8 20 56 6 60 6" fill="none" stroke="' + a + '" stroke-width="6" opacity=".18"/><path d="M8 70C8 20 56 6 60 6" fill="none" stroke="' + a + '" stroke-width="1.8" opacity=".95"/><path d="M112 76C112 36 90 22 72 20" fill="none" stroke="' + c + '" stroke-width="6" opacity=".16"/><path d="M112 76C112 36 90 22 72 20" fill="none" stroke="' + c + '" stroke-width="1.8" opacity=".9"/>' + bokeh([a, c], [[16, 100, 7, .16], [100, 108, 9, .14], [30, 124, 5, .18], [88, 90, 4, .2]]); },
    docks: function (a) { return '<path d="M12 140V40L58 40M12 54L58 40M24 40V140M96 140V24L44 24M96 38L44 24" stroke="#05070a" stroke-width="2.4" fill="none" opacity=".7"/><rect x="0" y="100" width="30" height="40" fill="#05070a" opacity=".55"/><rect x="92" y="96" width="28" height="44" fill="#05070a" opacity=".5"/><path d="M0 108H30M0 116H30M92 106H120M92 116H120" stroke="#fff" stroke-width=".6" opacity=".12"/><circle cx="96" cy="22" r="2.6" fill="' + a + '"/><circle cx="96" cy="22" r="9" fill="' + a + '" opacity=".2"/>'; },
    rain: function (a) { var o = bokeh([a, "#9ab"], [[18, 40, 8, .14], [104, 30, 10, .12], [96, 84, 6, .16], [10, 96, 5, .16]]); for (var i = 0; i < 18; i++) o += '<path d="M' + (i * 7 + 2) + ' ' + ((i * 29) % 90) + 'l-5 24" stroke="#cfe0ee" stroke-width=".7" opacity=".16"/>'; return o + '<path d="M0 20H120M0 90H120M60 0V140" stroke="#000" stroke-width="2" opacity=".28"/>'; },
    sun: function (a) { var o = ""; for (var i = 0; i < 17; i++) { var t = (i / 16) * Math.PI; o += '<path d="M60 70L' + (60 + Math.cos(t) * 90).toFixed(1) + " " + (70 - Math.sin(t) * 90).toFixed(1) + 'L' + (60 + Math.cos(t + .1) * 90).toFixed(1) + " " + (70 - Math.sin(t + .1) * 90).toFixed(1) + 'Z" fill="' + a + '" opacity=".13"/>'; } return o + '<circle cx="60" cy="70" r="52" fill="none" stroke="' + a + '" stroke-width="1.4" opacity=".5"/><circle cx="60" cy="70" r="58" fill="none" stroke="' + a + '" stroke-width=".7" opacity=".35"/>'; },
    map: function (a) { var o = ""; for (var i = 0; i < 9; i++) o += '<path d="M' + (i * 15) + ' 0V140M0 ' + (i * 16) + 'H120" stroke="' + a + '" stroke-width=".6" opacity=".22"/>'; return o + '<path d="M6 120L30 98L52 104L70 70L96 62L114 28" fill="none" stroke="' + a + '" stroke-width="1.4" stroke-dasharray="4 3" opacity=".75"/><circle cx="114" cy="28" r="3.4" fill="none" stroke="' + a + '" stroke-width="1.2" opacity=".9"/><circle cx="6" cy="120" r="2" fill="' + a + '"/><path d="M12 14l8 0M16 10v8" stroke="' + a + '" opacity=".6"/>'; },
    checker: function (a) { var o = ""; for (var r = 0; r < 4; r++) for (var c = 0; c < 8; c++) if ((r + c) % 2) o += '<rect x="' + (c * 15) + '" y="' + (84 + r * 14) + '" width="15" height="14" fill="#fff" opacity=".05"/>'; return o + '<path d="M96 40l4-12 4 12zM96 44h8v6h-8z" fill="' + a + '" opacity=".4"/><circle cx="100" cy="24" r="4" fill="' + a + '" opacity=".4"/>'; },
    books: function (a) { var o = "", cols = ["#6b3b2a", "#3b4a5a", "#7a6a3a", "#40303f", "#2f4a3d"]; for (var r = 0; r < 2; r++) { var x = 0; for (var i = 0; i < 14 && x < 120; i++) { var w = 6 + (i * 5) % 6, h = 22 + (i * 7 + r * 3) % 12; o += '<rect x="' + x + '" y="' + (r * 44 + 40 - h) + '" width="' + w + '" height="' + h + '" fill="' + cols[(i + r) % 5] + '" opacity=".55"/>'; x += w + 1; } o += '<rect x="0" y="' + (r * 44 + 40) + '" width="120" height="3" fill="' + a + '" opacity=".35"/>'; } return o + '<circle cx="60" cy="60" r="44" fill="' + a + '" opacity=".1"/>'; },
    arches: function (a) { var o = ""; for (var i = 0; i < 3; i++) o += '<path d="M' + (i * 40 + 2) + ' 140V50C' + (i * 40 + 2) + ' 20 ' + (i * 40 + 38) + ' 20 ' + (i * 40 + 38) + ' 50V140" fill="#000" opacity=".22" stroke="' + a + '" stroke-width="1" /><path d="M' + (i * 40 + 8) + ' 140V54C' + (i * 40 + 8) + ' 30 ' + (i * 40 + 32) + ' 30 ' + (i * 40 + 32) + ' 54V140" fill="none" stroke="' + a + '" stroke-width=".6" opacity=".5"/>'; return o; },
    lights: function (a, c) { return bokeh([a, c || "#fff", a], [[14, 58, 12, .22], [34, 70, 7, .2], [100, 52, 13, .2], [84, 78, 8, .18], [108, 96, 6, .2], [8, 100, 8, .15]]) + '<path d="M0 108L120 98V140H0Z" fill="#000" opacity=".3"/>'; }
  };
  var FUR = function (fur) { var o = ""; for (var i = 0; i < 15; i++) { var t = Math.PI * (i / 14), y = 99 + Math.sin(t) * 15; o += '<circle cx="' + (60 + Math.cos(t) * 25).toFixed(1) + '" cy="' + (y + (i % 2 ? 1.5 : 0)).toFixed(1) + '" r="' + (5.2 + (i % 3) * 0.5) + '" fill="' + (i % 2 ? fur : light(fur, 0.14)) + '"/>'; } return o; };

  /* image si elle existe (assets/crew/manifest.js), dessin vectoriel sinon */
  var IMG = {};
  /* C13 : 3 formats d'image par personnage (manifest.js) : card 6:7, thumb 1:1, full 2:3. Chaque variante manquante retombe sur une autre, puis sur le dessin SVG. */
  var OKF = /^[\w.-]+\.(webp|jpe?g|png)$/i, VARS = ["card", "thumb", "full"];
  function urlOf(pid, v) { var e = IMG[pid]; if (!e) return null; return e[v] || (v === "thumb" ? e.card || e.full : v === "full" ? e.card : e.full) || e.card || e.thumb || null; }
  function imgSvg(pid, label, cls, v) { var u = urlOf(pid, v || "card"), foc = (BL.crewImages && BL.crewImages.focus && BL.crewImages.focus[pid]) || "xMidYMin"; return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" class="' + (cls || "portrait") + '" role="img" aria-label="' + (label || "Portrait") + '" data-pid="' + pid + '" data-var="' + (v || "card") + '" data-src="image"><image href="' + u + '" x="0" y="0" width="120" height="140" preserveAspectRatio="' + foc + ' slice"/></svg>'; }
  function probe() {
    var m = BL.crewImages || {}, doc = root.document; if (!doc || typeof root.Image !== "function") return;
    Object.keys(m).forEach(function (pid) {
      if (pid === "focus") return; var raw = m[pid], def = typeof raw === "string" ? { card: raw } : raw && typeof raw === "object" ? raw : null; if (!def) return;
      VARS.forEach(function (v) {
        var f = def[v]; if (typeof f !== "string" || !OKF.test(f) || (IMG[pid] && IMG[pid][v])) return;
        var url = "assets/crew/" + f, im = new root.Image(); im.onload = function () {
          IMG[pid] = IMG[pid] || {}; IMG[pid][v] = url;
          Array.prototype.forEach.call(doc.querySelectorAll('svg[data-pid="' + pid + '"]'), function (el) { var vv = el.getAttribute("data-var") || "card"; if (el.getAttribute("data-src") === "image" && urlOf(pid, vv) === el.querySelector("image").getAttribute("href")) return; var t = doc.createElement("div"); t.innerHTML = imgSvg(pid, el.getAttribute("aria-label"), el.getAttribute("class"), vv); if (el.parentNode) el.parentNode.replaceChild(t.firstChild, el); });
          if (BL.portraits && BL.portraits.onImage) BL.portraits.onImage(pid, v);
        }; im.src = url;
      });
    });
  }
  function portrait(L, o) {
    o = o || {}; if (o.id && IMG[o.id] && urlOf(o.id, o.variant || "card")) return imgSvg(o.id, o.label, o.cls, o.variant); var id = "p" + (++uid), f = !!L.female, skin = L.skin, hair = L.hair || "#222", ex = L.extra || [], has = function (k) { return ex.indexOf(k) >= 0; };
    var skinD = dark(skin, 0.28), skinL = light(skin, 0.12), brow = L.brow || dark(hair, 0.1), suit = L.suit || "#222", sd = dark(suit, 0.35), sl = light(suit, 0.12), shirt = L.shirt || "#e8e4da";
    var o2 = "", i, bg = L.bg || ["#22303d", "#10161c"], head = HEAD[L.face || "round"];
    var defs = '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + skinL + '"/><stop offset=".55" stop-color="' + skin + '"/><stop offset="1" stop-color="' + dark(skin, 0.16) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'k" x1="' + (L.light === "r" ? 1 : 0) + '" y1="0" x2="' + (L.light === "r" ? 0 : 1) + '" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".45" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></linearGradient>' +
      '<linearGradient id="' + id + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset=".12" stop-color="#000" stop-opacity=".34"/><stop offset=".5" stop-color="#000" stop-opacity=".1"/><stop offset=".75" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + id + 'v" cx=".5" cy=".46" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><path d="M6 140C8 114 34 102 60 102C86 102 112 114 114 140Z"/></clipPath></defs>';
    /* fond : dégradé + rayons art déco + halo */
    o2 += '<rect width="120" height="140" fill="url(#' + id + 'b)"/>';
    if (L.scene && SCENES[L.scene]) o2 += SCENES[L.scene](L.accent || "#c8a45e", L.accent2);
    else for (i = -5; i <= 5; i++) o2 += '<path d="M60 150L' + (60 + i * 30 - 6) + ' 0L' + (60 + i * 30 + 6) + ' 0Z" fill="#fff" opacity=".035"/>';
    o2 += '<circle cx="' + (L.light === "r" ? 50 : 70) + '" cy="62" r="46" fill="#fff" opacity=".05"/>';
    /* cheveux arrière */
    if (L.style === "afro") o2 += '<circle cx="60" cy="46" r="34" fill="' + hair + '"/><circle cx="46" cy="34" r="12" fill="' + light(hair, 0.06) + '" opacity=".6"/>';
    if (L.style === "bob") o2 += P("M36 46C32 18 88 18 84 46L87 94C80 99 72 97 70 90L50 90C48 97 40 99 33 94Z", hair);
    /* corps */
    o2 += P("M6 140C8 114 34 102 60 102C86 102 112 114 114 140Z", suit);
    if (L.pin) { o2 += '<g clip-path="url(#' + id + 'c)" opacity=".18">'; for (i = 0; i < 14; i++) o2 += '<path d="M' + (8 + i * 8) + ' 100V140" stroke="#fff" stroke-width=".8"/>'; o2 += "</g>"; }
    if (L.style === "long") o2 += P("M35 50C30 72 28 104 33 126L50 126C46 104 44 84 42 62Z", hair) + P("M85 50C90 72 92 104 87 126L70 126C74 104 76 84 78 62Z", hair);
    if (L.style === "braids") for (i = 0; i < 2; i++) { var bx = i ? 84 : 36; for (var j = 0; j < 8; j++) o2 += '<ellipse cx="' + (bx + (i ? 1 : -1) * Math.sin(j) * 1.2) + '" cy="' + (62 + j * 8) + '" rx="4.6" ry="4.4" fill="' + (j % 2 ? dark(hair, 0.15) : hair) + '"/>'; }
    /* tenues : base (avant le cou) et pièces qui passent devant le cou (col relevé, fourrure, col roulé) */
    var ofOver = "", gold = "#c8a45e", sh2 = L.shirt || "#e8e4da";
    if (L.outfit === "trench") {
      o2 += P("M50 100L70 100L60 126Z", dark(sh2, 0.55)) + P("M45 98L57 106L48 140L12 140L20 112Z", sl) + P("M75 98L63 106L72 140L108 140L100 112Z", sl) + S("M57 106L48 140M63 106L72 140", sd, 1.2);
      o2 += '<circle cx="52" cy="124" r="1.8" fill="' + dark(suit, 0.5) + '"/><circle cx="68" cy="124" r="1.8" fill="' + dark(suit, 0.5) + '"/><circle cx="52" cy="134" r="1.8" fill="' + dark(suit, 0.5) + '"/><circle cx="68" cy="134" r="1.8" fill="' + dark(suit, 0.5) + '"/>';
      ofOver = P("M38 84L52 90L56 108L46 116L30 108Z", sl) + P("M82 84L68 90L64 108L74 116L90 108Z", sl) + S("M38 84L30 108M82 84L90 108", sd, 1);
    } else if (L.outfit === "leather") {
      o2 += P("M47 100L73 100L66 124L54 124Z", "#141418") + P("M46 99L56 104L53 140L14 140L22 112Z", sl) + P("M74 99L64 104L67 140L106 140L98 112Z", sl) + S("M16 126C28 112 40 108 50 110M70 110C80 108 92 112 104 126", "#fff", 1.6, ' opacity=".22"') + S("M56 104L53 140M64 104L67 140", dark(suit, 0.5), 1.2);
      ofOver = P("M44 88L52 92L55 104L44 108L38 100Z", sl) + P("M76 88L68 92L65 104L76 108L82 100Z", sl);
    } else if (L.outfit === "vest") {
      var vc = L.vest || "#4a2f2a";
      o2 += P("M46 100L74 100L72 140L48 140Z", vc) + P("M53 100L67 100L60 114Z", sh2) + P("M44 98L55 102L50 140L16 140L22 112Z", sl) + P("M76 98L65 102L70 140L104 140L98 112Z", sl);
      for (i = 0; i < 4; i++) o2 += '<circle cx="60" cy="' + (118 + i * 6) + '" r="1.3" fill="' + gold + '"/>';
      o2 += S("M47 120C52 128 58 126 62 119", gold, 1) + '<circle cx="47" cy="120" r="1.6" fill="' + gold + '"/>';
      ofOver = P("M49 96L56 102L52 108L47 102Z", sh2) + P("M71 96L64 102L68 108L73 102Z", sh2) + (L.tie ? P("M55 103L60 106L65 103L65 109L60 106L55 109Z", L.tie) + '<circle cx="60" cy="106" r="1.3" fill="' + dark(L.tie, 0.4) + '"/>' : "");
    } else if (L.outfit === "turtle") {
      o2 += P("M44 98L56 104L50 140L18 140L24 112Z", sl) + P("M76 98L64 104L70 140L102 140L96 112Z", sl) + P("M50 100L70 100L68 140L52 140Z", L.turtle || dark(sh2, 0.65));
      ofOver = P("M47 80H73L75 100C68 106 52 106 45 100Z", L.turtle || dark(sh2, 0.65)) + S("M47 90C54 94 66 94 73 90M46 96C54 100 66 100 74 96", dark(L.turtle || dark(sh2, 0.65), 0.35), 1);
    } else if (L.outfit === "fur") {
      o2 += P("M50 100L70 100L60 126Z", sh2) + P("M45 98L57 106L48 140L16 140L22 112Z", sl) + P("M75 98L63 106L72 140L104 140L98 112Z", sl);
      ofOver = FUR(L.fur || "#e6e0d3");
    } else if (L.outfit === "pinstripe") {
      o2 += P("M47 100L73 100L60 132Z", sh2) + P("M47 100L60 132L36 140L24 112Z", sl) + P("M73 100L60 132L84 140L96 112Z", sl) + S("M47 100L60 132L73 100", sd, 1);
      if (L.tie) o2 += P("M55 104L65 104L67 112L60 134L53 112Z", L.tie);
      o2 += '<path d="M86 118L96 116L97 121L87 123Z" fill="' + (L.pocket || "#c8a45e") + '"/>';
    }
    /* chemise, revers, cravate */
    if (L.outfit) { /* tenue spécifique ci-dessus */ }
    else if (L.collar === "high") { o2 += P("M42 96L78 96L84 112L36 112Z", sd) + P("M42 96L78 96L77 101L43 101Z", sl); }
    else {
      o2 += P("M47 100L73 100L60 130Z", shirt) + P("M47 100L60 130L40 140L28 112Z", sl) + P("M73 100L60 130L80 140L92 112Z", sl) + S("M47 100L60 130L73 100", sd, 1);
      if (L.tie) o2 += P("M55 104L65 104L67 112L60 134L53 112Z", L.tie) + P("M55 104L65 104L63 109L57 109Z", dark(L.tie, 0.25));
      if (L.pin) o2 += '<circle cx="60" cy="116" r="1.6" fill="#c8a45e"/>';
    }
    if (has("rose")) o2 += '<path d="M84 128L90 138" stroke="#2e6a3a" stroke-width="1.6"/><circle cx="83" cy="127" r="3.4" fill="#a8262e"/><circle cx="83" cy="127" r="1.3" fill="#7d1a21"/>';
    /* cou */
    o2 += P("M51 84H69L71 104C66 108 54 108 49 104Z", dark(skin, 0.14)) + P("M51 90C56 96 64 96 69 90V96C64 100 56 100 51 96Z", skinD, ' opacity=".5"');
    if (ofOver) o2 += ofOver;
    if (has("scarf")) o2 += P("M44 98C52 108 68 108 76 98L80 110C68 118 52 118 40 110Z", L.scarf || "#c8a45e") + S("M48 104C56 110 64 110 72 104", dark(L.scarf || "#c8a45e", 0.3), 1);
    if (has("pearls")) for (i = 0; i < 9; i++) o2 += '<circle cx="' + (46 + i * 3.5) + '" cy="' + (100 + 5.5 * Math.sin(Math.PI * i / 8)) + '" r="1.9" fill="#f1eee6" stroke="#bdb8aa" stroke-width=".4"/>';
    if (has("chain")) o2 += S("M47 101C53 114 67 114 73 101", "#c8a45e", 1.6) + '<circle cx="60" cy="113" r="2.4" fill="#c8a45e"/>';
    if (has("necklace")) o2 += S("M48 99C54 108 66 108 72 99", "#c8a45e", 1) + '<circle cx="60" cy="107" r="1.8" fill="#e9c97b"/>';
    /* oreilles */
    o2 += '<ellipse cx="39.5" cy="63" rx="4.2" ry="6" fill="' + skinD + '"/><ellipse cx="80.5" cy="63" rx="4.2" ry="6" fill="' + skinD + '"/>';
    if (has("earring")) o2 += '<circle cx="39" cy="70" r="2.2" fill="#e9c97b"/><circle cx="81" cy="70" r="2.2" fill="#e9c97b"/>';
    if (has("tattoo")) o2 += S("M53 88C56 92 58 96 56 101M67 88C64 92 62 96 64 101M55 92L65 92M54.5 96L65.5 96", dark(skin, 0.62), 1, ' opacity=".8"') + '<circle cx="60" cy="93" r="1.4" fill="' + dark(skin, 0.62) + '" opacity=".8"/>';
    if (has("earpiece")) o2 += S("M80 66C86 72 86 86 78 98", "#0c0c0f", 1.1) + '<circle cx="80.5" cy="66" r="2" fill="#0c0c0f"/>';
    /* tête */
    o2 += P(head, "url(#" + id + "s)") + '<path d="' + head + '" fill="none" stroke="' + dark(skin, 0.4) + '" stroke-width=".8" opacity=".5"/>';
    o2 += '<ellipse cx="60" cy="90" rx="14" ry="4" fill="' + skinD + '" opacity=".25"/>';
    if (L.style === "bald") o2 += '<ellipse cx="54" cy="34" rx="9" ry="4" fill="#fff" opacity=".22"/>';
    /* barbe (sous le visage) */
    var hc = hair, cuts = { stache: "M50 77C54 74 58 75 60 77C62 75 66 74 70 77C66 81 62 78 60 78C58 78 54 81 50 77Z", goatee: "M52 83C53 95 67 95 68 83C65 87 55 87 52 83Z", full: "M38 62C39 82 48 96 60 97C72 96 81 82 82 62C79 76 72 82 66 81C62 78 58 78 54 81C48 82 41 76 38 62Z" };
    if (L.beard === "full") o2 += P(cuts.full, hc) + P(cuts.stache, dark(hc, 0.1));
    if (L.beard === "goatee") o2 += P(cuts.goatee, hc) + P(cuts.stache, hc);
    if (L.beard === "stache") o2 += P(cuts.stache, hc);
    if (L.beard === "stubble") o2 += P(cuts.full, hc, ' opacity=".3"');
    /* visage */
    var eyeY = 59;
    if (L.glasses !== "shades") {
      var iris = L.eye || "#3a2a1c";
      [51, 69].forEach(function (x) {
        o2 += '<path d="M' + (x - 5.4) + " " + eyeY + "Q" + x + " " + (eyeY - 4) + " " + (x + 5.4) + " " + eyeY + "Q" + x + " " + (eyeY + 2.8) + " " + (x - 5.4) + " " + eyeY + 'Z" fill="#e4dfd3"/>' +
          '<circle cx="' + x + '" cy="' + (eyeY - 0.2) + '" r="2.5" fill="' + iris + '"/><circle cx="' + x + '" cy="' + (eyeY - 0.2) + '" r="1.25" fill="#0c0908"/><circle cx="' + (x + 0.9) + '" cy="' + (eyeY - 0.9) + '" r=".6" fill="#fff" opacity=".9"/>' +
          '<path d="M' + (x - 5.4) + " " + eyeY + "Q" + x + " " + (eyeY - 3.2) + " " + (x + 5.4) + " " + eyeY + 'L' + (x + 5.4) + " " + (eyeY - 1) + "Q" + x + " " + (eyeY - 5) + " " + (x - 5.4) + " " + (eyeY - 1) + 'Z" fill="' + skinD + '" opacity=".55"/>' +
          S("M" + (x - 5.6) + " " + eyeY + "Q" + x + " " + (eyeY - 4.4) + " " + (x + 5.6) + " " + eyeY, "#16110e", f ? 1.2 : 0.9) + S("M" + (x - 4) + " " + (eyeY + 2.6) + "Q" + x + " " + (eyeY + 3.6) + " " + (x + 4) + " " + (eyeY + 2.6), skinD, .6, ' opacity=".6"') + S("M" + (x - 5) + " " + (eyeY - 5.2) + "Q" + x + " " + (eyeY - 7) + " " + (x + 5) + " " + (eyeY - 5.2), skinD, .7, ' opacity=".35"');
      });
    }
    var bw = f ? 1.5 : 2.4;
    o2 += S("M45 " + (f ? 50.5 : 51) + "Q51 " + (f ? 47.8 : 48.6) + " 57 " + (f ? 52 : 53), brow, bw) + S("M63 " + (f ? 52 : 53) + "Q69 " + (f ? 47.8 : 48.6) + " 75 " + (f ? 50.5 : 51), brow, bw);
    o2 += S("M60 60C59 66 57 70 56 72C58 74.5 62 74.5 64 72", dark(skin, 0.32), 1.3) + P("M56 73C58 75 62 75 64 73L63 71L57 71Z", skinD, ' opacity=".35"');
    if (L.lips) o2 += P("M52.5 81.6Q56 78.4 60 79.6Q64 78.4 67.5 81.6Q60 85.6 52.5 81.6Z", L.lips) + S("M52.5 81.6Q60 82.8 67.5 81.6", dark(L.lips, 0.45), .8);
    else if (L.beard === "full" || L.beard === "goatee" || L.beard === "stache") o2 += S("M54 82.4Q60 83.4 66 82.4", dark(skin, 0.5), 1.2);
    else o2 += S("M52.5 81.8Q60 83.2 67.5 81.8", dark(skin, 0.55), 1.3) + S("M53 83.4Q60 85 67 83.4", skinD, 1, ' opacity=".35"');
    if (has("scar")) o2 += S("M45 62L52 80", "#a85a54", 1.8) + S("M44.5 67L48 66.5M46 73L50 72.5", "#d9aaa0", .9);
    /* modelé réaliste : creux des joues, ombre du nez, sous-œil, front, mâchoire ; rides selon l'âge (statique, aucun filtre coûteux) */
    var age = L.age || 40;
    o2 += '<ellipse cx="51" cy="65.2" rx="6.5" ry="1.9" fill="' + skinD + '" opacity="' + (0.16 + Math.max(0, age - 40) * 0.004).toFixed(2) + '"/><ellipse cx="69" cy="65.2" rx="6.5" ry="1.9" fill="' + skinD + '" opacity="' + (0.16 + Math.max(0, age - 40) * 0.004).toFixed(2) + '"/>' +
      S(L.light === "r" ? "M40 66C41 75 46 82 52 86" : "M80 66C79 75 74 82 68 86", skinD, 3.2, ' opacity=".2"') + S("M56 62C55 68 55 71 56 73", skinD, 2.2, ' opacity=".18"') + '<ellipse cx="60" cy="42" rx="12" ry="3.4" fill="#fff" opacity=".07"/>' +
      S("M42 78C44 88 52 93 60 93C68 93 76 88 78 78", skinD, 1.4, ' opacity=".18"');
    if (age >= 45) o2 += S("M50 40C55 38.6 65 38.6 70 40", skinD, .7, ' opacity="' + Math.min(0.4, (age - 40) * 0.012).toFixed(2) + '"') + S("M49.6 43C55 41.8 65 41.8 70.4 43", skinD, .6, ' opacity="' + Math.min(0.35, (age - 40) * 0.01).toFixed(2) + '"') + S("M49 72C46.6 77 46.6 81 49 85M71 72C73.4 77 73.4 81 71 85", skinD, .8, ' opacity="' + Math.min(0.45, (age - 40) * 0.013).toFixed(2) + '"') + S("M45 58L43.4 60M75 58L76.6 60", skinD, .6, ' opacity=".35"');
    if (age >= 55) o2 += S("M44 66C46 69 49 70 52 69.6M76 66C74 69 71 70 68 69.6", skinD, .6, ' opacity=".4"');
    /* lunettes */
    if (L.glasses === "shades") o2 += '<rect x="43" y="53" width="15" height="10.5" rx="4" fill="#0c0c0f"/><rect x="62" y="53" width="15" height="10.5" rx="4" fill="#0c0c0f"/><path d="M58 57H62" stroke="#0c0c0f" stroke-width="2"/><path d="M46 56L52 54" stroke="#fff" stroke-width="1" opacity=".3"/><path d="M65 56L71 54" stroke="#fff" stroke-width="1" opacity=".3"/><path d="M43 57L39 57M77 57L81 57" stroke="#0c0c0f" stroke-width="1.6"/>';
    if (L.glasses === "round") { var gc = L.glassColor || "#222"; o2 += '<circle cx="51" cy="59" r="7" fill="#fff" fill-opacity=".07" stroke="' + gc + '" stroke-width="1.6"/><circle cx="69" cy="59" r="7" fill="#fff" fill-opacity=".07" stroke="' + gc + '" stroke-width="1.6"/>' + S("M58 58Q60 56.5 62 58", gc, 1.4) + S("M44 58L40 57M76 58L80 57", gc, 1.2); }
    if (L.glasses === "monocle") { var mc = L.glassColor || "#c8a45e"; o2 += '<circle cx="69" cy="59" r="8" fill="#fff" fill-opacity=".08" stroke="' + mc + '" stroke-width="1.6"/>' + S("M77 62C82 76 86 92 84 106", mc, .9); }
    /* cheveux avant */
    var style = L.style;
    if (style !== "bald") {
      o2 += P(HAIR_TOP[style] || HAIR_TOP.short, hair);
      if (style === "slick" || style === "pomp" || style === "long" || style === "bob") o2 += S("M48 30C57 25 69 26 75 33", light(hair, 0.25), 1.3, ' opacity=".55"');
      if (style === "curly") for (i = 0; i < 9; i++) { var a = Math.PI * (1.05 + i * 0.1); o2 += '<circle cx="' + (60 + Math.cos(a) * 24).toFixed(1) + '" cy="' + (46 + Math.sin(a) * 22).toFixed(1) + '" r="8.5" fill="' + hair + '"/>'; }
      if (style === "bun") o2 += '<circle cx="60" cy="15" r="10" fill="' + hair + '"/><path d="M52 14C58 9 64 9 68 14" stroke="' + light(hair, 0.3) + '" stroke-width="1" fill="none" opacity=".5"/>';
      if (style === "braids") o2 += S("M60 21V38", dark(hair, 0.3), 1);
    }
    if (has("tape")) o2 += P("M55 63.5L65 66.5L64 69.5L54 66.5Z", "#efe6cf") + S("M58 62L61 70", "#efe6cf", 2.2, ' opacity=".9"');
    if (has("visor")) o2 += P("M36 44C46 36 74 36 84 44L86 54C72 49 48 49 34 54Z", "#2f8a58", ' opacity=".82"') + S("M36 52C48 47 72 47 84 52", "#ffffff", 1, ' opacity=".35"') + P("M32 54C46 50 74 50 88 54L86 58C72 55 48 55 34 58Z", "#1f5f3d");
    if (has("cig")) o2 += '<path d="M66 82L82 80L82 82.4L66 84.4Z" fill="#efe9dc"/><circle cx="83" cy="81.2" r="1.6" fill="#e0703a"/><path d="M84 78C88 72 82 70 86 64" stroke="#fff" stroke-width="1" fill="none" opacity=".35" stroke-linecap="round"/>';
    if (has("holder")) o2 += S("M64 82L94 66", "#1a1a1e", 1.6) + '<path d="M91 67.4L96 64.6" stroke="#efe9dc" stroke-width="2" stroke-linecap="round"/><circle cx="97" cy="64" r="1.5" fill="#e0703a"/><path d="M98 60C102 54 96 52 100 46" stroke="#fff" stroke-width="1" fill="none" opacity=".35" stroke-linecap="round"/>';
    if (has("toothpick")) o2 += S("M62 83L80 76", "#d9b46a", 1.1);
    /* accessoires de bouche */
    if (has("cigar")) o2 += '<path d="M62 81L89 75.5L89.5 78.8L62 84Z" fill="#6b4425"/><path d="M85 76.3L89 75.5L89.5 78.8L85.5 79.5Z" fill="#8a5a33"/><circle cx="90.5" cy="77" r="2.3" fill="#e0703a"/><circle cx="90.5" cy="77" r="1" fill="#ffd27a"/><path d="M91 72C95 66 88 62 92 56" stroke="#fff" stroke-width="1.2" fill="none" opacity=".35" stroke-linecap="round"/>';
    /* chapeaux */
    var hcol = L.hatColor || "#2a2c33";
    if (L.hat === "fedora") o2 += P("M36 44C33 16 46 8 60 8C74 8 87 16 84 44Z", hcol) + P("M36 40L84 40L84 46L36 46Z", dark(hcol, 0.4)) + S("M44 13C52 20 68 20 76 13", dark(hcol, 0.35), 1.4) + '<ellipse cx="60" cy="45" rx="42" ry="8" fill="' + hcol + '"/><ellipse cx="60" cy="45" rx="42" ry="8" fill="none" stroke="' + light(hcol, 0.18) + '" stroke-width=".8"/>';
    if (L.hat === "flat") o2 += P("M35 42C32 22 48 14 66 16C84 18 90 30 86 43C76 38 50 36 35 42Z", hcol) + P("M62 40C74 36 94 39 100 47C90 52 72 48 62 40Z", dark(hcol, 0.3)) + S("M44 22C56 18 72 20 80 28", light(hcol, 0.2), 1, ' opacity=".6"') + '<circle cx="60" cy="17" r="1.8" fill="' + dark(hcol, 0.3) + '"/>';
    if (L.hat === "trilby") o2 += P("M40 46C38 20 48 10 62 10C76 10 84 20 82 46Z", hcol) + P("M40 42L82 42L82 47L40 47Z", L.band || "#a8262e") + S("M46 15C54 22 68 22 76 15", dark(hcol, 0.4), 1.2) + P("M26 50C34 44 46 44 60 45C74 44 90 42 100 36C102 46 92 54 74 54C54 56 34 56 26 50Z", hcol) + S("M30 50C46 53 78 53 96 41", light(hcol, 0.2), .9, ' opacity=".6"');
    if (L.hat === "panama") o2 += P("M38 44C36 18 48 10 60 10C74 10 86 18 84 44Z", hcol) + P("M38 40L84 40L84 46L38 46Z", L.band || "#1a1a1e") + '<ellipse cx="61" cy="46" rx="46" ry="9" fill="' + hcol + '"/><ellipse cx="61" cy="46" rx="46" ry="9" fill="none" stroke="' + dark(hcol, 0.22) + '" stroke-width=".9"/>' + S("M44 16C54 22 68 22 78 16", dark(hcol, 0.2), 1.2);
    if (L.hat === "pillbox") { o2 += P("M40 38C38 22 52 16 62 18C74 16 86 24 82 38C72 34 52 34 40 38Z", hcol) + S("M44 26C54 22 70 22 80 28", light(hcol, 0.25), 1, ' opacity=".6"'); for (i = 0; i < 9; i++) o2 += S("M" + (40 + i * 5) + " 38V" + (56 + (i % 2) * 4), "#fff", .5, ' opacity=".45"'); o2 += S("M40 46H84M40 52H84", "#fff", .5, ' opacity=".4"'); }
    if (L.hat === "beanie") o2 += P("M38 50C34 22 50 12 62 12C74 12 88 22 82 50C70 44 52 44 38 50Z", hcol) + P("M37 44C50 40 72 40 83 44L82 52C70 47 50 47 38 52Z", dark(hcol, 0.25)) + S("M42 46L40 52M50 44.5L48.5 50.5M58 44L57.5 50M66 44L66.5 50M74 44.5L75.5 50.5M81 46L82.5 52", dark(hcol, 0.5), 1, ' opacity=".6"');
    if (L.hat === "beret") o2 += '<ellipse cx="56" cy="28" rx="31" ry="12" transform="rotate(-10 56 28)" fill="' + hcol + '"/><circle cx="66" cy="14" r="2.4" fill="' + dark(hcol, 0.3) + '"/>';
    /* éclairage de film noir : ombre portée côté opposé à la lumière, ombre du bord de chapeau, vignette */
    var lx = L.light === "r" ? 1 : 0;
    o2 += '<path d="' + head + '" fill="url(#' + id + 'k)"/>';
    if ((L.hat && L.hat !== "panama") || has("visor")) o2 += '<path d="' + head + '" fill="url(#' + id + 'h)"/>';
    /* étalonnage « nuit de ville » provisoire (violet en haut, lueur chaude du côté de la lumière) : à remplacer par de vraies illustrations (assets/crew) */
    o2 += '<linearGradient id="' + id + 'n" x1="' + (lx ? 1 : 0) + '" y1="0" x2="' + (lx ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".16"/><stop offset=".45" stop-color="#7a4cff" stop-opacity=".08"/><stop offset="1" stop-color="#1a1040" stop-opacity=".22"/></linearGradient><rect width="120" height="140" fill="url(#' + id + 'n)"/>';
    o2 += '<rect width="120" height="140" fill="url(#' + id + 'v)"/>';
    o2 += '<path d="' + (lx ? "M114 140C113 126 108 116 98 110" : "M6 140C7 126 12 116 22 110") + '" fill="none" stroke="' + (L.accent || "#c8a45e") + '" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" class="' + (o.cls || "portrait") + '" role="img" aria-label="' + (o.label || "Portrait") + '"' + (o.id ? ' data-pid="' + o.id + '" data-var="' + (o.variant || "card") + '" data-src="svg"' : "") + '>' + defs + o2 + "</svg>";
  }

  /* Emblèmes de factions : écu sombre + symbole de la couleur de la faction */
  var SHAPES = {
    blades: function (c) { return '<path d="M30 28L68 74M70 28L32 74" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/><path d="M26 56L40 56M60 56L74 56" stroke="' + c + '" stroke-width="3" stroke-linecap="round" opacity="0"/><path d="M27 60L37 70M73 60L63 70" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/>'; },
    raven: function (c) { return '<path d="M24 64C32 52 42 46 50 42C48 34 54 28 62 28L74 33L65 37C67 46 61 56 52 62L62 76L46 68L32 74Z" fill="' + c + '"/><circle cx="62" cy="33" r="1.5" fill="#14171c"/>'; },
    hex: function (c) { return '<path d="M50 24L73 37V63L50 76L27 63V37Z" fill="none" stroke="' + c + '" stroke-width="4" stroke-linejoin="round"/><path d="M38 60V42L50 54L62 42V60" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'; },
    crown: function (c) { return '<path d="M27 66L27 38L40 52L50 30L60 52L73 38L73 66Z" fill="' + c + '"/><rect x="27" y="69" width="46" height="5" rx="1.5" fill="' + c + '"/>'; }
  };
  function emblem(shape, color, o) {
    o = o || {}; var fn = SHAPES[shape] || SHAPES.hex;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 104" class="' + (o.cls || "emblem") + '" role="img" aria-label="' + (o.label || "Emblème") + '"><path d="M50 4L90 16V50C90 74 72 90 50 98C28 90 10 74 10 50V16Z" fill="#14171c" stroke="' + color + '" stroke-width="4"/><path d="M50 12L82 21V50C82 69 68 82 50 90C32 82 18 69 18 50V21Z" fill="' + color + '" opacity=".1"/>' + fn(color) + "</svg>";
  }
  BL.portraits = { probe: probe, hasImage: function (id, v) { return v ? !!(IMG[id] && IMG[id][v]) : !!(IMG[id] && urlOf(id, "card")); }, imageUrl: function (id, v) { return urlOf(id, v || "card"); }, portrait: portrait, emblem: emblem, shapes: SHAPES };
})(typeof globalThis !== "undefined" ? globalThis : this);
