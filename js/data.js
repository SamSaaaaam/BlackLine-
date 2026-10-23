/* Données du jeu. Tout l'équilibrage se règle ici : bloc "balance", puis contenu (activités, améliorations, missions, succès). */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = {
    empireName: "Syndicat Blackline",
    saveKey: "blackline.save.v1",
    balance: {
      startMoney: 25,
      offlineCapSec: 8 * 3600, offlineEfficiency: 0.5, sleepGapSec: 300, /* une pause de plus de 5 min (veille, onglet gelé) est comptée comme une absence */
      levelBase: 60, levelExp: 5, maxEmpireLevel: 100, levelFrom2: 50, levelBase2: 1e13, levelRatio2: 1.151,   /* niveaux 1 à 50 : levelBase × (L-1)^levelExp ; niveaux 51 à 100 : levelBase2 × levelRatio2^(L-51), progression géométrique pour que le niveau 100 reste un objectif de très long terme */
       levelIncomePerLevel: 0.005, /* total requis pour le niveau L : levelBase × (L-1)^levelExp */
      repDivisor: 100, repIncomePerPoint: 0.005, repIncomeCap: 0.5,                     /* réputation = √total / repDivisor + bonus ; +1 % de revenus par point, plafonné */
      influenceLossPerPoint: 0.01, influenceLossCap: 0.5,                            /* l'influence réduit les pertes d'événements */
      milestones: [{ lvl: 5, mult: 1.25 }, { lvl: 10, mult: 1.5 }, { lvl: 20, mult: 2 }, { lvl: 25, mult: 2 }, { lvl: 30, mult: 1.1 }, { lvl: 35, mult: 1.1 }, { lvl: 40, mult: 1.15 }, { lvl: 45, mult: 1.15 }, { lvl: 50, mult: 1.2 }, { lvl: 55, mult: 1.1 }, { lvl: 60, mult: 1.15 }, { lvl: 65, mult: 1.1 }, { lvl: 70, mult: 1.15 }, { lvl: 75, mult: 1.25 }, { lvl: 80, mult: 1.15 }, { lvl: 85, mult: 1.1 }, { lvl: 90, mult: 1.2 }, { lvl: 95, mult: 1.15 }, { lvl: 100, mult: 1.5 }], /* paliers de niveau : multiplicateur de revenus de l'activité */
      lateFrom: 25, lateGrowthAdd: 0.05, lateFrom2: 50, lateGrowthAdd2: -0.13,   /* niveaux 51 à 100 : troisième phase de coût (growth + lateGrowthAdd2), nettement plus lente à monter que la phase 2 mais jamais plafonnée */
                                                        /* au-delà du niveau 25, le coût de chaque niveau croît un peu plus vite (growth + lateGrowthAdd) : la fin de partie reste longue sans que les revenus explosent */
      buyLockMs: 150
    },
    /* baseCost × growth^niveau ; upkeep = part du revenu de base payée en entretien par niveau ; unlock = prérequis visible. */
    activities: [
      { id: "backroom", cat: "Jeux et paris", name: "Salle de jeux clandestine", desc: "Des tables, des habitués, aucun registre.", icon: "dice", baseCost: 15, baseIncome: 0.15, growth: 1.15, maxLevel: 100, upkeep: 0.12 },
      { id: "freight", cat: "Logistique", name: "Convoyage de nuit", desc: "Des camions qui roulent quand la ville dort.", icon: "truck", baseCost: 500, baseIncome: 2, growth: 1.15, maxLevel: 100, upkeep: 0.12, unlock: { id: "backroom", lvl: 3 } },
      { id: "fence", cat: "Trafic et recel", name: "Réseau de recel", desc: "Tout se revend, tant qu’on ne pose pas de questions.", icon: "box", baseCost: 40000, baseIncome: 50, growth: 1.15, maxLevel: 100, upkeep: 0.14, unlock: { id: "freight", lvl: 5 } },
      { id: "estate", cat: "Façades", name: "Immobilier de façade", desc: "Des murs propres pour des comptes qui le sont moins.", icon: "empire", baseCost: 3000000, baseIncome: 900, growth: 1.16, maxLevel: 100, upkeep: 0.15, unlock: { id: "fence", lvl: 5 } },
      { id: "holding", cat: "Finance", name: "Holding offshore", desc: "Une adresse en bord de mer, un nom sur une boîte aux lettres.", icon: "money", baseCost: 150000000, baseIncome: 12000, growth: 1.17, maxLevel: 100, upkeep: 0.15, unlock: { id: "estate", lvl: 5 } }
    ],
    /* fx : inc {activité: facteur} · incAll facteur · upkeep facteur · cost facteur · rep +n · infl +n */
    upgrades: [
      { id: "u_cellar", name: "Cave aménagée", cost: 600, req: { backroom: 3 }, fx: { inc: { backroom: 2 } } },
      { id: "u_accountant", name: "Chef comptable", cost: 10000, req: { backroom: 5 }, fx: { upkeep: 0.75 } },
      { id: "u_fleet", name: "Flotte de camions", cost: 7200, req: { freight: 3 }, fx: { inc: { freight: 2 } } },
      { id: "u_books", name: "Comptabilité parallèle", cost: 24000, req: {}, fx: { incAll: 1.25 } },
      { id: "u_press", name: "Relations presse", cost: 36000, req: { backroom: 8 }, fx: { rep: 5 } },
      { id: "u_discount", name: "Fournisseurs en gros", cost: 48000, req: { freight: 5 }, fx: { cost: 0.9 } },
      { id: "u_broker", name: "Courtier discret", cost: 80000, req: { fence: 3 }, fx: { inc: { fence: 2 } } },
      { id: "u_tables", name: "Tables de prestige", cost: 8000, req: { backroom: 12 }, fx: { inc: { backroom: 2 } } },
      { id: "u_depots", name: "Réseau de dépôts", cost: 88000, req: { freight: 12 }, fx: { inc: { freight: 2 } } },
      { id: "u_auditor", name: "Contrôleur de gestion", cost: 160000, req: { freight: 8 }, fx: { upkeep: 0.7 } },
      { id: "u_lawyer", name: "Cabinet d’avocats", cost: 240000, req: {}, fx: { incAll: 1.5 } },
      { id: "u_district", name: "Quartier sous contrôle", cost: 320000, req: { fence: 5 }, fx: { infl: 10 } },
      { id: "u_network", name: "Centrale d’achats", cost: 600000, req: { fence: 8 }, fx: { cost: 0.9 } },
      { id: "u_vault", name: "Chambre forte", cost: 960000, req: { fence: 12 }, fx: { inc: { fence: 2 } } },
      { id: "u_agency", name: "Agence de façade", cost: 1200000, req: { estate: 3 }, fx: { inc: { estate: 2 } } },
      { id: "u_senator", name: "Un élu complice", cost: 4800000, req: { estate: 5 }, fx: { rep: 10, infl: 25 } },
      { id: "u_towers", name: "Tours de bureaux", cost: 12800000, req: { estate: 12 }, fx: { inc: { estate: 2 } } },
      { id: "u_shell", name: "Sociétés écrans", cost: 18000000, req: { holding: 3 }, fx: { inc: { holding: 2 } } },
      { id: "u_mayor", name: "Cabinet du maire", cost: 80000000, req: { holding: 5 }, fx: { rep: 15, infl: 40 } },
      { id: "u_haven", name: "Paradis fiscal", cost: 200000000, req: { holding: 12 }, fx: { inc: { holding: 2 } } }
    ],
    /* reward.money = montant fixe (jamais indexé sur les revenus courants, pour éviter les boucles d'enrichissement) ; rep et infl = bonus permanents. */
    missions: [
      { id: "m1", tier: "short", name: "Premiers pas", cond: { t: "owned", id: "backroom", n: 3 }, reward: { money: 40 } },
      { id: "m2", tier: "short", name: "Ouvrir la route", cond: { t: "owned", id: "freight", n: 1 }, reward: { money: 300 } },
      { id: "m3", tier: "short", name: "Premier relais", cond: { t: "income", n: 5 }, reward: { money: 150 } },
      { id: "m4", tier: "short", name: "Un coup de pouce", cond: { t: "upgrades", n: 1 }, reward: { money: 250, rep: 1 } },
      { id: "m5", tier: "mid", name: "Salles en série", cond: { t: "owned", id: "backroom", n: 10 }, reward: { money: 600, rep: 2 } },
      { id: "m6", tier: "mid", name: "Une vraie organisation", cond: { t: "level", n: 5 }, reward: { money: 1500, infl: 3 } },
      { id: "m7", tier: "mid", name: "Le recel s’installe", cond: { t: "owned", id: "fence", n: 1 }, reward: { money: 8000 } },
      { id: "m8", tier: "mid", name: "Cent par seconde", cond: { t: "income", n: 100 }, reward: { money: 8000, rep: 3 } },
      { id: "m9", tier: "mid", name: "Cinq améliorations", cond: { t: "upgrades", n: 5 }, reward: { money: 15000, infl: 4 } },
      { id: "m10", tier: "long", name: "Pignon sur rue", cond: { t: "owned", id: "estate", n: 5 }, reward: { money: 2000000, rep: 5, infl: 5 } },
      { id: "m11", tier: "long", name: "Une influence reconnue", cond: { t: "level", n: 15 }, reward: { money: 500000, rep: 5 } },
      { id: "m12", tier: "long", name: "Cap sur l’offshore", cond: { t: "owned", id: "holding", n: 1 }, reward: { money: 20000000, infl: 10 } },
      { id: "m13", tier: "long", name: "Un milliard", cond: { t: "total", n: 1000000000 }, reward: { money: 50000000, rep: 10 } },
      { id: "m14", tier: "long", name: "Un million par seconde", cond: { t: "income", n: 1000000 }, reward: { money: 100000000, infl: 10 } },
      { id: "m15", tier: "short", name: "Première conquête", cond: { t: "terr", n: 1 }, reward: { money: 2500, infl: 2 } },
      { id: "m16", tier: "mid", name: "Quatre quartiers", cond: { t: "terr", n: 4 }, reward: { money: 1500000, infl: 5 } },
      { id: "m17", tier: "long", name: "La ville est à toi", cond: { t: "terr", n: 8 }, reward: { money: 100000000, rep: 10, infl: 10 } }
    ],
    /* chaque succès débloqué apporte +1 réputation */
    achievements: [
      { id: "a1", name: "Première pierre", desc: "Ouvrir une salle de jeux", cond: { t: "owned", id: "backroom", n: 1 } },
      { id: "a2", name: "Cent mille", desc: "Gagner 100 000 $ au total", cond: { t: "total", n: 100000 } },
      { id: "a3", name: "Millionnaire", desc: "Gagner 1 M$ au total", cond: { t: "total", n: 1000000 } },
      { id: "a4", name: "Rouage huilé", desc: "Acquérir 5 améliorations", cond: { t: "upgrades", n: 5 } },
      { id: "a5", name: "Pied dans la porte", desc: "Atteindre le niveau d’empire 10", cond: { t: "level", n: 10 } },
      { id: "a6", name: "Bien connu des services", desc: "Atteindre 50 de réputation", cond: { t: "rep", n: 50 } },
      { id: "a7", name: "Palier maximal", desc: "Monter une salle de jeux au niveau 25", cond: { t: "owned", id: "backroom", n: 25 } },
      { id: "a8", name: "Empire diversifié", desc: "Posséder les cinq activités", cond: { t: "all", n: 1 } },
      { id: "a9", name: "Sphère d’influence", desc: "Atteindre 50 d’influence", cond: { t: "infl", n: 50 } },
      { id: "a10", name: "Tête de pont", desc: "Contrôler un premier quartier", cond: { t: "terr", n: 1 } },
      { id: "a11", name: "Maître du port", desc: "Porter le Port au contrôle 3", cond: { t: "dlv", id: "port", n: 3 } },
      { id: "a12", name: "Ville conquise", desc: "Contrôler les 8 quartiers", cond: { t: "terr", n: 8 } },
      { id: "a13", name: "Rempart", desc: "Repousser 3 attaques rivales", cond: { t: "won", n: 3 } },
      { id: "a21", name: "Bâtiment légendaire", desc: "Monter une salle de jeux au niveau 50", cond: { t: "owned", id: "backroom", n: 50 } },
      { id: "a22", name: "Légende de l’ombre", desc: "Atteindre le niveau d’empire 50", cond: { t: "level", n: 50 } },
      { id: "a23", name: "Au sommet", desc: "Monter une salle de jeux au niveau 100", cond: { t: "owned", id: "backroom", n: 100 } },
      { id: "a24", name: "Immortel de l’ombre", desc: "Atteindre le niveau d’empire 100", cond: { t: "level", n: 100 } }
    ],
    events: [
      { id: "tip", title: "Un informateur propose un tuyau", text: "Il promet un gros coup contre une avance.", choices: [
        { label: "Payer l’avance", hint: "−30 s de revenus, ×1,5 pendant 60 s", out: { sec: -30, boost: { mult: 1.5, dur: 60 } } },
        { label: "Refuser", hint: "Rien ne change", out: {} } ] },
      { id: "inspect", title: "Inspection surprise dans le quartier", text: "Des uniformes font le tour des commerces.", choices: [
        { label: "Graisser la patte", hint: "−45 s de revenus", out: { sec: -45 } },
        { label: "Fermer quelques instants", hint: "Revenus ×0,5 pendant 30 s", out: { boost: { mult: 0.5, dur: 30 } } } ] },
      { id: "cargo", title: "Livraison imprévue", text: "Un chargement non prévu attend dans un entrepôt.", choices: [
        { label: "L’écouler en ville", hint: "+90 s de revenus", out: { sec: 90 } },
        { label: "La revendre à un rival", hint: "+40 s de revenus, ×1,2 pendant 90 s", out: { sec: 40, boost: { mult: 1.2, dur: 90 } } } ] },
      { id: "rival", title: "Un rival teste ton territoire", text: "Ses hommes traînent devant tes commerces.", choices: [
        { label: "Riposter", hint: "1 chance sur 2 : +120 s de revenus, sinon −60 s", out: { chance: 0.5, win: { sec: 120 }, lose: { sec: -60 } } },
        { label: "Négocier", hint: "−20 s de revenus, ×1,2 pendant 120 s", out: { sec: -20, boost: { mult: 1.2, dur: 120 } } } ] },
      { id: "press", title: "Un journaliste enquête", text: "Il pose des questions sur tes activités nocturnes.", choices: [
        { label: "Étouffer l’affaire", hint: "−50 s de revenus", out: { sec: -50 } },
        { label: "Laisser faire", hint: "Revenus ×0,8 pendant 45 s", out: { boost: { mult: 0.8, dur: 45 } } } ] },
      /* Événements de rivalité (terr : n'apparaissent que si tu contrôles un quartier). {f} = faction concernée. fpow : multiplicateur d'influence de la faction ; truce : secondes sans conflit. */
      { id: "truce", terr: true, noAlly: true, title: "{f} propose une trêve", text: "Un émissaire demande à te rencontrer, les mains vides.", choices: [
        { label: "Accepter la trêve", hint: "−60 s de revenus, aucun conflit avec eux pendant 5 min", out: { sec: -60, truce: 300 } },
        { label: "Refuser", hint: "Leur influence augmente de 5 %", out: { fpow: 1.05 } } ] },
      { id: "defector", terr: true, title: "Un lieutenant de {f} change de camp", text: "Il connaît leurs habitudes et demande une prime.", choices: [
        { label: "L’accueillir", hint: "−90 s de revenus, +3 influence, {f} perd 8 % d’influence", out: { sec: -90, infl: 3, fpow: 0.92 } },
        { label: "Le renvoyer", hint: "Rien ne change", out: {} } ] },
      { id: "expand", terr: true, noAlly: true, title: "{f} étend son réseau", text: "Leurs hommes s’installent sur des terrains que tu surveillais.", choices: [
        { label: "Contre-attaquer", hint: "1 chance sur 2 : +60 s de revenus et −10 % d’influence pour eux, sinon −45 s et +5 % pour eux", out: { chance: 0.5, win: { sec: 60, fpow: 0.9 }, lose: { sec: -45, fpow: 1.05 } } },
        { label: "Laisser faire", hint: "Leur influence augmente de 3 %", out: { fpow: 1.03 } } ] }
    ]
  };

  /* ===== Territoires : tous les réglages du contrôle de la ville ===== */
  BL.data.territory = {
    city: "Port-Mirage",
    params: {
      maxControl: 5,                 /* niveau de contrôle maximal d'un quartier */
      investRatio: 0.5, investGrowth: 1.6,   /* coût du niveau n→n+1 = coût × investRatio × investGrowth^(n-1) */
      forceRatio: 0.6,               /* « Imposer » coûte ce ratio du coût de déblocage, mais peut échouer */
      inflPerStrategic: 0.5,         /* influence gagnée par niveau de contrôle × valeur stratégique */
      inflBase: 5, rivalryDefense: 8, powerShare: 0.3, minChance: 0.1, maxChance: 0.85,
      failPower: 0.04, takePower: 0.85,      /* échec : la faction gagne 4 % ; prise de quartier : elle perd 15 % */
      powerPerLevel: 0.1, powerPerHeld: 0.08, powerRate: 0.003,  /* évolution de la puissance des factions */
      upkeepFloor: 0.4, costFloor: 0.6,      /* plancher des réductions d'entretien et de coûts */
      impBoost: 1.25,
      conflict: { first: 300, minGap: 240, maxGap: 420, duration: 120, defendRatio: 0.2, negotiateRatio: 0.35, truce: 300,
        atkBase: 0.6, atkPerAggr: 0.1, defBase: 10, defPerStrat: 5, defPerInfl: 0.5, minChance: 0.1, maxChance: 0.9, winPower: 0.9, losePower: 1.05, impDefense: 1.25 }
    },
    /* améliorations génériques de quartier : slot, contrôle requis, coût (× coût de déblocage) */
    improvements: [
      { slot: "boost", req: 2, cost: 1, text: "Bonus du quartier ×1,25" },
      { slot: "guard", req: 3, cost: 1.5, text: "Défense du quartier ×1,25" }
    ],
    factions: [
      { id: "lames", name: "Les Lames du Nord", trait: "Jeunes, rapides et imprudents.", base: 12, aggression: 5 },
      { id: "corbeaux", name: "Les Corbeaux", trait: "Maîtres des docks et des entrepôts.", base: 18, aggression: 4 },
      { id: "meridian", name: "Consortium Meridian", trait: "Costumes sombres, avocats nombreux.", base: 30, aggression: 3 },
      { id: "valcourt", name: "Maison Valcourt", trait: "Une vieille famille qui préfère attendre.", base: 26, aggression: 2 }
    ],
    /* bonus : income (+% revenus), act (+% revenus de certaines activités), upkeep (−% entretien), cost (−% coût des activités), rep, infl : valeur par niveau de contrôle */
    districts: [
      { id: "center", name: "Centre-ville", short: "Centre-ville", desc: "Le cœur de Port-Mirage : tout y passe, tout s’y voit.", cost: 1500, rivalry: 1, strategic: 3, holder: "lames",
        req: { lvl: 3 }, neighbors: ["business", "market", "port", "industrial", "oldtown"], bonus: [{ type: "income", per: 0.02 }], imps: ["Comptoirs partenaires", "Veilleurs de rue"],
        poly: [[335, 195], [465, 195], [500, 290], [400, 340], [300, 290]] },
      { id: "industrial", name: "Quartier industriel", short: "Industriel", desc: "Entrepôts, ateliers et ouvriers qui ne posent pas de questions.", cost: 60000, rivalry: 2, strategic: 2, holder: "corbeaux",
        req: { lvl: 5, adj: true }, neighbors: ["port", "center", "oldtown"], bonus: [{ type: "upkeep", per: 0.05 }], imps: ["Entrepôts partagés", "Équipes de nuit"],
        poly: [[300, 290], [400, 340], [440, 395], [520, 462], [280, 472], [185, 390]] },
      { id: "market", name: "Quartier commerçant", short: "Commerçant", desc: "Vitrines, marchés et caisses où l’argent circule vite.", cost: 250000, rivalry: 2, strategic: 2, holder: "lames",
        req: { lvl: 6, adj: true }, neighbors: ["residential", "business", "center", "port"], bonus: [{ type: "cost", per: 0.02 }], imps: ["Syndicat des commerçants", "Vigiles de boutique"],
        poly: [[600, 190], [770, 230], [745, 340], [560, 330], [500, 290], [465, 195], [520, 130]] },
      { id: "oldtown", name: "Vieille ville", short: "Vieille ville", desc: "Ruelles étroites, mémoire longue et silences utiles.", cost: 800000, rivalry: 3, strategic: 3, holder: "valcourt",
        req: { lvl: 7, adj: true }, neighbors: ["prestige", "business", "center", "industrial"], bonus: [{ type: "rep", per: 3 }], imps: ["Café des anciens", "Passages secrets"],
        poly: [[40, 250], [215, 260], [300, 150], [335, 195], [300, 290], [185, 390], [280, 472], [45, 465]] },
      { id: "port", name: "Port", short: "Port", desc: "Quais, grues et cargaisons que personne n’ouvre.", cost: 2500000, rivalry: 3, strategic: 4, holder: "corbeaux",
        req: { lvl: 8, adj: true, owned: { freight: 10 } }, neighbors: ["market", "center", "industrial"], bonus: [{ type: "act", per: 0.06, targets: ["freight", "fence"] }], imps: ["Quai privé", "Douaniers complices"],
        poly: [[500, 290], [560, 330], [745, 340], [755, 455], [520, 462], [440, 395], [400, 340]] },
      { id: "residential", name: "Zone résidentielle", short: "Résidentiel", desc: "Pavillons calmes, voisins fidèles et volets fermés.", cost: 10000000, rivalry: 2, strategic: 1, holder: "meridian",
        req: { lvl: 10, adj: true, infl: 30 }, neighbors: ["business", "market"], bonus: [{ type: "infl", per: 4 }], imps: ["Comités de voisins", "Gardiens d’immeubles"],
        poly: [[530, 45], [765, 55], [770, 230], [600, 190], [520, 130]] },
      { id: "business", name: "Quartier des affaires", short: "Affaires", desc: "Tours de verre, contrats opaques et signatures rapides.", cost: 150000000, rivalry: 4, strategic: 4, holder: "meridian",
        req: { lvl: 15, adj: true, infl: 60, owned: { fence: 10 } }, neighbors: ["prestige", "residential", "market", "center", "oldtown"], bonus: [{ type: "act", per: 0.06, targets: ["estate", "holding"] }], imps: ["Cabinet conseil", "Sécurité privée"],
        poly: [[270, 40], [530, 45], [520, 130], [465, 195], [335, 195], [300, 150]] },
      { id: "prestige", name: "Quartier prestigieux", short: "Prestige", desc: "Villas sur les hauteurs, galas et amitiés très utiles.", cost: 800000000, rivalry: 5, strategic: 5, holder: "valcourt",
        req: { lvl: 25, adj: true, infl: 120, owned: { estate: 10 } }, neighbors: ["business", "oldtown"], bonus: [{ type: "income", per: 0.04 }, { type: "rep", per: 4 }], imps: ["Cercle privé", "Service d’ordre"],
        poly: [[40, 50], [270, 40], [300, 150], [215, 260], [40, 250]] }
    ]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
