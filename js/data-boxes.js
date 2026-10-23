/* Boxs de la boutique (lingots d'or) : DONNÉES. Les taux ci-dessous sont à la fois ceux AFFICHÉS dans la fiche de chaque box et ceux UTILISÉS pour le tirage
   (une seule source). odds = pourcentage par rareté [Commun, Rare, Épique, Légendaire, Mythique] ; la somme fait toujours 100.
   Pitié : « leg » = au plus tard à la N-ième ouverture sans Légendaire ou mieux, un Légendaire (ou mieux) est garanti ; « myth » = idem pour un Mythique.
   Les boxs ne contiennent que de l'équipement : aucune statistique de combat ne s'achète, aucun revenu non plus. */
(function (root) {
  var BL = root.BL = root.BL || {}; BL.data = BL.data || {};
  BL.data.boxes = {
    params: {
      maxMulti: 5,        /* ouverture ×1 ou ×5 */
      dupRatio: 0.10      /* doublon, Arsenal plein ou revente d'un objet de box : 10 % de la valeur de l'objet, en argent du jeu (jamais en lingots) */
    },
    BOXES: [
      { id: "rue", name: "Box Rue", tag: "Box 1", cost: 5, col: "#8fb0c8", odds: [60, 30, 10, 0, 0], pity: null, text: "Du matériel de rue : tout ce qu'il faut pour débuter, avec un peu de chance pour un objet épique." },
      { id: "syndicat", name: "Box Syndicat", tag: "Box 2", cost: 15, col: "#b061e0", odds: [45, 33, 17, 5, 0], pity: { leg: 20 }, text: "Le butin des syndicats : les objets légendaires deviennent possibles. Un légendaire est garanti à la 20e ouverture sans légendaire." },
      { id: "legende", name: "Box Légende", tag: "Box 3", cost: 40, col: "#ff5fd2", odds: [30, 33, 24, 11, 2], pity: { leg: 12, myth: 60 }, text: "La plus rare : seule box qui contient des objets mythiques. Légendaire garanti à la 12e ouverture, mythique garanti à la 60e." }
    ]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
