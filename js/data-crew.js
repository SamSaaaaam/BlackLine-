/* Données de l'équipe et de la diplomatie. Tout l'équilibrage de ces deux systèmes se règle ici. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data.crew = {
    params: {
      baseSlots: 2, slotEvery: 8, maxSlots: 6,           /* places actives = 2 + niveau d'empire / 8, plafonné */
      maxLevel: 8, statGrowth: 0.12, passiveGrowth: 0.08, upkeepGrowth: 0.06,   /* par niveau de personnage au-dessus de 1 */
      xpBase: 90, xpGrowth: 1.6, levelCostRatio: 0.35, levelCostGrowth: 1.7,    /* xp requise = xpBase × xpGrowth^(niv-1) secondes de service ; coût = coût × ratio × growth^(niv-1) */
      /* Effet d'une statistique : max × score / (score + k), où score = somme des valeurs des équipiers actifs (rendements décroissants) */
      k: { gest: 12, neg: 12, strat: 12, fin: 12, prot: 12, dipl: 12 },
      max: { upkeep: 0.28, income: 0.12, terrCost: 0.30, force: 0.25, def: 0.50, loss: 0.30, atk: 0.25, relGain: 1.0, chance: 0.30, negChance: 0.30 },
      award: { take: 60, defend: 40, truce: 20 }          /* expérience bonus pour tous les équipiers actifs */
    },
    stats: [
      { id: "gest", name: "Gestion", text: "Réduit l’entretien des activités." },
      { id: "neg", name: "Négociation", text: "Réduit le prix des quartiers et des trêves, aide à obtenir une trêve." },
      { id: "strat", name: "Stratégie", text: "Augmente les chances d’imposer un quartier et la défense des quartiers." },
      { id: "fin", name: "Finance", text: "Augmente les revenus de toutes les activités." },
      { id: "prot", name: "Protection", text: "Réduit les pertes d’événements et la force des attaques rivales." },
      { id: "dipl", name: "Diplomatie", text: "Amplifie les gains de relation et les chances d’alliance." }
    ],
    roles: {
      gestionnaire: { name: "Gestionnaire", stat: "gest", color: "#7d93ad" }, negociateur: { name: "Négociateur", stat: "neg", color: "#5fa39a" },
      stratege: { name: "Stratège", stat: "strat", color: "#9a7fb8" }, financier: { name: "Financier", stat: "fin", color: "#c8a45e" },
      protecteur: { name: "Protecteur", stat: "prot", color: "#b4705f" }, diplomate: { name: "Diplomate", stat: "dipl", color: "#7fae7f" }
    },
    /* Traits : upkeep = multiplicateur d'entretien, xp = multiplicateur d'expérience, stat = modificateurs de statistiques de base */
    traits: {
      meticulous: { name: "Méticuleux", text: "Entretien −10 %", upkeep: 0.9 }, rigorous: { name: "Rigoureuse", text: "+1 Gestion", stat: { gest: 1 } },
      charmer: { name: "Charmeuse", text: "+1 Diplomatie", stat: { dipl: 1 } }, loyal: { name: "Loyal", text: "Entretien −15 %", upkeep: 0.85 },
      greedy: { name: "Cupide", text: "+1 Finance, entretien +15 %", upkeep: 1.15, stat: { fin: 1 } }, impulsive: { name: "Impulsif", text: "+1 Stratégie, −1 Protection", stat: { strat: 1, prot: -1 } },
      patient: { name: "Patiente", text: "Expérience +30 %", xp: 1.3 }, paranoid: { name: "Paranoïaque", text: "+1 Protection, −1 Négociation", stat: { prot: 1, neg: -1 } },
      ambitious: { name: "Ambitieux", text: "Expérience +50 %, entretien +10 %", xp: 1.5, upkeep: 1.1 }, cold: { name: "Sang-froid", text: "+1 Stratégie, +1 Finance, entretien +10 %", upkeep: 1.1, stat: { strat: 1, fin: 1 } },
      visionary: { name: "Visionnaire", text: "+1 Stratégie, +1 Gestion, entretien +10 %", upkeep: 1.1, stat: { strat: 1, gest: 1 } },
      calculating: { name: "Calculatrice", text: "+1 Stratégie, +1 Finance, entretien +10 %", upkeep: 1.1, stat: { strat: 1, fin: 1 } },
      charismatic: { name: "Charismatique", text: "+1 Diplomatie, +1 Négociation, entretien +10 %", upkeep: 1.1, stat: { dipl: 1, neg: 1 } }
    },
    /* Types de bonus passifs : income, act (revenus de certaines activités), upkeep, cost, rep, infl, terrCost, def, force, relGain, loss, atk */
    members: [
      { id: "gino", name: "Gino Ferrara", nick: "Le Comptable", role: "gestionnaire", rarity: 1, spec: "Livres de comptes et économies de bouts de chandelle",
        bio: "Il garde chaque reçu depuis vingt ans, au cas où.", st: { gest: 6, neg: 2, strat: 1, fin: 4, prot: 1, dipl: 2 }, cost: 500, upkeep: 0.2, trait: "meticulous",
        passive: [{ type: "upkeep", per: 0.03 }], unlock: { lvl: 2 },
        look: { age: 61, eye: "#5a4a32", bg: ["#2a3a30", "#0e1511"], accent: "#e0c070", scene: "blinds", light: "l", skin: "#d9b08c", hair: "#6b6b6e", style: "short", face: "round", glasses: "round", glassColor: "#c8a45e", beard: "stache", suit: "#4a4a44", shirt: "#e8e4da", tie: "#7a2e2e", brow: "#5a5a5c", outfit: "pinstripe", pocket: "#e0c070", extra: ["visor"] } },
      { id: "maya", name: "Maya Okafor", nick: "Soie", role: "negociateur", rarity: 1, spec: "Discussions de couloir et sourires qui coûtent cher",
        bio: "Elle obtient toujours le dernier mot, avec le sourire.", st: { gest: 1, neg: 6, strat: 2, fin: 2, prot: 1, dipl: 4 }, cost: 900, upkeep: 0.3, trait: "charmer",
        passive: [{ type: "terrCost", per: 0.04 }], unlock: { lvl: 3 },
        look: { age: 34, eye: "#3a2a1c", bg: ["#3a1f3e", "#12091a"], accent: "#ff5fa8", accent2: "#4ad8e8", scene: "neon", light: "r", skin: "#8a5a3c", hair: "#16110e", style: "bob", face: "oval", female: true, lips: "#c0243a", suit: "#1a1220", shirt: "#efe9dc", outfit: "fur", fur: "#efe9dc", extra: ["earring", "pearls", "holder"], tie: null } },
      { id: "rocco", name: "Rocco Moretti", nick: "Brique", role: "protecteur", rarity: 1, spec: "Portes fermées et gens qui comprennent vite",
        bio: "Il parle peu. Il n’a jamais eu besoin de parler plus.", st: { gest: 2, neg: 1, strat: 3, fin: 1, prot: 6, dipl: 2 }, cost: 800, upkeep: 0.3, trait: "loyal",
        passive: [{ type: "def", per: 0.1 }], unlock: { lvl: 3 },
        look: { age: 45, eye: "#3a2a1c", bg: ["#4a2a22", "#150b09"], accent: "#ff9a4a", scene: "brick", light: "l", skin: "#c58f63", hair: "#1d1612", style: "bald", face: "square", beard: "full", suit: "#17171b", shirt: "#101014", outfit: "leather", extra: ["scar", "earring", "tattoo", "tape"], tie: null, brow: "#1d1612" } },
      { id: "ines", name: "Inès Marchand", nick: "La Plume", role: "financier", rarity: 2, spec: "Montages financiers et sociétés écrans",
        bio: "Elle signe à gauche pendant que la droite compte.", st: { gest: 3, neg: 3, strat: 2, fin: 8, prot: 2, dipl: 4 }, cost: 50000, upkeep: 20, trait: "greedy",
        passive: [{ type: "act", per: 0.04, targets: ["fence", "holding"] }], unlock: { lvl: 6 },
        look: { age: 38, eye: "#4a6a58", bg: ["#3d3320", "#120f08"], accent: "#e9c97b", scene: "skyline", light: "r", skin: "#e6c3a3", hair: "#8a3b22", style: "long", face: "oval", female: true, glasses: "round", glassColor: "#c8a45e", lips: "#a02a2a", suit: "#1b4a3d", shirt: "#efe9dc", outfit: "vest", vest: "#10271f", tie: "#a02a2a", extra: ["necklace"] } },
      { id: "theo", name: "Théo Valdès", nick: "Échec", role: "stratege", rarity: 2, spec: "Plans en trois coups et sorties de secours",
        bio: "Il joue avec trois coups d’avance, parfois quatre.", st: { gest: 2, neg: 3, strat: 8, fin: 3, prot: 3, dipl: 3 }, cost: 70000, upkeep: 30, trait: "impulsive",
        passive: [{ type: "force", per: 0.06 }], unlock: { lvl: 7, terr: 1 },
        look: { age: 41, eye: "#3a2a1c", bg: ["#2e2840", "#100d18"], accent: "#b08cff", scene: "checker", light: "l", skin: "#a9744f", hair: "#17110d", style: "curly", hat: "flat", hatColor: "#3a3a42", face: "square", beard: "stache", suit: "#2b2f3a", shirt: "#ddd7ca", outfit: "vest", vest: "#6a3a8a", tie: "#d8d2c6", brow: "#17110d", extra: ["toothpick"] } },
      { id: "samira", name: "Samira Haddad", nick: "Colombe", role: "diplomate", rarity: 2, spec: "Contacts dans tous les camps, sans jamais choisir",
        bio: "Les ennemis la saluent. Les alliés aussi, c’est le plus étrange.", st: { gest: 2, neg: 4, strat: 2, fin: 2, prot: 3, dipl: 9 }, cost: 90000, upkeep: 30, trait: "patient",
        passive: [{ type: "relGain", per: 0.15 }], unlock: { lvl: 7, rel: { fid: "valcourt", min: 15 } },
        look: { age: 36, eye: "#4a3320", bg: ["#2c4234", "#0b1510"], accent: "#e9c97b", scene: "arches", light: "r", skin: "#b98458", hair: "#201612", style: "long", face: "oval", female: true, lips: "#8a2d3a", suit: "#c8b494", shirt: "#ece5d6", outfit: "trench", extra: ["earring", "scarf"], scarf: "#2c5a62", tie: null } },
      { id: "colette", name: "Colette Dubreuil", nick: "Madame Blanche", role: "gestionnaire", rarity: 3, spec: "Logistique, planning et discipline de fer",
        bio: "Personne n’a jamais vu une facture traîner chez elle.", st: { gest: 9, neg: 4, strat: 4, fin: 5, prot: 3, dipl: 3 }, cost: 1400000, upkeep: 450, trait: "rigorous",
        passive: [{ type: "cost", per: 0.03 }], unlock: { lvl: 10, terr: 2 },
        look: { age: 67, eye: "#5a7a90", bg: ["#26303f", "#0a0d13"], accent: "#d8d8e0", scene: "rain", light: "l", skin: "#efd2b6", hair: "#c9c9cc", style: "bun", hat: "pillbox", hatColor: "#111114", face: "oval", female: true, glasses: "round", glassColor: "#2a2a2e", lips: "#8a1f2c", suit: "#121216", shirt: "#f0ece2", outfit: "fur", fur: "#f2f0ea", extra: ["pearls"], tie: null, brow: "#9a9a9e" } },
      { id: "karim", name: "Karim Benali", nick: "Le Prince", role: "negociateur", rarity: 3, spec: "Accords, pots-de-vin élégants et poignées de main",
        bio: "Il sourit encore en rédigeant le contrat de l’adversaire.", st: { gest: 3, neg: 9, strat: 4, fin: 3, prot: 2, dipl: 7 }, cost: 2200000, upkeep: 700, trait: "ambitious",
        passive: [{ type: "infl", per: 6 }], unlock: { lvl: 12, rel: { fid: "meridian", min: 20 } },
        look: { age: 43, eye: "#2e2218", bg: ["#223a3a", "#081312"], accent: "#ffd27a", accent2: "#ffffff", scene: "lights", light: "r", skin: "#a77a56", hair: "#0f0c0a", style: "slick", face: "square", beard: "full", suit: "#1a2848", shirt: "#ebe6d8", tie: "#c8a45e", outfit: "pinstripe", pocket: "#e9c97b", extra: ["chain", "earring"], brow: "#0f0c0a" } },
      { id: "nadia", name: "Nadia Volkova", nick: "Faucon", role: "protecteur", rarity: 3, spec: "Surveillance, contre-filature et réflexes",
        bio: "Elle repère la filature avant qu’elle ne démarre.", st: { gest: 3, neg: 3, strat: 5, fin: 3, prot: 9, dipl: 5 }, cost: 3000000, upkeep: 900, trait: "paranoid",
        passive: [{ type: "loss", per: 0.1 }], unlock: { lvl: 14, dist: "port" },
        look: { age: 31, eye: "#6a8aa0", bg: ["#4a2229", "#12090b"], accent: "#ff4a4a", scene: "docks", light: "l", skin: "#6a4330", hair: "#0f0b0a", style: "braids", hat: "beanie", hatColor: "#1a1a1f", face: "oval", female: true, glasses: "shades", lips: "#5e1f2c", suit: "#17171b", shirt: "#2b2c33", outfit: "leather", extra: ["earring", "earpiece"], tie: null } },
      { id: "sebastien", name: "Sébastien Roche", nick: "Le Notaire", role: "financier", rarity: 4, spec: "Fiducies, holdings et héritages bien arrangés",
        bio: "Un notaire à l’ancienne : tout est parfaitement légal, sur le papier.", st: { gest: 4, neg: 5, strat: 6, fin: 11, prot: 3, dipl: 5 }, cost: 60000000, upkeep: 25000, trait: "cold",
        passive: [{ type: "income", per: 0.03 }], unlock: { lvl: 20, dist: "market" },
        look: { age: 69, eye: "#6a8aa0", bg: ["#3b3523", "#120f07"], accent: "#e0b050", scene: "books", light: "l", skin: "#e2bf9f", hair: "#c9c9cc", style: "slick", face: "long", glasses: "monocle", glassColor: "#c8a45e", beard: "goatee", suit: "#25272d", shirt: "#f2eee4", tie: "#7a1f2c", outfit: "vest", vest: "#8a7340", extra: ["cigar"], brow: "#a9a9ac" } },
      { id: "eleonore", name: "Éléonore Vasseur", nick: "L’Ombre", role: "stratege", rarity: 4, spec: "Opérations de l’ombre, anticipation et coups d’éclat",
        bio: "On ne la voit que lorsqu’elle a déjà gagné.", st: { gest: 4, neg: 6, strat: 11, fin: 5, prot: 5, dipl: 3 }, cost: 150000000, upkeep: 70000, trait: "calculating",
        passive: [{ type: "def", per: 0.1 }, { type: "atk", per: 0.08 }], unlock: { lvl: 26, terr: 4 },
        look: { age: 52, eye: "#4a3a2a", bg: ["#33283f", "#0c0813"], accent: "#c080ff", scene: "rain", light: "r", skin: "#f0d6c0", hair: "#14101a", style: "long", hat: "trilby", hatColor: "#2a1a2a", band: "#a01f3a", face: "oval", female: true, lips: "#a01f33", suit: "#18121a", shirt: "#e9e2d8", outfit: "trench", extra: ["earring", "cig"], tie: null, brow: "#14101a" } },
      { id: "valenti", name: "Alessandro Valenti", nick: "Le Maître", role: "diplomate", rarity: 5, spec: "Pactes, héritages et poignées de main historiques",
        bio: "Il a signé la paix dans trois guerres. Il en a aussi déclenché deux.", st: { gest: 5, neg: 8, strat: 6, fin: 6, prot: 5, dipl: 10 }, cost: 600000000, upkeep: 150000, trait: "charismatic",
        passive: [{ type: "rep", per: 8 }, { type: "relGain", per: 0.25 }], unlock: { lvl: 34, ally: 1 },
        look: { age: 63, eye: "#4a3a24", bg: ["#5a4520", "#1a1207"], accent: "#ffd25a", scene: "sun", light: "r", skin: "#d4a47c", hair: "#dcdcdf", style: "slick", hat: "panama", hatColor: "#efe8d4", band: "#1a1a1e", face: "long", beard: "stache", glasses: "round", glassColor: "#c8a45e", suit: "#e0d8c4", shirt: "#f6f2e8", tie: "#3b2330", outfit: "vest", vest: "#cfc6ae", extra: ["rose"], brow: "#c9c9cc" } },
      { id: "tom", name: "Tom Guiri", nick: "Le Cartographe", role: "stratege", rarity: 5, spec: "Cartes de la ville, itinéraires de fuite et coups décisifs",
        bio: "Il connaît chaque ruelle, chaque toit et chaque garde de nuit. Il dessine l’empire avant qu’il existe.", st: { gest: 6, neg: 5, strat: 12, fin: 7, prot: 5, dipl: 4 }, cost: 900000000, upkeep: 220000, trait: "visionary",
        passive: [{ type: "def", per: 0.12 }, { type: "atk", per: 0.1 }], unlock: { lvl: 38, terr: 6 },
        look: { age: 40, eye: "#3a2a1c", bg: ["#1f3a5c", "#070d16"], accent: "#6fc0ff", scene: "map", light: "l", skin: "#d9ac84", hair: "#0d0a10", style: "pomp", hat: "trilby", hatColor: "#2a2f3a", band: "#c8a45e", face: "square", beard: "stubble", suit: "#2a3550", shirt: "#e7e1d2", outfit: "trench", extra: ["scar", "cig"], tie: null, brow: "#0d0a10" } }
    ]
  };

  /* Identité des factions (les 4 factions et leurs quartiers sont dans BL.data.territory) */
  BL.data.diplomacy = {
    params: {
      relMin: -100, relMax: 100, drift: 0.01,            /* la relation revient doucement vers l'attitude de départ (points par seconde) */
      hostile: -25, friendly: 25, close: 60,             /* seuils de statut */
      allyDur: 600, maxAllies: 2, allyIncome: 0.04, allyDef: 0.08, allyMinRel: 25, allyCd: 150,   /* alliance temporaire */
      rivalPenalty: 15, rivalBonus: 5,                   /* s'allier avec une faction fâche sa rivale */
      refFloor: 40, refGrowth: 1.35,                     /* coûts des actions : max(plancher selon le niveau, revenus × secondes) */
      gift: { sec: 90, rel: 12, cd: 60 }, truce: { sec: 150, len: 300, base: 0.35, perRel: 0.004, failRel: 3 },
      ally: { sec: 300, base: 0.2, perRel: 0.004, perAggr: 0.04, failRel: 4, dipl: 0.35 },
      press: { sec: 200, rel: -10, win: 0.9, lose: 1.04, loseRel: -5, xp: 30, stratWeight: 3, powerShare: 0.6, minChance: 0.1, maxChance: 0.85 },
      takeRel: -12, takeRivalRel: 5, failRel: -4, winRel: -3, truceRel: 3,          /* conséquences des conflits territoriaux */
      weightHostile: 50, atkRelDiv: 250, atkMin: 0.6, atkMax: 1.4
    },
    status: [{ max: -60, id: "enemy", name: "Ennemie" }, { max: -25, id: "hostile", name: "Hostile" }, { max: 25, id: "neutral", name: "Neutre" }, { max: 60, id: "friendly", name: "Amicale" }, { max: 101, id: "close", name: "Proche" }],
    factions: {
      lames: { color: "#6f9cc0", shape: "blades", rival: "corbeaux", disp: -15, motto: "Vite, fort, devant." },
      corbeaux: { color: "#9b86b8", shape: "raven", rival: "lames", disp: -5, motto: "Rien ne quitte le port sans nous." },
      meridian: { color: "#6fb0a2", shape: "hex", rival: "valcourt", disp: 5, motto: "Tout se négocie." },
      valcourt: { color: "#c0765f", shape: "crown", rival: "meridian", disp: 0, motto: "Le temps est notre allié." }
    }
  };

  /* Événements narratifs. {f} = faction concernée, {g} = sa rivale, {c} = équipier actif tiré au sort.
     fac : faction en jeu (niveau d'empire minLvl) ; crew : exige un équipier actif ; needRel / maxRel : relation minimale / maximale de la faction ; noAlly : pas une alliée.
     Résultats : rel (relation avec {f}), relG (relation avec {g}), ally (secondes d'alliance), xp (expérience de l'équipe), sec (secondes de revenus), fpow, chance/win/lose. */
  BL.data.events.push(
    { id: "service", fac: true, minLvl: 4, noAlly: true, title: "{f} réclame un service", text: "Un messager passe la porte : une faveur contre un peu de bienveillance.", choices: [
      { label: "Rendre le service", hint: "−70 s de revenus, relation avec {f} +12", out: { sec: -70, rel: 12 } },
      { label: "Refuser poliment", hint: "Relation avec {f} −5", out: { rel: -5 } } ] },
    { id: "border", fac: true, minLvl: 6, title: "Tensions entre {f} et {g}", text: "Deux camps s’observent de chaque côté d’une rue. Ils attendent que tu choisisses.", choices: [
      { label: "Soutenir {f}", hint: "−40 s de revenus, {f} +10, {g} −8", out: { sec: -40, rel: 10, relG: -8 } },
      { label: "Soutenir {g}", hint: "−40 s de revenus, {g} +10, {f} −8", out: { sec: -40, rel: -8, relG: 10 } },
      { label: "Jouer les médiateurs", hint: "1 chance sur 2 : les deux +6 et l’équipe progresse, sinon −30 s et les deux −4", out: { chance: 0.5, win: { rel: 6, relG: 6, xp: 30 }, lose: { sec: -30, rel: -4, relG: -4 } } } ] },
    { id: "pact", fac: true, minLvl: 8, needRel: 10, noAlly: true, title: "{f} propose un pacte éphémère", text: "Un accord discret, limité dans le temps, signé du bout des doigts.", choices: [
      { label: "Sceller le pacte", hint: "−80 s de revenus, alliance de 5 min, {g} −10", out: { sec: -80, ally: 300, rel: 5, relG: -10 } },
      { label: "Décliner", hint: "Relation avec {f} −2", out: { rel: -2 } } ] },
    { id: "fangs", fac: true, minLvl: 5, maxRel: -20, title: "{f} montre les crocs", text: "Leurs hommes se postent sur le trottoir d’en face, bras croisés.", choices: [
      { label: "Acheter le calme", hint: "−90 s de revenus, relation avec {f} +10", out: { sec: -90, rel: 10 } },
      { label: "Montrer ta force", hint: "1 chance sur 2 : {f} perd 10 % d’influence, sinon −60 s et +5 % pour eux", out: { chance: 0.5, win: { fpow: 0.9, rel: -3 }, lose: { sec: -60, fpow: 1.05 } } } ] },
    { id: "contact", fac: true, crew: true, minLvl: 5, title: "{c} a un contact chez {f}", text: "Un vieil ami, un service rendu autrefois. Cela peut ouvrir une porte.", choices: [
      { label: "Exploiter ce contact", hint: "−50 s de revenus, relation avec {f} +10, l’équipe progresse", out: { sec: -50, rel: 10, xp: 25 } },
      { label: "Garder ses distances", hint: "Rien ne change", out: {} } ] },
    { id: "poach", fac: true, crew: true, minLvl: 6, title: "{f} tente de débaucher {c}", text: "Une enveloppe épaisse, un rendez-vous discret. {c} te le dit franchement.", choices: [
      { label: "Surenchérir", hint: "−100 s de revenus, l’équipe progresse, {f} −3", out: { sec: -100, xp: 40, rel: -3 } },
      { label: "Laisser {c} décider", hint: "1 chance sur 2 : l’équipe progresse et {f} +5, sinon −60 s et {f} −5", out: { chance: 0.5, win: { xp: 60, rel: 5 }, lose: { sec: -60, rel: -5 } } } ] });

  /* Missions et succès liés à l'équipe */
  BL.data.missions.push(
    { id: "m18", tier: "short", name: "Première recrue", cond: { t: "crew", n: 1 }, reward: { money: 1200, infl: 1 } },
    { id: "m19", tier: "mid", name: "Une équipe soudée", cond: { t: "crew", n: 4 }, reward: { money: 150000, rep: 2, infl: 3 } },
    { id: "m20", tier: "long", name: "Lieutenant chevronné", cond: { t: "clv", n: 5 }, reward: { money: 500000, rep: 4 } });
  BL.data.achievements.push(
    { id: "a14", name: "Premier lieutenant", desc: "Recruter un premier personnage", cond: { t: "crew", n: 1 } },
    { id: "a15", name: "Étoile d’or", desc: "Recruter un personnage 5 étoiles", cond: { t: "star", n: 5 } },
    { id: "a16", name: "Pacte conclu", desc: "Sceller une première alliance", cond: { t: "ally", n: 1 } });
  /* citations de la fiche personnage (affichage seulement) */
  BL.data.crew.quotes = {
    gino: "Un reçu perdu, c’est un impôt que personne n’a voté.", maya: "Je ne négocie jamais. Je laisse les gens me proposer mieux.",
    rocco: "Les portes fermées protègent mieux que les discours.", ines: "Ce qui n’est pas écrit n’existe pas. Ce qui est écrit, je peux le déplacer.",
    theo: "Trois coups d’avance, c’est déjà être en retard.", samira: "Dans une guerre, le meilleur poste est celui où tout le monde vous salue.",
    colette: "Le désordre est la seule chose qu’on ne pardonne pas.", karim: "Un bon accord laisse l’autre persuadé qu’il a gagné.",
    nadia: "On ne suit jamais quelqu’un qui sait qu’il est suivi.", sebastien: "Tout est parfaitement légal. Il suffit de lire jusqu’à la dernière page.",
    eleonore: "Quand on me voit, c’est que la partie est finie.", valenti: "Une poignée de main vaut un traité, si on choisit bien la main.",
    tom: "Une ville se gagne sur le papier avant de se gagner dans la rue."
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
