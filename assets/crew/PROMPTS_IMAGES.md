# Prompts d'images — équipe de BLACKLINE

Ces prompts sont à coller dans un générateur d'images de ton choix (ils ne sont pas exécutés par le jeu : aucun appel réseau).
Les illustrations intégrées au jeu sont des **dessins SVG provisoires** ; ce dossier décrit comment les remplacer par de vraies illustrations.

## Formats à produire (3 par personnage)

| Variante | Ratio | Taille conseillée | Usage | Cadrage |
|---|---|---|---|---|
| `card` | 6:7 | 480×560 | cartes de l'équipe, comparaison, événements | buste, visage dans le tiers supérieur |
| `thumb` | 1:1 | 192×192 | miniatures de la fiche, pastilles | visage centré, épaules coupées |
| `full` | 2:3 | 1024×1536 | grande illustration de la fiche personnage | personnage de 3/4, sujet décalé vers la gauche, ville à droite |

Règles : **aucun texte** dans l'image (le titre, le nom et la citation sont ajoutés par le jeu), pas de cadre ni de bordure, fond sombre cohérent (le jeu dessine ses propres cadres de rareté), webp/jpg/png.
Nommer les fichiers `<id>_card.webp`, `<id>_thumb.webp`, `<id>_full.webp`, les déposer dans `assets/crew/` puis les déclarer dans `manifest.js`.
Génère d'abord le `full`, puis recadre-le (ou régénère-le) en `card` et `thumb` pour garder le même visage.

## Bloc de style commun (à coller au début de chaque prompt)

> Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Éclairage de nuit chaud (orange ambré) venant d'un côté et violet/bleu nuit de l'autre, lumière de rebord (rim light) sur les épaules et le visage, skyline de ville illuminée en arrière-plan avec fenêtres allumées et enseignes néon floues (bokeh). Palette : noirs profonds, violets, ambre, touches d'or. Ambiance : gangsters, luxe discret, élégance dangereuse. Détails soignés : tissu, bijoux, montre, fumée légère. Même direction artistique, même éclairage et même niveau de détail pour tous les personnages de l'équipe.

## Négatifs communs

> texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur

## Personnages

### Gino Ferrara — « Le Comptable » (`gino`)
- **Personnage** : Gestionnaire, 61 ans, rondeur bienveillante, cheveux gris courts, petites lunettes rondes cerclées d'or, moustache grise, costume à fines rayures gris anthracite, chemise blanche, cravate bordeaux, visière de comptable verte relevée sur le front.
- **Pose / action** : Assis à un bureau de bois sombre couvert de registres et d'une machine à calculer ancienne, lampe de banquier verte, pile de reçus, stylo plume ; regard rusé et doux ; fenêtre derrière lui sur la ville la nuit.
- **Décor** : Bureau d'un petit cabinet comptable, stores vénitiens laissant passer des bandes de lumière ambrée.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Gestionnaire, 61 ans, rondeur bienveillante, cheveux gris courts, petites lunettes rondes cerclées d'or, moustache grise, costume à fines rayures gris anthracite, chemise blanche, cravate bordeaux, visière de comptable verte relevée sur le front. Assis à un bureau de bois sombre couvert de registres et d'une machine à calculer ancienne, lampe de banquier verte, pile de reçus, stylo plume ; regard rusé et doux ; fenêtre derrière lui sur la ville la nuit. Décor : Bureau d'un petit cabinet comptable, stores vénitiens laissant passer des bandes de lumière ambrée. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `gino_full.webp` (2:3), `gino_card.webp` (6:7), `gino_thumb.webp` (1:1)

### Maya Okafor — « Soie » (`maya`)
- **Personnage** : Négociatrice, 34 ans, peau brune, carré noir brillant, lèvres rouge profond, étole de fourrure blanche sur une robe noire, perles, boucles d'oreilles, long fume-cigarette.
- **Pose / action** : Debout de trois quarts, sourire en coin sûr d'elle, une main tenant le fume-cigarette avec une fumée légère, l'autre sur un verre de champagne.
- **Décor** : Rooftop de club, néons roses et cyan en bokeh, skyline en arrière-plan.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Négociatrice, 34 ans, peau brune, carré noir brillant, lèvres rouge profond, étole de fourrure blanche sur une robe noire, perles, boucles d'oreilles, long fume-cigarette. Debout de trois quarts, sourire en coin sûr d'elle, une main tenant le fume-cigarette avec une fumée légère, l'autre sur un verre de champagne. Décor : Rooftop de club, néons roses et cyan en bokeh, skyline en arrière-plan. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `maya_full.webp` (2:3), `maya_card.webp` (6:7), `maya_thumb.webp` (1:1)

