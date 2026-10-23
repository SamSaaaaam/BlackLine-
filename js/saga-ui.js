/* La trame du parrain (Partie 13 · C1) : fenêtre « Histoire » (liste des chapitres, scène, décisions, fin) et bouton du tableau de bord.
   Toute la règle est dans BL.saga ; ici on affiche. Ce qui est écrit sur un bouton de choix est exactement ce qui sera appliqué (BL.saga.fxLines). */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, el = {}, open = false, from = null, btn = null, sig = "", lastSel = null, bsig = "", st = { sel: null, flash: null, tab: "ch" };
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function G() { return BL.saga; }
  function member(id) { var r = null; BL.data.crew.members.forEach(function (m) { if (m.id === id) r = m; }); return r; }
  var ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  function TN() { return BL.data.saga.tones; }
  function pic(ch) { var m = member(ch.who); return m && BL.portraits ? '<figure class="sg-pic">' + BL.portraits.portrait(m.look, { label: m.name, id: m.id }) + "<figcaption><b>" + esc(m.name) + "</b><span>" + esc(m.role || "") + "</span></figcaption></figure>" : ""; }
  function whoName(ch) { var m = member(ch.who); return m ? m.name : ""; }
  function need(ch, cur) { var o = []; if (cur.haveLvl < ch.need.lvl) o.push("niveau d’empire " + ch.need.lvl + " (tu es niveau " + cur.haveLvl + ")"); if (cur.haveTerr < ch.need.terr) o.push(ch.need.terr + " quartier" + (ch.need.terr > 1 ? "s" : "") + " contrôlé" + (ch.need.terr > 1 ? "s" : "") + " (tu en as " + cur.haveTerr + ")"); return o.join(" et "); }
  function state(s) { var cur = G().current(s); return cur ? (cur.ready ? "ready" : "wait") : "end"; }

  /* Partie 14 : l'Histoire est une page du menu (catégorie « Histoire », sous QG), plus une fenêtre. */
  function page() { return $("v_saga"); }
  function shown() { var r = page(); return !!r && !r.hidden; }
  function build() {
    if (el.root) return; var r = page(); if (!r) return;
    r.innerHTML = '<div class="sg-box"><header class="sg-h"><button type="button" class="sg-back" id="sgBack" hidden>‹ Chapitres</button><h2 id="sgTitle">Histoire</h2></header><div class="sg-body" id="sgBody"></div></div>';
    el.root = r; el.body = r.querySelector("#sgBody"); el.back = r.querySelector("#sgBack"); el.title = r.querySelector("#sgTitle");
    el.back.onclick = function () { st.sel = null; paint(true); };
    el.body.addEventListener("click", onBody);
    el.body.addEventListener("keydown", function (e) { var t = e.target.closest && e.target.closest(".sg-tab"); if (!t || (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End")) return; e.preventDefault(); var k = TABS.map(function (x) { return x[0]; }), i = k.indexOf(st.tab); i = e.key === "Home" ? 0 : e.key === "End" ? k.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + k.length) % k.length; st.tab = k[i]; paint(true); var nt = el.body.querySelector(".sg-tab.on"); if (nt) nt.focus(); });
  }
  /* ouvre la page ; toChapter : va directement au chapitre prêt */
  function openDlg(src, toChapter) {
    if (!S && BL.main && BL.main.state) S = BL.main.state(); if (!S) return; build(); var cur = G().current(S); st.sel = toChapter && cur && cur.ready ? cur.ch.id : null; st.flash = null;
    if (BL.ui && BL.ui.go) BL.ui.go("saga"); paint(true); var f = el.root && el.root.querySelector(".sg-go, .sg-tab.on"); if (f && f.focus) try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function close() { st.sel = null; if (el.root && shown()) paint(true); }

  function pips(s) { var cs = G().chapters(), cur = G().current(s), o = '<ol class="sg-pips" aria-hidden="true">'; cs.forEach(function (ch, i) { var d = G().complete(s, ch.id), c = cur && cur.ch.id === ch.id; o += '<li class="' + (d ? "done" : c ? "cur" : "") + '">' + ROM[i] + "</li>"; }); return o + "</ol>"; }
  function toneBars(s) {
    var t = G().tones(s), tot = t.c + t.f + t.l, o = '<div class="sg-tones" role="list">';
    ["c", "f", "l"].forEach(function (k) { var pct = tot ? Math.round(t[k] / tot * 100) : 0; o += '<div class="sg-tn t-' + k + '" role="listitem"><span>' + esc(TN()[k]) + "</span><b>" + t[k] + '</b><i aria-hidden="true"><s style="transform:scaleX(' + (pct / 100).toFixed(2) + ')"></s></i></div>'; });
    var lead = !tot ? "Aucune décision prise : ta voie n’est pas encore tracée." : (function () { var mx = Math.max(t.c, t.f, t.l), n = ["c", "f", "l"].filter(function (k) { return t[k] === mx; }); return n.length > 1 ? "Tes voies sont à égalité pour l’instant." : "Tu règnes surtout par la voie : " + TN()[n[0]].toLowerCase() + "."; })();
    return o + '</div><p class="sg-note">' + esc(lead) + " La fin est calculée quand le dernier chapitre est terminé (la dernière décision compte double).</p>";
  }
  function fxBlock(s) { var l = G().fxLines(G().fx(s)); return l.length ? '<ul class="sg-fx sg-fx2">' + l.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : '<p class="sg-note">Aucun effet permanent pour l’instant : tes décisions en créeront.</p>'; }
  function journal(s) {
    var o = "", n = 0; G().chapters().forEach(function (ch, i) {
      var p = G().picked(s, ch.id), rows = ""; ch.decisions.forEach(function (d) { var x = p[d.id] && G().opt(ch, d.id, p[d.id]); if (x) { n++; rows += '<li class="t-' + x.o.tone + '"><small>' + esc(d.q) + "</small><b>" + esc(x.o.label) + '</b><em>' + esc(TN()[x.o.tone]) + "</em></li>"; } });
      if (rows) o += '<li class="sg-jc"><button type="button" class="sg-jt" data-ch="' + ch.id + '"><span>' + ROM[i] + "</span>" + esc(ch.title) + "<small>relire</small></button><ul>" + rows + "</ul></li>";
    });
    return n ? '<ol class="sg-journal">' + o + "</ol>" : '<p class="sg-note">Ton journal est vide : il se remplit à chaque décision, et chaque chapitre reste relisible.</p>';
  }
  function endings(s) {
    var o = '<div class="sg-endings">'; BL.data.saga.endings.forEach(function (e) { var got = s.saga.ends.indexOf(e.id) >= 0; o += '<div class="sg-ed ' + (got ? "got t-" + e.tone : "") + '"><span>' + (got ? "Fin découverte" : "Fin à découvrir") + "</span><b>" + (got ? esc(e.title) : "« ? »") + "</b><small>" + esc(got ? e.text.split(". ")[0] + "." : e.hint) + "</small></div>"; }); return o + "</div>";
  }
  var TABS = [["ch", "Chapitres"], ["world", "Le monde"], ["cast", "Personnages"], ["way", "Ta voie"]];
  function tabsHtml() { return '<div class="sg-tabs" role="tablist" aria-label="Sections de l’histoire">' + TABS.map(function (t) { var on = st.tab === t[0]; return '<button type="button" role="tab" class="sg-tab' + (on ? " on" : "") + '" data-tab="' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + t[1] + "</button>"; }).join("") + "</div>"; }
  function facCard(f) { var d = (BL.data.crew && BL.data.crew.factions && BL.data.crew.factions[f.id]) || {}; return '<li class="sg-fc" style="--fc:' + esc(d.color || "#e3c680") + '"><b>' + esc(f.name) + "</b>" + (d.motto ? "<q>" + esc(d.motto) + "</q>" : "") + "<p>" + esc(f.text) + "</p></li>"; }
  function worldHtml() {
    var D = BL.data.saga, W = D.world;
    return '<section class="sg-sec sg-lore"><h4>' + esc(W.title) + '</h4><blockquote class="sg-epi">' + esc(D.epigraph) + "</blockquote>" + W.paras.map(function (x, i) { return '<p class="sg-lp' + (i === 0 ? " sg-first" : "") + '">' + esc(x) + "</p>"; }).join("") + "</section>" +
      '<section class="sg-sec"><h4>Les quatre puissances</h4><ul class="sg-facs">' + D.factions.map(facCard).join("") + "</ul></section>" +
      '<section class="sg-sec"><h4>Comment ça marche</h4><dl class="sg-rules">' + W.rules.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + '</dl><details class="sg-how"><summary>Les détails en cinq points</summary><ul>' + D.how.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details></section>";
  }
  function castHtml(s) {
    var D = BL.data.saga, cs = G().chapters(), o = '<section class="sg-sec"><h4>Ceux qui t’entourent</h4><p class="sg-note">Chaque chapitre met l’un de tes proches face à toi. Ils se débloquent au fil de l’histoire.</p><ul class="sg-cast">';
    cs.forEach(function (ch, i) { var m = member(ch.who); if (!m) return; var seen = G().complete(s, ch.id) || (S.saga.seen && S.saga.seen.indexOf(ch.id) >= 0); o += '<li class="sg-cm"><figure class="sg-pic">' + (BL.portraits ? BL.portraits.portrait(m.look, { label: m.name, id: m.id }) : "") + "</figure><div><span class=\"sg-kick\">Chapitre " + ROM[i] + "</span><b>" + esc(m.name) + "</b><em>« " + esc(m.nick || "") + " » · " + esc(m.role || "") + "</em><p>" + esc(D.cast[ch.who] || m.bio || "") + "</p>" + (seen ? "" : '<small class="sg-note">Pas encore rencontré dans l’histoire.</small>') + "</div></li>"; });
    return o + "</ul></section>";
  }
  function wayHtml(s) {
    var o = '<section class="sg-sec"><h4>Ton règne</h4>' + toneBars(s) + "<h5>Effets permanents de tes décisions</h5>" + fxBlock(s) + "</section>"; var en = G().ending(s); if (en) o += endHtml(en);
    o += '<section class="sg-sec"><h4>Les fins <small>' + s.saga.ends.length + " / " + BL.data.saga.endings.length + " découvertes</small></h4>" + endings(s) + "</section>";
    return o + '<section class="sg-sec"><h4>Journal des décisions</h4>' + journal(s) + "</section>";
  }
  function listHtml(s) {
    var cur = G().current(s), cs = G().chapters(), nd = cs.filter(function (c) { return G().complete(s, c.id); }).length, o = "";
    o += '<section class="sg-hero"><span class="sg-kick">Histoire · la trame du parrain</span><h3 class="sg-big">Le prix du pouvoir</h3><p class="sg-pitch">' + esc(BL.data.saga.intro) + "</p>" + pips(s) +
      '<p class="sg-progt">' + (cur ? "Chapitre " + (cur.index + 1) + " sur " + cs.length + " · " + nd + " terminé" + (nd > 1 ? "s" : "") : "Histoire terminée : " + cs.length + " chapitres sur " + cs.length) + "</p>";
    if (cur && cur.ready) o += '<button type="button" class="sg-go" data-ch="' + cur.ch.id + '"><span>' + (cur.started ? "Continuer" : "Lire maintenant") + " · chapitre " + (cur.index + 1) + "</span><b>" + esc(cur.ch.title) + "</b></button>";
    else if (cur) o += '<p class="sg-wait"><b>Prochain chapitre : ' + esc(cur.ch.title) + "</b><span>Verrouillé : " + esc(need(cur.ch, cur)) + ".</span></p>";
    o += "</section>" + tabsHtml() + '<div class="sg-panel" role="tabpanel">';
    if (st.tab === "world") return o + worldHtml() + "</div>";
    if (st.tab === "cast") return o + castHtml(s) + "</div>";
    if (st.tab === "way") return o + wayHtml(s) + "</div>";
    o += '<section class="sg-sec"><h4>Les chapitres</h4><ol class="sg-list">';
    cs.forEach(function (ch, i) {
      var done = G().complete(s, ch.id), isCur = cur && cur.ch.id === ch.id, state = done ? "done" : isCur && cur.ready ? "ready" : "lock", sub = done ? "Terminé · relire" : isCur && cur.ready ? (cur.started ? "En cours · continuer" : "Nouveau · à lire") : isCur ? "Verrouillé : " + need(ch, cur) : "Verrouillé : termine le chapitre précédent";
      o += '<li><button type="button" class="sg-ch ' + state + '" data-ch="' + ch.id + '"' + (state === "lock" ? " disabled" : "") + '><span class="sg-n">' + ROM[i] + '</span><span class="sg-t"><b>' + esc(ch.title) + "</b><em>" + esc(ch.blurb || "") + "</em><small>" + esc(whoName(ch) ? whoName(ch) + " · " + sub : sub) + "</small></span></button></li>";
    });
    return o + "</ol></section></div>";
  }
  function endHtml(en) { return '<section class="sg-end" aria-label="Fin"><span>Ta fin</span><h3>' + esc(en.title) + "</h3><p>" + esc(en.text) + '</p><ul class="sg-fx">' + G().fxLines(en.fx).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></section>"; }
  function sceneHtml(s, ch) {
    var cur = G().current(s), active = cur && cur.ch.id === ch.id && cur.ready, p = G().picked(s, ch.id), ix = G().chapters().indexOf(ch), n = G().chapters().length;
    var o = '<header class="sg-card"><span class="sg-rom" aria-hidden="true">' + ROM[ix] + '</span><span class="sg-kick">Chapitre ' + ROM[ix] + " sur " + ROM[n - 1] + '</span><h3 class="sg-ct">' + esc(ch.title) + '</h3><i class="sg-orn" aria-hidden="true">◆ ◆ ◆</i></header><div class="sg-scene">' + pic(ch) + '<div class="sg-txt"><div class="sg-prose">' + ch.scenes.map(function (x, k) { return '<p' + (k === 0 ? ' class="sg-first"' : "") + ">" + esc(x) + "</p>"; }).join("") + "</div></div></div>";
    if (!G().complete(s, ch.id)) o += '<p class="sg-warn">Décide avec soin : un choix est définitif. Chaque réponse est classée dans une voie (discrétion, peur ou loyauté) et pèse sur ta fin.</p>';
    ch.decisions.forEach(function (d) {
      var chosen = p[d.id]; o += '<section class="sg-dec"><h4>' + esc(d.q) + '</h4><div class="sg-opts">';
      d.opts.forEach(function (op) {
        var lines = G().fxLines(op.fx), why = !chosen && active ? G().why(s, ch.id, d.id, op.id) : "", dis = !!chosen || !active || !!why, on = chosen === op.id;
        o += '<button type="button" class="sg-opt t-' + op.tone + (on ? " on" : "") + '" data-ch="' + ch.id + '" data-d="' + d.id + '" data-o="' + op.id + '"' + (dis ? " disabled" : "") + (on ? ' aria-pressed="true"' : "") + "><span class=\"sg-voie\">Voie : " + esc(TN()[op.tone]) + "</span><b>" + esc(op.label) + (on ? " ✓" : "") + "</b>" +
          '<ul>' + lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" + (why ? '<small class="sg-why">' + esc(why) + "</small>" : "") + "</button>";
      });
      o += "</div></section>";
    });
    if (st.flash && st.flash.ch === ch.id) o += '<p class="sg-flash" role="status">' + esc(st.flash.text) + "</p>";
    if (G().complete(s, ch.id) && BL.report) { var cl = []; ch.decisions.forEach(function (d) { var opx = G().opt(ch, d.id, p[d.id]); if (opx) cl.push(d.q + " : " + opx.o.label + "."); }); o += BL.report.news({ head: "Le parrain frappe encore", sub: ch.title, lines: cl, foot: "Chapitre " + (G().chapters().indexOf(ch) + 1) + " sur " + G().chapters().length + " : décisions définitives." }); }
    if (G().complete(s, ch.id)) { var en = G().ending(s); if (en && ch.id === G().chapters()[G().chapters().length - 1].id) o += endHtml(en); }
    return o;
  }
  function paint(force) {
    if (!shown() || !S || !el.root) return; var s = S, g = JSON.stringify(s.saga) + "|" + st.sel + "|" + st.tab + "|" + Math.floor(s.money / 1e3) + "|" + (G().current(s) || {}).ready + (st.flash ? st.flash.text : ""); /* le coût d'un choix dépend de l'argent */
    if (!force && g === sig) return; sig = g; var sc = el.body.scrollTop, ch = st.sel && G().chapter(st.sel);
    el.back.hidden = !ch; el.title.textContent = ch ? "Chapitre " + ROM[G().chapters().indexOf(ch)] : "La trame du parrain"; el.body.innerHTML = ch ? sceneHtml(s, ch) : listHtml(s); el.body.scrollTop = force ? 0 : sc; if (force && st.sel !== lastSel) { lastSel = st.sel; var mn = doc.querySelector(".main"); if (mn) mn.scrollTop = 0; try { root.scrollTo(0, 0); } catch (e) {} }
  }
  function onBody(e) {
    var o = e.target.closest(".sg-opt"), c = e.target.closest(".sg-ch, .sg-go, .sg-jt"); if (!S) return;
    if (c && !c.disabled && c.dataset.ch) { st.sel = c.dataset.ch; st.flash = null; paint(true); return; }
    var tb = e.target.closest(".sg-tab"); if (tb) { st.tab = tb.dataset.tab; paint(true); var nt = el.body.querySelector(".sg-tab.on"); if (nt) nt.focus(); return; }
    if (o && !o.disabled) {
      var r = h.sagaChoose ? h.sagaChoose(o.dataset.ch, o.dataset.d, o.dataset.o) : null; if (r) { var bits = []; if (r.money) bits.push((r.money > 0 ? "+" : "−") + u.money(Math.abs(r.money))); if (r.gold) bits.push("+" + r.gold + " lingots"); st.flash = { ch: o.dataset.ch, text: "Décision prise : « " + r.option.label + " »." + (bits.length ? " " + bits.join(" · ") + "." : "") + (r.chapterDone ? " Chapitre terminé." : "") }; }
      else st.flash = { ch: o.dataset.ch, text: "Ce choix n’est pas possible pour l’instant." };
      paint(true);
    }
  }
  /* pastille « nouveau chapitre » sur l'entrée Histoire du menu */
  function dot(s) {
    var cur = G().current(s), on = !!(cur && cur.ready); Array.prototype.forEach.call(doc.querySelectorAll('[data-view="saga"]'), function (b) { var d = b.querySelector(".dot"); if (on && !d) { d = doc.createElement("span"); d.className = "dot"; d.setAttribute("aria-label", "Nouveau chapitre"); b.appendChild(d); } else if (!on && d) b.removeChild(d); });
  }
  function update(s) {
    S = s; if (!G()) return; dot(s); if (shown()) { build(); paint(false); }
  }
  function init(handlers, util) { h = handlers; u = util; build(); }
  BL.sagaUI = { init: init, update: update, open: function (to) { openDlg(null, to); }, openChapter: function () { openDlg(null, true); }, close: close, isOpen: function () { return shown(); }, _debug: function () { return { st: st }; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
