/* Carte de résultat d'opération (chantier 2).
   Source de vérité : l'historique du jeu (BL.equip.history). Chaque compte rendu non vu s'affiche, un par un, quelle que soit la page ouverte ;
   on le ferme avec « Continuer » (il est alors marqué vu et sauvegardé). Rien ne se perd : au rechargement, les comptes rendus non vus reviennent.
   Animation : opacité + transform seulement, coupée avec body.nomotion / prefers-reduced-motion. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h = null, cur = null, box = null, hold = false;
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function n1(x) { return String(Math.round(x * 10) / 10).replace(".", ","); }
  function crewName(id) { var m = BL.crew && BL.crew.get(id); return m ? m.name.split(" ")[0] : "?"; }
  function unseen(s) { return BL.equip.history(s).filter(function (r) { return !r.seen; }).sort(function (a, b) { return a.at - b.at; }); }
  function title(r) { return r.crit ? "Réussite éclatante !" : r.ok ? "Mission réussie !" : r.near ? "Échec de justesse" : "Mission échouée"; }
  function kind(r) { return r.crit ? "crit" : r.ok ? "win" : r.near ? "near" : "lose"; }
  function blocked() {
    var m = doc.getElementById("menu"); if (m && !m.hidden && !m.classList.contains("out")) return true;
    var of = doc.getElementById("offline"); if (of && !of.hidden) return true;   /* C14 : jamais empilé avec le bilan de retour */
    var b = doc.body; return b.classList.contains("inbox") || b.classList.contains("inroom") || hold;
  }
  function lootHtml(r) {
    var D = BL.data.equip, out = [];
    r.loot.forEach(function (id, i) { out.push(card(id, r.nw[i] ? "Nouveau" : "Doublon", r.nw[i] ? "new" : "dup", i)); });
    r.sold.forEach(function (id, i) { out.push(card(id, "Arsenal plein : vendu", "sold", r.loot.length + i)); });
    function card(id, tag, cls, i) {
      var it = BL.equip.item(id); return '<li class="opr-it rar' + it.rar + '" style="--rc:' + D.RCOL[it.rar] + ";--d:" + (0.25 + i * 0.18) + 's"><span class="opr-ic">' + BL.equipUI.icon(it, true) + '</span><span class="opr-nm"><b>' + esc(it.name) + '</b><small>' + esc(D.RAR[it.rar].charAt(0).toUpperCase() + D.RAR[it.rar].slice(1)) + " · " + esc(D.SLOTS[it.slot]) + '</small></span><em class="opr-tag ' + cls + '">' + tag + "</em></li>";
    }
    return out.join("");
  }
  function html(r, n, total) {
    var o = BL.equip.op(r.op), k = kind(r), f = r.fx && BL.factions && BL.factions.info(r.fx.fac), lines = [];
    if (r.money > 0) lines.push('<li class="gain"><span>Argent</span><b>+' + h.money(r.money) + (r.near ? " (part réduite)" : "") + "</b></li>");
    else lines.push('<li><span>Argent</span><b>aucun gain</b></li>');
    if (f) lines.push("<li><span>" + esc(f.name) + "</span><b>influence " + (r.fx.pow > 0 ? "+" : "") + n1(r.fx.pow) + " %, relation " + (r.fx.rel > 0 ? "+" : "") + n1(r.fx.rel) + "</b></li>");
    lines.push("<li><span>Équipe</span><b>" + (r.hurt.length ? r.hurt.map(crewName).join(", ") + " blessé (de retour bientôt, jamais perdu)" : "aucun blessé") + "</b></li>");
    var items = lootHtml(r);
    return '<div class="opres-in ' + k + '"><div class="opr-hd"><span class="opr-ico" aria-hidden="true">' + (r.ok ? "✓" : "✗") + '</span><div><small>' + (total > 1 ? "Compte rendu " + n + " / " + total : "Compte rendu d’opération") + "</small><h2 id=\"oprTitle\">" + title(r) + "</h2></div></div>" +
      '<div class="opr-sc">' + (BL.opsArt ? BL.opsArt.scene(o) : "") + '<span class="opr-op">' + esc(o.name) + "</span></div>" +
      '<ul class="opr-lines">' + lines.join("") + "</ul>" +
      (items ? '<p class="opr-h">Butin</p><ul class="opr-loot">' + items + "</ul>" : '<p class="opr-none">' + (r.ok ? "Aucun objet cette fois." : "Pas de butin : l’équipe est rentrée les mains vides.") + "</p>") +
      '<div class="opr-act"><button type="button" class="btn can" data-r="ok">' + (total > 1 ? "Suivant" : "Continuer") + '</button><button type="button" class="btn ghost" data-r="see">Voir le rapport</button></div></div>';
  }
  function ensure() {
    if (box) return box; box = doc.createElement("div"); box.id = "opres"; box.className = "opres"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-live", "polite"); box.setAttribute("aria-labelledby", "oprTitle"); doc.body.appendChild(box);
    box.addEventListener("click", function (e) { var b = e.target.closest("[data-r]"); if (!b) return; if (b.dataset.r === "see") { dismiss(true); } else dismiss(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur && !box.hidden) { e.stopPropagation(); dismiss(false); } });
    return box;
  }
  function dismiss(goSee) {
    if (!cur) return; var at = cur.at; BL.equip.markSeen(h.state(), at); cur = null; box.hidden = true; box.classList.remove("show"); box.innerHTML = "";
    if (h.save) h.save(); if (goSee && h.go) h.go("ops"); if (BL.equipUI && BL.equipUI.render) BL.equipUI.render();
  }
  /* appelée à chaque tick : affiche le plus ancien compte rendu non vu si rien ne le gêne */
  var played = {};   /* scène d'opération déjà jouée pour ce compte rendu (cosmétique, jamais sauvegardé) */
  function tick(s) {
    if (!BL.equip || !h) return; if (BL.opsSceneUI && BL.opsSceneUI.isOpen()) return; if (cur) { if (blocked()) { box.hidden = true; box.classList.remove("show"); } else if (box.hidden) { box.hidden = false; void box.offsetWidth; box.classList.add("show"); } return; }
    var q = unseen(s); if (!q.length || blocked()) return;
    var f0 = q[0]; if (!played[f0.at] && s.t - f0.at < 600) { played[f0.at] = 1; var o0 = BL.equip.op(f0.op); if (o0 && BL.opsSceneUI && BL.opsSceneUI.play(f0, o0, null)) return; }   /* Partie 15 : le résultat est déjà appliqué ; la scène ne fait que le raconter, puis le compte rendu habituel s'affiche */
    ensure(); cur = q[0];
    box.className = "opres"; box.innerHTML = html(cur, 1, q.length); box.hidden = false; void box.offsetWidth; box.classList.add("show");
    if (BL.audio) BL.audio.sfx(cur.ok ? (cur.loot.some(function (id) { return BL.equip.item(id).rar >= 2; }) ? "loot" : "success") : "error");
  }
  function init(handlers) { h = handlers; }
  BL.results = { init: init, tick: tick, unseen: unseen, title: title, kind: kind, hold: function (v) { hold = !!v; }, current: function () { return cur; } };
})(typeof window !== "undefined" ? window : globalThis);
