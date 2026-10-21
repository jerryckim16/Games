// Pathfinding algorithms ("planners"). Each one shows up in the Algorithm dropdown.
//
// To test a new algorithm, add an object to PLANNERS:
//
//   {
//     id: "my-algo",
//     name: "My algorithm",
//     description: "One line shown under the dropdown.",
//     replanEachTick: false,   // true = plan() is called for every moving robot on every tick
//     priority(robot, robots) { ... }, // optional: lower plans first each tick (ties by id)
//     plan(req) { ... return path; },
//   }
//
// plan(req) receives:
//   req.world    grid helpers: cols, rows, idx(x, y), x(i), y(i), isWall(i), isStation(i),
//                isDoorway(i) (floor cell next to a station), neighbors(i), manhattan(a, b)
//   req.start    current cell index of this robot
//   req.goal     target cell index
//   req.current  this robot's own remaining path from last time (current[0] = start)
//   req.robotId  0..4; robots are planned in id order, lower ids first
//   req.tick     current simulation tick
//   req.others   the other robots: { id, pos, goal, state, moving, dwell, path }
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
  // Queued robots (see `isQueued`) only hold their cells for the next tick; later on they're
  // expected to step aside.
  function reservations(world, others, layers, queued) {
    const n = world.cols * world.rows;
    if (layers === undefined) {
      layers = 1;
      for (const o of others) if (!queued(o)) layers = Math.max(layers, o.path.length);
    }
    const occ = new Uint8Array((layers + 1) * n);
    for (const o of others) {
      const end = o.path.length - 1;
      const until = queued(o) ? 1 : layers;
      for (let t = 1; t <= until; t++) {
        occ[t * n + o.path[Math.min(t, end)]] = 1;
        occ[t * n + o.path[Math.min(t - 1, end)]] = 1;
      }
    }
    return { at: (t, c) => occ[Math.min(t, layers) * n + c] === 1, last: layers };
  }

  // A robot is queued when it's waiting for a station another robot has claimed (is on, or
  // has a plan that ends on it). Queued robots plan after everyone else and yield: the others
  // may plan through their cells from two ticks out, and a queued robot then has to move
  // aside. The next tick is always reserved strictly, so this never causes a collision.
  // Returns a test for robots in `robots` (each { goal, moving, path }).
  function isQueued(robots) {
    const claimedBy = new Map();
    for (const r of robots) {
      const end = r.path[r.path.length - 1];
      if (end === r.goal) claimedBy.set(end, r);
    }
    return (o) => {
      if (!o.moving || o.path[o.path.length - 1] === o.goal) return false;
      const owner = claimedBy.get(o.goal);
      return owner !== undefined && owner !== o;
    };
  }
  const queuedLast = (r, robots) => (isQueued(robots)(r) ? 1 : 0);
  // The robot being planned, in the same shape as req.others.
  const selfView = (req) => ({ id: req.robotId, goal: req.goal, moving: true, path: req.current || [req.start] });

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
  // the goal is only entered once it can be kept. Robots never wait (or end a partial route)
  // on a doorway, so a queue for a busy station can't trap the robot inside it. A full search
  // gives up after MAX_EXPANSIONS states and the caller falls back to a windowed one.
  const MAX_EXPANSIONS = 40000;
  // opts: { partial, bump, doorwayPause, holdDistance }
  //   doorwayPause  allow a one-tick wait on a doorway at the start, for planners that keep
  //                 their plans rather than replanning every tick
  //   holdDistance  while another robot holds the goal, a partial search aims to wait this
  //                 many steps away rather than crowding the doorway
  function spaceTimeSearch(world, start, goal, others, res, horizon, opts) {
    const { partial, bump, doorwayPause, holdDistance = 0 } = opts;
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
    const canKeepGoal = goalAdmission(goal, others, bump);
    if (canKeepGoal.never && !partial) return null;
    const hold = partial && canKeepGoal.never ? holdDistance : 0;
    const h = (c) => {
      const d = c === start && dist[c] === -1 ? startH : dist[c];
      return d === -1 ? -1 : Math.max(d, hold);
    };
    startH = h(start);

    scratch((horizon + 1) * n);
    const open = new MinHeap();
    stamp[start] = gen;
    parentOf[start] = -1;
    open.push(start, startH);
    let end = -1, expanded = 0;
    while (open.size) {
      const key = open.pop();
      const t = (key / n) | 0, c = key - t * n;
      if (c === goal && canKeepGoal(t)) { end = key; break; }
      if (t === horizon) {
        if (partial && !world.isDoorway(c)) { end = key; break; }
        continue;
      }
      if (!partial && ++expanded > MAX_EXPANSIONS) break;
      // Wait, then up / right / down / left (same order as world.neighbors).
      const x = c % cols, y = (c / cols) | 0;
      for (let m = 0; m < 5; m++) {
        let nc = c;
        // No waiting on doorways, except a robot in transit that's boxed in this very tick.
        if (m === 0 && world.isDoorway(c) && (t > 0 || hold || !doorwayPause)) continue;
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
    const res = reservations(world, others, WHCA_WINDOW, isQueued(others.concat(selfView(req))));
    // Boxed in for now: hold position, which is always safe for one tick.
    return spaceTimeSearch(world, start, goal, others, res, WHCA_WINDOW, { partial: true }) || [start, start];
  }

  // Reservation A*: plan the whole trip through time once, then keep that plan as long as it
  // stays conflict-free. Most ticks cost only a cheap check of the plan against the others'
  // paths; a full search runs when a robot gets a new destination or its plan is broken.
  // Stations go to whoever arrives first (see goalAdmission), and a robot queuing for a busy
  // station falls back to a short windowed plan until it frees up. Committed plans never
  // conflict with each other, so the same safety argument as WHCA holds.
  const RESERVE_SLACK = 64;
  const RESERVE_HOLD = 6;
  function stillValid(world, path, start, goal, others, queued) {
    if (!path || path.length < 2 || path[0] !== start || path[path.length - 1] !== goal) return false;
    for (let t = 1; t < path.length; t++) if (world.isWall(path[t])) return false; // shelf added
    for (const o of others) {
      const end = o.path.length - 1;
      const at = (t) => o.path[t < end ? t : end];
      const until = queued(o) ? Math.min(2, path.length) : path.length;
      for (let t = 1; t < until; t++) {
        if (path[t] !== goal && (path[t] === at(t) || path[t] === at(t - 1))) return false;
      }
    }
    return goalAdmission(goal, others, true)(arrival(path));
  }
  function reservationAstar(req) {
    const { world, start, goal, others, current } = req;
    if (start === goal) return [start];
    const queued = isQueued(others.concat(selfView(req)));
    if (stillValid(world, current, start, goal, others, queued)) return current;
    const res = reservations(world, others, undefined, queued);
    const horizon = res.last + world.manhattan(start, goal) * 2 + RESERVE_SLACK;
    return spaceTimeSearch(world, start, goal, others, res, horizon, { bump: true, doorwayPause: true }) ||
      spaceTimeSearch(world, start, goal, others, res, WHCA_WINDOW,
        { partial: true, bump: true, doorwayPause: true, holdDistance: RESERVE_HOLD }) ||
      [start, start];
  }

  // Windowed Conflict-Based Search (Sharon et al. 2015), used the way lifelong planners such
  // as RHCR (Li et al. 2021) do: every tick, plan all moving robots jointly for the next
  // CBS_WINDOW ticks, ignoring conflicts beyond that. Only the first step is executed, then
  // everything is planned again.
  //
  // High level: a best-first search over constraint sets. Each node holds one path per robot.
  // Take the earliest conflict (two robots in one cell, or two robots swapping cells) and split
  // into two children, each forbidding one of the two robots from that cell/move at that tick,
  // then replan just that robot. The cheapest conflict-free node wins. Because every robot's
  // first step comes from one joint solution, robots may follow each other closely.
  //
  // Low level: space-time A* for one robot under its constraints. A path costs its arrival
  // tick if it reaches the goal inside the window, otherwise CBS_WINDOW plus the remaining
  // distance. Robots dwelling at a station are fixed obstacles.
  //
  // Station access is settled before the search, the way Reservation A* does it: when several
  // robots head for the same free station, the closest one gets it and the rest aim to wait
  // CBS_HOLD steps back. Without this most of the search goes into deciding who parks first.
  //
  // If the search hits CBS_MAX_NODES, fall back to prioritized planning (station winners first),
  // where
  // nobody may step into a cell another robot is standing on. Only the next tick has to be
  // collision-free (everything is replanned after it), and that rule guarantees it.
  const CBS_WINDOW = 10;
  const CBS_MAX_NODES = 300;
  const CBS_HOLD = 3;

  function cbsLowLevel(world, agent, blocked, constraints) {
    const { start, goal, canPark } = agent;
    const cols = world.cols, rows = world.rows, n = cols * rows, W = CBS_WINDOW;
    const hold = canPark ? 0 : CBS_HOLD;
    const dist = distanceMap(world, goal);
    let startH = dist[start];
    if (startH === -1) {
      for (const nb of world.neighbors(start)) {
        if (dist[nb] !== -1 && (startH === -1 || dist[nb] + 1 < startH)) startH = dist[nb] + 1;
      }
      if (startH === -1) return null;
    }
    const h = (c) => {
      const d = c === start && dist[c] === -1 ? startH : dist[c];
      return d === -1 ? -1 : Math.max(d, hold);
    };
    startH = h(start);
    const vertex = new Set(), edge = new Set();
    let goalBusyUntil = canPark ? 0 : Infinity;
    for (const k of constraints) {
      if (k.to === undefined) {
        vertex.add(k.t * n + k.cell);
        if (k.cell === goal) goalBusyUntil = Math.max(goalBusyUntil, k.t);
      } else {
        edge.add((k.t * n + k.from) * n + k.to);
      }
    }

    scratch((W + 1) * n);
    const open = new MinHeap();
    stamp[start] = gen;
    parentOf[start] = -1;
    open.push(start, startH);
    let end = -1, cost = 0;
    while (open.size) {
      const key = open.pop();
      const t = (key / n) | 0, c = key - t * n;
      if (c === goal && t > goalBusyUntil) { end = key; cost = t; break; }
      if (t === W) { end = key; cost = W + h(c); break; }
      const x = c % cols, y = (c / cols) | 0;
      for (let m = 0; m < 5; m++) {
        let nc = c;
        if (m === 1) { if (y === 0) continue; nc = c - cols; }
        else if (m === 2) { if (x === cols - 1) continue; nc = c + 1; }
        else if (m === 3) { if (y === rows - 1) continue; nc = c + cols; }
        else if (m === 4) { if (x === 0) continue; nc = c - 1; }
        if (m > 0) {
          if (world.walls[nc] || blocked[nc]) continue;
          if (nc === goal ? t + 1 <= goalBusyUntil : world.isStation(nc)) continue;
        }
        const nk = (t + 1) * n + nc;
        if (stamp[nk] === gen || h(nc) === -1) continue;
        if (vertex.has(nk) || edge.has(((t + 1) * n + c) * n + nc)) continue;
        stamp[nk] = gen;
        parentOf[nk] = key;
        // Reaching the goal is final, so rank it by arrival time alone.
        open.push(nk, nc === goal && t + 1 > goalBusyUntil ? t + 1 : t + 1 + h(nc));
      }
    }
    if (end === -1) return null;
    const path = [];
    for (let k = end; k !== -1; k = parentOf[k]) path.push(k % n);
    path.reverse();
    while (path.length < W + 1) path.push(path[path.length - 1]); // parked at the goal
    return { path, cost };
  }

  // Earliest conflict between any two paths, plus how many conflicting pairs there are.
  function findConflicts(paths) {
    let first = null, count = 0;
    for (let t = 1; t <= CBS_WINDOW; t++) {
      for (let i = 0; i < paths.length; i++) {
        const a = paths[i];
        for (let j = i + 1; j < paths.length; j++) {
          const b = paths[j];
          let hit = null;
          if (a[t] === b[t]) hit = { t, i, j, cell: a[t] };
          else if (a[t] === b[t - 1] && b[t] === a[t - 1]) hit = { t, i, j, swap: true };
          if (!hit) continue;
          count++;
          if (!first) first = hit;
        }
      }
    }
    return { first, count };
  }

  function cbsSolve(world, agents, blocked) {
    const constraintsFor = (node, i) => {
      const out = [];
      for (let k = node.constraint; k; k = k.parent) if (k.agent === i) out.push(k);
      return out;
    };
    const root = { constraint: null, paths: [], costs: [] };
    for (let i = 0; i < agents.length; i++) {
      const r = cbsLowLevel(world, agents[i], blocked, []);
      if (!r) return null;
      root.paths.push(r.path);
      root.costs.push(r.cost);
    }
    const open = new MinHeap();
    const score = (node) => {
      node.conflicts = findConflicts(node.paths);
      node.cost = node.costs.reduce((s, c) => s + c, 0);
      // Cost first; among equal costs prefer fewer conflicts.
      return node.cost + node.conflicts.count / 1000;
    };
    open.push(root, score(root));
    for (let expanded = 0; open.size && expanded < CBS_MAX_NODES; expanded++) {
      const node = open.pop();
      const c = node.conflicts.first;
      if (!c) return node.paths;
      for (const i of [c.i, c.j]) {
        const p = node.paths[i];
        const k = c.swap
          ? { agent: i, t: c.t, from: p[c.t - 1], to: p[c.t], parent: node.constraint }
          : { agent: i, t: c.t, cell: c.cell, parent: node.constraint };
        const child = { constraint: k, paths: node.paths.slice(), costs: node.costs.slice() };
        const r = cbsLowLevel(world, agents[i], blocked, constraintsFor(child, i));
        if (!r) continue;
        child.paths[i] = r.path;
        child.costs[i] = r.cost;
        open.push(child, score(child));
      }
    }
    return null;
  }

  function prioritizedFallback(world, agents, blocked) {
    const n = world.cols * world.rows;
    const paths = [];
    for (let i = 0; i < agents.length; i++) {
      const cons = [];
      for (const p of paths) {
        for (let t = 1; t <= CBS_WINDOW; t++) {
          cons.push({ t, cell: p[t] });
          cons.push({ t, from: p[t], to: p[t - 1] }); // no swapping with it
        }
      }
      // Stepping onto a robot that hasn't planned yet could trap it, so don't.
      for (let j = i + 1; j < agents.length; j++) cons.push({ t: 1, cell: agents[j].start });
      const r = cbsLowLevel(world, agents[i], blocked, cons);
      paths.push(r ? r.path : new Array(CBS_WINDOW + 1).fill(agents[i].start));
    }
    return paths;
  }

  // One joint solution per world per tick (recomputed if the shelves change); each robot's
  // plan() call picks its own path out.
  const cbsCache = new WeakMap();
  function windowedCbs(req) {
    const { world, start, goal, others, tick } = req;
    let entry = cbsCache.get(world);
    if (!entry || entry.tick !== tick || !sameWalls(entry.walls, world.walls)) {
      const n = world.cols * world.rows;
      const blocked = new Uint8Array(n);
      const agents = [{ id: req.robotId, start, goal }];
      for (const o of others) {
        if (o.moving && o.pos !== o.goal) agents.push({ id: o.id, start: o.pos, goal: o.goal });
        else blocked[o.pos] = 1;
      }
      // Who may park on each free station: the closest robot heading there (ties by id).
      const winner = new Map();
      for (const a of agents) {
        if (blocked[a.goal]) continue;
        const d = distanceMap(world, a.goal)[a.start];
        const best = winner.get(a.goal);
        const key = d === -1 ? Infinity : d;
        if (!best || key < best.key || (key === best.key && a.id < best.a.id)) winner.set(a.goal, { a, key });
      }
      for (const a of agents) a.canPark = winner.has(a.goal) && winner.get(a.goal).a === a;
      // Station winners first (the fallback plans in this order), then by id.
      agents.sort((a, b) => (b.canPark - a.canPark) || a.id - b.id);
      const paths = cbsSolve(world, agents, blocked) || prioritizedFallback(world, agents, blocked);
      entry = { tick, walls: world.walls.slice(), paths: new Map(agents.map((a, i) => [a.id, paths[i]])) };
      cbsCache.set(world, entry);
    }
    const path = entry.paths.get(req.robotId);
    if (!path || path[0] !== start) return [start, start];
    // Trim the parked tail so the path ends on arrival.
    let last = path.length - 1;
    while (last > 0 && path[last - 1] === path[last] && path[last] === goal) last--;
    return path.slice(0, last + 1);
  }

  // PIBT: Priority Inheritance with Backtracking (Okumura et al. 2019/2022). Plans one step
  // at a time for everyone, with no search through time.
  //
  // Each robot has a priority that grows by one every tick it's still on its way and resets
  // when it gets a new task (robot id breaks ties). Every tick, in priority order, a robot
  // that hasn't moved yet picks the neighbouring cell (or its own) closest to its goal that
  // nobody has claimed for the next tick. If another robot is standing there and hasn't moved
  // yet, that robot inherits the priority and must move out of the way first (recursively).
  // If it can't, the first robot backtracks and tries its next-best cell; if nothing works it
  // stays. A pushed robot never steps into its pusher's cell, so there are no swaps, and two
  // robots never claim the same cell, so the step is always collision-free.
  //
  // Robots picking or placing at a station can't be pushed. Stations are only entered by the
  // robot heading there. Stations are dead ends, which plain PIBT handles badly: a robot that
  // just finished at a station has the lowest priority, so robots waiting outside never make
  // room and it can't get out. Robots leaving a station therefore plan first and push their
  // way out.
  const pibtState = new WeakMap(); // world -> { tick, walls, next: Map id -> cell, prio, goalOf }
  function pibtSolve(world, agents, fixed, st) {
    const occNow = new Map(), occNext = new Map();
    for (const c of fixed) { occNow.set(c, null); occNext.set(c, null); }
    for (const a of agents) { occNow.set(a.pos, a); a.next = -1; }

    const step = (a, pusher) => {
      const dist = distanceMap(world, a.goal);
      const score = (c) => {
        if (c === a.goal) return -1;
        return dist[c] === -1 ? Infinity : dist[c];
      };
      const cands = [a.pos];
      for (const nb of world.neighbors(a.pos)) if (nb === a.goal || !world.isStation(nb)) cands.push(nb);
      // Closest to the goal first; among ties prefer a free cell, then a fixed direction order.
      cands.sort((u, v) => score(u) - score(v) || (occNow.has(u) ? 1 : 0) - (occNow.has(v) ? 1 : 0));
      for (const u of cands) {
        if (occNext.has(u)) continue;
        if (pusher && u === pusher.pos) continue;
        occNext.set(u, a);
        a.next = u;
        const k = occNow.get(u);
        if (k && k !== a && k.next === -1 && !step(k, a)) continue;
        return true;
      }
      occNext.set(a.pos, a);
      a.next = a.pos;
      return false;
    };

    const key = (a) => st.prio.get(a.id) + (world.isStation(a.pos) ? 1e6 : 0);
    const order = agents.slice().sort((a, b) => key(b) - key(a) || a.id - b.id);
    for (const a of order) if (a.next === -1) step(a, null);
    return new Map(agents.map((a) => [a.id, a.next]));
  }

  function pibt(req) {
    const { world, start, goal, others, tick } = req;
    let st = pibtState.get(world);
    if (!st) pibtState.set(world, (st = { tick: -1, walls: null, next: null, prio: new Map(), goalOf: new Map() }));
    if (st.tick !== tick || !sameWalls(st.walls, world.walls)) {
      const agents = [{ id: req.robotId, pos: start, goal }];
      const fixed = [];
      for (const o of others) {
        if (o.moving && o.pos !== o.goal) agents.push({ id: o.id, pos: o.pos, goal: o.goal });
        else fixed.push(o.pos);
      }
      // Update priorities once per tick (not again if the shelves change mid-tick).
      if (st.tick !== tick) {
        for (const a of agents) {
          const fresh = st.goalOf.get(a.id) !== a.goal;
          st.prio.set(a.id, fresh ? 0 : st.prio.get(a.id) + 1);
          st.goalOf.set(a.id, a.goal);
        }
      }
      st.tick = tick;
      st.walls = world.walls.slice();
      st.next = pibtSolve(world, agents, fixed, st);
    }
    const next = st.next.get(req.robotId);
    if (next === undefined) return [start, start];
    // Only the first step is decided; the rest is where PIBT is heading (downhill on the
    // distance map, ignoring other robots). It's redone every tick and is there so the route
    // can be drawn.
    return [start].concat(downhill(world, next, goal));
  }

  // Shortest route from `from` to `goal` by following the distance map. Starts with `from`.
  function downhill(world, from, goal) {
    const dist = distanceMap(world, goal);
    const route = [from];
    for (let cur = from, guard = world.cols * world.rows; cur !== goal && guard > 0; guard--) {
      const here = dist[cur] === -1 ? Infinity : dist[cur];
      let best = -1;
      for (const nb of world.neighbors(cur)) {
        if (nb !== goal && (world.isStation(nb) || dist[nb] === -1)) continue;
        if (dist[nb] < here && (best === -1 || dist[nb] < dist[best])) best = nb;
      }
      if (best === -1) break;
      route.push(best);
      cur = best;
    }
    return route;
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
      priority: queuedLast,
      plan: whca,
    },
    {
      id: "reserve",
      name: "Reservation A* (plan once)",
      description: "Plans each trip's full route through time once and reserves it; others route around it. Replans only when the route is blocked, so it needs far less computing.",
      replanEachTick: true,
      priority: queuedLast,
      plan: reservationAstar,
    },
    {
      id: "cbs",
      name: "Windowed CBS (joint planning)",
      description: "Every tick, Conflict-Based Search plans all moving robots together 10 ticks ahead, so robots can follow closely and step aside for each other.",
      replanEachTick: true,
      plan: windowedCbs,
    },
    {
      id: "pibt",
      name: "PIBT (priority inheritance)",
      description: "Every tick, robots pick their next step in priority order; a robot in the way inherits the priority and must move aside. One step ahead only, so it's very fast.",
      replanEachTick: true,
      plan: pibt,
    },
  ];

  const api = { PLANNERS, astar, whca, reservationAstar, windowedCbs, pibt, MinHeap };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RobotPlanners = api;
})(typeof self !== "undefined" ? self : this);
