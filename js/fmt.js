/* Partie 19 · D : formateur UNIQUE des nombres affichés (barre du haut, cartes, bilan, journal, classement, boutique, fiches).
   Règles : 3 chiffres significatifs au plus (4 avec le réglage « Nombres : détaillés », choix explicite du joueur), aucun zéro inutile
   (« $30 M » et non « $30,0 M »), aucune décimale à partir de 100, virgule décimale, signe moins typographique, suffixes fixes :
   K = mille, M = million, Md = milliard, Bn = billion (10^12), Bd = billiard (10^15), Tn = trillion (10^18), Td = trilliard (10^21).
   Valeur absente ou infinie : « — ». Affichage seulement : les valeurs stockées ne changent jamais. */
(function (root) {
  var BL = root.BL = root.BL || {}, SUF = ["", "K", "M", "Md", "Bn", "Bd", "Tn", "Td"], NB = " ", mode = "short";
  function sig(v, p) { var t = Number(v.toPrecision(p)); return t; }
  function strip(t) { var s = String(t); if (s.indexOf("e") >= 0) s = t.toFixed(Math.max(0, 20)); if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, ""); return s.replace(".", ","); }
  /* nombre court : 0 · 7,5 · 950 · 1,23 K · 30 M · 456 Md */
  function num(n, m) {
    if (typeof n !== "number" || !isFinite(n)) return "—"; var neg = n < 0, p = (m || mode) === "detailed" ? 4 : 3; n = Math.abs(n); if (n === 0) return "0";
    var i = 0, v = n; while (v >= 1000 && i < SUF.length - 1) { v /= 1000; i++; }
    v = sig(v, p); if (v >= 1000 && i < SUF.length - 1) { v = sig(v / 1000, p); i++; }   /* arrondi qui change de suffixe : 999,95 K → 1 M */
    var s = v >= 1000 ? Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB) : v >= 100 ? String(Math.round(v)) : strip(v < 1e-6 && i === 0 ? 0 : v);
    if (s === "0" && n > 0) s = "0";
    return (neg && s !== "0" ? "−" : "") + s + (SUF[i] ? NB + SUF[i] : "");
  }
  function money(n, m) { var s = num(n, m); return s === "—" ? s : s.charAt(0) === "−" ? "−$" + s.slice(1) : "$" + s; }
  /* relecture d'un nombre affiché (tests, aller-retour avec le classement) */
  function parse(t) {
    var s = String(t).replace(/[\s $]/g, "").replace("−", "-").replace(",", "."), m = /^(-?\d+(?:\.\d+)?)([A-Za-z]*)$/.exec(s); if (!m) return NaN;
    var k = SUF.indexOf(m[2]); return k < 0 ? NaN : +m[1] * Math.pow(1000, k);
  }
  function setMode(m) { mode = m === "detailed" ? "detailed" : "short"; }
  BL.fmt = { num: num, money: money, parse: parse, setMode: setMode, mode: function () { return mode; }, SUF: SUF.slice(1) };
})(typeof globalThis !== "undefined" ? globalThis : this);
