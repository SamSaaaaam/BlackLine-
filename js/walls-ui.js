/* Décors de ville : onglet « Fonds de ville » de la boutique, aperçu avant achat, et application du fond choisi (écran d'accueil, QG, cadre de la carte).
   Purement visuel : aucune règle ici (tout passe par BL.walls). Les images sont statiques (SVG dessinés par le code), jamais animées. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, W, A, D, h, u, S = null, set = null, sig = "", pv = null, built = false, opener = null;
  function $(id) { return doc.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lg(n) { return n + " lingot" + (n > 1 ? "s" : ""); }

  /* ---------- application du fond choisi ---------- */
  function layer(parent, key) {
    var l = parent.querySelector(":scope > .wallbg"); if (!l) { l = doc.createElement("div"); l.className = "wallbg"; l.setAttribute("aria-hidden", "true"); l.innerHTML = '<img alt="" decoding="async"><div class="wallveil"></div>'; parent.insertBefore(l, parent.firstChild); } return l;
  }
  function paint(parent, w, on) {
    if (!parent) return; var l = parent.querySelector(":scope > .wallbg");
    if (!on || !w) { if (l) l.remove(); parent.classList.remove("has-wall"); parent.style.removeProperty("--wallacc"); return; }
    l = layer(parent); var im = l.querySelector("img"), src = A.url(w.id); if (im.getAttribute("src") !== src) im.src = src; l.style.setProperty("--veil", w.veil); l.dataset.wall = w.id; parent.classList.add("has-wall"); parent.style.setProperty("--wallacc", w.acc);
  }
  function apply() {
    if (!S || !W) return; var w = W.current(S), home = $("menu") || doc.querySelector(".menu"), hq = $("room"), map = $("mapWrap"), use = W.use(set);
    paint(home, w, !!w && W.showHome(set)); paint(hq, w, !!w && W.showHq(set));
    if (map) { map.classList.toggle("wallframe", !!w && use !== "off"); if (w && use !== "off") map.style.setProperty("--wallacc", w.acc); else map.style.removeProperty("--wallacc"); }
  }
  function hqOn() { return !!(S && W && W.current(S) && W.showHq(set)); }

  /* ---------- onglet de la boutique ---------- */
  function card(w) {
    var own = W.owned(S, w.id), eq = W.current(S) && W.current(S).id === w.id, can = S.gold >= w.cost, R = D.RCOL[w.rar];
    var b = eq ? '<button class="btn" data-act="wunequip" data-id="' + w.id + '">Retirer</button>' : own ? '<button class="btn can" data-act="wequip" data-id="' + w.id + '">Équiper</button>' : '<button class="btn ' + (can ? "can" : "") + '" data-act="wbuy" data-id="' + w.id + '"' + (can ? "" : " disabled") + ">" + (can ? "Acheter · " + w.cost : "Il te manque " + (w.cost - S.gold)) + "</button>";
    return '<article class="wlc' + (eq ? " eq" : "") + '" style="--rc:' + R + '" data-wall="' + w.id + '"><button type="button" class="wlth" data-act="wprev" data-id="' + w.id + '" aria-label="Aperçu : ' + esc(w.name) + '"><img src="' + A.url(w.id) + '" alt="" decoding="async"><span class="wlbd" style="color:' + R + '">' + cap(D.RAR[w.rar]) + "</span>" + (eq ? '<span class="wleq">Équipé</span>' : "") + '</button>'
      + '<div class="wlb"><b>' + esc(w.name) + '</b><small>' + esc(w.desc) + '</small><span class="wlp">' + (own ? "Possédé" : lg(w.cost)) + '</span><div class="wlbtn">' + b + '<button class="btn ghost" data-act="wprev" data-id="' + w.id + '">Aperçu</button></div></div></article>';
  }
  function html(s) {
    S = s; var use = W.use(set), opts = D2().USES.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === use ? " selected" : "") + ">" + o[1] + "</option>"; }).join("");
    return '<p class="rnote">Des <b>fonds de ville</b> dessinés pour ton jeu : purement décoratifs, ils ne changent <b>aucun revenu ni aucune règle</b>. Équipe-en un pour l’écran d’accueil, le QG et le cadre de la carte. Plus la rareté est haute, plus la scène est riche.</p>'
      + '<label class="opt wlopt"><span class="ot"><b>Où afficher ton décor</b><small>Réglage aussi disponible dans les paramètres.</small></span><select class="sel" data-wsel aria-label="Où afficher ton décor">' + opts + '</select></label>'
      + '<div class="wlgrid">' + W.list().slice().sort(function (a, b) { return a.rar - b.rar || a.cost - b.cost; }).map(card).join("") + "</div>";
  }
  function D2() { return BL.data.walls; }

  /* ---------- aperçu plein cadre avant achat ---------- */
  function build() {
    if (built || !$("app")) return; built = true; var d = doc.createElement("div"); d.id = "wallpv"; d.className = "wlpv"; d.hidden = true; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Aperçu du décor");
    d.innerHTML = '<div class="wallbg"><img alt="" decoding="async"><div class="wallveil"></div></div><div class="wlpv-in"><h2 id="wlpvT"></h2><p id="wlpvD"></p><div class="wlpv-demo" aria-hidden="true"><b>BLACKLINE</b><span>Underworld Empire</span><small>Voici comment le texte se lira sur ce fond.</small></div><div class="wlpv-btns" id="wlpvB"></div></div>';
    doc.body.appendChild(d); d.addEventListener("click", onPv); d.addEventListener("keydown", function (e) {
      if (!pv) return; if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePv(); return; }
      if (e.key === "Tab") { var f = [].slice.call(d.querySelectorAll("button:not([disabled])")); if (!f.length) return; var i = f.indexOf(doc.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
  }
  function pvButtons() {
    var w = W.find(pv), own = W.owned(S, pv), eq = W.current(S) && W.current(S).id === pv, can = S.gold >= w.cost;
    $("wlpvB").innerHTML = (eq ? '<button class="btn" data-w="unequip">Retirer ce décor</button>' : own ? '<button class="btn can" data-w="equip">Équiper</button>' : '<button class="btn ' + (can ? "can" : "") + '" data-w="buy"' + (can ? "" : " disabled") + ">" + (can ? "Acheter · " + w.cost : "Il te manque " + (w.cost - S.gold)) + "</button>") + '<button class="btn ghost" data-w="close">Fermer</button>';
  }
  function openPv(id, from) {
    var w = W.find(id); if (!w) return; build(); pv = id; opener = from || null; var d = $("wallpv"), l = d.querySelector(".wallbg"); l.querySelector("img").src = A.url(id); l.style.setProperty("--veil", w.veil);
    $("wlpvT").textContent = w.name + " · " + cap(D.RAR[w.rar]); $("wlpvD").textContent = w.desc; d.style.setProperty("--rc", D.RCOL[w.rar]); pvButtons(); d.hidden = false; $("app").inert = true;
    var f = d.querySelector("button:not([disabled])"); if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function closePv() { if (!pv) return; pv = null; var d = $("wallpv"); d.hidden = true; $("app").inert = false; var o = opener; opener = null; if (o && doc.body.contains(o)) try { o.focus({ preventScroll: true }); } catch (e) {} if (BL.shopUI) BL.shopUI.render(); }
  function onPv(e) {
    var b = e.target.closest("[data-w]"); if (!b || b.disabled || !pv) return; var k = b.dataset.w, id = pv;
    if (k === "close") closePv(); else if (k === "buy") { if (h.wallBuy(id)) { pvButtons(); apply(); } } else if (k === "equip") { h.wallEquip(id); pvButtons(); apply(); } else if (k === "unequip") { h.wallUnequip(); pvButtons(); apply(); }
    if (BL.shopUI) BL.shopUI.render();
  }
  function act(a, id, from) {
    if (a === "wprev") openPv(id, from); else if (a === "wbuy") { var w = W.find(id); BL.sysUI.modal({ title: "Acheter « " + w.name + " » ?", text: "Ce décor coûte " + lg(w.cost) + ". Tu as " + lg(S.gold) + ". Il est purement décoratif.", ok: "Acheter · " + w.cost, onOk: function () { h.wallBuy(id); apply(); if (BL.shopUI) BL.shopUI.render(); } }); }
    else if (a === "wequip") { h.wallEquip(id); apply(); } else if (a === "wunequip") { h.wallUnequip(); apply(); }
  }
  function update(s) { S = s; if (!W) return; var w = W.current(s), k = (w ? w.id : "") + "|" + W.use(set) + "|" + (set && set.fx); if (k !== sig) { sig = k; apply(); } }
  function setUse(s) { set = s; sig = ""; apply(); }
  function init(handlers, util) {
    W = BL.walls; A = BL.wallsArt; D = BL.data.equip; h = handlers; u = util; build();
    var v = $("v_shop"); if (v) v.addEventListener("change", function (e) { if (e.target && e.target.matches && e.target.matches("[data-wsel]")) h.setting("wall", e.target.value); });
    var home = $("menu") || doc.querySelector(".menu"); if (home) { /* le menu peut déjà être construit */ }
  }
  BL.wallsUI = { init: init, html: html, update: update, setUse: setUse, apply: apply, act: act, hqOn: hqOn, openPreview: openPv, closePreview: closePv, _dbg: function () { var home = doc.querySelector(".menu"), hq = $("room"), map = $("mapWrap"); return { pv: pv, home: home ? (home.querySelector(":scope > .wallbg") || {}).dataset && home.querySelector(":scope > .wallbg").dataset.wall || "" : "", hq: hq && hq.querySelector(":scope > .wallbg") ? hq.querySelector(":scope > .wallbg").dataset.wall : "", frame: !!(map && map.classList.contains("wallframe")), use: W ? W.use(set) : "" }; } };
})(window);
