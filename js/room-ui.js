/* QG : on ENTRE dans le bâtiment. Transition depuis la carte, pièce isométrique plein écran, placement / déplacement / rotation / retrait,
   inventaire, boutique du QG, améliorations, coffre. Toutes les dépenses sont en lingots d'or. */
(function (root) {
  var BL = root.BL = root.BL || {}, H, G, h, u, R, ctx, cv, rc = {}, S = null;
  var st = { open: false, busy: false, tab: "inv", cat: "all", placing: null, rot: 0, sel: null, cell: null, drag: null, hover: "", sig: "", f: null, raf: 0, last: 0, shown: -1 };
  function $(id) { return document.getElementById(id); }
  function el(t, c, html) { var e = document.createElement(t); if (c) e.className = c; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function motion() { return !document.body.classList.contains("nomotion"); }
  var TABS = [["inv", "Inventaire"], ["shop", "Boutique"], ["room", "Pièce"], ["style", "Style"], ["vault", "Coffre"]];
  function rar(d) { return H.RAR[d.rar]; }

  /* ---------- structure ---------- */
  function build() {
    var r = $("room"); r.innerHTML = "";
    var main = el("div", "rmain"), top = el("div", "rtop"), exit = el("button", "btn rexit", "← Sortir"); exit.id = "rExit"; exit.setAttribute("aria-label", "Sortir du QG et retourner sur la carte"); exit.onclick = function () { exit_(); };
    top.appendChild(exit); top.appendChild(el("div", "rtitle", "<b>Quartier général</b><span id=\"rSub\"></span>")); var rb = el("button", "btn ghost rradio", "♪ Radio"); rb.setAttribute("aria-label", "Ouvrir la radio"); rb.onclick = function () { BL.radioUI && BL.radioUI.openWheel(); }; top.appendChild(rb); top.appendChild(el("div", "chip gold", "<span id=\"rGold\"></span>"));
    cv = el("canvas"); cv.id = "roomCanvas"; cv.tabIndex = 0; cv.setAttribute("role", "application"); cv.setAttribute("aria-label", "Pièce du QG. Choisis un objet dans l’inventaire puis clique dans la pièce pour le poser. Clique un objet posé pour le déplacer, le pivoter ou le retirer. Échap pour sortir.");
    var hint = el("div", "rhint"); hint.id = "rHint"; var sel = el("div", "rsel"); sel.id = "rSel"; sel.hidden = true;
    main.appendChild(cv); main.appendChild(top); main.appendChild(sel); main.appendChild(hint);
    var side = el("aside", "rside"); side.id = "rSide"; var tabs = el("div", "rtabs"); tabs.setAttribute("role", "tablist");
    TABS.forEach(function (t) { var b = el("button", "rtab", t[1]); b.dataset.tab = t[0]; b.setAttribute("role", "tab"); b.onclick = function () { setTab(t[0]); }; tabs.appendChild(b); });
    var body = el("div", "rbody"); body.id = "rBody"; side.appendChild(tabs); side.appendChild(body);
    r.appendChild(main); r.appendChild(side); rc.main = main; rc.body = body; rc.tabs = tabs; rc.hint = hint; rc.sel = sel;
    ctx = cv.getContext && cv.getContext("2d"); if (ctx) R = BL.room.create(ctx);
    body.addEventListener("click", onBody);
    bind(); sel.addEventListener("click", onSel);
    if (root.ResizeObserver) new ResizeObserver(function () { if (st.open) fit(); }).observe(main); else root.addEventListener("resize", function () { if (st.open) fit(); });
  }
  function setTab(t) { st.tab = t; st.sig = ""; if (t !== "inv") st.placing = null; render(S, true); }
  function fit() {
    var w = rc.main.clientWidth, hh = rc.main.clientHeight; if (!w || !hh) return; var dpr = Math.min(2, root.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); cv.style.width = w + "px"; cv.style.height = hh + "px";
    st.f = BL.room.frame(H.size(S), cv.width, cv.height); st.f.dpr = dpr;
    /* laisse la place aux barres du haut et du bas */
    var padT = 58 * dpr, padB = 40 * dpr; st.f = BL.room.frame(H.size(S), cv.width, cv.height - padT - padB); st.f.vw = cv.width; st.f.vh = cv.height; st.f.oy += padT; st.f.dpr = dpr;
  }

  /* ---------- panneaux ---------- */
  function lingots(n) { return n + " lingot" + (n > 1 ? "s" : ""); }
  function rowHtml(d, right, sub) { return '<div class="ri"><img class="rth" alt="" src="' + R.thumb(d.id) + '"><div class="rn"><b>' + esc(d.name) + '</b><span class="rr" style="color:' + rar(d).color + '">' + rar(d).name + "</span><small>" + sub + '</small></div><div class="ra">' + right + "</div></div>"; }
  function panel(s) {
    var o = "", i;
    if (st.tab === "inv") {
      var ids = Object.keys(s.hq.inv).filter(function (k) { return H.dec(k); }), placed = s.hq.items.length;
      o += '<p class="rnote">Objets posés : <b>' + placed + " / " + H.MAXITEMS + "</b>. Choisis un objet, puis clique dans la pièce (ou glisse-le sur la grille). R pour pivoter.</p>";
      o += '<div class="ri"><div class="rn"><b>Décor de base</b><span>' + (s.hq.baseOff ? "Masqué : la pièce est vide." : "Bureau, fauteuil, lampe, bibliothèque, tableau, coffre, plante, tapis. Pose un objet sur sa place pour le remplacer.") + '</span></div><button class="btn" data-act="base">' + (s.hq.baseOff ? "Afficher" : "Masquer") + "</button></div>";
      if (!ids.length) o += '<p class="rempty">Ton inventaire est vide. Achète des objets dans l’onglet <b>Boutique</b> avec tes lingots.</p>';
      ids.sort().forEach(function (id) { var d = H.dec(id), on = st.placing === id; o += rowHtml(d, '<button class="btn ' + (on ? "can" : "") + '" data-act="pick" data-id="' + id + '">' + (on ? "Annuler" : "Poser") + "</button>", "×" + s.hq.inv[id] + " en stock · " + d.w + "×" + d.d); });
    } else if (st.tab === "shop") {
      o += '<div class="rcats">' + [["all", "Tout"]].concat(H.CATS).map(function (c) { return '<button class="mchip ' + (st.cat === c[0] ? "on" : "") + '" data-act="cat" data-id="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>";
      o += '<p class="rnote">Tu as <b>' + lingots(s.gold) + "</b>. Les lingots viennent du Coffre (onglet Coffre).</p>";
      H.DECOR.filter(function (d) { return st.cat === "all" || d.cat === st.cat; }).sort(function (a, b) { return a.rar - b.rar || a.cost - b.cost; }).forEach(function (d) {
        var own = H.owned(s, d.id), full = own >= H.MAXOWN, can = s.gold >= d.cost && !full, label = full ? "Maximum" : can ? "Acheter · " + d.cost : "Il te manque " + (d.cost - s.gold);
        o += rowHtml(d, '<button class="btn ' + (can ? "can" : "") + '" data-act="buy" data-id="' + d.id + '"' + (can ? "" : " disabled") + ">" + label + "</button>", d.cost + " lingots · possédé " + own + "/" + H.MAXOWN + " · " + d.w + "×" + d.d);
      });
    } else if (st.tab === "room") {
      o += '<p class="rnote">Améliore ta pièce avec des lingots. Chaque niveau change vraiment son aspect.</p>';
      ["size", "walls", "floor", "light"].forEach(function (k) {
        var U = H.UPG[k], lv = s.hq[k], c = H.upgradeCost(s, k), max = !c, can = !max && s.gold >= c;
        o += '<div class="ru"><div><b>' + U.name + "</b><span>" + U.names[lv] + (max ? " · niveau maximal" : " → " + U.names[lv + 1]) + '</span><i class="mt"><i style="width:' + Math.round(lv / (U.costs.length - 1) * 100) + '%"></i></i></div><button class="btn ' + (can ? "can" : "") + '" data-act="up" data-id="' + k + '"' + (can ? "" : " disabled") + ">" + (max ? "Maximum" : can ? "Améliorer · " + c : "Il te manque " + (c - s.gold)) + "</button></div>";
      });
      o += '<div class="rdanger"><b>Tout remettre à zéro</b><span>Range tous les objets posés dans l’inventaire. Rien n’est perdu ni remboursé ; les améliorations restent.</span><button class="btn danger" data-act="clear"' + (s.hq.items.length ? "" : " disabled") + ">Tout ranger (" + s.hq.items.length + ")</button></div>";
    } else if (st.tab === "style") {
      o += '<p class="rnote">Le <b>style du QG</b> change sa façade sur la carte et l’ambiance de la pièce. C’est purement esthétique : aucun effet sur le jeu. Tu peux revenir à un style possédé quand tu veux.</p>';
      H.STYLES.forEach(function (x) {
        var own = H.styleOwned(s, x.id), act = H.style(s) === x.id, can = s.gold >= x.cost, lab = act ? "Style actif" : own ? "Appliquer" : can ? "Acheter · " + x.cost : "Il te manque " + (x.cost - s.gold);
        o += '<div class="rsty' + (act ? " on" : "") + '" style="--c:' + x.acc + '"><div class="rsv">' + BL.venues.hqSvg(x.id) + '</div><div class="rsi"><b>' + esc(x.name) + "</b><span>" + esc(x.desc) + "</span><small>" + (own ? (act ? "Actif" : "Possédé") : x.cost + " lingots") + '</small><button class="btn ' + (!act && (own || can) ? "can" : "") + '" data-act="' + (own ? "stset" : "stbuy") + '" data-id="' + x.id + '"' + (act || (!own && !can) ? " disabled" : "") + ">" + lab + "</button></div></div>";
      });
    } else {
      var cap = G.capacity(s), mx = G.maxBuy(s), sp = G.space(s), vc = G.vaultCost(s);
      o += '<div class="rv"><b class="rvn">' + s.gold + '</b><span> / ' + cap + ' lingots</span><i class="mt"><i style="width:' + Math.min(100, s.gold / cap * 100) + '%"></i></i></div>';
      o += '<p class="rnote">Prochain lingot : <b>$' + u.fmt(G.nextPrice(s)) + "</b> (commission 5 % incluse). Argent : <b>" + u.money(s.money) + "</b>. Sens unique : un lingot ne se rend pas en dollars.</p>";
      [["1", 1], ["10", 10], ["max", 0]].forEach(function (d) {
        var q = d[1] || Math.max(1, mx), c = G.costFor(s, q), off = sp < 1 || q > sp || s.money + 1e-9 < c, sub = sp < 1 ? "Coffre plein" : q > sp ? "Place pour " + sp : s.money + 1e-9 < c ? "Il te manque $" + u.fmt(c - s.money) : "$" + u.fmt(c);
        o += '<button class="btn wide ' + (off ? "" : "can") + '" data-act="conv" data-id="' + d[0] + '"' + (off ? " disabled" : "") + ">" + (d[0] === "max" ? "Convertir le maximum" + (mx ? " (" + mx + ")" : "") : "Convertir " + q) + "<small>" + sub + "</small></button>";
      });
      o += '<button class="btn wide ' + (vc && s.gold >= vc ? "can" : "") + '" data-act="vup"' + (vc && s.gold >= vc ? "" : " disabled") + ">" + (vc ? "Agrandir le coffre (+" + G.P.capPerLevel + ")" : "Coffre au maximum") + "<small>" + (vc ? vc + " lingots" + (s.gold < vc ? " · il t’en manque " + (vc - s.gold) : "") : "") + "</small></button>";
    }
    return o;
  }
  function render(s, force) {
    if (!s || !st.open) return; S = s;
    var sig = [st.tab, st.cat, st.placing, s.gold, s.vault, s.hq.items.length, JSON.stringify(s.hq.inv), s.hq.size, s.hq.walls, s.hq.floor, s.hq.light, s.hq.style, JSON.stringify(s.hq.styles), st.tab === "vault" ? Math.floor(s.money / 1e3) + ":" + G.maxBuy(s) : ""].join("|");
    [].forEach.call(rc.tabs.children, function (b) { var on = b.dataset.tab === st.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    if (force || sig !== st.sig) { st.sig = sig; var sc = rc.body.scrollTop; rc.body.innerHTML = panel(s); rc.body.scrollTop = sc; }
    var g = $("rGold"); if (g) { var t = s.gold + " / " + G.capacity(s); if (g.textContent !== t) g.textContent = t; g.parentNode.title = s.gold + " lingot(s) dans le coffre"; }
    var sub = $("rSub"); if (sub) sub.textContent = H.UPG.size.names[s.hq.size]; selBar(s); hintText(s);
  }
  function selBar(s) {
    var it = st.sel && H.find(s, st.sel); if (!it) { rc.sel.hidden = true; st.sel = null; rc.sel.dataset.k = ""; return; }
    var k = it.u + ":" + it.id; if (rc.sel.dataset.k !== k) { rc.sel.dataset.k = k; var d = H.dec(it.id); rc.sel.innerHTML = "<b>" + esc(d.name) + '</b><button class="btn" data-act="rot">Pivoter</button><button class="btn danger" data-act="rem">Retirer</button><button class="btn ghost" data-act="desel" aria-label="Fermer">✕</button>'; }
    rc.sel.hidden = false;
  }
  function hintText(s) {
    var t = st.placing ? "Clique pour poser · R ou Pivoter pour tourner · Échap pour annuler" : st.sel ? "Glisse l’objet pour le déplacer · R pour le pivoter · Suppr pour le retirer" : "Choisis un objet dans l’inventaire, ou clique un objet pour le modifier. Clique le coffre ou la porte.";
    if (rc.hint.textContent !== t) rc.hint.textContent = t;
  }

  /* ---------- actions ---------- */
  function onBody(e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; var a = b.dataset.act, id = b.dataset.id, s = S;
    if (a === "pick") { st.placing = st.placing === id ? null : id; st.rot = 0; st.sel = null; if (!st.placing) st.cell = null; BL.audio.sfx("click"); }
    else if (a === "cat") { st.cat = id; }
    else if (a === "buy") { var d = H.dec(id); if (d.cost >= 20) { BL.sysUI.modal({ title: "Acheter « " + d.name + " » ?", text: "Cet objet " + rar(d).name.toLowerCase() + " coûte " + lingots(d.cost) + ". Tu as " + lingots(s.gold) + ".", ok: "Acheter · " + d.cost, onOk: function () { h.hqBuy(id); render(S, true); } }); return; } h.hqBuy(id); }
    else if (a === "base") h.hqBase();
    else if (a === "up") h.hqUpgrade(id);
    else if (a === "stset") h.hqStyle(id, false);
    else if (a === "stbuy") { var xs = H.styleInfo(id); if (!xs) return; BL.sysUI.modal({ title: "Acheter le style « " + xs.name + " » ?", text: "Coûte " + lingots(xs.cost) + ". Tu as " + lingots(s.gold) + ". Cosmétique uniquement ; tu pourras revenir à un autre style possédé à tout moment.", ok: "Acheter · " + xs.cost, onOk: function () { h.hqStyle(id, true); render(S, true); } }); return; }
    else if (a === "clear") { h.hqClear(function () { st.sel = null; st.placing = null; render(S, true); }); return; }
    else if (a === "conv") { var n = id === "max" ? G.maxBuy(s) : +id; if (n > 0) h.convertGold(n); }
    else if (a === "vup") h.upgradeVault();
    render(S, true);
  }
  function onSel(e) {
    var b = e.target.closest("[data-act]"); if (!b) return; var a = b.dataset.act, it = st.sel && H.find(S, st.sel); if (!it) return;
    if (a === "rot") h.hqRotate(it.u); else if (a === "rem") { if (h.hqRemove(it.u)) st.sel = null; } else if (a === "desel") st.sel = null; render(S, true);
  }
  function rotate() {
    if (st.placing) { st.rot = st.rot ? 0 : 1; BL.audio.sfx("click"); } else if (st.sel) h.hqRotate(st.sel); render(S, true);
  }

  /* ---------- pointeur ---------- */
  function pos(e) { var r = cv.getBoundingClientRect(), k = cv.width / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; }
  function anchor(id, rot, c) { var f = H.foot(id, rot); return { x: c.x - Math.floor(f.w / 2), y: c.y - Math.floor(f.d / 2) }; }
  function ghostOf() {
    if (!st.cell) return null;
    if (st.placing) { var a = anchor(st.placing, st.rot, st.cell); return { id: st.placing, x: a.x, y: a.y, r: st.rot, ok: H.fits(S, st.placing, a.x, a.y, st.rot) }; }
    if (st.drag && st.drag.moved) { var it = H.find(S, st.drag.u); if (!it) return null; var b = anchor(it.id, it.r, st.cell); return { id: it.id, x: b.x, y: b.y, r: it.r, ok: H.fits(S, it.id, b.x, b.y, it.r, it.u) }; }
    return null;
  }
  function bind() {
    cv.addEventListener("pointerdown", function (e) {
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId); cv.focus({ preventScroll: true }); var p = pos(e), c = BL.room.cellAt(st.f, p.x, p.y); st.cell = c;
      if (st.placing) { st.down = { x: p.x, y: p.y }; return; }
      var it = BL.room.pick(st.f, S.hq.items, p.x, p.y);
      if (it) { st.sel = it.u; st.drag = { u: it.u, x: p.x, y: p.y, moved: false }; BL.audio.sfx("click"); render(S, true); }
      else { st.down = { x: p.x, y: p.y, kind: hit(p) }; if (!st.down.kind) { st.sel = null; render(S, true); } }
    });
    cv.addEventListener("pointermove", function (e) {
      var p = pos(e); st.cell = BL.room.cellAt(st.f, p.x, p.y); var k = hit(p); if (k !== st.hover) { st.hover = k; cv.style.cursor = k ? "pointer" : st.placing ? "copy" : "default"; }
      if (st.drag && !st.drag.moved && Math.hypot(p.x - st.drag.x, p.y - st.drag.y) > 8 * st.f.dpr) st.drag.moved = true;
    });
    function up(e) {
      var p = pos(e), c = BL.room.cellAt(st.f, p.x, p.y); st.cell = c;
      if (st.placing && st.down) { var a = anchor(st.placing, st.rot, c), id = st.placing; if (H.fits(S, id, a.x, a.y, st.rot)) { var uu = h.hqPlace(id, a.x, a.y, st.rot); if (uu && !(S.hq.inv[id] > 0)) { st.placing = null; st.sel = uu; } } else BL.audio.sfx("error"); render(S, true); }
      else if (st.drag) { if (st.drag.moved) { var it = H.find(S, st.drag.u); if (it) { var b = anchor(it.id, it.r, c); if (H.fits(S, it.id, b.x, b.y, it.r, it.u)) h.hqMove(it.u, b.x, b.y); else BL.audio.sfx("error"); } } render(S, true); }
      else if (st.down && st.down.kind === "vault") setTab("vault"); else if (st.down && st.down.kind === "door") exit_();
      st.drag = null; st.down = null;
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", function () { st.drag = null; st.down = null; });
    cv.addEventListener("pointerleave", function () { if (!st.drag) st.cell = st.placing ? st.cell : null; });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); rotate(); });
    document.addEventListener("keydown", function (e) {
      if (!st.open) return; var m = $("modal"); if (m && !m.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); if (st.placing) { st.placing = null; render(S, true); } else if (st.sel) { st.sel = null; render(S, true); } else exit_(); }
      else if (e.key === "r" || e.key === "R") { if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; e.preventDefault(); rotate(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && st.sel) { e.preventDefault(); if (h.hqRemove(st.sel)) st.sel = null; render(S, true); }
    });
  }
  function hit(p) { if (!st.f) return ""; if (BL.room.inPoly(p.x, p.y, BL.room.vaultPoly(st.f))) return "vault"; if (BL.room.inPoly(p.x, p.y, BL.room.doorPoly(st.f))) return "door"; return ""; }

  /* ---------- boucle de rendu ---------- */
  function frame(ts) {
    st.raf = 0; if (!st.open) return; st.raf = root.requestAnimationFrame(frame); if (document.hidden || !ctx || !S) return;
    var dt = Math.min(0.1, (ts - st.last) / 1000 || 0.016); st.last = ts; if (!st.f || st.f.n !== H.size(S)) fit();
    R.update(motion() ? dt : 0, S); R.draw(S, { wall: !!(BL.wallsUI && BL.wallsUI.hqOn()), f: st.f, sel: st.sel, ghost: ghostOf(), hide: st.drag && st.drag.moved ? st.drag.u : 0, hover: st.hover });
  }

  /* ---------- transition carte ⇄ pièce ---------- */
  function fade(on) { var f = $("fade"); f.classList.toggle("on", !!on); }
  function openNow() {
    var r = $("room"); st.open = true; st.busy = false; st.tab = "inv"; st.placing = null; st.sel = null; st.cell = null; r.hidden = false; r.classList.remove("out"); r.classList.add("in"); document.body.classList.add("inroom");
    $("app").inert = true; if (BL.mapUI) BL.mapUI.visible(false); BL.audio.sfx("open"); fit(); render(S, true); st.last = performance.now(); if (!st.raf) st.raf = root.requestAnimationFrame(frame); try { cv.focus({ preventScroll: true }); } catch (e) {}
    setTimeout(function () { fade(false); }, motion() ? 60 : 0);
  }
  function enter() {
    if (st.open || st.busy || !ctx || !S) return; st.busy = true; BL.audio.unlock && BL.audio.unlock();
    var onMap = !$("v_map").hidden;
    if (motion() && onMap && BL.mapUI.zoomToHQ) { BL.mapUI.zoomToHQ(); setTimeout(function () { fade(true); }, 380); setTimeout(openNow, 900); } else { fade(true); setTimeout(openNow, motion() ? 220 : 0); }
  }
  function exit_() {
    if (!st.open || st.busy) return; st.busy = true; st.placing = null; st.drag = null; fade(true);
    setTimeout(function () { var r = $("room"); st.open = false; r.hidden = true; r.classList.remove("in"); document.body.classList.remove("inroom"); $("app").inert = false; BL.audio.sfx("click");
      if (!$("v_map").hidden && BL.mapUI) { BL.mapUI.visible(true); BL.mapUI.home && BL.mapUI.home(); } st.busy = false; setTimeout(function () { fade(false); }, motion() ? 60 : 0); }, motion() ? 380 : 0);
  }
  function init(handlers, util) {
    h = handlers; u = util; H = BL.hq; G = BL.gold; if (!$("room")) return; build();
  }
  BL.roomUI = { init: init, enter: enter, exit: exit_, update: function (s) { S = s; if (st.open) render(s); }, isOpen: function () { return st.open; }, thumb: function (id) { return R ? R.thumb(id) : ""; }, _debug: function () { return { st: st, S: S }; } };
})(window);
