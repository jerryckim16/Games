#!/usr/bin/env node
// Headless benchmark: runs every planner (or the ones you pick) on one or more layouts and
// prints a Markdown table, ready to paste into README.md.
//
//   node robotsim/bench.js                                   default layouts, all planners
//   node robotsim/bench.js --ticks 5000 --seed 7
//   node robotsim/bench.js --planners cbs,pibt --layout 20,1,1
//   node robotsim/bench.js --layout 20,20,20,5 --battery 500,100
//
// --layout robots,pickups,drops[,chargers] can be repeated. --battery life,chargeTime only
// matters when a layout has chargers.
"use strict";

const { RobotSim } = require("./engine.js");
const { PLANNERS } = require("./planners.js");

const DEFAULT_LAYOUTS = [
  [5, 5, 5], [20, 100, 100], [20, 20, 20], [20, 5, 5], [15, 3, 3], [10, 1, 20], [20, 1, 1],
];

function parseArgs(argv) {
  const opts = { ticks: 3000, seed: 42, dwell: 3, planners: null, layouts: [], battery: [500, 100] };
  for (let i = 0; i < argv.length; i++) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (flag === "--ticks") opts.ticks = Number(value), i++;
    else if (flag === "--seed") opts.seed = Number(value), i++;
    else if (flag === "--dwell") opts.dwell = Number(value), i++;
    else if (flag === "--planners") opts.planners = value.split(","), i++;
    else if (flag === "--layout") opts.layouts.push(value.split(",").map(Number)), i++;
    else if (flag === "--battery") opts.battery = value.split(",").map(Number), i++;
    else throw new Error(`Unknown option ${flag}`);
  }
  if (!opts.layouts.length) opts.layouts = DEFAULT_LAYOUTS;
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const planners = opts.planners ? PLANNERS.filter((p) => opts.planners.includes(p.id)) : PLANNERS;

console.log(`${opts.ticks} ticks, seed ${opts.seed}, random assignment, ${opts.dwell}-tick pick/place` +
  (opts.layouts.some((l) => l[3]) ? `, battery ${opts.battery[0]} / charge ${opts.battery[1]}` : "") + "\n");
console.log("| Layout | Algorithm | Deliveries | Collisions | Wait ticks | Longest stall | Charges | Ran out | Compute (ms) |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const [robots, pickups, drops, chargers = 0] of opts.layouts) {
  for (const planner of planners) {
    const sim = new RobotSim({
      planner, assignment: "random", seed: opts.seed, dwellTicks: opts.dwell,
      layout: { robots, pickups, drops, chargers },
      battery: { capacity: opts.battery[0], chargeTicks: opts.battery[1] },
    });
    const t0 = Date.now();
    for (let t = 0; t < opts.ticks; t++) sim.step();
    const ms = Date.now() - t0;
    const waits = sim.robots.reduce((s, r) => s + r.waits, 0);
    const layout = `${robots} robots, ${pickups}P / ${drops}D` + (chargers ? `, ${chargers}C` : "");
    console.log(`| ${layout} | ${planner.name} | ${sim.deliveries} | ${sim.totalCollisions} | ${waits} | ` +
      `${sim.longestStall} | ${sim.batteryOn ? sim.chargeTrips : "–"} | ${sim.batteryOn ? sim.ranOut : "–"} | ${ms} |`);
  }
}
