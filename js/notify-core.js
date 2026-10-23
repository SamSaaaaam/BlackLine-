/* Moteur de notifications (logique pure, horloge injectée, aucun accès au DOM).
   Règles dures qui rendent le spam IMPOSSIBLE, quelle que soit la source :
   1. file unique avec priorité : 0 information, 1 progression, 2 résultat, 3 critique ;
   2. déduplication : un message identique déjà visible, en file ou émis depuis moins de dedupMs est fusionné (compteur « ×N »), jamais ré-affiché ;
   3. regroupement : des messages d'un même groupe émis dans la fenêtre groupMs deviennent UNE carte (« … (+N autres) ») ;
   4. plafond d'affichage : au plus maxVisible cartes à l'écran, le reste attend ; la file est plafonnée (maxQueue) : on abandonne d'abord les infos
      les plus anciennes, jamais un message critique (sauf plafond absolu hardQueue) ;
   5. cadence : plus de rateMax messages non importants dans rateWin ms → les suivants vont au journal seulement ;
   6. silence au chargement et au retour d'onglet : quiet(ms) ne laisse passer que le critique ; hold() met tout en attente quand l'onglet est caché,
      release() n'affiche alors qu'UN récapitulatif ;
   7. journal : les 30 derniers messages (même fusionnés, abandonnés ou retenus) restent consultables. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var DEF = { maxVisible: 3, maxQueue: 8, hardQueue: 24, dedupMs: 6000, groupMs: 2500, rateWin: 10000, rateMax: 8, journalMax: 30, holdMax: 60, showMs: 3600 };
  function create(opt) {
    var C = {}; for (var k in DEF) C[k] = opt && opt[k] !== undefined ? opt[k] : DEF[k];
    var clock = opt && opt.now ? opt.now : function () { return Date.now(); };
    var vis = [], queue = [], journal = [], recent = {}, stamps = [], held = [], holding = false, quietUntil = 0, uid = 0, stats = { offered: 0, shown: 0, merged: 0, dropped: 0, journalOnly: 0, held: 0 }, ls = [];

    function emit() { for (var i = 0; i < ls.length; i++) { try { ls[i](vis.slice()); } catch (e) {} } }
    function log(n, status) { journal.push({ text: n.text, kind: n.kind, prio: n.prio, at: clock(), count: n.count || 1, status: status }); while (journal.length > C.journalMax) journal.shift(); }
    function norm(n) {
      var p = typeof n.prio === "number" && isFinite(n.prio) ? Math.max(0, Math.min(3, Math.floor(n.prio))) : 1, text = String(n.text == null ? "" : n.text).slice(0, 240);
      return { id: 0, key: n.key ? String(n.key).slice(0, 80) : (n.kind || "") + "|" + text, group: n.group ? String(n.group).slice(0, 60) : "", text: text, base: text, kind: n.kind || "ok", prio: p, count: 1, extra: 0, since: 0, until: 0, ms: n.ms > 0 ? n.ms : C.showMs };
    }
    function label(n) { return n.base + (n.extra ? " (+" + n.extra + (n.extra > 1 ? " autres)" : " autre)") : n.count > 1 ? " ×" + n.count : ""); }
    function render(n) { n.text = label(n); return n; }
    function absorb(into, n, now, grouped) {
      if (grouped) { into.extra++; into.base = n.base; } else into.count++;
      into.until = Math.max(into.until, now + n.ms); render(into); stats.merged++;
    }
    function find(list, n, now) {
      for (var i = 0; i < list.length; i++) { var x = list[i]; if (x.key === n.key) return { x: x, g: false }; }
      if (n.group) for (var j = 0; j < list.length; j++) { var y = list[j]; if (y.group === n.group && now - y.since <= C.groupMs) return { x: y, g: true }; }
      return null;
    }
    function promote(now) {
      var changed = false;
      while (vis.length < C.maxVisible && queue.length) {
        queue.sort(function (a, b) { return b.prio - a.prio || a.id - b.id; });
        var n = queue.shift(); n.since = now; n.until = now + n.ms; vis.push(n); stats.shown++; changed = true;
      }
      return changed;
    }
    function trimQueue() {
      while (queue.length > C.maxQueue) {
        var idx = -1;
        for (var i = 0; i < queue.length; i++) { var q = queue[i]; if (q.prio >= 3) continue; if (idx < 0 || q.prio < queue[idx].prio || (q.prio === queue[idx].prio && q.id < queue[idx].id)) idx = i; }
        if (idx < 0) { if (queue.length > C.hardQueue) idx = 0; else break; }
        var d = queue.splice(idx, 1)[0]; stats.dropped++; log(d, "abandonné");
      }
    }
    /* offer : renvoie "show" | "queue" | "merge" | "journal" | "held" */
    function offer(raw) {
      stats.offered++; var now = clock(), n = norm(raw); n.id = ++uid;
      if (!n.text) { return "journal"; }
      if (holding) { if (held.length < C.holdMax) held.push(raw); stats.held++; return "held"; }
      if (n.prio < 3 && now < quietUntil) { log(n, "silence"); stats.journalOnly++; return "journal"; }
      var f = find(vis, n, now) || find(queue, n, now);
      if (f) { absorb(f.x, n, now, f.g); log(f.g ? n : f.x, f.g ? "regroupé" : "fusionné"); emit(); return "merge"; }
      var r = recent[n.key]; if (r !== undefined && now - r < C.dedupMs && n.prio < 3) { stats.merged++; log(n, "doublon"); return "merge"; }
      /* cadence : au-delà de rateMax messages en rateWin ms, seuls les résultats et les critiques passent */
      stamps = stamps.filter(function (t) { return now - t < C.rateWin; });
      if (n.prio < 2 && stamps.length >= C.rateMax) { log(n, "cadence"); stats.journalOnly++; return "journal"; }
      stamps.push(now); recent[n.key] = now;
      render(n); log(n, "affiché");
      if (vis.length < C.maxVisible) { n.since = now; n.until = now + n.ms; vis.push(n); stats.shown++; emit(); return "show"; }
      queue.push(n); trimQueue(); emit(); return "queue";
    }
    /* tick : retire les cartes expirées, en promeut depuis la file ; renvoie true si l'affichage a changé */
    function tick() {
      var now = clock(), before = vis.length;
      vis = vis.filter(function (n) { return n.until > now; }); var ch = vis.length !== before; if (promote(now)) ch = true;
      for (var k in recent) if (now - recent[k] > C.dedupMs * 4) delete recent[k];
      if (ch) emit(); return ch;
    }
    function dismiss(id) { var b = vis.length; vis = vis.filter(function (n) { return n.id !== id; }); if (vis.length !== b) { promote(clock()); emit(); return true; } return false; }
    function quiet(ms) { quietUntil = Math.max(quietUntil, clock() + (ms > 0 ? ms : 0)); }
    /* note : inscrit une ligne dans le journal sans rien afficher (utilisé par les bannières) */
    function note(text, kind, status) { log({ text: String(text || "").slice(0, 240), kind: kind || "ok", prio: 1, count: 1 }, status || "note"); }
    function unquiet() { quietUntil = 0; }
    function hold(on) { holding = !!on; }
    function release(extraQuietMs) {
      holding = false; var h = held; held = []; if (extraQuietMs > 0) quiet(extraQuietMs);
      var crit = h.filter(function (x) { return x && x.prio === 3; }), rest = h.length - crit.length;
      crit.forEach(offer);
      if (rest > 0) offer({ key: "absence", text: rest === 1 ? "Une notification pendant ton absence : voir le journal." : rest + " notifications pendant ton absence : voir le journal.", kind: "ok", prio: 1 });
      h.forEach(function (x) { if (x && x.prio !== 3) log(norm(x), "absence"); });
      return rest;
    }
    function clear() { vis = []; queue = []; held = []; emit(); }
    return {
      offer: offer, tick: tick, dismiss: dismiss, quiet: quiet, unquiet: unquiet, note: note, hold: hold, release: release, clear: clear, visible: function () { return vis.slice(); }, queued: function () { return queue.length; },
      journal: function () { return journal.slice().reverse(); }, stats: function () { return JSON.parse(JSON.stringify(stats)); }, onChange: function (f) { ls.push(f); }, config: C, isHolding: function () { return holding; }
    };
  }
  BL.notifyCore = { create: create, DEF: DEF };
})(typeof globalThis !== "undefined" ? globalThis : this);
