# Journal des modifications — BLACKLINE

> Ce fichier n'existait pas dans le dépôt GitHub (ni `CLAUDE.md`, ni le dossier `tests/`) : seuls les fichiers du jeu y avaient été envoyés.
> Il commence donc à la Partie 17. Si tu as un `CHANGELOG.md` plus ancien sur ton ordinateur, colle cette section en tête du tien.
> Les tests cités ci-dessous ont été **réécrits** dans `tests/` (l'ancien `tests/simulate.js` et l'ancien `tests/pages-ready.test.js` n'étaient pas disponibles).

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
