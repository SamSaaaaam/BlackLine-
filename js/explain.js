/* C15 : « d'où vient ce nombre ? » — logique pure (aucun DOM).
   Chaque décomposition est construite par étapes successives (chaque étape = écart entre la valeur avant et après le facteur) :
   la somme des lignes retombe donc EXACTEMENT sur le nombre affiché (testé). Les lignes à zéro sont conservées quand elles répondent à une question
   légitime du joueur (ex. « la chaleur change-t-elle mes revenus ? »).
   Chaque résultat : { total, lines:[{ id, label, v, note }], unit } ; v est signé (dépenses négatives). */
(function (root) {
  var BL = root.BL = root.BL || {};
  function E() { return BL.economy; } function D() { return BL.data; }
  function pct(x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }
  function fprod(s, key) { var m = 1; D().upgrades.forEach(function (u) { if (s.upg[u.id] && u.fx[key]) m *= u.fx[key]; }); return m; }
  function fsum(s, key) { var n = 0; D().upgrades.forEach(function (u) { if (s.upg[u.id] && u.fx[key]) n += u.fx[key]; }); return n; }
  function line(id, label, v, note) { return { id: id, label: label, v: v, note: note || "" }; }
  function sumOf(lines) { var t = 0; lines.forEach(function (l) { t += l.v; }); return t; }
  /* un bâtiment : étapes de la production */
  function stages(s, a, i, n) {
    var e = E(), tr = BL.territory, cw = BL.crew, fc = BL.factions, w = e.BLD_W[i] || 0, v0 = n * a.baseIncome * w, v = [v0], f = [e.msMult(n), e.upgMult(s, a.id), e.repMult(s), e.levelMult(s), tr ? tr.incMult(s, a.id) : 1, cw ? cw.incMult(s, a.id) : 1, fc ? fc.incMult(s) : 1];
    f.forEach(function (x, k) { v.push(v[k] * x); });
    return { v: v, f: f };
  }
  var NAMES = [["base", "Bâtiments (niveau × revenu de base)"], ["ms", "Paliers de niveau"], ["upg", "Améliorations achetées"], ["rep", "Réputation"], ["lvl", "Niveau d’empire"], ["terr", "Quartiers contrôlés"], ["crew", "Équipe active"], ["fac", "Factions et alliances"]];
  function factorNote(s, k, f) {
    if (k === 1) return f > 1 ? "Chaque palier (niveaux " + D().balance.milestones.map(function (m) { return m.lvl; }).join(", ") + ") multiplie les revenus du bâtiment." : "Aucun palier atteint.";
    if (k === 3) return "Réputation " + E().reputation(s) + " : revenus +" + pct(f - 1) + " (plafond " + pct(D().balance.repIncomeCap) + ").";
    if (k === 4) return "Niveau d’empire " + E().level(s) + " : revenus +" + pct(f - 1) + ".";
    return f === 1 ? "Aucun effet pour l’instant." : "Revenus ×" + String(Math.round(f * 1000) / 1000).replace(".", ",") + ".";
  }
  /* revenu d'UN bâtiment (act, idx) : somme = bldIncome */
  function building(s, actId, idx) {
    var a = E().find(D().activities, actId), n = E().bLevel(s, actId, idx), st = stages(s, a, idx, n), acc = [];
    NAMES.forEach(function (nm, k) { acc.push(line(nm[0], nm[1], k === 0 ? st.v[0] : st.v[k] - st.v[k - 1], k === 0 ? "Niveau " + n + " × " + a.baseIncome + " $/s de base × part " + Math.round((E().BLD_W[idx] || 0) * 100) + " % du bâtiment " + (idx + 1) + "." : factorNote(s, k, st.f[k - 1]))); });
    return { unit: "$/s", total: E().bldIncome(s, a, idx, n), lines: acc };
  }
  /* revenu d'une activité entière */
  function activity(s, actId) {
    var a = E().find(D().activities, actId), lines = NAMES.map(function (nm) { return line(nm[0], nm[1], 0, ""); }), fs = null;
    E().levels(s, actId).forEach(function (n, i) { var st = stages(s, a, i, n); fs = st.f; lines[0].v += st.v[0]; for (var k = 1; k < NAMES.length; k++) lines[k].v += st.v[k] - st.v[k - 1]; });
    if (fs) lines.forEach(function (l, k) { l.note = k === 0 ? "Somme des bâtiments de l’activité." : factorNote(s, k, fs[k - 1]); });
    return { unit: "$/s", total: E().actIncome(s, a), lines: lines };
  }
  /* revenus nets de tout l'empire */
  function income(s) {
    var e = E(), lines = NAMES.map(function (nm) { return line(nm[0], nm[1], 0, ""); }), fsAny = null;
    D().activities.forEach(function (a) { var fs = null; e.levels(s, a.id).forEach(function (n, i) { var st = stages(s, a, i, n); fs = st.f; lines[0].v += st.v[0]; for (var k = 1; k < NAMES.length; k++) lines[k].v += st.v[k] - st.v[k - 1]; }); if (fs && !fsAny) fsAny = fs; });
    var gross = sumOf(lines), bm = e.boostMult(s), upA = 0, upC = BL.crew ? BL.crew.upkeepTotal(s) : 0;
    D().activities.forEach(function (a) { upA += e.upkeepOf(s, a); });
    lines.forEach(function (l, k) { l.note = k === 0 ? "Somme de tous tes bâtiments." : k === 3 ? "Réputation " + e.reputation(s) + " : revenus +" + pct(e.repMult(s) - 1) + "." : k === 4 ? "Niveau d’empire " + e.level(s) + " : revenus +" + pct(e.levelMult(s) - 1) + "." : k === 1 ? "Paliers de niveau atteints par tes bâtiments." : ""; });
    lines.push(line("boost", "Boost temporaire", gross * (bm - 1), bm > 1 ? "Revenus ×" + String(bm).replace(".", ",") + " tant que le boost dure." : "Aucun boost actif."));
    lines.push(line("heat", "Chaleur", 0, "La chaleur ne change pas tes revenus : elle agit sur les opérations et sur la pression des rivaux."));
    lines.push(line("upkeep", "Entretien des activités", -upA, "Une part du revenu de chaque activité."));
    lines.push(line("pay", "Salaires de l’équipe active", -upC, "Entretien des équipiers actifs."));
    var raw = sumOf(lines), tot = e.income(s); if (Math.abs(tot - raw) > 1e-12) lines.push(line("floor", "Plancher à zéro", tot - raw, "Les revenus nets ne descendent jamais sous zéro."));
    return { unit: "$/s", total: tot, lines: lines };
  }
  /* entretien d'une activité */
  function upkeep(s, actId) {
    var a = E().find(D().activities, actId), tr = BL.territory, cw = BL.crew, b = E().best(s, actId), v0 = b * a.baseIncome * a.upkeep, fu = fprod(s, "upkeep"), ft = tr ? tr.upkeepMult(s) : 1, fc = cw ? cw.upkeepMult(s) : 1;
    var v1 = v0 * fu, v2 = v1 * ft, v3 = v2 * fc;
    return { unit: "$/s", total: E().upkeepOf(s, a), lines: [line("base", "Entretien de base", v0, "Meilleur niveau " + b + " × " + a.baseIncome + " $/s × " + pct(a.upkeep) + "."), line("upg", "Améliorations achetées", v1 - v0, fu === 1 ? "Aucune réduction." : "Entretien ×" + String(Math.round(fu * 1000) / 1000).replace(".", ",") + "."), line("terr", "Quartiers contrôlés", v2 - v1, ft === 1 ? "Aucune réduction." : "Entretien ×" + String(Math.round(ft * 1000) / 1000).replace(".", ",") + "."), line("crew", "Équipe active (Gestion)", v3 - v2, fc === 1 ? "Aucune réduction." : "Entretien ×" + String(Math.round(fc * 1000) / 1000).replace(".", ",") + ".")] };
  }
  /* prix de l'amélioration du bâtiment idx (niveau n → n+1) ou de la construction (n = 0) */
  function cost(s, actId, idx) {
    var e = E(), a = e.find(D().activities, actId), cnt = e.buildings(s, actId), n = e.bLevel(s, actId, idx), tr = BL.territory, cw = BL.crew, lc = e.BLD_LC[idx] || 1, entry = idx === cnt && cnt >= 1 && cnt < e.BLD_NEED.length;
    var base, v1, tot, l1, l2;
    if (entry) { var ref = Math.max(e.BLD_NEED[cnt], e.best(s, actId)); base = a.baseCost * Math.pow(a.growth, e.BLD_EXP * ref) * ref * e.BLD_ENTRY * cnt; v1 = base; tot = e.nextBuilding(s, a).cost; l1 = line("base", "Prix d’entrée du bâtiment " + (idx + 1), base, "Calculé sur ton meilleur bâtiment (niveau " + e.best(s, actId) + ")."); l2 = null; }
    else { base = e.baseCostAt(a, n); v1 = base * lc; tot = e.cost(a, n, s, idx); l1 = line("base", "Prix de base du niveau " + (n + 1), base, "Il grandit avec le niveau du bâtiment."); l2 = line("annex", "Bâtiment annexe", v1 - base, lc === 1 ? "Bâtiment principal : plein tarif." : "Un bâtiment annexe coûte " + pct(lc) + " du prix principal."); }
    var fu = fprod(s, "cost"), ft = tr ? tr.costMult(s) : 1, fc = cw ? cw.costMult(s) : 1, v2 = v1 * fu, v3 = v2 * ft, v4 = v3 * fc, fm = BL.meta ? BL.meta.costMul(s) : 1, v5 = v4 * fm, rd = function (f) { return f === 1 ? "Aucune réduction." : "Prix ×" + String(Math.round(f * 1000) / 1000).replace(".", ",") + "."; };
    var lines = [l1]; if (l2) lines.push(l2);
    lines.push(line("upg", "Améliorations achetées", v2 - v1, rd(fu)), line("terr", "Quartiers contrôlés", v3 - v2, rd(ft)), line("crew", "Équipe active (Gestion)", v4 - v3, rd(fc)), line("meta", "Clan et mode de jeu", v5 - v4, rd(fm)), line("round", "Arrondi", tot - v5, "Le prix est arrondi à l’unité supérieure."));
    return { unit: "$", total: tot, lines: lines };
  }
  function reputation(s) {
    var e = E(), tr = BL.territory, cw = BL.crew, a = Math.floor(Math.sqrt(Math.max(0, s.total)) / D().balance.repDivisor), n = e.count(s.ach);
    var lines = [line("total", "Argent gagné au total", a, "Racine de l’argent gagné ÷ " + D().balance.repDivisor + " (arrondi)."), line("bonus", "Bonus permanents", s.bonus.rep, "Gagnés avec des récompenses."), line("upg", "Améliorations achetées", fsum(s, "rep"), ""), line("ach", "Succès débloqués", n, "1 point par succès."), line("terr", "Quartiers contrôlés", tr ? tr.repBonus(s) : 0, ""), line("crew", "Équipe", cw ? cw.repBonus(s) : 0, "")];
    return { unit: "", total: e.reputation(s), lines: lines };
  }
  function influence(s) {
    var e = E(), tr = BL.territory, cw = BL.crew;
    return { unit: "", total: e.influence(s), lines: [line("act", "Niveaux de bâtiments", Math.floor(e.count(s.owned) / 2), "1 point pour 2 niveaux de meilleur bâtiment."), line("bonus", "Bonus permanents", s.bonus.infl, ""), line("upg", "Améliorations achetées", fsum(s, "infl"), ""), line("terr", "Quartiers contrôlés", tr ? tr.inflBonus(s) : 0, ""), line("crew", "Équipe", cw ? cw.inflBonus(s) : 0, "")] };
  }
  /* point d'entrée : « income », « rep », « infl », « act:id », « upk:id », « bld:id:i », « cost:id:i » */
  function get(s, key) {
    var p = String(key).split(":"), k = p[0];
    try {
      if (k === "income") return Object.assign({ title: "Revenus nets par seconde" }, income(s));
      if (k === "rep") return Object.assign({ title: "Réputation" }, reputation(s));
      if (k === "infl") return Object.assign({ title: "Influence territoriale" }, influence(s));
      var a = E().find(D().activities, p[1]); if (!a) return null;
      if (k === "act") return Object.assign({ title: "Revenus : " + a.name }, activity(s, a.id));
      if (k === "upk") return Object.assign({ title: "Entretien : " + a.name }, upkeep(s, a.id));
      if (k === "bld") return Object.assign({ title: "Revenus : " + a.name + ", bâtiment " + (+p[2] + 1) }, building(s, a.id, +p[2] || 0));
      if (k === "cost") return Object.assign({ title: "Prix : " + a.name + ", bâtiment " + (+p[2] + 1) }, cost(s, a.id, +p[2] || 0));
    } catch (e) { return null; }
    return null;
  }
  BL.explain = { get: get, income: income, activity: activity, building: building, upkeep: upkeep, cost: cost, reputation: reputation, influence: influence, sum: sumOf };
})(typeof window !== "undefined" ? window : globalThis);
