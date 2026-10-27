# Lancer BLACKLINE

## Sur ton ordinateur
1. Dézippe `blackline.zip`.
2. Double-clique sur `index.html` : le jeu s'ouvre dans ton navigateur (Chrome, Edge, Firefox, Safari récents). Aucun serveur, aucun compte, aucune connexion nécessaires.
3. La progression est enregistrée **dans ton navigateur** (stockage local). Menu principal → **Exporter** pour en garder une copie ; **Importer** pour la reprendre ailleurs.

Un rappel s'affiche si tu n'as pas exporté depuis plus de 7 jours (« Plus tard » le repousse de 2 jours). Crédits et licences : menu → quitter → « Crédits et licences » (`about.html`).

Si le navigateur refuse d'enregistrer (navigation privée, stockage désactivé), une alerte s'affiche en haut de page : utilise alors « Exporter » avant de fermer.

## Mettre le jeu en ligne gratuitement (GitHub Pages)
1. Crée un compte sur github.com, puis **New repository** (public), nom au choix, par exemple `blackline`.
2. Dans le dépôt : **Add file → Upload files**, glisse **tout le contenu du dossier `blackline`** (le fichier `index.html` doit être à la racine du dépôt, pas dans un sous-dossier). N'oublie pas le fichier caché `.nojekyll` (il est dans le zip ; s'il manque, crée un fichier vide de ce nom). Valide avec **Commit changes**.
3. **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`, **Save**.
4. Après 1 à 2 minutes, le jeu est à l'adresse `https://TON-PSEUDO.github.io/blackline/`.
5. Pour mettre à jour : renvoie les fichiers modifiés (**Upload files** écrase les anciens), attends la republication, puis recharge avec `Ctrl+F5`.

Points à savoir :
- Les sauvegardes sont **par adresse** : une partie faite en ouvrant `index.html` sur ton ordinateur n'apparaît pas sur le site. Passe par Exporter / Importer.
- La partie ne quitte jamais le navigateur. Seul le classement en ligne (facultatif, `js/config-classement.js`) contacte un serveur : lecture du top 10 à l'ouverture du menu (coupable dans Paramètres), et envoi du score seulement si le joueur l'active.
- Les dossiers `tests/`, `docs/` et `shots/` ne servent pas en ligne : tu peux ne pas les envoyer (poids déployé ≈ 15 Mo).
- Avant de publier, vérifie que `about.html` et `assets/share.png` (image de partage) sont bien envoyés avec le reste ; `og:image` est relatif, donc certains réseaux sociaux n'afficheront l'image qu'avec une adresse absolue (à ajuster dans `index.html` après avoir choisi ton adresse).
- Vérification automatique avant de publier : `node tests/pages-ready.test.js` (chemins relatifs, casse des noms de fichiers, aucune requête réseau).
