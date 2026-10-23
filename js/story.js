/* Fil narratif (chantier 16) : logique pure. Un chapitre par palier de design, annoncé UNE seule fois (s.story.seen = ["ch:<palier>"]).
   Jamais de dialogue bloquant : le chapitre part dans le Journal (BL.economy.addLog) et dans la notification de déblocage existante. */
(function (root) {
  var BL = root.BL = root.BL || {};
  function list() { return (BL.data && BL.data.story) || []; }
  function chapter(t) { var L = list(); for (var i = 0; i < L.length; i++) if (L[i].t === t) return L[i]; return null; }
  function seenArr(s) { if (!s.story || !Array.isArray(s.story.seen)) s.story = { seen: [] }; return s.story.seen; }
  function isSeen(s, t) { return seenArr(s).indexOf("ch:" + t) >= 0; }
  function name(c) { var C = BL.data && BL.data.crew && BL.data.crew.members, i; if (C) for (i = 0; i < C.length; i++) if (C[i].id === c.who) return C[i].name.split(" ")[0]; return c.who; }
  /* Palier atteint : renvoie les chapitres nouveaux (≤ t, jamais vus), les marque vus. Le dernier est celui qu'on annonce. */
  function reach(s, t) {
    var out = [], a = seenArr(s);
    list().forEach(function (c) { if (c.t <= t && a.indexOf("ch:" + c.t) < 0) { a.push("ch:" + c.t); out.push(c); } });
    return out;
  }
  function text(c) { return c.lines.join(" ") + " " + name(c) + " : « " + c.react + " »"; }
  function seenList(s) { return list().filter(function (c) { return isSeen(s, c.t); }); }
  BL.story = { chapter: chapter, reach: reach, isSeen: isSeen, text: text, name: name, seenList: seenList, count: function () { return list().length; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
