# Deuxième ville : pistes de généralisation (rien n'est implémenté)

État actuel : un petit encart « Brumevie · Bientôt disponible » (`js/teaser.js`) sur l'accueil de l'empire. C'est un affichage seul : aucun bouton, aucune logique, aucun état, aucune sauvegarde. Aucune date n'est promise.

Ce document liste, sans rien changer au jeu, ce qu'il faudrait généraliser pour accueillir une seconde ville. Il a été établi en cherchant dans le code ce qui suppose « une seule ville » (Port-Mirage, 8 quartiers, 4 factions rivales).

## 1. Données de la ville (aujourd'hui globales)
- `js/data.js` : `BL.data.territory.districts` (8 quartiers, « Port-Mirage ») et `BL.data.territory.factions` (4 factions). À transformer en `BL.data.cities[id] = { districts, factions, saga, name }`.
- `js/data-districts.js` : bâtiments de quartier, chaleur et revenus par quartier. Ils référencent des identifiants de quartier en dur (`center`, `port`…).
- `js/map-data.js` / `js/map-ui.js` / `js/venues.js` / `js/city.js` : la carte et les 12 lieux dessinés supposent la géométrie de Port-Mirage. Il faudrait une description de carte par ville (même format, un dessin par lieu).
- `js/atmos.js`, `js/ambience.js` : lieux sonores (`PLACES`) liés aux quartiers actuels.

## 2. État de partie (sauvegarde)
- `s.terr`, `s.fac`, `s.districts`, `s.rivals`, `s.war`, `s.saga` sont des singletons. Une deuxième ville demanderait `s.cities[id]` avec la ville active, ou un état par ville.
- Sauvegarde : prévoir une version suivante (v13) avec migration « v12 → ville unique devenue `cities.mirage` » et nettoyage strict par ville. Les éléments globaux (lingots, QG, boutique, succès, collections, prestige) restent partagés.
- Économie : `E.mults` multiplie déjà des modules indépendants ; chaque ville ajouterait son module (revenus par ville, coûts de lancement), sans toucher aux cibles de `docs/ECONOMIE_CIBLES.md`.

## 3. Rivaux et chaleur
- `js/rivals.js`, `js/war.js`, `js/factions.js` : personnalités, mémoire, coalitions et boss sont par faction. Les factions d'une autre ville devraient avoir leur propre mémoire (`s.rivals[ville]`).
- `js/heat.js` : la chaleur est unique. Décider si la chaleur est par ville (plus lisible) ou globale ; les descentes ciblent déjà un quartier.

## 4. Histoire
- `js/data-saga.js` : 6 chapitres liés à Port-Mirage (Valcourt, Corbeaux, Consortium, Lames). Une nouvelle ville aurait sa trame, ses fins et ses conséquences ; les fins déjà vues restent globales.
- `js/story.js` : textes narratifs sur la ville.

## 5. Interface
- Un sélecteur de ville (carte du monde) remplacerait l'encart actuel ; tant qu'il n'existe pas, rien ne doit être cliquable.
- Les écrans qui nomment « Port-Mirage » en dur sont à relire : fiches de quartier, assistante, glossaire, crédits.

## 6. Tests à prévoir
- Migration v12 → v13 (aller-retour, sauvegardes hostiles), simulation de durée avec deux villes, aucun mur > 30 min, accessibilité du sélecteur de ville.

Ce que ce chantier n'a PAS fait : aucune de ces généralisations, aucun test de multi-villes, aucune estimation de durée de développement.
