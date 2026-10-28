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
  topEnd();
}

// ---------- 1b. the top end ----------
// A perfect 탐구 paper should be worth a 99–100 percentile (only 0.5–2% of a pool scores 50/50), and a
// player with every bar at 100 (θ = 3) should be a likely SNU admit and about a coin flip for 의대.
// Exam-day noise is left out, so these are the chances on a good day.
function topEnd() {
  const N = 150;
  const snu = S.UNIVERSITIES.find((u) => u.id === "snu"), med = S.UNIVERSITIES.find((u) => u.id === "med");
  const players = [];
  for (const theta of [3, 99]) for (const inq of [["phys", "chem"], ["bio", "earth"]]) players.push({ theta, inq, perfPct: 0, perfN: 0, score: 0, ps: 0, pm: 0 });
  // Sittings on the outside, so each sitting's cohorts are built once and shared by all four players.
  for (let i = 0; i < N; i++) {
    const key = S.hashSeed("top", i);
    for (const pl of players) {
      const diff = S.makeRng(S.hashSeed(key, "difficulty"));
      const subjects = {};
      for (const s of S.SUBJECTS) {
        const shift = diff.normal() * 0.28;
        const pop = s === "inq1" ? S.inquiryInfo(pl.inq[0]).pop : s === "inq2" ? S.inquiryInfo(pl.inq[1]).pop : 0;
        subjects[s] = S.gradeSubject(s, pl.theta, pop, shift, key, s === "eng" || s === "hist" ? "absolute" : "relative");
        if ((s === "inq1" || s === "inq2") && subjects[s].raw === 50) { pl.perfPct += subjects[s].pct; pl.perfN++; }
      }
      const a = S.admissionScore({ subjects });
      pl.score += a; pl.ps += S.admitChance(a, snu, "sci"); pl.pm += S.admitChance(a, med, "sci");
    }
  }
  console.log("Top end (" + N + " sittings, sciences track, no exam-day noise)");
  console.log("player                        perfect 탐구 pct   admission   P(SNU)   P(의대)");
  for (const pl of players) {
    const who = (pl.theta > 10 ? "every answer right" : "all bars at 100") + ", " + pl.inq.join("/");
    console.log(who.padEnd(30), (pl.perfN ? (pl.perfPct / pl.perfN).toFixed(1) : "-").padStart(14), (pl.score / N).toFixed(2).padStart(11),
      ((100 * pl.ps) / N).toFixed(0).padStart(7) + "%", ((100 * pl.pm) / N).toFixed(0).padStart(7) + "%");
  }
  console.log("Targets: a perfect 탐구 paper at 99–100 · all bars at 100: SNU likely, 의대 about a coin flip\n");
}

