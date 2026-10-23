/* Carte : boutons ronds Bâtiments / Décos / Modifier, menu « Bâtiments » (catégories, cartes, raisons précises), mode placement avec validation explicite.
   Aucune règle ici : tout passe par BL.dbuild (quartiers) et les gestionnaires du jeu (QG, décors). Un seul menu, un seul mode placement. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, E, DB, T;
  var CATS = ["Illégal", "Légal", "Défense", "Spécial"], QG = { "Illégal": ["backroom", "freight", "fence"], "Légal": ["estate", "holding"] };
  var X = { open: false, mode: "bat", tab: "Illégal", ctx: null, place: null, sig: "", busy: false, lastBtn: null }, el = {};
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pc(x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }
  function ico(n) {
    var P = { build: "M3 21V9l6-4v16M9 21V3l12 6v12M3 21h18M13 12h4M13 16h4", deco: "M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.7 6.6 19.6l1.2-6L3.3 9.4l6.1-.8z", edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4" };
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + P[n] + '"/></svg>';
  }
  function controlled() { return BL.data.territory.districts.filter(function (d) { return T.lv(S, d.id) > 0; }); }

  /* ---------- état d'une carte ---------- */
  var PRI = { money: 4, level: 3, plot: 2, built: 1, none: 0 };
  function cardD(t) {
    var ds = controlled(), c = { kind: "d", id: t.id, t: t, ok: false, why: "", cost: 0, where: [], builtIn: [] }, best = null;
    if (X.ctx) ds = ds.filter(function (d) { return d.id === X.ctx.did; });
    ds.forEach(function (d) {
      var k = DB.check(S, d.id, t.id, X.ctx ? X.ctx.idx : undefined), cost = DB.cost(S, d.id, t.id);
      if (DB.has(S, d.id, t.id)) { c.builtIn.push(d.short); (c.builtIds = c.builtIds || []).push(d.id); }
      if (k.ok) { c.ok = true; c.where.push(d.short); c.cost = c.cost ? Math.min(c.cost, cost) : cost; return; }
      var pr = k.short ? PRI.money : /niveau/.test(k.why) ? PRI.level : /pas libre|terrain libre/.test(k.why) ? PRI.plot : PRI.built;
      if (!best || pr > best.pr) best = { pr: pr, why: k.why, short: k.short, missing: k.missing, cost: cost, d: d };
    });
    if (!c.ok) {
      if (!ds.length) { c.why = X.ctx ? "Ce quartier n’est plus sous ton contrôle." : "Aucun quartier contrôlé : conquiers-en un dans Territoires."; c.cost = DB.cost(S, BL.data.territory.districts[0].id, t.id); }
      else { c.why = best.short ? "Il te manque " + u.money(best.missing) + "." : (ds.length > 1 && best.pr === PRI.built ? "Déjà construit dans tous tes quartiers." : best.why); c.cost = best.cost; c.money = !!best.short; }
    }
    return c;
  }
  function cardQ(a) {
    var cnt = E.buildings(S, a.id), max = BL.mapData.LOTS.perActivity, unl = E.actUnlocked(S, a), c = { kind: "q", id: a.id, a: a, ok: false, why: "", cost: 0, cnt: cnt, max: max };
    if (!unl) { var ul = E.find(BL.data.activities, a.unlock.id); c.why = ul.name + " : meilleur bâtiment niveau " + a.unlock.lvl + " requis."; c.cost = E.cost(a, 0, S); return c; }
    if (cnt >= max) { c.why = "Tous les bâtiments sont construits (" + cnt + " / " + max + ")."; c.done = true; return c; }
    if (cnt === 0) { c.cost = E.cost(a, 0, S); } else { var nb = E.nextBuilding(S, a); if (!nb || !nb.ok) { c.why = "Meilleur bâtiment niveau " + BL.mapData.LOTS.thresholds[cnt] + " requis (" + E.best(S, a.id) + " / " + BL.mapData.LOTS.thresholds[cnt] + ")."; c.cost = nb ? nb.cost : 0; return c; } c.cost = nb.cost; }
    if (S.money + 1e-9 < c.cost) { c.why = "Il te manque " + u.money(c.cost - S.money) + "."; c.money = true; return c; }
    c.ok = true; return c;
  }
  function cards(tab) {
    var out = [];
    (QG[tab] || []).forEach(function (id) { out.push(cardQ(E.find(BL.data.activities, id))); });
    BL.data.dbuild.types.filter(function (t) { return t.cat === tab; }).forEach(function (t) { out.push(cardD(t)); });
    return out;
  }
  function effect(c) {
    if (c.kind === "q") return c.a.cat + " · " + c.a.desc;
    var t = c.t, bits = [];
    if (t.inc) bits.push("Revenus +" + pc(t.inc)); if (t.def) bits.push("Défense du quartier +" + pc(t.def));
    if (t.heat) bits.push("Chaleur " + (t.heat > 0 ? "+" : "−") + String(Math.abs(t.heat)).replace(".", ",") + " / min"); else if (!t.def) bits.push("Chaleur neutre");
    return bits.join(" · ");
  }
  function art(c) { return c.kind === "q" ? BL.art.act(c.a.id) : BL.dbArt.svg(c.id, c.where.length ? BL.data.territory.districts.filter(function (d) { return d.short === c.where[0]; })[0].id : (X.ctx ? X.ctx.did : "center")); }

  /* ---------- rendu du menu ---------- */
  function sigOf(list) { return X.mode + X.tab + (X.ctx ? X.ctx.did + X.ctx.idx : "") + list.map(function (c) { return c.id + (c.ok ? 1 : 0) + c.why + (c.where ? c.where.join("") : "") + Math.round(c.cost || 0) + (c.cnt === undefined ? "" : c.cnt); }).join("|"); }
  function renderBat() {
    var list = cards(X.tab), sig = sigOf(list); if (sig === X.sig) return; X.sig = sig;
    var keep = doc.activeElement && el.list.contains(doc.activeElement) ? doc.activeElement.getAttribute("data-act") : null, top = el.list.scrollTop;
    el.list.innerHTML = "";
    list.forEach(function (c) {
      var card = mk("article", "bmc" + (c.ok ? " ok" : " no") + (c.done ? " done" : "")), name = c.kind === "q" ? c.a.name : c.t.name;
      var state = c.ok ? (c.kind === "q" ? "Constructible au QG" : c.where.length > 1 ? "Constructible : " + c.where.length + " quartiers" : "Constructible : " + c.where[0]) : c.why;
      card.innerHTML = '<div class="bmc-art">' + art(c) + '</div><div class="bmc-b"><div class="bmc-n">' + esc(name) + (c.kind === "q" ? '<i class="bmc-tag">QG ' + c.cnt + " / " + c.max + "</i>" : "") + '</div><div class="bmc-e">' + esc(effect(c)) + '</div><div class="bmc-s ' + (c.ok ? "ok" : "ko") + '">' + esc(state) + '</div>' +
        (c.kind === "d" && c.builtIn.length ? '<div class="bmc-i">Déjà construit : ' + esc(c.builtIn.join(", ")) + "</div>" : "") + '<div class="bmc-f"><b>' + (c.cost ? (c.ok || c.money ? "" : "à partir de ") + u.money(c.cost) : "—") + "</b></div></div>";
      var b = mk("button", "btn bmc-go" + (c.ok ? " can" : ""), c.done ? "Terminé" : c.ok ? "Placer" : "Indisponible"); b.setAttribute("data-act", c.id); b.disabled = !c.ok; b.setAttribute("aria-label", (c.ok ? "Placer : " : "Indisponible : ") + name + (c.ok ? "" : ". " + c.why));
      b.onclick = function () { choose(c); }; card.querySelector(".bmc-f").appendChild(b);
      if (c.kind === "d" && c.id === "casino" && c.builtIds && c.builtIds.length && BL.casinoUI) { var en = mk("button", "btn ghost bmc-go", "Entrer"); en.type = "button"; en.setAttribute("data-act", "enter"); en.onclick = function () { close(true); BL.casinoUI.enter({ did: c.builtIds[0] }); }; card.querySelector(".bmc-f").appendChild(en); } el.list.appendChild(card);
    });
    el.list.scrollTop = top; if (keep) { var k = el.list.querySelector('[data-act="' + keep + '"]'); if (k && !k.disabled) k.focus(); }
  }
  function renderDeco() {
    var W = BL.walls, L = W.list(), sig = "deco" + L.map(function (w) { return w.id + (W.owned(S, w.id) ? 1 : 0); }).join("") + W.st(S).on; if (sig === X.sig) return; X.sig = sig;
    el.list.innerHTML = ""; var cur = W.current(S), own = L.filter(function (w) { return W.owned(S, w.id); });
    el.list.appendChild(mk("p", "bm-note", "Les décors changent l’ambiance de ta ville, pas tes revenus : ils sont purement décoratifs. Tu en as <b>" + own.length + "</b> sur " + L.length + "."));
    own.forEach(function (w) {
      var on = cur && cur.id === w.id, row = mk("article", "bmc bmd" + (on ? " ok" : ""), '<div class="bmc-b"><div class="bmc-n">' + esc(w.name) + '</div><div class="bmc-e">' + esc(w.desc || "") + "</div></div>");
      var b = mk("button", "btn" + (on ? "" : " can"), on ? "Retirer" : "Équiper"); b.setAttribute("data-act", w.id); b.onclick = function () { if (on) h.wallUnequip(); else h.wallEquip(w.id); if (BL.wallsUI) BL.wallsUI.update(S); X.sig = ""; renderDeco(); }; row.appendChild(b); el.list.appendChild(row);
    });
    var shop = mk("button", "btn ghost bm-shop", own.length < L.length ? "Voir les autres décors à la boutique" : "Ouvrir la boutique"); shop.onclick = function () { close(true); u.go("shop"); }; el.list.appendChild(shop);
  }

  /* ---------- ouverture / fermeture ---------- */
  function setBtns() { ["rbBuild", "rbDeco"].forEach(function (id) { var b = $(id); if (b) b.setAttribute("aria-expanded", String(X.open && ((id === "rbBuild") === (X.mode === "bat")))); }); }
  function open(ctx, mode) {
    if (!S) return; if (X.place) cancelPlace(true);
    var ed = $("rbEdit"); if (ed && ed.getAttribute("aria-expanded") === "true") ed.click();
    X.mode = mode || "bat"; X.ctx = ctx || null; X.open = true; X.sig = ""; el.menu.hidden = false; el.menu.classList.toggle("deco", X.mode === "deco"); el.tabs.hidden = X.mode === "deco";
    u.set(el.title, X.mode === "deco" ? "Décos" : "Bâtiments");
    if (X.mode === "bat" && ctx) { var d = T.dist(ctx.did); el.ctx.hidden = false; el.ctx.innerHTML = "Terrain libre dans <b>" + esc(d.name) + "</b> · choisis ce que tu y construis. <button class=\"link\" type=\"button\">Voir tous les quartiers</button>"; el.ctx.querySelector("button").onclick = function () { X.ctx = null; el.ctx.hidden = true; X.sig = ""; render(); }; } else el.ctx.hidden = true;
    Array.prototype.forEach.call(el.tabs.children, function (b) { var on = b.dataset.t === X.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    render(); setBtns(); (X.mode === "deco" ? el.close : el.tabs.querySelector(".on")).focus();
  }
  function close(noFocus) {
    if (!X.open) return; X.open = false; el.menu.hidden = true; setBtns(); X.ctx = null;
    var b = X.mode === "deco" ? $("rbDeco") : $("rbBuild"); if (!noFocus && b && doc.activeElement !== b) b.focus();
  }
  function render() { if (!X.open) return; if (X.mode === "deco") renderDeco(); else renderBat(); }

  /* ---------- placement ---------- */
  function choose(c) {
    if (!c.ok) return;
    if (c.kind === "q") { close(true); var nextId = c.a.id + "#" + c.cnt; if (BL.mapUI && BL.mapUI.focus) BL.mapUI.focus({ type: "lot", act: c.a.id, id: nextId }); return; }
    var valid = {}, plots = [], ctx = X.ctx;
    controlled().forEach(function (d) {
      if (ctx && d.id !== ctx.did) return; if (!DB.check(S, d.id, c.id, ctx ? ctx.idx : undefined).ok) return;
      DB.freePlots(S, d.id).forEach(function (i) { if (ctx && i !== ctx.idx) return; valid[d.id + "#" + i] = true; plots.push({ id: d.id + "#" + i, did: d.id, idx: i, label: d.short + " · terrain " + (i + 1) }); });
    });
    if (!plots.length) return;
    X.place = { t: c.t, valid: valid, plots: plots, ghost: plots.length === 1 || ctx ? plots[0].id : null, ctx: ctx };
    X.open = false; el.menu.hidden = true; setBtns();
    BL.mapUI.place.start({ type: c.id, valid: valid, ghost: X.place.ghost, onTap: function (pid) { if (pid && valid[pid]) pick(pid); } });
    if (X.place.ghost) BL.mapUI.place.ghost(X.place.ghost); else BL.mapUI.place.focus(plots[0].id);
    el.bar.hidden = false; $("mapRound").classList.add("hide"); renderBar(true);
  }
  function pick(pid) { if (!X.place) return; X.place.ghost = pid; BL.mapUI.place.ghost(pid); renderBar(false); }
  function renderBar(focus) {
    var P = X.place; if (!P) return; var g = P.ghost && P.plots.filter(function (q) { return q.id === P.ghost; })[0], chk = g ? DB.check(S, g.did, P.t.id, g.idx) : null, cost = g ? DB.cost(S, g.did, P.t.id) : 0;
    var sg = P.t.id + (g ? g.id : "") + (chk ? chk.ok + chk.why : "") + Math.round(cost);
    if (el.bar.dataset.sg === sg) return; el.bar.dataset.sg = sg;
    el.bar.innerHTML = '<div class="bp-h"><b>' + esc(P.t.name) + "</b><span>" + (g ? esc(g.label) + " · " + u.money(cost) : "Touche un terrain vert sur la carte, ou choisis-en un ci-dessous.") + "</span></div>";
    var row = mk("div", "bp-plots", ""); row.setAttribute("role", "group"); row.setAttribute("aria-label", "Terrains disponibles");
    P.plots.forEach(function (q) { var b = mk("button", "btn ghost bp-p" + (g && g.id === q.id ? " on" : ""), esc(q.label)); b.setAttribute("aria-pressed", String(!!g && g.id === q.id)); b.onclick = function () { pick(q.id); }; row.appendChild(b); });
    el.bar.appendChild(row);
    if (chk && !chk.ok) el.bar.appendChild(mk("p", "bp-w", esc(chk.short ? "Il te manque " + u.money(chk.missing) + "." : chk.why)));
    var act = mk("div", "bp-a", ""), ok = mk("button", "btn can bp-ok", g ? "Valider · " + u.money(cost) : "Valider"), no = mk("button", "btn ghost bp-no", "Annuler");
    ok.disabled = !(chk && chk.ok); ok.onclick = confirm; no.onclick = function () { cancelPlace(false); }; act.appendChild(ok); act.appendChild(no); el.bar.appendChild(act);
    if (focus) { var f = row.querySelector("button"); if (f) f.focus(); }
  }
  function confirm() {
    var P = X.place; if (!P || !P.ghost || X.busy) return; var g = P.plots.filter(function (q) { return q.id === P.ghost; })[0]; if (!g) return;
    X.busy = true; var ok = h.buildDistrict(g.did, P.t.id, g.idx); setTimeout(function () { X.busy = false; }, 450);
    if (ok) endPlace(); else renderBar(false);
  }
  function endPlace() { X.place = null; el.bar.hidden = true; el.bar.dataset.sg = ""; $("mapRound").classList.remove("hide"); if (BL.mapUI && BL.mapUI.place) BL.mapUI.place.end(); var b = $("rbBuild"); if (b) b.focus(); }
  function cancelPlace(silent) { var ctx = X.place && X.place.ctx; endPlace(); if (!silent) open(ctx, "bat"); }

  /* ---------- mise en place ---------- */
  function init(handlers, util) {
    h = handlers; u = util; E = BL.economy; DB = BL.dbuild; T = BL.territory; var wrap = $("mapWrap"); if (!wrap || el.menu) return;
    var rb = mk("div", "mrb", ""); rb.id = "mapRound"; rb.setAttribute("role", "group"); rb.setAttribute("aria-label", "Construire et décorer");
    rb.innerHTML = '<button type="button" class="rbtn rb-edit" id="rbEdit" aria-label="Modifier l’affichage de la carte" aria-expanded="false" aria-controls="mLayers">' + ico("edit") + '<span>Modifier</span></button>' +
      '<button type="button" class="rbtn rb-deco" id="rbDeco" aria-label="Décos" aria-expanded="false" aria-controls="bmenu">' + ico("deco") + '<span>Décos</span></button>' +
      '<button type="button" class="rbtn rb-build" id="rbBuild" aria-label="Bâtiments" aria-expanded="false" aria-controls="bmenu">' + ico("build") + '<span>Bâtiments</span></button>';
    var m = mk("aside", "bmenu", '<header class="bm-h"><h3 id="bmTitle">Bâtiments</h3><button type="button" class="pclose bm-x" aria-label="Fermer le menu">&times;</button></header><p class="bm-ctx" hidden></p><div class="bm-tabs" role="tablist" aria-label="Catégories">' +
      CATS.map(function (c) { return '<button type="button" role="tab" data-t="' + c + '" aria-selected="false">' + c + "</button>"; }).join("") + '</div><div class="bm-list" role="tabpanel"></div>');
    m.id = "bmenu"; m.hidden = true; m.setAttribute("role", "dialog"); m.setAttribute("aria-labelledby", "bmTitle");
    var bar = mk("div", "bplace", ""); bar.id = "bplace"; bar.hidden = true; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Placement d’un bâtiment");
    wrap.appendChild(m); wrap.appendChild(bar); wrap.appendChild(rb);
    el.menu = m; el.title = m.querySelector("#bmTitle"); el.close = m.querySelector(".bm-x"); el.ctx = m.querySelector(".bm-ctx"); el.tabs = m.querySelector(".bm-tabs"); el.list = m.querySelector(".bm-list"); el.bar = bar;
    el.close.onclick = function () { close(); };
    Array.prototype.forEach.call(el.tabs.children, function (b) {
      b.onclick = function () { X.tab = b.dataset.t; X.sig = ""; Array.prototype.forEach.call(el.tabs.children, function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; }); render(); };
      b.onkeydown = function (e) { var i = Array.prototype.indexOf.call(el.tabs.children, b), n = el.tabs.children.length; if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var t2 = el.tabs.children[(i + (e.key === "ArrowRight" ? 1 : n - 1)) % n]; t2.click(); t2.focus(); e.preventDefault(); } };
    });
    $("rbBuild").onclick = function () { if (X.open && X.mode === "bat") close(); else open(null, "bat"); };
    $("rbDeco").onclick = function () { if (X.open && X.mode === "deco") close(); else open(null, "deco"); };
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (X.place) { e.preventDefault(); e.stopPropagation(); cancelPlace(false); } else if (X.open) { e.preventDefault(); close(); }
    }, true);
  }
  function update(s) {
    S = s; if (!el.menu) return;
    if (X.open) render();
    if (X.place) { var P = X.place; P.plots = P.plots.filter(function (q) { return controlled().some(function (d) { return d.id === q.did; }) && DB.freePlots(S, q.did).indexOf(q.idx) >= 0; }); if (!P.plots.length) endPlace(); else { if (P.ghost && !P.plots.some(function (q) { return q.id === P.ghost; })) { P.ghost = null; BL.mapUI.place.ghost(null); } renderBar(false); } }
  }
  BL.buildMenu = { init: init, update: update, open: open, close: close, state: function () { return { open: X.open, mode: X.mode, tab: X.tab, placing: !!X.place, ghost: X.place && X.place.ghost }; } };
})(window);
