/* Carrière (Partie 13 · C9) : fenêtre « Carrière » — prestige / partie+ (3 clans), mode difficile, défis du jour et de la semaine,
   succès et collections. Toute la règle est dans BL.meta ; ici on affiche. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, el = {}, open = false, from = null, btn = null, sig = "", bsig = "", st = { tab: "pres", clan: "ombre", hard: false, confirm: false, flash: "" };
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var TABS = [["pres", "Prestige"], ["chal", "Défis"], ["succ", "Succès"]];
  function build() {
    if (el.root) return;
    var r = mk("div", "sagadlg", ""); r.id = "metaDlg"; r.hidden = true; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); r.setAttribute("aria-labelledby", "mtTitle");
    r.innerHTML = '<div class="sg-box"><header class="sg-h"><h2 id="mtTitle">Carrière</h2><button type="button" class="sg-x" id="mtX" aria-label="Fermer">&times;</button></header><div class="mt-tabs" role="tablist" aria-label="Rubriques"></div><div class="sg-body" id="mtBody"></div></div>';
    doc.body.appendChild(r); el.root = r; el.body = r.querySelector("#mtBody"); el.tabs = r.querySelector(".mt-tabs");
    TABS.forEach(function (t) { var b = mk("button", "mt-tab", esc(t[1])); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.tab = t[0]; b.onclick = function () { st.tab = t[0]; st.flash = ""; st.confirm = false; paint(true); }; el.tabs.appendChild(b); });
    r.querySelector("#mtX").onclick = close; r.onclick = function (e) { if (e.target === r) close(); }; el.body.addEventListener("click", onBody);
    r.addEventListener("keydown", function (e) { if (e.key === "Tab") trap(e); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  }
  function trap(e) { var f = Array.prototype.filter.call(el.root.querySelectorAll("button,input"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); } }
  function openDlg(src, tab) { if (!S || open) return; build(); from = src || doc.activeElement; st.tab = tab || "pres"; st.flash = ""; st.confirm = false; open = true; el.root.hidden = false; $("app").inert = true; paint(true); var f = el.root.querySelector(".mt-tab.on") || el.root.querySelector("button"); if (f) f.focus(); }
  function close() { if (!open) return; open = false; el.root.hidden = true; $("app").inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }

  function presHtml(s) {
    var M = BL.meta, x = M.state(s), cl = M.clan(s), why = M.why(s), P = BL.data.meta.params, o = "";
    o += '<section class="mt-card"><h3>Ta partie</h3><p>' + (x.pr ? "Prestige " + x.pr + " · " : "Première partie · ") + (cl ? "Clan « " + esc(cl.name) + " » : " + esc(cl.rule) : "Aucun clan (la première partie n’en a pas).") + "</p><p>" + (x.hard ? "<b>Mode difficile actif</b> : chaleur +20 %, rivaux +20 %, prix +5 %." : "Mode normal.") + " Revenus de prestige : +" + Math.round(M.prestigeInc(s) * 1000) / 10 + " % (+2 % par prestige, jusqu’à +20 %).</p>";
    if (s.t <= P.hardWindowSec) o += '<label class="suhard"><input type="checkbox" data-act="hardnow"' + (x.hard ? " checked" : "") + '> <span><b>Mode difficile</b> : modifiable pendant les 10 premières minutes de cette partie.</span></label>';
    o += "</section>";
    o += '<section class="mt-card"><h3>Nouvelle partie+</h3><p class="sg-lead">Recommence à zéro avec un clan qui change ta manière de jouer. Tu gardes : lingots et coffre, QG et décors, boutique, succès, collections et fins vues. Tu perds : argent, activités, quartiers, équipe, arsenal, factions, histoire en cours.</p>';
    if (why) o += '<p class="sg-why">' + esc(why) + "</p>";
    o += '<div class="mt-clans" role="radiogroup" aria-label="Choisir un clan">';
    Object.keys(BL.data.meta.clans).forEach(function (id) { var c = BL.data.meta.clans[id]; o += '<button type="button" class="mt-clan' + (st.clan === id ? " on" : "") + '" role="radio" aria-checked="' + (st.clan === id) + '" data-act="clan" data-id="' + id + '"><b>' + esc(c.name) + "</b><span>" + esc(c.text) + "</span><small>" + esc(c.rule) + "</small></button>"; });
    o += '</div><label class="suhard"><input type="checkbox" data-act="hardnext"' + (st.hard ? " checked" : "") + '> <span><b>Mode difficile</b> pour la prochaine partie : chaleur +20 %, rivaux +20 %, prix +5 % ; les revenus de prestige comptent ×1,5.</span></label>';
    if (!st.confirm) o += '<button type="button" class="btn buy" data-act="go"' + (why ? " disabled" : "") + ">Commencer la partie+</button>";
    else o += '<p class="mt-warn" role="alert">Dernière confirmation : la partie actuelle sera remise à zéro. Pense à exporter ta sauvegarde (Paramètres) si tu veux en garder une copie.</p><div class="rv-act"><button type="button" class="btn buy" data-act="confirm">Oui, recommencer avec « ' + esc(BL.data.meta.clans[st.clan].name) + ' »</button><button type="button" class="btn ghost" data-act="cancel">Annuler</button></div>';
    o += "</section>";
    if (x.runs.length) { o += '<section class="mt-card"><h3>Parties précédentes</h3><ul class="mt-runs">'; x.runs.forEach(function (r) { var c = BL.data.meta.clans[r.clan]; o += "<li>Niveau " + r.lvl + " · " + (c ? esc(c.name) : "sans clan") + (r.hard ? " · difficile" : "") + " · " + Math.round(r.t / 3600) + " h de jeu</li>"; }); o += "</ul></section>"; }
    return o;
  }
  function chalHtml(s) {
    var M = BL.meta, x = M.state(s), o = '<p class="sg-lead">Les défis sont générés sur ton appareil à partir de la date : tous les joueurs ont les mêmes défis le même jour, sans serveur ni compte. Récompense : des lingots (cosmétiques seulement).</p>';
    [["dc", "Défis du jour", x.dc], ["wc", "Défis de la semaine", x.wc]].forEach(function (g) {
      if (!g[2]) return; o += '<section class="mt-card"><h3>' + g[1] + ' <small>' + esc(g[2].key) + '</small></h3><ul class="mt-list">';
      g[2].list.forEach(function (c, i) {
        var p = M.progress(s, g[0], i), T = BL.data.meta.templates[c.t], label = T.text.replace("{n}", c.t === "earn" ? u.money(p.tg) : p.tg), why = M.whyClaim(s, g[0], i);
        o += '<li><div class="mt-ch"><b>' + esc(T.name) + "</b><span>" + esc(label) + '</span><div class="mt-bar" role="img" aria-label="' + Math.round(p.p * 100) + ' pour cent"><i style="transform:scaleX(' + p.p.toFixed(3) + ')"></i></div><small>' + (c.t === "earn" ? u.money(p.cur) + " / " + u.money(p.tg) : Math.floor(p.cur) + " / " + p.tg) + "</small></div>" + (p.claimed ? '<span class="rv-ok">Réclamé ✓</span>' : '<button type="button" class="btn ghost" data-act="claim" data-k="' + g[0] + '" data-i="' + i + '"' + (why ? " disabled" : "") + ">+" + p.reward + " lingot" + (p.reward > 1 ? "s" : "") + "</button>") + (why && p.done && !p.claimed ? '<small class="sg-why">' + esc(why) + "</small>" : "") + "</li>";
      });
      o += "</ul></section>";
    });
    return o;
  }
  function succHtml(s) {
    var M = BL.meta, A = BL.data.achievements, o = '<section class="mt-card"><h3>Collections</h3><ul class="mt-coll">';
    M.collections(s).forEach(function (c) { o += "<li><b>" + esc(c.name) + "</b><span>" + c.have + " / " + c.total + '</span><div class="mt-bar" role="img" aria-label="' + c.have + " sur " + c.total + '"><i style="transform:scaleX(' + (c.have / c.total).toFixed(3) + ')"></i></div></li>'; }); o += "</ul></section>";
    var n = A.filter(function (a) { return s.ach[a.id]; }).length; o += '<section class="mt-card"><h3>Succès <small>' + n + " / " + A.length + '</small></h3><ul class="mt-ach">';
    A.forEach(function (a) { var d = !!s.ach[a.id]; o += '<li class="' + (d ? "done" : "") + '"><b>' + (d ? "✓ " : "") + esc(a.name) + "</b><span>" + esc(a.desc) + "</span></li>"; }); return o + "</ul></section>";
  }
  function paint(force) {
    if (!open || !S) return; var s = S, g = st.tab + "|" + st.clan + st.hard + st.confirm + st.flash + "|" + JSON.stringify([s.meta, s.ach]) + "|" + Math.floor(s.money / 1e4) + "|" + Math.floor(s.total / 1e5);
    if (!force && g === bsig) return; bsig = g; var sc = el.body.scrollTop;
    Array.prototype.forEach.call(el.tabs.children, function (b) { var on = b.dataset.tab === st.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    el.body.innerHTML = (st.flash ? '<p class="sg-flash" role="status">' + esc(st.flash) + "</p>" : "") + (st.tab === "pres" ? presHtml(s) : st.tab === "chal" ? chalHtml(s) : succHtml(s)); el.body.scrollTop = force ? 0 : sc;
  }
  function onBody(e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled || !S) return; var a = b.dataset.act;
    if (a === "clan") { st.clan = b.dataset.id; st.confirm = false; }
    else if (a === "hardnext") st.hard = b.checked; else if (a === "hardnow") { var ok = h.metaHard(b.checked); st.flash = ok ? (b.checked ? "Mode difficile activé." : "Mode normal.") : "Trop tard : le mode se choisit au début d’une partie."; }
    else if (a === "go") st.confirm = true; else if (a === "cancel") st.confirm = false;
    else if (a === "confirm") { var r = h.metaPrestige(st.clan, st.hard); st.flash = r ? "Nouvelle partie+ en préparation…" : "Impossible pour l’instant."; }
    else if (a === "claim") { var r2 = h.metaClaim(b.dataset.k, +b.dataset.i); st.flash = r2 ? "+" + r2.gold + " lingot" + (r2.gold > 1 ? "s" : "") + " reçu" + (r2.gold > 1 ? "s" : "") + "." : "Impossible pour l’instant."; }
    paint(true);
  }
  function mkBtn() {
    var b = mk("button", "sagabtn metabtn", '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M12 2l3 6.500 7 .800-5.200 4.800 1.500 7L12 17.600 5.700 21.100l1.500-7L2 9.300l7-.800z"/></svg><span class="sb-t">Carrière</span><span class="sb-n"></span>'); b.type = "button"; b.setAttribute("aria-haspopup", "dialog"); b.onclick = function () { openDlg(b); }; return b;
  }
  function place() { var d = $("v_dash"); if (d && !d.querySelector(".metabtn")) { btn = mkBtn(); var rb = d.querySelector(".rivbtn") || d.querySelector(".sagabtn"); d.insertBefore(btn, rb ? rb.nextSibling : d.firstChild); } }
  function update(s) {
    S = s; if (!BL.meta) return; if (!btn) place();
    if (btn) { var x = BL.meta.state(s), ready = !BL.meta.why(s), cl = 0; ["dc", "wc"].forEach(function (k) { if (x[k]) x[k].list.forEach(function (c, i) { if (!BL.meta.whyClaim(s, k, i)) cl++; }); });
      var t = (cl ? cl + " défi" + (cl > 1 ? "s" : "") + " à réclamer" : ready ? "Prestige disponible" : x.pr ? "Prestige " + x.pr : "Défis · succès"); if (t !== sig) { sig = t; btn.querySelector(".sb-n").textContent = t; btn.classList.toggle("new", !!cl || ready); btn.setAttribute("aria-label", "Carrière : " + t + ". Ouvrir."); } }
    if (open) paint(false);
  }
  function init(handlers, util) { h = handlers; u = util; place(); }
  BL.metaUI = { init: init, update: update, open: function (tab) { openDlg(null, tab); }, close: close, isOpen: function () { return open; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