// ---------- 2. strategy bots ----------
// Each bot returns a plan for the turn from the activities on offer. Events always get option 0.
// In early childhood (ages 0–5) each bot plays its own way: a balanced mix, cartoons and playdates,
// learning through play only, or play with a break when stress runs high.
const BOTS = {
  balanced: (g) => spread(g, g.isEarly() ? ["books", "blocks", "songs", "friends", "exercise"] : ["kor", "math", "eng", "friends", "inq1", "inq2", "reading", "hist", "math", "exercise"]),
  slacker: (g) => spread(g, g.isEarly() ? ["games", "friends", "exercise"] : ["games", "friends", "math", "kor"]),
  grinder: (g) => spread(g, g.isEarly() ? ["books", "blocks", "songs", "worksheet"] : ["math", "kor", "eng", "inq1", "inq2", "math", "kor", "hist"]),
  smart: (g) => (g.isEarly() ? spread(g, g.stress > 62 ? ["friends", "books", "blocks", "songs"] : ["books", "blocks", "songs"]) : smartPlan(g)),
};
function offered(g) { return new Set(g.activities().map((a) => a.id)); }
function spread(g, order) {
  const ok = offered(g);
  order = order.filter((id) => ok.has(id));
  const n = g.blocks();
  const plan = {};
  for (let k = 0; k < n; k++) { const id = order[k % order.length]; plan[id] = (plan[id] || 0) + 1; }
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
  if (g.status === "elem" && left > 2) { plan.reading = 1; left--; }
  if (g.month === 10 && g.grade >= 12 && left > 2) { plan.mock = 1; left--; }
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
// The best study method from the bot's preference down that the family can afford this turn.
function pickMethod(g, plan, pref) {
  const order = ["tutor", "hagwon", "online", "self"];
  for (const m of order.slice(order.indexOf(pref))) if (!g.validate(plan, m)) return m;
  return "self";
}
function pickTrack(g, opts) {
  // Science and foreign-language high schools only teach one track.
  const only = g.dropout == null && g.schoolInfo().track;
  const track = only || opts.track || (g.skills.math + g.skills.inq2 > g.skills.kor + g.skills.inq1 ? "sci" : "soc");
  const inq = opts.inq || S.INQUIRY[track].slice().sort((a, b) => a.pop - b.pop).slice(0, 2).map((x) => x.id);
  return [track, inq];
}

function playCareer(seed, bot, opts) {
  const g = new S.Game({ seed, family: opts.family });
  // opts.trait: a paired test. The life gets only that trait (or none, for null) instead of what its
  // newborn and 돌잡이 reveals would have dealt.
  if (opts.trait !== undefined) {
    const add = g.addTrait.bind(g);
    let given = false;
    g.addTrait = () => { if (!given && opts.trait) add(opts.trait); given = true; };
  }
  const results = [];
  let at12 = null;
  let guard = 0;
  while (!g.ending && guard++ < 600) {
    const top = g.queue[0];
    if (!top) {
      if (g.grade === 12 && g.month === 3 && g.attempt === 1 && !at12) at12 = Object.assign({}, g.skills);
      // Dropout bots leave school at the start of their grade.
      if (opts.quitAt && g.grade >= opts.quitAt && !g.quitBlock()) g.quitSchool();
      const plan = BOTS[bot](g);
      const method = pickMethod(g, plan, opts.method || "self");
      const err = g.validate(plan, method);
      if (err) throw new Error(err + " " + JSON.stringify(plan));
      g.advance(plan, method);
      continue;
    }
    if (top.type === "event") { g.choose(top.id === "early" && !opts.early ? 1 : 0); continue; }
    if (top.type === "birth") { g.dismiss(); continue; }
    // Schools: the public one unless the bot has a list of schools it tries for (first open one with
    // a fair chance).
    if (top.type === "school") {
      const o = g.schoolOptions();
      const want = (opts.schools || []).map((id) => o.find((x) => x.id === id)).find((x) => x && !x.blocked && x.p >= 0.2);
      g.pickSchool(want ? want.id : o.find((x) => x.def).id);
      continue;
    }
    if (top.type === "track") { const [t, inq] = pickTrack(g, opts); g.chooseTrack(t, inq); continue; }
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
      const goalIdx = S.UNIVERSITIES.findIndex((u) => u.id === opts.goal);
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
  return { g, results, at12 };
}

function strategies() {
  const configs = [
    { label: "balanced, self-study, 1 try", bot: "balanced", method: "self", maxAttempts: 1, goal: "college" },
    { label: "slacker, 1 try", bot: "slacker", method: "self", maxAttempts: 1, goal: "college" },
    { label: "grinder (no rest), self-study, 1 try", bot: "grinder", method: "self", maxAttempts: 1, goal: "college" },
    { label: "smart, online lectures, 1 try", bot: "smart", method: "online", maxAttempts: 1, goal: "college" },
    { label: "smart, best affordable method, 1 try", bot: "smart", method: "tutor", maxAttempts: 1, goal: "college" },
    { label: "smart, best affordable, retakes up to 3", bot: "smart", method: "tutor", maxAttempts: 3, goal: "yonsei" },
    { label: "smart, best affordable, sci, 의대 up to 5", bot: "smart", method: "tutor", maxAttempts: 5, goal: "med", track: "sci", inq: ["bio", "earth"] },
    // Schools: aiming for the selective ones, a science school for a 의대 chaser, a vocational school.
    { label: "smart, best affordable, selective schools, 1 try", bot: "smart", method: "tutor", maxAttempts: 1, goal: "college", schools: ["intlMid", "sciHigh", "autoHigh", "langHigh", "privElem", "privMid", "privHigh"] },
    { label: "smart, sci, science high, 의대 up to 5", bot: "smart", method: "tutor", maxAttempts: 5, goal: "med", track: "sci", inq: ["bio", "earth"], schools: ["sciHigh"] },
    { label: "balanced, vocational high, 1 try", bot: "balanced", method: "self", maxAttempts: 1, goal: "college", schools: ["vocHigh"] },
    // Leaving school (자퇴): from grade 10, and from grade 7 with the Suneung a year early.
    { label: "balanced, self-study, quits at 10, 1 try", bot: "balanced", method: "self", maxAttempts: 1, goal: "college", quitAt: 10 },
    { label: "smart, best affordable, quits at 10, 1 try", bot: "smart", method: "tutor", maxAttempts: 1, goal: "college", quitAt: 10 },
    { label: "smart, best affordable, quits at 7, early", bot: "smart", method: "tutor", maxAttempts: 1, goal: "college", quitAt: 7, early: true },
  ];
  console.log("Strategy bots (" + seeds + " lives each, families dealt from the real quintiles). 'start' = average ability (0–100) entering grade 12.");
  console.log("strategy".padEnd(42) + "start | 1st: kor math eng  std | last std | tries | SKY+  | med  | in-Seoul+");
  const acc = configs.map(() => ({ start: 0, kor: 0, math: 0, eng: 0, std: 0, lastStd: 0, tries: 0, sky: 0, med: 0, seoul: 0 }));
  const byFam = {};
  for (const f of S.FAMILY_IDS) byFam[f] = { n: 0, start: 0, std: 0, sky: 0, seoul: 0 };
  // By region kind: the smart bot's first try, and how often the 의대 chaser gets in (local quotas).
  const byKind = {};
  for (const k of Object.keys(S.REGION_KINDS)) byKind[k] = { n: 0, start: 0, std: 0, sky: 0, seoul: 0, mn: 0, med: 0 };
  // Every life's first 수능 total, per strategy, for the spread table.
  const firsts = configs.map(() => []), starts = configs.map(() => []);

  for (let i = 0; i < seeds; i++) {
    configs.forEach((c, ci) => {
      const a = acc[ci];
      const { g, results, at12 } = playCareer(1000 + i, c.bot, c);
      const avg = S.SUBJECTS.reduce((t, s) => t + S.skillScore(at12[s]), 0) / S.SUBJECTS.length;
      a.start += avg;
      const f = results[0].subjects;
      a.kor += f.kor.grade; a.math += f.math.grade; a.eng += f.eng.grade; a.std += results[0].total;
      a.lastStd += results[results.length - 1].total;
      firsts[ci].push(results[0].total);
      starts[ci].push(avg);
      a.tries += g.attempt;
      const uni = g.ending && g.ending.uni;
      const idx = S.UNIVERSITIES.findIndex((u) => u.id === uni);
      if (uni === "med") a.med++;
      if (idx >= 0 && idx <= 3) a.sky++;
      if (idx >= 0 && idx <= 19) a.seoul++;
      const rk = byKind[g.regionInfo().kind];
      if (ci === 4) { rk.n++; rk.start += avg; rk.std += results[0].total; if (idx >= 0 && idx <= 3) rk.sky++; if (idx >= 0 && idx <= 19) rk.seoul++; }
      if (ci === 6) { rk.mn++; if (uni === "med") rk.med++; }
      if (ci === 4) {
        const b = byFam[g.family];
        b.n++; b.start += avg; b.std += results[0].total;
        if (idx >= 0 && idx <= 3) b.sky++;
        if (idx >= 0 && idx <= 19) b.seoul++;
      }
    });
  }
  const p = (v, n) => ((100 * v) / (n || seeds)).toFixed(0).padStart(4) + "%";
  configs.forEach((c, ci) => {
    const a = acc[ci];
    console.log(
      c.label.padEnd(42), (a.start / seeds).toFixed(0).padStart(5), "|",
      (a.kor / seeds).toFixed(1).padStart(8), (a.math / seeds).toFixed(1).padStart(4), (a.eng / seeds).toFixed(1).padStart(4),
      (a.std / seeds).toFixed(0).padStart(5), "|", (a.lastStd / seeds).toFixed(0).padStart(8), "|", (a.tries / seeds).toFixed(2).padStart(5),
      "|", p(a.sky), "|", p(a.med), "|", p(a.seoul)
    );
  });
  // How far luck spreads lives that follow the same strategy: their ability entering High 3 and their
  // first 수능 totals, from the unluckiest tenth to the luckiest.
  const sdOf = (xs) => { const m = xs.reduce((t, x) => t + x, 0) / xs.length; return Math.sqrt(xs.reduce((t, x) => t + (x - m) * (x - m), 0) / xs.length); };
  console.log("\nSpread (same strategy, different lives): ability entering High 3, and the first 수능 total");
  // skill r²: how much of the spread in totals ability entering High 3 explains; the rest is luck
  // (exam day, the paper, illness and accidents in High 3, family money for the last year's tutors).
  console.log("strategy".padEnd(42) + "start sd |  mean |   sd |  p10 |  p90 | p90-p10 | skill r²");
  for (const ci of [0, 4]) {
    const xs = firsts[ci].slice().sort((x, y) => x - y);
    const q = (f) => xs[Math.min(xs.length - 1, Math.floor(f * xs.length))];
    const mean = xs.reduce((t, x) => t + x, 0) / xs.length;
    const ms = starts[ci].reduce((t, x) => t + x, 0) / starts[ci].length;
    let cov = 0;
    for (let k = 0; k < firsts[ci].length; k++) cov += (firsts[ci][k] - mean) * (starts[ci][k] - ms);
    const r = cov / firsts[ci].length / (sdOf(firsts[ci]) * sdOf(starts[ci]));
    console.log(configs[ci].label.padEnd(42), sdOf(starts[ci]).toFixed(1).padStart(8), "|", mean.toFixed(0).padStart(5), "|", sdOf(xs).toFixed(1).padStart(4), "|", String(q(0.1)).padStart(4), "|", String(q(0.9)).padStart(4), "|", String(q(0.9) - q(0.1)).padStart(7), "|", (r * r).toFixed(2).padStart(8));
  }
  console.log("\nBy family (smart bot, best affordable method, 1 try):");
  console.log("family   lives | start | 1st std | SKY+  | in-Seoul+");
  for (const f of S.FAMILY_IDS) {
    const b = byFam[f];
    if (!b.n) continue;
    console.log(f.padEnd(8), String(b.n).padStart(5), "|", (b.start / b.n).toFixed(0).padStart(5), "|", (b.std / b.n).toFixed(0).padStart(7), "|", p(b.sky, b.n), "|", p(b.seoul, b.n));
  }
  console.log("\nBy region kind (smart bot, best affordable method, 1 try; 의대 = the 의대 chaser within 5 tries):");
  console.log("region   lives | start | 1st std | SKY+  | in-Seoul+ | 의대");
  for (const k of Object.keys(byKind)) {
    const b = byKind[k];
    if (!b.n) continue;
    console.log(k.padEnd(8), String(b.n).padStart(5), "|", (b.start / b.n).toFixed(0).padStart(5), "|", (b.std / b.n).toFixed(0).padStart(7), "|", p(b.sky, b.n), "|", p(b.seoul, b.n).padStart(9), "|", p(b.med, b.mn));
  }
}

// ---------- 3. traits ----------
// What each trait is worth: the same lives (smart bot, best affordable method, first try) replayed
// with only that trait, against the same lives with none. Paired, so small effects show.
function traits() {
  const cfg = { bot: "smart", method: "tutor", maxAttempts: 1, goal: "college" };
  const run = (t) => {
    let start = 0, std = 0, seoul = 0;
    for (let i = 0; i < seeds; i++) {
      const { g, results, at12 } = playCareer(1000 + i, "smart", Object.assign({ trait: t }, cfg));
      start += S.SUBJECTS.reduce((a, s) => a + S.skillScore(at12[s]), 0) / S.SUBJECTS.length;
      std += results[0].total;
      const idx = S.UNIVERSITIES.findIndex((u) => u.id === (g.ending && g.ending.uni));
      if (idx >= 0 && idx <= 19) seoul++;
    }
    return { start: start / seeds, std: std / seeds, seoul: (100 * seoul) / seeds };
  };
  const base = run(null);
  console.log("\nTraits, paired (" + seeds + " lives each, smart bot, best affordable method, 1 try; each trait alone vs none):");
  console.log("trait        Δ start | Δ 1st std | in-Seoul+ (none: " + base.seoul.toFixed(0) + "%)");
  for (const t of Object.keys(S.TEMPERAMENTS).concat(Object.keys(S.DOLJABI))) {
    const r = run(t);
    const f = (v) => (v >= 0 ? "+" : "") + v.toFixed(1);
    console.log(t.padEnd(12), f(r.start - base.start).padStart(7), "|", f(r.std - base.std).padStart(9), "|", (r.seoul.toFixed(0) + "%").padStart(9));
  }
}

const t0 = Date.now();
calibration();
strategies();
// The paired trait test is the slowest part; --no-traits skips it while tuning.
if (args.indexOf("--no-traits") < 0) traits();
console.log("\n(" + ((Date.now() - t0) / 1000).toFixed(1) + "s)");
