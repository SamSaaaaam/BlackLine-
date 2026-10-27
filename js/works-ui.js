/* Partie 17 · D : interface des chantiers. Aucune règle ici (tout est dans BL.works) ; les boutons appellent les vraies actions de main.js.
   - Carte « Chantiers » (vue Empire + panneau repliable sur la carte) : ouvriers, file d'attente, progression, temps restant, Contremaître, pot-de-vin.
   - Sur la carte : échafaudage, grue, camion, ouvriers, étincelles et poussière dessinés en SVG/CSS au-dessus du bâtiment, barre et temps restant.
   - Fin de chantier : inauguration (ruban, lumière) au-dessus du bâtiment ; bruit de chantier discret (synthèse locale) tant que la carte montre un chantier.
   Mouvements réduits / effets bas : aucune animation (dessins fixes). Aucun son si « Aucune ambiance » ou son coupé. Aucune image externe. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h = null, S = null, u = null, cards = [], over = null, sites = {}, lastSound = 0, sheetFor = null;
  function W() { return BL.works; } function E() { return BL.economy; }
  function $(id) { return doc.getElementById(id); }
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function dur(x) { return BL.sysUI ? BL.sysUI.dur(Math.ceil(x)) : Math.ceil(x) + " s"; }
  function money(n) { return BL.ui && BL.ui.money ? BL.ui.money(n) : String(Math.round(n)); }
  function act(id) { return E().find(BL.data.activities, id); }
  function still() { var b = doc.body; return b.classList.contains("nomotion") || b.classList.contains("lowfx") || (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function sett() { return BL.main && BL.main.settings ? BL.main.settings() : {}; }
  function label(e) { var a = act(e.id); return e.to === 1 ? (e.i ? a.name + " · nouveau bâtiment " + (e.i + 1) : a.name + " · construction") : a.name + " · bât. " + (e.i + 1) + " → niv. " + e.to; }

  /* ---- dessin du chantier (SVG, statique ; les classes w-* sont animées par la feuille de style si les mouvements sont permis) ---- */
  function art(small) {
    return '<svg class="wart' + (small ? " sm" : "") + '" viewBox="0 0 120 90" aria-hidden="true">'
      + '<ellipse cx="60" cy="82" rx="54" ry="7" fill="#000" opacity=".35"/>'
      + '<g class="w-dust"><circle cx="22" cy="78" r="6" fill="#b9a68a" opacity=".35"/><circle cx="96" cy="79" r="5" fill="#b9a68a" opacity=".3"/></g>'
      + '<rect x="38" y="34" width="44" height="46" fill="#3a3f4a"/><rect x="38" y="34" width="44" height="6" fill="#4b5260"/>'
      + '<g stroke="#d9a441" stroke-width="1.6"><path d="M34 80V28M86 80V28M34 44H86M34 60H86M34 76H86M34 28H86"/><path d="M34 44L50 28M50 44L66 28M66 44L86 28M34 60L50 44M50 60L66 44M66 60L86 44" opacity=".55"/></g>'
      + '<g class="w-crane"><path d="M96 82V12M96 14H40M96 14L112 22H96" stroke="#f0c24a" stroke-width="2.4" fill="none"/><path d="M93 82h6M90 30h12" stroke="#f0c24a" stroke-width="2"/>'
      + '<g class="w-hook"><path d="M58 14V30" stroke="#cfd5de" stroke-width=".9"/><rect x="52" y="30" width="12" height="5" fill="#8a6a3a"/></g></g>'
      + '<g class="w-truck"><rect x="4" y="70" width="20" height="9" rx="1.5" fill="#e0a83a"/><rect x="18" y="66" width="9" height="8" rx="1.5" fill="#c98f26"/><rect x="20" y="67.5" width="5" height="3.5" fill="#9fd3ff" opacity=".8"/><circle cx="9" cy="80" r="2.6" fill="#151820"/><circle cx="21" cy="80" r="2.6" fill="#151820"/></g>'
      + '<g class="w-man"><circle cx="47" cy="47" r="2.2" fill="#f0c24a"/><rect x="45.4" y="49" width="3.2" height="7" rx="1" fill="#e06a2a"/></g>'
      + '<g class="w-man b"><circle cx="72" cy="63" r="2.2" fill="#f0c24a"/><rect x="70.4" y="65" width="3.2" height="7" rx="1" fill="#e06a2a"/></g>'
      + '<g class="w-spark"><circle cx="76" cy="56" r="1.3" fill="#fff3b0"/><circle cx="79" cy="53" r=".9" fill="#ffd36a"/><circle cx="74" cy="52" r=".8" fill="#ffd36a"/></g>'
      + '<path d="M28 80h64" stroke="#111" stroke-width="3"/><path d="M28 80h64" stroke="#f0c24a" stroke-width="3" stroke-dasharray="5 5"/>'
      + "</svg>";
  }
  /* ---- carte « Chantiers » ---- */
  function cardHtml() { return '<div class="wk-h"><h2>Chantiers</h2><span class="wk-w"></span></div><p class="wk-hint muted"></p><ol class="wk-l" aria-label="Chantiers en cours et en attente"></ol><div class="wk-acts"><button type="button" class="btn wk-fm" data-a="foreman"></button></div>'; }
  function mountCard(host, compact) {
    if (!host || host.__wk) return; host.__wk = 1; var c = el("section", "card wk" + (compact ? " wk-c" : ""), cardHtml()); c.setAttribute("aria-label", "Chantiers");
    if (compact) { var d = el("details", "wkd"); d.innerHTML = '<summary class="wk-sum"><span class="wk-sumt">Chantiers</span><span class="wk-sumv"></span></summary>'; d.appendChild(c); host.appendChild(d); cards.push({ c: c, d: d }); }
    else { host.insertBefore(c, host.firstChild); cards.push({ c: c }); }
    c.addEventListener("click", function (ev) { var b = ev.target.closest("button[data-a]"); if (!b || b.disabled) return; if (b.dataset.a === "foreman") foremanStart(); else if (b.dataset.a === "bribe") askBribe(b.dataset.id, +b.dataset.i); else if (b.dataset.a === "go") goLot(b.dataset.id, +b.dataset.i); });
  }
  function rowHtml(s, e) {
    var on = e.at !== null, l = W().left(s, e), p = W().progress(s, e), bi = on ? W().bribeInfo(s, e) : { ok: false };
    return '<li class="wk-r' + (on ? "" : " wait") + '" data-k="' + e.id + e.i + '">' + art(true) + '<div class="wk-b"><b>' + label(e) + '</b><span class="meter"><i style="transform:scaleX(' + p.toFixed(3) + ')"></i></span><small>' + (on ? "Reste " + dur(l) + " · " + Math.round(p * 100) + " %" : "En file d’attente · " + dur(e.dur)) + "</small></div>"
      + '<div class="wk-ra">' + (on ? '<button type="button" class="btn ghost wk-br" data-a="bribe" data-id="' + e.id + '" data-i="' + e.i + '"' + (bi.ok ? "" : " disabled") + ' title="Pot-de-vin : −30 % du temps restant (argent du jeu, jamais jusqu’au bout)">' + (bi.why === "max" ? "Pots-de-vin épuisés" : bi.why === "short" ? "Presque fini" : "Pot-de-vin · " + money(bi.cost || 0)) + "</button>" : "") + '<button type="button" class="btn ghost wk-go" data-a="go" data-id="' + e.id + '" data-i="' + e.i + '">Voir</button></div></li>';
  }
  function paintCards(s) {
    if (!cards.length) return; var w = W(), act0 = w.active(s), wait = w.waiting(s), wk = w.workers(s), nx = w.nextWorker(s), rows = act0.concat(wait), fr = w.foremanReady(s);
    var sig = rows.map(function (e) { return e.id + e.i + e.to + (e.at === null ? "q" : "a") + Math.ceil(w.left(s, e)) + (e.b || 0); }).join("|") + wk + fr + Math.ceil(w.foremanWait(s) / 10) + (s.money > 0 ? Math.floor(Math.log10(s.money + 1) * 4) : 0);
    cards.forEach(function (k) {
      if (k.sig === sig) return; k.sig = sig; var c = k.c;
      c.querySelector(".wk-w").textContent = "Ouvriers " + Math.min(act0.length, wk) + " / " + wk + " · file " + wait.length + " / " + w.P.queueMax;
      c.querySelector(".wk-hint").textContent = (rows.length ? "Les bâtiments continuent de produire pendant les travaux ; le nouveau niveau arrive à la fin. Les chantiers avancent aussi quand tu es absent." : "Aucun chantier. Achète ou améliore un bâtiment pour lancer des travaux.") + (nx ? " Ouvrier suivant au niveau d’empire " + nx + "." : "");
      c.querySelector(".wk-l").innerHTML = rows.length ? rows.map(function (e) { return rowHtml(s, e); }).join("") : "";
      var fb = c.querySelector(".wk-fm"); fb.hidden = !act0.length; fb.disabled = !fr || !act0.length; fb.textContent = fr ? "Contremaître : réduire un chantier (−5 à −20 %)" : "Contremaître : prêt dans " + dur(w.foremanWait(s));
      if (k.d) { var sv = k.d.querySelector(".wk-sumv"); sv.textContent = rows.length ? act0.length + " en cours" + (wait.length ? " · " + wait.length + " en file" : "") + (act0.length ? " · " + dur(Math.min.apply(null, act0.map(function (e) { return w.left(s, e); }))) : "") : "aucun"; k.d.classList.toggle("on", rows.length > 0); }
    });
  }
  /* ---- actions ---- */
  function longest(s) { return W().active(s).slice().sort(function (a, b) { return W().left(s, b) - W().left(s, a); })[0] || null; }
  function foremanStart(target) {
    var s = S; if (!s || !W().foremanReady(s)) return; var e = target ? W().entry(s, target.id, target.i) : longest(s); if (!e || e.at === null) return;
    var go = function (score) { if (h && h.worksForeman) h.worksForeman(e.id, e.i, score); paintCards(S); };
    if (BL.minigames && BL.minigames.open) BL.minigames.open("foreman", { title: label(e), left: W().left(s, e) }, function (r) { if (r) go(r.score); });
    else go(0.5);
  }
  function askBribe(id, i) {
    var s = S, e = W().entry(s, id, i), b = e && W().bribeInfo(s, e); if (!b || !b.ok) return;
    BL.sysUI.modal({ title: "Verser un pot-de-vin ?", text: "Un inspecteur ferme les yeux sur les horaires du chantier « " + label(e) + " ». Coût : " + money(b.cost) + " (argent du jeu). Le chantier gagne " + dur(b.cut) + " ; il ne se termine jamais d’un coup. Prochain pot-de-vin sur ce chantier : plus cher.", ok: "Payer " + money(b.cost), onOk: function () { if (h && h.worksBribe) h.worksBribe(id, i); paintCards(S); } });
  }
  function goLot(id, i) { if (BL.ui && BL.ui.go) BL.ui.go("map"); setTimeout(function () { if (BL.mapUI && BL.mapUI.select) BL.mapUI.select({ type: "lot", act: id, id: id + "#" + i }); }, 60); }

  /* ---- carte de la ville : échafaudages positionnés au-dessus des bâtiments ---- */
  function overlay() { if (over) return over; var w = $("mapWrap"); if (!w) return null; over = el("div", "wover"); over.setAttribute("aria-hidden", "true"); w.appendChild(over); return over; }
  /* appelé par la carte à chaque image : at(lotId) → { x, y, z } en pixels écran, ou null */
  function place(at) {
    var s = S; if (!s || !W()) return; var o = overlay(); if (!o) return; var seen = {};
    W().list(s).forEach(function (e) {
      var k = e.id + "#" + e.i, p = at(k); seen[k] = 1; var st = sites[k];
      if (!st) { st = sites[k] = { el: el("div", "wsite", art(false) + '<div class="wsite-t"><span class="meter"><i></i></span><b></b></div>') }; o.appendChild(st.el); st.bar = st.el.querySelector("i"); st.t = st.el.querySelector("b"); }
      if (!p) { st.el.hidden = true; return; } st.el.hidden = false; var z = Math.max(0.45, Math.min(1.3, p.z));
      st.el.style.transform = "translate(" + Math.round(p.x) + "px," + Math.round(p.y) + "px) translate(-50%,-92%) scale(" + z.toFixed(3) + ")";
      st.el.classList.toggle("wait", e.at === null); var pr = W().progress(s, e); st.bar.style.transform = "scaleX(" + pr.toFixed(3) + ")";
      var tx = e.at === null ? "en file" : dur(W().left(s, e)); if (st.tx !== tx) { st.tx = tx; st.t.textContent = tx; }
    });
    Object.keys(sites).forEach(function (k) { if (!seen[k]) { sites[k].el.remove(); delete sites[k]; } });
    /* bruit de chantier : discret, toutes les ~8 s, seulement si la carte est visible et qu'un chantier est en cours */
    var n = Date.now(), cfg = sett(); if (W().active(s).length && n - lastSound > 8000 && cfg.sound !== false && cfg.ambmode !== "off" && !doc.hidden) { lastSound = n; if (BL.audio) BL.audio.sfx("build"); }
  }
  /* inauguration : ruban et lumière au-dessus du bâtiment (si la carte est affichée), sinon rien de plus que la notification */
  function inaugurate(e) {
    var o = overlay(), m = BL.mapUI; if (!o || !m || !m.shown || !m.shown() || !m.screenOf) return; var p = m.screenOf({ type: "lot", id: e.id + "#" + e.i }); if (!p) return;
    var x = el("div", "winaug" + (still() ? " still" : ""), '<i class="wa-l"></i><svg viewBox="0 0 120 60" aria-hidden="true"><path d="M6 30H52M68 30H114" stroke="#c8202e" stroke-width="7"/><path d="M52 22L60 30L52 38M68 22L60 30L68 38" fill="#c8202e"/><circle cx="60" cy="30" r="6" fill="#e9c97b"/></svg><b>Inauguration</b>');
    x.style.transform = "translate(" + Math.round(p.x) + "px," + Math.round(p.y) + "px) translate(-50%,-100%)"; o.appendChild(x); setTimeout(function () { x.remove(); }, still() ? 1800 : 2600);
  }

  /* ---- fiche du chantier (depuis la fiche d'un bâtiment) ---- */
  function lotBox(s, id, i) {
    var e = W().entry(s, id, i); if (!e) return "";
    var on = e.at !== null, bi = on ? W().bribeInfo(s, e) : { ok: false }, fr = W().foremanReady(s);
    return '<div class="wlot">' + art(true) + '<div class="wk-b"><b>' + (on ? "En chantier : niveau " + e.to + " à la fin" : "En file d’attente (niveau " + e.to + ")") + '</b><span class="meter"><i style="transform:scaleX(' + W().progress(s, e).toFixed(3) + ')"></i></span><small>' + (on ? "Reste " + dur(W().left(s, e)) + " · le bâtiment produit encore à son niveau actuel" : "Démarre dès qu’un ouvrier se libère · " + dur(e.dur)) + "</small>"
      + (on ? '<div class="wlot-a"><button type="button" class="btn ghost" data-wl="foreman"' + (fr ? "" : " disabled") + ">" + (fr ? "Contremaître (−5 à −20 %)" : "Contremaître : " + dur(W().foremanWait(s))) + '</button><button type="button" class="btn ghost" data-wl="bribe"' + (bi.ok ? "" : " disabled") + ">" + (bi.why === "max" ? "Pots-de-vin épuisés" : bi.why === "short" ? "Presque fini" : "Pot-de-vin · " + money(bi.cost || 0)) + "</button></div>" : "") + "</div></div>";
  }
  function bindLot(box) { if (!box || box.__wl) return; box.__wl = 1; box.addEventListener("click", function (ev) { var b = ev.target.closest("button[data-wl]"); if (!b || b.disabled) return; var k = box.dataset.k.split("#"); if (b.dataset.wl === "foreman") foremanStart({ id: k[0], i: +k[1] }); else askBribe(k[0], +k[1]); }); }
  function lotState(s, id, i) { var e = W() && W().entry(s, id, i); if (!e) return null; return { on: e.at !== null, left: W().left(s, e), to: e.to, label: e.at !== null ? "En chantier · " + dur(W().left(s, e)) : "En file d’attente" }; }

  function init(handlers, util) {
    h = handlers; u = util; mountCard($("v_empire")); var mw = $("v_map"); if (mw) { var bar = mw.querySelector(".mapbar2"); var dock = el("div", "wdock"); if (bar && bar.parentNode) bar.parentNode.insertBefore(dock, bar.nextSibling); else mw.insertBefore(dock, mw.firstChild); mountCard(dock, true); }
  }
  function update(s) { S = s; paintCards(s); }
  BL.worksUI = { init: init, update: update, place: place, inaugurate: inaugurate, art: art, lotBox: lotBox, bindLot: bindLot, lotState: lotState, foreman: foremanStart, askBribe: askBribe, _sites: function () { return Object.keys(sites); } };
})(typeof globalThis !== "undefined" ? globalThis : this);
