/* ============================================================================
 FILE: public/js/09-engine.js
 ROLE: CORE MATCH ENGINE — roster helpers curBatter/curBowler/curBat & updatePlayerDisplay; team-size resolution (getTeamSize), per-ball timer start/stop; leave-game dialogs; innings lifecycle startInnings/nextBall/onTimeUp/pickAllowedGesture; ball resolution dotBall/noBall/checkReveal/triggerReveal/revealBall (scoring, free-hit, out, per-player stats, bowler-role reveal); endInnings/finishMatch + rematch/menu handling; resetGame(). Depends on: G (03), BotAI (02), display (07), roles (15) at call-time.
============================================================================ */

// --- Roster helpers --------------------------------------------------------
// IMPORTANT (C2): the CURRENT batter always belongs to the side that is
// BATTING (me when G.iBat, opponent otherwise) and the current bowler belongs
// to the side BOWLING. Older code hard-coded my/opp lists, which scrambled
// gesture restrictions, labels and reveals whenever the opponent batted.
function curBowler() {
  const side = G.iBat ? G.oppPlayers : G.myPlayers; // bowling side
  return side.length > G.bowlIdx ? side[G.bowlIdx] : null;
}
function curBatter() {
  const side = G.iBat ? G.myPlayers : G.oppPlayers; // batting side
  return side.length > G.batIdx ? side[G.batIdx] : null;
}
// Per-player stat rows for the CURRENT batter/bowler (side-aware). Empty until
// initPlayerStats() runs (teamSize > 1 matches), so always guard before use.
function currentBatterStats() {
  const arr = G.iBat ? G.myBatStats : G.oppBatStats;
  return arr.length > G.batIdx ? arr[G.batIdx] : null;
}
function currentBowlerStats() {
  const arr = G.iBat ? G.oppBowlStats : G.myBowlStats;
  return arr.length > G.bowlIdx ? arr[G.bowlIdx] : null;
}
function updatePlayerDisplay() {
  const bat = G.iBat ? G.me : G.opp;
  if (G.teamSize > 1) {
    const batter = curBatter();
    const bowler = curBowler();
    if (G.iBat) {
      if (batter)
        $("playerA").innerHTML =
          "<svg class=\"uic bats\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z\"/><path d=\"m9.6 10.4 4 4\"/></svg> Batting: <b>" +
          batter.name +
          "</b>" +
          (batter.battingStyle && batter.battingStyle !== "balanced"
            ? ' <span class="role-badge-inline ' +
              (ROLE_COLORS[batter.battingStyle] || "bal") +
              '">' +
              ROLE_LABELS[batter.battingStyle] +
              "</span>"
            : "");
      if (bowler)
        $("playerB").innerHTML = "<svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\"/><path d=\"M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0\"/></svg> Bowling: <b>" + bowler.name + "</b>";
      else $("playerB").textContent = "";
    } else {
      if (bowler)
        $("playerA").innerHTML =
          "<svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\"/><path d=\"M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0\"/></svg> Bowling: <b>" +
          bowler.name +
          "</b>" +
          (bowler.bowlingStyle && bowler.bowlingStyle !== "balanced"
            ? ' <span class="role-badge-inline ' +
              (ROLE_COLORS[bowler.bowlingStyle] || "bal") +
              '">' +
              ROLE_LABELS[bowler.bowlingStyle] +
              "</span>"
            : "");
      if (batter)
        $("playerB").innerHTML = "<svg class=\"uic bats\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z\"/><path d=\"m9.6 10.4 4 4\"/></svg> Batting: <b>" + batter.name + "</b>";
    }
  } else {
    $("playerA").textContent = "";
    $("playerB").textContent = "";
  }
}

