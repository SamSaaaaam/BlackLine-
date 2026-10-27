/* Partie 19 · 0 : vérification de la Partie 17 avec une VRAIE sauvegarde v13 (tests/_seed.js) à 1366 / 390 / 320 px :
   menu (classement d'accueil, JOUER visible, aucune barre de défilement visible sur la colonne), fiche personnage, chantier en cours, mini-jeux (auto, clavier, mouvement réduit). */
const T = require("./_browser"), { V13 } = require("./_seed");
const CFG = { url: "https://abcdefghijklmnop.supabase.co", anonKey: "sb_publishable_testtesttesttesttest" };
const rows = Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, name: "Parrain " + (i + 1), score: 1e12 / (i + 1), level: 60 - i }));
const sb = r => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(rows) });
const seed = () => { const e = JSON.parse(V13); e.savedAt = Date.now(); e.settings.setup = true; e.settings.tutorial = "done"; return JSON.stringify(e); };
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS.concat([[320, 568]])) {
      const p = await T.open(b, url, { w, h, cfg: CFG, sb, save: seed(), wait: 900 });
      const m = await p.evaluate(() => { const x = document.querySelector("#menu .mbox2"), pl = document.getElementById("mPlay").getBoundingClientRect(), cs = getComputedStyle(x);
        return { bar: x.offsetWidth - x.clientWidth, sw: cs.scrollbarWidth, play: pl.top >= 0 && pl.bottom <= innerHeight, lb: document.querySelectorAll("#menu .mlb-row:not(.sk)").length, v: BL.save.VERSION, q: BL.main.state().works.q.length }; });
      T.check(m.v >= 14 && m.q === 0, w + "×" + h + " : sauvegarde v13 réelle chargée, chantiers vides");
      T.check(m.play, w + "×" + h + " : JOUER visible sans défiler");
      T.check(m.bar === 0 && m.sw === "none", w + "×" + h + " : aucune barre de défilement visible sur la colonne du menu");
      T.check(m.lb >= 5, w + "×" + h + " : classement d'accueil affiché (" + m.lb + " lignes)");
      T.check(await T.noHScroll(p), w + "×" + h + " : aucun défilement horizontal");
      if (h === 568) { await p.context().close(); continue; }
      await p.click("#mPlay"); await p.waitForTimeout(500);
      await p.evaluate(() => { BL.ui.go("team"); const f = document.querySelector('.fxt[data-id="rocco"]'); if (f) f.click(); }); await p.waitForTimeout(300);
      T.check(await p.evaluate(() => /Rocco/.test(document.querySelector("#cFiche .fxname").textContent) && !document.querySelector("#cFiche .fxbadge").hidden), w + " px : fiche personnage (équipier actif de la sauvegarde)");
      await p.evaluate(() => { BL.main.state().money = 1e12; BL.ui.handlers.buyActivity("freight", 0); BL.ui.go("map"); BL.mapUI.select({ type: "lot", act: "freight", id: "freight#0" }); }); await p.waitForTimeout(600);
      T.check(await p.evaluate(() => BL.main.state().works.q.length === 1 && /EN CHANTIER/.test(document.querySelector("#mapPanel .btn.buy").textContent)), w + " px : chantier en cours sur la sauvegarde migrée");
      for (const k of ["lockpick", "plan", "interro", "compta", "foreman"]) {
        await p.evaluate(k => BL.minigames.open(k, { title: "Vérif", who: "rival", seed: 9 }, sc => ({ text: "ok" })), k); await p.focus('#mini [data-m="auto"]'); await p.keyboard.press("Enter"); await p.waitForTimeout(100);
        const ok = await p.evaluate(() => /automatiquement/.test(document.querySelector("#mini .mini-res").textContent)); await p.keyboard.press("Enter"); await p.waitForTimeout(80);
        T.check(ok && await p.evaluate(() => document.getElementById("mini").hidden), w + " px · " + k + " : passage en automatique au clavier, retour");
      }
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
    const p = await T.open(b, url, { cfg: null, save: seed(), reduced: true, w: 390, h: 844 }); await p.click("#mPlay"); await p.waitForTimeout(400);
    await p.evaluate(() => BL.minigames.open("lockpick", { seed: 5 }, () => ({ text: "" }))); await p.click('#mini [data-m="start"]');
    T.check(await p.evaluate(() => BL.minigames._ui().still), "mouvement réduit : crochetage pas à pas");
    await p.context().close();
  } finally { await b.close(); srv.close(); }
  T.done("p17-check-browser");
})();
