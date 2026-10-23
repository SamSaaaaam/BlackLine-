/* La trame du parrain (Partie 13 · C1). Données seulement : le moteur est dans saga.js.
   Fiction : villes, noms et organisations inventés ; ton « film de gangsters », aucune violence graphique.
   Chapitre : id, title, who (identifiant d'un équipier : portrait), need { lvl : niveau d'empire, terr : quartiers contrôlés },
              scenes (3 à 4 phrases), decisions [ { id, q, opts [ { id, label, tone : "c" | "f" | "l", fx } ] } ].
   Tons : c = discrétion, f = peur (intimidation), l = loyauté (la famille d'abord). Ils décident de la fin.
   fx (tous bornés par saga.js) :
     inc ±  : part de revenu (0,01 = +1 %)       upkeep ± : entretien des activités      heat ± : chaleur gagnée (0,10 = +10 %)
     rep +  : points de réputation               rival ±  : vitesse des rivaux           fac { id : points } : relation avec une faction
     money ± : minutes de revenu (une seule fois ; négatif = coût, option grisée si tu ne peux pas payer)      gold + : lingots (une seule fois, très peu)
   Un choix ne s'applique qu'une fois et ne peut pas être refait. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.saga = {
    intro: "Tu n’as pas bâti un empire pour rester dans l’ombre. Six nuits, six visages, six questions dont aucune n’a de bonne réponse. La ville ne juge pas ce que tu possèdes : elle retient ce que tu réponds.",
    how: [
      "Un chapitre s’ouvre quand ton empire a le niveau et les quartiers qu’il exige.",
      "Chaque décision est définitive. Ce qui est écrit sur le choix est exactement ce qui s’applique.",
      "Chaque choix suit une voie : discrétion, peur ou loyauté. Leur total décide de ta fin.",
      "Les effets sont permanents mais bornés : l’histoire t’aide, elle ne remplace jamais ta progression.",
      "L’histoire ne s’arrête pas à la fin : elle ouvre le prestige (menu Carrière). Fiction : tous les noms sont inventés."
    ],
    epigraph: "« Ici, personne ne te demande ce que tu veux. On regarde ce que tu acceptes, et on envoie la note plus tard. »",
    world: {
      title: "La ville et ses Maisons",
      paras: [
        "Des docks qui sentent le sel et le fuel. Des tours de verre qui ne dorment jamais. Des ruelles de briques où chaque porte cache un comptoir. Cette ville vit de ce qui passe, de ce qui se cache et de ce qui se règle en liquide. Aucun parrain n’y règne seul : quatre puissances s’y surveillent depuis des décennies, et chacune a sa façon de dire « non ».",
        "Tu es arrivé avec une salle, une poignée de fidèles et plus d’ambition que de protections. Tant que tu restes petit, on te tolère. Le jour où tu grandis, on vient s’asseoir à ta table.",
        "Ce récit, ce sont ces conversations-là. Il ne remplace pas ton empire : il lui donne un visage, des dettes à payer, des alliés à garder et des conséquences qui restent."
      ],
      rules: [
        ["Une histoire en six chapitres", "Chaque chapitre s’ouvre avec ton niveau d’empire et tes quartiers. Il met un de tes proches face à une décision."],
        ["Trois voies", "Discrétion, peur, loyauté : chaque réponse en fait avancer une. Ta fin dépend de celle qui domine."],
        ["Des décisions définitives", "Un choix ne se refait pas. Ce qui est écrit sur le bouton est exactement ce qui s’applique."],
        ["Des effets bornés", "Revenus, chaleur, réputation, rivaux : les bonus restent modestes et ne remplacent jamais ta progression."]
      ]
    },
    factions: [
      { id: "valcourt", name: "Maison Valcourt", text: "La vieille famille. Elle protège, elle prête, elle n’oublie rien. Son patriarche règne par le temps : il peut attendre vingt ans une réponse, et l’obtenir." },
      { id: "corbeaux", name: "Les Corbeaux", text: "Maîtres du port. Rien n’entre ni ne sort sans leur accord. Ils prêtent aux petits commerçants, puis rappellent la dette au pire moment, avec le sourire." },
      { id: "meridian", name: "Consortium Meridian", text: "Des avocats, des comptes à l’étranger, des mains impeccables. Ils proposent de laver ton argent. Le prix est toujours écrit en petit, tout en bas." },
      { id: "lames", name: "Les Lames du Nord", text: "Jeunes, rapides, au premier rang. Pas de vieille histoire à protéger, donc rien à perdre. Ils ne signent pas leurs messages : ils les peignent sur les façades." }
    ],
    cast: {
      gino: "Ton comptable depuis le premier jour. Il sent l’argent changer de mains avant même que tu l’aies compté, et il garde chaque reçu « au cas où ».",
      rocco: "Le mur sur lequel tu t’appuies. Il parle peu, demande moins encore, et jamais pour lui. Cette fois, c’est pour son frère.",
      ines: "Elle signe à gauche pendant que la droite compte. Elle sait ce que valent les sociétés écrans, et surtout ce qu’elles coûtent.",
      nadia: "Faucon voit venir les Lames avant même qu’elles aient tenu le pinceau. Elle préfère qu’on frappe la première, et elle ne s’en cache pas.",
      theo: "Le stratège. Trois coups d’avance, parfois quatre. Ce soir-là, il en voit un que tu n’as pas vu, et il hésite à te le dire.",
      maya: "La négociatrice. Elle a toujours le dernier mot, et le sourire qui va avec. Quand la ville te tend le dernier verre, c’est elle qui reste dehors à guetter la rue."
    },
    tones: { c: "Discrétion", f: "Peur", l: "Loyauté" },
    params: { incCap: 0.10, upkeepCap: 0.15, heatCap: 0.30, repCap: 60, rivalCap: 0.25, moneyCapMin: 30, minIncome: 50 },
    chapters: [
      { id: "c1", blurb: "Un inconnu en manteau clair vient « protéger » ta salle. Il serait dommage de refuser.", title: "Une offre qu’on refuse poliment", who: "gino", need: { lvl: 3, terr: 0 },
        scenes: ["Minuit moins le quart. Un homme en manteau clair s’assoit à ta table sans y être invité, comme on s’assoit chez soi. Il se présente : émissaire de la Maison Valcourt.", "« Votre salle marche bien. Il serait dommage qu’elle marche seule. » Il sourit, comme sourient les notaires avant de lire un testament.", "Derrière le comptoir, Gino essuie le même verre depuis dix minutes. Il n’a rien entendu. Il a tout entendu.", "Sur la table, l’homme a posé une carte blanche. Ni nom, ni adresse. Juste un silence qui attend ta réponse."],
        decisions: [{ id: "d1", q: "La carte blanche est sur ta table. Que réponds-tu à la Maison Valcourt ?", opts: [
          { id: "accept", label: "Accepter leur protection, et le prix qui va avec", tone: "c", fx: { fac: { valcourt: 12 }, upkeep: 0.02, heat: -0.05 } },
          { id: "refuse", label: "Refuser, avec une courtoisie glaciale", tone: "f", fx: { fac: { valcourt: -8 }, rep: 4, inc: 0.01 } }] }] },
      { id: "c2", blurb: "Rocco ne demande jamais rien. Cette nuit, il n’a pas dormi.", title: "La dette de Rocco", who: "rocco", need: { lvl: 8, terr: 1 },
        scenes: ["Rocco n’a pas dormi. Les cernes, la chemise de la veille, les mains qui ne savent plus où se mettre. Son frère a emprunté aux Corbeaux pour ouvrir un garage. Le garage n’a jamais ouvert.", "« Je ne te demande rien », dit-il. C’est exactement ce que dit quelqu’un qui demande.", "Dehors, le quartier fait semblant de ne pas regarder. Chacun sait déjà que ta réponse fera le tour des comptoirs avant l’aube.", "Rocco ne bouge pas. Pour la première fois, le mur attend que quelqu’un le soutienne."],
        decisions: [{ id: "d1", q: "Une dette, un frère, un mur qui attend. Que fais-tu pour Rocco ?", opts: [
          { id: "pay", label: "Payer la dette des Corbeaux, sans un mot", tone: "l", fx: { money: -4, rep: 3, fac: { corbeaux: 6 } } },
          { id: "leave", label: "Le laisser se débrouiller : chacun ses dettes", tone: "f", fx: { inc: 0.01, rep: -2, heat: 0.05 } }] }] },
      { id: "c3", blurb: "Des avocats aux mains propres proposent de laver ton argent. Le prix est écrit en petit.", title: "Le Consortium", who: "ines", need: { lvl: 15, terr: 2 },
        scenes: ["Inès pose un dossier sur ton bureau. Papier épais, logo discret : Consortium Meridian. Même la couverture sent l’argent propre.", "« Ils veulent laver nos chiffres en échange de leur part. Ils ne diront jamais comment. Ils ne diront jamais combien. »", "Elle baisse la voix. « Si on dit non, il faudra apprendre à le faire nous-mêmes. Et apprendre, ça se paie. »", "Dehors, une berline noire attend sans moteur. Tu comprends que la réponse est déjà attendue : il ne reste qu’à choisir le prix."],
        decisions: [
          { id: "d1", q: "Le Consortium veut laver ton argent. Que leur réponds-tu ?", opts: [
            { id: "accept", label: "Signer avec le Consortium", tone: "c", fx: { fac: { meridian: 10 }, heat: -0.15, upkeep: 0.03 } },
            { id: "own", label: "Laver ton argent toi-même, à tes risques", tone: "f", fx: { inc: 0.02, heat: 0.10 } }] },
          { id: "d2", q: "Les livres de comptes : à qui les confies-tu ?", opts: [
            { id: "acct", label: "Engager un comptable qui ne pose pas de questions", tone: "c", fx: { money: -2, upkeep: -0.03 } },
            { id: "head", label: "Tout garder dans ta tête, rien sur le papier", tone: "l", fx: { rep: 3, heat: 0.05 } }] }] },
      { id: "c4", blurb: "Un signe peint à la bombe sur ta façade. Rien de cassé. Tout est dit.", title: "La nuit des Lames", who: "nadia", need: { lvl: 25, terr: 3 },
        scenes: ["À l’aube, un signe est apparu sur ta façade, tracé à la bombe en trois gestes nets. Rien de cassé, rien de volé. Un message, c’est pire.", "Nadia l’a vu avant toi. Elle n’a rien dit, et c’est ce silence qui t’inquiète.", "« Ils sont là-haut, sur les toits. Ils attendent de voir si tu bouges. »", "La rue s’est vidée plus vite que d’habitude. Même les pigeons ont l’air d’attendre."],
        decisions: [{ id: "d1", q: "Le signe est sur ta façade. Comment réponds-tu aux Lames du Nord ?", opts: [
          { id: "teeth", label: "Montrer les crocs, et le leur faire savoir", tone: "f", fx: { rival: -0.10, heat: 0.10, fac: { lames: -10 } } },
          { id: "truce", label: "Envoyer un émissaire, négocier une trêve", tone: "c", fx: { fac: { lames: 10 }, inc: -0.01 } },
          { id: "guard", label: "Veiller sur le quartier, tous ensemble", tone: "l", fx: { money: -4, rep: 5 } }] }] },
      { id: "c5", blurb: "Un de tes lieutenants déjeune avec l’ennemi. Il est encore temps. Pour l’instant.", title: "Le lieutenant qui hésite", who: "theo", need: { lvl: 35, terr: 4 },
        scenes: ["Théo a vu l’un de tes lieutenants déjeuner avec un homme de la Maison Valcourt. Une fois, ce n’est rien. Trois fois, c’est une habitude.", "Personne n’a rien dit. Tout le monde attend que quelqu’un parle le premier, et tout le monde espère que ce ne sera pas lui.", "« Il n’est pas encore parti, murmure Théo. C’est maintenant que tout se joue. Après, ce sera de l’histoire ancienne. »", "Dans la salle, les verres tintent un peu trop fort. Chacun surveille ton visage pour y lire la suite."],
        decisions: [
          { id: "d1", q: "Il hésite encore. Que fais-tu de ton lieutenant ?", opts: [
            { id: "forgive", label: "Lui parler en face, et lui pardonner", tone: "l", fx: { rep: 2, upkeep: 0.01 } },
            { id: "example", label: "Faire un exemple, devant tous", tone: "f", fx: { rep: 2, heat: 0.05, inc: 0.01 } }] },
          { id: "d2", q: "La ville attend un signe de toi. Lequel donnes-tu ?", opts: [
            { id: "party", label: "Offrir une fête au quartier, ce soir même", tone: "l", fx: { money: -5, rep: 6, heat: 0.05 } },
            { id: "silence", label: "Ne rien dire : le silence parle assez", tone: "c", fx: { heat: -0.08 } }] }] },
      { id: "c6", blurb: "Le patriarche de la Maison Valcourt t’attend dans un bar que tout le monde croyait fermé.", title: "Le dernier verre", who: "maya", need: { lvl: 45, terr: 5 },
        scenes: ["Le patriarche de la Maison Valcourt t’a demandé de venir seul, dans un bar que toute la ville croyait fermé depuis des années. La porte s’ouvre sans un bruit.", "Il pose deux verres. « Je n’ai plus l’âge de la guerre. Toi, tu n’as pas encore l’âge de la paix. »", "Dehors, Maya fixe la rue vide. Elle sait que ta réponse décidera de ce que la ville racontera de toi, pendant des années.", "Le patriarche attend. Il a toujours su attendre. Au fond du verre, la dernière chance de choisir qui tu seras."],
        decisions: [{ id: "d1", q: "Deux verres, un vieil homme, une dernière question. Que réponds-tu au patriarche ?", opts: [
          { id: "hand", label: "Lui tendre la main, et sceller la paix", tone: "l", fx: { fac: { valcourt: 15 }, rep: 5 } },
          { id: "fist", label: "Serrer le poing : la paix, c’est toi qui la dictes", tone: "f", fx: { rival: -0.10, heat: 0.05 } },
          { id: "vanish", label: "Vider ton verre et disparaître des registres", tone: "c", fx: { heat: -0.10 } }] }] }
    ],
    /* La fin dépend du total des tons (le dernier choix compte double). Égalité : loyauté > discrétion > peur. Le bonus de fin est permanent et borné. */
    endings: [
      { id: "ombre", hint: "Pour ceux qui règlent tout sans bruit, sans témoin, sans signature.", tone: "c", title: "Le parrain de l’ombre", text: "Ton nom ne figure sur aucun registre. Les murs de la ville connaissent ta voix, jamais ton visage. Tes rivaux cherchent encore qui tient les comptes, et ils chercheront longtemps.", fx: { heat: -0.10 } },
      { id: "terreur", hint: "Pour ceux dont l’arrivée suffit à éteindre les conversations.", tone: "f", title: "Le souverain de la peur", text: "Quand tu entres quelque part, les conversations s’arrêtent et personne ne demande pourquoi. On t’obéit, parce qu’on préfère ne pas savoir ce qui arriverait autrement.", fx: { rival: -0.10 } },
      { id: "famille", hint: "Pour ceux qui ne laissent jamais personne seul dans la tempête.", tone: "l", title: "La famille d’abord", text: "Ta table est la plus longue de la ville. Ceux qui t’ont suivi ne l’ont pas fait pour l’argent, et c’est précisément ce qui rend ton empire impossible à défaire.", fx: { inc: 0.02 } },
      { id: "equilibre", hint: "Pour ceux qui tiennent les trois fils sans jamais en lâcher un.", tone: "x", title: "L’équilibriste", text: "Ni tout à fait craint, ni tout à fait aimé, ni tout à fait oublié. Tu tiens les trois fils d’une main, et la ville retient son souffle en se demandant de quel côté tu vas tomber.", fx: { rep: 10 } }
    ]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
