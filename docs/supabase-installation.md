# Installer le classement en ligne (Supabase) — pas à pas

Le classement est **facultatif**. Tant que tu ne fais rien ici, le jeu reste 100 % local : aucune connexion à Internet, aucun écran de classement.
Durée : environ 20 minutes. Tout est gratuit (offre gratuite de Supabase).

> Les noms exacts des menus de Supabase peuvent changer un peu avec le temps. Si un nom ne correspond pas, cherche le plus proche.

## Avant de commencer : à savoir
- Les joueurs n'ont **pas de compte** : ils choisissent seulement un pseudo. Aucun e-mail, aucun mot de passe.
- Ce qui est envoyé : pseudo, total d'argent gagné, niveau d'empire, version du jeu, date. Rien d'autre.
- Le jeu est ouvert à tous (mineurs compris) : ne rajoute **jamais** de champ libre, de chat ou d'e-mail sans repenser la protection des données.
- Le classement réduit la triche mais ne l'empêche pas complètement (le jeu tourne dans le navigateur du joueur). Surveille de temps en temps (voir « Modération »).
- Offre gratuite : un projet inactif peut être **mis en pause** par Supabase au bout d'une semaine sans activité. Le jeu affichera alors « Classement indisponible » et continuera de marcher. Tu peux le relancer depuis le site de Supabase.

