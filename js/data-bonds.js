/* Caractère de l'équipe (Partie 13 · C4). Données seulement : le moteur est dans bonds.js. Fiction : personnages inventés.
   temper : tempérament (steady = fidèle, proud = fier, greedy = cupide, loner = solitaire, warm = chaleureux).
   likes / clashes : affinités et tensions entre deux équipiers (symétriques). mission : le moment personnel de chaque personnage (une fois). */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.bonds = {
    params: { start: 60, max: 100, min: 0, warn1: 25, warn2: 12, countdown: 600, offlineCapMin: 30, floorBond: 30, minLvMission: 3,
      activeRate: 0.10, steadyBonus: 0.05, benchProud: -0.15, benchOther: -0.05, likeRate: 0.20, warmMul: 1.5, clashRate: -0.30, greedyDrain: -0.10,
      giftMin: 3, giftFloor: 1000, gift: 15, giftGreedy: 25, giftCd: 600, missionMin: 3, missionA: 30, missionB: 10, recallMin: 5, recallLoy: 40,
      mulLo: 0.9, mulHi: 1.1, disputeBelow: 45, disputeSec: 300, disputeMul: 0.8, disputeRest: 1200, synergyPer: 0.005, synergyCap: 0.02, betrayHeat: 10, betrayMin: 3, hostMin: 1 },
    temper: {
      steady: { name: "Fidèle", text: "Se lasse lentement : gagne de la loyauté en équipe et ne perd rien sur le banc." },
      proud: { name: "Fier", text: "Veut être sur le terrain : perd de la loyauté plus vite sur le banc." },
      greedy: { name: "Cupide", text: "Perd de la loyauté sans primes, mais une prime compte plus. Peut trahir s'il part." },
      loner: { name: "Solitaire", text: "Ignore affinités et tensions : sa loyauté ne dépend que de ses primes et de sa mission." },
      warm: { name: "Chaleureux", text: "Les affinités comptent plus (+50 %) : il s'attache vite à ceux qu'il aime." }
    },
    chars: {
      gino: { temper: "steady", likes: ["colette"], clashes: ["ines"],
        mission: { title: "Les reçus de Gino", text: "Gino a gardé vingt ans de reçus dans une boîte à chaussures. Une erreur de transcription pourrait te coûter cher : il ne dort plus.", a: "Passer la nuit à tout vérifier avec lui", b: "Lui dire de se débrouiller seul" } },
      maya: { temper: "warm", likes: ["karim"], clashes: ["rocco"],
        mission: { title: "Le dernier mot de Maya", text: "Maya doit renégocier un contrat que son ancien patron refuse de rendre. Elle te demande d'être là, sans rien dire.", a: "Venir avec elle, en silence", b: "La laisser y aller seule" } },
      rocco: { temper: "steady", likes: ["nadia"], clashes: ["maya", "karim"],
        mission: { title: "La dette de Rocco", text: "Rocco doit un service à un ancien voisin qui a perdu son atelier. Il n'ose pas te demander de l'aide.", a: "Financer la réouverture de l'atelier", b: "Lui dire que ça le regarde" } },
      ines: { temper: "proud", likes: ["sebastien"], clashes: ["gino"],
        mission: { title: "Le nom d'Inès", text: "Inès veut que son nom figure enfin sur un document : pas pour l'argent, pour ne plus rester dans l'ombre.", a: "Lui offrir un titre et un bureau", b: "Lui promettre « plus tard »" } },
      theo: { temper: "proud", likes: ["eleonore", "tom"], clashes: ["colette"],
        mission: { title: "Le plan de secours de Théo", text: "Théo a préparé trois plans de fuite. Il n'a jamais pu en tester un seul, et il te le dit sans te regarder.", a: "Financer un exercice grandeur nature", b: "Lui répondre qu'on verra le jour venu" } },
      samira: { temper: "warm", likes: ["valenti"], clashes: ["rocco"],
        mission: { title: "La lettre de Samira", text: "Samira a reçu une lettre d'un camp qu'elle n'a jamais choisi. Elle ne sait pas s'il faut y répondre.", a: "Répondre ensemble, avec les bons mots", b: "Lui laisser trancher" } },
      colette: { temper: "steady", likes: ["gino"], clashes: ["theo"],
        mission: { title: "Le planning de Colette", text: "Colette tient un planning au quart d'heure. Un imprévu l'a mis en miettes, et elle prétend que ce n'est rien.", a: "Réorganiser sa semaine avec elle", b: "Lui dire de s'adapter" } },
      karim: { temper: "greedy", likes: ["maya"], clashes: ["nadia", "rocco"],
        mission: { title: "Le pari de Karim", text: "Karim a promis un cadeau très cher à un contact important. Il compte sur toi, sans le dire.", a: "Payer le cadeau", b: "Refuser, poliment" } },
      nadia: { temper: "loner", likes: ["rocco"], clashes: [],
        mission: { title: "Le secret de Nadia", text: "Nadia garde un dossier qu'elle ne montre à personne. Ce soir, elle te le tend, sans un mot.", a: "Le lire et l'aider", b: "Lui rendre sans le lire" } },
      sebastien: { temper: "greedy", likes: ["ines"], clashes: ["eleonore"],
        mission: { title: "L'héritage de Sébastien", text: "Un client de Sébastien est mort sans testament clair. Il aimerait un geste de ta part pour régler les choses en douceur.", a: "Prendre en charge les frais", b: "Le laisser gérer" } },
      eleonore: { temper: "loner", likes: ["theo"], clashes: ["sebastien"],
        mission: { title: "L'ombre d'Éléonore", text: "Éléonore a été reconnue dans la rue pour la première fois. Elle te demande de ne rien changer à ses habitudes.", a: "Couvrir ses déplacements", b: "Lui conseiller de s'adapter" } },
      valenti: { temper: "steady", likes: ["samira"], clashes: ["tom"],
        mission: { title: "La poignée de main de Valenti", text: "Valenti veut honorer un vieux pacte dont plus personne ne se souvient. Il y tient, simplement.", a: "Organiser la cérémonie avec lui", b: "Le laisser faire sans toi" } },
      tom: { temper: "warm", likes: ["theo"], clashes: ["valenti"],
        mission: { title: "La carte de Tom", text: "Tom a dessiné une carte de la ville que personne n'a vue. Il hésite à te la montrer : elle montre des endroits sensibles.", a: "Lui acheter la carte, pour la protéger", b: "Lui dire de la garder pour lui" } }
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
