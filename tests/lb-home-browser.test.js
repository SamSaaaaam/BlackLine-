/* Partie 17 · A : classement visible dès l'accueil. Le serveur Supabase est SIMULÉ (aucune requête réelle). */
const T = require("./_browser");
const CFG = { url: "https://abcdefghijklmnop.supabase.co", anonKey: "sb_publishable_testtesttesttesttest" };
const ROWS = n => Array.from({ length: n }, (_, i) => ({ rank: i + 1, name: ["Lupo", "Vespa Nera", "Tito", "Marla", "Zed", "Ombre", "Ricco", "Nino", "Lola", "Sacha"][i], score: 1e12 / (i + 1), level: 60 - i, pub: "00000000-0000-0000-0000-00000000000" + i, id: "secret" }));
function mock(rows, counter) {
  return (r, url) => { counter.n++; counter.urls.push(url); counter.headers.push(r.request().headers()); counter.methods.push(r.request().method());
    if (rows === "fail") return r.abort(); return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(typeof rows === "function" ? rows(url) : rows) }); };
}
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    /* 1. non configuré : aucun panneau, aucune requête */
    let c = { n: 0, urls: [], headers: [], methods: [] }, p = await T.open(b, url, { cfg: null, sb: mock(ROWS(10), c) });
    T.check(!(await p.$("#menu .mlb")), "non configuré : panneau absent");
    T.check(!(await p.$("#mBoard")), "plus de bouton CLASSEMENT dans le menu");
    T.check(c.n === 0 && p.requests.length === 0, "non configuré : aucune requête réseau");
    await p.context().close();

    /* 2. réglage coupé : aucun panneau, aucune requête */
    c = { n: 0, urls: [], headers: [], methods: [] };
    p = await T.open(b, url, { cfg: CFG, sb: mock(ROWS(10), c), save: T.saveEnv({ settings: { setup: true, tutorial: "done", name: "T", lbhome: false } }) });
    T.check(!(await p.$("#menu .mlb")), "réglage « accueil » coupé : panneau absent");
    T.check(c.n === 0, "réglage coupé : aucune requête");
    /* réactivation depuis le réglage : le panneau apparaît sans recharger */
    await p.evaluate(() => BL.menu.openSheet("settings"));
    const cb = await p.$('input[data-set="lbhome"]'); T.check(!!cb && !(await cb.isChecked()), "le réglage apparaît dans Paramètres (décoché)");
    await p.evaluate(() => { document.querySelector('input[data-set="lbhome"]').click(); });
    await p.waitForTimeout(400); await p.evaluate(() => BL.menu.closeSheet());
    T.check(!!(await p.$("#menu .mlb")), "réglage réactivé : panneau affiché sans rechargement");
    await p.context().close();

    /* 3. configuré : un seul appel, GET, apikey seulement, pas d'Authorization, aucune donnée du joueur ; cache 60 s */
    for (const [w, h] of T.WIDTHS) {
      c = { n: 0, urls: [], headers: [], methods: [] };
      p = await T.open(b, url, { cfg: CFG, sb: mock(ROWS(10), c), w, h, wait: 900 });
      T.check(c.n === 1, w + " px : un seul appel au chargement du menu (" + c.n + ")");
      if (w === 1366) {
        T.check(/\/rest\/v1\/rpc\/lb_board_public\?p_scope=week$/.test(c.urls[0]), "URL publique en lecture seule : " + c.urls[0].replace(CFG.url, ""));
        T.check(c.methods[0] === "GET", "méthode GET (aucun corps envoyé)");
        const hd = c.headers[0]; T.check(hd.apikey === CFG.anonKey && !hd.authorization && !hd["content-type"], "en-tête apikey seulement");
        T.check(!c.urls.some(u => /auth\/v1/.test(u)), "aucune session anonyme créée");
        const n = await p.$$eval("#menu .mlb-row:not(.sk)", e => e.filter(x => getComputedStyle(x).display !== "none").length); T.check(n === 10, "ordinateur : 10 lignes visibles (" + n + ")");
        const h1 = await p.evaluate(() => { const a = document.querySelector("#menu .mnav").getBoundingClientRect(), b = document.querySelector("#menu .mlb").getBoundingClientRect(); return [Math.round(a.height), Math.round(b.height), b.left > a.right]; });
        T.check(h1[2] && h1[1] <= h1[0] + 1, "ordinateur : colonne à droite, pas plus haute que le menu (" + h1[1] + " ≤ " + h1[0] + ")");
        T.check(await p.$eval("#menu .mlb-row.p1 .mlb-crown", e => !!e).catch(() => false), "podium : couronne sur la 1re place");
        T.check((await p.$eval("#menu .mlb-row.p1 .mlb-rk", e => e.textContent)).startsWith("1"), "rang écrit en chiffres");
        const txt = await p.$eval("#menu .mlb", e => e.innerHTML); T.check(!/secret|0000-0000/.test(txt), "jamais d'identifiant affiché");
        /* changement d'onglet : un appel pour « tout temps », puis cache */
        await p.click('#menu .mlb-tab[data-sc="all"]'); await p.waitForTimeout(300);
        T.check(c.n === 2 && /p_scope=all/.test(c.urls[1]), "onglet « Tout temps » : un appel");
        await p.click('#menu .mlb-tab[data-sc="week"]'); await p.waitForTimeout(300); await p.click('#menu .mlb-tab[data-sc="all"]'); await p.waitForTimeout(300);
        T.check(c.n === 2, "retour aux onglets déjà chargés : cache (aucun appel)");
        await p.evaluate(() => BL.lbHome.tick()); await p.waitForTimeout(200); T.check(c.n === 2, "rafraîchissement avant 60 s : cache");
        /* menu masqué : plus aucun appel */
        await p.click("#mPlay"); await p.waitForTimeout(700); await p.evaluate(() => { BL.lb._resetPublic(); BL.lbHome.tick(); }); await p.waitForTimeout(200);
        T.check(c.n === 2, "menu masqué : aucun appel même cache expiré");
        await p.evaluate(() => BL.menu.show()); await p.waitForTimeout(400); T.check(c.n === 3, "menu réaffiché, cache expiré : un nouvel appel");
        /* lien « Voir tout » : ouvre la fenêtre complète */
        await p.click("#menu .mlb-more"); await p.waitForTimeout(300);
        T.check(await p.evaluate(() => !document.getElementById("sheet").hidden && /Classement/.test(document.querySelector("#sheetBox h2").textContent)), "« Voir tout » ouvre la fenêtre Classement");
        await p.evaluate(() => BL.menu.closeSheet());
        await p.screenshot({ path: T.shotPath("p17-menu-classement-1366") });
      } else {
        const n = await p.$$eval("#menu .mlb-row:not(.sk)", e => e.filter(x => getComputedStyle(x).display !== "none").length); T.check(n === 5, w + " px : Top 5 (" + n + ")");
        const jo = await p.evaluate(() => { const r = document.getElementById("mPlay").getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return r.top >= 0 && r.bottom <= innerHeight && !!e && !!e.closest("#mPlay"); });
        T.check(jo, w + "×" + h + " : JOUER visible sans défiler");
        const below = await p.evaluate(() => document.querySelector("#menu .mlb").getBoundingClientRect().top >= document.querySelector("#menu .mnav").getBoundingClientRect().bottom); T.check(below, w + " px : carte sous les boutons");
        await p.screenshot({ path: T.shotPath("p17-menu-classement-" + w) });
        await p.click("#menu .mlb-tog"); T.check(await p.$eval("#mlbBody", e => e.hidden), w + " px : carte repliable"); await p.click("#menu .mlb-tog");
        T.check(!(await p.$eval("#mlbBody", e => e.hidden)), w + " px : carte rouverte");
      }
      T.check(await T.noHScroll(p), w + " px : aucun défilement horizontal");
      const sm = await T.smallText(p, "#menu .mlb"); T.check(!sm.length, w + " px : texte ≥ 12 px " + sm.join(","));
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
    /* JOUER à 320 × 568 sans classement non plus */
    p = await T.open(b, url, { cfg: null, w: 320, h: 568 });
    T.check(await p.evaluate(() => { const r = document.getElementById("mPlay").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), "320×568 sans classement : JOUER visible");
    await p.context().close();

    /* 4. panne réseau : message calme, menu utilisable */
    c = { n: 0, urls: [], headers: [], methods: [] };
    p = await T.open(b, url, { cfg: CFG, sb: mock("fail", c), wait: 900 });
    T.check(/Classement indisponible pour l’instant/.test(await p.$eval("#menu .mlb", e => e.textContent)), "panne : « Classement indisponible pour l’instant »");
    await p.click("#mPlay"); await p.waitForTimeout(700); T.check(await p.evaluate(() => !BL.menu.visible()), "panne : JOUER fonctionne");
    T.check(!p.errors.length, "panne : aucune erreur console " + p.errors.join(" | "));
    await p.context().close();
    /* réponse inattendue (500, JSON non tableau) */
    p = await T.open(b, url, { cfg: CFG, sb: (r) => r.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' }), wait: 900 });
    T.check(/indisponible/.test(await p.$eval("#menu .mlb", e => e.textContent)), "erreur 500 : repli silencieux");
    await p.context().close();

    /* 5. classement vide */
    p = await T.open(b, url, { cfg: CFG, sb: mock([], { n: 0, urls: [], headers: [], methods: [] }), wait: 900 });
    T.check(/Aucun joueur pour l’instant — sois le premier/.test(await p.$eval("#menu .mlb", e => e.textContent)), "vide : « Aucun joueur pour l’instant — sois le premier »");
    await p.context().close();

    /* 6. pseudo hostile renvoyé par le serveur */
    const evil = [{ rank: 1, name: '<img src=x onerror="window.__pwn=1">Boss', score: "1e999", level: 9999 }, { rank: "2", name: 42, score: -5, level: -3 }, { rank: 0, name: "Zero", score: 1, level: 1 }, { rank: 3, name: "a".repeat(200), score: NaN, level: null }];
    p = await T.open(b, url, { cfg: CFG, sb: mock(evil, { n: 0, urls: [], headers: [], methods: [] }), wait: 900 });
    const html = await p.$eval("#menu .mlb-rows", e => e.innerHTML), names = await p.$$eval("#menu .mlb-nm b", e => e.map(x => x.textContent));
    T.check(!/<img/i.test(html) && !(await p.evaluate(() => window.__pwn)), "pseudo hostile : aucune balise interprétée");
    T.check(names[0] === "imgsrcxonerrorwindowpwn1Boss".slice(0, 16) || names[0].length <= 16, "pseudo hostile : nettoyé et tronqué (" + names[0] + ")");
    T.check(names.length === 3 && names[1] === "Joueur", "ligne sans pseudo valide → « Joueur », rang 0 ignoré");
    T.check(/Niv\. 100/.test(await p.$eval("#menu .mlb-rows", e => e.textContent)), "niveau borné à 100");
    T.check(!p.errors.length, "pseudo hostile : aucune erreur console " + p.errors.join(" | "));
    await p.context().close();
  } finally { await b.close(); srv.close(); }
  T.done("lb-home-browser");
})();
