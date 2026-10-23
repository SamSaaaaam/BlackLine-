/* « Deuxième ville : bientôt disponible » (Partie 13 · C10) — AFFICHE SEULEMENT. Aucune logique de jeu, aucun état, aucune sauvegarde, rien de cliquable.
   La ville est fictive. Aucune date n'est promise. Les pistes de généralisation du code sont dans docs/DEUXIEME_VILLE.md. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, host = null;
  var SKY = '<svg viewBox="0 0 240 90" class="tz-sky" aria-hidden="true" focusable="false"><defs><linearGradient id="tzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2740"/><stop offset="1" stop-color="#0b0f18"/></linearGradient></defs><rect width="240" height="90" fill="url(#tzg)"/><circle cx="196" cy="22" r="9" fill="#d9dfef" opacity=".85"/><path d="M0 90V62l12-4v-10l10-5 6 6 8-4v18l10-3V44l9-6 9 6v22l8-2V50l14-8 4 6 10-2v20l12-4V38l8-6 8 6v26l10-4V54l12-6 6 6 10-3v24z" fill="#070a11"/><path d="M0 90V74l16-4 10 4 14-6 12 6 18-5 12 5 16-7 14 7 18-6 14 5 20-6 16 6 20-5 10 3v20z" fill="#04060a"/>' +
    '<g fill="#e3c680" opacity=".75"><rect x="30" y="58" width="2" height="3"/><rect x="38" y="64" width="2" height="3"/><rect x="74" y="50" width="2" height="3"/><rect x="96" y="56" width="2" height="3"/><rect x="120" y="46" width="2" height="3"/><rect x="132" y="60" width="2" height="3"/><rect x="158" y="52" width="2" height="3"/><rect x="176" y="58" width="2" height="3"/></g></svg>';
  function html() {
    return '<div class="tz-pic">' + SKY + '</div><div class="tz-txt"><small>Villes</small><h3>Brumevie</h3><span class="tz-soon">Bientôt disponible</span><p>Une autre ville, d’autres familles. Ici, les fenêtres sont encore éteintes.</p></div>';
  }
  /* S'installe en bas de l'accueil de l'empire, sans bouton ni lien : un simple affichage. */
  function mount() {
    var v = doc && doc.getElementById("v_dash"); if (!v) return false; if (host && host.isConnected) return true;
    host = doc.createElement("aside"); host.className = "card teaser"; host.id = "cityTeaser"; host.setAttribute("aria-label", "Deuxième ville, bientôt disponible"); host.innerHTML = html(); v.appendChild(host); return true;
  }
  function init() { }
  function update() { if (!host || !host.isConnected) mount(); }
  BL.teaser = { init: init, update: update, html: html };
})(typeof globalThis !== "undefined" ? globalThis : this);
