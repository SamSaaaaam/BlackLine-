/* Casino (Partie 10 · C7) : logique pure et honnête. ARGENT DU JEU UNIQUEMENT (jamais de lingots), aucune valeur réelle.
   Principe anti-triche : la mise est débitée, le résultat tiré et le gain crédité EN UNE SEULE ÉTAPE avant toute animation ; l'appelant sauvegarde aussitôt.
   Le blackjack (interactif) tire toutes ses cartes au moment de la mise et les enregistre : recharger la page ne permet jamais de relancer la main.
   Les cotes affichées dans l'interface sont calculées ici par énumération exacte (machine à sous, roulette), pas écrites à la main. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  var P = {
    minSec: 1, minFloor: 10,            /* mise minimale : 1 s de revenus nets, au moins 10 $ */
    maxShare: 0.25, maxSec: 600,        /* mise maximale : 25 % du solde ET 600 s de revenus nets (le plus petit des deux) */
    histMax: 20, bjCards: 40
  };
  /* ---- aléa : cryptographique si disponible ---- */
  function rng() {
    var c = root.crypto || (typeof require === "function" ? null : null);
    if (c && c.getRandomValues) { var a = new Uint32Array(1); c.getRandomValues(a); return a[0] / 4294967296; }
    return Math.random();
  }
  function E() { return BL.economy; }
  function init(s) { if (!s.casino) s.casino = { hist: [], played: 0, won: 0, lost: 0, net: 0 }; return s.casino; }
  function available(s) { return !!(BL.dbuild && BL.dbuild.casinos(s) > 0); }
  function limits(s) {
    var inc = Math.max(0, E().incomeBase(s)), min = Math.max(P.minFloor, Math.ceil(inc * P.minSec)), max = Math.floor(Math.min(s.money * P.maxShare, Math.max(min, inc * P.maxSec)));
    if (max < min) max = min; return { min: min, max: max, canPlay: s.money + EPS >= min };
  }
  /* mise hostile : NaN, négative, texte, infinie, fractionnaire, hors limites → refus clair */
  function checkBet(s, bet) {
    if (!available(s)) return { ok: false, why: "Construis un casino dans un quartier que tu contrôles." };
    if (typeof bet !== "number" || !isFinite(bet)) return { ok: false, why: "Mise invalide." };
    if (bet !== Math.floor(bet)) return { ok: false, why: "La mise doit être un nombre entier de dollars." };
    var L = limits(s); if (bet < L.min) return { ok: false, why: "Mise minimale : " + L.min + " $." };
    if (bet > L.max) return { ok: false, why: "Mise maximale : " + L.max + " $ (25 % de ton solde, 10 minutes de revenus)." };
    if (bet > s.money + EPS) return { ok: false, why: "Solde insuffisant." };
    return { ok: true };
  }
  function record(s, game, bet, payout, now) {
    var c = init(s), net = payout - bet; c.played += 1; if (net > 0) c.won += 1; else if (net < 0) c.lost += 1; c.net += net;
    if (BL.casinoEv) BL.casinoEv.onPlay(s, game, bet, net);   /* Partie 13 : points de tournoi (les cotes ne changent pas) */
    c.hist.unshift({ g: game, bet: bet, net: net, at: typeof now === "number" ? now : Date.now() }); if (c.hist.length > P.histMax) c.hist.length = P.histMax;
  }
  function debit(s, bet) { s.money = Math.max(0, s.money - bet); }
  function credit(s, amt) { if (amt > 0) { s.money += amt; if (s.total < s.money) s.total = s.money; } }
  function settle(s, game, bet, payout, now) { credit(s, payout); record(s, game, bet, payout, now); }

  /* ---- machine à sous : 3 rouleaux, 20 arrêts chacun ---- */
  var SL = {
    names: { S: "7", B: "BAR", L: "Cloche", P: "Prune", M: "Citron", C: "Cerise" },
    weights: { S: 1, B: 2, L: 3, P: 4, M: 4, C: 6 }, stops: 20,
    pay: { S: 100, B: 50, L: 20, P: 14, M: 8, C: 10 }, twoCherries: 2
  };
  SL.order = ["S", "B", "L", "P", "M", "C"];
  SL.reel = (function () { var r = []; SL.order.forEach(function (k) { for (var i = 0; i < SL.weights[k]; i++) r.push(k); }); return r; })();      /* bande de 20 arrêts, ordre fixe */
  function slotMult(a, b, c) { if (a === b && b === c) return SL.pay[a]; var n = (a === "C") + (b === "C") + (c === "C"); return n === 2 ? SL.twoCherries : 0; }
  var slotStats = null;
  function slotInfo() {
    if (slotStats) return slotStats; var T = SL.reel.length, ev = 0, hit = 0, i, j, k, p = 1 / (T * T * T), max = 0;
    for (i = 0; i < T; i++) for (j = 0; j < T; j++) for (k = 0; k < T; k++) { var m = slotMult(SL.reel[i], SL.reel[j], SL.reel[k]); ev += m * p; if (m > 0) hit += p; if (m > max) max = m; }
    return (slotStats = { rtp: ev, hit: hit, edge: 1 - ev, max: max, pay: SL.pay, twoCherries: SL.twoCherries, reel: SL.reel.slice(), names: SL.names, order: SL.order });
  }
  function spinSlots(s, bet, rnd, now) {
    var c = checkBet(s, bet); if (!c.ok) return c; rnd = rnd || rng(); var r = typeof rnd === "function" ? rnd : rng;
    var T = SL.reel.length, st = [Math.floor(r() * T), Math.floor(r() * T), Math.floor(r() * T)], sy = st.map(function (i) { return SL.reel[i]; }), mult = slotMult(sy[0], sy[1], sy[2]), win = bet * mult;
    debit(s, bet); settle(s, "slots", bet, win, now);
    return { ok: true, game: "slots", stops: st, symbols: sy, mult: mult, bet: bet, win: win, net: win - bet };
  }

  /* ---- roulette européenne (0 à 36, un seul zéro) ---- */
  var RED = { 1: 1, 3: 1, 5: 1, 7: 1, 9: 1, 12: 1, 14: 1, 16: 1, 18: 1, 19: 1, 21: 1, 23: 1, 25: 1, 27: 1, 30: 1, 32: 1, 34: 1, 36: 1 };
  var WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];      /* ordre réel de la roue */
  var RK = { straight: { name: "Plein (un numéro)", pay: 35 }, red: { name: "Rouge", pay: 1 }, black: { name: "Noir", pay: 1 }, even: { name: "Pair", pay: 1 }, odd: { name: "Impair", pay: 1 }, low: { name: "Manque (1–18)", pay: 1 }, high: { name: "Passe (19–36)", pay: 1 }, dozen: { name: "Douzaine", pay: 2 }, column: { name: "Colonne", pay: 2 } };
  function color(n) { return n === 0 ? "green" : RED[n] ? "red" : "black"; }
  function rWins(kind, arg, n) {
    if (kind === "straight") return n === arg; if (n === 0) return false;
    if (kind === "red") return !!RED[n]; if (kind === "black") return !RED[n]; if (kind === "even") return n % 2 === 0; if (kind === "odd") return n % 2 === 1;
    if (kind === "low") return n <= 18; if (kind === "high") return n >= 19; if (kind === "dozen") return Math.ceil(n / 12) === arg; if (kind === "column") return ((n - 1) % 3) + 1 === arg; return false;
  }
  function rValid(kind, arg) { if (!RK[kind]) return false; if (kind === "straight") return typeof arg === "number" && arg === Math.floor(arg) && arg >= 0 && arg <= 36; if (kind === "dozen" || kind === "column") return arg === 1 || arg === 2 || arg === 3; return true; }
  function rouletteInfo() {
    var out = {}; Object.keys(RK).forEach(function (k) { var args = k === "straight" ? [0] : (k === "dozen" || k === "column") ? [1] : [null], w = 0, i; for (i = 0; i <= 36; i++) if (rWins(k, args[0], i)) w++; out[k] = { name: RK[k].name, pay: RK[k].pay, chance: w / 37, rtp: (w * (RK[k].pay + 1)) / 37 }; });
    return { kinds: out, rtp: 36 / 37, edge: 1 / 37, wheel: WHEEL.slice() };
  }
  function spinRoulette(s, bet, kind, arg, rnd, now) {
    var c = checkBet(s, bet); if (!c.ok) return c; if (!rValid(kind, arg)) return { ok: false, why: "Pari invalide." };
    var r = typeof rnd === "function" ? rnd : rng, n = Math.floor(r() * 37), win = rWins(kind, arg, n) ? bet * (RK[kind].pay + 1) : 0;
    debit(s, bet); settle(s, "roulette", bet, win, now);
    return { ok: true, game: "roulette", n: n, color: color(n), kind: kind, arg: arg, bet: bet, win: win, net: win - bet, pocket: WHEEL.indexOf(n) };
  }

  /* ---- blackjack : paquet illimité, le croupier reste sur 17, blackjack 3 pour 2, doublage sur 2 cartes, pas de séparation ---- */
  function cardVal(c) { var r = c % 13; return r === 0 ? 11 : r >= 9 ? 10 : r + 1; }
  function total(h) { var t = 0, a = 0; h.forEach(function (c) { t += cardVal(c); if (c % 13 === 0) a++; }); while (t > 21 && a > 0) { t -= 10; a--; } return t; }
  function soft(h) { var t = 0, a = 0; h.forEach(function (c) { t += cardVal(c); if (c % 13 === 0) a++; }); while (t > 21 && a > 0) { t -= 10; a--; } return a > 0 && t <= 21; }
  function isBJ(h) { return h.length === 2 && total(h) === 21; }
  function bjInfo() { return { rules: "Paquet illimité · le croupier reste sur 17 · blackjack payé 3 pour 2 · doublage sur les deux premières cartes · pas de séparation, pas d’assurance", edge: 0.011 }; }
  function bjStart(s, bet, rnd, now) {
    var c = checkBet(s, bet); if (!c.ok) return c; var cc = init(s); if (cc.round) return { ok: false, why: "Une main est déjà en cours." };
    var r = typeof rnd === "function" ? rnd : rng, deck = [], i; for (i = 0; i < P.bjCards; i++) deck.push(Math.floor(r() * 52));
    debit(s, bet); cc.round = { g: "bj", bet: bet, deck: deck, pos: 4, p: [deck[0], deck[2]], d: [deck[1], deck[3]], dbl: false, st: "play" };
    return bjSettleIfDone(s, now);
  }
  function view(s) { var R = s.casino && s.casino.round; return R ? { bet: R.bet, p: R.p.slice(), d: R.st === "play" ? [R.d[0]] : R.d.slice(), hidden: R.st === "play", pt: total(R.p), dt: R.st === "play" ? cardVal(R.d[0]) : total(R.d), st: R.st, dbl: R.dbl, canDouble: R.st === "play" && R.p.length === 2 && !R.dbl && s.money + EPS >= R.bet } : null; }
  function bjSettleIfDone(s, now) {
    var R = s.casino.round, pt = total(R.p), out;
    if (R.st === "play" && (isBJ(R.p) || isBJ(R.d))) R.st = "done";          /* blackjack immédiat : le croupier regarde sa carte cachée */
    else if (R.st === "play" && pt >= 21) R.st = "dealer";
    if (R.st === "dealer") { while (total(R.d) < 17) R.d.push(R.deck[R.pos++]); R.st = "done"; }
    if (R.st !== "done") return { ok: true, game: "blackjack", done: false, view: view(s) };
    var dt = total(R.d), bet = R.bet * (R.dbl ? 2 : 1), pay = 0, res;
    if (isBJ(R.p) && !isBJ(R.d)) { pay = R.bet * 2.5; res = "blackjack"; } else if (isBJ(R.d) && !isBJ(R.p)) { pay = 0; res = "dealerbj"; } else if (isBJ(R.p) && isBJ(R.d)) { pay = R.bet; res = "push"; }
    else if (pt > 21) { pay = 0; res = "bust"; } else if (dt > 21 || pt > dt) { pay = bet * 2; res = "win"; } else if (pt === dt) { pay = bet; res = "push"; } else { pay = 0; res = "lose"; }
    pay = Math.floor(pay + EPS); var v = view(s); s.casino.round = null; settle(s, "blackjack", bet, pay, now);
    return { ok: true, game: "blackjack", done: true, result: res, bet: bet, win: pay, net: pay - bet, view: { bet: bet, p: R.p.slice(), d: R.d.slice(), hidden: false, pt: total(R.p), dt: dt, st: "done", dbl: R.dbl } };
  }
  function bjAct(s, act, now) {
    var cc = s.casino, R = cc && cc.round; if (!R || R.st !== "play") return { ok: false, why: "Aucune main en cours." };
    if (act === "hit") { R.p.push(R.deck[R.pos++]); var tp = total(R.p); if (tp > 21) R.st = "done"; else if (tp === 21) R.st = "dealer"; }
    else if (act === "stand") R.st = "dealer";
    else if (act === "double") { if (R.p.length !== 2 || R.dbl || s.money + EPS < R.bet) return { ok: false, why: "Doublage impossible." }; debit(s, R.bet); R.dbl = true; R.p.push(R.deck[R.pos++]); R.st = total(R.p) > 21 ? "done" : "dealer"; }
    else return { ok: false, why: "Action inconnue." };
    return bjSettleIfDone(s, now);
  }

  /* ---- sauvegarde : nettoyage strict d'une main en cours ---- */
  function sanitizeRound(x) {
    if (!x || typeof x !== "object" || x.g !== "bj" || typeof x.bet !== "number" || !isFinite(x.bet) || x.bet < 1 || x.bet !== Math.floor(x.bet) || !Array.isArray(x.deck) || x.deck.length !== P.bjCards) return null;
    var ok = function (c) { return typeof c === "number" && c === Math.floor(c) && c >= 0 && c < 52; };
    if (!x.deck.every(ok) || !Array.isArray(x.p) || !Array.isArray(x.d) || !x.p.every(ok) || !x.d.every(ok) || x.st !== "play" || x.p.length < 2 || x.d.length < 2 || typeof x.pos !== "number" || x.pos < 4 || x.pos > P.bjCards - 1) return null;
    return { g: "bj", bet: x.bet, deck: x.deck.slice(), pos: Math.floor(x.pos), p: x.p.slice(), d: x.d.slice(), dbl: x.dbl === true, st: "play" };
  }
  BL.casino = { P: P, rng: rng, available: available, limits: limits, checkBet: checkBet, slotInfo: slotInfo, spinSlots: spinSlots, rouletteInfo: rouletteInfo, spinRoulette: spinRoulette, bjInfo: bjInfo, bjStart: bjStart, bjAct: bjAct, view: view, total: total, soft: soft, isBJ: isBJ, cardVal: cardVal, color: color, sanitizeRound: sanitizeRound, init: init };
})(typeof globalThis !== "undefined" ? globalThis : this);
