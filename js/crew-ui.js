/* Équipe : interface (roster, portraits, comparaison, effets de l'équipe). DOM construit une fois, puis mis à jour. */
(function (root) {
  var BL = root.BL = root.BL || {}, C, CD, P, h, u, ui = { cards: {}, eff: {}, cmp: [], prev: null, first: true, newAvail: false, cmpSig: null };
  var STATE = { locked: "Verrouillé", available: "Disponible", active: "Actif", reserve: "Réserve" };
  var STAR = "M12 2l3 7 7 .6-5.4 4.7 1.7 7.2L12 17.8 5.7 21.5l1.7-7.2L2 9.6 9 9z";
  function stars(n) { var o = ""; for (var i = 1; i <= 5; i++) o += '<svg viewBox="0 0 24 24" class="star' + (i <= n ? " on" : "") + '" aria-hidden="true"><path d="' + STAR + '"/></svg>'; return '<span class="stars" role="img" aria-label="' + n + ' étoile' + (n > 1 ? "s" : "") + ' sur 5">' + o + "</span>"; }
  function pct(x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }
  function n1(x) { return String(Math.round(x * 10) / 10).replace(".", ","); }
  function btn(parent, cls) { var b = u.el("button", "btn " + (cls || ""), '<span class="bt"></span><small class="bs"></small>'); parent.appendChild(b); b.t = b.firstChild; b.s = b.lastChild; return b; }
  function setBtn(b, title, sub, off, can) { u.set(b.t, title); u.set(b.s, sub || ""); b.s.hidden = !sub; if (b.disabled !== off) b.disabled = off; b.classList.toggle("can", !!can && !off); }
  function react(b, ok) { if (ok === false) return; b.classList.remove("ok"); void b.offsetWidth; b.classList.add("ok"); }
  function fill(ul, lines, cls) {
    var sg = lines.join("|") + (cls || []).join(""); if (ul.dataset.sg === sg) return; ul.dataset.sg = sg; ul.innerHTML = "";
    lines.forEach(function (t, i) { var li = document.createElement("li"); li.textContent = t; if (cls && cls[i]) li.className = cls[i]; ul.appendChild(li); });
  }

  function buildCard(m) {
    var role = CD.roles[m.role], tr = C.trait(m);
    var c = u.el("article", "card chr", '<div class="pic"><div class="frame rar' + m.rarity + '" style="--rc:' + role.color + '">' + BL.portraits.portrait(m.look, { label: "Portrait de " + m.name, id: m.id }) + '</div>' + stars(m.rarity) + '</div>' +
      '<div class="cb"><div class="chh"><div class="an"><div class="nm">' + m.name + '</div><div class="ds">« ' + m.nick + ' »</div></div><span class="badge" style="color:' + role.color + ';border-color:' + role.color + '">' + role.name + '</span></div>' +
      '<div class="ds spec">' + m.spec + '</div><dl class="sts"></dl>' +
      '<ul class="facts"><li><b>Trait</b> ' + tr.name + ' : ' + tr.text + '</li><li class="pv"></li><li class="up"></li></ul>' +
      '<div class="lvrow"><span class="lvl"></span><span class="meter"><i></i></span><span class="xpt muted"></span></div>' +
      '<ul class="req"></ul><div class="acts"></div></div>');
    var dl = c.querySelector(".sts"), rows = {};
    CD.stats.forEach(function (st) {
      var dt = document.createElement("dt"), bar = u.el("dd", "bar", '<span class="meter"><i></i></span>'), v = u.el("dd", "val"); dt.textContent = st.name; dt.title = st.text; dl.appendChild(dt); dl.appendChild(bar); dl.appendChild(v); rows[st.id] = { bar: bar.querySelector("i"), v: v };
    });
    var acts = c.querySelector(".acts"), o = { c: c, rows: rows, state: "", pv: c.querySelector(".pv"), up: c.querySelector(".up"), row: c.querySelector(".lvrow"), lvl: c.querySelector(".lvl"), xp: c.querySelector(".meter i"), xpt: c.querySelector(".xpt"), req: c.querySelector(".req") };
    o.rcb = u.el("div", "rcbadge", ""); o.rcb.hidden = true; o.rcb.setAttribute("role", "status"); acts.appendChild(o.rcb); o.main = btn(acts, "main"); o.lvlb = btn(acts, "lvb"); o.cmp = btn(acts, "ghost cmpb");
    o.main.onclick = function () { if (Date.now() - (o.rt || 0) < 250) return;   /* double clic sur « Recruter » : le 2e clic ne bascule pas l’équipier fraîchement recruté */
      var st = o.state; if (st === "available") { var r = h.recruit(m.id); react(o.main, r); if (r) { o.rt = Date.now(); o.c.classList.add("justrec"); setTimeout(function () { o.c.classList.remove("justrec"); }, 600); } } else react(o.main, h.toggle(m.id)); if (ui.s) update(ui.s); };
    o.lvlb.onclick = function () { var r = h.levelUp(m.id); react(o.lvlb, r); if (r && ui.s) update(ui.s); };   /* niveau et statistiques affichés tout de suite */
    o.cmp.onclick = function () { toggleCmp(m.id); };
    $r.appendChild(c); ui.cards[m.id] = o;
  }
  var $r;
  function toggleCmp(id) {
    var i = ui.cmp.indexOf(id); if (i >= 0) ui.cmp.splice(i, 1); else { ui.cmp.push(id); if (ui.cmp.length > 3) ui.cmp.shift(); }
    var was = !u.$("cmp").hidden; ui.cmpSig = null; if (ui.s) update(ui.s);
    if (!was && ui.cmp.length === 1 && u.$("cmp").scrollIntoView) { try { u.$("cmp").scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }
  }
  function buildEffects() {
    var box = u.$("cEff");
    CD.stats.forEach(function (st) {
      var r = u.el("div", "eff", '<div class="en"><b></b><span class="muted"></span></div><div class="meter"><i></i></div><div class="et"></div>'); r.title = st.text; box.appendChild(r);
      ui.eff[st.id] = { n: r.querySelector("b"), sc: r.querySelector(".en span"), bar: r.querySelector("i"), t: r.querySelector(".et") }; ui.eff[st.id].n.textContent = st.name;
    });
  }
  function effText(id, a) {
    if (id === "gest") return "Entretien des activités −" + pct(a.upkeep);
    if (id === "neg") return "Prix des quartiers et des trêves −" + pct(a.terrCost) + " · trêve +" + Math.round(a.negChance * 100) + " pts";
    if (id === "strat") return "Imposer +" + Math.round(a.force * 100) + " pts · défense des quartiers +" + pct(a.def);
    if (id === "fin") return "Revenus +" + pct(a.inc) + (Object.keys(a.act).length ? " (plus bonus ciblés)" : "");
    if (id === "prot") return "Pertes d’événements −" + pct(a.loss) + " · attaques −" + pct(a.atk);
    return "Gains de relation +" + pct(a.relGain) + " · alliance +" + Math.round(a.chance * 100) + " pts";
  }

  function renderCmp(s) {
    var box = u.$("cmp"); box.hidden = ui.cmp.length < 1; if (!ui.cmp.length) { ui.cmpSig = null; return; }
    var sig = ui.cmp.map(function (id) { return id + ":" + C.lvl(s, id) + ":" + C.state(s, C.get(id)); }).join("|"); if (sig === ui.cmpSig) return; ui.cmpSig = sig;
    var ms = ui.cmp.map(C.get), cols = ms.length + 1, g = '<div class="cg" style="grid-template-columns:130px repeat(' + ms.length + ',minmax(0,1fr))">';
    var eff = function (m, st) { return C.effStat(s, m.id, st); }, cell = function (x, cls) { return '<div class="cc ' + (cls || "") + '">' + x + "</div>"; };
    g += cell("", "ch");
    ms.forEach(function (m) { g += cell('<div class="cp">' + BL.portraits.portrait(m.look, { label: m.name, id: m.id }) + '</div><b>' + m.name + '</b><div class="muted">« ' + m.nick + " »</div>", "ch"); });
    var row = function (label, f, best) {
      g += cell(label, "cl"); var vals = ms.map(f);
      ms.forEach(function (m, i) { var v = vals[i], isBest = best && ms.length > 1 && v.n === Math.max.apply(null, vals.map(function (x) { return x.n; })) && vals.filter(function (x) { return x.n === v.n; }).length < vals.length; g += cell(v.h, isBest ? "best" : ""); });
    };
    row("Rôle", function (m) { return { h: CD.roles[m.role].name, n: 0 }; }); row("Rareté", function (m) { return { h: stars(m.rarity), n: m.rarity }; });
    row("Niveau", function (m) { var L = C.lvl(s, m.id) || 1; return { h: "Niv. " + L + " / " + P.maxLevel + (C.has(s, m.id) ? "" : " (non recruté)"), n: L }; });
    CD.stats.forEach(function (st) { row(st.name, function (m) { var v = eff(m, st.id); return { h: '<span class="meter"><i style="transform:scaleX(' + (Math.min(100, v / 16 * 100) / 100).toFixed(3) + ')"></i></span><b>' + n1(v) + "</b>", n: Math.round(v * 100) }; }, true); });
    row("Entretien", function (m) { var L = C.lvl(s, m.id) || 1; var up = m.upkeep * (1 + P.upkeepGrowth * (L - 1)) * (C.trait(m).upkeep || 1); return { h: u.money(up) + "/s", n: -up }; }, true);
    row("Recrutement", function (m) { return { h: C.has(s, m.id) ? "Recruté" : u.money(m.cost), n: -m.cost }; });
    row("Bonus passif", function (m) { return { h: C.passiveText(m, C.passiveScale(s, m.id) || 1), n: 0 }; }); row("Trait", function (m) { var t = C.trait(m); return { h: t.name + " : " + t.text, n: 0 }; });
    g += "</div>"; u.$("cmpBody").innerHTML = g;
  }


  /* ---- C13 : fiche personnage (grande illustration, citation, spécialité, bonus, coût, niveaux, miniatures) ---- */
  var F = null, LOCK = "M12 2a5 5 0 0 0-5 5v3H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z";
  var CROWN = "M3 8l4 4 5-7 5 7 4-4-2 11H5z";
  function icon(d) { return '<svg viewBox="0 0 24 24" class="fxi" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  function selDefault(s) { var f = CD.members.filter(function (m) { return C.state(s, m) === "available"; })[0] || CD.members.filter(function (m) { return C.state(s, m) === "active"; })[0] || CD.members[0]; return f.id; }
  function buildFiche() {
    var box = u.$("cFiche"); if (!box) return;
    box.innerHTML = '<div class="fx"><div class="fxart"></div><div class="fxinfo"><div class="fxhead"><div><h3 class="fxname"></h3><div class="fxnick"></div></div><span class="fxst"></span></div><div class="fxq"></div>' +
      '<div class="fxrow">' + icon("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z") + '<div><small>Spécialité</small><b class="fxrole"></b><span class="fxspec"></span></div></div>' +
      '<div class="fxrow">' + icon("M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z") + '<div><small>Bonus</small><b class="fxbon"></b><span class="fxtr"></span></div></div>' +
      '<div class="fxrow">' + icon("M3 7h18v10H3zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z") + '<div><small>Coût de recrutement</small><b class="fxcost"></b><span class="fxup"></span></div></div>' +
      '<ul class="fxreq" hidden></ul><h4 class="fxlh">Niveaux</h4><ul class="fxlv"></ul><section class="fxbond" aria-label="Caractère et loyauté" hidden></section><div class="fxacts"></div></div></div><div class="fxth" role="group" aria-label="Choisir un personnage"></div>';
    F = { box: box, art: box.querySelector(".fxart"), name: box.querySelector(".fxname"), nick: box.querySelector(".fxnick"), st: box.querySelector(".fxst"), q: box.querySelector(".fxq"), role: box.querySelector(".fxrole"), spec: box.querySelector(".fxspec"), bon: box.querySelector(".fxbon"), tr: box.querySelector(".fxtr"), cost: box.querySelector(".fxcost"), up: box.querySelector(".fxup"), req: box.querySelector(".fxreq"), lv: box.querySelector(".fxlv"), acts: box.querySelector(".fxacts"), th: box.querySelector(".fxth"), thb: {}, sel: null, art_sig: "" };
    F.rcb = u.el("div", "rcbadge", ""); F.rcb.hidden = true; F.rcb.setAttribute("role", "status"); F.acts.appendChild(F.rcb); F.main = btn(F.acts, "main fxmain"); F.lvlb = btn(F.acts, "lvb"); F.cmp = btn(F.acts, "ghost");
    F.main.onclick = function () { var o = ui.cards[F.sel]; if (o) o.main.onclick(); }; F.lvlb.onclick = function () { var o = ui.cards[F.sel]; if (o) o.lvlb.onclick(); }; F.cmp.onclick = function () { toggleCmp(F.sel); };
    CD.members.forEach(function (m) {
      var b = u.el("button", "fxt", '<span class="fxtp"></span><span class="sr-only">' + m.name + "</span>"); b.type = "button"; b.setAttribute("aria-label", m.name + ", " + m.nick); b.setAttribute("aria-pressed", "false"); b.dataset.id = m.id;
      b.firstChild.innerHTML = BL.portraits.portrait(m.look, { label: "", id: m.id, variant: "thumb" }); b.onclick = function () { selectFiche(m.id); }; F.th.appendChild(b); F.thb[m.id] = b;
    });
  }
  function selectFiche(id) { if (!F || !ui.cards[id]) return; F.sel = id; F.art_sig = ""; if (ui.s) updateFiche(ui.s); }
  function artHtml(m) {
    var url = BL.portraits.hasImage(m.id, "full") ? BL.portraits.imageUrl(m.id, "full") : null, foc = (BL.crewImages && BL.crewImages.focus && BL.crewImages.focus[m.id]) || "";
    if (url) return '<img class="fxim" src="' + url + '" alt="Illustration de ' + m.name + '" style="object-position:' + (/YMin/.test(foc) || !foc ? "50% 15%" : "50% 50%") + '">';
    return BL.portraits.portrait(m.look, { label: "Portrait de " + m.name, id: m.id, variant: "full" });
  }
  function updateFiche(s) {
    if (!F) return; if (!F.sel) F.sel = selDefault(s); var m = C.get(F.sel), role = CD.roles[m.role], o = ui.cards[m.id], st = o.state, own = C.has(s, m.id), L = own ? C.lvl(s, m.id) : 1, tr = C.trait(m);
    var asig = m.id + (BL.portraits.hasImage(m.id, "full") ? "i" : "s"); if (F.art_sig !== asig) { F.art_sig = asig; F.art.innerHTML = artHtml(m); F.art.classList.toggle("hasfull", BL.portraits.hasImage(m.id, "full")); F.name.innerHTML = ""; }
    F.box.className = "card fiche st-" + st + " rar" + m.rarity; F.box.style.setProperty("--rc", role.color);
    u.set(F.name, m.name); u.set(F.nick, m.nick); u.set(F.st, STATE[st]); if (F.q.dataset.id !== m.id) { F.q.dataset.id = m.id; F.q.textContent = "« " + ((CD.quotes && CD.quotes[m.id]) || m.bio) + " »"; F.nick.dataset.st = ""; var ss = F.box.querySelector(".fxstars"); if (ss) ss.remove(); F.nick.insertAdjacentHTML("afterend", '<span class="fxstars">' + stars(m.rarity) + "</span>"); }
    u.set(F.role, role.name); u.set(F.spec, m.spec); u.set(F.bon, C.passiveText(m, own ? C.passiveScale(s, m.id) : 1)); u.set(F.tr, "Trait " + tr.name + " : " + tr.text);
    u.set(F.cost, own ? "Recruté" : u.money(m.cost)); u.set(F.up, "Entretien " + u.money(own ? C.upkeepOf(s, m.id) : m.upkeep * (tr.upkeep || 1)) + "/s");
    var reqs = C.reqList(s, m); F.req.hidden = own || st === "available"; if (!F.req.hidden) fill(F.req, reqs.map(function (r) { return (r.ok ? "✓ " : "✗ ") + r.label + (r.ok ? "" : " (" + Math.floor(r.cur) + " / " + r.need + ")"); }), reqs.map(function (r) { return r.ok ? "ok" : "no"; }));
    var lines = [], cls = []; for (var n = 1; n <= P.maxLevel; n++) { lines.push("Niv. " + n + " — " + C.passiveText(m, 1 + P.passiveGrowth * (n - 1)) + " · stats +" + Math.round(P.statGrowth * (n - 1) * 100) + " %"); cls.push(own && n === L ? "cur" : own && n < L ? "done" : n === 1 && !own ? "base" : "lock"); }
    fill(F.lv, lines, cls);
    if (BL.bondsUI) BL.bondsUI.fiche(F.box.querySelector(".fxbond"), s, m.id, own);
    F.rcb.hidden = o.rcb.hidden; F.rcb.textContent = o.rcb.textContent; var ob = o.main; setBtn(F.main, ob.t.textContent, ob.s.hidden ? "" : ob.s.textContent, ob.disabled, ob.classList.contains("can")); var ol = o.lvlb; F.lvlb.hidden = ol.hidden; if (!ol.hidden) setBtn(F.lvlb, ol.t.textContent, ol.s.hidden ? "" : ol.s.textContent, ol.disabled, ol.classList.contains("can")); setBtn(F.cmp, ui.cmp.indexOf(m.id) >= 0 ? "Retirer de la comparaison" : "Comparer", "", false);
    CD.members.forEach(function (x) { var b = F.thb[x.id], on = x.id === F.sel; if (b.classList.contains("on") !== on) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); } var sx = ui.cards[x.id].state; if (b.dataset.st !== sx) { b.dataset.st = sx; b.className = "fxt st-" + sx + (on ? " on" : ""); } });
  }
  function update(s) {
    ui.s = s; var vis = !u.$("v_team").hidden, fresh = [], act = C.active(s), slots = C.slots(s), prevS = ui.prev, nav = document.querySelector('[data-view="team"]');
    C.agg(s);
    CD.members.forEach(function (m) {
      var o = ui.cards[m.id], st = C.state(s, m), was = prevS && prevS[m.id];
      if (o.state !== st) { o.c.classList.remove("st-" + o.state); o.c.classList.add("st-" + st); o.state = st; if (was === "locked" && st === "available" && !ui.first) { fresh.push(m.name); ui.newAvail = true; } }
    });
    ui.prev = {}; CD.members.forEach(function (m) { ui.prev[m.id] = ui.cards[m.id].state; }); ui.first = false;
    if (fresh.length) u.toast((fresh.length > 1 ? "Nouveaux personnages disponibles : " : "Nouveau personnage disponible : ") + fresh.join(", ") + ".", "ok");
    if (vis) ui.newAvail = false;
    var dot = nav.querySelector(".dot"); if (ui.newAvail && !dot) { dot = document.createElement("i"); dot.className = "dot"; nav.appendChild(dot); } else if (!ui.newAvail && dot) nav.removeChild(dot);
    if (!vis) return;
    var a = C.agg(s), up = C.upkeepTotal(s);
    u.set(u.$("cSum"), "Équipe active : " + act.length + " / " + slots + " places · " + C.owned(s).length + " recrues sur " + CD.members.length + " · entretien " + u.money(up) + "/s · prochaine place au niveau d’empire " + (slots >= P.maxSlots ? "—" : (slots - P.baseSlots + 1) * P.slotEvery));
    CD.stats.forEach(function (st) { var e = ui.eff[st.id], f = C.frac(s, st.id); u.set(e.sc, "score " + n1(C.score(s, st.id))); BL.bar(e.bar, f * 100); u.set(e.t, effText(st.id, a)); });
    CD.members.forEach(function (m) {
      var o = ui.cards[m.id], st = o.state, own = C.has(s, m.id), L = own ? C.lvl(s, m.id) : 1, rec = C.rec(s, m.id);
      o.c.classList.toggle("cmp-on", ui.cmp.indexOf(m.id) >= 0);
      CD.stats.forEach(function (x) { var v = C.effStat(s, m.id, x.id); BL.bar(o.rows[x.id].bar, Math.min(100, v / 16 * 100)); u.set(o.rows[x.id].v, n1(v)); o.rows[x.id].v.classList.toggle("peak", m.st[x.id] === Math.max.apply(null, CD.stats.map(function (y) { return m.st[y.id]; }))); });
      u.set(o.pv, "Passif : " + C.passiveText(m, C.passiveScale(s, m.id))); u.set(o.up, "Entretien : " + u.money(own ? C.upkeepOf(s, m.id) : m.upkeep * (C.trait(m).upkeep || 1)) + "/s · recrutement " + u.money(m.cost));
      o.row.hidden = !own; if (own) {
        var need = L >= P.maxLevel ? 0 : C.xpNeed(L); u.set(o.lvl, "Niveau " + L + " / " + P.maxLevel); BL.bar(o.xp, (L >= P.maxLevel ? 100 : Math.min(100, rec.xp / need * 100)));
        u.set(o.xpt, L >= P.maxLevel ? "Maximum" : st === "active" ? Math.floor(rec.xp) + " / " + Math.floor(need) + " xp" : "Gagne de l’expérience quand il est actif");
      }
      var reqs = C.reqList(s, m); o.req.hidden = own || st === "available"; if (!o.req.hidden) fill(o.req, reqs.map(function (r) { return (r.ok ? "✓ " : "✗ ") + r.label + (r.ok ? "" : " (" + Math.floor(r.cur) + " / " + r.need + ")"); }), reqs.map(function (r) { return r.ok ? "ok" : "ko"; }));
      if (st === "locked") setBtn(o.main, "Verrouillé", "", true);
      else if (st === "available") setBtn(o.main, "Recruter · " + u.money(m.cost), "Entre en réserve si aucune place n’est libre", s.money + 1e-9 < m.cost, true);
      else if (st === "active") setBtn(o.main, "Mettre en réserve", "Libère une place et supprime l’entretien", false);
      else setBtn(o.main, "Affecter à l’équipe", act.length >= slots ? "Aucune place libre" : "Entretien " + u.money(C.upkeepOf(s, m.id)) + "/s", act.length >= slots, true);
      o.rcb.hidden = !own; if (own) o.rcb.textContent = "✓ Recruté · " + (st === "active" ? "Actif dans l’équipe" : "En réserve");
      o.lvlb.hidden = !own; if (own) {
        if (L >= P.maxLevel) setBtn(o.lvlb, "Niveau maximal", "", true);
        else if (!C.canLevel(s, m.id)) setBtn(o.lvlb, "Former · " + u.money(C.levelCost(m, L)), "Expérience insuffisante", true);
        else setBtn(o.lvlb, "Former · " + u.money(C.levelCost(m, L)), "Statistiques et bonus augmentent", s.money + 1e-9 < C.levelCost(m, L), true);
      }
      setBtn(o.cmp, ui.cmp.indexOf(m.id) >= 0 ? "Retirer de la comparaison" : "Comparer", "", false);
    });
    renderCmp(s); updateFiche(s);
  }
  function unlockLines(s) {
    var out = []; CD.members.forEach(function (m) { if (out.length >= 2 || C.state(s, m) !== "locked") return; out.push("Équipe, " + m.name + " : " + C.reqList(s, m).filter(function (r) { return !r.ok; }).map(function (r) { return r.label + " (" + Math.floor(r.cur) + " / " + r.need + ")"; }).join(", ")); });
    return out;
  }
  function init(handlers, util) {
    if (BL.portraits && BL.portraits.probe) BL.portraits.probe();
    C = BL.crew; CD = BL.data.crew; P = CD.params; h = handlers; u = util; $r = u.$("roster");
    u.$("cmpClose").onclick = function () { ui.cmp = []; ui.cmpSig = null; if (ui.s) update(ui.s); };
    buildEffects(); CD.members.forEach(buildCard); buildFiche(); if (BL.portraits) BL.portraits.onImage = function () { if (F) { F.art_sig = ""; if (ui.s) updateFiche(ui.s); } };
  }
  BL.crewUI = { init: init, update: update, unlockLines: unlockLines, stars: stars, compare: toggleCmp, select: selectFiche };
})(window);
