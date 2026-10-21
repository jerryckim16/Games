// Pathfinding algorithms ("planners"). Each one shows up in the Algorithm dropdown.
//
// To test a new algorithm, add an object to PLANNERS:
//
//   {
//     id: "my-algo",
//     name: "My algorithm",
//     description: "One line shown under the dropdown.",
//     replanEachTick: false,   // true = plan() is called for every moving robot on every tick
//     plan(req) { ... return path; },
//   }
//
// plan(req) receives:
//   req.world    grid helpers: cols, rows, idx(x, y), x(i), y(i), isWall(i), isStation(i),
//                neighbors(i), manhattan(a, b)
//   req.start    current cell index of this robot
//   req.goal     target cell index
//   req.robotId  0..4; robots are planned in id order, lower ids first
//   req.tick     current simulation tick
//   req.others   the other robots: { id, pos, goal, state, dwell, path }
//                path[k] is where that robot will be k ticks from now (path[0] = pos).
//                After the path ends the robot stays put (for `dwell` ticks if it's at a station).
//
// Return an array of cell indices, one per tick, starting with req.start. Repeat a cell to
// wait in place. Each step must be to the same cell or an adjacent open cell, and the path may
// not pass through a station other than the one it starts or ends on. Return null if
// there's no path; the robot waits a tick and asks again.
(function (root) {
  "use strict";

  // Binary min-heap keyed by f, ties broken by insertion order so results are deterministic.
  class MinHeap {
    constructor() { this.items = []; this.seq = 0; }
    get size() { return this.items.length; }
    push(value, f) {
      const a = this.items;
      a.push({ value, f, s: this.seq++ });
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!this.less(a[i], a[p])) break;
        [a[i], a[p]] = [a[p], a[i]];
        i = p;
      }
    }
    pop() {
      const a = this.items, top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < a.length && this.less(a[l], a[m])) m = l;
          if (r < a.length && this.less(a[r], a[m])) m = r;
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top.value;
    }
    less(x, y) { return x.f < y.f || (x.f === y.f && x.s < y.s); }
  }

  // Plain A* on the static map. Other robots are ignored entirely. Station cells are only
  // entered when they're the goal.
  function astar(world, start, goal) {
    if (start === goal) return [start];
    const n = world.cols * world.rows;
    const g = new Int32Array(n).fill(-1);
    const from = new Int32Array(n).fill(-1);
    const open = new MinHeap();
    g[start] = 0;
    open.push(start, world.manhattan(start, goal));
    while (open.size) {
      const cur = open.pop();
      if (cur === goal) break;
      for (const nb of world.neighbors(cur)) {
        if (nb !== goal && world.isStation(nb)) continue;
        const cost = g[cur] + 1;
        if (g[nb] !== -1 && g[nb] <= cost) continue;
        g[nb] = cost;
        from[nb] = cur;
        open.push(nb, cost + world.manhattan(nb, goal));
      }
    }
    if (g[goal] === -1) return null;
    const path = [goal];
    for (let c = goal; c !== start; c = from[c]) path.push(from[c]);
    return path.reverse();
  }

  // True distance to `goal` on the static map (stations other than the goal are impassable),
  // cached per world and goal until the shelves change. Used as the WHCA* heuristic.
  const distCache = new WeakMap();
  function distanceMap(world, goal) {
    let byGoal = distCache.get(world);
    if (!byGoal) distCache.set(world, (byGoal = new Map()));
    const hit = byGoal.get(goal);
    if (hit && hit.walls.every((v, i) => v === world.walls[i])) return hit.dist;
    const dist = new Int32Array(world.cols * world.rows).fill(-1);
    const queue = [goal];
    dist[goal] = 0;
    for (let q = 0; q < queue.length; q++) {
      const c = queue[q];
      for (const nb of world.neighbors(c)) {
        if (dist[nb] !== -1 || world.isStation(nb)) continue;
        dist[nb] = dist[c] + 1;
        queue.push(nb);
      }
    }
    byGoal.set(goal, { walls: world.walls.slice(), dist });
    return dist;
  }

  // Windowed Hierarchical Cooperative A* (Silver, 2005), simplified.
  // Searches over (cell, time) for the next WHCA_WINDOW ticks, treating every other robot's
  // committed path as a reservation, then follows the true distance heuristic beyond that.
  // Robots replan every tick in id order, so each one routes around the robots planned
  // before it. A cell is reserved both at the tick another robot is in it and the tick after
  // it leaves, which rules out head-on swaps and guarantees that staying put on the next
  // tick is always safe.
  const WHCA_WINDOW = 16;
  function whca(req) {
    const { world, start, goal, others } = req;
    if (start === goal) return [start];
    const n = world.cols * world.rows, W = WHCA_WINDOW;
    const dist = distanceMap(world, goal);

    // Starting on a station (e.g. leaving a pickup): the BFS never enters it, so derive h.
    let startH = dist[start];
    if (startH === -1) {
      for (const nb of world.neighbors(start)) {
        if (dist[nb] !== -1 && (startH === -1 || dist[nb] + 1 < startH)) startH = dist[nb] + 1;
      }
      if (startH === -1) return null; // goal unreachable on the static map
    }
    const h = (c) => (c === start && dist[c] === -1 ? startH : dist[c]);

    // occ[t * n + c] = 1: cell c can't be entered at tick t.
    const occ = new Uint8Array((W + 1) * n);
    for (const o of others) {
      const last = o.path.length - 1;
      for (let t = 1; t <= W; t++) {
        occ[t * n + o.path[Math.min(t, last)]] = 1;
        occ[t * n + o.path[Math.min(t - 1, last)]] = 1;
      }
    }
    // Arriving at the goal ends the search only if nobody else needs that cell afterwards.
    let goalBusyUntil = -1;
    for (let t = 1; t <= W; t++) if (occ[t * n + goal]) goalBusyUntil = t;

    const seen = new Uint8Array((W + 1) * n);
    const parent = new Int32Array((W + 1) * n).fill(-1);
    const open = new MinHeap();
    seen[start] = 1;
    open.push(start, startH);
    let end = -1;
    while (open.size) {
      const key = open.pop();
      const t = (key / n) | 0, c = key - t * n;
      if ((c === goal && t > goalBusyUntil) || t === W) { end = key; break; }
      // Stations are never passed through; the goal is only entered once it can be kept.
      const moves = [c];
      for (const nb of world.neighbors(c)) {
        if (nb === goal ? t + 1 > goalBusyUntil : !world.isStation(nb)) moves.push(nb);
      }
      for (const nc of moves) {
        const nk = (t + 1) * n + nc;
        if (seen[nk] || occ[nk] || h(nc) === -1) continue;
        seen[nk] = 1;
        parent[nk] = key;
        open.push(nk, t + 1 + h(nc));
      }
    }
    if (end === -1) return [start, start]; // boxed in for now: hold position
    const path = [];
    for (let k = end; k !== -1; k = parent[k]) path.push(k % n);
    return path.reverse();
  }

  const PLANNERS = [
    {
      id: "astar",
      name: "Shortest path (A*)",
      description: "Each robot takes its own shortest route and ignores the others, so collisions are expected.",
      replanEachTick: false,
      plan(req) { return astar(req.world, req.start, req.goal); },
    },
    {
      id: "whca",
      name: "Cooperative A* (reservations)",
      description: "Plans 16 ticks ahead in space and time, reserving cells so robots wait or detour instead of colliding. Robot 1 has right of way, then 2, and so on.",
      replanEachTick: true,
      plan: whca,
    },
  ];

  const api = { PLANNERS, astar, whca, MinHeap };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotPlanners = api;
})(typeof self !== "undefined" ? self : this);