function getTeamSize() {
  const active = document.querySelector(".team-size-btn.active");
  return active ? parseInt(active.dataset.size) : 1;
}
function startTimer() {
  $("timerWrap").style.display = "block";
  G.tStart = performance.now();
  $("timerFg").style.strokeDashoffset = 0;
  $("timerText").textContent = TIMER;
  $("handPlayer").classList.add("shake");
  $("handOpponent").classList.add("shake");
  let lastS = TIMER + 1,
    lastT = -1;
  function tick(now) {
    if (G.state === "processing" || G.state === "revealing") return;
    const el = (now - G.tStart) / 1000,
      rem = Math.max(0, TIMER - el);
    $("timerFg").style.strokeDashoffset = CIRC * (1 - rem / TIMER);
    const c = Math.ceil(rem);
    $("timerText").textContent = c || "GO";
    const s = Math.floor(rem);
    if (s !== lastT && s >= 0 && s < TIMER) {
      lastT = s;
      sfx("tick");
    }
    if (c !== lastS && c > 0 && c <= 3) {
      lastS = c;
      showCD(c);
    }
    if (rem <= 0) {
      onTimeUp();
      return;
    }
    G.timerId = requestAnimationFrame(tick);
  }
  G.timerId = requestAnimationFrame(tick);
}
function stopTimer() {
  if (G.timerId) {
    cancelAnimationFrame(G.timerId);
    G.timerId = null;
  }
  $("timerWrap").style.display = "none";
  $("handPlayer").classList.remove("shake");
  $("handOpponent").classList.remove("shake");
}

