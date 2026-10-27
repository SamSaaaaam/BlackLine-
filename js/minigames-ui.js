/* Partie 17 · E : interface commune des mini-jeux (une fenêtre par-dessus l'écran d'origine : on y revient sans rien perdre).
   Déroulé : présentation (2 lignes + récompense) → jouer ou « Résoudre automatiquement » (résultat moyen) → score lisible → retour.
   Tout se joue au clavier (Tab, Entrée, Espace, flèches) et au toucher (boutons ≥ 40 px). Mouvements réduits : aucun déplacement animé
   (le crochetage se joue alors pas à pas avec les flèches). Les règles et les récompenses sont dans BL.minigames (minigames.js). */
(function (root) {
  var BL = root.BL = root.BL || {}, doc = root.document, M = null, el = {}, cur = null, raf = 0, timer = 0, from = null;
  function L() { return BL.minigames; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function still() { var b = doc.body; return b.classList.contains("nomotion") || (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function pct(x) { return Math.round(x * 100) + " %"; }
  var INFO = {
    lockpick: { t: "Crochetage", i: ["Cale les 5 goupilles une par une : appuie sur « Caler » (ou Espace) quand le repère passe dans la zone dorée.", "Trois ratés et le ressort lâche : tu gardes ce qui est déjà calé. Rien n’est jamais perdu."] },
    plan: { t: "Plan du coup", i: ["Pour chaque phase, choisis une approche et le rôle qui s’en charge.", "La chance et la chaleur affichées changent à chaque choix : vise le moins de risque, avec le bon rôle au bon endroit."] },
    interro: { t: "Interrogatoire", i: ["Pose la question que ton dossier permet de vérifier, puis juge la réponse : vraie, ou mensonge ?", "Une banalité ne rapporte presque rien ; un bon jugement rapporte tout."] },
    compta: { t: "Comptabilité avec Gino", i: ["Gino a recopié les reçus dans le registre… avec deux erreurs. Coche les lignes où le registre ne colle pas au reçu.", "Une ligne cochée à tort coûte un demi-point."] },
    foreman: { t: "Contremaître", i: ["Répartis tes 6 ouvriers sur les trois tâches du chantier selon leurs besoins, avant la fin du temps.", "Bien réparti : jusqu’à −20 % du temps restant (au moins −5 %, jamais de pénalité)."] }
  };
  function build() {
    if (M) return; M = doc.createElement("div"); M.id = "mini"; M.className = "mini"; M.hidden = true; M.setAttribute("role", "dialog"); M.setAttribute("aria-modal", "true"); M.setAttribute("aria-labelledby", "miniT");
    M.innerHTML = '<div class="mini-box"><header class="mini-h"><h2 id="miniT"></h2><button type="button" class="mini-x" aria-label="Quitter sans jouer">&times;</button></header><div class="mini-in"></div><div class="mini-body"></div><footer class="mini-f"><p class="mini-sc" role="status" aria-live="polite"></p><div class="mini-acts"></div></footer></div>';
    doc.body.appendChild(M); el = { t: M.querySelector("#miniT"), x: M.querySelector(".mini-x"), intro: M.querySelector(".mini-in"), body: M.querySelector(".mini-body"), sc: M.querySelector(".mini-sc"), acts: M.querySelector(".mini-acts") };
    el.x.onclick = function () { close(null); };
    M.addEventListener("click", function (e) { var b = e.target.closest("button[data-m]"); if (!b || b.disabled || !cur) return; act(b.dataset.m, b); });
    root.addEventListener("keydown", function (e) {
      if (!cur || M.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(null); return; }
      if (e.key === "Tab") { var f = Array.prototype.filter.call(M.querySelectorAll("button,select,input"), function (x) { return !x.disabled && x.offsetParent !== null; }); if (f.length) { var i = f.indexOf(doc.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } } }
      if (cur.kind === "lockpick" && cur.phase === "play") {
        if (e.key === " " && !(e.target && e.target.closest && e.target.closest("button:not([data-m=set])"))) { e.preventDefault(); act("set"); }
        if (cur.still && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); act(e.key === "ArrowLeft" ? "left" : "right"); }
      }
    }, true);
  }
  function focusFirst() { var f = M.querySelector(".mini-body button:not([disabled]), .mini-acts button:not([disabled])"); if (f) f.focus(); }
  /* ouvre un mini-jeu. ctx : données d'affichage (titre, chance de base…) ; apply(score) applique la récompense et renvoie { text } (ou null : impossible) */
  function open(kind, ctx, apply) {
    if (!INFO[kind]) return false; build(); stopLoops(); from = doc.activeElement; ctx = ctx || {};
    var s = BL.main && BL.main.state ? BL.main.state() : null, seed = ctx.seed !== undefined ? ctx.seed >>> 0 : s ? L().seedFor(s, kind + (ctx.who || ctx.op || "")) : 1;
    cur = { kind: kind, ctx: ctx, apply: apply, seed: seed, phase: "intro", still: still() };
    el.t.textContent = INFO[kind].t + (ctx.title ? " · " + ctx.title : ""); M.hidden = false; doc.body.classList.add("inmini"); intro(); return true;
  }
  function intro() {
    var c = cur, k = c.kind, extra = "";
    if (k === "compta") extra = '<div class="mini-modes" role="group" aria-label="But de la séance"><button type="button" class="btn' + (c.mode !== "inc" ? " on" : "") + '" data-m="mode" data-v="heat" aria-pressed="' + (c.mode !== "inc") + '">Effacer des traces (chaleur −2 à −10)</button><button type="button" class="btn' + (c.mode === "inc" ? " on" : "") + '" data-m="mode" data-v="inc" aria-pressed="' + (c.mode === "inc") + '">Optimiser (revenus +1 à +6 % pendant 10 min)</button></div>';
    el.intro.innerHTML = '<p class="mini-l">' + esc(INFO[k].i[0]) + '</p><p class="mini-l">' + esc(INFO[k].i[1]) + "</p>" + (c.ctx.reward ? '<p class="mini-rw">' + esc(c.ctx.reward) + "</p>" : "") + extra;
    el.body.innerHTML = ""; el.sc.textContent = "";
    el.acts.innerHTML = '<button type="button" class="btn buy can" data-m="start">Jouer</button><button type="button" class="btn" data-m="auto">Résoudre automatiquement (résultat moyen)</button><button type="button" class="btn ghost" data-m="quit">Retour</button>';
    focusFirst();
  }
  function act(a, b) {
    var c = cur; if (!c) return;
    if (a === "quit") return close(null);
    if (a === "mode") { c.mode = b.dataset.v === "inc" ? "inc" : "heat"; intro(); var f = M.querySelector('[data-m="mode"][data-v="' + c.mode + '"]'); if (f) f.focus(); return; }
    if (a === "auto") return finish(L().AUTO, true);
    if (a === "start") { c.phase = "play"; el.intro.innerHTML = ""; el.acts.innerHTML = '<button type="button" class="btn ghost" data-m="quit">Abandonner (aucun effet)</button>'; GAMES[c.kind].start(c); return; }
    if (a === "done") return close(c.result);
    if (c.phase === "play" && GAMES[c.kind].act) GAMES[c.kind].act(c, a, b);
  }
  function finish(score, auto) {
    var c = cur; stopLoops(); c.phase = "result"; var r = null; try { r = c.apply ? c.apply(score, c) : { text: "" }; } catch (e) { r = null; }
    c.result = { score: score, auto: !!auto, applied: !!r };
    el.intro.innerHTML = ""; el.body.innerHTML = '<div class="mini-res"><b>' + (auto ? "Résolu automatiquement" : "Score : " + pct(score)) + "</b><p>" + esc(r ? r.text || "" : "Rien n’a pu être appliqué cette fois (la situation a changé entre-temps).") + "</p></div>";
    el.sc.textContent = auto ? "Résultat moyen appliqué." : "Score " + pct(score) + ".";
    el.acts.innerHTML = '<button type="button" class="btn buy can" data-m="done">Retour</button>'; focusFirst();
  }
  function close(res) { stopLoops(); var c = cur; cur = null; if (M) M.hidden = true; doc.body.classList.remove("inmini"); try { if (from && from.focus && doc.contains(from)) from.focus(); } catch (e) {} if (c && c.ctx && c.ctx.onClose) c.ctx.onClose(res); }
  function stopLoops() { if (raf) root.cancelAnimationFrame(raf); raf = 0; clearInterval(timer); timer = 0; }

  /* ---------- 1. crochetage ---------- */
  var GAMES = {};
  GAMES.lockpick = {
    start: function (c) { c.p = L().genLock(c.seed); c.presses = []; c.pos = 0.08; c.t0 = 0; this.paint(c); if (!c.still) { var self = this; var loop = function (ts) { if (!cur || cur !== c || c.phase !== "play") return; if (!c.t0) c.t0 = ts; var pin = c.p.pins[Math.min(c.k || 0, 4)], ph = (ts - c.t0) / 1000 * pin.sp; c.pos = 0.5 - 0.48 * Math.cos(ph * Math.PI); self.marker(c); raf = root.requestAnimationFrame(loop); }; raf = root.requestAnimationFrame(loop); } },
    paint: function (c) {
      var r = L().scoreLock(c.p, c.presses); c.k = r.set; var pin = c.p.pins[Math.min(r.set, 4)], o = '<div class="lp-pins" aria-label="Goupilles">';
      c.p.pins.forEach(function (q, i) { o += '<span class="lp-pin' + (i < r.set ? " ok" : i === r.set ? " cur" : "") + '"><i></i><small>' + (i + 1) + "</small></span>"; });
      o += '</div><div class="lp-track" aria-hidden="true"><span class="lp-zone" style="left:' + ((pin.c - pin.w / 2) * 100).toFixed(1) + "%;width:" + (pin.w * 100).toFixed(1) + '%"></span><span class="lp-mark"></span></div>'
        + '<p class="lp-st" role="status">Goupilles calées : ' + r.set + " / 5 · ratés : " + r.miss + " / 3" + (c.still ? ' · <b class="lp-feel"></b>' : "") + "</p>"
        + '<div class="lp-ctl">' + (c.still ? '<button type="button" class="btn" data-m="left" aria-label="Repère vers la gauche">◀</button>' : "") + '<button type="button" class="btn buy can lp-set" data-m="set">Caler (Espace)</button>' + (c.still ? '<button type="button" class="btn" data-m="right" aria-label="Repère vers la droite">▶</button>' : "") + "</div>";
      el.body.innerHTML = o; this.marker(c); el.sc.textContent = "Score provisoire : " + pct(r.score);
      var f = el.body.querySelector(".lp-set"); if (f) f.focus();
    },
    marker: function (c) { var m = el.body.querySelector(".lp-mark"); if (m) m.style.left = (c.pos * 100).toFixed(1) + "%"; var fe = el.body.querySelector(".lp-feel"); if (fe) { var pin = c.p.pins[Math.min(c.k || 0, 4)], d = Math.abs(c.pos - pin.c); fe.textContent = d <= pin.w / 2 ? "ça accroche" : d <= pin.w ? "ça frotte" : "rien"; } },
    act: function (c, a) {
      if (a === "left" || a === "right") { c.pos = Math.max(0, Math.min(1, c.pos + (a === "left" ? -0.04 : 0.04))); this.marker(c); return; }
      if (a !== "set") return; c.presses.push(c.pos); var r = L().scoreLock(c.p, c.presses); if (c.still) c.pos = 0.08; c.t0 = 0; if (r.done) return finish(r.score); this.paint(c);
    }
  };
  /* ---------- 2. plan du coup ---------- */
  GAMES.plan = {
    start: function (c) { c.p = L().genPlan(c.seed); c.ch = { opt: [-1, -1, -1], role: [-1, -1, -1] }; this.paint(c); },
    paint: function (c) {
      var base = typeof c.ctx.base === "number" ? c.ctx.base : null, complete = c.ch.opt.every(function (x) { return x >= 0; }) && c.ch.role.every(function (x) { return x >= 0; }), r = L().scorePlan(c.p, c.ch), o = "";
      c.p.phases.forEach(function (ph, i) {
        o += '<fieldset class="pl-ph"><legend>' + esc(ph.name) + '</legend><div class="pl-row" role="group" aria-label="Approche">' + ph.opts.map(function (q, j) { var on = c.ch.opt[i] === j; return '<button type="button" class="pl-o' + (on ? " on" : "") + '" data-m="opt" data-i="' + i + '" data-j="' + j + '" aria-pressed="' + on + '"><b>' + esc(q.label) + "</b><small>risque " + Math.round(q.risk * 100) + " % · chaleur " + (q.heat ? "+" + q.heat : "0") + "</small></button>"; }).join("") + "</div>"
          + '<div class="pl-row" role="group" aria-label="Rôle">' + c.p.roles.map(function (rn, j) { var on = c.ch.role[i] === j; return '<button type="button" class="pl-r' + (on ? " on" : "") + '" data-m="role" data-i="' + i + '" data-j="' + j + '" aria-pressed="' + on + '">' + esc(rn) + "</button>"; }).join("") + "</div></fieldset>";
      });
      o += '<p class="pl-sum" role="status">' + (base !== null ? "Chance affichée : " + Math.round(base * 100) + " % → <b>" + Math.round(Math.min(0.95, base + r.chance) * 100) + " %</b>" : "Bonus de chance : <b>+" + Math.round(r.chance * 100) + " points</b>") + " · chaleur après l’opération : <b>" + (r.heat > 0 ? "+" + r.heat : r.heat < 0 ? "−" + (-r.heat) : "0") + "</b></p>";
      o += '<div class="pl-go"><button type="button" class="btn buy can" data-m="ok"' + (complete ? "" : " disabled") + ">Valider le plan</button>" + (complete ? "" : '<small class="muted">Choisis une approche et un rôle pour chaque phase.</small>') + "</div>";
      el.body.innerHTML = o; el.sc.textContent = "Qualité du plan : " + pct(r.score);
    },
    act: function (c, a, b) {
      if (a === "opt" || a === "role") { var i = +b.dataset.i, j = +b.dataset.j; c.ch[a][i] = j; this.paint(c); var f = el.body.querySelector('[data-m="' + a + '"][data-i="' + i + '"][data-j="' + j + '"]'); if (f) f.focus(); return; }
      if (a === "ok") finish(L().scorePlan(c.p, c.ch).score);
    }
  };
  /* ---------- 3. interrogatoire ---------- */
  GAMES.interro = {
    start: function (c) { c.p = L().genInterro(c.seed, c.ctx.who || "indic"); c.k = 0; c.ans = []; c.stage = "ask"; this.paint(c); },
    paint: function (c) {
      var p = c.p, r = p.rounds[c.k], o = '<div class="in-grid"><aside class="in-dos"><h3>Ton dossier</h3><ul>' + p.dossier.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + '</ul></aside><div class="in-main"><p class="in-who">' + esc(p.intro) + '</p><p class="in-n">Question ' + (c.k + 1) + " sur " + p.rounds.length + "</p>";
      if (c.stage === "ask") o += '<div class="in-q" role="group" aria-label="Question à poser">' + r.qs.map(function (q, j) { return '<button type="button" class="btn" data-m="ask" data-j="' + j + '">« ' + esc(q) + " »</button>"; }).join("") + "</div>";
      else { var a = c.ans[c.k], good = a.q === r.good; o += '<blockquote class="in-a">« ' + esc(good ? r.answer : r.vague) + " »</blockquote>"; o += good ? '<div class="in-v" role="group" aria-label="Ton jugement"><button type="button" class="btn" data-m="judge" data-v="true">Il dit vrai</button><button type="button" class="btn" data-m="judge" data-v="lie">C’est un mensonge</button></div>' : '<p class="muted">Rien à vérifier dans cette réponse.</p><div class="in-v"><button type="button" class="btn" data-m="next">Question suivante</button></div>'; }
      el.body.innerHTML = o + "</div></div>"; el.sc.textContent = "Réponses jugées : " + c.ans.filter(function (x) { return x && x.v; }).length; var f = el.body.querySelector(".in-q button, .in-v button"); if (f) f.focus();
    },
    act: function (c, a, b) {
      if (a === "ask") { c.ans[c.k] = { q: +b.dataset.j }; c.stage = "answer"; return this.paint(c); }
      if (a === "judge") c.ans[c.k].v = b.dataset.v; if (a !== "judge" && a !== "next") return;
      c.k++; c.stage = "ask"; if (c.k >= c.p.rounds.length) return finish(L().scoreInterro(c.p, c.ans).score); this.paint(c);
    }
  };
  /* ---------- 4. comptabilité ---------- */
  GAMES.compta = {
    start: function (c) { c.p = L().genCompta(c.seed); c.sel = []; this.paint(c); },
    paint: function (c) {
      var money = function (n) { return "$" + n; }, o = '<table class="ac-t"><caption class="sr">Registre de Gino : coche les lignes fausses</caption><thead><tr><th scope="col">Poste</th><th scope="col">Registre</th><th scope="col">Reçu</th><th scope="col">Erreur ?</th></tr></thead><tbody>';
      c.p.lines.forEach(function (l, i) { var on = c.sel.indexOf(i) >= 0; o += "<tr" + (on ? ' class="on"' : "") + "><th scope=\"row\">" + esc(l.label) + "</th><td>" + money(l.book) + "</td><td>" + money(l.receipt) + '</td><td><button type="button" class="ac-b" data-m="tog" data-i="' + i + '" aria-pressed="' + on + '" aria-label="Ligne ' + esc(l.label) + (on ? " : marquée fausse" : " : marquer comme fausse") + '">' + (on ? "✗ fausse" : "ok ?") + "</button></td></tr>"; });
      el.body.innerHTML = o + '</tbody></table><div class="pl-go"><button type="button" class="btn buy can" data-m="ok">Rendre le registre (' + c.sel.length + " ligne" + (c.sel.length > 1 ? "s" : "") + " cochée" + (c.sel.length > 1 ? "s" : "") + ")</button></div>"; el.sc.textContent = "Lignes cochées : " + c.sel.length;
    },
    act: function (c, a, b) {
      if (a === "tog") { var i = +b.dataset.i, k = c.sel.indexOf(i); if (k >= 0) c.sel.splice(k, 1); else c.sel.push(i); this.paint(c); var f = el.body.querySelector('[data-m="tog"][data-i="' + i + '"]'); if (f) f.focus(); return; }
      if (a === "ok") finish(L().scoreCompta(c.p, c.sel).score);
    }
  };
  /* ---------- 5. contremaître ---------- */
  GAMES.foreman = {
    start: function (c) { c.p = L().genForeman(c.seed); c.as = [0, 0, 0]; c.left = c.p.time; c.late = false; this.paint(c); var self = this; timer = setInterval(function () { if (!cur || cur !== c) return; c.left--; if (c.left <= 0) { c.late = true; clearInterval(timer); timer = 0; return finish(L().scoreForeman(c.p, c.as, true).score); } var tt = el.body.querySelector(".fm-time"); if (tt) tt.textContent = c.left + " s"; }, 1000); },
    paint: function (c) {
      var used = c.as.reduce(function (x, y) { return x + y; }, 0), o = '<p class="fm-h">Ouvriers disponibles : <b>' + (c.p.workers - used) + " / " + c.p.workers + '</b> · temps : <b class="fm-time">' + c.left + " s</b></p><ul class=\"fm-l\">";
      c.p.tasks.forEach(function (tk, i) { o += '<li><span class="fm-n"><b>' + esc(tk.name) + "</b><small>besoin : " + tk.need + " ouvrier" + (tk.need > 1 ? "s" : "") + '</small></span><span class="fm-c"><button type="button" class="btn" data-m="minus" data-i="' + i + '" aria-label="Retirer un ouvrier : ' + esc(tk.name) + '"' + (c.as[i] ? "" : " disabled") + '>−</button><b aria-live="polite">' + c.as[i] + '</b><button type="button" class="btn" data-m="plus" data-i="' + i + '" aria-label="Ajouter un ouvrier : ' + esc(tk.name) + '"' + (used < c.p.workers ? "" : " disabled") + ">+</button></span></li>"; });
      el.body.innerHTML = o + '</ul><div class="pl-go"><button type="button" class="btn buy can" data-m="ok">Lancer les équipes</button></div>'; el.sc.textContent = "Réduction prévue : −" + Math.round(L().scoreForeman(c.p, c.as).pct * 100) + " %";
    },
    act: function (c, a, b) {
      if (a === "plus" || a === "minus") { var i = +b.dataset.i, used = c.as.reduce(function (x, y) { return x + y; }, 0); if (a === "plus" && used < c.p.workers) c.as[i]++; if (a === "minus" && c.as[i] > 0) c.as[i]--; this.paint(c); var f = el.body.querySelector('[data-m="' + a + '"][data-i="' + i + '"]:not([disabled])') || el.body.querySelector('[data-i="' + i + '"]:not([disabled])'); if (f) f.focus(); return; }
      if (a === "ok") finish(L().scoreForeman(c.p, c.as, false).score);
    }
  };
  function attach() { if (BL.minigames) { BL.minigames.open = open; BL.minigames.isOpen = function () { return !!cur; }; BL.minigames._ui = function () { return cur ? { kind: cur.kind, phase: cur.phase, seed: cur.seed, still: cur.still, p: cur.p } : null; }; } }
  attach();
  BL.minigamesUI = { open: open, close: function () { close(null); }, attach: attach };
})(typeof globalThis !== "undefined" ? globalThis : this);
