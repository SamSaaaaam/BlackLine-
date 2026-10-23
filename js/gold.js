/* Lingots d'or : conversion dollars → lingots, coffre du QG (capacité améliorable), dépense en lingots.
   Les lingots n'ont AUCUN effet sur les revenus des activités : ils ne servent qu'au QG et à la boutique. Pas de reconversion en dollars. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var P = { basePrice: 250000, priceSec: 300, baseCap: 100, capPerLevel: 100, maxVault: 10, vaultCost: 20 };
  function E() { return BL.economy; }
  function initState(s) { s.gold = 0; s.vault = 0; s.goldLife = { bought: 0, spent: 0 }; }
  function capacity(s) { return P.baseCap + P.capPerLevel * (s.vault || 0); }
  function space(s) { return Math.max(0, capacity(s) - (s.gold || 0)); }
  /* Prix d'UN lingot : le même pour tous les lingots d'un achat, et il ne dépend plus du nombre de lingots déjà achetés (plus de hausse de 10 % par lingot, plus de commission).
     Il vaut P.priceSec secondes de ton revenu de base (sans boost), avec un minimum de P.basePrice : il suit ta progression pour que les boosts de la boutique ne deviennent pas gratuits.
     priceSec = 0 : prix strictement fixe (basePrice). */
  function price(s) { var inc = P.priceSec > 0 && E() && s && s.upg && s.owned ? E().incomeBase(s) : 0; return Math.max(P.basePrice, Math.ceil(inc * P.priceSec - 1e-9)); }
  function costFor(s, n) { n = Math.floor(n); return n >= 1 ? n * price(s) : 0; }
  function nextPrice(s) { return price(s); }
  function maxBuy(s) { var sp = space(s), p = price(s); if (sp < 1 || s.money < p) return 0; return Math.max(0, Math.min(sp, Math.floor((s.money + 1e-9) / p))); }
  function convert(s, n) {
    n = Math.floor(n); if (!(n >= 1) || n > space(s)) return null; var c = costFor(s, n); if (!(s.money + 1e-9 >= c)) return null;
    E().spend(s, c); s.gold += n; s.goldLife.bought += n; return { n: n, cost: c };
  }
  /* Devis de conversion (aucun effet sur l'état) : tout ce que l'écran affiche vient d'ici, pour que l'aperçu soit exactement ce qui sera débité. */
  function quote(s, n) {
    n = Math.floor(n); var sp = space(s), p = price(s), q = { n: n > 0 ? n : 0, price: p, cost: 0, fee: 0, avg: p, left: s.money, spaceAfter: sp, goldAfter: s.gold || 0, ok: false, why: "" };
    if (!(n >= 1)) { q.why = "Choisis au moins 1 lingot."; return q; }
    q.cost = n * p; q.left = s.money - q.cost; q.spaceAfter = sp - n; q.goldAfter = (s.gold || 0) + n;
    if (sp < 1) q.why = "Le coffre est plein."; else if (n > sp) q.why = "Il n’y a de la place que pour " + sp + " lingot" + (sp > 1 ? "s" : "") + "."; else if (s.money + 1e-9 < q.cost) q.why = "Il te manque une somme pour cette quantité."; else q.ok = true;
    return q;
  }
  function canSpend(s, a) { return Number.isInteger(a) && a > 0 && s.gold >= a; }
  function spend(s, a) { if (!canSpend(s, a)) return false; s.gold -= a; s.goldLife.spent += a; return true; }
  function vaultCost(s) { return (s.vault || 0) >= P.maxVault ? 0 : P.vaultCost * ((s.vault || 0) + 1); }
  function upgradeVault(s) { if ((s.vault || 0) >= P.maxVault) return false; return spend(s, vaultCost(s)) ? (s.vault++, true) : false; }
  function sanitize(r, s) {
    function n(x, lo, hi) { return typeof x === "number" && isFinite(x) ? Math.min(hi, Math.max(lo, Math.floor(x))) : lo; }
    s.vault = n(r.vault, 0, P.maxVault); var lf = r.goldLife && typeof r.goldLife === "object" ? r.goldLife : {};
    s.goldLife = { bought: n(lf.bought, 0, 1e7), spent: n(lf.spent, 0, 1e7) }; s.gold = n(r.gold, 0, capacity(s));
  }
  BL.gold = { P: P, initState: initState, sanitize: sanitize, capacity: capacity, space: space, price: price, nextPrice: nextPrice, costFor: costFor, maxBuy: maxBuy, quote: quote, convert: convert, canSpend: canSpend, spend: spend, vaultCost: vaultCost, upgradeVault: upgradeVault };
})(typeof globalThis !== "undefined" ? globalThis : this);
