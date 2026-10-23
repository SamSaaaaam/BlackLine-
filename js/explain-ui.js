/* C15 : composant unique « d'où vient ce nombre ? ». Tout élément portant data-explain="clé" l'ouvre (clic, toucher, Entrée/Espace) ; une seule fenêtre à la fois,
   fermeture par ✕, Échap, clic/toucher à l'extérieur ou nouvelle ouverture ; le focus revient sur l'élément. Aucune règle de calcul ici : tout vient de BL.explain.
   Mobile : volet fixe en bas de l'écran ; bureau : bulle près de l'élément. Contenu actualisé chaque seconde tant qu'elle est ouverte. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h = null, box = null, cur = null, timer = 0, sig = "";
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function money(v) { return h && h.money ? h.money(v) : "$" + Math.round(v); }
  function fmt(v, unit, signed) {
    var a = Math.abs(v), body = unit === "" ? String(Math.round(a)) : money(a) + (unit === "$/s" ? "/s" : ""), s = v < 0 ? "−" : signed && v > 0 ? "+" : "";
    return s + body;
  }
  function render(first) {
    var s = h && h.state(); if (!box || !cur || !s) return; var r = BL.explain.get(s, cur.key);
    if (!r) { close(); return; }
    var html = '<div class="xpl-h"><b id="xplT">' + esc(r.title) + '</b><button type="button" class="xpl-x" aria-label="Fermer l’explication">&times;</button></div>' +
      '<div class="xpl-tot"><span>Total affiché</span><b>' + fmt(r.total, r.unit) + '</b></div><ul class="xpl-l">' + r.lines.map(function (l) {
        return '<li class="' + (l.v < 0 ? "neg" : l.v > 0 ? "pos" : "zero") + '"><div class="xpl-r"><span>' + esc(l.label) + '</span><b>' + (l.v === 0 ? fmt(0, r.unit) : fmt(l.v, r.unit, true)) + '</b></div>' + (l.note ? '<small>' + esc(l.note) + '</small>' : "") + '</li>';
      }).join("") + '</ul><div class="xpl-f">Somme des lignes = <b>' + fmt(r.total, r.unit) + '</b></div>';
    var g = html.length + ":" + r.total; if (!first && g === sig && html === box.__html) return; sig = g; box.__html = html;
    var f = box.querySelector(".xpl-x") && doc.activeElement === box.querySelector(".xpl-x"); box.innerHTML = html; if (f) box.querySelector(".xpl-x").focus();
    if (first) place();
  }
  function place() {
    if (!box || !cur) return; var vw = doc.documentElement.clientWidth, vh = doc.documentElement.clientHeight;
    if (vw <= 700) { box.style.left = "8px"; box.style.right = "8px"; box.style.top = "auto"; box.style.bottom = "8px"; box.style.width = "auto"; return; }
    var r = cur.el.getBoundingClientRect(), w = Math.min(380, vw - 16); box.style.width = w + "px"; box.style.right = "auto"; box.style.bottom = "auto";
    var x = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2)), hh = box.offsetHeight, y = r.bottom + 8; if (y + hh > vh - 8) y = Math.max(8, r.top - hh - 8);
    box.style.left = x + "px"; box.style.top = y + "px";
  }
  function ensure() {
    if (box) return box; box = doc.createElement("div"); box.id = "xpl"; box.className = "xpl"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "false"); box.setAttribute("aria-labelledby", "xplT"); box.tabIndex = -1; doc.body.appendChild(box);
    box.addEventListener("click", function (e) { if (e.target.closest(".xpl-x")) close(true); });
    return box;
  }
  function open(el, key) {
    if (!h || !el) return; if (cur && cur.el === el && cur.key === key && !box.hidden) { close(true); return; }
    ensure(); var prev = cur; cur = { el: el, key: key, from: prev ? prev.from : doc.activeElement }; sig = ""; box.hidden = false; render(true); place();
    if (prev && prev.el !== el) prev.el.removeAttribute("aria-expanded"); el.setAttribute("aria-expanded", "true");
    var x = box.querySelector(".xpl-x"); if (x) x.focus({ preventScroll: true });
    clearInterval(timer); timer = setInterval(function () { if (BL.press && BL.press.active()) return; render(false); }, 1000);
  }
  function close(back) {
    if (!box || box.hidden) return; box.hidden = true; clearInterval(timer); var c = cur; cur = null; box.innerHTML = ""; sig = "";
    if (c) { c.el.removeAttribute("aria-expanded"); if (back && c.el.focus && doc.contains(c.el)) { try { c.el.focus({ preventScroll: true }); } catch (e) {} } }
  }
  function tgt(e) { return e.target && e.target.closest ? e.target.closest("[data-explain]") : null; }
  function init(handlers) {
    if (h || !doc) { h = handlers || h; return; } h = handlers;
    doc.addEventListener("click", function (e) { var t = tgt(e); if (!t) return; e.preventDefault(); e.stopPropagation(); open(t, t.getAttribute("data-explain")); }, true);
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box && !box.hidden) { e.stopPropagation(); close(true); return; }
      if ((e.key === "Enter" || e.key === " ") && !/^(BUTTON|A|INPUT)$/.test(e.target.tagName)) { var t = tgt(e); if (t) { e.preventDefault(); open(t, t.getAttribute("data-explain")); } }
    }, true);
    doc.addEventListener("pointerdown", function (e) { if (box && !box.hidden && !box.contains(e.target) && !tgt(e)) close(false); }, true);
    root.addEventListener("resize", place); root.addEventListener("scroll", function () { if (box && !box.hidden && doc.documentElement.clientWidth > 700) place(); }, true);
  }
  /* rend un élément explicable (rôle bouton, atteignable au clavier) */
  function attach(el, key, label) {
    if (!el) return el; el.setAttribute("data-explain", key); el.classList.add("xtap"); if (!/^(BUTTON|A|INPUT)$/.test(el.tagName)) { el.setAttribute("role", "button"); if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0"); }
    el.setAttribute("aria-haspopup", "dialog"); if (label && !el.getAttribute("aria-label")) el.setAttribute("aria-label", label); return el;
  }
  BL.explainUI = { init: init, open: open, close: function () { close(true); }, attach: attach, isOpen: function () { return !!box && !box.hidden; }, key: function () { return cur && cur.key; } };
})(typeof window !== "undefined" ? window : globalThis);
