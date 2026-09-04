/* ============================================================================
 FILE: public/js/17-selection.js
 ROLE: PLAYER ROTATION & INNINGS BREAK — initPlayerStats, autoSelectOpponent, showPlayerSelect/selectPlayer, showInningsBreak. Depends on: engine (09).
============================================================================ */

function initPlayerStats() {
  G.myBatStats = G.myPlayers.map((p, i) => ({
    name: p.name,
    role: p.role,
    battingStyle: p.battingStyle || "balanced",
    bowlingStyle: p.bowlingStyle || "balanced",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    out: false,
    outReason: "",
  }));
  G.myBowlStats = G.myPlayers.map((p, i) => ({
    name: p.name,
    role: p.role,
    battingStyle: p.battingStyle || "balanced",
    bowlingStyle: p.bowlingStyle || "balanced",
    overs: 0,
    balls: 0,
    wickets: 0,
    runs: 0,
    dots: 0,
  }));
  G.oppBatStats = G.oppPlayers.map((p, i) => ({
    name: p.name,
    role: p.role,
    battingStyle: p.battingStyle || "balanced",
    bowlingStyle: p.bowlingStyle || "balanced",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    out: false,
    outReason: "",
  }));
  G.oppBowlStats = G.oppPlayers.map((p, i) => ({
    name: p.name,
    role: p.role,
    battingStyle: p.battingStyle || "balanced",
    bowlingStyle: p.bowlingStyle || "balanced",
    overs: 0,
    balls: 0,
    wickets: 0,
    runs: 0,
    dots: 0,
  }));
}

function curBatStats() {
  const isBatting = G.iBat;
  const statsArr = isBatting ? G.myBatStats : G.oppBatStats;
  const idx = G.batIdx;
  return statsArr[idx] || null;
}
function curBowlStats() {
  const isBowling = !G.iBat;
  const statsArr = isBowling ? G.myBowlStats : G.oppBowlStats;
  const idx = G.bowlIdx;
  return statsArr[idx] || null;
}

// --- Rotation semantics (C3 fix) -------------------------------------------
// Innings rotate like cricket: the batting side sends a NEW batter in after a
// wicket; the bowling side changes bowler at the end of every over.
//   * showPlayerSelect(...) is only ever called for YOUR OWN team
//     (you never pick the opponent's XI).
//   * autoSelectOpponent(...) picks for the OPPONENT's team.
// Index bookkeeping: G.batIdx belongs to whichever side is batting,
// G.bowlIdx to whichever side is bowling (curBatter/curBowler resolve the
// roster side, see 09-engine.js).

function autoSelectOpponent(type) {
  const players = G.oppPlayers;
  if (type === "bat") {
    // opponent needs a new batter after a wicket
    const stats = G.oppBatStats;
    for (let i = 0; i < players.length; i++) {
      if (i !== G.batIdx && stats[i] && !stats[i].out) {
        G.batIdx = i;
        break;
      }
    }
  } else {
    // opponent needs a new bowler at the end of an over
    const stats = G.oppBowlStats;
    for (let i = 0; i < players.length; i++) {
      if (i !== G.bowlIdx && stats[i]) {
        G.bowlIdx = i;
        break;
      }
    }
  }
  updatePlayerDisplay();
  G.state = "idle";
  setTimeout(nextBall, 800);
}

function showPlayerSelect(type) {
  if (G.teamSize <= 1) {
    G.state = "idle";
    setTimeout(nextBall, 1500);
    return;
  }
  G.state = "selecting";
  // own team only (see semantics above)
  const players = G.myPlayers;
  const statsArr = type === "bat" ? G.myBatStats : G.myBowlStats;
  const currentIdx = type === "bat" ? G.batIdx : G.bowlIdx;
  const avail = players
    .map((p, i) => ({
      player: p,
      idx: i,
      used: i === currentIdx,
      stat: statsArr[i],
    }))
    // 'bat': exclude the dismissed batter AND anyone already out (C4 now
    // records out=true). 'bowl': no out concept — just don't repeat the
    // bowler who just finished the over.
    .filter(
      (x) => !x.used && (type === "bowl" || !(x.stat && x.stat.out)),
    );

  if (avail.length === 0) {
    G.state = "idle";
    nextBall();
    return;
  }

  const title = type === "bat" ? "Select Next Batter" : "Select Next Bowler";
  const sub = type === "bat" ? "Choose who bats next" : "Choose who bowls next";
  $("psTitle").textContent = title;
  $("psSubtitle").textContent = sub;
  const currentPlayer = type === "bat" ? curBatter() : curBowler();
  $("psCurrent").textContent = "Current: " + (currentPlayer ? currentPlayer.name : "?");

  const grid = $("psGrid");
  grid.innerHTML = "";
  avail.forEach((a) => {
    const d = document.createElement("div");
    d.className = "pool-item";
    const styleKey = type === "bat" ? "battingStyle" : "bowlingStyle";
    const style = a.player[styleKey] || "balanced";
    const roleCls =
      style === "aggressive" ? "agg" : style === "defensive" ? "def" : "bal";
    d.innerHTML =
      "<span>" +
      a.player.name +
      '</span><span class="role-badge-inline ' +
      roleCls +
      '">' +
      ROLE_LABELS[style] +
      "</span>";
    d.onclick = () => {
      sfx("tap");
      selectPlayer(type, a.idx);
    };
    grid.appendChild(d);
  });

  $("playerSelectOverlay").classList.remove("hidden");
  let countdown = 10;
  $("psCountdown").textContent = countdown;
  if (G.selectTimer) clearInterval(G.selectTimer);
  G.selectTimer = setInterval(() => {
    countdown--;
    $("psCountdown").textContent = countdown;
    if (countdown <= 0) {
      clearInterval(G.selectTimer);
      G.selectTimer = null;
      const autoIdx = avail[0].idx;
      selectPlayer(type, autoIdx);
    }
  }, 1000);
}

