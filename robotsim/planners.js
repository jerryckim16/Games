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
//   req.current  this robot's own remaining path from last time (current[0] = start)
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
  function sameWalls(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function distanceMap(world, goal) {
    let byGoal = distCache.get(world);
    if (!byGoal) distCache.set(world, (byGoal = new Map()));
    const hit = byGoal.get(goal);
    if (hit && sameWalls(hit.walls, world.walls)) return hit.dist;
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

  // Space-time reservations built from the other robots' committed paths.
  // occ[t * n + c] = 1 means cell c can't be entered at tick t. A cell is reserved both at the
  // tick another robot is in it and the tick after it leaves, which rules out head-on swaps
  // and guarantees that staying put on the next tick is always safe. After everyone's path
  // ends the world is static (robots stay where they stopped), so layer `last` stands in for
  // every later tick.
  function reservations(world, others, layers) {
    const n = world.cols * world.rows;
    if (layers === undefined) {
      layers = 1;
      for (const o of others) layers = Math.max(layers, o.path.length);
    }
    const occ = new Uint8Array((layers + 1) * n);
    for (const o of others) {
      const end = o.path.length - 1;
      for (let t = 1; t <= layers; t++) {
        occ[t * n + o.path[Math.min(t, end)]] = 1;
        occ[t * n + o.path[Math.min(t - 1, end)]] = 1;
      }
    }
    return { at: (t, c) => occ[Math.min(t, layers) * n + c] === 1, last: layers };
  }

  // Tick at which a robot's path reaches its final cell and stays there.
  function arrival(path) {
    let t = path.length - 1;
    while (t > 0 && path[t - 1] === path[t]) t--;
    return t;
  }

  // canKeepGoal(t): may this robot step onto `goal` at tick t and stay there? Other robots'
  // paths through or onto the goal block it. With `bump`, a robot that has merely planned to
  // park on the goal later (arriving after t + 1) doesn't: whoever gets there first wins, and
  // the later robot sees its plan is broken and replans before it gets close.
  function goalAdmission(goal, others, bump) {
    let busy = -1;          // last tick a non-bumpable robot is on (or just leaving) the goal
    const parkers = [];     // arrival ticks of robots that will park on the goal
    for (const o of others) {
      const end = o.path.length - 1;
      if (o.path[end] === goal) {
        const arr = arrival(o.path);
        if (bump && arr > 0) { parkers.push(arr); continue; }
        busy = Infinity;
        continue;
      }
      for (let k = end; k >= 0; k--) if (o.path[k] === goal) { busy = Math.max(busy, k + 1); break; }
    }
    const latest = parkers.length ? Math.min(...parkers) - 2 : Infinity;
    const admit = (t) => t > busy && t <= latest;
    admit.latest = latest;               // must be on the goal by this tick
    admit.never = busy === Infinity || latest <= busy;
    return admit;
  }

  // Scratch space shared by every search: stamp[k] === gen marks state k as seen in the
  // current search, so nothing needs clearing or reallocating between calls.
  let stamp = new Uint32Array(0), parentOf = new Int32Array(0), gen = 0;
  function scratch(size) {
    if (stamp.length < size) {
      stamp = new Uint32Array(size);
      parentOf = new Int32Array(size);
      gen = 0;
    }
    if (++gen === 0xffffffff) { stamp.fill(0); gen = 1; }
  }

  // A* over (cell, tick) up to `horizon` ticks. Each tick costs 1, moving or waiting. Ends when
  // the robot reaches the goal and can stay there; with `partial`, a search that runs out of
  // ticks returns the route that got closest instead. Stations are never passed through, and
  // the goal is only entered once it can be kept.
  function spaceTimeSearch(world, start, goal, others, res, horizon, partial, bump) {
    const cols = world.cols, rows = world.rows, n = cols * rows;
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
    const canKeepGoal = goalAdmission(goal, others, bump);
    if (canKeepGoal.never && !partial) return null;

    scratch((horizon + 1) * n);
    const open = new MinHeap();
    stamp[start] = gen;
    parentOf[start] = -1;
    open.push(start, startH);
    let end = -1;
    while (open.size) {
      const key = open.pop();
      const t = (key / n) | 0, c = key - t * n;
      if (c === goal && canKeepGoal(t)) { end = key; break; }
      if (t === horizon) {
        if (partial) { end = key; break; }
        continue;
      }
      // Wait, then up / right / down / left (same order as world.neighbors).
      const x = c % cols, y = (c / cols) | 0;
      for (let m = 0; m < 5; m++) {
        let nc = c;
        if (m === 1) { if (y === 0) continue; nc = c - cols; }
        else if (m === 2) { if (x === cols - 1) continue; nc = c + 1; }
        else if (m === 3) { if (y === rows - 1) continue; nc = c + cols; }
        else if (m === 4) { if (x === 0) continue; nc = c - 1; }
        if (m > 0) {
          if (world.walls[nc]) continue;
          // Stations are never passed through; the goal is only entered once it can be kept.
          if (nc === goal ? !canKeepGoal(t + 1) : world.isStation(nc)) continue;
        }
        const nk = (t + 1) * n + nc;
        if (stamp[nk] === gen || h(nc) === -1) continue;
        if (!partial && t + 1 + h(nc) > canKeepGoal.latest) continue; // can't beat the next parker
        if (nc !== goal && res.at(t + 1, nc)) continue;
        stamp[nk] = gen;
        parentOf[nk] = key;
        open.push(nk, t + 1 + h(nc));
      }
    }
    if (end === -1) return null;
    const path = [];
    for (let k = end; k !== -1; k = parentOf[k]) path.push(k % n);
    return path.reverse();
  }

  // Windowed Hierarchical Cooperative A* (Silver, 2005), simplified.
  // Searches over (cell, time) for the next WHCA_WINDOW ticks, treating every other robot's
  // committed path as a reservation, then follows the true distance heuristic beyond that.
  // Robots replan every tick in id order, so each one routes around the robots planned
  // before it.
  const WHCA_WINDOW = 16;
  function whca(req) {
    const { world, start, goal, others } = req;
    if (start === goal) return [start];
    const res = reservations(world, others, WHCA_WINDOW);
    // Boxed in for now: hold position, which is always safe for one tick.
    return spaceTimeSearch(world, start, goal, others, res, WHCA_WINDOW, true, false) || [start, start];
  }

  // Reservation A*: plan the whole trip through time once, then keep that plan as long as it
  // stays conflict-free. Most ticks cost only a cheap check of the plan against the others'
  // paths; a full search runs when a robot gets a new destination or its plan is broken.
  // Stations go to whoever arrives first (see goalAdmission), and a robot queuing for a busy
  // station falls back to a short windowed plan until it frees up. Committed plans never
  // conflict with each other, so the same safety argument as WHCA holds.
  const RESERVE_SLACK = 64;
  function stillValid(world, path, start, goal, others) {
    if (!path || path.length < 2 || path[0] !== start || path[path.length - 1] !== goal) return false;
    for (let t = 1; t < path.length; t++) if (world.isWall(path[t])) return false; // shelf added
    for (const o of others) {
      const end = o.path.length - 1;
      const at = (t) => o.path[t < end ? t : end];
      for (let t = 1; t < path.length; t++) {
        if (path[t] !== goal && (path[t] === at(t) || path[t] === at(t - 1))) return false;
      }
    }
    return goalAdmission(goal, others, true)(arrival(path));
  }
  function reservationAstar(req) {
    const { world, start, goal, others, current } = req;
    if (start === goal) return [start];
    if (stillValid(world, current, start, goal, others)) return current;
    const res = reservations(world, others);
    const horizon = res.last + world.manhattan(start, goal) * 2 + RESERVE_SLACK;
    return spaceTimeSearch(world, start, goal, others, res, horizon, false, true) ||
      spaceTimeSearch(world, start, goal, others, res, WHCA_WINDOW, true, true) || [start, start];
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
    {
      id: "reserve",
      name: "Reservation A* (plan once)",
      description: "Plans each trip's full route through time once and reserves it; others route around it. Replans only when the route is blocked, so it needs far less computing.",
      replanEachTick: true,
      plan: reservationAstar,
    },
  ];

  const api = { PLANNERS, astar, whca, reservationAstar, MinHeap };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotPlanners = api;
})(typeof self !== "undefined" ? self : this);
