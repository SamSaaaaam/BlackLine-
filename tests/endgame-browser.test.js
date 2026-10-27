/* Partie 19 · F : nouvelles activités, nouveaux bâtiments de quartier et rive sud dans le vrai jeu (Chromium), à 1366, 390 et 320 px.
   Cartes d'activités (débloquée / verrouillée), carte Territoires (11 quartiers), panneau d'un nouveau quartier et d'un nouveau bâtiment,
   menu Bâtiments, aucun défilement horizontal, texte ≥ 12 px, aucune erreur, aucune requête extérieure, coût de rendu de la carte mesuré. */
const T = require("./_browser"), { lateSave } = require("./_late");
/* coût d'une image de la carte : durée des rappels requestAnimationFrame (dessin compris) pendant `ms`, carte immobile puis déplacée */
async function frameCost(p, ms) {
  return p.evaluate(ms => new Promise(res => {
    const raf = window.requestAnimationFrame, out = []; let stop = false;
    window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); if (!stop) out.push(performance.now() - a); });
    setTimeout(() => { stop = true; window.requestAnimationFrame = raf; out.sort((a, b) => a - b); res({ n: out.length, avg: out.reduce((a, b) => a + b, 0) / Math.max(1, out.length), p95: out[Math.floor(out.length * 0.95)] || 0 }); }, ms);
  }), ms);
}
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch(), late = lateSave(), perf = [];
  const locked = T.saveEnv({ v: 15, state: { money: 5e12, total: 9e12, t: 30 * 3600, bl: { backroom: [40], freight: [40], fence: [30], estate: [25], holding: [25] }, owned: { backroom: 40, freight: 40, fence: 30, estate: 25, holding: 25 } } });
  try {
    for (const [w, h] of T.WIDTHS) {
      /* 1. activités verrouillées : la condition (niveau d'empire) est écrite en clair */
      let p = await T.open(b, url, { w, h, cfg: null, save: locked }); await p.click("#mPlay"); await p.waitForTimeout(600); await p.evaluate(() => BL.ui.go("empire")); await p.waitForTimeout(300);
      const lk = await p.evaluate(() => [...document.querySelectorAll("#acts .card.act")].map(c => c.textContent));
      T.check(lk.length === 8, w + " px : 8 cartes d'activités (" + lk.length + ")");
      T.check(/Fret des Brumes/.test(lk[5]) && /Verrouillé/.test(lk[5]) && /niveau d’empire 51/.test(lk[5]), w + " px : Fret des Brumes verrouillé au niveau 50, « niveau d’empire 51 » affiché");
      T.check(!p.errors.length, w + " px : aucune erreur (sauvegarde niveau 50)" + (p.errors.length ? " " + p.errors.join(" | ") : ""));
      await p.context().close();
      /* 2. fin de partie : tout est ouvert */
      p = await T.open(b, url, { w, h, cfg: null, save: late }); await p.click("#mPlay"); await p.waitForTimeout(700); await T.calm(p);
      await p.evaluate(() => BL.ui.go("empire")); await p.waitForTimeout(400);
      const cards = await p.evaluate(() => [...document.querySelectorAll("#acts .card.act")].slice(5).map(c => ({ t: c.querySelector("h3, .nm, .an") ? c.querySelector("h3, .nm, .an").textContent : c.textContent.slice(0, 40), art: !!c.querySelector("svg"), buy: !!c.querySelector(".btn.buy") })));
      T.check(cards.length === 3 && cards.every(c => c.art && c.buy), w + " px : 3 nouvelles cartes avec illustration et bouton d'achat");
      T.check(await T.noHScroll(p), w + " px : Empire sans défilement horizontal");
      const sm = (await T.smallText(p, "#acts")).filter(x => !/SVG/.test(x));   /* lettres dessinées dans les illustrations (cartes à jouer…) : décor, pas du texte à lire */ T.check(!sm.length, w + " px : texte ≥ 12 px dans les activités " + sm.slice(0, 3).join(","));
      await p.evaluate(() => { const c = [...document.querySelectorAll("#acts .card.act")][5]; window.scrollTo(0, 0); c.scrollIntoView({ block: "start" }); window.scrollBy(0, -140); }); await p.waitForTimeout(300);
      await p.screenshot({ path: T.shotPath("p19-nouvelle-activite-" + w) });
      /* 3. Territoires : 11 quartiers, panneau de la Marina */
      await p.evaluate(() => BL.ui.go("terr")); await p.waitForTimeout(400);
      T.check(await p.evaluate(() => document.querySelectorAll("#map .dist").length) === 11, w + " px : 11 quartiers sur la carte Territoires");
      await p.click('#map .dist[data-id="marina"]'); await p.waitForTimeout(400);
      T.check(await p.evaluate(() => document.getElementById("dName").textContent) === "Marina des Brumes", w + " px : panneau de la Marina des Brumes");
      T.check(await T.noHScroll(p), w + " px : Territoires sans défilement horizontal");
      const sm2 = await T.smallText(p, "#dpanel"); T.check(!sm2.length, w + " px : texte ≥ 12 px dans le panneau du quartier " + sm2.slice(0, 3).join(","));
      await p.evaluate(() => { const m = document.getElementById("map"); window.scrollTo(0, 0); m.scrollIntoView({ block: "start" }); }); await p.waitForTimeout(250);
      await p.screenshot({ path: T.shotPath("p19-nouveau-quartier-" + w) });
      /* 4. carte de la ville : rendu mesuré, nouveau bâtiment (ponton) et menu Bâtiments */
      await p.evaluate(() => BL.ui.go("map")); await p.waitForTimeout(1500);
      const still = await frameCost(p, 2500);
      await p.evaluate(() => BL.mapUI.select({ type: "dlot", id: "marina#0", did: "marina", idx: 0 })); await p.waitForTimeout(400);
      const moving = await frameCost(p, 2500);
      perf.push([w, still, moving]);
      T.check(still.n > 10 && still.avg < 60, w + " px : carte immobile, " + still.n + " images, " + still.avg.toFixed(1) + " ms en moyenne (p95 " + still.p95.toFixed(1) + " ms)");
      T.check(moving.n > 10 && moving.avg < 60, w + " px : carte en déplacement vers la Marina, " + moving.n + " images, " + moving.avg.toFixed(1) + " ms en moyenne (p95 " + moving.p95.toFixed(1) + " ms)");
      await p.waitForTimeout(1200);
      const pan = await p.evaluate(() => { const m = document.getElementById("mapPanel"); return m && !m.hidden ? m.textContent : ""; });
      T.check(/Ponton de contrebande/.test(pan), w + " px : panneau du nouveau bâtiment (Ponton de contrebande)");
      T.check(await T.noHScroll(p), w + " px : carte sans défilement horizontal");
      const sm3 = await T.smallText(p, "#mapPanel"); T.check(!sm3.length, w + " px : texte ≥ 12 px dans le panneau " + sm3.slice(0, 3).join(","));
      await p.screenshot({ path: T.shotPath("p19-nouveau-batiment-" + w) });
      await p.evaluate(() => { BL.mapUI.select(null); BL.buildMenu.open(null, "bat"); }); await p.waitForTimeout(400);
      const menu = await p.evaluate(async () => { let txt = ""; for (const b of [...document.querySelectorAll("#bmenu .bm-tabs button")]) { b.click(); await new Promise(r => setTimeout(r, 120)); txt += document.querySelector("#bmenu .bm-list").textContent + "\n"; } return txt; });
      const want = ["Atelier de faux papiers", "Ponton de contrebande", "Bureau de change", "Hôtel de passage", "Caserne de vigiles", "Fret des Brumes", "Banque Aubépine", "Vigilance Sentinelle"];
      T.check(want.every(n => menu.indexOf(n) >= 0), w + " px : menu Bâtiments, les 5 nouveaux lieux et les 3 nouvelles activités présents" + (want.filter(n => menu.indexOf(n) < 0).length ? " (manque : " + want.filter(n => menu.indexOf(n) < 0).join(", ") + ")" : ""));
      T.check(!p.errors.length, w + " px : aucune erreur" + (p.errors.length ? " " + p.errors.join(" | ") : ""));
      T.check(!p.requests.length, w + " px : aucune requête extérieure (" + p.requests.length + ")");
      await p.context().close();
    }
    console.log("\nCoût de rendu de la carte (ms par image, moyenne / p95) :"); perf.forEach(([w, a, m]) => console.log("  " + w + " px : immobile " + a.avg.toFixed(1) + " / " + a.p95.toFixed(1) + " · déplacement " + m.avg.toFixed(1) + " / " + m.p95.toFixed(1)));
  } catch (e) { T.check(false, "exception : " + e.message); }
  await b.close(); srv.close(); T.done("endgame-browser");
})();
