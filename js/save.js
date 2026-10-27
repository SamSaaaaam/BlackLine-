/* Sauvegarde : enveloppe versionnée {v, savedAt, rev, owner, settings, state}, migration, copie de secours,
   détection de corruption, protection contre plusieurs onglets, export / import. Tout accès au stockage est protégé par try/catch. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var VERSION = 13, BAK_EVERY = 120000, me = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  var myRev = 0, lastBak = 0, frozen = false, lastError = "", info = { status: "new", storage: true };

  function num(v, d, max) { return typeof v === "number" && isFinite(v) && v >= 0 ? Math.min(v, max || 1e300) : d; }
  function key() { return BL.data.saveKey; }
  function store() { try { return root.localStorage || null; } catch (e) { return null; } }
  function get(k) { try { var st = store(); return st ? st.getItem(k) : null; } catch (e) { return null; } }
  function put(k, v) { try { var st = store(); if (!st) return false; st.setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { try { var st = store(); if (st) st.removeItem(k); } catch (e) {} }

  /* ---------- Paramètres ---------- */
  function defaultSettings() { return { toasts: true, motion: true, large: false, sound: true, music: 0.6, sfx: 0.7, ambient: true, ambmode: "live", lbon: false, lbname: "", lbhome: true, amb: 0.5, fx: "full", numbers: "short", tips: true, name: "", notif: "full", avatar: "fedora", setup: false, radio: "mix", tutorial: "todo", tstep: 0, assistant: "on", wall: "all", boxspeed: "normal", opscene: "ask", exportAt: 0 }; }
  function sanitizeSettings(r) {
    var d = defaultSettings(); if (!r || typeof r !== "object") return d;
    ["toasts", "motion", "large", "sound", "tips", "ambient", "lbon", "lbhome"].forEach(function (k) { if (typeof r[k] === "boolean") d[k] = r[k]; });
    ["music", "sfx", "amb"].forEach(function (k) { if (typeof r[k] === "number" && isFinite(r[k])) d[k] = Math.max(0, Math.min(1, r[k])); });
    if (r.fx === "full" || r.fx === "low") d.fx = r.fx; if (r.numbers === "short" || r.numbers === "detailed") d.numbers = r.numbers;
    if (r.notif === "full" || r.notif === "quiet" || r.notif === "off") d.notif = r.notif; if (typeof r.avatar === "string" && BL.avatars && BL.avatars.has(r.avatar)) d.avatar = r.avatar; if (typeof r.setup === "boolean") d.setup = r.setup; if (typeof r.radio === "string" && BL.radio && BL.radio.valid(r.radio)) d.radio = r.radio;
    /* didacticiel : une sauvegarde sans ce réglage vient d'une partie existante, donc déjà commencée : jamais de didacticiel forcé */
    d.tutorial = r.tutorial === "todo" || r.tutorial === "done" || r.tutorial === "skipped" ? r.tutorial : "done";
    d.tstep = typeof r.tstep === "number" && isFinite(r.tstep) ? Math.max(0, Math.min(7, Math.floor(r.tstep))) : 0;
    if (r.boxspeed === "normal" || r.boxspeed === "fast") d.boxspeed = r.boxspeed; if (r.ambmode === "live" || r.ambmode === "calm" || r.ambmode === "off") d.ambmode = r.ambmode; if (r.opscene === "full" || r.opscene === "ask" || r.opscene === "off") d.opscene = r.opscene;
    if (r.wall === "all" || r.wall === "home" || r.wall === "hq" || r.wall === "off") d.wall = r.wall;
    if (r.assistant === "on" || r.assistant === "quiet" || r.assistant === "off") d.assistant = r.assistant;
    d.exportAt = typeof r.exportAt === "number" && isFinite(r.exportAt) ? Math.max(0, Math.min(8.64e15, Math.floor(r.exportAt))) : 0;   /* Partie 13 : dernier export (rappel régulier) */
    if (typeof r.lbname === "string") d.lbname = r.lbname.normalize("NFKC").replace(/[^A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF0-9 _-]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
    if (d.lbon && !d.lbname) d.lbon = false;   /* classement activé sans pseudo : impossible */
    if (typeof r.name === "string") d.name = r.name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 20);
    return d;
  }

  /* ---------- Validation de l'état ---------- */
  function sanitize(raw, now) {
    var D = BL.data, s = BL.economy.newState(now), r = raw && typeof raw === "object" ? raw.state : null;
    if (!r || typeof r !== "object" || Array.isArray(r)) return s;
    s.money = num(r.money, s.money); s.total = Math.max(s.money, num(r.total, s.money));
    D.activities.forEach(function (a) { var n = r.owned && r.owned[a.id]; s.owned[a.id] = Math.floor(num(n, 0, a.maxLevel)); });
    D.upgrades.forEach(function (u) { s.upg[u.id] = !!(r.upg && r.upg[u.id] === true); });
    D.missions.forEach(function (m) { if (r.claimed && r.claimed[m.id] === true) s.claimed[m.id] = true; });
    D.achievements.forEach(function (a) { if (r.ach && r.ach[a.id] === true) s.ach[a.id] = true; });
    if (r.bonus && typeof r.bonus === "object") { s.bonus.rep = Math.floor(num(r.bonus.rep, 0, 1e6)); s.bonus.infl = Math.floor(num(r.bonus.infl, 0, 1e6)); }
    if (r.st && typeof r.st === "object") ["earned", "spent", "upkeep", "rewards"].forEach(function (k) { s.st[k] = num(r.st[k], 0); });
    s.t = num(r.t, 0); s.nextEvent = num(r.nextEvent, s.t + 60);
    /* bâtiments (v5) : un niveau par bâtiment, 1 à 4 bâtiments par activité. Sauvegarde plus ancienne (pas de champ bl) : les niveaux sont reconstruits
       depuis l'ancien niveau d'activité N et le nombre de bâtiments (champ bld, ou terrains construits aux niveaux 1, 7, 14, 21), avec une formule qui ne baisse jamais les revenus. */
    var E = BL.economy; s.bl = {};
    D.activities.forEach(function (a) {
      var legacyN = s.owned[a.id] || 0, arr = null, rb = r.bl && typeof r.bl === "object" && !Array.isArray(r.bl) ? r.bl[a.id] : null;
      if (Array.isArray(rb)) {
        arr = rb.slice(0, E.BLD_NEED.length).map(function (x) { return Math.floor(num(x, 0, a.maxLevel)); }).filter(function (x) { return x >= 1; });
        if (!arr.length && legacyN >= 1) arr = [legacyN];
        var mx = Math.max.apply(null, arr.length ? arr : [0]); arr.length = Math.min(arr.length, E.BLD_NEED.filter(function (t) { return mx >= t; }).length);   /* pas plus de bâtiments que le meilleur niveau ne l'autorise */
      } else if (r.bl && typeof r.bl === "object" && !Array.isArray(r.bl)) { if (legacyN >= 1) arr = [legacyN]; }
      else if (legacyN >= 1) {
        var k = r.bld && typeof r.bld === "object" ? Math.floor(num(r.bld[a.id], 1, 4)) : [1, 7, 14, 21].filter(function (t) { return legacyN >= t; }).length;
        k = Math.max(1, Math.min(k, E.BLD_NEED.filter(function (t) { return legacyN >= t; }).length)); arr = E.legacyLevels(a, legacyN, k);
      }
      if (arr && arr.length) E.setLevels(s, a.id, arr); else s.owned[a.id] = 0;
    });
    if (BL.territory) BL.territory.sanitize(r, s);
    if (BL.crew) BL.crew.sanitize(r, s);
    if (BL.equip) BL.equip.sanitize(r, s);          /* équipement : après l'équipe (les objets ne se portent que par un équipier possédé) */
    if (BL.factions) BL.factions.sanitize(r, s);
    if (BL.gold) BL.gold.sanitize(r, s);
    if (BL.hq) BL.hq.sanitize(r, s);
    if (BL.shop) BL.shop.sanitize(r, s);
    if (BL.walls) BL.walls.sanitize(r, s);          /* décors de ville : fonds d'écran achetés en lingots */
    if (BL.boxes) BL.boxes.sanitize(r, s);          /* boxs : après l'équipement (les objets tirés existent) */
    if (BL.state10) BL.state10.sanitize(r, s);      /* v10 : historique des box, quartiers construits, casino, chaleur, rivalités, récit, notifications vues */
    if (BL.dbuild) BL.dbuild.clean(s);          /* constructions de quartier : types inconnus, quartiers non contrôlés, emplacements */
    if (typeof r.pending === "string") {
      var ev = BL.economy.find(D.events, r.pending);
      if (ev) {
        s.pending = ev.id;
        if ((ev.terr || ev.fac) && !s.pendingFac) s.pendingFac = D.territory.factions[0].id;       /* événement de faction sans faction : on en désigne une */
        if (ev.crew && !s.pendingCrew) { var cm = BL.crew && BL.crew.pick(s, function () { return 0; }); if (cm) s.pendingCrew = cm.id; else { s.pending = null; s.pendingFac = null; } }
      }
    }
    if (!s.pending) { s.pendingFac = null; s.pendingCrew = null; }
    if (r.boost && typeof r.boost === "object" && isFinite(r.boost.mult) && r.boost.mult > 0 && isFinite(r.boost.until)) s.boost = { id: typeof r.boost.id === "string" && r.boost.id.length < 24 && /^[a-z0-9_]+$/.test(r.boost.id) ? r.boost.id : undefined, mult: Math.min(r.boost.mult, 10), until: r.boost.until };
    /* date de dernière sauvegarde : jamais dans le futur (horloge modifiée) */
    var sv = num(raw.savedAt, now); s.saved = Math.min(sv, now);
    if (Array.isArray(r.log)) s.log = r.log.filter(function (x) { return typeof x === "string"; }).map(function (x) { return x.slice(0, 300); }).slice(0, 20);
    return s;
  }

  /* ---------- Migration des enveloppes ----------
     v1 : { v:1, savedAt, state }                                  (versions précédentes du jeu)
     v2 : { v:2, savedAt, rev, owner, settings, state }
     Chaque étape reçoit l'enveloppe de la version n et renvoie celle de n+1. */
  var MIGRATIONS = {
    1: function (e) { e.v = 2; e.rev = 0; e.owner = ""; e.settings = defaultSettings(); e.settings.tutorial = "done"; return e; },
    2: function (e) { e.v = 3; return e; },                                   /* v3 : lingots, coffre, QG, boutique : champs ajoutés avec valeurs par défaut, rien n'est supprimé */
    3: function (e) { e.v = 4; return e; },                                  /* v4 : plusieurs bâtiments par activité (champ bld) */
    4: function (e) { e.v = 5; return e; },                                   /* v5 : un niveau par bâtiment (champ bl) : reconstruit dans sanitize depuis owned + bld, sans jamais baisser les revenus */
    5: function (e) { e.v = 6; return e; },                                  /* v6 : équipement, Arsenal, opérations (champ eq) : ajouté avec valeurs par défaut, rien n'est supprimé */
    6: function (e) { e.v = 7; return e; },                                   /* v7 : finitions cosmétiques (eq.fin) et opérations de convois/raids : champs ajoutés avec valeurs par défaut par sanitize, rien n'est supprimé */
    7: function (e) { e.v = 8; return e; },
    8: function (e) { e.v = 9; return e; },
    9: function (e) { e.v = 10; return e; },
    11: function (e) { e.v = 12; return e; },
    12: function (e) { e.v = 13; return e; },   /* v13 (Partie 15) : s.razed (parcs / places démolis) ajouté, liste vide par défaut via sanitize */
   /* v12 (Partie 13) : s.saga ajouté avec valeurs par défaut par sanitize */   /* v10 : boxHist, districts, casino, heat, rivals, story, notifSeen ajoutés avec valeurs par défaut par sanitize ; niveaux jusqu'à 100 (les niveaux existants ne bougent pas) ; prix du lingot fixe (goldLife.bought conservé comme simple statistique) */
    10: function (e) { e.v = 11; return e; }   /* v11 (Partie 12) : style du QG (hq.style, hq.styles) ajouté avec la valeur par défaut « classic » par sanitize ; rien n'est supprimé */
                                    /* v9 : historique des comptes rendus d'opération (s.eq.hist, comptes rendus « vus ») ; l'ancien dernier compte rendu y est recopié par sanitize. Rien n'est supprimé */                                   /* v8 : rareté Mythique, boxs (s.boxes : pitié, historique), marque b sur les objets de box, décors de ville (s.walls) et réglage settings.wall : champs ajoutés avec valeurs par défaut par sanitize, rien n'est supprimé */
  };
  function migrate(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    if (!raw.state || typeof raw.state !== "object" || Array.isArray(raw.state)) return null;
    var e = { v: typeof raw.v === "number" && raw.v >= 1 ? Math.floor(raw.v) : 1, savedAt: raw.savedAt, rev: raw.rev, owner: raw.owner, settings: raw.settings, state: raw.state };
    if (e.v > VERSION) { e.newer = true; return e; }
    while (e.v < VERSION) { var f = MIGRATIONS[e.v]; if (!f) return null; e = f(e); }
    return e;
  }
  function parse(text) { if (typeof text !== "string" || !text) return null; try { return migrate(JSON.parse(text)); } catch (e) { return null; } }

  /* ---------- Chargement ----------
     Ordre : sauvegarde principale, puis copie de secours, sinon nouvelle partie. Une sauvegarde illisible est conservée à part. */
  function loadFull(now) {
    var st = store(), res = { state: null, settings: defaultSettings(), status: "new", storage: !!st, savedAt: 0 };
    if (!st) { res.state = BL.economy.newState(now); info = res; return res; }
    var txt = get(key()), env = parse(txt);
    if (txt && !env) {
      put(key() + ".corrupt", txt);
      var bak = parse(get(key() + ".bak"));
      if (bak) { env = bak; res.status = "restored"; } else res.status = "corrupt";
    } else if (env) { res.status = env.newer ? "newer" : "ok"; if (env.newer) put(key() + ".corrupt", txt); }
    if (env) { res.state = sanitize(env, now); res.settings = sanitizeSettings(env.settings); if (!env.settings || typeof env.settings !== "object") res.settings.tutorial = "done";   /* sauvegarde existante sans réglages : pas de didacticiel */ res.savedAt = res.state.saved; myRev = num(env.rev, 0, 1e12); }
    else res.state = BL.economy.newState(now);
    frozen = false; lastError = ""; info = res; return res;
  }
  function load(now) { return loadFull(now).state; }

  /* ---------- Écriture ----------
     Une écriture n'a lieu que si aucun autre onglet n'a écrit depuis notre chargement (sinon on figerait / écraserait sa progression). */
  function other() {
    var e = parse(get(key())); if (!e) return false;
    return e.owner !== me && num(e.rev, 0, 1e12) > myRev;
  }
  function envelope(s, settings) { return { v: VERSION, savedAt: s.saved, rev: myRev + 1, owner: me, settings: sanitizeSettings(settings), state: s }; }
  function save(s, settings, force) {
    if (frozen && !force) { lastError = "other"; return false; }
    if (!force && other()) { frozen = true; lastError = "other"; return false; }
    var st = store(); if (!st) { lastError = "unavailable"; return false; }
    s.saved = Date.now();
    var cur = get(key()), t = s.saved;
    if (cur && t - lastBak >= BAK_EVERY && parse(cur)) { if (put(key() + ".bak", cur)) lastBak = t; }
    var e = envelope(s, settings || defaultSettings()), text;
    try { text = JSON.stringify(e); } catch (x) { lastError = "serialize"; return false; }
    if (!put(key(), text)) { lastError = "quota"; return false; }
    myRev = e.rev; lastError = ""; return true;
  }
  /* Appelé sur l'événement "storage" d'un autre onglet : si c'est notre clé, il a pris la main. */
  function onStorage(ev) { if (ev && ev.key === key() && !frozen) { var e = parse(ev.newValue); if (e && e.owner !== me) frozen = true; } }
  function wipe() { frozen = true; del(key()); del(key() + ".bak"); del(key() + ".corrupt"); }

  /* ---------- Export / import ---------- */
  function exportText(s, settings) { s.saved = Date.now(); return JSON.stringify(envelope(s, settings || defaultSettings()), null, 1); }
  /* Valide un texte importé. Renvoie { ok, state, settings } ou { ok:false, error }. Rien n'est écrit ici. */
  function importText(text, now) {
    if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Le fichier est vide." };
    if (text.length > 5e6) return { ok: false, error: "Le fichier est trop volumineux." };
    var raw; try { raw = JSON.parse(text); } catch (e) { return { ok: false, error: "Ce fichier n’est pas une sauvegarde valide (JSON illisible)." }; }
    var env = migrate(raw); if (!env) return { ok: false, error: "Ce fichier ne contient pas de sauvegarde BLACKLINE." };
    if (env.newer) return { ok: false, error: "Cette sauvegarde vient d’une version plus récente du jeu." };
    var s = sanitize(env, now); s.saved = now;                       /* l'import ne donne jamais de revenus hors ligne */
    var cfg = sanitizeSettings(env.settings); if (!env.settings || typeof env.settings !== "object") cfg.tutorial = "done"; return { ok: true, state: s, settings: cfg };
  }

  BL.save = { VERSION: VERSION, sanitize: sanitize, sanitizeSettings: sanitizeSettings, defaultSettings: defaultSettings, migrate: migrate, parse: parse, load: load, loadFull: loadFull,
    save: save, wipe: wipe, onStorage: onStorage, exportText: exportText, importText: importText,
    status: function () { return { frozen: frozen, error: lastError, info: info, owner: me, rev: myRev }; }, unfreeze: function () { frozen = false; lastError = ""; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
