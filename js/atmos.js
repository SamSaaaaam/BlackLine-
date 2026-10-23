/* Ambiance de la carte (chantier 9) : cycle jour/nuit, météo du jour, qualité adaptative. Logique PURE (aucun DOM), déterministe.
   - Heure : l'heure réelle de l'appareil (mode « auto ») ou forcée (jour, crépuscule, nuit, aube).
   - Météo : tirée de la date et de la tranche de 3 h (même météo pour tout le monde au même moment, aucun tirage au hasard à l'écran) ; réglable (clair, pluie, brouillard).
   - Qualité : 2 = élevée, 1 = moyenne, 0 = basse ; baisse vite si le dessin d'une image est lent, remonte lentement (hystérésis) ; jamais en dessous de 0. */
(function (root) {
  var BL = root.BL = root.BL || {};
  var HOURS = { day: 13, dusk: 18.6, night: 0.5, dawn: 6.4 };
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function hash(a, b, c) { var h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, k) { var x = hex(a), y = hex(b); return "#" + [0, 1, 2].map(function (i) { return ("0" + Math.round(x[i] + (y[i] - x[i]) * k).toString(16)).slice(-2); }).join(""); }
  function hourOf(date, mode) { if (HOURS[mode] !== undefined) return HOURS[mode]; return date.getHours() + date.getMinutes() / 60; }
  /* 0 = nuit noire, 1 = plein jour */
  function sunOf(h) { return clamp(Math.sin(Math.PI * (h - 5.2) / 13.6) * 1.3, 0, 1); }
  var SKY = { night: ["#0b1520", "#0a1c27"], dawn: ["#4a3a52", "#b8805a"], day: ["#3d6285", "#86abc4"], dusk: ["#3a2a4a", "#b86a4a"] };
  function at(date, mode) {
    var h = hourOf(date || new Date(), mode), sun = sunOf(h), night = 1 - clamp(sun / 0.3, 0, 1), key, top, bot, tw = 0;
    var twi = h < 12 ? "dawn" : "dusk";
    if (sun <= 0.02) key = "night"; else if (sun < 0.55) key = twi; else key = "day";
    if (key === "night") { top = SKY.night[0]; bot = SKY.night[1]; }
    else if (key === "day") { var k = clamp((sun - 0.55) / 0.45, 0, 1), ref = SKY[twi]; top = mix(ref[0], SKY.day[0], k); bot = mix(ref[1], SKY.day[1], k); }
    else { var k2 = clamp(sun / 0.55, 0, 1); top = mix(SKY.night[0], SKY[key][0], k2); bot = mix(SKY.night[1], SKY[key][1], k2); tw = 1 - Math.abs(k2 - 0.5) * 2; }
    var label = key === "night" ? "Nuit" : key === "dawn" ? "Aube" : key === "dusk" ? "Crépuscule" : "Jour";
    /* voile coloré posé sur l'image : bleu froid la nuit, doré le jour, orangé au crépuscule */
    var ov = key === "night" ? { c: "8,16,44", a: 0.22 } : key === "dawn" ? { c: "255,160,110", a: 0.12 + 0.06 * tw } : key === "dusk" ? { c: "255,110,70", a: 0.14 + 0.08 * tw } : { c: "255,236,190", a: 0.06 + 0.06 * sun };
    return { hour: Math.round(h * 100) / 100, sun: sun, night: night, key: key, label: label, sky: [top, bot], overlay: ov, stars: night > 0.6 };
  }
  function weather(date, mode) {
    date = date || new Date(); var kinds = ["clear", "rain", "fog"];
    if (kinds.indexOf(mode) >= 0) return { kind: mode, label: mode === "clear" ? "Dégagé" : mode === "rain" ? "Pluie" : "Brouillard", intensity: mode === "clear" ? 0 : 0.8 };
    var r = hash(date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate(), Math.floor((date.getHours()) / 3), 17);
    if (r < 0.62) return { kind: "clear", label: "Dégagé", intensity: 0 }; if (r < 0.80) return { kind: "cloud", label: "Nuageux", intensity: 0.4 + 0.4 * ((r - 0.62) / 0.18) };
    if (r < 0.93) return { kind: "rain", label: "Pluie", intensity: 0.5 + 0.5 * ((r - 0.8) / 0.13) }; return { kind: "fog", label: "Brouillard", intensity: 0.5 + 0.5 * ((r - 0.93) / 0.07) };
  }
  /* Qualité adaptative : ms = durée lissée d'un dessin. > 22 ms : on baisse après 20 images lentes ; < 9 ms pendant 240 images : on remonte d'un cran. */
  function adapt(st, ms) {
    st = st || { q: 2, slow: 0, fast: 0 }; if (ms > 22) { st.slow++; st.fast = 0; } else if (ms < 9) { st.fast++; st.slow = 0; } else { st.slow = Math.max(0, st.slow - 1); st.fast = 0; }
    if (st.slow >= 20 && st.q > 0) { st.q--; st.slow = 0; } if (st.fast >= 240 && st.q < 2) { st.q++; st.fast = 0; } return st;
  }
  BL.atmos = { at: at, weather: weather, adapt: adapt, hourOf: hourOf, HOURS: HOURS, mix: mix };
})(typeof globalThis !== "undefined" ? globalThis : this);
