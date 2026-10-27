# Économie · Partie 19 (sortie de AUDIT=1 node tests/simulate.js, après le bloc F)

Avant le bloc F, la sortie était identique à docs/ECONOMIE_PARTIE17.md (les blocs A à E ne touchent pas à l'économie). Comparaison avant / après : CHANGELOG.md, Partie 19 · F.

# Audit d'économie · Partie 17 (joueur simulé, 24 h, avec chantiers)

Réglages hors-ligne actuels : rendement 20,0 %, plafond 4 h 00, pause comptée comme absence au-delà de 5 min.

## Progression en jeu actif

| Temps | Niveau d'empire | Revenu net |
|---|---|---|
| 5 min | 2 | 1.65/s |
| 15 min | 3 | 25/s |
| 1 h 00 | 9 | 3.9 k/s |
| 4 h 00 | 50 | 8.45 M/s |
| 10 h 00 | 50 | 72.39 M/s |
| 24 h 00 | 50 | 128.15 M/s |

## Absence : gain hors-ligne / gain en jeu actif pendant la même durée (même stade)

| Stade | Absence | Jeu actif | Hors-ligne avant (50 % / 8 h) | ratio | Hors-ligne après (20,0 % / 4 h 00) | ratio |
|---|---|---|---|---|---|---|
| début (5 min) | 5 min | 2.6 k | 248 | 9,5 % | 99 | 3,8 % |
| début (5 min) | 1 h 00 | 4.17 M | 3.0 k | 0,1 % | 1.2 k | 0,0 % |
| début (5 min) | 8 h 00 | 466.06 Md | 23.8 k | 0,0 % | 4.8 k | 0,0 % |
| ≈ 1 h | 5 min | 1.37 M | 578.1 k | 42,1 % | 231.2 k | 16,8 % |
| ≈ 1 h | 1 h 00 | 204.17 M | 6.94 M | 3,4 % | 2.77 M | 1,4 % |
| ≈ 1 h | 8 h 00 | 661.28 Md | 55.50 M | 0,0 % | 11.10 M | 0,0 % |
| ≈ 10 h | 5 min | 22.29 Md | 10.86 Md | 48,7 % | 4.34 Md | 19,5 % |
| ≈ 10 h | 1 h 00 | 271.28 Md | 130.30 Md | 48,0 % | 52.12 Md | 19,2 % |
| ≈ 10 h | 8 h 00 | 2.55 T | 1.04 T | 40,9 % | 208.48 Md | 8,2 % |
| fin (24 h) | 5 min | 38.44 Md | 19.22 Md | 50,0 % | 7.69 Md | 20,0 % |
| fin (24 h) | 1 h 00 | 466.03 Md | 230.66 Md | 49,5 % | 92.27 Md | 19,8 % |
| fin (24 h) | 8 h 00 | 3.90 T | 1.85 T | 47,3 % | 369.06 Md | 9,5 % |

## Profil réaliste : 3 jours de « 45 min de jeu, 7 h 15 d'absence » (×3 par jour)

| Réglages | Niveau d'empire | Meilleur bâtiment | Revenu net | Total gagné |
|---|---|---|---|---|
| avant (50 % / 8 h) | 50 | 38 | 72.30 M/s | 3.64 T |
| après (20,0 % / 4 h 00) | 50 | 38 | 72.44 M/s | 1.11 T |

## Paliers en jeu actif (premier bâtiment de chaque activité)

| Palier | Atteint à |
|---|---|
| backroom niveau 10 | 8 min |
| backroom niveau 25 | 1 h 02 |
| backroom niveau 50 | — |
| freight niveau 10 | 24 min |
| freight niveau 25 | 1 h 44 |
| fence niveau 10 | 1 h 08 |
| fence niveau 25 | 12 h 29 |
| estate niveau 10 | 1 h 55 |
| holding niveau 10 | 3 h 11 |

# Chantiers (Partie 17 · D)

Ouvriers : 1 au départ, 2 au niveau d'empire 3, 3 au niveau 8. File d'attente : 5 chantiers payés d'avance. Plafond : 24 h 00 par chantier.

## Durée d'un chantier (bâtiment principal ; bâtiments 2 à 4 : ×0.75)

| Activité | niv. 1 | 5 | 10 | 20 | 30 | 45 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|---|---|---|
| backroom | 2 s | 6 s | 40 s | 3 min | 10 min | 35 min | 1 h 40 | 4 h 00 | 8 h 00 |
| freight | 3 s | 8 s | 52 s | 3 min | 13 min | 46 min | 2 h 10 | 5 h 12 | 10 h 24 |
| fence | 3 s | 10 s | 1 min | 4 min | 17 min | 1 h 00 | 2 h 50 | 6 h 48 | 13 h 36 |
| estate | 4 s | 13 s | 1 min | 6 min | 22 min | 1 h 18 | 3 h 40 | 8 h 48 | 17 h 36 |
| holding | 6 s | 17 s | 2 min | 7 min | 28 min | 1 h 39 | 4 h 40 | 11 h 12 | 22 h 24 |
| maritime | 42 min | 1 h 01 | 1 h 32 | 3 h 04 | 5 h 47 | 11 h 07 | 20 h 20 | 24 h 00 | 24 h 00 |
| shell | 1 h 20 | 1 h 48 | 2 h 32 | 5 h 05 | 8 h 04 | 15 h 49 | 24 h 00 | 24 h 00 | 24 h 00 |
| guard | 2 h 14 | 2 h 57 | 4 h 11 | 7 h 27 | 11 h 28 | 21 h 54 | 24 h 00 | 24 h 00 | 24 h 00 |

## Temps de chantier cumulé pour atteindre un niveau (bâtiment principal, un ouvrier dessus en continu)

Contremaître : joué dès qu'il est prêt (toutes les 10 min) avec un score moyen (−13 % du temps restant). Pot-de-vin : 3 par chantier (−30 % chacun, jamais jusqu'au bout).

