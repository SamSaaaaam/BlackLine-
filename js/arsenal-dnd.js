/* Glisser-déposer de l'Arsenal (C11), en pointer events : souris, tactile et stylet.
   - Souris / stylet : le glisser démarre après 5 px de déplacement.
   - Tactile : le glisser démarre depuis la POIGNÉE dédiée (.eqgrip, touch-action: none) ou après un appui long (450 ms) sur l'objet ;
     tout autre geste (défilement, balayage) reste un défilement normal : la page n'est jamais bloquée hors d'un geste volontaire.
   - Échap, pointercancel ou relâcher hors d'une cible : aucun effet. Aucune règle ici : cfg.canDrop / cfg.drop décident (BL.equip). */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document;
  var LONG = 450, MOVE = 5, SLOP = 8, st = null, ghost = null, tip = null, cfg = null, lastEnd = 0, raf = 0, ptr = { x: 0, y: 0 };
  function mk(cls) { var e = doc.createElement("div"); e.className = cls; return e; }
  function active() { return !!(st && st.started); }
  function recent() { return Date.now() - lastEnd < 350; }
  function clearTargets() { Array.prototype.forEach.call(doc.querySelectorAll(".dz-ok,.dz-no,.dz-over"), function (e) { e.classList.remove("dz-ok", "dz-no", "dz-over"); e.removeAttribute("data-why"); }); }
  function mark(i) {
    cfg.targets().forEach(function (el) { var r = cfg.canDrop(i, cfg.info(el)); el.classList.toggle("dz-ok", !!r.ok); el.classList.toggle("dz-no", !r.ok); el.dataset.why = r.ok ? "" : r.reason; });
  }
  function begin(e) {
    if (st.started) return; st.started = true; if (st.timer) { clearTimeout(st.timer); st.timer = null; }
    doc.body.classList.add("eqdragging"); ghost = mk("eqghost"); ghost.innerHTML = cfg.ghost(st.src); doc.body.appendChild(ghost);
    tip = mk("eqtip"); tip.setAttribute("aria-hidden", "true"); doc.body.appendChild(tip);
    st.src.el.classList.add("dragsrc"); mark(st.src.i); place(e.clientX, e.clientY); over(e.clientX, e.clientY); if (cfg.onStart) cfg.onStart(st.src);
    try { navigator.vibrate && e.pointerType === "touch" && navigator.vibrate(12); } catch (x) {}
  }
  function place(x, y) { ptr.x = x; ptr.y = y; if (ghost) ghost.style.transform = "translate(" + Math.round(x + 10) + "px," + Math.round(y + 10) + "px)"; if (tip) tip.style.transform = "translate(" + Math.round(Math.min(x + 14, root.innerWidth - 200)) + "px," + Math.round(y + 56) + "px)"; }
  function targetAt(x, y) {
    if (ghost) ghost.style.display = "none"; var el = doc.elementFromPoint(x, y); if (ghost) ghost.style.display = "";
    var t = el && el.closest ? el.closest(".dz-ok,.dz-no") : null; return t;
  }
  function over(x, y) {
    var t = targetAt(x, y); Array.prototype.forEach.call(doc.querySelectorAll(".dz-over"), function (e) { if (e !== t) e.classList.remove("dz-over"); });
    st.over = t; if (!t) { if (tip) { tip.textContent = "Relâche ici pour annuler"; tip.className = "eqtip"; } return; }
    t.classList.add("dz-over"); if (tip) { var ok = t.classList.contains("dz-ok"); tip.className = "eqtip " + (ok ? "ok" : "no"); tip.textContent = ok ? cfg.okText(st.src.i, cfg.info(t)) : (t.dataset.why || "Impossible"); }
  }
  /* défilement automatique près des bords : indispensable pour les longues listes sur mobile */
  function tick() {
    raf = 0; if (!active()) return; var h = root.innerHeight, dy = ptr.y < 70 ? -14 : ptr.y > h - 70 ? 14 : 0;
    if (dy) { var sc = cfg.scroller ? cfg.scroller() : null; (sc || doc.scrollingElement || doc.documentElement).scrollTop += dy; over(ptr.x, ptr.y); raf = root.requestAnimationFrame(tick); }
  }
  function end(drop, e) {
    var s = st; if (!s) return; st = null; doc.removeEventListener("pointermove", move, true); doc.removeEventListener("pointerup", up, true); doc.removeEventListener("pointercancel", cancel, true); doc.removeEventListener("touchmove", tm, true);
    if (s.timer) clearTimeout(s.timer); if (raf) { root.cancelAnimationFrame(raf); raf = 0; }
    if (!s.started) return; lastEnd = Date.now(); var t = s.over, okT = !!(t && t.classList.contains("dz-ok")), why = t ? (t.dataset.why || "") : "", info = okT ? cfg.info(t) : null; clearTargets(); if (ghost) ghost.remove(); if (tip) tip.remove(); ghost = tip = null; doc.body.classList.remove("eqdragging"); s.src.el.classList.remove("dragsrc");
    if (drop && okT) cfg.drop(s.src.i, info); else if (cfg.onCancel) cfg.onCancel(s.src, drop ? why : "");
  }
  function move(e) {
    if (!st || e.pointerId !== st.id) return; var dx = e.clientX - st.x0, dy = e.clientY - st.y0, d = Math.sqrt(dx * dx + dy * dy);
    if (!st.started) {
      if (st.type === "touch" && !st.handle) { if (d > SLOP) end(false); return; }          /* tactile hors poignée : c'est un défilement */
      if (d > MOVE) { begin(e); } else return;
    }
    e.preventDefault(); place(e.clientX, e.clientY); over(e.clientX, e.clientY); if (!raf) raf = root.requestAnimationFrame(tick);
  }
  function up(e) { if (!st || e.pointerId !== st.id) return; if (st.started) e.preventDefault(); end(true, e); }
  function cancel(e) { if (!st || e.pointerId !== st.id) return; end(false, e); }
  function tm(e) { if (st && st.started && e.cancelable) e.preventDefault(); }            /* geste volontaire en cours : pas de défilement sous le doigt */
  function down(e) {
    if (st || (e.pointerType === "mouse" && e.button !== 0)) return; var src = cfg.source(e.target); if (!src) return;
    var handle = !!(e.target.closest && e.target.closest(".eqgrip"));
    st = { id: e.pointerId, src: src, x0: e.clientX, y0: e.clientY, type: e.pointerType || "mouse", handle: handle, started: false, timer: null, over: null };
    if (st.type === "touch" && !handle) st.timer = setTimeout(function () { if (st && !st.started) { begin({ clientX: st.x0, clientY: st.y0, pointerType: "touch" }); st.lp = true; } }, LONG);
    doc.addEventListener("pointermove", move, true); doc.addEventListener("pointerup", up, true); doc.addEventListener("pointercancel", cancel, true); doc.addEventListener("touchmove", tm, { capture: true, passive: false });
  }
  function init(rootEl, c) {
    cfg = c; rootEl.addEventListener("pointerdown", down);
    rootEl.addEventListener("contextmenu", function (e) { if (st && (st.started || st.timer)) e.preventDefault(); });
    rootEl.addEventListener("dragstart", function (e) { e.preventDefault(); });
    rootEl.addEventListener("click", function (e) { if (recent()) { e.stopPropagation(); e.preventDefault(); } }, true);   /* le clic fantôme après un glisser ne déclenche rien */
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && st) { e.preventDefault(); e.stopPropagation(); end(false); } }, true);
  }
  BL.arsDnD = { init: init, active: active, cancel: function () { if (st) end(false); } };
})(typeof window !== "undefined" ? window : globalThis);
