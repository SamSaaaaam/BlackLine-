/* Interface de l'équipement : sections « Arsenal » (équiper, comparer, vendre, réparer, acheter) et « Opérations » (braquages).
   Aucune règle ici : tout passe par BL.equip (logique) et par les actions de main.js (h.eq*, h.op*). Le DOM n'est reconstruit que quand quelque chose change. */
(function (root) {
  var BL = root.BL = root.BL || {}, Q, D, h, u, S = null, doc = root.document;
  var ui = { slot: "all", rar: "all", sort: "rar", pick: null, grab: null, msg: "", team: [], last: [], fop: "", sig: "", osig: "", shop: false, fin: false, fam: "heist", focus: "", reveal: null };
  var ST = ["pow", "def", "stl", "spd"];
  function $(id) { return doc.getElementById(id); }
  function vis(id) { var e = $(id); return !!e && !e.hidden; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function n1(x) { return String(Math.round(x * 10) / 10).replace(".", ","); }
  function tm(sec) { sec = Math.max(0, Math.ceil(sec)); var m = Math.floor(sec / 60), s = sec % 60; return m ? m + " min" + (s ? " " + s + " s" : "") : s + " s"; }
  function money(x) { return u.money(x); }
  function icon(it, big) {
    var vb = D.VB || "0 0 48 48", im = D.IMG && D.IMG.indexOf(it.id) >= 0;
    var svg = '<svg viewBox="' + vb + '" class="eqic' + (big ? " big" : "") + '" style="color:' + D.RCOL[it.rar] + '" role="img" aria-label="' + esc(it.name) + '">' + (D.ICONS[it.ic] || "") + "</svg>";
    return im ? '<span class="eqicw' + (big ? " big" : "") + '">' + svg + '<img class="eqimg" src="assets/img/items/' + it.id + '.webp" alt="" loading="lazy" onload="this.previousSibling.style.visibility=\'hidden\'" onerror="this.remove()"></span>' : svg;
  }
  function chips(st, neutral) {
    var o = ""; ST.forEach(function (k) { var v = st[k] || 0; if (Math.abs(v) < 0.05) return; o += '<span class="eqst ' + (v > 0 ? "up" : "dn") + '">' + (v > 0 ? "+" : "−") + n1(Math.abs(v)) + " " + D.STATS[k] + "</span>"; });
    return o || '<span class="eqst">—</span>';
  }
  function memberName(id) { var m = BL.crew && BL.crew.get(id); return m ? m.name : "?"; }
  function lastName(id) { var m = BL.crew && BL.crew.get(id); return m ? m.name.split(" ")[0] : "?"; }

  /* ---------- Arsenal ---------- */
  function itemCard(s, x, i, shopMode) {
    var it = Q.item(x.id), st = Q.statsOf(x), wear = Math.round(x.w), on = x.on, e = Q.st(s);
    var worn = on ? '<span class="eqon">Porté par ' + esc(lastName(on)) + "</span>" : "";
    var bar = '<div class="eqbar" role="img" aria-label="Usure : ' + wear + ' % de solidité"><i style="width:' + wear + '%" class="' + (wear < 35 ? "low" : "") + '"></i></div><small class="muted">Solidité ' + wear + " %" + (wear < 100 ? " · efficacité " + Math.round(Q.wearFactor(x) * 100) + " %" : "") + "</small>";
    var b = "";
    if (!on) b += '<button class="btn" data-a="pick" data-i="' + i + '">Équiper</button>'; else b += '<button class="btn ghost" data-a="unequip" data-i="' + i + '"' + (Q.locked(s, on) ? " disabled title=\"En mission\"" : "") + ">Retirer</button>";
    var rc = Q.repairCost(s, i); if (rc > 0) b += '<button class="btn ghost' + (s.money >= rc ? "" : " off") + '" data-a="repair" data-i="' + i + '"' + (s.money >= rc ? "" : " disabled") + ">Réparer · " + money(rc) + "</button>";
    if (!on) b += '<button class="btn ghost" data-a="sell" data-i="' + i + '">Vendre · ' + money(Q.sellValue(s, x.id, !!x.b)) + "</button>";
    var fc = Q.finCol(s);
    var grip = '<button type="button" class="eqgrip" data-a="grab" data-i="' + i + '" data-k="grab' + i + '" aria-pressed="' + (ui.grab === i) + '" aria-label="Déplacer « ' + esc(it.name) + ' » : toucher pour choisir puis toucher un emplacement, ou glisser" title="Glisser sur un équipier, ou toucher puis choisir un emplacement"><svg viewBox="0 0 12 18" aria-hidden="true" width="12" height="18"><g fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/></g></svg></button>';
    return '<article class="eqcard rar' + it.rar + (fc ? " fin" : "") + (ui.grab === i ? " grabbed" : "") + '" data-dsrc="' + i + '" style="--rc:' + D.RCOL[it.rar] + (fc ? ";--fin:" + fc : "") + '">' + grip + icon(it) + '<div class="eqb"><h3>' + esc(it.name) + '</h3><small class="eqr">' + D.SLOTS[it.slot] + " · " + D.RAR[it.rar] + "</small>" + '<div class="eqsts">' + chips(st) + "</div>" + bar + worn + '<div class="eqbtn">' + b + "</div></div></article>";
  }
  /* meilleure amélioration possible parmi les équipiers : « +4 puissance pour Maya (remplace X) » */
  function bestGain(s, it) {
    var own = BL.crew ? BL.crew.owned(s) : [], best = null;
    own.forEach(function (m) { var c = Q.compareNew(s, it.id, m.id); if (!c) return; var sum = 0; ST.forEach(function (k) { sum += c.diff[k]; }); if (!best || sum > best.sum) best = { sum: sum, m: m, c: c }; });
    if (!best) return "Recrute un équipier pour l’équiper.";
    var cur = best.c.current ? Q.item(best.c.current).name : null;
    return (best.sum > 0 ? "Meilleur pour " + lastName(best.m.id) + " : " : "Pour " + lastName(best.m.id) + " : ") + Q.diffText(best.c.diff) + (cur ? " (remplace " + cur + ")" : " (emplacement libre)");
  }
  function shopCard(s, it) {
    var bs = Q.buyState(s, it.id), epic = it.rar === 2;
    return '<article class="eqcard eqshopc rar' + it.rar + '" style="--rc:' + D.RCOL[it.rar] + '">' + icon(it) + '<div class="eqb"><h3>' + esc(it.name) + '</h3><small class="eqr">' + D.SLOTS[it.slot] + " · " + D.RAR[it.rar] + (epic ? " · sélection" : "") + '</small><div class="eqsts">' + chips(it.st) + '</div><small class="eqcmp">' + esc(bestGain(s, it)) + '</small><div class="eqbtn"><button class="btn' + (bs.ok ? "" : " off") + '" data-a="buy" data-id="' + it.id + '"' + (bs.ok ? "" : " disabled") + ' aria-describedby="why_' + it.id + '">Acheter · ' + money(bs.price) + '</button></div>' + (bs.ok ? "" : '<small class="eqwhy" id="why_' + it.id + '">' + esc(bs.reason) + "</small>") + "</div></article>";
  }
  function filtered(s) {
    var e = Q.st(s), list = e.inv.map(function (x, i) { return { x: x, i: i, it: Q.item(x.id) }; });
    list = list.filter(function (r) { return (ui.slot === "all" || r.it.slot === ui.slot) && (ui.rar === "all" || r.it.rar === +ui.rar); });
    list.sort(function (a, b) { if (ui.sort === "name") return a.it.name.localeCompare(b.it.name, "fr"); if (ui.sort === "wear") return a.x.w - b.x.w; return b.it.rar - a.it.rar || a.it.slot.localeCompare(b.it.slot) || a.it.name.localeCompare(b.it.name, "fr"); });
    return list;
  }
  function crewPanel(s) {
    var C = BL.crew, own = C ? C.owned(s) : [], e = Q.st(s); if (!own.length) return '<p class="muted">Tu n’as encore aucun équipier. Recrute-en dans la section Équipe : ce sont eux qui portent l’équipement.</p>';
    return own.map(function (m) {
      var g = Q.gear(s, m.id), tot = Q.memberStats(s, m.id), busy = Q.locked(s, m.id), hurt = Q.isHurt(s, m.id);
      var slots = Object.keys(D.SLOTS).map(function (sl) {
        var i = g[sl], it = i !== undefined ? Q.item(e.inv[i].id) : null, dat = ' data-m="' + m.id + '" data-sl="' + sl + '"';
        return it ? '<button type="button" class="eqsl full' + (ui.grab === i ? " grabbed" : "") + '" style="--rc:' + D.RCOL[it.rar] + '" data-a="slot"' + dat + ' data-i="' + i + '" data-dsrc="' + i + '" data-k="sl' + m.id + sl + '" title="' + esc(it.name) + ' : toucher pour déplacer, ou glisser" aria-label="' + D.SLOTS[sl] + " de " + esc(m.name) + " : " + esc(it.name) + '. Activer pour déplacer.">' + icon(it) + "<small>" + D.SLOTS[sl] + "</small></button>"
          : '<button type="button" class="eqsl" data-a="slot"' + dat + ' data-k="sl' + m.id + sl + '" title="Emplacement vide : ' + D.SLOTS[sl] + '" aria-label="Emplacement vide : ' + D.SLOTS[sl].toLowerCase() + " de " + esc(m.name) + '"><span class="eqempty">+</span><small>' + D.SLOTS[sl] + "</small></button>";
      }).join("");
      var state = busy ? '<span class="eqtag run">En mission</span>' : hurt ? '<span class="eqtag hurt">Blessé · de retour dans ' + tm(Q.hurtLeft(s, m.id)) + "</span>" : '<span class="eqtag ok">Disponible</span>';
      return '<div class="eqm" data-m="' + m.id + '"><div class="eqp">' + (BL.portraits ? BL.portraits.portrait(m.look, { label: m.name, id: m.id }) : "") + '</div><div class="eqmb"><b>' + esc(m.name) + "</b> " + state + '<div class="eqtot">' + ST.map(function (k) { return "<span>" + D.STATS[k] + " <b>" + n1(tot[k]) + "</b></span>"; }).join("") + '</div><div class="eqslots">' + slots + "</div></div></div>";
    }).join("");
  }
  function pickPanel(s) {
    var e = Q.st(s), x = e.inv[ui.pick]; if (!x) { ui.pick = null; return ""; } var it = Q.item(x.id), own = BL.crew ? BL.crew.owned(s) : [];
    var rows = own.length ? own.map(function (m) {
      var c = Q.compare(s, ui.pick, m.id), busy = Q.locked(s, m.id), cur = c.current >= 0 ? Q.item(e.inv[c.current].id).name : "rien";
      return '<div class="eqpr"><div><b>' + esc(m.name) + '</b><small class="muted"> porte actuellement : ' + esc(cur) + "</small><div class=\"eqdiff\">" + esc(Q.diffText(c.diff)) + "</div></div>" + '<button class="btn" data-a="equip" data-i="' + ui.pick + '" data-m="' + m.id + '"' + (busy ? " disabled" : "") + ">" + (busy ? "En mission" : "Équiper") + "</button></div>";
    }).join("") : '<p class="muted">Recrute d’abord un équipier (section Équipe).</p>';
    return '<div class="card eqpick" role="region" aria-label="Choisir un équipier"><div class="mh"><h2>Équiper « ' + esc(it.name) + ' »</h2><button class="btn ghost" data-a="pickx">Annuler</button></div><p class="muted">Compare avant de choisir : les chiffres montrent ce que ça change pour chaque équipier.</p>' + rows + "</div>";
  }
  /* finitions : cosmétiques en lingots, sans effet sur les statistiques */
  function finPanel(s) {
    var e = Q.st(s), cards = D.FINS.map(function (f) {
      var own = Q.finOwned(s, f.id), on = e.fin.on === f.id, can = !own && s.gold >= f.gold;
      var btn = own ? '<button class="btn ghost" data-a="finset" data-id="' + f.id + '" aria-pressed="' + on + '">' + (on ? "Appliquée" : "Appliquer") + "</button>" : '<button class="btn' + (can ? "" : " off") + '" data-a="finbuy" data-id="' + f.id + '"' + (can ? "" : " disabled") + ">Obtenir · " + f.gold + " lingots</button>";
      return '<article class="eqfin' + (on ? " on" : "") + '" style="--fin:' + f.col + '"><i class="eqfsw" aria-hidden="true"></i><div><h3>' + esc(f.name) + "</h3><small class=\"muted\">" + esc(f.text) + '</small></div><div class="eqbtn">' + btn + "</div></article>";
    }).join("");
    return '<details class="card eqfins"' + (ui.fin ? " open" : "") + '><summary><h2>Finitions : décoration en lingots</h2></summary><p class="muted">Purement décoratif : une finition colore le cadre des objets de ton Arsenal. Elle n’ajoute aucune statistique et ne change aucune chance de réussite. Tu as ' + (s.gold || 0) + ' lingot' + (s.gold > 1 ? "s" : "") + '.</p>' + (e.fin.on ? '<div class="eqbtn"><button class="btn ghost" data-a="finset" data-id="">Retirer la finition</button></div>' : "") + '<div class="eqfgrid">' + cards + "</div></details>";
  }
  /* barre de filtres : pastilles (type, rareté) et sélecteur segmenté (tri), vrais boutons avec aria-pressed, aucune flèche système */
  var SLOT_IC = { weapon: "revolver", armor: "pbleger", gadget: "talkie", vehicle: "coupe" };
  function chip(grp, v, label, on, extra, style) { return '<button type="button" class="fchip g-' + grp + (on ? " on" : "") + '" data-a="f' + grp + '" data-v="' + v + '" data-k="f' + grp + v + '" aria-pressed="' + on + '"' + (style ? ' style="' + style + '"' : "") + ">" + (extra || "") + "<span>" + esc(label) + "</span></button>"; }
  function filterBar(s, e) {
    var inSlot = e.inv.filter(function (x) { var it = Q.item(x.id); return it && (ui.slot === "all" || it.slot === ui.slot); }), cnt = [0, 0, 0, 0, 0]; inSlot.forEach(function (x) { cnt[Q.item(x.id).rar]++; });
    var slots = chip("slot", "all", "Tous", ui.slot === "all", "", "") + Object.keys(D.SLOTS).map(function (k) { var it = Q.item(SLOT_IC[k]); return chip("slot", k, D.SLOTS[k], ui.slot === k, it ? icon(it) : "", ""); }).join("");
    var rars = chip("rar", "all", "Toutes", ui.rar === "all", "", "") + D.RAR.map(function (r, i) { return chip("rar", String(i), r[0].toUpperCase() + r.slice(1), ui.rar === String(i), '<i class="fdot" aria-hidden="true"></i>', "--rc:" + D.RCOL[i]).replace("</span></button>", ' <em>' + cnt[i] + "</em></span></button>"); }).join("");
    var sorts = [["rar", "Rareté"], ["name", "Nom"], ["wear", "Usure"]].map(function (q) { return '<button type="button" class="fseg' + (ui.sort === q[0] ? " on" : "") + '" data-a="fsort" data-v="' + q[0] + '" data-k="fsort' + q[0] + '" aria-pressed="' + (ui.sort === q[0]) + '">' + q[1] + "</button>"; }).join("");
    var act = ui.slot !== "all" || ui.rar !== "all" || ui.sort !== "rar";
    return '<div class="eqfb" role="group" aria-label="Filtres de l’inventaire"><div class="fgrp"><span class="flb" id="flT">Type</span><div class="frow" role="group" aria-labelledby="flT">' + slots + '</div></div><div class="fgrp"><span class="flb" id="flR">Rareté</span><div class="frow" role="group" aria-labelledby="flR">' + rars + '</div></div><div class="fgrp"><span class="flb" id="flS">Tri</span><div class="fsegs" role="group" aria-labelledby="flS">' + sorts + "</div></div>" + (act ? '<button type="button" class="freset" data-a="freset" data-k="freset">Réinitialiser les filtres</button>' : "") + "</div>";
  }
  /* barre de sélection (alternative au glisser : toucher l'objet, puis toucher un emplacement) */
  function grabBar(s) {
    var e = Q.st(s), x = ui.grab !== null ? e.inv[ui.grab] : null; if (!x) { ui.grab = null; return ""; } var it = Q.item(x.id);
    return '<div class="card eqgrab" role="region" aria-label="Objet sélectionné"><div class="eqgi">' + icon(it) + '</div><div class="eqgt"><b>' + esc(it.name) + '</b><small>Choisis un emplacement ' + D.SLOTS[it.slot].toLowerCase() + ' (en surbrillance), ou annule. Raccourci clavier : Tab puis Entrée sur l’emplacement ; Échap annule.</small></div><div class="eqbtn">' +
      (x.on ? '<button type="button" class="btn ghost" data-a="gunequip">Remettre à l’inventaire</button>' : "") + '<button type="button" class="btn ghost" data-a="gcancel">Annuler</button></div></div>';
  }
  function renderArsenal(force) {
    var root_ = $("v_arsenal"); if (!root_ || (!force && root_.hidden)) return; if (BL.arsDnD && BL.arsDnD.active()) return; var e = Q.st(S), cc = Q.capCost(S), ra = Q.repairAllCost(S);
    var buy = D.ITEMS.filter(function (it) { return Q.listed(S, it.id) && (ui.slot === "all" || it.slot === ui.slot) && (ui.rar === "all" || it.rar === +ui.rar); }).sort(function (a, b) { return a.rar - b.rar || Q.buyPrice(S, a.id) - Q.buyPrice(S, b.id); });
    var sig = JSON.stringify([e.inv, e.lvl, e.hurt && Object.keys(e.hurt).map(function (k) { return Q.isHurt(S, k) ? 1 : 0; }), e.op && e.op.ids, Q.status(S).state, ui.slot, ui.rar, ui.sort, ui.pick, ui.grab, ui.msg, ui.fin, e.fin, S.gold, S.money >= cc, S.money >= ra, buy.map(function (it) { return Q.buyState(S, it.id).reason + (S.money >= Q.buyPrice(S, it.id) ? 1 : 0); }).join("|"), BL.crew && BL.crew.owned(S).map(function (m) { return m.id + BL.crew.lvl(S, m.id); }), Math.floor(S.t / 5) * (Object.keys(e.hurt).some(function (k) { return Q.isHurt(S, k); }) ? 1 : 0)]);
    if (!force && sig === ui.sig) return; ui.sig = sig; var keep = root_.scrollTop;
    var list = filtered(S), cap = Q.capacity(S), used = e.inv.length;
    var head = '<div class="card eqhead"><div class="mh"><h2>Ton Arsenal</h2><span class="muted" id="eqCap">' + used + " / " + cap + ' objets</span></div><p class="muted eqintro">Équipe tes hommes pour réussir les opérations et mieux défendre tes quartiers. Glisse un objet sur un équipier ou sur un emplacement (ou touche l’objet, puis l’emplacement). Un objet usé est moins efficace, mais il n’est jamais détruit ni perdu : répare-le avec de l’argent du jeu.</p><div class="eqtools">' +
      (cc > 0 ? '<button class="btn' + (S.money >= cc ? "" : " off") + '" data-a="expand"' + (S.money >= cc ? "" : " disabled") + ">Agrandir (+" + D.params.capPerLevel + " places) · " + money(cc) + "</button>" : '<span class="muted">Capacité maximale atteinte.</span>') +
      (ra > 0 ? '<button class="btn ghost' + (S.money >= ra ? "" : " off") + '" data-a="repairall"' + (S.money >= ra ? "" : " disabled") + ">Tout réparer · " + money(ra) + "</button>" : "") + '</div><div class="eqlive sr-only" id="eqLive" role="status" aria-live="polite">' + esc(ui.msg) + "</div></div>";
    var crew = '<div class="card eqcrewc"><div class="mh"><h2>Équipiers et équipement</h2></div><div class="eqcrew">' + crewPanel(S) + "</div></div>";
    var fil = filterBar(S, e);
    var grid = '<div class="card eqinv"><div class="mh"><h2>Inventaire</h2><span class="muted">' + list.length + " affiché" + (list.length > 1 ? "s" : "") + "</span></div>" + fil +
      (list.length ? '<div class="eqgrid">' + list.map(function (r) { return itemCard(S, r.x, r.i); }).join("") + "</div>" : '<p class="muted eqnone">' + (used ? "Aucun objet ne correspond à ces filtres." : "Ton inventaire est vide. Achète du matériel à l’armurerie, ou gagne du butin en réussissant des opérations.") + "</p>") + "</div>";
    var shop = '<section class="card eqshop" aria-labelledby="eqShopT"><div class="mh"><h2 id="eqShopT">Armurerie</h2><span class="muted">' + buy.length + " objet" + (buy.length > 1 ? "s" : "") + '</span></div><p class="muted">Argent du jeu uniquement : communs et rares, plus une sélection d’épiques (niveau d’empire ' + D.params.epicMinLevel + ' requis, prix nettement plus élevé). Les légendaires et mythiques se gagnent en box et en opération. Revendre ne rend qu’une fraction du prix. Les filtres de l’inventaire s’appliquent aussi ici.</p>' +
      (buy.length ? '<div class="eqgrid eqshopg">' + buy.map(function (it) { return shopCard(S, it); }).join("") + "</div>" : '<p class="muted eqnone">Aucun objet à l’armurerie pour ces filtres.</p>') + "</section>";
    root_.innerHTML = head + grabBar(S) + pickPanel(S) + '<div class="eqlayout">' + crew + shop + grid + "</div>" + finPanel(S); root_.scrollTop = keep; restoreFocus(root_); if (ui.grab !== null) markGrab();
  }

  /* ---------- Opérations ---------- */
  function lastTeam() { try { var a = JSON.parse(localStorage.getItem("blackline.lastTeam") || "[]"); return Array.isArray(a) ? a.filter(function (x) { return typeof x === "string"; }).slice(0, D.params.maxTeam) : []; } catch (e) { return []; } }
  function saveLast(ids) { ui.last = ids.slice(); try { localStorage.setItem("blackline.lastTeam", JSON.stringify(ui.last)); } catch (e) {} }
  function focusOp(s) { var list = Q.opsList().filter(function (o) { return o.fam === ui.fam && Q.opUnlock(s, o).ok; }); var o = Q.op(ui.fop); if (o && o.fam === ui.fam && Q.opUnlock(s, o).ok) return o; return list[0] || null; }
  /* sélecteur visuel : places d'équipe (portraits), meilleure équipe automatique, dernière équipe, chances en direct */
  function squad(s) {
    var o = focusOp(s), pv = o ? Q.preview(s, o, ui.team) : null, L = ui.last.filter(function (id) { return Q.available(s, id); }), canLast = L.length === ui.last.length && L.length > 0 && ui.team.join() !== L.join();
    var slots = ""; for (var i = 0; i < D.params.maxTeam; i++) {
      var id = ui.team[i], m = id && BL.crew ? BL.crew.get(id) : null;
      slots += m ? '<button class="sqs full" data-a="team" data-m="' + m.id + '" aria-label="Retirer ' + esc(m.name) + ' de l’équipe"><span class="eqp">' + (BL.portraits ? BL.portraits.portrait(m.look, { label: m.name, id: m.id }) : "") + '</span><b>' + esc(m.name.split(" ")[0]) + '</b><small>Retirer ✕</small></button>'
        : '<div class="sqs empty" aria-label="Place libre"><span class="sqp">+</span><small>Place libre</small></div>';
    }
    return '<div class="squad"><div class="sqrow">' + slots + '</div><div class="sqbar"><button class="btn" data-a="best"' + (o ? "" : " disabled") + '>Meilleure équipe' + (o ? " pour « " + esc(o.name) + " »" : "") + '</button><button class="btn ghost" data-a="last"' + (canLast ? "" : " disabled") + '>Dernière équipe</button><button class="btn ghost" data-a="clear"' + (ui.team.length ? "" : " disabled") + '>Vider</button></div>' +
      (o ? '<div class="opch sqch"><span>Chances pour « ' + esc(o.name) + ' »</span><b>' + (ui.team.length ? Math.round(pv.chance * 100) + " %" : "—") + '</b><div class="eqbar"><i style="width:' + Math.round((pv.chance || 0) * 100) + '%"></i></div></div>' : "") + "</div>";
  }
  function teamBar(s) {
    var C = BL.crew, own = C ? C.owned(s) : []; ui.team = ui.team.filter(function (id) { return Q.available(s, id); });
    if (!own.length) return '<p class="muted">Aucun équipier : recrute-en dans la section Équipe pour monter des opérations.</p>';
    return squad(s) + '<h3 class="sqh">Tes équipiers</h3><div class="optm">' + own.map(function (m) {
      var av = Q.available(s, m.id), on = ui.team.indexOf(m.id) >= 0, tot = Q.memberStats(s, m.id), why = Q.locked(s, m.id) ? "En mission" : Q.isHurt(s, m.id) ? "Blessé · " + tm(Q.hurtLeft(s, m.id)) : "";
      return '<button class="optc' + (on ? " on" : "") + (av ? "" : " off") + '" data-a="team" data-m="' + m.id + '" aria-pressed="' + on + '"' + (av ? "" : " disabled") + '><span class="eqp sm">' + (BL.portraits ? BL.portraits.portrait(m.look, { label: m.name, id: m.id }) : "") + "</span><b>" + esc(m.name.split(" ")[0]) + "</b><small>" + (why || ST.map(function (k) { return D.STATS[k].slice(0, 3) + ". " + n1(tot[k]); }).join(" · ")) + "</small></button>";
    }).join("") + "</div>";
  }
  function art(o, stamp) { return BL.opsArt ? '<div class="opimg">' + BL.opsArt.scene(o) + (stamp ? '<span class="opstamp">' + esc(stamp) + "</span>" : "") + "</div>" : ""; }
  function oddsText(o) { return o.loot.map(function (p, i) { return p > 0 ? D.RAR[i][0].toUpperCase() + D.RAR[i].slice(1) + " " + p + " %" : ""; }).filter(Boolean).join(" · "); }
  /* Partie 17 · E : préparation facultative (plan du coup, et crochetage pour les braquages) */
  function prepHtml(s, o, ok) {
    if (!BL.minigames || !ok) return ""; var p = BL.minigames.prepOf(s, o.id);
    return '<div class="mg-entry opprep"><div class="mg-bts"><button type="button" class="btn ghost" data-a="mplan" data-id="' + o.id + '">' + (p && p.plan >= 0 ? "Refaire le plan" : "Plan du coup") + "</button>" + (o.fam === "heist" ? '<button type="button" class="btn ghost" data-a="mlock" data-id="' + o.id + '">' + (p && p.lp >= 0 ? "Recrocheter" : "Crocheter") + "</button>" : "") + "</div>"
      + "<small>" + (p ? "Préparé : +" + Math.round(p.b * 100) + " points de chance, chaleur " + (p.h > 0 ? "+" + p.h : p.h < 0 ? "−" + (-p.h) : "0") + " après l’opération." : "Facultatif : un bon plan ajoute jusqu’à +10 points de chance et réduit la chaleur.") + "</small></div>";
  }
  function opCard(s, o, busy) {
    var un = Q.opUnlock(s, o), inc = Math.max(BL.economy.incomeBase(s), 0), full = Math.floor(Math.min(inc * o.dur * D.params.rewardPerSec, inc * D.params.rewardCapSec));
    var fi = o.fac && BL.factions ? BL.factions.info(o.fac) : null, fm = D.FAMS[o.fam], rel = fi ? Math.round(BL.factions.rel(s, o.fac)) : 0;
    var tgt = fi ? "<dt>Cible</dt><dd>" + esc(fi.name) + " (relation " + (rel > 0 ? "+" : "") + rel + ")</dd><dt>Effet sur elle</dt><dd class=\"lng\">Réussite : influence ×" + String(fm.win.pow).replace(".", ",") + ", relation " + fm.win.rel + ". Échec : influence ×" + String(fm.lose.pow).replace(".", ",") + ", relation " + fm.lose.rel + ".</dd>" : "";
    var pv = Q.preview(s, o, ui.team), stars = "★".repeat(o.tier) + "☆".repeat(4 - o.tier);
    var rows = pv.rows.map(function (r) { return '<li class="' + (r.ok ? "ok" : "no") + '"><span>' + D.STATS[r.k] + "</span><b>" + n1(r.have) + " / " + r.need + '</b><i aria-hidden="true">' + (r.ok ? "✓" : "✗") + '</i><span class="sr">' + (r.ok ? "suffisant" : "insuffisant") + "</span></li>"; }).join("");
    var can = un.ok && !busy && ui.team.length > 0;
    return '<article class="card opc' + (un.ok ? "" : " lock") + (focusOp(s) === o ? " foc" : "") + '" data-op="' + o.id + '"><div class="mh"><h2>' + esc(o.name) + '</h2><span class="opstar" role="img" aria-label="Difficulté ' + o.tier + ' sur 4">' + stars + "</span></div>" + art(o) + "<p class=\"muted\">" + esc(o.text) + "</p>" +
      '<dl class="opkv"><dt>Durée</dt><dd>' + tm(o.dur) + "</dd><dt>Risque</dt><dd class=\"lng\">blessure possible (" + Math.round(o.inj * 100) + " % de base, plus en cas d’échec)</dd><dt>Récompense</dt><dd>≈ " + money(full) + " + butin</dd><dt>Butin</dt><dd>" + oddsText(o) + "</dd>" + tgt + "</dl>" +
      (un.ok ? '<ul class="opneed" aria-label="Statistiques requises">' + rows + '</ul><div class="opch"><span>Chances de réussite</span><b>' + (ui.team.length ? Math.round(pv.chance * 100) + " %" : "—") + '</b><div class="eqbar"><i style="width:' + Math.round(pv.chance * 100) + '%"></i></div></div>' : '<p class="oplock">🔒 ' + esc(un.why) + "</p>") +
      prepHtml(s, o, un.ok && !busy) + '<div class="eqbtn"><button class="btn' + (can ? "" : " off") + '" data-a="go" data-id="' + o.id + '"' + (can ? "" : " disabled") + ">Lancer l’opération</button>" + (un.ok && !ui.team.length ? '<small class="muted">Choisis au moins un équipier ci-dessus.</small>' : "") + (busy && un.ok ? '<small class="muted">Une opération est déjà en cours.</small>' : "") + "</div></article>";
  }
  function reportCard(s) {
    var r = Q.st(s).report; if (!r) return ""; var o = Q.op(r.op); if (!o) return "";
    var title = r.crit ? "Réussite éclatante" : r.ok ? "Réussite" : r.near ? "Échec de justesse" : "Échec";
    var low = null; ST.forEach(function (k) { var ratio = r.need[k] > 0 ? r.tot[k] / r.need[k] : 2; if (!low || ratio < low.ratio) low = { k: k, ratio: ratio }; });
    var why = r.ok ? (low && low.ratio < 1 ? "Malgré une " + D.STATS[low.k].toLowerCase() + " juste (" + n1(r.tot[low.k]) + " / " + r.need[low.k] + "), le tirage a été favorable." : "L’équipe couvrait toutes les exigences.") : (low && low.ratio < 1 ? "Le point faible : " + D.STATS[low.k].toLowerCase() + " (" + n1(r.tot[low.k]) + " pour " + r.need[low.k] + " demandés)." : "Les statistiques étaient suffisantes : le tirage a été défavorable.");
    var lines = ['Chances annoncées : ' + Math.round(r.chance * 100) + " %. Tirage : " + r.roll + " (réussi si inférieur à " + Math.round(r.chance * 100) + ").", why];
    ST.forEach(function (k) { lines.push(D.STATS[k] + " : " + n1(r.tot[k]) + " / " + r.need[k] + (r.tot[k] + 1e-9 >= r.need[k] ? " ✓" : " ✗")); });
    if (r.money > 0) lines.push("Argent : +" + money(r.money) + (r.near ? " (part réduite)" : ""));
    r.loot.forEach(function (id) { var it = Q.item(id); lines.push("Butin : " + it.name + " (" + D.RAR[it.rar] + ")"); });
    r.sold.forEach(function (id) { var it = Q.item(id); lines.push("Arsenal plein : " + it.name + " vendu automatiquement"); });
    r.hurt.forEach(function (id) { lines.push(memberName(id) + " est blessé : indisponible un moment (jamais perdu)."); });
    if (!r.hurt.length) lines.push("Aucun blessé.");
    if (r.fx) { var fi2 = BL.factions && BL.factions.info(r.fx.fac); lines.push((fi2 ? fi2.name : "La faction visée") + " : influence " + (r.fx.pow > 0 ? "+" : "") + n1(r.fx.pow) + " %, relation " + (r.fx.rel > 0 ? "+" : "") + n1(r.fx.rel) + "."); }
    lines.push("Usure du matériel utilisé : −" + n1(r.wear) + " points de solidité.");
    return '<div class="card oprep ' + (r.ok ? "win" : "lose") + '"><div class="mh"><h2>Dernier compte rendu : ' + esc(o.name) + " : " + title + '</h2></div>' + art(o, r.ok ? "Réussi" : "Raté") + '<ul class="oplines">' + lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></div>";
  }
  function renderOps(force) {
    var root_ = $("v_ops"); if (!root_ || (!force && root_.hidden)) return; var e = Q.st(S), stt = Q.status(S);
    var sig = JSON.stringify([e.op, stt.state, ui.team, ui.fop, ui.last, ui.fam, e.report && e.report.at, (BL.factions ? D.OPS.map(function (o) { return o.fac ? BL.factions.allied(S, o.fac) : 0; }) : 0), D.OPS.filter(function (o) { return o.fac; }).map(function (o) { return Math.round(BL.factions && BL.factions.rel(S, o.fac) || 0); }), e.inv.map(function (x) { return x.id + x.on + Math.round(x.w); }), Object.keys(e.hurt).map(function (k) { return Q.isHurt(S, k) ? 1 : 0; }), BL.economy.level(S), BL.crew && BL.crew.owned(S).length, Math.floor(S.t / 5) * (Object.keys(e.hurt).some(function (k) { return Q.isHurt(S, k); }) ? 1 : 0)]);
    if (!force && sig === ui.osig) { liveBar(); return; } ui.osig = sig; var keep = root_.scrollTop, busy = stt.state !== "none";
    var cur = "";
    if (stt.state !== "none") {
      var o = stt.def, tm_ = e.op.ids.map(function (id) { return esc(lastName(id)); }).join(", ");
      cur = '<div class="card opnow ' + stt.state + '"><div class="mh"><h2>' + (stt.state === "ready" ? "L’équipe est de retour" : "Opération en cours : " + esc(o.name)) + '</h2></div>' + art(o) + '<p class="muted">Équipe : ' + tm_ + ". Chances annoncées : " + Math.round(e.op.chance * 100) + " %.</p>" +
        (stt.state === "ready" ? '<div class="eqbtn"><button class="btn can" data-a="claim">Récupérer le butin</button></div>' : '<div class="eqbar big"><i id="opBar" style="width:0"></i></div><p id="opLeft" class="muted"></p><div class="eqbtn"><button class="btn ghost" data-a="cancel">Annuler (l’équipe revient, rien n’est perdu)</button></div>') + "</div>";
    }
    var intro = '<div class="card eqhead"><div class="mh"><h2>Comment ça marche</h2></div><p class="muted eqintro">Choisis ton équipe (jusqu’à ' + D.params.maxTeam + " équipiers), vérifie les chances, puis lance. Le résultat dépend des statistiques de l’équipe, équipement compris, et d’une part de hasard bornée (jamais moins de " + Math.round(D.params.chanceMin * 100) + " %, jamais plus de " + Math.round(D.params.chanceMax * 100) + " %). Un équipier blessé reste indisponible un moment, jamais perdu. L’opération se termine toute seule, même si tu es sur une autre page, et avance aussi pendant ton absence : le compte rendu s’affiche dès que l’équipe est de retour.</p></div>";
    var team = '<div class="card"><div class="mh"><h2>Équipe de l’opération</h2><span class="muted">' + ui.team.length + " / " + D.params.maxTeam + "</span></div>" + teamBar(S) + "</div>";
    var fams = Object.keys(D.FAMS), tabs = '<div class="card"><div class="optabs" role="group" aria-label="Familles d’opérations">' + fams.map(function (k) { return '<button class="optab' + (ui.fam === k ? " on" : "") + '" data-a="fam" data-fam="' + k + '" aria-pressed="' + (ui.fam === k) + '">' + esc(D.FAMS[k].name) + "</button>"; }).join("") + '</div><p class="muted">' + esc(D.FAMS[ui.fam].text) + "</p></div>";
    root_.innerHTML = intro + cur + team + tabs + Q.opsList().filter(function (o) { return o.fam === ui.fam; }).map(function (o) { return opCard(S, o, busy); }).join("") + reportCard(S); root_.scrollTop = keep; restoreFocus(root_); liveBar();
  }
  function liveBar() {
    var stt = Q.status(S); if (stt.state !== "running") return; var bar = $("opBar"), lf = $("opLeft"); if (!bar || !lf) return; var o = stt.op, tot = Math.max(1, o.end - o.start);
    bar.style.width = Math.min(100, ((S.t - o.start) / tot) * 100) + "%"; var t = "Retour dans " + tm(stt.left); if (lf.textContent !== t) lf.textContent = t;
  }

  /* ---------- butin : fenêtre d'ouverture ---------- */
  function showReveal(r) {
    var box = $("lootRev"); if (!box) { box = doc.createElement("div"); box.id = "lootRev"; box.className = "lootrev"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Résultat de l’opération"); box.hidden = true; doc.body.appendChild(box); }
    var o = Q.op(r.op), title = r.crit ? "Réussite éclatante !" : r.ok ? "Opération réussie" : r.near ? "Échec de justesse" : "Opération ratée", ids = r.loot.concat(r.sold);
    var cards = ids.map(function (id, i) { var it = Q.item(id); return '<div class="lootc rar' + it.rar + '" style="--rc:' + D.RCOL[it.rar] + ";--d:" + (0.35 + i * 0.35) + 's"><div class="lootin">' + icon(it, true) + "<b>" + esc(it.name) + "</b><small>" + D.SLOTS[it.slot] + " · " + D.RAR[it.rar] + "</small><span class=\"eqsts\">" + chips(it.st) + "</span>" + (r.sold.indexOf(id) >= 0 && r.loot.indexOf(id) < 0 ? "<em>Arsenal plein : vendu automatiquement</em>" : "") + "</div></div>"; }).join("");
    box.innerHTML = '<div class="lootbox"><h2>' + esc(o.name) + "</h2><p class=\"lootres " + (r.ok ? "win" : "lose") + '">' + title + '</p><p class="muted">' + (r.money > 0 ? "Argent : +" + money(r.money) + ". " : "") + (r.hurt.length ? r.hurt.map(lastName).join(", ") + " blessé : de retour bientôt. " : "") + "</p>" + (cards ? '<div class="lootrow">' + cards + "</div>" : "") + '<div class="eqbtn"><button class="btn can" id="lootOk">Continuer</button></div></div>';
    box.hidden = false; $("lootOk").focus(); $("lootOk").onclick = function () { box.hidden = true; if (BL.equipUI && BL.equipUI._after) BL.equipUI._after(); };
    box.onkeydown = function (e) { if (e.key === "Escape") $("lootOk").click(); };
  }

  /* ---------- déposer : une seule règle (BL.equip.moveTo), quel que soit le geste ---------- */
  function memberTxt(id) { return memberName(id); }
  function doDrop(i, t) {
    var x = Q.st(S).inv[i]; if (!x) { ui.grab = null; renderArsenal(true); return; } var it = Q.item(x.id), before = x.on, res;
    if (t.kind === "inv") { var okU = h.eqUnequip(i); ui.msg = okU ? it.name + " remis à l’inventaire." : "Impossible : " + (before && Q.locked(S, before) ? memberTxt(before) + " est en mission." : "objet introuvable."); }
    else { res = h.eqMove(i, t.m, t.sl); if (res && res.ok) { var sw = res.swapped >= 0 ? Q.item(Q.st(S).inv[res.swapped].id).name : ""; ui.msg = it.name + " équipé sur " + memberTxt(t.m) + "." + (sw ? " " + sw + (res.from ? " passe à " + memberTxt(res.from) + "." : " retourne à l’inventaire.") : ""); } else ui.msg = "Impossible : " + ((res && res.reason) || "action refusée") + "."; }
    ui.grab = null; ui.pick = null; renderArsenal(true);
  }
  function markGrab() {
    var root_ = $("v_arsenal"); Array.prototype.forEach.call(root_.querySelectorAll(".dz-ok,.dz-no"), function (e) { e.classList.remove("dz-ok", "dz-no"); e.removeAttribute("data-why"); });
    if (ui.grab === null) return; targetsEl().forEach(function (el) { var r = canDropAt(ui.grab, infoOf(el)); el.classList.toggle("dz-ok", !!r.ok); el.classList.toggle("dz-no", !r.ok); el.dataset.why = r.ok ? "" : r.reason; });
  }
  function targetsEl() { return Array.prototype.slice.call($("v_arsenal").querySelectorAll(".eqsl[data-m], .eqm[data-m], .eqinv")); }
  function infoOf(el) { if (el.classList.contains("eqsl")) return { kind: "slot", m: el.dataset.m, sl: el.dataset.sl }; if (el.classList.contains("eqm")) return { kind: "member", m: el.dataset.m }; return { kind: "inv" }; }
  function canDropAt(i, t) {
    var x = Q.st(S).inv[i]; if (!x) return { ok: false, reason: "Objet introuvable" };
    if (t.kind === "inv") return x.on ? (Q.locked(S, x.on) ? { ok: false, reason: memberTxt(x.on) + " est en mission" } : { ok: true }) : { ok: false, reason: "Déjà dans l’inventaire" };
    return Q.canMove(S, i, t.m, t.kind === "slot" ? t.sl : undefined);
  }
  function setupDnD() {
    var a = $("v_arsenal"); if (!a || !BL.arsDnD) return;
    BL.arsDnD.init(a, {
      source: function (el) { var c = el.closest && el.closest("[data-dsrc]"); if (!c || !a.contains(c) || c.disabled) return null; if (el.closest && el.closest("button:not(.eqgrip):not(.eqsl)")) return null; return { i: +c.dataset.dsrc, el: c }; },
      targets: targetsEl, info: infoOf, canDrop: canDropAt,
      okText: function (i, t) { var it = Q.item(Q.st(S).inv[i].id); return t.kind === "inv" ? "Remettre à l’inventaire" : "Équiper " + it.name + " sur " + memberTxt(t.m); },
      ghost: function (src) { var x = Q.st(S).inv[src.i], it = x && Q.item(x.id); return it ? icon(it) + "<span>" + esc(it.name) + "</span>" : ""; },
      scroller: function () { return doc.scrollingElement; },
      drop: function (i, t) { doDrop(i, t); },
      onStart: function () { ui.grab = null; },
      onCancel: function (src, why) { ui.msg = why ? "Impossible : " + why + "." : "Déplacement annulé : rien n’a changé."; var l = $("eqLive"); if (l) l.textContent = ui.msg; }
    });
    a.addEventListener("keydown", function (e) { if (e.key === "Escape" && ui.grab !== null) { ui.grab = null; ui.msg = "Sélection annulée."; renderArsenal(true); } });
  }
  /* ---------- événements ---------- */
  function restoreFocus(scope) { if (!ui.focus) return; var e = scope.querySelector('[data-k="' + ui.focus + '"],[data-f="' + ui.focus + '"]'); if (e && e.focus) try { e.focus({ preventScroll: true }); } catch (x) { } }
  function onArsenal(e) {
    var f = e.target.closest && e.target.closest("[data-f]"); if (f && e.type === "change") { ui[f.dataset.f] = f.value; ui.focus = f.dataset.f; renderArsenal(true); return; }
    if (e.type !== "click") return; var b = e.target.closest("[data-a]"); if (!b || b.disabled) { var sm = e.target.closest("summary"); if (sm) setTimeout(function () { var d = sm.parentNode; if (d.classList.contains("eqfins")) ui.fin = !!d.open; else ui.shop = !!d.open; }, 0); return; }
    var a = b.dataset.a, i = +b.dataset.i; ui.focus = "";
    if (a === "grab") { ui.grab = ui.grab === i ? null : i; ui.pick = null; ui.msg = ui.grab === null ? "Sélection annulée." : "Objet sélectionné : choisis un emplacement."; ui.focus = b.dataset.k || ""; renderArsenal(true); markGrab(); return; }
    if (a === "gcancel") { ui.grab = null; ui.msg = "Sélection annulée."; renderArsenal(true); return; }
    if (a === "gunequip") { var gi = ui.grab; ui.grab = null; var okU = h.eqUnequip(gi); ui.msg = okU ? "Objet remis à l’inventaire." : "Impossible de retirer cet objet."; renderArsenal(true); return; }
    if (a === "slot") {
      var tm_ = b.dataset.m, sl_ = b.dataset.sl;
      if (ui.grab !== null) { var gi2 = ui.grab; doDrop(gi2, { kind: "slot", m: tm_, sl: sl_ }); return; }
      if (b.dataset.i !== undefined) { ui.grab = +b.dataset.i; ui.msg = "Objet sélectionné : choisis un emplacement, ou remets-le à l’inventaire."; ui.focus = b.dataset.k || ""; renderArsenal(true); markGrab(); return; }
      ui.slot = sl_; ui.pick = null; renderArsenal(true); return;
    }
    if (a === "pick") { ui.pick = i; ui.grab = null; renderArsenal(true); var p = $("v_arsenal").querySelector(".eqpick"); if (p) { p.scrollIntoView({ block: "nearest" }); var fb = p.querySelector("button[data-a=equip]:not([disabled])"); if (fb) fb.focus({ preventScroll: true }); } }
    else if (a === "pickx") { ui.pick = null; renderArsenal(true); }
    else if (a === "equip") { if (h.eqEquip(i, b.dataset.m)) ui.pick = null; renderArsenal(true); }
    else if (a === "unequip") { h.eqUnequip(i); renderArsenal(true); }
    else if (a === "repair") { h.eqRepair(i); renderArsenal(true); }
    else if (a === "repairall") { h.eqRepairAll(); renderArsenal(true); }
    else if (a === "expand") { h.eqExpand(); renderArsenal(true); }
    else if (a === "buy") { h.eqBuy(b.dataset.id); renderArsenal(true); }
    else if (a === "finbuy") { ui.fin = true; h.finBuy(b.dataset.id); renderArsenal(true); }
    else if (a === "finset") { ui.fin = true; h.finSet(b.dataset.id); renderArsenal(true); }
    else if (a === "fslot") { ui.slot = b.dataset.v; ui.focus = b.dataset.k; renderArsenal(true); }
    else if (a === "frar") { ui.rar = b.dataset.v; ui.focus = b.dataset.k; renderArsenal(true); }
    else if (a === "fsort") { ui.sort = b.dataset.v; ui.focus = b.dataset.k; renderArsenal(true); }
    else if (a === "freset") { ui.slot = "all"; ui.rar = "all"; ui.sort = "rar"; ui.focus = "fslotall"; renderArsenal(true); }
    else if (a === "sell") {
      var x = Q.st(S).inv[i]; if (!x) return; var it = Q.item(x.id), v = Q.sellValue(S, x.id, !!x.b);
      if (it.rar >= 1) BL.sysUI.modal({ title: "Vendre cet objet ?", text: "« " + it.name + " » (" + D.RAR[it.rar] + ") sera vendu " + money(v) + ". Cette vente est définitive.", ok: "Vendre", danger: true, onOk: function () { h.eqSell(i); renderArsenal(true); } });
      else { h.eqSell(i); renderArsenal(true); }
    }
  }
  function onOps(e) {
    if (e.type !== "click") return; var b = e.target.closest("[data-a]");
    if (!b) { var oc = e.target.closest(".opc"); if (oc && oc.dataset.op && oc.dataset.op !== ui.fop) { ui.fop = oc.dataset.op; renderOps(true); } return; }
    if (b.disabled) return; var a = b.dataset.a;
    if (a === "fam") { ui.fam = b.dataset.fam; ui.focus = ""; renderOps(true); }
    else if (a === "team") { var m = b.dataset.m, k = ui.team.indexOf(m); if (k >= 0) ui.team.splice(k, 1); else if (ui.team.length < D.params.maxTeam) ui.team.push(m); ui.focus = "tm" + m; b.dataset.k = "tm" + m; renderOps(true); }
    else if (a === "best") { var fo = focusOp(S); if (fo) { ui.team = Q.bestTeam(S, fo).ids; ui.focus = ""; } renderOps(true); }
    else if (a === "last") { ui.team = ui.last.filter(function (id) { return Q.available(S, id); }); renderOps(true); }
    else if (a === "clear") { ui.team = []; renderOps(true); }
    else if (a === "foc") { ui.fop = b.dataset.id; renderOps(true); }
    else if (a === "mplan" || a === "mlock") { var oid = b.dataset.id, o8 = Q.op(oid), kind = a === "mplan" ? "plan" : "lockpick", pv8 = Q.preview(S, o8, ui.team);
      BL.minigames.open(kind, { title: o8.name, op: oid, base: ui.team.length ? pv8.chance - BL.minigames.opBonus(S, oid) : null, reward: kind === "plan" ? "Récompense : 0 à +10 points de chance pour ce lancement ; chaleur de +1 (plan bâclé) à −3." : "Récompense : jusqu’à +5 points de chance et −1 de chaleur pour ce lancement.", onClose: function () { renderOps(true); } },
        function (sc) { var r = h.miniPrep(oid, kind, sc); return r ? { text: "Préparation enregistrée : +" + Math.round(r.b * 100) + " points de chance, chaleur " + (r.h > 0 ? "+" + r.h : r.h < 0 ? "−" + (-r.h) : "0") + " après l’opération." } : null; }); }
    else if (a === "go") { var tm0 = ui.team.slice(); if (h.opStart(b.dataset.id, tm0)) { saveLast(tm0); ui.team = []; ui.focus = ""; } renderOps(true); }
    else if (a === "cancel") { h.opCancel(); renderOps(true); }
    else if (a === "claim") { var r = h.opClaim(); renderOps(true); if (r) { var o9 = Q.op(r.op); if (!(BL.opsSceneUI && BL.opsSceneUI.play(r, o9, function () { showReveal(r); }))) showReveal(r); } }
  }

  function init(handlers, util) {
    h = handlers; u = util; Q = BL.equip; D = BL.data.equip; ui.last = lastTeam();
    var a = $("v_arsenal"), o = $("v_ops"); if (a) { a.addEventListener("click", onArsenal); a.addEventListener("change", onArsenal); setupDnD(); } if (o) o.addEventListener("click", onOps);
  }
  function update(s) { S = s; if (!Q) return; if (vis("v_arsenal")) renderArsenal(false); if (vis("v_ops")) renderOps(false); }
  BL.equipUI = { init: init, update: update, icon: icon, art: art, render: function () { if (S) { renderArsenal(true); renderOps(true); } }, team: function () { return ui.team; }, reveal: showReveal, _ui: ui, _after: null };
})(typeof window !== "undefined" ? window : globalThis);