| Activité | Aides | niv. 5 | 10 | 25 | 50 | 100 |
|---|---|---|---|---|---|---|
| backroom | sans mini-jeu | 20 s | 2 min | 36 min | 10 h 19 | 197 h 16 |
| backroom | Contremaître | 20 s | 2 min | 36 min | 9 h 14 | 92 h 40 |
| backroom | Contremaître + pots-de-vin | 19 s | 58 s | 13 min | 3 h 29 | 46 h 56 |
| freight | sans mini-jeu | 26 s | 3 min | 47 min | 13 h 25 | 256 h 27 |
| freight | Contremaître | 26 s | 3 min | 47 min | 11 h 32 | 107 h 00 |
| freight | Contremaître + pots-de-vin | 23 s | 1 min | 16 min | 4 h 28 | 56 h 15 |
| fence | sans mini-jeu | 33 s | 4 min | 1 h 01 | 17 h 33 | 335 h 21 |
| fence | Contremaître | 33 s | 4 min | 1 h 01 | 14 h 21 | 122 h 53 |
| fence | Contremaître + pots-de-vin | 24 s | 1 min | 21 min | 5 h 43 | 67 h 03 |
| estate | sans mini-jeu | 44 s | 5 min | 1 h 19 | 22 h 42 | 433 h 59 |
| estate | Contremaître | 44 s | 5 min | 1 h 19 | 17 h 34 | 139 h 16 |
| estate | Contremaître + pots-de-vin | 24 s | 2 min | 27 min | 7 h 13 | 78 h 39 |
| holding | sans mini-jeu | 56 s | 6 min | 1 h 41 | 28 h 54 | 552 h 21 |
| holding | Contremaître | 56 s | 6 min | 1 h 40 | 21 h 03 | 155 h 35 |
| holding | Contremaître + pots-de-vin | 27 s | 2 min | 35 min | 8 h 55 | 90 h 34 |
| maritime | sans mini-jeu | 4 h 15 | 10 h 52 | 52 h 41 | 266 h 31 | 1391 h 24 |
| maritime | Contremaître | 3 h 24 | 8 h 07 | 30 h 32 | 95 h 25 | 282 h 44 |
| maritime | Contremaître + pots-de-vin | 1 h 23 | 3 h 25 | 14 h 26 | 52 h 49 | 178 h 58 |
| shell | sans mini-jeu | 7 h 49 | 18 h 56 | 87 h 07 | 390 h 52 | 1578 h 21 |
| shell | Contremaître | 5 h 17 | 11 h 55 | 41 h 10 | 115 h 49 | 306 h 49 |
| shell | Contremaître + pots-de-vin | 2 h 21 | 5 h 28 | 21 h 06 | 67 h 33 | 197 h 01 |
| guard | sans mini-jeu | 12 h 55 | 31 h 12 | 133 h 34 | 553 h 57 | 1753 h 57 |
| guard | Contremaître | 7 h 16 | 16 h 06 | 51 h 48 | 135 h 56 | 327 h 37 |
| guard | Contremaître + pots-de-vin | 3 h 31 | 8 h 03 | 28 h 27 | 83 h 06 | 213 h 11 |

