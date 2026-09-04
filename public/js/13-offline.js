/* ============================================================================
 FILE: public/js/13-offline.js
 ROLE: OFFLINE vs BOT FLOW — roster builder, coin toss (offlineToss/resetOffline), showRoleForOffline() (role UI for team sizes), startOffline() (match bootstrap + bot profile gen). Depends on: engine (09), roles (15), bot-ai (02).
============================================================================ */

function resetOffline() {
  const box = $("coinBox");
  if (box) {
    box.style.display = "none";
    box.classList.remove("spinning", "win", "lose");
  }
  const r = $("tossResult");
  if (r) r.innerHTML = "";
  const d = $("tossDecision");
  if (d) d.style.display = "none";
  document.querySelectorAll(".toss-btn").forEach((b) => {
    b.disabled = false;
    b.classList.remove("sel");
  });
  const c = $("coin");
  if (c) {
    c.classList.remove("flipping", "landing");
    c.style.transform = "";
    c.style.removeProperty("--coin-total");
  }
}
$("btnHeads").onclick = () => offlineToss("heads");
$("btnTails").onclick = () => offlineToss("tails");
function offlineToss(call) {
  sfx("coin");
  haptic(20);
  const btnCall = call === "heads" ? $("btnHeads") : $("btnTails");
  btnCall.classList.add("sel");
  $("btnHeads").disabled = true;
  $("btnTails").disabled = true;
  const botName = (G.oppStats && G.oppStats.name) || "Ultra Bot";
  const res = Math.random() < 0.5 ? "heads" : "tails";
  const resChip = () => tossChipHTML(res);

  // Phase 1 — flip (ends ON the winning face, see tossSpin in 07-display.js)
  const box = $("coinBox");
  box.style.display = "block";
  box.classList.add("spinning");
  $("tossResult").innerHTML =
    '<span class="toss-msg">Flipping the coin' + tossDotsHTML() + "</span>";
  tossSpin($("coin"), res === "heads");

  setTimeout(() => {
    // Phase 2 — coin bounces to rest
    box.classList.remove("spinning");
    tossLand($("coin"), res === "heads");

    setTimeout(() => {
      tossSettle($("coin"), res === "heads");
      if (res === call) {
        // Phase 3a — YOU won: show result + decision cards
        box.classList.add("win");
        sfx("win");
        haptic(30);
        confetti(26);
        $("tossResult").innerHTML =
          resChip() +
          '<span class="toss-msg pop">You won the toss!</span>' +
          '<span class="toss-msg sub">You called ' +
          call +
          "</span>";
        $("tossDecision").style.display = "flex";
      } else {
        // Phase 3b — bot won: reveal, then let the bot "decide"
        box.classList.add("lose");
        sfx("lose");
        haptic(15);
        $("tossResult").innerHTML =
          resChip() +
          '<span class="toss-msg pop"><span class="bot-nm">' +
          botName +
          "</span> won the toss</span>";
        setTimeout(() => {
          $("tossResult").innerHTML +=
            '<span class="toss-msg sub pop">' +
            botName +
            " is deciding" +
            tossDotsHTML() +
            "</span>";
          setTimeout(() => {
            const bc = Math.random() < 0.5 ? "bat" : "bowl";
            G.iBat = bc === "bowl";
            sfx("go");
            $("tossResult").innerHTML =
              resChip() +
              '<span class="toss-msg pop"><span class="bot-nm">' +
              botName +
              "</span> chose to <b>" +
              (bc === "bat" ? "BAT first</b> <svg class=\"uic bats\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z\"/><path d=\"m9.6 10.4 4 4\"/></svg>" : "BOWL first</b> <svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\"/><path d=\"M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0\"/></svg>") +
              "</span>";
            // Even when the bot wins the toss you still assign YOUR team's roles
            // (team formats) — showRoleForOffline handles 1v1 by starting directly.
            setTimeout(showRoleForOffline, 1600);
          }, 900);
        }, 1000);
      }
    }, 600);
  }, 2300);
}
$("btnBatFirst").onclick = () => {
  sfx("tap");
  G.iBat = true;
  $("btnBatFirst").disabled = true;
  $("btnBowlFirst").disabled = true;
  showRoleForOffline();
};
$("btnBowlFirst").onclick = () => {
  sfx("tap");
  G.iBat = false;
  $("btnBatFirst").disabled = true;
  $("btnBowlFirst").disabled = true;
  showRoleForOffline();
};
// Builds the placeholder XI (Player 1..n / Bot 1..n) for team formats BEFORE
// the role screen. Previously rosters were only created inside startOffline(),
// which runs AFTER role assignment — so offline 2v2+ matches reached the role
// screen with an empty list and could never start.
function ensureOfflineRosters() {
  const n = G.teamSize || 1;
  if (n <= 1) return;
  const botName = (G.oppStats && G.oppStats.name) || G.oppName || genBotName();
  const fresh = (prefix) =>
    Array.from({ length: n }, (_, i) => ({
      name: prefix + (i + 1),
      role: i < n / 2 ? "batter" : "all",
    }));
  if (!G.myPlayers || G.myPlayers.length !== n || !G.myPlayers[0].name)
    G.myPlayers = fresh("Player ");
  if (!G.oppPlayers || G.oppPlayers.length !== n || !G.oppPlayers[0].name) {
    G.oppPlayers = fresh("Bot ");
    G.oppPlayers[0].name = botName;
  }
}
function showRoleForOffline() {
  ensureOfflineRosters();
  if (G.teamSize > 1) {
    G.myPlayers.forEach((p) => {
      if (!p.battingStyle) p.battingStyle = "balanced";
      if (!p.bowlingStyle) p.bowlingStyle = "balanced";
    });
    G.oppPlayers.forEach((p) => {
      if (!p.battingStyle)
        p.battingStyle = ["aggressive", "defensive", "balanced"][
          Math.floor(Math.random() * 3)
        ];
      if (!p.bowlingStyle)
        p.bowlingStyle = ["aggressive", "defensive", "balanced"][
          Math.floor(Math.random() * 3)
        ];
    });
    showRoleAssign(G.myPlayers, "offline", function (players) {
      G.myPlayers = players;
      startOffline();
    });
  } else {
    startOffline();
  }
}

