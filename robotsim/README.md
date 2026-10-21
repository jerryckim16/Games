# Warehouse Robot Simulator

A grid warehouse where robots shuttle items from pickup stations to drop-off spots, over and over, while the simulator counts collisions. It's a test bench for multi-robot pathfinding: swap the algorithm, run the same seed, and compare deliveries, collisions and gridlock.

Open `index.html` in a browser. There's no build step and no dependencies.

## Features

- **1–20 robots, 1–100 pickup stations, 1–100 drop-off spots.** The warehouse is generated from these counts and grows to fit:
  - pickups line the left wall, then the top;
  - drop-offs line the right wall, then the bottom;
  - shelf blocks fill the middle, and robots start in a row near the bottom.
- **Batteries and charging stations (0–20).**
  - Chargers sit on the bottom wall (then the top). With 0 chargers, batteries are off.
  - Robots use one unit of battery per tick of work and start between 60% and full.
  - Before each job, a robot checks it can finish the job, reach a charger and wait out one full charge there, plus 50% for traffic. If not, it charges first.
  - It picks the charger where charging can start soonest, charges to full, then does the job it held back.
  - A robot that runs flat stops for the rest of the run and is counted.
  - The settings show the minimum number of chargers the fleet needs: robots × charge time ÷ (battery life + charge time).
- **Five pathfinding algorithms**, described below, chosen from a dropdown.
- **Collision detection:**
  - *same cell*: two robots in one cell;
  - *head-on swap*: two robots trade cells.
  - A pair that stays in conflict counts once. Robots can't pass through stations other than their destination.
