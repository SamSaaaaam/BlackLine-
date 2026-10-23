# Économie et durée de partie · Partie 13 (C0, C11)

Toutes les valeurs ci-dessous viennent de `tests/simulate.js` (joueur optimisé, graine 1) ou de `tests/perf-audit.js`, exécutés pendant cette partie. « Non mesuré » est écrit quand c'est le cas.

## 1. Économie de base : avant (Partie 12) / après (Partie 13)

`AUDIT=1 node tests/simulate.js` : les courbes sont **identiques** à celles de `ECONOMIE_AVANT_APRES.md` (revenu net 645/s à 15 min, 4,0 M/s à 1 h, 903,5 M/s à 8 h, 1,9 Md/s à 24 h ; prix en minutes de revenu inchangés). La Partie 13 n'a modifié aucun prix, aucune courbe de coût : tout ce qui est nouveau (histoire, braquage, soirée casino, défis) vient **en plus**, avec ses propres plafonds. La plus longue attente entre deux achats du joueur optimisé reste **11,4 min** (cible : ≤ 25 min ; aucun mur > 30 min).

Limite : cette simulation ne joue ni la trame, ni le braquage, ni les soirées casino, ni les défis. Leur effet sur la durée n'est donc **pas mesuré par la simulation** ; il est borné par leurs paramètres :
- trame : revenus ±10 % au maximum, entretien ±15 %, chaleur ±30 %, rivaux ±25 % (`data.saga.params`) ;
- braquage : butin entre 0,45 et 1,6 × 60 min de revenu, une fois toutes les 8 h au plus, soit environ 12 % de revenu supplémentaire par cycle ;
- casino : événements < 10 % du revenu ;
- prestige / clans / défis : lingots et cosmétiques bornés, aucun achat de progression.

## 2. C0 · Durée de partie selon `balance.lateGrowthAdd`

Niveau d'empire atteint par le joueur optimisé (simulation de 5 jours de jeu actif continu, graine 1). Le niveau 100 n'est atteint dans aucune variante sur 5 jours simulés.

| `lateGrowthAdd` | 24 h | 48 h | 72 h | 96 h | 120 h | Plus longue attente entre deux achats |
|---|---|---|---|---|---|---|
| **0,05 (défaut, conservé)** | 67 | 78 | 84 | 87 | 89 | 11,4 min (mesuré sur 24 h seulement) |
| 0,10 | 63 | 71 | 76 | 80 | 85 | non relevé |
| 0,15 | 60 | 68 | 73 | 76 | 78 | 74,8 min |
| 0,25 (valeur d'avant la Partie 12) | 57 | 63 | 67 | 71 | 74 | 147,1 min |

Lecture : 0,15 et 0,25 allongent la partie mais créent des attentes de 75 à 147 min entre deux achats, bien au-delà de la cible (≤ 25 min) : c'est précisément ce que la Partie 12 avait corrigé. **Décision par défaut : 0,05 conservé**, la durée est compensée par le contenu (histoire, braquage, soirées, défis) et le prestige, pas par de nouveaux murs de prix. Pour changer : modifier `lateGrowthAdd` dans `js/data.js` (aucune sauvegarde n'est touchée, les coûts sont recalculés).

Ce tableau mesure la progression d'un joueur continu optimisé ; un joueur réel avec des pauses mettra plus de temps. Aucun joueur réel n'a été mesuré.

## 3. Fluidité : Partie 12 → Partie 13 (rendu logiciel sans GPU, mêmes scénarios, 12 s chacun)

Images/s · tâches longues (> 50 ms) à processeur ×1 puis ralenti ×4.

| Scénario | ×1 P12 | ×1 P13 | ×4 P12 | ×4 P13 |
|---|---|---|---|---|
| Menu | 45,9 · 0 | 45,8 · 0 | 39,2 · 1 | 38,8 · 0 |
| Empire | 60 · 0 | 60 · 0 | 59,8 · 0 | 59,5 · 1 |
| Carte jour | 38 · 3 | 39,6 · 1 | 27,9 · 124 | 30,3 · 90 |
| Carte nuit pluie | 35,9 · 0 | 41,6 · 1 | 29,1 · 97 | 31,6 · 69 |
| Carte en déplacement | 44 · 0 | 49,7 · 0 | 38,3 · 27 | 42,3 · 10 |
| Ouverture de box | 60 · 0 | 60 · 0 | 58,4 · 1 | 59,6 · 0 |
| Bannière de chaleur | 58,8 · 0 | 60 · 0 | 57,7 · 0 | 57,7 · 0 |

5 min sur la carte (×1) : mémoire JS 12,7 → 11,9 Mo (aucune dérive visible cette fois ; la dérive de 0,9 Mo de la Partie 12 n'est pas reproduite, sa cause n'a pas été identifiée), minuteurs 7 → 6, écouteurs 131 → 131, nœuds DOM 9 663 → 9 664.

Points de la Partie 12 traités : barres `.meter i`, `.rd-bar i`, `.relbar i` passées de `width` à `transform: scaleX` (test `bars-browser`) ; animations SVG `fill` (`cont`, `flash`) et `r` (`ring`) remplacées par `opacity` / `transform`.
**Non tenus :** images lentes sur la carte à ×4 (42 images > 50 ms sur la carte de jour, mieux que 66 mais pas nulles) ; durée du pas de jeu avec interface > 2 ms au p95 (4 à 7 ms à ×1 dans ce banc en rendu logiciel). Le banc n'a pas de GPU : les valeurs absolues sont pessimistes, mais rien ne permet d'affirmer « 100 % fluide ».
