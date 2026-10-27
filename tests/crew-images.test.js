/* Partie 17 · C : illustrations des personnages. 1) chaque image déclarée dans assets/crew/manifest.js existe (casse comprise) ;
   2) une variante absente retombe sur une autre variante du même personnage, puis sur le dessin SVG ; 3) les prompts couvrent les 13 personnages avec les négatifs obligatoires. */
const fs = require("fs"), path = require("path"), vm = require("vm"), { load, check, done, ROOT } = require("./_load");
const DIR = path.join(ROOT, "assets/crew"), files = fs.readdirSync(DIR);
/* 1. manifeste réel */
const { BL } = load({ extra: [] }), man = BL.crewImages || {}, OKF = /^[\w.-]+\.(webp|jpe?g|png)$/i;
let declared = 0;
Object.keys(man).forEach(pid => { if (pid === "focus") return; const raw = man[pid], def = typeof raw === "string" ? { card: raw } : raw;
  check(BL.data.crew.members.some(m => m.id === pid), "manifest : id connu « " + pid + " »");
  ["card", "thumb", "full"].forEach(v => { const f = def && def[v]; if (f === undefined) return; declared++; check(typeof f === "string" && OKF.test(f), pid + "." + v + " : nom de fichier valide (" + f + ")"); check(files.includes(f), pid + "." + v + " : fichier présent, casse comprise (" + f + ")"); }); });
console.log("  (" + declared + " image(s) déclarée(s) dans manifest.js)");
/* 2. repli : on simule un manifeste et un chargeur d'images (seuls certains fichiers « existent ») */
function sandbox(manifest, existing) {
  const ctx = { console, Math, JSON }, loaded = [];
  ctx.Image = function () { const im = this; Object.defineProperty(im, "src", { set(u) { loaded.push(u); if (existing.includes(u.replace("assets/crew/", ""))) setImmediate(() => im.onload && im.onload()); else setImmediate(() => im.onerror && im.onerror()); } }); };
  ctx.document = { querySelectorAll: () => [], createElement: () => ({}) }; ctx.globalThis = ctx; vm.createContext(ctx);
  ctx.BL = { crewImages: manifest };
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/portraits.js"), "utf8"), ctx); ctx.BL.portraits.probe(); return { P: ctx.BL.portraits, loaded };
}
(async () => {
  const look = BL.data.crew.members[0].look;
  let { P, loaded } = sandbox({ gino: { full: "gino_full.webp", card: "gino_card.webp", thumb: "gino_thumb.webp" }, maya: { full: "maya_full.webp" }, rocco: "rocco_card.webp", tom: { card: "../../etc/passwd" }, focus: {} }, ["gino_full.webp", "maya_full.webp"]);
  await new Promise(r => setTimeout(r, 20));
  check(P.imageUrl("gino", "full") === "assets/crew/gino_full.webp", "variante présente : utilisée");
  check(P.imageUrl("gino", "card") === "assets/crew/gino_full.webp", "card absente → retombe sur full");
  check(P.imageUrl("gino", "thumb") === "assets/crew/gino_full.webp", "thumb absente → retombe sur full (card absente aussi)");
  check(P.imageUrl("maya", "thumb") === "assets/crew/maya_full.webp" && P.hasImage("maya", "full"), "seule full déclarée : sert partout");
  check(!P.hasImage("rocco") && /data-src="svg"/.test(P.portrait(look, { id: "rocco", variant: "card" })), "fichier déclaré mais absent → dessin SVG");
  check(!loaded.some(u => /\.\.|passwd/.test(u)), "nom de fichier hostile ignoré (aucun chargement)");
  check(/data-src="image"/.test(P.portrait(look, { id: "gino", variant: "card" })), "image chargée → portrait image");
  check(/data-src="svg"/.test(P.portrait(look, { id: "samira", variant: "full" })), "aucune image → SVG");
  ({ P } = sandbox({ focus: {} }, [])); const svgFull = P.portrait(look, { id: "gino", variant: "full" }), svgCard = P.portrait(look, { id: "gino", variant: "card" });
  check(/sky/.test(svgFull) && /gb"/.test(svgFull) && !/sky/.test(svgCard), "repli SVG : décor « affiche » (ville côtière, traits dorés) seulement pour la grande illustration");
  const rocco = BL.data.crew.members.find(m => m.id === "rocco").look; check(/rotate\(-24 70 41\)/.test(P.portrait(rocco, {})), "accessoire « pansement » dessiné (Rocco)");
  /* tous les portraits se dessinent sans erreur, dans les 3 variantes */
  let ok = true; BL.data.crew.members.forEach(m => ["card", "thumb", "full"].forEach(v => { try { const s = P.portrait(m.look, { id: m.id, variant: v }); if (!/^<svg[\s\S]*<\/svg>$/.test(s) || /NaN|undefined/.test(s)) ok = false; } catch (e) { ok = false; } }));
  check(ok, "13 personnages × 3 variantes : SVG valides (ni NaN ni undefined)");
  /* 3. prompts */
  const md = fs.readFileSync(path.join(DIR, "PROMPTS_IMAGES.md"), "utf8"), ids = ["gino", "maya", "rocco", "ines", "theo", "samira", "colette", "karim", "nadia", "sebastien", "eleonore", "valenti", "tom"];
  check(JSON.stringify(BL.data.crew.members.map(m => m.id)) === JSON.stringify(ids), "les 13 ids du jeu sont inchangés");
  ids.forEach(id => { const sec = md.split("### ").find(x => x.includes("(`" + id + "`)")) || ""; check(!!sec && /Négatifs.*logo.*texte|texte.*logo/.test(sec) && /nom d'entreprise/.test(sec) && /nom de ville/.test(sec), "prompt « " + id + " » : présent, négatifs logo / texte / nom d'entreprise / nom de ville"); check(sec.includes(id + "_full.webp"), "prompt « " + id + " » : nom de fichier full"); });
  check(!files.some(f => /\.(png|jpe?g|webp)$/i.test(f) && !/^(gino|maya|rocco|ines|theo|samira|colette|karim|nadia|sebastien|eleonore|valenti|tom)_(full|card|thumb)\.(webp|png|jpe?g)$/.test(f)), "aucune image étrangère (ex. la référence du joueur) dans assets/crew");
  done("crew-images");
})();
