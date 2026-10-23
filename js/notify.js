/* Notifications prioritaires (phase E).
   - Événements importants : grande bannière centrée + son propre à chaque type + repère qui pulse sur la carte + clic pour y aller.
   - Événements mineurs : petits messages (toasts) déjà gérés par ui.js.
   - File d'attente : une seule bannière à la fois, jamais d'empilement ; les doublons (même clé) sont fusionnés.
   - Réglage « notif » : full (bannière + son + repère), quiet (bannière discrète, sans son), off (petit message seulement). */
(function (root) {
  var BL = root.BL = root.BL || {};
  var ICON = {
    levelup: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
    status: "M3 18h18v2H3zM4 8l4 4 4-7 4 7 4-4-2 9H6z",
    design: "M4 20V9l8-5 8 5v11h-5v-6H9v6z",
    event: "M13 2L4 14h6l-1 8 9-12h-6z",
    attack: "M12 2l9 3v6c0 5-4 9-9 11-5-2-9-6-9-11V5zm-1 6v5h2V8zm0 7v2h2v-2z",
    claim: "M7 3h10v3h3v3c0 3-2 5-5 5.3-.5 1-1.4 1.7-2.5 2V19h3v2H8v-2h3v-2.7c-1.100-.3-2-1-2.500-2C6 14 4 12 4 9V6h3zm-1 5v1c0 1.400.8 2.400 2 2.800V8zm12 0h-2v3.800c1.200-.4 2-1.400 2-2.800z",
    boost: "M13 2c1 4-1 5-2 8 2-1 4-1 4 3 0 3-2 5-5 5s-5-2-5-5c0-4 5-5 8-11z",
    expire: "M12 3a9 9 0 100 18 9 9 0 000-18zm1 4v5l4 2-.8 1.700L11 13V7z",
    loot: "M12 2l2.400 5.200 5.600.7-4.100 3.900 1 5.600-4.900-2.700-4.900 2.700 1-5.600L4 7.900l5.600-.7zM5 20h14v2H5z",
    saga: "M5 3h11l3 3v15H5zm2 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z",
    vault: "M3 6h18v12H3zm9 2.500a3.500 3.500 0 100 7 3.500 3.500 0 000-7zM12 10a2 2 0 110 4 2 2 0 010-4z"
  };
  /* sound = nom de l'effet dans audio.js ; ms = durée d'affichage ; col = couleur d'accent */
  var TYPES = {
    levelup: { sound: "levelup", ms: 3400, col: "#e3c680", label: "Niveau d’empire" },
    status: { sound: "promo", ms: 5200, col: "#f0d58a", label: "Promotion", promo: true },
    design: { sound: "design", ms: 3600, col: "#7fc8d8", label: "Nouveau design" },
    event: { sound: "event", ms: 4200, col: "#e0a458", label: "Événement" },
    attack: { sound: "alert", ms: 5200, col: "#e0584a", label: "Attaque de faction" },
    claim: { sound: "claim", ms: 4200, col: "#8fd07a", label: "Objectif atteint" },
    boost: { sound: "boost", ms: 3200, col: "#e08aff", label: "Boost" },
    expire: { sound: "expire", ms: 3600, col: "#9aa3b0", label: "Boost terminé" },
    vault: { sound: "vault", ms: 4200, col: "#e3c680", label: "Coffre plein" },
    unlock: { sound: "unlock", ms: 5200, col: "#8fd07a", label: "Activité débloquée" },
    loot: { sound: "loot", ms: 4800, col: "#e3b34c", label: "Butin rare" },
    saga: { sound: "saga", ms: 5200, col: "#e3c680", label: "Histoire" },
    heat: { sound: "heat1", ms: 2800, col: "#e0584a", label: "Chaleur", prio: true }   /* C10 : bannière de montée de palier de chaleur (sound heat1/2/3 selon le palier) */
  };
  var MARK_MS = 30000, MAXQ = 6, mode = "full", queue = [], cur = null, timer = 0, marks = [], handlers = null, log = [];
  function $(id) { return document.getElementById(id); }
  function now() { return Date.now(); }
  function setMode(m) { mode = m === "quiet" || m === "off" ? m : "full"; if (mode === "off") { clearTimeout(timer); hideNow(); queue = []; } }
  function icon(t) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + (ICON[t] || ICON.event) + '" fill="currentColor"/></svg>'; }
  function waiting() { var m = $("menu"); return !!(m && !m.hidden && !m.classList.contains("out")); }

  /* ---- garde-fous anti-spam des bannières (en plus de la file unique et des doublons de clé) ---- */
  var CRIT = { saga: 1, attack: 1, event: 1, loot: 1, status: 1, claim: 1, heat: 1 }, recentB = {}, burst = [], seenFn = null;
  function jnote(text, status) { try { var c = BL.ui && BL.ui.noticeCore && BL.ui.noticeCore(); if (c) c.note(text, "ok", status); } catch (e) {} }
  function bindSeen(get) { seenFn = get; }                                   /* get() renvoie le tableau persisté state.notifSeen */
  function wasSeen(id) { var a = seenFn && seenFn(); return !!(a && a.indexOf(id) >= 0); }
  function markSeen(id) { var a = seenFn && seenFn(); if (a && a.indexOf(id) < 0) { a.push(id); while (a.length > 60) a.shift(); } }
  /* gate : true si la bannière peut être affichée. once = identifiant stable d'un événement déjà vu (jamais ré-annoncé après un rechargement) ;
     même clé dans les 6 s → ignorée ; plus de 3 bannières « secondaires » (niveau, design, boost…) en 20 s → seulement au journal. */
  function gate(n) {
    var t = now(), once = n.once ? String(n.once).slice(0, 60) : "", label = (n.title || "") + (n.text ? " : " + n.text : "");
    if (once && wasSeen(once)) { jnote(label, "déjà vu"); return false; }
    var k = n.key || n.type, r = recentB[k], here = (cur && cur.key === k) || queue.some(function (q) { return q.key === k; }); if (r !== undefined && t - r < 6000 && !here) { jnote(label, "doublon"); return false; }
    if (!CRIT[n.type]) { burst = burst.filter(function (x) { return t - x < 20000; }); if (burst.length >= 3) { jnote(label, "cadence"); if (once) markSeen(once); return false; } burst.push(t); }
    recentB[k] = t; if (once) markSeen(once); jnote(label, "bannière"); return true;
  }
  /* push : renvoie "banner" (mise en file), "toast" (petit message seulement) ou "" (rejeté) */
  function push(n) {
    if (!n || !TYPES[n.type]) return ""; if (!gate(n)) return "";
    var T = TYPES[n.type], o = { type: n.type, art: n.art ? String(n.art) : "", level: n.level | 0, title: String(n.title || T.label), text: String(n.text || ""), target: n.target || null, mark: n.mark === undefined ? n.target : n.mark, key: n.key || n.type, at: now() };
    log.push({ type: o.type, title: o.title, mode: mode, at: o.at }); if (log.length > 60) log.shift();
    if (mode === "off") { if (BL.ui && BL.ui.toast) BL.ui.toast(o.title + (o.text ? " : " + o.text : ""), n.type === "attack" || n.type === "event" ? "evt" : "ok"); return "toast"; }
    addMark(o);
    for (var i = 0; i < queue.length; i++) if (queue[i].key === o.key) { queue[i] = o; return "banner"; }          /* doublon : la plus récente remplace */
    if (cur && cur.key === o.key) { cur = o; render(); return "banner"; }
    if (queue.length >= MAXQ) queue.shift();
    if (T.prio) { queue.unshift(o); if (cur && !TYPES[cur.type].prio) { var pc = cur; cur = null; clearTimeout(timer); hideNow(); queue.splice(1, 0, pc); } pump(); return "banner"; }   /* priorité critique : passe devant la file et remplace une bannière ordinaire */
    queue.push(o); pump(); return "banner";
  }
  function addMark(o) {
    var m = o.mark; if (!m || !m.type) return; var t = TYPES[o.type]; marks = marks.filter(function (k) { return k.key !== o.key; });
    marks.push({ key: o.key, type: m.type, act: m.act, id: m.id, col: t.col, glyph: o.type, until: now() + MARK_MS });
  }
  function pump() {
    if (cur || !queue.length || waiting()) { if (!cur && queue.length && waiting()) { clearTimeout(timer); timer = setTimeout(pump, 500); } return; }
    cur = queue.shift(); render(); var T = TYPES[cur.type];
    if (mode === "full" && BL.audio) BL.audio.sfx(cur.type === "heat" ? "heat" + Math.max(1, Math.min(3, cur.level || 1)) : T.sound);
    clearTimeout(timer); timer = setTimeout(close, mode === "quiet" ? 2600 : T.ms);
  }
  function render() {
    var b = $("banner"); if (!b || !cur) return; var T = TYPES[cur.type], go = !!cur.target;
    b.className = "nbn " + (mode === "quiet" ? "quiet " : "") + (T.promo ? "promo " : "") + "t-" + cur.type + (cur.type === "heat" ? " hl" + Math.max(1, Math.min(3, cur.level || 1)) : ""); b.style.setProperty("--c", T.col); b.hidden = false;
    b.innerHTML = (cur.art ? '<div class="bn-art">' + cur.art + '</div>' : '<div class="bn-i">' + icon(cur.type) + '</div>') + '<div class="bn-t"><small>' + esc(T.label) + '</small><b>' + esc(cur.title) + '</b>' + (cur.text ? '<span>' + esc(cur.text) + "</span>" : "") + (go ? '<em>Toucher pour y aller</em>' : "") + '</div><button class="bn-x" aria-label="Fermer la notification">&times;</button><i class="bn-bar" style="animation-duration:' + (mode === "quiet" ? 2600 : T.ms) + 'ms"></i>';
    b.querySelector(".bn-x").onclick = function (e) { e.stopPropagation(); close(); };
    b.onclick = function () { var t = cur && cur.target; close(); if (t) jump(t); };
    b.setAttribute("role", "button"); b.tabIndex = 0; b.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.onclick(); } else if (e.key === "Escape") close(); };
    void b.offsetWidth; b.classList.add("show");
  }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function hideNow() { var b = $("banner"); if (b) { b.hidden = true; b.className = "nbn"; b.innerHTML = ""; } cur = null; }
  function close() {
    clearTimeout(timer); var b = $("banner"); if (!cur) return; cur = null;
    if (b) { b.classList.remove("show"); b.classList.add("out"); setTimeout(function () { if (!cur) { b.hidden = true; b.className = "nbn"; b.innerHTML = ""; } pump(); }, document.body.classList.contains("nomotion") ? 0 : 260); } else pump();
  }
  /* Aller à la cible : une section (view) ou un endroit de la carte (lot, quartier, QG). */
  function jump(t) {
    if (!t || !handlers) return; if (t.saga && BL.sagaUI) { BL.sagaUI.openChapter(); return; } marks = marks.filter(function (k) { return !(t.type && k.type === t.type && (k.act === t.act && k.id === t.id)); });
    var inRoom = BL.roomUI && BL.roomUI.isOpen && BL.roomUI.isOpen(); if (inRoom) BL.roomUI.exit();
    setTimeout(function () { if (t.view) handlers.go(t.view); else { handlers.go("map"); if (BL.mapUI && BL.mapUI.focus) BL.mapUI.focus(t); } }, inRoom ? 720 : 0);
  }
  function getMarks() { var t = now(); marks = marks.filter(function (k) { return k.until > t; }); return marks; }
  function clearMarks() { marks = []; }
  function init(h) { handlers = h; setInterval(function () { if (!cur && queue.length) pump(); }, 700); }
  function test() { push({ type: "levelup", title: "Test de notification", text: "Voici à quoi ressemblent les événements importants.", target: { type: "hq" }, mark: { type: "hq" }, key: "test" }); }
  BL.notify = { TYPES: TYPES, init: init, push: push, bindSeen: bindSeen, seen: wasSeen, setMode: setMode, mode: function () { return mode; }, marks: getMarks, clearMarks: clearMarks, close: close, jump: jump, test: test, pending: function () { return queue.length + (cur ? 1 : 0); }, current: function () { return cur; }, log: function () { return log.slice(); }, _reset: function () { recentB = {}; burst = []; queue = []; cur = null; marks = []; log = []; clearTimeout(timer); } };
})(typeof globalThis !== "undefined" ? globalThis : this);