$("leaveBtn").onclick = () => {
  sfx("tap");
  $("leaveOverlay").classList.remove("hidden");
};
$("btnYesLeave").onclick = () => {
  $("leaveOverlay").classList.add("hidden");
  destroyPeer();
  clearWD();
  stopTimer();
  clearSnap();
  $("menuOverlay").classList.remove("hidden");
  showLeave(false);
  resetGame();
  history.replaceState({}, "", location.pathname);
};
$("btnNoLeave").onclick = () => {
  $("leaveOverlay").classList.add("hidden");
};
function startInnings(n) {
  if (typeof hideDock === "function") hideDock(); // dock never overlays live play
  // C11: never double-start the 2nd innings (countdown timer + button tap, or
  // host + joiner both firing) — also clear any lingering break overlays.
  if (n === 2 && G.innings !== 1) return;
  $("inningsBreakOverlay").classList.add("hidden");
  $("inningsOverlay").classList.add("hidden");
  clearWD();
  G.innings = n;
  if (n === 2) {
    G.iBat = !G.iBat;
    G.batIdx = 0;
    G.bowlIdx = 0;
  }
  const bat = G.iBat ? G.me : G.opp;
  bat.score = 0;
  bat.wkts = 0;
  bat.balls = 0;
  bat.hist = [];
  G.state = "idle";
  G.freeHit = false;
  if (G.teamSize > 1) initPlayerStats();
  updScore();
  renderBalls();
  updFH();
  const bn = G.iBat
    ? G.mode === "online"
      ? G.myName
      : "YOU"
    : G.oppName || "Opponent";
  const ov = G.totalBalls / 6;
  const ft = G.totalWkts + " wk, " + ov + " ov";
  if (typeof botChat === "function") {
    botChat("onMatchStart");
    if (n === 2 && G.target != null && G.target > G.totalBalls) {
      botChat(G.iBat ? "onBigChaseBotBowling" : "onBigChaseBotBatting");
    }
  }
  if (n === 1) {
    $("status").innerHTML =
      '<span class="hl">1st Innings</span> - ' + bn + " (" + ft + ")";
    $("targetBanner").classList.remove("show");
  } else {
    setStage("playing");
    $("status").innerHTML =
      '<span class="hl">2nd Innings</span> Target: <b>' +
      (G.target + 1) +
      "</b>";
    $("targetNum").textContent = G.target + 1;
    $("targetBanner").classList.add("show");
  }
  setHandGesture($("handImgPlayer"), $("handPlayer"), null);
  setHandGesture($("handImgOpponent"), $("handOpponent"), null);
  $("labelPlayer").classList.remove("show");
  $("labelPlayer").textContent = "-";
  $("labelOpponent").classList.remove("show");
  $("labelOpponent").textContent = "-";
  // Start next ball
  setTimeout(nextBall, 700);
}
function curBat() {
  return G.iBat ? G.me : G.opp;
}
function nextBall() {
  clearWD();
  const bat = curBat();
  if (bat.balls >= G.totalBalls || bat.wkts >= G.totalWkts) {
    endInnings();
    return;
  }
  G.state = "waiting";
  G.myPick = null;
  G.oppPick = null;
  G.iAuto = false;
  G.oppAuto = false;
  setBtns(true);
  setHandGesture($("handImgPlayer"), $("handPlayer"), null);
  setHandGesture($("handImgOpponent"), $("handOpponent"), null);
  $("labelPlayer").classList.remove("show");
  $("labelPlayer").textContent = "?";
  $("labelOpponent").classList.remove("show");
  $("labelOpponent").textContent = "?";
  if (G.mode === "offline") {
    BotAI.updateContext(G.target, G.me.score, G.me.wkts, G.totalBalls);
    BotAI.difficulty =
      G.storyDifficulty || Math.min(0.1 * (G.teamSize || 1), 0.5);
    G.oppPick = botPickWithRole();
    updBotLvl();
  }
  const fh = G.freeHit ? " FREE HIT" : "";
  $("status").innerHTML = G.iBat ? "BAT!" + fh : "BOWL!" + fh;
  updFH();
  startTimer();
  armWD();
  // Grey out gestures this player cannot pick (role restrictions)
  try {
    applyGestureRestrictions();
  } catch (e) {}
}
// v2.7.1: the bot obeys its assigned role too — clamp BotAI's pick into the
// role's allowed gestures (AGG 4-6 / DEF 1-3 / BAL all), bat or bowl.
function botPickWithRole() {
  const botBats = !G.iBat;
  const p = botBats ? curBatter() : curBowler();
  let allowed;
  try {
    allowed = getAllowedGestures(p, botBats);
  } catch (e) {
    allowed = [1, 2, 3, 4, 5, 6];
  }
  const raw = botBats ? BotAI.bat() : BotAI.bowl();
  return allowed.includes(raw) ? raw : allowed[(Math.random() * allowed.length) | 0];
}
function pickAllowedGesture() {
  const isBatting = G.iBat;
  const myPlayer = isBatting ? curBatter() : curBowler();
  const allowed = getAllowedGestures(myPlayer, isBatting);
  return allowed[Math.floor(Math.random() * allowed.length)];
}
function onTimeUp() {
  stopTimer();
  if (G.state !== "waiting") return;
  if (G.mode === "offline") {
    if (G.myPick === null) {
      G.myPick = pickAllowedGesture();
      G.iAuto = true;
    }
    BotAI.record(G.myPick);
    triggerReveal();
  } else {
    if (G.myPick === null) {
      G.myPick = pickAllowedGesture();
      G.iAuto = true;
      sendMsg({ type: "choice", value: G.myPick, auto: true });
    } else sendMsg({ type: "choice", value: G.myPick, auto: false });
    checkReveal();
  }
}
function dotBall() {
  G.state = "processing";
  setBtns(false);
  const bat = curBat();
  bat.balls++;
  bat.hist.push("DOT");
  // per-player stats (C4)
  const bStats = currentBatterStats();
  if (bStats) {
    bStats.balls++;
  }
  const wStats = currentBowlerStats();
  if (wStats) {
    wStats.balls++;
    wStats.dots++;
  }
  flash("DOT!", "dot");
  sfx("run");
  haptic(10);
  $("status").innerHTML = '<span class="hl">DOT!</span> Missed pick.';
  if (G.freeHit) {
    G.freeHit = false;
    updFH();
  }
  updScore();
  renderBalls();
  persist();
  G.state = "idle";
  setTimeout(nextBall, 1500);
}
function noBall() {
  G.state = "processing";
  setBtns(false);
  const bat = curBat();
  bat.score += 1;
  bat.hist.push("NB");
  // per-player stats (C4): no-ball is NOT a legal ball for over counting, but
  // the batter/bowler still accrue the penalty run.
  const bStats = currentBatterStats();
  if (bStats) bStats.runs += 1;
  const wStats = currentBowlerStats();
  if (wStats) wStats.runs += 1;
  flash("NO BALL!", "noball");
  sfx("nb");
  haptic(25);
  $("status").innerHTML = '<span class="hl">NO BALL!</span> +1 & FREE HIT!';
  G.freeHit = true;
  updScore();
  renderBalls();
  updFH();
  persist();
  G.state = "idle";
  if (typeof botChat === "function")
      botChat(G.iBat ? "onFreeHitBowling" : "onFreeHitBatting");
  setTimeout(() => {
    sfx("fh");
    nextBall();
  }, 1800);
}
function checkReveal() {
  if (G.state !== "waiting") return;
  if (G.myPick !== null && G.oppPick !== null) {
    triggerReveal();
  } else if (G.myPick !== null) {
    $("labelPlayer").textContent = "Locked";
    $("labelPlayer").classList.add("show");
    $("status").innerHTML = "Waiting...";
  }
}
function triggerReveal() {
  if (G.state !== "waiting") return;
  G.state = "revealing";
  stopTimer();
  setBtns(false);
  if (G.mode === "offline") {
    BotAI.record(G.myPick);
    updBotLvl();
  }
  setTimeout(revealBall, G.mode === "offline" ? 400 : 50);
}
$("gestureGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".gesture-btn");
  if (
    !btn ||
    btn.classList.contains("disabled") ||
    btn.classList.contains("restricted") ||
    G.state !== "waiting"
  )
    return;
  ensureAudio();
  const val = parseInt(btn.dataset.val, 10);
  G.myPick = val;
  sfx("tap");
  haptic(10);
  $("gestureGrid")
    .querySelectorAll(".gesture-btn")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  if (G.mode === "online") {
    sendMsg({ type: "choice", value: val, auto: false });
    checkReveal();
  } else {
    triggerReveal();
  }
});
function revealBall() {
  if (G.state !== "revealing") return;
  G.state = "processing";
  try {
    const batAuto = G.iBat ? G.iAuto : G.oppAuto,
      bowlAuto = G.iBat ? G.oppAuto : G.iAuto;
    if (batAuto && !bowlAuto) {
      dotBall();
      return;
    }
    if (bowlAuto && !batAuto) {
      noBall();
      return;
    }
    if (batAuto && bowlAuto) {
      dotBall();
      return;
    }
    setHandGesture($("handImgPlayer"), $("handPlayer"), G.myPick);
    setHandGesture($("handImgOpponent"), $("handOpponent"), G.oppPick);
    $("labelPlayer").textContent = gLabel(G.myPick);
    $("labelPlayer").classList.add("show");
    $("labelOpponent").textContent = gLabel(G.oppPick);
    $("labelOpponent").classList.add("show");
    showNumberReveal(G.iBat ? G.myPick : G.oppPick);
    showCD("GO!");
    sfx("go");
    const bVal = G.iBat ? G.myPick : G.oppPick,
      bowlVal = G.iBat ? G.oppPick : G.myPick,
      batting = curBat();
    setTimeout(() => {
      try {
        if (bVal === bowlVal) {
          if (G.freeHit) {            batting.score += bVal;
            batting.balls++;
            batting.hist.push(bVal);
            // per-player stats (C4)
            {
              const bs = currentBatterStats();
              if (bs) { bs.runs += bVal; bs.balls++; }
              const ws = currentBowlerStats();
              if (ws) { ws.runs += bVal; ws.balls++; }
            }
            flash("FREE HIT! +" + bVal, "six");
            sfx("fh");
            confetti(15);
            haptic(30);
            $("status").innerHTML =
              '<span class="hl">FREE HIT!</span> Safe! +' + bVal;
            popScore(G.iBat ? "A" : "B");
            G.freeHit = false;
            updFH();
          } else {
            batting.wkts++;
            batting.balls++;
            batting.hist.push("W");
            flash("OUT!", "out");
            shake();
            sfx("out");
            try {
              handPump(G.iBat); // v2.7: dismissed side's hand fist-pumps
            } catch (e) {}
            const who = G.iBat
              ? G.mode === "online"
                ? G.myName
                : "YOU"
              : G.oppName || "Opponent";
            $("status").innerHTML = '<span class="hl">' + who + " OUT!</span>";
            // per-player stats (C4): mark batter out + credit the bowler
            {
              const bs = currentBatterStats();
              if (bs) { bs.balls++; bs.out = true; bs.outReason = "Bowled"; }
              const ws = currentBowlerStats();
              if (ws) { ws.balls++; ws.wickets++; }
            }
          }
        } else {
          const runs = bVal;
          batting.score += runs;
          batting.balls++;
          batting.hist.push(bVal);
          // per-player stats (C4)
          {
            const bs = currentBatterStats();
            if (bs) {
              bs.balls++;
              bs.runs += runs;
              if (runs === 6) bs.sixes++;
              else if (runs === 4) bs.fours++;
            }
            const ws = currentBowlerStats();
            if (ws) { ws.balls++; ws.runs += runs; }
          }
          if (G.freeHit) {
            G.freeHit = false;
            updFH();
          }
          if (bVal === 6) {
            flash("SIX! +" + runs, "six");
            sfx("six");
            confetti(28);
            haptic(30);
          } else if (bVal >= 4) {
            flash("FOUR! +" + runs, "runs");
            sfx("run");
            haptic(20);
          } else {
            flash("+" + runs, "runs");
            sfx("run");
            haptic(10);
          }
          const bn = G.iBat
            ? G.mode === "online"
              ? G.myName
              : "YOU"
            : G.oppName || "Opponent";
          $("status").innerHTML = bn + ' +<span class="hl">' + runs + "</span>";
          popScore(G.iBat ? "A" : "B");
        }
        updScore();
        renderBalls();
        persist();
        if (typeof botChat === "function") {
          if (bVal === bowlVal && !G.freeHit) {
            botChat(G.iBat ? "onPlayerOut" : "onBotOut");
          } else if (bVal === 6) {
            // v2.7.1: was inverted. onPlayer* = bot reacting to MY shot;
            // onBot* = bot scoring, now roasting MY bowling (never self-praise).
            botChat(G.iBat ? "onPlayerSix" : "onBotSix");
          } else if (bVal >= 4) {
            botChat(G.iBat ? "onPlayerFour" : "onBotFour");
          } else if (bVal === 0) {
            botChat(G.iBat ? "onDotBowling" : "onDotBatting");
          }
        }
        if (G.innings === 2 && G.target != null) {
          const ch = curBat();
          if (typeof botChat === "function" && G.target - ch.score === 1) {
            botChat(G.iBat ? "onOneToWinBotBowling" : "onOneToWinBotBatting");
          }
          if (ch.score > G.target) {
            setTimeout(endInnings, 1200);
            G.state = "idle";
            return;
          }
        }
        const bat2 = curBat();
        const wicketJustFell = bVal === bowlVal && !G.freeHit;
        const overEnded = bat2.balls % 6 === 0 && bat2.balls > 0;
        if (typeof botChat === "function" && overEnded)
          botChat(G.iBat ? "onOverEndBowling" : "onOverEndBatting");
        // Bowler role reveal banner (hidden bowling style) after wicket/over.
        if (wicketJustFell || overEnded) {
          setTimeout(() => {
            try {
              revealBowlerRole(wicketJustFell);
            } catch (e) {}
          }, 900);
        }
        // Rotation: new batter after a wicket (batting side), new bowler at the
        // end of an over (bowling side). If the wicket was the LAST wicket of
        // the innings, skip the selector and go straight to endInnings.
        const allOut = wicketJustFell && bat2.wkts >= G.totalWkts;
        if (!allOut && G.teamSize > 1 && (wicketJustFell || overEnded)) {
          if (wicketJustFell) {
            if (G.iBat) showPlayerSelect("bat");
            else autoSelectOpponent("bat");
          } else if (overEnded) {
            if (!G.iBat) showPlayerSelect("bowl");
            else autoSelectOpponent("bowl");
          }
        } else {
          G.state = "idle";
          setTimeout(nextBall, 1500);
        }
      } catch (e) {
        console.error("revealBall error:", e);
        G.state = "idle";
        nextBall();
      }
    }, 750);
  } catch (e) {
    console.error("revealBall error:", e);
    G.state = "idle";
    nextBall();
  }
}

