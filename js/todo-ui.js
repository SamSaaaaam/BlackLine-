/* Partie 19 · C : carte « À faire maintenant » (haut du Tableau de bord) + rappel de la première action dans la barre d'objectif.
   Lit BL.todo.next (pur) ; chaque bouton mène directement à la vue concernée. Aucune animation. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, sig = "", el = {};
  function $(id) { return doc.getElementById(id); }
  var VERB = { goals: "Réclamer", empire: "Construire", upg: "Acheter", ops: "Y aller", dash: "Y aller", terr: "Défendre", map: "Y aller" };
  function go(x) {
    if (!x || !BL.ui) return; BL.ui.go(x.view);
    if (x.go === "heist" && BL.heistUI) setTimeout(function () { BL.heistUI.open(); }, 50);
    if (x.go === "heat" && BL.heatUI) setTimeout(function () { BL.heatUI.open(); }, 50);
  }
  function init() {
    el.list = $("todoNow"); el.bar = $("gTodo"); if (!el.list) return;
    el.list.addEventListener("click", function (e) { var b = e.target.closest("button[data-k]"); if (b && el.items) go(el.items[+b.dataset.k]); });
    if (el.bar) el.bar.onclick = function () { if (el.items && el.items[0]) go(el.items[0]); };
  }
  function update(s) {
    if (!el.list || !BL.todo) return; var v = $("v_dash"), card = $("todoDash"); if (v && card && v.firstElementChild !== card) v.insertBefore(card, v.firstChild);   /* toujours en haut (d'autres modules insèrent leurs boutons en tête) */
    var items = BL.todo.next(s, Date.now()), e = items.length ? null : BL.todo.empty(s), sg = JSON.stringify(items.map(function (x) { return [x.id, x.text, x.urgency]; })) + (e ? e.sub : "");
    if (sg === sig) return; sig = sg; el.items = items;
    el.list.innerHTML = items.length ? items.map(function (x, i) { return '<li class="tdn-i u' + x.urgency + '"><span class="tdn-t"></span><button type="button" class="btn' + (x.urgency >= 2 ? " can" : "") + '" data-k="' + i + '">' + (VERB[x.view] || "Y aller") + "</button></li>"; }).join("") : '<li class="tdn-e"><b>' + e.text + "</b>" + (e.sub ? "<small>" + e.sub + "</small>" : "") + "</li>";
    Array.prototype.forEach.call(el.list.querySelectorAll(".tdn-t"), function (t, i) { t.textContent = items[i].text; var b = t.nextSibling; b.setAttribute("aria-label", b.textContent + " : " + items[i].text); });
    if (el.bar) { el.bar.hidden = !items.length; if (items.length) { el.bar.textContent = "À faire : " + items[0].text; el.bar.setAttribute("aria-label", "À faire maintenant : " + items[0].text); } }
  }
  BL.todoUI = { init: init, update: update, go: go };
})(typeof globalThis !== "undefined" ? globalThis : this);
