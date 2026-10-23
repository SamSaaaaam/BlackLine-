/* Rendu Canvas de la ville en isométrie 2:1 (rues en diagonale, bâtiments à toit et façades).
   Le modèle (map-data.js) reste en coordonnées de sol (x, y) ; tout est projeté ici : sx = (x − y)/2, sy = (x + y)/4 − hauteur.
   update(dt, s, opts) : animations ; draw(ctx, cam, w, h, s, ui) : dessin ; hit(px, py, s) : élément sous un point projeté. */
(function (root) {
  var BL = root.BL = root.BL || {}, M, E, T, D, C;
  var KX = 0.5, KY = 0.25, cache = {};
  function rgb(h) { var c = cache[h]; if (c) return c; var m; if (h.charAt(0) === "#") { var n = parseInt(h.slice(1), 16); c = [n >> 16, n >> 8 & 255, n & 255]; } else { m = h.match(/\d+/g); c = [+m[0], +m[1], +m[2]]; } return (cache[h] = c); }
  function sh(h, k) { var key = h + "|" + k.toFixed(2); if (cache[key]) return cache[key]; var c = rgb(h); return (cache[key] = "rgb(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + ")"); }
  function ease(p) { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); }
  var KIND = {
    backroom: { wall: "#5a3047", roof: "#2c1d26", base: 34, step: 10 }, freight: { wall: "#46586c", roof: "#566a80", base: 28, step: 6 },
    fence: { wall: "#44605c", roof: "#52726d", base: 30, step: 8 }, estate: { wall: "#38455e", roof: "#4a5c80", base: 64, step: 22 }, holding: { wall: "#26505a", roof: "#34707c", base: 80, step: 28 }
  };
  var PEOPLE = ["#c8a45e", "#b9715f", "#7ea6c9", "#a58bd0", "#86c39b", "#d8d4c8", "#e08a6b"], CARS = ["#b9715f", "#7ea6c9", "#c8a45e", "#a58bd0", "#86c39b", "#d8d4c8", "#6b7280", "#d4574a"];

  function create(model, opts) {
    M = BL.mapData; E = BL.economy; T = BL.territory; D = BL.data; opts = opts || {};
    var OX = M.H * KX, OY = 280, B = { w: (M.W + M.H) * KX, h: (M.W + M.H) * KY + OY + 30 };
    function px(x, y) { return (x - y) * KX + OX; } function py(x, y, z) { return (x + y) * KY - (z || 0) + OY; }
    var R = { model: model, bounds: B, time: 0, rv: {}, cars: [], walkers: [], floaters: [], dust: [], ripples: [], anim: {}, built: null, seen: null, timers: {}, motion: true, money: opts.money || String };
    var spr = false, dk = 1, sprites = {}, rng = M.mulberry(99), lastActive = -1, activeEdges = [], statics = null, lampList = [], ctx, razedHide = {};
    Object.keys(model.districts).forEach(function (id) { R.rv[id] = id === "hq" ? 1 : 0; });

    function targetReveal(s, id) { if (id === "hq") return 1; var d = T.dist(id); if (!d) return 0; var st = T.state(s, d); return st === "controlled" || st === "contested" ? 1 : st === "available" ? 0.42 : 0; }
    function tierOf(L) { return E.designTier(L); }
    function lotH(l, L) { var k = KIND[l.act], t = tierOf(L); return k.base + Math.min(t, 5) * k.step + Math.max(0, Math.min(t, 9) - 5) * k.step * 0.45 + Math.max(0, t - 9) * k.step * 0.12; }   /* au-delà du palier 5 la hauteur croît moins : les paliers 6 à 9 changent surtout de forme et de détails */
    function hqSty(s) { return BL.hq && BL.venues ? BL.hq.style(s) : "classic"; }
    function hqH(s) { var st = hqSty(s); return st === "classic" ? 64 + Math.min(30, E.level(s)) : BL.venues.hqSpec(st).h; }
    function lum(d) { var r = R.rv[d]; return 0.38 + 0.62 * (r === undefined ? 1 : r); }
    function bh(b, s) { if (b.kind === "dlot") { var id = dlotType(s, b.dlot); return id ? dlotH(b.dlot, id) + 30 : 6; } if (b.kind === "lot") return lotH(b.lot, LV(s, b.lot)); if (b.kind === "hq") return hqH(s); return b.h * (0.6 + 0.4 * R.rv[b.district]); }
    function LV(s, l) { return E.bLevel(s, l.act, l.idx); }            /* niveau de CE bâtiment */
    function bt(s, l) { return l.idx < E.buildings(s, l.act); }
    function isBuilt(b, s) { return bt(s, b.lot); }
    function key(b) { return (b.x + b.w) + (b.y + b.d); }

    /* ---------- objets statiques triés (bâtiments, lampadaires, arbres) ---------- */
    function buildStatics() {
      var out = model.buildings.map(function (b) { return { k: key(b), t: "b", b: b }; });
      model.cells.forEach(function (cl) {
        if (!cl.land) return;
        [[cl.x + 3, cl.y + 3], [cl.x + cl.size - 3, cl.y + cl.size - 3]].forEach(function (p, n) { var o = { k: p[0] + p[1], t: "lamp", x: p[0], y: p[1], d: cl.district, seed: cl.i * 2 + n }; out.push(o); lampList.push(o); });
        if (cl.deco === "park") for (var t = 0; t < 7; t++) out.push({ k: 0, t: "tree", c: cl.i, x: cl.x + 26 + M.hash(cl.i, t, 1) * (cl.size - 52), y: cl.y + 26 + M.hash(cl.i, t, 2) * (cl.size - 52), d: cl.district, seed: cl.i * 7 + t, r: 11 + M.hash(cl.i, t, 3) * 7 });
        if (cl.deco === "plaza") out.push({ k: 0, t: "fountain", c: cl.i, x: cl.x + cl.size / 2, y: cl.y + cl.size / 2, d: cl.district });
      });
      out.forEach(function (o) { if (o.t === "tree" || o.t === "fountain") o.k = o.x + o.y; });
      out.sort(function (a, b) { return a.k - b.k; }); return out;
    }
    statics = buildStatics();
    /* Partie 15 : démolition ; model est modifié par M.applyRaze, on reconstruit la liste dessinée et on lance un nuage de poussière */
    R.applyRaze = function (razed, slotsOf) {
      var added = M.applyRaze(model, razed, slotsOf); if (!added.length) return false;
      lampList.length = 0; statics = buildStatics();
      if (R.built) added.forEach(function (pl) { R.anim[pl.id] = R.time; if (!R.low) for (var i = 0; i < 18; i++) R.dust.push({ x: pl.x + Math.random() * pl.w, y: pl.y + Math.random() * pl.d, z: 0, vz: 16 + Math.random() * 24, life: 1 }); });
      return true;
    };

    /* ---------- mise à jour ---------- */
    R.update = function (dt, s, o) {
      R.time += dt; R.motion = !!o.motion; R.low = !!o.low; var id, changed = false;
      for (id in R.rv) { var tg = targetReveal(s, id), d = tg - R.rv[id]; if (Math.abs(d) > 0.001) { R.rv[id] += Math.sign(d) * Math.min(Math.abs(d), dt * 0.7); changed = true; } }
      var now = {}; model.lots.forEach(function (l) { now[l.id] = bt(s, l); });
      if (R.built) model.lots.forEach(function (l) { if (now[l.id] && !R.built[l.id]) { R.anim[l.id] = R.time; if (!R.low) for (var i = 0; i < 16; i++) R.dust.push({ x: l.x + Math.random() * l.w, y: l.y + l.d + Math.random() * 10, z: 0, vz: 14 + Math.random() * 26, life: 1 }); } });
      R.built = now;
      var dn = {}; (model.dplots || []).forEach(function (pl) { dn[pl.id] = !!dlotType(s, pl); }); if (R.dbuilt) (model.dplots || []).forEach(function (pl) { if (dn[pl.id] && !R.dbuilt[pl.id]) { R.anim[pl.id] = R.time; if (!R.low) for (var i = 0; i < 14; i++) R.dust.push({ x: pl.x + Math.random() * pl.w, y: pl.y + pl.d + Math.random() * 10, z: 0, vz: 14 + Math.random() * 26, life: 1 }); } }); R.dbuilt = dn;
      model.lots.forEach(function (l) { var t = tierOf(LV(s, l)); if (R.seen && R.seen[l.id] !== undefined && t > R.seen[l.id] && LV(s, l) > 0) R.flash = { id: l.id, t: R.time }; (R.seen = R.seen || {})[l.id] = t; });
      if (R.motion) D.activities.forEach(function (a) {
        var n = s.owned[a.id] || 0; if (!n) return; R.timers[a.id] = (R.timers[a.id] || Math.random() * 2) - dt;
        if (R.timers[a.id] <= 0) { R.timers[a.id] = 2.2 + Math.random() * 1.2; var ls = model.lots.filter(function (l) { return l.act === a.id && bt(s, l); }); if (!ls.length) return; var l = ls[Math.floor(Math.random() * ls.length)], v = E.bldIncome(s, a, l.idx, LV(s, l)) * 2.5;
          if (v > 0) R.floaters.push({ x: l.x + l.w / 2, y: l.y + l.d / 2, z: lotH(l, LV(s, l)) + 8, t: 0, text: "+" + R.money(v) }); }
      });
      R.floaters = R.floaters.filter(function (f) { f.t += dt; return f.t < 2.2; });
      R.dust = R.dust.filter(function (p) { p.life -= dt * 0.9; p.z += p.vz * dt; return p.life > 0; });
      R.ripples = R.ripples.filter(function (r) { r.t += dt; return r.t < 0.7; });
      var act = 0; Object.keys(R.rv).forEach(function (k) { if (R.rv[k] > 0.95) act++; });
      if (act !== lastActive) { lastActive = act; activeEdges = model.edges.filter(function (e) { return e.cellIdx.some(function (i) { return (R.rv[model.cells[i].district] || 0) > 0.95; }); }).map(function (e) { return e.i; }); activeSet = {}; activeEdges.forEach(function (i) { activeSet[i] = 1; }); }
      var tr = R.motion && R.layers.traffic, hv = s && s.heat && typeof s.heat.v === "number" ? s.heat.v : 0, ht = hv >= 75 ? 3 : hv >= 50 ? 2 : hv >= 25 ? 1 : 0; R.heatTier = ht;
      var wantC = tr ? Math.min(R.low ? 8 : 34, 6 + act * 3) : 0, wantW = tr ? Math.min(R.low ? 8 : 44, 6 + act * 3) : 0;
      var wantP = tr && act > 0 ? [1, 2, 4, 6][ht] : 0, wantK = tr && act > 0 ? [0, 2, 4, 6][ht] : 0; if (R.low) { wantP = Math.min(wantP, 2); wantK = Math.min(wantK, 2); }
      function cnt(f) { var n = 0; R.cars.forEach(function (c) { if (f(c)) n++; }); return n; }
      function trim(f, want) { var n = cnt(f), i; while (n < want && activeEdges.length) { spawnCar(f === isPol ? "pol" : null); n++; } for (i = R.cars.length - 1; i >= 0 && n > want; i--) if (f(R.cars[i])) { R.cars.splice(i, 1); n--; } }
      function isCiv(c) { return !c.pol && !c.amb; } function isPol(c) { return !!c.pol; }
      trim(isCiv, wantC); trim(isPol, wantP);
      var nw = 0, nk = 0, wi; R.walkers.forEach(function (w) { if (w.cop) nk++; else nw++; });
      while (nw < wantW) { spawnWalker(false); nw++; } for (wi = R.walkers.length - 1; wi >= 0 && nw > wantW; wi--) if (!R.walkers[wi].cop) { R.walkers.splice(wi, 1); nw--; }
      while (nk < wantK) { spawnWalker(true); nk++; } for (wi = R.walkers.length - 1; wi >= 0 && nk > wantK; wi--) if (R.walkers[wi].cop) { R.walkers.splice(wi, 1); nk--; }
      if (tr && activeEdges.length) { R.ambT = (R.ambT === undefined ? 30 + rng() * 40 : R.ambT) - dt; if (R.ambT <= 0) { R.ambT = 70 + rng() * 80; if (!cnt(function (c) { return c.amb; })) spawnCar("amb"); } }
      R.cars.forEach(function (c) { advance(c, dt); }); R.cars = R.cars.filter(function (c) { return !c.amb || (c.life -= dt) > 0; }); R.walkers.forEach(function (w) { w.s += w.v * dt; });
      var bk = act + ":" + ht; if (R.blkKey !== bk) { R.blkKey = bk; R.blocks = []; var nb = ht >= 3 ? 4 : ht >= 2 ? 2 : 0; for (var q = 0; q < nb && activeEdges.length; q++) { var e2 = model.edges[activeEdges[Math.floor((q + 0.5) * activeEdges.length / nb)]]; R.blocks.push({ x: (e2.x1 + e2.x2) / 2, y: (e2.y1 + e2.y2) / 2, ph: q * 1.7 }); } }
      var night = R.atmos && R.atmos.t ? R.atmos.t.night : 0.5;
      if (tr && ht >= 3 && night > 0.5 && !R.low) { if (!R.heli) { R.heliT = (R.heliT === undefined ? 6 : R.heliT) - dt; if (R.heliT <= 0) { var mx = 0, my = 0; model.cells.forEach(function (c) { if (c.x + c.size > mx) mx = c.x + c.size; if (c.y + c.size > my) my = c.y + c.size; }); R.heli = { t: 0, dur: 26, x0: -60, y0: my * (0.2 + rng() * 0.6), x1: mx + 60, y1: my * (0.2 + rng() * 0.6) }; R.heliT = 40 + rng() * 40; } } else { R.heli.t += dt; if (R.heli.t > R.heli.dur) R.heli = null; } } else if (R.heli && !(tr && ht >= 3)) R.heli = null;
      return changed;
    };
    var activeSet = {};
    function spawnCar(kind) { var ei = activeEdges[Math.floor(rng() * activeEdges.length)], e = model.edges[ei]; R.cars.push({ e: ei, from: rng() < 0.5 ? e.a : e.b, t: rng(), v: kind === "pol" ? 70 + rng() * 40 : kind === "amb" ? 95 + rng() * 20 : 55 + rng() * 55, col: kind === "pol" ? "#e8ecf2" : kind === "amb" ? "#f4f4f4" : CARS[Math.floor(rng() * CARS.length)], pol: kind === "pol", amb: kind === "amb", life: kind === "amb" ? 28 : 0, ph: rng() * 6 }); }
    function spawnWalker(cop) {
      var cs = model.cells.filter(function (c) { return c.land && (R.rv[c.district] || 0) > 0.95; }); if (!cs.length) return; var c = cs[Math.floor(rng() * cs.length)];
      R.walkers.push({ cell: c.i, s: rng() * 4 * (c.size - 6), v: (rng() < 0.5 ? 1 : -1) * (cop ? 9 + rng() * 6 : 14 + rng() * 12), cop: !!cop, col: cop ? "#3a5ea8" : PEOPLE[Math.floor(rng() * PEOPLE.length)] });
    }
    function advance(c, dt) {
      var e = model.edges[c.e]; c.t += c.v * dt / M.CELL;
      if (c.t >= 1) { var node = c.from === e.a ? e.b : e.a, o = (model.adj[node] || []).filter(function (ei) { return ei !== c.e && activeSet[ei]; }); if (!o.length) o = (model.adj[node] || []).filter(function (ei) { return activeSet[ei]; });
        if (!o.length) { c.t = 0; return; } c.e = o[Math.floor(rng() * o.length)]; c.from = node; c.t -= 1; if (c.t > 1) c.t = 0; }
    }
    function carPos(c) { var e = model.edges[c.e], a = c.from === e.a ? [e.x1, e.y1, e.x2, e.y2] : [e.x2, e.y2, e.x1, e.y1], dx = Math.sign(a[2] - a[0]), dy = Math.sign(a[3] - a[1]); return { x: a[0] + (a[2] - a[0]) * c.t - dy * 8, y: a[1] + (a[3] - a[1]) * c.t + dx * 8, dx: dx, dy: dy }; }
    function walkPos(w) { var c = model.cells[w.cell], L = c.size - 6, s = ((w.s % (4 * L)) + 4 * L) % (4 * L), x0 = c.x + 3, y0 = c.y + 3, side = Math.floor(s / L), t = s - side * L; return side === 0 ? { x: x0 + t, y: y0 } : side === 1 ? { x: x0 + L, y: y0 + t } : side === 2 ? { x: x0 + L - t, y: y0 + L } : { x: x0, y: y0 + L - t }; }

    /* ---------- primitives de dessin ---------- */
    function poly(pts, fill, stroke, lw) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }
    function diamond(x, y, w, d, z, fill, stroke, lw) { poly([[px(x, y), py(x, y, z)], [px(x + w, y), py(x + w, y, z)], [px(x + w, y + d), py(x + w, y + d, z)], [px(x, y + d), py(x, y + d, z)]], fill, stroke, lw); }
    var glowCache = {};
    function glowSprite(col) { var g = glowCache[col]; if (g) return g; var c = document.createElement("canvas"); c.width = c.height = 64; var x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (glowCache[col] = c); }
    function glow(x, y, r, col, a, flat) { if (R.low) return; ctx.globalAlpha = Math.min(1, a * (R.decor.light === "lit_bloom" ? 1.7 : 1) * (atmosOn() ? 0.2 + 0.8 * R.atmos.t.night : 1)); ctx.drawImage(glowSprite(col), x - r, y - (flat ? r / 2 : r), r * 2, flat ? r : r * 2); ctx.globalAlpha = 1; }
    function onL(x, y, d, z0, fn) { ctx.save(); ctx.transform(KX, KY, 0, -1, px(x, y + d), py(x, y + d, z0)); fn(); ctx.restore(); }          /* face gauche : u le long de x, v vers le haut */
    function onR(x, y, w, d, z0, fn) { ctx.save(); ctx.transform(KX, -KY, 0, -1, px(x + w, y + d), py(x + w, y + d, z0)); fn(); ctx.restore(); }      /* face droite : u le long de −y */
    function onT(x, y, z, fn) { ctx.save(); ctx.transform(KX, KY, -KX, KY, px(x, y), py(x, y, z)); fn(); ctx.restore(); }                                    /* toit : u le long de x, v le long de y */
    function lit(seed, i, j) { return M.hash(seed + ((R.motion || spr) ? Math.floor(R.time / (16 + (seed % 7) * 4)) : 0), i, j); }
    function pulse(seed) { return R.motion ? 0.8 + 0.2 * Math.sin(R.time * 3 + seed) - (Math.sin(R.time * 0.9 + seed * 3) > 0.96 ? 0.5 : 0) : 1; }
    function shadow(x, y, w, d, h) { var o = Math.min(50, h * 0.5), A = [px(x + o * 0.9, y + o * 0.35), py(x + o * 0.9, y + o * 0.35, 0)], Bp = [px(x + w + o * 0.9, y + o * 0.35), py(x + w + o * 0.9, y + o * 0.35, 0)], Cc = [px(x + w + o * 0.9, y + d + o * 0.35), py(x + w + o * 0.9, y + d + o * 0.35, 0)], Dd = [px(x + o * 0.9, y + d + o * 0.35), py(x + o * 0.9, y + d + o * 0.35, 0)]; poly([A, Bp, Cc, Dd], "rgba(0,0,0,.22)"); }
    /* parallélépipède : toit + façade gauche + façade droite */
    function box(x, y, w, d, h, z0, col, roof, lm, o) {
      o = o || {}; if (!o.noShadow && z0 === 0) shadow(x, y, w, d, h); var tz = z0 + h;
      var N = [px(x, y), py(x, y, tz)], Ea = [px(x + w, y), py(x + w, y, tz)], S = [px(x + w, y + d), py(x + w, y + d, tz)], W = [px(x, y + d), py(x, y + d, tz)];
      poly([W, S, [S[0], S[1] + h], [W[0], W[1] + h]], sh(col, 1.0 * lm)); poly([S, Ea, [Ea[0], Ea[1] + h], [S[0], S[1] + h]], sh(col, 0.66 * lm)); poly([N, Ea, S, W], sh(roof || col, 1.18 * lm));
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W[0], W[1]); ctx.lineTo(S[0], S[1]); ctx.lineTo(Ea[0], Ea[1]); ctx.moveTo(S[0], S[1]); ctx.lineTo(S[0], S[1] + h); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.moveTo(W[0], W[1] + h); ctx.lineTo(S[0], S[1] + h); ctx.lineTo(Ea[0], Ea[1] + h); ctx.stroke();
    }
    function winGrid(face, x, y, w, d, z0, h, u0, u1, seed, color, dens, lm, z, rows0) {
      if (z < 0.4 || h < 22) return; var run = face === "L" ? w : d, cols = Math.max(1, Math.floor((Math.min(u1, run) - u0) / 15)), rows = Math.max(1, Math.floor((h - (rows0 || 14) - 8) / 17)), ou = u0 + (Math.min(u1, run) - u0 - cols * 15) / 2 + 3.5;
      (face === "L" ? onL : onR).call(null, x, y, face === "L" ? d : w, face === "L" ? z0 : d, face === "L" ? function () { grid(); } : z0, face === "L" ? undefined : function () { grid(); });
      function grid() { var r0 = rows0 || 14; ctx.beginPath(); for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) if (lit(seed, i, j + (face === "L" ? 0 : 50)) < dens * dk) ctx.rect(ou + i * 15, r0 + j * 17, 8, 10); ctx.fillStyle = color; ctx.globalAlpha = 0.92; ctx.fill();
        ctx.beginPath(); for (var j2 = 0; j2 < rows; j2++) for (var i2 = 0; i2 < cols; i2++) if (lit(seed, i2, j2 + (face === "L" ? 0 : 50)) >= dens * dk) ctx.rect(ou + i2 * 15, r0 + j2 * 17, 8, 10); ctx.fillStyle = "#0f1219"; ctx.globalAlpha = 0.88; ctx.fill(); ctx.globalAlpha = 1; }
    }
    function person(x, y, col, z0) { var X = px(x, y), Y = py(x, y, z0 || 0); ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(X, Y, 4, 2, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(X - 2.2, Y - 9, 4.4, 8); ctx.fillStyle = "#e6c9a8"; ctx.beginPath(); ctx.arc(X, Y - 11, 2.4, 0, 6.3); ctx.fill(); }
    function tree(o) { var X = px(o.x, o.y), Y = py(o.x, o.y, 0), r = o.r; ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(X + 4, Y + 2, r * 0.9, r * 0.45, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = "#3a2c22"; ctx.fillRect(X - 1.5, Y - r * 0.9, 3, r * 0.9); var l = lum(o.d);
      var bl = R.decor.urban === "urb_blossom"; ctx.fillStyle = sh(bl ? "#b0527a" : "#1c4a34", l); ctx.beginPath(); ctx.ellipse(X, Y - r * 1.5, r, r * 0.9, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = sh(bl ? "#e58ab4" : "#2c6a4a", l); ctx.beginPath(); ctx.ellipse(X - r * 0.25, Y - r * 1.8, r * 0.6, r * 0.5, 0, 0, 6.3); ctx.fill(); if (R.decor.urban === "urb_lantern" && l > 0.8) { ctx.fillStyle = "#e23b3b"; ctx.fillRect(X + r * 0.4 - 2, Y - r * 1.2, 4, 6); ctx.fillRect(X - r * 0.6 - 2, Y - r * 1.4, 4, 6); glow(X + r * 0.4, Y - r * 1.1, 16, "#ff6a4a", 0.5); glow(X - r * 0.6, Y - r * 1.3, 16, "#ff6a4a", 0.5); } }
    /* ---------- décors de la ville (boutique) ---------- */
    R.decor = {}; R.setDecor = function (d) { R.decor = d || {}; };
    /* ambiance (BL.atmos) et calques : réglés par map-ui ; sans effet si un décor de boutique impose sa propre ambiance */
    R.placement = null; R.setPlacement = function (p) { R.placement = p || null; }; R.atmos = null; R.setAtmos = function (a) { R.atmos = a || null; }; R.layers = { events: true, labels: true, traffic: true, atmos: true, read: false, borders: false }; R.setLayers = function (l) { R.layers = Object.assign({ events: true, labels: true, traffic: true, atmos: true, read: false }, l || {}); };
    function atmosOn() { return !!(R.atmos && R.atmos.on && R.layers.atmos && !R.decor.ambiance); }
    function lampCol(o) { var k = R.decor.lamps; return k === "lamp_gold" ? "#ffd66b" : k === "lamp_blue" ? "#7fb8ff" : k === "lamp_red" ? "#ff6a6a" : k === "lamp_neon" ? ((o.seed | 0) % 2 ? "#4dd8ff" : "#ff4dd2") : "#f6e3a8"; }
    var stars = (function () { var r = M.mulberry(7), a = [], i; for (i = 0; i < 260; i++) a.push([r() * 4000, r() * 2600, 0.8 + r() * 1.8, r() * 6.3]); return a; })();
    function drawStars(X0, Y0, X1, Y1) { ctx.fillStyle = "#dfe8ff"; stars.forEach(function (q) { if (q[0] < X0 || q[0] > X1 || q[1] < Y0 || q[1] > Y1) return; ctx.globalAlpha = 0.35 + 0.5 * (R.motion ? 0.5 + 0.5 * Math.sin(R.time * 1.6 + q[3]) : 0.7); ctx.fillRect(q[0], q[1], q[2], q[2]); }); ctx.globalAlpha = 1; }
    var PAL_TINT = { pal_ice: "rgba(70,140,255,.5)", pal_ruby: "rgba(210,40,60,.5)", pal_emerald: "rgba(30,190,120,.45)", pal_gold: "rgba(230,170,50,.45)", pal_violet: "rgba(140,70,230,.5)", pal_sepia: "rgba(170,120,60,.55)" };
    function screenFx(vw, vh) {
      var d = R.decor, t = R.time, i, a, k = R.low ? 0.5 : 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (d.ambiance === "amb_rain") { ctx.fillStyle = "rgba(10,22,44,.2)"; ctx.fillRect(0, 0, vw, vh); ctx.strokeStyle = "rgba(190,215,255,.38)"; ctx.lineWidth = 1; ctx.beginPath(); for (i = 0; i < 130 * k; i++) { var rx = (M.hash(i, 1) * vw + (R.motion ? t * 90 : 0)) % (vw + 40), ry = (M.hash(i, 2) * vh + (R.motion ? t * 520 : 0) * (0.7 + M.hash(i, 3) * 0.6)) % (vh + 30); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 14); } ctx.stroke(); }
      else if (d.ambiance === "amb_fog") { ctx.fillStyle = "rgba(190,205,222,.13)"; ctx.fillRect(0, 0, vw, vh); for (i = 0; i < 3; i++) { var fy = vh * (0.25 + i * 0.3) + (R.motion ? Math.sin(t * 0.25 + i * 2) * 24 : 0), g = ctx.createLinearGradient(0, fy - 90, 0, fy + 90); g.addColorStop(0, "rgba(200,215,230,0)"); g.addColorStop(0.5, "rgba(200,215,230,.2)"); g.addColorStop(1, "rgba(200,215,230,0)"); ctx.fillStyle = g; ctx.fillRect(0, fy - 90, vw, 180); } }
      else if (d.ambiance === "amb_dawn") { var gd = ctx.createLinearGradient(0, 0, 0, vh); gd.addColorStop(0, "rgba(255,150,80,.3)"); gd.addColorStop(0.55, "rgba(255,200,130,.1)"); gd.addColorStop(1, "rgba(255,230,180,0)"); ctx.fillStyle = gd; ctx.fillRect(0, 0, vw, vh); }
      else if (d.ambiance === "amb_dusk") { var gu = ctx.createLinearGradient(0, 0, 0, vh); gu.addColorStop(0, "rgba(110,50,170,.3)"); gu.addColorStop(1, "rgba(255,110,50,.2)"); ctx.fillStyle = gu; ctx.fillRect(0, 0, vw, vh); }
      else if (d.ambiance === "amb_neon") { var fl = 0.85 + (R.motion ? 0.15 * Math.sin(t * 7) * (Math.sin(t * 0.8) > 0.9 ? 0.3 : 1) : 0.15); var g1 = ctx.createRadialGradient(0, vh, 0, 0, vh, Math.max(vw, vh) * 0.8); g1.addColorStop(0, "rgba(255,40,170," + 0.3 * fl + ")"); g1.addColorStop(1, "rgba(255,40,170,0)"); ctx.fillStyle = g1; ctx.fillRect(0, 0, vw, vh); var g2 = ctx.createRadialGradient(vw, 0, 0, vw, 0, Math.max(vw, vh) * 0.8); g2.addColorStop(0, "rgba(40,220,255," + 0.28 * fl + ")"); g2.addColorStop(1, "rgba(40,220,255,0)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, vw, vh); }
      if (PAL_TINT[d.palette]) { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = PAL_TINT[d.palette]; ctx.fillRect(0, 0, vw, vh); ctx.globalCompositeOperation = "source-over"; }
      if (d.light === "lit_search") { ctx.globalCompositeOperation = "lighter"; for (i = 0; i < 2; i++) { var bx0 = vw * (i ? 0.78 : 0.22), ang = (R.motion ? Math.sin(t * 0.45 + i * 2.4) : 0.2) * 0.55 + (i ? 0.2 : -0.2), L = vh * 0.95, g3 = ctx.createLinearGradient(bx0, vh, bx0 + Math.sin(ang) * L, vh - Math.cos(ang) * L); g3.addColorStop(0, "rgba(255,245,200,.34)"); g3.addColorStop(1, "rgba(255,245,200,0)"); ctx.fillStyle = g3; ctx.beginPath(); ctx.moveTo(bx0 - 10, vh); ctx.lineTo(bx0 + 10, vh); ctx.lineTo(bx0 + Math.sin(ang) * L + 70, vh - Math.cos(ang) * L); ctx.lineTo(bx0 + Math.sin(ang) * L - 70, vh - Math.cos(ang) * L); ctx.closePath(); ctx.fill(); } ctx.globalCompositeOperation = "source-over"; }
      if (d.light === "lit_fly") { ctx.globalCompositeOperation = "lighter"; for (i = 0; i < 38 * k; i++) { var fx = (M.hash(i, 5) * vw + Math.sin(t * 0.5 + i) * 30), fy2 = (M.hash(i, 6) * vh + Math.cos(t * 0.4 + i * 1.7) * 24); a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + i * 3)); ctx.fillStyle = "rgba(255,226,130," + a * 0.25 + ")"; ctx.beginPath(); ctx.arc(fx, fy2, 7, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(255,240,170," + a + ")"; ctx.fillRect(fx - 1, fy2 - 1, 2.4, 2.4); } ctx.globalCompositeOperation = "source-over"; }
      if (d.light === "lit_storm") { var ph = R.time % 9; if (R.motion && (ph < 0.12 || (ph > 0.22 && ph < 0.3))) { ctx.fillStyle = "rgba(225,235,255,.28)"; ctx.fillRect(0, 0, vw, vh); } }
    }
    function atmosFx(vw, vh) {
      if (!atmosOn()) return; var A = R.atmos, T = A.t, W = A.w, t = R.time, i, q = A.q === undefined ? 2 : A.q, mo = R.motion; ctx.setTransform(1, 0, 0, 1, 0, 0);
      var RD = R.layers.read; ctx.fillStyle = "rgba(" + T.overlay.c + "," + Math.min(T.overlay.a, RD ? 0.16 : 0.42).toFixed(3) + ")"; ctx.fillRect(0, 0, vw, vh); if (T.sun > 0.2) { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(255,244,220," + (0.6 * T.sun).toFixed(3) + ")"; ctx.fillRect(0, 0, vw, vh); ctx.globalCompositeOperation = "source-over"; }
      if (RD) return; if (W.kind === "cloud" || W.kind === "rain") { var nc = q >= 2 ? 5 : q === 1 ? 3 : 0; ctx.fillStyle = T.night > 0.5 ? "rgba(6,10,20,.10)" : "rgba(40,50,64,.10)"; for (i = 0; i < nc; i++) { var cx = ((M.hash(i, 11) * (vw + 500) + (mo ? t * (6 + i * 2) : 0)) % (vw + 500)) - 250, cy = vh * (0.12 + 0.7 * M.hash(i, 12)); ctx.beginPath(); ctx.ellipse(cx, cy, 190 + 90 * M.hash(i, 13), 52 + 26 * M.hash(i, 14), 0, 0, 6.3); ctx.fill(); } }
      if (W.kind === "rain") { ctx.fillStyle = "rgba(10,22,44," + (0.1 * W.intensity).toFixed(3) + ")"; ctx.fillRect(0, 0, vw, vh); var n = Math.round((q >= 2 ? 120 : q === 1 ? 60 : 24) * W.intensity); ctx.strokeStyle = "rgba(190,215,255,.34)"; ctx.lineWidth = 1; ctx.beginPath(); for (i = 0; i < n; i++) { var rx = (M.hash(i, 21) * vw + (mo ? t * 80 : 0)) % (vw + 40), ry = (M.hash(i, 22) * vh + (mo ? t * 480 : 0) * (0.7 + M.hash(i, 23) * 0.6)) % (vh + 30); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 13); } ctx.stroke(); }
      if (W.kind === "fog") { ctx.fillStyle = "rgba(190,205,222," + (0.12 * W.intensity).toFixed(3) + ")"; ctx.fillRect(0, 0, vw, vh); var nb = q >= 1 ? 3 : 1; for (i = 0; i < nb; i++) { var fy = vh * (0.25 + i * 0.3) + (mo ? Math.sin(t * 0.25 + i * 2) * 24 : 0), g = ctx.createLinearGradient(0, fy - 90, 0, fy + 90); g.addColorStop(0, "rgba(200,215,230,0)"); g.addColorStop(0.5, "rgba(200,215,230," + (0.18 * W.intensity).toFixed(3) + ")"); g.addColorStop(1, "rgba(200,215,230,0)"); ctx.fillStyle = g; ctx.fillRect(0, fy - 90, vw, 180); } }
    }
    var SIGC = ["#ff4dd2", "#4dd8ff", "#4dff9a", "#ffc24d", "#b061ff"];
    /* repères des notifications importantes : anneaux qui pulsent + pastille au-dessus du bâtiment ou du quartier concerné */
    R.marks = []; R.setMarks = function (m) { R.marks = m || []; };
    var MG = { levelup: "★", status: "★", design: "▲", event: "!", attack: "!", claim: "✓", boost: "+", expire: "i", vault: "$" };
    function drawMarks(z) {
      if (!R.marks.length) return; var k = Math.max(1.25, Math.min(3, 1.15 / Math.max(0.3, z)));
      R.marks.forEach(function (m) {
        var f = R.focusOf(m.type === "lot" ? { type: "lot", id: m.id || m.act + "#0" } : m.type === "district" ? { type: "district", id: m.id } : { type: "hq" }); if (!f) return;
        var gx = f.x, gy = f.y + (m.type === "district" ? 0 : 40), t = R.time * 1.4, i, p, bob = R.motion ? Math.sin(R.time * 4) * 6 * k : 0;
        ctx.save(); ctx.lineWidth = 3 * k; ctx.strokeStyle = m.col;
        for (i = 0; i < 2; i++) { p = (t + i * 0.5) % 1; ctx.globalAlpha = (1 - p) * 0.9; ctx.beginPath(); ctx.ellipse(gx, gy, (50 + p * 90) * k, (25 + p * 45) * k, 0, 0, 6.2832); ctx.stroke(); }
        ctx.globalAlpha = 1; var by = gy - 120 * k + bob, r = 17 * k;
        ctx.beginPath(); ctx.moveTo(gx - 8 * k, by + r - 2 * k); ctx.lineTo(gx, by + r + 12 * k); ctx.lineTo(gx + 8 * k, by + r - 2 * k); ctx.fillStyle = m.col; ctx.fill();
        ctx.beginPath(); ctx.arc(gx, by, r, 0, 6.2832); ctx.fillStyle = "#14161b"; ctx.fill(); ctx.lineWidth = 3 * k; ctx.stroke();
        ctx.fillStyle = m.col; ctx.font = "800 " + Math.round(20 * k) + "px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(MG[m.glyph] || "!", gx, by + 1 * k);
        ctx.restore();
      });
    }
    /* événements en cours : pastilles sous le nom du quartier (icône + temps réel restant), anneau qui pulse seulement si les animations sont permises */
    R.events = []; R.evHits = []; R.evSeen = {};
    R.setEvents = function (l) { R.events = l || []; R.events.forEach(function (e) { if (R.evSeen[e.key] === undefined) R.evSeen[e.key] = R.time; }); };
    /* Pastille d'événement sous le pointeur (coordonnées du monde) : sert au clic et au curseur « main ». */
    R.hitEvent = function (wx, wy) { for (var i = R.evHits.length - 1; i >= 0; i--) { var q = R.evHits[i]; if (wx >= q.x && wx <= q.x + q.w && wy >= q.y && wy <= q.y + q.h) return q.e; } return null; };
    function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); }
    function drawEvents(z) {
      R.evHits = []; if (!R.events.length) return; var k = Math.max(1.25, Math.min(3, 1.15 / Math.max(0.3, z))), groups = {}, anim = R.motion && !R.low, fmt = BL.events.fmt;
      R.events.forEach(function (e) { var key = e.target.type === "hq" ? "hq" : e.target.id; (groups[key] = groups[key] || []).push(e); });
      Object.keys(groups).forEach(function (key) {
        var list = groups[key], f = R.focusOf(key === "hq" ? { type: "hq" } : { type: "district", id: key }); if (!f) return;
        var gx = f.x, gy = f.y + (key === "hq" ? 40 : 0), shown = list.slice(0, 3), extra = list.length - shown.length, first = list[0];
        ctx.save();
        if (anim) { ctx.lineWidth = 3 * k; ctx.strokeStyle = first.col; var p = (R.time * 0.9) % 1; ctx.globalAlpha = (1 - p) * 0.75; ctx.beginPath(); ctx.ellipse(gx, gy, (40 + p * 80) * k, (20 + p * 40) * k, 0, 0, 6.2832); ctx.stroke(); }
        else { ctx.globalAlpha = 0.55; ctx.lineWidth = 3 * k; ctx.strokeStyle = first.col; ctx.beginPath(); ctx.ellipse(gx, gy, 48 * k, 24 * k, 0, 0, 6.2832); ctx.stroke(); }
        ctx.globalAlpha = 1; ctx.textBaseline = "middle"; var H = 34 * k, y0 = gy - 66 * k;
        shown.forEach(function (e, i) {
          var txt = e.short + (e.left !== null ? " " + fmt(e.left) : ""), fs = Math.round(17 * k); ctx.font = "700 " + fs + "px Oxanium, IBM Plex Sans, sans-serif"; var tw = ctx.measureText(txt).width, W = H + tw + 16 * k, x = gx - W / 2, y = y0 + i * (H + 6 * k), bob = anim && i === 0 ? Math.sin(R.time * 3) * 2 * k : 0;
          y += bob; R.evHits.push({ e: e, x: x - 4 * k, y: y - 4 * k, w: W + 8 * k, h: H + 8 * k });
          /* apparition : petit rebond (échelle) la première fois qu'on voit l'événement ; les décisions attendues respirent doucement */
          var need = e.kind === "conflict" || e.kind === "event", age = R.time - (R.evSeen[e.key] || 0), sc = 1;
          if (anim && age < 0.55) { var q = age / 0.55; sc = 1 + 0.32 * Math.sin(q * Math.PI) * (1 - q * 0.3); } else if (anim && need) sc = 1 + 0.035 * Math.sin(R.time * 4);
          ctx.save(); ctx.translate(x + W / 2, y + H / 2); ctx.scale(sc, sc); ctx.translate(-(x + W / 2), -(y + H / 2));
          rrect(x, y, W, H, H / 2); ctx.fillStyle = "rgba(14,16,22,.92)"; ctx.fill(); ctx.lineWidth = 2.5 * k; ctx.strokeStyle = e.col; ctx.stroke();
          ctx.beginPath(); ctx.arc(x + H / 2, y + H / 2, H / 2 - 3 * k, 0, 6.2832); ctx.fillStyle = e.col; ctx.fill(); ctx.fillStyle = "#10131a"; ctx.textAlign = "center"; ctx.font = "800 " + Math.round(20 * k) + "px IBM Plex Sans, sans-serif"; ctx.fillText(e.kind === "event" ? "?" : BL.events.KINDS[e.kind].glyph, x + H / 2, y + H / 2 + 1 * k);
          ctx.font = "700 " + fs + "px Oxanium, IBM Plex Sans, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#f2efe8"; ctx.fillText(txt, x + H + 4 * k, y + H / 2 + 1 * k);
          if (need) { ctx.beginPath(); ctx.arc(x + W - 3 * k, y + 3 * k, 6 * k, 0, 6.2832); ctx.fillStyle = "#ff4a3d"; ctx.fill(); ctx.lineWidth = 2 * k; ctx.strokeStyle = "#10131a"; ctx.stroke(); }
          ctx.restore();
        });
        if (extra > 0) { ctx.textAlign = "center"; ctx.font = "800 " + Math.round(17 * k) + "px Oxanium, IBM Plex Sans, sans-serif"; ctx.fillStyle = "#f2efe8"; ctx.strokeStyle = "rgba(4,6,10,.9)"; ctx.lineWidth = 4 * k; var ty = y0 + shown.length * (H + 6 * k) + 10 * k; ctx.strokeText("+" + extra, gx, ty); ctx.fillText("+" + extra, gx, ty); }
        ctx.restore();
      });
    }
    /* bâtiments du joueur : contour doré au sol + nom de l’activité à partir d’un zoom moyen */
    function drawLots(s, z) {
      if (!R.layers.labels) return; var showName = z >= 0.5 && !(R.decor.signs === "sign_neon" || R.decor.signs === "sign_gold"), fs = Math.max(13, Math.round(14 / Math.max(0.3, z)));
      ctx.save(); ctx.lineJoin = "round";
      model.lots.forEach(function (l) {
        if (!bt(s, l)) return; var x0 = l.x, y0 = l.y, x1 = l.x + l.w, y1 = l.y + l.d;
        ctx.beginPath(); ctx.moveTo(px(x0, y0), py(x0, y0, 0)); ctx.lineTo(px(x1, y0), py(x1, y0, 0)); ctx.lineTo(px(x1, y1), py(x1, y1, 0)); ctx.lineTo(px(x0, y1), py(x0, y1, 0)); ctx.closePath();
        if (R.layers.borders) { ctx.strokeStyle = "rgba(4,6,10,.5)"; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = "rgba(227,198,128,.7)"; ctx.lineWidth = 1.5; ctx.stroke(); } /* Partie 14 : le contour doré de chaque parcelle construite n'est plus dessiné par défaut (calque « Limites des quartiers ») */
        if (false) { var ai = D.activities.map(function (q) { return q.id; }).indexOf(l.act), nm = D.activities[ai].name, X = px(l.x + l.w / 2, l.y + l.d / 2), Y = py(l.x + l.w / 2, l.y + l.d / 2, lotH(l, LV(s, l)) + 30);
          ctx.font = "700 " + fs + "px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.strokeStyle = "rgba(4,6,10,.94)"; ctx.lineWidth = 5; ctx.strokeText(nm, X, Y); ctx.fillStyle = "#f3e2b0"; ctx.fillText(nm, X, Y); }
      });
      ctx.restore();
    }
    function drawSigns(s, z) {
      if (z < 0.45 || (R.decor.signs !== "sign_neon" && R.decor.signs !== "sign_gold")) return; var gold = R.decor.signs === "sign_gold";
      model.lots.forEach(function (l) {
        if (!bt(s, l)) return; var ai = D.activities.map(function (q) { return q.id; }).indexOf(l.act), nm = D.activities[ai].name.split(" ")[0].toUpperCase(), X = px(l.x + l.w / 2, l.y + l.d / 2), Y = py(l.x + l.w / 2, l.y + l.d / 2, lotH(l, LV(s, l)) + 44) + (R.motion && gold ? Math.sin(R.time * 2 + ai) * 3 : 0), col = gold ? "#e8cd8a" : SIGC[ai % 5], w = nm.length * 8 + 22;
        glow(X, Y, 54, col, gold ? 0.35 : 0.45); ctx.fillStyle = "rgba(8,10,14,.82)"; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X - w / 2 + 8, Y - 11); ctx.lineTo(X + w / 2 - 8, Y - 11); ctx.quadraticCurveTo(X + w / 2, Y - 11, X + w / 2, Y - 3); ctx.lineTo(X + w / 2, Y + 3); ctx.quadraticCurveTo(X + w / 2, Y + 11, X + w / 2 - 8, Y + 11); ctx.lineTo(X - w / 2 + 8, Y + 11); ctx.quadraticCurveTo(X - w / 2, Y + 11, X - w / 2, Y + 3); ctx.lineTo(X - w / 2, Y - 3); ctx.quadraticCurveTo(X - w / 2, Y - 11, X - w / 2 + 8, Y - 11); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col; ctx.font = "700 12px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(gold ? "◆ " + nm + " ◆" : nm, X, Y + 4.5);
      });
    }
    function lampPost(o, z) { var X = px(o.x, o.y), Y = py(o.x, o.y, 0); if (lum(o.d) < 0.9) return; ctx.strokeStyle = "#3a404a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y - 26); ctx.lineTo(X + 4, Y - 28); ctx.stroke(); var lc = lampCol(o); ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(X + 4.5, Y - 28, 2.6, 0, 6.3); ctx.fill(); if (z > 0.5) glow(X + 4.5, Y - 28, lc === "#f6e3a8" ? 18 : 24, lc, 0.55 * (R.motion ? 0.92 + 0.08 * Math.sin(R.time * 2 + o.seed) : 1)); }

    /* ---------- bâtiments de décor ---------- */
    function gable(x, y, w, d, h, rh, col, roofCol, lm) {
      var p = function (X, Y, Z) { return [px(X, Y), py(X, Y, Z)]; };
      poly([p(x + w, y, h), p(x + w, y + d, h), p(x + w, y + d / 2, h + rh)], sh(col, 0.7 * lm));                                    /* pignon visible (face +x) */
      poly([p(x, y + d, h), p(x + w, y + d, h), p(x + w, y + d / 2, h + rh), p(x, y + d / 2, h + rh)], sh(roofCol, 1.05 * lm));        /* versant avant */
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.beginPath(); var a = p(x, y + d / 2, h + rh), b = p(x + w, y + d / 2, h + rh); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    function drawDecor(b, z, s) {
      var l = lum(b.district), h = bh(b, s), pal = M.PAL[b.district] || M.PAL.hq, small = b.w < 80 && (b.district === "residential" || b.district === "oldtown" || b.district === "prestige");
      if (b.type === "yard") { box(b.x, b.y, b.w, b.d, 6, 0, "#2a3238", "#323b42", l); var n = Math.floor(b.w / 34);
        for (var i = 0; i < n; i++) for (var j = 0; j < 2; j++) { var c = ["#7a3b34", "#35506b", "#6b5a2f", "#3d5a4a", "#5a3d6b"][(b.seed + i + j) % 5]; box(b.x + 6 + i * 32, b.y + 8 + j * 24, 28, 16, 15 + ((b.seed + i * 3 + j) % 2) * 15, 6, c, c, l, { noShadow: true }); } return; }
      box(b.x, b.y, b.w, b.d, h, 0, b.wall, b.roof, l);
      winGrid("L", b.x, b.y, b.w, b.d, 0, h, 0, b.w, b.seed, b.district === "prestige" ? "#f6e3a8" : "#f1d98f", (b.district === "residential" ? 0.5 : 0.7) * (R.rv[b.district] || 0.15), l, z);
      winGrid("R", b.x, b.y, b.w, b.d, 0, h, 0, b.d, b.seed + 3, "#e9c97a", 0.55 * (R.rv[b.district] || 0.15), l, z);
      if (small) gable(b.x, b.y, b.w, b.d, h, 14 + (b.seed % 3) * 4, b.wall, b.district === "oldtown" ? "#6b3b30" : b.roof, l);
      else {
        onT(b.x, b.y, h, function () { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(4, 4, b.w - 8, 2); ctx.fillRect(4, b.d - 6, b.w - 8, 2);
          var ac = 1 + (b.seed % 3); for (var i = 0; i < ac; i++) { ctx.fillStyle = "#59616d"; ctx.fillRect(8 + (i * 23 + b.seed * 7) % Math.max(10, b.w - 22), 8 + (i * 13 + b.seed * 3) % Math.max(10, b.d - 20), 12, 9); } });
        if (!spr && b.district === "business" && h > 110) { var ax = px(b.x + b.w / 2, b.y + b.d / 2), ay = py(b.x + b.w / 2, b.y + b.d / 2, h); ctx.strokeStyle = "#6b7585"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 30); ctx.stroke(); ctx.fillStyle = "#ff4d4d"; ctx.globalAlpha = R.motion ? 0.5 + 0.5 * Math.sin(R.time * 2 + b.seed) : 1; ctx.beginPath(); ctx.arc(ax, ay - 31, 2.6, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
        if (!spr && b.chim && z > 0.35) { var cx = b.x + b.w * 0.75, cy = b.y + b.d * 0.3; box(cx, cy, 9, 9, 26, h, "#3a2f2c", "#4a3d39", l, { noShadow: true }); if (R.motion) for (var p = 0; p < 3; p++) { var ph = (R.time * 0.22 + b.seed * 0.37 + p / 3) % 1; ctx.globalAlpha = 0.3 * (1 - ph); ctx.fillStyle = "#a3a9b0"; ctx.beginPath(); ctx.arc(px(cx + 4, cy + 4) + ph * 16, py(cx + 4, cy + 4, h + 28 + ph * 50), 5 + ph * 9, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1; }
      }
    }


    /* Les bâtiments de décor sont statiques : dessinés une fois dans un sprite (réactualisé quand l'éclairage change), puis simplement copiés. */
    var SS = 2;
    function decorSprite(b, s) {
      var h = bh(b, s), x0 = Math.floor(px(b.x, b.y + b.d) - 6), x1 = Math.ceil(px(b.x + b.w, b.y) + 6), y0 = Math.floor(py(b.x, b.y, h + 24) - 6), y1 = Math.ceil(py(b.x + b.w, b.y + b.d, 0) + 12),
        key = Math.round((R.rv[b.district] || 0) * 20) + "|" + (R.motion ? Math.floor(R.time / (16 + (b.seed % 7) * 4)) : 0) + "|" + Math.round(h), e = sprites[b.id];
      if (!e || e.key !== key) {
        if (!e) { e = sprites[b.id] = { c: document.createElement("canvas") }; e.c.width = (x1 - x0) * SS; e.c.height = (y1 - y0) * SS; e.x = x0; e.y = y0; e.w = x1 - x0; e.h = y1 - y0; }
        var sc = e.c.getContext("2d"), keep = ctx; sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, e.c.width, e.c.height); sc.setTransform(SS, 0, 0, SS, -x0 * SS, -y0 * SS);
        ctx = sc; spr = true; drawDecor(b, 1, s); spr = false; ctx = keep; e.key = key;
      }
      return e;
    }
    function drawDecorFast(b, z, s) {
      if (z > 1.3 || typeof document === "undefined") { drawDecor(b, z, s); return; }
      var e = decorSprite(b, s); ctx.drawImage(e.c, e.x, e.y, e.w, e.h);
      var h = bh(b, s);
      if (b.district === "business" && h > 110) { var ax = px(b.x + b.w / 2, b.y + b.d / 2), ay = py(b.x + b.w / 2, b.y + b.d / 2, h); ctx.strokeStyle = "#6b7585"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 30); ctx.stroke(); ctx.fillStyle = "#ff4d4d"; ctx.globalAlpha = R.motion ? 0.5 + 0.5 * Math.sin(R.time * 2 + b.seed) : 1; ctx.beginPath(); ctx.arc(ax, ay - 31, 2.6, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
      if (b.chim && z > 0.35) { var cx = b.x + b.w * 0.75, cy = b.y + b.d * 0.3; box(cx, cy, 9, 9, 26, h, "#3a2f2c", "#4a3d39", lum(b.district), { noShadow: true }); if (R.motion) for (var p = 0; p < 3; p++) { var ph = (R.time * 0.22 + b.seed * 0.37 + p / 3) % 1; ctx.globalAlpha = 0.3 * (1 - ph); ctx.fillStyle = "#a3a9b0"; ctx.beginPath(); ctx.arc(px(cx + 4, cy + 4) + ph * 16, py(cx + 4, cy + 4, h + 28 + ph * 50), 5 + ph * 9, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1; }
    }
    /* ---------- bâtiments d'activités ---------- */
    var SGN = 1;
    function worn(hex, tier) { var c = rgb(hex), g = (c[0] + c[1] + c[2]) / 3 * 0.85, t = Math.min(1.15, 0.3 + 0.14 * tier); return "rgb(" + Math.round(g + (c[0] - g) * t) + "," + Math.round(g + (c[1] - g) * t) + "," + Math.round(g + (c[2] - g) * t) + ")"; }
    function signText(txt, u, v, wd, ht, col, face) { u += wd * (1 - SGN) / 2; wd *= SGN; ht *= SGN; ctx.save(); ctx.fillStyle = col; ctx.fillRect(u, v, wd, ht); ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.scale(1, -1); ctx.font = "700 " + Math.round(ht * 0.62) + "px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(txt, u + wd / 2, -(v + ht * 0.25)); ctx.restore(); }
    function truck(x, y, col, l) { box(x, y, 34, 16, 16, 0, col, sh(col, 1.1), l); box(x + 34, y + 2, 12, 12, 11, 0, "#c8a45e", "#d8b878", l, { noShadow: true }); var wx = [x + 8, x + 28, x + 40]; ctx.fillStyle = "#0b0d10"; wx.forEach(function (q) { var X = px(q, y + 16), Y = py(q, y + 16, 0); ctx.beginPath(); ctx.ellipse(X, Y, 3.5, 3, 0, 0, 6.3); ctx.fill(); }); }

    function drawLot(b, s, z, hov, sel) {
      var l = b.lot, k = KIND[l.act], Lv = LV(s, l), tier = tierOf(Lv), full = lotH(l, Lv), a0 = R.anim[l.id], p = a0 === undefined ? 1 : ease((R.time - a0) / 1.4), h = full * p, x = b.x, y = b.y, w = b.w, d = b.d, lm = 1, pu = pulse(b.seed) * [0.15, 0.35, 0.6, 0.85, 1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6][tier], cxg = x + w / 2, wallC = worn(k.wall, tier);
      dk = Math.min(1.1, 0.45 + 0.12 * tier); SGN = Math.min(1.12, 0.62 + 0.09 * tier);
      var fl = R.flash && R.flash.id === l.id && R.time - R.flash.t < 1.2 ? 1 - (R.time - R.flash.t) / 1.2 : 0;
      diamond(x - 8, y - 8, w + 16, d + 44, 0, "#222831", "#2c333d", 2);                                                    /* parcelle */
      if (p < 1) { ctx.strokeStyle = "rgba(241,194,75,.85)"; ctx.lineWidth = 2; [[x, y + d], [x + w, y + d], [x + w, y]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(px(c[0], c[1]), py(c[0], c[1], 0)); ctx.lineTo(px(c[0], c[1]), py(c[0], c[1], full)); ctx.stroke(); }); }
      var roof = worn(k.roof, tier);
      if (l.act === "holding" || l.act === "estate") {
        var gold = l.act === "holding", pod = gold ? 26 : 22, tw = w * 0.62, td = d * 0.62, tx = x + (w - tw) / 2, ty = y + (d - td) / 2 - 2;
        box(x, y, w, d, pod * Math.min(1, p * 1.5), 0, gold ? "#2c3a40" : "#34405a", gold ? "#3a4c54" : "#44527a", lm);
        if (p > 0.5) { onL(x, y, d, 0, function () { for (var i = 0; i < 5; i++) { ctx.fillStyle = "#f1d98f"; ctx.globalAlpha = 0.9; ctx.fillRect(10 + i * 24, 6, 16, 13); } ctx.globalAlpha = 1; ctx.fillStyle = gold ? "#e3c680" : "#9ab4dd"; ctx.fillRect(0, pod - 4, w, 4); if (gold) { for (var c = 0; c < 4; c++) { ctx.fillStyle = "#e8e2d2"; ctx.fillRect(18 + c * 30, 0, 6, pod - 4); } } }); }
        box(tx, ty, tw, td, h - pod * 0.6, pod * 0.9, wallC, roof, lm, { noShadow: true });
        winGrid("L", tx, ty, tw, td, pod * 0.9, h - pod * 0.6, 0, tw, b.seed, gold ? "#bde6ee" : "#f6e3a8", gold ? 0.9 : 0.72, lm, z, 6); winGrid("R", tx, ty, tw, td, pod * 0.9, h - pod * 0.6, 0, td, b.seed + 5, gold ? "#a7d6e0" : "#e9c97a", 0.6, lm, z, 6);
        var top = h + pod * 0.3; if (gold) { onL(tx, ty, td, h - 10, function () { ctx.fillStyle = "#e3c680"; ctx.fillRect(0, 0, tw, 5); }); }
        if (tier >= 2) box(tx + tw * 0.2, ty + td * 0.2, tw * 0.6, td * 0.6, 6 + tier * 7, top, wallC, gold ? "#e3c680" : roof, lm, { noShadow: true });
        var ax = px(tx + tw / 2, ty + td / 2), ay = py(tx + tw / 2, ty + td / 2, top + (tier >= 2 ? 6 + tier * 7 : 0)); ctx.strokeStyle = "#8a93a2"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 24); ctx.stroke(); ctx.fillStyle = gold ? "#e3c680" : "#ff4d4d"; ctx.globalAlpha = R.motion ? 0.5 + 0.5 * Math.sin(R.time * 2 + b.seed) : 1; ctx.beginPath(); ctx.arc(ax, ay - 25, 3, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
        if (gold && z > 0.35) glow(px(tx + tw / 2, ty + td), py(tx + tw / 2, ty + td, h * 0.45), 70, "#e3c680", 0.14 + 0.05 * pu);
        if (p > 0.6) { onL(x, y, d, 0, function () { signText(gold ? "HOLDING" : "ESTATE", w / 2 - 30, pod - 18, 60, 12, gold ? "rgba(140,110,50,.95)" : "rgba(70,90,140,.95)"); }); }
      } else if (l.act === "backroom") {
        box(x, y, w, d, h, 0, wallC, roof, lm);
        winGrid("L", x, y, w, d, 0, h, 0, w, b.seed, "#ff9bb8", 0.45, lm, z, 24); winGrid("R", x, y, w, d, 0, h, 0, d, b.seed + 2, "#d08bff", 0.5, lm, z, 24);
        if (p > 0.6) {
          onL(x, y, d, 0, function () { ctx.fillStyle = "#14101a"; ctx.fillRect(w / 2 - 11, 0, 22, 19); ctx.fillStyle = "rgba(255,120,170,.35)"; ctx.fillRect(w / 2 - 9, 2, 18, 15); ctx.fillStyle = "#f6e3a8"; ctx.fillRect(w / 2 + 6, 8, 2, 2); });
          if (tier >= 1) box(cxg - 22, y + d, 44, 14, 3, 20, "#b3473f", "#e8e0cc", lm, { noShadow: true });                                  /* auvent rayé */
          if (tier >= 1) onT(cxg - 22, y + d, 23, function () { for (var i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#efe6d0" : "#b3473f"; ctx.fillRect(i * 7.3, 0, 7.4, 14); } });
          onL(x, y, d, 0, function () { glow(w / 2, h - 12, 58, "#ff4f8b", 0.4 * pu); ctx.globalAlpha = 0.6 + 0.4 * pu; ctx.save(); ctx.translate(w / 2 - 11, h - 32); ctx.scale(0.9, 0.9); vShapes(BL.venues.glyph("spade"), "#ff4f8b", 1, pu); ctx.restore();   /* emblème « pique » : la salle clandestine n’est pas le casino */ ctx.globalAlpha = 1; });
          if (tier >= 3) onR(x, y, w, d, 0, function () { glow(d / 2, h - 16, 40, "#a56bff", 0.4 * pu); ctx.fillStyle = "#a56bff"; ctx.globalAlpha = 0.55 + 0.45 * pu; ctx.fillRect(d / 2 - 3, h - 46, 6, 34); ctx.globalAlpha = 1; });
          person(cxg - 30, y + d + 12, "#14171c"); person(cxg + 32, y + d + 12, "#14171c"); ctx.strokeStyle = "#b3473f"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px(cxg - 30, y + d + 12), py(cxg - 30, y + d + 12, 7)); ctx.lineTo(px(cxg - 24, y + d + 16), py(cxg - 24, y + d + 16, 7)); ctx.stroke();
          if (tier >= 2) for (var m = 0; m < 7; m++) { var ux = x + 6 + m * (w - 12) / 6; ctx.fillStyle = "#f6e3a8"; ctx.globalAlpha = R.motion ? 0.45 + 0.55 * Math.sin(R.time * 4 + m) : 0.9; ctx.beginPath(); ctx.arc(px(ux, y + d), py(ux, y + d, h), 2.2, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1;
        }
      } else if (l.act === "freight") {
        box(x, y, w, d, h, 0, wallC, roof, lm);
        winGrid("R", x, y, w, d, 0, h, 0, d, b.seed, "#9fb8cc", 0.4, lm, z, h - 18);
        if (p > 0.6) {
          var bays = Math.min(4, 2 + Math.floor((tier + 1) / 2)); onL(x, y, d, 0, function () { var bw = (w - 16) / bays; for (var i = 0; i < bays; i++) { var bx = 8 + i * bw; ctx.fillStyle = "#14181d"; ctx.fillRect(bx, 0, bw - 7, 26); ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; for (var q = 4; q < 26; q += 5) { ctx.beginPath(); ctx.moveTo(bx, q); ctx.lineTo(bx + bw - 7, q); ctx.stroke(); } ctx.fillStyle = "#f1c24b"; ctx.fillRect(bx, 26, bw - 7, 4); }
            ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, h - 4, w, 4); signText("GARAGE", w / 2 - 30, h - 18, 60, 12, "#c89a2a"); glow(w - 12, h - 8, 24, "#f1c24b", 0.5 * pu); });
          onT(x, y, h, function () { ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 1.5; for (var r = 1; r < 5; r++) { ctx.beginPath(); ctx.moveTo(0, r * d / 5); ctx.lineTo(w, r * d / 5); ctx.stroke(); } });
          truck(x + w - 62, y + d + 10, "#4a5668", lm); if (tier >= 2) truck(x + 8, y + d + 10, "#6a5230", lm);
        }
      } else if (l.act === "fence") {
        box(x, y, w, d, h, 0, wallC, roof, lm);
        winGrid("R", x, y, w, d, 0, h, 0, d, b.seed, "#9fd4de", 0.45, lm, z, 20); winGrid("L", x, y, w, d, 0, h, 0, w, b.seed + 4, "#9fd4de", 0.35, lm, z, 30);
        if (p > 0.6) {
          onL(x, y, d, 0, function () { ctx.fillStyle = "rgba(111,179,194,.55)"; ctx.fillRect(10, 5, w - 56, 20); ctx.fillStyle = "#0f1a1c"; ctx.fillRect(w - 38, 0, 24, 24); glow(w / 2 - 10, 14, 50, "#6fb3c2", 0.3 * pu); signText("BROCANTE", w / 2 - 38, h - 18, 72, 13, "rgba(40,110,120,.95)"); });
          if (tier >= 1) box(x + 6, y + d, w - 50, 10, 3, 27, "#3d8a94", "#e8e0cc", lm, { noShadow: true }); if (tier >= 1) onT(x + 6, y + d, 30, function () { for (var i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#efe6d0" : "#3d8a94"; ctx.fillRect(i * (w - 50) / 8, 0, (w - 50) / 8 + 0.5, 10); } });
          var nC = Math.max(2, 7 - tier); for (var c = 0; c < nC; c++) { var cc = ["#7a3b34", "#35506b", "#6b5a2f", "#3d5a4a", "#5a3d6b"][(c + b.seed) % 5], cx2 = x + 4 + (c % 4) * 26, cy2 = y + d + 18 + Math.floor(c / 4) * 16; if (cx2 + 22 > x + w + 6) continue; box(cx2, cy2, 22, 12, 11, 0, cc, sh(cc, 1.2), lm, { noShadow: true }); }
          if (tier >= 2) { box(x + w + 4, y + 8, 30, 14, 14, 0, "#6b5a2f", "#7d6b38", lm); box(x + w + 4, y + 8, 30, 14, 14, 14, "#35506b", "#476a8c", lm, { noShadow: true }); }
        }
      }
      if (p > 0.6) tierFx(b, tier, h, z, pu, wallC);
      dk = 1; SGN = 1;
      if (fl > 0) { ctx.globalAlpha = fl * 0.45; ctx.fillStyle = "#f6e3a8"; var sil = silhouette(x, y, w, d, h); poly(sil, "#f6e3a8"); ctx.globalAlpha = 1; }
      if (sel || hov) outline(x, y, w, d, h, sel);
    }
    /* Détails propres à chaque palier de design : délabré (fissures, planches, sacs) → ultra soigné (dorures, jardinières, projecteurs). */
    function tierFx(b, tier, h, z, pu, wallC) {
      var x = b.x, y = b.y, w = b.w, d = b.d, seed = b.seed, tall = b.lot.act === "estate" || b.lot.act === "holding", bx = tall ? x + w * 0.19 : x, bw = tall ? w * 0.62 : w, hh = tall ? h - 6 : h, i;
      if (tier <= 1) {
        onL(bx, y, d, 0, function () { ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 1.2; ctx.beginPath(); var cx = 12 + (seed * 11) % Math.max(10, bw - 40); ctx.moveTo(cx, hh); ctx.lineTo(cx + 5, hh - 12); ctx.lineTo(cx - 2, hh - 24); ctx.lineTo(cx + 4, hh - 34); ctx.stroke();
          if (tier === 0) { ctx.fillStyle = "#4a3a2a"; ctx.fillRect(bw * 0.25, hh * 0.45, 9, 11); ctx.fillStyle = "#5a4a38"; ctx.fillRect(bw * 0.25 - 1, hh * 0.45 + 3, 11, 2); ctx.fillStyle = "rgba(160,70,70,.55)"; ctx.fillRect(bw * 0.62, 6, 18, 6); ctx.fillStyle = "rgba(90,140,170,.5)"; ctx.fillRect(bw * 0.62 + 4, 12, 12, 4); } });
        if (z > 0.35) { var tx = x + 10, ty = y + d + 8; ctx.fillStyle = "#1c2026"; ctx.beginPath(); ctx.ellipse(px(tx, ty), py(tx, ty, 3), 5, 3, 0, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.ellipse(px(tx + 9, ty + 3), py(tx + 9, ty + 3, 3), 4, 2.6, 0, 0, 6.3); ctx.fill(); }
      }
      if (tier >= 2) { for (i = 0; i < 3; i++) { var gx = bx + 10 + i * (bw - 26) / 2; box(gx, y + d + 2, 12, 6, 5, 0, "#5a4636", "#6b5644", 1, { noShadow: true }); ctx.fillStyle = tier >= 4 ? "#3f8a58" : "#2f6a44"; ctx.beginPath(); ctx.arc(px(gx + 6, y + d + 5), py(gx + 6, y + d + 5, 9), 5, 0, 6.3); ctx.fill(); } }
      if (tier >= 3) { onL(bx, y, d, 0, function () { ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(0, hh - 3, bw, 3); for (var q = 0; q < 3; q++) { ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(q * bw / 3, 0, 1.5, hh); } }); if (z > 0.4) for (i = 0; i < 2; i++) { var ux = bx + 8 + i * (bw - 16), uy = y + d + 3; glow(px(ux, uy), py(ux, uy, 6), 22, "#fff0c0", 0.3 * pu); } }
      if (tier >= 4) { onL(bx, y, d, 0, function () { ctx.fillStyle = "#e3c680"; ctx.fillRect(0, hh - 5, bw, 3); ctx.fillRect(0, 0, bw, 3); ctx.fillRect(0, 0, 4, hh); ctx.fillRect(bw - 4, 0, 4, hh); });
        onR(bx, y, bw, d, 0, function () { ctx.fillStyle = "#e3c680"; ctx.fillRect(0, hh - 5, d, 3); ctx.fillRect(d - 4, 0, 4, hh); });
        for (i = 0; i < 2; i++) { var fx = bx + 3 + i * (bw - 6), fy = y + d + 4, fa = px(fx, fy), fb = py(fx, fy, 0); ctx.strokeStyle = "#8a8f99"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fa, fb); ctx.lineTo(fa, fb - 26); ctx.stroke(); ctx.fillStyle = i ? "#c8a45e" : "#8b2f3a"; var wv = R.motion ? Math.sin(R.time * 3 + i) * 1.5 : 0; ctx.beginPath(); ctx.moveTo(fa, fb - 26); ctx.lineTo(fa + 11 + wv, fb - 23); ctx.lineTo(fa, fb - 18); ctx.fill(); } }
      if (tier >= 5) {
        var cx2 = bx + bw / 2, cy2 = y + d / 2, ca = px(cx2, cy2), cb = py(cx2, cy2, hh + (tall ? 30 : 4));
        ctx.fillStyle = "#e3c680"; ctx.beginPath(); ctx.moveTo(ca - 12, cb); ctx.lineTo(ca - 8, cb - 10); ctx.lineTo(ca - 3, cb - 3); ctx.lineTo(ca, cb - 14); ctx.lineTo(ca + 3, cb - 3); ctx.lineTo(ca + 8, cb - 10); ctx.lineTo(ca + 12, cb); ctx.closePath(); ctx.fill();   /* couronne */
        if (z > 0.35 && !R.low) { for (i = 0; i < 2; i++) { var sx = bx + (i ? bw - 4 : 4), sy = y + d + 6, sa = px(sx, sy), sb = py(sx, sy, 2); ctx.globalAlpha = 0.1 + 0.04 * pu; ctx.fillStyle = "#fff4c8"; ctx.beginPath(); ctx.moveTo(sa - 3, sb); ctx.lineTo(sa + 3, sb); ctx.lineTo(sa + (i ? 14 : -2), sb - 62); ctx.lineTo(sa + (i ? 8 : -10), sb - 62); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; } }
        var rcx = x + w / 2 - 9, rcy = y + d; diamond(rcx, rcy, 18, 26, 0, "#8b2f3a", "#e3c680", 1);                                                        /* tapis rouge */
      }
      if (tier >= 6) tierFxHigh(b, tier, hh, bx, bw, z, pu, wallC);
      if (tier >= 10) tierFxTop(b, tier, hh, bx, bw, z, pu);
    }
    /* Paliers 6 à 9 (niveaux 30, 35, 40, 45 et plus) : chaque palier ajoute une VRAIE nouvelle forme, pas seulement des couleurs. */
    var ACC = { backroom: "#ff4f8b", freight: "#f1c24b", fence: "#6fb3c2", estate: "#9ab4dd", holding: "#e3c680" };
    function tierFxHigh(b, tier, hh, bx, bw, z, pu, wallC) {
      var x = b.x, y = b.y, w = b.w, d = b.d, ac = ACC[b.lot.act] || "#e3c680", i;
      if (tier >= 6) {                                                                                           /* 30 · Impérial : bandes lumineuses aux angles + toit-jardin */
        onL(bx, y, d, 0, function () { ctx.fillStyle = ac; ctx.globalAlpha = 0.55 + 0.3 * pu; ctx.fillRect(2, 0, 3, hh); ctx.fillRect(bw - 5, 0, 3, hh); ctx.globalAlpha = 1; });
        onR(bx, y, bw, d, 0, function () { ctx.fillStyle = ac; ctx.globalAlpha = 0.5 + 0.3 * pu; ctx.fillRect(d - 5, 0, 3, hh); ctx.globalAlpha = 1; });
        box(bx + bw * 0.1, y + d * 0.12, bw * 0.3, d * 0.3, 7, hh, "#2f6a44", "#3f8a58", 1, { noShadow: true });
      }
      if (tier >= 7) {                                                                                           /* 35 · Somptueux : aile annexe dorée à deux fenêtres */
        var ah = Math.max(22, hh * 0.38), ax = x + w + 2, ay = y + d * 0.25, ad = d * 0.55;
        box(ax, ay, 26, ad, ah, 0, wallC, "#e3c680", 1);
        onL(ax, ay, ad, 0, function () { ctx.fillStyle = "#e3c680"; ctx.fillRect(0, ah - 3, 26, 3); ctx.fillStyle = "#f6e3a8"; ctx.globalAlpha = 0.85; ctx.fillRect(5, 6, 6, 10); ctx.fillRect(15, 6, 6, 10); ctx.globalAlpha = 1; });
      }
      if (tier >= 8) {                                                                                           /* 40 · Monumental : colonnade de marbre + projecteurs */
        for (i = 0; i < 4; i++) { var cx = bx + 8 + i * (bw - 16) / 3; box(cx - 3, y + d + 8, 6, 6, Math.min(hh * 0.55, 52), 0, "#e8e2d2", "#f6f1e4", 1, { noShadow: true }); }
        box(bx + 4, y + d + 6, bw - 8, 10, 3, Math.min(hh * 0.55, 52), "#e3c680", "#f2dc9a", 1, { noShadow: true });
        if (z > 0.35 && !R.low) for (i = 0; i < 2; i++) { var sx = bx + (i ? bw - 2 : 2), sy = y + d + 14, sa = px(sx, sy), sb = py(sx, sy, 2); ctx.globalAlpha = 0.12 + 0.05 * pu; ctx.fillStyle = ac; ctx.beginPath(); ctx.moveTo(sa - 3, sb); ctx.lineTo(sa + 3, sb); ctx.lineTo(sa + (i ? 22 : -8), sb - 96); ctx.lineTo(sa + (i ? 10 : -20), sb - 96); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
      }
      if (tier >= 9) {                                                                                           /* 45+ · Éternel : flèche dorée, halo large, fontaine d'accueil */
        var sx2 = px(bx + bw / 2, y + d / 2), sy2 = py(bx + bw / 2, y + d / 2, hh + 28);
        ctx.fillStyle = "#f2dc9a"; ctx.beginPath(); ctx.moveTo(sx2 - 7, sy2); ctx.lineTo(sx2, sy2 - 52); ctx.lineTo(sx2 + 7, sy2); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#e3c680"; ctx.beginPath(); ctx.moveTo(sx2, sy2 - 52); ctx.lineTo(sx2 + 7, sy2); ctx.lineTo(sx2, sy2 - 4); ctx.closePath(); ctx.fill();
        glow(sx2, sy2 - 30, 120, ac, 0.22 + 0.06 * pu);
        var fx = px(x + w / 2 + 34, y + d + 22), fy = py(x + w / 2 + 34, y + d + 22, 2); ctx.fillStyle = "#2b4a5a"; ctx.beginPath(); ctx.ellipse(fx, fy, 14, 7, 0, 0, 6.3); ctx.fill(); ctx.strokeStyle = "#e3c680"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = "#9fd4de"; ctx.globalAlpha = 0.8; ctx.fillRect(fx - 1.2, fy - 14, 2.4, 12); ctx.globalAlpha = 1;
      }
    }
    /* Paliers 10 à 14 (niveaux 50, 60, 70, 80, 90) : couronnement de plus en plus monumental (halo, étendards, faisceau, anneaux, couronne d'orbes). Aucun effet sur les revenus. */
    function tierFxTop(b, tier, hh, bx, bw, z, pu) {
      var x = b.x, y = b.y, w = b.w, d = b.d, ac = ACC[b.lot.act] || "#e3c680", cx = bx + bw / 2, cy = y + d / 2, i, t = R.motion ? R.time : 0;
      var ca = px(cx, cy), cb = py(cx, cy, hh + 30);
      if (tier >= 10) {                                                                                         /* 50 · Sacré : quatre pylônes à orbes */
        [[bx - 4, y + d + 4], [bx + bw + 4, y + d + 4]].forEach(function (c2) { box(c2[0] - 3, c2[1] - 3, 6, 6, 40, 0, "#e8e2d2", "#f6f1e4", 1, { noShadow: true }); var oa = px(c2[0], c2[1]), ob = py(c2[0], c2[1], 46); ctx.fillStyle = ac; ctx.globalAlpha = 0.75 + 0.25 * pu; ctx.beginPath(); ctx.arc(oa, ob, 4.5, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; glow(oa, ob, 26, ac, 0.28); });
      }
      if (tier >= 11) {                                                                                         /* 60 · Souverain : étendards pendants sur la façade */
        onL(bx, y, d, 0, function () { for (var q = 0; q < 3; q++) { var fx = 10 + q * (bw - 24) / 2; ctx.fillStyle = "#8b2f3a"; ctx.fillRect(fx, Math.max(4, hh - 46), 7, 36); ctx.beginPath(); ctx.moveTo(fx, Math.max(4, hh - 46) + 36); ctx.lineTo(fx + 3.5, Math.max(4, hh - 46) + 30); ctx.lineTo(fx + 7, Math.max(4, hh - 46) + 36); ctx.fill(); ctx.fillStyle = "#e3c680"; ctx.fillRect(fx + 2, Math.max(4, hh - 46) + 6, 3, 3); ctx.fillRect(fx - 1, Math.max(4, hh - 46) - 2, 9, 2); } });
      }
      if (tier >= 12 && !R.low) {                                                                               /* 70 · Céleste : faisceau de lumière vertical + losanges flottants */
        var g = ctx.createLinearGradient(0, cb - 160, 0, cb); g.addColorStop(0, "rgba(255,244,200,0)"); g.addColorStop(1, "rgba(255,244,200,.28)"); ctx.fillStyle = g; ctx.fillRect(ca - 7, cb - 160, 14, 160);
        for (i = 0; i < 3; i++) { var dy = R.motion ? Math.sin(t * 1.4 + i * 2.1) * 5 : 0, ox = (i - 1) * 22; ctx.fillStyle = "#f6e3a8"; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(ca + ox, cb - 70 + dy - 6); ctx.lineTo(ca + ox + 4, cb - 70 + dy); ctx.lineTo(ca + ox, cb - 70 + dy + 6); ctx.lineTo(ca + ox - 4, cb - 70 + dy); ctx.fill(); ctx.globalAlpha = 1; }
      }
      if (tier >= 13) {                                                                                         /* 80 · Divin : anneaux de lumière concentriques */
        ctx.strokeStyle = ac; ctx.lineWidth = 1.6; for (i = 0; i < 2; i++) { ctx.globalAlpha = 0.5 - i * 0.18 + 0.1 * pu; ctx.beginPath(); ctx.ellipse(ca, cb - 20 - i * 16, 34 + i * 14, 11 + i * 4, 0, 0, 6.3); ctx.stroke(); } ctx.globalAlpha = 1;
      }
      if (tier >= 14) {                                                                                         /* 90+ · Absolu : couronne de cinq orbes et aura au sol */
        for (i = 0; i < 5; i++) { var an = (i / 5) * 6.2832 + (R.motion ? t * 0.5 : 0), ox2 = Math.cos(an) * 30, oy2 = Math.sin(an) * 9; ctx.fillStyle = "#fff4c8"; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(ca + ox2, cb - 56 + oy2, 3.2, 0, 6.3); ctx.fill(); glow(ca + ox2, cb - 56 + oy2, 18, ac, 0.3); } ctx.globalAlpha = 1;
        glow(px(cx, y + d), py(cx, y + d, 0), 150, ac, 0.2, true);
      }
    }
    /* ---------- constructions de quartier (C6) : une architecture par quartier, un accent par type ---------- */
    function dlotType(s, pl) { return BL.dbuild ? BL.dbuild.at(s, pl.did, pl.idx) : null; }
    function dlotH(pl, id) { var V = BL.venues && BL.venues.spec(id); return V ? V.h : 40; }   /* hauteur propre au type de lieu, la même dans tous les quartiers */
    /* ---------- lieux de quartier (BL.venues) : même description que les illustrations SVG ---------- */
    function vcol(c, acc, k) { c = c === "A" ? acc : c === "D" ? "#12151b" : c === "W" ? "#f3efe4" : c; return k === 1 || !/^#[0-9a-f]{6}$/i.test(c) ? c : sh(c, k); }
    function vShapes(list, acc, k, pu) {
      var ga = ctx.globalAlpha;
      list.forEach(function (q) {
        var a = q.a === "p" ? 0.55 + 0.45 * pu : q.a === undefined ? 1 : q.a; if (a <= 0) return; ctx.globalAlpha = ga * a; var col = vcol(q.f, acc, k);
        if (q.k === "r") { ctx.fillStyle = col; ctx.fillRect(q.x, q.y, q.w, q.h); }
        else if (q.k === "c") { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill(); }
        else if (q.k === "p") { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q.pts[0][0], q.pts[0][1]); for (var i = 1; i < q.pts.length; i++) ctx.lineTo(q.pts[i][0], q.pts[i][1]); ctx.closePath(); ctx.fill(); }
        else if (q.k === "l") { ctx.strokeStyle = col; ctx.lineWidth = q.lw; ctx.beginPath(); ctx.moveTo(q.x1, q.y1); ctx.lineTo(q.x2, q.y2); ctx.stroke(); }
        else if (q.k === "t") { ctx.save(); ctx.fillStyle = col; ctx.scale(1, -1); ctx.font = "800 " + q.s + "px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(q.t, q.x, -q.y); ctx.restore(); }
      });
      ctx.globalAlpha = ga;
    }
    function paintVenue(V, x0, y0, p, z, pu) {
      var detail = p >= 0.6 && z >= 0.38;
      V.ops.forEach(function (o) {
        if (o.o === "box") box(x0 + o.x, y0 + o.y, o.w, o.d, o.h * p, o.z * p, o.c, o.r, 1, { noShadow: !!o.ns || o.z > 0 });
        else if (o.o === "gab") gable(x0 + o.x, y0 + o.y, o.w, o.d, o.z * p, o.rh * p, o.c, o.r, 1);
        else if (!detail) return;
        else if (o.o === "fl") onL(x0 + o.x, y0 + o.y, o.d, o.z * p, function () { vShapes(o.sh, V.acc, 1, pu); });
        else if (o.o === "fr") onR(x0 + o.x, y0 + o.y, o.w, o.d, o.z * p, function () { vShapes(o.sh, V.acc, 0.78, pu); });
        else if (o.o === "top") onT(x0 + o.x, y0 + o.y, o.z * p, function () { vShapes(o.sh, V.acc, 1.1, pu); });
        else if (o.o === "glow") { if (!R.low && z > 0.3) glow(px(x0 + o.x, y0 + o.y), py(x0 + o.x, y0 + o.y, o.z * p), o.r, o.c, o.a * (0.8 + 0.2 * pu)); }
        else if (o.o === "man") { if (z > 0.5) person(x0 + o.x, y0 + o.y, o.c); }
      });
    }
    /* emblème flottant (pastille + pointe) : remplace le nom de l'activité écrit sur le bâtiment */
    function drawBadge(glyph, acc, X, Y, k, big, seed) {
      var rr = (big ? 17 : 14) * k, bob = R.motion && !R.low ? Math.sin(R.time * 2.2 + seed) * 3 * k : 0; Y -= bob;
      glow(X, Y, rr * 2.4, acc, 0.28);
      ctx.fillStyle = "#0d1014"; ctx.strokeStyle = acc; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.moveTo(X - 5 * k, Y + rr - 2 * k); ctx.lineTo(X, Y + rr + 8 * k); ctx.lineTo(X + 5 * k, Y + rr - 2 * k); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(X, Y, rr, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(X - rr * 0.62, Y + rr * 0.62); var sc = rr * 1.24 / 24; ctx.scale(sc, -sc); vShapes(BL.venues.glyph(glyph), acc, 1, 1); ctx.restore();
    }
    /* Partie 14 bis : pastille flottante du QG avec « QG » écrit dedans (comme les pastilles des lieux, mais en lettres) */
    function drawHqBadge(s, z, k) {
      var hb = null; model.buildings.forEach(function (q) { if (q.kind === "hq") hb = q; }); if (!hb) return; var cx = hb.x + hb.w / 2, cy = hb.y + hb.d / 2, X = px(cx, cy), Y = py(cx, cy, hqH(s) + 34 * 1) - 8 * k, rr = 19 * k, acc = "#e3c680", bob = R.motion && !R.low ? Math.sin(R.time * 2.2 + 5) * 3 * k : 0; Y -= bob;
      glow(X, Y, rr * 2.4, acc, 0.3);
      ctx.fillStyle = "#0d1014"; ctx.strokeStyle = acc; ctx.lineWidth = 2.4 * k; ctx.beginPath(); ctx.moveTo(X - 6 * k, Y + rr - 2 * k); ctx.lineTo(X, Y + rr + 9 * k); ctx.lineTo(X + 6 * k, Y + rr - 2 * k); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(X, Y, rr, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.font = "700 " + Math.round(rr * 0.95) + "px Oxanium, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("QG", X, Y + 1 * k); ctx.textBaseline = "alphabetic";
    }
    function drawBadges(s, z) {
      if (!R.layers.labels || !BL.venues) return; var k = Math.max(1, Math.min(2.2, 0.95 / Math.max(0.3, z))); drawHqBadge(s, z, k);
      (model.dplots || []).forEach(function (pl) {
        if (T.lv(s, pl.did) < 1) return; var id = dlotType(s, pl), V = id && BL.venues.spec(id); if (!V) return; var a0 = R.anim[pl.id]; if (a0 !== undefined && R.time - a0 < 1.4) return;
        var cx = pl.x + pl.w / 2, cy = pl.y + pl.d / 2; drawBadge(V.badge, V.acc, px(cx, cy), py(cx, cy, V.h) - 30 * k, k, V.important, pl.idx * 13 + pl.cell);
      });
      model.lots.forEach(function (l) {
        if (!bt(s, l)) return; var B = BL.venues.actBadge(l.act), cx = l.x + l.w / 2, cy = l.y + l.d / 2; drawBadge(B.glyph, B.acc, px(cx, cy), py(cx, cy, lotH(l, LV(s, l))) - 30 * k, k, false, l.x + l.y);
      });
    }
    function drawDLot(b, s, z, hov, sel) {
      var pl = b.dlot, id = dlotType(s, pl), x = b.x, y = b.y, w = b.w, d = b.d, pal = M.PAL[pl.did] || M.PAL.hq, PL = R.placement, ghost = false;
      var ctl = T.lv(s, pl.did) > 0;
      if (!id && PL && PL.ghost === b.id) { id = PL.type; ghost = true; }
      if (!id && PL && PL.valid) {                          /* mode placement : terrains valides en vert qui pulse, les autres s'effacent */
        var okp = !!PL.valid[b.id], pa = R.motion ? 0.55 + 0.45 * Math.sin(R.time * 4) : 0.8;
        if (okp) { ctx.globalAlpha = 0.22 + 0.2 * pa; diamond(x - 4, y - 4, w + 8, d + 8, 0, "#7fd39a"); ctx.globalAlpha = 1; ctx.setLineDash([10, 6]); diamond(x - 4, y - 4, w + 8, d + 8, 0, null, "rgba(127,211,154," + (0.6 + 0.4 * pa).toFixed(2) + ")", 3); ctx.setLineDash([]);
          var cx1 = px(x + w / 2, y + d / 2), cy1 = py(x + w / 2, y + d / 2, 0); ctx.strokeStyle = "#bff0cf"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx1 - 11, cy1 - 6); ctx.lineTo(cx1 + 11, cy1 - 6); ctx.moveTo(cx1, cy1 - 17); ctx.lineTo(cx1, cy1 + 5); ctx.stroke(); }
        else { ctx.globalAlpha = 0.45; diamond(x - 4, y - 4, w + 8, d + 8, 0, "rgba(255,255,255,.02)", "rgba(120,126,138,.3)", 1.5); ctx.globalAlpha = 1; }
        return;
      }
      if (!id) {                                           /* terrain libre : clôture et marque « + » si le quartier t'appartient */
        diamond(x - 4, y - 4, w + 8, d + 8, 0, ctl ? "rgba(200,164,94,.10)" : "rgba(255,255,255,.03)"); ctx.setLineDash([10, 8]); diamond(x - 4, y - 4, w + 8, d + 8, 0, null, ctl ? (hov || sel ? "#e3c680" : "rgba(200,164,94,.6)") : "rgba(120,126,138,.35)", 2); ctx.setLineDash([]);
        var cx0 = px(x + w / 2, y + d / 2), cy0 = py(x + w / 2, y + d / 2, 0);
        if (ctl) { var bob = R.motion ? Math.sin(R.time * 2 + pl.idx) * 2 : 0; ctx.strokeStyle = "rgba(227,198,128,.85)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx0 - 11, cy0 - 6 + bob); ctx.lineTo(cx0 + 11, cy0 - 6 + bob); ctx.moveTo(cx0, cy0 - 17 + bob); ctx.lineTo(cx0, cy0 + 5 + bob); ctx.stroke();
          if (z > 0.5) { ctx.fillStyle = "rgba(236,232,223,.8)"; ctx.font = "600 13px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText("Terrain libre", cx0, cy0 + 22); } }
        else { ctx.strokeStyle = "rgba(150,156,168,.5)"; ctx.lineWidth = 2; ctx.strokeRect(cx0 - 8, cy0 - 9, 16, 12); ctx.beginPath(); ctx.arc(cx0, cy0 - 9, 5, Math.PI, 0); ctx.stroke(); }
        return;
      }
      var V = BL.venues && BL.venues.spec(id); if (!V) return;                              /* C3 : un seul dessin par type de lieu, identique dans tous les quartiers */
      var a0 = R.anim[b.id], p = a0 === undefined ? 1 : ease((R.time - a0) / 1.4), h = V.h * p, pu = pulse(b.seed);
      dk = 1; SGN = 1; if (ghost) { p = 1; h = V.h; ctx.globalAlpha = 0.72; }
      diamond(x - 6, y - 6, w + 12, d + 12, 0, ghost ? "rgba(127,211,154,.25)" : "#222831", ghost ? "#7fd39a" : "#2c333d", 2);
      if (V.important && !ghost && z > 0.3) { var ha = ctx.globalAlpha; ctx.globalAlpha = ha * (0.55 + 0.25 * pu); ctx.globalAlpha = ha * 0.10; /* Partie 14 : plus de contour doré autour des lieux importants (il coupait les façades) ; seul reste un halo de sol très léger */ diamond(x - 12, y - 12, w + 24, d + 24, 0, V.acc); ctx.globalAlpha = ha; }
      paintVenue(V, x, y, p, z, pu);
      if (p < 1) { ctx.strokeStyle = "rgba(241,194,75,.85)"; ctx.lineWidth = 2; [[x, y + d], [x + w, y + d], [x + w, y]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(px(c[0], c[1]), py(c[0], c[1], 0)); ctx.lineTo(px(c[0], c[1]), py(c[0], c[1], h)); ctx.stroke(); }); }
      if (ghost) ctx.globalAlpha = 1;
      if (sel || hov) outline(x, y, w, d, h + 6, sel);
    }
    function silhouette(x, y, w, d, h) { var p = function (X, Y, Z) { return [px(X, Y), py(X, Y, Z)]; }; return [p(x, y, h), p(x + w, y, h), p(x + w, y, 0), p(x + w, y + d, 0), p(x, y + d, 0), p(x, y + d, h)]; }
    function outline(x, y, w, d, h, sel) { var sil = silhouette(x, y, w, d, h + 6); ctx.strokeStyle = sel ? "#e3c680" : "rgba(236,232,223,.85)"; ctx.lineWidth = sel ? 3 : 2; ctx.globalAlpha = sel ? 0.65 + 0.35 * Math.sin(R.time * 4) : 1; poly(sil, null, ctx.strokeStyle, ctx.lineWidth); ctx.globalAlpha = 1; diamond(x - 6, y - 6, w + 12, d + 12, 0, sel ? "rgba(227,198,128,.12)" : "rgba(255,255,255,.06)", sel ? "rgba(227,198,128,.8)" : "rgba(255,255,255,.4)", 2); }
    function drawHQ(b, s, z, hov, sel) {
      var h = hqH(s), x = b.x, y = b.y, w = b.w, d = b.d, pu = pulse(5); diamond(x - 10, y - 10, w + 20, d + 40, 0, "#252b34", "#303844", 2);
      var sty = hqSty(s);
      if (sty !== "classic") {
        var VS = BL.venues.hqSpec(sty); paintVenue(VS, x, y, 1, z, pu); var tr = BL.hq.tier(s);
        if (tr >= 2 && !R.low) hqGlow(x + w / 2, y + d / 2, h * 0.7, 70, VS.acc === "#e0394f" ? "rgba(224,57,79,A)" : "rgba(255,225,150,A)", 0.12 + 0.06 * pu);
        if (tr >= 4 && R.motion && !R.low) { var bx = px(x + w / 2, y + d / 2), by = py(x + w / 2, y + d / 2, h); var gg = ctx.createLinearGradient(bx, by, bx, by - 150); gg.addColorStop(0, "rgba(246,227,168,.3)"); gg.addColorStop(1, "rgba(246,227,168,0)"); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx - 30, by - 150); ctx.lineTo(bx + 30, by - 150); ctx.lineTo(bx + 5, by); ctx.closePath(); ctx.fill(); }
        if (sel || hov) outline(x, y, w, d, h + 6, sel); return;
      }
      box(x, y, w, d, h, 0, "#6a4638", "#2e333d", 1);
      winGrid("L", x, y, w, d, 0, h, 0, w, 5, "#f6e3a8", 0.85, 1, z, 22); winGrid("R", x, y, w, d, 0, h, 0, d, 9, "#f6e3a8", 0.7, 1, z, 22);
      onL(x, y, d, 0, function () { ctx.fillStyle = "#1a1410"; ctx.fillRect(w / 2 - 12, 0, 24, 22); ctx.fillStyle = "#c8a45e"; ctx.fillRect(w / 2 - 14, 22, 28, 3); glow(w / 2, 11, 30, "#f6e3a8", 0.5); ctx.fillStyle = "rgba(80,48,36,.9)"; ctx.fillRect(0, h - 5, w, 5); signText("QG", w / 2 - 14, h - 22, 28, 14, "#c8a45e"); });
      box(x + w * 0.18, y + d * 0.2, w * 0.64, d * 0.6, 16, h, "#5a3a2e", "#2a2f38", 1, { noShadow: true });
      var ax = px(x + 14, y + 14), ay = py(x + 14, y + 14, h + 16); ctx.strokeStyle = "#8a8f99"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 36); ctx.stroke(); ctx.fillStyle = "#c8a45e"; var wv = R.motion ? Math.sin(R.time * 3) * 2 : 0; ctx.beginPath(); ctx.moveTo(ax, ay - 36); ctx.lineTo(ax + 22 + wv, ay - 31); ctx.lineTo(ax, ay - 24); ctx.fill();
      person(x + w / 2 - 22, y + d + 10, "#c8a45e"); person(x + w / 2 + 24, y + d + 12, "#d8d4c8");
      hqTier(s, x, y, w, d, h, pu);
      if (sel || hov) outline(x, y, w, d, h + 16, sel);
    }
    /* l'extérieur du QG évolue avec les améliorations de la pièce (niveau 0 à 4) */
    function hqGlow(wx, wy, z, r, col, a) { var X = px(wx, wy), Y = py(wx, wy, z), g = ctx.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0)); ctx.fillStyle = g; ctx.fillRect(X - r, Y - r, r * 2, r * 2); }
    function hqTier(s, x, y, w, d, h, pu) {
      var tr = BL.hq ? BL.hq.tier(s) : 0; if (tr < 1) return;
      box(x - 2, y - 2, w + 4, d + 4, 4, h - 4, "#c8a45e", "#8f7640", 1, { noShadow: true });                                           /* corniche dorée */
      if (tr >= 2) {
        diamond(x + w / 2 - 14, y + d + 2, 28, 46, 0, "#7a1f2a", "#c8a45e", 1.5);                                                      /* tapis rouge */
        onL(x, y, d, 0, function () { [0.1, 0.9].forEach(function (k) { ctx.fillStyle = "#8a8f99"; ctx.fillRect(w * k - 1.5, 0, 3, 30); ctx.fillStyle = "#f6e3a8"; ctx.beginPath(); ctx.arc(w * k, 33, 4, 0, 6.3); ctx.fill(); glow(w * k, 33, 34, "#f6e3a8", 0.45 + 0.1 * pu); }); });
      }
      if (tr >= 3) { box(x + w * 0.3, y + d * 0.3, w * 0.4, d * 0.4, 14, h + 16, "#c8a45e", "#6f5b32", 1, { noShadow: true }); hqGlow(x + w / 2, y + d / 2, h + 34, 60, "rgba(255,225,150,A)", 0.25 + 0.1 * pu); }
      if (tr >= 4) {
        box(x + w * 0.4, y + d * 0.4, w * 0.2, d * 0.2, 10, h + 30, "#e8cd8a", "#a98943", 1, { noShadow: true }); var cx = px(x + w / 2, y + d / 2), cy = py(x + w / 2, y + d / 2, h + 42);
        var g = ctx.createLinearGradient(cx, cy, cx, cy - 150); g.addColorStop(0, "rgba(246,227,168,.38)"); g.addColorStop(1, "rgba(246,227,168,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 34, cy - 150); ctx.lineTo(cx + 34, cy - 150); ctx.lineTo(cx + 6, cy); ctx.closePath(); ctx.fill(); hqGlow(x + w / 2, y + d / 2, h + 44, 80, "rgba(255,230,160,A)", 0.4 + 0.15 * pu);
      }
    }
    function drawPlot(l, s, z, hov, sel) {
      var a = D.activities[l.ai], unl = E.actUnlocked(s, a), x = l.x - 4, y = l.y - 4, w = l.w + 8, d = l.d + 40;
      diamond(x, y, w, d, 0, unl ? "rgba(200,164,94,.09)" : "rgba(255,255,255,.025)"); ctx.setLineDash([10, 8]); diamond(x, y, w, d, 0, null, unl ? (hov || sel ? "#e3c680" : "rgba(200,164,94,.6)") : "rgba(120,126,138,.35)", 2); ctx.setLineDash([]);
      var cx = px(x + w / 2, y + d / 2), cy = py(x + w / 2, y + d / 2, 0);
      if (unl) { var bob = R.motion ? Math.sin(R.time * 2 + l.ai) * 2 : 0; ctx.strokeStyle = "rgba(227,198,128,.85)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 12, cy - 6 + bob); ctx.lineTo(cx + 12, cy - 6 + bob); ctx.moveTo(cx, cy - 18 + bob); ctx.lineTo(cx, cy + 6 + bob); ctx.stroke();
        if (z > 0.45) { ctx.fillStyle = "rgba(236,232,223,.8)"; ctx.font = "600 13px IBM Plex Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(E.buildings(s, l.act) === l.idx && E.best(s, l.act) >= l.need ? "À construire" : "Niveau " + l.need + " requis", cx, cy + 22); } }
      else { ctx.strokeStyle = "rgba(150,156,168,.6)"; ctx.lineWidth = 3; ctx.strokeRect(cx - 9, cy - 10, 18, 14); ctx.beginPath(); ctx.arc(cx, cy - 10, 6, Math.PI, 0); ctx.stroke(); }
    }

    function groundPass(c, X0, Y0, X1, Y1, z) {
      ctx = c; var cs = model.cells, CE = M.CELL, RD = M.ROAD, k;
      var vis = function (x, y, w, d, up) { var a = px(x, y + d), b = px(x + w, y), t = py(x, y, up || 0), bt = py(x + w, y + d, 0); return !(b < X0 - 10 || a > X1 + 10 || bt < Y0 - 10 || t > Y1 + 10); };
      /* sol : asphalte, îlots, trottoirs, parcs */
      var land = [], k;
      for (k = 0; k < cs.length; k++) { var cl = cs[k]; if (!cl.land) continue; var cx0 = cl.c * CE, cy0 = cl.r * CE; if (!vis(cx0, cy0, CE, CE, 240)) continue; land.push(cl); diamond(cx0, cy0, CE, CE, 0, "#10141a"); }
      land.forEach(function (cl) { var cx0 = cl.c * CE, cy0 = cl.r * CE, l = lum(cl.district); var ne = [[cl.c, cl.r - 1], [cl.c + 1, cl.r], [cl.c, cl.r + 1], [cl.c - 1, cl.r]].map(function (p) { return M.isLand(p[0], p[1]); });
        diamond(cl.x - 3, cl.y - 3, cl.size + 6, cl.size + 6, 0, "#303844");                                                    /* bordure de trottoir */
        diamond(cl.x, cl.y, cl.size, cl.size, 0, sh("#2b323c", l));                                                              /* trottoir */
        diamond(cl.x + 6, cl.y + 6, cl.size - 12, cl.size - 12, 0, cl.deco === "park" ? sh("#16301f", l) : cl.deco === "plaza" ? sh("#2a303a", l) : sh(cl.district === "hq" ? "#1e242c" : "#1a1f26", l));
        if (!ne[0] || !ne[1] || !ne[2] || !ne[3]) { ctx.lineWidth = 5; ctx.strokeStyle = "#3a4452"; [[0, cl.x, cl.y, cl.x + cl.size, cl.y], [1, cl.x + cl.size, cl.y, cl.x + cl.size, cl.y + cl.size], [2, cl.x, cl.y + cl.size, cl.x + cl.size, cl.y + cl.size], [3, cl.x, cl.y, cl.x, cl.y + cl.size]].forEach(function (e) { if (ne[e[0]]) return; ctx.beginPath(); ctx.moveTo(px(e[1], e[2]), py(e[1], e[2], 0)); ctx.lineTo(px(e[3], e[4]), py(e[3], e[4], 0)); ctx.stroke(); }); }
      });
      if (z > 0.35) { ctx.lineWidth = 2; ctx.strokeStyle = "#39404a"; ctx.setLineDash([14, 14]); ctx.beginPath(); model.edges.forEach(function (e) { var mx = Math.min(e.x1, e.x2), my = Math.min(e.y1, e.y2); if (!vis(mx, my, Math.abs(e.x2 - e.x1) + 1, Math.abs(e.y2 - e.y1) + 1, 0)) return; if (e.y1 === e.y2) { ctx.moveTo(px(e.x1 + RD / 2, e.y1), py(e.x1 + RD / 2, e.y1, 0)); ctx.lineTo(px(e.x2 - RD / 2, e.y2), py(e.x2 - RD / 2, e.y2, 0)); } else { ctx.moveTo(px(e.x1, e.y1 + RD / 2), py(e.x1, e.y1 + RD / 2, 0)); ctx.lineTo(px(e.x2, e.y2 - RD / 2), py(e.x2, e.y2 - RD / 2, 0)); } }); ctx.stroke(); ctx.setLineDash([]);
        if (z > 0.55) { ctx.fillStyle = "rgba(220,220,210,.28)"; model.edges.forEach(function (e) { var mx = Math.min(e.x1, e.x2), my = Math.min(e.y1, e.y2); if (!vis(mx, my, Math.abs(e.x2 - e.x1) + 1, Math.abs(e.y2 - e.y1) + 1, 0)) return; if (!activeSet[e.i] && (R.rv[model.cells[e.cellIdx[0]].district] || 0) < 0.9) return;
          var horiz = e.y1 === e.y2; [0.04, 0.96].forEach(function (t) { for (var q = -2; q <= 2; q++) { if (horiz) { var X = e.x1 + (e.x2 - e.x1) * t + (t < 0.5 ? 10 : -10), Y = e.y1 + q * 7; diamond(X - 2, Y - 2, 4, 5, 0, "rgba(220,220,210,.28)"); } else { var X2 = e.x1 + q * 7, Y2 = e.y1 + (e.y2 - e.y1) * t + (t < 0.5 ? 10 : -10); diamond(X2 - 2.5, Y2 - 2, 5, 4, 0, "rgba(220,220,210,.28)"); } } }); }); } }
      /* halos de lampadaires au sol */
      if (z > 0.5) lampList.forEach(function (o) { if (lum(o.d) < 0.9 || !vis(o.x - 30, o.y - 30, 60, 60, 0)) return; glow(px(o.x, o.y), py(o.x, o.y, 0), R.decor.lamps === "lamp_gold" ? 52 : 38, lampCol(o), 0.17, true); });
      /* brume des quartiers (au sol), bordures, plots */
      land.forEach(function (cl) { var rv = R.rv[cl.district]; if (rv < 1) diamond(cl.c * CE, cl.r * CE, CE, CE, 0, "rgba(6,8,12," + (0.5 * (1 - rv)).toFixed(3) + ")"); });
      return land;
    }
    var gCache = null, gSig = "", GS = 1.5;
    /* ---------- dessin d'une image ---------- */
    R.draw = function (c, cam, vw, vh, s, ui) {
      ctx = c; var z = cam.z, X0 = cam.x, Y0 = cam.y, X1 = X0 + vw / z, Y1 = Y0 + vh / z, CE = M.CELL, RD = M.ROAD, i, j;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#091018"; ctx.fillRect(0, 0, vw, vh); ctx.setTransform(z, 0, 0, z, -X0 * z, -Y0 * z);
      var g = ctx.createLinearGradient(0, 0, 0, B.h), am = R.decor.ambiance, AT = atmosOn() ? R.atmos.t : null; g.addColorStop(0, AT ? AT.sky[0] : am === "amb_dawn" ? "#3a2a3a" : am === "amb_dusk" ? "#2a1c3c" : am === "amb_neon" ? "#150a24" : "#0b1520"); g.addColorStop(1, AT ? AT.sky[1] : am === "amb_dawn" ? "#6a4a3a" : am === "amb_dusk" ? "#4a2a2a" : am === "amb_neon" ? "#0a1830" : "#0a1c27"); ctx.fillStyle = g; ctx.fillRect(X0 - 5, Y0 - 5, X1 - X0 + 10, Y1 - Y0 + 10); if (am === "amb_stars" || am === "amb_neon" || (AT && AT.stars)) drawStars(X0, Y0, X1, Y1);
      var cs = model.cells, vis = function (x, y, w, d, up) { var a = px(x, y + d), b = px(x + w, y), t = py(x, y, up || 0), bt = py(x + w, y + d, 0); return !(b < X0 - 10 || a > X1 + 10 || bt < Y0 - 10 || t > Y1 + 10); };
      var land, sig = "";
      if (z <= 1.5 && typeof document !== "undefined") {
        Object.keys(R.rv).forEach(function (id) { sig += Math.round(R.rv[id] * 20) + ","; }); sig += activeEdges.length + (R.low ? "L" : "");
        if (!gCache) { gCache = document.createElement("canvas"); gCache.width = Math.ceil(B.w * GS); gCache.height = Math.ceil(B.h * GS); }
        if (sig !== gSig) { gSig = sig; var gc = gCache.getContext("2d"); gc.setTransform(1, 0, 0, 1, 0, 0); gc.clearRect(0, 0, gCache.width, gCache.height); gc.setTransform(GS, 0, 0, GS, 0, 0); groundPass(gc, 0, 0, B.w, B.h, 1); ctx = c; }
        ctx = c; var sx0 = Math.max(0, X0), sy0 = Math.max(0, Y0), sx1 = Math.min(B.w, X1), sy1 = Math.min(B.h, Y1); if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(gCache, sx0 * GS, sy0 * GS, (sx1 - sx0) * GS, (sy1 - sy0) * GS, sx0, sy0, sx1 - sx0, sy1 - sy0); land = cs.filter(function (q) { return q.land; });
      } else land = groundPass(c, X0, Y0, X1, Y1, z);
      ctx = c;
      land.forEach(function (cl) { if (cl.district === "hq") return; var st0 = ui.dstate[cl.district]; var f0 = st0 === "controlled" ? "rgba(214,174,90,.13)" : st0 === "contested" ? "rgba(217,100,90,.12)" : st0 === "locked" ? "rgba(8,10,16,.16)" : null; if (f0) diamond(cl.c * CE, cl.r * CE, CE, CE, 0, f0, null, 0); });
      ctx.lineWidth = 3; var dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]], prs = {};
      if (BL.rivals && s && s.rivals) BL.rivals.list(s).forEach(function (e) { prs[e.did] = e; });   /* C8 : quartiers sous pression rivale */
      land.forEach(function (cl) { if (cl.district === "hq") return; var st = ui.dstate[cl.district], pr = st === "controlled" ? prs[cl.district] : null;
        dirs.forEach(function (dd, n) { var nr = M.isLand(cl.c + dd[0], cl.r + dd[1]) ? cs[(cl.r + dd[1]) * M.COLS + cl.c + dd[0]] : null; if (nr && nr.district === cl.district) return; var x0 = cl.c * CE, y0 = cl.r * CE, a, b2;
          /* Partie 14 : les limites de quartier ne masquent plus les bâtiments. Par défaut, seules restent visibles les alertes (quartier disputé, pression rivale) et le quartier survolé ou sélectionné ; le calque « Limites des quartiers » rend tout. */
          if (!R.layers.borders && !pr && st !== "contested" && !(ui.sel && ui.sel.type === "district" && ui.sel.id === cl.district) && !(ui.hover && ui.hover.type === "district" && ui.hover.id === cl.district)) return;
          if (n === 0) { a = [x0, y0]; b2 = [x0 + CE, y0]; } else if (n === 1) { a = [x0 + CE, y0]; b2 = [x0 + CE, y0 + CE]; } else if (n === 2) { a = [x0, y0 + CE]; b2 = [x0 + CE, y0 + CE]; } else { a = [x0, y0]; b2 = [x0, y0 + CE]; }
          ctx.strokeStyle = st === "controlled" ? "rgba(200,164,94,.9)" : st === "contested" ? "rgba(217,100,90," + (0.5 + 0.5 * Math.sin(R.time * 5)).toFixed(2) + ")" : st === "available" ? "rgba(200,164,94,.55)" : "rgba(90,98,112,.4)"; ctx.setLineDash(st === "available" ? [14, 10] : pr ? [20, 9] : []);
          if (pr) { ctx.strokeStyle = pr.lvl === "threat" ? "rgba(232,112,74," + (0.6 + 0.4 * Math.sin(R.time * 4)).toFixed(2) + ")" : "rgba(236,176,84,.95)"; }
          ctx.beginPath(); ctx.moveTo(px(a[0], a[1]), py(a[0], a[1], 0)); ctx.lineTo(px(b2[0], b2[1]), py(b2[0], b2[1], 0)); ctx.stroke(); }); });
      ctx.setLineDash([]);
      if (ui.sel && ui.sel.type === "district") { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(R.time * 4); model.districts[ui.sel.id].cells.forEach(function (ci) { var q = cs[ci]; diamond(q.c * CE + 8, q.r * CE + 8, CE - 16, CE - 16, 0, "rgba(236,232,223,.07)", "rgba(236,232,223,.9)", 3); }); ctx.globalAlpha = 1; }
      var hv = ui.hover, sel = ui.sel;
      model.lots.forEach(function (l) { if (!bt(s, l) && vis(l.x - 10, l.y - 10, l.w + 20, l.d + 50, 0)) drawPlot(l, s, z, hv && hv.type === "lot" && hv.id === l.id, sel && sel.type === "lot" && sel.act === l.act); });
      /* objets triés en profondeur : statiques + voitures + piétons */
      var dyn = []; R.cars.forEach(function (c2) { var p = carPos(c2); dyn.push({ k: p.x + p.y + 10, t: "car", c: c2, p: p }); }); R.walkers.forEach(function (w) { var p = walkPos(w); dyn.push({ k: p.x + p.y, t: "walker", w: w, p: p }); }); if (R.layers.traffic) { (R.blocks || []).forEach(function (bk) { dyn.push({ k: bk.x + bk.y, t: "blk", b: bk }); }); if (R.heli) dyn.push({ k: 1e9, t: "heli" }); }
      dyn.sort(function (a, b) { return a.k - b.k; }); var di = 0, st2 = statics;
      function drawDyn(o) {
        if (o.t === "car") { var p = o.p, horiz = p.dx !== 0, L = 26, Wd = 12, cx = horiz ? p.x - L / 2 : p.x - Wd / 2, cy = horiz ? p.y - Wd / 2 : p.y - L / 2; if (px(p.x, p.y) < X0 - 40 || px(p.x, p.y) > X1 + 40 || py(p.x, p.y, 0) < Y0 - 40 || py(p.x, p.y, 0) > Y1 + 40) return;
          if (z > 0.4) { var hx = p.x + p.dx * 14, hy = p.y + p.dy * 14; glow(px(hx, hy), py(hx, hy, 3), 34, "rgba(246,231,176,.7)", 0.55); }
          box(horiz ? cx : cx, cy, horiz ? L : Wd, horiz ? Wd : L, 7, 2, o.c.col, sh(o.c.col, 1.15), 1, { noShadow: true }); box(horiz ? cx + 6 : cx + 2, horiz ? cy + 2 : cy + 6, horiz ? 11 : 8, horiz ? 8 : 11, 5, 9, "#1b2028", "#2a323d", 1, { noShadow: true });
          ctx.fillStyle = "#f6e7b0"; var f1 = px(p.x + p.dx * 12 + (horiz ? 0 : -3), p.y + p.dy * 12 + (horiz ? -3 : 0)), f2 = py(p.x + p.dx * 12 + (horiz ? 0 : -3), p.y + p.dy * 12 + (horiz ? -3 : 0), 6); ctx.fillRect(f1 - 1.5, f2 - 1.5, 3, 3);
          if (o.c.pol || o.c.amb) { var fl = Math.sin(R.time * 12 + o.c.ph) > 0, lx = px(p.x, p.y), ly = py(p.x, p.y, 13), c1 = o.c.pol ? "#ff3b3b" : "#ff3b3b", c2 = o.c.pol ? "#4a78ff" : "#ffffff"; ctx.fillStyle = fl ? c1 : "#3a2a2a"; ctx.fillRect(lx - 5, ly - 1.5, 4, 3); ctx.fillStyle = fl ? "#2a3550" : c2; ctx.fillRect(lx + 1, ly - 1.5, 4, 3); if (z > 0.35) glow(lx + (fl ? -3 : 3), ly, 40, fl ? "rgba(255,70,70,.9)" : o.c.pol ? "rgba(80,120,255,.9)" : "rgba(255,255,255,.8)", 0.7); if (o.c.amb) { ctx.fillStyle = "#d4443a"; ctx.fillRect(lx - 1, ly + 3, 2, 6); ctx.fillRect(lx - 3, ly + 5, 6, 2); } } }
        else if (o.t === "blk") { var bk = o.b, bx = px(bk.x, bk.y), by = py(bk.x, bk.y, 0); if (bx < X0 - 30 || bx > X1 + 30 || by < Y0 - 30 || by > Y1 + 40) return; var f3 = Math.sin(R.time * 10 + bk.ph) > 0;
          ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(bx, by + 2, 15, 4, 0, 0, 6.3); ctx.fill(); for (var bi = -1; bi <= 1; bi += 2) { ctx.fillStyle = "#e6e6e6"; ctx.fillRect(bx + bi * 9 - 6, by - 7, 12, 5); ctx.fillStyle = "#d4443a"; ctx.fillRect(bx + bi * 9 - 6, by - 7, 4, 5); ctx.fillRect(bx + bi * 9 + 2, by - 7, 4, 5); ctx.fillStyle = "#8a8f99"; ctx.fillRect(bx + bi * 9 - 5, by - 2, 2, 4); ctx.fillRect(bx + bi * 9 + 3, by - 2, 2, 4); }
          ctx.fillStyle = f3 ? "#ff3b3b" : "#4a78ff"; ctx.fillRect(bx - 2, by - 12, 4, 4); if (z > 0.35) glow(bx, by - 10, 36, f3 ? "rgba(255,70,70,.9)" : "rgba(80,120,255,.9)", 0.65); }
        else if (o.t === "heli") { var hl = R.heli, u2 = Math.min(1, hl.t / hl.dur), hx = hl.x0 + (hl.x1 - hl.x0) * u2, hy = hl.y0 + (hl.y1 - hl.y0) * u2, sx = px(hx, hy), sy = py(hx, hy, 120); if (sx < X0 - 120 || sx > X1 + 120 || sy > Y1 + 260 || sy < Y0 - 80) return;
          var gx = px(hx + 26, hy + 26), gy = py(hx + 26, hy + 26, 0); if (z > 0.3) { var cg = ctx.createLinearGradient(sx, sy, gx, gy); cg.addColorStop(0, "rgba(255,255,230,.34)"); cg.addColorStop(1, "rgba(255,255,230,.06)"); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(gx - 34, gy); ctx.lineTo(gx + 34, gy); ctx.closePath(); ctx.fill(); ctx.fillStyle = "rgba(255,255,230,.16)"; ctx.beginPath(); ctx.ellipse(gx, gy, 36, 14, 0, 0, 6.3); ctx.fill(); }
          ctx.fillStyle = "#1a1f27"; ctx.beginPath(); ctx.ellipse(sx, sy, 11, 5, 0, 0, 6.3); ctx.fill(); ctx.fillRect(sx - 20, sy + 1, 14, 2.4); var rot = Math.sin(R.time * 40) * 16; ctx.fillRect(sx - rot, sy - 6, rot * 2, 1.4); ctx.fillStyle = Math.sin(R.time * 6) > 0 ? "#ff3b3b" : "#2a2a2a"; ctx.fillRect(sx - 1, sy + 4, 2.4, 2.4); }
        else { var q = o.p; if (px(q.x, q.y) < X0 - 20 || px(q.x, q.y) > X1 + 20 || py(q.x, q.y, 0) < Y0 - 30 || py(q.x, q.y, 0) > Y1 + 20) return; if (lum(model.cells[o.w.cell].district) < 0.9) return; person(q.x, q.y, o.w.col); if (o.w.cop) { var cx2 = px(q.x, q.y), cy2 = py(q.x, q.y, 0); ctx.fillStyle = "#111826"; ctx.fillRect(cx2 - 3, cy2 - 15, 6, 2.4); } }
      }
      for (i = 0; i < st2.length; i++) {
        var o = st2[i]; while (di < dyn.length && dyn[di].k <= o.k) drawDyn(dyn[di++]);
        if (o.t === "b") { var b = o.b, hh = (b.kind === "decor" ? b.h : 150); if (px(b.x + b.w, b.y) < X0 - 20 || px(b.x, b.y + b.d) > X1 + 20 || py(b.x, b.y, hh) > Y1 + 20 || py(b.x + b.w, b.y + b.d, 0) < Y0 - 20) continue;
          if (b.kind === "decor") drawDecorFast(b, z, s); else if (b.kind === "dlot") drawDLot(b, s, z, hv && hv.type === "dlot" && hv.id === b.id, sel && sel.type === "dlot" && sel.id === b.id); else if (b.kind === "hq") drawHQ(b, s, z, hv && hv.type === "hq", sel && sel.type === "hq");
          else if (isBuilt(b, s)) drawLot(b, s, z, hv && hv.type === "lot" && hv.id === b.lot.id, sel && sel.type === "lot" && sel.act === b.lot.act && sel.id === b.lot.id); }
        else if (o.t === "lamp") { if (px(o.x, o.y) > X0 - 30 && px(o.x, o.y) < X1 + 30 && py(o.x, o.y, 0) > Y0 - 10 && py(o.x, o.y, 0) < Y1 + 50) lampPost(o, z); }
        else if (o.t === "tree") { if (px(o.x, o.y) > X0 - 30 && px(o.x, o.y) < X1 + 30 && py(o.x, o.y, 0) > Y0 - 10 && py(o.x, o.y, 0) < Y1 + 60) tree(o); }
        else if (o.t === "fountain") { var fx = px(o.x, o.y), fy = py(o.x, o.y, 0); ctx.fillStyle = "#3a4452"; ctx.beginPath(); ctx.ellipse(fx, fy, 26, 13, 0, 0, 6.3); ctx.fill(); var gf = R.decor.urban === "urb_fountain"; if (gf) { ctx.fillStyle = "#8f7640"; ctx.beginPath(); ctx.ellipse(fx, fy, 27, 13.5, 0, 0, 6.3); ctx.fill(); glow(fx, fy - 6, 46, "#ffd66b", 0.45); } ctx.fillStyle = gf ? "#c8a45e" : "#1c4a5c"; ctx.beginPath(); ctx.ellipse(fx, fy - 1, 22, 10.5, 0, 0, 6.3); ctx.fill(); if (R.motion) { ctx.strokeStyle = "rgba(160,220,235," + (0.6 - (R.time % 1) * 0.5) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(fx, fy - 1, 6 + (R.time % 1) * 15, 3 + (R.time % 1) * 7, 0, 0, 6.3); ctx.stroke(); } ctx.fillStyle = gf ? "#ffe9a8" : "#6fb3c2"; ctx.fillRect(fx - 1.5, fy - 14, 3, 12); }
      }
      while (di < dyn.length) drawDyn(dyn[di++]);
      /* effets : poussière, revenus, ondes, étiquettes */
      R.dust.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life) * 0.55; ctx.fillStyle = "#b8b0a0"; ctx.beginPath(); ctx.arc(px(p.x, p.y), py(p.x, p.y, p.z), 4 + (1 - p.life) * 7, 0, 6.3); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.textAlign = "center"; ctx.font = "700 19px IBM Plex Sans, sans-serif"; R.floaters.forEach(function (f) { var k2 = f.t / 2.2; ctx.globalAlpha = k2 < 0.15 ? k2 / 0.15 : 1 - Math.max(0, (k2 - 0.55) / 0.45); ctx.fillStyle = "#86c39b"; ctx.strokeStyle = "rgba(0,0,0,.9)"; ctx.lineWidth = 4; ctx.lineJoin = "round"; var fx2 = px(f.x, f.y), fy2 = py(f.x, f.y, f.z) - k2 * 48; ctx.strokeText(f.text, fx2, fy2); ctx.fillText(f.text, fx2, fy2); }); ctx.globalAlpha = 1;
      R.ripples.forEach(function (r) { var k3 = r.t / 0.7; ctx.strokeStyle = "rgba(227,198,128," + (1 - k3).toFixed(2) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(r.x, r.y, 8 + k3 * 50, (8 + k3 * 50) / 2, 0, 0, 6.3); ctx.stroke(); });
      Object.keys(model.districts).forEach(function (id) { if (id === "hq" || !R.layers.labels) return; var d = model.districts[id], dd = T.dist(id); if (!dd) return; var X = px(d.cx, d.cy), Y = py(d.cx, d.cy, 0); if (X < X0 - 200 || X > X1 + 200 || Y < Y0 - 100 || Y > Y1 + 100) return; var st3 = ui.dstate[id];
        var ls = Math.max(1, 15 / (20 * Math.max(0.2, z))); ctx.globalAlpha = 1; ctx.font = "700 " + Math.round(30 * ls) + "px IBM Plex Sans, sans-serif"; ctx.fillStyle = st3 === "contested" ? "#f0b5ab" : st3 === "controlled" ? "#e3c680" : "#ece8df"; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(4,6,10,.94)"; ctx.lineWidth = 7 * ls; var nm = dd.name.toUpperCase().split("").join(String.fromCharCode(8202)); ctx.strokeText(nm, X, Y - 120); ctx.fillText(nm, X, Y - 120);
        ctx.font = "600 " + Math.round(20 * ls) + "px IBM Plex Sans, sans-serif"; ctx.fillStyle = "#d3d6db"; var prl = st3 === "controlled" && BL.rivals ? BL.rivals.at(s, id) : null; if (prl) ctx.fillStyle = prl.lvl === "threat" ? "#f2a083" : "#f0cd8a"; var sub = (prl ? "▲ " + (prl.lvl === "threat" ? "Menace" : "Tension") + " · " + T.faction(prl.fid).name + " " + prl.p + " %" : st3 === "controlled" ? "Contrôle " + T.lv(s, id) + " / " + D.territory.params.maxControl : st3 === "contested" ? "Attaqué !" : st3 === "available" ? "À conquérir · " + R.money(dd.cost) : "Verrouillé"); ctx.lineWidth = 6 * ls; ctx.strokeText(sub, X, Y - 92 - 6 * (ls - 1) * 3); ctx.fillText(sub, X, Y - 92 - 6 * (ls - 1) * 3); ctx.globalAlpha = 1; });
      drawSigns(s, z); drawLots(s, z); drawBadges(s, z); if (R.layers.events) drawEvents(z); else R.evHits = []; drawMarks(z); screenFx(vw, vh); atmosFx(vw, vh);
      ctx.setTransform(1, 0, 0, 1, 0, 0); var vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, R.layers.read ? "rgba(3,5,8,.2)" : "rgba(3,5,8,.42)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
    };

    /* ---------- sélection par clic : silhouettes projetées, premier plan prioritaire ---------- */
    function inPoly(x, y, p) { var ins = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) ins = !ins; return ins; }
    R.hit = function (sx, sy, s, skip) {
      var i, o; skip = skip || {};
      for (i = statics.length - 1; i >= 0; i--) { o = statics[i]; if (o.t !== "b") continue; var b = o.b; if (b.kind === "decor") continue; if (b.kind === "dlot") { if (T.lv(s, b.dlot.did) < 1) continue; var dh = dlotType(s, b.dlot) ? bh(b, s) : 4; if (inPoly(sx, sy, silhouette(b.x - 4, b.y - 4, b.w + 8, b.d + 8, dh))) { if (!skip["dlot:" + b.id]) return { type: "dlot", id: b.id, did: b.dlot.did, idx: b.dlot.idx }; } continue; } if (b.kind === "lot" && !isBuilt(b, s)) continue;
        if (inPoly(sx, sy, silhouette(b.x, b.y, b.w, b.d, bh(b, s) + (b.kind === "hq" ? 16 : (b.lot.act === "estate" || b.lot.act === "holding") ? 24 : 6))) && !skip[b.kind === "hq" ? "hq:hq" : "lot:" + b.lot.id]) return b.kind === "hq" ? { type: "hq", id: "hq" } : { type: "lot", id: b.lot.id, act: b.lot.act }; }
      for (i = 0; i < model.lots.length; i++) { var l = model.lots[i]; if (!bt(s, l)) { var x = l.x - 4, y = l.y - 4, w = l.w + 8, d = l.d + 40; if (inPoly(sx, sy, [[px(x, y), py(x, y, 0)], [px(x + w, y), py(x + w, y, 0)], [px(x + w, y + d), py(x + w, y + d, 0)], [px(x, y + d), py(x, y + d, 0)]])) { if (!skip["lot:" + l.id]) return { type: "lot", id: l.id, act: l.act, plot: true }; } } }
      var gx = (sx - OX) + 2 * (sy - OY), gy = 2 * (sy - OY) - (sx - OX), c = Math.floor(gx / M.CELL), r = Math.floor(gy / M.CELL);
      if (M.isLand(c, r)) { var cl = model.cells[r * M.COLS + c]; if ((cl.deco === "park" || cl.deco === "plaza") && cl.district !== "hq") return { type: "decor", id: cl.district + ":" + cl.i, did: cl.district, cell: cl.i, deco: cl.deco }; if (cl.district !== "hq") return { type: "district", id: cl.district }; } return null;
    };
    R.hitAll = function (sx, sy, s) { var out = [], skip = {}, h, n = 0; while (n++ < 8 && (h = R.hit(sx, sy, s, skip)) && (h.type === "hq" || h.type === "lot" || h.type === "dlot")) { out.push(h); skip[h.type + ":" + h.id] = 1; } return out; };
    R.ripple = function (x, y) { R.ripples.push({ x: x, y: y, t: 0 }); };
    R.reveal = function (id) { return R.rv[id]; };
    R.focusOf = function (h) { if (h.type === "decor") { var dc = model.cells[h.cell]; return dc ? { x: px(dc.x + dc.size / 2, dc.y + dc.size / 2), y: py(dc.x + dc.size / 2, dc.y + dc.size / 2, 20) } : null; } if (h.type === "dlot") { var pl = (model.dplots || []).filter(function (q) { return q.id === h.id; })[0]; return pl ? { x: px(pl.x + pl.w / 2, pl.y + pl.d / 2), y: py(pl.x + pl.w / 2, pl.y + pl.d / 2, 40) } : null; } var l = h.type === "lot" ? model.lots.filter(function (q) { return q.id === h.id; })[0] : null; if (l) return { x: px(l.x + l.w / 2, l.y + l.d / 2), y: py(l.x + l.w / 2, l.y + l.d / 2, 40) }; if (h.type === "hq") return { x: px(model.hq.x + 80, model.hq.y + 70), y: py(model.hq.x + 80, model.hq.y + 70, 40) }; var d = model.districts[h.id]; return d ? { x: px(d.cx, d.cy), y: py(d.cx, d.cy, 0) } : null; };
    return R;
  }
  BL.mapRender = { create: create };
})(typeof globalThis !== "undefined" ? globalThis : this);
