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
  };

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
  function renderSetup() { renderFame(); }
  function renderFame() {
    const list = loadFame();
    if (!list.length) {
      els.fame.innerHTML = '<tr><td class="muted">' + esc(T("fame.empty")) + "</td></tr>";
      return;
    }
    const h = T("fame.h");
    els.fame.innerHTML = "<thead><tr>" + h.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
      list.map((e, i) => "<tr><td>" + (i + 1) + '</td><td class="l">' + esc(e.name) + "</td><td>" + e.total + "</td><td>" + e.g.join("·") +
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
    renderStats();
    renderBars();
    renderPlan();
    renderLog();
    renderHistory();
    drawChart();
    renderModal();
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

  function bar(name, value, color, delta, title) {
    const v = Math.max(0, Math.min(100, value));
    let d = "";
    if (delta && Math.abs(delta) >= 0.5) d = '<span class="delta ' + (delta > 0 ? "up" : "down") + '">' + (delta > 0 ? "+" : "") + Math.round(delta) + "</span>";
    return '<div class="bar"' + (title ? ' title="' + esc(title) + '"' : "") + '><span class="name">' + esc(name) + '</span><span class="track"><span class="fill" style="width:' + v +
      "%;background:" + color + '"></span></span><span class="val">' + Math.round(value) + d + "</span></div>";
  }
  function renderBars() {
    const g = game;
    const prev = g.trace.length > 1 ? g.trace[g.trace.length - 2].skills : null;
    els.skills.innerHTML = SUBJECTS.map((s) => {
      const fresh = g.trace[g.trace.length - 1].track && (s === "inq1" || s === "inq2");
      const delta = prev && !fresh ? (g.skills[s] - prev[s]) * 16.67 : 0;
      return bar(L.sub(s), S.skillScore(g.skills[s]), "var(" + subColor[s] + ")", delta, T("ability.tip", { a: g.aptitude[s] }));
    }).join("");
    const lvl = (v, goodHigh) => {
      const x = goodHigh ? v : 100 - v;
      return x >= 60 ? "var(--pos)" : x >= 35 ? "var(--warn)" : "var(--neg)";
    };
    els.condition.innerHTML =
      bar(T("cond.health"), g.health, lvl(g.health, true), 0, T("cond.health.tip")) +
      bar(T("cond.stress"), g.stress, lvl(g.stress, false), 0, T("cond.stress.tip")) +
      bar(T("cond.motivation"), g.motivation, lvl(g.motivation, true), 0, T("cond.motivation.tip")) +
      bar(T("cond.practice"), g.practice * 100, "var(--accent)", 0, T("cond.practice.tip"));
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
      return '<button type="button" data-v="' + id + '" class="' + (on ? "on" : "") + '"' + (fixed || done ? " disabled" : "") + ">" + esc(L.method(id)) + "</button>";
    }).join("");
    const m = METHODS[fixed || method];
    els.methodNote.textContent = fixed ? T("plan.methodFixed", { x: m.mult }) : T("plan.methodNote", { x: m.mult, cost: m.cost, sens: m.sens });

    els.activities.innerHTML = g.activities().map((a) => {
      const k = plan[a.id] || 0;
      const study = a.kind === "study";
      const name = study ? L.sub(a.subject) : L.actLong(a.id);
      const label = (study ? '<span class="sw" style="background:var(' + subColor[a.subject] + ')"></span>' : "") + esc(name);
      const hint = study ? T("plan.studyHint", { v: S.skillScore(g.skills[a.subject]), s: a.subject }) : L.actHint(a.id);
      return '<div class="act' + (k ? " has" : "") + '"><div class="lbl">' + label + "<small>" + esc(hint) + '</small></div><div class="stepper">' +
        '<button type="button" data-a="' + a.id + '" data-d="-1" aria-label="' + esc(T("plan.less", { a: name })) + '"' + (k && !done ? "" : " disabled") + ">−</button>" +
        '<span class="n">' + k + "</span>" +
        '<button type="button" data-a="' + a.id + '" data-d="1" aria-label="' + esc(T("plan.more", { a: name })) + '"' + (used < n && !done ? "" : " disabled") + ">+</button></div></div>";
    }).join("");

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

  els.activities.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b || b.disabled) return;
    const id = b.dataset.a;
    plan[id] = Math.max(0, (plan[id] || 0) + Number(b.dataset.d));
    if (!plan[id]) delete plan[id];
    renderPlan();
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
    try {
      game.advance(plan, method);
    } catch (err) {
      els.planErr.textContent = err.message;
      return;
    }
    plan = game.queue.length ? {} : defaultPlan();
    save();
    render();
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

  function renderLog() {
    const items = game.log.slice(-250).reverse();
    els.log.innerHTML = items.map((l) => '<li><span class="when">' + esc(L.dateShort(l.t)) + '</span><span class="' + esc(l.kind) + '">' + esc(T(l.key, l.p)) + "</span></li>").join("");
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
  function openModal(title, body, buttons) {
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
    const first = els.modal.querySelector("button.primary, .choices button, .decide button, button");
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() { els.modal.classList.add("hidden"); }
  function after() { save(); render(); }

  function renderModal() {
    const g = game;
    if (outcome) {
      openModal(outcome.title, '<div class="outcome">' + esc(T(outcome.msg.key, outcome.msg.p)) + "</div>",
        [{ label: T("continue"), primary: true, run: () => { outcome = null; after(); } }]);
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
      return '<div class="bar"><span class="name">' + esc(L.sub(s)) + '</span><span class="track"><span class="fill" style="width:' + v +
        "%;background:var(" + subColor[s] + ')"></span></span><span class="val">' + v + '</span><span class="apt" title="' + esc(T("setup.apt")) + '">' + stars + "</span></div>";
    }).join("") + "</div>";
  }
  function showBirth() {
    const g = game;
    openModal(T("birth.title"),
      '<div class="big-emoji">👶</div><p>' + esc(T("birth.text", { name: g.name, fam: g.family, inc: FAMILIES[g.family].income, a: g.allowance() })) + "</p>" +
      "<h3>" + esc(T("birth.talent")) + "</h3>" + talentBars(g) + '<p class="muted">' + esc(T("birth.note")) + "</p>",
      [{ label: T("birth.go"), primary: true, run: () => { game.dismiss(); after(); } }]);
  }
  function showTrack() {
    const g = game;
    let track = g.skills.math + g.skills.inq2 > g.skills.kor + g.skills.inq1 ? "sci" : "soc";
    openModal(T("track.title"),
      "<p>" + esc(T("track.text")) + "</p>" +
      '<div class="seg" id="trackSeg"><button type="button" data-v="soc">' + esc(L.track("soc")) + '</button><button type="button" data-v="sci">' + esc(L.track("sci")) + "</button></div>" +
      '<small class="muted" id="trackNote"></small>' +
      '<div class="field"><div class="two"><select id="inqA" aria-label="' + esc(L.subShort("inq1")) + '"></select><select id="inqB" aria-label="' + esc(L.subShort("inq2")) + '"></select></div>' +
      "<small>" + esc(T("track.inqNote")) + "</small></div>",
      [{ label: T("track.go"), primary: true, run: () => { game.chooseTrack(track, [$("inqA").value, $("inqB").value]); plan = {}; after(); } }]);
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
  function showEvent(ev) {
    const title = eventTitle(ev);
    if (!ev.choices) {
      openModal(title, "<p>" + esc(T(ev.result.key, ev.result.p)) + "</p>", [{ label: T("ok"), primary: true, run: () => { game.dismiss(); after(); } }]);
      return;
    }
    openModal(title, "<p>" + esc(T("ev." + ev.id + ".text")) + '</p><div class="choices"></div>', []);
    const box = els.modalBody.querySelector(".choices");
    T("ev." + ev.id + ".c").forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => {
        outcome = { title, msg: game.choose(i) };
        after();
      });
      box.appendChild(b);
    });
    box.querySelector("button").focus({ preventScroll: true });
  }

  function reportTable(res) {
    const h = T("report.h");
    const rows = SUBJECTS.map((k) => {
      const r = res.subjects[k];
      const absolute = k === "eng" || k === "hist";
      return '<tr><td class="l">' + esc(T("report.subject", { s: k, el: L.elective(k) })) + "</td><td>" + r.raw + '<span class="muted">/' + r.max + "</span></td>" +
        "<td>" + (absolute ? "—" : r.std) + "</td><td>" + (absolute ? "—" : r.pct) + "</td>" +
        "<td>" + gradeChip(r.grade) + '</td><td class="muted">' + (absolute ? (k === "eng" ? 90 : 40) : r.cut1) + "</td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="grid"><thead><tr>' + h.map((x) => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function showMock(top) {
    const r = top.result;
    openModal(T("mock.title", { name: L.mock(r.month, r.school) }),
      "<p>" + esc(T("mock.text")) + "</p>" + reportTable(r) +
      '<p class="muted" style="margin-top:10px">' + esc(T("mock.total", { n: r.total })) + "</p>",
      [{ label: T("mock.back"), primary: true, run: () => { game.dismiss(); after(); } }]);
  }

  const PERIODS = [
    { k: "kor", time: "08:40", n: 1 },
    { k: "math", time: "10:30", n: 2 },
    { k: "eng", time: "13:10", n: 3 },
    { k: "hist", time: "14:50", n: 4 },
    { k: "inq1", time: "15:35", n: 4 },
    { k: "inq2", time: "16:07", n: 4 },
  ];
  function showExamDay(top) {
    const r = top.result;
    const items = PERIODS.map((p) => {
      const x = r.subjects[p.k];
      const vibe = T("exam.vibe." + p.k)[x.grade <= 2 ? 0 : x.grade <= 4 ? 1 : 2];
      return '<li><span class="tm">' + p.time + "</span><span><b>" + esc(T("exam.period", { n: p.n, s: p.k })) + "</b><br>" + esc(vibe) +
        '</span><span class="rw">' + x.raw + '<span class="muted">/' + x.max + "</span></span></li>";
    }).join("");
    openModal(T("exam.title", { y: r.year + 1 }),
      '<div class="big-emoji">📝</div><p>' + esc(T("exam.intro", { y: r.year })) + "</p>" +
      '<ul class="periods">' + items + '</ul><p class="muted">' + esc(T("exam.outro")) + "</p>",
      [{ label: T("exam.next"), primary: true, run: () => { examStep = 1; render(); } }]);
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
      '<p class="headline">📰 ' + esc(T("report.headline." + r.headline.key, { s: r.headline.s })) + "</p>" + reportTable(r) +
      '<div class="summary"><div><span class="k">' + esc(T("report.total")) + '</span><span class="v">' + r.total + "</span> " + cmp +
      '</div><div><span class="k">' + esc(T("report.score")) + '</span><span class="v">' + score.toFixed(1) +
      '</span></div><div><span class="k">' + esc(T("report.attempt")) + '</span><span class="v">' + esc(L.att(r.attempt)) + "</span></div></div>" +
      '<p class="muted">' + esc(T("report.explain")) + "</p>",
      [{ label: T("report.apply"), primary: true, run: () => { examStep = 0; game.dismiss(); after(); } }]);
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
    ]);
    const boxes = els.modalBody.querySelectorAll("input[type=checkbox]");
    const submit = els.modalButtons.querySelector("button");
    const sync = () => {
      for (const b of boxes) if (!b.checked) b.disabled = picked.size >= 3 || !!opts.find((o) => o.id === b.value).blocked;
      submit.textContent = T("apply.submit", { n: picked.size });
      submit.disabled = !picked.size;
    };
    for (const b of boxes) b.addEventListener("change", () => { if (b.checked) picked.add(b.value); else picked.delete(b.value); sync(); });
    sync();
  }

  function showOffers(top) {
    const g = game;
    const results = top.results.map((r) =>
      '<div class="result"><span>' + esc(L.uni(r.id)) + "</span>" + (r.admitted ? '<span class="ok">' + esc(T("offers.yes")) + "</span>" : '<span class="no">' + esc(T("offers.no")) + "</span>") + "</div>").join("");
    const offerIds = top.offers.slice();
    if (g.enrolled && offerIds.indexOf(g.enrolled) < 0) offerIds.push(g.enrolled);
    offerIds.sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b));
    const btn = (cls, label, small, data) => '<button type="button" class="' + cls + '" data-act="' + data + '">' + esc(label) + "<small>" + esc(small) + "</small></button>";
    let html = "<p>" + esc(T("offers.intro", { y: g.year + 1 })) + "</p>" + results + '<div class="decide">';
    offerIds.forEach((id, i) => {
      const kept = id === g.enrolled && top.offers.indexOf(id) < 0;
      html += btn(i === 0 ? "primary" : "", T("offers.enroll", { uni: L.uni(id) }), T(kept ? "offers.enroll.kept" : "offers.enroll.sub"), "enroll:" + id);
    });
    if (offerIds.length) {
      const uni = L.uni(offerIds[0]);
      html += btn("", T("offers.half", { uni }), T("offers.half.sub", { uni }), "halfretake:" + offerIds[0]);
    }
    for (const o of g.retakeOptions(top.score)) {
      if (o.id === "halfretake") continue;
      const sub = o.blocked ? T("offers." + o.blocked) : (o.scholarship ? T("offers.scholarship") : "") + T("offers." + o.id + ".sub");
      html += btn("", T("offers." + o.id), sub, o.blocked ? "" : o.id);
    }
    html += btn("", T("offers.stop"), T(offerIds.length ? "offers.stop.sub" : "offers.stop.none"), "quit");
    html += "</div>";
    openModal(T(offerIds.length ? "offers.title" : "offers.none"), html, []);
    for (const b of els.modalBody.querySelectorAll(".decide button")) {
      const act = b.dataset.act;
      if (!act) { b.disabled = true; continue; }
      b.addEventListener("click", () => {
        const [action, id] = act.split(":");
        game.decide({ action, uni: id });
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
    }
    const verdict = !u ? "end.none" : u.id === "med" ? "end.med" : ["snu", "yonsei", "korea"].indexOf(u.id) >= 0 ? "end.sky" :
      u.cut >= 93 ? "end.top" : u.cut >= 85 ? "end.solid" : "end.fresh";
    const tile = (k, v) => '<div><span class="k">' + esc(T(k)) + '</span><span class="v">' + esc(v) + "</span></div>";
    openModal(u ? T("end.title", { uni: L.uni(u.id) }) : T("end.titleNone"),
      "<p>" + esc(T(verdict)) + '</p><div class="summary">' +
      tile("end.attempts", e.attempts) + tile("end.age", L.age(e.age)) + tile("end.best", best ? best.total : "—") + tile("end.grades", gr ? gr.join("·") : "—") +
      '</div><p class="muted">' + esc(T("end.note")) + "</p>",
      [
        { label: T("end.look"), run: () => { g.endingSeen = true; after(); } },
        { label: T("newLife"), primary: true, run: startOver },
      ]);
  }

  // ---------- boot ----------
  applyStatic();
  game = loadSave();
  if (game && !game.ending) showGame();
  else showSetup();
})();
