/* Partie 19 · D : formateur unique des nombres (js/fmt.js) — valeurs limites, arrondis qui changent de suffixe, aller-retour,
   et recherche de tout formatage fait à la main dans les modules (avec une liste d'exceptions justifiées). */
const fs = require("fs"), path = require("path"), { load, check, done, ROOT } = require("./_load");
const { BL } = load(), F = BL.fmt;
const NB = " ", cases = [[0, "$0"], [999, "$999"], [999.4, "$999"], [999.5, "$1" + NB + "K"], [1000, "$1" + NB + "K"], [1234, "$1,23" + NB + "K"], [30e6, "$30" + NB + "M"], [30.04e6, "$30" + NB + "M"], [1e6 - 1, "$1" + NB + "M"], [999.9e3, "$1" + NB + "M"], [123456, "$123" + NB + "K"], [1.5e9, "$1,5" + NB + "Md"], [1e12, "$1" + NB + "Bn"], [1e15, "$1" + NB + "Bd"], [2.5e18, "$2,5" + NB + "Tn"], [7.5, "$7,5"], [0.15, "$0,15"], [-1234, "−$1,23" + NB + "K"], [NaN, "—"], [Infinity, "—"], [-Infinity, "—"]];
cases.forEach(([v, want]) => check(F.money(v) === want, "money(" + v + ") = « " + want.replace(/ /g, " ") + " » (obtenu « " + F.money(v).replace(/ /g, " ") + " »)"));
check(!/,0\b|,\d*0\s/.test([3e7, 2e6, 1.1e9, 1e3, 12e3, 120e3].map(v => F.money(v)).join(" ")), "aucun zéro inutile (« $30 M », pas « $30,0 M »)");
let maxSig = 0, decAbove100 = 0; for (let k = 0; k < 2000; k++) { const v = Math.pow(10, (k / 2000) * 20) * (1 + (k % 7) / 10), s = F.num(v), d = s.replace(/[^\d]/g, "").replace(/^0+/, ""); if (!/ Td$/.test(s)) maxSig = Math.max(maxSig, d.length); const m = /^(\d+),/.exec(s); if (m && +m[1] >= 100) decAbove100++; }
check(maxSig <= 3, "3 chiffres significatifs au plus (max " + maxSig + ")"); check(decAbove100 === 0, "aucune décimale à partir de 100");
check(F.num(1236.7, "detailed") === "1,237" + NB + "K", "réglage « détaillés » : 4 chiffres (choix explicite du joueur)");
check(F.num(1e30).endsWith("Td") && !/e\+/.test(F.num(1e30)), "au-delà du dernier suffixe : pas de notation scientifique");
/* aller-retour (formateur du classement : leaderboard-ui et lb-home affichent via BL.ui.money = BL.fmt.money) */
let worst = 0; for (let k = 0; k < 1000; k++) { const v = Math.pow(10, 1 + (k / 1000) * 17) * 1.37; worst = Math.max(worst, Math.abs(F.parse(F.money(v)) - v) / v); }
check(worst <= 0.005, "aller-retour parse(money(x)) : erreur ≤ 0,5 % (max " + (worst * 100).toFixed(2) + " %)");
const lbui = fs.readFileSync(path.join(ROOT, "js/leaderboard-ui.js"), "utf8"), lbh = fs.readFileSync(path.join(ROOT, "js/lb-home.js"), "utf8");
check(/u\.money\(n\)/.test(lbui) && /BL\.ui\.money\(n\)/.test(lbh), "le classement (page et accueil) passe par le formateur commun");
/* recherche du formatage fait à la main : toLocaleString, toFixed, concaténations de « $ » */
const EXC = {
  "fmt.js": { tf: 1, dl: 2, why: "le formateur lui-même" },
  "ui.js": { tl: 2, tf: 4, dl: 2, why: "valeurs EXACTES des infobulles (toLocaleString) ; géométrie SVG / CSS de la barre et du graphique (toFixed) ; repli si fmt.js absent" },
  "menu.js": { dl: 1, why: "valeur exacte sous l'argent du profil ($ + exact)" },
  "art.js": { tf: 2, why: "coordonnées SVG" }, "city.js": { tf: 9, why: "coordonnées SVG" }, "data-equip-art.js": { tf: 16, why: "coordonnées SVG" }, "portraits.js": { tf: 13, why: "coordonnées et opacités SVG" },
  "map-render.js": { tf: 11, why: "couleurs et opacités du canevas" }, "menu-bg.js": { tf: 4, why: "variables CSS du décor" }, "territory-ui.js": { tf: 2, why: "points SVG" },
  "bonds-ui.js": { tf: 1, why: "scaleX CSS" }, "crew-ui.js": { tf: 1, why: "scaleX CSS" }, "heat-ui.js": { tf: 3, why: "scaleX CSS et signature interne" }, "meta-ui.js": { tf: 2, why: "scaleX CSS" },
  "minigames-ui.js": { tf: 3, why: "positions CSS du crochetage" }, "saga-ui.js": { tf: 1, why: "largeur CSS" }, "works-ui.js": { tf: 4, why: "transformations CSS des échafaudages" }
};
const found = [];
for (const f of fs.readdirSync(path.join(ROOT, "js"))) {
  const t = fs.readFileSync(path.join(ROOT, "js", f), "utf8"), c = { tl: (t.match(/toLocaleString\(/g) || []).length, tf: (t.match(/toFixed\(/g) || []).length, dl: (t.match(/["']\$["']\s*\+|\$"\s*\+\s*[a-zA-Z]/g) || []).length }, e = EXC[f] || {};
  ["tl", "tf", "dl"].forEach(k => { if (c[k] > (e[k] || 0)) found.push(f + " : " + { tl: "toLocaleString", tf: "toFixed", dl: "concaténation de $" }[k] + " ×" + c[k] + " (autorisé " + (e[k] || 0) + ")"); });
}
check(!found.length, "aucun formatage fait à la main hors exceptions justifiées" + (found.length ? " : " + found.join(" ; ") : ""));
Object.keys(EXC).forEach(f => check(fs.existsSync(path.join(ROOT, "js", f)) && EXC[f].why, "exception justifiée : " + f + " (" + EXC[f].why + ")"));
/* glossaire */
check(/K = mille, M = million, Md = milliard, Bn = billion/.test(fs.readFileSync(path.join(ROOT, "js/glossary.js"), "utf8")), "glossaire : ligne qui explique les suffixes");
done("fmt");
