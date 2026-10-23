/* Boxs : page « Box » (taux, pitié, prix, contenu) et écran d'ouverture plein cadre.
   Aucune règle ici : le tirage est fait par BL.boxes.open (via h.boxOpen) AVANT toute animation et déjà enregistré ; ce module ne fait que le raconter.
   Fermer l'onglet pendant l'animation ne perd donc rien et ne rejoue rien : le dernier résultat reste affiché dans l'onglet « Boxs ». */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, X, D, DB, h, u, S = null, run = null, built = false, opener = null;
  function $(id) { return doc.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lg(n) { return n + " lingot" + (n > 1 ? "s" : ""); }
  function pct(x) { return (Math.round(x * 10) / 10 + "").replace(".", ",") + " %"; }
  function stars(r) { var o = ""; for (var i = 0; i <= r; i++) o += "★"; return o; }
  function motionOn() { var b = doc.body; return !b.classList.contains("nomotion") && !(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function lowFx() { return doc.body.classList.contains("lowfx"); }
  function icon(it, big) { return '<svg viewBox="' + (D.VB || "0 0 96 96") + '" class="eqic' + (big ? " big" : "") + '" style="color:' + D.RCOL[it.rar] + '" role="img" aria-label="' + esc(it.name) + '">' + (D.ICONS[it.ic] || "") + "</svg>"; }

  /* ---------- le dessin des 3 boxs : corps, couvercle, fente de lumière ---------- */
  function boxArt(id, col, cls) {
    var body, lid, slit = '<rect class="bx-slit" x="24" y="58" width="72" height="4" rx="2" fill="#fff"/>';
    if (id === "rue") {
      body = '<rect x="22" y="58" width="76" height="46" rx="3" fill="#6b4426"/><path d="M22 70h76M22 82h76M22 94h76" stroke="#3e2714" stroke-width="2"/><rect x="22" y="58" width="9" height="46" fill="#8b97a8"/><rect x="89" y="58" width="9" height="46" fill="#8b97a8"/><circle cx="26.5" cy="66" r="1.8" fill="#2a3040"/><circle cx="93.5" cy="66" r="1.8" fill="#2a3040"/><circle cx="26.5" cy="96" r="1.8" fill="#2a3040"/><circle cx="93.5" cy="96" r="1.8" fill="#2a3040"/><rect x="50" y="64" width="20" height="14" rx="2" fill="#2a3040"/><rect x="55" y="68" width="10" height="6" fill="' + col + '"/>';
      lid = '<rect x="18" y="42" width="84" height="18" rx="4" fill="#8a5a32"/><path d="M18 51h84" stroke="#4d3019" stroke-width="2"/><rect x="18" y="42" width="9" height="18" fill="#a2adbf"/><rect x="93" y="42" width="9" height="18" fill="#a2adbf"/><rect x="22" y="44" width="76" height="3" rx="1.5" fill="#fff" opacity=".18"/>';
    } else if (id === "syndicat") {
      body = '<rect x="20" y="58" width="80" height="46" rx="5" fill="#1d1830"/><rect x="20" y="58" width="80" height="46" rx="5" fill="none" stroke="' + col + '" stroke-width="2.5"/><path d="M30 70h60M30 92h60" stroke="' + col + '" stroke-width="1.5" opacity=".6"/><path d="M60 66l10 12-10 12-10-12z" fill="' + col + '"/><path d="M60 70l6 8-6 8-6-8z" fill="#1d1830"/><circle cx="60" cy="78" r="2.6" fill="' + col + '"/>';
      lid = '<path d="M16 60V46c0-3 2-5 5-5h78c3 0 5 2 5 5v14z" fill="#2a2145"/><path d="M16 60V46c0-3 2-5 5-5h78c3 0 5 2 5 5v14z" fill="none" stroke="' + col + '" stroke-width="2.5"/><path d="M24 50h72" stroke="' + col + '" stroke-width="1.5" opacity=".6"/><rect x="20" y="43" width="80" height="3" rx="1.5" fill="#fff" opacity=".15"/>';
    } else {
      body = '<rect x="18" y="58" width="84" height="48" rx="5" fill="#0f0b16"/><rect x="18" y="58" width="84" height="48" rx="5" fill="none" stroke="#e3b34c" stroke-width="2.5"/><rect x="24" y="64" width="72" height="36" rx="3" fill="none" stroke="' + col + '" stroke-width="1.6" opacity=".9"/><path d="M60 68l3.6 7.6 8.4 1-6.2 5.7 1.7 8.3-7.5-4.2-7.5 4.2 1.7-8.3-6.2-5.7 8.4-1z" fill="#e3b34c"/><circle cx="24" cy="64" r="2.4" fill="#e3b34c"/><circle cx="96" cy="64" r="2.4" fill="#e3b34c"/><circle cx="24" cy="100" r="2.4" fill="#e3b34c"/><circle cx="96" cy="100" r="2.4" fill="#e3b34c"/>';
      lid = '<path d="M14 60V44c0-4 2-6 6-6h80c4 0 6 2 6 6v16z" fill="#1a1325"/><path d="M14 60V44c0-4 2-6 6-6h80c4 0 6 2 6 6v16z" fill="none" stroke="#e3b34c" stroke-width="2.5"/><path d="M26 48h68" stroke="' + col + '" stroke-width="2" opacity=".85"/><path d="M44 38l6-9 10 7 10-7 6 9z" fill="#e3b34c"/><circle cx="60" cy="34" r="3" fill="' + col + '"/>';
    }
    return '<svg viewBox="0 0 120 120" class="bx-art ' + (cls || "") + '" role="img" aria-label="' + esc(X.box(id).name) + '"><ellipse cx="60" cy="108" rx="44" ry="5" fill="#000" opacity=".35"/><g class="bx-body">' + body + '</g><g class="bx-lid">' + lid + "</g>" + slit + "</svg>";
  }

  /* ---------- onglet « Boxs » de la boutique ---------- */
  function rateRows(b) {
    return X.rates(b).map(function (r) { return '<div class="bxr" style="--rc:' + D.RCOL[r.rar] + '"><i aria-hidden="true"></i><span>' + cap(D.RAR[r.rar]) + "</span><b>" + pct(r.pct) + '</b><span class="bxbar" aria-hidden="true"><s style="width:' + Math.max(2, r.pct) + '%"></s></span></div>'; }).join("");
  }
  function pityRows(b, s) {
    var st = X.status(s, b.id), o = "";
    function row(txt, p, col) { return '<div class="bxp" style="--rc:' + col + '"><span>' + txt + '</span><b>' + p.have + " / " + p.need + '</b><span class="bxbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + p.need + '" aria-valuenow="' + p.have + '" aria-label="' + esc(txt) + '"><s style="width:' + Math.round(p.have * 100 / p.need) + '%"></s></span></div>'; }
    if (st.leg) o += row("Pitié : Légendaire garanti dans " + st.leg.left + " ouverture" + (st.leg.left > 1 ? "s" : "") + " au plus", st.leg, D.RCOL[3]);
    if (st.myth) o += row("Pitié : Mythique garanti dans " + st.myth.left + " ouverture" + (st.myth.left > 1 ? "s" : "") + " au plus", st.myth, D.RCOL[4]);
    return o || '<p class="bxnp">Pas de pitié sur cette box.</p>';
  }
  function lastHtml(s) {
    var l = s.boxes && s.boxes.last; if (!l) return ""; var b = X.box(l.box); if (!b) return "";
    return '<section class="bxlast card" aria-label="Dernière ouverture"><h3 class="sh3">Dernière ouverture · ' + esc(b.name) + (l.n > 1 ? " ×" + l.n : "") + '</h3><div class="bxl">' + l.items.map(function (x) {
      var it = BL.equip.item(x.id); return '<span class="bxli" style="--rc:' + D.RCOL[x.rar] + '">' + icon(it) + "<b>" + esc(it.name) + "</b><small>" + cap(D.RAR[x.rar]) + (x.dup ? " · doublon" : x.full ? " · Arsenal plein" : " · nouveau") + (x.money ? " · +" + u.money(x.money) : "") + "</small></span>";
    }).join("") + "</div></section>";
  }
  function ago(at) {
    var d = Math.max(0, Date.now() - at) / 1000; if (!(at > 0)) return "date inconnue";
    if (d < 60) return "à l’instant"; if (d < 3600) return "il y a " + Math.floor(d / 60) + " min"; if (d < 86400) return "il y a " + Math.floor(d / 3600) + " h";
    return "il y a " + Math.floor(d / 86400) + " j";
  }
  /* C12 : 5 dernières ouvertures (s.boxHist), récent → ancien */
  function histHtml(s) {
    var h = (s.boxHist || []).filter(function (e) { return X.box(e.b); }), o = '<section class="bxhist card" aria-label="Dernières ouvertures"><h3 class="sh3">Dernières ouvertures</h3>';
    if (!h.length) return o + '<p class="bxnp">Aucune ouverture pour l’instant. Ouvre une box : tes 5 dernières ouvertures apparaîtront ici, de la plus récente à la plus ancienne.</p></section>';
    return o + '<ol class="bxhl">' + h.map(function (e) {
      var b = X.box(e.b);
      return '<li class="bxhi" style="--bc:' + b.col + '"><div class="bxhh"><b>' + esc(b.name) + (e.it.length > 1 ? " ×" + e.it.length : "") + "</b><small>" + ago(e.at) + '</small></div><div class="bxl">' + e.it.map(function (x) {
        var it = BL.equip.item(x.id); if (!it) return ""; return '<span class="bxli" style="--rc:' + D.RCOL[it.rar] + '">' + icon(it) + "<b>" + esc(it.name) + "</b><small>" + cap(D.RAR[it.rar]) + (x.dup ? " · Doublon" : " · Nouveau") + "</small></span>";
      }).join("") + "</div></li>";
    }).join("") + "</ol></section>";
  }
  function html(s) {
    S = s; var g = s.gold, o = '<p class="rnote">Les boxs contiennent de l’<b>équipement</b> (armes, protections, accessoires, véhicules) : jamais de revenus ni de statistiques achetées. Les pourcentages affichés sont ceux utilisés pour le tirage. Un <b>doublon</b> (ou un Arsenal plein) est converti en un peu d’argent du jeu, jamais en lingots.</p><div class="bxgrid">';
    X.list().forEach(function (b) {
      var can1 = X.canOpen(s, b.id, 1), mm = X.maxMulti(s, b.id), can5 = X.canOpen(s, b.id, 5), n = BL.data.equip.ITEMS.filter(function (i) { return b.odds[i.rar] > 0; }).length;
      o += '<article class="bxc" style="--bc:' + b.col + '" data-box="' + b.id + '"><header>' + boxArt(b.id, b.col, "bx-static") + '<div><span class="bxtag">' + b.tag + "</span><h3>" + esc(b.name) + "</h3><b class=\"bxcost\">" + lg(b.cost) + " par ouverture</b></div></header><p class=\"bxtx\">" + esc(b.text) + "</p>"
        + '<div class="bxrates" aria-label="Taux de drop">' + rateRows(b) + '</div><div class="bxpity">' + pityRows(b, s) + '</div><small class="bxn">' + n + " objets possibles · " + X.status(s, b.id).opened + " ouverte" + (X.status(s, b.id).opened > 1 ? "s" : "") + " au total</small>"
        + '<button type="button" class="btn ghost bxprev" data-act="bprev" data-id="' + b.id + '">Aperçu du contenu · ' + n + ' objets</button><div class="bxbtn"><button class="btn ' + (can1 ? "can" : "") + '" data-act="bopen" data-id="' + b.id + '" data-n="1"' + (can1 ? "" : " disabled") + ">" + (can1 ? "Ouvrir · " + b.cost : "Il te manque " + (b.cost - g)) + "</button>"
        + '<button class="btn ' + (can5 ? "can" : "") + '" data-act="bopen" data-id="' + b.id + '" data-n="5"' + (can5 ? "" : " disabled") + ' aria-label="Ouvrir 5 fois pour ' + lg(b.cost * 5) + '">×5 · ' + b.cost * 5 + "</button></div></article>";
    });
    return o + "</div>" + histHtml(s);
  }

  /* ---------- aperçu du contenu (Partie 14) ---------- */
  var pv = null;
  function pvHtml() {
    var d = pv.data, f = pv.f, o = '<div class="bpv-h"><h2 id="bpvT">' + esc(d.box.name) + ' · contenu possible</h2><button type="button" class="bpv-x" data-p="close" aria-label="Fermer l’aperçu">&times;</button></div>';
    o += '<p class="bpv-n">' + d.total + " objets possibles. Les pourcentages sont ceux utilisés pour le tirage (total " + pct(d.sum) + "). Un objet est tiré au hasard parmi ceux de sa rareté : le taux de chaque objet est le taux de la rareté divisé par leur nombre.</p>";
    o += '<div class="bpv-f" role="group" aria-label="Filtrer par rareté">' + '<button type="button" class="bpv-c' + (f.rar === null ? " on" : "") + '" data-p="rar" data-v="all" aria-pressed="' + (f.rar === null) + '">Toutes</button>' + d.rarities.map(function (r) { var on = f.rar === r.rar; return '<button type="button" class="bpv-c' + (on ? " on" : "") + '" style="--rc:' + D.RCOL[r.rar] + '" data-p="rar" data-v="' + r.rar + '" aria-pressed="' + on + '">' + cap(D.RAR[r.rar]) + " " + pct(r.pct) + "</button>"; }).join("") + "</div>";
    o += '<label class="bpv-s">Catégorie <select data-p="slot"><option value="">Toutes</option>' + Object.keys(D.SLOTS).map(function (k) { return '<option value="' + k + '"' + (f.slot === k ? " selected" : "") + ">" + D.SLOTS[k] + "</option>"; }).join("") + "</select></label>";
    var shown = 0;
    d.rarities.forEach(function (r) {
      if (f.rar !== null && f.rar !== r.rar) return; var its = r.items.filter(function (x) { return !f.slot || x.slot === f.slot; }); if (!its.length) return; shown += its.length;
      o += '<section class="bpv-r" style="--rc:' + D.RCOL[r.rar] + '"><h3><span aria-hidden="true">' + stars(r.rar) + "</span> " + cap(D.RAR[r.rar]) + " <b>" + pct(r.pct) + "</b><small>" + r.count + " objet" + (r.count > 1 ? "s" : "") + " · environ " + pct(r.each) + " chacun</small></h3><ul>" + its.map(function (x) {
        var it = BL.equip.item(x.id); return '<li class="bpv-i">' + icon(it) + '<span class="bpv-t"><b>' + esc(x.name) + "</b><small>" + cap(D.RAR[x.rar]) + " · " + D.SLOTS[x.slot] + "</small></span><em class=\"" + (x.owned ? "own" : "new") + '">' + (x.owned ? "Possédé" : "Nouveau") + "</em><span class=\"bpv-p\">" + pct(x.pct) + "</span></li>"; }).join("") + "</ul></section>";
    });
    if (!shown) o += '<p class="bpv-n">Aucun objet ne correspond à ces filtres.</p>';
    o += '<section class="bpv-g"><h3>Protection contre la malchance</h3>';
    if (!d.guaranteed.length) o += "<p>Pas de tirage garanti sur cette box.</p>";
    d.guaranteed.forEach(function (g) {
      var st = X.status(S, d.box.id), left = g.kind === "leg" ? st.leg && st.leg.left : st.myth && st.myth.left;
      o += "<p>" + (g.kind === "leg" ? "Après " + (g.every - 1) + " ouvertures sans Légendaire ni mieux, la suivante en donne un : " + g.rars.map(function (r, i) { return cap(D.RAR[r]) + " " + pct(g.pct[i]); }).join(", ") : "Après " + (g.every - 1) + " ouvertures sans Mythique, la suivante en donne un : Mythique 100 %") + ". Il t’en reste au plus <b>" + (left || g.every) + "</b> avant la garantie.</p>";
    });
    return o + "</section>";
  }
  function pvPaint() { var bx = $("bpvBox"); if (!bx) return; var sc = bx.scrollTop; bx.innerHTML = pvHtml(); bx.scrollTop = sc; }
  function preview(id, from) {
    if (pv || !S) return; var data = X.preview(S, id); if (!data) return; pv = { data: data, f: { rar: null, slot: "" }, from: from || doc.activeElement };
    var d = doc.createElement("div"); d.id = "boxprev"; d.className = "bpv"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "bpvT"); d.innerHTML = '<div class="bpv-box" id="bpvBox" tabindex="-1"></div>'; doc.body.appendChild(d);
    d.addEventListener("click", function (e) { var t = e.target.closest("[data-p]"); if (e.target === d || (t && t.dataset.p === "close")) return pvClose(); if (t && t.dataset.p === "rar") { pv.f.rar = t.dataset.v === "all" ? null : +t.dataset.v; pvPaint(); var n = $("bpvBox").querySelector('[data-p="rar"].on'); if (n) n.focus(); } });
    d.addEventListener("change", function (e) { if (e.target.dataset.p === "slot") { pv.f.slot = e.target.value; pvPaint(); var s2 = $("bpvBox").querySelector('[data-p="slot"]'); if (s2) s2.focus(); } });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); pvClose(); } else if (e.key === "Tab") { var f = [].filter.call(d.querySelectorAll("button,select"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); } } });
    $("app").inert = true; pvPaint(); var x = $("bpvBox").querySelector(".bpv-x"); if (x) x.focus();
  }
  function pvClose() { if (!pv) return; var f = pv.from, d = $("boxprev"); pv = null; if (d) d.remove(); $("app").inert = false; try { if (f && doc.contains(f)) f.focus(); } catch (e) {} }


  /* ---------- page « Box » (hors Boutique) ---------- */
  var vsig = "", vbuilt = false;
  function vBuild() {
    var v = $("v_boxes"); if (!v || vbuilt) return; vbuilt = true;
    v.innerHTML = '<div class="shead"><div class="sh-l"><div class="sh-n"><small>Tes lingots d’or</small><div><b class="sgold">0</b><span class="scap"></span></div></div></div><p class="sh-t">Les box se paient en lingots d’or, jamais en argent réel. Elles ne donnent que de l’équipement.</p><button class="btn ghost" data-act="goCoffre">Aller au Coffre</button></div><div class="sbody" id="bxBody"></div>';
    v.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b || b.disabled) return; var a = b.dataset.act, id = b.dataset.id;
      if (a === "bprev") preview(id, b); else if (a === "bopen") request(id, +b.dataset.n, b); else if (a === "goCoffre") u.go("hq");
    });
  }
  function vRender(force) {
    var v = $("v_boxes"); if (!S || !v || v.hidden) return; vBuild();
    var sig = [S.gold, JSON.stringify(S.boxes), JSON.stringify(S.boxHist), S.eq && S.eq.inv ? S.eq.inv.length : 0].join("|");
    var g = v.querySelector(".sgold"), cp = v.querySelector(".scap"), t = String(S.gold), t2 = BL.gold && BL.gold.capacity ? " / " + BL.gold.capacity(S) + " en réserve" : ""; if (g && g.textContent !== t) g.textContent = t; if (cp && cp.textContent !== t2) cp.textContent = t2;
    if (force || sig !== vsig) { vsig = sig; var b = $("bxBody"); if (b) b.innerHTML = html(S); }
  }
  function update(s) { S = s; vRender(false); }

  /* ---------- écran d'ouverture ---------- */
  function build() {
    if (built || !$("app")) return; built = true; var d = doc.createElement("div"); d.id = "boxfx"; d.className = "bfx"; d.hidden = true; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Ouverture de box");
    d.innerHTML = '<div class="bfx-bg"></div><div class="bfx-stage" id="bfxStage" data-phase="in" data-rar="0"><div class="bfx-glow"></div><div class="bfx-rays"></div><div class="bfx-ring"></div><div class="bfx-ring r2"></div><div class="bfx-boxw"></div><div class="bfx-flash"></div><div class="bfx-parts" aria-hidden="true"></div><div class="bfx-card" id="bfxCard"></div></div>'
      + '<div class="bfx-recap" id="bfxRecap" hidden></div><div class="bfx-hud"><span class="bfx-count" id="bfxCount" aria-live="polite"></span><div class="bfx-btns" id="bfxBtns"></div></div><p class="bfx-live sr" id="bfxLive" role="status" aria-live="polite"></p>';
    doc.body.appendChild(d); d.addEventListener("click", onClick); d.addEventListener("keydown", onKey);
    doc.addEventListener("visibilitychange", function () { if (run && doc.hidden && !run.final) toEnd(); });
  }
  function clearTimers() { if (run) { run.t.forEach(clearTimeout); run.t = []; } }
  function later(ms, fn) { run.t.push(setTimeout(fn, ms)); }
  function stage() { return $("bfxStage"); }
  function setPhase(p) { stage().dataset.phase = p; }
  function btns(list) { $("bfxBtns").innerHTML = list.map(function (b) { return '<button type="button" class="btn ' + (b.cls || "") + '" data-b="' + b.k + '"' + (b.dis ? " disabled" : "") + ">" + b.t + "</button>"; }).join(""); var f = $("bfxBtns").querySelector("button:not([disabled])"); if (f && run) try { f.focus({ preventScroll: true }); } catch (e) {} }
  function particles(rar) {
    var n = [0, 4, 12, 14, 22][rar]; if (lowFx()) n = Math.ceil(n / 2); var o = "";
    for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2 + (rar * 0.7), r = 90 + (i % 3) * 36; o += '<i style="--x:' + Math.round(Math.cos(a) * r) + "px;--y:" + Math.round(Math.sin(a) * r) + "px;--d:" + (i % 4) * 0.06 + 's"></i>'; }
    return o;
  }
  function cardHtml(x, big) {
    var it = BL.equip.item(x.id), st = ["pow", "def", "stl", "spd"].filter(function (k) { return it.st[k]; }).map(function (k) { return "<span>" + D.STATS[k] + " +" + it.st[k] + "</span>"; }).join("");
    var tag = x.dup ? '<em class="bfx-tag dup">Doublon · +' + u.money(x.money) + "</em>" : x.full ? '<em class="bfx-tag dup">Arsenal plein · converti +' + u.money(x.money) + "</em>" : '<em class="bfx-tag new">Nouveau · ajouté à l’Arsenal</em>';
    return icon(it, big) + "<b>" + esc(it.name) + '</b><small class="bfx-rar"><span aria-hidden="true">' + stars(x.rar) + "</span> " + cap(D.RAR[x.rar]) + " · " + D.SLOTS[it.slot] + '</small><div class="bfx-sts">' + st + "</div>" + tag + (x.pity ? '<small class="bfx-pity">Pitié : garanti par le compteur</small>' : "");
  }
  function timing(rar, fast) { var sp = doc.body.classList.contains("boxfast") ? 1 : 1.3, T = { in: Math.round(420 * sp), shake: Math.round([900, 1100, 1400, 1700, 2100][rar] * sp), open: Math.round([420, 450, 520, 600, 700][rar] * sp) }; if (fast) { T.in = Math.round(240 * sp); T.shake = Math.round(T.shake * 0.5); T.open = Math.round(T.open * 0.7); } return T; }
  function speedBtn() { return { k: "speed", t: "Vitesse : " + (doc.body.classList.contains("boxfast") ? "rapide" : "normale"), cls: "ghost" }; }
  function playItem(i) {
    if (!run) return; clearTimers(); run.i = i; var x = run.res.items[i], b = X.box(run.res.box), st = stage(), fast = run.res.n > 1, T = timing(x.rar, fast);
    $("bfxRecap").hidden = true; st.hidden = false; st.dataset.rar = x.rar; st.dataset.fx = run.fxIdx === i ? "1" : "0"; st.style.setProperty("--rc", D.RCOL[x.rar]); st.style.setProperty("--bc", b.col); st.style.setProperty("--shd", T.shake + "ms"); st.style.setProperty("--opd", T.open + "ms");
    st.querySelector(".bfx-boxw").innerHTML = boxArt(b.id, b.col, "bx-live"); st.querySelector(".bfx-parts").innerHTML = particles(x.rar); $("bfxCard").innerHTML = cardHtml(x, true);
    $("bfxCount").textContent = run.res.n > 1 ? "Objet " + (i + 1) + " / " + run.res.n : b.name;
    btns([{ k: "skip", t: "Passer", cls: "ghost" }, speedBtn()]); $("bfxLive").textContent = "";
    if (!motionOn()) { reveal(true); return; }
    setPhase("in"); BL.audio.sfx("select");
    later(T.in, function () { setPhase("shake"); BL.audio.sfx("click"); });
    later(T.in + T.shake, function () { setPhase("open"); BL.audio.sfx("vault"); if (x.rar >= 3 && run.fxIdx === i) BL.audio.sfx("unlock"); });
    later(T.in + T.shake + T.open, function () { reveal(false); });
  }
  function reveal(quiet) {
    if (!run) return; clearTimers(); var x = run.res.items[run.i], last = run.i >= run.res.n - 1; setPhase("reveal"); run.shown = true;
    if (!quiet) BL.audio.sfx(x.rar >= 4 ? "levelup" : x.rar >= 3 ? "promo" : x.rar >= 2 ? "loot" : "success");
    $("bfxLive").textContent = cap(D.RAR[x.rar]) + " : " + BL.equip.item(x.id).name + (x.dup ? " (doublon)" : x.full ? " (Arsenal plein)" : " (nouveau)");
    if (run.res.n === 1) { final(); return; }
    btns(last ? [{ k: "recap", t: "Récapitulatif", cls: "can" }] : [{ k: "next", t: "Suivant", cls: "can" }, { k: "skip", t: "Passer", cls: "ghost" }]);
  }
  function recap() {
    if (!run) return; clearTimers(); var r = run.res, tot = 0, dups = 0; r.items.forEach(function (x) { tot += x.money; if (x.dup || x.full) dups++; });
    stage().hidden = true; var rc = $("bfxRecap"); rc.hidden = false;
    rc.innerHTML = '<h2>Récapitulatif · ' + esc(X.box(r.box).name) + " ×" + r.n + '</h2><div class="bfx-grid">' + r.items.map(function (x) { var it = BL.equip.item(x.id); return '<div class="bfx-mini" style="--rc:' + D.RCOL[x.rar] + '">' + icon(it) + "<b>" + esc(it.name) + "</b><small>" + cap(D.RAR[x.rar]) + "</small><em>" + (x.dup ? "Doublon +" + u.money(x.money) : x.full ? "Arsenal plein +" + u.money(x.money) : "Nouveau") + "</em></div>"; }).join("")
      + "</div><p>" + (r.n - dups) + " ajouté" + (r.n - dups > 1 ? "s" : "") + " à l’Arsenal" + (dups ? " · " + dups + " converti" + (dups > 1 ? "s" : "") + " en argent (+" + u.money(tot) + ")" : "") + ".</p>";
    $("bfxCount").textContent = ""; $("bfxLive").textContent = "Récapitulatif : " + r.items.length + " objets."; final();
  }
  function final() {
    run.final = true; clearTimers(); var r = run.res, b = X.box(r.box), again = X.canOpen(S, r.box, r.n);
    btns([{ k: "close", t: "Fermer", cls: "can" }, { k: "again", t: again ? "Rouvrir ×" + r.n + " · " + b.cost * r.n : "Pas assez de lingots", dis: !again, cls: "ghost" }]);
  }
  function toEnd() { if (!run || run.final) return; if (run.res.n > 1) recap(); else reveal(true); }
  function close() {
    if (!run) return; clearTimers(); run = null; var d = $("boxfx"); d.hidden = true; $("app").inert = false; doc.body.classList.remove("inbox"); var o = opener; opener = null;
    vRender(true); if (BL.shopUI) BL.shopUI.render(); var t = o && doc.body.contains(o) ? o : doc.querySelector('#v_boxes [data-act="bopen"]'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {}
  }
  function start(res, from) {
    build(); if (!res) return; clearTimers(); var bi = -1; res.items.forEach(function (x, q) { if (x.rar >= 1 && (bi < 0 || x.rar > res.items[bi].rar)) bi = q; }); run = { res: res, i: 0, t: [], final: false, shown: false, fxIdx: bi }; opener = from || opener; var d = $("boxfx"); d.hidden = false; $("app").inert = true; doc.body.classList.add("inbox");
    $("bfxRecap").hidden = true; playItem(0);
  }
  function request(id, n, from) {
    if (run) return null; var res = h.boxOpen(id, n); if (!res) return null; vRender(true); if (BL.shopUI) BL.shopUI.render(); start(res, from); return res;
  }
  function onClick(e) {
    var b = e.target.closest("[data-b]"); if (!b || b.disabled || !run) return; var k = b.dataset.b;
    if (k === "speed") { h.setting("boxspeed", doc.body.classList.contains("boxfast") ? "normal" : "fast"); b.textContent = speedBtn().t; } else if (k === "skip") toEnd(); else if (k === "next") playItem(run.i + 1); else if (k === "recap") recap(); else if (k === "close") close();
    else if (k === "again") { var id = run.res.box, n = run.res.n, from = opener; run = null; $("boxfx").hidden = true; request(id, n, from); if (!run) { $("app").inert = false; doc.body.classList.remove("inbox"); } }
  }
  function onKey(e) {
    if (!run) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (run.final) close(); else toEnd(); return; }
    if (e.key === "Tab") { var f = [].slice.call($("boxfx").querySelectorAll("button:not([disabled])")); if (!f.length) { e.preventDefault(); return; } var i = f.indexOf(doc.activeElement); if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  }
  function init(handlers, util) { X = BL.boxes; D = BL.data.equip; DB = BL.data.boxes; h = handlers; u = util; build(); }
  BL.boxesUI = { update: update, render: function () { vRender(true); }, preview: preview, closePreview: pvClose, init: init, html: html, request: request, start: start, close: close, boxArt: boxArt, _dbg: function () { return run ? { open: true, i: run.i, n: run.res.n, phase: stage().dataset.phase, rar: +stage().dataset.rar, final: !!run.final, box: run.res.box } : { open: false }; } };
})(window);
