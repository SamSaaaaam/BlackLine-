/* QG : pièce isométrique personnalisable (phase 3). Logique pure : catalogue, achats en lingots, placement sur grille, améliorations.
   Tout se paie en lingots d'or (BL.gold). Aucun effet sur les revenus : c'est de la personnalisation. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var SIZES = [6, 8, 10, 12];
  var UPG = {
    size:  { name: "Taille de la pièce", names: ["Planque 6×6", "Bureau 8×8", "Suite 10×10", "Penthouse 12×12"], costs: [0, 10, 25, 60] },
    walls: { name: "Murs", names: ["Béton brut", "Brique sombre", "Boiseries", "Marbre noir"], costs: [0, 8, 20, 45] },
    floor: { name: "Sol", names: ["Ciment", "Parquet", "Damier", "Marbre doré"], costs: [0, 8, 20, 45] },
    light: { name: "Éclairage", names: ["Ampoule nue", "Appliques chaudes", "Spots", "Lustres & néons"], costs: [0, 8, 20, 40] }
  };
  var CATS = [["mobilier", "Mobilier"], ["bar", "Bar & cave"], ["securite", "Coffres-forts"], ["art", "Tableaux & statues"], ["trophee", "Trophées & luxe"], ["neon", "Néons & lumières"], ["plante", "Plantes"], ["tapis", "Tapis"]];
  var RAR = { 0: { name: "Commun", color: "#8a93a3" }, 1: { name: "Rare", color: "#4aa3df" }, 2: { name: "Épique", color: "#b061e0" }, 3: { name: "Légendaire", color: "#e8cd8a" } };
  /* id, nom, catégorie, rareté, prix (lingots), largeur, profondeur, hauteur, couleur, forme */
  var RAW = [
    ["sofa", "Canapé cuir", "mobilier", 0, 3, 2, 1, 14, "#5a3a2e", "sofa"], ["table", "Table basse", "mobilier", 0, 2, 1, 1, 9, "#3a2c24", "box"], ["desk", "Bureau de boss", "mobilier", 0, 4, 2, 1, 16, "#4a3426", "desk"],
    ["stool", "Tabouret de comptoir", "mobilier", 0, 1, 1, 1, 12, "#4a3426", "box"], ["dresser", "Commode ancienne", "mobilier", 0, 3, 1, 1, 16, "#5a3a2e", "shelf"], ["cabinet", "Armoire à dossiers", "mobilier", 0, 4, 1, 1, 30, "#3a4048", "shelf"],
    ["chair", "Fauteuil club", "mobilier", 1, 6, 1, 1, 18, "#7a2f2f", "sofa"], ["chester", "Fauteuil Chesterfield", "mobilier", 1, 7, 1, 1, 18, "#5a2a2a", "sofa"], ["shelf", "Bibliothèque", "mobilier", 1, 7, 2, 1, 38, "#3b2a20", "shelf"],
    ["sofaL", "Canapé d’angle", "mobilier", 1, 8, 3, 1, 14, "#3a2c24", "sofa"], ["poker", "Table de poker", "mobilier", 1, 9, 2, 2, 12, "#1f4a2f", "desk"], ["conf", "Table de réunion", "mobilier", 1, 10, 3, 1, 14, "#2a2a30", "desk"],
    ["tv", "Écrans de surveillance", "mobilier", 1, 8, 1, 1, 20, "#2a303a", "box"], ["jukebox", "Jukebox", "mobilier", 2, 15, 1, 1, 30, "#ff9d4d", "neon"], ["pooltable", "Table de billard", "mobilier", 2, 16, 3, 2, 14, "#1f5a3a", "desk"],
    ["piano", "Piano à queue", "mobilier", 2, 22, 2, 2, 22, "#14161b", "desk"],
    ["crate", "Caisse de whisky", "bar", 0, 2, 1, 1, 10, "#7a5a36", "box"], ["barrel", "Tonneau de whisky", "bar", 0, 3, 1, 1, 16, "#7a5a36", "box"], ["champ", "Seau à champagne", "bar", 0, 2, 1, 1, 12, "#c0c8d0", "trophy"],
    ["bar", "Comptoir de bar", "bar", 1, 9, 3, 1, 22, "#2c2118", "desk"], ["barcart", "Chariot à liqueurs", "bar", 1, 6, 1, 1, 16, "#c8a45e", "desk"], ["wine", "Casier à vins", "bar", 1, 8, 1, 1, 34, "#4a2f22", "shelf"],
    ["cigar", "Humidor précieux", "bar", 2, 12, 1, 1, 14, "#4a2f22", "safe"], ["cellar", "Cave à cigares", "bar", 2, 16, 1, 1, 30, "#4a2f22", "shelf"], ["barL", "Bar d’angle en acajou", "bar", 2, 14, 3, 1, 24, "#1c1812", "desk"],
    ["safeS", "Petit coffre", "securite", 0, 5, 1, 1, 14, "#3a4250", "safe"], ["lockbox", "Valise blindée", "securite", 1, 7, 1, 1, 10, "#5a4a2a", "safe"], ["cams", "Mur d’écrans de sécurité", "securite", 1, 11, 2, 1, 26, "#14171c", "box"],
    ["safe", "Coffre-fort blindé", "securite", 2, 18, 1, 1, 26, "#3a4250", "safe"], ["vaultdoor", "Porte de chambre forte", "securite", 2, 24, 2, 1, 38, "#2a303a", "safe"], ["safeG", "Coffre-fort doré", "securite", 3, 60, 1, 1, 28, "#c8a45e", "safe"],
    ["easel1", "Toile abstraite", "art", 0, 3, 1, 1, 28, "#7a2f3a", "easel"], ["vase", "Vase de Chine", "art", 1, 6, 1, 1, 22, "#2f6a8a", "trophy"], ["easel2", "Portrait du Parrain", "art", 1, 8, 1, 1, 30, "#3a2c24", "easel"],
    ["easel3", "Paysage de Riviera", "art", 1, 7, 1, 1, 28, "#2f5a7a", "easel"], ["bust", "Buste en bronze", "art", 1, 9, 1, 1, 26, "#9a6a3a", "statue"], ["statue2", "Colonne antique", "art", 1, 8, 1, 1, 36, "#d8d4c8", "statue"],
    ["statue", "Statue de marbre", "art", 2, 20, 1, 1, 34, "#d8d4c8", "statue"], ["easel4", "Œuvre néo-noire", "art", 2, 20, 1, 1, 34, "#14161b", "easel"], ["sculpt", "Sculpture en marbre noir", "art", 2, 22, 1, 1, 32, "#2a2d33", "statue"],
    ["angel", "Ange doré", "art", 2, 26, 1, 1, 36, "#e8cd8a", "statue"], ["mona", "Tableau de maître encadré d’or", "art", 3, 70, 1, 1, 38, "#c8a45e", "easel"],
    ["cup2", "Coupe du tournoi", "trophee", 0, 3, 1, 1, 20, "#c0c8d0", "trophy"], ["globe", "Globe ancien", "trophee", 1, 7, 1, 1, 20, "#6a8a9a", "globe"], ["trophy", "Trophée doré", "trophee", 1, 8, 1, 1, 22, "#c8a45e", "trophy"],
    ["medal", "Vitrine de médailles", "trophee", 1, 8, 1, 1, 26, "#2a303a", "shelf"], ["chessg", "Échiquier en marbre", "trophee", 1, 9, 2, 2, 1, "#d6d1c4", "rug"], ["yacht", "Maquette de yacht", "trophee", 2, 18, 2, 1, 18, "#d8d4c8", "desk"],
    ["crown", "Couronne sous cloche", "trophee", 2, 28, 1, 1, 24, "#e8cd8a", "trophy"], ["goldpile", "Pile de lingots", "trophee", 2, 30, 1, 1, 20, "#e8cd8a", "ingot"], ["ingot", "Lingot monumental", "trophee", 3, 45, 1, 1, 24, "#e8cd8a", "ingot"],
    ["throne", "Trône du parrain", "trophee", 3, 50, 2, 1, 40, "#7a1f2a", "throne"], ["diamond", "Diamant géant", "trophee", 3, 80, 1, 1, 26, "#9ad8f0", "trophy"],
    ["lamp", "Lampadaire de salon", "neon", 0, 3, 1, 1, 34, "#f6e3a8", "lamp"], ["lamp2", "Lampe de banquier", "neon", 0, 3, 1, 1, 18, "#7ac07a", "lamp"], ["neonW", "Néon blanc", "neon", 0, 4, 1, 1, 30, "#e8f0ff", "neon"],
    ["neonR", "Néon rouge", "neon", 1, 6, 1, 1, 30, "#ff4d6d", "neon"], ["neonB", "Néon bleu", "neon", 1, 6, 1, 1, 30, "#4dc8ff", "neon"], ["neonG", "Néon vert", "neon", 1, 6, 1, 1, 30, "#4dff9a", "neon"],
    ["neonP", "Néon violet", "neon", 1, 6, 1, 1, 30, "#b061ff", "neon"], ["neonY", "Néon doré", "neon", 1, 7, 1, 1, 30, "#ffd24d", "neon"], ["torch", "Torchère dorée", "neon", 1, 7, 1, 1, 40, "#ffc470", "lamp"],
    ["lampG", "Lampadaire doré", "neon", 2, 18, 1, 1, 44, "#f1d98f", "lamp"], ["chand", "Lustre sur pied", "neon", 2, 22, 1, 1, 42, "#f1d98f", "lamp"], ["disco", "Boule à facettes", "neon", 2, 20, 1, 1, 40, "#ff4dd2", "neon"],
    ["neonLeg", "Néon BLACKLINE", "neon", 3, 55, 1, 1, 44, "#ff4d6d", "neon"],
    ["aquarium", "Aquarium tropical", "mobilier", 1, 12, 2, 1, 24, "#3a9ad0", "aquarium"], ["aquaL", "Aquarium géant", "mobilier", 2, 26, 3, 1, 26, "#2f7aa8", "aquarium"], ["fireplace", "Cheminée en pierre", "mobilier", 1, 12, 2, 1, 32, "#7a7468", "fire"],
    ["fireM", "Cheminée de marbre", "mobilier", 2, 22, 2, 1, 36, "#d6d1c4", "fire"], ["exec", "Fauteuil de direction", "mobilier", 0, 5, 1, 1, 22, "#1c1f26", "sofa"], ["banquet", "Table de banquet", "mobilier", 2, 16, 3, 2, 14, "#3a2c24", "desk"],
    ["slot", "Machine à sous", "mobilier", 1, 10, 1, 1, 34, "#a8262e", "slot"], ["slotG", "Machine à sous dorée", "mobilier", 2, 24, 1, 1, 36, "#c8a45e", "slot"], ["clock", "Horloge de parquet", "mobilier", 1, 6, 1, 1, 44, "#4a2f22", "clock"],
    ["clockA", "Horloge astronomique", "mobilier", 2, 20, 1, 1, 46, "#c8a45e", "clock"], ["maptab", "Table des plans", "mobilier", 1, 10, 2, 1, 14, "#3a2c24", "maptable"], ["holo", "Table holographique", "mobilier", 2, 26, 2, 2, 14, "#4ad8e8", "maptable"],
    ["count", "Table de comptage", "securite", 0, 4, 2, 1, 14, "#3a4048", "cashcount"], ["countG", "Table de comptage dorée", "securite", 2, 18, 2, 1, 14, "#c8a45e", "cashcount"], ["vaultW", "Mur de coffrets blindés", "securite", 1, 12, 2, 1, 30, "#2a303a", "safe"],
    ["triptych", "Triptyque abstrait", "art", 2, 14, 2, 1, 32, "#3a2c3e", "easel"], ["horse", "Statue équestre", "art", 2, 28, 2, 1, 38, "#9a6a3a", "statue"], ["mask", "Masque vénitien sous verre", "art", 1, 7, 1, 1, 26, "#e8cd8a", "easel"],
    ["fountain", "Fontaine d’intérieur", "trophee", 2, 24, 2, 2, 22, "#8ac0d0", "fountain"], ["fountG", "Fontaine dorée", "trophee", 3, 65, 2, 2, 26, "#e8cd8a", "fountain"], ["carbon", "Voiture de collection (maquette)", "trophee", 1, 9, 2, 1, 14, "#a8262e", "desk"],
    ["lemon", "Citronnier en pot", "plante", 1, 5, 1, 1, 34, "#c8b83a", "plant"], ["fig", "Figuier de salon", "plante", 1, 6, 1, 1, 42, "#3a7a45", "plant"], ["rug8", "Tapis léopard", "tapis", 1, 6, 2, 2, 1, "#b8873a", "rug"],
    ["rug9", "Tapis damier ivoire", "tapis", 1, 5, 2, 2, 1, "#cfc8b4", "rug"], ["rug10", "Tapis cramoisi", "tapis", 2, 16, 3, 2, 1, "#8a1f2f", "rug"],
    ["neonO", "Néon orange", "neon", 1, 6, 1, 1, 30, "#ff9d4d", "neon"], ["neonC", "Enseigne « OUVERT »", "neon", 1, 8, 1, 1, 32, "#ff4d6d", "neon"], ["arcL", "Lampadaire à abat-jour", "neon", 1, 7, 1, 1, 40, "#ffd9a0", "lamp"],
    ["fern", "Fougère", "plante", 0, 1, 1, 1, 16, "#2f6a3a", "plant"], ["plant", "Plante verte", "plante", 0, 1, 1, 1, 18, "#2f6a3a", "plant"], ["cactus", "Cactus", "plante", 0, 2, 1, 1, 20, "#3a7a4a", "plant"],
    ["palm", "Palmier d’intérieur", "plante", 0, 3, 1, 1, 40, "#2f7a45", "plant"], ["bonsai", "Bonsaï ancien", "plante", 1, 5, 1, 1, 14, "#3a8a50", "plant"], ["bamboo", "Bambous", "plante", 1, 5, 1, 1, 38, "#5aa84a", "plant"],
    ["orchid", "Orchidée rare", "plante", 1, 6, 1, 1, 18, "#d86aa8", "plant"], ["olive", "Olivier en pot", "plante", 1, 7, 1, 1, 36, "#6a8a4a", "plant"], ["topiary", "Buis taillé", "plante", 2, 14, 1, 1, 30, "#2f7a45", "plant"],
    ["goldTree", "Arbre doré", "plante", 3, 40, 1, 1, 44, "#e8cd8a", "plant"],
    ["rug2", "Tapis noir", "tapis", 0, 2, 2, 1, 1, "#1c1f26", "rug"], ["rug3", "Tapis rouge", "tapis", 0, 3, 2, 2, 1, "#7a1f2a", "rug"], ["rug", "Tapis persan", "tapis", 1, 5, 2, 2, 1, "#7a2f3a", "rug"],
    ["rug6", "Tapis bleu nuit", "tapis", 1, 5, 2, 2, 1, "#1f2f5a", "rug"], ["rug4", "Tapis zébré", "tapis", 1, 6, 2, 2, 1, "#d6d1c4", "rug"], ["rug5", "Tapis doré", "tapis", 2, 14, 3, 2, 1, "#c8a45e", "rug"],
    ["rug7", "Tapis royal", "tapis", 3, 35, 3, 3, 1, "#5a1f6a", "rug"]
  ];
  var DECOR = RAW.map(function (r) { return { id: r[0], name: r[1], cat: r[2], rar: r[3], cost: r[4], w: r[5], d: r[6], h: r[7], color: r[8], shape: r[9] }; });
  var BY = {}; DECOR.forEach(function (d) { BY[d.id] = d; });
  var MAXOWN = 8, MAXITEMS = 80;
  function G() { return BL.gold; }
  /* Styles du QG (Partie 12) : purement cosmétiques (façade sur la carte + ambiance de la pièce), payés en lingots, aucun effet sur le jeu. « classic » est gratuit et possédé d'office. */
  var STYLES = [
    { id: "classic", name: "Gangster classique", cost: 0, acc: "#c8a45e", desc: "Brique rouge, enseigne de bar au néon, pigeonnier sur le toit : le QG d'un vrai parrain de quartier." },
    { id: "dark", name: "Dark", cost: 25, acc: "#e0394f", desc: "Béton noir, fentes éclairées, néons rouges et fil barbelé : un bunker qui ne dort jamais." },
    { id: "fashion", name: "Fashion / luxe", cost: 55, acc: "#f0d28a", desc: "Marbre clair, grandes baies vitrées, dorures et toit-terrasse : l'adresse la plus chic de la ville." },
    { id: "tower", name: "Tour", cost: 90, acc: "#7fb8ff", desc: "Un gratte-ciel de verre avec hélistation : on te voit de partout, on ne t'atteint nulle part." }
  ];
  var TINT = { classic: "", dark: "rgba(40,0,10,.34)", fashion: "rgba(255,236,190,.2)", tower: "rgba(40,90,150,.26)" };
  var SBY = {}; STYLES.forEach(function (x) { SBY[x.id] = x; });
  function style(s) { var id = s.hq && s.hq.style; return SBY[id] && styleOwned(s, id) ? id : "classic"; }
  function styleOwned(s, id) { return id === "classic" || !!(SBY[id] && s.hq && s.hq.styles && s.hq.styles[id]); }
  function styleBuy(s, id) { var x = SBY[id]; if (!x || styleOwned(s, id) || !G().spend(s, x.cost)) return false; s.hq.styles[id] = 1; s.hq.style = id; return true; }
  function styleSet(s, id) { if (!SBY[id] || !styleOwned(s, id)) return false; s.hq.style = id; return true; }
  function initState(s) { s.hq = { baseOff: 0, size: 0, walls: 0, floor: 0, light: 0, inv: {}, items: [], nu: 1, style: "classic", styles: {} }; }
  function dec(id) { return BY[id] || null; }
  function size(s) { return SIZES[s.hq.size]; }
  function foot(id, r) { var d = BY[id]; return r ? { w: d.d, d: d.w } : { w: d.w, d: d.d }; }
  /* cases occupées par les objets posés (sauf ignoreU) */
  function occupied(s, ignoreU) {
    var o = {}; s.hq.items.forEach(function (it) { if (it.u === ignoreU) return; var f = foot(it.id, it.r), i, j; for (i = 0; i < f.w; i++) for (j = 0; j < f.d; j++) o[(it.x + i) + "," + (it.y + j)] = it.u; }); return o;
  }
  function fits(s, id, x, y, r, ignoreU) {
    if (!BY[id] || !Number.isInteger(x) || !Number.isInteger(y)) return false; var f = foot(id, r ? 1 : 0), n = size(s);
    if (x < 0 || y < 0 || x + f.w > n || y + f.d > n) return false;
    var o = occupied(s, ignoreU), i, j; for (i = 0; i < f.w; i++) for (j = 0; j < f.d; j++) if (o[(x + i) + "," + (y + j)]) return false; return true;
  }
  function owned(s, id) { var n = s.hq.inv[id] || 0; s.hq.items.forEach(function (it) { if (it.id === id) n++; }); return n; }
  function buy(s, id) {
    var d = BY[id]; if (!d || owned(s, id) >= MAXOWN) return false; if (!G().spend(s, d.cost)) return false; s.hq.inv[id] = (s.hq.inv[id] || 0) + 1; return true;
  }
  function place(s, id, x, y, r) {
    if (!BY[id] || (s.hq.inv[id] || 0) < 1 || s.hq.items.length >= MAXITEMS || !fits(s, id, x, y, r ? 1 : 0)) return 0;
    s.hq.inv[id]--; if (!s.hq.inv[id]) delete s.hq.inv[id]; var u = s.hq.nu++; s.hq.items.push({ u: u, id: id, x: x, y: y, r: r ? 1 : 0 }); return u;
  }
  /* Partie 15 : décor de base (virtuel, jamais sauvegardé) : un bureau de parrain déjà meublé. Un élément disparaît seul quand le joueur pose un objet sur sa place ("remplacer"),
     ou tous d'un coup via hq.baseOff. Aucun objet possédé n'est touché, aucun achat n'est nécessaire. */
  var BASE = [["desk", 2, 1, 0], ["exec", 2, 2, 0], ["lamp2", 4, 1, 0], ["shelf", 0, 0, 1], ["easel2", 0, 4, 0], ["safeS", 0, 5, 0], ["plant", 5, 2, 0], ["rug3", 2, 3, 0], ["chair", 4, 4, 0]];
  function baseItems(s) {
    if (!s || !s.hq || s.hq.baseOff) return []; var o = occupied(s), n = size(s), out = [];
    BASE.forEach(function (b, k) { var f = foot(b[0], b[3]), i, j, free = b[1] + f.w <= n && b[2] + f.d <= n; for (i = 0; free && i < f.w; i++) for (j = 0; free && j < f.d; j++) if (o[(b[1] + i) + "," + (b[2] + j)]) free = false; if (free) out.push({ u: -(k + 1), id: b[0], x: b[1], y: b[2], r: b[3], base: true }); });
    return out;
  }
  function find(s, u) { for (var i = 0; i < s.hq.items.length; i++) if (s.hq.items[i].u === u) return s.hq.items[i]; return null; }
  function move(s, u, x, y) { var it = find(s, u); if (!it || !fits(s, it.id, x, y, it.r, u)) return false; it.x = x; it.y = y; return true; }
  function rotate(s, u) {
    var it = find(s, u); if (!it) return false; var r = it.r ? 0 : 1; if (fits(s, it.id, it.x, it.y, r, u)) { it.r = r; return true; }
    var n = size(s), f = foot(it.id, r), x = Math.min(it.x, n - f.w), y = Math.min(it.y, n - f.d);       /* recalé dans la pièce si besoin */
    if (fits(s, it.id, x, y, r, u)) { it.r = r; it.x = x; it.y = y; return true; } return false;
  }
  function remove(s, u) { var it = find(s, u); if (!it) return false; s.hq.items.splice(s.hq.items.indexOf(it), 1); s.hq.inv[it.id] = (s.hq.inv[it.id] || 0) + 1; return true; }
  /* tout remettre à zéro : les objets reviennent dans l'inventaire (rien n'est perdu ni remboursé) */
  function clear(s) { var n = s.hq.items.length; s.hq.items.slice().forEach(function (it) { remove(s, it.u); }); return n; }
  function upgradeCost(s, k) { var u = UPG[k]; if (!u) return 0; var l = s.hq[k]; return l >= u.costs.length - 1 ? 0 : u.costs[l + 1]; }
  function upgrade(s, k) { var u = UPG[k]; if (!u || s.hq[k] >= u.costs.length - 1) return false; if (!G().spend(s, upgradeCost(s, k))) return false; s.hq[k]++; return true; }
  function level(s) { return s.hq.size + s.hq.walls + s.hq.floor + s.hq.light; }           /* 0..12 */
  function tier(s) { return Math.min(4, Math.floor(level(s) / 3)); }                       /* 0..4 : aspect de l'extérieur sur la carte */
  function sanitize(r, s) {
    function n(x, lo, hi) { return typeof x === "number" && isFinite(x) ? Math.min(hi, Math.max(lo, Math.floor(x))) : lo; }
    var q = r.hq && typeof r.hq === "object" ? r.hq : {}; initState(s); var h = s.hq; h.baseOff = q.baseOff === 1 || q.baseOff === true ? 1 : 0;   /* Partie 15 : décor de base masqué */
    h.size = n(q.size, 0, 3); h.walls = n(q.walls, 0, 3); h.floor = n(q.floor, 0, 3); h.light = n(q.light, 0, 3);
    if (q.styles && typeof q.styles === "object" && !Array.isArray(q.styles)) Object.keys(q.styles).forEach(function (id) { if (SBY[id] && id !== "classic" && q.styles[id]) h.styles[id] = 1; });
    h.style = typeof q.style === "string" && SBY[q.style] && (q.style === "classic" || h.styles[q.style]) ? q.style : "classic";
    if (q.inv && typeof q.inv === "object") Object.keys(q.inv).forEach(function (id) { if (BY[id]) { var c = n(q.inv[id], 0, MAXOWN); if (c) h.inv[id] = c; } });
    var maxU = 0, seen = {};
    (Array.isArray(q.items) ? q.items : []).slice(0, MAXITEMS * 2).forEach(function (it) {
      if (!it || typeof it !== "object" || !BY[it.id]) return; var u = n(it.u, 1, 1e9), x = n(it.x, -1, 99), y = n(it.y, -1, 99), rr = it.r ? 1 : 0;
      if (seen[u] || h.items.length >= MAXITEMS) u = 0; if (u && fits(s, it.id, x, y, rr)) { seen[u] = 1; h.items.push({ u: u, id: it.id, x: x, y: y, r: rr }); maxU = Math.max(maxU, u); }
      else h.inv[it.id] = Math.min(MAXOWN, (h.inv[it.id] || 0) + 1);                         /* objet invalide : retourne à l'inventaire */
    });
    h.nu = Math.max(n(q.nu, 1, 1e9), maxU + 1);
    Object.keys(h.inv).forEach(function (id) { var over = owned(s, id) - MAXOWN; if (over > 0) { h.inv[id] -= over; if (h.inv[id] <= 0) delete h.inv[id]; } });
  }
  BL.hq = { baseItems: baseItems, BASE: BASE, SIZES: SIZES, UPG: UPG, CATS: CATS, RAR: RAR, DECOR: DECOR, MAXOWN: MAXOWN, MAXITEMS: MAXITEMS, initState: initState, sanitize: sanitize, dec: dec, size: size, foot: foot, fits: fits, owned: owned, buy: buy, place: place, move: move, rotate: rotate, remove: remove, clear: clear, find: find, upgrade: upgrade, upgradeCost: upgradeCost, level: level, tier: tier, STYLES: STYLES, TINT: TINT, style: style, styleOwned: styleOwned, styleBuy: styleBuy, styleSet: styleSet, styleInfo: function (id) { return SBY[id] || null; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
