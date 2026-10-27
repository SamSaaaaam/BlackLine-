/* Boss de quartier (Partie 13 · C3). Données seulement : le moteur est dans war.js. Fiction : noms inventés.
   Un boss tient chaque quartier encore aux mains d'une faction. Guerre en 3 manches (défense, attaque, finale) : tu gagnes à 2 manches. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.war = {
    params: { stakeMin: 5, stakeFloor: 2000, rewardMin: 6, rewardCap: 30, incPer: 0.005, incCap: 0.03, powerMul: 0.85, relLoss: -5, cooldownSec: 900, chanceRight: 0.7, chanceTie: 0.5, chanceWrong: 0.2, crewStep: 0.03, crewBase: -0.06, maxAdj: 0.06, chanceMin: 0.1, chanceMax: 0.9, rounds: 3, winNeed: 2, trophies: 8 },
    tactics: [{ id: "force", name: "Frapper fort", text: "Les hommes d'abord." }, { id: "ruse", name: "Contourner", text: "Une porte dérobée, un témoin qui oublie." }, { id: "argent", name: "Acheter", text: "Chaque garde a un prix." }],
    beats: { ruse: "force", argent: "ruse", force: "argent" },
    rounds: [{ id: "def", name: "Défense", text: "Le boss frappe le premier : tiens ta ligne." }, { id: "atk", name: "Attaque", text: "À toi de forcer son dispositif." }, { id: "fin", name: "Finale", text: "Tout se joue ici." }],
    bosses: {
      center: { name: "Marco « Le Phare »", title: "Boss du Centre-ville", trophy: "Le phare de Marco" },
      industrial: { name: "Vasco Delmar", title: "Contremaître des Corbeaux", trophy: "Le cadenas de Vasco" },
      market: { name: "Lena Brisk", title: "Reine des étals", trophy: "La caisse de Lena" },
      oldtown: { name: "Don Aurelio", title: "Gardien de la Vieille ville", trophy: "La clé d'Aurelio" },
      port: { name: "Capitaine Orsk", title: "Maître des quais", trophy: "Le compas d'Orsk" },
      residential: { name: "Madame Soriel", title: "Voisine de tout le monde", trophy: "Le trousseau de Mme Soriel" },
      business: { name: "Maître Ferrand", title: "Avocat du Consortium", trophy: "Le sceau de Ferrand" },
      prestige: { name: "Comte Valmont", title: "Patriarche des hauteurs", trophy: "La bague de Valmont" },
      marina: { name: "Ilse Marrow", title: "Capitaine de la marina", trophy: "La longue-vue d'Ilse" },
      franche: { name: "Monsieur Quade", title: "Douanier en chef", trophy: "Le tampon de Quade" },
      faubourg: { name: "Mère Lanterne", title: "Doyenne du Faubourg", trophy: "La lanterne de la Mère" }
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
