# Économie · cibles d'équilibrage (Partie 12 · C7)

Écrites **avant** de toucher aux courbes. Unité : la **minute de revenu net** = prix ÷ revenu net par seconde ÷ 60 (combien de temps de jeu actif il faut pour s'offrir l'achat). C'est la seule grandeur qui sépare un palier agréable d'un mur.
Mesure : `AUDIT=1 node tests/simulate.js` (joueur optimisé qui achète au meilleur rapport gain/coût) + `tests/_econ-audit.js`. Lignes : min / médiane / max de ce qui est proposé à l'instant.

| Catégorie | 0–15 min | 15 min – 4 h | après 8 h (fin de partie) |
|---|---|---|---|
| Niveau suivant d'une activité | ≤ 1 min | ≤ 1,5 min | médiane ≤ 12 min, max ≤ 20 min |
| Bâtiment annexe d'une activité | ≤ 3 min | ≤ 3 min | ≤ 5 min |
| Bâtiment de quartier (le moins cher / le plus cher) | — | ≤ 8 min / ≤ 40 min | ≤ 8 min / ≤ 40 min |
| Équipement commun / rare (Arsenal) | ≤ 3 min | ≤ 2 min / ≤ 8 min | idem |
| Extension de capacité de l'Arsenal | ≤ 4 min (1re) | — | 6e et dernière ≤ 60 min |
| Recrue / formation | ≤ 3 min | ≤ 5 min | ≤ 5 min |
| Prise / investissement de quartier | ≤ 5 min | ≤ 5 min | ≤ 5 min |

Règles :
- aucun achat proposé comme « suivant » ne dépasse **30 min** de revenu en jeu actif (hors extension finale de l'Arsenal et objets épiques, qui restent des luxes) ;
- la progression ne s'arrête jamais : le revenu continue de croître jusqu'à 48 h de jeu simulé ;
- l'attente la plus longue entre deux achats du joueur optimisé reste **≤ 25 min** ;
- le lingot reste à **90 s de revenu** : une boost acheté rapporte ≈ 75–90 s de revenu par lingot, baisser ce prix créerait une boucle de gain (argent → lingot → boost → argent) ;
- les sauvegardes ne changent pas : les coûts sont recalculés à chaque affichage, aucun niveau ni objet possédé n'est touché.
