// Lotto 6/45 simulation engine. No DOM access, so it can run in the browser or in Node.
(function (root) {
  "use strict";

  const TICKET_PRICE = 1000;
  // Index = prize tier (1..5). Tier 1 is replaced by the configurable jackpot.
  const DEFAULT_PRIZES = [0, 2000000000, 55000000, 1500000, 50000, 5000];

  class LottoSim {
    constructor(opts) {
      this.pool = new Uint8Array(45);
      for (let i = 0; i < 45; i++) this.pool[i] = i + 1;
      this.mark = new Uint8Array(46); // 1 = winning number, 2 = bonus number
      this.lastDraw = [];
      this.lastBonus = 0;
      this.reset(opts);
    }

    reset(opts) {
      opts = opts || {};
      this.tickets = Math.max(1, Math.floor(opts.tickets || 1));
      this.myNumbers = opts.myNumbers || null; // array of 6 numbers or null
      this.prizes = DEFAULT_PRIZES.slice();
      if (opts.jackpot) this.prizes[1] = opts.jackpot;
      this.draws = 0;
      this.ticketsBought = 0;
      this.spent = 0;
      this.won = 0;
      this.tierCounts = [0, 0, 0, 0, 0, 0];
      this.biggestTier = 0;
    }

    get net() {
      return this.won - this.spent;
    }

    // Fills pool[0..5] with 6 distinct random numbers (partial Fisher-Yates).
    pick6() {
      const p = this.pool;
      for (let i = 0; i < 6; i++) {
        const j = i + Math.floor(Math.random() * (45 - i));
        const t = p[i];
        p[i] = p[j];
        p[j] = t;
      }
    }

    // Returns prize tier (1..5) or 0 for no prize.
    tierFor(matches, bonus) {
      if (matches === 6) return 1;
      if (matches === 5) return bonus ? 2 : 3;
      if (matches === 4) return 4;
      if (matches === 3) return 5;
      return 0;
    }

    // Runs one weekly draw. Returns an array of {tier, prize} for tiers 1..3 (notable wins), possibly empty.
    draw() {
      const mark = this.mark;
      mark.fill(0);
      this.pick6();
      const p = this.pool;
      for (let i = 0; i < 6; i++) mark[p[i]] = 1;
      // Bonus ball: 7th distinct number.
      const j = 6 + Math.floor(Math.random() * 39);
      const t = p[6];
      p[6] = p[j];
      p[j] = t;
      mark[p[6]] = 2;
      this.lastDraw = Array.from(p.subarray(0, 6)).sort((a, b) => a - b);
      this.lastBonus = p[6];

      const counts = this.tierCounts;
      const prizes = this.prizes;
      let notable = null;
      let won = 0;

      for (let k = 0; k < this.tickets; k++) {
        let nums;
        if (k === 0 && this.myNumbers) {
          nums = this.myNumbers;
        } else {
          this.pick6();
          nums = p;
        }
        let matches = 0;
        let bonus = false;
        for (let i = 0; i < 6; i++) {
          const m = mark[nums[i]];
          if (m === 1) matches++;
          else if (m === 2) bonus = true;
        }
        if (matches < 3) continue;
        const tier = this.tierFor(matches, bonus);
        counts[tier]++;
        won += prizes[tier];
        if (tier <= 3) {
          (notable || (notable = [])).push({ tier, prize: prizes[tier] });
          if (!this.biggestTier || tier < this.biggestTier) this.biggestTier = tier;
        }
      }

      this.draws++;
      this.ticketsBought += this.tickets;
      this.spent += this.tickets * TICKET_PRICE;
      this.won += won;
      return notable;
    }
  }

  const api = { LottoSim, TICKET_PRICE, DEFAULT_PRIZES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Lotto = api;
})(typeof self !== "undefined" ? self : this);
