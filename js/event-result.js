/* Carte de résultat d'un événement (C10) : ce que tu as choisi, ce qui a été tiré (une seule fois, au clic), ce qui a changé. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, el = null, from = null, open = false;
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function build() {
    if (el) return; el = mk("div", "heatdlg evres"); el.id = "evRes"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "erTitle");
    doc.body.appendChild(el);
    doc.addEventListener("keydown", function (e) { if (open && (e.key === "Escape" || e.key === "Enter")) { e.preventDefault(); e.stopPropagation(); close(); } else if (open && e.key === "Tab") { e.preventDefault(); var b = el.querySelector("button"); if (b) b.focus(); } }, true);
  }
  /* info : { title, choice, who:{name,role,look,id}|null, why, outcome:{label,cls}|null, effects:[strings], note } */
  function show(info) {
    build(); from = doc.activeElement; var box = mk("div", "hd-box er-box"); el.innerHTML = "";
    var h = mk("header", "hd-h"); var t = mk("h2", "", "Résultat"); t.id = "erTitle"; h.appendChild(t); box.appendChild(h);
    box.appendChild(mk("p", "er-ev", info.title));
    var row = mk("div", "er-row"); row.appendChild(mk("span", "er-k", "Ton choix")); row.appendChild(mk("b", "", info.choice)); box.appendChild(row);
    if (info.who) {
      var w = mk("div", "er-who"), pic = mk("span", "er-pic"); try { pic.innerHTML = BL.portraits.portrait(info.who.look, { label: "Portrait de " + info.who.name, id: info.who.id }); } catch (e) {}
      w.appendChild(pic); var tx = mk("span", "er-wt"); tx.appendChild(mk("b", "", info.who.name)); tx.appendChild(mk("small", "", info.why)); w.appendChild(tx); box.appendChild(w);
    }
    if (info.outcome) { var o = mk("div", "er-out " + info.outcome.cls, info.outcome.label); box.appendChild(o); }
    box.appendChild(mk("div", "er-k er-h", "Ce qui a changé"));
    var ul = mk("ul", "er-fx"); (info.effects.length ? info.effects : ["Rien ne change."]).forEach(function (x) { ul.appendChild(mk("li", "", x)); }); box.appendChild(ul);
    if (info.note) box.appendChild(mk("p", "hd-note", info.note));
    var ok = mk("button", "btn buy", "Compris"); ok.type = "button"; ok.onclick = close; var a = mk("div", "hd-acts"); a.appendChild(ok); box.appendChild(a);
    el.appendChild(box); el.hidden = false; open = true; var app = $("app"); if (app) app.inert = true; ok.focus();
    var live = mk("div", "sr-only"); live.setAttribute("role", "status"); live.textContent = "Résultat : " + info.title + ". " + info.choice + ". " + (info.outcome ? info.outcome.label + ". " : "") + info.effects.join(", "); box.appendChild(live);
  }
  function close() { if (!open) return; open = false; el.hidden = true; el.innerHTML = ""; var app = $("app"); if (app) app.inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }
  BL.evResult = { show: show, close: close, isOpen: function () { return open; } };
})(typeof window !== "undefined" ? window : globalThis);
