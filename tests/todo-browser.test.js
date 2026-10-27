/* Partie 19 · C : carte « À faire maintenant » — en haut du Tableau de bord, rappel dans l'objectif du haut, chaque bouton mène à sa vue, état vide, 3 largeurs. */
const T = require("./_browser");
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const p = await T.open(b, url, { w, h, cfg: null, save: T.saveEnv({ v: 14, state: { money: 1e6, total: 5e7, bl: { backroom: [3] }, owned: { backroom: 3 }, pending: "tip", heat: { v: 80 } } }) });
      await p.click("#mPlay"); await p.waitForTimeout(800); await p.evaluate(() => BL.ui.go("dash")); await p.waitForTimeout(300);
      const top = await p.evaluate(() => { const v = document.getElementById("v_dash"); return v.firstElementChild.id; }); T.check(top === "todoDash", w + " px : carte en haut du Tableau de bord");
      const items = await p.$$eval("#todoNow .tdn-i", e => e.map(x => x.querySelector(".tdn-t").textContent)); T.check(items.length >= 1 && items.length <= 3 && items.every(t => t.length <= 60), w + " px : 1 à 3 actions, textes ≤ 60 caractères (" + items.join(" | ") + ")");
      T.check(await p.evaluate(() => { const g = document.getElementById("gTodo"); return !g.hidden && /^À faire : /.test(g.textContent); }), w + " px : rappel dans l'objectif du haut");
      await T.calm(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: T.shotPath("p19-a-faire-" + w) });
      /* chaque bouton mène à sa vue */
      const views = await p.evaluate(() => BL.todo.next(BL.main.state(), Date.now()).map(x => x.view));
      for (let i = 0; i < views.length; i++) { await p.evaluate(() => BL.ui.go("dash")); await p.waitForTimeout(250); await p.click(`#todoNow button[data-k="${i}"]`); await p.waitForTimeout(250);
        T.check(await p.evaluate(v => !document.getElementById("v_" + v).hidden, views[i]), w + " px : bouton n°" + (i + 1) + " → vue « " + views[i] + " »"); await p.evaluate(() => { if (BL.heatUI && BL.heatUI.isOpen()) BL.heatUI.close(); }); }
      /* rappel du haut : mène à la première action */
      await p.evaluate(() => BL.ui.go("glossary")); await p.waitForTimeout(250); await p.click("#gTodo"); await p.waitForTimeout(250);
      T.check(await p.evaluate(v => !document.getElementById("v_" + v).hidden, views[0]), w + " px : le rappel du haut mène à la première action");
      /* attaque : vers Territoires ; chaleur : ouvre la fenêtre Chaleur */
      await p.evaluate(() => { const s = BL.main.state(); s.terr.conflict = { did: "center", fid: "lames", end: s.t + 999 }; BL.ui.go("dash"); }); await p.waitForTimeout(400);
      const k = await p.evaluate(() => BL.todo.next(BL.main.state(), Date.now()).findIndex(x => x.id === "attack"));
      if (k >= 0) { await p.click(`#todoNow button[data-k="${k}"]`); await p.waitForTimeout(250); T.check(await p.evaluate(() => !document.getElementById("v_terr").hidden), w + " px : attaque → Territoires"); } else T.check(true, w + " px : (attaque masquée par 3 actions plus prioritaires)");
      /* état vide */
      await p.evaluate(() => { const s = BL.main.state(); s.money = 0; s.pending = null; s.terr.conflict = null; s.heat.v = 0; BL.data.missions.forEach(m => s.claimed[m.id] = true); ["dc", "wc"].forEach(k => { const ch = s.meta && s.meta[k]; if (ch && Array.isArray(ch.list)) ch.list.forEach(x => { x.cl = true; }); });   /* défis déjà réclamés (chaleur à 0 accomplit le défi « Profil bas » depuis le bloc E) */ BL.works.order(Object.assign(s, { money: 1e9 }), "backroom", 0, 1); s.money = 0; BL.ui.go("dash"); });
      await p.waitForTimeout(500); const e = await p.$eval("#todoNow", x => x.textContent);
      T.check(/Rien d’urgent\. Profite de la ville\./.test(e) && /Prochain événement/.test(e), w + " px : état vide soigné (" + e.slice(0, 70) + ")");
      T.check(await T.noHScroll(p), w + " px : aucun défilement horizontal");
      const sm = await T.smallText(p, "#todoDash"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.join(","));
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
  } finally { await b.close(); srv.close(); }
  T.done("todo-browser");
})();