function startOffline() {
  $("offlineSetup").classList.add("hidden");
  // Trust a roster that was already built for this match (role screen, quick
  // match): the globally-active size button may belong to a different screen.
  G.teamSize =
    G.myPlayers && G.myPlayers.length > 1
      ? G.myPlayers.length
      : getTeamSize();
  G.totalBalls = G.teamSize === 11 ? 120 : G.teamSize * 6;
  G.totalWkts = G.teamSize === 1 ? 1 : G.teamSize === 11 ? 10 : G.teamSize;
  G.freeHit = false;
  // C5: casual matches never inherit story difficulty/career flags.
  G.storyDifficulty = 0;
  G.storyMatch = false;
  BotAI.reset(0);
  const botName = G.oppStats ? G.oppStats.name : genBotName();
  G.oppName = botName;
  G.isBot = true;
  G.botProfile = genBotProfile();
  G.botProfile.name = botName;
  if (!G.oppStats) {
    const bM2 = Math.floor(Math.random() * 50) + 10;
    const bW2 = Math.min(Math.floor(Math.random() * 25) + 5, bM2);
    G.oppStats = {
      name: botName,
      matches: bM2,
      wins: bW2,
      losses: Math.max(0, bM2 - bW2 - Math.floor(Math.random() * 3)),
      ties: Math.floor(Math.random() * 3),
      runs: Math.floor(Math.random() * 500) + 50,
      ballsFaced: Math.floor(Math.random() * 400) + 40,
      sixes: Math.floor(Math.random() * 30) + 2,
      fours: Math.floor(Math.random() * 40) + 5,
      dots: Math.floor(Math.random() * 100) + 10,
      highestScore: Math.floor(Math.random() * 80) + 10,
      wicketsTaken: Math.floor(Math.random() * 40) + 3,
      ballsBowled: Math.floor(Math.random() * 300) + 30,
      runsConceded: Math.floor(Math.random() * 400) + 40,
      hatricks: Math.floor(Math.random() * 3),
      winStreak: 0,
      bestWinStreak: Math.floor(Math.random() * 8) + 1,
      streak: 0,
    };
    const bs = G.oppStats;
    bs.winPct = bs.matches
      ? ((bs.wins / bs.matches) * 100).toFixed(0) + "%"
      : "0%";
    bs.strikeRate = bs.ballsFaced
      ? ((bs.runs / bs.ballsFaced) * 100).toFixed(1)
      : "0.0";
    bs.bowlingAvg = bs.wicketsTaken
      ? (bs.runsConceded / bs.wicketsTaken).toFixed(1)
      : "-";
  }
  if (G.teamSize === 1) {
    G.myPlayers = [{ name: "You", role: "all" }];
    G.oppPlayers = [{ name: botName, role: "all" }];
  } else {
    // Keep rosters that already exist (role screen assigned styles) — only
    // build placeholders when nothing is set up yet (e.g. bot won the toss).
    ensureOfflineRosters();
  }
  G.oppName = botName;
  G.myName = "YOU";
  updAllNames();
  updScore();
  renderBalls();
  updBotLvl();
  updFH();
  showLeave(true);
  startInnings(1);
}

