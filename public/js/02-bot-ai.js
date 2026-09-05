/* ============================================================================
 FILE: public/js/02-bot-ai.js
 ROLE: BOT AI — BotAI singleton: 1st/2nd-order Markov + frequency + sequence + repetition + anti-pattern + context predictors; bowl()/bat() decision making; difficulty 0..1; level(). Depends on: 01 (config), G (03) at call-time.
============================================================================ */

const BotAI = {
  history: [],
  transitions: {},
  ballCount: 0,
  playerPatterns: {},
  recentChoices: [],
  consecutiveSame: 0,
  lastPlayerPick: null,
  streakType: null,
  streakLen: 0,
  defensiveMode: false,
  wicketsDown: 0,
  requiredRate: 0,
  matchPhase: "start",

  difficulty: 0,
  reset(d) {
    this.history = [];
    this.transitions = {};
    this.ballCount = 0;
    this.difficulty = d || 0;
    this.playerPatterns = {};
    this.recentChoices = [];
    this.consecutiveSame = 0;
    this.lastPlayerPick = null;
    this.streakType = null;
    this.streakLen = 0;
    this.defensiveMode = false;
    this.wicketsDown = 0;
    this.requiredRate = 0;
    this.matchPhase = "start";
  },

  record(p) {
    if (this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      if (!this.transitions[prev]) this.transitions[prev] = {};
      this.transitions[prev][p] = (this.transitions[prev][p] || 0) + 1;
    }
    this.history.push(p);
    this.ballCount++;
    if (this.history.length > 30) this.history = this.history.slice(-30);
    if (!this.playerPatterns[p]) this.playerPatterns[p] = 0;
    this.playerPatterns[p]++;

    if (p === this.lastPlayerPick) {
      this.consecutiveSame++;
      if (this.consecutiveSame >= 3) this.streakType = "repeat";
      else this.streakType = null;
    } else {
      this.consecutiveSame = 0;
      this.streakType = null;
    }
    this.lastPlayerPick = p;
    this.recentChoices.push(p);
    if (this.recentChoices.length > 10) this.recentChoices.shift();
    this.matchPhase =
      this.ballCount <= 6 ? "start" : this.ballCount <= 15 ? "middle" : "end";
  },

  updateContext(target, currentScore, currentWkts, totalBalls) {
    if (target !== null) {
      const rem = Math.max(1, totalBalls - this.ballCount);
      this.requiredRate = ((target - currentScore) / (rem / 6)).toFixed(1);
      this.defensiveMode = currentScore >= target;
    }
    this.wicketsDown = currentWkts;
  },

  predict() {
    if (this.history.length < 2) return null;
    const scores = {};
    const add = (val, c) => {
      if (val >= 1 && val <= 6) scores[val] = (scores[val] || 0) + c;
    };

    const mk = this.markov();
    if (mk) add(mk, 4);
    const mk2 = this.markov2();
    if (mk2) add(mk2, 3);
    const fr = this.freq();
    if (fr) add(fr, 2);
    const sq = this.seq();
    if (sq) add(sq, 3);
    const rp = this.rep();
    if (rp) add(rp, 2);
    const anti = this.antiPattern();
    if (anti) add(anti, 5);
    const ctx = this.contextPredict();
    if (ctx) add(ctx, 3);

    let best = null,
      bs = 0;
    for (const [k, s] of Object.entries(scores)) {
      if (s > bs) {
        bs = s;
        best = parseInt(k);
      }
    }
    return best;
  },

  markov() {
    const l = this.history[this.history.length - 1];
    const t = this.transitions[l];
    if (!t) return null;
    let b = null,
      bc = 0;
    for (const [k, c] of Object.entries(t)) {
      if (c > bc) {
        bc = c;
        b = parseInt(k);
      }
    }
    return b;
  },

  markov2() {
    if (this.history.length < 3) return null;
    const k = this.history.slice(-2).join(",");
    const matches = {};
    this.history.forEach((p, i) => {
      if (
        i >= 2 &&
        this.history[i - 2] === parseInt(k.split(",")[0]) &&
        this.history[i - 1] === parseInt(k.split(",")[1])
      ) {
        matches[this.history[i]] = (matches[this.history[i]] || 0) + 1;
      }
    });
    let b = null,
      bc = 0;
    for (const [k, c] of Object.entries(matches)) {
      if (c > bc) {
        bc = c;
        b = parseInt(k);
      }
    }
    return b;
  },

  freq() {
    const r = this.history.slice(-10);
    const f = {};
    r.forEach((p, i) => {
      f[p] = (f[p] || 0) + (10 - i);
    });
    let b = null,
      bs = 0;
    for (const [k, s] of Object.entries(f)) {
      if (s > bs) {
        bs = s;
        b = parseInt(k);
      }
    }
    return b;
  },

  seq() {
    const L = this.history.length;
    if (L < 3) return null;
    const a = this.history.slice(-3);
    if (a[0] === a[1] - 1 && a[1] === a[2] - 1) {
      const n = a[2] + 1;
      if (n <= 6) return n;
    }
    if (a[0] === a[1] + 1 && a[1] === a[2] + 1) {
      const n = a[2] - 1;
      if (n >= 1) return n;
    }
    if (L >= 4) {
      const b = this.history.slice(-4);
      if (b[0] === b[2] && b[1] === b[3]) return b[0];
    }
    return null;
  },

  rep() {
    if (this.history.length < 2) return null;
    const l = this.history[this.history.length - 1];
    const c = this.history.filter((p) => p === l).length;
    return c >= 3 ? l : null;
  },

  antiPattern() {
    if (this.recentChoices.length < 3) return null;
    const last3 = this.recentChoices.slice(-3);
    const allSame = last3.every((v) => v === last3[0]);
    if (allSame) {
      const avoid = last3[0];
      const opts = [1, 2, 3, 4, 5, 6].filter((n) => n !== avoid);
      return opts[Math.floor(Math.random() * opts.length)];
    }
    const freq = {};
    this.recentChoices.forEach((p) => {
      freq[p] = (freq[p] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq >= 4) {
      const most = Object.entries(freq).find(([, c]) => c === maxFreq);
      const avoid = parseInt(most[0]);
      const opts = [1, 2, 3, 4, 5, 6].filter((n) => n !== avoid);
      return opts[Math.floor(Math.random() * opts.length)];
    }
    return null;
  },

  contextPredict() {
    if (this.matchPhase === "start") return null;
    if (this.history.length < 4) return null;
    const playerFavs = {};
    this.history.slice(-8).forEach((p) => {
      playerFavs[p] = (playerFavs[p] || 0) + 1;
    });
    const topPick = Object.entries(playerFavs).sort((a, b) => b[1] - a[1])[0];
    if (!topPick) return null;
    const fav = parseInt(topPick[0]);
    if (this.defensiveMode)
      return fav <= 3 ? fav : Math.ceil(Math.random() * 3);
    if (this.wicketsDown >= Math.floor(G.totalWkts * 0.7)) {
      const survival = [1, 2, 3];
      return survival[Math.floor(Math.random() * 3)];
    }
    return fav;
  },

  bowl() {
    const diff = this.difficulty || 0;
    if (this.ballCount < 3) return this.rand();
    if (this.maybeMistake(diff)) return this.rand();
    const d = Math.min(this.ballCount / 8, 1);
    const pr = this.predict();
    const anti = this.antiPattern();

    if (anti && Math.random() < 0.55 + d * 0.35 + diff * 0.2) {
      return anti;
    }
    if (pr && Math.random() < 0.45 + d * 0.4 + diff * 0.15) {
      const opts = [1, 2, 3, 4, 5, 6];
      const safe = opts.filter((n) => n !== pr);
      if (Math.random() < 0.6 + diff * 0.15) return pr;
      return safe[Math.floor(Math.random() * safe.length)];
    }
    return this.contextBowl();
  },

  contextBowl() {
    if (this.matchPhase === "end" && Math.random() < 0.6) {
      return Math.ceil(Math.random() * 3);
    }
    if (this.matchPhase === "start" && Math.random() < 0.5) {
      return Math.ceil(Math.random() * 6);
    }
    const weights = [1, 1.2, 1.5, 2, 2.5, 3];
    const r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    for (let i = 0; i < 6; i++) {
      acc += weights[i];
      if (r <= acc) return i + 1;
    }
    return 6;
  },

  bat() {
    const diff = this.difficulty || 0;
    if (this.ballCount < 3) return this.rand();
    if (this.maybeMistake(diff)) return this.rand();
    const d = Math.min(this.ballCount / 8, 1);
    const pr = this.predict();
    let opts = [1, 2, 3, 4, 5, 6];

    if (pr && Math.random() < 0.5 + d * 0.35 + diff * 0.2) {
      opts = opts.filter((n) => n !== pr);
    }

    if (this.defensiveMode) {
      const w = opts.map((n) => {
        let x = 1;
        if (n >= 5) x += 4;
        else if (n >= 3) x += 2;
        return x;
      });
      return this.wp(opts, w);
    }

    if (this.matchPhase === "end") {
      const target = G.target;
      if (target !== null) {
        const needed = target - G.me.score;
        if (needed <= 12 && this.ballCount < G.totalBalls) {
          const w = opts.map((n) => {
            let x = n >= 4 ? 4 : 1;
            if (n >= 5) x += 3;
            return x;
          });
          return this.wp(opts, w);
        }
      }
    }

    if (this.matchPhase === "start") {
      const w = opts.map((n) => {
        let x = n >= 4 ? 2.5 : 1;
        if (n === 6) x += 1.5;
        return x;
      });
      return this.wp(opts, w);
    }

    const w = opts.map((n) => {
      let x = n;
      if (d > 0.4 && n >= 5) x += 2;
      return x;
    });
    return this.wp(opts, w);
  },

  /* SKILL TIERS — the bot climbs as YOUR career grows, so results track
     skill, not luck. diff scales how often the bot trusts its read; the
     role clamp in botPickWithRole() applies AFTER, so tiers never cheat
     the gesture rules — a Master still can't pick outside its role. */
  skillFor(stats) {
    const m = (stats && stats.matches) || 0;
    const w = (stats && stats.wins) || 0;
    const score = m + w * 2;
    if (score >= 60) return { key: "master", label: "Master", diff: 0.85 };
    if (score >= 32) return { key: "veteran", label: "Veteran", diff: 0.7 };
    if (score >= 14) return { key: "pro", label: "Pro", diff: 0.55 };
    if (score >= 4) return { key: "club", label: "Club", diff: 0.35 };
    return { key: "learner", label: "Learner", diff: 0.15 };
  },
  /* Learner mistake gate: low tiers often guess blind even with a read.
     At diff .15 most balls are honest guesses; at .85 almost never. */
  maybeMistake(diff) {
    const d = typeof diff === "number" ? diff : 0;
    return Math.random() > 0.3 + d * 0.65;
  },
  rand() {
    return Math.floor(Math.random() * 6) + 1;
  },
  wp(o, w) {
    const t = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * t;
    for (let i = 0; i < o.length; i++) {
      r -= w[i];
      if (r <= 0) return o[i];
    }
    return o[o.length - 1];
  },
  level() {
    if (this.ballCount < 4) return "Easy";
    if (this.ballCount < 10) return "Medium";
    if (this.matchPhase === "end") return "Expert";
    return "Hard";
  },
};

