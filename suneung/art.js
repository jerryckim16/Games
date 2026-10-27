// Original inline-SVG artwork for the Suneung Simulator: life-stage scenes, an avatar that grows up and
// shows its mood, and an illustration for every event. Nothing is loaded from outside (the published
// artifact's CSP blocks external images), and no text is baked in: the few words that appear (a
// university's name on its gate) are passed in by app.js in the player's language.
//
// Every color is a CSS token (--a-* in styles.css), so the art follows the light and dark themes:
// dark mode turns daytime skies to dusk and dims the rooms. Animation is plain CSS on SVG elements
// (classes .bob, .blink, .fall, .rise, .twinkle, .pulse, .sway), which styles.css switches off under
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
  function windowView(x, y, w, h, o) {
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
    if (o.city) {
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
      s += G(w * 0.82, 40, O(0, 0, 16, "moon") + O(7, -5, 14, "night"));
      const r = rand(o.seed || 5);
      for (let i = 0; i < 14; i++) s += G((r() * w).toFixed(0), (r() * h * 0.5).toFixed(0), A("twinkle", O(0, 0, 1.4, "star"), "--del:-" + (r() * 3).toFixed(1) + "s"));
    } else {
      s += A("pulse-slow", O(w * 0.85, 42, o.season === "summer" ? 24 : 18, "sun"));
      s += G(w * 0.2, 46, A("drift", E(0, 0, 30, 10, "cloud") + E(18, -7, 18, 10, "cloud") + E(-16, -4, 14, 8, "cloud")));
      s += G(w * 0.58, 30, A("drift slow", E(0, 0, 22, 7, "cloud") + E(12, -5, 13, 8, "cloud")));
    }
    return s;
  }

  // ---------- the avatar ----------
  // o: { age: child|teen|adult, outfit: kid|uniform|hoodie|casual, mood, look: {hair, skin, shirt}, pose, prop, backpack }
  // Drawn with its feet at (0, 0).
  const BODY = {
    child: { leg: 30, body: 36, head: 23, w: 34, arm: 30 },
    teen: { leg: 54, body: 48, head: 20, w: 38, arm: 42 },
    adult: { leg: 58, body: 52, head: 19.5, w: 40, arm: 45 },
  };
  const SHIRTS = ["c1", "c3", "c4", "c5"];
  function avatar(o) {
    const b = BODY[o.age] || BODY.teen;
    const look = o.look || { hair: 0, skin: 0, shirt: 0 };
    const skin = look.skin ? "skinb" : "skin";
    const hw = b.w / 2, hipY = -b.leg, shY = hipY - b.body, hr = b.head, hy = shY - 3 - hr + 2;
    const outfit = o.outfit || "uniform";
    const top = outfit === "uniform" ? "uniform" : outfit === "hoodie" ? "hoodie" : SHIRTS[(look.shirt || 0) % SHIRTS.length];
    const pants = outfit === "uniform" ? "uniform2" : outfit === "kid" ? "jeans" : outfit === "casual" ? "jeans" : "pants";
    const mood = o.mood || "ok";
    let s = E(0, 2, hw + 8, 4, "shadow");

    // Back layer: backpack and long hair.
    if (o.backpack) s += R(-hw - 4, shY + 4, b.w + 8, b.body * 0.8, "c2", 8, "c2dark", 1.5);
    if (look.hair === 2) s += P("M" + (-hr - 2) + " " + (hy - 2) + " Q" + (-hr - 4) + " " + (hy + hr + 10) + " " + (-hr + 4) + " " + (hy + hr + 14) + " L" + (hr - 4) + " " + (hy + hr + 14) + " Q" + (hr + 4) + " " + (hy + hr + 10) + " " + (hr + 2) + " " + (hy - 2) + " Z", "hair");
    if (look.hair === 3) s += P("M" + (-hr - 2) + " " + hy + " Q" + (-hr - 3) + " " + (hy + hr * 0.95) + " " + (-hr + 6) + " " + (hy + hr * 0.95) + " L" + (hr - 6) + " " + (hy + hr * 0.95) + " Q" + (hr + 3) + " " + (hy + hr * 0.95) + " " + (hr + 2) + " " + hy + " Z", "hair");

    // Legs and shoes. Children wear shorts; girls wear a skirt with the school uniform and as children.
    const skirt = look.sex === "f" && (outfit === "uniform" || outfit === "kid");
    if (skirt) {
      const sl = b.leg * (outfit === "kid" ? 0.42 : 0.5);
      s += R(-hw + 7, hipY + sl - 3, hw - 10, b.leg - sl - 3, skin) + R(3, hipY + sl - 3, hw - 10, b.leg - sl - 3, skin);
      if (outfit === "uniform") s += R(-hw + 6, -14, hw - 8, 9, "snow") + R(2, -14, hw - 8, 9, "snow");
      s += P("M" + (-hw + 1) + " " + (hipY - 3) + " L" + (hw - 1) + " " + (hipY - 3) + " L" + (hw + 5) + " " + (hipY + sl) + " L" + (-hw - 5) + " " + (hipY + sl) + " Z", outfit === "uniform" ? pants : "c5");
      if (outfit === "uniform") s += L(-hw / 2, hipY, -hw / 2 - 2, hipY + sl, "shadow", 1) + L(0, hipY, 0, hipY + sl, "shadow", 1) + L(hw / 2, hipY, hw / 2 + 2, hipY + sl, "shadow", 1);
    } else if (outfit === "kid") {
      s += R(-hw + 5, hipY, hw - 6, b.leg * 0.45, pants, 3) + R(1, hipY, hw - 6, b.leg * 0.45, pants, 3);
      s += R(-hw + 7, hipY + b.leg * 0.4, hw - 10, b.leg * 0.6 - 3, skin) + R(3, hipY + b.leg * 0.4, hw - 10, b.leg * 0.6 - 3, skin);
      s += R(-hw + 6, -6, hw - 7, 4, "snow");
    } else {
      s += R(-hw + 4, hipY - 2, hw - 5, b.leg, pants, 3) + R(1, hipY - 2, hw - 5, b.leg, pants, 3);
    }
    s += E(-hw / 2 - 1, -2, hw / 2 + 2, 4, outfit === "kid" ? "c1" : "shoe") + E(hw / 2 + 1, -2, hw / 2 + 2, 4, outfit === "kid" ? "c1" : "shoe");

    // Torso.
    const torso = "M" + (-hw) + " " + (shY + 8) + " Q" + (-hw) + " " + shY + " " + (-hw + 9) + " " + shY + " L" + (hw - 9) + " " + shY + " Q" + hw + " " + shY + " " + hw + " " + (shY + 8) +
      " L" + (hw - 1) + " " + (hipY + 3) + " L" + (-hw + 1) + " " + (hipY + 3) + " Z";
    s += P(torso, top);
    if (outfit === "uniform") {
      s += P("M-8 " + shY + " L0 " + (shY + 18) + " L8 " + shY + " Z", "shirt");
      // Boys wear a tie, girls a ribbon bow.
      s += look.sex === "f"
        ? P("M0 " + (shY + 6) + " L-8 " + (shY + 1) + " L-8 " + (shY + 11) + " Z M0 " + (shY + 6) + " L8 " + (shY + 1) + " L8 " + (shY + 11) + " Z", "tie") + O(0, shY + 6, 2.4, "tie")
        : P("M-2 " + (shY + 4) + " L2 " + (shY + 4) + " L3 " + (shY + 20) + " L0 " + (shY + 24) + " L-3 " + (shY + 20) + " Z", "tie");
      s += P("M-8 " + shY + " L-3 " + (shY + 22) + " M8 " + shY + " L3 " + (shY + 22), null, "uniform2", 1.5) + R(hw - 13, shY + 14, 8, 3, "shirt", 1);
    } else if (outfit === "hoodie") {
      s += P("M-10 " + shY + " Q0 " + (shY + 10) + " 10 " + shY, null, "hoodie2", 3) + L(-3, shY + 4, -3, shY + 14, "snow", 1.2) + L(3, shY + 4, 3, shY + 14, "snow", 1.2);
      s += R(-hw + 7, hipY - 14, b.w - 14, 11, "hoodie2", 4);
    } else if (outfit === "casual") {
      s += P("M-7 " + shY + " L0 " + (shY + 7) + " L7 " + shY, "shirt") + L(0, shY + 9, 0, hipY, "shadow", 1.2);
    } else {
      s += R(-hw + 2, shY + 14, b.w - 4, 4, "snow", 0, null, 0, "opacity:0.7");
    }
    if (o.backpack) s += L(-hw + 5, shY + 1, -hw + 7, hipY + 2, "c2dark", 3) + L(hw - 5, shY + 1, hw - 7, hipY + 2, "c2dark", 3);
    if (o.prop === "medal") s += L(-6, shY, 0, shY + 16, "c5", 2.5) + L(6, shY, 0, shY + 16, "c1", 2.5) + O(0, shY + 20, 5.5, "gold", "gold2", 1.5);

    // Arms. Poses: stand, cheer (both up), wave (right up), hold (right forward).
    const arm = (side, angle) => {
      const x = side * (hw + 2);
      const body = R(-4, 0, 8, b.arm, top, 4) + O(0, b.arm + 1, 4.2, skin);
      return '<g transform="translate(' + x + " " + (shY + 3) + ") rotate(" + angle + ')">' + body + "</g>";
    };
    const pose = o.pose || "stand";
    s += arm(-1, pose === "cheer" ? 150 : 8);
    s += pose === "cheer" || pose === "wave" ? '<g class="' + (pose === "wave" ? "wave" : "") + '" style="transform-origin:' + (hw + 2) + "px " + (shY + 3) + 'px">' + arm(1, -150) + "</g>" : arm(1, pose === "hold" ? -40 : -8);

    // Head.
    s += R(-4, shY - 6, 8, 8, skin);
    s += O(-hr + 1, hy + 2, 4, skin) + O(hr - 1, hy + 2, 4, skin);
    s += O(0, hy, hr, skin);
    if (mood === "sick") s += O(0, hy, hr, "sickface", null, 0, "opacity:0.35");
    s += face(hr, hy, mood, o.age === "child");
    s += hairFront(look.hair || 0, hr, hy);
    if (o.prop === "headphones") s += P("M" + (-hr - 2) + " " + hy + " Q" + (-hr) + " " + (hy - hr - 8) + " 0 " + (hy - hr - 8) + " Q" + hr + " " + (hy - hr - 8) + " " + (hr + 2) + " " + hy, null, "dark", 3.5) + R(-hr - 6, hy - 5, 7, 13, "c1", 3) + R(hr - 1, hy - 5, 7, 13, "c1", 3);

    // Props in hand.
    const hx = hw + 2, hyHand = shY + 3 + b.arm;
    if (o.prop === "book") s += G(pose === "hold" ? hx + 22 : hx + 4, pose === "hold" ? shY + 22 : hyHand - 6, R(-10, -8, 20, 15, "c5", 2) + R(-8, -6, 16, 11, "paper", 1) + L(0, -6, 0, 5, "c5", 1.5));
    if (o.prop === "phone") s += G(pose === "hold" ? hx + 20 : hx + 3, pose === "hold" ? shY + 24 : hyHand - 4, R(-5, -9, 10, 17, "dark", 2) + R(-4, -7, 8, 12, "screen", 1));
    if (o.prop === "baton") s += G(hx + 2, pose === "cheer" ? shY - b.arm - 6 : hyHand - 4, R(-3, -10, 6, 18, "c1", 2, "c1dark", 1));
    if (o.prop === "envelope") s += G(hx + 18, shY + 24, R(-11, -7, 22, 15, "paper", 1, "line", 1) + P("M-11 -7 L0 2 L11 -7", null, "line", 1) + O(0, 2, 2.5, "c1"));
    if (o.prop === "mask") s += P("M" + (-hr * 0.62) + " " + (hy + hr * 0.25) + " Q0 " + (hy + hr * 0.15) + " " + (hr * 0.62) + " " + (hy + hr * 0.25) + " L" + (hr * 0.55) + " " + (hy + hr * 0.75) + " Q0 " + (hy + hr * 0.95) + " " + (-hr * 0.55) + " " + (hy + hr * 0.75) + " Z", "paper", "line", 1);
    return A("bob", s);
  }
  function hairFront(v, r, hy) {
    // Four styles: short, side part, long (back drawn earlier) and bob.
    const top = hy - r - 3;
    if (v === 1) return P("M" + (-r - 2) + " " + (hy + 3) + " Q" + (-r - 2) + " " + top + " 0 " + top + " Q" + (r + 3) + " " + top + " " + (r + 2) + " " + (hy + 4) +
      " Q" + (r * 0.4) + " " + (hy - r * 0.7) + " " + (-r * 0.5) + " " + (hy - r * 0.35) + " Q" + (-r * 0.8) + " " + (hy - r * 0.2) + " " + (-r - 2) + " " + (hy + 3) + " Z", "hair");
    if (v === 2 || v === 3) return P("M" + (-r - 2) + " " + (hy + 4) + " Q" + (-r - 2) + " " + top + " 0 " + top + " Q" + (r + 2) + " " + top + " " + (r + 2) + " " + (hy + 4) +
      " L" + (r - 3) + " " + (hy - r * 0.35) + " L" + (-r + 3) + " " + (hy - r * 0.35) + " Z", "hair");
    return P("M" + (-r - 1.5) + " " + (hy + 2) + " Q" + (-r - 1) + " " + (top - 1) + " 0 " + top + " Q" + (r + 1) + " " + (top - 1) + " " + (r + 1.5) + " " + (hy + 2) +
      " Q" + (r * 0.7) + " " + (hy - r * 0.5) + " " + (r * 0.2) + " " + (hy - r * 0.42) + " L" + (r * 0.05) + " " + (hy - r * 0.3) + " L" + (-r * 0.15) + " " + (hy - r * 0.45) +
      " Q" + (-r * 0.7) + " " + (hy - r * 0.5) + " " + (-r - 1.5) + " " + (hy + 2) + " Z", "hair");
  }
  function face(r, hy, mood, child) {
    const ex = r * 0.38, ey = hy + r * 0.12, er = child ? 2.8 : 2.3, my = hy + r * 0.52;
    let s = "";
    const dots = (cls) => G(0, 0, E(-ex, ey, er * 0.85, er, "ink") + E(ex, ey, er * 0.85, er, "ink") + O(-ex + 0.8, ey - 1, 0.8, "paper") + O(ex + 0.8, ey - 1, 0.8, "paper"), 1, cls);
    if (mood === "happy") {
      s += P("M" + (-ex - 3) + " " + (ey + 1) + " Q" + (-ex) + " " + (ey - 3.5) + " " + (-ex + 3) + " " + (ey + 1) + " M" + (ex - 3) + " " + (ey + 1) + " Q" + ex + " " + (ey - 3.5) + " " + (ex + 3) + " " + (ey + 1), null, "ink", 1.8);
      s += P("M-5 " + my + " Q0 " + (my + 7) + " 5 " + my + " Z", "mouth", "ink", 1.2);
      s += E(-ex - 3, ey + 6, 3.2, 2, "blush", null, 0, "opacity:0.7") + E(ex + 3, ey + 6, 3.2, 2, "blush", null, 0, "opacity:0.7");
    } else if (mood === "tired") {
      s += L(-ex - 3, ey, -ex + 3, ey, "ink", 1.8) + L(ex - 3, ey, ex + 3, ey, "ink", 1.8);
      s += P("M" + (-ex - 3) + " " + (ey + 3.5) + " Q" + (-ex) + " " + (ey + 5.5) + " " + (-ex + 3) + " " + (ey + 3.5) + " M" + (ex - 3) + " " + (ey + 3.5) + " Q" + ex + " " + (ey + 5.5) + " " + (ex + 3) + " " + (ey + 3.5), null, "bags", 1.4);
      s += L(-3.5, my + 1, 3.5, my + 1, "ink", 1.6);
    } else if (mood === "stressed") {
      s += dots("blink");
      s += L(-ex - 3.5, ey - 4, -ex + 2.5, ey - 6, "ink", 1.5) + L(ex + 3.5, ey - 4, ex - 2.5, ey - 6, "ink", 1.5);
      s += P("M-5 " + (my + 1) + " q1.25 -2 2.5 0 t2.5 0 t2.5 0 t2.5 0", null, "ink", 1.4);
      s += G(r - 3, hy - r * 0.35, A("drip", P("M0 -4 Q3 1 0 3 Q-3 1 0 -4 Z", "sweat")));
    } else if (mood === "sick") {
      s += P("M" + (-ex - 3) + " " + (ey - 1) + " Q" + (-ex) + " " + (ey + 2.5) + " " + (-ex + 3) + " " + (ey - 1) + " M" + (ex - 3) + " " + (ey - 1) + " Q" + ex + " " + (ey + 2.5) + " " + (ex + 3) + " " + (ey - 1), null, "ink", 1.6);
      s += E(-ex - 3, ey + 6, 3.4, 2.2, "fever", null, 0, "opacity:0.8") + E(ex + 3, ey + 6, 3.4, 2.2, "fever", null, 0, "opacity:0.8");
      s += P("M-3 " + (my + 2) + " Q0 " + (my - 1) + " 3 " + (my + 2), null, "ink", 1.4);
    } else if (mood === "grumpy") {
      s += dots("blink");
      s += L(-ex - 3.5, ey - 6, -ex + 2.5, ey - 3.5, "ink", 1.8) + L(ex + 3.5, ey - 6, ex - 2.5, ey - 3.5, "ink", 1.8);
      s += P("M-4 " + (my + 2) + " Q0 " + (my - 1.5) + " 4 " + (my + 2), null, "ink", 1.6);
    } else {
      s += dots("blink");
      s += P("M-3.5 " + my + " Q0 " + (my + 3.5) + " 3.5 " + my, null, "ink", 1.5);
      s += E(-ex - 3, ey + 6, 3, 1.8, "blush", null, 0, "opacity:0.45") + E(ex + 3, ey + 6, 3, 1.8, "blush", null, 0, "opacity:0.45");
    }
    return s;
  }

  // Which body and clothes fit the life stage.
  function figureFor(stage) {
    if (stage === "elem" || stage === "birth") return { age: "child", outfit: "kid", backpack: true };
    if (stage === "mid") return { age: "teen", outfit: "uniform", scale: 0.92 };
    if (stage === "high" || stage === "hs3") return { age: "teen", outfit: "uniform" };
    if (stage === "academy" || stage === "selfstudy") return { age: "adult", outfit: "hoodie" };
    return { age: "adult", outfit: "casual" };
  }
  // sex "m" draws from the two short styles, "f" from long hair and the bob. A save from before the
  // player chose (no sex) keeps the look it always had, from all four.
  function lookFor(seed, sex) {
    const r = rand((seed | 0) ^ 0x5eed);
    const h = Math.floor(r() * 4);
    const hair = sex === "m" ? h % 2 : sex === "f" ? 2 + (h % 2) : h;
    return { hair, skin: r() < 0.35 ? 1 : 0, shirt: Math.floor(r() * 4), sex: sex || null };
  }
  // Mood from the condition bars; the thresholds mirror where the engine starts to punish them.
  function moodOf(g) {
    if (g.health < 40) return "sick";
    if (g.stress >= 75) return "stressed";
    if (g.motivation < 35) return "tired";
    if (g.stress < 45 && g.motivation >= 60 && g.health >= 55) return "happy";
    return "ok";
  }
  function person(ctx, x, y, s, extra) {
    const f = figureFor(ctx.stage);
    const o = Object.assign({ age: f.age, outfit: f.outfit, backpack: f.backpack, look: ctx.look, mood: ctx.mood }, extra || {});
    return G(x, y, avatar(o), (s || 1) * (f.scale || 1));
  }

  // ---------- room furniture ----------
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
      s += G(560, 210, avatar({ age: "adult", outfit: "casual", look: { hair: 2, shirt: 2 }, mood: "happy" }), 0.5) + G(600, 214, avatar({ age: "adult", outfit: "casual", look: { hair: 0, shirt: 3 }, mood: "ok" }), 0.5);
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
      let s = outdoorSky(W, H, { night: true, seed: 2 }) + A("pulse-slow", O(408, 118, 18, "moon") + O(416, 112, 15, "night"));
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
    return { elem: "classroom", mid: "hallway", high: "desk", hs3: "desk", academy: "academy", selfstudy: "cubicle", halfretake: "campus" }[stage] || "desk";
  }
  function scene(ctx) {
    const name = ctx.scene || sceneName(ctx.stage, ctx);
    return svg("0 0 " + W + " " + H, SCENES[name](ctx), "scene scene-" + name, ctx.aria);
  }

  // ---------- event illustrations (600 × 220, floor at 178) ----------
  const EW = 600, EH = 220, EF = 178, EFEET = 204;
  const BACKDROPS = {
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

  // Foreground pieces per event. Each returns SVG drawn over the backdrop; v is the outcome suffix
  // (r0a, r1 ...) when the art illustrates a result rather than the question.
  const FX = {
    finish: () => L(470, 120, 470, 204, "metal", 4) + L(580, 120, 580, 204, "metal", 4) + A("sway", P("M470 140 Q525 152 580 140", null, "c1", 4)) + bunting(20, 660, 26, 2) +
      G(300, EFEET, avatar({ age: "child", outfit: "kid", look: { hair: 3, shirt: 1 }, mood: "happy" }), 0.85),
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
    doctor: () => G(440, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 1, shirt: 3 }, mood: "happy" })) + G(440, EFEET, P("M-22 -104 L22 -104 L24 -56 L-24 -56 Z", "paper", "line", 1) +
      P("M-8 -100 Q-14 -76 0 -72 Q14 -76 8 -100", null, "dark", 2) + O(0, -70, 3.5, "metal")),
    door: () => R(420, 34, 110, 144, "wood", 3, "wood2", 4) + O(512, 110, 5, "gold") + G(475, 80, O(0, 0, 22, "paper", "c1", 5) + L(-15, 15, 15, -15, "c1", 5)) + G(250, 40, A("drift", E(0, 0, 40, 16, "storm") + E(24, -10, 24, 14, "storm") + E(-22, -6, 20, 12, "storm") + P("M4 12 L-4 26 L4 26 L-4 40", null, "gold", 3))),
    monitors: () => G(120, 196, E(0, 0, 24, 6, "cup") + R(-20, -30, 40, 30, "c1", 4) + R(-20, -30, 40, 8, "paper", 2) + A("rise", P("M-6 -36 q-4 -6 0 -12 M6 -36 q4 -6 0 -12", null, "steam", 2))),
    bed: (v, id) => R(300, 120, 280, 60, "wood", 6) + R(300, 104, 60, 40, "paper", 10) + R(352, 112, 228, 54, "c5", 10, null, 0, "opacity:0.8") + G(560, 76, R(-18, -20, 36, 26, "paper", 3) + P("M-10 -20 q10 -12 20 0", "paper", "line", 1)) +
      G(250, 60, A("float", R(-4, -26, 8, 34, "paper", 4, "line", 1) + O(0, 10, 7, "c1") + R(-1.5, -18, 3, 26, "c1", 1))) + (id === "flu" ? G(360, 98, R(-16, -8, 32, 14, "sweat", 6)) : ""),
    laptop: () => G(450, 176, P("M-70 0 L-58 -86 L58 -86 L70 0 Z", "dark") + R(-52, -80, 104, 68, "screen", 3) + G(0, -50, O(0, -6, 10, "skinb") + R(-14, 4, 28, 18, "uniform", 6)) + R(-90, 0, 180, 8, "metal", 3)) +
      sparkle(520, 60, 0.9) + sparkle(380, 70, 0.6),
    mom: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 0 }, mood: "grumpy", pose: "hold" }), 1.05) + G(560, 150, R(-16, -16, 32, 24, "wood2", 4) + R(-10, -10, 20, 10, "dark", 2) + O(0, -16, 4, "c1")),
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
    grandma: () => G(470, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 3, shirt: 2 }, mood: "happy", prop: "envelope", pose: "hold" }), 0.95) +
      G(470, EFEET - 100, P("M-18 -4 Q0 -16 18 -4 Q8 -14 0 -14 Q-8 -14 -18 -4 Z", "gray")) + heart(400, 60, 1.2, "c1", -1) + heart(540, 50, 1, "blossom", -2),
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
    counsel: () => G(500, EFEET, avatar({ age: "adult", outfit: "casual", look: { hair: 1, shirt: 3 }, mood: "ok", pose: "hold", prop: "book" }), 0.95),
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
    campus: { bg: "campus", fx: "trip", mood: "happy", icon: "🚌" },
    insight: { bg: "room", fx: "bulb", mood: "happy", x: 300, icon: "💡" },
    eve: { bg: "room", night: true, fx: "examEve", mood: "stressed", icon: "🌙" },
    lunch: { bg: "kitchen", fx: "lunchbox", mood: "ok", icon: "🍱" },
  };
  const KEYWORDS = [
    [/bull|tease|gossip|cyber|threat|victim|gang/, "bully"],
    [/sick|ill|fever|hospital|injur/, "cold"],
    [/love|date|crush|confess/, "crush"],
    [/money|debt|pay|shop/, "family-money"],
    [/phone|sns|chat|online/, "smartphone"],
    [/friend|party|trip|camp/, "festival"],
  ];
  const STAGE_BG = { elem: "class", mid: "hall", high: "room", hs3: "room", academy: "cubicle", selfstudy: "cubicle", halfretake: "campus" };
  function specFor(id, stage) {
    if (EVENT_ART[id]) return EVENT_ART[id];
    const head = String(id).split(/[-_.:]/)[0];
    if (EVENT_ART[head]) return EVENT_ART[head];
    for (const [re, key] of KEYWORDS) if (re.test(id)) return EVENT_ART[key];
    return { bg: STAGE_BG[stage] || "room", night: stage === "high" || stage === "hs3", fx: "sparkles", icon: "✨" };
  }
  // ctx: { id, variant, stage, look, mood, season }
  function eventArt(ctx) {
    const spec = specFor(ctx.id, ctx.stage);
    const res = (spec.res && ctx.variant && (spec.res[ctx.variant] || spec.res[ctx.variant.slice(0, 2)])) || {};
    const c = Object.assign({}, ctx);
    let s = BACKDROPS[spec.bg](c, !!spec.night);
    // Foregrounds are drawn for the full 600-wide frame; nudging them left keeps them inside the
    // narrower crop a phone shows.
    s += G(-40, 0, FX[spec.fx](ctx.variant, ctx.id));
    const extra = { pose: res.pose || spec.pose, prop: res.prop !== undefined ? res.prop : spec.prop, mood: res.mood || (ctx.variant ? ctx.mood : spec.mood || ctx.mood) };
    s += person(c, spec.x || 200, EFEET, 0.86, extra);
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
    q5: () => R(0, 176, 600, 20, "river") + P("M100 20 L180 6 L180 204 L100 204 Z", "glass") + P("M180 6 L230 26 L230 204 L180 204 Z", "stone2") +
      (function () { let s = ""; for (let k = 0; k < 12; k++) s += L(104, 30 + k * 14, 176, 20 + k * 14.6, "screen", 2, "opacity:0.7"); return s; })() + R(250, 60, 60, 144, "glass", 2) + G(560, 60, O(0, 0, 3, "gold")),
  };
  const SCREENS = {
    birth(ctx) {
      let s = outdoorSky(EW, EH, { season: "spring", seed: 81 });
      s += (HOMES[ctx.family] || HOMES.q3)() + R(0, 196, EW, 24, "grass");
      s += tree(560, 200, "spring", 1.1) + tree(480, 204, "spring", 0.8) + particles("spring", 0, 0, EW, 200, false, 12, 3);
      s += person(Object.assign({}, ctx, { stage: "elem" }), 400, EFEET, 1, { mood: "happy", pose: "wave" });
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
  };
  const SCENES_EV = {
    exam(ctx) {
      let s = R(0, 0, EW, EF, "wall") + floorPlanks(EF, EW, EH - EF) + R(140, 20, 300, 96, "board", 4, "wood", 6) + clock(500, 50, 22, 8) + windowView(530, 90, 60, 70, { season: "fall", seed: 91, tree: false });
      for (const x of [60, 470]) s += G(x, 196, R(-40, -12, 80, 8, "wood", 2) + R(-16, -16, 32, 5, "paper", 1) + O(-18, -30, 14, "hair") + R(-36, -20, 34, 22, "hoodie", 8));
      return s + person(ctx, 260, EFEET, 0.86, { mood: ctx.mood === "happy" ? "ok" : ctx.mood });
    },
  };
  function screenArt(name, ctx) {
    if (name === "offers" || name === "ending") return svg("0 0 " + W + " " + H, SCENES[ctx.label ? "gate" : name === "ending" ? "road" : "home"](ctx), "event-art wide");
    return svg("0 0 " + EW + " " + EH, SCREENS[name](ctx), "event-art");
  }

  root.SuneungArt = { scene, sceneName, eventArt, screenArt, iconFor, moodOf, seasonOf, lookFor, avatar };
})(typeof window !== "undefined" ? window : globalThis);
