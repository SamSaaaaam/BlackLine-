/* Partie 19 · B : pastilles d'action (js/nav.js) — pures, tolérantes, jamais décoratives. */
const { load, check, done } = require("./_load"), N = require("./_nav");
const { BL } = load(), E = BL.economy;
check(JSON.stringify(BL.nav.GROUPS.map(g => g[0])) === JSON.stringify(Object.keys(N.GROUPS)) && BL.nav.GROUPS.every(g => JSON.stringify(g[4]) === JSON.stringify(N.GROUPS[g[0]])), "4 groupes conformes à tests/_nav.js");
check(BL.nav.GROUPS.every(g => g[3].split(/\s+/).length <= 3), "descriptions : 3 mots au plus");
let s = E.newState(0); let c = BL.nav.groupCounts(s); check(Object.values(c.views).every(v => v === 0) || c.views.empire <= 1, "nouvelle partie : rien ou seulement « construire »");
s.pending = "tip"; c = BL.nav.groupCounts(s); check(c.views.dash === 1 && c.groups.empire >= 1, "événement en cours → Tableau de bord 1, groupe Empire ≥ 1");
s.gold = BL.gold.capacity(s); c = BL.nav.groupCounts(s); check(c.views.hq === 1 && c.groups.more === c.views.hq + (c.views.saga || 0), "coffre plein → QG 1 ; groupe Plus = somme");
let bad = 0; for (const h of [null, undefined, 5, "x", [], {}, { money: NaN, works: "?", crew: 3, terr: { conflict: {} } }, { pending: { a: 1 }, gold: Infinity }]) { try { const r = BL.nav.groupCounts(h); if (Object.values(r.views).some(v => !(v >= 0 && v <= 99))) bad++; } catch (e) { bad++; } }
check(bad === 0, "états hostiles : aucune exception, compteurs bornés 0–99");
done("nav");
