// Suneung Simulator engine. No DOM access, so it runs in the browser or in Node (see sim.js).
//
// The game is a queue of screens. The app calls advance(plan) once per month; the engine
// applies the plan, rolls events and exams, and pushes anything the player must see or decide
// onto `g.queue`. The app shows queue[0] and answers it with choose(i), apply(ids) or decide(d).
// When the queue is empty the player plans the next month.
(function (root) {
  "use strict";

  // ---------- seeded RNG ----------
  // mulberry32: tiny, fast, and its whole state is one integer, so a saved game resumes exactly.
  function nextRand(state) {
    let t = (state + 0x6d2b79f5) | 0;
    const s = t;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return [s, ((t ^ (t >>> 14)) >>> 0) / 4294967296];
  }
  function makeRng(seed) {
    let s = seed | 0;
    const r = () => { const o = nextRand(s); s = o[0]; return o[1]; };
    r.normal = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
    r.state = () => s;
    return r;
  }
  function hashSeed() {
    let h = 2166136261;
    for (const a of arguments) {
      const str = String(a);
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      h ^= 0x9e37; h = Math.imul(h, 16777619);
    }
    return h | 0;
  }
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  // ---------- subjects and the exam format (2022–2027 수능) ----------
  // Ability is a latent θ on the scale of the year's test takers (mean 0, sd 1). Each question has an
  // item-response curve, so a strong student still drops the odd question and the top end is crowded:
  // past θ ≈ 2.5 more study mostly buys insurance against a bad day rather than more points.
  const INQUIRY = {
    soc: [
      { id: "ethics", name: "Ethics & Life", ko: "생활과 윤리", pop: -0.15 },
      { id: "society", name: "Society & Culture", ko: "사회·문화", pop: -0.1 },
      { id: "ideas", name: "Ethics & Ideas", ko: "윤리와 사상", pop: 0.05 },
      { id: "kgeo", name: "Korean Geography", ko: "한국지리", pop: 0 },
      { id: "wgeo", name: "World Geography", ko: "세계지리", pop: 0 },
      { id: "eahist", name: "East Asian History", ko: "동아시아사", pop: 0.05 },
      { id: "whist", name: "World History", ko: "세계사", pop: 0.05 },
      { id: "law", name: "Politics & Law", ko: "정치와 법", pop: 0.1 },
      { id: "econ", name: "Economics", ko: "경제", pop: 0.25 },
    ],
    sci: [
      { id: "phys", name: "Physics I", ko: "물리학Ⅰ", pop: 0.35 },
      { id: "chem", name: "Chemistry I", ko: "화학Ⅰ", pop: 0.3 },
      { id: "bio", name: "Life Science I", ko: "생명과학Ⅰ", pop: 0.05 },
      { id: "earth", name: "Earth Science I", ko: "지구과학Ⅰ", pop: -0.15 },
    ],
  };
  // pop: how strong that subject's takers are. Standard scores and percentiles are relative to the
  // people who sit the same subject, so a strong pool (Physics) is harder to top.

  // Item layouts. pts = points per question, mc = multiple choice (5 options, so 20% guessable).
  function items(spec) {
    const out = [];
    for (const [n, pts, mc] of spec) for (let i = 0; i < n; i++) out.push({ pts, mc });
    return out;
  }
  const FORMATS = {
    kor: items([[35, 2, true], [10, 3, true]]), // 45 questions, 100 points, 80 minutes
    // Math: 22 common (15 MC + 7 short answer), 8 elective (6 MC + 2 short answer).
    math: items([[2, 2, true], [6, 3, true], [7, 4, true], [3, 3, false], [4, 4, false], [2, 2, true], [3, 3, true], [1, 4, true], [2, 4, false]]),
    eng: items([[35, 2, true], [10, 3, true]]),
    hist: items([[10, 2, true], [10, 3, true]]),
    inq: items([[10, 2, true], [10, 3, true]]),
  };
  // Per-subject paper shape: how hard an average question is, and how far the hard tail reaches.
  // Tuned with sim.js so the cohort lands near real numbers (see README "Calibration").
  const PAPER = {
    kor: { base: -0.4, spread: 1.15, killer: 2.3, killers: 5, a: 1.25 },
    math: { base: -0.25, spread: 1.0, killer: 2.0, killers: 4, a: 1.35 },
    eng: { base: -0.08, spread: 1.0, killer: 2.0, killers: 3, a: 1.3 },
    hist: { base: -0.6, spread: 0.9, killer: 1.0, killers: 2, a: 1.2 },
    inq: { base: -0.65, spread: 1.0, killer: 1.7, killers: 3, a: 1.4 },
  };

  const SUBJECTS = ["kor", "math", "eng", "hist", "inq1", "inq2"];
  // rate: how fast study moves θ. History is a small, memorizable syllabus; Korean reading is slow to build.
  const SUBJECT_INFO = {
    kor: { name: "Korean", ko: "국어", format: "kor", rate: 0.8, maxRaw: 100 },
    math: { name: "Math", ko: "수학", format: "math", rate: 1.0, maxRaw: 100 },
    eng: { name: "English", ko: "영어", format: "eng", rate: 0.95, maxRaw: 100 },
    hist: { name: "Korean History", ko: "한국사", format: "hist", rate: 1.6, maxRaw: 50 },
    inq1: { name: "Inquiry 1", ko: "탐구1", format: "inq", rate: 1.3, maxRaw: 50 },
    inq2: { name: "Inquiry 2", ko: "탐구2", format: "inq", rate: 1.3, maxRaw: 50 },
  };

  const GRADE_CUTS = [0.04, 0.11, 0.23, 0.40, 0.60, 0.77, 0.89, 0.96]; // cumulative share from the top

  // ---------- activities and study methods ----------
  const ACTIVITIES = [
    { id: "kor", kind: "study", subject: "kor", label: "Study Korean", ko: "국어" },
    { id: "math", kind: "study", subject: "math", label: "Study Math", ko: "수학" },
    { id: "eng", kind: "study", subject: "eng", label: "Study English", ko: "영어" },
    { id: "hist", kind: "study", subject: "hist", label: "Study Korean History", ko: "한국사" },
    { id: "inq1", kind: "study", subject: "inq1", label: "Study Inquiry 1", ko: "탐구1" },
    { id: "inq2", kind: "study", subject: "inq2", label: "Study Inquiry 2", ko: "탐구2" },
    { id: "mock", kind: "life", label: "Timed practice exams", ko: "실전 모의고사", hint: "Builds exam stamina: steadier scores on the day. Small gains everywhere, stressful." },
    { id: "rest", kind: "life", label: "Rest & sleep", ko: "휴식", hint: "−Stress, +Health" },
    { id: "exercise", kind: "life", label: "Exercise", ko: "운동", hint: "+Health, −Stress" },
    { id: "friends", kind: "life", label: "Hang out with friends", ko: "친구", hint: "Big −Stress, +Motivation, things happen" },
    { id: "games", kind: "life", label: "Games & YouTube", ko: "게임", hint: "−Stress but −Motivation" },
    { id: "job", kind: "life", label: "Part-time job", ko: "알바", hint: "+₩250,000, +Stress, −Health" },
  ];
  // mult: study speed. sens: how much the gain depends on motivation (a tutor keeps you on task,
  // online lectures do not). cost: won per block of study.
  const METHODS = {
    self: { name: "Self-study", ko: "독학", mult: 1.0, sens: 1.0, cost: 0 },
    online: { name: "Online lectures", ko: "인강", mult: 1.25, sens: 1.15, cost: 25000 },
    hagwon: { name: "Cram school", ko: "학원", mult: 1.45, sens: 0.6, cost: 120000 },
    tutor: { name: "Private tutor", ko: "과외", mult: 1.75, sens: 0.4, cost: 250000 },
  };
  // A year's situation. blocks(month) = free blocks of time that month; 수능 week only has half a month.
  const STATUSES = {
    hs3: { name: "High school senior", ko: "고3 현역", blocks: (m) => (m === 7 || m === 8 ? 6 : m === 11 ? 2 : 4) },
    academy: { name: "Retake academy", ko: "재종반", blocks: (m) => (m === 11 ? 3 : 6), fee: 2900000, method: "hagwon" },
    selfstudy: { name: "Self-study retake", ko: "독학재수", blocks: (m) => (m === 11 ? 3 : 6) },
    halfretake: { name: "Half-retake at university", ko: "반수", blocks: (m) => (m <= 6 ? 2 : m === 11 ? 3 : 6) },
  };
  const FAMILIES = {
    tight: { name: "Tight budget", ko: "흙수저", allowance: 300000, start: 200000, prior: -0.15 },
    middle: { name: "Middle class", ko: "평범", allowance: 1200000, start: 1000000, prior: 0 },
    wealthy: { name: "Wealthy (Gangnam)", ko: "금수저", allowance: 5000000, start: 5000000, prior: 0.25 },
  };
  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MOCKS = { 3: "March 학력평가", 6: "June 모의평가", 9: "September 모의평가" };

  // ---------- universities (정시, rough) ----------
  // cut: the 국수탐 percentile average (after the English/History deductions below) where an
  // application is about a coin flip. Ballpark 2025-era 정시 numbers, simplified to one per school.
  const UNIVERSITIES = [
    { id: "med", name: "Medical school", ko: "의대", cut: 99.3, sci: true },
    { id: "snu", name: "Seoul National University", ko: "서울대", cut: 98.7 },
    { id: "yonsei", name: "Yonsei University", ko: "연세대", cut: 97.6 },
    { id: "korea", name: "Korea University", ko: "고려대", cut: 97.4 },
    { id: "skku", name: "Sungkyunkwan University", ko: "성균관대", cut: 96.1 },
    { id: "sogang", name: "Sogang University", ko: "서강대", cut: 95.8 },
    { id: "hanyang", name: "Hanyang University", ko: "한양대", cut: 95.6 },
    { id: "cau", name: "Chung-Ang University", ko: "중앙대", cut: 94.2 },
    { id: "khu", name: "Kyung Hee University", ko: "경희대", cut: 93.6 },
    { id: "hufs", name: "Hankuk Univ. of Foreign Studies", ko: "한국외대", cut: 93.3 },
    { id: "uos", name: "University of Seoul", ko: "서울시립대", cut: 93.8 },
    { id: "konkuk", name: "Konkuk University", ko: "건국대", cut: 91.0 },
    { id: "dongguk", name: "Dongguk University", ko: "동국대", cut: 90.6 },
    { id: "hongik", name: "Hongik University", ko: "홍익대", cut: 90.0 },
    { id: "pnu", name: "Pusan National University", ko: "부산대", cut: 88.5 },
    { id: "knu", name: "Kyungpook National University", ko: "경북대", cut: 87.5 },
    { id: "kookmin", name: "Kookmin University", ko: "국민대", cut: 86.8 },
    { id: "soongsil", name: "Soongsil University", ko: "숭실대", cut: 86.5 },
    { id: "inha", name: "Inha University", ko: "인하대", cut: 85.0 },
    { id: "ajou", name: "Ajou University", ko: "아주대", cut: 85.8 },
    { id: "gachon", name: "Gachon University", ko: "가천대", cut: 80.0 },
    { id: "regional", name: "Regional private university", ko: "지방 사립대", cut: 60.0 },
    { id: "college", name: "Junior college", ko: "전문대", cut: 25.0 },
  ];
  const ENG_DEDUCT = [0, 0, 0.8, 2.0, 3.5, 5.5, 8, 11, 14, 17]; // by English grade 1..9
  const UNI_BY_ID = Object.fromEntries(UNIVERSITIES.map((u) => [u.id, u]));
  const UNI_SLOPE = 0.7; // percentile points per logit: how quickly your odds move around the cut

  function admissionScore(res) {
    const s = res.subjects;
    const avg = (s.kor.pct + s.math.pct + (s.inq1.pct + s.inq2.pct) / 2) / 3;
    const histPenalty = s.hist.grade > 4 ? 2 : s.hist.grade > 3 ? 0.5 : 0;
    return avg - ENG_DEDUCT[s.eng.grade] - histPenalty;
  }
  function admitChance(score, uni, track) {
    if (uni.sci && track !== "sci") return 0;
    return 1 / (1 + Math.exp(-(score - uni.cut) / UNI_SLOPE));
  }
  function chanceLabel(p) {
    if (p >= 0.85) return { ko: "안정", en: "safe" };
    if (p >= 0.55) return { ko: "적정", en: "match" };
    if (p >= 0.25) return { ko: "소신", en: "reach" };
    return { ko: "상향", en: "long shot" };
  }

  // ---------- exam simulation ----------
  const COHORT = 3000;

  function itemCurve(theta, b, a, mc) {
    const p = 1 / (1 + Math.exp(-1.7 * a * (theta - b)));
    return mc ? 0.2 + 0.8 * p : p;
  }

  // One paper: per-question difficulties for this sitting. `shift` > 0 makes the whole paper harder.
  function makePaper(fmt, shape, shift, rng) {
    const qs = FORMATS[fmt];
    const out = new Array(qs.length);
    const hardIdx = new Set();
    // The killer questions sit among the high-point items.
    const pool = qs.map((q, i) => i).filter((i) => qs[i].pts >= 3);
    while (hardIdx.size < Math.min(shape.killers, pool.length)) hardIdx.add(pool[Math.floor(rng() * pool.length)]);
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      let b = shape.base + shift + rng.normal() * shape.spread * 0.6 + (q.pts - 2) * 0.35 * shape.spread;
      if (hardIdx.has(i)) b = shape.killer + shift + rng.normal() * 0.35;
      out[i] = { pts: q.pts, mc: q.mc, b, a: shape.a * (0.8 + 0.4 * rng()) };
    }
    return out;
  }
  function sitPaper(theta, paper, rng, wrong) {
    let raw = 0;
    for (let i = 0; i < paper.length; i++) {
      const q = paper[i];
      if (rng() < itemCurve(theta, q.b, q.a, q.mc)) raw += q.pts;
      else if (wrong) wrong.push(i + 1);
    }
    return raw;
  }

  // The cohort for one paper. Cached because sim.js replays the same sittings across many bots.
  const cohortCache = new Map();
  function cohortFor(sub, popMean, shift, examKey) {
    const key = examKey + "|" + sub + "|" + popMean + "|" + shift;
    let c = cohortCache.get(key);
    if (c) return c;
    const info = SUBJECT_INFO[sub];
    const rng = makeRng(hashSeed(examKey, sub));
    const paper = makePaper(info.format, PAPER[info.format], shift, rng);
    const scores = new Int16Array(COHORT);
    let sum = 0, sum2 = 0;
    for (let k = 0; k < COHORT; k++) {
      const r = sitPaper(popMean + rng.normal(), paper, rng, null);
      scores[k] = r; sum += r; sum2 += r * r;
    }
    const mean = sum / COHORT;
    const sd = Math.sqrt(Math.max(1, sum2 / COHORT - mean * mean));
    const sorted = Array.from(scores).sort((x, y) => y - x);
    c = { paper, scores, sorted, mean, sd };
    if (cohortCache.size > 400) cohortCache.delete(cohortCache.keys().next().value);
    cohortCache.set(key, c);
    return c;
  }

  // Places the player in the cohort for one subject.
  function gradeSubject(sub, playerTheta, popMean, shift, examKey, kind) {
    const info = SUBJECT_INFO[sub];
    // The paper and cohort depend only on the seed and the sitting, never on the player's choices.
    const { paper, scores, sorted, mean, sd } = cohortFor(sub, popMean, shift, examKey);
    const prng = makeRng(hashSeed(examKey, sub, "player", playerTheta.toFixed(4)));
    const wrong = [];
    const raw = sitPaper(playerTheta, paper, prng, wrong);
    let below = 0, equal = 0, above = 0;
    for (let k = 0; k < COHORT; k++) {
      if (scores[k] < raw) below++; else if (scores[k] === raw) equal++; else above++;
    }
    const pct = Math.round((100 * (below + equal / 2)) / COHORT);
    const res = { raw, max: info.maxRaw, wrong, mean: Math.round(mean * 10) / 10 };
    if (kind === "absolute") {
      // English and Korean History: fixed raw-score bands, no standard score or percentile on the report.
      const band = sub === "eng" ? 10 : 5;
      const top = sub === "eng" ? 90 : 40;
      res.grade = raw >= top ? 1 : clamp(1 + Math.ceil((top - raw) / band), 1, 9);
      res.pct = pct;
      let g1 = 0; for (let k = 0; k < COHORT; k++) if (scores[k] >= top) g1++;
      res.grade1Share = g1 / COHORT;
    } else {
      const center = sub === "kor" || sub === "math" ? 100 : 50;
      const scale = center === 100 ? 20 : 10;
      res.std = Math.round(center + (scale * (raw - mean)) / sd);
      res.stdMax = Math.round(center + (scale * (info.maxRaw - mean)) / sd);
      res.pct = pct;
      // Grade: ties go to the better grade, as on the real report.
      const shareAbove = above / COHORT;
      let gr = 9;
      for (let i = 0; i < GRADE_CUTS.length; i++) if (shareAbove < GRADE_CUTS[i]) { gr = i + 1; break; }
      res.grade = gr;
      res.cut1 = sorted[Math.floor(GRADE_CUTS[0] * COHORT) - 1];
    }
    return res;
  }

  // ---------- events ----------
  // Each event: when(g) gates it, weight is its relative chance, and either run(g) applies it directly
  // or choices[] lists options whose run(g) returns the follow-up text.
  const EVENTS = [
    {
      id: "pcbang", weight: 3, when: (g) => g.status !== "academy",
      text: "Your friends are heading to the PC방 after class. \"Just one game,\" they say.",
      choices: [
        { label: "Go (it's never one game)", run: (g) => { bump(g, { stress: -12, motivation: -4 }); return "Six hours later you walk home at 2am, oddly refreshed and deeply guilty."; } },
        { label: "Say no and go to the 독서실", run: (g) => { bump(g, { stress: 4, motivation: 3 }); studyBoost(g, pickWeak(g), 0.03); return "You hear them laughing from the window. You solve twelve problems out of spite."; } },
      ],
    },
    {
      id: "cold", weight: 2, when: () => true,
      run: (g) => { bump(g, { health: -18, stress: 4 }); return "You caught a nasty cold. Three days of tissues and blurry 인강 videos."; },
    },
    {
      id: "flu", weight: 1, when: (g) => g.health < 45,
      run: (g) => { bump(g, { health: -25, stress: 6 }); g.lostBlocks += 2; return "Run down, you come down with the flu. You lose a week in bed (−2 blocks next month)."; },
    },
    {
      id: "star", weight: 2, when: (g) => g.money >= 300000,
      text: "A famous 일타 강사 (star lecturer) just opened a new course: \"The killer-question solving technique.\" ₩300,000.",
      choices: [
        { label: "Buy it (₩300,000)", run: (g) => { g.money -= 300000; studyBoost(g, "math", 0.06); bump(g, { motivation: 6 }); return "Half of it is jokes, but the other half genuinely changes how you see 4-point questions."; } },
        { label: "Pass", run: () => "You watch the free preview three times instead." },
      ],
    },
    {
      id: "nag", weight: 2, when: (g) => g.status !== "halfretake",
      text: "Your mother finds your phone screen time: 6 hours a day. \"엄친아 next door studies 14 hours!\"",
      choices: [
        { label: "Apologize and lock the phone in a timer box", run: (g) => { bump(g, { motivation: 6, stress: 3 }); return "The box clicks shut. You feel lighter, and also like a prisoner."; } },
        { label: "Argue back", run: (g) => { bump(g, { stress: 9, motivation: -3 }); return "Doors slam. Dinner is silent for three days."; } },
      ],
    },
    {
      id: "crush", weight: 1.5, when: (g) => g.age <= 21,
      text: "Someone from your 독서실 slips you a note and a canned coffee. 😳",
      choices: [
        { label: "Start dating", run: (g) => { bump(g, { stress: -15, motivation: g.rng() < 0.5 ? 8 : -8 }); return g.motivation > 55 ? "You quiz each other on vocabulary at the café. Weirdly productive." : "Long phone calls every night. Your 기출 workbook gathers dust."; } },
        { label: "Politely say \"after 수능\"", run: (g) => { bump(g, { motivation: 4, stress: 3 }); return "\"After 수능\" becomes your new favorite phrase."; } },
      ],
    },
    {
      id: "rival", weight: 1.5, when: () => true,
      run: (g) => { bump(g, { motivation: 8, stress: 5 }); return "Your rival posted their mock-exam grades on the class group chat: all 1s. You're fired up."; },
    },
    {
      id: "slump", weight: 1.5, when: (g) => g.stress > 60,
      text: "You stare at the same passage for an hour. Nothing goes in. Slump (슬럼프).",
      choices: [
        { label: "Take a weekend trip to the sea", run: (g) => { bump(g, { stress: -20, motivation: 5 }); g.money -= Math.min(g.money, 80000); return "Wind, waves and tteokbokki. You come back human again."; } },
        { label: "Push through", run: (g) => { bump(g, { stress: 8, health: -6 }); return g.rng() < 0.4 ? "It breaks after a week. You remember why you're doing this." : "It doesn't break. You're running on fumes."; } },
      ],
    },
    {
      id: "burnout", weight: 3, when: (g) => g.stress >= 85,
      run: (g) => { bump(g, { motivation: -15, health: -10, stress: -10 }); g.lostBlocks += 2; return "Burnout. You can't open a book for days (−2 blocks next month). Your body is telling you something."; },
    },
    {
      id: "notes", weight: 1.5, when: () => true,
      run: (g) => { const s = pickStrong(g); studyBoost(g, s, 0.03); return "A senior who got into 연세대 gave you their summary notes for " + subjectLabel(g, s) + ". Gold."; },
    },
    {
      id: "family-money", weight: 1, when: (g) => g.family !== "wealthy",
      run: (g) => { bump(g, { stress: 6 }); g.money = Math.max(0, g.money - 200000); return "Your father's shop had a bad month. You quietly cancel a workbook order (−₩200,000)."; },
    },
    {
      id: "grandma", weight: 1, when: () => true,
      run: (g) => { g.money += 200000; bump(g, { motivation: 5, stress: -4 }); return "Grandma presses an envelope into your hand: \"For books. Eat well.\" (+₩200,000)"; },
    },
    {
      id: "insomnia", weight: 1.2, when: (g) => g.stress > 55,
      run: (g) => { bump(g, { health: -10 }); return "You lie awake doing math in your head. Insomnia for a week."; },
    },
    {
      id: "festival", weight: 1, when: (g) => g.status === "hs3" && (g.month === 5 || g.month === 10),
      text: "It's the school festival. Your class is running a 떡볶이 stand.",
      choices: [
        { label: "Join in", run: (g) => { bump(g, { stress: -14, motivation: 4 }); return "Your class sells out by noon. Last festival of high school. Worth it."; } },
        { label: "Study in the empty classroom", run: (g) => { studyBoost(g, pickWeak(g), 0.025); bump(g, { stress: 4 }); return "The music drifts up the stairwell while you finish a practice set."; } },
      ],
    },
    {
      id: "d100", weight: 100, when: (g) => g.month === 8 && !g.flags["d100-" + g.attempt],
      run: (g) => { g.flags["d100-" + g.attempt] = 1; bump(g, { motivation: 10, stress: 6 }); return "D-100. The countdown banner goes up. Everyone suddenly gets very quiet."; },
    },
    {
      id: "retaker-doubt", weight: 2, when: (g) => g.attempt >= 2,
      text: "Your old classmates post freshman MT photos. You're in a 재수 dorm eating 삼각김밥.",
      choices: [
        { label: "Mute them and study", run: (g) => { bump(g, { motivation: 5, stress: 5 }); return "Next year, you tell yourself. Next year."; } },
        { label: "Scroll for an hour", run: (g) => { bump(g, { motivation: -8, stress: 6 }); return "Everyone looks so happy. You feel twenty years old and left behind."; } },
      ],
    },
    {
      id: "phone-broke", weight: 1, when: () => true,
      run: (g) => { bump(g, { motivation: 6 }); return "You dropped your phone in the toilet. Forced digital detox. Your focus is incredible."; },
    },
    {
      id: "mentor", weight: 1, when: (g) => g.status === "academy",
      run: (g) => { bump(g, { motivation: 8 }); return "The academy's head counselor sits you down with a planner. You leave with a schedule down to the minute."; },
    },
    {
      id: "campus", weight: 1.5, when: (g) => g.status === "halfretake",
      text: "Your university friends are planning a club trip. You're supposed to be secretly studying for 수능.",
      choices: [
        { label: "Go to the trip", run: (g) => { bump(g, { stress: -12, motivation: -6 }); return "It's fun. You wonder if you even need to retake."; } },
        { label: "Make an excuse and study", run: (g) => { studyBoost(g, pickWeak(g), 0.03); bump(g, { stress: 5 }); return "\"Family thing,\" you say. The library is empty and perfect."; } },
      ],
    },
    {
      id: "insight", weight: 1, when: (g) => g.motivation > 60,
      run: (g) => { const s = pickWeak(g); studyBoost(g, s, 0.04); return "Something clicks in " + subjectLabel(g, s) + ". Problems that looked impossible now look... fine."; },
    },
  ];

  function bump(g, d) {
    for (const k in d) g[k] = clamp(g[k] + d[k], 0, 100);
  }
  function pickWeak(g) {
    let best = SUBJECTS[0];
    for (const s of SUBJECTS) if (g.skills[s] < g.skills[best]) best = s;
    return best;
  }
  function pickStrong(g) {
    const pool = SUBJECTS.filter((s) => s !== "hist");
    return pool[Math.floor(g.rng() * pool.length)];
  }
  function studyBoost(g, s, amount) {
    g.skills[s] += amount * headroom(g.skills[s]) * 1.5;
  }
  function subjectLabel(g, s) {
    if (s === "inq1" || s === "inq2") return inquiryInfo(g.inq[s === "inq1" ? 0 : 1]).name;
    return SUBJECT_INFO[s].name;
  }
  function inquiryInfo(id) {
    return INQUIRY.soc.concat(INQUIRY.sci).find((x) => x.id === id);
  }

  // Diminishing returns: each step up the ladder costs more study than the one below it.
  function headroom(theta) {
    return Math.exp(-0.62 * Math.max(0, theta + 0.8));
  }

  // ---------- the game ----------
  class Game {
    constructor(opts) {
      opts = opts || {};
      const seed = opts.seed != null ? opts.seed | 0 : (Math.random() * 2 ** 31) | 0;
      this.seed = seed;
      this.rngState = seed;
      this.name = opts.name || "You";
      this.track = opts.track === "sci" ? "sci" : "soc";
      const pool = INQUIRY[this.track];
      this.inq = (opts.inq && opts.inq.length === 2 ? opts.inq : [pool[0].id, pool[1].id]).slice();
      this.family = FAMILIES[opts.family] ? opts.family : "middle";
      this.startYear = opts.startYear || 2026;
      this.year = this.startYear;
      this.month = 3;
      this.attempt = 1;
      this.age = 18;
      this.status = "hs3";
      this.method = "self";
      const talent = opts.talent || Game.rollTalent(seed, this.family);
      this.aptitude = Object.assign({}, talent.aptitude);
      this.skills = Object.assign({}, talent.skills);
      this.practice = 0.15;
      this.health = 75;
      this.stress = 30;
      this.motivation = 65;
      this.money = FAMILIES[this.family].start;
      this.lostBlocks = 0;
      this.turn = 0; // months played, for event cooldowns
      this.flags = {};
      this.log = [];
      this.history = []; // finished 수능 results
      this.mocks = []; // mock exam results
      this.trace = [{ t: this.t(), att: 1, skills: Object.assign({}, this.skills) }];
      this.queue = [];
      this.examMods = { shift: 0, notes: [] };
      this.enrolled = null; // university id kept while doing 반수
      this.ending = null;
      this.lastPlan = null;
      this.addLog("Born into a " + FAMILIES[this.family].name.replace(/ \(.*\)/, "").toLowerCase() + " family (" + FAMILIES[this.family].ko + "). March " + this.year + ": you start your last year of high school (고3). 수능 is in November.", "milestone");
    }

    // Starting talent: a general knack plus per-subject quirks. Aptitude multiplies study gains.
    static rollTalent(seed, family) {
      const r = makeRng(hashSeed(seed, "talent"));
      const general = r.normal() * 0.55;
      const prior = (FAMILIES[family] || FAMILIES.middle).prior;
      const skills = {}, aptitude = {};
      for (const s of SUBJECTS) {
        const quirk = r.normal() * 0.45;
        skills[s] = Math.round((general + quirk + prior - 0.1) * 100) / 100;
        aptitude[s] = Math.round(clamp(1 + general * 0.25 + r.normal() * 0.18, 0.6, 1.5) * 100) / 100;
      }
      skills.hist -= 0.3; // nobody studies 한국사 until they have to
      return { skills, aptitude };
    }

    get rng() {
      // A function bound to the saved integer state, so serialization is just JSON.
      const self = this;
      const f = () => { const o = nextRand(self.rngState); self.rngState = o[0]; return o[1]; };
      f.normal = () => { let u = 0; while (u === 0) u = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * f()); };
      return f;
    }

    t() { return this.year + "-" + String(this.month).padStart(2, "0"); }
    addLog(text, kind) { this.log.push({ t: this.t(), att: this.attempt, text, kind: kind || "" }); }

    attemptName(n) {
      n = n || this.attempt;
      return n === 1 ? "현역 (first try)" : n === 2 ? "재수 (2nd try)" : n === 3 ? "삼수 (3rd try)" : n === 4 ? "사수 (4th try)" : "N수 (try #" + n + ")";
    }
    blocks() { return Math.max(1, STATUSES[this.status].blocks(this.month) - this.lostBlocks); }
    allowance() {
      const a = FAMILIES[this.family].allowance;
      return this.attempt >= 4 ? Math.round(a / 2) : a;
    }
    methodFixed() { return STATUSES[this.status].method || null; }
    // Parents pay the academy directly unless money is tight; then only a scholarship gets you in.
    monthlyFee() { return this.status === "academy" && this.family === "tight" && !this.scholarship ? STATUSES.academy.fee : 0; }
    // Retake options after the latest 수능, with the reason any of them is closed.
    retakeOptions(score) {
      const out = [];
      for (const id of ["academy", "selfstudy", "halfretake"]) {
        const st = STATUSES[id];
        let blocked = null;
        if (id === "academy" && this.family === "tight" && score < 85) blocked = "₩2.9M a month is out of reach. Academies waive the fee for strong scores (85+ admission score).";
        out.push({ id, name: st.name, ko: st.ko, blocked, scholarship: id === "academy" && this.family === "tight" && score >= 85 });
      }
      return out;
    }
    planCost(plan, method) {
      method = this.methodFixed() || method || this.method;
      let studyBlocks = 0;
      for (const a of ACTIVITIES) if (a.kind === "study") studyBlocks += plan[a.id] || 0;
      return this.monthlyFee() + (this.methodFixed() ? 0 : studyBlocks * METHODS[method].cost);
    }
    daysToExam() {
      // 수능 is the third Thursday of November, roughly the 15th.
      const now = new Date(Date.UTC(this.year, this.month - 1, 1));
      const exam = new Date(Date.UTC(this.year, 10, 15));
      return Math.round((exam - now) / 86400000);
    }

    // Plan: { activityId: blocks }, method: study method id.
    validate(plan, method) {
      let total = 0;
      for (const a of ACTIVITIES) {
        const n = plan[a.id] || 0;
        if (n < 0 || n !== Math.floor(n)) return "Bad block count.";
        total += n;
      }
      if (total !== this.blocks()) return "Use exactly " + this.blocks() + " blocks.";
      if (!this.methodFixed() && !METHODS[method]) return "Pick a study method.";
      const income = (plan.job || 0) * 250000;
      if (this.planCost(plan, method) > this.money + this.allowance() + income) return "Not enough money for this plan.";
      return null;
    }

    advance(plan, method) {
      if (this.queue.length || this.ending) throw new Error("Resolve the current screen first.");
      method = this.methodFixed() || method || this.method;
      const err = this.validate(plan, method);
      if (err) throw new Error(err);
      this.method = this.methodFixed() ? this.method : method;
      this.lastPlan = Object.assign({}, plan);
      this.lostBlocks = 0;
      this.turn += 1;
      const rng = this.rng;
      const before = Object.assign({}, this.skills);

      // Money in, money out.
      this.money += this.allowance() + (plan.job || 0) * 250000;
      this.money -= this.planCost(plan, method);

      // Study. Gains shrink with low motivation, poor health or very high stress, and repeated blocks
      // on one subject in the same month give a bit less each time.
      const m = METHODS[method];
      const motFactor = Math.pow(0.35 + 0.65 * (this.motivation / 100), m.sens);
      const healthFactor = this.health < 40 ? 0.7 + 0.3 * (this.health / 40) : 1;
      const stressFactor = this.stress > 75 ? 1 - (this.stress - 75) / 60 : 1;
      const eff = motFactor * healthFactor * stressFactor;
      let studied = 0;
      for (const s of SUBJECTS) {
        const n = plan[s] || 0;
        studied += n;
        if (!n) {
          // Untouched subjects fade a little; retakers feel it most because they have a year to forget in.
          if (this.skills[s] > -1.5) this.skills[s] -= 0.012;
          continue;
        }
        let g = 0;
        for (let k = 0; k < n; k++) g += 1 / (1 + 0.3 * k);
        const rate = 0.24 * SUBJECT_INFO[s].rate * this.aptitude[s] * m.mult * eff;
        this.skills[s] += g * rate * headroom(this.skills[s]) * (0.85 + 0.3 * rng());
      }
      const mock = plan.mock || 0;
      if (mock) {
        this.practice = clamp(this.practice + 0.09 * mock * (1 - this.practice), 0, 1);
        for (const s of SUBJECTS) this.skills[s] += 0.008 * mock * headroom(this.skills[s]);
      }

      // Condition. Study is stressful; the pressure rises as November gets closer.
      const pressure = this.month >= 9 ? 4 + (this.month - 9) * 2 : 2;
      // Stress and health also recover on their own toward a baseline, so a steady workload settles
      // at a level instead of spiralling; heavy months push the level up.
      const d = {
        stress: pressure + studied * 1.6 + mock * 3 + (25 - this.stress) * 0.25,
        health: -1 - studied * 0.6 + (72 - this.health) * 0.15,
        motivation: 0,
      };
      d.stress -= (plan.rest || 0) * 9 + (plan.exercise || 0) * 6 + (plan.friends || 0) * 14 + (plan.games || 0) * 10;
      d.health += (plan.rest || 0) * 7 + (plan.exercise || 0) * 11 - (plan.job || 0) * 4;
      d.stress += (plan.job || 0) * 5;
      d.motivation += (plan.friends || 0) * 3 - (plan.games || 0) * 4;
      // Motivation drifts back toward a baseline that sags with every extra year.
      const base = 66 - (this.attempt - 1) * 6 + (this.status === "academy" ? 6 : 0);
      d.motivation += (base - this.motivation) * 0.2 - (this.stress > 70 ? 4 : 0);
      bump(this, d);

      // Summarize the month.
      const parts = [];
      for (const s of SUBJECTS) {
        const dd = this.skills[s] - before[s];
        if (Math.abs(dd) >= 0.004) parts.push(subjectLabel(this, s) + " " + (dd > 0 ? "+" : "") + (dd * 16.67).toFixed(1));
      }
      const cost = this.planCost(plan, method);
      this.addLog(MONTHS[this.month] + ": " + describePlan(plan) + (cost ? " · spent ₩" + cost.toLocaleString("en-US") : "") + (parts.length ? " · " + parts.join(", ") : ""), "month");

      // Events: usually one per month, sometimes none, sometimes two when life piles up.
      const roll = rng();
      const n = roll < 0.2 ? 0 : roll < 0.88 ? 1 : 2;
      const seen = new Set();
      for (let i = 0; i < n; i++) this.rollEvent(seen);
      // D-100 always fires in August.
      const d100 = EVENTS.find((e) => e.id === "d100");
      if (d100.when(this) && !seen.has("d100")) this.fireEvent(d100);
      if ((plan.friends || 0) > 0 && rng() < 0.35 && !seen.has("pcbang") && this.turn - (this.flags["ev-pcbang"] || -99) >= 4) this.fireEvent(EVENTS.find((e) => e.id === "pcbang"));

      // Scheduled exams.
      if (MOCKS[this.month] && !(this.month === 3 && this.status !== "hs3")) this.queue.push({ type: "mock" });
      if (this.month === 11) {
        this.queue.push(this.examEveEvent());
        this.queue.push(this.lunchEvent());
        this.queue.push({ type: "exam" });
      } else {
        this.queue.push({ type: "nextMonth" });
      }
      this.trace.push({ t: this.t(), att: this.attempt, skills: Object.assign({}, this.skills) });
      this.flush();
    }

    rollEvent(seen) {
      // An event that just happened waits at least four months before it can happen again.
      const pool = EVENTS.filter((e) => !seen.has(e.id) && e.id !== "d100" && e.when(this) && !(this.turn - (this.flags["ev-" + e.id] || -99) < 4));
      let total = 0;
      for (const e of pool) total += e.weight;
      let r = this.rng() * total;
      for (const e of pool) {
        r -= e.weight;
        if (r <= 0) { seen.add(e.id); this.fireEvent(e); return; }
      }
    }
    fireEvent(e) {
      this.flags["ev-" + e.id] = this.turn;
      if (e.choices) {
        this.queue.push({ type: "event", id: e.id, text: e.text, choices: e.choices.map((c) => c.label) });
      } else {
        const text = e.run(this);
        this.queue.push({ type: "event", id: e.id, text, choices: null });
      }
    }

    examEveEvent() {
      return {
        type: "event", id: "eve", title: "The night before 수능",
        text: "Your bag is packed: admission ticket, ID, black computer-pen, analog watch. It's 9pm.",
        choices: ["Sleep at 10pm sharp", "Review your summary notes until 1am", "Lie in bed and watch one more 기출 explanation video"],
      };
    }
    lunchEvent() {
      return {
        type: "event", id: "lunch", title: "수능 morning",
        text: "Your mom hands you a lunch box (수능 도시락). What's inside?",
        choices: ["Warm 죽 (rice porridge): gentle on the stomach", "A big 돈가스 feast for energy", "Nothing. You'll be too nervous to eat"],
      };
    }

    // Answers queue[0] when it's an event. Returns the follow-up text.
    choose(i) {
      const top = this.queue[0];
      if (!top || top.type !== "event") throw new Error("No event to answer.");
      let text = "";
      if (top.choices) {
        if (top.id === "eve") text = this.resolveEve(i);
        else if (top.id === "lunch") text = this.resolveLunch(i);
        else {
          const ev = EVENTS.find((e) => e.id === top.id);
          const c = ev.choices[clamp(i | 0, 0, ev.choices.length - 1)];
          text = c.run(this);
          this.addLog(ev.text + " → " + c.label + ". " + text, "event");
        }
      } else {
        this.addLog(top.text, "event");
      }
      this.queue.shift();
      this.flush();
      return text;
    }
    resolveEve(i) {
      const r = this.rng();
      let text;
      if (i === 0) {
        if (r < 0.25 + this.stress / 300) { this.examMods.shift -= 0.12; text = "You stare at the ceiling until 3am anyway. Nerves."; }
        else { this.examMods.shift += 0.06; text = "You actually fall asleep. A small miracle."; }
      } else if (i === 1) {
        this.examMods.shift -= 0.06;
        if (r < 0.3) { this.examMods.shift += 0.1; text = "One of the things you reviewed comes up tomorrow. Lucky."; }
        else text = "You go to bed wired and wake up foggy.";
      } else {
        this.examMods.shift -= 0.1;
        text = "One video becomes six. Your alarm feels like a crime.";
      }
      this.addLog("The night before 수능: " + text, "event");
      return text;
    }
    resolveLunch(i) {
      const r = this.rng();
      let text;
      if (i === 0) { this.examMods.lunch = 0.04; text = "Light and warm. You'll stay alert through the afternoon."; }
      else if (i === 1) {
        if (r < 0.45) { this.examMods.lunch = -0.15; text = "A heavy lunch before English listening... your eyelids get very heavy."; }
        else { this.examMods.lunch = 0.05; text = "Fuel! You feel great."; }
      } else { this.examMods.lunch = -0.1; text = "By 4th period your stomach is growling louder than the proctor."; }
      this.addLog("수능 lunch: " + text, "event");
      return text;
    }

    // Moves past informational screens the engine handles itself (exams, month rollover).
    flush() {
      while (this.queue.length) {
        const top = this.queue[0];
        if (top.type === "mock" && !top.result) {
          top.result = this.sitExam("mock");
          this.mocks.push(top.result);
          this.practice = clamp(this.practice + 0.03, 0, 1);
          this.addLog(MOCKS[this.month] + ": " + gradesLine(top.result), "mock");
          return;
        }
        if (top.type === "exam" && !top.result) {
          top.result = this.sitExam("suneung");
          this.history.push(top.result);
          this.addLog(this.year + 1 + "학년도 수능: " + gradesLine(top.result) + " · 국수탐 standard total " + top.result.total, "milestone");
          return;
        }
        if (top.type === "nextMonth") {
          this.queue.shift();
          this.month += 1;
          continue;
        }
        return;
      }
    }
    // Dismisses an informational screen (mock report, exam report, offers).
    dismiss() {
      const top = this.queue[0];
      if (!top) return;
      if (top.type === "event" && top.choices) throw new Error("This event needs a choice.");
      if (top.type === "event") return this.choose(0);
      this.queue.shift();
      if (top.type === "exam") {
        this.month = 12;
        this.queue.push({ type: "apply", score: admissionScore(top.result), result: top.result });
      }
      this.flush();
    }

    // Exam day condition: stress and illness push ability down, practice exams steady the noise.
    sitExam(kind) {
      const real = kind === "suneung";
      const rng = this.rng;
      const stressHit = this.stress > 65 ? -0.25 * (this.stress - 65) / 35 : 0;
      const healthHit = this.health < 45 ? -0.25 * (45 - this.health) / 45 : 0;
      const nerves = real ? -0.08 * (1 - this.practice) : 0;
      const sigma = 0.32 - 0.22 * this.practice;
      const dayForm = rng.normal() * sigma * 0.6 + (real ? this.examMods.shift : 0);
      const examKey = hashSeed(this.seed, this.year, kind, this.month);
      const diffRng = makeRng(hashSeed(examKey, "difficulty"));
      const subjects = {};
      const shifts = {};
      for (const s of SUBJECTS) {
        // Each paper's difficulty swings year to year: 불수능 (fire) vs 물수능 (water).
        const shift = diffRng.normal() * 0.28;
        shifts[s] = shift;
        let theta = this.skills[s] + stressHit + healthHit + nerves + dayForm + rng.normal() * sigma * 0.8;
        if (real && (s === "eng" || s === "hist" || s === "inq1" || s === "inq2")) theta += this.examMods.lunch || 0;
        const pop = s === "inq1" || s === "inq2" ? inquiryInfo(this.inq[s === "inq1" ? 0 : 1]).pop : 0;
        const kindG = s === "eng" || s === "hist" ? "absolute" : "relative";
        subjects[s] = gradeSubject(s, theta, pop, shift, examKey, kindG);
      }
      if (real) this.examMods = { shift: 0, notes: [] };
      const total = subjects.kor.std + subjects.math.std + subjects.inq1.std + subjects.inq2.std;
      return {
        kind, year: this.year, month: this.month, attempt: this.attempt, age: this.age,
        subjects, shifts, total,
        headline: real ? headline(shifts) : null,
      };
    }

    // Admission chances for the latest 수능.
    options() {
      const top = this.queue[0];
      if (!top || top.type !== "apply") return [];
      return UNIVERSITIES.map((u) => {
        const p = admitChance(top.score, u, this.track);
        return { id: u.id, name: u.name, ko: u.ko, p, label: chanceLabel(p), blocked: u.sci && this.track !== "sci" };
      });
    }
    // Apply to up to three schools (가/나/다군). Returns the offers.
    apply(ids) {
      const top = this.queue[0];
      if (!top || top.type !== "apply") throw new Error("Not application season.");
      ids = Array.from(new Set(ids)).slice(0, 3);
      const results = ids.map((id) => {
        const u = UNI_BY_ID[id];
        const p = admitChance(top.score, u, this.track);
        return { id, name: u.name, ko: u.ko, p, admitted: this.rng() < p };
      });
      this.queue.shift();
      const offers = results.filter((r) => r.admitted).map((r) => r.id);
      this.addLog("정시 applications: " + results.map((r) => r.ko + " " + (r.admitted ? "합격 ✓" : "불합격 ✗")).join(", "), "milestone");
      this.queue.push({ type: "offers", results, offers, score: top.score });
      return results;
    }

    // After offers: enroll, retake, or quit.
    // d = { action: "enroll" | "academy" | "selfstudy" | "halfretake" | "quit", uni? }
    decide(d) {
      const top = this.queue[0];
      if (!top || top.type !== "offers") throw new Error("Nothing to decide.");
      const offers = top.offers.slice();
      if (this.enrolled && offers.indexOf(this.enrolled) < 0) offers.push(this.enrolled);
      if ((d.action === "enroll" || d.action === "halfretake") && offers.indexOf(d.uni) < 0) throw new Error("No offer from that school.");
      this.queue.shift();
      if (d.action === "enroll" || d.action === "quit") {
        const uni = d.action === "enroll" ? UNI_BY_ID[d.uni] : null;
        this.ending = { uni: uni && uni.id, attempts: this.attempt, age: this.age + 1, best: this.bestResult() };
        this.month = 3;
        this.year += 1;
        this.addLog(uni ? "March " + this.year + ": you enroll at " + uni.name + " (" + uni.ko + "). Exam life is over." : "You close the workbooks for good.", "milestone");
        return;
      }
      if (!STATUSES[d.action]) throw new Error("Unknown action.");
      const ro = this.retakeOptions(top.score).find((o) => o.id === d.action);
      if (ro.blocked) throw new Error(ro.blocked);
      this.scholarship = !!ro.scholarship;
      this.enrolled = d.action === "halfretake" ? d.uni : this.enrolled;
      this.status = d.action;
      this.attempt += 1;
      this.age += 1;
      this.year += 1;
      this.month = 3;
      this.motivation = clamp(this.motivation + 10, 0, 100);
      this.stress = clamp(this.stress - 15, 0, 100);
      this.health = clamp(this.health + 15, 0, 100);
      if (this.attempt === 4) this.addLog("Your parents sit you down: from now on, they can only pay half.", "event");
      const msg = {
        academy: "You sign up for a 재수종합학원: 7am to 10pm, phones collected at the door." + (this.scholarship ? " Your score earned a full scholarship." : this.family === "tight" ? "" : " Your parents pay the ₩2.9M a month."),
        selfstudy: "You rent a desk at a 독서실 and plan the year yourself.",
        halfretake: "You start university at " + (UNI_BY_ID[this.enrolled] || {}).name + ", but secretly keep studying for 수능 (반수).",
      }[d.action];
      this.addLog("March " + this.year + ": " + this.attemptName() + ". " + msg, "milestone");
      this.trace.push({ t: this.t(), att: this.attempt, skills: Object.assign({}, this.skills) });
    }

    bestResult() {
      let best = null;
      for (const r of this.history) if (!best || r.total > best.total) best = r;
      return best;
    }

    toJSON() {
      const o = {};
      for (const k of Object.keys(this)) o[k] = this[k];
      return o;
    }
    static fromJSON(o) {
      const g = Object.create(Game.prototype);
      Object.assign(g, o);
      return g;
    }
  }

  function describePlan(plan) {
    const parts = [];
    for (const a of ACTIVITIES) if (plan[a.id]) parts.push(a.ko + (plan[a.id] > 1 ? "×" + plan[a.id] : ""));
    return parts.join(" ");
  }
  function gradesLine(res) {
    const s = res.subjects;
    return "국 " + s.kor.grade + " · 수 " + s.math.grade + " · 영 " + s.eng.grade + " · 한 " + s.hist.grade + " · 탐 " + s.inq1.grade + "/" + s.inq2.grade;
  }
  function headline(shifts) {
    let hardest = "kor", easiest = "kor";
    for (const s of ["kor", "math", "eng"]) {
      if (shifts[s] > shifts[hardest]) hardest = s;
      if (shifts[s] < shifts[easiest]) easiest = s;
    }
    const n = SUBJECT_INFO;
    if (shifts[hardest] > 0.3) return "\"불수능\": " + n[hardest].ko + " (" + n[hardest].name + ") was brutal this year.";
    if (shifts[easiest] < -0.3) return "\"물수능\": " + n[easiest].ko + " (" + n[easiest].name + ") was unusually easy. One mistake could cost a grade.";
    return "A normal-difficulty 수능, with a few killer questions in every section.";
  }

  const api = {
    Game, ACTIVITIES, METHODS, STATUSES, FAMILIES, SUBJECTS, SUBJECT_INFO, INQUIRY, UNIVERSITIES, MONTHS, MOCKS,
    inquiryInfo, subjectLabel, admissionScore, admitChance, chanceLabel, gradeSubject, gradesLine, makeRng, hashSeed,
    skillScore: (theta) => clamp(Math.round(50 + theta * 16.67), 0, 100),
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Suneung = api;
})(typeof window !== "undefined" ? window : globalThis);
