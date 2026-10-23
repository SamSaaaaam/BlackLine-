/* Caractère de l'équipe (Partie 13 · C4) : bloc « Caractère et loyauté » dans la fiche d'un équipier (crew-ui.js l'appelle).
   Toute la règle est dans BL.bonds ; ici on affiche : loyauté, tempérament, affinités / tensions, état (avertissement, dispute, parti), actions. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, h, u, S = null, st = { id: null, mis: false, flash: "" };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function name(id) { var m = BL.crew.get(id); return m ? m.name.split(" ")[0] : id; }
  function dur(sec) { sec = Math.max(0, Math.ceil(sec)); return sec >= 60 ? Math.floor(sec / 60) + " min" : sec + " s"; }
  function init(handlers, util) { h = handlers; u = util; }
  function status(s, id) {
    var B = BL.bonds, r = BL.crew.rec(s, id), L = Math.round(B.loy(s, id));
    if (r.away) return { cls: "away", t: "Parti : rappelle-le pour le retrouver, avec son niveau." };
    if (B.disputing(s, id)) return { cls: "warn", t: "En dispute : efficacité −20 % pendant encore " + dur(s.crew.ev.dis.u - s.t) + "." + (r.bond ? " Lié à toi par son moment personnel : il ne partira pas." : "") };
    if (r.st === 2) return { cls: "bad", t: "Pense à partir : il te reste " + dur(r.cd) + " en ligne. Prime, mission personnelle ou changement d'équipe." };
    if (r.st === 1) return { cls: "warn", t: "Distant : loyauté " + L + " / 100. Sous " + B.params.warn2 + ", il envisage de partir." };
    if (r.bond) return { cls: "ok", t: "Lié à toi par son moment personnel : il ne partira pas." };
    return { cls: "", t: "Loyauté " + L + " / 100 : efficacité ×" + String(Math.round(B.loyMul(s, id) * 100) / 100).replace(".", ",") + (B.disputing(s, id) ? "" : ".") };
  }
  function relHtml(s, id) {
    var B = BL.bonds, like = B.partners(id, "like"), clash = B.partners(id, "clash"), act = BL.crew.active(s).map(function (m) { return m.id; }), f = function (a, kind) { return a.map(function (x) { var on = act.indexOf(x) >= 0 && act.indexOf(id) >= 0; return '<span class="bd-chip ' + kind + (on ? " on" : "") + '">' + esc(name(x)) + (on ? " · actif" : "") + "</span>"; }).join(""); };
    return (like.length ? '<p class="bd-rel"><small>S’entend avec</small>' + f(like, "like") + "</p>" : "") + (clash.length ? '<p class="bd-rel"><small>Tendu avec</small>' + f(clash, "clash") + "</p>" : "");
  }
  function fiche(box, s, id, own) {
    S = s; if (!box || !BL.bonds) return; if (!own) { box.hidden = true; return; } box.hidden = false;
    var B = BL.bonds, r = BL.crew.rec(s, id), T = BL.data.bonds.temper[B.temper(id)], ms = B.missionOf(id), sg = status(s, id), L = Math.round(B.loy(s, id));
    if (st.id !== id) { st.id = id; st.mis = false; st.flash = ""; }
    var wg = B.whyGift(s, id), gc = BL.crew.rec(s, id) && B.giftCost(s), wm = B.whyMission(s, id, "b"), wa = B.whyMission(s, id, "a");
    var sig = [id, L, sg.cls, Math.floor(sg.t.length), r.mis, r.bond, r.away, st.mis, st.flash, !!wg, !!wm, !!wa, B.disputing(s, id), Math.floor(s.money / 1e3), BL.crew.active(s).map(function (m) { return m.id; }).join(",")].join("|");
    if (box.dataset.sig === sig && box.dataset.t === String(Math.floor(s.t / 5))) return; box.dataset.sig = sig; box.dataset.t = String(Math.floor(s.t / 5));
    var o = '<h4 class="fxlh">Caractère et loyauté</h4><p class="bd-t"><b>' + esc(T.name) + "</b> · " + esc(T.text) + "</p>" +
      '<div class="bd-bar" role="img" aria-label="Loyauté ' + L + ' sur 100"><i style="transform:scaleX(' + (L / 100).toFixed(3) + ')"></i><span style="left:' + B.params.warn1 + '%"></span><span style="left:' + B.params.start + '%"></span></div>' +
      '<p class="bd-st ' + sg.cls + '" role="status">' + esc(sg.t) + "</p>" + relHtml(s, id);
    if (st.flash) o += '<p class="sg-flash" role="status">' + esc(st.flash) + "</p>";
    o += '<div class="bd-act">';
    if (r.away) o += '<button type="button" class="btn buy" data-b="recall"' + (s.money + 1e-9 < B.recallCost(s) ? " disabled" : "") + ">Rappeler · " + u.money(B.recallCost(s)) + "</button>";
    else {
      o += '<button type="button" class="btn ghost" data-b="gift"' + (wg ? " disabled" : "") + ">Prime · " + u.money(gc) + " · +" + (B.temper(id) === "greedy" ? B.params.giftGreedy : B.params.gift) + "</button>";
      if (!r.mis) o += '<button type="button" class="btn ghost" data-b="mis"' + (wm && !/argent/.test(wm) ? " disabled" : "") + ' aria-expanded="' + (st.mis ? "true" : "false") + '">Moment personnel</button>';
    }
    o += "</div>" + (wg && !r.away ? '<small class="sg-why">' + esc(wg) + "</small>" : "");
    if (!r.mis && !r.away) {
      if (wm && !/argent/.test(wm)) o += '<small class="sg-why">Moment personnel : ' + esc(wm) + "</small>";
      else if (st.mis) {
        o += '<section class="bd-mis"><h5>' + esc(ms.title) + "</h5><p>" + esc(ms.text) + '</p><div class="sg-opts"><button type="button" class="sg-opt" data-b="mA"' + (wa ? " disabled" : "") + "><b>" + esc(ms.a) + "</b><ul><li>Loyauté +" + B.params.missionA + " · lien définitif</li><li>Coût " + u.money(B.giftCost(s)) + "</li></ul>" + (wa ? '<small class="sg-why">' + esc(wa) + "</small>" : "") + '</button><button type="button" class="sg-opt" data-b="mB"><b>' + esc(ms.b) + "</b><ul><li>Loyauté +" + B.params.missionB + " · lien définitif</li><li>Gratuit</li></ul></button></div></section>";
      }
    } else if (r.mis) o += '<p class="bd-done">Moment personnel vécu : « ' + esc(ms.title) + " ».</p>";
    box.innerHTML = o;
    if (!box._bd) { box._bd = 1; box.addEventListener("click", function (e) { var b = e.target.closest("button[data-b]"); if (!b || b.disabled || !S) return; var k = b.dataset.b, id2 = st.id, r2; st.flash = "";
      if (k === "gift") { r2 = h.bondGift(id2); st.flash = r2 ? "Prime versée : loyauté +" + r2.gain + "." : "Impossible pour l’instant."; }
      else if (k === "mis") st.mis = !st.mis; else if (k === "mA" || k === "mB") { r2 = h.bondMission(id2, k === "mA" ? "a" : "b"); st.flash = r2 ? "Moment personnel vécu : loyauté +" + r2.gain + ", lien définitif." : "Impossible pour l’instant."; st.mis = false; }
      else if (k === "recall") { r2 = h.bondRecall(id2); st.flash = r2 ? "De retour dans l’équipe (loyauté 40)." : "Impossible pour l’instant."; }
      box.dataset.sig = ""; fiche(box, S, id2, true); }); }
  }
  BL.bondsUI = { init: init, fiche: fiche };
})(typeof globalThis !== "undefined" ? globalThis : this);
