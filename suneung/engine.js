// Suneung Simulator engine. No DOM access, so it runs in the browser or in Node (see sim.js).
//
// A life runs from the first year of elementary school (age 6, counted the international way: 만 나이) to the 수능 and any retakes. School
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
    eng: { base: -0.08, spread: 1.0, killer: 2.0, killers: 3, a: 1.3 },
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
    q1: { income: 125, allowance: 150000, prior: -0.1, paysAcademy: false },
    q2: { income: 300, allowance: 250000, prior: -0.05, paysAcademy: false },
    q3: { income: 490, allowance: 420000, prior: 0, paysAcademy: true },
    q4: { income: 770, allowance: 580000, prior: 0.05, paysAcademy: true },
    q5: { income: 1380, allowance: 900000, prior: 0.1, paysAcademy: true },
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
  // stands for a group, so the twelve add up to the whole country: Gangnam = the three Gangnam
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
    { id: "gwangju", kind: "metro", pop: 2.7 },
    { id: "daejeon", kind: "metro", pop: 3.6 },
    { id: "pohang", kind: "city", pop: 8.2, view: "sea", nat: "knu" },
    { id: "jeonju", kind: "city", pop: 4.3 },
    { id: "cheongju", kind: "city", pop: 7.3 },
    { id: "jeju", kind: "city", pop: 1.3, view: "sea" },
    { id: "pyeongchang", kind: "rural", pop: 6.1, view: "country" },
    { id: "haenam", kind: "rural", pop: 2.5, view: "sea" },
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
    { id: "engKinder", stage: "kinder", fee: 900000, lessons: { all: 1.05, eng: 3 }, stress: 2, motivation: 0, admit: () => 1, where: ["gangnam", "seoulAcad", "seoul", "capital", "metro"] },
    { id: "pubElem", stage: "elem", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    // 사립초: ₩10M a year or so, small classes and English immersion, by lottery (about 2 applicants a seat).
    { id: "privElem", stage: "elem", fee: 800000, lessons: { all: 1.15, eng: 1.5 }, stress: 1, motivation: 2, admit: () => 0.5, where: ["gangnam", "seoulAcad", "seoul", "capital", "metro"] },
    { id: "pubMid", stage: "mid", fee: 0, lessons: {}, stress: 0, motivation: 0, admit: () => 1 },
    // Private middle schools are assigned by the same lottery; you can list a preference.
    { id: "privMid", stage: "mid", fee: 0, lessons: { all: 1.08 }, stress: 1, motivation: 1, admit: () => 0.6 },
    // 국제중: document screening, then a lottery among those who pass.
    { id: "intlMid", stage: "mid", fee: 700000, lessons: { all: 1.1, eng: 1.6 }, stress: 3, motivation: 3, board: true, admit: (g) => (zOf(g, ["kor", "math", "eng"]) > 0.6 ? 0.3 : 0) },
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

  // ---------- universities (정시, rough) ----------
  // cut: the 국수탐 percentile average (after the English/History deductions below) where an
  // application is about a coin flip. Ballpark 2025-era 정시 numbers, simplified to one per school.
  // SNU and med sit where roughly the top 0.3% and 0.15% of simulated test takers land, so a player
  // at ability 100 (θ ≈ 3, top 0.13%) is a likely but not certain SNU admit and about a coin flip for med.
  const UNIVERSITIES = [
    { id: "med", cut: 98.8, sci: true },
    { id: "snu", cut: 98.0 },
    { id: "yonsei", cut: 97.6 },
    { id: "korea", cut: 97.4 },
    { id: "skku", cut: 96.1 },
    { id: "sogang", cut: 95.8 },
    { id: "hanyang", cut: 95.6 },
    { id: "cau", cut: 94.2 },
    { id: "khu", cut: 93.6 },
    { id: "hufs", cut: 93.3 },
    { id: "uos", cut: 93.8 },
    { id: "konkuk", cut: 91.0 },
    { id: "dongguk", cut: 90.6 },
    { id: "hongik", cut: 90.0 },
    { id: "pnu", cut: 88.5 },
    { id: "knu", cut: 87.5 },
    { id: "kookmin", cut: 86.8 },
    { id: "soongsil", cut: 86.5 },
    { id: "inha", cut: 85.0 },
    { id: "ajou", cut: 85.8 },
    { id: "gachon", cut: 80.0 },
    { id: "regional", cut: 60.0 },
    { id: "college", cut: 25.0 },
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
    // Near the ceiling the band narrows: med's cut leaves only 1.2 points above it, and with the full
    // 0.7-point slope even a perfect exam would be turned down a quarter of the time.
    const slope = Math.min(UNI_SLOPE, (100 - uni.cut) / 3);
    return 1 / (1 + Math.exp(-(score - uni.cut) / slope));
  }
  function chanceLabel(p) {
    return p >= 0.85 ? "safe" : p >= 0.55 ? "match" : p >= 0.25 ? "reach" : "long";
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
    { id: "promotion", anyStage: true, luck: 1, weight: (g) => (g.family !== "q5" ? 0.4 : 0), when: () => true, run: (g) => { g.shiftFamily(1, "promotion"); bump(g, { stress: -4, motivation: 3 }); return "r"; } },
    {
      id: "jackpot", anyStage: true, luck: 1, weight: (g) => (g.family !== "q5" ? 0.2 : 0), when: () => true,
      run: (g) => { const two = g.rng() < 0.4; g.shiftFamily(two ? 2 : 1, "jackpot"); g.money += 500000; bump(g, { stress: -6, motivation: 4 }); return two ? "r2" : "r1"; },
    },
    { id: "layoff", anyStage: true, luck: -1, weight: (g) => (g.family !== "q1" ? 0.4 : 0), when: () => true, run: (g) => { g.shiftFamily(-1, "layoff"); bump(g, { stress: 10, motivation: -3 }); return "r"; } },
    {
      // 전세 사기: the deposit on the family's rented home is gone.
      id: "jeonse", anyStage: true, luck: -1, weight: (g) => (g.family !== "q1" ? 0.15 : 0), when: () => true,
      run: (g) => { g.shiftFamily(-1, "jeonse"); g.money = Math.max(0, g.money - 300000); bump(g, { stress: 12 }); return "r"; },
    },
    {
      id: "parentill", anyStage: true, luck: -1, weight: 0.25, when: (g) => !g.flags.parentIll,
      run: (g) => { g.flags.parentIll = 1; if (g.family !== "q1") g.shiftFamily(-1, "parentill"); bump(g, { stress: 14, motivation: -5 }); g.lostBlocks += 1; return "r"; },
    },
    // Your own body: an accident or a long illness costs time you can't get back.
    { id: "accident", luck: -1, weight: 0.35, when: (g) => !g.flags.accident, run: (g) => { g.flags.accident = 1; bump(g, { health: -35, stress: 10, motivation: -4 }); g.lostBlocks += 3; return "r"; } },
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
      id: "sibling", early: true, weight: 1, when: (g) => g.age >= 2 && !g.flags.sibling,
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
      id: "olympiad", weight: 2, when: (g) => g.grade >= 3 && g.grade <= 9 && g.skills.math > 0.5 && !g.dropoutActive(), choices: 2,
      run: (g, i) => {
        if (i === 1) return "r1";
        if (g.rng() < 0.25 + g.skills.math * 0.15) { studyBoost(g, "math", 0.06); bump(g, { motivation: 10, stress: 4 }); return "r0a"; }
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
        if (i === 1) { bump(g, { stress: -3 }); return "r1"; }
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
        if (i === 0) { g.relocate("daegu"); bump(g, { stress: 6, motivation: 4 }); return "r0"; }
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
        let p = 0.6 + 0.3 * g.standing() + (g.flags.gedN - 1) * 0.15;
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
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -10, motivation: 4 }); g.lostBlocks += 1; return "r0"; }
        bump(g, { stress: 6, motivation: -5 }); return "r1";
      },
    },
    // Relatives at Chuseok ask why you aren't at school.
    {
      id: "chuseok", weight: 1.5, when: (g) => g.dropout != null && g.grade <= 12 && !g.flags.chuseok && g.month >= 6 && g.month <= 9, choices: 2,
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
      id: "bully-start", weight: bullyWeight, choices: 4,
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
      id: "bully-on", weight: 100, choices: 5,
      when: (g) => !!g.bully && g.bully.lv < 3 && bullyFollowUp(g),
      run: (g, i) => {
        const friends = !!(g.lastPlan && g.lastPlan.friends);
        const t = longTurn(g);
        let x;
        if (i === 0) { bump(g, { stress: 5 }); x = bullyStep(g, 0.45 + t, 0.25, 0.12); } // report to the school violence committee: draining, but it works
        else if (i === 1) { g.bully.sup = 1; bump(g, { stress: -10, motivation: 3 }); x = bullyStep(g, 0.15 + t, 0.35, 0.08); } // Wee class counselor
        else if (i === 2) { if (friends) g.bully.sup = 1; bump(g, { stress: friends ? -8 : -2 }); x = bullyStep(g, (friends ? 0.2 : 0.08) + t, friends ? 0.35 : 0.15, 0.1); }
        else if (i === 3) { bump(g, { health: -6, stress: 4 }); x = bullyStep(g, 0.3 + t, 0.05, 0.35); } // fight back
        else { bump(g, { motivation: -4 }); x = bullyStep(g, 0.08 + t, 0.07, 0.35); } // endure: it usually gets worse
        return ["r" + i, { x, f: friends }];
      },
    },
    {
      id: "bully-bad", weight: 100, choices: 4,
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
        if (g.rng() < 0.45) { bump(g, { motivation: 8, stress: 4 }); return "r0a"; }
        bump(g, { stress: 5, motivation: -2 }); return "r0b";
      },
    },
    { id: "career", weight: 100, when: (g) => g.grade === 7 && g.month === 3 && !g.flags.career && !g.dropoutActive(), run: (g) => { g.flags.career = 1; bump(g, { motivation: 8 }); return "r"; } },
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
    { id: "rival", weight: 1.5, when: (g) => g.grade >= 7, run: (g) => { bump(g, { motivation: 8, stress: 5 }); return "r"; } },
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
      id: "festival", weight: 1, when: (g) => !g.dropoutActive() && ((g.status === "hs3" && (g.month === 5 || g.month === 10)) || g.status === "high"), choices: 2,
      run: (g, i) => {
        if (i === 0) { bump(g, { stress: -14, motivation: 4 }); return "r0"; }
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
  function studyBoost(g, s, amount) {
    g.skills[s] += amount * headroom(g.skills[s]) * 1.5;
  }
  // ---------- bullying ----------
  // How likely bullying is to start this turn, relative to the other events. Per year, middle school
  // is the peak and high school the low; the stage factor also allows for turn length (a year in
  // elementary school, a semester in middle school, a season in high school). Being the new kid (a
  // move, a transfer) doubles it for a year, having no time for friends makes you an easier target,
  // and each earlier episode halves it. Tuned so roughly a quarter to a third of lives meet it.
  function bullyWeight(g) {
    const stage = g.status === "elem" ? 1.4 : g.status === "mid" ? 1 : 0.3;
    const newKid = g.flags.moved != null && g.clock - g.flags.moved <= 12 ? 2 : 1;
    const alone = g.lastPlan && !g.lastPlan.friends ? 1.4 : 1;
    return BULLY_BASE * stage * newKid * alone * Math.pow(0.5, g.flags.bullyN || 0) * g.trait("bully");
  }
  const BULLY_BASE = 0.25;
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
      this.flags = {};
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
      this.school = null; // school id, picked on the "school" screen; absent reads as the public school
      // regionFrom is the school grade you arrived in: the local quotas need middle and high school
      // there (from grade 7).
      this.region = bornIn;
      this.regionFrom = 1;
      this.addLog("log.born", { early: 1, fam: this.family, y: this.year, inc: FAMILIES[this.family].income, sex: this.sex, reg: this.region }, "milestone");
    }

    // Birth region, weighted only by population share.
    // A fortune between −1 and 1, most lives near the middle.
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
      for (const id of this.traits || []) {
        const fx = TRAIT_FX[id];
        if (fx && fx[key] != null) v = add ? v + fx[key] : v * fx[key];
      }
      return v;
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
      // A school the family can no longer pay for: back to the public one (or ordinary kindergarten).
      const st = this.status === "hs3" ? "high" : this.status === "early" ? "kinder" : this.status;
      if ((this.inClass() || this.atKinder()) && this.schoolInfo().fee > FAMILIES[this.family].allowance && DEFAULT_SCHOOL[st]) {
        this.school = DEFAULT_SCHOOL[st];
        this.addLog("log.schoolFee", { id: this.school }, "event");
      }
      return j - i;
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
      if (this.bully) { endBully(this); this.addLog("log.bullyEnd", { why: "quit" }, "event"); }
    }
    activities() {
      if (this.isEarly()) return ACTIVITIES.filter((a) => (a.early && (a.fromAge || 0) <= this.age) || a.alsoEarly);
      return ACTIVITIES.filter((a) => !a.early && (a.from || 1) <= this.grade && this.grade <= (a.to || 12));
    }
    allowance() {
      const a = FAMILIES[this.family].allowance;
      // School fees come out of the same education budget while you're there.
      return Math.max(0, (this.attempt >= 4 ? Math.round(a / 2) : a) - (this.inClass() || this.atKinder() ? this.schoolInfo().fee : 0));
    }

    // ----- schools -----
    // At one of these schools right now (and still going to classes).
    atSchool(...ids) { return this.inClass() && ids.indexOf(this.schoolInfo().id) >= 0; }
    // The school you're at. Saves from before schools existed have none: the public one for the stage.
    schoolInfo() {
      const st = this.status === "hs3" ? "high" : this.status === "early" ? "kinder" : this.status;
      const x = SCHOOL_BY_ID[this.school];
      return x && x.stage === st ? x : SCHOOL_BY_ID[DEFAULT_SCHOOL[st] || "pubHigh"];
    }
    // Every school for the stage on the current school screen, with its chance and why it's closed.
    schoolOptions() {
      const top = this.queue[0];
      if (!top || top.type !== "school") return [];
      const kind = this.regionInfo().kind;
      const can = FAMILIES[this.family].allowance;
      return SCHOOLS.filter((x) => x.stage === top.stage).map((x) => {
        const blocked = x.where && x.where.indexOf(kind) < 0 ? "region" : x.fee > can ? "cost" : x.admit(this) <= 0 ? "admit" : null;
        return { id: x.id, fee: x.fee, p: blocked ? 0 : x.admit(this), blocked, track: x.track || null, def: x.id === DEFAULT_SCHOOL[top.stage] };
      });
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
      this.queue.shift();
      this.addLog("log.school", { id: this.school, want: id, got }, "milestone");
      this.flush();
      return { key: o.def ? "school.r.def" : got ? "school.r.in" : "school.r.out", p: { id, def: DEFAULT_SCHOOL[top.stage] } };
    }
    // The parents' education money for this turn. Whatever isn't spent stays with them.
    budget() { return this.allowance() * this.turnMonths(); }
    methodFixed() { return STATUSES[this.status].method || null; }

    // ----- regions -----
    regionInfo() { return REGION_BY_ID[this.region] || REGION_BY_ID.suwon; }
    regionKindInfo() { return REGION_KINDS[this.regionInfo().kind]; }
    // 지역인재: outside the capital region, with middle and high school there (arrived by grade 7).
    localQuota() { const r = this.regionInfo(); return !r.capital && (this.regionFrom || 1) <= 7; }
    ruralQuota() { return this.regionInfo().kind === "rural" && (this.regionFrom || 1) <= 7; }
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
      // A new home means the local public school, unless yours is a boarding or commuter school.
      if (this.inClass() && !this.schoolInfo().board && this.schoolInfo().id !== DEFAULT_SCHOOL[this.status === "hs3" ? "high" : this.status]) {
        this.school = DEFAULT_SCHOOL[this.status === "hs3" ? "high" : this.status];
        this.addLog("log.schoolMove", { id: this.school }, "event");
      }
      // In school, the quotas count from the grade you arrive in; after school, you're past them.
      this.regionFrom = this.inSchool() ? this.grade : 13;
      this.flags.moved = this.clock;
      this.flags.lastMove = this.clock;
      this.addLog("log.move", { from, to: id }, "milestone");
    }
    // Retake options after the latest 수능, with the reason any of them is closed. The parents pay a
    // retake academy if they can; otherwise only a scholarship gets you in.
    retakeOptions(score) {
      const pays = FAMILIES[this.family].paysAcademy;
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
      this.lostBlocks = 0;
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
          const g = CLASS_YEAR * (months / 12) * SUBJECT_INFO[s].rate * this.aptitude[s] * behind * attend * headroom(this.skills[s]) * (sl[s] || sl.all || 1);
          this.skills[s] += g;
          lessons += g;
        }
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
        stress: pressure + studied * 1.6 + mock * 3 + (25 + this.trait("stressRest") - this.stress) * 0.25 + (plan.worksheet || 0) * 4,
        health: -1 - studied * 0.6 + (72 + this.trait("healthRest") - this.health) * 0.15,
        motivation: 0,
      };
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
      // Arts & sports lessons over the years are what an arts high school audition looks at.
      if (plan.arts) this.flags.artsN = (this.flags.artsN || 0) + plan.arts * months / 12 * 2 * this.trait("arts");
      d.stress += (plan.job || 0) * 5;
      d.motivation += (plan.friends || 0) * 3 - (plan.games || 0) * 4 + (plan.arts || 0) * 4;
      // Out of school, nobody sets the pace and nobody's around: a lower baseline, and loneliness
      // without time for friends.
      if (drop && !plan.friends) d.stress += DROPOUT_LONELY;
      // Motivation drifts back toward a baseline that sags with every extra year.
      const base = (school ? 68 : 66) - (this.attempt - 1) * 6 + (this.status === "academy" ? 6 : 0) + rk.motivation + (sch ? sch.motivation : 0) + this.trait("mot") - (this.dropout != null && this.grade <= 12 && this.attempt === 1 ? DROPOUT_MOTIVATION : 0);
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

      // Summarize the turn.
      const deltas = {};
      for (const s of SUBJECTS) {
        const dd = this.skills[s] - before[s];
        if (Math.abs(dd) >= 0.004) deltas[s] = Math.round(dd * 16.67 * 10) / 10;
      }
      this.addLog("log.month", { m: this.month, plan: Object.assign({}, plan), cost, d: deltas, cls: Math.round(lessons * 16.67 * 10) / 10 }, "month");
      if (this.status === "elem") this.addLog("log.teacher", { lvl: this.classLevel() }, "");
      if (this.status === "mid" && !drop) this.addLog("log.report", { rank: this.classRank(), of: 30, sem: this.month === 3 ? 1 : 2 }, "mock");
      // New Year's money (세뱃돈) from relatives, whenever a turn runs through January.
      if (school && (this.month === 3 && months === 12 || this.month + months > 12)) {
        const gift = Math.round(Math.min(300000, 60000 + this.age * 10000) * this.trait("sebae"));
        this.money += gift;
        this.addLog("log.sebae", { a: gift }, "");
      }

      // Events: usually one per turn, sometimes none, sometimes two when life piles up.
      const roll = rng();
      const n = roll < 0.2 ? 0 : roll < 0.88 ? 1 : 2;
      const seen = new Set();
      // Fixed milestones (D-100, free-semester career week, 중2) always fire when their time comes, and so
      // does the bullying follow-up while it lasts.
      for (const e of EVENTS) if (weightOf(e, this) >= 100 && this.stageFits(e) && e.when(this)) { seen.add(e.id); this.fireEvent(e); }
      for (let i = 0; i < n; i++) this.rollEvent(seen);
      if ((plan.friends || 0) > 0 && rng() < 0.35 && !seen.has("pcbang") && this.grade >= 7 && this.clock - (this.flags["ev-pcbang"] || -99) >= 4) {
        this.fireEvent(EVENTS.find((e) => e.id === "pcbang"));
      }

      // Scheduled exams and decisions.
      if (this.status === "high" && !drop && (this.month === 3 || this.month === 9)) this.queue.push({ type: "mock", m: this.month === 3 ? 6 : 11 });
      if (!school && MOCKS[this.month] && !(this.month === 3 && this.status !== "hs3")) this.queue.push({ type: "mock", m: this.month });
      if (this.status === "high" && this.grade === 10 && this.month === 12) this.queue.push({ type: "track" });
      if (this.status !== "elem" && !school && this.month === 11) {
        this.queue.push(this.examEveEvent());
        this.queue.push(this.lunchEvent());
        const luckEv = this.examLuckEvent();
        if (luckEv) this.queue.push(luckEv);
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
      const pool = EVENTS.filter((e) => !seen.has(e.id) && weightOf(e, this) < 100 && this.stageFits(e) && e.when(this) && !(this.clock - (this.flags["ev-" + e.id] || -99) < 4));
      let total = 0;
      for (const e of pool) total += weightOf(e, this);
      let r = this.rng() * total;
      for (const e of pool) {
        r -= weightOf(e, this);
        if (r <= 0) { seen.add(e.id); this.fireEvent(e); return; }
      }
    }
    // Early-childhood events only happen before school, and every other event only after.
    stageFits(e) { return e.anyStage || !!e.early === this.isEarly(); }
    fireEvent(e) {
      this.flags["ev-" + e.id] = this.clock;
      if (e.choices) this.queue.push({ type: "event", id: e.id, choices: e.choices });
      else this.queue.push({ type: "event", id: e.id, choices: 0, result: outcome(e.id, e.run(this)) });
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
      let res;
      if (top.choices) {
        i = clamp(i | 0, 0, top.choices - 1);
        if (top.id === "eve") res = outcome("eve", this.resolveEve(i));
        else if (top.id === "lunch") res = outcome("lunch", this.resolveLunch(i));
        else res = outcome(top.id, EVENTS.find((e) => e.id === top.id).run(this, i));
        this.addLog("log.event", { id: top.id, c: i, r: res }, "event");
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
      this.queue.shift();
      if (top.type === "exam") {
        this.month = 12;
        this.queue.push({ type: "apply", score: admissionScore(top.result), result: top.result });
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
      return UNIVERSITIES.map((u) => {
        const q = this.quotaFor(u);
        const p = admitChance(top.score + (q ? q.pts : 0), u, this.track);
        return { id: u.id, p, label: chanceLabel(p), blocked: u.sci && this.track !== "sci", quota: q ? q.kind : null };
      });
    }
    // Apply to up to three schools (가/나/다군). Returns the offers.
    apply(ids) {
      const top = this.queue[0];
      if (!top || top.type !== "apply") throw new Error("Not application season.");
      ids = Array.from(new Set(ids)).slice(0, 3);
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
      this.attempt += 1;
      this.age += 1;
      this.year += 1;
      this.month = 3;
      this.motivation = clamp(this.motivation + 10, 0, 100);
      this.stress = clamp(this.stress - 15, 0, 100);
      this.health = clamp(this.health + 15, 0, 100);
      if (this.attempt === 4) this.addLog("log.halfpay", null, "event");
      this.addLog("log.newyear", { y: this.year, att: this.attempt, st: d.action, sch: this.scholarship, pays: FAMILIES[this.family].paysAcademy, uni: this.enrolled }, "milestone");
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
    skillScore: (theta) => clamp(Math.round(50 + theta * 16.67), 0, 100),
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Suneung = api;
})(typeof window !== "undefined" ? window : globalThis);
