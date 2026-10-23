/* Statuts de l'empire : un titre par palier de niveau d'empire (1 à 100). Logique pure, sans interface.
   Répartition : 4 niveaux d'écart au début (une promotion toutes les quelques minutes, pour que le joueur la voie vite),
   puis 4 à 6 niveaux d'écart au milieu, puis des titres de très long terme jusqu'au niveau maximal (100). */
(function (root) {
  var BL = root.BL = root.BL || {};
  var LIST = [
    { id: "voyou", name: "Petit voyou", lvl: 1, tag: "Tu débutes dans la rue." },
    { id: "truand", name: "Truand", lvl: 4, tag: "On commence à te connaître." },
    { id: "braqueur", name: "Braqueur", lvl: 8, tag: "Les coups rapportent." },
    { id: "racketteur", name: "Racketteur", lvl: 12, tag: "Les commerçants paient." },
    { id: "lieutenant", name: "Lieutenant", lvl: 16, tag: "Une équipe te suit." },
    { id: "chef", name: "Chef de gang", lvl: 20, tag: "Un quartier t'obéit." },
    { id: "caid", name: "Caïd", lvl: 25, tag: "Ton nom fait taire les rues." },
    { id: "baron", name: "Baron de la pègre", lvl: 30, tag: "Les rivaux négocient." },
    { id: "consigliere", name: "Consigliere", lvl: 35, tag: "Tu conseilles les plus grands." },
    { id: "parrain", name: "Parrain", lvl: 40, tag: "La ville est à toi." },
    { id: "grand", name: "Grand Parrain", lvl: 46, tag: "Personne n'ose te défier." },
    { id: "legende", name: "Légende de l’ombre", lvl: 50, tag: "Ton nom restera, mais ce n’est pas fini." },
    { id: "ombre", name: "Ombre du syndicat", lvl: 58, tag: "Tu n’as plus besoin de te montrer." },
    { id: "maitre", name: "Maître du milieu", lvl: 66, tag: "Chaque fil mène à toi." },
    { id: "seigneur", name: "Seigneur du crime", lvl: 75, tag: "Les États comptent avec toi." },
    { id: "empereur", name: "Empereur de la pègre", lvl: 85, tag: "Un empire sans frontières." },
    { id: "mythe", name: "Mythe vivant", lvl: 93, tag: "On raconte ton histoire avant que tu ne l’écrives." },
    { id: "immortel", name: "Immortel de l’ombre", lvl: 100, tag: "Niveau maximal : ton nom survivra à la ville." }
  ];
  function lv(x) { x = Math.floor(+x); return isFinite(x) && x > 1 ? x : 1; }
  function index(level) { level = lv(level); var i = 0; for (var k = 0; k < LIST.length; k++) if (level >= LIST[k].lvl) i = k; return i; }
  function of(level) { return LIST[index(level)]; }
  function next(level) { var i = index(level); return i + 1 < LIST.length ? LIST[i + 1] : null; }
  /* Progression vers le statut suivant, de 0 à 1 (1 au dernier statut). */
  function progress(level) { var i = index(level), n = LIST[i + 1]; if (!n) return 1; level = lv(level); return Math.max(0, Math.min(1, (level - LIST[i].lvl) / (n.lvl - LIST[i].lvl))); }
  BL.status = { LIST: LIST, index: index, of: of, next: next, progress: progress };
})(typeof globalThis !== "undefined" ? globalThis : this);