### Rocco Moretti — « Brique » (`rocco`)
- **Personnage** : Protecteur, 45 ans, crâne rasé, carrure massive, barbe fournie, cicatrice sur la pommette, boucle d'oreille, tatouage dépassant du col, veste de cuir noire sur chemise sombre, bandage aux articulations.
- **Pose / action** : Bras croisés, regard fixe et calme, légèrement de profil, présence imposante ; ambiance de porte fermée.
- **Décor** : Mur de briques rouges, ruelle derrière un club, lueur orange d'un lampadaire.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Protecteur, 45 ans, crâne rasé, carrure massive, barbe fournie, cicatrice sur la pommette, boucle d'oreille, tatouage dépassant du col, veste de cuir noire sur chemise sombre, bandage aux articulations. Bras croisés, regard fixe et calme, légèrement de profil, présence imposante ; ambiance de porte fermée. Décor : Mur de briques rouges, ruelle derrière un club, lueur orange d'un lampadaire. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `rocco_full.webp` (2:3), `rocco_card.webp` (6:7), `rocco_thumb.webp` (1:1)

### Inès Marchand — « La Plume » (`ines`)
- **Personnage** : Financière, 38 ans, peau claire, longs cheveux roux cuivré, lunettes rondes dorées, lèvres rouge sombre, tailleur-gilet vert profond, cravate bordeaux fine, collier doré.
- **Pose / action** : Signe un document d'une main avec un stylo plume tout en comptant des liasses de l'autre ; sourire discret ; dossiers de sociétés écrans empilés.
- **Décor** : Bureau en étage élevé, baie vitrée sur les tours de la finance, lumière dorée.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Financière, 38 ans, peau claire, longs cheveux roux cuivré, lunettes rondes dorées, lèvres rouge sombre, tailleur-gilet vert profond, cravate bordeaux fine, collier doré. Signe un document d'une main avec un stylo plume tout en comptant des liasses de l'autre ; sourire discret ; dossiers de sociétés écrans empilés. Décor : Bureau en étage élevé, baie vitrée sur les tours de la finance, lumière dorée. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `ines_full.webp` (2:3), `ines_card.webp` (6:7), `ines_thumb.webp` (1:1)

### Théo Valdès — « Échec » (`theo`)
- **Personnage** : Stratège, 41 ans, peau mate, cheveux bouclés courts sous une casquette plate grise, moustache, gilet violet sur chemise claire, cravate claire, cure-dent aux lèvres.
- **Pose / action** : Penché sur un échiquier en cours de partie, un pion noir entre les doigts, regard calculateur ; plan de la ville punaisé derrière.
- **Décor** : Salon de jeu, sol en damier, éclairage violet profond.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Stratège, 41 ans, peau mate, cheveux bouclés courts sous une casquette plate grise, moustache, gilet violet sur chemise claire, cravate claire, cure-dent aux lèvres. Penché sur un échiquier en cours de partie, un pion noir entre les doigts, regard calculateur ; plan de la ville punaisé derrière. Décor : Salon de jeu, sol en damier, éclairage violet profond. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `theo_full.webp` (2:3), `theo_card.webp` (6:7), `theo_thumb.webp` (1:1)

### Samira Haddad — « Colombe » (`samira`)
- **Personnage** : Diplomate, 36 ans, peau cuivrée, longs cheveux noirs, trench beige ceinturé, foulard bleu-vert, boucles d'oreilles, lèvres bordeaux.
- **Pose / action** : Poignée de main courtoise en bord de cadre, une colombe blanche posée sur la rambarde derrière elle ; sourire chaleureux mais insondable.
- **Décor** : Terrasse sous des arcades en pierre, lanternes dorées, ciel vert-bleu de crépuscule.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Diplomate, 36 ans, peau cuivrée, longs cheveux noirs, trench beige ceinturé, foulard bleu-vert, boucles d'oreilles, lèvres bordeaux. Poignée de main courtoise en bord de cadre, une colombe blanche posée sur la rambarde derrière elle ; sourire chaleureux mais insondable. Décor : Terrasse sous des arcades en pierre, lanternes dorées, ciel vert-bleu de crépuscule. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `samira_full.webp` (2:3), `samira_card.webp` (6:7), `samira_thumb.webp` (1:1)

