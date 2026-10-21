// Warehouse robot simulation engine. No DOM access, so it can run in the browser or in Node.
//
// The world is a 4-connected grid. Time advances in discrete ticks; on each tick every robot
// either stays in its cell or moves to an adjacent one. Paths come from a pluggable planner
// (see planners.js), and the engine only checks for collisions — it never steers robots
// out of each other's way. That makes it a test bench: swap the planner, run the same
// seed, and compare the collision count.
(function (root) {
  "use strict";

  const COLS = 28;
  const ROWS = 17;
  const STATION_ROWS = [2, 5, 8, 11, 14];
  // Shelf blocks as [x0, y0, x1, y1] inclusive. Aisles run between them in both directions.
  const SHELVES = [
    [5, 2, 8, 4], [12, 2, 15, 4], [19, 2, 22, 4],
    [5, 7, 8, 9], [12, 7, 15, 9], [19, 7, 22, 9],
    [5, 12, 8, 13], [12, 12, 15, 13], [19, 12, 22, 13],
  ];
  const ROBOT_STARTS = [[10, 16], [12, 16], [14, 16], [16, 16], [18, 16]];

  const STATE = { TO_PICKUP: "to pickup", PICKING: "picking", TO_DROP: "to drop-off", DROPPING: "dropping" };

  // Small seeded PRNG so a run is reproducible: same seed + same planner = same result.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class World {
    constructor() {
      this.cols = COLS;
      this.rows = ROWS;
      this.walls = new Uint8Array(COLS * ROWS);
      for (const [x0, y0, x1, y1] of SHELVES) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.walls[this.idx(x, y)] = 1;
      }
      this.pickups = STATION_ROWS.map((y) => this.idx(1, y));
      this.drops = STATION_ROWS.map((y) => this.idx(COLS - 2, y));
      this.starts = ROBOT_STARTS.map(([x, y]) => this.idx(x, y));
      this.reserved = new Set([...this.pickups, ...this.drops, ...this.starts]);
    }

    idx(x, y) { return y * this.cols + x; }
    x(i) { return i % this.cols; }
    y(i) { return (i / this.cols) | 0; }
    isWall(i) { return this.walls[i] === 1; }
    manhattan(a, b) { return Math.abs(this.x(a) - this.x(b)) + Math.abs(this.y(a) - this.y(b)); }

    // Open 4-connected neighbours of cell i.
    neighbors(i) {
      const x = this.x(i), y = this.y(i), out = [];
      if (y > 0 && !this.walls[i - this.cols]) out.push(i - this.cols);
      if (x < this.cols - 1 && !this.walls[i + 1]) out.push(i + 1);
      if (y < this.rows - 1 && !this.walls[i + this.cols]) out.push(i + this.cols);
      if (x > 0 && !this.walls[i - 1]) out.push(i - 1);
      return out;
    }

    // Stations and robot start cells can't be walled off.
    toggleWall(i) {
      if (this.reserved.has(i)) return false;
      this.walls[i] ^= 1;
      return true;
    }

    clone() {
      const w = new World();
      w.walls.set(this.walls);
      return w;
    }
  }

  class Robot {
    constructor(id, cell) {
      this.id = id;
      this.pos = cell;
      this.prev = cell;
      this.path = [cell];   // path[0] is the current cell; path[k] is where it'll be k ticks from now
      this.state = STATE.TO_PICKUP;
      this.goal = cell;
      this.pickup = -1;     // station index
      this.drop = -1;
      this.dwell = 0;
      this.deliveries = 0;
      this.collisions = 0;
      this.moves = 0;
      this.waits = 0;       // ticks spent standing still while trying to get somewhere
      this.planErrors = 0;
    }
  }

  // opts: { planner, assignment: "random" | "fixed", seed, dwellTicks, world }
  class RobotSim {
    constructor(opts) {
      this.reset(opts);
    }

    reset(opts) {
      opts = opts || {};
      this.planner = opts.planner;
      this.assignment = opts.assignment || "random";
      this.seed = opts.seed >>> 0;
      this.dwellTicks = Math.max(0, opts.dwellTicks | 0);
      this.world = opts.world ? opts.world.clone() : new World();
      this.rng = mulberry32(this.seed);
      this.tick = 0;
      this.deliveries = 0;
      this.collisions = { vertex: 0, swap: 0 };
      this.events = [];          // collision log, newest last
      this.lastCollisionCells = [];
      this.activePairs = new Set();
      this.robots = this.world.starts.map((c, i) => new Robot(i, c));
      for (const r of this.robots) this.assignPickup(r);
      this.planAll(true);
    }

    get totalCollisions() { return this.collisions.vertex + this.collisions.swap; }

    assignPickup(r) {
      const n = this.world.pickups.length;
      r.pickup = this.assignment === "fixed" ? r.id % n : Math.floor(this.rng() * n);
      r.state = STATE.TO_PICKUP;
      r.goal = this.world.pickups[r.pickup];
      r.path = [r.pos];
    }

    assignDrop(r) {
      const n = this.world.drops.length;
      r.drop = this.assignment === "fixed" ? r.id % n : Math.floor(this.rng() * n);
      r.state = STATE.TO_DROP;
      r.goal = this.world.drops[r.drop];
      r.path = [r.pos];
    }

    moving(r) { return r.state === STATE.TO_PICKUP || r.state === STATE.TO_DROP; }

    // Ask the planner for a path for every moving robot that needs one (or all moving robots
    // when `force` is set). Robots are planned in id order, and each request can see the
    // paths already committed by the others, so prioritized planners work out of the box.
    planAll(force) {
      const replanEachTick = !!(this.planner && this.planner.replanEachTick);
      for (const r of this.robots) {
        if (!this.moving(r) || r.pos === r.goal) continue;
        if (force || replanEachTick || r.path.length <= 1) this.plan(r);
      }
    }

    plan(r) {
      const others = this.robots.filter((o) => o !== r).map((o) => ({
        id: o.id, pos: o.pos, goal: o.goal, state: o.state,
        path: o.path.slice(),
        // How many more ticks it will sit still at its station before it moves on.
        dwell: this.moving(o) ? 0 : o.dwell,
      }));
      let path = null;
      try {
        path = this.planner.plan({
          world: this.world, start: r.pos, goal: r.goal, robotId: r.id, tick: this.tick, others,
        });
      } catch (err) {
        if (typeof console !== "undefined") console.error(`Planner "${this.planner.name}" threw:`, err);
      }
      if (!this.validPath(r.pos, path)) {
        // No path (or a broken one): stand still this tick and ask again next tick.
        if (path) r.planErrors++;
        r.path = [r.pos];
        return;
      }
      r.path = path.slice();
    }

    validPath(start, path) {
      if (!Array.isArray(path) || path.length === 0 || path[0] !== start) return false;
      const w = this.world;
      for (let k = 1; k < path.length; k++) {
        const a = path[k - 1], b = path[k];
        if (b < 0 || b >= w.walls.length || w.isWall(b)) return false;
        if (a !== b && w.manhattan(a, b) !== 1) return false;
      }
      return true;
    }

    step() {
      this.planAll(false);

      // Move everyone one cell along their path.
      for (const r of this.robots) {
        r.prev = r.pos;
        if (r.path.length > 1) {
          r.path.shift();
          r.pos = r.path[0];
        }
        if (this.moving(r)) {
          if (r.pos === r.prev && r.pos !== r.goal) r.waits++;
          else if (r.pos !== r.prev) r.moves++;
        }
      }
      this.tick++;
      this.detectCollisions();

      // Arrivals and station work.
      for (const r of this.robots) {
        if (this.moving(r) && r.pos === r.goal) {
          r.state = r.state === STATE.TO_PICKUP ? STATE.PICKING : STATE.DROPPING;
          r.dwell = this.dwellTicks;
          r.path = [r.pos];
        }
        if (r.state === STATE.PICKING || r.state === STATE.DROPPING) {
          if (r.dwell > 0) { r.dwell--; continue; }
          if (r.state === STATE.PICKING) {
            this.assignDrop(r);
          } else {
            r.deliveries++;
            this.deliveries++;
            this.assignPickup(r);
          }
        }
      }
    }

    // Vertex conflict: two robots in the same cell. Swap conflict: two robots trade cells,
    // passing through each other. A pair that stays in conflict for several ticks counts once.
    detectCollisions() {
      const rs = this.robots, pairsNow = new Set(), cells = [];
      for (let i = 0; i < rs.length; i++) {
        for (let j = i + 1; j < rs.length; j++) {
          const a = rs[i], b = rs[j];
          let type = null, cell = -1;
          if (a.pos === b.pos) { type = "vertex"; cell = a.pos; }
          else if (a.pos === b.prev && b.pos === a.prev) { type = "swap"; cell = a.pos; }
          if (!type) continue;
          const key = i + ":" + j;
          pairsNow.add(key);
          cells.push(cell);
          if (this.activePairs.has(key)) continue;
          this.collisions[type]++;
          a.collisions++;
          b.collisions++;
          this.events.push({ tick: this.tick, type, a: a.id, b: b.id, cell });
        }
      }
      if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
      this.activePairs = pairsNow;
      this.lastCollisionCells = cells;
    }

    // Force every moving robot to re-plan, e.g. after the map changed.
    replan() { this.planAll(true); }
  }

  const api = { World, RobotSim, STATE, mulberry32 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotEngine = api;
})(typeof self !== "undefined" ? self : this);
