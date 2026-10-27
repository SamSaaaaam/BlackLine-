/* Illustrations vectorielles du jeu (aucune image externe) : scènes d'activités, médailles, glyphes, emblème de marque.
   Les dégradés sont déclarés une fois dans index.html (<defs id="artDefs">). */
(function (root) {
  var BL = root.BL = root.BL || {};
  var G = "url(#gGold)", GD = "url(#gGoldD)", SL = "url(#gSlate)", NI = "url(#gNight)";
  function wrap(vb, body, cls) { return '<svg class="art ' + (cls || "") + '" viewBox="' + vb + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + body + "</svg>"; }
  function stars(n, seed) { var o = "", x = seed; for (var i = 0; i < n; i++) { x = (x * 9301 + 49297) % 233280; var a = x / 233280; x = (x * 9301 + 49297) % 233280; o += '<circle cx="' + (a * 240).toFixed(1) + '" cy="' + (x / 233280 * 40).toFixed(1) + '" r="' + (0.5 + (i % 3) * 0.35) + '" fill="#e9e2cf" opacity="' + (0.35 + (i % 4) * 0.12) + '"/>'; } return o; }

  /* ---- scènes 240×120 ---- */
  var SCENE = {
    backroom: function () {
      return '<rect width="240" height="120" fill="url(#gRoom)"/>' +
        '<path d="M120 0v22" stroke="#6b6250" stroke-width="1.5"/><path d="M104 40Q120 18 136 40Z" fill="#2a2d33"/><path d="M104 40Q120 22 136 40Z" fill="' + G + '" opacity=".9"/>' +
        '<path d="M110 41L60 120H180L130 41Z" fill="url(#gCone)"/>' +
        '<rect x="0" y="92" width="240" height="28" fill="#0c0e12"/><ellipse cx="120" cy="96" rx="78" ry="17" fill="#3a2a22"/><ellipse cx="120" cy="93" rx="72" ry="14" fill="#1f3a33"/><ellipse cx="120" cy="93" rx="72" ry="14" fill="none" stroke="' + G + '" stroke-width="1.2" opacity=".7"/>' +
        '<g transform="translate(94 78) rotate(-14)"><rect width="16" height="22" rx="2" fill="#efe9da"/><text x="3" y="13" font-size="9" fill="#b3473f" font-family="serif">A</text></g><g transform="translate(106 76) rotate(2)"><rect width="16" height="22" rx="2" fill="#f4eee0"/><text x="3" y="14" font-size="9" fill="#14171c" font-family="serif">K</text></g><g transform="translate(119 78) rotate(16)"><rect width="16" height="22" rx="2" fill="#efe9da"/><text x="3" y="14" font-size="9" fill="#b3473f" font-family="serif">Q</text></g>' +
        '<g><ellipse cx="160" cy="97" rx="8" ry="3" fill="#a98943"/><ellipse cx="160" cy="94" rx="8" ry="3" fill="#c8a45e"/><ellipse cx="160" cy="91" rx="8" ry="3" fill="#e3c680"/><ellipse cx="75" cy="99" rx="8" ry="3" fill="#7a2e2e"/><ellipse cx="75" cy="96" rx="8" ry="3" fill="#b3473f"/></g>' +
        '<g fill="#0a0b0e" opacity=".85"><circle cx="36" cy="70" r="11"/><path d="M14 120c0-22 10-36 22-36s22 14 22 36z"/><circle cx="206" cy="68" r="11"/><path d="M184 120c0-22 10-36 22-36s22 14 22 36z"/></g>';
    },
    freight: function () {
      return '<rect width="240" height="120" fill="' + NI + '"/>' + stars(30, 7) + '<circle cx="196" cy="28" r="13" fill="#efe6c8"/><circle cx="201" cy="25" r="11" fill="#1b2330"/>' +
        '<path d="M0 84L40 70L80 80L130 64L180 78L240 66V120H0Z" fill="#10141b"/><rect y="88" width="240" height="32" fill="#0b0d11"/><path d="M0 104H240" stroke="#c8a45e" stroke-width="1.5" stroke-dasharray="14 10" opacity=".55"/>' +
        '<path d="M60 90L0 80V100Z" fill="url(#gBeam)"/>' +
        '<g transform="translate(70 62)"><rect x="34" y="4" width="92" height="38" rx="3" fill="#2a303a"/><rect x="34" y="4" width="92" height="6" fill="#39414d"/><path d="M34 20H126" stroke="#c8a45e" stroke-width="1.2" opacity=".6"/><path d="M6 14H32V42H0V26Z" fill="#363d49"/><path d="M10 16H28V26H6Z" fill="#8fa5b8" opacity=".75"/><rect x="0" y="40" width="130" height="5" fill="#161a20"/><g fill="#0c0e12"><circle cx="20" cy="48" r="7"/><circle cx="84" cy="48" r="7"/><circle cx="104" cy="48" r="7"/></g><g fill="#6a6f78"><circle cx="20" cy="48" r="3"/><circle cx="84" cy="48" r="3"/><circle cx="104" cy="48" r="3"/></g><circle cx="2" cy="32" r="2.6" fill="#f6e7b0"/></g>';
    },
    fence: function () {
      return '<rect width="240" height="120" fill="url(#gRoom)"/><path d="M0 30H240M0 60H240M0 90H240" stroke="#1d222a" stroke-width="2"/><path d="M60 0V120M120 0V120M180 0V120" stroke="#1a1e25" stroke-width="2"/>' +
        '<path d="M120 0v26" stroke="#6b6250" stroke-width="1.2"/><circle cx="120" cy="30" r="5" fill="#f6e7b0"/><circle cx="120" cy="30" r="16" fill="url(#gGlow)"/>' +
        '<rect y="100" width="240" height="20" fill="#0c0e12"/>' +
        '<g><rect x="28" y="72" width="42" height="30" fill="#6b4c2f"/><path d="M28 72H70M28 82H70" stroke="#3d2b1a" stroke-width="2"/><rect x="34" y="42" width="34" height="30" fill="#7a5835"/><path d="M34 52H68" stroke="#3d2b1a" stroke-width="2"/><rect x="132" y="76" width="50" height="26" fill="#5d4129"/><path d="M132 86H182" stroke="#3d2b1a" stroke-width="2"/><rect x="190" y="68" width="30" height="34" fill="#6b4c2f"/><rect x="139" y="50" width="34" height="26" fill="#7a5835"/><rect x="98" y="84" width="26" height="18" fill="#6b4c2f"/></g>' +
        '<rect x="42" y="54" width="14" height="9" fill="#efe9da"/><rect x="198" y="80" width="14" height="9" fill="' + G + '"/><rect x="104" y="90" width="12" height="7" fill="#efe9da"/>' +
        '<rect x="196" y="22" width="30" height="40" fill="#13161b"/><path d="M196 22H226" stroke="#2f343d" stroke-width="2"/><path d="M200 40H222" stroke="#c8a45e" stroke-width="2" opacity=".8"/>';
    },
    estate: function () {
      var w = "", r, c; for (r = 0; r < 5; r++) for (c = 0; c < 6; c++) w += '<rect x="' + (86 + c * 12) + '" y="' + (20 + r * 15) + '" width="7" height="9" fill="' + ((r * 3 + c * 5) % 4 === 0 ? "#2a2f38" : "#f1d98f") + '" opacity="' + ((r * 3 + c * 5) % 4 === 0 ? 1 : .85) + '"/>';
      return '<rect width="240" height="120" fill="' + NI + '"/>' + stars(20, 13) + '<path d="M0 100V70H18V54H40V76H56V60H78V100Z" fill="#0f1218"/><path d="M168 100V58H190V44H212V70H240V100Z" fill="#0f1218"/>' +
        '<rect x="80" y="14" width="80" height="86" fill="#1a1e26"/><rect x="80" y="14" width="80" height="4" fill="' + G + '"/>' + w +
        '<rect x="106" y="80" width="28" height="20" fill="#0c0e12"/><path d="M102 80H138L134 70H106Z" fill="' + G + '" opacity=".9"/><rect x="116" y="84" width="8" height="16" fill="#f1d98f" opacity=".85"/>' +
        '<rect y="100" width="240" height="20" fill="#0b0d11"/><path d="M0 108H240" stroke="#2a2f38" stroke-width="1"/>';
    },
    holding: function () {
      return '<rect width="240" height="120" fill="url(#gDusk)"/><circle cx="52" cy="46" r="15" fill="#f1d98f" opacity=".95"/><circle cx="52" cy="46" r="26" fill="url(#gGlow)"/>' + stars(14, 21) +
        '<rect y="78" width="240" height="42" fill="#0f2a33"/><path d="M0 84Q20 80 40 84T80 84T120 84T160 84T200 84T240 84" stroke="#2b5b66" stroke-width="1.2" fill="none"/><path d="M0 96Q20 92 40 96T80 96T120 96T160 96T200 96T240 96" stroke="#1f4650" stroke-width="1.2" fill="none"/><path d="M0 108Q20 104 40 108T80 108T120 108T160 108T200 108T240 108" stroke="#173a43" stroke-width="1.2" fill="none"/>' +
        '<path d="M120 80Q150 60 200 66Q226 70 238 80Z" fill="#17241f"/><g><path d="M160 66L190 66L196 60H154Z" fill="' + G + '"/><rect x="156" y="52" width="36" height="8" fill="#e8e2d2"/><path d="M154 52L174 40L194 52Z" fill="#cfc8b5"/><g fill="#9aa1a9"><rect x="159" y="60" width="4" height="6"/><rect x="168" y="60" width="4" height="6"/><rect x="177" y="60" width="4" height="6"/><rect x="186" y="60" width="4" height="6"/></g></g>' +
        '<path d="M214 70c0-14 2-22 6-28" stroke="#3a2f22" stroke-width="2.4" fill="none"/><path d="M220 42c-10-6-18-2-22 4 8-2 14-1 22-4zM220 42c8-8 18-6 22 0-8-2-14 0-22 0zM220 42c-3-9-10-12-17-10 7 2 12 6 17 10z" fill="#1f4a36"/>';
    },
    /* Partie 19 · F : trois scènes de plus, même nuit, même trait */
    maritime: function () {
      var c = "", i, cols = ["#7a3b34", "#35506b", "#6b5a2f", "#3d5a4a", "#5a3d6b", "#2f5f6f"];
      for (i = 0; i < 9; i++) c += '<rect x="' + (128 + (i % 3) * 30) + '" y="' + (62 - Math.floor(i / 3) * 12) + '" width="28" height="11" fill="' + cols[(i * 5) % 6] + '"/><path d="M' + (131 + (i % 3) * 30) + " " + (64 - Math.floor(i / 3) * 12) + "v7M" + (137 + (i % 3) * 30) + " " + (64 - Math.floor(i / 3) * 12) + 'v7" stroke="#0b0d11" stroke-width="1" opacity=".5"/>';
      return '<rect width="240" height="120" fill="' + NI + '"/>' + stars(24, 33) + '<circle cx="40" cy="26" r="10" fill="#efe6c8" opacity=".9"/><circle cx="40" cy="26" r="22" fill="url(#gGlow)"/>' +
        '<rect y="76" width="240" height="44" fill="#0f2a33"/><path d="M0 86Q20 82 40 86T80 86T120 86T160 86T200 86T240 86" stroke="#2b5b66" stroke-width="1.2" fill="none"/><path d="M0 100Q20 96 40 100T80 100T120 100T160 100T200 100T240 100" stroke="#1f4650" stroke-width="1.2" fill="none"/>' +
        '<path d="M118 76H232L222 92H124Z" fill="#1a2027"/><rect x="118" y="73" width="114" height="4" fill="#2a3540"/>' + c +
        '<path d="M34 76V18M34 18H108M34 26L60 18M100 18V44" stroke="#c8a45e" stroke-width="3" fill="none"/><path d="M28 76H40" stroke="#c8a45e" stroke-width="4"/><rect x="92" y="44" width="16" height="6" fill="#5fb0c8"/><path d="M100 18V10" stroke="#8a93a2" stroke-width="2"/><circle cx="100" cy="9" r="2.2" fill="#ff4d4d"/>' +
        '<path d="M0 76H118" stroke="#2a3540" stroke-width="4"/><g fill="#0a0b0e" opacity=".85"><circle cx="70" cy="62" r="5"/><path d="M63 76c0-9 3-13 7-13s7 4 7 13z"/></g>';
    },
    shell: function () {
      return '<rect width="240" height="120" fill="url(#gDusk)"/>' + stars(12, 41) +
        '<path d="M0 100V64H22V50H44V72H60V100Z" fill="#0f1218"/><path d="M180 100V56H204V44H226V68H240V100Z" fill="#0f1218"/>' +
        '<rect x="66" y="38" width="108" height="62" fill="#3b3f33"/><path d="M60 38L120 12L180 38Z" fill="#4a4f3e"/><path d="M74 36L120 16L166 36Z" fill="#2c3026"/><circle cx="120" cy="28" r="5" fill="' + G + '"/>' +
        '<rect x="62" y="38" width="116" height="5" fill="#b9c7a0"/>' +
        [78, 98, 136, 156].map(function (x) { return '<rect x="' + x + '" y="44" width="7" height="48" fill="#d9dccb"/><rect x="' + (x - 2) + '" y="44" width="11" height="3" fill="#eef0e2"/>'; }).join("") +
        '<rect x="112" y="62" width="16" height="30" fill="#14161a"/><rect x="114" y="64" width="12" height="28" fill="#f1d98f" opacity=".75"/><rect x="88" y="54" width="6" height="12" fill="#f1d98f" opacity=".8"/><rect x="146" y="54" width="6" height="12" fill="#f1d98f" opacity=".6"/>' +
        '<rect x="60" y="92" width="120" height="4" fill="#d9dccb"/><rect x="56" y="96" width="128" height="4" fill="#c4c8b4"/><rect y="100" width="240" height="20" fill="#0b0d11"/>' +
        '<g fill="#0a0b0e" opacity=".9"><circle cx="196" cy="84" r="5"/><path d="M188 100c0-10 3-14 8-14s8 4 8 14z"/></g><rect x="200" y="88" width="10" height="7" fill="#3a2f22"/>';
    },
    guard: function () {
      return '<rect width="240" height="120" fill="' + NI + '"/>' + stars(26, 57) +
        '<path d="M0 100V70H30V58H52V80H70V100Z" fill="#0f1218"/>' +
        '<rect x="80" y="48" width="96" height="52" fill="#2f343d"/><rect x="80" y="48" width="96" height="5" fill="#a4adbd"/>' + [90, 112, 134, 156].map(function (x) { return '<rect x="' + x + '" y="60" width="12" height="9" fill="#f1d98f" opacity=".7"/>'; }).join("") +
        '<rect x="118" y="78" width="20" height="22" fill="#14161a"/><path d="M124 86l4 3 6-6" stroke="#a4adbd" stroke-width="2" fill="none"/>' +
        '<rect x="190" y="30" width="16" height="70" fill="#3a404c"/><rect x="184" y="20" width="28" height="14" fill="#262a31"/><rect x="186" y="23" width="24" height="7" fill="#ffe9a0" opacity=".85"/><path d="M198 26L240 0V52Z" fill="url(#gBeam)" opacity=".7"/>' +
        '<path d="M0 100H240" stroke="#2a2f38" stroke-width="2"/>' + [0, 14, 28, 42, 56, 70].map(function (x) { return '<path d="M' + x + ' 100V84" stroke="#4a505a" stroke-width="2"/>'; }).join("") + '<path d="M0 86H74" stroke="#4a505a" stroke-width="1.5"/>' +
        '<rect y="100" width="240" height="20" fill="#0b0d11"/><g fill="#0a0b0e" opacity=".9"><circle cx="100" cy="86" r="5"/><path d="M92 100c0-10 3-14 8-14s8 4 8 14z"/><circle cx="156" cy="86" r="5"/><path d="M148 100c0-10 3-14 8-14s8 4 8 14z"/></g>';
    }
  };
  function act(id) {
    var f = SCENE[id]; return f ? wrap("0 0 240 120", f(), "scene s-" + id) : wrap("0 0 240 120", '<rect width="240" height="120" fill="' + NI + '"/>', "scene");
  }

  /* ---- glyphes 24×24 (dessinés en doré) pour médailles et améliorations ---- */
  var GL = {
    coin: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v10M15 9.5c-.8-.8-1.8-1-3-1-1.7 0-2.7.8-2.7 1.9 0 2.6 5.7 1.2 5.7 3.8 0 1.2-1.1 2-3 2-1.3 0-2.3-.4-3.1-1.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    up: '<path d="M6 17l6-6 6 6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    star: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 17l-5.3 2.9 1.1-6L3.4 9.8l6-.8z" fill="currentColor" opacity=".9"/>',
    building: '<path d="M5 20V9l7-5 7 5v11M9 20v-5h6v5M9 11h2M13 11h2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
    all: '<circle cx="12" cy="12" r="2.4" fill="currentColor"/><circle cx="12" cy="4.8" r="1.9" fill="currentColor"/><circle cx="19" cy="9.8" r="1.9" fill="currentColor"/><circle cx="16.3" cy="18.4" r="1.9" fill="currentColor"/><circle cx="7.7" cy="18.4" r="1.9" fill="currentColor"/><circle cx="5" cy="9.8" r="1.9" fill="currentColor"/>',
    infl: '<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.400 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10.5" r="2.3" fill="currentColor"/>',
    shield: '<path d="M12 3l7 3v5.500c0 4.500-3 8-7 9.500-4-1.500-7-5-7-9.500V6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2.200 2.200L15.500 9.800" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    ledger: '<rect x="5" y="3.500" width="14" height="17" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.500 8h7M8.500 12h7M8.500 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    tag: '<path d="M3.500 12.500V4.500h8l9 9-8 8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8" cy="9" r="1.600" fill="currentColor"/>',
    scales: '<path d="M12 4v16M6 20h12M5 7h14M5 7l-2.500 6a3 3 0 0 0 5 0zM19 7l-2.500 6a3 3 0 0 0 5 0z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    crew: '<circle cx="12" cy="8" r="3.500" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    handshake: '<path d="M3 11l4-3 4 2 3-2 4 3 3-1M7 8l-2 8 4 3 3-1 4 2 4-4-3-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>'
  };
  function glyph(n, cls) { return '<svg class="gl ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (GL[n] || GL.star) + "</svg>"; }
  /* glyphe associé à une condition (missions et succès) */
  function condGlyph(c) {
    var t = c && c.t;
    return { total: "coin", income: "coin", upgrades: "gear", level: "up", rep: "star", owned: "building", all: "all", infl: "infl", terr: "pin", dlv: "shield", won: "shield", crew: "crew", clv: "up", star: "star", ally: "handshake" }[t] || "star";
  }

  /* ---- médaille ronde ---- */
  function medal(g, on) {
    return '<svg class="art medal ' + (on ? "on" : "off") + '" viewBox="0 0 64 72" aria-hidden="true"><path d="M20 44L12 70l10-5 6 6 4-24z" fill="#2c323c"/><path d="M44 44l8 26-10-5-6 6-4-24z" fill="' + (on ? "#8f7640" : "#2c323c") + '"/>' +
      '<circle cx="32" cy="30" r="25" fill="' + (on ? G : "#2a2f38") + '"/><circle cx="32" cy="30" r="20.500" fill="#14171c"/><circle cx="32" cy="30" r="20.500" fill="none" stroke="' + (on ? "#e3c680" : "#3a404a") + '" stroke-width="1" stroke-dasharray="1.500 2.500"/>' +
      '<g transform="translate(18 16) scale(1.170)" style="color:' + (on ? "#e8cd8a" : "#5d636d") + '">' + (GL[g] || GL.star) + "</g></svg>";
  }
  /* ---- tuile d'amélioration ---- */
  function upgTile(u) {
    var f = u.fx || {}, key = f.inc ? Object.keys(f.inc)[0] : null, g = f.upkeep ? "ledger" : f.incAll ? (u.id === "u_lawyer" ? "scales" : "coin") : f.cost ? "tag" : f.infl && !f.rep ? "pin" : f.rep ? "star" : "gear";
    if (key && SCENE[key]) return '<div class="utile">' + act(key) + "</div>";
    return '<div class="utile g">' + glyph(g) + "</div>";
  }
  /* ---- emblème de marque ---- */
  function crest() {
    return '<svg class="crest" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2l16 6v14c0 11-7 17-16 20C11 39 4 33 4 22V8z" fill="#14171c" stroke="' + G + '" stroke-width="2"/><path d="M20 7l11 4v10c0 8-5 12-11 14-6-2-11-6-11-14V11z" fill="none" stroke="#8f7640" stroke-width=".8"/><path d="M12 28L28 14" stroke="' + G + '" stroke-width="2.600" stroke-linecap="round"/><path d="M14 13h6c3 0 4.500 1.600 4.500 3.600S23 20 20 20h-6zM14 20h7c3.200 0 5 1.800 5 4s-1.800 4-5 4h-7z" fill="#ece8df" opacity=".92"/></svg>';
  }
  /* ---- séparateur ornemental ---- */
  function rule() { return '<svg class="rule" viewBox="0 0 120 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4H50M70 4H120" stroke="#8f7640" stroke-width="1"/><path d="M60 0.500l3.500 3.500-3.500 3.500-3.500-3.500z" fill="#c8a45e"/></svg>'; }

  BL.art = { act: act, glyph: glyph, condGlyph: condGlyph, medal: medal, upgTile: upgTile, crest: crest, rule: rule };
})(typeof globalThis !== "undefined" ? globalThis : this);
