/* Partie 19 · B : navigation en 4 groupes — chaque vue atteignable (≤ 2 clics sur ordinateur, ≤ 3 sur téléphone avec le bouton menu),
   identifiants data-view inchangés, descriptions de 3 mots au plus, clavier (Tab, flèches), focus visible, pastilles d'action = somme des vues. */
const T = require("./_browser"), N = require("./_nav");
const CFG = { url: "https://abcdefghijklmnop.supabase.co", anonKey: "sb_publishable_testtesttesttesttest" };
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const p = await T.open(b, url, { w, h, cfg: CFG, sb: r => r.abort(), save: T.saveEnv({ v: 14, state: { money: 1e6, total: 5e7, bl: { backroom: [12, 3] }, pending: "tip" } }) });
      await p.click("#mPlay"); await p.waitForTimeout(600); await T.calm(p);
      const g = await p.evaluate(() => [...document.querySelectorAll("#nav [data-group]")].map(x => ({ id: x.dataset.group, desc: x.querySelector("small").textContent })));
      T.check(JSON.stringify(g.map(x => x.id)) === JSON.stringify(Object.keys(N.GROUPS)), w + " px : 4 groupes Empire / Terrain / Équipe / Plus");
      T.check(g.every(x => x.desc.trim().split(/\s+/).length <= 3), w + " px : descriptions de 3 mots au plus (" + g.map(x => x.desc).join(" | ") + ")");
      const ids = await p.evaluate(() => [...document.querySelectorAll("#subnav [data-view]")].map(x => x.dataset.view).sort());
      T.check(JSON.stringify(ids) === JSON.stringify(N.VIEWS.slice().sort()), w + " px : toutes les vues, identifiants data-view inchangés");
      for (const [gid, views] of Object.entries(N.GROUPS)) for (const v of views) {
        let clicks = 0; await p.evaluate(() => BL.ui.go("dash")); await p.waitForTimeout(60);
        if (w < 900) { await p.click("#menuBtn"); clicks++; await p.waitForTimeout(250); }
        await p.click(`#nav [data-group="${gid}"]`); clicks++; await p.waitForTimeout(120);
        const vis = await p.evaluate(v => !document.getElementById("v_" + v).hidden, v);
        if (!vis) { await p.click(`#subnav [data-view="${v}"]`); clicks++; await p.waitForTimeout(120); }
        const ok = await p.evaluate(v => !document.getElementById("v_" + v).hidden, v);
        T.check(ok && clicks <= (w < 900 ? 3 : 2), w + " px : « " + v + " » atteinte en " + clicks + " clic(s)");
      }
      /* clavier : flèches dans les sous-onglets, focus visible */
      await p.evaluate(() => BL.ui.go("empire")); await p.waitForTimeout(100); await p.focus('#subnav [data-view="empire"]'); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(60);
      const kb = await p.evaluate(() => ({ v: document.activeElement.dataset.view, o: getComputedStyle(document.activeElement).outlineStyle }));
      T.check(kb.v === "upg" && kb.o !== "none", w + " px : flèche droite → sous-onglet suivant, focus visible");
      /* pastilles : événement en cours → Tableau de bord ; groupe = somme de ses vues */
      await p.waitForTimeout(2200);
      const bd = await p.evaluate(() => { const num = el => el && el.querySelector(".nbadge") ? +el.querySelector(".nbadge").textContent : 0, v = {}, g = {};
        document.querySelectorAll("#subnav [data-view]").forEach(x => v[x.dataset.view] = num(x)); document.querySelectorAll("#nav [data-group]").forEach(x => g[x.dataset.group] = num(x)); return { v, g, c: BL.nav.groupCounts(BL.main.state()) }; });
      T.check(bd.v.dash === 1, w + " px : pastille « 1 » sur le Tableau de bord (événement en cours)");
      T.check(Object.entries(N.GROUPS).every(([gid, vs]) => bd.g[gid] === vs.reduce((a, x) => a + (bd.v[x] || 0), 0)), w + " px : pastille de groupe = somme de ses vues " + JSON.stringify(bd.g));
      T.check(["shop", "boxes", "radio", "glossary", "board", "arsenal"].every(x => !bd.v[x]), w + " px : aucune pastille décorative (boutique, box, radio, glossaire, classement, arsenal)");
      T.check(await T.noHScroll(p), w + " px : aucun défilement horizontal");
      if (w < 900) { await p.click("#menuBtn"); await p.waitForTimeout(250); }
      await p.screenshot({ path: T.shotPath("p19-navigation-" + w) });
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
  } finally { await b.close(); srv.close(); }
  T.done("nav-browser");
})();
