/* ============================================================================
 FILE: public/js/10-profiles.js
 ROLE: USER PROFILE & CAREER STATS — getUsername/setUsername, rank (getRank), loadStats/defaultStats/saveStats/updateStatsAfterMatch, profile card UI (showProfile/ProfileTabs/showOppProfile). Depends on: localStorage; G at call-time.
============================================================================ */

function getUsername() {
  return localStorage.getItem("hcp_username") || "";
}
function setUsername(n) {
  localStorage.setItem("hcp_username", n);
  G.myName = n;
}
function getRank(s) {
  const sr = s.ballsFaced ? (s.runs / s.ballsFaced) * 100 : 0;
  const pts =
    s.wins * 10 + s.sixes * 2 + s.fours + s.highestScore * 0.5 + sr * 0.1;
  if (pts >= 500) return "Legendary";
  if (pts >= 300) return "Master";
  if (pts >= 150) return "Champion";
  if (pts >= 80) return "Pro";
  if (pts >= 30) return "Rising Star";
  return "Newcomer";
}
function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem("hc_stats")) || defaultStats();
    if (s.wins > s.matches) s.wins = s.matches;
    if (s.losses > s.matches) s.losses = s.matches;
    s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) + "%" : "0%";
    s.strikeRate = s.ballsFaced
      ? ((s.runs / s.ballsFaced) * 100).toFixed(1)
      : "0.0";
    s.bowlingAvg = s.wicketsTaken
      ? (s.runsConceded / s.wicketsTaken).toFixed(1)
      : "-";
    return s;
  } catch (e) {
    return defaultStats();
  }
}
function defaultStats() {
  return {
    name: "",
    matches: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    runs: 0,
    ballsFaced: 0,
    sixes: 0,
    fours: 0,
    dots: 0,
    highestScore: 0,
    wicketsTaken: 0,
    ballsBowled: 0,
    runsConceded: 0,
    hatricks: 0,
    winStreak: 0,
    bestWinStreak: 0,
    streak: 0,
  };
}
function saveStats(s) {
  localStorage.setItem("hc_stats", JSON.stringify(s));
}
function updateStatsAfterMatch(result) {
  const s = loadStats();
  s.matches++;
  if (result.won) {
    s.wins++;
    s.streak++;
    s.bestWinStreak = Math.max(s.bestWinStreak, s.streak);
  } else if (result.lost) {
    s.losses++;
    s.streak = 0;
  } else {
    s.ties++;
  }
  s.runs += result.myRuns;
  s.ballsFaced += result.myBalls;
  s.sixes += result.mySixes;
  s.fours += result.myFours;
  s.highestScore = Math.max(s.highestScore, result.myRuns);
  // M3: a dot ball is only an explicit DOT (missed pick / auto dot) — NB, W and
  // run balls are never dots, and the old subtraction fallback went negative.
  const matchDots = result.myHist
    ? result.myHist.filter((h) => h === "DOT").length
    : 0;
  s.dots += matchDots;
  s.wicketsTaken += result.oppWickets;
  s.ballsBowled += result.oppBalls;
  s.runsConceded += result.oppRuns;
  if (result.myHatTrick) s.hatricks++;
  s.strikeRate = s.ballsFaced
    ? ((s.runs / s.ballsFaced) * 100).toFixed(1)
    : "0.0";
  s.bowlingAvg = s.wicketsTaken
    ? (s.runsConceded / s.wicketsTaken).toFixed(1)
    : "-";
  s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) + "%" : "0%";
  saveStats(s);
}

