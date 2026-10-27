/* Partie 19 · E : défis dans le navigateur — série, titres, récap de la semaine, nouveaux modèles, profil, 3 largeurs. */
const T = require("./_browser");
const day = d => new Date(2026, 10, d, 12).getTime();
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const st = { money: 1e9, total: 5e10, t: 9e4, bl: { backroom: [30, 12], freight: [20], fence: [12] }, owned: { backroom: 30, freight: 20, fence: 12 }, crew: { m: { gino: { lv: 2, xp: 0, on: true }, rocco: { lv: 2, xp: 0, on: true } }, v: 1 },
        dfs: { st: 4, best: 7, last: new Date().toISOString().slice(0, 10), fz: "", vis: 3, ti: ["s3", "s7"], wk: { key: "2099-01-05", t0: 0, n: 0, w: 0 }, rc: { key: "2026-11-02", n: 9, w: 2, gain: 3.2e9, st: 4 }, rcSeen: "" },
        meta: { pr: 0, clan: "", hard: false, runs: [], coll: { items: [], dist: [], crew: [] }, cl: 12, dc: { key: new Date().toISOString().slice(0, 10), list: [{ t: "visit", n: 1, tg: 2, b: 0, cl: false }, { t: "works", n: 0, tg: 2, b: 0, cl: false }, { t: "cool", n: 0, tg: 40, b: 0, cl: false }] }, wc: null } };
      const p = await T.open(b, url, { w, h, cfg: null, save: T.saveEnv({ v: 15, state: st }) });
      await p.click("#mPlay"); await p.waitForTimeout(500); await T.calm(p);
      await p.evaluate(() => BL.metaUI.open("chal")); await p.waitForTimeout(400);
      const txt = await p.evaluate(() => document.querySelector(".metadlg, [role=dialog].mt, #metaDlg") ? (document.querySelector(".metadlg, #metaDlg") || document.body).textContent : document.body.textContent);
      T.check(/Série/.test(txt) && /record 7/.test(txt), w + " px : série et record affichés");
      T.check(/Régulier/.test(txt) && /Assidu/.test(txt), w + " px : titres obtenus affichés");
      T.check(/Récap de la semaine/.test(txt) && /9\s*défis réclamés/.test(txt), w + " px : récap de la semaine (9 défis)");
      T.check(/Tournée/.test(txt) && /Chantiers/.test(txt) && /Profil bas/.test(txt), w + " px : nouveaux modèles affichés (Tournée, Chantiers, Profil bas)");
      T.check(await T.noHScroll(p), w + " px : aucun défilement horizontal");
      await p.screenshot({ path: T.shotPath("p19-defis-" + w) });
      /* visite d'un quartier depuis Territoires → progression du défi « Tournée » */
      await p.evaluate(() => BL.metaUI.close()); const v0 = await p.evaluate(() => BL.main.state().dfs.vis);
      await p.evaluate(() => { BL.ui.go("terr"); BL.terrUI.select("port"); BL.terrUI.select("port"); BL.terrUI.select("market"); }); await p.waitForTimeout(200);
      T.check(await p.evaluate(v => BL.main.state().dfs.vis === v + 2, v0), w + " px : visites de quartiers comptées (une fois par quartier et par jour)");
      /* profil : titres */
      await p.evaluate(() => BL.menu.openSheet("profile")); await p.waitForTimeout(300);
      T.check(await p.evaluate(() => /Régulier/.test(document.querySelector(".pf-titles") ? document.querySelector(".pf-titles").textContent : "")), w + " px : titres sur le profil");
      const sm = await T.smallText(p, ".pf-titles"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.join(","));
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
  } finally { await b.close(); srv.close(); }
  T.done("challenges-browser");
})();
