/* Pièce du QG : géométrie isométrique et rendu canvas. Aucune dépendance au DOM autre que le contexte 2D passé en paramètre.
   Cellule (x, y) ; écran X = (x − y)·32, Y = (x + y)·16 − z. Le joueur regarde vers le coin (n, n) : x et y croissants = vers lui. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var TW = 64, TH = 32, WALL = 150;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /* cadrage : échelle et origine pour qu'une pièce n×n tienne dans vw×vh */
  function frame(n, vw, vh) {
    var wpx = n * TW + 60, hpx = n * TH + WALL + 50, s = clamp(Math.min(vw / wpx, vh / hpx), 0.3, 1.7);
    return { n: n, s: s, ox: vw / 2, oy: (vh - hpx * s) / 2 + (WALL + 20) * s, vw: vw, vh: vh };
  }
  function scr(f, x, y, z) { return [f.ox + (x - y) * (TW / 2) * f.s, f.oy + (x + y) * (TH / 2) * f.s - (z || 0) * f.s]; }
  function cellAt(f, sx, sy) { var u = (sx - f.ox) / f.s / (TW / 2), v = (sy - f.oy) / f.s / (TH / 2); return { x: Math.floor((u + v) / 2), y: Math.floor((v - u) / 2) }; }
  function inPoly(px, py, poly) { var c = false, i, j; for (i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* contour d'un objet (pavé de largeur w, profondeur d, hauteur h) */
  function silhouette(f, x, y, w, d, h) { return [scr(f, x, y, h), scr(f, x + w, y, h), scr(f, x + w, y, 0), scr(f, x + w, y + d, 0), scr(f, x, y + d, 0), scr(f, x, y + d, h)]; }
  function itemBox(it) { var f = BL.hq.foot(it.id, it.r), d = BL.hq.dec(it.id); return { x: it.x, y: it.y, w: f.w, d: f.d, h: d.shape === "rug" ? 1 : d.h }; }
  function pick(f, items, sx, sy) {                                          /* objet sous le pointeur, le plus proche du joueur d'abord */
    var order = items.slice().sort(function (a, b) { var A = itemBox(a), B = itemBox(b); return (B.x + B.w + B.y + B.d) - (A.x + A.w + A.y + A.d) || B.y - A.y; });
    for (var i = 0; i < order.length; i++) { var b = itemBox(order[i]); if (inPoly(sx, sy, silhouette(f, b.x, b.y, b.w, b.d, b.h))) return order[i]; }
    return null;
  }
  function vaultPoly(f) { var n = f.n, u0 = n * 0.5 - 0.9, u1 = n * 0.5 + 0.9; return [scr(f, 0, u0, 118), scr(f, 0, u1, 118), scr(f, 0, u1, 36), scr(f, 0, u0, 36)]; }
  function doorPoly(f) { var n = f.n, a = n - 2.3, b = n - 1.2; return [scr(f, a, 0, 112), scr(f, b, 0, 112), scr(f, b, 0, 0), scr(f, a, 0, 0)]; }

  /* ---------- couleurs ---------- */
  function rgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  var shC = {};
  function shade(hex, k) { var key = hex + k; if (shC[key]) return shC[key]; var c = rgb(hex).map(function (v) { return Math.round(clamp(k >= 0 ? v + (255 - v) * k : v * (1 + k), 0, 255)); }); return (shC[key] = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"); }
  var WALLS = [{ c: "#3a3f48", n: "Béton brut" }, { c: "#4a2f2a", n: "Brique sombre" }, { c: "#4a3426", n: "Boiseries" }, { c: "#16181d", n: "Marbre noir" }];
  var DARK = [0.62, 0.46, 0.32, 0.18];

  var BL_cur = null; function BL_baseOff() { return !!(BL_cur && BL_cur.hq && BL_cur.hq.baseOff); }
  function create(ctx) {
    var R = { t: 0, ctx: ctx, off: null, thumbs: {} };
    var P = { x: 0, y: 0, path: [], wait: 1.5, face: 1, sx: 0, sy: 0 };

    function poly(pts, fill, stroke, lw) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }
    /* pavé de z0 à z0+h */
    function bx(f, x, y, w, d, z0, h, c, edge) {
      var top = [scr(f, x, y, z0 + h), scr(f, x + w, y, z0 + h), scr(f, x + w, y + d, z0 + h), scr(f, x, y + d, z0 + h)];
      poly([scr(f, x, y + d, z0 + h), scr(f, x + w, y + d, z0 + h), scr(f, x + w, y + d, z0), scr(f, x, y + d, z0)], shade(c, -0.22), edge ? "rgba(0,0,0,.35)" : null);
      poly([scr(f, x + w, y, z0 + h), scr(f, x + w, y + d, z0 + h), scr(f, x + w, y + d, z0), scr(f, x + w, y, z0)], shade(c, -0.42), edge ? "rgba(0,0,0,.35)" : null);
      poly(top, shade(c, 0.08), edge ? "rgba(0,0,0,.25)" : null);
    }
    function glow(f, x, y, z, rad, col, a) { var p = scr(f, x, y, z), r = rad * f.s, g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0)); ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); }
    /* transformation plan mur (u en cases, v en px vers le haut) */
    function wallT(f, side) { var o = scr(f, 0, 0, 0), k = f.s; if (side === "R") ctx.setTransform(TW / 2 * k, TH / 2 * k, 0, -k, o[0], o[1]); else ctx.setTransform(-TW / 2 * k, TH / 2 * k, 0, -k, o[0], o[1]); }
    function floorT(f) { var o = scr(f, 0, 0, 0), k = f.s; ctx.setTransform(TW / 2 * k, TH / 2 * k, -TW / 2 * k, TH / 2 * k, o[0], o[1]); }
    function reset() { ctx.setTransform(1, 0, 0, 1, 0, 0); }

    function drawWall(f, side, st, light) {
      var n = f.n, c = WALLS[st].c; wallT(f, side); ctx.fillStyle = c; ctx.fillRect(0, 0, n, WALL);
      var i, j;
      if (st === 0) { ctx.fillStyle = "rgba(255,255,255,.035)"; for (i = 0; i < n * 2; i++) ctx.fillRect(i * 0.5, 0, 0.012, WALL); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(0, 0, n, 16); }
      else if (st === 1) { for (j = 0; j < WALL / 12; j++) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(0, j * 12, n, 1.3); for (i = 0; i < n * 3; i++) { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(i / 3 + (j % 2 ? 0.17 : 0), j * 12, 0.012, 12); } } ctx.fillStyle = "rgba(255,160,90,.05)"; ctx.fillRect(0, 60, n, 30); }
      else if (st === 2) { for (i = 0; i < n * 4; i++) { ctx.fillStyle = i % 2 ? "rgba(0,0,0,.12)" : "rgba(255,200,140,.05)"; ctx.fillRect(i / 4, 0, 0.25, WALL); } ctx.fillStyle = "#c8a45e"; ctx.fillRect(0, 54, n, 3); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, n, 12); }
      else { ctx.strokeStyle = "rgba(200,164,94,.22)"; ctx.lineWidth = 0.6 / TW * 2; for (i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo((i * 0.9 + (side === "R" ? 0.1 : 0.5)) % n, 0); ctx.lineTo(((i * 0.9 + 1.4) % n), WALL); ctx.stroke(); } ctx.fillStyle = "#c8a45e"; ctx.fillRect(0, 0, n, 4); ctx.fillRect(0, WALL - 6, n, 3); }
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, n, 6);          /* plinthe */
      if (side === "R") {
        /* fenêtre sur la ville la nuit */
        var wu = n * 0.28, ww = Math.min(2.4, n * 0.3); ctx.fillStyle = "#0a1020"; ctx.fillRect(wu, 52, ww, 70); ctx.fillStyle = "#16203a"; ctx.fillRect(wu, 52, ww, 30);
        for (i = 0; i < 9; i++) { var bh = 14 + ((i * 37) % 26), bw = ww / 9; ctx.fillStyle = "#070b14"; ctx.fillRect(wu + i * bw, 52, bw * 0.92, bh); ctx.fillStyle = "#f6e3a8"; if ((i * 5) % 3) ctx.fillRect(wu + i * bw + bw * 0.25, 52 + bh * 0.5, bw * 0.2, 2.5); }
        ctx.strokeStyle = shade(c, 0.3); ctx.lineWidth = 2.2 / TW * 2; ctx.strokeRect(wu, 52, ww, 70); ctx.beginPath(); ctx.moveTo(wu + ww / 2, 52); ctx.lineTo(wu + ww / 2, 122); ctx.stroke();
        /* rideaux, appui de fenêtre et reflet lunaire (décor de base) */
        if (!BL_baseOff()) { var cw = 0.34; ctx.fillStyle = "#4a1a24"; ctx.fillRect(wu - cw * 0.55, 46, cw, 82); ctx.fillRect(wu + ww - cw * 0.45, 46, cw, 82); ctx.fillStyle = "rgba(0,0,0,.28)"; for (i = 0; i < 4; i++) { ctx.fillRect(wu - cw * 0.55 + i * cw / 4, 46, 0.018, 82); ctx.fillRect(wu + ww - cw * 0.45 + i * cw / 4, 46, 0.018, 82); } ctx.fillStyle = "#c8a45e"; ctx.fillRect(wu - cw, 126, ww + cw * 2, 2.4); ctx.fillStyle = shade(c, 0.18); ctx.fillRect(wu - 0.1, 48, ww + 0.2, 3); }
        /* porte */
        var a = n - 2.3, b = 1.1; ctx.fillStyle = "#1a1410"; ctx.fillRect(a, 0, b, 112); ctx.fillStyle = "#2a2018"; ctx.fillRect(a + 0.07, 4, b - 0.14, 104); ctx.fillStyle = "#c8a45e"; ctx.fillRect(a + b - 0.22, 52, 0.07, 8);
        ctx.fillStyle = "rgba(246,227,168," + (0.55 + 0.2 * Math.sin(R.t * 2)) + ")"; ctx.fillRect(a + 0.15, 116, b - 0.3, 14);
      }
      reset();
    }
    function drawFloor(f, st) {
      var n = f.n, i, j; floorT(f);
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        if (st === 0) ctx.fillStyle = (i + j) % 2 ? "#292d34" : "#2d3139";
        else if (st === 1) ctx.fillStyle = (i % 2 ? "#6b4a30" : "#7a5638");
        else if (st === 2) ctx.fillStyle = (i + j) % 2 ? "#14161b" : "#d6d1c4";
        else ctx.fillStyle = (i + j) % 2 ? "#1d1a12" : "#26221a";
        ctx.fillRect(i, j, 1.01, 1.01);
        if (st === 1) { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(i, j, 1, 0.04); ctx.fillStyle = "rgba(255,230,190,.05)"; ctx.fillRect(i, j + 0.3, 1, 0.3); }
        if (st === 3) { ctx.strokeStyle = "rgba(200,164,94," + (0.2 + ((i * 7 + j * 3) % 5) * 0.04) + ")"; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(i + 0.1, j + 0.9); ctx.lineTo(i + 0.9, j + 0.1); ctx.stroke(); }
      }
      ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 0.025; ctx.beginPath(); for (i = 0; i <= n; i++) { ctx.moveTo(i, 0); ctx.lineTo(i, n); ctx.moveTo(0, i); ctx.lineTo(n, i); } ctx.stroke();
      reset();
    }

    /* ---------- objets ---------- */
    function drawShape(f, it, d, alpha) {
      var b = itemBox(it), x = b.x, y = b.y, w = b.w, dd = b.d, h = d.h, c = d.color, r = it.r, k = d.shape, i, p, q;
      if (alpha !== undefined) ctx.globalAlpha = alpha;
      if (k === "rug") { floorT(f); ctx.fillStyle = c; ctx.fillRect(x + 0.08, y + 0.08, w - 0.16, dd - 0.16); ctx.strokeStyle = "#c8a45e"; ctx.lineWidth = 0.05; ctx.strokeRect(x + 0.2, y + 0.2, w - 0.4, dd - 0.4); ctx.fillStyle = "rgba(200,164,94,.5)"; ctx.fillRect(x + w / 2 - 0.15, y + dd / 2 - 0.15, 0.3, 0.3); reset(); }
      else if (k === "sofa") { bx(f, x, y, w, dd, 0, h * 0.55, c, 1); if (!r) bx(f, x, y, w, 0.28, 0, h, c, 1); else bx(f, x, y, 0.28, dd, 0, h, c, 1); }
      else if (k === "desk") { bx(f, x, y, w, dd, 0, h, c, 1); bx(f, x + 0.08, y + 0.08, w - 0.16, dd - 0.16, h, 1.5, "#7a5a3a", 0); p = scr(f, x + w * 0.5, y + dd * 0.5, h + 2); ctx.fillStyle = "#c8a45e"; ctx.fillRect(p[0] - 4 * f.s, p[1] - 2 * f.s, 8 * f.s, 3 * f.s); }
      else if (k === "shelf") { bx(f, x, y, w, dd, 0, h, c, 1); for (i = 0; i < 4; i++) { var zz = 6 + i * 8; q = r ? scr(f, x + w, y + dd * 0.5, zz) : scr(f, x + w * 0.5, y + dd, zz); ctx.fillStyle = ["#7a2f2f", "#c8a45e", "#2f4a7a", "#3a6a4a"][i]; ctx.fillRect(q[0] - (w + dd) * 9 * f.s, q[1], (w + dd) * 18 * f.s, 4 * f.s); } }
      else if (k === "easel") { var cx2 = x + w / 2, cy2 = y + dd / 2; bx(f, cx2 - 0.38, cy2 - 0.04, 0.08, 0.08, 0, h * 0.5, "#3a2c24", 0); bx(f, cx2 + 0.3, cy2 - 0.04, 0.08, 0.08, 0, h * 0.5, "#3a2c24", 0); bx(f, cx2 - 0.4, cy2 - 0.06, 0.8, 0.12, h * 0.42, h * 0.58, "#c8a45e", 1); poly([scr(f, cx2 - 0.34, cy2 + 0.06, h * 0.98), scr(f, cx2 + 0.34, cy2 + 0.06, h * 0.98), scr(f, cx2 + 0.34, cy2 + 0.06, h * 0.46), scr(f, cx2 - 0.34, cy2 + 0.06, h * 0.46)], c); poly([scr(f, cx2 - 0.34, cy2 + 0.06, h * 0.7), scr(f, cx2 + 0.1, cy2 + 0.06, h * 0.9), scr(f, cx2 + 0.34, cy2 + 0.06, h * 0.6), scr(f, cx2 - 0.1, cy2 + 0.06, h * 0.46)], shade(c, 0.35)); }
      else if (k === "safe") { bx(f, x + 0.05, y + 0.05, w - 0.1, dd - 0.1, 0, h, c, 1); p = r ? scr(f, x + w - 0.05, y + dd / 2, h * 0.55) : scr(f, x + w / 2, y + dd - 0.05, h * 0.55); ctx.fillStyle = "#c8a45e"; ctx.beginPath(); ctx.arc(p[0], p[1], 4 * f.s, 0, 6.3); ctx.fill(); ctx.fillStyle = "#14171c"; ctx.fillRect(p[0] - 1 * f.s, p[1] - 4 * f.s, 2 * f.s, 4 * f.s); }
      else if (k === "trophy") { bx(f, x + 0.25, y + 0.25, w - 0.5, dd - 0.5, 0, 6, "#2a2f38", 1); p = scr(f, x + w / 2, y + dd / 2, 8); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(p[0] - 7 * f.s, p[1] - 10 * f.s); ctx.lineTo(p[0] + 7 * f.s, p[1] - 10 * f.s); ctx.lineTo(p[0] + 3 * f.s, p[1]); ctx.lineTo(p[0] - 3 * f.s, p[1]); ctx.fill(); ctx.fillRect(p[0] - 1.5 * f.s, p[1], 3 * f.s, 5 * f.s); glow(f, x + w / 2, y + dd / 2, 16, 26, "rgba(246,227,168,A)", 0.25); }
      else if (k === "statue") { bx(f, x + 0.2, y + 0.2, w - 0.4, dd - 0.4, 0, 10, "#8a8f99", 1); p = scr(f, x + w / 2, y + dd / 2, 10); ctx.fillStyle = c; ctx.fillRect(p[0] - 6 * f.s, p[1] - 18 * f.s, 12 * f.s, 18 * f.s); ctx.beginPath(); ctx.arc(p[0], p[1] - 24 * f.s, 6 * f.s, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(p[0] + 1 * f.s, p[1] - 18 * f.s, 5 * f.s, 18 * f.s); }
      else if (k === "globe") { bx(f, x + 0.3, y + 0.3, w - 0.6, dd - 0.6, 0, 8, "#3a2c24", 1); p = scr(f, x + w / 2, y + dd / 2, 15); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], 8 * f.s, 0, 6.3); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = f.s; ctx.beginPath(); ctx.ellipse(p[0], p[1], 8 * f.s, 3 * f.s, 0, 0, 6.3); ctx.stroke(); }
      else if (k === "ingot") { for (i = 0; i < 3; i++) bx(f, x + 0.15 + i * 0.02, y + 0.15, w - 0.3 - i * 0.1, dd - 0.3, i * 7, 7, c, 1); glow(f, x + w / 2, y + dd / 2, 14, 34, "rgba(255,220,120,A)", 0.3 + 0.1 * Math.sin(R.t * 3)); }
      else if (k === "throne") { bx(f, x, y, w, dd, 0, 14, c, 1); if (!r) bx(f, x, y, w, 0.3, 0, h, c, 1); else bx(f, x, y, 0.3, dd, 0, h, c, 1); p = scr(f, x + (r ? 0.15 : w / 2), y + (r ? dd / 2 : 0.15), h + 3); ctx.fillStyle = "#e8cd8a"; ctx.fillRect(p[0] - 9 * f.s, p[1] - 2 * f.s, 18 * f.s, 3 * f.s); }
      else if (k === "neon") { var fl = 0.8 + 0.2 * Math.sin(R.t * 9 + x * 3) * (Math.sin(R.t * 1.3 + y) > 0.92 ? 0.2 : 1); bx(f, x + 0.35, y + 0.35, w - 0.7, dd - 0.7, 0, 3, "#14171c", 1); p = scr(f, x + w / 2, y + dd / 2, 4); ctx.strokeStyle = shade(c, 0.1); ctx.lineWidth = 4 * f.s; ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * fl; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - h * f.s); ctx.stroke(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; glow(f, x + w / 2, y + dd / 2, h * 0.6, 70, c.length === 7 ? "rgba(" + rgb(c).join(",") + ",A)" : "rgba(255,80,110,A)", 0.4 * fl); }
      else if (k === "lamp") { bx(f, x + 0.35, y + 0.35, w - 0.7, dd - 0.7, 0, 3, "#14171c", 1); p = scr(f, x + w / 2, y + dd / 2, 3); q = scr(f, x + w / 2, y + dd / 2, h); ctx.strokeStyle = "#8a8f99"; ctx.lineWidth = 2 * f.s; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(q[0], q[1], 5 * f.s, 0, 6.3); ctx.fill(); glow(f, x + w / 2, y + dd / 2, h, 90, "rgba(246,227,168,A)", 0.5 + 0.06 * Math.sin(R.t * 11 + x)); }
      else if (k === "aquarium") { bx(f, x, y, w, dd, 0, 6, "#2a303a", 1); bx(f, x + 0.06, y + 0.06, w - 0.12, dd - 0.12, 6, h - 6, "#9ad8f0", 0); ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.55; bx(f, x + 0.1, y + 0.1, w - 0.2, dd - 0.2, 7, h - 9, c, 0); ctx.globalAlpha = alpha === undefined ? 1 : alpha; for (i = 0; i < 3; i++) { p = scr(f, x + w * (0.25 + i * 0.25) + Math.sin(R.t * 0.8 + i * 2) * 0.12, y + dd / 2, 12 + i * 4); ctx.fillStyle = ["#ff9d4d", "#ffd24d", "#ff6a8a"][i]; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3 * f.s, 1.6 * f.s, 0, 0, 6.3); ctx.fill(); } bx(f, x, y, w, dd, h - 1.5, 1.5, "#14171c", 1); glow(f, x + w / 2, y + dd / 2, h * 0.6, 26 + w * 8, "rgba(120,210,240,A)", 0.22); }
      else if (k === "fire") { bx(f, x, y, w, dd, 0, h, c, 1); p = r ? scr(f, x + w - 0.04, y + dd / 2, h * 0.3) : scr(f, x + w / 2, y + dd - 0.04, h * 0.3); ctx.fillStyle = "#14110d"; ctx.fillRect(p[0] - 8 * f.s * Math.max(1, w - 0.5), p[1] - 8 * f.s, 16 * f.s * Math.max(1, w - 0.5), 14 * f.s); for (i = 0; i < 3; i++) { var fl2 = 0.7 + 0.3 * Math.sin(R.t * 7 + i * 2.1); ctx.fillStyle = i === 1 ? "#ffd24d" : "#ff7a2f"; ctx.beginPath(); ctx.ellipse(p[0] + (i - 1) * 5 * f.s, p[1] + 3 * f.s, 2.6 * f.s, 7 * f.s * fl2, 0, 0, 6.3); ctx.fill(); } glow(f, x + w / 2, y + dd / 2, h * 0.3, 60, "rgba(255,150,60,A)", 0.28 + 0.08 * Math.sin(R.t * 6)); }
      else if (k === "slot") { bx(f, x + 0.12, y + 0.12, w - 0.24, dd - 0.24, 0, h, c, 1); p = r ? scr(f, x + w - 0.12, y + dd / 2, h * 0.62) : scr(f, x + w / 2, y + dd - 0.12, h * 0.62); ctx.fillStyle = "#0c0e12"; ctx.fillRect(p[0] - 7 * f.s, p[1] - 6 * f.s, 14 * f.s, 9 * f.s); for (i = 0; i < 3; i++) { ctx.fillStyle = ["#ffd24d", "#ff4d6d", "#f1ecde"][(i + Math.floor(R.t * 3)) % 3]; ctx.fillRect(p[0] - 6 * f.s + i * 4.4 * f.s, p[1] - 4.5 * f.s, 3.4 * f.s, 6 * f.s); } glow(f, x + w / 2, y + dd / 2, h * 0.65, 30, "rgba(255,210,80,A)", 0.18 + 0.1 * Math.sin(R.t * 5)); }
      else if (k === "clock") { bx(f, x + 0.22, y + 0.22, w - 0.44, dd - 0.44, 0, h, c, 1); p = r ? scr(f, x + w - 0.22, y + dd / 2, h * 0.78) : scr(f, x + w / 2, y + dd - 0.22, h * 0.78); ctx.fillStyle = "#f1ecde"; ctx.beginPath(); ctx.arc(p[0], p[1], 6 * f.s, 0, 6.3); ctx.fill(); ctx.strokeStyle = "#14110d"; ctx.lineWidth = 1.1 * f.s; var ca = R.t * 0.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(ca) * 4.5 * f.s, p[1] + Math.sin(ca) * 4.5 * f.s); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(ca / 12) * 3 * f.s, p[1] + Math.sin(ca / 12) * 3 * f.s); ctx.stroke(); ctx.fillStyle = "#c8a45e"; p = r ? scr(f, x + w - 0.22, y + dd / 2, h * 0.3) : scr(f, x + w / 2, y + dd - 0.22, h * 0.3); ctx.fillRect(p[0] - 1.2 * f.s, p[1] - 6 * f.s + Math.sin(R.t * 3) * 2 * f.s, 2.4 * f.s, 9 * f.s); }
      else if (k === "maptable") { bx(f, x + 0.1, y + 0.1, w - 0.2, dd - 0.2, 0, h, "#2a2a30", 1); var hol = c === "#4ad8e8"; bx(f, x + 0.2, y + 0.2, w - 0.4, dd - 0.4, h, 1, hol ? "#0c3a44" : "#d8cfae", 0); for (i = 0; i < 4; i++) { p = scr(f, x + w * (0.25 + 0.17 * i), y + dd * (0.3 + 0.13 * ((i * 3) % 4)), h + 1.5); ctx.fillStyle = hol ? "#4ad8e8" : ["#a8262e", "#2f6a8a", "#c8a45e", "#3a6a4a"][i]; ctx.beginPath(); ctx.arc(p[0], p[1] - (hol ? 3 + 2 * Math.sin(R.t * 2 + i) : 0) * f.s, 2 * f.s, 0, 6.3); ctx.fill(); } if (hol) glow(f, x + w / 2, y + dd / 2, h + 6, 46, "rgba(74,216,232,A)", 0.3); }
      else if (k === "cashcount") { bx(f, x, y, w, dd, 0, h, "#2a303a", 1); bx(f, x + 0.06, y + 0.06, w - 0.12, dd - 0.12, h, 1, "#14171c", 0); for (i = 0; i < 4; i++) { bx(f, x + 0.2 + i * (w - 0.5) / 4, y + 0.3, 0.2, 0.35, h + 1, 2 + (i % 3), c === "#c8a45e" ? "#e8cd8a" : "#6a8a5a", 1); } }
      else if (k === "fountain") { bx(f, x + 0.05, y + 0.05, w - 0.1, dd - 0.1, 0, 7, c === "#e8cd8a" ? "#c8a45e" : "#8a8f99", 1); bx(f, x + 0.2, y + 0.2, w - 0.4, dd - 0.4, 7, 1, "#4a9ab8", 0); bx(f, x + w / 2 - 0.1, y + dd / 2 - 0.1, 0.2, 0.2, 8, h - 8, c, 1); p = scr(f, x + w / 2, y + dd / 2, h); ctx.strokeStyle = "rgba(190,235,250,.8)"; ctx.lineWidth = 1.4 * f.s; for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] + (i - 1) * 9 * f.s, p[1] - (6 + 2 * Math.sin(R.t * 4 + i)) * f.s, p[0] + (i - 1) * 14 * f.s, p[1] + 10 * f.s); ctx.stroke(); } }
      else if (k === "plant") { bx(f, x + 0.3, y + 0.3, w - 0.6, dd - 0.6, 0, 7, "#5a3a2e", 1); p = scr(f, x + w / 2, y + dd / 2, 7); ctx.fillStyle = c; for (i = 0; i < 6; i++) { var an = i / 6 * 6.28 + 0.4, ln = h * (0.4 + (i % 2) * 0.25); ctx.beginPath(); ctx.ellipse(p[0] + Math.cos(an) * 7 * f.s, p[1] - ln * f.s * 0.55 - (i % 3) * 3 * f.s, 5 * f.s, ln * f.s * 0.5, Math.cos(an) * 0.5, 0, 6.3); ctx.fill(); } }
      else bx(f, x + 0.04, y + 0.04, w - 0.08, dd - 0.08, 0, h, c, 1);
      ctx.globalAlpha = 1;
    }
    function drawPlayer(f, t) {
      var p = scr(f, P.x + 0.5, P.y + 0.5, 0), bob = Math.sin(t * 3) * 1.2, s = f.s; ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(p[0], p[1], 9 * s, 4 * s, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#1c1f26"; ctx.fillRect(p[0] - 5 * s, p[1] - 14 * s + bob, 10 * s, 13 * s); ctx.fillStyle = "#c8a45e"; ctx.fillRect(p[0] - 5 * s, p[1] - 14 * s + bob, 10 * s, 3 * s); ctx.fillStyle = "#e0b894"; ctx.beginPath(); ctx.arc(p[0], p[1] - 19 * s + bob, 5 * s, 0, 6.3); ctx.fill(); ctx.fillStyle = "#14161b"; ctx.beginPath(); ctx.arc(p[0], p[1] - 21 * s + bob, 5.4 * s, Math.PI, 0); ctx.fill();
    }
    function updatePlayer(dt, s, items) {
      var n = BL.hq.size(s), occ = {}; items.forEach(function (it) { var b = itemBox(it); if (BL.hq.dec(it.id).shape === "rug") return; for (var i = 0; i < b.w; i++) for (var j = 0; j < b.d; j++) occ[(b.x + i) + "," + (b.y + j)] = 1; });
      if (P.x >= n || P.y >= n || occ[P.x + "," + P.y]) { P.x = n - 1; P.y = 0; P.path = []; while (occ[P.x + "," + P.y] && P.y < n - 1) P.y++; }
      if (P.path.length) { var nx = P.path[0]; if (occ[nx[0] + "," + nx[1]]) { P.path = []; return; } P.sx = (P.sx || 0) + dt * 2.2; if (P.sx >= 1) { P.x = nx[0]; P.y = nx[1]; P.path.shift(); P.sx = 0; } }
      else { P.wait -= dt; if (P.wait <= 0) { P.wait = 3 + Math.random() * 5; var tx = Math.floor(Math.random() * n), ty = Math.floor(Math.random() * n); if (!occ[tx + "," + ty]) P.path = bfs(n, occ, P.x, P.y, tx, ty); } }
    }
    function bfs(n, occ, sx, sy, tx, ty) {
      var q = [[sx, sy]], prev = {}, k0 = sx + "," + sy; prev[k0] = null; var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (q.length) { var c = q.shift(); if (c[0] === tx && c[1] === ty) break; dirs.forEach(function (d) { var a = c[0] + d[0], b = c[1] + d[1], k = a + "," + b; if (a < 0 || b < 0 || a >= n || b >= n || occ[k] || k in prev) return; prev[k] = c; q.push([a, b]); }); }
      var tk = tx + "," + ty; if (!(tk in prev)) return []; var path = [], cur = [tx, ty]; while (cur && !(cur[0] === sx && cur[1] === sy)) { path.unshift(cur); cur = prev[cur[0] + "," + cur[1]]; } return path.slice(0, 40);
    }

    /* ---------- éclairage : voile sombre percé de lumières ---------- */
    function lights(f, s, items, ghost) {
      var n = f.n, L = [], lv = s.hq.light, fl = 1 + 0.03 * Math.sin(R.t * 13) + (lv === 0 && Math.sin(R.t * 1.7) > 0.96 ? -0.25 : 0);
      if (lv === 0) L.push([n / 2, n / 2, 90, n * 70 * fl, "rgba(255,235,190,A)", 0.4]);
      if (lv === 1) { L.push([0.1, n * 0.3, 90, n * 50, "rgba(255,190,110,A)", 0.45]); L.push([0.1, n * 0.7, 90, n * 50, "rgba(255,190,110,A)", 0.45]); L.push([n * 0.4, 0.1, 90, n * 50, "rgba(255,190,110,A)", 0.4]); L.push([n * 0.7, 0.1, 90, n * 44, "rgba(255,190,110,A)", 0.4]); }
      if (lv >= 2) { [0.25, 0.5, 0.75].forEach(function (k) { L.push([n * k, n * (0.3 + (k === 0.5 ? 0.35 : 0.1)), 10, n * 46, "rgba(255,240,210,A)", 0.45]); }); }
      if (lv >= 3) { L.push([n / 2, n / 2, 130, n * 90, "rgba(255,225,150,A)", 0.5]); L.push([n * 0.1, n * 0.5, 100, n * 60, "rgba(255,70,120,A)", 0.3]); L.push([n * 0.5, n * 0.1, 100, n * 60, "rgba(70,200,255,A)", 0.3]); }
      items.forEach(function (it) { var d = BL.hq.dec(it.id), b = itemBox(it); if (d.shape === "lamp") L.push([b.x + b.w / 2, b.y + b.d / 2, d.h, 120, "rgba(255,232,170,A)", 0.5]); if (d.shape === "neon") L.push([b.x + b.w / 2, b.y + b.d / 2, d.h * 0.6, 110, "rgba(" + rgb(d.color).join(",") + ",A)", 0.35]); if (d.shape === "ingot" || d.shape === "trophy") L.push([b.x + b.w / 2, b.y + b.d / 2, 14, 60, "rgba(255,220,130,A)", 0.3]); });
      return L;
    }
    function drawLight(f, s, items) {
      var w = f.vw, h = f.vh, L = lights(f, s, items), o = R.off; if (!o || o.width !== w || o.height !== h) { o = R.off = (ctx.canvas.ownerDocument || document).createElement("canvas"); o.width = w; o.height = h; }
      var c = o.getContext("2d"); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, w, h); c.fillStyle = "rgba(4,5,9," + DARK[s.hq.light] + ")"; c.fillRect(0, 0, w, h); c.globalCompositeOperation = "destination-out";
      L.forEach(function (l) { var p = scr(f, l[0], l[1], l[2]), r = l[3] * f.s, g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, "rgba(0,0,0,.95)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); });
      ctx.drawImage(o, 0, 0);
      ctx.globalCompositeOperation = "lighter"; L.forEach(function (l) { var p = scr(f, l[0], l[1], l[2]), r = l[3] * 0.9 * f.s, g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, l[4].replace("A", l[5] * 0.35)); g.addColorStop(1, l[4].replace("A", 0)); ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); }); ctx.globalCompositeOperation = "source-over";
      if (s.hq.light >= 3) { [[0, 0.5, "#ff4d6d"], [0.5, 0, "#4dc8ff"]].forEach(function (nn) { var a = nn[0] ? scr(f, 0.3, 0.02, 138) : scr(f, 0.02, 0.3, 138), b2 = nn[0] ? scr(f, f.n - 0.3, 0.02, 138) : scr(f, 0.02, f.n - 0.3, 138); ctx.strokeStyle = nn[2]; ctx.lineWidth = 3 * f.s; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(R.t * 4); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); ctx.globalAlpha = 1; }); }
    }
    function drawVault(f, s) {
      var n = f.n, g = s.gold || 0, cap = BL.gold.capacity(s); wallT(f, "L"); var u = n * 0.5 - 0.9, wd = 1.8;
      ctx.fillStyle = "#14171c"; ctx.fillRect(u - 0.08, 30, wd + 0.16, 94); ctx.fillStyle = "#3a4250"; ctx.fillRect(u, 36, wd, 82); ctx.fillStyle = "#2a303a"; ctx.fillRect(u + 0.1, 44, wd - 0.2, 66);
      ctx.fillStyle = "#c8a45e"; ctx.fillRect(u + wd * 0.5 - 0.06, 70, 0.12, 12); ctx.fillStyle = "#14171c"; ctx.beginPath(); ctx.arc(u + wd * 0.5, 76, 0.2, 0, 6.3); ctx.fill();
      var cnt = g <= 0 ? 0 : Math.max(1, Math.round(g / cap * 8)); for (var i = 0; i < cnt; i++) { ctx.fillStyle = i % 2 ? "#c8a45e" : "#e8cd8a"; ctx.fillRect(u + 0.18 + (i % 4) * 0.36, 48 + Math.floor(i / 4) * 7, 0.32, 5.5); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); var p = scr(f, 0, n * 0.5, 126); ctx.fillStyle = "#e8cd8a"; ctx.font = "700 " + Math.round(13 * f.s + 2) + "px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(g + " / " + cap, p[0], p[1] - 2);
    }
    /* reflet bleuté de la fenêtre sur le sol : un seul dégradé, pas de filtre */
    function moonPatch(f) {
      var n = f.n, wu = n * 0.28, ww = Math.min(2.4, n * 0.3), a = scr(f, wu, 0, 0), b = scr(f, wu + ww, 0, 0), c = scr(f, wu + ww + 1.6, n * 0.55, 0), d = scr(f, wu + 1.6, n * 0.55, 0);
      var g = ctx.createLinearGradient(a[0], a[1], c[0], c[1]); g.addColorStop(0, "rgba(130,165,235,.20)"); g.addColorStop(1, "rgba(130,165,235,0)"); poly([a, b, c, d], g);
    }
    function dropShadow(f, it) { var b = itemBox(it), d = BL.hq.dec(it.id); if (d.shape === "rug") return; floorT(f); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(b.x + 0.02, b.y + 0.02, b.w + 0.12, b.d + 0.12); reset(); }

    /* s : état ; o : { sel, ghost:{id,x,y,r,ok}, hide:uid, f } */
    R.draw = function (s, o) {
      var f = o.f, items = s.hq.items.concat(BL.hq.baseItems ? BL.hq.baseItems(s) : []), n = f.n; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, f.vw, f.vh);
      if (!o.wall) { var bg = ctx.createLinearGradient(0, 0, 0, f.vh); bg.addColorStop(0, "#07090d"); bg.addColorStop(1, "#0d1016"); ctx.fillStyle = bg; ctx.fillRect(0, 0, f.vw, f.vh); }
      BL_cur = s; drawWall(f, "L", s.hq.walls, s.hq.light); drawWall(f, "R", s.hq.walls, s.hq.light); drawFloor(f, s.hq.floor); if (!s.hq.baseOff) moonPatch(f); drawVault(f, s);
      var tn = BL.hq.TINT && BL.hq.TINT[BL.hq.style(s)]; if (tn) { ctx.save(); ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = tn; ctx.fillRect(0, 0, f.vw, f.vh); ctx.restore(); }
      var list = items.filter(function (it) { return it.u !== o.hide; }).sort(function (a, b) { var A = itemBox(a), B = itemBox(b), ra = A.h <= 1 ? 0 : 1, rb = B.h <= 1 ? 0 : 1; return ra - rb || (A.x + A.w + A.y + A.d) - (B.x + B.w + B.y + B.d) || A.y - B.y; });
      list.forEach(function (it) { dropShadow(f, it); }); var pd = false, ps = scr(f, P.x, P.y, 0);
      list.forEach(function (it) { var b = itemBox(it); if (!pd && b.h > 1 && (b.x + b.w + b.y + b.d) > P.x + P.y + 2) { drawPlayer(f, R.t); pd = true; } drawShape(f, it, BL.hq.dec(it.id)); if (o.sel === it.u) { floorT(f); ctx.strokeStyle = "rgba(232,205,138," + (0.7 + 0.3 * Math.sin(R.t * 5)) + ")"; ctx.lineWidth = 0.07; ctx.strokeRect(b.x - 0.04, b.y - 0.04, b.w + 0.08, b.d + 0.08); reset(); } }); if (!pd) drawPlayer(f, R.t); void ps;
      if (o.ghost && BL.hq.dec(o.ghost.id)) { var g = o.ghost, gf = BL.hq.foot(g.id, g.r); floorT(f); ctx.fillStyle = g.ok ? "rgba(90,220,140,.35)" : "rgba(235,80,80,.38)"; ctx.fillRect(g.x, g.y, gf.w, gf.d); ctx.strokeStyle = g.ok ? "#6fe3a0" : "#ff6a6a"; ctx.lineWidth = 0.05; ctx.strokeRect(g.x, g.y, gf.w, gf.d); reset(); drawShape(f, { id: g.id, x: g.x, y: g.y, r: g.r }, BL.hq.dec(g.id), 0.7); }
      drawLight(f, s, items);
      if (o.hover === "vault" || o.hover === "door") { poly(o.hover === "vault" ? vaultPoly(f) : doorPoly(f), null, "rgba(232,205,138,.9)", 2); }
    };
    R.update = function (dt, s) { R.t += dt; updatePlayer(dt, s, s.hq.items.concat(BL.hq.baseItems ? BL.hq.baseItems(s) : [])); };
    /* vignette d'un objet : petit canvas mis en cache */
    R.thumb = function (id) {
      if (R.thumbs[id]) return R.thumbs[id]; var d = BL.hq.dec(id), doc = ctx.canvas.ownerDocument || document, c = doc.createElement("canvas"); c.width = 96; c.height = 80; var cc = c.getContext("2d"); if (!cc) return ""; var keep = ctx, t = R.t;
      ctx = cc; R.t = 0; var bw = d.w + d.d, f = { n: 4, s: Math.min(1.1, 150 / (bw * 32 + 30), 120 / (d.h + bw * 16 + 20)), ox: 48, oy: 52, vw: 96, vh: 80 }; f.ox = 48; f.oy = 70 - (d.w + d.d) * 8 * f.s; drawShape(f, { id: id, x: 0, y: 0, r: 0 }, d); ctx = keep; R.t = t; var url = c.toDataURL ? c.toDataURL() : ""; R.thumbs[id] = url; return url;
    };
    R.player = P; return R;
  }
  BL.room = { TW: TW, TH: TH, WALL: WALL, WALLS: WALLS, frame: frame, scr: scr, cellAt: cellAt, inPoly: inPoly, silhouette: silhouette, itemBox: itemBox, pick: pick, vaultPoly: vaultPoly, doorPoly: doorPoly, create: create };
})(typeof globalThis !== "undefined" ? globalThis : this);
