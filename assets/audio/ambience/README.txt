AMBIANCES DE VILLE (facultatif)
================================
Par défaut, toutes les ambiances (trafic, vent, pluie, vagues du port, mouettes, corne de brume, atelier industriel, basses de club la nuit)
sont SYNTHÉTISÉES par js/ambience.js : aucun fichier, aucune licence.

Pour utiliser tes propres enregistrements : dépose-les ici (mp3/ogg/wav, boucles sans coupure audible) puis crée
assets/audio/ambience/manifest.js avec, par exemple :

  window.BL_AMBIENCE_FILES = {
    rain:  { file: "assets/audio/ambience/rain.ogg",  license: "CC0",   source: "freesound.org/…/rain" },
    water: { file: "assets/audio/ambience/water.ogg", license: "CC-BY 4.0 — Auteur", source: "…" }
  };

et ajoute <script src="assets/audio/ambience/manifest.js"></script> avant js/ambience.js dans index.html.
Couches possibles : rain, water, wind, rumble, bustle.
RÈGLE : une entrée SANS licence ET sans source est ignorée (rien n'est chargé). Si un fichier est introuvable, la synthèse prend le relais.
Ne mets jamais un enregistrement dont tu ne connais pas la licence.
