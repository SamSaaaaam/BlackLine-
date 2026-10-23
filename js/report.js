/* Écrans de résultat (Partie 13 · C8) : « dossier de police » et « une de journal ». Génère du HTML (texte échappé) et affiche, au besoin, une petite fenêtre.
   Utilisé par : le grand braquage (dossier), les fins de chapitre de l'histoire (journal), les descentes de police (dossier). Aucune image externe. Aucun état sauvegardé. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, open = false, from = null, el = null;
  function esc(t) { return String(t === undefined || t === null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* o : { kicker, title, stamp, good (bool), rows [{k, v, ok}], foot } */
  function police(o) {
    var h = '<article class="rp-file" aria-label="Dossier de police"><header><small>DOSSIER · POLICE · CONFIDENTIEL</small><h3>' + esc(o.title) + "</h3>" + (o.stamp ? '<span class="rp-stamp ' + (o.good ? "good" : "bad") + '">' + esc(o.stamp) + "</span>" : "") + "</header>";
    if (o.rows && o.rows.length) { h += '<ul class="rp-rows">'; o.rows.forEach(function (r) { h += "<li" + (r.ok === true ? ' class="ok"' : r.ok === false ? ' class="ko"' : "") + "><b>" + esc(r.k) + "</b><span>" + esc(r.v) + "</span></li>"; }); h += "</ul>"; }
    return h + (o.foot ? '<p class="rp-foot">' + esc(o.foot) + "</p>" : "") + "</article>";
  }
  /* o : { name, date, head, sub, lines [texte], foot } */
  function news(o) {
    var h = '<article class="rp-news" aria-label="Une de journal"><header><span>' + esc(o.name || "Le Courrier de la Ville") + "</span><i>" + esc(o.date || "Édition du soir") + "</i></header><h3>" + esc(o.head) + "</h3>" + (o.sub ? "<p class=\"rp-sub\">" + esc(o.sub) + "</p>" : "");
    if (o.lines && o.lines.length) { h += '<div class="rp-cols">'; o.lines.forEach(function (l) { h += "<p>" + esc(l) + "</p>"; }); h += "</div>"; }
    return h + (o.foot ? '<p class="rp-foot">' + esc(o.foot) + "</p>" : "") + "</article>";
  }
  /* Petite fenêtre : Échap ou bouton pour fermer, fond inerte, focus rendu. */
  function show(html, title) {
    if (!doc) return false; if (open) close(); if (!el) {
      el = doc.createElement("div"); el.className = "sagadlg"; el.id = "repDlg"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "rpTitle");
      el.innerHTML = '<div class="sg-box"><header class="sg-h"><h2 id="rpTitle"></h2><button type="button" class="sg-x" id="rpX" aria-label="Fermer">&times;</button></header><div class="sg-body" id="rpBody"></div><div class="rp-act"><button type="button" class="btn buy" id="rpOk">Compris</button></div></div>';
      doc.body.appendChild(el); el.querySelector("#rpX").onclick = close; el.querySelector("#rpOk").onclick = close; el.onclick = function (e) { if (e.target === el) close(); };
      el.addEventListener("keydown", function (e) { if (e.key === "Tab") { var f = Array.prototype.filter.call(el.querySelectorAll("button"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); } } });
      doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
    }
    var app = doc.getElementById("app"); if (app && app.inert) return false;           /* une autre fenêtre est ouverte : on n'empile pas */
    from = doc.activeElement; el.querySelector("#rpTitle").textContent = title || "Résultat"; el.querySelector("#rpBody").innerHTML = html; el.hidden = false; open = true; if (app) app.inert = true; el.querySelector("#rpOk").focus(); return true;
  }
  function close() { if (!open || !el) return; open = false; el.hidden = true; var app = doc.getElementById("app"); if (app) app.inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }
  BL.report = { police: police, news: news, show: show, close: close, isOpen: function () { return open; }, esc: esc };
})(typeof globalThis !== "undefined" ? globalThis : this);