- **Task assignment:** a random station each trip (seeded, so it's reproducible), or fixed pairs where robot N uses pickup N → drop-off N.
- **Live view:**
  - planned paths, goal markers and collision flashes;
  - battery gauges, and a box on robots carrying an item;
  - click an empty cell to add or remove a shelf, and robots re-plan right away.
- **Stats:**
  - deliveries per 1,000 ticks, collisions and wait ticks;
  - charging trips and robots that ran out;
  - a "Gridlocked?" warning after 300 ticks without a delivery;
  - a per-robot table and a collision log.
- **Benchmark panel:**
  - runs a fresh simulation for N ticks instantly and adds a row with deliveries, collisions, wait ticks, longest stall, charges, ran-out count and compute time;
  - change the algorithm and run again to compare.

## Algorithms

| Algorithm | How it works | Strengths | Weaknesses |
|---|---|---|---|
| **Shortest path (A\*)** | Each robot takes its own shortest route and ignores the others. | Fastest. Upper bound on deliveries. | Collides constantly. |
| **Cooperative A\* (reservations)** | Windowed cooperative A\* (WHCA\*). Every tick, robots plan 16 ticks ahead in space and time, in priority order, around the cells others have reserved. | Simple. Fine with many stations. | Gridlocks when many robots share 1–3 stations. |
| **Reservation A\* (plan once)** | Plans each trip's full route through time once and keeps it while it stays conflict-free. The first robot to arrive gets a station; queuing robots hold 6 cells back and step aside. | Robust in every layout, and needs less computing than replanning every tick. | Fewer deliveries than CBS or PIBT in crowds. |
| **Windowed CBS (joint planning)** | Conflict-Based Search over all moving robots, 10 ticks ahead, every tick (as in RHCR). Clashes are resolved by branching on constraints. The closest robot to a free station gets it. Falls back to safe one-at-a-time planning when the search budget runs out. | Most deliveries of the collision-free algorithms in normal traffic. | Heaviest computing. Behind PIBT on the most crowded layouts. |
| **PIBT (priority inheritance)** | One step per tick. Robots choose moves in priority order, and a robot in the way inherits the priority and must move aside. Robots leaving a station plan first, because stations are dead ends. | Fastest collision-free algorithm. Best when many robots share few stations. | Greedy, so slightly behind CBS in normal traffic. |

Shared rules: the four collision-free algorithms never wait on a doorway cell (the floor cell next to a station), and the next tick is always reserved strictly. That's what guarantees zero collisions.

### Benchmark results

These are deliveries in 3,000 ticks, seed 42, random assignment, 3-tick pick/place, no batteries. Collisions are in brackets for shortest path; all four others had **0 collisions**. Regenerate the table with `node robotsim/bench.js`.

| Layout | Shortest path | Cooperative A\* | Reservation A\* | Windowed CBS | PIBT |
|---|---|---|---|---|---|
| 5 robots, 5P / 5D | 210 (228) | 207 | 205 | **209** | 204 |
| 20 robots, 100P / 100D | 486 (868) | 472 | 478 | **482** | 465 |
| 20 robots, 20P / 20D | 536 (1,160) | 527 | 521 | **531** | 517 |
| 20 robots, 5P / 5D | 532 (1,175) | 471 | 503 | **522** | 517 |
| 15 robots, 3P / 3D | 463 (1,708) | 235 (gridlocks) | 419 | **450** | 439 |
| 10 robots, 1P / 20D | 493 (1,722) | 67 (gridlocks) | 397 | 446 | **455** |
| 20 robots, 1P / 1D | 580 (9,118) | 4 (gridlocks) | 402 | 491 | **566** |

Compute for 3,000 ticks: shortest path under 0.2 s, PIBT 0.1–0.9 s, CBS 0.3–2.7 s, Cooperative A\* and Reservation A\* 0.2–4.5 s.

With batteries (500-tick battery, 100-tick charge; deliveries / robots that ran out):

| Layout | Chargers needed | Shortest path | Cooperative A\* | Reservation A\* | Windowed CBS | PIBT |
|---|---|---|---|---|---|---|
| 5 robots, 5P / 5D, 3 chargers | 1 | 174 / 0 | 171 / 0 | 170 / 0 | 172 / 0 | 172 / 0 |
| 20 robots, 20P / 20D, 5 chargers | 4 | 423 / 0 | 405 / 0 | 390 / 0 | 406 / 0 | 403 / 0 |
| 20 robots, 5P / 5D, 2 chargers | 4 | 428 / 0 | 55 / 20 | 187 / 10 | 210 / 10 | 57 / 20 |

With too few chargers, robots queue at the chargers and run flat. Shortest path never runs out only because its robots charge on top of each other in the same cell.

## Files

| File | What it holds |
|---|---|
| `index.html`, `styles.css` | Page and styles. Light and dark themes come from CSS tokens. |
| `engine.js` | Simulation with no DOM access, so it also runs in Node: `World` (layout, stations, distances), `RobotSim` (tasks, batteries, movement, collision detection). |
| `planners.js` | Every algorithm, plus the shared space-time search, reservations, and CBS / PIBT code. |
| `app.js` | UI: controls, canvas drawing, stats, benchmark panel. |
| `bench.js` | Headless benchmark that prints a Markdown table. |

## Adding an algorithm

Add an object to `PLANNERS` in `planners.js` and it appears in the dropdown:

```js
{
  id: "my-algo",
  name: "My algorithm",
  description: "One line shown under the dropdown.",
  replanEachTick: false,       // true: plan() runs for every moving robot every tick
  priority(robot, robots) {},  // optional: lower plans first each tick
  plan(req) { return path; },
}
```

`plan(req)` gets:
- `world`: grid helpers, including `neighbors`, `isWall`, `isStation`, `isDoorway` and `manhattan`;
- `start` and `goal`: cell indices;
- `robotId` and `tick`;
- `current`: this robot's remaining path;
- `others`: the other robots, each `{ id, pos, goal, state, moving, dwell, path }`.

It returns an array of cell indices, one per tick, starting at `start`. Repeat a cell to wait. Each step must go to the same cell or an adjacent open cell, and the path may touch a station only where it starts or ends. Return `null` if there's no path. The comment at the top of `planners.js` has the full contract.

Then run `node robotsim/bench.js --planners my-algo,cbs,pibt` to compare.

## Changelog

- **Batteries and charging stations.** 0–20 chargers, battery life and charge-time settings, a check before each job, charger choice by earliest start, a minimum-chargers hint, battery gauges, and benchmark columns.
- **PIBT.** Priority inheritance with backtracking, with robots leaving stations planning first. Its intended route is drawn on the map.
- **Windowed CBS.** Joint planning with Conflict-Based Search over a 10-tick window, with station access settled up front.
- **Up to 20 robots and 100 + 100 stations.** A generated layout, the doorway rule, queuing robots that yield, gridlock warnings and a longest-stall column.
- **Reservation A\*.** Plans each trip once, first-come station claims, and faster shared search.
- **Cooperative A\*.** Windowed cooperative A\* with space-time reservations.
- **No passing through stations.** Robots can't cut through stations other than their destination.
- **Initial version.** 5 robots, 5 + 5 stations, shortest-path A\*, collision detection, and the benchmark panel.
