/* Interface : DOM construit une fois, puis mises à jour ciblées (les boutons ne sont jamais recréés). */
(function (root) {
  var BL = root.BL = root.BL || {}, D, E, B, h;
  /* Partie 13 · C11 : barres de progression animées en transform (pas en width : pas de recalcul de mise en page). p = 0..100 */
  BL.bar = function (el, p) { if (!el) return; var v = Math.max(0, Math.min(100, +p || 0)) / 100, k = "scaleX(" + v.toFixed(4) + ")"; if (el.style.transform !== k) el.style.transform = k; };
  var ui = { a: {}, u: {}, bd: {}, m: {}, ac: {}, last: null, hist: [], hT: -99, tick: 0, unl: null, aun: null, msc: null, lvl: null, evKey: null, view: "dash", nextId: null, lastIn: {} };
  var IC = { arsenal: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", ops: "M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 100 8 4 4 0 000-8z", dice: "M4 4h16v16H4zM9 9h.01M15 15h.01M12 12h.01", truck: "M1 6h13v10H1zM14 10h5l3 3v3h-8zM6 19h.01M18 19h.01", box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    money: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", trend: "M3 17l6-6 4 4 8-8M15 7h6v6", star: "M12 2l3 7 7 .6-5.4 4.7 1.7 7.2L12 17.8 5.7 21.5l1.7-7.2L2 9.6 9 9z",
    net: "M12 6v6M12 12l-6 6M12 12l6 6M12 3h.01M6 20h.01M18 20h.01", up: "M12 19V5M5 12l7-7 7 7", dash: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
    empire: "M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 11h.01M15 11h.01", map: "M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    team: "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1.5a4 4 0 0 0-3-3.9M16 4.2a3.5 3.5 0 0 1 0 6.6",
    stats: "M4 20V10M10 20V4M16 20v-8M22 20H2", book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6M9 11h6", menu: "M4 6h16M4 12h16M4 18h16", trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4", city: "M3 21V10l5-3v14M8 21V5l7-2v18M15 21v-9l6-2v11M3 21h18", check: "M5 12l5 5 9-10", vault: "M3 5h18v14H3zM3 9h18M9 14h6M12 12v4M7 19v2M17 19v2", bag: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0", story: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5V4.5M8 6h8M8 10h8M8 14h5", box: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9", trophy: "M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 3M16 6h4v2a4 4 0 0 1-4 3M12 14v4M8 20h8", radio: "M3 9h18v11H3zM7 9l10-5M7 14h6M7 17h6M17 15a1.6 1.6 0 1 0 .01 0" };
  /* 4 familles de sections : Ville, Empire, Boutique et QG, Infos. [id, icône, intitulé, phrase d'explication] */
  var NAV = [["map", "city", "Carte", "Ta ville : clique un bâtiment pour l’améliorer, ou un quartier pour le prendre."], ["terr", "map", "Territoires", "Prends des quartiers aux factions rivales et défends-les."],
    ["empire", "empire", "Activités", "Tes activités et leurs bâtiments : améliore-les pour gagner plus d’argent."], ["team", "team", "Équipe", "Recrute des équipiers : ceux qui sont actifs te donnent des bonus."], ["upg", "up", "Bonus permanents", "Achats uniques en $ qui améliorent durablement tes revenus ou tes coûts."], ["arsenal", "arsenal", "Arsenal", "Équipe ton équipe : armes, protections, accessoires et véhicules, à acheter, comparer ou réparer."], ["ops", "ops", "Opérations", "Braquages, convois rivaux et raids de quartier : ton équipe gagne de l’argent et du butin rare."], ["goals", "trophy", "Journal", "Ce qui demande ta décision, ce qui est en cours, et tes objectifs avec leurs récompenses."],
    ["hq", "vault", "Coffre", "Ton quartier général et ton coffre de lingots d’or."], ["shop", "bag", "Boutique", "Dépense tes lingots d’or : décors, fonds de ville et boosts temporaires. Jamais d’argent réel."], ["boxes", "box", "Box", "Ouvre des box payées en lingots : équipement tiré au hasard, taux et contenu affichés."], ["radio", "radio", "Radio", "Choisis la musique du jeu."],
    ["dash", "dash", "Tableau de bord", "Le résumé de ton empire : chiffres clés, conseils, revenus et statistiques."], ["glossary", "book", "Glossaire", "Le sens de chaque mot et de chaque chiffre du jeu."], ["saga", "story", "Histoire", "La trame du parrain : chapitres, monde, personnages et fins."]];
  /* C14 : 4 entrées. Aucune vue supprimée : chaque ancienne vue reste atteignable (sous-onglets) et BL.ui.go(ancienne vue) fonctionne toujours. */
  var GROUPS = BL.nav ? BL.nav.GROUPS : [["empire", "Empire", "empire", "Argent et objectifs", ["dash", "empire", "upg", "goals"]], ["field", "Terrain", "map", "Carte et territoires", ["map", "ops", "terr"]], ["crew", "Équipe", "team", "Équipiers et Arsenal", ["team", "arsenal"]], ["more", "Plus", "vault", "QG, histoire, aide", ["hq", "shop", "boxes", "radio", "saga", "board", "glossary"]]];   /* Partie 19 · B : 4 groupes (js/nav.js) */
  /* Classement en ligne : visible seulement si config-classement.js est rempli (sinon le jeu reste 100 % local, sans cette entrée) */
  if (BL.lb && BL.lb.configured()) NAV.push(["board", "trophy", "Classement", "Compare ton empire aux autres joueurs avec un simple pseudo. Facultatif."]);
  GROUPS.forEach(function (g) { g[4] = g[4].filter(function (v) { return NAV.some(function (n) { return n[0] === v; }); }); });   /* une vue absente (classement non configuré) n'apparaît pas */
  function groupOf(v) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i][4].indexOf(v) >= 0) return GROUPS[i]; return GROUPS[0]; }
  var TIERS = { short: "mShort", mid: "mMid", long: "mLong" };
  function svg(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); e.className = cls || ""; e.innerHTML = html || ""; return e; }
  function set(e, t) { if (e.textContent !== t) e.textContent = t; }
  /* Nombres : forme courte par défaut (950 · 1,2 K · 25 K · 1,4 M · 3,2 Md). Affichage seulement : les valeurs stockées ne changent jamais. */
  var numMode = "short", SUF = ["K", "M", "Md", "Bn", "Bd"];
  function fmt(n) {
    if (!isFinite(n)) return "—"; var neg = n < 0 ? "−" : ""; n = Math.abs(n);
    if (n < 1000) return neg + (n < 10 ? (Math.round(n * 10) / 10).toString().replace(".", ",") : String(Math.floor(n)));
    var i = 0; while (n >= 1000 && i < SUF.length) { n /= 1000; i++; }
    if (numMode === "detailed") return neg + n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0).replace(".", ",") + " " + SUF[i - 1];
    if (n >= 999.5 && i < SUF.length) { n /= 1000; i++; }
    return neg + (n < 10 ? (Math.round(n * 10) / 10).toString().replace(".", ",") : String(Math.round(n))) + " " + SUF[i - 1];
  }
  function exact(n) { return isFinite(n) ? Math.floor(n).toLocaleString("fr-FR") : "—"; }
  function money(n) { return "$" + fmt(n); }
  function tipOld(id, t) { var e = $(id); if (e && ui.tips !== false && e.parentNode.title !== t) e.parentNode.title = t; else if (e && ui.tips === false && e.parentNode.title) e.parentNode.removeAttribute("title"); }
  function num(x) { return String(x).replace(".", ","); }
  function hms(s) { s = Math.floor(s); var a = Math.floor(s / 3600), b = Math.floor(s % 3600 / 60); return (a ? a + " h " : "") + b + " min " + (s % 60) + " s"; }
  function actName(id) { return E.find(D.activities, id).name; }
  function react(c, b, ok) { if (ok === false) return; c.classList.remove("pulse"); void c.offsetWidth; c.classList.add("pulse"); b.classList.remove("ok"); void b.offsetWidth; b.classList.add("ok"); }
  /* Toutes les petites notifications passent par le moteur BL.notifyCore (dédoublonnage, regroupement, plafond de 3, cadence, silence au chargement) :
     aucun module n'ajoute de carte directement. opt = { key, group, prio, ms } ; sans group, le groupe vient du début du message (avant « : »). */
  var core = BL.notifyCore ? BL.notifyCore.create({}) : null, tEls = {}, tTimer = 0;
  function autoGroup(msg) { var m = /^([^:(]{3,28}?)\s*:/.exec(msg); return m ? m[1] : ""; }
  function toastSync(list) {
    var box = $("toasts"); if (!box) return; var live = {};
    list.forEach(function (n) { live[n.id] = 1; });
    Object.keys(tEls).forEach(function (id) { if (!live[id]) { var t = tEls[id]; delete tEls[id]; t.classList.add("out"); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); } });   /* d'abord ce qui part… */
    list.forEach(function (n) {
      var t = tEls[n.id];
      if (!t) { var out; while (box.children.length >= core.config.maxVisible && (out = box.querySelector(".toast.out"))) box.removeChild(out);   /* …puis ce qui arrive : jamais plus de 3 cartes dans la page, même pendant le fondu d'une carte qui part */
        t = tEls[n.id] = el("div", "toast " + (n.kind || "")); box.appendChild(t); }
      if (t.textContent !== n.text) t.textContent = n.text;
    });
  }
  if (core) {
    core.onChange(toastSync); core.quiet(2500);                      /* rien au chargement de la page */
    tTimer = setInterval(function () { core.tick(); }, 300);
    if (typeof document !== "undefined") ["pointerdown", "keydown", "click"].forEach(function (ev) { document.addEventListener(ev, function () { core.unquiet(); }, true); });   /* le silence du chargement s'arrête dès que le joueur agit : le retour d'une de ses actions doit s'afficher */
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", function () { if (document.hidden) core.hold(true); else core.release(1500); });
  }
  function toast(msg, kind, opt) {
    if (ui.toasts === false) return; opt = opt || {};
    if (!core) { var box = $("toasts"), t = el("div", "toast " + (kind || "")); t.textContent = msg; box.appendChild(t); while (box.children.length > 3) box.removeChild(box.firstChild); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3600); return; }
    core.offer({ text: msg, kind: kind, key: opt.key, group: opt.group !== undefined ? opt.group : autoGroup(String(msg)), prio: opt.prio !== undefined ? opt.prio : (kind === "evt" || kind === "warn" ? 2 : 1), ms: opt.ms });
  }
  function menu(open) { $("side").classList.toggle("open", open); $("scrim").classList.toggle("on", open); $("menuBtn").setAttribute("aria-expanded", String(open)); }
  function show(k) {
    NAV.forEach(function (n) {
      var b = document.querySelector('[data-view="' + n[0] + '"]'), on = n[0] === k;
      $("v_" + n[0]).hidden = !on; b.classList.toggle("on", on); if (on) { b.setAttribute("aria-current", "page"); $("pageTitle").textContent = n[2]; set($("pageSub"), n[3]); } else b.removeAttribute("aria-current");
    });
    var g = groupOf(k); ui.lastIn[g[0]] = k;
    if (ui.grp !== g[0]) { ui.grp = g[0]; g[4].forEach(function (v) { var sb = document.querySelector('#subnav [data-view="' + v + '"]'); if (sb) $("subnav").appendChild(sb); }); }
    Array.prototype.forEach.call($("subnav").children, function (b) { b.hidden = g[4].indexOf(b.dataset.view) < 0; });
    $("subnav").hidden = g[4].length < 2; $("subnav").setAttribute("aria-label", g[1] + " : sections");
    Array.prototype.forEach.call($("nav").children, function (b) { var on = b.dataset.group === g[0]; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    ui.view = k; ui.tick = 0; document.body.classList.toggle("onmap", k === "map"); menu(false); if (BL.mapUI) BL.mapUI.visible(k === "map");
  }
  /* textes générés à partir des données */
  function fxText(u) {
    var p = [], f = u.fx, k;
    if (f.incAll) p.push("Tous les revenus ×" + num(f.incAll));
    for (k in f.inc || {}) p.push(actName(k) + " : revenus ×" + num(f.inc[k]));
    if (f.upkeep) p.push("Entretien −" + Math.round((1 - f.upkeep) * 100) + " %");
    if (f.cost) p.push("Coût des activités −" + Math.round((1 - f.cost) * 100) + " %");
    if (f.rep) p.push("Réputation +" + f.rep);
    if (f.infl) p.push("Influence territoriale +" + f.infl);
    return p.join(" · ");
  }
  function condText(c) {
    if (c.t === "owned") return actName(c.id) + " niveau " + c.n; if (c.t === "income") return "Atteindre " + money(c.n) + "/s de revenus nets";
    if (c.t === "level") return "Atteindre le niveau d’empire " + c.n; if (c.t === "total") return "Gagner " + money(c.n) + " au total";
    if (c.t === "upgrades") return "Acquérir " + c.n + (c.n > 1 ? " améliorations" : " amélioration"); if (c.t === "rep") return "Atteindre " + c.n + " de réputation";
    if (c.t === "infl") return "Atteindre " + c.n + " d’influence";
    if (c.t === "terr") return "Contrôler " + c.n + " quartier" + (c.n > 1 ? "s" : ""); if (c.t === "dlv") return BL.territory.dist(c.id).name + " : contrôle niveau " + c.n;
    if (c.t === "crew") return "Recruter " + c.n + " personnage" + (c.n > 1 ? "s" : ""); if (c.t === "clv") return "Amener un personnage au niveau " + c.n; if (c.t === "star") return "Recruter un personnage " + c.n + " étoiles"; if (c.t === "ally") return "Sceller " + c.n + " alliance" + (c.n > 1 ? "s" : "");
    if (c.t === "won") return "Repousser " + c.n + " attaques rivales"; return "Posséder toutes les activités";
  }
  function rewardText(r) { var p = []; if (r.money) p.push("+" + money(r.money)); if (r.rep) p.push("+" + r.rep + " réputation"); if (r.infl) p.push("+" + r.infl + " influence"); return "Récompense : " + p.join(", "); }
  function reqText(req) { return Object.keys(req).map(function (k) { return actName(k) + " niveau " + req[k]; }).join(", "); }
  function progText(p, c) { return (c.t === "income" || c.t === "total") ? money(p.cur) + " / " + money(p.tg) : Math.min(Math.floor(p.cur), p.tg) + " / " + p.tg; }
  function msCount(n) { var c = 0; B.milestones.forEach(function (m) { if (n >= m.lvl) c++; }); return c; }

  /* pastille sur l'entrée de groupe quand une de ses sections a quelque chose de nouveau (journal, nouvel équipier) */
  function groupBadges() {   /* Partie 19 · B : pastilles d'action numérotées (vue) et somme par groupe ; jamais décoratives */
    if (!BL.nav || !ui.s) return; var gc = BL.nav.groupCounts(ui.s, GROUPS);
    function put(btn, n, label) { if (!btn) return; var d = btn.querySelector(".nbadge"); if (n > 0) { if (!d) { d = document.createElement("i"); d.className = "nbadge"; btn.appendChild(d); } set(d, String(n)); d.setAttribute("aria-label", n + " action" + (n > 1 ? "s" : "") + " possible" + (n > 1 ? "s" : "") + " : " + label); } else if (d) btn.removeChild(d); }
    NAV.forEach(function (n) { put(document.querySelector('#subnav [data-view="' + n[0] + '"]'), gc.views[n[0]] || 0, n[2]); });
    GROUPS.forEach(function (g) { put(document.querySelector('[data-group="' + g[0] + '"]'), gc.groups[g[0]] || 0, g[1]); });
  }
  /* Partie 17 · D : texte « en chantier » d'un bâtiment (ou null), et bouton bloqué si chantier ou file pleine */
  /* Partie 19 · A : quantité choisie, et texte d'un bouton d'achat : « Améliorer ×10 · $X » + « +$Y/s » ou « Il te manque $Z » (jamais un bouton grisé muet) */
  /* barre d'achat rapide au-dessus des Activités : un seul sélecteur de quantité (réglage buyqty) + « Meilleur achat maintenant » */
  var BQL = { "1": "×1", "10": "×10", "25": "×25", max: "Max" };
  function buildBuyBar() {
    var bar = el("div", "bqbar", '<div class="bqsel" role="radiogroup" aria-label="Quantité achetée">' + ["1", "10", "25", "max"].map(function (q) { return '<button type="button" role="radio" class="bqo" data-q="' + q + '" aria-checked="false">' + BQL[q] + "</button>"; }).join("") + '</div><button type="button" class="btn buy bqbest" data-nosfx="1"><span class="bt"></span><small class="bs"></small></button>');
    $("acts").parentNode.insertBefore(bar, $("acts")); ui.bqb = bar; ui.bqBest = bar.querySelector(".bqbest");
    bar.querySelector(".bqsel").addEventListener("click", function (e) { var b = e.target.closest("[data-q]"); if (b) { h.setting("buyqty", b.dataset.q); ui.bqSig = ""; if (ui.s) update(ui.s); } });
    bar.querySelector(".bqsel").addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; e.preventDefault(); var L = ["1", "10", "25", "max"], k = (L.indexOf(bq()) + (e.key === "ArrowRight" ? 1 : 3)) % 4; h.setting("buyqty", L[k]); if (ui.s) update(ui.s); var nb = bar.querySelector('[data-q="' + L[k] + '"]'); if (nb) nb.focus(); });
    ui.bqBest.onclick = function () { var s = ui.s, x = s && BL.buy ? BL.buy.best(s) : null; if (!x || x.none) return; var ok = x.kind === "lvl" ? h.buyActivity(x.id, x.i, 1) : x.kind === "bld" ? h.buyBuilding(x.id) : h.buyUpgrade(x.id); react(bar, ui.bqBest, ok); if (ui.s) update(ui.s); };
  }
  function soon(sec) { if (!isFinite(sec)) return "plus tard"; return sec < 60 ? Math.max(1, Math.ceil(sec)) + " s" : sec < 3600 ? Math.ceil(sec / 60) + " min" : Math.ceil(sec / 3600) + " h"; }
  function updBuyBar(s) {
    if (!ui.bqb || !BL.buy) return; var q = bq(); Array.prototype.forEach.call(ui.bqb.querySelectorAll("[data-q]"), function (b) { var on = b.dataset.q === q; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; b.classList.toggle("on", on); });
    var x = BL.buy.best(s), B = ui.bqBest;
    if (x.none) { set(B.firstChild, "Rien d’abordable — prochain achat dans " + soon(x.eta)); set(B.lastChild, ""); B.disabled = true; }
    else { set(B.firstChild, "Acheter : " + (x.kind === "bld" ? "nouveau bâtiment " + x.name : x.kind === "upg" ? x.name : x.name + (E.buildings(s, x.id) > 1 ? " (bât. " + (x.i + 1) + ")" : "") + " ×1") + " · " + money(x.cost)); set(B.lastChild, "Meilleur retour maintenant : +" + money(x.gain) + "/s"); B.disabled = false; }
    B.classList.toggle("can", !B.disabled);
  }
  function bq() { var st = BL.main && BL.main.settings ? BL.main.settings() : null; return BL.buy ? BL.buy.qty(st && st.buyqty) : "1"; }
  function bset(btn, s, a, i, pl, mx, verb) {
    var w = wkS(s, a.id, i), t, sub = "";
    if (w) t = w; else if (mx) t = "Niveau maximal"; else if (!pl || !pl.k) { t = pl && pl.why === "full" ? "File de chantiers pleine" : "Indisponible"; sub = pl && pl.why === "full" ? "Attends qu’un ouvrier se libère" : ""; }
    else { t = (verb || "Améliorer") + " ×" + pl.k + " · " + money(pl.cost); sub = !pl.ok ? "Il te manque " + money(pl.missing) : "+" + money(Math.max(0, pl.gain)) + "/s" + (pl.lim === "dur" ? " · limité à ×" + pl.k + " (24 h de travaux)" : pl.lim === "lvl" ? " · jusqu’au niveau " + pl.to : "") + (pl.wait ? " · en file (aucun ouvrier libre)" : ""); }
    set(btn.firstChild, t); set(btn.lastChild, sub);
  }
  function wkS(s, id, i) { var x = BL.worksUI && BL.worksUI.lotState(s, id, i); return x ? x.label : null; }
  function wkB(s, id, i) { return !!(BL.works && (BL.works.busyLot(s, id, i) || BL.works.full(s))); }
  function init(handlers) {
    D = BL.data; E = BL.economy; B = D.balance; h = handlers; BL.ui.handlers = handlers;
    GROUPS.forEach(function (g) {
      var b = el("button", "ngbtn", svg(g[2]) + '<span class="ngt"><span>' + g[1] + '</span><small>' + g[3] + "</small></span>"); b.type = "button"; b.dataset.group = g[0]; b.onclick = function () { show(ui.lastIn[g[0]] || g[4][0]); }; $("nav").appendChild(b);
    });
    var sub = $("subnav"); NAV.forEach(function (n) {
      var b = el("button", "sntab", svg(n[1]) + "<span>" + n[2] + "</span>"); b.type = "button"; b.dataset.view = n[0]; b.hidden = true; b.onclick = function () { show(n[0]); }; sub.appendChild(b);
    });
    sub.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var l = Array.prototype.filter.call(sub.querySelectorAll("button"), function (x) { return !x.hidden; }), i = l.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); l[(i + (e.key === "ArrowRight" ? 1 : l.length - 1)) % l.length].focus();
    });
    if (BL.tip) { BL.tip.init(); ["money", "income_net", "ingot", "reputation", "influence", "progress", "empire_level"].forEach(function (k) { BL.tip.dynamic(k, function () { return ui.tipx && ui.tipx[k]; }); }); }
    $("todoBtn").onclick = function () { var o = $("todoMap").hidden; $("todoMap").hidden = !o; $("todoBtn").setAttribute("aria-expanded", String(o)); if (o && ui.s) renderTodo(ui.s, true); };
    renderGlossary(""); $("gsInput").oninput = function () { renderGlossary(this.value); };
    $("menuBtn").innerHTML = svg("menu");
    $("menuBtn").onclick = function () { menu(!$("side").classList.contains("open")); }; $("scrim").onclick = function () { menu(false); };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false); });
    set($("empName"), D.empireName);
    [["money", "money", "Argent disponible", "", "money"], ["inc", "trend", "Revenus nets par seconde", "", "income_net"], ["rep", "star", "Réputation", "opt", "reputation"], ["inf", "net", "Influence territoriale", "opt", "influence"], ["gold", "vault", "Lingots d’or dans le coffre", "gold", "ingot"], ["boost", "trend", "Boost de revenus actif", "boost", "boost"]].forEach(function (c) {
      var ch = el("div", "chip " + c[3], (c[0] === "gold" ? '<i class="ingot-i" aria-hidden="true"></i>' : svg(c[1])) + '<span id="r_' + c[0] + '"></span>'); if (c[0] === "boost") { ch.id = "boostChip"; ch.hidden = true; } BL.tip && BL.tip.bind(ch, c[4]); if (BL.explainUI && { inc: "income", rep: "rep", inf: "infl" }[c[0]]) BL.explainUI.attach(ch, { inc: "income", rep: "rep", inf: "infl" }[c[0]], "Voir d’où vient ce nombre : " + c[2]); $("res").appendChild(ch);
    });
    [["money", "money", "Argent disponible"], ["inc", "trend", "Revenus nets"], ["lvl", "star", "Niveau d’empire"], ["prog", "trophy", "Progression globale"]].forEach(function (c) {
      $("stats").appendChild(el("div", "card stat kpi", '<div class="lab">' + svg(c[1]) + c[2] + qmHtml(c[2]) + '</div><div class="val" id="s_' + c[0] + '"></div><div class="note" id="n_' + c[0] + '"></div><div class="meter kbar" id="k_' + c[0] + '" hidden><i></i></div>'));
    });
    if (BL.explainUI) BL.explainUI.attach($("s_inc"), "income", "Voir d’où viennent les revenus nets");
    D.activities.forEach(function (a) {
      var c = el("div", "card act", '<div class="banner">' + BL.art.act(a.id) + '<span class="bshade"></span></div><div class="ah"><div class="ico">' + svg(a.icon) + '</div><div class="an"><div class="nm">' + a.name + '</div><div class="ds">' + a.cat + " · " + a.desc + '</div></div><span class="badge"><b class="lv"></b></span></div>' +
        '<div class="kv"><div><span>Revenus</span><b class="k1"></b></div><div><span>Entretien</span><b class="k2"></b></div><div><span>Gain si tu améliores</span><b class="k3"></b></div></div>' +
        '<div class="evo"><div class="et"></div><div class="meter"><i></i></div><div class="et2"></div></div><div class="dsg" aria-label="Design du bâtiment"></div><div class="blds" aria-label="Bâtiments de cette activité"></div><button class="btn buy"></button>');
      var b = c.querySelector(".buy"); b.innerHTML = '<span class="bt"></span><small class="bs"></small>'; b.onclick = function () { react(c, b, h.buyActivity(a.id, 0, bq())); };
      var rows = []; for (var bi = 0; bi < E.BLD_NEED.length; bi++) (function (bi) {
        var r = el("div", "brow", '<div class="bnm"></div><div class="blv"></div><div class="binc"></div><button type="button" class="xq" data-explain="cost:' + a.id + ':' + bi + '">Détail du prix</button><button class="btn bbtn"></button>'), rb = r.querySelector(".bbtn");
        rb.innerHTML = '<span class="bt"></span><small class="bs"></small>'; rb.onclick = function () { react(c, rb, bi < E.buildings(ui.s || {}, a.id) ? h.buyActivity(a.id, bi, bq()) : h.buyBuilding(a.id)); };
        c.querySelector(".blds").appendChild(r); rows.push({ r: r, nm: r.querySelector(".bnm"), lv: r.querySelector(".blv"), inc: r.querySelector(".binc"), b: rb });
      })(bi);
      if (BL.tip) BL.tip.decorate(c, ".kv span", { qm: true });
      if (BL.explainUI) { BL.explainUI.attach(c.querySelector(".k1"), "act:" + a.id, "Voir d’où viennent les revenus : " + a.name); BL.explainUI.attach(c.querySelector(".k2"), "upk:" + a.id, "Voir d’où vient l’entretien : " + a.name); rows.forEach(function (r, bi) { BL.explainUI.attach(r.inc, "bld:" + a.id + ":" + bi, "Voir d’où viennent les revenus du bâtiment " + (bi + 1)); }); }
      $("acts").appendChild(c); if (!ui.bqb) buildBuyBar();
      ui.a[a.id] = { dsg: c.querySelector(".dsg"), rows: rows, c: c, ico: c.querySelector(".ico"), lv: c.querySelector(".lv"), k1: c.querySelector(".k1"), k2: c.querySelector(".k2"), k3: c.querySelector(".k3"), et: c.querySelector(".et"), et2: c.querySelector(".et2"), eb: c.querySelector(".meter i"), b: b };
      var r = el("div", "r", "<div><span>" + a.name + '</span><b></b></div><div class="meter" style="width:100%"><i></i></div>'); $("breakdown").appendChild(r);
      ui.bd[a.id] = { v: r.querySelector("b"), bar: r.querySelector("i") };
    });
    D.upgrades.forEach(function (u) {
      var c = el("div", "card upg", '<div class="ah">' + BL.art.upgTile(u) + '<div class="an"><div class="nm">' + u.name + '</div><div class="ds">' + fxText(u) + '</div><div class="ds ct"></div></div></div><button class="btn buy" style="margin-top:12px"></button>');
      var b = c.querySelector(".buy"); b.onclick = function () { react(c, b, h.buyUpgrade(u.id)); };
      $("upgs").appendChild(c); ui.u[u.id] = { c: c, ct: c.querySelector(".ct"), b: b };
    });
    D.missions.forEach(function (m) {
      var c = el("div", "card", '<div class="ah"><div class="mg">' + BL.art.glyph(BL.art.condGlyph(m.cond)) + '</div><div class="an"><div class="nm">' + m.name + '</div><div class="ds">' + condText(m.cond) + '</div></div></div><div class="prog"><div class="pt"><span class="pl"></span><span class="pr"></span></div><div class="meter"><i></i></div></div><div class="rw">' + rewardText(m.reward) + '</div><button class="btn buy"></button>');
      var b = c.querySelector(".buy"); b.onclick = function () { react(c, b, h.claim(m.id)); };
      $(TIERS[m.tier]).appendChild(c); ui.m[m.id] = { c: c, pr: c.querySelector(".pr"), bar: c.querySelector(".meter i"), b: b };
    });
    D.achievements.forEach(function (a) {
      var c = el("div", "card ach", '<div class="mdl" data-g="' + BL.art.condGlyph(a.cond) + '">' + BL.art.medal(BL.art.condGlyph(a.cond), false) + '</div><div><div class="nm">' + a.name + '</div><div class="ds">' + a.desc + '</div></div>');
      $("achs").appendChild(c); ui.ac[a.id] = c;
    });
    $("nxBtn").onclick = function () { if (ui.nextId) h.claim(ui.nextId); };
    $("btnSave").onclick = function () { h.save(); }; $("btnReset").onclick = h.reset;
    $("crest").innerHTML = BL.art.crest();
    var util = { go: show, $: $, el: el, set: set, fmt: fmt, money: money, toast: toast };
    BL.terrUI.init(h, util); BL.crewUI.init(h, util); BL.equipUI.init(h, util); BL.mapUI.init(h, util); if (BL.casinoUI) BL.casinoUI.init(h, util); if (BL.heatUI) BL.heatUI.init(h, util); if (BL.lbUI) BL.lbUI.init(h, util); if (BL.sagaUI) BL.sagaUI.init(h, util); if (BL.warUI) BL.warUI.init(h, util); if (BL.bondsUI) BL.bondsUI.init(h, util); if (BL.metaUI) BL.metaUI.init(h, util); if (BL.heistUI) BL.heistUI.init(h, util); if (BL.hqRooms) BL.hqRooms.init(h, util); BL.sysUI.init(h, util); BL.hqUI.init(h, util); BL.roomUI.init(h, util); BL.shopUI.init(h, util); BL.boxesUI.init(h, util); BL.wallsUI.init(h, util); BL.radioUI.init(h, util);
    show("map");
  }
  function chip(inc) {
    var n = $("n_inc");
    if (ui.last !== null && Math.abs(inc - ui.last) > 1e-9) {
      var d = inc - ui.last; n.innerHTML = '<span class="' + (d > 0 ? "pos" : "neg") + '">' + (d > 0 ? "▲ +" : "▼ −") + fmt(Math.abs(d)) + "/s</span>";
      clearTimeout(ui.chipT); ui.chipT = setTimeout(function () { n.innerHTML = ""; }, 3000);
    }
    ui.last = inc;
  }
  /* Revenus de la session : une mesure toutes les 5 s de jeu (en mémoire, repart de zéro à chaque ouverture). Axes et légende lisibles, courbe nette + courbe brute. */
  function chart() {
    var H = ui.hist, n = H.length, W = 600, Ht = 150; if (!n) return;
    var max = 1e-9; H.forEach(function (p) { max = Math.max(max, p.net, p.gross); }); max *= 1.1;
    function path(k) { return "M" + H.map(function (p, i) { return (i / Math.max(n - 1, 1) * W).toFixed(1) + " " + (Ht - 5 - p[k] / max * (Ht - 12)).toFixed(1); }).join("L"); }
    var span = n > 1 ? H[n - 1].t - H[0].t : 0, lo = H.reduce(function (a, p) { return Math.min(a, p.net); }, Infinity), hi = H.reduce(function (a, p) { return Math.max(a, p.net); }, 0);
    var sg = n + "|" + Math.round(max) + "|" + Math.round(H[n - 1].net) + "|" + Math.round(H[n - 1].gross); if (ui.chSig === sg) return; ui.chSig = sg;
    var net = path("net");
    $("chart").innerHTML = '<div class="cht"><div class="chy" aria-hidden="true"><span>' + money(max / 1.1) + '/s</span><span>' + money(max / 2.2) + '/s</span><span>$0</span></div>' +
      '<svg class="chart" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="none" role="img" aria-label="Revenus par seconde sur la session : de ' + money(lo) + " à " + money(hi) + ' par seconde, maintenant ' + money(H[n - 1].net) + '"><g stroke="#2b2f37" stroke-width="1" vector-effect="non-scaling-stroke"><path d="M0 ' + (Ht - 5) + "H" + W + "M0 " + ((Ht - 5) / 2).toFixed(0) + "H" + W + 'M0 5H' + W + '"/></g>' +
      '<path d="' + net + "L" + W + " " + Ht + "L0 " + Ht + 'Z" fill="url(#gArea)"/><path d="' + path("gross") + '" fill="none" stroke="#a3a7af" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/><path d="' + net + '" fill="none" stroke="#c8a45e" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>' +
      '<div class="chx" aria-hidden="true"><span>' + (span >= 60 ? "il y a " + dur(span) : "début de la session") + "</span><span>maintenant</span></div></div>" +
      '<div class="cleg"><span><i class="clg net"></i>Revenus nets ($/s)</span><span><i class="clg gross"></i>Revenus bruts ($/s)</span></div>';
    set($("chartNote"), n < 3 ? "La courbe se dessine au fil de ta partie : une mesure toutes les 5 secondes." : "Sur " + dur(span) + " de jeu : mini " + money(lo) + "/s · pic " + money(hi) + "/s (revenus nets).");
  }
  /* petit « ? » (bouton) à côté d'un libellé connu du glossaire : explique d'où vient le chiffre */
  function qmHtml(label) { var k = BL.glossary && BL.glossary.byLabel(label); return k ? ' <button type="button" class="qm" data-tip="' + k + '" aria-label="Explication : ' + label.replace(/"/g, "") + '">?</button>' : ""; }
  function dur(sec) { sec = Math.max(0, Math.round(sec)); if (sec < 60) return sec + " s"; var m = Math.floor(sec / 60); if (m < 60) return m + " min" + (sec % 60 && m < 10 ? " " + (sec % 60) + " s" : ""); var h = Math.floor(m / 60); return h + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); }
  /* progression globale : moyenne de cinq avancements (niveau d'empire, missions, succès, bonus permanents, quartiers) */
  function progressAll(s) {
    var parts = [(E.level(s) - 1) / (B.maxEmpireLevel - 1), E.count(s.claimed) / D.missions.length, E.count(s.ach) / D.achievements.length, E.count(s.upg) / D.upgrades.length, BL.territory.count(s) / D.territory.districts.length];
    return Math.max(0, Math.min(1, parts.reduce(function (a, b) { return a + b; }, 0) / parts.length));
  }
  function rows(list) { return list.map(function (r) { return "<dt>" + r[0] + qmHtml(r[0]) + "</dt><dd" + (r[2] ? ' class="' + r[2] + '"' : "") + ">" + r[1] + "</dd>"; }).join(""); }
  function updateNext(s) {
    var ns = E.nextStep(s), lock = null, gb = $("goalbar"), kind = ns ? ns.kind : "none";
    D.activities.some(function (a) { if (!E.actUnlocked(s, a)) { lock = a; return true; } });
    ui.nextId = null; $("nxBtn").hidden = true;
    if (!ns) { set($("nxName"), "Empire complet"); set($("nxSub"), "Toutes les missions sont accomplies."); BL.bar($("nxBar"), 100); }
    else if (ns.kind === "claim") { ui.nextId = ns.id; $("nxBtn").hidden = false; set($("nxName"), ns.label); set($("nxSub"), "Objectif atteint : réclame ta récompense."); }
    else if (ns.kind === "level") { set($("nxName"), ns.label); set($("nxSub"), money(Math.max(0, ns.need)) + " à gagner"); }
    else { var m = E.find(D.missions, ns.id); set($("nxName"), ns.label); set($("nxSub"), condText(m.cond)); }
    BL.bar($("nxBar"), ns ? Math.max(0, Math.min(100, ns.p * 100)) : 100);
    gb.classList.toggle("done", kind === "claim");
    if (ui.goalKind === "claim" && kind !== "claim" && ui.goalKind !== undefined) { gb.classList.remove("win"); void gb.offsetWidth; gb.classList.add("win"); }   /* objectif réclamé : courte animation de réussite */
    if (kind === "claim" && ui.goalKind !== undefined && ui.goalKind !== "claim" && BL.notify) BL.notify.push({ type: "claim", key: "claim", title: "Objectif atteint", text: (ns && ns.label ? ns.label + " : " : "") + "réclame ta récompense.", target: { view: "goals" }, mark: { type: "hq" } });
    ui.goalKind = kind;
    gb.title = lock ? "Prochain déblocage : " + lock.name + " (" + actName(lock.unlock.id) + " niveau " + lock.unlock.lvl + ")" : "Toutes les activités sont débloquées";
  }
  /* Niveau d'empire gagné : si un nouveau statut est atteint en même temps, seule la promotion est annoncée. */
  function levelUp(L) {
    var si = BL.status ? BL.status.index(L) : 0, was = ui.si === undefined ? si : ui.si; ui.si = si;
    if (!BL.notify) { toast("Ton empire passe au niveau " + L + ".", "ok"); return; }
    var nx = BL.status.next(L), goal = nx ? "Prochain statut : " + nx.name + " au niveau " + nx.lvl + "." : "Tu as atteint le plus haut statut.";
    if (si > was) { var st = BL.status.of(L); BL.notify.push({ type: "status", key: "lvl", title: "Promotion : " + st.name, text: "Niveau " + L + ". " + st.tag + " " + goal, target: { view: "empire" }, mark: { type: "hq" } }); }
    else BL.notify.push({ type: "levelup", key: "lvl", title: "Niveau " + L, text: "Ton empire grandit. " + goal, target: { type: "hq" }, mark: { type: "hq" } });
  }
  var failed = {};
  function safeUpdate(name, fn, s) { try { fn(s); failed[name] = 0; } catch (e) { if (!failed[name]) { failed[name] = 1; try { console.error("[BLACKLINE] mise à jour de « " + name + " » en erreur (les autres écrans continuent) :", e); } catch (x) {} } } }
  function update(s) { ui.s = s;
    if (BL.ambience && BL.ambience.setHeat && BL.heat) BL.ambience.setHeat(BL.heat.state(s).v);   /* C8 : la ville s'assombrit quand la chaleur monte */
    var inc = E.income(s), bm = E.boostMult(s), L = E.level(s), lo = E.levelAt(L), hi = E.levelAt(L + 1), bd = E.breakdown(s), i, first = ui.unl === null;
    var rep = E.reputation(s), infl = E.influence(s), rm = E.repMult(s);
    set($("r_money"), money(s.money)); set($("r_inc"), money(inc) + "/s"); set($("r_rep"), fmt(rep)); set($("r_inf"), fmt(infl)); set($("r_gold"), String(s.gold));
    BL.profile && BL.profile.header(L); BL.bar($("lvBar"), (L >= B.maxEmpireLevel ? 100 : Math.min(100, (s.total - lo) / (hi - lo) * 100)));
    if (ui.si === undefined && BL.status) ui.si = BL.status.index(L);
    if (ui.lvl !== null && L > ui.lvl) levelUp(L); ui.lvl = L;
    set($("s_money"), money(s.money)); set($("s_inc"), money(inc) + "/s"); chip(inc);
    set($("n_money"), "Brut " + money(bd.gross) + "/s − entretien " + money(bd.upkeep) + "/s");
    set($("n_inc"), "Revenus bruts − entretien" + (bm > 1 ? " · boost ×" + num(bm) + " actif" : ""));
    var stn = BL.status ? BL.status.of(L) : null, pg = progressAll(s);
    set($("s_lvl"), "Niveau " + L + (L >= B.maxEmpireLevel ? " (max)" : "")); set($("n_lvl"), (stn ? stn.name + " · " : "") + (L >= B.maxEmpireLevel ? "niveau maximal" : money(Math.max(0, hi - s.total)) + " à gagner pour le niveau " + (L + 1)));
    $("k_lvl").hidden = false; BL.bar($("k_lvl").firstElementChild, (L >= B.maxEmpireLevel ? 100 : Math.min(100, (s.total - lo) / (hi - lo) * 100)));
    set($("s_prog"), Math.round(pg * 100) + " %"); set($("n_prog"), "Niveau, missions, succès, bonus, quartiers"); $("k_prog").hidden = false; BL.bar($("k_prog").firstElementChild, Math.round(pg * 100));
    ui.tipx = { money: "Exactement : $" + exact(s.money), income_net: "Exactement : $" + (Math.round(inc * 10) / 10).toLocaleString("fr-FR") + " par seconde. Brut $" + fmt(bd.gross) + " − entretien $" + fmt(bd.upkeep), ingot: s.gold + " lingot" + (s.gold > 1 ? "s" : "") + " sur " + BL.gold.capacity(s) + " dans le coffre", reputation: "Revenus +" + Math.round((rm - 1) * 100) + " % (max +" + Math.round(B.repIncomeCap * 100) + " %)", influence: "Pertes d’événements −" + Math.round(E.lossCut(s) * 100) + " %", progress: "Aujourd’hui : " + Math.round(pg * 100) + " %", empire_level: "Niveau " + L + " sur " + B.maxEmpireLevel };
    var tot = bd.gross, ms = {}, aun = {};
    updBuyBar(s);
    D.activities.forEach(function (a) {
      var n = s.owned[a.id] || 0, u = ui.a[a.id], ok = E.actUnlocked(s, a), mx = E.isMax(s, a), n0 = E.bLevel(s, a.id, 0), c = E.cost(a, n0, s), v = E.actIncome(s, a) * bm, nx = E.nextMs(n), cnt = E.buildings(s, a.id), nb = E.nextBuilding(s, a), lvs = E.levels(s, a.id);
      var bestI = -1, bestR = 0; lvs.forEach(function (L, i) { if (L < a.maxLevel) { var rr = E.netGainOf(s, a, i) / Math.max(1, E.cost(a, L, s, i)); if (bestI < 0 || rr > bestR) { bestI = i; bestR = rr; } } });
      aun[a.id] = ok; ms[a.id] = 0; lvs.forEach(function (L) { ms[a.id] += msCount(L); });
      u.c.classList.toggle("locked", !ok); u.c.classList.toggle("max", mx);
      set(u.lv, ok ? (cnt > 1 ? "Meilleur niv. " + n + " / " + a.maxLevel : "Niv. " + n + " / " + a.maxLevel) : "Verrouillé");
      var q0 = bq(), pb = bestI >= 0 && BL.buy ? BL.buy.plan(s, a.id, bestI, q0) : null;
      set(u.k1, money(v) + "/s"); set(u.k2, "−" + money(E.upkeepOf(s, a)) + "/s"); set(u.k3, bestI < 0 ? "—" : "+" + money(Math.max(0, pb && pb.k ? pb.gain : E.netGainOf(s, a, bestI))) + "/s (bâtiment " + (bestI + 1) + (pb && pb.k > 1 ? ", ×" + pb.k : "") + ")");
      u.rows.forEach(function (R, i) {
        var built = i < cnt, isNext = i === cnt && cnt >= 1, show = i > 0 && (built || isNext); R.r.hidden = !show; if (!show) return;
        if (built) { var L = lvs[i], mxb = L >= a.maxLevel, cc = E.cost(a, L, s, i); set(R.nm, "Bâtiment " + (i + 1)); set(R.lv, "niv. " + L + " / " + a.maxLevel); set(R.inc, money(E.bldIncome(s, a, i, L) * bm) + "/s");
          var pl = BL.buy ? BL.buy.plan(s, a.id, i, q0) : null; bset(R.b, s, a, i, pl, mxb); R.b.disabled = !ok || mxb || !pl || !pl.ok || wkB(s, a.id, i); R.r.classList.toggle("best", i === bestI && !mxb); }
        else { set(R.nm, "Bâtiment " + (i + 1)); set(R.lv, wkS(s, a.id, i) ? "nouveau bâtiment" : nb && nb.ok ? "à construire" : "verrouillé"); set(R.inc, nb && nb.ok ? "part " + Math.round(E.BLD_W[i] * 100) + " %" : "meilleur bât. niv. " + (nb ? nb.need : "—"));
          set(R.b.firstChild, wkS(s, a.id, i) || (nb && nb.ok ? "Construire · " + money(nb.cost) : "Niv. " + (nb ? nb.need : "—") + " requis")); set(R.b.lastChild, nb && nb.ok && !wkS(s, a.id, i) ? (s.money + 1e-9 < nb.cost ? "Il te manque " + money(nb.cost - s.money) : "+" + money(E.bldIncome(s, a, i, 1)) + "/s") : ""); R.b.disabled = !(nb && nb.ok) || s.money + 1e-9 < nb.cost || wkB(s, a.id, i); R.r.classList.remove("best"); }
        R.r.classList.toggle("wbusy", !!wkS(s, a.id, i)); R.b.classList.toggle("can", !R.b.disabled);
      });
      if (!ok) { set(u.et, "Requiert le meilleur bâtiment de " + actName(a.unlock.id) + " au niveau " + a.unlock.lvl); BL.bar(u.eb, Math.min(100, (s.owned[a.unlock.id] || 0) / a.unlock.lvl * 100)); }
      else if (nx) { set(u.et, "Prochain palier : niveau " + nx.lvl + " (revenus ×" + num(nx.mult) + ")"); BL.bar(u.eb, Math.min(100, n / nx.lvl * 100)); }
      else { set(u.et, "Tous les paliers sont atteints"); BL.bar(u.eb, 100); }
      if (BL.buildArt) { var dt0 = E.designTier(n0), dn = E.nextDesign(n0), dtn = dn ? E.designTier(dn) : -1, dsg = dt0 + "/" + dtn + "/" + (dn || 0); if (u.dsg.dataset.sg !== dsg) { u.dsg.dataset.sg = dsg; u.dsg.innerHTML = '<figure class="dsg-c">' + BL.buildArt.svg(a.id, dt0) + "<figcaption>Design actuel<b>" + E.DESIGN_NAMES[dt0] + "</b></figcaption></figure>" + (dn ? '<figure class="dsg-n">' + BL.buildArt.svg(a.id, dtn) + "<figcaption>Au niveau " + dn + "<b>" + E.DESIGN_NAMES[dtn] + "</b></figcaption></figure>" : '<p class="dsg-m">Design maximal atteint.</p>'); } }
      var up = null; D.upgrades.some(function (g) { if (!s.upg[g.id] && g.fx.inc && g.fx.inc[a.id]) { up = g; return true; } });
      set(u.et2, up ? "Bonus permanent lié : " + up.name + (E.unlocked(s, up) ? " (disponible)" : " (niveau " + up.req[a.id] + ")") : "Bonus permanents liés : tous acquis");
      var mx0 = n0 >= a.maxLevel, p0 = ok && BL.buy ? BL.buy.plan(s, a.id, 0, q0) : null;
      if (!ok) { set(u.b.firstChild, "Verrouillé"); set(u.b.lastChild, ""); } else bset(u.b, s, a, 0, p0, mx0, cnt > 1 ? "Améliorer le bâtiment 1" : cnt ? "Améliorer" : "Construire");
      u.b.disabled = !ok || mx0 || !p0 || !p0.ok || wkB(s, a.id, 0); u.b.classList.toggle("can", !u.b.disabled); u.c.classList.toggle("wbusy", !!wkS(s, a.id, 0));
      set(ui.bd[a.id].v, money(v) + "/s"); BL.bar(ui.bd[a.id].bar, (tot ? Math.min(100, v / tot * 100) : 0));
    });
    if (ui.aun) D.activities.forEach(function (a) { if (aun[a.id] && !ui.aun[a.id]) { var um = "Nouvelle activité débloquée : " + a.name + "."; E.addLog(s, um); BL.notify.push({ type: "unlock", key: "unl" + a.id, once: "unl:" + a.id, title: a.name, text: "Nouvelle activité : tu peux construire ton premier bâtiment.", art: BL.buildArt ? BL.buildArt.svg(a.id, 0) : "", target: { type: "lot", act: a.id, id: a.id + "#0" }, mark: { type: "lot", act: a.id, id: a.id + "#0" } }); } });
    if (ui.msc) D.activities.forEach(function (a) { if (ms[a.id] > ui.msc[a.id]) { var m = B.milestones[ms[a.id] - 1]; toast("Palier atteint : " + a.name + " niveau " + m.lvl + " (revenus ×" + num(m.mult) + ").", "ok"); } });
    ui.aun = aun; ui.msc = ms;
    var un = {};
    D.upgrades.forEach(function (g) {
      var u = ui.u[g.id], ok = E.unlocked(s, g), own = !!s.upg[g.id]; un[g.id] = !own && ok;
      u.c.classList.toggle("done", own);
      set(u.ct, own ? "Acquise" : ok ? "Disponible" : "Requiert " + reqText(g.req));
      set(u.b, own ? "Acquise" : "Acheter · " + money(g.cost)); u.b.disabled = own || !ok || s.money + 1e-9 < g.cost; u.b.classList.toggle("can", !u.b.disabled);
    });
    if (ui.unl) D.upgrades.forEach(function (g) { if (un[g.id] && !ui.unl[g.id]) toast("Amélioration disponible : " + g.name + ".", "ok"); }); ui.unl = un;
    D.missions.forEach(function (m) {
      var u = ui.m[m.id], p = E.progress(s, m.cond), cl = !!s.claimed[m.id];
      u.c.classList.toggle("claimed", cl); set(u.pr, cl ? "Terminée" : progText(p, m.cond)); BL.bar(u.bar, (cl ? 100 : p.p * 100));
      set(u.b, cl ? "Récompense reçue" : p.done ? "Réclamer" : "En cours"); u.b.disabled = cl || !p.done; u.b.classList.toggle("can", !u.b.disabled);
    });
    var na = 0; D.achievements.forEach(function (a) { var on = !!s.ach[a.id], c = ui.ac[a.id]; if (c.classList.contains("on") !== on) { c.classList.toggle("on", on); var md = c.querySelector(".mdl"); md.innerHTML = BL.art.medal(md.dataset.g, on); } if (on) na++; });
    set($("achCount"), "(" + na + " / " + D.achievements.length + ", +1 réputation chacun)");
    if (s.t - ui.hT >= 5 || !ui.hist.length) { ui.hT = s.t; ui.hist.push({ t: s.t, net: inc, gross: bd.gross }); if (ui.hist.length > 720) ui.hist.shift(); }
    ui.hist[ui.hist.length - 1] = { t: s.t, net: inc, gross: bd.gross };
    if (ui.tick++ % 10 === 0) { groupBadges();
      updateNext(s); renderTodo(s);
      if (ui.view === "dash") {
        chart();
        $("bilan").innerHTML = rows([["Revenus bruts", money(bd.gross) + "/s"], ["Entretien", "−" + money(bd.upkeep) + "/s", "neg"], ["Revenus nets", money(bd.net) + "/s"],
          ["Total encaissé", money(s.st.earned)], ["Entretien payé", "−" + money(s.st.upkeep), "neg"], ["Dépenses (achats)", "−" + money(s.st.spent), "neg"], ["Récompenses reçues", "+" + money(s.st.rewards)]]);
      }
      if (ui.view === "goals") {
        var lk = D.activities.filter(function (a) { return !E.actUnlocked(s, a); }).map(function (a) { return a.name + " : " + actName(a.unlock.id) + " niveau " + (s.owned[a.unlock.id] || 0) + " / " + a.unlock.lvl; });
        D.upgrades.forEach(function (g) { if (!s.upg[g.id] && !E.unlocked(s, g) && lk.length < 6) lk.push(g.name + " : " + reqText(g.req)); });
        lk = lk.concat(BL.terrUI.unlockLines(s), BL.crewUI.unlockLines(s));
        var sg = lk.join("|"), ul = $("unlocks"); if (ul.dataset.sg !== sg) { ul.dataset.sg = sg; ul.innerHTML = ""; (lk.length ? lk : ["Tout est débloqué."]).forEach(function (m) { var li = document.createElement("li"); li.textContent = m; ul.appendChild(li); }); }
      }
      if (ui.view === "dash") {
        var own = 0, bl = 0, upn = 0, ii; for (ii in s.owned) own += s.owned[ii]; D.activities.forEach(function (a) { bl += E.buildings(s, a.id); }); for (ii in s.upg) if (s.upg[ii]) upn++;
        var grp = function (title, list) { return '<div class="sg"><h3 class="h3">' + title + '</h3><dl class="dl">' + rows(list) + "</dl></div>"; };
        var sh = grp("Argent", [["Total gagné", money(s.total)], ["Revenus nets par seconde", money(inc) + "/s"], ["Entretien par seconde", "−" + money(bd.upkeep) + "/s"], ["Dépenses totales", money(s.st.spent)], ["Entretien payé", money(s.st.upkeep)], ["Récompenses reçues", money(s.st.rewards)]]) +
          grp("Progression", [["Temps de jeu", hms(s.t)], ["Niveau d’empire", L + " / " + B.maxEmpireLevel], ["Prochain niveau d’empire", L >= B.maxEmpireLevel ? "Niveau maximal" : money(Math.max(0, hi - s.total)) + " à gagner"], ["Bâtiments construits", bl + " / " + D.activities.length * BL.mapData.LOTS.perActivity], ["Niveaux des meilleurs bâtiments", own + " / " + D.activities.length * D.activities[0].maxLevel], ["Bonus permanents acquis", upn + " / " + D.upgrades.length], ["Missions réclamées", E.count(s.claimed) + " / " + D.missions.length], ["Succès", E.count(s.ach) + " / " + D.achievements.length]]) +
          grp("Réputation et territoire", [["Réputation", fmt(rep) + " (revenus ×" + num(rm.toFixed(2)) + ")"], ["Influence", fmt(infl)], ["Quartiers contrôlés", BL.territory.count(s) + " / " + D.territory.districts.length], ["Attaques repoussées / perdues", s.terr.won + " / " + s.terr.lost], ["Équipe active / recrutée", BL.crew.active(s).length + " / " + BL.crew.owned(s).length], ["Alliances conclues", String(s.dip.formed)]]);
        if ($("statsList").dataset.sg !== sh) { $("statsList").dataset.sg = sh; $("statsList").innerHTML = sh; }
      }
    }
    renderJournal(s);
    var key = s.pending || "none:" + Math.ceil(Math.max(0, s.nextEvent - s.t) / 5);
    if (s.pendingFac) key += s.pendingFac; if (s.pendingCrew) key += s.pendingCrew;
    if (ui.evKey !== key) { ui.evKey = key; renderEvent(s); }
    /* C2 (Partie 12) : chaque écran est mis à jour isolément. Avant, une erreur dans l'un (ex. l'équipe) interrompait tous les suivants à chaque tick : valeurs figées jusqu'au rechargement. */
    [["terrUI"], ["crewUI"], ["equipUI"], ["hqUI"], ["roomUI"], ["shopUI"], ["boxesUI"], ["lbUI"], ["wallsUI"], ["radioUI"], ["casinoUI"], ["heatUI"], ["sagaUI"], ["warUI"], ["metaUI"], ["heistUI"], ["hqRooms"], ["teaser"], ["mapUI"]].forEach(function (k) { var m = BL[k[0]]; if (m && m.update) safeUpdate(k[0], m.update, s); });
    var lg = $("log"), items = s.log.slice(0, 6), sg2 = items.join("|");
    if (lg.dataset.sg !== sg2) { lg.dataset.sg = sg2; lg.innerHTML = ""; (items.length ? items : ["Rien à signaler."]).forEach(function (m) { var li = document.createElement("li"); li.textContent = m; lg.appendChild(li); }); }
    if (first) updateNext(s);
  }
  /* ----- Journal unifié (BL.journal) : zones « À faire maintenant » et « En cours », pastille de menu ----- */
  function fmtLeft(x) { return x === null || x === undefined ? "" : x <= 0 ? "terminé" : "reste " + dur(x); }
  function renderJournal(s) {
    if (!BL.journal) return; var z = BL.journal.zones(s), nb = document.querySelector('[data-view="goals"]'), bd = nb && nb.querySelector(".jbadge");
    if (nb) { if (z.now.length) { if (!bd) { bd = document.createElement("i"); bd.className = "jbadge"; nb.appendChild(bd); } set(bd, String(z.now.length)); bd.setAttribute("aria-label", z.now.length + " à faire"); } else if (bd) nb.removeChild(bd); }
    if (ui.view !== "goals") return;
    [["now", "jrNow", "jrNowN", "jrNowBox", "Rien à faire pour l’instant."], ["doing", "jrDo", "jrDoN", "jrDoBox", "Rien en cours."]].forEach(function (zz) {
      var list = z[zz[0]], host = $(zz[1]), sg = list.map(function (e) { return e.id + "|" + e.title + "|" + e.sub + "|" + (e.cta ? e.cta.label : ""); }).join("§");
      if (host.dataset.sg !== sg) {
        host.dataset.sg = sg; host.innerHTML = "";
        if (!list.length) host.appendChild(el("p", "jr-empty", zz[4]));
        list.forEach(function (e, i) {
          var c = el("div", "jri k-" + e.kind + (zz[0] === "now" ? " act" : ""), '<div class="jr-t"><b></b><span></span></div><div class="jr-r"><span class="jr-l"></span><div class="meter jr-m"><i></i></div></div>' + (e.cta ? '<button class="btn jr-b can"></button>' : ""));
          c.querySelector("b").textContent = e.title; c.querySelector(".jr-t span").textContent = e.sub; if (e.p === null) c.querySelector(".jr-m").hidden = true;
          if (e.cta) { var b = c.querySelector(".jr-b"); b.textContent = e.cta.label; b.onclick = function () { if (e.cta.type === "claim") react(c, b, h.claim(e.cta.id)); else { show(e.cta.view); if (e.cta.target && e.cta.view === "map" && BL.mapUI) BL.mapUI.focus(e.cta.target); } }; }
          c._e = e; host.appendChild(c);
        });
      }
      Array.prototype.forEach.call(host.children, function (c, i) { var e = list[i]; if (!e || !c._e) return; c._e = e; set(c.querySelector(".jr-l"), e.left !== null ? fmtLeft(e.left) : e.p !== null ? Math.round(e.p * 100) + " %" : ""); if (e.p !== null) BL.bar(c.querySelector(".jr-m i"), Math.round(e.p * 100)); });
      set($(zz[2]), list.length ? "(" + list.length + ")" : ""); $(zz[3]).classList.toggle("empty", !list.length);
    });
    var lg = core ? core.journal() : [], lsg = lg.map(function (x) { return x.at + x.text + x.status; }).join("§"), lh = $("jrLog");
    if (lh && lh.dataset.sg !== lsg) { lh.dataset.sg = lsg; lh.innerHTML = ""; if (!lg.length) lh.appendChild(el("li", "", "Aucune notification pour l’instant.")); lg.forEach(function (x) { var li = el("li", ""); li.textContent = x.text + (x.status && x.status !== "affiché" ? " (" + x.status + ")" : ""); lh.appendChild(li); }); set($("jrLogN"), lg.length ? "(" + lg.length + ")" : ""); }
    if (BL.story && $("jrStoryL")) { var sl = BL.story.seenList(s), ssg = sl.map(function (c) { return c.t; }).join(","), sh = $("jrStoryL"); if (sh.dataset.sg !== ssg) { sh.dataset.sg = ssg; sh.innerHTML = ""; if (!sl.length) sh.appendChild(el("li", "muted", "Pas encore de chapitre : améliore un bâtiment jusqu’à son prochain design.")); sl.forEach(function (c) { var li = el("li", ""), h = el("b", "", "Palier « " + BL.economy.DESIGN_NAMES[c.t] + " » — " + c.title), p = el("p", "", c.lines.join(" ")), q = el("p", "chq", BL.story.name(c) + " : « " + c.react + " »"); li.appendChild(h); li.appendChild(p); li.appendChild(q); sh.appendChild(li); }); set($("jrStoryN"), "(" + sl.length + "/" + BL.story.count() + ")"); } }
    set($("jrGoN"), "(" + (z.goals.length + z.doing.filter(function (e) { return e.kind === "mission"; }).length + z.now.filter(function (e) { return e.kind === "mission"; }).length) + " missions restantes)");
  }
  /* ----- « Que faire maintenant ? » : 3 meilleures actions calculées par BL.advice, avec bouton direct ----- */
  function todoText(x) {
    var why = x.cost !== undefined && !x.can ? " · il te manque " + money(x.cost - ui.s.money) + (x.eta ? " (dans ~" + dur(x.eta) + ")" : "") : "";
    switch (x.kind) {
      case "conflict": return ["" + x.name + " est attaqué", "Décide vite : défendre ou négocier.", "Défendre"];
      case "claim": return ["Réclame : " + x.name, "Récompense : " + (x.reward.money ? "+" + money(x.reward.money) : "") + (x.reward.rep ? " +" + x.reward.rep + " réputation" : "") + (x.reward.infl ? " +" + x.reward.infl + " influence" : ""), "Réclamer"];
      case "event": return ["Événement : " + x.name, "Une décision t’attend.", "Décider"];
      case "upgrade": return [x.first ? "Construis : " + x.name : "Améliore " + x.name + (x.n > 1 ? " (bâtiment " + x.n + ")" : ""), "+" + money(x.gain) + "/s pour " + money(x.cost) + why, x.can ? (x.first ? "Construire" : "Améliorer") : "Voir"];
      case "build": return ["Construis un bâtiment : " + x.name + " (n° " + x.n + ")", money(x.cost) + " · il démarre au niveau 1" + why, x.can ? "Construire" : "Voir"];
      case "bonus": return ["Bonus permanent : " + x.name, "+" + money(x.gain) + "/s pour " + money(x.cost) + why, x.can ? "Acheter" : "Voir"];
      case "district": return ["Prends le quartier " + x.name, "Négocier : " + money(x.cost), "Voir"];
      case "crew": return ["Recrute : " + x.name, money(x.cost) + " · les équipiers actifs donnent des bonus", "Voir"];
      case "opready": return ["Opération terminée : " + x.name, "Le résultat t’attend : récupère-le.", "Voir"];
      case "rival": return [x.name + " menace " + x.dname, "Pression " + x.p + " % : calme le jeu ou renforce la défense.", "Voir"];
      case "heat": return ["Chaleur critique (" + x.v + " %)", "Une descente se prépare : pot-de-vin ou profil bas.", "Voir"];
      default: return ["Ton coffre est plein", "Agrandis-le pour stocker plus de lingots.", "Ouvrir"];
    }
  }
  function runAdvice(x) {
    var a = x.act, ok = true;
    if (a.type === "claim") ok = h.claim(a.id); else if (a.type === "buy") { if (x.can) ok = h.buyActivity(a.id, a.idx); else { show("map"); BL.mapUI && BL.mapUI.focus({ type: "lot", act: a.id, id: a.id + "#" + a.idx }); return; } }
    else if (a.type === "build") { if (x.can) ok = h.buyBuilding(a.id); else { show("map"); BL.mapUI && BL.mapUI.focus({ type: "lot", act: a.id, id: a.id + "#" + (x.n - 1) }); return; } }
    else if (a.type === "upg") { if (x.can) ok = h.buyUpgrade(a.id); else show("upg"); }
    else if (a.type === "go") { show(a.view); if (a.district && BL.terrUI) BL.terrUI.select(a.district); if (a.heat && BL.heatUI && BL.heatUI.open) BL.heatUI.open(); }
    ui.todoSig = null; if (ui.s) renderTodo(ui.s, true);
  }
  function renderTodo(s, force) {
    if (!BL.advice) return; var list = BL.advice.top(s, 3), can = list.filter(function (x) { return x.can; }).length, hosts = [$("todoList"), $("todoMapList")];
    var sg = list.map(function (x) { return x.id + (x.can ? "+" : "-") + (x.cost !== undefined ? Math.round(Math.log(1 + x.cost)) : "") + (x.eta ? Math.round(x.eta / 15) : ""); }).join("|");
    set($("todoN"), can ? String(can) : ""); $("todoBtn").classList.toggle("has", can > 0);
    if (!force && ui.todoSig === sg) return; ui.todoSig = sg;
    hosts.forEach(function (host) {
      host.innerHTML = ""; if (!list.length) { host.innerHTML = '<p class="muted">Rien d’urgent : laisse tes revenus s’accumuler. Un nouvel achat utile apparaîtra ici.</p>'; return; }
      list.forEach(function (x, i) {
        var tx = todoText(x), row = el("div", "ti"), b = el("button", "btn" + (x.can ? " can" : " ghost"), tx[2]); row.innerHTML = '<span class="tn" aria-hidden="true">' + (i + 1) + '</span><div class="tt"><b></b><span class="muted"></span></div>';
        row.querySelector("b").textContent = tx[0]; row.querySelector(".muted").textContent = tx[1]; b.onclick = function () { runAdvice(x); }; row.appendChild(b); host.appendChild(row);
      });
    });
  }
  /* ----- Glossaire consultable ----- */
  function renderGlossary(filter) {
    var G = BL.glossary, f = G.norm(filter || ""), box = $("gsList"), n = 0; box.innerHTML = "";
    G.list.forEach(function (g) {
      if (f && G.norm(g.term + " " + g.text + " " + g.labels.join(" ")).indexOf(f) < 0) return; n++;
      var dt = el("dt", "", ""), dd = el("dd", "", ""); dt.textContent = g.term; dd.textContent = g.text; dt.id = "gs_" + g.id; box.appendChild(dt); box.appendChild(dd);
    });
    $("gsEmpty").hidden = n > 0;
  }
  function renderEvent(s) {
    var box = $("event"), ev = s.pending && E.find(D.events, s.pending);
    box.className = ev ? "ev" : "";
    if (!ev) { box.innerHTML = '<div class="muted">Aucun événement en cours. Le prochain arrive dans environ ' + dur(Math.max(5, Math.ceil(Math.max(0, s.nextEvent - s.t) / 5) * 5)) + ".</div>"; return; }
    var ft = function (x) { return E.fText(x, s.pendingFac, s.pendingCrew); };
    box.innerHTML = '<div class="t">' + ft(ev.title) + '</div><div class="x">' + ft(ev.text) + '</div><div class="ch"></div>';
    ev.choices.forEach(function (c, i) {
      var nd = E.need(s, c), who = nd.who && BL.crew.get(nd.who), b = el("button", "btn" + (nd.ok ? "" : " gated"), ft(c.label) + "<small>" + E.hint(s, ev, i, money) + "</small>");
      if (c.need) { var n = el("small", "evn", ""); if (who) { var pp = el("span", "evp", ""); try { pp.innerHTML = BL.portraits.portrait(who.look, { label: who.name, id: who.id }); } catch (e) {} n.appendChild(pp); } var tx = el("span", "", ""); tx.textContent = nd.why; n.appendChild(tx); b.appendChild(n); }
      b.disabled = !nd.ok; b.onclick = function () { h.choose(i); }; box.querySelector(".ch").appendChild(b);
    });
  }
  /* C14 : 1 à 3 gros boutons du bilan de retour, tirés des mêmes conseils que « Que faire maintenant ? » (état réel uniquement) */
  function welcome(s) {
    if (!BL.advice) return []; return BL.advice.top(s, 3).map(function (x) { var tx = todoText(x); return { label: tx[0], sub: tx[1], btn: tx[2], run: function () { runAdvice(x); } }; });
  }
  BL.ui = { welcome: welcome, notices: function () { return core ? core.journal() : []; }, noticeStats: function () { return core ? core.stats() : null; }, quiet: function (ms) { if (core) core.quiet(ms); }, noticeCore: function () { return core; }, condText: condText, invalidate: function () { ui.evKey = null; ui.tick = 0; ui.todoSig = null; ui.osig = null; }, qmHtml: qmHtml, dur: dur, renderGlossary: renderGlossary, progressAll: progressAll, go: show, init: init, update: update, setNumbers: function (m) { numMode = m === "detailed" ? "detailed" : "short"; }, setTips: function (on) { ui.tips = !!on; if (BL.tip) BL.tip.enable(!!on); }, exact: exact, setToasts: function (on) { ui.toasts = on; }, toast: toast, fmt: fmt, money: money };
})(window);
