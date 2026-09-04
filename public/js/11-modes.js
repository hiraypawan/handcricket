/* ============================================================================
 FILE: public/js/11-modes.js
 ROLE: HOME MODE ENTRY — ensureUsername() gate + Offline/Online/Instant/Story mode button wiring, bot pre-match stat card (Ultra Bot), btnProfile. Depends on: offline (13)/online (14)/instant (18)/story (16) entry functions at call-time.
============================================================================ */

function ensureUsername(cb) {
  const u = getUsername();
  if (u) {
    G.myName = u;
    cb();
    return;
  }
  $("usernameOverlay").classList.remove("hidden");
  $("usernameInput").value = "";
  $("usernameInput").focus();
  if (!window._pendingCbs) window._pendingCbs = [];
  window._pendingCbs.push(cb);
}
$("btnSaveUsername").onclick = () => {
  sfx("tap");
  const v = $("usernameInput").value.trim();
  if (!v) {
    $("usernameInput").focus();
    return;
  }
  setUsername(v);
  $("usernameOverlay").classList.add("hidden");
  updHomeUsername();
  if (window._pendingCbs && window._pendingCbs.length) {
    window._pendingCbs.forEach((cb) => {
      try {
        cb();
      } catch (e) {}
    });
    window._pendingCbs = [];
  }
};
$("usernameInput").onkeydown = (e) => {
  if (e.key === "Enter") $("btnSaveUsername").click();
};
$("btnEditName").onclick = () => {
  sfx("tap");
  $("usernameOverlay").classList.remove("hidden");
  $("usernameInput").value = getUsername();
  $("usernameInput").focus();
  window._pendingCbs = null;
};
function updHomeUsername() {
  const u = getUsername();
  if (u) {
    $("homeUsername").style.display = "flex";
    $("homeUsernameText").textContent = u;
  } else {
    $("homeUsername").style.display = "none";
  }
  updHomeTrophies();
  updHomeCareer();
}
// C13: home strip now shows REAL career stats (rank / wins / best score).
function updHomeCareer() {
  try {
    const s = loadStats() || defaultStats();
    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = v;
    };
    set("homeRankVal", getRank(s));
    set("homeWinsVal", s.wins);
    set("homeBestVal", s.highestScore);
  } catch (e) {}
}
function updHomeTrophies() {
  var sp = storyProgress;
  var el = $("homeTrophyShelf");
  if (!sp || !sp.completedTiers || sp.completedTiers.length === 0) {
    el.style.display = "none";
    return;
  }
  var tierColors = ["#c98d5b", "#cdd6e4", "#fbbf24", "#7ef0dd", "#fb923c", "#38bdf8", "#a78bfa", "#fde68a"];
  var names = [
    "Gully",
    "Area",
    "Village",
    "City",
    "District",
    "State",
    "National Q",
    "National",
  ];
  el.style.display = "flex";
  el.style.gap = "4px";
  el.style.justifyContent = "center";
  el.style.flexWrap = "wrap";
  el.innerHTML =
    '<span style="font-size:9px;opacity:.5;width:100%;text-align:center">Trophies</span>';
  for (var i = 0; i < 8; i++) {
    var earned = sp.completedTiers.indexOf(i) >= 0;
    var d = document.createElement("div");
    d.style.cssText =
      "width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;background:" +
      (earned ? "rgba(245,158,11,.15)" : "rgba(255,255,255,.04)") +
      ";border:1px solid " +
      (earned ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.08)");
    d.innerHTML = earned
        ? '<svg class="tier-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:' +
          tierColors[i] +
          '"><circle cx="12" cy="14.6" r="5.8"/><path d="M7.9 10.9 5.6 3l4.4 2.6L12 3l2 2.6 4.4-2.6-2.3 7.9"/></svg>'
        : '<svg class="tier-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:#5b6b81"><rect x="5.6" y="11" width="12.8" height="9.4" rx="2.2"/><path d="M8.7 11V8.3a3.3 3.3 0 0 1 6.6 0V11"/><circle cx="12" cy="15.5" r="1.15" fill="currentColor" stroke="none"/></svg>';
    d.title = names[i];
    el.appendChild(d);
  }
}

