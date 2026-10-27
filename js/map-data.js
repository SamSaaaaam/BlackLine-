/* Modèle de la ville (pur, sans DOM) : grille de rues, cellules par quartier, terrains des activités, bâtiments de décor, graphe routier.
   Le même plan est toujours généré (graines fixes) : aucune donnée de ville n'est sauvegardée. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var CELL = 200, ROAD = 40, COLS = 12, ROWS = 18, W = COLS * CELL, H = ROWS * CELL, S = 3;           /* S : échelle entre la carte Territoires (800×520) et la ville */
  var BASE = { c0: 1, c1: 10, r0: 8, r1: 14 }, LINK_ROW = 7, DIST_ROWS = 7, OLD_R1 = 12, SOUTH = 15;   /* Partie 19 · F : QG agrandi (rangées 13-14, terrains des nouvelles activités) et rive sud (rangées 15-17, nouveaux quartiers). COLS ne change jamais : le numéro de cellule r × COLS + c est sauvegardé (démolitions) */                               /* quartier général au sud, avenue de liaison, quartiers au nord */
  var LOTS = { perActivity: 4, thresholds: [1, 5, 10, 15] };                                              /* niveau d'activité nécessaire pour construire le terrain n */
  var PAL = {
    center: { wall: "#2b3340", roof: "#3a4452", h: [40, 110], acc: "#7ea6c9" }, industrial: { wall: "#2f2b2a", roof: "#403a37", h: [24, 46], acc: "#b9715f" },
    market: { wall: "#2e2a38", roof: "#403a52", h: [28, 66], acc: "#a58bd0" }, oldtown: { wall: "#3a2f2a", roof: "#4d3d35", h: [22, 46], acc: "#c8a45e" },
    port: { wall: "#23323a", roof: "#30444f", h: [16, 30], acc: "#6fb3c2" }, residential: { wall: "#2d3430", roof: "#3b463f", h: [16, 30], acc: "#86c39b" },
    business: { wall: "#242c3a", roof: "#33415a", h: [70, 190], acc: "#7ea6c9" }, prestige: { wall: "#33302a", roof: "#4a443a", h: [18, 38], acc: "#e3c680" },
    hq: { wall: "#2a2f38", roof: "#39404c", h: [24, 50], acc: "#c8a45e" },
    marina: { wall: "#22343e", roof: "#2e4856", h: [14, 34], acc: "#5fb0c8" }, franche: { wall: "#30302c", roof: "#42423a", h: [22, 52], acc: "#b9c7a0" }, faubourg: { wall: "#3a2a2a", roof: "#4f3634", h: [18, 40], acc: "#e0805a" }
  }, LOOK = { marina: "port", franche: "industrial", faubourg: "oldtown" };   /* architecture des quartiers du sud : celle de leur voisin */
  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(a, b, c) { var h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function inPoly(x, y, p) { var ins = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) ins = !ins; } return ins; }
  function isBase(c, r) { return c >= BASE.c0 && c <= BASE.c1 && r >= BASE.r0 && r <= BASE.r1; }
  function isLand(c, r) { if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false; return r < DIST_ROWS || r >= SOUTH || (r >= LINK_ROW && r <= BASE.r1 && c >= BASE.c0 && c <= BASE.c1); }
  function southOf(TD, c) { for (var i = 0; i < TD.districts.length; i++) { var q = TD.districts[i].city; if (q && c >= q.c0 && c <= q.c1) return TD.districts[i].id; } return "hq"; }

  function build() {
    var TD = BL.data.territory, acts = BL.data.activities, cells = [], grid = {}, c, r, i, polys = TD.districts.filter(function (d) { return !d.city; }).map(function (d) { return { id: d.id, poly: d.poly.map(function (p) { return [p[0] * S, p[1] * S]; }) }; });
    var cents = polys.map(function (p) { var sx = 0, sy = 0; p.poly.forEach(function (q) { sx += q[0]; sy += q[1]; }); return { id: p.id, x: sx / p.poly.length, y: sy / p.poly.length }; });
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var cell = { c: c, r: r, x: c * CELL + ROAD / 2, y: r * CELL + ROAD / 2, size: CELL - ROAD, land: isLand(c, r), district: null, kind: "decor", i: cells.length };
      if (cell.land) {
        if (r >= SOUTH) cell.district = southOf(TD, c);
        else if (r >= LINK_ROW) cell.district = "hq";
        else {
          var cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, found = null;
          polys.forEach(function (p) { if (!found && inPoly(cx, cy, p.poly)) found = p.id; });
          if (!found) { var best = 1e18; cents.forEach(function (k) { var d = (k.x - cx) * (k.x - cx) + (k.y - cy) * (k.y - cy); if (d < best) { best = d; found = k.id; } }); }
          cell.district = found;
        }
      }
      cells.push(cell); grid[c + "," + r] = cell;
    }
    /* quartier général : cellule centrale, puis terrains d'activités (du plus proche au plus lointain), puis décor */
    var hqCell = grid["5,9"]; hqCell.kind = "hq";
    var cand = cells.filter(function (k) { return isBase(k.c, k.r) && k !== hqCell && (k.c + k.r) % 2 === 0; })   /* damier : un terrain sur deux, les autres cellules deviennent parcs et places (bâtiments espacés) */.sort(function (a, b) { return (a.r > OLD_R1) - (b.r > OLD_R1) || (Math.abs(a.c - 5) * 1.0 + Math.abs(a.r - 9) * 1.3) - (Math.abs(b.c - 5) * 1.0 + Math.abs(b.r - 9) * 1.3) || a.c - b.c || a.r - b.r; });
    var lots = [], k = 0;
    acts.forEach(function (a, ai) { for (i = 0; i < LOTS.perActivity; i++) { var cl = cand[k++]; cl.kind = "lot"; lots.push({ id: a.id + "#" + i, act: a.id, idx: i, need: LOTS.thresholds[i], cell: cl.i, x: cl.x + 14, y: cl.y + 36, w: 132, d: 82, ai: ai }); } });
    /* emplacements de construction des quartiers : 4 cellules par quartier, espacées, tirées de façon déterministe (jamais sauvegardées) */
    var dplots = [], PL = 4;
    TD.districts.forEach(function (td) {
      var pool = cells.filter(function (q) { return q.land && q.district === td.id && q.kind === "decor"; }).sort(function (a, b) { return hash(a.c, a.r, 99) - hash(b.c, b.r, 99) || a.i - b.i; }), pick = [];
      pool.forEach(function (q) { if (pick.length >= PL) return; if (pick.every(function (o) { return Math.abs(o.c - q.c) + Math.abs(o.r - q.r) >= 2; })) pick.push(q); });
      pick.forEach(function (q, n) { q.kind = "dplot"; dplots.push({ id: td.id + "#" + n, did: td.id, idx: n, cell: q.i, x: q.x + 12, y: q.y + 18, w: 136, d: 104 }); });
    });
    /* décor par cellule */
    var buildings = [], districts = {};
    function dist(id) { return districts[id] || (districts[id] = { id: id, cells: [], x0: 1e9, y0: 1e9, x1: -1, y1: -1, cx: 0, cy: 0 }); }
    cells.forEach(function (cl) {
      if (!cl.land) return; var d = dist(cl.district); d.cells.push(cl.i); d.x0 = Math.min(d.x0, cl.x); d.y0 = Math.min(d.y0, cl.y); d.x1 = Math.max(d.x1, cl.x + cl.size); d.y1 = Math.max(d.y1, cl.y + cl.size);
      if (cl.kind === "lot" || cl.kind === "dplot") { cl.deco = "none"; return; }
      var rng = mulberry(cl.c * 131 + cl.r * 977 + 7), pal = PAL[cl.district] || PAL.hq, hx = [], T = rng(), lk = LOOK[cl.district] || cl.district;
      cl.deco = "none";
      if (cl.kind === "hq") return;
      if (cl.district === "hq" || (lk === "residential" && T < .3) || (lk === "prestige" && T < .35) || T < .08) { cl.deco = T < .5 ? "park" : "plaza"; return; }
      var type = lk === "business" || lk === "center" ? (T < .55 ? "single" : "quad") : lk === "oldtown" ? (T < .4 ? "quad" : "row") : lk === "port" ? (T < .6 ? "yard" : "single") : lk === "industrial" ? (T < .6 ? "single" : "row") : (T < .45 ? "quad" : T < .75 ? "row" : "single");
      var x = cl.x + 6, y = cl.y + 6, s = cl.size - 12, boxes = [];
      if (type === "single") boxes.push([x + 6, y + 14, s - 12, s - 28]);
      else if (type === "row") { boxes.push([x + 2, y + 10, s / 2 - 6, s - 20]); boxes.push([x + s / 2 + 4, y + 10, s / 2 - 6, s - 20]); }
      else if (type === "quad") { var q = s / 2 - 5; boxes.push([x, y, q, q], [x + q + 10, y, q, q], [x, y + q + 10, q, q], [x + q + 10, y + q + 10, q, q]); }
      else boxes.push([x + 4, y + 20, s - 8, s - 50]);
      boxes.forEach(function (b, n) {
        var h = pal.h[0] + rng() * (pal.h[1] - pal.h[0]); if (type === "yard") h = 14 + rng() * 8;
        buildings.push({ id: "d" + cl.i + "." + n, kind: "decor", type: type, district: cl.district, cell: cl.i, x: b[0], y: b[1], w: b[2], d: b[3], h: Math.round(h), wall: pal.wall, roof: pal.roof, acc: pal.acc, seed: cl.c * 53 + cl.r * 17 + n, chim: lk === "industrial" && rng() < .5 });
      });
    });
    dplots.forEach(function (pl) { buildings.push({ id: pl.id, kind: "dlot", dlot: pl, district: pl.did, cell: pl.cell, x: pl.x, y: pl.y, w: pl.w, d: pl.d, h: 60, seed: pl.idx * 13 + pl.cell }); });
    buildings.push({ id: "hq", kind: "hq", district: "hq", cell: hqCell.i, x: hqCell.x + 12, y: hqCell.y + 20, w: 136, d: 100, h: 52, wall: PAL.hq.wall, roof: PAL.hq.roof, acc: PAL.hq.acc, seed: 5 });
    lots.forEach(function (l) { buildings.push({ id: l.id, kind: "lot", lot: l, district: "hq", cell: l.cell, x: l.x, y: l.y, w: l.w, d: l.d, h: 40, seed: l.ai * 11 + l.idx }); });
    buildings.sort(function (a, b) { return (a.y + a.d) - (b.y + b.d) || a.x - b.x; });
    Object.keys(districts).forEach(function (id) { var d = districts[id]; d.cx = (d.x0 + d.x1) / 2; d.cy = (d.y0 + d.y1) / 2; });
    /* graphe routier : sommets = intersections, arêtes = segments de rue bordés d'au moins une cellule terrestre */
    var edges = [], NC = COLS + 1, nid = function (i, j) { return j * NC + i; };
    for (var j = 0; j <= ROWS; j++) for (i = 0; i <= COLS; i++) {
      if (i < COLS && (isLand(i, j - 1) || isLand(i, j))) edges.push({ a: nid(i, j), b: nid(i + 1, j), x1: i * CELL, y1: j * CELL, x2: (i + 1) * CELL, y2: j * CELL, cells: [[i, j - 1], [i, j]] });
      if (j < ROWS && (isLand(i - 1, j) || isLand(i, j))) edges.push({ a: nid(i, j), b: nid(i, j + 1), x1: i * CELL, y1: j * CELL, x2: i * CELL, y2: (j + 1) * CELL, cells: [[i - 1, j], [i, j]] });
    }
    edges.forEach(function (e, n) { e.i = n; e.cellIdx = e.cells.filter(function (p) { return isLand(p[0], p[1]); }).map(function (p) { return p[1] * COLS + p[0]; }); });
    var adj = {}; edges.forEach(function (e) { (adj[e.a] = adj[e.a] || []).push(e.i); (adj[e.b] = adj[e.b] || []).push(e.i); });
    return { cells: cells, grid: grid, lots: lots, dplots: dplots, buildings: buildings, districts: districts, edges: edges, adj: adj, hq: hqCell, W: W, H: H };
  }
  /* Partie 15 : un terrain libéré par démolition d'un parc / d'une place devient un emplacement de plus (jamais sauvegardé : recalculé depuis s.razed). */
  function applyRaze(model, razed, slotsOf) {
    var per = {}, done = model.razedDone = model.razedDone || {}, out = [];
    (razed || []).forEach(function (e) {
      var i = String(e).lastIndexOf(":"), did = e.slice(0, i), c = +e.slice(i + 1), cl = model.cells[c], n = per[did] = (per[did] || 0) + 1;
      if (done[e] || !cl || cl.district !== did || (cl.deco !== "park" && cl.deco !== "plaza")) return;
      var idx = slotsOf(did) - 0 + n - 1, pl = { id: did + "#" + idx, did: did, idx: idx, cell: cl.i, x: cl.x + 12, y: cl.y + 18, w: 136, d: 104, raised: true };
      cl.deco = "none"; cl.kind = "dplot"; done[e] = 1; model.dplots.push(pl); out.push(pl);
      model.buildings.push({ id: pl.id, kind: "dlot", dlot: pl, district: did, cell: cl.i, x: pl.x, y: pl.y, w: pl.w, d: pl.d, h: 60, seed: pl.idx * 13 + pl.cell });
    });
    return out;
  }
  var cache = null;
  if (BL.dbuild && BL.dbuild.setCells) BL.dbuild.setCells(function (did, c) { cache = cache || build(); var cl = cache.cells[c]; return !!cl && cl.district === did && (cl.deco === "park" || cl.deco === "plaza"); });
  BL.mapData = { applyRaze: applyRaze, SOUTH: SOUTH, LOOK: LOOK, CELL: CELL, ROAD: ROAD, COLS: COLS, ROWS: ROWS, W: W, H: H, LOTS: LOTS, PAL: PAL, BASE: BASE, LINK_ROW: LINK_ROW, build: build, mulberry: mulberry, hash: hash, inPoly: inPoly, isLand: isLand };
})(typeof globalThis !== "undefined" ? globalThis : this);
