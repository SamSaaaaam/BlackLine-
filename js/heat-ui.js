/* Chaleur (C9) : jauge visible sur l'accueil (tableau de bord) et sur la carte ; un toucher ouvre le détail
   (palier, pourquoi, blanchiment, actions). Toute la règle est dans BL.heat. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, H, el = {}, open = false, from = null, btns = [], sig = "", srcSig = "";
  var COL = { calm: "#6fb08a", watch: "#d9b45a", probe: "#e0884a", hunt: "#e0584a" };
  var TXT = {
    calm: "Aucune conséquence.",
    watch: "Les patrouilles se multiplient. Aucune pénalité pour l’instant : c’est le moment de lever le pied.",
    probe: "Opérations : −5 points de chances de réussite. Les rivaux avancent 15 % plus vite.",
    hunt: "Opérations : −10 points. Rivaux : +30 %. Une descente vise un quartier et est annoncée 2 minutes à l’avance : amende de 4 % de ton argent (plafonnée à 10 minutes de revenus), un bâtiment du quartier fermé 8 minutes, puis un objet de l’Arsenal mis sous scellés 12 minutes ou un équipier en garde à vue 10 minutes. Rien n’est détruit ni perdu. Tu peux l’éviter en faisant redescendre la chaleur, ou en défendant le quartier."
  };
  function $(id) { return doc.getElementById(id); }
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function pc(x) { return String(Math.round(x * 10) / 10).replace(".", ","); }
  function dur(sec) { sec = Math.max(0, Math.ceil(sec)); return sec >= 60 ? Math.floor(sec / 60) + " min " + (sec % 60 ? sec % 60 + " s" : "") : sec + " s"; }
  var FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 1.5.5 2.5 1.5 3C10 7 11 4 12 2z"/></svg>';
  function mkBtn() {
    var b = mk("button", "heatbtn", FLAME + '<span class="hb-t">Chaleur</span><span class="hb-m" aria-hidden="true"><i></i></span><span class="hb-v"></span><span class="hb-n"></span>'); b.type = "button";
    b.setAttribute("aria-haspopup", "dialog"); b.onclick = function () { openDlg(b); }; return b;
  }
  function place() {
    var d = $("v_dash"), m = doc.querySelector("#v_map .mapbar2");
    if (d && !d.querySelector(".heatbtn")) { var b1 = mkBtn(); b1.classList.add("hb-dash"); d.insertBefore(b1, d.firstChild); btns.push(b1); }
    if (m && !m.querySelector(".heatbtn")) { var b2 = mkBtn(); b2.classList.add("hb-map"); m.insertBefore(b2, m.firstChild); btns.push(b2); }
  }
  function build() {
    if (el.root) return;
    var r = mk("div", "heatdlg", ""); r.id = "heatDlg"; r.hidden = true; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); r.setAttribute("aria-labelledby", "hdTitle");
    r.innerHTML = '<div class="hd-box"><header class="hd-h"><h2 id="hdTitle">Chaleur</h2><button type="button" class="hd-x" id="hdX" aria-label="Fermer">&times;</button></header>' +
      '<p class="hd-lead">L’attention que ton empire attire, côté police comme côté rivaux. Elle monte avec les activités illégales, retombe avec le temps et les actions ci-dessous. Fiction : aucune vraie police, aucune vraie personne.</p>' +
      '<div class="hd-gauge" role="img" aria-label="" id="hdG"><i id="hdGi"></i><span style="left:25%"></span><span style="left:50%"></span><span style="left:75%"></span></div>' +
      '<div class="hd-val"><b id="hdV"></b><span id="hdT"></span></div><p class="hd-eff" id="hdE"></p><p class="hd-raid" id="hdR" hidden></p><div class="hd-def" id="hdD" hidden><button type="button" class="btn buy" id="hdDB"></button><p class="hd-note" id="hdDN"></p></div>' +
      '<div class="hd-acts"><button type="button" class="btn buy" id="hdB"></button><button type="button" class="btn ghost" id="hdL"></button></div><p class="hd-note" id="hdN" role="status" aria-live="polite"></p>' +
      '<section class="hd-cons" id="hdC" aria-label="Conséquences en cours" hidden><h3>Conséquences en cours</h3><ul id="hdCL"></ul></section><details class="hd-why" id="hdW" open><summary>Pourquoi cette chaleur ?</summary><div id="hdS"></div></details>' +
      '<div class="hd-tiers" id="hdTiers"></div>' +
      '</div>';
    doc.body.appendChild(r); el.root = r;
    ["hdG", "hdGi", "hdV", "hdT", "hdE", "hdR", "hdS", "hdTiers", "hdB", "hdL", "hdN", "hdD", "hdDB", "hdDN", "hdC", "hdCL"].forEach(function (id) { el[id] = r.querySelector("#" + id); });
    r.querySelector("#hdX").onclick = close; r.onclick = function (e) { if (e.target === r) close(); };
    el.hdB.onclick = function () { var x = h.heatBribe && h.heatBribe(); el.hdN.textContent = x ? "Un inspecteur a perdu un dossier : chaleur −" + BL.heat.params.bribe.drop + "." : "Impossible pour l’instant."; paint(true); };
    el.hdL.onclick = function () { var x = h.heatLay && h.heatLay(); el.hdN.textContent = x ? "Vous faites profil bas : chaleur −" + BL.heat.params.lay.drop + "." : "Impossible pour l’instant."; paint(true); };
    el.hdDB.onclick = function () { var x = h.heatDefend && h.heatDefend(); el.hdN.textContent = x ? "Le quartier se prépare : amende réduite de moitié, aucune fermeture ni saisie." : "Impossible pour l’instant."; paint(true); };
    el.hdCL.onclick = function (e) { var b = e.target.closest && e.target.closest("button[data-act]"); if (!b || b.disabled) return; var ok = b.dataset.act === "ransom" ? h.heatRansom && h.heatRansom(b.dataset.id) : h.heatRedeem && h.heatRedeem(+b.dataset.i); el.hdN.textContent = ok ? "Fait." : "Impossible pour l’instant."; paint(true); };
    r.addEventListener("keydown", function (e) { if (e.key === "Tab") trap(e); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); close(); } }, true);
    TIERS_BUILD();
  }
  function TIERS_BUILD() {
    el.hdTiers.innerHTML = ""; H.params.tiers.forEach(function (t) { var d = mk("div", "hd-tier", ""); d.dataset.id = t.id; d.style.setProperty("--c", COL[t.id]); d.innerHTML = "<b></b><span></span>"; d.firstChild.textContent = t.name + " · dès " + t.min; d.lastChild.textContent = TXT[t.id]; el.hdTiers.appendChild(d); });
  }
  function trap(e) {
    var f = Array.prototype.filter.call(el.root.querySelectorAll("button,summary"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return;
    var a = f[0], z = f[f.length - 1]; if (e.shiftKey && doc.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && doc.activeElement === z) { a.focus(); e.preventDefault(); }
  }
  function openDlg(src) { if (!S || open) return; build(); from = src || doc.activeElement; open = true; el.hdN.textContent = ""; el.root.hidden = false; $("app").inert = true; paint(true); if (BL.audio) BL.audio.sfx && BL.audio.sfx("click"); el.root.querySelector("#hdX").focus(); }
  function close() { if (!open) return; open = false; el.root.hidden = true; $("app").inert = false; try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} }
  function paint(force) {
    if (!open || !S) return; var hs = H.state(S), t = H.tier(S), src = H.sources(S), v = Math.round(hs.v * 10) / 10;
    el.hdGi.style.transform = "scaleX(" + (hs.v / 100).toFixed(3) + ")"; el.hdGi.style.background = COL[t.id]; el.hdG.setAttribute("aria-label", "Chaleur " + pc(v) + " sur 100, palier " + t.name);
    u.set(el.hdV, pc(v) + " / 100"); u.set(el.hdT, t.name); el.hdT.style.color = COL[t.id]; u.set(el.hdE, TXT[t.id]);
    Array.prototype.forEach.call(el.hdTiers.children, function (d) { d.classList.toggle("on", d.dataset.id === t.id); });
    if (hs.raid > S.t) { var dn = H.districtName(hs.tg); el.hdR.hidden = false; u.set(el.hdR, "Descente annoncée" + (dn ? " sur " + dn : "") + " dans " + dur(hs.raid - S.t) + ". Fais redescendre la chaleur sous 70 pour l’éviter."); } else el.hdR.hidden = true;
    var showD = hs.raid > S.t; el.hdD.hidden = !showD;
    if (showD) { var dc = H.cost(S, H.params.r2.defendMin); u.set(el.hdDB, hs.def ? "Quartier préparé ✓" : "Défendre le quartier · " + u.money(dc)); el.hdDB.disabled = hs.def || S.money + 1e-9 < dc; u.set(el.hdDN, hs.def ? "Amende réduite de moitié, aucune fermeture, saisie ni arrestation." : "Amende réduite de moitié et aucune conséquence secondaire (fermeture, saisie, arrestation)."); }
    paintCons(hs);
    var ss = src.rows.map(function (r) { return r.label + r.v.toFixed(2); }).join("|") + pc(src.eq);
    if (force || ss !== srcSig) {
      srcSig = ss; el.hdS.innerHTML = "";
      var ul = mk("ul", "hd-src", ""); src.rows.forEach(function (r) { var li = mk("li", r.v > 0 ? "up" : "down", "<span></span><b></b>"); li.firstChild.textContent = r.label; li.lastChild.textContent = (r.v > 0 ? "+" : "−") + pc(Math.abs(r.v) * 1) + " / min"; ul.appendChild(li); });
      if (!src.rows.length) { var e0 = mk("li", "", "<span>Aucune source pour l’instant.</span><b>0 / min</b>"); ul.appendChild(e0); }
      el.hdS.appendChild(ul);
      var p = mk("p", "hd-sum", ""); p.textContent = "Chaleur illégale : +" + pc(src.gain) + " / min. Blanchiment par les activités légales : −" + pc(src.absorbed) + " / min (au plus " + Math.round(BL.heat.params.launder * 100) + " % de la chaleur illégale). Net : +" + pc(src.net) + " / min. Le temps la refroidit de " + Math.round(BL.heat.params.k * 100) + " % de l’écart par minute : sans rien faire, elle tend vers " + pc(src.eq) + ".";
      el.hdS.appendChild(p);
    }
    var bc = H.bribeCost(S), bl = H.bribeLeft(S), ll = H.layLeft(S), canB = S.money + 1e-9 >= bc && bl <= 0 && hs.v > 0;
    u.set(el.hdB, bl > 0 ? "Corrompre un inspecteur · prêt dans " + dur(bl) : "Corrompre un inspecteur · " + u.money(bc) + " · −" + H.params.bribe.drop); el.hdB.disabled = !canB;
    u.set(el.hdL, ll > 0 ? "Faire profil bas · prêt dans " + dur(ll) : "Faire profil bas · −" + H.params.lay.drop + " · revenus −" + Math.round(H.params.r2.layInc * 100) + " % (5 min)"); el.hdL.disabled = ll > 0 || hs.v <= 0;
  }
  function paintCons(hs) {
    var rows = [], low = hs.low > S.t, nm = BL.dbuild && BL.dbuild.find, k;
    hs.cl.forEach(function (c) { var b = nm && BL.dbuild.find(c.id); rows.push({ t: "Fermé : " + (b ? b.name : c.id) + " (" + H.districtName(c.d) + ") · rouvre dans " + dur(c.u - S.t) }); });
    hs.sz.forEach(function (z, i) { var it = BL.equip && BL.equip.item(z.id), c = H.cost(S, H.params.r2.redeemMin); rows.push({ t: "Sous scellés : " + (it ? it.name : z.id) + " · rendu dans " + dur(z.u - S.t), act: "redeem", i: i, label: "Racheter · " + u.money(c), dis: S.money + 1e-9 < c || (BL.equip && BL.equip.space(S) <= 0) }); });
    hs.ar.forEach(function (a) { var m = BL.crew && BL.crew.get(a.id), c = H.cost(S, H.params.r2.ransomMin); rows.push({ t: "En garde à vue : " + (m ? m.name : a.id) + " · libéré dans " + dur(a.u - S.t), act: "ransom", id: a.id, label: "Payer la rançon · " + u.money(c), dis: S.money + 1e-9 < c }); });
    if (low) rows.push({ t: "Profil bas : revenus −" + Math.round(H.params.r2.layInc * 100) + " % pendant encore " + dur(hs.low - S.t) });
    var sig2 = rows.map(function (r) { return r.t.replace(/\d+ (min|s)( \d+ s)?/g, "#") + (r.dis ? "d" : ""); }).join("|"); el.hdC.hidden = !rows.length;
    if (sig2 === el.cSig) { Array.prototype.forEach.call(el.hdCL.children, function (li, i) { if (rows[i]) li.firstChild.textContent = rows[i].t; }); return; } el.cSig = sig2; el.hdCL.innerHTML = "";
    rows.forEach(function (r) { var li = mk("li", "", "<span></span>"); li.firstChild.textContent = r.t; if (r.act) { var b = mk("button", "btn ghost", ""); b.type = "button"; b.dataset.act = r.act; if (r.id) b.dataset.id = r.id; if (r.i !== undefined) b.dataset.i = r.i; b.textContent = r.label; b.disabled = !!r.dis; li.appendChild(b); } el.hdCL.appendChild(li); });
  }
  function update(s) {
    S = s; H = BL.heat; if (!H) return; if (!btns.length) place();
    var hs = H.state(s), t = H.tier(s), v = Math.round(hs.v), g = v + t.id + (hs.raid > s.t ? "r" : "");
    if (g !== sig) {
      sig = g; btns.forEach(function (b) {
        b.style.setProperty("--c", COL[t.id]); b.querySelector(".hb-m i").style.transform = "scaleX(" + (hs.v / 100).toFixed(3) + ")";
        b.querySelector(".hb-v").textContent = v + " %"; b.querySelector(".hb-n").textContent = t.name + (hs.raid > s.t ? " · descente" : "");
        b.setAttribute("aria-label", "Chaleur " + v + " pour cent, " + t.name + (hs.raid > s.t ? ", descente annoncée" : "") + ". Ouvrir le détail."); b.classList.toggle("hot", t.id === "hunt");
      });
    }
    if (open) paint(false);
  }
  function init(handlers, util) { h = handlers; u = util; H = BL.heat; place(); }
  BL.heatUI = { init: init, update: update, open: function () { openDlg(null); }, close: close, isOpen: function () { return open; } };
})(typeof window !== "undefined" ? window : globalThis);
