/* Partie 17 · A : classement visible dès l'accueil (menu principal), sans bouton.
   Ordinateur (≥ 1000 px) : top 10 dans une colonne à droite des boutons. Téléphone : carte « Top 5 » repliable sous les boutons (ouverte par défaut).
   Lecture publique via BL.lb.publicBoard (une requête GET, clé publique seulement, cache 60 s). Absent si le classement n'est pas configuré
   ou si le réglage « Afficher le classement sur l'accueil » (settings.lbhome) est coupé. Aucun appel tant que le menu n'est pas affiché. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, host = null, scope = "week", open = true, timer = 0, shown = false, st = { state: "idle", rows: [], sc: "" }, seq = 0, EVERY = 60000;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sett() { return BL.menu && BL.menu.settings ? BL.menu.settings() : BL.main && BL.main.settings ? BL.main.settings() : {}; }
  function wanted() { return !!(BL.lb && BL.lb.configured() && sett().lbhome === true); }   /* réglage inconnu = rien n'est affiché ni demandé */
  function money(n) { return BL.ui && BL.ui.money ? BL.ui.money(n) : String(Math.floor(n)); }
  var CROWN = '<svg class="mlb-crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-7-3 7-4.5-4z"/></svg>';

  function rowsHtml() {
    if (st.state === "load") { var sk = ""; for (var i = 0; i < 10; i++) sk += '<li class="mlb-row sk" aria-hidden="true"><span class="mlb-rk"></span><span class="mlb-nm"><i></i></span><span class="mlb-sc"><i></i></span></li>'; return sk; }
    if (st.state === "err") return '<li class="mlb-msg">Classement indisponible pour l’instant.</li>';
    if (!st.rows.length) return '<li class="mlb-msg">Aucun joueur pour l’instant — sois le premier.</li>';
    return st.rows.map(function (r) {
      var pod = r.rank >= 1 && r.rank <= 3 ? r.rank : 0, medal = ["", "1re place, or", "2e place, argent", "3e place, bronze"][pod];
      return '<li class="mlb-row' + (pod ? " p" + pod : "") + '"><span class="mlb-rk">' + r.rank + (pod ? '<span class="sr"> ' + medal + "</span>" : "") + '</span><span class="mlb-nm">' + (pod === 1 ? CROWN : "") + '<b>' + esc(r.name) + '</b><small>Niv. ' + r.level + '</small></span><span class="mlb-sc">' + esc(money(r.score)) + "</span></li>";
    }).join("");
  }
  function tabs() { return [["week", "Cette semaine"], ["all", "Tout temps"]].map(function (t) { return '<button type="button" class="mlb-tab" role="tab" data-sc="' + t[0] + '" aria-selected="' + (scope === t[0]) + '" tabindex="' + (scope === t[0] ? 0 : -1) + '">' + t[1] + "</button>"; }).join(""); }
  function paint() {
    if (!host) return;
    host.innerHTML = '<div class="mlb-h"><h2 id="mlbT">' + CROWN + '<span class="mlb-t10">Top 10</span><span class="mlb-t5">Top 5</span> <small>des parrains</small></h2>'
      + '<button type="button" class="mlb-tog" aria-expanded="' + open + '" aria-controls="mlbBody">' + (open ? "Replier" : "Afficher") + '</button></div>'
      + '<div class="mlb-body" id="mlbBody"' + (open ? "" : " hidden") + '><div class="mlb-tabs" role="tablist" aria-label="Période du classement">' + tabs() + '</div>'
      + '<ol class="mlb-rows" aria-busy="' + (st.state === "load") + '" aria-label="Meilleurs joueurs">' + rowsHtml() + '</ol>'
      + '<button type="button" class="mlb-more">Voir tout · Rejoindre le classement</button></div>';
  }
  function load(force) {
    if (!host || !shown || !wanted() || (doc && doc.hidden)) return;
    var my = ++seq, sc = scope; if (!(st.sc === sc && (st.state === "ok" || st.state === "err"))) { st = { state: "load", rows: [], sc: sc }; paint(); }   /* squelette seulement au premier chargement d'une période */
    BL.lb.publicBoard(sc).then(function (r) { if (my !== seq || !host) return; st = { state: r.ok ? "ok" : "err", rows: r.rows || [], sc: sc }; paint(); });
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("button"); if (!b || !host.contains(b)) return;
    if (b.classList.contains("mlb-tab")) { var n = b.dataset.sc === "all" ? "all" : "week"; if (n !== scope) { scope = n; load(true); } var t = host.querySelector('.mlb-tab[aria-selected="true"]'); if (t) t.focus(); }
    else if (b.classList.contains("mlb-tog")) { open = !open; paint(); var g = host.querySelector(".mlb-tog"); if (g) g.focus(); }
    else if (b.classList.contains("mlb-more")) { if (BL.audio) BL.audio.sfx("open"); if (BL.menu) BL.menu.openSheet("board"); }
  }
  function onKey(e) { if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.target.classList && e.target.classList.contains("mlb-tab")) { var o = host.querySelector('.mlb-tab[aria-selected="false"]'); if (o) { e.preventDefault(); o.click(); } } }
  /* crée ou retire le panneau selon la configuration et le réglage */
  function mount(box, after) {
    var want = wanted();
    if (!want) { if (host) { host.remove(); host = null; } return null; }
    if (!host) { host = doc.createElement("section"); host.className = "mlb"; host.setAttribute("aria-labelledby", "mlbT"); host.addEventListener("click", onClick); host.addEventListener("keydown", onKey); paint(); }
    if (box && host.parentNode !== box) { if (after && after.parentNode === box) box.insertBefore(host, after.nextSibling); else box.appendChild(host); }
    return host;
  }
  function tick() { if (shown) load(false); }
  function show() { shown = true; sync(); clearInterval(timer); timer = setInterval(tick, EVERY); load(false); }
  function hide() { shown = false; clearInterval(timer); timer = 0; }
  /* appelé quand un réglage change : le panneau apparaît ou disparaît sans recharger le menu */
  function sync() { var box = doc && doc.querySelector("#menu .mmain"); if (!box) return; var had = !!host; mount(box, box.querySelector(".mnav")); if (host && !had && shown) load(false); }
  if (doc) doc.addEventListener("visibilitychange", function () { if (!doc.hidden && shown) load(false); });
  BL.lbHome = { mount: mount, show: show, hide: hide, sync: sync, tick: tick, _state: function () { return { shown: shown, present: !!host, state: st.state, rows: st.rows.length, scope: scope, open: open }; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
