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
    setup: $("setup"), game: $("game"), name: $("name"), sex: $("sex"), startBtn: $("startBtn"), resumeBtn: $("resumeBtn"), fame: $("fame"),
    sDate: $("sDate"), sDday: $("sDday"), sAttempt: $("sAttempt"), sStatus: $("sStatus"), sAge: $("sAge"),
    sName: $("sName"), sMoney: $("sMoney"), sAllowance: $("sAllowance"), sFam: $("sFam"), sFamSub: $("sFamSub"), sFamCard: $("sFamCard"),
    skills: $("skills"), condition: $("condition"), planTitle: $("planTitle"), blocksLeft: $("blocksLeft"),
    method: $("method"), methodNote: $("methodNote"), activities: $("activities"), planCost: $("planCost"),
    planErr: $("planErr"), repeatBtn: $("repeatBtn"), clearBtn: $("clearBtn"), nextBtn: $("nextBtn"), moveBtn: $("moveBtn"), quitBtn: $("quitBtn"), lessonNote: $("lessonNote"), traits: $("traits"), mainMap: $("mainMap"), mapHome: $("mapHome"), mapHint: $("mapHint"),
    chart: $("chart"), legend: $("legend"), log: $("log"), history: $("history"), newLifeBtn: $("newLifeBtn"),
    modal: $("modal"), modalTitle: $("modalTitle"), modalBody: $("modalBody"), modalButtons: $("modalButtons"),
    modalArt: $("modalArt"), setupArt: $("setupArt"), scene: $("scene"), moodName: $("moodName"), moodText: $("moodText"),
    slots: $("slots"), turn: $("turn"), turnCap: $("turnCap"), turnDate: $("turnDate"), turnAge: $("turnAge"), confetti: $("confetti"),
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
  const ACT_ICON = { kor: "📖", math: "📐", eng: "🔤", hist: "🏯", reading: "📚", arts: "🎹", mock: "⏱️", rest: "😴", exercise: "🏃", friends: "🧑‍🤝‍🧑", games: "🎮", job: "🏪" };
  const ACT_COLOR = { reading: "--a-c5", arts: "--a-c4", mock: "--a-c1", rest: "--a-c3", exercise: "--pos", friends: "--a-c2", games: "--a-c4", job: "--a-gold" };
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
    for (const b of els.lang.querySelectorAll("button")) b.classList.toggle("on", b.dataset.v === lang);
    els.cutToggle.textContent = T(cutsOn ? "cut.toggle.on" : "cut.toggle.off");
    els.cutToggle.setAttribute("aria-pressed", cutsOn ? "true" : "false");
  }
  els.lang.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b || b.dataset.v === lang) return;
    lang = b.dataset.v;
    store.set(LANG_KEY, lang);
    L = window.SuneungText.make(lang, ctx);
    applyStatic();
    if (els.setup.classList.contains("hidden")) render();
    else renderSetup();
  });

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
    renderFame();
  }
  function renderFame() {
    const list = loadFame();
    if (!list.length) {
      els.fame.innerHTML = '<tr><td class="muted">' + esc(T("fame.empty")) + "</td></tr>";
      return;
    }
    const h = T("fame.h");
    els.fame.innerHTML = "<thead><tr>" + h.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
      list.map((e, i) => "<tr><td>" + (["🥇", "🥈", "🥉"][i] || i + 1) + '</td><td class="l">' + esc(e.name) + "</td><td>" + e.total + "</td><td>" + e.g.join("·") +
        '</td><td class="l">' + esc(e.uni ? L.uni(e.uni) : T("fame.none")) + "</td><td>" + e.attempts + "</td></tr>").join("") + "</tbody>";
  }
  function showSetup() {
    closeModal();
    els.setup.classList.remove("hidden");
    els.game.classList.add("hidden");
    els.resumeBtn.classList.toggle("hidden", !(game && !game.ending));
    if (game && game.ending) game = null;
    renderSetup();
  }

  els.resumeBtn.addEventListener("click", () => showGame());
  els.sex.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    sex = b.dataset.v;
    renderSetup();
  });
  els.startBtn.addEventListener("click", () => {
    // Born this year, so elementary school starts six years on.
    game = new Game({ name: els.name.value.trim() || T("setup.namePh." + sex), sex, startYear: new Date().getFullYear() + 6 });
    game.seenCuts = [];
    plan = {};
    save();
    showGame();
  });

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
    renderLog();
    renderHistory();
    drawChart();
    renderModal();
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
      parents: g.parents || "both",
    }, extra || {});
  }
  let sceneKey = "";
  function renderScene() {
    const g = game;
    const school = g.inSchool();
    const c = artCtx({
      ending: !!g.ending,
      label: g.ending && g.ending.uni ? L.uni(g.ending.uni) : "",
      examMonth: !school && !g.ending && g.month === 11,
      results: !school && !g.ending && g.month === 12,
      // The countdown on the wall only means something in an exam year.
      dday: !school && !g.ending && g.month <= 11 ? Math.max(0, g.daysToExam()) : null,
    });
    // At the university gate you're cheering, whatever the bars say.
    if (c.ending && c.label) c.mood = "happy";
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
  function renderFamily(g) {
    const n = S.FAMILY_IDS.indexOf(g.family) + 1;
    const born = (g.log.find((l) => l.key === "log.born") || { p: {} }).p.fam || g.family;
    const diff = n - (S.FAMILY_IDS.indexOf(born) + 1);
    let meter = "";
    for (let i = 1; i <= 5; i++) meter += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    // A child in care has no household class: the card names the home and what it pays instead.
    if (g.parents === "care") {
      els.sFam.textContent = L.parents("care");
      els.sFamSub.textContent = g.flags.careLeft != null ? T("stat.careOut", { a: g.grossBudget() }) : T("stat.careSub", { a: g.grossBudget() });
    } else {
      els.sFam.innerHTML = esc(L.family(g.family)) + ' <span class="fam-meter" aria-hidden="true">' + meter + "</span>";
      els.sFamSub.textContent = (diff ? T("stat.familyMoved", { up: diff > 0, from: born, fam: g.family }) : T("stat.familySub", { fam: g.family })) + " · " + T("stat.parents", { par: g.parents || "both" });
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

    // Small children don't pick study methods.
    els.method.parentElement.classList.toggle("hidden", g.isEarly());
    const fixed = g.methodFixed();
    // After a move to the countryside there may be no tutor to keep: fall back to online lectures.
    if (!fixed && !g.methodAvailable(method)) method = "online";
    els.method.innerHTML = Object.keys(METHODS).map((id) => {
      const on = (fixed || method) === id;
      const off = fixed || done || !g.methodAvailable(id);
      return '<button type="button" data-v="' + id + '" class="' + (on ? "on" : "") + '"' + (off ? " disabled" : "") + (g.methodAvailable(id) ? "" : ' title="' + esc(T("plan.noTutor")) + '"') +
        '><span aria-hidden="true">' + METHOD_ICON[id] + " </span>" + esc(L.method(id)) + "</button>";
    }).join("");
    // Speed and price depend on where you live (Gangnam's academies are better and dearer).
    const mid = fixed || method, m = METHODS[mid], mx = Math.round(g.methodMult(mid) * 100) / 100;
    els.methodNote.textContent = (fixed ? T("plan.methodFixed", { x: mx }) : T("plan.methodNote", { x: mx, cost: g.methodCost(mid), sens: m.sens })) +
      (g.methodAvailable("tutor") ? "" : " · " + T("plan.noTutor"));

    // Activities are cards: tap the card (or +) to give it a block, − to take one back.
    const acts = g.activities();
    const early = g.isEarly();
    const name = (a) => (a.kind === "study" ? L.sub(a.subject) : early && L.actEarlyLong(a.id) ? L.actEarlyLong(a.id) : L.actLong(a.id));
    const card = (a) => {
      const k = plan[a.id] || 0;
      const study = a.kind === "study";
      const nm = name(a);
      const hint = study ? T("plan.studyHint", { v: 50 + g.skills[a.subject] * 16.67 >= 100.5 ? "100+" : S.skillScore(g.skills[a.subject]), s: a.subject }) + " · " + aptTime(g.aptitude[a.subject]) : early && L.actEarlyHint(a.id) ? L.actEarlyHint(a.id) : L.actHint(a.id);
      const pips = k ? '<span class="pips" aria-hidden="true">' + "●".repeat(Math.min(k, 8)) + "</span>" : "";
      return '<div class="act' + (k ? " has" : "") + (used < n && !done ? " open" : "") + '" data-card="' + a.id + '" style="--c:var(' + actColor(a) + ')">' +
        '<span class="ic" aria-hidden="true">' + actIcon(a.id) + "</span>" +
        '<div class="lbl">' + esc(nm) + (study ? " " + aptBadge(g.aptitude[a.subject]) : "") + "<small>" + esc(hint) + "</small>" + pips + '</div><div class="stepper">' +
        '<button type="button" data-a="' + a.id + '" data-d="-1" aria-label="' + esc(T("plan.less", { a: nm })) + '"' + (k && !done ? "" : " disabled") + ">−</button>" +
        '<span class="n">' + k + "</span>" +
        '<button type="button" data-a="' + a.id + '" data-d="1" aria-label="' + esc(T("plan.more", { a: nm })) + '"' + (used < n && !done ? "" : " disabled") + ">+</button></div></div>";
    };
    const study = acts.filter((a) => a.kind === "study" || a.kind === "play"), life = acts.filter((a) => a.kind !== "study" && a.kind !== "play");
    els.activities.innerHTML = '<h3 class="grp">' + esc(T(early ? "plan.play" : "plan.study")) + "</h3>" + study.map(card).join("") +
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
    // School lessons add to every subject on their own; say so, and say when they're gone.
    els.lessonNote.textContent = done ? "" : g.isEarly() ? T("plan.early") + (g.atKinder() && g.schoolInfo().id !== "homeCare" ? " " + T("plan.kinder") : "") : g.inClass() ? T("plan.lessons") : g.dropout != null && (g.inSchool() || g.status === "hs3") ? T("plan.noLessons") : "";
    els.lessonNote.classList.toggle("hidden", !els.lessonNote.textContent);
    // Leaving school is offered from grade 7 until you do it.
    const qb = g.quitBlock();
    els.quitBtn.classList.toggle("hidden", done || qb === "done" || qb === "grade");
  }

  function changePlan(id, d) {
    plan[id] = Math.max(0, (plan[id] || 0) + d);
    if (!plan[id]) delete plan[id];
    renderPlan();
  }
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
  els.nextBtn.addEventListener("click", () => {
    const was = game.status;
    lastMove = null; // the route of a move stays on the map until the next turn
    try {
      game.advance(plan, method);
    } catch (err) {
      els.planErr.textContent = err.message;
      return;
    }
    plan = game.queue.length ? {} : defaultPlan();
    save();
    render();
    showTurn(was);
  });

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
  function renderMap() {
    const g = game;
    const states = moveStates(g);
    const canMove = Object.keys(states).some((id) => states[id] === "open");
    els.mapHome.textContent = "📍 " + L.region(g.region);
    els.mapHint.textContent = g.ending ? "" : canMove ? T("map.tapHint") : T("map.noMove");
    // Redrawing restarts the pin's pulse, so only redraw when something on it changed.
    const route = lastMove && lastMove.to === g.region ? lastMove : null;
    const rs = g.realSchool();
    const key = JSON.stringify([states, route, lang, rs && rs.name]);
    if (key === mapKey) return;
    mapKey = key;
    els.mainMap.innerHTML = Art.koreaMap({ states, sel: route ? route.to : null, from: route ? route.from : null, home: g.region, schools: schoolStar(g), labels: mapLabels(), aria: T("map.aria", { reg: g.region }) });
  }
  els.mainMap.addEventListener("click", (e) => {
    const pt = e.target.closest("[data-place]");
    openMove(pt ? pt.dataset.place : null);
  });
  els.mainMap.addEventListener("keydown", (e) => {
    const pt = e.target.closest("[data-place]");
    if (pt && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openMove(pt.dataset.place); }
  });
  els.moveBtn.addEventListener("click", () => openMove(null));
  function openMove(preselect) {
    const g = game;
    if (!g || g.ending || g.queue.length) return;
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
    const legend = '<div class="map-legend"><span><i class="lh"></i>' + esc(T("map.home")) + '</span><span><i class="lo"></i>' + esc(T("map.open")) + '</span><span><i class="lc"></i>' + esc(T("map.closed")) + "</span></div>";
    openModal(T("move.title"), "<p>" + esc(T("move.text")) + "</p>" + warn + legend + '<div class="map-wrap" id="moveMap"></div><div class="map-card" id="moveCard"></div>' +
      '<details class="map-list"><summary>' + esc(T("move.list")) + '</summary><div class="unis">' + rows + "</div></details>", [
      { label: T("move.stay"), run: () => render() },
      { label: T("move.go"), primary: true, run: () => { if (!pick.id) return; lastMove = { from: g.region, to: pick.id }; g.move(pick.id); save(); render(); } },
    ]);
    const go = els.modalButtons.querySelector("button.primary");
    const mapBox = $("moveMap"), card = $("moveCard");
    // Any place can be looked at; only an open one can be moved to.
    const select = (id, refocus) => {
      const x = info[id];
      pick.id = x && !x.here && !x.why ? id : null;
      go.disabled = !pick.id;
      mapBox.innerHTML = Art.koreaMap({ states, sel: id, from: pick.id ? g.region : null, home: g.region, schools: schoolStar(g), labels: mapLabels(), aria: T("map.aria", { reg: g.region }) });
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

  // Leaving school: what it gives and what it takes, then a confirmation.
  els.quitBtn.addEventListener("click", () => {
    const g = game;
    if (!g || g.quitBlock()) return;
    const list = (k) => "<ul>" + T(k).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
    openModal(T("quit.title"), "<p>" + esc(T("quit.text")) + '</p><div class="quit"><div class="pros"><h3>' + esc(T("quit.pros")) + "</h3>" + list("quit.pro") +
      '</div><div class="cons"><h3>' + esc(T("quit.cons")) + "</h3>" + list("quit.con") + "</div></div>", [
      { label: T("quit.stay"), run: () => render() },
      { label: T("quit.go"), primary: true, run: () => { g.quitSchool(); save(); render(); } },
    ], Art.eventArt(artCtx({ id: "dropout", stage: "dropout" })));
    // Start on the safe answer: this can't be undone.
    els.modalButtons.querySelector("button").focus({ preventScroll: true });
  });

  // Confirmation lives in the page's own modal: embedded viewers block confirm() dialogs.
  function startOver() { store.del(SAVE_KEY); game = null; showSetup(); }
  els.newLifeBtn.addEventListener("click", () => {
    if (!game || game.ending) return startOver();
    openModal(T("newLife.title"), "<p>" + esc(T("newLife.text")) + "</p>", [
      { label: T("newLife.keep"), run: () => render() },
      { label: T("newLife.go"), primary: true, run: startOver },
    ]);
  });

  // The life log reads like a diary: newest first, a heading for each school year (March to February)
  // with your age, and an icon for each kind of entry.
  const LOG_ICON = {
    "log.born": "👶", "log.stage": "🏫", "log.grade": "🎒", "log.teacher": "🍎", "log.report": "📊", "log.sebae": "🧧", "log.track": "🔀",
    "log.birthday": "🎂", "log.dropout": "🚪", "log.ged": "📜", "log.early": "⏩", "log.school": "🏫", "log.schoolMove": "🏫",
    "log.month": "🗓️", "log.mock": "📝", "log.suneung": "🎯", "log.apply": "📮", "log.enroll": "🎓", "log.quit": "🚪", "log.halfpay": "💸", "log.newyear": "🌱",
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
      els.history.innerHTML = '<tr><td class="muted">' + esc(T("history.empty")) + "</td></tr>";
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
        c2.fillText(L.phase(tr[i].ph), x(i) + 4, h - 6);
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
  // art: an illustration from art.js shown above the title, or nothing.
  function openModal(title, body, buttons, art) {
    els.modalArt.innerHTML = art || "";
    els.modalArt.classList.toggle("hidden", !art);
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = body;
    els.modalButtons.innerHTML = "";
    for (const b of buttons || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.primary) btn.className = "primary";
      btn.addEventListener("click", b.run);
      els.modalButtons.appendChild(btn);
    }
    els.modal.classList.remove("hidden");
    // Each new screen pops in, even when the modal was already open.
    const card = els.modal.firstElementChild;
    card.scrollTop = 0;
    card.classList.remove("pop");
    void card.offsetWidth;
    card.classList.add("pop");
    const first = els.modal.querySelector("button.primary, .choices button, .decide button, button");
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() { els.modal.classList.add("hidden"); }
  function after() { save(); render(); }

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
      const art = outcome.id ? Art.eventArt(artCtx({ id: outcome.id, variant: outcome.variant })) : "";
      openModal(outcome.title, '<div class="outcome">' + esc(T(outcome.msg.key, outcome.msg.p)) + "</div>",
        [{ label: T("continue"), primary: true, run: () => { outcome = null; after(); } }], art);
      return;
    }
    const top = g.queue[0];
    if (!top) {
      if (g.ending && !g.endingSeen) return showEnding();
      closeModal();
      return;
    }
    if (top.type === "birth") return showBirth();
    if (top.type === "track") return showTrack();
    if (top.type === "school") return showSchool(top);
    if (top.type === "event") return showEvent(top);
    if (top.type === "mock") return showMock(top);
    if (top.type === "exam") return examStep === 0 ? showExamDay(top) : showReport(top);
    if (top.type === "apply") return showApply(top);
    if (top.type === "offers") return showOffers(top);
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
        ((g.parents || "both") !== "both" ? " " + T("birth.parents", { par: g.parents }) : "")) + "</p>" +
      // Where on the peninsula the family starts.
      "<h3>" + esc(T("map.born")) + '</h3><div class="map-wrap">' + Art.koreaMap({ states: bornStates(g), static: true, home: g.region, labels: mapLabels(), aria: T("map.aria", { reg: g.region }) }) + "</div>" +
      "<h3>" + esc(T("birth.talent")) + "</h3>" + talentBars(g) + '<p class="muted">' + esc(T("birth.note")) + "</p>",
      [{ label: T("birth.go"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("birth", artCtx({ stage: "baby" })));
  }
  // Picking a school: every option for the stage with what it does, what it costs, the chance of
  // getting in, and why it's closed. The default public school is always open.
  function showSchool(top) {
    const g = game;
    const opts = g.schoolOptions();
    const pick = { id: opts.find((o) => o.def).id };
    const desc = T("school.desc");
    // Options with a real school get a number, shared by the row and its marker on the area map.
    let n = 0;
    for (const o of opts) if (o.real) o.n = ++n;
    const rows = opts.map((o) => {
      const why = o.blocked ? T("school.no." + (o.blocked === "admit" && o.id === "artsHigh" ? "arts" : o.blocked)) : "";
      const cls = o.def ? "ch-safe" : o.blocked ? "ch-long" : o.p >= 0.55 ? "ch-match" : o.p >= 0.25 ? "ch-reach" : "ch-long";
      const tag = '<span class="chance ' + cls + '" title="' + esc(T("school.chance", { p: o.p, def: o.def })) + '">' + esc(o.def ? T("school.tag.def") : o.blocked ? T("school.tag.no") : Math.round(o.p * 100) + "%") + "</span>";
      const facts = [T("school.fee", { fee: o.fee }), o.track ? T("school.track", { t: o.track }) : ""].filter(Boolean).join(" · ");
      // A special school is the nearest one in the country, which can be a long way from home.
      const where = o.real ? (o.real.city && o.real.km >= 15 ? T("school.realFar", { city: o.real.city, km: o.real.km }) : T("school.realHere")) : "";
      const real = o.real ? '<small class="real"><b class="num">' + o.n + "</b> " + esc(L.realSchool(o.real.name)) + " · " + esc(where) + "</small>" : "";
      return '<label class="uni region' + (o.blocked ? " off" : "") + '"><input type="radio" name="schoolPick" value="' + o.id + '"' + (o.blocked ? " disabled" : "") + (o.def ? " checked" : "") + ">" +
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
        outcome = { title: t[top.stage], msg, id: "school", variant: msg.key.split(".").pop() };
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
    let track = only || (g.skills.math + g.skills.inq2 > g.skills.kor + g.skills.inq1 ? "sci" : "soc");
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
      a.value = INQUIRY[track][0].id; b.value = INQUIRY[track][1].id;
    };
    seg.addEventListener("click", (e) => { const btn = e.target.closest("button[data-v]"); if (btn && !btn.disabled) { track = btn.dataset.v; fill(); } });
    // The two inquiry subjects must differ.
    const fix = (changed, other) => { if (changed.value === other.value) other.value = INQUIRY[track].map((x) => x.id).find((id) => id !== changed.value); };
    a.addEventListener("change", () => fix(a, b));
    b.addEventListener("change", () => fix(b, a));
    fill();
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
    if (!ev.choices) {
      openModal(title, '<p class="story">' + esc(T(ev.result.key, ev.result.p)) + "</p>", [{ label: T("ok"), primary: true, run: () => { game.dismiss(); after(); } }],
        Art.eventArt(artCtx({ id: ev.id, variant: variantOf(ev.result) })));
      return;
    }
    openModal(title, '<p class="story">' + esc(T("ev." + ev.id + ".text")) + '</p><div class="choices"></div>', [], Art.eventArt(artCtx({ id: ev.id })));
    const box = els.modalBody.querySelector(".choices");
    T("ev." + ev.id + ".c").forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="cn" aria-hidden="true">' + (i + 1) + "</span>" + esc(label);
      b.addEventListener("click", () => {
        const msg = game.choose(i);
        outcome = { title, msg, id: ev.id, variant: variantOf(msg) };
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
    openModal(T("mock.title", { name: L.mock(r.month, r.school) }),
      "<p>" + esc(T("mock.text")) + "</p>" + reportTable(r) +
      '<p class="muted" style="margin-top:10px">' + esc(T("mock.total", { n: r.total })) + "</p>",
      [{ label: T("mock.back"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("mock", artCtx()));
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
      Art.screenArt("exam", artCtx({ stage: game.status })));
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
      Art.screenArt("report", artCtx()));
    countUp($("cTotal"), r.total, 0);
    countUp($("cScore"), score, 1);
  }

  function chanceClass(p) { return p >= 0.85 ? "ch-safe" : p >= 0.55 ? "ch-match" : p >= 0.25 ? "ch-reach" : "ch-long"; }
  function showApply(top) {
    const opts = game.options();
    const picked = new Set();
    const body =
      "<p>" + esc(T("apply.text", { s: top.score.toFixed(1) })) + "</p>" +
      '<div class="unis">' + opts.map((o) =>
        '<label class="uni' + (o.blocked ? " off" : "") + '"><input type="checkbox" value="' + o.id + '"' + (o.blocked ? " disabled" : "") + '><span class="nm">' + esc(L.uni(o.id)) +
        "<small>" + esc(o.blocked ? T("apply.sciOnly") : T("apply.chance", { p: Math.round(o.p * 100) }) + (o.quota ? " · " + T("apply.quota." + o.quota) : "")) +
        '</small></span><span class="chance ' + chanceClass(o.p) + '">' + esc(L.chance(o.label)) + "</span></label>").join("") +
      "</div>";
    openModal(T("apply.title"), body, [
      { label: T("apply.submit", { n: 0 }), primary: true, run: () => {
        if (!picked.size) return;
        game.apply(Array.from(picked));
        after();
      } },
    ], Art.screenArt("apply", artCtx()));
    const boxes = els.modalBody.querySelectorAll("input[type=checkbox]");
    const submit = els.modalButtons.querySelector("button");
    const sync = () => {
      for (const b of boxes) if (!b.checked) b.disabled = picked.size >= 3 || !!opts.find((o) => o.id === b.value).blocked;
      for (const b of boxes) b.closest(".uni").classList.toggle("picked", b.checked);
      submit.textContent = T("apply.submit", { n: picked.size });
      submit.disabled = !picked.size;
    };
    for (const b of boxes) b.addEventListener("change", () => { if (b.checked) picked.add(b.value); else picked.delete(b.value); sync(); });
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
      '<div class="result" style="--i:' + i + '"><span>' + esc(L.uni(r.id)) + "</span>" + (r.admitted ? '<span class="stamp ok">' + esc(T("offers.yes")) + "</span>" : '<span class="stamp no">' + esc(T("offers.no")) + "</span>") + "</div>").join("");
    const offerIds = top.offers.slice();
    if (g.enrolled && offerIds.indexOf(g.enrolled) < 0) offerIds.push(g.enrolled);
    offerIds.sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b));
    const btn = (cls, icon, label, small, data) => '<button type="button" class="' + cls + '" data-act="' + data + '"><span class="di" aria-hidden="true">' + icon + "</span><span>" + esc(label) + "<small>" + esc(small) + "</small></span></button>";
    let html = "<p>" + esc(T("offers.intro", { y: g.year + 1 })) + '</p><div class="results">' + results + '</div><div class="decide">';
    offerIds.forEach((id, i) => {
      const kept = id === g.enrolled && top.offers.indexOf(id) < 0;
      html += btn(i === 0 ? "primary" : "", "🎓", T("offers.enroll", { uni: L.uni(id) }), T(kept ? "offers.enroll.kept" : "offers.enroll.sub"), "enroll:" + id);
    });
    if (offerIds.length) {
      const uni = L.uni(offerIds[0]);
      html += btn("", "🤫", T("offers.half", { uni }), T("offers.half.sub", { uni }), "halfretake:" + offerIds[0]);
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
    openModal(T(offerIds.length ? "offers.title" : "offers.none"), html, [],
      Art.screenArt("offers", artCtx({ label: top.offers.length ? L.uni(top.offers[0]) : "", mood: top.offers.length ? "happy" : "tired" })));
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
    const best = e.best;
    const gr = best ? [best.subjects.kor.grade, best.subjects.math.grade, best.subjects.eng.grade] : null;
    if (!g.endingRecorded && best) {
      addFame({ name: g.name, total: best.total, g: gr, uni: u ? u.id : null, attempts: e.attempts });
      g.endingRecorded = true;
      save(); // so reopening the finished life doesn't add the same entry again
      if (u) setTimeout(() => confetti(120), 300);
    }
    const verdict = !u ? "end.none" : u.id === "med" ? "end.med" : ["snu", "yonsei", "korea"].indexOf(u.id) >= 0 ? "end.sky" :
      u.cut >= 93 ? "end.top" : u.cut >= 85 ? "end.solid" : "end.fresh";
    const tile = (k, v) => '<div><span class="k">' + esc(T(k)) + '</span><span class="v">' + esc(v) + "</span></div>";
    openModal(u ? T("end.title", { uni: L.uni(u.id) }) : T("end.titleNone"),
      '<p class="story">' + esc(T(verdict)) + '</p><div class="summary">' +
      tile("end.attempts", e.attempts) + tile("end.age", L.age(e.age)) + tile("end.best", best ? best.total : "—") + tile("end.grades", gr ? gr.join("·") : "—") +
      '</div><p class="muted">' + esc(T("end.note")) + "</p>",
      [
        { label: T("end.look"), run: () => { g.endingSeen = true; after(); } },
        { label: T("newLife"), primary: true, run: startOver },
      ],
      Art.screenArt("ending", artCtx({ stage: "uni", label: u ? L.uni(u.id) : "", mood: u ? "happy" : "ok" })));
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
      return film("results-" + r.year, "results", { grades: gr, react: avg <= 2.5 ? "happy" : avg <= 4.5 ? "ok" : "tired" }, { t: r.total });
    }
    if (top && top.type === "offers" && top.offers.length) {
      const best = top.offers.slice().sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b))[0];
      return film("offers-" + g.year + "-" + g.attempt, "offers", {}, { uni: L.uni(best) });
    }
    if (top) return null;
    if (g.ending) {
      if (g.endingSeen) return null;
      const uni = g.ending.uni ? L.uni(g.ending.uni) : "";
      return film("end", "end", { stage: "uni", label: uni }, { uni, name: g.name, age: L.age(g.ending.age) }, uni ? "end" : "endroad");
    }
    // Moving house (by choice or by an event) this turn.
    if (g.flags.lastMove != null && g.flags.lastMove === g.clock) return film("move-" + g.clock, "move", {}, { region: L.region(g.region) });
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
    cut = { c, shots, i: -1, timer: 0, capKey: c.cap };
    els.cutFrame.innerHTML = "";
    els.cutProg.innerHTML = shots.map(() => "<i><b></b></i>").join("");
    els.cutSkip.textContent = T("cut.skip");
    els.cutHint.textContent = T("cut.next");
    els.cut.setAttribute("aria-label", T("cut.label"));
    els.cut.classList.remove("hidden");
    document.body.classList.add("cutting");
    els.cutSkip.focus({ preventScroll: true });
    nextShot();
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
    cut = null;
    els.cut.classList.add("hidden");
    els.cutFrame.innerHTML = "";
    document.body.classList.remove("cutting");
    render();
  }
  els.cutSkip.addEventListener("click", (e) => { e.stopPropagation(); endCut(); });
  els.cut.addEventListener("click", () => nextShot());
  document.addEventListener("keydown", (e) => {
    if (!cut) return;
    if (e.key === "Escape") { e.preventDefault(); endCut(); }
    else if ((e.key === "Enter" || e.key === " ") && e.target !== els.cutSkip) { e.preventDefault(); nextShot(); }
  });

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
