/* Scène d'opération (Partie 15) : dessins. Corps entier articulé en SVG, construit à partir du même `look` que le portrait
   (peau, cheveux, barbe, lunettes, costume, chemise, accent, silhouette). Chaque membre est un <g class="pt …"> : l'animation se fait
   uniquement en CSS transform (rotation des pièces), jamais en re-dessinant. Les ennemis suivent les couleurs et l'emblème de leur faction. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function mix(hex, to, k) { var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), r = [16, 8, 0].map(function (s) { var x = a >> s & 255, y = b >> s & 255; return Math.round(x + (y - x) * k); }); return "#" + r.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }
  function dk(h, k) { return mix(h, "#000000", k); } function lt(h, k) { return mix(h, "#ffffff", k); }
  function ok(c, d) { return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? c : d; }
  function gun(kind) {
    if (kind === "rifle") return '<g class="gun"><rect x="-6" y="-2" width="34" height="4.4" rx="1.2" fill="#2a2d33"/><rect x="-10" y="-3" width="9" height="7" rx="1.5" fill="#5a4030"/><rect x="18" y="-4" width="2.4" height="3" fill="#14161a"/></g>';
    if (kind === "bat") return '<g class="gun"><rect x="-4" y="-2" width="30" height="4" rx="2" fill="#a27a46"/><rect x="-6" y="-2.4" width="5" height="4.8" rx="2" fill="#3a2a1c"/></g>';
    return '<g class="gun"><rect x="-1" y="-2.4" width="13" height="4.6" rx="1" fill="#2a2d33"/><rect x="0" y="1" width="4" height="6" rx="1" fill="#14161a"/></g>';
  }
  /* o : { look, weapon:"pistol|rifle|bat", enemy:{color,shape,fid}|null, flip } */
  function figure(o) {
    var L = o.look || {}, en = o.enemy, f = !!L.female, skin = ok(L.skin, "#caa07a"), hair = ok(L.hair, "#222222"), suit = ok(L.suit, "#2a2c34"), shirt = ok(L.shirt, "#e8e4da"), acc = ok(L.accent, "#c8a45e");
    if (en) { suit = dk(ok(en.color, "#667"), 0.55); acc = ok(en.color, "#8899aa"); shirt = dk(acc, 0.3); }
    var pants = dk(suit, 0.25), sw = f ? 11 : 13, hs = L.style || "short", beard = L.beard && !f, gl = !!L.glasses, mask = en && en.fid === "lames";
    var h = '<svg class="osc-fig" viewBox="-20 0 100 124" aria-hidden="true" focusable="false"><ellipse class="osc-sh" cx="30" cy="116" rx="19" ry="4.2" fill="#000" opacity=".4"/>';
    h += '<g class="pt legB"><rect x="' + (30 - 8) + '" y="64" width="8" height="46" rx="3" fill="' + dk(pants, 0.2) + '"/><rect x="' + (30 - 9) + '" y="108" width="11" height="6" rx="2.5" fill="#101114"/></g>';
    h += '<g class="pt armB"><rect x="' + (30 - sw - 3) + '" y="38" width="7" height="27" rx="3.4" fill="' + dk(suit, 0.18) + '"/><circle cx="' + (30 - sw - 0) + '" cy="66" r="3.6" fill="' + skin + '"/></g>';
    h += '<g class="pt legF"><rect x="30" y="64" width="9" height="46" rx="3" fill="' + pants + '"/><rect x="29" y="108" width="12" height="6" rx="2.5" fill="#15171b"/></g>';
    h += '<g class="pt body"><path d="M' + (30 - sw) + ' 38 q' + sw + ' -5 ' + (sw * 2) + ' 0 l2 28 q-' + (sw + 2) + ' 4 -' + (sw * 2 + 4) + ' 0z" fill="' + suit + '"/>';
    h += '<rect x="30" y="39" width="' + sw + '" height="25" fill="#000" opacity=".17"/><path d="M25 38l5 14 5 -14z" fill="' + shirt + '"/>' + (en ? "" : '<path d="M29 40l1.8 14 1.8 -14z" fill="' + acc + '"/>') + '<rect x="' + (30 - sw) + '" y="60" width="' + (sw * 2) + '" height="3.2" fill="' + dk(suit, 0.4) + '"/>';
    if (en) h += '<circle cx="30" cy="52" r="4.2" fill="' + dk(acc, 0.35) + '" stroke="' + acc + '" stroke-width="1"/>';
    h += '</g>';
    h += '<g class="pt head"><rect x="27" y="30" width="6" height="6" fill="' + dk(skin, 0.15) + '"/><ellipse cx="30" cy="22" rx="10.5" ry="12" fill="' + skin + '"/>';
    if (beard) h += '<path d="M20 24q10 20 20 0q-3 8 -10 9q-7 -1 -10 -9z" fill="' + hair + '" opacity=".92"/>';
    if (mask) h += '<path d="M19.5 22q10.5 14 21 0v6q-10.5 10 -21 0z" fill="#14181d"/>';
    if (hs === "bald") h += ''; else if (hs === "bob" || f) h += '<path d="M19 22q-1 -15 11 -15q12 0 11 15q-1 -9 -5 -10q-6 3 -12 0q-4 1 -5 10z M19 22v14q3 -2 4 -14z M41 22v14q-3 -2 -4 -14z" fill="' + hair + '"/>'; else h += '<path d="M19 22q-1 -15 11 -15q12 0 11 15q-2 -8 -5 -9q-6 2 -12 0q-3 1 -5 9z" fill="' + hair + '"/>';
    h += '<circle cx="26" cy="22" r="1.3" fill="#15110d"/><circle cx="34.5" cy="22" r="1.3" fill="#15110d"/>' + (f && L.lips ? '<path d="M27 28q3 2 6 0" stroke="' + ok(L.lips, "#c0243a") + '" stroke-width="1.6" fill="none"/>' : '');
    if (gl || (en && en.fid === "meridian")) h += '<circle cx="26" cy="22" r="3.8" fill="none" stroke="' + (en ? "#0b0d10" : ok(L.glassColor, "#c8a45e")) + '" stroke-width="1.2"/><circle cx="34.5" cy="22" r="3.8" fill="none" stroke="' + (en ? "#0b0d10" : ok(L.glassColor, "#c8a45e")) + '" stroke-width="1.2"/><path d="M29.8 22h.9" stroke="#0b0d10" stroke-width="1"/>';
    if (en && (en.fid === "valcourt" || en.fid === "corbeaux")) h += '<path d="M17 14h26q-3 -9 -13 -9q-10 0 -13 9z" fill="' + dk(acc, 0.55) + '"/><rect x="14" y="13" width="32" height="3.4" rx="1.6" fill="' + dk(acc, 0.7) + '"/>';
    else if (!en && ((L.extra || []).indexOf("visor") >= 0 || (L.extra || []).indexOf("hat") >= 0 || (L.extra || []).indexOf("fedora") >= 0)) h += '<path d="M17 14h26q-3 -9 -13 -9q-10 0 -13 9z" fill="#1d1b1b"/><rect x="14" y="13" width="32" height="3.4" rx="1.6" fill="#141212"/><rect x="18" y="11" width="24" height="2.4" fill="' + acc + '"/>';
    h += '</g>';
    h += '<g class="pt armF"><rect x="' + (30 + sw - 3) + '" y="38" width="7" height="27" rx="3.4" fill="' + suit + '"/><circle cx="' + (30 + sw + 0.4) + '" cy="66" r="3.8" fill="' + skin + '"/><g class="hand" transform="translate(' + (30 + sw + 1) + ' 66)">' + gun(o.weapon || "pistol") + '<polygon class="flash" points="24,0 34,-5 31,0 36,3 28,3 33,8 22,3" fill="#ffe9a0" transform="translate(' + (o.weapon === "rifle" ? 10 : 0) + ' -1)"/></g></g>';
    return h + "</svg>";
  }
  /* Décor : rue de nuit, 3 plans de parallaxe (ciel/silhouettes, façades éclairées, bitume + voitures). viewBox 800×360. */
  function street(acc) {
    acc = ok(acc, "#c8a45e"); var i, o = '<svg class="osc-bg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs><linearGradient id="oscSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a14"/><stop offset="1" stop-color="#1c2236"/></linearGradient><linearGradient id="oscRd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1f27"/><stop offset="1" stop-color="#0c0e12"/></linearGradient></defs><rect width="800" height="360" fill="url(#oscSky)"/>';
    o += '<g class="ly far"><circle cx="650" cy="60" r="22" fill="#f3ecd0" opacity=".17"/>'; for (i = 0; i < 12; i++) { var bh = 70 + (i * 53) % 70; o += '<rect x="' + (i * 72 - 10) + '" y="' + (210 - bh) + '" width="64" height="' + (bh + 20) + '" fill="#0d1220"/>'; for (var w = 0; w < 6; w++) if ((i * 7 + w * 3) % 4 === 0) o += '<rect x="' + (i * 72 + 6 + (w % 3) * 18) + '" y="' + (214 - bh + Math.floor(w / 3) * 22 + 8) + '" width="8" height="10" fill="#e6cf8a" opacity=".55"/>'; } o += '</g>';
    o += '<g class="ly mid"><rect x="-20" y="150" width="840" height="86" fill="#141a2a"/>'; for (i = 0; i < 8; i++) { o += '<rect x="' + (i * 108 - 6) + '" y="' + (112 + (i % 3) * 10) + '" width="96" height="120" fill="#1a2236"/><rect x="' + (i * 108 + 10) + '" y="' + (128 + (i % 3) * 10) + '" width="22" height="28" fill="' + (i % 2 ? "#e9d392" : "#25304a") + '" opacity=".8"/><rect x="' + (i * 108 + 52) + '" y="' + (128 + (i % 3) * 10) + '" width="22" height="28" fill="' + (i % 3 ? "#25304a" : "#e9d392") + '" opacity=".75"/>'; } o += '<rect x="170" y="190" width="16" height="12" fill="' + acc + '" opacity=".8"/><rect x="560" y="176" width="40" height="8" rx="2" fill="' + acc + '" opacity=".6"/></g>';
    o += '<g class="ly near"><rect x="-20" y="232" width="840" height="140" fill="url(#oscRd)"/><rect x="-20" y="230" width="840" height="5" fill="#2a3040"/>'; for (i = 0; i < 9; i++) o += '<rect x="' + (i * 100 + 20) + '" y="320" width="48" height="4" rx="2" fill="#c8a45e" opacity=".35"/>';
    o += '<g class="car" transform="translate(300 262)"><rect width="120" height="34" rx="8" fill="#2b3a4a"/><rect x="18" y="-14" width="76" height="20" rx="8" fill="#344759"/><rect x="26" y="-10" width="26" height="12" fill="#9ec2d8" opacity=".55"/><rect x="56" y="-10" width="30" height="12" fill="#9ec2d8" opacity=".5"/><circle cx="26" cy="36" r="9" fill="#0b0c0f"/><circle cx="94" cy="36" r="9" fill="#0b0c0f"/></g>';
    o += '<g class="car" transform="translate(470 266)"><rect width="110" height="30" rx="8" fill="#5a2630"/><rect x="16" y="-12" width="68" height="18" rx="8" fill="#6a2f3a"/><rect x="22" y="-8" width="24" height="11" fill="#9ec2d8" opacity=".5"/><rect x="50" y="-8" width="28" height="11" fill="#9ec2d8" opacity=".5"/><circle cx="24" cy="32" r="8.5" fill="#0b0c0f"/><circle cx="86" cy="32" r="8.5" fill="#0b0c0f"/></g></g></svg>';
    return o;
  }

  function defs() { return '<defs><linearGradient id="oscSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a14"/><stop offset="1" stop-color="#1c2236"/></linearGradient><linearGradient id="oscRd2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232833"/><stop offset="1" stop-color="#0d0f14"/></linearGradient><linearGradient id="oscCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".28"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></linearGradient></defs>'; }
  /* Convoi : route de nuit, poteaux, glissières ; le camion blindé est dessiné à part (truck) pour pouvoir bouger. */
  function road(acc) {
    acc = ok(acc, "#c8a45e"); var i, o = '<svg class="osc-bg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + defs() + '<rect width="800" height="360" fill="url(#oscSky)"/>';
    o += '<g class="ly far"><circle cx="120" cy="56" r="20" fill="#f3ecd0" opacity=".16"/>'; for (i = 0; i < 14; i++) o += '<path d="M' + (i * 70 - 20) + ' 200 q35 -' + (40 + (i * 37) % 40) + ' 70 0z" fill="#0c111d"/>'; o += '</g>';
    o += '<g class="ly mid"><rect x="-20" y="190" width="840" height="40" fill="#10162a"/>'; for (i = 0; i < 9; i++) o += '<rect x="' + (i * 100 + 30) + '" y="130" width="4" height="100" fill="#222a3c"/><rect x="' + (i * 100 + 18) + '" y="128" width="28" height="5" fill="#222a3c"/><polygon points="' + (i * 100 + 20) + ',133 ' + (i * 100 + 44) + ',133 ' + (i * 100 + 70) + ',230 ' + (i * 100 - 6) + ',230" fill="url(#oscCone)" class="cone"/>'; o += '</g>';
    o += '<g class="ly near"><rect x="-20" y="226" width="840" height="150" fill="url(#oscRd2)"/><rect x="-20" y="224" width="840" height="6" fill="#3a4152"/>'; for (i = 0; i < 12; i++) o += '<rect x="' + (i * 90 + 10) + '" y="300" width="50" height="5" rx="2" fill="#e8cd8a" opacity=".5"/>'; o += '<rect x="-20" y="340" width="840" height="3" fill="' + acc + '" opacity=".25"/></g></svg>'; return o;
  }
  /* Camion blindé (arrière), 130×62 ; roues séparées pour l’animation. */
  function truck() {
    return '<svg class="osc-truck-svg" viewBox="0 0 150 80" aria-hidden="true" focusable="false"><ellipse cx="75" cy="76" rx="68" ry="4" fill="#000" opacity=".4"/><rect x="4" y="12" width="104" height="48" rx="6" fill="#39414d"/><rect x="4" y="12" width="104" height="10" rx="5" fill="#4b5562"/><rect x="108" y="26" width="38" height="34" rx="6" fill="#2d343e"/><rect x="118" y="30" width="22" height="14" rx="3" fill="#9ec2d8" opacity=".55"/><rect x="18" y="26" width="76" height="4" fill="#232830"/><rect x="18" y="38" width="76" height="4" fill="#232830"/><circle cx="145" cy="52" r="3" fill="#ffe9a0"/><g class="wh"><circle cx="30" cy="62" r="11" fill="#0b0c0f"/><circle cx="30" cy="62" r="5" fill="#59616d"/></g><g class="wh wh2"><circle cx="122" cy="62" r="11" fill="#0b0c0f"/><circle cx="122" cy="62" r="5" fill="#59616d"/></g></svg>';
  }
  /* Intérieur de banque / entrepôt : murs, grande porte de coffre, faisceaux laser, caméras. */
  function vault(acc) {
    acc = ok(acc, "#c8a45e"); var i, o = '<svg class="osc-bg" viewBox="0 0 800 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + defs() + '<rect width="800" height="360" fill="#0a0d16"/>';
    o += '<g class="ly far"><rect x="0" y="0" width="800" height="230" fill="#111726"/>'; for (i = 0; i < 10; i++) o += '<rect x="' + (i * 84 + 12) + '" y="0" width="3" height="230" fill="#0b0f1b"/>'; o += '<rect x="560" y="30" width="26" height="12" rx="3" fill="#1d2335"/><circle class="cam" cx="573" cy="36" r="3" fill="#b4535f"/></g>';
    o += '<g class="ly mid"><rect x="520" y="70" width="230" height="166" rx="10" fill="#242c3b"/><circle class="vdoor" cx="635" cy="153" r="62" fill="#38425a"/><circle cx="635" cy="153" r="48" fill="#2b3347"/><circle cx="635" cy="153" r="9" fill="' + acc + '"/><g class="vwheel"><rect x="629" y="104" width="12" height="98" rx="4" fill="#59616d"/><rect x="586" y="147" width="98" height="12" rx="4" fill="#59616d"/></g>';
    o += '<g class="lasers">'; for (i = 0; i < 5; i++) o += '<rect class="lz" x="150" y="' + (110 + i * 22) + '" width="360" height="2" fill="#ff3b4e" opacity=".75"/>'; o += '</g></g>';
    o += '<g class="ly near"><rect x="-20" y="232" width="840" height="140" fill="#161b27"/><rect x="-20" y="230" width="840" height="4" fill="#2a3144"/>'; for (i = 0; i < 8; i++) o += '<rect x="' + (i * 110 + 10) + '" y="300" width="70" height="3" fill="#232a3b"/>'; o += '</g></svg>'; return o;
  }
  BL.opsSceneArt = { figure: figure, street: street, road: road, truck: truck, vault: vault };
})(typeof globalThis !== "undefined" ? globalThis : this);
