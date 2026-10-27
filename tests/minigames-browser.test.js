/* Partie 17 · E : mini-jeux dans le navigateur — portes d'entrée réelles, 3 largeurs, clavier, « Résoudre automatiquement », retour à l'écran d'origine,
   mouvements réduits (crochetage pas à pas), texte ≥ 12 px, aucun défilement horizontal, aucune erreur console, captures. */
const T = require("./_browser");
const ST = { money: 1e9, total: 5e14, t: 90000, bl: { backroom: [40, 12], freight: [30], fence: [12] }, owned: { backroom: 40, freight: 30, fence: 12 }, crew: { m: { gino: { lv: 2, xp: 0, on: true }, rocco: { lv: 2, xp: 0, on: true }, maya: { lv: 1, xp: 0, on: true } }, v: 1 } };
async function playAuto(p) { await p.click('#mini [data-m="auto"]'); await p.waitForTimeout(150); const t = await p.$eval("#mini .mini-res", e => e.textContent); await p.click('#mini [data-m="done"]'); await p.waitForTimeout(150); return t; }
async function checkMini(p, w, name) {
  T.check(await p.evaluate(() => !document.getElementById("mini").hidden && document.querySelectorAll("#mini .mini-l").length === 2), w + " px · " + name + " : explication en 2 lignes");
  T.check(await T.noHScroll(p) && await p.evaluate(() => { const b = document.querySelector("#mini .mini-box"); return b.scrollWidth <= b.clientWidth + 1; }), w + " px · " + name + " : aucun défilement horizontal");
  const sm = await T.smallText(p, "#mini"); T.check(!sm.length, w + " px · " + name + " : texte ≥ 12 px " + sm.slice(0, 3).join(","));
}
(async () => {
  const { srv, url } = await T.serve(), b = await T.launch();
  try {
    for (const [w, h] of T.WIDTHS) {
      const p = await T.open(b, url, { w, h, cfg: null, save: T.saveEnv({ v: 14, state: ST }) });
      await p.click("#mPlay"); await p.waitForTimeout(600); await T.calm(p);
      /* 1. crochetage : porte d'entrée dans le braquage (avant l'exécution) */
      await p.evaluate(() => { const H = BL.ui.handlers; H.heistStart(); H.heistChoose("watch"); H.heistChoose("duo"); BL.heistUI.open(); }); await p.waitForTimeout(300);
      const lk = await p.$('[data-act="lockpick"]'); T.check(!!lk, w + " px · crochetage : bouton dans le braquage");
      if (lk) { await p.click('[data-act="lockpick"]'); await p.waitForTimeout(200); await checkMini(p, w, "crochetage");
        await p.click('#mini [data-m="start"]'); await p.waitForTimeout(200); await p.screenshot({ path: T.shotPath("p17-mini-crochetage-" + w) });
        await p.click('#mini [data-m="quit"]'); await p.waitForTimeout(150);
        T.check(await p.evaluate(() => document.getElementById("mini").hidden && BL.heistUI.isOpen() && !BL.main.state().mini.hlp), w + " px · crochetage abandonné : aucun effet, retour au braquage");
        await p.click('[data-act="lockpick"]'); await p.waitForTimeout(150); const txt = await playAuto(p);
        T.check(/\+4 points/.test(txt) && await p.evaluate(() => BL.heistUI.isOpen() && BL.main.state().mini.hlp.b === 0.04), w + " px · crochetage automatique : résultat moyen (+4 points), retour au braquage");
        T.check(await p.evaluate(() => !!document.querySelector(".mg-done")), w + " px · crochetage : bonus affiché dans le braquage"); }
      await p.evaluate(() => BL.heistUI.close());
      /* 2. plan du coup : porte d'entrée sur la fiche d'opération */
      await p.evaluate(() => BL.ui.go("ops")); await p.waitForTimeout(400);
      const pb = await p.$('#v_ops [data-a="mplan"]'); T.check(!!pb, w + " px · plan : bouton sur l'opération");
      if (pb) { await p.click('#v_ops [data-a="mplan"]'); await p.waitForTimeout(200); await checkMini(p, w, "plan"); await p.click('#mini [data-m="start"]'); await p.waitForTimeout(150);
        /* plan parfait joué AU CLAVIER : Tab jusqu'au bouton, Entrée */
        const ui = await p.evaluate(() => BL.minigames._ui().p), want = [];
        ui.phases.forEach((ph, i) => { const oi = ph.opts.findIndex(o => o.risk === Math.min(...ph.opts.map(q => q.risk))); want.push(`[data-m="opt"][data-i="${i}"][data-j="${oi}"]`, `[data-m="role"][data-i="${i}"][data-j="${ph.role}"]`); });
        for (const sel of want) { await p.focus("#mini " + sel); await p.keyboard.press("Enter"); await p.waitForTimeout(40); }
        const sum = await p.$eval("#mini .pl-sum", e => e.textContent); T.check(/chaleur après l’opération : −3/.test(sum), w + " px · plan : la chance et la chaleur affichées suivent les choix (" + sum.replace(/\s+/g, " ").slice(0, 80) + ")");
        await p.screenshot({ path: T.shotPath("p17-mini-plan-" + w) });
        await p.focus('#mini [data-m="ok"]'); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
        T.check(/100 %/.test(await p.$eval("#mini .mini-res", e => e.textContent)), w + " px · plan parfait au clavier : 100 %");
        await p.keyboard.press("Enter"); await p.waitForTimeout(200);
        T.check(await p.evaluate(() => document.getElementById("mini").hidden && !document.getElementById("v_ops").hidden && !!document.querySelector("#v_ops .opprep") && /\+10 points/.test(document.querySelector("#v_ops .opprep").textContent)), w + " px · plan : retour à l'opération, préparation affichée"); }
      /* 3. interrogatoire : porte d'entrée dans l'Histoire */
      await p.evaluate(() => BL.ui.go("saga")); await p.waitForTimeout(400);
      const ib = await p.$('#v_saga [data-int="indic"]'); T.check(!!ib, w + " px · interrogatoire : boutons dans l'Histoire");
      if (ib) { await p.click('#v_saga [data-int="indic"]'); await p.waitForTimeout(200); await checkMini(p, w, "interrogatoire"); await p.click('#mini [data-m="start"]'); await p.waitForTimeout(150);
        const pz = await p.evaluate(() => BL.minigames._ui().p);
        for (let k = 0; k < 4; k++) { const r = pz.rounds[k]; await p.click(`#mini [data-m="ask"][data-j="${r.good}"]`); await p.waitForTimeout(40); if (k === 1) await p.screenshot({ path: T.shotPath("p17-mini-interrogatoire-" + w) }); await p.click(`#mini [data-m="judge"][data-v="${r.lie ? "lie" : "true"}"]`); await p.waitForTimeout(40); }
        T.check(/100 %/.test(await p.$eval("#mini .mini-res", e => e.textContent)), w + " px · interrogatoire parfait : 100 %");
        await p.click('#mini [data-m="done"]'); await p.waitForTimeout(200);
        T.check(await p.evaluate(() => !document.getElementById("v_saga").hidden && document.querySelector('#v_saga [data-int="indic"]').disabled), w + " px · interrogatoire : retour à l'Histoire, délai d'une heure affiché"); }
      /* 4. comptabilité : porte d'entrée dans la Chaleur */
      await p.evaluate(() => BL.heatUI.open()); await p.waitForTimeout(300);
      const ab = await p.$("#hdA:not([disabled])"); T.check(!!ab, w + " px · comptabilité : bouton dans la Chaleur");
      if (ab) { await p.click("#hdA"); await p.waitForTimeout(200); await checkMini(p, w, "comptabilité"); await p.click('#mini [data-m="mode"][data-v="inc"]'); await p.click('#mini [data-m="start"]'); await p.waitForTimeout(150);
        await p.screenshot({ path: T.shotPath("p17-mini-comptabilite-" + w) });
        const bad = await p.evaluate(() => BL.minigames._ui().p.lines.map((l, i) => l.bad ? i : -1).filter(i => i >= 0));
        for (const i of bad) await p.click(`#mini [data-m="tog"][data-i="${i}"]`);
        await p.click('#mini [data-m="ok"]'); await p.waitForTimeout(150); T.check(/100 %/.test(await p.$eval("#mini .mini-res", e => e.textContent)), w + " px · comptabilité parfaite : 100 %");
        await p.click('#mini [data-m="done"]'); await p.waitForTimeout(200);
        T.check(await p.evaluate(() => BL.heatUI.isOpen() && document.getElementById("hdA").disabled && Math.abs(BL.minigames.incMul(BL.main.state()) - 1.06) < 1e-9), w + " px · comptabilité : revenus +6 % pendant 10 min, retour à la Chaleur"); }
      await p.evaluate(() => BL.heatUI.close());
      /* 5. contremaître : porte d'entrée sur la carte Chantiers */
      await p.evaluate(() => { BL.ui.handlers.buyActivity("backroom", 0); BL.ui.go("empire"); }); await p.waitForTimeout(400);
      const fb = await p.$("#v_empire .wk-fm:not([disabled])"); T.check(!!fb, w + " px · contremaître : bouton sur les chantiers");
      if (fb) { const l0 = await p.evaluate(() => BL.works.left(BL.main.state(), BL.main.state().works.q[0])); await p.click("#v_empire .wk-fm"); await p.waitForTimeout(200); await checkMini(p, w, "contremaître");
        await p.click('#mini [data-m="start"]'); await p.waitForTimeout(150); const fz = await p.evaluate(() => BL.minigames._ui().p);
        for (let i = 0; i < 3; i++) for (let k = 0; k < fz.tasks[i].need; k++) await p.click(`#mini [data-m="plus"][data-i="${i}"]`);
        await p.screenshot({ path: T.shotPath("p17-mini-contremaitre-" + w) });
        await p.click('#mini [data-m="ok"]'); await p.waitForTimeout(150); await p.click('#mini [data-m="done"]'); await p.waitForTimeout(200);
        const l1 = await p.evaluate(() => BL.works.left(BL.main.state(), BL.main.state().works.q[0]));
        T.check(l1 < l0 * 0.82 && l1 > l0 * 0.7, w + " px · contremaître parfait : −20 % du temps restant (" + Math.round(l0) + " → " + Math.round(l1) + " s)");
        T.check(await p.evaluate(() => !document.getElementById("v_empire").hidden && document.querySelector("#v_empire .wk-fm").disabled), w + " px · contremaître : retour aux chantiers, délai de récupération"); }
      T.check(!p.errors.length, w + " px : aucune erreur console " + p.errors.join(" | "));
      await p.context().close();
    }
    /* mouvements réduits : le crochetage se joue pas à pas au clavier (aucun déplacement animé) */
    const p = await T.open(b, url, { cfg: null, save: T.saveEnv({ v: 14, state: ST }), reduced: true, w: 390, h: 844 }); await p.click("#mPlay"); await p.waitForTimeout(500);
    await p.evaluate(() => BL.minigames.open("lockpick", { title: "Test", seed: 4242 }, sc => ({ text: "ok " + sc }))); await p.click('#mini [data-m="start"]'); await p.waitForTimeout(150);
    const u = await p.evaluate(() => BL.minigames._ui()); T.check(u.still, "mouvements réduits : crochetage pas à pas");
    const x0 = await p.$eval("#mini .lp-mark", e => e.style.left); await p.waitForTimeout(400); T.check(x0 === await p.$eval("#mini .lp-mark", e => e.style.left), "mouvements réduits : le repère ne bouge pas tout seul");
    for (const pin of u.p.pins) { let pos = 0.08; const steps = Math.round((pin.c - pos) / 0.04); for (let k = 0; k < steps; k++) await p.keyboard.press("ArrowRight"); await p.keyboard.press(" "); await p.waitForTimeout(30); }
    T.check(/100 %/.test(await p.$eval("#mini .mini-res", e => e.textContent)), "crochetage au clavier (flèches + Espace) : 100 %");
    await p.keyboard.press("Escape"); await p.waitForTimeout(100); T.check(await p.evaluate(() => document.getElementById("mini").hidden), "Échap ferme la fenêtre");
    T.check(!p.errors.length, "mouvements réduits : aucune erreur console " + p.errors.join(" | "));
    await p.context().close();
  } finally { await b.close(); srv.close(); }
  T.done("minigames-browser");
})();
