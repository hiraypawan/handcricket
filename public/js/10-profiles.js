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
    s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) : "0";
    s.strikeRate = s.ballsFaced
      ? ((s.runs / s.ballsFaced) * 100).toFixed(1)
      : "0.0";
    s.bowlingAvg = s.wicketsTaken
      ? (s.runsConceded / s.wicketsTaken).toFixed(1)
      : "-";
    // v2.7.1: richer career numbers players compare with each other
    s.economy = s.ballsBowled
      ? (s.runsConceded / (s.ballsBowled / 6)).toFixed(2)
      : "-";
    s.dotPct = s.ballsFaced
      ? Math.round((s.dots / s.ballsFaced) * 100)
      : 0;
    s.boundaryPct = s.ballsFaced
      ? Math.round(((s.fours + s.sixes) / s.ballsFaced) * 100)
      : 0;
    s.batAvg = s.outs ? (s.runs / s.outs).toFixed(1) : s.runs ? s.runs.toFixed(1) : "0.0";
    s.oversBowled = Math.floor(s.ballsBowled / 6) + "." + (s.ballsBowled % 6);
    s.oversFaced = Math.floor(s.ballsFaced / 6) + "." + (s.ballsFaced % 6);
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
    outs: 0,
    bestBowlWkts: 0,
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
  s.outs = (s.outs || 0) + result.oppWickets;
  s.bestBowlWkts = Math.max(s.bestBowlWkts || 0, result.oppWickets);
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

