# Économie Partie 14 : lingots d'or plus rares en début de partie

## Constat
Sources de lingots dans le jeu (inventaire complet du code) :

| Source | Quantité | Fréquence |
|---|---|---|
| Conversion dollars → lingots (`BL.gold.convert`) | illimitée, plafonnée par le coffre (100 de base, +100 par niveau, 10 niveaux) | à volonté |
| Défis locaux du jour / de la semaine (`meta`) | 1 par défi quotidien (3 par jour), 2 par défi hebdomadaire (2 par semaine) | quotidien / hebdo |
| Premier braquage réussi de chaque type (`heist`) | 2 lingots | une fois par type |
| Décisions d'histoire (`fx.gold`) | aucune dans les données actuelles | — |
| Objectifs, succès, événements, casino, box | aucun lingot (les box **coûtent** des lingots) | — |

La seule source réellement abondante est la conversion. Son prix valait **90 secondes de revenu** (minimum 100 K). Les lingots restaient donc bon marché à toute étape : une Box Rue (5 lingots) = 7,5 min de revenu, une Box Légende (40) = 1 h, un coffre plein (100) = 2,5 h de revenu.

## Changement
`js/gold.js` : `basePrice` 100 000 → **250 000**, `priceSec` 90 → **300** (5 minutes de revenu). Rien d'autre : les lingots déjà possédés ne changent pas, aucune migration, la sauvegarde v12 est intacte. Le texte d'aide du coffre (`hq-ui.js`) lit maintenant ces valeurs au lieu de les recopier.

## Mesures (`AUDIT=1 node tests/simulate.js`, colonne « ling » : prix d'un lingot en minutes de revenu)

| Moment | Avant | Après |
|---|---|---|
| 5 min | 174 min | 435 min |
| 15 min | 2,6 min | 6,5 min |
| 30 min et au-delà | 1,5 min | 5,0 min |

Coût d'une box en revenu (au-delà de 30 min) : Rue 7,5 → 25 min, Syndicat 22 → 75 min, Légende 60 min → 3,3 h. Coffre plein : 2,5 h → 8,3 h de revenu.

Rythme des gains gratuits inchangé : environ 3 à 4 lingots par jour de défis, plus 2 par type de braquage la première fois.

## Limites
- Mesure faite avec le joueur simulé (il dépense au lieu d'épargner) : elle donne le prix relatif, pas le comportement d'un vrai joueur.
- L'équilibre « rare mais pas avare » est une estimation : à ajuster avec de vrais retours de jeu.
