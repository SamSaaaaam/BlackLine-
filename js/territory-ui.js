/* Territoires : interface (carte SVG, panneau de détail, factions, conflit). Le DOM est construit une fois, puis mis à jour. */
(function (root) {
  var BL = root.BL = root.BL || {}, NS = "http://www.w3.org/2000/svg";
  var T, TD, P, h, u, ui = { sel: null, prev: null, svg: {}, fac: {}, newAvail: false, first: true };
  var LABEL = { locked: "Hors de portée", available: "Disponible", controlled: "Contrôlé", contested: "Contesté" };
  function $(id) { return document.getElementById(id); }
  function S(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function pts(poly) { return poly.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }
  function centroid(poly) {
    var a = 0, cx = 0, cy = 0, n = poly.length, i, p, q, f;
    for (i = 0; i < n; i++) { p = poly[i]; q = poly[(i + 1) % n]; f = p[0] * q[1] - q[0] * p[1]; a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function inset(poly, k) { var c = centroid(poly); return poly.map(function (p) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; }); }
  function pct(x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }
  function btn(parent, id) {
    var b = u.el("button", "btn", '<span class="bt"></span><small class="bs"></small>'); b.id = id; parent.appendChild(b);
    b.t = b.firstChild; b.s = b.lastChild; return b;
  }
  function setBtn(b, title, sub, off, can) {
    u.set(b.t, title); u.set(b.s, sub || ""); b.s.hidden = !sub; if (b.disabled !== off) b.disabled = off; b.classList.toggle("can", !!can && !off);
  }
  function react(b, ok) { if (ok === false) return; b.classList.remove("ok"); void b.offsetWidth; b.classList.add("ok"); }

  function buildMap() {
    var box = $("map"), svg = S("svg", { viewBox: "0 0 800 520", role: "group", "aria-label": "Carte de " + TD.city, "class": "tmap" });
    var defs = S("defs", {}, svg), pat = S("pattern", { id: "tgrid", width: 40, height: 40, patternUnits: "userSpaceOnUse" }, defs);
    S("path", { d: "M40 0H0V40", fill: "none", stroke: "rgba(255,255,255,.035)", "stroke-width": 1 }, pat);
    S("rect", { width: 800, height: 520, "class": "t-bg" }, svg); S("rect", { width: 800, height: 520, fill: "url(#tgrid)" }, svg);
    S("polygon", { points: "480,468 790,452 800,520 470,520", "class": "t-water" }, svg);
    S("text", { x: 640, y: 500, "class": "t-sea", "text-anchor": "middle" }, svg).textContent = "Baie de " + TD.city;
    TD.districts.forEach(function (d) {
      var g = S("g", { "class": "dist st-locked", tabindex: 0, role: "button", "data-id": d.id }, svg), c = centroid(d.poly), pips = [], i;
      S("title", {}, g).textContent = d.name;
      S("polygon", { points: pts(d.poly), "class": "d-fill" }, g); S("polygon", { points: pts(inset(d.poly, 0.93)), "class": "d-in" }, g);
      S("text", { x: c[0], y: c[1] - 6, "class": "d-name", "text-anchor": "middle" }, g).textContent = d.short;
      var stx = S("text", { x: c[0], y: c[1] + 10, "class": "d-st", "text-anchor": "middle" }, g);
      for (i = 0; i < P.maxControl; i++) pips.push(S("circle", { cx: c[0] + (i - (P.maxControl - 1) / 2) * 11, cy: c[1] + 24, r: 3.2, "class": "pip" }, g));
      var em = BL.factions.info(d.holder), emg = S("g", { "class": "d-emb" }, g); emg.innerHTML = BL.portraits.emblem(em.shape, em.color, { cls: "emb" }); var es = emg.firstChild; es.setAttribute("x", c[0] - 8); es.setAttribute("y", c[1] - 34); es.setAttribute("width", 16); es.setAttribute("height", 17);
      var select = function () { choose(d.id); };
      g.addEventListener("click", select); g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); } });
      ui.svg[d.id] = { g: g, st: stx, pips: pips, c: c, state: "" };
    });
    box.appendChild(svg); ui.map = svg;
  }
  function choose(id) { ui.sel = id; if (window.matchMedia && matchMedia("(max-width:900px)").matches && $("dpanel") && $("dpanel").scrollIntoView && !$("v_terr").hidden) setTimeout(function () { $("dpanel").scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 30); for (var k in ui.svg) ui.svg[k].g.classList.toggle("sel", k === id); ui.sig = null; if (ui.s) panel(ui.s); }
  function ring(id) {
    var o = ui.svg[id], r = S("circle", { cx: o.c[0], cy: o.c[1], r: 10, "class": "cap-ring" }, ui.map);
    o.g.classList.add("flash"); setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); o.g.classList.remove("flash"); }, 1300);
  }

  function buildPanel() {
    var b = $("dBody");
    b.innerHTML = '<div class="dh"><div><div class="nm" id="dName"></div><div class="ds" id="dHolder"></div></div><span class="badge" id="dState"></span></div><p class="ds" id="dDesc"></p>' +
      '<dl class="dl" id="dStats"></dl><div class="dsec"><div class="muted">Bonus</div><ul class="log" id="dBonus"></ul></div><div class="dsec" id="dReqBox"><div class="muted">Conditions</div><p class="miss" id="dMiss"></p><ul class="req" id="dReq"></ul></div><div class="acts" id="dActs"></div>';
    var st = $("dStats"); ui.rows = [];
    for (var i = 0; i < 5; i++) { var dt = document.createElement("dt"), dd = document.createElement("dd"); st.appendChild(dt); st.appendChild(dd); ui.rows.push([dt, dd]); }
    var a = $("dActs");
    ui.bNeg = btn(a, "bNeg"); ui.bForce = btn(a, "bForce"); ui.bInv = btn(a, "bInv"); ui.bImp = [btn(a, "bImp0"), btn(a, "bImp1")];
    ui.bNeg.onclick = function () { react(ui.bNeg, h.take(ui.sel, "negotiate")); };
    ui.bForce.onclick = function () { react(ui.bForce, h.take(ui.sel, "force")); };
    ui.bInv.onclick = function () { react(ui.bInv, h.invest(ui.sel)); };
    ui.bImp.forEach(function (x, i) { x.onclick = function () { react(x, h.imp(ui.sel, TD.improvements[i].slot)); }; });
    ["bDef", "bTruce"].forEach(function (id) { var x = $(id); x.innerHTML = '<span class="bt"></span><small class="bs"></small>'; x.t = x.firstChild; x.s = x.lastChild; });
    $("bDef").onclick = function () { react($("bDef"), h.defend()); }; $("bTruce").onclick = function () { react($("bTruce"), h.truce()); };
  }
  function cur(s, d, b) {
    var L = T.lv(s, d.id), v = b.per * L * (T.hasImp(s, d.id, "boost") ? P.impBoost : 1);
    return (b.type === "rep" || b.type === "infl") ? "+" + (Math.round(v * 10) / 10) : "+" + pct(v);
  }
  function panel(s) {
    var d = ui.sel && T.dist(ui.sel); $("dEmpty").hidden = !!d; $("dBody").hidden = !d; if (!d) return;
    var stt = T.state(s, d), L = T.lv(s, d.id), own = L > 0, f = T.faction(d.holder), i;
    u.set($("dName"), d.name); u.set($("dDesc"), d.desc); u.set($("dState"), LABEL[stt]); $("dState").className = "badge b-" + stt;
    u.set($("dHolder"), own ? "Sous ton contrôle · niveau " + L + " / " + P.maxControl : "Tenu par " + f.name);
    var rows = [["Valeur stratégique", d.strategic + " / 5"], ["Rivalité", d.rivalry + " / 5"]];
    if (own) rows.push(["Contrôle", L + " / " + P.maxControl], ["Revenus apportés", "+" + u.money(T.contribution(s, d.id)) + "/s"], ["Défense", String(Math.round(T.defense(s, d)))]);
    else rows.push(["Coût de déblocage", u.money(d.cost)], ["Chance si imposé", pct(T.takeChance(s, d))], ["Puissance de " + f.name, String(Math.round(T.holderPower(s, d)))]);
    rows.forEach(function (r, k) { u.set(ui.rows[k][0], r[0]); u.set(ui.rows[k][1], r[1]); }); for (i = rows.length; i < 5; i++) { u.set(ui.rows[i][0], ""); u.set(ui.rows[i][1], ""); }
    var bs = d.bonus.map(function (b) { return T.bonusText(b) + (own ? " (actuel " + cur(s, d, b) + ")" : ""); }); bs.push("Influence +" + (Math.round(d.strategic * P.inflPerStrategic * 10) / 10) + " par niveau (valeur stratégique)");
    fill($("dBonus"), bs);
    $("dReqBox").hidden = own;
    if (!own) { var ms = T.missing(s, d); u.set($("dMiss"), stt === "available" ? "Tout est réuni : tu peux agir." : "Il te manque : " + ms.join(" · ")); $("dMiss").className = "miss " + (stt === "available" ? "ok" : "ko"); var rl = T.reqList(s, d); fill($("dReq"), rl.map(function (r) { return (r.ok ? "✓ " : "✗ ") + r.label + (r.ok || r.need === undefined ? "" : " (" + Math.floor(r.cur) + " / " + r.need + ")"); }), rl.map(function (r) { return r.ok ? "ok" : "ko"; })); }
    var av = stt === "available", nc = T.takeCost(d, "negotiate", s), fc = T.takeCost(d, "force", s);
    ui.bNeg.hidden = ui.bForce.hidden = !av; ui.bInv.hidden = !own; ui.bImp.forEach(function (x) { x.hidden = !own; });
    if (av) {
      setBtn(ui.bNeg, "Négocier · " + u.money(nc), "Réussite certaine, prix plein", s.money + 1e-9 < nc, true);
      setBtn(ui.bForce, "Imposer · " + u.money(fc), "Moins cher, " + pct(T.takeChance(s, d)) + " de réussite, la faction réagit en cas d’échec", s.money + 1e-9 < fc, true);
    }
    if (own) {
      var max = L >= P.maxControl, ic = max ? 0 : T.investCost(d, L);
      setBtn(ui.bInv, max ? "Contrôle maximal" : "Renforcer l’influence · " + u.money(ic), max ? "" : "Niveau " + (L + 1) + " : bonus et défense accrus", max || s.money + 1e-9 < ic, true);
      TD.improvements.forEach(function (im, k) {
        var b = ui.bImp[k], got = T.hasImp(s, d.id, im.slot), c = T.impCost(d, im), low = L < im.req;
        setBtn(b, got ? "Acquis : " + d.imps[k] : d.imps[k] + (low ? "" : " · " + u.money(c)), got ? im.text : low ? im.text + " (contrôle " + im.req + " requis)" : im.text, got || low || s.money + 1e-9 < c, true);
      });
    }
  }
  function fill(ul, lines, cls) {
    var sg = lines.join("|") + (cls || []).join(""); if (ul.dataset.sg === sg) return; ul.dataset.sg = sg; ul.innerHTML = "";
    lines.forEach(function (t, i) { var li = document.createElement("li"); li.textContent = t; if (cls && cls[i]) li.className = cls[i]; ul.appendChild(li); });
  }
  var ACT = [["gift", "Offrir un tribut"], ["truce", "Demander une trêve"], ["ally", "Proposer une alliance"], ["press", "Mettre la pression"]];
  function buildFactions() {
    var F = BL.factions;
    TD.factions.forEach(function (f) {
      var fi = F.info(f.id);
      var c = u.el("div", "card fac", '<div class="fhd"><div class="fem">' + BL.portraits.emblem(fi.shape, fi.color, { label: "Emblème " + f.name }) + '</div><div class="an"><div class="nm">' + f.name + '</div><div class="ds">' + f.trait + '</div><div class="ds mt">« ' + fi.motto + ' »</div></div><span class="badge fs"></span></div>' +
        '<div class="evo"><div class="fp"></div><div class="meter"><i></i></div><div class="rrow"><span>Relation avec toi</span><b class="rv"></b></div><div class="relbar"><i></i></div><div class="fh"></div><div class="fa muted"></div></div><div class="acts dip"></div>');
      c.style.setProperty("--fc", fi.color);
      var acts = c.querySelector(".dip"), o = { c: c, p: c.querySelector(".fp"), bar: c.querySelector(".meter i"), h: c.querySelector(".fh"), s: c.querySelector(".fs"), rv: c.querySelector(".rv"), rb: c.querySelector(".relbar i"), fa: c.querySelector(".fa"), b: {} };
      ACT.forEach(function (a) { var b = btn(acts, a[0]); b.removeAttribute("id"); b.dataset.act = a[0]; b.onclick = function () { react(b, h.dip(f.id, a[0])); }; o.b[a[0]] = b; });
      $("factions").appendChild(c); ui.fac[f.id] = o;
    });
  }
  function updateFactions(s, max) {
    var F = BL.factions;
    TD.factions.forEach(function (fc) {
      var o = ui.fac[fc.id], st = s.fac[fc.id], tr = Math.max(0, Math.ceil(st.truce - s.t)), al = Math.max(0, Math.ceil(st.ally - s.t)), rel = F.rel(s, fc.id), stt = F.status(s, fc.id);
      var held = TD.districts.filter(function (d) { return d.holder === fc.id && T.lv(s, d.id) === 0; }).map(function (d) { return d.short; });
      u.set(o.p, "Puissance " + Math.round(st.power) + " · agressivité " + fc.aggression + " / 5"); BL.bar(o.bar, Math.min(100, st.power / max * 100));
      u.set(o.s, stt.name); o.s.className = "badge fs r-" + stt.id; u.set(o.rv, (rel > 0 ? "+" : "") + Math.round(rel));
      BL.bar(o.rb, Math.abs(rel)); o.rb.className = rel >= 0 ? "pos" : "neg";
      u.set(o.h, "Quartiers tenus : " + (held.length ? held.join(", ") : "aucun") + (tr ? " · trêve " + tr + " s" : "") + (al ? " · alliance " + Math.floor(al / 60) + " min " + (al % 60) + " s" : ""));
      u.set(o.fa, F.allied(s, fc.id) ? "Alliée : ne t’attaque pas, ses quartiers sont protégés." : "Force de ses attaques ×" + String(Math.round(F.atkMul(s, fc.id) * 100) / 100).replace(".", ",") + " · fréquence ×" + String(Math.round(F.weight(s, fc.id) * 100) / 100).replace(".", ","));
      ACT.forEach(function (a) {
        var b = o.b[a[0]], why = F.blocked(s, fc.id, a[0]), c = F.cost(s, a[0]), ch = F.chance(s, fc.id, a[0]);
        setBtn(b, a[1] + " · " + u.money(c), why || (a[0] === "gift" ? "Relation +" + Math.round(P2().gift.rel * (1 + (BL.crew ? BL.crew.agg(s).relGain : 0))) : Math.round(ch * 100) + " % de réussite"), !!why || s.money + 1e-9 < c, true);
      });
    });
  }
  function P2() { return BL.data.diplomacy.params; }
  function tab(id) {
    ["q", "f", "r"].forEach(function (k) { var on = k === id; $("tt_" + k).hidden = !on; var b = document.querySelector('.stab[data-tt="' + k + '"]'); b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    ui.tab = id; try { sessionStorage.setItem("bl.tt", id); } catch (e) {}
  }
  /* Rivalités : où ça se joue (quartiers voisins des tiens), état des relations, bilan des conflits. */
  function updateRivals(s) {
    var F = BL.factions, c = s.terr.conflict, mine = T.controlled(s).map(function (d) { return d.id; }), lines = [], sig;
    TD.factions.forEach(function (f) {
      var fr = [], i;
      TD.districts.forEach(function (d) { if (d.holder === f.id && T.lv(s, d.id) === 0 && d.neighbors.some(function (n) { return mine.indexOf(n) >= 0; })) fr.push(d.short); });
      var st = F.status(s, f.id), tr = Math.max(0, Math.ceil(s.fac[f.id].truce - s.t));
      var rx = s.rivals && s.rivals.st[f.id], fd = BL.rivals && BL.rivals.front(s, f.id); lines.push({ f: f, fr: fr, st: st, tr: tr, hit: !!(c && c.fid === f.id), rel: Math.round(F.rel(s, f.id)), pp: fd && rx ? Math.round(rx.p) : -1, pd: fd ? fd.short : "" });
    });
    sig = JSON.stringify([lines.map(function (x) { return [x.f.id, x.fr, x.st.id, x.tr > 0, x.hit, x.rel, x.pp]; }), s.terr.won, s.terr.lost, mine.length, !!c]);
    var box = $("rivals"); if (box.dataset.sg === sig) return; box.dataset.sg = sig; box.innerHTML = "";
    var top = u.el("div", "card", '<div class="nm">Bilan des conflits</div><p class="ds">Défenses réussies : <b>' + s.terr.won + "</b> · quartiers touchés : <b>" + s.terr.lost + "</b>. " + (mine.length ? (c ? "Une attaque est en cours : réagis depuis l’onglet Quartiers." : "Aucune attaque en cours : les factions qui bordent tes quartiers peuvent frapper.") : "Tu ne tiens aucun quartier : personne ne peut t’attaquer pour l’instant.") + "</p>");
    box.appendChild(top);
    lines.forEach(function (x) {
      var el = u.el("div", "card riv" + (x.hit ? " hit" : ""), '<div class="nm">' + x.f.name + ' <span class="badge r-' + x.st.id + '">' + x.st.name + "</span></div>" +
        '<p class="ds">' + (x.hit ? "Elle t’attaque en ce moment. " : "") + (x.fr.length ? "Front commun : " + x.fr.join(", ") + "." : "Aucun quartier à la frontière des tiens.") + (x.tr ? " Trêve en cours." : "") + " Relation " + (x.rel > 0 ? "+" : "") + x.rel + "." + (x.pp >= 0 && !x.tr ? " Pression sur " + x.pd + " : " + x.pp + " % (" + (x.pp >= 70 ? "menace" : x.pp >= 35 ? "tension" : "calme") + ")." : "") + "</p>");
      el.style.setProperty("--fc", BL.factions.info(x.f.id).color); box.appendChild(el);
    });
  }
  function init(handlers, util) {
    T = BL.territory; TD = BL.data.territory; P = TD.params; h = handlers; u = util;
    buildMap(); buildPanel(); buildFactions();
    Array.prototype.forEach.call(document.querySelectorAll(".stab"), function (b) { b.onclick = function () { tab(b.dataset.tt); }; });
    var t0 = "q"; try { t0 = sessionStorage.getItem("bl.tt") || "q"; } catch (e) {} tab(["q", "f", "r"].indexOf(t0) >= 0 ? t0 : "q");
  }
  function update(s) {
    ui.s = s; var fresh = [], vis = !$("v_terr").hidden, k, n = 0, any = false, max = 1;
    TD.districts.forEach(function (d) {
      var o = ui.svg[d.id], stt = T.state(s, d), L = T.lv(s, d.id), was = ui.prev && ui.prev[d.id];
      if (o.state !== stt) {
        o.g.classList.remove("st-" + o.state); o.g.classList.add("st-" + stt); o.state = stt; u.set(o.st, LABEL[stt]);
        if (was && !ui.first) {
          if (stt === "available" && was === "locked") { fresh.push(d.name); ui.newAvail = true; }
          if ((stt === "controlled" || stt === "contested") && was !== "controlled" && was !== "contested") ring(d.id);
        }
      }
      if (o.lvl !== L) { o.lvl = L; o.pips.forEach(function (p, i) { p.classList.toggle("on", i < L); }); }
      if (stt === "available") any = true; if (L) n++;
    });
    if (fresh.length) u.toast((fresh.length > 1 ? "Nouveaux quartiers disponibles : " : "Nouveau quartier disponible : ") + fresh.join(", ") + ".", "ok");
    ui.prev = {}; TD.districts.forEach(function (d) { ui.prev[d.id] = ui.svg[d.id].state; }); ui.first = false;
    if (vis) ui.newAvail = false;
    var nb = document.querySelector('[data-view="terr"]'), c = s.terr.conflict, dot = nb.querySelector(".dot");
    if ((c || ui.newAvail) && !dot) { dot = document.createElement("i"); dot.className = "dot"; nb.appendChild(dot); } else if (!c && !ui.newAvail && dot) nb.removeChild(dot);
    if (dot) dot.classList.toggle("alert", !!c);
    var avN = TD.districts.filter(function (d) { return T.state(s, d) === "available"; }).length;
    u.set($("ttQ"), avN ? String(avN) : ""); u.set($("ttR"), c ? "!" : ""); $("ttR").classList.toggle("alert", !!c);
    if (!vis) return;
    u.set($("tSum"), n + " / " + TD.districts.length + " quartiers contrôlés");
    var cb = $("cflt"); cb.hidden = !c;
    if (c) {
      var d = T.dist(c.did), f = T.faction(c.fid), p = T.defendChance(s), dc = T.defendCost(d), tc = T.truceCost(d, s);
      u.set($("cText"), f.name + " attaque : " + d.name + ". Force d’attaque " + Math.round(c.atk) + ", ta défense " + Math.round(T.defense(s, d)) + ". Sans décision, tu perds un niveau de contrôle dans " + Math.max(0, Math.ceil(c.until - s.t)) + " s.");
      setBtn($("bDef"), "Défendre · " + u.money(dc), pct(p) + " de réussite", s.money + 1e-9 < dc, true);
      setBtn($("bTruce"), "Négocier · " + u.money(tc), "Trêve garantie de " + Math.round(P.conflict.truce / 60) + " min", s.money + 1e-9 < tc, true);
    }
    panel(s);
    TD.factions.forEach(function (fc) { max = Math.max(max, s.fac[fc.id].power); });
    updateFactions(s, max); updateRivals(s);
  }
  /* Lignes affichées dans « Déblocages à venir » : les deux prochains quartiers verrouillés. */
  function unlockLines(s) {
    var out = [];
    TD.districts.slice().sort(function (a, b) { return a.cost - b.cost; }).forEach(function (d) {
      if (out.length >= 2 || T.state(s, d) !== "locked") return;
      var miss = T.reqList(s, d).filter(function (r) { return !r.ok; }).map(function (r) { return r.need === undefined ? r.label : r.label + " (" + Math.floor(r.cur) + " / " + r.need + ")"; });
      out.push("Quartier " + d.name + " : " + miss.join(", "));
    });
    return out;
  }
  BL.terrUI = { tab: tab, init: init, update: update, unlockLines: unlockLines, select: choose };
})(window);