## Étape 1 — Créer le projet
1. Va sur **supabase.com**, clique sur « Start your project » et connecte-toi avec GitHub.
2. Clique sur **New project**. Nom : `blackline`. Choisis un mot de passe de base de données (garde-le dans un coin, tu n'en auras pas besoin ensuite) et une région proche (par exemple « West EU (Paris) » ou « Frankfurt »).
3. Clique sur **Create new project** et attends 1 à 2 minutes.

## Étape 2 — Autoriser les connexions anonymes
1. Menu de gauche : **Authentication**.
2. Ouvre **Sign In / Providers** (ou « Providers » / « Settings » selon la version).
3. Active **Allow anonymous sign-ins** (« Autoriser les connexions anonymes ») et enregistre.
   C'est ce qui permet de jouer sans e-mail. Si tu l'oublies, le jeu affichera « Le classement n'est pas encore prêt côté serveur ».

## Étape 3 — Créer les tables et les protections
1. Menu de gauche : **SQL Editor**, puis **New query**.
2. Ouvre le fichier `docs/supabase.sql` du jeu, copie **tout** son contenu et colle-le dans l'éditeur.
3. Clique sur **Run**. Tu dois voir « Success. No rows returned ». Tu peux le relancer sans risque.
4. Vérifie dans **Table Editor** : trois tables `lb_players`, `lb_reports`, `lb_words`. Chacune doit afficher « RLS enabled ».

## Étape 4 — Récupérer l'adresse et la clé publique
1. Menu de gauche : **Project Settings** (roue crantée), puis **API** (ou « Data API » / « API Keys »).
2. Copie **Project URL** : elle ressemble à `https://abcdefghijklmnop.supabase.co`.
3. Copie la clé **anon public** (ou **Publishable key**) : une longue suite de caractères.
4. **Ne copie jamais** la clé **service_role** (ou « secret ») : elle donne tous les droits.

## Étape 5 — Relier le jeu
1. Ouvre le fichier `js/config-classement.js` avec le Bloc-notes.
2. Colle l'adresse entre les guillemets de `url` et la clé entre ceux de `anonKey`. Exemple :
   ```js
   url: "https://abcdefghijklmnop.supabase.co",
   anonKey: "eyJhbGciOi...",
   ```
3. Enregistre. Envoie le fichier sur GitHub (GitHub Desktop : « Commit to main » puis « Push origin »). Vercel republie le jeu tout seul.
4. Le jeu n'accepte que les adresses `https://….supabase.co`. Si tu utilises un nom de domaine personnalisé pour Supabase, il faudra aussi adapter `vercel.json` (ligne `connect-src`) et `js/leaderboard.js`.

## Étape 6 — Vérifier (indispensable : je n'ai pas pu le tester sur ton vrai serveur)
1. Ouvre ton jeu en ligne. Dans le menu **Histoire**, un onglet **Classement** doit apparaître.
2. Ouvre-le : tu vois l'explication et la case pseudo. Choisis un pseudo, clique sur **Activer le classement**.
3. Ton pseudo doit apparaître dans la liste avec ton score.
4. Ouvre le jeu dans **un autre navigateur** (ou une fenêtre privée), choisis un autre pseudo : les deux joueurs doivent se voir.
5. Dans Supabase, **Table Editor > lb_players** : tu dois voir tes deux lignes (et seulement : identifiant technique, pseudo, scores, dates).
6. Teste « Se retirer et effacer mes données » : la ligne doit disparaître.

Si quelque chose ne marche pas, ouvre la console du navigateur (touche F12, onglet « Réseau ») et regarde la réponse rouge du serveur.

| Message dans le jeu | Cause probable |
|---|---|
| « Le classement n'est pas encore prêt côté serveur » | Connexions anonymes non activées (étape 2) |
| « Classement indisponible » | Projet en pause, mauvaise adresse, ou pas de connexion Internet |
| « Connexion au classement impossible » | Mauvaise clé publique (étape 4) |
| « Le serveur du classement ne répond pas comme prévu » | Le SQL n'a pas été exécuté en entier (étape 3) |

## Modération
Dans **SQL Editor**, exemples :
```sql
-- Les plus signalés
select name, reports, hidden from public.lb_players order by reports desc limit 20;
-- Masquer / réafficher / supprimer un pseudo
update public.lb_players set hidden = true  where name = 'LePseudo';
update public.lb_players set hidden = false, reports = 0 where name = 'LePseudo';
delete from public.lb_players where name = 'LePseudo';
-- Ajouter un mot interdit (« sub » = n'importe où, « exact » = mot entier)
insert into public.lb_words values ('motinterdit', 'sub') on conflict do nothing;
```
Un pseudo est masqué automatiquement à 5 signalements de joueurs différents. La liste de mots interdits fournie est une **liste de départ** : complète-la. Si tu ajoutes un mot, ajoute-le aussi dans `js/leaderboard-core.js` (listes `SUB` / `EXACT`) pour que le jeu prévienne le joueur tout de suite ; le serveur a toujours le dernier mot.

## Remettre le classement à zéro
```sql
delete from public.lb_players;   -- efface tous les profils et signalements
```

## Confidentialité (à compléter par toi)
Le jeu affiche un texte de confidentialité sur la page Classement. Complète-le avec **ton identité d'éditeur et un moyen de contact** (dans `js/leaderboard-ui.js`, constante `PRIV`). Ce texte et ce guide ne sont **pas un avis juridique** : si tu vises un public large (mineurs compris), renseigne-toi sur le RGPD et sur les règles de protection des mineurs applicables à ton jeu.
Les joueurs peuvent effacer leurs données à tout moment depuis la page Classement. Si un joueur perd son navigateur sans s'être retiré, son profil reste sur le serveur : tu peux le supprimer à la main (commande ci-dessus).

## Sécurité : ce que fait la configuration
- Les tables ne sont **pas** accessibles directement : tout passe par des fonctions SQL qui vérifient le pseudo, le score (plafond, fréquence, valeurs absurdes), les signalements.
- Seule la clé publique est dans le jeu. Elle ne permet rien d'autre que d'appeler ces fonctions.
- `vercel.json` ajoute une politique de sécurité (CSP) qui n'autorise que ton site et `*.supabase.co`.
- Limites connues : un tricheur déterminé peut envoyer des scores plausibles ; un même joueur peut créer plusieurs profils anonymes (un par navigateur) ; Supabase limite les créations de comptes anonymes par adresse IP (réglable dans Authentication > Rate limits).