function endInnings() {
  clearWD();
  stopTimer();
  setBtns(false);
  G.state = "idle";
  G.freeHit = false;
  updFH();
  const bat = curBat();
  const bn = G.iBat
    ? G.mode === "online"
      ? G.myName
      : "YOU"
    : G.oppName || "Opponent";
  if (G.innings === 1) {
    G.target = bat.score;
    setStage("break");
    if (G.mode === "offline") {
      $("inningsOverlay").classList.add("hidden");
      showInningsBreak();
    } else {
      if (G.isHost) {
        showInningsBreak();
        sendMsg({ type: "innings_sync" });
      } else {
        $("status").innerHTML = '<span class="hl">Waiting for host...</span>';
      }
    }
  } else {
    setStage("over");
    finishMatch();
  }
}
function finishMatch() {
  const my = G.me.score,
    op = G.opp.score;
  let t, m;
  const won = my > op,
    tied = my === op;
  const mn = G.mode === "online" ? G.myName : "YOU",
    on = G.oppName || "Opponent";
  if (won) {
    t = "YOU WIN!";
    m =
      mn +
      " " +
      my +
      "/" +
      G.me.wkts +
      " vs " +
      on +
      " " +
      op +
      "/" +
      G.opp.wkts;
    confetti(60);
    sfx("win");
  } else if (!won && !tied) {
    t = "LOSE";
    m =
      mn +
      " " +
      my +
      "/" +
      G.me.wkts +
      " vs " +
      on +
      " " +
      op +
      "/" +
      G.opp.wkts;
    sfx("lose");
  } else {
    t = "TIED";
    m = "Both: " + my + "/" + G.me.wkts;
  }
  $("resTitle").textContent = t;
  $("resMsg").innerHTML = m;
  // M2: real hat-trick = 3+ wickets in consecutive balls bowled by us
  // (opp.hist holds the balls of the innings the opponent batted).
  let consecW = 0,
    bestConsecW = 0;
  for (const h of G.opp.hist || []) {
    consecW = h === "W" ? consecW + 1 : 0;
    if (consecW > bestConsecW) bestConsecW = consecW;
  }
  const matchResult = {
    won: !won && !tied ? false : won,
    lost: !won && !tied,
    tied,
    myHatTrick: bestConsecW >= 3,
    myRuns: G.me.score,
    myBalls: G.me.balls,
    mySixes: G.me.hist.filter((h) => h === 6).length,
    myFours: G.me.hist.filter((h) => h === 4).length,
    myWickets: G.me.wkts,
    oppRuns: G.opp.score,
    oppBalls: G.opp.balls,
    oppWickets: G.opp.wkts,
    myHist: G.me.hist,
    // v2.8: the balls the OPPONENT faced — needed to count dots BOWLED,
    // which the career bowling card previously could not do.
    oppHist: G.opp.hist,
  };
  G.recentResult = matchResult;
  updateStatsAfterMatch(matchResult);
  const statsBox = $("matchStatsBox");
  statsBox.style.display = "block";
  const s = loadStats();
  statsBox.innerHTML =
    '<div class="profile-card"><div class="profile-section"><h3>Main Stats</h3><div class="stat-grid two-col"><div class="stat-item"><div class="val">' +
    s.matches +
    '</div><div class="lbl">Matches</div></div><div class="stat-item"><div class="val">' +
    s.wins +
    '</div><div class="lbl">Wins</div></div><div class="stat-item"><div class="val">' +
    s.winPct +
    '</div><div class="lbl">Win%</div></div><div class="stat-item"><div class="val">' +
    s.streak +
    '</div><div class="lbl">Streak</div></div></div></div><div class="profile-section"><h3>Batting</h3><div class="stat-grid"><div class="stat-item"><div class="val">' +
    s.runs +
    '</div><div class="lbl">Runs</div></div><div class="stat-item"><div class="val">' +
    s.strikeRate +
    '</div><div class="lbl">SR</div></div><div class="stat-item"><div class="val">' +
    s.highestScore +
    '</div><div class="lbl">Best</div></div><div class="stat-item"><div class="val">' +
    s.sixes +
    '</div><div class="lbl">Sixes</div></div><div class="stat-item"><div class="val">' +
    s.fours +
    '</div><div class="lbl">Fours</div></div></div></div><div class="profile-section"><h3>Bowling</h3><div class="stat-grid"><div class="stat-item"><div class="val">' +
    s.wicketsTaken +
    '</div><div class="lbl">Wkts</div></div><div class="stat-item"><div class="val">' +
    s.bowlingAvg +
    '</div><div class="lbl">Avg</div></div><div class="stat-item"><div class="val">' +
    s.dots +
    '</div><div class="lbl">Dots</div></div></div></div></div>';
  $("btnRematch").style.display = "inline-block";
  $("btnAgain").style.display = "none";
  $("btnMenu").style.display = "inline-block";
  $("resultOverlay").classList.remove("hidden");
  showLeave(false);
  // Story-mode career bookkeeping lives in the story finishMatch wrapper
  // (16-story.js) gated on G.storyMatch — not here.
  if (typeof showAddFriendBtn === "function") showAddFriendBtn();
  if (typeof maybeBotFriendRequest === "function") maybeBotFriendRequest();
  if (typeof maybeBotChallenge === "function") maybeBotChallenge();
}
$("btnNextInn").onclick = () => {
  sfx("tap");
  $("inningsOverlay").classList.add("hidden");
  startInnings(2);
};
$("btnInnBreakNext").onclick = () => {
  sfx("tap");
  if (G.selectTimer) {
    clearInterval(G.selectTimer);
    G.selectTimer = null;
  }
  $("inningsBreakOverlay").classList.add("hidden");
  startInnings(2);
};
$("btnRematch").onclick = () => {
  sfx("tap");
  $("resultOverlay").classList.add("hidden");
  clearSnap();
  if (G.mode === "online" && G.isHost) {
    doRematch();
    sendMsg({ type: "rematch" });
  } else if (G.mode === "offline") {
    G.me = { score: 0, wkts: 0, balls: 0, hist: [] };
    G.opp = { score: 0, wkts: 0, balls: 0, hist: [] };
    G.target = null;
    G.innings = 1;
    G.freeHit = false;
    BotAI.reset(G.storyDifficulty || 0);
    startInnings(1);
  }
};
function doRematch() {
  G.innings = 1;
  G.target = null;
  G.iBat = !G.iBat;
  G.batIdx = 0;
  G.bowlIdx = 0;
  G.me = { score: 0, wkts: 0, balls: 0, hist: [] };
  G.opp = { score: 0, wkts: 0, balls: 0, hist: [] };
  G.freeHit = false;
  $("resultOverlay").classList.add("hidden");
  startInnings(1);
}
$("btnAgain").onclick = () => {
  sfx("tap");
  $("resultOverlay").classList.add("hidden");
  if (G.mode === "offline") {
    G.me = { score: 0, wkts: 0, balls: 0, hist: [] };
    G.opp = { score: 0, wkts: 0, balls: 0, hist: [] };
    G.target = null;
    G.innings = 1;
    G.freeHit = false;
    BotAI.reset(G.storyDifficulty || 0);
    startInnings(1);
  } else if (G.mode === "online") {
    if (G.isHost) {
      doRematch();
      sendMsg({ type: "rematch" });
    } else {
      $("status").innerHTML =
        '<span class="hl">Waiting for host rematch...</span>';
    }
  }
};
$("btnMenu").onclick = () => {
  sfx("tap");
  destroyPeer();
  clearSnap();
  $("resultOverlay").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
  resetGame();
  updHomeTrophies();
  history.replaceState({}, "", location.pathname);
};
$("btnMenu").className = "back-btn";
function resetGame() {
  clearWD();
  stopTimer();
  if (G.selectTimer) {
    clearInterval(G.selectTimer);
    G.selectTimer = null;
  }
  G.innings = 1;
  G.target = null;
  G.me = { score: 0, wkts: 0, balls: 0, hist: [] };
  G.opp = { score: 0, wkts: 0, balls: 0, hist: [] };
  G.myPick = null;
  G.oppPick = null;
  G.state = "idle";
  G.stage = "lobby";
  G.batIdx = 0;
  G.bowlIdx = 0;
  G.myTeam = null;
  G.oppTeam = null;
  G.myPlayers = [];
  G.oppPlayers = [];
  G.freeHit = false;
  G.iAuto = false;
  G.oppAuto = false;
  G.isBot = false;
  G.botProfile = null;
  G.oppStats = null;
  G.myBatStats = [];
  G.myBowlStats = [];
  G.oppBatStats = [];
  G.oppBowlStats = [];
  // Leave story mode state behind: casual matches must not inherit story
  // difficulty nor record into the career (C5/C6).
  G.storyDifficulty = 0;
  G.storyMatch = false;
  BotAI.reset();
  setHandGesture($("handImgPlayer"), $("handPlayer"), null);
  setHandGesture($("handImgOpponent"), $("handOpponent"), null);
  $("labelPlayer").classList.remove("show");
  $("labelPlayer").textContent = "-";
  $("labelOpponent").classList.remove("show");
  $("labelOpponent").textContent = "-";
  $("targetBanner").classList.remove("show");
  $("fhBanner").classList.remove("show");
  $("playerSelectOverlay").classList.add("hidden");
  $("inningsBreakOverlay").classList.add("hidden");
  showLeave(false);
  updScore();
  renderBalls();
  updBotLvl();
  $("status").innerHTML = "Choose mode";
}

