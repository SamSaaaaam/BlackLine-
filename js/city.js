/* Fond de ville : skyline SVG générée de façon déterministe (trois plans, fenêtres dorées éparses). */
(function (root) {
  var BL = root.BL = root.BL || {};
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function layer(r, minH, maxH, minW, maxW, fill, win) {
    var x = 0, o = "";
    while (x < 1600) {
      var w = minW + r() * (maxW - minW), h = minH + r() * (maxH - minH), y = 400 - h;
      o += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + fill + '"/>';
      if (r() < 0.25) o += '<rect x="' + (x + w / 2 - 1).toFixed(0) + '" y="' + (y - 20).toFixed(0) + '" width="2" height="20" fill="' + fill + '"/>';
      if (win) for (var wy = y + 12; wy < 388; wy += 14) for (var wx = x + 6; wx < x + w - 8; wx += 10)
        if (r() < win) o += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="3" height="5" fill="#c8a45e" opacity="' + (0.2 + r() * 0.5).toFixed(2) + '"/>';
      x += w + (r() < 0.3 ? 4 + r() * 12 : 0);
    }
    return o;
  }
  function build(el) {
    var r = rng(11);
    el.innerHTML = '<svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice"><defs>' +
      '<radialGradient id="glow" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#c8a45e" stop-opacity=".16"/><stop offset="1" stop-color="#c8a45e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cityFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0c0e" stop-opacity="1"/><stop offset=".35" stop-color="#0b0c0e" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="400" fill="url(#glow)"/>' +
      '<g opacity=".9">' + layer(r, 120, 270, 40, 90, "#1b2029", 0) + '</g>' +
      '<g>' + layer(r, 80, 200, 36, 80, "#141820", 0.1) + '</g>' +
      '<g>' + layer(r, 30, 130, 44, 100, "#0c0e11", 0.07) + '</g>' +
      '<rect width="1600" height="400" fill="url(#cityFade)"/></svg>';
  }
  BL.city = { build: build };
})(typeof globalThis !== "undefined" ? globalThis : this);
