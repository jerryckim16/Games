// Every piece of text the Suneung Simulator shows, in English and Korean. No DOM access, so it loads
// in Node too. The engine emits message keys plus values; make(lang, ctx) returns a translator that
// renders them, so one game can be shown in either language and switched mid-game.
//
// Rule: each language is complete on its own. English text never falls back to Korean words (and the
// other way round), apart from the two language names on the switcher itself.
(function (root) {
  "use strict";

  // ---------- names and units ----------
  const DATA = {
    en: {
      // Before the track choice the two inquiry slots are the social-studies and science foundations.
      subj: { kor: "Korean", math: "Math", eng: "English", hist: "Korean History", inq1: "Social studies", inq2: "Science" },
      subjShort: { kor: "Kor", math: "Math", eng: "Eng", hist: "Hist", inq1: "Soc", inq2: "Sci" },
      inqShort: { inq1: "Inq 1", inq2: "Inq 2" },
      inq: {
        ethics: "Ethics & Life", society: "Society & Culture", ideas: "Ethics & Ideas", kgeo: "Korean Geography",
        wgeo: "World Geography", eahist: "East Asian History", whist: "World History", law: "Politics & Law", econ: "Economics",
        phys: "Physics I", chem: "Chemistry I", bio: "Life Science I", earth: "Earth Science I",
      },
      elective: { kor: "Speech & Writing", soc: "Probability & Statistics", sci: "Calculus" },
      act: { reading: "Reading", arts: "Arts & sports", mock: "Practice exams", rest: "Rest", exercise: "Exercise", friends: "Friends", games: "Games", job: "Part-time job" },
      actLong: { reading: "Read books", arts: "Piano, taekwondo & co.", mock: "Timed practice exams", rest: "Rest & sleep", exercise: "Exercise", friends: "Hang out with friends", games: "Games & YouTube", job: "Part-time job" },
      actHint: {
        reading: "Free. Builds Korean, with a little social studies and history.",
        arts: "₩150,000 a month. +Health, −Stress, +Motivation",
        mock: "Builds exam stamina: steadier scores on the day. Small gains everywhere, stressful.",
        rest: "−Stress, +Health",
        exercise: "+Health, −Stress",
        friends: "Big −Stress, +Motivation, things happen",
        games: "−Stress but −Motivation",
        job: "+₩250,000 a month, +Stress, −Health",
      },
      method: { self: "Self-study", online: "Online lectures", hagwon: "Cram school", tutor: "Private tutor" },
      status: { elem: "Elementary school", mid: "Middle school", high: "High school", hs3: "High school senior", academy: "Retake academy", selfstudy: "Self-study retake", halfretake: "Half-retake at university" },
      family: { q1: "Low income", q2: "Lower-middle income", q3: "Middle income", q4: "Upper-middle income", q5: "High income" },
      familyAdj: { q1: "low-income", q2: "lower-middle-income", q3: "middle-income", q4: "upper-middle-income", q5: "high-income" },
      fifth: { q1: "the bottom fifth", q2: "the second fifth", q3: "the middle fifth", q4: "the fourth fifth", q5: "the top fifth" },
      season: { 3: "spring term", 6: "summer break", 9: "fall term", 12: "winter break" },
      track: { soc: "Humanities", sci: "Sciences" },
      uni: {
        med: "Medical school", snu: "Seoul National University", yonsei: "Yonsei University", korea: "Korea University",
        skku: "Sungkyunkwan University", sogang: "Sogang University", hanyang: "Hanyang University", cau: "Chung-Ang University",
        khu: "Kyung Hee University", hufs: "Hankuk Univ. of Foreign Studies", uos: "University of Seoul", konkuk: "Konkuk University",
        dongguk: "Dongguk University", hongik: "Hongik University", pnu: "Pusan National University", knu: "Kyungpook National University",
        kookmin: "Kookmin University", soongsil: "Soongsil University", inha: "Inha University", ajou: "Ajou University",
        gachon: "Gachon University", regional: "Regional private university", college: "Junior college",
      },
      chance: { safe: "safe", match: "match", reach: "reach", long: "long shot" },
      region: {
        gangnam: "Gangnam, Seoul (Daechi-dong)", nowon: "Nowon, Seoul", suwon: "Suwon, Gyeonggi", busan: "Busan", daegu: "Daegu",
        gwangju: "Gwangju", daejeon: "Daejeon", pohang: "Pohang, North Gyeongsang", jeonju: "Jeonju, North Jeolla",
        cheongju: "Cheongju, North Chungcheong", pyeongchang: "Pyeongchang County, Gangwon", haenam: "Haenam County, South Jeolla",
      },
      regionShort: {
        gangnam: "Gangnam", nowon: "Nowon", suwon: "Suwon", busan: "Busan", daegu: "Daegu", gwangju: "Gwangju", daejeon: "Daejeon",
        pohang: "Pohang", jeonju: "Jeonju", cheongju: "Cheongju", pyeongchang: "Pyeongchang", haenam: "Haenam",
      },
      regionKind: { gangnam: "Seoul's cram-school capital", seoul: "Seoul", capital: "Capital-region city", metro: "Big city", city: "Mid-sized city", rural: "Rural county" },
      months: ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      monthsLong: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      mock: { 3: "March mock exam", 6: "June mock exam", 9: "September mock exam", 11: "November mock exam" },
    },
    ko: {
      subj: { kor: "국어", math: "수학", eng: "영어", hist: "한국사", inq1: "사회", inq2: "과학" },
      subjShort: { kor: "국", math: "수", eng: "영", hist: "한", inq1: "사", inq2: "과" },
      inqShort: { inq1: "탐1", inq2: "탐2" },
      inq: {
        ethics: "생활과 윤리", society: "사회·문화", ideas: "윤리와 사상", kgeo: "한국지리", wgeo: "세계지리",
        eahist: "동아시아사", whist: "세계사", law: "정치와 법", econ: "경제",
        phys: "물리학Ⅰ", chem: "화학Ⅰ", bio: "생명과학Ⅰ", earth: "지구과학Ⅰ",
      },
      elective: { kor: "화법과 작문", soc: "확률과 통계", sci: "미적분" },
      act: { reading: "독서", arts: "예체능", mock: "실전 모의고사", rest: "휴식", exercise: "운동", friends: "친구", games: "게임", job: "알바" },
      actLong: { reading: "책 읽기", arts: "피아노·태권도 학원", mock: "실전 모의고사", rest: "휴식·수면", exercise: "운동", friends: "친구 만나기", games: "게임·유튜브", job: "아르바이트" },
      actHint: {
        reading: "무료. 국어 실력이 오르고 사회·역사도 조금 오릅니다.",
        arts: "월 15만원. 체력 +, 스트레스 −, 의지 +",
        mock: "실전 감각이 붙어 시험 날 점수가 안정됩니다. 모든 과목이 조금씩 오르지만 스트레스가 큽니다.",
        rest: "스트레스 −, 체력 +",
        exercise: "체력 +, 스트레스 −",
        friends: "스트레스 크게 −, 의지 +, 무슨 일이 생길지도",
        games: "스트레스 − 대신 의지 −",
        job: "월 +25만원, 스트레스 +, 체력 −",
      },
      method: { self: "독학", online: "인강", hagwon: "학원", tutor: "과외" },
      status: { elem: "초등학교", mid: "중학교", high: "고등학교", hs3: "고3 현역", academy: "재종반", selfstudy: "독학재수", halfretake: "반수" },
      family: { q1: "저소득층", q2: "서민층", q3: "중산층", q4: "중상류층", q5: "고소득층" },
      familyAdj: { q1: "저소득층", q2: "서민층", q3: "중산층", q4: "중상류층", q5: "고소득층" },
      fifth: { q1: "하위 20%", q2: "하위 20–40%", q3: "중간 20%", q4: "상위 20–40%", q5: "상위 20%" },
      season: { 3: "봄 학기", 6: "여름방학", 9: "가을 학기", 12: "겨울방학" },
      track: { soc: "문과", sci: "이과" },
      uni: {
        med: "의대", snu: "서울대", yonsei: "연세대", korea: "고려대", skku: "성균관대", sogang: "서강대", hanyang: "한양대",
        cau: "중앙대", khu: "경희대", hufs: "한국외대", uos: "서울시립대", konkuk: "건국대", dongguk: "동국대", hongik: "홍익대",
        pnu: "부산대", knu: "경북대", kookmin: "국민대", soongsil: "숭실대", inha: "인하대", ajou: "아주대", gachon: "가천대",
        regional: "지방 사립대", college: "전문대",
      },
      chance: { safe: "안정", match: "적정", reach: "소신", long: "상향" },
      region: {
        gangnam: "서울 강남구(대치동)", nowon: "서울 노원구", suwon: "경기 수원시", busan: "부산", daegu: "대구",
        gwangju: "광주", daejeon: "대전", pohang: "경북 포항시", jeonju: "전북 전주시",
        cheongju: "충북 청주시", pyeongchang: "강원 평창군", haenam: "전남 해남군",
      },
      regionShort: {
        gangnam: "강남", nowon: "노원", suwon: "수원", busan: "부산", daegu: "대구", gwangju: "광주", daejeon: "대전",
        pohang: "포항", jeonju: "전주", cheongju: "청주", pyeongchang: "평창", haenam: "해남",
      },
      regionKind: { gangnam: "서울 학원 1번지", seoul: "서울", capital: "수도권 도시", metro: "광역시", city: "지방 중소도시", rural: "농어촌(군 지역)" },
      months: ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
      monthsLong: ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
      mock: { 3: "3월 학력평가", 6: "6월 모의평가", 9: "9월 모의평가", 11: "11월 학력평가" },
    },
  };

  const intFmt = new Intl.NumberFormat("en-US");
  function wonEn(n) { return (n < 0 ? "-₩" : "₩") + intFmt.format(Math.round(Math.abs(n))); }
  function wonShortEn(n) {
    const a = Math.abs(n), sign = n < 0 ? "-" : "";
    if (a >= 1e6) return sign + "₩" + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (a >= 1e3) return sign + "₩" + Math.round(a / 1e3) + "K";
    return wonEn(n);
  }
  // Korean money reads in 만 (10^4) and 억 (10^8): 1,200,000 → 120만원, 25,000 → 2만 5천원.
  function wonKo(n) {
    const sign = n < 0 ? "-" : "";
    let a = Math.round(Math.abs(n));
    const parts = [];
    if (a >= 1e8) { parts.push(intFmt.format(Math.floor(a / 1e8)) + "억"); a %= 1e8; }
    if (a >= 1e4) { parts.push(intFmt.format(Math.floor(a / 1e4)) + "만"); a %= 1e4; }
    if (a >= 1000 && a % 1000 === 0) { parts.push(a / 1000 + "천"); a = 0; }
    if (a) parts.push(intFmt.format(a));
    return sign + (parts.length ? parts.join(" ") : "0") + "원";
  }
  function wonShortKo(n) {
    const a = Math.abs(n), sign = n < 0 ? "-" : "";
    if (a >= 1e8) return sign + (a / 1e8).toFixed(1).replace(/\.0$/, "") + "억원";
    if (a >= 1e4) return sign + intFmt.format(Math.round(a / 1e4)) + "만원";
    return wonKo(n);
  }
  // Korean particles depend on whether the word ends in a consonant (받침): 국어가, 수학이.
  function hasBatchim(word) {
    const c = word.charCodeAt(word.length - 1);
    if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0;
    return /[136780lmnr]$/i.test(word) || /Ⅰ$/.test(word);
  }
  const josa = (word, withB, without) => word + (hasBatchim(word) ? withB : without);
  // 으로/로: words ending in ㄹ take 로 too (서울로, 포항으로).
  function ro(word) {
    // A parenthetical ("강남구(대치동)") doesn't change the particle: it follows the word before it.
    const base = word.replace(/\([^)]*\)$/, "");
    const c = base.charCodeAt(base.length - 1);
    if (c >= 0xac00 && c <= 0xd7a3) { const j = (c - 0xac00) % 28; return word + (j === 0 || j === 8 ? "로" : "으로"); }
    return word + "로";
  }
  const ordinal = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");

  // ---------- messages ----------
  // A value is a string with {placeholders}, or a function (p, h) for anything that needs logic.
  const MSG = {
    en: {
      "lang.html": "en",
      "app.title": "Suneung Simulator",
      "app.sub": "Grow up from age 6 to Korea's college entrance exam (the Suneung). Study, rest, make choices, sit the exam, and retake it as many times as it takes to get into the school you want.",

      "setup.title": "A new life",
      "setup.name": "Name",
      "setup.namePh": "Minjun Kim",
      "setup.namePh.m": "Minjun Kim",
      "setup.namePh.f": "Seoyeon Kim",
      "setup.sex": "You are a",
      "sex.m": "Boy", "sex.f": "Girl",
      "setup.intro": "You start at age 6, on your first day of elementary school, and play all the way to the Suneung in grade 12. Your family and your talents are dealt at random when you're born, the way life does it: each of Korea's five household-income fifths is equally likely.",
      "setup.apt": "Aptitude: how fast you learn this subject",
      "setup.go": "Be born →",
      "setup.resume": "Continue saved life",
      "fame.title": "Hall of fame",
      "fame.sub": "best results on this device",
      "fame.empty": "Finish a life to get on the board. Ranked by standard-score total (Korean, Math and Inquiry).",
      "fame.h": ["#", "Name", "Total", "Kor·Math·Eng", "Ended at", "Tries"],
      "fame.none": "No university",

      "stat.date": "Date", "stat.attempt": "Stage", "stat.age": "Age", "stat.money": "Savings",
      "stat.years": (p) => "Suneung in " + p.n + (p.n === 1 ? " year" : " years"),
      "stat.dday": "{n} days to the exam",
      "stat.examMonth": "Exam this month",
      "stat.results": "Results season",
      "stat.over": "Exam life over",
      "stat.allowance": "Education budget {a}/month",

      "ability.title": "Ability", "ability.sub": "0–100; 50 is the average Suneung test taker",
      "ability.tip": "Aptitude ×{a}",
      "ability.over": "Past the top of the scale. More study still raises your odds at the very top schools.",
      "cond.title": "Condition",
      "cond.health": "Health", "cond.stress": "Stress", "cond.motivation": "Motivation", "cond.practice": "Exam stamina",
      "cond.health.tip": "Below 40 slows study and hurts you on exam day",
      "cond.stress.tip": "Above 75 slows study; above 65 hurts on exam day; 85+ risks burnout",
      "cond.motivation.tip": "Multiplies study gains, especially with self-study and online lectures",
      "cond.practice.tip": "From timed practice and mock exams: steadier scores on the day",
      "chart.title": "Ability over time",

      "plan.title": (p, h) => {
        if (p.st === "elem") return "Plan grade " + p.g + " (the whole school year)";
        if (p.st === "mid") return "Plan grade " + p.g + ", " + (p.m === 3 ? "spring" : "fall") + " semester";
        if (p.st === "high") return "Plan grade " + p.g + ", " + h.season(p.m) +
          (p.m === 3 ? " · June mock exam at the end" : p.m === 9 ? " · November mock exam at the end" : p.track ? " · choose your track at the end" : "");
        return "Plan " + h.monthLong(p.m) + (p.mock ? " · " + h.mock(p.m) + " at month end" : p.exam ? " · the exam at month end" : "");
      },
      "plan.done": "Your exam years are over. Look back at the log, or start a new life below.",
      "plan.left": "{l} of {n} blocks left",
      "plan.method": "Study method",
      "plan.methodFixed": "The academy teaches every subject (×{x} study speed); you only choose the hours.",
      "plan.methodNote": (p, h) => "×" + p.x + " study speed · " + (p.cost ? h.won(p.cost) + " per study block a month" : "free") + " · " +
        (p.sens >= 1 ? "only as good as your motivation" : p.sens >= 0.6 ? "keeps you on task" : "barely depends on motivation"),
      "plan.studyHint": (p) => "Ability " + p.v + (p.s === "eng" ? " · absolute grading: 90+ is grade 1" : p.s === "hist" ? " · absolute grading: 40+ is grade 1" : ""),
      "plan.cost": (p, h) => "Costs " + h.won(p.c) + " of the " + h.won(p.b) + " education budget" + (p.o ? " (" + h.won(p.o) + " from your savings)" : "") +
        (p.e ? " · earns " + h.won(p.e) : "") + " · savings after: " + h.wonShort(p.m),
      "plan.less": "Less {a}", "plan.more": "More {a}",
      "plan.repeat": "Same as last time", "plan.clear": "Clear", "plan.sit": "Sit the exam →",
      "plan.next": (p) => ({ elem: "Next year →", mid: "Next semester →", high: "Next season →" })[p.st] || "Next month →",
      "err.count": "Each activity needs a whole number of blocks.",
      "err.blocks": "Use exactly {n} blocks.",
      "err.method": "Pick a study method.",
      "err.money": "Not enough money for this plan.",

      "log.title": "Life log",
      "history.title": "Exam history",
      "history.empty": "Mock exams (from grade 10) and your Suneung results show up here.",
      "history.exam": "Exam", "history.total": "Total",
      "history.suneung": "{y} Suneung", "history.mock": "{m} mock",
      "newLife": "Start a new life",

      "ok": "OK", "continue": "Continue",
      "newLife.title": "Start a new life?",
      "newLife.text": "This life and its save will be gone. Your hall of fame stays.",
      "newLife.keep": "Keep playing", "newLife.go": "Start over",
      "move.btn": "Move house",
      "move.title": "Move to another region",
      "move.text": "A new home means a new school: a block of packing next turn, some stress, and the risk of being the new kid. You can move once a year.",
      "move.here": "You live here",
      "move.hereTag": "Home",
      "move.noTag": "Can't move",
      "move.go": "Move here",
      "move.stay": "Stay",
      "move.cost": "Your family can't afford housing here.",
      "move.cooldown": "You moved less than a year ago.",
      "move.fx": (p) => "Cram school ×" + p.hag.toFixed(2) + (p.tut ? " · tutors ×" + p.tut.toFixed(2) : " · no private tutors") + " · prices ×" + p.price.toFixed(2) +
        (p.stress > 0 ? " · more pressure" : p.stress < 0 ? " · a calmer life" : ""),
      "move.local": (p, h) => "Regional quota for medical school" + (p.nat ? " and " + h.uni(p.nat) : "") + " if you do middle and high school here.",
      "move.rural": "Rural-student quota at most universities if you do middle and high school here.",
      "move.late": "Too late for the local quotas here: they need middle and high school in the region.",
      "plan.noTutor": "There are no private tutors to hire out here.",

      // Log lines.
      "log.born": (p, h) => "Born " + (p.sex ? (p.sex === "f" ? "a girl " : "a boy ") : "") + "into a " + h.familyAdj(p.fam) + " family" + (p.reg ? " in " + h.regionShort(p.reg) : "") + " (household income about " + h.wonShort(p.inc * 10000) + " a month). March " + p.y + ": you start elementary school.",
      "log.grade": (p) => "March " + p.y + ": you start grade " + p.g + ".",
      "log.stage": (p) => "March " + p.y + ": " + ({ mid: "you start middle school.", high: "you start high school.", hs3: "your final year of high school. The Suneung is in November." })[p.st],
      "log.teacher": (p) => "Teacher's note: " + ["", "\"Needs more support at home.\"", "\"Steady, careful work.\"", "\"Outstanding. One of the best in the class.\""][p.lvl],
      "log.report": (p) => "Semester " + p.sem + " exams: ranked " + p.rank + " of " + p.of + " in your class.",
      "log.sebae": (p, h) => "New Year's money from relatives: +" + h.won(p.a) + ".",
      "log.track": (p, h) => "You choose the " + h.track(p.track).toLowerCase() + " track: " + h.inq(p.inq[0]) + " and " + h.inq(p.inq[1]) + ".",
      "log.month": (p, h) => {
        const plan = h.planList(p.plan).join(", ");
        const d = Object.keys(p.d).map((s) => h.sub(s) + " " + (p.d[s] > 0 ? "+" : "") + p.d[s].toFixed(1));
        return plan + (p.cost ? " · spent " + h.won(p.cost) : "") + (d.length ? " · " + d.join(", ") : "");
      },
      "log.event": (p, h) => {
        if (p.id === "eve") return "The night before the exam: " + h.t(p.r.key, p.r.p);
        if (p.id === "lunch") return "Exam-day lunch: " + h.t(p.r.key, p.r.p);
        const res = h.t(p.r.key, p.r.p);
        return p.c == null ? res : h.t("ev." + p.id + ".text") + " → " + h.t("ev." + p.id + ".c")[p.c] + ". " + res;
      },
      "log.mock": (p, h) => h.mock(p.m, p.sch) + ": " + h.grades(p.g, p.pre),
      "log.suneung": (p, h) => (p.y + 1) + " Suneung: " + h.grades(p.g) + " · standard-score total " + p.total,
      "log.apply": (p, h) => "Applications: " + p.r.map((r) => h.uni(r[0]) + " " + (r[1] ? "admitted ✓" : "rejected ✗")).join(", "),
      "log.enroll": (p, h) => "March " + p.y + ": you enroll at " + h.uni(p.uni) + ". Exam life is over.",
      "log.quit": "You close the workbooks for good.",
      "log.move": (p, h) => "The family moves from " + h.regionShort(p.from) + " to " + h.region(p.to) + ". New home, new school.",
      "log.dropUni": (p, h) => "You leave " + h.uni(p.uni) + " to retake the exam full time.",
      "offers.leave": (p, h) => " You'll leave " + h.uni(p.uni) + ".",
      "log.halfpay": "Your parents sit you down: from now on, they can only pay half.",
      "log.newyear": (p, h) => "March " + p.y + ": " + h.att(p.att) + ". " + ({
        academy: "You sign up for a retake academy: 7am to 10pm, phones collected at the door." + (p.sch ? " Your score earned a full scholarship." : p.pays ? " Your parents pay the ₩2.9M a month." : ""),
        selfstudy: "You rent a desk at a study café and plan the year yourself.",
        halfretake: "You start at " + h.uni(p.uni) + ", but keep studying for the Suneung in secret.",
      })[p.st],

      // Events: .text, .c (choice labels), and outcomes.
      "ev.pcbang.text": "Your friends are heading to the PC café after class. \"Just one game,\" they say.",
      "ev.pcbang.c": ["Go (it's never one game)", "Say no and go to the study room"],
      "ev.pcbang.r0": "Six hours later you walk home at 2am, oddly refreshed and deeply guilty.",
      "ev.pcbang.r1": "You hear them laughing from the window. You solve twelve problems out of spite.",
      "ev.cold.r": "You caught a nasty cold. Three days of tissues and blurry online lectures.",
      "ev.flu.r": "Run down, you come down with the flu. You lose a week in bed (−2 blocks next month).",
      "ev.star.text": "A famous star lecturer just opened a new course: \"The killer-question solving technique.\" ₩300,000.",
      "ev.star.c": ["Buy it (₩300,000)", "Pass"],
      "ev.star.r0": "Half of it is jokes, but the other half genuinely changes how you see 4-point questions.",
      "ev.star.r1": "You watch the free preview three times instead.",
      "ev.star.r0x": "By the time you go to sign up, your savings have already gone elsewhere. You watch the free preview instead.",
      "ev.nag.text": "Your mother finds your phone screen time: 6 hours a day. \"Her friend's son studies 14 hours!\"",
      "ev.nag.c": ["Apologize and lock the phone in a timer box", "Argue back"],
      "ev.nag.r0": "The box clicks shut. You feel lighter, and also like a prisoner.",
      "ev.nag.r1": "Doors slam. Dinner is silent for three days.",
      "ev.crush.text": "Someone from your study room slips you a note and a canned coffee. 😳",
      "ev.crush.c": ["Start dating", "Politely say \"after the exam\""],
      "ev.crush.r0a": "You quiz each other on vocabulary at the café. Weirdly productive.",
      "ev.crush.r0b": "Long phone calls every night. Your past-exam workbook gathers dust.",
      "ev.crush.r1": "\"After the exam\" becomes your new favorite phrase.",
      "ev.quake.r": "An earthquake shakes Pohang. Cracks run up the school walls, and classes move into the gym for weeks (−1 block next turn).",
      "ev.beach.r": "A summer evening at the beach with friends. The sea wind blows the stress away.",
      "ev.country.r": "A weekend helping with the harvest and walking the hills. Fresh air, clear head.",
      "ev.ahead.text": "Your classmates' academy is already teaching high-school math. Everyone here studies years ahead of school.",
      "ev.ahead.c": ["Join the advanced class", "Keep your own pace"],
      "ev.ahead.r0": "You keep up, barely. The math sticks, and so does the pressure.",
      "ev.ahead.r1": "You stay on your own schedule. Some days that feels brave, some days reckless.",
      "ev.commute.text": "The nearest real cram school is an hour away by bus.",
      "ev.commute.c": ["Make the trip twice a week", "Stick to online lectures at home"],
      "ev.commute.r0": "Long rides, cold bus stops, but the lessons help.",
      "ev.commute.r1": "You stay home. It's easier, and a little lonely.",
      "ev.quota-news.r": "In the news: regional medical schools must pick more local students. Doing middle and high school here could count.",
      "ev.med-move.text": "Your parents read that regional medical schools save seats for local students. They're thinking of moving to Daegu before middle school.",
      "ev.med-move.c": ["Move to Daegu", "Stay where we are"],
      "ev.med-move.r0": "Boxes, a new apartment, a new school. Your parents say it's for your future.",
      "ev.med-move.r1": "You stay. Your parents still mention it at dinner.",
      "ev.rival.r": "Your rival posted their exam scores in the class group chat: perfect marks. You're fired up.",
      "ev.sportsday.r": "Sports day: you run the last leg of the class relay and win. Your mom films the whole thing.",
      "ev.bookworm.r": "You discover a fantasy series and read all seven books in a month.",
      "ev.olympiad.text": "Your teacher suggests entering the regional math olympiad.",
      "ev.olympiad.c": ["Enter", "Not this year"],
      "ev.olympiad.r0a": "You win a silver medal. Math is officially your thing.",
      "ev.olympiad.r0b": "The last two problems beat you. No medal, but you know what to work on.",
      "ev.olympiad.r1": "You spend the weekend playing instead.",
      "ev.smartphone.text": "Everyone in your class has a smartphone. You beg your parents for one.",
      "ev.smartphone.c": ["Get one now", "Agree to wait until middle school"],
      "ev.smartphone.r0": "It's amazing. You also learn what a short-video feed does to an evening.",
      "ev.smartphone.r1": "Your parents are impressed. You read more, and they buy you one later anyway.",
      "ev.daechi.text": "Your parents are thinking of moving to Daechi-dong, Seoul's famous cram-school district.",
      "ev.daechi.c": ["Move", "Stay where your friends are"],
      "ev.daechi.r0": "New school, new friends, and academies on every corner. Everyone studies here.",
      "ev.daechi.r1": "You stay. Your best friend still lives across the street.",
      "ev.bully.text": "A bigger kid keeps picking on you at school.",
      "ev.bully.c": ["Tell the teacher", "Stand up to them", "Keep your head down"],
      "ev.bully.r0": "The teacher calls both families in. It stops.",
      "ev.bully.r1a": "You stand your ground, and they leave you alone after that.",
      "ev.bully.r1b": "It turns into a scuffle. You come home with a scraped knee and no win.",
      "ev.bully.r2": "It goes on for months. School stops feeling safe.",
      // Bullying (v2.3): bully-start, then a follow-up every turn until it ends. Outcomes add how it went (p.x).
      "bully.res.stop": "It stops. School feels safe again.",
      "bully.res.ease": "It eases off, but it isn't over.",
      "bully.res.same": "Nothing really changes. It goes on.",
      "bully.res.worse": "It gets worse. More of them join in now.",
      "ev.bully-start.text": "A few classmates have started picking on you: nasty nicknames, shoves in the hallway, your things going missing. Nobody wants to sit with you anymore. It happens every day.",
      "ev.bully-start.c": ["Tell your homeroom teacher", "Tell your parents", "Fight back", "Keep quiet and put up with it"],
      "ev.bully-start.r0": (p, h) => "Your teacher listens and has a word with the class. " + h.t("bully.res." + p.x),
      "ev.bully-start.r1": (p, h) => "Your parents are upset, but completely on your side. They call the school the next morning. " + h.t("bully.res." + p.x),
      "ev.bully-start.r2": (p, h) => "The next time they shove you, you shove back hard. " + h.t("bully.res." + p.x),
      "ev.bully-start.r3": (p, h) => "You tell no one and just try to get through each day. " + h.t("bully.res." + p.x),
      "ev.bully-on.text": "The bullying still hasn't stopped. You dread the walk to school, and in class it's hard to think about anything else.",
      "ev.bully-on.c": ["Report it to the school violence committee", "Talk to the Wee class counselor", "Stick close to your friends", "Fight back", "Endure it in silence"],
      "ev.bully-on.r0": (p, h) => "You and your parents file a report. There are statements to write and a hearing to sit through, and it's exhausting. " + h.t("bully.res." + p.x),
      "ev.bully-on.r1": (p, h) => "The counselor at the Wee class listens without judging and helps you make a plan. Just saying it out loud helps. " + h.t("bully.res." + p.x),
      "ev.bully-on.r2": (p, h) => (p.f ? "Your friends walk with you between classes and at lunch. You're a harder target in a group. " :
        "You try, but you haven't made much time for friends lately, and you mostly end up alone. ") + h.t("bully.res." + p.x),
      "ev.bully-on.r3": (p, h) => "You stop backing down and push back. " + h.t("bully.res." + p.x),
      "ev.bully-on.r4": (p, h) => "You keep it to yourself and count the days. " + h.t("bully.res." + p.x),
      "ev.bully-bad.text": "It has turned serious: threats, a group chat made to mock you, being cornered after school. Some mornings you can't make yourself go. Your parents can tell something is very wrong.",
      "ev.bully-bad.c": ["Report it to the school violence committee with your parents", "Change schools", "Talk to the Wee class counselor", "Endure it in silence"],
      "ev.bully-bad.r0": (p, h) => "Your parents take the screenshots and your notes to the school, and the committee opens a case. " + h.t("bully.res." + p.x),
      "ev.bully-bad.r1": (p, h) => "Your parents arrange a transfer. New uniform, new faces, and a lot of catching up (−1 block next turn). " + h.t("bully.res." + p.x),
      "ev.bully-bad.r2": (p, h) => "The counselor at the Wee class listens without judging and helps you and your parents make a plan. " + h.t("bully.res." + p.x),
      "ev.bully-bad.r3": (p, h) => "You keep it to yourself and count the days. " + h.t("bully.res." + p.x),
      "log.bullyEnd": (p) => ({
        class: "New school year, new classes: the kids who bullied you end up in another class, and it finally stops.",
        stage: "New school, fresh start. The bullying is behind you.",
        grad: "You leave high school, and the bullying, behind.",
        move: "The move means a new school, and the bullying stays behind.",
      })[p.why],
      "log.bullyStays": "A new school year, but the same faces. The bullying follows you into grade {g}.",
      "cond.bully": (p) => "Being bullied (" + ["", "mild", "serious", "severe"][p.lv] + "): study efficiency −" + p.pct + "%. Every turn it raises stress and drains motivation and health" +
        (p.blk ? ". You lose a block a turn." : "."),
      "cond.bully.tip": "It lasts until it's resolved. Reporting it and getting support help; enduring it alone usually makes it worse. Support also softens the hit.",
      "ev.president.text": "Class president elections are next week.",
      "ev.president.c": ["Run for president", "Vote for a friend"],
      "ev.president.r0a": "You win! You give a speech with your knees shaking.",
      "ev.president.r0b": "You lose by three votes. It stings for a week.",
      "ev.president.r1": "Your friend wins and owes you one.",
      "ev.career.r": "Free semester career week: you shadow a doctor at the local hospital. You want that white coat.",
      "ev.jung2.text": "Grade 8. Suddenly your parents don't understand anything, and you say so.",
      "ev.jung2.c": ["Rebel", "Talk it out at dinner"],
      "ev.jung2.r0": "Headphones on, door closed. Studying can wait.",
      "ev.jung2.r1": "It's awkward, but they listen. You feel a bit more grown-up.",
      "ev.slump.text": "You stare at the same passage for an hour. Nothing goes in. A slump.",
      "ev.slump.c": ["Take a weekend trip to the sea", "Push through"],
      "ev.slump.r0": "Wind, waves and tteokbokki. You come back human again.",
      "ev.slump.r1a": "It breaks after a week. You remember why you're doing this.",
      "ev.slump.r1b": "It doesn't break. You're running on fumes.",
      "ev.burnout.r": "Burnout. You can't open a book for days (−2 blocks next month). Your body is telling you something.",
      "ev.notes.r": (p, h) => "A senior who got into Yonsei gave you their summary notes for " + h.sub(p.s) + ". Gold.",
      "ev.family-money.r": "Your father's shop had a bad month. You quietly cancel a workbook order (−₩200,000).",
      "ev.grandma.r": "Grandma presses an envelope into your hand: \"For books. Eat well.\" (+₩200,000)",
      "ev.insomnia.r": "You lie awake doing math in your head. Insomnia for a week.",
      "ev.festival.text": "It's the school festival. Your class is running a tteokbokki stand.",
      "ev.festival.c": ["Join in", "Study in the empty classroom"],
      "ev.festival.r0": "Your class sells out by noon. Last festival of high school. Worth it.",
      "ev.festival.r1": "The music drifts up the stairwell while you finish a practice set.",
      "ev.d100.r": "D-100. The countdown banner goes up. Everyone suddenly gets very quiet.",
      "ev.retaker-doubt.text": "Your old classmates post photos from their freshman orientation trip. You're in a retake dorm eating a triangle kimbap.",
      "ev.retaker-doubt.c": ["Mute them and study", "Scroll for an hour"],
      "ev.retaker-doubt.r0": "Next year, you tell yourself. Next year.",
      "ev.retaker-doubt.r1": "Everyone looks so happy. You feel left behind.",
      "ev.phone-broke.r": "You dropped your phone in the toilet. Forced digital detox. Your focus is incredible.",
      "ev.mentor.r": "The academy's head counselor sits you down with a planner. You leave with a schedule down to the minute.",
      "ev.campus.text": "Your university friends are planning a club trip. You're supposed to be secretly studying for the exam.",
      "ev.campus.c": ["Go on the trip", "Make an excuse and study"],
      "ev.campus.r0": "It's fun. You wonder if you even need to retake.",
      "ev.campus.r1": "\"Family thing,\" you say. The library is empty and perfect.",
      "ev.insight.r": (p, h) => "Something clicks in " + h.sub(p.s) + ". Problems that looked impossible now look... fine.",
      "ev.eve.title": "The night before the exam",
      "ev.eve.text": "Your bag is packed: admission ticket, ID, black computer-marking pen, analog watch. It's 9pm.",
      "ev.eve.c": ["Sleep at 10pm sharp", "Review your summary notes until 1am", "Lie in bed and watch one more past-exam explanation video"],
      "ev.eve.r0a": "You stare at the ceiling until 3am anyway. Nerves.",
      "ev.eve.r0b": "You actually fall asleep. A small miracle.",
      "ev.eve.r1a": "Something you reviewed comes up the next day. Lucky.",
      "ev.eve.r1b": "You go to bed wired and wake up foggy.",
      "ev.eve.r2": "One video becomes six. Your alarm feels like a crime.",
      "ev.lunch.title": "Exam morning",
      "ev.lunch.text": "Your mom hands you a lunch box. What's inside?",
      "ev.lunch.c": ["Warm rice porridge: gentle on the stomach", "A big pork cutlet feast for energy", "Nothing. You'll be too nervous to eat"],
      "ev.lunch.r0": "Light and warm. You'll stay alert through the afternoon.",
      "ev.lunch.r1a": "A heavy lunch before English listening... your eyelids get very heavy.",
      "ev.lunch.r1b": "Fuel! You feel great.",
      "ev.lunch.r2": "By the 4th period your stomach is growling louder than the proctor.",

      // Exams and reports.
      "report.h": ["Section", "Raw", "Standard", "Percentile", "Grade", "Grade-1 cut"],
      "report.subject": (p, h) => h.sub(p.s) + (p.el ? " (" + p.el + ")" : ""),
      "mock.title": "{name} results",
      "birth.title": "You're born!",
      "birth.text": (p, h) => p.name + " is born" + (p.sex ? ", a baby " + (p.sex === "f" ? "girl" : "boy") + "," : "") + " into a " + h.familyAdj(p.fam) + " family" + (p.reg ? " in " + h.region(p.reg) : "") + ". Household income is about " + h.wonShort(p.inc * 10000) +
        " a month, in " + h.fifth(p.fam) + " of Korean households, and your parents can spend about " + h.won(p.a) + " a month on your education.",
      "birth.talent": "Your talents at age 6",
      "birth.note": "Stars show aptitude: how fast you learn a subject. Ability is measured on the Suneung scale, where 50 is the average test taker, so every child starts low and climbs. What you learn stays learned.",
      "birth.go": "Start elementary school →",
      "track.title": "Choose your track",
      "track.text": "Grade 10 is ending. Choose humanities or sciences for grades 11 and 12, and your two inquiry subjects. Your social-studies ability carries over into humanities subjects, your science ability into science subjects.",
      "track.note.soc": "Math elective: Probability & Statistics.",
      "track.note.sci": "Math elective: Calculus. Only this track can apply to medical school.",
      "track.inqNote": "Scores are relative to everyone who sits the same subject, so a strong pool is harder to top.",
      "track.go": "Confirm",
      "mock.text": "A practice run at the real thing, graded against the whole country.",
      "mock.total": "Standard-score total: {n}",
      "mock.back": "Back to studying",
      "exam.title": "{y} Suneung",
      "exam.intro": "November {y}. You walk past the younger students cheering at the school gate, find your seat and put your watch on the desk.",
      "exam.period": (p, h) => "Period " + p.n + " · " + h.sub(p.s),
      "exam.outro": "That evening you mark your answers against the published answer key. Official results come in December.",
      "exam.next": "December: open the score report →",
      "exam.vibe.kor": ["The passages read themselves.", "One literature set eats ten minutes too many.", "The science passage is a wall of text about quantum something. Panic."],
      "exam.vibe.math": ["Even #22 gives way after one clever substitution.", "You leave the last killer question blank and check the rest.", "Your hands shake. Three 4-point questions in a row won't crack."],
      "exam.vibe.eng": ["The listening is crystal clear; the fill-in-the-blank questions fall fast.", "Two fill-in-the-blank questions are pure guesses.", "You zone out during the listening section and never recover the time."],
      "exam.vibe.hist": ["Twenty questions, twelve minutes. Easy.", "A couple of dynasty dates swap places in your head.", "Was that Goryeo or Joseon? You honestly don't know."],
      "exam.vibe.inq1": ["Every chart looks familiar.", "One trick question slips through.", "The 30 minutes evaporate."],
      "exam.vibe.inq2": ["You finish with time to check your answer sheet.", "Done, a little rushed.", "You're still filling in the answer sheet as the bell rings."],
      "report.title": "Score report",
      "report.headline.hard": (p, h) => "A brutal year: " + h.sub(p.s) + " was the hardest section in years.",
      "report.headline.easy": (p, h) => h.sub(p.s) + " was unusually easy this year. One mistake could cost a grade.",
      "report.headline.normal": "A normal-difficulty exam, with a few killer questions in every section.",
      "report.total": "Standard-score total (Korean, Math, Inquiry)",
      "report.vs": "{d} vs last year",
      "report.score": "Admission score",
      "report.attempt": "Attempt",
      "report.explain": "Admission score = average percentile of Korean, Math and your two Inquiry subjects (counted as one), minus a deduction for English grade 2 or worse and Korean History grade 4 or worse.",
      "report.apply": "Apply to universities →",

      "apply.title": "University applications",
      "apply.text": "Your admission score is {s}. Pick up to three schools, one per application group (A, B and C). Chances are rough estimates from recent years.",
      "apply.chance": "{p}% chance",
      "apply.sciOnly": "Sciences track only",
      "apply.quota.local": "local quota",
      "apply.quota.rural": "rural quota",
      "apply.submit": "Submit {n} of 3 applications",

      "offers.title": "Admission results",
      "offers.none": "No offers this year",
      "offers.intro": "February {y}. The results are in.",
      "offers.yes": "Admitted", "offers.no": "Rejected",
      "offers.enroll": "Enroll at {uni}",
      "offers.enroll.sub": "End your exam years here.",
      "offers.enroll.kept": "Go back to the school you've been attending.",
      "offers.half": "Enroll at {uni}, but retake in secret",
      "offers.half.sub": "Attend university (only 2 study blocks a month until June). Next year you can still choose {uni}.",
      "offers.academy": "Retake at a retake academy",
      "offers.academy.sub": "All-day academy: 6 blocks a month, ×1.45 study speed in every subject, and a schedule that keeps motivation up.",
      "offers.selfstudy": "Retake by self-study",
      "offers.selfstudy.sub": "Plan it yourself at a study café: 6 blocks a month, any study method.",
      "offers.scholarship": "Scholarship: free. ",
      "offers.academyFee": "₩2.9M a month is out of reach. Academies waive the fee for strong scores (admission score 85+).",
      "offers.stop": "Stop here",
      "offers.stop.sub": "Walk away from the exam and university for now.",
      "offers.stop.none": "No offer this year. Close the books for good.",

      "end.title": "🎓 {uni}",
      "end.titleNone": "The end of exam life",
      "end.none": "You put down the pencil. Plenty of lives start without a university.",
      "end.med": "Medical school! Your family throws a party the whole apartment complex hears.",
      "end.sky": "SKY. Your mother sets your acceptance letter as her messenger profile picture.",
      "end.top": "A top Seoul university. Relatives stop asking awkward questions at Chuseok.",
      "end.solid": "A solid university. A new chapter begins.",
      "end.fresh": "A fresh start. Exams aren't everything.",
      "end.attempts": "Attempts", "end.age": "Age at enrollment", "end.best": "Best standard-score total", "end.grades": "Best grades (Kor·Math·Eng)",
      "end.note": "College life, jobs and beyond are coming in a later version. Your life log and exam history stay on the page below.",
      "end.look": "Look back at this life",

      // The illustrated view (art.js): mood bubble, turn transition, activity cards and diary.
      "mood.name.happy": "Feeling great", "mood.name.ok": "Doing okay", "mood.name.tired": "Running on empty",
      "mood.name.stressed": "Stressed out", "mood.name.sick": "Feeling unwell",
      "mood.happy": ["Today was a good day.", "I think I'm getting the hang of this.", "Can't wait for tomorrow.", "Life is pretty good right now."],
      "mood.ok": ["One step at a time.", "Just another day.", "Not bad, not great.", "Keep going. It adds up."],
      "mood.tired": ["Why am I even doing this?", "So... sleepy...", "I can't focus on anything.", "Five more minutes. Please."],
      "mood.stressed": ["Too much. Way too much.", "My head is spinning.", "Everyone else seems so far ahead.", "Breathe. Just breathe."],
      "mood.sick": ["Ugh, I feel awful.", "Everything aches.", "I need a nap. Or ten.", "Is it hot in here, or is it me?"],
      "turn.elem": "A year goes by", "turn.mid": "A semester goes by", "turn.high": "A season goes by", "turn.month": "A month goes by",
      "turn.exam": "The day has come",
      "turn.age": "Age {a}",
      "plan.study": "Study", "plan.life": "Life",
      "plan.tap": "Tap a card to give it a block of time. Tap a filled slot to take it back.",
      "plan.slot": "Take back a block of {a}", "plan.free": "Free block",
      "diary.year": "{y} · age {a}",
      "art.place.classroom": "Your elementary-school classroom", "art.place.hallway": "The middle-school hallway",
      "art.place.desk": "Your desk, late at night", "art.place.cubicle": "A study-café cubicle", "art.place.academy": "The retake academy's lecture room",
      "art.place.campus": "The university campus", "art.place.examhall": "The exam hall", "art.place.home": "Home, waiting for results",
      "art.place.gate": "The university gate", "art.place.road": "The road ahead", "art.place.start": "A city at night, about to welcome a new life",
    },

    ko: {
      "lang.html": "ko",
      "app.title": "수능 시뮬레이터",
      "app.sub": "만 6세부터 수능까지 자라 보세요. 공부하고, 쉬고, 선택하고, 수능을 치르고, 원하는 대학에 갈 때까지 몇 번이든 다시 도전하세요.",

      "setup.title": "새로운 인생",
      "setup.name": "이름",
      "setup.namePh": "김민준",
      "setup.namePh.m": "김민준",
      "setup.namePh.f": "김서연",
      "setup.sex": "성별",
      "sex.m": "남자", "sex.f": "여자",
      "setup.intro": "만 6세, 초등학교 입학 첫날부터 고3 수능까지 살아 봅니다. 가정 형편과 재능은 태어날 때 무작위로 정해집니다. 인생이 그렇듯이요. 한국 가구 소득 5분위 가운데 어느 가정에 태어날지는 모두 같은 확률입니다.",
      "setup.apt": "적성: 이 과목을 얼마나 빨리 익히는지",
      "setup.go": "태어나기 →",
      "setup.resume": "저장된 인생 이어 하기",
      "fame.title": "명예의 전당",
      "fame.sub": "이 기기에서의 최고 기록",
      "fame.empty": "인생을 끝까지 마치면 기록됩니다. 국수탐 표준점수 합 순위입니다.",
      "fame.h": ["#", "이름", "합계", "국·수·영", "진학", "도전"],
      "fame.none": "진학 안 함",

      "stat.date": "날짜", "stat.attempt": "단계", "stat.age": "나이", "stat.money": "용돈 저축",
      "stat.years": "수능까지 {n}년",
      "stat.dday": "수능 D-{n}",
      "stat.examMonth": "이번 달 수능",
      "stat.results": "결과 발표 시즌",
      "stat.over": "수험 생활 끝",
      "stat.allowance": "교육비 월 {a}",

      "ability.title": "실력", "ability.sub": "0–100, 50이 수능 응시자 평균",
      "ability.tip": "적성 ×{a}",
      "ability.over": "최고치를 넘었습니다. 더 공부하면 최상위 대학 합격 확률이 계속 오릅니다.",
      "cond.title": "컨디션",
      "cond.health": "체력", "cond.stress": "스트레스", "cond.motivation": "의지", "cond.practice": "실전력",
      "cond.health.tip": "40 미만이면 공부 효율이 떨어지고 시험 날 점수도 깎입니다",
      "cond.stress.tip": "75를 넘으면 공부 효율이 떨어지고, 65를 넘으면 시험 날 불리하며, 85 이상이면 번아웃 위험",
      "cond.motivation.tip": "공부 효과를 키웁니다. 독학과 인강일수록 의지의 영향이 큽니다",
      "cond.practice.tip": "실전 연습과 모의고사로 쌓이며, 시험 날 점수가 안정됩니다",
      "chart.title": "실력 변화",

      "plan.title": (p, h) => {
        if (p.st === "elem") return h.schoolGrade(p.g) + " 1년 계획";
        if (p.st === "mid") return h.schoolGrade(p.g) + " " + (p.m === 3 ? "1학기" : "2학기") + " 계획";
        if (p.st === "high") return h.schoolGrade(p.g) + " " + h.season(p.m) + " 계획" +
          (p.m === 3 ? " · 끝에 6월 학력평가" : p.m === 9 ? " · 끝에 11월 학력평가" : p.track ? " · 끝에 계열 선택" : "");
        return h.monthLong(p.m) + " 계획" + (p.mock ? " · 월말 " + h.mock(p.m) : p.exam ? " · 월말 수능" : "");
      },
      "plan.done": "수험 생활이 끝났습니다. 기록을 돌아보거나 아래에서 새 인생을 시작하세요.",
      "plan.left": "{n}칸 중 {l}칸 남음",
      "plan.method": "공부 방법",
      "plan.methodFixed": "재종반이 모든 과목을 가르칩니다(학습 속도 ×{x}). 시간 배분만 정하면 됩니다.",
      "plan.methodNote": (p, h) => "학습 속도 ×" + p.x + " · " + (p.cost ? "공부 한 칸당 월 " + h.won(p.cost) : "무료") + " · " +
        (p.sens >= 1 ? "의지가 약하면 효과도 약함" : p.sens >= 0.6 ? "공부를 붙잡아 줌" : "의지와 거의 상관없음"),
      "plan.studyHint": (p) => "실력 " + p.v + (p.s === "eng" ? " · 절대평가: 90점 이상 1등급" : p.s === "hist" ? " · 절대평가: 40점 이상 1등급" : ""),
      "plan.cost": (p, h) => "교육비 " + h.won(p.b) + " 중 " + h.won(p.c) + " 사용" + (p.o ? " (" + h.won(p.o) + "은 용돈에서)" : "") +
        (p.e ? " · 수입 " + h.won(p.e) : "") + " · 남는 용돈 " + h.wonShort(p.m),
      "plan.less": "{a} 줄이기", "plan.more": "{a} 늘리기",
      "plan.repeat": "지난번과 같게", "plan.clear": "비우기", "plan.sit": "수능 보러 가기 →",
      "plan.next": (p) => ({ elem: "다음 해 →", mid: "다음 학기 →", high: "다음 계절 →" })[p.st] || "다음 달 →",
      "err.count": "칸 수는 정수여야 합니다.",
      "err.blocks": "{n}칸을 모두 배정하세요.",
      "err.method": "공부 방법을 고르세요.",
      "err.money": "이 계획을 하기엔 돈이 부족합니다.",

      "log.title": "인생 기록",
      "history.title": "시험 기록",
      "history.empty": "고1부터 보는 모의고사와 수능 결과가 여기에 쌓입니다.",
      "history.exam": "시험", "history.total": "합계",
      "history.suneung": "{y}학년도 수능", "history.mock": "{m} 모의",
      "newLife": "새 인생 시작",

      "ok": "확인", "continue": "계속",
      "newLife.title": "새 인생을 시작할까요?",
      "newLife.text": "지금의 인생과 저장 기록이 사라집니다. 명예의 전당은 남습니다.",
      "newLife.keep": "계속하기", "newLife.go": "새로 시작",
      "move.btn": "이사하기",
      "move.title": "다른 지역으로 이사",
      "move.text": "새 집은 곧 새 학교입니다. 다음 턴에 이삿짐 싸느라 1칸이 줄고, 스트레스가 오르고, 전학생이 되는 위험도 있습니다. 이사는 1년에 한 번만 할 수 있습니다.",
      "move.here": "현재 사는 곳",
      "move.hereTag": "현재 거주",
      "move.noTag": "불가",
      "move.go": "이사",
      "move.stay": "그대로 있기",
      "move.cost": "집값이 너무 비싸 이사할 수 없습니다.",
      "move.cooldown": "이사한 지 1년이 지나지 않았습니다.",
      "move.fx": (p) => "학원 ×" + p.hag.toFixed(2) + (p.tut ? " · 과외 ×" + p.tut.toFixed(2) : " · 과외 선생님 없음") + " · 물가 ×" + p.price.toFixed(2) +
        (p.stress > 0 ? " · 경쟁 압박 큼" : p.stress < 0 ? " · 여유로운 생활" : ""),
      "move.local": (p, h) => "여기서 중·고등학교를 다니면 의대" + (p.nat ? "와 " + h.uni(p.nat) : "") + " 지역인재 전형에 지원할 수 있습니다.",
      "move.rural": "여기서 중·고등학교를 다니면 대부분 대학의 농어촌 전형에 지원할 수 있습니다.",
      "move.late": "이곳의 지역 전형을 받기엔 늦었습니다. 중·고등학교를 모두 이 지역에서 다녀야 합니다.",
      "plan.noTutor": "이 지역에서는 과외 선생님을 구할 수 없습니다.",

      "log.born": (p, h) => (p.reg ? h.regionShort(p.reg) + "의 " : "") + h.familyAdj(p.fam) + " 가정에서 " + (p.sex ? (p.sex === "f" ? "여자아이로 " : "남자아이로 ") : "") + "태어났다(월 가구소득 약 " + h.wonShort(p.inc * 10000) + "). " + p.y + "년 3월, 초등학교에 입학했다.",
      "log.grade": (p, h) => p.y + "년 3월, " + josa(h.schoolGrade(p.g), "이", "가") + " 되었다.",
      "log.stage": (p) => p.y + "년 3월, " + ({ mid: "중학교에 입학했다.", high: "고등학교에 입학했다.", hs3: "고3이 되었다. 수능은 11월이다." })[p.st],
      "log.teacher": (p) => "담임 선생님 한마디: " + ["", "\"가정에서 조금 더 지도해 주세요.\"", "\"성실하게 잘하고 있습니다.\"", "\"반에서 가장 뛰어난 학생 중 하나입니다.\""][p.lvl],
      "log.report": (p) => p.sem + "학기 시험: 반 " + p.of + "명 중 " + p.rank + "등.",
      "log.sebae": (p, h) => "설날 세뱃돈: +" + h.won(p.a) + ".",
      "log.track": (p, h) => h.track(p.track) + "를 선택했다. 탐구 과목은 " + h.inq(p.inq[0]) + ", " + h.inq(p.inq[1]) + ".",
      "log.month": (p, h) => {
        const plan = h.planList(p.plan).join(", ");
        const d = Object.keys(p.d).map((s) => h.sub(s) + " " + (p.d[s] > 0 ? "+" : "") + p.d[s].toFixed(1));
        return plan + (p.cost ? " · 지출 " + h.won(p.cost) : "") + (d.length ? " · " + d.join(", ") : "");
      },
      "log.event": (p, h) => {
        if (p.id === "eve") return "수능 전날 밤: " + h.t(p.r.key, p.r.p);
        if (p.id === "lunch") return "수능 도시락: " + h.t(p.r.key, p.r.p);
        const res = h.t(p.r.key, p.r.p);
        return p.c == null ? res : h.t("ev." + p.id + ".text") + " → " + h.t("ev." + p.id + ".c")[p.c] + ". " + res;
      },
      "log.mock": (p, h) => h.mock(p.m, p.sch) + ": " + h.grades(p.g, p.pre),
      "log.suneung": (p, h) => (p.y + 1) + "학년도 수능: " + h.grades(p.g) + " · 국수탐 표준점수 합 " + p.total,
      "log.apply": (p, h) => "정시 지원: " + p.r.map((r) => h.uni(r[0]) + " " + (r[1] ? "합격 ✓" : "불합격 ✗")).join(", "),
      "log.enroll": (p, h) => p.y + "년 3월, " + josa(h.uni(p.uni), "에", "에") + " 입학했다. 수험 생활 끝.",
      "log.quit": "문제집을 영영 덮었다.",
      "log.move": (p, h) => h.regionShort(p.from) + "에서 " + ro(h.region(p.to)) + " 이사했다. 새 집, 새 학교.",
      "log.dropUni": (p, h) => josa(h.uni(p.uni), "을", "를") + " 그만두고 수능에 전념하기로 했다.",
      "offers.leave": (p, h) => " " + josa(h.uni(p.uni), "은", "는") + " 그만둡니다.",
      "log.halfpay": "부모님이 조용히 말씀하신다. 이제부터는 절반만 지원해 줄 수 있다고.",
      "log.newyear": (p, h) => p.y + "년 3월, " + h.att(p.att) + ". " + ({
        academy: "재수종합학원에 등록했다. 아침 7시부터 밤 10시까지, 휴대폰은 입구에서 걷는다." + (p.sch ? " 성적 장학생이라 학원비는 무료다." : p.pays ? " 월 290만원은 부모님이 내신다." : ""),
        selfstudy: "독서실 자리를 끊고 혼자 1년 계획을 세웠다.",
        halfretake: h.uni(p.uni) + "에 다니면서 몰래 수능을 다시 준비한다(반수).",
      })[p.st],

      "ev.pcbang.text": "친구들이 수업 끝나고 PC방에 가자고 한다. \"딱 한 판만.\"",
      "ev.pcbang.c": ["간다 (한 판으로 끝난 적은 없다)", "거절하고 독서실로 간다"],
      "ev.pcbang.r0": "여섯 시간 뒤 새벽 2시에 집으로 걸어간다. 묘하게 개운하고, 엄청나게 찔린다.",
      "ev.pcbang.r1": "창밖으로 친구들 웃음소리가 들린다. 오기로 문제를 열두 개 풀었다.",
      "ev.cold.r": "독한 감기에 걸렸다. 사흘 동안 휴지와 흐릿한 인강 화면뿐이었다.",
      "ev.flu.r": "몸이 약해진 틈에 독감에 걸렸다. 일주일을 누워 지냈다(다음 달 2칸 감소).",
      "ev.star.text": "유명 일타 강사가 새 강좌를 열었다. \"킬러 문항 풀이법\", 30만원.",
      "ev.star.c": ["산다 (30만원)", "넘긴다"],
      "ev.star.r0": "절반은 농담이지만, 나머지 절반이 4점짜리 문제를 보는 눈을 바꿔 놓았다.",
      "ev.star.r1": "대신 무료 맛보기 강의를 세 번 돌려 봤다.",
      "ev.star.r0x": "결제하려고 보니 용돈이 이미 다른 데 나가 있었다. 대신 무료 맛보기 강의를 봤다.",
      "ev.nag.text": "엄마가 휴대폰 사용 시간을 봤다. 하루 6시간. \"엄친아는 14시간 공부한대!\"",
      "ev.nag.c": ["사과하고 휴대폰을 타임락 상자에 넣는다", "말대꾸한다"],
      "ev.nag.r0": "상자가 딸깍 잠긴다. 홀가분하면서도 감옥에 갇힌 기분이다.",
      "ev.nag.r1": "문이 쾅 닫힌다. 사흘 동안 저녁 식탁이 조용하다.",
      "ev.crush.text": "독서실의 누군가가 쪽지와 캔커피를 건넸다. 😳",
      "ev.crush.c": ["사귄다", "\"수능 끝나고\"라고 정중하게 말한다"],
      "ev.crush.r0a": "카페에서 서로 영단어 시험을 내 준다. 의외로 효율적이다.",
      "ev.crush.r0b": "매일 밤 긴 통화. 기출 문제집에는 먼지가 쌓인다.",
      "ev.crush.r1": "\"수능 끝나고\"가 요즘 제일 좋아하는 말이 됐다.",
      "ev.quake.r": "포항에 지진이 났다. 학교 벽에 금이 가서 몇 주 동안 체육관에서 수업을 들었다(다음 턴 1칸 감소).",
      "ev.beach.r": "친구들과 여름 저녁 바닷가에 갔다. 바닷바람에 스트레스가 날아간다.",
      "ev.country.r": "주말에 추수를 돕고 뒷산을 걸었다. 공기가 맑으니 머리도 맑다.",
      "ev.ahead.text": "반 친구들 학원은 벌써 고등학교 수학을 가르친다. 여기선 다들 몇 년씩 선행학습을 한다.",
      "ev.ahead.c": ["선행반에 들어간다", "내 속도대로 간다"],
      "ev.ahead.r0": "겨우 따라간다. 수학은 남지만 부담도 남는다.",
      "ev.ahead.r1": "내 속도를 지키기로 했다. 어떤 날은 용감하게, 어떤 날은 무모하게 느껴진다.",
      "ev.commute.text": "제대로 된 학원은 버스로 한 시간 거리에 있다.",
      "ev.commute.c": ["일주일에 두 번 다닌다", "집에서 인강으로 버틴다"],
      "ev.commute.r0": "긴 버스 길에 추운 정류장이지만, 수업은 도움이 된다.",
      "ev.commute.r1": "집에 있기로 했다. 편하지만 조금 외롭다.",
      "ev.quota-news.r": "뉴스: 지방 의대가 지역인재를 더 많이 뽑아야 한다고 한다. 이 지역에서 중·고등학교를 다니면 해당될 수 있다.",
      "ev.med-move.text": "지방 의대가 지역 학생을 따로 뽑는다는 기사를 본 부모님이 중학교 입학 전에 대구로 이사할까 고민하신다.",
      "ev.med-move.c": ["대구로 이사한다", "지금 사는 곳에 남는다"],
      "ev.med-move.r0": "이삿짐, 새 아파트, 새 학교. 부모님은 다 네 미래를 위해서라고 하신다.",
      "ev.med-move.r1": "남기로 했다. 부모님은 아직도 저녁마다 그 얘기를 하신다.",
      "ev.rival.r": "라이벌이 반 단톡방에 시험 점수를 올렸다. 전 과목 만점. 승부욕이 불탄다.",
      "ev.sportsday.r": "운동회 날, 반 대표 계주 마지막 주자로 뛰어 1등을 했다. 엄마가 처음부터 끝까지 영상으로 찍었다.",
      "ev.bookworm.r": "판타지 시리즈에 빠져 한 달 만에 일곱 권을 다 읽었다.",
      "ev.olympiad.text": "담임 선생님이 수학 경시대회에 나가 보라고 권하신다.",
      "ev.olympiad.c": ["나간다", "올해는 안 나간다"],
      "ev.olympiad.r0a": "은상을 받았다. 이제 수학은 공식적으로 내 과목이다.",
      "ev.olympiad.r0b": "마지막 두 문제에서 막혔다. 상은 못 받았지만 무엇을 공부해야 할지 알게 됐다.",
      "ev.olympiad.r1": "대신 주말 내내 놀았다.",
      "ev.smartphone.text": "반 친구들은 다 스마트폰이 있다. 부모님께 사 달라고 조른다.",
      "ev.smartphone.c": ["지금 산다", "중학교 때까지 기다리기로 한다"],
      "ev.smartphone.r0": "신세계다. 숏폼 영상이 저녁 시간을 어떻게 삼키는지도 배웠다.",
      "ev.smartphone.r1": "부모님이 감동하셨다. 책을 더 읽게 됐고, 결국 휴대폰은 나중에 생겼다.",
      "ev.daechi.text": "부모님이 학원가로 유명한 대치동으로 이사할지 고민하신다.",
      "ev.daechi.c": ["이사한다", "친구들이 있는 곳에 남는다"],
      "ev.daechi.r0": "새 학교, 새 친구, 골목마다 학원. 여기서는 모두가 공부한다.",
      "ev.daechi.r1": "남기로 했다. 단짝 친구는 여전히 길 건너에 산다.",
      "ev.bully.text": "덩치 큰 아이가 학교에서 계속 괴롭힌다.",
      "ev.bully.c": ["선생님께 말씀드린다", "맞선다", "참고 지낸다"],
      "ev.bully.r0": "선생님이 양쪽 부모님을 부르셨다. 괴롭힘이 멈췄다.",
      "ev.bully.r1a": "물러서지 않았더니 그 뒤로는 건드리지 않는다.",
      "ev.bully.r1b": "몸싸움이 됐다. 무릎만 까진 채 집에 왔다.",
      "ev.bully.r2": "몇 달째 계속된다. 학교가 더 이상 편하지 않다.",
      "bully.res.stop": "괴롭힘이 멈췄다. 학교가 다시 안전하게 느껴진다.",
      "bully.res.ease": "조금 잠잠해졌지만, 아직 끝나지 않았다.",
      "bully.res.same": "달라진 건 없다. 괴롭힘은 계속된다.",
      "bully.res.worse": "더 심해졌다. 이제 끼어드는 아이들이 늘었다.",
      "ev.bully-start.text": "반 아이들 몇 명이 나를 괴롭히기 시작했다. 듣기 싫은 별명, 복도에서 툭툭 밀치기, 자꾸 없어지는 물건. 이제 아무도 내 옆에 앉으려 하지 않는다. 매일 그렇다.",
      "ev.bully-start.c": ["담임 선생님께 말씀드린다", "부모님께 털어놓는다", "맞서 싸운다", "아무 말 없이 참는다"],
      "ev.bully-start.r0": (p, h) => "선생님이 이야기를 들어 주시고 반 아이들에게 단단히 주의를 주셨다. " + h.t("bully.res." + p.x),
      "ev.bully-start.r1": (p, h) => "부모님은 속상해하시면서도 전적으로 내 편이 되어 주셨다. 다음 날 아침 바로 학교에 전화하셨다. " + h.t("bully.res." + p.x),
      "ev.bully-start.r2": (p, h) => "또 밀치길래 이번엔 세게 밀쳐 버렸다. " + h.t("bully.res." + p.x),
      "ev.bully-start.r3": (p, h) => "아무에게도 말하지 않고 그저 하루하루 버틴다. " + h.t("bully.res." + p.x),
      "ev.bully-on.text": "괴롭힘은 아직 끝나지 않았다. 등굣길이 두렵고, 수업 시간에도 다른 생각을 할 수가 없다.",
      "ev.bully-on.c": ["학교폭력으로 신고한다(학폭위)", "Wee 클래스 상담 선생님을 찾아간다", "친구들 곁에 붙어 다닌다", "맞서 싸운다", "혼자 꾹 참는다"],
      "ev.bully-on.r0": (p, h) => "부모님과 함께 학교폭력 신고를 했다. 진술서를 쓰고 심의에 나가야 해서 몹시 지친다. " + h.t("bully.res." + p.x),
      "ev.bully-on.r1": (p, h) => "Wee 클래스 상담 선생님이 판단하지 않고 들어 주시고, 함께 대처 계획을 세워 주셨다. 말로 꺼내는 것만으로도 숨통이 트인다. " + h.t("bully.res." + p.x),
      "ev.bully-on.r2": (p, h) => (p.f ? "쉬는 시간과 점심시간마다 친구들이 함께 다녀 준다. 여럿이 있으면 함부로 건드리지 못한다. " :
        "그러려고 했지만 요즘 친구들과 보낸 시간이 별로 없어서 결국 혼자일 때가 많다. ") + h.t("bully.res." + p.x),
      "ev.bully-on.r3": (p, h) => "더는 물러서지 않고 맞섰다. " + h.t("bully.res." + p.x),
      "ev.bully-on.r4": (p, h) => "혼자 삭이며 하루하루를 센다. " + h.t("bully.res." + p.x),
      "ev.bully-bad.text": "괴롭힘이 심각해졌다. 협박, 나를 조롱하려고 만든 단톡방, 방과 후에 둘러싸이는 일까지. 도저히 학교에 갈 수 없는 아침도 있다. 부모님도 뭔가 크게 잘못됐다는 걸 눈치채셨다.",
      "ev.bully-bad.c": ["부모님과 함께 학폭위에 신고한다", "전학을 간다", "Wee 클래스 상담 선생님을 찾아간다", "혼자 꾹 참는다"],
      "ev.bully-bad.r0": (p, h) => "부모님이 캡처 화면과 내가 적어 둔 기록을 들고 학교에 가셨고, 학폭위가 열렸다. " + h.t("bully.res." + p.x),
      "ev.bully-bad.r1": (p, h) => "부모님이 전학 절차를 밟아 주셨다. 새 교복, 낯선 얼굴들, 따라잡아야 할 진도(다음 턴 1칸 감소). " + h.t("bully.res." + p.x),
      "ev.bully-bad.r2": (p, h) => "Wee 클래스 상담 선생님이 판단하지 않고 들어 주시고, 부모님과 함께 대처 계획을 세워 주셨다. " + h.t("bully.res." + p.x),
      "ev.bully-bad.r3": (p, h) => "혼자 삭이며 하루하루를 센다. " + h.t("bully.res." + p.x),
      "log.bullyEnd": (p) => ({
        class: "새 학년, 새 반. 괴롭히던 아이들과 다른 반이 되면서 드디어 끝났다.",
        stage: "새 학교, 새 출발. 괴롭힘은 이제 지난 일이다.",
        grad: "고등학교를 졸업하면서 괴롭힘도 뒤에 두고 왔다.",
        move: "이사하면서 학교를 옮겼고, 괴롭힘도 거기서 끝났다.",
      })[p.why],
      "log.bullyStays": (p, h) => "새 학년이 됐지만 얼굴들은 그대로다. " + josa(h.schoolGrade(p.g), "이", "가") + " 되어서도 괴롭힘이 계속된다.",
      "cond.bully": (p) => "학교폭력 피해 중(" + ["", "가벼움", "심각", "매우 심각"][p.lv] + "): 공부 효율 −" + p.pct + "%. 매 턴 스트레스가 쌓이고 의지와 체력이 떨어집니다" +
        (p.blk ? ". 매 턴 1칸이 줄어듭니다." : "."),
      "cond.bully.tip": "해결될 때까지 이어집니다. 신고하고 도움을 받으면 나아지고, 혼자 참으면 대개 더 심해집니다. 도와주는 사람이 있으면 타격도 줄어듭니다.",
      "ev.president.text": "다음 주에 반장 선거가 있다.",
      "ev.president.c": ["반장 선거에 나간다", "친구에게 표를 준다"],
      "ev.president.r0a": "당선됐다! 무릎을 떨며 당선 소감을 말했다.",
      "ev.president.r0b": "세 표 차이로 떨어졌다. 일주일 동안 속이 쓰리다.",
      "ev.president.r1": "친구가 당선됐다. 하나 빚진 셈이다.",
      "ev.career.r": "자유학기제 진로 체험 주간: 동네 병원에서 의사 선생님을 따라다녔다. 흰 가운을 입고 싶어졌다.",
      "ev.jung2.text": "중2가 됐다. 갑자기 부모님이 아무것도 이해 못 하는 것 같고, 그 말을 입 밖으로 낸다.",
      "ev.jung2.c": ["반항한다", "저녁 식탁에서 털어놓는다"],
      "ev.jung2.r0": "이어폰을 꽂고 방문을 닫는다. 공부는 나중에.",
      "ev.jung2.r1": "어색했지만 부모님이 들어 주셨다. 조금 어른이 된 기분이다.",
      "ev.slump.text": "한 시간째 같은 지문만 보고 있다. 아무것도 머리에 안 들어온다. 슬럼프다.",
      "ev.slump.c": ["주말에 바다를 보러 간다", "버틴다"],
      "ev.slump.r0": "바람, 파도, 떡볶이. 다시 사람이 되어 돌아왔다.",
      "ev.slump.r1a": "일주일 만에 벗어났다. 왜 이걸 하는지 다시 떠올랐다.",
      "ev.slump.r1b": "벗어나지 못했다. 버티는 것만으로도 한계다.",
      "ev.burnout.r": "번아웃. 며칠째 책을 펼 수가 없다(다음 달 2칸 감소). 몸이 신호를 보내고 있다.",
      "ev.notes.r": (p, h) => "연세대에 간 선배가 " + h.sub(p.s) + " 요약 노트를 줬다. 보물이다.",
      "ev.family-money.r": "아빠 가게가 이번 달 어려웠다. 문제집 주문을 조용히 취소했다(−20만원).",
      "ev.grandma.r": "할머니가 봉투를 쥐여 주신다. \"책 사 보고, 밥 잘 챙겨 먹어라.\" (+20만원)",
      "ev.insomnia.r": "누워서도 머릿속으로 수학 문제를 푼다. 일주일째 불면증이다.",
      "ev.festival.text": "학교 축제다. 우리 반은 떡볶이 가게를 연다.",
      "ev.festival.c": ["같이 한다", "빈 교실에서 공부한다"],
      "ev.festival.r0": "정오에 다 팔렸다. 고등학교 마지막 축제. 후회 없다.",
      "ev.festival.r1": "계단을 타고 음악 소리가 올라오는 동안 모의고사 한 세트를 끝냈다.",
      "ev.d100.r": "D-100. 교실에 카운트다운 현수막이 걸렸다. 다들 갑자기 조용해진다.",
      "ev.retaker-doubt.text": "고등학교 동창들이 새터 사진을 올렸다. 나는 재수 기숙사에서 삼각김밥을 먹는 중이다.",
      "ev.retaker-doubt.c": ["숨김 처리하고 공부한다", "한 시간 동안 스크롤한다"],
      "ev.retaker-doubt.r0": "내년엔. 내년엔 꼭.",
      "ev.retaker-doubt.r1": "다들 너무 행복해 보인다. 나만 뒤처진 기분이다.",
      "ev.phone-broke.r": "휴대폰을 변기에 빠뜨렸다. 강제 디지털 디톡스. 집중력이 놀랍다.",
      "ev.mentor.r": "학원 담임이 플래너를 펴 놓고 상담해 줬다. 분 단위 계획표를 들고 나왔다.",
      "ev.campus.text": "과 동기들이 동아리 MT를 간다. 나는 몰래 수능 공부를 해야 하는데.",
      "ev.campus.c": ["MT에 간다", "핑계를 대고 공부한다"],
      "ev.campus.r0": "재밌다. 굳이 다시 볼 필요가 있나 싶어진다.",
      "ev.campus.r1": "\"집안일이 좀 있어서.\" 텅 빈 도서관이 완벽하다.",
      "ev.insight.r": (p, h) => h.sub(p.s) + "에서 뭔가 탁 트였다. 불가능해 보이던 문제들이 이제는... 할 만하다.",
      "ev.eve.title": "수능 전날 밤",
      "ev.eve.text": "가방을 쌌다. 수험표, 신분증, 컴퓨터용 사인펜, 아날로그 시계. 밤 9시다.",
      "ev.eve.c": ["10시에 바로 잔다", "새벽 1시까지 요약 노트를 본다", "누워서 기출 해설 영상을 딱 하나만 더 본다"],
      "ev.eve.r0a": "결국 새벽 3시까지 천장만 봤다. 긴장 탓이다.",
      "ev.eve.r0b": "정말로 잠들었다. 작은 기적이다.",
      "ev.eve.r1a": "그때 본 내용이 다음 날 시험에 나왔다. 운이 좋았다.",
      "ev.eve.r1b": "말똥말똥한 채로 잠들어 멍한 채로 깼다.",
      "ev.eve.r2": "하나가 여섯 개가 됐다. 알람 소리가 범죄처럼 느껴진다.",
      "ev.lunch.title": "수능 날 아침",
      "ev.lunch.text": "엄마가 수능 도시락을 건네준다. 무엇이 들어 있을까?",
      "ev.lunch.c": ["따뜻한 죽: 속이 편하다", "든든한 돈가스: 힘이 난다", "아무것도. 긴장돼서 못 먹을 것 같다"],
      "ev.lunch.r0": "가볍고 따뜻하다. 오후 내내 정신이 맑다.",
      "ev.lunch.r1a": "영어 듣기 직전의 든든한 점심... 눈꺼풀이 무거워진다.",
      "ev.lunch.r1b": "에너지 충전! 컨디션 최고다.",
      "ev.lunch.r2": "4교시쯤 되자 배에서 나는 소리가 감독관 목소리보다 크다.",

      "report.h": ["영역", "원점수", "표준점수", "백분위", "등급", "1등급 컷"],
      "report.subject": (p, h) => h.sub(p.s) + (p.el ? " (" + p.el + ")" : ""),
      "mock.title": "{name} 결과",
      "birth.title": "태어났습니다!",
      "birth.text": (p, h) => p.name + "은(는) " + (p.reg ? h.region(p.reg) + "의 " : "") + h.familyAdj(p.fam) + " 가정에서 " + (p.sex ? (p.sex === "f" ? "여자아이로 " : "남자아이로 ") : "") + "태어났습니다. 월 가구소득은 약 " + h.wonShort(p.inc * 10000) +
        "으로 한국 가구 중 " + h.fifth(p.fam) + "에 속하고, 부모님은 교육비로 한 달에 약 " + h.won(p.a) + "을 쓸 수 있습니다.",
      "birth.talent": "만 6세 때의 재능",
      "birth.note": "별은 적성, 즉 그 과목을 얼마나 빨리 익히는지를 뜻합니다. 실력은 수능 기준이라 50이 수능 응시자 평균입니다. 그래서 모든 아이는 낮은 곳에서 출발해 올라갑니다. 한 번 익힌 실력은 줄어들지 않습니다.",
      "birth.go": "초등학교 입학 →",
      "track.title": "계열 선택",
      "track.text": "고1이 끝나 갑니다. 고2·고3을 문과로 갈지 이과로 갈지, 그리고 탐구 두 과목을 고르세요. 사회 실력은 사회탐구로, 과학 실력은 과학탐구로 이어집니다.",
      "track.note.soc": "수학 선택과목은 확률과 통계입니다.",
      "track.note.sci": "수학 선택과목은 미적분입니다. 의대는 이과만 지원할 수 있습니다.",
      "track.inqNote": "점수는 같은 과목 응시자끼리 비교되므로, 잘하는 학생이 많은 과목일수록 상위권이 어렵습니다.",
      "track.go": "확정",
      "mock.text": "전국 수험생과 함께 치르는 실전 연습입니다.",
      "mock.total": "국수탐 표준점수 합: {n}",
      "mock.back": "다시 공부하러",
      "exam.title": "{y}학년도 수능",
      "exam.intro": "{y}년 11월. 교문 앞 후배들의 응원을 지나 자리를 찾고, 책상 위에 시계를 올려놓는다.",
      "exam.period": (p, h) => p.n + "교시 " + h.sub(p.s),
      "exam.outro": "저녁에 발표된 정답으로 가채점을 했다. 공식 성적은 12월에 나온다.",
      "exam.next": "12월: 성적표 확인 →",
      "exam.vibe.kor": ["지문이 술술 읽힌다.", "문학 한 세트에서 10분을 더 썼다.", "과학 지문이 양자 어쩌고 하는 글자의 벽이다. 패닉."],
      "exam.vibe.math": ["22번조차 치환 한 번에 풀렸다.", "마지막 킬러 문항은 비워 두고 나머지를 검토했다.", "손이 떨린다. 4점짜리 세 문제가 연달아 안 풀린다."],
      "exam.vibe.eng": ["듣기가 또렷하고 빈칸 추론도 술술 풀린다.", "빈칸 추론 두 문제는 찍었다.", "듣기 중에 멍해졌고, 그 시간을 끝내 만회하지 못했다."],
      "exam.vibe.hist": ["스무 문제, 12분. 쉽다.", "왕조 연도 몇 개가 머릿속에서 뒤섞였다.", "고려였나 조선이었나. 솔직히 모르겠다."],
      "exam.vibe.inq1": ["모든 자료가 익숙하다.", "함정 문제 하나에 걸렸다.", "30분이 증발했다."],
      "exam.vibe.inq2": ["답안지 마킹을 검토할 시간까지 남았다.", "다 풀긴 했지만 조금 급했다.", "종이 울리는데 아직 답안지를 마킹하고 있다."],
      "report.title": "수능 성적표",
      "report.headline.hard": (p, h) => "\"불수능\": 올해 " + josa(h.sub(p.s), "이", "가") + " 역대급으로 어려웠다.",
      "report.headline.easy": (p, h) => "\"물수능\": 올해 " + josa(h.sub(p.s), "이", "가") + " 이례적으로 쉬웠다. 한 문제 실수가 등급을 가른다.",
      "report.headline.normal": "평이한 난도의 수능. 영역마다 킬러 문항이 몇 개씩 있었다.",
      "report.total": "국수탐 표준점수 합",
      "report.vs": "작년 대비 {d}",
      "report.score": "정시 환산 점수",
      "report.attempt": "도전",
      "report.explain": "정시 환산 점수는 국어, 수학, 탐구(두 과목 평균) 백분위의 평균에서 영어 2등급 이하와 한국사 4등급 이하 감점을 뺀 값입니다.",
      "report.apply": "대학 지원하기 →",

      "apply.title": "정시 원서 접수",
      "apply.text": "정시 환산 점수는 {s}점입니다. 가·나·다군에서 한 곳씩, 최대 세 곳을 고르세요. 합격 가능성은 최근 입시를 바탕으로 한 대략적인 추정입니다.",
      "apply.chance": "합격 가능성 {p}%",
      "apply.sciOnly": "이과만 지원 가능",
      "apply.quota.local": "지역인재",
      "apply.quota.rural": "농어촌 전형",
      "apply.submit": "원서 제출 ({n}/3)",

      "offers.title": "합격자 발표",
      "offers.none": "올해는 합격한 곳이 없습니다",
      "offers.intro": "{y}년 2월. 결과가 나왔다.",
      "offers.yes": "합격", "offers.no": "불합격",
      "offers.enroll": "{uni} 입학",
      "offers.enroll.sub": "여기서 수험 생활을 마칩니다.",
      "offers.enroll.kept": "다니던 학교로 돌아갑니다.",
      "offers.half": "{uni}에 입학하고 몰래 반수",
      "offers.half.sub": "대학에 다니며 공부합니다(6월까지는 한 달에 2칸). 내년에도 {uni} 입학을 선택할 수 있습니다.",
      "offers.academy": "재종반에서 재수",
      "offers.academy.sub": "종일반 학원: 한 달 6칸, 모든 과목 학습 속도 ×1.45, 빡빡한 일정이 의지를 붙잡아 줍니다.",
      "offers.selfstudy": "독학재수",
      "offers.selfstudy.sub": "독서실에서 스스로 계획합니다. 한 달 6칸, 공부 방법 자유.",
      "offers.scholarship": "장학생: 학원비 무료. ",
      "offers.academyFee": "월 290만원은 감당할 수 없습니다. 정시 환산 점수 85점 이상이면 장학생으로 무료입니다.",
      "offers.stop": "여기서 그만두기",
      "offers.stop.sub": "지금은 수능도 대학도 내려놓습니다.",
      "offers.stop.none": "올해는 합격한 곳이 없습니다. 책을 덮습니다.",

      "end.title": "🎓 {uni}",
      "end.titleNone": "수험 생활의 끝",
      "end.none": "펜을 내려놓았다. 대학 없이 시작하는 인생도 많다.",
      "end.med": "의대 합격! 온 아파트 단지가 들을 만큼 집에서 잔치가 열렸다.",
      "end.sky": "SKY 합격. 엄마가 카톡 프로필 사진을 합격증으로 바꿨다.",
      "end.top": "서울 상위권 대학. 추석에 친척들의 곤란한 질문이 사라졌다.",
      "end.solid": "탄탄한 대학. 새로운 장이 시작된다.",
      "end.fresh": "새로운 출발. 시험이 인생의 전부는 아니다.",
      "end.attempts": "도전 횟수", "end.age": "입학 나이", "end.best": "최고 국수탐 표준점수 합", "end.grades": "최고 성적 국·수·영",
      "end.note": "대학 생활, 취업, 그 이후의 이야기는 다음 버전에서 이어집니다. 인생 기록과 시험 기록은 아래에 남아 있습니다.",
      "end.look": "이번 인생 돌아보기",

      // 그림으로 보는 화면(art.js): 기분 말풍선, 턴 전환, 활동 카드, 일기장.
      "mood.name.happy": "기분 최고", "mood.name.ok": "그럭저럭", "mood.name.tired": "방전 직전",
      "mood.name.stressed": "스트레스 폭발", "mood.name.sick": "몸이 안 좋아",
      "mood.happy": ["오늘 하루 괜찮았다.", "이제 좀 감이 오는 것 같아.", "내일이 기다려진다.", "요즘 사는 게 꽤 괜찮다."],
      "mood.ok": ["한 걸음씩.", "그냥 평범한 하루.", "나쁘지도, 좋지도 않아.", "계속 가자. 쌓이면 된다."],
      "mood.tired": ["내가 이걸 왜 하고 있지?", "졸려... 너무 졸려...", "아무것도 머리에 안 들어와.", "5분만 더. 제발."],
      "mood.stressed": ["너무 많아. 진짜 너무 많아.", "머리가 빙빙 돈다.", "다들 나보다 저만치 앞서 있는 것 같아.", "숨 쉬자. 천천히."],
      "mood.sick": ["으, 너무 아프다.", "온몸이 쑤신다.", "낮잠이 필요해. 한 열 번쯤.", "여기 덥나, 아니면 나만 그런가?"],
      "turn.elem": "1년이 흘렀다", "turn.mid": "한 학기가 흘렀다", "turn.high": "한 계절이 흘렀다", "turn.month": "한 달이 흘렀다",
      "turn.exam": "드디어 그날이 왔다",
      "turn.age": "{a}",
      "plan.study": "공부", "plan.life": "생활",
      "plan.tap": "카드를 누르면 시간 한 칸을 씁니다. 채워진 칸을 누르면 되돌립니다.",
      "plan.slot": "{a} 한 칸 되돌리기", "plan.free": "빈 칸",
      "diary.year": "{y}년 · {a}",
      "art.place.classroom": "초등학교 교실", "art.place.hallway": "중학교 복도",
      "art.place.desk": "늦은 밤 내 책상", "art.place.cubicle": "독서실 칸막이 자리", "art.place.academy": "재종반 강의실",
      "art.place.campus": "대학 캠퍼스", "art.place.examhall": "수능 시험장", "art.place.home": "결과를 기다리는 집",
      "art.place.gate": "대학교 정문", "art.place.road": "앞으로 이어진 길", "art.place.start": "새 생명을 기다리는 밤의 도시",
    },
  };

  // ---------- translator ----------
  // ctx() returns { inq: [id, id], track } for the game being shown, so subject names follow it.
  function make(lang, ctx) {
    lang = MSG[lang] ? lang : "en";
    const D = DATA[lang];
    const M = MSG[lang];
    const en = lang === "en";
    const h = {
      lang,
      t(key, p) {
        const v = M[key];
        if (v == null) return key;
        if (typeof v === "function") return v(p || {}, h);
        if (typeof v !== "string") return v;
        return v.replace(/\{(\w+)\}/g, (_, k) => (p && p[k] != null ? p[k] : ""));
      },
      sub(s) {
        if (s === "inq1" || s === "inq2") {
          const c = ctx();
          const id = c && c.inq ? c.inq[s === "inq1" ? 0 : 1] : null;
          return (id && D.inq[id]) || D.subj[s];
        }
        return D.subj[s];
      },
      // After the track choice the short labels name the slot (Inq 1/2); before it, the foundation.
      subShort(s) {
        const c = ctx();
        return (s === "inq1" || s === "inq2") && c && c.inq ? D.inqShort[s] : D.subjShort[s];
      },
      inq: (id) => D.inq[id],
      elective(s) {
        if (s === "kor") return D.elective.kor;
        if (s === "math") { const c = ctx(); return c && c.track ? D.elective[c.track] : ""; }
        return "";
      },
      act: (id) => D.act[id] || D.subj[id],
      actLong: (id) => D.actLong[id],
      actHint: (id) => D.actHint[id],
      method: (id) => D.method[id],
      status: (id) => D.status[id],
      family: (id) => D.family[id],
      familyAdj: (id) => D.familyAdj[id],
      fifth: (id) => D.fifth[id],
      season: (m) => D.season[m],
      // School grade 1–12 as people say it: "Grade 8" / "중2".
      schoolGrade(g) {
        if (en) return "Grade " + g;
        return g <= 6 ? "초" + g : g <= 9 ? "중" + (g - 6) : "고" + (g - 9);
      },
      phase(ph) {
        const names = en ? { elem: "Elem", mid: "Middle", high: "High" } : { elem: "초등", mid: "중학교", high: "고1·2" };
        if (names[ph]) return names[ph];
        const n = Number(ph.slice(1));
        return n === 1 ? (en ? "Grade 12" : "고3") : h.attShort(n);
      },
      track: (id) => D.track[id],
      uni: (id) => D.uni[id] || id,
      region: (id) => D.region[id] || id,
      regionShort: (id) => D.regionShort[id] || id,
      regionKind: (k) => D.regionKind[k] || k,
      chance: (k) => D.chance[k],
      month: (m) => D.months[m],
      monthLong: (m) => D.monthsLong[m],
      // Grades 10–11 sit 학력평가 in June too, where grade 12 sits the 모의평가.
      mock: (m, sch) => (!en && sch && sch < 12 ? m + "월 학력평가" : D.mock[m]),
      won: (n) => (en ? wonEn(n) : wonKo(n)),
      wonShort: (n) => (en ? wonShortEn(n) : wonShortKo(n)),
      date: (y, m) => (en ? D.months[m] + " " + y : y + "년 " + m + "월"),
      // Ages are international (만 나이) in both languages; Korean says so explicitly.
      age: (n) => (en ? String(n) : "만 " + n + "세"),
      // Short date for the log column: "Mar '26" / "26.03".
      dateShort(t) {
        const [y, m] = t.split("-").map(Number);
        return en ? D.months[m] + " '" + String(y).slice(2) : String(y).slice(2) + "." + String(m).padStart(2, "0");
      },
      att(n) {
        if (en) return n === 1 ? "First try" : ordinal(n) + " try";
        return ["", "현역", "재수", "삼수", "사수"][n] || n + "수";
      },
      attShort(n) { return en ? ordinal(n) : ["", "현역", "재수", "삼수", "사수"][n] || n + "수"; },
      // pre: before the track choice, when the last two are social studies and science.
      grades(g, pre) {
        const s = (k) => D.subjShort[k];
        return s("kor") + " " + g.kor + " · " + s("math") + " " + g.math + " · " + s("eng") + " " + g.eng + " · " + s("hist") + " " + g.hist +
          " · " + (pre ? s("inq1") + " " + g.inq1 + " · " + s("inq2") + " " + g.inq2 : (en ? "Inq" : "탐") + " " + g.inq1 + "/" + g.inq2);
      },
      planList(plan) {
        const order = ["kor", "math", "eng", "hist", "inq1", "inq2", "reading", "arts", "mock", "rest", "exercise", "friends", "games", "job"];
        return order.filter((id) => plan[id]).map((id) => {
          const name = D.act[id] || h.sub(id);
          return name + (plan[id] > 1 ? (en ? " ×" : "×") + plan[id] : "");
        });
      },
    };
    return h;
  }

  const api = { make, LANGS: ["en", "ko"], _MSG: MSG };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SuneungText = api;
})(typeof window !== "undefined" ? window : globalThis);
