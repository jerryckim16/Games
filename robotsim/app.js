(function () {
  "use strict";

  const { World, RobotSim, STATE } = window.RobotEngine;
  const { PLANNERS } = window.RobotPlanners;
  const ROBOT_COLORS = ["#3b82f6", "#a855f7", "#14b8a6", "#ec4899", "#f97316"];
  const MAX_TICKS_PER_FRAME = 20;
  const HIT_FLASH_TICKS = 8;

  const $ = (id) => document.getElementById(id);
  const els = {
    planner: $("planner"), plannerDesc: $("plannerDesc"), assignment: $("assignment"),
    seed: $("seed"), dwell: $("dwell"), speed: $("speed"), speedLabel: $("speedLabel"),
    showPaths: $("showPaths"), pauseOnHit: $("pauseOnHit"),
    startBtn: $("startBtn"), stepBtn: $("stepBtn"), resetBtn: $("resetBtn"),
    sTick: $("sTick"), sDeliv: $("sDeliv"), sRate: $("sRate"), sColl: $("sColl"),
    sCollSplit: $("sCollSplit"), sWaits: $("sWaits"),
    map: $("map"), robotBody: $("robotBody"), log: $("log"),
    benchTicks: $("benchTicks"), benchBtn: $("benchBtn"), benchClear: $("benchClear"), benchBody: $("benchBody"),
  };
  const ctx = els.map.getContext("2d");

  // The map lives outside the sim so shelf edits survive a reset.
  const world = new World();
  let sim = null;
  let running = false;
  let acc = 0;          // ms accumulated toward the next tick
  let lastFrame = 0;
  let renderedTick = -1;

  // ---------- setup ----------
  for (const p of PLANNERS) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    els.planner.appendChild(opt);
  }

  const currentPlanner = () => PLANNERS.find((p) => p.id === els.planner.value) || PLANNERS[0];

  function simOptions() {
    return {
      planner: currentPlanner(),
      assignment: els.assignment.value,
      seed: Math.max(0, Math.floor(Number(els.seed.value) || 0)),
      dwellTicks: Math.min(50, Math.max(0, Math.floor(Number(els.dwell.value) || 0))),
      world,
    };
  }

  function reset() {
    sim = new RobotSim(simOptions());
    acc = 0;
    renderedTick = -1;
    els.plannerDesc.textContent = currentPlanner().description;
    updatePanels(true);
  }

  function setRunning(on) {
    running = on;
    els.startBtn.textContent = on ? "Pause" : sim.tick > 0 ? "Resume" : "Start";
    acc = 0;
  }

  const ticksPerSecond = () => Number(els.speed.value);
  function updateSpeedLabel() {
    const n = ticksPerSecond();
    els.speedLabel.textContent = n + (n === 1 ? " tick/sec" : " ticks/sec");
  }

  // Advance one tick; returns false if we should stop (pause on collision).
  function stepOnce() {
    const before = sim.totalCollisions;
    sim.step();
    return !(els.pauseOnHit.checked && sim.totalCollisions > before);
  }

  // ---------- panels ----------
  const robotLabel = (id) => `<span class="robot-dot" style="background:${ROBOT_COLORS[id]}"></span>R${id + 1}`;

  function describe(r) {
    switch (r.state) {
      case STATE.TO_PICKUP: return `→ Pickup ${r.pickup + 1}`;
      case STATE.PICKING: return `Picking at P${r.pickup + 1}`;
      case STATE.TO_DROP: return `→ Drop-off ${r.drop + 1}`;
      case STATE.DROPPING: return `Placing at D${r.drop + 1}`;
      default: return r.state;
    }
  }

  function updatePanels(force) {
    if (!force && sim.tick === renderedTick) return;
    renderedTick = sim.tick;
    const waits = sim.robots.reduce((s, r) => s + r.waits, 0);
    els.sTick.textContent = sim.tick.toLocaleString();
    els.sDeliv.textContent = sim.deliveries.toLocaleString();
    els.sRate.textContent = sim.tick ? `${(sim.deliveries / sim.tick * 1000).toFixed(1)} per 1,000 ticks` : "";
    els.sColl.textContent = sim.totalCollisions.toLocaleString();
    els.sColl.classList.toggle("hit", sim.totalCollisions > 0);
    els.sCollSplit.textContent = `${sim.collisions.vertex} same-cell · ${sim.collisions.swap} head-on swap`;
    els.sWaits.textContent = waits.toLocaleString();

    els.robotBody.innerHTML = sim.robots.map((r) =>
      `<tr><td>${robotLabel(r.id)}</td><td>${describe(r)}</td><td>${r.deliveries}</td><td>${r.collisions}</td><td>${r.waits}</td></tr>`
    ).join("");

    if (!sim.events.length) {
      els.log.innerHTML = '<li class="muted">Collisions will show up here.</li>';
    } else {
      els.log.innerHTML = sim.events.slice(-60).reverse().map((e) =>
        `<li>Tick ${e.tick}: ${robotLabel(e.a)} &amp; ${robotLabel(e.b)} — <span class="type">${e.type === "vertex" ? "same cell" : "head-on swap"}</span> at (${world.x(e.cell)}, ${world.y(e.cell)})</li>`
      ).join("");
    }
    if (!running) els.startBtn.textContent = sim.tick > 0 ? "Resume" : "Start";
  }

  // ---------- drawing ----------
  let colors = {};
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ["floor", "grid", "wall", "pick", "drop", "neg", "text", "muted", "panel"]) {
      colors[k] = cs.getPropertyValue("--" + k).trim();
    }
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let cell = 20;
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = els.map.clientWidth;
    cell = width / world.cols;
    const height = cell * world.rows;
    els.map.style.height = height + "px";
    els.map.width = Math.round(width * dpr);
    els.map.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const cx = (i) => (world.x(i) + 0.5) * cell;
  const cy = (i) => (world.y(i) + 0.5) * cell;

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawStation(i, color, label) {
    const pad = cell * 0.08;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    roundRect(world.x(i) * cell + pad, world.y(i) * cell + pad, cell - 2 * pad, cell - 2 * pad, cell * 0.2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, cell * 0.08);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.max(8, cell * 0.36)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx(i), cy(i));
  }

  function draw(frac) {
    const W = world.cols * cell, H = world.rows * cell;
    ctx.fillStyle = colors.floor;
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < world.cols; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, H); }
    for (let y = 1; y < world.rows; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(W, y * cell); }
    ctx.stroke();

    // shelves
    ctx.fillStyle = colors.wall;
    for (let i = 0; i < world.walls.length; i++) {
      if (world.walls[i]) ctx.fillRect(world.x(i) * cell + 0.5, world.y(i) * cell + 0.5, cell - 1, cell - 1);
    }

    // robot start docks
    ctx.strokeStyle = colors.muted;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    for (const s of world.starts) ctx.strokeRect(world.x(s) * cell + 3, world.y(s) * cell + 3, cell - 6, cell - 6);
    ctx.setLineDash([]);

    world.pickups.forEach((p, k) => drawStation(p, colors.pick, "P" + (k + 1)));
    world.drops.forEach((d, k) => drawStation(d, colors.drop, "D" + (k + 1)));

    // planned paths, starting from where each robot is drawn right now
    if (els.showPaths.checked) {
      ctx.lineWidth = Math.max(2, cell * 0.12);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const r of sim.robots) {
        if (r.path.length < 2) continue;
        const offset = (r.id - 2) * cell * 0.07; // nudge so overlapping paths stay visible
        ctx.strokeStyle = ROBOT_COLORS[r.id];
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(lerp(cx(r.prev), cx(r.pos), frac) + offset, lerp(cy(r.prev), cy(r.pos), frac) + offset);
        for (let k = 1; k < r.path.length; k++) ctx.lineTo(cx(r.path[k]) + offset, cy(r.path[k]) + offset);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // goal markers
    ctx.lineWidth = Math.max(1.5, cell * 0.07);
    for (const r of sim.robots) {
      ctx.strokeStyle = ROBOT_COLORS[r.id];
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx(r.goal), cy(r.goal), cell * 0.46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // recent collisions
    for (const e of sim.events) {
      const age = sim.tick - e.tick;
      if (age > HIT_FLASH_TICKS) continue;
      ctx.globalAlpha = 1 - age / (HIT_FLASH_TICKS + 1);
      ctx.fillStyle = colors.neg;
      ctx.beginPath();
      ctx.arc(cx(e.cell), cy(e.cell), cell * (0.5 + age * 0.06), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // robots
    for (const r of sim.robots) {
      const x = lerp(cx(r.prev), cx(r.pos), frac), y = lerp(cy(r.prev), cy(r.pos), frac);
      const rad = cell * 0.36;
      ctx.fillStyle = ROBOT_COLORS[r.id];
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.panel;
      ctx.lineWidth = 2;
      ctx.stroke();
      const carrying = r.state === STATE.TO_DROP || r.state === STATE.DROPPING;
      if (carrying) {
        const b = rad * 0.75;
        ctx.fillStyle = colors.drop;
        ctx.fillRect(x - b / 2, y - rad - b * 0.6, b, b * 0.7);
      }
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${Math.max(8, cell * 0.36)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(r.id + 1), x, y + 0.5);
    }
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);

  // ---------- main loop ----------
  function frame(now) {
    const dt = lastFrame ? Math.min(now - lastFrame, 250) : 0;
    lastFrame = now;
    const tickMs = 1000 / ticksPerSecond();
    if (running) {
      acc += dt;
      let n = 0;
      while (acc >= tickMs && n < MAX_TICKS_PER_FRAME) {
        acc -= tickMs;
        n++;
        if (!stepOnce()) { setRunning(false); break; }
      }
      if (n === MAX_TICKS_PER_FRAME) acc = 0;
    }
    updatePanels(false);
    draw(running ? ease(Math.min(1, acc / tickMs)) : 1);
    requestAnimationFrame(frame);
  }

  // ---------- benchmark ----------
  function runBenchmark() {
    const ticks = Math.min(200000, Math.max(100, Math.floor(Number(els.benchTicks.value) || 5000)));
    const opts = simOptions();
    const b = new RobotSim(opts);
    const t0 = performance.now();
    for (let i = 0; i < ticks; i++) b.step();
    const ms = performance.now() - t0;
    const waits = b.robots.reduce((s, r) => s + r.waits, 0);
    const empty = els.benchBody.querySelector(".empty");
    if (empty) empty.remove();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${opts.planner.name}</td><td>${opts.assignment}</td><td>${opts.seed}</td>` +
      `<td>${ticks.toLocaleString()}</td><td>${b.deliveries.toLocaleString()}</td>` +
      `<td>${(b.deliveries / ticks * 1000).toFixed(1)}</td><td>${b.totalCollisions.toLocaleString()}</td>` +
      `<td>${b.collisions.vertex} / ${b.collisions.swap}</td><td>${waits.toLocaleString()}</td><td>${Math.round(ms).toLocaleString()}</td>`;
    els.benchBody.appendChild(tr);
  }

  // ---------- events ----------
  els.startBtn.addEventListener("click", () => setRunning(!running));
  els.stepBtn.addEventListener("click", () => { setRunning(false); stepOnce(); });
  els.resetBtn.addEventListener("click", () => { setRunning(false); reset(); });
  for (const el of [els.planner, els.assignment, els.seed, els.dwell]) {
    el.addEventListener("change", () => { setRunning(false); reset(); });
  }
  els.speed.addEventListener("input", updateSpeedLabel);
  els.benchBtn.addEventListener("click", runBenchmark);
  els.benchClear.addEventListener("click", () => {
    els.benchBody.innerHTML = '<tr class="empty"><td colspan="10" class="muted">No runs yet.</td></tr>';
  });

  els.map.addEventListener("click", (ev) => {
    const rect = els.map.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / cell);
    const y = Math.floor((ev.clientY - rect.top) / cell);
    if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) return;
    const i = world.idx(x, y);
    if (sim.robots.some((r) => r.pos === i)) return;
    if (!world.toggleWall(i)) return;
    sim.world.toggleWall(i);
    sim.replan();
  });

  window.addEventListener("resize", resizeCanvas);

  readColors();
  updateSpeedLabel();
  resizeCanvas();
  reset();
  requestAnimationFrame(frame);
})();
