/* Boutique (lingots d'or uniquement) : décors de la ville équipables, et boosts de revenus temporaires.
   Règles : un seul boost à la fois (ceux des événements comptent aussi), jamais permanent, arrêté par une absence ; aucun argent réel. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var SLOTS = [["ambiance", "Ambiances"], ["palette", "Palettes de couleurs"], ["light", "Effets de lumière"], ["lamps", "Lampadaires"], ["signs", "Enseignes"], ["urban", "Éléments urbains"]];
  /* id, emplacement, nom, description, rareté (0 à 3), prix en lingots */
  var RAW = [
    ["amb_stars", "ambiance", "Nuit étoilée", "Un ciel clouté d’étoiles au-dessus de la ville.", 0, 8], ["amb_fog", "ambiance", "Brume du port", "Un voile de brume glisse entre les immeubles.", 0, 8],
    ["amb_rain", "ambiance", "Pluie fine", "La pluie tombe sur les toits, la ville brille.", 1, 10], ["amb_dawn", "ambiance", "Aube dorée", "Les premières lueurs réchauffent la ville.", 1, 12],
    ["amb_dusk", "ambiance", "Crépuscule", "Un ciel violet et orangé, l’heure des affaires discrètes.", 1, 12], ["amb_neon", "ambiance", "Nuit néon", "La ville baigne dans le rose et le cyan.", 2, 18],
    ["pal_ice", "palette", "Bleu glacé", "Une teinte froide, presque polaire.", 0, 8], ["pal_ruby", "palette", "Rouge rubis", "Une ville teintée de rouge sombre.", 0, 8], ["pal_emerald", "palette", "Émeraude", "Des reflets verts de casino.", 0, 8],
    ["pal_gold", "palette", "Noir & or", "Une teinte chaude et luxueuse.", 1, 10], ["pal_violet", "palette", "Violet nuit", "Un violet profond sur toute la carte.", 1, 10], ["pal_sepia", "palette", "Sépia 1930", "L’ambiance d’un vieux film de gangsters.", 1, 10],
    ["lit_bloom", "light", "Halos éclatants", "Toutes les lumières de la ville brillent plus fort.", 1, 10], ["lit_fly", "light", "Lucioles dorées", "Des points de lumière flottent dans l’air.", 1, 12],
    ["lit_search", "light", "Projecteurs de la pègre", "Deux faisceaux balaient le ciel.", 2, 14], ["lit_storm", "light", "Éclairs lointains", "Un orage éclaire parfois l’horizon.", 2, 14],
    ["lamp_gold", "lamps", "Lampadaires dorés", "Une lumière dorée, plus large.", 0, 8], ["lamp_blue", "lamps", "Lampadaires bleus", "Une lumière froide et nette.", 0, 8], ["lamp_red", "lamps", "Lampadaires rouges", "Une lumière rouge de quartier chaud.", 1, 8], ["lamp_neon", "lamps", "Lampadaires néon", "Rose et cyan en alternance.", 2, 12],
    ["sign_neon", "signs", "Enseignes néon sur les toits", "Chaque établissement porte une enseigne lumineuse.", 1, 14], ["sign_gold", "signs", "Hologrammes dorés", "Des enseignes dorées flottent au-dessus des établissements.", 2, 20],
    ["urb_blossom", "urban", "Cerisiers en fleurs", "Les parcs se couvrent de fleurs roses.", 1, 10], ["urb_lantern", "urban", "Lanternes rouges", "Des lanternes éclairent les arbres des parcs.", 1, 10], ["urb_fountain", "urban", "Fontaines dorées", "Les fontaines des places deviennent dorées.", 2, 12]
  ];
  var CITY = RAW.map(function (r) { return { id: r[0], slot: r[1], name: r[2], desc: r[3], rar: r[4], cost: r[5] }; }), BY = {}; CITY.forEach(function (c) { BY[c.id] = c; });
  /* id, nom, multiplicateur, durée (s), prix en lingots. Gain en « secondes de revenus » par lingot : 75 / 90 / 90, volontairement proches. */
  var BOOSTS = [
    { id: "bst_x2_10", name: "Surcharge", mult: 2, dur: 600, cost: 8 }, { id: "bst_x15_60", name: "Rythme soutenu", mult: 1.5, dur: 3600, cost: 20 }, { id: "bst_x125_180", name: "Marché porteur", mult: 1.25, dur: 10800, cost: 30 }
  ], BB = {}; BOOSTS.forEach(function (b) { BB[b.id] = b; });
  var preview = null;
  function G() { return BL.gold; }
  function initState(s) { s.shop = { own: {}, eq: {}, used: 0 }; }
  function sanitize(r, s) {
    initState(s); var q = r.shop && typeof r.shop === "object" ? r.shop : {};
    if (q.own && typeof q.own === "object") Object.keys(q.own).forEach(function (id) { if (BY[id] && q.own[id]) s.shop.own[id] = 1; });
    if (q.eq && typeof q.eq === "object") SLOTS.forEach(function (sl) { var id = q.eq[sl[0]]; if (typeof id === "string" && BY[id] && BY[id].slot === sl[0] && s.shop.own[id]) s.shop.eq[sl[0]] = id; });
    s.shop.used = typeof q.used === "number" && isFinite(q.used) ? Math.max(0, Math.min(1e6, Math.floor(q.used))) : 0;
  }
  function find(id) { return BY[id] || null; }
  function buy(s, id) { var c = BY[id]; if (!c || s.shop.own[id]) return false; if (!G().spend(s, c.cost)) return false; s.shop.own[id] = 1; return true; }
  function equip(s, id) { var c = BY[id]; if (!c || !s.shop.own[id]) return false; s.shop.eq[c.slot] = id; return true; }
  function unequip(s, slot) { if (!s.shop.eq[slot]) return false; delete s.shop.eq[slot]; return true; }
  function active(s, pv) { var a = {}, k; for (k in s.shop.eq) a[k] = s.shop.eq[k]; if (pv && BY[pv]) a[BY[pv].slot] = pv; return a; }
  function setPreview(id) { preview = id && BY[id] ? id : null; }
  function getPreview() { return preview; }
  /* boosts */
  function boostOn(s) { return !!(s.boost && s.t < s.boost.until); }
  function remaining(s) { return boostOn(s) ? Math.max(0, s.boost.until - s.t) : 0; }
  function canBoost(s, id) { var b = BB[id]; return !!b && !boostOn(s) && s.gold >= b.cost; }
  function activate(s, id) { var b = BB[id]; if (!b || boostOn(s)) return false; if (!G().spend(s, b.cost)) return false; s.boost = { mult: b.mult, until: s.t + b.dur, id: id }; s.shop.used++; return true; }
  BL.shop = { SLOTS: SLOTS, CITY: CITY, BOOSTS: BOOSTS, initState: initState, sanitize: sanitize, find: find, buy: buy, equip: equip, unequip: unequip, active: active, setPreview: setPreview, getPreview: getPreview, boostOn: boostOn, remaining: remaining, canBoost: canBoost, activate: activate, boost: function (id) { return BB[id] || null; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
