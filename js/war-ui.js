/* Rivalités (Partie 13 · C3) : fenêtre « Rivalités » — personnalité et mémoire de chaque faction, raisons de sa pression, réponses
   (calmer, contre-attaquer), coalition, et boss de quartier (guerre en 3 manches). Toute la règle est dans BL.rivals et BL.war. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, el = {}, open = false, from = null, btn = null, sig = "", bsig = "", st = { flash: "" };
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pc(x) { return Math.round(x * 100) + " %"; }
  function build() {
    if (el.root) return;
    var r = mk("div", "sagadlg", ""); r.id = "rivDlg"; r.hidden = true; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); r.setAttribute("aria-labelledby", "rvTitle");
    r.innerHTML = '<div class="sg-box"><header class="sg-h"><h2 id="rvTitle">Rivalités</h2><button type="button" class="sg-x" id="rvX" aria-label="Fermer">&times;</button></header><div class="sg-body" id="rvBody"></div></div>';
    doc.body.appendChild(r); el.root = r; el.body = r.querySelector("#rvBody"); r.querySelector("#rvX").onclick = close; r.onclick = function (e) { if (e.target === r) close(); };
    el.body.addEventListener("click", onBody);
    r.addEventListener("keydown", function (e) { if (e.key === "Tab") trap(e); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  function trap(e) { var f = Array.prototype.filter.call(el.root.querySelectorAll("button"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); } }
  function openDlg(src) { if (!S || open) return; build(); from = src || doc.activeElement; st.flash = ""; open = true; el.root.hidden = false; $("app").inert = true; paint(true); var f = el.root.querySelector("button:not([hidden]):not(:disabled)"); if (f) f.focus(); }
  function close() { if (!open) return; open = false; el.root.hidden = true; $("app").inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }
  function fname(id) { var f = BL.territory.faction(id); return f ? f.name : id; }

  function factionsHtml(s) {
    var R = BL.rivals, o = "", co = s.rivals && s.rivals.co && s.rivals.co.u > s.t ? s.rivals.co : null;
    if (co) o += '<p class="rv-co" role="status"><b>Coalition :</b> ' + esc(fname(co.a)) + " et " + esc(fname(co.b)) + " s’allient contre toi (pression +" + Math.round((R.co.mul - 1) * 100) + " %). Calme l’une des deux pour rompre l’alliance.</p>";
    o += '<ul class="rv-list">';
    BL.data.territory.factions.forEach(function (f) {
      var x = R.mem(s, f.id), md = R.mods(s, f.id), e = R.list(s).filter(function (z) { return z.fid === f.id; })[0], front = R.front(s, f.id), ci = e ? R.counterInfo(s, f.id) : null;
      o += '<li class="rv-f"><header><b>' + esc(f.name) + '</b><span class="rv-p">' + esc(md.info.name) + "</span></header><p class=\"rv-t\">" + esc(md.info.text) + "</p>";
      o += '<p class="rv-m">Mémoire : repoussée ' + x.w + " fois · t’a battu " + x.l + " fois" + (R.personality(f.id) === "aggressive" ? " · rancune " + x.g + " / " + R.co.maxGrudge : "") + "</p>";
      if (e) {
        o += '<p class="rv-pr">Pression sur ' + esc(BL.territory.dist(e.did).name) + " : <b>" + e.p + " %</b> (" + (e.lvl === "threat" ? "menace" : "tension") + ")</p><details class=\"rv-why\"><summary>Pourquoi elle agit</summary><ul>" + md.lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "<li>Cible : " + esc(BL.territory.dist(e.did).name) + (R.personality(f.id) === "diplomat" ? ", le quartier le plus stratégique." : ", ton quartier le moins bien défendu parmi ceux qu’elle touche.") + "</li></ul></details>";
        var cc = R.calmCost(s, e.did, f.id), canC = s.money + 1e-9 >= cc, canK = ci && s.money + 1e-9 >= ci.cost;
        o += '<div class="rv-act"><button type="button" class="btn ghost" data-act="calm" data-f="' + f.id + '"' + (canC ? "" : " disabled") + ">Acheter la paix · " + u.money(cc) + " (−" + R.params.calm + ")</button>";
        if (ci) o += '<button type="button" class="btn ghost" data-act="counter" data-f="' + f.id + '"' + (canK ? "" : " disabled") + ">Contre-attaquer · " + u.money(ci.cost) + " · " + pc(ci.chance) + " de réussite</button>";
        o += "</div>";
      } else o += '<p class="rv-pr">' + (front ? "Aucune pression pour l’instant." : "Pas de frontière avec tes quartiers : aucune menace.") + "</p>";
      o += "</li>";
    });
    return o + "</ul>";
  }
  function bossHtml(s) {
    var W = BL.war, o = '<h3 class="rv-h">Boss de quartier</h3><p class="sg-lead">Défie le boss d’un quartier voisin : trois manches (défense, attaque, finale), deux victoires suffisent. Il annonce sa tactique avant ton choix ; la chance de chaque réponse est exacte. Défaite : seule la mise est perdue. Victoire : récompense unique et +0,5 % de revenus (jusqu’à 3 %).</p>', v = W.view(s);
    if (v) {
      o += '<section class="rv-war" aria-live="polite"><h4>' + esc(v.boss.name) + " · " + esc(v.boss.title) + "</h4><p>Manche " + (v.round + 1) + " / " + v.rounds + " : <b>" + esc(v.roundDef.name) + "</b>. " + esc(v.roundDef.text) + " Score : " + v.wins + " – " + v.losses + ".</p>";
      v.log.forEach(function (l) { o += '<p class="rv-lg">Manche ' + (l.r + 1) + " : tu as joué " + esc(tname(l.mine)) + ", il avait annoncé " + esc(tname(l.boss)) + " → " + (l.win ? "gagnée" : "perdue") + " (" + pc(l.chance) + ").</p>"; });
      o += '<p class="rv-tell">Il mise sur : <b>' + esc(tname(v.tell)) + "</b>.</p><div class=\"sg-opts\">";
      v.options.forEach(function (op) { o += '<button type="button" class="sg-opt" data-act="pick" data-t="' + op.id + '"><b>' + esc(op.name) + "</b><ul><li>" + esc(op.text) + "</li><li>Chance de gagner la manche : " + pc(op.chance) + "</li></ul></button>"; });
      o += '</div><button type="button" class="btn ghost" data-act="abandon">Abandonner (la mise est perdue)</button></section>';
    }
    o += '<ul class="rv-list">';
    W.list(s).forEach(function (b) {
      var ok = !b.why && !b.done && !b.active;
      o += '<li class="rv-b"><header><b>' + esc(b.boss.name) + '</b><span class="rv-p">' + esc(b.district.name) + "</span></header><p class=\"rv-t\">" + esc(b.boss.title) + (b.done ? " · Trophée : " + esc(b.boss.trophy) : "") + "</p>";
      if (b.done) o += '<p class="rv-ok">Vaincu ✓</p>'; else if (b.active) o += "<p class=\"rv-pr\">Guerre en cours.</p>"; else o += '<div class="rv-act"><button type="button" class="btn ghost" data-act="start" data-d="' + b.id + '"' + (ok ? "" : " disabled") + ">Défier · mise " + u.money(W.stake(s)) + "</button>" + (b.why ? '<small class="sg-why">' + esc(b.why) + "</small>" : "") + "</div>";
      o += "</li>";
    });
    return o + "</ul>";
  }
  function tname(id) { var r = id; BL.data.war.tactics.forEach(function (t) { if (t.id === id) r = t.name; }); return r; }
  function paint(force) {
    if (!open || !S) return; var s = S, g = JSON.stringify([s.rivals && s.rivals.st, s.rivals && s.rivals.co, s.war]) + "|" + Math.floor(s.money / 1e3) + "|" + st.flash + "|" + Math.floor(s.t / 30);
    if (!force && g === bsig) return; bsig = g; var sc = el.body.scrollTop;
    el.body.innerHTML = (st.flash ? '<p class="sg-flash" role="status">' + esc(st.flash) + "</p>" : "") + '<p class="sg-lead">Chaque faction a une personnalité et une mémoire : elle vise le quartier que tu défends mal, garde rancune, ou s’allie. Tu vois toujours pourquoi, et tu peux répondre. Fiction : factions et personnages inventés.</p>' + factionsHtml(s) + bossHtml(s);
    el.body.scrollTop = force ? 0 : sc;
  }
  function onBody(e) {
    var b = e.target.closest("button[data-act]"); if (!b || b.disabled || !S) return; var a = b.dataset.act, r;
    if (a === "calm") { r = h.calmRival(b.dataset.f); st.flash = r ? "Tension apaisée." : "Impossible pour l’instant."; }
    else if (a === "counter") { r = h.rivalCounter(b.dataset.f); st.flash = r ? (r.ok ? "Contre-attaque réussie : leur pression retombe à 0." : "Contre-attaque ratée : leur pression monte de " + BL.rivals.co.counterFail + ".") : "Impossible pour l’instant."; }
    else if (a === "start") { r = h.warStart(b.dataset.d); st.flash = r ? "Guerre lancée : choisis ta tactique." : "Impossible pour l’instant."; }
    else if (a === "pick") { r = h.warPick(b.dataset.t); st.flash = r ? (r.win ? "Manche gagnée (" + pc(r.chance) + " de chances)." : "Manche perdue (" + pc(r.chance) + " de chances).") + (r.end ? (r.end.victory ? " Guerre gagnée : trophée acquis, +" + u.money(r.end.money) + "." : " Guerre perdue : seule la mise est perdue.") : "") : "Impossible pour l’instant."; }
    else if (a === "abandon") { h.warAbandon(); st.flash = "Guerre abandonnée : la mise est perdue."; }
    paint(true);
  }
  function mkBtn() {
    var b = mk("button", "sagabtn rivbtn", '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M12 2l9 4v6c0 5-3.5 8.5-9 10C6.5 20.5 3 17 3 12V6zm0 4l-5 2v4c0 3 2 5.300 5 6.500 3-1.200 5-3.500 5-6.500V8z"/></svg><span class="sb-t">Rivalités</span><span class="sb-n"></span>'); b.type = "button"; b.setAttribute("aria-haspopup", "dialog"); b.onclick = function () { openDlg(b); }; return b;
  }
  function place() { var d = $("v_dash"); if (d && !d.querySelector(".rivbtn")) { btn = mkBtn(); var sb = d.querySelector(".sagabtn"); d.insertBefore(btn, sb ? sb.nextSibling : d.firstChild); } }
  function update(s) {
    S = s; if (!BL.rivals || !BL.war) return; if (!btn) place();
    if (btn) { var n = BL.rivals.list(s).filter(function (e) { return e.lvl === "threat"; }).length, co = s.rivals && s.rivals.co && s.rivals.co.u > s.t, t = (n ? n + " menace" + (n > 1 ? "s" : "") : co ? "Coalition" : "Calme") + " · " + BL.war.trophies(s) + " boss", g = t; if (g !== sig) { sig = g; btn.querySelector(".sb-n").textContent = t; btn.classList.toggle("new", !!n || !!co); btn.setAttribute("aria-label", "Rivalités : " + t + ". Ouvrir."); } }
    if (open) paint(false);
  }
  function init(handlers, util) { h = handlers; u = util; place(); }
  BL.warUI = { init: init, update: update, open: function () { openDlg(null); }, close: close, isOpen: function () { return open; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
