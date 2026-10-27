/* Partie 17 · C : fiche personnage (3 largeurs) : mise en page, badge ACTIF, niveaux, aucune donnée écrite en dur, pas de défilement horizontal. */
const T = require("./_browser");
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const save = T.saveEnv({ state: { money: 5e6, total: 5e7, t: 7200, crew: { m: { rocco: { lv: 3, xp: 0, on: true } }, v: 1 } } });
      const p = await T.open(b, url, { w, h, cfg: null, save });
      await p.click("#mPlay"); await p.waitForTimeout(600); await p.evaluate(() => BL.ui.go("team")); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('.fxt[data-id="rocco"]').click()); await p.waitForTimeout(300);
      const info = await p.evaluate(() => { const f = document.getElementById("cFiche"), q = s => f.querySelector(s), r = s => q(s).getBoundingClientRect();
        return { name: q(".fxname").textContent, font: getComputedStyle(q(".fxname")).fontFamily, ital: getComputedStyle(q(".fxname")).fontStyle, badge: !q(".fxbadge").hidden, crown: !!q(".fxcrown"), stars: q(".fxstars .stars") ? q(".fxstars .stars").getAttribute("aria-label") : "", rows: f.querySelectorAll(".fxrow").length,
          cur: f.querySelectorAll(".fxlv li.cur").length, lock: f.querySelectorAll(".fxlv li.lock").length, bond: !q(".fxbond").hidden, art: r(".fxartw"), inf: r(".fxinfo"), svg: !!q(".fxart svg[preserveAspectRatio]") }; });
      T.check(info.name === "Rocco Moretti" && /Playfair/.test(info.font) && info.ital === "italic", w + " px : nom en Playfair Display italique (données du jeu)");
      T.check(info.badge && info.crown, w + " px : badge ACTIF et emblème couronne");
      T.check(/1 étoile/.test(info.stars) && info.rows === 3, w + " px : rang en étoiles, 3 lignes Spécialité / Bonus / Coût");
      T.check(info.cur === 1 && info.lock > 0, w + " px : niveau actuel surligné, suivants avec cadenas");
      T.check(info.bond, w + " px : cadre « Caractère et loyauté »");
      T.check(info.svg, w + " px : repli SVG recadré vers le visage");
      if (w >= 1000) T.check(info.art.right <= info.inf.left + 1 && info.art.width > 300, "ordinateur : illustration à gauche, informations à droite");
      else T.check(info.art.bottom <= info.inf.top + 1, w + " px : image en haut, informations en dessous");
      T.check(await T.noHScroll(p), w + " px : aucun défilement horizontal");
      const sm = await T.smallText(p, "#cFiche"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.slice(0, 3).join(","));
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await T.calm(p); await p.evaluate(() => window.scrollTo(0, document.getElementById("cFiche").getBoundingClientRect().top + scrollY - 70)); await p.waitForTimeout(150); await p.screenshot({ path: T.shotPath("p17-fiche-personnage-" + w) });
      await p.context().close();
    }
  } finally { await b.close(); srv.close(); }
  T.done("crew-fiche-browser");
})();
