/* Le grand braquage (Partie 13 · C5). Données seulement : le moteur est dans heist.js.
   Fiction : la banque, la ville et les noms sont inventés ; ton « film de casse », aucune violence graphique.
   Une opération rare en 5 étapes. Chaque étape propose un choix : coût (en minutes de revenu), chaleur ajoutée, bonus, caractéristique de l'équipe utilisée
   (pow = puissance, def = défense, stl = discrétion, spd = vitesse : celles de l'Arsenal et des équipiers). Les chances affichées sont EXACTEMENT celles tirées. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.heist = {
    params: {
      lvl: 30,                     /* niveau d'empire requis */
      cdSec: 28800,                /* délai entre deux braquages (temps de jeu, 8 h) */
      rewardMin: 60,               /* minutes de revenu pour un butin « normal » (réussite de 3 étapes sur 5) */
      loot: [0.45, 0.6, 0.8, 1, 1.3, 1.6],   /* multiplicateur selon le nombre d'étapes réussies (0 à 5) : un échec partiel réduit le butin, il ne bloque jamais */
      moneyCapMin: 15, minIncome: 50,
      base: 0.55, slope: 0.25, covCap: 2, chanceMin: 0.15, chanceMax: 0.9,   /* chance = base + pente × (couverture − 1) + bonus − chaleur */
      heatPen: 0.25,               /* à 100 de chaleur : −25 points de chance */
      failHeat: 2, goldFirst: 2, abandonCdMul: 0.5
    },
    heists: [{
      id: "aurelle", title: "La nuit de la banque Aurelle", who: "ines",
      intro: "La banque Aurelle ferme ses grilles à vingt heures. Dans sa chambre forte dort, dit-on, de quoi acheter un quartier. Inès a les plans, il manque un plan B.",
      trophy: { id: "cle_aurelle", name: "La clé d’Aurelle", text: "Une clé de chambre forte, devenue presse-papiers. Elle trône désormais dans ton coffre." },
      steps: [
        { id: "scout", title: "Repérage", stat: "stl", scene: "Le quartier d’Aurelle ressemble à une carte postale. Reste à savoir qui regarde la carte.",
          choices: [{ id: "watch", label: "Observer de loin", text: "Deux jours à boire du café en face. Rien ne s’achète, rien ne se voit.", bonus: 0.05, cost: 0, heat: 0 },
                    { id: "bribe", label: "Soudoyer un employé", text: "Il vend les horaires des rondes. Il vendra aussi ton visage, si on lui en offre plus.", bonus: 0.2, cost: 5, heat: 2 }] },
        { id: "team", title: "L’équipe", stat: "pow", scene: "Un casse se gagne avec les bonnes personnes, pas avec le plus de monde.",
          choices: [{ id: "duo", label: "Un duo discret", text: "Deux équipiers de confiance. Moins de bras, moins de bruit.", n: 2, bonus: 0.1, cost: 0, heat: 0 },
                    { id: "trio", label: "Un trio équilibré", text: "Trois équipiers : chacun a un rôle et un remplaçant.", n: 3, bonus: 0.05, cost: 0, heat: 1 },
                    { id: "quad", label: "Toute la bande", text: "Quatre équipiers : puissant, mais les rumeurs courent vite.", n: 4, bonus: 0, cost: 0, heat: 2 }] },
        { id: "gear", title: "Le matériel", stat: "", scene: "Dans l’Arsenal, chaque objet raconte une manière de faire. Il faut choisir laquelle.",
          choices: [{ id: "quiet", label: "Matériel silencieux", text: "Outils fins, gants, patience. Ce qui fait le moins de bruit.", stat: "stl", bonus: 0.05, cost: 3, heat: 0 },
                    { id: "heavy", label: "Matériel lourd", text: "Ce qui ouvre vite, quitte à s’entendre de loin.", stat: "pow", bonus: 0.1, cost: 4, heat: 2 }] },
        { id: "run", title: "L’exécution", stat: "", scene: "Vingt-trois heures douze. La grille est derrière vous, le couloir devant.",
          choices: [{ id: "silent", label: "En silence", text: "On passe comme l’air. Personne n’aura vu les sacs.", stat: "stl", bonus: 0, cost: 0, heat: 0 },
                    { id: "force", label: "Par la force", text: "Aucune finesse, beaucoup d’élan. Le quartier s’en souviendra.", stat: "pow", bonus: 0.15, cost: 0, heat: 4 }] },
        { id: "flee", title: "La fuite", stat: "", scene: "Une sirène, très loin, puis une autre. Il faut choisir une rue.",
          choices: [{ id: "sewer", label: "Par les égouts", text: "Odeur mémorable, itinéraire introuvable.", stat: "stl", bonus: 0, cost: 0, heat: 0 },
                    { id: "car", label: "En voiture rapide", text: "Un chauffeur, un moteur, aucun regret.", stat: "spd", bonus: 0.1, cost: 0, heat: 1 },
                    { id: "truck", label: "Camion blindé", text: "Lent, solide, impossible à arrêter.", stat: "def", bonus: 0.15, cost: 4, heat: 2 }] }
      ]
    }]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
