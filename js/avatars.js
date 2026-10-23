/* Avatars : 14 portraits dessinés en SVG, sans aucune image externe. Chaque avatar est une combinaison de pièces
   (fond, peau, tenue, coiffure, accessoire) : render(id, taille) renvoie le SVG sous forme de texte. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var SK = ["#f1c9a5", "#d9a47c", "#a96f4b", "#7a4a30", "#f6d8bf"];
  var LIST = [
    { id: "fedora", name: "Le Fedora", bg: ["#2b3a55", "#10141f"], skin: 0, suit: "#1b1f2a", tie: "#a8322d", hat: "fedora", hatc: "#2a2a30", ex: "" },
    { id: "cagoule", name: "Le Cagoulé", bg: ["#3b2a2a", "#120d0d"], skin: 1, suit: "#222", hat: "balaclava", hatc: "#17181c", ex: "" },
    { id: "cheffe", name: "La Cheffe", bg: ["#4a2b4f", "#150c18"], skin: 2, suit: "#2c1f33", hair: "long", hairc: "#14100f", ex: "lips", tie: "#c8a24a" },
    { id: "lunettes", name: "Le Costard", bg: ["#233f4a", "#0b1519"], skin: 4, suit: "#20262f", tie: "#2f6f8f", hair: "short", hairc: "#3a2a1c", ex: "glasses" },
    { id: "borgne", name: "Le Borgne", bg: ["#4a3a22", "#16110a"], skin: 3, suit: "#2a2218", hair: "buzz", hairc: "#0e0d0c", ex: "patch", tie: "#8c2c2c" },
    { id: "vieux", name: "Le Vieux Parrain", bg: ["#3d3d46", "#101014"], skin: 0, suit: "#1a1a1f", tie: "#c8a24a", hair: "bald", hairc: "#dcdcdc", ex: "stache" },
    { id: "dame", name: "La Dame au chapeau", bg: ["#512a34", "#170b0f"], skin: 4, suit: "#3a1f27", hat: "wide", hatc: "#1a1115", ex: "lips", tie: "#d6b25a" },
    { id: "barbu", name: "Le Barbu", bg: ["#2a4a3a", "#0b1711"], skin: 1, suit: "#1f2a25", hair: "short", hairc: "#1a1410", ex: "beard", tie: "#6a8f58" },
    { id: "masque", name: "Le Masqué", bg: ["#3a2a52", "#110c1a"], skin: 2, suit: "#1e1a2a", hat: "hood", hatc: "#17131f", ex: "mask" },
    { id: "gamin", name: "Le Gamin de rue", bg: ["#4a4222", "#15130a"], skin: 3, suit: "#3a3a40", hat: "cap", hatc: "#b8372f", ex: "scar" },
    { id: "hackeuse", name: "La Hackeuse", bg: ["#16403f", "#07191a"], skin: 4, suit: "#1f2b2b", hat: "hood", hatc: "#0f2a2a", ex: "headset", hair: "none" },
    { id: "banquier", name: "Le Banquier", bg: ["#3a3f2a", "#10120b"], skin: 0, suit: "#252a1f", tie: "#d6b25a", hair: "side", hairc: "#8a7a5a", ex: "monocle" },
    { id: "boxeur", name: "Le Boxeur", bg: ["#4a2a22", "#160d0a"], skin: 2, suit: "#2a1e1a", hair: "buzz", hairc: "#0f0c0b", ex: "scar", tie: "#a8322d" },
    { id: "fatale", name: "La Fatale", bg: ["#4a2230", "#170a10"], skin: 1, suit: "#241218", hair: "bob", hairc: "#0e0a0b", ex: "shades", tie: "#c8a24a" }
  ];
  function find(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return LIST[0]; }
  function has(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return true; return false; }
  var uid = 0;
  function render(id, size) {
    var a = find(id), sk = SK[a.skin], g = "avg" + (++uid), o = [], hc = a.hairc || "#16120f";
    o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="' + (size || 64) + '" height="' + (size || 64) + '" role="img" aria-label="' + a.name + '"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a.bg[0] + '"/><stop offset="1" stop-color="' + a.bg[1] + '"/></linearGradient></defs><rect width="64" height="64" fill="url(#' + g + ')"/>');
    o.push('<circle cx="32" cy="30" r="26" fill="#ffffff" opacity=".04"/>');
    /* épaules + col + cravate */
    o.push('<path d="M6 64 C8 50 20 46 32 46 C44 46 56 50 58 64 Z" fill="' + a.suit + '"/><path d="M26 46 L32 56 L38 46 Z" fill="#e8e4da" opacity=".9"/>');
    if (a.tie) o.push('<path d="M30.5 51 L33.5 51 L34.5 63 L32 64 L29.5 63 Z" fill="' + a.tie + '"/>');
    o.push('<rect x="27" y="38" width="10" height="9" rx="3" fill="' + sk + '"/><rect x="27" y="38" width="10" height="4" rx="2" fill="#000" opacity=".16"/>');
    /* cheveux arrière */
    if (a.hair === "long") o.push('<path d="M17 30 C15 14 49 14 47 30 L48 52 C42 48 22 48 16 52 Z" fill="' + hc + '"/>');
    if (a.hair === "bob") o.push('<path d="M16 28 C16 12 48 12 48 28 L49 42 C42 44 22 44 15 42 Z" fill="' + hc + '"/>');
    /* visage */
    o.push('<ellipse cx="32" cy="27" rx="12" ry="14" fill="' + sk + '"/>');
    o.push('<ellipse cx="20.5" cy="28" rx="2" ry="3.2" fill="' + sk + '"/><ellipse cx="43.5" cy="28" rx="2" ry="3.2" fill="' + sk + '"/>');
    /* cheveux avant */
    if (a.hair === "short") o.push('<path d="M20 25 C19 11 45 11 44 25 C41 19 36 17 32 17 C28 17 23 19 20 25 Z" fill="' + hc + '"/>');
    if (a.hair === "buzz") o.push('<path d="M20.5 24 C20 12 44 12 43.5 24 C40 19 24 19 20.5 24 Z" fill="' + hc + '" opacity=".85"/>');
    if (a.hair === "side") o.push('<path d="M20 25 C18 10 46 10 44 25 C42 20 34 16 24 20 Z" fill="' + hc + '"/>');
    if (a.hair === "long" || a.hair === "bob") o.push('<path d="M19 28 C17 10 47 10 45 28 C44 20 38 15 32 15 C26 15 20 20 19 28 Z" fill="' + hc + '"/>');
    if (a.hair === "bald") o.push('<path d="M20 26 C19 24 20 22 21 22 L21 28 Z M44 26 C45 24 44 22 43 22 L43 28 Z" fill="' + hc + '"/>');
    /* yeux, sourcils, bouche */
    var eyes = '<ellipse cx="27" cy="27" rx="1.6" ry="1.1" fill="#15110f"/><ellipse cx="37" cy="27" rx="1.6" ry="1.1" fill="#15110f"/>';
    if (a.ex !== "shades" && a.ex !== "mask") o.push(eyes);
    o.push('<path d="M24.5 23.8 L29.5 24.4 M34.5 24.4 L39.5 23.8" stroke="' + (a.hair && a.hair !== "none" && a.hair !== "bald" ? hc : "#2a1f18") + '" stroke-width="1.5" stroke-linecap="round"/>');
    o.push('<path d="M32 28 L31 32.5 L33 32.5" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1"/>');
    if (a.ex === "lips") o.push('<path d="M28 35.5 Q32 38 36 35.5 Q32 36.6 28 35.5 Z" fill="#b4202e"/>'); else if (a.ex !== "mask" && a.hat !== "balaclava") o.push('<path d="M28.5 35.8 Q32 37.4 35.5 35.8" fill="none" stroke="#3a1f1a" stroke-width="1.3" stroke-linecap="round"/>');
    /* accessoires */
    if (a.ex === "glasses") o.push('<g fill="#9fd4e6" fill-opacity=".18" stroke="#0e0e10" stroke-width="1.3"><rect x="22.5" y="24.4" width="8" height="5.6" rx="2"/><rect x="33.5" y="24.4" width="8" height="5.6" rx="2"/></g><path d="M30.5 26.5 L33.5 26.5" stroke="#0e0e10" stroke-width="1.2"/>');
    if (a.ex === "shades") o.push('<path d="M21.5 24.5 L42.5 24.5 L41 30 Q37 31 35 28.5 L33 27 L31 27 L29 28.5 Q27 31 23 30 Z" fill="#0b0b0e"/><path d="M24 25.5 L28 25.5" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>');
    if (a.ex === "patch") o.push('<path d="M22 21 L42 30" stroke="#0e0e10" stroke-width="1.1"/><ellipse cx="37" cy="27" rx="3.4" ry="3" fill="#0e0e10"/>');
    if (a.ex === "stache") o.push('<path d="M26 33.6 Q29 31.6 32 33.4 Q35 31.6 38 33.6 Q35 35 32 34 Q29 35 26 33.6 Z" fill="' + hc + '"/>');
    if (a.ex === "beard") o.push('<path d="M20.5 30 Q21 42 32 43 Q43 42 43.5 30 Q40 37 32 37 Q24 37 20.5 30 Z" fill="' + hc + '"/><path d="M27 34 Q32 32.5 37 34" stroke="' + hc + '" stroke-width="2" fill="none"/>');
    if (a.ex === "scar") o.push('<path d="M36.5 20 L40 33" stroke="#6b2a2a" stroke-width="1.4" stroke-linecap="round"/><path d="M35.6 24 L38.4 23 M36.4 28 L39.2 27" stroke="#6b2a2a" stroke-width="1"/>');
    if (a.ex === "monocle") o.push('<circle cx="37" cy="27" r="4.2" fill="#e8d9a0" fill-opacity=".15" stroke="#c8a24a" stroke-width="1.2"/><path d="M40.5 29.5 Q43 36 40 42" fill="none" stroke="#c8a24a" stroke-width=".9"/>');
    if (a.ex === "headset") o.push('<path d="M19 28 C17 10 47 10 45 28" fill="none" stroke="#10181a" stroke-width="2.2"/><rect x="16.6" y="25" width="4" height="8" rx="2" fill="#10181a"/><path d="M19 33 Q20 38 27 38" fill="none" stroke="#10181a" stroke-width="1.4"/><circle cx="27.5" cy="38" r="1.5" fill="#3ff"/>');
    if (a.ex === "mask") o.push('<path d="M20.6 25 Q32 21 43.4 25 L43 31 Q32 36 21 31 Z" fill="#0e0e12"/><ellipse cx="27" cy="27.6" rx="2.1" ry="1.3" fill="#e8e4da"/><ellipse cx="37" cy="27.6" rx="2.1" ry="1.3" fill="#e8e4da"/>');
    /* couvre-chefs */
    if (a.hat === "fedora") o.push('<ellipse cx="32" cy="17.5" rx="17" ry="4" fill="' + a.hatc + '"/><path d="M21 17.5 C21 7 43 7 43 17.5 Z" fill="' + a.hatc + '"/><path d="M21.4 15.4 C26 17 38 17 42.6 15.4 L42.8 17.6 C38 19 26 19 21.2 17.6 Z" fill="#a8322d"/>');
    if (a.hat === "wide") o.push('<ellipse cx="32" cy="17" rx="21" ry="4.6" fill="' + a.hatc + '"/><path d="M22 17 C22 8 42 8 42 17 Z" fill="' + a.hatc + '"/><path d="M22.2 15.3 C27 17 37 17 41.8 15.3 L42 17 C37 18.6 27 18.6 22 17 Z" fill="#c8a24a"/>');
    if (a.hat === "cap") o.push('<path d="M20 22 C19 8 45 8 44 22 C40 17 24 17 20 22 Z" fill="' + a.hatc + '"/><path d="M18 21 C24 17.6 36 17.6 46 22 L46 24 C36 20.8 26 20.8 18 24 Z" fill="' + a.hatc + '"/><path d="M42 20 C48 20 52 22 54 24 L50 24.6 C47 23 44 22.6 41 22.4 Z" fill="#8f2a24"/>');
    if (a.hat === "hood") o.push('<path d="M14 40 C10 8 54 8 50 40 L45 46 C47 28 44 17 32 17 C20 17 17 28 19 46 Z" fill="' + a.hatc + '"/>');
    if (a.hat === "balaclava") o.push('<path d="M17 36 C13 6 51 6 47 36 L42 46 L22 46 Z" fill="' + a.hatc + '"/><path d="M21 24.2 Q32 22 43 24.2 L42.6 29.8 Q32 31.2 21.4 29.8 Z" fill="' + sk + '"/>' + '<ellipse cx="27" cy="27" rx="1.7" ry="1.2" fill="#15110f"/><ellipse cx="37" cy="27" rx="1.7" ry="1.2" fill="#15110f"/>');
    o.push('</svg>'); return o.join("");
  }
  BL.avatars = { LIST: LIST, find: find, has: has, render: render, DEFAULT: LIST[0].id };
})(typeof globalThis !== "undefined" ? globalThis : this);
