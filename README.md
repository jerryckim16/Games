# Games
I make games here through vibecoding on Claude

## Games
- [Lotto 6/45 Simulator](lotto645/) — play Korea's Lotto 6/45 every week until you win the jackpot. Choose how many tickets to buy per draw and watch your net profit, money spent, and years pass on a live chart. Open `lotto645/index.html` in a browser (no build step).
- [Warehouse Robot Simulator](robotsim/) — 1–20 robots shuttle items from 1–100 pickup stations to 1–100 drop-off spots on a grid warehouse that grows to fit while the sim counts collisions (same-cell and head-on swaps). Ships with collision-blind shortest path (A*) and four collision-avoiding planners: Cooperative A* (replans every tick), Reservation A* (plans each trip once, first-come station claims) Windowed CBS (Conflict-Based Search plans all robots jointly a few ticks ahead) and PIBT (one-step priority inheritance; very fast and strongest when many robots share few stations). Pathfinding algorithms are pluggable: add one to `robotsim/planners.js` and it appears in the dropdown, then use the Benchmark panel to compare algorithms on the same seed. Open `robotsim/index.html` in a browser (no build step).
