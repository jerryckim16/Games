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
    setup: $("setup"), game: $("game"), name: $("name"), startBtn: $("startBtn"), resumeBtn: $("resumeBtn"), fame: $("fame"),
    sDate: $("sDate"), sDday: $("sDday"), sAttempt: $("sAttempt"), sStatus: $("sStatus"), sAge: $("sAge"),
    sName: $("sName"), sMoney: $("sMoney"), sAllowance: $("sAllowance"),
    skills: $("skills"), condition: $("condition"), planTitle: $("planTitle"), blocksLeft: $("blocksLeft"),
    method: $("method"), methodNote: $("methodNote"), activities: $("activities"), planCost: $("planCost"),
    planErr: $("planErr"), repeatBtn: $("repeatBtn"), clearBtn: $("clearBtn"), nextBtn: $("nextBtn"),
    chart: $("chart"), legend: $("legend"), log: $("log"), history: $("history"), newLifeBtn: $("newLifeBtn"),
    modal: $("modal"), modalTitle: $("modalTitle"), modalBody: $("modalBody"), modalButtons: $("modalButtons"),
    modalArt: $("modalArt"), setupArt: $("setupArt"), scene: $("scene"), moodName: $("moodName"), moodText: $("moodText"),
    slots: $("slots"), turn: $("turn"), turnCap: $("turnCap"), turnDate: $("turnDate"), turnAge: $("turnAge"), confetti: $("confetti"),
  };
  const Art = window.SuneungArt;
  // Animations are decoration: with reduced motion the page skips the turn page, confetti and count-ups
  // (styles.css stops the CSS ones).
  const calm = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Emoji icons for activities, study methods and condition. Inquiry icons follow the track.
  const ACT_ICON = { kor: "📖", math: "📐", eng: "🔤", hist: "🏯", reading: "📚", arts: "🎹", mock: "⏱️", rest: "😴", exercise: "🏃", friends: "🧑‍🤝‍🧑", games: "🎮", job: "🏪" };
  const ACT_COLOR = { reading: "--a-c5", arts: "--a-c4", mock: "--a-c1", rest: "--a-c3", exercise: "--pos", friends: "--a-c2", games: "--a-c4", job: "--a-gold" };
  const METHOD_ICON = { self: "✏️", online: "💻", hagwon: "🏫", tutor: "🧑‍🏫" };
  function actIcon(id) {
    const tr = game && game.track;
    if (id === "inq1") return tr === "sci" ? "🔬" : "🌏";
    if (id === "inq2") return tr === "soc" ? "🏛️" : tr === "sci" ? "🧪" : "🔬";
    return ACT_ICON[id] || "•";
  }
  function actColor(a) { return a.kind === "study" ? subColor[a.subject] : ACT_COLOR[a.id] || "--accent"; }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  function ctx() { return game ? { inq: game.inq, track: game.track } : { inq: null, track: null }; }
  let lang = store.get(LANG_KEY);
  if (lang !== "en" && lang !== "ko") lang = /^ko\b/i.test(navigator.language || "") ? "ko" : "en";
  let L = window.SuneungText.make(lang, ctx);
  const T = (k, p) => L.t(k, p);

  function applyStatic() {
    document.documentElement.lang = T("lang.html");
    document.title = T("app.title");
    for (const el of document.querySelectorAll("[data-t]")) el.textContent = T(el.dataset.t);
    els.name.placeholder = T("setup.namePh");
    for (const b of els.lang.querySelectorAll("button")) b.classList.toggle("on", b.dataset.v === lang);
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
  // Only a name: family and talent are dealt at birth.
  function renderSetup() {
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
  els.startBtn.addEventListener("click", () => {
    game = new Game({ name: els.name.value.trim() || T("setup.namePh"), startYear: new Date().getFullYear() });
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
      stage: g.ending ? "uni" : g.status,
      season: Art.seasonOf(g.month),
      look: Art.lookFor(g.seed),
      mood: Art.moodOf(g),
      family: g.family,
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
    }
    const thoughts = T("mood." + c.mood);
    els.moodName.textContent = T("mood.name." + c.mood);
    els.moodText.textContent = Array.isArray(thoughts) ? thoughts[Math.abs(g.clock + g.seed) % thoughts.length] : "";
    els.moodName.parentElement.dataset.mood = c.mood;
  }

  function renderStats() {
    const g = game;
    els.sDate.textContent = L.date(g.year, g.month);
    const d = g.daysToExam();
    const school = g.inSchool();
    els.sDday.textContent = g.ending ? T("stat.over") : school ? T("stat.years", { n: 12 - g.grade }) :
      g.month <= 11 ? (d > 0 ? T("stat.dday", { n: d }) : T("stat.examMonth")) : T("stat.results");
    els.sAttempt.textContent = school ? L.schoolGrade(g.grade) : L.att(g.attempt);
    els.sStatus.textContent = L.status(g.status);
    els.sAge.textContent = L.age(g.age);
    els.sName.textContent = g.name + (g.track ? " · " + L.track(g.track) : "");
    els.sMoney.textContent = L.wonShort(g.money);
    els.sAllowance.textContent = T("stat.allowance", { a: L.wonShort(g.allowance()) });
  }

  // from: where the fill starts, so a fresh turn can grow the bar from last turn's value.
  function bar(name, value, color, delta, title, icon, from) {
    const v = Math.max(0, Math.min(100, value));
    const start = from == null ? v : Math.max(0, Math.min(100, from));
    let d = "", pop = "";
    if (delta && Math.abs(delta) >= 0.5) {
      const txt = (delta > 0 ? "+" : "") + Math.round(delta);
      d = '<span class="delta ' + (delta > 0 ? "up" : "down") + '">' + txt + "</span>";
      if (from != null) pop = '<span class="gain ' + (delta > 0 ? "up" : "down") + '" aria-hidden="true">' + txt + "</span>";
    }
    return '<div class="bar"' + (title ? ' title="' + esc(title) + '"' : "") + '><span class="name">' + (icon ? '<span class="bi" aria-hidden="true">' + icon + "</span>" : "") + esc(name) +
      '</span><span class="track"><span class="fill" data-w="' + v + '" style="width:' + start + "%;background:" + color + '"></span></span><span class="val">' + Math.round(value) + d + pop + "</span></div>";
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
      return bar(L.sub(s), S.skillScore(g.skills[s]), "var(" + subColor[s] + ")", delta, T("ability.tip", { a: g.aptitude[s] }), actIcon(s), from);
    }).join("");
    const lvl = (v, goodHigh) => {
      const x = goodHigh ? v : 100 - v;
      return x >= 60 ? "var(--pos)" : x >= 35 ? "var(--warn)" : "var(--neg)";
    };
    els.condition.innerHTML =
      bar(T("cond.health"), g.health, lvl(g.health, true), 0, T("cond.health.tip"), "❤️") +
      bar(T("cond.stress"), g.stress, lvl(g.stress, false), 0, T("cond.stress.tip"), "😣") +
      bar(T("cond.motivation"), g.motivation, lvl(g.motivation, true), 0, T("cond.motivation.tip"), "🔥") +
      bar(T("cond.practice"), g.practice * 100, "var(--accent)", 0, T("cond.practice.tip"), "⏱️");
    if (animate) {
      // Two frames: the first paints the old width, the second lets the CSS transition run.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const f of els.skills.querySelectorAll(".fill[data-w]")) f.style.width = f.dataset.w + "%";
      }));
    }
  }

  function renderPlan() {
    const g = game;
    const n = g.blocks();
    const used = planTotal();
    const done = !!g.ending;
    els.planTitle.parentElement.parentElement.classList.toggle("ended", done);
    const mock = MOCKS[g.month] && !(g.month === 3 && g.status !== "hs3");
    els.planTitle.textContent = done ? T("plan.done") :
      T("plan.title", { m: g.month, mock, exam: g.month === 11, st: g.status, g: g.grade, track: g.grade === 10 && g.month === 12 });
    els.blocksLeft.textContent = done ? "" : T("plan.left", { l: n - used, n });
    els.blocksLeft.classList.toggle("done", used === n);
    els.blocksLeft.classList.toggle("hidden", done);

    const fixed = g.methodFixed();
    els.method.innerHTML = Object.keys(METHODS).map((id) => {
      const on = (fixed || method) === id;
      return '<button type="button" data-v="' + id + '" class="' + (on ? "on" : "") + '"' + (fixed || done ? " disabled" : "") + '><span aria-hidden="true">' + METHOD_ICON[id] + " </span>" + esc(L.method(id)) + "</button>";
    }).join("");
    const m = METHODS[fixed || method];
    els.methodNote.textContent = fixed ? T("plan.methodFixed", { x: m.mult }) : T("plan.methodNote", { x: m.mult, cost: m.cost, sens: m.sens });

    // Activities are cards: tap the card (or +) to give it a block, − to take one back.
    const acts = g.activities();
    const name = (a) => (a.kind === "study" ? L.sub(a.subject) : L.actLong(a.id));
    const card = (a) => {
      const k = plan[a.id] || 0;
      const study = a.kind === "study";
      const nm = name(a);
      const hint = study ? T("plan.studyHint", { v: S.skillScore(g.skills[a.subject]), s: a.subject }) : L.actHint(a.id);
      const pips = k ? '<span class="pips" aria-hidden="true">' + "●".repeat(Math.min(k, 8)) + "</span>" : "";
      return '<div class="act' + (k ? " has" : "") + (used < n && !done ? " open" : "") + '" data-card="' + a.id + '" style="--c:var(' + actColor(a) + ')">' +
        '<span class="ic" aria-hidden="true">' + actIcon(a.id) + "</span>" +
        '<div class="lbl">' + esc(nm) + "<small>" + esc(hint) + "</small>" + pips + '</div><div class="stepper">' +
        '<button type="button" data-a="' + a.id + '" data-d="-1" aria-label="' + esc(T("plan.less", { a: nm })) + '"' + (k && !done ? "" : " disabled") + ">−</button>" +
        '<span class="n">' + k + "</span>" +
        '<button type="button" data-a="' + a.id + '" data-d="1" aria-label="' + esc(T("plan.more", { a: nm })) + '"' + (used < n && !done ? "" : " disabled") + ">+</button></div></div>";
    };
    const study = acts.filter((a) => a.kind === "study"), life = acts.filter((a) => a.kind !== "study");
    els.activities.innerHTML = '<h3 class="grp">' + esc(T("plan.study")) + "</h3>" + study.map(card).join("") +
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
  }
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
    if (top.type === "event") return showEvent(top);
    if (top.type === "mock") return showMock(top);
    if (top.type === "exam") return examStep === 0 ? showExamDay(top) : showReport(top);
    if (top.type === "apply") return showApply(top);
    if (top.type === "offers") return showOffers(top);
    closeModal();
  }

  function talentBars(g) {
    return '<div class="talent">' + SUBJECTS.map((s) => {
      const v = S.skillScore(g.skills[s]);
      const apt = g.aptitude[s];
      const stars = apt >= 1.25 ? "★★★" : apt >= 1.05 ? "★★" : apt >= 0.88 ? "★" : "·";
      return '<div class="bar"><span class="name"><span class="bi" aria-hidden="true">' + actIcon(s) + "</span>" + esc(L.sub(s)) + '</span><span class="track"><span class="fill" style="width:' + v +
        "%;background:var(" + subColor[s] + ')"></span></span><span class="val">' + v + '</span><span class="apt" title="' + esc(T("setup.apt")) + '">' + stars + "</span></div>";
    }).join("") + "</div>";
  }
  function showBirth() {
    const g = game;
    openModal(T("birth.title"),
      "<p>" + esc(T("birth.text", { name: g.name, fam: g.family, inc: FAMILIES[g.family].income, a: g.allowance() })) + "</p>" +
      "<h3>" + esc(T("birth.talent")) + "</h3>" + talentBars(g) + '<p class="muted">' + esc(T("birth.note")) + "</p>",
      [{ label: T("birth.go"), primary: true, run: () => { game.dismiss(); after(); } }],
      Art.screenArt("birth", artCtx({ stage: "elem" })));
  }
  function showTrack() {
    const g = game;
    let track = g.skills.math + g.skills.inq2 > g.skills.kor + g.skills.inq1 ? "sci" : "soc";
    openModal(T("track.title"),
      "<p>" + esc(T("track.text")) + "</p>" +
      '<div class="seg track-seg" id="trackSeg"><button type="button" data-v="soc"><span aria-hidden="true">🌏 </span>' + esc(L.track("soc")) +
      '</button><button type="button" data-v="sci"><span aria-hidden="true">🔬 </span>' + esc(L.track("sci")) + "</button></div>" +
      '<small class="muted" id="trackNote"></small>' +
      '<div class="field"><div class="two"><select id="inqA" aria-label="' + esc(L.subShort("inq1")) + '"></select><select id="inqB" aria-label="' + esc(L.subShort("inq2")) + '"></select></div>' +
      "<small>" + esc(T("track.inqNote")) + "</small></div>",
      [{ label: T("track.go"), primary: true, run: () => { game.chooseTrack(track, [$("inqA").value, $("inqB").value]); plan = {}; after(); } }],
      Art.screenArt("track", artCtx()));
    const seg = $("trackSeg"), a = $("inqA"), b = $("inqB");
    const fill = () => {
      for (const btn of seg.querySelectorAll("button")) btn.classList.toggle("on", btn.dataset.v === track);
      $("trackNote").textContent = T("track.note." + track);
      const opts = INQUIRY[track].map((x) => '<option value="' + x.id + '">' + esc(L.inq(x.id)) + "</option>").join("");
      a.innerHTML = opts; b.innerHTML = opts;
      a.value = INQUIRY[track][0].id; b.value = INQUIRY[track][1].id;
    };
    seg.addEventListener("click", (e) => { const btn = e.target.closest("button[data-v]"); if (btn) { track = btn.dataset.v; fill(); } });
    // The two inquiry subjects must differ.
    const fix = (changed, other) => { if (changed.value === other.value) other.value = INQUIRY[track].map((x) => x.id).find((id) => id !== changed.value); };
    a.addEventListener("change", () => fix(a, b));
    b.addEventListener("change", () => fix(b, a));
    fill();
  }

  function eventTitle(ev) {
    if (ev.id === "eve" || ev.id === "lunch") return T("ev." + ev.id + ".title");
    return game.inSchool() ? L.schoolGrade(game.grade) + " · " + L.date(game.year, game.month) : L.date(game.year, game.month);
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
        "<small>" + esc(o.blocked ? T("apply.sciOnly") : T("apply.chance", { p: Math.round(o.p * 100) })) + '</small></span><span class="chance ' + chanceClass(o.p) + '">' + esc(L.chance(o.label)) + "</span></label>").join("") +
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
      const sub = o.blocked ? T("offers." + o.blocked) : (o.scholarship ? T("offers.scholarship") : "") + T("offers." + o.id + ".sub");
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

  // ---------- boot ----------
  applyStatic();
  game = loadSave();
  if (game && !game.ending) showGame();
  else showSetup();
})();
