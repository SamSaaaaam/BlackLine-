/* Casino : intérieur plein écran (salle dessinée par le code) et trois jeux : machine à sous, roulette, blackjack.
   Toute la règle est dans BL.casino : ici on ne fait qu'afficher. Le résultat est connu, appliqué et SAUVEGARDÉ avant que l'animation ne commence. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, C, A;
  var X = { open: false, tab: "slots", bet: 0, busy: false, rk: "red", ra: null, hold: 0, hideHist: 0, from: null, did: null, rw: 0 }, el = {};
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function pct(x, d) { return String(Math.round(x * Math.pow(10, 2 + (d || 1))) / Math.pow(10, d || 1)).replace(".", ",") + " %"; }
  function motion() { return !doc.body.classList.contains("nomotion"); }
  function money(v) { return u.money(v); }
  function lim() { return C.limits(S); }
  function live(t) { if (el.live) el.live.textContent = t; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- construction ---------- */
  function build() {
    if (el.root) return; C = BL.casino; A = BL.casinoArt;
    var r = mk("div", "casino", ""); r.id = "casino"; r.hidden = true; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); r.setAttribute("aria-labelledby", "csTitle");
    r.innerHTML = A.symbols() + A.hall() +
      '<div class="cs-wrap"><header class="cs-h"><div class="cs-t"><h2 id="csTitle">Casino</h2><span class="cs-sub" id="csSub"></span></div>' +
      '<div class="cs-bal" aria-live="off"><span>Solde</span><b id="csBal"></b></div><button type="button" class="cs-x" id="csX" aria-label="Quitter le casino">&times;</button></header>' +
      '<div class="cs-fic" role="note"><span class="cs-fic-i" aria-hidden="true">' + BL.venues.badgeSvg("chip", "#f6e3a8", 40) + '</span><div class="cs-fic-t"><b>Jeu fictif · argent du jeu uniquement</b><span>Aucune valeur réelle. Les cotes sont celles de vraies règles : en moyenne, la maison gagne. Aucun lingot n’est jamais utilisé ici. Jeu responsable : c’est un jeu, fais des pauses.</span></div></div>' +
      '<nav class="cs-tabs" role="tablist" aria-label="Jeux"></nav><div class="cs-main"><section class="cs-game" id="csGame" role="tabpanel"></section><aside class="cs-side" id="csSide"></aside></div>' +
      '<div class="cs-live" id="csLive" role="status" aria-live="polite"></div></div>';
    doc.body.appendChild(r); el.root = r; el.bal = r.querySelector("#csBal"); el.sub = r.querySelector("#csSub"); el.game = r.querySelector("#csGame"); el.side = r.querySelector("#csSide"); el.live = r.querySelector("#csLive"); el.tabs = r.querySelector(".cs-tabs");
    [["slots", "Machines à sous"], ["roulette", "Roulette"], ["bj", "Blackjack"], ["night", "Soirée"]].forEach(function (t) {
      var b = mk("button", "cs-tab", t[1]); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.t = t[0]; b.onclick = function () { setTab(t[0]); };
      b.onkeydown = function (e) { var all = Array.prototype.slice.call(el.tabs.children), i = all.indexOf(b); if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]; n.click(); n.focus(); e.preventDefault(); } };
      el.tabs.appendChild(b);
    });
    r.querySelector("#csX").onclick = leave;
    r.addEventListener("keydown", function (e) { if (e.key === "Tab") trap(e); });
    /* Échap fonctionne même si le focus est retombé sur <body> après un re-rendu */
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && X.open) { e.preventDefault(); e.stopPropagation(); leave(); } }, true);
  }
  function trap(e) {
    var f = Array.prototype.filter.call(el.root.querySelectorAll("button,input,select,[tabindex]:not([tabindex='-1'])"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return;
    var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); }
  }
  function enter(opt) {
    if (!S || X.open) return; build(); var d = opt && opt.did ? BL.territory.dist(opt.did) : null;
    if (!C.available(S)) { u.toast("Construis d’abord un casino dans un quartier que tu contrôles.", "warn"); return; }
    X.from = doc.activeElement; X.open = true; X.busy = false; X.did = d ? d.id : null; X.hold = 0; X.hideHist = 0; X.base = S.casino ? S.casino.played : 0; X.sess = 0;
    u.set(el.sub, d ? d.name : "Port-Mirage"); el.root.hidden = false; el.root.classList.remove("in"); void el.root.offsetWidth; el.root.classList.add("in"); $("app").inert = true; doc.body.classList.add("incasino");
    if (BL.audio) { BL.audio.unlock && BL.audio.unlock(); BL.audio.sfx("open"); BL.audio.play && BL.audio.play("casino"); } if (BL.mapUI && BL.mapUI.visible) BL.mapUI.visible(false);
    setTab(C.init(S).round ? "bj" : X.tab, true); X.bet = Math.max(lim().min, Math.min(X.bet || 0, lim().max)); render(true);
    var t = el.tabs.querySelector(".on"); if (t) t.focus();
  }
  function leave() {
    if (!X.open) return; X.open = false; el.root.hidden = true; $("app").inert = false; doc.body.classList.remove("incasino"); sstop(); if (BL.audio) { BL.audio.stopSeqs && BL.audio.stopSeqs(); BL.audio.sfx("click"); BL.audio.play && BL.audio.play("game"); }
    if (BL.mapUI && BL.mapUI.visible && !$("v_map").hidden) BL.mapUI.visible(true); try { if (X.from && X.from.focus && doc.contains(X.from)) X.from.focus(); } catch (e) {}
  }
  function setTab(t, silent) {
    X.tab = t; Array.prototype.forEach.call(el.tabs.children, function (b) { var on = b.dataset.t === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    X.rk = X.rk || "red"; if (!silent) render(true); else el.game.dataset.built = "";
  }

  /* ---------- parties communes : solde, mise, historique ---------- */
  function balText() { return money(Math.max(0, S.money - X.hold)); }
  function betBox() {
    var L = lim(), ok = C.checkBet(S, X.bet), o = mk("div", "cs-bet", "");
    o.innerHTML = '<label class="cs-bl" for="csBet">Mise (argent du jeu)</label><div class="cs-bi"><input id="csBet" type="number" inputmode="numeric" min="' + L.min + '" max="' + L.max + '" step="1" value="' + X.bet + '"><span>$</span></div>' +
      '<div class="cs-chips" role="group" aria-label="Raccourcis de mise"><button type="button" data-b="min" data-sfx="chip">Min</button><button type="button" data-b="half" data-sfx="chip">½</button><button type="button" data-b="dbl" data-sfx="chips">×2</button><button type="button" data-b="max" data-sfx="chips">Max</button></div>' +
      '<p class="cs-lim">Minimum ' + money(L.min) + ' · maximum ' + money(L.max) + ' <small>(25 % du solde, 10 min de revenus)</small></p><p class="cs-err" id="csErr" role="alert">' + (ok.ok || busyNow() ? "" : ok.why) + "</p>";
    var inp = o.querySelector("input"); inp.oninput = function () { X.bet = Math.floor(Number(inp.value)); if (!isFinite(X.bet)) X.bet = 0; paintOk(); };
    Array.prototype.forEach.call(o.querySelectorAll(".cs-chips button"), function (b) { b.onclick = function () { var L2 = lim(), k = b.dataset.b; X.bet = k === "min" ? L2.min : k === "max" ? L2.max : k === "half" ? Math.floor(X.bet / 2) : X.bet * 2; X.bet = Math.max(L2.min, Math.min(L2.max, Math.floor(X.bet))); inp.value = X.bet; paintOk(); }; });
    return o;
  }
  /* après un tour (solde changé) : ramène la mise dans les limites ET met le champ à jour, jamais en silence pendant la saisie */
  function clampBet() { var L = lim(), b = Math.max(L.min, Math.min(L.max, Math.floor(X.bet) || L.min)); if (b !== X.bet) { X.bet = b; var i = $("csBet"); if (i) i.value = b; } }
  function busyNow() { return X.busy; }
  /* sons du casino (Partie 13 bis) : tout passe par BL.audio (synthèse, volume et coupure du joueur respectés, aucun son avant un geste) */
  function snd(n) { if (BL.audio && BL.audio.sfx) BL.audio.sfx(n); }
  function sseq(n, o) { return BL.audio && BL.audio.sequence ? BL.audio.sequence(n, o) : null; }
  function sstop() { if (X.snd && X.snd.stop) { X.snd.stop(); X.snd = null; } }
  function loseSnd() { setTimeout(function () { snd("loseCasino"); }, 80); }
  function paintOk() { var c = C.checkBet(S, X.bet), e = $("csErr"); if (e) e.textContent = c.ok ? "" : c.why; var go = el.root.querySelector("[data-go]"); if (go) go.disabled = X.busy || !c.ok || (X.tab === "bj" && !!S.casino.round && !isDone()); }
  function isDone() { return false; }
  function histBox() {
    var c = C.init(S), hist = c.hist.slice(X.hideHist), o = mk("div", "cs-hist", "");
    var net = c.net, nm = { slots: "Machine à sous", roulette: "Roulette", blackjack: "Blackjack" };
    o.innerHTML = '<h3>Bilan et 20 derniers tours</h3><p class="cs-net ' + (net >= 0 ? "up" : "down") + '">Depuis le début : ' + c.played + " tours · " + (net >= 0 ? "+" : "−") + money(Math.abs(net)) + "</p>" +
      (hist.length ? '<ol>' + hist.map(function (x) { return "<li><span>" + (nm[x.g] || x.g) + "</span><span>mise " + money(x.bet) + '</span><b class="' + (x.net > 0 ? "up" : x.net < 0 ? "down" : "") + '">' + (x.net > 0 ? "+" : x.net < 0 ? "−" : "") + money(Math.abs(x.net)) + "</b></li>"; }).join("") + "</ol>" : '<p class="muted">Aucun tour joué pour l’instant.</p>');
    return o;
  }
  function side(info) { el.side.innerHTML = ""; el.side.appendChild(info); el.side.appendChild(betBox()); el.side.appendChild(histBox()); }

  /* ---------- machine à sous ---------- */
  function slotsView() {
    var I = C.slotInfo(), T = I.reel.length, g = el.game; g.innerHTML = "";
    var m = mk("div", "slot", '<div class="sl-top"><span>JACKPOT ×' + I.max + '</span></div><div class="sl-lights" aria-hidden="true">' + new Array(15).join("<i></i>") + '</div><div class="sl-win" id="slWin"><div class="sl-line" aria-hidden="true"></div></div>');
    var win = m.querySelector("#slWin"); X.reels = [];
    for (var r = 0; r < 3; r++) {
      var rl = mk("div", "sl-reel", ""), st = mk("div", "sl-strip", ""), cells = []; for (var i = 0; i < T * 6; i++) cells.push('<div class="sl-c">' + A.sym(I.reel[i % T]) + "</div>"); st.innerHTML = cells.join(""); rl.appendChild(st); win.insertBefore(rl, win.lastChild);
      X.reels.push({ st: st, k: T + (X.last ? X.last[r] : r * 3) }); place(X.reels[r], X.reels[r].k, false);
    }
    g.appendChild(m); var go = mk("button", "cs-go", "Lancer"); go.type = "button"; go.dataset.go = "1"; go.dataset.sfx = "none"; go.onclick = spin; g.appendChild(go);
    var res = mk("div", "cs-res", ""); res.id = "csRes"; g.appendChild(res);
    var pt = mk("div", "cs-info", "<h3>Machines à sous</h3><p>Aligne trois symboles identiques. Retour théorique <b>" + pct(I.rtp) + "</b> · maison <b>" + pct(I.edge) + "</b> · gain sur <b>" + pct(I.hit) + "</b> des tours.</p><ul class=\"cs-pay\">" +
      I.order.map(function (k) { return "<li>" + A.sym(k) + A.sym(k) + A.sym(k) + "<b>×" + I.pay[k] + "</b></li>"; }).join("") + "<li>" + A.sym("C") + A.sym("C") + '<i class="sl-any">+ un autre</i><b>×' + I.twoCherries + "</b></li></ul><p class=\"muted\">Hasard pur : chaque tour est indépendant, il n’y a pas de série chaude.</p>");
    side(pt); paintOk();
  }
  function place(rl, k, anim, ms, delay) {
    var N = rl.st.children.length || 1; rl.k = k; rl.st.style.transition = anim ? "transform " + ms + "ms cubic-bezier(.12,.6,.16,1) " + (delay || 0) + "ms" : "none"; rl.st.style.transform = "translate3d(0," + (-(k - 1) / N * 100) + "%,0)";
  }
  function spin() {
    if (X.busy) return; var r = C.spinSlots(S, X.bet); if (!r.ok) { paintOk(); live(r.why); return; }
    h.casinoSaved(); X.busy = true; X.hold = r.win; X.hideHist = 1; $("csBal").textContent = balText(); var T = C.slotInfo().reel.length, anim = motion(); $("csRes").textContent = ""; el.root.querySelector(".slot").classList.remove("won"); paintOk();
    var done = 0; X.last = r.stops;
    X.reels.forEach(function (rl, i) { var ms = 1200 + i * 450;
      if (anim) { place(rl, T * 4 + r.stops[i], true, ms, 0); setTimeout(function () { place(rl, T + r.stops[i], false); if (++done === 3) finishSlots(r); }, ms + 60); } else { place(rl, T + r.stops[i], false); if (++done === 3) finishSlots(r); } });
    sstop(); X.snd = sseq("slots", { stops: anim ? [1.2, 1.65, 2.1] : [0.3, 0.4, 0.5] }) || (BL.audio && BL.audio.sfx("click"), null);
  }
  function finishSlots(r) {
    X.hold = 0; X.hideHist = 0; X.busy = false; var names = C.slotInfo().names, txt = r.symbols.map(function (k) { return names[k]; }).join(" · ");
    var m = el.root.querySelector(".slot"); if (r.win > 0) { if (m) m.classList.add("won"); snd(r.mult >= C.slotInfo().max ? "jackpot" : r.mult >= 20 ? "winBig" : r.mult >= 8 ? "winMed" : "winSmall"); } else loseSnd();
    var res = $("csRes"); if (res) { res.className = "cs-res " + (r.win > 0 ? "up" : "down"); res.textContent = r.win > 0 ? "Gagné : +" + money(r.win - r.bet) + " (×" + r.mult + ")" : "Perdu : −" + money(r.bet); } live(txt + ". " + (r.win > 0 ? "Gain " + money(r.win) + "." : "Perdu."));
    clampBet(); render(false);
  }

  /* ---------- roulette ---------- */
  var OUT = [["red", null, "Rouge"], ["black", null, "Noir"], ["even", null, "Pair"], ["odd", null, "Impair"], ["low", null, "1–18"], ["high", null, "19–36"], ["dozen", 1, "1re douzaine"], ["dozen", 2, "2e douzaine"], ["dozen", 3, "3e douzaine"], ["column", 1, "Colonne 1"], ["column", 2, "Colonne 2"], ["column", 3, "Colonne 3"]];
  function rouletteView() {
    var I = C.rouletteInfo(), g = el.game; g.innerHTML = "";
    var w = mk("div", "rl-wheel", A.wheel(I.wheel, C.color)); g.appendChild(w); X.wheel = w.querySelector(".rw-rot"); X.ball = w.querySelector(".rw-ball"); spinStyle(X.wheel, X.rw, false); spinStyle(X.ball, 0, false);
    var ban = mk("div", "cs-res", ""); ban.id = "csRes"; g.appendChild(ban);
    var grid = mk("div", "rl-grid", ""); grid.setAttribute("role", "group"); grid.setAttribute("aria-label", "Numéros");
    var z = mk("button", "rl-n green", "0"); z.type = "button"; z.dataset.k = "straight"; z.dataset.a = "0"; grid.appendChild(z);
    for (var n = 1; n <= 36; n++) { var b = mk("button", "rl-n " + C.color(n), String(n)); b.type = "button"; b.dataset.k = "straight"; b.dataset.a = String(n); grid.appendChild(b); }
    var out = mk("div", "rl-out", ""); out.setAttribute("role", "group"); out.setAttribute("aria-label", "Paris extérieurs");
    OUT.forEach(function (o) { var b = mk("button", "rl-o", o[2]); b.type = "button"; b.dataset.k = o[0]; if (o[1]) b.dataset.a = String(o[1]); out.appendChild(b); });
    g.appendChild(grid); g.appendChild(out);
    Array.prototype.forEach.call(g.querySelectorAll("[data-k]"), function (b) { b.setAttribute("aria-pressed", "false"); b.dataset.sfx = "chip"; b.onclick = function () { X.rk = b.dataset.k; X.ra = b.dataset.a === undefined ? null : Number(b.dataset.a); markRoulette(); sideRoulette(); }; });
    var go = mk("button", "cs-go", "Lancer la bille"); go.type = "button"; go.dataset.go = "1"; go.dataset.sfx = "none"; go.onclick = rspin; g.appendChild(go);
    markRoulette(); sideRoulette();
  }
  function bname() { var k = X.rk, a = X.ra; return k === "straight" ? "Plein " + a : k === "dozen" ? a + (a === 1 ? "re" : "e") + " douzaine" : k === "column" ? "Colonne " + a : ({ red: "Rouge", black: "Noir", even: "Pair", odd: "Impair", low: "Manque 1–18", high: "Passe 19–36" })[k]; }
  function markRoulette() { Array.prototype.forEach.call(el.game.querySelectorAll("[data-k]"), function (b) { var on = b.dataset.k === X.rk && (b.dataset.a === undefined ? null : Number(b.dataset.a)) === X.ra; b.classList.toggle("sel", on); b.setAttribute("aria-pressed", String(on)); }); }
  function sideRoulette() {
    var I = C.rouletteInfo(), k = I.kinds[X.rk];
    var pt = mk("div", "cs-info", "<h3>Roulette européenne</h3><p>Un seul zéro (37 cases) : la maison garde <b>" + pct(I.edge, 2) + "</b> sur chaque pari, quel qu’il soit.</p><p class=\"cs-pick\">Pari choisi : <b>" + bname() + "</b> · paie " + k.pay + " pour 1 · chance " + pct(k.chance) + ".</p>");
    side(pt); paintOk();
  }
  function spinStyle(e, deg, anim, ms) { e.style.transition = anim ? "transform " + ms + "ms cubic-bezier(.1,.55,.15,1)" : "none"; e.style.transform = "rotate(" + deg + "deg)"; }
  function rspin() {
    if (X.busy) return; var r = C.spinRoulette(S, X.bet, X.rk, X.ra); if (!r.ok) { paintOk(); live(r.why); return; }
    h.casinoSaved(); X.busy = true; X.hold = r.win; X.hideHist = 1; $("csBal").textContent = balText(); $("csRes").textContent = ""; paintOk();
    var step = 360 / 37, target = X.rw - (X.rw % 360) + 360 * 6 - r.pocket * step;
    if (motion()) { spinStyle(X.wheel, target, true, 4600); spinStyle(X.ball, -1440, true, 4600); setTimeout(function () { X.rw = target; spinStyle(X.ball, 0, false); finishRoulette(r); }, 4700); }
    else { X.rw = target; spinStyle(X.wheel, target, false); finishRoulette(r); }
    sstop(); X.snd = sseq("roulette", { dur: motion() ? 4.6 : 0.9 }) || (BL.audio && BL.audio.sfx("click"), null);
  }
  function finishRoulette(r) {
    X.hold = 0; X.hideHist = 0; X.busy = false; var cn = { red: "rouge", black: "noir", green: "vert" }[r.color];
    var res = $("csRes"); if (res) { res.className = "cs-res " + (r.win > 0 ? "up" : "down"); res.innerHTML = '<span class="rl-b ' + r.color + '">' + r.n + "</span> " + cn + " · " + (r.win > 0 ? "gagné : +" + money(r.win - r.bet) : "perdu : −" + money(r.bet)); }
    if (r.win > 0) snd(r.win >= r.bet * 20 ? "winBig" : r.win >= r.bet * 3 ? "winMed" : "winSmall"); else loseSnd(); live("Numéro " + r.n + ", " + cn + ". " + (r.win > 0 ? "Gain " + money(r.win) + "." : "Perdu.")); clampBet(); render(false);
  }

  /* ---------- blackjack ---------- */
  function bjView() {
    var g = el.game; g.innerHTML = ""; var B = C.bjInfo();
    var t = mk("div", "bj", '<div class="bj-arc" aria-hidden="true"></div><div class="bj-row dealer"><h3>Croupier <small id="bjDt"></small></h3><div class="bj-cards" id="bjD"></div></div><div class="bj-row player"><h3>Toi <small id="bjPt"></small></h3><div class="bj-cards" id="bjP"></div></div>');
    g.appendChild(t); var res = mk("div", "cs-res", ""); res.id = "csRes"; g.appendChild(res);
    var acts = mk("div", "bj-acts", ""); acts.innerHTML = '<button type="button" class="cs-go" data-go="1" id="bjDeal" data-sfx="none">Distribuer</button><button type="button" id="bjHit" data-sfx="none">Tirer</button><button type="button" id="bjStand" data-sfx="none">Rester</button><button type="button" id="bjDbl" data-sfx="none">Doubler</button>'; g.appendChild(acts);
    $("bjDeal").onclick = bjDeal; $("bjHit").onclick = function () { bjAct("hit"); }; $("bjStand").onclick = function () { bjAct("stand"); }; $("bjDbl").onclick = function () { bjAct("double"); };
    var pt = mk("div", "cs-info", "<h3>Blackjack</h3><p>Approche 21 sans le dépasser. Blackjack payé <b>3 pour 2</b> ; le croupier s’arrête sur 17.</p><p class=\"muted\">Doublage sur les 2 premières cartes, pas de séparation. Maison ≈ <b>" + pct(B.edge) + "</b> en jeu optimal.</p>");
    side(pt); bjPaint(null); paintOk();
  }
  function cardsHtml(list, hidden) { return list.map(function (c, i) { return A.card(c, false); }).join("") + (hidden ? A.card(0, true) : ""); }
  function bjPaint(final) {
    var v = final ? final.view : C.view(S), P = $("bjP"), D = $("bjD"); if (!P) return;
    if (!v) { P.innerHTML = ""; D.innerHTML = ""; u.set($("bjPt"), ""); u.set($("bjDt"), ""); }
    else { P.innerHTML = cardsHtml(v.p); D.innerHTML = cardsHtml(v.d, v.hidden); u.set($("bjPt"), "· " + v.pt); u.set($("bjDt"), v.hidden ? "· " + v.dt + " + carte cachée" : "· " + v.dt); if (motion()) Array.prototype.forEach.call(el.game.querySelectorAll(".pc"), function (c, i) { c.style.animationDelay = (i * 60) + "ms"; c.classList.add("deal"); }); }
    var active = !!(S.casino.round) && !final; $("bjHit").hidden = $("bjStand").hidden = !active; $("bjDbl").hidden = !active; $("bjDeal").hidden = active; var vv = C.view(S); if (active && vv) $("bjDbl").disabled = !vv.canDouble;
    paintOk();
  }
  function bjFinish(o) {
    var names = { blackjack: "Blackjack ! Payé 3 pour 2", win: "Gagné", push: "Égalité : mise rendue", lose: "Perdu", bust: "Dépassé 21 : perdu", dealerbj: "Le croupier a un blackjack" };
    bjPaint(o); var res = $("csRes"); res.className = "cs-res " + (o.net > 0 ? "up" : o.net < 0 ? "down" : ""); res.textContent = names[o.result] + " · " + (o.net > 0 ? "+" + money(o.net) : o.net < 0 ? "−" + money(-o.net) : "0 $");
    bjResultSnd(o); live(res.textContent); X.busy = false; clampBet(); render(false, true);
  }
  /* le croupier retourne sa carte puis tire : le résultat sonne après ces cartes */
  function bjResultSnd(o) {
    var v = o.view || (C.view(S) || null), drawn = v && v.d ? Math.max(0, v.d.length - 2) : 0, flip = o.result !== "bust" && o.result !== "blackjack" && !X.bjQuick, delay = (flip ? 0.25 + drawn * 0.18 : 0.15) * 1000;
    if (flip) { var k = sseq("deal", { n: Math.max(1, drawn), gap: 0.18, delay: 0.05 }); if (!k) snd("cardFlip"); }
    setTimeout(function () { var r = o.result; snd(r === "blackjack" ? "bjwin" : r === "bust" ? "bust" : o.net > 0 ? "winSmall" : r === "push" ? "chip" : "loseCasino"); }, delay);
  }
  function bjDeal() {
    if (X.busy) return; var o = C.bjStart(S, X.bet); if (!o.ok) { paintOk(); live(o.why); return; } h.casinoSaved(); $("csRes").textContent = ""; $("csRes").className = "cs-res";
    sstop(); X.bjQuick = !!o.done; X.snd = sseq("deal", { n: 4, gap: 0.17, shuffle: !X.dealt || X.dealt % 8 === 0 }) || (BL.audio && BL.audio.sfx("click"), null); X.dealt = (X.dealt || 0) + 1; if (o.done) { bjFinish(o); } else bjPaint(null); X.bjQuick = false; render(false, true);
  }
  function bjAct(a) { if (X.busy) return; var o = C.bjAct(S, a); if (!o.ok) { live(o.why); return; } h.casinoSaved(); if (a === "double") snd("chips"); if (a === "hit" || a === "double") { var q = sseq("deal", { n: 1, gap: 0.1 }); if (!q) snd("cardDeal"); } X.bjQuick = a === "hit" && !!o.done && o.result === "bust"; if (o.done) bjFinish(o); else bjPaint(null); X.bjQuick = false; render(false, true); }

  /* ---------- rendu ---------- */
  function render(full, soft) {
    if (!X.open) return; $("csBal").textContent = balText();
    if (soft) { var hist = el.side.querySelector(".cs-hist"); if (hist) el.side.replaceChild(histBox(), hist); paintOk(); return; }
    var sig = X.tab; if (X.tab === "night") { nightView(); return; }
    if (full || el.game.dataset.built !== sig) { el.game.dataset.built = sig; if (X.tab === "slots") slotsView(); else if (X.tab === "roulette") rouletteView(); else bjView(); }
    else { var hs = el.side.querySelector(".cs-hist"); if (hs) el.side.replaceChild(histBox(), hs); var bl = el.side.querySelector(".cs-bet"); if (bl && !doc.activeElement.closest(".cs-bet")) el.side.replaceChild(betBox(), bl); paintOk(); }
  }
  /* ---------- Soirée (Partie 13 · C6) : client VIP, tournoi, blanchiment, rappel de jeu responsable ---------- */
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nightSig() { var V = BL.casinoEv, x = V.state(S), ti = V.tourInfo(S); return [x.vip && x.vip.id, Math.floor(S.t / 15), ti.state, ti.pts, V.whyWash(S), V.whyJoin(S), X.sess >= BL.data.casinoEv.params.remindEvery].join("|"); }
  function nightView() {
    if (!BL.casinoEv) return; var g = nightSig(); if (el.game.dataset.built === "night" && el.game.dataset.sig === g) return; var V = BL.casinoEv, p = BL.data.casinoEv.params, ti = V.tourInfo(S), vip = V.vipNow(S), o = "";
    o += '<section class="cv-card"><h3>Client VIP</h3>';
    if (vip) { o += "<p><b>" + esc(vip.vip.name) + "</b> est à ta porte (encore " + Math.ceil(vip.left / 60) + " min). " + esc(vip.vip.text) + '</p><div class="cv-opts">'; vip.opts.forEach(function (q) { o += '<button type="button" class="cv-o" data-cev="vip" data-id="' + q.id + '"><b>' + esc(q.label) + "</b><span>" + esc(q.text) + "</span><small>" + (q.gain ? "+" + money(q.gain) + " · " : "") + (q.heat ? "chaleur +" + q.heat : "aucune chaleur") + "</small></button>"; }); o += "</div>"; }
    else o += "<p class=\"cv-mut\">Aucun client VIP pour l’instant. Ils passent de temps en temps : ils rapportent, mais les voitures noires attirent la police.</p>";
    o += '</section><section class="cv-card"><h3>Tournoi</h3>';
    if (ti.state === "wait") o += '<p class="cv-mut">Prochain tournoi dans ' + Math.ceil(ti.in / 60) + " min de jeu.</p>";
    else if (ti.state === "open") o += "<p>Un tournoi est ouvert : inscription " + money(ti.entry) + ". Chaque partie jouée avec une mise d’au moins " + money(ti.minBet) + " vaut 1 point (+1 si elle est gagnée), pendant " + Math.round(p.tourLenSec / 60) + " minutes. Miser plus gros ne donne pas plus de points. Palmarès : " + ti.tiers.map(function (q) { return q.name + " " + q.pts + " pts = " + money(q.prize); }).join(" · ") + '.</p><button type="button" class="btn buy" data-cev="join"' + (V.whyJoin(S) ? " disabled" : "") + ">S’inscrire</button>" + (V.whyJoin(S) ? '<small class="cv-mut">' + esc(V.whyJoin(S)) + "</small>" : "");
    else if (ti.state === "on") o += "<p><b>" + ti.pts + " point" + (ti.pts > 1 ? "s" : "") + "</b> · encore " + Math.ceil(ti.left / 60) + " min. Palier actuel : " + (ti.tier >= 0 ? ti.tiers[ti.tier].name : "aucun") + ". Mise minimale : " + money(ti.minBet) + ".</p>";
    else o += "<p>Tournoi terminé : <b>" + ti.pts + " points</b> (" + (ti.tier >= 0 ? ti.tiers[ti.tier].name + ", prix " + money(ti.tiers[ti.tier].prize) : "pas de palier") + ').</p><button type="button" class="btn buy" data-cev="claim">Récupérer</button>';
    o += '</section><section class="cv-card"><h3>Blanchir l’argent sale</h3><p>Frais ' + money(V.mins(S, p.washCostMin)) + " pour faire baisser la chaleur de " + p.washHeat + " points (toutes les " + Math.round(p.washCdSec / 60) + ' min).</p><button type="button" class="btn buy" data-cev="wash"' + (V.whyWash(S) ? " disabled" : "") + ">Blanchir</button>" + (V.whyWash(S) ? '<small class="cv-mut">' + esc(V.whyWash(S)) + "</small>" : "") + "</section>";
    el.game.innerHTML = o; el.game.dataset.built = "night"; el.game.dataset.sig = g; el.game.onclick = nightClick;
    var rem = X.sess >= p.remindEvery; el.side.innerHTML = '<div class="cs-info cv-rg"><h3>Jeu responsable</h3><p>Argent du jeu uniquement, aucune valeur réelle. En moyenne, la maison gagne.' + (rem ? " <b>Tu as joué " + X.sess + " parties depuis ton arrivée : et si tu faisais une pause ?</b>" : " Fais des pauses.") + "</p></div>";
  }
  function nightClick(e) {
    var b = e.target.closest("[data-cev]"); if (!b || b.disabled) return; var a = b.dataset.cev, r;
    if (a === "vip") { r = h.cevServe(b.dataset.id); live(r ? (r.gain ? "Client servi : +" + money(r.gain) + ", chaleur +" + r.heat + "." : "Client décliné.") : "Impossible."); } else if (a === "join") { r = h.cevJoin(); live(r ? "Inscrit au tournoi." : "Impossible."); }
    else if (a === "claim") { r = h.cevClaim(); live(r ? (r.prize ? "Prix : +" + money(r.prize) + "." : "Pas de prix cette fois.") : "Impossible."); } else if (a === "wash") { r = h.cevWash(); live(r ? "Argent lavé : chaleur −" + r.drop + "." : "Impossible."); }
    el.game.dataset.sig = ""; nightView();
  }
  function update(s) { S = s; if (X.open && s.casino) { if (X.base === undefined) X.base = s.casino.played; X.sess = Math.max(0, s.casino.played - X.base); } if (X.open && X.tab === "night") nightView(); if (!X.open) return; var b = $("csBal"); if (b) { var t = balText(); if (b.textContent !== t) b.textContent = t; } if (!X.busy) paintOk(); }
  function init(handlers, util) { h = handlers; u = util; }
  BL.casinoUI = { init: init, update: update, enter: enter, leave: leave, isOpen: function () { return X.open; }, state: function () { return { tab: X.tab, busy: X.busy, bet: X.bet }; } };
})(window);
