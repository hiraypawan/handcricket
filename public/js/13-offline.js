/* ============================================================================
 FILE: public/js/13-offline.js
  ROLE: BOT-MATCH BOOTSTRAP (ex-OFFLINE) — roster builder, showRoleForOffline() (role UI for team sizes), startOffline() (match bootstrap + bot profile gen). The Offline menu + coin-toss screen were removed; Quick Match and Story are the only bot entries now. Depends on: engine (09), roles (15), bot-ai (02).
============================================================================ */

/* Offline menu + coin-toss setup screen were removed — bot matches now start
   from Quick Match (persona reveal, random toss) or Story. What remains here
   is the shared bot-match bootstrap: rosters, role screen, startOffline. */
/* NOTE: the offline coin-toss UI (btnHeads/btnTails/btnBatFirst/btnBowlFirst)
   was removed with the Offline menu — bot matches now toss randomly inside
   startQuickBotMatch. */
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
  /* v2.8 OPPONENT PERSONA: the opponent is a player with a name, a home city,
     a style and a career — all derived deterministically from the NAME, so the
     same opponent always shows the same record (it used to be re-rolled with
     Math.random() on every match). */
  G.botProfile = genBotProfile(botName);
  if (!G.oppStats) G.oppStats = personaStats(G.botProfile);
  if (G.teamSize === 1) {
    G.myPlayers = [{ name: "You", role: "all" }];
    G.oppPlayers = [{ name: botName, role: "all" }];
  } else {
    // Keep rosters that already exist (role screen assigned styles) — only
    // build placeholders when nothing is set up yet (e.g. bot won the toss).
    ensureOfflineRosters();
  }
  G.oppName = botName;
  /* Keep a display name set upstream (typed team name); default to YOU. */
  if (!G.myName || G.myName === "Player") G.myName = getUsername() || "YOU";
  updAllNames();
  updScore();
  renderBalls();
  updBotLvl();
  updFH();
  showLeave(true);
  startInnings(1);
}

