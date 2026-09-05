/* ---------------------------------------------------------------------------
   23-features.js — retention + sharing.

   Three things, all additive and all reading data the game already records:

     1. daily streak      — a "played today" flag, so returning players see a
                            streak without any new match data
     2. head-to-head      — "you lead Rohit 7-3", stored per pair in
                            localStorage (hcp_h2h:<me>:<them>)
     3. share scorecard   — the result screen rendered to a canvas image and
                            handed to the Web Share API

   Nothing here changes match outcomes. If a function is missing (older cached
   bundle) the callers all feature-detect first.
   ------------------------------------------------------------------------ */
(function () {
  "use strict";

  /* ---- 1. Daily streak ------------------------------------------------ */
  const DAY = 86400000;

  function todayKey(d) {
    const t = d || new Date();
    return (
      t.getFullYear() + "-" +
      String(t.getMonth() + 1).padStart(2, "0") + "-" +
      String(t.getDate()).padStart(2, "0")
    );
  }

  function dayIndex(key) {
    // Days since epoch, in LOCAL time — matches how the key was produced.
    const p = String(key).split("-").map(Number);
    return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / DAY);
  }

  function loadActivity() {
    try {
      return JSON.parse(localStorage.getItem("hcp_activity") || "null") || {};
    } catch (e) {
      return {};
    }
  }

  function saveActivity(a) {
    try {
      localStorage.setItem("hcp_activity", JSON.stringify(a));
    } catch (e) {}
  }

  /* Call once per finished match. Returns the streak length after the update. */
  function recordPlayedDay() {
    const a = loadActivity();
    const today = todayKey();
    if (a.last === today) {
      // Already counted today — don't double-increment.
      return a.streak || 1;
    }
    const prev = a.last ? dayIndex(a.last) : null;
    const cur = dayIndex(today);
    a.streak = prev === cur - 1 ? (a.streak || 0) + 1 : 1;
    a.best = Math.max(a.best || 1, a.streak);
    a.last = today;
    a.last7 = (a.last7 || []).filter((k) => dayIndex(k) > cur - 7);
    if (a.last7.indexOf(today) === -1) a.last7.push(today);
    saveActivity(a);
    return a.streak;
  }

  function getActivity() {
    const a = loadActivity();
    const today = todayKey();
    // A streak from two days ago is over, even if the flag still says 5.
    const alive = a.last && dayIndex(a.last) >= dayIndex(today) - 1;
    return {
      streak: alive ? a.streak || 0 : 0,
      best: a.best || 0,
      last: a.last || null,
      playedToday: a.last === today,
      last7: a.last7 || [],
    };
  }

  /* The 7-day dot strip + headline, injected into the profile card. */
  function streakCardHtml() {
    const g = getActivity();
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const on = (g.last7 || []).indexOf(todayKey(d)) !== -1;
      dots.push('<span class="sk-dot' + (on ? " on" : "") + '"></span>');
    }
    const title = g.playedToday
      ? g.streak + "-day streak"
      : g.streak > 0
        ? "Streak alive — play today"
        : "Start a streak";
    const sub = g.playedToday
      ? "Played today. Best: " + g.best + " days."
      : "Play a match today to keep it going. Best: " + g.best + " days.";
    return (
      '<div class="streak-card"><div class="sk-flame">' +
      (g.streak > 0 ? "&#128293;" : "&#9898;") +
      '</div><div class="sk-body"><div class="sk-title">' +
      title +
      '</div><div class="sk-sub">' +
      sub +
      '</div></div><div class="sk-dots">' +
      dots.join("") +
      "</div></div>"
    );
  }

  /* ---- 2. Head-to-head ------------------------------------------------ */
  function h2hKey(me, them) {
    return "hcp_h2h:" + String(me).toLowerCase().trim() + ":" + String(them).toLowerCase().trim();
  }

  function h2hLoad(me, them) {
    try {
      return JSON.parse(localStorage.getItem(h2hKey(me, them)) || "null") || { w: 0, l: 0, d: 0 };
    } catch (e) {
      return { w: 0, l: 0, d: 0 };
    }
  }

  function h2hRecord(me, them, result) {
    if (!me || !them) return null;
    if (String(me).toLowerCase() === String(them).toLowerCase()) return null;
    const r = h2hLoad(me, them);
    if (result.won) r.w++;
    else if (result.lost) r.l++;
    else r.d++;
    try {
      localStorage.setItem(h2hKey(me, them), JSON.stringify(r));
    } catch (e) {}
    return r;
  }

  function h2hHtml(me, them) {
    if (!me || !them) return "";
    if (String(me).toLowerCase() === String(them).toLowerCase()) return "";
    const r = h2hLoad(me, them);
    if (!r.w && !r.l && !r.d) return "";
    const cls = r.w > r.l ? "win" : r.l > r.w ? "loss" : "draw";
    const word = r.w > r.l ? "You lead" : r.l > r.w ? "They lead" : "Level with";
    return (
      '<div class="h2h-strip"><div><div class="h2h-num ' + cls + '">' +
      r.w + "&ndash;" + r.l + (r.d ? " (" + r.d + " tied)" : "") +
      '</div><div class="h2h-label">head to head</div></div>' +
      '<div class="h2h-label" style="text-align:center">' + word + " " +
      String(them).replace(/[<>&]/g, "") +
      "</div></div>"
    );
  }

  /* ---- 3. Share scorecard --------------------------------------------- */
  function drawScorecard(canvas, data) {
    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext("2d");
    if (!c) return null;

    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b1a2e");
    bg.addColorStop(1, "#060d1a");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // accent bar
    c.fillStyle = "#fbbf24";
    c.fillRect(0, 0, W, 14);

    c.textAlign = "center";
    c.fillStyle = "#fbbf24";
    c.font = "700 40px Rubik, system-ui, sans-serif";
    c.fillText("HAND CRICKET PRO", W / 2, 100);

    c.fillStyle = data.won ? "#2dd4bf" : data.lost ? "#fb7185" : "#f8fafc";
    c.font = "700 92px Rubik, system-ui, sans-serif";
    c.fillText(data.headline, W / 2, 230);

    c.fillStyle = "rgba(248,250,252,.65)";
    c.font = "500 40px Rubik, system-ui, sans-serif";
    c.fillText(data.subline, W / 2, 305);

    // stat tiles
    const tiles = [
      [String(data.myRuns), "RUNS"],
      [String(data.myBalls), "BALLS"],
      [String(data.sixes + data.fours), "BOUNDARIES"],
      [String(data.wkts), "WICKETS"],
    ];
    const tw = 220;
    const gap = 28;
    const startX = (W - (tiles.length * tw + (tiles.length - 1) * gap)) / 2;
    tiles.forEach(function (t, i) {
      const x = startX + i * (tw + gap);
      const y = 380;
      c.fillStyle = "rgba(255,255,255,.06)";
      c.beginPath();
      c.roundRect(x, y, tw, 190, 22);
      c.fill();
      c.fillStyle = "#f8fafc";
      c.font = "700 74px Rubik, system-ui, sans-serif";
      c.fillText(t[0], x + tw / 2, y + 100);
      c.fillStyle = "rgba(248,250,252,.55)";
      c.font = "600 26px Rubik, system-ui, sans-serif";
      c.fillText(t[1], x + tw / 2, y + 150);
    });

    // ball-by-ball strip
    const hist = data.hist || [];
    if (hist.length) {
      const shown = hist.slice(-18);
      const bw = 46;
      const bgap = 10;
      const sx = (W - (shown.length * bw + (shown.length - 1) * bgap)) / 2;
      shown.forEach(function (h, i) {
        const x = sx + i * (bw + bgap);
        const y = 640;
        let col = "rgba(255,255,255,.10)";
        let txt = "";
        if (h === "W") { col = "#fb7185"; txt = "W"; }
        else if (h === "SIX") { col = "#fbbf24"; txt = "6"; }
        else if (h === "FOUR") { col = "#2dd4bf"; txt = "4"; }
        else if (h === "DOT") { col = "rgba(255,255,255,.16)"; txt = "\u00B7"; }
        else if (/^\d+$/.test(String(h))) { txt = String(h); col = "rgba(125,211,252,.35)"; }
        c.fillStyle = col;
        c.beginPath();
        c.roundRect(x, y, bw, bw, 12);
        c.fill();
        c.fillStyle = "#0b1a2e";
        c.font = "700 24px Rubik, system-ui, sans-serif";
        c.fillText(txt, x + bw / 2, y + 32);
      });
    }

    // opponent line
    c.fillStyle = "rgba(248,250,252,.8)";
    c.font = "600 38px Rubik, system-ui, sans-serif";
    c.fillText(data.oppLine, W / 2, 790);

    // footer
    c.fillStyle = "rgba(248,250,252,.4)";
    c.font = "500 28px Rubik, system-ui, sans-serif";
    c.fillText("Hand Cricket Pro \u2014 play a friend online", W / 2, H - 90);
    c.fillStyle = "rgba(251,191,36,.75)";
    c.font = "600 30px Rubik, system-ui, sans-serif";
    c.fillText(data.player, W / 2, H - 140);

    return canvas;
  }

  /* Build the image and hand it to the OS share sheet. Falls back to copying
     a text summary, so it still does something on desktop Firefox. */
  function shareScorecard(result) {
    const r = result || (typeof G !== "undefined" ? G.recentResult : null);
    if (!r) {
      if (typeof toast === "function") toast("No match to share yet", "warn");
      return;
    }
    const me = (typeof getUsername === "function" && getUsername()) || "You";
    const opp = r.oppName || (typeof G !== "undefined" && G.oppName) || "Opponent";

    const data = {
      headline: r.won ? "WON!" : r.lost ? "LOST" : "TIED",
      subline: "vs " + opp,
      myRuns: r.myRuns || 0,
      myBalls: r.myBalls || 0,
      sixes: r.mySixes || 0,
      fours: r.myFours || 0,
      wkts: r.oppWickets || 0,
      hist: r.myHist || [],
      oppLine: opp + "  " + (r.oppRuns || 0) + "/" + (r.myWickets || 0),
      player: me,
      won: r.won,
      lost: r.lost,
    };

    const text =
      "Hand Cricket Pro: I " + data.headline.toLowerCase() + " against " + opp +
      " (" + data.myRuns + " off " + data.myBalls + ", " + data.wkts + " wkts).";

    try {
      const canvas = document.createElement("canvas");
      if (!canvas.getContext || !drawScorecard(canvas, data)) throw new Error("no canvas");

      canvas.toBlob(function (blob) {
        if (!blob) return shareText(text);
        const file = new File([blob], "handcricket-scorecard.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator
            .share({ files: [file], title: "Hand Cricket Pro", text: text })
            .catch(function () { shareText(text); });
        } else {
          // No image sharing here — download it instead of failing silently.
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "handcricket-scorecard.png";
          a.click();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          if (typeof toast === "function") toast("Scorecard saved", "good");
        }
      }, "image/png");
    } catch (e) {
      shareText(text);
    }
  }

  function shareText(text) {
    if (navigator.share) {
      navigator.share({ title: "Hand Cricket Pro", text: text }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { if (typeof toast === "function") toast("Score copied to clipboard", "good"); },
        function () { if (typeof toast === "function") toast(text, ""); },
      );
    } else if (typeof toast === "function") {
      toast(text, "");
    }
  }

  /* ---- 4. Role presets ------------------------------------------------- *
   * "Auto-pick my XI" — fills batting/bowling styles while respecting
   * getRoleLimits() for the format, so a 5v5 player isn't tapping six times. */
  function autoPickRoles(players, teamSize) {
    if (!players || !players.length) return players;
    const lim = typeof getRoleLimits === "function" ? getRoleLimits(teamSize || players.length) : null;
    const maxAgg = lim ? lim.maxAgg : players.length;
    const maxDef = lim ? lim.maxDef : players.length;
    const minBal = lim ? lim.minBal : 0;

    let agg = 0;
    let def = 0;
    const out = players.map(function (p) {
      return Object.assign({}, p);
    });

    // Openers attack, the middle order holds, the tail defends. Index order in
    // a hand-cricket squad is batting order, which is exactly the right hint.
    out.forEach(function (p, i) {
      let want;
      if (i < 2) want = "aggressive";
      else if (i >= out.length - 2 && out.length > 3) want = "defensive";
      else want = "balanced";

      if (want === "aggressive" && agg >= maxAgg) want = "balanced";
      if (want === "defensive" && def >= maxDef) want = "balanced";
      if (want === "aggressive") agg++;
      if (want === "defensive") def++;
      p.battingStyle = want;
      if (!p.bowlingStyle) p.bowlingStyle = "balanced";
    });

    // Guarantee the balanced minimum by converting the last aggressive pick.
    let bal = out.filter(function (p) { return p.battingStyle === "balanced"; }).length;
    for (let i = out.length - 1; i >= 0 && bal < minBal; i--) {
      if (out[i].battingStyle !== "balanced") {
        if (out[i].battingStyle === "aggressive") agg--;
        else def--;
        out[i].battingStyle = "balanced";
        bal++;
      }
    }
    return out;
  }

  window.hcRecordPlayedDay = recordPlayedDay;
  window.hcGetActivity = getActivity;
  window.hcStreakCardHtml = streakCardHtml;
  window.hcRecordH2H = h2hRecord;
  window.hcH2HHtml = h2hHtml;
  window.hcShareScorecard = shareScorecard;
  window.hcAutoPickRoles = autoPickRoles;
})();
