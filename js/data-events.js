/* Événements à embranchements (C10). Ton fictif : aucune personne réelle, aucun lieu réel.
   Chaque choix décrit son issue dans `out` ; l'indication de risque et de récompense affichée au joueur est GÉNÉRÉE à partir de `out`
   (pourcentages exacts, montants réels au moment de l'affichage), jamais écrite à la main : texte et règle ne peuvent pas diverger.
   out : sec (× revenus nets), boost {mult,dur}, infl, rel / relG (relation avec {f} / {g}), fpow, truce, ally, xp, heat (points de chaleur), press (pression de {f}),
         chance + win/lose (tirage décidé UNE fois, au clic).
   need : { role } — l'option exige un équipier ACTIF de ce rôle ; l'équipier est montré, la raison est écrite. Sans lui, l'option reste visible mais grisée.
   Conditions d'apparition : terr (exige un quartier), fac (une faction est en jeu), crew ({c} tiré parmi les actifs), minLvl, heatMin. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data.events.push(
    { id: "fire", minLvl: 3, title: "Un entrepôt prend feu", text: "Une étincelle, un stock de carton, et la rue sent déjà la fumée. Les voisins regardent.", choices: [
      { label: "Payer des pompiers privés", out: { sec: -40, heat: 2 } },
      { label: "Laisser brûler et toucher l’assurance", out: { chance: 0.6, win: { sec: 25, heat: 3 }, lose: { sec: -70, heat: 6 } } },
      { label: "Faire sécuriser les lieux par un protecteur", need: { role: "protecteur" }, out: { sec: -15, heat: -2 } } ] },
    { id: "notary", minLvl: 4, title: "Un notaire propose ses services", text: "Costume impeccable, sourire de circonstance : il promet des papiers « propres » pour tes affaires.", choices: [
      { label: "Accepter ses services", out: { sec: -60, heat: -8 } },
      { label: "Refuser poliment", out: {} },
      { label: "Négocier sa commission avec un financier", need: { role: "financier" }, out: { chance: 0.7, win: { sec: 80, heat: -5 }, lose: { sec: -30 } } } ] },
    { id: "strike", minLvl: 5, title: "Les dockers menacent de faire grève", text: "Les grues s’arrêtent à midi si rien ne bouge. Les camions s’alignent déjà.", choices: [
      { label: "Augmenter les salaires", out: { sec: -50, boost: { mult: 1.15, dur: 60 } } },
      { label: "Briser la grève", out: { chance: 0.5, win: { sec: 40, boost: { mult: 1.1, dur: 60 } }, lose: { sec: -90, heat: 6 } } },
      { label: "Apaiser les délégués avec un négociateur", need: { role: "negociateur" }, out: { sec: -20, boost: { mult: 1.2, dur: 90 } } } ] },
    { id: "honest", minLvl: 6, title: "Un inspecteur trop honnête", text: "Il refuse les enveloppes, note tout dans un carnet et revient demain.", choices: [
      { label: "Tenter de le corrompre", out: { chance: 0.7, win: { sec: -60, heat: -10 }, lose: { sec: -20, heat: 15 } } },
      { label: "L’éviter quelques jours", out: { heat: 4 } },
      { label: "Le rallier à ta cause avec un diplomate", need: { role: "diplomate" }, out: { heat: -12 } } ] },
    { id: "convoy", terr: true, noAlly: true, minLvl: 6, title: "Un convoi mal gardé de {f}", text: "Un informateur jure que deux camions de {f} passent sans escorte ce soir.", choices: [
      { label: "Tendre une embuscade", out: { chance: 0.55, win: { sec: 110, rel: -8, heat: 5 }, lose: { sec: -70, rel: -4, heat: 4 } } },
      { label: "Revendre le tuyau à {f}", out: { sec: 30, rel: 6 } },
      { label: "Faire planifier le coup par un stratège", need: { role: "stratege" }, out: { chance: 0.75, win: { sec: 110, rel: -8, heat: 3 }, lose: { sec: -50, rel: -4 } } } ] },
    { id: "gala", minLvl: 7, title: "Une invitation au gala de la mairie", text: "Smoking de rigueur, photographes à l’entrée. Une table se libère à ton nom.", choices: [
      { label: "Offrir un don généreux", out: { sec: -35, heat: -6 } },
      { label: "Envoyer un émissaire sans te montrer", out: { sec: -10, heat: -2 } },
      { label: "Décliner l’invitation", out: { heat: 1 } } ] },
    { id: "hacker", minLvl: 8, title: "Un informaticien de passage", text: "Il propose de « réorganiser » tes comptes et tes registres en une nuit. Il ne donne pas son vrai nom.", choices: [
      { label: "L’embaucher à la tâche", out: { chance: 0.65, win: { sec: -45, boost: { mult: 1.25, dur: 90 } }, lose: { sec: -80, heat: 5 } } },
      { label: "Le laisser repartir", out: {} },
      { label: "Faire auditer ses méthodes par un gestionnaire", need: { role: "gestionnaire" }, out: { sec: -45, boost: { mult: 1.25, dur: 120 } } } ] },
    { id: "mole", crew: true, minLvl: 6, title: "Des soupçons sur {c}", text: "Un message anonyme prétend que quelqu’un parle à la brigade. Les regards se tournent vers {c}.", choices: [
      { label: "Faire confiance à {c}", out: { chance: 0.7, win: { xp: 30 }, lose: { sec: -60, heat: 8 } } },
      { label: "Faire surveiller {c} discrètement", out: { sec: -30 } },
      { label: "Laisser un protecteur mener l’enquête", need: { role: "protecteur" }, out: { sec: -25, xp: 15, heat: -3 } } ] },
    { id: "share", terr: true, noAlly: true, minLvl: 7, title: "{f} propose un partage de rue", text: "Un émissaire déroule une carte : chacun garde ses trottoirs, personne ne gêne personne.", choices: [
      { label: "Accepter le partage", out: { sec: 60, rel: 8, fpow: 1.05 } },
      { label: "Refuser en bluffant sur tes forces", out: { chance: 0.45, win: { fpow: 0.92, press: -8 }, lose: { sec: -40, fpow: 1.08, press: 8 } } },
      { label: "Renégocier les termes avec un négociateur", need: { role: "negociateur" }, out: { sec: 90, rel: 10 } } ] },
    { id: "blackout", minLvl: 4, title: "Panne de courant sur le port", text: "Tout est noir de la jetée aux entrepôts. Certains en profitent, d’autres cherchent leurs clés.", choices: [
      { label: "Profiter de l’obscurité", out: { chance: 0.6, win: { boost: { mult: 1.3, dur: 45 }, heat: 3 }, lose: { sec: -40, heat: 6 } } },
      { label: "Aider les habitants", out: { sec: -30, heat: -4 } } ] },
    { id: "tender", minLvl: 9, title: "Un appel d’offres de la ville", text: "Rénovation de quais : un contrat propre, des marges honnêtes, des dossiers épais à monter.", choices: [
      { label: "Candidater via une société écran", out: { chance: 0.5, win: { boost: { mult: 1.4, dur: 180 }, heat: -4 }, lose: { sec: -20 } } },
      { label: "Passer son tour", out: {} },
      { label: "Monter un dossier solide avec un financier", need: { role: "financier" }, out: { chance: 0.75, win: { boost: { mult: 1.4, dur: 180 }, heat: -4 }, lose: { sec: -20 } } } ] },
    { id: "leak", minLvl: 8, heatMin: 25, title: "Une fuite dans la presse locale", text: "Un article parle d’« activités nocturnes » sans te nommer. Pour l’instant.", choices: [
      { label: "Acheter le silence du journal", out: { sec: -55, heat: -10 } },
      { label: "Démentir publiquement", out: { chance: 0.5, win: { heat: -6 }, lose: { heat: 8 } } },
      { label: "Ne rien dire", out: { heat: 3 } } ] },
    { id: "courier", crew: true, minLvl: 5, title: "{c} s’inquiète pour un coursier", text: "Un livreur n’est pas rentré. {c} propose de remonter sa piste avant que quelqu’un d’autre ne le fasse.", choices: [
      { label: "Envoyer {c} le retrouver", out: { chance: 0.6, win: { sec: 50, xp: 25 }, lose: { sec: -40 } } },
      { label: "Attendre son retour", out: {} },
      { label: "Faire appel à un stratège", need: { role: "stratege" }, out: { sec: 35, xp: 20 } } ] }
  );
})(typeof window !== "undefined" ? window : globalThis);
