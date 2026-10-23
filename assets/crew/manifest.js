/* Portraits en image (optionnel). Chaque personnage peut avoir jusqu'à 3 images (voir PROMPTS_IMAGES.md) :
     card  : 6:7  (ex. 480×560)  — cartes de l'équipe, comparaison, événements
     thumb : 1:1  (ex. 192×192)  — rangée de miniatures de la fiche, petites pastilles (visage centré)
     full  : 2:3  (ex. 1024×1536) — grande illustration de la fiche personnage
   Formats acceptés : webp, jpg, png. Aucun texte dans l'image. Une variante absente retombe sur une autre variante du même personnage,
   puis sur le dessin SVG intégré (provisoire) : rien ne casse et aucune requête réseau inutile n'est faite.
   Écriture : soit un seul nom de fichier (utilisé partout), soit un objet :
     gino: { card: "gino_card.webp", thumb: "gino_thumb.webp", full: "gino_full.webp" },
   Cadrage des images recadrées : focus: { gino: "xMidYMin" }  (xMidYMid, xMidYMin, xMinYMin, xMaxYMin…).
   Ids : gino, maya, rocco, ines, theo, samira, colette, karim, nadia, sebastien, eleonore, valenti, tom.
   N'utilise que des images dont tu possèdes les droits (créées par toi, générées avec une licence qui l'autorise, ou libres) ; indique la source dans README.txt. */
(function (root) { var BL = root.BL = root.BL || {}; BL.crewImages = {
  /* gino: { card: "gino_card.webp", thumb: "gino_thumb.webp", full: "gino_full.webp" }, */
  focus: {}
}; })(typeof globalThis !== "undefined" ? globalThis : this);
