/* Durée de vie (Partie 13 · C9) : prestige / partie+ avec 3 clans, mode difficile, défis du jour et de la semaine générés LOCALEMENT
   (graine = date, donc identiques pour tous les joueurs ce jour-là, sans serveur ni compte), collections.
   État : s.meta = { pr (prestiges), clan, hard, runs [], coll { items, dist, crew }, dc / wc (défis du jour / de la semaine), cl (défis réclamés) }.
   Le prestige remet la partie à zéro EN CONSERVANT : lingots et coffre, QG (styles, objets), boutique, décors, succès, collections, fins vues, rappels.
   Tous les effets sont bornés. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function D() { return BL.data.meta; } function P() { return D().params; } function E() { return BL.economy; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function isObj(o) { return o && typeof o === "object" && !Array.isArray(o); }
  function num(x, a, b, d) { return typeof x === "number" && isFinite(x) ? clamp(x, a, b) : d; }
  function initState(s) { s.meta = { pr: 0, clan: "", hard: false, runs: [], coll: { items: [], dist: [], crew: [] }, dc: null, wc: null, cl: 0 }; }
  function m(s) { if (!s.meta || !isObj(s.meta)) initState(s); return s.meta; }
  function clan(s) { return D().clans[m(s).clan] || null; }
  /* Effets (bornés) : clan + prestige + mode difficile */
  function prestigeInc(s) { var x = m(s); return Math.min(P().prestigeCap, x.pr * P().prestigeInc) * (x.hard ? P().hardPrestigeMul : 1); }
  function fx(s) {
    var c = clan(s), f = c ? c.fx : {}, h = m(s).hard;
    return { inc: (f.inc || 0) + prestigeInc(s), heat: (f.heat || 0) + (h ? P().hardHeat : 0), rival: (f.rival || 0) + (h ? P().hardRival : 0), cost: (f.cost || 0) + (h ? P().hardCost : 0) };
  }
  function incMul(s) { return 1 + fx(s).inc; } function heatMul(s) { return Math.max(0.5, 1 + fx(s).heat); } function rivalMul(s) { return Math.max(0.5, 1 + fx(s).rival); } function costMul(s) { return Math.max(0.8, 1 + fx(s).cost); }
  /* ---- Prestige ---- */
  function why(s) {
    var L = E().level(s), story = BL.saga && BL.saga.done(s);
    if (story || L >= P().prestigeLevel) return ""; return "Il faut terminer l’histoire ou atteindre le niveau d’empire " + P().prestigeLevel + " (tu es niveau " + L + ").";
  }
  function prestige(s, clanId, hard, now) {
    if (why(s) || !D().clans[clanId]) return null;
    var old = s, o = m(s), ends = BL.saga ? s.saga.ends.slice() : [], keep = { gold: s.gold, vault: s.vault, goldLife: s.goldLife, hq: s.hq, shop: s.shop, walls: s.walls, ach: s.ach, notifSeen: [] };
    var n = E().newState(now || s.saved || 0); Object.keys(keep).forEach(function (k) { if (keep[k] !== undefined) n[k] = keep[k]; });
    n.meta = o; n.meta.pr = Math.min(999, o.pr + 1); n.meta.clan = clanId; n.meta.hard = !!hard; n.meta.runs = [{ clan: o.clan, hard: o.hard, lvl: E().level(old), t: Math.floor(old.t) }].concat(o.runs).slice(0, P().keepRuns);
    if (BL.saga) n.saga.ends = ends;
    var c = D().clans[clanId]; if (c.crew && n.crew && n.crew.m && BL.crew && BL.crew.get(c.crew)) { n.crew.m[c.crew] = { lv: 1, xp: 0, on: true }; BL.crew.bump(n); }
    if (c.rel && n.fac && BL.factions) Object.keys(n.fac).forEach(function (f) { BL.factions.gain(n, f, c.rel); });
    ["dc", "wc"].forEach(function (k) { var ch = n.meta[k]; if (ch) { var cl = ch.list.map(function (x) { return !!x.cl; }); n.meta[k] = null; n.meta["_" + k] = cl; } });   /* défis déjà réclamés aujourd'hui : conservés, cibles recalculées */
    Object.keys(old).forEach(function (k) { delete old[k]; }); Object.keys(n).forEach(function (k) { old[k] = n[k]; });
    ensure(old, now); ["dc", "wc"].forEach(function (k) { var cl = old.meta["_" + k]; delete old.meta["_" + k]; if (cl && old.meta[k]) old.meta[k].list.forEach(function (x, i) { if (cl[i]) x.cl = true; }); });
    scan(old); return { pr: old.meta.pr, clan: clanId, hard: !!hard };
  }
  /* Le mode difficile se choisit à la création : seulement pendant les premières minutes d'une partie. */
  function setHard(s, on) { if (s.t > P().hardWindowSec) return false; m(s).hard = !!on; return true; }
  /* ---- Défis locaux ---- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function weekKey(d) { var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); var y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7); return y + "-W" + pad(w); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6d2b79f5) | 0; var x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  /* Liste de modèles du jour : ne dépend QUE de la clé de date (identique pour tous). */
  /* Partie 19 · E : seuls les modèles réalisables à ce stade sont tirés (s fourni) ; jamais deux fois le même modèle dans un tirage */
  function eligible(s, t, n) {
    if (!s) return true; var T = D().templates[t]; if (!T) return false;
    try {
      if (t === "ops") return !!(BL.crew && BL.crew.owned(s).length && BL.equip && BL.equip.opsList().some(function (o) { return BL.equip.opUnlock(s, o).ok; }));
      if (t === "def") return !!(BL.territory && BL.territory.count(s) >= 1);
      if (t === "casino") return !!(BL.casino && BL.casino.available(s));
      if (t === "heist") return !!(BL.heist && (s.heist && s.heist.run || E().level(s) >= BL.data.heist.params.lvl && BL.heist.avail(s).length >= 2));
      if (t === "cool") return !!(BL.heat && s.heat && s.heat.v > T.steps[n]);
      if (t === "crew") return !!(BL.crew && BL.data.crew.members.some(function (m) { var stt = BL.crew.state(s, m); return stt === "available" || (BL.crew.has(s, m.id) && BL.crew.lvl(s, m.id) < BL.data.crew.params.maxLevel); }));
      if (t === "works") return !!(BL.works && E().actUnlocked(s, BL.data.activities[0]));
      return true;
    } catch (e) { return false; }
  }
  function pickList(kind, key, s) {
    var ids = Object.keys(D().templates), r = rng(hash("blackline:" + kind + ":" + key)), arr = ids.slice(), out = [], want = kind === "dc" ? P().dailyCount : P().weeklyCount;
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    arr.forEach(function (id) { var n = Math.floor(r() * 3); if (out.length < want && eligible(s, id, n)) out.push({ t: id, n: n }); });
    return out;
  }
  function metric(s, t) {
    if (t === "heist") return s.heist && s.heist.done ? Object.keys(s.heist.done).reduce(function (a, k) { return a + (+s.heist.done[k] || 0); }, 0) : 0;
    if (t === "visit") return s.dfs ? s.dfs.vis || 0 : 0; if (t === "works") return s.works ? s.works.n || 0 : 0; if (t === "mini") return s.mini ? s.mini.n || 0 : 0;
    if (t === "crew") { var lv = 0; if (s.crew && s.crew.m) Object.keys(s.crew.m).forEach(function (k) { lv += +s.crew.m[k].lv || 0; }); return lv; }
    if (t === "cool") return s.heat ? s.heat.v : 0; if (t === "income") return E().incomeBase(s);
    if (t === "earn") return s.total; if (t === "ops") return s.eq ? s.eq.done : 0; if (t === "def") return s.terr ? s.terr.won : 0; if (t === "casino") return s.casino ? s.casino.played : 0;
    var c = 0; for (var k in (s.owned || {})) c += s.owned[k] || 0; return c;
  }
  function target(s, kind, x) { var st = D().templates[x.t].steps[x.n], mul = kind === "wc" ? P().weeklyMul : 1;
    if (x.t === "cool") return st; if (x.t === "income") return Math.ceil(Math.max(1, E().incomeBase(s)) * (kind === "wc" ? 1 + (st - 1) * 3 : st));
    if (x.t === "earn") return Math.ceil(st * mul * 60 * Math.max(50, E().incomeBase(s))); return Math.ceil(st * (kind === "wc" ? Math.ceil(mul / 2) : 1)); }
  function gen(s, kind, key) { var list = pickList(kind, key, s).map(function (x) { return { t: x.t, n: x.n, tg: 0, b: 0, cl: false, hit: false }; }); list.forEach(function (x) { x.b = metric(s, x.t); x.tg = target(s, kind, x); }); m(s)[kind] = { key: key, list: list }; }
  function ensure(s, now) {
    var d = now instanceof Date ? now : new Date(now === undefined || now === null ? Date.now() : now), x = m(s), ch = false; if (isNaN(d.getTime())) return false;
    if (!x.dc || x.dc.key !== dayKey(d)) { gen(s, "dc", dayKey(d)); ch = true; } if (!x.wc || x.wc.key !== weekKey(d)) { gen(s, "wc", weekKey(d)); ch = true; } return ch;
  }
  function progress(s, kind, i) {
    var ch = m(s)[kind], x = ch && ch.list[i]; if (!x) return null; var cur = Math.max(0, metric(s, x.t) - x.b), tg = x.tg;
    if (x.t === "cool") { var hv = metric(s, "cool"); cur = x.hit ? tg : hv <= tg ? tg : 0; return { cur: x.hit || hv <= tg ? tg : Math.round(hv), tg: tg, p: x.hit || hv <= tg ? 1 : Math.max(0, Math.min(0.99, tg / Math.max(1, hv))), done: !!x.hit || hv <= tg, claimed: !!x.cl, t: x.t, reward: kind === "wc" ? P().weeklyGold : P().dailyGold, latch: true }; }
    if (x.t === "income") { var iv = metric(s, "income"); cur = x.hit ? tg : iv; }
    return { cur: cur, tg: tg, p: Math.min(1, cur / tg), done: cur + 1e-9 >= tg, claimed: !!x.cl, t: x.t, reward: kind === "wc" ? P().weeklyGold : P().dailyGold };
  }
  function whyClaim(s, kind, i) { var p = progress(s, kind, i); if (!p) return "Défi inconnu."; if (p.claimed) return "Déjà réclamé."; if (!p.done) return "Pas encore terminé."; if (!BL.gold || BL.gold.space(s) < p.reward) return "Coffre plein : agrandis-le pour recevoir les lingots."; return ""; }
  function claim(s, kind, i, now) { if (whyClaim(s, kind, i)) return null; var p = progress(s, kind, i); s.gold += p.reward; if (s.goldLife) s.goldLife.bought = s.goldLife.bought || 0; m(s)[kind].list[i].cl = true; m(s).cl = Math.min(1e6, m(s).cl + 1);
    var ti = BL.dfs ? BL.dfs.onClaim(s, now === undefined ? Date.now() : now, kind === "wc") : []; return { gold: p.reward, titles: ti, streak: BL.dfs ? BL.dfs.state(s).st : 0 }; }   /* Partie 19 · E : série et titres (aucun lingot en plus) */
  /* défis « à atteindre » (chaleur, revenu) : restent acquis une fois le seuil touché, même si la valeur bouge ensuite */
  function latch(s) { ["dc", "wc"].forEach(function (k) { var ch = m(s)[k]; if (ch) ch.list.forEach(function (x, i) { if (x.cl || x.hit || !D().templates[x.t] || !D().templates[x.t].latch) return; var v = metric(s, x.t); if (x.t === "cool" ? v <= x.tg : v + 1e-9 >= x.tg) x.hit = true; }); }); }
  /* ---- Collections ---- */
  function scan(s) {
    latch(s); var c = m(s).coll, add = function (a, v) { if (v && a.indexOf(v) < 0) a.push(v); };
    if (s.eq && s.eq.inv) s.eq.inv.forEach(function (x) { add(c.items, x.id); }); if (s.heat && s.heat.sz) s.heat.sz.forEach(function (x) { add(c.items, x.id); });
    if (BL.territory) BL.data.territory.districts.forEach(function (d) { if (BL.territory.lv(s, d.id) >= 1) add(c.dist, d.id); });
    if (BL.crew) BL.crew.owned(s).forEach(function (x) { add(c.crew, x.id); });
  }
  function collections(s) {
    var c = m(s).coll;
    return [{ id: "crew", name: "Portraits", have: c.crew.length, total: BL.data.crew.members.length }, { id: "items", name: "Objets", have: c.items.length, total: BL.data.equip.ITEMS.length }, { id: "dist", name: "Lieux", have: c.dist.length, total: BL.data.territory.districts.length }, { id: "ends", name: "Fins", have: BL.saga ? s.saga.ends.length : 0, total: BL.data.saga.endings.length }];
  }
  function sanitize(r, s) {
    initState(s); if (!isObj(r) || !isObj(r.meta)) return; var q = r.meta, x = s.meta, T0 = num(r.t, 0, 1e15, 0);
    x.pr = Math.floor(num(q.pr, 0, 999, 0)); x.clan = typeof q.clan === "string" && D().clans[q.clan] ? q.clan : ""; x.hard = q.hard === true; x.cl = Math.floor(num(q.cl, 0, 1e6, 0));
    if (Array.isArray(q.runs)) q.runs.slice(0, P().keepRuns).forEach(function (u) { if (isObj(u)) x.runs.push({ clan: typeof u.clan === "string" && D().clans[u.clan] ? u.clan : "", hard: u.hard === true, lvl: Math.floor(num(u.lvl, 0, 1000, 0)), t: Math.floor(num(u.t, 0, 1e12, 0)) }); });
    if (isObj(q.coll)) {
      var okI = function (id) { return typeof id === "string" && BL.data.equip.ITEMS.some(function (i) { return i.id === id; }); }, okD = function (id) { return BL.data.territory.districts.some(function (d) { return d.id === id; }); }, okC = function (id) { return BL.data.crew.members.some(function (c) { return c.id === id; }); };
      [["items", okI], ["dist", okD], ["crew", okC]].forEach(function (p) { if (Array.isArray(q.coll[p[0]])) q.coll[p[0]].slice(0, 100).forEach(function (id) { if (p[1](id) && x.coll[p[0]].indexOf(id) < 0) x.coll[p[0]].push(id); }); });
    }
    ["dc", "wc"].forEach(function (k) {
      var c = q[k]; if (!isObj(c) || typeof c.key !== "string" || !/^\d{4}-(\d{2}-\d{2}|W\d{2})$/.test(c.key) || !Array.isArray(c.list)) return; var list = [];
      c.list.slice(0, k === "dc" ? P().dailyCount : P().weeklyCount).forEach(function (e) { if (isObj(e) && D().templates[e.t] && !list.some(function (z) { return z.t === e.t; })) list.push({ t: e.t, n: Math.floor(num(e.n, 0, 2, 0)), tg: num(e.tg, 1, 1e300, 1), b: num(e.b, 0, 1e300, 0), cl: e.cl === true, hit: e.hit === true }); });
      if (list.length) x[k] = { key: c.key, list: list };
    });
  }
  function achProgress(s, c) {
    var cur = 0; if (c.t === "chap") cur = BL.saga ? BL.saga.chapters().filter(function (ch) { return BL.saga.complete(s, ch.id); }).length : 0; else if (c.t === "ends") cur = BL.saga ? s.saga.ends.length : 0; else if (c.t === "boss") cur = BL.war ? BL.war.trophies(s) : 0;
    else if (c.t === "bond") cur = BL.crew ? BL.crew.owned(s).filter(function (x) { var r = BL.crew.rec(s, x.id); return r && r.bond; }).length : 0; else if (c.t === "pres") cur = m(s).pr; else if (c.t === "chal") cur = m(s).cl; else if (c.t === "hard") cur = m(s).hard ? E().level(s) : 0; else return null;
    return cur;
  }
  BL.meta = { eligible: eligible, latch: latch, initState: initState, state: m, clan: clan, fx: fx, incMul: incMul, heatMul: heatMul, rivalMul: rivalMul, costMul: costMul, prestigeInc: prestigeInc, why: why, prestige: prestige, setHard: setHard, dayKey: dayKey, weekKey: weekKey, pickList: pickList, ensure: ensure, progress: progress, whyClaim: whyClaim, claim: claim, scan: scan, collections: collections, sanitize: sanitize, achProgress: achProgress, gen: gen, metric: metric };
})(typeof globalThis !== "undefined" ? globalThis : this);
