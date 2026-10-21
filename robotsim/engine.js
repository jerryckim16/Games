// Warehouse robot simulation engine. No DOM access, so it can run in the browser or in Node.
//
// The world is a 4-connected grid. Time advances in discrete ticks; on each tick every robot
// either stays in its cell or moves to an adjacent one. Paths come from a pluggable planner
// (see planners.js), and the engine only checks for collisions — it never steers robots
// out of each other's way. That makes it a test bench: swap the planner, run the same
// seed, and compare the collision count.
(function (root) {
  "use strict";

  // Smallest floor; it grows (keeping this shape) to fit more stations or robots.
  const BASE_COLS = 28;
  const BASE_ROWS = 17;
  const LIMITS = { robots: [1, 20], stations: [1, 100] };
  const DEFAULT_LAYOUT = { robots: 5, pickups: 5, drops: 5 };
  // Shelf blocks and the aisles between them.
  const SHELF_W = 4, SHELF_H = 3, AISLE_X = 3, AISLE_Y = 2;
  // Open floor between the outer walls (where stations sit) and the shelves. The top and
  // bottom margins shrink when no stations line those walls.
  const MARGIN = 3, MARGIN_NO_STATIONS = 2;

  const clampInt = (v, [lo, hi], fallback) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };

  // Pick `count` cells spread evenly along `cells`.
  function spread(cells, count) {
    const out = [];
    for (let i = 0; i < count; i++) out.push(cells[Math.floor((i + 0.5) * cells.length / count)]);
    return out;
  }

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

  // Warehouse floor. Pickup stations line the left wall (then the top wall when there are
  // more than fit), drop-off spots line the right wall (then the bottom wall). Shelf blocks
  // fill the middle, and robots start in a row near the bottom.
  // layout: { robots: 1..20, pickups: 1..100, drops: 1..100 }
  class World {
    constructor(layout) {
      layout = layout || {};
      const robots = clampInt(layout.robots, LIMITS.robots, DEFAULT_LAYOUT.robots);
      const pickups = clampInt(layout.pickups, LIMITS.stations, DEFAULT_LAYOUT.pickups);
      const drops = clampInt(layout.drops, LIMITS.stations, DEFAULT_LAYOUT.drops);
      this.layout = { robots, pickups, drops };

      // Grow until each station type fits on its two walls and the robots have room.
      const need = Math.max(pickups, drops);
      let cols = BASE_COLS, rows = BASE_ROWS;
      for (let k = 1; ; k += 0.05) {
        cols = Math.round(BASE_COLS * k);
        rows = Math.round(BASE_ROWS * k);
        if (cols + rows - 4 >= need && k * k * 8 >= robots) break;
      }
      this.cols = cols;
      this.rows = rows;
      this.walls = new Uint8Array(cols * rows);

      const my = need <= rows - 2 ? MARGIN_NO_STATIONS : MARGIN;
      const innerW = cols - 2 * MARGIN, innerH = rows - 2 * my;
      const nx = Math.floor((innerW + AISLE_X) / (SHELF_W + AISLE_X));
      const ny = Math.floor((innerH + AISLE_Y) / (SHELF_H + AISLE_Y));
      const x0 = MARGIN + Math.floor((innerW - (nx * (SHELF_W + AISLE_X) - AISLE_X)) / 2);
      const y0 = my + Math.floor((innerH - (ny * (SHELF_H + AISLE_Y) - AISLE_Y)) / 2);
      for (let by = 0; by < ny; by++) {
        for (let bx = 0; bx < nx; bx++) {
          const sx = x0 + bx * (SHELF_W + AISLE_X), sy = y0 + by * (SHELF_H + AISLE_Y);
          for (let y = sy; y < sy + SHELF_H; y++) for (let x = sx; x < sx + SHELF_W; x++) this.walls[this.idx(x, y)] = 1;
        }
      }

      const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
      const left = range(1, rows - 2).map((y) => this.idx(0, y));
      const top = range(1, cols - 2).map((x) => this.idx(x, 0));
      const right = range(1, rows - 2).map((y) => this.idx(cols - 1, y));
      const bottom = range(1, cols - 2).map((x) => this.idx(x, rows - 1));
      this.pickups = spread(pickups <= left.length ? left : left.concat(top), pickups);
      this.drops = spread(drops <= right.length ? right : right.concat(bottom), drops);
      this.starts = spread(range(MARGIN, cols - MARGIN - 1).map((x) => this.idx(x, rows - my)), robots);
      this.stations = new Set([...this.pickups, ...this.drops]);
      // Doorways: floor cells next to a station. Robots get in and out of stations through
      // them, so planners shouldn't park there.
      this.doorways = new Uint8Array(cols * rows);
      for (const st of this.stations) {
        const x = this.x(st), y = this.y(st);
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nb = this.idx(nx, ny);
          if (!this.stations.has(nb)) this.doorways[nb] = 1;
        }
      }
      this.reserved = new Set([...this.stations, ...this.starts]);
    }

    idx(x, y) { return y * this.cols + x; }
    x(i) { return i % this.cols; }
    y(i) { return (i / this.cols) | 0; }
    isWall(i) { return this.walls[i] === 1; }
    isStation(i) { return this.stations.has(i); }
    isDoorway(i) { return this.doorways[i] === 1; }
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
      const w = new World(this.layout);
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

  // opts: { planner, assignment: "random" | "fixed", seed, dwellTicks, world | layout }
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
      this.world = opts.world ? opts.world.clone() : new World(opts.layout);
      this.rng = mulberry32(this.seed);
      this.tick = 0;
      this.deliveries = 0;
      this.lastDeliveryTick = 0;
      this.longestStall = 0;     // most ticks in a row without a delivery
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
    // A planner may set priority(robot, robots) to change the order (lower plans first; ties by id).
    planAll(force) {
      const replanEachTick = !!(this.planner && this.planner.replanEachTick);
      let order = this.robots;
      if (this.planner && this.planner.priority) {
        const views = this.robots.map((r) => this.view(r));
        const key = new Map(this.robots.map((r, i) => [r, this.planner.priority(views[i], views)]));
        order = [...this.robots].sort((a, b) => key.get(a) - key.get(b) || a.id - b.id);
      }
      for (const r of order) {
        if (!this.moving(r) || r.pos === r.goal) continue;
        if (force || replanEachTick || r.path.length <= 1) this.plan(r);
      }
    }

    plan(r) {
      const others = this.robots.filter((o) => o !== r).map((o) => this.view(o));
      let path = null;
      try {
        path = this.planner.plan({
          world: this.world, start: r.pos, goal: r.goal, robotId: r.id, tick: this.tick, others,
          current: r.path.slice(),
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

    // Besides basic movement rules, a path may only touch a station cell where it starts or
    // where it ends: robots can't cut through another station on the way.
    // What a planner gets to see of a robot.
    view(o) {
      return {
        id: o.id, pos: o.pos, goal: o.goal, state: o.state,
        moving: this.moving(o),
        path: o.path.slice(),
        // How many more ticks it will sit still at its station before it moves on.
        dwell: this.moving(o) ? 0 : o.dwell,
      };
    }

    validPath(start, path) {
      if (!Array.isArray(path) || path.length === 0 || path[0] !== start) return false;
      const end = path[path.length - 1];
      const w = this.world;
      for (let k = 1; k < path.length; k++) {
        const a = path[k - 1], b = path[k];
        if (b < 0 || b >= w.walls.length || w.isWall(b)) return false;
        if (a !== b && w.manhattan(a, b) !== 1) return false;
        if (w.isStation(b) && b !== start && b !== end) return false;
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
      this.longestStall = Math.max(this.longestStall, this.tick - this.lastDeliveryTick);
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
            this.lastDeliveryTick = this.tick;
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

  const api = { World, RobotSim, STATE, LIMITS, mulberry32 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotEngine = api;
})(typeof self !== "undefined" ? self : this);
