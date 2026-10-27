# Journal des modifications — BLACKLINE

> Ce fichier n'existait pas dans le dépôt GitHub (ni `CLAUDE.md`, ni le dossier `tests/`) : seuls les fichiers du jeu y avaient été envoyés.
> Il commence donc à la Partie 17. Si tu as un `CHANGELOG.md` plus ancien sur ton ordinateur, colle cette section en tête du tien.
> Les tests cités ci-dessous ont été **réécrits** dans `tests/` (l'ancien `tests/simulate.js` et l'ancien `tests/pages-ready.test.js` n'étaient pas disponibles).

## Partie 19 — achat rapide, navigation, « À faire maintenant », nombres lisibles, défis, fin de partie

Sauvegarde : **v14 → v15** (bloc E, défis et série). Migration 14 → 15 : rien n'est supprimé ; les nouveaux champs (`dfs`, compteur `works.n`) prennent leur valeur par défaut.
Les blocs A à D ne changent pas la sauvegarde, sauf un réglage (`settings.buyqty`, « 1 » par défaut, valeur hostile → « 1 »). Le bloc F ajoute des identifiants (activités, quartiers, types de bâtiments) : absents d'une ancienne sauvegarde, ils prennent leur valeur par défaut ; inconnus, ils sont ignorés.
Économie : `AUDIT=1 node tests/simulate.js` (sortie complète : `docs/ECONOMIE_PARTIE19.md`). Les blocs A à E ne la changent pas : sortie identique à `docs/ECONOMIE_PARTIE17.md` avant le bloc F (vérifié par `diff`).
`CLAUDE.md` n'existe pas dans le dépôt (ni avant, ni après) : les règles suivies sont celles de ta demande.

### 0. Vérification de la Partie 17 avec une vraie sauvegarde v13

- Une vraie sauvegarde v13 a été produite en jouant le commit 841878f dans Chromium (`tests/_seed.js`) : 5 activités, 3 équipiers, Centre-ville contrôlé.
- `tests/seed-migration.test.js` : migration v13 → actuelle sans perte (niveaux, argent, équipe, quartiers, missions, lingots, QG), chantiers et mini-jeux vides, aller-retour identique, valeurs hostiles injectées dans la vraie sauvegarde.
- `tests/p17-check-browser.test.js` : menu (JOUER visible à 320 × 568, colonne sans barre de défilement visible), classement d'accueil, fiche personnage, chantier, les 5 mini-jeux joués au clavier, mouvements réduits.
- Seul défaut trouvé : les tests navigateur réécrivaient les captures validées de `shots/`. Elles ne sont écrites dans `shots/` qu'avec `SHOTS=1` (sinon dossier temporaire).

### A. Achat rapide (×1 / ×10 / ×25 / Max)

- `js/buy.js` (nouveau) et `js/works.js` (`canOrder`) : le prix affiché est la **somme exacte** des niveaux achetés, la durée des travaux la somme des chantiers niveau par niveau ; au-delà de 24 h de travaux la quantité est réduite ; « Max » = le plus de niveaux payables, jusqu'au niveau 100.
- Barre au-dessus des activités : ×1 / ×10 / ×25 / Max (groupe radio au clavier) et le **meilleur achat maintenant** (coût / gain le plus bas parmi ce qui est payable ; sinon « Rien d'abordable — prochain achat dans N min »). Boutons : « Améliorer ×k · $X », « +$Y/s » ou « Il te manque $Z ». Même sélecteur dans le panneau de la carte.
- Correction au passage : l'animation `.pulse` laissait un débordement horizontal permanent (agrandissement conservé en fin d'animation).
- Tests : `tests/buy.test.js` (29), `tests/buy-browser.test.js` (39).

### B. Navigation en 4 groupes

- `js/nav.js` : **Empire** (Tableau de bord, Empire, Améliorations, Objectifs), **Terrain** (Carte, Opérations, Territoires), **Équipe** (Équipiers, Arsenal), **Plus** (QG, Boutique, Box, Radio, Histoire, Classement, Glossaire). Mêmes vues qu'avant, mêmes identifiants.
- Pastilles chiffrées sur les groupes (récompense à réclamer, ouvrier libre, opération prête, quartier attaqué ou à prendre, recrue possible, chapitre prêt, coffre plein).
- Tests : `tests/nav.test.js` (6), `tests/nav-browser.test.js` (75 : chaque vue atteinte en 2 clics au plus sur ordinateur, 3 sur téléphone).

### C. « À faire maintenant »

- `js/todo.js` + `js/todo-ui.js` : 3 actions au plus, textes de 60 caractères au plus, chacune mène à sa vue ; carte en haut du Tableau de bord et rappel dans l'objectif du haut. Ordre : récompense → ouvrier libre → achat → opération / braquage → défi presque fini → attaque → chaleur ≥ 60 → événement. État vide : « Rien d'urgent. Profite de la ville. »
- Lecture seule : vérifié sur 500 états que `todo.next` ne modifie jamais la partie.
- Tests : `tests/todo.test.js` (10), `tests/todo-browser.test.js` (36).

### D. Nombres lisibles

- `js/fmt.js` : un seul formateur, 3 chiffres significatifs (4 en mode « détaillé »), suffixes K, M, Md, Bn, Bd, Tn, Td, signe « − », « — » pour une valeur impossible. Les affichages faits à la main (QG, salle, infobulles, journal, explications, mini-jeux) passent par lui. Chiffres à chasse fixe. Entrée de glossaire « suffixes ».
- Test : `tests/fmt.test.js` (47, dont la recherche des formatages faits à la main restants).

### E. Défis enrichis, série, titres (sauvegarde v15)

- 7 nouveaux modèles de défis (braquage, visites de quartiers, chaleur basse, équipe, chantiers, mini-jeux, revenus) ; un défi impossible pour la partie en cours n'est jamais tiré.
- Série de jours (un jour de pardon par semaine, heure de Paris), 8 titres (Régulier, Assidu, Inébranlable, Pilier de la ville, Chasseur de défis, Collectionneur, Semaine parfaite, Arpenteur), récapitulatif du lundi. Récompenses en lingots **inchangées** (aucun nouveau gain de lingots ; jamais d'accélération achetée).
- Tests : `tests/challenges.test.js` (44, fuseau Europe/Paris, horloge reculée, valeurs hostiles), `tests/challenges-browser.test.js` (27).

### F. Fin de partie : 3 activités, 5 bâtiments de quartier, la rive sud (3 quartiers)

Tout est fictif (aucun lieu, entreprise ou marque réels).

**Activités (5 → 8)**, chacune avec ses 2 améliorations, une illustration de carte, un dessin sur la carte de la ville (15 paliers de design), un emblème, une mission et une entrée de glossaire :

| Activité | Débloquée par | Prix de base | Revenu de base | Croissance | Entretien | Améliorations | Chaleur |
|---|---|---|---|---|---|---|---|
| Fret des Brumes (trafic maritime) | Holding niv. 20 **et** empire niv. 51 | 40 Md | 90 K/s | 1,18 | 16 % | Grues de nuit, Pilotes du port | +0,25 |
| Banque Aubépine (finance de façade) | Fret niv. 10 **et** empire niv. 56 | 2,4 Bn | 400 K/s | 1,19 | 16 % | Coffres numérotés, Virements en cascade | −0,20 |
| Vigilance Sentinelle (sécurité privée) | Banque niv. 10 **et** empire niv. 62 | 160 Bn | 3 M/s | 1,20 | 17 % | Rondes de nuit, Contrats municipaux | −0,15 |

- Nouvelle condition `unlock.emp` (niveau d'empire), affichée en clair partout (carte d'activité, panneau de la carte, objectif du haut, bilan).
- Chantiers : plus lents (×3,2 / ×3,5 / ×3,8) **et** démarrant comme un bâtiment déjà avancé (niveau + 32 / 38 / 44) ; toujours 24 h au plus par chantier.
- Missions m18 à m20 (montants fixes), succès a25 « Empire complet » (8 activités), a26 « Port-Mirage entière » (11 quartiers), a27 « Armateur ». Le succès a8 garde son sens : « les cinq premières activités ».

**Bâtiments de quartier (12 → 17)**, dessinés sur la carte et dans les fiches (même description pour les deux) : Atelier de faux papiers (Illégal), Ponton de contrebande (Illégal), Bureau de change (Légal), Hôtel de passage (Légal, efface de la chaleur), Caserne de vigiles (Défense, +25 % de défense). Les anciens quartiers gardent leurs affinités.

**Quartiers (8 → 11), la rive sud** : Marina des Brumes (voisine du Port ; Les Corbeaux ; niveau 52, influence 140, Fret niv. 5), Zone franche des Saules (voisine de l'Industriel ; Consortium Meridian ; niveau 58, influence 180, Banque niv. 5), Faubourg des Lanternes (voisin de la Vieille ville ; Maison Valcourt ; niveau 64, influence 230, Vigilance niv. 5). Chacun : bonus, 2 améliorations, défense, rival, boss de guerre (Ilse Marrow, Monsieur Quade, Mère Lanterne), architecture et ambiance sonore de son voisin.

- Carte de la ville : 13 → 18 rangées (QG agrandi au sud pour les terrains des nouvelles activités, puis la rive sud). Le nombre de colonnes ne change pas : le numéro de cellule `r × 12 + c` sauvegardé par les démolitions reste valable. **Les terrains des 5 premières activités et les emplacements des 8 anciens quartiers sont sur les mêmes cellules qu'avant** (vérifié par test).
- Carte Territoires : 800 × 520 → 800 × 640, la baie borde la rive sud.
- Les factions ne comptent un quartier de la rive sud qu'une fois son niveau d'empire atteint : sur une partie en cours, puissance des factions et fronts des rivaux sont inchangés.
- Revenus extrêmes : partie « anciennes activités au niveau 100, nouvelles 60 / 45 / 30, 11 quartiers au contrôle 5 » = 9,5 × 10¹⁰ $/s, sous le plafond de plausibilité du classement (2 × 10¹¹ $/s, aussi dans le SQL). Seul le cas théorique « tout au niveau 100 » le dépasse (1,3 × 10¹² $/s) ; il demanderait des sommes de l'ordre de 10²⁰ $.

**Économie : mesures avant / après** (`AUDIT=1 node tests/simulate.js`, joueur simulé « chantiers, sans aide » ; avant = commit 7e6e78d, après = ce commit).

- 24 premières heures : **sortie identique** ligne pour ligne (progression, hors-ligne, profil réaliste, paliers, chantiers des 5 premières activités, mini-jeux). Les nouvelles activités ne s'ouvrent qu'après le niveau 50.
- Réglage cherché par mesures successives : une première version (ouverture au niveau 10 de la Holding, sans niveau d'empire) faisait passer le revenu à 24 h de 128 M/s à 575 M/s et le niveau 55 à 24 h ; une version trop chère n'était jamais achetée par le joueur simulé en 200 h (contenu mort). Version retenue :

| Temps de jeu actif | Avant : niveau · revenu · total | Après : niveau · revenu · total | Après : Fret / Banque / Vigilance |
|---|---|---|---|
| 24 h | 50 · 128,15 M/s · 5,99 T | 50 · 128,15 M/s · 5,99 T | 0 / 0 / 0 |
| 36 h | 52 · 166,46 M/s · 12,23 T | 52 · 166,46 M/s · 12,23 T | 0 / 0 / 0 |
| 48 h | 55 · 211,59 M/s · 19,98 T | 55 · 211,59 M/s · 19,98 T | 0 / 0 / 0 |
| 72 h | 60 · 262,74 M/s · 40,09 T | 60 · 260,60 M/s · 40,06 T | 2 / 0 / 0 |
| 120 h | 66 · 332,01 M/s · 92,08 T | 66 · 336,16 M/s · 91,97 T | 5 / 0 / 0 |
| 168 h | 70 · 382,71 M/s · 154,82 T | 70 · 426,03 M/s · 157,84 T | 14 / 4 / 0 |
| 200 h | 72 · 444,74 M/s · 203,17 T | 72 · 521,11 M/s · 212,80 T | 19 / 9 / 0 |

| Palier existant | Avant | Après |
|---|---|---|
| backroom 10 / 25, freight 10 / 25, fence 10 / 25, estate 10, holding 10 | 8 min / 1 h 02, 24 min / 1 h 44, 1 h 08 / 12 h 29, 1 h 55, 3 h 11 | identiques |
| niveau d'empire 50 / 51 / 52 / 53 | 3 h 50 / 32 h 20 / 34 h 50 / 37 h 50 | identiques |
| niveau d'empire 55 / 58 / 60 | 44 h 40 / 56 h 40 / 67 h 00 | identiques |
| niveau d'empire 65 | 102 h 40 | 103 h 00 (+20 min) |
| niveau d'empire 70 | 160 h 40 | 159 h 30 (**−1 h 10, −0,7 %**) |

Honnêtement : aucun palier existant n'est atteint plus tôt jusqu'au niveau 65 ; le niveau 70 l'est de 1 h 10 sur 160 h (mesures prises toutes les 10 min). Au-delà de 200 h, les nouvelles activités continuent d'ajouter du revenu (c'est leur rôle) : les niveaux 75 à 100 viendront plus tôt qu'avant.

**Temps cumulés des nouvelles activités** (bâtiment principal, un ouvrier dessus en continu) :

| Activité | Aides | niv. 5 | 10 | 25 | 50 | 100 |
|---|---|---|---|---|---|---|
| Fret des Brumes | sans mini-jeu | 4 h 15 | 10 h 52 | 52 h 41 | 266 h 31 | 1391 h 24 |
| Fret des Brumes | Contremaître + pots-de-vin | 1 h 23 | 3 h 25 | 14 h 26 | 52 h 49 | 178 h 58 |
| Banque Aubépine | sans mini-jeu | 7 h 49 | 18 h 56 | 87 h 07 | 390 h 52 | 1578 h 21 |
| Banque Aubépine | Contremaître + pots-de-vin | 2 h 21 | 5 h 28 | 21 h 06 | 67 h 33 | 197 h 01 |
| Vigilance Sentinelle | sans mini-jeu | 12 h 55 | 31 h 12 | 133 h 34 | 553 h 57 | 1753 h 57 |
| Vigilance Sentinelle | Contremaître + pots-de-vin | 3 h 31 | 8 h 03 | 28 h 27 | 83 h 06 | 213 h 11 |

Durée d'un chantier (bâtiment principal) : Fret 42 min au niveau 1, 1 h 32 au niveau 10, 5 h 47 au niveau 30, 24 h dès le niveau ≈ 75 ; Banque 1 h 20 → 24 h ; Vigilance 2 h 14 → 24 h (tableau complet : `docs/ECONOMIE_PARTIE19.md`).

**Rendu de la carte** (Chromium sans carte graphique, même sauvegarde de fin de partie, 3 passages de 3 s, durée des rappels `requestAnimationFrame` dessin compris) :

| Largeur | Avant (immobile · en déplacement) | Après |
|---|---|---|
| 1366 px | 4,54 ms (p95 12,1) · 3,20 ms (p95 8,3) | 5,12 ms (p95 12,8) · 3,39 ms (p95 8,8) |
| 390 px | 3,03 ms (p95 7,5) · 1,89 ms (p95 4,7) | 3,36 ms (p95 7,9) · 2,09 ms (p95 5,2) |

+6 à +13 % par image (3 quartiers et 12 terrains de plus, carte 40 % plus haute). Le protocole de la Partie 16 n'est pas dans le dépôt : celui-ci est décrit dans `tests/endgame-browser.test.js`, qui le mesure à chaque passage (seuil : 60 ms par image).

Tests :
- `tests/endgame.test.js` (89) : données complètes, déblocage (rien avant le niveau d'empire requis, achat et chantier refusés), achats, améliorations, succès ; vraie sauvegarde v13 → nouveaux identifiants à leur valeur par défaut, factions inchangées ; sauvegarde hostile (activité, quartier, type de bâtiment, amélioration, succès, démolition et chantier inconnus ou hors bornes) nettoyée puis aller-retour identique ; conquête des 3 quartiers (négocier, imposer réussi et raté, investir, construire les nouveaux types, défense, 11 quartiers, boss) ; plafond du classement ; carte (anciennes positions inchangées, numéros de cellule, nouveaux terrains, démolition sur la rive sud, routes).
- `tests/endgame-browser.test.js` (54) : 1366 / 390 / 320 px, cartes d'activités (verrouillée au niveau 50 avec la condition écrite, ouvertes en fin de partie), Territoires (11 quartiers, panneau de la Marina), panneau du Ponton sur la carte, menu Bâtiments (5 lieux + 3 activités), aucun défilement horizontal, texte ≥ 12 px, aucune erreur, aucune requête extérieure, coût de rendu.
- `tests/works.test.js` : les contrôles « premier chantier 2 à 10 s » ne visent plus que les 5 premières activités ; les 3 nouvelles ont leurs propres contrôles (premier chantier entre 10 min et 3 h, plafond 24 h, plus lentes que la précédente).

### Captures (`SHOTS=1`, dans `shots/`)

`p19-achat-rapide-*`, `p19-navigation-*`, `p19-a-faire-*`, `p19-defis-*`, `p19-nouvelle-activite-*`, `p19-nouveau-quartier-*`, `p19-nouveau-batiment-*`, chacune à 1366, 390 et 320 px.

### Non vérifié

Vrai serveur Supabase, vrai téléphone, Firefox, Safari ; rendu visuel jugé seulement sur captures ; sons non écoutés (ambiance des quartiers du sud empruntée à leurs voisins) ; le joueur simulé ne prend pas de quartiers ni ne lance d'opérations (ses durées sont relatives, pas absolues).

## Partie 17 — classement d'accueil, gains hors-ligne, illustrations, chantiers, mini-jeux

Sauvegarde : **v13 → v14** (bloc D, chantiers ; bloc E, mini-jeux). Migration 13 → 14 : rien n'est supprimé, les deux nouveaux champs sont vides par défaut.
Toutes les mesures d'économie : `AUDIT=1 node tests/simulate.js` (sortie complète reproduite plus bas, résumée ici).
Suite complète : `node tests/run-all.js`.

### A. Classement visible dès l'accueil (sans bouton)

- Menu principal : panneau **Top 10** (ordinateur, ≥ 1000 px : colonne à droite des boutons, pas plus haute que le menu, défilement interne) ; **Top 5** repliable sous les boutons (téléphone, ouvert par défaut). Onglets « Cette semaine » / « Tout temps », podium or / argent / bronze avec couronne, rang toujours écrit en chiffres.
- États : squelette de chargement, « Classement indisponible pour l'instant » (le menu reste utilisable), « Aucun joueur pour l'instant — sois le premier ». Rafraîchi au plus toutes les 60 s tant que le menu est visible ; cache en mémoire par période.
- Lien « Voir tout · Rejoindre le classement » : ouvre la fenêtre complète existante (inscription, pseudo, signalement). Le bouton « CLASSEMENT » du menu est retiré ; l'entrée « Classement » du jeu reste.
- Panneau absent si `js/config-classement.js` est vide, ou si le réglage est coupé.
- **Changement de règle réseau** : ouvrir le menu contacte maintenant le serveur du classement, **sans compte** : une requête `GET /rest/v1/rpc/lb_board_public?p_scope=week|all`, en-tête `apikey` seulement (pas d'`Authorization`, aucune session anonyme créée, aucune donnée du joueur envoyée), `credentials: "omit"`, sans référent, délai 8 s, repli silencieux. Toujours un seul `fetch` dans tout le jeu (`js/leaderboard.js`). Le serveur voit l'adresse IP du joueur : c'est écrit dans le texte de confidentialité (page Classement), dans `about.html` et dans `docs/supabase-installation.md`.
- Nouveau réglage **Paramètres › Classement en ligne › « Afficher le classement sur l'accueil »** (`settings.lbhome`, oui par défaut, valeur hostile → oui) : coupé, aucun appel n'est fait. Pas de changement de version de sauvegarde pour ce réglage.
- SQL : nouvelle fonction `lb_board_public(p_scope text)` (top 10 : rang, pseudo, score, niveau ; jamais `pub` ni `id`), `security definer`, `set search_path = public`, mêmes filtres que `lb_board` (masqués exclus), exécutable par `anon`. Ajoutée à `docs/supabase.sql` (toujours idempotent) et dans **`docs/supabase-maj-accueil.sql`, à lancer une seule fois** dans Supabase si le gros fichier est déjà installé.
- Correction au passage : le menu principal débordait en haut sur petit écran (à 320 × 568, et même à 1366 × 768, le haut — dont JOUER — était coupé). Le menu défile maintenant verticalement si besoin, et JOUER est visible sans défiler à 320 × 568.
- Tests : `tests/lb-public.test.js` (un seul appel puis cache 60 s, GET, apikey seulement, pannes, horloge, réglage hostile), `tests/lb-home-browser.test.js` (absent si non configuré / réglage coupé, aucun appel quand le menu est masqué, panne réseau, erreur 500, classement vide, pseudo hostile du serveur nettoyé, 3 largeurs sans défilement horizontal, JOUER visible à 320 × 568, texte ≥ 12 px, captures), `tests/pages-ready.test.js` (réécrit : chemins relatifs, casse, polices locales, un seul `fetch`, CSP).

### B. Gains hors-ligne réduits

- `js/data.js` : rendement **50 % → 20 %** des revenus nets, plafond **8 h → 4 h** (au plus ≈ 48 min de revenu actif par absence). `sleepGapSec` (veille, onglet gelé > 5 min) suit exactement les mêmes règles (même fonction `E.offline`).
- Bilan de retour : affiche le vrai pourcentage et le vrai plafond (« 20 % de tes revenus nets, 4 h 00 min au plus ») et la phrase « Reste actif : tes gains hors-ligne sont limités », suivie de « Tes chantiers, eux, avancent à 100 % pendant ton absence ».
- Textes mis à jour : didacticiel (« à moitié » → « 20 %, 4 h au plus »), glossaire.
- Aucune donnée sauvegardée ajoutée. Tests qui supposaient 50 % / 8 h : ils n'étaient pas dans le dépôt ; `tests/offline.test.js` (nouveau) lit les valeurs dans `BL.data.balance`.

Mesure (joueur simulé **sans chantiers**, pour isoler l'effet du seul hors-ligne ; gain hors-ligne / gain en jeu actif pendant la même durée, au même stade) :

| Stade | Absence | Avant (50 % / 8 h) | Après (20 % / 4 h) |
|---|---|---|---|
| début (5 min) | 5 min | 2,9 % | 1,1 % |
| ≈ 1 h | 1 h | 15,0 % | 6,0 % |
| ≈ 10 h | 8 h | 44,7 % | **8,9 %** |
| fin (48 h) | 8 h | 47,7 % | **9,5 %** |

- (a) Premier retour : 5 min d'absence après 5 min de jeu rapportent encore ≈ 60 s de revenu actif (visible dans le bilan). ✔
- (b) 8 h d'absence ≤ 25 % de 8 h de jeu actif à tous les stades (au plus 9,5 %). ✔
- (c) Jeu actif : le hors-ligne ne change rien au rythme en jeu actif (0 % de rallongement des paliers). ✔ — mais **le bloc D, lui, ralentit fortement le jeu actif, volontairement** (voir D).
- Profil « 45 min de jeu, 7 h 15 d'absence, 3 fois par jour, 3 jours », sans chantiers : total gagné 34,7 T → 7,2 T, niveau d'empire 59 → 50. Avec les chantiers (version finale) : niveau et bâtiments identiques avant / après (50, meilleur bâtiment 38) : ce sont les chantiers qui fixent le rythme, et ils avancent à 100 % pendant l'absence.

### C. Nouvelles illustrations de personnages

- `assets/crew/PROMPTS_IMAGES.md` réécrit pour le style de la référence fournie par le joueur (affiche de jeu semi-réaliste, traits de pinceau dorés, visage au premier plan à gauche, ville côtière nocturne fictive avec port, yachts et collines éclairées, crépuscule orange / violet, accents or, cicatrices et pansements, couronne dorée stylisée) : bloc de style commun, négatifs communs (dont « logo, texte, nom d'entreprise, nom de ville »), et une description précise pour chacun des 13 personnages, cohérente avec le jeu (rôle, trait, âge, rareté). **La référence n'est pas dans le dépôt** et son texte (nom d'agence, noms de villes) n'est reproduit nulle part.
- `assets/crew/README.txt` : procédure pas à pas (full d'abord, puis card et thumb du même visage, noms `<id>_full.webp`…, dépôt, déclaration dans `manifest.js`, source / licence, vérification de la casse).
- Fiche personnage refaite (`js/crew-ui.js` + CSS) : grande illustration à gauche recadrée vers le visage (mobile : image en haut), nom en Playfair Display italique gras, étoiles de rareté, citation, Spécialité / Bonus / Coût de recrutement, niveaux (actuel surligné, suivants avec cadenas), cadre « Caractère et loyauté », badge **ACTIF**, emblème couronne. Toutes les données viennent du jeu.
- Repli SVG amélioré (`js/portraits.js`) : relief (lumière de rebord, reflets), nouveaux accessoires (pansement, cicatrice au sourcil, ecchymose légère : Rocco, Théo, Nadia, Tom) ; pour la grande illustration : ville côtière nocturne fictive, couronne dorée et traits de pinceau dorés.
- **Honnêtement** : ce sont toujours des dessins vectoriels simples. Le rendu « affiche peinte » viendra uniquement des images que tu déposeras dans `assets/crew/` (aucune image n'a été générée ni copiée).
- Tests : `tests/crew-images.test.js` (chaque image déclarée existe, casse comprise ; repli d'une variante absente vers une autre, puis vers le SVG ; nom de fichier hostile ignoré ; prompts complets avec négatifs ; aucune image étrangère dans `assets/crew`), `tests/crew-fiche-browser.test.js` (3 largeurs, mise en page, badge, niveaux, texte ≥ 12 px, captures).

### D. Chantiers visibles (temps de construction)

- Acheter ou améliorer un bâtiment d'activité lance un **chantier** : payé tout de suite, niveau appliqué à la fin. Pendant les travaux le bâtiment **produit à son niveau actuel**. Un nouveau bâtiment (2 à 4) apparaît à la fin de son chantier.
- Durées croissantes (`js/works.js`, `P.anchors` + échelle par activité ; bâtiments annexes ×0,75 ; plafond absolu 24 h) :

| Activité | niv. 1 | 5 | 10 | 20 | 30 | 45 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|---|---|---|
| Salle de jeux | 2 s | 6 s | 40 s | 3 min | 10 min | 35 min | 1 h 40 | 4 h | 8 h |
| Convoyage | 3 s | 8 s | 52 s | 3 min | 13 min | 46 min | 2 h 10 | 5 h 12 | 10 h 24 |
| Recel | 3 s | 10 s | 1 min | 4 min | 17 min | 1 h | 2 h 50 | 6 h 48 | 13 h 36 |
| Immobilier | 4 s | 13 s | 1 min | 6 min | 22 min | 1 h 18 | 3 h 40 | 8 h 48 | 17 h 36 |
| Holding | 6 s | 17 s | 2 min | 7 min | 28 min | 1 h 39 | 4 h 40 | 11 h 12 | 22 h 24 |

- **Ouvriers** (chantiers simultanés) : 1 au départ, 2 au niveau d'empire 3, 3 au niveau 8 (jamais en lingots). File d'attente visible de 5 chantiers payés d'avance.
- Le temps des chantiers avance **à 100 % hors ligne** (horloge propre qui ne recule jamais ; une absence ou un saut d'horloge compte au plus 24 h, soit le plus long chantier ; horloge qui recule : rien).
- Raccourcis : mini-jeu **Contremaître** (−5 à −20 % du temps restant, 10 min de récupération) et **pot-de-vin** en argent du jeu (−30 % du temps restant, coût = revenus × secondes gagnées × 1,6^n, 3 au plus par chantier, jamais jusqu'au bout, avec confirmation). **Jamais de lingots.**
- Visuel (SVG/CSS, aucune image externe) : échafaudage, grue, camion, ouvriers, étincelles et poussière au-dessus du bâtiment sur la carte, barre et temps restant ; carte « Chantiers » (vue Empire, et panneau repliable sur la carte) ; état « en chantier » dans la fiche du bâtiment ; **inauguration** (ruban, lumière) et notification à la fin ; bruit de chantier synthétisé localement (après un geste, toutes les ~8 s quand la carte montre un chantier, coupé par « Aucune ambiance » ou le son coupé). Mouvements réduits (réglage ou système) et effets bas : dessins fixes.
- Sauvegarde **v14** : `s.works = { q: [{ id, i, to, at, dur, b }], clk, fcd }`. Nettoyage strict : activité inconnue, bâtiment inexistant ou non débloqué, niveau incohérent (doit être exactement le suivant), doublon, durée négative / énorme (→ durée normale / 24 h), début dans le futur (→ maintenant), plus de chantiers démarrés que d'ouvriers (→ file), liste énorme (tronquée).
- Bilan de retour : « Chantiers terminés : N (…) » et « Chantiers en cours ».
- Conseils (« Que faire ? », assistante) : plus jamais de conseil sur un bâtiment déjà en chantier ni quand la file est pleine.

Audit des chantiers (joueur simulé ; il ne recrute pas, ne prend pas de quartiers, ne fait pas d'opérations : un vrai joueur gagne plus) :

| Joueur | 15 min | 1 h | 4 h | 10 h |
|---|---|---|---|---|
| sans chantiers (avant) | niv. 5 · 586/s | niv. 37 · 5,3 M/s | niv. 50 · 100 M/s | niv. 50 · 268 M/s |
| chantiers, sans aide | niv. 3 · 25/s | niv. 9 · 3,9 k/s | niv. 50 · 8,5 M/s | niv. 50 · 72 M/s |
| + Contremaître | niv. 3 · 25/s | niv. 9 · 4,4 k/s | niv. 50 · 9,8 M/s | niv. 50 · 73 M/s |
| + Contremaître + pots-de-vin | niv. 3 · 25/s | niv. 9 · 3,5 k/s | niv. 46 · 6,4 M/s | niv. 50 · 76 M/s |

| Temps de chantier cumulé (bâtiment principal) | niv. 5 | 10 | 25 | 50 | 100 |
|---|---|---|---|---|---|
| Salle de jeux, sans mini-jeu | 20 s | 2 min | 36 min | 10 h 19 | 197 h |
| Salle de jeux, Contremaître | 20 s | 2 min | 36 min | 9 h 14 | 93 h |
| Salle de jeux, Contremaître + pots-de-vin | 19 s | 58 s | 13 min | 3 h 29 | 47 h |
| Holding, sans mini-jeu | 56 s | 6 min | 1 h 41 | 28 h 54 | 552 h |
| Holding, Contremaître + pots-de-vin | 27 s | 2 min | 35 min | 8 h 55 | 91 h |

(tableau complet par activité dans la sortie de l'audit)

- « Attendre pour rien » : le plus long écart entre deux commandes de bâtiment possibles est de **3 min dans la 1re heure, 6 min sur les 4 premières heures** (objectif ≤ 10 min). ✔ La file est souvent pleine après la première heure : les travaux avancent, mais le joueur n'a plus de bâtiment à commander — c'est le moment des autres activités (équipe, quartiers, opérations, mini-jeux).
- **À savoir** : c'est un ralentissement **voulu et fort** du jeu actif. Exemples : salle de jeux niveau 25 en 1 h au lieu de 9 min ; à 1 h de jeu, niveau d'empire 9 au lieu de 37. Le niveau 100 d'un bâtiment demande maintenant plusieurs jours de chantiers (comme dans un jeu de village). Si c'est trop lent à ton goût, trois réglages suffisent, sans toucher à la sauvegarde : `BL.works.P.anchors` (durées), `P.workers` (niveaux qui donnent les ouvriers), `P.queueMax`.
- Tests : `tests/works.test.js` (durées, file, ouvriers, production pendant le chantier, fin pendant l'absence dans l'ordre, nouveau bâtiment, pot-de-vin, contremaître, tutoriel, v14 : aller-retour, import v13, valeurs hostiles, export / import), `tests/works-browser.test.js` (3 largeurs : carte, fiche du bâtiment, vue Empire, inauguration, pot-de-vin avec confirmation, absence de 2 h + bilan, ancienne sauvegarde, didacticiel toujours finissable, mouvements réduits système et réglage, captures).

### E. Mini-jeux liés à l'histoire (facultatifs, jamais bloquants)

Communs : explication en 2 lignes, « Jouer » ou « Résoudre automatiquement (résultat moyen) », score lisible, retour à l'écran d'origine sans rien perdre (fenêtre par-dessus), clavier (Tab, Entrée, Espace, flèches, Échap) et tactile (boutons ≥ 40 px), mouvements réduits respectés, résultat **déterministe à partir d'une graine**, jamais de lingots, au pire « moins de bonus » ou un peu de chaleur (plan bâclé : +1).

1. **Crochetage** — porte d'entrée : braquage en cours (avant l'exécution) et opérations de type braquage. 5 goupilles à caler quand le repère passe dans la zone ; 3 ratés et le ressort lâche. Braquage : jusqu'à +8 points de chance sur l'exécution et la fuite, −2 de chaleur par étape ; opération : +5 points, −1 de chaleur. Mouvements réduits : le repère ne bouge pas seul, on le déplace aux flèches.
2. **Plan du coup** — porte d'entrée : chaque opération (Arsenal › Opérations). Une approche et un rôle par phase (entrée, cible, sortie) ; la chance et la chaleur affichées changent à chaque choix. 0 à +10 points de chance, chaleur de +1 à −3 (plan + crochetage : +15 points au plus, −4 de chaleur au plus), valable pour le prochain lancement, consommé à la fin de l'opération.
3. **Interrogatoire** — porte d'entrée : Histoire (indic, lieutenant rival, inspecteur). Poser la question vérifiable, juger la réponse. Indic : pression du rival le plus menaçant −5 à −20 et un peu de chaleur ; rival : 30 à 120 s de revenus ; inspecteur : loyauté de l'équipe +2 à +10 (plafond 100). 1 h de jeu entre deux séances avec le même personnage.
4. **Comptabilité avec Gino** — porte d'entrée : fenêtre Chaleur. Repérer les 2 lignes fausses du registre. « Effacer des traces » : chaleur −2 à −10 ; « Optimiser » : revenus +1 à +6 % pendant 10 min. 30 min de jeu entre deux séances.
5. **Contremaître** — porte d'entrée : carte Chantiers et fiche du bâtiment en chantier. Répartir 6 ouvriers sur 3 tâches en 25 s : −5 à −20 % du temps restant (jamais plus), 10 min de récupération.

Gains monétaires maximaux (score parfait à chaque fois), en % du revenu net en jeu actif : comptabilité +2,0 %, interrogatoire du rival +3,3 %, plan + crochetage des opérations +2,4 %, crochetage du braquage +0,4 % → **+8,1 % au total** (objectif ≤ 10 %). ✔

Sauvegarde v14 : `s.mini = { n, cd, hlp, prep, acc, best }`, nettoyée et bornée à la lecture.
Tests : `tests/minigames.test.js` (graines, scores parfaits / ratés / hostiles, récompenses et bornes, délais, branchements braquage / opération / revenus, sauvegarde), `tests/minigames-browser.test.js` (les 5 portes d'entrée réelles, 3 largeurs, plan parfait au clavier, crochetage au clavier en mouvements réduits, résolution automatique, abandon sans effet, retour à l'écran d'origine, texte ≥ 12 px, aucune erreur console, captures).

### Captures (dossier `shots/`)

`p17-menu-classement-{1366,390,320}`, `p17-fiche-personnage-*`, `p17-chantier-carte-*`, `p17-chantier-empire-*`, `p17-bilan-retour-1366`, `p17-mini-{crochetage,plan,interrogatoire,comptabilite,contremaitre}-*`.

### Non testé (honnêtement)

- Le vrai serveur Supabase : la fonction `lb_board_public` n'a été exécutée sur aucune base (les tests simulent les réponses). Il faut lancer `docs/supabase-maj-accueil.sql` une fois ; tant que ce n'est pas fait, l'accueil affiche « Classement indisponible pour l'instant ».
- Un vrai téléphone, Firefox et Safari : tout a été vérifié dans Chromium seulement (largeurs 1366, 390 et 320 px simulées).
- Le rendu visuel n'a été jugé que sur captures ; les sons (bruit de chantier, inauguration) n'ont pas été écoutés.
- Aucune vraie illustration n'existe encore : seul le repli SVG est testé.
- Le joueur simulé ne joue que le cœur de l'économie : les durées absolues de l'audit sont pessimistes ; les comparaisons avant / après sont fiables.
