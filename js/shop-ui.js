/* Boutique : décors de la ville, boosts, objets du QG. Tout se paie en lingots d'or. */
(function (root) {
  var BL = root.BL = root.BL || {}, Sh, H, G, h, u, S = null, st = { tab: "city", cat: "all", sig: "" }, ban;
  function $(id) { return document.getElementById(id); }
  function el(t, c, html) { var e = document.createElement(t); if (c) e.className = c; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lg(n) { return n + " lingot" + (n > 1 ? "s" : ""); }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); var hh = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (hh ? hh + " h " : "") + (hh ? String(m).padStart(2, "0") + " min" : m + ":" + String(s).padStart(2, "0")); }
  var TABS = [["city", "Ambiances de la ville"], ["box", "Box"], ["wall", "Fonds de ville"], ["boost", "Boosts de revenus"], ["hq", "Objets du QG"]];

  function build() {
    var v = $("v_shop"); v.innerHTML = '<div class="shead"><div class="sh-l"><span class="sh-ing" aria-hidden="true"><svg viewBox="0 0 48 32"><path d="M6 26 L14 8 H42 L34 26Z" fill="#e3c680"/><path d="M6 26 L14 8 H42 L34 26Z" fill="url(#ingg)"/><path d="M14 8 H42 L40 12 H16Z" fill="#fff3c8" opacity=".55"/><defs><linearGradient id="ingg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#7a5a14" stop-opacity=".45"/></linearGradient></defs></svg></span><div class="sh-n"><small>Tes lingots d’or</small><div><b class="sgold">0</b><span class="scap"></span></div></div></div><p class="sh-t">Échange de l’argent du jeu contre des lingots dans le Coffre, puis dépense-les ici. Rien ne coûte d’argent réel.</p><button class="btn ghost" data-act="goCoffre">Aller au Coffre</button></div><div class="stabs" role="tablist"></div><div class="sbody" id="sBody"></div>';
    var tabs = v.querySelector(".stabs"); TABS.forEach(function (t) { var b = el("button", "rtab", t[1]); b.dataset.tab = t[0]; b.setAttribute("role", "tab"); tabs.appendChild(b); });
    v.addEventListener("click", onClick);
    ban = el("div", "pvban"); ban.hidden = true; ban.setAttribute("role", "status"); $("mapWrap").appendChild(ban); ban.addEventListener("click", onClick);
  }
  function card(c, own, eqd, pv) {
    var R = H.RAR[c.rar], can = S.gold >= c.cost, btn;
    if (eqd) btn = '<button class="btn" data-act="unequip" data-id="' + c.id + '">Retirer</button>'; else if (own) btn = '<button class="btn can" data-act="equip" data-id="' + c.id + '">Équiper</button>';
    else btn = '<button class="btn ' + (can ? "can" : "") + '" data-act="buy" data-id="' + c.id + '"' + (can ? "" : " disabled") + ">" + (can ? "Acheter · " + c.cost : "Il te manque " + (c.cost - S.gold)) + "</button>";
    return '<div class="sc' + (eqd ? " eq" : "") + '"><div class="scn"><b>' + esc(c.name) + '</b><span class="rr" style="color:' + R.color + '">' + R.name + (own ? " · possédé" : " · " + lg(c.cost)) + (eqd ? " · équipé" : "") + "</span><small>" + esc(c.desc) + '</small></div><div class="sca">' + (eqd ? "" : '<button class="btn ghost" data-act="preview" data-id="' + c.id + '">Aperçu</button>') + btn + "</div></div>";
  }
  function body() {
    var o = "", eq = S.shop.eq;
    if (st.tab === "city") {
      Sh.SLOTS.forEach(function (sl) { o += '<h3 class="sh3">' + sl[1] + "</h3>" + '<div class="sgrid">' + Sh.CITY.filter(function (c) { return c.slot === sl[0]; }).map(function (c) { return card(c, !!S.shop.own[c.id], eq[c.slot] === c.id); }).join("") + "</div>"; });
    } else if (st.tab === "box") {
      o += '<div class="shq"><p class="rnote">Les <b>box</b> ont maintenant leur propre page, dans la même rubrique « QG ». Tout y est : ouverture, taux, contenu possible, pitié et historique.</p><button class="btn can" data-act="goBox">Aller aux Box</button></div>';
    } else if (st.tab === "wall") {
      o += BL.wallsUI.html(S);
    } else if (st.tab === "boost") {
      var on = Sh.boostOn(S);
      o += '<p class="rnote">Règles : <b>un seul boost à la fois</b> (un bonus d’événement compte aussi), <b>jamais permanent</b>, et il <b>s’arrête si tu quittes le jeu</b> : active-le quand tu joues. Plus tu achètes de lingots, plus ils coûtent cher : enchaîner les boosts devient vite ruineux.</p>';
      if (on) o += '<div class="sc eq"><div class="scn"><b>Boost actif : ×' + String(S.boost.mult).replace(".", ",") + '</b><span class="rr">' + mmss(Sh.remaining(S)) + ' restantes</span></div></div>';
      o += '<div class="sgrid">' + Sh.BOOSTS.map(function (b) {
        var can = Sh.canBoost(S, b.id), why = on ? "Un boost est déjà actif" : S.gold < b.cost ? "Il te manque " + (b.cost - S.gold) : "Activer · " + b.cost;
        return '<div class="sc"><div class="scn"><b>' + esc(b.name) + " ×" + String(b.mult).replace(".", ",") + '</b><span class="rr">Pendant ' + mmss(b.dur) + " · " + lg(b.cost) + "</span><small>Tes revenus sont multipliés par " + String(b.mult).replace(".", ",") + " pendant " + mmss(b.dur) + ".</small></div><div class=\"sca\"><button class=\"btn " + (can ? "can" : "") + '" data-act="boost" data-id="' + b.id + '"' + (can ? "" : " disabled") + ">" + why + "</button></div></div>";
      }).join("") + "</div>";
    } else {
      o += '<div class="shq"><p class="rnote">Achète ici les objets de ton QG, puis entre dans le bâtiment pour les poser (clic sur le QG de la carte).</p><button class="btn can" data-act="enter">Entrer dans le QG</button></div>';
      o += '<div class="rcats">' + [["all", "Tout"]].concat(H.CATS).map(function (c) { return '<button class="mchip ' + (st.cat === c[0] ? "on" : "") + '" data-act="cat" data-id="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>";
      o += '<div class="sgrid">' + H.DECOR.filter(function (d) { return st.cat === "all" || d.cat === st.cat; }).sort(function (a, b) { return a.rar - b.rar || a.cost - b.cost; }).map(function (d) {
        var own = H.owned(S, d.id), full = own >= H.MAXOWN, can = S.gold >= d.cost && !full, R = H.RAR[d.rar];
        return '<div class="sc"><img class="rth" alt="" src="' + (BL.roomUI ? BL.roomUI.thumb(d.id) : "") + '"><div class="scn"><b>' + esc(d.name) + '</b><span class="rr" style="color:' + R.color + '">' + R.name + " · " + lg(d.cost) + "</span><small>Possédé " + own + "/" + H.MAXOWN + " · " + d.w + "×" + d.d + '</small></div><div class="sca"><button class="btn ' + (can ? "can" : "") + '" data-act="hbuy" data-id="' + d.id + '"' + (can ? "" : " disabled") + ">" + (full ? "Maximum" : can ? "Acheter · " + d.cost : "Il te manque " + (d.cost - S.gold)) + "</button></div></div>";
      }).join("") + "</div>";
    }
    return o;
  }
  function render(force) {
    var v = $("v_shop"); if (!S || v.hidden) return;
    var sig = [st.tab, st.cat, S.gold, JSON.stringify(S.shop), JSON.stringify(S.hq.inv), st.tab === "wall" ? JSON.stringify(S.walls) : "", S.boost ? Math.floor(Sh.remaining(S)) : 0, Sh.boostOn(S)].join("|");
    [].forEach.call(v.querySelectorAll(".stabs .rtab"), function (b) { var on = b.dataset.tab === st.tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    var g = v.querySelector(".sgold"), cp = v.querySelector(".scap"), t = String(S.gold), t2 = " / " + G.capacity(S) + " en réserve"; if (g.textContent !== t) g.textContent = t; if (cp.textContent !== t2) cp.textContent = t2;
    if (force || sig !== st.sig) { st.sig = sig; var b = $("sBody"), sc = v.scrollTop; b.innerHTML = body(); }
  }
  function banner() {
    var id = Sh.getPreview(); if (!id || !S) { ban.hidden = true; return; } var c = Sh.find(id), own = S.shop.own[id], eqd = S.shop.eq[c.slot] === id, can = S.gold >= c.cost;
    var key = id + own + eqd + can + S.gold; if (ban.dataset.k !== key) { ban.dataset.k = key; ban.innerHTML = '<span>Aperçu : <b>' + esc(c.name) + "</b></span>" + (eqd ? "" : own ? '<button class="btn can" data-act="equip" data-id="' + id + '">Équiper</button>' : '<button class="btn ' + (can ? "can" : "") + '" data-act="buy" data-id="' + id + '"' + (can ? "" : " disabled") + ">" + (can ? "Acheter · " + c.cost : "Il te manque " + (c.cost - S.gold)) + "</button>") + '<button class="btn ghost" data-act="endpv">Terminer l’aperçu</button>'; }
    ban.hidden = false;
  }
  function onClick(e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; var a = b.dataset.act, id = b.dataset.id;
    if (a === "tab") return;
    if (a === "wprev" || a === "wbuy" || a === "wequip" || a === "wunequip") { BL.wallsUI.act(a, id, b); render(true); return; }
    if (a === "goBox") { u.go("boxes"); return; }
    if (a === "goCoffre") { u.go("hq"); return; }
    if (a === "enter") { BL.roomUI.enter(); return; }
    if (a === "cat") st.cat = id;
    else if (a === "preview") { Sh.setPreview(id); u.go("map"); }
    else if (a === "endpv") Sh.setPreview(null);
    else if (a === "buy") { var c = Sh.find(id); if (c.cost >= 20) { BL.sysUI.modal({ title: "Acheter « " + c.name + " » ?", text: "Ce décor coûte " + lg(c.cost) + ". Tu as " + lg(S.gold) + ".", ok: "Acheter · " + c.cost, onOk: function () { h.shopBuy(id); render(true); banner(); } }); return; } h.shopBuy(id); }
    else if (a === "equip") { h.shopEquip(id); if (Sh.getPreview() === id) Sh.setPreview(null); }
    else if (a === "unequip") h.shopUnequip(Sh.find(id).slot);
    else if (a === "boost") { var bb = Sh.boost(id); if (bb.cost >= 20) { BL.sysUI.modal({ title: "Activer « " + bb.name + " » ?", text: "Tes revenus seront multipliés par " + String(bb.mult).replace(".", ",") + " pendant " + mmss(bb.dur) + ", pour " + lg(bb.cost) + ". Le boost s’arrête si tu quittes le jeu.", ok: "Activer · " + bb.cost, onOk: function () { h.shopBoost(id); render(true); } }); return; } h.shopBoost(id); }
    else if (a === "hbuy") h.hqBuy(id);
    render(true); banner();
  }
  function update(s) {
    S = s; if (!Sh) return; var v = $("v_shop"); banner();
    /* le boost actif : puce dans l'en-tête */
    var chip = $("boostChip"); if (chip) { var on = Sh.boostOn(s); chip.hidden = !on; if (on) { var t = "×" + String(s.boost.mult).replace(".", ",") + " · " + mmss(Sh.remaining(s)); if ($("r_boost").textContent !== t) $("r_boost").textContent = t; } }
    if (!v.hidden) render(false);
  }
  function init(handlers, util) {
    Sh = BL.shop; H = BL.hq; G = BL.gold; h = handlers; u = util; build();
    var tabs = $("v_shop").querySelector(".stabs"); tabs.addEventListener("click", function (e) { var b = e.target.closest(".rtab"); if (b) { st.tab = b.dataset.tab; render(true); } });
    document.querySelector('[data-view="shop"]').addEventListener("click", function () { render(true); });
    /* quitter la carte termine l'aperçu */
    ["#nav", "#subnav"].forEach(function (q) { document.querySelector(q).addEventListener("click", function (e) { if (e.target.closest("button")) setTimeout(function () { var m = document.getElementById("v_map"); if (Sh.getPreview() && m && m.hidden) Sh.setPreview(null); }, 0); }); });
  }
  BL.shopUI = { init: init, update: update, render: function () { render(true); } };
})(window);
