/* Partie 19 · C : « À faire maintenant » (js/todo.js) — priorités, au plus 3 lignes, textes ≤ 60 caractères sans sigle,
   aucune écriture dans l'état, 500 états aléatoires (dont hostiles) sans exception. */
const { load, check, done } = require("./_load");
const { BL } = load(), E = BL.economy, Tq = BL.todo, D = BL.data;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const VIEWS = ["dash", "empire", "upg", "goals", "map", "ops", "terr", "team", "arsenal", "hq", "shop", "boxes", "radio", "saga", "board", "glossary"];
/* priorités */
let s = E.newState(0); E.setOwned(s, "backroom", 3); s.money = 1e6; s.pending = "tip"; BL.heat.state(s).v = 80;
let l = Tq.next(s, 0); check(l.length === 3 && l[0].id === "claim", "récompense à réclamer en premier (« Premiers pas ») : " + l.map(x => x.id).join(", "));
check(l[1].id === "worker" && l[2].id === "buy", "puis ouvrier libre, puis meilleur achat");
s.claimed.m1 = true; BL.works.order(s, "backroom", 0, 1); l = Tq.next(s, 0); check(l[0].id === "buy" && l.some(x => x.id === "heat") && l.some(x => x.id === "event"), "ouvrier occupé : achat, chaleur, événement");
s = E.newState(0); s.terr.conflict = { did: "center", fid: "lames", end: 100 }; l = Tq.next(s, 0); check(l.some(x => x.id === "attack" && x.view === "terr" && x.urgency === 3), "attaque de rival : vers Territoires, urgence maximale");
s = E.newState(0); s.money = 0; l = Tq.next(s, 0); const em = Tq.empty(s); check(l.length === 0 && /Rien d’urgent\. Profite de la ville\./.test(em.text) && /Prochain événement/.test(em.sub), "état vide soigné + prochain événement");
/* 500 états aléatoires */
let bad = 0, maxLen = 0, n3 = 0, wrote = 0, badView = 0, acr = 0;
for (let k = 0; k < 500; k++) {
  const r = rng(77 + k); let st;
  if (k % 10 === 9) st = [null, undefined, 3, "x", [], { money: NaN }, { works: "?", meta: 5, terr: { conflict: { did: "nope" } }, pending: "zzz" }, { claimed: null, heat: "chaud" }, { eq: [], heist: 7 }, { owned: { backroom: -5 } }][Math.floor(k / 10) % 10];
  else { st = E.newState(0); st.total = Math.floor(r() * 1e9); st.money = Math.pow(10, r() * 10); D.activities.forEach((a, ai) => { if (r() < 0.8 - ai * 0.15) E.setOwned(st, a.id, 1 + Math.floor(r() * 60), 1 + Math.floor(r() * 2)); });
    if (r() < 0.3) st.pending = D.events[Math.floor(r() * D.events.length)].id; if (r() < 0.3) BL.heat.state(st).v = r() * 100; if (r() < 0.2) st.terr.conflict = { did: "center", fid: "lames", end: 999 }; if (r() < 0.3) BL.meta.ensure(st, 1.7e12 + k * 864e5); }
  const before = JSON.stringify(st); let out;
  try { out = Tq.next(st, 1.7e12); Tq.empty(st); } catch (e) { bad++; continue; }
  if (JSON.stringify(st) !== before) wrote++;
  if (out.length > 3) bad++; if (out.length === 3) n3++;
  out.forEach(x => { maxLen = Math.max(maxLen, x.text.length); if (VIEWS.indexOf(x.view) < 0 || !(x.urgency >= 0 && x.urgency <= 3)) badView++; if (/\b[A-Z]{2,}\b/.test(x.text)) acr++; });
}
check(bad === 0, "500 états (dont 50 hostiles) : aucune exception, jamais plus de 3 lignes");
check(wrote === 0, "aucune écriture dans l'état");
check(maxLen <= 60, "textes ≤ 60 caractères (max " + maxLen + ")");
check(badView === 0 && acr === 0, "vues cibles valides, urgence 0–3, aucun sigle");
check(n3 > 50, "les cas à 3 actions existent (" + n3 + ")");
done("todo");
