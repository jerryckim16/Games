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

  // ---------- weather and outdoor bits ----------
  // Falling particles for the season, inside the box (x, y, w, h).
  function particles(season, x, y, w, h, night, n, seed) {
    const r = rand(seed || 7);
    let s = "";
    const count = n || 9;
    for (let i = 0; i < count; i++) {
      const px = x + r() * w, dur = 6 + r() * 6, del = -r() * dur, dx = (r() * 50 - 15).toFixed(0);
      const style = "--d:" + dur.toFixed(1) + "s;--del:" + del.toFixed(1) + "s;--dx:" + dx + "px;--fy:" + (h + 30) + "px";
      let shape;
      if (season === "spring") shape = E(0, 0, 4, 2.4, "blossom", null, 0, "opacity:0.9");
      else if (season === "fall") shape = P("M0 -5 L4 0 L0 5 L-4 0 Z", i % 2 ? "fall" : "fall2");
      else if (season === "winter") shape = O(0, 0, 1.8 + r() * 2, "snow");
      else if (night) { s += G(px, y + 20 + r() * (h - 30), A("pulse", O(0, 0, 2, "lamp")), 1, "", ""); continue; }
      else continue;
      s += G(px.toFixed(0), y - 8, A("fall", shape, style));
    }
    return s;
  }
  function tree(x, y, season, s) {
    const crown = { spring: "blossom", summer: "leaf", fall: "fall", winter: null }[season];
    let b = P("M-4 0 L-3 -46 L-12 -66 M-3 -46 L3 -60 L10 -74 M2 -30 L14 -50", null, "wood2", 5) + R(-5, -46, 10, 46, "wood2", 3);
    if (crown) {
      b += A("sway", O(-14, -64, 20, crown) + O(10, -78, 22, crown) + O(16, -52, 18, season === "fall" ? "fall2" : crown) + O(-4, -88, 18, crown) +
        (season === "spring" ? O(-10, -70, 4, "blossom2") + O(12, -84, 4, "blossom2") + O(18, -56, 3, "blossom2") : season === "summer" ? O(6, -70, 16, "leaf2", null, 0, "opacity:0.5") : ""));
    } else {
      b += P("M-3 -46 L-14 -70 M3 -60 L12 -80 M-8 -58 L-20 -64", null, "wood2", 3) + P("M-16 -70 q4 -4 8 0 M8 -80 q4 -4 8 0", null, "snow", 3);
    }
    return G(x, y, b, s || 1);
  }
  // A window onto the season: sky, sun or moon, a tree, maybe the city, and falling particles.
  // What you see outside: "city", "sea" (Busan, Pohang, Haenam) or "country" (rural counties). Set
  // once per drawing from ctx.view by scene/eventArt/screenArt, so every window in a picture agrees.
  let VIEW = "city";
  function windowView(x, y, w, h, o) {
    const view = o.view || VIEW;
    const id = nid("win"), gid = nid("sky");
    const night = o.night, season = o.season;
    let inner = grad(gid, night ? "night" : "sky", night ? "night2" : "sky2") + R(x, y, w, h, null, 0, null, 0, "fill:url(#" + gid + ")");
    if (night) {
      inner += G(x + w * 0.75, y + h * 0.25, O(0, 0, 9, "moon") + O(4, -3, 8, "night"), 1);
      const r = rand(o.seed || 3);
      for (let i = 0; i < 6; i++) inner += G((x + r() * w).toFixed(0), (y + r() * h * 0.6).toFixed(0), A("twinkle", O(0, 0, 1.2, "star"), "--del:-" + (r() * 3).toFixed(1) + "s"));
    } else {
      inner += O(x + w * 0.78, y + h * 0.22, season === "summer" ? 13 : 10, "sun");
      inner += G(x + w * 0.25, y + h * 0.3, A("drift", E(0, 0, 16, 6, "cloud") + E(10, -4, 10, 6, "cloud")));
    }
    if (view === "country") {
      // Hills and a field instead of buildings.
      inner += P("M" + x + " " + (y + h * 0.7) + " Q" + (x + w * 0.25) + " " + (y + h * 0.42) + " " + (x + w * 0.5) + " " + (y + h * 0.66) + " T" + (x + w) + " " + (y + h * 0.6) + " L" + (x + w) + " " + (y + h) + " L" + x + " " + (y + h) + " Z", "hill");
      inner += R(x, y + h * 0.8, w, h * 0.2, "grass");
    } else if (view === "sea") {
      // The sea along the bottom, with a small headland when the scene wants a city.
      inner += R(x, y + h * 0.66, w, h * 0.34, "sea") + P("M" + x + " " + (y + h * 0.74) + " q" + (w / 8) + " -4 " + (w / 4) + " 0 t" + (w / 4) + " 0 t" + (w / 4) + " 0 t" + (w / 4) + " 0", null, "sea2", 2);
      if (o.city) inner += R(x + w * 0.66, y + h * 0.5, w * 0.14, h * 0.17, "city") + R(x + w * 0.82, y + h * 0.44, w * 0.12, h * 0.23, "city");
    } else if (o.city) {
      inner += R(x, y + h * 0.62, w * 0.18, h * 0.4, "city") + R(x + w * 0.2, y + h * 0.5, w * 0.16, h * 0.5, "city") + R(x + w * 0.62, y + h * 0.56, w * 0.2, h * 0.5, "city");
      if (night) for (let i = 0; i < 5; i++) inner += R((x + w * (0.04 + i * 0.17)).toFixed(0), (y + h * (0.7 + (i % 2) * 0.1)).toFixed(0), 3, 3, "lamp");
    }
    if (o.tree !== false) inner += tree(x + w * (o.treeX || 0.3), y + h + 4, season, (h / 140));
    if (season === "winter") inner += R(x, y + h - 6, w, 6, "snow");
    inner += particles(season, x, y, w, h, night, Math.round(w / 18), o.seed);
    let s = '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath><g clip-path="url(#' + id + ')">' + inner + "</g>";
    s += R(x, y, w, h, null, 0, "frame", 6) + L(x + w / 2, y, x + w / 2, y + h, "frame", 4) + R(x - 6, y + h, w + 12, 6, "frame", 2);
    return s;
  }
  // Full-bleed outdoor sky with weather (for campus, gate, field and so on).
  function outdoorSky(w, h, o) {
    const gid = nid("sky");
    let s = grad(gid, o.night ? "night" : "sky", o.night ? "night2" : "sky2") + R(0, 0, w, h, null, 0, null, 0, "fill:url(#" + gid + ")");
    if (o.night) {
      if (o.moon !== false) s += G(w * 0.82, 40, O(0, 0, 16, "moon") + O(7, -5, 14, "night"));
      const r = rand(o.seed || 5);
      for (let i = 0; i < 14; i++) s += G((r() * w).toFixed(0), (r() * h * 0.5).toFixed(0), A("twinkle", O(0, 0, 1.4, "star"), "--del:-" + (r() * 3).toFixed(1) + "s"));
    } else {
      s += A("pulse-slow", O(w * 0.85, 42, o.season === "summer" ? 24 : 18, "sun"));
      s += G(w * 0.2, 46, A("drift", E(0, 0, 30, 10, "cloud") + E(18, -7, 18, 10, "cloud") + E(-16, -4, 14, 8, "cloud")));
      s += G(w * 0.58, 30, A("drift slow", E(0, 0, 22, 7, "cloud") + E(12, -5, 13, 8, "cloud")));
    }
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

  // ---------- room furniture ----------
  function crib(x, y) {
    let s = R(x - 80, y - 90, 160, 8, "wood", 3) + R(x - 80, y - 40, 160, 8, "wood", 3) + R(x - 86, y - 100, 10, 100, "wood2", 3) + R(x + 76, y - 100, 10, 100, "wood2", 3);
    for (let i = 0; i < 9; i++) s += R(x - 70 + i * 17, y - 84, 4, 46, "wood2", 2);
    return s + R(x - 76, y - 48, 152, 10, "paper", 4);
  }
  function toyBlocks(x, y) {
    return R(x - 30, y - 22, 22, 22, "c1", 3) + R(x - 6, y - 22, 22, 22, "c3", 3) + R(x - 18, y - 44, 22, 22, "c5", 3) + O(x + 36, y - 10, 10, "c2");
  }
  function floorPlanks(y, w, h, tok) {
    let s = R(0, y, w, h, tok || "floor");
    for (let i = 1; i < 4; i++) s += L(0, y + (h * i) / 4, w, y + (h * i) / 4, "floor2", 1);
    return s;
  }
  function deskSmall(x, y) {
    return R(x - 32, y - 30, 64, 7, "wood", 2) + R(x - 28, y - 23, 5, 25, "metal") + R(x + 23, y - 23, 5, 25, "metal") +
      R(x - 10, y - 50, 20, 18, "c5", 2, null, 0, "opacity:0.85") + R(x - 14, y - 32, 28, 3, "paper");
  }
  function lamp(x, y, gid) {
    return O(x + 22, y - 40, 60, null, null, 0, "fill:url(#" + gid + ")") + P("M" + x + " " + y + " L" + (x + 6) + " " + (y - 30) + " L" + (x + 22) + " " + (y - 42), null, "metal", 3) +
      P("M" + (x + 12) + " " + (y - 46) + " L" + (x + 34) + " " + (y - 50) + " L" + (x + 30) + " " + (y - 36) + " Z", "c1") + E(x, y, 9, 3, "metal");
  }
  function books(x, y, n, seed) {
    const r = rand(seed || 11);
    let s = "", yy = y;
    for (let i = 0; i < n; i++) {
      const w = 34 + r() * 14, h = 7 + r() * 3;
      s += R((x - w / 2 + r() * 6 - 3).toFixed(1), (yy - h).toFixed(1), w.toFixed(1), h.toFixed(1), ["c1", "c3", "c4", "c5", "c2"][i % 5], 1.5) + L(x - w / 2 + 3, yy - h / 2, x + w / 2 - 6, yy - h / 2, "paper", 1, "opacity:0.6");
      yy -= h;
    }
    return s;
  }
  function shelf(x, y, w, seed) {
    const r = rand(seed || 4);
    let s = R(x, y, w, 6, "wood2");
    let xx = x + 4;
    while (xx < x + w - 10) {
      const bw = 6 + r() * 6, bh = 22 + r() * 12;
      s += R(xx.toFixed(1), (y - bh).toFixed(1), bw.toFixed(1), bh.toFixed(1), ["c1", "c3", "c4", "c5", "c2"][Math.floor(r() * 5)], 1);
      xx += bw + 1.5;
    }
    return s;
  }
  function clock(x, y, r, hour) {
    const h = hour == null ? 9 : hour;
    const ha = (h % 12) * 30 - 90, ma = -90;
    const hx = x + Math.cos((ha * Math.PI) / 180) * r * 0.5, hyy = y + Math.sin((ha * Math.PI) / 180) * r * 0.5;
    return O(x, y, r, "paper", "frame", 3) + L(x, y, hx.toFixed(1), hyy.toFixed(1), "ink", 2.5) +
      '<g style="transform-origin:' + x + "px " + y + 'px" class="spin">' + L(x, y, x + Math.cos((ma * Math.PI) / 180) * r * 0.75, y + Math.sin((ma * Math.PI) / 180) * r * 0.78, "c1", 1.6) + "</g>" + O(x, y, 2, "ink");
  }
  function bunting(x1, x2, y, seed) {
    let s = P("M" + x1 + " " + y + " Q" + (x1 + x2) / 2 + " " + (y + 18) + " " + x2 + " " + y, null, "line", 1.5);
    const n = Math.floor((x2 - x1) / 26);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, px = x1 + (x2 - x1) * t, py = y + 18 * 4 * t * (1 - t) * 0.5 * 2 * 0.5 + 2;
      s += P("M" + (px - 8).toFixed(1) + " " + py.toFixed(1) + " L" + (px + 8).toFixed(1) + " " + py.toFixed(1) + " L" + px.toFixed(1) + " " + (py + 15).toFixed(1) + " Z", ["c1", "c2", "c3", "c5", "c4"][(i + (seed || 0)) % 5]);
    }
    return A("sway-slow", s);
  }
  function sparkle(x, y, s, tok) {
    return G(x, y, A("twinkle", P("M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z", tok || "gold")), s || 1);
  }
  function heart(x, y, s, tok, del) {
    return G(x, y, A("rise", P("M0 4 C-8 -2 -6 -10 0 -6 C6 -10 8 -2 0 4 Z", tok || "c1"), "--del:" + (del || 0) + "s"), s || 1);
  }

  // ---------- life-stage scenes (800 × 260, floor at about 215) ----------
  const W = 800, H = 260, FLOOR = 215, FEET = 240;
  const SCENES = {
    classroom(ctx) {
      let s = R(0, 0, W, FLOOR, "wall") + R(0, 168, W, FLOOR - 168, "wall2") + floorPlanks(FLOOR, W, H - FLOOR);
      // Bulletin board with children's drawings.
      s += R(50, 52, 150, 96, "cork", 4, "frame", 4);
      s += G(78, 80, R(-18, -16, 36, 32, "paper", 2) + O(0, -2, 8, "sun") + L(-12, 10, 12, 10, "leaf", 3), 1, "", "") + G(126, 76, R(-16, -14, 32, 30, "paper", 2) + P("M-10 8 L0 -6 L10 8 Z", "c1"), 1) +
        G(170, 84, R(-14, -16, 28, 32, "paper", 2) + O(0, -4, 6, "c5") + L(0, 2, 0, 12, "c5", 2), 1) + G(102, 124, R(-30, -10, 60, 18, "c2", 2, null, 0, "opacity:0.9"), 1) + O(78, 63, 2.5, "c1") + O(126, 61, 2.5, "c3") + O(170, 67, 2.5, "c4");
      // Chalkboard with doodles and sums.
      s += R(236, 36, 330, 118, "board", 4, "wood", 7) + R(244, 154, 314, 6, "wood2", 2);
      s += G(300, 82, O(0, 0, 13, null, "chalk", 2) + L(-20, 0, -16, 0, "chalk", 2) + L(16, 0, 20, 0, "chalk", 2) + L(0, -20, 0, -16, "chalk", 2) + L(0, 16, 0, 20, "chalk", 2));
      s += T(420, 82, "1 + 2 = 3", "chalk", 22, "opacity:0.9") + T(420, 122, "3 + 4 = 7", "chalk", 22, "opacity:0.9");
      s += P("M500 120 q10 -20 20 0 q10 -20 20 0", null, "chalk", 2) + R(470, 150, 18, 4, "chalk", 1) + R(500, 150, 10, 4, "c2", 1);
      s += clock(612, 44, 15, 9);
      s += windowView(640, 70, 130, 100, { season: ctx.season, seed: 21 });
      s += G(140, 233, deskSmall(0, 0)) + G(660, 236, deskSmall(0, 0));
      s += person(ctx, 352, FEET, 1.15);
      return s;
    },
    // Ages 0–2 (and 3–5 at home): a sunny room with a crib, a mobile, a rug and toy blocks.
    nursery(ctx) {
      let s = R(0, 0, W, FLOOR, "wall") + R(0, 150, W, FLOOR - 150, "wall2") + floorPlanks(FLOOR, W, H - FLOOR);
      s += windowView(80, 40, 150, 110, { season: ctx.season, city: true, seed: 91 });
      s += crib(560, FLOOR) + toyBlocks(430, FLOOR + 14);
      s += E(360, FLOOR + 16, 150, 14, "c5", null, 0, "opacity:0.35");
      s += G(620, 40, A("sway", L(0, 0, 0, 16, "line", 1.5) + L(-30, 16, 30, 16, "line", 2) + L(-30, 16, -30, 30, "line", 1) + L(30, 16, 30, 30, "line", 1) + L(0, 16, 0, 34, "line", 1) +
        O(-30, 36, 7, "c1") + P("M0 34 l7 12 l-14 0 Z", "c3") + O(30, 36, 7, "gold")));
      s += person(ctx, 340, FEET, 1.1);
      return s;
    },
    hallway(ctx) {
      let s = R(0, 0, W, FLOOR, "wall") + R(0, FLOOR, W, H - FLOOR, "tile");
      for (let x = 0; x < W; x += 40) s += L(x, FLOOR, x - 30, H, "tile2", 1);
      for (let i = 0; i < 6; i++) {
        const x = 18 + i * 44;
        s += R(x, 60, 42, 155, i === 2 ? "c5" : "locker", 2, "locker2", 2) + L(x + 8, 74, x + 34, 74, "locker2", 2) + L(x + 8, 80, x + 34, 80, "locker2", 2) + R(x + 32, 130, 4, 14, "metal", 2);
      }
      s += R(300, 64, 100, 70, "cork", 3, "frame", 4) + R(312, 74, 30, 38, "paper", 1) + R(350, 72, 38, 26, "c2", 1, null, 0, "opacity:0.85") + R(352, 104, 34, 22, "paper", 1);
      s += windowView(450, 54, 150, 110, { season: ctx.season, seed: 31, city: true }) + windowView(624, 54, 150, 110, { season: ctx.season, seed: 37, treeX: 0.6 });
      s += R(0, 200, W, 15, "wall2");
      s += person(ctx, 360, FEET, 1.0);
      return s;
    },
    desk(ctx) {
      const gid = nid("lamp");
      let s = '<defs>' + glow(gid, "lamp") + "</defs>" + R(0, 0, W, FLOOR, "nightwall") + floorPlanks(FLOOR, W, H - FLOOR, "nightfloor");
      s += windowView(470, 40, 150, 110, { season: ctx.season, night: true, city: true, seed: 41, tree: ctx.season !== "winter" });
      s += shelf(40, 100, 140, 3) + shelf(40, 160, 140, 9);
      s += R(70, 26, 34, 50, "c5", 0, null, 0, "opacity:0.8") + P("M70 26 L104 26 L87 46 Z", "c1", null, 0, "opacity:0.8");
      if (ctx.dday != null) {
        s += R(250, 34, 120, 74, "paper", 4, "frame", 3) + R(250, 34, 120, 18, "c1", 4) + T(310, 92, "D-" + ctx.dday, "c1", 30);
      } else {
        s += R(262, 40, 70, 54, "paper", 2, "frame", 3) + O(285, 60, 8, "sun") + P("M266 90 L290 70 L306 84 L318 74 L330 90 Z", "leaf");
      }
      // Desk with a lamp, a tower of workbooks, an open book and a mug.
      s += R(440, 160, 330, 10, "wood", 2) + R(450, 170, 10, 46, "wood2") + R(750, 170, 10, 46, "wood2") + R(610, 170, 140, 40, "wood", 2) + L(620, 190, 740, 190, "wood2", 2);
      s += lamp(480, 160, gid);
      s += books(580, 160, ctx.dday != null ? 7 : 4, 12) + G(680, 156, P("M-26 0 L0 -6 L26 0 L26 4 L0 -2 L-26 4 Z", "paper", "line", 1)) + G(740, 160, R(-8, -16, 16, 16, "c3", 3) + P("M8 -12 q6 0 6 5 q0 5 -6 5", null, "c3", 2.5));
      s += G(720, 130, A("rise", P("M0 0 q-4 -6 0 -12 q4 -6 0 -12", null, "steam", 2), "--del:-1s"));
      s += person(ctx, 350, FEET, 1.05);
      return s;
    },
    cubicle(ctx) {
      const gid = nid("lamp");
      let s = '<defs>' + glow(gid, "lamp") + "</defs>" + R(0, 0, W, FLOOR, "dark2") + R(0, FLOOR, W, H - FLOOR, "nightfloor");
      s += R(0, 18, W, 6, "dark") + R(120, 14, 80, 6, "lamp", 2, null, 0, "opacity:0.5") + R(560, 14, 80, 6, "lamp", 2, null, 0, "opacity:0.5");
      for (let i = 0; i < 5; i++) {
        const x = 10 + i * 160;
        s += R(x, 70, 150, 145, "cubicle", 2) + R(x, 66, 6, 150, "cubicle2") + R(x + 144, 66, 6, 150, "cubicle2") + R(x + 6, 150, 138, 8, "wood", 1) + R(x + 6, 100, 138, 6, "cubicle2");
        s += O(x + 40, 140, 40, null, null, 0, "fill:url(#" + gid + ")") + R(x + 20, 132, 30, 6, "lamp", 2) + books(x + 110, 100, 3, i + 2);
        if (i !== 2) s += O(x + 75, 132, 12, "hair") + R(x + 60, 140, 30, 12, "hoodie", 5);
      }
      s += clock(400, 44, 14, 11);
      s += person(ctx, 330, FEET, 1.02, { prop: "book" });
      return s;
    },
    academy(ctx) {
      let s = R(0, 0, W, FLOOR, "wall") + R(0, FLOOR, W, H - FLOOR, "tile");
      s += R(80, 14, 120, 8, "lamp", 2) + R(340, 14, 120, 8, "lamp", 2) + R(600, 14, 120, 8, "lamp", 2);
      s += R(170, 40, 460, 120, "paper", 4, "metal", 6) + R(180, 160, 440, 6, "metal", 2);
      s += P("M200 130 L250 70 L300 110 L360 60", null, "c5", 3) + O(250, 70, 4, "c5") + O(360, 60, 4, "c5") + L(200, 140, 380, 140, "line", 2);
      s += T(520, 112, "D-" + (ctx.dday != null ? ctx.dday : 100), "c1", 38);
      for (const x of [70, 150, 560, 650, 740]) s += O(x, 214, 16, "hair") + R(x - 24, 226, 48, 34, ["hoodie", "c5", "pants", "c4", "hoodie"][Math.floor(x / 150) % 5], 10);
      s += person(ctx, 360, FEET, 1.02);
      return s;
    },
    campus(ctx) {
      let s = outdoorSky(W, H, { season: ctx.season, seed: 8 }) + R(0, 180, W, 80, "grass") + P("M300 260 Q380 200 470 180 L520 180 Q450 210 420 260 Z", "path");
      s += R(470, 70, 300, 112, "stone") + P("M455 74 L620 26 L785 74 Z", "stone2") + R(470, 172, 300, 10, "stone2");
      for (let i = 0; i < 6; i++) s += R(490 + i * 48, 84, 14, 88, "paper", 2);
      s += R(596, 120, 48, 52, "wood2", 2);
      s += tree(110, 196, ctx.season, 1.3) + tree(230, 200, ctx.season, 1.0) + tree(780, 196, ctx.season, 1.1);
      s += particles(ctx.season, 0, 0, W, 200, false, 16, 9);
      s += G(560, 210, avatar({ age: "adult", outfit: "casual", look: { hair: 2, shirt: 2, sex: "f" }, mood: "happy" }), 0.5) + G(600, 214, avatar({ age: "adult", outfit: "casual", look: { hair: 0, shirt: 3 }, mood: "ok" }), 0.5);
      s += person(ctx, 340, FEET, 1.0, { prop: "book" });
      return s;
    },
    examhall(ctx) {
      let s = R(0, 0, W, FLOOR, "wall") + R(0, 168, W, FLOOR - 168, "wall2") + floorPlanks(FLOOR, W, H - FLOOR);
      s += R(236, 36, 330, 110, "board", 4, "wood", 7) + T(490, 106, "08:40", "chalk", 40, "opacity:0.9");
      s += clock(600, 50, 18, 8);
      s += windowView(640, 72, 130, 96, { season: "fall", seed: 51 });
      for (const [x, y, sc] of [[90, 210, 0.95], [180, 214, 1], [560, 214, 1], [680, 216, 1.05]]) {
        s += G(x, y, R(-34, -10, 68, 8, "wood", 2) + R(-30, -2, 5, 22, "metal") + R(25, -2, 5, 22, "metal") + R(-14, -14, 28, 5, "paper", 1) + O(-16, -26, 13, "hair") + R(-32, -16, 30, 20, "hoodie", 8, null, 0, "opacity:0.95"), sc);
      }
      s += G(60, 120, R(-10, 0, 20, 30, "paper", 2) + R(-7, 6, 14, 2, "line") + R(-7, 12, 14, 2, "line"));
      s += person(ctx, 340, FEET, 1.02);
      return s;
    },
    home(ctx) {
      const gid = nid("glow");
      let s = '<defs>' + glow(gid, "screen") + "</defs>" + R(0, 0, W, FLOOR, "nightwall") + floorPlanks(FLOOR, W, H - FLOOR, "nightfloor");
      s += windowView(80, 40, 160, 120, { season: ctx.season, night: true, city: true, seed: 61 });
      s += R(300, 50, 40, 50, "paper", 2, "frame", 3) + R(306, 56, 28, 30, "sky") + R(356, 60, 34, 40, "paper", 2, "frame", 3) + R(362, 66, 22, 22, "blossom");
      s += R(470, 150, 300, 60, "sofa", 16) + R(480, 130, 280, 40, "sofa2", 14) + R(470, 196, 300, 16, "sofa2", 6);
      s += O(560, 150, 70, null, null, 0, "fill:url(#" + gid + ")") + R(520, 178, 90, 8, "wood", 2) + P("M528 176 L540 140 L600 140 L606 176 Z", "dark") + R(544, 144, 52, 28, "screen", 1);
      s += person(ctx, 360, FEET, 1.02);
      return s;
    },
    gate(ctx) {
      let s = outdoorSky(W, H, { season: "spring", seed: 13 }) + R(0, 190, W, 70, "grass") + P("M330 260 L370 190 L430 190 L470 260 Z", "path");
      s += tree(110, 196, "spring", 1.3) + tree(700, 196, "spring", 1.35) + tree(200, 200, "spring", 1.0);
      s += R(240, 70, 44, 130, "stone", 3) + R(516, 70, 44, 130, "stone", 3) + R(228, 62, 68, 14, "stone2", 3) + R(504, 62, 68, 14, "stone2", 3);
      s += P("M262 80 Q400 34 538 80 L538 100 Q400 54 262 100 Z", "stone2");
      // The school's name sits high on the arch, clear of the mood bubble.
      s += R(296, 18, 208, 32, "paper", 6, "gold", 3) + (ctx.label ? T(400, 41, ctx.label, "ink", ctx.label.length > 16 ? 12 : 17) : "");
      s += bunting(262, 538, 104, 1);
      s += particles("spring", 0, 0, W, 210, false, 18, 17);
      s += person(ctx, 340, FEET, 1.02, { pose: "cheer", mood: "happy" });
      return s;
    },
    road(ctx) {
      const gid = nid("dusk");
      let s = grad(gid, "dusk", "dusk2") + R(0, 0, W, H, null, 0, null, 0, "fill:url(#" + gid + ")") + O(560, 170, 40, "sun", null, 0, "opacity:0.9");
      s += P("M0 170 Q200 130 400 168 T800 150 L800 260 L0 260 Z", "hill") + P("M0 200 Q240 170 520 196 T800 190 L800 260 L0 260 Z", "grass");
      s += P("M380 260 Q420 220 520 196 L540 196 Q460 226 460 260 Z", "path");
      s += person(ctx, 330, FEET, 1.0);
      return s;
    },
    start() {
      // Low rooftops and a low moon: the setup banner is wide and shows only the bottom of the frame.
      let s = outdoorSky(W, H, { night: true, seed: 2, moon: false }) + A("pulse-slow", O(408, 118, 18, "moon") + O(416, 112, 15, "night"));
      const r = rand(99);
      for (let i = 0; i < 9; i++) {
        const x = i * 92 + 10, h = 50 + r() * 60;
        s += R(x, H - h, 74, h, "city");
        for (let yy = H - h + 12; yy < H - 10; yy += 16) for (let xx = x + 8; xx < x + 66; xx += 16) if (r() < 0.4) s += G(xx, yy, A("twinkle slow", R(0, 0, 8, 7, "lamp")), 1, "", "--del:-" + (r() * 6).toFixed(1) + "s");
      }
      return s;
    },
  };
  function sceneName(stage, ctx) {
    if (ctx.ending) return ctx.label ? "gate" : "road";
    if (ctx.examMonth) return "examhall";
    if (ctx.results) return "home";
    if (stage === "baby") return "nursery";
    if (stage === "kinder") return ctx.home ? "nursery" : "classroom";
    return { elem: "classroom", mid: "hallway", high: "desk", hs3: "desk", academy: "academy", selfstudy: "cubicle", halfretake: "campus", dropout: "cubicle" }[stage] || "desk";
  }
  function scene(ctx) {
    VIEW = (ctx && ctx.view) || "city";
    const name = ctx.scene || sceneName(ctx.stage, ctx);
    return svg("0 0 " + W + " " + H, SCENES[name](ctx), "scene scene-" + name, ctx.aria);
  }

  // ---------- event illustrations (600 × 220, floor at 178) ----------
  const EW = 600, EH = 220, EF = 178, EFEET = 204;
  const BACKDROPS = {
    nursery(ctx) {
      let s = R(0, 0, EW, EF, "wall") + R(0, 130, EW, EF - 130, "wall2") + floorPlanks(EF, EW, EH - EF);
      s += windowView(420, 26, 120, 90, { season: ctx.season, city: true, seed: 92 });
      return s + E(300, EF + 14, 200, 12, "c5", null, 0, "opacity:0.3");
    },
    room(ctx, night) {
      let s = R(0, 0, EW, EF, night ? "nightwall" : "wall") + floorPlanks(EF, EW, EH - EF, night ? "nightfloor" : "floor");
      s += windowView(400, 30, 130, 92, { season: ctx.season, night, city: true, seed: 71 });
      return s + shelf(40, 80, 110, 5);
    },
    class(ctx) {
      return R(0, 0, EW, EF, "wall") + R(0, 140, EW, EF - 140, "wall2") + floorPlanks(EF, EW, EH - EF) + R(170, 24, 260, 96, "board", 4, "wood", 6) + windowView(480, 40, 100, 86, { season: ctx.season, seed: 72 });
    },
    field(ctx) {
      return outdoorSky(EW, EH, { season: ctx.season, seed: 73 }) + R(0, 150, EW, 70, "grass") + P("M0 180 Q300 150 600 180 L600 196 Q300 166 0 196 Z", "trackred") +
        P("M0 186 Q300 156 600 186", null, "snow", 1.5, "opacity:0.8") + tree(40, 154, ctx.season, 0.9) + tree(560, 154, ctx.season, 1);
    },
    hall(ctx) {
      let s = R(0, 0, EW, EF, "wall") + R(0, EF, EW, EH - EF, "tile");
      for (let i = 0; i < 5; i++) s += R(330 + i * 52, 40, 50, 138, "locker", 2, "locker2", 2) + L(338 + i * 52, 54, 372 + i * 52, 54, "locker2", 2);
      return s + windowView(40, 34, 120, 90, { season: ctx.season, seed: 74 });
    },
    city(ctx) {
      let s = outdoorSky(EW, EH, { night: true, seed: 75 });
      const r = rand(8);
      for (let i = 0; i < 7; i++) {
        const x = i * 88, h = 90 + r() * 70;
        s += R(x, EH - h, 80, h, "city");
        for (let k = 0; k < 3; k++) s += G(x + 8, EH - h + 12 + k * 26, A("pulse", R(0, 0, 64, 16, ["c1", "c2", "c3", "c4", "c5"][(i + k) % 5], 3, null, 0, "opacity:0.85") + R(8, 6, 40, 4, "paper", 1, null, 0, "opacity:0.8")), 1, "", "--del:-" + (r() * 3).toFixed(1) + "s");
      }
      return s + R(0, 196, EW, 24, "road");
    },
    hospital() {
      return R(0, 0, EW, EF, "paper") + R(0, EF, EW, EH - EF, "tile") + R(0, 120, EW, 6, "c3", 0, null, 0, "opacity:0.5") +
        G(470, 70, R(-22, -22, 44, 44, "paper", 6, "line", 2) + R(-6, -16, 12, 32, "c1") + R(-16, -6, 32, 12, "c1"));
    },
    pcbang() {
      let s = R(0, 0, EW, EH, "dark2") + R(0, EF, EW, EH - EF, "dark");
      for (let i = 0; i < 5; i++) {
        const x = 280 + i * 64;
        s += G(x, 128, A("pulse", R(-26, -40, 52, 36, "screen", 3, null, 0, "opacity:0.9") + R(-20, -34, 18, 10, "c4", 1) + R(2, -30, 16, 14, "c1", 1)), 1, "", "--del:-" + i * 0.6 + "s") + R(x - 4, 92, 8, 14, "metal") + R(x - 30, 106, 60, 6, "metal", 2);
      }
      return s + R(260, 112, 340, 8, "dark", 0) + R(0, 30, EW, 4, "c4", 0, null, 0, "opacity:0.6");
    },
    kitchen(ctx) {
      return R(0, 0, EW, EF, "wall") + floorPlanks(EF, EW, EH - EF) + R(330, 100, 270, 78, "wood", 2) + R(330, 92, 270, 10, "stone2") + R(350, 30, 90, 50, "paper", 3, "frame", 2) +
        windowView(470, 24, 100, 62, { season: ctx.season, seed: 76, tree: false }) + G(380, 92, R(-14, -16, 28, 16, "metal", 3) + R(-18, -18, 36, 4, "dark", 2));
    },
    street(ctx) {
      return outdoorSky(EW, EH, { season: ctx.season, seed: 77 }) + R(0, 50, 330, 140, "stone") + R(0, 190, EW, 30, "road") + R(20, 40, 290, 20, "c1", 3) +
        R(30, 70, 270, 120, "metal", 0) + (function () { let x = ""; for (let i = 0; i < 9; i++) x += L(30, 76 + i * 8, 300, 76 + i * 8, "metal2", 2); return x; })() + R(30, 150, 270, 40, "dark2");
    },
    cubicle(ctx) {
      const gid = nid("lamp");
      return '<defs>' + glow(gid, "lamp") + "</defs>" + R(0, 0, EW, EH, "dark2") + R(250, 50, 300, 128, "cubicle", 2) + R(250, 50, 8, 128, "cubicle2") + R(542, 50, 8, 128, "cubicle2") + R(258, 130, 284, 8, "wood") +
        O(300, 120, 50, null, null, 0, "fill:url(#" + gid + ")") + R(280, 114, 34, 6, "lamp", 2) + R(0, EF, EW, EH - EF, "nightfloor");
    },
    // Region backgrounds: the coast (Busan, Pohang, Haenam) and the countryside (rural counties).
    beach(ctx) {
      return outdoorSky(EW, EH, { season: ctx.season, seed: 77 }) + R(0, 120, EW, 50, "sea") + P("M0 130 q40 -5 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0", null, "sea2", 2) +
        R(0, 166, EW, EH - 166, "path") + O(520, 60, 18, "sun");
    },
    farm(ctx) {
      let s = outdoorSky(EW, EH, { season: ctx.season, seed: 78 }) + P("M0 140 Q150 80 300 130 T600 110 L600 220 L0 220 Z", "hill") + R(0, 160, EW, 60, "grass");
      for (let i = 0; i < 6; i++) s += L(0, 168 + i * 9, EW, 168 + i * 9, "hill", 2);
      return s + tree(60, 162, ctx.season, 0.9) + tree(540, 160, ctx.season, 1);
    },
    bath() {
      let s = R(0, 0, EW, EH, "tile");
      for (let x = 0; x < EW; x += 30) s += L(x, 0, x, EH, "tile2", 1);
      for (let y = 0; y < EH; y += 30) s += L(0, y, EW, y, "tile2", 1);
      return s;
    },
    campus(ctx) { return SCENES_SMALL.campus(ctx); },
  };
  const SCENES_SMALL = {
    campus(ctx) {
      let s = outdoorSky(EW, EH, { season: ctx.season, seed: 78 }) + R(0, 160, EW, 60, "grass") + R(300, 60, 280, 104, "stone") + P("M290 64 L440 22 L590 64 Z", "stone2");
      for (let i = 0; i < 5; i++) s += R(318 + i * 52, 74, 12, 86, "paper", 2);
      return s + tree(60, 168, ctx.season, 1);
    },
  };

  // 돌잡이 items, drawn standing on a table top at y ≈ 170 around x (shared by the event art and the
  // first-birthday cutscene).
  const DOL_ITEMS = {
    pencil: (x) => R(x - 3, 140, 6, 28, "c5", 1) + P("M" + (x - 3) + " 140 L" + x + " 132 L" + (x + 3) + " 140 Z", "skin"),
    book: (x) => R(x - 14, 148, 28, 20, "c1", 2) + R(x - 12, 150, 24, 3, "paper", 1),
    mouse: (x) => E(x, 160, 10, 13, "paper", "line", 1.5) + L(x, 148, x, 156, "line", 1.5),
    stethoscope: (x) => P("M" + (x - 10) + " 146 Q" + (x - 12) + " 166 " + x + " 166 Q" + (x + 12) + " 166 " + (x + 10) + " 146", null, "dark", 2.5) + O(x, 166, 5, "metal"),
    mic: (x) => R(x - 3, 150, 6, 18, "dark", 2) + O(x, 147, 7, "metal"),
    gavel: (x) => R(x - 14, 148, 28, 10, "wood2", 3) + R(x - 2, 156, 4, 14, "wood", 1),
    ball: (x) => O(x, 158, 11, "c2") + P("M" + (x - 11) + " 158 Q" + x + " 150 " + (x + 11) + " 158", null, "paper", 1.5),
    thread: (x) => R(x - 9, 150, 18, 18, "paper", 3, "line", 1) + L(x - 9, 155, x + 9, 155, "c1", 2) + L(x - 9, 161, x + 9, 161, "c1", 2),
    money: (x) => R(x - 14, 154, 28, 14, "leaf", 2) + R(x - 10, 150, 28, 14, "leaf", 2, "paper", 1) + O(x + 4, 157, 3, "paper"),
    brush: (x) => R(x - 2, 140, 4, 24, "wood", 1) + P("M" + (x - 4) + " 164 L" + (x + 4) + " 164 L" + x + " 174 Z", "dark"),
  };

  // Foreground pieces per event. Each returns SVG drawn over the backdrop; v is the outcome suffix
  // (r0a, r1 ...) when the art illustrates a result rather than the question.
  const FX = {
    // 돌잡이: a low table laid with objects; the grabbed one (the outcome's suffix) sparkles.
    doljabi: (v) => {
      const items = DOL_ITEMS;
      const ids = Object.keys(items);
      let s = R(300, 166, 290, 14, "wood", 4) + R(310, 180, 10, 24, "wood2", 2) + R(570, 180, 10, 24, "wood2", 2) + R(296, 160, 298, 8, "c1", 3, null, 0, "opacity:0.6");
      ids.forEach((id, i) => {
        const x = 320 + i * 28;
        s += items[id](x);
        if (v === id || (v === "two" && (i === 1 || i === 6))) s += sparkle(x, 126, 0.8) + sparkle(x + 10, 140, 0.5, "c5");
      });
      return s;
    },
    mobile: () => G(440, 20, A("sway", L(0, 0, 0, 20, "line", 1.5) + L(-50, 20, 50, 20, "line", 2) + O(-50, 40, 9, "c1") + P("M0 36 l9 16 l-18 0 Z", "c3") + O(50, 40, 9, "gold") +
      L(-50, 20, -50, 31, "line", 1) + L(0, 20, 0, 36, "line", 1) + L(50, 20, 50, 31, "line", 1))) + heart(360, 90, 1.2, "c1", -1) + heart(520, 110, 1, "blossom", -2),
    cracks: () => A("shake", P("M380 20 L392 50 L380 70 L398 100 L386 128", null, "ink", 2.5) + P("M120 30 L132 56 L122 76 L136 104", null, "ink", 2)) +
      R(330, 150, 10, 8, "stone", 1) + R(352, 160, 8, 6, "stone", 1) + R(110, 156, 9, 7, "stone", 1),
    bus: () => G(420, 150, R(-60, -34, 140, 46, "c3", 8) + R(-52, -28, 30, 16, "screen", 2) + R(-16, -28, 30, 16, "screen", 2) + R(20, -28, 30, 16, "screen", 2) +
      R(56, -28, 18, 30, "screen", 2) + O(-34, 14, 9, "dark") + O(54, 14, 9, "dark")),
    finish: () => L(470, 120, 470, 204, "metal", 4) + L(580, 120, 580, 204, "metal", 4) + A("sway", P("M470 140 Q525 152 580 140", null, "c1", 4)) + bunting(20, 660, 26, 2) +
      G(300, EFEET, avatar({ age: "child", outfit: "kid", look: { hair: 3, shirt: 1, sex: "f" }, mood: "happy" }), 0.85),
    dragon: () => G(420, 90, A("drift", P("M0 0 q20 -30 50 -12 q16 -22 30 0 q-10 2 -14 10 q22 6 30 26 q-26 -8 -40 0 q-20 14 -50 -6 q-12 10 -24 4 q10 -8 18 -22 Z", "c4", null, 0, "opacity:0.85") + O(60, -6, 2.5, "gold"))) +
      books(470, 176, 7, 5) + sparkle(380, 60, 0.9) + sparkle(530, 46, 0.7) + sparkle(560, 100, 0.6),
    mathsyms: (v) => T(250, 70, "π", "chalk", 34) + T(300, 104, "√x", "chalk", 26) + T(370, 72, "∑", "chalk", 32) + T(340, 112, "x²", "chalk", 22) +
      (v === "r0a" ? G(470, 120, A("bounce", R(-8, -48, 16, 34, "c5", 2) + O(0, -8, 18, "gold", "gold2", 3) + O(0, -8, 10, "gold2", null, 0, "opacity:0.4") + P("M-5 -10 L0 -16 L5 -10", null, "paper", 2))) + sparkle(430, 60) + sparkle(520, 80, 0.8) :
        v === "r0b" ? G(470, 150, R(-30, -40, 60, 44, "paper", 2, "line", 1) + L(-20, -28, 20, -28, "line", 2) + L(-20, -18, 10, -18, "line", 2) + P("M-12 -6 L12 -6", null, "c1", 3)) :
        G(470, 140, R(-36, -50, 72, 54, "paper", 3, "line", 1) + T(0, -14, "?", "c5", 30))),
    bigphone: () => G(440, 118, A("float", R(-46, -84, 92, 162, "dark", 14) + R(-40, -74, 80, 136, "screen", 6) +
      (function () { let s = ""; const cs = ["c1", "c2", "c3", "c4", "c5", "gold"]; for (let i = 0; i < 9; i++) s += R(-32 + (i % 3) * 24, -64 + Math.floor(i / 3) * 24, 18, 18, cs[i % 6], 5); return s; })() +
      R(-28, 20, 56, 30, "paper", 6, null, 0, "opacity:0.8"))) + sparkle(360, 50, 0.8, "c2") + sparkle(520, 40, 0.7, "c2"),
    looming: () => G(420, EFEET, P("M-60 0 Q-70 -110 -30 -140 Q0 -170 30 -140 Q70 -110 60 0 Z", "bully", null, 0, "opacity:0.85") + O(0, -150, 34, "bully", null, 0, "opacity:0.85") +
      L(-14, -152, -4, -148, "c1", 3) + L(14, -152, 4, -148, "c1", 3)) + G(300, 70, A("rise", T(0, 0, "!", "c1", 26), "--del:-0.5s")),
    podium: (v) => G(440, EFEET, R(-40, -70, 80, 70, "wood", 4) + R(-50, -76, 100, 10, "wood2", 3) + O(0, -50, 10, "gold")) + G(540, 178, R(-24, -36, 48, 36, "paper", 3, "line", 2) + R(-12, -38, 24, 4, "dark")) +
      (v === "r0a" ? G(220, 30, A("bounce", P("M-18 10 L-18 -8 L-9 2 L0 -12 L9 2 L18 -8 L18 10 Z", "gold", "gold2", 2))) + sparkle(160, 40) + sparkle(280, 50, 0.8) : "") +
      G(560, 110, A("wave", O(0, 0, 7, "skin") + R(-3, 5, 6, 26, "c3", 3)), 1) + G(500, 100, A("wave slow", O(0, 0, 7, "skinb") + R(-3, 5, 6, 26, "c4", 3)), 1),
    doctor: () => G(440, EFEET, avatar({ age: "adult", outfit: "casual", gear: "coat", look: { hair: 1, shirt: 3, sex: "m", glasses: true, lid: true }, mood: "happy" })),
    door: () => R(420, 34, 110, 144, "wood", 3, "wood2", 4) + O(512, 110, 5, "gold") + G(475, 80, O(0, 0, 22, "paper", "c1", 5) + L(-15, 15, 15, -15, "c1", 5)) + G(250, 40, A("drift", E(0, 0, 40, 16, "storm") + E(24, -10, 24, 14, "storm") + E(-22, -6, 20, 12, "storm") + P("M4 12 L-4 26 L4 26 L-4 40", null, "gold", 3))),
    monitors: () => G(120, 196, E(0, 0, 24, 6, "cup") + R(-20, -30, 40, 30, "c1", 4) + R(-20, -30, 40, 8, "paper", 2) + A("rise", P("M-6 -36 q-4 -6 0 -12 M6 -36 q4 -6 0 -12", null, "steam", 2))),
    bed: (v, id) => R(300, 120, 280, 60, "wood", 6) + R(300, 104, 60, 40, "paper", 10) + R(352, 112, 228, 54, "c5", 10, null, 0, "opacity:0.8") + G(560, 76, R(-18, -20, 36, 26, "paper", 3) + P("M-10 -20 q10 -12 20 0", "paper", "line", 1)) +
      G(250, 60, A("float", R(-4, -26, 8, 34, "paper", 4, "line", 1) + O(0, 10, 7, "c1") + R(-1.5, -18, 3, 26, "c1", 1))) + (id === "flu" ? G(360, 98, R(-16, -8, 32, 14, "sweat", 6)) : ""),
    laptop: () => G(450, 176, P("M-70 0 L-58 -86 L58 -86 L70 0 Z", "dark") + R(-52, -80, 104, 68, "screen", 3) + G(0, -50, O(0, -6, 10, "skinb") + R(-14, 4, 28, 18, "uniform", 6)) + R(-90, 0, 180, 8, "metal", 3)) +
      sparkle(520, 60, 0.9) + sparkle(380, 70, 0.6),
    mom: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 0, sex: "f" }, mood: "grumpy", pose: "hold" }), 1.05) + G(560, 150, R(-16, -16, 32, 24, "wood2", 4) + R(-10, -10, 20, 10, "dark", 2) + O(0, -16, 4, "c1")),
    hearts: () => G(450, 120, A("float", R(-24, -16, 48, 32, "paper", 2, "line", 1) + P("M-24 -16 L0 4 L24 -16", null, "line", 1) + heart(0, -2, 1, "c1")), 1.6) + G(560, 168, R(-9, -26, 18, 28, "c2", 4) + R(-9, -20, 18, 6, "c1")) +
      heart(380, 90, 1.4, "c1", -0.5) + heart(420, 50, 1, "blossom", -1.5) + heart(560, 70, 1.2, "c1", -2.5),
    chat: () => G(440, 110, R(-80, -70, 160, 30, "screen", 12) + R(-50, -30, 130, 30, "paper", 12, "line", 1) + T(30, -9, "100", "c1", 18) + R(-80, 10, 110, 30, "screen", 12)) +
      G(560, 170, A("flicker", P("M0 0 Q-20 -20 -6 -46 Q0 -30 8 -34 Q4 -52 16 -64 Q26 -30 20 0 Z", "fall") + P("M4 0 Q-6 -14 4 -28 Q10 -18 14 -6 Z", "gold"))),
    raincloud: () => G(270, 34, A("drift", E(0, 0, 40, 16, "storm") + E(24, -10, 24, 14, "storm") + E(-22, -6, 20, 12, "storm")) +
      (function () { let s = ""; for (let i = 0; i < 6; i++) s += G(-28 + i * 11, 12, A("fall", L(0, 0, -2, 8, "sweat", 2), "--d:1.2s;--del:-" + (i * 0.2) + "s;--dx:-4px;--fy:70px")); return s; })()) + R(420, 140, 160, 8, "wood", 2) + books(470, 140, 3, 3),
    candle: () => G(440, 170, R(-14, -40, 28, 40, "paper", 3, "line", 1) + P("M-14 -40 Q0 -34 14 -40", "paper2") + L(0, -40, 0, -48, "dark", 2) + G(0, -52, A("rise", P("M0 0 q-6 -8 0 -16 q6 -8 0 -16", null, "steam", 2)))) +
      R(0, 0, EW + 80, EH, "shadow", 0, null, 0, "opacity:0.5"),
    notes: () => G(470, 130, A("float", R(-60, -40, 120, 80, "paper", 4, "line", 1.5) + L(0, -40, 0, 40, "line", 1.5) + L(-50, -24, -10, -24, "c2", 6, "opacity:0.7") + L(-50, -10, -16, -10, "line", 2) +
      L(-50, 4, -6, 4, "c3", 6, "opacity:0.6") + L(10, -24, 50, -24, "line", 2) + L(10, -10, 44, -10, "c4", 6, "opacity:0.5") + L(10, 4, 50, 4, "line", 2))) + sparkle(400, 60) + sparkle(540, 70, 0.8) + sparkle(470, 40, 0.6),
    shop: () => G(160, 34, A("drift", T(0, 0, "₩", "gold", 30)), 1) + G(230, 60, A("fall", O(0, 0, 8, "gold", "gold2", 2), "--d:3s;--dx:0px;--fy:120px")) + G(110, 50, A("fall", O(0, 0, 7, "gold", "gold2", 2), "--d:3.6s;--del:-1s;--dx:6px;--fy:130px")),
    grandma: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 2, grey: true, sex: "f" }, mood: "happy", prop: "envelope", pose: "hold" }), 0.95) +
      heart(400, 60, 1.2, "c1", -1) + heart(540, 50, 1, "blossom", -2),
    sheep: () => clock(470, 60, 22, 3) + G(400, 140, A("hop", E(0, 0, 18, 13, "paper", "line", 1.5) + O(16, -6, 7, "dark") + L(-8, 12, -8, 20, "dark", 3) + L(8, 12, 8, 20, "dark", 3))) +
      G(520, 150, A("hop", E(0, 0, 14, 10, "paper", "line", 1.5) + O(12, -5, 6, "dark") + L(-6, 9, -6, 16, "dark", 3) + L(6, 9, 6, 16, "dark", 3), "--del:-0.7s")) + G(560, 100, A("rise", T(0, 0, "z", "c5", 18) + T(10, -14, "z", "c5", 14), "--del:-1s")),
    stall: () => bunting(0, 680, 22, 3) + G(460, 176, R(-90, -60, 180, 60, "c1", 4) + R(-100, -100, 200, 18, "c2", 4) + R(-90, -82, 6, 22, "wood2") + R(84, -82, 6, 22, "wood2") +
      E(-30, -66, 30, 10, "dark") + E(-30, -70, 24, 6, "c1dark") + G(-30, -80, A("rise", P("M-6 0 q-4 -6 0 -12 M6 0 q4 -6 0 -12", null, "steam", 2))) + R(20, -76, 50, 14, "paper", 3)) +
      G(80, 40, A("sway", L(0, 0, 0, 14, "line", 1) + E(0, 26, 12, 14, "c1") + R(-6, 12, 12, 4, "gold"))) + G(560, 54, A("sway slow", L(0, 0, 0, 14, "line", 1) + E(0, 26, 12, 14, "c2") + R(-6, 12, 12, 4, "gold"))),
    banner: () => G(300, 26, A("sway-slow", R(-110, 0, 220, 56, "c1", 4) + R(-104, 6, 208, 44, "c1dark", 3, null, 0, "opacity:0.35") + T(0, 42, "D-100", "paper", 36))) + R(500, 120, 60, 58, "wood", 2),
    polaroids: () => G(470, 100, R(-50, -46, 60, 70, "paper", 2, "line", 1, "") + R(-44, -40, 48, 46, "sky") + O(-28, -14, 7, "skin") + O(-12, -16, 7, "skinb") + R(-36, -8, 30, 14, "c3", 4)) +
      G(520, 120, R(-30, -40, 60, 70, "paper", 2, "line", 1) + R(-24, -34, 48, 46, "blossom") + O(-8, -8, 7, "skin") + O(8, -10, 7, "skinb")) + G(400, 170, P("M-14 0 L0 -24 L14 0 Z", "paper", "line", 1) + R(-10, -10, 20, 10, "dark")),
    toilet: () => G(460, 178, E(0, -34, 50, 14, "paper", "line", 2) + E(0, -34, 40, 9, "sweat") + P("M-46 -30 Q-40 0 -20 0 L20 0 Q40 0 46 -30", "paper", "line", 2) + R(-40, -110, 80, 60, "paper", 8, "line", 2) +
      G(0, -48, A("bounce", R(-6, -14, 12, 22, "dark", 3) + R(-4, -12, 8, 15, "screen", 1)))) + G(430, 112, A("rise", O(0, 0, 4, "sweat") + O(50, -6, 3, "sweat") + O(24, -14, 3.5, "sweat"))),
    planner: () => G(470, 120, R(-70, -50, 140, 100, "paper", 4, "line", 1.5) + (function () { let s = ""; for (let i = 0; i < 6; i++) s += L(-60, -32 + i * 14, 60, -32 + i * 14, "line", 1); for (let i = 0; i < 4; i++) s += L(-60 + i * 40, -40, -60 + i * 40, 40, "line", 1); return s; })() +
      R(-58, -30, 36, 10, "c3", 2, null, 0, "opacity:0.7") + R(-18, -16, 36, 10, "c1", 2, null, 0, "opacity:0.7") + R(22, -2, 36, 10, "c5", 2, null, 0, "opacity:0.7") + R(-58, 12, 36, 10, "c2", 2, null, 0, "opacity:0.7")),
    trip: () => G(480, 176, R(-80, -70, 160, 62, "c2", 10) + R(-70, -60, 40, 24, "screen", 3) + R(-20, -60, 40, 24, "screen", 3) + R(30, -60, 40, 24, "screen", 3) + O(-50, -6, 12, "dark") + O(50, -6, 12, "dark")),
    bulb: () => G(300, 40, A("pulse", O(0, 0, 34, "lamp", null, 0, "opacity:0.35")) + O(0, 0, 18, "lamp", "gold2", 2) + R(-7, 16, 14, 10, "metal", 2) + L(-4, -4, 0, 6, "gold2", 2) + L(4, -4, 0, 6, "gold2", 2)) +
      sparkle(250, 30, 0.7) + sparkle(350, 26, 0.6),
    examEve: () => G(470, 176, R(-60, -70, 100, 70, "c5", 14) + R(-50, -60, 80, 18, "c5dark", 6, null, 0, "opacity:0.4")) + clock(540, 70, 20, 10) +
      G(400, 170, R(-20, -10, 40, 26, "paper", 2, "line", 1) + O(-10, 0, 5, "skin") + L(0, -2, 14, -2, "line", 1.5) + L(0, 4, 14, 4, "line", 1.5)) + G(560, 166, O(0, 0, 10, "paper", "dark", 3)),
    lunchbox: () => G(450, 170, R(-80, -50, 120, 50, "c5", 6) + R(-74, -44, 52, 38, "paper", 4) + R(-16, -44, 50, 18, "c1", 3) + R(-16, -22, 24, 16, "leaf", 3) + O(20, -14, 8, "gold") +
      R(56, -86, 34, 86, "metal", 8) + R(56, -90, 34, 12, "dark", 5)) + G(520, 70, A("rise", P("M0 0 q-6 -8 0 -16 q6 -8 0 -16", null, "steam", 2))) + heart(380, 70, 1, "c1", -1),
    counsel: () => G(500, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 1, shirt: 3, sex: "m", glasses: true }, mood: "ok", pose: "hold", prop: "book" }), 0.95),
    // People: a birthday cake, a block tower, a cheering sign at the exam gate.
    cake: () => G(470, 176, R(-50, -40, 100, 40, "paper", 6, "line", 1.5) + R(-50, -40, 100, 10, "blossom", 4) + R(-40, -66, 80, 26, "paper", 6, "line", 1.5) + R(-40, -66, 80, 8, "c1", 3) +
      [-24, -8, 8, 24].map((x) => R(x - 2, -82, 4, 16, "c5", 1) + G(x, -86, A("flicker", P("M0 0 Q-3 -5 0 -10 Q3 -5 0 0 Z", "gold")))).join("")) + bunting(20, 660, 24, 4) + sparkle(400, 60, 0.8) + sparkle(540, 50, 0.7),
    tower: () => toyBlocks(470, EF) + G(470, EF - 44, toyBlocks(0, 0)) + sparkle(430, 70, 0.8) + sparkle(530, 90, 0.6),
    cheer: () => G(470, 112, A("sway", R(-50, -30, 100, 56, "paper", 4, "line", 1.5) + heart(0, -6, 1.4, "c1") + L(-44, 26, -44, 70, "wood2", 4) + L(44, 26, 44, 70, "wood2", 4))) +
      G(400, 150, A("bounce", O(0, 0, 14, "c2") + O(6, -6, 9, "c2dark"))) + G(560, 140, A("bounce", O(0, 0, 14, "c5") + O(-5, -6, 9, "c5dark"), "--del:-0.4s")) + sparkle(420, 40, 0.8),
    sparkles: () => sparkle(420, 60, 1.2) + sparkle(500, 110, 0.9, "c5") + sparkle(380, 130, 0.7, "c1") + sparkle(540, 50, 0.6, "c3"),
  };

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
  // ctx: { id, variant, stage, look, mood, season }
  function eventArt(ctx) {
    VIEW = (ctx && ctx.view) || "city";
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
      s += person(Object.assign({}, c, { look: lookFor(q.lk, q.x), mood: res.pmood || spec.pmood || "happy" }), x, EFEET, 0.86 * (k ? 0.94 : 1));
    });
    s += person(c, px, EFEET, 0.86, extra);
    return svg("0 0 " + EW + " " + EH, s, "event-art");
  }
  function iconFor(id) { return specFor(id, "").icon || "✨"; }

  // ---------- screen illustrations (same 600 × 220 frame) ----------
  const HOMES = {
    // Housing by income fifth: a rooftop room over a villa, an older low-rise block, a standard
    // apartment complex, a newer complex with a park, and a riverside tower.
    q1: () => R(60, 110, 200, 94, "stone", 2) + R(110, 70, 80, 40, "c2", 2) + R(100, 64, 100, 8, "stone2") + R(126, 82, 18, 16, "screen", 2) + L(200, 84, 250, 84, "line", 1) + R(214, 84, 12, 14, "c5") + R(232, 84, 10, 12, "c1") +
      (function () { let s = ""; for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) s += R(76 + i * 62, 124 + k * 38, 26, 22, "screen", 2); return s; })(),
    q2: () => R(40, 70, 240, 134, "stone", 2) + R(40, 64, 240, 10, "stone2") + (function () { let s = ""; for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) s += R(52 + i * 38, 82 + k * 30, 22, 18, "screen", 2); return s; })(),
    q3: () => [40, 170].map((x, j) => R(x, 30 + j * 16, 110, 174 - j * 16, j ? "stone" : "stone2", 2) + (function () { let s = ""; for (let i = 0; i < 3; i++) for (let k = 0; k < 7 - j; k++) s += R(x + 12 + i * 32, 44 + j * 16 + k * 22, 20, 12, "screen", 2); return s; })()).join(""),
    q4: () => HOMES.q3() + tree(30, 204, "spring", 0.8) + tree(300, 204, "spring", 0.9) + R(0, 196, 320, 8, "grass"),
    // A children's home: a long two-storey building behind a low fence, with a slide in the yard.
    care: () => R(30, 80, 250, 124, "stone", 2) + R(24, 72, 262, 12, "stone2") + R(138, 150, 34, 54, "c2", 2) +
      (function () { let s = ""; for (let i = 0; i < 5; i++) for (let k = 0; k < 2; k++) s += R(44 + i * 48, 94 + k * 34, 26, 22, "screen", 2); return s; })() +
      (function () { let s = ""; for (let i = 0; i < 14; i++) s += R(6 + i * 24, 184, 4, 20, "stone2"); return s; })() + R(4, 186, 330, 4, "stone2") +
      L(300, 204, 330, 150, "metal", 4) + L(330, 150, 350, 150, "metal", 4) + L(350, 150, 350, 204, "metal", 3) + P("M300 204 L330 150 L338 154 L310 204 Z", "c1"),
    q5: () => R(0, 176, 600, 20, "river") + P("M100 20 L180 6 L180 204 L100 204 Z", "glass") + P("M180 6 L230 26 L230 204 L180 204 Z", "stone2") +
      (function () { let s = ""; for (let k = 0; k < 12; k++) s += L(104, 30 + k * 14, 176, 20 + k * 14.6, "screen", 2, "opacity:0.7"); return s; })() + R(250, 60, 60, 144, "glass", 2) + G(560, 60, O(0, 0, 3, "gold")),
  };
  // What each parent wears for work (engine JOBS ids).
  const JOB_GEAR = { exec: "suit", doctor: "coat", pro: "suit", civil: "suit", office: "suit", nurse: "scrubs", service: "apron", shop: "apron",
    farmer: "straw", builder: "hardhat", driver: "cap", factory: "vest", labor: "vest" };
  const homeShape = (ctx) => (ctx.parents === "care" ? HOMES.care : HOMES[ctx.family] || HOMES.q3);
  const SCREENS = {
    birth(ctx) {
      let s = outdoorSky(EW, EH, { season: "spring", seed: 81 });
      s += homeShape(ctx)() + R(0, 196, EW, 24, "grass");
      s += tree(560, 200, "spring", 1.1) + tree(480, 204, "spring", 0.8) + particles("spring", 0, 0, EW, 200, false, 12, 3);
      // Whoever raises you stands at the door (dressed for work when they have a job) with the newborn
      // in a blanket. mom() is the mother, a grandmother or a carer; with only a dad, he holds the baby.
      const j = ctx.jobs || {};
      const dadHolds = ctx.parents === "dad";
      s += mom(ctx, 340, EFEET, 0.95, { gear: JOB_GEAR[j.mom] || "", mood: "happy", pose: dadHolds ? "stand" : "hold", prop: dadHolds ? "" : "baby" });
      s += dad(ctx, 450, EFEET, 0.98, { gear: JOB_GEAR[j.dad] || "", mood: "happy", pose: dadHolds ? "hold" : "wave", prop: dadHolds ? "baby" : "" });
      return s;
    },
    track() {
      let s = outdoorSky(EW, EH, { season: "winter", seed: 82 }) + R(0, 150, EW, 70, "grass") + P("M260 220 L290 150 L310 150 L340 220 Z", "path") + P("M290 150 L150 120 L170 118 L305 150 Z", "path") + P("M305 150 L440 118 L460 120 L310 150 Z", "path");
      s += G(300, 150, R(-4, -90, 8, 90, "wood2") + G(-38, -78, R(-30, -14, 70, 28, "c4", 4) + P("M-30 -14 L-44 0 L-30 14 Z", "c4")) + G(38, -48, R(-40, -14, 70, 28, "c3", 4) + P("M30 -14 L44 0 L30 14 Z", "c3")));
      s += G(130, 110, O(0, 0, 16, "c5") + P("M-16 0 Q0 -8 16 0 M-16 0 Q0 8 16 0 M0 -16 L0 16", null, "paper", 1.5)) + G(480, 110, R(-6, -20, 12, 16, "paper", 2) + P("M-6 -4 L-16 16 L16 16 L6 -4 Z", "c3"));
      return s + particles("winter", 0, 0, EW, 200, false, 14, 4);
    },
    mock(ctx) {
      let s = BACKDROPS.class(ctx) + R(140, 150, 320, 30, "wood", 3);
      s += G(300, 150, R(-60, -60, 120, 66, "paper", 3, "line", 1) + (function () { let x = ""; for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) x += O(-44 + k * 12, -48 + i * 11, 3.5, i === k % 5 ? "dark" : "omr", "c1", 0.8); return x; })() +
        R(20, -52, 32, 46, "omr", 2) + G(66, -4, R(-3, -40, 6, 40, "c2", 2, null, 0, "transform:rotate(30deg)")));
      return s;
    },
    exam(ctx) { return SCENES_EV.exam(ctx); },
    report() {
      let s = R(0, 0, EW, EH, "nightwall") + R(0, 178, EW, 42, "nightfloor");
      s += G(300, 120, A("float", R(-110, -80, 220, 140, "paper", 4, "line", 1.5) + R(-110, -80, 220, 26, "c5", 4) + R(-96, -40, 120, 6, "line") + R(-96, -26, 160, 6, "line") + R(-96, -12, 100, 6, "line") +
        O(70, 24, 22, "c1", null, 0, "opacity:0.85") + O(70, 24, 16, null, "paper", 2)));
      return s + sparkle(150, 60) + sparkle(460, 50, 0.8);
    },
    apply() {
      let s = R(0, 0, EW, EH, "wall") + R(0, 178, EW, 42, "floor");
      ["c1", "c5", "c3"].forEach((c, i) => { s += G(200 + i * 100, 120, A("float", R(-40, -28, 80, 56, "paper", 3, c, 3) + P("M-40 -28 L0 4 L40 -28", null, c, 2) + O(0, 4, 6, c)), 1, "", "--del:-" + i * 0.7 + "s"); });
      return s;
    },
    // ---------- the epilogue ----------
    // A campus lawn with a lecture hall, a clock tower and cherry trees.
    campus(ctx) {
      let s = outdoorSky(EW, EH, { season: "spring", seed: 84 }) + R(0, 168, EW, 52, "grass") + P("M250 220 L280 168 L320 168 L350 220 Z", "path");
      s += R(60, 70, 190, 100, "stone", 3) + R(52, 62, 206, 12, "stone2", 2) + R(140, 30, 30, 44, "stone2", 2) + clock(155, 46, 10, 10);
      for (let i = 0; i < 4; i++) s += R(74 + i * 44, 92, 26, 30, "glass", 2) + R(74 + i * 44, 134, 26, 30, "glass", 2);
      s += R(380, 96, 160, 74, "wall", 3) + R(372, 88, 176, 12, "wall2", 2);
      for (let i = 0; i < 3; i++) s += R(392 + i * 50, 110, 34, 26, "glass", 2);
      s += tree(30, 176, "spring", 1) + tree(570, 176, "spring", 1.1) + particles("spring", 0, 0, EW, 170, false, 12, 21);
      return s + person(ctx, 300, EFEET, 0.95, { mood: "happy", prop: "book", pose: "hold" });
    },
    // A barracks on a hill, a flagpole and a duffel bag.
    army(ctx) {
      let s = outdoorSky(EW, EH, { season: "winter", seed: 85 }) + P("M0 150 Q160 110 320 146 T600 132 L600 220 L0 220 Z", "hill") + R(0, 178, EW, 42, "path");
      s += R(330, 100, 220, 70, "stone2", 2) + P("M322 104 L440 74 L558 104 Z", "leaf2") + R(420, 130, 30, 40, "wood2", 2);
      for (let i = 0; i < 4; i++) s += R(344 + i * 50, 116, 24, 16, "lamp", 2);
      s += L(110, 178, 110, 60, "metal", 4) + G(112, 64, A("sway", R(0, 0, 40, 24, "c5", 2) + O(20, 12, 6, "c1")));
      s += G(230, 196, E(0, 0, 34, 14, "hoodie2") + R(-30, -14, 60, 16, "hoodie", 8));
      return s + particles("winter", 0, 0, EW, 170, false, 10, 22) + person(ctx, 300, EFEET, 0.95, { mood: ctx.mood || "ok" });
    },
    // An interview chair in front of a long desk, and a stack of applications.
    hunt(ctx) {
      let s = R(0, 0, EW, EF, "wall") + floorPlanks(EF, EW, EH - EF) + windowView(470, 30, 100, 90, { season: "fall", seed: 86, tree: false });
      s += R(40, 120, 260, 20, "wood", 3) + R(52, 140, 10, 40, "wood2") + R(278, 140, 10, 40, "wood2");
      for (let i = 0; i < 3; i++) s += G(80 + i * 80, 110, O(0, -26, 12, "hair") + R(-18, -16, 36, 26, "uniform", 8) + R(-14, 4, 28, 6, "paper", 1));
      s += G(400, 170, R(-4, -40, 8, 40, "metal2") + R(-24, -46, 48, 10, "metal", 3));
      for (let i = 0; i < 4; i++) s += R(500, 160 - i * 7, 60, 6, i % 2 ? "paper" : "paper2", 1, "line", 1);
      return s + person(ctx, 400, EFEET, 0.92, { mood: ctx.mood || "ok" });
    },
    // A city at dusk: towers, an apartment block and you on a balcony-high bridge.
    at30(ctx) {
      const gid = nid("dusk");
      let s = grad(gid, "dusk", "dusk2") + R(0, 0, EW, EH, null, 0, null, 0, "fill:url(#" + gid + ")") + O(470, 120, 30, "sun", null, 0, "opacity:0.85");
      const r = rand(87);
      for (let i = 0; i < 8; i++) {
        const x = i * 78, h = 60 + r() * 90;
        s += R(x, EF - h, 62, h, "city");
        for (let yy = EF - h + 10; yy < EF - 8; yy += 14) for (let xx = x + 6; xx < x + 56; xx += 14) if (r() < 0.45) s += R(xx, yy, 7, 6, "lamp");
      }
      s += R(0, EF, EW, EH - EF, "road") + R(0, EF - 4, EW, 6, "metal");
      return s + person(ctx, 300, EFEET, 0.95, { mood: ctx.mood || "happy" });
    },
  };
  // v6.0: the report card, the six 수시 envelopes, the first-round notice board, the results page.
  // Grade digits are numbers, not words, so the report card can show them.
  const GRADE_TOK = ["c3", "c5", "c2", "c4", "c1"];
  Object.assign(SCREENS, {
    naesin(ctx) {
      let s = R(0, 0, EW, EH, "wall") + R(0, 178, EW, 42, "floor") + R(120, 150, 360, 30, "wood", 3);
      const gs = (ctx.grades || [2, 3, 1, 2, 3]).slice(0, 6);
      let rows = "";
      gs.forEach((g, i) => {
        rows += R(-70, -44 + i * 15, 70, 6, "line", 2) + R(14, -48 + i * 15, 22, 13, GRADE_TOK[(g || 3) - 1], 3) + T(25, -38 + i * 15, String(g), "paper", 10);
      });
      s += G(300, 110, A("float", R(-90, -70, 180, 150, "paper", 4, "line", 1.5) + R(-90, -70, 180, 18, "c5", 4) + rows + O(60, 54, 14, "c1", null, 0, "opacity:0.85") + O(60, 54, 10, null, "paper", 2)));
      return s + person(ctx, 500, EFEET, 0.8, { pose: "hold", prop: "book" }) + sparkle(150, 60, 0.8);
    },
    susi(ctx) {
      let s = R(0, 0, EW, EH, "wall") + R(0, 178, EW, 42, "floor");
      ["c1", "c5", "c3", "c2", "c4", "c5"].forEach((c, i) => {
        const x = 110 + (i % 3) * 80, y = 70 + Math.floor(i / 3) * 62;
        s += G(x, y, A("float", R(-30, -20, 60, 40, "paper", 3, c, 2.5) + P("M-30 -20 L0 4 L30 -20", null, c, 2)), 1, "", "--del:-" + i * 0.5 + "s");
      });
      return s + person(ctx, 470, EFEET, 0.86, { mood: "stressed", pose: "hold" });
    },
    susiStage(ctx) {
      let s = BACKDROPS.class(ctx) + R(110, 28, 260, 130, "wood2", 6) + R(118, 36, 244, 114, "board", 4);
      for (let i = 0; i < 6; i++) s += G(150 + (i % 3) * 80, 66 + Math.floor(i / 3) * 52, R(-28, -18, 56, 40, "paper", 2) + R(-20, -10, 40, 4, "line") + R(-20, -2, 30, 4, "line") + O(0, -18, 4, ["c1", "c5", "c3"][i % 3]));
      return s + person(ctx, 470, EFEET, 0.86, {});
    },
    susiResult(ctx) {
      let s = R(0, 0, EW, EH, "nightwall") + R(0, 178, EW, 42, "nightfloor") + R(130, 150, 300, 30, "wood", 3);
      s += G(280, 150, P("M-80 0 L-66 -96 L66 -96 L80 0 Z", "dark") + R(-58, -90, 116, 76, "screen", 3) + R(-46, -76, 92, 10, ctx.mood === "happy" ? "c3" : "c1", 3) +
        R(-46, -58, 60, 6, "line") + R(-46, -46, 76, 6, "line") + R(-100, 0, 200, 8, "metal", 3));
      if (ctx.mood === "happy") s += sparkle(200, 50) + sparkle(360, 40, 0.8) + sparkle(420, 90, 0.6);
      return s + person(ctx, 500, EFEET, 0.86, { pose: ctx.mood === "happy" ? "cheer" : null });
    },
  });
  const SCENES_EV = {
    exam(ctx) {
      let s = R(0, 0, EW, EF, "wall") + floorPlanks(EF, EW, EH - EF) + R(140, 20, 300, 96, "board", 4, "wood", 6) + clock(500, 50, 22, 8) + windowView(530, 90, 60, 70, { season: "fall", seed: 91, tree: false });
      for (const x of [60, 470]) s += G(x, 196, R(-40, -12, 80, 8, "wood", 2) + R(-16, -16, 32, 5, "paper", 1) + O(-18, -30, 14, "hair") + R(-36, -20, 34, 22, "hoodie", 8));
      return s + person(ctx, 260, EFEET, 0.86, { mood: ctx.mood === "happy" ? "ok" : ctx.mood });
    },
  };
  function screenArt(name, ctx) {
    VIEW = (ctx && ctx.view) || "city";
    if (name === "offers" || name === "ending") return svg("0 0 " + W + " " + H, SCENES[ctx.label ? "gate" : name === "ending" ? "road" : "home"](ctx), "event-art wide");
    return svg("0 0 " + EW + " " + EH, SCREENS[name](ctx), "event-art");
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
    return { t, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CW + " " + CH + '" preserveAspectRatio="xMidYMid slice" class="art cut-art" aria-hidden="true" focusable="false"><g class="cam" style="' + style + '">' + body + "</g></svg>" };
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
  const petals = (seed, n) => particles("spring", 0, 0, CW, CH - 40, false, n || 22, seed || 5);
  // A street that scrolls past behind someone walking in place: far city, near trees and a fence.
  function streetPan(t, season) {
    const r = rand(77);
    let far = "", near = "";
    for (let i = 0; i < 14; i++) {
      const x = i * 90, h = 90 + r() * 90;
      far += R(x, CG - 40 - h, 80, h + 40, "city") + R(x + 12, CG - 30 - h, 14, 12, "lamp", 0, null, 0, "opacity:0.35");
    }
    for (let i = 0; i < 40; i++) near += R(i * 32, CG - 30, 4, 34, "paper", 1, null, 0, "opacity:0.8");
    for (let i = 0; i < 8; i++) near += tree(80 + i * 170, CG + 6, season, 1.25);
    return outdoorSky(CW, CH, { season, seed: 31 }) + walk(0, -260, 0, t, far) + R(0, CG - 4, CW, CH, "path") +
      walk(0, -620, 0, t, near + R(0, CG - 30, 1360, 4, "paper", 0, null, 0, "opacity:0.8")) + R(0, CG + 34, CW, 8, "stone2") + (season === "spring" ? petals(12, 18) : "");
  }
  // A school (or university) gate: a building, two pillars and a name plate the app passes in as text.
  function gateShot(label, floors, season) {
    let s = outdoorSky(CW, CH, { season, seed: 19 }) + R(0, CG, CW, CH - CG, "grass") + P("M330 450 L370 " + CG + " L430 " + CG + " L470 450 Z", "path");
    const top = CG - 40 - floors * 34;
    s += R(150, top, 500, CG - top, "stone", 4) + R(140, top - 12, 520, 14, "stone2", 3);
    for (let f = 0; f < floors; f++) for (let i = 0; i < 9; i++) s += R(172 + i * 52, top + 14 + f * 34, 30, 20, "glass", 2);
    s += tree(90, CG + 4, season, 1.6) + tree(720, CG + 4, season, 1.7);
    s += R(230, 180, 46, CG - 180, "stone2", 3) + R(524, 180, 46, CG - 180, "stone2", 3) + R(218, 170, 70, 16, "stone", 3) + R(512, 170, 70, 16, "stone", 3);
    s += R(270, 116, 260, 44, "paper", 6, "gold", 3) + (label ? T(400, 145, label, "ink", label.length > 20 ? 12 : label.length > 13 ? 15 : 19) : "");
    return s;
  }
  // The 돌잡이 table seen from the front, scaled up from the event art's coordinates.
  const DOL_ORDER = ["pencil", "book", "mouse", "stethoscope", "mic", "gavel", "ball", "thread", "money", "brush"];
  function dolTable() {
    let s = R(300, 166, 290, 14, "wood", 4) + R(310, 180, 10, 24, "wood2", 2) + R(570, 180, 10, 24, "wood2", 2) + R(296, 160, 298, 8, "c1", 3, null, 0, "opacity:0.6");
    DOL_ORDER.forEach((id, i) => { s += DOL_ITEMS[id](320 + i * 28); });
    return G(-314, 64, s, 1.6);
  }
  const dolX = (id) => (320 + Math.max(0, DOL_ORDER.indexOf(id)) * 28) * 1.6 - 314;
  const homeOf = (ctx) => G(40, 112, homeShape(ctx)(), 1.45);

  const CUTS = {
    birth(ctx) {
      // 1. A city at night, one lit window in the hospital; the camera pushes in.
      let a = outdoorSky(CW, CH, { night: true, seed: 7 });
      const r = rand(23);
      for (let i = 0; i < 10; i++) { const h = 80 + r() * 120; a += R(i * 84 - 10, CG - h, 76, h + 10, "city"); }
      a += R(270, 110, 260, CG - 110, "stone", 4) + R(258, 98, 284, 16, "stone2", 3) + R(370, 46, 60, 46, "paper", 6) + R(392, 52, 16, 34, "c1", 2) + R(383, 61, 34, 16, "c1", 2);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) a += R(292 + i * 46, 132 + j * 44, 26, 28, i === 3 && j === 1 ? "lamp" : "night2", 2);
      a += G(431, 190, A("pulse", O(0, 0, 40, "lamp", null, 0, "opacity:0.35")));
      a += R(0, CG, CW, CH - CG, "road") + R(0, CG, CW, 6, "stone2");
      // 2. The delivery room: a first cry over the bassinet, your parents leaning in.
      let b = R(0, 0, CW, CG, "tile") + R(0, CG, CW, CH - CG, "tile2") + windowView(560, 60, 170, 130, { night: true, season: ctx.season, city: true, seed: 8 });
      b += R(40, 300, 200, 56, "paper", 10, "line", 2) + R(40, 282, 56, 28, "paper", 8) + R(46, 356, 8, 62, "metal") + R(226, 356, 8, 62, "metal");
      b += mom(ctx, 290, CF, 1.45, { pose: "hold" }) + dad(ctx, 540, CF, 1.5, { pose: "hold" });
      b += R(350, 330, 110, 46, "c5", 10) + R(362, 376, 8, 42, "metal") + R(440, 376, 8, 42, "metal") + bundle(390, 326, 1.4);
      b += fx("c-fade", 0.5, G(450, 300, A("pulse", P("M0 0 q10 -10 0 -20 M10 4 q16 -14 0 -30 M20 8 q22 -18 0 -40", null, "c1", 3)))) + heart(380, 260, 1.6, "c1", 0.6) + heart(430, 240, 1.2, "blossom", 1.4);
      // 3. Coming home: the family's home in the spring, your parents walking up with you.
      let c = outdoorSky(CW, CH, { season: "spring", seed: 4 }) + homeOf(ctx) + R(0, CG + 30, CW, CH, "grass") + tree(700, CG + 34, "spring", 1.7);
      c += walk(360, 0, 0.1, 3.0, dad(ctx, 610, CF + 6, 1.5, momHolds(ctx) ? { pose: "wave" } : { pose: "hold", prop: "baby" }) + mom(ctx, 490, CF + 10, 1.45, { pose: "hold", prop: "baby" }));
      c += petals(5, 20);
      return [
        cutShot(3.2, a, { s0: 1, s1: 2.1, ox: 431, oy: 186 }),
        cutShot(3.6, b, { s0: 1.05, s1: 1.3, ox: 410, oy: 320 }),
        cutShot(3.6, c, { s0: 1.08, s1: 1.0, ox: 420, oy: 300, x0: -20, x1: 10 }),
      ];
    },
    dol(ctx) {
      const items = (ctx.items || []).filter((id) => DOL_ITEMS[id]);
      if (!items.length) items.push("pencil");
      // 1. The first-birthday party: a folding screen, balloons, a rice-cake tower, the whole family.
      let a = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor");
      for (let i = 0; i < 8; i++) a += R(120 + i * 70, 70, 66, 220, i % 2 ? "c3" : "c5", 3, null, 0, "opacity:0.55") + R(128 + i * 70, 82, 50, 196, "paper2", 2, null, 0, "opacity:0.7");
      a += bunting(60, 740, 40, 2);
      [[90, "c1"], [150, "c2"], [650, "c4"], [710, "c5"]].forEach(([x, col], i) => { a += G(x, 120, A("float", O(0, 0, 22, col) + L(0, 22, 0, 90, "line", 1.2), "--del:-" + i * 0.6 + "s")); });
      a += R(300, 300, 200, 16, "wood", 3) + R(312, 316, 8, 60, "wood2") + R(480, 316, 8, 60, "wood2");
      ["c1", "paper", "c2", "blossom", "c3", "paper2"].forEach((col, i) => { a += R(340 + i * 6, 278 - i * 22, 120 - i * 12, 22, col, 4); });
      a += mom(ctx, 150, CF, 1.35, { pose: "cheer" }) + dad(ctx, 250, CF, 1.4, { pose: "wave" });
      a += G(560, CF, avatar({ age: "adult", outfit: "casual", look: { hair: 2, skin: ctx.look.skin, shirt: 3, sex: "f" }, mood: "happy", pose: "cheer" }), 1.25);
      a += G(660, CF, avatar({ age: "adult", outfit: "casual", look: { hair: 0, skin: ctx.look.skin, shirt: 1, sex: "m" }, mood: "happy", pose: "wave" }), 1.3);
      // 2. The table of objects; you toddle up to the one you'll grab.
      let b = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor");
      for (let i = 0; i < 8; i++) b += R(80 + i * 84, 50, 80, 230, i % 2 ? "c3" : "c5", 3, null, 0, "opacity:0.45");
      b += dolTable();
      const tx = dolX(items[0]);
      b += walk(-300, 0, 0.3, 2.4, me(ctx, "baby", tx - 18, 446, 1.7, { mood: "happy" }));
      b += fx("c-fade", 2.7, sparkle(tx, 270, 1.2) + sparkle(tx + 18, 290, 0.7, "c5"));
      // 3. The grab, up close: the item (or both) held high, confetti.
      let c = R(0, 0, CW, CH, "wall") + G(400, 225, A("pulse", O(0, 0, 230, "lamp", null, 0, "opacity:0.35")));
      const one = items.length === 1;
      items.slice(0, 2).forEach((id, i) => {
        const x = one ? 400 : 290 + i * 220, sc = one ? 4.2 : 3.4;
        c += G(x, 225, fx("c-pop", 0.2 + i * 0.35, G(0, -150 * sc, DOL_ITEMS[id](0), sc)));
        c += sparkle(x - 90, 120, 1.4) + sparkle(x + 80, 300, 1) + sparkle(x + 60, 100, 0.8, "c5");
      });
      c += confettiRain(40, 3);
      return [
        cutShot(3.0, a, { s0: 1.12, s1: 1.12, x0: 50, x1: -50 }),
        cutShot(3.6, b, { s0: 1, s1: 1.35, ox: tx, oy: 330 }),
        cutShot(3.2, c, { s0: 0.92, s1: 1.04 }),
      ];
    },
    // First day of elementary school: out of the door, the walk, the gate.
    elem(ctx) {
      let a = outdoorSky(CW, CH, { season: "spring", seed: 6 }) + homeOf(ctx) + R(0, CG + 30, CW, CH, "grass") + tree(720, CG + 34, "spring", 1.6);
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
      let a = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor") + windowView(80, 70, 200, 160, { season: "spring", city: true, seed: 12 });
      a += R(520, 60, 120, 300, "frame", 8) + R(532, 72, 96, 276, "glass", 4, null, 0, "opacity:0.75") + P("M548 90 L600 70 M548 130 L620 90", null, "paper", 3, "opacity:0.6");
      a += R(620, 300, 160, 70, "c4", 10) + R(620, 280, 60, 30, "paper", 8);
      a += me(ctx, st, 400, CF, 1.6, { mood: "happy" }) + fx("c-fade", 1.0, sparkle(380, 250, 1.1) + sparkle(430, 300, 0.8) + sparkle(370, 330, 0.6, "c5"));
      let b = streetPan(3.2, "spring");
      b += walk(0, -100, 0, 3.2, other(61, 590, CF, 1.25) + other(62, 670, CF, 1.25));
      b += me(ctx, st, 360, CF, 1.45, { mood: "happy" });
      let c = gateShot(ctx.label, high ? 5 : 4, "spring");
      [[120, 71], [190, 72], [640, 73], [700, 74]].forEach(([x, sd]) => { c += other(sd, x, CF, 1.2); });
      c += walk(-260, 0, 0.2, 2.4, me(ctx, st, 400, CF + 14, 1.5, { mood: "happy" })) + petals(10, 18);
      return [
        cutShot(2.8, a, { s0: 1, s1: 1.25, ox: 410, oy: 300 }),
        cutShot(3.2, b, { s0: 1.05, s1: 1.05 }),
        cutShot(3.4, c, { s0: 1.2, s1: 1.0, ox: 400, oy: 320 }),
      ];
    },
    // 수능 morning: a cold dawn walk, a police escort, the gate, the bell.
    exam(ctx) {
      const st = ctx.stage;
      let a = outdoorSky(CW, CH, { night: true, seed: 3 }) + R(0, 220, CW, 160, "dusk", 0, null, 0, "opacity:0.35") + R(0, CG, CW, CH - CG, "road");
      for (let i = 0; i < 4; i++) a += G(80 + i * 220, CG, R(-3, -170, 6, 170, "metal") + R(-14, -176, 28, 8, "metal", 3) + A("pulse", O(0, -160, 34, "lamp", null, 0, "opacity:0.3")) + O(0, -168, 7, "lamp"));
      a += particles("fall", 0, 0, CW, CG, false, 10, 4);
      let pair = mom(ctx, 330, CF, 1.45, { pose: "hold", mood: "ok" }) + me(ctx, st, 440, CF, 1.5, { mood: "ok" });
      for (let i = 0; i < 3; i++) pair += G(466, 214, A("rise", E(0, 0, 10, 6, "steam", null, 0, "opacity:0.8"), "--del:" + (i * 0.9) + "s"));
      a += walk(-200, 0, 0, 3.0, pair);
      let b = outdoorSky(CW, CH, { season: "fall", seed: 21 }) + R(0, CG - 160, CW, 160, "city") + R(0, CG, CW, CH - CG, "road") + R(0, CG + 30, CW, 6, "paper", 0, null, 0, "opacity:0.6");
      // Riders first, sitting down into the bodywork drawn over their legs; the officer wears a helmet.
      let bike = G(-46, -18, avatar({ age: "teen", outfit: "uniform", look: lookFor(88, "f"), mood: "stressed" }), 0.85);
      bike += G(-6, -22, avatar({ age: "adult", outfit: "casual", gear: "helmet", look: { hair: 0, skin: 0, shirt: 2, sex: "m" }, mood: "ok" }), 0.9);
      bike += O(-56, -22, 24, "dark") + O(60, -22, 24, "dark") + O(-56, -22, 9, "metal") + O(60, -22, 9, "metal") + P("M-74 -36 L-60 -64 L-10 -76 L60 -66 L84 -36 Z", "paper", "line", 2) + R(-50, -60, 100, 10, "c5", 3);
      bike += R(-78, -110, 4, 50, "metal") + G(-76, -114, A("pulse", O(0, 0, 9, "c1")) + A("pulse", O(12, 0, 9, "c5"), "--del:-1.2s"));
      for (let i = 0; i < 5; i++) bike += L(100 + i * 10, -100 + i * 18, 190 + i * 30, -100 + i * 18, "paper", 3, "opacity:0.7");
      b += walk(820, -820, 0.2, 3.0, G(400, CF, bike, 1.2));
      let c = gateShot(ctx.label, 4, "fall");
      [[70, 81, "c2"], [150, 82, "c3"], [230, 83, "c1"]].forEach(([x, sd, col], i) => {
        c += G(x, CF, A("hop", R(-34, -230, 68, 46, col, 6) + R(-2, -186, 4, 60, "wood2") + avatar({ age: "teen", outfit: "uniform", look: lookFor(sd, sd % 2 ? "m" : "f"), mood: "happy", pose: "cheer" }), "--del:-" + i * 0.35 + "s"), 1.15);
      });
      c += G(310, CF - 20, R(-26, -34, 52, 40, "c1", 8) + E(0, -34, 26, 8, "paper") + L(-30, -60, -8, -38, "wood", 3));
      c += mom(ctx, 470, CF + 8, 1.4, { pose: "hold" }) + walk(0, 170, 1.4, 1.8, me(ctx, st, 560, CF + 12, 1.45, { mood: "ok" }));
      let d = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor") + R(180, 50, 360, 130, "board", 4, "wood", 7) + clock(640, 90, 30, 8);
      for (let i = 0; i < 4; i++) d += G(110 + i * 190, CG + 10, R(-50, -14, 100, 10, "wood", 2) + R(-46, -4, 6, 40, "metal") + R(40, -4, 6, 40, "metal") + R(-22, -20, 44, 7, "omr", 1) + O(-20, -46, 16, "hair") + R(-40, -32, 40, 26, "hoodie", 10));
      d += me(ctx, st, 400, CF + 30, 1.4, { mood: "stressed" }) + G(400, CF - 10, R(-70, -14, 140, 12, "wood", 2) + R(-30, -22, 60, 9, "omr", 1));
      d += G(690, 200, fx("c-ring", 0.4, P("M-24 20 Q-24 -24 0 -26 Q24 -24 24 20 Z", "gold", "gold2", 2) + O(0, 24, 6, "gold2")));
      d += fx("c-fade", 0.5, G(690, 190, A("pulse", P("M34 -20 q14 16 0 34 M48 -30 q22 26 0 54 M-34 -20 q-14 16 0 34 M-48 -30 q-22 26 0 54", null, "gold", 3))));
      return [
        cutShot(3.0, a, { s0: 1.05, s1: 1.12 }),
        cutShot(3.2, b, { s0: 1.0, s1: 1.04 }),
        cutShot(3.4, c, { s0: 1.12, s1: 1.12, x0: 40, x1: -40 }),
        cutShot(3.0, d, { s0: 1.0, s1: 1.3, ox: 420, oy: 320 }),
      ];
    },
    // Results day: the phone buzzes, the score report fills in, your face.
    results(ctx) {
      const st = ctx.stage, mood = ctx.react || "ok";
      let a = R(0, 0, CW, CG, "nightwall") + R(0, CG, CW, CH - CG, "nightfloor") + windowView(90, 70, 190, 150, { night: true, season: "winter", city: true, seed: 33 });
      a += R(470, 280, 260, 16, "wood", 3) + R(484, 296, 10, 120, "wood2") + R(706, 296, 10, 120, "wood2");
      a += G(600, 270, A("pulse", O(0, 0, 60, "screen", null, 0, "opacity:0.35")) + fx("c-ring", 0.5, R(-22, -12, 44, 14, "dark", 4) + R(-18, -10, 36, 10, "screen", 2)));
      a += walk(-260, 0, 0.3, 2.2, me(ctx, st, 380, CF, 1.5, { mood: "stressed" }));
      let b = R(0, 0, CW, CH, "night");
      b += R(260, 20, 280, 420, "dark", 34) + R(276, 60, 248, 340, "paper", 8) + R(276, 60, 248, 40, "c5", 8) + O(400, 40, 5, "metal");
      const cols = ["c1", "c5", "c4", "c3"];
      (ctx.grades || [3, 3, 3, 3]).slice(0, 4).forEach((gr, i) => {
        const h = Math.max(14, ((10 - gr) / 9) * 230), x = 300 + i * 56;
        b += R(x, 140, 40, 240, "tile", 4) + fx("c-grow", 0.4 + i * 0.4, R(x, 380 - h, 40, h, cols[i], 4));
        b += fx("c-pop", 0.9 + i * 0.4, O(x + 20, 370 - h - 16, 12, gr <= 1 ? "gold" : gr <= 3 ? "c3" : "gray"));
      });
      let c = R(0, 0, CW, CG, "nightwall") + R(0, CG, CW, CH - CG, "nightfloor");
      const yay = mood === "happy";
      c += mom(ctx, 190, CF, 1.6, { pose: yay ? "cheer" : "hold" }) + dad(ctx, 620, CF, 1.65, { pose: yay ? "cheer" : "hold" });
      c += me(ctx, st, 400, CF + 160, 2.5, { mood, pose: yay ? "cheer" : "stand" }) + (yay ? confettiRain(30, 7) : "");
      return [
        cutShot(2.8, a, { s0: 1, s1: 1.3, ox: 600, oy: 290 }),
        cutShot(3.4, b, { s0: 0.96, s1: 1.06 }),
        cutShot(3.0, c, { s0: 1.12, s1: 1.0, ox: 400, oy: 260 }),
      ];
    },
    // Admission: the family at the laptop, the stamp, the cheer.
    offers(ctx) {
      const st = ctx.stage;
      const gid = nid("glow");
      let a = "<defs>" + glow(gid, "screen") + "</defs>" + R(0, 0, CW, CG, "nightwall") + R(0, CG, CW, CH - CG, "nightfloor");
      a += R(180, 300, 440, 70, "sofa", 16) + R(190, 270, 420, 50, "sofa2", 14);
      a += mom(ctx, 250, CF, 1.4, { pose: "hold", mood: "ok" }) + dad(ctx, 560, CF, 1.45, { pose: "hold", mood: "ok" }) + me(ctx, st, 400, CF + 20, 1.5, { mood: "stressed" });
      a += O(400, 300, 120, null, null, 0, "fill:url(#" + gid + ")") + G(400, 330, R(-60, -50, 120, 70, "dark", 6) + R(-52, -44, 104, 58, "screen", 3) + R(-76, 20, 152, 8, "metal", 3));
      let b = R(0, 0, CW, CH, "wood2");
      b += fx("c-thud", 0.95, G(400, 225, R(-170, -200, 340, 400, "paper", 6, "line", 2) + O(0, -150, 30, "gold", "gold2", 3) + R(-120, -90, 240, 10, "line", 3) + R(-120, -60, 200, 10, "line", 3) + R(-120, -30, 220, 10, "line", 3) + R(-120, 0, 160, 10, "line", 3)));
      b += G(470, 300, fx("c-stamp", 0.8, O(0, 0, 66, null, "c1", 9) + O(0, 0, 52, "c1", null, 0, "opacity:0.15") + P("M-30 2 L-8 26 L34 -24", null, "c1", 11)));
      b += fx("c-flash", 0.95, R(0, 0, CW, CH, "paper"));
      let c = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor") + bunting(40, 760, 50, 3);
      c += G(170, CF, A("hop", avatar({ age: "adult", outfit: "casual", look: { hair: 3, skin: ctx.look.skin, shirt: 0, sex: "f" }, mood: "happy", pose: "cheer" })), 1.5);
      c += G(640, CF, A("hop", avatar({ age: "adult", outfit: "casual", look: { hair: 1, skin: ctx.look.skin, shirt: 2, sex: "m" }, mood: "happy", pose: "cheer" }), "--del:-0.5s"), 1.55);
      c += G(400, CF + 10, A("hop", me(ctx, st, 0, 0, 1.7, { mood: "happy", pose: "cheer" }), "--del:-0.25s"));
      c += confettiRain(46, 11);
      return [
        cutShot(3.0, a, { s0: 1, s1: 1.45, ox: 400, oy: 320 }),
        cutShot(2.6, b, { s0: 1.06, s1: 1.0 }),
        cutShot(3.2, c, { s0: 1.0, s1: 1.08 }),
      ];
    },
    // The ending: a suitcase on a spring road, then through the university gate. No offer: a dusk road.
    end(ctx) {
      const suitcase = (x) => G(x, CF, R(-22, -60, 44, 56, "c4", 6) + R(-8, -70, 16, 12, null, 3, "c4", 3) + O(-12, -2, 4, "dark") + O(12, -2, 4, "dark"));
      if (!ctx.label) {
        const gid = nid("dusk");
        let a = grad(gid, "dusk", "dusk2") + R(0, 0, CW, CH, null, 0, null, 0, "fill:url(#" + gid + ")") + O(560, 250, 60, "sun", null, 0, "opacity:0.9");
        a += P("M0 300 Q200 240 400 296 T800 270 L800 450 L0 450 Z", "hill") + P("M0 350 Q240 310 520 344 T800 336 L800 450 L0 450 Z", "grass") + P("M330 450 Q380 380 520 344 L540 344 Q440 390 450 450 Z", "path");
        a += walk(0, 150, 0.2, 3.0, me(ctx, "uni", 360, CF, 1.4, { mood: "tired" }));
        const b = outdoorSky(CW, CH, { night: true, seed: 44 }) + P("M0 330 Q300 280 800 320 L800 450 L0 450 Z", "hill") + me(ctx, "uni", 400, CF, 1.5, { mood: "ok" });
        return [cutShot(3.2, a, { s0: 1.0, s1: 1.1, ox: 450, oy: 340 }), cutShot(3.0, b, { s0: 1.2, s1: 1.0, ox: 400, oy: 260 })];
      }
      let a = outdoorSky(CW, CH, { season: "spring", seed: 14 });
      let road = "";
      for (let i = 0; i < 9; i++) road += tree(60 + i * 160, CG + 4, "spring", 1.5);
      a += walk(0, -480, 0, 3.0, road) + R(0, CG, CW, CH - CG, "path") + me(ctx, "uni", 390, CF, 1.5, { mood: "happy" }) + suitcase(440) + petals(15, 24);
      let b = gateShot(ctx.label, 4, "spring") + bunting(232, 568, 168, 1);
      b += fx("c-out", 2.5, walk(-300, 0, 0.1, 2.4, me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy" }) + suitcase(446)));
      b += fx("c-fade", 2.5, me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy", pose: "cheer" }) + suitcase(446)) + petals(16, 26);
      let c = gateShot(ctx.label, 4, "spring") + me(ctx, "uni", 400, CF + 12, 1.5, { mood: "happy", pose: "cheer" }) + petals(17, 30);
      for (let i = 0; i < 4; i++) c += G(120 + i * 60, 70 + (i % 2) * 20, A("drift", P("M-10 0 q5 -6 10 0 q5 -6 10 0", null, "ink", 2)));
      return [
        cutShot(3.0, a, { s0: 1.05, s1: 1.05 }),
        cutShot(3.6, b, { s0: 1.15, s1: 1.05, ox: 400, oy: 330 }),
        cutShot(3.0, c, { s0: 1.6, s1: 1.0, ox: 400, oy: 360 }),
      ];
    },
    // Moving house: the truck pulls away; the view from the new window.
    move(ctx) {
      let a = outdoorSky(CW, CH, { season: ctx.season, seed: 25 }) + homeOf(ctx) + R(0, CG + 30, CW, CH, "road");
      let truck = R(-150, -150, 210, 130, "paper", 6, "line", 2) + R(60, -110, 80, 90, "c5", 10) + R(78, -100, 44, 34, "screen", 4) + O(-100, -14, 24, "dark") + O(90, -14, 24, "dark") + O(-100, -14, 9, "metal") + O(90, -14, 9, "metal");
      for (let i = 0; i < 3; i++) truck += R(-138 + i * 64, -184, 56, 36, "cubicle", 3, "cubicle2", 2);
      a += walk(0, 900, 1.0, 2.2, G(520, CF + 22, truck)) + mom(ctx, 260, CF + 20, 1.3, { pose: "wave", mood: "ok" });
      let b = R(0, 0, CW, CG, "wall") + R(0, CG, CW, CH - CG, "floor") + windowView(150, 50, 500, 280, { view: ctx.view, season: ctx.season, city: true, seed: 26 });
      for (let i = 0; i < 4; i++) b += R(80 + i * 170, CF - 40 - (i % 2) * 30, 70, 50, "cubicle", 3, "cubicle2", 2);
      b += me(ctx, ctx.stage, 400, CF + 20, 1.5, { mood: "happy" });
      return [cutShot(3.2, a, { s0: 1.0, s1: 1.08, x0: 0, x1: -30 }), cutShot(3.2, b, { s0: 1.2, s1: 1.0, ox: 400, oy: 200 })];
    },
  };
  // The shots for one cutscene: [{ t: seconds, svg }]. ctx is app.js's art context plus what the film
  // needs (items, label, grades, react). VIEW follows the region, as everywhere else.
  function cutscene(name, ctx) {
    VIEW = (ctx && ctx.view) || "city";
    return CUTS[name] ? CUTS[name](ctx) : [];
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
  function realLand(home, focus) {
    const hm = new Set(home && GEO.areas[home] ? GEO.areas[home].munis : []);
    let s = "";
    for (const c in GEO.geo.munis) s += '<path class="kmap-muni' + (hm.has(c) ? " home" : "") + '" d="' + GEO.geo.munis[c] + '"/>';
    for (const d of GEO.geo.provinces) s += '<path class="kmap-prov" d="' + d + '"/>';
    return s;
  }
  function koreaMap(opts) {
    const o = opts || {};
    const states = o.states || {}, labels = o.labels || {};
    const fade = nid("nfade"), clip = nid("iclip");
    const focus = o.focus && GEO ? areaBox(o.focus) : null;
    let s = "<defs><linearGradient id=\"" + fade + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C("land2") + '" stop-opacity="0.15"/><stop offset="1" stop-color="' + C("land2") + '" stop-opacity="0.8"/></linearGradient>' +
      '<clipPath id="' + clip + '"><circle cx="' + INSET.x + '" cy="' + INSET.y + '" r="' + INSET.r + '"/></clipPath></defs>';
    s += R(-400, -400, MW + 800, MH + 800, "mapSea");
    s += P(mpath(NORTH), null, null, 0, "fill:url(#" + fade + ")");
    if (GEO) s += realLand(o.home, focus);
    else {
      s += P(mpath(SOUTH), "land", "coast", 2);
      // Islands: Jeju, Geoje, Jindo, Ganghwa, Ulleungdo and Dokdo.
      s += E(mx(126.55), my(33.38), 38, 16, "land", "coast", 2) + E(mx(128.62), my(34.88), 8, 10, "land", "coast", 1.5) + E(mx(126.25), my(34.45), 9, 8, "land", "coast", 1.5) +
        E(mx(126.45), my(37.7), 7, 8, "land", "coast", 1.5) + O(mx(130.87), my(37.5), 5, "land", "coast", 1.5) + O(mx(131.86), my(37.24), 2.2, "land", "coast", 1) + O(mx(131.87), my(37.25), 1.6, "land", "coast", 1);
    }
    s += P("M" + DMZ.map(([lon, lat]) => mx(lon) + " " + my(lat)).join(" L"), null, "dmz", 2.5, "stroke-dasharray:7 6");
    // Zoomed on one area (the school dialog): its real schools, and none of the national furniture.
    if (focus) return focusMap(o, s, focus);
    // Seoul on the mainland, and the inset it opens into.
    const [sx, sy] = [mx(SEOUL[0]), my(SEOUL[1])];
    s += O(sx, sy, 11, null, "inset", 2.5) + L(sx - 8, sy + 8, INSET.x + 40, INSET.y - INSET.r + 10, "inset", 2, "stroke-dasharray:5 5");
    if (GEO) {
      const hm = new Set(o.home && GEO.areas[o.home] ? GEO.areas[o.home].munis : []);
      let gu = "";
      for (const c in GEO.geo.munis) if (c.startsWith("11")) gu += '<path class="kmap-muni' + (hm.has(c) ? " home" : "") + '" d="' + GEO.geo.munis[c] + '"/>';
      s += O(INSET.x, INSET.y, INSET.r, "mapSea", null, 0) + '<g clip-path="url(#' + clip + ')"><g transform="' + INSET_T + '">' + gu + "</g></g>" + O(INSET.x, INSET.y, INSET.r, null, "inset", 3);
    } else {
      s += O(INSET.x, INSET.y, INSET.r, "land", "inset", 3) + P("M" + (INSET.x - 66) + " " + (INSET.y + 4) + " Q" + (INSET.x - 30) + " " + (INSET.y + 14) + " " + INSET.x + " " + (INSET.y + 2) + " T" + (INSET.x + 66) + " " + (INSET.y - 2), null, "mapSea", 7);
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
      s += P("M" + ax + " " + ay + " Q" + ((ax + bx) / 2 + 40) + " " + (Math.min(ay, by) - 60) + " " + bx + " " + by, null, "route", 4, "stroke-dasharray:10 8");
    }
    for (const id in PLACES) {
      const [x, y] = mapPos(id);
      const st = states[id] || "open";
      const sel = o.sel === id;
      const inset = SEOUL_IDS.indexOf(id) >= 0;
      const r = inset ? 9 : 11;
      // A wider invisible circle makes the dot easy to tap; the visible one is coloured by state in CSS.
      let dot = O(0, 0, r + 9, null, null, 0, "fill:transparent") + '<circle class="kd" r="' + r + '"/>';
      if (st === "home") dot += A("kmap-pulse", O(0, 0, r + 6, null, "pin", 3));
      if (sel) dot += O(0, 0, r + 5, null, "sel", 4);
      s += '<g class="kmap-pt ' + st + (sel ? " sel" : "") + '" data-place="' + id + '" transform="translate(' + x + " " + y + ')"' + (o.static ? "" : ' tabindex="0" role="button"') +
        (labels[id] ? ' aria-label="' + esc(labels[id]) + '"' : "") + ">" + (labels[id] && !named(id) ? "<title>" + esc(labels[id]) + "</title>" : "") + dot + "</g>";
      if (labels[id] && named(id)) s += mapLabel(x, y, labels[id], inset ? (["mokdong", "mapo", "gwanak"].indexOf(id) >= 0 ? "l" : "r") : LABEL_SIDE[id] || "r", inset ? small : big, (st === "home" ? "home" : "") + (sel ? " sel" : ""));
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + MW + " " + MH + '" class="kmap"' + (o.aria ? ' role="img" aria-label="' + esc(o.aria) + '"' : ' aria-hidden="true"') + ">" + s + "</svg>";
  }

  // One area up close for the school dialog: its municipalities, and each option's real school as a
  // numbered marker (o.schools: { lat, lon, n, cls, id }; id makes it data-pick for taps). Schools outside the area (special schools far
  // away) get no marker; the dialog names their city instead.
  function focusMap(o, s, box) {
    const [x0, y0, x1, y1] = box;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 2;
    const vx = x0 - pad, vy = y0 - pad, vw = x1 - x0 + 2 * pad, vh = y1 - y0 + 2 * pad;
    const k = Math.max(vw, vh) / 300; // marker size in map units, so markers look the same at any zoom
    for (const m of o.schools || []) {
      const x = mx(m.lon), y = my(m.lat);
      if (x < vx || x > vx + vw || y < vy || y > vy + vh) continue;
      const mark = G(x, y, O(0, 0, 9, null, null, 0) + (m.n != null ? '<text y="4" text-anchor="middle">' + esc(String(m.n)) + "</text>" : ""), k, "kmap-sch " + (m.cls || ""));
      s += m.id ? '<g data-pick="' + esc(m.id) + '">' + mark + "</g>" : mark;
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [vx, vy, vw, vh].map((v) => v.toFixed(1)).join(" ") + '" preserveAspectRatio="xMidYMid meet" class="kmap kmap-focus"' +
      (o.aria ? ' role="img" aria-label="' + esc(o.aria) + '"' : ' aria-hidden="true"') + ' style="--k:' + k.toFixed(3) + '">' + s + "</svg>";
  }

  // ---------- the share card ----------
  // A result card for the end of a life: you, where and into what you were born, how it ended, your
  // best Suneung grades and a five-step ladder from the family you were born into to where you are at
  // 30. All words are passed in by app.js. Colours are tokens like the rest of the art; app.js swaps
  // them for their computed values before drawing the card to a canvas for the PNG.
  const CARD_FONT = "font-family:system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
  const TL = (x, y, text, fill, size, weight, anchor) =>
    '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "start") + '" style="fill:' + C(fill) + ";font-size:" + size + "px;font-weight:" + (weight || 600) + ";" + CARD_FONT + '">' + esc(text) + "</text>";
  // A string clipped to n characters, so long names and universities stay on the card.
  const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
  function shareCard(o) {
    const Wc = 600, Hc = 340;
    let s = R(0, 0, Wc, Hc, "card", 20) + R(0, 0, Wc, 58, "c5", 20) + R(0, 38, Wc, 20, "c5");
    s += TL(24, 37, o.title, "paper", 20, 800) + (o.daily ? TL(Wc - 24, 37, clip(o.daily, 30), "paper", 13, 700, "end") : "");
    // You, standing on a little lawn.
    s += E(96, 300, 62, 12, "shadow") + person(Object.assign({}, o.ctx, { stage: "uni" }), 96, 300, 1.05, { mood: o.mood || "happy" });
    let y = 96;
    s += TL(190, y, clip(o.name, 18), "cardInk", 28, 800);
    y += 26;
    for (const [k, v] of o.lines) { s += TL(190, y, k, "cardSub", 12, 600) + TL(290, y, clip(v, 24), "cardInk", 14, 700); y += 22; }
    y += 6;
    s += TL(190, y, o.gradesLabel, "cardSub", 12, 600);
    if (o.grades) {
      o.grades.forEach((gr, i) => {
        const x = 190 + i * 38;
        s += '<rect x="' + x + '" y="' + (y + 8) + '" width="32" height="32" rx="8" style="fill:var(--g' + Math.min(6, gr) + ')"/>' + TL(x + 16, y + 30, gr, "paper", 17, 800, "middle");
      });
    } else s += TL(190, y + 30, "—", "cardInk", 18, 800);
    // The ladder: five steps, the family you were born into and (once known) where you are at 30.
    const lx = 468, ly = 300, sw = 24, sh = 22;
    for (let i = 0; i < 5; i++) s += R(lx + i * sw, ly - (i + 1) * sh, sw - 3, (i + 1) * sh, i + 1 === o.mob.to ? "gold" : i + 1 === o.mob.from ? "c3" : "line", 4, null, 0, "opacity:" + (i + 1 === o.mob.to || i + 1 === o.mob.from ? 1 : 0.45));
    const cx = (k) => lx + (k - 1) * sw + (sw - 3) / 2, cy = (k) => ly - k * sh - 14;
    s += O(cx(o.mob.from), cy(o.mob.from), 7, "c3", "paper", 2) + TL(cx(o.mob.from), ly + 18, o.mob.labels[0], "cardSub", 11, 700, "middle");
    if (o.mob.to) {
      if (o.mob.to !== o.mob.from) s += P("M" + cx(o.mob.from) + " " + (cy(o.mob.from) - 10) + " Q" + (cx(o.mob.from) + cx(o.mob.to)) / 2 + " " + (Math.min(cy(o.mob.from), cy(o.mob.to)) - 34) + " " + cx(o.mob.to) + " " + (cy(o.mob.to) - 12), null, "c1", 3, "stroke-dasharray:5 4");
      s += G(cx(o.mob.to), cy(o.mob.to), P("M0 -10 L3 -3 L10 -3 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-10 -3 L-3 -3 Z", "gold", "gold2", 1.5)) + TL(cx(o.mob.to), ly + 32, o.mob.labels[1], "cardSub", 11, 700, "middle");
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 ' + Wc + " " + Hc + '" class="share-card" role="img" aria-label="' + esc(o.aria || o.title) + '">' + s + "</svg>";
  }

  root.SuneungArt = { portrait, portraitFor, figureFor, koreaMap, areaBox, scene, sceneName, eventArt, screenArt, shareCard, iconFor, moodOf, seasonOf, lookFor, avatar, cutscene, CUT_NAMES: Object.keys(CUTS) };
})(typeof window !== "undefined" ? window : globalThis);
