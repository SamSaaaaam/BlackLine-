/* Casino : décors dessinés par le code (SVG), aucune image externe. Salle (moquette, pilastres dorés, rideaux, lustres), symboles de la machine à sous, roue de roulette, cartes. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function f(n) { return Math.round(n * 10) / 10; }
  function chandelier(cx, cy, k) {
    var o = [], i, a;
    o.push('<g transform="translate(' + cx + " " + cy + ") scale(" + k + ')">');
    o.push('<line x1="0" y1="-120" x2="0" y2="-10" stroke="#8f7640" stroke-width="3"/><circle cx="0" cy="-8" r="9" fill="url(#csGold)"/>');
    [[70, 20, 8], [115, 52, 10], [150, 88, 12]].forEach(function (t, ti) {
      o.push('<ellipse cx="0" cy="' + t[1] + '" rx="' + t[0] + '" ry="' + f(t[0] * 0.16) + '" fill="none" stroke="url(#csGold)" stroke-width="3"/>');
      for (i = 0; i < t[2]; i++) { a = (i / t[2]) * Math.PI * 2; var x = f(Math.cos(a) * t[0]), y = f(t[1] + Math.sin(a) * t[0] * 0.16);
        o.push('<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + f(y + 18 + (i % 2) * 8) + '" stroke="#d9cfb8" stroke-width="1" opacity=".6"/><circle class="cs-tw" style="animation-delay:' + f((i * 0.37 + ti * 0.9) % 3) + 's" cx="' + x + '" cy="' + f(y - 5) + '" r="3.2" fill="#fff3c8"/><circle cx="' + x + '" cy="' + f(y + 22 + (i % 2) * 8) + '" r="2.4" fill="#bfe0ff" opacity=".85"/>'); }
    });
    o.push('<circle cx="0" cy="40" r="120" fill="url(#csGlow)" opacity=".55"/></g>'); return o.join("");
  }
  function hall() {
    var o = [], i;
    o.push('<svg class="cs-hall" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="csWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0a10"/><stop offset=".55" stop-color="#4a1522"/><stop offset="1" stop-color="#2a0e16"/></linearGradient>' +
      '<linearGradient id="csGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a8"/><stop offset=".5" stop-color="#c8a45e"/><stop offset="1" stop-color="#7a5f2c"/></linearGradient>' +
      '<radialGradient id="csGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="csCurt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a0f1c"/><stop offset=".3" stop-color="#9c2236"/><stop offset=".5" stop-color="#5a0f1c"/><stop offset=".75" stop-color="#8a1c30"/><stop offset="1" stop-color="#4a0b17"/></linearGradient>' +
      '<pattern id="csCarpet" width="96" height="48" patternUnits="userSpaceOnUse"><rect width="96" height="48" fill="#13301f"/><path d="M48 4l30 20-30 20-30-20z" fill="none" stroke="#c8a45e" stroke-width="1.4" opacity=".55"/><path d="M48 14l16 10-16 10-16-10z" fill="#7a1c2c" opacity=".8"/><circle cx="0" cy="0" r="3" fill="#c8a45e" opacity=".5"/><circle cx="96" cy="0" r="3" fill="#c8a45e" opacity=".5"/><circle cx="0" cy="48" r="3" fill="#c8a45e" opacity=".5"/><circle cx="96" cy="48" r="3" fill="#c8a45e" opacity=".5"/></pattern>' +
      '<radialGradient id="csVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></radialGradient>' +
      '<linearGradient id="csFloorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".6" stop-color="#000" stop-opacity="0"/></linearGradient></defs>');
    o.push('<rect width="1200" height="440" fill="url(#csWall)"/>');
    for (i = 0; i < 8; i++) { var x = 40 + i * 160;                                         /* pilastres cannelés et rideaux entre eux */
      o.push('<path d="M' + (x + 28) + " 60 Q" + (x + 80) + " 40 " + (x + 132) + ' 60 L' + (x + 132) + " 410 L" + (x + 28) + ' 410Z" fill="url(#csCurt)" opacity=".92"/>');
      for (var j = 0; j < 7; j++) o.push('<path d="M' + (x + 32 + j * 14) + " 70 Q" + (x + 36 + j * 14) + " 240 " + (x + 32 + j * 14) + ' 408" stroke="#000" stroke-opacity=".22" stroke-width="3" fill="none"/>');
      o.push('<rect x="' + (x + 128) + '" y="50" width="26" height="365" fill="url(#csGold)"/>' + [0, 1, 2].map(function (q) { return '<line x1="' + (x + 134 + q * 7) + '" y1="62" x2="' + (x + 134 + q * 7) + '" y2="405" stroke="#5a461d" stroke-opacity=".5"/>'; }).join("") + '<rect x="' + (x + 122) + '" y="44" width="38" height="12" fill="url(#csGold)"/><rect x="' + (x + 122) + '" y="410" width="38" height="12" fill="url(#csGold)"/>');
      o.push('<circle cx="' + (x + 141) + '" cy="200" r="38" fill="url(#csGlow)"/><path d="M' + (x + 133) + " 190h16l-3 22h-10z" + '" fill="#fff3c8"/>'); }
    o.push('<rect x="0" y="0" width="1200" height="52" fill="#12060a"/>');                  /* plafond à caissons dorés */
    for (i = 0; i < 12; i++) o.push('<rect x="' + (i * 100 + 8) + '" y="8" width="84" height="34" fill="none" stroke="url(#csGold)" stroke-width="2" opacity=".75"/>');
    o.push('<rect y="52" width="1200" height="6" fill="url(#csGold)"/>');
    o.push(chandelier(220, 60, 0.9) + chandelier(600, 58, 1.15) + chandelier(980, 60, 0.9));
    o.push('<polygon points="0,440 1200,440 1200,700 0,700" fill="url(#csCarpet)"/><rect y="440" width="1200" height="260" fill="url(#csFloorFade)"/><rect y="436" width="1200" height="6" fill="url(#csGold)"/>');
    for (i = 1; i < 6; i++) o.push('<line x1="' + (i * 200) + '" y1="440" x2="' + (600 + (i * 200 - 600) * 2.3) + '" y2="700" stroke="#c8a45e" stroke-opacity=".12"/>');
    o.push('<rect width="1200" height="700" fill="url(#csVig)"/></svg>'); return o.join("");
  }
  /* symboles de la machine à sous : <symbol> réutilisés par <use> */
  function symbols() {
    return '<svg class="cs-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="sgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#a3101f"/></linearGradient>' +
      '<linearGradient id="sgGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#b8892f"/></linearGradient>' +
      '<symbol id="sy-S" viewBox="0 0 64 64"><text x="32" y="52" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="64" fill="url(#sgRed)" stroke="#ffe9a0" stroke-width="2.4" paint-order="stroke">7</text></symbol>' +
      '<symbol id="sy-B" viewBox="0 0 64 64"><rect x="5" y="17" width="54" height="30" rx="5" fill="#14161b" stroke="url(#sgGold)" stroke-width="3"/><text x="32" y="40" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="20" fill="url(#sgGold)" letter-spacing="1">BAR</text></symbol>' +
      '<symbol id="sy-L" viewBox="0 0 64 64"><path d="M32 8a4 4 0 0 1 4 4v1c9 2 14 10 14 20v8l6 7H8l6-7v-8c0-10 5-18 14-20v-1a4 4 0 0 1 4-4z" fill="url(#sgGold)" stroke="#7a5a1c" stroke-width="2"/><circle cx="32" cy="54" r="5" fill="#b8892f" stroke="#7a5a1c" stroke-width="2"/></symbol>' +
      '<symbol id="sy-P" viewBox="0 0 64 64"><circle cx="32" cy="38" r="20" fill="#7d3c98" stroke="#4a1f60" stroke-width="2"/><ellipse cx="26" cy="31" rx="6" ry="4" fill="#fff" opacity=".25"/><path d="M32 18c2-8 8-10 14-9-1 7-6 10-14 9z" fill="#4caf50" stroke="#2e7d32" stroke-width="1.5"/></symbol>' +
      '<symbol id="sy-M" viewBox="0 0 64 64"><path d="M8 34c0-12 12-20 24-20 6 0 10 2 14 0 2 3 0 6 2 9 4 3 8 5 8 11 0 12-12 20-24 20S8 46 8 34z" fill="#ffd93b" stroke="#b8892f" stroke-width="2"/><ellipse cx="24" cy="30" rx="7" ry="4" fill="#fff" opacity=".35"/></symbol>' +
      '<symbol id="sy-C" viewBox="0 0 64 64"><path d="M20 44C22 30 28 18 40 10M44 46C44 32 44 22 40 10" fill="none" stroke="#3b7d34" stroke-width="3"/><circle cx="18" cy="46" r="11" fill="url(#sgRed)" stroke="#7a0f1a" stroke-width="2"/><circle cx="45" cy="48" r="11" fill="url(#sgRed)" stroke="#7a0f1a" stroke-width="2"/><ellipse cx="14" cy="42" rx="3" ry="2" fill="#fff" opacity=".5"/><ellipse cx="41" cy="44" rx="3" ry="2" fill="#fff" opacity=".5"/></symbol>' +
      '</defs></svg>';
  }
  function sym(k) { return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#sy-' + k + '"/></svg>'; }
  /* roue de roulette européenne : 37 poches dans l'ordre réel */
  function wheel(order, color) {
    var o = [], R1 = 138, R0 = 92, n = order.length, i, a0, a1, p = function (r, a) { return f(Math.sin(a) * r) + " " + f(-Math.cos(a) * r); };
    o.push('<svg class="cs-wheel" viewBox="-170 -170 340 340" role="img" aria-label="Roue de roulette européenne, 37 numéros"><defs><radialGradient id="rwWood"><stop offset=".78" stop-color="#6b3f1d"/><stop offset="1" stop-color="#2e1a0b"/></radialGradient><radialGradient id="rwCone"><stop offset="0" stop-color="#f6e3a8"/><stop offset=".6" stop-color="#c8a45e"/><stop offset="1" stop-color="#5a461d"/></radialGradient></defs>');
    o.push('<circle r="166" fill="url(#rwWood)" stroke="#c8a45e" stroke-width="3"/><circle r="146" fill="#1b1008" stroke="#8f7640" stroke-width="2"/><g class="rw-rot">');
    for (i = 0; i < n; i++) { a0 = (i - 0.5) / n * Math.PI * 2; a1 = (i + 0.5) / n * Math.PI * 2; var c = color(order[i]), fill = c === "green" ? "#1c7a3a" : c === "red" ? "#b3202f" : "#15171c";
      o.push('<path d="M' + p(R0, a0) + " L" + p(R1, a0) + " A" + R1 + " " + R1 + " 0 0 1 " + p(R1, a1) + " L" + p(R0, a1) + " A" + R0 + " " + R0 + ' 0 0 0 ' + p(R0, a0) + 'Z" fill="' + fill + '" stroke="#c8a45e" stroke-width="1"/>');
      var am = i / n * Math.PI * 2, tx = f(Math.sin(am) * 120), ty = f(-Math.cos(am) * 120);
      o.push('<text x="' + tx + '" y="' + ty + '" transform="rotate(' + f(i / n * 360) + " " + tx + " " + ty + ')" text-anchor="middle" dominant-baseline="central" font-family="Oxanium,Arial,sans-serif" font-weight="700" font-size="13" fill="#f4efe2">' + order[i] + "</text>"); }
    o.push('<circle r="86" fill="#2a1a0c" stroke="#c8a45e" stroke-width="2"/><circle r="62" fill="url(#rwCone)" stroke="#7a5f2c" stroke-width="2"/>');
    for (i = 0; i < 4; i++) { var aa = i * Math.PI / 2 + Math.PI / 4; o.push('<line x1="0" y1="0" x2="' + f(Math.sin(aa) * 58) + '" y2="' + f(-Math.cos(aa) * 58) + '" stroke="#5a461d" stroke-width="5" stroke-linecap="round"/>'); }
    o.push('<circle r="10" fill="#f6e3a8" stroke="#7a5f2c" stroke-width="2"/></g>');
    o.push('<g class="rw-ball"><circle cx="0" cy="-153" r="6.5" fill="#fffaf0" stroke="#aaa" stroke-width="1"/><circle cx="-2" cy="-155" r="2" fill="#fff"/></g></svg>'); return o.join("");
  }
  var SUIT = ["♠", "♥", "♦", "♣"], RANK = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  function card(c, back) {
    if (back) return '<div class="pc back" aria-label="Carte cachée"><i></i></div>';
    var s = Math.floor(c / 13), r = c % 13, red = s === 1 || s === 2;
    return '<div class="pc' + (red ? " red" : "") + '" aria-label="' + RANK[r] + " de " + ["pique", "cœur", "carreau", "trèfle"][s] + '"><b>' + RANK[r] + "</b><span>" + SUIT[s] + "</span><em>" + SUIT[s] + "</em></div>";
  }
  BL.casinoArt = { hall: hall, symbols: symbols, sym: sym, wheel: wheel, card: card };
})(typeof globalThis !== "undefined" ? globalThis : this);
