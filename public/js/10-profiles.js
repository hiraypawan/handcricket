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
  migrateLegacyStats(n);
}

/* ---- CAREER STATS ARE PER-USERNAME -------------------------------------
   v2.8: the blob used to live at one global key ("hc_stats"), so renaming
   yourself inherited someone else's career and two players on one device
   shared a single record. Keys are now "hc_stats:<username>"; the legacy
   global blob is migrated onto the first username that claims it. */
function statsKey(name) {
  const u = String(name || getUsername() || "").trim().toLowerCase();
  return u ? "hc_stats:" + u : "hc_stats";
}
function migrateLegacyStats(name) {
  try {
    const legacy = localStorage.getItem("hc_stats");
    if (!legacy || !name) return;
    const key = statsKey(name);
    if (!localStorage.getItem(key)) localStorage.setItem(key, legacy);
  } catch (e) {}
}

function getRank(s) {
  if (!s || typeof s !== "object") return "Newcomer";
  const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const sr = n(s.ballsFaced) ? (n(s.runs) / n(s.ballsFaced)) * 100 : 0;
  const pts =
    n(s.wins) * 10 + n(s.sixes) * 2 + n(s.fours) + n(s.highestScore) * 0.5 + sr * 0.1;
  if (pts >= 500) return "Legendary";
  if (pts >= 300) return "Master";
  if (pts >= 150) return "Champion";
  if (pts >= 80) return "Pro";
  if (pts >= 30) return "Rising Star";
  return "Newcomer";
}

/* Every displayed number is derived in ONE place so a saved record can never
   show a stale value (winPct used to be written with a "%" and read without). */
function deriveStats(s) {
  const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  s.matches = n(s.matches);
  if (s.wins > s.matches) s.wins = s.matches;
  if (s.losses > s.matches) s.losses = s.matches;
  s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) : "0";
  s.strikeRate = n(s.ballsFaced) ? ((n(s.runs) / n(s.ballsFaced)) * 100).toFixed(1) : "0.0";
  s.bowlingAvg = n(s.wicketsTaken) ? (n(s.runsConceded) / n(s.wicketsTaken)).toFixed(1) : "-";
  s.economy = n(s.ballsBowled) ? (n(s.runsConceded) / (n(s.ballsBowled) / 6)).toFixed(2) : "-";
  s.dotPct = n(s.ballsFaced) ? Math.round((n(s.dots) / n(s.ballsFaced)) * 100) : 0;
  s.bowlDotPct = n(s.ballsBowled) ? Math.round((n(s.dotsBowled) / n(s.ballsBowled)) * 100) : 0;
  s.boundaryPct = n(s.ballsFaced)
    ? Math.round(((n(s.fours) + n(s.sixes)) / n(s.ballsFaced)) * 100)
    : 0;
  // not out yet -> no average, never "0.0"
  s.batAvg = n(s.outs) ? (n(s.runs) / n(s.outs)).toFixed(1) : n(s.runs) ? n(s.runs).toFixed(1) : "-";
  s.oversBowled = Math.floor(n(s.ballsBowled) / 6) + "." + (n(s.ballsBowled) % 6);
  s.oversFaced = Math.floor(n(s.ballsFaced) / 6) + "." + (n(s.ballsFaced) % 6);
  return s;
}

function loadStats(name) {
  try {
    const raw =
      localStorage.getItem(statsKey(name)) ||
      (name ? null : localStorage.getItem("hc_stats"));
    const s = deriveStats(Object.assign(defaultStats(), raw ? JSON.parse(raw) : {}));
    return s;
  } catch (e) {
    return deriveStats(defaultStats());
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
    dotsBowled: 0,
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
    bestBowlRuns: 0,
  };
}
function saveStats(s, name) {
  try {
    localStorage.setItem(statsKey(name), JSON.stringify(s));
    // keep the legacy key in step so an older cached tab still reads something
    if (!name) localStorage.setItem("hc_stats", JSON.stringify(s));
  } catch (e) {}
}

/* Stable player id: derived from the name and cached, so the profile shows the
   SAME id on every render (it used to be re-randomised on each open). */
function getPlayerId(name) {
  const who = String(name || getUsername() || "").trim();
  if (!who) return "HC-000000";
  try {
    const mapKey = "hcp_pid";
    const map = JSON.parse(localStorage.getItem(mapKey) || "{}");
    const k = who.toLowerCase();
    if (map[k]) return map[k];
    let h = 2166136261;
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const id = "HC-" + (Math.abs(h) % 1000000).toString().padStart(6, "0");
    map[k] = id;
    localStorage.setItem(mapKey, JSON.stringify(map));
    return id;
  } catch (e) {
    return "HC-000000";
  }
}