function escHtml(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
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
    '<div class="prof-row"><div class="prof-avatar av-initials">' + escHtml((displayName || "?").trim().charAt(0).toUpperCase()) + '</div><div class="prof-info"><div class="prof-name">' +
    displayName +
    '</div><div class="prof-id" style="font-size:9px;color:rgba(148,163,184,.45)">' +
    ("G" + Math.floor(100000 + Math.random() * 900000)) +
    "</div></div></div>" +
    // Rank card
    '<div class="prof-rank"><div class="prof-rank-icon"><svg class="ic-stat" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.5 1.3 6.4L12 17.2l-5.9 3.2 1.3-6.4-4.9-4.5 6.6-.8z" fill="currentColor"/></svg></div><div class="prof-rank-text"><div class="prof-rank-name">' +
    rank +
    '</div><div class="prof-rank-sub">' +
    s.matches +
    " matches played</div></div></div>" +
    // Tab strip
    '<div class="prof-tabs"><button class="prof-tab active" onclick="ProfileTabs.switch(\'overall\',this)">OVERALL</button><button class="prof-tab" onclick="ProfileTabs.switch(\'batting\',this)">BATTING</button><button class="prof-tab" onclick="ProfileTabs.switch(\'bowling\',this)">BOWLING</button></div>' +
    // Overall stats
    '<div class="prof-stats-grid" id="profStatsOverall">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z"/><path d="m9.6 10.4 4 4"/></svg></div><div class="prof-stat-val">' +
    s.matches +
    '</div><div class="prof-stat-lbl">Matches Played</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20h14"/><path d="M8.2 17v-4.6M12 17V8.2M15.8 17v-6.4"/></svg></div><div class="prof-stat-val">' +
    s.winPct +
    '%</div><div class="prof-stat-lbl">Win Rate</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4.6a2.4 2.4 0 0 0 0 4.8H7M17 6h2.4a2.4 2.4 0 0 1 0 4.8H17"/></svg></div><div class="prof-stat-val">' +
    s.wins +
    '</div><div class="prof-stat-lbl">Matches Won</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9z" fill="currentColor"/></svg></div><div class="prof-stat-val">' +
    s.highestScore +
    '</div><div class="prof-stat-lbl">Best Score</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l4-6 4 3 5-8 4 5"/></svg></div><div class="prof-stat-val">' +
    (s.bestWinStreak || 0) +
    '</div><div class="prof-stat-lbl">Best Win Streak</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="16" r="2.3"/><circle cx="12" cy="11" r="2.3"/><circle cx="18" cy="6.5" r="2.3"/></svg></div><div class="prof-stat-val">' +
    (s.hatricks || 0) +
    '</div><div class="prof-stat-lbl">Hat-tricks</div></div>' +
    "</div>" +
    // Batting stats (hidden)
    '<div class="prof-stats-grid" id="profStatsBatting" style="display:none">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z"/><path d="m9.6 10.4 4 4"/></svg></div><div class="prof-stat-val">' +
    s.runs +
    '</div><div class="prof-stat-lbl">Total Runs</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6" opacity=".55"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg></div><div class="prof-stat-val">' +
    s.strikeRate +
    '</div><div class="prof-stat-lbl">Strike Rate</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.4V6M12 18v3.6M2.4 12H6M18 12h3.6M5.1 5.1 7.6 7.6M16.4 16.4l2.5 2.5M18.9 5.1 16.4 7.6M7.6 16.4l-2.5 2.5"/><circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/></svg></div><div class="prof-stat-val">' +
    s.sixes +
    '</div><div class="prof-stat-lbl">Sixes</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21.8c4 0 7.2-3 7.2-7 0-3.9-3.4-5.8-3.4-9.6-4.4 1-6.8 4.4-6.8 7.4 0 1.1.3 2.2.8 3.1-1.4-.7-2.6-1.8-2.6-3.7-2.2 1.4-2.7 4.3-2.7 6 0 2.2 1.9 3.8 4 3.8z"/></svg></div><div class="prof-stat-val">' +
    s.fours +
    '</div><div class="prof-stat-lbl">Fours</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9.5h12M6 14.5h12"/></svg></div><div class="prof-stat-val">' +
    s.batAvg +
    '</div><div class="prof-stat-lbl">Batting Avg</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2.2"/></svg></div><div class="prof-stat-val">' +
    s.oversFaced +
    '</div><div class="prof-stat-lbl">Overs Faced</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/></svg></div><div class="prof-stat-val">' +
    s.dotPct + "%" +
    '</div><div class="prof-stat-lbl">Dot Ball %</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8.5" width="16" height="7" rx="2"/></svg></div><div class="prof-stat-val">' +
    s.boundaryPct + "%" +
    '</div><div class="prof-stat-lbl">Boundary %</div></div>' +
    "</div>" +
    // Bowling stats (hidden)
    '<div class="prof-stats-grid" id="profStatsBowling" style="display:none">' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0"/></svg></div><div class="prof-stat-val">' +
    s.wicketsTaken +
    '</div><div class="prof-stat-lbl">Wickets</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20h14"/><path d="M8.2 17v-4.6M12 17V8.2M15.8 17v-6.4"/></svg></div><div class="prof-stat-val">' +
    s.bowlingAvg +
    '</div><div class="prof-stat-lbl">Bowling Avg</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.6" opacity=".55"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg></div><div class="prof-stat-val">' +
    s.dots +
    '</div><div class="prof-stat-lbl">Dot Balls</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9z" fill="currentColor"/></svg></div><div class="prof-stat-val">' +
    s.ballsBowled +
    '</div><div class="prof-stat-lbl">Balls Bowled</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18h16M7.5 15V9M12 15V5M16.5 15v-7"/></svg></div><div class="prof-stat-val">' +
    s.economy +
    '</div><div class="prof-stat-lbl">Economy</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2.2"/></svg></div><div class="prof-stat-val">' +
    s.oversBowled +
    '</div><div class="prof-stat-lbl">Overs Bowled</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 5v11M12 5v11M15.5 5v11M7 5h10"/></svg></div><div class="prof-stat-val">' +
    (s.bestBowlWkts || 0) + "W" +
    '</div><div class="prof-stat-lbl">Best Bowling</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5v9M8.5 10L12 13.5 15.5 10M5 19h14"/></svg></div><div class="prof-stat-val">' +
    s.runsConceded +
    '</div><div class="prof-stat-lbl">Runs Conceded</div></div>' +
    "</div>";
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

