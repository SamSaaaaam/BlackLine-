/* Partie 19 · F : sauvegarde de fin de partie fabriquée par la logique du jeu (aucun raccourci dans la sauvegarde elle-même) :
   les 8 activités ouvertes, les 11 quartiers contrôlés, des bâtiments de quartier des nouveaux types sur la rive sud. */
const { load } = require("./_load");
function lateState(opts) {
  opts = opts || {}; const { BL } = load(), E = BL.economy, D = BL.data, s = E.newState(0);
  s.total = 2e15; s.money = 5e15; s.t = 400 * 3600; s.saved = Date.now();
  const lv = { backroom: 70, freight: 60, fence: 55, estate: 50, holding: 52, maritime: 22, shell: 16, guard: opts.noGuard ? 0 : 12 };
  Object.keys(lv).forEach(id => { if (lv[id]) E.setLevels(s, id, [lv[id], 14, 10, 6].slice(0, lv[id] >= 15 ? 4 : 1)); });
  D.upgrades.forEach(u => { if (E.unlocked(s, u)) s.upg[u.id] = true; });
  if (opts.terr !== false) {
    D.territory.districts.forEach(d => { if (opts.southFree && d.city) return; s.terr.lv[d.id] = 3; });
    s.districts = { marina: ["pier:0", "hotel:1"], franche: ["exchange:0", "forgery:1", "garrison:2"], faubourg: ["hotel:0", "garrison:1"], center: ["club:0"] };
    if (opts.southFree) s.districts = { center: ["club:0"] };
  }
  return { BL, s };
}
function lateSave(opts) {
  const { BL, s } = lateState(opts);
  return JSON.stringify({ v: BL.save.VERSION, savedAt: Date.now(), rev: 0, owner: "test", settings: { setup: true, tutorial: "done", name: "Testeur", opscene: "off" }, state: s });
}
module.exports = { lateState, lateSave };