### Colette Dubreuil — « Madame Blanche » (`colette`)
- **Personnage** : Gestionnaire, 67 ans, élégante, cheveux argentés en chignon, chapeau pilulier noir, lunettes rondes sombres, étole de fourrure blanche, collier de perles, lèvres rouges.
- **Pose / action** : Tient un agenda relié et un téléphone ancien, regard sévère et précis, posture droite ; tout est en ordre autour d'elle.
- **Décor** : Pluie fine sur une vitre, reflets froids bleu-gris avec un point chaud ambré.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Gestionnaire, 67 ans, élégante, cheveux argentés en chignon, chapeau pilulier noir, lunettes rondes sombres, étole de fourrure blanche, collier de perles, lèvres rouges. Tient un agenda relié et un téléphone ancien, regard sévère et précis, posture droite ; tout est en ordre autour d'elle. Décor : Pluie fine sur une vitre, reflets froids bleu-gris avec un point chaud ambré. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `colette_full.webp` (2:3), `colette_card.webp` (6:7), `colette_thumb.webp` (1:1)

### Karim Benali — « Le Prince » (`karim`)
- **Personnage** : Négociateur, 43 ans, peau hâlée, cheveux noirs gominés, barbe courte soignée, costume bleu nuit à fines rayures, cravate dorée, pochette, chaîne en or, boucle d'oreille.
- **Pose / action** : Sourire charmeur, une main ouverte comme pour proposer un accord, une enveloppe épaisse dans l'autre ; mouvement élégant.
- **Décor** : Salle de réception luxueuse, lumières dorées en bokeh, reflets sur le marbre.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Négociateur, 43 ans, peau hâlée, cheveux noirs gominés, barbe courte soignée, costume bleu nuit à fines rayures, cravate dorée, pochette, chaîne en or, boucle d'oreille. Sourire charmeur, une main ouverte comme pour proposer un accord, une enveloppe épaisse dans l'autre ; mouvement élégant. Décor : Salle de réception luxueuse, lumières dorées en bokeh, reflets sur le marbre. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `karim_full.webp` (2:3), `karim_card.webp` (6:7), `karim_thumb.webp` (1:1)

### Nadia Volkova — « Faucon » (`nadia`)
- **Personnage** : Protectrice, 31 ans, peau brune, tresses longues sous un bonnet noir, lunettes de soleil sombres, oreillette, veste de cuir noire, regard vigilant.
- **Pose / action** : Postée près d'une fenêtre, légèrement tournée comme si elle surveillait la rue, silhouette tendue et précise.
- **Décor** : Docks de nuit, grues et conteneurs, lumière rouge de sécurité.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Protectrice, 31 ans, peau brune, tresses longues sous un bonnet noir, lunettes de soleil sombres, oreillette, veste de cuir noire, regard vigilant. Postée près d'une fenêtre, légèrement tournée comme si elle surveillait la rue, silhouette tendue et précise. Décor : Docks de nuit, grues et conteneurs, lumière rouge de sécurité. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `nadia_full.webp` (2:3), `nadia_card.webp` (6:7), `nadia_thumb.webp` (1:1)

### Sébastien Roche — « Le Notaire » (`sebastien`)
- **Personnage** : Financier, 69 ans, visage allongé, cheveux argentés, bouc, monocle doré, costume anthracite avec gilet or et cravate bordeaux, cigare éteint.
- **Pose / action** : Assis dans un fauteuil de cuir, une main posée sur un acte scellé, expression patiente ; plume et encrier.
- **Décor** : Bibliothèque de notaire, murs de livres reliés, lampe dorée.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Financier, 69 ans, visage allongé, cheveux argentés, bouc, monocle doré, costume anthracite avec gilet or et cravate bordeaux, cigare éteint. Assis dans un fauteuil de cuir, une main posée sur un acte scellé, expression patiente ; plume et encrier. Décor : Bibliothèque de notaire, murs de livres reliés, lampe dorée. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `sebastien_full.webp` (2:3), `sebastien_card.webp` (6:7), `sebastien_thumb.webp` (1:1)

