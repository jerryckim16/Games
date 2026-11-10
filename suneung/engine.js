// Suneung Simulator engine. No DOM access, so it runs in the browser or in Node (see sim.js).
//
// A life runs from birth (age 0, counted the international way: 만 나이; early years are a year a turn) to the 수능 and any retakes. School
// years move in big turns (a year, then semesters, then seasons); grade 12 and retake years are
// played month by month. The game is a queue of screens. The app calls advance(plan) once per turn; the
// engine applies the plan, rolls events and exams, and pushes anything the player must see or decide
// onto `g.queue`. The app shows queue[0] and answers it with choose(i), apply(ids) or decide(d).
// When the queue is empty the player plans the next turn.
//
// The engine holds no display text. Log entries, events and outcomes carry message keys plus values
// ({ key, p }), and the app renders them through strings.js in the player's language. That way a
// player can switch language mid-game and the whole life log follows.
(function (root) {
  "use strict";
  // Real places and schools (places.js, generated from the national school list). Optional: without it
  // the game plays the same, just without real school names.
  const REAL = typeof module !== "undefined" && module.exports ? (() => { try { return require("./places.js"); } catch (e) { return null; } })() : root.SuneungPlaces || null;

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
      { id: "ethics", pop: -0.15 },
      { id: "society", pop: -0.1 },
      { id: "ideas", pop: 0.05 },
      { id: "kgeo", pop: 0 },
      { id: "wgeo", pop: 0 },
      { id: "eahist", pop: 0.05 },
      { id: "whist", pop: 0.05 },
      { id: "law", pop: 0.1 },
      { id: "econ", pop: 0.25 },
    ],
    sci: [
      { id: "phys", pop: 0.35 },
      { id: "chem", pop: 0.3 },
      { id: "bio", pop: 0.05 },
      { id: "earth", pop: -0.15 },
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
    eng: { base: 0.24, spread: 1.0, killer: 2.0, killers: 3, a: 1.3 },
    hist: { base: -0.6, spread: 0.9, killer: 1.0, killers: 2, a: 1.2 },
    // Inquiry killers sit high enough that only about 0.5–2% of a pool scores 50/50, as in real years.
    // With softer killers 3–9% of a strong pool tied at a perfect score, so a flawless paper was worth
    // only the 91st–98th percentile and a perfect exam could fall short of the top cuts.
    inq: { base: -0.65, spread: 1.0, killer: 2.3, killers: 3, a: 1.4 },
  };

  const SUBJECTS = ["kor", "math", "eng", "hist", "inq1", "inq2"];
  // rate: how fast study moves θ. History is a small, memorizable syllabus; Korean reading is slow to build.
  const SUBJECT_INFO = {
    kor: { format: "kor", rate: 0.8, maxRaw: 100 },
    math: { format: "math", rate: 1.0, maxRaw: 100 },
    eng: { format: "eng", rate: 0.95, maxRaw: 100 },
    hist: { format: "hist", rate: 1.6, maxRaw: 50 },
    inq1: { format: "inq", rate: 1.3, maxRaw: 50 },
    inq2: { format: "inq", rate: 1.3, maxRaw: 50 },
  };

  const GRADE_CUTS = [0.04, 0.11, 0.23, 0.40, 0.60, 0.77, 0.89, 0.96]; // cumulative share from the top

  // ---------- activities, study methods, life stages, families ----------
  // Study activities exist for all six subject slots. Before the track choice (end of grade 10),
  // inq1 is social studies and inq2 is science; the track choice turns them into the two inquiry subjects.
  // from/to: the school grades (1–12, retakes count as 12) when an activity is on offer.
  const ACTIVITIES = [
    { id: "kor", kind: "study", subject: "kor" },
    { id: "math", kind: "study", subject: "math" },
    { id: "eng", kind: "study", subject: "eng" },
    { id: "hist", kind: "study", subject: "hist" },
    { id: "inq1", kind: "study", subject: "inq1" },
    { id: "inq2", kind: "study", subject: "inq2" },
    { id: "reading", kind: "life", to: 11 },
    { id: "arts", kind: "life", to: 9, cost: 150000 },
    { id: "mock", kind: "life", from: 10 },
    { id: "rest", kind: "life", alsoEarly: true },
    { id: "exercise", kind: "life", alsoEarly: true },
    { id: "friends", kind: "life", alsoEarly: true },
    { id: "games", kind: "life", alsoEarly: true },
    // Early childhood (ages 0–5): learning through play. Rest, exercise, friends and games are offered
    // too, as naps, the playground, playdates and cartoons.
    { id: "books", kind: "play", early: true },
    { id: "blocks", kind: "play", early: true },
    { id: "songs", kind: "play", early: true },
    { id: "worksheet", kind: "play", early: true, fromAge: 4, cost: 40000 },
    { id: "job", kind: "life", from: 10 },
    // The school record (v6.0): offered while it's open, High 1 to August of High 3 (recordOpen).
    // prep: studying for your school's midterm or final (내신 대비). club: your 동아리. volunteer:
    // school volunteering. project: a 진로 research project or report in the field you want to study.
    { id: "prep", kind: "life", hs: true },
    { id: "club", kind: "life", hs: true },
    { id: "volunteer", kind: "life", hs: true },
    { id: "project", kind: "life", hs: true },
  ];
  const JOB_PAY = 250000; // won per block per month
  // mult: study speed. sens: how much the gain depends on motivation (a tutor keeps you on task,
  // online lectures do not). cost: won per block of study per month.
  const METHODS = {
    self: { mult: 1.0, sens: 1.0, cost: 0 },
    online: { mult: 1.25, sens: 1.15, cost: 25000 },
    hagwon: { mult: 1.45, sens: 0.6, cost: 120000 },
    tutor: { mult: 1.75, sens: 0.4, cost: 250000 },
  };
  // Life stages. months: how long one turn lasts. blocks(month): free blocks of time in that turn.
  // School years before grade 12 move in big steps (a year, a semester, a season); grade 12 and every
  // retake year are played month by month, and 수능 month only has half a month.
  const STATUSES = {
    // Birth to age 5: a year a turn, three blocks, and the parents choose (you're the one growing up).
    early: { months: 12, blocks: () => 3, school: true, early: true },
    elem: { months: 12, blocks: () => 4, school: true },
    mid: { months: 6, blocks: () => 4, school: true },
    high: { months: 3, blocks: (m) => (m === 6 || m === 12 ? 5 : 4), school: true },
    hs3: { months: 1, blocks: (m) => (m === 7 || m === 8 ? 6 : m === 11 ? 2 : 4) },
    academy: { months: 1, blocks: (m) => (m === 11 ? 3 : 6), fee: 2900000, method: "hagwon" },
    selfstudy: { months: 1, blocks: (m) => (m === 11 ? 3 : 6) },
    halfretake: { months: 1, blocks: (m) => (m <= 6 ? 2 : m === 11 ? 3 : 6) },
  };
  const statusForGrade = (grade) => (grade <= 6 ? "elem" : grade <= 9 ? "mid" : grade <= 11 ? "high" : "hs3");

  // Families are the five national household-income quintiles, so each is 20% of births.
  // income: average household income, ₩10,000 a month (2024 household finance survey: top fifth
  // ₩166M a year, all households ₩71.85M; the middle quintiles are interpolated).
  // allowance: what the parents spend on your education each month. The 2024 private-education survey
  // gives ₩205,000 per student in households under ₩3M a month and ₩676,000 at ₩8M and above; the top
  // fifth earns well above that bracket, so its figure is extrapolated.
  // prior: a small head start at age 6 from books at home and parents' schooling.
  // paysAcademy: whether the parents can pay ₩2.9M a month for a retake academy.
  const FAMILIES = {
    q1: { income: 125, allowance: 205000, prior: -0.1, paysAcademy: false },
    q2: { income: 300, allowance: 320000, prior: -0.05, paysAcademy: false },
    q3: { income: 490, allowance: 470000, prior: 0, paysAcademy: true },
    q4: { income: 770, allowance: 570000, prior: 0.05, paysAcademy: true },
    q5: { income: 1380, allowance: 676000, prior: 0.1, paysAcademy: true },
  };
  const FAMILY_IDS = ["q1", "q2", "q3", "q4", "q5"];

  // ---------- regions ----------
  // Where you live. The kind sets how good and how dear cram schools and tutors are (multipliers on a
  // method's speed and price; rural counties have no private tutors to hire), the pressure around you,
  // and whether you count as outside the capital region for the quotas below.
  const REGION_KINDS = {
    gangnam: { hagwon: 1.15, tutor: 1.1, price: 1.4, stress: 2, motivation: 3, health: 0 },
    // Seoul's other academy streets (Mokdong, Junggye-dong): a step below Daechi-dong.
    seoulAcad: { hagwon: 1.1, tutor: 1.07, price: 1.25, stress: 1.5, motivation: 2, health: 0 },
    seoul: { hagwon: 1.05, tutor: 1.05, price: 1.15, stress: 1, motivation: 1, health: 0 },
    capital: { hagwon: 1, tutor: 1, price: 1, stress: 0, motivation: 0, health: 0 },
    metro: { hagwon: 0.97, tutor: 0.97, price: 0.95, stress: 0, motivation: 0, health: 0 },
    city: { hagwon: 0.9, tutor: 0.9, price: 0.85, stress: -1, motivation: 0, health: 0 },
    rural: { hagwon: 0.75, tutor: 0, price: 0.7, stress: -2, motivation: -1, health: 1 },
  };
  // pop: share of Korea's 2024 registered population (%), the chance of being born there. Each place
  // stands for a group, so the seventeen add up to the whole country: Gangnam = the three Gangnam
  // districts (강남·서초·송파); the rest of Seoul is five areas: Nowon = the northeast (노원·도봉·강북·
  // 성북·중랑·동대문), Mokdong = the southwest (양천·강서·구로), Mapo = the northwest and centre (마포·
  // 서대문·은평·종로·중구·용산), Gwanak = the south (관악·동작·금천·영등포), Gangdong = the east (강동·광진·
  // 성동). Suwon = Gyeonggi and Incheon, Busan = Busan and Ulsan, Daejeon = Daejeon and Sejong,
  // Pohang / Jeonju / Cheongju = the provincial cities of Gyeongsang / Jeolla / Chungcheong and
  // Gangwon, Jeju = Jeju, Pyeongchang / Haenam = the rural counties.
  // view: what the windows show.
  // need: the family income fifth it takes to move there (housing). nat: the regional national
  // university whose local quota you can use.
  const REGIONS = [
    { id: "gangnam", kind: "gangnam", capital: true, pop: 3.2, need: 4 },
    { id: "nowon", kind: "seoulAcad", capital: true, pop: 4.4, need: 3 },
    { id: "mokdong", kind: "seoulAcad", capital: true, pop: 2.7, need: 4 },
    { id: "mapo", kind: "seoul", capital: true, pop: 3.1, need: 3 },
    { id: "gwanak", kind: "seoul", capital: true, pop: 2.9, need: 2 },
    { id: "gangdong", kind: "seoul", capital: true, pop: 2.0, need: 3 },
    { id: "suwon", kind: "capital", capital: true, pop: 32.6 },
    { id: "busan", kind: "metro", pop: 8.5, view: "sea", nat: "pnu" },
    { id: "daegu", kind: "metro", pop: 4.6, nat: "knu" },
    { id: "gwangju", kind: "metro", pop: 2.7, nat: "jnu" },
    { id: "daejeon", kind: "metro", pop: 3.6, nat: "cnu" },
    { id: "pohang", kind: "city", pop: 8.2, view: "sea", nat: "knu" },
    { id: "jeonju", kind: "city", pop: 4.3 },
    { id: "cheongju", kind: "city", pop: 7.3 },
    { id: "jeju", kind: "city", pop: 1.3, view: "sea" },
    { id: "pyeongchang", kind: "rural", pop: 6.1, view: "country" },
    { id: "haenam", kind: "rural", pop: 2.5, view: "sea", nat: "jnu" },
  ];
  const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

  // ---------- schools ----------
  // Which school you go to, picked on a screen at the start of elementary, middle and high school.
  // The first school of each stage is the public school you're assigned by default; picking it never
  // rolls anything, so a life that always takes it plays exactly as before schools existed.
  // fee: what the parents pay a month, taken out of their education budget (so it competes with cram
  // school), and you can only pick a school whose fee the budget covers. Ordinary middle and high
  // schools charge the same whether public or private (평준화), so only the special ones have fees.
  // lessons: multipliers on the school-lesson gain, per subject or for all. stress / motivation: added
  // each turn and to the motivation baseline. admit(g): the chance of getting in (lottery or selection).
  // track: the only track that school teaches (science and foreign-language high schools).
  // blocks: free blocks a turn the school takes (workshop hours, practice rooms).
  // where: region kinds that have one (private elementary schools are a big-city thing).
  // board: boarding or commuter schools you keep when the family moves; others are swapped for the
  // local public school.
  const SCHOOLS = [
    // Kindergarten from age 3. Most children go to daycare or kindergarten, free under the national
    // 누리과정; some stay home with family, some go to a forest kindergarten, and big-city families
    // with money pay for an English kindergarten (영어유치원).
    { id: "kinder", stage: "kinder", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    { id: "homeCare", stage: "kinder", fee: 0, lessons: { all: 0.3 }, stress: -2, motivation: 0, admit: () => 1 },
    { id: "forest", stage: "kinder", fee: 150000, lessons: { all: 0.8 }, stress: -3, motivation: 2, health: 3, admit: () => 0.6 },
    { id: "engKinder", stage: "kinder", fee: 1545000, fromIncome: true, lessons: { all: 1.05, eng: 3 }, stress: 2, motivation: 0, admit: () => 1, where: ["gangnam", "seoulAcad", "seoul", "capital", "metro"] },
    { id: "pubElem", stage: "elem", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    // 사립초: ₩10M a year or so, small classes and English immersion, by lottery (about 2 applicants a seat).
    { id: "privElem", stage: "elem", fee: 800000, fromIncome: true, lessons: { all: 1.15, eng: 1.5 }, stress: 1, motivation: 2, admit: () => 0.5, where: ["gangnam", "seoulAcad", "seoul", "capital", "metro"] },
    { id: "pubMid", stage: "mid", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    // Private middle schools are assigned by the same lottery; you can list a preference.
    { id: "privMid", stage: "mid", fee: 0, lessons: { all: 1.08 }, stress: 1, motivation: 1, admit: () => 0.6 },
    // 국제중: document screening, then a lottery among those who pass.
    { id: "intlMid", stage: "mid", fee: 700000, fromIncome: true, lessons: { all: 1.1, eng: 1.6 }, stress: 3, motivation: 3, board: true, admit: (g) => (zOf(g, ["kor", "math", "eng"]) > 0.6 ? 0.3 : 0) },
    { id: "pubHigh", stage: "high", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    { id: "privHigh", stage: "high", fee: 0, lessons: { all: 1.08 }, stress: 1, motivation: 1, admit: () => 0.6 },
    // 자사고: selection on middle-school grades and an interview; a Suneung-minded curriculum.
    { id: "autoHigh", stage: "high", fee: 550000, lessons: { all: 1.1, kor: 1.25, math: 1.25, eng: 1.25 }, stress: 3, motivation: 3, board: true, admit: (g) => clamp((zOf(g, ["kor", "math", "eng", "inq1", "inq2"]) - 0.3) * 0.6, 0, 0.85) },
    // 과학고·영재학교: math and science well ahead of your year; sciences only, and intense.
    { id: "sciHigh", stage: "high", fee: 150000, lessons: { math: 1.6, inq2: 1.6, kor: 0.9 }, stress: 5, motivation: 3, track: "sci", board: true, admit: (g) => clamp((zOf(g, ["math", "inq2"]) - 0.9) * 0.7, 0, 0.7) },
    // 외고·국제고: English first; humanities only.
    { id: "langHigh", stage: "high", fee: 500000, lessons: { eng: 1.6, kor: 1.25, inq1: 1.15, math: 0.95 }, stress: 3, motivation: 2, track: "soc", board: true, admit: (g) => clamp((zOf(g, ["eng", "kor"]) - 0.8) * 0.6, 0, 0.75) },
    // 예고·체고: an audition, so it needs years of arts & sports lessons; little academic teaching.
    { id: "artsHigh", stage: "high", fee: 400000, lessons: { all: 0.7 }, blocks: -1, stress: -3, motivation: 3, admit: (g) => clamp(((g.flags.artsN || 0) - 3) * 0.12, 0, 0.8) },
    // 특성화고·마이스터고: a trade, paid placements, and few academic lessons.
    { id: "vocHigh", stage: "high", fee: 0, lessons: { all: 0.4 }, blocks: -1, stress: -3, motivation: -2, job: 1.5, admit: () => 0.95 },
  ];
  const SCHOOL_BY_ID = Object.fromEntries(SCHOOLS.map((x) => [x.id, x]));
  // Which real schools each game school can be: local ones by [level, founding type, kind] from the
  // home area's list, or the nearest special school of a kind anywhere (places.js "special"). Arts and
  // vocational schools are local when the area has one.
  const REAL_LOCAL = {
    pubElem: ["e", "pub"], privElem: ["e", "priv"], pubMid: ["m", "pub", "gen"], privMid: ["m", "priv", "gen"],
    pubHigh: ["h", "pub", "gen"], privHigh: ["h", "priv", "gen"], artsHigh: ["h", null, "arts"], vocHigh: ["h", null, "voc"],
  };
  const REAL_FAR = { intlMid: "intl", autoHigh: "auto", sciHigh: "sci", langHigh: "lang", artsHigh: "arts", vocHigh: "voc" };
  const DEFAULT_SCHOOL = { kinder: "kinder", elem: "pubElem", mid: "pubMid", high: "pubHigh" };

  // ---------- early childhood ----------
  // Life starts at birth. Ability at birth is EARLY_GAP below the age-6 level the rest of the game is
  // tuned from, and a typical early childhood (sim.js's balanced bot at an ordinary kindergarten)
  // closes it, so a typical child still starts elementary school where it always did.
  // EARLY_FEED: what a block of each kind of play feeds, by subject, at EARLY_RATE a block.
  // KINDER_YEAR: kindergarten lessons a year, like school lessons (ages 3–5).
  const EARLY_GAP = 0.66;
  const EARLY_RATE = 0.1;
  const EARLY_FEED = {
    books: { kor: 0.6, hist: 0.3, inq1: 0.45 },
    blocks: { math: 0.7, inq2: 0.5 },
    songs: { eng: 0.8, kor: 0.15 },
    worksheet: { kor: 0.5, math: 0.5 },
  };
  const KINDER_YEAR = 0.12;

  // ---------- traits ----------
  // Passive bonuses dealt by two reveal events: your temperament, noticed in your first weeks, and
  // what you grab at your first-birthday 돌잡이. Each is rolled from its own seeded stream, so the
  // seed fixes them like the family and talents. fx keys: apt (aptitude per subject, permanent),
  // healthRest / stressRest (the resting levels health and stress drift to), mot (motivation
  // baseline), and multipliers: rest, exercise, friends, reading (also picture books), ill (chance of
  // colds and flu), bully (chance of bullying), nerves (exam-day nerves and stress hit), sebae (New
  // Year's money), arts (arts & sports lessons toward an arts-school audition).
  const TEMPERAMENTS = {
    sturdy: { healthRest: 8, ill: 0.5 },
    calm: { stressRest: -6 },
    curious: { mot: 4 },
    sleeper: { rest: 1.5, insomnia: 0 },
    steady: { nerves: 0.5 },
    smiley: { friends: 1.3, bully: 0.6 },
  };
  const TEMPERAMENT_IDS = Object.keys(TEMPERAMENTS);
  // 돌잡이 items. Modern tables add a mouse, a stethoscope, a microphone and a judge's gavel to the
  // traditional pencil, book, thread, money and brush.
  const DOLJABI = {
    pencil: { apt: { kor: 0.25 }, reading: 1.25 },
    book: { apt: { hist: 0.15, inq1: 0.15 } },
    mouse: { apt: { math: 0.25 } },
    stethoscope: { apt: { inq2: 0.25 } },
    mic: { apt: { eng: 0.25 } },
    gavel: { apt: { kor: 0.12, inq1: 0.12 } },
    ball: { exercise: 1.5, healthRest: 3 },
    thread: { healthRest: 5, ill: 0.6 },
    money: { sebae: 1.5, cash: 300000 },
    brush: { arts: 2, stressRest: -2 },
  };
  const DOLJABI_IDS = Object.keys(DOLJABI);
  const TRAIT_FX = Object.assign({}, TEMPERAMENTS, DOLJABI);
  // The best aptitude a child is dealt is at least this (see rollTalent).
  const MIN_BEST_APT = 1.1;

  // ---------- who raises you ----------
  // Most children grow up with both parents; some are born to a single mother or father, and a few are
  // raised by grandparents (조손가정). Rolled at birth from its own seeded stream. Later, parents can
  // divorce or a parent can die (the divorce and bereaved events). With one parent, or grandparents,
  // there is less money and time for your education: PARENT_BUDGET scales the education budget.
  // The household's income fifth itself is dealt as usual, so the 20%-per-fifth shares stay exact.
  // Grandparent-grandchild households are under 1% of households (153,000 in 2015); single-parent
  // household income is 60.3% of the all-household average (2024). See data/korea-stats.md.
  // A few children have no one to take them and grow up in a children's home (보육원, 아동양육시설):
  // about 2,300–4,100 children a year come into state care (out of 250,000–270,000 births), 63% of
  // them into a home, so about 0.6% of a cohort spends time in one; fewer arrive as babies. "care" is
  // last in the list so adding it only moved the top 0.3% of the stream, which used to be "grand".
  const PARENTS_AT_BIRTH = [["both", 0.91], ["mom", 0.06], ["dad", 0.02], ["grand", 0.007], ["care", 0.003]];
  const PARENT_BUDGET = { both: 1, mom: 0.6, dad: 0.6, grand: 0.5, care: 0 };
  // In care the home, not a household, pays: a small fixed education budget (an estimate: homes get
  // school costs and some tutoring support, far below even the lowest fifth's ₩205,000). At 18 care
  // ends (보호종료), or you choose to stay on until 24; leaving pays a one-off settlement (자립정착금,
  // set by each province) into your savings and a monthly allowance (자립수당, ₩500,000) for 5 years,
  // which becomes your budget. Figures: NABO 2025; see data/korea-stats.md.
  const CARE_BUDGET = 150000;
  const CARE_PAY = 500000, CARE_PAY_MONTHS = 60;
  const CARE_SETTLE = { seoul: 20000000, suwon: 15000000, daejeon: 15000000, jeju: 15000000, busan: 12000000 };
  const CARE_SETTLE_ELSE = 10000000;
  const SEOUL_AREAS = new Set(["gangnam", "nowon", "mokdong", "mapo", "gwanak", "gangdong"]);
  // Events that need a family household: its fortunes, its moves, its relatives.
  const CARE_SKIP = new Set(["promotion", "jackpot", "layoff", "jeonse", "parentill", "divorce", "bereaved", "daechi", "med-move", "grandma", "grandstory", "chuseok", "family-money", "sibling"]);
  // Fees paid out of household income rather than the education budget (English kindergarten).
  const FEE_FROM_INCOME = 0.12;
  // ...and fewer hands at home: stress settles this much higher, motivation this much lower.
  // In a children's home stress settles higher and motivation lower (crowded rooms, changing staff);
  // living alone after care ends is harder still, but it's your own life.
  const PARENT_STRESS = { both: 0, mom: 4, dad: 4, grand: 3, care: 5, careOut: 7 };
  const PARENT_MOT = { both: 0, mom: -1, dad: -1, grand: -3, care: -2, careOut: 0 };

  // ---------- parents' jobs ----------
  // Each working parent's job is rolled at birth from its own seeded stream ("jobs"). JOB_SHARE is the
  // national share of each job among employed women and men (KSCO major groups, split into named jobs by
  // official head counts; see data/korea-stats.md "Jobs"); PARENT_PAY their pay against the average. A
  // household's income fifth is dealt first, so jobs are drawn from JOB_JOINT: for each fifth, weights
  // fitted (iterative proportional fitting, below) so every fifth holds its share of working parents and each job
  // keeps its national share, with better-paid jobs leaning to richer fifths (pay ^ JOB_TILT).
  // fx: small effects through g.trait(): stressRest / mot / healthRest add up; reading, layoff and
  // promotion multiply (how likely the family's fortune events are, and picture-book reading).
  const JOBS = {
    exec: { group: "mgr", fx: { mot: 1, stressRest: 1 } },
    doctor: { group: "pro", fx: { mot: 2, stressRest: 2 } },
    pro: { group: "pro", fx: { mot: 1 } },
    dev: { group: "pro", fx: { mot: 1 } },
    teacher: { group: "pro", fx: { reading: 1.25, mot: 2, stressRest: 1, layoff: 0.2 } },
    nurse: { group: "pro", fx: { healthRest: 2, stressRest: 1, layoff: 0.5 } },
    civil: { group: "clerk", fx: { layoff: 0.2, promotion: 0.7 } },
    office: { group: "clerk", fx: {} },
    service: { group: "service", fx: { stressRest: 1 } },
    shop: { group: "sales", self: true, fx: { layoff: 1.6, promotion: 1.3, stressRest: 1 } },
    sales: { group: "sales", fx: {} },
    farmer: { group: "farm", self: true, fx: { healthRest: 3, layoff: 0.7 } },
    builder: { group: "craft", fx: { stressRest: 1 } },
    driver: { group: "machine", fx: { stressRest: 1 } },
    factory: { group: "machine", fx: { stressRest: 1 } },
    labor: { group: "labor", fx: { stressRest: 1 } },
    // Not in paid work: a parent at home has more time for you.
    home: { group: "none", fx: { stressRest: -2, mot: 1 } },
  };
  const WORK_IDS = Object.keys(JOBS).filter((id) => id !== "home");
  // JOB_SHARE: % of employed mothers / fathers in each job. Mothers: married women 15–54 living with a
  // child under 18 (지역별고용조사, 2025 H1). Fathers: employed men's KSCO mix reweighted to ages 30–49
  // (same survey; it has no sex × age table). Major groups are split into jobs by official head counts:
  // doctors, teachers, nurses and software experts within professionals; government clerks (11.9%)
  // within clerks; drivers within machine operators; owners (non-wage: 43% of sales and 29% of
  // service workers) become "shop". PARENT_PAY: mean monthly pay against the all-worker mean, from
  // each group's wage bands (2026 H1); doctors, developers and shop owners from other figures (see
  // data/korea-stats.md "Jobs").
  const JOB_SHARE = {
    f: { exec: 0.60, doctor: 0.38, pro: 25.70, dev: 1.14, teacher: 3.88, nurse: 3.40, civil: 3.43, office: 25.47, service: 9.72, shop: 8.19, sales: 5.79, farmer: 0.80, builder: 1.60, driver: 0.14, factory: 2.46, labor: 7.30 },
    m: { exec: 1.48, doctor: 0.80, pro: 24.01, dev: 3.57, teacher: 1.20, nurse: 0.25, civil: 2.52, office: 18.70, service: 3.90, shop: 4.66, sales: 4.18, farmer: 1.13, builder: 12.01, driver: 5.59, factory: 9.77, labor: 6.23 },
  };
  const PARENT_PAY = { exec: 1.9, doctor: 3.0, pro: 1.2, dev: 1.4, teacher: 1.25, nurse: 1.15, civil: 1.15, office: 1.15, service: 0.67, shop: 1.0, sales: 0.86, farmer: 0.7, builder: 1.09, driver: 1.0, factory: 1.1, labor: 0.55 };
  const JOB_TILT = 1.5;
  // Who works, by income fifth: mothers of young children work less in poorer households (dual earners
  // lift a household up the fifths); fathers mostly work. Fitted to 57.7% of mothers working while the
  // youngest is under 7 (2025) and about 94% of fathers; the momwork event takes mothers to 70% by
  // the time the child is 13–17 (see data/korea-stats.md).
  const MOM_WORKS = [0.43, 0.555, 0.635, 0.695, 0.735];
  const DAD_WORKS = [0.84, 0.95, 0.97, 0.98, 0.98];
  const SINGLE_MOM_WORKS = 0.8;
  // Farming is a rural job: its weight moves with the kind of place, then the row is renormalised.
  const FARM_BY_KIND = { rural: 8, city: 0.6, metro: 0.15, gangnam: 0.02, seoulAcad: 0.02, seoul: 0.02 };
  // JOB_JOINT[sex][fifth][job]: P(job | fifth, sex) for working parents.
  const JOB_JOINT = (() => {
    const out = {};
    for (const sex of ["f", "m"]) {
      const col = WORK_IDS.map((id) => JOB_SHARE[sex][id] / 100);
      const ct = col.reduce((a, b) => a + b, 0);
      let m = [0, 1, 2, 3, 4].map((i) => WORK_IDS.map((id) => Math.pow(PARENT_PAY[id], JOB_TILT * (i - 2))));
      // Rows: each fifth holds its share of the working parents (more mothers work in richer fifths).
      // Columns: each job its national share.
      const works = sex === "f" ? MOM_WORKS : DAD_WORKS, wt = works.reduce((a, b) => a + b, 0);
      for (let it = 0; it < 200; it++) {
        m = m.map((row, i) => { const t = row.reduce((a, b) => a + b, 0); return row.map((v) => (v / t) * (works[i] / wt)); });
        for (let j = 0; j < WORK_IDS.length; j++) {
          const t = m.reduce((a, row) => a + row[j], 0);
          for (const row of m) row[j] *= col[j] / ct / t;
        }
      }
      out[sex] = m.map((row) => { const t = row.reduce((a, b) => a + b, 0); const o = {}; WORK_IDS.forEach((id, j) => { o[id] = row[j] / t; }); return o; });
    }
    return out;
  })();
  // Jobs a parent takes after losing one, or on going (back) to work: 치킨집 is a national joke for a
  // reason; most others drive, sell, care or do day labour.
  const AFTER_LAYOFF = [["shop", 0.3], ["driver", 0.25], ["sales", 0.15], ["labor", 0.15], ["service", 0.15]];
  const BACK_TO_WORK = [["office", 0.25], ["sales", 0.25], ["service", 0.3], ["labor", 0.1], ["shop", 0.1]];

  // Roughly one baby in twelve grabs two things at once.
  const DOUBLE_GRAB = 0.08;

  // ---------- luck ----------
  // Life is mostly luck. Every life gets a hidden fortune at birth (luck, about −1 to 1, its own seeded
  // stream), read out by a fortune-teller (사주). It tilts the odds of good and bad events: an event
  // tagged luck +1 (good) or −1 (bad) has its weight multiplied by 1 + LUCK_BIAS × luck × tag.
  const LUCK_BIAS = 0.6;
  // Each 수능 and mock paper fits some students better than others (the killer question is a type you
  // happened to drill, or one you never saw): a per-subject nudge to ability on the day, rolled from the
  // seed and the sitting only.
  const PAPER_LUCK = 0.18;
  // On 수능 day itself the whole day goes well or badly together (sleep, nerves, the room), a shift on
  // every subject at once, from the seed and the sitting; your fortune adds a little on top.
  const DAY_LUCK = 0.35;
  const FORTUNE_DAY = 0.06;
  // Middle 2's rewiring (the bloom event): a shift shared by every subject (late bloomer or early
  // peaker) plus one per subject, in aptitude.
  const BLOOM_ALL = 0.2;
  const BLOOM_EACH = 0.18;
  // Admissions: every university's real cut moves a little each year (a 펑크 when strong applicants
  // go elsewhere, a 폭발 when everyone piles in), in percentile points, hidden until the results; and
  // a rejection can still turn into a February waitlist call (추가합격), at WAITLIST × the chance you had.
  const CUT_SWING = 0.45;
  const WAITLIST = 0.25;
  // The family's fortunes change: each step moves it one income fifth (see shiftFamily).

  // How far ahead of your year group you are in these subjects, in the units standing() uses.
  function zOf(g, subs) {
    const avg = subs.reduce((a, x) => a + g.skills[x], 0) / subs.length;
    return (avg - g.typicalLevel()) / 0.8;
  }
  // How likely each income fifth is in each kind of place, relative to the national mix: Gangnam is
  // mostly the top fifths, rural counties mostly the bottom ones. These are only the shape; JOINT below
  // rescales them so the totals come out exact.
  const REGION_AFFINITY = {
    gangnam: [0.15, 0.35, 0.8, 1.5, 2.7],
    seoulAcad: [0.4, 0.6, 1, 1.3, 1.6],
    seoul: [0.8, 0.9, 1, 1.1, 1.2],
    capital: [1, 1, 1, 1, 1],
    metro: [1, 1, 1, 1, 1],
    city: [1.1, 1.1, 1, 0.95, 0.85],
    rural: [1.8, 1.3, 0.9, 0.6, 0.4],
  };
  // The chance of each (region, family) pair at birth. Built from REGION_AFFINITY by iterative
  // proportional fitting, so every region keeps exactly its population share and every income fifth
  // exactly 20%, while rich families still cluster in Gangnam and poorer ones in the countryside.
  const JOINT = (() => {
    const popSum = REGIONS.reduce((a, r) => a + r.pop, 0);
    const rows = REGIONS.map((r) => REGION_AFFINITY[r.kind].slice());
    for (let it = 0; it < 500; it++) {
      rows.forEach((row, i) => { const t = REGIONS[i].pop / popSum, s = row.reduce((a, b) => a + b, 0); for (let j = 0; j < row.length; j++) row[j] *= t / s; });
      for (let j = 0; j < FAMILY_IDS.length; j++) {
        const s = rows.reduce((a, row) => a + row[j], 0);
        rows.forEach((row) => { row[j] *= (1 / FAMILY_IDS.length) / s; });
      }
    }
    return rows;
  })();

  // Admission quotas, as cut reductions in percentile points. 지역인재 (regional talent): medical schools
  // outside Seoul and the regional national universities reserve seats for students who did middle and
  // high school in the region. 농어촌 (rural students): a separate quota at most universities.
  const LOCAL_QUOTA = 0.6, RURAL_QUOTA = 0.8;
  const MOVE_COOLDOWN = 12; // months between moves

  // 수능-year mocks (month → true); grades 10–11 sit 학력평가 in June and November instead.
  const MOCKS = { 3: true, 6: true, 9: true };

  // ---------- universities ----------
  // cut: the 정시 국수탐 percentile average (after the English/History deductions below) where an
  // application is about a coin flip. Ballpark 2025-era 정시 numbers, simplified to one per school.
  // SNU and med sit where roughly the top 0.3% and 0.15% of simulated test takers land, so a player
  // at ability 100 (θ ≈ 3, top 0.13%) is a likely but not certain SNU admit and about a coin flip for med.
  // Schools added in v6.0 (the women's universities, the next in-Seoul tier, two more regional
  // national universities, KAIST and POSTECH) are placed between the old ones by their usual tier
  // (see data/korea-stats.md "8. University admission"); like the rest, not an admissions predictor.
  //
  // 수시 (early admission, v6.0). susi: the share of the school's places filled in 수시 (%): about
  // 80% nationally, near 60% at the Seoul schools asked to keep 40% for 정시, 90% in the provinces.
  // Each 수시 type a school runs (absent if it doesn't):
  //   gk: 학생부교과, the 내신 average (5-grade scale) where an application is a coin flip.
  //   jh: 학생부종합, the record score (0–100, see recordScore) where it's a coin flip; iv: an
  //       interview stage after a document round (서류 → 면접).
  //   ns: 논술 (essay): true when the school runs one.
  // gkMin / jhMin / nsMin: 수능 최저 (minimum 수능 grades), [n, sum]: your best n grades among Korean,
  // Math, English and your better inquiry subject must add up to sum or less. Absent: no minimum.
  // Typical of the school's tier in recent years, not any one year's exact rule.
  // gkGrad: false when 교과 takes only this year's graduates (학교장추천 at the top schools).
  // women: admits women only. susiOnly: no 정시 at all (KAIST, POSTECH). free: outside the six-
  // application limit (KAIST is a science and technology institute, not under the Higher Education
  // Act). sky / seoul: the groups sim.js reports (SKY+ and in-Seoul+).
  const UNIVERSITIES = [
    { id: "med", cut: 98.8, sci: true, sky: true, susi: 68, gk: 1.03, gkMin: [3, 4], jh: 92, jhMin: [3, 5], iv: true, ns: true, nsMin: [3, 4] },
    { id: "kaist", cut: 98.0, sci: true, sky: true, susiOnly: true, free: true, susi: 100, jh: 88, iv: true },
    { id: "snu", cut: 98.0, sky: true, susi: 62, jh: 91, iv: true },
    { id: "postech", cut: 97.8, sci: true, sky: true, susiOnly: true, susi: 100, jh: 87, iv: true },
    { id: "yonsei", cut: 97.6, sky: true, susi: 60, gk: 1.08, gkGrad: false, jh: 86, iv: true, ns: true },
    { id: "korea", cut: 97.4, sky: true, susi: 62, gk: 1.12, gkMin: [3, 7], gkGrad: false, jh: 85, jhMin: [4, 8], ns: true, nsMin: [4, 8] },
    { id: "skku", cut: 96.1, susi: 60, gk: 1.12, gkMin: [3, 7], jh: 83, ns: true, nsMin: [3, 6] },
    { id: "sogang", cut: 95.8, susi: 60, gk: 1.18, gkMin: [3, 7], jh: 82, ns: true, nsMin: [3, 7] },
    { id: "hanyang", cut: 95.6, susi: 60, gk: 1.08, gkMin: [3, 7], jh: 83, ns: true },
    { id: "cau", cut: 94.2, susi: 60, gk: 1.18, gkMin: [3, 7], jh: 79, ns: true, nsMin: [3, 6] },
    { id: "khu", cut: 93.6, susi: 62, gk: 1.32, gkMin: [2, 5], jh: 78, ns: true, nsMin: [2, 5] },
    { id: "hufs", cut: 93.3, susi: 61, gk: 1.32, gkMin: [2, 4], jh: 77, ns: true, nsMin: [2, 4] },
    { id: "uos", cut: 93.8, susi: 58, gk: 1.27, gkMin: [3, 7], jh: 77, iv: true },
    { id: "ewha", cut: 93.0, women: true, susi: 70, gk: 1.22, gkGrad: false, jh: 78, ns: true, nsMin: [3, 6] },
    { id: "konkuk", cut: 91.0, susi: 62, gk: 1.38, jh: 74, ns: true, nsMin: [2, 5] },
    { id: "dongguk", cut: 90.6, susi: 62, gk: 1.38, gkMin: [2, 5], jh: 73, ns: true, nsMin: [2, 5] },
    { id: "hongik", cut: 90.0, susi: 63, gk: 1.52, gkMin: [3, 8], jh: 72, ns: true, nsMin: [3, 8] },
    { id: "sookmyung", cut: 89.5, women: true, susi: 66, gk: 1.42, gkMin: [2, 5], jh: 72, ns: true, nsMin: [2, 5] },
    { id: "seoultech", cut: 89.0, susi: 63, gk: 1.57, jh: 71, ns: true },
    { id: "pnu", cut: 88.5, susi: 76, gk: 1.42, gkMin: [2, 5], jh: 70, ns: true, nsMin: [2, 5] },
    { id: "knu", cut: 87.5, susi: 74, gk: 1.62, gkMin: [2, 5], jh: 69, ns: true, nsMin: [2, 5] },
    { id: "kookmin", cut: 86.8, susi: 63, gk: 1.62, gkMin: [2, 6], jh: 68 },
    { id: "soongsil", cut: 86.5, susi: 62, gk: 1.57, jh: 68 },
    { id: "kwangwoon", cut: 86.3, susi: 62, gk: 1.72, jh: 67, ns: true },
    { id: "sejong", cut: 86.0, susi: 62, gk: 1.77, jh: 66 },
    { id: "jnu", cut: 86.0, susi: 80, gk: 1.72, gkMin: [2, 6], jh: 66 },
    { id: "inha", cut: 85.0, susi: 70, gk: 1.57, jh: 66, ns: true },
    { id: "ajou", cut: 85.8, susi: 68, gk: 1.57, jh: 67, ns: true },
    { id: "cnu", cut: 85.0, susi: 78, gk: 1.87, gkMin: [2, 6], jh: 64 },
    { id: "sungshin", cut: 85.0, women: true, susi: 66, gk: 1.82, jh: 64 },
    { id: "dankook", cut: 84.8, susi: 66, gk: 1.72, jh: 64, ns: true },
    { id: "swu", cut: 84.0, women: true, susi: 67, gk: 1.92, jh: 62 },
    { id: "myongji", cut: 83.8, susi: 68, gk: 1.92, jh: 62 },
    { id: "incheon", cut: 83.5, susi: 70, gk: 1.87, jh: 60 },
    { id: "duksung", cut: 83.2, women: true, susi: 68, gk: 1.97, jh: 60 },
    { id: "dongduk", cut: 82.8, women: true, susi: 72, gk: 2.02, jh: 59 },
    { id: "gachon", cut: 80.0, susi: 75, gk: 1.77, jh: 56, ns: true },
    { id: "regional", cut: 60.0, susi: 88, gk: 2.9, jh: 40 },
    { id: "kwangjuWomen", cut: 50.0, women: true, susi: 92, gk: 3.2, jh: 34 },
    { id: "college", cut: 25.0, susi: 92, gk: 3.7, jh: 25 },
  ];
  // in-Seoul+ (what sim.js reports): a 정시 cut of about 85 or more, the same line as before v6.0 (the
  // in-Seoul universities down to the Kookmin–Soongsil–Dankook tier, the big regional national
  // universities, Inha and Ajou), so the balance tables stay comparable.
  for (const u of UNIVERSITIES) u.seoul = u.cut >= 84.5;
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
    // Near the ceiling the band narrows: med's cut leaves only 1.2 points above it, and with the full
    // 0.7-point slope even a perfect exam would be turned down a quarter of the time.
    const slope = Math.min(UNI_SLOPE, (100 - uni.cut) / 3);
    return 1 / (1 + Math.exp(-(score - uni.cut) / slope));
  }
  function chanceLabel(p) {
    return p >= 0.85 ? "safe" : p >= 0.55 ? "match" : p >= 0.25 ? "reach" : "long";
  }
  const logistic = (x) => 1 / (1 + Math.exp(-x));

  // ---------- 내신 (school grades), v6.0 ----------
  // From High 1 to the first semester of High 3 you sit a midterm (중간고사) and a final (기말고사)
  // each semester, graded against the classmates in your year at your school. Everyone who entered
  // high school from 2025 is on the 5-grade relative scale (MOE, 2028 대입 개편 확정안, 2023-12-27):
  // 1등급 the top 10%, 2등급 to 34%, 3등급 to 66%, 4등급 to 90%, 5등급 the rest.
  const NAESIN_CUTS = [0.10, 0.34, 0.66, 0.90];
  // Which turns end in an exam: (semester, midterm or final) by the month the turn starts. Grades 10–11
  // move a season a turn, so each season has one exam; High 3 is monthly (April and July). The
  // second semester of High 3 doesn't count for 수시, which closes the record at the end of August.
  const NAESIN_TERMS = { high: { 3: [1, "mid"], 6: [1, "fin"], 9: [2, "mid"], 12: [2, "fin"] }, hs3: { 4: [1, "mid"], 7: [1, "fin"] } };
  // Graded subjects: the five 수능 slots, plus Korean History in High 1 (the common subjects).
  const NAESIN_SUBJ = ["kor", "math", "eng", "inq1", "inq2"];
  // Your classmates' ability in a subject: around the typical line for your grade, sd COHORT_SD, set
  // so that sim.js's balanced bot (a fairly diligent child) ranks near the middle of its year at an
  // ordinary school (내신 about 3). Selective schools pick strong
  // students, so the same ability ranks lower there (the real "내신 불리"), most of all in the subjects
  // the school selects on; Seoul's academy districts are a little stronger too.
  const COHORT_MEAN = 0.25, COHORT_SD = 0.85;
  const SCHOOL_COHORT = {
    privHigh: { all: 0.05 },
    autoHigh: { all: 0.7, sd: 0.65 },
    sciHigh: { all: 0.9, math: 1.5, inq2: 1.5, sd: 0.5 },
    langHigh: { all: 0.6, eng: 1.3, kor: 0.8, sd: 0.55 },
    artsHigh: { all: -0.4 },
    vocHigh: { all: -0.9, sd: 0.9 },
  };
  const REGION_COHORT = { gangnam: 0.35, seoulAcad: 0.25, seoul: 0.1, capital: 0, metro: 0, city: -0.05, rural: -0.25 };
  // How much a school exam swings for you (θ), and what preparing for it (내신 대비: the teacher's
  // handouts, past papers of your school) adds at most. A semester grade is 35% midterm, 40% final and
  // 25% performance assessment (수행평가), which follows how engaged you are in class.
  const NAESIN_NOISE = 0.22;
  const PREP_MAX = 0.22;
  const SEM_W = { mid: 0.35, fin: 0.4, perf: 0.25 };
  function naesinGrade(top) {
    for (let i = 0; i < NAESIN_CUTS.length; i++) if (top <= NAESIN_CUTS[i]) return i + 1;
    return 5;
  }

  // ---------- 학생부 (school record), v6.0 ----------
  // Built up from High 1 to the end of August in High 3. Universities read it as three qualities, the
  // common 학생부종합 evaluation of 2024 onwards (five-university joint study, 2022): 학업역량
  // (academic: your 내신 and the teachers' subject comments, 세특), 진로역량 (career exploration
  // consistent with what you want to study) and 공동체역량 (community: clubs, volunteering,
  // leadership). Points go into running totals; each quality is a saturating curve of its total.
  // From 2024 individual reading lists, awards and outside volunteering are no longer sent to
  // universities, so reading counts only through what teachers write in 세특.
  // SETE_K etc.: how many points take a quality about two-thirds of the way up its curve.
  const SETE_K = 18, CAREER_K = 14, COMM_K = 12;
  const RECORD_W = { acad: 0.65, career: 0.2, comm: 0.15 };
  // 종합 readers know a selective school's 내신 is harder: they read its average this much better.
  // A vocational or arts school's academic grades were earned among weaker classmates and read worse.
  const SCHOOL_READ = { autoHigh: 0.35, sciHigh: 0.7, langHigh: 0.45, vocHigh: -0.6, artsHigh: -0.3 };
  // 교과 at most universities is built for general-school curricula: vocational graduates compete in
  // a small separate quota (특성화고졸 특별전형) and arts-school students mostly apply by audition, so
  // their 내신 (earned among weaker academic classmates) counts this much worse.
  const GK_PENALTY = { vocHigh: 0.5, artsHigh: 0.3 };
  // Intended fields (진로 희망) and the track each fits.
  const FIELDS = { med: "sci", sci: "sci", hum: "soc", biz: "soc" };

  // ---------- 수시 (early admission), v6.0 ----------
  // Up to six applications in September (KAIST outside the count). Anyone admitted in 수시, even off a
  // waitlist, can't apply in 정시 that year (수시 납치): you take a 수시 place or none.
  const SUSI_MAX = 6;
  // Quotas, as an easier cut: 교과 in 내신 grades, 종합 in record points. 지역인재 at medical schools
  // and the regional national university; 농어촌 (rural) nearly everywhere; 기회균형 (opportunity
  // balance: basic-livelihood and near-poverty households, children in care) nearly everywhere.
  const SUSI_QUOTA = { local: { gk: 0.25, jh: 6 }, rural: { gk: 0.3, jh: 8 }, balance: { gk: 0.3, jh: 8 } };
  // This year's hidden swing in each cut (교과 grades, 종합 points), like CUT_SWING in 정시.
  const SUSI_SWING = { gk: 0.06, jh: 2 };
  // 종합 odds move 1 logit every JH_SLOPE points; a document round passes about three times as many as
  // the school admits (JH_STAGE points easier).
  const JH_SLOPE = 5, JH_STAGE = 7;
  // 논술: even a strong writer is never sure (competition runs 40:1 and more at Seoul schools), so the
  // chance tops out at NS_MAX. The essay draws on Korean and on math (sciences) or social studies.
  const NS_MAX = 0.18, NS_SLOPE = 0.3, NS_EDGE = 0.6;
  // Interview: what the prep choice adds (record points), and how much the day swings.
  const IV_PREP = [3, 1.5, 0], IV_DAY = 3;
  // Inverse of phi, for turning a 정시 percentile cut into an ability line.
  function invPhi(p) {
    let lo = -6, hi = 6;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (phi(mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // 교과: odds move faster near the top, where a tenth of a grade separates hundreds of applicants.
  function gkChance(avg, cut) { return logistic((cut - avg) / (0.05 + 0.05 * (cut - 1))); }
  // Best n of your 수능 grades in Korean, Math, English and the better inquiry subject.
  function minGrades(res) {
    const s = res.subjects;
    return [s.kor.grade, s.math.grade, s.eng.grade, Math.min(s.inq1.grade, s.inq2.grade)].sort((a, b) => a - b);
  }
  function meetsMin(min, res) {
    if (!min) return true;
    return minGrades(res).slice(0, min[0]).reduce((a, b) => a + b, 0) <= min[1];
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
  // Each event: when(g) gates it, weight is its relative chance. Either run(g) applies it directly, or
  // it has `choices` options and run(g, i) applies option i. run returns the outcome's key suffix
  // (strings.js has "ev.<id>.<suffix>"), or [suffix, params] when the text names something.
  const EVENTS = [
    // ----- luck (anyStage: these can happen at any age) -----
    // The fortune-teller's reading of your hidden luck, pushed at birth.
    {
      id: "saju", early: true, weight: 0, when: () => false, choices: 1,
      run: (g) => {
        const l = g.luck || 0;
        return "r." + (l > 0.55 ? "great" : l > 0.18 ? "good" : l > -0.18 ? "even" : l > -0.55 ? "mixed" : "rough");
      },
    },
    // The family's fortunes. Each moves the income fifth (and the education budget) for good.
    {
      // A promotion, or a family business that takes off. Safe jobs (civil servants) rise more slowly.
      id: "promotion", anyStage: true, luck: 1, weight: (g) => (g.family !== "q5" && g.parents !== "grand" && !(g.jobs && !g.workingParents().length) ? 0.4 * g.trait("promotion") : 0), when: () => true,
      run: (g) => {
        const who = g.fortuneParent("promotion");
        g.shiftFamily(1, "promotion");
        bump(g, { stress: -4, motivation: 3 });
        return who ? ["r", { who, job: g.jobs[who] }] : "r";
      },
    },
    {
      // Mostly an inheritance; a lottery jackpot (1 in 8,145,060 a ticket) is a once-in-a-lifetime fluke.
      id: "jackpot", anyStage: true, luck: 1, weight: (g) => (g.family !== "q5" ? 0.03 : 0), when: () => true,
      run: (g) => { const two = g.rng() < 0.01; g.shiftFamily(two ? 2 : 1, "jackpot"); g.money += 500000; bump(g, { stress: -6, motivation: 4 }); return two ? "r2" : "r1"; },
    },
    {
      // A layoff, or a business that goes under (most small shops close within five years). Teachers
      // and civil servants are rarely let go. The parent finds other work: often a shop or a steering wheel.
      id: "layoff", anyStage: true, luck: -1, weight: (g) => (g.family !== "q1" && g.parents !== "grand" && !(g.jobs && !g.workingParents().length) ? 0.4 * g.trait("layoff") : 0), when: () => true,
      run: (g) => {
        const who = g.fortuneParent("layoff");
        const from = who && g.jobs[who];
        g.shiftFamily(-1, "layoff");
        bump(g, { stress: 10, motivation: -3 });
        if (!who) return "r";
        const to = g.setJob(who, AFTER_LAYOFF, "layoff");
        return ["r", { who, from, to }];
      },
    },
    {
      // 전세 사기: the deposit on the family's rented home is gone.
      // 41,559 victims nationally from mid-2023 to 2026: about 1% of families over a childhood.
      id: "jeonse", anyStage: true, luck: -1, weight: (g) => (g.family !== "q1" ? 0.006 : 0), when: () => true,
      run: (g) => { g.shiftFamily(-1, "jeonse"); g.money = Math.max(0, g.money - 300000); bump(g, { stress: 12 }); return "r"; },
    },
    {
      // Cancer in a parent's 40s–50s (414–595 per 100,000 a year): roughly 15–20% of childhoods.
      id: "parentill", anyStage: true, luck: -1, weight: 0.09, when: (g) => !g.flags.parentIll,
      run: (g) => { g.flags.parentIll = 1; if (g.family !== "q1") g.shiftFamily(-1, "parentill"); bump(g, { stress: 14, motivation: -5 }); g.lostBlocks += 1; return "r"; },
    },
    // Divorce: about one child in eight sees their parents split before they're grown. Custody mostly
    // goes to the mother. Losing an earner usually drops the household a fifth.
    {
      id: "divorce", anyStage: true, luck: -1, weight: (g) => ((g.parents || "both") === "both" && g.grade <= 12 && g.attempt === 1 ? 0.08 : 0), when: () => true,
      run: (g) => {
        g.parents = g.rng() < 0.75 ? "mom" : "dad";
        g.flags.divorced = 1; // the other parent is still alive (see bereaved)
        g.addLog("log.parents", { now: g.parents, why: "divorce" }, "milestone");
        g.toWork("divorce");
        g.shiftFamily(-1, "divorce");
        g.checkFees();
        bump(g, { stress: 14, motivation: -6 });
        g.lostBlocks += 1;
        return ["r", { with: g.parents }];
      },
    },
    // A parent dies (rare). With one parent left you live with them; if it was your only parent, your
    // grandparents take you in. There is some insurance money, and a long grief.
    {
      id: "bereaved", anyStage: true, luck: -1, weight: (g) => ((g.parents || "both") !== "grand" && g.grade <= 12 && g.attempt === 1 && !g.flags.bereaved ? 0.014 : 0), when: () => true,
      run: (g) => {
        g.flags.bereaved = 1;
        const was = g.parents || "both";
        const lost = was === "both" ? (g.rng() < 0.6 ? "dad" : "mom") : was;
        // Losing your only parent: grandparents if they can, otherwise a children's home (parental death
        // is about one in nine of the children who come into care).
        // After a divorce the other parent is alive and takes you in.
        g.parents = was === "both" ? (lost === "dad" ? "mom" : "dad") : g.flags.divorced ? (was === "mom" ? "dad" : "mom") : g.rng() < 0.7 ? "grand" : "care";
        if (g.parents === "care") g.family = "q1";
        if (g.parents === "grand" || g.parents === "care") g.jobs = null;
        g.addLog("log.parents", { now: g.parents, why: "bereaved", lost }, "milestone");
        g.toWork("bereaved");
        if (was === "both") g.shiftFamily(-1, "bereaved");
        g.checkFees();
        g.money += 500000;
        bump(g, { stress: 25, motivation: -12, health: -6 });
        g.lostBlocks += 2;
        return ["r", { lost, now: g.parents }];
      },
    },
    // Growing up in a children's home. University volunteers tutor in most homes; sponsors send a
    // little money; and at some point classmates find out where you live.
    {
      id: "care-tutor", weight: (g) => (g.parents === "care" && g.flags.careLeft == null ? 0.8 : 0), when: (g) => g.grade >= 3 && g.grade <= 12 && !g.flags.careTutor,
      run: (g) => { g.flags.careTutor = 1; studyBoost(g, "math", 0.04); studyBoost(g, "eng", 0.03); bump(g, { motivation: 5 }); return "r"; },
    },
    {
      id: "care-sponsor", luck: 1, weight: (g) => (g.parents === "care" && g.flags.careLeft == null ? 0.6 : 0), when: (g) => g.grade >= 1 && g.grade <= 12,
      run: (g) => { g.money += 100000; bump(g, { motivation: 3, stress: -2 }); return "r"; },
    },
    {
      id: "care-found", luck: -1, weight: (g) => (g.parents === "care" ? 0.5 : 0), when: (g) => g.grade >= 4 && g.grade <= 9 && !g.flags.careFound,
      run: (g) => { g.flags.careFound = 1; bump(g, { stress: 8, motivation: -3 }); return "r"; },
    },
    // Care ends at 18 (보호종료): after the first 수능 you leave with the settlement and a monthly
    // allowance, or stay on in the home (allowed to 24) with a roof and meals but neither payment yet.
    {
      id: "careleave", weight: (g) => (g.parents === "care" && g.flags.careLeft == null && !g.flags.careStay ? 100 : 0), when: (g) => g.attempt >= 2 && g.age >= 18, choices: 2,
      run: (g, i) => {
        if (i === 1) { g.flags.careStay = g.clock; bump(g, { stress: -4, motivation: 2 }); return "r1"; }
        return leaveCare(g, "r0");
      },
    },
    { id: "careend", weight: (g) => (g.parents === "care" && g.flags.careLeft == null && g.flags.careStay != null ? 100 : 0), when: (g) => g.age >= 24, run: (g) => leaveCare(g, "r") },
    // Parents' jobs. A mother at home often goes back to work once school starts (57.7% of mothers work
    // while the youngest is under 7, 70.4% once they're 13–17), usually in a different, lower-paid job.
    {
      id: "momwork", weight: (g) => (g.jobs && g.jobs.mom === "home" && g.workingParents(true).indexOf("mom") >= 0 ? 0.4 : 0), when: (g) => g.grade >= 1 && g.grade <= 12 && g.attempt === 1,
      run: (g) => { const to = g.setJob("mom", BACK_TO_WORK, "back"); bump(g, { stress: 2, motivation: 1 }); return ["r", { to }]; },
    },
    {
      // The family shop or restaurant needs hands on weekends.
      id: "job-shop", weight: (g) => (g.hasJob("shop") ? 1 : 0), when: (g) => g.grade >= 4 && g.grade <= 12 && g.attempt === 1, choices: 2,
      run: (g, i) => {
        if (i === 0) { g.money += 150000; bump(g, { stress: 4, motivation: 2 }); g.lostBlocks += 1; return ["r0", { who: g.hasJob("shop") }]; }
        bump(g, { stress: -2, motivation: -2 }); return ["r1", { who: g.hasJob("shop") }];
      },
    },
    {
      // A teacher at home checks every page of homework.
      id: "job-teacher", weight: (g) => (g.hasJob("teacher") ? 1.2 : 0), when: (g) => g.grade >= 1 && g.grade <= 9 && !g.flags.jobTeacher,
      run: (g) => { g.flags.jobTeacher = 1; studyBoost(g, "kor", 0.04); studyBoost(g, "eng", 0.03); bump(g, { stress: 4 }); return ["r", { who: g.hasJob("teacher") }]; },
    },
    {
      // A doctor's child hears about medical school from the start.
      id: "job-doctor", weight: (g) => (g.hasJob("doctor") ? 1.5 : 0), when: (g) => g.grade >= 7 && g.grade <= 11 && !g.flags.jobDoctor, choices: 2,
      run: (g, i) => {
        g.flags.jobDoctor = 1;
        if (i === 0) { bump(g, { motivation: 6, stress: 6 }); return ["r0", { who: g.hasJob("doctor") }]; }
        bump(g, { stress: -2, motivation: -1 }); return ["r1", { who: g.hasJob("doctor") }];
      },
    },
    {
      // Night shifts and early starts: dinner on your own, and you grow up a little faster.
      id: "job-shift", weight: (g) => (["nurse", "driver", "factory", "labor", "service", "builder"].some((j) => g.hasJob(j)) ? 0.8 : 0), when: (g) => g.grade >= 1 && g.grade <= 9 && !g.flags.jobShift,
      run: (g) => { g.flags.jobShift = 1; const who = ["nurse", "driver", "factory", "labor", "service", "builder"].map((j) => g.hasJob(j)).find(Boolean); bump(g, { stress: 3, motivation: 2 }); return ["r", { who, job: g.jobs[who] }]; },
    },
    {
      // Harvest weekends on the family farm (or boat).
      id: "job-farm", weight: (g) => (g.hasJob("farmer") ? 1.2 : 0), when: (g) => g.grade >= 3 && g.grade <= 12 && g.attempt === 1 && (g.status === "elem" || (g.month >= 6 && g.month <= 11)),
      run: (g) => { g.money += 100000; bump(g, { health: 4, stress: 2 }); g.lostBlocks += 1; return ["r", { who: g.hasJob("farmer") }]; },
    },
    {
      // Long hours at the office: the school play goes on without them.
      id: "job-overtime", weight: (g) => (["office", "exec", "dev", "pro"].some((j) => g.hasJob(j)) ? 0.6 : 0), when: (g) => g.grade >= 1 && g.grade <= 6 && !g.flags.jobOvertime,
      run: (g) => { g.flags.jobOvertime = 1; const who = ["office", "exec", "dev", "pro"].map((j) => g.hasJob(j)).find(Boolean); bump(g, { stress: 3, motivation: -1 }); return ["r", { who, job: g.jobs[who] }]; },
    },
    // Your own body: an accident or a long illness costs time you can't get back.
    // About 0.25% of children are hurt in traffic each year: a few percent over a childhood.
    { id: "accident", luck: -1, weight: 0.03, when: (g) => !g.flags.accident, run: (g) => { g.flags.accident = 1; bump(g, { health: -35, stress: 10, motivation: -4 }); g.lostBlocks += 3; return "r"; } },
    { id: "hospital", luck: -1, weight: 0.3, when: (g) => g.grade >= 4, run: (g) => { bump(g, { health: -22, stress: 6, motivation: -4 }); g.lostBlocks += 2; return "r"; } },
    // And the lucky breaks: a teacher who changes everything, or a subject that suddenly clicks.
    {
      id: "greatteacher", luck: 1, weight: 0.5, when: (g) => g.inClass(),
      run: (g) => { const s = SUBJECTS[Math.floor(g.rng() * SUBJECTS.length)]; g.aptitude[s] = Math.round(Math.min(1.8, g.aptitude[s] + 0.2) * 100) / 100; studyBoost(g, s, 0.05); bump(g, { motivation: 8 }); return ["r", { s }]; },
    },
    {
      id: "spark", luck: 1, weight: 0.4, when: (g) => g.grade >= 3 && !g.flags.spark,
      run: (g) => { g.flags.spark = 1; const s = SUBJECTS[Math.floor(g.rng() * SUBJECTS.length)]; g.aptitude[s] = Math.round(Math.min(1.8, g.aptitude[s] + 0.3) * 100) / 100; studyBoost(g, s, 0.08); bump(g, { motivation: 10 }); return ["r", { s }]; },
    },
    // Puberty rewires everyone (Middle 2): aptitudes drift, some up, some down, from their own stream.
    {
      id: "bloom", weight: 100, when: (g) => g.grade === 8 && !g.flags.bloom,
      run: (g) => {
        g.flags.bloom = 1;
        const r = makeRng(hashSeed(g.seed, "bloom"));
        let up = null, down = null, net = 0;
        const all = r.normal() * BLOOM_ALL;
        for (const s of SUBJECTS) {
          const d = Math.round((all + r.normal() * BLOOM_EACH) * 100) / 100;
          g.aptitude[s] = Math.round(clamp(g.aptitude[s] + d, 0.5, 1.8) * 100) / 100;
          net += d;
          if (!up || d > up.d) up = { s, d };
          if (!down || d < down.d) down = { s, d };
        }
        return [net > 0.12 ? "up" : net < -0.12 ? "down" : "mixed", { up: up.s, down: down.s }];
      },
    },
    // Exam-day luck, pushed by advance() before every 수능 (see examLuckEvent). Never rolled.
    { id: "examluck", weight: 0, when: () => false, run: () => "r" },
    // ----- early childhood (ages 0–5; stageFits keeps these before school and the rest after) -----
    // Your first weeks: your parents notice your temperament. Pushed at birth, never rolled.
    {
      id: "newborn", early: true, weight: 0, when: () => false, choices: 1,
      run: (g) => {
        const r = makeRng(hashSeed(g.seed, "temperament"));
        const t = TEMPERAMENT_IDS[Math.floor(r() * TEMPERAMENT_IDS.length)];
        g.addTrait(t);
        return "r." + t;
      },
    },
    // 돌잡이 at the first-birthday party: whatever you grab is said to foretell your future, and here
    // it gives you a head start. Pushed by nextTurn at age 1.
    {
      id: "doljabi", early: true, weight: 0, when: () => false, choices: 1,
      run: (g) => {
        const r = makeRng(hashSeed(g.seed, "doljabi"));
        const first = DOLJABI_IDS[Math.floor(r() * DOLJABI_IDS.length)];
        g.addTrait(first);
        if (r() < DOUBLE_GRAB) {
          const rest = DOLJABI_IDS.filter((x) => x !== first);
          const second = rest[Math.floor(r() * rest.length)];
          g.addTrait(second);
          return ["two", { a: first, b: second }];
        }
        return ["r." + first, { a: first }];
      },
    },
    { id: "firstword", early: true, weight: 3, when: (g) => g.age <= 2 && !g.flags.firstWord, run: (g) => { g.flags.firstWord = 1; studyBoost(g, "kor", 0.03); bump(g, { motivation: 4 }); return "r"; } },
    { id: "firststeps", early: true, weight: 3, when: (g) => g.age <= 1 && !g.flags.firstSteps, run: (g) => { g.flags.firstSteps = 1; bump(g, { health: 6, motivation: 3 }); return "r"; } },
    {
      id: "daycarecold", early: true, weight: (g) => 2 * g.trait("ill"), when: (g) => g.atKinder() && g.schoolInfo().id !== "homeCare",
      run: (g) => { bump(g, { health: -12, stress: 3 }); return "r"; },
    },
    { id: "bump", early: true, weight: 1.5, when: (g) => g.age >= 1 && !g.flags.bump, run: (g) => { g.flags.bump = 1; bump(g, { health: -8, stress: 3 }); return "r"; } },
    {
      id: "sibling", early: true, weight: (g) => (g.parents === "grand" ? 0 : 1), when: (g) => g.age >= 2 && !g.flags.sibling,
      run: (g) => { g.flags.sibling = g.rng() < 0.5 ? "m" : "f"; bump(g, { stress: 8, motivation: -3 }); return ["r", { sib: g.flags.sibling }]; },
    },
    { id: "grandstory", early: true, weight: 1.5, when: (g) => g.age >= 2 && !g.flags.grandstory, run: (g) => { g.flags.grandstory = 1; studyBoost(g, "hist", 0.03); studyBoost(g, "inq1", 0.02); bump(g, { stress: -4 }); return "r"; } },
    {
      // Learning to read 한글 before school: common, and a choice for the parents.
      id: "hangul", early: true, weight: 3, when: (g) => g.age >= 4 && !g.flags.hangul, choices: 2,
      run: (g, i) => {
        g.flags.hangul = 1;
        if (i === 0) { studyBoost(g, "kor", 0.05); bump(g, { stress: 5 }); return "r0"; }
        bump(g, { stress: -5, motivation: 3 }); return "r1";
      },
    },
    { id: "kinderplay", early: true, weight: 2, when: (g) => g.atKinder() && g.schoolInfo().id !== "homeCare" && !g.flags.kinderplay, run: (g) => { g.flags.kinderplay = 1; bump(g, { motivation: 6, stress: -3 }); return "r"; } },
    {
      // A 영재 (gifted) test the year before school.
      id: "prodigy", early: true, weight: 2, when: (g) => g.age === 5 && !g.flags.prodigy, choices: 2,
      run: (g, i) => {
        g.flags.prodigy = 1;
        if (i === 1) return "r1";
        if (zOf(g, ["kor", "math", "eng", "inq1", "inq2"]) > 0.6 || g.rng() < 0.15) { bump(g, { motivation: 10 }); return "r0a"; }
        bump(g, { stress: 6, motivation: -2 }); return "r0b";
      },
    },
    // ----- childhood -----
    { id: "sportsday", weight: 1.5, when: (g) => g.grade <= 6, run: (g) => { bump(g, { health: 6, stress: -6, motivation: 4 }); return "r"; } },
    { id: "bookworm", weight: 1.5, when: (g) => g.grade <= 8, run: (g) => { studyBoost(g, "kor", 0.05); bump(g, { motivation: 3 }); return "r"; } },
    {
      // Offered to children well ahead of their year in math (ability is on the 수능 scale, so compare
      // with the typical level for the grade, not an absolute value).
      id: "olympiad", weight: 2, when: (g) => g.grade >= 3 && g.grade <= 9 && zOf(g, ["math"]) > 0.8 && !g.dropoutActive(), choices: 2,
      run: (g, i) => {
        if (i === 1) return "r1";
        if (g.rng() < clamp(0.1 + zOf(g, ["math"]) * 0.15, 0.1, 0.7)) { studyBoost(g, "math", 0.06); bump(g, { motivation: 10, stress: 4 }); return "r0a"; }
        bump(g, { stress: 6 }); return "r0b";
      },
    },
    {
      id: "smartphone", weight: 3, when: (g) => g.grade >= 4 && g.grade <= 7 && !g.flags.phone, choices: 2,
      run: (g, i) => {
        g.flags.phone = 1;
        if (i === 0) { bump(g, { stress: -6, motivation: -5 }); return "r0"; }
        studyBoost(g, "kor", 0.03); bump(g, { motivation: 4, stress: 3 }); return "r1";
      },
    },
    {
      id: "daechi", weight: 2, when: (g) => g.grade >= 3 && g.grade <= 8 && (g.family === "q4" || g.family === "q5") && !g.flags.daechi && g.region !== "gangnam", choices: 2,
      run: (g, i) => {
        g.flags.daechi = 1;
        // Answered after this turn's other events: a layoff or a loss may have ended the plan.
        if (i === 1 || !(g.family === "q4" || g.family === "q5") || g.parents === "care") { bump(g, { stress: -3 }); return "r1"; }
        g.relocate("gangnam"); // the new kid at school, which makes bullying likelier for a while
        for (const s of ["kor", "math", "eng"]) studyBoost(g, s, 0.03);
        bump(g, { stress: 8, motivation: 5 }); return "r0";
      },
    },
    // ----- regions -----
    // 2017: the Pohang earthquake cracked school buildings and pushed that year's 수능 back a week.
    {
      id: "quake", weight: 1, when: (g) => g.region === "pohang" && !g.flags.quake,
      run: (g) => { g.flags.quake = 1; bump(g, { stress: 10 }); g.lostBlocks += 1; return "r"; },
    },
    // Jeju sits in the path of most typhoons that reach Korea; school closes for a day or two.
    {
      id: "typhoon", weight: 1, when: (g) => g.region === "jeju" && g.inSchool() && !g.dropoutActive(),
      run: (g) => { studyBoost(g, pickWeak(g), 0.02); bump(g, { stress: 3 }); return "r"; },
    },
    { id: "beach", weight: 1, when: (g) => (REGION_BY_ID[g.region] || {}).view === "sea", run: (g) => { bump(g, { stress: -10, health: 4 }); return "r"; } },
    { id: "country", weight: 1, when: (g) => regionKind(g) === "rural", run: (g) => { bump(g, { stress: -8, health: 6 }); return "r"; } },
    {
      // 선행학습: studying years ahead of the school curriculum, the norm in Gangnam's academies.
      id: "ahead", weight: 1.5, when: (g) => ["gangnam", "seoulAcad", "seoul"].indexOf(regionKind(g)) >= 0 && g.grade >= 4 && g.grade <= 9, choices: 2,
      run: (g, i) => {
        if (i === 0) { studyBoost(g, "math", 0.05); bump(g, { stress: 7, motivation: -2 }); return "r0"; }
        bump(g, { stress: -3 }); return "r1";
      },
    },
    {
      id: "commute", weight: 1.5, when: (g) => regionKind(g) === "rural" && g.grade >= 7 && g.inSchool() && !g.dropoutActive(), choices: 2,
      run: (g, i) => {
        if (i === 0) { studyBoost(g, pickWeak(g), 0.04); bump(g, { health: -6, stress: 3 }); return "r0"; }
        bump(g, { motivation: -2 }); return "r1";
      },
    },
    {
      id: "quota-news", weight: 100, when: (g) => g.grade === 9 && g.localQuota() && !g.flags.quotaNews,
      run: (g) => { g.flags.quotaNews = 1; bump(g, { motivation: 4 }); return "r"; },
    },
    {
      // 의대 지방 유학: capital-region families moving out so their child qualifies for a regional
      // medical school's local quota, which needs middle and high school in the region.
      id: "med-move", weight: 1.5, choices: 2,
      when: (g) => (REGION_BY_ID[g.region] || {}).capital && (g.family === "q4" || g.family === "q5") && g.grade >= 4 && g.grade <= 6 && !g.flags.medMove && g.skills.math > g.skills.kor,
      run: (g, i) => {
        g.flags.medMove = 1;
        if (i === 0 && (g.family === "q4" || g.family === "q5") && g.parents !== "care") { g.relocate("daegu"); bump(g, { stress: 6, motivation: 4 }); return "r0"; }
        return "r1";
      },
    },
    // ----- leaving school (자퇴) -----
    // 검정고시, the school-equivalency exam: open six months after you leave, held twice a year (so a
    // retry waits four months or more). Easy for most, but it has to be passed before you can sit 수능;
    // in grade 12 you'd sit the September paper with nothing else on, so it always passes then.
    {
      id: "ged", weight: 100, choices: 2,
      when: (g) => g.dropout != null && !g.flags.ged && g.clock - g.dropout >= 6 && g.clock - (g.flags.gedTry == null ? -99 : g.flags.gedTry) >= 4,
      run: (g, i) => {
        g.flags.gedTry = g.clock;
        g.flags.gedN = (g.flags.gedN || 0) + 1;
        // Pass rates run 85–90% a sitting (Seoul, 2024–25): an average candidate passes first time.
        let p = 0.78 + 0.15 * g.standing() + (g.flags.gedN - 1) * 0.1;
        // Cramming for it pays off, but takes a block from next turn.
        if (i === 0) { p += 0.25; g.lostBlocks += 1; }
        if (g.status === "hs3" && g.month >= 8) p = 1;
        if (g.rng() < p) {
          g.flags.ged = g.clock;
          bump(g, { motivation: 6, stress: -6 });
          g.addLog("log.ged", { n: g.flags.gedN }, "milestone");
          return "pass" + i;
        }
        bump(g, { motivation: -5, stress: 5 });
        return "fail" + i;
      },
    },
    // With 검정고시 passed by grade 11, you can sit 수능 a year early (pushed by nextTurn, so never rolled).
    {
      id: "early", weight: 0, when: () => false, choices: 2,
      run: (g, i) => {
        if (i === 1) return "r1";
        g.grade = 12;
        g.status = "hs3";
        g.flags.early = 1;
        bump(g, { motivation: 6, stress: 6 });
        g.addLog("log.early", { y: g.year }, "milestone");
        return "r0";
      },
    },
    // No classmates: with no time for friends, the days get lonely.
    {
      id: "lonely", weight: 2, when: (g) => g.dropoutActive() && !(g.lastPlan && g.lastPlan.friends), choices: 2,
      params: (g) => one(g.friendPick(g.srng("lonely"), { here: false, min: 15 })),
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -10, motivation: 4 }); g.lostBlocks += 1; return "r0"; }
        bump(g, { stress: 6, motivation: -5 }); return "r1";
      },
    },
    // Relatives at Chuseok ask why you aren't at school.
    {
      id: "chuseok", weight: 1.5, when: (g) => g.dropout != null && g.attempt === 1 && !g.flags.chuseok && g.month >= 6 && g.month <= 9, choices: 2,
      run: (g, i) => {
        g.flags.chuseok = 1;
        if (i === 0) { bump(g, { stress: 4, motivation: 6 }); return "r0"; }
        bump(g, { stress: -2, motivation: -2 }); g.money += 100000; return "r1";
      },
    },
    // ----- school types -----
    {
      id: "dorm", weight: 1.5, when: (g) => g.atSchool("intlMid", "autoHigh", "sciHigh", "langHigh"), choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -8, motivation: -2 }); return "r0"; }
        studyBoost(g, pickWeak(g), 0.03); bump(g, { stress: 3 }); return "r1";
      },
    },
    {
      id: "rne", weight: 2, when: (g) => g.atSchool("sciHigh") && !g.flags.rne, choices: 2,
      run: (g, i) => {
        g.flags.rne = 1;
        if (i === 0) { studyBoost(g, "math", 0.04); studyBoost(g, "inq2", 0.04); bump(g, { stress: 5, motivation: 4 }); return "r0"; }
        bump(g, { stress: -3 }); return "r1";
      },
    },
    {
      id: "recital", weight: 2, when: (g) => g.atSchool("artsHigh"), choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { motivation: 10, stress: -4 }); g.lostBlocks += 1; return "r0"; }
        bump(g, { motivation: 2 }); return "r1";
      },
    },
    { id: "intern", weight: 2, when: (g) => g.atSchool("vocHigh") && g.grade >= 11, run: (g) => { g.money += 600000; bump(g, { motivation: 4, stress: -2 }); return "r"; } },
    // Everyone at an elite high school was top of their class; the first exams sort that out.
    {
      id: "rankshock", weight: 100, when: (g) => g.atSchool("autoHigh", "sciHigh", "langHigh") && g.grade === 10 && !g.flags.rankShock,
      run: (g) => { g.flags.rankShock = 1; bump(g, { motivation: -6, stress: 6 }); return ["r", { id: g.schoolInfo().id }]; },
    },
    { id: "immersion", weight: 2, when: (g) => g.atSchool("privElem"), run: (g) => { studyBoost(g, "eng", 0.03); bump(g, { motivation: 3 }); return "r"; } },
    // The one-off bully event from v2. It never rolls any more (bully-start replaced it); it stays so a
    // save made before v2.3 can still answer one that's waiting in its queue and show its old log lines.
    {
      id: "bully", weight: 0, when: () => false, choices: 3,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -4, motivation: 2 }); return "r0"; }
        if (i === 1) { if (g.rng() < 0.5) { bump(g, { stress: -6, motivation: 4 }); return "r1a"; } bump(g, { stress: 8, health: -6 }); return "r1b"; }
        bump(g, { stress: 10, motivation: -4 }); return "r2";
      },
    },
    // ----- bullying (학교폭력): a condition that lasts until it's resolved -----
    // bully-start sets g.bully = { lv, n, sup }: severity 1–3, turns it has lasted, and whether someone
    // is supporting you (parents who know, a counselor, friends). While it lasts, advance() slows study
    // and wears down stress, motivation and health, and severity 3 costs a block a turn (skipped school
    // days). Every turn brings a forced follow-up (bully-on, or bully-bad at severity 3) where you pick
    // what to do; the odds differ by choice. It also ends when classes are reshuffled in March or you
    // change school stage (see nextTurn), and for good when you leave high school.
    {
      id: "bully-start", weight: bullyWeight, choices: 4, params: (g) => g.pickBully(),
      when: (g) => !g.bully && g.inSchool() && !g.dropoutActive() && g.grade >= 3 && g.grade <= 11 && g.clock - (g.flags.bullyEnd == null ? -99 : g.flags.bullyEnd) >= 12,
      run: (g, i) => {
        // Middle school is when it most often turns into a group thing.
        g.bully = { lv: g.rng() < (g.status === "mid" ? 0.4 : 0.25) ? 2 : 1, n: 0, sup: 0 };
        g.flags.bullyN = (g.flags.bullyN || 0) + 1;
        let x;
        // Speaking up rarely ends it overnight, but it starts things moving and an adult knows.
        if (i === 0) x = bullyStep(g, 0.25, 0.15, 0.1); // tell the homeroom teacher
        else if (i === 1) { g.bully.sup = 1; bump(g, { stress: -4 }); x = bullyStep(g, 0.25, 0.15, 0.15); } // parents: on your side, but their call can backfire
        else if (i === 2) { bump(g, { health: -5, stress: 4 }); x = bullyStep(g, 0.3, 0.05, 0.35); } // fight back
        else { bump(g, { motivation: -3 }); x = bullyStep(g, 0.05, 0.05, 0.35); } // keep quiet
        return ["r" + i, { x }];
      },
    },
    {
      id: "bully-on", weight: 100, choices: 5, params: (g) => g.bullyParams(),
      when: (g) => !!g.bully && g.bully.lv < 3 && bullyFollowUp(g),
      run: (g, i, q) => {
        const friends = !!(g.lastPlan && g.lastPlan.friends);
        const t = longTurn(g);
        let x;
        if (i === 0) { bump(g, { stress: 5 }); x = bullyStep(g, 0.45 + t, 0.25, 0.12); } // report to the school violence committee: draining, but it works
        else if (i === 1) { g.bully.sup = 1; bump(g, { stress: -10, motivation: 3 }); x = bullyStep(g, 0.15 + t, 0.35, 0.08); } // Wee class counselor
        else if (i === 2) {
          if (friends) g.bully.sup = 1;
          bump(g, { stress: friends ? -8 : -2 });
          x = bullyStep(g, (friends ? 0.2 : 0.08) + t, friends ? 0.35 : 0.15, 0.1);
          // The friend who stood by you is a closer friend for it.
          if (friends && q && q.fr) g.closer(q.fr.id, 8);
        }
        else if (i === 3) { bump(g, { health: -6, stress: 4 }); x = bullyStep(g, 0.3 + t, 0.05, 0.35); } // fight back
        else { bump(g, { motivation: -4 }); x = bullyStep(g, 0.08 + t, 0.07, 0.35); } // endure: it usually gets worse
        return ["r" + i, { x, f: friends }];
      },
    },
    {
      id: "bully-bad", weight: 100, choices: 4, params: (g) => g.bullyParams(),
      when: (g) => !!g.bully && g.bully.lv >= 3 && bullyFollowUp(g),
      run: (g, i) => {
        const t = longTurn(g);
        let x;
        if (i === 0) { bump(g, { stress: 6 }); x = bullyStep(g, 0.6 + t, 0.2, 0.05); } // the committee, with your parents and the evidence
        else if (i === 1) {
          // Changing schools almost always ends it, at the cost of a fresh start: new classmates, catching up, a lost block.
          bump(g, { stress: 6, motivation: -6 });
          g.lostBlocks += 1;
          g.flags.moved = g.clock;
          if (g.rng() < 0.85) { endBully(g); x = "stop"; } else { g.bully.lv = 1; x = "ease"; }
          // A new school: new classmates.
          const st = g.classStage();
          if (st) g.newClass(st, "transfer");
        }
        else if (i === 2) { g.bully.sup = 1; bump(g, { stress: -10, motivation: 3 }); x = bullyStep(g, 0.15 + t, 0.4, 0.05); }
        else { bump(g, { motivation: -5, health: -4 }); x = bullyStep(g, 0.05 + t, 0.1, 0); }
        return ["r" + i, { x }];
      },
    },
    {
      id: "president", weight: 1, when: (g) => g.grade >= 4 && g.grade <= 11 && !g.dropoutActive(), choices: 2,
      run: (g, i) => {
        if (i === 1) return "r1";
        // In high school a class office goes on the record (공동체역량: leadership).
        if (g.rng() < 0.45) { bump(g, { motivation: 8, stress: 4 }); if (g.recordOpen()) g.record.comm += 6; return "r0a"; }
        bump(g, { stress: 5, motivation: -2 }); return "r0b";
      },
    },
    { id: "career", weight: 100, when: (g) => g.grade === 7 && g.month === 3 && !g.flags.career && !g.dropoutActive(), run: (g) => { g.flags.career = 1; bump(g, { motivation: 8 }); return "r"; } },
    // ----- the school record (v6.0) -----
    // High 1, the first weeks: the 진로 survey asks what you want to study (it goes on the record and
    // 진로역량 is judged against it), and the club fair.
    {
      id: "jinro", weight: 100, choices: 4, when: (g) => !!g.record && !g.record.field && g.recordOpen(),
      run: (g, i) => {
        g.record.field = ["med", "sci", "hum", "biz"][i];
        bump(g, { motivation: 4 });
        g.addLog("log.field", { f: g.record.field }, "event");
        return "r" + i;
      },
    },
    {
      id: "club-pick", weight: 100, choices: 3, when: (g) => !!g.record && !g.record.club && g.recordOpen(),
      run: (g, i) => {
        g.record.club = ["acad", "vol", "fun"][i];
        bump(g, { stress: -2, motivation: 2 });
        return "r" + i;
      },
    },
    // A field that doesn't fit your track (medicine on the humanities track) reads oddly to a 종합
    // reader. Switching keeps some of what you've done.
    {
      id: "jinro-change", weight: 1.5, choices: 2,
      when: (g) => g.recordOpen() && !!g.track && !!g.record.field && FIELDS[g.record.field] !== g.track && !g.flags.jinroChange,
      run: (g, i) => {
        g.flags.jinroChange = 1;
        if (i === 1) return "r1";
        g.record.field = g.track === "sci" ? "sci" : "hum";
        g.record.career *= 0.6;
        g.addLog("log.field", { f: g.record.field, change: 1 }, "event");
        return ["r0", { f: g.record.field }];
      },
    },
    // A teacher's project or presentation (수행평가): going deep is what 세특 is written from.
    {
      id: "seteuk", weight: 2, choices: 2, when: (g) => g.recordOpen() && (g.status !== "hs3" || g.month <= 7),
      run: (g, i) => {
        if (i === 0) { g.record.sete += 3; g.record.career += 2 * g.fieldFit(); g.lostBlocks += 1; bump(g, { stress: 4, motivation: 3 }); return "r0"; }
        g.record.sete += 0.5; bump(g, { stress: -2 }); return "r1";
      },
    },
    // The 종합 interview after the 수능 (pushed by dismiss when a document round was passed).
    {
      id: "interview", weight: 0, when: () => false, choices: 3,
      run: (g, i) => {
        if (g.susi) g.susi.iv = IV_PREP[i];
        if (i === 2) bump(g, { stress: -5 }); else bump(g, { stress: 2 });
        return "r" + i;
      },
    },
    {
      id: "jung2", weight: 100, when: (g) => g.grade === 8 && !g.flags.jung2, choices: 2,
      run: (g, i) => {
        g.flags.jung2 = 1;
        if (i === 0) { bump(g, { motivation: -10, stress: -8 }); return "r0"; }
        bump(g, { motivation: 5, stress: -3 }); return "r1";
      },
    },
    // ----- school years and beyond -----
    {
      id: "pcbang", weight: 3, when: (g) => g.grade >= 7 && g.status !== "academy", choices: 2,
      params: (g) => one(g.friendPick(g.srng("pc"), { min: 15, tag: "gamer" }) || g.friendPick(g.srng("pc2"), { min: 15 })),
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -12, motivation: -4 }); return "r0"; }
        bump(g, { stress: 4, motivation: 3 }); studyBoost(g, pickWeak(g), 0.03); return "r1";
      },
    },
    { id: "cold", luck: -1, weight: (g) => 2 * g.trait("ill"), when: () => true, run: (g) => { bump(g, { health: -18, stress: 4 }); return "r"; } },
    { id: "flu", luck: -1, weight: (g) => g.trait("ill"), when: (g) => g.health < 45, run: (g) => { bump(g, { health: -25, stress: 6 }); g.lostBlocks += 2; return "r"; } },
    {
      id: "star", weight: 2, when: (g) => g.grade >= 10 && g.money >= 300000, choices: 2,
      run: (g, i) => {
        // Checked again here: another event this turn may have spent the money since the offer appeared.
        if (i === 0 && g.money >= 300000) { g.money -= 300000; studyBoost(g, "math", 0.06); bump(g, { motivation: 6 }); return "r0"; }
        return i === 0 ? "r0x" : "r1";
      },
    },
    {
      id: "nag", weight: 2, when: (g) => g.flags.phone && g.status !== "halfretake", choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { motivation: 6, stress: 3 }); return "r0"; }
        bump(g, { stress: 9, motivation: -3 }); return "r1";
      },
    },
    {
      id: "crush", weight: 1.5, when: (g) => g.grade >= 8 && g.age <= 20, choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -15, motivation: g.rng() < 0.5 ? 8 : -8 }); return g.motivation > 55 ? "r0a" : "r0b"; }
        bump(g, { motivation: 4, stress: 3 }); return "r1";
      },
    },
    { id: "rival", weight: 1.5, when: (g) => g.grade >= 7, params: (g) => one(g.person(g.soc().rival)), run: (g) => { bump(g, { motivation: 8, stress: 5 }); return "r"; } },
    {
      id: "slump", weight: 1.5, when: (g) => g.grade >= 7 && g.stress > 60, choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -20, motivation: 5 }); g.money -= Math.min(g.money, 80000); return "r0"; }
        bump(g, { stress: 8, health: -6 }); return g.rng() < 0.4 ? "r1a" : "r1b";
      },
    },
    {
      id: "burnout", weight: 3, when: (g) => g.stress >= 85,
      run: (g) => { bump(g, { motivation: -15, health: -10, stress: -10 }); g.lostBlocks += 2; return "r"; },
    },
    { id: "notes", weight: 1.5, when: (g) => g.grade >= 10, run: (g) => { const s = pickStrong(g); studyBoost(g, s, 0.03); return ["r", { s }]; } },
    {
      id: "family-money", weight: 1, when: (g) => g.grade >= 4 && (g.family === "q1" || g.family === "q2"),
      run: (g) => { bump(g, { stress: 6 }); g.money = Math.max(0, g.money - 200000); return "r"; },
    },
    { id: "grandma", luck: 1, weight: 1, when: () => true, run: (g) => { g.money += 200000; bump(g, { motivation: 5, stress: -4 }); return "r"; } },
    { id: "insomnia", weight: (g) => 1.2 * g.trait("insomnia"), when: (g) => g.grade >= 7 && g.stress > 55, run: (g) => { bump(g, { health: -10 }); return "r"; } },
    {
      id: "festival", weight: 1, when: (g) => g.dropout == null && ((g.status === "hs3" && (g.month === 5 || g.month === 10)) || g.status === "high"), choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -14, motivation: 4 }); if (g.recordOpen()) g.record.comm += 1; return "r0"; }
        studyBoost(g, pickWeak(g), 0.025); bump(g, { stress: 4 }); return "r1";
      },
    },
    {
      id: "d100", weight: 100, when: (g) => g.grade >= 12 && g.month === 8 && !g.flags["d100-" + g.attempt],
      run: (g) => { g.flags["d100-" + g.attempt] = 1; bump(g, { motivation: 10, stress: 6 }); return "r"; },
    },
    {
      id: "retaker-doubt", weight: 2, when: (g) => g.attempt >= 2, choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { motivation: 5, stress: 5 }); return "r0"; }
        bump(g, { motivation: -8, stress: 6 }); return "r1";
      },
    },
    { id: "phone-broke", weight: 1, when: (g) => g.flags.phone, run: (g) => { bump(g, { motivation: 6 }); return "r"; } },
    { id: "mentor", weight: 1, when: (g) => g.status === "academy", run: (g) => { bump(g, { motivation: 8 }); return "r"; } },
    {
      id: "campus", weight: 1.5, when: (g) => g.status === "halfretake", choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -12, motivation: -6 }); return "r0"; }
        studyBoost(g, pickWeak(g), 0.03); bump(g, { stress: 5 }); return "r1";
      },
    },
    { id: "insight", luck: 1, weight: 1, when: (g) => g.motivation > 60, run: (g) => { const s = pickWeak(g); studyBoost(g, s, 0.04); return ["r", { s }]; } },
    // ----- people (social: rollSocial picks these from its own stream; never the main pool) -----
    // who(g, r) picks the people (null: nobody fits, so nothing happens); run(g, i, q) gets them back.
    // forced: pushed by the engine itself (a new class, a mock, the 수능 gate), never rolled.
    // A new class: whoever sits next to you (짝꿍).
    { id: "soc-seatmate", social: true, forced: true, anyStage: true, weight: 0, when: () => false,
      run: (g, i, q) => { g.closer(q.a.id, 12); bump(g, { stress: -2 }); return "r." + q.st; } },
    // Kindergarten: a playdate in the sandpit.
    { id: "soc-playdate", social: true, early: true, weight: 3, when: (g) => g.atKinder(),
      who: (g, r) => one(g.friendPick(r, { here: true })),
      run: (g, i, q) => { g.closer(q.a.id, 10); bump(g, { stress: -3, motivation: 2 }); return "r"; } },
    // A birthday party (a kids' café in elementary school, a karaoke room in middle school).
    { id: "soc-birthday", social: true, anyStage: true, weight: 3, choices: 2, when: (g) => (g.atKinder() || g.inClass()) && g.grade <= 9,
      who: (g, r) => { const p = g.friendPick(r, { here: true, min: 12 }); return p && { a: ref(p), t: g.grade >= 7 ? 1 : 0 }; },
      run: (g, i, q) => {
        if (i === 0) { g.closer(q.a.id, 12); bump(g, { stress: -5, motivation: 2 }); return "r0"; }
        g.closer(q.a.id, -6); bump(g, { stress: 1 }); return "r1";
      } },
    // A fight with a friend, and maybe a cold war (made up later in soc-makeup).
    { id: "soc-fight", social: true, weight: 2, choices: 2, when: (g) => g.inClass() && g.grade >= 2 && !g.social.people.some((p) => p.fight != null),
      who: (g, r) => { const p = g.friendPick(r, { here: true, min: GROUP }); return p && { a: ref(p), why: Math.floor(r() * 3) }; },
      run: (g, i, q) => {
        if (i === 0) { g.closer(q.a.id, 6); bump(g, { stress: -2 }); return "r0"; }
        const p = g.person(q.a.id);
        if (p && (p.tr.indexOf("kind") >= 0 || g.srng("fight", p.id)() < 0.4)) { g.closer(p.id, 4); return "r1a"; }
        if (p) { p.fight = g.clock; g.closer(p.id, -15); }
        bump(g, { stress: 5, motivation: -2 });
        return "r1b";
      } },
    { id: "soc-makeup", social: true, weight: (g) => (g.social && g.social.people.some((p) => p.fight != null) ? 8 : 0), when: () => true,
      who: (g) => one(g.social.people.find((p) => p.fight != null)),
      run: (g, i, q) => { const p = g.person(q.a.id); if (p) delete p.fight; g.closer(q.a.id, 14); bump(g, { stress: -4, motivation: 2 }); return "r"; } },
    // A friend's family moves away.
    { id: "soc-moveaway", social: true, weight: 1.2, choices: 2, when: (g) => g.inClass() && g.grade <= 11,
      who: (g, r) => {
        const p = g.friendPick(r, { here: true, min: 30 });
        const to = REGIONS.filter((x) => x.id !== g.region);
        return p && { a: ref(p), to: to[Math.floor(r() * to.length)].id };
      },
      run: (g, i, q) => {
        const p = g.person(q.a.id);
        if (p) { p.here = false; p.away = g.clock; if (i === 0) p.keep = 1; }
        if (g.social.focus === q.a.id) g.social.focus = null;
        if (i === 0) g.closer(q.a.id, 5);
        bump(g, { stress: 4, motivation: -2 });
        return "r" + i;
      } },
    // A friend who moved (or a best friend from an old school) keeps in touch.
    { id: "soc-letter", social: true, weight: 2, when: () => true,
      who: (g, r) => { const p = g.friendPick(r, { here: false, min: 30, keep: true }); return p && { a: ref(p), t: g.grade >= 7 ? 1 : 0 }; },
      run: (g, i, q) => { g.closer(q.a.id, 10); bump(g, { stress: -3, motivation: 1 }); return "r"; } },
    // Group study (스터디) with a studious friend.
    { id: "soc-study", social: true, weight: 2.5, choices: 2, when: (g) => g.grade >= 7 && (g.inClass() || g.status === "academy"),
      who: (g, r) => one(g.friendPick(r, { here: true, min: 25, tag: "studious" })),
      run: (g, i, q) => {
        if (i === 1) return "r1";
        const s = pickWeak(g);
        studyBoost(g, s, 0.03);
        g.closer(q.a.id, 8);
        bump(g, { stress: 2, motivation: 3 });
        return ["r0", { s }];
      } },
    // Friends plan something after exams: the beach, a karaoke room, a theme park.
    { id: "soc-group", social: true, weight: 1.5, choices: 2, when: (g) => g.grade >= 7 && g.grade <= 11 && g.inClass(),
      who: (g, r) => {
        const ps = g.social.people.filter((p) => p.here && p.cl >= 25 && p.id !== g.social.bully).sort((a, b) => b.cl - a.cl);
        return ps.length >= 2 ? { a: ref(ps[0]), b: ref(ps[1]), k: Math.floor(r() * 3) } : null;
      },
      run: (g, i, q) => {
        if (i === 1) { bump(g, { stress: 2 }); return "r1"; }
        g.money -= Math.min(g.money, 30000);
        g.closer(q.a.id, 6); g.closer(q.b.id, 6);
        bump(g, { stress: -10, motivation: 2 });
        return "r0";
      } },
    // A crush, and a confession (고백). From Middle 2; at a boys' or girls' school it's someone from
    // outside school.
    { id: "soc-crush", social: true, weight: (g) => (g.social && g.social.partner == null ? 1.6 : 0), choices: 2, when: (g) => g.grade >= 8 && g.age <= 20,
      who: (g, r) => { const p = g.romancePick(r); return p && { a: ref(p), out: p.out || null, again: g.social.crush === p.id ? 1 : 0 }; },
      run: (g, i, q) => {
        const p = g.person(q.a.id);
        if (!p) return "r1";
        if (i === 1) { g.social.crush = p.id; bump(g, { motivation: 2, stress: 2 }); return "r1"; }
        if (g.srng("confess", p.id)() < 0.3 + p.cl / 160 + (p.like || 0)) { g.startDating(p); bump(g, { stress: -6, motivation: 4 }); return "r0a"; }
        g.social.crush = null;
        g.closer(p.id, -10);
        bump(g, { stress: 8, motivation: -3 });
        return "r0b";
      } },
    // Someone confesses to you.
    { id: "soc-confessed", social: true, weight: (g) => (g.social && g.social.partner == null ? 0.8 : 0), choices: 2, when: (g) => g.grade >= 9 && g.age <= 20,
      who: (g, r) => { const p = g.romancePick(r, true); return p && { a: ref(p), out: p.out || null }; },
      run: (g, i, q) => {
        const p = g.person(q.a.id);
        if (!p) return "r1";
        if (i === 0) { g.startDating(p); bump(g, { stress: -5, motivation: 3 }); return "r0"; }
        g.closer(p.id, -8); bump(g, { stress: 1 }); return "r1";
      } },
    { id: "soc-date", social: true, weight: (g) => (g.social && g.social.partner != null ? 3 : 0), when: () => true,
      who: (g, r) => { const p = g.person(g.social.partner); return p && { a: ref(p), k: Math.floor(r() * 3) }; },
      run: (g, i, q) => { g.closer(q.a.id, 8); bump(g, { stress: -7, motivation: 1 }); return "r"; } },
    // Before the exam: break up to focus, or stay together.
    { id: "soc-breakup", social: true, choices: 2, when: (g) => g.status === "hs3" || g.attempt >= 2 || g.grade === 11,
      weight: (g) => { const p = g.social && g.person(g.social.partner); return p && p.cl >= 35 ? 2 : 0; },
      who: (g) => one(g.person(g.social.partner)),
      run: (g, i) => {
        if (i === 0) { g.endDating("you"); bump(g, { stress: 8, motivation: 4 }); return "r0"; }
        bump(g, { stress: -3, motivation: -1 }); return "r1";
      } },
    // Neglected, they end it.
    { id: "soc-dumped", social: true, when: () => true,
      weight: (g) => { const p = g.social && g.person(g.social.partner); return p && p.cl < 35 ? 4 : 0; },
      who: (g) => one(g.person(g.social.partner)),
      run: (g) => { g.endDating("them"); bump(g, { stress: 10, motivation: -4 }); return "r"; } },
    // Old friends from elementary or middle school get together.
    { id: "soc-reunion", social: true, weight: 1.5, choices: 2, when: (g) => (g.grade >= 10 || g.attempt >= 2) && !g.dropoutActive(),
      who: (g) => {
        const ps = g.social.people.filter((p) => !p.here && (p.st === "elem" || p.st === "kinder" || p.st === "mid") && p.cl >= 5 && p.id !== g.social.bully).sort((a, b) => b.cl - a.cl);
        return ps.length >= 2 ? { a: ref(ps[0]), b: ref(ps[1]) } : null;
      },
      run: (g, i, q) => {
        if (i === 1) return "r1";
        g.closer(q.a.id, 15); g.closer(q.b.id, 15);
        g.lostBlocks += 1;
        bump(g, { stress: -10, motivation: 2 });
        return "r0";
      } },
    // Retake years: your school friends have moved on, and one of them calls.
    { id: "soc-afterschool", social: true, weight: 2.5, choices: 2, when: (g) => g.attempt >= 2,
      who: (g, r) => {
        const p = g.person(g.social.best) || g.friendPick(r, { here: false, min: 30 });
        if (!p || p.st === "academy") return null;
        const f = g.fateOf(p);
        return { a: ref(p), path: f.path, uni: f.uni };
      },
      run: (g, i, q) => {
        if (i === 0) { g.closer(q.a.id, 10); g.lostBlocks += 1; bump(g, { stress: -10, motivation: 3 }); return "r0"; }
        g.closer(q.a.id, -6); bump(g, { motivation: 1 }); return "r1";
      } },
    // The rival: the semester's class ranks (middle school) and mocks (high school and retakes).
    { id: "soc-rivalrank", social: true, forced: true, weight: 0, when: () => false,
      run: (g, i, q) => { const win = q.me < q.them; bump(g, win ? { motivation: 2, stress: -1 } : { motivation: 3, stress: 3 }); return win ? "rw" : "rl"; } },
    { id: "soc-rivalmock", social: true, forced: true, weight: 0, when: () => false, choices: 1,
      run: (g, i, q) => {
        const m = g.mocks[g.mocks.length - 1], p = q && g.person(q.a.id);
        if (!m || !p) return "rx";
        const x = m.subjects;
        const me = Math.round((x.kor.pct + x.math.pct + (x.inq1.pct + x.inq2.pct) / 2) / 3);
        const them = clamp(Math.round(phi(g.thNow(p) + g.srng("rivalmock", p.id).normal() * 0.25) * 100), 1, 99);
        const win = me >= them;
        bump(g, win ? { motivation: 2, stress: -1 } : { motivation: 3, stress: 3 });
        return [win ? "rw" : "rl", { me, them }];
      } },
    // 수능 morning: someone at the gate for you (or a message, in a retake year).
    { id: "soc-gate", social: true, forced: true, weight: 0, when: () => false,
      run: (g, i, q) => { bump(g, { stress: -3 }); return "r." + q.k; } },
  ];
  // run() result → { key, p } message.
  function outcome(id, r) {
    return Array.isArray(r) ? { key: "ev." + id + "." + r[0], p: r[1] } : { key: "ev." + id + "." + r, p: null };
  }

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
  // Leaving care: the settlement goes into your savings, and the 자립수당 starts (see grossBudget).
  function leaveCare(g, key) {
    g.flags.careLeft = g.clock;
    const a = g.careSettlement();
    g.money += a;
    g.addLog("log.careLeave", { a, pay: CARE_PAY }, "milestone");
    bump(g, { stress: 6, motivation: 4 });
    g.lostBlocks += 1;
    return [key, { a, pay: CARE_PAY }];
  }
  function studyBoost(g, s, amount) {
    g.skills[s] += amount * headroom(g.skills[s]) * 1.5;
  }
  // ---------- bullying ----------
  // How likely bullying is to start this turn, relative to the other events. Per year, elementary school
  // is the peak and high school the low; the stage factor also allows for turn length (a year in
  // elementary school, a semester in middle school, a season in high school). Being the new kid (a
  // move, a transfer) doubles it for a year, having no time for friends makes you an easier target,
  // and each earlier episode halves it. Tuned so roughly a quarter to a third of lives meet it.
  function bullyWeight(g) {
    // Victimization peaks in elementary school (4.2% a year in 2024, then 1.6% middle, 0.5% high), so
    // per turn: a year in elementary, a semester in middle school, a season in high school.
    const stage = g.status === "elem" ? BULLY_STAGE.elem : g.status === "mid" ? BULLY_STAGE.mid : BULLY_STAGE.high;
    const newKid = g.flags.moved != null && g.clock - g.flags.moved <= 12 ? 2 : 1;
    const alone = g.lastPlan && !g.lastPlan.friends ? 1.4 : 1;
    return BULLY_BASE * stage * newKid * alone * Math.pow(0.5, g.flags.bullyN || 0) * g.trait("bully");
  }
  const BULLY_BASE = 0.25;
  const BULLY_STAGE = { elem: 2.3, mid: 0.43, high: 0.07 };
  // Leaving school: extra blocks a turn, the motivation baseline it costs, and stress a turn spent alone.
  const DROPOUT_BLOCKS = 2;
  const DROPOUT_MOTIVATION = 8;
  const DROPOUT_LONELY = 3;
  // Follow-ups come every turn while you're still at school (grade 12 included).
  function bullyFollowUp(g) { return g.inSchool() || g.status === "hs3"; }
  // Follow-ups in a turn of six months or more (elementary and middle school) give whatever you try
  // time to work, so stopping is a little likelier.
  function longTurn(g) { return g.turnMonths() >= 6 ? 0.1 : 0; }
  // One roll of how things go: it stops, eases a level, gets worse a level, or stays the same.
  // Returns the result key strings.js uses ("stop" | "ease" | "same" | "worse").
  function bullyStep(g, stop, ease, worse) {
    const b = g.bully;
    const r = g.rng();
    if (r < stop) { endBully(g); return "stop"; }
    if (r < stop + ease) {
      if (b.lv <= 1) { endBully(g); return "stop"; }
      b.lv -= 1; return "ease";
    }
    if (r < stop + ease + worse && b.lv < 3) { b.lv += 1; return "worse"; }
    return "same";
  }
  function endBully(g) {
    g.bully = null;
    g.flags.bullyEnd = g.clock;
  }
  // Saves from before regions existed have none; they play as the capital-region suburbs.
  function regionKind(g) { return (REGION_BY_ID[g.region] || REGION_BY_ID.suwon).kind; }
  // An event's weight is a number or a function of the game.
  const weightOf = (e, g) => {
    if (g.parents === "care" && CARE_SKIP.has(e.id)) return 0;
    const w = typeof e.weight === "function" ? e.weight(g) : e.weight;
    // Good and bad events lean with your fortune (forced events, weight 100+, are never tagged).
    return e.luck ? w * Math.max(0.2, 1 + LUCK_BIAS * (g.luck || 0) * e.luck) : w;
  };

  function inquiryInfo(id) {
    return INQUIRY.soc.concat(INQUIRY.sci).find((x) => x.id === id);
  }
  // Standard normal CDF, for turning ability into a class rank.
  function phi(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  // Diminishing returns: each step up the ladder costs more study than the one below it.
  function headroom(theta) {
    return Math.exp(-0.62 * Math.max(0, theta + 0.8));
  }

  // Ability is on the 수능 scale from day one (0 = the average test taker), and it never decays: a
  // subject you don't study simply stops growing. A 6-year-old starts START_GAP below where an average
  // child of the same talent will be at the exam, and the school years close that gap.
  // SCHOOL_GAIN scales study during grades 1–11, so that childhood habits move you about as far as a
  // year of 고3 studying does at the top end. Both are tuned with sim.js.
  const START_GAP = 2.4;
  const SCHOOL_GAIN = 0.32;
  // Lessons: what a year of classes adds to a subject on its own (before aptitude, how far behind
  // the class you are, attention and headroom). See advance(). Tuned with sim.js.
  const CLASS_YEAR = 0.4;
  const CLASS_FLOOR = 0.4;
  // How far a typical child climbs per school year (sim.js's balanced bot, lessons included): the line
  // class ranks, the GED and how far behind the class you are are measured against.
  const TYPICAL_CLIMB = 0.28;

  // ---------- people: classmates, friends, rivals, crushes, teachers ----------
  // Named people who stay with you through a life (g.social). Everything about them is rolled from
  // their own seeded streams (hashSeed(seed, "soc", ...), see srng), never the main RNG, so a life's
  // events, exams and family fortunes come out the same whether or not you make friends; only their
  // small effects on stress, motivation and study move anything. Saves from before v6.1 have no
  // g.social: soc() builds it the first time it's needed, from the stage the life is at.
  // Surnames by share of the population (%), 2015 census (the top ten are 63.9% of Koreans).
  const SURNAMES = [["김", 21.5], ["이", 14.7], ["박", 8.4], ["최", 4.7], ["정", 4.3], ["강", 2.3], ["조", 2.1], ["윤", 2.1], ["장", 2.0], ["임", 1.7],
    ["한", 1.5], ["오", 1.5], ["서", 1.5], ["신", 1.5], ["권", 1.4], ["황", 1.4], ["안", 1.4], ["송", 1.4], ["전", 1.1], ["홍", 1.1]];
  // Given names popular for children born in the early 2020s, most popular first. The birth-registration
  // name statistics of the Supreme Court's family-registration service put 이준, 도윤, 하준, 은우, 서준 and
  // 서아, 이서, 아윤, 지아, 하윤 on top for 2023–24; the rest of each list is from earlier 2020s rankings
  // and not checked against the source (see data/korea-stats.md). A name's chance falls with its rank.
  const GIVEN = {
    m: ["이준", "도윤", "하준", "서준", "은우", "시우", "지호", "수호", "유준", "예준", "선우", "우진", "연우", "이안", "지우", "건우", "도현", "준우", "시윤", "주원"],
    f: ["서아", "이서", "아윤", "지아", "하윤", "지안", "하은", "아린", "서윤", "시아", "수아", "채아", "윤서", "지유", "하린", "서하", "나은", "유나", "지우", "다인"],
  };
  // Personality traits; each person gets two, and the first is who they mostly are.
  // studious: time with them can turn into studying together (STUDY_TOGETHER). funny / sporty / gamer:
  // what an afternoon with them does to stress, health or motivation. kind: friendships with them grow
  // faster, and they make up first. quiet: slower to warm up, slower to fade. bossy / troubled: the
  // classmates a bully is most often drawn from.
  const PERSONAS = [["studious", 1.2], ["sporty", 1], ["funny", 1], ["kind", 1], ["quiet", 0.9], ["gamer", 0.8], ["artsy", 0.8], ["bossy", 0.5], ["troubled", 0.5]];
  const PERSONA_TH = { studious: 0.5, troubled: -0.4, gamer: -0.1 };
  // How many named classmates a new class brings (the ones who matter, not all 20–30 of them), and how
  // many of your old friends can come along to the next school (middle schools take whole neighbourhoods).
  const CLASS_SIZE = { play: 2, kinder: 4, elem: 6, mid: 6, high: 6, academy: 4, uni: 3 };
  const CARRY = { elem: 1, mid: 2, high: 1 };
  // Where classmates' ability sits (θ at their own 수능): selective schools gather strong students.
  const SCHOOL_TH = { privElem: 0.2, privMid: 0.1, privHigh: 0.1, intlMid: 0.6, autoHigh: 0.7, sciHigh: 1.1, langHigh: 0.8, artsHigh: -0.3, vocHigh: -0.7 };
  // Closeness runs 0–100: a best friend (단짝) from BEST, part of your group from GROUP, and a best
  // friend who falls under DRIFT has drifted away. FRIEND_GAIN: what a block of hanging out adds.
  const BEST = 60, GROUP = 35, DRIFT = 45, FRIEND_GAIN = 10;
  // Studying together: a block with a studious friend also nudges your weakest subject.
  const STUDY_TOGETHER = 0.012;
  // The chance of a social event in a turn, times √(months in the turn).
  const SOCIAL_RATE = 0.18;
  const MAX_PEOPLE = 40;
  // The homeroom teacher (담임), new every March. lessons: multiplier on school lessons; stress: added
  // each turn; mot: on the motivation baseline. Small, and weighted to exactly nothing on average
  // (lessons 1, stress 0, motivation 0), so teachers change a year without moving the balance.
  const TEACHERS = {
    warm: { w: 3, lessons: 1, stress: -1, mot: 0.5 },
    strict: { w: 2, lessons: 1.03, stress: 1, mot: 0 },
    passion: { w: 2, lessons: 1.05, stress: 1, mot: 1 },
    relaxed: { w: 2, lessons: 0.96, stress: -1, mot: -1 },
    tired: { w: 1, lessons: 0.92, stress: 1, mot: -1.5 },
  };
  // Share of homeroom teachers who are women, by school level (an estimate).
  const TEACHER_F = { elem: 0.75, mid: 0.68, high: 0.55, hs3: 0.55 };
  // Where you meet someone when your school is boys' or girls' only.
  const OUTSIDE = ["hagwon", "church", "friend"];
  function pickW(r, list) {
    let x = r() * list.reduce((a, e) => a + e[1], 0);
    for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; }
    return list[list.length - 1][0];
  }
  // A name's weight by rank: the top names are common, the tail still turns up.
  const nameList = (sex) => GIVEN[sex].map((n, i) => [n, 1 / (i + 4)]);
  // What events and log entries carry to name someone: the name itself (strings.js romanizes it in English).
  const ref = (p) => (p ? { id: p.id, s: p.s, n: p.n, x: p.x } : null);
  const one = (p) => (p ? { a: ref(p) } : null);

  // ---------- after the exam: the next ten years (the epilogue) ----------
  // Once a life has ended (g.ending), startEpilogue() plays a few more screens: a major, how you spend
  // university, military service for men, the job hunt (취준), and where you are at 30. Every roll comes
  // from its own seeded stream (hashSeed(seed, "epi", step, ...)), so nothing before the ending moves and
  // the same choices on the same life always give the same result. Figures: data/korea-stats.md
  // sections 13 "After school", 14 "Jobs" and 15 "After university".
  //
  // University tier, by where you enrolled: 0 no university, 1 junior college, 2 other four-year,
  // 3 mid (the flagship nationals and the rest of in-Seoul), 4 top Seoul, 5 SKY, 6 medical school.
  const UNI_TIER = {
    med: 6, snu: 5, yonsei: 5, korea: 5,
    skku: 4, sogang: 4, hanyang: 4, cau: 4, khu: 4, hufs: 4, uos: 4,
    konkuk: 3, dongguk: 3, hongik: 3, pnu: 3, knu: 3, kookmin: 3, soongsil: 3, inha: 3, ajou: 3,
    gachon: 2, regional: 2, college: 1,
  };
  const TIER_IDS = ["none", "college", "low", "mid", "top", "sky", "med"];
  const IN_SEOUL = new Set(["snu", "yonsei", "korea", "skku", "sogang", "hanyang", "cau", "khu", "hufs", "uos", "konkuk", "dongguk", "hongik", "kookmin", "soongsil"]);
  // Graduate employment rate by field (MOE 2024 graduate employment statistics, %), turned into a
  // logit nudge against the 69.5% overall rate. "health" is nursing and pharmacy; MOE's medicine field
  // covers both it and medical school.
  const FIELD_EMP = { hum: 61.1, soc: 69.0, edu: 71.1, eng: 70.4, nat: 65.4, arts: 66.7, health: 79.4, med: 79.4 };
  const logit = (p) => Math.log(p / (1 - p));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const FIELD_PT = Object.fromEntries(Object.entries(FIELD_EMP).map(([k, v]) => [k, logit(v / 100) - logit(0.695)]));
  // Majors on offer by track (the humanities track can't take engineering or nursing in 정시).
  const FIELDS_FOR = { soc: ["soc", "hum", "edu", "arts"], sci: ["eng", "nat", "health", "edu", "arts"] };
  // How you spend university: GPA (on 4.5), 스펙 (internships, certificates, languages), extra years.
  // The exchange semester costs money: open to a middle-income family or above, or ₩5M of savings.
  const COLLEGE_PLANS = {
    library: { gpa: 0.35, spec: 0, years: 0 },
    balance: { gpa: 0.1, spec: 0.5, years: 0 },
    exchange: { gpa: 0, spec: 1, years: 0.5, money: 5000000 },
    gap: { gpa: 0, spec: 0.8, years: 1 },
    campus: { gpa: -0.25, spec: 0.3, years: 0 },
  };
  // Military service for men (현역 lengths in 2026, months): army and marines 18, navy 20, air force 21;
  // social service (사회복무요원, grade 4 at the draft physical) 21; alternative service (대체복무,
  // conscientious objectors, in prisons) 36; 군의관 (military doctor, after residency) 36 + about 2 of
  // training. spec: time for certificates and English (air force), gpa: the 복학생 effect after year 1.
  const ARMY = {
    army: { months: 18, spec: 0 },
    navy: { months: 20, spec: 0.1 },
    air: { months: 21, spec: 0.3 },
    marine: { months: 18, spec: 0.1 },
    social: { months: 21, spec: 0.2 },
    alt: { months: 36, spec: 0 },
    doctor: { months: 38, spec: 0 },
  };
  const ARMY_WHEN = { y1: { gpa: 0.1, hunt: 0 }, y2: { gpa: 0, hunt: 0 }, after: { gpa: 0, hunt: -0.2 } };
  // Grade 4 (social service) when health has been poor; the game's own rule, not a real share.
  const ARMY_SOCIAL_HEALTH = 45;
  // The job hunt. Each target's chance per year of trying is sigmoid(tier row + field + GPA + 스펙 +
  // ability + luck + retry), where ability is the mean θ you finished school with (exams like 공시
  // and 임용 reward it; blind hiring in public enterprises (블라인드 채용, since 2017) ignores the school).
  // Rows by tier: none, college, low, mid, top, sky, med (null: not on offer).
  const HUNT = {
    big: { tier: [null, -2.8, -2.2, -1.3, -0.5, 0.1, null], field: 1, gpa: 0.8, spec: 0.35, abil: 0.1 },
    bigline: { tier: [-1.2, null, null, null, null, null, null], field: 0, gpa: 0, spec: 0, abil: 0.3 },
    public: { tier: [null, -2.0, -1.7, -1.5, -1.4, -1.3, null], field: 0.5, gpa: 0.5, spec: 0.2, abil: 0.35 },
    civil: { tier: [-2.6, -2.3, -2.1, -2.0, -1.9, -1.8, null], field: 0, gpa: 0, spec: 0, abil: 0.5 },
    teacher: { tier: [null, null, -1.7, -1.4, -1.1, -0.9, null], field: 0, gpa: 0.5, spec: 0, abil: 0.45 },
    law: { tier: [null, null, -2.8, -1.8, -1.0, -0.3, null], field: 0, gpa: 1.2, spec: 0.1, abil: 0.3 },
    hospital: { tier: [null, 1.4, 1.6, 1.8, 2.0, 2.2, null], field: 0, gpa: 0.4, spec: 0, abil: 0 },
    startup: { tier: [null, 0.5, 1, 1.4, 1.8, 2.2, null], field: 0.5, gpa: 0, spec: 0.3, abil: 0 },
    grad: { tier: [null, null, 0.2, 1.2, 2, 2.5, null], field: 0, gpa: 1, spec: 0, abil: 0.2 },
    sme: { tier: [0.4, 1.0, 0.8, 1.0, 1.2, 1.4, null], field: 1, gpa: 0.2, spec: 0.2, abil: 0 },
    trade: { tier: [0.6, null, null, null, null, null, null], field: 0, gpa: 0, spec: 0, abil: 0.2 },
    service: { tier: [1.5, null, null, null, null, null, null], field: 0, gpa: 0, spec: 0, abil: 0 },
    shop: { tier: [0.6, null, null, null, null, null, null], field: 0, gpa: 0, spec: 0, abil: 0, money: 10000000 },
    popular: { tier: [null, null, null, null, null, null, -0.4], field: 0, gpa: 1.5, spec: 0, abil: 0.4 },
    essential: { tier: [null, null, null, null, null, null, 2.2], field: 0, gpa: 0.3, spec: 0, abil: 0 },
    gp: { tier: [null, null, null, null, null, null, 4], field: 0, gpa: 0, spec: 0, abil: 0 },
  };
  const FAMILY_PAY = 0.025; // pay at 30 per birth fifth above the middle (see epiFinish)
  const HUNT_RETRY = 0.35; // each extra year of preparing the same target
  const HUNT_TRIES = 3; // years of trying before you have to take what's there
  const BAR_PASS = 0.51; // 변호사시험 pass rate per sitting (2026: 1,714 of 3,364 sat)
  // The job you hold, its monthly pay at 30 (₩, gross) and the job it becomes on success.
  // big: 300+ employee firms' graduate starting pay ₩50.01M a year (2023) ≈ ₩4.17M a month, plus
  // a few years of raises. sme: under-300 starting pay ₩32.38M ≈ ₩2.7M, SME mean ₩3.07M. resident:
  // 레지던트 ₩72.8M a year ≈ ₩6.07M. Others are estimates (see data/korea-stats.md, Game mapping).
  const JOB30 = {
    big: 5200000, bigline: 4300000, public: 4300000, civil: 3000000, teacher: 3300000, lawyer: 6000000, nurse: 4000000,
    startup: 3500000, startupWin: 8000000, research: 4500000, phd: 1800000, sme: 3000000, trade: 3300000, service: 2400000,
    shop: 3200000, resident: 6070000, gp: 8000000, freelance: 2300000, parttime: 1400000, student: 0, barExam: 0, hunting: 0,
  };
  // What each target becomes when it works out.
  const HUNT_JOB = { big: "big", bigline: "bigline", public: "public", civil: "civil", teacher: "teacher", law: "lawyer", hospital: "nurse", startup: "startup", grad: "research", sme: "sme", trade: "trade", service: "service", shop: "shop", popular: "resident", essential: "resident", gp: "gp" };
  // Workers' monthly pay, fifths: under ₩2M is about the bottom 19%, the median is ₩2.88M, 62% earn
  // under ₩3.5M and 17.6% earn ₩5M or more (calc from the 2024–26 official wage tables).
  const PAY_FIFTHS = [2000000, 2550000, 3350000, 4900000];
  const payFifth = (pay) => { let i = 0; while (i < PAY_FIFTHS.length && pay >= PAY_FIFTHS[i]) i++; return i + 1; };
  // Jobs that pull you to Seoul, and public enterprises that moved out to the 혁신도시 (153 public
  // bodies left the capital region in 2012–19).
  const SEOUL_JOBS = new Set(["big", "lawyer", "startup", "startupWin", "research", "phd"]);
  const AWAY_JOBS = { public: ["daegu", "busan", "jeonju", "jeju", "gwangju", "cheongju"] };

  // A life's achievements: ids only (strings.js has the names, descriptions and hints). `epi`: needs the
  // epilogue; `meta`: needs something outside this life (lives played on this device).
  const ACHIEVEMENTS = [
    "perfectPaper", "allOnes", "med", "snu", "sky", "inSeoul", "firstTry", "nsu5", "dragon", "dropoutSeoul", "careUni", "scholar",
    "bullySurvivor", "hagwonAll", "selfMade", "early", "waitlist", "halfUp", "ruralSeoul", "daechi", "mover", "familyUp", "jackpot",
    "omr", "stethoscope", "sciHigh", "vocUni", "noUni", "college",
    "bigCo", "civil", "lawyer", "gavel", "doctor30", "topFifth", "riseTwo", "ragsToRiches", "served", "altService", "exchange", "startupWin",
    "daily", "replay", "veteran",
  ];
  const EPI_ACH = new Set(["bigCo", "civil", "lawyer", "gavel", "doctor30", "topFifth", "riseTwo", "ragsToRiches", "served", "altService", "exchange", "startupWin"]);
  // Other systems can add "where they are now" lines to the epilogue: a function (g) returning an
  // array of { key, p }, called once when the epilogue finishes; the lines land in g.epi.extra and the
  // ending screen renders them under the at-30 summary.
  const EPILOGUE_HOOKS = [];
  // Your three closest friends at 30: where their own 수능 took them (friendOutcomes, from their own
  // seeded ability) and whether you're still in touch (a best friend, a partner or anyone you stayed
  // close to keeps meeting you; the rest drift).
  EPILOGUE_HOOKS.push((g) => (g.friendOutcomes ? g.friendOutcomes(3) : []).map((f) => ({
    key: "epi.friend30",
    p: { a: { id: f.id, s: f.s, n: f.n, x: f.x }, role: f.role, path: f.path, uni: f.uni, touch: f.role === "best" || f.role === "partner" || f.cl >= 60 },
  })));

  // ---------- the game ----------
  class Game {
    constructor(opts) {
      opts = opts || {};
      const seed = opts.seed != null ? opts.seed | 0 : (Math.random() * 2 ** 31) | 0;
      this.seed = seed;
      this.rngState = seed;
      this.name = opts.name || "You";
      // Chosen by the player. It changes how you're drawn and named, not the rules; saves from before
      // the choice existed have no sex and keep their old look.
      this.sex = opts.sex === "f" ? "f" : "m";
      // Where you're born is dealt first, by population share; then the family, from that place's mix of
      // incomes (overall each income fifth is still 20%). opts.region / opts.family exist for sim.js only.
      const bornIn = REGION_BY_ID[opts.region] ? opts.region : Game.rollRegion(seed);
      this.family = FAMILIES[opts.family] ? opts.family : Game.rollFamily(seed, bornIn);
      this.track = null; // chosen at the end of grade 10
      this.inq = null;
      // startYear is the year you start elementary school; life starts six years earlier, at birth.
      this.startYear = opts.startYear || 2026;
      this.year = this.startYear - 6;
      this.month = 3;
      // Grade 0 until elementary school; the early years count age instead.
      this.grade = 0;
      this.attempt = 1;
      // International age (만 나이): most children start grade 1 in March at 6 and turn 7 that year.
      this.age = 0;
      this.status = "early";
      this.traits = []; // temperament and 돌잡이 ids (see TEMPERAMENTS, DOLJABI); absent in old saves
      // opts.parents exists for sim.js only, like opts.family.
      this.parents = PARENT_BUDGET[opts.parents] != null ? opts.parents : Game.rollParents(seed); // "both" | "mom" | "dad" | "grand" | "care"; absent in old saves = both
      // A child in care has no household: count it in the lowest fifth (for the head start and the
      // retake academy), which moves the fifth shares by a rounding error.
      if (this.parents === "care") this.family = "q1";
      // Each parent's job ({ mom, dad }: a JOBS id, or null for a parent not in your life); absent in
      // old saves and for grandparents and children's homes.
      this.jobs = Game.rollJobs(seed, this.family, bornIn, this.parents);
      this.method = "self";
      const talent = Game.rollTalent(seed, this.family);
      this.aptitude = Object.assign({}, talent.aptitude);
      this.skills = Object.assign({}, talent.skills);
      for (const sub in this.skills) this.skills[sub] = Math.round((this.skills[sub] - EARLY_GAP) * 100) / 100;
      this.practice = 0.1;
      this.health = 80;
      this.stress = 15;
      this.motivation = 70;
      this.money = 0; // your own savings; education is paid from the parents' budget first
      this.lostBlocks = 0;
      this.clock = 0; // months played, for event cooldowns
      // mt: this life tracks study methods (old saves don't, so method achievements skip them).
      this.flags = { mt: 1 };
      this.log = [];
      this.history = []; // finished 수능 results
      this.mocks = []; // mock exam results
      this.trace = [{ t: this.t(), att: 1, ph: "early", skills: Object.assign({}, this.skills) }];
      this.queue = [{ type: "birth" }, { type: "event", id: "newborn", choices: 1 }, { type: "event", id: "saju", choices: 1 }];
      // Hidden fortune, from its own stream; the saju event reads it out. Old saves have none (neutral).
      this.luck = Game.rollLuck(seed);
      this.examMods = { shift: 0 };
      this.enrolled = null; // university id kept while doing 반수
      this.ending = null;
      this.lastPlan = null;
      this.bully = null; // { lv, n, sup } while being bullied; see bully-start
      // The people in your life (see soc()): absent in saves from before v6.1.
      this.social = Game.freshSocial();
      this.school = null; // school id, picked on the "school" screen; absent reads as the public school
      // regionFrom is the school grade you arrived in: the local quotas need middle and high school
      // there (from grade 7).
      this.region = bornIn;
      this.regionFrom = 1;
      this.addLog("log.born", { early: 1, fam: this.family, y: this.year, inc: FAMILIES[this.family].income, sex: this.sex, reg: this.region, care: this.parents === "care" ? 1 : undefined }, "milestone");
    }

    // Birth region, weighted only by population share.
    // A fortune between −1 and 1, most lives near the middle.
    // Today's life: the same seed for everyone on a date ("2026-11-10"), so friends can compare.
    static dailySeed(date) { return hashSeed("daily", date) & 0x7fffffff; }
    static rollLuck(seed) {
      const r = makeRng(hashSeed(seed, "saju"));
      return Math.round(clamp(r.normal() * 0.45, -1, 1) * 100) / 100;
    }
    static rollRegion(seed) {
      let x = makeRng(hashSeed(seed, "region"))() * REGIONS.reduce((a, r) => a + r.pop, 0);
      for (const r of REGIONS) { x -= r.pop; if (x <= 0) return r.id; }
      return REGIONS[REGIONS.length - 1].id;
    }
    // The family's income fifth, from the birth region's mix (JOINT). Without a region (old callers),
    // each fifth is equally likely.
    static rollFamily(seed, region) {
      const u = makeRng(hashSeed(seed, "family"))();
      const i = REGIONS.findIndex((r) => r.id === region);
      if (i < 0) return FAMILY_IDS[Math.floor(u * FAMILY_IDS.length)];
      const row = JOINT[i], tot = row.reduce((a, b) => a + b, 0);
      let x = u * tot;
      for (let j = 0; j < row.length; j++) { x -= row[j]; if (x <= 0) return FAMILY_IDS[j]; }
      return FAMILY_IDS[row.length - 1];
    }
    // Starting talent: a general knack plus per-subject quirks. Aptitude multiplies study gains.
    static rollJobs(seed, family, region, parents) {
      if (parents === "grand" || parents === "care") return null;
      const r = makeRng(hashSeed(seed, "jobs"));
      const fi = Math.max(0, FAMILY_IDS.indexOf(family));
      const farm = FARM_BY_KIND[(REGION_BY_ID[region] || {}).kind];
      const pick = (sex) => {
        const row = Object.assign({}, JOB_JOINT[sex][fi]);
        if (farm != null) row.farmer *= farm;
        let x = r() * WORK_IDS.reduce((a, id) => a + row[id], 0);
        for (const id of WORK_IDS) { x -= row[id]; if (x <= 0) return id; }
        return "office";
      };
      const mom = parents === "both" || parents === "mom" ? (r() < (parents === "mom" ? SINGLE_MOM_WORKS : MOM_WORKS[fi]) ? pick("f") : "home") : null;
      const dad = parents === "both" || parents === "dad" ? (r() < DAD_WORKS[fi] ? pick("m") : "home") : null;
      return { mom, dad };
    }
    static rollParents(seed) {
      let x = makeRng(hashSeed(seed, "parents"))();
      for (const [id, p] of PARENTS_AT_BIRTH) { x -= p; if (x < 0) return id; }
      return "both";
    }
    static rollTalent(seed, family) {
      const r = makeRng(hashSeed(seed, "talent"));
      const general = r.normal() * 0.55;
      const prior = (FAMILIES[family] || FAMILIES.q3).prior;
      const skills = {}, aptitude = {};
      for (const s of SUBJECTS) {
        const quirk = r.normal() * 0.45;
        skills[s] = Math.round((general + quirk + prior - START_GAP) * 100) / 100;
        aptitude[s] = Math.round(clamp(1 + general * 0.25 + r.normal() * 0.18, 0.6, 1.5) * 100) / 100;
      }
      // Every child is good at something: the best subject is at least a little quicker than average,
      // so no life starts with no strength at all.
      let best = SUBJECTS[0];
      for (const s of SUBJECTS) if (aptitude[s] > aptitude[best]) best = s;
      if (aptitude[best] < MIN_BEST_APT) aptitude[best] = MIN_BEST_APT;
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
    addLog(key, p, kind) { this.log.push({ t: this.t(), att: this.attempt, key, p: p || null, kind: kind || "" }); }
    // Phase for the chart: school stage, then the attempt number from grade 12 on.
    phase() { return STATUSES[this.status].school ? this.status : "a" + this.attempt; }

    inSchool() { return !!STATUSES[this.status].school; }
    isEarly() { return !!STATUSES[this.status].early; }
    // The combined effect of your traits on one fx key: a sum for levels, a product for multipliers.
    trait(key) {
      const add = key === "healthRest" || key === "stressRest" || key === "mot" || key === "cash";
      let v = add ? 0 : 1;
      // Your own traits, then the jobs of the parents you live with.
      const fxs = (this.traits || []).map((id) => TRAIT_FX[id]).concat(this.workingParents(true).map((w) => JOBS[this.jobs[w]].fx));
      for (const fx of fxs) if (fx && fx[key] != null) v = add ? v + fx[key] : v * fx[key];
      return v;
    }
    // The parents you live with who have a job on record ("mom", "dad"); with home true, also one at home.
    workingParents(home) {
      if (!this.jobs) return [];
      const p = this.parents || "both";
      return ["mom", "dad"].filter((w) => this.jobs[w] && (home || this.jobs[w] !== "home") && (p === "both" || p === w));
    }
    // A parent's new job, from its own stream (so it never moves the main RNG), logged.
    setJob(who, table, why) {
      const r = makeRng(hashSeed(this.seed, "jobchange", this.clock, who, why))();
      const from = this.jobs[who];
      let x = r * table.reduce((a, e) => a + (e[0] === from ? 0 : e[1]), 0), to = table[0][0];
      for (const [id, w] of table) { if (id === from) continue; x -= w; if (x <= 0) { to = id; break; } }
      this.jobs[who] = to;
      this.addLog("log.job", { who, from, to, why }, "event");
      return to;
    }
    // The parent you live with who has this job ("mom" / "dad"), or null.
    hasJob(id) { return this.workingParents().find((w) => this.jobs[w] === id) || null; }
    // A parent left on their own who stayed at home goes (back) to work.
    toWork(why) {
      for (const w of this.workingParents(true)) if (this.jobs[w] === "home") this.setJob(w, BACK_TO_WORK, why);
    }
    // Which working parent a promotion or a layoff happens to: the better paid one, usually.
    fortuneParent(why) {
      const ws = this.workingParents();
      if (!ws.length) return null;
      if (ws.length === 1) return ws[0];
      const a = PARENT_PAY[this.jobs[ws[0]]], b = PARENT_PAY[this.jobs[ws[1]]];
      return makeRng(hashSeed(this.seed, "jobwho", this.clock, why))() < a / (a + b) ? ws[0] : ws[1];
    }
    // The family's fortunes move it up or down the income fifths (and with them the education budget and
    // whether a retake academy is affordable). Returns how many steps it actually moved.
    shiftFamily(d, why) {
      const i = FAMILY_IDS.indexOf(this.family);
      const j = clamp(i + d, 0, FAMILY_IDS.length - 1);
      if (j === i) return 0;
      const from = this.family;
      this.family = FAMILY_IDS[j];
      this.addLog("log.fortune", { from, to: this.family, why }, "milestone");
      this.checkFees();
      return j - i;
    }
    // A school the family can no longer pay for: back to the public one (or ordinary kindergarten).
    checkFees() {
      const st = this.status === "hs3" ? "high" : this.status === "early" ? "kinder" : this.status;
      if ((this.inClass() || this.atKinder()) && this.schoolInfo().fee > this.feeLimit(this.schoolInfo()) && DEFAULT_SCHOOL[st]) {
        this.school = DEFAULT_SCHOOL[st];
        this.addLog("log.schoolFee", { id: this.school }, "event");
      }
    }
    addTrait(id) {
      this.traits = (this.traits || []).concat(id);
      const fx = TRAIT_FX[id];
      for (const sub in fx.apt || {}) this.aptitude[sub] = Math.round(Math.min(1.7, this.aptitude[sub] + fx.apt[sub]) * 100) / 100;
      if (fx.cash) this.money += fx.cash;
    }
    turnMonths() { return STATUSES[this.status].months; }
    blocks() { return Math.max(1, this.baseBlocks() - this.lostBlocks); }
    // Out of school, the hours that went to classes are yours: two more blocks a turn in grades 7–11. Grade
    // 12 gains nothing, since most of a 고3's school day is self-study already.
    baseBlocks() {
      return STATUSES[this.status].blocks(this.month) + (this.dropoutActive() ? DROPOUT_BLOCKS : 0) + (this.inClass() ? this.schoolInfo().blocks || 0 : 0);
    }

    // ----- leaving school (자퇴) -----
    // dropout is the clock when you left (absent in older saves: still at school). The calendar keeps
    // counting your age group's grades, so grade is still the year you'd be in.
    dropoutActive() { return this.dropout != null && this.inSchool(); }
    // Why you can't leave school right now, or null. From middle school on, once.
    quitBlock() {
      if (this.dropout != null) return "done";
      if (!this.inSchool() || this.grade < 7) return "grade";
      if (this.ending || this.queue.length) return "busy";
      return null;
    }
    quitSchool() {
      const why = this.quitBlock();
      if (why) throw new Error("quit." + why);
      this.dropout = this.clock;
      this.flags.dropGrade = this.grade;
      // The parents take it hard.
      bump(this, { stress: 6, motivation: -4 });
      this.addLog("log.dropout", { g: this.grade }, "milestone");
      // Your classmates carry on without you.
      this.leaveClass();
      this.social.teacher = null;
      if (this.bully) { endBully(this); this.addLog("log.bullyEnd", { why: "quit" }, "event"); }
    }
    activities() {
      if (this.isEarly()) return ACTIVITIES.filter((a) => (a.early && (a.fromAge || 0) <= this.age) || a.alsoEarly);
      const rec = this.recordOpen();
      return ACTIVITIES.filter((a) => !a.early && (a.from || 1) <= this.grade && this.grade <= (a.to || 12) &&
        (!a.hs || (rec && (a.id !== "prep" || !!this.examSoon()))));
    }
    allowance() {
      const a = this.grossBudget();
      // School fees come out of the same education budget while you're there.
      // From the fourth try the parents pay half; the 자립수당 is the state's and doesn't shrink.
      // Fees paid out of household income (fromIncome) don't come out of this budget.
      const sch = this.inClass() || this.atKinder() ? this.schoolInfo() : null;
      return Math.max(0, (this.attempt >= 4 && this.parents !== "care" ? Math.round(a / 2) : a) - (sch && !sch.fromIncome ? sch.fee : 0));
    }
    // What a family can pay for a school: its education budget, or, for fees families pay out of
    // income (an English kindergarten, a private elementary school, an international middle school),
    // FEE_FROM_INCOME of household income. Real fees at these schools far exceed what families spend
    // on 사교육, so they can't come out of that budget.
    feeLimit(x) { return x && x.fromIncome ? FAMILIES[this.family].income * 10000 * FEE_FROM_INCOME * PARENT_BUDGET[this.parents || "both"] : this.grossBudget(); }
    // The family's monthly education money before fees: less with one parent or grandparents. In care,
    // the home's small budget, then the 자립수당 for five years once you've left.
    grossBudget() {
      if (this.parents === "care") return this.flags.careLeft != null ? (this.clock - this.flags.careLeft < CARE_PAY_MONTHS ? CARE_PAY : 0) : CARE_BUDGET;
      return Math.round(FAMILIES[this.family].allowance * PARENT_BUDGET[this.parents || "both"] / 1000) * 1000;
    }
    // Who you live with, for the resting stress and motivation: care splits into in the home and out.
    home() { const p = this.parents || "both"; return p === "care" && this.flags.careLeft != null ? "careOut" : p; }
    // Whether someone pays ₩2.9M a month for a retake academy. Nobody does for a child in care.
    // From the fourth try the parents pay only half (log.halfpay), which doesn't stretch to ₩2.9M a month.
    paysAcademy() { return this.parents !== "care" && this.attempt < 4 && FAMILIES[this.family].paysAcademy; }
    // The one-off settlement on leaving care, which each province sets.
    careSettlement() { return CARE_SETTLE[SEOUL_AREAS.has(this.region) ? "seoul" : this.region] || CARE_SETTLE_ELSE; }

    // ----- schools -----
    // At one of these schools right now (and still going to classes).
    atSchool(...ids) { return this.inClass() && ids.indexOf(this.schoolInfo().id) >= 0; }
    // The school you're at. Saves from before schools existed have none: the public one for the stage.
    schoolInfo() {
      const st = this.status === "hs3" ? "high" : this.status === "early" ? "kinder" : this.status;
      const x = SCHOOL_BY_ID[this.school];
      return x && x.stage === st ? x : SCHOOL_BY_ID[DEFAULT_SCHOOL[st] || "pubHigh"];
    }
    // Every school for the stage on the current school screen, with its chance, why it's closed, and the
    // real school it would be (see realSchoolFor). A private school that doesn't exist where you live
    // is closed like any school that isn't there.
    schoolOptions() {
      const top = this.queue[0];
      if (!top || top.type !== "school") return [];
      const kind = this.regionInfo().kind;
      return SCHOOLS.filter((x) => x.stage === top.stage).map((x) => {
        const real = this.realSchoolFor(x.id);
        const missing = REAL && REAL.areas[this.region] && REAL_LOCAL[x.id] && !real;
        // Closed only because every such school here is a boys' (or girls') school: say so.
        const wrongSex = missing && this.realSchoolFor(x.id, true);
        const def = x.id === DEFAULT_SCHOOL[top.stage];
        // The default school is always open (pickSchool can't refuse it), even without a real match.
        const blocked = def ? null : (x.where && x.where.indexOf(kind) < 0) ? "region" : wrongSex ? "sex" : missing ? "region" : x.fee > this.feeLimit(x) ? "cost" : x.admit(this) <= 0 ? "admit" : null;
        return { id: x.id, fee: x.fee, income: !!x.fromIncome, p: blocked ? 0 : x.admit(this), blocked, track: x.track || null, def, real };
      });
    }
    // The real school a game school would be for this life: a local one picked from the area's schools
    // of that kind (its own seeded stream, so the same life always gets the same school), or the
    // nearest one in the country for special schools. null without places.js, for kindergartens, or
    // when the area has none. { name, lat, lon, prov, city } (prov and city only for far schools).
    realSchoolFor(id, anySex) {
      const area = REAL && REAL.areas[this.region];
      if (!area) return null;
      const local = REAL_LOCAL[id];
      if (local) {
        const list = area.schools.filter((e) => e[1] === local[0] && (local[1] == null || e[2] === local[1]) && (local[2] == null || e[3] === local[2]) && (anySex || this.admitsMe(e[6])));
        if (!list.length) return id === "artsHigh" || id === "vocHigh" ? this.nearestSpecial(REAL_FAR[id], area) : null;
        const e = list[Math.floor(makeRng(hashSeed(this.seed, "realschool", id, this.region))() * list.length)];
        return { name: e[0], lat: e[4], lon: e[5], sex: e[6] || null };
      }
      // A 자사고 application is to your own area's regional 자사고 when there is one (휘문, 세화, 해운대고...),
      // otherwise the nearest nationwide one.
      if (id === "autoHigh") {
        const reg = area.schools.filter((e) => e[1] === "h" && e[3] === "autoR" && (anySex || this.admitsMe(e[6])));
        if (reg.length) {
          const e = reg[Math.floor(makeRng(hashSeed(this.seed, "realschool", id, this.region))() * reg.length)];
          return { name: e[0], lat: e[4], lon: e[5], sex: e[6] || null };
        }
      }
      return REAL_FAR[id] ? this.nearestSpecial(REAL_FAR[id], area) : null;
    }
    nearestSpecial(kind, area) {
      const list = (REAL.special[kind] || []);
      let best = null, bd = 1e9;
      const [la, lo] = area.center;
      for (const e of list) {
        if (!this.admitsMe(e[6])) continue;
        const d = (e[2] - la) ** 2 + ((e[3] - lo) * 0.8) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) return null;
      // Straight-line distance from the middle of your area, for the dialog ("120 km away").
      const rad = Math.PI / 180, dLa = (best[2] - la) * rad, dLo = (best[3] - lo) * rad;
      const h = Math.sin(dLa / 2) ** 2 + Math.cos(la * rad) * Math.cos(best[2] * rad) * Math.sin(dLo / 2) ** 2;
      return { name: best[0], lat: best[2], lon: best[3], prov: best[4], city: best[5], km: Math.round(12742 * Math.asin(Math.sqrt(h))), sex: best[6] || null };
    }
    // Whether a real school that admits only one sex ("m" / "f"; empty = coed) takes you. Lives from
    // before the player picked a sex can go anywhere.
    admitsMe(sex) { return !sex || !this.sex || sex === this.sex; }
    // Who a real school admits, looked up by name (saves from before v6 stored schools without it).
    static realSchoolSex(name, region) {
      if (!REAL) return null;
      // Some names exist in more than one place with different rules (세화고, 덕원중): look at home first.
      const home = REAL.areas[region];
      if (home) for (const e of home.schools) if (e[0] === name) return e[6] || null;
      for (const id in REAL.areas) for (const e of REAL.areas[id].schools) if (e[0] === name) return e[6] || null;
      for (const k in REAL.special) for (const e of REAL.special[k]) if (e[0] === name) return e[6] || null;
      return null;
    }
    // The real school you attend now: the one picked on the school screen, or (older saves, or after
    // a move) the local one for your school.
    realSchool() {
      if (!this.inClass()) return null;
      const id = this.schoolInfo().id;
      let r = this.real;
      // A save from before single-sex schools were known may hold a school that doesn't take you.
      if (r && r.sex === undefined) { r.sex = Game.realSchoolSex(r.name, r.region); if (!this.admitsMe(r.sex)) { this.real = r = null; } }
      // A local school saved before school types came from NEIS may no longer be that kind of school
      // (a regional 자사고 once dealt as a lottery private school): pick again.
      if (r && REAL_LOCAL[r.id] && REAL && REAL.areas[r.region]) {
        const [lv, fnd, kind] = REAL_LOCAL[r.id];
        const e = REAL.areas[r.region].schools.find((x) => x[0] === r.name && x[4] === r.lat);
        if (e && (e[1] !== lv || (fnd != null && e[2] !== fnd) || (kind != null && e[3] !== kind))) this.real = r = null;
      }
      if (r && r.id === id && r.region === this.region || r && r.id === id && SCHOOL_BY_ID[id].board) return r;
      const x = this.realSchoolFor(id);
      return x ? Object.assign({ id, region: this.region }, x) : null;
    }
    // Apply to a school. Anything but the default public school is a lottery or a selection; missing
    // out means the public school. Returns the outcome message { key, p }.
    pickSchool(id) {
      const top = this.queue[0];
      if (!top || top.type !== "school") throw new Error("Not time to pick a school.");
      const o = this.schoolOptions().find((x) => x.id === id);
      if (!o || o.blocked) throw new Error("school.closed");
      const got = o.def || this.rng() < o.p;
      this.school = got ? id : DEFAULT_SCHOOL[top.stage];
      const real = this.realSchoolFor(this.school);
      this.real = real ? Object.assign({ id: this.school, region: this.region }, real) : null;
      this.queue.shift();
      this.addLog("log.school", { id: this.school, want: id, got, real: real && real.name }, "milestone");
      // New school, new classmates.
      this.soc();
      const st = this.classStage();
      if (st) this.newClass(st, "stage");
      this.flush();
      return { key: o.def ? "school.r.def" : got ? "school.r.in" : "school.r.out", p: { id, def: DEFAULT_SCHOOL[top.stage], real: real && real.name } };
    }
    // The parents' education money for this turn. Whatever isn't spent stays with them.
    budget() { return this.allowance() * this.turnMonths(); }
    methodFixed() { return STATUSES[this.status].method || null; }

    // ----- regions -----
    regionInfo() { return REGION_BY_ID[this.region] || REGION_BY_ID.suwon; }
    regionKindInfo() { return REGION_KINDS[this.regionInfo().kind]; }
    // 지역인재: outside the capital region, with middle and high school there (arrived by grade 7).
    // The quotas need middle and high school in the region: a dropout (검정고시) doesn't qualify.
    localQuota() { const r = this.regionInfo(); return this.dropout == null && !r.capital && (this.regionFrom || 1) <= 7; }
    ruralQuota() { return this.dropout == null && this.regionInfo().kind === "rural" && (this.regionFrom || 1) <= 7; }
    // Percentile points taken off a university's cut by the quotas you qualify for, and which applies.
    quotaFor(u) {
      // 검정고시 holders don't count as having gone to school in the region.
      if (this.dropout != null) return null;
      const local = this.localQuota() && (u.id === "med" || u.id === this.regionInfo().nat) ? LOCAL_QUOTA : 0;
      const rural = this.ruralQuota() && u.id !== "college" ? RURAL_QUOTA : 0;
      if (!local && !rural) return null;
      return local >= rural ? { kind: "local", pts: local } : { kind: "rural", pts: rural };
    }
    // Cram schools and tutors are stronger and dearer in Gangnam and Seoul; rural counties have no tutors.
    methodAvailable(id) { return id !== "tutor" || this.regionKindInfo().tutor > 0; }
    methodMult(id) {
      const k = this.regionKindInfo();
      return METHODS[id].mult * (id === "hagwon" ? k.hagwon : id === "tutor" ? k.tutor : 1);
    }
    methodCost(id) {
      const c = METHODS[id].cost;
      return id === "hagwon" || id === "tutor" ? Math.round(c * this.regionKindInfo().price / 1000) * 1000 : c;
    }
    // Why you can't move to a region right now, or null. Moving waits a year after the last move, and
    // Seoul and Gangnam housing takes a family in the matching income fifth or above.
    moveBlock(id) {
      const r = REGION_BY_ID[id];
      if (!r || id === this.region) return "same";
      if (this.ending || this.queue.length) return "busy";
      if (this.flags.lastMove != null && this.clock - this.flags.lastMove < MOVE_COOLDOWN) return "cooldown";
      // The home decides where a child in care lives; once you've left, you can move like anyone.
      if (this.parents === "care" && this.flags.careLeft == null) return "care";
      if (r.need && FAMILY_IDS.indexOf(this.family) + 1 < r.need) return "cost";
      return null;
    }
    // The player's move: a new home and a new school. It costs a block of packing next turn, the stress
    // of starting over, and the new-kid risk of bullying; it can also end bullying at the old school.
    move(id) {
      const why = this.moveBlock(id);
      if (why) throw new Error("move." + why);
      this.relocate(id);
      bump(this, { stress: 8, motivation: -3 });
      this.lostBlocks += 1;
      if (this.bully && this.rng() < 0.7) { endBully(this); this.addLog("log.bullyEnd", { why: "move" }, "event"); }
    }
    // The move itself, shared with events that move the family (Daechi-dong, 의대 지방 유학).
    relocate(id) {
      const from = this.region;
      this.region = id;
      // A kindergarten that doesn't exist in the new place (an English kindergarten in the countryside)
      // becomes the neighbourhood one.
      if (this.atKinder() && this.schoolInfo().where && this.schoolInfo().where.indexOf(this.regionInfo().kind) < 0) {
        this.school = DEFAULT_SCHOOL.kinder;
        this.addLog("log.schoolMove", { id: this.school }, "event");
      }
      // A new home means the local public school, unless yours is a boarding or commuter school.
      if (this.inClass() && !this.schoolInfo().board && this.schoolInfo().id !== DEFAULT_SCHOOL[this.status === "hs3" ? "high" : this.status]) {
        this.school = DEFAULT_SCHOOL[this.status === "hs3" ? "high" : this.status];
        const r = this.realSchoolFor(this.school);
        this.addLog("log.schoolMove", { id: this.school, real: r && r.name }, "event");
      }
      // In school, the quotas count from the grade you arrive in; after school, you're past them.
      this.regionFrom = this.inSchool() ? this.grade : 13;
      // A new school means new classmates (a boarding school keeps its own).
      const st = this.classStage();
      if (this.social && st && !(this.inClass() && this.schoolInfo().board)) this.newClass(st, "move");
      this.flags.moved = this.clock;
      this.flags.lastMove = this.clock;
      this.addLog("log.move", { from, to: id }, "milestone");
    }
    // Retake options after the latest 수능, with the reason any of them is closed. The parents pay a
    // retake academy if they can; otherwise only a scholarship gets you in.
    retakeOptions(score) {
      const pays = this.paysAcademy();
      return ["academy", "selfstudy", "halfretake"].map((id) => ({
        id,
        blocked: id === "academy" && !pays && score < 85 ? "academyFee" : null,
        scholarship: id === "academy" && !pays && score >= 85,
      }));
    }
    planCost(plan, method) {
      method = this.methodFixed() || method || this.method;
      let studyBlocks = 0, cost = 0;
      for (const a of ACTIVITIES) {
        if (a.kind === "study") studyBlocks += plan[a.id] || 0;
        else if (a.cost) cost += (plan[a.id] || 0) * Math.round(a.cost * this.regionKindInfo().price / 1000) * 1000;
      }
      if (!this.methodFixed()) cost += studyBlocks * this.methodCost(method);
      return cost * this.turnMonths();
    }
    // Vocational high schools place you in paid work at a better rate.
    income(plan) { return Math.round((plan.job || 0) * JOB_PAY * this.turnMonths() * (this.inClass() ? this.schoolInfo().job || 1 : 1)); }
    daysToExam() {
      // 수능 is the third Thursday of November, roughly the 15th.
      const now = new Date(Date.UTC(this.year, this.month - 1, 1));
      const exam = new Date(Date.UTC(this.year, 10, 15));
      return Math.round((exam - now) / 86400000);
    }

    // Plan: { activityId: blocks }, method: study method id. Returns null or an error key for strings.js.
    validate(plan, method) {
      const offered = new Set(this.activities().map((a) => a.id));
      let total = 0;
      for (const k in plan) {
        const n = plan[k] || 0;
        if (n < 0 || n !== Math.floor(n) || (n && !offered.has(k))) return "err.count";
        total += n;
      }
      if (total !== this.blocks()) return "err.blocks";
      if (!this.methodFixed() && (!METHODS[method] || !this.methodAvailable(method))) return "err.method";
      if (this.planCost(plan, method) > this.budget() + this.money + this.income(plan)) return "err.money";
      return null;
    }

    advance(plan, method) {
      if (this.queue.length || this.ending) throw new Error("Resolve the current screen first.");
      method = this.methodFixed() || method || this.method;
      const err = this.validate(plan, method);
      if (err) throw new Error(err);
      this.method = this.methodFixed() ? this.method : method;
      this.lastPlan = Object.assign({}, plan);
      // For achievements: paid cram school or tutoring ever, and High 3 months spent at a 학원.
      if (method === "hagwon" || method === "tutor") this.flags.paid = 1;
      if (this.status === "hs3" && this.attempt === 1) {
        this.flags.hs3Turns = (this.flags.hs3Turns || 0) + 1;
        if (method === "hagwon" || method === "tutor") this.flags.hs3Hagwon = (this.flags.hs3Hagwon || 0) + 1;
      }
      this.lostBlocks = 0;
      this.soc();
      // This year's homeroom teacher (see TEACHERS).
      const tf = this.teacherFx();
      const months = this.turnMonths();
      const school = this.inSchool();
      // A long turn moves ability further, but not twelve times as far: habits matter more than hours.
      const k = Math.sqrt(months) * (school ? SCHOOL_GAIN : 1);
      this.clock += months;
      const rng = this.rng;
      const before = Object.assign({}, this.skills);

      // Money: the parents' budget covers education first, then your own savings.
      const cost = this.planCost(plan, method);
      this.money += this.income(plan) - Math.max(0, cost - this.budget());

      // Study. Gains shrink with low motivation, poor health or very high stress, and repeated blocks
      // on one subject in the same turn give a bit less each time.
      const m = METHODS[method];
      const motFactor = Math.pow(0.35 + 0.65 * (this.motivation / 100), m.sens);
      const healthFactor = this.health < 40 ? 0.7 + 0.3 * (this.health / 40) : 1;
      const stressFactor = this.stress > 75 ? 1 - (this.stress - 75) / 60 : 1;
      // Being bullied makes it hard to think about anything else (see bullyPenalty).
      const bp = this.bullyPenalty();
      const eff = motFactor * healthFactor * stressFactor * (bp ? bp.eff : 1);
      let studied = 0;
      for (const s of SUBJECTS) {
        const n = plan[s] || 0;
        studied += n;
        if (!n) continue;
        let g = 0;
        for (let i = 0; i < n; i++) g += 1 / (1 + 0.3 * i);
        const rate = 0.24 * SUBJECT_INFO[s].rate * this.aptitude[s] * this.methodMult(method) * eff;
        this.skills[s] += g * rate * headroom(this.skills[s]) * (0.85 + 0.3 * rng()) * k;
      }
      // Reading: free, and it feeds Korean most, with a little social studies and history on the side.
      const reading = plan.reading || 0;
      if (reading) {
        const share = { kor: 0.6, hist: 0.25, inq1: 0.25 };
        for (const s in share) this.skills[s] += reading * 0.24 * share[s] * this.aptitude[s] * eff * headroom(this.skills[s]) * k * this.trait("reading");
      }
      // Early childhood: play feeds the subjects it touches, and kindergarten adds lessons of its own.
      if (this.isEarly()) {
        for (const id in EARLY_FEED) {
          const n = plan[id] || 0;
          if (!n) continue;
          const tm = id === "books" ? this.trait("reading") : 1;
          for (const s in EARLY_FEED[id]) this.skills[s] += n * EARLY_RATE * EARLY_FEED[id][s] * this.aptitude[s] * eff * headroom(this.skills[s]) * tm;
        }
        if (this.atKinder()) {
          const kl = this.schoolInfo().lessons;
          for (const s of SUBJECTS) this.skills[s] += KINDER_YEAR * SUBJECT_INFO[s].rate * this.aptitude[s] * eff * headroom(this.skills[s]) * (kl[s] || kl.all || 1);
        }
      }
      // Lessons: being at school teaches every subject a little each turn, whatever you do with your
      // free blocks. Classes are pitched at the grade, so they help most when you're behind the class
      // and little once you're well ahead; how much sticks depends on attention (motivation, health,
      // bullying). Dropouts miss all of it.
      let lessons = 0;
      if (this.inClass()) {
        const typical = this.typicalLevel();
        const attend = (0.6 + 0.4 * this.motivation / 100) * healthFactor * (bp ? bp.eff : 1);
        const sl = this.schoolInfo().lessons;
        for (const s of SUBJECTS) {
          const behind = clamp(0.5 + 0.5 * (typical - this.skills[s]), CLASS_FLOOR, 1);
          const g = CLASS_YEAR * (months / 12) * SUBJECT_INFO[s].rate * this.aptitude[s] * behind * attend * headroom(this.skills[s]) * (sl[s] || sl.all || 1) * (tf ? tf.lessons : 1);
          this.skills[s] += g;
          lessons += g;
        }
        // The school record (High 1 to August of High 3): what you did this turn goes into it.
        if (this.recordOpen()) {
          const total = Object.keys(plan).reduce((a, x) => a + (plan[x] || 0), 0);
          this.recordTurn(plan, months, attend, total ? studied / total : 0);
        }
      }
      // 내신 prep is study too, aimed at the school's own papers: a little of a study block's gain,
      // spread over the graded subjects. A 진로 project feeds the two subjects of its field.
      const prepN = plan.prep || 0, projN = plan.project || 0;
      if (prepN || projN) {
        const feed = {};
        for (const s of NAESIN_SUBJ) feed[s] = (feed[s] || 0) + prepN * 0.3 / NAESIN_SUBJ.length;
        const f = (this.record && this.record.field) || "sci";
        for (const s of f === "med" || f === "sci" ? ["math", "inq2"] : f === "biz" ? ["math", "inq1"] : ["kor", "inq1"]) feed[s] = (feed[s] || 0) + projN * 0.2;
        for (const s in feed) this.skills[s] += feed[s] * 0.24 * SUBJECT_INFO[s].rate * this.aptitude[s] * eff * headroom(this.skills[s]) * k;
      }
      const mock = plan.mock || 0;
      if (mock) {
        this.practice = clamp(this.practice + 0.09 * mock * (1 - this.practice), 0, 1);
        for (const s of SUBJECTS) this.skills[s] += 0.008 * mock * headroom(this.skills[s]) * k;
      }

      // Condition. Study is stressful; in grade 12 the pressure rises as November gets closer.
      const drop = this.dropoutActive();
      const pressure = this.status === "elem" || this.isEarly() || drop ? 0 : school ? 1 : this.month >= 9 ? 4 + (this.month - 9) * 2 : 2;
      // Stress and health also recover on their own toward a baseline, so a steady workload settles
      // at a level instead of spiralling; heavy turns push the level up.
      const d = {
        stress: pressure + (studied + prepN + projN) * 1.6 + mock * 3 + (25 + this.trait("stressRest") + PARENT_STRESS[this.home()] - this.stress) * 0.25 + (plan.worksheet || 0) * 4,
        health: -1 - (studied + prepN + projN) * 0.6 + (72 + this.trait("healthRest") - this.health) * 0.15,
        motivation: 0,
      };
      // Clubs and volunteering are a change from the desk.
      d.stress -= (plan.club || 0) * (this.record && this.record.club === "fun" ? 7 : 5) + (plan.volunteer || 0) * 4;
      d.motivation += (plan.club || 0) * 1 + (plan.volunteer || 0) * 1 + projN * 1;
      // Traits make some of these go further (a good sleeper rests better, a smiley child gets more out
      // of friends).
      const tRest = this.trait("rest"), tEx = this.trait("exercise");
      d.stress -= (plan.rest || 0) * 9 * tRest + (plan.exercise || 0) * 6 * tEx + (plan.friends || 0) * 14 * this.trait("friends") + (plan.games || 0) * 10 + (plan.arts || 0) * 8 + reading * 3 + (plan.books || 0) * 2;
      d.health += (plan.rest || 0) * 7 * tRest + (plan.exercise || 0) * 11 * tEx + (plan.arts || 0) * 8 - (plan.job || 0) * 4;
      // Where you live: Gangnam's pressure, the countryside's quiet.
      const rk = this.regionKindInfo();
      d.stress += rk.stress;
      d.health += rk.health;
      // The school you're at: a special school's pace, or an arts school's breathing room.
      const sch = this.inClass() || this.atKinder() ? this.schoolInfo() : null;
      if (sch) { d.stress += sch.stress; d.health += sch.health || 0; }
      if (tf) d.stress += tf.stress;
      // Arts & sports lessons over the years are what an arts high school audition looks at.
      if (plan.arts) this.flags.artsN = (this.flags.artsN || 0) + plan.arts * months / 12 * 2 * this.trait("arts");
      d.stress += (plan.job || 0) * 5;
      d.motivation += (plan.friends || 0) * 3 - (plan.games || 0) * 4 + (plan.arts || 0) * 4;
      // Out of school, nobody sets the pace and nobody's around: a lower baseline, and loneliness
      // without time for friends.
      if (drop && !plan.friends) d.stress += DROPOUT_LONELY;
      // Motivation drifts back toward a baseline that sags with every extra year.
      const base = (school ? 68 : 66) - (this.attempt - 1) * 6 + (this.status === "academy" ? 6 : 0) + rk.motivation + (sch ? sch.motivation : 0) + this.trait("mot") + PARENT_MOT[this.home()] - (this.dropout != null && this.grade <= 12 && this.attempt === 1 ? DROPOUT_MOTIVATION : 0) + (tf ? tf.mot : 0);
      d.motivation += (base - this.motivation) * 0.2 - (this.stress > 70 ? 4 : 0);
      // Bullying wears you down every turn it lasts; support (parents who know, a counselor, friends)
      // softens the toll on your body.
      if (bp) {
        d.stress += 4 * bp.lv;
        d.motivation -= 3 * bp.lv;
        d.health -= (bp.sup ? 1 : 2) * bp.lv;
        this.bully.n += 1;
      }
      bump(this, d);
      // Friendships: who you spent the friend blocks with, and whether you studied together.
      const st = this.socialTurn(plan);

      // Summarize the turn.
      const deltas = {};
      for (const s of SUBJECTS) {
        const dd = this.skills[s] - before[s];
        if (Math.abs(dd) >= 0.004) deltas[s] = Math.round(dd * 16.67 * 10) / 10;
      }
      this.addLog("log.month", Object.assign({ m: this.month, plan: Object.assign({}, plan), cost, d: deltas, cls: Math.round(lessons * 16.67 * 10) / 10 }, st.fr ? { fr: st.fr, sg: st.sg } : {}), "month");
      if (this.status === "elem") this.addLog("log.teacher", { lvl: this.classLevel() }, "");
      if (this.status === "mid" && !drop) this.addLog("log.report", { rank: this.classRank(), of: 30, sem: this.month === 3 ? 1 : 2 }, "mock");
      // New Year's money (세뱃돈) from relatives, whenever a turn runs through January.
      if (school && (this.month === 3 && months === 12 || this.month + months > 12)) {
        // In care it comes from the staff and sponsors, and there's less of it.
        const gift = Math.round(Math.min(300000, 60000 + this.age * 10000) * this.trait("sebae") * (this.parents === "care" ? 0.4 : 1));
        this.money += gift;
        this.addLog("log.sebae", { a: gift }, "");
      }

      // Events: usually one per turn, sometimes none, sometimes two when life piles up.
      const roll = rng();
      const n = roll < 0.2 ? 0 : roll < 0.88 ? 1 : 2;
      const seen = new Set();
      // Fixed milestones (D-100, free-semester career week, 중2) always fire when their time comes, and so
      // does the bullying follow-up while it lasts.
      for (const e of EVENTS) if (!e.social && weightOf(e, this) >= 100 && this.stageFits(e) && e.when(this)) { seen.add(e.id); this.fireEvent(e); }
      for (let i = 0; i < n; i++) this.rollEvent(seen);
      if ((plan.friends || 0) > 0 && rng() < 0.35 && !seen.has("pcbang") && this.grade >= 7 && this.clock - (this.flags["ev-pcbang"] || -99) >= 4) {
        this.fireEvent(EVENTS.find((e) => e.id === "pcbang"));
      }
      // The people in your life: at most one social event, from its own stream (after the main events,
      // so the main RNG runs exactly as before).
      this.rollSocial(seen);

      // Scheduled exams and decisions.
      const mocks = this.queue.length;
      if (this.status === "high" && !drop && (this.month === 3 || this.month === 9)) this.queue.push({ type: "mock", m: this.month === 3 ? 6 : 11 });
      if (!school && MOCKS[this.month] && !(this.month === 3 && this.status !== "hs3")) this.queue.push({ type: "mock", m: this.month });
      // How the rival did: on the mock just sat, or in middle school's semester ranks.
      if (this.queue.length > mocks) this.rivalCheck(true);
      else if (this.status === "mid" && !drop) this.rivalCheck(false);
      // Midterms and finals (내신), then 수시: applications after the September mock, the 종합 document
      // round in October.
      const term = this.naesinTerm();
      if (term) this.queue.push(this.sitNaesin(term));
      if (!school && this.month === 9 && this.susiOpen()) this.queue.push({ type: "susi" });
      if (!school && this.month === 10 && this.susi && this.susi.y === this.year && this.susi.att === this.attempt && this.susi.apps.some((a) => a.type === "jh" && a.iv)) this.queue.push(this.susiStage());
      if (this.status === "high" && this.grade === 10 && this.month === 12) this.queue.push({ type: "track" });
      if (this.status !== "elem" && !school && this.month === 11) {
        this.queue.push(this.examEveEvent());
        this.queue.push(this.lunchEvent());
        const luckEv = this.examLuckEvent();
        if (luckEv) this.queue.push(luckEv);
        this.gateEvent();
        this.queue.push({ type: "exam" });
      } else {
        this.queue.push({ type: "nextMonth" });
      }
      this.trace.push({ t: this.t(), att: this.attempt, ph: this.phase(), skills: Object.assign({}, this.skills) });
      this.flush();
    }

    // Average standing over the main subjects, as a share of the year group below you. A typical child
    // climbs TYPICAL_CLIMB a school year from −START_GAP at grade 1, so classmates are compared against
    // that line.
    standing() {
      const avg = (this.skills.kor + this.skills.math + this.skills.eng + this.skills.inq1 + this.skills.inq2) / 5;
      return phi((avg - this.typicalLevel()) / 0.8);
    }
    typicalLevel() { return -START_GAP + TYPICAL_CLIMB * (this.grade - 1); }
    // Sitting in classes this turn: school years and grade 12, unless you've left school.
    inClass() { return (this.inSchool() || this.status === "hs3") && this.dropout == null && !this.isEarly(); }
    // Ages 3–5, at whatever kindergarten (or home) was picked.
    atKinder() { return this.isEarly() && this.age >= 3; }
    classRank() { return clamp(Math.round((1 - this.standing()) * 30) + 1, 1, 30); }
    classLevel() { const s = this.standing(); return s > 0.8 ? 3 : s > 0.4 ? 2 : 1; }

    rollEvent(seen) {
      // An event that just happened waits at least four months before it can happen again.
      const pool = EVENTS.filter((e) => !e.social && !seen.has(e.id) && weightOf(e, this) < 100 && this.stageFits(e) && e.when(this) && !(this.clock - (this.flags["ev-" + e.id] || -99) < 4));
      let total = 0;
      for (const e of pool) total += weightOf(e, this);
      let r = this.rng() * total;
      // Nothing that can happen: no event (otherwise the first weight-0 event would fire).
      if (!(total > 0)) return;
      for (const e of pool) {
        if (!(weightOf(e, this) > 0)) continue;
        r -= weightOf(e, this);
        if (r <= 0) { seen.add(e.id); this.fireEvent(e); return; }
      }
    }
    // Early-childhood events only happen before school, and every other event only after.
    stageFits(e) { return e.anyStage || !!e.early === this.isEarly(); }
    // q: the people the event is about ({ a: ref, ... }), from the social event's who() or a main event's
    // params(); the queue item keeps it as p so the text can name them, and the outcome carries it too.
    fireEvent(e, q) {
      this.flags["ev-" + e.id] = this.clock;
      if (q === undefined) q = e.params ? e.params(this) : null;
      if (e.choices) this.queue.push(q ? { type: "event", id: e.id, choices: e.choices, p: q } : { type: "event", id: e.id, choices: e.choices });
      else {
        const res = outcome(e.id, e.run(this, null, q));
        if (q) res.p = Object.assign({}, q, res.p);
        this.queue.push(q ? { type: "event", id: e.id, choices: 0, result: res, p: q } : { type: "event", id: e.id, choices: 0, result: res });
      }
    }

    // What the day itself deals you, from a stream of the seed and the sitting (so a given exam day is
    // the same however you played), tilted by your fortune. Often nothing happens; otherwise a stuffy
    // room, a sniffling neighbour, a lucky guess, a killer question you'd drilled, or (rarely) answers
    // marked one row off on the OMR card, caught with minutes to spare.
    examLuckEvent() {
      const r = makeRng(hashSeed(this.seed, this.year, this.attempt, "examluck"));
      const l = this.luck || 0;
      const odds = [
        ["sniffler", 0.12 - 0.05 * l], ["guess", 0.1 + 0.05 * l], ["drilled", 0.1 + 0.05 * l], ["omr", 0.04 - 0.02 * l], ["calm", 0.1 + 0.04 * l],
      ];
      let x = r();
      for (const [id, w] of odds) {
        if (x < w) {
          const s = SUBJECTS[Math.floor(r() * SUBJECTS.length)];
          const m = this.examMods;
          m.subj = m.subj || {};
          if (id === "sniffler") m.shift -= 0.1;
          else if (id === "calm") m.shift += 0.08;
          else if (id === "guess") m.subj[s] = (m.subj[s] || 0) + 0.3;
          else if (id === "drilled") m.subj[s] = (m.subj[s] || 0) + 0.4;
          else m.subj[s] = (m.subj[s] || 0) - 0.6;
          return { type: "event", id: "examluck", choices: 0, result: { key: "ev.examluck." + id, p: { s } } };
        }
        x -= w;
      }
      return null;
    }
    examEveEvent() { return { type: "event", id: "eve", choices: 3 }; }
    lunchEvent() { return { type: "event", id: "lunch", choices: 3 }; }

    // Answers queue[0] when it's an event. Returns the outcome message { key, p }.
    choose(i) {
      const top = this.queue[0];
      if (!top || top.type !== "event") throw new Error("No event to answer.");
      this.soc();
      let res;
      if (top.choices) {
        i = clamp(i | 0, 0, top.choices - 1);
        if (top.id === "eve") res = outcome("eve", this.resolveEve(i));
        else if (top.id === "lunch") res = outcome("lunch", this.resolveLunch(i));
        else res = outcome(top.id, EVENTS.find((e) => e.id === top.id).run(this, i, top.p || null));
        if (top.p) res.p = Object.assign({}, top.p, res.p);
        this.addLog("log.event", top.p ? { id: top.id, c: i, r: res, q: top.p } : { id: top.id, c: i, r: res }, "event");
      } else {
        res = top.result;
        this.addLog("log.event", { id: top.id, c: null, r: res }, "event");
      }
      this.queue.shift();
      this.flush();
      return res;
    }
    resolveEve(i) {
      const r = this.rng();
      if (i === 0) {
        if (r < 0.25 + this.stress / 300) { this.examMods.shift -= 0.12; return "r0a"; }
        this.examMods.shift += 0.06; return "r0b";
      }
      if (i === 1) {
        this.examMods.shift -= 0.06;
        if (r < 0.3) { this.examMods.shift += 0.1; return "r1a"; }
        return "r1b";
      }
      this.examMods.shift -= 0.1;
      return "r2";
    }
    resolveLunch(i) {
      const r = this.rng();
      if (i === 0) { this.examMods.lunch = 0.04; return "r0"; }
      if (i === 1) {
        if (r < 0.45) { this.examMods.lunch = -0.15; return "r1a"; }
        this.examMods.lunch = 0.05; return "r1b";
      }
      this.examMods.lunch = -0.1;
      return "r2";
    }

    // The end of grade 10: pick humanities or sciences and two inquiry subjects. Social studies becomes
    // the humanities inquiry subjects, science the sciences ones; the other foundation stops counting.
    chooseTrack(track, inq) {
      const top = this.queue[0];
      if (!top || top.type !== "track") throw new Error("Not time to choose a track.");
      if (!INQUIRY[track]) throw new Error("Unknown track.");
      const only = this.dropout == null ? this.schoolInfo().track : null;
      if (only && track !== only) throw new Error("track.school");
      const ids = INQUIRY[track].map((x) => x.id);
      if (!inq || inq.length !== 2 || inq[0] === inq[1] || ids.indexOf(inq[0]) < 0 || ids.indexOf(inq[1]) < 0) throw new Error("Pick two different inquiry subjects.");
      const from = track === "soc" ? "inq1" : "inq2";
      const base = this.skills[from], apt = this.aptitude[from];
      const rng = this.rng;
      this.skills.inq1 = base + rng.normal() * 0.12;
      this.skills.inq2 = base - 0.05 + rng.normal() * 0.12;
      this.aptitude.inq1 = apt;
      this.aptitude.inq2 = apt;
      this.track = track;
      this.inq = inq.slice();
      // The subjects themselves changed, so the app shouldn't show this as a gain or a loss.
      this.trace[this.trace.length - 1].track = true;
      this.addLog("log.track", { track, inq: this.inq }, "milestone");
      this.queue.shift();
      this.flush();
    }

    // A new school year starts every March.
    nextTurn() {
      this.month += this.turnMonths();
      if (this.month > 12) { this.month -= 12; this.year += 1; }
      // Early childhood: a birthday a year, the 돌잡이 at one, kindergarten at three, school at six.
      if (this.isEarly()) {
        this.age += 1;
        if (this.age === 1) this.queue.push({ type: "event", id: "doljabi", choices: 1 });
        if (this.age === 3) this.queue.push({ type: "school", stage: "kinder" });
        if (this.age < 6) { this.addLog("log.birthday", { a: this.age, y: this.year }, ""); return; }
        this.grade = 1;
        this.status = "elem";
        this.addLog("log.stage", { g: 1, st: "elem", y: this.year }, "milestone");
        this.soc();
        this.newTeacher();
        this.queue.push({ type: "school", stage: "elem" });
        return;
      }
      if (this.month === 3 && this.inSchool()) {
        const was = this.status;
        this.grade += 1;
        this.age += 1;
        this.status = statusForGrade(this.grade);
        this.addLog(this.status !== was ? "log.stage" : "log.grade", { g: this.grade, st: this.status, y: this.year, out: this.dropout != null }, this.status !== was ? "milestone" : "");
        // Korean schools reshuffle every class in March, so a new school year often ends bullying (less
        // often the worse it is), and a new school (middle or high school) usually does. Grade 12 is a new
        // class in the same school.
        if (this.bully) {
          const newSchool = this.status !== was && this.status !== "hs3";
          const p = newSchool ? 0.7 : [0, 0.6, 0.4, 0.2][this.bully.lv];
          if (this.rng() < p) { endBully(this); this.addLog("log.bullyEnd", { why: newSchool ? "stage" : "class" }, "event"); }
          else this.addLog("log.bullyStays", { g: this.grade }, "event");
        }
        if (this.status !== was && (this.status === "mid" || this.status === "high") && this.dropout == null) this.queue.push({ type: "school", stage: this.status });
        // Classes are reshuffled every March: a new homeroom teacher, and a new face or two.
        this.soc();
        this.newTeacher();
        const cst = this.classStage();
        if (cst && (this.status === was || this.status === "hs3")) {
          this.makePerson(this.srng("march"), { st: cst, x: this.schoolSex(), th: SCHOOL_TH[this.schoolInfo().id] || 0 });
          this.prunePeople();
        }
        // High 1: report cards and the school record start (old saves reaching it get them too).
        if (this.status === "high" && was === "mid" && this.dropout == null && !this.record) this.newRecord();
        if (this.grade === 11 && this.dropout != null && this.flags.ged != null) this.queue.push({ type: "event", id: "early", choices: 2 });
      }
      // Severe bullying costs a block a turn: days you can't face school, or can't focus when you're there.
      if (this.bully && this.bully.lv >= 3) this.lostBlocks += 1;
    }

    // Moves past informational screens the engine handles itself (exams, turn rollover).
    flush() {
      while (this.queue.length) {
        const top = this.queue[0];
        if (top.type === "mock" && !top.result) {
          top.result = this.sitExam("mock", top.m);
          this.mocks.push(top.result);
          this.practice = clamp(this.practice + 0.03, 0, 1);
          this.addLog("log.mock", { m: top.m, g: grades(top.result), sch: this.grade, pre: !this.track }, "mock");
          return;
        }
        if (top.type === "exam" && !top.result) {
          top.result = this.sitExam("suneung", 11);
          this.history.push(top.result);
          this.addLog("log.suneung", { y: this.year, g: grades(top.result), total: top.result.total }, "milestone");
          return;
        }
        if (top.type === "susiResult" && !top.results) {
          top.results = this.susiResults(top.result);
          return;
        }
        if (top.type === "nextMonth") {
          this.queue.shift();
          this.nextTurn();
          continue;
        }
        return;
      }
    }
    // Dismisses an informational screen (birth, mock report, exam report).
    dismiss() {
      const top = this.queue[0];
      if (!top) return;
      if (top.type === "event" && top.choices) throw new Error("This event needs a choice.");
      if (top.type === "event") return this.choose(0);
      if (top.type === "track") throw new Error("Choose a track first.");
      if (top.type === "susi") throw new Error("Apply or skip 수시 first.");
      this.queue.shift();
      if (top.type === "exam") {
        this.month = 12;
        // With 수시 applications in, their interviews and results come first (December, before 정시).
        const su = this.susi;
        if (su && su.y === this.year && su.att === this.attempt && su.apps.length && !su.done) {
          if (su.apps.some((a) => a.pass1)) this.queue.push({ type: "event", id: "interview", choices: 3 });
          this.queue.push({ type: "susiResult", result: top.result });
        } else this.queue.push({ type: "apply", score: admissionScore(top.result), result: top.result });
      }
      // 수시 납치: any 수시 offer takes you out of 정시, so you choose among those (or retake).
      if (top.type === "susiResult") {
        const offers = Array.from(new Set(top.results.filter((r) => r.admitted).map((r) => r.id)));
        const score = admissionScore(top.result);
        if (offers.length) this.queue.push({ type: "offers", results: top.results, offers, score, susi: true });
        else this.queue.push({ type: "apply", score, result: top.result });
      }
      this.flush();
    }

    // Exam day condition: stress and illness push ability down, practice exams steady the noise.
    sitExam(kind, month) {
      const real = kind === "suneung";
      const rng = this.rng;
      const stressHit = (this.stress > 65 ? -0.25 * (this.stress - 65) / 35 : 0) * this.trait("nerves");
      const healthHit = this.health < 45 ? -0.25 * (45 - this.health) / 45 : 0;
      const nerves = real ? -0.08 * (1 - this.practice) * this.trait("nerves") : 0;
      const sigma = 0.32 - 0.22 * this.practice;
      const dayForm = rng.normal() * sigma * 0.6 + (real ? this.examMods.shift + this.dayLuck() : 0);
      const examKey = hashSeed(this.seed, this.year, kind, month);
      const diffRng = makeRng(hashSeed(examKey, "difficulty"));
      // How well this paper happens to fit you (see PAPER_LUCK): its own stream, so the cohort and the
      // paper's difficulty don't change.
      const fitRng = makeRng(hashSeed(examKey, "fit"));
      const subjects = {};
      const shifts = {};
      for (const s of SUBJECTS) {
        // Each paper's difficulty swings year to year: 불수능 (fire) vs 물수능 (water).
        const shift = diffRng.normal() * 0.28;
        shifts[s] = shift;
        let theta = this.skills[s] + stressHit + healthHit + nerves + dayForm + rng.normal() * sigma * 0.8;
        if (real && (s === "eng" || s === "hist" || s === "inq1" || s === "inq2")) theta += this.examMods.lunch || 0;
        theta += fitRng.normal() * PAPER_LUCK + (real && this.examMods.subj ? this.examMods.subj[s] || 0 : 0);
        const pop = this.inq && (s === "inq1" || s === "inq2") ? inquiryInfo(this.inq[s === "inq1" ? 0 : 1]).pop : 0;
        const kindG = s === "eng" || s === "hist" ? "absolute" : "relative";
        subjects[s] = gradeSubject(s, theta, pop, shift, examKey, kindG);
      }
      if (real) this.examMods = { shift: 0 };
      const total = subjects.kor.std + subjects.math.std + subjects.inq1.std + subjects.inq2.std;
      return {
        kind, year: this.year, month, attempt: this.attempt, age: this.age, school: this.grade, pre: !this.track,
        subjects, shifts, total,
        headline: real ? headline(shifts) : null,
      };
    }

    // How 수능 day itself goes (see DAY_LUCK): the same for a given seed and sitting however you played.
    dayLuck() { return makeRng(hashSeed(this.seed, this.year, this.attempt, "day")).normal() * DAY_LUCK + FORTUNE_DAY * (this.luck || 0); }
    // This year's hidden move in a university's cut, in percentile points (positive: easier this year).
    cutSwing(u) { return makeRng(hashSeed(this.seed, this.year, "cut", u.id)).normal() * CUT_SWING; }
    // Admission chances for the latest 수능.
    options() {
      const top = this.queue[0];
      if (!top || top.type !== "apply") return [];
      // KAIST and POSTECH admit only in 수시, so they aren't listed.
      return UNIVERSITIES.filter((u) => !u.susiOnly).map((u) => {
        const q = this.quotaFor(u);
        const blocked = u.sci && this.track !== "sci" ? "sci" : this.menBlocked(u) ? "women" : null;
        const p = blocked ? 0 : admitChance(top.score + (q ? q.pts : 0), u, this.track);
        return { id: u.id, p, label: chanceLabel(p), blocked, quota: q ? q.kind : null };
      });
    }
    // Apply to up to three schools (가/나/다군). Returns the offers.
    apply(ids) {
      const top = this.queue[0];
      if (!top || top.type !== "apply") throw new Error("Not application season.");
      ids = Array.from(new Set(ids)).slice(0, 3);
      const open = new Set(this.options().filter((o) => !o.blocked).map((o) => o.id));
      if (ids.some((id) => !open.has(id))) throw new Error("apply.closed");
      const results = ids.map((id) => {
        const u = UNI_BY_ID[id];
        const q = this.quotaFor(u);
        const p = admitChance(top.score + (q ? q.pts : 0), u, this.track);
        // The real cut this year differs from the expected one (hidden until now), and a rejection can
        // still come good off the waitlist in February.
        const real = admitChance(top.score + (q ? q.pts : 0) + this.cutSwing(u), u, this.track);
        let admitted = this.rng() < real, wait = false;
        if (!admitted && this.rng() < WAITLIST * real) { admitted = true; wait = true; }
        if (wait) this.addLog("log.waitlist", { uni: id }, "milestone");
        return { id, p, admitted, quota: q ? q.kind : null, wait };
      });
      this.queue.shift();
      const offers = results.filter((r) => r.admitted).map((r) => r.id);
      this.addLog("log.apply", { r: results.map((r) => [r.id, r.admitted]) }, "milestone");
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
        this.leaveSchool();
        const uni = d.action === "enroll" ? UNI_BY_ID[d.uni] : null;
        // The calendar moves on to March, and so does the birthday (the stats card shows this age).
        this.month = 3;
        this.year += 1;
        this.age += 1;
        this.ending = { uni: uni && uni.id, attempts: this.attempt, age: this.age, best: this.bestResult() };
        this.addLog(uni ? "log.enroll" : "log.quit", { uni: uni && uni.id, y: this.year }, "milestone");
        return;
      }
      if (["academy", "selfstudy", "halfretake"].indexOf(d.action) < 0) throw new Error("Unknown action.");
      const ro = this.retakeOptions(top.score).find((o) => o.id === d.action);
      if (ro.blocked) throw new Error(ro.blocked);
      this.leaveSchool();
      this.scholarship = !!ro.scholarship;
      // A full retake means leaving the 반수 school, so it stops being a fallback; another 반수 keeps one.
      if (d.action === "halfretake") this.enrolled = d.uni;
      else if (this.enrolled) {
        this.addLog("log.dropUni", { uni: this.enrolled }, "event");
        this.enrolled = null;
      }
      this.status = d.action;
      // Your class graduates. A retake academy or a campus brings new faces; a study café doesn't.
      this.soc();
      const st = this.classStage();
      if (st) this.newClass(st, "retake");
      else this.leaveClass();
      this.social.teacher = null;
      this.attempt += 1;
      this.age += 1;
      this.year += 1;
      this.month = 3;
      this.motivation = clamp(this.motivation + 10, 0, 100);
      this.stress = clamp(this.stress - 15, 0, 100);
      this.health = clamp(this.health + 15, 0, 100);
      if (this.attempt === 4 && this.parents !== "care") this.addLog("log.halfpay", null, "event");
      this.addLog("log.newyear", { y: this.year, att: this.attempt, st: d.action, sch: this.scholarship, pays: this.paysAcademy(), uni: this.enrolled }, "milestone");
      this.trace.push({ t: this.t(), att: this.attempt, ph: this.phase(), skills: Object.assign({}, this.skills) });
    }

    // Study efficiency while bullied: severity 1–3 takes 10% a level, 30% less with support. null when not.
    // Saves from before v2.3 have no `bully` field, which reads as not bullied.
    bullyPenalty() {
      const b = this.bully;
      if (!b) return null;
      const cut = 0.1 * b.lv * (b.sup ? 0.7 : 1);
      return { lv: b.lv, eff: 1 - cut, cut, sup: !!b.sup, lostBlock: b.lv >= 3, n: b.n };
    }
    // Graduating from high school leaves any bullying behind.
    leaveSchool() {
      if (!this.bully) return;
      endBully(this);
      this.addLog("log.bullyEnd", { why: "grad" }, "event");
    }

    // ----- 내신 and the school record (v6.0) -----
    // Both start at High 1 (nextTurn). Saves from before v6.0 that were already in high school have
    // neither: no report cards, no record, and no 수시 (정시 only, as before).
    newRecord() {
      this.naesin = { exams: [], sems: [] };
      this.record = { field: null, club: null, sete: 0, career: 0, comm: 0, vol: 0, proj: 0, prep: 0, school: this.schoolInfo().id };
    }
    // The record is open in High 1–2 and High 3 until the end of August, at school, on your first try.
    recordOpen() {
      return !!this.record && this.attempt === 1 && this.inClass() && (this.status === "high" || (this.status === "hs3" && this.month <= 8));
    }
    // The school exam this turn ends in, as [semester, "mid" | "fin"], or null.
    naesinTerm() {
      if (!this.naesin || !this.recordOpen()) return null;
      const t = NAESIN_TERMS[this.status];
      return (t && t[this.month]) || null;
    }
    // An exam this turn or next (High 3 plays monthly, so prep in March counts for April's midterm).
    examSoon() { return this.naesinTerm() || (this.status === "hs3" && (this.month === 3 || this.month === 6) ? [1, this.month === 3 ? "mid" : "fin"] : null); }
    // Your classmates' ability in one subject at your school: { mean, sd }.
    classmates(s) {
      const x = this.schoolInfo();
      const spec = SCHOOL_COHORT[x.id] || {};
      const general = x.id === "pubHigh" || x.id === "privHigh";
      const shift = (spec[s] != null ? spec[s] : spec.all || 0) + (general ? REGION_COHORT[regionKind(this)] || 0 : 0);
      return { mean: this.typicalLevel() + COHORT_MEAN + shift, sd: spec.sd || COHORT_SD };
    }
    // Sits this turn's school exam: per subject a raw score out of 100, the absolute achievement (A–E)
    // and the relative grade (1–5); after a final, the semester grades. Its own seeded stream, so the
    // main RNG never moves. Returns the report-card screen.
    sitNaesin(term) {
      const [sem, kind] = term;
      const r = makeRng(hashSeed(this.seed, "naesin", this.year, this.month));
      const rec = this.record;
      const bonus = PREP_MAX * (1 - Math.exp(-(rec.prep || 0) / 1.5));
      rec.prep = 0;
      const stressHit = this.stress > 70 ? -0.12 * (this.stress - 70) / 30 : 0;
      const subs = this.grade === 10 ? NAESIN_SUBJ.concat("hist") : NAESIN_SUBJ;
      const out = {};
      for (const s of subs) {
        const c = this.classmates(s);
        const th = this.skills[s] + bonus + stressHit + r.normal() * NAESIN_NOISE;
        const z = (th - c.mean) / c.sd;
        const top = Math.round((1 - phi(z)) * 1000) / 1000;
        const raw = clamp(Math.round(100 / (1 + Math.exp(-1.3 * (th - c.mean + 0.5)))), 0, 100);
        out[s] = { raw, ach: raw >= 90 ? "A" : raw >= 80 ? "B" : raw >= 70 ? "C" : raw >= 60 ? "D" : "E", top, g: naesinGrade(top) };
      }
      const avgOf = (o) => Math.round(100 * Object.keys(o).reduce((a, s) => a + (o[s].g || o[s]), 0) / Object.keys(o).length) / 100;
      const exam = { y: this.year, m: this.month, gr: this.grade, sem, kind, s: out, avg: avgOf(out), prep: Math.round(bonus * 100) / 100 };
      const prev = this.naesin.exams[this.naesin.exams.length - 1];
      this.naesin.exams.push(exam);
      let semRec = null;
      if (kind === "fin") {
        // The semester grade: both exams and the performance assessments, which follow engagement.
        const mid = this.naesin.exams.find((e) => e.gr === this.grade && e.sem === sem && e.kind === "mid");
        const g = {};
        for (const s of subs) {
          const c = this.classmates(s);
          const perf = 1 - phi((this.skills[s] + 0.35 * (this.motivation - 60) / 40 + r.normal() * 0.2 - c.mean) / c.sd);
          const m = mid && mid.s[s] ? mid.s[s].top : out[s].top;
          g[s] = naesinGrade(SEM_W.mid * m + SEM_W.fin * out[s].top + SEM_W.perf * perf);
        }
        semRec = { y: this.year, gr: this.grade, sem, g, avg: avgOf(g) };
        this.naesin.sems.push(semRec);
      }
      // Exam weeks are tense; a better report than last time lifts you, a worse one stings.
      const d = { stress: 3, motivation: prev ? clamp(Math.round((prev.avg - exam.avg) * 4), -4, 4) : 0 };
      bump(this, d);
      const run = this.naesinAvg();
      this.addLog("log.naesin", { gr: this.grade, sem, kind, avg: exam.avg, sa: semRec && semRec.avg, run }, "mock");
      return { type: "naesin", result: exam, sem: semRec, run };
    }
    // Your 내신 average: every semester grade of every subject, equally weighted (real schools weight
    // by credit hours). null before the first semester ends, or with no record.
    naesinAvg() {
      if (!this.naesin || !this.naesin.sems.length) return null;
      let n = 0, t = 0;
      for (const x of this.naesin.sems) for (const s in x.g) { t += x.g[s]; n++; }
      return Math.round((t / n) * 100) / 100;
    }
    // How well your intended field fits your track: 1 when it matches, 0.4 when it doesn't, 0.9
    // before the track choice, 0.5 with no field yet.
    fieldFit() {
      const f = this.record && this.record.field;
      if (!f) return 0.5;
      if (!this.track) return 0.9;
      return FIELDS[f] === this.track ? 1 : 0.4;
    }
    // One turn's additions to the record (called by advance while the record is open).
    recordTurn(plan, months, attend, studyShare) {
      const r = this.record;
      const fit = this.fieldFit();
      r.school = this.schoolInfo().id;
      r.prep += plan.prep || 0;
      // Teachers write 세특 about the students who engage: attention in class, how much of your time
      // goes to study, research projects and books that come up in class.
      r.sete += months * attend * (0.35 + 0.65 * studyShare) * 0.75 + 0.6 * (plan.project || 0) * months + 0.25 * (plan.reading || 0) * months;
      const cb = (plan.club || 0) * months;
      if (cb) {
        const c = r.club || "fun";
        if (c === "acad") { r.career += 0.8 * cb * fit; r.sete += 0.3 * cb; r.comm += 0.5 * cb; }
        else if (c === "vol") { r.comm += 1.2 * cb; r.career += 0.2 * cb; }
        else r.comm += 0.8 * cb;
      }
      const vb = (plan.volunteer || 0) * months;
      if (vb) { r.comm += 1.2 * vb; r.vol += 8 * vb; }
      const pb = (plan.project || 0) * months;
      if (pb) { r.career += 1.4 * pb * fit; r.proj += pb / 3; }
      // Group work and class life: time with friends shows up as collaboration.
      r.comm += 0.15 * (plan.friends || 0) * months;
    }
    // The three qualities universities read (0–100), and the 내신 behind them. With u, as that
    // university reads them: medical schools want a medical field, science institutes a science one.
    recordScores(u) {
      const r = this.record;
      if (!r) return null;
      const avg = this.naesinAvg();
      const read = SCHOOL_READ[r.school] || 0;
      const nScore = avg == null ? 50 : clamp(100 - 35 * (Math.max(1, avg - read) - 1), 0, 100);
      const sete = 100 * (1 - Math.exp(-r.sete / SETE_K));
      const acad = 0.7 * nScore + 0.3 * sete;
      let career = 100 * (1 - Math.exp(-(r.career + (r.field ? 4 * this.fieldFit() : 0)) / CAREER_K));
      if (u && u.id === "med" && r.field !== "med") career *= 0.6;
      else if (u && u.sci && FIELDS[r.field] !== "sci") career *= 0.7;
      const comm = 20 + 80 * (1 - Math.exp(-r.comm / COMM_K));
      const rd = (x) => Math.round(x * 10) / 10;
      return { acad: rd(acad), career: rd(career), comm: rd(comm), naesin: avg, sete: rd(sete) };
    }
    recordScore(u) {
      const s = this.recordScores(u);
      return s ? Math.round((RECORD_W.acad * s.acad + RECORD_W.career * s.career + RECORD_W.comm * s.comm) * 10) / 10 : 0;
    }

    // ----- 수시 (v6.0) -----
    // 기회균형 eligibility: in care, or a low-income household on basic livelihood or near-poverty
    // support (about half the bottom fifth here; its own stream, so it's fixed for the life).
    balanceQuota() {
      return this.parents === "care" || (this.family === "q1" && makeRng(hashSeed(this.seed, "balance"))() < 0.5);
    }
    // The best 수시 quota you qualify for at a university, or null.
    susiQuota(u) {
      if (this.dropout != null || !this.record) return null;
      if (this.localQuota() && (u.id === "med" || u.id === this.regionInfo().nat)) return "local";
      if (this.ruralQuota() && u.id !== "college") return "rural";
      if (this.balanceQuota() && u.id !== "college") return "balance";
      return null;
    }
    // Whether this year's 수시 round is open to you: on your first try with a record, or later with
    // the record you left school with; out of school (검정고시), only 논술.
    susiOpen() {
      if (this.susi && this.susi.y === this.year && this.susi.att === this.attempt) return false;
      return !!this.record || this.dropout != null;
    }
    // A woman-only university for a man. Saves from before the sex choice have none: allowed.
    menBlocked(u) { return !!u.women && this.sex === "m"; }
    // The odds of a 논술 application before 최저: your essay ability against the school's line.
    nsChance(u) {
      const essay = 0.6 * this.skills.kor + 0.4 * (this.track === "sci" ? this.skills.math : this.skills.inq1);
      return NS_MAX * logistic((essay - (invPhi(u.cut / 100) + NS_EDGE)) / NS_SLOPE);
    }
    // The chance of meeting a 수능 최저 [n, sum], from this year's latest mock (or your ability before
    // any), allowing for a grade either way on the day. A fixed stream, so the number doesn't flicker.
    minChance(min) {
      if (!min) return 1;
      const mock = this.mocks.filter((x) => x.year === this.year && x.attempt === this.attempt).pop();
      const base = {};
      for (const s of ["kor", "math", "eng", "inq1", "inq2"]) {
        if (mock && !mock.pre) base[s] = mock.subjects[s].grade;
        else { const q = 1 - phi(this.skills[s]); let gr = 9; for (let i = 0; i < GRADE_CUTS.length; i++) if (q < GRADE_CUTS[i]) { gr = i + 1; break; } base[s] = gr; }
      }
      const r = makeRng(hashSeed(this.seed, "minp", this.year, this.attempt));
      let ok = 0;
      const N = 400;
      for (let k = 0; k < N; k++) {
        const g = (s) => clamp(Math.round(base[s] + r.normal() * 0.9), 1, 9);
        const gs = [g("kor"), g("math"), g("eng"), Math.min(g("inq1"), g("inq2"))].sort((a, b) => a - b);
        if (gs.slice(0, min[0]).reduce((a, b) => a + b, 0) <= min[1]) ok++;
      }
      return ok / N;
    }
    // Every 수시 option on the application screen: one per university and type, with its chance before
    // the 수능 (p: the record, 내신 or essay part; minP: meeting the 최저; all: both) and why it's closed.
    susiOptions() {
      const top = this.queue[0];
      if (!top || top.type !== "susi") return [];
      const out = [];
      const avg = this.naesinAvg();
      const grad = this.attempt > 1;
      const minP = {};
      const mp = (m) => { const k = m ? m.join(",") : "-"; if (minP[k] == null) minP[k] = this.minChance(m); return minP[k]; };
      for (const u of UNIVERSITIES) {
        const q = this.susiQuota(u);
        for (const type of ["gk", "jh", "ns"]) {
          if (type === "ns" ? !u.ns : u[type] == null) continue;
          const min = u[type + "Min"] || null;
          let p = 0, blocked = null;
          if (u.sci && this.track !== "sci") blocked = "sci";
          else if (this.menBlocked(u)) blocked = "women";
          else if (type !== "ns" && (this.dropout != null || !this.record)) blocked = "ged";
          else if (type === "gk" && grad && u.gkGrad === false) blocked = "grad";
          else if (type === "gk" && avg == null) blocked = "ged";
          if (!blocked) {
            if (type === "gk") p = gkChance(avg + (GK_PENALTY[this.record.school] || 0), u.gk + (q ? SUSI_QUOTA[q].gk : 0));
            else if (type === "jh") p = logistic((this.recordScore(u) - u.jh + (q ? SUSI_QUOTA[q].jh : 0)) / JH_SLOPE);
            else p = this.nsChance(u);
          }
          const m = blocked ? 1 : mp(min);
          out.push({ uni: u.id, type, p, min, minP: m, all: p * m, label: chanceLabel(p * m), blocked, quota: type === "ns" ? null : q, iv: type === "jh" && !!u.iv, free: !!u.free });
        }
      }
      return out;
    }
    // Apply in 수시: picks = [{ uni, type }], at most six (KAIST free). An empty list skips 수시.
    applySusi(picks) {
      const top = this.queue[0];
      if (!top || top.type !== "susi") throw new Error("Not 수시 season.");
      const opts = this.susiOptions();
      const seen = new Set();
      const apps = [];
      for (const pk of picks || []) {
        const o = opts.find((x) => x.uni === pk.uni && x.type === pk.type);
        if (!o || o.blocked) throw new Error("susi.closed");
        if (seen.has(o.uni + o.type)) continue;
        seen.add(o.uni + o.type);
        apps.push({ uni: o.uni, type: o.type, quota: o.quota, p: Math.round(o.p * 1000) / 1000, min: o.min, iv: o.iv, free: o.free,
          s: o.type === "jh" ? this.recordScore(UNI_BY_ID[o.uni]) : null });
      }
      if (apps.filter((a) => !a.free).length > SUSI_MAX) throw new Error("susi.max");
      this.susi = { y: this.year, att: this.attempt, apps, avg: this.naesinAvg() };
      this.queue.shift();
      if (apps.length) this.addLog("log.susiApply", { r: apps.map((a) => [a.uni, a.type]) }, "milestone");
      else this.addLog("log.susiSkip", null, "event");
      this.flush();
    }
    // The 종합 document round for schools with an interview, announced in October.
    susiStage() {
      const apps = this.susi.apps.filter((a) => a.type === "jh" && a.iv);
      for (const a of apps) {
        const u = UNI_BY_ID[a.uni];
        const cut = u.jh - (a.quota ? SUSI_QUOTA[a.quota].jh : 0);
        a.pass1 = makeRng(hashSeed(this.seed, "susi1", this.year, a.uni))() < logistic((a.s - cut + JH_STAGE) / JH_SLOPE);
      }
      this.addLog("log.susiStage", { r: apps.map((a) => [a.uni, a.pass1]) }, "milestone");
      return { type: "susiStage", r: apps.map((a) => ({ uni: a.uni, pass: a.pass1 })) };
    }
    // Final 수시 results, after the 수능 (December): each application's verdict, the 최저 check, and
    // waitlist places. Own streams, one per application.
    susiResults(res) {
      const out = [];
      const ivb = this.susi.iv || 0;
      for (const a of this.susi.apps) {
        const u = UNI_BY_ID[a.uni];
        const r = makeRng(hashSeed(this.seed, "susi", this.year, a.uni, a.type));
        const q = a.quota ? SUSI_QUOTA[a.quota] : null;
        let real;
        if (a.type === "gk") real = gkChance(this.susi.avg + (GK_PENALTY[this.record.school] || 0), u.gk + (q ? q.gk : 0) + r.normal() * SUSI_SWING.gk);
        else if (a.type === "jh") {
          const cut = u.jh - (q ? q.jh : 0) + r.normal() * SUSI_SWING.jh;
          if (a.iv) {
            // Given the document round, the interview decides: the odds you'd have with the
            // interview's points, over the odds of having passed the first round.
            const p1 = logistic((a.s - cut + JH_STAGE) / JH_SLOPE);
            real = a.pass1 ? clamp(logistic((a.s + ivb + r.normal() * IV_DAY - cut) / JH_SLOPE) / p1, 0, 1) : 0;
          } else real = logistic((a.s - cut) / JH_SLOPE);
        } else real = NS_MAX * logistic((0.6 * this.skills.kor + 0.4 * (this.track === "sci" ? this.skills.math : this.skills.inq1) - (invPhi(u.cut / 100) + NS_EDGE)) / NS_SLOPE + r.normal() * 0.3);
        const minOk = meetsMin(a.min, res);
        let admitted = r() < real, wait = false;
        if (!admitted && real > 0 && r() < WAITLIST * real) { admitted = true; wait = true; }
        if (!minOk) admitted = wait = false;
        out.push({ id: a.uni, type: a.type, quota: a.quota, admitted, wait, minFail: !minOk, stage1Fail: a.iv && a.pass1 === false, p: a.p });
      }
      this.susi.done = true;
      this.addLog("log.susiResult", { r: out.map((x) => [x.id, x.type, x.admitted, x.minFail]) }, "milestone");
      return out;
    }

    bestResult() {
      let best = null;
      for (const r of this.history) if (!best || r.total > best.total) best = r;
      return best;
    }

    // ----- people (see the "people" constants above) -----
    // g.social = { n: last id used, people: [person], best, rival, crush, partner, bully: person ids or
    // null, exes: [ids], teacher: { s, x, sty, g } or null, focus: the friend you chose to spend time
    // with, intro: a new seatmate waiting to be introduced }.
    // A person: { id, s: surname, n: given name, x: "m" | "f", lk: look seed (art.js lookFor), tr: two
    // PERSONAS ids, th: ability at their own 수능 (θ), cl: closeness 0–100, st: where you met
    // (a CLASS_SIZE key, or "out"), met: clock, here: in your class now, away: clock they left it,
    // keep: keeps in touch, out: where you met someone from outside school, like: a head start on
    // saying yes, fight: clock of a fight not yet made up }.
    static freshSocial() { return { n: 0, people: [], best: null, rival: null, crush: null, partner: null, bully: null, exes: [], teacher: null, focus: null, intro: null }; }
    // The social state, built on first use for saves from before it existed.
    soc() {
      if (!this.social) {
        this.social = Game.freshSocial();
        const st = this.classStage();
        if (st) this.newClass(st, "lazy");
        this.newTeacher(true);
      }
      return this.social;
    }
    // A stream for the people side of life: the seed, the month and a tag, never the main RNG.
    srng(...tags) { return makeRng(hashSeed(this.seed, "soc", this.clock, ...tags)); }
    person(id) { return (id != null && this.social && this.social.people.find((p) => p.id === id)) || null; }
    // Who your classmates are right now: a CLASS_SIZE key, or null (a baby, out of school, a study café).
    classStage() {
      if (this.isEarly()) return this.atKinder() ? (this.schoolInfo().id === "homeCare" ? "play" : "kinder") : null;
      if (this.inClass()) return this.status === "elem" ? "elem" : this.status === "mid" ? "mid" : "high";
      if (this.status === "academy") return "academy";
      if (this.status === "halfretake") return "uni";
      return null;
    }
    // "m" or "f" at a boys' or girls' school (the real school's sex, when places.js knows it), else null.
    schoolSex() {
      if (!this.inClass()) return null;
      const r = this.realSchool();
      return r && (r.sex === "m" || r.sex === "f") ? r.sex : null;
    }
    makePerson(r, o) {
      const s = this.social;
      const x = o.x === "m" || o.x === "f" ? o.x : r() < 0.5 ? "m" : "f";
      const t1 = pickW(r, PERSONAS);
      const t2 = pickW(r, PERSONAS.filter((e) => e[0] !== t1));
      // No two people in your class with the same given name.
      let sur, given;
      for (let k = 0; k < 8; k++) {
        sur = pickW(r, SURNAMES);
        given = pickW(r, nameList(x));
        if (!s.people.some((q) => q.n === given && (q.here || q.s === sur))) break;
      }
      const th = r.normal() * 0.9 + (PERSONA_TH[t1] || 0) + (PERSONA_TH[t2] || 0) * 0.5 + (o.th || 0);
      const id = ++s.n;
      const p = { id, s: sur, n: given, x, lk: hashSeed(this.seed, "look", id) & 0x7fffffff, tr: [t1, t2], th: Math.round(th * 100) / 100,
        cl: Math.round(5 + r() * 15), st: o.st, met: this.clock, here: o.here !== false, like: Math.round(r() * 25) / 100 };
      if (o.out) p.out = o.out;
      s.people.push(p);
      return p;
    }
    // A new class: at a new school stage, after a move or a transfer, or in a retake year. A friend or
    // two may come along to the next school; everyone else stays behind (the best friend keeps in touch).
    newClass(st, why) {
      const s = this.social, r = this.srng("class", st, why);
      const sex = this.schoolSex();
      const carry = new Set();
      if (why === "stage" && CARRY[st] && !(this.inClass() && this.schoolInfo().board)) {
        const cands = s.people.filter((p) => p.here && !p.out && (!sex || p.x === sex) && p.id !== s.bully).sort((a, b) => b.cl - a.cl);
        for (const p of cands.slice(0, CARRY[st])) if (r() < 0.6) carry.add(p.id);
      }
      this.leaveClass(carry);
      for (const id of carry) this.person(id).st = st;
      const th = (this.inClass() && SCHOOL_TH[this.schoolInfo().id]) || 0;
      const fresh = [];
      for (let i = 0; i < CLASS_SIZE[st]; i++) fresh.push(this.makePerson(r, { st, x: sex, th }));
      if (s.rival != null && !(this.person(s.rival) || {}).here) s.rival = null;
      if (st === "mid" || st === "high" || st === "academy") this.pickRival(r, fresh);
      s.intro = why === "lazy" ? null : fresh[0].id;
      if (why !== "lazy") this.addLog("log.soc.class", { st, why, with: [...carry].map((id) => ref(this.person(id))) }, "");
      this.prunePeople();
    }
    // Everyone in your class goes on with their lives without you (out of school, a new school).
    leaveClass(keep) {
      const s = this.soc();
      for (const p of s.people) {
        if (!p.here || (keep && keep.has(p.id))) continue;
        p.here = false;
        p.away = this.clock;
        const close = p.id === s.best || p.id === s.partner;
        // A best friend keeps in touch by phone; the rest drift.
        if (close) p.keep = 1;
        p.cl = Math.round(p.cl * (close ? 0.85 : 0.6) * 10) / 10;
      }
    }
    // The rival: often the classmate just above you in class rank.
    pickRival(r, pool) {
      if (!pool.length) return;
      const now = (this.skills.kor + this.skills.math + this.skills.eng + this.skills.inq1 + this.skills.inq2) / 5;
      const p = pool.find((q) => q.tr[0] === "studious") || pool[Math.floor(r() * pool.length)];
      p.th = Math.round((now + 0.12 + r() * 0.25 + this.climbLeft()) * 100) / 100;
      this.social.rival = p.id;
    }
    // Classmates climb the typical line to their own 수능 level, so their ability now is that, less the
    // climb they still have ahead.
    climbLeft() { return TYPICAL_CLIMB * Math.max(0, 12 - Math.max(1, this.grade)); }
    thNow(p) { return p.th - this.climbLeft(); }
    // A new homeroom teacher every March while you're in class.
    newTeacher(quiet) {
      const s = this.social;
      if (!this.inClass()) { s.teacher = null; return; }
      const r = this.srng("teacher", this.grade);
      s.teacher = { s: pickW(r, SURNAMES), x: r() < (TEACHER_F[this.status] || 0.6) ? "f" : "m", sty: pickW(r, Object.keys(TEACHERS).map((k) => [k, TEACHERS[k].w])), g: this.grade };
      if (!quiet) this.addLog("log.homeroom", { t: s.teacher, g: this.grade }, "");
    }
    teacherFx() { const t = this.inClass() && this.social && this.social.teacher; return t ? TEACHERS[t.sty] || null : null; }
    prunePeople() {
      const s = this.social;
      const keep = new Set([s.best, s.rival, s.crush, s.partner, s.bully, s.focus].concat(s.exes || []));
      while (s.people.length > MAX_PEOPLE) {
        let worst = null;
        for (const p of s.people) if (!p.here && !keep.has(p.id) && (!worst || p.cl < worst.cl)) worst = p;
        if (!worst) break;
        s.people.splice(s.people.indexOf(worst), 1);
      }
    }
    closer(id, d) { const p = this.person(id); if (p) p.cl = Math.round(clamp(p.cl + d, 0, 100) * 10) / 10; }
    // What someone is to you, for the Friends panel: partner, bully (while it lasts), crush, best friend
    // (단짝), rival, ex, friend (your group), classmate, an old friend, or someone met outside school.
    roleOf(p) {
      const s = this.social;
      if (p.id === s.partner) return "partner";
      if (p.id === s.bully && this.bully) return "bully";
      if (p.id === s.crush) return "crush";
      if (p.id === s.best) return "best";
      if (p.id === s.rival && p.here) return "rival";
      if ((s.exes || []).indexOf(p.id) >= 0) return "ex";
      if (p.cl >= GROUP) return "friend";
      return p.here ? "classmate" : p.out ? "out" : "old";
    }
    // The friend the player chose to spend this turn's friend blocks with (null: whoever's around).
    setFocus(id) {
      const s = this.soc();
      s.focus = id != null && this.person(id) && this.roleOf(this.person(id)) !== "bully" ? id : null;
    }
    // Someone from the people you know, more likely the closer they are. o: { here, min, tag, keep, not }.
    friendPick(r, o) {
      const s = this.soc();
      const pool = s.people.filter((p) => (o.here == null || !!p.here === o.here) && p.cl >= (o.min || 0) && p.id !== s.bully && (!o.tag || p.tr.indexOf(o.tag) >= 0) &&
        (!o.keep || p.keep || p.id === s.best) && (o.not || []).indexOf(p.id) < 0);
      return pool.length ? pickW(r, pool.map((p) => [p, p.cl + 10])) : null;
    }
    // Someone to like (or who likes you): from your class when it has boys and girls, otherwise someone
    // met outside school (a cram school, church, a friend's friend from another school).
    romancePick(r, admirer) {
      const s = this.soc();
      if (!admirer && s.crush != null && this.person(s.crush)) return this.person(s.crush);
      const other = this.sex === "m" ? "f" : this.sex === "f" ? "m" : null;
      const pool = s.people.filter((p) => p.here && (!other || p.x === other) && p.id !== s.bully && p.id !== s.best && p.id !== s.crush && (s.exes || []).indexOf(p.id) < 0);
      if (pool.length) return pickW(r, pool.map((p) => [p, p.cl + 10]));
      const p = this.makePerson(r, { st: "out", x: other, out: OUTSIDE[Math.floor(r() * OUTSIDE.length)], here: false });
      p.cl = 20;
      p.keep = 1;
      return p;
    }
    startDating(p) {
      const s = this.social;
      s.crush = null;
      s.partner = p.id;
      this.closer(p.id, 20);
      this.addLog("log.soc.partner", { a: ref(p) }, "event");
    }
    endDating(why) {
      const s = this.social, p = this.person(s.partner);
      s.partner = null;
      if (!p) return;
      s.exes = (s.exes || []).concat(p.id);
      p.cl = Math.round(p.cl * 0.4 * 10) / 10;
      this.addLog("log.soc.ex", { a: ref(p), why }, "event");
    }
    // One turn of friendships: closeness fades (slowly with classmates you see every day, faster with
    // people you don't), a seatmate gets a little closer on their own, and each block of hanging out
    // goes to the friend you chose or whoever you're closest to. A studious friend turns some of it into
    // studying together; a funny one, a sporty one or a gamer changes what the afternoon does to you.
    // A best friend takes a point off stress. Returns { fr, sg } for the turn's log line.
    socialTurn(plan) {
      const s = this.soc(), months = this.turnMonths(), r = this.srng("turn");
      for (const p of s.people) {
        let rate = p.here ? 0.5 : p.id === s.best || p.keep ? 0.45 : 1.2;
        if (p.id === s.partner) rate = p.here ? 0.3 : 0.6;
        if (p.tr.indexOf("quiet") >= 0) rate *= 0.7;
        p.cl = Math.max(0, p.cl - rate * months);
      }
      const here = s.people.filter((p) => p.here && !(this.bully && p.id === s.bully));
      if (here.length && (this.inClass() || this.atKinder())) here[Math.floor(r() * here.length)].cl += 3;
      // Out of school, or with no classmates, you meet the old friends you're still close to.
      const pool = here.length ? here : s.people.filter((p) => p.cl >= 20 && p.id !== s.bully);
      const d = { stress: 0, health: 0, motivation: 0 };
      const focus = this.person(s.focus);
      let with1 = null, together = 0;
      for (let i = 0; i < (plan.friends || 0) && pool.length; i++) {
        const t = focus && pool.indexOf(focus) >= 0 ? focus : pickW(r, pool.map((p) => [p, (p.cl + 15) * (p.tr.indexOf("kind") >= 0 ? 1.2 : 1)]));
        const has = (k) => t.tr.indexOf(k) >= 0;
        t.cl += (FRIEND_GAIN + 4 * r()) * Math.sqrt(this.trait("friends")) * (has("kind") ? 1.2 : 1) * (has("quiet") ? 0.85 : 1);
        if (!with1) with1 = t;
        // Someone else tags along.
        if (pool.length > 1) { const o = pool[Math.floor(r() * pool.length)]; if (o !== t) o.cl += 3; }
        if (has("funny")) d.stress -= 2;
        if (has("sporty")) d.health += 2;
        if (has("gamer")) d.motivation -= 1;
        if (has("studious") && this.grade >= 4) { studyBoost(this, pickWeak(this), STUDY_TOGETHER); together++; }
      }
      for (const p of s.people) p.cl = Math.round(clamp(p.cl, 0, 100) * 10) / 10;
      this.updateRoles();
      const best = this.person(s.best);
      if (best && best.cl >= BEST) d.stress -= 1;
      bump(this, d);
      return { fr: ref(with1), sg: together };
    }
    // The best friend (단짝) is whoever you're closest to from BEST up; they stay it until they fall
    // under DRIFT or someone else is clearly closer.
    updateRoles() {
      const s = this.social;
      const cur = this.person(s.best);
      let top = null;
      for (const p of s.people) if (p.id !== s.partner && p.id !== s.bully && (!top || p.cl > top.cl)) top = p;
      if (cur && cur.cl >= DRIFT && !(top && top !== cur && top.cl >= cur.cl + 15)) return;
      if (top && top !== cur && top.cl >= BEST) { s.best = top.id; this.addLog("log.soc.best", { a: ref(top), was: ref(cur) }, "event"); return; }
      if (cur && cur.cl < DRIFT) { s.best = null; this.addLog("log.soc.drift", { a: ref(cur) }, "event"); }
    }
    // At most one social event a turn (more likely in a long turn), from its own stream: a new seatmate
    // is introduced first, then anything in the social pool that fits.
    rollSocial(seen) {
      const s = this.soc(), r = this.srng("ev");
      if (s.intro != null) {
        const p = this.person(s.intro);
        s.intro = null;
        if (p && p.here) { seen.add("soc-seatmate"); this.fireEvent(EVENTS.find((e) => e.id === "soc-seatmate"), { a: ref(p), st: p.st }); return; }
      }
      if (r() >= SOCIAL_RATE * Math.sqrt(this.turnMonths())) return;
      const pool = EVENTS.filter((e) => e.social && !e.forced && !seen.has(e.id) && this.stageFits(e) && e.when(this) && weightOf(e, this) > 0 && !(this.clock - (this.flags["ev-" + e.id] || -99) < 4));
      if (!pool.length) return;
      const e = pickW(r, pool.map((x) => [x, weightOf(x, this)]));
      const q = e.who ? e.who(this, r) : {};
      if (q) { seen.add(e.id); this.fireEvent(e, q); }
    }
    // After a mock (high school, retakes) or a semester's class ranks (middle school), you sometimes
    // hear how your rival did (about a third of the time).
    rivalCheck(mock) {
      const s = this.soc(), p = this.person(s.rival);
      if (!p || !p.here || this.srng("rival")() >= 0.35) return;
      if (mock) {
        this.flags["ev-soc-rivalmock"] = this.clock;
        this.queue.push({ type: "event", id: "soc-rivalmock", choices: 1, p: { a: ref(p) } });
        return;
      }
      const mine = this.classRank();
      let theirs = clamp(Math.round((1 - phi((this.thNow(p) + this.srng("rank").normal() * 0.15 - this.typicalLevel()) / 0.8)) * 30) + 1, 1, 30);
      if (theirs === mine) theirs = mine === 1 ? 2 : mine - 1;
      this.fireEvent(EVENTS.find((e) => e.id === "soc-rivalrank"), { a: ref(p), me: mine, them: theirs });
    }
    // Who's at the 수능 gate for you (or texting, in a retake year): someone you're dating, your best
    // friend, or a close friend. Nobody, and there's no screen.
    gateEvent() {
      const s = this.soc();
      const p = this.person(s.partner) || this.person(s.best) || this.friendPick(this.srng("gate"), { min: GROUP });
      if (!p) return;
      this.fireEvent(EVENTS.find((e) => e.id === "soc-gate"), { a: ref(p), k: p.id === s.partner ? "p" : this.attempt > 1 || !p.here ? "r" : "f" });
    }
    // Bullying with a face: one of the meaner classmates (or a new older kid), and the friend who might
    // stand by you. Only names: the bullying rates and odds are the same as without them.
    pickBully() {
      const s = this.soc(), r = this.srng("bully");
      const pool = s.people.filter((p) => p.here && p.id !== s.best && p.id !== s.partner && p.cl < GROUP);
      const mean = pool.filter((p) => p.tr.indexOf("bossy") >= 0 || p.tr.indexOf("troubled") >= 0);
      let p = mean.length ? mean[Math.floor(r() * mean.length)] : null;
      if (!p) {
        p = this.makePerson(r, { st: this.classStage() || "elem", x: this.schoolSex() || (r() < 0.65 ? "m" : "f") });
        p.tr = ["bossy", p.tr[1] === "bossy" ? "troubled" : p.tr[1]];
      }
      p.cl = 0;
      s.bully = p.id;
      if (s.focus === p.id) s.focus = null;
      return { by: ref(p), fr: ref(this.friendPick(r, { here: true, min: GROUP, not: [p.id] })) };
    }
    bullyParams() {
      const s = this.soc(), p = this.person(s.bully);
      const fr = this.friendPick(this.srng("bullyfr"), { here: true, min: GROUP, not: [s.bully] });
      return p || fr ? { by: ref(p), fr: ref(fr) } : null;
    }
    // Where the people closest to you ended up: their own 수능 and university (or a retake year, or a
    // job), from their own seeded ability, the same whatever you do. For the ending screen and the
    // epilogue. Returns up to n (default 5), closest first:
    // [{ id, s, n, x, lk, role, cl, from, sci, total, pct, path: "uni" | "retake" | "work", uni, aim }]
    // where total is their standard-score total and pct their percentile (null when they went to work),
    // uni the university they enrolled at (null unless path is "uni") and aim the one their score reached.
    friendOutcomes(n) {
      const s = this.social;
      if (!s) return [];
      return s.people.filter((p) => p.id !== s.bully && p.cl > 0).sort((a, b) => b.cl - a.cl || a.id - b.id).slice(0, n || 5)
        .map((p) => Object.assign({ id: p.id, s: p.s, n: p.n, x: p.x, lk: p.lk, role: this.roleOf(p), cl: Math.round(p.cl), from: p.st }, this.fateOf(p)));
    }
    fateOf(p) {
      const r = makeRng(hashSeed(this.seed, "fate", p.id));
      const sci = r() < (p.tr.indexOf("studious") >= 0 ? 0.6 : 0.45);
      const th = p.th + r.normal() * 0.3;
      const pct = Math.round(clamp(phi(th) * 100, 0.1, 99.9) * 10) / 10;
      const total = Math.round(clamp(300 + 52 * th, 160, 430));
      // Some go to work instead (vocational school, or a weak score); some aim higher and retake.
      const work = p.st === "academy" ? 0 : (pct < 30 ? 0.35 : pct < 50 ? 0.12 : 0.03) + (p.tr.indexOf("troubled") >= 0 ? 0.1 : 0);
      if (r() < work) return { sci, total: null, pct: null, path: "work", uni: null, aim: null };
      const swing = r.normal() * 0.8;
      const u = UNIVERSITIES.find((x) => (!x.sci || sci) && x.cut <= pct + swing) || UNI_BY_ID.college;
      const retake = (p.tr.indexOf("studious") >= 0 ? 0.3 : 0.12) * (u.cut < 93 ? 1 : 0.4);
      const path = r() < retake ? "retake" : "uni";
      return { sci, total, pct, path, uni: path === "uni" ? u.id : null, aim: u.id };
    }

    // ---------- the epilogue: the next ten years ----------
    // Where you started: the family, region, parents and parents' jobs at birth, from the first log
    // entry and the seeded rolls (later changes don't count). For the mobility line and the Lives panel.
    birthInfo() {
      const b = (this.log || []).find((l) => l.key === "log.born");
      const p = (b && b.p) || {};
      const fam = p.fam || this.family;
      const reg = REGION_BY_ID[p.reg] ? p.reg : this.region;
      let par = p.care ? "care" : Game.rollParents(this.seed);
      // A life rolled "care" before children's homes existed (no care flag on its birth) had grandparents.
      if (par === "care" && !p.care) par = "grand";
      if (this.parents === "both") par = "both";
      const jobs = this.jobs === undefined ? null : Game.rollJobs(this.seed, fam, reg, par);
      return { fam, reg, par, jobs, year: (this.startYear || 2026) - 6 };
    }
    // 0 no university … 6 medical school (see UNI_TIER).
    uniTier() { return this.ending && this.ending.uni ? UNI_TIER[this.ending.uni] || 2 : 0; }
    // The mean ability you finished school with (θ), which exams after school reward too.
    finalAbility() { return SUBJECTS.reduce((a, s) => a + this.skills[s], 0) / SUBJECTS.length; }
    // Men serve; old saves without a sex were drawn as boys.
    servesArmy() { return this.sex !== "f"; }
    epiRng(...k) { return makeRng(hashSeed(this.seed, "epi", ...k)); }
    // Starts the epilogue on a finished life (also an old save that ended before it existed). Pushes its
    // first screen; returns g.epi. Calling it again does nothing.
    startEpilogue() {
      if (!this.ending) throw new Error("The life hasn't ended yet.");
      if (this.epi) return this.epi;
      const tier = this.uniTier();
      this.epi = { v: 1, tier, field: null, gpa: null, plan: null, spec: 0, years: 0, when: null, army: null, target: null, tries: 0, job: null, start: null, lines: [], extra: [], at30: null, done: false };
      if (tier === 6) {
        this.epi.field = "med";
        this.epiPush("college");
      } else if (tier === 0) this.epiPush(this.servesArmy() ? "army" : "hunt");
      else this.epiPush("major");
      return this.epi;
    }
    // The options a screen offers, and the ones closed (id → reason key).
    epiPush(step) {
      const e = this.epi, opts = [], blocked = {};
      const famI = FAMILY_IDS.indexOf(this.family);
      const careKid = this.parents === "care";
      if (step === "major") opts.push(...FIELDS_FOR[this.track === "sci" ? "sci" : "soc"]);
      else if (step === "college") {
        opts.push(...(e.tier === 6 ? ["library", "balance", "campus"] : ["library", "balance", "exchange", "gap", "campus"]));
        if (opts.indexOf("exchange") >= 0 && !((famI >= 2 && !careKid) || this.money >= COLLEGE_PLANS.exchange.money)) blocked.exchange = "money";
      } else if (step === "armyWhen") opts.push("y1", "y2", "after");
      else if (step === "army") {
        if (e.tier === 6) opts.push("doctor");
        if (this.health < ARMY_SOCIAL_HEALTH) opts.push("social");
        else opts.push("army", "navy", "air", "marine");
        opts.push("alt");
      } else if (step === "hunt") opts.push(...this.huntTargets());
      else if (step === "hunt2") {
        if (e.tries < HUNT_TRIES && !(e.target === "law" && e.lawIn)) opts.push("again");
        if (e.tier === 6) opts.push(...["essential", "gp"].filter((x) => x !== e.target));
        else if (e.tier === 0) { if (e.target !== "service") opts.push("service"); }
        else if (e.target !== "sme") opts.push("sme");
        opts.push("parttime");
      } else if (step === "at30") opts.push("ok");
      if (step === "hunt" && opts.indexOf("shop") >= 0 && !((famI >= 2 && !careKid) || this.money >= HUNT.shop.money)) blocked.shop = "money";
      this.queue.push({ type: "epi", step, opts, blocked, tier: e.tier });
    }
    // Job-hunt targets for your tier and major.
    huntTargets() {
      const e = this.epi, t = e.tier;
      if (t === 6) return ["popular", "essential", "gp"];
      if (t === 0) {
        const voc = (this.log || []).some((l) => l.key === "log.school" && l.p && l.p.id === "vocHigh");
        return (voc ? ["bigline"] : []).concat(["trade", "civil", "service", "shop"]);
      }
      const o = [];
      if (HUNT.big.tier[t] != null) o.push("big");
      o.push("public", "civil");
      if (e.field === "edu" && t >= 2) o.push("teacher");
      if (e.field === "health") o.push("hospital");
      if (t >= 2) o.push("law");
      o.push("startup");
      if (t >= 2) o.push("grad");
      o.push("sme");
      return o;
    }
    epiYearsToReady() {
      const e = this.epi;
      return (e.tier === 6 ? 6 : e.tier === 1 ? 2 : e.tier === 0 ? 0 : 4) + e.years;
    }
    // Answers the epilogue screen at the front of the queue. Returns the outcome message { key, p }.
    epiChoose(id) {
      const top = this.queue[0];
      if (!top || top.type !== "epi") throw new Error("No epilogue screen.");
      if (top.opts.indexOf(id) < 0) throw new Error("Not an option: " + id);
      if (top.blocked && top.blocked[id]) throw new Error("Closed: " + id);
      this.queue.shift();
      const e = this.epi, step = top.step;
      let res = null;
      if (step === "major") {
        e.field = id;
        res = { key: "epi.r.major", p: { f: id } };
        this.epiPush("college");
      } else if (step === "college") {
        const plan = COLLEGE_PLANS[id];
        const r = this.epiRng("college");
        e.plan = id;
        e.gpa = Math.round(clamp(3.35 + plan.gpa + 0.25 * (this.finalAbility() - 1) + r.normal() * 0.3 + 0.05 * (this.luck || 0), 2, 4.5) * 100) / 100;
        e.spec += plan.spec;
        e.years += plan.years;
        // An exchange semester the family can't pay for comes out of your savings.
        if (id === "exchange" && !(FAMILY_IDS.indexOf(this.family) >= 2 && this.parents !== "care")) this.money -= plan.money;
        res = { key: "epi.r.college." + id, p: { gpa: e.gpa.toFixed(2) } };
        this.epiPush(this.servesArmy() ? (e.tier === 6 ? "army" : "armyWhen") : "hunt");
      } else if (step === "armyWhen") {
        e.when = id;
        if (e.gpa != null) e.gpa = Math.round(Math.min(4.5, e.gpa + ARMY_WHEN[id].gpa) * 100) / 100;
        res = { key: "epi.r.when." + id, p: {} };
        this.epiPush("army");
      } else if (step === "army") {
        e.army = id;
        const a = ARMY[id];
        // A 군의관 serves after residency, past 30.
        if (id !== "doctor") e.years += a.months / 12;
        e.spec += a.spec;
        if (e.tier === 6 && id !== "doctor") e.when = "y2";
        res = { key: "epi.r.army." + id, p: { m: a.months } };
        this.epiPush("hunt");
      } else if (step === "hunt") {
        e.target = id;
        e.tries = 1;
        res = this.epiHunt();
      } else if (step === "hunt2") {
        if (id === "parttime") {
          e.job = "parttime";
          e.start = this.ending.age + this.epiYearsToReady() + e.tries;
          res = { key: "epi.r.parttime", p: {} };
          this.epiFinish();
        } else {
          if (id !== "again") { e.target = id; e.retarget = true; }
          e.tries += 1;
          res = this.epiHunt();
        }
      } else if (step === "at30") {
        e.done = true;
        res = { key: "epi.r.done", p: {} };
      }
      if (res && step !== "at30") e.lines.push(res);
      return res;
    }
    // One year of trying for e.target. Pushes the next screen (another try, or at 30).
    epiHunt() {
      const e = this.epi, t = e.target, h = HUNT[t];
      const r = this.epiRng("hunt", t, e.tries);
      const famI = FAMILY_IDS.indexOf(this.birthInfo().fam);
      // Connections and a cushion (부모 찬스) help a little where money and networks count.
      const help = t === "big" || t === "startup" || t === "shop" ? 0.12 * (famI - 2) : 0;
      const retry = e.retarget ? 0 : HUNT_RETRY * (e.tries - 1);
      const x = h.tier[e.tier] + h.field * (FIELD_PT[e.field] || 0) + h.gpa * ((e.gpa == null ? 3.35 : e.gpa) - 3.35) + h.spec * e.spec +
        h.abil * (this.finalAbility() - 1) + 0.25 * (this.luck || 0) + retry + (ARMY_WHEN[e.when] ? ARMY_WHEN[e.when].hunt : 0) + help;
      const ok = r() < sigmoid(x);
      const ready = this.ending.age + this.epiYearsToReady();
      const p = { t, n: e.tries };
      if (!ok) {
        // Out of years to try: whatever comes along.
        if (e.tries >= HUNT_TRIES) {
          const fall = e.tier === 6 ? "gp" : e.tier === 0 ? "service" : "sme";
          const r2 = this.epiRng("fallback");
          // ...or nothing yet: still looking, or a part-time job meanwhile.
          e.job = r2() < sigmoid(HUNT[fall].tier[e.tier] || 1) ? HUNT_JOB[fall] : r2() < 0.5 ? "parttime" : "hunting";
          e.start = ready + e.tries;
          this.epiFinish();
          return { key: "epi.r.fallback", p: { t, job: e.job } };
        }
        this.epiPush("hunt2");
        return { key: "epi.r.fail", p };
      }
      e.start = ready + (e.tries - 1) + 0.5;
      if (t === "law") {
        // Law school (3 years), then the bar: about half pass each sitting.
        e.lawIn = true;
        e.years += 3;
        let age = ready + (e.tries - 1) + 3, n = 0, pass = false;
        while (!pass && n < 5 && age <= 30) { n++; pass = r() < clamp(BAR_PASS + 0.1 * (this.finalAbility() - 1), 0.2, 0.9); age += 1; }
        e.bar = n;
        e.job = pass ? "lawyer" : "barExam";
        e.start = pass ? Math.min(age - 0.5, 30) : 99;
        this.epiFinish();
        return { key: pass ? "epi.r.law" : "epi.r.lawWait", p: { n } };
      }
      if (t === "startup") {
        const y = r();
        e.job = y < 0.08 ? "startupWin" : y < 0.6 ? "startup" : "sme";
        this.epiFinish();
        return { key: "epi.r.startup." + e.job, p };
      }
      if (t === "grad") {
        // A master's (2 years), then a research job or on to a PhD.
        e.years += 2;
        e.start += 2;
        e.job = r() < 0.55 ? "research" : "phd";
        this.epiFinish();
        return { key: "epi.r.grad." + e.job, p };
      }
      if (t === "popular" || t === "essential") {
        // Medical school, then a year's internship, then residency.
        e.start = ready + 1 + (e.tries - 1);
      }
      if (t === "gp") e.start = ready + 1;
      e.job = HUNT_JOB[t];
      this.epiFinish();
      return { key: "epi.r.ok", p: { t, n: e.tries, job: e.job } };
    }
    // Where you are at 30: the job you hold then (or still studying or looking), its pay, your fifth
    // among workers against the family you were born into, where you live.
    epiFinish() {
      const e = this.epi;
      const birth = this.birthInfo();
      const ready = this.ending.age + this.epiYearsToReady();
      let job = e.job;
      if (job !== "phd" && job !== "barExam" && (e.start == null || e.start > 30)) job = ready >= 30 ? "student" : "hunting";
      const yearsIn = Math.max(0, 30 - (e.start == null ? 30 : e.start));
      const r = this.epiRng("pay");
      const base = JOB30[job] || 0;
      const born = FAMILY_IDS.indexOf(birth.fam) + 1;
      // Pay: the job's level at 30, a little for years in it, the family's pull (FAMILY_PAY a fifth: half
      // of the 19% top-vs-bottom-fifth wage gap KRIVET finds; the rest comes through school), and luck.
      const pay = base ? Math.round((base * clamp(1 + 0.02 * (yearsIn - 4), 0.85, 1.15) * (1 + FAMILY_PAY * (born - 3)) * Math.exp(r.normal() * 0.12)) / 10000) * 10000 : 0;
      const fifth = pay ? payFifth(pay) : 1;
      // Where you live: big firms, law, startups and research pull you to Seoul; public enterprises sit
      // in the 혁신도시 outside it; teachers and civil servants stay home; the rest mostly stay too.
      const w = this.epiRng("where");
      const seoulPick = () => (pay >= 6000000 && w() < 0.4 ? "gangnam" : pay < 3500000 ? "gwanak" : ["mapo", "gangdong", "mokdong", "nowon", "gwanak"][Math.floor(w() * 5)]);
      let region = this.region;
      if (SEOUL_JOBS.has(job) || ((job === "resident" || job === "gp") && e.tier === 6 && w() < 0.5)) region = SEOUL_AREAS.has(this.region) ? this.region : seoulPick();
      else if (AWAY_JOBS[job]) region = AWAY_JOBS[job][Math.floor(w() * AWAY_JOBS[job].length)];
      else if (job !== "civil" && job !== "teacher" && e.tier >= 3 && w() < 0.5) region = SEOUL_AREAS.has(this.region) ? this.region : seoulPick();
      let home;
      if (birth.par !== "care" && this.parents !== "care" && region === this.region && pay < 3200000) home = "parents";
      else if (pay >= 4500000 && born >= 4 && w() < 0.6) home = "ownHelp";
      else if (pay >= 4500000) home = "jeonse";
      else home = "oneroom";
      e.at30 = { job, pay, fifth, born, region, home };
      e.extra = [];
      for (const hook of EPILOGUE_HOOKS) {
        try { const lines = hook(this); if (Array.isArray(lines)) e.extra.push(...lines); } catch (err) { /* a broken hook never stops the ending */ }
      }
      this.epiPush("at30");
    }

    // Which achievements this life has earned (ids from ACHIEVEMENTS). meta: { lives } played on this
    // device, for the one that counts lives. Reads only state the game keeps, so old saves work.
    achievements(meta) {
      const out = [];
      const has = (id) => out.push(id);
      const log = this.log || [];
      const end = this.ending, uni = end && end.uni;
      const idx = uni ? UNIVERSITIES.findIndex((u) => u.id === uni) : -1;
      const tier = this.uniTier();
      const birth = this.birthInfo();
      const seoulish = uni === "med" || IN_SEOUL.has(uni);
      const hist = this.history || [];
      // Korean History is excluded: full marks there are common.
      // Full marks in Korean or math: a handful of takers a year (English and 탐구 papers are shorter and easier to ace).
      if (hist.some((r) => ["kor", "math"].some((s) => r.subjects[s].raw === r.subjects[s].max))) has("perfectPaper");
      if (hist.some((r) => SUBJECTS.every((s) => r.subjects[s].grade === 1))) has("allOnes");
      const ev = (id) => log.some((l) => l.key === "log.event" && l.p && l.p.id === id);
      if (end) {
        if (uni === "med") has("med");
        if (uni === "snu") has("snu");
        if (tier === 5) has("sky");
        if (seoulish) has("inSeoul");
        if (seoulish && end.attempts === 1) has("firstTry");
        if (uni && end.attempts >= 5) has("nsu5");
        if (birth.fam === "q1" && tier >= 5) has("dragon");
        if (this.dropout != null && seoulish) has("dropoutSeoul");
        if (birth.par === "care" && uni) has("careUni");
        if (uni && (this.flags.bullyN || 0) > 0) has("bullySurvivor");
        if (this.flags.mt && !this.flags.paid && tier >= 5) has("selfMade");
        if (this.flags.early && uni) has("early");
        const half = log.filter((l) => l.key === "log.newyear" && l.p && l.p.st === "halfretake" && l.p.uni).map((l) => UNIVERSITIES.findIndex((u) => u.id === l.p.uni));
        if (idx >= 0 && half.some((h) => idx < h)) has("halfUp");
        if (this.regionInfo().kind === "rural" && seoulish) has("ruralSeoul");
        if (this.traits && this.traits.indexOf("stethoscope") >= 0 && uni === "med") has("stethoscope");
        if (log.some((l) => l.key === "log.school" && l.p && l.p.id === "vocHigh") && seoulish) has("vocUni");
        if (!uni) has("noUni");
        if (uni === "college") has("college");
        if (this.daily) has("daily");
        if (this.replayOf) has("replay");
      }
      if (log.some((l) => l.key === "log.newyear" && l.p && l.p.sch)) has("scholar");
      if ((this.flags.hs3Turns || 0) >= 9 && this.flags.hs3Hagwon === this.flags.hs3Turns) has("hagwonAll");
      if (log.some((l) => l.key === "log.waitlist")) has("waitlist");
      if (birth.reg === "gangnam" || log.some((l) => l.key === "log.move" && l.p && l.p.to === "gangnam")) has("daechi");
      if (log.filter((l) => l.key === "log.move").length >= 3) has("mover");
      if (FAMILY_IDS.indexOf(this.family) - FAMILY_IDS.indexOf(birth.fam) >= 2) has("familyUp");
      if (ev("jackpot")) has("jackpot");
      if (log.some((l) => l.key === "log.event" && l.p && l.p.r && l.p.r.key === "ev.examluck.omr")) has("omr");
      if (log.some((l) => l.key === "log.school" && l.p && l.p.id === "sciHigh")) has("sciHigh");
      const e = this.epi;
      if (e && e.done && e.at30) {
        const j = e.at30.job;
        if (j === "big" || j === "bigline") has("bigCo");
        if (j === "civil") has("civil");
        if (j === "lawyer") has("lawyer");
        if (j === "lawyer" && this.traits && this.traits.indexOf("gavel") >= 0) has("gavel");
        if (j === "resident" || j === "gp") has("doctor30");
        if (e.at30.fifth === 5) has("topFifth");
        if (e.at30.fifth - e.at30.born >= 2) has("riseTwo");
        if (e.at30.born === 1 && e.at30.fifth === 5) has("ragsToRiches");
        if (e.army && e.army !== "alt" && e.army !== "doctor") has("served");
        if (e.army === "alt") has("altService");
        if (e.plan === "exchange") has("exchange");
        if (j === "startupWin") has("startupWin");
      }
      if (meta && meta.lives >= 10) has("veteran");
      return out;
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

  function grades(res) {
    const o = {};
    for (const s of SUBJECTS) o[s] = res.subjects[s].grade;
    return o;
  }
  // The news headline after the exam: { key: "hard" | "easy" | "normal", s: subject }.
  function headline(shifts) {
    let hardest = "kor", easiest = "kor";
    for (const s of ["kor", "math", "eng"]) {
      if (shifts[s] > shifts[hardest]) hardest = s;
      if (shifts[s] < shifts[easiest]) easiest = s;
    }
    if (shifts[hardest] > 0.3) return { key: "hard", s: hardest };
    if (shifts[easiest] < -0.3) return { key: "easy", s: easiest };
    return { key: "normal", s: null };
  }

  const api = {
    Game, ACTIVITIES, METHODS, STATUSES, FAMILIES, FAMILY_IDS, REGIONS, REGION_KINDS, SCHOOLS, TEMPERAMENTS, DOLJABI, SUBJECTS, SUBJECT_INFO, INQUIRY, UNIVERSITIES, MOCKS, JOB_PAY,
    inquiryInfo, admissionScore, admitChance, chanceLabel, gradeSubject, makeRng, hashSeed,
    UNI_TIER, TIER_IDS, IN_SEOUL, FIELDS_FOR, COLLEGE_PLANS, ARMY, HUNT, JOB30, PAY_FIFTHS, ACHIEVEMENTS, EPI_ACH, EPILOGUE_HOOKS,
    skillScore: (theta) => clamp(Math.round(50 + theta * 16.67), 0, 100),
    NAESIN_CUTS, FIELDS, SUSI_MAX, meetsMin, minGrades,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Suneung = api;
})(typeof window !== "undefined" ? window : globalThis);
