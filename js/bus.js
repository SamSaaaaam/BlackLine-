/* Bus de changements d'état + surveillance des états qui évoluent avec le temps (chantier « actualisation fiable »).
   Cause racine corrigée : rien ne signalait le passage d'un état à un autre (opération terminée, événement apparu, blessé guéri, boost fini…).
   Chaque écran ne voyait le changement que s'il était ouvert ET si sa « signature » de redessin le contenait. Désormais :
   - BL.watch.scan(state) calcule une signature par domaine à chaque tick et renvoie les domaines qui viennent de changer ;
   - BL.bus.emit(domaine) prévient les abonnés (interface, notifications) : ils se redessinent tout de suite, quelle que soit la page.
   Module pur : aucune dépendance au DOM, testable avec une horloge simulée. */
(function (root) {
  var BL = root.BL = root.BL || {}, subs = {}, ver = {};
  function on(domain, fn) { (subs[domain] = subs[domain] || []).push(fn); return function () { subs[domain] = (subs[domain] || []).filter(function (f) { return f !== fn; }); }; }
  function emit(domain, info) {
    ver[domain] = (ver[domain] || 0) + 1;
    (subs[domain] || []).slice().forEach(function (f) { try { f(info, domain); } catch (e) { if (root.console) root.console.error("[bus] " + domain, e); } });
    (subs["*"] || []).slice().forEach(function (f) { try { f(info, domain); } catch (e) { if (root.console) root.console.error("[bus] *", e); } });
  }
  function version(domain) { return ver[domain] || 0; }
  function reset() { subs = {}; ver = {}; }

  /* ---- signatures : une chaîne par domaine, comparée d'un tick à l'autre ---- */
  var last = null;
  function sigs(s) {
    var Q = BL.equip, E = BL.economy, o = {}, e = Q && s.eq ? Q.st(s) : null;
    if (Q && e) {
      var stt = Q.status(s);
      o.ops = stt.state + ":" + (e.op ? e.op.id + ":" + e.op.end : "") + ":" + (e.report ? e.report.at : 0) + ":" + e.hist.length;
      o.hurt = Object.keys(e.hurt).filter(function (k) { return Q.isHurt(s, k); }).sort().join(",");
    }
    o.events = (s.pending || "") + "|" + (s.pendingFac || "") + "|" + (s.pendingCrew || "");
    o.boost = s.boost && s.boost.until > s.t ? String(s.boost.mult) : "";
    o.conflict = s.terr && s.terr.conflict ? s.terr.conflict.did + ":" + s.terr.conflict.fid : "";
    if (BL.factions && s.fac) o.diplo = BL.factions.list().map(function (f) { var x = s.fac[f.id]; return (x && x.ally > s.t ? "a" : "") + (x && x.truce > s.t ? "t" : ""); }).join(",");
    if (E && BL.data) {
      var n = 0; BL.data.missions.forEach(function (m) { if (!s.claimed[m.id] && E.progress(s, m.cond).done) n++; });
      o.missions = n + ":" + E.count(s.claimed);
      o.achs = String(E.count(s.ach));
    }
    if (BL.gold) o.gold = s.gold + ":" + (s.gold >= BL.gold.capacity(s) ? 1 : 0);
    return o;
  }
  /* renvoie les domaines modifiés depuis le dernier scan (le premier scan ne signale rien : c'est l'état initial) */
  function scan(s) {
    var cur = sigs(s), out = [], k;
    if (last) for (k in cur) if (last[k] !== cur[k]) out.push(k);
    last = cur; return out;
  }
  function forget() { last = null; }
  BL.bus = { on: on, emit: emit, version: version, reset: reset };
  BL.watch = { sigs: sigs, scan: scan, forget: forget };
})(typeof globalThis !== "undefined" ? globalThis : this);
