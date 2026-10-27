/* Classement en ligne (facultatif) : client réseau. UNIQUE endroit du jeu qui parle à Internet : envoi du score seulement si le joueur a activé le classement ;
   lecture publique du top 10 à l'affichage du menu (Partie 17, coupable dans Paramètres › Classement en ligne).
   fetch direct vers l'API Supabase (aucune bibliothèque externe). Session anonyme gardée à part (jamais dans la sauvegarde ni dans l'export). */
(function (root) {
  var BL = root.BL = root.BL || {}, K = "blackline.lb.session.v1", TIMEOUT = 8000, EVERY = 300000;
  var st = { busy: 0, err: "", lastSubmit: 0, lastOk: 0, fails: 0, nextTry: 0, lost: false, myPub: "" }, timer = null;
  function core() { return BL.lbCore; }
  function cfg() { var c = BL.lbConfig || {}; return { url: typeof c.url === "string" ? c.url.trim().replace(/\/+$/, "") : "", key: typeof c.anonKey === "string" ? c.anonKey.trim() : "" }; }
  function configured() { var c = cfg(); return /^https:\/\/[a-z0-9-]{3,64}\.supabase\.co$/i.test(c.url) && c.key.length >= 20 && c.key.length < 4096; }
  function settings() { return BL.main && BL.main.settings ? BL.main.settings() : {}; }
  var OPT = "blackline.lb.optin.v1", memOpt = false;
  function optedIn() { var s = ls(); try { if (s && s.getItem(OPT) === "1") return true; } catch (e) {} return memOpt; }
  function setOpt(on) { memOpt = !!on; var s = ls(); try { if (s) { if (on) s.setItem(OPT, "1"); else s.removeItem(OPT); } } catch (e) {} }
  /* « activé » = réglage activé ET accord donné sur CET appareil (un réglage importé d'un autre appareil n'envoie rien tant que le joueur n'a pas choisi son pseudo ici) */
  function enabled() { return configured() && settings().lbon === true && optedIn(); }
  function ls() { try { return root.localStorage; } catch (e) { return null; } }
  function loadS() { var s = ls(); if (!s) return null; try { var o = JSON.parse(s.getItem(K) || "null"); if (o && typeof o.a === "string" && typeof o.r === "string" && typeof o.e === "number" && isFinite(o.e)) return o; } catch (e) {} return null; }
  function saveS(o) { var s = ls(); if (!s) return; try { if (o) s.setItem(K, JSON.stringify(o)); else s.removeItem(K); } catch (e) {} }
  var mem = null;   /* si localStorage est indisponible, la session vit en mémoire (elle sera perdue au rechargement) */
  function getS() { return loadS() || mem; }
  function putS(o) { mem = o; saveS(o); }
  function http(path, opt) {
    var c = cfg(), ctl = typeof AbortController !== "undefined" ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT), get = opt.method === "GET", h = get ? { apikey: c.key } : { apikey: c.key, "Content-Type": "application/json" };
    if (opt.token) h.Authorization = "Bearer " + opt.token;   /* sans session : seulement la clé publique dans « apikey » */
    var init = { method: get ? "GET" : "POST", headers: h, signal: ctl ? ctl.signal : undefined, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" }; if (!get) init.body = JSON.stringify(opt.body || {});
    return root.fetch(c.url + path, init).then(function (r) {
      clearTimeout(to); return r.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {} return { ok: r.ok, status: r.status, data: d }; });
    }, function () { clearTimeout(to); var e = new Error("net"); e.code = "net"; throw e; });
  }
  function fromAuth(d) { if (!d || typeof d.access_token !== "string" || typeof d.refresh_token !== "string") return null; var life = +d.expires_in; if (!isFinite(life) || life <= 0) life = 3600; return { a: d.access_token, r: d.refresh_token, e: Date.now() + Math.min(life, 86400) * 1000 }; }
  function signup() { return http("/auth/v1/signup", { body: {} }).then(function (r) { var s = r.ok ? fromAuth(r.data) : null; if (!s) { var e = new Error("auth"); e.code = r.status === 422 || r.status === 400 || r.status === 403 ? "anon_off" : "auth"; throw e; } putS(s); return s; }); }
  function session() {
    var s = getS(); if (s && s.e - Date.now() > 60000) return Promise.resolve(s);
    if (!s) return signup();
    return http("/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: s.r } }).then(function (r) { var n = r.ok ? fromAuth(r.data) : null; if (n) { putS(n); return n; } if (r.status >= 400 && r.status < 500) { putS(null); st.lost = true; return signup(); } var e = new Error("auth"); e.code = "auth"; throw e; });
  }
  function rpc(name, args) {
    return session().then(function (s) { return http("/rest/v1/rpc/" + name, { token: s.a, body: args || {} }); }).then(function (r) {
      if (r.ok) return r.data; var m = r.data && typeof r.data.message === "string" ? r.data.message : ""; var e = new Error(m || "server"); e.code = /^(name_[a-z]+|no_player|no_auth|rate_limited|rename_rate|implausible|bad_value)$/.test(m) ? m : (r.status === 401 || r.status === 403 ? "auth" : "server"); throw e;
    });
  }
  function track(p) { st.busy++; return p.then(function (v) { st.busy--; return v; }, function (e) { st.busy--; throw e; }); }
  function level() { var s = BL.main && BL.main.state ? BL.main.state() : null; try { return s && BL.economy ? BL.economy.level(s) : 1; } catch (e) { return 1; } }
  function setSetting(k, v) { if (BL.main && BL.main.setSetting) BL.main.setSetting(k, v); }

  function register(raw) {
    var c = core().checkName(raw); if (!c.ok) { var e = new Error(c.error); e.code = "name_" + c.error; return Promise.reject(e); }
    return track(rpc("lb_register", { p_name: c.name }).then(function (pub) { st.myPub = typeof pub === "string" ? pub : ""; st.lost = false; setOpt(true); setSetting("lbname", c.name); setSetting("lbon", true); st.nextTry = 0; return c.name; }));
  }
  function rename(raw) {
    var c = core().checkName(raw); if (!c.ok) { var e = new Error(c.error); e.code = "name_" + c.error; return Promise.reject(e); }
    return track(rpc("lb_set_name", { p_name: c.name }).then(function () { setSetting("lbname", c.name); return c.name; }));
  }
  function submit(force) {
    if (!enabled()) return Promise.resolve(false); var now = Date.now(); if (!force && now < st.nextTry) return Promise.resolve(false); if (now - st.lastSubmit < 60000) return Promise.resolve(false);
    var s = BL.main && BL.main.state ? BL.main.state() : null; if (!s) return Promise.resolve(false); var p = core().payload(s, level()); st.lastSubmit = now;
    return track(rpc("lb_submit", { p_total: p.total, p_level: p.level, p_version: "v" + (BL.save && BL.save.VERSION || 0) }).then(function () { st.fails = 0; st.err = ""; st.lastOk = Date.now(); return true; }, function (e) {
      if (e.code === "no_player") { st.lost = true; st.err = e.code; return false; }
      st.err = e.code || "net"; st.fails++; st.nextTry = Date.now() + Math.min(1800000, 60000 * Math.pow(2, Math.min(st.fails, 5))); return false;
    }));
  }
  function board(cat) {
    if (!enabled()) return Promise.resolve([]); return track(rpc("lb_board", { p_cat: cat === "week" ? "week" : "all" }).then(function (rows) { st.err = ""; return (Array.isArray(rows) ? rows : []).slice(0, 60).map(core().cleanRow); }));
  }
  function report(pub) { return track(rpc("lb_report", { p_pub: pub })); }
  function deleteMe() {
    return track(rpc("lb_delete_me", {}).then(function () { putS(null); mem = null; setOpt(false); st.lost = false; st.myPub = ""; setSetting("lbon", false); setSetting("lbname", ""); return true; }));
  }
  /* Partie 17 · A : lecture PUBLIQUE du top 10 pour l'écran d'accueil. Aucun compte, aucune session anonyme créée, aucune donnée du joueur envoyée :
     une requête GET avec la seule clé publique (en-tête « apikey »). Résultat gardé en mémoire 60 s par onglet ; toute panne renvoie { ok:false } sans erreur. */
  var pub = { week: null, all: null }, pubBusy = {}, PUB_TTL = 60000;
  function publicBoard(scope) {
    var sc = scope === "week" ? "week" : "all", c = pub[sc], now = Date.now();
    if (!configured()) return Promise.resolve({ ok: false, rows: [], off: true });
    if (c && now - c.at >= 0 && now - c.at < PUB_TTL) return Promise.resolve({ ok: c.ok, rows: c.rows, cached: true });
    if (pubBusy[sc]) return pubBusy[sc];
    return (pubBusy[sc] = http("/rest/v1/rpc/lb_board_public?p_scope=" + sc, { method: "GET" }).then(function (r) {
      var ok = !!(r.ok && Array.isArray(r.data)), rows = ok ? r.data.slice(0, 10).map(cleanPublic).filter(function (x) { return x.rank >= 1; }) : [];
      pub[sc] = { at: Date.now(), ok: ok, rows: rows }; pubBusy[sc] = null; return { ok: ok, rows: rows };
    }, function () { pub[sc] = { at: Date.now(), ok: false, rows: [] }; pubBusy[sc] = null; return { ok: false, rows: [] }; }));
  }
  /* ligne publique : jamais d'identifiant, pseudo nettoyé (même règle que le pseudo local), nombres bornés */
  function cleanPublic(r) { var x = core().cleanRow(r); return { rank: x.rank, name: x.name, score: x.score, level: x.level }; }
  /* envoi régulier : seulement si activé, onglet visible, et pas pendant un délai d'attente après une panne */
  function tick() { if (!enabled() || (root.document && root.document.hidden)) return; if (Date.now() - st.lastSubmit >= EVERY) submit(false); }
  function init() { if (timer || !configured()) return; timer = setInterval(tick, 60000); }
  BL.lb = { configured: configured, enabled: enabled, publicBoard: publicBoard, _resetPublic: function () { pub = { week: null, all: null }; pubBusy = {}; }, register: register, rename: rename, submit: submit, board: board, report: report, deleteMe: deleteMe, tick: tick, init: init, hasName: function () { return !!settings().lbname; }, state: function () { return { busy: st.busy, err: st.err, lost: st.lost || (configured() && settings().lbon === true && !optedIn()), lastOk: st.lastOk, fails: st.fails }; }, MSG: { net: "Classement indisponible pour le moment. Le jeu continue normalement.", server: "Le serveur du classement ne répond pas comme prévu. Réessaie plus tard.", auth: "Connexion au classement impossible pour le moment.", anon_off: "Le classement n’est pas encore prêt côté serveur (connexions anonymes désactivées).", no_player: "Ton profil de classement est introuvable. Choisis ton pseudo à nouveau.", rate_limited: "Doucement : réessaie dans une minute.", rename_rate: "Tu as déjà changé de pseudo il y a moins de 24 h.", implausible: "Ce score n’a pas été accepté (trop gros pour le temps écoulé).", bad_value: "Valeur refusée par le serveur." } };
  if (typeof module !== "undefined" && module.exports) module.exports = BL.lb;
})(typeof globalThis !== "undefined" ? globalThis : this);
