(function () {
  "use strict";

  const S = window.Suneung;
  const { Game, ACTIVITIES, METHODS, FAMILIES, SUBJECTS, INQUIRY, UNIVERSITIES, MOCKS } = S;
  // v3: lives start in elementary school, so earlier saves (which start in grade 12) don't carry over.
  const SAVE_KEY = "suneung.save.v3";
  const FAME_KEY = "suneung.fame.v2";
  const LANG_KEY = "suneung.lang";

  const $ = (id) => document.getElementById(id);
  const els = {
    lang: $("lang"),
    setup: $("setup"), game: $("game"), name: $("name"), sex: $("sex"), startBtn: $("startBtn"), fame: $("fame"),
    header: document.querySelector("header"), placeChip: $("placeChip"), placeName: $("placeName"), placeGo: $("placeGo"), mapLegend: $("mapLegend"),
    turnbar: $("turnbar"), turnSum: $("turnSum"), statsPanel: $("statsPanel"), statsFold: $("statsFold"), lifeBtn: $("lifeBtn"), lifeMenu: $("lifeMenu"), fullHint: $("fullHint"),
    coach: $("coach"), coachRing: $("coachRing"), coachBubble: $("coachBubble"), coachText: $("coachText"), coachStep: $("coachStep"), coachSkip: $("coachSkip"), coachNext: $("coachNext"),
    sDate: $("sDate"), sDday: $("sDday"), sAttempt: $("sAttempt"), sStatus: $("sStatus"), sAge: $("sAge"),
    sName: $("sName"), sMoney: $("sMoney"), sAllowance: $("sAllowance"), sFam: $("sFam"), sFamSub: $("sFamSub"), sFamCard: $("sFamCard"),
    skills: $("skills"), condition: $("condition"), planTitle: $("planTitle"), blocksLeft: $("blocksLeft"),
    method: $("method"), methodNote: $("methodNote"), activities: $("activities"), planCost: $("planCost"),
    planErr: $("planErr"), repeatBtn: $("repeatBtn"), clearBtn: $("clearBtn"), nextBtn: $("nextBtn"), moveBtn: $("moveBtn"), quitBtn: $("quitBtn"), lessonNote: $("lessonNote"), traits: $("traits"), mainMap: $("mainMap"), mapHome: $("mapHome"), mapHint: $("mapHint"),
    people: $("people"), peopleTeacher: $("peopleTeacher"), peopleNote: $("peopleNote"),
    chart: $("chart"), legend: $("legend"), log: $("log"), history: $("history"), newLifeBtn: $("newLifeBtn"),
    modal: $("modal"), modalTitle: $("modalTitle"), modalBody: $("modalBody"), modalButtons: $("modalButtons"),
    modalArt: $("modalArt"), setupArt: $("setupArt"), scene: $("scene"), moodName: $("moodName"), moodText: $("moodText"),
    slots: $("slots"), turn: $("turn"), turnCap: $("turnCap"), turnDate: $("turnDate"), turnAge: $("turnAge"), confetti: $("confetti"),
    dailyBtn: $("dailyBtn"), dailyNote: $("dailyNote"), achSub: $("achSub"), achList: $("achList"), lives: $("lives"), toast: $("toast"),
    endBtn: $("endBtn"), achBtn: $("achBtn"), livesBtn: $("livesBtn"),
    cut: $("cut"), cutFrame: $("cutFrame"), cutCap: $("cutCap"), cutProg: $("cutProg"), cutSkip: $("cutSkip"), cutHint: $("cutHint"), cutToggle: $("cutToggle"),
  };
  const Art = window.SuneungArt;
  // Animations are decoration: with reduced motion the page skips the turn page, confetti and count-ups
  // (styles.css stops the CSS ones).
  const calm = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Emoji icons for activities, study methods and condition. Inquiry icons follow the track.
  // Early childhood relabels some activities (naps, the playground, playdates, cartoons).
  const EARLY_ICON = { books: "📚", blocks: "🧩", songs: "🎵", worksheet: "📝", rest: "😴", exercise: "🛝", friends: "🧸", games: "📺" };
  const TRAIT_ICON = {
    sturdy: "💪", calm: "😌", curious: "👀", sleeper: "🌙", steady: "🛡️", smiley: "😊",
    pencil: "✏️", book: "📕", mouse: "🖱️", stethoscope: "🩺", mic: "🎤", gavel: "⚖️", ball: "⚽", thread: "🧵", money: "💴", brush: "🖌️",
  };
  const ACT_ICON = { kor: "📖", math: "📐", eng: "🔤", hist: "🏯", reading: "📚", arts: "🎹", mock: "⏱️", rest: "😴", exercise: "🏃", friends: "🧑‍🤝‍🧑", games: "🎮", job: "🏪",
    prep: "📝", club: "🎸", volunteer: "🤝", project: "🔎" };
  const ACT_COLOR = { reading: "--a-c5", arts: "--a-c4", mock: "--a-c1", rest: "--a-c3", exercise: "--pos", friends: "--a-c2", games: "--a-c4", job: "--a-gold",
    prep: "--a-c1", club: "--a-c4", volunteer: "--pos", project: "--a-c5" };
  const METHOD_ICON = { self: "✏️", online: "💻", hagwon: "🏫", tutor: "🧑‍🏫" };
  function actIcon(id) {
    const tr = game && game.track;
    if (id === "inq1") return tr === "sci" ? "🔬" : "🌏";
    if (id === "inq2") return tr === "soc" ? "🏛️" : tr === "sci" ? "🧪" : "🔬";
    if (game && game.isEarly() && EARLY_ICON[id]) return EARLY_ICON[id];
    return ACT_ICON[id] || "•";
  }
  function actColor(a) { return a.kind === "study" ? subColor[a.subject] : ACT_COLOR[a.id] || PLAY_COLOR[a.id] || "--accent"; }
  const PLAY_COLOR = { books: "--s-kor", blocks: "--s-math", songs: "--s-eng", worksheet: "--a-c1" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Aptitude multiplies every study gain in a subject, so the time it takes to max it out is
  // 1 / aptitude of the average. Stars everywhere a subject shows, and the saving in words.
  function aptStars(apt) { return apt >= 1.45 ? "★★★★" : apt >= 1.25 ? "★★★" : apt >= 1.05 ? "★★" : apt >= 0.88 ? "★" : "·"; }
  function aptTime(apt) {
    const pct = Math.round((1 - 1 / apt) * 100);
    return Math.abs(pct) < 5 ? T("apt.even") : pct > 0 ? T("apt.less", { p: pct }) : T("apt.more", { p: -pct });
  }
  function aptBadge(apt) {
    return '<span class="apt' + (apt >= 1.25 ? " hi" : apt < 0.88 ? " lo" : "") + '" title="' + esc(T("ability.tip", { a: apt }) + " · " + aptTime(apt)) + '">' + aptStars(apt) + "</span>";
  }
  const gradeChip = (g) => '<span class="gr gr' + g + '">' + g + "</span>";
  const subColor = { kor: "--s-kor", math: "--s-math", eng: "--s-eng", hist: "--s-hist", inq1: "--s-inq1", inq2: "--s-inq2" };

  // ---------- storage (best effort: private windows may refuse) ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* playing without saves is fine */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  function save() { store.set(SAVE_KEY, JSON.stringify(game)); }
  function loadSave() {
    try {
      const raw = store.get(SAVE_KEY);
      return raw ? Game.fromJSON(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }
  function loadFame() { try { return JSON.parse(store.get(FAME_KEY) || "[]"); } catch (e) { return []; } }
  function addFame(entry) {
    const list = loadFame().concat([entry]).sort((a, b) => b.total - a.total).slice(0, 10);
    store.set(FAME_KEY, JSON.stringify(list));
  }

  // ---------- language ----------
  // Subject names follow the game being shown: before the track choice there is none.
  function ctx() { return game ? { inq: game.inq, track: game.track, parents: game.parents || "both" } : { inq: null, track: null, parents: "both" }; }
  let lang = store.get(LANG_KEY);
  if (lang !== "en" && lang !== "ko") lang = /^ko\b/i.test(navigator.language || "") ? "ko" : "en";
  let L = window.SuneungText.make(lang, ctx);
  const T = (k, p) => L.t(k, p);

  function applyStatic() {
    document.documentElement.lang = T("lang.html");
    document.title = T("app.title");
    for (const el of document.querySelectorAll("[data-t]")) el.textContent = T(el.dataset.t);
    els.name.placeholder = T("setup.namePh." + sex);
    // The header, the dialog and the cutscene each have a language switch (the page behind a dialog is inert).
    for (const b of document.querySelectorAll(".lang-switch button")) {
      b.classList.toggle("on", b.dataset.v === lang);
      b.setAttribute("aria-pressed", b.dataset.v === lang ? "true" : "false");
    }
    els.cutToggle.textContent = T(cutsOn ? "cut.toggle.on" : "cut.toggle.off");
    els.cutToggle.setAttribute("aria-pressed", cutsOn ? "true" : "false");
  }
  // Switching language redraws everything, dialogs included: what a dialog holds (ticks, picks) lives
  // in `ui` and `dlg`, not in the DOM, so the redrawn dialog comes back exactly as it was.
  let redrawing = false;
  function setLang(v) {
    if (v === lang) return;
    lang = v;
    store.set(LANG_KEY, lang);
    L = window.SuneungText.make(lang, ctx);
    applyStatic();
    const focusLang = document.activeElement && document.activeElement.closest(".lang-switch");
    const where = focusLang ? (focusLang.closest("#modal") ? "#modal" : focusLang.closest("#cut") ? "#cut" : "header") : null;
    // A toast is a moment's news in the old language; let it go rather than leave it untranslated.
    els.toast.classList.add("hidden");
    if (cut) { cutCaption(); return; }
    redrawing = true;
    try {
      if (els.setup.classList.contains("hidden")) render();
      else { renderSetup(); if (dlg) reopenDlg(); }
    } finally { redrawing = false; }
    // Keep keyboard focus on the switch that was used, in its redrawn place.
    if (where) { const b = document.querySelector(where + " .lang-switch button[data-v=" + lang + "]"); if (b) b.focus({ preventScroll: true }); }
  }
  for (const grp of document.querySelectorAll(".lang-switch")) {
    grp.addEventListener("click", (e) => {
      e.stopPropagation(); // a click on the cutscene's switch mustn't advance the film
      const b = e.target.closest("button[data-v]");
      if (b) setLang(b.dataset.v);
    });
  }

  // ---------- setup screen ----------
  // A name and boy or girl: family and talent are dealt at birth.
  let sex = "m";
  function renderSetup() {
    for (const b of els.sex.querySelectorAll("button")) {
      b.classList.toggle("on", b.dataset.v === sex);
      b.setAttribute("aria-pressed", b.dataset.v === sex ? "true" : "false");
    }
    els.name.placeholder = T("setup.namePh." + sex);
    els.setupArt.innerHTML = Art.scene({ scene: "start", aria: T("art.place.start") });
    els.dailyBtn.textContent = T("daily.label", { d: today() });
    renderFame();
    renderAch();
    renderLives();
  }
  function renderFame() {
    const list = loadFame();
    if (!list.length) {
      els.fame.innerHTML = '<tr><td class="muted empty">' + esc(T("fame.empty")) + "</td></tr>";
      return;
    }
    const h = T("fame.h");
    // Name and university are text, so they're left-aligned like their cells (and wrap on a phone).
    els.fame.innerHTML = "<thead><tr>" + h.map((x, i) => "<th" + (i === 1 || i === 4 ? ' class="l"' : "") + ">" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
      list.map((e, i) => "<tr><td>" + (["🥇", "🥈", "🥉"][i] || i + 1) + '</td><td class="l">' + esc(e.name) + "</td><td>" + e.total + "</td><td>" + e.g.join("·") +
        '</td><td class="l">' + esc(e.uni ? L.uni(e.uni) : T("fame.none")) + "</td><td>" + e.attempts + "</td></tr>").join("") + "</tbody>";
  }
  function showSetup() {
    closeModal();
    els.setup.classList.remove("hidden");
    els.game.classList.add("hidden");
    document.body.classList.remove("in-game");
    hideCoach();
    if (game && game.ending) game = null;
    renderSetup();
  }
  els.sex.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    sex = b.dataset.v;
    renderSetup();
  });
  // Born this year, so elementary school starts six years on (startLife's default).
  els.startBtn.addEventListener("click", () => startLife({}));
  els.name.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); startLife({}); } });

  // ---------- game screen ----------
  let game = null;
  let plan = {};
  let method = "self";
  let outcome = null; // { title, msg } shown after answering an event
  let examStep = 0; // 0 = exam day, 1 = December score report

  function showGame() {
    sceneKey = "";
    shownTrace = 0;
    els.setup.classList.add("hidden");
    els.game.classList.remove("hidden");
    document.body.classList.add("in-game");
    method = game.method || "self";
    if (!planTotal()) plan = defaultPlan();
    render();
  }

  function planTotal() { let n = 0; for (const k in plan) n += plan[k]; return n; }
  // Last month's plan stretched or trimmed to this month's block count.
  // Activities that stopped being offered (arts after grade 9, reading in grade 12) are dropped.
  function defaultPlan() {
    if (!game.lastPlan) return {};
    const offered = new Set(game.activities().map((a) => a.id));
    const p = {};
    for (const k in game.lastPlan) if (offered.has(k) && game.lastPlan[k]) p[k] = game.lastPlan[k];
    return fitPlan(p, game.blocks());
  }
  function fitPlan(p, n) {
    let total = 0;
    for (const k in p) total += p[k];
    const order = ACTIVITIES.map((a) => a.id);
    while (total > n) {
      let pick = null;
      for (const id of order) if (p[id] && (!pick || p[id] >= p[pick])) pick = id;
      p[pick]--; total--;
      if (!p[pick]) delete p[pick];
    }
    // Spread extra blocks over the subjects already in the plan, in order.
    const studied = order.filter((id) => p[id] && SUBJECTS.indexOf(id) >= 0);
    let i = 0;
    while (total < n) {
      const id = studied.length ? studied[i++ % studied.length] : "rest";
      p[id] = (p[id] || 0) + 1; total++;
    }
    return p;
  }

  function render() {
    if (!game) return;
    // Once the month's screens are cleared, start the next plan from last month's.
    if (!game.queue.length && !game.ending && !planTotal() && !outcome) plan = defaultPlan();
    renderScene();
    renderMap();
    renderStats();
    renderBars();
    renderPlan();
    renderPeople();
    renderLog();
    renderHistory();
    renderTurnSum();
    els.endBtn.classList.toggle("hidden", !game.ending);
    drawChart();
    renderModal();
    maybeCoach();
  }

  // ---------- the scene: where you are in life, and you in it ----------
  // What the art needs to draw you: life stage, season, your (seeded) looks and your mood.
  function artCtx(extra) {
    const g = game;
    return Object.assign({
      // Out of school you study at a study café in a hoodie, up to the Suneung.
      stage: g.ending ? "uni" : g.isEarly() ? (g.age <= 2 ? "baby" : "kinder") : g.dropout != null && (g.inSchool() || g.status === "hs3") ? "dropout" : g.status,
      // A child kept at home from 3 stays in the nursery scene.
      home: g.isEarly() && g.atKinder() && g.schoolInfo().id === "homeCare",
      season: Art.seasonOf(g.month),
      look: Art.lookFor(g.seed, g.sex),
      mood: Art.moodOf(g),
      family: g.family,
      view: g.regionInfo().view || "city",
      // v6.4: the windows and skylines show your region (Seoul, Busan, Jeju ...).
      region: g.region || "",
      parents: g.parents || "both",
      jobs: presentJobs(g),
    }, extra || {});
  }
  let sceneKey = "";
  function renderScene() {
    const g = game;
    const school = g.inSchool();
    const c = artCtx({
      ending: !!g.ending,
      label: g.ending && g.ending.uni ? L.uni(g.ending.uni) : "",
      // v6.8: straight to work out of a vocational high (the plant gate).
      work: !!(g.ending && g.ending.work),
      examMonth: !school && !g.ending && g.month === 11,
      results: !school && !g.ending && g.month === 12,
      // The countdown on the wall only means something in an exam year.
      dday: !school && !g.ending && g.month <= 11 ? Math.max(0, g.daysToExam()) : null,
    });
    // At the university gate you're cheering, whatever the bars say.
    if (c.ending && (c.label || c.work)) c.mood = "happy";
    // v6.5: the picture's light follows what just happened (see Game.recentTone); the end of the road
    // without a university is grey, the gate is warm.
    c.tone = c.ending ? (c.label || c.work ? 1 : -1) : g.recentTone ? g.recentTone() : 0;
    c.aria = T("art.place." + Art.sceneName(c.stage, c));
    // Rebuilding the SVG restarts its animations, so only redraw when something visible changed.
    const key = JSON.stringify(c) + lang;
    if (key !== sceneKey) {
      sceneKey = key;
      els.scene.innerHTML = Art.scene(c);
      els.scene.parentElement.dataset.place = Art.sceneName(c.stage, c);
    }
    const thoughts = T("mood." + c.mood);
    els.moodName.textContent = T("mood.name." + c.mood);
    els.moodText.textContent = Array.isArray(thoughts) ? thoughts[Math.abs(g.clock + g.seed) % thoughts.length] : "";
    els.moodName.parentElement.dataset.mood = c.mood;
  }

  // The family's wealth class right now: its income fifth as a five-step meter, and how far it has moved
  // since birth (family-fortune events move it). The card flashes when the class changes.
  let shownFam = null;
  // The jobs of the parents you live with ({ mom, dad }, null for one who isn't there), or null.
  function presentJobs(g) {
    if (!g.jobs) return null;
    const here = g.workingParents(true);
    return { mom: here.indexOf("mom") >= 0 ? g.jobs.mom : null, dad: here.indexOf("dad") >= 0 ? g.jobs.dad : null };
  }
  function renderFamily(g) {
    const n = S.FAMILY_IDS.indexOf(g.family) + 1;
    const born = (g.log.find((l) => l.key === "log.born") || { p: {} }).p.fam || g.family;
    const diff = n - (S.FAMILY_IDS.indexOf(born) + 1);
    let meter = "";
    for (let i = 1; i <= 5; i++) meter += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    // The family as chips that wrap instead of one line that gets cut off: [class meter] [who raises
    // you] [Mom: job] [Dad: job], with the class's meaning (or how far it moved) underneath.
    const chip = (text, cls) => '<span class="chip' + (cls ? " " + cls : "") + '">' + text + "</span>";
    // A child in care has no household class: the card names the home and what it pays instead.
    if (g.parents === "care") {
      els.sFam.innerHTML = chip(esc(L.parents("care")), "fam-class");
      els.sFamSub.textContent = g.flags.careLeft != null ? T("stat.careOut", { a: g.grossBudget() }) : T("stat.careSub", { a: g.grossBudget() });
    } else {
      const jobs = presentJobs(g);
      els.sFam.innerHTML = chip(esc(L.family(g.family)) + ' <span class="fam-meter" aria-hidden="true">' + meter + "</span>", "fam-class") +
        chip(esc(T("stat.parents", { par: g.parents || "both" }))) +
        (jobs ? ["mom", "dad"].filter((w) => jobs[w]).map((w) => chip(esc(T("stat.jobs", { [w]: jobs[w] })))).join("") : "");
      els.sFamSub.textContent = diff ? T("stat.familyMoved", { up: diff > 0, from: born, fam: g.family }) : T("stat.familySub", { fam: g.family });
    }
    els.sFamCard.classList.toggle("fam-up", diff > 0);
    els.sFamCard.classList.toggle("fam-down", diff < 0);
    const key = g.seed + ":" + g.family;
    if (shownFam && shownFam.split(":")[0] === String(g.seed) && shownFam !== key && !calm()) {
      els.sFamCard.classList.remove("flash");
      void els.sFamCard.offsetWidth;
      els.sFamCard.classList.add("flash");
    }
    shownFam = key;
  }
  function renderStats() {
    const g = game;
    els.sDate.textContent = L.date(g.year, g.month);
    const d = g.daysToExam();
    const school = g.inSchool();
    els.sDday.textContent = g.ending ? T("stat.over") : school ? T("stat.years", { n: g.isEarly() ? 17 - g.age : 12 - g.grade }) :
      g.month <= 11 ? (d > 0 ? T("stat.dday", { n: d }) : T("stat.examMonth")) : T("stat.results");
    els.sAttempt.textContent = g.isEarly() ? T("early.stage", { a: g.age }) : school ? L.schoolGrade(g.grade) : L.att(g.attempt);
    els.sStatus.textContent = g.dropout != null && (school || g.status === "hs3") ? T("st.dropout", { ged: g.flags.ged != null }) : g.inClass() || g.atKinder() ? L.school(g.schoolInfo().id) : L.status(g.status);
    // Name the real school this one stands for; its type shows on hover.
    const rs = g.dropout == null || !school ? g.realSchool() : null;
    if (rs) els.sStatus.textContent = L.realSchool(rs.name);
    els.sStatus.title = rs ? L.school(g.schoolInfo().id) : "";
    els.sAge.textContent = L.age(g.age);
    els.sName.textContent = g.name + " · " + L.regionShort(g.regionInfo().id) + (g.track ? " · " + L.track(g.track) : "");
    els.sMoney.textContent = L.wonShort(g.money);
    els.sAllowance.textContent = T("stat.allowance", { a: L.wonShort(g.allowance()) });
    renderFamily(g);
  }

  // from: where the fill starts, so a fresh turn can grow the bar from last turn's value.
  // shown: text in place of the number (e.g. "100+"); over: ability past the top of the scale.
  // tail: extra HTML in a last column (the aptitude stars on ability bars).
  function bar(name, value, color, delta, title, icon, from, shown, over, tail) {
    const v = Math.max(0, Math.min(100, value));
    const start = from == null ? v : Math.max(0, Math.min(100, from));
    let d = "", pop = "";
    if (delta && Math.abs(delta) >= 0.5) {
      const txt = (delta > 0 ? "+" : "") + Math.round(delta);
      d = '<span class="delta ' + (delta > 0 ? "up" : "down") + '">' + txt + "</span>";
      if (from != null) pop = '<span class="gain ' + (delta > 0 ? "up" : "down") + '" aria-hidden="true">' + txt + "</span>";
    }
    return '<div class="bar"' + (title ? ' title="' + esc(title) + '"' : "") + '><span class="name">' + (icon ? '<span class="bi" aria-hidden="true">' + icon + "</span>" : "") + esc(name) +
      '</span><span class="track"><span class="fill" data-w="' + v + '" style="width:' + start + "%;background:" + color + '"></span></span><span class="val' + (over ? " over" : "") + '">' + (shown != null ? shown : Math.round(value)) + d + pop + "</span>" + (tail || "") + "</div>";
  }
  // Ability gains animate once, on the render right after a turn: bars grow and the gain floats up.
  let shownTrace = 0;
  function renderBars() {
    const g = game;
    const prev = g.trace.length > 1 ? g.trace[g.trace.length - 2].skills : null;
    // Wait until the turn's screens are cleared, or the show would play behind a modal.
    const clear = !g.queue.length && !outcome;
    const animate = clear && shownTrace > 0 && g.trace.length > shownTrace && !calm();
    if (clear || !shownTrace) shownTrace = g.trace.length;
    els.skills.innerHTML = SUBJECTS.map((s) => {
      const fresh = g.trace[g.trace.length - 1].track && (s === "inq1" || s === "inq2");
      const delta = prev && !fresh ? (g.skills[s] - prev[s]) * 16.67 : 0;
      const from = animate && prev && !fresh ? S.skillScore(prev[s]) : null;
      // The bar tops out at 100 (θ = 3), but ability keeps counting past it, and it still matters for
      // SNU and 의대, so say so instead of looking stuck.
      const over = 50 + g.skills[s] * 16.67 >= 100.5;
      const tip = T("ability.tip", { a: g.aptitude[s] }) + " · " + aptTime(g.aptitude[s]) + (over ? " · " + T("ability.over") : "");
      return bar(L.sub(s), S.skillScore(g.skills[s]), "var(" + subColor[s] + ")", delta, tip, actIcon(s), from, over ? "100+" : null, over, aptBadge(g.aptitude[s]));
    }).join("") + '<p class="apt-note">' + esc(T(g.isEarly() ? "ability.earlyNote" : "ability.aptNote")) + "</p>";
    const lvl = (v, goodHigh) => {
      const x = goodHigh ? v : 100 - v;
      return x >= 60 ? "var(--pos)" : x >= 35 ? "var(--warn)" : "var(--neg)";
    };
    els.condition.innerHTML =
      bar(T("cond.health"), g.health, lvl(g.health, true), 0, T("cond.health.tip"), "❤️") +
      bar(T("cond.stress"), g.stress, lvl(g.stress, false), 0, T("cond.stress.tip"), "😣") +
      bar(T("cond.motivation"), g.motivation, lvl(g.motivation, true), 0, T("cond.motivation.tip"), "🔥") +
      bar(T("cond.practice"), g.practice * 100, "var(--accent)", 0, T("cond.practice.tip"), "⏱️") +
      bullyNote(g) + dropoutNote(g);
    renderRecord(g);
    // Traits from the newborn and 돌잡이 reveals, with what each does.
    els.traits.innerHTML = (g.traits || []).map((id) => '<span class="trait-chip" title="' + esc(L.traitFx(id)) + '"><b><span aria-hidden="true">' + (TRAIT_ICON[id] || "✨") + " </span>" + esc(L.trait(id)) + "</b><small>" + esc(L.traitFx(id)) + "</small></span>").join("");
    if (animate) {
      // Two frames: the first paints the old width, the second lets the CSS transition run.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const f of els.skills.querySelectorAll(".fill[data-w]")) f.style.width = f.dataset.w + "%";
      }));
    }
  }
  // While the player is being bullied, a line under the condition bars says what it costs this turn.
  function bullyNote(g) {
    const bp = g.bullyPenalty();
    if (!bp) return "";
    return '<p id="bullyNote" class="cond-note" title="' + esc(T("cond.bully.tip")) + '">' +
      esc(T("cond.bully", { lv: bp.lv, pct: Math.round(bp.cut * 100), blk: bp.lostBlock })) + "</p>";
  }

  function dropoutNote(g) {
    if (g.dropout == null || !(g.inSchool() || g.status === "hs3")) return "";
    return '<p class="cond-note drop">' + esc(T("cond.dropout", { ged: g.flags.ged != null })) + "</p>";
  }

  function renderPlan() {
    const g = game;
    const n = g.blocks();
    const used = planTotal();
    const done = !!g.ending;
    els.planTitle.parentElement.parentElement.classList.toggle("ended", done);
    const mock = MOCKS[g.month] && !(g.month === 3 && g.status !== "hs3");
    els.planTitle.textContent = done ? T("plan.done") :
      T("plan.title", { m: g.month, mock, exam: g.month === 11, st: g.status, g: g.grade, a: g.age, track: g.grade === 10 && g.month === 12 });
    els.blocksLeft.textContent = done ? "" : T("plan.left", { l: n - used, n });
    els.blocksLeft.classList.toggle("done", used === n);
    els.blocksLeft.classList.toggle("hidden", done);
    if (used < n) els.fullHint.textContent = "";

    // Small children don't pick study methods.
    els.method.parentElement.classList.toggle("hidden", g.isEarly());
    const fixed = g.methodFixed();
    // After a move to the countryside there may be no tutor to keep: fall back to online lectures.
    if (!fixed && !g.methodAvailable(method)) method = "online";
    els.method.innerHTML = Object.keys(METHODS).map((id) => {
      const on = (fixed || method) === id;
      const off = fixed || done || !g.methodAvailable(id);
      return '<button type="button" data-v="' + id + '" class="' + (on ? "on" : "") + '" aria-pressed="' + on + '"' + (off ? " disabled" : "") + (g.methodAvailable(id) ? "" : ' title="' + esc(T("plan.noTutor")) + '"') +
        '><span aria-hidden="true">' + METHOD_ICON[id] + " </span>" + esc(L.method(id)) + "</button>";
    }).join("");
    // Speed and price depend on where you live (Gangnam's academies are better and dearer).
    const mid = fixed || method, m = METHODS[mid], mx = Math.round(g.methodMult(mid) * 100) / 100;
    els.methodNote.textContent = (fixed ? T("plan.methodFixed", { x: mx }) : T("plan.methodNote", { x: mx, cost: g.methodCost(mid), sens: m.sens })) +
      (g.methodAvailable("tutor") ? "" : " · " + T("plan.noTutor"));

    // Activities are compact cards: icon, name, what it does as small coloured chips, and a stepper.
    // Tap the card (or +) to give it a block, − to take one back. The full sentence stays as the
    // card's tooltip and for screen readers.
    const acts = g.activities();
    const early = g.isEarly();
    const name = (a) => (a.kind === "study" ? L.sub(a.subject) : early && L.actEarlyLong(a.id) ? L.actEarlyLong(a.id) : L.actLong(a.id));
    const card = (a) => {
      const k = plan[a.id] || 0;
      const study = a.kind === "study";
      const nm = name(a);
      const hint = study ? T("plan.studyHint", { v: 50 + g.skills[a.subject] * 16.67 >= 100.5 ? "100+" : S.skillScore(g.skills[a.subject]), s: a.subject }) + " · " + aptTime(g.aptitude[a.subject]) : early && L.actEarlyHint(a.id) ? L.actEarlyHint(a.id) : L.actHint(a.id);
      const pips = k ? '<span class="pips" aria-hidden="true">' + "●".repeat(Math.min(k, 8)) + "</span>" : "";
      return '<div class="act' + (k ? " has" : "") + (used < n && !done ? " open" : "") + '" data-card="' + a.id + '" style="--c:var(' + actColor(a) + ')" title="' + esc(nm + ": " + hint) + '">' +
        '<span class="ic" aria-hidden="true">' + actIcon(a.id) + "</span>" +
        '<div class="lbl"><span class="nm">' + esc(nm) + "</span>" + (study ? " " + aptBadge(g.aptitude[a.subject]) : "") + '<span class="sr">' + esc(hint) + "</span>" + pips + "</div>" +
        '<div class="fx" aria-hidden="true">' + actChips(g, a) + "</div>" +
        '<div class="stepper">' +
        '<button type="button" data-a="' + a.id + '" data-d="-1" aria-label="' + esc(T("plan.less", { a: nm })) + '"' + (k && !done ? "" : " disabled") + ">−</button>" +
        '<span class="n">' + k + "</span>" +
        '<button type="button" data-a="' + a.id + '" data-d="1" aria-label="' + esc(T("plan.more", { a: nm })) + '"' + (used < n && !done ? "" : " disabled") + ">+</button></div></div>";
    };
    const study = acts.filter((a) => a.kind === "study" || a.kind === "play"), life = acts.filter((a) => a.kind !== "study" && a.kind !== "play" && !a.hs);
    // High school: the school-record activities get their own group (v6.0).
    const rec = acts.filter((a) => a.hs);
    els.activities.innerHTML = '<h3 class="grp">' + esc(T(early ? "plan.play" : "plan.study")) + "</h3>" + study.map(card).join("") +
      (rec.length ? '<h3 class="grp">' + esc(T("plan.record")) + '</h3><p class="grp-note">' + esc(T("plan.recordNote")) + "</p>" + rec.map(card).join("") : "") +
      '<h3 class="grp">' + esc(T("plan.life")) + "</h3>" + life.map(card).join("");

    // The turn's time as a row of slots, filled in activity order.
    let slots = "";
    for (const a of acts) {
      for (let i = 0; i < (plan[a.id] || 0); i++) {
        slots += '<button type="button" class="slot" data-slot="' + a.id + '" style="--c:var(' + actColor(a) + ')" aria-label="' + esc(T("plan.slot", { a: name(a) })) + '"' + (done ? " disabled" : "") + ">" +
          '<span aria-hidden="true">' + actIcon(a.id) + "</span></button>";
      }
    }
    for (let i = used; i < n; i++) slots += '<span class="slot empty" title="' + esc(T("plan.free")) + '"></span>';
    els.slots.innerHTML = slots;

    const cost = g.planCost(plan, method);
    const income = g.income(plan);
    const budget = g.budget();
    const over = Math.max(0, cost - budget);
    els.planCost.textContent = done ? "" : T("plan.cost", { c: cost, b: budget, o: over, e: income, m: g.money + income - over });
    const err = used === n ? g.validate(plan, method) : null;
    els.planErr.textContent = err ? T(err, { n }) : "";
    els.nextBtn.disabled = done || used !== n || !!err || g.queue.length > 0;
    els.nextBtn.textContent = !g.inSchool() && g.month === 11 ? T("plan.sit") : T("plan.next", { st: g.status });
    els.repeatBtn.disabled = done || !g.lastPlan;
    els.clearBtn.disabled = done || !used;
    els.moveBtn.classList.toggle("hidden", done);
    els.turnbar.classList.toggle("hidden", done);
    // School lessons add to every subject on their own; say so, and say when they're gone.
    els.lessonNote.textContent = done ? "" : g.isEarly() ? T("plan.early") + (g.atKinder() && g.schoolInfo().id !== "homeCare" ? " " + T("plan.kinder") : "") : g.inClass() ? T("plan.lessons") : g.dropout != null && (g.inSchool() || g.status === "hs3") ? T("plan.noLessons") : "";
    els.lessonNote.classList.toggle("hidden", !els.lessonNote.textContent);
    // Leaving school is offered from grade 7 until you do it.
    const qb = g.quitBlock();
    els.quitBtn.classList.toggle("hidden", done || qb === "done" || qb === "grade");
  }

  // What an activity does, as chips: green when it helps, red when it costs you, grey for facts.
  // A display table only (the engine's advance() has the real numbers); [kind, value].
  const ACT_FX = {
    reading: [["up", "kor"], ["up", "inq1"], ["free"]],
    arts: [["cost", 150000], ["up", "health"], ["down", "stress"], ["up", "motivation"]],
    mock: [["up", "practice"], ["up", "all"], ["upBad", "stress"]],
    rest: [["down", "stress"], ["up", "health"]],
    exercise: [["up", "health"], ["down", "stress"]],
    friends: [["downBig", "stress"], ["up", "motivation"], ["events"]],
    games: [["down", "stress"], ["downBad", "motivation"]],
    job: [["pay", S.JOB_PAY || 250000], ["upBad", "stress"], ["downBad", "health"]],
    books: [["up", "kor"], ["free"]],
    blocks: [["up", "math"], ["free"]],
    songs: [["up", "eng"], ["free"]],
    worksheet: [["cost", 40000], ["up", "kor"], ["up", "math"]],
    // The school record (v6.0): what each builds in the 학생부.
    prep: [["up", "naesin"], ["upBad", "stress"]],
    club: [["up", "rec.comm"], ["up", "rec.career"], ["down", "stress"]],
    volunteer: [["up", "rec.comm"], ["down", "stress"]],
    project: [["up", "rec.career"], ["up", "rec.acad"]],
  };
  const COND = { health: 1, stress: 1, motivation: 1, practice: 1 };
  function actChips(g, a) {
    const c = (text, tone) => '<span class="chip sm ' + tone + '">' + esc(text) + "</span>";
    if (a.kind === "study") {
      const s = a.subject, over = 50 + g.skills[s] * 16.67 >= 100.5;
      const pct = Math.round((1 - 1 / g.aptitude[s]) * 100);
      return c(T("fx.ability", { v: over ? "100+" : S.skillScore(g.skills[s]) }), "info") +
        (Math.abs(pct) >= 5 ? c(T(pct > 0 ? "fx.faster" : "fx.slower", { p: Math.abs(pct) }), pct > 0 ? "good" : "bad") : "");
    }
    const what = (k) => (COND[k] ? T("cond." + k) : k === "all" ? T("fx.all") : k === "naesin" ? T("fx.naesin") : /^rec\./.test(k) ? T(k) : T("fx.sub")[k]);
    return (ACT_FX[a.id] || []).map(([kind, v]) => {
      if (kind === "free") return c(T("fx.free"), "info");
      if (kind === "events") return c(T("fx.events"), "info");
      if (kind === "cost") return c(T("fx.cost", { a: v }), "cost");
      if (kind === "pay") return c(T("fx.pay", { a: v }), "good");
      if (kind === "up") return c(T("fx.up", { s: what(v) }), "good");
      if (kind === "down") return c(T("fx.down", { s: what(v) }), "good");
      if (kind === "downBig") return c(T("fx.downBig", { s: what(v) }), "good");
      if (kind === "upBad") return c(T("fx.up", { s: what(v) }), "bad");
      return c(T("fx.down", { s: what(v) }), "bad");
    }).join("");
  }
  function changePlan(id, d) {
    plan[id] = Math.max(0, (plan[id] || 0) + d);
    if (!plan[id]) delete plan[id];
    renderPlan();
  }
  // Tapping + (or a card) with every block used explains what to do, once per visit.
  let fullHinted = false;
  function hintFull() {
    if (fullHinted || !game || game.ending) return;
    fullHinted = true;
    els.fullHint.textContent = T("plan.full");
    clearTimeout(hintFull.t);
    hintFull.t = setTimeout(() => { els.fullHint.textContent = ""; }, 6000);
  }
  // A disabled button gets no click, but it does get pointer events.
  els.activities.addEventListener("pointerup", (e) => {
    const b = e.target.closest('button[data-d="1"]');
    if (b && b.disabled && planTotal() >= game.blocks()) hintFull();
  });
  els.activities.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) {
      if (b.disabled || !b.dataset.a) return;
      changePlan(b.dataset.a, Number(b.dataset.d));
      // The re-render replaced the button, so put keyboard focus back on its twin.
      const again = els.activities.querySelector('button[data-a="' + b.dataset.a + '"][data-d="' + b.dataset.d + '"]');
      if (again && !again.disabled) again.focus({ preventScroll: true });
      return;
    }
    // A tap anywhere else on a card adds a block (the + button stays the keyboard route).
    const c = e.target.closest(".act[data-card]");
    if (!c) return;
    const plus = c.querySelector('button[data-d="1"]');
    if (plus && !plus.disabled) changePlan(c.dataset.card, 1);
    else if (game && planTotal() >= game.blocks()) hintFull();
  });
  els.slots.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-slot]");
    if (b && !b.disabled) changePlan(b.dataset.slot, -1);
  });
  els.method.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b || b.disabled) return;
    method = b.dataset.v;
    renderPlan();
  });
  els.repeatBtn.addEventListener("click", () => { plan = defaultPlan(); renderPlan(); });
  els.clearBtn.addEventListener("click", () => { plan = {}; renderPlan(); });
  // A double click mustn't play two turns: the second click lands on a fresh, already full plan.
  let nextAt = 0;
  els.nextBtn.addEventListener("click", () => {
    const now = Date.now();
    if (now - nextAt < 700 || els.nextBtn.disabled) return;
    nextAt = now;
    const was = game.status;
    const before = { stress: game.stress, health: game.health, motivation: game.motivation, money: game.money, logN: game.log.length };
    lastMove = null; // the route of a move stays on the map until the next turn
    try {
      game.advance(plan, method);
    } catch (err) {
      els.planErr.textContent = err.message;
      return;
    }
    turnSum = summarize(before);
    plan = game.queue.length ? {} : defaultPlan();
    save();
    render();
    showTurn(was);
  });

  // ---------- "This turn": what the turn just played did, in up to four chips ----------
  // Read from the turn's log.month entry (subject gains, money spent) and log.report (class rank),
  // plus the condition bars before and after. Display only: nothing here feeds back into the game.
  let turnSum = null;
  function summarize(before) {
    const g = game;
    const fresh = g.log.slice(before.logN);
    const month = fresh.find((l) => l.key === "log.month");
    if (!month) return null;
    const chips = [];
    const d = month.p.d || {};
    const best = Object.keys(d).sort((a, b) => d[b] - d[a])[0];
    if (best && d[best] > 0) chips.push({ key: "sum.gain", p: { s: best, v: d[best].toFixed(1) }, tone: "good" });
    // Stress or health, whichever moved more (motivation if neither did).
    const moved = ["stress", "health", "motivation"].map((k) => ({ k, v: Math.round(g[k] - before[k]) })).filter((x) => x.v);
    moved.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    const cond = moved.find((x) => x.k !== "motivation") || moved[0];
    if (cond) chips.push({ key: "sum.stat", p: cond, tone: (cond.k === "stress" ? cond.v < 0 : cond.v > 0) ? "good" : "bad" });
    if (month.p.cost) chips.push({ key: "sum.spent", p: { a: month.p.cost }, tone: "cost" });
    else if (g.money > before.money) chips.push({ key: "sum.earned", p: { a: g.money - before.money }, tone: "good" });
    const rep = fresh.find((l) => l.key === "log.report");
    if (rep) chips.push({ key: "sum.rank", p: { r: rep.p.rank, of: rep.p.of }, tone: rep.p.rank <= 10 ? "good" : "info" });
    return { t: month.t, chips: chips.slice(0, 4) };
  }
  function renderTurnSum() {
    const s = turnSum && game && !game.ending ? turnSum : null;
    els.turnSum.classList.toggle("hidden", !s);
    if (!s) { els.turnSum.innerHTML = ""; return; }
    els.turnSum.innerHTML = '<h2 class="ts-title"><span aria-hidden="true">🧾 </span>' + esc(T("sum.title")) + ' <span class="muted">' + esc(L.dateShort(s.t)) + "</span></h2>" +
      '<div class="chips">' + (s.chips.length ? s.chips.map((c) => '<span class="chip ' + c.tone + '">' + esc(T(c.key, c.p)) + "</span>").join("") : '<span class="muted">' + esc(T("sum.none")) + "</span>") + "</div>";
  }

  // A calendar page flips between turns: how much time passed, the new date and your age.
  let turnTimer = 0;
  function showTurn(was) {
    if (calm()) return;
    const g = game;
    const examDay = g.queue.some((q) => q.type === "exam");
    els.turnCap.textContent = examDay ? T("turn.exam") : T(S.STATUSES[was].school ? "turn." + was : "turn.month");
    els.turnDate.textContent = L.date(g.year, examDay ? 11 : g.month);
    els.turnAge.textContent = T("turn.age", { a: L.age(g.age) });
    const t = els.turn;
    t.classList.remove("hidden", "play");
    void t.offsetWidth; // restart the CSS animation
    t.classList.add("play");
    clearTimeout(turnTimer);
    turnTimer = setTimeout(() => t.classList.add("hidden"), 1700);
    // An event card that opens with the turn would sit under the calendar page, half covered. Hold it
    // back until the page starts to fade (78% of 1.7s), so the two play in sequence.
    const m = els.modal;
    clearTimeout(holdTimer);
    if (!m.classList.contains("hidden")) {
      m.classList.add("held");
      holdTimer = setTimeout(() => m.classList.remove("held"), 1300);
    }
  }
  let holdTimer = 0;
  // Moving: every region with what it changes, why you can't go there, and the quotas it would bring.
  // The map's place names, translated (the art draws none of its own).
  function mapLabels() {
    const o = { seoul: T("map.seoul") };
    for (const r of S.REGIONS) o[r.id] = L.regionShort(r.id);
    return o;
  }
  // Moving: a map of Korea to pick a place on, a card with what moving there would change, and the same
  // places as a list for anyone who'd rather not tap dots.
  // The map in the main frame: home, where you could move right now, and the route of the last move
  // until the next turn. Tapping a place opens the move dialog on it.
  let mapKey = "", lastMove = null;
  // The school you go to now, as a star on the national map where it really is.
  function schoolStar(g) {
    const r = g.realSchool();
    return r ? [{ lat: r.lat, lon: r.lon }] : [];
  }
  function moveStates(g) {
    const o = {};
    for (const r of S.REGIONS) o[r.id] = r.id === g.region ? "home" : g.moveBlock(r.id) ? "closed" : "open";
    return o;
  }
  // Why no place is open right now (the most common reason), or null when somewhere is.
  function moveWhyAll(g) {
    const n = {};
    let open = false;
    for (const r of S.REGIONS) {
      if (r.id === g.region) continue;
      const why = g.moveBlock(r.id);
      if (!why) open = true; else n[why] = (n[why] || 0) + 1;
    }
    return open ? null : Object.keys(n).sort((a, b) => n[b] - n[a])[0] || "busy";
  }
  // The width a map will be drawn at, so art.js can keep its names at least 11px on screen.
  const MAP_W = 755, MAP_H = 750;
  function mapPx(w, h) { return Math.max(120, Math.min(w, h ? (h * MAP_W) / MAP_H : w)); }
  const mapLegendHtml = () => '<span><i class="lh"></i>' + esc(T("map.home")) + '</span><span><i class="lo"></i>' + esc(T("map.open")) + '</span><span><i class="lc"></i>' + esc(T("map.closed")) + "</span>";
  function renderMap() {
    const g = game;
    const states = moveStates(g);
    // While a screen is waiting ("busy") nothing is really closed: the map just can't be used yet.
    const whyRaw = g.ending ? null : moveWhyAll(g);
    const why = whyRaw === "busy" ? null : whyRaw;
    els.mapHome.textContent = "📍 " + L.region(g.region);
    // With nowhere open, say why instead of leaving every dot grey without a word.
    els.mapHint.textContent = g.ending ? "" : !why ? T("map.tapHint") : T("map.noMove");
    els.mapHint.title = why ? T("move." + why) : "";
    els.mapLegend.innerHTML = g.ending ? "" : mapLegendHtml();
    els.mapLegend.classList.toggle("dim", !!why);
    // On a phone the map folds into this chip; it opens the same move dialog.
    els.placeName.textContent = "📍 " + L.region(g.region);
    els.placeGo.textContent = g.ending ? "" : why ? T("place.noMove") : T("place.move");
    els.placeChip.classList.toggle("closed", !!why);
    els.placeChip.disabled = !!g.ending;
    // Redrawing restarts the pin's pulse, so only redraw when something on it changed (or its size did:
    // a phone's main map is folded away, so it isn't drawn at all).
    const box = els.mainMap;
    if (!box.clientWidth) { mapKey = ""; return; }
    const px = Math.round(mapPx(box.clientWidth - 8, box.clientHeight - 6) / 20) * 20;
    const route = lastMove && lastMove.to === g.region ? lastMove : null;
    const rs = g.realSchool();
    const key = JSON.stringify([states, route, lang, rs && rs.name, px]);
    if (key === mapKey) return;
    mapKey = key;
    els.mainMap.innerHTML = Art.koreaMap({ states, sel: route ? route.to : null, from: route ? route.from : null, home: g.region, schools: schoolStar(g), labels: mapLabels(), aria: T("map.aria", { reg: g.region }), px });
  }
  els.placeChip.addEventListener("click", () => openMove(null));
  els.mainMap.addEventListener("click", (e) => {
    const pt = e.target.closest("[data-place]");
    openMove(pt ? pt.dataset.place : null);
  });
  els.mainMap.addEventListener("keydown", (e) => {
    const pt = e.target.closest("[data-place]");
    if (pt && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openMove(pt.dataset.place); }
  });
  els.moveBtn.addEventListener("click", () => { closeMenu(); openMove(null); });
  function openMove(preselect) {
    const g = game;
    if (!g || g.ending || g.queue.length) return;
    dlg = { kind: "move", sel: preselect };
    const pick = { id: null };
    const info = {};
    const rows = S.REGIONS.map((r) => {
      const k = S.REGION_KINDS[r.kind];
      const here = r.id === g.region;
      const why = here ? null : g.moveBlock(r.id);
      const fx = T("move.fx", { hag: k.hagwon, tut: k.tutor, price: k.price, stress: k.stress });
      // The quotas need middle and high school in the region, so moving after grade 7 is too late.
      const inTime = g.inSchool() && g.grade <= 7;
      const quota = r.capital ? "" : g.dropout != null ? T("move.noQuota") : !inTime ? T("move.late") : r.kind === "rural" ? T("move.rural") : T("move.local", { nat: r.nat });
      // A short status pill on the right; the reason goes under the name so phones keep the name readable.
      const note = here ? T("move.here") : why ? T("move." + why) : "";
      const tag = here ? '<span class="chance ch-safe">' + esc(T("move.hereTag")) + "</span>" : why ? '<span class="chance ch-long">' + esc(T("move.noTag")) + "</span>" : "<span></span>";
      info[r.id] = { here, why, kind: L.regionKind(r.kind) + " · " + fx, quota, note };
      return '<label class="uni region' + (here || why ? " off" : "") + '"><input type="radio" name="moveTo" value="' + r.id + '"' + (here || why ? " disabled" : "") + ">" +
        '<span class="nm">' + esc(L.region(r.id)) + "<small>" + esc(L.regionKind(r.kind) + " · " + fx) + "</small>" + (quota ? "<small>" + esc(quota) + "</small>" : "") +
        (note ? "<small" + (why ? ' class="why"' : "") + ">" + esc(note) + "</small>" : "") + "</span>" + tag + "</label>";
    }).join("");
    // Leaving a private day school behind is worth a warning.
    const sch = g.inClass() ? g.schoolInfo() : null;
    const warn = sch && !sch.board && !/^pub/.test(sch.id) ? '<p class="muted">' + esc(T("move.school")) + "</p>" : "";
    const states = {};
    for (const r of S.REGIONS) states[r.id] = info[r.id].here ? "home" : info[r.id].why ? "closed" : "open";
    const legend = '<div class="map-legend">' + mapLegendHtml() + "</div>";
    // When nothing is open, say so (and why) before anything else.
    const whyAll = moveWhyAll(g);
    const closedNote = whyAll ? '<p class="note warn">' + esc(T("move.closedAll") + " " + T("move." + whyAll)) + "</p>" : "";
    openModal(T("move.title"), closedNote + "<p>" + esc(T("move.text")) + "</p>" + warn + legend + '<div class="map-wrap" id="moveMap"></div><div class="map-card" id="moveCard"></div>' +
      '<details class="map-list"><summary>' + esc(T("move.list")) + '</summary><div class="unis">' + rows + "</div></details>", [
      { label: T("move.stay"), cancel: true, run: closeDialog },
      { label: T("move.go"), primary: true, run: () => { if (!pick.id) return; dlg = null; lastMove = { from: g.region, to: pick.id }; g.move(pick.id); save(); render(); } },
    ], null, { optional: true });
    const go = els.modalButtons.querySelector("button.primary");
    const mapBox = $("moveMap"), card = $("moveCard");
    const px = Math.round(mapPx(els.modalBody.clientWidth, window.innerHeight * 0.62) / 20) * 20;
    // Any place can be looked at; only an open one can be moved to.
    const select = (id, refocus) => {
      const x = info[id];
      dlg.sel = id;
      pick.id = x && !x.here && !x.why ? id : null;
      go.disabled = !pick.id;
      mapBox.innerHTML = Art.koreaMap({ states, sel: id, from: pick.id ? g.region : null, home: g.region, schools: schoolStar(g), labels: mapLabels(), aria: T("map.aria", { reg: g.region }), px });
      card.innerHTML = id ? "<b>" + esc(L.region(id)) + "</b><small>" + esc(x.kind) + "</small>" + (x.quota ? "<small>" + esc(x.quota) + "</small>" : "") +
        (x.note ? "<small" + (x.why ? ' class="why"' : "") + ">" + esc(x.note) + "</small>" : "") : esc(T("move.pick"));
      for (const inp of els.modalBody.querySelectorAll("input[name=moveTo]")) inp.checked = inp.value === pick.id;
      if (refocus) { const pt = mapBox.querySelector('[data-place="' + id + '"]'); if (pt) pt.focus({ preventScroll: true }); }
    };
    select(preselect && info[preselect] ? preselect : null);
    mapBox.addEventListener("click", (e) => { const pt = e.target.closest("[data-place]"); if (pt) select(pt.dataset.place, true); });
    mapBox.addEventListener("keydown", (e) => {
      const pt = e.target.closest("[data-place]");
      if (pt && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(pt.dataset.place, true); }
    });
    for (const inp of els.modalBody.querySelectorAll("input[name=moveTo]")) inp.addEventListener("change", () => select(inp.value));
  }

  // Leaving school: what it gives and what it takes, then a confirmation. Staying is the primary,
  // safe answer; leaving can't be undone, so it's drawn as a danger button.
  function openQuit() {
    const g = game;
    if (!g || g.quitBlock() || g.queue.length) return;
    dlg = { kind: "quit" };
    const list = (k) => "<ul>" + T(k).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
    openModal(T("quit.title"), "<p>" + esc(T("quit.text")) + '</p><div class="quit"><div class="pros"><h3>' + esc(T("quit.pros")) + "</h3>" + list("quit.pro") +
      '</div><div class="cons"><h3>' + esc(T("quit.cons")) + "</h3>" + list("quit.con") + "</div></div>", [
      { label: T("quit.go"), danger: true, run: () => { dlg = null; g.quitSchool(); save(); render(); } },
      { label: T("quit.stay"), primary: true, cancel: true, run: closeDialog },
    ], Art.eventArt(artCtx({ id: "dropout", stage: "dropout", tone: S.promptTone("dropout") })), { optional: true });
  }
  els.quitBtn.addEventListener("click", () => { closeMenu(); openQuit(); });

  // Confirmation lives in the page's own modal: embedded viewers block confirm() dialogs.
  function startOver() { dlg = null; ui = {}; turnSum = null; store.del(SAVE_KEY); game = null; showSetup(); }
  function openNewLife() {
    if (!game || game.ending) return startOver();
    dlg = { kind: "newLife" };
    openModal(T("newLife.title"), "<p>" + esc(T("newLife.text")) + "</p>", [
      { label: T("newLife.keep"), cancel: true, run: closeDialog },
      { label: T("newLife.go"), primary: true, run: startOver },
    ], null, { optional: true });
  }
  els.newLifeBtn.addEventListener("click", () => { closeMenu(); openNewLife(); });

  // ---------- the Life choices menu ----------
  // Moving, leaving school and starting over: rare, big decisions, kept away from Next.
  function closeMenu(refocus) {
    if (els.lifeMenu.classList.contains("hidden")) return;
    els.lifeMenu.classList.add("hidden");
    els.lifeBtn.setAttribute("aria-expanded", "false");
    if (refocus) els.lifeBtn.focus({ preventScroll: true });
  }
  els.lifeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = els.lifeMenu.classList.contains("hidden");
    if (!open) return closeMenu();
    els.lifeMenu.classList.remove("hidden");
    els.lifeBtn.setAttribute("aria-expanded", "true");
    const first = els.lifeMenu.querySelector("button:not(.hidden):not(:disabled)");
    if (first) first.focus({ preventScroll: true });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu-wrap")) closeMenu(); });
  els.lifeMenu.addEventListener("keydown", (e) => {
    const items = Array.from(els.lifeMenu.querySelectorAll("button:not(.hidden):not(:disabled)"));
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); closeMenu(true); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = items.length; if (n) items[(i + (e.key === "ArrowDown" ? 1 : n - 1)) % n].focus(); }
    else if (e.key === "Tab") closeMenu();
  });

  // The life log reads like a diary: newest first, a heading for each school year (March to February)
  // with your age, and an icon for each kind of entry.
  const LOG_ICON = {
    "log.born": "👶", "log.stage": "🏫", "log.grade": "🎒", "log.teacher": "🍎", "log.report": "📊", "log.sebae": "🧧", "log.track": "🔀",
    "log.birthday": "🎂", "log.dropout": "🚪", "log.ged": "📜", "log.early": "⏩", "log.school": "🏫", "log.schoolMove": "🏫",
    "log.homeroom": "🧑‍🏫", "log.soc.class": "👋", "log.soc.best": "🤞", "log.soc.drift": "🍂", "log.soc.partner": "💕", "log.soc.ex": "💔",
    "log.month": "🗓️", "log.mock": "📝", "log.naesin": "📋", "log.field": "🧭", "log.susiApply": "📨", "log.susiSkip": "📨", "log.susiStage": "📬", "log.susiResult": "📬", "log.suneung": "🎯", "log.apply": "📮", "log.enroll": "🎓", "log.quit": "🚪", "log.halfpay": "💸", "log.newyear": "🌱",
  };
  function logIcon(l) {
    if (l.key === "log.event" && l.p) return Art.iconFor(l.p.id);
    return LOG_ICON[l.key] || "•";
  }
  function renderLog() {
    const g = game;
    const items = g.log.slice(-250).reverse();
    let html = "", lastYear = null;
    for (const l of items) {
      const [y, m] = l.t.split("-").map(Number);
      const sy = m < 3 ? y - 1 : y; // the school year starts in March, and so does each birthday here
      if (sy !== lastYear) {
        lastYear = sy;
        html += '<li class="year"><span>' + esc(T("diary.year", { y: sy, a: L.age(6 + sy - g.startYear) })) + "</span></li>";
      }
      html += '<li class="' + esc(l.kind || "note") + '"><span class="dot" aria-hidden="true">' + logIcon(l) + '</span><span class="txt">' + esc(T(l.key, l.p)) +
        '</span><span class="when">' + esc(L.dateShort(l.t)) + "</span></li>";
    }
    els.log.innerHTML = html;
  }

  function cell(r) {
    return gradeChip(r.grade) + (r.std != null ? ' <span class="muted">' + r.std + "</span>" : "");
  }
  function renderHistory() {
    const g = game;
    // Every 수능, plus the mocks since the last one (grade 10–11 mocks stay until the first 수능).
    const rows = g.history.concat(g.mocks.filter((m) => m.attempt === g.attempt && g.history.every((h) => h.attempt !== g.attempt)));
    if (!rows.length) {
      els.history.innerHTML = '<tr><td class="muted empty">' + esc(T("history.empty")) + "</td></tr>";
      return;
    }
    els.history.innerHTML = "<thead><tr><th>" + esc(T("history.exam")) + "</th>" + SUBJECTS.map((s) => "<th>" + esc(L.subShort(s)) + "</th>").join("") +
      "<th>" + esc(T("history.total")) + "</th></tr></thead><tbody>" +
      rows.map((r) => {
        const label = r.kind === "suneung" ? "<b>" + esc(T("history.suneung", { y: r.year + 1 })) + "</b>" : esc(T("history.mock", { m: L.month(r.month) }));
        const who = r.school && r.school < 12 ? L.schoolGrade(r.school) : L.att(r.attempt);
        return '<tr><td class="l">' + label + '<br><span class="muted">' + esc(who) + "</span></td>" +
          SUBJECTS.map((s) => "<td>" + cell(r.subjects[s]) + "</td>").join("") + "<td><b>" + r.total + "</b></td></tr>";
      }).join("") + "</tbody>";
  }

  // ---------- chart ----------
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    const c = { grid: v("--grid"), muted: v("--muted"), text: v("--text"), border: v("--border") };
    for (const s of SUBJECTS) c[s] = v(subColor[s]);
    return c;
  }
  function drawChart() {
    const g = game;
    const cv = els.chart;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    els.legend.innerHTML = SUBJECTS.map((s) => '<span><span class="dot" style="background:var(' + subColor[s] + ')"></span>' + esc(L.subShort(s)) + "</span>").join("");
    // The picture as words, for screen readers: where each subject stands now.
    const lastP = g.trace[g.trace.length - 1];
    cv.setAttribute("aria-label", T("chart.aria", { list: SUBJECTS.map((s) => L.sub(s) + " " + S.skillScore(lastP.skills[s])).join(", ") }));
    if (!w || !h) return;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const c2 = cv.getContext("2d");
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, w, h);
    const col = readColors();

    const tr = g.trace;
    const padL = 30, padR = 10, padT = 10, padB = 22;
    const iw = w - padL - padR, ih = h - padT - padB;
    let lo = 100, hi = 0;
    for (const p of tr) for (const s of SUBJECTS) { const v = S.skillScore(p.skills[s]); if (v < lo) lo = v; if (v > hi) hi = v; }
    lo = Math.max(0, Math.floor((lo - 5) / 10) * 10);
    hi = Math.min(100, Math.ceil((hi + 5) / 10) * 10);
    const n = Math.max(tr.length - 1, 8);
    const x = (i) => padL + (iw * i) / n;
    const y = (v) => padT + ih * (1 - (v - lo) / (hi - lo || 1));

    c2.font = "11px system-ui, sans-serif";
    c2.lineWidth = 1;
    for (let v = lo; v <= hi; v += 10) {
      c2.strokeStyle = col.grid;
      c2.beginPath(); c2.moveTo(padL, y(v)); c2.lineTo(w - padR, y(v)); c2.stroke();
      c2.fillStyle = col.muted;
      c2.textAlign = "right"; c2.textBaseline = "middle";
      c2.fillText(String(v), padL - 6, y(v));
    }
    c2.setLineDash([4, 4]);
    c2.textAlign = "left"; c2.textBaseline = "alphabetic";
    // A dashed line where each school stage and each attempt starts.
    for (let i = 0; i < tr.length; i++) {
      if (i === 0 || tr[i - 1].ph !== tr[i].ph) {
        c2.strokeStyle = col.border;
        c2.beginPath(); c2.moveTo(x(i), padT); c2.lineTo(x(i), h - padB); c2.stroke();
        c2.fillStyle = col.muted;
        // A stage label that would run off the right edge is drawn leftwards from its line instead.
        const lbl = L.phase(tr[i].ph), lw = c2.measureText(lbl).width;
        if (x(i) + 4 + lw > w - 2) { c2.textAlign = "right"; c2.fillText(lbl, Math.min(x(i) - 4, w - 2), h - 6); c2.textAlign = "left"; }
        else c2.fillText(lbl, x(i) + 4, h - 6);
      }
    }
    c2.setLineDash([]);
    c2.lineWidth = 2;
    for (const s of SUBJECTS) {
      c2.strokeStyle = col[s];
      c2.beginPath();
      tr.forEach((p, i) => { const yy = y(S.skillScore(p.skills[s])); if (i) c2.lineTo(x(i), yy); else c2.moveTo(x(i), yy); });
      c2.stroke();
    }
  }
  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => game && drawChart(), 100); });
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", () => game && drawChart());
  }

  // ---------- modal: whatever the engine queued ----------
  // Dialogs are real dialogs: the page behind is inert, Tab stays inside, focus returns to where it
  // was on close, and Escape answers an optional dialog (Move, Leave school, New life, the panels)
  // with its cancel button. Screens the engine queued can't be escaped: they need an answer.
  //
  // What a dialog holds lives outside the DOM so a redraw (a language switch) brings it back as it
  // was: `dlg` names the optional dialog that's open, and `ui` keeps the picks on queued screens,
  // keyed to the screen so a new screen starts fresh.
  let dlg = null;
  let ui = {};
  function uiFor(name, init) {
    const key = game.clock + ":" + game.queue.length + ":" + name;
    if (!ui[name] || ui[name].key !== key) ui[name] = Object.assign({ key }, init());
    return ui[name];
  }
  let modalOpts = {}, lastFocus = null;
  // art: an illustration from art.js shown above the title, or nothing. buttons: { label, run,
  // primary, danger, cancel }. opts.optional: Escape runs the cancel button.
  function openModal(title, body, buttons, art, opts) {
    const wasOpen = !els.modal.classList.contains("hidden");
    // A redraw (language switch) keeps the scroll position and skips the pop-in.
    const same = wasOpen && redrawing;
    const keepScroll = els.modal.firstElementChild.scrollTop;
    if (!wasOpen) lastFocus = document.activeElement;
    modalOpts = opts || {};
    els.modalArt.innerHTML = art || "";
    els.modalArt.classList.toggle("hidden", !art);
    els.modal.classList.toggle("has-art", !!art);
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = body;
    els.modalButtons.innerHTML = "";
    for (const b of buttons || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.className = b.primary ? "primary" : b.danger ? "danger" : "";
      if (b.cancel) btn.dataset.cancel = "1";
      btn.addEventListener("click", b.run);
      els.modalButtons.appendChild(btn);
    }
    els.modal.classList.remove("hidden");
    syncInert();
    // Each new screen pops in, even when the modal was already open (not when it's only redrawn).
    const card = els.modal.firstElementChild;
    if (!same) {
      card.scrollTop = 0;
      card.classList.remove("pop");
      void card.offsetWidth;
      card.classList.add("pop");
    } else card.scrollTop = keepScroll;
    const first = els.modal.querySelector("#modalButtons button.primary, .choices button, .decide button, #modalButtons button, #modalBody button, #modalBody input");
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() {
    if (els.modal.classList.contains("hidden")) return;
    els.modal.classList.add("hidden");
    modalOpts = {};
    syncInert();
    // Back to where the player was, or the plan's Next button if that's gone.
    const back = lastFocus && lastFocus.isConnected && lastFocus.offsetParent !== null && !lastFocus.closest("#modal") ? lastFocus : null;
    lastFocus = null;
    if (back) back.focus({ preventScroll: true });
    else if (!els.game.classList.contains("hidden") && !els.nextBtn.disabled) els.nextBtn.focus({ preventScroll: true });
  }
  // An optional dialog's cancel: forget it, and redraw (which closes the modal).
  function closeDialog() {
    dlg = null;
    if (game && !els.game.classList.contains("hidden")) render();
    else closeModal();
  }
  // Reopen the optional dialog that was showing, after a redraw.
  function reopenDlg() {
    const d = dlg;
    if (!d) return false;
    if (d.kind === "move") openMove(d.sel);
    else if (d.kind === "quit") openQuit();
    else if (d.kind === "newLife") openNewLife();
    else if (d.kind === "ach") openAch();
    else if (d.kind === "lives") openLives();
    else if (d.kind === "replay") askReplay(d.e);
    else return false;
    return !els.modal.classList.contains("hidden");
  }
  function after() { save(); unlock(game); render(); }

  // Only one layer takes input at a time: the cutscene, else the dialog, else the page.
  function syncInert() {
    const top = cut ? "cut" : !els.modal.classList.contains("hidden") ? "modal" : null;
    for (const el of [els.header, els.setup, els.game]) el.inert = !!top;
    els.modal.inert = top === "cut";
    document.body.classList.toggle("modal-open", top === "modal");
    if (top) hideCoach();
  }
  // Tab and Shift+Tab cycle inside the open layer; Escape cancels an optional dialog.
  document.addEventListener("keydown", (e) => {
    const root = cut ? els.cut : !els.modal.classList.contains("hidden") ? els.modal : null;
    if (!root) return;
    if (e.key === "Tab") {
      const f = Array.from(root.querySelectorAll("button, [href], input, select, textarea, summary, [tabindex]:not([tabindex='-1'])"))
        .filter((el) => !el.disabled && el.offsetParent !== null && !el.closest(".hidden"));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    } else if (e.key === "Escape" && root === els.modal && modalOpts.optional) {
      const c = els.modalButtons.querySelector("button[data-cancel]");
      if (c) { e.preventDefault(); c.click(); }
    }
  });

  function renderModal() {
    const g = game;
    // A milestone plays its cutscene first; the screen it belongs to opens when the film ends.
    if (cut) return;
    const c = cutsOn ? pendingCut() : null;
    if (c) {
      g.seenCuts.push(c.id);
      save();
      playCut(c);
      return;
    }
    if (outcome) {
      // The outcome keeps the event's picture, redrawn with how things turned out.
      // v6.5: tone (from the engine's outcome) sets the picture's light and faces; undefined (an old save) lets the art decide.
      const art = outcome.id ? Art.eventArt(artCtx({ id: outcome.id, variant: outcome.variant, people: outcome.people, tone: outcome.tone })) : outcome.art ? Art.screenArt(outcome.art, artCtx({ stage: "uni" })) : "";
      openModal(outcome.title, '<div class="outcome">' + esc(T(outcome.msg.key, outcome.msg.p)) + "</div>",
        [{ label: T("continue"), primary: true, run: () => { outcome = null; after(); } }], art);
      return;
    }
    const top = g.queue[0];
    if (!top) {
      if (g.ending && !g.endingSeen) return showEnding();
      if (dlg && reopenDlg()) return;
      closeModal();
      return;
    }
    // A queued screen takes over from an optional dialog.
    dlg = null;
    if (top.type === "birth") return showBirth();
    if (top.type === "track") return showTrack();
    if (top.type === "school") return showSchool(top);
    if (top.type === "event") return showEvent(top);
    if (top.type === "mock") return showMock(top);
    if (top.type === "exam") return examStep === 0 ? showExamDay(top) : showReport(top);
    if (top.type === "naesin") return showNaesin(top);
    if (top.type === "susi") return showSusi(top);
    if (top.type === "susiStage") return showSusiStage(top);
    if (top.type === "susiResult") return showSusiResult(top);
    if (top.type === "apply") return showApply(top);
    if (top.type === "offers") return showOffers(top);
    if (top.type === "epi") return showEpi(top);
    closeModal();
  }

  // At birth, ability is near 0 everywhere (it's on the Suneung scale), so the talents a baby shows
  // are its aptitudes: how fast each subject will come. The bar runs from the slowest aptitude a child
  // can be dealt (×0.6) to the fastest (×1.7), and the number is the multiplier itself.
  function talentBars(g) {
    return '<div class="talent">' + SUBJECTS.map((s) => {
      const apt = g.aptitude[s];
      const w = Math.round(Math.max(4, Math.min(100, ((apt - 0.6) / 1.1) * 100)));
      return '<div class="bar"><span class="name"><span class="bi" aria-hidden="true">' + actIcon(s) + "</span>" + esc(L.sub(s)) + '</span><span class="track"><span class="fill" style="width:' + w +
        "%;background:var(" + subColor[s] + ')"></span></span><span class="val" title="' + esc(aptTime(apt)) + '">×' + apt.toFixed(2) + "</span>" + aptBadge(apt) + "</div>";
    }).join("") + "</div>";
  }
  function bornStates(g) {
    const o = {};
    for (const r of S.REGIONS) o[r.id] = r.id === g.region ? "home" : "closed";
    return o;
  }
  function showBirth() {
    const g = game;
    openModal(T("birth.title"),
      "<p>" + esc(T("birth.text", { name: g.name, fam: g.family, inc: FAMILIES[g.family].income, a: g.allowance(), sex: g.sex, reg: g.region }) +
        ((g.parents || "both") !== "both" ? " " + T("birth.parents", { par: g.parents }) : "") + (g.jobs ? " " + T("birth.jobs", g.jobs) : "")) + "</p>" +
      // Where on the peninsula the family starts.
      "<h3>" + esc(T("map.born")) + '</h3><div class="map-wrap">' + Art.koreaMap({ states: bornStates(g), static: true, home: g.region, labels: mapLabels(), aria: T("map.aria", { reg: g.region }), px: modalMapPx() }) + "</div>" +
      "<h3>" + esc(T("birth.talent")) + "</h3>" + talentBars(g) + '<p class="muted">' + esc(T("birth.note")) + "</p>",
      [{ label: T("birth.go"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("birth", artCtx({ stage: "baby", tone: 1 })));
  }
  // The width a map in the modal will get (the card is at most 620px wide, 22px padding a side).
  function modalMapPx() {
    const w = Math.min(window.innerWidth - 32, 620) - 44;
    return Math.round(mapPx(w, window.innerHeight * 0.62) / 20) * 20;
  }
  // Picking a school: every option for the stage with what it does, what it costs, the chance of
  // getting in, and why it's closed. The default public school is always open.
  function showSchool(top) {
    const g = game;
    const opts = g.schoolOptions();
    const pick = uiFor("school", () => ({ id: opts.find((o) => o.def).id }));
    if (!opts.some((o) => o.id === pick.id && !o.blocked)) pick.id = opts.find((o) => o.def).id;
    const desc = T("school.desc");
    // Options with a real school get a number, shared by the row and its marker on the area map.
    let n = 0;
    for (const o of opts) if (o.real) o.n = ++n;
    const rows = opts.map((o) => {
      const why = o.blocked ? T("school.no." + (o.blocked === "admit" && o.id === "artsHigh" ? "arts" : o.blocked), { sex: g.sex }) : "";
      const cls = o.def ? "ch-safe" : o.blocked ? "ch-long" : o.p >= 0.55 ? "ch-match" : o.p >= 0.25 ? "ch-reach" : "ch-long";
      const tag = '<span class="chance ' + cls + '" title="' + esc(T("school.chance", { p: o.p, def: o.def })) + '">' + esc(o.def ? T("school.tag.def") : o.blocked ? T("school.tag.no") : Math.round(o.p * 100) + "%") + "</span>";
      const facts = [T("school.fee", { fee: o.fee, income: o.income }), o.track ? T("school.track", { t: o.track }) : ""].filter(Boolean).join(" · ");
      // A special school is the nearest one in the country, which can be a long way from home.
      const where = o.real ? (o.real.city && o.real.km >= 15 ? T("school.realFar", { city: o.real.city, km: o.real.km }) : T("school.realHere")) : "";
      const real = o.real ? '<small class="real"><b class="num">' + o.n + "</b> " + esc(L.realSchool(o.real.name)) + " · " + esc(where) + "</small>" : "";
      return '<label class="uni region' + (o.blocked ? " off" : "") + '"><input type="radio" name="schoolPick" value="' + o.id + '"' + (o.blocked ? " disabled" : "") + (o.id === pick.id ? " checked" : "") + ">" +
        '<span class="nm">' + esc(L.school(o.id)) + real + "<small>" + esc(desc[o.id]) + "</small><small>" + esc(facts) + "</small>" +
        (why ? '<small class="why">' + esc(why) + "</small>" : "") + "</span>" + tag + "</label>";
    }).join("");
    const t = T("school.title"), x = T("school.text");
    const drawMap = () => Art.koreaMap({ focus: g.region, home: g.region, aria: T("school.mapTitle"),
      schools: opts.filter((o) => o.real).map((o) => ({ lat: o.real.lat, lon: o.real.lon, n: o.n, id: o.blocked ? null : o.id, cls: (o.blocked ? "closed" : o.def ? "def" : "") + (o.id === pick.id ? " sel" : "") })) });
    const map = n && Art.areaBox && Art.areaBox(g.region) ? '<figure class="school-map"><div id="schoolMap">' + drawMap() + "</div><figcaption>" + esc(T("school.mapTitle")) + "</figcaption></figure>" : "";
    openModal(t[top.stage], "<p>" + esc(x[top.stage]) + "</p>" + map + '<div class="unis">' + rows + "</div>", [
      { label: T("school.go"), primary: true, run: () => {
        const msg = game.pickSchool(pick.id);
        const v = msg.key.split(".").pop();
        outcome = { title: t[top.stage], msg, id: "school", variant: v, tone: v === "in" ? 1 : v === "out" ? -1 : 0 };
        after();
      } },
    ], Art.eventArt(artCtx({ id: "school", stage: top.stage })));
    const box = $("schoolMap");
    const choose = (id) => {
      pick.id = id;
      for (const inp of els.modalBody.querySelectorAll("input[name=schoolPick]")) inp.checked = inp.value === id;
      if (box) box.innerHTML = drawMap();
    };
    for (const inp of els.modalBody.querySelectorAll("input[name=schoolPick]")) inp.addEventListener("change", () => choose(inp.value));
    // Tapping an open school's marker picks it, the same as its row.
    if (box) box.addEventListener("click", (e) => { const m = e.target.closest("[data-pick]"); if (m) choose(m.dataset.pick); });
  }

  function showTrack() {
    const g = game;
    // Science and foreign-language high schools only teach one track.
    const only = g.dropout == null ? g.schoolInfo().track : null;
    // The pick survives a redraw: track and the two inquiry subjects.
    const st = uiFor("track", () => ({ track: only || (g.skills.math + g.skills.inq2 > g.skills.kor + g.skills.inq1 ? "sci" : "soc"), a: null, b: null }));
    let track = only || st.track;
    openModal(T("track.title"),
      "<p>" + esc(T("track.text")) + "</p>" +
      '<div class="seg track-seg" id="trackSeg"><button type="button" data-v="soc"><span aria-hidden="true">🌏 </span>' + esc(L.track("soc")) +
      '</button><button type="button" data-v="sci"><span aria-hidden="true">🔬 </span>' + esc(L.track("sci")) + "</button></div>" +
      '<small class="muted" id="trackNote"></small>' +
      // Humanities closes medical school for good, so say so loudly while it's selected.
      '<p class="cond-note hidden" id="trackWarn" role="alert"></p>' +
      '<div class="field"><div class="two"><select id="inqA" aria-label="' + esc(L.subShort("inq1")) + '"></select><select id="inqB" aria-label="' + esc(L.subShort("inq2")) + '"></select></div>' +
      "<small>" + esc(T("track.inqNote")) + "</small></div>",
      [{ label: T("track.go"), primary: true, run: () => { game.chooseTrack(track, [$("inqA").value, $("inqB").value]); plan = {}; after(); } }],
      Art.screenArt("track", artCtx()));
    const seg = $("trackSeg"), a = $("inqA"), b = $("inqB");
    const fill = () => {
      for (const btn of seg.querySelectorAll("button")) { btn.classList.toggle("on", btn.dataset.v === track); btn.disabled = !!only && btn.dataset.v !== only; }
      $("trackNote").textContent = (only ? T("track.forced", { t: only }) + " " : "") + T("track.note." + track);
      $("trackWarn").textContent = track === "soc" ? T("track.warnSoc") : "";
      $("trackWarn").classList.toggle("hidden", track !== "soc");
      els.modalButtons.querySelector("button.primary").textContent = T(track === "soc" ? "track.goSoc" : "track.go");
      const opts = INQUIRY[track].map((x) => '<option value="' + x.id + '">' + esc(L.inq(x.id)) + "</option>").join("");
      a.innerHTML = opts; b.innerHTML = opts;
      const ids = INQUIRY[track].map((x) => x.id);
      a.value = ids.indexOf(st.a) >= 0 ? st.a : ids[0];
      b.value = ids.indexOf(st.b) >= 0 && st.b !== a.value ? st.b : ids.find((id) => id !== a.value);
      st.a = a.value; st.b = b.value;
      for (const btn of seg.querySelectorAll("button")) btn.setAttribute("aria-pressed", btn.dataset.v === track ? "true" : "false");
    };
    seg.addEventListener("click", (e) => { const btn = e.target.closest("button[data-v]"); if (btn && !btn.disabled) { track = st.track = btn.dataset.v; st.a = st.b = null; fill(); } });
    // The two inquiry subjects must differ.
    const fix = (changed, other) => { if (changed.value === other.value) other.value = INQUIRY[track].map((x) => x.id).find((id) => id !== changed.value); st.a = a.value; st.b = b.value; };
    a.addEventListener("change", () => fix(a, b));
    b.addEventListener("change", () => fix(b, a));
    fill();
  }

  // The people an event names (p.a, p.b), as the art draws them: their seeded looks.
  function peopleArt(q) {
    if (!q || !game.social) return [];
    return [q.a, q.b].map((r) => r && game.person(r.id)).filter(Boolean).map((p) => ({ lk: p.lk, x: p.x }));
  }
  function eventTitle(ev) {
    if (ev.id === "eve" || ev.id === "lunch") return T("ev." + ev.id + ".title");
    if (game.isEarly()) return T("turn.age", { a: L.age(game.age) }) + " · " + L.date(game.year, game.month);
    return game.inSchool() && !game.dropoutActive() ? L.schoolGrade(game.grade) + " · " + L.date(game.year, game.month) : L.date(game.year, game.month);
  }
  // The suffix of an outcome key ("ev.bully.r1a" → "r1a") picks the art's variant.
  const variantOf = (msg) => (msg && msg.key ? msg.key.split(".").pop() : "");
  function showEvent(ev) {
    const title = eventTitle(ev);
    const people = peopleArt(ev.p);
    if (!ev.choices) {
      openModal(title, '<p class="story">' + esc(T(ev.result.key, ev.result.p)) + "</p>", [{ label: T("ok"), primary: true, run: () => { game.dismiss(); after(); } }],
        Art.eventArt(artCtx({ id: ev.id, variant: variantOf(ev.result), people, tone: ev.result.tone })));
      return;
    }
    openModal(title, '<p class="story">' + esc(T("ev." + ev.id + ".text", ev.p)) + '</p><div class="choices"></div>', [], Art.eventArt(artCtx({ id: ev.id, people, tone: S.promptTone(ev.id) })));
    const box = els.modalBody.querySelector(".choices");
    T("ev." + ev.id + ".c", ev.p).forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="cn" aria-hidden="true">' + (i + 1) + "</span>" + esc(label);
      b.addEventListener("click", () => {
        const msg = game.choose(i);
        outcome = { title, msg, id: ev.id, variant: variantOf(msg), people, tone: msg.tone };
        after();
      });
      box.appendChild(b);
    });
    box.querySelector("button").focus({ preventScroll: true });
  }

  // Score tables reveal row by row (CSS staggers them with --i).
  function reportTable(res) {
    const h = T("report.h");
    const rows = SUBJECTS.map((k, i) => {
      const r = res.subjects[k];
      const absolute = k === "eng" || k === "hist";
      return '<tr style="--i:' + i + '"><td class="l"><span aria-hidden="true">' + actIcon(k) + " </span>" + esc(T("report.subject", { s: k, el: L.elective(k) })) + "</td><td>" + r.raw + '<span class="muted">/' + r.max + "</span></td>" +
        "<td>" + (absolute ? "—" : r.std) + "</td><td>" + (absolute ? "—" : r.pct) + "</td>" +
        "<td>" + gradeChip(r.grade) + '</td><td class="muted">' + (absolute ? (k === "eng" ? 90 : 40) : r.cut1) + "</td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="grid reveal"><thead><tr>' + h.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function showMock(top) {
    const r = top.result;
    // v6.7: an unusually hard or easy paper gets a headline, against your previous mock (found by its
    // sitting, since a reloaded save holds copies, not the same objects).
    const at = game.mocks.findIndex((x) => x.year === r.year && x.month === r.month && x.attempt === r.attempt);
    const head = S.mockHeadline(r, at > 0 ? game.mocks[at - 1] : null);
    openModal(T("mock.title", { name: L.mock(r.month, r.school) }),
      (head ? '<p class="headline news"><span aria-hidden="true">📰 </span>' + esc(T("mock.head." + head.key, head)) + (head.a != null ? " " + esc(T("mock.head.you", head)) : "") + "</p>" : "") +
      "<p>" + esc(T("mock.text")) + "</p>" + reportTable(r) +
      '<p class="muted" style="margin-top:10px">' + esc(T("mock.total", { n: r.total })) + "</p>",
      [{ label: T("mock.back"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("mock", artCtx({ tone: game.screenTone(top) })));
  }

  const PERIODS = [
    { k: "kor", time: "08:40", n: 1 },
    { k: "math", time: "10:30", n: 2 },
    { k: "eng", time: "13:10", n: 3 },
    { k: "hist", time: "14:50", n: 4 },
    { k: "inq1", time: "15:35", n: 4 },
    { k: "inq2", time: "16:07", n: 4 },
  ];
  // Exam day plays out period by period: each row arrives in turn and its score lands a beat later,
  // so the tension builds. CSS does the timing; the button works at any point.
  function showExamDay(top) {
    const r = top.result;
    const items = PERIODS.map((p, i) => {
      const x = r.subjects[p.k];
      const vibe = T("exam.vibe." + p.k)[x.grade <= 2 ? 0 : x.grade <= 4 ? 1 : 2];
      const feel = x.grade <= 2 ? "good" : x.grade <= 4 ? "mid" : "bad";
      return '<li class="' + feel + '" style="--i:' + i + '"><span class="tm"><span aria-hidden="true">🕘 </span>' + p.time + "</span><span><b>" + esc(T("exam.period", { n: p.n, s: p.k })) + "</b><br>" + esc(vibe) +
        '</span><span class="rw">' + x.raw + '<span class="muted">/' + x.max + "</span></span></li>";
    }).join("");
    openModal(T("exam.title", { y: r.year + 1 }),
      "<p>" + esc(T("exam.intro", { y: r.year })) + "</p>" +
      '<ul class="periods">' + items + '</ul><p class="muted exam-outro">' + esc(T("exam.outro")) + "</p>",
      [{ label: T("exam.next"), primary: true, run: () => { examStep = 1; render(); } }],
      Art.screenArt("exam", artCtx({ stage: game.status, tone: game.screenTone(top) })));
  }
  // Counts a number up from zero, for the score report's big totals.
  function countUp(el, to, decimals) {
    if (!el) return;
    if (calm()) { el.textContent = to.toFixed(decimals || 0); return; }
    const t0 = performance.now(), dur = 1200;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(decimals || 0);
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function showReport(top) {
    const r = top.result;
    const score = S.admissionScore(r);
    const prev = game.history.length > 1 ? game.history[game.history.length - 2] : null;
    let cmp = "";
    if (prev) {
      const d = r.total - prev.total;
      cmp = '<span class="' + (d >= 0 ? "up" : "down") + '">' + esc(T("report.vs", { d: (d >= 0 ? "+" : "") + d })) + "</span>";
    }
    openModal(T("report.title"),
      '<p class="headline news"><span aria-hidden="true">📰 </span>' + esc(T("report.headline." + r.headline.key, { s: r.headline.s })) + "</p>" + '<div class="paper">' + reportTable(r) +
      '<div class="summary"><div><span class="k">' + esc(T("report.total")) + '</span><span class="v" id="cTotal">' + r.total + "</span> " + cmp +
      '</div><div><span class="k">' + esc(T("report.score")) + '</span><span class="v" id="cScore">' + score.toFixed(1) +
      '</span></div><div><span class="k">' + esc(T("report.attempt")) + '</span><span class="v">' + esc(L.att(r.attempt)) + "</span></div></div></div>" +
      '<p class="muted">' + esc(T("report.explain")) + "</p>",
      [{ label: T("report.apply"), primary: true, run: () => { examStep = 0; game.dismiss(); after(); } }],
      Art.screenArt("report", artCtx({ tone: game.screenTone(top) })));
    countUp($("cTotal"), r.total, 0);
    countUp($("cScore"), score, 1);
  }

  // ---------- 내신 report cards and 수시 (v6.0) ----------
  const naesinChip = (g) => '<span class="gr gr5-' + g + '">' + g + "</span>";
  const NAESIN_ORDER = ["kor", "math", "eng", "hist", "inq1", "inq2"];
  function showNaesin(top) {
    const g = game;
    const r = top.result;
    const subs = NAESIN_ORDER.filter((s) => r.s[s]);
    const h = T("naesin.h").concat(top.sem ? [T("naesin.hSem")] : []);
    const rows = subs.map((s, i) => {
      const x = r.s[s];
      return '<tr style="--i:' + i + '"><td class="l"><span aria-hidden="true">' + actIcon(s) + " </span>" + esc(L.sub(s)) + "</td><td>" + x.raw + '</td><td><span class="ach ach-' + x.ach + '">' + x.ach + "</span></td><td>" + naesinChip(x.g) + "</td>" +
        (top.sem ? "<td>" + naesinChip(top.sem.g[s]) + "</td>" : "") + "</tr>";
    }).join("");
    const tile = (k, v) => '<div><span class="k">' + esc(T(k)) + '</span><span class="v">' + esc(v) + "</span></div>";
    const strong = ["autoHigh", "sciHigh", "langHigh"].indexOf(g.schoolInfo().id) >= 0;
    openModal(T("naesin.title", r),
      "<p>" + esc(T("naesin.text")) + '</p><div class="paper"><div class="table-wrap"><table class="grid reveal naesin"><thead><tr>' + h.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<div class="summary">' + tile("naesin.avg", r.avg.toFixed(2)) + (top.sem ? tile("naesin.semAvg", top.sem.avg.toFixed(2)) : "") + tile("naesin.run", top.run != null ? top.run.toFixed(2) : "—") + "</div></div>" +
      (r.prep >= 0.02 ? '<p class="muted">' + esc(T("naesin.prep", { b: r.prep })) + "</p>" : "") + (strong ? '<p class="muted">' + esc(T("naesin.strong")) + "</p>" : ""),
      [{ label: T("naesin.back"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("naesin", artCtx({ grades: subs.map((s) => r.s[s].g), tone: game.screenTone(top) })));
  }
  // The school record, under the ability and condition bars from High 1 on.
  function renderRecord(g) {
    const box = $("record");
    if (!box) return;
    const sc = g.recordScores();
    const show = !!sc || (g.status === "high" || g.status === "hs3") && g.dropout == null;
    box.classList.toggle("hidden", !show);
    if (!show) { box.innerHTML = ""; return; }
    let html = '<h2 class="gap"><span aria-hidden="true">🗂️ </span>' + esc(T("rec.title")) + ' <span class="muted">' + esc(T("rec.sub")) + "</span></h2>";
    if (!sc) { box.innerHTML = html + '<p class="muted">' + esc(T("rec.none")) + "</p>"; return; }
    const r = g.record;
    html += '<div class="bars">' + bar(T("rec.acad"), sc.acad, "var(--a-c5)", 0, T("rec.acad.tip"), "📘") + bar(T("rec.career"), sc.career, "var(--a-c3)", 0, T("rec.career.tip"), "🧭") +
      bar(T("rec.comm"), sc.comm, "var(--a-c2)", 0, T("rec.comm.tip"), "🤝") + "</div>";
    const sems = (g.naesin ? g.naesin.sems : []).map((x) => '<span class="sem-chip"><b>' + esc(L.schoolGrade(x.gr) + "-" + x.sem) + "</b> " + x.avg.toFixed(2) + "</span>").join("");
    html += '<p class="rec-facts">' + esc(T("rec.naesin", { a: sc.naesin })) + (sems ? ' <span class="sems">' + sems + "</span>" : "") + "</p>" +
      '<p class="rec-facts">' + esc(T("rec.field", { f: r.field, fit: r.field && g.track ? g.fieldFit() >= 1 : null })) + " · " + esc(T("rec.club", { c: r.club })) + " · " + esc(T("rec.counts", { v: r.vol, r: r.proj })) + "</p>";
    if (!g.recordOpen()) html += '<p class="muted">' + esc(T("rec.closed")) + "</p>";
    box.innerHTML = html;
  }
  const quotaLabel = (q) => T("apply.quota." + q);
  function showSusi(top) {
    const g = game;
    const opts = g.susiOptions();
    // Picks live in `ui` (as "uni:type" keys) so a redraw keeps them; the Map is rebuilt from them.
    const st = uiFor("susi", () => ({ keys: [], moreOpen: false }));
    const picked = new Map();
    for (const k of st.keys) {
      const o = opts.find((x) => x.uni + ":" + x.type === k && !x.blocked);
      if (o) picked.set(k, { uni: o.uni, type: o.type, free: o.free });
    }
    const mock = g.mocks.filter((x) => x.year === g.year && x.attempt === g.attempt && !x.pre).pop();
    const est = mock ? S.admissionScore(mock) : null;
    // One card per university, its 수시 types inside. Schools where nothing is open or every chance is
    // under 2% fold into a "long shots" list, so the screen stays short on a phone.
    const byUni = [];
    for (const o of opts) {
      let u = byUni.find((x) => x.id === o.uni);
      if (!u) byUni.push(u = { id: o.uni, opts: [] });
      u.opts.push(o);
    }
    const card = (u) => {
      const meta = UNIVERSITIES.find((x) => x.id === u.id);
      const allOff = u.opts.every((o) => o.blocked);
      const why = allOff ? T("susi.no." + u.opts[0].blocked) : "";
      const items = u.opts.map((o) => {
        const notes = [T("susi.min", { m: o.min, q: o.minP }), o.iv ? T("susi.iv") : "", o.quota ? quotaLabel(o.quota) : "", o.free ? T("susi.free") : ""].filter(Boolean).join(" · ");
        return '<label class="sopt' + (o.blocked ? " off" : "") + '"><input type="checkbox" data-u="' + o.uni + '" data-t="' + o.type + '"' + (o.blocked ? " disabled" : "") + (picked.has(o.uni + ":" + o.type) ? " checked" : "") + ">" +
          '<span class="st"><b>' + esc(L.susiType(o.type)) + "</b>" + (o.blocked ? (allOff ? "" : '<small class="why">' + esc(T("susi.no." + o.blocked)) + "</small>") : "<small>" + esc(notes) + "</small>") + "</span>" +
          (o.blocked ? "" : '<span class="chance ' + chanceClass(o.all) + '">' + esc(T("susi.chance", { p: Math.round(o.all * 100) })) + "</span>") + "</label>";
      }).join("");
      // v6.7: a school your mock already clears in 정시, well below the best one it makes a fair chance.
      const trap = !allOff && g.susiTrap([{ uni: u.id }], est);
      return '<div class="susi-uni' + (allOff ? " off" : "") + '"><div class="nm">' + esc(L.uni(u.id)) + " <small>" + esc(T("susi.share", { s: meta.susi })) + "</small>" +
        (why ? '<small class="why">' + esc(why) + "</small>" : "") + (trap ? '<small class="below">' + esc(T("susi.below")) + "</small>" : "") + "</div>" + items + "</div>";
    };
    // Best chance first, like the regular-admission list.
    const best = (u) => Math.max(0, ...u.opts.filter((o) => !o.blocked).map((o) => o.all));
    const main = byUni.filter((u) => u.opts.some((o) => !o.blocked && o.all >= 0.02)).sort((a, b) => best(b) - best(a));
    const rest = byUni.filter((u) => main.indexOf(u) < 0);
    const notes = [T("susi.warn")];
    const body = "<p>" + esc(T("susi.text", { a: g.naesinAvg(), r: g.record ? Math.round(g.recordScore()) : "—", est, free: opts.some((o) => o.free && !o.blocked) })) + "</p>" +
      '<p class="cond-note" role="note">' + esc(notes[0]) + "</p>" +
      (g.attempt > 1 ? '<p class="muted">' + esc(T("susi.retake")) + "</p>" : "") + (g.dropout != null ? '<p class="muted">' + esc(T("susi.ged")) + "</p>" : "") +
      '<p class="muted">' + esc(T("susi.types")) + "</p>" +
      '<div class="picks" id="susiPicks" aria-live="polite"></div>' +
      '<div class="susi-list">' + main.map(card).join("") + "</div>" +
      (rest.length ? '<details class="susi-more"' + (st.moreOpen || !main.length ? " open" : "") + "><summary>" + esc(T("susi.more", { n: rest.length })) + '</summary><div class="susi-list">' + rest.map(card).join("") + "</div></details>" : "");
    openModal(T("susi.title"), body, [
      { label: T("susi.skip"), run: () => { game.applySusi([]); after(); } },
      { label: T("susi.submit", { n: 0 }), primary: true, run: () => {
        if (!picked.size) return;
        game.applySusi(Array.from(picked.values()));
        after();
      } },
    ], Art.screenArt("susi", artCtx()));
    const boxes = els.modalBody.querySelectorAll(".sopt input");
    const submit = els.modalButtons.querySelector("button.primary");
    const counted = () => Array.from(picked.values()).filter((x) => !x.free).length;
    const picksBox = $("susiPicks");
    const sync = () => {
      const full = counted() >= S.SUSI_MAX;
      for (const b of boxes) {
        const o = opts.find((x) => x.uni === b.dataset.u && x.type === b.dataset.t);
        b.checked = picked.has(b.dataset.u + ":" + b.dataset.t);
        b.disabled = !!o.blocked || (!b.checked && full && !o.free);
        b.closest(".sopt").classList.toggle("picked", b.checked);
      }
      st.keys = Array.from(picked.keys());
      // The picks, pinned at the top as chips (tap one to take it back), like the apply screen.
      picksBox.innerHTML = '<span class="picks-k">' + esc(T("apply.picked")) + " " + counted() + "/" + S.SUSI_MAX + "</span>" + (picked.size ? Array.from(picked.entries()).map(([k, x]) =>
        '<button type="button" class="chip pick" data-unpick="' + esc(k) + '" aria-label="' + esc(T("apply.remove", { uni: L.uni(x.uni) + " " + L.susiShort(x.type) })) + '">' + esc(L.uni(x.uni)) + " · " + esc(L.susiShort(x.type)) + ' <span aria-hidden="true">×</span></button>').join("") : "");
      submit.textContent = T("susi.submit", { n: counted() });
      submit.disabled = !picked.size;
      // The 수시 납치 trap: a pick far below where the September mock puts you in 정시. It sits in the
      // sticky picks bar, so it shows wherever the list is scrolled when you tick the box.
      const trap = g.susiTrap(Array.from(picked.values()), est);
      if (trap) picksBox.insertAdjacentHTML("beforeend", '<p class="note warn picks-warn" role="note">' + esc(T("susi.trap", { pick: trap.pick, best: trap.best, p: Math.min(99, Math.round(trap.p * 100)) })) + "</p>");
    };
    for (const b of boxes) b.addEventListener("change", () => {
      const k = b.dataset.u + ":" + b.dataset.t;
      const o = opts.find((x) => x.uni === b.dataset.u && x.type === b.dataset.t);
      if (b.checked) picked.set(k, { uni: o.uni, type: o.type, free: o.free }); else picked.delete(k);
      sync();
    });
    picksBox.addEventListener("click", (e) => {
      const c = e.target.closest("[data-unpick]");
      if (c) { picked.delete(c.dataset.unpick); sync(); }
    });
    const more = els.modalBody.querySelector(".susi-more");
    if (more) more.addEventListener("toggle", () => { st.moreOpen = more.open; });
    sync();
  }
  function showSusiStage(top) {
    const rows = top.r.map((x, i) => '<div class="result" style="--i:' + i + '"><span>' + esc(L.uni(x.uni)) + ' <small class="muted">' + esc(L.susiShort("jh")) + "</small></span>" +
      '<span class="stamp ' + (x.pass ? "ok" : "no") + '">' + esc(T(x.pass ? "susiStage.pass" : "susiStage.fail")) + "</span></div>").join("");
    openModal(T("susiStage.title"), "<p>" + esc(T("susiStage.text")) + '</p><div class="results">' + rows + "</div>",
      [{ label: T("continue"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("susiStage", artCtx({ mood: top.r.some((x) => x.pass) ? "happy" : "tired", tone: game.screenTone(top) })));
  }
  function showSusiResult(top) {
    const res = top.results || [];
    const any = res.some((x) => x.admitted);
    const rows = res.map((x, i) => {
      const k = x.admitted ? (x.wait ? "susiResult.wait" : "susiResult.yes") : x.minFail ? "susiResult.min" : x.stage1Fail ? "susiResult.stage1" : "susiResult.no";
      return '<div class="result" style="--i:' + i + '"><span>' + esc(L.uni(x.id)) + ' <small class="muted">' + esc(L.susiShort(x.type)) + "</small></span>" +
        '<span class="stamp ' + (x.admitted ? "ok" : "no") + '">' + esc(T(k)) + "</span></div>";
    }).join("");
    openModal(T("susiResult.title"), "<p>" + esc(T("susiResult.text")) + '</p><div class="results">' + rows + "</div>" + (any ? '<p class="cond-note">' + esc(T("susiResult.lock")) + "</p>" : ""),
      [{ label: T(any ? "susiResult.go" : "susiResult.jeongsi"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("susiResult", artCtx({ mood: any ? "happy" : "tired", tone: game.screenTone(top) })));
    if (any && !calm()) setTimeout(() => confetti(50), 700);
  }

  function chanceClass(p) { return p >= 0.85 ? "ch-safe" : p >= 0.55 ? "ch-match" : p >= 0.25 ? "ch-reach" : "ch-long"; }
  // A list of choices as rows (label.uni): a checkbox or radio, the name with small lines under it,
  // and a pill on the right. Shared by the apply screen; the admissions screens can reuse it.
  // o: { id, name, lines: [text], pill: { cls, text }, off, checked }.
  function choiceRow(o, type, name) {
    return '<label class="uni' + (o.off ? " off" : "") + (o.checked ? " picked" : "") + '"><input type="' + type + '" name="' + name + '" value="' + esc(o.id) + '"' + (o.off ? " disabled" : "") + (o.checked ? " checked" : "") + ">" +
      '<span class="nm">' + esc(o.name) + o.lines.map((l) => "<small>" + esc(l) + "</small>").join("") + "</span>" +
      (o.pill ? '<span class="chance ' + o.pill.cls + '">' + esc(o.pill.text) + "</span>" : "<span></span>") + "</label>";
  }
  // Applications: schools sorted by your chance, long shots (10% or less) folded away, your picks
  // pinned as chips at the top, and the submit button in the dialog's sticky footer.
  function showApply(top) {
    const opts = game.options().slice().sort((a, b) => (!!a.blocked - !!b.blocked) || b.p - a.p);
    const st = uiFor("apply", () => ({ picked: [], longOpen: false }));
    const isLong = (o) => !o.blocked && o.p <= 0.1;
    const row = (o) => choiceRow({ id: o.id, name: L.uni(o.id), off: !!o.blocked || (st.picked.length >= 3 && st.picked.indexOf(o.id) < 0), checked: st.picked.indexOf(o.id) >= 0,
      lines: [o.blocked ? T(o.blocked === "women" ? "apply.no.women" : "apply.sciOnly") : T("apply.chance", { p: Math.round(o.p * 100) }) + (o.quota ? " · " + T("apply.quota." + o.quota) : "")],
      pill: { cls: chanceClass(o.p), text: L.chance(o.label) } }, "checkbox", "apply");
    const main = opts.filter((o) => !isLong(o)), long = opts.filter(isLong);
    const body =
      "<p>" + esc(T("apply.text", { s: top.score.toFixed(1) })) + "</p>" +
      '<div class="picks" id="applyPicks" aria-live="polite"></div>' +
      '<div class="unis">' + main.map(row).join("") + "</div>" +
      // With fewer than three realistic picks the long shots start open: a weak score must never look
      // like a screen with nothing to choose and a disabled button.
      (long.length ? '<details class="longshots"' + (st.longOpen || main.filter((o) => !o.blocked).length < 3 || long.some((o) => st.picked.indexOf(o.id) >= 0) ? " open" : "") + "><summary>" + esc(T("apply.long", { n: long.length })) +
        '</summary><div class="unis">' + long.map(row).join("") + "</div></details>" : "");
    openModal(T("apply.title"), body, [
      { label: T("apply.submit", { n: 0 }), primary: true, run: () => {
        if (!st.picked.length) return;
        game.apply(st.picked.slice());
        after();
      } },
    ], Art.screenArt("apply", artCtx()));
    const boxes = els.modalBody.querySelectorAll("input[type=checkbox]");
    const submit = els.modalButtons.querySelector("button");
    const picksBox = $("applyPicks");
    const sync = () => {
      for (const b of boxes) {
        const o = opts.find((x) => x.id === b.value);
        b.checked = st.picked.indexOf(b.value) >= 0;
        b.disabled = !!o.blocked || (!b.checked && st.picked.length >= 3);
        b.closest(".uni").classList.toggle("picked", b.checked);
        b.closest(".uni").classList.toggle("off", b.disabled);
      }
      picksBox.innerHTML = '<span class="picks-k">' + esc(T("apply.picked")) + "</span>" + (st.picked.length ? st.picked.map((id) =>
        '<button type="button" class="chip pick" data-unpick="' + esc(id) + '" aria-label="' + esc(T("apply.remove", { uni: L.uni(id) })) + '">' + esc(L.uni(id)) + ' <span aria-hidden="true">×</span></button>').join("") :
        '<span class="muted">' + esc(T("apply.pickedNone")) + "</span>");
      submit.textContent = T("apply.submit", { n: st.picked.length });
      submit.disabled = !st.picked.length;
    };
    for (const b of boxes) b.addEventListener("change", () => {
      st.picked = st.picked.filter((id) => id !== b.value);
      if (b.checked && st.picked.length < 3) st.picked.push(b.value);
      sync();
    });
    picksBox.addEventListener("click", (e) => {
      const c = e.target.closest("[data-unpick]");
      if (!c) return;
      st.picked = st.picked.filter((id) => id !== c.dataset.unpick);
      sync();
    });
    const det = els.modalBody.querySelector(".longshots");
    if (det) det.addEventListener("toggle", () => { st.longOpen = det.open; });
    sync();
  }

  // ---------- celebration ----------
  // Paper confetti over the page; it removes itself. Skipped with reduced motion.
  function confetti(n) {
    if (calm()) return;
    const box = els.confetti;
    const colors = ["--a-c1", "--a-c2", "--a-c3", "--a-c4", "--a-c5", "--a-gold"];
    let html = "";
    for (let i = 0; i < (n || 90); i++) {
      const x = Math.random() * 100, d = 2.4 + Math.random() * 2.2, del = Math.random() * 0.9, dx = Math.random() * 160 - 80, r = Math.random() * 720 - 360;
      html += '<i style="left:' + x.toFixed(1) + "%;background:var(" + colors[i % colors.length] + ");--d:" + d.toFixed(2) + "s;--del:" + del.toFixed(2) + "s;--dx:" + dx.toFixed(0) + "px;--r:" + r.toFixed(0) + "deg" +
        (i % 3 === 0 ? ";border-radius:50%" : "") + '"></i>';
    }
    box.innerHTML = html;
    clearTimeout(confetti.t);
    confetti.t = setTimeout(() => { box.innerHTML = ""; }, 5200);
  }

  function showOffers(top) {
    const g = game;
    // Results arrive one envelope at a time, each stamped Admitted or Rejected.
    const results = top.results.map((r, i) =>
      '<div class="result" style="--i:' + i + '"><span>' + esc(L.uni(r.id)) + (r.type ? ' <small class="muted">' + esc(L.susiShort(r.type)) + "</small>" : "") + "</span>" + (r.admitted ? '<span class="stamp ok">' + esc(T("offers.yes")) + "</span>" : '<span class="stamp no">' + esc(T("offers.no")) + "</span>") + "</div>").join("");
    const offerIds = top.offers.slice();
    if (g.enrolled && offerIds.indexOf(g.enrolled) < 0) offerIds.push(g.enrolled);
    offerIds.sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b));
    const btn = (cls, icon, label, small, data) => '<button type="button" class="' + cls + '" data-act="' + data + '"><span class="di" aria-hidden="true">' + icon + "</span><span>" + esc(label) + "<small>" + esc(small) + "</small></span></button>";
    let html = "<p>" + esc(top.susi ? T("offers.susiIntro", { y: g.year }) : T("offers.intro", { y: g.year + 1 })) + '</p><div class="results">' + results + '</div><div class="decide">';
    offerIds.forEach((id, i) => {
      const kept = id === g.enrolled && top.offers.indexOf(id) < 0;
      html += btn(i === 0 ? "primary" : "", "🎓", T("offers.enroll", { uni: L.uni(id), id }), T(kept ? "offers.enroll.kept" : "offers.enroll.sub"), "enroll:" + id);
    });
    if (offerIds.length) {
      const uni = L.uni(offerIds[0]);
      html += btn("", "🤫", T("offers.half", { uni, id: offerIds[0] }), T("offers.half.sub", { uni, id: offerIds[0] }), "halfretake:" + offerIds[0]);
    }
    const icons = { academy: "🏫", selfstudy: "📚" };
    for (const o of g.retakeOptions(top.score)) {
      if (o.id === "halfretake") continue;
      // A full retake means leaving the 반수 school for good, so say so on the button.
      const sub = o.blocked ? T("offers." + o.blocked) : (o.scholarship ? T("offers.scholarship") : "") + T("offers." + o.id + ".sub") +
        (g.enrolled ? T("offers.leave", { uni: g.enrolled }) : "");
      html += btn("", icons[o.id] || "🔁", T("offers." + o.id), sub, o.blocked ? "" : o.id);
    }
    html += btn("", "🚪", T("offers.stop"), T(offerIds.length ? "offers.stop.sub" : "offers.stop.none"), "quit");
    html += "</div>";
    // The art's banner names the best new offer (the same order as the buttons), not the engine's first.
    const bestNew = top.offers.slice().sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b))[0];
    openModal(T(offerIds.length ? "offers.title" : "offers.none"), html, [],
      Art.screenArt("offers", artCtx({ label: bestNew ? L.uni(bestNew) : "", mood: bestNew ? "happy" : "tired", tone: game.screenTone(top) })));
    if (top.offers.length && !showOffers.cheered) { showOffers.cheered = true; setTimeout(() => confetti(70), 900); }
    for (const b of els.modalBody.querySelectorAll(".decide button")) {
      const act = b.dataset.act;
      if (!act) { b.disabled = true; continue; }
      b.addEventListener("click", () => {
        const [action, id] = act.split(":");
        game.decide({ action, uni: id });
        showOffers.cheered = false;
        plan = {};
        method = game.methodFixed() ? method : game.method;
        after();
      });
    }
  }

  function showEnding() {
    const g = game;
    const e = g.ending;
    const u = e.uni ? UNIVERSITIES.find((x) => x.id === e.uni) : null;
    const work = e.work || null;
    const best = e.best;
    const gr = best ? [best.subjects.kor.grade, best.subjects.math.grade, best.subjects.eng.grade] : null;
    const epi = g.epi && g.epi.done ? g.epi : null;
    if (!g.endingRecorded && best) {
      addFame({ name: g.name, total: best.total, g: gr, uni: u ? u.id : null, attempts: e.attempts });
      g.endingRecorded = true;
      if (u) setTimeout(() => confetti(120), 300);
    }
    // The Lives list gets the life when it ends, and again with its at-30 line once the epilogue is done.
    const stage = epi ? 2 : 1;
    if ((g.lifeRecorded || 0) < stage) { recordLife(g); g.lifeRecorded = stage; }
    save(); // so reopening the finished life doesn't add the same entries again
    unlock(g);
    const verdict = !u ? (work ? "end.work" : "end.none") : u.id === "med" ? "end.med" : ["snu", "yonsei", "korea", "kaist", "postech"].indexOf(u.id) >= 0 ? "end.sky" :
      u.cut >= 93 ? "end.top" : u.cut >= 85 ? "end.solid" : "end.fresh";
    const tile = (k, v) => '<div><span class="k">' + esc(T(k)) + '</span><span class="v">' + esc(v) + "</span></div>";
    const list = T("ach.list"), mine = g.achievements({ lives: loadLives().length });
    const ach = mine.length ? '<div class="ach-chips">' + mine.map((id) => '<span class="chip' + (freshAch.has(id) ? " new" : "") + '" title="' + esc(list[id][1]) + '">🏅 ' + esc(list[id][0]) +
      (freshAch.has(id) ? " <small>" + esc(T("end.achNew")) + "</small>" : "") + "</span>").join("") + "</div>" : '<p class="muted">' + esc(T("end.achNone")) + "</p>";
    openModal(u ? T("end.title", { uni: L.uni(u.id) }) : work ? T("end.titleWork") : T("end.titleNone"),
      '<p class="story">' + esc(T(verdict, { job: work })) + '</p><div class="summary">' +
      tile("end.attempts", e.attempts || "—") + tile(work && !u ? "end.ageWork" : "end.age", L.age(e.age)) + tile("end.best", best ? best.total : "—") + tile("end.grades", gr ? gr.join("·") : "—") + "</div>" +
      (epi ? "<h3>" + esc(T("epi.title.at30", { name: g.name })) + "</h3>" + at30Html(g) : "") +
      "<h3>" + esc(T("end.card")) + '</h3><div class="card-wrap">' + cardSvg(g) + '</div><div class="card-out"></div>' +
      "<h3>" + esc(T("end.ach")) + "</h3>" + ach +
      friendFates(g) + '<p class="muted">' + esc(T("end.note")) + "</p>",
      [
        { label: T("end.look"), run: () => { g.endingSeen = true; after(); } },
        { label: T("end.png"), run: downloadCard },
        g.epi ? { label: T("newLife"), primary: true, run: startOver } : { label: T("newLife"), run: startOver },
      ].concat(g.epi ? [] : [{ label: T("end.epi"), primary: true, run: () => { g.startEpilogue(); after(); } }]),
      Art.screenArt("ending", artCtx({ stage: "uni", label: u ? L.uni(u.id) : "", work: !!work, mood: u || work ? "happy" : "ok", tone: u ? 2 : work ? 1 : -1 })));
  }

  // Where the closest friends ended up (the engine's friendOutcomes), drawn as university students.
  function friendFates(g) {
    const fo = g.friendOutcomes ? g.friendOutcomes(5) : [];
    if (!fo.length) return "";
    const role = T("people.role");
    return "<h3>" + esc(T("end.friends")) + '</h3><ul class="fates">' + fo.map((f) => '<li><span class="pic">' + Art.portraitFor(f.path === "uni" ? "uni" : "academy", Art.lookFor(f.lk, f.x), "happy") +
      '</span><span class="who"><b>' + esc(L.full(f)) + "</b> <small>" + esc(role[f.role] || "") + "</small><br>" + esc(T("end.friend", f)) + "</span></li>").join("") + "</ul>";
  }

  // ---------- the people in your life ----------
  // Classmates first (by what they are to you, then how close), then old friends you still know. Tap a
  // card to spend the turn's Friends blocks with that person; tap it again to leave it to chance.
  const ROLE_ORDER = ["partner", "best", "crush", "rival", "friend", "bully", "classmate", "ex", "old", "out"];
  function renderPeople() {
    const g = game;
    const s = g.soc();
    const order = (p) => ROLE_ORDER.indexOf(g.roleOf(p)) * 1000 - p.cl;
    const here = s.people.filter((p) => p.here).sort((a, b) => order(a) - order(b)).slice(0, 9);
    const old = s.people.filter((p) => !p.here && (p.cl >= 15 || ["partner", "best", "crush"].indexOf(g.roleOf(p)) >= 0)).sort((a, b) => order(a) - order(b)).slice(0, 6);
    const stage = artCtx().stage;
    const role = T("people.role"), tag = T("people.tag"), met = T("people.met"), out = T("people.out");
    const done = !!g.ending;
    const card = (p) => {
      const r = g.roleOf(p);
      const on = s.focus === p.id;
      const name = L.full(p);
      const where = p.out ? out[p.out] : met[p.st] || "";
      const off = done || r === "bully";
      return '<button type="button" class="pcard r-' + r + (on ? " on" : "") + '" data-pid="' + p.id + '" aria-pressed="' + on + '"' + (off ? " disabled" : "") +
        ' title="' + esc(T("people.pick", { a: p }) + " · " + T("people.cl", { v: Math.round(p.cl) })) + '">' +
        '<span class="pic">' + Art.portraitFor(stage, Art.lookFor(p.lk, p.x), r === "bully" ? "grumpy" : p.fight != null ? "grumpy" : "happy") + "</span>" +
        '<span class="pinfo"><b>' + esc(name) + '</b><span class="role">' + esc(role[r]) + "</span><small>" + esc(p.tr.map((t) => tag[t]).join(" · ") + (where ? " · " + where : "")) + "</small>" +
        '<span class="clbar" aria-label="' + esc(T("people.cl", { v: Math.round(p.cl) })) + '"><i style="width:' + Math.round(p.cl) + '%"></i></span></span></button>';
    };
    let html = "";
    if (here.length) html += '<h3 class="grp">' + esc(T("people.now")) + '</h3><div class="pgrid">' + here.map(card).join("") + "</div>";
    if (old.length) html += '<h3 class="grp">' + esc(T("people.old")) + '</h3><div class="pgrid">' + old.map(card).join("") + "</div>";
    els.people.innerHTML = html || '<p class="muted">' + esc(T("people.empty")) + "</p>";
    const t = g.inClass() && s.teacher;
    els.peopleTeacher.classList.toggle("hidden", !t);
    if (t) {
      els.peopleTeacher.innerHTML = '<span class="pic">' + Art.portrait({ age: "adult", outfit: "casual", look: { hair: t.x === "f" ? 3 : 1, shirt: t.g % 4, skin: 0, sex: t.x }, mood: t.sty === "tired" ? "tired" : "happy" }) + "</span><span>" +
        esc(T("people.teacher", { t })) + "<small>" + esc(T("teacher.fx")[t.sty]) + "</small></span>";
    }
    const f = g.person(s.focus);
    els.peopleNote.textContent = here.length || old.length ? (f ? T("people.with", { a: f }) : T("people.auto")) + " " + T("people.tap") + " " + T("people.hint") : "";
  }
  els.people.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pid]");
    if (!b || b.disabled || !game) return;
    const id = Number(b.dataset.pid);
    game.setFocus(game.social.focus === id ? null : id);
    save();
    renderPeople();
    const again = els.people.querySelector('button[data-pid="' + id + '"]');
    if (again) again.focus({ preventScroll: true });
  });

  // ---------- across lives: achievements, past lives, today's life ----------
  // Unlocked achievements ({ id: time }) and the last 50 lives live under their own keys, so starting
  // over never clears them. Everything is best effort: without storage the game still plays.
  const ACH_KEY = "suneung.ach.v1";
  const LIVES_KEY = "suneung.lives.v1";
  const LIVES_MAX = 50;
  function loadJSON(k, d) { try { const v = JSON.parse(store.get(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function loadAch() { const o = loadJSON(ACH_KEY, {}); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; }
  function loadLives() { const a = loadJSON(LIVES_KEY, []); return Array.isArray(a) ? a.filter((e) => e && typeof e === "object") : []; }
  // A life's id in the Lives list: set when it starts; older saves use their seed, start year and name.
  const lifeId = (g) => g.lifeId || g.seed + ":" + (g.startYear || 0) + ":" + g.name;
  function lifeEntry(g) {
    const b = g.birthInfo(), e = g.ending, best = e && e.best;
    const a = g.epi && g.epi.done ? g.epi.at30 : null;
    return {
      id: lifeId(g), seed: g.seed, name: g.name, sex: g.sex || null, sy: g.startYear, by: b.year, reg: b.reg, fam: b.fam, par: b.par, jobs: b.jobs,
      uni: e ? e.uni : null, work: e && e.work ? e.work : null, total: best ? best.total : null, att: e ? e.attempts : g.attempt, ach: g.achievements({ lives: loadLives().length }),
      daily: g.daily || null, at30: a ? { job: a.job, pay: a.pay, fifth: a.fifth } : null, t: Date.now(),
    };
  }
  function recordLife(g) {
    const id = lifeId(g);
    const list = [lifeEntry(g)].concat(loadLives().filter((e) => e.id !== id)).slice(0, LIVES_MAX);
    store.set(LIVES_KEY, JSON.stringify(list));
  }
  // Achievements unlocked during this page's visit, marked "new" on the ending screen.
  const freshAch = new Set();
  function unlock(g) {
    if (!g || typeof g.achievements !== "function") return;
    const have = loadAch(), fresh = [];
    for (const id of g.achievements({ lives: loadLives().length })) if (!have[id]) { have[id] = Date.now(); fresh.push(id); freshAch.add(id); }
    if (!fresh.length) return;
    store.set(ACH_KEY, JSON.stringify(have));
    const list = T("ach.list");
    toast("🏅 " + T("ach.toast") + ": " + fresh.map((id) => list[id][0]).join(", "));
  }
  let toastTimer = 0;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 4500);
  }
  // Unlocked ones first; the locked ones fold away under their hints (44 cards are a long list on a phone).
  function achHtml() {
    const have = loadAch(), list = T("ach.list");
    const card = (id) => {
      const [name, desc, hint] = list[id];
      const on = !!have[id];
      return '<div class="ach' + (on ? " on" : "") + '"><span class="ai" aria-hidden="true">' + (on ? "🏅" : "🔒") + "</span><span><b>" + esc(on ? name : hint) + "</b><small>" +
        esc(on ? desc : T("ach.locked")) + "</small></span></div>";
    };
    const on = S.ACHIEVEMENTS.filter((id) => have[id]), off = S.ACHIEVEMENTS.filter((id) => !have[id]);
    return (on.length ? '<div class="ach-grid">' + on.map(card).join("") + "</div>" : "") +
      (off.length ? '<details class="ach-more"><summary>' + esc(T("ach.lockedN", { n: off.length })) + '</summary><div class="ach-grid">' + off.map(card).join("") + "</div></details>" : "");
  }
  const achCount = () => { const have = loadAch(); return S.ACHIEVEMENTS.filter((id) => have[id]).length; };
  function renderAch() {
    els.achSub.textContent = T("ach.sub", { n: achCount(), m: S.ACHIEVEMENTS.length });
    els.achList.innerHTML = achHtml();
  }
  // Past lives as cards (ten columns don't fit a phone): name, where and into what you were born,
  // how it ended, and the numbers as chips; the column names label each fact.
  function livesHtml() {
    const list = loadLives();
    if (!list.length) return '<p class="muted">' + esc(T("lives.empty")) + "</p>";
    const h = T("lives.h");
    const jobs = (j) => (j ? [j.mom, j.dad].filter(Boolean).map((x) => L.job(x)).join(" · ") : "") || "—";
    const fact = (i, v) => '<span class="lf"><span class="k">' + esc(h[i]) + "</span> " + esc(v) + "</span>";
    return '<div class="life-cards">' + list.map((e, i) =>
      '<article class="card life-card"><div class="lc-head"><b>' + esc(e.name) + "</b>" + (e.daily ? ' <span class="tag">' + esc(T("lives.dailyOn", { d: e.daily })) + "</span>" : "") +
      '<button type="button" class="small" data-replay="' + i + '">' + esc(T("lives.replay")) + "</button></div>" +
      '<div class="lc-out">' + (e.work && !e.uni ? "🏭 " + esc(L.job30(e.work)) : "🎓 " + esc(e.uni ? L.uni(e.uni) : T("fame.none"))) + (e.at30 ? ' <span class="muted">· ' + esc(T("lives.at30", { job: e.at30.job })) + "</span>" : "") + "</div>" +
      '<div class="lc-facts">' + fact(1, e.by) + fact(2, L.regionShort(e.reg)) + fact(3, e.par === "care" ? L.parents("care") : L.family(e.fam)) + fact(4, jobs(e.jobs)) + "</div>" +
      '<div class="chips">' + '<span class="chip sm info">' + esc(h[6]) + " " + (e.total != null ? e.total : "—") + '</span><span class="chip sm info">' + esc(h[7]) + " " + esc(e.att || "—") +
      '</span><span class="chip sm info">🏅 ' + (Array.isArray(e.ach) ? e.ach.length : 0) + "</span></div></article>").join("") + "</div>";
  }
  function bindReplay(root) {
    for (const b of root.querySelectorAll("[data-replay]")) b.addEventListener("click", () => askReplay(loadLives()[Number(b.dataset.replay)]));
  }
  function renderLives() {
    els.lives.innerHTML = livesHtml();
    bindReplay(els.lives);
  }
  // Live a past life again: the same seed and start year, so the same family, talents and luck.
  function askReplay(e) {
    if (!e) return;
    dlg = { kind: "replay", e };
    const busy = !!(game && !game.ending);
    openModal(T("lives.replayTitle"), "<p>" + esc(T("lives.replayText", { name: e.name, busy })) + "</p>", [
      { label: T("lives.replayKeep"), cancel: true, run: closeDialog },
      { label: T("lives.replayGo"), primary: true, run: () => { dlg = null; startLife({ seed: e.seed, name: e.name, sex: e.sex === "f" ? "f" : "m", sy: e.sy, replayOf: e.id, daily: e.daily }); } },
    ], null, { optional: true });
  }
  function today() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  // A new life. o: { seed, name, sex, sy (the year elementary school starts), daily, replayOf }.
  function startLife(o) {
    o = o || {};
    const s = o.sex || sex;
    game = new Game({ seed: o.seed, name: o.name || els.name.value.trim() || T("setup.namePh." + s), sex: s, startYear: o.sy || new Date().getFullYear() + 6 });
    game.seenCuts = [];
    game.lifeId = game.seed + ":" + Date.now();
    if (o.daily) game.daily = o.daily;
    if (o.replayOf) game.replayOf = o.replayOf;
    plan = {};
    dlg = null; ui = {}; turnSum = null;
    save();
    closeModal();
    showGame();
  }
  els.dailyBtn.addEventListener("click", () => { const d = today(); startLife({ seed: Game.dailySeed(d), daily: d }); });
  // The same panels from inside a life, in the modal (only between screens).
  const freeModal = () => game && !game.queue.length && !outcome && !cut;
  function openAch() {
    dlg = { kind: "ach" };
    openModal(T("ach.title"), '<p class="muted">' + esc(T("ach.sub", { n: achCount(), m: S.ACHIEVEMENTS.length })) + "</p>" + achHtml(),
      [{ label: T("continue"), primary: true, cancel: true, run: closeDialog }], null, { optional: true });
  }
  function openLives() {
    dlg = { kind: "lives" };
    openModal(T("lives.title"), livesHtml(), [{ label: T("continue"), primary: true, cancel: true, run: closeDialog }], null, { optional: true });
    bindReplay(els.modalBody);
  }
  els.achBtn.addEventListener("click", () => { if (freeModal()) openAch(); });
  els.livesBtn.addEventListener("click", () => { if (freeModal()) openLives(); });
  els.endBtn.addEventListener("click", () => { if (!freeModal() || !game.ending) return; game.endingSeen = false; after(); });

  // ---------- the epilogue screens ----------
  const EPI_ART = { major: "campus", college: "campus", armyWhen: "army", army: "army", hunt: "hunt", hunt2: "hunt" };
  const EPI_ICON = {
    hum: "📜", soc: "📊", edu: "🍎", eng: "⚙️", nat: "🔬", health: "🩺", arts: "🎨",
    library: "📚", balance: "⚖️", exchange: "✈️", gap: "💼", campus: "🎉", y1: "1️⃣", y2: "2️⃣", after: "🎓",
    army: "🪖", navy: "⚓", air: "✈️", marine: "🦅", social: "🏢", alt: "🕊️", doctor: "⚕️", industrial: "🔩", stay: "💼",
    big: "🏢", bigline: "🏭", public: "⚡", civil: "🏛️", teacher: "🍎", law: "⚖️", hospital: "🏥", startup: "🚀", grad: "🧪", sme: "🏬",
    trade: "🔧", service: "🛍️", shop: "🏪", popular: "💉", essential: "🩺", gp: "🏥", again: "🔁", parttime: "⏰",
  };
  function epiText(g, top) {
    const st = top.step, med = top.tier === 6, none = top.tier === 0;
    const e = g.epi;
    const work = g.ending.work || null;
    const p = { age: Math.round(g.ending.age + g.epiYearsToReady()), gpa: e.gpa != null ? e.gpa.toFixed(2) : "", t: e.target, job: work, sme: work === "sme" };
    let k = "epi.text." + st;
    if (st === "college" && med) k += ".med";
    // v6.8: a job taken out of school gets its own lines (the law keeps it during service; 산업기능요원).
    if (st === "army") k += top.opts.indexOf("social") >= 0 ? ".social" : med ? ".med" : none ? (work ? ".work" : ".none") : "";
    if (st === "hunt") k += med ? ".med" : none ? (work ? ".work" : ".none") : "";
    return T(k, p);
  }
  function showEpi(top) {
    const g = game, st = top.step;
    if (st === "at30") {
      openModal(T("epi.title.at30", { name: g.name }), at30Html(g), [{ label: T("epi.at30.ok"), primary: true, run: () => { g.epiChoose("ok"); g.endingSeen = false; after(); } }],
        Art.screenArt("at30", artCtx({ stage: "uni", mood: g.epi.at30.fifth >= g.epi.at30.born ? "happy" : "ok", tone: Math.sign(g.epi.at30.fifth - g.epi.at30.born) })));
      return;
    }
    const title = T("epi.title." + st + (st === "college" && top.tier === 6 ? ".med" : ""));
    const labels = T("epi.o." + st), descs = T("epi.d." + st);
    let html = '<p class="story">' + esc(epiText(g, top)) + '</p><div class="decide">';
    top.opts.forEach((id, i) => {
      const closed = top.blocked && top.blocked[id];
      html += '<button type="button"' + (i === 0 ? ' class="primary"' : "") + ' data-epi="' + (closed ? "" : id) + '"><span class="di" aria-hidden="true">' + (EPI_ICON[id] || "•") + "</span><span>" +
        esc(labels[id]) + "<small>" + esc(closed ? T("epi.blocked." + closed) : descs[id]) + "</small></span></button>";
    });
    html += "</div>";
    openModal(title, html, [], Art.screenArt(EPI_ART[st] || "campus", artCtx({ stage: "uni" })));
    for (const b of els.modalBody.querySelectorAll(".decide button")) {
      const id = b.dataset.epi;
      if (!id) { b.disabled = true; continue; }
      b.addEventListener("click", () => {
        const msg = g.epiChoose(id);
        outcome = { title, msg, art: EPI_ART[st] || "campus" };
        after();
      });
    }
  }
  // At 30: job, pay, rank among earners against the family you were born into, home; the ten years'
  // story; and any "where they are now" lines other systems added (g.epi.extra).
  function at30Html(g) {
    const e = g.epi, a = e.at30;
    const tile = (k, v, cls) => "<div" + (cls ? ' class="' + cls + '"' : "") + '><span class="k">' + esc(T(k)) + '</span><span class="v">' + esc(v) + "</span></div>";
    const d = a.fifth - a.born;
    let h = '<div class="summary">' + tile("epi.at30.job", L.job30(a.job)) + tile("epi.at30.pay", a.pay ? L.won(a.pay) : T("epi.at30.noPay")) +
      tile("epi.at30.fifth", L.fifth("q" + a.fifth)) + tile("epi.at30.born", L.fifth("q" + a.born)) + tile("epi.at30.where", T("epi.at30.lives", { reg: a.region, home: a.home }), "wide") + "</div>";
    h += '<p class="mob ' + (d > 0 ? "up" : d < 0 ? "down" : "") + '">' + (d > 0 ? "↑ " : d < 0 ? "↓ " : "→ ") + esc(T("epi.at30.mob", { from: a.born, to: a.fifth })) + "</p>";
    h += "<h3>" + esc(T("epi.at30.story")) + '</h3><ol class="epi-story">' + e.lines.map((l) => "<li>" + esc(T(l.key, l.p)) + "</li>").join("") + "</ol>";
    if (e.extra && e.extra.length) h += "<h3>" + esc(T("epi.at30.extra")) + '</h3><ul class="epi-story">' + e.extra.map((l) => "<li>" + esc(T(l.key, l.p)) + "</li>").join("") + "</ul>";
    return h + '<p class="muted small">' + esc(T("epi.at30.note")) + "</p>";
  }

  // ---------- the share card ----------
  function cardSvg(g) {
    const b = g.birthInfo(), e = g.ending, best = e.best;
    const a = g.epi && g.epi.done ? g.epi.at30 : null;
    const lines = [[T("card.born"), b.year + " · " + L.regionShort(b.reg)], [T("card.family"), b.par === "care" ? L.parents("care") : L.family(b.fam)],
      [T("card.outcome"), e.uni ? L.uni(e.uni) : e.work ? T("card.work") : T("card.none")], [T("card.tries"), e.attempts ? L.att(e.attempts) : "—"]];
    // English job names start with "a" / "an", which the card doesn't need.
    if (a) lines.push([T("card.at30"), L.job30(a.job).replace(/^an? /, "")]);
    return Art.shareCard({
      ctx: artCtx({ stage: "uni" }), title: T("card.title"), daily: g.daily ? T("card.daily", { d: g.daily }) : "", name: g.name, lines,
      gradesLabel: T("card.grades"), grades: best ? SUBJECTS.map((s) => best.subjects[s].grade) : null, mood: e.uni || e.work ? "happy" : "ok",
      mob: { from: S.FAMILY_IDS.indexOf(b.fam) + 1, to: a ? a.fifth : null, labels: [T("card.mobBorn"), T("card.mobNow")] },
      aria: g.name + ", " + (e.uni ? L.uni(e.uni) : e.work ? T("card.work") : T("card.none")),
    });
  }
  // Published as a claude.ai artifact, the page can't download files itself: the viewer's "downloads"
  // capability asks them and saves the file. It resolves to null (or never exists) when the game is
  // opened straight from index.html, where a plain download link works.
  let artifactDownloads = null;
  try {
    if (window.claude && typeof window.claude.use === "function") {
      window.claude.use("downloads").then((d) => { artifactDownloads = d; }, () => { /* plain links, then */ });
    }
  } catch (e) { /* not in the artifact viewer */ }
  // The PNG: the card with its colour tokens resolved (an image can't read the page's CSS), drawn to a
  // canvas. If the browser blocks the download, the picture is shown to save by hand.
  function downloadCard() {
    const out = els.modalBody.querySelector(".card-out");
    const fail = () => { if (out) out.innerHTML = '<p class="err">' + esc(T("end.pngFail")) + "</p>"; };
    try {
      const cs = getComputedStyle(document.documentElement);
      const svgStr = cardSvg(game).replace(/var\(--([\w-]+)\)/g, (m, n) => cs.getPropertyValue("--" + n).trim() || "#888888");
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement("canvas");
          cv.width = 1200; cv.height = 680;
          cv.getContext("2d").drawImage(img, 0, 0, 1200, 680);
          const url = cv.toDataURL("image/png");
          // ASCII only: some browsers drop a download name with Hangul in it.
          const file = "suneung-" + (String(game.name).replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "life") + ".png";
          // A blob link keeps the file name; the data URL is the fallback and the picture on screen.
          const save = (href) => {
            const link = document.createElement("a");
            link.href = href;
            link.download = file;
            document.body.appendChild(link);
            link.click();
            link.remove();
            if (href !== url) setTimeout(() => URL.revokeObjectURL(href), 10000);
          };
          if (artifactDownloads && cv.toBlob) {
            // The viewer confirms the save (or declines: then the picture below is still there to keep).
            cv.toBlob((blob) => { if (blob) artifactDownloads.save({ filename: file, data: blob }).catch(() => { /* declined or unavailable */ }); }, "image/png");
          } else if (cv.toBlob && window.URL && URL.createObjectURL) cv.toBlob((blob) => save(blob ? URL.createObjectURL(blob) : url), "image/png");
          else save(url);
          if (out) out.innerHTML = '<img src="' + url + '" alt="' + esc(game.name) + '"><p class="muted small">' + esc(T("end.pngHelp")) + "</p>";
        } catch (err) { fail(); }
      };
      img.onerror = fail;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
    } catch (err) { fail(); }
  }

  // ---------- cutscenes ----------
  // Short animated films (art.js draws the shots) for life's milestones. Which have played is kept on
  // the save as game.seenCuts, so a reload never replays one; the engine never reads it. The header
  // button turns them off, remembered per browser.
  const CUTS_KEY = "suneung.cuts";
  let cutsOn = store.get(CUTS_KEY) !== "off";
  let cut = null; // { name, shots, i, timer } while one plays
  els.cutToggle.addEventListener("click", () => {
    cutsOn = !cutsOn;
    store.set(CUTS_KEY, cutsOn ? "on" : "off");
    applyStatic();
  });
  // The milestone the current screen belongs to, if its film hasn't played: { id, name, ctx, p }.
  function pendingCut() {
    const g = game;
    if (!g || !Array.isArray(g.seenCuts)) return null;
    const top = g.queue[0];
    // cap: the caption set, when it differs from the id's first part.
    const film = (id, name, extra, p, cap) => (g.seenCuts.indexOf(id) < 0 ? { id, name, ctx: artCtx(extra || {}), p: p || {}, cap: cap || id.split("-")[0] } : null);
    if (top && top.type === "birth") return film("birth", "birth", { stage: "baby" }, { y: g.year, name: g.name, region: L.region(g.region) });
    if (outcome && outcome.id === "doljabi") {
      const items = (g.traits || []).filter((t) => S.DOLJABI[t]);
      return film("dol", "dol", { stage: "baby", items }, { a: L.trait(items[0] || "pencil"), b: items[1] ? L.trait(items[1]) : "", two: items.length > 1 });
    }
    if (outcome) return null;
    if (top && top.type === "exam") {
      const r = top.result;
      // A 수능 test site is some other school, numbered on its gate.
      if (examStep === 0) return film("exam-" + r.year, "exam", { label: T("cut.site", { n: 3 + (Math.abs(g.seed + r.year) % 27) }) }, { y: r.year });
      const gr = [r.subjects.kor.grade, r.subjects.math.grade, r.subjects.inq1.grade, r.subjects.inq2.grade];
      const avg = gr.reduce((a, b) => a + b, 0) / 4;
      // v6.5: the film's light and the family's reaction follow how it went (Game.screenTone).
      return film("results-" + r.year, "results", { grades: gr, react: avg <= 2.5 ? "happy" : avg <= 4.5 ? "ok" : "tired", tone: g.screenTone(top) }, { t: r.total });
    }
    if (top && top.type === "offers" && top.offers.length) {
      const best = top.offers.slice().sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b))[0];
      return film("offers-" + g.year + "-" + g.attempt, "offers", { tone: g.screenTone(top) }, { uni: L.uni(best) });
    }
    // No offer anywhere (정시, not 수시, which moves on to 정시): the rejection film, in the dark.
    if (top && top.type === "offers" && !top.susi) return film("rejected-" + g.year + "-" + g.attempt, "offers", { rejected: true, tone: -2 }, {}, "rejected");
    if (top) return null;
    if (g.ending) {
      if (g.endingSeen) return null;
      const uni = g.ending.uni ? L.uni(g.ending.uni) : "";
      if (g.ending.work && !uni) return film("end", "end", { stage: "uni", work: true, tone: 1 }, { name: g.name, age: L.age(g.ending.age) }, "endwork");
      return film("end", "end", { stage: "uni", label: uni, tone: uni ? 2 : -1 }, { uni, name: g.name, age: L.age(g.ending.age) }, uni ? "end" : "endroad");
    }
    // Moving house (by choice or by an event) this turn.
    if (g.flags.lastMove != null && g.flags.lastMove === g.clock) return film("move-" + g.clock, "move", { tone: g.recentTone ? g.recentTone() : 0 }, { region: L.region(g.region) });
    // The first plan screen of each school stage.
    const school = g.inClass() ? L.school(g.schoolInfo().id) : "";
    if (g.status === "elem" && g.grade === 1) return film("elem", "elem", { label: school }, { school });
    if (g.status === "mid" && g.grade === 7 && g.dropout == null) return film("mid", "school", { label: school }, { school, st: "mid" });
    if (g.status === "high" && g.grade === 10 && g.dropout == null) return film("high", "school", { label: school }, { school, st: "high" });
    return null;
  }
  function playCut(c) {
    const shots = Art.cutscene(c.name, c.ctx);
    if (!shots.length) return;
    const back = document.activeElement && !document.activeElement.closest("#modal") ? document.activeElement : null;
    cut = { c, shots, i: -1, timer: 0, capKey: c.cap, back };
    els.cutFrame.innerHTML = "";
    els.cutProg.innerHTML = shots.map(() => "<i><b></b></i>").join("");
    cutChrome();
    els.cut.classList.remove("hidden");
    document.body.classList.add("cutting");
    syncInert();
    els.cutSkip.focus({ preventScroll: true });
    nextShot();
  }
  function cutChrome() {
    els.cutSkip.textContent = T("cut.skip");
    els.cutHint.textContent = T("cut.next");
    els.cut.setAttribute("aria-label", T("cut.label"));
  }
  // A language switch mid-film: rebuild the film's words (captions and the names drawn in the shots)
  // and redraw the shot on screen. The film's id is already marked seen, so lift it for the rebuild.
  function cutCaption() {
    if (!cut) return;
    const seen = game.seenCuts, k = seen.lastIndexOf(cut.c.id);
    if (k >= 0) seen.splice(k, 1);
    const fresh = pendingCut();
    if (k >= 0) seen.splice(k, 0, cut.c.id);
    if (fresh && fresh.id === cut.c.id) {
      cut.c = fresh;
      const shots = Art.cutscene(fresh.name, fresh.ctx);
      if (shots.length === cut.shots.length) {
        cut.shots = shots;
        const layer = els.cutFrame.lastElementChild;
        if (layer && cut.i >= 0) layer.innerHTML = shots[cut.i].svg;
      }
    }
    cutChrome();
    if (cut.i >= 0) els.cutCap.textContent = T("cut." + cut.capKey + "." + cut.i, cut.c.p);
  }
  function nextShot() {
    if (!cut) return;
    clearTimeout(cut.timer);
    cut.i++;
    if (cut.i >= cut.shots.length) return endCut();
    const shot = cut.shots[cut.i];
    // The new shot fades in over the last one (a cross-dissolve), which then goes.
    const layer = document.createElement("div");
    layer.className = "cut-shot";
    layer.innerHTML = shot.svg;
    els.cutFrame.appendChild(layer);
    while (els.cutFrame.children.length > 2) els.cutFrame.firstChild.remove();
    const cap = els.cutCap;
    cap.textContent = T("cut." + cut.capKey + "." + cut.i, cut.c.p);
    cap.classList.remove("in");
    void cap.offsetWidth;
    cap.classList.add("in");
    els.cutProg.querySelectorAll("i").forEach((el, k) => {
      el.className = k < cut.i ? "done" : k === cut.i ? "now" : "";
      el.style.setProperty("--t", shot.t + "s");
    });
    // Still frames (reduced motion) stay up a little longer, to be read.
    cut.timer = setTimeout(nextShot, shot.t * 1000 + (calm() ? 1600 : 250));
  }
  function endCut() {
    if (!cut) return;
    clearTimeout(cut.timer);
    const back = cut.back;
    cut = null;
    els.cut.classList.add("hidden");
    els.cutFrame.innerHTML = "";
    document.body.classList.remove("cutting");
    syncInert();
    render();
    // Focus goes back where it was, unless the screen the film belonged to opened (it takes focus).
    if (els.modal.classList.contains("hidden") && back && back.isConnected && back.offsetParent !== null) back.focus({ preventScroll: true });
  }
  els.cutSkip.addEventListener("click", (e) => { e.stopPropagation(); endCut(); });
  els.cut.addEventListener("click", () => nextShot());
  document.addEventListener("keydown", (e) => {
    if (!cut) return;
    if (e.key === "Escape") { e.preventDefault(); endCut(); }
    // Enter and Space step through the film, except on the film's own buttons (Skip, the language).
    else if ((e.key === "Enter" || e.key === " ") && !(e.target.closest && e.target.closest("#cut button"))) { e.preventDefault(); nextShot(); }
  });

  // ---------- "Your stats" folds away on a phone ----------
  // The plan comes first on a phone; ability, condition and the chart sit below it in a section that
  // starts folded (remembered per browser). On wider screens CSS ignores the fold.
  const FOLD_KEY = "suneung.statsOpen";
  function setFold(folded) {
    els.statsPanel.classList.toggle("folded", folded);
    els.statsFold.setAttribute("aria-expanded", folded ? "false" : "true");
    if (!folded && game) drawChart();
  }
  els.statsFold.addEventListener("click", () => {
    const folded = !els.statsPanel.classList.contains("folded");
    setFold(folded);
    store.set(FOLD_KEY, folded ? "0" : "1");
  });
  setFold(store.get(FOLD_KEY) !== "1");

  // ---------- first-turn coach marks ----------
  // Three short pointers on the first plan screen of a new player: the blocks and cards, the bars and
  // stars, and Next. A ring around the part and a bubble beside it; shown once per browser.
  const COACH_KEY = "suneung.coach.v1";
  const COACH = [
    { key: "coach.1", target: () => els.activities.querySelector(".act") },
    { key: "coach.2", target: () => els.skills, unfold: true },
    { key: "coach.3", target: () => els.nextBtn },
  ];
  let coachI = -1;
  function maybeCoach() {
    if (coachI >= 0 || !game || game.ending || game.queue.length || outcome || cut) return;
    if (!els.modal.classList.contains("hidden") || els.game.classList.contains("hidden")) return;
    if (store.get(COACH_KEY)) return;
    coachI = 0;
    showCoach();
  }
  function showCoach() {
    const step = COACH[coachI];
    if (!step) return endCoach();
    if (step.unfold) setFold(false);
    const t = step.target();
    if (!t || !t.offsetParent) return endCoach();
    t.scrollIntoView({ block: "center" });
    els.coach.classList.remove("hidden");
    els.coachText.textContent = T(step.key);
    els.coachStep.textContent = T("coach.step", { i: coachI + 1, n: COACH.length });
    els.coachNext.textContent = T(coachI === COACH.length - 1 ? "coach.done" : "coach.next");
    els.coachSkip.textContent = T("coach.skip");
    placeCoach();
    els.coachNext.focus({ preventScroll: true });
  }
  function placeCoach() {
    if (coachI < 0) return;
    const t = COACH[coachI].target();
    if (!t) return;
    const r = t.getBoundingClientRect(), sx = window.scrollX, sy = window.scrollY, pad = 6;
    Object.assign(els.coachRing.style, { left: r.left + sx - pad + "px", top: r.top + sy - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
    const b = els.coachBubble, bw = Math.min(340, document.documentElement.clientWidth - 32);
    b.style.width = bw + "px";
    const left = Math.max(16, Math.min(r.left + sx, sx + document.documentElement.clientWidth - bw - 16));
    const below = r.bottom + 12 + b.offsetHeight < window.innerHeight;
    b.style.left = left + "px";
    b.style.top = (below ? r.bottom + sy + 12 : Math.max(sy + 8, r.top + sy - 12 - b.offsetHeight)) + "px";
  }
  function endCoach() {
    store.set(COACH_KEY, "1");
    coachI = -1;
    els.coach.classList.add("hidden");
  }
  // Closing for a dialog (or the new-life screen) without marking it seen: it comes back next time.
  function hideCoach() {
    if (coachI < 0) return;
    coachI = -1;
    els.coach.classList.add("hidden");
  }
  els.coachNext.addEventListener("click", () => { coachI++; if (coachI >= COACH.length) endCoach(); else showCoach(); });
  els.coachSkip.addEventListener("click", endCoach);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && coachI >= 0) { e.preventDefault(); endCoach(); } });
  window.addEventListener("resize", () => placeCoach());

  // ---------- boot ----------
  applyStatic();
  game = loadSave();
  // Saves from before cutscenes start with none seen, except the one the save is sitting on, so loading
  // an old game doesn't open with a film.
  if (game && !Array.isArray(game.seenCuts)) {
    game.seenCuts = [];
    const c = pendingCut();
    if (c) game.seenCuts.push(c.id);
  }
  // A finished life reopens on its ending (or the look-back view), not the new-life screen; "Start a
  // new life" is right there on the page.
  if (game) showGame();
  else showSetup();
})();