function showProfile(name, stats) {
  const s = stats || loadStats();
  const card = $("profileCard");
  const rank = getRank(s);
  // C12: viewing an OPPONENT's profile must show the OPPONENT's name, not ours.
  const displayName = name || G.myName || "Player";
  $("profileTitle").textContent = name ? name + "'s Profile" : "My Profile";
  card.innerHTML =
    // Header strip
    '<div class="prof-header">' +
    (name ? "OPPONENT PROFILE" : "MY PROFILE") +
    "</div>" +
    // Avatar + name row
    '<div class="prof-row"><div class="prof-avatar">🏏</div><div class="prof-info"><div class="prof-name">' +
    displayName +
    '</div><div class="prof-id" style="font-size:9px;color:rgba(122,56,0,.4)">' +
    ("G" + Math.floor(100000 + Math.random() * 900000)) +
    "</div></div></div>" +
    // Rank card
    '<div class="prof-rank"><div class="prof-rank-icon">⭐</div><div class="prof-rank-text"><div class="prof-rank-name">' +
    rank +
    '</div><div class="prof-rank-sub">' +
    s.matches +
    " matches played</div></div></div>" +
    // Tab strip
    '<div class="prof-tabs"><button class="prof-tab active" onclick="ProfileTabs.switch(\'overall\',this)">OVERALL</button><button class="prof-tab" onclick="ProfileTabs.switch(\'batting\',this)">BATTING</button><button class="prof-tab" onclick="ProfileTabs.switch(\'bowling\',this)">BOWLING</button></div>' +
    // Overall stats
    '<div class="prof-stats-grid" id="profStatsOverall">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🏏</div><div class="prof-stat-val">' +
    s.matches +
    '</div><div class="prof-stat-lbl">Matches Played</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">📊</div><div class="prof-stat-val">' +
    s.winPct +
    '%</div><div class="prof-stat-lbl">Win Rate</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🏆</div><div class="prof-stat-val">' +
    s.wins +
    '</div><div class="prof-stat-lbl">Matches Won</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">⚡</div><div class="prof-stat-val">' +
    s.highestScore +
    '</div><div class="prof-stat-lbl">Best Score</div></div>' +
    "</div>" +
    // Batting stats (hidden)
    '<div class="prof-stats-grid" id="profStatsBatting" style="display:none">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🏏</div><div class="prof-stat-val">' +
    s.runs +
    '</div><div class="prof-stat-lbl">Total Runs</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🎯</div><div class="prof-stat-val">' +
    s.strikeRate +
    '</div><div class="prof-stat-lbl">Strike Rate</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">💥</div><div class="prof-stat-val">' +
    s.sixes +
    '</div><div class="prof-stat-lbl">Sixes</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🔥</div><div class="prof-stat-val">' +
    s.fours +
    '</div><div class="prof-stat-lbl">Fours</div></div>' +
    "</div>" +
    // Bowling stats (hidden)
    '<div class="prof-stats-grid" id="profStatsBowling" style="display:none">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🎳</div><div class="prof-stat-val">' +
    s.wicketsTaken +
    '</div><div class="prof-stat-lbl">Wickets</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">📊</div><div class="prof-stat-val">' +
    s.bowlingAvg +
    '</div><div class="prof-stat-lbl">Bowling Avg</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">🎯</div><div class="prof-stat-val">' +
    s.dots +
    '</div><div class="prof-stat-lbl">Dot Balls</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon">⚡</div><div class="prof-stat-val">' +
    s.ballsBowled +
    '</div><div class="prof-stat-lbl">Balls Bowled</div></div>' +
    "</div>" +
    (name ? "" : '<div class="g-signin">Sign in to save progress</div>');
  $("profileOverlay").classList.remove("hidden");
}
const ProfileTabs = {
  switch(tab, btn) {
    document
      .querySelectorAll(".prof-tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const o = $("profStatsOverall"),
      b = $("profStatsBatting"),
      w = $("profStatsBowling");
    if (o) o.style.display = tab === "overall" ? "grid" : "none";
    if (b) b.style.display = tab === "batting" ? "grid" : "none";
    if (w) w.style.display = tab === "bowling" ? "grid" : "none";
    sfx("tap");
  },
};
function showOppProfile() {
  if (!G.oppStats) {
    return;
  }
  showProfile(G.oppName, G.oppStats);
}

/* ================================================================
   v3: ROLE SYSTEM + STORY MODE + CLOUD SAVE + UI REFRESH
   ================================================================ */

// ---- ROLE SYSTEM ----
// Player roles: battingStyle = 'aggressive'|'defensive'|'balanced'
//               bowlingStyle = 'aggressive'|'defensive'|'balanced'
// Batting restricts YOUR gesture picks. Bowling restricts YOUR picks when bowling.
// Bowling role is HIDDEN from opponent until wicket or over ends.

