/* Partie 17 · A : lecture publique du top 10 (js/leaderboard.js), sans navigateur ni réseau : fetch est simulé. */
const { load, check, done } = require("./_load");
(async () => {
  const calls = []; let mode = "ok";
  const fetch = (url, init) => { calls.push({ url, init }); if (mode === "net") return Promise.reject(new Error("offline"));
    const body = mode === "500" ? '{"message":"x"}' : mode === "obj" ? '{"a":1}' : JSON.stringify([{ rank: 1, name: "Lupo<b>", score: 5, level: 3, pub: "11111111-1111-1111-1111-111111111111", id: "x" }]);
    return Promise.resolve({ ok: mode !== "500", status: mode === "500" ? 500 : 200, text: () => Promise.resolve(body) }); };
  const { BL, clock } = load({ fetch });
  BL.lbConfig = { url: "", anonKey: "" };
  let r = await BL.lb.publicBoard("week"); check(!r.ok && calls.length === 0, "non configuré : aucun appel");
  BL.lbConfig = { url: "https://abcdefghijklmnop.supabase.co", anonKey: "sb_publishable_xxxxxxxxxxxxxxxxxxxx" };
  r = await BL.lb.publicBoard("week"); check(r.ok && calls.length === 1, "premier appel");
  const c0 = calls[0]; check(c0.init.method === "GET" && !c0.init.body, "GET sans corps");
  check(JSON.stringify(Object.keys(c0.init.headers)) === '["apikey"]', "en-tête apikey seulement");
  check(c0.init.credentials === "omit" && c0.init.referrerPolicy === "no-referrer", "credentials omit, sans référent");
  check(c0.url === "https://abcdefghijklmnop.supabase.co/rest/v1/rpc/lb_board_public?p_scope=week", "URL de la fonction publique");
  check(r.rows.length === 1 && r.rows[0].name === "Lupob" && !("pub" in r.rows[0]) && !("id" in r.rows[0]), "ligne nettoyée, sans identifiant");
  r = await BL.lb.publicBoard("week"); check(r.cached && calls.length === 1, "deuxième appel immédiat : cache");
  clock.now += 59000; await BL.lb.publicBoard("week"); check(calls.length === 1, "59 s plus tard : cache");
  clock.now += 2000; await BL.lb.publicBoard("week"); check(calls.length === 2, "61 s plus tard : nouvel appel");
  await BL.lb.publicBoard("bizarre"); check(calls.length === 3 && /p_scope=all$/.test(calls[2].url), "période inconnue → « all »");
  /* appels simultanés : un seul fetch */
  clock.now += 61000; const a = BL.lb.publicBoard("all"), b = BL.lb.publicBoard("all"); await Promise.all([a, b]); check(calls.length === 4, "deux demandes simultanées : un seul appel");
  /* pannes : repli silencieux, pas d'exception, cache de la panne 60 s (pas de rafale) */
  for (const m of ["net", "500", "obj"]) { mode = m; clock.now += 61000; let threw = false; try { r = await BL.lb.publicBoard("week"); } catch (e) { threw = true; } check(!threw && r.ok === false && r.rows.length === 0, "panne « " + m + " » : { ok:false } sans exception"); }
  const n = calls.length; await BL.lb.publicBoard("week"); check(calls.length === n, "après une panne : pas de nouvel essai avant 60 s");
  /* horloge qui recule : on redemande (pas de cache « éternel ») */
  mode = "ok"; clock.now -= 3600e3; await BL.lb.publicBoard("week"); check(calls.length === n + 1, "horloge reculée : cache ignoré");
  /* aucune session anonyme, aucune donnée de partie */
  check(!calls.some(c => /auth\/v1|lb_submit|lb_register/.test(c.url)), "aucune connexion anonyme ni envoi de score");
  /* réglage lbhome : valeurs hostiles → défaut (oui) */
  const S = BL.save; [undefined, null, "false", 0, 1, {}, []].forEach(v => check(S.sanitizeSettings({ lbhome: v }).lbhome === true, "lbhome hostile " + JSON.stringify(v) + " → true"));
  check(S.sanitizeSettings({ lbhome: false }).lbhome === false, "lbhome false conservé");
  check(S.sanitizeSettings(null).lbhome === true && S.defaultSettings().lbhome === true, "défaut : affiché");
  check(S.VERSION >= 13, "version de sauvegarde inchangée par le réglage");
  done("lb-public");
})();
