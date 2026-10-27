(function () {
  "use strict";

  const S = window.Suneung;
  const { Game, ACTIVITIES, METHODS, STATUSES, FAMILIES, SUBJECTS, SUBJECT_INFO, INQUIRY, UNIVERSITIES, MONTHS, MOCKS } = S;
  const SAVE_KEY = "suneung.save.v1";
  const FAME_KEY = "suneung.fame.v1";

  const $ = (id) => document.getElementById(id);
  const els = {
    setup: $("setup"), game: $("game"), name: $("name"), track: $("track"), trackNote: $("trackNote"),
    inq1: $("inq1"), inq2: $("inq2"), family: $("family"), familyNote: $("familyNote"), talent: $("talent"),
    rerollBtn: $("rerollBtn"), startBtn: $("startBtn"), resumeBtn: $("resumeBtn"), fame: $("fame"),
    sDate: $("sDate"), sDday: $("sDday"), sAttempt: $("sAttempt"), sStatus: $("sStatus"), sAge: $("sAge"),
    sName: $("sName"), sMoney: $("sMoney"), sAllowance: $("sAllowance"),
    skills: $("skills"), condition: $("condition"), planTitle: $("planTitle"), blocksLeft: $("blocksLeft"),
    method: $("method"), methodNote: $("methodNote"), activities: $("activities"), planCost: $("planCost"),
    planErr: $("planErr"), repeatBtn: $("repeatBtn"), clearBtn: $("clearBtn"), nextBtn: $("nextBtn"),
    chart: $("chart"), legend: $("legend"), log: $("log"), history: $("history"), newLifeBtn: $("newLifeBtn"),
    modal: $("modal"), modalTitle: $("modalTitle"), modalBody: $("modalBody"), modalButtons: $("modalButtons"),
  };

  // ---------- formatting ----------
  const intFmt = new Intl.NumberFormat("en-US");
  const won = (n) => (n < 0 ? "-₩" : "₩") + intFmt.format(Math.round(Math.abs(n)));
  function wonShort(n) {
    const a = Math.abs(n), sign = n < 0 ? "-" : "";
    if (a >= 1e8) return sign + "₩" + (a / 1e8).toFixed(a >= 1e9 ? 0 : 1) + "억";
    if (a >= 1e4) return sign + "₩" + intFmt.format(Math.round(a / 1e4)) + "만";
    return won(n);
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const gradeChip = (g) => '<span class="gr gr' + g + '">' + g + "</span>";
  const subColor = { kor: "--s-kor", math: "--s-math", eng: "--s-eng", hist: "--s-hist", inq1: "--s-inq1", inq2: "--s-inq2" };
  function monthLabel(t) {
    const [y, m] = t.split("-").map(Number);
    return MONTHS[m] + " '" + String(y).slice(2);
  }
  function subName(g, s) {
    if (s === "inq1" || s === "inq2") {
      const info = S.inquiryInfo(g.inq[s === "inq1" ? 0 : 1]);
      return { en: info.name, ko: info.ko };
    }
    return { en: SUBJECT_INFO[s].name, ko: SUBJECT_INFO[s].ko };
  }

  // ---------- storage (best effort: private windows may refuse) ----------
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { /* playing without saves is fine */ }
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? Game.fromJSON(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
  function loadFame() {
    try { return JSON.parse(localStorage.getItem(FAME_KEY) || "[]"); } catch (e) { return []; }
  }
  function addFame(entry) {
    const list = loadFame().concat([entry]).sort((a, b) => b.total - a.total).slice(0, 10);
    try { localStorage.setItem(FAME_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  // ---------- setup screen ----------
  const setup = { track: "soc", family: "middle", seed: newSeed() };
  function newSeed() { return (Math.random() * 2 ** 31) | 0; }

  function segPick(seg, v) {
    for (const b of seg.querySelectorAll("button")) b.classList.toggle("on", b.dataset.v === v);
  }
  function fillInquiry() {
    const pool = INQUIRY[setup.track];
    const opts = pool.map((x) => '<option value="' + x.id + '">' + esc(x.ko + " · " + x.name) + "</option>").join("");
    els.inq1.innerHTML = opts;
    els.inq2.innerHTML = opts;
    els.inq1.value = pool[0].id;
    els.inq2.value = pool[1].id;
  }
  function fixInquiryPair(changed) {
    // The two inquiry subjects must differ.
    if (els.inq1.value !== els.inq2.value) return;
    const pool = INQUIRY[setup.track].map((x) => x.id);
    const other = changed === els.inq1 ? els.inq2 : els.inq1;
    other.value = pool.find((id) => id !== changed.value);
  }
  function renderSetup() {
    segPick(els.track, setup.track);
    segPick(els.family, setup.family);
    els.trackNote.textContent = setup.track === "sci"
      ? "Math elective 미적분 (Calculus) + two science subjects. Only this track can apply to medical school (의대)."
      : "Math elective 확률과 통계 (Probability & Statistics) + two social-studies subjects.";
    const f = FAMILIES[setup.family];
    els.familyNote.textContent = "Monthly education budget " + won(f.allowance) + ", savings " + won(f.start) + "." +
      (setup.family === "tight" ? " Retake academies are only possible on a scholarship." : setup.family === "wealthy" ? " Years of 학원 already: a head start." : "");
    const t = Game.rollTalent(setup.seed, setup.family);
    const pseudo = { inq: [els.inq1.value, els.inq2.value] };
    els.talent.innerHTML = SUBJECTS.map((s) => {
      const v = S.skillScore(t.skills[s]);
      const apt = t.aptitude[s];
      const stars = apt >= 1.25 ? "★★★" : apt >= 1.05 ? "★★" : apt >= 0.88 ? "★" : "·";
      const n = subName(pseudo, s);
      return '<div class="bar"><span class="name">' + esc(n.ko + " " + n.en) + '</span><span class="track"><span class="fill" style="width:' + v +
        "%;background:var(" + subColor[s] + ')"></span></span><span class="val">' + v + '</span><span class="apt" title="Aptitude: how fast you learn it">' + stars + "</span></div>";
    }).join("");
    renderFame();
  }
  function renderFame() {
    const list = loadFame();
    if (!list.length) {
      els.fame.innerHTML = '<tr><td class="muted">Finish a life to get on the board. Ranked by 국수탐 standard-score total.</td></tr>';
      return;
    }
    els.fame.innerHTML = "<thead><tr><th>#</th><th>Name</th><th>Total</th><th>Grades 국수영</th><th>Ended at</th><th>Tries</th></tr></thead><tbody>" +
      list.map((e, i) => "<tr><td>" + (i + 1) + '</td><td class="l">' + esc(e.name) + "</td><td>" + e.total + "</td><td>" + esc(e.grades || "") +
        '</td><td class="l">' + esc(e.uni) + "</td><td>" + e.attempts + "</td></tr>").join("") + "</tbody>";
  }
  function showSetup() {
    closeModal();
    els.setup.classList.remove("hidden");
    els.game.classList.add("hidden");
    els.resumeBtn.classList.toggle("hidden", !(game && !game.ending));
    renderSetup();
  }

  els.track.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    setup.track = b.dataset.v;
    fillInquiry();
    renderSetup();
  });
  els.family.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    setup.family = b.dataset.v;
    renderSetup();
  });
  for (const sel of [els.inq1, els.inq2]) sel.addEventListener("change", () => { fixInquiryPair(sel); renderSetup(); });
  els.rerollBtn.addEventListener("click", () => { setup.seed = newSeed(); renderSetup(); });
  els.resumeBtn.addEventListener("click", () => showGame());
  els.startBtn.addEventListener("click", () => {
    game = new Game({
      seed: setup.seed, name: els.name.value.trim() || "김수능", track: setup.track,
      inq: [els.inq1.value, els.inq2.value], family: setup.family, startYear: new Date().getFullYear(),
    });
    plan = {};
    setup.seed = newSeed();
    save();
    showGame();
  });

  // ---------- game screen ----------
  let game = null;
  let plan = {};
  let method = "self";
  let outcome = null; // { title, text } shown after answering an event
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
  function defaultPlan() {
    if (!game.lastPlan) return {};
    return fitPlan(Object.assign({}, game.lastPlan), game.blocks());
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
    if (p.job === 0) delete p.job;
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
    els.sDate.textContent = MONTHS[g.month] + " " + g.year;
    const d = g.daysToExam();
    els.sDday.textContent = g.ending ? "Exam life over" : g.month <= 11 ? (d > 0 ? "수능 D-" + d : "수능 this month") : "Results season";
    els.sAttempt.textContent = g.attemptName();
    els.sStatus.textContent = STATUSES[g.status].ko + " · " + STATUSES[g.status].name;
    els.sAge.textContent = g.age;
    els.sName.textContent = g.name + " · " + (g.track === "sci" ? "이과" : "문과");
    els.sMoney.textContent = wonShort(g.money);
    els.sAllowance.textContent = "+" + wonShort(g.allowance()) + "/month from parents";
  }

  function bar(name, value, color, delta, title) {
    const v = Math.max(0, Math.min(100, value));
    let d = "";
    if (delta && Math.abs(delta) >= 0.5) d = '<span class="delta ' + (delta > 0 ? "up" : "down") + '">' + (delta > 0 ? "+" : "") + Math.round(delta) + "</span>";
    return '<div class="bar"' + (title ? ' title="' + esc(title) + '"' : "") + '><span class="name">' + name + '</span><span class="track"><span class="fill" style="width:' + v +
      "%;background:" + color + '"></span></span><span class="val">' + Math.round(value) + d + "</span></div>";
  }
  function renderBars() {
    const g = game;
    const prev = g.trace.length > 1 ? g.trace[g.trace.length - 2].skills : null;
    els.skills.innerHTML = SUBJECTS.map((s) => {
      const n = subName(g, s);
      const v = S.skillScore(g.skills[s]);
      const delta = prev ? (g.skills[s] - prev[s]) * 16.67 : 0;
      return bar(esc(n.ko + " " + n.en), v, "var(" + subColor[s] + ")", delta, "Aptitude ×" + g.aptitude[s]);
    }).join("");
    const lvl = (v, goodHigh) => {
      const x = goodHigh ? v : 100 - v;
      return x >= 60 ? "var(--pos)" : x >= 35 ? "var(--warn)" : "var(--neg)";
    };
    els.condition.innerHTML =
      bar("Health 체력", g.health, lvl(g.health, true), 0, "Below 40 slows study and hurts you on exam day") +
      bar("Stress 스트레스", g.stress, lvl(g.stress, false), 0, "Above 75 slows study; above 65 hurts on exam day; 85+ risks burnout") +
      bar("Motivation 의지", g.motivation, lvl(g.motivation, true), 0, "Multiplies study gains, especially with self-study and online lectures") +
      bar("Exam stamina 실전력", g.practice * 100, "var(--accent)", 0, "From timed practice and mock exams: steadier scores on the day");
  }

  function renderPlan() {
    const g = game;
    const n = g.blocks();
    const used = planTotal();
    const done = !!g.ending;
    els.planTitle.parentElement.parentElement.classList.toggle("ended", done);
    els.planTitle.textContent = done ? "Your exam years are over. Look back at the log, or start a new life below." : "Plan " + MONTHS[g.month] + (MOCKS[g.month] && !(g.month === 3 && g.status !== "hs3") ? " · " + MOCKS[g.month] + " at month end" : g.month === 11 ? " · 수능 at month end" : "");
    els.blocksLeft.textContent = done ? "" : n - used + " of " + n + " blocks left";
    els.blocksLeft.classList.toggle("done", used === n);
    els.blocksLeft.classList.toggle("hidden", done);

    const fixed = g.methodFixed();
    els.method.innerHTML = Object.keys(METHODS).map((id) => {
      const m = METHODS[id];
      const on = (fixed || method) === id;
      return '<button type="button" data-v="' + id + '" class="' + (on ? "on" : "") + '"' + (fixed || done ? " disabled" : "") + ">" + m.name + ' <span class="ko">' + m.ko + "</span></button>";
    }).join("");
    const m = METHODS[fixed || method];
    els.methodNote.textContent = fixed
      ? "The academy teaches every subject (×" + m.mult + " study speed); you only choose the hours."
      : "×" + m.mult + " study speed · " + (m.cost ? won(m.cost) + " per study block" : "free") + " · " +
        (m.sens >= 1 ? "only as good as your motivation" : m.sens >= 0.6 ? "keeps you on task" : "barely depends on motivation");

    els.activities.innerHTML = ACTIVITIES.map((a) => {
      const k = plan[a.id] || 0;
      let label, hint;
      if (a.kind === "study") {
        const nm = subName(g, a.subject);
        label = '<span class="sw" style="background:var(' + subColor[a.subject] + ')"></span>' + esc(nm.en) + ' <span class="ko">' + esc(nm.ko) + "</span>";
        hint = "Ability " + S.skillScore(g.skills[a.subject]) + (a.subject === "eng" ? " · absolute grading: 90+ is grade 1" : a.subject === "hist" ? " · absolute grading: 40+ is grade 1" : "");
      } else {
        label = esc(a.label) + ' <span class="ko">' + esc(a.ko) + "</span>";
        hint = a.hint;
      }
      return '<div class="act' + (k ? " has" : "") + '"><div class="lbl">' + label + "<small>" + esc(hint) + '</small></div><div class="stepper">' +
        '<button type="button" data-a="' + a.id + '" data-d="-1" aria-label="Less ' + esc(a.label) + '"' + (k && !done ? "" : " disabled") + ">−</button>" +
        '<span class="n">' + k + "</span>" +
        '<button type="button" data-a="' + a.id + '" data-d="1" aria-label="More ' + esc(a.label) + '"' + (used < n && !done ? "" : " disabled") + ">+</button></div></div>";
    }).join("");

    const cost = g.planCost(plan, method);
    const income = (plan.job || 0) * 250000;
    els.planCost.textContent = done ? "" : "Costs " + won(cost) + (income ? " · earns " + won(income) : "") + " · after this month: " + wonShort(g.money + g.allowance() + income - cost);
    const err = used === n ? g.validate(plan, method) : null;
    els.planErr.textContent = err || "";
    els.nextBtn.disabled = done || used !== n || !!err || g.queue.length > 0;
    els.nextBtn.textContent = g.month === 11 ? "Sit the 수능 →" : "Next month →";
    els.repeatBtn.disabled = done || !g.lastPlan;
    els.clearBtn.disabled = done || !used;
  }

  els.activities.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b || b.disabled) return;
    const id = b.dataset.a;
    const d = Number(b.dataset.d);
    plan[id] = Math.max(0, (plan[id] || 0) + d);
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
  function startOver() { clearSave(); game = null; showSetup(); }
  els.newLifeBtn.addEventListener("click", () => {
    if (!game || game.ending) return startOver();
    openModal("Start a new life?", "<p>This life and its save will be gone. Your hall of fame stays.</p>", [
      { label: "Keep playing", run: () => render() },
      { label: "Start over", primary: true, run: startOver },
    ]);
  });

  function renderLog() {
    const items = game.log.slice(-250).reverse();
    els.log.innerHTML = items.map((l) => '<li><span class="when">' + monthLabel(l.t) + '</span><span class="' + esc(l.kind) + '">' + esc(l.text) + "</span></li>").join("");
  }

  function cell(r) {
    return gradeChip(r.grade) + (r.std != null ? ' <span class="muted">' + r.std + "</span>" : "");
  }
  function renderHistory() {
    const g = game;
    const rows = g.history.concat(g.mocks.filter((m) => m.attempt === g.attempt && g.history.every((h) => h.attempt !== g.attempt)));
    if (!rows.length) {
      els.history.innerHTML = '<tr><td class="muted">Mock exams (March, June, September) and your 수능 results show up here.</td></tr>';
      return;
    }
    els.history.innerHTML = "<thead><tr><th>Exam</th><th>국어</th><th>수학</th><th>영어</th><th>한국사</th><th>탐구1</th><th>탐구2</th><th>Total</th></tr></thead><tbody>" +
      rows.map((r) => {
        const s = r.subjects;
        const label = r.kind === "suneung" ? "<b>" + (r.year + 1) + " 수능</b>" : MONTHS[r.month] + " mock";
        return '<tr><td class="l">' + label + '<br><span class="muted">' + esc(g.attemptName(r.attempt).split(" ")[0]) + "</span></td>" +
          [s.kor, s.math, s.eng, s.hist, s.inq1, s.inq2].map((x) => "<td>" + cell(x) + "</td>").join("") + "<td><b>" + r.total + "</b></td></tr>";
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
    if (!w || !h) return;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const col = readColors();
    els.legend.innerHTML = SUBJECTS.map((s) => '<span><span class="dot" style="background:var(' + subColor[s] + ')"></span>' + esc(subName(g, s).ko) + "</span>").join("");

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

    ctx.font = "11px system-ui, sans-serif";
    ctx.lineWidth = 1;
    for (let v = lo; v <= hi; v += 10) {
      ctx.strokeStyle = col.grid;
      ctx.beginPath(); ctx.moveTo(padL, y(v)); ctx.lineTo(w - padR, y(v)); ctx.stroke();
      ctx.fillStyle = col.muted;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(String(v), padL - 6, y(v));
    }
    // A dashed line where each new attempt starts.
    ctx.setLineDash([4, 4]);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    for (let i = 0; i < tr.length; i++) {
      const att = tr[i].att || 1;
      if (i === 0 || (tr[i - 1].att || 1) !== att) {
        ctx.strokeStyle = col.border;
        ctx.beginPath(); ctx.moveTo(x(i), padT); ctx.lineTo(x(i), h - padB); ctx.stroke();
        ctx.fillStyle = col.muted;
        ctx.fillText(["", "현역", "재수", "삼수", "사수"][att] || att + "수", x(i) + 4, h - 6);
      }
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    for (const s of SUBJECTS) {
      ctx.strokeStyle = col[s];
      ctx.beginPath();
      tr.forEach((p, i) => { const yy = y(S.skillScore(p.skills[s])); if (i) ctx.lineTo(x(i), yy); else ctx.moveTo(x(i), yy); });
      ctx.stroke();
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
      const o = outcome;
      openModal(o.title, '<div class="outcome">' + esc(o.text) + "</div>", [{ label: "Continue", primary: true, run: () => { outcome = null; after(); } }]);
      return;
    }
    const top = g.queue[0];
    if (!top) {
      if (g.ending && !g.endingSeen) return showEnding();
      closeModal();
      return;
    }
    if (top.type === "event") return showEvent(top);
    if (top.type === "mock") return showMock(top);
    if (top.type === "exam") return examStep === 0 ? showExamDay(top) : showReport(top);
    if (top.type === "apply") return showApply(top);
    if (top.type === "offers") return showOffers(top);
    closeModal();
  }

  function showEvent(ev) {
    const title = ev.title || MONTHS[game.month] + " " + game.year;
    if (!ev.choices) {
      openModal(title, "<p>" + esc(ev.text) + "</p>", [{ label: "OK", primary: true, run: () => { game.dismiss(); after(); } }]);
      return;
    }
    openModal(title, "<p>" + esc(ev.text) + '</p><div class="choices"></div>', []);
    const box = els.modalBody.querySelector(".choices");
    ev.choices.forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => {
        const text = game.choose(i);
        outcome = { title, text: text || "Done." };
        after();
      });
      box.appendChild(b);
    });
    box.querySelector("button").focus({ preventScroll: true });
  }

  function reportTable(res, full) {
    const s = res.subjects;
    const g = game;
    const elective = { kor: "화법과 작문", math: g.track === "sci" ? "미적분" : "확률과 통계", eng: "", hist: "", inq1: subName(g, "inq1").ko, inq2: subName(g, "inq2").ko };
    const rows = SUBJECTS.map((k) => {
      const r = s[k];
      const absolute = k === "eng" || k === "hist";
      return '<tr><td class="l">' + SUBJECT_INFO[k].ko + (elective[k] ? ' <span class="muted">' + esc(elective[k]) + "</span>" : "") + "</td><td>" + r.raw + '<span class="muted">/' + r.max + "</span></td>" +
        (full ? "<td>" + (absolute ? "—" : r.std) + "</td><td>" + (absolute ? "—" : r.pct) + "</td>" : "") +
        "<td>" + gradeChip(r.grade) + '</td><td class="muted">' + (absolute ? (k === "eng" ? 90 : 40) : r.cut1) + "</td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="grid"><thead><tr><th>영역</th><th>Raw</th>' + (full ? "<th>표준점수</th><th>백분위</th>" : "") + "<th>등급</th><th>1등급 cut</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function showMock(top) {
    const r = top.result;
    openModal(MOCKS[r.month] + " results",
      "<p>A practice run at the real thing. Graded against the whole country.</p>" + reportTable(r, true) +
      '<p class="muted" style="margin-top:10px">국수탐 standard total: <b>' + r.total + "</b></p>",
      [{ label: "Back to studying", primary: true, run: () => { game.dismiss(); after(); } }]);
  }

  const PERIODS = [
    { k: "kor", time: "08:40", name: "1교시 국어", good: "The passages read themselves.", ok: "One literature set eats ten minutes too many.", bad: "The science passage (비문학) is a wall of text about quantum something. Panic." },
    { k: "math", time: "10:30", name: "2교시 수학", good: "Even #22 gives way after one clever substitution.", ok: "You leave the last killer question blank and check the rest.", bad: "Your hands shake. Three 4-point questions in a row won't crack." },
    { k: "eng", time: "13:10", name: "3교시 영어", good: "The listening is crystal clear; blank-inference questions fall fast.", ok: "Two blank-inference questions are pure guesses.", bad: "You zone out during the listening section and never recover the time." },
    { k: "hist", time: "14:50", name: "4교시 한국사", good: "Twenty questions, twelve minutes. Easy.", ok: "A couple of dynasty dates swap places in your head.", bad: "Was that Goryeo or Joseon? You honestly don't know." },
    { k: "inq1", time: "15:35", name: "4교시 탐구1", good: "Every chart looks familiar.", ok: "One trick question slips through.", bad: "The 30 minutes evaporate." },
    { k: "inq2", time: "16:07", name: "4교시 탐구2", good: "You finish with time to check your OMR card.", ok: "Done, a little rushed.", bad: "You're filling in the OMR card as the bell rings." },
  ];
  function showExamDay(top) {
    const r = top.result;
    const items = PERIODS.map((p) => {
      const x = r.subjects[p.k];
      const vibe = x.grade <= 2 ? p.good : x.grade <= 4 ? p.ok : p.bad;
      const nm = p.k === "inq1" || p.k === "inq2" ? p.name.replace(/탐구\d/, subName(game, p.k).ko) : p.name;
      return '<li><span class="tm">' + p.time + "</span><span><b>" + esc(nm) + "</b><br>" + esc(vibe) + '</span><span class="rw">' + x.raw + '<span class="muted">/' + x.max + "</span></span></li>";
    }).join("");
    openModal((r.year + 1) + "학년도 수능",
      '<div class="big-emoji">📝</div><p>November ' + r.year + ". You walk past the juniors cheering at the school gate, find your seat and put the watch on the desk.</p>" +
      '<ul class="periods">' + items + '</ul><p class="muted">That evening you mark your answers against the published key (가채점). Official results come in December.</p>',
      [{ label: "December: open the score report →", primary: true, run: () => { examStep = 1; render(); } }]);
  }
  function showReport(top) {
    const r = top.result;
    const score = S.admissionScore(r);
    const prev = game.history.length > 1 ? game.history[game.history.length - 2] : null;
    let cmp = "";
    if (prev) {
      const d = r.total - prev.total;
      cmp = " (" + (d >= 0 ? '<span class="up">+' + d : '<span class="down">' + d) + "</span> vs last year)";
    }
    openModal("수능 성적표 · score report",
      '<p class="headline">📰 ' + esc(r.headline) + "</p>" + reportTable(r, true) +
      '<div class="summary"><div><span class="k">국수탐 standard total</span><span class="v">' + r.total + "</span>" + cmp + '</div><div><span class="k">정시 admission score</span><span class="v">' + score.toFixed(1) +
      '</span></div><div><span class="k">Attempt</span><span class="v">' + esc(game.attemptName(r.attempt)) + "</span></div></div>" +
      '<p class="muted">Admission score = average 백분위 of 국어, 수학 and your two 탐구 (counted as one), minus a deduction for English grade 2+ and History grade 4+.</p>',
      [{ label: "Apply to universities →", primary: true, run: () => { examStep = 0; game.dismiss(); after(); } }]);
  }

  function chanceClass(p) { return p >= 0.85 ? "ch-safe" : p >= 0.55 ? "ch-match" : p >= 0.25 ? "ch-reach" : "ch-long"; }
  function showApply(top) {
    const opts = game.options();
    const picked = new Set();
    const body =
      '<p>Your 정시 admission score is <b>' + top.score.toFixed(1) + "</b>. Pick up to three schools, one per 가·나·다 group. Chances are rough estimates from recent years.</p>" +
      '<div class="unis">' + opts.map((o) =>
        '<label class="uni' + (o.blocked ? " off" : "") + '"><input type="checkbox" value="' + o.id + '"' + (o.blocked ? " disabled" : "") + '><span class="nm">' + esc(o.ko + " · " + o.name) +
        "<small>" + (o.blocked ? "Sciences track (이과) only" : Math.round(o.p * 100) + "% chance") + '</small></span><span class="chance ' + chanceClass(o.p) + '">' + o.label.ko + " " + o.label.en + "</span></label>").join("") +
      "</div>";
    openModal("정시 applications", body, [
      { label: "Submit applications", primary: true, run: () => {
        if (!picked.size) return;
        game.apply(Array.from(picked));
        after();
      } },
    ]);
    const boxes = els.modalBody.querySelectorAll("input[type=checkbox]");
    const submit = els.modalButtons.querySelector("button");
    const sync = () => {
      for (const b of boxes) if (!b.checked) b.disabled = picked.size >= 3 || !!opts.find((o) => o.id === b.value).blocked;
      submit.textContent = "Submit " + picked.size + " of 3 applications";
      submit.disabled = !picked.size;
    };
    for (const b of boxes) b.addEventListener("change", () => { if (b.checked) picked.add(b.value); else picked.delete(b.value); sync(); });
    sync();
  }

  function showOffers(top) {
    const g = game;
    const results = top.results.map((r) =>
      '<div class="result"><span>' + esc(r.ko + " · " + r.name) + "</span>" + (r.admitted ? '<span class="ok">합격 · admitted</span>' : '<span class="no">불합격 · rejected</span>') + "</div>").join("");
    const offerIds = top.offers.slice();
    if (g.enrolled && offerIds.indexOf(g.enrolled) < 0) offerIds.push(g.enrolled);
    offerIds.sort((a, b) => UNIVERSITIES.findIndex((u) => u.id === a) - UNIVERSITIES.findIndex((u) => u.id === b));
    const uni = (id) => UNIVERSITIES.find((u) => u.id === id);
    const btn = (cls, label, small, data) => '<button type="button" class="' + cls + '" data-act="' + data + '">' + esc(label) + "<small>" + esc(small) + "</small></button>";
    let html = "<p>February " + (g.year + 1) + ". The results are in.</p>" + results + '<div class="decide">';
    offerIds.forEach((id, i) => {
      const u = uni(id);
      const kept = id === g.enrolled && top.offers.indexOf(id) < 0;
      html += btn(i === 0 ? "primary" : "", "Enroll at " + u.ko + " (" + u.name + ")", kept ? "Go back to the school you've been attending." : "End your exam years here.", "enroll:" + id);
    });
    if (offerIds.length) {
      const u = uni(offerIds[0]);
      html += btn("", "Enroll at " + u.ko + ", but retake in secret (반수)", "Attend university (only 2 study blocks a month until June). Next year you can still choose " + u.ko + ".", "halfretake:" + offerIds[0]);
    }
    for (const o of g.retakeOptions(top.score)) {
      if (o.id === "halfretake") continue;
      const desc = o.id === "academy" ? "All-day academy: 6 blocks a month, ×1.45 study speed on every subject, a schedule that keeps motivation up." : "Plan it yourself at a 독서실: 6 blocks a month, any study method.";
      html += btn("", "Retake: " + o.ko + " · " + o.name, o.blocked || (o.scholarship ? "Scholarship: free. " : "") + desc, o.blocked ? "" : o.id);
    }
    html += btn("", "Stop here", offerIds.length ? "Walk away from 수능 and university for now." : "No offer this year. Close the books for good.", "quit");
    html += "</div>";
    openModal(offerIds.length ? "합격자 발표 · offers" : "No offers this year", html, []);
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
    const grades = best ? best.subjects.kor.grade + "·" + best.subjects.math.grade + "·" + best.subjects.eng.grade : "—";
    if (!g.endingRecorded && best) {
      addFame({ name: g.name, total: best.total, grades, uni: u ? u.ko : "—", attempts: e.attempts });
      g.endingRecorded = true;
    }
    const verdict = !u ? "You put down the pencil. Plenty of lives start without a university." :
      u.id === "med" ? "의대! Your family throws a party the whole apartment complex hears." :
      ["snu", "yonsei", "korea"].indexOf(u.id) >= 0 ? "SKY. Your mother changes her KakaoTalk profile picture to your acceptance letter." :
      u.cut >= 93 ? "A top Seoul university. Relatives stop asking awkward questions at Chuseok." :
      u.cut >= 85 ? "A solid university. A new chapter begins." : "A fresh start. Exams aren't everything.";
    openModal(u ? "🎓 " + u.ko + " · " + u.name : "The end of exam life",
      "<p>" + esc(verdict) + '</p><div class="summary">' +
      "<div><span class=\"k\">Attempts</span><span class=\"v\">" + e.attempts + "</span></div>" +
      "<div><span class=\"k\">Age at enrollment</span><span class=\"v\">" + e.age + "</span></div>" +
      "<div><span class=\"k\">Best 국수탐 total</span><span class=\"v\">" + (best ? best.total : "—") + "</span></div>" +
      "<div><span class=\"k\">Best grades 국·수·영</span><span class=\"v\">" + grades + "</span></div></div>" +
      '<p class="muted">College life, jobs and beyond are coming in a later version. Your life log and exam history stay on the page below.</p>',
      [
        { label: "Look back at this life", run: () => { g.endingSeen = true; after(); } },
        { label: "Start a new life", primary: true, run: () => { clearSave(); game = null; showSetup(); } },
      ]);
  }

  // ---------- boot ----------
  fillInquiry();
  game = loadSave();
  if (game && !game.ending) showGame();
  else { game = game && game.ending ? game : null; showSetup(); }
})();
