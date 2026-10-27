/* Durée de vie (Partie 13 · C9) : clans de prestige, mode difficile, défis locaux, succès ajoutés. Données seulement : le moteur est dans meta.js.
   Tout est local : aucun serveur, aucun compte. Les lingots ne servent qu'aux cosmétiques. Fiction. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.data = BL.data || {};
  BL.data.meta = {
    params: { prestigeLevel: 60, prestigeInc: 0.02, prestigeCap: 0.20, hardPrestigeMul: 1.5, hardHeat: 0.20, hardRival: 0.20, hardCost: 0.05, hardWindowSec: 600,
      dailyCount: 3, weeklyCount: 2, dailyGold: 1, weeklyGold: 2, weeklyMul: 4, collScan: 2, keepRuns: 5 },
    clans: {
      ombre: { name: "Le Discret", crew: "gino", fx: { heat: -0.15 }, text: "Tu travailles dans l’ombre.", rule: "La chaleur monte 15 % moins vite. Gino te rejoint dès le départ." },
      fer: { name: "Le Brutal", crew: "rocco", fx: { inc: 0.05, heat: 0.10, rival: 0.15 }, text: "Tu règnes par la force.", rule: "Revenus +5 %, mais chaleur +10 % et rivaux 15 % plus rapides. Rocco te rejoint dès le départ." },
      velours: { name: "Le Politique", crew: "maya", fx: { cost: -0.03 }, rel: 10, text: "Tu règnes par les accords.", rule: "Prix −3 %, relations de départ +10 avec toutes les factions. Maya te rejoint dès le départ." }
    },
    /* Modèles de défis : metric lu dans l'état, steps = paliers (le défi du jour tire un palier), min = minutes de revenu pour « earn ». */
    templates: {
      earn: { name: "Gagner de l'argent", text: "Gagner {n}", steps: [20, 35, 60], unit: "min" },
      ops: { name: "Opérations", text: "Terminer {n} opération(s) de l'Arsenal", steps: [1, 2, 3] },
      def: { name: "Défense", text: "Repousser {n} attaque(s) de rivaux", steps: [1, 2, 3] },
      casino: { name: "Casino", text: "Jouer {n} partie(s) au casino", steps: [3, 6, 10] },
      build: { name: "Expansion", text: "Acheter {n} niveaux d'activités", steps: [5, 10, 20] },
      /* Partie 19 · E : 7 modèles de plus (3 paliers chacun). Chacun n'est tiré que s'il est réalisable à ce stade de la partie (voir meta.js, eligible). */
      heist: { name: "Grand braquage", text: "Terminer {n} braquage(s)", steps: [1, 1, 2] },
      visit: { name: "Tournée", text: "Visiter {n} quartier(s) différents (fiche ouverte)", steps: [1, 2, 3] },
      cool: { name: "Profil bas", text: "Faire descendre la chaleur à {n} ou moins", steps: [40, 25, 10], latch: true },
      crew: { name: "Recrutement", text: "Recruter ou former {n} fois un équipier", steps: [1, 2, 3] },
      works: { name: "Chantiers", text: "Terminer {n} chantier(s)", steps: [2, 4, 8] },
      mini: { name: "Savoir-faire", text: "Jouer {n} mini-jeu(x)", steps: [1, 2, 3] },
      income: { name: "Rendement", text: "Atteindre {n}/s de revenus nets", steps: [1.1, 1.2, 1.35], latch: true }
    },
    achievements: [
      { id: "m1", name: "Premier chapitre", desc: "Terminer le chapitre 1 de l’histoire", cond: { t: "chap", n: 1 } },
      { id: "m2", name: "Tout un roman", desc: "Terminer tous les chapitres de l’histoire", cond: { t: "chap", n: 6 } },
      { id: "m3", name: "Plusieurs vies", desc: "Voir 2 fins différentes", cond: { t: "ends", n: 2 } },
      { id: "m4", name: "Boss tombé", desc: "Vaincre un boss de quartier", cond: { t: "boss", n: 1 } },
      { id: "m5", name: "Chasseur de boss", desc: "Vaincre 4 boss de quartier", cond: { t: "boss", n: 4 } },
      { id: "m6", name: "Liens solides", desc: "Vivre le moment personnel de 3 équipiers", cond: { t: "bond", n: 3 } },
      { id: "m7", name: "Nouvelle vie", desc: "Commencer une partie+ (prestige)", cond: { t: "pres", n: 1 } },
      { id: "m8", name: "Défis relevés", desc: "Réclamer 5 défis locaux", cond: { t: "chal", n: 5 } },
      { id: "m9", name: "Sang-froid", desc: "Atteindre le niveau 30 en mode difficile", cond: { t: "hard", n: 30 } }
    ]
  };
  /* Les succès ajoutés rejoignent la liste existante (sans toucher aux anciens). */
  if (BL.data.achievements) BL.data.meta.achievements.forEach(function (a) { if (!BL.data.achievements.some(function (x) { return x.id === a.id; })) BL.data.achievements.push(a); });
})(typeof globalThis !== "undefined" ? globalThis : this);
