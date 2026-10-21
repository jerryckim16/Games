# Games
I make games here through vibecoding on Claude

## Games
- [Lotto 6/45 Simulator](lotto645/) — play Korea's Lotto 6/45 every week until you win the jackpot. Choose how many tickets to buy per draw and watch your net profit, money spent, and years pass on a live chart. Open `lotto645/index.html` in a browser (no build step).
- [Warehouse Robot Simulator](robotsim/) — 5 robots shuttle items from 5 pickup stations to 5 drop-off spots on a grid warehouse while the sim counts collisions (same-cell and head-on swaps). Ships with collision-blind shortest path (A*) and two collision-avoiding planners: Cooperative A* (replans every tick) and Reservation A* (plans each trip once, first-come station claims). Pathfinding algorithms are pluggable: add one to `robotsim/planners.js` and it appears in the dropdown, then use the Benchmark panel to compare algorithms on the same seed. Open `robotsim/index.html` in a browser (no build step).
