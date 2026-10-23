/* Décors de ville (fonds d'écran) : DONNÉES. Achetés en lingots à la boutique (onglet « Décors »), purement décoratifs : aucun effet sur les revenus, les activités ou le combat.
   id, nom, description, rareté (1 Rare … 4 Mythique, mêmes couleurs que l'équipement), prix en lingots, accent (couleur du cadre de la carte), voile (0–1 : opacité du voile sombre
   posé sur l'image pour garder le texte lisible ; calculée avec le test de contraste tests/walls-browser.test.js). */
(function (root) {
  var BL = root.BL = root.BL || {}; BL.data = BL.data || {};
  var RAW = [
    ["pluie", "Skyline sous la pluie", "Une nuit de pluie fine sur les tours : les fenêtres brillent, l’avenue reflète les enseignes.", 1, 25, "#59a8e8", 0.4],
    ["brume", "Vieille ville brumeuse", "Des toits en pente et des lampadaires dans la brume : la ville d’avant la prohibition.", 1, 25, "#c9b48a", 0.4],
    ["port", "Port au crépuscule", "Grues, conteneurs et un cargo qui rentre : le soleil se couche sur les docks.", 2, 45, "#ff9a5c", 0.55],
    ["neon", "Quartier néon", "Rose et cyan : des enseignes verticales, du bitume mouillé, la ville ne dort jamais.", 2, 55, "#ff4fb0", 0.4],
    ["lune", "Toits sous la lune", "Une pleine lune, des réservoirs d’eau, des antennes : le point de vue du chef sur ses toits.", 2, 60, "#b9c8ff", 0.62],
    ["casino", "Casino doré", "La façade Art déco du casino, ses ampoules dorées et ses projecteurs dans la nuit.", 3, 110, "#e3b34c", 0.4],
    ["aube", "Gratte-ciel de l’aube", "Des tours de verre qui prennent la lumière rose du matin : le jour de l’empire se lève.", 3, 120, "#ff9f8a", 0.5],
    ["aurore", "Cité de l’aurore", "Rubans d’aurore au-dessus d’une cité illuminée, deux lunes, des lumières suspendues : le décor mythique.", 4, 220, "#ff5fd2", 0.6]
  ];
  BL.data.walls = { LIST: RAW.map(function (r) { return { id: r[0], name: r[1], desc: r[2], rar: r[3], cost: r[4], acc: r[5], veil: r[6] }; }), USES: [["all", "Accueil et QG"], ["home", "Écran d’accueil seulement"], ["hq", "QG seulement"], ["off", "Aucun (fond d’origine)"]] };
})(typeof globalThis !== "undefined" ? globalThis : this);
