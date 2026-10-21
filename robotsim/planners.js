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
//   req.world    grid helpers: cols, rows, idx(x, y), x(i), y(i), isWall(i), neighbors(i), manhattan(a, b)
//   req.start    current cell index of this robot
//   req.goal     target cell index
//   req.robotId  0..4; robots are planned in id order, lower ids first
//   req.tick     current simulation tick
//   req.others   the other robots: { id, pos, goal, state, dwell, path }
//                path[k] is where that robot will be k ticks from now (path[0] = pos).
//                After the path ends the robot stays put (for `dwell` ticks if it's at a station).
//
// Return an array of cell indices, one per tick, starting with req.start. Repeat a cell to
// wait in place. Each step must be to the same cell or an adjacent open cell. Return null if
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

  // Plain A* on the static map. Other robots are ignored entirely.
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

  const PLANNERS = [
    {
      id: "astar",
      name: "Shortest path (A*)",
      description: "Each robot takes its own shortest route and ignores the others, so collisions are expected.",
      replanEachTick: false,
      plan(req) { return astar(req.world, req.start, req.goal); },
    },
  ];

  const api = { PLANNERS, astar, MinHeap };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotPlanners = api;
})(typeof self !== "undefined" ? self : this);
