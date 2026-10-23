/* Illustrations des constructions de quartier : depuis la Partie 12, elles viennent de BL.venues (le même dessin que sur la carte, quel que soit le quartier).
   Ce module ne garde que l'interface historique BL.dbArt.svg(type) / BL.dbArt.acc. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.dbArt = { svg: function (type) { return BL.venues ? BL.venues.svg(type) : ""; }, acc: (BL.venues && BL.venues.ACC) || {} };
})(typeof globalThis !== "undefined" ? globalThis : this);