## Joueur simulé : progression avec et sans chantiers (10 h de jeu actif)

| Joueur | 15 min | 1 h 00 | 4 h 00 | 10 h 00 |
|---|---|---|---|---|
| sans chantiers (avant) | niv. 5, 586/s, meilleurs 36/16/0/0/0/0/0/0 | niv. 37, 5.30 M/s, meilleurs 100/100/45/33/2/0/0/0 | niv. 50, 100.13 M/s, meilleurs 100/100/100/50/38/0/0/0 | niv. 50, 267.87 M/s, meilleurs 100/100/100/100/45/0/0/0 |
| chantiers, sans aide | niv. 3, 25/s, meilleurs 16/5/0/0/0/0/0/0 | niv. 9, 3.9 k/s, meilleurs 26/19/8/0/0/0/0/0 | niv. 50, 8.45 M/s, meilleurs 35/28/23/24/15/0/0/0 | niv. 50, 72.39 M/s, meilleurs 40/34/23/27/30/0/0/0 |
| chantiers + Contremaître | niv. 3, 25/s, meilleurs 16/5/0/0/0/0/0/0 | niv. 9, 4.4 k/s, meilleurs 26/19/9/0/0/0/0/0 | niv. 50, 9.83 M/s, meilleurs 34/28/23/25/15/0/0/0 | niv. 50, 73.43 M/s, meilleurs 40/34/23/28/31/0/0/0 |
| chantiers + Contremaître + pots-de-vin | niv. 3, 25/s, meilleurs 16/5/0/0/0/0/0/0 | niv. 9, 3.5 k/s, meilleurs 26/19/7/0/0/0/0/0 | niv. 46, 6.40 M/s, meilleurs 35/30/26/24/12/0/0/0 | niv. 50, 75.64 M/s, meilleurs 41/35/27/30/30/0/0/0 |

| Joueur | plus long écart entre deux commandes de bâtiment (1re heure) | idem (4 premières heures) | commandes en 4 h | temps « file pleine » (4 h) | Contremaître joués | pots-de-vin |
|---|---|---|---|---|---|---|
| sans chantiers (avant) | 2 min | 14 min | 773 | 0 s | 0 | 0 |
| chantiers, sans aide | 3 min | 6 min | 381 | 3 h 41 | 0 | 0 |
| chantiers + Contremaître | 2 min | 6 min | 385 | 3 h 41 | 57 | 0 |
| chantiers + Contremaître + pots-de-vin | 3 min | 5 min | 390 | 3 h 42 | 57 | 301 |

Écart entre deux commandes : temps pendant lequel le joueur ne peut rien construire de nouveau (faute d'argent, d'ouvrier ou de place dans la file). « File pleine » : 3 ouvriers occupés et 5 chantiers en attente ; les travaux avancent, mais rien de neuf à commander.

| Palier (bâtiment principal) | sans chantiers (avant) | chantiers, sans aide | chantiers + Contremaître | chantiers + Contremaître + pots-de-vin |
|---|---|---|---|---|
| backroom niveau 5 | 3 min | 3 min | 3 min | 3 min |
| backroom niveau 10 | 6 min | 8 min | 8 min | 8 min |
| backroom niveau 25 | 9 min | 1 h 02 | 1 h 01 | 60 min |
| freight niveau 10 | 13 min | 24 min | 24 min | 23 min |
| freight niveau 25 | 18 min | 1 h 44 | 3 h 00 | 2 h 40 |
| fence niveau 10 | 23 min | 1 h 08 | 1 h 02 | 1 h 06 |
| fence niveau 25 | 29 min | — | — | 2 h 39 |
| estate niveau 10 | 36 min | 1 h 55 | 1 h 45 | 2 h 02 |
| holding niveau 10 | 1 h 09 | 3 h 11 | 3 h 02 | 3 h 41 |
| backroom niveau 50 | 33 min | — | — | — |

