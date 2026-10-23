/* Boss de quartier (Partie 13 · C3) : guerre de gangs en 3 manches (défense, attaque, finale). Logique pure, déterministe.
   Le boss annonce sa tactique AVANT que tu choisisses (la chance de chaque réponse est affichée, exacte). Le tirage dépend d'une graine
   (boss, numéro de tentative, manche, tactique) : recharger la sauvegarde ne permet pas de retenter. Défaite = la mise est perdue, rien d'autre ;
   victoire = récompense unique par boss (argent borné, trophée, +0,5 % de revenus au plus 6 fois). */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.war; } function P() { return D().params; } function E() { return BL.economy; } function T() { return BL.territory; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function initState(s) { s.war = { done: {}, cd: {}, n: 0, cur: null }; }
  function w(s) { if (!s.war || !isObj(s.war)) initState(s); return s.war; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function tIdx(id) { var r = -1; D().tactics.forEach(function (t, i) { if (t.id === id) r = i; }); return r; }
  function bossOf(id) { var b = D().bosses[id]; return b ? Object.assign({ id: id }, b) : null; }
  function stake(s) { return Math.ceil(Math.max(P().stakeFloor, E().incomeBase(s) * 60 * P().stakeMin)); }
  function reward(s) { return Math.round(Math.min(P().rewardCap, P().rewardMin) * 60 * Math.max(50, E().incomeBase(s))); }
  function trophies(s) { return Object.keys(w(s).done).length; }
  function incMult(s) { return 1 + Math.min(P().incCap, P().incPer * trophies(s)); }
  /* Pourquoi on peut (ou non) défier ce boss. */
  function why(s, did) {
    var d = T().dist(did), b = bossOf(did); if (!d || !b) return "Boss inconnu.";
    if (w(s).done[did]) return "Boss déjà vaincu : trophée acquis."; if (T().lv(s, did) >= 1) return "Ce quartier est déjà à toi.";
    if (w(s).cur) return w(s).cur.id === did ? "" : "Une guerre est déjà en cours.";
    if (!d.neighbors.some(function (n) { return T().lv(s, n) >= 1; })) return "Contrôle d'abord un quartier voisin.";
    if (E().level(s) < (d.req && d.req.lvl || 1)) return "Niveau d'empire " + d.req.lvl + " requis (tu es niveau " + E().level(s) + ").";
    var cd = (w(s).cd[did] || 0) - s.t; if (cd > 0) return "Ses hommes se regroupent : reviens dans " + Math.ceil(cd / 60) + " min.";
    if (s.money + 1e-9 < stake(s)) return "Il te manque de l'argent pour la mise.";
    return "";
  }
  function list(s) { return Object.keys(D().bosses).map(function (id) { var d = T().dist(id); return d ? { id: id, boss: bossOf(id), district: d, done: !!w(s).done[id], why: why(s, id), active: !!(w(s).cur && w(s).cur.id === id) } : null; }).filter(Boolean); }
  /* Tactique annoncée du boss pour une manche : tirée de la graine, biaisée par la personnalité de sa faction (agressive : plus de force). */
  function tell(s, did, n, r) {
    var d = T().dist(did), p = BL.rivals ? BL.rivals.personality(d.holder) : "diplomat", x = hash(did + ":" + n + ":" + r + ":t");
    if (p === "aggressive") return x < 0.5 ? "force" : x < 0.75 ? "ruse" : "argent"; if (p === "opportunist") return x < 0.5 ? "ruse" : x < 0.75 ? "argent" : "force"; return x < 0.5 ? "argent" : x < 0.75 ? "force" : "ruse";
  }
  function crewAdj(s) { var n = BL.crew ? BL.crew.active(s).length : 0; return clamp(P().crewBase + P().crewStep * Math.min(4, n), -P().maxAdj, P().maxAdj); }
  function chance(s, boss, mine) {
    var base = mine === boss ? P().chanceTie : D().beats[mine] === boss ? P().chanceRight : P().chanceWrong; return clamp(base + crewAdj(s), P().chanceMin, P().chanceMax);
  }
  function start(s, did) {
    var m = why(s, did); if (m) return null; var c = stake(s); E().spend(s, c); var x = w(s); x.n += 1;
    x.cur = { id: did, n: x.n, r: 0, wins: 0, losses: 0, log: [] }; return { stake: c, state: view(s) };
  }
  /* Vue de la manche courante : annonce du boss + chance exacte de chaque réponse. */
  function view(s) {
    var c = w(s).cur; if (!c) return null; var rd = D().rounds[c.r], bt = tell(s, c.id, c.n, c.r);
    return { id: c.id, boss: bossOf(c.id), round: c.r, roundDef: rd, rounds: P().rounds, wins: c.wins, losses: c.losses, tell: bt, log: c.log.slice(), options: D().tactics.map(function (t) { return { id: t.id, name: t.name, text: t.text, chance: chance(s, bt, t.id) }; }) };
  }
  function pick(s, tactic) {
    var c = w(s).cur; if (!c || tIdx(tactic) < 0) return null; var bt = tell(s, c.id, c.n, c.r), ch = chance(s, bt, tactic), win = hash(c.id + ":" + c.n + ":" + c.r + ":" + tactic + ":r") < ch;
    c.log.push({ r: c.r, mine: tactic, boss: bt, win: win, chance: ch }); if (win) c.wins++; else c.losses++; c.r++;
    var res = { win: win, chance: ch, boss: bt, over: false, victory: false };
    if (c.wins >= P().winNeed) { res.over = true; res.victory = true; } else if (c.losses >= P().rounds - P().winNeed + 1 || c.r >= P().rounds) { res.over = true; }
    if (res.over) res.end = finish(s, res.victory); return res;
  }
  function finish(s, victory) {
    var x = w(s), c = x.cur, d = T().dist(c.id), out = { id: c.id, victory: victory, money: 0 };
    x.cur = null;
    if (victory) { x.done[c.id] = 1; out.money = reward(s); s.money += out.money; s.total += out.money; if (s.fac && s.fac[d.holder]) { s.fac[d.holder].power = Math.max(1, s.fac[d.holder].power * P().powerMul); if (BL.factions) BL.factions.gain(s, d.holder, P().relLoss); } if (BL.rivals) BL.rivals.record(s, d.holder, "cwin"); if (E().addLog) E().addLog(s, "Guerre de gangs gagnée : " + bossOf(c.id).name + " est tombé. Trophée : " + bossOf(c.id).trophy + "."); }
    else { x.cd[c.id] = s.t + P().cooldownSec; if (E().addLog) E().addLog(s, "Guerre de gangs perdue contre " + bossOf(c.id).name + " : la mise est perdue, rien d'autre. Réessaie dans 15 min."); }
    return out;
  }
  function abandon(s) { var c = w(s).cur; if (!c) return null; return finish(s, false); }
  function sanitize(r, s) {
    initState(s); if (!isObj(r) || !isObj(r.war)) return; var q = r.war, x = s.war, T0 = typeof r.t === "number" && isFinite(r.t) ? Math.max(0, r.t) : 0;
    if (isObj(q.done)) Object.keys(q.done).forEach(function (k) { if (D().bosses[k] && q.done[k]) x.done[k] = 1; });
    if (isObj(q.cd)) Object.keys(q.cd).forEach(function (k) { if (D().bosses[k] && typeof q.cd[k] === "number" && isFinite(q.cd[k])) x.cd[k] = clamp(q.cd[k], 0, T0 + P().cooldownSec); });
    x.n = Math.floor(clamp(typeof q.n === "number" && isFinite(q.n) ? q.n : 0, 0, 1e9));
    var c = q.cur; if (isObj(c) && D().bosses[c.id] && !x.done[c.id]) {
      var cc = { id: c.id, n: Math.floor(clamp(+c.n || 0, 0, 1e9)), r: 0, wins: 0, losses: 0, log: [] }; cc.n = Math.max(1, Math.min(cc.n, x.n || cc.n));
      if (Array.isArray(c.log)) c.log.slice(0, 3).forEach(function (l, i) { if (isObj(l) && tIdx(l.mine) >= 0) { var win = l.win === true; cc.log.push({ r: i, mine: l.mine, boss: tIdx(l.boss) >= 0 ? l.boss : "force", win: win, chance: clamp(+l.chance || 0.5, 0, 1) }); if (win) cc.wins++; else cc.losses++; } });
      cc.r = cc.log.length; if (cc.wins < P().winNeed && cc.losses < P().rounds - P().winNeed + 1 && cc.r < P().rounds) x.cur = cc; x.n = Math.max(x.n, cc.n);
    }
  }
  BL.war = { initState: initState, sanitize: sanitize, stake: stake, reward: reward, trophies: trophies, incMult: incMult, why: why, list: list, start: start, view: view, pick: pick, abandon: abandon, tell: tell, chance: chance, bossOf: bossOf, state: w };
})(typeof globalThis !== "undefined" ? globalThis : this);
