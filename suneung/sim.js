// Headless checks for the Suneung Simulator. Usage:
//   node suneung/sim.js            calibration table + strategy table
//   node suneung/sim.js --seeds 200   (default 60; the README tables use 80)
// The calibration table checks the simulated cohort against real 수능 numbers. The strategy table
// plays whole careers with simple bots, so balance changes show up as numbers rather than vibes.
"use strict";

const S = require("./engine.js");
const args = process.argv.slice(2);
const seeds = Number((args[args.indexOf("--seeds") + 1]) || 60) || 60;

// ---------- 1. calibration ----------
function calibration() {
  console.log("Cohort calibration (mean over 40 sittings)");
  console.log("subject   mean raw   1등급 cut   std max   1등급 share   raw @θ=0   raw @θ=2   raw @θ=3");
  const subs = ["kor", "math", "eng", "hist", "inq1"];
  for (const s of subs) {
    let mean = 0, cut = 0, stdMax = 0, share = 0, r0 = 0, r2 = 0, r3 = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const rng = S.makeRng(S.hashSeed("cal", i, s));
      const shift = rng.normal() * 0.28;
      const kind = s === "eng" || s === "hist" ? "absolute" : "relative";
      const key = S.hashSeed("cal", i);
      const a = S.gradeSubject(s, 0, 0, shift, key, kind);
      const b = S.gradeSubject(s, 2, 0, shift, key, kind);
      const c = S.gradeSubject(s, 3, 0, shift, key, kind);
      mean += a.mean; r0 += a.raw; r2 += b.raw; r3 += c.raw;
      if (kind === "absolute") share += a.grade1Share;
      else { cut += a.cut1; stdMax += a.stdMax; }
    }
    const f = (v) => (v / N).toFixed(1).padStart(8);
    console.log(
      s.padEnd(8), f(mean), "  ", s === "eng" || s === "hist" ? "     -  " : f(cut), "  ",
      s === "eng" || s === "hist" ? "    -   " : f(stdMax), "  ",
      s === "eng" || s === "hist" ? ((100 * share) / N).toFixed(1).padStart(8) + "%" : "      -  ",
      "  ", f(r0), "  ", f(r2), "  ", f(r3)
    );
  }
  console.log("Real targets: 국어 1등급 cut 84–92, std max 135–150 · 수학 cut 84–88, std max 135–148 · 영어 1등급 4–10% · 한국사 1등급 15–35% · 탐구 cut 44–50, std max 63–77\n");
}

// ---------- 2. strategy bots ----------
// Each bot returns a plan for the month. They don't read events; choices are always option 0.
const BOTS = {
  balanced: (g) => spread(g, ["kor", "math", "eng", "inq1", "inq2", "kor", "math", "hist"], 1),
  grinder: (g) => spread(g, ["math", "kor", "inq1", "inq2", "eng", "math", "kor", "hist"], 0),
  smart: (g) => smartPlan(g),
  slacker: (g) => spread(g, ["games", "friends", "math", "kor"], 0),
};
function spread(g, order, restEvery) {
  const n = g.blocks();
  const plan = {};
  let i = 0;
  for (let k = 0; k < n; k++) {
    let id = order[i++ % order.length];
    if (restEvery && (k + 1) % 4 === 0) id = g.stress > 55 ? "rest" : "exercise";
    plan[id] = (plan[id] || 0) + 1;
  }
  return plan;
}
// Looks after stress and health first, then studies the subject with the most to gain,
// skipping English past the 90-point band and History once it is safely in grade 1–3.
function smartPlan(g) {
  const n = g.blocks();
  const plan = {};
  let left = n;
  if (g.stress > 62 && left > 1) { plan.friends = 1; left--; }
  if (g.health < 50 && left > 1) { plan.exercise = 1; left--; }
  if (g.month === 10 && left > 2) { plan.mock = 1; left--; }
  const want = ["kor", "math", "inq1", "inq2", "eng", "hist"].map((s) => {
    let v = 3 - g.skills[s];
    if (s === "eng" && g.skills.eng > 1.6) v -= 2;
    if (s === "hist" && g.skills.hist > 0.6) v -= 3;
    if (s === "kor" || s === "math") v += 0.3;
    return { s, v };
  });
  for (let k = 0; k < left; k++) {
    want.sort((a, b) => b.v - a.v);
    plan[want[0].s] = (plan[want[0].s] || 0) + 1;
    want[0].v -= 0.45;
  }
  return plan;
}

