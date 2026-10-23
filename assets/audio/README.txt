MUSIQUE ET EFFETS SONORES
=========================

Par défaut, le jeu n'a besoin d'aucun fichier : la musique du menu, la musique de la ville
et les effets (clic, achat, réussite, erreur) sont synthétisés par le code (js/audio.js).

Pour utiliser tes propres sons :
1. Dépose ici des fichiers dont tu as le droit d'usage (créés par toi, ou libres de droits avec une licence
   qui autorise l'utilisation dans un jeu : CC0, CC-BY avec crédit, achetés avec licence...) :
     menu-music.mp3   boucle de musique du menu (ambiance jazz sombre / hip-hop instrumental, 1 à 3 min)
     game-music.mp3   boucle de musique en jeu (plus discrète, rythmée mais pas envahissante)
     ui-click.mp3     clic court (moins de 0,2 s)
     purchase.mp3     achat / amélioration (moins de 1 s)
2. Ouvre js/audio.js et remplace  var USE_FILES = false;  par  var USE_FILES = true;
3. Recharge la page. Si un fichier manque, le jeu retombe sur la version synthétisée de ce son.

Sites de sons libres : freesound.org, pixabay.com/music, opengameart.org, incompetech.com.
Vérifie toujours la licence de chaque morceau, et note les crédits si elle l'exige.
N'utilise pas de musique commerciale connue sans autorisation.


MUSIQUES DE LA RADIO (assets/audio/radio/)
==========================================
Pistes fournies par le propriétaire du projet, ré-encodées en MP3 128 kbit/s stéréo 44,1 kHz (poids réduit pour GitHub Pages).
Titre et auteur sont déduits du nom de fichier d'origine.
  night-summer-lounge.mp3          Night Summer Lounge, Bransboynd
  jazz-club-new-orleans.mp3        The Best Jazz Club in New Orleans, PaoloArgento
  vlog-beat.mp3                    Vlog Beat, Vaitsez
  atlasaudio-jazz-music-617577.mp3 Jazz Music, AtlasAudio
  aurec-night-jazz-604811.mp3      Night Jazz, Aurec
  coma-media-jazzy-abstract-beat-chops-11254.mp3  Jazzy Abstract Beat (Chops), Coma-Media
  dayfox-weeknds-122592.mp3        Weeknds, Dayfox
Stations : Night Lounge FM (Night Summer Lounge, Weeknds), Bourbon Jazz (3 jazz), Beat Street (Vlog Beat, Jazzy Abstract Beat),
Blackline Mix (les 7 pistes en rotation).
LICENCE À VÉRIFIER PAR LE PROPRIÉTAIRE DU PROJET AVANT PUBLICATION : les noms de fichiers évoquent des banques de musique libres
(type Pixabay), mais la licence de chaque piste n'a pas été confirmée ici. Conserve la preuve de licence et ajoute les crédits si elle l'exige.

Poids total des 7 morceaux de radio : environ 14,9 Mo (dont ~9,2 Mo pour les 4 ajoutés en Partie 7).


AMBIANCE DE VILLE (radio coupée)
================================
Quand la station « Radio coupée » est choisie, le jeu joue un fond sonore de ville : circulation, vent, pluie selon la météo de la carte,
voitures qui passent, sirène lointaine la nuit, oiseaux le jour. Tout est SYNTHÉTISÉ par le code (js/ambience.js, Web Audio) :
aucun fichier audio, donc aucune licence à gérer. Réglages : « Ambiance de ville » et « Volume de l'ambiance » (Paramètres > Audio).
Le chargement de vrais enregistrements d'ambiance n'est pas implémenté. Les pistes de la radio (assets/audio/radio/) sont celles
des parties précédentes ; leurs licences restent à vérifier par toi (voir plus haut).
