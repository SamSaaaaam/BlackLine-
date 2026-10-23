/* Illustrations des bâtiments (chantier 3) : 5 activités × 15 paliers de design = 75 vues SVG STATIQUES générées par programme (aucun fichier, aucune animation).
   Le même lieu reste reconnaissable à chaque palier (même volume, même enseigne, même teinte) ; chaque palier ajoute une vraie nouvelle forme :
   0 délabré · 1 modeste · 2 soigné · 3 élégant · 4 prestigieux (dorures) · 5 légendaire (couronne) · 6 impérial (bandes lumineuses, toit-jardin)
   7 somptueux (aile dorée) · 8 monumental (colonnade, projecteurs) · 9 éternel (flèche dorée, halo, fontaine)
   10 sacré (pylônes à orbes) · 11 souverain (étendards) · 12 céleste (faisceau, losanges) · 13 divin (anneaux de lumière) · 14 absolu (couronne d'orbes, aura).
   Utilisées dans les fiches d'activité (design actuel + aperçu du suivant) et dans les notifications de déblocage. */
(function (root) {
  var BL = root.BL = root.BL || {}, cache = {};
  var KIND = {
    backroom: { wall: "#5a3047", roof: "#2c1d26", acc: "#ff4f8b", sign: "CASINO", w: 6.4, d: 4.4, h: 3.4, tall: 0 },
    freight: { wall: "#46586c", roof: "#566a80", acc: "#f1c24b", sign: "GARAGE", w: 7, d: 4.6, h: 2.9, tall: 0 },
    fence: { wall: "#44605c", roof: "#52726d", acc: "#6fb3c2", sign: "BROCANTE", w: 6.4, d: 4.4, h: 3.1, tall: 0 },
    estate: { wall: "#38455e", roof: "#4a5c80", acc: "#9ab4dd", sign: "ESTATE", w: 4.4, d: 3.6, h: 5.6, tall: 1 },
    holding: { wall: "#26505a", roof: "#34707c", acc: "#e3c680", sign: "HOLDING", w: 4.4, d: 3.6, h: 6.6, tall: 1 }
  };
  var TIER_NAMES = ["Délabré", "Modeste", "Soigné", "Élégant", "Prestigieux", "Légendaire", "Impérial", "Somptueux", "Monumental", "Éternel", "Sacré", "Souverain", "Céleste", "Divin", "Absolu"];
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function shade(h, k) { var c = rgb(h); return "rgb(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + ")"; }
  function worn(h, tier) { var c = rgb(h), g = (c[0] + c[1] + c[2]) / 3 * 0.85, t = Math.min(1.1, 0.3 + 0.14 * tier); return "rgb(" + Math.round(g + (c[0] - g) * t) + "," + Math.round(g + (c[1] - g) * t) + "," + Math.round(g + (c[2] - g) * t) + ")"; }
  function hash(a, b) { var h = (a * 73856093) ^ (b * 19349663); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function f(n) { return Math.round(n * 10) / 10; }

  function svg(act, tier, o) {
    o = o || {}; var k = KIND[act]; if (!k) return ""; tier = Math.max(0, Math.min(14, Math.floor(tier) || 0));
    var key = act + "|" + tier; if (cache[key]) return cache[key];
    var S = k.tall ? 17 : 15, CX = 100, GY = 60, out = [], bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    function P(x, y, z) { var X = f(CX + (x - y) * 0.866 * S), Y = f(GY + (x + y) * 0.5 * S - z * S); if (X < bx0) bx0 = X; if (X > bx1) bx1 = X; if (Y < by0) by0 = Y; if (Y > by1) by1 = Y; return [X, Y]; }
    function poly(pts, fill, extra) { out.push('<polygon points="' + pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ") + '" fill="' + fill + '"' + (extra || "") + "/>"); }
    function box(x, y, z, w, d, h, wall, roof, stroke) {
      poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(wall, 1.0), stroke);          /* face gauche (+y) */
      poly([P(x + w, y + d, z), P(x + w, y, z), P(x + w, y, z + h), P(x + w, y + d, z + h)], shade(wall, 0.66), stroke);          /* face droite (+x) */
      poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], roof || shade(wall, 1.2), stroke);   /* toit */
    }
    var w = k.w, d = k.d, h = k.h + Math.min(tier, 5) * (k.tall ? 0.55 : 0.32) + Math.max(0, Math.min(tier, 9) - 5) * (k.tall ? 0.25 : 0.12) + Math.max(0, tier - 9) * (k.tall ? 0.05 : 0.03), wallC = worn(k.wall, tier), roofC = worn(k.roof, tier), acc = k.acc;
    /* sol et ombre */
    out.push('<ellipse cx="' + CX + '" cy="' + f(GY + (w + d) * S * 0.5 + 2) + '" rx="' + f(S * (w + d) * 0.5 + 12) + '" ry="' + f(S * (w + d) * 0.25 + 6) + '" fill="#10141b" opacity=".85"/>');
    poly([P(-1.2, -1.2, 0), P(w + 1.2, -1.2, 0), P(w + 1.2, d + 1.6, 0), P(-1.2, d + 1.6, 0)], "#222831", ' stroke="#313947" stroke-width="1"');
    /* fontaine d'accueil (palier 9) et tapis rouge (palier 5+) : posés au sol, derrière le bâtiment si besoin */
    if (tier >= 5) poly([P(w / 2 - 0.35, d, 0), P(w / 2 + 0.35, d, 0), P(w / 2 + 0.35, d + 1.5, 0), P(w / 2 - 0.35, d + 1.5, 0)], "#8b2f3a", ' stroke="#e3c680" stroke-width=".6"');
    /* aile annexe dorée (palier 7+) : dessinée avant le corps principal */
    if (tier >= 7) { var ah = Math.max(1.4, h * 0.38); box(w + 0.15, d * 0.25, 0, 1.5, d * 0.55, ah, wallC, "#e3c680"); poly([P(w + 0.15, d * 0.8, ah), P(w + 1.65, d * 0.8, ah), P(w + 1.65, d * 0.8, ah - 0.18), P(w + 0.15, d * 0.8, ah - 0.18)], "#e3c680"); }
    /* corps principal */
    box(0, 0, 0, w, d, h, wallC, roofC, ' stroke="rgba(255,255,255,.12)" stroke-width=".6"');
    /* fenêtres : plus nombreuses et plus allumées avec le palier */
    var rows = Math.max(2, Math.floor(h / 0.95)), cols = Math.max(2, Math.floor(w / 0.95)), dens = Math.min(0.96, 0.22 + 0.085 * tier), r, c;
    function win(face, i, j) {
      var lit = hash(act.charCodeAt(0) + tier * 3 + (face === "L" ? 0 : 50), i * 17 + j) < dens, col = lit ? (face === "L" ? "#f6e3a8" : "#e9c97a") : "#0f1219", a = lit ? 0.95 : 0.8, z0 = 0.55 + j * 0.95, w0 = 0.42, hh = 0.5;
      if (face === "L") { var x0 = 0.3 + i * (w - 0.6) / cols; poly([P(x0, d, z0), P(x0 + w0, d, z0), P(x0 + w0, d, z0 + hh), P(x0, d, z0 + hh)], col, ' opacity="' + a + '"'); }
      else { var y0 = 0.3 + i * (d - 0.6) / Math.max(2, Math.floor(d / 0.95)); poly([P(w, y0 + w0 * 0.6, z0), P(w, y0, z0), P(w, y0, z0 + hh), P(w, y0 + w0 * 0.6, z0 + hh)], col, ' opacity="' + a + '"'); }
    }
    for (r = 1; r < rows; r++) { for (c = 0; c < cols; c++) win("L", c, r); for (c = 0; c < Math.max(2, Math.floor(d / 0.95)); c++) win("R", c, r); }
    /* porte et enseigne */
    poly([P(w / 2 - 0.5, d, 0), P(w / 2 + 0.5, d, 0), P(w / 2 + 0.5, d, 1.1), P(w / 2 - 0.5, d, 1.1)], "#14101a"); poly([P(w / 2 - 0.4, d, 0.05), P(w / 2 + 0.4, d, 0.05), P(w / 2 + 0.4, d, 1.0), P(w / 2 - 0.4, d, 1.0)], shade(acc, 0.35), ' opacity=".7"');
    var sa = P(w / 2 - 1.25, d, h - 0.9), sb = P(w / 2 + 1.25, d, h - 0.9), sc = P(w / 2 + 1.25, d, h - 0.35), sd = P(w / 2 - 1.25, d, h - 0.35);
    poly([sa, sb, sc, sd], tier >= 3 ? acc : shade(acc, 0.55), ' opacity="' + (tier >= 3 ? 0.95 : 0.8) + '"');
    out.push('<text x="' + f((sa[0] + sb[0]) / 2) + '" y="' + f((sa[1] + sd[1]) / 2 + 2.4) + '" font-family="IBM Plex Sans,Arial,sans-serif" font-size="6.5" font-weight="700" text-anchor="middle" fill="#fff" transform="skewY(' + f(Math.atan2(sb[1] - sa[1], sb[0] - sa[0]) * 180 / Math.PI) + ')" style="transform-origin:' + f((sa[0] + sb[0]) / 2) + 'px ' + f((sa[1] + sd[1]) / 2) + 'px">' + k.sign + "</text>");
    /* détails de palier */
    if (tier === 0) { out.push('<path d="M' + P(w * 0.3, d, h)[0] + "," + P(w * 0.3, d, h)[1] + " l3,9 l-3,8 l4,9 l-3,8" + '" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.1"/>'); poly([P(w * 0.18, d, 0.5), P(w * 0.18 + 0.5, d, 0.5), P(w * 0.18 + 0.5, d, 1.3), P(w * 0.18, d, 1.3)], "#4a3a2a"); out.push('<ellipse cx="' + P(-0.3, d + 0.6, 0.1)[0] + '" cy="' + P(-0.3, d + 0.6, 0.1)[1] + '" rx="5" ry="2.8" fill="#1c2026"/>'); }
    if (tier === 1) out.push('<path d="M' + P(w * 0.6, d, h)[0] + "," + P(w * 0.6, d, h)[1] + " l2,7 l-2,6" + '" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1"/>');
    if (tier >= 2) for (c = 0; c < 3; c++) { var px = 0.6 + c * (w - 1.8) / 2, pb = P(px, d + 0.35, 0.3); out.push('<rect x="' + f(pb[0] - 3) + '" y="' + f(pb[1] - 2) + '" width="6" height="3.4" fill="#5a4636"/><circle cx="' + pb[0] + '" cy="' + f(pb[1] - 4) + '" r="3.2" fill="' + (tier >= 4 ? "#3f8a58" : "#2f6a44") + '"/>'); }
    if (tier >= 3) for (c = 0; c < 2; c++) { var lp = P(c ? w - 0.2 : 0.2, d + 0.9, 0), lt = P(c ? w - 0.2 : 0.2, d + 0.9, 1.7); out.push('<line x1="' + lp[0] + '" y1="' + lp[1] + '" x2="' + lt[0] + '" y2="' + lt[1] + '" stroke="#3a404a" stroke-width="1.4"/><circle cx="' + lt[0] + '" cy="' + lt[1] + '" r="2.4" fill="#f6e3a8"/><circle cx="' + lt[0] + '" cy="' + lt[1] + '" r="6" fill="#f6e3a8" opacity=".18"/>'); }
    if (tier >= 4) {
      [[0, d, 0, h], [w, d, 0, h], [w, 0, 0, h]].forEach(function (e) { var a = P(e[0], e[1], e[2]), b = P(e[0], e[1], e[3]); out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#e3c680" stroke-width="1.5"/>'); });
      var a1 = P(0, d, h), b1 = P(w, d, h), c1 = P(w, 0, h); out.push('<polyline points="' + [a1, b1, c1].map(function (p) { return p.join(","); }).join(" ") + '" fill="none" stroke="#e3c680" stroke-width="1.5"/>');
      var fp = P(0.3, d + 0.7, 0), ft = P(0.3, d + 0.7, 2.2); out.push('<line x1="' + fp[0] + '" y1="' + fp[1] + '" x2="' + ft[0] + '" y2="' + ft[1] + '" stroke="#8a8f99" stroke-width="1.2"/><path d="M' + ft[0] + "," + ft[1] + " l9,2.5 l-9,3z" + '" fill="#8b2f3a"/>');
    }
    if (tier >= 5) { var cp = P(w / 2, d / 2, h + 0.15); out.push('<path d="M' + (cp[0] - 10) + "," + cp[1] + " l3,-9 l5,6 l2,-10 l2,10 l5,-6 l3,9z" + '" fill="#e3c680" stroke="#b8975a" stroke-width=".6"/>'); }
    if (tier >= 6) {
      [[0.15, d], [w - 0.15, d]].forEach(function (e) { var a = P(e[0], e[1], 0.3), b = P(e[0], e[1], h - 0.2); out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + acc + '" stroke-width="2.2" opacity=".9"/>'); });
      var gb = P(w * 0.25, d * 0.2, h + 0.15), gt = P(w * 0.25, d * 0.2, h + 0.7); out.push('<polygon points="' + [P(w * 0.1, d * 0.12, h), P(w * 0.4, d * 0.12, h), P(w * 0.4, d * 0.42, h), P(w * 0.1, d * 0.42, h)].map(function (p) { return p.join(","); }).join(" ") + '" fill="#2f6a44"/><circle cx="' + gb[0] + '" cy="' + f(gt[1]) + '" r="4.5" fill="#3f8a58"/>');
    }
    if (tier >= 8) {
      var ch = Math.min(h * 0.55, 3);
      for (c = 0; c < 4; c++) { var cx = 0.5 + c * (w - 1) / 3, bb = P(cx, d + 0.6, 0), tt = P(cx, d + 0.6, ch); out.push('<line x1="' + bb[0] + '" y1="' + bb[1] + '" x2="' + tt[0] + '" y2="' + tt[1] + '" stroke="#f1ecde" stroke-width="3"/>'); }
      var ea = P(0.3, d + 0.6, ch), eb = P(w - 0.3, d + 0.6, ch); out.push('<line x1="' + ea[0] + '" y1="' + ea[1] + '" x2="' + eb[0] + '" y2="' + eb[1] + '" stroke="#e3c680" stroke-width="2.6"/>');
      [[0.1, 1], [w - 0.1, -1]].forEach(function (e) { var a = P(e[0], d + 0.9, 0.1); out.push('<polygon points="' + (a[0] - 2) + "," + a[1] + " " + (a[0] + 2) + "," + a[1] + " " + (a[0] + e[1] * 16) + "," + f(a[1] - 62) + " " + (a[0] + e[1] * 8) + "," + f(a[1] - 62) + '" fill="' + acc + '" opacity=".2"/>'); });
    }
    if (tier >= 9) {
      var sp = P(w / 2, d / 2, h + 0.5), spt = [sp[0], f(sp[1] - 40)]; out.push('<circle cx="' + sp[0] + '" cy="' + f(sp[1] - 18) + '" r="40" fill="' + acc + '" opacity=".14"/><polygon points="' + (sp[0] - 6) + "," + sp[1] + " " + spt.join(",") + " " + (sp[0] + 6) + "," + sp[1] + '" fill="#f2dc9a"/><polygon points="' + spt.join(",") + " " + (sp[0] + 6) + "," + sp[1] + " " + sp[0] + "," + f(sp[1] - 3) + '" fill="#e3c680"/>');
      var fo = P(w + 0.6, d + 1.2, 0); out.push('<ellipse cx="' + fo[0] + '" cy="' + fo[1] + '" rx="11" ry="5" fill="#2b4a5a" stroke="#e3c680" stroke-width="1.2"/><rect x="' + f(fo[0] - 1) + '" y="' + f(fo[1] - 12) + '" width="2" height="10" fill="#9fd4de" opacity=".85"/>');
    }
    if (tier >= 10) {                                                                                          /* sacré : deux pylônes à orbes */
      [[-0.3, d + 0.9], [w + 0.3, d + 0.9]].forEach(function (e) { var a = P(e[0], e[1], 0), b = P(e[0], e[1], 2.2); out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#f1ecde" stroke-width="3.2"/><circle cx="' + b[0] + '" cy="' + f(b[1] - 3) + '" r="3.6" fill="' + acc + '"/><circle cx="' + b[0] + '" cy="' + f(b[1] - 3) + '" r="9" fill="' + acc + '" opacity=".18"/>'); });
    }
    if (tier >= 11) {                                                                                          /* souverain : trois étendards pendants */
      for (c = 0; c < 3; c++) { var fx = 0.9 + c * (w - 1.8) / 2, ft = P(fx, d, Math.max(1.6, h - 0.5)), fb = P(fx, d, Math.max(0.5, h - 2.6)); out.push('<polygon points="' + (ft[0] - 3) + "," + ft[1] + " " + (ft[0] + 3) + "," + ft[1] + " " + (fb[0] + 3) + "," + fb[1] + " " + fb[0] + "," + f(fb[1] - 4) + " " + (fb[0] - 3) + "," + fb[1] + '" fill="#8b2f3a" stroke="#e3c680" stroke-width=".6"/>'); }
    }
    var ctop = P(w / 2, d / 2, h + 0.5);
    if (tier >= 12) {                                                                                          /* céleste : faisceau vertical + losanges flottants */
      out.push('<polygon points="' + (ctop[0] - 5) + "," + ctop[1] + " " + (ctop[0] + 5) + "," + ctop[1] + " " + (ctop[0] + 2) + "," + f(ctop[1] - 120) + " " + (ctop[0] - 2) + "," + f(ctop[1] - 120) + '" fill="#fff4c8" opacity=".3"/>');
      [-16, 0, 16].forEach(function (ox, i) { var y0 = ctop[1] - 70 + (i === 1 ? -6 : 3); out.push('<polygon points="' + f(ctop[0] + ox) + "," + f(y0 - 5) + " " + f(ctop[0] + ox + 3.5) + "," + f(y0) + " " + f(ctop[0] + ox) + "," + f(y0 + 5) + " " + f(ctop[0] + ox - 3.5) + "," + f(y0) + '" fill="#f6e3a8"/>'); });
    }
    if (tier >= 13) {                                                                                          /* divin : anneaux de lumière */
      for (c = 0; c < 2; c++) out.push('<ellipse cx="' + ctop[0] + '" cy="' + f(ctop[1] - 14 - c * 14) + '" rx="' + (30 + c * 12) + '" ry="' + (10 + c * 3.5) + '" fill="none" stroke="' + acc + '" stroke-width="1.5" opacity="' + (0.6 - c * 0.18) + '"/>');
    }
    if (tier >= 14) {                                                                                          /* absolu : couronne de cinq orbes */
      for (c = 0; c < 5; c++) { var an = c / 5 * 6.2832; out.push('<circle cx="' + f(ctop[0] + Math.cos(an) * 26) + '" cy="' + f(ctop[1] - 50 + Math.sin(an) * 8) + '" r="3.2" fill="#fff4c8"/><circle cx="' + f(ctop[0] + Math.cos(an) * 26) + '" cy="' + f(ctop[1] - 50 + Math.sin(an) * 8) + '" r="8" fill="' + acc + '" opacity=".2"/>'); }
    }
    if (tier >= 12) by0 -= 130; else if (tier >= 9) by0 -= 60; else if (tier >= 5) by0 -= 12; if (tier >= 10) { bx0 -= 14; bx1 += 14; by1 += 4; } bx0 -= 14; bx1 += 14; by0 -= 6; by1 += 14;
    var res = '<svg viewBox="' + f(bx0) + " " + f(by0) + " " + f(bx1 - bx0) + " " + f(by1 - by0) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (o.label || (k.sign + " : design " + TIER_NAMES[tier])) + '" class="bart" data-tier="' + tier + '">' + out.join("") + "</svg>";
    return (cache[key] = res);
  }
  BL.buildArt = { svg: svg, TIER_NAMES: TIER_NAMES, KIND: KIND, tiers: 15 };
})(typeof globalThis !== "undefined" ? globalThis : this);