### Éléonore Vasseur — « L'Ombre » (`eleonore`)
- **Personnage** : Stratège, 52 ans, peau pâle, longs cheveux noir violacé, chapeau trilby sombre au ruban bordeaux, trench noir, lèvres rouges, cigarette fine, regard glacé.
- **Pose / action** : À moitié dans l'ombre, visage éclairé d'un seul côté, fumée qui s'enroule, silhouette de film noir.
- **Décor** : Rue sous la pluie, néons violets flous, reflets sur l'asphalte mouillé.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Stratège, 52 ans, peau pâle, longs cheveux noir violacé, chapeau trilby sombre au ruban bordeaux, trench noir, lèvres rouges, cigarette fine, regard glacé. À moitié dans l'ombre, visage éclairé d'un seul côté, fumée qui s'enroule, silhouette de film noir. Décor : Rue sous la pluie, néons violets flous, reflets sur l'asphalte mouillé. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `eleonore_full.webp` (2:3), `eleonore_card.webp` (6:7), `eleonore_thumb.webp` (1:1)

### Alessandro Valenti — « Le Maître » (`valenti`)
- **Personnage** : Diplomate, 63 ans, cheveux argentés, moustache, lunettes rondes dorées, panama clair au ruban noir, costume crème, gilet, cravate prune, rose à la boutonnière.
- **Pose / action** : Debout, assurance tranquille, bague en or, une main tendue comme pour sceller un pacte historique.
- **Décor** : Terrasse d'un palace au coucher du soleil, rayons dorés, skyline orangée.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Diplomate, 63 ans, cheveux argentés, moustache, lunettes rondes dorées, panama clair au ruban noir, costume crème, gilet, cravate prune, rose à la boutonnière. Debout, assurance tranquille, bague en or, une main tendue comme pour sceller un pacte historique. Décor : Terrasse d'un palace au coucher du soleil, rayons dorés, skyline orangée. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `valenti_full.webp` (2:3), `valenti_card.webp` (6:7), `valenti_thumb.webp` (1:1)

### Tom Guiri — « Le Cartographe » (`tom`)
- **Personnage** : Stratège, 40 ans, peau mate, coiffure en banane brune, barbe de trois jours, cicatrice, trilby gris au ruban doré, trench bleu nuit, cigarette.
- **Pose / action** : Déplie une grande carte de la ville annotée de routes de fuite, boussole à la main, regard concentré.
- **Décor** : Toit d'immeuble de nuit, grille de lumières de la ville en bleu, hélicoptère lointain.
- **Prompt prêt à coller** : « Illustration numérique semi-réaliste façon affiche de jeu mobile, contours nets, peinture lisse avec ombrages doux, grain léger. Stratège, 40 ans, peau mate, coiffure en banane brune, barbe de trois jours, cicatrice, trilby gris au ruban doré, trench bleu nuit, cigarette. Déplie une grande carte de la ville annotée de routes de fuite, boussole à la main, regard concentré. Décor : Toit d'immeuble de nuit, grille de lumières de la ville en bleu, hélicoptère lointain. Cadrage : personnage de 3/4, format 2:3, sujet à gauche, skyline de nuit à droite. Aucun texte. »
- **Négatifs** : texte, lettres, logo, filigrane, signature, interface, cadre, bordure, mains déformées, doigts en trop, yeux asymétriques, visage flou, style cartoon enfantin, photo réaliste brute, sur-saturation, plusieurs personnages (sauf animal mentionné), armes pointées vers le spectateur
- **Fichiers** : `tom_full.webp` (2:3), `tom_card.webp` (6:7), `tom_thumb.webp` (1:1)

## Cohérence entre personnages
- Même éclairage (ambré d'un côté, violet de l'autre), même grain, même épaisseur de contour, même skyline de nuit.
- Garder la même position de la ligne d'horizon (≈ 35 % depuis le haut) pour que les miniatures s'alignent visuellement.
- Chaque personnage garde sa couleur d'accent (voir `accent` dans `js/data-crew.js`) comme touche de lumière secondaire.
- Vérifier la licence du générateur utilisé et la noter dans `README.txt` avant de publier.
