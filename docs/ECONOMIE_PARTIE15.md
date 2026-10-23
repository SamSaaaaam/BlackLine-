# Économie · Partie 15 : démolition des parcs et des places

## Règle
Les parcs (arbres) et les places (fontaines) de la ville d'origine peuvent être démolis, en argent du jeu (jamais en lingots), depuis leur fiche sur la carte (clic, ou clavier : Tab jusqu'au bouton « Détruire »). Une confirmation en deux temps est demandée : le premier appui affiche « Détruire ce parc ? Il sera remplacé par un terrain libre. Définitif. » et le coût, un bouton « Annuler » reste disponible, rien n'est payé avant le second appui.

Une démolition libère **un terrain constructible de plus** dans le quartier du décor. Ce terrain suit exactement les règles des autres terrains de quartier (`js/dbuild.js`) : quartier contrôlé, niveau de contrôle requis par le bâtiment, un même bâtiment une seule fois par quartier, prix indexé sur les revenus.

## Coût
`coût = max(60 000 ; revenu de base × 900 s) × (1 + 0,6 × nombre de démolitions déjà faites)`

- Revenu de base × 900 s : un quart d'heure de revenus. Le coût suit la progression, comme le prix des bâtiments de quartier.
- Plancher 60 000 $ pour ne pas être gratuit au début.
- +60 % par démolition déjà faite : 1re = ×1, 2e = ×1,6, 3e = ×2,2 … 8e = ×5,2.

## Limites
- 2 démolitions par quartier, 8 au total (paramètres `RZ` dans `dbuild.js`).
- Un quartier non contrôlé ne peut pas être démoli.
- Jamais de retour en arrière après paiement.

## Effet sur les revenus
Chaque terrain supplémentaire n'ajoute pas de revenu en soi : il permet de poser un bâtiment de quartier de plus (un type différent, un par type et par quartier). Le total des bonus de bâtiments de quartier reste plafonné par `incCap = 0,9` (+90 %), inchangé. Le plafond empêche donc tout emballement ; l'effet réel est de rapprocher le joueur de ce plafond plus tôt, au prix d'une dépense importante (voir le coût ci-dessus) qui retarde d'autant ses autres achats.

Mesure : `AUDIT=1 node tests/simulate.js` (la simulation ne démolit rien : les bots ne connaissent pas la démolition, donc les durées de progression d'une partie normale sont **inchangées**). Les chiffres sont reportés dans le CHANGELOG.

## Sauvegarde
- Nouveau champ `razed` (liste de chaînes `quartier:numéroDeCellule`), sauvegarde **v13** ; migration 12 → 13 qui ne fait que passer la version (le champ est créé vide par `sanitize`).
- Nettoyage strict à la lecture : tableau obligatoire, 12 entrées maximum lues, forme `^[a-z_]{1,24}:\d{1,5}$`, doublons retirés, quartier connu, cellule réellement parc/place du quartier (quand la carte est chargée), 2 par quartier, 8 au total.
- Les terrains libérés ne sont pas sauvegardés : ils sont recalculés depuis `razed` (numéro de terrain = nombre de terrains de base + rang de la démolition dans le quartier), ce qui garde les bâtiments déjà construits dessus.
- Tests : `tests/raze.test.js` (logique, valeurs hostiles, ancienne sauvegarde v12, aller-retour, bâtiment sur terrain libéré) et `tests/raze-browser.test.js` (3 largeurs : fiche, confirmation, annulation, paiement, +1 terrain, sauvegarde, rechargement, argent insuffisant côté logique).
