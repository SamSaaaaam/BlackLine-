/* Fond animé du menu principal : « Les toits sous la pluie » (direction retenue).
   Une scène SVG à 8 plans (+ calques d’animation légers) (ciel, skyline lointaine, skyline proche, avenue et voitures, toit au premier plan avec le boss, pluie, brume), générée ici : aucune image externe.
   - Animations uniquement par transform/opacity (GPU). ~20 éléments animés au total.
   - Reflète la progression : plus de fenêtres allumées, d'enseignes néon, de voitures et de projecteurs quand le niveau d'empire monte.
   - Parallaxe douce au pointeur. Tout s'arrête si « mouvements réduits », « effets bas », onglet masqué ou menu fermé (voir style.css).
   BL.menuBg = { build(menuEl), refresh(niveau), run(bool), svg(niveau) } */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, el = null, on = false, lastLevel = -1, px = 0, py = 0, raf = 0, wired = false;
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function R(x, y, w, h, f, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function C(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function P(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || "") + "/>"; }
  function L(d, s, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + s + '" stroke-width="' + w + '"' + (ex || "") + "/>"; }
  function svg(inner, cls) { return '<svg class="mbs ' + (cls || "") + '" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + inner + "</svg>"; }

  /* niveau d'empire → paramètres de la scène */
  function params(level) {
    var p = clamp((level - 1) / 49, 0, 1);
    return { lit: 0.18 + 0.6 * p, signs: 1 + Math.floor(p * 5.99), cars: 2 + Math.floor(p * 4.99), beams: p > 0.3 ? 2 : 1, level: level };
  }

  /* bâtiments : { x, w, h } alignés sur une ligne de base */
  function towers(seed, n, minH, maxH, minW, maxW, x0, x1) {
    var r = rnd(seed), out = [], x = x0;
    while (x < x1 && out.length < n) { var w = minW + r() * (maxW - minW); out.push({ x: Math.round(x), w: Math.round(w), h: Math.round(minH + r() * (maxH - minH)), top: r() }); x += w * (0.55 + r() * 0.5); }
    return out;
  }
  function skyline(list, base, fill, edge, refl) {
    var s = "";
    list.forEach(function (b, bi) {
      var y = base - b.h; s += R(b.x, y, b.w, b.h + 2, fill);
      var kind = Math.floor(b.top * 7);                                   /* 0 antenne+rehausse, 1 toit pointu, 2 retrait en gradins, 3 réservoir sur pilotis, 4 bandeau technique, 5 deux antennes, 6 plat */
      if (kind === 0) s += R(b.x + b.w * 0.2, y - 18, b.w * 0.6, 18, fill) + R(b.x + b.w * 0.46, y - 44, 3, 26, fill);
      else if (kind === 1) s += P("M" + b.x + " " + y + "l" + (b.w * 0.5) + " -22 " + (b.w * 0.5) + " 22z", fill);
      else if (kind === 2) s += R(b.x + b.w * 0.12, y - 14, b.w * 0.76, 14, fill) + R(b.x + b.w * 0.28, y - 28, b.w * 0.44, 14, fill) + R(b.x + b.w * 0.48, y - 46, 2.5, 18, fill);
      else if (kind === 3) s += R(b.x + b.w * 0.3, y - 10, 3, 10, fill) + R(b.x + b.w * 0.62, y - 10, 3, 10, fill) + R(b.x + b.w * 0.26, y - 30, b.w * 0.44, 20, fill, ' rx="4"') + P("M" + (b.x + b.w * 0.24) + " " + (y - 30) + "l" + (b.w * 0.26) + " -9 " + (b.w * 0.26) + " 9z", fill);
      else if (kind === 4) s += R(b.x + b.w * 0.08, y - 9, b.w * 0.84, 9, fill) + R(b.x + b.w * 0.18, y - 16, 10, 7, fill) + R(b.x + b.w * 0.5, y - 16, 14, 7, fill);
      else if (kind === 5) s += R(b.x + b.w * 0.25, y - 36, 2.5, 36, fill) + R(b.x + b.w * 0.7, y - 24, 2.5, 24, fill) + R(b.x + b.w * 0.2, y - 20, b.w * 0.6, 3, fill);
      s += R(b.x, y, 2, b.h, edge, ' opacity=".7"') + R(b.x, y, b.w, 2, edge, ' opacity=".45"');
      if (refl) s += R(b.x + b.w * (0.58 + (bi % 3) * 0.08), y + 4, b.w * 0.1, b.h - 4, "#9db8ff", ' opacity=".05"') + R(b.x + b.w * 0.12, y + 2, 1.5, b.h * 0.6, "#cfe0ff", ' opacity=".06"');
    });
    return s;
  }
  function windows(list, base, seed, lit, colors, cell) {
    var r = rnd(seed), per = {}, s = "";
    colors.forEach(function (c) { per[c] = ""; });
    list.forEach(function (b) {
      var y0 = base - b.h + 14, cols = Math.max(1, Math.floor((b.w - 10) / cell)), rows = Math.floor((b.h - 26) / (cell * 1.5)), tone = colors[Math.floor(r() * colors.length)], busy = 0.25 + r() * 1.1, c0 = Math.floor(r() * cols), span = 1 + Math.floor(r() * Math.max(1, cols - 1));
      for (var j = 0; j < rows; j++) {
        var floor = r() < lit * busy ? 0.92 : 0.06 + lit * 0.1;                     /* un étage est soit éclairé (bureaux, appartements), soit presque éteint */
        for (var i = 0; i < cols; i++) {
          var inGroup = i >= c0 && i < c0 + span, v = r(), p = floor * (inGroup ? 1 : 0.6); if (v >= p) continue;
          var c = r() < 0.78 ? tone : colors[Math.floor(r() * colors.length)];
          per[c] += "M" + (b.x + 6 + i * cell) + " " + Math.round(y0 + j * cell * 1.5) + "h" + (cell * 0.5) + "v" + (cell * 0.7) + "h-" + (cell * 0.5) + "z";
        }
      }
    });
    colors.forEach(function (c) { if (per[c]) s += P(per[c], c, ' opacity=".62"'); });
    return s;
  }
  /* enseignes verticales discrètes : un caisson sombre et un tube lumineux (aucun symbole), clignotement très lent */
  function vertSign(x, y, col, k) {
    var h = 70 + (k % 3) * 22;
    return '<g class="mb-neon n' + (k % 3) + '" transform="translate(' + x + " " + y + ')">' + R(-7, 0, 14, h, "#05070c", ' rx="3" opacity=".78"') + R(-3, 6, 6, h - 12, col, ' rx="3" opacity=".25"') + R(-1.6, 8, 3.2, h - 16, col, ' rx="1.6" opacity=".9"') + R(-11, 0, 22, h, col, ' rx="6" opacity=".07"') + "</g>";
  }

  function sceneLayers(level) {
    var q = params(level), o = {};
    /* 1. ciel */
    var sk = '<defs><linearGradient id="mbg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070d"/><stop offset=".45" stop-color="#121634"/><stop offset=".78" stop-color="#3b1b45"/><stop offset="1" stop-color="#6a2650"/></linearGradient><radialGradient id="mbg-moon" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient><radialGradient id="mbg-cl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7a5aa8" stop-opacity=".42"/><stop offset="1" stop-color="#7a5aa8" stop-opacity="0"/></radialGradient><radialGradient id="mbg-hz" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#ff5c9a" stop-opacity=".5"/><stop offset="1" stop-color="#ff5c9a" stop-opacity="0"/></radialGradient></defs>' + R(0, 0, 1600, 900, "url(#mbg-sky)");
    var r = rnd(7), st = ""; for (var i = 0; i < 70; i++) st += C(Math.round(r() * 1600), Math.round(r() * 430), r() < 0.2 ? 1.6 : 1, "#dfe8ff", ' opacity="' + (0.25 + r() * 0.5).toFixed(2) + '"' + '');
    sk += st + C(1240, 160, 140, "url(#mbg-moon)") + C(1240, 160, 40, "#e7efff", ' opacity=".9"') + C(1254, 150, 40, "#05070d", ' opacity=".18"') + '<ellipse cx="800" cy="700" rx="900" ry="230" fill="url(#mbg-hz)"/>';
    o.cloud = svg('<g class="mb-cl c1"><ellipse cx="300" cy="250" rx="420" ry="46" fill="url(#mbg-cl)"/><ellipse cx="520" cy="290" rx="300" ry="36" fill="url(#mbg-cl)"/></g><g class="mb-cl c2"><ellipse cx="1100" cy="330" rx="460" ry="50" fill="url(#mbg-cl)"/><ellipse cx="900" cy="380" rx="280" ry="34" fill="url(#mbg-cl)"/></g><g class="mb-cl c3"><ellipse cx="1500" cy="220" rx="360" ry="40" fill="url(#mbg-cl)"/></g>');
    o.sky = svg(sk);
    /* 2a. plan très lointain : silhouettes pâles dans la brume (profondeur) */
    var far0 = towers(8, 30, 90, 240, 40, 100, -40, 1680); o.far0 = svg(skyline(far0, 690, "#1d2347", "#3a4478") + R(0, 560, 1600, 140, "#6a3f8a", ' opacity=".10"') + windows(far0, 690, 12, q.lit * 0.25, ["#ffd27a", "#9ec6ff"], 7));
    /* 2. skyline lointaine */
    var far = towers(21, 26, 120, 330, 50, 120, -40, 1680), fs = skyline(far, 700, "#0f1530", "#2b3566", true) + windows(far, 700, 31, q.lit * 0.45, ["#ffd27a", "#8fd0ff"], 8);
    var ffx = ""; far.filter(function (b) { return b.h > 280; }).slice(0, 5).forEach(function (b, i) { ffx += C(b.x + b.w / 2, 700 - b.h - 6, 2.6, "#ff4c4c", ' class="mb-av a' + (i % 3) + '"'); });
    fs += R(0, 640, 1600, 70, "#ff5c9a", ' opacity=".07"');
    fs += '<g opacity=".55">' + R(0, 694, 1600, 6, "#0a0d1c") + R(0, 694, 1600, 1.2, "#6a3f8a", ' opacity=".5"') + "</g>";
    var dist = ""; for (var dc = 0; dc < 2; dc++) { var dd = dc % 2; dist += '<g class="mb-car ' + (dd ? "rt" : "lf") + '" style="animation-duration:' + (34 + dc * 9) + "s;animation-delay:-" + (dc * 11) + 's"><g transform="translate(0 ' + (696 + dd * 2) + ')">' + R(0, -1.6, 12, 3.2, "#0b0e18", ' rx="1.5"') + C(dd ? 13 : -1, 0, 1.6, dd ? "#ffe9a0" : "#ff5a4a", ' opacity=".9"') + "</g></g>"; }
    var bill = '<g transform="translate(1330 560)">' + R(-40, -22, 80, 44, "#ffb35a", ' rx="8" opacity=".08"') + R(-34, -16, 68, 32, "#05070c", ' rx="5" opacity=".6"') + R(-26, -8, 52, 4, "#ffb35a", ' rx="2" opacity=".55"') + R(-26, 2, 34, 4, "#ffb35a", ' rx="2" opacity=".35"') + "</g>";
    o.far = svg(fs); o.farfx = svg(ffx + dist + bill);
    /* 3. skyline proche + enseignes + projecteurs */
    var mid = towers(55, 20, 260, 560, 90, 190, -60, 1700), ms = skyline(mid, 800, "#141b32", "#34406e", true) + windows(mid, 800, 77, q.lit, ["#ffd27a", "#ffb35a", "#ffe6a8", "#8fd0ff"], 10);
    var mfx = "", tall = mid.slice().sort(function (a, b) { return b.h - a.h; }), rr = rnd(99), cols = ["#ff4f8b", "#42e0ff", "#ffd36e", "#b07aff", "#7dffb0", "#ff7a4a"];
    var spots = mid.filter(function (b) { return b.x > 640 && b.x < 1500 && b.w > 80; }); for (var s = 0; s < q.signs && spots.length; s++) { var b = spots[(s * 2 + 1) % spots.length]; mfx += vertSign(b.x + b.w - 10, 800 - b.h + 60 + (s % 3) * 40, ["#ffb35a", "#ff7aa8", "#7fd0ff"][s % 3], s); }
    for (var k = 0; k < q.beams; k++) { var tb = tall[k * 2 + 1] || tall[0], bx = tb.x + tb.w / 2, by = 800 - tb.h - 4; mfx += '<g class="mb-beam b' + k + '" style="transform-origin:' + bx + "px " + by + 'px">' + P("M" + bx + " " + by + "L" + (bx - 90) + " -200 " + (bx + 90) + " -200z", "#cfe0ff", ' opacity=".16"') + "</g>" + C(bx, by, 4, "#fff6d0", ' class="mb-av a1"'); }
    var tw = rnd(13); for (var z = 0; z < 6; z++) mfx += '<g class="mb-tw t' + (z % 3) + '"><path d="M' + Math.round(tw() * 1500 + 50) + " " + Math.round(tw() * 250 + 40) + 'l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff6d0"/></g>';
    o.mid = svg(ms); o.midfx = svg(mfx);
    /* 4. avenue vue de haut + voitures */
    var av = R(0, 790, 1600, 110, "#090c17") + R(0, 790, 1600, 3, "#4a2a5e", ' opacity=".6"') + '<g opacity=".5">' + R(0, 836, 1600, 3, "#2a2f48") + R(0, 868, 1600, 3, "#2a2f48") + "</g>";
    var rv = rnd(5); for (var m = 0; m < 12; m++) av += R(Math.round(rv() * 1600), 800 + Math.round(rv() * 80), 3, 40 + Math.round(rv() * 40), ["#ff4f8b", "#42e0ff", "#ffd36e"][m % 3], ' opacity=".13"');
    var cfx = ""; for (var c = 0; c < q.cars; c++) { var dir = c % 2, y = dir ? 820 : 852, dur = 16 + c * 3.5, col = dir ? "#ffe9a0" : "#ff4a4a"; cfx += '<g class="mb-car ' + (dir ? "rt" : "lf") + '" style="animation-duration:' + dur + "s;animation-delay:-" + (c * 4.3).toFixed(1) + 's"><g transform="translate(0 ' + y + ')">' + R(0, -4, 34, 8, "#0b0e18", ' rx="3"') + C(dir ? 36 : -2, -1.5, 3.2, col) + C(dir ? 36 : -2, 2.5, 3.2, col) + R(dir ? 30 : 0, -3, 8, 6, col, ' opacity=".25"') + "</g></g>"; }
    o.road = svg(av); o.carfx = svg(cfx);
    /* 5. toit au premier plan : parapet, réservoir, antenne, silhouette du boss */
    var nr = '<defs><radialGradient id="mbg-ember" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb35a"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient></defs>' + R(0, 846, 1600, 54, "#04060b") + R(0, 838, 1600, 10, "#0a0e18") + R(0, 836, 1600, 2.4, "#ff5c9a", ' opacity=".45"');
    nr += R(70, 700, 6, 140, "#05070d") + R(170, 700, 6, 140, "#05070d") + R(56, 660, 134, 46, "#06080f", ' rx="6"') + P("M52 662l70-26 70 26z", "#06080f") + R(56, 662, 134, 2, "#2d3a62", ' opacity=".6"') + L("M72 706l100 100M174 706L74 806", "#05070d", 4);
    nr += R(1440, 560, 4, 280, "#05070d") + L("M1442 580l-30 120M1442 580l30 120M1442 640l-40 120M1442 640l40 120", "#05070d", 2) + C(1442, 556, 5, "#ff4c4c", ' class="mb-av a2"') + R(1380, 790, 80, 50, "#06080f", ' rx="4"') + R(1396, 774, 48, 16, "#06080f", ' rx="3"') + R(300, 812, 120, 30, "#05070d", ' rx="3"') + R(520, 820, 60, 22, "#05070d", ' rx="3"');
    /* le boss de dos : chapeau, manteau, une cigarette qui rougeoie */
    nr += '<g transform="translate(1160 838)"><path d="M-30 0c-2-60 6-100 30-104 24 4 32 44 30 104z" fill="#05070b" stroke="#ff5c9a" stroke-opacity=".4" stroke-width="2"/><circle cx="0" cy="-118" r="15" fill="#05070b"/><ellipse cx="0" cy="-130" rx="30" ry="6" fill="#05070b" stroke="#ff5c9a" stroke-opacity=".4" stroke-width="1.5"/><path d="M-14 -131c0-14 6-20 14-20s14 6 14 20z" fill="#05070b"/><path d="M14 -90c14 4 26 -2 32 -14" fill="none" stroke="#05070b" stroke-width="9" stroke-linecap="round"/><g class="mb-ember"><circle cx="50" cy="-108" r="14" fill="url(#mbg-ember)" opacity=".8"/><circle cx="50" cy="-108" r="2.6" fill="#ffd9a0"/></g><path class="mb-smoke" d="M52 -112c8-14-6-22 4-36" fill="none" stroke="#9aa6c8" stroke-width="3" stroke-linecap="round" opacity=".35"/><path d="M-8 -120h6" stroke="#2d3a62" stroke-width="2" opacity=".6"/></g>';
    /* vapeur de bouche d'égout sur l'avenue, lampadaire au premier plan */
    nr += '<g opacity=".9">' + R(640, 800, 6, 46, "#05070d") + R(630, 798, 26, 4, "#05070d") + C(643, 803, 18, "url(#mbg-ember)", ' opacity=".28"') + '</g><path class="mb-smoke" d="M900 848c10-14-8-24 4-40" fill="none" stroke="#b9c4e6" stroke-width="5" stroke-linecap="round" opacity=".22"/><path d="M914 848c-8-14 8-22-2-36" fill="none" stroke="#b9c4e6" stroke-width="4" stroke-linecap="round" opacity=".12"/>';
    o.near = svg(nr);
    /* 6. pluie : deux couches (loin = fine et lente, près = marquée et rapide) */
    function drops(seed, cnt, len, slant) { var q2 = rnd(seed), d = ""; for (var i = 0; i < cnt; i++) { var x = Math.round(q2() * 1700 - 50), y = Math.round(q2() * 1100 - 150); d += "M" + x + " " + y + "l" + (-slant) + " " + (len + Math.round(q2() * len * 0.6)); } return d; }
    o.rain1 = svg('<g class="mb-rain r1">' + L(drops(3, 170, 22, 4), "#a9c8ee", 1, ' opacity=".26"') + "</g>");
    o.rain2 = svg('<g class="mb-rain r2">' + L(drops(8, 70, 46, 8), "#c9e0ff", 1.7, ' opacity=".34"') + "</g>");
    /* 7. brume basse */
    o.fog = svg('<defs><linearGradient id="mbg-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b58ad8" stop-opacity="0"/><stop offset="1" stop-color="#b58ad8" stop-opacity=".30"/></linearGradient></defs><g class="mb-fog f1"><rect x="-200" y="600" width="2000" height="300" fill="url(#mbg-fog)"/></g><g class="mb-fog f2"><ellipse cx="500" cy="800" rx="700" ry="70" fill="#c9a8e8" opacity=".12"/><ellipse cx="1200" cy="760" rx="600" ry="60" fill="#c9a8e8" opacity=".10"/></g>');
    return o;
  }

  var ORDER = [["sky", 3, ""], ["cloud", 3, "fx2"], ["far0", 5, ""], ["far", 7, ""], ["farfx", 7, ""], ["mid", 13, ""], ["midfx", 13, ""], ["road", 17, ""], ["carfx", 17, ""], ["rain1", 0, "fx2 rn"], ["near", 30, ""], ["rain2", 0, "rn"], ["fog", 0, "fx2"]];
  function html(level) {
    var l = sceneLayers(level), s = "";
    ORDER.forEach(function (o) { s += '<div class="ml ' + o[0] + " " + o[2] + '" style="--k:' + o[1] + '">' + l[o[0]] + "</div>"; });
    return s;
  }

  /* parallaxe : une seule écriture de 2 variables CSS par image, jamais de calcul de mise en page */
  var idle = 0;
  function frame() { raf = 0; if (el) { el.classList.add("par"); el.style.setProperty("--px", px.toFixed(3)); el.style.setProperty("--py", py.toFixed(3)); clearTimeout(idle); idle = setTimeout(function () { if (el) el.classList.remove("par"); }, 1800); } }
  function onMove(e) {
    if (!on || !el) return; var b = doc.body; if (b.classList.contains("nomotion") || b.classList.contains("lowfx")) return;
    px = (e.clientX / root.innerWidth - 0.5) * 2; py = (e.clientY / root.innerHeight - 0.5) * 2; if (!raf) raf = root.requestAnimationFrame(frame);
  }
  /* écran étroit : on recadre sur la lune et les grandes tours, et le fond n'occupe que le haut de l'écran (voir style.css) */
  function fit() { if (!el) return; var narrow = root.innerWidth <= 800, vb = narrow ? "780 0 820 900" : "0 0 1600 900"; Array.prototype.forEach.call(el.querySelectorAll("svg.mbs"), function (v) { if (v.getAttribute("viewBox") !== vb) v.setAttribute("viewBox", vb); }); }
  function build(menu) {
    if (!menu) return null; el = doc.createElement("div"); el.className = "mbg"; el.id = "menuBg"; el.setAttribute("aria-hidden", "true"); el.innerHTML = html(1); lastLevel = 1; fit();
    menu.insertBefore(el, menu.firstChild); root.addEventListener("resize", fit);
    if (!wired) { wired = true; menu.addEventListener("pointermove", onMove, { passive: true }); doc.addEventListener("visibilitychange", function () { if (doc.body) doc.body.classList.toggle("tabhidden", !!doc.hidden); }); }
    return el;
  }
  function refresh(level) { level = Math.max(1, Math.floor(level || 1)); if (!el || level === lastLevel) return; lastLevel = level; el.innerHTML = html(level); fit(); }
  /* régulateur de qualité : si l'appareil n'arrive pas à tenir ~24 images/s deux fois de suite, on allège (qualité 1 : sans pluie lointaine, brume ni nuages), puis on fige l'image (qualité 2). */
  var gov = { raf: 0, frames: 0, t0: 0, bad: 0, q: 0, last: 0, warm: 0 };
  function setQ(q) { gov.q = q; if (el) { el.classList.toggle("lite", q >= 1); el.classList.toggle("still", q >= 2); } }
  function govTick(t) {
    gov.raf = 0; if (!on) return; gov.raf = root.requestAnimationFrame(govTick);
    if (doc.hidden || !gov.t0 || t - gov.last0 > 400) { gov.t0 = t; gov.frames = 0; gov.last0 = t; return; } gov.last0 = t; gov.frames++;
    if (t - gov.t0 >= 2000) { var f = gov.frames * 1000 / (t - gov.t0); gov.last = f; gov.t0 = t; gov.frames = 0; if (gov.warm < 1) { gov.warm++; return; } if (doc.body.classList.contains("nomotion") || doc.body.classList.contains("lowfx")) { gov.bad = 0; return; } if (f < 24 && gov.q < 2) { if (++gov.bad >= 2) { gov.bad = 0; setQ(gov.q + 1); } } else gov.bad = 0; }
  }
  function run(v) { on = !!v; if (el) el.classList.toggle("on", on); if (on) { gov.t0 = 0; gov.warm = 0; gov.bad = 0; if (!gov.raf && root.requestAnimationFrame) gov.raf = root.requestAnimationFrame(govTick); } else if (gov.raf) { root.cancelAnimationFrame(gov.raf); gov.raf = 0; } if (!on) { px = py = 0; clearTimeout(idle); if (el) { el.classList.remove("par"); el.style.setProperty("--px", 0); el.style.setProperty("--py", 0); } } }
  BL.menuBg = { build: build, refresh: refresh, run: run, html: html, params: params, isOn: function () { return on; }, level: function () { return lastLevel; }, quality: function () { return gov.q; }, fps: function () { return Math.round(gov.last); }, setQuality: setQ };
})(typeof window !== "undefined" ? window : globalThis);