/* Device ownership token. Generated once, kept in localStorage, and sent with
   every mutating API call. The server records the first token that claims a
   name and rejects the rest, so nobody can inflate someone else's career or
   delete their friendships. Not a login — just enough to stop drive-by writes.
   See lib/api/shared.js for the server side. */
function getClientToken() {
  try {
    let t = localStorage.getItem("hcp_token");
    if (t && /^[A-Za-z0-9]{16,64}$/.test(t)) return t;
    const buf = new Uint8Array(24);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf);
    else for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
    t = Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 40);
    localStorage.setItem("hcp_token", t);
    return t;
  } catch (e) {
    return "hcptoken" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }
}
window.getClientToken = getClientToken;

/* Publish my career so friends' lists and the profile endpoint show real
   numbers instead of the snapshot taken when the request was sent. */
function publishProfile() {
  try {
    const user = getUsername();
    if (!user) return;
    let idToken = "";
    try {
      idToken =
        typeof hcGoogleToken === "function" ? hcGoogleToken() : "";
    } catch (e) {}
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        stats: loadStats(),
        token: getClientToken(),
        idToken: idToken || undefined,
      }),
    })
      .then((r) => {
        /* 403 = this name is already claimed by another device. Say so once
           instead of silently dropping every future save. */
        if (r.status === 403 && !window.__profileClaimWarned) {
          window.__profileClaimWarned = true;
          if (typeof toast === "function") {
            toast(
              "\"" + user + "\" is already claimed on another device. Your stats stay saved here.",
              "warn",
            );
          }
        }
      })
      .catch(() => {});
  } catch (e) {}
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
  /* BATTING dismissals come from MY wickets. This used to add the wickets I
     TOOK (result.oppWickets), so Batting Avg was runs / wickets-taken. */
  s.outs = (s.outs || 0) + (result.myWickets || 0);
  /* BOWLING: wickets, balls, runs conceded and dots bowled all come from the
     innings the OPPONENT batted (opp.hist). Dots bowled were never tracked, so
     the bowling tab was showing my batting dots. */
  s.wicketsTaken += result.oppWickets;
  s.ballsBowled += result.oppBalls;
  s.runsConceded += result.oppRuns;
  s.dotsBowled =
    (s.dotsBowled || 0) +
    (result.oppHist ? result.oppHist.filter((h) => h === "DOT").length : 0);
  if ((result.oppWickets || 0) > (s.bestBowlWkts || 0)) {
    s.bestBowlWkts = result.oppWickets || 0;
    s.bestBowlRuns = result.oppRuns || 0;
  }
  if (result.myHatTrick) s.hatricks++;
  deriveStats(s);
  saveStats(s);
  publishProfile();
}

