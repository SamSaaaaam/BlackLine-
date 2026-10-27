/* Partie 19 · A : achat rapide dans le navigateur — sélecteur unique, libellés prix / gain / manque, meilleur achat, clavier, carte, 3 largeurs. */
const T = require("./_browser");
const ST = { money: 2e4, total: 5e6, t: 7200, bl: { backroom: [12, 3], freight: [6] }, owned: { backroom: 12, freight: 6 } };
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const p = await T.open(b, url, { w, h, cfg: null, save: T.saveEnv({ v: 14, state: ST }) });
      await p.click("#mPlay"); await p.waitForTimeout(500); await p.evaluate(() => BL.ui.go("empire")); await p.waitForTimeout(300);
      T.check(await p.evaluate(() => document.querySelectorAll(".bqbar .bqsel").length === 1 && !document.querySelector(".card.act .bqsel")), w + " px : un seul sélecteur de quantité, pas un par carte");
      /* ×10 au clavier : focus sur ×1, flèche droite */
      await p.focus('.bqbar [data-q="1"]'); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(250);
      const q = await p.evaluate(() => BL.main.settings().buyqty); T.check(q === "10" && await p.evaluate(() => document.activeElement && document.activeElement.dataset.q === "10"), w + " px : sélecteur au clavier (flèches) → ×10, mémorisé");
      const btn = await p.evaluate(() => { const c = [...document.querySelectorAll("#acts .card.act")][0], b = c.querySelector(".btn.buy"); return { t: b.querySelector(".bt").textContent, s: b.querySelector(".bs").textContent, d: b.disabled, k3: c.querySelector(".k3").textContent, lab: [...c.querySelectorAll(".kv span")].map(x => x.textContent).join("|") }; });
      T.check(/×10 · \$/.test(btn.t), w + " px : bouton « Améliorer … ×10 · $X » (" + btn.t + ")");
      T.check(btn.d ? /Il te manque \$/.test(btn.s) : /^\+\$.*\/s/.test(btn.s), w + " px : sous-ligne « +$Y/s » ou « Il te manque $Z » (" + btn.s + ")");
      T.check(/Gain si tu améliores/.test(btn.lab) && !/Meilleur achat|Bât\. /.test(btn.lab + btn.k3), w + " px : libellé « Gain si tu améliores » (plus de « Meilleur achat » ni « Bât. 1 »)");
      /* achat ×10 réel : un chantier vers +10 */
      await p.evaluate(() => { BL.main.state().money = 1e9; }); await p.waitForTimeout(250); await p.click("#acts .card.act .btn.buy"); await p.waitForTimeout(250);
      T.check(await p.evaluate(() => { const q = BL.main.state().works.q; return q.length === 1 && q[0].id === "backroom" && q[0].to === 22; }), w + " px : clic ×10 → un chantier vers le niveau 22");
      /* bouton « meilleur achat maintenant » */
      const best = await p.evaluate(() => document.querySelector(".bqbest .bt").textContent); T.check(/^Acheter : .+ · \$/.test(best), w + " px : « Meilleur achat maintenant » annonce son achat (" + best + ")");
      const m0 = await p.evaluate(() => BL.main.state().money); await p.waitForTimeout(200); await p.click(".bqbest"); await p.waitForTimeout(250);
      T.check(await p.evaluate(m => BL.main.state().money < m, m0), w + " px : un clic achète, sans fenêtre");
      await p.evaluate(() => { BL.main.state().money = 0; }); await p.waitForTimeout(350);
      T.check(/^Rien d’abordable — prochain achat dans \d+ (s|min|h)$/.test(await p.evaluate(() => document.querySelector(".bqbest .bt").textContent)) && await p.evaluate(() => document.querySelector(".bqbest").disabled), w + " px : « Rien d’abordable — prochain achat dans … »");
      const hs = await T.noHScroll(p); if (!hs) console.log(await p.evaluate(() => { const o = []; document.querySelectorAll("body *").forEach(e => { if (e.closest("svg")) return; const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1 && r.width > 0) o.push(e.tagName + "." + e.className + " " + Math.round(r.right)); }); return [document.documentElement.scrollWidth, document.body.scrollWidth, o.slice(0, 6)]; }));
      T.check(hs, w + " px : aucun défilement horizontal");
      const sm = await T.smallText(p, "#v_empire .bqbar"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.join(","));
      await p.evaluate(() => { BL.main.state().money = 3e4; }); await p.waitForTimeout(300); await T.calm(p); await p.evaluate(() => window.scrollTo(0, document.querySelector(".bqbar").getBoundingClientRect().top + scrollY - 90)); await p.waitForTimeout(100); await p.screenshot({ path: T.shotPath("p19-achat-rapide-" + w) });
      /* carte : même réglage dans la fiche du bâtiment */
      await p.evaluate(() => { BL.ui.go("map"); BL.mapUI.select({ type: "lot", act: "freight", id: "freight#0" }); }); await p.waitForTimeout(500);
      const mp = await p.evaluate(() => ({ q: !document.querySelector("#mapPanel .pqty").hidden, on: document.querySelector('#mapPanel .pqty [data-q="10"]').getAttribute("aria-checked"), t: document.querySelector("#mapPanel .btn.buy").textContent }));
      T.check(mp.q && mp.on === "true" && /×10 · \$/.test(mp.t), w + " px : fiche du bâtiment sur la carte : même quantité (" + mp.t + ")");
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
  } finally { await b.close(); srv.close(); }
  T.done("buy-browser");
})();
