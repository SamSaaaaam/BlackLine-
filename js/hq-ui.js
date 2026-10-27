/* QG : coffre à lingots (phase 2). DOM construit une fois, mises à jour ciblées. */
(function (root) {
  var BL = root.BL = root.BL || {}, G, u, h, ui = { drawn: -1, shown: -1, anim: 0, lastGold: null, sg: "" };
  var ROWS = [6, 5, 4, 3, 2, 1], TOTAL = 21;
  /* pile d'ingots : n ingots dessinés (0..21), le dernier posé peut s'animer */
  function stack(n, fresh) {
    var o = '<svg viewBox="0 0 220 150" class="ingots" role="img" aria-label="' + n + ' lingots dessinés dans le coffre"><ellipse cx="110" cy="138" rx="96" ry="9" fill="rgba(0,0,0,.45)"/>', k = 0, r, i;
    for (r = 0; r < ROWS.length; r++) {
      var cnt = ROWS[r], y = 124 - r * 19, x0 = 110 - cnt * 17;
      for (i = 0; i < cnt; i++) {
        if (k >= n) break; var x = x0 + i * 34 + 1, last = k === n - 1 && fresh;
        o += '<g class="ing' + (last ? " drop" : "") + '"><path d="M' + (x + 4) + " " + y + "h24l5 -15h-34z\" transform=\"translate(0 15)\" fill=\"url(#gGold)\" stroke=\"#6f5b32\" stroke-width=\"1\"/><path d=\"M" + (x + 6) + " " + (y + 2) + "h20l3 -9h-26z\" fill=\"url(#gGoldD)\" opacity=\".55\"/><path d=\"M" + (x + 3) + " " + (y + 6) + "h8l4 -4h-8z\" fill=\"#fff\" opacity=\".35\"/></g>";
        k++;
      }
    }
    return o + "</svg>";
  }
  function build() {
    var v = u.$("v_hq");
    v.innerHTML =
      '<div class="hqgrid">' +
      '<div class="card vault" id="vaultCard"><div class="ah"><div class="an"><div class="nm">Coffre du QG</div><div class="ds">Tes lingots d’or sont gardés ici.</div></div><span class="badge" id="vLvl"></span></div>' +
      '<div class="vstack" id="vStack" tabindex="0"></div>' +
      '<div class="vcount"><b id="vNum">0</b><span> / <span id="vCap">100</span> lingots</span></div>' +
      '<span class="meter"><i id="vBar"></i></span>' +
      '<p class="muted vnote">Les lingots servent uniquement au QG et à la boutique. Ils ne rapportent rien et n’achètent jamais d’activité.</p>' +
      '<button class="btn" id="vUp"><span class="bt"></span><small class="bs"></small></button></div>' +
      '<div class="card conv"><div class="ah"><div class="an"><div class="nm">Convertir des dollars en lingots</div><div class="ds">Sens unique : un lingot ne se rend pas en dollars.</div></div></div>' +
      '<div class="cv-ex" aria-live="polite"><div class="cv-s"><small>Tu donnes</small><b id="cvGive">$0</b></div><span class="cv-ar" aria-hidden="true">→</span><div class="cv-s r"><small>Tu reçois</small><b id="cvGet"><i class="ingot-i"></i>0</b></div></div>' +
      '<div class="cv-q"><button class="btn cv-step" id="cvMinus" aria-label="Un lingot de moins">−</button><label class="cv-in"><span class="sr">Nombre de lingots</span><input type="number" id="cvN" min="1" step="1" value="1" inputmode="numeric"></label><button class="btn cv-step" id="cvPlus" aria-label="Un lingot de plus">+</button></div>' +
      '<input type="range" id="cvR" min="1" max="1" value="1" aria-label="Quantité de lingots">' +
      '<div class="cv-quick" id="cvQuick"></div>' +
      '<dl class="dl cv-d" id="cInfo"></dl><p class="cv-why" id="cvErr" role="status"></p>' +
      '<button class="btn cv-go" id="cvGo"><span class="bt"></span><small class="bs"></small></button><p class="muted vnote" id="cWhy"></p></div>' +
      "</div>";
    ui.btn = {}; ui.qty = 1;
    var setQ = function (n) { var mx = Math.max(1, G.maxBuy(ui.s) || 1); n = Math.floor(+n); if (!(n >= 1)) n = 1; ui.qty = Math.min(n, Math.max(mx, G.space(ui.s) >= 1 ? n : 1), 1e6); ui.sgq = null; update(ui.s); };
    [["1", 1], ["5", 5], ["10", 10], ["25", 25], ["max", 0]].forEach(function (d) {
      var b = u.el("button", "btn cv-qb", d[0] === "max" ? "Max" : "×" + d[0]); b.dataset.nosfx = "1"; b.type = "button"; u.$("cvQuick").appendChild(b); ui.btn[d[0]] = b;
      b.onclick = function () { setQ(d[1] || Math.max(1, G.maxBuy(ui.s))); try { localStorage.setItem("blackline.cvq", String(d[1] || 0)); } catch (e) {} };
    });
    u.$("cvMinus").onclick = function () { setQ(ui.qty - 1); }; u.$("cvPlus").onclick = function () { setQ(ui.qty + 1); };
    u.$("cvN").oninput = function () { setQ(this.value); }; u.$("cvR").oninput = function () { setQ(this.value); };
    u.$("cvGo").onclick = function () { var s = ui.s, q = G.quote(s, ui.qty); if (q.ok) pulse(u.$("cvGo"), h.convertGold(q.n)); };
    u.$("vUp").onclick = function () { pulse(u.$("vUp"), h.upgradeVault()); };
    u.$("cWhy").textContent = "Pourquoi ce prix ? Tous les lingots d’un achat coûtent le même prix, et il ne monte pas quand tu en achètes. Il vaut " + Math.round(BL.gold.P.priceSec / 60) + " minutes de ton revenu, avec un minimum de " + u.money(BL.gold.P.basePrice) + " : il suit ta progression pour que les lingots restent rares et que les boosts restent un vrai choix. Aucune commission.";
  }
  function pulse(b, ok) { if (ok === false) return; b.classList.remove("ok"); void b.offsetWidth; b.classList.add("ok"); }
  function setBtn(b, title, sub, off) { u.set(b.t, title); u.set(b.s, sub || ""); b.s.hidden = !sub; if (b.disabled !== off) b.disabled = off; b.classList.toggle("can", !off); }
  function update(s) {
    ui.s = s; if (!ui.built) return; var cap = G.capacity(s), g = s.gold, n, nx = G.nextPrice(s);
    /* compteur animé : rattrape la vraie valeur */
    if (ui.shown < 0) ui.shown = g; if (ui.lastGold !== null && g > ui.lastGold) ui.anim = 24; ui.lastGold = g;
    if (ui.shown < g) ui.shown = Math.min(g, ui.shown + Math.max(1, Math.ceil((g - ui.shown) / 3))); else if (ui.shown > g) ui.shown = g;
    if (!root.document.getElementById("v_hq").hidden) {
      var drawn = g <= 0 ? 0 : Math.max(1, Math.round(g / cap * TOTAL)), fresh = ui.anim > 0; ui.anim = Math.max(0, ui.anim - 1);
      var sg = drawn + (fresh ? "f" : ""); if (sg !== ui.sg) { ui.sg = sg; u.$("vStack").innerHTML = stack(drawn, fresh); }
      u.set(u.$("vNum"), String(ui.shown)); u.set(u.$("vCap"), String(cap)); BL.bar(u.$("vBar"), Math.min(100, g / cap * 100));
      var tp = "Valeur exacte : " + g + " lingot" + (g > 1 ? "s" : "") + " sur " + cap + " de capacité"; var vs = u.$("vStack"); if (vs.title !== tp) vs.title = tp;
      u.set(u.$("vLvl"), "Coffre niveau " + (s.vault + 1) + " / " + (G.P.maxVault + 1));
      var vc = G.vaultCost(s), ub = u.$("vUp"); ub.t = ub.t || ub.firstChild; ub.s = ub.s || ub.lastChild;
      if (vc === 0) setBtn(ub, "Coffre au maximum", "", true); else setBtn(ub, "Agrandir le coffre (+" + G.P.capPerLevel + ")", vc + " lingots" + (g < vc ? " · il t’en manque " + (vc - g) : ""), g < vc);
      u.$("vNum").parentNode.title = tp;
      var sp = G.space(s), mx = G.maxBuy(s), q = G.quote(s, ui.qty), cap0 = Math.max(1, Math.min(sp, Math.max(mx, 1)));
      if (ui.qty > Math.max(1, sp)) ui.qty = Math.max(1, sp), q = G.quote(s, ui.qty);
      var sg = [q.n, q.cost, q.ok, s.money > 1e15 ? 0 : Math.floor(s.money / Math.max(1, nx)), sp].join("|");
      if (sg !== ui.sgq) {
        ui.sgq = sg; u.set(u.$("cvGive"), u.money(q.cost)); u.$("cvGet").innerHTML = '<i class="ingot-i"></i>' + q.n;
        var inp = u.$("cvN"); if (root.document.activeElement !== inp) inp.value = String(q.n); inp.max = String(Math.max(1, sp)); var r = u.$("cvR"); r.max = String(cap0); r.value = String(Math.min(q.n, cap0)); r.disabled = cap0 < 2;
        u.$("cvMinus").disabled = q.n <= 1; u.$("cvPlus").disabled = q.n >= sp;
        u.$("cInfo").innerHTML = [["Prix d’un lingot", u.money(q.price)], ["Total pour ce lot", u.money(q.cost)], ["Argent après conversion", u.money(Math.max(0, q.left))], ["Lingots après conversion", (q.goldAfter) + " / " + cap], ["Achetables maintenant", String(mx)]].map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
        var go = u.$("cvGo"); go.t = go.t || go.firstChild; go.s = go.s || go.lastChild;
        setBtn(go, q.ok ? "Confirmer : " + q.n + " lingot" + (q.n > 1 ? "s" : "") : "Conversion impossible", q.ok ? "pour " + u.money(q.cost) : (s.money + 1e-9 < q.cost && sp >= q.n ? "Il te manque " + u.money(q.cost - s.money) : q.why), !q.ok);
        u.set(u.$("cvErr"), q.ok ? "" : q.why);
        Object.keys(ui.btn).forEach(function (k) { var d = k === "max" ? Math.max(1, mx) : +k; ui.btn[k].classList.toggle("on", q.n === d); ui.btn[k].disabled = d > sp || sp < 1; });
      }
    }
  }
  function init(handlers, util) {
    G = BL.gold; h = handlers; u = util; build(); ui.built = true;
    u.$("vStack").innerHTML = stack(0, false);
  }
  BL.hqUI = { init: init, update: update, stack: stack };
})(window);
