# Games repo

Small browser games and simulators, each in its own folder. Each one is plain HTML + CSS + JS: no build step, no dependencies, and it opens straight from `index.html`. The root `README.md` lists every game with a one-paragraph description.

## Rules for every change

- **Keep docs current, in the same commit as the change.**
  - When you add or change a feature in a game, update that game's `README.md`: the features list, any settings or defaults, the algorithm descriptions, the benchmark tables if results moved, and a new **Changelog** entry at the top.
  - Also update the game's line in the root `README.md` if its summary changed.
  - A feature commit without its README update is incomplete.
- Match the existing code style: an IIFE per file, `"use strict"`, comments that explain *why*, and no frameworks.
- Theming: every color is a CSS token on `:root`, redefined for dark mode under both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`. The canvas reads the tokens through `readColors()`.
- Layouts must work at phone width (about 390px) with no horizontal page scroll; wide tables scroll inside their panel.
- Before pushing, check the page in headless Chromium for console errors at desktop and phone widths. Playwright is preinstalled; run it with `NODE_PATH=$(npm root -g)`.

## robotsim (Warehouse Robot Simulator)

A multi-robot pathfinding test bench. See `robotsim/README.md` for features, algorithms and results.

### Architecture

- `engine.js`: no DOM, so it runs in Node.
  - `World` generates the layout from `{ robots, pickups, drops, chargers }`: stations sit on the outer walls, shelves fill the middle, and the floor grows to fit. It also provides `distancesTo` / `travel`.
  - `RobotSim` handles the task cycle (pickup → drop-off), batteries and charging, movement, and collision detection (vertex and swap).
- `planners.js`: every algorithm, in the `PLANNERS` array. The contract is in the comment at the top of the file. Shared pieces:
  - `distanceMap`, `reservations` and `spaceTimeSearch` (WHCA* and Reservation A*);
  - `cbsLowLevel` / `cbsSolve` (CBS);
  - `pibtSolve` (PIBT).
- `app.js`: UI only.
- `bench.js`: the headless benchmark.

### Invariants

Don't break these:

- The engine never steers robots. It only validates paths and counts collisions. A path may touch a station only at its start or end, and invalid paths become "stand still" and count as `planErrors`.
- The collision-free planners must keep zero collisions. The guarantee rests on two things: the next tick is reserved strictly (nobody steps into a cell occupied this tick unless it's a joint CBS / PIBT step), and staying put is always safe.
- Doorway cells (floor next to a station) are pass-through only for waiting robots. This prevents gridlock at dead-end stations.
- With batteries off (0 chargers), results must match the earlier numbers exactly. Batteries use a separate RNG stream, so task sequences don't change.
- Same seed + same layout + same planner = same result. Keep tie-breaking deterministic.

### Testing a change

1. Run `node robotsim/bench.js`, and `--layout r,p,d,c` for battery layouts. Check for 0 collisions on every collision-free planner, `planErr` 0, no gridlock (longest stall well under 300), and no robots running out when there are enough chargers.
2. Stress test: toggle random shelves mid-run (`sim.world.toggleWall(c); sim.replan()`). It must still show zero collisions.
3. Load `robotsim/index.html` in headless Chromium at 1200px and 390px, in light and dark mode, and check for no errors and no horizontal scroll.
4. If results changed, regenerate the README tables from `bench.js` output.

### Published artifact

The simulator is also published as a single-file claude.ai artifact: https://claude.ai/artifact/Hf2uSuaBLVv2eXKMMZx1dZ

To update it after a change, bundle the files into one HTML file:
- a `<title>` and `<meta name="claude:viewport-fit-sides" content="cover">`;
- `styles.css` inline;
- the body of `index.html` from `<header>` through `</main>`;
- `engine.js`, `planners.js` and `app.js` inline, in that order.

Then republish to the same URL.

## suneung (Suneung Simulator)

A life-sim from elementary school to the Korean 수능 and retakes. See `suneung/README.md` for features, the exam model and balance numbers.

- `engine.js`: no DOM, so it runs in Node, and no display text. `Game` keeps a queue of screens (events, mocks, the exam, applications, offers); the app shows `queue[0]` and answers it with `choose` / `dismiss` / `apply` / `decide`.
- All text lives in `strings.js`, as complete `en` and `ko` dictionaries with identical keys; the engine emits `{ key, p }` messages. Never mix languages: English strings contain no Hangul, Korean strings use Korean terms. Add every new string to both dictionaries.
- Turns are a year (elementary), a semester (middle school), a season (grades 10–11), then a month from grade 12 (`STATUSES[*].months`). Ages are international (만 나이, from 6 in grade 1; Korean shows "만 N세" via `h.age`). Ability is on the 수능 scale from age 6 (`START_GAP` below the exam level) and never decays; `SCHOOL_GAIN` scales study during grades 1–11. Families are dealt from `FAMILY_IDS` at birth and never chosen by the player (only `sim.js` may force one).
- The seeded RNG state lives in the game object, so saves (localStorage JSON) resume exactly. Exam papers and the cohort depend only on the seed and the sitting, never on the player's choices.
- Events: `weight` can be a number or a function of the game (always read it through `weightOf`); 100+ means a forced milestone or follow-up. Never delete an event id that has shipped: retire it with `weight: 0, when: () => false` and keep its strings, so a save with it queued or in its log still plays. New state on the game must default safely when missing (e.g. `g.bully` absent means not bullied).
- After changing the exam or learning model, run `node suneung/sim.js --seeds 80`: calibration must stay inside the printed real-world targets, and the README tables must be regenerated from its output.
- Published artifact: https://claude.ai/artifact/H8zzP1PqsHVdvEQEARTuFE . To update it, bundle the same way as robotsim (a `<title>` and the `claude:viewport-fit-sides` meta, `styles.css` inline, `index.html` from `<header>` through `</main>` plus the `#modal` div, then `engine.js`, `strings.js` and `app.js` inline) and republish to the same URL. Don't use `alert()` / `confirm()`: the artifact viewer blocks them.
