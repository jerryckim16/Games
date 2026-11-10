// Original inline-SVG artwork for the Suneung Simulator: life-stage scenes, an avatar that grows up and
// shows its mood, and an illustration for every event. Nothing is loaded from outside (the published
// artifact's CSP blocks external images), and no text is baked in: the few words that appear (a
// university's name on its gate) are passed in by app.js in the player's language.
//
// Every color is a CSS token (--a-* in styles.css), so the art follows the light and dark themes:
// dark mode turns daytime skies to dusk and dims the rooms. Animation is plain CSS on SVG elements
// (classes .bob, .breathe, .blink, .fall, .rise, .twinkle, .pulse, .sway), which styles.css switches off under
// prefers-reduced-motion.
(function (root) {
  "use strict";

  // ---------- drawing helpers ----------
  const C = (t) => "var(--a-" + t + ")";
  function st(fill, stroke, w, extra) {
    let s = "fill:" + (fill ? C(fill) : "none");
    if (stroke) s += ";stroke:" + C(stroke) + ";stroke-width:" + (w || 2) + ";stroke-linecap:round;stroke-linejoin:round";
    if (extra) s += ";" + extra;
    return ' style="' + s + '"';
  }
  const R = (x, y, w, h, fill, rx, stroke, sw, extra) =>
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : "") + st(fill, stroke, sw, extra) + "/>";
  const O = (cx, cy, r, fill, stroke, sw, extra) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + st(fill, stroke, sw, extra) + "/>";
  const E = (cx, cy, rx, ry, fill, stroke, sw, extra) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + st(fill, stroke, sw, extra) + "/>";
  const P = (d, fill, stroke, sw, extra) => '<path d="' + d + '"' + st(fill, stroke, sw, extra) + "/>";
  const L = (x1, y1, x2, y2, stroke, sw, extra) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + st(null, stroke, sw, extra) + "/>";
  const G = (x, y, body, s, cls, style) =>
    '<g transform="translate(' + x + " " + y + ")" + (s && s !== 1 ? " scale(" + s + ")" : "") + '"' + (cls ? ' class="' + cls + '"' : "") + (style ? ' style="' + style + '"' : "") + ">" + body + "</g>";
  // An animated group. CSS animations replace the transform attribute, so motion always lives on an
  // inner group and position on the outer one.
  const A = (cls, body, style) => '<g class="' + cls + '"' + (style ? ' style="' + style + '"' : "") + ">" + body + "</g>";
  const T = (x, y, text, fill, size, extra) =>
    '<text x="' + x + '" y="' + y + '" text-anchor="middle"' + st(fill, null, 0, "font-size:" + size + "px;font-weight:800;font-family:inherit" + (extra ? ";" + extra : "")) + ">" + esc(text) + "</text>";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Several SVGs share one page, so gradient and clip ids must be unique.
  let uid = 0;
  const nid = (p) => p + "-" + (++uid);
  // A tiny seeded generator for particle positions: the art never touches the game's RNG.
  function rand(seed) {
    let a = (seed | 0) || 1;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function grad(id, top, bottom) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + C(top) + '"/><stop offset="1" style="stop-color:' + C(bottom) + '"/></linearGradient>';
  }
  function glow(id, color) {
    return '<radialGradient id="' + id + '"><stop offset="0" style="stop-color:' + C(color) + ';stop-opacity:0.75"/><stop offset="1" style="stop-color:' + C(color) + ';stop-opacity:0"/></radialGradient>';
  }
  function svg(vb, body, cls, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" preserveAspectRatio="xMidYMax slice" class="art ' + (cls || "") + '"' +
      (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true" focusable="false"') + ">" + body + "</svg>";
  }

  function seasonOf(m) { return m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "fall" : "winter"; }

  // ---------- light, sky, weather and the world outside (environments v6.4) ----------
  // The places are drawn like a Korean drama's sets rather than a picture book: rooms in one-point
  // perspective with real materials (linoleum, wood strip floors, aluminium window frames, steel desks
  // with formica tops), a desaturated, slightly cool daylight and warm practical lights (desk lamps,
  // window glow, sodium street lights). Light comes from the upper left. Depth and light are carried
  // by gradients; there are no filters, so a phone redraws a scene cheaply.
  //
  // Gradients a drawing needs are registered once (def) and written into its <defs> by the wrapper
  // that started it (begin / defsOut), with ids unique to that drawing.
  let DEFS = {}, PFX = "e";
  function begin() { DEFS = {}; PFX = nid("e"); }
  function def(name, make) {
    if (!DEFS[name]) DEFS[name] = make(PFX + name);
    return "url(#" + PFX + name + ")";
  }
  const tidy = (s) => s.replace(/(\.\d\d)\d+/g, "$1");
  const defsOut = () => { const k = Object.keys(DEFS); return k.length ? "<defs>" + k.map((n) => DEFS[n]).join("") + "</defs>" : ""; };
  const stp = (s) => '<stop offset="' + s[0] + '" style="stop-color:' + C(s[1]) + (s[2] != null ? ";stop-opacity:" + s[2] : "") + '"/>';
  // stops: [[offset, token, opacity?]]; dir: vertical by default, "h" left to right, or [x1, y1, x2, y2].
  function lin(id, stops, dir) {
    const d = dir === "h" ? [0, 0, 1, 0] : Array.isArray(dir) ? dir : [0, 0, 0, 1];
    return '<linearGradient id="' + id + '" x1="' + d[0] + '" y1="' + d[1] + '" x2="' + d[2] + '" y2="' + d[3] + '">' + stops.map(stp).join("") + "</linearGradient>";
  }
  function radial(id, stops, cx, cy, r) {
    return '<radialGradient id="' + id + '"' + (cx != null ? ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"' : "") + ">" + stops.map(stp).join("") + "</radialGradient>";
  }
  const fill = (u, extra) => "fill:" + u + (extra ? ";" + extra : "");
  const poly = (pts) => "M" + pts.map((p) => (+p[0]).toFixed(1) + " " + (+p[1]).toFixed(1)).join(" L") + " Z";
  // Shared fills: a soft contact shadow, a light's glow, ambient occlusion fading off an edge.
  const shadowF = () => def("sh", (id) => radial(id, [[0, "aoC", 0.5], [0.6, "aoC", 0.22], [1, "aoC", 0]]));
  const glowF = (tok) => def("gl" + tok, (id) => radial(id, [[0, tok, 0.95], [0.3, tok, 0.45], [1, tok, 0]]));
  const aoF = (dir) => def("ao" + dir, (id) => lin(id, [[0, "aoC", 0], [1, "aoC", 1]], { d: [0, 0, 0, 1], u: [0, 1, 0, 0], r: [0, 0, 1, 0], l: [1, 0, 0, 0] }[dir]));
  // A soft shadow on the ground under something (cx, cy: its centre).
  const shadow = (cx, cy, rx, ry, op) => E(cx, cy, rx, ry, null, null, 0, fill(shadowF(), op != null ? "opacity:" + op : ""));
  // A pool of light (lamps, screens, street lights); stronger at night (--a-glowOp).
  const pool = (cx, cy, rx, ry, tok, op) => E(cx, cy, rx, ry, null, null, 0, fill(glowF(tok || "lampWarm"), "opacity:" + (op != null ? op : "var(--a-glowOp)")));
  // Ambient occlusion: a band darkening toward one edge of the box (dir: d down, u up, l left, r right).
  const ao = (x, y, w, h, dir, op) => R(x, y, w, h, null, 0, null, 0, fill(aoF(dir), "opacity:" + (op || 0.22)));
  // The whole frame darkens a little toward its corners, like a lens.
  const vignette = (w, h, op) => R(0, 0, w, h, null, 0, null, 0, fill(def("vig", (id) => radial(id, [[0.5, "aoC", 0], [1, "aoC", 0.6]], 0.5, 0.42, 0.78)), "opacity:" + (op || "var(--a-vigOp)")));
  // Where the art is set (see viewKind). Set per drawing.
  let REGION = "";
  // How bright the lit windows of other buildings are: by theme (--a-litOp), or fully lit at night.
  let LIT = "var(--a-litOp)";
  function withLit(v, f) { const p = LIT; LIT = v; try { return f(); } finally { LIT = p; } }

  // Skies by time of day: day (which dark mode's tokens turn into night), dawn, gold (golden hour),
  // night, and rain (the flat grey of the monsoon, 장마).
  const SKY = { day: ["skyTop", "skyMid", "skyLow"], dawn: ["dawnTop", "dawnMid", "dawnLow"], gold: ["goldTop", "goldMid", "goldLow"], night: ["nightTop", "nightMid", "nightLow"], rain: ["rainTop", "rainMid", "rainLow"] };
  const skyF = (tod) => def("sky" + tod, (id) => lin(id, [[0, SKY[tod][0]], [0.6, SKY[tod][1]], [1, SKY[tod][2]]]));
  function sky(x, y, w, h, o) {
    const tod = SKY[o.tod] ? o.tod : "day", r = rand(o.seed || 5);
    let s = R(x, y, w, h, null, 0, null, 0, fill(skyF(tod)));
    // Stars at night, and in dark mode, where the day sky is a night sky.
    if (tod !== "rain" && tod !== "gold") {
      let st = "";
      for (let i = 0; i < Math.round(w / 34); i++) st += O((x + r() * w).toFixed(0), (y + r() * h * 0.5).toFixed(0), (0.5 + r() * 0.7).toFixed(1), "starE");
      s += A("twinkle slow", st, "opacity:" + (tod === "night" ? 0.85 : tod === "dawn" ? 0.3 : "var(--a-starOp)"));
    }
    // The sun (dark mode: the moon), a low gold sun, or the moon.
    const bx = x + w * (o.sunX != null ? o.sunX : 0.8), by = y + h * (o.sunY != null ? o.sunY : 0.22), br = o.sunR || Math.max(6, Math.min(w, h) * 0.06);
    if (tod === "day" && o.sun !== false) s += O(bx, by, br * 5, null, null, 0, fill(glowF("sunGlow"), "opacity:0.7")) + O(bx, by, br, "sunDisc");
    if (tod === "gold" && o.sun !== false) s += O(bx, by, br * 7, null, null, 0, fill(glowF("goldSun"), "opacity:0.8")) + O(bx, by, br * 1.2, "goldSun");
    if (tod === "night" && o.sun !== false) s += O(bx, by, br * 4, null, null, 0, fill(glowF("moonE"), "opacity:0.35")) + O(bx, by, br * 0.8, "moonE");
    // Long, low clouds, lit from below at dusk; a heavy grey deck in the rain.
    const ct = { day: "cloudE", dawn: "dawnCloud", gold: "goldCloud", night: "nightCloud", rain: "rainCloud" }[tod];
    const n = tod === "rain" ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const cx = x + w * (0.1 + r() * 0.8), cy = y + h * (tod === "rain" ? 0.05 + r() * 0.25 : 0.12 + r() * 0.3), cw = w * (0.18 + r() * 0.22), ch = Math.max(2, h * (tod === "rain" ? 0.07 : 0.035));
      s += G(cx.toFixed(0), cy.toFixed(0), A("drift slow", E(0, 0, cw, ch, ct) + E(cw * 0.3, -ch * 0.8, cw * 0.45, ch * 0.9, ct) + E(-cw * 0.35, ch * 0.3, cw * 0.4, ch * 0.6, ct)), 1, "", "opacity:" + (tod === "rain" ? 0.75 : 0.6));
    }
    return s;
  }
  // A haze band that thickens toward the horizon (atmospheric perspective).
  const haze = (x, y, w, h, op) => R(x, y, w, h, null, 0, null, 0, fill(def("hz", (id) => lin(id, [[0, "haze", 0], [1, "haze", 1]])), "opacity:" + (op || 0.6)));
  // A mountain ridge: seeded peaks joined by curves, hazier toward its foot; snow-capped in winter.
  function ridge(x, w, base, peak, seed, tok, season, n) {
    const r = rand(seed), k = n || 6;
    let px = x, py = base - peak * (0.3 + r() * 0.3), d = "M" + x + " " + (base + 2) + " L" + px.toFixed(1) + " " + py.toFixed(1);
    for (let i = 1; i <= k; i++) {
      const nx = x + (w * i) / k, ny = base - peak * (0.35 + r() * 0.65);
      d += " Q" + ((px + nx) / 2 + (r() - 0.5) * (w / k) * 0.5).toFixed(1) + " " + (Math.min(py, ny) - peak * 0.25 * r()).toFixed(1) + " " + nx.toFixed(1) + " " + ny.toFixed(1);
      px = nx; py = ny;
    }
    const snow = season === "winter";
    const f = def("rg" + tok + (snow ? "w" : ""), (id) => lin(id, snow ? [[0, "snowE"], [0.3, tok], [1, "haze", 0.9]] : [[0, tok], [1, "haze", 0.9]]));
    return P(d + " L" + (x + w) + " " + (base + 2) + " Z", null, null, 0, fill(f));
  }
  // Vegetation by season: tree crowns, hills and fields.
  const vegTok = (season, kind) => ({ spring: kind === "cherry" ? "blossomE" : "vegSp", summer: "vegSu", fall: kind === "ginkgo" ? "vegFa2" : "vegFa", winter: "vegWi" }[season] || "vegSu");

  // ---------- weather and outdoor bits ----------
  // Falling weather for the season inside the box (x, y, w, h): spring petals, the summer monsoon's
  // rain, autumn leaves, winter snow. Small and slow; off with reduced motion like all art motion.
  function particles(season, x, y, w, h, night, n, seed) {
    const r = rand(seed || 7);
    let s = "";
    const count = Math.round((n || 9) * (season === "summer" ? 2 : 1));
    for (let i = 0; i < count; i++) {
      const px = x + r() * w, dur = season === "summer" ? 0.8 + r() * 0.6 : 7 + r() * 7, del = -r() * dur;
      const dx = season === "summer" ? -18 : (r() * 40 - 10).toFixed(0);
      const py = y + r() * h * 0.85, style = "--d:" + dur.toFixed(1) + "s;--del:" + del.toFixed(1) + "s;--dx:" + dx + "px;--fy:" + (y + h + 20 - py).toFixed(0) + "px";
      let shape;
      if (season === "spring") shape = E(0, 0, 2.4, 1.4, "blossomE", null, 0, "opacity:0.9");
      else if (season === "fall") shape = P("M0 -3 L2.2 0 L0 3 L-2.2 0 Z", i % 2 ? "vegFa" : "vegFa2");
      else if (season === "winter") shape = O(0, 0, (0.9 + r() * 1.3).toFixed(1), "snowE", null, 0, "opacity:0.9");
      else shape = L(0, 0, -2, 11, "rainE", 1, "opacity:0.55");
      s += G(px.toFixed(0), py.toFixed(0), A(season === "summer" ? "fall rain" : "fall", shape, style));
    }
    return s;
  }
  // A street tree (zelkova, ginkgo or cherry): a tapering trunk and a crown of leaf masses, lit from
  // the upper left; bare branches with snow along them in winter.
  function tree(x, y, season, s, kind) {
    const r = rand(Math.round(x * 7 + y));
    let b = shadow(0, 0, 26, 5, 0.6) + P("M-5 0 Q-3 -30 -2 -48 L-14 -70 L-11 -72 L0 -54 L9 -76 L12 -74 L3 -46 Q4 -24 6 0 Z", "trunk") + P("M1 -2 Q3 -26 2 -46 L5 -46 Q5 -24 6 0 Z", "aoC", null, 0, "opacity:0.3");
    if (season !== "winter") {
      const tok = vegTok(season, kind || (season === "fall" && r() < 0.5 ? "ginkgo" : season === "spring" && r() < 0.6 ? "cherry" : ""));
      let crown = "";
      const blobs = [[-16, -66, 20, 16], [10, -78, 22, 17], [18, -58, 18, 14], [-4, -90, 19, 15], [-22, -82, 14, 12], [4, -64, 22, 16]];
      for (const [bx, by, rx, ry] of blobs) crown += E(bx, by, rx, ry, tok);
      // Shade on the lower right, light on the upper left (one step each, as cel shading).
      crown += E(10, -60, 20, 13, "aoC", null, 0, "opacity:0.2") + E(-12, -86, 13, 9, "hiE", null, 0, "opacity:0.22") + E(-20, -72, 9, 7, "hiE", null, 0, "opacity:0.15");
      b += A("sway", crown);
    } else {
      b += P("M-12 -70 L-22 -84 M-12 -70 L-8 -90 M10 -75 L4 -96 M10 -75 L22 -88 M0 -54 L-6 -66", null, "trunk", 2) + P("M-22 -85 L-17 -79 M-8 -91 L-9 -84 M22 -89 L16 -83", null, "snowE", 2.5);
    }
    return G(x, y, b, s || 1);
  }
  // Korean apartment slabs (아파트): a wall face, the shaded end, balcony bands floor by floor and a
  // few lit windows (bright at night, --a-litOp). x, base: bottom left; fh: one floor's height.
  function aptSlab(x, base, w, h, fh, seed, tok) {
    const r = rand(seed || 3), side = Math.max(2, w * 0.14);
    const pat = def("ap" + fh, (id) => '<pattern id="' + id + '" width="12" height="' + fh + '" patternUnits="userSpaceOnUse"><rect width="12" height="' + fh + '" style="fill:' + C("aptWall") + '"/><rect y="' + (fh * 0.3).toFixed(1) + '" width="12" height="' + (fh * 0.42).toFixed(1) + '" style="fill:' + C("winDay") + '"/><rect y="' + (fh * 0.72).toFixed(1) + '" width="12" height="' + Math.max(0.6, fh * 0.1).toFixed(1) + '" style="fill:' + C("aptLine") + '"/></pattern>');
    let s = R(x, base - h, w - side, h, null, 0, null, 0, "fill:" + pat) + R(x + w - side, base - h, side, h, tok || "aptShade") + R(x - 1, base - h - fh * 0.5, w + 1, fh * 0.6, "aptShade");
    let lit = "";
    const floors = Math.floor(h / fh), cols = Math.max(1, Math.floor((w - side) / 9));
    for (let f = 1; f < floors; f++) for (let c = 0; c < cols; c++) if (r() < 0.15) lit += R((x + 1 + c * ((w - side - 2) / cols)).toFixed(1), (base - h + f * fh + fh * 0.3).toFixed(1), Math.max(0.5, (w - side - 2) / cols - 1).toFixed(1), (fh * 0.42).toFixed(1), "winLit");
    return s + G(0, 0, lit, 1, "", "opacity:" + LIT);
  }
  // A plain building block with a grid of windows (offices, academies, villas, schools).
  function block(x, base, w, h, tok, seed, cell, win) {
    const r = rand(seed || 9), c = cell || 10;
    let s = R(x, base - h, w, h, tok || "bldMid") + R(x + w * 0.86, base - h, w * 0.14, h, "aoC", 0, null, 0, "opacity:0.18");
    // The window grid is a pattern (one rect however tall the building); only the lit ones are drawn.
    const wt = win || "winDay", pat = def("bk" + c + wt, (id) => '<pattern id="' + id + '" width="' + c + '" height="' + c + '" patternUnits="userSpaceOnUse"><rect x="' + (c * 0.25) + '" y="' + (c * 0.3) + '" width="' + (c * 0.5) + '" height="' + (c * 0.45) + '" style="fill:' + C(wt) + '"/></pattern>');
    if (w > c * 1.5 && h > c * 1.5) s += R(x + c * 0.2, base - h + c * 0.3, w - c * 0.9, h - c * 1.1, null, 0, null, 0, "fill:" + pat);
    let lit = "";
    const x0 = Math.ceil((x + c * 0.2) / c) * c, y0 = Math.ceil((base - h + c * 0.3) / c) * c;
    for (let yy = y0; yy < base - c * 1.2; yy += c) for (let xx = x0; xx < x + w - c * 0.9; xx += c) if (r() < 0.16) lit += R(+(xx + c * 0.25).toFixed(1), +(yy + c * 0.3).toFixed(1), +(c * 0.5).toFixed(1), +(c * 0.45).toFixed(1), "winLit");
    return s + G(0, 0, lit, 1, "", "opacity:" + LIT);
  }
  // Namsan Tower on its hill, in the haze.
  const namsan = (x, base, s) => G(x, base, P("M-60 0 Q-30 -26 0 -30 Q30 -26 60 0 Z", "mtnMid") + R(-1.6, -78, 3.2, 50, "bldFar") + R(-5, -84, 10, 8, "bldFar", 2) + R(-3.4, -92, 6.8, 8, "bldFar", 1) + L(0, -92, 0, -112, "bldFar", 1.2) +
    A("pulse", O(0, -112, 1.4, "neonB"), "opacity:" + LIT), s || 1);
  // A red neon cross on a church roof: half the skylines of Korean towns have one, lit at night.
  const cross = (x, y, s) => G(x, y, R(-0.8, -10, 1.6, 10, "neonB") + R(-3, -7.5, 6, 1.4, "neonB"), s || 1, "", "opacity:" + LIT);
  // What the windows look out on, by region. Seoul: the skyline with Namsan Tower; Busan: the hillside
  // houses, the sea and Gwangan Bridge; the coast (Pohang, Haenam); Jeju: Hallasan over low roofs and
  // stone walls; the country (Pyeongchang): ridges, fields and plastic greenhouses; elsewhere a city's
  // apartment complexes against the hills.
  const SEOUL_AREAS = ["gangnam", "nowon", "mokdong", "mapo", "gwanak", "gangdong"];
  function viewKind(o) {
    const reg = o.region || REGION, v = o.view || VIEW;
    if (SEOUL_AREAS.indexOf(reg) >= 0) return "seoul";
    if (reg === "busan" || reg === "jeju") return reg;
    if (v === "sea") return "coast";
    if (v === "country") return "country";
    return "town";
  }
  // The land in a box (x, y, w, h) under the sky: far, middle and near layers. o: season, seed, kind.
  function landscape(x, y, w, h, o) {
    const k = o.kind || viewKind(o), season = o.season, sd = o.seed || 11, hz = y + h * (o.horizon || 0.62);
    const veg = vegTok(season);
    let s = "";
    if (k === "seoul") {
      s += ridge(x, w, hz - h * 0.05, h * 0.3, sd, "mtnFar", season, 5) + namsan(x + w * 0.64, hz - h * 0.08, h / 150) + haze(x, hz - h * 0.3, w, h * 0.3, 0.5);
      const r = rand(sd + 1);
      for (let i = 0; i < 6; i++) { const bw = w * (0.08 + r() * 0.07), bh = h * (0.12 + r() * 0.2); s += block(x + w * (i / 6) + r() * 4, hz + h * 0.06, bw, bh, i % 2 ? "bldFar" : "bldMid", sd + i, Math.max(4, h / 26)); }
      for (let i = 0; i < 3; i++) s += aptSlab(x + w * (0.04 + i * 0.36), y + h, w * 0.24, h * (0.36 + (i % 2) * 0.08), Math.max(3, h / 24), sd + 20 + i);
    } else if (k === "busan") {
      s += ridge(x, w, hz - h * 0.02, h * 0.28, sd, "mtnFar", season, 5) + haze(x, hz - h * 0.25, w, h * 0.25, 0.5);
      s += R(x, hz, w, h * 0.4, "seaFar") + R(x, hz + h * 0.12, w, h * 0.3, "seaNear", 0, null, 0, "opacity:0.6");
      // Gwangan Bridge: a long deck, two towers and their cables, lit at night.
      const by = hz + h * 0.06, bx = x + w * 0.1, bw = w * 0.9;
      s += R(bx, by, bw, Math.max(1.5, h * 0.012), "bldFar") + [0.35, 0.65].map((t) => R(bx + bw * t - 1, by - h * 0.18, 2, h * 0.18, "bldFar")).join("") +
        P("M" + bx + " " + by + " Q" + (bx + bw * 0.2) + " " + (by - h * 0.02) + " " + (bx + bw * 0.35) + " " + (by - h * 0.18) + " Q" + (bx + bw * 0.5) + " " + (by - h * 0.04) + " " + (bx + bw * 0.65) + " " + (by - h * 0.18) + " Q" + (bx + bw * 0.8) + " " + (by - h * 0.02) + " " + (bx + bw) + " " + by, null, "bldFar", 1) +
        G(0, 0, L(bx, by + 1, bx + bw, by + 1, "neonA", 1, "stroke-dasharray:2 3"), 1, "", "opacity:" + LIT);
      // Hillside houses on the left, stacked up the slope.
      const r = rand(sd + 2);
      for (let i = 0; i < 10; i++) { const hx = x + r() * w * 0.4, hy = hz - h * 0.02 - r() * h * 0.22 * (1 - (hx - x) / (w * 0.4)); s += R(hx.toFixed(1), hy.toFixed(1), (w * 0.03).toFixed(1), (h * 0.05).toFixed(1), ["bldNear", "fabric1", "fabric4", "bldMid"][i % 4]); }
      s += aptSlab(x + w * 0.7, hz + h * 0.02, w * 0.1, h * 0.38, Math.max(3, h / 26), sd + 5);
    } else if (k === "coast") {
      s += ridge(x + w * 0.4, w * 0.6, hz, h * 0.16, sd, "mtnFar", season, 4) + R(x, hz, w, h - (hz - y), "seaFar") + R(x, hz + h * 0.15, w, h, "seaNear", 0, null, 0, "opacity:0.6");
      s += L(x, hz + h * 0.1, x + w, hz + h * 0.1, "foam", 1, "opacity:0.5") + L(x + w * 0.1, hz + h * 0.22, x + w * 0.7, hz + h * 0.22, "foam", 1, "opacity:0.4");
      s += P("M" + x + " " + (y + h) + " L" + x + " " + (hz - h * 0.08) + " Q" + (x + w * 0.2) + " " + (hz - h * 0.14) + " " + (x + w * 0.34) + " " + (hz + h * 0.05) + " L" + (x + w * 0.34) + " " + (y + h) + " Z", "mtnNear");
      s += block(x + w * 0.04, hz + h * 0.02, w * 0.12, h * 0.16, "bldNear", sd, Math.max(3, h / 30)) + block(x + w * 0.17, hz + h * 0.04, w * 0.1, h * 0.1, "bldMid", sd + 1, Math.max(3, h / 30));
      s += G(x + w * 0.62, hz + h * 0.08, P("M-8 0 L8 0 L6 3 L-6 3 Z", "bldNear") + R(-1, -6, 2, 6, "bldNear"), Math.max(0.6, h / 120));
    } else if (k === "jeju") {
      // Hallasan: one broad, gentle dome, snow on top in winter.
      const f = def("hl" + (season === "winter" ? "w" : ""), (id) => lin(id, season === "winter" ? [[0, "snowE"], [0.25, "mtnFar"], [1, "haze", 0.9]] : [[0, "mtnFar"], [1, "haze", 0.9]]));
      s += P("M" + x + " " + hz + " Q" + (x + w * 0.3) + " " + (hz - h * 0.36) + " " + (x + w * 0.55) + " " + (hz - h * 0.4) + " Q" + (x + w * 0.8) + " " + (hz - h * 0.36) + " " + (x + w) + " " + (hz - h * 0.06) + " L" + (x + w) + " " + (hz + 2) + " L" + x + " " + (hz + 2) + " Z", null, null, 0, fill(f));
      s += haze(x, hz - h * 0.2, w, h * 0.2, 0.5) + R(x, hz, w, h - (hz - y), season === "winter" ? "vegWi" : veg);
      s += R(x, hz + h * 0.02, w, h * 0.05, "seaFar", 0, null, 0, "opacity:0.8");
      // Low houses with coloured roofs, and black basalt walls around the fields.
      const r = rand(sd + 3);
      for (let i = 0; i < 5; i++) { const hx = x + w * (0.05 + i * 0.2 + r() * 0.06), hy = hz + h * 0.16 + r() * h * 0.1; s += R(hx, hy, w * 0.08, h * 0.05, "bldNear") + P("M" + (hx - 2) + " " + hy + " L" + (hx + w * 0.04) + " " + (hy - h * 0.04) + " L" + (hx + w * 0.08 + 2) + " " + hy + " Z", ["fabric1", "roofOr", "fabric1", "fabric3"][i % 4]); }
      for (let i = 0; i < 3; i++) s += L(x, hz + h * (0.3 + i * 0.1), x + w, hz + h * (0.28 + i * 0.11), "basalt", Math.max(1.2, h / 70), "stroke-dasharray:3 1.5");
    } else if (k === "country") {
      s += ridge(x, w, hz - h * 0.04, h * 0.34, sd, "mtnFar", season, 5) + haze(x, hz - h * 0.25, w, h * 0.22, 0.5) + ridge(x, w, hz + h * 0.04, h * 0.2, sd + 4, "mtnMid", season, 4);
      const field = season === "winter" ? "snowE" : season === "fall" ? "vegFa2" : veg;
      s += R(x, hz + h * 0.04, w, h, field) + R(x, hz + h * 0.04, w, h, "aoC", 0, null, 0, "opacity:0.06");
      for (let i = 0; i < 5; i++) s += L(x, hz + h * (0.08 + i * i * 0.025), x + w, hz + h * (0.07 + i * i * 0.027), season === "winter" ? "vegWi" : "vegSu", 1, "opacity:0.45");
      // A farmhouse and two plastic greenhouses (비닐하우스).
      const fx = x + w * 0.62, fy = hz + h * 0.14;
      s += R(fx, fy - h * 0.06, w * 0.1, h * 0.06, "bldNear") + P("M" + (fx - 3) + " " + (fy - h * 0.06) + " L" + (fx + w * 0.05) + " " + (fy - h * 0.11) + " L" + (fx + w * 0.1 + 3) + " " + (fy - h * 0.06) + " Z", "roofOr");
      for (let i = 0; i < 2; i++) { const gx = x + w * (0.12 + i * 0.16), gy = hz + h * 0.2; s += P("M" + gx + " " + gy + " Q" + (gx + w * 0.07) + " " + (gy - h * 0.12) + " " + (gx + w * 0.14) + " " + gy + " Z", "vinyl") + L(gx + w * 0.02, gy - h * 0.04, gx + w * 0.12, gy - h * 0.04, "hiE", 1, "opacity:0.5"); }
    } else {
      s += ridge(x, w, hz - h * 0.02, h * 0.3, sd, "mtnFar", season, 5) + haze(x, hz - h * 0.24, w, h * 0.24, 0.5) + ridge(x, w, hz + h * 0.04, h * 0.12, sd + 3, "mtnMid", season, 4);
      for (let i = 0; i < 4; i++) s += aptSlab(x + w * (0.02 + i * 0.25), hz + h * (0.14 + (i % 2) * 0.04), w * 0.17, h * (0.28 + (i % 3) * 0.05), Math.max(3, h / 26), sd + 30 + i);
      s += cross(x + w * 0.9, hz - h * 0.02, h / 90);
    }
    // Trees along the bottom in the season's colours.
    if (o.trees !== false) { const r = rand(sd + 9); for (let i = 0; i < 2; i++) s += tree(x + w * (0.15 + i * 0.6 + r() * 0.1), y + h + 6, season, h / 180); }
    return s;
  }
  // A window onto the season and the region: an aluminium sliding frame, the view, a sheen on the glass,
  // rain on it in the monsoon and snow on the sill in winter. o: { season, night, tod, seed, view, region,
  // tree, blind, curtain } (city and treeX are accepted for older callers and ignored).
  let VIEW = "city";
  function windowView(x, y, w, h, o) {
    const id = nid("win"), season = o.season;
    const tod = o.tod || (o.night ? "night" : season === "summer" ? "rain" : "day");
    let inner = sky(x, y, w, h, { tod, seed: o.seed, sunX: 0.8, sunY: 0.2 }) + withLit(tod === "night" ? 0.95 : LIT, () => landscape(x, y + h * 0.1, w, h * 0.9, { season, seed: o.seed, view: o.view, region: o.region, trees: o.tree !== false, horizon: 0.55 }));
    if (season === "winter") inner += R(x, y + h - 4, w, 4, "snowE");
    // At night the land outside falls into shadow (dark mode's tokens are already night).
    if (tod === "night") inner += R(x, y + h * 0.3, w, h * 0.7, "nightTop", 0, null, 0, "opacity:var(--a-nightVeilOp)");
    inner += particles(season, x, y, w, h, o.night, Math.round(w / 22), o.seed);
    // The glass: a cool sheen with one diagonal reflection.
    inner += R(x, y, w, h, "glassTint", 0, null, 0, "opacity:0.12") + P(poly([[x + w * 0.1, y], [x + w * 0.32, y], [x + w * 0.02, y + h], [x - w * 0.2, y + h]]), "hiE", null, 0, "opacity:0.1");
    if (season === "summer") { const r = rand(o.seed || 4); for (let i = 0; i < Math.round(w / 14); i++) { const rx = x + r() * w, ry = y + r() * h * 0.7; inner += L(rx.toFixed(0), ry.toFixed(0), rx.toFixed(0), (ry + 4 + r() * 10).toFixed(0), "hiE", 1, "opacity:0.35"); } }
    let s = '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath><g clip-path="url(#' + id + ')">' + inner + "</g>";
    // Frame: two sliding sashes overlapping in the middle, a sill, a soft inner shadow.
    const fw = Math.max(3, w * 0.03);
    s += R(x, y, w, h, null, 0, "alum", fw) + R(x + w / 2 - fw * 0.9, y, fw * 1.8, h, "alum2") + L(x + w / 2 - fw * 0.9, y, x + w / 2 - fw * 0.9, y + h, "aoC", 1, "opacity:0.3");
    s += R(x - fw * 1.5, y + h + fw / 2, w + fw * 3, fw * 1.4, "alum", 1) + R(x - fw * 1.5, y + h + fw * 1.9, w + fw * 3, fw * 0.8, "aoC", 0, null, 0, "opacity:0.18");
    if (o.blind) { let b = ""; for (let yy = y + fw; yy < y + h * 0.3; yy += 4) b += R(x + fw / 2, yy, w - fw, 2.6, "blind"); s += b; }
    if (o.curtain) s += P("M" + (x - fw * 3) + " " + (y - fw * 2) + " L" + (x + w * 0.16) + " " + (y - fw * 2) + " Q" + (x + w * 0.1) + " " + (y + h * 0.5) + " " + (x + w * 0.14) + " " + (y + h + fw * 3) + " L" + (x - fw * 3) + " " + (y + h + fw * 3) + " Z", "curtain") +
      P("M" + (x + w * 0.04) + " " + (y - fw) + " Q" + (x + w * 0.0) + " " + (y + h * 0.5) + " " + (x + w * 0.05) + " " + (y + h + fw * 2), null, "curtain2", 2);
    return s;
  }
  // Full-bleed outdoor sky (campus, gate, field ...). o: { season, night, tod, seed, moon }.
  function outdoorSky(w, h, o) {
    let s = sky(0, 0, w, h, { tod: o.tod || (o.night ? "night" : "day"), seed: o.seed, sun: o.moon !== false, sunY: 0.16 });
    return s;
  }

  // ---------- people (v6.4) ----------
  // Everyone is drawn by avatar(o), front on, feet at (0, 0), in a semi-realistic drama-webtoon style:
  // real proportions per age, flat fills with one or two cel-shade steps (light from the upper left, so
  // the shade sits on the right), a soft rim light on the left, no outlines.
  //
  // o: { age, outfit, mood, look, pose, prop, backpack, gear, season, school, still }
  //   age: toddler (0–2) | child (3–12; scale it down for kindergarten) | teen | adult | elder. A look
  //     with grey: true makes an adult an elder.
  //   outfit: onesie | smock (kindergarten, with the yellow hat) | kid | uniform | pe | hoodie | casual.
  //     season (spring | summer | fall | winter) picks short sleeves, a blazer or a long padded coat.
  //     school: "mid" gives the middle-school blazer colour, anything else the high school's.
  //   gear: work clothes over an adult's outfit (JOB_GEAR values: suit, coat, scrubs, apron, hardhat,
  //     vest, cap, straw; also helmet and carer).
  //   pose: stand | cheer (both arms up) | wave (right arm, animated) | hold (right hand holds the prop
  //     at the chest; without a prop, hands clasped in front; with prop "baby", a baby in the arms) |
  //     sit | study (seated, forearms forward on a desk the scene draws) | run.
  //   prop: book | phone | baton | envelope | medal | mask | headphones | baby.
  //   look (from lookFor): { hair, skin, shirt, sex, hc, dye, glasses, lid, grey }.
  // Every colour is a --a-* token (characters block in styles.css); ch-overlays (chCel, chSheen,
  // chRim, chSkinSh) are translucent so one shade works on every fill.
  const n1 = (v) => (Math.round(v * 10) / 10);
  // Path data, compact: no space after a command letter or before a minus sign.
  const D = (...a) => {
    let o = "";
    for (const v of a) {
      if (typeof v === "number") { const t = String(n1(v)); o += o && t[0] !== "-" && !/[A-Za-z ]$/.test(o) ? " " + t : t; } else o += v;
    }
    return o;
  };
  // A circle as path data, so circles can share one path with other shapes of the same colour.
  const ring = (x, y, r) => D("M", x - r, y, "a", r, r, 0, 1, 0, r * 2, 0, "a", r, r, 0, 1, 0, -r * 2, 0);
  // Adjacent paths with the same style become one path (fewer, shorter elements on a phone), and the
  // round caps and joins are set once on the figure's group instead of on every stroke.
  function compact(s) {
    s = s.split(";stroke-linecap:round;stroke-linejoin:round").join("");
    let prev;
    do {
      prev = s;
      s = s.replace(/<path d="([^"]*)" style="([^"]*)"\/><path d="([^"]*)" style="\2"\/>/g, (m, a, st2, b) => (st2.indexOf("evenodd") >= 0 ? m : '<path d="' + a + b + '" style="' + st2 + '"/>'));
    } while (s !== prev);
    return s;
  }
  const rad = (a) => (a * Math.PI) / 180;
  // A tapered capsule from (x1, y1) to (x2, y2), half-widths w1 and w2.
  function capsule(x1, y1, x2, y2, w1, w2) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 0.01, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    return D("M", x1 + nx * w1, y1 + ny * w1, "L", x2 + nx * w2, y2 + ny * w2, "A", w2, w2, 0, 0, 0, x2 - nx * w2, y2 - ny * w2,
      "L", x1 - nx * w1, y1 - ny * w1, "A", w1, w1, 0, 0, 0, x1 + nx * w1, y1 + ny * w1, "Z");
  }
  // A limb with its shaded side (the one facing +x, away from the light); with (x3, y3, w3) it bends at
  // (x2, y2), like an arm at the elbow or a leg at the knee.
  function limbD(x1, y1, x2, y2, w1, w2) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 0.01;
    let nx = -dy / l, ny = dx / l;
    if (nx < 0 || (nx === 0 && ny < 0)) { nx = -nx; ny = -ny; }
    const o1 = w1 * 0.42, o2 = w2 * 0.42;
    return [capsule(x1, y1, x2, y2, w1, w2), capsule(x1 + nx * o1, y1 + ny * o1, x2 + nx * o2, y2 + ny * o2, w1 * 0.58, w2 * 0.58)];
  }
  function limb(x1, y1, x2, y2, w1, w2, fill, x3, y3, w3) {
    const a = limbD(x1, y1, x2, y2, w1, w2), b = x3 == null ? ["", ""] : limbD(x2, y2, x3, y3, w2, w3);
    return P(a[0] + b[0], fill) + P(a[1] + b[1], "chCel");
  }
  const SKINS = ["chSkin0", "chSkin1", "chSkin2"];
  const HAIRS = ["chHair0", "chHair1", "chHair2"];
  const DYES = [null, "chDye1", "chDye2", "chDye3"];
  // Body plans: H is the height, hd the head (crown to chin), ar the head's width to height, sh and hip
  // the half-widths of shoulders and hips [male, female], leg the crotch height as a share of H.
  const BODY = {
    toddler: { H: 74, hd: 19, ar: 0.86, sh: [10.5, 10.5], hip: [9.6, 9.8], leg: 0.33, neck: 0.04, arm: 0.36, kid: 2 },
    child: { H: 114, hd: 20.5, ar: 0.8, sh: [13, 12.6], hip: [11, 11.4], leg: 0.44, neck: 0.18, arm: 0.38, kid: 1 },
    teen: { H: 142, hd: 21, ar: 0.74, sh: [17.5, 15.4], hip: [13.4, 15], leg: 0.48, neck: 0.3, arm: 0.4 },
    adult: { H: 149, hd: 20.6, ar: 0.72, sh: [19.4, 16.4], hip: [14.6, 16.4], leg: 0.48, neck: 0.31, arm: 0.4 },
    elder: { H: 141, hd: 20.2, ar: 0.74, sh: [17.4, 15.6], hip: [15.4, 17.2], leg: 0.455, neck: 0.22, arm: 0.4, old: 1 },
  };
  function ageOf(o) {
    const look = o.look || {};
    let a = o.age === "kinder" ? "child" : BODY[o.age] ? o.age : o.age === "uni" ? "adult" : "teen";
    if (look.grey && a === "adult") a = "elder";
    return a;
  }
  // The skeleton every part of the drawing hangs off. Exposed through avatar.metrics for portraits.
  function metrics(o) {
    const look = o.look || {}, age = ageOf(o), b = BODY[age], fem = look.sex === "f", k = fem ? 1 : 0;
    const pose = o.pose || "stand", seated = pose === "sit" || pose === "study";
    const H = b.H, hd = b.hd, legL = H * b.leg;
    const drop = seated ? legL * 0.45 : 0;
    const top = -H + drop + (b.old ? 3 : 0);
    const hh = hd / 2, hw = hh * b.ar * (fem && !b.kid ? 0.96 : 1), cy = top + hh, chin = top + hd;
    const shY = chin + hd * b.neck + (b.old ? -1.5 : 0);
    const hipY = -legL + drop;
    return { age, b, fem, k, pose, seated, H, hd, hh, hw, cy, chin, top, shY, hipY, legL, drop,
      waistY: shY + (hipY - shY) * 0.62, SW: b.sh[k], HW: b.hip[k], arm: H * b.arm };
  }

  // ---------- hair ----------
  // Styles by index: the first four keep their old meaning (0 crop, 1 side part, 2 long, 3 bob).
  // Men: 0 crop, 1 side part, 4 two-block, 5 comma, 6 perm, 7 buzz, 8 swept back, 9 shaggy.
  // Women: 2 long, 3 bob, 10 ponytail, 11 bun, 12 long waves, 13 shoulder C-curl, 14 short, 15 braid
  // (pigtails on a child).
  const HAIR_M = [0, 1, 4, 5, 6, 7, 8, 9], HAIR_F = [2, 3, 10, 11, 12, 13, 14, 15];
  function hairColour(look, age) {
    if (age === "elder") return look.sex === "f" ? "chGrey" : "chWhiteH";
    // Dyed hair only once you're grown (school rules), and only some people.
    if (age === "adult" && look.dye && DYES[look.dye]) return DYES[look.dye];
    return HAIRS[(look.hc || 0) % HAIRS.length];
  }
  // Returns { back, front, over }: back goes behind the body, front over the face, over in front of the
  // shoulders (long strands, braids).
  function hairParts(m, look, col) {
    const { hw, hh, hd, cy, top, shY, age } = m;
    let style = look.hair == null ? 0 : look.hair;
    if (age === "elder") style = look.sex === "f" ? 16 : 17;
    else if (age === "toddler") style = look.sex === "f" ? 18 : 19;
    else if (age === "child" && style === 11) style = 10;
    const kid = m.b.kid;
    const T = top - hd * 0.05;
    let back = "", front = "", over = "";
    // A cap over the crown: vol above, side past the temples, down to yS at the sides; edge is the
    // forehead line drawn from the right temple to the left one.
    const cap = (vol, side, yS, edge, yS2) => {
      const X = hw + side, t = T - vol;
      return D("M", -X, yS, "C", -X, cy - hh * 0.62, -X * 0.64, t, 0, t, "C", X * 0.64, t, X, cy - hh * 0.62, X, yS2 == null ? yS : yS2) + " " + edge + " Z";
    };
    const shade = (vol, side, yS) => {
      const X = hw + side, t = T - vol;
      return P(D("M", hw * 0.15, t + 0.4, "C", X * 0.7, t, X + 0.1, cy - hh * 0.55, X, yS, "L", X - hd * 0.13, yS, "C", X * 0.8, cy - hh * 0.45, hw * 0.55, t + hd * 0.13, hw * 0.15, t + 0.4, "Z"), "chCel");
    };
    const sheen = (vol, side) => {
      const X = hw + side, t = T - vol;
      return P(D("M", -X * 0.8, cy - hh * 0.42, "Q", -X * 0.62, t + hd * 0.1, -X * 0.25, t + hd * 0.05, "M", -X * 0.62, cy - hh * 0.46, "Q", -X * 0.45, t + hd * 0.16, -X * 0.1, t + hd * 0.1,
        "M", -X * 0.4, t + hd * 0.08, "Q", -X * 0.1, t + hd * 0.02, X * 0.15, t + hd * 0.06), null, "chSheen", hd * 0.022, "opacity:0.75");
    };
    const strands = (pts, w) => pts.map((d) => P(d, null, "chCel", w || hd * 0.035)).join("");
    // Long hair falling behind the shoulders to y, a little wider than the head.
    const mane = (y, wide, wave) => {
      const X = hw + wide;
      const side = (s) => D("Q", s * (X + 1.5), cy + hh * 0.6, s * (X + (wave ? 2.5 : 1)), (cy + y) / 2, "Q", s * (X + (wave ? 3.5 : 1.2)), y - hd * 0.2, s * (X - 1), y);
      return P(D("M", -X, cy - hh * 0.2) + " " + side(-1) + " " + D("Q", 0, y + hd * 0.12, X - 1, y) + " " + D("Q", X + (wave ? 3.5 : 1.2), y - hd * 0.2, X + (wave ? 2.5 : 1), (cy + y) / 2, "Q", X + 1.5, cy + hh * 0.6, X, cy - hh * 0.2) + " Z", col) +
        P(D("M", X * 0.35, cy, "Q", X + 1.4, cy + hh * 0.6, X + (wave ? 2.5 : 1), (cy + y) / 2, "Q", X + (wave ? 3.5 : 1.2), y - hd * 0.2, X - 1, y, "Q", X * 0.6, y + hd * 0.06, X * 0.35, y, "Z"), "chCel");
    };
    // A curtain of hair in front of the shoulder on side s, from the temple down to y.
    const curtain = (s, y, w, wave) => {
      const x0 = s * (hw + 0.6), x1 = s * (hw - w * 0.4);
      const d = D("M", x0, cy - hh * 0.3, "Q", s * (hw + w * 0.9), cy + hh * 0.8, s * (hw + w * (wave ? 1.3 : 0.9)), y - hd * 0.4, "Q", s * (hw + w * 0.7), y - hd * 0.05, s * (hw + w * 0.25), y,
        "Q", s * (hw - w * 0.05), y - hd * 0.5, x1, cy + hh * 0.75, "Q", s * (hw - w * 0.25), cy, x0, cy - hh * 0.3, "Z");
      return P(d, col) + (s > 0 ? P(d, "chCel") : P(D("M", s * (hw + w * 0.55), cy + hh * 0.4, "Q", s * (hw + w * 0.8), y - hd * 0.6, s * (hw + w * 0.6), y - hd * 0.2), null, "chSheen", hd * 0.04));
    };
    const fr = (y) => cy - hh * y;
    switch (style) {
      case 1: { // side part: a swept fringe from a part on the left
        front = P(cap(hd * 0.1, 1.1, fr(0.05), D("L", hw * 0.92, fr(0.3), "Q", hw * 0.3, fr(0.34), -hw * 0.3, fr(0.6), "L", -hw * 0.82, fr(0.45))), col) + shade(hd * 0.1, 1.1, fr(0.05)) +
          strands([D("M", -hw * 0.38, T - hd * 0.06, "Q", hw * 0.2, T + hd * 0.02, hw * 0.75, fr(0.38)), D("M", -hw * 0.3, fr(0.62), "Q", hw * 0.2, fr(0.5), hw * 0.6, fr(0.36))]) + sheen(hd * 0.1, 1.1);
        break;
      }
      case 2: case 12: { // long straight (center part) or long waves (side part)
        const wave = style === 12, y = shY + hd * (kid ? 1.1 : 1.55), px = wave ? -hw * 0.3 : 0;
        back = mane(y, 2.2, wave);
        front = P(cap(hd * 0.06, 1.4, fr(-0.3), D("Q", hw * 0.55, fr(0.25), px + hw * 0.1, fr(0.82), "Q", px - hw * 0.2, fr(0.6), -hw * 0.95, fr(0.05), "L", -hw - 1.4, fr(-0.3))), col) + shade(hd * 0.06, 1.4, fr(-0.3)) +
          strands([D("M", px, T, "Q", hw * 0.4, fr(0.5), hw * 0.8, fr(-0.2)), D("M", px, T, "Q", -hw * 0.4, fr(0.55), -hw * 0.85, fr(0)) ]) + sheen(hd * 0.06, 1.4);
        over = curtain(-1, y - hd * 0.1, hd * 0.15, wave) + curtain(1, y - hd * 0.3, hd * 0.13, wave);
        break;
      }
      case 3: { // bob to the jaw with see-through bangs
        const y = cy + hh * 0.92, X0 = hw + 2;
        back = P(D("M", -X0, fr(0.5), "C", -X0 - 2.6, cy + hh * 0.1, -X0 - 2.2, y - hd * 0.05, -hw * 0.7, y + 0.6, "Q", 0, y + 1.8, hw * 0.7, y + 0.6, "C", X0 + 2.2, y - hd * 0.05, X0 + 2.6, cy + hh * 0.1, X0, fr(0.5), "Z"), col) +
          P(D("M", hw * 0.3, y + 1.2, "Q", hw * 0.6, y + 1.2, hw - 0.6, y + 0.8, "C", X0 + 1, y - hd * 0.12, X0 + 1.6, cy + hh * 0.2, X0, fr(0.5), "L", hw + 0.5, fr(0.2), "C", hw + 1.2, cy + hh * 0.3, hw + 0.4, y - 2, hw * 0.3, y + 1.2, "Z"), "chCel");
        front = P(cap(hd * 0.1, 2, cy, D("Q", hw + 0.5, fr(0.1), hw * 0.72, fr(0.26), "L", hw * 0.45, fr(0.18), "L", hw * 0.2, fr(0.28), "L", -hw * 0.1, fr(0.17), "L", -hw * 0.4, fr(0.28), "L", -hw * 0.7, fr(0.2), "Q", -hw - 0.5, fr(0.1), -hw - 0.6, cy)), col) +
          shade(hd * 0.1, 2, cy) + strands([D("M", -hw * 0.1, T, "Q", -hw * 0.3, fr(0.5), -hw * 0.4, fr(0.3)), D("M", hw * 0.15, T, "Q", hw * 0.3, fr(0.5), hw * 0.42, fr(0.22))]) + sheen(hd * 0.1, 2);
        break;
      }
      case 4: { // two-block: a heavy fringe to the brows, short sides
        front = P(cap(hd * 0.13, 0.7, fr(0.0), D("L", hw * 0.9, fr(0.22), "L", hw * 0.62, fr(0.16), "L", hw * 0.4, fr(0.24), "L", hw * 0.12, fr(0.15), "L", -hw * 0.18, fr(0.24), "L", -hw * 0.46, fr(0.16), "L", -hw * 0.72, fr(0.25), "L", -hw * 0.92, fr(0.2))), col) +
          P(D("M", -hw - 0.7, fr(0), "L", -hw - 0.5, fr(0.35), "L", -hw + 1.3, fr(0.3), "L", -hw + 1, fr(0), "Z M", hw + 0.7, fr(0), "L", hw + 0.5, fr(0.35), "L", hw - 1.3, fr(0.3), "L", hw - 1, fr(0), "Z"), "chCel") +
          shade(hd * 0.13, 0.7, fr(0.2)) + strands([D("M", -hw * 0.5, T - hd * 0.08, "Q", -hw * 0.4, fr(0.5), -hw * 0.5, fr(0.2)), D("M", hw * 0.1, T - hd * 0.1, "Q", hw * 0.15, fr(0.5), hw * 0.1, fr(0.18)), D("M", hw * 0.55, T - hd * 0.05, "Q", hw * 0.6, fr(0.5), hw * 0.55, fr(0.2))]) + sheen(hd * 0.13, 0.7);
        break;
      }
      case 5: { // comma hair: a parted fringe curling in on one side
        front = P(cap(hd * 0.12, 0.9, fr(0.05), D("L", hw * 0.9, fr(0.3), "Q", hw * 0.5, fr(0.22), hw * 0.15, fr(0.42), "L", -hw * 0.05, fr(0.6), "Q", -hw * 0.3, fr(0.3), -hw * 0.6, fr(0.12), "Q", -hw * 0.45, fr(0.3), -hw * 0.62, fr(0.36), "Q", -hw * 0.85, fr(0.3), -hw * 0.9, fr(0.4))), col) +
          shade(hd * 0.12, 0.9, fr(0.05)) + strands([D("M", 0, T - hd * 0.08, "Q", -hw * 0.4, fr(0.55), -hw * 0.55, fr(0.18)), D("M", hw * 0.05, T - hd * 0.08, "Q", hw * 0.5, fr(0.5), hw * 0.75, fr(0.3))]) + sheen(hd * 0.12, 0.9);
        break;
      }
      case 6: { // perm: curly volume on top
        let bumps = "";
        for (let i = 0; i < 7; i++) { const a = rad(200 + i * 23.3); bumps += O(Math.cos(a) * (hw + 1.6), cy - hh * 0.2 + Math.sin(a) * (hh + hd * 0.06), hd * 0.13, col); }
        front = bumps + P(cap(hd * 0.12, 1.4, fr(0.05), D("Q", hw * 0.8, fr(0.42), hw * 0.45, fr(0.3), "Q", hw * 0.2, fr(0.48), -hw * 0.1, fr(0.32), "Q", -hw * 0.45, fr(0.5), -hw * 0.7, fr(0.32), "Q", -hw * 0.9, fr(0.4), -hw - 1.4, fr(0.05))), col) +
          shade(hd * 0.12, 1.4, fr(0.05)) + strands([D("M", -hw * 0.4, fr(0.75), "q", 1.5, -1.5, 3, 0, "t", 3, 0), D("M", hw * 0.1, fr(0.9), "q", 1.5, -1.5, 3, 0, "t", 3, 0), D("M", -hw * 0.1, fr(0.55), "q", 1.5, -1.5, 3, 0)]) + sheen(hd * 0.12, 1.4);
        break;
      }
      case 7: { // buzz cut
        front = P(cap(hd * 0.02, 0.3, fr(0.05), D("L", hw * 0.85, fr(0.45), "Q", 0, fr(0.6), -hw * 0.85, fr(0.45))), col, null, 0, "opacity:0.88") + shade(hd * 0.02, 0.3, fr(0.05));
        break;
      }
      case 8: { // swept back
        front = P(cap(hd * 0.15, 1, fr(0.05), D("L", hw * 0.8, fr(0.55), "Q", hw * 0.4, fr(0.6), hw * 0.1, fr(0.68), "Q", -hw * 0.1, fr(0.6), -hw * 0.3, fr(0.68), "Q", -hw * 0.6, fr(0.6), -hw * 0.8, fr(0.55))), col) +
          shade(hd * 0.15, 1, fr(0.05)) + strands([D("M", -hw * 0.3, fr(0.66), "Q", -hw * 0.25, T - hd * 0.1, hw * 0.2, T - hd * 0.12), D("M", hw * 0.15, fr(0.66), "Q", hw * 0.25, T - hd * 0.08, hw * 0.7, T - hd * 0.02), D("M", -hw * 0.7, fr(0.55), "Q", -hw * 0.7, T, -hw * 0.2, T - hd * 0.1)]) + sheen(hd * 0.15, 1);
        break;
      }
      case 9: { // shaggy, covering the ears, short at the nape
        back = P(D("M", -hw - 1.6, fr(0.2), "L", -hw - 1.2, cy + hh * 0.75, "Q", 0, cy + hh * 0.95, hw + 1.2, cy + hh * 0.75, "L", hw + 1.6, fr(0.2), "Z"), col);
        front = P(cap(hd * 0.12, 1.6, cy + hh * 0.5, D("L", hw - 0.4, cy + hh * 0.3, "L", hw * 0.8, fr(0.2), "L", hw * 0.55, fr(0.12), "L", hw * 0.3, fr(0.28), "L", 0, fr(0.14), "L", -hw * 0.3, fr(0.3), "L", -hw * 0.58, fr(0.15), "L", -hw * 0.82, fr(0.22), "L", -hw + 0.4, cy + hh * 0.3), cy + hh * 0.55), col) +
          shade(hd * 0.12, 1.6, cy + hh * 0.5) + strands([D("M", -hw * 0.2, T - hd * 0.1, "Q", -hw * 0.3, fr(0.6), -hw * 0.32, fr(0.28)), D("M", hw * 0.3, T - hd * 0.08, "Q", hw * 0.35, fr(0.5), hw * 0.3, fr(0.28)), D("M", -hw - 1, fr(0.1), "L", -hw - 0.6, cy + hh * 0.45)]) + sheen(hd * 0.12, 1.6);
        break;
      }
      case 10: case 11: { // ponytail or bun: pulled back from a soft hairline, a few loose wisps
        if (style === 10) {
          const tx = kid ? 0 : hw * 0.35;
          back = P(D("M", tx - hd * 0.12, T + hd * 0.05, "Q", hw + hd * 0.25, T, hw + hd * 0.12, shY - hd * 0.1, "Q", hw + hd * 0.08, shY + hd * (kid ? 0.6 : 0.9), hw - hd * 0.05, shY + hd * (kid ? 0.7 : 1.05), "Q", hw - hd * 0.12, shY, tx + hd * 0.05, T + hd * 0.15, "Z"), col) +
            P(D("M", hw + hd * 0.05, cy, "Q", hw + hd * 0.12, shY + hd * 0.6, hw - hd * 0.05, shY + hd * (kid ? 0.7 : 1.05), "Q", hw + hd * 0.02, shY, hw - hd * 0.02, cy, "Z"), "chCel") + O(tx, T + hd * 0.06, hd * 0.07, "chCel2");
        } else back = O(0, T - hd * 0.08, hd * 0.22, col) + P(D("M", hd * 0.02, T - hd * 0.28, "A", hd * 0.22, hd * 0.22, 0, 0, 1, hd * 0.12, T + hd * 0.1, "Q", hd * 0.1, T - hd * 0.1, hd * 0.02, T - hd * 0.28, "Z"), "chCel") + P(D("M", -hd * 0.14, T - hd * 0.15, "Q", -hd * 0.05, T - hd * 0.24, hd * 0.06, T - hd * 0.2), null, "chSheen", hd * 0.04);
        front = P(cap(hd * 0.05, 0.8, fr(-0.05), D("Q", hw * 0.8, fr(0.45), hw * 0.4, fr(0.55), "Q", 0, fr(0.68), -hw * 0.4, fr(0.55), "Q", -hw * 0.8, fr(0.45), -hw - 0.8, fr(-0.05))), col) +
          shade(hd * 0.05, 0.8, fr(-0.05)) + strands([D("M", -hw * 0.5, fr(0.5), "Q", -hw * 0.2, T, hw * 0.3, T - hd * 0.02), D("M", hw * 0.45, fr(0.5), "Q", hw * 0.3, T + hd * 0.05, -hw * 0.05, T - hd * 0.04)]) +
          P(D("M", -hw - 0.4, fr(0.2), "Q", -hw - 0.2, cy + hh * 0.3, -hw + 0.6, cy + hh * 0.5) + " " + D("M", hw + 0.4, fr(0.2), "Q", hw + 0.2, cy + hh * 0.3, hw - 0.6, cy + hh * 0.5), null, col, hd * 0.04) + sheen(hd * 0.05, 0.8);
        break;
      }
      case 13: { // shoulder length, C-curl, see-through bangs
        const y = shY + hd * 0.25;
        back = P(D("M", -hw - 2, fr(0.3), "Q", -hw - 3.6, y - hd * 0.4, -hw - 2, y, "Q", -hw * 0.4, y + hd * 0.08, 0, y - 0.5, "Q", hw * 0.4, y + hd * 0.08, hw + 2, y, "Q", hw + 3.6, y - hd * 0.4, hw + 2, fr(0.3), "Z"), col) +
          P(D("M", hw * 0.5, y, "Q", hw + 2, y + 0.5, hw + 2, y, "Q", hw + 3.6, y - hd * 0.4, hw + 2, fr(0.3), "L", hw, cy, "Q", hw + 1, y - hd * 0.3, hw * 0.5, y, "Z"), "chCel");
        front = P(cap(hd * 0.08, 1.8, cy + hh * 0.85, D("Q", hw + 0.3, cy, hw * 0.75, fr(0.25), "L", hw * 0.45, fr(0.12), "L", hw * 0.3, fr(0.3), "L", 0, fr(0.14), "L", -hw * 0.3, fr(0.28), "L", -hw * 0.52, fr(0.12), "L", -hw * 0.75, fr(0.25), "Q", -hw - 0.3, cy, -hw - 0.4, cy + hh * 0.85, "L", -hw - 1.8, cy + hh * 0.85)), col) +
          shade(hd * 0.08, 1.8, cy + hh * 0.85) + strands([D("M", 0, T, "Q", -hw * 0.2, fr(0.5), -hw * 0.3, fr(0.3)), D("M", hw * 0.1, T, "Q", hw * 0.25, fr(0.5), hw * 0.32, fr(0.3))]) + sheen(hd * 0.08, 1.8);
        over = P(D("M", -hw - 1.8, cy + hh * 0.5, "Q", -hw - 2.6, y - hd * 0.2, -hw - 0.4, y - hd * 0.05, "Q", -hw - 0.4, cy + hh, -hw + 0.6, cy + hh * 0.4, "Z"), col) +
          P(D("M", hw + 1.8, cy + hh * 0.5, "Q", hw + 2.6, y - hd * 0.2, hw + 0.4, y - hd * 0.05, "Q", hw + 0.4, cy + hh, hw - 0.6, cy + hh * 0.4, "Z"), col);
        break;
      }
      case 14: { // short women's cut: a long side-swept fringe, ears showing
        back = P(D("M", -hw - 1.4, fr(0.1), "L", -hw - 0.8, cy + hh * 0.55, "Q", 0, cy + hh * 0.7, hw + 0.8, cy + hh * 0.55, "L", hw + 1.4, fr(0.1), "Z"), col);
        front = P(cap(hd * 0.1, 1.4, fr(-0.1), D("Q", hw * 0.95, fr(0.15), hw * 0.75, fr(0.18), "Q", hw * 0.2, fr(0.12), -hw * 0.35, fr(0.62), "Q", -hw * 0.75, fr(0.5), -hw - 0.4, fr(0.1), "L", -hw - 1.4, fr(-0.1))), col) +
          shade(hd * 0.1, 1.4, fr(-0.1)) + strands([D("M", -hw * 0.35, T - hd * 0.05, "Q", hw * 0.1, fr(0.4), hw * 0.7, fr(0.2)), D("M", -hw * 0.2, fr(0.6), "Q", hw * 0.2, fr(0.35), hw * 0.55, fr(0.2))]) + sheen(hd * 0.1, 1.4);
        break;
      }
      case 15: { // braid over the shoulder, or pigtails on a child
        back = mane(kid ? cy + hh * 0.8 : shY + hd * 0.3, 1.4);
        front = P(cap(hd * 0.06, 1.2, fr(-0.1), D("Q", hw * 0.6, fr(0.4), 0, fr(0.75), "Q", -hw * 0.6, fr(0.4), -hw - 1.2, fr(-0.1))), col) + shade(hd * 0.06, 1.2, fr(-0.1)) +
          strands([D("M", 0, T, "Q", hw * 0.5, fr(0.45), hw * 0.9, fr(0)), D("M", 0, T, "Q", -hw * 0.5, fr(0.45), -hw * 0.9, fr(0))]) + sheen(hd * 0.06, 1.2);
        if (kid) {
          for (const s of [-1, 1]) {
            const x = s * (hw + hd * 0.08), y = cy + hh * 0.35;
            over += P(D("M", x, y, "Q", x + s * hd * 0.3, y + hd * 0.3, x + s * hd * 0.12, y + hd * 0.75, "Q", x - s * hd * 0.05, y + hd * 0.4, x, y, "Z"), col) + O(x, y, hd * 0.06, "chWine");
          }
        } else {
          let br = "";
          for (let i = 0; i < 6; i++) br += E(hw * 0.75 + i * 0.3, shY + hd * (0.05 + i * 0.22), hd * 0.11, hd * 0.13, col) + P(D("M", hw * 0.65 + i * 0.3, shY + hd * (0.05 + i * 0.22), "q", hd * 0.1, hd * 0.06, hd * 0.2, 0), null, "chCel", hd * 0.03);
          over = P(D("M", hw * 0.4, cy + hh * 0.4, "Q", hw + 1, cy + hh * 0.9, hw * 0.75, shY + hd * 0.05), null, col, hd * 0.2) + br + O(hw * 0.75 + 1.8, shY + hd * 1.35, hd * 0.06, "chWine") +
            P(D("M", hw * 0.75 + 1.8, shY + hd * 1.38, "l", -1.2, hd * 0.25, "l", 2.4, 0, "z"), col);
        }
        break;
      }
      case 16: { // grandmother: a short tight perm
        let curls = "";
        for (let i = 0; i < 11; i++) { const a = rad(170 + i * 20); curls += O(Math.cos(a) * (hw + 0.8), cy - hh * 0.1 + Math.sin(a) * (hh + hd * 0.02), hd * 0.12, col); }
        back = O(-hw - 0.5, cy + hh * 0.15, hd * 0.14, col) + O(hw + 0.5, cy + hh * 0.15, hd * 0.14, col);
        front = curls + P(cap(hd * 0.08, 1.6, fr(0.05), D("Q", hw * 0.6, fr(0.45), 0, fr(0.5), "Q", -hw * 0.6, fr(0.45), -hw - 1.6, fr(0.05))), col) + shade(hd * 0.08, 1.6, fr(0.05)) +
          strands([D("M", -hw * 0.5, fr(0.7), "q", 1.2, -1.2, 2.4, 0, "t", 2.4, 0), D("M", hw * 0.05, fr(0.85), "q", 1.2, -1.2, 2.4, 0, "t", 2.4, 0), D("M", -hw * 0.2, fr(0.55), "q", 1.2, -1.2, 2.4, 0)], hd * 0.03);
        break;
      }
      case 17: { // grandfather: thinning, a receding hairline, combed to the side
        front = P(cap(hd * 0.03, 0.8, fr(0.05), D("L", hw * 0.8, fr(0.35), "Q", hw * 0.55, fr(0.62), hw * 0.2, fr(0.66), "Q", -hw * 0.2, fr(0.7), -hw * 0.55, fr(0.62), "Q", -hw * 0.75, fr(0.4), -hw * 0.85, fr(0.35))), col) +
          shade(hd * 0.03, 0.8, fr(0.05)) + strands([D("M", -hw * 0.5, fr(0.62), "Q", 0, T, hw * 0.6, fr(0.5)), D("M", -hw * 0.3, fr(0.68), "Q", hw * 0.1, T + hd * 0.05, hw * 0.6, fr(0.6))], hd * 0.03);
        break;
      }
      case 18: { // toddler girl: fine hair with a little top-knot
        front = P(cap(hd * 0.02, 0.5, fr(0.1), D("Q", hw * 0.5, fr(0.5), 0, fr(0.45), "Q", -hw * 0.5, fr(0.5), -hw - 0.5, fr(0.1))), col) + shade(hd * 0.02, 0.5, fr(0.1)) +
          P(D("M", -hd * 0.05, T, "Q", -hd * 0.12, T - hd * 0.2, hd * 0.02, T - hd * 0.24, "Q", hd * 0.04, T - hd * 0.1, hd * 0.06, T), col) + O(0, T - hd * 0.04, hd * 0.05, "chWine");
        break;
      }
      case 19: { // toddler boy: fine short hair
        front = P(cap(hd * 0.02, 0.4, fr(0.15), D("L", hw * 0.6, fr(0.42), "L", hw * 0.2, fr(0.5), "L", 0, fr(0.4), "L", -hw * 0.3, fr(0.52), "L", -hw * 0.7, fr(0.4))), col) + shade(hd * 0.02, 0.4, fr(0.15));
        break;
      }
      default: { // 0, crop: short and neat
        front = P(cap(hd * 0.09, 0.9, fr(0.05), D("L", hw * 0.86, fr(0.4), "L", hw * 0.62, fr(0.36), "L", hw * 0.45, fr(0.44), "L", hw * 0.2, fr(0.38), "L", 0, fr(0.46), "L", -hw * 0.25, fr(0.38), "L", -hw * 0.5, fr(0.45), "L", -hw * 0.72, fr(0.38), "L", -hw * 0.88, fr(0.42))), col) +
          shade(hd * 0.09, 0.9, fr(0.05)) + strands([D("M", -hw * 0.2, T - hd * 0.05, "Q", -hw * 0.1, fr(0.6), -hw * 0.25, fr(0.42)), D("M", hw * 0.35, T - hd * 0.03, "Q", hw * 0.4, fr(0.6), hw * 0.3, fr(0.42))]) + sheen(hd * 0.09, 0.9);
      }
    }
    // Sideburns for short men's cuts.
    if (!m.fem && !kid && [0, 1, 4, 5, 6, 8].indexOf(style) >= 0) front += P(D("M", -hw + 0.1, fr(0.1), "L", -hw + 0.4, cy + hh * 0.08, "L", -hw + 1.1, cy + hh * 0.04, "L", -hw + 1.3, fr(0.1), "Z M", hw - 0.1, fr(0.1), "L", hw - 0.4, cy + hh * 0.08, "L", hw - 1.1, cy + hh * 0.04, "L", hw - 1.3, fr(0.1), "Z"), col, null, 0, "opacity:0.85");
    return { back, front, over };
  }

  // ---------- head and face ----------
  // Expressions: how open the eyes are (lid 0 = wide, 1 = shut), the lower lid's lift (smiling eyes),
  // the brows (inner end and outer end raised or lowered), and the mouth (curve, width, open).
  const EXPR = {
    happy: { lid: 0.16, low: 0.5, bi: 0, bo: 0.05, curve: 0.85, mw: 1.08, open: 0.35 },
    ok: { lid: 0.1, low: 0.12, bi: 0, bo: 0, curve: 0.25, mw: 0.95, open: 0 },
    tired: { lid: 0.46, low: 0.05, bi: 0.05, bo: -0.18, curve: -0.1, mw: 0.9, open: 0, bags: 1 },
    stressed: { lid: 0.0, low: 0.05, bi: 0.32, bo: -0.08, curve: -0.35, mw: 0.85, open: 0, knit: 1, sweat: 1 },
    sick: { lid: 0.42, low: 0.1, bi: 0.18, bo: -0.12, curve: -0.25, mw: 0.85, open: 0.25, bags: 1, flush: 1, pale: 1 },
    grumpy: { lid: 0.3, low: 0.3, bi: -0.3, bo: 0.08, curve: -0.6, mw: 0.9, open: 0, knit: 1 },
  };
  function head(m, look, mood, skin, col, o) {
    const { hw, hh, hd, cy, age, fem } = m;
    const kid = m.b.kid, old = m.b.old;
    const ex = EXPR[mood] || EXPR.ok;
    // Face outline: cranium, cheekbones, jaw and chin; rounder for children, a narrower V for women.
    const jx = hw * (kid === 2 ? 0.94 : kid ? 0.86 : fem ? 0.78 : 0.86), jy = cy + hh * (kid === 2 ? 0.56 : kid ? 0.48 : 0.46), cw = hw * (kid === 2 ? 0.5 : kid ? 0.38 : fem ? 0.28 : 0.34);
    const face = D("M", 0, cy - hh, "C", hw * 0.56, cy - hh, hw, cy - hh * 0.62, hw, cy - hh * 0.08, "C", hw, cy + hh * 0.2, jx + hw * 0.08, jy - hh * 0.2, jx, jy,
      "C", jx - hw * 0.1, jy + hh * 0.28, cw + hw * 0.18, cy + hh, cw * 0.4, cy + hh, "L", -cw * 0.4, cy + hh, "C", -cw - hw * 0.18, cy + hh, -jx + hw * 0.1, jy + hh * 0.28, -jx, jy,
      "C", -jx - hw * 0.08, jy - hh * 0.2, -hw, cy + hh * 0.2, -hw, cy - hh * 0.08, "C", -hw, cy - hh * 0.62, -hw * 0.56, cy - hh, 0, cy - hh, "Z");
    let s = "";
    // Ears, behind the face.
    for (const sd of [-1, 1]) s += P(D("M", sd * (hw - 0.6), cy - hh * 0.08, "Q", sd * (hw + hd * 0.1), cy - hh * 0.2, sd * (hw + hd * 0.09), cy + hh * 0.12, "Q", sd * (hw + hd * 0.06), cy + hh * 0.36, sd * (hw - 0.6), cy + hh * 0.3, "Z"), skin) +
      (sd > 0 ? P(D("M", hw - 0.2, cy - hh * 0.05, "Q", hw + hd * 0.07, cy - hh * 0.12, hw + hd * 0.06, cy + hh * 0.12, "Q", hw + hd * 0.04, cy + hh * 0.3, hw - 0.2, cy + hh * 0.26, "Z"), "chSkinSh") : "");
    s += P(face, skin);
    const faceSh = kid === 2 ? "opacity:0.55" : "";
    // Cel shade down the right of the face and under the jaw; a rim of light on the left cheek.
    s += P(D("M", hw * 0.62, cy - hh * 0.85, "C", hw * 0.95, cy - hh * 0.6, hw, cy - hh * 0.2, hw, cy - hh * 0.08, "C", hw, cy + hh * 0.2, jx + hw * 0.08, jy - hh * 0.2, jx, jy,
      "C", jx - hw * 0.1, jy + hh * 0.28, cw + hw * 0.18, cy + hh, cw * 0.4, cy + hh, "C", cw + hw * 0.1, cy + hh * 0.8, jx - hw * 0.12, jy, hw * 0.68, cy + hh * 0.1, "C", hw * 0.78, cy - hh * 0.3, hw * 0.75, cy - hh * 0.6, hw * 0.62, cy - hh * 0.85, "Z"), "chSkinSh", null, 0, faceSh);
    s += P(D("M", -hw + 0.4, cy - hh * 0.1, "C", -hw + 0.4, cy + hh * 0.2, -jx - hw * 0.02, jy - hh * 0.2, -jx + 0.6, jy), null, "chRim", hd * 0.035);
    if (!kid) {
      // Cheekbone shadow and the jaw line, stronger on men and with age.
      s += P(D("M", hw * 0.92, cy + hh * 0.08, "Q", hw * 0.62, cy + hh * 0.3, hw * 0.5, cy + hh * 0.5), null, "chSkinSh", hd * (fem ? 0.03 : 0.05));
    }
    if (ex.pale) s += P(face, "chPale", null, 0, "opacity:0.6");
    // Eyes: almond shapes under a lid; children's larger and set lower.
    const ey = cy + hh * (kid === 2 ? 0.2 : kid ? 0.14 : 0.04), ex0 = hw * (kid ? 0.42 : 0.43), ew = hw * (kid === 2 ? 0.22 : kid ? 0.24 : fem ? 0.23 : 0.22), eh = hd * (kid === 2 ? 0.085 : kid ? 0.072 : 0.06);
    const look_ = look;
    const studying = m.pose === "study";
    const lid = Math.min(0.85, ex.lid + (studying ? 0.25 : 0) + (old ? 0.08 : 0)), low = ex.low;
    // The eyeballs are clipped to the two almonds, so the lid can close over the iris. The lash line is a
    // filled crescent along the lid, thickest toward the outer corner.
    const Hh = ew * (kid === 2 ? 0.66 : kid ? 0.55 : 0.42);
    const L = { white: "", iris: "", pupil: "", glint: "", lidSkin: "", lidSh: "", lash: "", low: "", crease: "", bags: "" };
    for (const sd of [-1, 1]) {
      const x = sd * ex0, ix = x - sd * ew, ox = x + sd * ew; // inner and outer corners
      const iy = ey + Hh * 0.2, oy = ey - Hh * (kid ? 0.05 : 0.25);
      const cU = ey - Hh * 2.0, cL = ey + Hh * (1.6 - low * 1.1);
      L.white += D("M", ix, iy, "Q", x - sd * ew * 0.12, cU, ox, oy, "Q", x + sd * ew * 0.12, cL, ix, iy, "Z");
      const irisX = x + sd * ew * 0.03, irisY = ey + Hh * (studying ? 0.55 : 0.1), ir = Hh * 1.12;
      const cLid = cU + lid * (cL - cU) * 1.05;
      const lidC = D("M", ix, iy, "Q", x - sd * ew * 0.12, cLid, ox, oy);
      L.iris += ring(irisX, irisY, ir); L.pupil += ring(irisX, irisY, ir * 0.48); L.glint += ring(irisX - ir * 0.35, irisY - ir * 0.35, ir * 0.16);
      L.lidSkin += lidC + D("L", ox + sd * 2, oy, "L", ox + sd * 2, ey - Hh * 6, "L", ix - sd * 2, ey - Hh * 6, "Z");
      L.lidSh += lidC + D("Q", x - sd * ew * 0.12, cLid + Hh * 1.1, ix, iy, "Z");
      // Lash line along the lid; a faint lower lid; a crease above for some looks.
      const t = hd * (kid ? 0.022 : fem ? 0.04 : 0.03);
      L.lash += D("M", ix, iy, "Q", x - sd * ew * 0.12, cLid, ox, oy, "L", ox + sd * (fem && !kid ? t * 1.6 : t * 0.4), oy - t * (fem && !kid ? 1.4 : 0.6), "Q", x - sd * ew * 0.05, cLid - t * 2.2, ix + sd * ew * 0.1, iy - t * 0.6, "Z");
      L.low += D("M", ix + sd * ew * 0.25, iy + Hh * 0.05, "Q", x + sd * ew * 0.12, cL - Hh * 0.1, ox - sd * ew * 0.1, oy + Hh * 0.35);
      if (look_.lid && kid !== 2) L.crease += D("M", ix + sd * ew * 0.35, iy - Hh * 1.0, "Q", x, cLid - Hh * 1.3, ox - sd * ew * 0.08, oy - Hh * 0.9);
      if (ex.bags || old) L.bags += D("M", ix + sd * ew * 0.25, iy + Hh * 1.0, "Q", x + sd * ew * 0.2, cL + Hh * 0.6, ox - sd * ew * 0.05, oy + Hh * 1.3);
    }
    // The eyeballs are clipped to the two almonds, so the lid can close over the iris; the lash line is a
    // filled crescent along the lid, thickest toward the outer corner.
    const cid = nid("eye");
    let eyes = '<clipPath id="' + cid + '"><path d="' + L.white + '"/></clipPath><g clip-path="url(#' + cid + ')">' +
      P(L.white, "chWhite") + P(L.iris, "chIris") + P(L.pupil, "chLash") + P(L.glint, "chSheen") + P(L.lidSkin, skin) + P(L.lidSh, "chCel") + "</g>" +
      P(L.lash, "chLash") + P(L.low, null, "chSkinSh2", hd * 0.018) + (L.crease ? P(L.crease, null, "chSkinSh2", hd * 0.016) : "") +
      (L.bags ? P(L.bags, null, ex.bags ? "chBags" : "chSkinSh", hd * (ex.bags ? 0.05 : 0.022)) : "");
    s += o.still ? eyes : A("blink", eyes);
    // Brows: tapered, thicker at the inner end; women's straighter and finer.
    const by = ey - eh * (kid ? 3.2 : 3.6);
    for (const sd of [-1, 1]) {
      const x0 = sd * hw * 0.14, x1 = sd * hw * 0.82;
      const yi = by - ex.bi * hd * 0.07 + (ex.knit ? hd * 0.012 : 0), yo = by - ex.bo * hd * 0.07 + hd * (fem ? 0.005 : 0.015);
      const t = hd * (kid === 2 ? 0.012 : kid ? 0.02 : fem ? 0.024 : 0.032);
      s += P(D("M", x0 + (ex.knit ? sd * -0.3 : 0), yi + t, "Q", (x0 + x1) / 2, (yi + yo) / 2 - hd * (fem ? 0.025 : 0.03) - t * 0.5, x1, yo + t * 0.3, "Q", (x0 + x1) / 2, (yi + yo) / 2 - hd * 0.005 + t, x0 + (ex.knit ? sd * -0.3 : 0), yi + t * 2.2, "Z"), col, null, 0, kid === 2 ? "opacity:0.45" : kid ? "opacity:0.8" : "");
    }
    if (ex.knit && !kid) s += P(D("M", -hw * 0.05, by - hd * 0.02, "l", 0.2, hd * 0.06, "M", hw * 0.06, by - hd * 0.015, "l", -0.15, hd * 0.06), null, "chSkinSh2", hd * 0.02);
    if (old) s += P(D("M", -hw * 0.5, cy - hh * 0.5, "Q", 0, cy - hh * 0.56, hw * 0.5, cy - hh * 0.5, "M", -hw * 0.4, cy - hh * 0.38, "Q", 0, cy - hh * 0.43, hw * 0.4, cy - hh * 0.38), null, "chSkinSh", hd * 0.02);
    // Nose: a shadow down the right of the bridge and under the tip, a touch of light on the tip.
    const ny = cy + hh * (kid ? 0.42 : 0.4);
    if (kid) s += P(D("M", -hw * 0.08, ny, "Q", 0, ny + hd * 0.03, hw * 0.1, ny), null, "chSkinSh2", hd * 0.03);
    else s += P(D("M", hw * 0.05, ey + eh, "Q", hw * 0.12, ny - hd * 0.06, hw * 0.16, ny - hd * 0.01, "Q", hw * 0.04, ny + hd * 0.03, -hw * 0.06, ny, "Q", hw * 0.04, ny - hd * 0.02, hw * 0.05, ey + eh, "Z"), "chSkinSh") +
      P(D("M", -hw * 0.17, ny - hd * 0.005, "Q", -hw * 0.1, ny + hd * 0.035, 0, ny + hd * 0.02, "Q", hw * 0.1, ny + hd * 0.035, hw * 0.17, ny - hd * 0.005), null, "chSkinSh2", hd * 0.028) +
      O(-hw * 0.04, ny - hd * 0.03, hd * 0.025, "chSheen");
    if (old) s += P(D("M", -hw * 0.3, ny - hd * 0.02, "Q", -hw * 0.42, ny + hd * 0.1, -hw * 0.38, ny + hd * 0.18, "M", hw * 0.3, ny - hd * 0.02, "Q", hw * 0.42, ny + hd * 0.1, hw * 0.38, ny + hd * 0.18), null, "chSkinSh", hd * 0.025);
    if (ex.flush) s += E(0, ny - hd * 0.04, hw * 0.75, hd * 0.06, "chFlush");
    // Mouth: lips with the corners set by the expression; a hint of teeth on a real smile.
    const my = cy + hh * (kid ? 0.66 : 0.64), mw = hw * (kid ? 0.26 : fem ? 0.3 : 0.32) * ex.mw, cv = ex.curve * hd * 0.035;
    const lipA = fem && !kid ? 1 : 0.55;
    const opn = ex.open * hd * 0.04;
    s += P(D("M", -mw, my - cv, "Q", -mw * 0.4, my - hd * 0.035, 0, my - hd * 0.022, "Q", mw * 0.4, my - hd * 0.035, mw, my - cv, "Q", 0, my + cv * 0.3 + opn * 0.4, -mw, my - cv, "Z"), "chLipSh", null, 0, "opacity:" + lipA);
    if (opn) s += P(D("M", -mw * 0.8, my - cv * 0.8, "Q", 0, my + opn * 1.6 + cv * 0.2, mw * 0.8, my - cv * 0.8, "Q", 0, my + cv * 0.1, -mw * 0.8, my - cv * 0.8, "Z"), "chWhite");
    s += P(D("M", -mw * 0.85, my - cv * 0.7 + opn, "Q", 0, my + hd * 0.06 + opn, mw * 0.85, my - cv * 0.7 + opn, "Q", 0, my + opn * 0.6 + cv * 0.2, -mw * 0.85, my - cv * 0.7 + opn, "Z"), "chLip", null, 0, "opacity:" + lipA);
    s += P(D("M", -mw - 0.2, my - cv * 1.05, "Q", 0, my + cv * 0.35 + opn * 0.3, mw + 0.2, my - cv * 1.05), null, "chLipSh", hd * 0.03);
    if (!kid) s += P(D("M", -mw * 0.45, my + hd * 0.1 + opn, "Q", 0, my + hd * 0.12 + opn, mw * 0.45, my + hd * 0.1 + opn), null, "chSkinSh", hd * 0.025, "opacity:0.6");
    if (old) s += P(D("M", -mw - hw * 0.12, my - hd * 0.06, "Q", -mw - hw * 0.18, my + hd * 0.02, -mw - hw * 0.08, my + hd * 0.08, "M", mw + hw * 0.12, my - hd * 0.06, "Q", mw + hw * 0.18, my + hd * 0.02, mw + hw * 0.08, my + hd * 0.08), null, "chSkinSh", hd * 0.022);
    if (ex.knit && mood === "stressed" && !kid) s += P(D("M", jx - hw * 0.05, jy - hh * 0.05, "q", -hw * 0.06, hh * 0.1, -hw * 0.02, hh * 0.18), null, "chSkinSh", hd * 0.025);
    if (ex.sweat) s += G(hw * 0.86, cy - hh * 0.3, A("drip", P(D("M", 0, -hd * 0.08, "Q", hd * 0.05, 0, 0, hd * 0.04, "Q", -hd * 0.05, 0, 0, -hd * 0.08, "Z"), "chLens", "chSheen", 0.3)));
    // Glasses: thin frames over the eyes.
    if (look.glasses && age !== "toddler" && o.outfit !== "smock") {
      const gw = ew * 1.45, gh = eh * 2.7;
      s += P(D("M", -ex0 - gw, ey - gh * 0.55, "h", gw * 2, "v", gh, "h", -gw * 2, "Z", "M", ex0 - gw, ey - gh * 0.55, "h", gw * 2, "v", gh, "h", -gw * 2, "Z"), "chLens") +
        R(n1(-ex0 - gw), n1(ey - gh * 0.55), n1(gw * 2), n1(gh), null, gh * 0.3, "chFrame", hd * 0.018) + R(n1(ex0 - gw), n1(ey - gh * 0.55), n1(gw * 2), n1(gh), null, gh * 0.3, "chFrame", hd * 0.018) +
        P(D("M", -ex0 + gw, ey - gh * 0.25, "Q", 0, ey - gh * 0.45, ex0 - gw, ey - gh * 0.25, "M", -ex0 - gw, ey - gh * 0.3, "L", -hw - 0.3, ey - gh * 0.4, "M", ex0 + gw, ey - gh * 0.3, "L", hw + 0.3, ey - gh * 0.4), null, "chFrame", hd * 0.018);
    }
    return s;
  }

  // ---------- clothes ----------
  // What a figure wears, worked out once: top (garment kind and colour), sleeves, bottom, legs, shoes
  // and any layer over the top.
  const CASUAL_TOPS = [["knit", "chDusty"], ["cardi", "chBeige"], ["over", "chOlive"], ["sweat", "chOat"], ["knit", "chWine"], ["cardi", "chSlate"]];
  function dressFor(o, m, look) {
    const season = o.season || "spring", gear = o.gear || "", outfit = o.outfit || "uniform", fem = m.fem;
    const hot = season === "summer", cold = season === "winter";
    const sh = (look.shirt || 0) | 0;
    const d = { top: "tee", topC: "chDusty", sleeve: "long", bottom: "pants", botC: "chSlacks", legs: "skin", shoes: "chShoe", neck: "", layer: "", hat: "", trim: "" };
    // Adults: grandparents, carers and work clothes first, then everyday casual wear.
    if (m.age === "elder") return Object.assign(d, fem ? { top: "blouse", topC: "chFloral", layer: "cardigan", layerC: "chCardi", bottom: "pants", botC: "chSlate", shoes: "chShoe" }
      : { top: "shirt", topC: "chOat", layer: "jvest", layerC: "chOlive", bottom: "pants", botC: "chSlacks", shoes: "chShoe" });
    if (m.age === "toddler") return Object.assign(d, { top: "onesie", topC: "chOnesie", bottom: "onesie", botC: "chOnesie", shoes: "chOnesie2", sleeve: hot ? "short" : "long" });
    if (outfit === "smock") return Object.assign(d, { top: "smock", topC: "chSmock", bottom: fem ? "skirt" : "shorts", botC: "chSlate", legs: "socks", shoes: "chSneaker", hat: "kinder", sleeve: "long" });
    if (outfit === "kid" || (m.b.kid && outfit !== "uniform" && outfit !== "pe")) {
      const c = ["chDusty", "chMustard", "chOlive", "chWine"][sh % 4];
      Object.assign(d, { top: "tee", topC: c, trim: "stripe", sleeve: hot ? "short" : "long", shoes: "chSneaker", legs: hot ? "skin" : "socks" });
      if (fem && sh % 2) Object.assign(d, { bottom: "skirt", botC: sh % 4 === 1 ? "chCheck" : "chSlate", legs: cold ? "tights" : "socks" });
      else Object.assign(d, { bottom: hot ? "shorts" : "pants", botC: sh % 2 ? "chKhaki" : "chDenim" });
      if (cold) d.layer = "puffer";
      return d;
    }
    if (outfit === "pe") return Object.assign(d, { top: "track", topC: "chTrack", bottom: "pants", botC: "chTrack", trim: "track", shoes: "chSneaker" });
    if (outfit === "uniform") {
      const blz = o.school === "mid" ? "chBlazerM" : "chBlazer";
      Object.assign(d, { top: hot ? "shirt" : "blazer", topC: hot ? "chShirt" : blz, sleeve: hot ? "short" : "long", neck: fem ? "ribbon" : "tie",
        bottom: fem ? "pleats" : "pants", botC: fem ? "chCheck" : "chSlacks", legs: fem ? (cold ? "tights" : "socks") : "skin", shoes: "chShoe" });
      if (cold) d.layer = "longpad";
      return d;
    }
    if (outfit === "hoodie") {
      Object.assign(d, { top: hot ? "tee" : "hoodie", topC: hot ? "chOat" : "chHoodie", sleeve: hot ? "short" : "long", bottom: "pants", botC: hot ? "chSlate" : "chCharcoal", shoes: "chSneaker" });
      if (cold) d.layer = "longpad";
      return d;
    }
    if (gear === "suit") return Object.assign(d, { top: "suit", topC: "chCharcoal", neck: fem ? "blouse" : "tie", bottom: fem ? "pencil" : "pants", botC: "chCharcoal", legs: "skin", shoes: "chShoe" });
    if (gear === "coat") return Object.assign(d, { top: "shirt", topC: fem ? "chOat" : "chDriver", neck: fem ? "" : "tie", bottom: "pants", botC: "chSlacks", layer: "whitecoat", shoes: "chShoe" });
    if (gear === "scrubs") return Object.assign(d, { top: "scrubs", topC: "chScrub", sleeve: "short", bottom: "pants", botC: "chScrub", shoes: "chSneaker" });
    if (gear === "apron") return Object.assign(d, { top: "shirt", topC: sh % 2 ? "chOat" : "chSlate", sleeve: "rolled", bottom: "pants", botC: "chSlacks", layer: "apron", layerC: "chApron", shoes: "chShoe" });
    if (gear === "carer") return Object.assign(d, { top: "knit", topC: "chDusty", bottom: "pants", botC: "chSlacks", layer: "apron", layerC: "chOat", shoes: "chSneaker" });
    if (gear === "hardhat") return Object.assign(d, { top: "work", topC: "chKhaki", bottom: "pants", botC: "chKhaki", layer: "visvest", hat: "hardhat", shoes: "chShoe" });
    if (gear === "vest") return Object.assign(d, { top: "work", topC: "chWork", bottom: "pants", botC: "chWork", layer: "visvest", shoes: "chShoe" });
    if (gear === "cap") return Object.assign(d, { top: "shirt", topC: "chDriver", sleeve: hot ? "short" : "long", bottom: "pants", botC: "chBlazer", hat: "cap", shoes: "chShoe" });
    if (gear === "straw") return Object.assign(d, { top: "work", topC: "chOlive", bottom: "pants", botC: "chKhaki", hat: "straw", neck: "towel", shoes: "chShoe" });
    if (gear === "helmet") return Object.assign(d, { top: "work", topC: "chBlazer", bottom: "pants", botC: "chBlazer", hat: "helmet", shoes: "chShoe" });
    const [kind, col] = CASUAL_TOPS[sh % CASUAL_TOPS.length];
    Object.assign(d, { top: hot ? "tee" : kind, topC: hot ? ["chOat", "chDusty", "chOlive", "chSlate"][sh % 4] : col, sleeve: hot ? "short" : "long", shoes: sh % 2 ? "chSneaker" : "chShoe" });
    const bot = (sh + (look.hair || 0)) % 3;
    if (fem && bot === 1) Object.assign(d, { bottom: "longskirt", botC: sh % 2 ? "chOlive" : "chOat" });
    else Object.assign(d, { bottom: "pants", botC: bot === 0 ? "chDenim" : bot === 1 ? "chBeige" : "chSlacks" });
    if (cold) Object.assign(d, { layer: "coat", layerC: sh % 2 ? "chCharcoal" : "chCamel", neck: "scarf" });
    return d;
  }
  // The torso outline from the neck down to hemY (hem half-width hw2), with an optional puff.
  function torsoPath(m, hemY, hw2, puff) {
    const { SW, HW, shY, waistY, fem, hw } = m;
    const p = puff || 0, nw = hw * 0.52, wW = (fem ? HW * 0.8 : Math.max(HW * 0.98, SW * 0.82)) + p, aY = shY + m.hd * 0.75;
    return D("M", -nw, shY - 3.2, "Q", -SW * 0.72, shY - 3.4 - p * 0.3, -(SW + p * 0.4), shY + 2, "Q", -(SW + 1.5 + p), shY + 6, -(SW - 0.6 + p * 0.6), aY,
      "Q", -(wW + 0.4), (aY + waistY) / 2, -wW, waistY, "Q", -wW, (waistY + hemY) / 2, -hw2, hemY, "L", hw2, hemY) + " " + reverseSide(m, hemY, hw2, p, 1) + " Z";
  }
  // The right-hand outline of torsoPath walked upward from the hem to the neck.
  function reverseSide(m, hemY, hw2, p, s) {
    const { SW, HW, shY, waistY, fem, hw } = m;
    const nw = hw * 0.52, wW = (fem ? HW * 0.8 : Math.max(HW * 0.98, SW * 0.82)) + p, aY = shY + m.hd * 0.75;
    return D("Q", s * wW, (waistY + hemY) / 2, s * wW, waistY, "Q", s * (wW + 0.4), (aY + waistY) / 2, s * (SW - 0.6 + p * 0.6), aY, "Q", s * (SW + 1.5 + p), shY + 6, s * (SW + p * 0.4), shY + 2,
      "Q", s * SW * 0.72, shY - 3.4 - p * 0.3, s * nw, shY - 3.2);
  }
  // Cel shade down the right of a torso shape.
  function torsoShade(m, hemY, hw2, p) {
    const { SW, shY } = m;
    return P(D("M", SW * 0.45, shY - 2.6, "Q", SW * 0.72, shY - 3.2 - (p || 0) * 0.3, SW + (p || 0) * 0.4, shY + 2, "L", hw2, hemY, "L", hw2 * 0.55, hemY, "Q", SW * 0.42, (shY + hemY) / 2, SW * 0.45, shY - 2.6, "Z"), "chCel");
  }

  // ---------- the figure ----------
  // Arm angles per pose, in degrees from hanging straight down; positive swings away from the body,
  // 180 is straight up. [upper arm, forearm] for the left (s = -1) and right (s = 1) arms.
  const POSES = {
    stand: { l: [7, 3], r: [7, 3] }, cheer: { l: [138, 160], r: [138, 160] }, wave: { l: [7, 3], r: [128, 172] },
    hold: { l: [7, 3], r: [10, -138] }, clasp: { l: [12, -52], r: [12, -58] }, baby: { l: [22, -78], r: [12, -96] },
    sit: { l: [6, -28], r: [6, -28] }, study: { l: [16, -78], r: [16, -84] }, run: { l: [26, -150], r: [18, -55] },
  };
  function avatar(o) {
    const look = o.look || { hair: 0, skin: 0, shirt: 0 };
    const m = metrics(o);
    const { hd, hw, cy, shY, hipY, SW, HW, fem, legL, age } = m;
    const kid = m.b.kid;
    const skin = SKINS[(look.skin || 0) % SKINS.length];
    const col = hairColour(look, age);
    const mood = o.mood || "ok";
    const prop = o.prop || "";
    let pose = o.pose || "stand";
    const armPose = pose === "hold" ? (prop === "baby" ? "baby" : prop && prop !== "medal" && prop !== "mask" && prop !== "headphones" ? "hold" : "clasp") : POSES[pose] ? pose : "stand";
    const d = dressFor(o, m, look);
    const sc = m.H / 154;
    const hair = hairParts(m, look, col);
    let s = E(0, 1.5, SW + 6, 3.4, "shadow");

    // Back layer: long hair, a backpack, the hood of a padded coat.
    if (o.backpack) s += R(n1(-SW - 2), n1(shY + 2), n1(SW * 2 + 4), n1(hd * 1.6), d.topC === "chBag2" ? "chBag" : kid ? "chBag2" : "chBag", 6 * sc) + R(n1(SW - 1), n1(shY + 2), 3, n1(hd * 1.6), "chCel", 2);
    if (d.layer === "longpad") s += P(D("M", -hw * 1.4, shY - 1, "Q", 0, shY - hd * 0.5, hw * 1.4, shY - 1, "Z"), "chPad");
    if (d.top === "hoodie" && !d.layer) s += P(D("M", -hw * 1.3, shY, "Q", 0, shY - hd * 0.45, hw * 1.3, shY, "Z"), d.topC) + P(D("M", 0, shY - hd * 0.42, "Q", hw * 1.3, shY - hd * 0.3, hw * 1.3, shY, "L", hw * 0.6, shY, "Z"), "chCel");
    s += hair.back;

    // Legs: thighs and shins as tapered limbs, from the hip joints to the ankles.
    const seated = m.seated, run = pose === "run";
    const legW = (pants) => {
      const w = HW * (pants ? 1.08 : 1) * (d.bottom === "onesie" ? 1.1 : 1);
      return [w * 0.5, w * 0.34, w * (pants ? 0.3 : 0.2)];
    };
    const kneeY = seated ? hipY + hd * 0.38 : -legL * 0.56;
    const legPts = (sd) => {
      const hx = sd * HW * 0.48;
      if (seated) return [hx, hipY, sd * HW * 0.62, kneeY, sd * HW * 0.58, -3];
      if (run && sd > 0) return [hx, hipY, sd * HW * 0.35, hipY + legL * 0.3, sd * HW * 0.62, -legL * 0.22];
      if (run) return [hx, hipY, sd * HW * 0.62, kneeY, sd * HW * 0.82, -3];
      return [hx, hipY, sd * HW * 0.44, kneeY, sd * HW * 0.42, -3];
    };
    const longBottom = d.bottom === "pants" || d.bottom === "onesie";
    const LW = legW(longBottom);
    const legSkin = d.legs === "tights" ? "chTights" : skin;
    let legs = "";
    for (const sd of [-1, 1]) {
      const [x1, y1, x2, y2, x3, y3] = legPts(sd);
      const lc = longBottom ? d.botC : legSkin;
      legs += limb(x1, y1, x2, y2, LW[0], LW[1], lc, x3, y3, LW[2]);
      if (!longBottom && d.legs === "socks") legs += limb(x2 + (x3 - x2) * 0.62, y2 + (y3 - y2) * 0.62, x3, y3, LW[1] * 0.86, LW[2] * 1.12, "chSock");
      if (longBottom && !seated) legs += P(D("M", x2 - sd * 0.5, y2 - legL * 0.12, "L", x2 - sd * 0.3, y2 + legL * 0.2), null, "chCel", 0.5);
      // Shoes.
      const sw = HW * (kid === 2 ? 0.3 : 0.3), shH = hd * (kid === 2 ? 0.22 : 0.2);
      legs += P(D("M", x3 - sw * 1.05, y3 + 2.6, "Q", x3 - sw * 1.15, y3 - shH * 0.9, x3 - sd * sw * 0.1, y3 - shH, "Q", x3 + sw * 1.15, y3 - shH * 0.9, x3 + sw * 1.05, y3 + 2.6, "Z"), d.shoes) +
        P(D("M", x3 + sw * 0.1, y3 - shH * 0.95, "Q", x3 + sw * 1.1, y3 - shH * 0.8, x3 + sw * 1.05, y3 + 2.6, "L", x3 + sw * 0.2, y3 + 2.6, "Z"), "chCel") +
        (d.shoes === "chSneaker" ? R(n1(x3 - sw * 1.05), n1(y3 + 1.4), n1(sw * 2.1), 1.3, "chCel", 0.6) : P(D("M", x3 - sw * 0.6, y3 - shH * 0.6, "Q", x3 - sw * 0.3, y3 - shH * 0.9, x3, y3 - shH * 0.95), null, "chSheen", 0.8));
    }
    s += legs;
    // The garment over the hips: trousers' seat, shorts, skirts.
    const wW = (fem ? HW * 0.8 : Math.max(HW * 0.98, SW * 0.82));
    const pelvis = (y2, w2) => D("M", -wW, m.waistY, "Q", -HW - 0.6, (m.waistY + hipY) / 2, -w2, y2, "L", w2, y2, "Q", HW + 0.6, (m.waistY + hipY) / 2, wW, m.waistY, "Z");
    if (d.bottom === "pants" || d.bottom === "onesie") s += P(pelvis(hipY + hd * 0.12, HW * 1.02), d.botC) + P(D("M", 0, hipY - hd * 0.5, "L", 0, hipY + hd * 0.1), null, "chCel", 0.6);
    else if (d.bottom === "shorts") {
      const y2 = seated ? hipY + hd * 0.3 : hipY + legL * 0.2;
      s += P(pelvis(hipY, HW * 1.04), d.botC) + limb(-HW * 0.48, hipY, -HW * (seated ? 0.6 : 0.47), y2, HW * 0.55, HW * 0.48, d.botC) + limb(HW * 0.48, hipY, HW * (seated ? 0.6 : 0.47), y2, HW * 0.55, HW * 0.48, d.botC);
    } else {
      // Skirts: pleated school skirt above the knee, a pencil skirt, a long skirt, a kid's skirt.
      const len = d.bottom === "longskirt" ? (seated ? 0.28 : 0.68) : d.bottom === "pencil" ? 0.42 : d.bottom === "pleats" ? 0.36 : 0.32;
      const y2 = seated ? Math.max(kneeY + 2, hipY + legL * len * 0.5) : hipY + legL * len;
      const flare = d.bottom === "pencil" ? HW * 0.98 : d.bottom === "longskirt" ? HW * 1.22 : HW * 1.3 + (seated ? 2 : 0);
      s += P(D("M", -wW, m.waistY, "Q", -HW - 1, hipY - hd * 0.2, -flare, y2, "Q", 0, y2 + 1.5, flare, y2, "Q", HW + 1, hipY - hd * 0.2, wW, m.waistY, "Z"), d.botC);
      s += P(D("M", wW * 0.3, m.waistY, "L", wW, m.waistY, "Q", HW + 1, hipY - hd * 0.2, flare, y2, "Q", flare * 0.6, y2 + 1, flare * 0.4, y2, "Z"), "chCel");
      if (d.bottom === "pleats") {
        let pl = "";
        for (let i = -3; i <= 3; i++) pl += D("M", i * wW * 0.28, m.waistY + 1, "L", i * flare * 0.28, y2);
        s += P(pl, null, "chCel", 0.6) + P(D("M", -flare + 1, y2 - 3, "L", flare - 1, y2 - 3, "M", -wW * 0.4, m.waistY + 2, "L", -flare * 0.42, y2, "M", wW * 0.5, m.waistY + 2, "L", flare * 0.5, y2), null, "chCheck2", 0.6);
      }
    }

    // Torso: the main top, then the details that make it a blazer, hoodie, coat or uniform.
    const tc = d.top === "smock" || d.top === "onesie" ? d.topC : d.topC;
    const hemY = d.top === "smock" ? hipY + legL * 0.22 : d.top === "blazer" || d.top === "suit" ? hipY + hd * 0.15 : d.top === "onesie" ? hipY + hd * 0.1 : hipY + hd * 0.05;
    const hemW = d.top === "smock" ? HW * 1.35 : HW * (d.top === "blazer" || d.top === "suit" ? 1.06 : 1.02);
    const neckC = d.top === "blazer" || d.top === "suit" || (d.top === "shirt" && d.neck) || d.top === "scrubs";
    s += P(torsoPath(m, hemY, hemW), tc) + torsoShade(m, hemY, hemW);
    const midY = (shY + hipY) / 2;
    const V = (depth, wide) => D("M", -hw * wide, shY - 3, "L", 0, shY + depth, "L", hw * wide, shY - 3, "Z");
    if (d.top === "blazer" || d.top === "suit") {
      const vd = hd * (d.top === "suit" ? 1.25 : 1.15);
      s += P(V(vd, 0.62), d.neck === "blouse" ? "chOat" : "chShirt");
      if (d.neck === "tie") s += P(D("M", -hw * 0.12, shY - 1.6, "L", hw * 0.12, shY - 1.6, "L", hw * 0.16, shY + vd * 0.85, "L", 0, shY + vd + 1, "L", -hw * 0.16, shY + vd * 0.85, "Z"), d.top === "suit" ? "chWine" : "chTie") + P(D("M", -hw * 0.14, shY - 2.4, "L", hw * 0.14, shY - 2.4, "L", hw * 0.1, shY, "L", -hw * 0.1, shY, "Z"), "chTie");
      if (d.neck === "ribbon") s += P(D("M", 0, shY + 0.4, "L", -hw * 0.5, shY - 1.6, "L", -hw * 0.45, shY + hd * 0.2, "Z M", 0, shY + 0.4, "L", hw * 0.5, shY - 1.6, "L", hw * 0.45, shY + hd * 0.2, "Z"), "chTie") + O(0, shY + 0.4, hd * 0.06, "chTie") +
        P(D("M", -hw * 0.08, shY + 0.6, "L", -hw * 0.25, shY + hd * 0.42, "M", hw * 0.08, shY + 0.6, "L", hw * 0.25, shY + hd * 0.4), null, "chTie", hd * 0.06);
      // Lapels, buttons, a breast pocket with the school badge, and the opening down the front.
      s += P(D("M", -hw * 0.62, shY - 3, "L", -hw * 0.95, shY + hd * 0.25, "L", -hw * 0.55, shY + hd * 0.4, "L", 0, shY + vd + 0.5, "Z"), "chCel") +
        P(D("M", hw * 0.62, shY - 3, "L", hw * 0.95, shY + hd * 0.25, "L", hw * 0.55, shY + hd * 0.4, "L", 0, shY + vd + 0.5, "Z"), "chCel2") +
        P(D("M", 0, shY + vd, "L", hw * 0.05, hemY), null, "chCel2", 0.7) + O(hw * 0.22, shY + vd + hd * 0.25, hd * 0.045, "chCel2") + O(hw * 0.22, shY + vd + hd * 0.6, hd * 0.045, "chCel2") +
        P(D("M", -SW * 0.75, midY + hd * 0.2, "L", -SW * 0.3, midY + hd * 0.2), null, "chCel2", 0.7) + P(D("M", SW * 0.3, midY + hd * 0.2, "L", SW * 0.75, midY + hd * 0.2), null, "chCel2", 0.7);
      if (d.top === "blazer") s += P(D("M", -SW * 0.68, shY + hd * 0.45, "l", hd * 0.28, 0, "l", 0, hd * 0.2, "q", -hd * 0.14, hd * 0.12, -hd * 0.28, 0, "z"), "chGold");
    } else if (d.top === "shirt" || d.top === "work" || d.top === "blouse") {
      s += P(D("M", 0, shY + 1, "L", -hw * 0.75, shY - 2.6, "L", -hw * 0.55, shY + hd * 0.28, "Z M", 0, shY + 1, "L", hw * 0.75, shY - 2.6, "L", hw * 0.55, shY + hd * 0.28, "Z"), d.top === "work" ? "chCel" : "chSheen") +
        P(D("M", 0, shY + 1, "L", 0, hemY), null, "chCel", 0.6);
      for (let i = 0; i < 3; i++) s += O(0.8, n1(shY + hd * (0.5 + i * 0.6)), hd * 0.03, "chCel2");
      if (d.top === "work") s += R(n1(-SW * 0.7), n1(shY + hd * 0.4), n1(hd * 0.4), n1(hd * 0.35), "chCel", 1) + R(n1(SW * 0.25), n1(shY + hd * 0.4), n1(hd * 0.4), n1(hd * 0.35), "chCel", 1);
      if (d.top === "blouse") for (let i = 0; i < 9; i++) s += O(n1(-SW * 0.6 + (i % 3) * SW * 0.55), n1(shY + hd * (0.5 + Math.floor(i / 3) * 0.6)), hd * 0.05, "chSheen");
      if (d.neck === "tie") s += P(D("M", -hw * 0.12, shY - 1.4, "L", hw * 0.12, shY - 1.4, "L", hw * 0.16, shY + hd * 1.1, "L", 0, shY + hd * 1.25, "L", -hw * 0.16, shY + hd * 1.1, "Z"), "chTie");
      if (d.neck === "ribbon") s += P(D("M", 0, shY + 0.4, "L", -hw * 0.5, shY - 1.6, "L", -hw * 0.45, shY + hd * 0.2, "Z M", 0, shY + 0.4, "L", hw * 0.5, shY - 1.6, "L", hw * 0.45, shY + hd * 0.2, "Z"), "chTie") + O(0, shY + 0.4, hd * 0.06, "chTie");
    } else if (d.top === "hoodie" || d.top === "sweat" || d.top === "track") {
      if (d.top === "hoodie") s += P(D("M", -hw * 0.9, shY - 3, "Q", 0, shY + hd * 0.35, hw * 0.9, shY - 3, "Q", 0, shY + hd * 0.12, -hw * 0.9, shY - 3, "Z"), "chCel2") +
        P(D("M", -hw * 0.25, shY + hd * 0.1, "l", -0.3, hd * 0.6, "M", hw * 0.25, shY + hd * 0.1, "l", 0.3, hd * 0.6), null, "chStripe", 0.8) +
        P(D("M", -HW * 0.62, hemY - hd * 0.1, "L", -HW * 0.5, hemY - hd * 0.75, "L", HW * 0.5, hemY - hd * 0.75, "L", HW * 0.62, hemY - hd * 0.1), null, "chCel2", 0.8);
      if (d.top === "sweat") s += P(D("M", -hw * 0.6, shY - 3, "Q", 0, shY + hd * 0.12, hw * 0.6, shY - 3), null, "chCel2", 1.6) + R(n1(-wW), n1(hemY - hd * 0.18), n1(wW * 2), n1(hd * 0.18), "chCel");
      if (d.top === "track") s += P(D("M", -hw * 0.6, shY - 3.2, "L", 0, shY + 0.5, "L", hw * 0.6, shY - 3.2), null, "chStripe", 1.2) + P(D("M", 0, shY + 0.5, "L", 0, hemY), null, "chStripe", 0.8);
    } else if (d.top === "knit" || d.top === "tee" || d.top === "scrubs") {
      if (d.top === "scrubs") s += P(V(hd * 0.7, 0.55), skin) + P(D("M", -hw * 0.55, shY - 3, "L", 0, shY + hd * 0.7, "L", hw * 0.55, shY - 3), null, "chCel2", 1) + R(n1(-SW * 0.7), n1(midY), n1(hd * 0.45), n1(hd * 0.4), "chCel", 1) +
        P(D("M", -hw * 0.6, shY - 2, "L", -hw * 0.2, midY + hd * 0.4), null, "chWine", 0.6) + R(n1(-hw * 0.4), n1(midY + hd * 0.4), n1(hd * 0.22), n1(hd * 0.3), "chCoat", 0.5);
      else s += P(D("M", -hw * 0.62, shY - 3, "Q", 0, shY + hd * 0.2, hw * 0.62, shY - 3, "Q", 0, shY + hd * 0.05, -hw * 0.62, shY - 3, "Z"), skin) + P(D("M", -hw * 0.62, shY - 3, "Q", 0, shY + hd * 0.2, hw * 0.62, shY - 3), null, "chCel2", d.top === "knit" ? 1.6 : 0.9);
      if (d.top === "knit") s += R(n1(-wW), n1(hemY - hd * 0.22), n1(wW * 2), n1(hd * 0.22), "chCel");
      if (d.trim === "stripe") s += R(n1(-SW + 0.6), n1(shY + hd * 0.55), n1(SW * 2 - 1.2), n1(hd * 0.16), "chStripe", 0, null, 0, "opacity:0.85") + R(n1(-SW + 0.6), n1(shY + hd * 0.85), n1(SW * 2 - 1.2), n1(hd * 0.08), "chStripe", 0, null, 0, "opacity:0.85");
    } else if (d.top === "cardi" || d.top === "over") {
      s += P(V(hd * 1.6, 0.6).replace(/L 0 [\d.-]+/, "L " + 0 + " " + n1(hemY)), d.top === "cardi" ? "chShirt" : "chOat") + P(D("M", -hw * 0.6, shY - 3, "L", -hw * 0.1, hemY, "M", hw * 0.6, shY - 3, "L", hw * 0.1, hemY), null, "chCel2", 0.8);
      if (d.top === "cardi") for (let i = 0; i < 4; i++) s += O(n1(-hw * 0.25 + i * 0.05), n1(shY + hd * (0.6 + i * 0.5)), hd * 0.035, "chCel2");
    } else if (d.top === "smock") {
      s += P(D("M", -hw * 0.9, shY - 3, "Q", -hw * 0.9, shY + hd * 0.3, 0, shY + hd * 0.32, "Q", hw * 0.9, shY + hd * 0.3, hw * 0.9, shY - 3, "Q", 0, shY + 0.5, -hw * 0.9, shY - 3, "Z"), "chShirt") +
        R(n1(-HW * 0.7), n1(hipY - hd * 0.1), n1(hd * 0.42), n1(hd * 0.38), "chCel", 1.5) + P(D("M", -HW * 1.2, hemY - hd * 0.3, "L", HW * 1.2, hemY - hd * 0.3), null, "chCel", 0.6);
    } else if (d.top === "onesie") {
      for (let i = 0; i < 3; i++) s += R(n1(-SW + 0.4), n1(shY + hd * (0.35 + i * 0.45)), n1(SW * 2 - 0.8), n1(hd * 0.14), "chOnesie2", 0, null, 0, "opacity:0.7");
      s += P(D("M", -hw * 0.55, shY - 3, "Q", 0, shY + hd * 0.1, hw * 0.55, shY - 3), null, "chOnesie2", 1.2);
    }
    // Layers over the top: coats, aprons, vests.
    const lay = d.layer;
    if (lay === "longpad" || lay === "puffer" || lay === "coat" || lay === "whitecoat") {
      const lh = lay === "longpad" ? -legL * 0.22 : lay === "whitecoat" ? hipY + legL * 0.36 : lay === "coat" ? hipY + legL * 0.48 : hipY + hd * 0.1;
      const lw = lay === "longpad" ? HW * 1.32 : lay === "puffer" ? HW * 1.2 : HW * 1.18;
      const pf = lay === "longpad" || lay === "puffer" ? 1.8 : 0.4;
      const lc = lay === "longpad" ? "chPad" : lay === "puffer" ? (look.shirt || 0) % 2 ? "chWine" : "chOlive" : lay === "whitecoat" ? "chCoat" : d.layerC;
      const open = lay === "whitecoat" || lay === "coat" ? hw * 0.75 : hw * 0.42;
      const shape = torsoPath(m, lh, lw, pf);
      // The coat's two front panels: drawn as the coat minus a V opening down to the waist.
      s += P(shape + " " + D("M", -open, shY - 3, "L", -open * 0.35, lay === "longpad" ? shY + hd * 1.3 : m.waistY + hd * 0.2, "L", 0, lh, "L", open * 0.35, lay === "longpad" ? shY + hd * 1.3 : m.waistY + hd * 0.2, "L", open, shY - 3, "Z"), lc, null, 0, "fill-rule:evenodd") + torsoShade(m, lh, lw, pf);
      if (lay === "longpad" || lay === "puffer") {
        let q = "";
        for (let y = shY + hd * 0.55; y < lh - 2; y += hd * 0.5) q += D("M", -lw - 0.5, y, "Q", -SW * 0.5, y + 1.4, -open * 0.5, y + 0.3, "M", open * 0.5, y + 0.3, "Q", SW * 0.5, y + 1.4, lw + 0.5, y);
        s += P(q, null, "chCel2", 0.7) + P(D("M", -open * 0.35 - 0.5, shY + hd * 0.6, "L", -1, lh), null, "chSheen", 0.6);
        s += P(D("M", -hw * 1.15, shY - 1.5, "Q", 0, shY + hd * 0.25, hw * 1.15, shY - 1.5), null, lc, hd * 0.2);
      } else {
        // Lapels on a wool coat or a doctor's coat, pockets, a pen.
        s += P(D("M", -open, shY - 3, "L", -SW * 0.85, shY + hd * 0.45, "L", -open * 0.4, shY + hd * 1.1, "Z"), "chCel") + P(D("M", open, shY - 3, "L", SW * 0.85, shY + hd * 0.45, "L", open * 0.4, shY + hd * 1.1, "Z"), "chCel2") +
          P(D("M", -lw * 0.85, hipY, "l", hd * 0.55, 0, "M", lw * 0.85, hipY, "l", -hd * 0.55, 0), null, "chCel2", 0.7);
        if (lay === "whitecoat") s += R(n1(SW * 0.35), n1(shY + hd * 0.5), n1(hd * 0.4), 1, "chCel2") + R(n1(SW * 0.45), n1(shY + hd * 0.32), 1, n1(hd * 0.3), "chTie");
      }
    }
    if (lay === "apron") s += P(D("M", -HW * 0.85, shY + hd * 0.25, "L", HW * 0.85, shY + hd * 0.25, "L", HW * 0.95, hipY + legL * 0.4, "L", -HW * 0.95, hipY + legL * 0.4, "Z"), d.layerC) +
      P(D("M", HW * 0.4, shY + hd * 0.25, "L", HW * 0.85, shY + hd * 0.25, "L", HW * 0.95, hipY + legL * 0.4, "L", HW * 0.5, hipY + legL * 0.4, "Z"), "chCel") +
      P(D("M", -HW * 0.8, shY + hd * 0.27, "L", -hw * 0.5, shY - 3, "M", HW * 0.8, shY + hd * 0.27, "L", hw * 0.5, shY - 3), null, d.layerC, 1.2) + R(n1(-HW * 0.5), n1(m.waistY + hd * 0.3), n1(HW), n1(hd * 0.45), "chCel", 1) +
      P(D("M", -wW, m.waistY, "L", wW, m.waistY), null, "chCel2", 1);
    if (lay === "visvest") s += P(torsoPath(m, hipY - hd * 0.05, HW * 1.02) + " " + D("M", -hw * 0.6, shY - 3, "L", 0, shY + hd * 1.1, "L", hw * 0.6, shY - 3, "Z"), "chVis", null, 0, "fill-rule:evenodd") +
      R(n1(-wW - 0.5), n1(midY), n1(wW * 2 + 1), n1(hd * 0.16), "chStripe") + R(n1(-wW - 0.5), n1(midY + hd * 0.5), n1(wW * 2 + 1), n1(hd * 0.16), "chStripe") + torsoShade(m, hipY - hd * 0.05, HW * 1.02);
    if (lay === "cardigan" || lay === "jvest") s += P(torsoPath(m, hipY + hd * 0.15, HW * 1.06) + " " + D("M", -hw * 0.6, shY - 3, "L", 0, lay === "jvest" ? shY + hd * 1.1 : hipY + hd * 0.15, "L", hw * 0.6, shY - 3, "Z"), d.layerC, null, 0, "fill-rule:evenodd") +
      torsoShade(m, hipY + hd * 0.15, HW * 1.06) + O(-hw * 0.3, n1(shY + hd * 1.2), hd * 0.04, "chCel2") + O(-hw * 0.32, n1(shY + hd * 1.7), hd * 0.04, "chCel2");
    if (d.neck === "scarf") s += P(D("M", -hw * 0.95, shY - 2, "Q", 0, shY + hd * 0.35, hw * 0.95, shY - 2, "Q", 0, shY - 4, -hw * 0.95, shY - 2, "Z"), "chWine") + R(n1(-hw * 0.6), n1(shY), n1(hd * 0.3), n1(hd * 0.9), "chWine", 1.5) + P(D("M", -hw * 0.6, shY + hd * 0.5, "l", hd * 0.3, 0), null, "chCel", 0.6);
    if (d.neck === "towel") s += P(D("M", -hw * 1.1, shY - 2, "Q", 0, shY + hd * 0.3, hw * 1.1, shY - 2), null, "chCoat", hd * 0.18) + R(n1(hw * 0.3), n1(shY - 1), n1(hd * 0.22), n1(hd * 0.7), "chCoat", 1);
    if (o.backpack) s += limb(-SW + 2.5, shY - 1, -SW + 3.6, hipY - hd * 0.3, 1.2, 1.2, kid ? "chBag2" : "chBag") + limb(SW - 2.5, shY - 1, SW - 3.6, hipY - hd * 0.3, 1.2, 1.2, kid ? "chBag2" : "chBag");
    if (prop === "medal") s += P(D("M", -hw * 0.5, shY - 2, "L", 0, shY + hd * 0.9, "L", hw * 0.5, shY - 2), null, "chWine", hd * 0.09) + O(0, n1(shY + hd * 1.05), hd * 0.17, "chGold") + O(-hd * 0.05, n1(shY + hd), hd * 0.06, "chSheen");
    if (o.lanyard) s += P(D("M", -hw * 0.5, shY - 2, "L", 0, shY + hd * 1.2, "L", hw * 0.5, shY - 2), null, "chCel2", 0.6);

    // Arms: upper arm and forearm under the sleeve, then the hand.
    const P0 = POSES[armPose];
    const ua = m.arm * 0.5, fa = m.arm * 0.44, handL = hd * (kid ? 0.42 : 0.5);
    const aw = SW * (fem ? 0.19 : 0.21) * (kid ? 1.12 : 1);
    const puff = d.layer === "longpad" || d.layer === "puffer" ? 1.5 : d.layer === "coat" || d.layer === "whitecoat" || d.top === "hoodie" ? 0.6 : 0.3;
    const sleeveC = d.layer === "longpad" ? "chPad" : d.layer === "puffer" ? ((look.shirt || 0) % 2 ? "chWine" : "chOlive") : d.layer === "coat" ? d.layerC : d.layer === "whitecoat" ? "chCoat" : d.layer === "cardigan" ? d.layerC : d.top === "smock" ? "chSmock" : d.topC;
    const short = !d.layer && (d.sleeve === "short") ;
    const hands = {};
    const armSVG = (sd) => {
      const [a1, a2] = P0[sd < 0 ? "l" : "r"];
      const sx = sd * (SW - aw * 0.9), sy = shY + 2.2;
      const ex = sx + sd * Math.sin(rad(a1)) * ua, ey2 = sy + Math.cos(rad(a1)) * ua;
      const wx = ex + sd * Math.sin(rad(a2)) * fa, wy = ey2 + Math.cos(rad(a2)) * fa;
      hands[sd] = { x: wx, y: wy, a: a2 };
      let a = "";
      const W1 = aw + puff, W2 = aw * 0.86 + puff, W3 = aw * 0.68 + puff * 0.8;
      if (short || d.sleeve === "rolled") {
        const cut = d.sleeve === "rolled" ? 0.25 : 1;
        const mx = ex + (wx - ex) * (1 - cut) * (d.sleeve === "rolled" ? 1 : 0), my2 = ey2 + (wy - ey2) * (1 - cut) * (d.sleeve === "rolled" ? 1 : 0);
        a += limb(sx, sy, ex, ey2, aw * 0.95, aw * 0.8, skin, wx, wy, aw * 0.6);
        if (d.sleeve === "rolled") a += limb(sx, sy, ex, ey2, W1, W2, sleeveC, mx, my2, W2 * 1.05);
        else a += limb(sx, sy, sx + (ex - sx) * 0.62, sy + (ey2 - sy) * 0.62, W1 + 0.4, W2 + 0.5, sleeveC);
      } else {
        a += limb(sx, sy, ex, ey2, W1, W2, sleeveC, wx, wy, W3);
        if (d.trim === "track") a += P(D("M", sx + sd * W1 * 0.7, sy, "L", ex + sd * W2 * 0.7, ey2, "L", wx + sd * W3 * 0.6, wy), null, "chStripe", 0.7);
        a += P(capsule(wx - (wx - ex) * 0.06, wy - (wy - ey2) * 0.06, wx, wy, W3 + 0.2, W3 + 0.2), "chCel");
      }
      // The hand, along the forearm: a palm, fingers together, a thumb on the inner side.
      const ang = Math.atan2(-(sd * Math.sin(rad(a2))), Math.cos(rad(a2))) * 180 / Math.PI;
      const fist = armPose === "cheer" || armPose === "run" || (armPose === "hold" && sd > 0) || armPose === "baby";
      const hl = fist ? handL * 0.72 : handL, hwid = aw * 1.05;
      const tx = -sd * hwid * 0.75 * (Math.cos(rad(a2)) < 0 ? -1 : 1);
      a += '<g transform="translate(' + n1(wx) + " " + n1(wy) + ") rotate(" + n1(-ang) + ')">' +
        P(D("M", -hwid * 0.8, 0, "Q", -hwid, hl * 0.7, -hwid * 0.4, hl, "Q", 0, hl * 1.08, hwid * 0.4, hl, "Q", hwid, hl * 0.7, hwid * 0.8, 0, "Z"), skin) +
        E(n1(tx), n1(hl * 0.3), n1(hwid * 0.38), n1(hl * 0.3), skin) +
        P(D("M", 0, hl * 0.2, "Q", hwid * 0.9, hl * 0.6, hwid * 0.4, hl, "Q", hwid * 0.8, hl * 0.5, hwid * 0.6, 0, "Z"), "chSkinSh") +
        (fist ? "" : P(D("M", -hwid * 0.2, hl * 0.55, "L", -hwid * 0.25, hl * 0.95, "M", hwid * 0.2, hl * 0.55, "L", hwid * 0.22, hl * 0.95), null, "chSkinSh2", 0.4)) + "</g>";
      return a;
    };
    let arms = "";
    // A baby lies across the forearms: the left arm behind it, the right in front.
    const babyAt = prop === "baby" && armPose === "baby";
    arms += armSVG(-1);
    if (babyAt) arms += G(n1(hw * 0.15), n1(shY + hd * 1.62), bundleBody(), n1(0.86 * (fem ? 0.95 : 1)));
    const right = armSVG(1);
    arms += pose === "wave" ? '<g class="wave" style="transform-origin:' + n1(SW - aw * 0.9) + "px " + n1(shY + 2.2) + 'px">' + right + "</g>" : right;
    s += arms;

    // Neck, head, hair.
    const nw = hw * (fem ? 0.44 : kid ? 0.46 : 0.54);
    s += P(D("M", -nw, m.chin - hd * 0.2, "L", -nw - 0.2, shY - 1, "Q", 0, shY + 2.2, nw + 0.2, shY - 1, "L", nw, m.chin - hd * 0.2, "Z"), skin) +
      P(D("M", -nw, m.chin - hd * 0.12, "Q", 0, m.chin + hd * 0.2, nw, m.chin - hd * 0.12, "L", nw + 0.2, shY - 1, "Q", nw * 0.6, shY - 0.5, nw * 0.45, m.chin + hd * 0.1, "Q", 0, m.chin + hd * 0.14, -nw, m.chin - hd * 0.05, "Z"), "chSkinSh");
    // Collars that sit around the neck.
    if (neckC && d.layer !== "longpad") s += P(D("M", -nw - 1, shY - 2.5, "L", -nw * 0.1, shY + 1.2, "L", -nw * 0.4, shY - 3.6, "Z M", nw + 1, shY - 2.5, "L", nw * 0.1, shY + 1.2, "L", nw * 0.4, shY - 3.6, "Z"), d.top === "scrubs" ? "chScrub" : d.neck === "blouse" ? "chOat" : "chShirt");
    s += head(m, look, mood, skin, col, o);
    s += hair.front + hair.over;
    // Hats and things on the head.
    const T = m.top - hd * 0.05;
    if (d.hat === "kinder") s += P(D("M", -hw - 1.2, cy - hd * 0.22, "Q", -hw - 0.8, T - hd * 0.08, 0, T - hd * 0.1, "Q", hw + 0.8, T - hd * 0.08, hw + 1.2, cy - hd * 0.22, "Z"), "chMustard") +
      P(D("M", -hw - 2.6, cy - hd * 0.2, "Q", 0, cy - hd * 0.3, hw + 2.6, cy - hd * 0.2, "Q", 0, cy - hd * 0.12, -hw - 2.6, cy - hd * 0.2, "Z"), "chMustard") + P(D("M", hw * 0.2, T - hd * 0.09, "Q", hw + 0.8, T - hd * 0.06, hw + 1.2, cy - hd * 0.22, "L", hw * 0.6, cy - hd * 0.22, "Z"), "chCel") +
      P(D("M", -hw - 2.6, cy - hd * 0.2, "Q", 0, cy - hd * 0.12, hw + 2.6, cy - hd * 0.2), null, "chCel", 0.5);
    if (d.hat === "cap" || d.hat === "helmet") {
      const hc = d.hat === "cap" ? "chBlazer" : "chHelmet";
      s += P(D("M", -hw - 1.4, cy - hd * 0.22, "Q", -hw - 1.2, T - hd * 0.22, 0, T - hd * 0.24, "Q", hw + 1.2, T - hd * 0.22, hw + 1.4, cy - hd * 0.22, "Z"), hc) +
        P(D("M", hw * 0.2, T - hd * 0.22, "Q", hw + 1.2, T - hd * 0.2, hw + 1.4, cy - hd * 0.22, "L", hw * 0.6, cy - hd * 0.22, "Z"), "chCel") +
        (d.hat === "cap" ? P(D("M", -hw - 1.6, cy - hd * 0.22, "Q", 0, cy - hd * 0.05, hw + 1.6, cy - hd * 0.22, "Q", 0, cy - hd * 0.3, -hw - 1.6, cy - hd * 0.22, "Z"), "chCel2") + O(0, n1(T), hd * 0.06, "chGold")
          : R(n1(-hw - 1.4), n1(cy - hd * 0.3), n1(hw * 2 + 2.8), n1(hd * 0.1), "chBlazer", 1) + P(D("M", -hw * 0.7, T - hd * 0.05, "Q", -hw * 0.3, T - hd * 0.18, hw * 0.1, T - hd * 0.18), null, "chSheen", hd * 0.06));
    }
    if (d.hat === "hardhat") s += P(D("M", -hw - 1.6, cy - hd * 0.18, "Q", -hw - 1.4, T - hd * 0.3, 0, T - hd * 0.32, "Q", hw + 1.4, T - hd * 0.3, hw + 1.6, cy - hd * 0.18, "Z"), "chVis") +
      R(n1(-hw - 3), n1(cy - hd * 0.24), n1(hw * 2 + 6), n1(hd * 0.1), "chVis", 1) + P(D("M", 0, T - hd * 0.32, "L", 0, cy - hd * 0.24), null, "chCel", hd * 0.12) +
      P(D("M", hw * 0.2, T - hd * 0.3, "Q", hw + 1.4, T - hd * 0.28, hw + 1.6, cy - hd * 0.18, "L", hw * 0.6, cy - hd * 0.18, "Z"), "chCel") + P(D("M", -hw * 0.75, T - hd * 0.1, "Q", -hw * 0.4, T - hd * 0.28, -hw * 0.05, T - hd * 0.28), null, "chSheen", hd * 0.05);
    if (d.hat === "straw") s += E(0, n1(cy - hd * 0.22), n1(hw + hd * 0.55), n1(hd * 0.13), "chStraw") + P(D("M", -hw - 0.6, cy - hd * 0.22, "Q", -hw, T - hd * 0.3, 0, T - hd * 0.3, "Q", hw, T - hd * 0.3, hw + 0.6, cy - hd * 0.22, "Z"), "chStraw") +
      R(n1(-hw - 0.6), n1(cy - hd * 0.34), n1(hw * 2 + 1.2), n1(hd * 0.1), "chOlive") + P(D("M", hw * 0.2, T - hd * 0.3, "Q", hw, T - hd * 0.3, hw + 0.6, cy - hd * 0.22, "L", hw * 0.5, cy - hd * 0.22, "Z"), "chCel") +
      P(D("M", -hw - hd * 0.5, cy - hd * 0.2, "Q", 0, cy - hd * 0.05, hw + hd * 0.5, cy - hd * 0.2), null, "chCel", 0.8);
    if (prop === "headphones") s += P(D("M", -hw - 1.6, cy, "Q", -hw - 1.2, T - hd * 0.25, 0, T - hd * 0.26, "Q", hw + 1.2, T - hd * 0.25, hw + 1.6, cy), null, "chFrame", hd * 0.1) +
      R(n1(-hw - hd * 0.24), n1(cy - hd * 0.18), n1(hd * 0.26), n1(hd * 0.4), "chSlate", hd * 0.1) + R(n1(hw - hd * 0.02), n1(cy - hd * 0.18), n1(hd * 0.26), n1(hd * 0.4), "chSlate", hd * 0.1) + R(n1(hw + hd * 0.08), n1(cy - hd * 0.18), n1(hd * 0.16), n1(hd * 0.4), "chCel", hd * 0.08);
    if (prop === "mask") s += P(D("M", -hw * 0.95, cy + hd * 0.1, "Q", 0, cy + hd * 0.02, hw * 0.95, cy + hd * 0.1, "L", hw * 0.8, cy + hd * 0.38, "Q", 0, cy + hd * 0.56, -hw * 0.8, cy + hd * 0.38, "Z"), "chCoat") +
      P(D("M", 0, cy + hd * 0.06, "L", 0, cy + hd * 0.52), null, "chCel", 0.5) + P(D("M", hw * 0.3, cy + hd * 0.08, "Q", hw * 0.95, cy + hd * 0.1, hw * 0.8, cy + hd * 0.38, "Q", hw * 0.5, cy + hd * 0.5, hw * 0.3, cy + hd * 0.5, "Z"), "chCel") +
      P(D("M", -hw * 0.95, cy + hd * 0.12, "L", -hw - 0.3, cy, "M", hw * 0.95, cy + hd * 0.12, "L", hw + 0.3, cy), null, "chCoat", 0.6);
    if (d.layer === "whitecoat") s += P(D("M", -nw - 1.5, shY - 1, "Q", -SW * 0.6, shY + hd * 0.9, -SW * 0.15, shY + hd * 1.35, "M", nw + 1.5, shY - 1, "Q", SW * 0.55, shY + hd * 0.7, SW * 0.35, shY + hd * 1.15), null, "chFrame", 0.9) + O(n1(-SW * 0.15), n1(shY + hd * 1.42), hd * 0.1, "chMetal");

    // Props in the right hand (and the medal, already on the chest).
    const h = hands[1], hx = h.x, hy = h.y + handL * 0.35;
    const scP = sc * (kid ? 1.15 : 1);
    if (prop === "book") s += G(n1(hx - 2 * scP), n1(hy - 2 * scP), R(-9.5, -11, 19, 14, "chWine", 1.5) + R(-8.6, -10.4, 17.2, 12.6, "chOat", 0.8) + P("M0 -10.4 L0 2.2", null, "chCel2", 0.8) + P("M0 -10.4 L8.6 -10.4 L8.6 2.2 L0 2.2 Z", "chCel") + P("M-7 -7 L-2 -7 M-7 -4.5 L-2 -4.5 M-7 -2 L-3 -2 M2 -7 L7 -7 M2 -4.5 L7 -4.5", null, "chCel2", 0.5), scP);
    if (prop === "phone") s += G(n1(hx), n1(hy - 3 * scP), R(-3.4, -6.2, 6.8, 12, "chFrame", 1.4) + R(-2.7, -5.4, 5.4, 10.2, "chDusty", 0.8) + P("M-2.7 -5.4 L2.7 -5.4 L-2.7 2 Z", "chSheen"), scP);
    if (prop === "baton") s += G(n1(hx), n1(h.y + handL * 0.2), R(-2.4, -11, 4.8, 16, "chWine", 2) + R(0.2, -11, 2.2, 16, "chCel", 1), scP);
    if (prop === "envelope") s += G(n1(hx - 1), n1(hy - 3), R(-9, -6, 18, 12, "chCoat", 1) + P("M-9 -6 L0 1.5 L9 -6", null, "chCel2", 0.7) + O(0, 1.5, 1.8, "chWine") + P("M2 -6 L9 -6 L9 6 L4 6 Z", "chCel"), scP);
    // still: no breathing (the small portraits in the Friends panel).
    s = compact(s);
    return o.still ? '<g style="stroke-linecap:round;stroke-linejoin:round">' + s + "</g>" : A("breathe", s, "stroke-linecap:round;stroke-linejoin:round");
  }
  // A head-and-shoulders portrait of the same avatar, for the Friends panel. o: avatar options.
  function portrait(o, label) {
    const m = metrics(o);
    const size = m.hd * 1.9, x = -size / 2, y = m.top - m.hd * 0.24;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + n1(x) + " " + n1(y) + " " + n1(size) + " " + n1(size) + '" class="art portrait"' +
      (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true" focusable="false"') + ">" + avatar(Object.assign({ still: true }, o)) + "</svg>";
  }

  // Which body and clothes fit the life stage.
  function figureFor(stage) {
    // Ages 0–2: a toddler in a onesie; 3–5: kindergarten smock and yellow hat.
    if (stage === "baby") return { age: "toddler", outfit: "onesie", scale: 0.92 };
    if (stage === "kinder") return { age: "child", outfit: "smock", scale: 0.86 };
    if (stage === "elem" || stage === "birth") return { age: "child", outfit: "kid", backpack: true };
    if (stage === "mid") return { age: "teen", outfit: "uniform", school: "mid", scale: 0.95 };
    if (stage === "high" || stage === "hs3") return { age: "teen", outfit: "uniform" };
    if (stage === "academy" || stage === "selfstudy") return { age: "adult", outfit: "hoodie", scale: 0.97 };
    if (stage === "dropout") return { age: "teen", outfit: "hoodie" };
    return { age: "adult", outfit: "casual" };
  }
  // Seeded looks: hair style (eight per sex), colour, skin, clothes, glasses, a double-eyelid crease and,
  // for some adults, dyed hair. A save from before the player chose a sex (none) draws from both lists.
  function lookFor(seed, sex) {
    const r = rand((seed | 0) ^ 0x5eed);
    const h = Math.floor(r() * 16);
    const hair = sex === "m" ? HAIR_M[h % 8] : sex === "f" ? HAIR_F[h % 8] : (h < 8 ? HAIR_M : HAIR_F)[h % 8];
    const skin = r() < 0.3 ? 1 : r() < 0.12 ? 2 : 0;
    const shirt = Math.floor(r() * 6);
    const hc = r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2;
    const glasses = r() < 0.22;
    const lid = r() < 0.5;
    const dye = r() < 0.35 ? 1 + Math.floor(r() * 3) : 0;
    return { hair, skin, shirt, sex: sex || null, hc, glasses, lid, dye };
  }
  // A newborn swaddled in a blanket, about 46 wide, centred on (0, 0), head to the left, asleep.
  function bundleBody() {
    return P("M-15 -9.5 Q4 -12 20 -8 Q26 -5 25 1 Q24 8 14 9.5 Q-2 11 -15 8.5 Z", "chBlanket") +
      P("M-2 10.4 Q12 10 18 7 Q24 3 25 1 Q24 8 14 9.5 Q4 10.8 -2 10.4 Z M2 -11 Q14 -11 20 -8 Q26 -5 25 1 Q20 -6 2 -7.5 Z", "chCel") +
      P("M-4 -8 Q6 0 4 10 M6 -9 Q16 -2 14 9", null, "chCel", 0.7) + P("M-6 -10 Q4 -11.5 14 -9.5", null, "chSheen", 1.2) +
      O(-16, -1, 10, "chBlanket2") + P("M-16 -11 A10 10 0 0 1 -6 -1 Q-10 -5 -16 -5 Z", "chCel") +
      E(-16.5, -0.5, 6.4, 6.8, "chSkin0") + P("M-12 -5 Q-10 0 -12.5 5 Q-15 6.8 -17 6.2 Q-12.5 4 -12 -5 Z", "chSkinSh") +
      P("M-20.4 -1.2 q1.2 0.9 2.4 0 M-15.6 -1.2 q1.2 0.9 2.4 0", null, "chLash", 0.55) + P("M-17.6 3.1 q0.8 0.6 1.6 0", null, "chLipSh", 0.55) +
      O(-16.6, 1, 0.5, "chSkinSh2") + P("M-19 -6 q2 -1.5 4 -0.6", null, "chHair1", 0.6) +
      E(-9.6, 4.6, 2.6, 2.1, "chSkin0") + P("M-9.6 3 q1.6 0.4 1.8 2", null, "chSkinSh", 0.5);
  }
  // Mood from the condition bars; the thresholds mirror where the engine starts to punish them.
  function moodOf(g) {
    if (g.health < 40) return "sick";
    if (g.stress >= 75) return "stressed";
    if (g.motivation < 35) return "tired";
    if (g.stress < 45 && g.motivation >= 60 && g.health >= 55) return "happy";
    return "ok";
  }
  // A portrait in the clothes of a life stage (a classmate dressed like you), for the Friends panel.
  function portraitFor(stage, look, mood, label) {
    const f = figureFor(stage);
    return portrait({ age: f.age, outfit: f.outfit, school: f.school, look, mood: mood || "happy" }, label);
  }
  function person(ctx, x, y, s, extra) {
    const f = figureFor(ctx.stage);
    const o = Object.assign({ age: f.age, outfit: f.outfit, school: f.school, backpack: f.backpack, look: ctx.look, mood: ctx.mood, season: ctx.season }, extra || {});
    return G(x, y, avatar(o), (s || 1) * (f.scale || 1));
  }

  // ---------- rooms in one-point perspective ----------
  // A camera for spaces measured in metres (long corridors, halls): x across, y up from the floor, z
  // away from the lens. (cx, vy) is the vanishing point, f the focal length in pixels, the eye at
  // ex across and eh high. Returns the screen point of (x, y, z).
  const proj = (cx, vy, f, ex, eh) => (x, y, z) => [cx + (f * (x - ex)) / z, vy + (f * (eh - y)) / z];
  // A room seen from inside. b = [x0, y0, x1, y1] is the back wall (y1 where it meets the floor) and
  // vp = [vx, vy] the vanishing point at eye level; the side walls, ceiling and floor run out from it
  // past the frame. o: { wall, side, ceil, floor: wood | lino | tile | dark, lower: [height, token]
  // (a wainscot band), night }.
  function room(fw, fh, b, vp, o) {
    const [x0, y0, x1, y1] = b, [vx, vy] = vp, n = o.night;
    const out = (px, py) => [vx + (px - vx) * 9, vy + (py - vy) * 9];
    const wall = o.wall || (n ? "nWall" : "wallpaper"), ceil = o.ceil || (n ? "nCeil" : "ceiling");
    let s = R(-20, -20, fw + 40, fh + 40, ceil);
    s += P(poly([[x0, y0], [x1, y0], out(x1, y0), out(x0, y0)]), ceil) + ao(-20, -20, fw + 40, y0 + 20, "d", 0.1);
    const lw = poly([[x0, y0], [x0, y1], out(x0, y1), out(x0, y0)]), rw = poly([[x1, y0], [x1, y1], out(x1, y1), out(x1, y0)]);
    s += P(lw, o.side || wall) + P(lw, "aoC", null, 0, "opacity:0.14") + P(rw, o.side || wall) + P(rw, "hiE", null, 0, "opacity:0.05");
    s += floorMat(o.floor || "wood", b, vp, fh, n);
    s += R(x0, y0, x1 - x0, y1 - y0, wall);
    if (o.lower) {
      const [lh, lt] = o.lower;
      s += R(x0, y1 - lh, x1 - x0, lh, lt) + P(poly([[x0, y1 - lh], [x0, y1], out(x0, y1), out(x0, y1 - lh)]), lt) + P(poly([[x1, y1 - lh], [x1, y1], out(x1, y1), out(x1, y1 - lh)]), lt) +
        R(x0, y1 - lh - 2, x1 - x0, 2, "aoC", 0, null, 0, "opacity:0.12");
    }
    // Ambient occlusion where planes meet, and a baseboard.
    s += ao(x0, y1 - 18, x1 - x0, 18, "d", 0.2) + ao(x0, y0, x1 - x0, 12, "u", 0.14) + ao(x0, y0, 16, y1 - y0, "l", 0.16) + ao(x1 - 16, y0, 16, y1 - y0, "r", 0.16);
    s += R(x0, y1 - 4, x1 - x0, 4, n ? "nBase" : "baseboard") + P(poly([[x0, y1 - 4], [x0, y1], out(x0, y1), out(x0, y1 - 4)]), n ? "nBase" : "baseboard");
    return s;
  }
  // Floors: wood strips, school linoleum, hallway tiles, the dark carpet of a study café. Seams run to
  // the vanishing point; cross joints get closer together with distance.
  function floorMat(kind, b, vp, fh, night) {
    const [x0, , x1, y1] = b, [vx, vy] = vp;
    const tok = { wood: night ? "nFloor" : "floorWood", lino: "lino", tile: "tileE", dark: "nFloor" }[kind] || "floorWood";
    const seam = { wood: "floorSeam", lino: "lino2", tile: "tileE2", dark: "nFloor2" }[kind] || "floorSeam";
    const at = (px, t) => [vx + (px - vx) * t, vy + (y1 - vy) * t];
    let s = P(poly([[x0, y1], [x1, y1], at(x1, 9), at(x0, 9)]), tok);
    const step = kind === "wood" ? 22 : kind === "tile" ? 48 : 60;
    let d = "";
    for (let xb = x0 + step; xb < x1; xb += step) { const e = at(xb, 9); d += "M" + xb + " " + y1 + " L" + e[0].toFixed(1) + " " + e[1].toFixed(1) + " "; }
    if (kind !== "wood") for (let t = 1.18, i = 0; i < 10; t += 0.22 + i * 0.07, i++) { const a = at(x0 - 400, t), c = at(x1 + 400, t); if (a[1] > fh + 10) break; d += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + c[0].toFixed(1) + " " + c[1].toFixed(1) + " "; }
    else { const r = rand(5); for (let t = 1.12, i = 0; i < 9; t += 0.16 + i * 0.05, i++) { const xa = x0 + r() * (x1 - x0), a = at(xa, t), c = at(xa + step, t); if (a[1] > fh + 10) break; d += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + c[0].toFixed(1) + " " + c[1].toFixed(1) + " "; } }
    s += P(d, null, seam, 1, "opacity:0.7");
    // Darker toward the back wall; a soft sheen in the middle of a polished floor.
    s += R(x0 - 400, y1, x1 - x0 + 800, 40, null, 0, null, 0, fill(aoF("u"), "opacity:0.16"));
    if (kind !== "dark") s += E(vx, y1 + (fh - y1) * 0.55, (x1 - x0) * 0.4, (fh - y1) * 0.35, null, null, 0, fill(def("sheen", (id) => radial(id, [[0, "hiE", 0.22], [1, "hiE", 0]]))));
    return s;
  }
  // Sunlight from a window on the left falling across the floor (x, y: where it lands; w, h: its size).
  const sunPatch = (x, y, w, h, skew) => P(poly([[x, y], [x + w, y], [x + w + skew, y + h], [x + skew, y + h]]), null, null, 0,
    fill(def("sunp", (id) => lin(id, [[0, "sunLight", 0.9], [1, "sunLight", 0.25]])), "opacity:var(--a-sunOp)"));
  // A shaft of light through the air from a window (a soft quad with dust drifting in it).
  function shaft(pts, seed) {
    const r = rand(seed || 3);
    let s = P(poly(pts), null, null, 0, fill(def("shf", (id) => lin(id, [[0, "sunLight", 0.5], [1, "sunLight", 0]], [0, 0, 0.6, 1])), "opacity:var(--a-sunOp)"));
    let m = "";
    for (let i = 0; i < 7; i++) { const t = r(), u = r(); const px = pts[0][0] + (pts[1][0] - pts[0][0]) * t + (pts[3][0] - pts[0][0]) * u, py = pts[0][1] + (pts[3][1] - pts[0][1]) * u; m += O(px.toFixed(0), py.toFixed(0), 0.9, "hiE"); }
    return s + A("drift slow", m, "opacity:var(--a-moteOp)");
  }
  // A box in one-point perspective: the front face (x, y - h)–(x + w, y), and the top (or bottom) and side
  // that recede toward vp by d (the share of the way there). f: front, t: top, sd: side.
  function boxP(x, y, w, h, d, vp, f, t, sd) {
    const [vx, vy] = vp, k = (p) => [p[0] + (vx - p[0]) * d, p[1] + (vy - p[1]) * d];
    const a = [x, y - h], b = [x + w, y - h], c = [x + w, y], e = [x, y];
    let s = "";
    if (vy < y - h) s += P(poly([a, b, k(b), k(a)]), t);
    else if (vy > y) s += P(poly([e, c, k(c), k(e)]), t);
    if (vx > x + w) s += P(poly([b, k(b), k(c), c]), sd);
    else if (vx < x) s += P(poly([a, k(a), k(e), e]), sd);
    return s + R(x, y - h, w, h, f);
  }
  // A school desk (formica top, steel frame) and its chair, standing on the floor at y, scaled for depth.
  function deskP(x, y, sc, vp, o) {
    const w = 52 * sc, th = 40 * sc, o2 = o || {};
    const [vx, vy] = vp, k = (p, d) => [p[0] + (vx - p[0]) * d, p[1] + (vy - p[1]) * d];
    let s = shadow(x, y - 2 * sc, w * 0.7, 6 * sc);
    const bl = k([x - w / 2 + 3 * sc, y], 0.12), br = k([x + w / 2 - 3 * sc, y], 0.12), tl = k([x - w / 2 + 3 * sc, y - th], 0.12), tr = k([x + w / 2 - 3 * sc, y - th], 0.12);
    s += P("M" + tl[0].toFixed(1) + " " + tl[1].toFixed(1) + " L" + bl[0].toFixed(1) + " " + bl[1].toFixed(1) + " M" + tr[0].toFixed(1) + " " + tr[1].toFixed(1) + " L" + br[0].toFixed(1) + " " + br[1].toFixed(1), null, "steel2", 2.2 * sc);
    // The chair, pushed in behind the desk.
    if (o2.chair !== false) s += G(x, y - 6 * sc, R(-14 * sc, -50 * sc, 28 * sc, 14 * sc, "chairW", 2 * sc) + L(-11 * sc, -36 * sc, -11 * sc, 6 * sc, "steel2", 2 * sc) + L(11 * sc, -36 * sc, 11 * sc, 6 * sc, "steel2", 2 * sc));
    s += R(x - w / 2 + 3 * sc, y - th, 2.6 * sc, th, "steel") + R(x + w / 2 - 5.6 * sc, y - th, 2.6 * sc, th, "steel") + R(x - w / 2 + 4 * sc, y - th * 0.55, w - 8 * sc, 2 * sc, "steel2");
    s += R(x - w / 2 + 4 * sc, y - th + 3 * sc, w - 8 * sc, 8 * sc, "steel2", 0, null, 0, "opacity:0.6");
    s += boxP(x - w / 2, y - th, w, 3.5 * sc, 0.14, vp, "formica2", "formica", "formica2");
    if (o2.books) s += stack(x + (o2.bx || 6) * sc, y - th - 2 * sc, o2.books, sc, o2.seed);
    if (o2.paper) s += P(poly([k([x - 14 * sc, y - th - 3.5 * sc], 0.02), k([x + 10 * sc, y - th - 3.5 * sc], 0.02), k([x + 12 * sc, y - th - 3.5 * sc], 0.1), k([x - 12 * sc, y - th - 3.5 * sc], 0.1)]), "paperE");
    if (o2.tape) s += R(x - 7 * sc, y - th + 5 * sc, 14 * sc, 5 * sc, "tape", 0.5) + L(x - 4 * sc, y - th + 7.5 * sc, x + 4 * sc, y - th + 7.5 * sc, "inkE", 1, "opacity:0.7");
    return s;
  }
  // A stack of workbooks and textbooks (muted covers, white page edges), base at (x, y).
  function stack(x, y, n, sc, seed) {
    const r = rand(seed || 11), cov = ["fabric1", "fabric2", "fabric3", "fabric4", "paperE2", "accentBlue"];
    let s = "", yy = y;
    for (let i = 0; i < n; i++) {
      const w = (22 + r() * 9) * sc, h = (3 + r() * 2.2) * sc, dx = (r() * 4 - 2) * sc;
      s += R((x - w / 2 + dx).toFixed(1), (yy - h).toFixed(1), w.toFixed(1), h.toFixed(1), cov[Math.floor(r() * cov.length)], 0.6) + R((x - w / 2 + dx + w * 0.82).toFixed(1), (yy - h + h * 0.2).toFixed(1), (w * 0.16).toFixed(1), (h * 0.6).toFixed(1), "paperE");
      yy -= h;
    }
    return s;
  }
  // Books on a shelf, spines of varying height.
  function shelfRow(x, y, w, seed, sc) {
    const r = rand(seed || 4), k = sc || 1, cov = ["fabric1", "fabric2", "fabric3", "fabric4", "paperE2", "accentBlue", "woodDark"];
    let s = R(x, y, w, 3 * k, "woodDark") + R(x, y + 3 * k, w, 2 * k, "aoC", 0, null, 0, "opacity:0.2");
    let xx = x + 2 * k;
    while (xx < x + w - 8 * k) {
      const bw = (3 + r() * 4) * k, bh = (13 + r() * 9) * k, lean = r() < 0.08;
      s += lean ? P(poly([[xx, y], [xx + bw, y], [xx + bw + bh * 0.4, y - bh * 0.9], [xx + bh * 0.4, y - bh * 0.9]]), cov[Math.floor(r() * cov.length)]) : R(xx.toFixed(1), (y - bh).toFixed(1), bw.toFixed(1), bh.toFixed(1), cov[Math.floor(r() * cov.length)]);
      xx += bw + (lean ? bh * 0.4 : 0.6 * k) + (r() < 0.1 ? 6 * k : 0);
    }
    return s;
  }
  // A bookcase against the back wall: a dark frame and rows of books.
  const bookcase = (x, y, w, h, rows, seed) => {
    let s = shadow(x + w / 2, y, w * 0.6, 4) + R(x, y - h, w, h, "woodDark") + R(x + 3, y - h + 3, w - 6, h - 6, "aoC", 0, null, 0, "opacity:0.35");
    for (let i = 1; i <= rows; i++) s += shelfRow(x + 3, y - h + (h * i) / (rows + 0.2), w - 6, (seed || 1) + i);
    return s + R(x, y - h, 3, h, "hiE", 0, null, 0, "opacity:0.12");
  };
  // A wall clock: white face, dark rim, hands at the hour (minute hand creeps round).
  function clock(x, y, r, hour) {
    const h = hour == null ? 9 : hour, ha = ((h % 12) * 30 - 90) * Math.PI / 180;
    let s = O(x + 1.5, y + 2, r, "aoC", null, 0, "opacity:0.18") + O(x, y, r, "clockRim") + O(x, y, r * 0.84, "paperE");
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += L((x + Math.cos(a) * r * 0.7).toFixed(1), (y + Math.sin(a) * r * 0.7).toFixed(1), (x + Math.cos(a) * r * 0.78).toFixed(1), (y + Math.sin(a) * r * 0.78).toFixed(1), "inkE", i % 3 ? 0.6 : 1.2); }
    s += L(x, y, (x + Math.cos(ha) * r * 0.45).toFixed(1), (y + Math.sin(ha) * r * 0.45).toFixed(1), "inkE", Math.max(1.2, r * 0.1));
    s += '<g style="transform-origin:' + x + "px " + y + 'px" class="spin">' + L(x, y, x, (y - r * 0.68).toFixed(1), "inkE", Math.max(0.8, r * 0.06)) + "</g>" + O(x, y, Math.max(1, r * 0.08), "accentRed");
    return s;
  }
  // A framed Taegukgi above the board, as in every Korean classroom.
  const flag = (x, y, w) => G(x, y, R(-2, -2, w + 4, w * 0.68 + 4, "woodDark") + R(0, 0, w, w * 0.68, "paperE") + O(w / 2, w * 0.34, w * 0.15, "accentBlue") +
    P("M" + (w / 2 - w * 0.15) + " " + w * 0.34 + " A" + w * 0.15 + " " + w * 0.15 + " 0 0 1 " + (w / 2 + w * 0.15) + " " + w * 0.34 + " A" + w * 0.075 + " " + w * 0.075 + " 0 0 1 " + w / 2 + " " + w * 0.34 + " A" + w * 0.075 + " " + w * 0.075 + " 0 0 0 " + (w / 2 - w * 0.15) + " " + w * 0.34 + " Z", "accentRed") +
    [[0.18, 0.16], [0.82, 0.16], [0.18, 0.52], [0.82, 0.52]].map(([u, v]) => R(w * u - w * 0.06, w * v, w * 0.12, w * 0.12, "inkE", 0, null, 0, "opacity:0.75")).join(""));
  // A green board with a chalk tray, faint ghosts of erased work, and some chalk writing (scribbled lines).
  function board(x, y, w, h, o) {
    const r = rand((o && o.seed) || 6);
    let s = R(x - 5, y - 5, w + 10, h + 10, "boardFrame") + R(x, y, w, h, "boardE") + R(x, y, w, h, null, 0, null, 0, fill(def("bdg", (id) => lin(id, [[0, "hiE", 0.1], [1, "hiE", 0]], [0, 0, 1, 1]))));
    for (let i = 0; i < 5; i++) s += E((x + r() * w).toFixed(0), (y + r() * h).toFixed(0), (20 + r() * 40).toFixed(0), (6 + r() * 10).toFixed(0), "chalkE", null, 0, "opacity:0.06");
    if (!o || o.writing !== false) {
      let d = "";
      for (let row = 0; row < 3; row++) { let xx = x + 14 + (row % 2) * 10; const yy = y + 18 + row * (h - 30) / 3; while (xx < x + w * (0.5 - row * 0.08)) { const n = 2 + Math.floor(r() * 5); d += "M" + xx.toFixed(0) + " " + yy.toFixed(0); for (let k = 0; k < n; k++) d += " l1.6 " + (k % 2 ? 2.2 : -2.6) + " l1.4 " + (k % 2 ? -0.6 : 1.4); xx += n * 3 + 5 + r() * 3; } }
      s += P(d, null, "chalkE", 1.1, "opacity:0.6");
      // The date and duty column on the right edge.
      s += L(x + w * 0.86, y + 6, x + w * 0.86, y + h - 6, "chalkE", 1, "opacity:0.4") + L(x + w * 0.89, y + 14, x + w * 0.97, y + 14, "chalkE", 1.2, "opacity:0.7") + L(x + w * 0.89, y + 24, x + w * 0.95, y + 24, "chalkE", 1.2, "opacity:0.7");
    }
    s += R(x - 6, y + h + 4, w + 12, 4, "boardFrame") + R(x + w * 0.2, y + h + 2, 8, 2.5, "chalkE") + R(x + w * 0.24, y + h + 2, 6, 2.5, "accentRed", 0, null, 0, "opacity:0.7") + R(x + w * 0.7, y + h + 1, 14, 4, "woodDark", 1);
    return s;
  }
  // A cork notice board with papers, a timetable grid and pins.
  function notices(x, y, w, h, seed) {
    const r = rand(seed || 8);
    let s = R(x - 3, y - 3, w + 6, h + 6, "woodDark") + R(x, y, w, h, "cork2");
    for (let i = 0; i < 4; i++) {
      const pw = w * (0.24 + r() * 0.12), ph = h * (0.3 + r() * 0.2), px = x + 4 + r() * (w - pw - 8), py = y + 4 + r() * (h - ph - 8);
      s += R(px.toFixed(1), py.toFixed(1), pw.toFixed(1), ph.toFixed(1), i % 3 ? "paperE" : "paperE2") + L(px + 3, py + ph * 0.3, px + pw - 4, py + ph * 0.3, "inkE", 0.8, "opacity:0.35") + L(px + 3, py + ph * 0.5, px + pw * 0.6, py + ph * 0.5, "inkE", 0.8, "opacity:0.35") + O(px + pw / 2, py + 2, 1.4, ["accentRed", "accentBlue", "neonC"][i % 3]);
    }
    return s;
  }
  // A desk lamp on a desk top at (x, y): the arm, the shade and a warm pool on the desk and wall.
  const deskLamp = (x, y, s, op) => pool(x + 30 * s, y - 6 * s, 120 * s, 60 * s, "lampWarm", op) + G(x, y, E(0, 0, 9, 2.5, "steel2") + P("M0 0 L5 -28 L22 -40", null, "steel", 2.6) + P("M14 -46 L34 -48 L30 -34 Z", "lampShade") + O(28, -38, 3, "lampWarm"), s);
  // A phone face down or lit, a mug of coffee (with a wisp of steam) and sticky notes.
  const mug = (x, y, s) => G(x, y, R(-6, -12, 12, 12, "paperE", 2) + R(2, -12, 4, 12, "aoC", 0, null, 0, "opacity:0.15") + P("M6 -10 q5 0 5 4 q0 4 -5 4", null, "paperE", 1.8) + G(0, -14, A("rise", P("M0 0 q-3 -5 0 -10 q3 -5 0 -10", null, "steamE", 1.2), "--del:-1s")), s || 1);
  const sticky = (x, y, seed, n) => { const r = rand(seed || 2); let s = ""; for (let i = 0; i < (n || 5); i++) s += G((x + (i % 3) * 16 + r() * 4).toFixed(0), (y + Math.floor(i / 3) * 15 + r() * 3).toFixed(0), '<g transform="rotate(' + ((r() - 0.5) * 8).toFixed(1) + ' 6 6)">' + R(0, 0, 12, 12, ["stickyY", "stickyP", "stickyB", "stickyY"][i % 4]) + L(2, 4, 10, 4, "inkE", 0.6, "opacity:0.4") + L(2, 7, 8, 7, "inkE", 0.6, "opacity:0.4") + "</g>"); return s; };
  // A fluorescent tube on the ceiling, with its glow.
  const tube = (x, y, w, s) => pool(x + w / 2, y + 4, w * 0.8, 18 * (s || 1), "fluoroGlow", 0.5) + R(x, y, w, 3 * (s || 1), "fluoro", 1.5) + R(x - 2, y - 1, w + 4, 1.5, "steel2");
  // The backs of other students: hair and shoulders, heads bowed.
  const backHead = (x, y, s, tok) => G(x, y, P("M-22 0 Q-22 -20 0 -22 Q22 -20 22 0 Z", tok || "fabric1") + E(0, -30, 11, 12, "hairE") + E(-3, -34, 5, 4, "hiE", null, 0, "opacity:0.12"), s || 1);

  // ---------- the sets (800 × 260: the back wall meets the floor near 200, feet at 240) ----------
  // Each set is the place without you; SCENES puts you in it. Event art and cutscenes reuse the sets.
  const W = 800, H = 260, FLOOR = 215, FEET = 240;
  const VP = [400, 112], BACK = [60, 22, 740, 200];
  const SETS = {
    // The baby's room in a Korean apartment: a crib, a mobile, a foam play mat, light from the window.
    nursery(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wallpaper", floor: "wood" });
      s += windowView(92, 46, 170, 118, { season: ctx.season, seed: 91, curtain: true });
      s += sunPatch(170, 206, 150, 26, 60) + shaft([[96, 50], [262, 50], [360, 230], [190, 230]], 4);
      // A low shelf of picture books and a stuffed bear.
      s += boxP(300, 200, 110, 34, 0.08, VP, "woodLight", "woodLight2", "woodLight2") + G(320, 166, R(0, -16, 9, 16, "fabric4") + R(10, -14, 8, 14, "fabric1") + R(19, -18, 10, 18, "fabric3"));
      s += G(380, 166, O(0, -10, 9, "bear") + O(-7, -18, 3.5, "bear") + O(7, -18, 3.5, "bear") + E(0, -8, 3, 2, "bear2"));
      // Puzzle play mat in perspective.
      const m = (u, v) => [400 + (u - 400) * (1 + v * 0.18), 210 + v * 13];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s += P(poly([m(260 + i * 60, j), m(320 + i * 60, j), m(320 + i * 60, j + 1), m(260 + i * 60, j + 1)]), ["matA", "matB", "matC", "matB"][(i + j) % 4], "aoC", 0.5);
      // The crib: pale wood rails, a mattress, a blanket.
      s += shadow(600, 236, 110, 8) + boxP(520, 232, 170, 18, 0.14, VP, "cribW2", "paperE", "cribW2") + boxP(512, 216, 186, 6, 0.14, VP, "cribW", "cribW", "cribW2");
      for (let i = 0; i < 11; i++) s += R(516 + i * 17, 158, 4, 58, "cribW");
      s += R(508, 150, 194, 8, "cribW", 2) + R(506, 146, 8, 92, "cribW2", 2) + R(696, 146, 8, 92, "cribW2", 2) + E(620, 200, 50, 8, "fabric1", null, 0, "opacity:0.7");
      s += G(600, 30, A("sway", L(0, 0, 0, 18, "steel2", 1) + L(-28, 18, 28, 18, "steel2", 1.4) + L(-28, 18, -28, 30, "steel2", 0.8) + L(28, 18, 28, 32, "steel2", 0.8) + L(0, 18, 0, 36, "steel2", 0.8) +
        O(-28, 34, 5, "matC") + P("M0 36 l5 9 l-10 0 Z", "matB") + E(28, 36, 6, 4, "matA")));
      return s + vignette(W, H);
    },
    // Kindergarten: cubbies with little bags, picture books face out, a rainbow-striped mat, low chairs.
    kinder(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wallKinder", floor: "wood", lower: [46, "wainscot"] });
      s += windowView(560, 44, 156, 100, { season: ctx.season, seed: 93 });
      s += sunPatch(520, 206, 150, 24, -60);
      // Cubbies: a grid of boxes, a bag or a coat in some.
      s += boxP(90, 200, 200, 96, 0.06, VP, "woodLight", "woodLight2", "woodLight2");
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const cx = 96 + i * 39, cy = 110 + j * 30; s += R(cx, cy, 34, 25, "aoC", 0, null, 0, "opacity:0.35") + (((i + j) % 3) ? R(cx + 6, cy + 6, 22, 19, ["fabric1", "fabric4", "fabric3", "stickyY"][(i * 3 + j) % 4], 4) : ""); }
      // A row of picture books on a ledge, and a strip of drawings on the wall.
      s += R(310, 128, 200, 4, "woodLight2");
      for (let i = 0; i < 7; i++) s += G(318 + i * 27, 128, '<g transform="rotate(' + (i % 2 ? 2 : -2) + ' 11 0)">' + R(0, -24, 22, 24, ["fabric4", "stickyY", "fabric1", "matB", "fabric2", "matC", "fabric3"][i]) + O(11, -14, 5, "paperE", null, 0, "opacity:0.6") + "</g>");
      for (let i = 0; i < 6; i++) s += R(320 + i * 34, 52, 26, 30, "paperE") + O(333 + i * 34, 64, 6, ["stickyY", "fabric1", "matB", "fabric4", "matC", "stickyB"][i], null, 0, "opacity:0.8") + L(312, 50, 520, 50, "steel2", 0.8);
      // The rainbow mat: concentric half rings flattened by perspective.
      ["matC", "stickyY", "matB", "stickyB", "matA"].forEach((t, i) => { s += P("M" + (250 + i * 18) + " 238 A" + (150 - i * 18) + " " + (24 - i * 3.5) + " 0 0 1 " + (550 - i * 18) + " 238 Z", t); });
      s += G(660, 236, shadow(0, 0, 22, 4) + R(-14, -24, 28, 4, "stickyB", 2) + L(-11, -20, -12, 0, "steel2", 2) + L(11, -20, 12, 0, "steel2", 2) + R(-14, -44, 28, 18, "stickyB", 3));
      return s + vignette(W, H);
    },
    // An elementary classroom: the green board under the Taegukgi, a clock and the TV, a cork board of
    // drawings, a window wall, wooden floor, rows of small desks, and a mop and broom in the corner.
    classroom(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wallSchool", floor: "wood", lower: [52, "wainscot"] });
      s += tube(170, 6, 90) + tube(360, 4, 90) + tube(550, 6, 90);
      s += board(222, 62, 300, 92, { seed: 6 }) + flag(355, 30, 34) + clock(560, 44, 11, 9);
      s += boxP(600, 70, 52, 34, 0.04, VP, "tvE", "tvE", "tvE") + R(604, 40, 44, 26, "screenOff");
      s += notices(86, 64, 112, 74, 8) + R(98, 72, 24, 20, "stickyY") + R(130, 70, 22, 24, "matB") + R(160, 74, 26, 18, "fabric4");
      s += windowView(640, 54, 92, 102, { season: ctx.season, seed: 21, blind: true });
      s += sunPatch(560, 206, 170, 26, -70) + shaft([[640, 60], [732, 60], [600, 230], [470, 230]], 5);
      // Cleaning tools in the corner: a broom and a mop leaning on the wall.
      s += L(70, 198, 82, 130, "woodLight2", 2.4) + P("M64 200 L76 200 L74 186 L66 186 Z", "fabric2") + L(92, 200, 100, 120, "steel", 2) + E(92, 200, 9, 3, "fabric1");
      for (const [x, y, sc] of [[170, 218, 0.95], [630, 222, 1.0], [96, 252, 1.25], [712, 256, 1.3]]) s += deskP(x, y, sc, VP, { books: 2, seed: x });
      return s + vignette(W, H);
    },
    // A middle-school corridor, measured in metres and projected: classroom doors with glass and lockers
    // down the left wall, tall windows down the right with sun lying across the linoleum, tubes overhead.
    hallway(ctx) {
      const p = proj(500, 104, 560, 0.35, 1.6), q = (pts, tok, ex) => P(poly(pts.map((v) => p(...v))), tok, null, 0, ex);
      const Z0 = 1.6, Z1 = 34, hw = 1.6, ht = 3;
      let s = R(-10, -10, W + 20, H + 20, "ceiling");
      s += q([[-hw, ht, Z0], [hw, ht, Z0], [hw, ht, Z1], [-hw, ht, Z1]], "ceiling") + q([[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], "lino");
      s += q([[-hw, 0, Z0], [-hw, ht, Z0], [-hw, ht, Z1], [-hw, 0, Z1]], "wallSchool") + q([[-hw, 0, Z0], [-hw, 1, Z0], [-hw, 1, Z1], [-hw, 0, Z1]], "wainscot");
      s += q([[hw, 0, Z0], [hw, ht, Z0], [hw, ht, Z1], [hw, 0, Z1]], "wallSchool2") + q([[hw, 0, Z0], [hw, 0.9, Z0], [hw, 0.9, Z1], [hw, 0, Z1]], "wainscot");
      // Floor tiles: seams along the corridor and across it, closer together with distance.
      let d = "";
      for (let x = -hw + 0.6; x < hw; x += 0.6) { const a = p(x, 0, Z0), b = p(x, 0, Z1); d += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + b[0].toFixed(1) + " " + b[1].toFixed(1) + " "; }
      for (let z = 2.4; z < Z1; z += 1.2) { const a = p(-hw, 0, z), b = p(hw, 0, z); d += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + b[0].toFixed(1) + " " + b[1].toFixed(1) + " "; }
      s += P(d, null, "lino2", 0.8, "opacity:0.8");
      // The far end: a window onto the day.
      const e0 = p(-hw, ht, Z1), e1 = p(hw, 0, Z1);
      s += R(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], "wallSchool");
      const w0 = p(-0.9, 2.5, Z1), w1 = p(0.9, 0.9, Z1);
      s += windowView(w0[0], w0[1], w1[0] - w0[0], w1[1] - w0[1], { season: ctx.season, seed: 30, tree: false });
      // Right wall: tall windows; their light falls across the floor toward the left wall.
      const sky2 = skyF(ctx.season === "summer" ? "rain" : "day");
      for (let z = 3; z < Z1 - 3; z += 4.2) {
        s += q([[hw, 1.05, z], [hw, 2.6, z], [hw, 2.6, z + 2.8], [hw, 1.05, z + 2.8]], null, "fill:" + sky2) + q([[hw, 1.05, z], [hw, 2.6, z], [hw, 2.6, z + 2.8], [hw, 1.05, z + 2.8]], "glassTint", "opacity:0.3");
        s += P(poly([[hw, 1.05, z], [hw, 2.6, z], [hw, 2.6, z + 2.8], [hw, 1.05, z + 2.8]].map((v) => p(...v))), null, "alum", 2) + P(poly([[hw, 1.05, z + 1.4], [hw, 2.6, z + 1.4]].map((v) => p(...v))).replace(" Z", ""), null, "alum", 1.5);
        s += q([[hw, 0, z + 0.6], [hw, 0, z + 3.2], [-0.4, 0, z + 4.4], [-0.4, 0, z + 1.8]], null, fill(def("sunp", (id) => lin(id, [[0, "sunLight", 0.9], [1, "sunLight", 0.25]])), "opacity:var(--a-sunOp)"));
      }
      // Left wall: classroom doors with a strip of glass, lockers between them, a notice board.
      for (let z = 6.2; z < Z1 - 2; z += 6) {
        s += q([[-hw, 0, z], [-hw, 2.1, z], [-hw, 2.1, z + 1.1], [-hw, 0, z + 1.1]], "doorE") + q([[-hw, 1.25, z + 0.12], [-hw, 1.85, z + 0.12], [-hw, 1.85, z + 0.98], [-hw, 1.25, z + 0.98]], "glassTint", "opacity:0.8") +
          q([[-hw, 2.1, z - 0.05], [-hw, 2.18, z - 0.05], [-hw, 2.18, z + 1.15], [-hw, 2.1, z + 1.15]], "doorFrame");
        s += q([[-hw, 0, z + 1.6], [-hw, 1.15, z + 1.6], [-hw, 1.15, z + 4.6], [-hw, 0, z + 4.6]], "lockerE");
        let lk = "";
        for (let k = 1; k < 8; k++) { const a = p(-hw, 0.02, z + 1.6 + k * 0.375), b = p(-hw, 1.13, z + 1.6 + k * 0.375); lk += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + b[0].toFixed(1) + " " + b[1].toFixed(1) + " "; }
        s += P(lk, null, "lockerE2", 1) + q([[-hw, 1.15, z + 1.6], [-hw, 1.2, z + 1.6], [-hw, 1.2, z + 4.6], [-hw, 1.15, z + 4.6]], "lockerE2");
      }
      s += q([[-hw, 1.4, 4.0], [-hw, 2.1, 4.0], [-hw, 2.1, 5.8], [-hw, 1.4, 5.8]], "cork2") + q([[-hw, 1.5, 4.2], [-hw, 2.0, 4.2], [-hw, 2.0, 4.8], [-hw, 1.5, 4.8]], "paperE") + q([[-hw, 1.48, 5.0], [-hw, 1.95, 5.0], [-hw, 1.95, 5.6], [-hw, 1.48, 5.6]], "paperE2") + q([[-hw, 0, 2.6], [-hw, 1.15, 2.6], [-hw, 1.15, 5.8], [-hw, 0, 5.8]], "lockerE");
      // Tubes down the middle of the ceiling.
      for (let z = 3; z < Z1; z += 3.5) s += q([[-0.1, ht - 0.02, z], [0.1, ht - 0.02, z], [0.1, ht - 0.02, z + 1.2], [-0.1, ht - 0.02, z + 1.2]], "fluoro");
      // Where the walls meet the floor and ceiling, a little darker.
      s += P(poly([p(-hw, 0, Z0), p(-hw, 0, Z1), p(-hw + 0.25, 0, Z1), p(-hw + 0.25, 0, Z0)]), "aoC", null, 0, "opacity:0.12") + P(poly([p(hw, 0, Z0), p(hw, 0, Z1), p(hw - 0.25, 0, Z1), p(hw - 0.25, 0, Z0)]), "aoC", null, 0, "opacity:0.1");
      s += E(p(0, 0, 9)[0], p(0, 0, 9)[1], 160, 20, null, null, 0, fill(def("sheen", (id) => radial(id, [[0, "hiE", 0.22], [1, "hiE", 0]]))));
      s += G(...p(-hw + 0.1, 0, 2.6), R(-6, -30, 12, 30, "accentRed", 4) + R(-3, -36, 6, 6, "inkE"));
      return s + vignette(W, H);
    },
    // 야자: the high-school classroom at night. Fluorescent light, dark windows onto lit apartments,
    // towers of workbooks on every desk, a few heads bent over them.
    yaja(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wallSchool", floor: "lino", lower: [52, "wainscot"] });
      s += R(-20, -20, W + 40, H + 40, "fluoroGlow", 0, null, 0, "opacity:0.06");
      s += tube(170, 6, 90) + tube(360, 4, 90) + tube(550, 6, 90);
      s += board(222, 62, 300, 92, { seed: 9 }) + flag(355, 30, 34) + clock(560, 44, 11, 10);
      s += notices(86, 64, 112, 74, 12);
      s += windowView(630, 54, 102, 102, { season: ctx.season, seed: 22, night: true });
      for (const [x, y, sc, n] of [[160, 218, 0.95, 5], [300, 214, 0.9, 4], [640, 222, 1.0, 6], [96, 252, 1.25, 6], [712, 256, 1.3, 4]]) s += deskP(x, y, sc, VP, { books: n, seed: x, bx: -10 });
      s += backHead(300, 196, 0.8, "uniformE") + backHead(640, 204, 0.95, "uniformE");
      return s + vignette(W, H, 0.6);
    },
    // Your desk at home late at night: the lamp's pool of light, sticky notes, a D-day calendar in the
    // exam year, towers of workbooks, a mug, the window onto the lit apartments across the way.
    desk(ctx) {
      let s = room(W, H, BACK, VP, { night: true, floor: "wood" });
      s += windowView(452, 40, 160, 104, { season: ctx.season, night: true, seed: 41, curtain: true });
      s += bookcase(80, 200, 120, 150, 4, 3);
      // The bed's corner, low on the left.
      s += boxP(-20, 250, 120, 30, 0.1, VP, "fabric1", "beddingE", "fabric1");
      if (ctx.dday != null) s += G(270, 44, R(2, 2, 92, 66, "aoC", 2, null, 0, "opacity:0.25") + R(0, 0, 92, 66, "paperE", 2) + R(0, 0, 92, 15, "accentRed", 2) + O(20, 7, 2, "paperE") + O(72, 7, 2, "paperE") + T(46, 52, "D-" + ctx.dday, "accentRed", 26));
      else s += G(276, 50, R(0, 0, 74, 52, "paperE2") + R(4, 4, 66, 30, "mtnFar") + P("M4 34 L24 18 L40 28 L54 16 L70 34 Z", "mtnMid"));
      s += sticky(380, 70, 3, 5);
      // The desk: a long top, a drawer unit, the lamp, books, an open workbook, the mug.
      s += shadow(600, 214, 200, 10) + boxP(430, 160, 340, 7, 0.07, VP, "woodDesk2", "woodDesk", "woodDesk2") + R(436, 167, 8, 44, "woodDesk2") + boxP(640, 210, 120, 43, 0.05, VP, "woodDesk2", "woodDesk", "woodDesk2") + L(650, 188, 750, 188, "aoC", 1, "opacity:0.3");
      s += deskLamp(470, 154, 1.1, 0.85) + stack(580, 154, ctx.dday != null ? 8 : 4, 1.4, 12) + G(670, 152, P("M-26 0 L0 -5 L26 0 L26 3 L0 -2 L-26 3 Z", "paperE") + L(-20, -2, -4, -4, "inkE", 0.6, "opacity:0.4")) + mug(740, 154, 1.1);
      s += G(530, 153, R(-8, -2, 16, 3, "inkE", 1));
      return s + vignette(W, H, 0.7);
    },
    // A study café (독서실): a dim aisle between two rows of carrels, each with its own warm lamp; the
    // near one on the right open to us, with a timer and a stack of books.
    cubicle(ctx) {
      const p = proj(400, 96, 520, 0, 1.5), q = (pts, tok, ex) => P(poly(pts.map((v) => p(...v))), tok, null, 0, ex);
      const Z0 = 1.2, Z1 = 16, hw = 2.6, ht = 2.6;
      let s = R(-10, -10, W + 20, H + 20, "nCeil") + q([[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], "nFloor") + q([[-hw, 0, Z0], [-hw, ht, Z0], [-hw, ht, Z1], [-hw, 0, Z1]], "nWall2") + q([[hw, 0, Z0], [hw, ht, Z0], [hw, ht, Z1], [hw, 0, Z1]], "nWall2");
      const e0 = p(-hw, ht, Z1), e1 = p(hw, 0, Z1);
      s += R(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], "nWall") + R(p(-0.4, 2.1, Z1)[0], p(0, 2.1, Z1)[1], 520 * 0.8 / Z1, 520 * 2.1 / Z1, "doorE2", 0, null, 0, "opacity:0.7");
      for (let z = 2.5; z < Z1; z += 2.4) { const c = p(0, ht, z); s += pool(c[0], c[1] + 4, 200 / z, 60 / z, "lampWarm", 0.4) + O(c[0], c[1], Math.max(1, 14 / z), "lampWarm"); }
      // Carrels down both sides, far to near: desk top, the panels between them, a lamp's pool on each desk.
      for (const side of [-1, 1]) for (let z = Z1 - 1.0; z >= 2.2; z -= 1.0) {
        const x0 = side * hw, x1 = side * (hw - 0.75), lit = (Math.round(z * 3) % 4) !== 1;
        s += q([[x0, 0.75, z], [x1, 0.75, z], [x1, 0.75, z + 1], [x0, 0.75, z + 1]], "partition2");
        s += q([[x0, 0, z], [x0, 1.45, z], [x1, 1.45, z], [x1, 0, z]], "partition") + q([[x1, 0, z], [x1, 1.45, z], [x1, 1.45, z + 0.04], [x1, 0, z + 0.04]], "partition2");
        if (lit) { const c = p((x0 + x1) / 2, 0.8, z + 0.5); s += pool(c[0], c[1], 260 / z, 80 / z, "lampWarm", 0.7); }
        if (lit && (Math.round(z * 7) % 3) === 0) { const c = p(x1 + side * -0.05, 0, z + 0.55); s += backHead(c[0], c[1] - 520 * 0.75 / z, 1.1 / z * 2.2, "hoodieE"); }
      }
      // The near carrel on the right, open toward us.
      s += G(560, 240, boxP(0, 0, 220, 70, 0.08, [400 - 560, 96 - 240], "partition", "partition2", "partition2") + R(4, -146, 6, 146, "partition2") + R(4, -146, 212, 76, "partition") + R(8, -118, 204, 5, "partition2") + stack(120, -118, 5, 1.1, 7) + deskLamp(30, -70, 1, 0.9) +
        R(170, -84, 26, 14, "inkE", 3) + R(173, -81, 20, 8, "timer", 1));
      return s + vignette(W, H, 0.75);
    },
    // A retake academy's lecture hall from the back: rows of heads and long desks down to the stage, a
    // whiteboard with the countdown and a projector screen.
    academy(ctx) {
      const p = proj(400, 86, 600, 0, 1.7), q = (pts, tok, ex) => P(poly(pts.map((v) => p(...v))), tok, null, 0, ex);
      const Z0 = 1.5, Z1 = 15, hw = 6.5, ht = 3.4;
      let s = R(-10, -10, W + 20, H + 20, "ceiling") + q([[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], "tileE") + q([[-hw, 0, Z0], [-hw, ht, Z0], [-hw, ht, Z1], [-hw, 0, Z1]], "wallAcad") + q([[hw, 0, Z0], [hw, ht, Z0], [hw, ht, Z1], [hw, 0, Z1]], "wallAcad") +
        q([[-hw, 0, Z0], [-hw, ht, Z0], [-hw, ht, Z1], [-hw, 0, Z1]], "aoC", "opacity:0.08");
      const e0 = p(-hw, ht, Z1), e1 = p(hw, 0, Z1);
      s += R(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], "wallAcad") + ao(e0[0], e1[1] - 10, e1[0] - e0[0], 10, "d", 0.2);
      for (let z = 3; z < Z1; z += 2.6) for (const x of [-3, 3]) s += q([[x - 0.6, ht, z], [x + 0.6, ht, z], [x + 0.6, ht, z + 0.25], [x - 0.6, ht, z + 0.25]], "fluoro");
      // The stage: a whiteboard with a chart and the countdown, the projector screen and its beam.
      const b0 = p(-5.4, 2.7, Z1 - 0.01), b1 = p(-0.6, 0.9, Z1 - 0.01), c0 = p(0.4, 2.9, Z1 - 0.01), c1 = p(5.4, 0.8, Z1 - 0.01);
      s += R(b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1], "boardWhite", 1, "steel", 2) + P("M" + (b0[0] + 10) + " " + (b1[1] - 10) + " l26 -18 l20 8 l30 -24", null, "accentBlue", 1.6) + L(b0[0] + 10, b0[1] + 12, b0[0] + 70, b0[1] + 12, "inkE", 1, "opacity:0.5");
      s += T((b0[0] + b1[0]) / 2 + 40, (b0[1] + b1[1]) / 2 + 8, "D-" + (ctx.dday != null ? ctx.dday : 100), "accentRed", 20);
      s += R(c0[0], c0[1], c1[0] - c0[0], c1[1] - c0[1], "screenE") + R(c0[0] - 2, c0[1] - 4, c1[0] - c0[0] + 4, 4, "steel2") + P("M" + (c0[0] + 14) + " " + (c0[1] + 30) + " l30 -8 l30 16 l40 -14", null, "accentBlue", 1.4, "opacity:0.7");
      const pr = p(2.9, ht - 0.2, 5);
      s += P(poly([[pr[0] - 3, pr[1]], [pr[0] + 3, pr[1]], [c1[0], c1[1]], [c0[0], c1[1]], [c0[0], c0[1]]]), "fluoroGlow", null, 0, "opacity:0.12") + R(pr[0] - 10, pr[1] - 4, 20, 8, "steel2", 2);
      // Rows of long desks and the heads behind them, far to near.
      for (let z = Z1 - 3; z >= 3.6; z -= 1.3) {
        for (let i = 0; i < 9; i++) { const x = -hw + 1.0 + i * 1.4 + (z % 2.6 > 1.3 ? 0.3 : 0); if (Math.abs(x) < 0.8 && z < 6) continue; const c = p(x, 0.5, z + 0.7); s += backHead(c[0], c[1], 1.1 / (z + 0.7) * 2.6, ["hoodieE", "fabric1", "fabric3", "hoodieE", "fabric2", "fabric1"][(i + Math.round(z)) % 6]); }
        s += q([[-hw + 0.4, 0.74, z], [hw - 0.4, 0.74, z], [hw - 0.4, 0.74, z + 0.5], [-hw + 0.4, 0.74, z + 0.5]], "formica") + q([[-hw + 0.4, 0, z], [-hw + 0.4, 0.74, z], [hw - 0.4, 0.74, z], [hw - 0.4, 0, z]], "formica2");
      }
      return s + vignette(W, H, 0.6);
    },
    // The university campus: granite and brick halls, a lawn, a path running away, trees in season.
    campus(ctx) {
      let s = outdoorSky(W, H, { season: ctx.season, seed: 8 });
      s += ridge(0, W, 150, 46, 3, "mtnFar", ctx.season) + haze(0, 100, W, 60, 0.6);
      s += boxP(430, 186, 340, 120, 0.1, [380, 120], "granite", "granite2", "granite2") + R(430, 66, 340, 8, "granite2");
      for (let f = 0; f < 4; f++) for (let i = 0; i < 9; i++) s += R(446 + i * 36, 80 + f * 26, 20, 16, "winDay") + R(446 + i * 36, 80 + f * 26, 20, 3, "aoC", 0, null, 0, "opacity:0.25");
      s += boxP(40, 176, 180, 90, 0.08, [380, 120], "brick", "brick2", "brick2");
      for (let f = 0; f < 3; f++) for (let i = 0; i < 6; i++) s += R(54 + i * 28, 96 + f * 24, 14, 14, "winDay");
      s += R(0, 172, W, 88, season2(ctx.season, "lawn"));
      s += P("M300 260 Q370 210 470 186 L520 186 Q450 214 430 260 Z", "pathE") + P("M300 260 Q370 210 470 186", null, "aoC", 1, "opacity:0.15");
      s += tree(110, 196, ctx.season, 1.2, "cherry") + tree(260, 192, ctx.season, 0.9) + tree(770, 200, ctx.season, 1.2);
      s += particles(ctx.season, 0, 0, W, 200, false, 14, 9);
      s += G(560, 210, avatar({ age: "adult", outfit: "casual", look: { hair: 2, shirt: 2, sex: "f" }, mood: "happy" }), 0.5) + G(600, 214, avatar({ age: "adult", outfit: "casual", look: { hair: 0, shirt: 3 }, mood: "ok" }), 0.5);
      return s;
    },
    // The 수능 hall: a classroom emptied for the exam, desks spaced apart with seat numbers taped on,
    // the board with the start time, a cold morning outside.
    examhall(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wallSchool", floor: "lino", lower: [52, "wainscot"] });
      s += tube(170, 6, 90) + tube(360, 4, 90) + tube(550, 6, 90);
      s += board(222, 62, 300, 92, { seed: 4, writing: false }) + T(440, 124, "08:40", "chalkE", 34, "opacity:0.9") + L(250, 86, 360, 86, "chalkE", 2, "opacity:0.6") + L(250, 104, 340, 104, "chalkE", 2, "opacity:0.6") + flag(355, 30, 34) + clock(560, 44, 11, 8);
      s += windowView(640, 54, 92, 102, { season: "winter", seed: 51, tod: "dawn" });
      s += G(100, 70, R(0, 0, 40, 56, "paperE") + R(4, 6, 32, 3, "inkE", 0, null, 0, "opacity:0.4") + R(4, 14, 24, 3, "inkE", 0, null, 0, "opacity:0.3") + R(4, 22, 28, 3, "inkE", 0, null, 0, "opacity:0.3"));
      for (const [x, y, sc] of [[150, 214, 0.9], [270, 210, 0.85], [640, 220, 1.0], [96, 252, 1.25], [712, 256, 1.3]]) s += deskP(x, y, sc, VP, { tape: true, paper: x > 600 || x < 120 });
      s += backHead(150, 194, 0.78, "hoodieE") + backHead(640, 200, 0.95, "uniformE");
      return s + vignette(W, H, 0.55);
    },
    // Results night: the living room of the family apartment, the TV's blue glow, a floor lamp, the
    // balcony window onto the complex across the way.
    home(ctx) {
      let s = room(W, H, BACK, VP, { night: true, floor: "wood" });
      s += windowView(90, 34, 190, 132, { season: ctx.season, night: true, seed: 61, curtain: true });
      s += G(330, 70, R(0, 0, 34, 42, "woodDark") + R(3, 3, 28, 36, "mtnFar") + O(17, 18, 6, "fabric2", null, 0, "opacity:0.7"), 1) + G(376, 78, R(0, 0, 28, 32, "woodDark") + R(3, 3, 22, 26, "blossomE"));
      // A floor lamp's warm pool and the TV's cold one.
      s += pool(300, 170, 130, 90, "lampWarm", 0.7) + G(300, 214, L(0, 0, 0, -120, "steel2", 2) + P("M-12 -118 L12 -118 L8 -136 L-8 -136 Z", "lampShade") + E(0, 0, 10, 3, "steel2"));
      s += pool(640, 130, 120, 70, "screenE", 0.45) + boxP(570, 196, 150, 24, 0.06, VP, "woodDesk2", "woodDesk", "woodDesk2") + R(586, 108, 118, 64, "inkE", 2) + R(590, 112, 110, 56, "screenE", 1, null, 0, "opacity:0.75");
      // The sofa, low in the foreground.
      s += shadow(520, 252, 200, 10) + boxP(380, 258, 300, 34, 0.06, VP, "sofaE", "sofaE2", "sofaE2") + R(384, 196, 292, 32, "sofaE2", 8) + R(370, 214, 22, 44, "sofaE", 6) + R(668, 214, 22, 44, "sofaE", 6);
      return s + vignette(W, H, 0.7);
    },
    // The university's main gate in spring: granite pillars, a name plate, cherry trees, banners.
    gate(ctx) {
      let s = outdoorSky(W, H, { season: "spring", seed: 13 }) + ridge(0, W, 160, 50, 6, "mtnFar", "spring") + haze(0, 110, W, 60, 0.6);
      s += boxP(250, 176, 300, 70, 0.08, [400, 120], "granite", "granite2", "granite2");
      for (let i = 0; i < 8; i++) s += R(262 + i * 36, 120, 22, 40, "winDay");
      s += R(0, 186, W, 74, "lawnSp") + P("M330 260 L380 186 L420 186 L470 260 Z", "pathE");
      s += tree(90, 196, "spring", 1.35, "cherry") + tree(190, 200, "spring", 1.0, "cherry") + tree(700, 196, "spring", 1.4, "cherry") + tree(620, 200, "spring", 1.0, "cherry");
      // The gate: two granite pillars and a beam; the name plate high on the beam, clear of the bubble.
      s += shadow(270, 200, 40, 6) + shadow(530, 200, 40, 6);
      s += boxP(240, 200, 52, 150, 0.05, [400, 120], "granite", "granite2", "granite2") + boxP(508, 200, 52, 150, 0.05, [400, 120], "granite", "granite2", "granite2") + R(226, 40, 348, 22, "granite2") + R(226, 62, 348, 4, "aoC", 0, null, 0, "opacity:0.25");
      s += R(296, 14, 208, 32, "plate", 2, "granite2", 2) + (ctx.label ? T(400, 37, ctx.label, "plateInk", ctx.label.length > 16 ? 12 : 16) : "");
      // Banners on poles on both sides (shapes only).
      s += G(160, 186, L(0, 0, 0, -100, "steel2", 2) + R(2, -98, 18, 56, "accentRed", 1, null, 0, "opacity:0.75")) + G(640, 186, L(0, 0, 0, -100, "steel2", 2) + R(2, -98, 18, 56, "accentBlue", 1, null, 0, "opacity:0.75"));
      s += particles("spring", 0, 0, W, 210, false, 16, 17);
      return s;
    },
    // No university: a country road at the golden hour, telephone poles running to the hills.
    road(ctx) {
      let s = sky(0, 0, W, H, { tod: "gold", seed: 4, sunX: 0.7, sunY: 0.62, sunR: 12 });
      s += ridge(0, W, 176, 60, 8, "mtnFar", ctx.season) + haze(0, 130, W, 50, 0.7) + ridge(0, W, 186, 26, 9, "mtnMid", ctx.season);
      s += R(0, 184, W, 76, season2(ctx.season, "field"));
      s += P("M330 260 L420 184 L432 184 L480 260 Z", "asphalt") + L(405, 260, 426, 184, "lane", 1.5, "stroke-dasharray:8 8");
      for (let i = 0; i < 5; i++) { const t = 1 - i * 0.2, x = 520 + 240 * t, h = 120 * t; s += L(x, 190 + 60 * t, x, 190 + 60 * t - h, "trunk", 2.6 * t) + L(x - 12 * t, 196 + 60 * t - h, x + 12 * t, 196 + 60 * t - h, "trunk", 2 * t); }
      s += P("M770 140 Q640 150 520 160 Q470 164 434 170", null, "inkE", 0.8, "opacity:0.4");
      return s + vignette(W, H, 0.5);
    },
    // The setup banner: a city at night under a low moon, Namsan Tower in the haze, lit apartment windows.
    start() {
      let s = sky(0, 0, W, H, { tod: "night", seed: 2, sunX: 0.51, sunY: 0.45, sunR: 16 });
      s += withLit(0.9, () => namsan(560, 200, 1.3)) + haze(0, 120, W, 90, 0.4);
      const r = rand(99);
      s += withLit(0.9, () => { let b = ""; for (let i = 0; i < 12; i++) b += block(i * 70 - 10, H, 56, 60 + r() * 50, "bldFar", i, 8); for (let i = 0; i < 9; i++) { const x = i * 92 + 10, h = 50 + r() * 60; b += aptSlab(x, H, 70, h, 7, i + 40); } return b; });
      return s;
    },
    // Neighbourhood streets: 학원가 at ten at night, the academies' signboards lit, street lights, cars.
    city(ctx) {
      let s = sky(0, 0, W, H, { tod: "night", seed: 75, sun: false }) + haze(0, 40, W, 140, 0.3);
      const r = rand(8);
      s += withLit(0.85, () => { let b = ""; for (let i = 0; i < 8; i++) { const x = i * 104 - 14, h = 150 + r() * 70; b += block(x, H - 46, 98, h, i % 2 ? "nightBld" : "nightBld2", i + 20, 13, "nightWin"); } return b; });
      // Signboards: dark boxes with a lit edge and pale bars where the letters would be; a vertical sign.
      const r2 = rand(12);
      for (let i = 0; i < 8; i++) {
        const x = i * 104 - 6;
        for (let k = 0; k < 3; k++) {
          if (r2() < 0.25) continue;
          const sy = H - 196 + k * 44 + r2() * 10, col = ["neonA", "neonB", "neonC", "signW"][(i + k) % 4], w = 60 + r2() * 20;
          s += G(x, sy.toFixed(0), R(0, 0, w, 16, "signBox", 1) + R(0, 0, w, 16, col, 1, null, 0, "opacity:0.28") + R(0, 14, w, 2, col, 0, null, 0, "opacity:0.9") + R(6, 5, w * (0.4 + r2() * 0.4), 5, col, 1, null, 0, "opacity:0.85") + pool(w / 2, 20, w * 0.7, 10, col, 0.35));
        }
        if (i % 3 === 1) s += R(x + 80, H - 200, 10, 80, "signBox", 1) + R(x + 82, H - 194, 6, 68, ["neonB", "neonA", "neonC"][i % 3], 1, null, 0, "opacity:0.75");
        s += R(x, H - 70, 92, 24, "winLit", 0, null, 0, "opacity:0.45");
      }
      s += R(0, H - 46, W, 46, "asphalt") + R(0, H - 46, W, 5, "curb") + L(0, H - 18, W, H - 18, "lane", 1.2, "stroke-dasharray:14 10");
      for (let i = 0; i < 4; i++) { const x = 60 + i * 220; s += pool(x + 16, H - 40, 90, 22, "sodium", 0.7) + L(x, H - 46, x, H - 170, "steel2", 3) + L(x, H - 168, x + 22, H - 168, "steel2", 2) + O(x + 22, H - 166, 3, "sodium") + pool(x + 22, H - 162, 30, 26, "sodium", 0.6); }
      // Parents' cars waiting at the kerb with their lights on.
      for (const x of [150, 520]) s += G(x, H - 24, shadow(0, 2, 50, 4) + R(-44, -20, 88, 18, "suitE", 5) + P("M-28 -20 L-18 -32 L18 -32 L28 -20 Z", "suitE") + R(-16, -30, 30, 9, "winDay", 1) + O(-30, -2, 6, "inkE") + O(30, -2, 6, "inkE") + R(40, -16, 4, 4, "lampWarm") + R(-44, -16, 4, 4, "accentRed"));
      return s + vignette(W, H, 0.6);
    },
  };
  // Seasonal ground: lawns and fields.
  const season2 = (season, kind) => (kind === "lawn" ? { spring: "lawnSp", summer: "lawnSu", fall: "lawnFa", winter: "snowE" } : { spring: "lawnSp", summer: "vegSu", fall: "vegFa2", winter: "snowE" })[season] || "lawnSu";
  // You in the place: where you stand in each set, and what you hold.
  const SCENES = {};
  for (const n in SETS) SCENES[n] = (ctx) => SETS[n](ctx) + (n === "start" ? "" : person(ctx, n === "kinder" ? 380 : n === "hallway" ? 330 : n === "cubicle" ? 330 : 350, FEET, n === "cubicle" ? 1.02 : 1.05,
    n === "gate" ? { pose: "cheer", mood: "happy" } : n === "cubicle" || n === "campus" ? { prop: "book" } : null));
  function sceneName(stage, ctx) {
    if (ctx.ending) return ctx.label ? "gate" : "road";
    if (ctx.examMonth) return "examhall";
    if (ctx.results) return "home";
    if (stage === "baby") return "nursery";
    if (stage === "kinder") return ctx.home ? "nursery" : "kinder";
    return { elem: "classroom", mid: "hallway", high: "yaja", hs3: "desk", academy: "academy", selfstudy: "cubicle", halfretake: "campus", dropout: "cubicle" }[stage] || "desk";
  }
  // Drawings start a fresh set of gradients (begin) and write them into their own <defs>.
  function scene(ctx) {
    VIEW = (ctx && ctx.view) || "city";
    REGION = (ctx && ctx.region) || "";
    begin();
    const name = ctx.scene || sceneName(ctx.stage, ctx);
    const body = (SCENES[name] || SCENES.desk)(ctx);
    return svg("0 0 " + W + " " + H, tidy(defsOut() + body), "scene scene-" + name, ctx.aria);
  }

  // More sets, mostly behind events: a teenager's bedroom, the school yard, a hospital ward, a PC방, the
  // apartment kitchen, an alley with a convenience store, Busan's beach, farmland, a bathroom.
  Object.assign(SETS, {
    bedroom(ctx, night) {
      let s = room(W, H, BACK, VP, { night, floor: "wood" });
      s += windowView(470, 40, 170, 110, { season: ctx.season, night, seed: 71, curtain: true });
      if (!night) s += sunPatch(400, 206, 170, 26, 70) + shaft([[470, 44], [640, 44], [610, 232], [420, 232]], 7);
      s += bookcase(80, 200, 110, 140, 4, 5) + G(220, 52, R(0, 0, 54, 74, "posterE") + R(4, 4, 46, 46, "fabric1", 0, null, 0, "opacity:0.7") + R(4, 54, 30, 4, "paperE", 0, null, 0, "opacity:0.7") + R(4, 62, 20, 3, "paperE", 0, null, 0, "opacity:0.5"));
      s += shadow(360, 214, 140, 8) + boxP(250, 214, 220, 30, 0.1, VP, "beddingE2", "beddingE", "beddingE2") + R(252, 168, 50, 20, "paperE", 6) + R(236, 120, 14, 94, "woodDark");
      s += boxP(660, 200, 60, 46, 0.06, VP, "woodDesk2", "woodDesk", "woodDesk2") + (night ? deskLamp(670, 154, 0.9, 0.85) : "");
      return s + vignette(W, H, night ? 0.7 : null);
    },
    // The school yard: a dirt ground with track lines, the four-storey school building, trees, a stand.
    field(ctx) {
      let s = outdoorSky(W, H, { season: ctx.season, seed: 73, tod: ctx.season === "summer" ? "rain" : "day" }) + ridge(0, W, 120, 40, 5, "mtnFar", ctx.season) + haze(0, 80, W, 50, 0.5);
      s += boxP(140, 160, 520, 112, 0.06, [400, 110], "schoolWall", "concrete", "concrete2");
      for (let f = 0; f < 4; f++) for (let i = 0; i < 13; i++) s += R(150 + i * 39, 58 + f * 25, 26, 16, "winDay") + R(150 + i * 39, 58 + f * 25, 26, 3, "aoC", 0, null, 0, "opacity:0.2");
      s += R(372, 44, 56, 12, "concrete2") + clock(400, 36, 8, 9);
      s += R(0, 160, W, 100, "dirt") + R(0, 160, W, 100, null, 0, null, 0, fill(aoF("u"), "opacity:0.12"));
      s += P("M-20 250 Q400 168 820 250", null, "lane", 2, "opacity:0.7") + P("M-20 236 Q400 176 820 236", null, "lane", 1.4, "opacity:0.5");
      s += tree(60, 168, ctx.season, 1.0) + tree(740, 168, ctx.season, 1.05) + tree(680, 166, ctx.season, 0.8, "ginkgo");
      s += particles(ctx.season, 0, 0, W, 200, false, 10, 6);
      return s;
    },
    // A hospital ward: curtained beds, an IV stand, the window, cool light.
    hospital(ctx) {
      let s = room(W, H, BACK, VP, { wall: "wardWall", floor: "tile", lower: [40, "wardWall2"] });
      s += R(-20, -20, W + 40, H + 40, "fluoroGlow", 0, null, 0, "opacity:0.06") + tube(250, 6, 100) + tube(470, 6, 100);
      s += windowView(540, 46, 160, 104, { season: ctx.season, seed: 79, blind: true });
      s += L(80, 30, 330, 30, "steel2", 1.5) + P("M84 30 Q100 120 90 200 L170 200 Q160 110 176 30 Z", "curtainWard") + P("M120 34 Q128 120 122 198", null, "aoC", 1, "opacity:0.15");
      s += shadow(450, 214, 140, 8) + boxP(330, 212, 230, 26, 0.1, VP, "steel", "paperE", "steel") + R(334, 170, 40, 16, "paperE", 6) + R(372, 172, 186, 14, "wardBlanket", 4) + R(556, 140, 6, 72, "steel2");
      s += G(300, 210, L(0, 0, 0, -140, "steel2", 2) + R(-8, -136, 16, 24, "ivBag", 4) + L(0, -112, 18, -60, "steel", 0.8) + E(0, 0, 12, 3, "steel2"));
      s += G(700, 150, R(0, 0, 50, 34, "inkE", 3) + P("M4 20 L14 20 L18 10 L24 28 L28 16 L46 16", null, "neonA", 1.4));
      return s + vignette(W, H);
    },
    // A PC방 at night, from the back: rows of gaming chairs and the glow of the screens past them, neon
    // strips along the ceiling, the room otherwise dark.
    pcbang() {
      const p = proj(400, 92, 560, 0, 1.55), q = (pts, tok, ex) => P(poly(pts.map((v) => p(...v))), tok, null, 0, ex);
      const Z0 = 1.4, Z1 = 14, hw = 5, ht = 2.8;
      let s = R(-10, -10, W + 20, H + 20, "nCeil") + q([[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], "nFloor2") + q([[-hw, 0, Z0], [-hw, ht, Z0], [-hw, ht, Z1], [-hw, 0, Z1]], "nWall2") + q([[hw, 0, Z0], [hw, ht, Z0], [hw, ht, Z1], [hw, 0, Z1]], "nWall2");
      const e0 = p(-hw, ht, Z1), e1 = p(hw, 0, Z1);
      s += R(e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1], "nWall");
      for (const [x, t] of [[-2, "neonB"], [2, "neonA"]]) s += q([[x - 0.05, ht, Z0], [x + 0.05, ht, Z0], [x + 0.05, ht, Z1], [x - 0.05, ht, Z1]], t, "opacity:0.9");
      s += q([[-hw, ht - 0.1, Z0], [-hw, ht - 0.05, Z0], [-hw, ht - 0.05, Z1], [-hw, ht - 0.1, Z1]], "neonB", "opacity:0.7") + q([[hw, ht - 0.1, Z0], [hw, ht - 0.05, Z0], [hw, ht - 0.05, Z1], [hw, ht - 0.1, Z1]], "neonA", "opacity:0.7");
      for (let z = Z1 - 1.6; z >= 2.6; z -= 1.8) {
        for (let i = 0; i < 6; i++) {
          const x = -hw + 0.9 + i * 1.65;
          if (Math.abs(x) < 0.7 && z < 5) continue;
          const m = p(x, 1.2, z + 0.35), sc = 560 / (z + 0.35);
          s += pool(m[0], m[1], sc * 0.9, sc * 0.5, i % 3 ? "monitorGlow" : "neonA", 0.65) + R(m[0] - sc * 0.32, m[1] - sc * 0.2, sc * 0.64, sc * 0.38, "inkE", 1);
          const c = p(x, 0.45, z - 0.15), k = 560 / (z - 0.15);
          s += R(c[0] - k * 0.26, c[1] - k * 0.75, k * 0.52, k * 0.78, "chairBlack", k * 0.08) + R(c[0] - k * 0.26, c[1] - k * 0.75, k * 0.52, k * 0.06, "neonB", 1, null, 0, "opacity:0.6");
          if ((i + Math.round(z)) % 3 !== 0) s += E(c[0], c[1] - k * 0.86, k * 0.12, k * 0.14, "hairE") + P("M" + (c[0] - k * 0.14) + " " + (c[1] - k * 0.84) + " Q" + c[0] + " " + (c[1] - k * 1.12) + " " + (c[0] + k * 0.14) + " " + (c[1] - k * 0.84), null, "inkE", Math.max(1, k * 0.03));
        }
        s += q([[-hw + 0.3, 0.75, z + 0.2], [hw - 0.3, 0.75, z + 0.2], [hw - 0.3, 0.75, z + 0.7], [-hw + 0.3, 0.75, z + 0.7]], "inkE", "opacity:0.8");
      }
      return s + vignette(W, H, 0.75);
    },
    // The apartment kitchen: a tiled splashback, upper cabinets and the counter with the rice cooker, a
    // tall fridge, the window over the sink, the dining table under a pendant lamp.
    kitchen(ctx, night) {
      let s = room(W, H, BACK, VP, { night, wall: night ? "nWall" : "kitchenWall", floor: "wood" });
      s += R(400, 60, 340, 66, "bathTile") + P(Array.from({ length: 12 }, (_, i) => "M" + (400 + i * 28) + " 60 L" + (400 + i * 28) + " 126").join(" ") + " M400 82 L740 82 M400 104 L740 104", null, "bathTile2", 0.8);
      s += windowView(520, 64, 110, 56, { season: ctx.season, night, seed: 76, tree: false });
      s += R(400, 22, 340, 38, "cabinet") + R(400, 58, 340, 3, "aoC", 0, null, 0, "opacity:0.25") + [0, 1, 2, 3, 4].map((i) => L(400 + i * 68, 24, 400 + i * 68, 58, "aoC", 0.8, "opacity:0.2") + R(400 + i * 68 + 30, 50, 8, 2, "steel2")).join("");
      s += R(400, 122, 340, 5, "counterTop") + R(400, 127, 340, 73, "cabinet") + R(400, 127, 340, 4, "aoC", 0, null, 0, "opacity:0.15") + [0, 1, 2, 3, 4].map((i) => L(400 + i * 68, 132, 400 + i * 68, 198, "aoC", 0.8, "opacity:0.22") + R(400 + i * 68 + 30, 136, 8, 2, "steel2")).join("");
      s += G(440, 122, R(-16, -22, 32, 22, "riceCooker", 8) + R(-12, -18, 24, 6, "aoC", 3, null, 0, "opacity:0.15") + O(8, -8, 2, "neonA")) + G(690, 122, R(-12, -26, 24, 26, "steel", 2) + R(-14, -28, 28, 4, "steel2")) + R(560, 118, 60, 4, "steel");
      // The fridge: tall, two doors, a magnet or two.
      s += shadow(360, 202, 40, 5) + boxP(326, 200, 70, 170, 0.04, VP, "fridge", "fridge", "fridge2") + L(361, 32, 361, 198, "aoC", 1, "opacity:0.25") + R(352, 90, 3, 30, "steel2") + R(367, 90, 3, 30, "steel2") + R(338, 50, 10, 12, "stickyY") + R(374, 60, 12, 9, "stickyB");
      s += pool(220, 120, 170, 110, "lampWarm", night ? 0.8 : 0.3) + G(220, 0, L(0, 0, 0, 46, "inkE", 1) + P("M-22 62 L22 62 L12 46 L-12 46 Z", "lampShade") + E(0, 62, 18, 3, "lampWarm"));
      s += shadow(220, 238, 150, 9) + boxP(90, 232, 260, 6, 0.1, VP, "woodDesk2", "woodDesk", "woodDesk2") + R(100, 232, 6, 30, "woodDesk2") + R(334, 232, 6, 30, "woodDesk2");
      s += G(150, 222, E(0, 0, 12, 4, "paperE") + E(0, -2, 9, 2.5, "paperE2")) + G(280, 222, E(0, 0, 12, 4, "paperE") + E(0, -2, 9, 2.5, "paperE2")) + G(215, 220, R(-6, -14, 12, 14, "paperE2", 2));
      return s + vignette(W, H, night ? 0.7 : null);
    },
    // An alley: villas with rooftop rooms, a convenience store's lit front, power lines overhead.
    street(ctx) {
      let s = outdoorSky(W, H, { season: ctx.season, seed: 77, tod: ctx.season === "summer" ? "rain" : "day" });
      s += boxP(-20, 196, 330, 150, 0.1, [430, 120], "brick", "concrete", "brick2") + R(40, 30, 80, 16, "roofGreen") + R(50, 20, 40, 14, "bldNear") + R(110, 24, 18, 20, "accentBlue", 2);
      for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) s += R(0 + i * 72, 66 + f * 34, 30, 22, "winDay") + R(0 + i * 72, 86 + f * 34, 34, 3, "concrete2");
      // The convenience store: a lit glass front and a striped signboard.
      s += R(10, 150, 280, 46, "storeGlow", 0, null, 0, "opacity:0.9") + R(10, 136, 280, 14, "signW") + R(10, 140, 280, 3, "neonA") + R(10, 145, 280, 3, "neonB", 0, null, 0, "opacity:0.7");
      for (let i = 0; i < 4; i++) s += R(20 + i * 68, 158, 56, 30, "storeShelf") + L(20 + i * 68, 168, 76 + i * 68, 168, "aoC", 1, "opacity:0.2");
      s += pool(150, 200, 180, 30, "storeGlow", 0.5);
      s += boxP(540, 196, 300, 160, 0.08, [430, 120], "concrete", "concrete2", "concrete2");
      for (let f = 0; f < 4; f++) for (let i = 0; i < 4; i++) s += R(556 + i * 60, 50 + f * 36, 36, 24, "winDay");
      s += R(0, 196, W, 64, "asphalt") + R(0, 196, W, 4, "curb");
      s += L(380, 196, 380, 20, "trunk", 5) + L(360, 30, 400, 30, "trunk", 3) + P("M-10 40 Q190 60 380 34 Q590 56 810 30 M-10 50 Q190 72 380 42 Q590 66 810 42", null, "inkE", 0.9, "opacity:0.5");
      s += particles(ctx.season, 0, 0, W, 200, false, 10, 8);
      return s;
    },
    // Busan's beach: sand, surf, the city along the bay and the bridge.
    beach(ctx) {
      let s = sky(0, 0, W, H, { tod: "day", seed: 77, sunY: 0.2 });
      s += landscape(0, 30, W, 150, { kind: "busan", season: ctx.season, seed: 14, trees: false, horizon: 0.62 });
      s += R(0, 160, W, 30, "seaNear") + P("M0 176 q40 -6 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 L800 200 L0 200 Z", "foam", null, 0, "opacity:0.6") + R(0, 188, W, 72, "sand") + R(0, 188, W, 72, null, 0, null, 0, fill(aoF("u"), "opacity:0.1"));
      return s;
    },
    // Farmland: ridges, terraced fields, greenhouses, a farm road.
    farm(ctx) {
      let s = sky(0, 0, W, H, { tod: ctx.season === "summer" ? "rain" : "day", seed: 78 });
      s += landscape(0, 0, W, 210, { kind: "country", season: ctx.season, seed: 12, trees: false, horizon: 0.6 });
      s += R(0, 196, W, 64, season2(ctx.season, "field")) + P("M360 260 L392 196 L408 196 L460 260 Z", "dirt");
      s += tree(80, 204, ctx.season, 1.0) + tree(720, 206, ctx.season, 1.1);
      return s + particles(ctx.season, 0, 0, W, 210, false, 10, 3);
    },
    bath() {
      let s = R(0, 0, W, H, "bathTile");
      let d = "";
      for (let x = 0; x < W; x += 34) d += "M" + x + " 0 L" + x + " " + H + " ";
      for (let y = 0; y < H; y += 34) d += "M0 " + y + " L" + W + " " + y + " ";
      s += P(d, null, "bathTile2", 1.2) + R(0, 0, W, H, null, 0, null, 0, fill(def("bth", (id) => radial(id, [[0, "hiE", 0.2], [1, "aoC", 0.35]], 0.35, 0.3, 0.9))));
      return s;
    },
  });

  // ---------- event illustrations (600 × 220, floor at 178) ----------
  // The backdrops are the sets, scaled to this frame (the floor lands at 178 and feet at 204), with a
  // light veil over them so the people and props in front stand out.
  const EW = 600, EH = 220, EF = 178, EFEET = 204;
  const fit = (body) => G(-38.5, 0, body, 0.846) + R(0, 0, EW, EH, "bgVeil", 0, null, 0, "opacity:var(--a-veilOp)");
  const BACKDROPS = {
    nursery: (ctx) => fit(SETS.nursery(ctx)),
    room: (ctx, night) => fit(SETS.bedroom(ctx, night)),
    class: (ctx) => fit(SETS.classroom(ctx)),
    field: (ctx) => fit(SETS.field(ctx)),
    hall: (ctx) => fit(SETS.hallway(ctx)),
    city: (ctx) => fit(SETS.city(ctx)),
    hospital: (ctx) => fit(SETS.hospital(ctx)),
    pcbang: (ctx) => fit(SETS.pcbang(ctx)),
    kitchen: (ctx, night) => fit(SETS.kitchen(ctx, night)),
    street: (ctx) => fit(SETS.street(ctx)),
    cubicle: (ctx) => fit(SETS.cubicle(ctx)),
    beach: (ctx) => fit(SETS.beach(ctx)),
    farm: (ctx) => fit(SETS.farm(ctx)),
    bath: (ctx) => fit(SETS.bath(ctx)),
    campus: (ctx) => fit(SETS.campus(ctx)),
  };

  // 돌잡이 items, drawn standing on a table top at y ≈ 170 around x (shared by the event art and the
  // first-birthday cutscene).
  const DOL_ITEMS = {
    pencil: (x) => R(x - 2.5, 140, 5, 28, "stickyY", 1) + P("M" + (x - 2.5) + " 140 L" + x + " 132 L" + (x + 2.5) + " 140 Z", "woodLight"),
    book: (x) => R(x - 13, 150, 26, 18, "accentBlue", 1.5) + R(x - 11, 152, 22, 2, "paperE", 1),
    mouse: (x) => E(x, 160, 9, 12, "paperE") + E(x - 3, 156, 3, 5, "hiE", null, 0, "opacity:0.4") + L(x, 148, x, 155, "steel2", 1.2),
    stethoscope: (x) => P("M" + (x - 10) + " 146 Q" + (x - 12) + " 166 " + x + " 166 Q" + (x + 12) + " 166 " + (x + 10) + " 146", null, "inkE", 2.2) + O(x, 166, 4.5, "steel"),
    mic: (x) => R(x - 2.5, 150, 5, 18, "inkE", 2) + O(x, 147, 6.5, "steel"),
    gavel: (x) => R(x - 13, 149, 26, 9, "woodDark", 3) + R(x - 2, 156, 4, 14, "woodLight2", 1),
    ball: (x) => O(x, 158, 10, "accentRed") + P("M" + (x - 10) + " 158 Q" + x + " 151 " + (x + 10) + " 158", null, "paperE", 1.2) + O(x - 3, 154, 3, "hiE", null, 0, "opacity:0.3"),
    thread: (x) => R(x - 8, 150, 16, 18, "paperE", 2) + L(x - 8, 155, x + 8, 155, "accentRed", 2) + L(x - 8, 161, x + 8, 161, "accentRed", 2),
    money: (x) => R(x - 14, 154, 28, 13, "bill", 1.5) + R(x - 10, 150, 28, 13, "bill", 1.5) + O(x + 4, 156.5, 3, "bill2"),
    brush: (x) => R(x - 2, 140, 4, 24, "woodLight2", 1) + P("M" + (x - 4) + " 164 L" + (x + 4) + " 164 L" + x + " 174 Z", "inkE"),
  };
  // A glint of light (where the old art had cartoon sparkles), and a small, muted heart.
  function sparkle(x, y, s) {
    return G(x, y, A("twinkle", O(0, 0, 9, null, null, 0, fill(glowF("hiE"), "opacity:0.6")) + P("M0 -7 L1 -1 L7 0 L1 1 L0 7 L-1 1 L-7 0 L-1 -1 Z", "hiE", null, 0, "opacity:0.9")), s || 1);
  }
  function heart(x, y, s, tok, del) {
    return G(x, y, A("rise", P("M0 4 C-8 -2 -6 -10 0 -6 C6 -10 8 -2 0 4 Z", "heartE", null, 0, "opacity:0.75"), "--del:" + (del || 0) + "s"), (s || 1) * 0.8);
  }
  // Rain streaking across the whole frame, and a gloom that settles over it.
  const gloom = (op) => R(0, 0, EW + 80, EH, null, 0, null, 0, fill(def("glm", (id) => lin(id, [[0, "aoC", 0.45], [1, "aoC", 0.1]])), "opacity:" + (op || 0.8)));
  function rain(w, h, n, seed) {
    const r = rand(seed || 5);
    let s = "";
    for (let i = 0; i < n; i++) { const y = r() * h; s += G((r() * (w + 60)).toFixed(0), y.toFixed(0), A("fall rain", L(0, 0, -4, 16, "rainE", 1.1, "opacity:0.5"), "--d:" + (0.5 + r() * 0.4).toFixed(2) + "s;--del:-" + r().toFixed(2) + "s;--dx:-14px;--fy:" + (h + 20 - y).toFixed(0) + "px")); }
    return s;
  }
  // Light motes drifting: what the old sparkles became.
  function motes(x, y, w, h, n, seed) {
    const r = rand(seed || 2);
    let s = "";
    for (let i = 0; i < n; i++) s += O((x + r() * w).toFixed(0), (y + r() * h).toFixed(0), (2 + r() * 5).toFixed(1), null, null, 0, fill(glowF("lampWarm"), "opacity:" + (0.3 + r() * 0.5).toFixed(2)));
    return A("drift slow", s);
  }

  // Foreground pieces per event. Each returns SVG drawn over the backdrop; v is the outcome suffix
  // (r0a, r1 ...) when the art illustrates a result rather than the question.
  const FX = {
    // 돌잡이: a low lacquered table laid with objects; the grabbed one (the outcome's suffix) catches the light.
    doljabi: (v) => {
      const ids = Object.keys(DOL_ITEMS);
      let s = shadow(445, 200, 160, 8) + R(296, 160, 298, 10, "lacquer", 2) + R(296, 160, 298, 3, "hiE", 0, null, 0, "opacity:0.15") + R(310, 170, 10, 30, "lacquer2", 1) + R(570, 170, 10, 30, "lacquer2", 1) + R(300, 156, 290, 5, "silk", 1);
      ids.forEach((id, i) => {
        const x = 320 + i * 28;
        if (v === id || (v === "two" && (i === 1 || i === 6))) s += pool(x, 150, 26, 26, "lampWarm", 0.8) + sparkle(x + 8, 128, 0.7);
        s += DOL_ITEMS[id](x);
      });
      return s;
    },
    mobile: () => G(440, 20, A("sway", L(0, 0, 0, 20, "steel2", 1.2) + L(-50, 20, 50, 20, "steel2", 1.6) + O(-50, 40, 8, "matC") + P("M0 36 l8 14 l-16 0 Z", "matB") + E(50, 40, 9, 6, "matA") +
      L(-50, 20, -50, 32, "steel2", 0.8) + L(0, 20, 0, 36, "steel2", 0.8) + L(50, 20, 50, 34, "steel2", 0.8))) + pool(440, 60, 120, 60, "sunLight", 0.25),
    cracks: () => A("shake", P("M380 20 L392 50 L380 70 L398 100 L386 128", null, "inkE", 2) + P("M120 30 L132 56 L122 76 L136 104", null, "inkE", 1.6)) + G(450, 20, A("sway", L(0, 0, 0, 30, "steel2", 1) + P("M-14 30 L14 30 L10 42 L-10 42 Z", "lampShade"))) +
      R(330, 168, 10, 6, "concrete", 1) + R(352, 172, 8, 5, "concrete", 1) + R(110, 170, 9, 6, "concrete", 1) + G(0, 0, rain(EW, 120, 6, 3).replace(/rainE/g, "concrete"), 1, "", "opacity:0.6"),
    bus: () => G(420, 168, shadow(10, 4, 90, 8) + R(-70, -54, 160, 54, "busE", 6) + R(-70, -20, 160, 10, "busE2") + [-62, -30, 2, 34].map((x) => R(x, -48, 28, 20, "winDay", 2)).join("") + R(66, -48, 20, 34, "winDay", 2) +
      O(-40, 2, 11, "inkE") + O(56, 2, 11, "inkE") + O(-40, 2, 4, "steel") + O(56, 2, 4, "steel") + O(88, -10, 3, "lampWarm")),
    finish: () => L(470, 120, 470, 204, "steel2", 3) + L(580, 120, 580, 204, "steel2", 3) + A("sway", P("M470 140 Q525 150 580 140", null, "paperE", 3)) + flags(20, 660, 26, 2) +
      G(300, EFEET, avatar({ age: "child", outfit: "kid", look: { hair: 3, shirt: 1, sex: "f" }, mood: "happy" }), 0.85),
    // The bookworm: a tower of novels, a reading light, the story drifting up as motes.
    dragon: () => stack(470, 176, 9, 1.6, 5) + G(520, 176, R(-16, -20, 32, 20, "fabric2", 2) + R(-14, -18, 28, 2, "paperE")) + motes(360, 30, 220, 110, 10, 4) + pool(470, 120, 140, 80, "lampWarm", 0.45),
    mathsyms: (v) => G(0, 0, R(200, 30, 210, 100, "boardE", 2) + R(200, 30, 210, 100, "hiE", 0, null, 0, "opacity:0.05"), 1) + T(250, 70, "π", "chalkE", 30) + T(300, 104, "√x", "chalkE", 22) + T(360, 72, "∑", "chalkE", 28) + T(340, 116, "x²", "chalkE", 18) +
      (v === "r0a" ? G(470, 120, A("bounce", R(-7, -46, 14, 32, "accentBlue", 1) + R(-7, -46, 4, 32, "accentRed", 0) + O(0, -8, 17, "brass") + O(0, -8, 11, "brass2") + O(-5, -13, 5, "hiE", null, 0, "opacity:0.5"))) + sparkle(430, 60) + sparkle(520, 80, 0.8) :
        v === "r0b" ? G(470, 150, R(-30, -40, 60, 44, "paperE", 1) + L(-20, -28, 20, -28, "inkE", 1, "opacity:0.4") + L(-20, -18, 10, -18, "inkE", 1, "opacity:0.4") + P("M-12 -6 L12 -6", null, "accentRed", 2.5)) :
        G(470, 140, R(-36, -50, 72, 54, "paperE", 1) + L(-26, -36, 20, -36, "inkE", 1, "opacity:0.4") + L(-26, -26, 10, -26, "inkE", 1, "opacity:0.4") + T(0, -6, "?", "accentBlue", 22))),
    bigphone: () => pool(440, 118, 120, 120, "monitorGlow", 0.5) + G(440, 118, A("float", R(-44, -82, 88, 160, "inkE", 12) + R(-38, -72, 76, 134, "phoneScreen", 5) +
      (function () { let s = ""; const cs = ["fabric1", "neonA", "fabric4", "neonC", "accentBlue", "fabric3"]; for (let i = 0; i < 9; i++) s += R(-30 + (i % 3) * 22, -62 + Math.floor(i / 3) * 22, 16, 16, cs[i % 6], 4); return s; })() +
      R(-28, 20, 56, 26, "paperE", 5, null, 0, "opacity:0.7"))),
    // Older students blocking the corridor: dark silhouettes and their long shadows.
    looming: () => G(0, 0, gloom(0.5)) + [[380, 1.05], [450, 1.15], [520, 1]].map(([x, sc]) => G(x, EFEET, E(0, 0, 30, 6, "aoC", null, 0, "opacity:0.4") + P("M-24 0 L-22 -70 Q-26 -96 0 -100 Q26 -96 22 -70 L24 0 Z", "silhouette") + O(0, -114, 15, "silhouette"), sc)).join(""),
    podium: (v) => G(440, EFEET, shadow(0, 0, 50, 6) + boxP(-40, 0, 80, 70, 0.1, [300 - 440, -120], "woodDesk", "woodDesk2", "woodDesk2") + R(-30, -60, 60, 3, "brass") + L(10, -70, 20, -96, "inkE", 2) + O(20, -98, 4, "inkE")) +
      G(540, 178, R(-24, -36, 48, 36, "paperE", 2) + R(-12, -38, 24, 4, "inkE") + R(-4, -28, 8, 14, "aoC", 0, null, 0, "opacity:0.4")) + (v === "r0a" ? motes(160, 20, 300, 80, 10, 7) : ""),
    doctor: () => G(440, EFEET, avatar({ age: "adult", outfit: "casual", gear: "coat", look: { hair: 1, shirt: 3, sex: "m", glasses: true, lid: true }, mood: "happy" })),
    door: () => shadow(475, 180, 70, 6) + R(414, 30, 122, 150, "doorFrame") + R(420, 34, 110, 146, "doorE2") + R(420, 34, 4, 146, "hiE", 0, null, 0, "opacity:0.15") + R(510, 104, 14, 5, "brass", 2) +
      G(475, 80, O(0, 0, 20, "paperE") + O(0, 0, 20, null, "accentRed", 4) + L(-14, 14, 14, -14, "accentRed", 4)) + A("shake", P("M540 40 q10 10 0 20 M548 34 q16 16 0 32", null, "inkE", 1.4, "opacity:0.4")),
    monitors: () => G(120, 196, shadow(0, 2, 26, 4) + R(-18, -26, 36, 26, "cupNoodle", 3) + R(-18, -26, 36, 8, "accentRed", 2) + E(0, -26, 18, 4, "paperE2") + G(0, -30, A("rise", P("M-6 0 q-4 -6 0 -12 M6 0 q4 -6 0 -12", null, "steamE", 1.6)))) + G(156, 196, R(-6, -30, 12, 30, "neonA", 3, null, 0, "opacity:0.8")),
    // Sick in bed: the duvet, a thermometer and pills on the night table, a humidifier's mist.
    bed: (v, id) => shadow(440, 182, 150, 8) + boxP(300, 180, 280, 34, 0.1, [300, 90], "beddingE2", "beddingE", "beddingE2") + R(306, 128, 60, 22, "paperE", 8) + R(360, 134, 216, 30, "duvet", 8) + R(360, 134, 216, 6, "hiE", 3, null, 0, "opacity:0.2") +
      G(560, 140, boxP(-18, 40, 36, 40, 0.06, [-260, -50], "woodDesk", "woodDesk2", "woodDesk2") + R(-10, -8, 6, 8, "paperE", 1) + R(0, -10, 8, 10, "accentRed", 2, null, 0, "opacity:0.7") + L(-14, -2, 6, -6, "steel", 1.5)) +
      G(250, 176, R(-12, -30, 24, 30, "paperE", 8) + G(0, -34, A("rise", E(0, 0, 8, 5, "steamE", null, 0, "opacity:0.6")))) + (id === "flu" ? G(330, 118, R(-14, -6, 28, 10, "towel", 4)) : ""),
    laptop: () => pool(450, 120, 130, 80, "monitorGlow", 0.5) + G(450, 176, P("M-70 0 L-58 -86 L58 -86 L70 0 Z", "inkE") + R(-52, -80, 104, 68, "phoneScreen", 2) + G(0, -50, O(0, -6, 10, "fabric2") + R(-14, 4, 28, 18, "uniformE", 6)) + R(-36, -26, 30, 3, "paperE", 0, null, 0, "opacity:0.6") + R(-90, 0, 180, 7, "steel", 2)),
    mom: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 0, sex: "f" }, mood: "grumpy", pose: "hold" }), 1.05) + G(560, 150, R(-16, -14, 32, 16, "inkE", 3) + L(-10, -14, -14, -28, "inkE", 1.5) + L(10, -14, 14, -28, "inkE", 1.5) + O(8, -6, 1.6, "neonA")),
    hearts: () => G(450, 120, A("float", R(-24, -16, 48, 32, "paperE", 1) + P("M-24 -16 L0 4 L24 -16", null, "paperE2", 1) + P("M0 6 C-6 1 -4 -5 0 -2 C4 -5 6 1 0 6 Z", "heartE")), 1.4) + G(560, 168, R(-9, -26, 18, 28, "fabric4", 3) + R(-9, -20, 18, 5, "paperE", 0, null, 0, "opacity:0.6")) +
      heart(390, 80, 1.2, 0, -0.5) + heart(530, 64, 1, 0, -2),
    chat: () => G(440, 110, R(-80, -70, 150, 28, "bubbleE", 12) + R(-50, -32, 130, 28, "bubbleMe", 12) + T(30, -12, "100", "inkE", 15) + R(-80, 6, 104, 28, "bubbleE", 12) + L(-70, -56, -10, -56, "inkE", 2, "opacity:0.3") + L(-70, 20, -20, 20, "inkE", 2, "opacity:0.3")),
    // A bad stretch: rain streaking over everything, the room gone grey, crumpled pages on the floor.
    raincloud: () => gloom() + rain(EW, EH, 36, 9) + [[420, 192], [470, 198], [520, 188]].map(([x, y]) => G(x, y, P("M-7 0 L-5 -7 L1 -9 L7 -4 L6 3 L-1 5 Z", "paperE") + L(-4, -4, 3, 1, "aoC", 0.8, "opacity:0.3"))).join(""),
    candle: () => gloom(0.9) + pool(440, 120, 110, 90, "candle", 0.9) + G(440, 170, R(-12, -40, 24, 40, "paperE", 2) + R(-12, -40, 7, 40, "hiE", 0, null, 0, "opacity:0.2") + L(0, -40, 0, -46, "inkE", 1.5) + G(0, -50, A("flicker", P("M0 4 Q-5 -4 0 -14 Q5 -4 0 4 Z", "candle")))),
    notes: () => G(470, 130, A("float", R(-60, -40, 120, 80, "paperE", 2) + L(0, -40, 0, 40, "paperE2", 1.5) + L(-50, -24, -10, -24, "stickyY", 5, "opacity:0.8") + L(-50, -10, -16, -10, "inkE", 1, "opacity:0.4") +
      L(-50, 4, -6, 4, "stickyB", 5, "opacity:0.7") + L(10, -24, 50, -24, "inkE", 1, "opacity:0.4") + L(10, -10, 44, -10, "stickyP", 5, "opacity:0.6") + L(10, 4, 50, 4, "inkE", 1, "opacity:0.4") + L(-50, 18, -20, 18, "inkE", 1, "opacity:0.4"))) + pool(470, 130, 120, 70, "sunLight", 0.3),
    shop: () => G(160, 34, A("drift", T(0, 0, "₩", "brass", 26)), 1) + G(230, 60, A("fall", O(0, 0, 7, "brass") + O(-2, -2, 3, "hiE", null, 0, "opacity:0.4"), "--d:3s;--dx:0px;--fy:120px")) + G(110, 50, A("fall", O(0, 0, 6, "brass") + O(-2, -2, 2.5, "hiE", null, 0, "opacity:0.4"), "--d:3.6s;--del:-1s;--dx:6px;--fy:130px")),
    grandma: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 2, grey: true, sex: "f" }, mood: "happy", prop: "envelope", pose: "hold" }), 0.95) + pool(470, 100, 110, 90, "lampWarm", 0.4),
    // Insomnia: 3 a.m. on the clock, the phone's light on the ceiling.
    sheep: () => gloom(0.7) + clock(470, 60, 20, 3) + pool(420, 30, 120, 30, "monitorGlow", 0.6) + G(400, 172, R(-10, -3, 20, 4, "inkE", 1) + R(-9, -3, 18, 1.4, "monitorGlow")) + motes(380, 80, 200, 80, 5, 9),
    stall: () => flags(0, 680, 22, 3) + G(460, 176, shadow(0, 2, 100, 6) + R(-90, -56, 180, 56, "stallE", 2) + R(-100, -100, 200, 16, "awning", 2) + [0, 1, 2, 3, 4, 5, 6].map((i) => R(-100 + i * 29, -100, 14, 16, "paperE", 0, null, 0, "opacity:0.7")).join("") + R(-90, -84, 4, 28, "steel2") + R(86, -84, 4, 28, "steel2") +
      E(-30, -60, 30, 8, "inkE") + E(-30, -63, 24, 5, "tteok") + G(-30, -72, A("rise", P("M-6 0 q-4 -6 0 -12 M6 0 q4 -6 0 -12", null, "steamE", 1.6))) + R(20, -70, 50, 12, "paperE", 2)),
    banner: () => G(300, 26, A("sway-slow", R(-110, 0, 220, 52, "bannerE", 1) + R(-110, 0, 220, 6, "aoC", 0, null, 0, "opacity:0.2") + T(0, 38, "D-100", "paperE", 32))) + L(190, 26, 410, 26, "steel2", 1.4) + R(500, 120, 60, 58, "woodDesk", 2),
    polaroids: () => G(470, 100, R(-50, -46, 60, 70, "paperE", 1) + R(-44, -40, 48, 46, "skyMid") + O(-28, -14, 7, "fabric2") + O(-12, -16, 7, "fabric2") + R(-36, -8, 30, 14, "fabric1", 4)) +
      G(520, 120, R(-30, -40, 60, 70, "paperE", 1) + R(-24, -34, 48, 46, "blossomE") + O(-8, -8, 7, "fabric2") + O(8, -10, 7, "fabric2")) + G(400, 170, P("M-14 0 L0 -24 L14 0 Z", "paperE") + R(-10, -10, 20, 10, "inkE")),
    toilet: () => G(460, 178, shadow(0, 0, 50, 5) + E(0, -34, 48, 13, "porcelain") + E(0, -34, 38, 8, "rainE") + P("M-44 -30 Q-40 0 -20 0 L20 0 Q40 0 44 -30", "porcelain") + R(-38, -108, 76, 60, "porcelain", 6) + R(-38, -108, 14, 60, "hiE", 4, null, 0, "opacity:0.25") +
      G(0, -48, A("bounce", R(-6, -14, 12, 22, "inkE", 3) + R(-4, -12, 8, 15, "phoneScreen", 1)))) + G(430, 112, A("rise", O(0, 0, 3, "rainE") + O(50, -6, 2.5, "rainE") + O(24, -14, 3, "rainE"))),
    planner: () => G(470, 120, R(-70, -50, 140, 100, "paperE", 2) + (function () { let s = ""; for (let i = 0; i < 6; i++) s += L(-60, -32 + i * 14, 60, -32 + i * 14, "paperE2", 1); for (let i = 0; i < 4; i++) s += L(-60 + i * 40, -40, -60 + i * 40, 40, "paperE2", 1); return s; })() +
      R(-58, -30, 36, 10, "stickyB", 1, null, 0, "opacity:0.8") + R(-18, -16, 36, 10, "stickyP", 1, null, 0, "opacity:0.8") + R(22, -2, 36, 10, "stickyY", 1, null, 0, "opacity:0.8") + R(-58, 12, 36, 10, "matB", 1, null, 0, "opacity:0.8")),
    trip: () => G(480, 176, shadow(0, 4, 100, 8) + R(-90, -72, 180, 66, "busTour", 8) + R(-90, -36, 180, 8, "accentBlue", 0, null, 0, "opacity:0.6") + R(-80, -64, 44, 22, "winDay", 2) + R(-30, -64, 44, 22, "winDay", 2) + R(20, -64, 44, 22, "winDay", 2) + R(70, -64, 14, 40, "winDay", 2) +
      O(-56, -6, 12, "inkE") + O(56, -6, 12, "inkE") + O(-56, -6, 4, "steel") + O(56, -6, 4, "steel")),
    // A pendant lamp clicks on over the desk.
    bulb: () => pool(300, 90, 160, 110, "lampWarm", 0.7) + G(300, 0, L(0, 0, 0, 40, "inkE", 1.2) + P("M-22 60 L22 60 L14 40 L-14 40 Z", "lampShade") + E(0, 60, 22, 4, "lampWarm") + P("M-22 62 L-70 170 L70 170 L22 62 Z", "lampWarm", null, 0, "opacity:0.12")) + motes(240, 80, 120, 80, 6, 3),
    examEve: () => gloom(0.6) + pool(480, 120, 110, 70, "lampWarm", 0.6) + G(470, 176, R(-60, -60, 100, 60, "fabric1", 10) + R(-50, -54, 80, 14, "aoC", 6, null, 0, "opacity:0.2")) + clock(540, 70, 18, 10) +
      G(400, 170, R(-20, -10, 40, 26, "paperE", 1) + R(-16, -6, 10, 12, "fabric2") + L(-2, -2, 14, -2, "inkE", 1, "opacity:0.4") + L(-2, 4, 14, 4, "inkE", 1, "opacity:0.4")) + G(560, 166, O(0, 0, 9, "paperE") + O(0, 0, 9, null, "inkE", 2)),
    lunchbox: () => G(450, 170, shadow(0, 2, 80, 6) + R(-80, -46, 120, 46, "fabric1", 5) + R(-74, -40, 52, 34, "paperE", 3) + R(-16, -40, 50, 16, "kimchi", 2) + R(-16, -20, 24, 14, "matB", 2) + O(20, -12, 7, "stickyY") +
      R(56, -86, 32, 86, "steel", 7) + R(56, -86, 10, 86, "hiE", 5, null, 0, "opacity:0.25") + R(56, -90, 32, 12, "inkE", 5)) + G(520, 70, A("rise", P("M0 0 q-6 -8 0 -16 q6 -8 0 -16", null, "steamE", 1.6))),
    counsel: () => G(500, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 1, shirt: 3, sex: "m", glasses: true }, mood: "ok", pose: "hold", prop: "book" }), 0.95),
    // People: a birthday cake, a block tower, a cheering sign at the exam gate.
    cake: () => pool(470, 120, 110, 80, "candle", 0.6) + G(470, 176, shadow(0, 2, 60, 5) + R(-50, -40, 100, 40, "paperE", 5) + R(-50, -40, 100, 8, "blossomE", 3) + R(-40, -64, 80, 24, "paperE", 5) + R(-40, -64, 80, 6, "stickyP", 3) +
      [-24, -8, 8, 24].map((x) => R(x - 1.5, -78, 3, 14, "stickyB", 1) + G(x, -82, A("flicker", P("M0 0 Q-3 -5 0 -10 Q3 -5 0 0 Z", "candle")))).join("")) + flags(20, 660, 24, 4),
    tower: () => toyBlocks(470, EF) + G(470, EF - 44, toyBlocks(0, 0)),
    cheer: () => G(470, 112, A("sway", R(-50, -30, 100, 56, "paperE", 2) + R(-50, -30, 100, 10, "accentRed", 1, null, 0, "opacity:0.8") + L(-30, 0, 30, 0, "inkE", 3, "opacity:0.7") + L(-24, 12, 24, 12, "inkE", 3, "opacity:0.5") + L(-44, 26, -44, 70, "woodLight2", 3) + L(44, 26, 44, 70, "woodLight2", 3))) +
      G(400, 140, A("bounce", R(-12, -16, 24, 30, "thermos", 4))) + G(560, 140, A("bounce", R(-10, -12, 20, 24, "paperE", 3) + R(-10, -12, 20, 6, "accentRed"), "--del:-0.4s")),
    sparkles: () => motes(330, 30, 260, 130, 12, 5),
  };
  // Toy blocks (wooden, muted), and a string of the little flags of every nation at a sports day.
  function toyBlocks(x, y) {
    return shadow(x, y, 40, 4) + boxP(x - 30, y, 22, 22, 0.08, [x + 200, y - 120], "matA", "hiE", "matA") + boxP(x - 6, y, 22, 22, 0.08, [x + 200, y - 120], "matB", "hiE", "matB") + boxP(x - 18, y - 22, 22, 22, 0.08, [x + 200, y - 120], "matC", "hiE", "matC") + O(x + 36, y - 9, 9, "fabric1");
  }
  function flags(x1, x2, y, seed) {
    let s = P("M" + x1 + " " + y + " Q" + (x1 + x2) / 2 + " " + (y + 16) + " " + x2 + " " + y, null, "inkE", 0.8, "opacity:0.6");
    const n = Math.floor((x2 - x1) / 22);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, px = x1 + (x2 - x1) * t, py = y + 16 * 4 * t * (1 - t) * 0.5 + 1;
      s += R((px - 6).toFixed(1), py.toFixed(1), 12, 8, ["paperE", "fabric1", "accentRed", "fabric3", "stickyY", "fabric4"][(i + (seed || 0)) % 6], 0, null, 0, "opacity:0.85");
    }
    return A("sway-slow", s);
  }
  const bunting = flags;

  // Event id → backdrop, foreground and how you look in it. Unknown ids fall back by prefix, then by
  // keyword, then by life stage, so new events (e.g. a longer bullying storyline) still get a picture.
  const EVENT_ART = {
    sportsday: { bg: "field", fx: "finish", pose: "cheer", prop: "baton", mood: "happy", icon: "🏃" },
    bookworm: { bg: "room", night: true, fx: "dragon", pose: "hold", prop: "book", mood: "happy", icon: "📚" },
    olympiad: { bg: "class", fx: "mathsyms", icon: "🏅", res: { r0a: { prop: "medal", mood: "happy", pose: "cheer" }, r0b: { mood: "tired" } } },
    smartphone: { bg: "room", fx: "bigphone", mood: "happy", icon: "📱" },
    daechi: { bg: "city", fx: "sparkles", icon: "🏙️" },
    bully: { bg: "hall", fx: "looming", mood: "stressed", x: 220, icon: "😣", res: { r0: { mood: "ok" }, r1a: { mood: "happy" }, r1b: { mood: "sick" } } },
    president: { bg: "class", fx: "podium", pose: "wave", icon: "🗳️", res: { r0a: { pose: "cheer", mood: "happy" }, r0b: { mood: "tired", pose: "stand" } } },
    career: { bg: "hospital", fx: "doctor", mood: "happy", icon: "🩺" },
    jung2: { bg: "room", fx: "door", mood: "grumpy", prop: "headphones", icon: "🎧", res: { r1: { mood: "ok", prop: null } } },
    pcbang: { bg: "pcbang", fx: "monitors", mood: "happy", prop: "headphones", icon: "🎮" },
    cold: { bg: "room", fx: "bed", mood: "sick", prop: "mask", icon: "🤧" },
    flu: { bg: "room", fx: "bed", mood: "sick", prop: "mask", icon: "🤒" },
    star: { bg: "room", night: true, fx: "laptop", icon: "⭐" },
    nag: { bg: "kitchen", fx: "mom", mood: "stressed", prop: "phone", x: 200, icon: "📵" },
    crush: { bg: "class", fx: "hearts", mood: "happy", icon: "💌" },
    rival: { bg: "room", fx: "chat", mood: "grumpy", icon: "🔥" },
    slump: { bg: "room", night: true, fx: "raincloud", mood: "tired", icon: "🌧️", res: { r0: { mood: "happy" } } },
    burnout: { bg: "room", night: true, fx: "candle", mood: "tired", icon: "🕯️" },
    notes: { bg: "class", fx: "notes", mood: "happy", icon: "📒" },
    "family-money": { bg: "street", fx: "shop", mood: "stressed", x: 420, icon: "💸" },
    grandma: { bg: "kitchen", fx: "grandma", mood: "happy", x: 220, icon: "🧧" },
    insomnia: { bg: "room", night: true, fx: "sheep", mood: "tired", icon: "🐑" },
    festival: { bg: "field", fx: "stall", mood: "happy", pose: "wave", icon: "🎪" },
    d100: { bg: "class", fx: "banner", mood: "stressed", x: 160, icon: "⏳" },
    "retaker-doubt": { bg: "cubicle", fx: "polaroids", mood: "tired", prop: "phone", pose: "hold", x: 160, icon: "📸" },
    "phone-broke": { bg: "bath", fx: "toilet", mood: "stressed", icon: "🚽" },
    mentor: { bg: "class", fx: "planner", mood: "ok", icon: "🗓️" },
    // Parents' jobs.
    momwork: { bg: "city", fx: "sparkles", mood: "happy", icon: "💼" },
    "job-shop": { bg: "street", fx: "shop", mood: "ok", x: 420, icon: "🍗" },
    "job-teacher": { bg: "room", fx: "notes", mood: "tired", icon: "🖍️" },
    "job-doctor": { bg: "hospital", fx: "doctor", mood: "ok", icon: "🩺" },
    "job-shift": { bg: "kitchen", night: true, fx: "candle", mood: "ok", icon: "🌙" },
    "job-farm": { bg: "field", fx: "sparkles", mood: "happy", icon: "🌾" },
    "job-overtime": { bg: "class", fx: "podium", mood: "stressed", icon: "🎭" },
    // Growing up in a children's home.
    "care-tutor": { bg: "room", fx: "mathsyms", mood: "happy", prop: "book", pose: "hold", icon: "✏️" },
    "care-sponsor": { bg: "room", fx: "grandma", mood: "happy", x: 220, icon: "✉️" },
    "care-found": { bg: "hall", fx: "looming", mood: "stressed", x: 220, icon: "🏠" },
    careleave: { bg: "city", fx: "sparkles", mood: "ok", icon: "🧳", res: { r1: { mood: "happy" } } },
    careend: { bg: "city", fx: "sparkles", mood: "ok", icon: "🧳" },
    campus: { bg: "campus", fx: "trip", mood: "happy", icon: "🚌" },
    insight: { bg: "room", fx: "bulb", mood: "happy", x: 300, icon: "💡" },
    eve: { bg: "room", night: true, fx: "examEve", mood: "stressed", icon: "🌙" },
    lunch: { bg: "kitchen", fx: "lunchbox", mood: "ok", icon: "🍱" },
    quake: { bg: "class", fx: "cracks", mood: "stressed", icon: "⚠️" },
    typhoon: { bg: "room", night: true, fx: "raincloud", mood: "ok", icon: "🌀" },
    // Every entry needs an fx: eventArt draws FX[spec.fx] unconditionally (these two had none and threw).
    beach: { bg: "beach", fx: "sparkles", mood: "happy", pose: "wave", icon: "🏖️" },
    country: { bg: "farm", fx: "sparkles", mood: "happy", icon: "🌾" },
    ahead: { bg: "class", fx: "mathsyms", mood: "stressed", icon: "📐", res: { r1: { mood: "ok" } } },
    commute: { bg: "farm", fx: "bus", mood: "tired", x: 220, icon: "🚌", res: { r1: { mood: "ok" } } },
    "quota-news": { bg: "hospital", fx: "doctor", mood: "happy", icon: "📰" },
    "med-move": { bg: "city", fx: "sparkles", icon: "📦", res: { r1: { mood: "ok" } } },
    // Schools: the choice screen (and its result), then the events at special schools.
    school: { bg: "class", fx: "notes", mood: "ok", icon: "🏫", res: { in: { mood: "happy", pose: "cheer" }, out: { mood: "tired" }, def: { mood: "ok" } } },
    dorm: { bg: "room", night: true, fx: "sheep", mood: "tired", icon: "🛏️", res: { r1: { mood: "ok" } } },
    rne: { bg: "class", fx: "mathsyms", mood: "happy", icon: "🔬", res: { r1: { mood: "ok" } } },
    recital: { bg: "field", fx: "podium", mood: "happy", pose: "cheer", icon: "🎻", res: { r1: { mood: "ok", pose: null } } },
    intern: { bg: "street", fx: "shop", mood: "happy", x: 420, icon: "🔧" },
    rankshock: { bg: "class", fx: "raincloud", mood: "stressed", icon: "📉" },
    immersion: { bg: "class", fx: "chat", mood: "happy", icon: "🗣️" },
    // Luck: the 사주 reading, the family's fortunes, accidents and lucky breaks, and exam-day luck.
    saju: { bg: "room", night: true, fx: "candle", mood: "ok", icon: "🔮", res: { great: { mood: "happy" }, good: { mood: "happy" }, mixed: { mood: "tired" }, rough: { mood: "stressed" } } },
    promotion: { bg: "kitchen", fx: "sparkles", mood: "happy", icon: "📈" },
    jackpot: { bg: "street", fx: "shop", mood: "happy", pose: "cheer", x: 420, icon: "🎰" },
    layoff: { bg: "kitchen", fx: "raincloud", mood: "stressed", icon: "📉" },
    jeonse: { bg: "city", fx: "raincloud", mood: "stressed", icon: "🏚️" },
    parentill: { bg: "hospital", fx: "bed", mood: "tired", icon: "🏥" },
    accident: { bg: "street", fx: "cracks", mood: "sick", x: 420, icon: "🚑" },
    hospital: { bg: "hospital", fx: "bed", mood: "sick", prop: "mask", icon: "🏥" },
    greatteacher: { bg: "class", fx: "counsel", mood: "happy", icon: "🍎" },
    spark: { bg: "room", fx: "bulb", mood: "happy", icon: "✨" },
    bloom: { bg: "room", fx: "sparkles", mood: "ok", icon: "🌱", res: { up: { mood: "happy" }, down: { mood: "tired" } } },
    examluck: { bg: "class", fx: "notes", mood: "ok", icon: "🍀", res: { sniffler: { mood: "stressed" }, guess: { mood: "happy" }, drilled: { mood: "happy", pose: "cheer" }, omr: { mood: "stressed" }, calm: { mood: "happy" } } },
    // Family: a divorce, and losing a parent.
    divorce: { bg: "kitchen", fx: "raincloud", mood: "stressed", x: 200, icon: "💔" },
    bereaved: { bg: "room", night: true, fx: "candle", mood: "tired", icon: "🕯️" },
    // Early childhood. The two trait reveals, then the early-years events.
    newborn: { bg: "nursery", fx: "mobile", mood: "happy", x: 200, icon: "👶" },
    doljabi: { bg: "nursery", fx: "doljabi", mood: "happy", pose: "cheer", x: 200, icon: "🎂" },
    firstword: { bg: "nursery", fx: "hearts", mood: "happy", icon: "🗣️" },
    firststeps: { bg: "nursery", fx: "sparkles", mood: "happy", pose: "cheer", icon: "👣" },
    daycarecold: { bg: "room", fx: "bed", mood: "sick", prop: "mask", icon: "🤧" },
    bump: { bg: "field", fx: "sparkles", mood: "sick", icon: "🩹" },
    sibling: { bg: "nursery", fx: "mobile", mood: "grumpy", icon: "🍼" },
    grandstory: { bg: "room", night: true, fx: "grandma", mood: "happy", x: 220, icon: "👵" },
    hangul: { bg: "nursery", fx: "notes", mood: "ok", icon: "🔤", res: { r1: { mood: "happy" } } },
    kinderplay: { bg: "class", fx: "podium", mood: "happy", pose: "cheer", icon: "🌳" },
    prodigy: { bg: "class", fx: "mathsyms", mood: "stressed", icon: "🧠", res: { r0a: { mood: "happy", pose: "cheer" }, r0b: { mood: "tired" }, r1: { mood: "ok" } } },
    // Leaving school: the dialog's picture, 검정고시, the early Suneung, loneliness, Chuseok questions.
    dropout: { bg: "hall", fx: "door", mood: "ok", x: 220, icon: "🚪" },
    ged: { bg: "class", fx: "planner", mood: "stressed", icon: "📜", res: { pass0: { mood: "happy", pose: "cheer" }, pass1: { mood: "happy", pose: "cheer" }, fail0: { mood: "tired" }, fail1: { mood: "tired" } } },
    early: { bg: "cubicle", fx: "bulb", mood: "happy", x: 160, icon: "⏩", res: { r1: { mood: "ok" } } },
    lonely: { bg: "room", night: true, fx: "polaroids", mood: "tired", prop: "phone", pose: "hold", x: 200, icon: "📷", res: { r0: { mood: "happy", prop: null, pose: null } } },
    chuseok: { bg: "kitchen", fx: "grandma", mood: "stressed", x: 220, icon: "🌕", res: { r0: { mood: "ok" }, r1: { mood: "happy" } } },
    // People (v6.1). The friend the event names stands beside you (pmood: their face); alone: they're
    // somewhere else (a phone call, a letter), so you're drawn on your own.
    "soc-seatmate": { bg: "class", fx: "sparkles", mood: "happy", pmood: "happy", icon: "🪑" },
    "soc-playdate": { bg: "nursery", fx: "tower", mood: "happy", pmood: "happy", pose: "cheer", icon: "🧸" },
    "soc-birthday": { bg: "room", fx: "cake", mood: "happy", pmood: "happy", pose: "cheer", icon: "🎂", res: { r1: { mood: "tired", pose: "stand", pmood: "grumpy" } } },
    "soc-fight": { bg: "hall", fx: "raincloud", mood: "grumpy", pmood: "grumpy", icon: "💢", res: { r0: { mood: "ok", pmood: "happy" }, r1a: { mood: "happy", pmood: "happy" }, r1b: { mood: "grumpy", pmood: "grumpy" } } },
    "soc-makeup": { bg: "class", fx: "notes", mood: "happy", pmood: "happy", icon: "🤝" },
    "soc-moveaway": { bg: "street", fx: "trip", mood: "tired", pmood: "tired", pose: "wave", icon: "📦" },
    "soc-letter": { bg: "room", fx: "hearts", mood: "happy", prop: "phone", pose: "hold", alone: true, icon: "📞" },
    "soc-study": { bg: "class", fx: "notes", mood: "ok", pmood: "ok", prop: "book", pose: "hold", icon: "📚", res: { r0: { mood: "happy" } } },
    "soc-group": { bg: "beach", fx: "sparkles", mood: "happy", pmood: "happy", pose: "wave", icon: "🎤", res: { r1: { mood: "ok", pose: "stand" } } },
    "soc-crush": { bg: "class", fx: "hearts", mood: "happy", pmood: "ok", icon: "💓", res: { r0a: { pmood: "happy", pose: "cheer" }, r0b: { mood: "tired" } } },
    "soc-confessed": { bg: "hall", fx: "hearts", mood: "ok", pmood: "happy", icon: "💌", res: { r0: { mood: "happy" }, r1: { pmood: "tired" } } },
    "soc-date": { bg: "beach", fx: "hearts", mood: "happy", pmood: "happy", icon: "🎬" },
    "soc-breakup": { bg: "room", night: true, fx: "raincloud", mood: "tired", pmood: "tired", icon: "💔", res: { r1: { mood: "ok", pmood: "happy" } } },
    "soc-dumped": { bg: "room", night: true, fx: "raincloud", mood: "tired", prop: "phone", pose: "hold", alone: true, icon: "💔" },
    "soc-reunion": { bg: "street", fx: "polaroids", mood: "happy", pmood: "happy", pose: "wave", icon: "🎉", res: { r1: { mood: "ok", pose: "stand" } } },
    "soc-afterschool": { bg: "street", fx: "sparkles", mood: "happy", pmood: "happy", icon: "🍜", res: { r1: { mood: "tired", pmood: "ok" } } },
    "soc-rivalrank": { bg: "class", fx: "chat", mood: "ok", pmood: "ok", icon: "📊", res: { rw: { mood: "happy", pose: "cheer", pmood: "grumpy" }, rl: { mood: "grumpy", pmood: "happy" } } },
    "soc-rivalmock": { bg: "class", fx: "notes", mood: "ok", pmood: "ok", icon: "📝", res: { rw: { mood: "happy", pose: "cheer", pmood: "grumpy" }, rl: { mood: "grumpy", pmood: "happy" } } },
    "soc-gate": { bg: "street", fx: "cheer", mood: "ok", pmood: "happy", icon: "📣" },
    // The school record and 수시 (v6.0): the career survey, the club fair, a field that doesn't fit, a
    // class presentation, the interview.
    jinro: { bg: "class", fx: "planner", mood: "ok", icon: "🧭", res: { r0: { mood: "happy" } } },
    "club-pick": { bg: "field", fx: "stall", mood: "happy", pose: "wave", icon: "🎸" },
    "jinro-change": { bg: "class", fx: "notes", mood: "stressed", icon: "🔀", res: { r1: { mood: "ok" } } },
    seteuk: { bg: "class", fx: "podium", mood: "stressed", icon: "🎤", res: { r0: { mood: "happy", pose: "cheer" }, r1: { mood: "ok" } } },
    interview: { bg: "hall", fx: "counsel", mood: "stressed", x: 220, icon: "🤝", res: { r0: { mood: "ok" }, r2: { mood: "happy" } } },
  };
  const KEYWORDS = [
    [/bull|tease|gossip|cyber|threat|victim|gang/, "bully"],
    [/sick|ill|fever|hospital|injur/, "cold"],
    [/love|date|crush|confess/, "crush"],
    [/money|debt|pay|shop/, "family-money"],
    [/phone|sns|chat|online/, "smartphone"],
    [/friend|party|trip|camp/, "festival"],
  ];
  const STAGE_BG = { baby: "nursery", kinder: "class", elem: "class", mid: "hall", high: "room", hs3: "room", academy: "cubicle", selfstudy: "cubicle", halfretake: "campus", dropout: "cubicle" };
  function specFor(id, stage) {
    if (EVENT_ART[id]) return EVENT_ART[id];
    const head = String(id).split(/[-_.:]/)[0];
    if (EVENT_ART[head]) return EVENT_ART[head];
    for (const [re, key] of KEYWORDS) if (re.test(id)) return EVENT_ART[key];
    return { bg: STAGE_BG[stage] || "room", night: stage === "high" || stage === "hs3", fx: "sparkles", icon: "✨" };
  }
  // ctx: { id, variant, stage, look, mood, season, view, region }
  function eventArt(ctx) {
    VIEW = (ctx && ctx.view) || "city";
    REGION = (ctx && ctx.region) || "";
    begin();
    const spec = specFor(ctx.id, ctx.stage);
    const res = (spec.res && ctx.variant && (spec.res[ctx.variant] || spec.res[ctx.variant.slice(0, 2)])) || {};
    const c = Object.assign({}, ctx);
    let s = BACKDROPS[spec.bg](c, !!spec.night);
    // Foregrounds are drawn for the full 600-wide frame; nudging them left keeps them inside the
    // narrower crop a phone shows.
    s += G(-40, 0, FX[spec.fx](ctx.variant, ctx.id));
    const extra = { pose: res.pose || spec.pose, prop: res.prop !== undefined ? res.prop : spec.prop, mood: res.mood || (ctx.variant ? ctx.mood : spec.mood || ctx.mood) };
    // The people the event names ({ lk, x } from the engine) stand beside you, in your stage's clothes.
    const px = spec.x || 200;
    if (!spec.alone) (ctx.people || []).slice(0, 2).forEach((q, k) => {
      const x = px <= 300 ? px + 92 + k * 74 : px - 92 - k * 74;
      s += shadow(x, EFEET, 30, 5, 0.7) + person(Object.assign({}, c, { look: lookFor(q.lk, q.x), mood: res.pmood || spec.pmood || "happy" }), x, EFEET, 0.86 * (k ? 0.94 : 1));
    });
    s += shadow(px, EFEET, 32, 5, 0.8) + person(c, px, EFEET, 0.86, extra);
    return svg("0 0 " + EW + " " + EH, tidy(defsOut() + s + vignette(EW, EH)), "event-art");
  }
  function iconFor(id) { return specFor(id, "").icon || "✨"; }

  // ---------- screen illustrations (same 600 × 220 frame) ----------
  // Homes by income fifth, seen from the street, standing on y ≈ 204 in the left half of the frame:
  // a villa with a rooftop room (옥탑방), an older low-rise block, a standard apartment complex, a newer
  // one with landscaping, a riverside tower, and the children's home.
  const HOMES = {
    q1: () => {
      // A three-storey brick villa; on its roof a little room, a blue water tank and washing on a line.
      let s = shadow(160, 204, 140, 6) + boxP(50, 204, 220, 104, 0.08, [420, 60], "brick", "concrete", "brick2");
      for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) s += R(64 + i * 52, 112 + f * 32, 24, 18, "winDay") + R(62 + i * 52, 129 + f * 32, 28, 3, "concrete2");
      s += R(46, 96, 228, 6, "concrete2") + boxP(90, 96, 90, 34, 0.06, [420, 60], "rooftop", "roofGreen", "concrete2") + R(106, 72, 18, 24, "doorE2") + R(140, 74, 26, 14, "winLit", 0, null, 0, "opacity:0.8");
      s += R(200, 76, 26, 20, "accentBlue", 3) + R(200, 76, 26, 4, "hiE", 2, null, 0, "opacity:0.2") + L(180, 70, 262, 66, "inkE", 0.8) + R(234, 68, 10, 14, "fabric1") + R(248, 67, 9, 12, "paperE");
      return s + P("M270 204 L270 160 L290 160", null, "steel2", 2) + R(270, 120, 30, 3, "steel2");
    },
    q2: () => {
      // A 1980s five-storey block: painted concrete, a stripe, small balconies, air conditioners.
      let s = shadow(170, 204, 160, 6) + boxP(30, 204, 270, 142, 0.06, [420, 60], "concrete", "concrete2", "concrete2") + R(30, 62, 270, 10, "accentBlue", 0, null, 0, "opacity:0.5");
      for (let f = 0; f < 5; f++) for (let i = 0; i < 6; i++) s += R(42 + i * 43, 80 + f * 24, 28, 14, "winDay") + R(40 + i * 43, 94 + f * 24, 32, 3, "concrete2") + (i % 3 === 1 ? R(68 + i * 43, 84 + f * 24, 8, 6, "paperE2") : "");
      return s;
    },
    q3: () => shadow(170, 204, 170, 6) + aptSlab(160, 204, 140, 168, 9, 31) + aptSlab(30, 204, 130, 186, 9, 32) + R(0, 196, 340, 8, "lawnSu") + tree(20, 204, "summer", 0.6) + tree(320, 204, "summer", 0.7),
    q4: () => shadow(170, 204, 170, 6) + aptSlab(170, 204, 140, 176, 8, 41) + R(170, 28, 120, 10, "glassTint") + aptSlab(30, 204, 130, 192, 8, 42) + R(30, 12, 110, 12, "glassTint") +
      R(0, 192, 340, 12, "lawnSp") + tree(18, 204, "spring", 0.85, "cherry") + tree(150, 206, "spring", 0.7) + tree(320, 204, "spring", 0.85, "cherry") + G(250, 204, R(-26, -26, 52, 3, "woodDark") + L(-22, -24, -22, 0, "woodDark", 2) + L(22, -24, 22, 0, "woodDark", 2)),
    // A children's home: a long two-storey building behind a low fence, with a slide in the yard.
    care: () => {
      let s = shadow(160, 204, 150, 6) + boxP(30, 204, 250, 124, 0.06, [420, 60], "careWall", "concrete", "concrete2") + R(24, 76, 262, 6, "roofOr") + R(138, 152, 34, 52, "doorE2");
      for (let i = 0; i < 5; i++) for (let k = 0; k < 2; k++) s += R(44 + i * 48, 96 + k * 32, 26, 20, "winDay") + R(44 + i * 48, 96 + k * 32, 26, 4, "curtain", 0, null, 0, "opacity:0.7");
      for (let i = 0; i < 14; i++) s += R(6 + i * 24, 184, 3, 20, "steel2");
      return s + R(4, 186, 330, 3, "steel2") + L(300, 204, 326, 154, "steel", 3) + L(326, 154, 346, 154, "steel", 3) + L(346, 154, 346, 204, "steel", 2.5) + P("M300 204 L326 154 L333 158 L309 204 Z", "accentRed", null, 0, "opacity:0.8");
    },
    q5: () => {
      // Riverside towers in glass, the river and a bridge in front.
      let s = R(0, 172, 600, 30, "seaNear") + R(0, 172, 600, 3, "hiE", 0, null, 0, "opacity:0.2") + R(0, 196, 600, 3, "concrete2");
      s += boxP(90, 176, 80, 172, 0.06, [420, 60], "towerGlass", "concrete", "towerGlass2") + boxP(200, 176, 70, 146, 0.06, [420, 60], "towerGlass", "concrete", "towerGlass2");
      for (let k = 0; k < 14; k++) s += L(94, 16 + k * 11.5, 166, 16 + k * 11.5, "hiE", 0.8, "opacity:0.3") + (k < 12 ? L(204, 42 + k * 11, 266, 42 + k * 11, "hiE", 0.8, "opacity:0.3") : "");
      s += G(0, 0, R(110, 60, 20, 8, "winLit") + R(140, 100, 20, 8, "winLit") + R(214, 90, 16, 8, "winLit"), 1, "", "opacity:var(--a-litOp)") + P("M90 4 L170 4 L170 20 L90 30 Z", "hiE", null, 0, "opacity:0.12");
      s += R(0, 160, 600, 5, "concrete") + [60, 200, 340, 480].map((x) => R(x, 165, 6, 12, "concrete2")).join("");
      return s;
    },
  };
  // What each parent wears for work (engine JOBS ids).
  const JOB_GEAR = { exec: "suit", doctor: "coat", pro: "suit", civil: "suit", office: "suit", nurse: "scrubs", service: "apron", shop: "apron",
    farmer: "straw", builder: "hardhat", driver: "cap", factory: "vest", labor: "vest" };
  const homeShape = (ctx) => (ctx.parents === "care" ? HOMES.care : HOMES[ctx.family] || HOMES.q3);
  const SCREENS = {
    birth(ctx) {
      let s = sky(0, 0, EW, EH, { tod: "gold", seed: 81, sunX: 0.88, sunY: 0.5 }) + ridge(0, EW, 150, 50, 2, "mtnFar", "spring") + haze(0, 100, EW, 60, 0.5);
      s += homeShape(ctx)() + R(0, 196, EW, 24, "pathE") + R(0, 196, EW, 3, "curb");
      s += tree(560, 200, "spring", 1.1, "cherry") + tree(480, 204, "spring", 0.8, "cherry") + particles("spring", 0, 0, EW, 200, false, 10, 3);
      s += shadow(400, EFEET, 110, 7, 0.7);
      // Whoever raises you stands at the door (dressed for work when they have a job) with the newborn
      // in a blanket. mom() is the mother, a grandmother or a carer; with only a dad, he holds the baby.
      const j = ctx.jobs || {};
      const dadHolds = ctx.parents === "dad";
      s += mom(ctx, 340, EFEET, 0.95, { gear: JOB_GEAR[j.mom] || "", mood: "happy", pose: dadHolds ? "stand" : "hold", prop: dadHolds ? "" : "baby" });
      s += dad(ctx, 450, EFEET, 0.98, { gear: JOB_GEAR[j.dad] || "", mood: "happy", pose: dadHolds ? "hold" : "wave", prop: dadHolds ? "baby" : "" });
      return s;
    },
    // The track choice: a fork in a snowy road with two road signs, humanities left and sciences right.
    track(ctx) {
      let s = sky(0, 0, EW, EH, { tod: "day", seed: 82 }) + ridge(0, EW, 130, 46, 3, "mtnFar", "winter") + haze(0, 90, EW, 50, 0.5) + landscape(0, 60, EW, 90, { kind: "town", season: "winter", seed: 5, trees: false, horizon: 0.8 });
      s += R(0, 140, EW, 80, "snowE") + P("M250 220 L292 140 L308 140 L350 220 Z", "asphalt") + P("M292 140 L150 116 L176 114 L304 140 Z", "asphalt") + P("M304 140 L430 114 L456 116 L308 140 Z", "asphalt");
      s += G(300, 150, shadow(0, 0, 20, 3) + R(-2, -96, 4, 96, "steel2") + G(-40, -84, R(-34, -14, 72, 26, "signGreen", 2) + P("M-34 -14 L-46 -1 L-34 12 Z", "signGreen") + R(-26, -4, 46, 3, "paperE", 0, null, 0, "opacity:0.8")) +
        G(40, -52, R(-40, -14, 72, 26, "signBlue", 2) + P("M32 -14 L44 -1 L32 12 Z", "signBlue") + R(-30, -4, 46, 3, "paperE", 0, null, 0, "opacity:0.8")));
      s += tree(80, 160, "winter", 0.9) + tree(530, 160, "winter", 1.0);
      return s + particles("winter", 0, 0, EW, 200, false, 14, 4) + vignette(EW, EH);
    },
    // A mock exam: the OMR card on a desk, a computer-sign pen, an eraser, the classroom soft behind.
    mock(ctx) {
      let s = BACKDROPS.class(ctx) + R(0, 0, EW, EH, "bgVeil", 0, null, 0, "opacity:0.3");
      s += P("M60 220 L130 140 L470 140 L560 220 Z", "formica") + P("M60 220 L130 140 L134 144 L66 220 Z", "formica2") + R(0, 0, EW, EH, null, 0, null, 0, fill(def("dsk", (id) => radial(id, [[0, "hiE", 0.1], [1, "aoC", 0.2]], 0.4, 0.8, 0.8))));
      s += G(300, 170, P("M-110 30 L-90 -36 L96 -36 L120 30 Z", "omr") + (function () { let x = ""; for (let i = 0; i < 4; i++) for (let k = 0; k < 10; k++) { const px = -84 + k * 17 + i * -2.5, py = -26 + i * 13; x += E(px, py, 4.5, 3, k === (i * 3 + 2) % 10 ? "inkE" : "omrBubble"); } return x; })() + R(-90, -36, 186, 5, "omrRed"));
      s += G(470, 150, P("M-40 10 L30 -14 L34 -8 L-36 16 Z", "inkE") + P("M30 -14 L42 -18 L34 -8 Z", "paperE")) + G(160, 196, P("M-14 0 L14 -6 L18 6 L-10 12 Z", "paperE") + P("M4 -4 L14 -6 L18 6 L8 8 Z", "accentBlue", null, 0, "opacity:0.7"));
      return s + vignette(EW, EH);
    },
    exam(ctx) {
      return fit(SETS.examhall(ctx)) + shadow(260, EFEET, 30, 5, 0.8) + person(ctx, 260, EFEET, 0.86, { mood: ctx.mood === "happy" ? "ok" : ctx.mood }) + vignette(EW, EH);
    },
    // The score report under the desk lamp at night.
    report(ctx) {
      let s = fit(SETS.desk(ctx)) + R(0, 0, EW, EH, "aoC", 0, null, 0, "opacity:0.35") + pool(300, 120, 230, 120, "lampWarm", 0.7);
      s += G(300, 122, A("float", R(-104, -78, 212, 140, "aoC", 2, null, 0, "opacity:0.3") + R(-110, -84, 212, 140, "paperE", 1) + R(-110, -84, 212, 18, "inkE", 1, null, 0, "opacity:0.85") +
        [0, 1, 2, 3, 4].map((i) => L(-96, -48 + i * 14, 40, -48 + i * 14, "paperE2", 1) + R(56, -54 + i * 14, 20, 10, "paperE2", 1)).join("") + O(70, 30, 20, null, "accentRed", 2.5) + O(70, 30, 15, "accentRed", null, 0, "opacity:0.15")));
      return s + vignette(EW, EH, 0.7);
    },
    // Applications: three groups' application pages on the laptop at the desk.
    apply(ctx) {
      let s = fit(SETS.bedroom(ctx, true)) + R(0, 0, EW, EH, "aoC", 0, null, 0, "opacity:0.3") + pool(300, 110, 220, 100, "monitorGlow", 0.6);
      s += G(300, 190, P("M-150 0 L-128 -150 L128 -150 L150 0 Z", "inkE") + R(-120, -142, 240, 128, "phoneScreen", 2) + R(-170, 0, 340, 9, "steel", 2));
      ["accentRed", "accentBlue", "fabric3"].forEach((c, i) => { s += G(220 + i * 80, 112, A("float", R(-32, -40, 64, 80, "paperE", 1) + R(-32, -40, 64, 12, c) + L(-24, -16, 20, -16, "inkE", 1, "opacity:0.35") + L(-24, -6, 14, -6, "inkE", 1, "opacity:0.35") + L(-24, 4, 22, 4, "inkE", 1, "opacity:0.35") + R(-24, 20, 30, 8, c, 2, null, 0, "opacity:0.7")), 1, "", "--del:-" + i * 0.7 + "s"); });
      return s + vignette(EW, EH, 0.7);
    },
    // ---------- the epilogue ----------
    campus(ctx) {
      return fit(SETS.campus(Object.assign({}, ctx, { season: "spring" }))) + shadow(300, EFEET, 30, 5, 0.8) + person(ctx, 300, EFEET, 0.95, { mood: "happy", prop: "book", pose: "hold" }) + vignette(EW, EH);
    },
    // An army training centre in winter: barracks on a hill, the flagpole, a duffel bag.
    army(ctx) {
      let s = sky(0, 0, EW, EH, { tod: "day", seed: 85 }) + ridge(0, EW, 140, 60, 6, "mtnFar", "winter") + haze(0, 90, EW, 50, 0.5) + ridge(0, EW, 160, 30, 7, "mtnMid", "winter") + R(0, 172, EW, 48, "dirt");
      s += boxP(330, 172, 220, 62, 0.06, [300, 80], "concrete", "roofGreen", "concrete2") + P("M322 112 L440 92 L558 112 Z", "roofGreen");
      for (let i = 0; i < 5; i++) s += R(344 + i * 42, 128, 24, 16, "winDay") + R(344 + i * 42, 128, 24, 16, "winLit", 0, null, 0, "opacity:var(--a-litOp)");
      s += L(110, 178, 110, 54, "steel", 2.5) + G(112, 58, A("sway", R(0, 0, 40, 26, "paperE") + O(20, 13, 6, "accentRed") + P("M14 13 A6 6 0 0 0 26 13 A3 3 0 0 0 20 13 A3 3 0 0 1 14 13 Z", "accentBlue")));
      s += G(230, 196, shadow(0, 2, 36, 5) + E(0, -8, 34, 13, "olive") + R(-30, -20, 60, 16, "olive2", 8));
      return s + particles("winter", 0, 0, EW, 170, false, 10, 22) + shadow(300, EFEET, 30, 5, 0.8) + person(ctx, 300, EFEET, 0.95, { mood: ctx.mood || "ok" }) + vignette(EW, EH);
    },
    // A job interview: three interviewers behind a long table, the empty chair, the window.
    hunt(ctx) {
      let s = fit(room(W, H, BACK, VP, { wall: "officeWall", floor: "tile" }) + windowView(560, 40, 150, 110, { season: "fall", seed: 86, tree: false, blind: true }) + tube(200, 6, 100) + tube(460, 6, 100));
      s += boxP(40, 140, 260, 18, 0.06, [300, 80], "woodDesk2", "woodDesk", "woodDesk2") + R(52, 140, 6, 40, "steel2") + R(282, 140, 6, 40, "steel2");
      for (let i = 0; i < 3; i++) s += G(80 + i * 80, 122, O(0, -26, 11, "hairE") + P("M-20 0 Q-20 -18 0 -18 Q20 -18 20 0 Z", "suitE") + R(-12, -2, 24, 6, "paperE", 1) + R(-3, -18, 6, 10, "paperE", 0, null, 0, "opacity:0.7"));
      s += G(400, 176, R(-4, -36, 8, 36, "steel2") + R(-22, -42, 44, 8, "chairBlack", 3) + R(-20, -76, 40, 34, "chairBlack", 4));
      for (let i = 0; i < 4; i++) s += R(500, 160 - i * 6, 60, 5, i % 2 ? "paperE" : "paperE2", 1);
      return s + shadow(400, EFEET, 30, 5, 0.8) + person(ctx, 400, EFEET, 0.92, { mood: ctx.mood || "ok" }) + vignette(EW, EH);
    },
    // At thirty: the city at dusk from a pedestrian bridge, towers and apartment lights coming on.
    at30(ctx) {
      let s = sky(0, 0, EW, EH, { tod: "gold", seed: 87, sunX: 0.78, sunY: 0.58, sunR: 10 }) + namsan(150, 150, 0.9) + haze(0, 80, EW, 90, 0.5);
      const r = rand(87);
      for (let i = 0; i < 9; i++) { const x = i * 70 - 10, h = 60 + r() * 80; s += block(x, EF, 56, h, i % 2 ? "bldFar" : "bldMid", i + 3, 9); }
      s += aptSlab(420, EF, 80, 120, 8, 5) + aptSlab(510, EF, 90, 100, 8, 6);
      s += R(0, EF - 6, EW, 8, "concrete") + R(0, EF + 2, EW, EH - EF, "asphalt") + [40, 160, 280, 400, 520].map((x) => L(x, EF - 6, x, EF - 30, "steel2", 1.5)).join("") + L(0, EF - 26, EW, EF - 26, "steel2", 2);
      return s + shadow(300, EFEET, 30, 5, 0.8) + person(ctx, 300, EFEET, 0.95, { mood: ctx.mood || "happy" }) + vignette(EW, EH);
    },
  };
  // v6.0: the report card, the six 수시 envelopes, the first-round notice board, the results page.
  // Grade digits are numbers, not words, so the report card can show them.
  Object.assign(SCREENS, {
    naesin(ctx) {
      let s = fit(SETS.classroom(ctx)) + R(0, 0, EW, EH, "bgVeil", 0, null, 0, "opacity:0.3");
      const gs = (ctx.grades || [2, 3, 1, 2, 3]).slice(0, 6);
      let rows = "";
      gs.forEach((g, i) => {
        rows += L(-74, -40 + i * 15, -4, -40 + i * 15, "paperE2", 4) + R(14, -48 + i * 15, 22, 13, "paperE2", 2) + T(25, -38 + i * 15, String(g), "inkE", 10) + '<rect x="38" y="' + (-46 + i * 15) + '" width="3" height="9" style="fill:var(--g' + Math.min(6, g || 3) + ')"/>';
      });
      s += G(300, 112, A("float", R(-86, -66, 180, 150, "aoC", 2, null, 0, "opacity:0.3") + R(-90, -70, 180, 150, "paperE", 1) + R(-90, -70, 180, 16, "accentBlue", 1, null, 0, "opacity:0.8") + rows + O(60, 54, 14, null, "accentRed", 2) + O(60, 54, 10, "accentRed", null, 0, "opacity:0.2")));
      return s + shadow(500, EFEET, 28, 5, 0.8) + person(ctx, 500, EFEET, 0.8, { pose: "hold", prop: "book" }) + vignette(EW, EH);
    },
    susi(ctx) {
      let s = fit(SETS.bedroom(ctx, false)) + R(0, 0, EW, EH, "bgVeil", 0, null, 0, "opacity:0.3");
      ["accentRed", "accentBlue", "fabric3", "fabric2", "fabric4", "accentBlue"].forEach((c, i) => {
        const x = 110 + (i % 3) * 80, y = 70 + Math.floor(i / 3) * 62;
        s += G(x, y, A("float", R(-28, -18, 60, 40, "aoC", 1, null, 0, "opacity:0.25") + R(-30, -20, 60, 40, "paperE", 1) + P("M-30 -20 L0 4 L30 -20", null, "paperE2", 1.5) + R(-30, -20, 6, 40, c, 0, null, 0, "opacity:0.8")), 1, "", "--del:-" + i * 0.5 + "s");
      });
      return s + shadow(470, EFEET, 28, 5, 0.8) + person(ctx, 470, EFEET, 0.86, { mood: "stressed", pose: "hold" }) + vignette(EW, EH);
    },
    susiStage(ctx) {
      let s = fit(SETS.hallway(ctx)) + R(0, 0, EW, EH, "bgVeil", 0, null, 0, "opacity:0.25") + R(104, 22, 272, 142, "woodDark", 2) + R(110, 28, 260, 130, "cork2");
      for (let i = 0; i < 6; i++) s += G(150 + (i % 3) * 80, 66 + Math.floor(i / 3) * 52, R(-27, -17, 56, 40, "aoC", 0, null, 0, "opacity:0.2") + R(-28, -18, 56, 40, "paperE") + R(-20, -10, 40, 3, "inkE", 0, null, 0, "opacity:0.35") + R(-20, -2, 30, 3, "inkE", 0, null, 0, "opacity:0.35") + O(0, -16, 2.5, ["accentRed", "accentBlue", "neonC"][i % 3]));
      return s + shadow(470, EFEET, 28, 5, 0.8) + person(ctx, 470, EFEET, 0.86, {}) + vignette(EW, EH);
    },
    susiResult(ctx) {
      const ok = ctx.mood === "happy";
      let s = fit(SETS.bedroom(ctx, true)) + R(0, 0, EW, EH, "aoC", 0, null, 0, "opacity:0.3") + pool(280, 110, 180, 100, "monitorGlow", 0.6) + R(130, 150, 300, 30, "woodDesk", 2);
      s += G(280, 150, P("M-80 0 L-66 -96 L66 -96 L80 0 Z", "inkE") + R(-58, -90, 116, 76, "phoneScreen", 2) + R(-46, -76, 92, 12, ok ? "fabric3" : "accentRed", 2, null, 0, "opacity:0.85") +
        R(-46, -56, 60, 4, "inkE", 0, null, 0, "opacity:0.35") + R(-46, -46, 76, 4, "inkE", 0, null, 0, "opacity:0.35") + R(-100, 0, 200, 7, "steel", 2));
      if (ok) s += motes(170, 30, 260, 80, 8, 4);
      return s + shadow(500, EFEET, 28, 5, 0.8) + person(ctx, 500, EFEET, 0.86, { pose: ok ? "cheer" : null }) + vignette(EW, EH);
    },
  });
  function screenArt(name, ctx) {
    VIEW = (ctx && ctx.view) || "city";
    REGION = (ctx && ctx.region) || "";
    begin();
    if (name === "offers" || name === "ending") { const b = SCENES[ctx.label ? "gate" : name === "ending" ? "road" : "home"](ctx); return svg("0 0 " + W + " " + H, tidy(defsOut() + b), "event-art wide"); }
    const b = SCREENS[name](ctx);
    return svg("0 0 " + EW + " " + EH, tidy(defsOut() + b), "event-art");
  }


  // ---------- cutscenes ----------
  // Short animated films for life's milestones. A cutscene is a list of shots; each shot is one SVG on
  // an 800 × 450 stage whose camera (the outer .cam group) pans and zooms over the shot while things
  // inside walk, drop, pop, ring and grow. All motion is CSS keyframes in styles.css (.cut-art), timed
  // with custom properties, so app.js only swaps shots. Content is drawn where it ends up and the
  // animations start from offsets, so with prefers-reduced-motion each shot is a sensible still frame.
  const CW = 800, CH = 450, CG = 370, CF = 418; // stage, ground line, feet line
  // cam: { s0, s1 } scale, { ox, oy } the point it zooms on, { x0, x1, y0, y1 } a pan, over t seconds.
  function cutShot(t, body, cam) {
    const c = cam || {};
    const v = (k, d) => (c[k] != null ? c[k] : d);
    const style = "--t:" + t + "s;--s0:" + v("s0", 1) + ";--s1:" + v("s1", 1.06) + ";--ox:" + v("ox", 400) + "px;--oy:" + v("oy", 260) + "px;--x0:" + v("x0", 0) + "px;--x1:" + v("x1", 0) +
      "px;--y0:" + v("y0", 0) + "px;--y1:" + v("y1", 0) + "px";
    return { t, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CW + " " + CH + '" preserveAspectRatio="xMidYMid slice" class="art cut-art" aria-hidden="true" focusable="false"><g class="cam" style="' + style + '">' + defsOut() + body + "</g></svg>" };
  }
  // Slide from dx0 to dx1 (px), starting at `at` seconds and taking d seconds: walking, driving, parallax.
  const walk = (dx0, dx1, at, d, body) => '<g class="c-walk" style="--wx0:' + dx0 + "px;--wx1:" + dx1 + "px;--at:" + at + "s;--d:" + d + 's">' + body + "</g>";
  // A one-shot effect (c-pop, c-fade, c-out, c-stamp, c-ring, c-grow, c-flash, c-thud) at `at` seconds.
  const fx = (cls, at, body) => '<g class="' + cls + '" style="--at:' + at + 's">' + body + "</g>";
  // Family and classmates. Parents share your skin tone; their hair, clothes and glasses come from your
  // looks, so each family looks its own and the same from screen to screen. Parents who aren't in this
  // life aren't drawn; children raised by grandparents get a grandmother where the mother would stand,
  // and children in care a carer in an apron.
  const hasMom = (ctx) => !ctx.parents || ctx.parents === "both" || ctx.parents === "mom";
  const hasDad = (ctx) => !ctx.parents || ctx.parents === "both" || ctx.parents === "dad";
  function parentLook(ctx, sex) {
    const l = ctx.look || {};
    const k = ((l.shirt || 0) * 7 + (l.hair || 0) * 3 + (l.hc || 0) + (l.glasses ? 5 : 0)) >>> 0;
    return sex === "f"
      ? { hair: [3, 13, 11, 14, 10, 12][k % 6], skin: l.skin, shirt: (k + 1) % 6, sex: "f", hc: 1, dye: k % 3 ? 1 + (k % 3) : 0, lid: (k & 1) === 1, glasses: k % 7 === 3 }
      : { hair: [1, 0, 8, 6, 7][k % 5], skin: l.skin, shirt: (k + 3) % 6, sex: "m", hc: 0, lid: !!l.lid, glasses: k % 3 === 0 };
  }
  const fam = (ctx, look, x, y, s, extra) => G(x, y, avatar(Object.assign({ age: "adult", outfit: "casual", look, mood: "happy", season: ctx && ctx.season }, extra || {})), s || 1);
  const grandma = (x, y, s, extra, ctx) => fam(ctx, { hair: 16, shirt: 2, sex: "f", grey: true, skin: ctx && ctx.look ? ctx.look.skin : 0, lid: true }, x, y, s, extra);
  const carer = (x, y, s, extra, ctx) => fam(ctx, { hair: 10, shirt: 4, sex: "f", hc: 1, lid: true }, x, y, s, Object.assign({ gear: "carer" }, extra || {}));
  const mom = (ctx, x, y, s, extra) => (hasMom(ctx) ? momFig(ctx, x, y, s, extra) : ctx.parents === "grand" ? grandma(x, y, s, extra, ctx) : ctx.parents === "care" ? carer(x, y, s, extra, ctx) : "");
  const dad = (ctx, x, y, s, extra) => (hasDad(ctx) ? dadFig(ctx, x, y, s, extra) : "");
  const momFig = (ctx, x, y, s, extra) => fam(ctx, parentLook(ctx, "f"), x, y, s, extra);
  const dadFig = (ctx, x, y, s, extra) => fam(ctx, parentLook(ctx, "m"), x, y, s, extra);
  // Who carries the baby: the mother (or grandmother, or carer), else the father.
  const momHolds = (ctx) => ctx.parents !== "dad";
  const me = (ctx, stage, x, y, s, extra) => person(Object.assign({}, ctx, { stage }), x, y, s, extra);
  function other(seed, x, y, s, o) {
    return G(x, y, avatar(Object.assign({ age: "teen", outfit: "uniform", look: lookFor(seed, seed % 2 ? "m" : "f"), mood: "happy" }, o || {})), s || 1);
  }
  const kid = (seed, x, y, s, o) => other(seed, x, y, s, Object.assign({ age: "child", outfit: "kid", backpack: true }, o || {}));
  // A newborn wrapped in a blanket (in a bassinet, or anywhere not in someone's arms: arms use prop "baby").
  const bundle = (x, y, s) => G(x, y, bundleBody(), s || 1);
  function confettiRain(n, seed) {
    const r = rand(seed || 9);
    let s = "";
    for (let i = 0; i < n; i++) {
      const style = "--d:" + (2.2 + r() * 2).toFixed(1) + "s;--del:-" + (r() * 3).toFixed(1) + "s;--dx:" + (r() * 60 - 30).toFixed(0) + "px;--fy:" + (CH + 40) + "px";
      s += G((r() * CW).toFixed(0), -10, A("fall", R(-4, -6, 8, 12, ["c1", "c2", "c3", "c4", "c5", "gold"][i % 6], 2), style));
    }
    return s;
  }
  // Confetti for the films, in the muted paper colours of the rest of the art.
  function confetti(n, seed) { return confettiRain(n, seed).replace(/var\(--a-(c1|c2|c3|c4|c5|gold)\)/g, (m, t) => C({ c1: "accentRed", c2: "stickyY", c3: "fabric3", c4: "fabric4", c5: "accentBlue", gold: "brass" }[t])); }
  const petals = (seed, n) => particles("spring", 0, 0, CW, CH - 40, false, n || 22, seed || 5);
  // A room on the film stage (800 × 450): the back wall meets the floor at 360, feet at 418.
  const CVP = [400, 200], CBACK = [70, 40, 730, 360];
  const stage = (o) => room(CW, CH, CBACK, CVP, o);
  // A street that scrolls past behind someone walking in place: far apartment blocks and a hill, near
  // shopfronts, trees, street lights and the railing of the pavement.
  function streetPan(t, season) {
    const r = rand(77);
    let far = ridge(0, 1400, 250, 90, 7, "mtnFar", season, 8) + haze(0, 160, 1400, 110, 0.5), near = "";
    for (let i = 0; i < 12; i++) far += aptSlab(i * 120, CG - 30, 80, 110 + r() * 90, 10, 50 + i);
    for (let i = 0; i < 7; i++) {
      const x = i * 210;
      near += boxP(x, CG - 30, 180, 120, 0, CVP, i % 2 ? "concrete" : "brick", "concrete", "brick2") + R(x + 8, CG - 120, 164, 22, ["neonA", "signW", "neonC", "neonB"][i % 4], 1, null, 0, "opacity:0.8") + R(x + 24, CG - 112, 90, 6, "signBox", 1, null, 0, "opacity:0.4") +
        R(x + 12, CG - 92, 156, 58, "storeGlow", 0, null, 0, "opacity:0.55") + L(x + 90, CG - 92, x + 90, CG - 34, "steel2", 2);
    }
    for (let i = 0; i < 8; i++) near += tree(80 + i * 170, CG + 6, season, 1.25) + L(160 + i * 170, CG + 2, 160 + i * 170, CG - 150, "steel2", 3) + L(160 + i * 170, CG - 148, 184 + i * 170, CG - 148, "steel2", 2) + O(184 + i * 170, CG - 145, 3, "sodium");
    near += R(0, CG - 34, 1400, 3, "steel2") + (function () { let x = ""; for (let i = 0; i < 70; i++) x += R(i * 20, CG - 34, 2, 34, "steel2"); return x; })();
    return sky(0, 0, CW, CH, { tod: season === "summer" ? "rain" : "day", seed: 31, sunY: 0.12 }) + walk(0, -260, 0, t, far) + R(0, CG - 4, CW, CH, "pavement") + L(0, CG + 30, CW, CG + 30, "curb", 6) +
      walk(0, -620, 0, t, near) + R(0, CG + 33, CW, CH, "asphalt") + (season === "spring" ? petals(12, 18) : particles(season, 0, 0, CW, CH, false, 14, 12));
  }
  // A school (or university) gate: the building behind, two pillars, a name plate with the text app.js passes.
  function gateShot(label, floors, season) {
    let s = sky(0, 0, CW, CH, { tod: season === "fall" ? "dawn" : "day", seed: 19 }) + ridge(0, CW, 200, 70, 4, "mtnFar", season) + haze(0, 140, CW, 80, 0.5) + R(0, CG, CW, CH - CG, "pavement") + P("M330 450 L370 " + CG + " L430 " + CG + " L470 450 Z", "pathE");
    const top = CG - 40 - floors * 34;
    s += boxP(150, CG, 500, CG - top, 0.04, [400, 200], "schoolWall", "concrete", "concrete2") + R(140, top - 12, 520, 12, "concrete2");
    for (let f = 0; f < floors; f++) for (let i = 0; i < 9; i++) s += R(172 + i * 52, top + 14 + f * 34, 30, 20, "winDay") + R(172 + i * 52, top + 14 + f * 34, 30, 4, "aoC", 0, null, 0, "opacity:0.2");
    s += tree(90, CG + 4, season, 1.6, "cherry") + tree(720, CG + 4, season, 1.7);
    s += shadow(253, CG + 2, 40, 6) + shadow(547, CG + 2, 40, 6) + boxP(230, CG, 46, CG - 180, 0.03, [400, 200], "granite", "granite2", "granite2") + boxP(524, CG, 46, CG - 180, 0.03, [400, 200], "granite", "granite2", "granite2") + R(218, 170, 70, 14, "granite2") + R(512, 170, 70, 14, "granite2");
    s += R(270, 116, 260, 44, "plate", 2, "granite2", 3) + (label ? T(400, 145, label, "plateInk", label.length > 20 ? 12 : label.length > 13 ? 15 : 19) : "");
    return s;
  }
  // The 돌잡이 table seen from the front, scaled up from the event art's coordinates.
  const DOL_ORDER = ["pencil", "book", "mouse", "stethoscope", "mic", "gavel", "ball", "thread", "money", "brush"];
  function dolTable() {
    let s = R(296, 160, 298, 10, "lacquer", 2) + R(296, 160, 298, 3, "hiE", 0, null, 0, "opacity:0.15") + R(310, 170, 10, 30, "lacquer2", 1) + R(570, 170, 10, 30, "lacquer2", 1) + R(300, 156, 290, 5, "silk", 1);
    DOL_ORDER.forEach((id, i) => { s += DOL_ITEMS[id](320 + i * 28); });
    return G(-314, 64, s, 1.6);
  }
  const dolX = (id) => (320 + Math.max(0, DOL_ORDER.indexOf(id)) * 28) * 1.6 - 314;
  const homeOf = (ctx) => G(40, 112, homeShape(ctx)(), 1.45);
  // The family home seen from the street, by day or at the golden hour.
  const homeStreet = (ctx, tod, season) => sky(0, 0, CW, CH, { tod: tod || "day", seed: 4, sunX: 0.85, sunY: tod === "gold" ? 0.5 : 0.16 }) + ridge(0, CW, 230, 80, 3, "mtnFar", season) + haze(0, 170, CW, 80, 0.5) +
    homeOf(ctx) + R(0, CG + 30, CW, CH, "pavement") + R(0, CG + 28, CW, 4, "curb");
  // A hospital at night: the building, one lit window, the red cross sign, street lights.
  function hospitalNight() {
    let s = sky(0, 0, CW, CH, { tod: "night", seed: 7, sunX: 0.15, sunY: 0.16 });
    const r = rand(23);
    for (let i = 0; i < 10; i++) s += withLit(0.9, () => block(i * 84 - 10, CG + 10, 76, 80 + r() * 120, "bldFar", i + 60, 12));
    s += haze(0, 200, CW, 170, 0.3) + boxP(270, CG, 260, CG - 110, 0.04, [400, 200], "hospWall", "concrete", "concrete2") + R(258, 98, 284, 14, "concrete2");
    s += R(370, 46, 60, 46, "paperE", 4) + R(392, 52, 16, 34, "accentRed", 2) + R(383, 61, 34, 16, "accentRed", 2) + pool(400, 69, 60, 40, "accentRed", 0.35);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += R(292 + i * 46, 132 + j * 44, 26, 28, i === 3 && j === 1 ? "winLit" : (i + j) % 3 ? "nightWin" : "winLit", 2, null, 0, i === 3 && j === 1 ? "" : (i + j) % 3 ? "" : "opacity:0.5");
    s += G(431, 190, A("pulse", O(0, 0, 40, null, null, 0, fill(glowF("winLit"), "opacity:0.6"))));
    s += R(0, CG, CW, CH - CG, "asphalt") + R(0, CG, CW, 6, "curb");
    for (let i = 0; i < 3; i++) { const x = 90 + i * 300; s += pool(x + 20, CG + 10, 120, 26, "sodium", 0.8) + L(x, CG, x, CG - 190, "steel2", 4) + L(x, CG - 188, x + 26, CG - 188, "steel2", 3) + O(x + 26, CG - 184, 4, "sodium") + pool(x + 26, CG - 180, 40, 40, "sodium", 0.6); }
    return s;
  }

  // The family living room at night (the results-night set, scaled up to the film stage).
  const living = (ctx) => G(-292, -6, SETS.home(ctx), 1.73);
  const CUTS = {
    birth(ctx) {
      // 1. The hospital at night, one window lit; the camera pushes in.
      const a = hospitalNight();
      // 2. The delivery room: a first cry over the bassinet, your parents leaning in.
      let b = stage({ wall: "wardWall", floor: "tile", lower: [70, "wardWall2"] }) + windowView(540, 70, 170, 130, { night: true, season: ctx.season, seed: 8, blind: true }) + tube(240, 12, 120) + tube(470, 12, 120);
      b += shadow(140, 412, 120, 10) + boxP(40, 356, 200, 56, 0.1, CVP, "steel", "paperE", "steel") + R(40, 282, 56, 28, "paperE", 8) + R(46, 356, 8, 62, "steel2") + R(226, 356, 8, 62, "steel2");
      b += mom(ctx, 290, CF, 1.45, { pose: "hold" }) + dad(ctx, 540, CF, 1.5, { pose: "hold" });
      b += shadow(405, 416, 70, 8) + R(350, 330, 110, 46, "ivBag", 10) + R(350, 330, 110, 10, "hiE", 6, null, 0, "opacity:0.2") + R(362, 376, 8, 42, "steel2") + R(440, 376, 8, 42, "steel2") + bundle(390, 326, 1.4);
      b += pool(400, 300, 160, 90, "lampWarm", 0.5) + fx("c-fade", 0.5, G(450, 300, A("pulse", P("M0 0 q10 -10 0 -20 M10 4 q16 -14 0 -30 M20 8 q22 -18 0 -40", null, "paperE", 2.5, "opacity:0.7")))) + heart(380, 260, 1.6, 0, 0.6) + heart(430, 240, 1.2, 0, 1.4);
      // 3. Coming home: the family's home in the spring, your parents walking up with you.
      let c = homeStreet(ctx, "day", "spring") + tree(700, CG + 34, "spring", 1.7, "cherry");
      c += walk(360, 0, 0.1, 3.0, dad(ctx, 610, CF + 6, 1.5, momHolds(ctx) ? { pose: "wave" } : { pose: "hold", prop: "baby" }) + mom(ctx, 490, CF + 10, 1.45, { pose: "hold", prop: "baby" }));
      c += petals(5, 20);
      return [
        cutShot(3.2, a, { s0: 1, s1: 2.1, ox: 431, oy: 186 }),
        cutShot(3.6, b + vignette(CW, CH), { s0: 1.05, s1: 1.3, ox: 410, oy: 320 }),
        cutShot(3.6, c, { s0: 1.08, s1: 1.0, ox: 420, oy: 300, x0: -20, x1: 10 }),
      ];
    },
    dol(ctx) {
      const items = (ctx.items || []).filter((id) => DOL_ITEMS[id]);
      if (!items.length) items.push("pencil");
      // 1. The first-birthday party in a banquet room: a folding screen (병풍), the rice-cake tower, the family.
      const hall = (n) => {
        let s = stage({ wall: "banquetWall", floor: "wood", ceil: "banquetCeil" }) + R(70, 40, 660, 320, "lampWarm", 0, null, 0, "opacity:0.06");
        for (let i = 0; i < n; i++) s += R(150 + i * 64, 80, 60, 230, "screenPanel", 1) + R(156 + i * 64, 86, 48, 218, "silk", 1) + ridge(158 + i * 64, 44, 250, 60, i + 3, "mtnFar", "spring", 3) + R(150 + i * 64, 80, 2, 230, "aoC", 0, null, 0, "opacity:0.2");
        return s + pool(400, 140, 300, 120, "lampWarm", 0.4) + [200, 400, 600].map((x) => O(x, 30, 12, "lampWarm") + pool(x, 34, 50, 30, "lampWarm", 0.6)).join("");
      };
      let a = hall(8) + flags(60, 740, 40, 2);
      a += shadow(400, 376, 120, 8) + R(300, 300, 200, 14, "lacquer", 3) + R(312, 314, 8, 60, "lacquer2") + R(480, 314, 8, 60, "lacquer2");
      ["tteok", "paperE", "tteok2", "blossomE", "tteok", "paperE2"].forEach((col, i) => { a += R(340 + i * 6, 278 - i * 22, 120 - i * 12, 22, col, 4) + R(340 + i * 6, 278 - i * 22, 120 - i * 12, 4, "hiE", 2, null, 0, "opacity:0.2"); });
      a += mom(ctx, 150, CF, 1.35, { pose: "cheer" }) + dad(ctx, 250, CF, 1.4, { pose: "wave" });
      a += G(560, CF, avatar({ age: "adult", outfit: "casual", look: { hair: 2, skin: ctx.look.skin, shirt: 3, sex: "f" }, mood: "happy", pose: "cheer" }), 1.25);
      a += G(660, CF, avatar({ age: "adult", outfit: "casual", look: { hair: 0, skin: ctx.look.skin, shirt: 1, sex: "m" }, mood: "happy", pose: "wave" }), 1.3);
      // 2. The table of objects; you toddle up to the one you'll grab.
      let b = hall(10) + dolTable();
      const tx = dolX(items[0]);
      b += walk(-300, 0, 0.3, 2.4, me(ctx, "baby", tx - 18, 446, 1.7, { mood: "happy" }));
      b += fx("c-fade", 2.7, pool(tx, 300, 60, 60, "lampWarm", 0.8) + sparkle(tx, 270, 1.2) + sparkle(tx + 18, 290, 0.7));
      // 3. The grab, up close: the item (or both) held high in a pool of light, confetti.
      let c = R(0, 0, CW, CH, null, 0, null, 0, fill(def("dolbg", (id) => radial(id, [[0, "banquetWall"], [1, "screenPanel"]], 0.5, 0.5, 0.75)))) + G(400, 225, A("pulse", O(0, 0, 230, null, null, 0, fill(glowF("lampWarm"), "opacity:0.7"))));
      const one = items.length === 1;
      items.slice(0, 2).forEach((id, i) => {
        const x = one ? 400 : 290 + i * 220, sc = one ? 4.2 : 3.4;
        c += G(x, 225, fx("c-pop", 0.2 + i * 0.35, G(0, -150 * sc, DOL_ITEMS[id](0), sc)));
        c += sparkle(x - 90, 120, 1.4) + sparkle(x + 80, 300, 1) + sparkle(x + 60, 100, 0.8);
      });
      c += confetti(40, 3);
      return [
        cutShot(3.0, a + vignette(CW, CH), { s0: 1.12, s1: 1.12, x0: 50, x1: -50 }),
        cutShot(3.6, b + vignette(CW, CH), { s0: 1, s1: 1.35, ox: tx, oy: 330 }),
        cutShot(3.2, c + vignette(CW, CH), { s0: 0.92, s1: 1.04 }),
      ];
    },
    // First day of elementary school: out of the door, the walk, the gate.
    elem(ctx) {
      let a = homeStreet(ctx, "day", "spring") + tree(720, CG + 34, "spring", 1.6, "cherry");
      a += mom(ctx, 250, CF + 10, 1.45, { pose: "wave" });
      a += walk(-220, 0, 0.2, 2.6, me(ctx, "elem", 520, CF + 12, 1.6, { mood: "happy" }));
      a += petals(8, 16);
      let b = streetPan(3.4, "spring");
      b += walk(0, -120, 0, 3.4, kid(41, 600, CF, 1.3) + kid(42, 680, CF, 1.3));
      b += me(ctx, "elem", 360, CF, 1.6, { mood: "happy" });
      let c = gateShot(ctx.label, 3, "spring");
      [[110, 51], [180, 52], [620, 53], [690, 54]].forEach(([x, sd]) => { c += G(x, CF, A("hop", kid(sd, 0, 0, 1), "--del:-" + (sd % 3) * 0.4 + "s"), 1.25); });
      c += mom(ctx, 280, CF + 10, 1.45, { pose: "wave" }) + me(ctx, "elem", 430, CF + 14, 1.65, { pose: "wave", mood: "happy" }) + petals(9, 18);
      return [
        cutShot(3.0, a, { s0: 1.05, s1: 1.1, x0: 10, x1: -30 }),
        cutShot(3.4, b, { s0: 1.05, s1: 1.05 }),
        cutShot(3.4, c, { s0: 1.35, s1: 1.0, ox: 420, oy: 330 }),
      ];
    },
    // A new school in a new uniform (middle or high school): the mirror, the walk, the gate.
    school(ctx) {
      const st = ctx.stage, high = st === "high";
      let a = stage({ floor: "wood" }) + windowView(90, 80, 200, 170, { season: "spring", seed: 12, curtain: true }) + sunPatch(240, 380, 220, 30, 90) + shaft([[94, 84], [290, 84], [470, 410], [240, 410]], 12);
      a += shadow(580, 366, 80, 8) + R(520, 60, 120, 300, "woodDark", 4) + R(532, 72, 96, 276, "mirror", 2) + P("M548 90 L600 70 M548 130 L620 90", null, "hiE", 3, "opacity:0.4") + R(532, 72, 96, 276, null, 0, null, 0, fill(def("mir", (id) => lin(id, [[0, "hiE", 0.25], [1, "hiE", 0]], [0, 0, 1, 1]))));
      a += shadow(700, 416, 90, 8) + boxP(620, 412, 180, 60, 0.08, CVP, "beddingE2", "beddingE", "beddingE2") + R(620, 340, 60, 24, "paperE", 8);
      a += me(ctx, st, 400, CF, 1.6, { mood: "happy" }) + fx("c-fade", 1.0, motes(330, 220, 140, 160, 8, 5));
      let b = streetPan(3.2, "spring");
      b += walk(0, -100, 0, 3.2, other(61, 590, CF, 1.25) + other(62, 670, CF, 1.25));
      b += me(ctx, st, 360, CF, 1.45, { mood: "happy" });
      let c = gateShot(ctx.label, high ? 5 : 4, "spring");
      [[120, 71], [190, 72], [640, 73], [700, 74]].forEach(([x, sd]) => { c += other(sd, x, CF, 1.2); });
      c += walk(-260, 0, 0.2, 2.4, me(ctx, st, 400, CF + 14, 1.5, { mood: "happy" })) + petals(10, 18);
      return [
        cutShot(2.8, a + vignette(CW, CH), { s0: 1, s1: 1.25, ox: 410, oy: 300 }),
        cutShot(3.2, b, { s0: 1.05, s1: 1.05 }),
        cutShot(3.4, c, { s0: 1.2, s1: 1.0, ox: 400, oy: 320 }),
      ];
    },
    // 수능 morning: a cold blue dawn walk under the last street lights, a police escort, the gate, the bell.
    exam(ctx) {
      const st = ctx.stage;
      let a = sky(0, 0, CW, CH, { tod: "dawn", seed: 3 }) + ridge(0, CW, 260, 90, 5, "mtnFar", "winter") + haze(0, 200, CW, 80, 0.5);
      for (let i = 0; i < 7; i++) a += withLit(0.7, () => aptSlab(i * 120 - 20, CG - 10, 90, 150 + (i % 3) * 30, 10, 70 + i));
      a += R(0, CG - 10, CW, CH, "pavement") + R(0, CG + 30, CW, CH, "asphalt") + R(0, CG + 28, CW, 4, "curb");
      for (let i = 0; i < 4; i++) a += G(80 + i * 220, CG, pool(20, 8, 70, 18, "sodium", 0.6) + R(-3, -190, 6, 190, "steel2") + R(-3, -190, 30, 5, "steel2", 2) + pool(26, -184, 40, 40, "sodium", 0.7) + O(26, -184, 5, "sodium"));
      a += particles("winter", 0, 0, CW, CG, false, 10, 4) + R(0, 0, CW, CH, "dawnTop", 0, null, 0, "opacity:0.12");
      let pair = mom(ctx, 330, CF, 1.45, { pose: "hold", mood: "ok" }) + me(ctx, st, 440, CF, 1.5, { mood: "ok" });
      for (let i = 0; i < 3; i++) pair += G(466, 214, A("rise", E(0, 0, 10, 6, "steamE", null, 0, "opacity:0.8"), "--del:" + (i * 0.9) + "s"));
      a += walk(-200, 0, 0, 3.0, pair);
      let b = sky(0, 0, CW, CH, { tod: "dawn", seed: 21 });
      for (let i = 0; i < 9; i++) b += block(i * 92 - 10, CG, 84, 120 + (i % 3) * 40, i % 2 ? "bldFar" : "bldMid", i + 80, 12);
      b += R(0, CG, CW, CH - CG, "asphalt") + L(0, CG + 30, CW, CG + 30, "lane", 3, "stroke-dasharray:30 20");
      // Riders first, sitting down into the bodywork drawn over their legs; the officer wears a helmet.
      let bike = G(-46, -18, avatar({ age: "teen", outfit: "uniform", look: lookFor(88, "f"), mood: "stressed" }), 0.85);
      bike += G(-6, -22, avatar({ age: "adult", outfit: "casual", gear: "helmet", look: { hair: 0, skin: 0, shirt: 2, sex: "m" }, mood: "ok" }), 0.9);
      bike += O(-56, -22, 24, "inkE") + O(60, -22, 24, "inkE") + O(-56, -22, 9, "steel") + O(60, -22, 9, "steel") + P("M-74 -36 L-60 -64 L-10 -76 L60 -66 L84 -36 Z", "paperE") + R(-50, -60, 100, 10, "accentBlue", 3) + R(-60, -50, 120, 4, "neonC", 1, null, 0, "opacity:0.8");
      bike += R(-78, -110, 4, 50, "steel2") + G(-76, -114, A("pulse", O(0, 0, 9, "accentRed")) + A("pulse", O(12, 0, 9, "accentBlue"), "--del:-1.2s")) + pool(-70, -114, 50, 40, "accentRed", 0.5);
      for (let i = 0; i < 5; i++) bike += L(100 + i * 10, -100 + i * 18, 190 + i * 30, -100 + i * 18, "paperE", 2, "opacity:0.4");
      b += walk(820, -820, 0.2, 3.0, G(400, CF, bike, 1.2));
      let c = gateShot(ctx.label, 4, "fall");
      [[70, 81, "accentRed"], [150, 82, "accentBlue"], [230, 83, "fabric3"]].forEach(([x, sd, col], i) => {
        c += G(x, CF, A("hop", R(-34, -230, 68, 46, "paperE", 2) + R(-34, -230, 68, 10, col) + L(-24, -206, 24, -206, "inkE", 3, "opacity:0.6") + R(-2, -186, 4, 60, "woodLight2") + avatar({ age: "teen", outfit: "uniform", look: lookFor(sd, sd % 2 ? "m" : "f"), mood: "happy", pose: "cheer" }), "--del:-" + i * 0.35 + "s"), 1.15);
      });
      c += G(310, CF - 20, R(-26, -34, 52, 40, "thermos", 6) + E(0, -34, 26, 8, "paperE") + G(0, -40, A("rise", P("M-6 0 q-4 -6 0 -12 M6 0 q4 -6 0 -12", null, "steamE", 2))));
      c += mom(ctx, 470, CF + 8, 1.4, { pose: "hold" }) + walk(0, 170, 1.4, 1.8, me(ctx, st, 560, CF + 12, 1.45, { mood: "ok" }));
      let d = stage({ wall: "wallSchool", floor: "lino", lower: [80, "wainscot"] }) + tube(200, 10, 120) + tube(480, 10, 120) + board(180, 70, 360, 120, { seed: 4, writing: false }) + clock(640, 100, 26, 8);
      for (let i = 0; i < 4; i++) d += deskP(110 + i * 190, CG + 26, 1.5, CVP, { tape: true, paper: true }) + backHead(110 + i * 190, CG - 30, 1.2, i % 2 ? "uniformE" : "hoodieE");
      d += me(ctx, st, 400, CF + 30, 1.4, { mood: "stressed" }) + G(400, CF - 10, R(-70, -14, 140, 12, "formica", 2) + R(-30, -22, 60, 9, "omr", 1));
      d += G(690, 200, fx("c-ring", 0.4, P("M-24 20 Q-24 -24 0 -26 Q24 -24 24 20 Z", "brass") + O(0, 24, 6, "brass2")));
      d += fx("c-fade", 0.5, G(690, 190, A("pulse", P("M34 -20 q14 16 0 34 M48 -30 q22 26 0 54 M-34 -20 q-14 16 0 34 M-48 -30 q-22 26 0 54", null, "brass", 2.5))));
      return [
        cutShot(3.0, a + vignette(CW, CH), { s0: 1.05, s1: 1.12 }),
        cutShot(3.2, b + vignette(CW, CH), { s0: 1.0, s1: 1.04 }),
        cutShot(3.4, c + vignette(CW, CH), { s0: 1.12, s1: 1.12, x0: 40, x1: -40 }),
        cutShot(3.0, d + vignette(CW, CH), { s0: 1.0, s1: 1.3, ox: 420, oy: 320 }),
      ];
    },
    // Results day: the phone buzzes in the dark room, the score report fills in, your face.
    results(ctx) {
      const st = ctx.stage, mood = ctx.react || "ok";
      let a = stage({ night: true, floor: "wood" }) + windowView(100, 80, 190, 150, { night: true, season: "winter", seed: 33, curtain: true });
      a += shadow(590, 414, 140, 8) + boxP(470, 296, 260, 14, 0.08, CVP, "woodDesk2", "woodDesk", "woodDesk2") + R(484, 296, 10, 120, "woodDesk2") + R(706, 296, 10, 120, "woodDesk2");
      a += G(600, 280, pool(0, 0, 80, 50, "monitorGlow", 0.8) + fx("c-ring", 0.5, R(-22, -8, 44, 12, "inkE", 4) + R(-18, -6, 36, 8, "phoneScreen", 2)));
      a += walk(-260, 0, 0.3, 2.2, me(ctx, st, 380, CF, 1.5, { mood: "stressed" }));
      let b = R(0, 0, CW, CH, "nightTop") + pool(400, 225, 300, 240, "monitorGlow", 0.5);
      b += R(260, 20, 280, 420, "inkE", 34) + R(276, 60, 248, 340, "paperE", 6) + R(276, 60, 248, 40, "accentBlue", 6, null, 0, "opacity:0.85") + O(400, 40, 5, "steel2");
      const cols = ["fabric4", "accentBlue", "fabric3", "fabric2"];
      (ctx.grades || [3, 3, 3, 3]).slice(0, 4).forEach((gr, i) => {
        const h = Math.max(14, ((10 - gr) / 9) * 230), x = 300 + i * 56;
        b += R(x, 140, 40, 240, "paperE2", 3) + fx("c-grow", 0.4 + i * 0.4, R(x, 380 - h, 40, h, cols[i], 3));
        b += fx("c-pop", 0.9 + i * 0.4, O(x + 20, 370 - h - 16, 11, gr <= 1 ? "brass" : gr <= 3 ? "fabric3" : "steel"));
      });
      let c = living(ctx);
      const yay = mood === "happy";
      c += mom(ctx, 190, CF, 1.6, { pose: yay ? "cheer" : "hold" }) + dad(ctx, 620, CF, 1.65, { pose: yay ? "cheer" : "hold" });
      c += me(ctx, st, 400, CF + 160, 2.5, { mood, pose: yay ? "cheer" : "stand" }) + (yay ? confetti(30, 7) : "");
      return [
        cutShot(2.8, a + vignette(CW, CH, 0.8), { s0: 1, s1: 1.3, ox: 600, oy: 290 }),
        cutShot(3.4, b + vignette(CW, CH, 0.8), { s0: 0.96, s1: 1.06 }),
        cutShot(3.0, c + vignette(CW, CH, 0.8), { s0: 1.12, s1: 1.0, ox: 400, oy: 260 }),
      ];
    },
    // Admission: the family at the laptop in the dark living room, the stamp, the cheer.
    offers(ctx) {
      const st = ctx.stage;
      let a = stage({ night: true, floor: "wood" }) + windowView(90, 70, 160, 140, { night: true, season: "winter", seed: 35, curtain: true });
      a += shadow(400, 400, 240, 12) + boxP(180, 370, 440, 70, 0.06, CVP, "sofaE", "sofaE2", "sofaE2") + R(190, 270, 420, 50, "sofaE2", 10);
      a += mom(ctx, 250, CF, 1.4, { pose: "hold", mood: "ok" }) + dad(ctx, 560, CF, 1.45, { pose: "hold", mood: "ok" }) + me(ctx, st, 400, CF + 20, 1.5, { mood: "stressed" });
      a += pool(400, 300, 200, 160, "monitorGlow", 0.8) + G(400, 330, R(-60, -50, 120, 70, "inkE", 5) + R(-52, -44, 104, 58, "phoneScreen", 2) + R(-76, 20, 152, 8, "steel", 3));
      let b = R(0, 0, CW, CH, "woodDesk2") + R(0, 0, CW, CH, null, 0, null, 0, fill(def("tbl", (id) => radial(id, [[0, "hiE", 0.15], [1, "aoC", 0.4]], 0.5, 0.45, 0.8))));
      b += fx("c-thud", 0.95, G(400, 225, R(-166, -196, 340, 400, "aoC", 4, null, 0, "opacity:0.25") + R(-170, -200, 340, 400, "paperE", 2) + O(0, -150, 26, null, "brass", 3) + O(0, -150, 18, "brass", null, 0, "opacity:0.3") + R(-120, -90, 240, 8, "paperE2", 3) + R(-120, -60, 200, 8, "paperE2", 3) + R(-120, -30, 220, 8, "paperE2", 3) + R(-120, 0, 160, 8, "paperE2", 3)));
      b += G(470, 300, fx("c-stamp", 0.8, O(0, 0, 66, null, "stampRed", 8) + O(0, 0, 52, "stampRed", null, 0, "opacity:0.12") + P("M-30 2 L-8 26 L34 -24", null, "stampRed", 10)));
      b += fx("c-flash", 0.95, R(0, 0, CW, CH, "paperE"));
      let c = living(ctx) + pool(400, 160, 380, 220, "lampWarm", 0.5) + flags(40, 760, 50, 3);
      c += G(170, CF, A("hop", avatar({ age: "adult", outfit: "casual", look: { hair: 3, skin: ctx.look.skin, shirt: 0, sex: "f" }, mood: "happy", pose: "cheer" })), 1.5);
      c += G(640, CF, A("hop", avatar({ age: "adult", outfit: "casual", look: { hair: 1, skin: ctx.look.skin, shirt: 2, sex: "m" }, mood: "happy", pose: "cheer" }), "--del:-0.5s"), 1.55);
      c += G(400, CF + 10, A("hop", me(ctx, st, 0, 0, 1.7, { mood: "happy", pose: "cheer" }), "--del:-0.25s"));
      c += confetti(46, 11);
      return [
        cutShot(3.0, a + vignette(CW, CH, 0.8), { s0: 1, s1: 1.45, ox: 400, oy: 320 }),
        cutShot(2.6, b, { s0: 1.06, s1: 1.0 }),
        cutShot(3.2, c + vignette(CW, CH, 0.6), { s0: 1.0, s1: 1.08 }),
      ];
    },
    // The ending: a suitcase on a road under cherry trees, then through the university gate. No offer: a dusk road.
    end(ctx) {
      const suitcase = (x) => G(x, CF, shadow(0, 0, 26, 4) + R(-22, -60, 44, 56, "suitcase", 5) + R(-22, -60, 8, 56, "hiE", 4, null, 0, "opacity:0.15") + R(-8, -70, 16, 12, null, 3, "steel2", 3) + O(-12, -2, 4, "inkE") + O(12, -2, 4, "inkE"));
      if (!ctx.label) {
        let a = sky(0, 0, CW, CH, { tod: "gold", seed: 12, sunX: 0.7, sunY: 0.58, sunR: 20 }) + ridge(0, CW, 300, 100, 8, "mtnFar", "fall") + haze(0, 220, CW, 90, 0.7) + ridge(0, CW, 330, 50, 9, "mtnMid", "fall");
        a += R(0, 330, CW, 120, "vegFa2") + P("M330 450 Q380 380 520 334 L540 334 Q440 390 450 450 Z", "asphalt");
        for (let i = 0; i < 5; i++) { const t = 1 - i * 0.18, x = 560 + 220 * t; a += L(x, 330 + 100 * t, x, 330 + 100 * t - 200 * t, "trunk", 4 * t) + L(x - 20 * t, 340 + 100 * t - 200 * t, x + 20 * t, 340 + 100 * t - 200 * t, "trunk", 3 * t); }
        a += walk(0, 150, 0.2, 3.0, me(ctx, "uni", 360, CF, 1.4, { mood: "tired" }));
        const b = sky(0, 0, CW, CH, { tod: "night", seed: 44, sunX: 0.8, sunY: 0.18 }) + ridge(0, CW, 330, 80, 3, "mtnNear", "fall") + withLit(0.9, () => landscape(0, 220, CW, 160, { kind: "town", season: "fall", seed: 9, trees: false })) +
          R(0, 360, CW, 90, "asphalt") + me(ctx, "uni", 400, CF, 1.5, { mood: "ok" });
        return [cutShot(3.2, a + vignette(CW, CH), { s0: 1.0, s1: 1.1, ox: 450, oy: 340 }), cutShot(3.0, b + vignette(CW, CH, 0.8), { s0: 1.2, s1: 1.0, ox: 400, oy: 260 })];
      }
      let a = sky(0, 0, CW, CH, { tod: "day", seed: 14 }) + ridge(0, CW, 250, 80, 4, "mtnFar", "spring") + haze(0, 180, CW, 80, 0.5);
      let road = "";
      for (let i = 0; i < 9; i++) road += tree(60 + i * 160, CG + 4, "spring", 1.5, "cherry");
      a += walk(0, -480, 0, 3.0, road) + R(0, CG, CW, CH - CG, "pathE") + me(ctx, "uni", 390, CF, 1.5, { mood: "happy" }) + suitcase(440) + petals(15, 24);
      let b = gateShot(ctx.label, 4, "spring") + flags(232, 568, 168, 1);
      b += fx("c-out", 2.5, walk(-300, 0, 0.1, 2.4, me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy" }) + suitcase(446)));
      b += fx("c-fade", 2.5, me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy", pose: "cheer" }) + suitcase(446)) + petals(16, 26);
      let c = gateShot(ctx.label, 4, "spring") + me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy", pose: "cheer" }) + petals(17, 30);
      for (let i = 0; i < 4; i++) c += G(120 + i * 60, 70 + (i % 2) * 20, A("drift", P("M-8 0 q4 -4 8 0 q4 -4 8 0", null, "inkE", 1.4, "opacity:0.6")));
      return [
        cutShot(3.0, a, { s0: 1.05, s1: 1.05 }),
        cutShot(3.6, b, { s0: 1.15, s1: 1.05, ox: 400, oy: 330 }),
        cutShot(3.0, c, { s0: 1.6, s1: 1.0, ox: 400, oy: 360 }),
      ];
    },
    // Moving house: the ladder truck (사다리차) at the window and the moving truck pulling away; the view
    // from the new window.
    move(ctx) {
      let a = homeStreet(ctx, "day", ctx.season);
      a += G(640, CF + 22, L(-40, -60, -200, -300, "neonC", 8) + L(-40, -60, -200, -300, "inkE", 1) + R(-230, -320, 50, 26, "steel", 2) + R(-60, -70, 120, 50, "neonC", 4) + O(-30, -14, 18, "inkE") + O(40, -14, 18, "inkE"));
      let truck = shadow(-40, -4, 140, 10) + R(-150, -150, 210, 130, "paperE", 4) + R(-150, -150, 210, 10, "hiE", 2, null, 0, "opacity:0.3") + R(60, -110, 80, 90, "accentBlue", 8) + R(78, -100, 44, 34, "winDay", 4) + O(-100, -14, 24, "inkE") + O(90, -14, 24, "inkE") + O(-100, -14, 9, "steel") + O(90, -14, 9, "steel");
      for (let i = 0; i < 3; i++) truck += R(-138 + i * 64, -184, 56, 36, "cardboard", 2) + L(-138 + i * 64, -170, -82 + i * 64, -170, "tape", 3);
      a += walk(0, 900, 1.0, 2.2, G(520, CF + 22, truck)) + mom(ctx, 260, CF + 20, 1.3, { pose: "wave", mood: "ok" });
      let b = stage({ floor: "wood", wall: "wallpaper2" }) + windowView(150, 50, 500, 280, { view: ctx.view, season: ctx.season, seed: 26 }) + sunPatch(260, 380, 360, 40, 100);
      for (let i = 0; i < 4; i++) b += shadow(115 + i * 170, CF - 40 - (i % 2) * 30 + 50, 40, 5) + boxP(80 + i * 170, CF + 10 - (i % 2) * 30, 70, 50, 0.08, CVP, "cardboard", "cardboard2", "cardboard2") + L(80 + i * 170, CF - 22 - (i % 2) * 30, 150 + i * 170, CF - 22 - (i % 2) * 30, "tape", 4);
      b += me(ctx, ctx.stage, 400, CF + 20, 1.5, { mood: "happy" });
      return [cutShot(3.2, a, { s0: 1.0, s1: 1.08, x0: 0, x1: -30 }), cutShot(3.2, b + vignette(CW, CH), { s0: 1.2, s1: 1.0, ox: 400, oy: 200 })];
    },
  };
  // The shots for one cutscene: [{ t: seconds, svg }]. ctx is app.js's art context plus what the film
  // needs (items, label, grades, react). VIEW and REGION follow the region, as everywhere else.
  function cutscene(name, ctx) {
    VIEW = (ctx && ctx.view) || "city";
    REGION = (ctx && ctx.region) || "";
    begin();
    return CUTS[name] ? CUTS[name](ctx).map((c) => ({ t: c.t, svg: tidy(c.svg) })) : [];
  }

  // ---------- the map ----------
  // South Korea (with the North faded above the DMZ) for the birth screen and the move dialog. Places
  // sit at their real longitude and latitude; one degree of latitude is drawn 1.25× a degree of
  // longitude, roughly what it is at 37°N. Seoul's six areas are too close together to tap, so they
  // get a magnified inset in the Yellow Sea, joined to Seoul by a dashed line.
  // opts: { states: { id: "home" | "open" | "closed" }, sel: id, labels: { id: name }, from: id
  // (draws a dashed route from there to sel), aria, px: the width it will be drawn at in CSS pixels }.
  // Names stay at least 11px on screen: on a small map that only fits home, the selected place and
  // the route's start, so the rest are named by their aria-label. Points are focusable buttons (data-place) for
  // app.js to wire up; the art has no text of its own, only the names app.js passes in.
  const MW = 755, MH = 750;
  const mx = (lon) => Math.round((lon - 124.4) * 100);
  const my = (lat) => Math.round((39.0 - lat) * 125);
  const mpath = (pts) => "M" + pts.map(([lon, lat]) => mx(lon) + " " + my(lat)).join(" L") + " Z";
  const SOUTH = [[126.5, 37.75], [126.7, 37.95], [127.0, 38.2], [127.5, 38.3], [128.1, 38.3], [128.35, 38.6], [128.6, 38.15], [128.9, 37.75], [129.15, 37.45], [129.35, 37.0],
    [129.42, 36.5], [129.37, 36.08], [129.57, 36.07], [129.45, 35.8], [129.37, 35.5], [129.15, 35.15], [128.95, 35.05], [128.6, 34.92], [128.4, 34.84], [128.0, 34.95], [127.75, 34.74],
    [127.45, 34.6], [127.0, 34.56], [126.75, 34.42], [126.53, 34.3], [126.33, 34.6], [126.4, 34.82], [126.33, 35.1], [126.48, 35.45], [126.66, 35.76], [126.6, 36.0], [126.5, 36.35],
    [126.15, 36.72], [126.48, 36.92], [126.78, 36.98], [126.62, 37.2], [126.6, 37.45]];
  const NORTH = [[126.5, 37.75], [125.7, 37.9], [125.2, 37.75], [125.05, 38.0], [125.4, 38.55], [125.15, 39.2], [127.4, 39.2], [127.6, 38.9], [128.0, 38.75], [128.35, 38.6],
    [128.1, 38.3], [127.5, 38.3], [127.0, 38.2], [126.7, 37.95]];
  const DMZ = [[126.5, 37.75], [126.7, 37.95], [127.0, 38.2], [127.5, 38.3], [128.1, 38.3], [128.35, 38.6]];
  const PLACES = {
    gangnam: [127.05, 37.5], nowon: [127.07, 37.65], mokdong: [126.87, 37.53], mapo: [126.92, 37.57], gwanak: [126.95, 37.47], gangdong: [127.14, 37.54],
    suwon: [127.03, 37.27], busan: [129.07, 35.18], daegu: [128.6, 35.87], gwangju: [126.85, 35.16], daejeon: [127.38, 36.35], pohang: [129.36, 36.02],
    jeonju: [127.15, 35.82], cheongju: [127.49, 36.64], jeju: [126.53, 33.45], pyeongchang: [128.39, 37.37], haenam: [126.6, 34.57],
  };
  const SEOUL_IDS = ["gangnam", "nowon", "mokdong", "mapo", "gwanak", "gangdong"];
  // Which side of the dot each name goes on, so names stay on land or open sea and don't collide.
  const LABEL_SIDE = { suwon: "r", busan: "r", daegu: "l", gwangju: "l", daejeon: "l", pohang: "r", jeonju: "l", cheongju: "r", jeju: "r", pyeongchang: "r", haenam: "l" };
  const SEOUL = [126.98, 37.55], INSET = { x: 116, y: 660, r: 72, k: 330 };
  function mapPos(id) {
    const ll = PLACES[id];
    if (SEOUL_IDS.indexOf(id) < 0) return [mx(ll[0]), my(ll[1])];
    return [Math.round(INSET.x + (ll[0] - SEOUL[0]) * INSET.k * 0.95), Math.round(INSET.y + (SEOUL[1] - ll[1]) * INSET.k * 1.25)];
  }
  // A name beside its dot. Its width is estimated (Hangul is about square, Latin about 0.6 em), and a
  // name that would run off the map goes on the other side instead.
  function mapLabel(x, y, text, side, size, cls) {
    const w = String(text).split("").reduce((a, ch) => a + (/[\u1100-\uffff]/.test(ch) ? 1 : 0.6), 0) * size;
    if (side === "l" && x - 13 - w < 2) side = "r";
    else if (side !== "l" && x + 13 + w > MW - 2) side = "l";
    const dx = side === "l" ? -13 : 13;
    return '<text class="kmap-lbl' + (cls ? " " + cls : "") + '" x="' + (x + dx) + '" y="' + (y + size * 0.35) + '" text-anchor="' + (side === "l" ? "end" : "start") + '" style="font-size:' + size + 'px">' + esc(text) + "</text>";
  }
  // Real geography, when places.js is loaded: every municipality (시군구) as land with a thin border,
  // the provinces on top with a stronger one, and the home area tinted. Without it the hand-drawn
  // outline above stands in.
  const GEO = root.SuneungPlaces || null;
  // Seoul's own districts in the inset, by the affine map from the main projection to the inset's.
  const ISX = (INSET.k * 0.95) / 100, ISY = INSET.k / 100;
  const INSET_T = "translate(" + (INSET.x - 258 * ISX).toFixed(1) + " " + (INSET.y - 181.25 * ISY).toFixed(1) + ") scale(" + ISX + " " + ISY + ")";
  const toInset = ([x, y]) => [INSET.x + (x - 258) * ISX, INSET.y + (y - 181.25) * ISY];
  const inSeoul = (lat, lon) => lat > 37.42 && lat < 37.72 && lon > 126.76 && lon < 127.19;
  // An area's bounding box in map units, from its municipality outlines (cached).
  const BOX = {};
  function areaBox(id) {
    if (BOX[id] || !GEO || !GEO.areas[id]) return BOX[id] || null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const c of GEO.areas[id].munis) {
      const n = (GEO.geo.munis[c] || "").match(/-?\d+(\.\d+)?/g) || [];
      for (let i = 0; i + 1 < n.length; i += 2) { const x = +n[i], y = +n[i + 1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    return (BOX[id] = [x0, y0, x1, y1]);
  }
  // The land is drawn in a restrained cartographic style: one light from the north-west across the whole
  // peninsula (a single gradient in map space, passed to the paths as --kland), soft relief along the
  // Baekdudaegan spine and on Hallasan, a pale shallow-water halo along the coast (the province outlines
  // drawn once in <defs> and used twice), and a sea that deepens offshore.
  const SPINE = [[128.35, 38.6], [128.5, 38.1], [128.75, 37.7], [128.95, 37.3], [129.05, 36.9], [128.95, 36.5], [128.6, 36.2], [128.2, 36.0], [127.9, 35.7], [127.65, 35.35]];
  const SOBAEK = [[128.2, 36.0], [127.95, 36.2], [127.7, 36.55], [127.95, 36.95], [128.35, 37.05]];
  function mapDefs(o) {
    const land = nid("kl"), sea = nid("ks"), pv = nid("pv");
    let d = '<linearGradient id="' + land + '" gradientUnits="userSpaceOnUse" x1="120" y1="40" x2="640" y2="700">' + stp([0, "landHi"]) + stp([0.55, "landE"]) + stp([1, "landLo"]) + "</linearGradient>" +
      '<radialGradient id="' + sea + '" gradientUnits="userSpaceOnUse" cx="340" cy="330" r="560">' + stp([0, "mapShallow"]) + stp([0.45, "mapSeaE"]) + stp([1, "mapSeaDeep"]) + "</radialGradient>";
    if (GEO) d += '<g id="' + pv + '">' + GEO.geo.provinces.map((p) => '<path d="' + p + '" vector-effect="non-scaling-stroke"/>').join("") + "</g>";
    return { d, land, sea, pv };
  }
  const relief = () => {
    const path = (pts) => "M" + pts.map(([lon, lat]) => mx(lon) + " " + my(lat)).join(" L");
    let s = "";
    for (const [w, op] of [[46, 0.07], [28, 0.08], [14, 0.1]]) s += P(path(SPINE) + " " + path(SOBAEK), null, "reliefE", w, "opacity:" + op);
    return s + E(mx(126.53), my(33.37), 16, 9, "reliefE", null, 0, "opacity:0.14") + E(mx(126.53), my(33.37), 8, 4.5, "reliefE", null, 0, "opacity:0.14");
  };
  function realLand(home, focus, md) {
    const hm = new Set(home && GEO.areas[home] ? GEO.areas[home].munis : []);
    let s = '<use href="#' + md.pv + '" class="kmap-halo"/>';
    for (const c in GEO.geo.munis) s += '<path class="kmap-muni' + (hm.has(c) ? " home" : "") + '" d="' + GEO.geo.munis[c] + '"/>';
    if (!focus) s += relief();
    s += '<use href="#' + md.pv + '" class="kmap-prov"/>';
    return s;
  }
  function koreaMap(opts) {
    const o = opts || {};
    const states = o.states || {}, labels = o.labels || {};
    const fade = nid("nfade"), clip = nid("iclip");
    const focus = o.focus && GEO ? areaBox(o.focus) : null;
    const md = mapDefs(o);
    let s = "<defs>" + md.d + "<linearGradient id=\"" + fade + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C("land2") + '" stop-opacity="0.12"/><stop offset="1" stop-color="' + C("land2") + '" stop-opacity="0.6"/></linearGradient>' +
      '<clipPath id="' + clip + '"><circle cx="' + INSET.x + '" cy="' + INSET.y + '" r="' + INSET.r + '"/></clipPath></defs>';
    s += R(-400, -400, MW + 800, MH + 800, null, 0, null, 0, "fill:url(#" + md.sea + ")");
    s += P(mpath(NORTH), null, null, 0, "fill:url(#" + fade + ")");
    if (GEO) s += realLand(o.home, focus, md);
    else {
      s += P(mpath(SOUTH), "landE", "coastE", 1.2);
      // Islands: Jeju, Geoje, Jindo, Ganghwa, Ulleungdo and Dokdo.
      s += E(mx(126.55), my(33.38), 38, 16, "landE", "coastE", 1.2) + E(mx(128.62), my(34.88), 8, 10, "landE", "coastE", 1) + E(mx(126.25), my(34.45), 9, 8, "landE", "coastE", 1) +
        E(mx(126.45), my(37.7), 7, 8, "landE", "coastE", 1) + O(mx(130.87), my(37.5), 5, "landE", "coastE", 1) + O(mx(131.86), my(37.24), 2.2, "landE", "coastE", 1) + O(mx(131.87), my(37.25), 1.6, "landE", "coastE", 1);
      s += relief();
    }
    s += P("M" + DMZ.map(([lon, lat]) => mx(lon) + " " + my(lat)).join(" L"), null, "dmz", 1.6, "stroke-dasharray:5 5");
    // Zoomed on one area (the school dialog): its real schools, and none of the national furniture.
    if (focus) return focusMap(o, s, focus, md);
    // Seoul on the mainland, and the inset it opens into.
    const [sx, sy] = [mx(SEOUL[0]), my(SEOUL[1])];
    s += O(sx, sy, 11, null, "inset", 1.6) + L(sx - 8, sy + 8, INSET.x + 40, INSET.y - INSET.r + 10, "inset", 1.2, "stroke-dasharray:4 4");
    if (GEO) {
      const hm = new Set(o.home && GEO.areas[o.home] ? GEO.areas[o.home].munis : []);
      let gu = "";
      for (const c in GEO.geo.munis) if (c.startsWith("11")) gu += '<path class="kmap-muni' + (hm.has(c) ? " home" : "") + '" d="' + GEO.geo.munis[c] + '"/>';
      s += O(INSET.x + 2, INSET.y + 3, INSET.r, "aoC", null, 0, "opacity:0.12") + O(INSET.x, INSET.y, INSET.r, "mapSeaE", null, 0) + '<g clip-path="url(#' + clip + ')"><g transform="' + INSET_T + '">' + gu + "</g></g>" + O(INSET.x, INSET.y, INSET.r, null, "inset", 1.8);
    } else {
      s += O(INSET.x, INSET.y, INSET.r, "landE", "inset", 1.8) + P("M" + (INSET.x - 66) + " " + (INSET.y + 4) + " Q" + (INSET.x - 30) + " " + (INSET.y + 14) + " " + INSET.x + " " + (INSET.y + 2) + " T" + (INSET.x + 66) + " " + (INSET.y - 2), null, "mapSeaE", 7);
    }
    const unit = o.px ? o.px / MW : 0.8; // CSS px per map unit
    const minU = Math.ceil(11.5 / unit);
    const big = Math.max(21, minU), small = Math.max(15, minU);
    const tight = minU > 24;
    // Seoul's six districts are too close for six names at a readable size, so the inset only names
    // home and the place picked (the rest have their name as a tooltip and an aria-label).
    const key = (id) => id === o.home || id === o.sel || id === o.from || states[id] === "home";
    const named = (id) => key(id) || (!tight && SEOUL_IDS.indexOf(id) < 0);
    // On a small map the big Seoul label sits above-left of its ring, clear of Suwon and Incheon-side names.
    if (labels.seoul) s += mapLabel(sx - 6, tight ? sy - minU * 0.8 : sy, labels.seoul, "l", Math.max(20, minU), "kmap-seoul");
    // Your school, as a small star where it really is (in the inset if it's in Seoul).
    for (const m of o.schools || []) {
      const p = [mx(m.lon), my(m.lat)];
      const [x, y] = inSeoul(m.lat, m.lon) ? toInset(p) : p;
      s += G(x, y, P("M0 -9 L2.6 -3 L9 -2.8 L4 1.5 L5.6 8 L0 4.4 L-5.6 8 L-4 1.5 L-9 -2.8 L-2.6 -3 Z", null, null, 0), 1, "kmap-school " + (m.cls || ""));
    }
    // A dashed route for a move, drawn under the dots.
    if (o.from && o.sel && o.from !== o.sel && PLACES[o.from] && PLACES[o.sel]) {
      const [ax, ay] = SEOUL_IDS.indexOf(o.from) >= 0 ? [sx, sy] : mapPos(o.from), [bx, by] = SEOUL_IDS.indexOf(o.sel) >= 0 ? [sx, sy] : mapPos(o.sel);
      s += P("M" + ax + " " + ay + " Q" + ((ax + bx) / 2 + 40) + " " + (Math.min(ay, by) - 60) + " " + bx + " " + by, null, "route", 3, "stroke-dasharray:8 7");
    }
    for (const id in PLACES) {
      const [x, y] = mapPos(id);
      const st = states[id] || "open";
      const sel = o.sel === id;
      const inset = SEOUL_IDS.indexOf(id) >= 0;
      const r = inset ? 8 : 9.5;
      // A wider invisible circle makes the dot easy to tap; the visible one is coloured by state in CSS:
      // a ring with a dot in it, and a soft shadow under it.
      let dot = O(0, 0, r + 10, null, null, 0, "fill:transparent") + O(0.8, 1.6, r, "aoC", null, 0, "opacity:0.18") + '<circle class="kd" r="' + r + '"/>' + '<circle class="kc" r="' + (r * 0.38).toFixed(1) + '"/>';
      if (st === "home") dot += A("kmap-pulse", O(0, 0, r + 6, null, "pin", 2));
      if (sel) dot += O(0, 0, r + 5, null, "sel", 2.5);
      s += '<g class="kmap-pt ' + st + (sel ? " sel" : "") + '" data-place="' + id + '" transform="translate(' + x + " " + y + ')"' + (o.static ? "" : ' tabindex="0" role="button"') +
        (labels[id] ? ' aria-label="' + esc(labels[id]) + '"' : "") + ">" + (labels[id] && !named(id) ? "<title>" + esc(labels[id]) + "</title>" : "") + dot + "</g>";
      if (labels[id] && named(id)) s += mapLabel(x, y, labels[id], inset ? (["mokdong", "mapo", "gwanak"].indexOf(id) >= 0 ? "l" : "r") : LABEL_SIDE[id] || "r", inset ? small : big, (st === "home" ? "home" : "") + (sel ? " sel" : ""));
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + MW + " " + MH + '" class="kmap" style="--kland:url(#' + md.land + ')"' + (o.aria ? ' role="img" aria-label="' + esc(o.aria) + '"' : ' aria-hidden="true"') + ">" + s + "</svg>";
  }

  // One area up close for the school dialog: its municipalities, and each option's real school as a
  // numbered marker (o.schools: { lat, lon, n, cls, id }; id makes it data-pick for taps). Schools outside the area (special schools far
  // away) get no marker; the dialog names their city instead.
  function focusMap(o, s, box, md) {
    const [x0, y0, x1, y1] = box;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 2;
    const vx = x0 - pad, vy = y0 - pad, vw = x1 - x0 + 2 * pad, vh = y1 - y0 + 2 * pad;
    const k = Math.max(vw, vh) / 300; // marker size in map units, so markers look the same at any zoom
    for (const m of o.schools || []) {
      const x = mx(m.lon), y = my(m.lat);
      if (x < vx || x > vx + vw || y < vy || y > vy + vh) continue;
      const mark = G(x, y, O(0.8, 1.6, 9, "aoC", null, 0, "opacity:0.2;stroke:none") + O(0, 0, 9, null, null, 0) + (m.n != null ? '<text y="3.6" text-anchor="middle">' + esc(String(m.n)) + "</text>" : ""), k, "kmap-sch " + (m.cls || ""));
      s += m.id ? '<g data-pick="' + esc(m.id) + '">' + mark + "</g>" : mark;
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [vx, vy, vw, vh].map((v) => v.toFixed(1)).join(" ") + '" preserveAspectRatio="xMidYMid meet" class="kmap kmap-focus"' +
      (o.aria ? ' role="img" aria-label="' + esc(o.aria) + '"' : ' aria-hidden="true"') + ' style="--k:' + k.toFixed(3) + ";--kland:url(#" + md.land + ')">' + s + "</svg>";
  }

  // ---------- the share card ----------
  // A result card for the end of a life, laid out like a film card: a still of you in your region at
  // the golden hour on the left; on the right the title, your name in a serif, where and into what you
  // were born, how it ended, your best Suneung grades and a five-step ladder from the family you were
  // born into to where you are at 30. All words are passed in by app.js. Colours are tokens like the
  // rest of the art; app.js swaps them for their computed values before drawing the card to a canvas.
  const CARD_FONT = "font-family:system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
  const CARD_SERIF = "font-family:'Noto Serif KR','Nanum Myeongjo','AppleMyungjo',Batang,Georgia,'Times New Roman',serif";
  const TL = (x, y, text, fill, size, weight, anchor, font) =>
    '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "start") + '" style="fill:' + C(fill) + ";font-size:" + size + "px;font-weight:" + (weight || 600) + ";" + (font || CARD_FONT) + '">' + esc(text) + "</text>";
  // A string clipped to n characters, so long names and universities stay on the card.
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
  function shareCard(o) {
    const Wc = 600, Hc = 340;
    begin();
    const ctx = o.ctx || {};
    REGION = ctx.region || ""; VIEW = ctx.view || "city";
    const pid = nid("cp");
    // The still: a golden-hour sky over your region, you standing in it, darkening toward the foot.
    let pic = sky(16, 16, 196, 308, { tod: "gold", seed: 3, sunX: 0.75, sunY: 0.5, sunR: 7 }) + landscape(16, 120, 196, 150, { season: "spring", seed: 6, trees: false, horizon: 0.55 }) +
      R(16, 262, 196, 62, "pathE") + R(16, 260, 196, 3, "curb") + tree(40, 268, "spring", 0.9, "cherry") + tree(200, 270, "spring", 0.8, "cherry") +
      R(16, 16, 196, 308, null, 0, null, 0, fill(def("cardfade", (id) => lin(id, [[0, "aoC", 0], [0.6, "aoC", 0], [1, "aoC", 0.35]])))) +
      shadow(114, 304, 26, 4) + person(Object.assign({}, ctx, { stage: "uni" }), 114, 304, 0.74, { mood: o.mood || "happy" });
    let s = R(0, 0, Wc, Hc, "cardBg", 18) + '<clipPath id="' + pid + '"><rect x="16" y="16" width="196" height="308" rx="10"/></clipPath><g clip-path="url(#' + pid + ')">' + pic + "</g>";
    const X = 236, XV = 316;
    s += TL(X, 36, o.title, "cardMute", 11, 700, "start", CARD_FONT + ";letter-spacing:0.14em") + (o.daily ? TL(Wc - 18, 36, clip(o.daily, 30), "cardAccent", 11, 700, "end") : "");
    s += TL(X, 76, clip(o.name, 16), "cardInk2", 32, 700, "start", CARD_SERIF) + R(X, 90, Wc - 18 - X, 1.2, "cardRule");
    let y = 114;
    for (const [k, v] of o.lines) { s += TL(X, y, k, "cardMute", 11, 600) + TL(XV, y, clip(v, 26), "cardInk2", 13.5, 700) + R(X, y + 8, Wc - 18 - X, 0.6, "cardRule"); y += 23; }
    y += 10;
    s += TL(X, y, o.gradesLabel, "cardMute", 11, 600);
    if (o.grades) {
      o.grades.forEach((gr, i) => {
        const x = X + i * 40;
        s += R(x, y + 8, 32, 34, null, 4, "cardRule", 1) + TL(x + 16, y + 32, gr, "cardInk2", 19, 700, "middle", CARD_SERIF) + '<rect x="' + (x + 6) + '" y="' + (y + 37) + '" width="20" height="2.5" rx="1" style="fill:var(--g' + Math.min(6, gr) + ')"/>';
      });
    } else s += TL(X, y + 32, "—", "cardInk2", 20, 700, "start", CARD_SERIF);
    // The ladder: five steps, the family you were born into and (once known) where you are at 30.
    const lx = 474, ly = 296, sw = 22, sh = 13;
    for (let i = 0; i < 5; i++) {
      const k = i + 1, born = k === o.mob.from, now = k === o.mob.to;
      s += R(lx + i * sw, ly - (k + 1) * sh, sw - 5, (k + 1) * sh, now ? "cardAccent" : born ? "cardPanel" : "cardRule", 2, born && !now ? "cardInk2" : null, 1.2, now || born ? "" : "opacity:0.7");
    }
    const cx = (k) => lx + (k - 1) * sw + (sw - 5) / 2, cy = (k) => ly - (k + 1) * sh - 9;
    s += O(cx(o.mob.from), cy(o.mob.from), 3.5, "cardInk2") + TL(cx(o.mob.from), ly + 16, o.mob.labels[0], "cardMute", 10.5, 700, "middle");
    if (o.mob.to) {
      if (o.mob.to !== o.mob.from) s += P("M" + cx(o.mob.from) + " " + (cy(o.mob.from) - 6) + " Q" + (cx(o.mob.from) + cx(o.mob.to)) / 2 + " " + (Math.min(cy(o.mob.from), cy(o.mob.to)) - 26) + " " + cx(o.mob.to) + " " + (cy(o.mob.to) - 7), null, "cardAccent", 1.6, "stroke-dasharray:3 3");
      s += O(cx(o.mob.to), cy(o.mob.to), 4.5, "cardAccent") + TL(cx(o.mob.to), ly + 30, o.mob.labels[1], "cardAccent", 10.5, 700, "middle");
    }
    s += R(X, Hc - 22, 26, 2.5, "cardAccent");
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 ' + Wc + " " + Hc + '" class="share-card" role="img" aria-label="' + esc(o.aria || o.title) + '">' + tidy(defsOut() + s) + "</svg>";
  }

  root.SuneungArt = { portrait, portraitFor, figureFor, koreaMap, areaBox, scene, sceneName, eventArt, screenArt, shareCard, iconFor, moodOf, seasonOf, lookFor, avatar, cutscene, CUT_NAMES: Object.keys(CUTS) };
})(typeof window !== "undefined" ? window : globalThis);
