Portraits d'équipiers en image (optionnel)
==========================================
Sans image, le jeu dessine des portraits vectoriels de repli (js/portraits.js). Le rendu « affiche peinte »
ne peut venir que des illustrations que TU déposes ici : le jeu ne génère aucune image et ne télécharge rien.

Procédure (pour chaque personnage)
1. Ouvre PROMPTS_IMAGES.md, copie le « Prompt prêt à coller » et les « Négatifs » du personnage dans ton générateur d'images.
2. Génère d'abord la grande illustration « full » (format 2:3, par exemple 1024×1536).
3. Fais ensuite « card » (6:7, par exemple 480×560) et « thumb » (1:1, par exemple 192×192) à partir du MÊME visage :
   recadre l'image full (buste pour card, visage seul pour thumb), ou régénère avec la même graine / la même référence.
4. Vérifie qu'il n'y a AUCUN texte, logo, signature, nom d'entreprise ou nom de ville réel dans l'image.
5. Enregistre en .webp (ou .jpg / .png) avec ces noms EXACTS, en minuscules :
     <id>_full.webp   <id>_card.webp   <id>_thumb.webp
   ids : gino, maya, rocco, ines, theo, samira, colette, karim, nadia, sebastien, eleonore, valenti, tom
6. Dépose les fichiers dans ce dossier (assets/crew/).
7. Déclare-les dans manifest.js, par exemple :
     gino: { full: "gino_full.webp", card: "gino_card.webp", thumb: "gino_thumb.webp" },
   (cadrage facultatif : focus: { gino: "xMidYMin" } garde le haut de l'image, donc le visage)
8. Note ci-dessous la source et la licence de chaque image.
9. Vérifie : node tests/crew-images.test.js (chaque image déclarée doit exister, casse comprise ; une variante
   absente retombe sur une autre variante du même personnage, puis sur le dessin vectoriel).
Attention à la casse : sur le site en ligne, « Gino_Full.webp » n'est PAS « gino_full.webp ».

N'utilise que des images dont tu as les droits (créées par toi, générées avec une licence qui l'autorise, ou libres).

Source / licence de chaque image ajoutée (à remplir) :
  (aucune pour l'instant)