function selectPlayer(type, idx) {
  if (G.selectTimer) {
    clearInterval(G.selectTimer);
    G.selectTimer = null;
  }
  $("playerSelectOverlay").classList.add("hidden");
  if (type === "bat") {
    G.batIdx = idx; // next batter of the batting side (ours when shown)
    const p = G.myPlayers[idx];
    if (p && !p.battingStyle) p.battingStyle = "balanced";
  } else {
    G.bowlIdx = idx; // next bowler of the bowling side (ours when shown)
    const p = G.myPlayers[idx];
    if (p && !p.bowlingStyle) p.bowlingStyle = "balanced";
  }
  updatePlayerDisplay();
  G.state = "idle";
  setTimeout(nextBall, 500);
}

function showInningsBreak() {
  const inn1Bat = G.iBat ? G.me : G.opp;
  const inn1Bowl = G.iBat ? G.opp : G.me;
  const inn1BatPlayers = G.iBat ? G.myPlayers : G.oppPlayers;
  const inn1BowlPlayers = G.iBat ? G.oppPlayers : G.myPlayers;
  const inn1BatStats = G.iBat ? G.myBatStats : G.oppBatStats;
  const inn1BowlStats = G.iBat ? G.oppBowlStats : G.myBowlStats;

  $("innBreakTitle").textContent = "End of 1st Innings";
  $("innBreakMsg").innerHTML =
    'Target: <span class="hl">' + (G.target + 1) + "</span> runs";

  let html = '<div class="inn-break-grid">';

  html += '<div class="inn-break-side"><h4>🏏 Batting</h4>';
  inn1BatStats.forEach((s, i) => {
    if (s.balls > 0 || s.runs > 0) {
      const roleCls =
        s.battingStyle === "aggressive"
          ? "agg"
          : s.battingStyle === "defensive"
            ? "def"
            : "bal";
      html +=
        '<div class="inn-break-player"><span class="ib-name">' +
        s.name +
        '<span class="ib-role ' +
        roleCls +
        '">' +
        ROLE_LABELS[s.battingStyle || "balanced"] +
        '</span></span><span class="ib-stat">' +
        s.runs +
        "(" +
        s.balls +
        ")</span></div>";
    }
  });
  html +=
    '<div class="inn-break-summary"><div class="big">' +
    inn1Bat.score +
    "/" +
    inn1Bat.wkts +
    '</div><div class="small">' +
    oversStr(inn1Bat.balls) +
    "</div></div>";
  html += "</div>";

  html += '<div class="inn-break-side"><h4>⚾ Bowling</h4>';
  inn1BowlStats.forEach((s, i) => {
    if (s.balls > 0) {
      const roleCls =
        s.bowlingStyle === "aggressive"
          ? "agg"
          : s.bowlingStyle === "defensive"
            ? "def"
            : "bal";
      html +=
        '<div class="inn-break-player"><span class="ib-name">' +
        s.name +
        '<span class="ib-role ' +
        roleCls +
        '">' +
        ROLE_LABELS[s.bowlingStyle || "balanced"] +
        '</span></span><span class="ib-stat">' +
        s.wickets +
        "w " +
        s.runs +
        "r</span></div>";
    }
  });
  html +=
    '<div class="inn-break-summary"><div class="big">' +
    inn1Bowl.score +
    "/" +
    inn1Bowl.wkts +
    '</div><div class="small">' +
    oversStr(inn1Bowl.balls) +
    "</div></div>";
  html += "</div>";

  html += "</div>";
  $("innBreakStats").innerHTML = html;

  $("inningsBreakOverlay").classList.remove("hidden");
  let countdown = 10;
  $("innBreakTimer").textContent = "Next innings in " + countdown + "s";
  if (G.selectTimer) clearInterval(G.selectTimer);
  G.selectTimer = setInterval(() => {
    countdown--;
    $("innBreakTimer").textContent = "Next innings in " + countdown + "s";
    if (countdown <= 0) {
      clearInterval(G.selectTimer);
      G.selectTimer = null;
      startInnings(2);
    }
  }, 1000);
}

// ================================================================
