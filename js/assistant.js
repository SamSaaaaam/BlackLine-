/* L'assistante de l'empire : LOGIQUE PURE (aucun accès au DOM, horloge et hasard injectés → entièrement testable).
   Elle repère ce qui est utile (événement, attaque, objectif à réclamer, boost qui finit, coffre plein, bâtiment constructible),
   en fait des alertes avec un conseil chiffré, et décide QUAND en montrer une : une seule à la fois, file d'attente,
   délai entre deux bulles, cooldown par alerte, jamais pendant le menu / le didacticiel / un placement au QG.
   Elle ne modifie jamais l'état du jeu : les boutons déclenchent les vraies actions de main.js. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var PERSON = {
    name: "Inès", full: "Inès Marchand", role: "Secrétaire de direction",
    look: { bg: ["#243247", "#0d131c"], skin: "#c58f6c", hair: "#2a1a14", style: "bun", face: "oval", female: true, glasses: "round", glassColor: "#c8a45e", lips: "#8f2f3f", suit: "#1c2433", shirt: "#efe9dc", extra: ["earring"], tie: null }
  };
  var COOL = { timeout: 300000, later: 600000, action: 300000, blocked: 15000 };   /* temps avant qu'une même alerte puisse revenir (ms) */
  var MIN_GAP = 25000, MIN_GAP_HIGH = 6000, SHOW = { normal: 16000, high: 24000 }, STALE = 90000, MAXQ = 4, SOON_EVENT = 60, SOON_ATTACK = 45, BOOST_END = 30;
  var IMPORTANT = { attack: 1, attack_soon: 1, event_now: 1, vault_full: 1 };   /* mode « Discrète » : seulement celles-ci */

  /* 3 ou 4 phrases par type, ton pro et un peu complice. Jetons : {d} quartier, {f} faction, {t} délai, {n} nombre, {a} nom d'une activité, {e} événement, {m} objectif */
  var PHRASES = {
    attack: ["Patron, {f} rôde autour de {d}. Je prépare la défense ?", "Mauvaise nouvelle : {f} attaque {d}. Il reste {t} pour réagir.", "On a de la visite à {d} : {f} veut nous déloger. Je m’en occupe ?", "Patron, {f} montre les dents à {d}. Une décision s’impose."],
    attack_soon: ["Patron, ça sent la tension : une attaque pourrait arriver d’ici {t}.", "Mes contacts murmurent que quelqu’un va tester nos quartiers dans {t}.", "Un peu de calme avant la tempête, je crois. Prévois de quoi te défendre.", "Les rues sont nerveuses. Je préfère que tu sois prêt avant {t}."],
    event_now: ["Patron, il y a du nouveau : « {e} ». Il faut trancher.", "On vous attend pour une décision : « {e} ».", "Un dossier urgent sur votre bureau : « {e} ».", "Patron, « {e} » ne va pas attendre éternellement."],
    event_soon: ["Je sens qu’un imprévu arrive d’ici {t}. Mieux vaut ne pas être à sec.", "Patron, l’agenda se complique : quelque chose se prépare dans {t}.", "Un événement approche, dans {t} environ. Gardez un peu de marge.", "Je ne promets rien, mais ça va bouger d’ici {t}."],
    claim: ["Patron, un objectif est accompli : « {m} ». La récompense vous attend.", "Bonne nouvelle : « {m} » est réglé. Passez la récolter !", "« {m} » est terminé. Ce serait dommage de laisser la prime sur la table.", "Les comptes sont bons pour « {m} ». À vous de réclamer."],
    boost_end: ["Patron, votre boost se termine dans {t}.", "Le coup de fouet de revenus touche à sa fin : {t}.", "Plus que {t} de boost. Profitez-en bien !", "Votre boost expire dans {t}. Je vous le signale, au cas où."],
    vault_full: ["Le coffre est plein, Patron : {n} lingots, plus de place.", "Je ne peux plus rien ranger : le coffre déborde ({n} lingots).", "Patron, le coffre est au maximum. Il faudrait l’agrandir.", "Plus une place dans le coffre. Les prochains lingots seraient perdus pour rien."],
    buildable: ["Patron, un nouvel emplacement est prêt pour « {a} ».", "Bonne nouvelle : vous pouvez construire un bâtiment de plus pour « {a} ».", "« {a} » peut s’agrandir d’un bâtiment. Les fonds sont là.", "Un terrain libre pour « {a} », et de quoi le payer. On y va ?"]
  };
  var MARKS = ["attack", "attack_soon", "event_now", "event_soon", "claim", "boost_end", "vault_full", "buildable"];

  function E() { return BL.economy; } function D() { return BL.data; } function T() { return BL.territory; }
  function num(x, d) { return typeof x === "number" && isFinite(x) ? x : d; }
  function dur(sec) { sec = Math.max(0, Math.round(sec)); return sec >= 5400 ? Math.round(sec / 3600) + " h" : sec >= 90 ? Math.round(sec / 60) + " min" : sec + " s"; }
  function pct(x) { return Math.round(Math.max(0, Math.min(1, x)) * 100) + " %"; }
  function fill(tpl, v) { return String(tpl).replace(/\{(\w)\}/g, function (m, k) { return v && v[k] !== undefined ? v[k] : ""; }); }

  /* ---------- conseils chiffrés : ce qu'elle recommande et pourquoi ---------- */
  /* événement en cours : espérance de gain de chaque choix, et pire cas, en secondes de revenu */
  function outcomeSec(o) { if (!o) return { ev: 0, worst: 0 }; if (o.chance !== undefined) { var w = outcomeSec(o.win), l = outcomeSec(o.lose); return { ev: o.chance * w.ev + (1 - o.chance) * l.ev, worst: Math.min(w.worst, l.worst) }; } var x = num(o.sec, 0); return { ev: x, worst: x }; }
  function eventAdvice(s, fmt) {
    var ev = E().find(D().events, s.pending); if (!ev) return null;
    var inc = Math.max(E().incomeBase(s), 1), best = null, safe = null;
    ev.choices.forEach(function (c, i) { var r = outcomeSec(c.out), x = { i: i, label: c.label, ev: r.ev * inc, worst: r.worst * inc }; if (!best || x.ev > best.ev) best = x; if (!safe || x.worst > safe.worst) safe = x; });
    if (!best) return null;
    var lab = function (x) { return String(x.label || "").replace(/\{[a-z]\}/g, "").trim(); };
    var risky = best.worst < 0 && -best.worst > s.money * 0.5;     /* le pire cas dépasse la moitié de la trésorerie */
    var pick = risky ? safe : best;
    var why = risky ? "Le pire cas coûterait " + fmt(Math.abs(best.worst)) + ", soit plus de la moitié de ta trésorerie : je choisis la prudence." : (best.ev > 0 ? "Gain moyen estimé : +" + fmt(best.ev) + "." : "C’est le choix qui coûte le moins en moyenne (" + fmt(Math.abs(best.ev)) + ").");
    return { title: E().fText(ev.title, s.pendingFac, s.pendingCrew), text: "Je conseille « " + lab(pick) + " ». " + why, pick: pick.i };
  }
  /* pire perte possible d'un événement, en argent : sert à conseiller une réserve */
  function worstEventLoss(s) {
    var inc = Math.max(E().incomeBase(s), 1), lvl = E().level(s), w = 0;
    D().events.forEach(function (e) { if (e.minLvl && lvl < e.minLvl) return; e.choices.forEach(function (c) { var r = outcomeSec(c.out); if (r.worst < w) w = r.worst; }); });
    return Math.min(-w * inc, Math.max(s.money, 0) + 1e12);
  }

  /* ---------- détection : renvoie les alertes valables MAINTENANT (la file et les délais sont gérés plus bas) ---------- */
  function detect(s, o) {
    var out = [], fmt = (o && o.money) || String, t = num(s.t, 0), tr = T(), seen = (o && o.seenBuild) || {};
    function add(a) { a.importance = IMPORTANT[a.type] ? "high" : "normal"; out.push(a); }
    try {   /* attaque en cours */
      var c = s.terr && s.terr.conflict;
      if (c && tr) {
        var d = tr.dist(c.did), f = tr.faction(c.fid), ch = tr.defendChance(s), dc = tr.defendCost(d), tc = tr.truceCost(d, s), left = Math.max(0, c.until - t), canD = s.money >= dc, canT = s.money >= tc, rec, advice, btn;
        if (canD && ch >= 0.5) { rec = "defend"; advice = "Je conseille de défendre : " + pct(ch) + " de réussite pour " + fmt(dc) + "."; btn = { label: "Défendre", run: "defend" }; }
        else if (canT) { rec = "truce"; advice = "Défendre ne réussit que dans " + pct(ch) + " des cas. Négocier coûte " + fmt(tc) + " mais la trêve est garantie."; btn = { label: "Négocier", run: "truce" }; }
        else if (canD) { rec = "defend"; advice = "Seulement " + pct(ch) + " de réussite, mais c’est ce que tu peux payer (" + fmt(dc) + ")."; btn = { label: "Défendre", run: "defend" }; }
        else { rec = "none"; advice = "Pas assez d’argent : défense " + fmt(dc) + ", négociation " + fmt(tc) + " (il te manque " + fmt(Math.max(0, Math.min(dc, tc) - s.money)) + ")."; btn = { label: "Voir", run: { go: "terr" } }; }
        add({ type: "attack", key: "atk:" + c.until, vars: { d: d.name, f: f.name, t: dur(left) }, advice: advice, rec: rec, buttons: [btn], expiresAt: left });
      }
    } catch (e) { }
    try {   /* attaque qui se prépare */
      if (tr && s.terr && !s.terr.conflict && tr.count(s) > 0) {
        var wait = s.terr.nextConflict - t;
        if (wait > 0 && wait <= SOON_ATTACK) {
          var need = 0; D().territory.districts.forEach(function (dd) { if (tr.lv(s, dd.id) > 0) need = Math.max(need, tr.defendCost(dd)); });
          var short = need - s.money;
          add({ type: "attack_soon", key: "atks:" + Math.round(s.terr.nextConflict), vars: { t: dur(wait) }, advice: short > 0 ? "Défendre un quartier peut coûter jusqu’à " + fmt(need) + " : il te manque " + fmt(short) + " pour être couvert." : "Défendre un quartier peut coûter jusqu’à " + fmt(need) + " : tu es couvert.", buttons: [{ label: "Voir", run: { go: "terr" } }] });
        }
      }
    } catch (e) { }
    try {   /* événement en cours */
      if (s.pending) { var ea = eventAdvice(s, fmt); if (ea) add({ type: "event_now", key: "ev:" + s.pending, vars: { e: ea.title }, advice: ea.text, buttons: [{ label: "Voir", run: { go: "dash" } }] }); }
    } catch (e) { }
    try {   /* événement imminent */
      if (!s.pending && E().income(s) > 0) {
        var wait2 = s.nextEvent - t;
        if (wait2 > 0 && wait2 <= SOON_EVENT) { var loss = worstEventLoss(s); add({ type: "event_soon", key: "evs:" + Math.round(s.nextEvent), vars: { t: dur(wait2) }, advice: "Au pire, un événement coûte environ " + fmt(loss) + (s.money >= loss ? " : tu as de quoi voir venir." : " : tu n’as pas encore cette réserve."), buttons: [{ label: "Voir", run: { go: "dash" } }] }); }
      }
    } catch (e) { }
    try {   /* objectif à réclamer */
      var ns = E().nextStep(s);
      if (ns && ns.kind === "claim") { var m = E().find(D().missions, ns.id); add({ type: "claim", key: "claim", vars: { m: ns.label }, advice: "Réclame-le maintenant : la prime" + (m && m.reward ? " (" + (m.reward.money ? "+" + fmt(m.reward.money) : "un bonus") + ")" : "") + " finance ta prochaine amélioration.", buttons: [{ label: "Réclamer", run: { claim: ns.id } }] }); }
    } catch (e) { }
    try {   /* boost qui se termine */
      if (s.boost && s.t < s.boost.until) { var rest = s.boost.until - t; if (rest > 0 && rest <= BOOST_END) add({ type: "boost_end", key: "bst:" + Math.round(s.boost.until), vars: { t: dur(rest) }, advice: "Quand il est fini, tu peux en activer un autre dans la Boutique (payé en lingots, tu en as " + (s.gold || 0) + ").", buttons: [{ label: "Boutique", run: { go: "shop" } }] }); }
    } catch (e) { }
    try {   /* coffre plein */
      if (BL.gold && s.gold >= BL.gold.capacity(s) && BL.gold.vaultCost(s) > 0) add({ type: "vault_full", key: "vault", vars: { n: s.gold }, advice: "Agrandir le coffre coûte " + BL.gold.vaultCost(s) + " lingots : " + (s.gold >= BL.gold.vaultCost(s) ? "tu peux le faire maintenant." : "il t’en faut " + (BL.gold.vaultCost(s) - s.gold) + " de plus."), buttons: [{ label: "Voir le coffre", run: { go: "hq" } }] });
    } catch (e) { }
    try {   /* bâtiment devenu constructible : déclenché une seule fois par emplacement (le 1er passage ne fait que mémoriser l'existant) */
      D().activities.forEach(function (a) {
        var nb = E().nextBuilding(s, a), k = "build:" + a.id + ":" + (nb ? nb.idx : -1);
        if (nb && nb.ok && s.money >= nb.cost) {
          if (seen[k] === undefined) { seen[k] = o && o.baseline ? 1 : 0; if (!(o && o.baseline)) add({ type: "buildable", key: k, vars: { a: a.name }, advice: "Un bâtiment de plus coûte " + fmt(nb.cost) + " et rapporte environ +" + fmt(E().bldIncome(s, a, nb.idx, 1)) + "/s.", buttons: [{ label: "Construire", run: { build: a.id } }] }); }
        } else if (seen[k] !== undefined && !(nb && nb.ok)) delete seen[k];
      });
    } catch (e) { }
    return out;
  }

  /* ---------- récapitulatif quand on la touche : ce qui se passe maintenant ---------- */
  function recap(s, o) {
    var fmt = (o && o.money) || String, t = num(s.t, 0), rows = [];
    try { if (s.pending) { var ev = E().find(D().events, s.pending); rows.push(["Événement", "en cours : « " + E().fText(ev.title, s.pendingFac, s.pendingCrew) + " »"]); } else rows.push(["Prochain événement", s.nextEvent > t ? "dans environ " + dur(s.nextEvent - t) : "imminent"]); } catch (e) { }
    try { var c = s.terr && s.terr.conflict; if (c) rows.push(["Attaque", T().faction(c.fid).name + " sur " + T().dist(c.did).name + " (" + dur(Math.max(0, c.until - t)) + " pour décider)"]); else if (T().count(s) > 0 && s.terr.nextConflict > t) rows.push(["Prochaine tension", "pas avant " + dur(s.terr.nextConflict - t) + " environ"]); } catch (e) { }
    try { var ns = E().nextStep(s); if (ns) rows.push(["Objectif en cours", ns.label + (ns.kind === "claim" ? " : à réclamer" : " (" + Math.round(ns.p * 100) + " %)")]); } catch (e) { }
    try { if (s.boost && s.t < s.boost.until) rows.push(["Boost", "encore " + dur(s.boost.until - t)]); } catch (e) { }
    try { var top = BL.advice && BL.advice.top(s, 1)[0]; if (top) rows.push(["Conseil du moment", adviceLine(top, fmt)]); } catch (e) { }
    return rows;
  }
  function adviceLine(x, fmt) {
    var n = x.name || ""; if (x.kind === "claim") return "Réclame « " + n + " ».";
    if (x.kind === "conflict") return "Réponds à l’attaque sur " + n + ".";
    if (x.kind === "event") return "Tranche l’événement en cours.";
    if (x.kind === "vault") return "Agrandis le coffre.";
    if (x.kind === "upgrade") return (x.first ? "Construis " : "Améliore ") + n + (x.cost !== undefined ? " (" + fmt(x.cost) + (x.can ? "" : ", dans " + dur(x.eta)) + ")" : "") + ".";
    if (x.kind === "build") return "Construis un bâtiment de « " + n + " » (" + fmt(x.cost) + ").";
    return n + (x.cost !== undefined ? " (" + fmt(x.cost) + ")" : "") + ".";
  }

  /* ---------- le moteur : file d'attente, cooldowns, anti-répétition ---------- */
  function create(opt) {
    opt = opt || {}; var clock = opt.now || Date.now, rng = opt.rng || Math.random, mode = "on", queue = [], cur = null, cool = {}, lastEnd = -1e12, lastIdx = {}, seenBuild = {}, baseline = true, shown = 0, log = [];
    function setMode(m) { mode = m === "quiet" || m === "off" ? m : "on"; if (mode === "off") { queue = []; cur = null; } }
    function allowed(a) { return mode === "on" || (mode === "quiet" && a.importance === "high"); }
    /* phrase : tirée au hasard, jamais la même deux fois de suite pour un type donné */
    function phrase(type, vars) {
      var l = PHRASES[type] || [""], i = Math.floor(rng() * l.length) % l.length;
      if (l.length > 1 && i === lastIdx[type]) i = (i + 1 + Math.floor(rng() * (l.length - 1))) % l.length;
      lastIdx[type] = i; return fill(l[i], vars);
    }
    function scan(s) {
      if (mode === "off") return 0; var t = clock(), added = 0;
      var found = detect(s, { money: opt.money, seenBuild: seenBuild, baseline: baseline }); baseline = false;
      found.forEach(function (a) {
        if (!allowed(a)) return; if (cool[a.type + "|" + a.key] > t) return;
        if (cur && cur.key === a.key) return; for (var i = 0; i < queue.length; i++) if (queue[i].key === a.key) { return; }
        if (cool[a.type] > t && a.type !== "attack" && a.type !== "event_now") return;         /* même type récemment montré (attaque et événement : chaque instance est nouvelle) */
        a.at = t; queue.push(a); added++;
      });
      queue.sort(function (p, q) { return (q.importance === "high") - (p.importance === "high") || p.at - q.at; });
      if (queue.length > MAXQ) queue.length = MAXQ; return added;
    }
    /* env : { blocked } → vrai si le menu, le didacticiel, une bannière, un placement… empêchent de parler. Renvoie l'alerte affichée ou null. */
    function next(s, env) {
      var t = clock(); if (mode === "off") { cur = null; return null; }
      if (cur) { if (!valid(cur, s)) close("action"); else if (t >= cur.until) close("timeout"); }
      if (cur) return cur;
      if (env && env.blocked) return null;
      queue = queue.filter(function (a) { return t - a.at < STALE && valid(a, s); });
      if (!queue.length) return null;
      var a = queue[0], gap = a.importance === "high" ? MIN_GAP_HIGH : MIN_GAP; if (t - lastEnd < gap) return null;
      queue.shift(); a.text = phrase(a.type, a.vars); a.shownAt = t; a.until = t + SHOW[a.importance]; cur = a; shown++; log.push({ type: a.type, key: a.key, at: t, text: a.text }); if (log.length > 80) log.shift();
      return cur;
    }
    /* l'alerte est-elle encore vraie ? (le joueur a peut-être déjà réagi) */
    function valid(a, s) { try { return detect(s, { money: opt.money, seenBuild: {}, baseline: false }).some(function (x) { return x.key === a.key; }); } catch (e) { return false; } }
    function close(reason) {
      if (!cur) return; var t = clock(), c = COOL[reason] || COOL.timeout; cool[cur.type + "|" + cur.key] = t + c; cool[cur.type] = t + (reason === "later" ? COOL.later : reason === "blocked" ? COOL.blocked : 60000); cur.closed = reason; lastEnd = t; cur = null;
    }
    function extend(ms) { if (cur) cur.until = Math.max(cur.until, clock() + ms); }
    return { setMode: setMode, mode: function () { return mode; }, scan: scan, next: next, close: close, extend: extend, phrase: phrase,
      current: function () { return cur; }, queue: function () { return queue.slice(); }, shownCount: function () { return shown; }, log: function () { return log.slice(); }, reset: function () { queue = []; cur = null; cool = {}; lastEnd = -1e12; seenBuild = {}; baseline = true; } };
  }

  BL.assistant = { PERSON: PERSON, PHRASES: PHRASES, TYPES: MARKS, IMPORTANT: IMPORTANT, COOL: COOL, MIN_GAP: MIN_GAP, MIN_GAP_HIGH: MIN_GAP_HIGH, SHOW: SHOW, MAXQ: MAXQ, detect: detect, recap: recap, create: create, eventAdvice: eventAdvice, dur: dur };
})(typeof globalThis !== "undefined" ? globalThis : this);
