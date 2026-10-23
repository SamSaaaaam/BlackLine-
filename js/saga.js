/* La trame du parrain (Partie 13 · C1) : chapitres, décisions aux conséquences durables, fins. Logique pure, aucun DOM.
   État : s.saga = { pick : { chapitre : { décision : option } }, ends : [fins vues], seen : [chapitres annoncés] }.
   Les tons, la fin et les bonus permanents sont TOUJOURS recalculés à partir des choix (rien d'autre n'est stocké) :
   une sauvegarde modifiée à la main ne peut pas donner un bonus que les choix ne justifient pas, et un choix ne s'applique qu'une fois.
   Les effets continus (revenu, entretien, chaleur, réputation, rivaux) sont bornés (data.saga.params). Les effets ponctuels (argent, lingots, relation)
   sont appliqués au moment du choix, une seule fois. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.saga; } function P() { return D().params; } function E() { return BL.economy; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  var CH = null, BYID = null;
  function chapters() { return D().chapters; }
  function chapter(id) { if (!BYID) { BYID = {}; D().chapters.forEach(function (c) { BYID[c.id] = c; }); } return BYID[id] || null; }
  function opt(ch, dId, oId) { var d = null, o = null; ch.decisions.forEach(function (x) { if (x.id === dId) d = x; }); if (!d) return null; d.opts.forEach(function (x) { if (x.id === oId) o = x; }); return o ? { d: d, o: o } : null; }

  function initState(s) { s.saga = { pick: {}, ends: [], seen: [] }; }
  /* Nettoyage strict : on ne garde que les (chapitre, décision, option) qui existent, dans l'ordre des chapitres ; un chapitre n'est conservé que si le précédent est terminé. */
  function sanitize(r, s) {
    initState(s); if (!isObj(r) || !isObj(r.saga)) return; var q = r.saga, ok = true;
    D().chapters.forEach(function (ch) {
      if (!ok || !isObj(q.pick) || !isObj(q.pick[ch.id])) { ok = false; return; }
      var got = {}; ch.decisions.forEach(function (d) { var v = q.pick[ch.id][d.id]; if (typeof v === "string" && opt(ch, d.id, v)) got[d.id] = v; });
      if (Object.keys(got).length) s.saga.pick[ch.id] = got; if (Object.keys(got).length < ch.decisions.length) ok = false;
    });
    if (Array.isArray(q.ends)) q.ends.slice(0, 12).forEach(function (e) { if (typeof e === "string" && D().endings.some(function (x) { return x.id === e; }) && s.saga.ends.indexOf(e) < 0) s.saga.ends.push(e); });
    if (Array.isArray(q.seen)) q.seen.slice(0, 20).forEach(function (e) { if (typeof e === "string" && chapter(e) && s.saga.seen.indexOf(e) < 0) s.saga.seen.push(e); });
    var en = ending(s); if (en && s.saga.ends.indexOf(en.id) < 0) s.saga.ends.push(en.id);
  }
  function sg(s) { if (!s.saga || !isObj(s.saga.pick)) initState(s); return s.saga; }
  function picked(s, chId) { return sg(s).pick[chId] || {}; }
  function complete(s, chId) { var c = chapter(chId); return !!c && c.decisions.every(function (d) { return !!picked(s, chId)[d.id]; }); }
  function terrCount(s) { var n = 0; if (!BL.territory) return 0; BL.data.territory.districts.forEach(function (d) { if (BL.territory.lv(s, d.id) >= 1) n++; }); return n; }
  /* Chapitre en cours : le premier non terminé. ready = conditions remplies. */
  function current(s) {
    var cs = chapters(); for (var i = 0; i < cs.length; i++) if (!complete(s, cs[i].id)) {
      var c = cs[i], L = E().level(s), T = terrCount(s);
      return { ch: c, index: i, ready: L >= c.need.lvl && T >= c.need.terr, haveLvl: L, haveTerr: T, started: Object.keys(picked(s, c.id)).length > 0 };
    }
    return null;
  }
  function done(s) { return !current(s); }

  /* Tons et fin */
  function tones(s) {
    var t = { c: 0, f: 0, l: 0 }; chapters().forEach(function (ch, i) { var p = picked(s, ch.id); ch.decisions.forEach(function (d) { var o = p[d.id] && opt(ch, d.id, p[d.id]); if (o) t[o.o.tone] += i === chapters().length - 1 ? 2 : 1; }); }); return t;
  }
  function ending(s) {
    if (!done(s)) return null; var t = tones(s), mx = Math.max(t.c, t.f, t.l), mn = Math.min(t.c, t.f, t.l), k = mx - mn <= 1 ? "x" : t.l === mx ? "l" : t.c === mx ? "c" : "f", out = null;
    D().endings.forEach(function (e) { if (e.tone === k) out = e; }); return out;
  }
  /* Effets continus : somme des choix + bonus de fin, bornés. */
  function fx(s) {
    var o = { inc: 0, upkeep: 0, heat: 0, rep: 0, rival: 0 }, add = function (f) { if (!f) return; ["inc", "upkeep", "heat", "rep", "rival"].forEach(function (k) { if (typeof f[k] === "number" && isFinite(f[k])) o[k] += f[k]; }); };
    chapters().forEach(function (ch) { var p = picked(s, ch.id); ch.decisions.forEach(function (d) { var x = p[d.id] && opt(ch, d.id, p[d.id]); if (x) add(x.o.fx); }); });
    var en = ending(s); if (en) add(en.fx); var p = P();
    return { inc: clamp(o.inc, -p.incCap, p.incCap), upkeep: clamp(o.upkeep, -p.upkeepCap, p.upkeepCap), heat: clamp(o.heat, -p.heatCap, p.heatCap), rep: clamp(Math.round(o.rep), 0, p.repCap), rival: clamp(o.rival, -p.rivalCap, p.rivalCap) };
  }
  function incMult(s) { return 1 + fx(s).inc; } function upkeepMult(s) { return 1 + fx(s).upkeep; } function heatMul(s) { return 1 + fx(s).heat; }
  function repBonus(s) { return fx(s).rep; } function rivalMul(s) { return 1 + fx(s).rival; }

  /* Coût / gain ponctuel en argent : minutes de revenu (revenu net, plancher minIncome), plafonné. */
  function moneyOf(s, mins) { var inc = Math.max(P().minIncome, E().incomeBase(s)); return Math.round(clamp(mins, -P().moneyCapMin, P().moneyCapMin) * 60 * inc); }
  function why(s, chId, dId, oId) {
    var cur = current(s), c = chapter(chId), x = c && opt(c, dId, oId); if (!x) return "Choix inconnu.";
    if (!cur || cur.ch.id !== chId) return picked(s, chId)[dId] ? "Déjà décidé : un choix ne se refait pas." : "Ce chapitre n’est pas encore ouvert.";
    if (!cur.ready) return "Conditions non remplies.";
    if (picked(s, chId)[dId]) return "Déjà décidé : un choix ne se refait pas.";
    var m = x.o.fx && x.o.fx.money; if (m < 0 && s.money + 1e-9 < -moneyOf(s, m)) return "Il te manque de l’argent pour ce choix.";
    return "";
  }
  function choose(s, chId, dId, oId) {
    if (why(s, chId, dId, oId)) return null; var c = chapter(chId), x = opt(c, dId, oId), f = x.o.fx || {}, res = { chapter: c, decision: x.d, option: x.o, money: 0, gold: 0, fac: {} };
    if (typeof f.money === "number" && f.money) { var amt = moneyOf(s, f.money); if (amt < 0) E().spend(s, -amt); else { s.money += amt; s.total += amt; } res.money = amt; }
    if (typeof f.gold === "number" && f.gold > 0 && BL.gold) { var g = Math.min(Math.floor(f.gold), BL.gold.space(s)); s.gold += g; res.gold = g; }
    if (isObj(f.fac) && BL.factions) Object.keys(f.fac).forEach(function (k) { if (s.fac && s.fac[k]) res.fac[k] = BL.factions.gain(s, k, f.fac[k]); });
    var p = sg(s); if (!p.pick[chId]) p.pick[chId] = {}; p.pick[chId][dId] = oId;
    res.chapterDone = complete(s, chId); var en = ending(s); if (en) { res.ending = en; if (p.ends.indexOf(en.id) < 0) p.ends.push(en.id); }
    if (E().addLog) E().addLog(s, "Histoire · « " + c.title + " » : " + x.o.label + ".");
    return res;
  }
  /* Annonce (une seule fois par chapitre). */
  function pending(s) { var c = current(s); return c && c.ready && sg(s).seen.indexOf(c.ch.id) < 0 && !c.started ? c.ch : null; }
  function markSeen(s, chId) { var p = sg(s); if (p.seen.indexOf(chId) < 0 && chapter(chId)) p.seen.push(chId); }

  /* Texte des effets (affiché AVANT de choisir : ce qui est écrit est exactement ce qui sera appliqué). */
  var FN = { valcourt: "Maison Valcourt", corbeaux: "Les Corbeaux", meridian: "Consortium Meridian", lames: "Les Lames du Nord" };
  function pct(x) { var v = Math.round(Math.abs(x) * 100); return (x > 0 ? "+" : "−") + v + " %"; }
  function fxLines(f) {
    var o = []; if (!f) return o;
    if (f.inc) o.push("Revenus " + pct(f.inc)); if (f.upkeep) o.push("Entretien " + pct(f.upkeep)); if (f.heat) o.push("Chaleur gagnée " + pct(f.heat)); if (f.rep) o.push("Réputation +" + f.rep); if (f.rival) o.push("Rivaux " + pct(f.rival) + " plus " + (f.rival < 0 ? "lents" : "rapides"));
    if (f.money) o.push((f.money > 0 ? "+" : "−") + Math.abs(f.money) + " min de revenu en argent"); if (f.gold) o.push("+" + f.gold + " lingot" + (f.gold > 1 ? "s" : ""));
    if (isObj(f.fac)) Object.keys(f.fac).forEach(function (k) { o.push((FN[k] || k) + " : relation " + (f.fac[k] > 0 ? "+" : "−") + Math.abs(f.fac[k])); });
    return o;
  }
  BL.saga = { initState: initState, sanitize: sanitize, chapters: chapters, chapter: chapter, picked: picked, complete: complete, current: current, done: done, tones: tones, ending: ending, fx: fx, incMult: incMult, upkeepMult: upkeepMult, heatMul: heatMul, repBonus: repBonus, rivalMul: rivalMul, why: why, choose: choose, pending: pending, markSeen: markSeen, fxLines: fxLines, terrCount: terrCount, moneyOf: moneyOf, opt: opt };
})(typeof globalThis !== "undefined" ? globalThis : this);
