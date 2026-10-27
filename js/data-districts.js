/* Constructions par quartier (Partie 10 · C6). Données seules : le moteur est dans dbuild.js.
   Chaque type : coût = secondes de revenus nets (indexé sur l'économie, donc jamais trivial ni inabordable), revenu = part de revenus en plus,
   chaleur = points par minute (positif = attire l'attention, négatif = couvre tes traces), prérequis = niveau de contrôle du quartier.
   Les lingots n'achètent jamais ces bâtiments ni leurs revenus. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.dbuild = {
    params: { minCost: 2000, perBuiltGrowth: 0.2, affinityMul: 1.5, incCap: 0.9 },
    cats: ["Illégal", "Légal", "Défense", "Spécial"],
    types: [
      { id: "racket", cat: "Illégal", name: "Racket de protection", desc: "Des « assurances » que personne n’ose refuser.", costSec: 450, inc: 0.030, heat: 0.30, req: 1 },
      { id: "lab", cat: "Illégal", name: "Laboratoire clandestin", desc: "Une arrière-boutique qui sent le solvant. Très rentable, très voyante.", costSec: 750, inc: 0.045, heat: 0.55, req: 2 },
      { id: "contraband", cat: "Illégal", name: "Entrepôt de contrebande", desc: "Des caisses sans étiquette, des camions sans histoire.", costSec: 600, inc: 0.040, heat: 0.45, req: 1 },
      { id: "chop", cat: "Illégal", name: "Atelier de désossage", desc: "Les voitures y entrent entières et en ressortent en pièces.", costSec: 500, inc: 0.035, heat: 0.40, req: 1 },
      { id: "betting", cat: "Illégal", name: "Salle de paris clandestine", desc: "Des paris sur tout, hors de tout contrôle.", costSec: 400, inc: 0.030, heat: 0.25, req: 1 },
      { id: "restaurant", cat: "Légal", name: "Restaurant de façade", desc: "Une bonne table, de vrais clients, des comptes propres.", costSec: 300, inc: 0.015, heat: -0.10, req: 1 },
      { id: "laundry", cat: "Légal", name: "Blanchisserie", desc: "Elle lave le linge, et le reste. Efface une partie de ta chaleur.", costSec: 450, inc: 0.010, heat: -0.35, req: 2 },
      { id: "club", cat: "Légal", name: "Boîte de nuit", desc: "La nuit est le meilleur des alibis.", costSec: 550, inc: 0.025, heat: 0.05, req: 2 },
      { id: "transport", cat: "Légal", name: "Compagnie de transport", desc: "Des camions déclarés, des livraisons déclarées.", costSec: 450, inc: 0.020, heat: -0.05, req: 1 },
      { id: "watch", cat: "Défense", name: "Poste de guet", desc: "Des yeux sur chaque rue : la défense du quartier augmente.", costSec: 350, inc: 0, heat: -0.05, def: 0.15, req: 1 },
      { id: "bunker", cat: "Défense", name: "Bunker de quartier", desc: "Béton, grilles et réserves : le quartier tient bien plus longtemps.", costSec: 900, inc: 0, heat: 0, def: 0.35, req: 3 },
      /* Partie 19 · F : cinq types de plus (mêmes règles de coût, revenu plafonné par incCap) */
      { id: "forgery", cat: "Illégal", name: "Atelier de faux papiers", desc: "Tampons, encres et signatures : des identités sur mesure.", costSec: 650, inc: 0.040, heat: 0.40, req: 2 },
      { id: "pier", cat: "Illégal", name: "Ponton de contrebande", desc: "Un quai discret où les bateaux accostent sans feux.", costSec: 800, inc: 0.045, heat: 0.45, req: 2 },
      { id: "exchange", cat: "Légal", name: "Bureau de change", desc: "Des devises, des reçus en règle et des montants arrondis.", costSec: 500, inc: 0.020, heat: -0.10, req: 1 },
      { id: "hotel", cat: "Légal", name: "Hôtel de passage", desc: "Des chambres payées d’avance et un registre qui oublie vite.", costSec: 600, inc: 0.020, heat: -0.20, req: 2 },
      { id: "garrison", cat: "Défense", name: "Caserne de vigiles", desc: "Des vigiles en relève permanente : le quartier tient mieux.", costSec: 700, inc: 0, heat: -0.10, def: 0.25, req: 2 },
      { id: "casino", cat: "Spécial", name: "Casino", desc: "Un vrai casino : tables, machines et roulette. Tu peux y jouer avec l’argent du jeu.", costSec: 2000, inc: 0.060, heat: 0.10, req: 3, special: true }
    ],
    /* chaque quartier avantage certains bâtiments (revenu ×1,5) et a sa propre architecture (silhouette dessinée dans map-render) */
    style: {
      center: { slots: 2, name: "Verre et néons", aff: ["club", "casino", "restaurant"] },
      industrial: { slots: 3, name: "Briques et sheds", aff: ["chop", "contraband", "transport"] },
      market: { slots: 3, name: "Halles couvertes", aff: ["racket", "betting", "restaurant"] },
      oldtown: { slots: 3, name: "Pierre et toits pentus", aff: ["racket", "laundry", "watch"] },
      port: { slots: 3, name: "Docks et conteneurs", aff: ["contraband", "transport", "chop"] },
      residential: { slots: 3, name: "Pavillons", aff: ["restaurant", "laundry", "watch"] },
      business: { slots: 4, name: "Tours vitrées", aff: ["casino", "club", "laundry"] },
      prestige: { slots: 4, name: "Manoirs et colonnades", aff: ["casino", "lab", "club"] },
      marina: { slots: 3, name: "Pontons et capitainerie", aff: ["pier", "contraband", "hotel"] },
      franche: { slots: 4, name: "Entrepôts sous douane", aff: ["exchange", "forgery", "transport"] },
      faubourg: { slots: 4, name: "Lanternes et cours", aff: ["hotel", "betting", "garrison"] }
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
