/* Salles du QG (Partie 13 · C7) : 4 salles débloquées par la progression, vues dans le QG et sur la façade, avec quelques équipiers qui bougent.
   PUREMENT COSMÉTIQUE : aucun avantage de jeu, aucun nouvel état sauvegardé (tout se déduit de l'état existant). Les 4 styles du QG s'appliquent à toutes les salles ;
   l'aperçu d'un style ne change rien tant qu'on ne l'a pas acheté (le choix d'aperçu n'existe que dans la page). Une seule description par salle (ROOMS) : la façade et les cartes la lisent. */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, u, host = null, sig = "", prev = null;
  var PAL = {
    classic: { wall: "#5a2e26", floor: "#2a1f1a", acc: "#c8a45e", lamp: "#ffd98a" }, dark: { wall: "#1a1c22", floor: "#0e0f13", acc: "#e0394f", lamp: "#ff6a7a" },
    fashion: { wall: "#d9cdb3", floor: "#8d7f63", acc: "#f0d28a", lamp: "#fff3cf" }, tower: { wall: "#26384f", floor: "#141f2d", acc: "#7fb8ff", lamp: "#cfe6ff" }
  };
  var ROOMS = [
    { id: "cartes", name: "Salle des cartes", need: "Contrôler 2 quartiers", ok: function (s) { return BL.territory ? BL.territory.count(s) >= 2 : false; }, text: "Les plans de la ville, des épingles sur chaque quartier que tu tiens." },
    { id: "coffre", name: "Salle du coffre", need: "Niveau d’empire 20", ok: function (s) { return BL.economy.level(s) >= 20; }, text: "Une porte blindée, tes lingots, et les trophées de tes coups." },
    { id: "casino", name: "Salon du casino", need: "Construire un casino", ok: function (s) { return !!(BL.casino && BL.casino.available(s)); }, text: "Une table feutrée au fond du QG, pour les invités qui comptent." },
    { id: "reunion", name: "Salle de réunion", need: "Recruter 3 équipiers", ok: function (s) { return BL.crew ? BL.crew.owned(s).length >= 3 : false; }, text: "Une longue table. C’est ici que ta bande décide, et se dispute." }
  ];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function styleOf(s) { return BL.hq && BL.hq.STYLES ? BL.hq.STYLES : []; }
  function cur(s) { return BL.hq.STYLES.some(function (x) { return x.id === s.hq.style; }) && (s.hq.style === "classic" || (s.hq.styles && s.hq.styles[s.hq.style])) ? s.hq.style : "classic"; }
  function unlocked(s) { return ROOMS.filter(function (r) { return r.ok(s); }).map(function (r) { return r.id; }); }
  /* Un seul dessin par salle : pièce 160×100, couleurs selon le style. */
  function art(r, p, s) {
    var o = '<svg viewBox="0 0 160 100" class="hr-svg" role="img" aria-label="' + esc(r.name) + '"><rect width="160" height="62" fill="' + p.wall + '"/><rect y="62" width="160" height="38" fill="' + p.floor + '"/><path d="M0 62h160" stroke="' + p.acc + '" stroke-opacity=".5" stroke-width="2"/>';
    if (r.id === "cartes") { var n = BL.territory ? Math.min(8, BL.territory.count(s)) : 0; o += '<rect x="28" y="52" width="104" height="34" rx="3" fill="#1b2a2a" stroke="' + p.acc + '"/><path d="M38 62l22 6 18-8 24 10 20-8M44 76l30-6 36 8" stroke="' + p.acc + '" stroke-opacity=".6" fill="none"/>'; for (var i = 0; i < 8; i++) o += '<circle cx="' + (44 + i * 11) + '" cy="' + (64 + (i % 3) * 6) + '" r="3" fill="' + (i < n ? p.lamp : "#445") + '"/>'; }
    else if (r.id === "coffre") { var tro = BL.heist && s.heist && s.heist.trophies.length; o += '<circle cx="80" cy="44" r="26" fill="#3b4048" stroke="' + p.acc + '" stroke-width="3"/><circle cx="80" cy="44" r="10" fill="none" stroke="' + p.acc + '" stroke-width="3"/><path d="M80 18v52M54 44h52" stroke="' + p.acc + '" stroke-width="2"/>'; if (s.gold > 0) o += '<path d="M118 90h26l3-9h-32zM122 81h18l3-9h-24z" fill="' + p.acc + '"/>'; if (tro) o += '<path d="M24 86h16l-2-14h-12z" fill="' + p.lamp + '"/><circle cx="32" cy="68" r="5" fill="none" stroke="' + p.lamp + '" stroke-width="2"/>'; }
    else if (r.id === "casino") { o += '<ellipse cx="80" cy="76" rx="52" ry="16" fill="#1d5a3a" stroke="' + p.acc + '" stroke-width="2"/><circle cx="64" cy="74" r="4" fill="' + p.lamp + '"/><circle cx="78" cy="78" r="4" fill="#e0584a"/><circle cx="96" cy="73" r="4" fill="#5ea8e0"/><rect x="128" y="30" width="22" height="44" rx="3" fill="#2b2f38" stroke="' + p.acc + '"/><rect x="132" y="36" width="14" height="10" fill="' + p.lamp + '" opacity=".8"/>'; }
    else { o += '<rect x="26" y="66" width="108" height="14" rx="3" fill="#3a2a22" stroke="' + p.acc + '"/>'; for (var k = 0; k < 6; k++) o += '<rect x="' + (34 + k * 18) + '" y="58" width="10" height="8" rx="2" fill="' + p.acc + '" opacity=".7"/>'; o += '<rect x="60" y="20" width="40" height="22" rx="2" fill="#10161d" stroke="' + p.acc + '"/><path d="M66 36l8-8 8 5 12-9" stroke="' + p.lamp + '" fill="none"/>'; }
    return o + "</svg>";
  }
  function facade(s, p, un) {
    var o = '<svg viewBox="0 0 120 90" class="hr-fac" role="img" aria-label="Façade du QG : ' + un.length + ' salle' + (un.length > 1 ? "s" : "") + ' éclairée' + (un.length > 1 ? "s" : "") + '"><rect x="8" y="10" width="104" height="76" fill="' + p.wall + '" stroke="' + p.acc + '" stroke-width="2"/><rect x="4" y="6" width="112" height="8" fill="' + p.acc + '"/>';
    ROOMS.forEach(function (r, i) { var x = 18 + (i % 2) * 48, y = 22 + Math.floor(i / 2) * 30, on = un.indexOf(r.id) >= 0; o += '<rect x="' + x + '" y="' + y + '" width="36" height="20" rx="2" fill="' + (on ? p.lamp : "#10131a") + '" opacity="' + (on ? 1 : 0.7) + '" stroke="' + p.acc + '"/>'; });
    return o + '<rect x="50" y="68" width="20" height="18" fill="#10131a" stroke="' + p.acc + '"/></svg>';
  }
  /* Équipiers présents : ils se tiennent dans la salle de réunion et réagissent à la chaleur ou à une dispute. */
  function people(s, rid) {
    if (rid !== "reunion" && rid !== "casino") return "";
    var act = BL.crew ? BL.crew.active(s).filter(function (m) { var r = BL.crew.rec(s, m.id); return r && !r.away; }).slice(0, 3) : [], hot = BL.heat ? BL.heat.state(s).v >= 60 : false, dis = !!(s.crew && s.crew.ev && s.crew.ev.dis && s.crew.ev.dis.u > s.t), o = "";
    act.forEach(function (m, i) { o += '<span class="hr-npc n' + i + (hot ? " tense" : "") + (dis && s.crew.ev.dis && (s.crew.ev.dis.a === m.id || s.crew.ev.dis.b === m.id) ? " dis" : "") + '" title="' + esc(m.name) + '">' + (BL.portraits ? BL.portraits.portrait(m.look, { label: m.name, id: m.id, variant: "thumb" }) : "") + "</span>"; });
    return o;
  }
  function mood(s) { var hot = BL.heat ? BL.heat.state(s).v >= 60 : false, dis = !!(s.crew && s.crew.ev && s.crew.ev.dis && s.crew.ev.dis.u > s.t); return hot ? "Rideaux tirés : la chaleur est forte, tout le monde parle bas." : dis ? "Deux de tes équipiers se disputent dans la salle de réunion." : "Tout est calme au QG."; }
  function render(s) {
    var un = unlocked(s), real = cur(s), pv = prev && BL.hq.STYLES.some(function (x) { return x.id === prev; }) ? prev : null, style = pv || real, p = PAL[style] || PAL.classic;
    var o = '<div class="ah"><div class="an"><div class="nm">Salles du QG</div><div class="ds">' + un.length + " salle" + (un.length > 1 ? "s" : "") + " sur " + ROOMS.length + ' ouverte' + (un.length > 1 ? "s" : "") + '. Purement décoratif : aucun avantage de jeu.</div></div></div><div class="hr-top">' + facade(s, p, un) + '<div class="hr-side"><p class="hr-mood" role="status">' + esc(mood(s)) + '</p><div class="hr-styles" role="group" aria-label="Aperçu des styles">';
    BL.hq.STYLES.forEach(function (x) { o += '<button type="button" class="hr-st' + (x.id === style ? " on" : "") + '" data-st="' + x.id + '" aria-pressed="' + (x.id === style) + '">' + esc(x.name) + (x.id === real ? " · le tien" : (s.hq.styles && s.hq.styles[x.id] ? "" : "")) + "</button>"; });
    o += "</div>" + (pv && pv !== real ? '<p class="hr-pv" role="status">Aperçu seulement : rien n’est acheté ni changé. <button type="button" class="hr-back" data-st="' + real + '">Revenir à mon style</button></p>' : "") + '</div></div><div class="hr-grid">';
    ROOMS.forEach(function (r) { var on = un.indexOf(r.id) >= 0; o += '<article class="hr-room' + (on ? "" : " locked") + '" aria-label="' + esc(r.name) + (on ? "" : " (verrouillée)") + '"><div class="hr-pic">' + art(r, p, s) + (on ? people(s, r.id) : "") + '</div><h4>' + esc(r.name) + "</h4><p>" + esc(on ? r.text : "Verrouillée : " + r.need + ".") + "</p></article>"; });
    return o + "</div>";
  }
  function paint(s, force) {
    if (!host) return; var un = unlocked(s).join(), g = [un, prev, cur(s), BL.heat ? BL.heat.state(s).v >= 60 : 0, BL.crew ? BL.crew.active(s).map(function (m) { return m.id; }).join() : "", s.crew && s.crew.ev && s.crew.ev.dis ? 1 : 0, Math.min(8, BL.territory ? BL.territory.count(s) : 0), s.gold > 0, s.heist ? s.heist.trophies.length : 0].join("|");
    if (!force && g === sig) return; sig = g; host.innerHTML = render(s);
  }
  function mount() {
    var v = doc.getElementById("v_hq"); if (!v) return false; if (host && host.isConnected) return true;
    host = doc.createElement("section"); host.className = "card hqrooms"; host.id = "hqRooms"; v.insertBefore(host, v.firstChild); sig = "";
    host.addEventListener("click", function (e) { var b = e.target.closest("[data-st]"); if (!b || !host.S) return; prev = b.dataset.st === cur(host.S) ? null : b.dataset.st; paint(host.S, true); var f = host.querySelector(".hr-st.on"); if (f) f.focus(); });
    return true;
  }
  function init(handlers, util) { u = util; }
  function update(s) { var vh = doc.getElementById("v_hq"); if (!vh || vh.hidden) return; if (!mount()) return; host.S = s; paint(s, false); }
  BL.hqRooms = { init: init, update: update, ROOMS: ROOMS, unlocked: unlocked, PAL: PAL, preview: function (id) { prev = id || null; if (host && host.S) paint(host.S, true); } };
})(typeof globalThis !== "undefined" ? globalThis : this);
