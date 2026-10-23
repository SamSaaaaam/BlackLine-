/* Événements du casino (Partie 13 · C6). Données seulement : le moteur est dans casino-ev.js.
   ARGENT DU JEU UNIQUEMENT, jamais de lingots. Les jeux eux-mêmes (machine à sous, roulette, blackjack) ne sont PAS modifiés : leurs cotes restent exactes.
   Les événements sont des à-côtés : un client VIP à servir (il rapporte, mais attire la police), un tournoi (des points pour avoir joué, pas pour avoir misé gros),
   le blanchiment de l'argent sale (réduit la chaleur contre des frais). Tout est borné et expliqué avant d'agir. Fiction : noms inventés. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.casinoEv = {
    params: { minIncome: 50,
      vipMinSec: 3000, vipMaxSec: 5400, vipStaySec: 300,             /* un VIP tous les 50 à 90 min de jeu, il reste 5 min */
      tourEverySec: 10800, tourLenSec: 720, tourEntryMin: 3,         /* un tournoi toutes les 3 h, 12 min, inscription en minutes de revenu */
      tourBetMul: 2, tourMaxPts: 40,                                 /* mise minimale du tournoi = 2 × la mise minimale du casino ; points plafonnés */
      washCostMin: 3, washHeat: 8, washCdSec: 1800,                  /* blanchir : 3 min de revenu → −8 points de chaleur, toutes les 30 min */
      remindEvery: 25 },                                             /* rappel de pause toutes les 25 parties d'une même session */
    vips: [
      { id: "orsini", name: "Marquis Orsini", text: "Un collectionneur de montres, de dettes et d’ennemis. Il perd avec élégance." },
      { id: "kessler", name: "Madame Kessler", text: "Elle ne mise jamais moins que le prix d’une voiture, et jamais plus qu’elle ne peut oublier." },
      { id: "vantongeren", name: "Hugo Van Tongeren", text: "Armateur du port, pourboires généreux, entourage bruyant." },
      { id: "lazarescu", name: "Le Dr Lazarescu", text: "Un chirurgien qui joue comme il opère : lentement, et sans témoin." },
      { id: "moretti", name: "Séraphine Moretti", text: "Chanteuse de cabaret. La salle l’adore, la police aussi." }
    ],
    /* Choix face à un VIP : gain en minutes de revenu, chaleur ajoutée. */
    vipOpts: {
      salon: { label: "Le servir au salon privé", text: "Champagne, table réservée, pourboire royal. Les voitures noires devant la porte se remarquent.", gainMin: 3, heat: 3 },
      quiet: { label: "Le servir discrètement", text: "Une table au fond, un seul serveur. Moins de pourboire, moins de regards.", gainMin: 1.5, heat: 1 },
      refuse: { label: "Le décliner poliment", text: "Rien ne se passe. Il reviendra peut-être un autre soir.", gainMin: 0, heat: 0 }
    },
    tiers: [{ pts: 6, prizeMin: 3, name: "Bronze" }, { pts: 12, prizeMin: 6, name: "Argent" }, { pts: 18, prizeMin: 11, name: "Or" }]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