function playCareer(seed, bot, opts) {
  const g = new S.Game({ seed, family: opts.family, track: opts.track, inq: opts.inq });
  const results = [];
  let guard = 0;
  while (!g.ending && guard++ < 400) {
    const top = g.queue[0];
    if (!top) {
      const plan = BOTS[bot](g);
      let method = opts.method || "self";
      if (g.validate(plan, method)) method = "self";
      if (g.validate(plan, method)) { plan.job = 0; }
      const err = g.validate(plan, method);
      if (err) throw new Error(err + " " + JSON.stringify(plan));
      g.advance(plan, method);
      continue;
    }
    if (top.type === "event") { g.choose(top.choices ? 0 : 0); continue; }
    if (top.type === "mock" || top.type === "exam") {
      if (top.type === "exam") results.push(top.result);
      g.dismiss();
      continue;
    }
    if (top.type === "apply") {
      const opt = g.options().filter((o) => !o.blocked);
      // Apply to the best "match" school, one reach and one safe.
      const safe = opt.find((o) => o.p >= 0.85);
      const match = opt.find((o) => o.p >= 0.55);
      const reach = opt.find((o) => o.p >= 0.25);
      g.apply([reach, match, safe].filter(Boolean).map((o) => o.id));
      continue;
    }
    if (top.type === "offers") {
      const best = top.offers.map((id) => S.UNIVERSITIES.findIndex((u) => u.id === id)).sort((a, b) => a - b)[0];
      const goal = opts.goal;
      const goalIdx = S.UNIVERSITIES.findIndex((u) => u.id === goal);
      if (best != null && (best <= goalIdx || g.attempt >= opts.maxAttempts)) g.decide({ action: "enroll", uni: S.UNIVERSITIES[best].id });
      else if (g.attempt >= opts.maxAttempts) g.decide({ action: "quit" });
      else {
        const ro = g.retakeOptions(top.score).find((o) => o.id === (opts.retake || "academy"));
        g.decide({ action: ro.blocked ? "selfstudy" : ro.id });
      }
      continue;
    }
    throw new Error("Unexpected screen " + top.type);
  }
  return { g, results };
}

function strategies() {
  const configs = [
    { label: "balanced, self-study, 1 try", bot: "balanced", family: "middle", method: "self", maxAttempts: 1, goal: "college" },
    { label: "slacker, 1 try", bot: "slacker", family: "middle", method: "self", maxAttempts: 1, goal: "college" },
    { label: "grinder (no rest), self-study, 1 try", bot: "grinder", family: "middle", method: "self", maxAttempts: 1, goal: "college" },
    { label: "smart, online lectures, 1 try", bot: "smart", family: "middle", method: "online", maxAttempts: 1, goal: "college" },
    { label: "smart, cram school, wealthy, 1 try", bot: "smart", family: "wealthy", method: "hagwon", maxAttempts: 1, goal: "college" },
    { label: "smart, tutor, wealthy, 1 try", bot: "smart", family: "wealthy", method: "tutor", maxAttempts: 1, goal: "college" },
    { label: "smart, online, retake (academy) up to 3", bot: "smart", family: "middle", method: "online", maxAttempts: 3, goal: "yonsei" },
    { label: "smart, online, self-study retakes up to 3", bot: "smart", family: "middle", method: "online", maxAttempts: 3, goal: "yonsei", retake: "selfstudy" },
    { label: "smart, tutor, wealthy, sci, chase 의대 up to 5", bot: "smart", family: "wealthy", method: "tutor", maxAttempts: 5, goal: "med", track: "sci", inq: ["bio", "earth"] },
  ];
  console.log("Strategy bots (" + seeds + " seeds each). Grades are the first and last 수능; 'SKY' = SNU, Yonsei or Korea; std = 국수탐 standard total.");
  console.log("strategy".padEnd(46) + "first: kor math eng  avg std | last std | tries | SKY+  | med  | in-Seoul+");
  // Seeds on the outside, so every bot reuses the cached cohorts of the same sittings.
  const acc = configs.map(() => ({ kor: 0, math: 0, eng: 0, std: 0, lastStd: 0, tries: 0, sky: 0, med: 0, seoul: 0 }));
  for (let i = 0; i < seeds; i++) {
    configs.forEach((c, ci) => {
      const a = acc[ci];
      const { g, results } = playCareer(1000 + i, c.bot, c);
      const f = results[0].subjects;
      a.kor += f.kor.grade; a.math += f.math.grade; a.eng += f.eng.grade; a.std += results[0].total;
      a.lastStd += results[results.length - 1].total;
      a.tries += g.attempt;
      const uni = g.ending && g.ending.uni;
      const idx = S.UNIVERSITIES.findIndex((u) => u.id === uni);
      if (uni === "med") a.med++;
      if (idx >= 0 && idx <= 3) a.sky++;
      if (idx >= 0 && idx <= 19) a.seoul++;
    });
  }
  const p = (v) => ((100 * v) / seeds).toFixed(0).padStart(4) + "%";
  configs.forEach((c, ci) => {
    const a = acc[ci];
    console.log(
      c.label.padEnd(46),
      (a.kor / seeds).toFixed(1).padStart(4), (a.math / seeds).toFixed(1).padStart(5), (a.eng / seeds).toFixed(1).padStart(4),
      (a.std / seeds).toFixed(0).padStart(7), "|", (a.lastStd / seeds).toFixed(0).padStart(8), "|", (a.tries / seeds).toFixed(2).padStart(5),
      "|", p(a.sky), "|", p(a.med), "|", p(a.seoul)
    );
  });
}

const t0 = Date.now();
calibration();
strategies();
console.log("\n(" + ((Date.now() - t0) / 1000).toFixed(1) + "s)");
