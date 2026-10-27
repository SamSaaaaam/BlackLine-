/* Partie 17 · B : gains hors-ligne réduits (20 % des revenus nets, 4 h au plus). Les anciens tests supposaient 50 % / 8 h : ils lisent maintenant BL.data.balance. */
const { load, check, done } = require("./_load");
const { BL } = load(), E = BL.economy, B = BL.data.balance;
check(B.offlineEfficiency === 0.2 && B.offlineCapSec === 4 * 3600, "réglages : 20 % et 4 h");
check(B.sleepGapSec === 300, "pause > 5 min = absence (mêmes règles)");
const s = E.newState(0); E.setOwned(s, "backroom", 30); E.setOwned(s, "freight", 10); const r = E.incomeBase(s);
let o = E.offline(s, 300e3, 0); check(Math.abs(o.gain - r * 300 * 0.2) < 1e-6 && !o.capped, "5 min : 20 % de 5 min de revenus");
const r2 = E.incomeBase(s); o = E.offline(s, 300e3 + 8 * 3600e3, 300e3); check(o.capped && o.sec === 4 * 3600 && Math.abs(o.gain - r2 * 4 * 3600 * 0.2) < 1e-3, "8 h : plafonné à 4 h");
check(o.gain <= r2 * 48 * 60 + 1e-6, "au plus ≈ 48 min de revenu actif par absence");
const m = s.money; o = E.offline(s, s.saved, s.saved); check(o.gain === 0 && s.money === m, "second appel immédiat : rien (pas de double réclamation)");
o = E.offline(s, s.saved - 3600e3); check(o.future && o.gain === 0, "horloge qui recule : rien");
o = E.offline(s, NaN); check(o.gain === 0, "date invalide : rien");
const notes = E.offlineNotes(s, { capped: true }); check(notes.some(x => /seules 4 h/.test(x)), "note de plafond : « seules 4 h »");
done("offline");
