/* Section « Carte » : canvas, caméra (glisser, molette, pincement, clavier), sélection, panneau de détails, boucle de rendu. */
(function (root) {
  var BL = root.BL = root.BL || {}, h, u, R, model, S = null, cv, ctx, cam = { x: 0, y: 0, z: 0.8 }, goal = null, vw = 0, vh = 0, dpr = 1;
  var ui = { sel: null, hover: null, dstate: {} }, vis = false, raf = 0, last = 0, dirty = true, sig = "", pts = {}, drag = null, pinch = null, panelSig = "", P = {};
  var E, T, D, M;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ""; if (html) e.innerHTML = html; return e; }
  function set(e, t) { if (e && e.textContent !== t) e.textContent = t; }
  function minZ() { return Math.max(0.22, Math.min(vw / R.bounds.w, vh / R.bounds.h) * 0.95); }
  function clampCam(c) {
    c.z = Math.max(minZ(), Math.min(2.4, c.z)); var ww = vw / c.z, hh = vh / c.z;
    var BW = R.bounds.w, BH = R.bounds.h; c.x = ww >= BW ? (BW - ww) / 2 : Math.max(-ww * 0.3, Math.min(BW - ww * 0.7, c.x)); c.y = hh >= BH ? (BH - hh) / 2 : Math.max(-hh * 0.3, Math.min(BH - hh * 0.7, c.y));
  }
  function worldAt(sx, sy) { return { x: cam.x + sx / cam.z, y: cam.y + sy / cam.z }; }
  function zoomAt(sx, sy, f) { var w = worldAt(sx, sy); cam.z = Math.max(minZ(), Math.min(2.4, cam.z * f)); cam.x = w.x - sx / cam.z; cam.y = w.y - sy / cam.z; clampCam(cam); goal = null; dirty = true; }
  function centerOn(x, y, z) { var g = { x: 0, y: 0, z: Math.max(minZ(), Math.min(2.4, z || cam.z)) }; g.x = x - vw / g.z / 2; g.y = y - vh / g.z / 2; clampCam(g); if (!motion()) { cam.x = g.x; cam.y = g.y; cam.z = g.z; goal = null; } else goal = g; dirty = true; }
  function motion() { return !document.body.classList.contains("nomotion"); }
  function home() { var q = R.focusOf({ type: "hq" }); centerOn(q.x, q.y - 40, Math.max(0.5, Math.min(1.1, Math.min(vw / 1500, vh / 900) * 1.15))); }

  function resize() {
    var w = cv.parentNode.clientWidth, hgt = cv.parentNode.clientHeight; if (!w || !hgt) return; dpr = Math.min(2, root.devicePixelRatio || 1) * (ui.res || 1);   /* C11 : ui.res = échelle de rendu (1, .75, .5) abaissée par le régulateur si l'appareil est lent */
    var first = vw === 0; vw = w; vh = hgt; cv.width = Math.round(w * dpr); cv.height = Math.round(hgt * dpr); cv.style.width = w + "px"; cv.style.height = hgt + "px";
    if (first) { home(); if (goal) { cam.x = goal.x; cam.y = goal.y; cam.z = goal.z; goal = null; } } else clampCam(cam); dirty = true;
  }

  /* ---------- sélection ---------- */
  function pick(sx, sy) { var w = worldAt(sx, sy); return { hit: S ? R.hit(w.x, w.y, S) : null, w: w }; }
  var lastClk = null;
  function cycleHit(q, cx, cy) {                       /* clics répétés au même endroit : on passe au bâtiment suivant de la pile */
    var st = S ? R.hitAll(q.w.x, q.w.y, S) : [], now = Date.now(), pick0 = q.hit;
    if (st.length > 1) {
      var same = lastClk && now - lastClk.t < 4000 && Math.abs(lastClk.x - cx) < 12 && Math.abs(lastClk.y - cy) < 12, i = same ? (lastClk.i + 1) % st.length : 0;
      lastClk = { t: now, x: cx, y: cy, i: i }; pick0 = st[i];
      if (BL.ui && BL.ui.toast) BL.ui.toast("Plusieurs bâtiments ici : " + (i + 1) + "/" + st.length + ". Touche encore pour le suivant.");
    } else lastClk = null;
    return pick0;
  }
  function select(hitObj, focus) {
    if (hitObj && hitObj.type === "hq" && BL.roomUI && BL.roomUI.enter) { ui.sel = null; panelSig = ""; dirty = true; renderPanel(); BL.roomUI.enter(); return; }          /* le QG : on entre dedans */
    ui.sel = hitObj; panelSig = ""; dirty = true;
    if (hitObj && (focus || vw <= 900)) { var f = R.focusOf(hitObj), small = vw <= 900, zz = focus ? Math.max(cam.z, small ? 0.7 : 0.85) : cam.z; if (f) centerOn(f.x, f.y - 20 + (small ? vh * 0.2 / zz : 0), zz); }       /* sur mobile, le panneau occupe le bas : la cible remonte */
    Object.keys(P.chips || {}).forEach(function (k) { P.chips[k].classList.toggle("on", !!hitObj && ((hitObj.type === "hq" && k === "hq") || (hitObj.type === "lot" && k === hitObj.act))); });
    renderPanel();
  }

  /* ---------- panneau ---------- */
  function buildPanel() {
    var p = $("mapPanel"); p.innerHTML = "";
    P.banner = el("div", "pbanner"); P.title = el("div", "pt"); P.sub = el("div", "ps muted"); P.state = el("div", "pst"); P.kv = el("div", "pkv"); P.bar = el("div", "meter wide"); P.barI = el("i"); P.bar.appendChild(P.barI); P.barT = el("div", "muted pbt");
    P.det = el("details", "pdet", "<summary>Détails</summary>"); P.kv2 = el("div", "pkv"); P.det.appendChild(P.kv2); P.det.appendChild(P.bar); P.det.appendChild(P.barT); P.miss = el("div", "pmiss"); P.rv = el("div", "prv"); P.reqs = el("ul", "preq"); P.btn = el("button", "btn buy"); P.btn2 = el("button", "btn ghost"); P.wk = el("div", "pwk"); P.wk.hidden = true;
    P.qty = el("div", "bqsel pqty", ["1", "10", "25", "max"].map(function (q) { return '<button type="button" role="radio" class="bqo" data-q="' + q + '" aria-checked="false">' + (q === "max" ? "Max" : "×" + q) + "</button>"; }).join("")); P.qty.setAttribute("role", "radiogroup"); P.qty.setAttribute("aria-label", "Quantité achetée"); P.qty.hidden = true;
    P.qty.onclick = function (e) { var b = e.target.closest("[data-q]"); if (b) { h.setting("buyqty", b.dataset.q); renderPanel(); } };   /* Partie 19 · A : même réglage que la vue Activités */ P.close = el("button", "pclose"); P.close.setAttribute("aria-label", "Fermer le panneau"); P.close.innerHTML = "&times;";
    P.close.onclick = function () { select(null); };
    [P.close, P.banner, P.title, P.sub, P.state, P.wk, P.rv, P.kv, P.reqs, P.qty, P.btn, P.miss, P.btn2, P.det].forEach(function (x) { p.appendChild(x); });
    P.btn.onclick = function () { if (ui.sel && ui.sel.type === "decor" && S) { var rk = BL.dbuild.razeCheck(S, ui.sel.did, ui.sel.cell); if (!rk.ok) return; if (ui.rz !== ui.sel.id) { ui.rz = ui.sel.id; renderPanel(); return; } ui.rz = null; if (h.razeDecor(ui.sel.did, ui.sel.cell)) { ui.sel = null; panelSig = ""; dirty = true; renderPanel(); } return; } if (ui.sel && ui.sel.type === "district" && S && BL.rivals && BL.rivals.at(S, ui.sel.id)) { if (h.calmRival(BL.rivals.at(S, ui.sel.id).fid)) { dirty = true; renderPanel(); } return; } if (ui.sel && ui.sel.type === "dlot" && S && BL.dbuild.at(S, ui.sel.did, ui.sel.idx) === "casino" && BL.casinoUI) { BL.casinoUI.enter({ did: ui.sel.did }); return; } if (ui.sel && ui.sel.type === "dlot" && BL.buildMenu) { BL.buildMenu.open({ did: ui.sel.did, idx: ui.sel.idx }); return; } if (ui.sel && ui.sel.act && S) { var i = lotIdx(ui.sel), c0 = E.buildings(S, ui.sel.act), ok = c0 > 0 && i >= c0 ? h.buyBuilding(ui.sel.act) : h.buyActivity(ui.sel.act, i, mapQty()); if (ok) { dirty = true; renderPanel(); } } };
    P.btn2.onclick = function () { if (ui.sel && ui.sel.type === "decor") { ui.rz = null; renderPanel(); return; } if (ui.sel && ui.sel.type === "lot") { if (h.buyBuilding(ui.sel.act)) { dirty = true; renderPanel(); } return; } if (ui.sel && ui.sel.type === "district") { u.go("terr"); BL.terrUI.select(ui.sel.id); } };
  }
  function mapQty() { var st = BL.main && BL.main.settings ? BL.main.settings() : null; return BL.buy ? BL.buy.qty(st && st.buyqty) : "1"; }
  function lotIdx(sel) { var m = /#(\d+)$/.exec(sel.id || ""); return m ? +m[1] : 0; }
  function kv(list) {
    var sg = list.map(function (x) { return x[0] + (x[2] || ""); }).join("|"); if (P.kvSig !== sg) { P.kvSig = sg; P.kv.innerHTML = ""; P.kvEls = list.map(function (x) { var d = el("div", "", "<span>" + x[0] + "</span><b></b>"); P.kv.appendChild(d); var bb = d.querySelector("b"); if (x[2] && BL.explainUI) BL.explainUI.attach(bb, x[2], "Voir d’où vient : " + x[0]); return bb; }); if (BL.tip) BL.tip.decorate(P.kv, "span", { qm: true }); }
    list.forEach(function (x, i) { set(P.kvEls[i], x[1]); });
  }
  function kv2(list) {
    var sg = list.map(function (x) { return x[0]; }).join("|"); if (P.kv2Sig !== sg) { P.kv2Sig = sg; P.kv2.innerHTML = ""; P.kv2Els = list.map(function (x) { var d = el("div", "", "<span>" + x[0] + "</span><b></b>"); P.kv2.appendChild(d); return d.querySelector("b"); }); if (BL.tip) BL.tip.decorate(P.kv2, "span", { qm: true }); }
    list.forEach(function (x, i) { set(P.kv2Els[i], x[1]); });
  }
  function reqList(list) { var sg = list.map(function (r) { return r.label + r.ok; }).join("|"); if (P.reqSig === sg) return; P.reqSig = sg; P.reqs.innerHTML = ""; list.forEach(function (r) { var li = el("li", r.ok ? "ok" : "no"); li.textContent = r.label; P.reqs.appendChild(li); }); }
  function renderPanel() {
    var p = $("mapPanel"), s = S, sel = ui.sel; if (!sel || !s) { p.hidden = true; return; } p.hidden = false; P.rv.hidden = true; P.qty.hidden = true;
    var key = sel.type + ":" + sel.id;
    if (key !== panelSig) { panelSig = key; P.kvSig = null; P.reqSig = null;
      if (sel.type === "lot") { var a = E.find(D.activities, sel.act); P.banner.innerHTML = BL.art.act(a.id); set(P.title, a.name); set(P.sub, a.cat + " · " + a.desc); P.btn2.hidden = true; }
      else if (sel.type === "dlot") { var dd0 = T.dist(sel.did), t0 = BL.dbuild.at(s, sel.did, sel.idx), tt0 = t0 && BL.dbuild.find(t0); P.banner.style.setProperty("--c", (tt0 && BL.venues.ACC[t0]) || "#c8a45e"); P.banner.innerHTML = tt0 ? BL.dbArt.svg(t0, sel.did) : '<div class="dbn" style="--c:' + (BL.mapData.PAL[sel.did] || BL.mapData.PAL.hq).acc + '"><span>Terrain libre</span></div>'; set(P.title, tt0 ? tt0.name : "Terrain libre · " + dd0.short); set(P.sub, tt0 ? tt0.desc : "Un terrain vide dans " + dd0.name + "."); P.btn2.hidden = true; }
      else if (sel.type === "decor") { var pk = sel.deco === "park"; ui.rz = null; P.banner.style.setProperty("--c", pk ? "#4f9a6a" : "#7f93ad"); P.banner.innerHTML = '<div class="dbn" style="--c:' + (pk ? "#4f9a6a" : "#7f93ad") + '"><span>' + (pk ? "Parc" : "Fontaine") + "</span></div>"; set(P.title, pk ? "Parc et arbres" : "Place et fontaine"); set(P.sub, "Décor de la ville. Tu peux le démolir pour libérer un terrain constructible."); P.btn2.hidden = true; }
      else if (sel.type === "hq") { P.banner.innerHTML = BL.art.act("estate"); set(P.title, "Quartier général"); set(P.sub, "Le cœur de ton empire : tout ce que tu possèdes commence ici."); P.btn2.hidden = true; }
      else { var d = T.dist(sel.id); P.banner.innerHTML = '<div class="dbn" style="--c:' + (BL.mapData.PAL[sel.id] || BL.mapData.PAL.hq).acc + '"><span>' + d.name + "</span></div>"; set(P.title, d.name); set(P.sub, d.desc); P.btn2.hidden = false; P.btn2.disabled = false; P.btn2.classList.remove("can"); set(P.btn2, "Ouvrir dans Territoires"); } }
    var m = u.money;
    if (sel.type === "lot") {
      var a2 = E.find(D.activities, sel.act), idx = lotIdx(sel), cnt = E.buildings(s, a2.id), built = idx < cnt, n = built ? E.bLevel(s, a2.id, idx) : 0, unl = E.actUnlocked(s, a2), maxB = built && n >= a2.maxLevel;
      var nb = E.nextBuilding(s, a2), isNext = !built && cnt >= 1 && idx === cnt, first = cnt === 0 && idx === 0, w = E.BLD_W[idx] || 0, best = E.best(s, a2.id), need = BL.mapData.LOTS.thresholds[idx];
      var qq = mapQty(), plq = (built && !maxB) || first ? (BL.buy ? BL.buy.plan(s, a2.id, idx, qq) : null) : null, kq = plq && plq.k ? plq.k : 1;
      var c = plq && plq.k ? plq.cost : built ? (maxB ? 0 : E.cost(a2, n, s, idx)) : first ? E.cost(a2, 0, s) : isNext && nb ? nb.cost : 0, inc = built ? E.bldIncome(s, a2, idx, n) : 0, gain = built && !maxB ? (plq && plq.k ? E.bldIncome(s, a2, idx, plq.to) - inc : E.gainOf(s, a2, idx)) : 0, ms = built ? E.nextMs(n) : null;
      var buildable = first || (isNext && nb && nb.ok);
      set(P.title, a2.name + " — " + (built ? "Bâtiment " + (idx + 1) + " · niveau " + n : "Emplacement " + (idx + 1))); P.det.hidden = false;
      kv(!unl ? [["Revenus", "—"]] : built ? [["Revenus de ce bâtiment", m(inc) + "/s", "bld:" + a2.id + ":" + idx], ["Amélioration de ce bâtiment" + (kq > 1 ? " ×" + kq : ""), maxB ? "—" : m(c), maxB ? "" : "cost:" + a2.id + ":" + idx], ["Après amélioration", maxB ? "—" : m(inc + gain) + "/s"]]
        : [["Revenus de l’activité", m(E.actIncome(s, a2)) + "/s", "act:" + a2.id], [first ? "Prix de construction" : "Prix du bâtiment", c ? m(c) : "—", c ? "cost:" + a2.id + ":" + idx : ""], ["Niveau de départ", "1"]]);
      var dsg = E.designTier(n), nd = E.nextDesign(n);
      kv2(built ? [["Design", E.DESIGN_NAMES[dsg]], ["Prochain design", nd ? "niveau " + nd : "design maximal"], ["Niveau de ce bâtiment", n + " / " + a2.maxLevel], ["Part dans les revenus de l’activité", Math.round(w * 100) + " %"], ["Revenus de toute l’activité", m(E.actIncome(s, a2)) + "/s"], ["Entretien de l’activité", "−" + m(E.upkeepOf(s, a2)) + "/s"], ["Bâtiments construits", cnt + " / " + M2().LOTS.perActivity], ["Gain par niveau", maxB ? "—" : "+" + m(gain) + "/s"]]
        : [["Part dans les revenus de l’activité", Math.round(w * 100) + " %"], ["Meilleur bâtiment", "niveau " + best], ["Bâtiments construits", cnt + " / " + M2().LOTS.perActivity]]);
      P.bar.hidden = false; P.barT.hidden = false;
      if (!unl) { P.state.className = "pst lock"; set(P.state, "Verrouillé"); var ul = E.find(D.activities, a2.unlock.id); reqList([{ label: ul.name + " : meilleur bâtiment niveau " + a2.unlock.lvl + " (" + (s.owned[ul.id] || 0) + " / " + a2.unlock.lvl + ")", ok: false }]); BL.bar(P.barI, Math.min(100, (s.owned[ul.id] || 0) / a2.unlock.lvl * 100)); set(P.barT, "Règle : une activité se débloque quand le meilleur bâtiment de l’activité précédente atteint le niveau demandé."); }
      else if (built) { P.state.className = "pst " + (maxB ? "max" : "open"); set(P.state, maxB ? "Niveau maximal" : "En activité · " + E.DESIGN_NAMES[dsg]); reqList([]);
        var tgt = ms ? ms.lvl : a2.maxLevel; BL.bar(P.barI, Math.min(100, n / tgt * 100)); set(P.barT, "Cette amélioration ne change que ce bâtiment. " + (ms ? "Palier niveau " + ms.lvl + " : ses revenus ×" + String(ms.mult).replace(".", ",") + "." : "")); }
      else { P.state.className = "pst " + (buildable ? "open" : "lock"); set(P.state, buildable ? "À construire" : "Verrouillé");
        reqList(first ? [] : [{ label: "Meilleur bâtiment niveau " + need + " (" + best + " / " + need + ")", ok: best >= need }].concat(idx > cnt ? [{ label: "Construis d’abord le bâtiment " + idx, ok: false }] : []));
        BL.bar(P.barI, Math.min(100, first ? 100 : best / need * 100)); set(P.barT, first ? "Ton premier bâtiment de cette activité." : "Règle : un nouveau bâtiment se débloque quand le meilleur bâtiment de l’activité atteint le niveau " + need + ". Il démarre au niveau 1."); }
      var wst = BL.worksUI ? BL.worksUI.lotState(s, a2.id, idx) : null, qf = !wst && BL.works && BL.works.full(s);   /* Partie 17 · D : chantier en cours ou en file sur ce bâtiment */
      if (wst) { P.state.className = "pst open"; set(P.state, wst.label); }
      P.wk.hidden = !wst; if (wst) { P.wk.dataset.k = a2.id + "#" + idx; var wh = BL.worksUI.lotBox(s, a2.id, idx); if (P.wk.__h !== wh) { P.wk.__h = wh; P.wk.innerHTML = wh; } BL.worksUI.bindLot(P.wk); }
      var can = unl && (built ? !maxB : buildable) && s.money + 1e-9 >= c && !wst && !qf; P.btn.hidden = false; P.btn.disabled = !can;
      set(P.btn, wst ? (wst.on ? "EN CHANTIER" : "EN FILE D’ATTENTE") : qf && unl && (built ? !maxB : buildable) ? "FILE DE CHANTIERS PLEINE" : !unl ? "VERROUILLÉ" : built ? (maxB ? "NIVEAU MAXIMAL" : "AMÉLIORER ×" + kq + " · " + m(c)) : first ? "CONSTRUIRE ×" + kq + " · " + m(c) : buildable ? "CONSTRUIRE CE BÂTIMENT" : idx > cnt ? "CONSTRUIS LE BÂTIMENT " + idx + " D’ABORD" : "NIVEAU " + need + " REQUIS");
      P.miss.hidden = !!wst || qf || !(unl && (built ? !maxB : buildable) && !can); set(P.miss, "Il te manque " + m(Math.max(0, c - s.money)));
      if (!wst && unl && (built ? !maxB : buildable) && BL.works) { var wd = BL.works.duration(a2.id, idx, built ? n + 1 : 1); P.miss.hidden = false; set(P.miss, (can || qf ? "" : "Il te manque " + m(Math.max(0, c - s.money)) + " · ") + "Chantier : " + BL.sysUI.dur(wd) + (BL.works.active(s).length >= BL.works.workers(s) ? " (après les chantiers en cours)" : "")); }
      P.btn2.hidden = true; P.qty.hidden = !(unl && ((built && !maxB) || first)) || !!wst;
      Array.prototype.forEach.call(P.qty.children, function (b) { var on = b.dataset.q === qq; b.setAttribute("aria-checked", on ? "true" : "false"); b.classList.toggle("on", on); });
      P.btn.classList.toggle("can", can);
    } else if (sel.type === "dlot") {
      var DB = BL.dbuild, ty = DB.at(s, sel.did, sel.idx), tt = ty && DB.find(ty), ctl = T.lv(s, sel.did) > 0, sty = D.dbuild.style[sel.did], pc = function (x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; };
      P.det.hidden = true; P.bar.hidden = true; P.barT.hidden = true; P.btn2.hidden = true; reqList([]);
      if (tt) {
        var ef = DB.eff(sel.did, tt), hr = tt.heat;
        kv([["Revenus supplémentaires", tt.inc ? "+" + pc(ef) : "—"], ["Chaleur", (hr > 0 ? "+" : hr < 0 ? "−" : "") + String(Math.abs(hr)).replace(".", ",") + " / min"], ["Défense du quartier", tt.def ? "+" + pc(tt.def) : "—"], ["Quartier", T.dist(sel.did).name]]);
        P.state.className = "pst open"; set(P.state, DB.affine(sel.did, ty) ? "En activité · bien adapté à ce quartier (×" + D.dbuild.params.affinityMul + ")" : "En activité"); P.miss.hidden = true; if (ty === "casino") { P.btn.hidden = false; P.btn.disabled = false; P.btn.classList.add("can"); set(P.btn, "ENTRER DANS LE CASINO"); } else P.btn.hidden = true;
      } else {
        kv([["Quartier", T.dist(sel.did).name], ["Terrains libres", DB.freePlots(s, sel.did).length + " / " + DB.slots(sel.did, s)]]);
        P.state.className = "pst " + (ctl ? "open" : "lock"); set(P.state, ctl ? "Libre : tu peux construire" : "Quartier non contrôlé"); P.btn.hidden = false; P.btn.disabled = !ctl; P.btn.classList.toggle("can", ctl); set(P.btn, ctl ? "CHOISIR UN BÂTIMENT" : "CONQUIERS LE QUARTIER D’ABORD"); P.miss.hidden = true;
      }
    } else if (sel.type === "decor") {
      var DBd = BL.dbuild, rk2 = DBd.razeCheck(s, sel.did, sel.cell), cf = ui.rz === sel.id, nm = sel.deco === "park" ? "ce parc" : "cette fontaine";
      P.det.hidden = true; P.bar.hidden = true; P.barT.hidden = true; reqList([]);
      kv([["Quartier", T.dist(sel.did).name], ["Coût de la démolition", m(DBd.razeCost(s))], ["Démolitions ici", DBd.razedIn(s, sel.did).length + " / " + DBd.RZ.perDistrict], ["Résultat", "+1 terrain constructible"]]);
      P.state.className = "pst " + (rk2.ok ? "open" : "lock"); set(P.state, rk2.ok ? (cf ? "Détruire " + nm + " ? Il sera remplacé par un terrain libre. Définitif." : "Prêt à être démoli") : rk2.why);
      P.btn.hidden = false; P.btn.disabled = !rk2.ok; P.btn.classList.toggle("can", rk2.ok); set(P.btn, cf ? "CONFIRMER : DÉTRUIRE (" + m(DBd.razeCost(s)) + ")" : "DÉTRUIRE " + (sel.deco === "park" ? "LE PARC" : "LA FONTAINE")); P.miss.hidden = !(rk2.short); set(P.miss, "Il te manque " + m(Math.max(0, rk2.missing || 0)));
      P.btn2.hidden = !cf; P.btn2.disabled = false; P.btn2.classList.remove("can"); set(P.btn2, "Annuler");
    } else if (sel.type === "hq") {
      kv([["Niveau d’empire", String(E.level(s))], ["Revenus nets", m(E.income(s)) + "/s"], ["Réputation", u.fmt(E.reputation(s))], ["Influence", u.fmt(E.influence(s))], ["Quartiers contrôlés", T.count(s) + " / " + D.territory.districts.length]]);
      P.det.hidden = true; P.miss.hidden = true; P.state.className = "pst open"; set(P.state, "Siège de l’empire"); reqList([]); P.bar.hidden = true; P.barT.hidden = false; set(P.barT, "Améliore tes activités pour construire de nouveaux bâtiments autour du quartier général."); P.btn.hidden = true;
    } else {
      var d2 = T.dist(sel.id), st = T.state(s, d2), L = T.lv(s, sel.id), rq = T.reqList(s, d2);
      kv([["État", st === "controlled" ? "Contrôlé" : st === "contested" ? "Attaqué" : st === "available" ? "Disponible" : "Verrouillé"], ["Contrôle", L + " / " + D.territory.params.maxControl], ["Prix d’entrée", m(d2.cost)], ["Rival", T.faction(d2.holder).name]]);
      P.state.className = "pst " + (st === "controlled" ? "max" : st === "contested" ? "lock" : st === "available" ? "open" : "lock"); set(P.state, st === "locked" ? "Verrouillé : conditions manquantes" : st === "available" ? "Prêt à être conquis" : st === "contested" ? "Une faction attaque" : "Sous ton contrôle");
      reqList(st === "controlled" || st === "contested" ? [] : rq.map(function (r) { return { label: r.label, ok: r.ok }; })); P.det.hidden = true; P.miss.hidden = true; P.bar.hidden = true; P.barT.hidden = true; P.btn.hidden = true;
      var pr = st === "controlled" && BL.rivals ? BL.rivals.at(s, sel.id) : null;
      if (pr) {   /* C8 : qui, pourquoi, que faire, risque */
        var rf = T.faction(pr.fid), rr = BL.rivals.rate(s, pr.fid), cc = BL.rivals.calmCost(s, sel.id, pr.fid), canC = s.money + 1e-9 >= cc;
        P.state.className = "pst lock"; set(P.state, (pr.lvl === "threat" ? "Menace" : "Tension") + " : " + rf.name + " " + pr.p + " %");
        P.rv.hidden = false; P.rv.innerHTML = ""; [["Qui", rf.name + ", qui tient un quartier voisin."], ["Pourquoi", "sa force (" + Math.round(rr.force) + ") pèse face à ta défense ici (" + Math.round(rr.defense) + "). " + BL.rivals.mods(s, pr.fid).lines.join(" · ") + "."], ["Risque", "à 100 %, elle attaque : tu as alors " + Math.round(D.territory.params.conflict.duration / 60) + " min pour défendre ou négocier ; sans réponse, ce quartier perd au plus un niveau (jamais le quartier entier)."], ["À faire", "calmer le jeu (−50 points), contre-attaquer ou voir les détails dans Rivalités, proposer une trêve dans Territoires, ou renforcer la défense."]].forEach(function (r) { var li = el("p", "", "<b>" + r[0] + " :</b> "); li.appendChild(document.createTextNode(r[1])); P.rv.appendChild(li); });
        P.btn.hidden = false; P.btn.disabled = !canC; P.btn.classList.toggle("can", canC); set(P.btn, "CALMER LE JEU · " + m(cc)); P.miss.hidden = canC; if (!canC) set(P.miss, "Il te manque " + m(cc - s.money));
      }
    }
  }
  function M2() { return BL.mapData; }

  /* ---------- entrées ---------- */
  function bind() {
    cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); var r = cv.getBoundingClientRect(); pts[e.pointerId] = { x: e.clientX - r.left, y: e.clientY - r.top, sx: e.clientX, sy: e.clientY };
      var ids = Object.keys(pts); if (ids.length === 1) drag = { id: e.pointerId, moved: false, cx: cam.x, cy: cam.y }; else if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; drag = null; } goal = null; cv.focus({ preventScroll: true }); });
    cv.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(), p = pts[e.pointerId], x = e.clientX - r.left, y = e.clientY - r.top;
      if (!p) { if (e.pointerType === "mouse") { var pk = pick(x, y), evh = R.hitEvent ? R.hitEvent(pk.w.x, pk.w.y) : null, k = evh ? { type: "event", id: evh.key } : pk.hit, hv = k ? k.type + (k.id || "") : ""; if (hv !== (ui.hoverKey || "")) { ui.hoverKey = hv; ui.hover = k; cv.style.cursor = k ? "pointer" : "grab"; dirty = true; } } return; }
      if (pinch && Object.keys(pts).length >= 2) { pts[e.pointerId].x = x; pts[e.pointerId].y = y; var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch.d > 0) { var nz = pinch.z * d / pinch.d; zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, nz / cam.z); } return; }
      if (drag && drag.id === e.pointerId) { var dx = e.clientX - p.sx, dy = e.clientY - p.sy; if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; cv.style.cursor = "grabbing"; } if (drag.moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z; clampCam(cam); dirty = true; } } });
    function up(e) { var p = pts[e.pointerId]; if (!p) return; var wasDrag = drag && drag.id === e.pointerId ? drag : null; delete pts[e.pointerId];
      if (Object.keys(pts).length < 2) pinch = null;
      if (wasDrag && !wasDrag.moved && e.type === "pointerup") { var r = cv.getBoundingClientRect(), q = pick(e.clientX - r.left, e.clientY - r.top), ev = R.hitEvent ? R.hitEvent(q.w.x, q.w.y) : null; if (ev) { BL.audio && BL.audio.sfx("open"); openAct(ev.key, { x: e.clientX - r.left, y: e.clientY - r.top }); } else if (ui.place) { ui.place.onTap(q.hit && q.hit.type === "dlot" ? q.hit.id : null); dirty = true; } else { BL.audio && BL.audio.sfx("select"); closeAct(); R.ripple(q.w.x, q.w.y); select(cycleHit(q, e.clientX, e.clientY), false); } }
      if (wasDrag) { drag = null; cv.style.cursor = "grab"; } if (!Object.keys(pts).length) { drag = null; pinch = null; } dirty = true; }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", function (e) { if (!pts[e.pointerId] && ui.hover) { ui.hover = null; ui.hoverKey = ""; dirty = true; } });
    cv.addEventListener("wheel", function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015))); }, { passive: false });
    document.addEventListener("keydown", actKey, true);
    cv.addEventListener("keydown", function (e) { var s = 60 / cam.z, k = e.key, used = true;
      if (k === "ArrowLeft") cam.x -= s; else if (k === "ArrowRight") cam.x += s; else if (k === "ArrowUp") cam.y -= s; else if (k === "ArrowDown") cam.y += s; else if (k === "+" || k === "=") zoomAt(vw / 2, vh / 2, 1.2); else if (k === "-") zoomAt(vw / 2, vh / 2, 1 / 1.2); else if (k === "Home" || k === "0") home(); else if (k === "Escape") select(null); else used = false;
      if (used) { e.preventDefault(); clampCam(cam); goal = null; dirty = true; } });
    $("mZoomIn").onclick = function () { zoomAt(vw / 2, vh / 2, 1.25); }; $("mZoomOut").onclick = function () { zoomAt(vw / 2, vh / 2, 0.8); }; $("mHome").onclick = home;
    if (root.ResizeObserver) new ResizeObserver(function () { if (vis) resize(); }).observe(cv.parentNode); else root.addEventListener("resize", function () { if (vis) resize(); });
  }

  /* ---------- boucle ---------- */
  function stateSig(s) { var o = ""; D.activities.forEach(function (a) { o += E.levels(s, a.id).join("/") + ","; }); for (var k in s.terr.lv) o += k + s.terr.lv[k]; for (k in (s.districts || {})) o += "|" + k + s.districts[k].join(","); return o + (s.terr.conflict ? s.terr.conflict.did : "") + (BL.rivals ? "~" + BL.rivals.list(s).map(function (e) { return e.did + e.lvl + e.p; }).join(",") : ""); }
  /* ---------- événements en cours : pastilles sur la carte + liste « En cours » (clavier, légende repliable) ---------- */
  function evBox() { return $("mEvents"); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderEvents(list) {
    var box = evBox(); if (!box) return; var keys = list.map(function (e) { return e.key; }).join("|");
    if (!list.length) { if (!box.hidden) { box.hidden = true; box.innerHTML = ""; ui.evKeys = ""; } return; }
    if (box.hidden || ui.evKeys !== keys) {
      var open = !!ui.evOpen, leg = !!ui.evLeg, K = BL.events.KINDS; ui.evKeys = keys; box.hidden = false;
      box.innerHTML = '<button class="mev-btn" type="button" aria-expanded="' + open + '" aria-controls="mevList"><b>En cours</b><span class="mev-n">' + list.length + "</span></button>" +
        '<div class="mev-list" id="mevList"' + (open ? "" : " hidden") + '><ul>' + list.map(function (e, i) { return '<li><button type="button" class="mev-i" data-i="' + i + '" style="--c:' + e.col + '" aria-label="' + esc(e.title + (e.left !== null ? ", " + BL.events.fmt(e.left) + " restant" : "") + ". Centrer la carte.") + '"><i aria-hidden="true">' + esc(e.kind === "event" ? "?" : K[e.kind].glyph) + '</i><span><b>' + esc(e.title) + '</b><small>' + esc(e.sub) + '</small></span><em data-t="' + i + '">' + (e.left !== null ? BL.events.fmt(e.left) : "") + "</em></button></li>"; }).join("") +
        '</ul><details class="mev-leg"' + (leg ? " open" : "") + "><summary>Légende</summary><ul>" + Object.keys(K).map(function (k) { return '<li style="--c:' + K[k].col + '"><i aria-hidden="true">' + esc(K[k].glyph) + "</i><span><b>" + K[k].label + "</b> " + esc(K[k].desc) + "</span></li>"; }).join("") + "</ul></details></div>";
      box.querySelector(".mev-btn").onclick = function () { ui.evOpen = !ui.evOpen; var l = box.querySelector(".mev-list"); l.hidden = !ui.evOpen; this.setAttribute("aria-expanded", ui.evOpen); };
      box.querySelector("details").addEventListener("toggle", function () { ui.evLeg = this.open; });
      Array.prototype.forEach.call(box.querySelectorAll(".mev-i"), function (b) { b.onclick = function () { var e = (ui.evList || [])[+b.dataset.i]; if (e) { focusTarget(e.target.type === "hq" ? { type: "hq" } : { type: "district", id: e.target.id }); openAct(e.key, null, b); } }; });
    }
    ui.evList = list; Array.prototype.forEach.call(box.querySelectorAll("em[data-t]"), function (m) { var e = list[+m.dataset.t]; if (e) set(m, e.left !== null ? BL.events.fmt(e.left) : ""); });
  }

  /* ---------- fenêtre d'action d'un événement : traiter l'événement sans quitter la carte ---------- */
  function actBox() { var b = $("mAct"); if (!b) { b = el("div", "mact"); b.id = "mAct"; b.hidden = true; b.setAttribute("role", "dialog"); b.setAttribute("aria-modal", "false"); $("mapWrap").appendChild(b); } return b; }
  function money(v) { return u.money ? u.money(v) : String(Math.round(v)); }
  function findEv(key) { var l = ui.evList || (BL.events ? BL.events.active(S) : []); for (var i = 0; i < l.length; i++) if (l[i].key === key) return l[i]; return null; }
  function actButtons(e) {
    var o = [], Ec = BL.economy, ft;
    if (e.kind === "event" && S.pending && Ec) {
      var ev = Ec.find(BL.data.events, S.pending); ft = function (x) { return Ec.fText(x, S.pendingFac, S.pendingCrew); };
      if (ev) ev.choices.forEach(function (c, i) { var nd = Ec.need(S, c); o.push({ cls: "btn" + (nd.ok ? "" : " gated"), dis: !nd.ok, html: esc(ft(c.label)) + "<small>" + esc(Ec.hint(S, ev, i, money)) + "</small>" + (c.need ? '<small class="evn">' + esc(nd.why) + "</small>" : ""), run: function () { h.choose(i); } }); });
      o.push({ cls: "btn ghost", html: "Aller au QG", run: function () { BL.roomUI && BL.roomUI.enter && BL.roomUI.enter(); } });
    } else if (e.kind === "conflict" && S.terr.conflict) {
      var c = S.terr.conflict, d = T.dist(c.did), dc = T.defendCost(d), tc = T.truceCost(d, S), p = T.defendChance(S);
      o.push({ cls: "btn", dis: S.money + 1e-9 < dc, html: "Défendre · " + money(dc) + "<small>" + Math.round(p * 100) + " % de réussite</small>", run: function () { h.defend(); } });
      o.push({ cls: "btn", dis: S.money + 1e-9 < tc, html: "Négocier · " + money(tc) + "<small>Trêve garantie de " + Math.round(D.territory.params.conflict.truce / 60) + " min</small>", run: function () { h.truce(); } });
      o.push({ cls: "btn ghost", html: "Voir le quartier", run: function () { u.go("terr"); BL.terrUI && BL.terrUI.select(c.did); } });
    } else if (e.kind === "op") {
      o.push({ cls: "btn", html: "Ouvrir l’opération", run: function () { u.go("ops"); } });
    } else if (e.target && e.target.type === "district") {
      o.push({ cls: "btn", html: "Voir le quartier", run: function () { u.go("terr"); BL.terrUI && BL.terrUI.select(e.target.id); } });
    } else {
      o.push({ cls: "btn", html: "Aller au QG", run: function () { BL.roomUI && BL.roomUI.enter && BL.roomUI.enter(); } });
    }
    return o;
  }
  function openAct(key, at, from) {
    var e = findEv(key); if (!e || !S) return closeAct(); var box = actBox(), K = BL.events.KINDS[e.kind], btns = actButtons(e); ui.act = { key: key, from: from || null };
    var tx = e.kind === "event" && S.pending && BL.economy ? BL.economy.fText((BL.economy.find(BL.data.events, S.pending) || {}).text || e.sub, S.pendingFac, S.pendingCrew) : e.sub;
    if (e.kind === "conflict" && S.terr.conflict) { var c = S.terr.conflict; tx = "Force d’attaque " + Math.round(c.atk) + ", ta défense " + Math.round(T.defense(S, T.dist(c.did))) + ". Sans décision, tu perds un niveau de contrôle."; }
    box.style.setProperty("--c", e.col);
    box.innerHTML = '<div class="mact-h"><i aria-hidden="true">' + esc(e.kind === "event" ? "?" : K.glyph) + '</i><div><small>' + esc(K.label) + '</small><b id="mActT">' + esc(e.title) + '</b></div><button type="button" class="mact-x" aria-label="Fermer">×</button></div>' +
      '<p class="mact-p">' + esc(tx) + '</p>' + (e.left !== null ? '<p class="mact-t"><span>Temps restant</span><b data-act-t>' + BL.events.fmt(e.left) + "</b></p>" : "") + '<div class="mact-b"></div>';
    box.setAttribute("aria-labelledby", "mActT"); var bb = box.querySelector(".mact-b");
    btns.forEach(function (b) { var x = el("button", b.cls, b.html); x.type = "button"; if (b.dis) { x.disabled = true; } x.onclick = function () { var still = findEv(key); if (!still && e.kind !== "op") { closeAct(); return; } var r = b.run(); closeAct(true); dirty = true; syncEvents(); return r; }; bb.appendChild(x); });
    box.querySelector(".mact-x").onclick = function () { closeAct(); };
    box.hidden = false; box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
    if (($("mapWrap").clientWidth) <= 700 && ui.evOpen) { ui.evOpen = false; var lst = document.querySelector("#mEvents .mev-list"), mb = document.querySelector("#mEvents .mev-btn"); if (lst) lst.hidden = true; if (mb) mb.setAttribute("aria-expanded", "false"); }
    var W = $("mapWrap").clientWidth, Hh = $("mapWrap").clientHeight, small = W <= 700;
    if (small || !at) { box.style.left = ""; box.style.top = ""; box.style.bottom = ""; box.classList.toggle("sheet", small); if (!small) { box.style.left = "auto"; box.style.right = "16px"; box.style.bottom = "16px"; } }
    else { box.classList.remove("sheet"); var bw = Math.min(340, W - 24); box.style.width = bw + "px"; box.style.right = "auto"; box.style.left = Math.max(12, Math.min(W - bw - 12, at.x - bw / 2)) + "px"; box.style.bottom = ""; var bh = box.offsetHeight; box.style.top = Math.max(12, Math.min(Hh - bh - 12, at.y + 22)) + "px"; }
    var f = bb.querySelector("button:not([disabled])") || box.querySelector(".mact-x"); f && f.focus({ preventScroll: true });
  }
  function closeAct(noFocus) { var box = $("mAct"); if (!box || box.hidden) return; var from = ui.act && ui.act.from; box.hidden = true; box.classList.remove("show"); ui.act = null; if (!noFocus) { var f = from && document.contains(from) && from.offsetParent !== null ? from : document.querySelector("#mEvents .mev-btn"); f && f.focus && f.focus({ preventScroll: true }); } else cv && cv.focus && cv.focus({ preventScroll: true }); }
  function actKey(e) { if (e.key === "Escape" && ui.act) { e.stopPropagation(); e.preventDefault(); closeAct(); } }
  function actSync(list) {
    var box = $("mAct"); if (!box || box.hidden || !ui.act) return; var e = null; for (var i = 0; i < list.length; i++) if (list[i].key === ui.act.key) e = list[i];
    if (!e) { closeAct(true); return; } var t = box.querySelector("[data-act-t]"); if (t && e.left !== null) set(t, BL.events.fmt(e.left));
  }
  function syncEvents() {
    if (!BL.events || !R || !S) return; var list = BL.events.active(S), sg = list.map(function (e) { return e.key + ":" + (e.left === null ? "" : Math.ceil(e.left)); }).join("|");
    if (sg !== ui.evSig) { ui.evSig = sg; R.setEvents(list); dirty = true; ui.evList = list; renderEvents(list); } actSync(list);
  }
  /* C11 (Partie 11) : régulateur de fluidité, au-delà de la qualité « basse » : résolution du canvas 1 → .75 → .5, puis cadence 1/2 → 1/3 ; remontée lente si l'appareil tient. Pur côté décision : BL.mapUI.govern. */
  function govStep(st, ms, qLow) {
    st.gs = st.gs || 0; st.gf = st.gf || 0; st.res = st.res || 1; st.skip = st.skip || 1;
    if (ms > 40 && qLow) { st.gs++; st.gf = 0; } else if (ms < 19) { st.gf++; st.gs = 0; } else { st.gs = 0; st.gf = 0; }
    if (st.gs >= 15) { st.gs = 0; if (st.res > 0.5) st.res = st.res > 0.75 ? 0.75 : 0.5; else if (st.skip < 3) st.skip++; return true; }
    if (st.gf >= 600) { st.gf = 0; if (st.skip > 1) st.skip--; else if (st.res < 1) st.res = st.res < 0.75 ? 0.75 : 1; else return false; return true; }
    return false;
  }
  function govern() { if (govStep(ui, ui.fi, ad.q === 0)) { paintCtl(); ui.fi = 20; ui.ms *= 0.5; resize(); dirty = true; } }
  /* position écran (pixels CSS, relatifs à la carte) d'un emplacement de bâtiment ; null s'il est hors de la vue */
  function lotScreen(id) { if (!R || !cam) return null; var f = R.focusOf({ type: "lot", id: id }); if (!f) return null; var x = (f.x - cam.x) * cam.z, y = (f.y - cam.y) * cam.z; return x < -80 || y < -40 || x > vw + 80 || y > vh + 160 ? null : { x: x, y: y, z: cam.z }; }
  function frame(ts) {
    raf = 0; if (!vis || document.hidden) return; raf = root.requestAnimationFrame(frame); if (!S) return;
    var bc = document.body.classList; if (bc.contains("inmenu") || bc.contains("inbox") || bc.contains("inroom")) { dirty = true; last = ts; return; }   /* C11 : la carte est cachée sous le menu, l'ouverture de box ou le QG : inutile de la dessiner (mesuré : le menu consommait ~50 % du temps pour dessiner une carte invisible) */
    var fi0 = Math.min(250, ts - last || 16.7), dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts; ui.fi = ui.fi ? ui.fi * 0.92 + fi0 * 0.08 : fi0;   /* intervalle lissé entre images : le vrai coût, rastérisation comprise (le temps JS seul le sous-estime) */ var mo = motion();
    D.territory.districts.forEach(function (d) { ui.dstate[d.id] = T.state(S, d); });
    var dc = BL.shop ? BL.shop.active(S, BL.shop.getPreview()) : {}, dsg = JSON.stringify(dc); if (dsg !== ui.dsg) { ui.dsg = dsg; dirty = true; } R.setDecor(dc);
    var mk = BL.notify ? BL.notify.marks() : []; R.setMarks(mk); if (mk.length || ui.hadMk) { dirty = true; ui.hadMk = mk.length > 0; }
    syncEvents(); var sg = stateSig(S); if (sg !== sig) { sig = sg; dirty = true; }
    if (goal) { var k = 1 - Math.pow(0.001, dt); cam.x += (goal.x - cam.x) * k; cam.y += (goal.y - cam.y) * k; cam.z += (goal.z - cam.z) * k; if (Math.abs(goal.x - cam.x) < 0.5 && Math.abs(goal.y - cam.y) < 0.5 && Math.abs(goal.z - cam.z) < 0.002) { cam.x = goal.x; cam.y = goal.y; cam.z = goal.z; goal = null; } dirty = true; }
    ambient(); var ch = R.update(dt, S, { motion: mo, low: document.body.classList.contains("lowfx") || ui.q === 0 }); if (ch) dirty = true;
    if (BL.worksUI && S.works && (S.works.q.length || ui.wkN)) { ui.wkN = S.works.q.length; BL.worksUI.place(lotScreen); }   /* Partie 17 · D : échafaudages au-dessus des bâtiments en chantier */
    if (!mo && !dirty) return;
    if ((ui.skip || 1) > 1 && !drag && !pinch && !goal && !dirty && (ui.fc = (ui.fc || 0) + 1) % ui.skip) return;   /* appareil très lent : une image sur 2 ou 3 seulement au repos */
    dirty = false; var t0 = performance.now(); R.draw(ctx, { x: cam.x, y: cam.y, z: cam.z * dpr }, cv.width, cv.height, S, ui); ui.ms = (ui.ms || 0) * 0.9 + (performance.now() - t0) * 0.1; if (cfg.quality === "auto" && mo && BL.atmos) { var oq = ad.q; BL.atmos.adapt(ad, ui.fi > 31 ? ui.fi * 0.7 : ui.ms); if (ad.q !== oq) { dirty = true; paintCtl(); } govern(); } drawMini();
  }
  /* ---------- ambiance, calques, mini-carte (chantier 9) ---------- */
  var cfg = { layers: { events: true, labels: true, traffic: true, atmos: true, mini: true, read: false, borders: false }, time: "auto", weather: "auto", quality: "auto" }, ad = { q: 2, slow: 0, fast: 0 }, mini = null, mctx = null, miniT = 0, atT = 0;
  try { var sv = JSON.parse(localStorage.getItem("blackline.map") || "null"); if (sv && typeof sv === "object") { if (sv.layers) Object.keys(cfg.layers).forEach(function (k) { if (typeof sv.layers[k] === "boolean") cfg.layers[k] = sv.layers[k]; }); ["time", "weather", "quality"].forEach(function (k) { if (typeof sv[k] === "string") cfg[k] = sv[k]; }); } } catch (e) {}
  function saveCfg() { try { localStorage.setItem("blackline.map", JSON.stringify(cfg)); } catch (e) {} }
  function ambient() {
    if (!BL.atmos || !R) return; var now = performance.now(); if (now - atT < 2000 && ui.q !== undefined) return; atT = now; var d = new Date(), q = cfg.quality === "high" ? 2 : cfg.quality === "low" ? 0 : ad.q;
    var a = { on: true, t: BL.atmos.at(d, cfg.time), w: BL.atmos.weather(d, cfg.weather), q: q }, sg = a.t.key + a.w.kind + q + Math.round(a.t.sun * 40); if (sg !== ui.asg) { ui.asg = sg; dirty = true; }
    ui.q = q; ui.atm = a; R.setAtmos(a); R.setLayers(cfg.layers); if (ui.stat) { var tx = a.t.label + " · " + a.w.label; if (ui.stat.textContent !== tx) ui.stat.textContent = tx; }
  }
  function paintCtl() { if (!P.ctl) return; var qn = ["Basse", "Moyenne", "Élevée"][ad.q]; P.ctl.qs.textContent = cfg.quality === "auto" ? "Automatique (actuellement : " + qn + ((ui.res || 1) < 1 ? " · résolution " + Math.round((ui.res || 1) * 100) + " %" : "") + ((ui.skip || 1) > 1 ? " · une image sur " + ui.skip : "") + ")" : "Fixée : " + (cfg.quality === "high" ? "élevée" : "basse"); }
  function buildCtl() {
    var wrap = $("mapWrap"), bar = document.querySelector(".mctl"); if (!wrap || !bar) return;
    var btn = $("rbEdit") || el("button", "btn ghost", "Modifier"); btn.id = "rbEdit"; btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "mLayers"); if (!btn.parentNode) bar.insertBefore(btn, bar.firstChild);
    var pan = el("div", "mlayers"); pan.id = "mLayers"; pan.hidden = true; pan.setAttribute("role", "group"); pan.setAttribute("aria-label", "Calques et ambiance de la carte");
    var L = [["events", "Événements en cours"], ["labels", "Noms des quartiers"], ["traffic", "Voitures et passants"], ["atmos", "Lumière et météo"], ["mini", "Mini-carte"], ["borders", "Limites des quartiers"], ["read", "Mode lisibilité (décor atténué)"]];
    pan.innerHTML = '<h3>Modifier l’affichage</h3>' + L.map(function (l) { return '<label class="mchk"><input type="checkbox" data-l="' + l[0] + '"><span>' + l[1] + "</span></label>"; }).join("") +
      '<h3>Ambiance</h3><label class="msel"><span>Heure</span><select data-k="time"><option value="auto">Heure réelle de l’appareil</option><option value="day">Jour</option><option value="dusk">Crépuscule</option><option value="night">Nuit</option><option value="dawn">Aube</option></select></label>' +
      '<label class="msel"><span>Météo</span><select data-k="weather"><option value="auto">Météo du jour</option><option value="clear">Dégagé</option><option value="rain">Pluie</option><option value="fog">Brouillard</option></select></label>' +
      '<label class="msel"><span>Qualité</span><select data-k="quality"><option value="auto">Automatique</option><option value="high">Élevée</option><option value="low">Basse</option></select></label><p class="muted mqs" id="mQs"></p>' +
      '<p class="muted mnote">Les animations suivent le réglage « mouvement » du jeu. Un décor de boutique (pluie, brouillard…) prend le dessus sur la météo.</p>';
    wrap.appendChild(pan); P.ctl = { btn: btn, pan: pan, qs: pan.querySelector("#mQs") };
    pan.querySelectorAll("input[data-l]").forEach(function (i) { i.checked = !!cfg.layers[i.dataset.l]; i.onchange = function () { cfg.layers[i.dataset.l] = i.checked; saveCfg(); atT = 0; dirty = true; applyMini(); }; });
    pan.querySelectorAll("select[data-k]").forEach(function (sl) { sl.value = cfg[sl.dataset.k]; sl.onchange = function () { cfg[sl.dataset.k] = sl.value; if (sl.dataset.k === "quality") ad = { q: 2, slow: 0, fast: 0 }; saveCfg(); atT = 0; ui.asg = ""; dirty = true; paintCtl(); }; });
    btn.onclick = function () { var o = pan.hidden; pan.hidden = !o; btn.setAttribute("aria-expanded", String(o)); }; pan.addEventListener("keydown", function (e) { if (e.key === "Escape") { pan.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
    var st = el("div", "mstat"); st.setAttribute("aria-hidden", "true"); wrap.appendChild(st); ui.stat = st;
    mini = el("canvas", "mmini"); mini.width = 160; mini.height = 168; mini.setAttribute("role", "img"); mini.setAttribute("aria-label", "Mini-carte : clique pour déplacer la vue"); wrap.appendChild(mini); mctx = mini.getContext && mini.getContext("2d");
    var mv = function (e) { var r = mini.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * model.W, y = (e.clientY - r.top) / r.height * model.H; centerOn(x, y, cam.z); }; var md = false;
    mini.addEventListener("pointerdown", function (e) { md = true; mini.setPointerCapture && mini.setPointerCapture(e.pointerId); mv(e); }); mini.addEventListener("pointermove", function (e) { if (md) mv(e); }); mini.addEventListener("pointerup", function () { md = false; });
    applyMini(); paintCtl();
  }
  function applyMini() { if (mini) mini.hidden = !cfg.layers.mini; }
  function drawMini() {
    if (!mctx || !cfg.layers.mini || !model || !vis) return; var now = performance.now(); if (now - miniT < 300) return; miniT = now; var W = mini.width, H = mini.height, sx = W / model.W, sy = H / model.H; mctx.clearRect(0, 0, W, H); mctx.fillStyle = "rgba(9,16,24,.88)"; mctx.fillRect(0, 0, W, H);
    model.cells.forEach(function (c) { if (!c.land) return; var st = c.district === "hq" ? "hq" : ui.dstate[c.district]; var col = st === "hq" ? "#4a6a8a" : st === "controlled" ? "#b89a54" : st === "contested" ? "#c0483c" : st === "available" ? "#5a6a7a" : "#2c333d"; mctx.fillStyle = col; mctx.fillRect(c.x * sx, c.y * sy, Math.max(2, c.size * sx - 1), Math.max(2, c.size * sy - 1)); });
    mctx.fillStyle = "#e8cd8a"; model.lots.forEach(function (l) { if (S && BL.economy.buildings(S, l.act) > l.idx) mctx.fillRect(l.x * sx, l.y * sy, 4, 4); });
    mctx.strokeStyle = "#ffffff"; mctx.lineWidth = 1.5; var wx = cam.x * sx, wy = cam.y * sy, ww = vw / cam.z * sx, wh = vh / cam.z * sy; mctx.strokeRect(Math.max(0.5, wx), Math.max(0.5, wy), Math.min(W - 1, ww), Math.min(H - 1, wh));
  }
  function visible(on) {
    if (!cv || !ctx) return; vis = !!on; if (on) { resize(); dirty = true; last = performance.now(); if (!raf) raf = root.requestAnimationFrame(frame); } else if (raf) { root.cancelAnimationFrame(raf); raf = 0; }
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && vis && !raf) { last = performance.now(); raf = root.requestAnimationFrame(frame); } });

  function init(handlers, util) {
    h = handlers; u = util; E = BL.economy; T = BL.territory; D = BL.data; M = BL.mapData; cv = $("cityCanvas"); if (!cv) return; ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) { $("mapWrap").innerHTML = '<div class="card muted">Ton navigateur ne peut pas afficher la carte. Les autres sections restent utilisables.</div>'; return; }
    model = M.build(); R = BL.mapRender.create(model, { money: util.money }); buildPanel(); bind(); dock(); if (BL.buildMenu) BL.buildMenu.init(h, util); buildCtl(); cv.style.cursor = "grab";
    var chips = $("mapChips"); P.chips = {}; var all = [["hq", "Quartier général"]].concat(D.activities.map(function (a) { return [a.id, a.name]; }));
    all.forEach(function (c) { var b = el("button", "mchip"); b.textContent = c[1]; b.onclick = function () { var hit = c[0] === "hq" ? { type: "hq", id: "hq" } : { type: "lot", id: c[0] + "#0", act: c[0] }; select(hit, true); }; chips.appendChild(b); P.chips[c[0]] = b; });
  }
  /* accès rapides sur la carte : chaque bouton ouvre une vraie section */
  function dock() {
    var d = el("nav", "mdock"); d.setAttribute("aria-label", "Accès rapides");
    [["hq", "QG", "vault", 1], ["team", "Équipe", "team"], ["terr", "Quartiers", "map"], ["upg", "Bonus", "up"], ["goals", "Journal", "trophy"], ["dash", "Bilan", "dash"]].forEach(function (q) {
      var b = el("button", "dk", ""), nb = document.querySelector('[data-view="' + q[0] + '"] svg'); b.innerHTML = (nb ? nb.outerHTML : "") + "<span>" + q[1] + "</span>"; b.setAttribute("aria-label", "Ouvrir : " + q[1]); b.onclick = function () { if (q[3]) BL.roomUI.enter(); else u.go(q[0]); }; d.appendChild(b);
    });
    $("mapWrap").appendChild(d);
  }
  function update(s) { if (!S) dirty = true; S = s; if (R && s.razed && s.razed.length !== ui.rzN) { ui.rzN = s.razed.length; if (R.applyRaze(s.razed, function (did) { return BL.data.dbuild.style[did] ? BL.data.dbuild.style[did].slots : 0; })) dirty = true; } if (vis && ui.sel) renderPanel(); if (BL.buildMenu) BL.buildMenu.update(s); }
  /* aller voir un endroit de la carte (lot, quartier ou QG) : utilisé par les notifications */
  function focusTarget(t) {
    if (!t || !R) return; if (t.type === "hq") { var f = R.focusOf({ type: "hq", id: "hq" }); if (f) centerOn(f.x, f.y - 30, vw <= 900 ? 1 : 1.3); return; }
    select(t.type === "lot" ? { type: "lot", id: t.id || t.act + "#0", act: t.act } : t.type === "dlot" ? { type: "dlot", id: t.id, did: t.did, idx: t.idx } : { type: "district", id: t.id }, true);
  }
  /* mode placement (menu Bâtiments) : la carte met en valeur les terrains valides et renvoie le terrain touché */
  var place = {
    start: function (spec) { ui.place = spec; R.setPlacement({ type: spec.type, valid: spec.valid, ghost: spec.ghost || null }); dirty = true; },
    ghost: function (id) { if (!ui.place) return; ui.place.ghost = id; R.setPlacement({ type: ui.place.type, valid: ui.place.valid, ghost: id }); if (id) { var f = R.focusOf({ type: "dlot", id: id }); if (f) centerOn(f.x, f.y - 10 + (vw <= 900 ? vh * 0.12 / cam.z : 0), Math.max(cam.z, vw <= 900 ? 0.7 : 0.85)); } dirty = true; },
    focus: function (id) { var f = R.focusOf({ type: "dlot", id: id }); if (f) centerOn(f.x, f.y - 10 + (vw <= 900 ? vh * 0.12 / cam.z : 0), Math.max(cam.z, vw <= 900 ? 0.7 : 0.85)); },
    end: function () { ui.place = null; if (R) R.setPlacement(null); dirty = true; },
    active: function () { return !!ui.place; },
    plots: function () { return model ? model.dplots : []; }
  };
  BL.mapUI = { screenOf: function (h0) { return h0 && h0.type === "lot" ? lotScreen(h0.id) : null; }, shown: function () { return !!vis; }, govStep: govStep, resolution: function () { return { res: ui.res || 1, skip: ui.skip || 1 }; }, place: place, cfg: function () { return { time: cfg.time, weather: cfg.weather }; }, _dbg: function () { return { police: R ? R.cars.filter(function (c) { return c.pol; }).length : 0, cops: R ? R.walkers.filter(function (w) { return w.cop; }).length : 0, blocks: R && R.blocks ? R.blocks.length : 0, heli: !!(R && R.heli), amb: R ? R.cars.filter(function (c) { return c.amb; }).length : 0, civCars: R ? R.cars.filter(function (c) { return !c.pol && !c.amb; }).length : 0, heatTier: R ? R.heatTier : 0, events: R ? R.events.length : 0, anim: !!(R && R.motion && !R.low), z: cam.z, pending: S ? S.pending || null : null, money: S ? S.money : 0, conflict: !!(S && S.terr && S.terr.conflict), pills: R ? R.evHits.map(function (q) { return { key: q.e.key, kind: q.e.kind, x: (q.x - cam.x) * cam.z, y: (q.y - cam.y) * cam.z, w: q.w * cam.z, h: q.h * cam.z }; }) : [] }; }, viewDistrict: function () { if (!model || !cam || !vw || !vh) return ""; var cx = cam.x + vw / cam.z / 2, cy = cam.y + vh / cam.z / 2, best = "", bd = 1e18; Object.keys(model.districts || {}).forEach(function (id) { var d = model.districts[id], dx = d.cx - cx, dy = d.cy - cy, q = dx * dx + dy * dy; if (q < bd) { bd = q; best = id; } }); return best; }, focus: focusTarget, zoomToHQ: function () { var f = R && R.focusOf({ type: "hq", id: "hq" }); if (f) centerOn(f.x, f.y - 30, 2.3); }, home: function () { if (cv && vw) { home(); if (goal && !motion()) { cam.x = goal.x; cam.y = goal.y; cam.z = goal.z; goal = null; } dirty = true; } }, init: init, update: update, visible: visible, select: function (x) { select(x, true); }, _debug: function () { return { cam: cam, ui: ui, R: R, model: model, S: S }; } };
})(window);
