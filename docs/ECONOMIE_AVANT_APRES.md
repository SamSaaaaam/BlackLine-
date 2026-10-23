# Économie · avant / après (Partie 12 · C7)

Prix en **minutes de revenu net** : médiane (min–max) de ce que le joueur optimisé se voit proposer. Simulation complète (activités, bâtiments, améliorations, équipe, quartiers, événements), graine 1. « — » : rien à acheter dans la catégorie à ce moment.

| Catégorie | 15 min | 1 h | 4 h | 8 h | 24 h |
|---|---|---|---|---|---|
| **Niveau d'activité** avant | 0.2 (0.2–1.1) | 0.1 (0.1–0.2) | 0.6 (0.5–0.9) | 7.3 (6.8–9.5) | 22 (16–22) |
| Niveau d'activité après | 0.2 (0.1–1.0) | 0.1 (0.1–0.4) | 0.9 (0.9–1.6) | 7.4 (7.4–7.5) | 11 (11–11) |
| **Bâtiment annexe** avant | 0.4 (0.4–0.4) | — | 0.9 (0.9–0.9) | — | — |
| Bâtiment annexe après | 0.3 (0.2–0.3) | 0.3 (0.3–0.3) | 1.0 (1.0–1.0) | — | — |
| **Bâtiment de quartier** avant | 17 (10–67) | 17 (10–67) | 17 (10–67) | 17 (10–67) | 17 (10–67) |
| Bâtiment de quartier après | 8.3 (5.0–33) | 8.3 (5.0–33) | 8.3 (5.0–33) | 8.3 (5.0–33) | 8.3 (5.0–33) |
| **Équipement commun** avant | 0.5 (0.5–0.7) | 0.5 (0.5–0.7) | 0.5 (0.5–0.7) | 0.5 (0.5–0.7) | 0.5 (0.5–0.7) |
| Équipement commun après | 0.3 (0.3–0.4) | 0.3 (0.3–0.4) | 0.3 (0.3–0.4) | 0.3 (0.3–0.4) | 0.3 (0.3–0.4) |
| **Équipement rare** avant | 2.9 (2.7–3.2) | 2.9 (2.7–3.2) | 2.9 (2.7–3.2) | 2.9 (2.7–3.2) | 2.9 (2.7–3.2) |
| Équipement rare après | 1.8 (1.7–2.0) | 1.8 (1.7–2.0) | 1.8 (1.7–2.0) | 1.8 (1.7–2.0) | 1.8 (1.7–2.0) |
| **Extension Arsenal (1re)** avant | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 |
| Extension Arsenal (1re) après | 3.3 | 3.3 | 3.3 | 3.3 | 3.3 |
| **Recrue** avant | — | 2.1 (2.1–2.1) | — | — | — |
| Recrue après | 1.3 (1.3–1.3) | 0.6 (0.2–0.6) | — | — | — |
| **Prise de quartier** avant | 1.7 (1.7–1.7) | 0.4 (0.1–5.3) | — | — | — |
| Prise de quartier après | 6.5 (1.5–6.5) | 3.3 (0.6–3.3) | — | — | — |
| **Amélioration** avant | 1.4 (0.2–6.9) | — | — | — | — |
| Amélioration après | 1.2 (0.2–6.2) | — | — | — | — |

Revenu net par seconde (même simulation) :

| | 15 min | 1 h | 4 h | 8 h | 24 h |
|---|---|---|---|---|---|
| avant | 580/s | 468.1k/s | 132.0M/s | 276.5M/s | 366.3M/s |
| après | 645/s | 4.0M/s | 325.7M/s | 903.5M/s | 1.9Md/s |

## Les réglages modifiés

| Réglage | Avant | Après |
|---|---|---|
| Coût des niveaux 26 à 50 d'une activité (`balance.lateGrowthAdd`) | croissance +0,25 par niveau | +0,05 |
| Bâtiments de quartier (`costSec`) | 600 à 4 000 s de revenu | moitié (300 à 2 000 s) |
| Supplément par bâtiment déjà construit (`perBuiltGrowth`) | +35 % | +20 % |
| Unité de prix de l'Arsenal (`unitIncomeSec`) | 40 s de revenu | 25 s |
| Extension de capacité de l'Arsenal | 12 unités × 2^niveau (8 à 256 min) | 8 unités × 1,7^niveau (3 à 47 min) |

**Inchangés volontairement :** prix du lingot (90 s de revenu : un boost rapporte 75–90 s par lingot, baisser ce prix créerait une boucle de gain argent → lingot → boost → argent), prix en lingots de la boutique et du QG, objets épiques de l'Arsenal (au moins 22 lingots : ils restent liés aux box), coûts des recrues et de la formation (déjà ≤ 5 min de revenu).
