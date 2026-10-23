/* Profil du joueur (interface) : avatar, pseudo, statut. Affiche l'avatar et le statut dans l'en-tête, le menu et le profil.
   Les données viennent de settings (avatar, name) et de status.js ; rien n'est stocké ici. */
(function (root) {
  var BL = root.BL = root.BL || {}, cur = { name: "", avatar: "fedora" }, lastLevel = 1;
  function $(id) { return document.getElementById(id); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function avatar(id, size) { return BL.avatars.render(BL.avatars.has(id) ? id : BL.avatars.DEFAULT, size); }
  function level() { return lastLevel; }
  /* En-tête : avatar + pseudo, et « Niveau N · Statut » sous le pseudo. */
  function header(L) {
    lastLevel = L || lastLevel; var st = BL.status.of(lastLevel), av = $("empAv"), nm = $("empName");
    if (av && av.dataset.id !== cur.avatar) { av.dataset.id = cur.avatar; av.innerHTML = avatar(cur.avatar, 34); }
    if (nm) { var v = cur.name || (BL.data && BL.data.empireName) || ""; if (nm.textContent !== v) nm.textContent = v; }
    var lt = $("lvTxt"); if (lt) { var max = BL.data && lastLevel >= BL.data.balance.maxEmpireLevel, t = "Niveau " + lastLevel + (max ? " (max)" : "") + " · " + st.name; if (lt.textContent !== t) lt.innerHTML = '<span class="w">Niveau </span>' + lastLevel + (max ? '<span class="w"> (max)</span>' : "") + " · " + esc(st.name); }
  }
  function refresh(s) {
    if (s) { cur.name = s.name || ""; cur.avatar = s.avatar || "fedora"; } header();
    var h = $("mHello"); if (h) h.innerHTML = '<i class="mav">' + avatar(cur.avatar, 22) + "</i><span>" + (cur.name ? "Bienvenue, " + esc(cur.name) : "Bienvenue") + " · " + esc(BL.status.of(lastLevel).name) + "</span>";
  }
  /* Galerie d'avatars : boutons radio (clavier : flèches, Entrée), un seul choisi. */
  function picker(sel, onPick) {
    var box = document.createElement("div"); box.className = "avgrid"; box.setAttribute("role", "radiogroup"); box.setAttribute("aria-label", "Choisis ton avatar");
    BL.avatars.LIST.forEach(function (a) {
      var b = document.createElement("button"); b.type = "button"; b.className = "avb" + (a.id === sel ? " on" : ""); b.dataset.id = a.id; b.dataset.nosfx = "1"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", a.id === sel ? "true" : "false"); b.setAttribute("aria-label", a.name); b.title = a.name;
      b.innerHTML = avatar(a.id, 64) + "<span>" + esc(a.name) + "</span>";
      b.onclick = function () { Array.prototype.forEach.call(box.children, function (c) { var on = c === b; c.classList.toggle("on", on); c.setAttribute("aria-checked", on ? "true" : "false"); }); BL.audio && BL.audio.sfx("select"); onPick(a.id); };
      box.appendChild(b);
    });
    box.onkeydown = function (e) { var k = e.key, bs = Array.prototype.slice.call(box.children), i = bs.indexOf(document.activeElement); if (i < 0) return; var d = k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault(); bs[(i + d + bs.length) % bs.length].focus(); };
    return box;
  }
  /* Tableau des statuts, avec le statut actuel mis en avant. */
  function statusTable(L) {
    var cur2 = BL.status.index(L), max = BL.data ? BL.data.balance.maxEmpireLevel : 50;
    return '<ol class="stlist">' + BL.status.LIST.map(function (s, i) { return '<li class="' + (i < cur2 ? "past" : i === cur2 ? "now" : "") + '"><b>' + esc(s.name) + "</b><span>niveau " + s.lvl + (i === BL.status.LIST.length - 1 ? " (max " + max + ")" : "") + "</span></li>"; }).join("") + "</ol>";
  }
  BL.profile = { avatar: avatar, header: header, refresh: refresh, picker: picker, statusTable: statusTable, level: level, current: function () { return { name: cur.name, avatar: cur.avatar }; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
