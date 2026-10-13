(function () {
  "use strict";

  const { LottoSim, TICKET_PRICE } = window.Lotto;
  const WEEKS_PER_YEAR = 52.1775;
  const MAX_POINTS = 2000;
  const FRAME_BUDGET_MS = 14;
  const TIERS = [
    null,
    { match: "6 numbers", odds: "1 in 8,145,060" },
    { match: "5 + bonus", odds: "1 in 1,357,510" },
    { match: "5 numbers", odds: "1 in 35,724" },
    { match: "4 numbers", odds: "1 in 733" },
    { match: "3 numbers", odds: "1 in 45" },
  ];
  const TIER_NAMES = ["", "1st", "2nd", "3rd", "4th", "5th"];

  const $ = (id) => document.getElementById(id);
  const els = {
    tickets: $("tickets"), jackpot: $("jackpot"), age: $("age"),
    useMine: $("useMine"), mine: $("mine"), mineErr: $("mineErr"),
    speed: $("speed"), speedLabel: $("speedLabel"), stopOnJackpot: $("stopOnJackpot"),
    startBtn: $("startBtn"), stepBtn: $("stepBtn"), resetBtn: $("resetBtn"),
    sDraws: $("sDraws"), sTime: $("sTime"), sAge: $("sAge"), sSpent: $("sSpent"),
    sTickets: $("sTickets"), sWon: $("sWon"), sReturn: $("sReturn"), sNet: $("sNet"),
    sNetCompact: $("sNetCompact"), chart: $("chart"), balls: $("balls"),
    drawDate: $("drawDate"), tallyBody: $("tallyBody"), log: $("log"),
    banner: $("banner"), bannerText: $("bannerText"), bannerClose: $("bannerClose"),
  };

  // ---------- formatting ----------
  const intFmt = new Intl.NumberFormat("en-US");
  const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const won = (n) => (n < 0 ? "-₩" : "₩") + intFmt.format(Math.abs(n));
  const wonCompact = (n) => (n < 0 ? "-₩" : "₩") + compactFmt.format(Math.abs(n));
  // Korean units: 억 = 10^8, 만 = 10^4
  function wonKorean(n) {
    const sign = n < 0 ? "-" : "";
    const a = Math.abs(n);
    if (a >= 1e12) return sign + intFmt.format(Math.floor(a / 1e12)) + "조 " + intFmt.format(Math.floor((a % 1e12) / 1e8)) + "억원";
    if (a >= 1e8) return sign + intFmt.format(Math.floor(a / 1e8)) + "억 " + intFmt.format(Math.floor((a % 1e8) / 1e4)) + "만원";
    if (a >= 1e4) return sign + intFmt.format(Math.floor(a / 1e4)) + "만원";
    return sign + intFmt.format(a) + "원";
  }
  function elapsed(draws) {
    const years = Math.floor(draws / WEEKS_PER_YEAR);
    const weeks = Math.round(draws - years * WEEKS_PER_YEAR);
    if (years === 0) return draws + (draws === 1 ? " week" : " weeks");
    return intFmt.format(years) + (years === 1 ? " year " : " years ") + weeks + "w";
  }

  // First draw is the coming Saturday.
  const startDate = (() => {
    const d = new Date();
    d.setHours(20, 45, 0, 0);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d;
  })();
  function drawDateLabel(draws) {
    const d = new Date(startDate.getTime() + (draws - 1) * 7 * 86400000);
    if (isNaN(d.getTime())) {
      return "year " + intFmt.format(Math.floor(startDate.getFullYear() + draws / WEEKS_PER_YEAR));
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function ballColor(n) {
    if (n <= 10) return "var(--ball-y)";
    if (n <= 20) return "var(--ball-b)";
    if (n <= 30) return "var(--ball-r)";
    if (n <= 40) return "var(--ball-g)";
    return "var(--ball-gr)";
  }

  // ---------- inputs ----------
  function readTickets() {
    const v = Math.floor(Number(els.tickets.value));
    return Number.isFinite(v) && v >= 1 ? Math.min(v, 100000) : 1;
  }
  function readJackpot() {
    const v = Number(els.jackpot.value);
    return Number.isFinite(v) && v > 0 ? v : 2000000000;
  }
  function readMine() {
    if (!els.useMine.checked) { els.mineErr.textContent = ""; return null; }
    const nums = els.mine.value.split(/[^0-9]+/).filter(Boolean).map(Number);
    const ok = nums.length === 6 && new Set(nums).size === 6 && nums.every((n) => n >= 1 && n <= 45);
    els.mineErr.textContent = ok ? "" : "Enter 6 different numbers from 1 to 45.";
    return ok ? Uint8Array.from(nums) : null;
  }

  // Speed slider 0..100 maps to 0.03 .. 100,000 draws per frame (log scale).
  function drawsPerFrame() {
    return Math.pow(10, -1.5 + (Number(els.speed.value) / 100) * 6.5);
  }
  function updateSpeedLabel() {
    const dpf = drawsPerFrame();
    const perSec = dpf * 60;
    els.speedLabel.textContent = perSec < 52
      ? perSec.toFixed(perSec < 10 ? 1 : 0) + " draws/sec"
      : "~" + compactFmt.format(perSec / WEEKS_PER_YEAR) + " years/sec";
  }

  // ---------- state ----------
  let sim, history, step, events, minNet, maxNet, running, carry, rafId, logCount;

  function reset() {
    stop();
    sim = new LottoSim({ tickets: readTickets(), jackpot: readJackpot(), myNumbers: readMine() });
    history = [[0, 0]];
    step = 1;
    events = [];
    minNet = 0;
    maxNet = 0;
    carry = 0;
    logCount = 0;
    els.log.innerHTML = '<li class="muted">3rd prize or better will show up here.</li>';
    els.balls.innerHTML = '<span class="muted">Press Start to buy your first tickets.</span>';
    els.drawDate.textContent = "";
    render();
  }

  function record(notable) {
    const net = sim.net;
    if (net < minNet) minNet = net;
    if (net > maxNet) maxNet = net;
    if (notable) {
      for (const w of notable) {
        events.push({ d: sim.draws, net, tier: w.tier });
        addLog(w);
      }
    }
    if (sim.draws % step === 0) {
      history.push([sim.draws, net]);
      if (history.length > MAX_POINTS) {
        step *= 2;
        history = history.filter((p) => p[0] % step === 0);
      }
    }
  }

  const pendingLog = [];
  function addLog(w) {
    pendingLog.push(
      `<li><span class="t${w.tier}">${TIER_NAMES[w.tier]} prize</span> ${won(w.prize)} — draw #${intFmt.format(sim.draws)} (${drawDateLabel(sim.draws)})</li>`
    );
  }
  function flushLog() {
    if (!pendingLog.length) return;
    if (logCount === 0) els.log.innerHTML = "";
    const html = pendingLog.slice(-30).reverse().join("");
    logCount += pendingLog.length;
    pendingLog.length = 0;
    els.log.insertAdjacentHTML("afterbegin", html);
    while (els.log.children.length > 150) els.log.lastElementChild.remove();
  }

  // Runs one draw; returns true if the 1st prize was hit.
  function runOne() {
    const notable = sim.draw();
    record(notable);
    return !!notable && notable.some((w) => w.tier === 1);
  }

  function frame() {
    carry += drawsPerFrame();
    const target = Math.floor(carry);
    carry -= target;
    const t0 = performance.now();
    let hit = false;
    for (let i = 0; i < target; i++) {
      if (runOne()) { hit = true; if (els.stopOnJackpot.checked) break; }
      if ((i & 63) === 63 && performance.now() - t0 > FRAME_BUDGET_MS) break;
    }
    if (target > 0) render();
    if (hit && els.stopOnJackpot.checked) { stop(); showBanner(); return; }
    if (running) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    els.startBtn.textContent = "Pause";
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (els.startBtn) els.startBtn.textContent = sim && sim.draws ? "Resume" : "Start";
  }

  function showBanner() {
    const years = sim.draws / WEEKS_PER_YEAR;
    const age = Number(els.age.value) || 0;
    els.bannerText.innerHTML =
      `You won 1st prize on draw <b>#${intFmt.format(sim.draws)}</b> (${drawDateLabel(sim.draws)}) ` +
      `after <b>${elapsed(sim.draws)}</b> of playing.<br>` +
      `You'd be <b>${intFmt.format(Math.floor(age + years))}</b> years old.<br>` +
      `Spent <b>${won(sim.spent)}</b> on ${intFmt.format(sim.ticketsBought)} tickets.<br>` +
      `Net result: <b class="${sim.net >= 0 ? "pos" : "neg"}">${won(sim.net)}</b>`;
    els.banner.classList.remove("hidden");
  }

  // ---------- rendering ----------
  function render() {
    const s = sim;
    els.sDraws.textContent = intFmt.format(s.draws);
    els.sTime.textContent = elapsed(s.draws);
    const age = (Number(els.age.value) || 0) + s.draws / WEEKS_PER_YEAR;
    els.sAge.textContent = s.draws ? `Age ${intFmt.format(Math.floor(age))} · ${drawDateLabel(s.draws)}` : "";
    els.sSpent.textContent = won(s.spent);
    els.sTickets.textContent = intFmt.format(s.ticketsBought) + " tickets";
    els.sWon.textContent = won(s.won);
    els.sReturn.textContent = s.spent ? `${((s.won / s.spent) * 100).toFixed(1)}% returned` : "";
    els.sNet.textContent = won(s.net);
    els.sNet.className = "v big " + (s.net > 0 ? "pos" : s.net < 0 ? "neg" : "");
    els.sNetCompact.textContent = wonKorean(s.net);

    if (s.draws) {
      els.drawDate.textContent = "#" + intFmt.format(s.draws) + " · " + drawDateLabel(s.draws);
      els.balls.innerHTML =
        s.lastDraw.map((n) => `<span class="ball" style="background:${ballColor(n)}">${n}</span>`).join("") +
        `<span class="plus">+</span><span class="ball" style="background:${ballColor(s.lastBonus)}">${s.lastBonus}</span>`;
    }

    let rows = "";
    for (let t = 1; t <= 5; t++) {
      rows += `<tr><td>${TIER_NAMES[t]}</td><td>${TIERS[t].match}</td><td>${TIERS[t].odds}</td>` +
        `<td>${wonCompact(s.prizes[t])}</td><td>${intFmt.format(s.tierCounts[t])}</td></tr>`;
    }
    els.tallyBody.innerHTML = rows;

    flushLog();
    drawChart();
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function niceStep(range, ticks) {
    const raw = range / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  function drawChart() {
    const c = els.chart;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const colors = {
      grid: cssVar("--grid"), muted: cssVar("--muted"), text: cssVar("--text"),
      pos: cssVar("--pos"), neg: cssVar("--neg"), gold: cssVar("--gold"), accent: cssVar("--accent"),
    };
    const pad = { l: 70, r: 14, t: 12, b: 28 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;

    const xMax = Math.max(sim.draws, 52);
    let yMin = Math.min(minNet, 0), yMax = Math.max(maxNet, 0);
    if (yMax - yMin < 10000) { yMax += 5000; yMin -= 5000; }
    const yPad = (yMax - yMin) * 0.06;
    if (yMax > 0) yMax += yPad;
    if (yMin < 0) yMin -= yPad;

    const X = (d) => pad.l + (d / xMax) * pw;
    const Y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * ph;

    // grid + y labels
    ctx.font = "11px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    const ys = niceStep(yMax - yMin, 5);
    for (let v = Math.ceil(yMin / ys) * ys; v <= yMax; v += ys) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke();
      ctx.fillStyle = colors.muted;
      ctx.fillText(wonCompact(Math.round(v)), pad.l - 6, Y(v));
    }
    // x labels in years (or weeks when short)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const yearsMax = xMax / WEEKS_PER_YEAR;
    const xs = niceStep(yearsMax, Math.max(2, Math.floor(pw / 90)));
    for (let yr = 0; yr <= yearsMax + 1e-9; yr += xs) {
      const px = X(yr * WEEKS_PER_YEAR);
      ctx.strokeStyle = colors.grid;
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
      ctx.fillStyle = colors.muted;
      const label = xs < 1 ? Math.round(yr * WEEKS_PER_YEAR) + "w" : compactFmt.format(yr) + " yr";
      ctx.fillText(label, px, pad.t + ph + 6);
    }

    // area + line, split at the zero line
    const zeroY = Y(0);
    const pts = history.slice();
    if (pts[pts.length - 1][0] !== sim.draws) pts.push([sim.draws, sim.net]);
    const path = new Path2D();
    pts.forEach((p, i) => (i ? path.lineTo(X(p[0]), Y(p[1])) : path.moveTo(X(p[0]), Y(p[1]))));
    const area = new Path2D(path);
    area.lineTo(X(pts[pts.length - 1][0]), zeroY);
    area.lineTo(X(pts[0][0]), zeroY);
    area.closePath();

    for (const [color, top, height] of [[colors.pos, pad.t, zeroY - pad.t], [colors.neg, zeroY, pad.t + ph - zeroY]]) {
      if (height <= 0) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, top, pw, height); ctx.clip();
      ctx.globalAlpha = 0.15; ctx.fillStyle = color; ctx.fill(area);
      ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke(path);
      ctx.restore();
    }

    // zero line
    ctx.strokeStyle = colors.muted;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(w - pad.r, zeroY); ctx.stroke();
    ctx.setLineDash([]);

    // win markers (most recent 300 to keep it fast)
    const tierColor = { 1: colors.gold, 2: "#a855f7", 3: colors.accent };
    for (const e of events.slice(-300)) {
      ctx.fillStyle = tierColor[e.tier];
      ctx.beginPath();
      ctx.arc(X(e.d), Y(e.net), e.tier === 1 ? 7 : e.tier === 2 ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- wiring ----------
  els.startBtn.addEventListener("click", () => (running ? stop() : start()));
  els.stepBtn.addEventListener("click", () => {
    stop();
    if (runOne()) showBanner();
    render();
  });
  els.resetBtn.addEventListener("click", reset);
  els.bannerClose.addEventListener("click", () => els.banner.classList.add("hidden"));
  els.tickets.addEventListener("input", () => { sim.tickets = readTickets(); });
  els.jackpot.addEventListener("input", () => { sim.prizes[1] = readJackpot(); render(); });
  els.useMine.addEventListener("change", () => { sim.myNumbers = readMine(); });
  els.mine.addEventListener("input", () => { sim.myNumbers = readMine(); });
  els.age.addEventListener("input", render);
  els.speed.addEventListener("input", updateSpeedLabel);
  window.addEventListener("resize", drawChart);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawChart);

  updateSpeedLabel();
  reset();
})();
