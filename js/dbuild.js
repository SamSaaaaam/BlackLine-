/* Constructions par quartier : logique pure (aucun DOM). État : s.districts = { idQuartier: [idBâtiment, …] }.
   Règles codées ici (pas seulement dans l'interface) : quartier contrôlé, niveau de contrôle requis, emplacements limités,
   un même bâtiment une seule fois par quartier, prix indexé sur les revenus, paiement en argent du jeu uniquement. */
(function (root) {
  var BL = root.BL = root.BL || {}, EPS = 1e-9;
  function D() { return BL.data.dbuild; } function P() { return D().params; }
  function find(id) { var t = D().types; for (var i = 0; i < t.length; i++) if (t[i].id === id) return t[i]; return null; }
  function dist(id) { return BL.territory && BL.territory.dist(id); }
  /* s.districts[did] = ["typeId:numéroDeTerrain", …] (un identifiant sans numéro, hérité, prend le premier terrain libre à la lecture). */
  function parse(e) { var i = e.lastIndexOf(":"); return i > 0 && /^\d+$/.test(e.slice(i + 1)) ? { id: e.slice(0, i), idx: +e.slice(i + 1) } : { id: e, idx: -1 }; }
  function entries(s, did) { return ((s && s.districts && s.districts[did]) || []).map(parse).filter(function (e) { return e.idx >= 0; }); }
  function list(s, did) { return entries(s, did).sort(function (a, b) { return a.idx - b.idx; }).map(function (e) { return e.id; }); }
  function at(s, did, idx) { var e = entries(s, did); for (var i = 0; i < e.length; i++) if (e[i].idx === idx) return e[i].id; return null; }
  function freePlots(s, did) { var used = entries(s, did).map(function (e) { return e.idx; }), out = []; for (var i = 0; i < slots(did, s); i++) if (used.indexOf(i) < 0) out.push(i); return out; }
  function has(s, did, id) { return list(s, did).indexOf(id) >= 0; }
  function slots(did, s) { var st = D().style[did]; return st ? st.slots + (s ? razedIn(s, did).length : 0) : 0; }
  /* Partie 15 : démolition d'un parc ou d'une place. s.razed = ["quartier:numéroDeCellule", …] ; chaque démolition ajoute UN terrain constructible dans son quartier. */
  var RZ = { perDistrict: 2, total: 8, minCost: 60000, sec: 900, growth: 0.6 }, cellOk = null;
  function setCells(fn) { cellOk = typeof fn === "function" ? fn : null; }
  function razedIn(s, did) { var out = []; ((s && s.razed) || []).forEach(function (e) { var i = String(e).lastIndexOf(":"); if (i > 0 && e.slice(0, i) === did) out.push(+e.slice(i + 1)); }); return out; }
  function razeCost(s) { return Math.ceil(Math.max(RZ.minCost, BL.economy.incomeBase(s) * RZ.sec) * (1 + RZ.growth * ((s.razed || []).length)) - EPS); }
  function razeCheck(s, did, cell) {
    if (!dist(did)) return { ok: false, why: "Quartier inconnu." };
    if (BL.territory.lv(s, did) < 1) return { ok: false, why: "Tu ne contrôles pas ce quartier." };
    if (!(cell >= 0 && cell % 1 === 0) || (cellOk && !cellOk(did, cell))) return { ok: false, why: "Rien à démolir ici." };
    if (razedIn(s, did).indexOf(cell) >= 0) return { ok: false, why: "Déjà démoli." };
    if (razedIn(s, did).length >= RZ.perDistrict) return { ok: false, why: "Limite atteinte : " + RZ.perDistrict + " démolitions par quartier." };
    if ((s.razed || []).length >= RZ.total) return { ok: false, why: "Limite atteinte : " + RZ.total + " démolitions au total." };
    var c = razeCost(s); if (!(s.money + EPS >= c)) return { ok: false, why: "Pas assez d’argent.", short: true, missing: c - s.money, cost: c };
    return { ok: true, why: "", cost: c };
  }
  function raze(s, did, cell) { var k = razeCheck(s, did, cell); if (!k.ok) return false; BL.economy.spend(s, k.cost); (s.razed = s.razed || []).push(did + ":" + cell); return true; }
  function cleanRazed(s) {
    var seen = {}, per = {}, out = [];
    (Array.isArray(s.razed) ? s.razed : []).forEach(function (e) {
      if (typeof e !== "string" || !/^[a-z_]{1,24}:\d{1,5}$/.test(e) || seen[e] || out.length >= RZ.total) return;
      var i = e.lastIndexOf(":"), did = e.slice(0, i), c = +e.slice(i + 1); if (!dist(did) || (cellOk && !cellOk(did, c)) || (per[did] || 0) >= RZ.perDistrict) return;
      seen[e] = 1; per[did] = (per[did] || 0) + 1; out.push(e);
    });
    s.razed = out;
  }
  function count(s) { var n = 0; for (var k in (s.districts || {})) n += s.districts[k].length; return n; }
  function affine(did, id) { var st = D().style[did]; return !!(st && st.aff.indexOf(id) >= 0); }
  function eff(did, t) { return t.inc * (affine(did, t.id) ? P().affinityMul : 1); }
  function cost(s, did, id) {
    var t = find(id); if (!t) return Infinity;
    var base = Math.max(P().minCost, BL.economy.incomeBase(s) * t.costSec);
    return Math.ceil(base * (1 + P().perBuiltGrowth * list(s, did).length) - EPS);
  }
  /* { ok, why } : why est une phrase précise quand ok est faux. */
  function check(s, did, id, idx) {
    var t = find(id), d = dist(did); if (!t || !d) return { ok: false, why: "Bâtiment inconnu." };
    var L = BL.territory.lv(s, did);
    if (L < 1) return { ok: false, why: "Tu ne contrôles pas ce quartier." };
    if (has(s, did, id)) return { ok: false, why: "Déjà construit dans ce quartier (un seul par quartier)." };
    if (L < t.req) return { ok: false, why: "Contrôle du quartier niveau " + t.req + " requis (tu es niveau " + L + ")." };
    var fp = freePlots(s, did);
    if (!fp.length) return { ok: false, why: "Plus de terrain libre : " + slots(did, s) + " bâtiments maximum ici." };
    if (idx !== undefined && fp.indexOf(idx) < 0) return { ok: false, why: "Ce terrain n’est pas libre." };
    var c = cost(s, did, id); if (!(s.money + EPS >= c)) return { ok: false, why: "Pas assez d’argent.", short: true, missing: c - s.money };
    return { ok: true, why: "" };
  }
  function build(s, did, id, idx) {
    if (!check(s, did, id, idx).ok) return false;
    var c = cost(s, did, id), p = idx === undefined ? freePlots(s, did)[0] : idx; BL.economy.spend(s, c);
    (s.districts[did] = s.districts[did] || []).push(id + ":" + p); return true;
  }
  /* Somme des revenus supplémentaires (fraction), plafonnée pour garder l'économie lisible. */
  function incSum(s) {
    var v = 0; if (!s || !s.districts || !s.terr) return 0;
    for (var did in s.districts) if (BL.territory.lv(s, did) > 0) list(s, did).forEach(function (id) { var t = find(id); if (t && !(BL.heat && BL.heat.isClosed && BL.heat.isClosed(s, did, id))) v += eff(did, t); });
    return Math.min(v, P().incCap);
  }
  function defBonus(s, did) { var v = 0; list(s, did).forEach(function (id) { var t = find(id); if (t && t.def) v += t.def; }); return v; }
  /* points de chaleur par minute apportés par les bâtiments (lu par le système de chaleur) */
  function heatRate(s) { var v = 0; for (var did in (s.districts || {})) list(s, did).forEach(function (id) { var t = find(id); if (t && !(BL.heat && BL.heat.isClosed && BL.heat.isClosed(s, did, id))) v += t.heat; }); return v; }
  function casinos(s) { var n = 0; for (var did in (s.districts || {})) if (has(s, did, "casino")) n++; return n; }
  /* nettoyage à la lecture d'une sauvegarde : types inconnus, quartiers non contrôlés, dépassement d'emplacements */
  function clean(s) {
    cleanRazed(s); if (!s.districts) s.districts = {};
    Object.keys(s.districts).forEach(function (did) {
      var d = dist(did), out = [], seen = {}, used = {}, n = slots(did, s), raw = s.districts[did].map(parse);
      if (d && BL.territory.lv(s, did) > 0) {
        raw.filter(function (e) { return e.idx >= 0; }).concat(raw.filter(function (e) { return e.idx < 0; })).forEach(function (e) {
          if (!find(e.id) || seen[e.id]) return; var i = e.idx;
          if (i < 0 || i >= n || used[i]) { i = -1; for (var k = 0; k < n; k++) if (!used[k]) { i = k; break; } }
          if (i < 0) return; seen[e.id] = used[i] = 1; out.push(e.id + ":" + i);
        });
      }
      if (out.length) s.districts[did] = out; else delete s.districts[did];
    });
  }
  BL.dbuild = { find: find, list: list, at: at, entries: entries, freePlots: freePlots, has: has, slots: slots, razedIn: razedIn, razeCost: razeCost, razeCheck: razeCheck, raze: raze, setCells: setCells, RZ: RZ, count: count, cost: cost, check: check, build: build, incSum: incSum, defBonus: defBonus, heatRate: heatRate, casinos: casinos, affine: affine, eff: eff, clean: clean };
})(typeof globalThis !== "undefined" ? globalThis : this);
