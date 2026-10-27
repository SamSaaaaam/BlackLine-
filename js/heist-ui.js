/* Le grand braquage (Partie 13 · C5) : fenêtre « Braquage » — suivi des 5 étapes, choix chiffrés (chances exactes), dossier de résultat. Toute la règle est dans BL.heist. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, el = {}, open = false, from = null, btn = null, sig = "", bsig = "", st = { flash: "", ab: false };
  var SN = { pow: "Puissance", def: "Défense", stl: "Discrétion", spd: "Vitesse" };
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function name(id) { var m = BL.crew && BL.crew.get(id); return m ? m.name : id; }
  function build() {
    if (el.root) return;
    var r = mk("div", "sagadlg", ""); r.id = "heistDlg"; r.hidden = true; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); r.setAttribute("aria-labelledby", "hsTitle");
    r.innerHTML = '<div class="sg-box"><header class="sg-h"><h2 id="hsTitle">Braquage</h2><button type="button" class="sg-x" id="hsX" aria-label="Fermer">&times;</button></header><div class="sg-body" id="hsBody"></div></div>';
    doc.body.appendChild(r); el.root = r; el.body = r.querySelector("#hsBody"); r.querySelector("#hsX").onclick = close; r.onclick = function (e) { if (e.target === r) close(); };
    el.body.addEventListener("click", onBody); r.addEventListener("keydown", function (e) { if (e.key === "Tab") trap(e); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  function trap(e) { var f = Array.prototype.filter.call(el.root.querySelectorAll("button"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); } }
  function openDlg(src) { if (!S || open) return; build(); from = src || doc.activeElement; st.flash = ""; st.ab = false; open = true; el.root.hidden = false; $("app").inert = true; paint(true); var f = el.root.querySelector("button:not(:disabled)"); if (f) f.focus(); }
  function close() { if (!open) return; open = false; el.root.hidden = true; $("app").inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }

  function dossier(l) {
    var verdict = l.k === l.n ? "Coup parfait" : l.k >= 3 ? "Succès partiel" : l.k >= 1 ? "Butin réduit" : "Sauvé de justesse", rows = l.steps.map(function (s) { return { k: s.title, v: s.label + " · " + (s.ok ? "réussi" : "raté") + " · " + (Math.round(s.chance * 10) / 10) + " % de chance", ok: s.ok }; });
    rows.push({ k: "Butin", v: l.k + " étape" + (l.k > 1 ? "s" : "") + " sur " + l.n + " · ×" + l.mult + " : " + u.money(l.money) + " · frais " + u.money(l.cost) + " · chaleur +" + l.heat + (l.gold ? " · +" + l.gold + " lingot" + (l.gold > 1 ? "s" : "") : "") });
    var tr = l.trophy ? BL.data.heist.heists[0].trophy : null; if (tr) rows.push({ k: "Trophée", v: tr.name + ". " + tr.text, ok: true });
    return BL.report.police({ title: l.title, stamp: verdict, good: l.k >= 3, rows: rows });
  }
  function bodyHtml(s) {
    var H = BL.heist, x = H.state(s), def = BL.data.heist.heists[0], cur = H.current(s), o = "";
    if (st.flash) o += '<p class="sg-flash" role="status">' + esc(st.flash) + "</p>";
    if (!cur) {
      var why = H.why(s); o += '<section class="mt-card"><h3>' + esc(def.title) + "</h3><p class=\"sg-lead\">" + esc(def.intro) + "</p><p>5 étapes : repérage, équipe, matériel, exécution, fuite. Chaque choix affiche sa chance exacte, son coût et la chaleur qu’il ajoute. Un échec réduit le butin, il ne bloque rien et ne fait perdre ni objet ni équipier.</p>";
      if (why) o += '<p class="sg-why">' + esc(why) + "</p>"; o += '<button type="button" class="btn buy" data-act="start"' + (why ? " disabled" : "") + ">Préparer le braquage</button></section>";
      if (x.last) o += dossier(x.last); if (x.trophies.length) o += '<p class="hs-tro"><b>Trophées :</b> ' + x.trophies.map(function (id) { return esc(def.trophy.name); }).join(", ") + "</p>"; return o;
    }
    o += '<ol class="hs-prog" aria-label="Étapes">'; cur.def.steps.forEach(function (stp, i) { var k = i < cur.index ? (cur.run.ok[i] ? "ok" : "ko") : i === cur.index ? "cur" : ""; o += '<li class="' + k + '"' + (i === cur.index ? ' aria-current="step"' : "") + "><span>" + (i + 1) + "</span><b>" + esc(stp.title) + "</b></li>"; }); o += "</ol>";
    if (cur.run.team.length) o += '<p class="hs-team">Équipe : ' + cur.run.team.map(name).map(esc).join(", ") + "</p>";
    if (BL.minigames) { var lk = BL.minigames.heistLockOk(s), hl = s.mini && s.mini.hlp && s.mini.hlp.seed === cur.run.seed ? s.mini.hlp : null;   /* Partie 17 · E : crochetage facultatif avant l'exécution */
      if (hl) o += '<p class="mg-done">Serrure travaillée : +' + Math.round(hl.b * 100) + " points de chance sur l’exécution et la fuite, chaleur −" + hl.h + " par étape.</p>";
      else if (lk.ok) o += '<div class="mg-entry"><button type="button" class="btn" data-act="lockpick">Crocheter la serrure (mini-jeu facultatif)</button><small>Jusqu’à +8 points de chance sur l’exécution et la fuite, et moins de bruit.</small></div>'; }
    o += '<section class="mt-card"><h3>Étape ' + (cur.index + 1) + " sur " + cur.total + " · " + esc(cur.step.title) + '</h3><p class="sg-lead">' + esc(cur.step.scene) + '</p><div class="hs-ch">';
    cur.choices.forEach(function (c) {
      var m = []; if (c.stat) m.push(SN[c.stat]); if (c.cost) m.push("coût " + u.money(c.cost)); m.push(c.heat ? "chaleur +" + c.heat : "aucune chaleur");
      o += '<button type="button" class="hs-c" data-act="pick" data-id="' + c.id + '"' + (c.why ? " disabled" : "") + '><b>' + esc(c.label) + '</b><span>' + esc(c.text) + "</span>" + (c.team ? "<small>" + c.team.map(name).map(esc).join(", ") + "</small>" : "") + '<em class="hs-pc" aria-label="Chance de réussite ' + Math.round(c.chance * 100) + ' pour cent">' + Math.round(c.chance * 100) + ' % de chance</em><small>' + esc(m.join(" · ")) + "</small>" + (c.why ? '<small class="sg-why">' + esc(c.why) + "</small>" : "") + "</button>";
    }); o += "</div></section>";
    if (cur.run.pick.length) { o += '<ul class="hs-log">'; cur.def.steps.forEach(function (stp, i) { if (i < cur.index) { var c = stp.choices.filter(function (q) { return q.id === cur.run.pick[i]; })[0]; o += "<li class=\"" + (cur.run.ok[i] ? "ok" : "ko") + '"><b>' + esc(stp.title) + "</b> : " + esc(c ? c.label : "") + " — " + (cur.run.ok[i] ? "réussi" : "raté") + " (" + cur.run.ch[i] + " %)</li>"; } }); o += "</ul>"; }
    o += st.ab ? '<div class="rv-act"><button type="button" class="btn buy" data-act="ab2">Oui, abandonner (aucun butin)</button><button type="button" class="btn ghost" data-act="ab0">Continuer</button></div>' : '<button type="button" class="btn ghost" data-act="ab1">Abandonner le braquage</button>';
    return o;
  }
  function paint(force) {
    if (!open || !S) return; var H = BL.heist, x = H.state(S), cur = H.current(S), g = JSON.stringify([st, x.run, x.last, x.cd > S.t, H.why(S), cur ? cur.choices.map(function (c) { return [Math.round(c.chance * 100), c.why]; }) : 0]);
    if (!force && g === bsig) return; bsig = g; var sc = el.body.scrollTop; el.body.innerHTML = bodyHtml(S); el.body.scrollTop = force ? 0 : sc;
  }
  function onBody(e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled || !S) return; var a = b.dataset.act;
    if (a === "start") { st.flash = h.heistStart() ? "" : "Impossible pour l’instant."; }
    else if (a === "pick") { var r = h.heistChoose(b.dataset.id); st.flash = r ? (r.ok ? "Réussi : " : "Raté : ") + r.step.title + " (" + Math.round(r.chance * 100) + " % de chance)." : "Impossible pour l’instant."; }
    else if (a === "lockpick") { BL.minigames.open("lockpick", { title: "La nuit d’Aurelle", reward: "Récompense : jusqu’à +8 points de chance sur l’exécution et la fuite, chaleur −2 par étape.", onClose: function () { paint(true); } }, function (sc) { var r = h.miniHeistLock(sc); return r ? { text: "Serrure travaillée : +" + Math.round(r.b * 100) + " points de chance sur l’exécution et la fuite, chaleur −" + r.h + " par étape." } : null; }); return; }
    else if (a === "ab1") st.ab = true; else if (a === "ab0") st.ab = false; else if (a === "ab2") { h.heistAbandon(); st.ab = false; st.flash = "Braquage abandonné."; }
    paint(true); var f = el.root.querySelector("button:not(:disabled)"); if (f && (a === "start" || a === "pick")) f.focus();
  }
  function mkBtn() {
    var b = mk("button", "sagabtn heistbtn", '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M3 8h18v12H3zm2 2v8h14v-8zm4-6h6v2H9zm3 7a2 2 0 110 4 2 2 0 010-4z"/></svg><span class="sb-t">Braquage</span><span class="sb-n"></span>'); b.type = "button"; b.setAttribute("aria-haspopup", "dialog"); b.onclick = function () { openDlg(b); }; return b;
  }
  function place() { var d = $("v_dash"); if (d && !d.querySelector(".heistbtn")) { btn = mkBtn(); var rb = d.querySelector(".metabtn") || d.querySelector(".rivbtn") || d.querySelector(".sagabtn"); d.insertBefore(btn, rb ? rb.nextSibling : d.firstChild); } }
  function update(s) {
    S = s; if (!BL.heist) return; if (!btn) place();
    if (btn) { var H = BL.heist, x = H.state(s), why = H.why(s), t = x.run ? "Étape " + (x.run.step + 1) + " / " + BL.data.heist.heists[0].steps.length : !why ? "Prêt" : s.t < x.cd ? "Repos" : "Niveau " + BL.data.heist.params.lvl; if (t !== sig) { sig = t; btn.querySelector(".sb-n").textContent = t; btn.classList.toggle("new", !!x.run || !why); btn.setAttribute("aria-label", "Braquage : " + t + ". Ouvrir."); } }
    if (open) paint(false);
  }
  function init(handlers, util) { h = handlers; u = util; place(); }
  BL.heistUI = { init: init, update: update, open: function () { openDlg(null); }, close: close, isOpen: function () { return open; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
