/* Données de l'équipement et des opérations (Partie 6, tranche A). Tout l'équilibrage se règle ici.
   Ton « film de gangsters » : noms inventés, aucune violence graphique, comptes rendus en texte et en icônes. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var RAR = ["commun", "rare", "épique", "légendaire", "mythique"];         /* index 0..4 (la mythique ne s'obtient que dans les boxs) */
  var RCOL = ["#9aa3b0", "#5ea8e0", "#b07ae8", "#e3b34c", "#ff5fd2"];
  var SLOTS = { weapon: "Arme", armor: "Protection", gadget: "Accessoire", vehicle: "Véhicule" };
  var STATS = { pow: "Puissance", def: "Défense", stl: "Discrétion", spd: "Vitesse" };
  /* Icônes : viewBox 48×48, remplissage « currentColor » (couleur = rareté). Chacune est dessinée ici, aucune image externe. */
  var W = '<circle cx="14" cy="38" r="5" stroke="#10131a" stroke-width="2"/><circle cx="35" cy="38" r="5" stroke="#10131a" stroke-width="2"/>';
  var ICONS = {
    w_baton: '<g transform="rotate(-40 24 24)"><rect x="5" y="21" width="32" height="6" rx="3"/><rect x="34" y="18" width="10" height="12" rx="3" opacity=".6"/></g>',
    w_knuckles: '<rect x="8" y="25" width="32" height="9" rx="3"/><circle cx="13" cy="21" r="4"/><circle cx="21" cy="19" r="4"/><circle cx="29" cy="19" r="4"/><circle cx="36" cy="21" r="3.6"/>',
    w_switch: '<path d="M6 32L27 11l4 4L12 36z"/><rect x="27" y="26" width="17" height="6" rx="3" transform="rotate(-45 35 29)" opacity=".6"/>',
    w_bat: '<g transform="rotate(-45 24 24)"><path d="M3 21h25l9-3v12l-9-3H3z"/><rect x="36" y="19" width="9" height="10" rx="3" opacity=".6"/></g>',
    w_pocket: '<path d="M6 15h27v8H22l-2 4h-4l1-4H6z"/><rect x="29" y="13" width="7" height="12" rx="2" opacity=".6"/><path d="M12 23l-3 15h9l4-15z"/>',
    w_cane: '<path d="M9 41L35 11" stroke="currentColor" stroke-width="3.500" fill="none" stroke-linecap="round"/><path d="M35 11c4-5 11-2 8 4-1.500 3-5 3-7 1" stroke="currentColor" stroke-width="3.500" fill="none" stroke-linecap="round"/><rect x="6" y="38" width="9" height="5" rx="2" opacity=".6"/>',
    w_silent: '<rect x="5" y="14" width="25" height="8" rx="2"/><rect x="28" y="15" width="15" height="6" rx="3" opacity=".6"/><path d="M10 22l-3 15h9l3-15z"/><rect x="18" y="22" width="8" height="4" rx="1" opacity=".5"/>',
    w_shotgun: '<rect x="3" y="15" width="35" height="5" rx="2"/><rect x="3" y="22" width="35" height="5" rx="2"/><path d="M33 13h11l-2 20H34z" opacity=".6"/>',
    w_tommy: '<rect x="5" y="13" width="33" height="8" rx="2"/><circle cx="19" cy="32" r="8" opacity=".6"/><rect x="36" y="15" width="9" height="4"/><path d="M9 21l-3 14h8l2-14z"/>',
    w_legend: '<path d="M5 14h28v9H21l-3 5h-4l1-5H5z"/><circle cx="26" cy="18.500" r="5" opacity=".5"/><path d="M11 23l-4 16h9l5-16z"/><path d="M39 6l2 4.200 4.500.6-3.300 3.200.8 4.500L39 16.200 35 18.500l.8-4.500-3.300-3.200 4.500-.6z"/>',
    p_jacket: '<path d="M16 7l8 4 8-4 10 9-4 6-4-2v22H14V20l-4 2-4-6z"/>',
    p_hat: '<ellipse cx="24" cy="31" rx="21" ry="6"/><path d="M11 31c0-13 6-19 13-19s13 6 13 19z" opacity=".7"/><rect x="11" y="24" width="26" height="4" opacity=".4"/>',
    p_blades: '<path d="M13 7h7l4 6 4-6h7l4 9v25H9V16z"/><path d="M15 25h18M15 31h18M15 37h18" stroke="#10131a" stroke-opacity=".4" stroke-width="2"/>',
    p_coat: '<path d="M15 5l9 6 9-6 6 11-4 4v25H13V20l-4-4z"/><path d="M24 11v30" stroke="#10131a" stroke-opacity=".4" stroke-width="2"/>',
    p_vest: '<path d="M11 7h9l4 5 4-5h9l3 11-4 4v19H13V22l-5-4z"/><rect x="20" y="22" width="8" height="13" opacity=".4"/>',
    p_suit: '<path d="M14 7l10 4 10-4 7 13-6 4v18H13V24l-6-4z"/><path d="M24 11l-4 11 4 14 4-14z" opacity=".5"/>',
    p_scarf: '<path d="M9 27c2-13 8-17 15-17s13 4 15 17z"/><rect x="7" y="27" width="34" height="5" rx="2" opacity=".6"/><path d="M17 32h9v12l-4.500-3-4.500 3z" opacity=".7"/>',
    p_police: '<path d="M11 7h9l4 5 4-5h9l3 11-4 4v19H13V22l-5-4z"/><circle cx="24" cy="25" r="6" opacity=".45"/><path d="M24 20l1.500 3.500 3.500.3-2.700 2.300.9 3.500L24 27.800 20.800 29.600l.9-3.500-2.700-2.300 3.500-.3z" fill="#10131a" fill-opacity=".5"/>',
    p_opera: '<path d="M24 5c9 0 15 6 17 17l4 20H3l4-20C9 11 15 5 24 5z"/><circle cx="24" cy="13" r="3.500" opacity=".5"/><path d="M24 17v24" stroke="#10131a" stroke-opacity=".35" stroke-width="2"/>',
    p_gala: '<path d="M9 9l15-5 15 5v13c0 11-7 17-15 21C16 39 9 33 9 22z"/><path d="M24 13l3.200 6.500 7 .9-5.200 4.900 1.300 7L24 28.800 17.700 32.300l1.300-7-5.200-4.900 7-.9z" opacity=".55"/>',
    a_watch: '<circle cx="24" cy="28" r="15"/><circle cx="24" cy="28" r="11" opacity=".35"/><rect x="21" y="4" width="6" height="7" rx="2"/><path d="M24 28v-8M24 28l6 3" stroke="#10131a" stroke-opacity=".7" stroke-width="2.200" stroke-linecap="round"/>',
    a_shades: '<rect x="4" y="19" width="17" height="13" rx="5"/><rect x="27" y="19" width="17" height="13" rx="5"/><path d="M21 24h6" stroke="currentColor" stroke-width="3"/><path d="M4 22L2 17M44 22l2-5" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/>',
    a_gloves: '<path d="M13 42V23l-4-8 4-2 4 6V9h4v13V7h4v15V9h4v15V13h4v19l-6 10z"/>',
    a_lighter: '<rect x="14" y="19" width="20" height="24" rx="3"/><path d="M24 3c6 5 7 9 3 12-1 1-5 1-6-1-1.500-2-.500-5 3-11z" opacity=".7"/><path d="M14 27h20" stroke="#10131a" stroke-opacity=".4" stroke-width="2"/>',
    a_radio: '<rect x="13" y="14" width="22" height="30" rx="4"/><rect x="30" y="3" width="3.500" height="13"/><rect x="17" y="19" width="14" height="9" opacity=".4"/><circle cx="24" cy="36" r="3" opacity=".5"/>',
    a_folder: '<path d="M5 11h15l4 5h19v26H5z"/><path d="M11 25h26M11 31h18" stroke="#10131a" stroke-opacity=".38" stroke-width="2.200"/>',
    a_ring: '<circle cx="24" cy="31" r="12" fill="none" stroke="currentColor" stroke-width="5"/><path d="M15 13l4-6h10l4 6-9 9z"/>',
    a_key: '<circle cx="13" cy="24" r="9"/><circle cx="13" cy="24" r="3.500" fill="#10131a" fill-opacity=".5"/><rect x="20" y="22" width="24" height="5" rx="2"/><rect x="35" y="27" width="4" height="9"/><rect x="28" y="27" width="4" height="7"/>',
    a_book: '<rect x="9" y="5" width="28" height="38" rx="3"/><rect x="35" y="10" width="5" height="9" opacity=".6"/><path d="M15 15h16M15 22h16M15 29h10" stroke="#10131a" stroke-opacity=".38" stroke-width="2.200"/>',
    a_medal: '<path d="M13 3h7l4 10 4-10h7l-7 17H20z" opacity=".7"/><circle cx="24" cy="32" r="12"/><path d="M24 25l2.400 4.800 5.300.8-3.800 3.700.9 5.200-4.800-2.500-4.800 2.500.9-5.200-3.800-3.700 5.300-.8z" fill="#10131a" fill-opacity=".45"/>',
    v_bike: '<circle cx="11" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="3.500"/><circle cx="37" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="3.500"/><path d="M11 32l9-15h10l7 15M20 17l6 15h11M17 12h7" stroke="currentColor" stroke-width="3.500" fill="none" stroke-linejoin="round"/>',
    v_van: '<path d="M3 14h27v21H3z"/><path d="M30 19h9l7 9v7H30z" opacity=".7"/>' + W,
    v_scooter: '<circle cx="9" cy="37" r="6"/><circle cx="37" cy="37" r="6"/><path d="M9 37h15l6-19h-5M30 18h9l2 19" stroke="currentColor" stroke-width="3.500" fill="none" stroke-linejoin="round"/><rect x="17" y="24" width="14" height="7" rx="3"/>',
    v_sedan: '<path d="M3 31l4-10 9-7h16l9 7 4 10v6H3z"/><path d="M15 17l-4 8h26l-4-8z" fill="#10131a" fill-opacity=".38"/>' + W,
    v_coupe: '<path d="M2 33c2-8 9-12 15-12l8-7h9l6 7 6 3v9H2z"/><path d="M19 22l5-5h9l4 5z" fill="#10131a" fill-opacity=".38"/>' + W,
    v_armored: '<rect x="3" y="11" width="33" height="24" rx="3"/><path d="M36 17h7l4 9v9H36z" opacity=".7"/><rect x="9" y="17" width="21" height="11" fill="#10131a" fill-opacity=".32"/><path d="M12 20l6 6M18 20l6 6" stroke="currentColor" stroke-width="2"/>' + W,
    v_moto: '<circle cx="9" cy="35" r="7" fill="none" stroke="currentColor" stroke-width="3.500"/><circle cx="39" cy="35" r="7" fill="none" stroke="currentColor" stroke-width="3.500"/><path d="M9 35l8-12h13l9 12M14 18h9l3 5" stroke="currentColor" stroke-width="3.500" fill="none" stroke-linejoin="round"/><rect x="17" y="17" width="12" height="7" rx="3"/>',
    v_limo: '<path d="M1 31l3-8 8-6h24l9 6 2 8v6H1z"/><path d="M13 19l-3 6h30l-3-6z" fill="#10131a" fill-opacity=".38"/><circle cx="11" cy="39" r="5" stroke="#10131a" stroke-width="2"/><circle cx="38" cy="39" r="5" stroke="#10131a" stroke-width="2"/>',
    v_boat: '<path d="M3 27h42l-7 11H11z"/><path d="M14 27l6-11h13l6 11z" opacity=".7"/><path d="M3 43c4-2 8 2 12 0s8 2 12 0 8 2 12 0" stroke="currentColor" fill="none" stroke-width="2.200" opacity=".6"/>',
    v_conv: '<path d="M2 32c2-6 8-9 14-9l9-4h8l6 5 7 2v10H2z"/><path d="M24 7l1.800 3.800 4.200.5-3.100 2.900.8 4.200L24 16.300l-3.700 2.100.8-4.200-3.100-2.900 4.200-.5z"/>' + W
  };
  /* [id, emplacement, nom, rareté (0..4), {pow,def,stl,spd}, icône, prix relatif] : 61 objets (40 d'origine + 21 de la Partie 8) */
  var L = [
    ["matraque", "weapon", "Matraque de ronde", 0, { pow: 3, stl: 1 }, "w_baton", 0.8], ["poing", "weapon", "Poing américain", 0, { pow: 3, spd: 1 }, "w_knuckles", 0.8],
    ["cran", "weapon", "Couteau à cran d’arrêt", 0, { pow: 2, stl: 2 }, "w_switch", 0.9], ["batte", "weapon", "Batte en frêne", 0, { pow: 4, spd: -1 }, "w_bat", 1],
    ["revolver", "weapon", "Revolver de poche", 1, { pow: 6, stl: 2 }, "w_pocket", 1], ["canne", "weapon", "Canne-épée", 1, { pow: 5, stl: 3, spd: 1 }, "w_cane", 1.1], ["silencieux", "weapon", "Pistolet à silencieux", 1, { pow: 5, stl: 4 }, "w_silent", 1.2],
    ["scie", "weapon", "Fusil de chasse scié", 2, { pow: 11, stl: -2, spd: 1 }, "w_shotgun", 1], ["tommy", "weapon", "Mitraillette chromée", 2, { pow: 11, spd: 2, stl: -2 }, "w_tommy", 1.2],
    ["nacre", "weapon", "Le Parrain, revolver nacré", 3, { pow: 16, stl: 3, spd: 3 }, "w_legend", 1],
    ["cuir", "armor", "Veste en cuir épais", 0, { def: 3 }, "p_jacket", 0.8], ["feutre", "armor", "Chapeau feutre renforcé", 0, { def: 2, stl: 1 }, "p_hat", 0.8],
    ["lames", "armor", "Gilet pare-lames", 0, { def: 4, spd: -1 }, "p_blades", 0.9], ["long", "armor", "Manteau long sombre", 0, { def: 2, stl: 2 }, "p_coat", 0.9],
    ["pbleger", "armor", "Gilet pare-balles léger", 1, { def: 6, stl: -1 }, "p_vest", 1], ["costume", "armor", "Costume sur mesure doublé", 1, { def: 5, stl: 2 }, "p_suit", 1.2], ["foulard", "armor", "Casquette et foulard", 1, { def: 3, stl: 4 }, "p_scarf", 1],
    ["reforme", "armor", "Gilet de police réformé", 2, { def: 10, pow: 2 }, "p_police", 1], ["opera", "armor", "Manteau de l’opéra", 2, { def: 8, stl: 5 }, "p_opera", 1.2],
    ["gala", "armor", "Armure de gala Blackline", 3, { def: 15, stl: 4, spd: 2 }, "p_gala", 1],
    ["gousset", "gadget", "Montre à gousset", 0, { stl: 2, spd: 1 }, "a_watch", 0.8], ["teintees", "gadget", "Lunettes teintées", 0, { stl: 3 }, "a_shades", 0.8],
    ["gants", "gadget", "Gants noirs", 0, { stl: 2, pow: 1 }, "a_gloves", 0.8], ["briquet", "gadget", "Briquet gravé", 0, { spd: 1, stl: 1, pow: 1 }, "a_lighter", 0.9],
    ["talkie", "gadget", "Talkie-walkie codé", 1, { spd: 4, stl: 2 }, "a_radio", 1], ["chantage", "gadget", "Dossier de chantage", 1, { stl: 5, pow: 1 }, "a_folder", 1.2], ["bague", "gadget", "Bague en or lourde", 1, { pow: 3, def: 3 }, "a_ring", 1],
    ["passe", "gadget", "Passe-partout universel", 2, { stl: 8, spd: 5 }, "a_key", 1], ["carnet", "gadget", "Carnet d’adresses", 2, { spd: 7, stl: 6 }, "a_book", 1.1],
    ["medaillon", "gadget", "Médaillon du fondateur", 3, { pow: 5, def: 5, stl: 5, spd: 5 }, "a_medal", 1],
    ["velo", "vehicle", "Vélo de livraison", 0, { spd: 3 }, "v_bike", 0.8], ["fourgonnette", "vehicle", "Fourgonnette cabossée", 0, { spd: 2, def: 2 }, "v_van", 0.9],
    ["scooter", "vehicle", "Scooter trafiqué", 0, { spd: 4, stl: -1 }, "v_scooter", 0.9], ["berline", "vehicle", "Berline noire d’occasion", 0, { spd: 3, def: 1, stl: 1 }, "v_sedan", 1],
    ["coupe", "vehicle", "Coupé rapide", 1, { spd: 7 }, "v_coupe", 1], ["blinde", "vehicle", "Camionnette blindée", 1, { def: 5, spd: 2 }, "v_armored", 1.1], ["moto", "vehicle", "Moto de course", 1, { spd: 6, stl: 2 }, "v_moto", 1.1],
    ["limousine", "vehicle", "Limousine blindée", 2, { def: 8, spd: 5 }, "v_limo", 1.1], ["horsbord", "vehicle", "Hors-bord", 2, { spd: 9, stl: 4 }, "v_boat", 1],
    ["minuit", "vehicle", "Cabriolet « Minuit »", 3, { spd: 14, stl: 5, pow: 3 }, "v_conv", 1],
    /* Partie 8 : 21 objets de plus, toutes raretés (la mythique, rareté 4, ne tombe que des boxs) */
    ["tuyau", "weapon", "Tuyau de plomb", 0, { pow: 3, spd: 1 }, "w_pipe", 0.8], ["bottes", "armor", "Bottes ferrées", 0, { def: 2, spd: 1 }, "p_boots", 0.8], ["des", "gadget", "Dés pipés", 0, { stl: 1, spd: 2 }, "a_dice", 0.8], ["triporteur", "vehicle", "Triporteur de marché", 0, { spd: 2, def: 2 }, "v_trike", 0.8],
    ["derringer", "weapon", "Derringer d’argent", 1, { pow: 5, stl: 4 }, "w_derringer", 1.1], ["trench", "armor", "Trench imperméable", 1, { def: 5, stl: 3 }, "p_trench", 1.1], ["telephone", "gadget", "Téléphone crypté", 1, { spd: 5, stl: 3 }, "a_phone", 1.1], ["taxi", "vehicle", "Taxi trafiqué", 1, { spd: 5, def: 3, stl: 2 }, "v_taxi", 1.1],
    ["colt", "weapon", "Colt de duelliste", 2, { pow: 10, spd: 3, stl: -1 }, "w_colt", 1.1], ["acier", "armor", "Veste doublée d’acier", 2, { def: 11, pow: 1 }, "p_steel", 1.1], ["mallette", "gadget", "Mallette piégée", 2, { stl: 7, spd: 6 }, "a_case", 1.1], ["frigo", "vehicle", "Camion frigorifique", 2, { def: 7, spd: 6, stl: 3 }, "v_reefer", 1.1],
    ["colt_or", "weapon", "Colt plaqué or", 3, { pow: 15, spd: 4, stl: 3 }, "w_goldgun", 1], ["sceau", "gadget", "Sceau du Syndicat", 3, { pow: 4, def: 4, stl: 6, spd: 6 }, "a_seal", 1], ["yacht", "vehicle", "Yacht « Calypso »", 3, { spd: 12, stl: 6, def: 5 }, "v_yacht", 1],
    ["dernier", "weapon", "Revolver « Dernier Mot »", 4, { pow: 20, stl: 5, spd: 4 }, "w_myth_rev", 1], ["canne_m", "weapon", "Canne du Maître", 4, { pow: 14, stl: 8, spd: 7 }, "w_myth_cane", 1], ["spectre", "armor", "Armure « Spectre »", 4, { def: 19, stl: 6, spd: 3 }, "p_myth_armor", 1],
    ["ombre", "armor", "Manteau d’ombre", 4, { def: 14, stl: 12, spd: 3 }, "p_myth_cloak", 1], ["eclipse", "vehicle", "Coupé « Éclipse »", 4, { spd: 18, stl: 7, pow: 4 }, "v_myth_coupe", 1], ["couronne", "gadget", "Couronne du Parrain", 4, { pow: 7, def: 7, stl: 7, spd: 7 }, "a_myth_crown", 1]
  ];
  var ITEMS = L.map(function (r) { return { id: r[0], slot: r[1], name: r[2], rar: r[3], st: r[4], ic: r[5], p: r[6] }; });

  /* Opérations : famille « Braquages ». need = ce que l'équipe (1 à 3 équipiers) doit totaliser ; loot = probabilités de butin (en %, somme 100). */
  var OPS = [
    { id: "entrepot", fam: "heist", img: "scene_entrepot", name: "Entrepôt du port", tier: 1, minLvl: 2, dur: 60, need: { pow: 6, def: 3, stl: 4, spd: 4 }, loot: [70, 26, 4, 0], inj: 0.10, text: "Des caisses sans surveillant la nuit : un premier coup, sans prétention." },
    { id: "fourgon", fam: "heist", img: "scene_fourgon", name: "Fourgon blindé", tier: 2, minLvl: 6, dur: 120, need: { pow: 16, def: 10, stl: 8, spd: 12 }, loot: [45, 40, 14, 1], inj: 0.20, text: "Il suit toujours le même trajet. Il faut de la vitesse et de quoi encaisser." },
    { id: "galerie", fam: "heist", img: "scene_galerie", name: "Galerie d’art", tier: 3, minLvl: 12, dur: 240, need: { pow: 20, def: 12, stl: 30, spd: 16 }, loot: [20, 45, 30, 5], inj: 0.25, text: "Alarmes, caméras, un gardien nerveux. Ici, la discrétion fait le travail." },
    { id: "casino", fam: "heist", img: "scene_casino", name: "Coffre du casino", tier: 4, minLvl: 20, dur: 420, need: { pow: 40, def: 30, stl: 36, spd: 30 }, loot: [5, 35, 45, 15], inj: 0.30, text: "Le gros coup. Tout le monde le veut ; personne n’y est arrivé proprement." },
    /* Famille « Convois rivaux » : intercepter un convoi d'une faction. Réussite = elle perd un peu d'influence ; elle t'en veut dans les deux cas. */
    { id: "cv_lames", fam: "convoy", fac: "lames", img: "scene_cv_lames", name: "Convoi des Lames du Nord", tier: 1, minLvl: 4, dur: 90, need: { pow: 10, def: 6, stl: 5, spd: 10 }, loot: [60, 32, 8, 0], inj: 0.12, text: "Des jeunes pressés, une voiture de tête mal gardée. Rapide, bruyant, sans grand risque." },
    { id: "cv_corbeaux", fam: "convoy", fac: "corbeaux", img: "scene_cv_corbeaux", name: "Convoi des Corbeaux", tier: 2, minLvl: 9, dur: 150, need: { pow: 18, def: 12, stl: 8, spd: 16 }, loot: [40, 42, 16, 2], inj: 0.20, text: "Des caisses du port filent vers le nord sous escorte. Il faut les rattraper avant les tunnels." },
    { id: "cv_meridian", fam: "convoy", fac: "meridian", img: "scene_cv_meridian", name: "Convoi du Consortium Meridian", tier: 3, minLvl: 15, dur: 270, need: { pow: 24, def: 18, stl: 24, spd: 24 }, loot: [20, 40, 32, 8], inj: 0.25, text: "Trois berlines noires, des documents, des avocats en renfort. Mieux vaut ne laisser aucune trace." },
    { id: "cv_valcourt", fam: "convoy", fac: "valcourt", img: "scene_cv_valcourt", name: "Convoi de la Maison Valcourt", tier: 4, minLvl: 22, dur: 420, need: { pow: 36, def: 30, stl: 34, spd: 36 }, loot: [8, 35, 42, 15], inj: 0.30, text: "Ils sortent rarement, et jamais sans prévenir. Une occasion, ou un piège de vieille famille." },
    /* Famille « Raids de quartier » : frapper le repaire d'une faction. Plus d'effet sur elle, plus de rancune. */
    { id: "rd_lames", fam: "raid", fac: "lames", img: "scene_rd_lames", name: "Raid sur le squat des Lames", tier: 2, minLvl: 10, dur: 180, need: { pow: 24, def: 14, stl: 10, spd: 14 }, loot: [45, 40, 14, 1], inj: 0.22, text: "Une rue barricadée, des graffitis, des sentinelles. Un coup de force net pour leur faire reculer." },
    { id: "rd_corbeaux", fam: "raid", fac: "corbeaux", img: "scene_rd_corbeaux", name: "Raid sur les docks des Corbeaux", tier: 3, minLvl: 16, dur: 300, need: { pow: 30, def: 22, stl: 18, spd: 20 }, loot: [22, 42, 30, 6], inj: 0.27, text: "Leur territoire, leurs règles. Entrer vite, sortir plus vite." },
    { id: "rd_meridian", fam: "raid", fac: "meridian", img: "scene_rd_meridian", name: "Raid sur la tour Meridian", tier: 4, minLvl: 23, dur: 480, need: { pow: 40, def: 32, stl: 36, spd: 28 }, loot: [6, 34, 45, 15], inj: 0.32, text: "Des étages entiers de contrats et de coffres. Le Consortium ne pardonne pas." }
  ];
  /* Familles d'opérations : titre, consigne, effet sur la faction visée (pow = multiplicateur de puissance, rel = variation de relation). */
  var FAMS = {
    heist: { name: "Braquages", text: "Des lieux, du butin, aucun rival visé." },
    convoy: { name: "Convois rivaux", text: "Intercepte le convoi d’une faction. En cas de réussite elle perd un peu d’influence ; dans tous les cas elle t’en veut un peu.", win: { pow: 0.97, rel: -6 }, lose: { pow: 1.02, rel: -2 } },
    raid: { name: "Raids de quartier", text: "Frappe le repaire d’une faction : l’effet sur elle est plus fort, et sa rancune aussi.", win: { pow: 0.93, rel: -10 }, lose: { pow: 1.04, rel: -3 } }
  };
  /* Finitions : cosmétiques payés en lingots, SANS aucune statistique. Elles changent le cadre des objets dans l'Arsenal. */
  var FINS = [
    { id: "chrome", name: "Chrome poli", gold: 3, col: "#cfd8e6", text: "Un cadre argenté, net et froid." },
    { id: "noirmat", name: "Noir mat", gold: 3, col: "#6a7080", text: "Discret : un liseré gris sur fond sombre." },
    { id: "or", name: "Or ancien", gold: 5, col: "#e3b34c", text: "Un liseré doré, comme dans les vieilles maisons." },
    { id: "carmin", name: "Carmin", gold: 5, col: "#d6505a", text: "Un liseré rouge profond." },
    { id: "jade", name: "Jade nocturne", gold: 8, col: "#3affc0", text: "Un liseré vert néon, dans les tons du port." },
    { id: "blackline", name: "Édition Blackline", gold: 12, col: "#ff4f8b", text: "Le liseré rose du QG : rare et purement décoratif." }
  ];
  BL.data.equip = {
    RAR: RAR, RCOL: RCOL, SLOTS: SLOTS, STATS: STATS, ICONS: ICONS, ITEMS: ITEMS, OPS: OPS, FAMS: FAMS, FINS: FINS,
    params: {
      capBase: 20, capPerLevel: 5, capMaxLevel: 6, capCostUnits: 8, capCostGrowth: 1.7,   /* capacité de l'Arsenal : 20 + 5 par extension (6 max) ; coût = 8 unités × 1,7^niveau (Partie 12 : avant 12 × 2^niveau) */
      unitFloor: 30, unitIncomeSec: 25,                                        /* unité de prix = max(30, revenu × 25 s) (Partie 12 : avant 40 s) : les prix suivent ta progression */
      rarMult: [1, 4, 10, 25, 50], sellRatio: 0.25, repairRatio: 0.25, buyMaxRar: 1, /* on peut ACHETER commun et rare ; légendaire et mythique restent réservés aux box et aux opérations */
      /* C11 : sélection d'objets ÉPIQUES achetables. Prix = max(prix × epicBuyMul, epicBuyGold × prix d'un lingot) : au moins 44 % du coût moyen d'un épique en box (Box Rue : 5 lingots pour 10 % d'épique = 50 lingots), les box restent donc utiles ;
         revente à 25 % (10 % pour un objet de box) : acheter puis revendre perd toujours au moins 75 %, jamais de boucle de profit. Réservé à partir du niveau d'empire epicMinLevel. */
      epicBuy: ["scie", "tommy", "opera", "acier", "passe", "mallette", "limousine", "horsbord"], epicBuyMul: 5.5, epicBuyGold: 22, epicMinLevel: 15,
      wearMin: 0.5,                                                            /* usé à 0 % : l'objet garde 50 % de son efficacité, il n'est jamais détruit */
      wearBase: 3, wearPerTier: 2, wearFail: 1.5,
      maxTeam: 3, rewardPerSec: 0.16, rewardCapSec: 1200, partialShare: 0.25,  /* argent = revenu × durée × 0,16 (plafonné à 20 min de revenu) ; échec de justesse : 25 % */
      chanceMin: 0.10, chanceMax: 0.92, chanceBase: 0.10, chanceSlope: 0.65, covCap: 1.6, nearMiss: 0.12, crit: 0.5,
      hurtBase: 150, hurtPerTier: 60,                                          /* blessure : indisponible 150 s + 60 s par palier */
      defPerPoint: 0.004, defCap: 0.2                                          /* défense d'équipement des équipiers actifs → +0,4 % de défense de quartier par point, max +20 % */
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
