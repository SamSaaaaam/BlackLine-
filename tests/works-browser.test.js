/* Partie 17 · D (+ B) : chantiers dans le navigateur — 3 largeurs, carte, vue Empire, fiche du bâtiment, inauguration, pot-de-vin avec confirmation,
   absence (bilan), ancienne sauvegarde v13, tutoriel toujours finissable, mouvements réduits, aucune erreur console. */
const T = require("./_browser");
const SAVE = (extra) => T.saveEnv(Object.assign({ v: 13, state: { money: 5e5, total: 5e6, t: 7200, bl: { backroom: [12, 3], freight: [6] }, owned: { backroom: 12, freight: 6 } } }, extra || {}));
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const p = await T.open(b, url, { w, h, cfg: null, save: SAVE() });
      T.check(await p.evaluate(() => BL.save.VERSION >= 14 && BL.main.state().works.q.length === 0), w + " px : sauvegarde v13 relue, aucun chantier");
      await p.click("#mPlay"); await p.waitForTimeout(600);
      const r = await p.evaluate(() => { const H = BL.ui.handlers, s = BL.main.state(), m0 = s.money, lv = BL.economy.bLevel(s, "backroom", 0); const ok = H.buyActivity("backroom", 0); H.buyActivity("freight", 0); H.buyActivity("backroom", 1);
        return { ok, paid: s.money < m0, lv: BL.economy.bLevel(s, "backroom", 0) === lv, q: s.works.q.length }; });
      T.check(r.ok && r.paid && r.lv && r.q === 3, w + " px : achat → chantier payé, niveau inchangé pendant les travaux");
      await p.evaluate(() => { BL.ui.go("map"); BL.mapUI.select({ type: "lot", act: "backroom", id: "backroom#0" }); }); await p.waitForTimeout(700);
      const mp = await p.evaluate(() => ({ sites: document.querySelectorAll(".wover .wsite:not([hidden])").length, btn: document.querySelector("#mapPanel .btn.buy").textContent, box: !!document.querySelector("#mapPanel .pwk:not([hidden]) .wlot"), dock: !!document.querySelector("#v_map .wkd") }));
      T.check(mp.sites >= 1, w + " px : échafaudage dessiné sur la carte (" + mp.sites + ")");
      T.check(/EN CHANTIER/.test(mp.btn) && mp.box, w + " px : fiche du bâtiment « en chantier », barre et temps restant");
      T.check(mp.dock, w + " px : panneau « Chantiers » sur la carte");
      T.check(await T.noHScroll(p), w + " px : carte sans défilement horizontal");
      await T.calm(p); await p.screenshot({ path: T.shotPath("p17-chantier-carte-" + w) });
      /* inauguration : le bâtiment 2 (4 s) se termine sous nos yeux */
      await p.evaluate(() => BL.mapUI.select({ type: "lot", act: "backroom", id: "backroom#1" })); await p.waitForTimeout(150);
      const inaug = await p.waitForFunction(() => document.querySelector(".wover .winaug") || BL.economy.bLevel(BL.main.state(), "backroom", 1) === 4 && document.querySelector(".wover .winaug"), null, { timeout: 8000 }).then(() => true, () => false);
      T.check(inaug, w + " px : inauguration affichée à la fin du chantier");
      T.check(await p.evaluate(() => BL.economy.bLevel(BL.main.state(), "backroom", 1) === 4), w + " px : niveau appliqué à la fin");
      await p.evaluate(() => BL.ui.go("empire")); await p.waitForTimeout(400);
      const em = await p.evaluate(() => ({ card: !!document.querySelector("#v_empire .wk .wk-r"), busy: [...document.querySelectorAll("#acts .card.act")].some(c => c.classList.contains("wbusy")) }));
      T.check(em.card && em.busy, w + " px : vue Empire : carte Chantiers et bâtiment marqué en chantier");
      T.check(await T.noHScroll(p), w + " px : vue Empire sans défilement horizontal");
      const sm = await T.smallText(p, "#v_empire .wk"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.slice(0, 3).join(","));
      await T.calm(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: T.shotPath("p17-chantier-empire-" + w) });
      /* pot-de-vin : confirmation, puis paiement */
      if (w === 1366) {
        const bb = await p.$("#v_empire .wk-br:not([disabled])"); T.check(!!bb, "pot-de-vin proposé");
        if (bb) { const before = await p.evaluate(() => ({ m: BL.main.state().money, l: BL.works.left(BL.main.state(), BL.main.state().works.q[0]) })); await bb.click(); await p.waitForTimeout(200);
          T.check(await p.evaluate(() => !document.getElementById("modal").hidden && /pot-de-vin/i.test(document.getElementById("mBox").textContent)), "pot-de-vin : fenêtre de confirmation");
          await p.click("#mBox .btn:not(.ghost)"); await p.waitForTimeout(200);
          const after = await p.evaluate(() => ({ m: BL.main.state().money, b: BL.main.state().works.q[0].b, g: BL.main.state().gold }));
          T.check(after.m < before.m && after.b === 1, "pot-de-vin payé en argent du jeu, chantier accéléré"); }
      }
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
    /* mouvements réduits : aucune animation d'échafaudage */
    let p = await T.open(b, url, { cfg: null, save: SAVE(), reduced: true }); await p.click("#mPlay"); await p.waitForTimeout(500);
    await p.evaluate(() => { BL.ui.handlers.buyActivity("backroom", 0); BL.ui.go("map"); }); await p.waitForTimeout(600);
    T.check(await p.evaluate(() => { const c = document.querySelector(".wover .w-crane"); return !!c && getComputedStyle(c).animationName === "none"; }), "mouvements réduits (système) : échafaudage fixe");
    await p.context().close();
    p = await T.open(b, url, { cfg: null, save: SAVE({ settings: { setup: true, tutorial: "done", name: "T", motion: false } }) }); await p.click("#mPlay"); await p.waitForTimeout(500);
    await p.evaluate(() => { BL.ui.handlers.buyActivity("backroom", 0); BL.ui.go("map"); }); await p.waitForTimeout(600);
    T.check(await p.evaluate(() => { const c = document.querySelector(".wover .w-crane"); return !!c && getComputedStyle(c).animationName === "none"; }), "réglage « Animations » coupé : échafaudage fixe");
    await p.context().close();
    /* absence : chantiers terminés pendant l'absence + bilan (gains limités) */
    const st = { money: 1e3, total: 5e6, t: 7200, bl: { backroom: [12, 3], freight: [6] }, owned: { backroom: 12, freight: 6 }, works: { clk: 50, fcd: 0, q: [{ id: "backroom", i: 0, to: 13, at: 40, dur: 58, b: 0 }, { id: "freight", i: 0, to: 7, at: 45, dur: 17, b: 0 }] } };
    p = await T.open(b, url, { cfg: null, save: T.saveEnv({ v: 14, savedAt: Date.now() - 2 * 3600e3, state: st }) }); await p.click("#mPlay"); await p.waitForTimeout(500);
    const bil = await p.evaluate(() => ({ txt: document.getElementById("offline").textContent, vis: !document.getElementById("offline").hidden, lv: BL.economy.bLevel(BL.main.state(), "backroom", 0), lv2: BL.economy.bLevel(BL.main.state(), "freight", 0), q: BL.main.state().works.q.length }));
    T.check(bil.vis && bil.lv === 13 && bil.lv2 === 7 && bil.q === 0, "absence de 2 h : les 2 chantiers terminés (100 %)");
    T.check(/Chantiers terminés/.test(bil.txt), "bilan : ligne « Chantiers terminés »");
    T.check(/20 % de tes revenus nets, 4 h/.test(bil.txt) && /Reste actif : tes gains hors-ligne sont limités/.test(bil.txt), "bilan : vrais pourcentage et plafond + « Reste actif »");
    await T.calm(p); await p.screenshot({ path: T.shotPath("p17-bilan-retour-1366") });
    T.check(!p.errors.length, "absence : aucune erreur console " + p.errors.join(" | "));
    await p.context().close();
    /* tutoriel : nouvelle partie, la première construction termine l'étape en quelques secondes */
    p = await T.open(b, url, { cfg: null, save: null, w: 390, h: 844 });
    await p.fill("#suName", "Novice"); await p.click("#suGo"); await p.waitForTimeout(300); await p.click("#mPlay"); await p.waitForTimeout(800);
    const tut0 = await p.evaluate(() => ({ act: BL.tutorial.isActive(), step: BL.tutorial.step() }));
    T.check(tut0.act, "nouvelle partie : didacticiel actif");
    await p.evaluate(() => { const st = BL.tutorial.STEPS.findIndex(x => x.id === "buy"); if (BL.tutorial.step() < st) BL.tutorial.start(st); });
    await p.waitForTimeout(300); const ok1 = await p.evaluate(() => BL.ui.handlers.buyActivity("backroom", 0));
    T.check(ok1, "didacticiel : première construction lancée");
    const adv = await p.waitForFunction(() => { const st = BL.tutorial.STEPS.findIndex(x => x.id === "buy"); return BL.tutorial.step() > st; }, null, { timeout: 9000 }).then(() => true, () => false);
    T.check(adv, "didacticiel : l'étape « première activité » se termine après le court chantier");
    T.check(!p.errors.length, "didacticiel : aucune erreur console " + p.errors.join(" | "));
    await p.context().close();
  } finally { await b.close(); srv.close(); }
  T.done("works-browser");
})();