$("modeOffline").onclick = () => {
  ensureAudio();
  sfx("tap");
  haptic();
  ensureUsername(() => {
    G.mode = "offline";
    const bMatches = Math.floor(Math.random() * 80) + 20;
    const bWins = Math.min(Math.floor(Math.random() * 45) + 10, bMatches);
    G.oppStats = {
      name: "Ultra Bot",
      matches: bMatches,
      wins: bWins,
      losses: Math.max(0, bMatches - bWins - Math.floor(Math.random() * 5)),
      ties: Math.floor(Math.random() * 5),
      runs: Math.floor(Math.random() * 800) + 100,
      ballsFaced: Math.floor(Math.random() * 600) + 80,
      sixes: Math.floor(Math.random() * 50) + 5,
      fours: Math.floor(Math.random() * 70) + 10,
      dots: Math.floor(Math.random() * 150) + 20,
      highestScore: Math.floor(Math.random() * 100) + 15,
      wicketsTaken: Math.floor(Math.random() * 60) + 8,
      ballsBowled: Math.floor(Math.random() * 500) + 50,
      runsConceded: Math.floor(Math.random() * 600) + 60,
      hatricks: Math.floor(Math.random() * 5),
      winStreak: 0,
      bestWinStreak: Math.floor(Math.random() * 12) + 2,
      streak: 0,
    };
    const s = G.oppStats;
    s.winPct = s.matches ? ((s.wins / s.matches) * 100).toFixed(0) + "%" : "0%";
    s.strikeRate = s.ballsFaced
      ? ((s.runs / s.ballsFaced) * 100).toFixed(1)
      : "0.0";
    s.bowlingAvg = s.wicketsTaken
      ? (s.runsConceded / s.wicketsTaken).toFixed(1)
      : "-";
    const sb = $("offlineBotStats");
    sb.style.display = "block";
    sb.innerHTML =
      '<div class="pre-stats-box"><div class="pre-stats-title">Ultra Bot <span class="pre-rank">' +
      getRank(s) +
      "</span></div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Career</div>' +
      '<div class="pre-stat-row"><span>Matches</span><b>' +
      s.matches +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Wins</span><b>' +
      s.wins +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Win Rate</span><b>' +
      s.winPct +
      "</b></div>" +
      "</div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Batting</div>' +
      '<div class="pre-stat-row"><span>Runs</span><b>' +
      s.runs +
      "</b></div>" +
      '<div class="pre-stat-row"><span>SR</span><b>' +
      s.strikeRate +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Sixes</span><b>' +
      s.sixes +
      "</b></div>" +
      "</div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Bowling</div>' +
      '<div class="pre-stat-row"><span>Wkts</span><b>' +
      s.wicketsTaken +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Avg</span><b>' +
      s.bowlingAvg +
      "</b></div>" +
      "</div></div>";
    $("menuOverlay").classList.add("hidden");
    $("offlineSetup").classList.remove("hidden");
    resetOffline();
  });
};
$("modeOnline").onclick = () => {
  ensureAudio();
  sfx("tap");
  haptic();
  ensureUsername(() => {
    G.mode = "online";
    // C5: entering a casual/online mode leaves story career behind.
    G.storyDifficulty = 0;
    G.storyMatch = false;
    $("menuOverlay").classList.add("hidden");
    $("onlineLobby").classList.remove("hidden");
    $("nameInput").value = getUsername();
    const rid = new URLSearchParams(location.search).get("room");
    if (rid) {
      $("btnJoin").style.display = "block";
      $("btnCreate").style.display = "none";
      $("hostFormat").style.display = "none";
      $("joinerNote").style.display = "block";
    } else {
      $("btnCreate").style.display = "block";
      $("btnJoin").style.display = "none";
      $("hostFormat").style.display = "block";
      $("joinerNote").style.display = "none";
    }
  });
};
$("modeInstant").onclick = () => {
  ensureAudio();
  sfx("tap");
  haptic();
  ensureUsername(() => {
    G.mode = "offline";
    $("menuOverlay").classList.add("hidden");
    $("matchmakingOverlay").classList.remove("hidden");
    startMatchmaking();
  });
};
$("btnProfile").onclick = () => {
  sfx("tap");
  showProfile();
};
