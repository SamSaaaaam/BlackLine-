/* Classement en ligne (facultatif) : logique PURE, sans réseau, partagée avec le SQL (docs/supabase.sql reprend exactement ces règles).
   Pseudo : 3 à 16 caractères, lettres latines/accents, chiffres, espace, tiret, souligné. Le serveur revérifie TOUT : ce module sert à prévenir le joueur tout de suite. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var C = {
    NAME_MIN: 3, NAME_MAX: 16,
    FIRST_MAX: 1e15,          /* première soumission : total gagné maximal accepté (une partie déjà longue reste possible) */
    ABS_MAX: 1e18,            /* aucun total ne dépasse ceci */
    RATE: 2e11,               /* gain maximal accepté par seconde écoulée entre deux envois (≈ 20 × le revenu net observé à 24 h de jeu) */
    FLOOR: 1e6,               /* petite marge fixe par envoi */
    WINDOW: 604800,           /* au plus 7 jours de gain comptés entre deux envois */
    MIN_GAP_S: 55,            /* délai minimal entre deux envois (le jeu en fait un toutes les 5 minutes) */
    RENAME_H: 24,             /* un changement de pseudo par 24 h */
    HIDE_AT: 5,               /* signalements distincts pour masquer un pseudo */
    TOP: 50
  };
  /* mots refusés. « sub » : présent n'importe où dans le pseudo (accents, casse, chiffres façon 1337 ignorés). « exact » : le pseudo entier ou l'un de ses mots (pour les mots courts qui se cachent dans des mots innocents : « computer », « torpedo », « Dominique »). Liste de départ : à compléter par l'éditeur. */
  var SUB = ["putain", "salop", "salaud", "connard", "connasse", "encule", "niquer", "batard", "merde", "nazi", "hitler", "negre", "nigger", "nigga", "faggot", "pedophile", "porno", "porn", "daech", "jihad", "suicide", "fuck", "shit", "bitch", "cunt", "whore", "retard",
    "instagram", "snapchat", "discord", "whatsapp", "tiktok", "telegram", "facebook", "gmail", "hotmail", "outlook", "yahoo", "icloud"];
  var EXACT = ["pute", "putes", "pedo", "insta", "snap", "ntm", "fdp", "pd", "tg", "sex", "sexe", "cul", "cum", "anal", "kkk", "isis", "admin", "moderateur", "modo", "support", "blackline"];
  var ACC_FROM = "àáâãäåçèéêëìíîïñòóôõöùúûüýÿ", ACC_TO = "aaaaaaceeeeiiiinooooouuuuyy";
  var OK_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]+$/;

  function normalize(raw) {
    var s = typeof raw === "string" ? raw : ""; try { s = s.normalize("NFKC"); } catch (e) {}
    return s.replace(/\s+/g, " ").trim();
  }
  function fold(s, one) {
    s = String(s).toLowerCase(); var o = "";
    for (var i = 0; i < s.length; i++) { var k = ACC_FROM.indexOf(s[i]); o += k >= 0 ? ACC_TO[k] : s[i]; }
    var from = "0134578", to = one ? "oleastb" : "oieastb", r = "";
    for (var j = 0; j < o.length; j++) { var q = from.indexOf(o[j]); r += q >= 0 ? to[q] : o[j]; }
    return r.replace(/[^a-z0-9]/g, "");
  }
  /* clé d'unicité (insensible à la casse, aux accents et aux chiffres façon 1337) */
  function nameKey(name) { return fold(normalize(name), false); }
  /* retourne null si le pseudo est correct, sinon un code : len | chars | letters | digits | banned */
  function nameError(name) {
    var n = normalize(name);
    if (n.length < C.NAME_MIN || n.length > C.NAME_MAX) return "len";
    if (!OK_RE.test(n)) return "chars";
    if (n.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").length < 2) return "letters";
    if (n.replace(/[^0-9]/g, "").length >= 7) return "digits";
    var ka = fold(n, false), kb = fold(n, true), toks = n.split(/[ _-]+/).map(function (t) { return fold(t, false); }), toks2 = n.split(/[ _-]+/).map(function (t) { return fold(t, true); });
    for (var i = 0; i < SUB.length; i++) if (ka.indexOf(SUB[i]) >= 0 || kb.indexOf(SUB[i]) >= 0) return "banned";
    for (var j = 0; j < EXACT.length; j++) { var w = EXACT[j]; if (ka === w || kb === w || toks.indexOf(w) >= 0 || toks2.indexOf(w) >= 0) return "banned"; }
    return null;
  }
  var MSG = { len: "Le pseudo doit faire entre 3 et 16 caractères.", chars: "Seulement des lettres, des chiffres, l’espace, le tiret et le souligné.", letters: "Le pseudo doit contenir au moins 2 lettres.", digits: "Trop de chiffres : un pseudo ne doit pas ressembler à un numéro.", banned: "Ce pseudo n’est pas autorisé. Choisis-en un autre (pas de nom réel, pas de contact).", taken: "Ce pseudo est déjà pris.", rate: "Tu as déjà changé de pseudo il y a moins de 24 h." };
  function nameMessage(code) { return MSG[code] || "Pseudo refusé."; }
  function checkName(raw) { var n = normalize(raw), e = nameError(n); return { ok: !e, name: n, key: nameKey(n), error: e, message: e ? nameMessage(e) : "" }; }

  function num(x) { x = +x; return isFinite(x) ? x : 0; }
  /* score envoyé : total gagné (jamais négatif, borné) et niveau d'empire (affichage seulement) */
  function payload(s, level) {
    var t = s && typeof s === "object" ? num(s.total) : 0; t = Math.max(0, Math.min(C.ABS_MAX, Math.floor(t))); var l = Math.max(1, Math.min(100, Math.floor(num(level) || 1)));
    return { total: t, level: l };
  }
  /* plausibilité (même règle que le SQL). prev = meilleur total déjà accepté (0 si premier envoi), elapsedS = secondes depuis le dernier envoi (null = premier envoi) */
  function plausible(prev, next, elapsedS) {
    prev = num(prev); if (typeof next !== "number" || !isFinite(next) || next < 0 || next > C.ABS_MAX) return { ok: false, reason: "bad_value" };
    if (next <= prev) return { ok: true, reason: "kept" };      /* on garde le meilleur : un score plus bas ne change rien */
    if (elapsedS === null || elapsedS === undefined) return next <= C.FIRST_MAX ? { ok: true, reason: "first" } : { ok: false, reason: "implausible" };
    var e = Math.max(0, Math.min(C.WINDOW, num(elapsedS))), allowed = C.RATE * e + C.FLOOR;
    return next - prev <= allowed ? { ok: true, reason: "grew" } : { ok: false, reason: "implausible" };
  }
  /* lundi de la semaine (fuseau Europe/Paris) au format AAAA-MM-JJ : le classement hebdomadaire repart chaque lundi */
  function weekKey(ms) {
    var v = +ms, d = new Date(isFinite(v) && Math.abs(v) <= 8.64e15 ? v : 0), f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d), p = {};
    f.forEach(function (x) { p[x.type] = x.value; }); var wd = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[p.weekday] || 0, base = Date.UTC(+p.year, +p.month - 1, +p.day) - wd * 864e5, m = new Date(base);
    return m.getUTCFullYear() + "-" + String(m.getUTCMonth() + 1).padStart(2, "0") + "-" + String(m.getUTCDate()).padStart(2, "0");
  }
  /* ligne reçue du serveur : jamais fait confiance (nom nettoyé, score borné) */
  function cleanRow(r) {
    r = r && typeof r === "object" ? r : {}; var n = typeof r.name === "string" ? r.name.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]/g, "").slice(0, C.NAME_MAX).trim() : ""; if (!n) n = "Joueur";
    return { rank: Math.max(0, Math.min(1e9, Math.floor(num(r.rank)))), pub: typeof r.pub === "string" && /^[0-9a-f-]{36}$/i.test(r.pub) ? r.pub.toLowerCase() : "", name: n, score: Math.max(0, Math.min(C.ABS_MAX, num(r.score))), level: Math.max(1, Math.min(100, Math.floor(num(r.level) || 1))), me: r.is_me === true };
  }
  BL.lbCore = { C: C, SUB: SUB, EXACT: EXACT, normalize: normalize, nameKey: nameKey, nameError: nameError, nameMessage: nameMessage, checkName: checkName, payload: payload, plausible: plausible, weekKey: weekKey, cleanRow: cleanRow };
  if (typeof module !== "undefined" && module.exports) module.exports = BL.lbCore;
})(typeof globalThis !== "undefined" ? globalThis : this);