# Mini-jeux (Partie 17 · E) : gain maximal en jouant parfaitement

En % du revenu net, moyenné sur une heure de jeu actif (borne haute : score parfait à chaque fois, sans compter le temps passé à jouer). « Résoudre automatiquement » donne la moitié des bonus.

| Mini-jeu | Gain maximal |
|---|---|
| Comptabilité « optimiser » (+6 % pendant 10 min, toutes les 30 min) | +2,0 % |
| Interrogatoire du rival (120 s de revenus, toutes les heures) | +3,3 % |
| Plan du coup + crochetage sur les opérations (+15 points de chance en continu) | +2,4 % |
| Crochetage du braquage (+8 points sur 2 étapes, un braquage toutes les 8 h) | +0,4 % |
| **Total si tout est joué parfaitement** | **+8,1 %** |

Non monétaires : indic (pression d'un rival −5 à −20, chaleur −0 à −3), inspecteur (loyauté +2 à +10, plafonnée à 100), comptabilité « traces » (chaleur −2 à −10). Contremaître : voir le tableau des chantiers (−5 à −20 % du temps restant, une fois toutes les 10 min). Aucun lingot n'est jamais gagné ni dépensé.

# Fin de partie (Partie 19 · F) : 72 h de jeu actif, joueur « chantiers, sans aide »

Activités : 8 · quartiers : 11. Mesures prises toutes les 10 min de jeu (précision des temps : 10 min).

| Temps | Niveau d'empire | Revenu net | Total gagné | Meilleurs bâtiments (backroom/freight/fence/estate/holding/maritime/shell/guard) |
|---|---|---|---|---|
| 24 h 00 | 50 | 128.15 M/s | 5.99 T | 46/40/32/27/41/0/0/0 |
| 36 h 00 | 52 | 166.46 M/s | 12.23 T | 48/43/36/27/46/0/0/0 |
| 48 h 00 | 55 | 211.59 M/s | 19.98 T | 53/45/37/27/50/0/0/0 |
| 72 h 00 | 60 | 260.60 M/s | 40.06 T | 62/47/40/30/55/2/0/0 |

| Palier | Atteint à |
|---|---|
| niveau d'empire 50 | 3 h 50 |
| niveau d'empire 51 | 32 h 20 |
| niveau d'empire 52 | 34 h 50 |
| niveau d'empire 53 | 37 h 50 |
| niveau d'empire 55 | 44 h 40 |
| niveau d'empire 58 | 56 h 40 |
| niveau d'empire 60 | 67 h 00 |
| niveau d'empire 65 | — |
| niveau d'empire 70 | — |
| première ouverture : backroom | 10 min |
| première ouverture : freight | 10 min |
| première ouverture : fence | 40 min |
| première ouverture : estate | 1 h 20 |
| première ouverture : holding | 2 h 10 |
| première ouverture : maritime | 59 h 50 |
| première ouverture : shell | — |
| première ouverture : guard | — |

## Objectifs

- ✔ premier retour (5 min d'absence après 5 min) : +99 $ (≥ 30 s de revenu actif : 50)
- ✔ 8 h d'absence ≤ 25 % de 8 h actives (début (5 min)) : 0,0 %
- ✔ 8 h d'absence ≤ 25 % de 8 h actives (≈ 1 h) : 0,0 %
- ✔ 8 h d'absence ≤ 25 % de 8 h actives (≈ 10 h) : 8,2 %
- ✔ 8 h d'absence ≤ 25 % de 8 h actives (fin (24 h)) : 9,5 %
- ✔ chantiers : jamais plus de 10 min sans pouvoir commander un bâtiment pendant les 4 premières heures (sans aide) : 6 min
- ✔ chantiers : premier achat ≤ 10 s, niveau 10 ≤ 3 min, plafond 24 h (activités de début et milieu de partie ; celles de fin de partie : tests/works.test.js)
- ✔ mini-jeux : gain monétaire maximal ≤ 10 % du revenu actif : +8,1 %
- ✔ fin de partie : aucune activité de fin de partie avant le niveau d'empire requis (maritime 59 h 50, shell —, guard — ; niveau 51 : 32 h 20)

(44.8 s de calcul)

# Annexe : 200 h de jeu actif (END_H=200 AUDIT=1 node tests/simulate.js), avant le bloc F (commit 7e6e78d) et après

## Avant

| Temps | Niveau d'empire | Revenu net | Total gagné | Meilleurs bâtiments (backroom/freight/fence/estate/holding) |
|---|---|---|---|---|
| 24 h 00 | 50 | 128.15 M/s | 5.99 T | 46/40/32/27/41 |
| 36 h 00 | 52 | 166.46 M/s | 12.23 T | 48/43/36/27/46 |
| 48 h 00 | 55 | 211.59 M/s | 19.98 T | 53/45/37/27/50 |
| 72 h 00 | 60 | 262.74 M/s | 40.09 T | 62/48/41/30/56 |
| 120 h 00 | 66 | 332.01 M/s | 92.08 T | 73/54/43/32/63 |
| 168 h 00 | 70 | 382.71 M/s | 154.82 T | 80/63/45/33/69 |
| 200 h 00 | 72 | 444.74 M/s | 203.17 T | 84/67/45/33/71 |
| Palier | Atteint à |
|---|---|
| niveau d'empire 50 | 3 h 50 |
| niveau d'empire 51 | 32 h 20 |
| niveau d'empire 52 | 34 h 50 |
| niveau d'empire 53 | 37 h 50 |
| niveau d'empire 55 | 44 h 40 |
| niveau d'empire 58 | 56 h 40 |
| niveau d'empire 60 | 67 h 00 |
| niveau d'empire 65 | 102 h 40 |
| niveau d'empire 70 | 160 h 40 |
| première ouverture : backroom | 10 min |
| première ouverture : freight | 10 min |
| première ouverture : fence | 40 min |
| première ouverture : estate | 1 h 20 |
| première ouverture : holding | 2 h 10 |

## Après

| Temps | Niveau d'empire | Revenu net | Total gagné | Meilleurs bâtiments (backroom/freight/fence/estate/holding/maritime/shell/guard) |
|---|---|---|---|---|
| 24 h 00 | 50 | 128.15 M/s | 5.99 T | 46/40/32/27/41/0/0/0 |
| 36 h 00 | 52 | 166.46 M/s | 12.23 T | 48/43/36/27/46/0/0/0 |
| 48 h 00 | 55 | 211.59 M/s | 19.98 T | 53/45/37/27/50/0/0/0 |
| 72 h 00 | 60 | 260.60 M/s | 40.06 T | 62/47/40/30/55/2/0/0 |
| 120 h 00 | 66 | 336.16 M/s | 91.97 T | 73/53/43/32/63/5/0/0 |
| 168 h 00 | 70 | 426.03 M/s | 157.84 T | 80/61/43/33/68/14/4/0 |
| 200 h 00 | 72 | 521.11 M/s | 212.80 T | 84/63/43/33/70/19/9/0 |
| Palier | Atteint à |
|---|---|
| niveau d'empire 50 | 3 h 50 |
| niveau d'empire 51 | 32 h 20 |
| niveau d'empire 52 | 34 h 50 |
| niveau d'empire 53 | 37 h 50 |
| niveau d'empire 55 | 44 h 40 |
| niveau d'empire 58 | 56 h 40 |
| niveau d'empire 60 | 67 h 00 |
| niveau d'empire 65 | 103 h 00 |
| niveau d'empire 70 | 159 h 30 |
| première ouverture : backroom | 10 min |
| première ouverture : freight | 10 min |
| première ouverture : fence | 40 min |
| première ouverture : estate | 1 h 20 |
| première ouverture : holding | 2 h 10 |
| première ouverture : maritime | 59 h 50 |
| première ouverture : shell | 145 h 00 |
| première ouverture : guard | — |