function escHtml(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function showProfile(name, stats, meta) {
  const s = deriveStats(Object.assign(defaultStats(), stats || loadStats()));
  const card = $("profileCard");
  const rank = getRank(s);
  // C12: viewing an OPPONENT'S profile must show the OPPONENT's name, not ours.
  // v2.8: on online matches the name arrives over the wire, so it is escaped
  // before it is interpolated into innerHTML.
  /* My Profile must show MY username — never the engine placeholder ("YOU",
     "Player") that G.myName carries mid-match. Explicit names (opponents)
     still win. */
  const stored =
    typeof getUsername === "function" ? getUsername() || "" : "";
  const rawName =
    name ||
    (stored || "") ||
    (G.myName && G.myName !== "YOU" && G.myName !== "Player"
      ? G.myName
      : "") ||
    "Player";
  const displayName = escHtml(rawName);
  const city = meta && meta.city ? escHtml(meta.city) : "";
  $("profileTitle").textContent = name ? rawName + "'s Profile" : "My Profile";
  card.innerHTML =
    // Header strip
    '<div class="prof-header">' +
    (name ? "OPPONENT PROFILE" : "MY PROFILE") +
    "</div>" +
    // Avatar + name row
    '<div class="prof-row">' + (typeof avatarHtml === "function" ? avatarHtml(rawName || "?", 46, "prof-avatar") : '<div class="prof-avatar av-initials">' + escHtml((rawName || "?").trim().charAt(0).toUpperCase()) + "</div>") + '<div class="prof-info"><div class="prof-name">' +
    displayName +
    '</div><div class="prof-id">' +
    getPlayerId(rawName) +
    (city ? '<span class="prof-city">' + city + "</span>" : "") +
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
    (s.dotsBowled || 0) +
    '</div><div class="prof-stat-lbl">Dots Bowled</div></div>' +
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
    (s.bestBowlWkts ? s.bestBowlWkts + "/" + (s.bestBowlRuns || 0) : "-") +
    '</div><div class="prof-stat-lbl">Best Bowling</div></div>' +
    '<div class="prof-stat-card"><div class="prof-stat-icon"><svg class="ic-stat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5v9M8.5 10L12 13.5 15.5 10M5 19h14"/></svg></div><div class="prof-stat-val">' +
    s.runsConceded +
    '</div><div class="prof-stat-lbl">Runs Conceded</div></div>' +
    "</div>";

  /* v2.9: retention + rivalry. My own card shows the daily streak; an
     opponent's card shows the head-to-head record for this pairing. Both come
     from 23-features.js and both feature-detect so a stale bundle can't break
     the sheet. */
  try {
    const mine = !name || (typeof getUsername === "function" && String(name).toLowerCase() === String(getUsername()).toLowerCase());
    if (mine) {
      if (typeof hcStreakCardHtml === "function") card.insertAdjacentHTML("beforeend", hcStreakCardHtml());
    } else if (typeof hcH2HHtml === "function" && typeof getUsername === "function") {
      card.insertAdjacentHTML("beforeend", hcH2HHtml(getUsername(), rawName));
    }
  } catch (e) {}

  // v2.8: these two sheets used to be able to sit open at the same time with
  // z-index:auto, so stacking depended on DOM order. Open one, close the other.
  const fr = $("friendsOverlay");
  if (fr) fr.classList.add("hidden");
  $("profileOverlay").classList.remove("hidden");
  try {
    if (typeof renderGoogleButtons === "function") renderGoogleButtons();
  } catch (e) {}
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
$("btnLeaderboard").onclick = () => {
  sfx("tap");
  showLeaderboard();
};
$("btnCloseLb").onclick = () => {
  sfx("tap");
  $("leaderboardOverlay").classList.add("hidden");
  showMenu();
};
function showOppProfile() {
  if (!G.oppStats) {
    return;
  }
  showProfile(G.oppName, G.oppStats, G.botProfile || null);
}

/* ================================================================
   v3: ROLE SYSTEM + STORY MODE + CLOUD SAVE + UI REFRESH
   ================================================================ */

// ---- ROLE SYSTEM ----
// Player roles: battingStyle = 'aggressive'|'defensive'|'balanced'
//               bowlingStyle = 'aggressive'|'defensive'|'balanced'
// Batting restricts YOUR gesture picks. Bowling restricts YOUR picks when bowling.
// Bowling role is HIDDEN from opponent until wicket or over ends.


/* ============================================================================
   v2.8 LEADERBOARD + OTHER-PLAYER PROFILES
   The board is built from `profile:*` in KV, which only real players write
   (publishProfile runs from updateStatsAfterMatch; personas are generated in
   memory and never persisted), so bots cannot appear on it.
============================================================================ */
async function showLeaderboard(forceRefresh) {
  const ov = $("leaderboardOverlay");
  const list = $("lbList");
  if (!ov || !list) return;
  /* The leaderboard reads a maintained index, so a friend who just won a match
     is not there until their next publish. An explicit refresh beats making the
     player guess whether the numbers are stale. */
  const rb = $("btnLbRefresh");
  if (rb && !rb.__wired) {
    rb.__wired = true;
    rb.onclick = async () => {
      rb.classList.add("busy");
      rb.disabled = true;
      await showLeaderboard(true);
      rb.classList.remove("busy");
      rb.disabled = false;
    };
  }
  document.querySelectorAll(".overlay,.friends-overlay").forEach((o) => o.classList.add("hidden"));
  ov.classList.remove("hidden");
  list.innerHTML = '<div class="lb-empty">Loading...</div>';
  /* Local fallback: a solo player (or a device that cannot reach the API)
     must still see their own career on this board. */
  const localName = getUsername() || "YOU";
  const local = (typeof loadStats === "function" && loadStats()) || { matches: 0 };
  const hasLocal = (local.matches || 0) > 0;
  const localRowHTML = (note) =>
    '<div class="lb-row me"><span class="lb-rank">–</span>' +
    (typeof avatarHtml === "function" ? avatarHtml(localName, 30, "lb-avatar") : "") +
    '<span class="lb-name">' +
    escHtml(localName) +
    '<span class="lb-you">YOU</span></span>' +
    '<span class="lb-wins">' +
    (local.wins || 0) +
    "<small>wins</small></span>" +
    '<span class="lb-meta">' +
    (local.matches || 0) +
    "M · " +
    (local.winPct || 0) +
    "%</span></div>" +
    (note ? '<div class="lb-mine">' + note + "</div>" : "");
  let data = null;
  let fetchFailed = false;
  try {
    const r = await fetch(
      "/api/leaderboard?limit=20&me=" + encodeURIComponent(getUsername() || "") +
        (forceRefresh ? "&refresh=1" : ""),
      /* The board must reflect the match that just ended — never serve it
         from the browser HTTP cache. */
      { cache: "no-store" },
    );
    if (r.ok) data = await r.json();
    else fetchFailed = true;
  } catch (e) {
    fetchFailed = true;
  }
  const leaders = data && Array.isArray(data.leaders) ? data.leaders : [];
  if (!leaders.length) {
    if (hasLocal) {
      list.innerHTML = localRowHTML(
        fetchFailed
          ? "Couldn't reach the server — showing this device's career."
          : "Your career is on this device — it appears here after it syncs.",
      );
      return;
    }
    list.innerHTML =
      '<div class="lb-empty">' +
      (fetchFailed ? "Couldn't load the leaderboard.<br>Check your connection and tap Refresh." : "No ranked players yet.<br>Finish a match to publish your career.") +
      "</div>";
    return;
  }
  /* Server board exists but I am missing from it while this device has a
     career (publish blocked or not yet synced) — append my local row. */
  const meLower = (getUsername() || "").toLowerCase();
  const onBoard =
    leaders.some((p) => String(p.name || "").toLowerCase() === meLower) ||
    (data.me && data.me.rank);
  const tail =
    !onBoard && hasLocal
      ? localRowHTML("Your device career — it joins the board once it syncs.")
      : data.me && data.me.rank > leaders.length
        ? '<div class="lb-mine">Your rank: <b>#' + data.me.rank + "</b> — " + data.me.wins + " wins from " + data.me.matches + " matches</div>"
        : "";
  list.innerHTML =
    leaders
      .map((p, i) => {
        const medal = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        const isMe = p.name.toLowerCase() === (getUsername() || "").toLowerCase();
        return (
          '<button class="lb-row' + (medal ? " " + medal : "") + (isMe ? " me" : "") +
          '" onclick="showUserProfile(\'' +
          String(p.name).replace(/\\/g, "\\\\").replace(/'/g, "\\'") +
          '\')">' +
          '<span class="lb-rank">' + (i + 1) + "</span>" +
          (typeof avatarHtml === "function" ? avatarHtml(p.name, 30, "lb-avatar") : "") +
          '<span class="lb-name">' + escHtml(p.name) + (isMe ? '<span class="lb-you">YOU</span>' : "") + "</span>" +
          '<span class="lb-wins">' + p.wins + '<small>wins</small></span>' +
          '<span class="lb-meta">' + p.matches + "M · " + p.winPct + "%</span>" +
          "</button>"
        );
      })
      .join("") + tail;
}

/* Open ANY player's profile with their LIVE stats (friend list, leaderboard).
   Falls back to whatever snapshot the caller already had. */
async function showUserProfile(name, fallbackStats) {
  if (!name) return;
  let stats = fallbackStats || null;
  try {
    const r = await fetch("/api/profile?user=" + encodeURIComponent(name));
    if (r.ok) {
      const j = await r.json();
      if (j && j.profile && j.profile.stats) stats = j.profile.stats;
    }
  } catch (e) {}
  if (!stats) {
    /* Bots never publish, so the server can never have them — fall back to
       the list snapshot, then a progressive generated career for bots. */
    try {
      const key = String(name || "").toLowerCase();
      if (window.__friendStats && window.__friendStats[key]) {
        stats = window.__friendStats[key];
      } else if (
        window.__friendIsBot &&
        window.__friendIsBot[key] &&
        typeof botCareerFor === "function"
      ) {
        stats = botCareerFor(name);
      }
    } catch (e) {}
  }
  if (!stats) {
    toast("No public career for " + name + " yet", "warn");
    return;
  }
  showProfile(name, stats, null);
}
