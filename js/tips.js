/* Infobulles : survol (bureau), focus clavier, appui long ou petite icône « ? » (mobile). Une seule bulle à la fois. Texte tiré du glossaire (BL.glossary).
   Utilisation : BL.tip.bind(el, "income_net") ; BL.tip.decorate(conteneur, "span.lab", {qm:"touch"}) ; BL.tip.dynamic("income_net", fn) pour ajouter une ligne calculée. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, G = function () { return BL.glossary; };
  var shownAt = 0, enabled = true, box = null, cur = null, showT = 0, pressT = 0, hideT = 0, dyn = {}, pdx = 0, pdy = 0;
  function body(key) {
    var g = G() && G().get(key), extra = dyn[key] ? safe(dyn[key]) : "";
    if (g) return { term: g.term, text: g.text, extra: extra };
    return { term: "", text: String(key), extra: extra };
  }
  function safe(f) { try { return f() || ""; } catch (e) { return ""; } }
  function ensure() {
    if (box || !doc) return box;
    box = doc.createElement("div"); box.id = "tipx"; box.className = "tipx"; box.setAttribute("role", "tooltip"); box.hidden = true; doc.body.appendChild(box); return box;
  }
  function place(t) {
    var r = t.getBoundingClientRect(), vw = doc.documentElement.clientWidth, vh = doc.documentElement.clientHeight, w = box.offsetWidth, h = box.offsetHeight;
    var x = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2)), y = r.bottom + 8; if (y + h > vh - 8) y = Math.max(8, r.top - h - 8);
    box.style.left = x + "px"; box.style.top = y + "px";
  }
  function show(t) {
    if (!ensure() || !t) return; var key = t.getAttribute("data-tip"); if (!key) return; clearTimeout(showT); clearTimeout(hideT);
    var b = body(key); box.innerHTML = (b.term ? "<b>" + esc(b.term) + "</b>" : "") + "<span>" + esc(b.text) + "</span>" + (b.extra ? "<i>" + esc(b.extra) + "</i>" : "");
    box.hidden = false; shownAt = Date.now(); cur = t; box.id = "tipx"; t.setAttribute("aria-describedby", "tipx"); place(t);
    if (root.matchMedia && root.matchMedia("(hover: none)").matches) hideT = setTimeout(hide, 6000);
  }
  function hide() { clearTimeout(showT); clearTimeout(hideT); if (box) box.hidden = true; if (cur) { cur.removeAttribute("aria-describedby"); cur.classList.remove("tipon"); } cur = null; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function target(e) { var n = e.target; return n && n.closest ? n.closest("[data-tip]") : null; }
  function bindGlobal() {
    if (!doc || doc.__tipx) return; doc.__tipx = true;
    doc.addEventListener("pointerover", function (e) { if (!enabled || e.pointerType === "touch") return; var t = target(e); if (!t) return; clearTimeout(showT); showT = setTimeout(function () { show(t); }, 180); });
    doc.addEventListener("pointerout", function (e) { if (e.pointerType === "touch") return; var t = target(e); if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) { clearTimeout(showT); hide(); } });
    doc.addEventListener("focusin", function (e) { var t = target(e); if (t && enabled) show(t); });
    doc.addEventListener("focusout", function (e) { if (target(e)) hide(); });
    doc.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "touch") { if (cur && !target(e)) hide(); return; }
      var t = target(e); if (!t || !enabled) { hide(); return; } pdx = e.clientX; pdy = e.clientY; clearTimeout(pressT); pressT = setTimeout(function () { show(t); t.__tipLong = Date.now(); }, 450);
    });
    ["pointerup", "pointercancel"].forEach(function (n) { doc.addEventListener(n, function () { clearTimeout(pressT); }); });
    doc.addEventListener("pointermove", function (e) { if (pressT && (Math.abs(e.clientX - pdx) > 10 || Math.abs(e.clientY - pdy) > 10)) clearTimeout(pressT); });
    doc.addEventListener("click", function (e) {
      var q = e.target.closest ? e.target.closest(".qm") : null;
      if (q) { e.preventDefault(); e.stopPropagation(); if (cur === q && Date.now() - shownAt > 400) hide(); else if (cur !== q) show(q); return; }
      var t = target(e); if (t && t.__tipLong && Date.now() - t.__tipLong < 800) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur) hide(); });
    root.addEventListener("scroll", function () { if (Date.now() - shownAt > 600) hide(); }, true); root.addEventListener("resize", hide);
  }
  /* accroche une infobulle à un élément (clé du glossaire ou texte libre) */
  function bind(el, key) { if (!el) return el; el.setAttribute("data-tip", key); if (!/^(BUTTON|A|INPUT|SELECT)$/.test(el.tagName) && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0"); el.classList.add("hastip"); return el; }
  /* petite icône « ? » (bouton) : toujours cliquable ; mode "touch" : visible seulement sur écran tactile */
  function qm(key, mode) {
    var b = doc.createElement("button"); b.type = "button"; b.className = "qm" + (mode === "touch" ? " qt" : ""); b.textContent = "?"; b.setAttribute("data-tip", key);
    var g = G() && G().get(key); b.setAttribute("aria-label", "Explication : " + (g ? g.term : "chiffre")); return b;
  }
  /* parcourt les éléments `selector` du conteneur ; si leur texte est un libellé connu du glossaire, accroche l'infobulle (et un « ? » si opts.qm) */
  function decorate(rootEl, selector, opts) {
    if (!rootEl || !G()) return 0; var n = 0; opts = opts || {};
    [].slice.call(rootEl.querySelectorAll(selector)).forEach(function (el) {
      if (el.__tipd) return; var key = G().byLabel(el.textContent); if (!key) return; el.__tipd = true; n++;
      if (opts.qm) { el.setAttribute("data-tip", key); el.appendChild(doc.createTextNode(" ")); el.appendChild(qm(key)); } else bind(el, key);
    });
    return n;
  }
  function dynamic(key, fn) { dyn[key] = fn; }
  function enable(on) { enabled = on !== false; if (doc && doc.body) doc.body.classList.toggle("notips", !enabled); if (!enabled) hide(); }
  function init() { ensure(); bindGlobal(); }
  BL.tip = { enable: enable, init: init, bind: bind, qm: qm, decorate: decorate, dynamic: dynamic, show: show, hide: hide, _cur: function () { return cur; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
