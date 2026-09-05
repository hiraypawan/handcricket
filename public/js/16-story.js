/* ============================================================================
 FILE: public/js/16-story.js
 ROLE: STORY CAREER MODE — storyLang/storyProgress, renderStoryHome, startStoryMatch, toss dialogue, trophy/tier flow, team builder, cloud save/load bridge. Depends on: engine (09), roles (15), STORY_DATA.
============================================================================ */

let storyLang = "en";
let storyProgress = null; // { user, currentTier, currentMatch, myTeam, completedTiers, trophies, stats }

function defaultStoryProgress() {
  return {
    user: getUsername() || "player",
    language: "en",
    currentTier: 0,
    currentMatch: 0,
    myTeam: null,
    completedTiers: [],
    trophies: [],
    matchResults: [],
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      totalRuns: 0,
      totalWickets: 0,
    },
  };
}

const STORY_TIER_COLORS = ["#c98d5b","#cdd6e4","#fbbf24","#7ef0dd","#fb923c","#38bdf8","#a78bfa","#fde68a"];
function getStoryTrophyIcon(tierIdx) {
  const i = Math.min(Math.max(tierIdx, 0), 7);
  const c = STORY_TIER_COLORS[i];
  return (
    '<svg class="tier-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:' +
    c +
    '"><circle cx="12" cy="14.6" r="5.8"/><path d="M7.9 10.9 5.6 3l4.4 2.6L12 3l2 2.6 4.4-2.6-2.3 7.9"/></svg>'
  );
}

function renderStoryHome() {
  if (!storyProgress) storyProgress = defaultStoryProgress();
  if (!storyProgress.completedTiers) storyProgress.completedTiers = [];
  if (!storyProgress.matchResults) storyProgress.matchResults = [];
  if (!storyProgress.trophies) storyProgress.trophies = [];
  if (!storyProgress.stats)
    storyProgress.stats = {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      totalRuns: 0,
      totalWickets: 0,
    };
  const sp = storyProgress;

  // Trophy shelf
  const shelf = $("storyTrophyShelf");
  shelf.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const t = document.createElement("div");
    t.className =
      "story-trophy" + (sp.completedTiers.includes(i) ? " earned" : "");
    t.innerHTML = sp.completedTiers.includes(i)
      ? getStoryTrophyIcon(i)
      : '<svg class="tier-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.6" y="11" width="12.8" height="9.4" rx="2.2"/><path d="M8.7 11V8.3a3.3 3.3 0 0 1 6.6 0V11"/><circle cx="12" cy="15.5" r="1.15" fill="currentColor" stroke="none"/></svg>';
    t.title = STORY_DATA.tiers[i] ? STORY_DATA.tiers[i].name[storyLang] : "";
    shelf.appendChild(t);
  }

  // Progress
  const totalMatches = STORY_DATA.tiers.reduce(
    (s, t) => s + t.matches.length,
    0,
  );
  const doneMatches = sp.matchResults ? sp.matchResults.length : 0;
  const pct = Math.round((doneMatches / totalMatches) * 100);
  $("storyProgressFill").style.width = pct + "%";
  $("storyProgressText").textContent =
    doneMatches + " / " + totalMatches + " matches";

  // Tier list
  const list = $("storyTierList");
  list.innerHTML = "";
  STORY_DATA.tiers.forEach((tier, ti) => {
    const card = document.createElement("div");
    const isCompleted = sp.completedTiers.includes(ti);
    const isCurrent = ti === sp.currentTier && !isCompleted;
    const isLocked =
      ti > sp.currentTier || (ti === sp.currentTier && isCompleted);
    card.className =
      "story-tier-card" +
      (isCurrent ? " current" : "") +
      (isCompleted ? " completed" : "") +
      (isLocked && !isCurrent ? " locked" : "");

    const matchDots = tier.matches
      .map((m, mi) => {
        const resultIdx = sp.matchResults
          ? sp.matchResults.findIndex((r) => r.tier === ti && r.match === mi)
          : -1;
        const result = resultIdx >= 0 ? sp.matchResults[resultIdx] : null;
        let cls = "dot";
        if (result) cls += result.won ? " won" : " lost";
        else if (isCurrent && mi === sp.currentMatch) cls += " current";
        return '<span class="' + cls + '"></span>';
      })
      .join("");

    card.innerHTML =
      '<div class="tier-header">' +
      '<div class="tier-name">' +
      tier.name[storyLang] +
      "</div>" +
      '<div class="tier-badge ' +
      (isCompleted ? "done" : isCurrent ? "active" : "lock") +
      '">' +
      (isCompleted ? "Done" : isCurrent ? "Playing" : "Locked") +
      "</div></div>" +
      '<div class="tier-sub">' +
      tier.subtitle[storyLang] +
      "</div>" +
      '<div class="tier-matches">' +
      matchDots +
      "</div>";

    if (isCurrent && !isCompleted) {
      card.onclick = () => {
        sfx("tap");
        startStoryMatch();
      };
    }
    list.appendChild(card);
  });
}

function startStoryMatch() {
  if (!storyProgress || !storyProgress.myTeam) {
    showStoryTeamBuilder();
    return;
  }
  const tier = STORY_DATA.tiers[storyProgress.currentTier];
  if (!tier) {
    showStoryComplete();
    return;
  }
  const match = tier.matches[storyProgress.currentMatch];
  if (!match) {
    showStoryTierComplete();
    return;
  }

  // Show pre-match narrative
  showStoryDialogue(
    match.narrative.pre[storyLang] || match.narrative.pre.en,
    () => {
      // Hide story home so role overlay is visible
      $("storyHome").classList.add("hidden");
      // Set up the match
      G.mode = "offline";
      G.teamSize = 11;
      G.totalBalls = 120;
      G.totalWkts = 10;
      G.isBot = true;
      G.oppName = match.oppName;
      G.isHost = true;

      // Set up opponent team
      G.oppPlayers = match.oppPlayers.map((p) => ({
        name: p.name,
        role: p.role,
        battingStyle: p.battingStyle || "balanced",
        bowlingStyle: p.bowlingStyle || "balanced",
      }));

      // Set up my team from story progress
      G.myPlayers = storyProgress.myTeam.players.map((p) => ({
        name: p.name,
        role: p.role,
        battingStyle: p.battingStyle || "balanced",
        bowlingStyle: p.bowlingStyle || "balanced",
        _realBattingStyle: p.battingStyle,
        _realBowlingStyle: p.bowlingStyle,
      }));

      G.myName = storyProgress.myTeam.name;
      G.oppStats = genStoryBotStats(tier.difficulty, match.oppName);

      updAllNames();

      // Show role assignment
      showRoleAssign(G.myPlayers, "story", (players) => {
        G.myPlayers = players;
        // Start toss
        showStoryToss();
      });
    },
  );
}

function genStoryBotStats(difficulty, name) {
  const base = Math.floor(20 + difficulty * 60);
  const wins = Math.floor(base * (0.3 + difficulty * 0.4));
  const m = {
    name: name,
    matches: base,
    wins: wins,
    losses: base - wins - Math.floor(Math.random() * 3),
    ties: Math.floor(Math.random() * 3),
    runs: Math.floor(base * (15 + Math.random() * 25)),
    ballsFaced: Math.floor(base * (10 + Math.random() * 15)),
    sixes: Math.floor(Math.random() * base * 0.3),
    fours: Math.floor(Math.random() * base * 0.5),
    dots: Math.floor(Math.random() * base * 0.2),
    highestScore: Math.floor(base * 0.8 + Math.random() * 30),
    wicketsTaken: Math.floor(base * (0.2 + Math.random() * 0.3)),
    ballsBowled: Math.floor(base * (8 + Math.random() * 10)),
    runsConceded: Math.floor(base * (10 + Math.random() * 20)),
    hatricks: Math.floor(Math.random() * 3),
    winStreak: 0,
    bestWinStreak: Math.floor(Math.random() * 10) + 2,
    streak: 0,
  };
  m.winPct = m.matches ? ((m.wins / m.matches) * 100).toFixed(0) + "%" : "0%";
  m.strikeRate = m.ballsFaced
    ? ((m.runs / m.ballsFaced) * 100).toFixed(1)
    : "0.0";
  m.bowlingAvg = m.wicketsTaken
    ? (m.runsConceded / m.wicketsTaken).toFixed(1)
    : "-";
  return m;
}

function showStoryToss() {
  const won = Math.random() < 0.5;
  if (won) {
    showStoryDialogue(
      storyLang === "hi"
        ? "Toss jeet gaye! Kya karoge?"
        : "You won the toss! What will you do?",
      () => {
        const choice = Math.random() < 0.5;
        G.iBat = choice;
        showStoryDialogue(
          storyLang === "hi"
            ? choice
              ? "Pehle batting karenge!"
              : "Pehle bowling karenge!"
            : choice
              ? "You chose to bat first!"
              : "You chose to bowl first!",
          () => {
            startStoryMatchPlay();
          },
        );
      },
    );
  } else {
    G.iBat = Math.random() < 0.5;
    showStoryDialogue(
      storyLang === "hi"
        ? G.iBat
          ? "Toss haare, wo batting choose karte hain."
          : "Toss haare, wo bowling choose karte hain."
        : G.iBat
          ? "Lost the toss. They chose to bat."
          : "Lost the toss. They chose to bowl.",
      () => {
        startStoryMatchPlay();
      },
    );
  }
}

function startStoryMatchPlay() {
  if (typeof storyProgress !== "undefined" && storyProgress) {
    var tier = STORY_DATA.tiers[storyProgress.currentTier];
    G.storyDifficulty = tier ? tier.difficulty : 0;
    BotAI.difficulty = G.storyDifficulty;
  }
  // C6: mark this match as a story-career match so finishMatch only records
  // career results for real story games (never for casual offline matches).
  G.storyMatch = true;
  BotAI.reset();
  $("menuOverlay").classList.add("hidden");
  $("offlineSetup").classList.add("hidden");
  $("storyHome").classList.add("hidden");
  updScore();
  renderBalls();
  updFH();
  showLeave(true);
  startInnings(1);
}

function showStoryDialogue(text, callback) {
  const dlg = $("storyDialogue");
  const lines = text.split("\n");
  let speaker = "";
  let content = text;
  if (lines.length > 1 && lines[0].includes(":")) {
    const firstLine = lines[0];
    const colonIdx = firstLine.indexOf(":");
    speaker = firstLine.substring(0, colonIdx).trim();
    content =
      lines.slice(1).join("\n").trim() ||
      firstLine.substring(colonIdx + 1).trim();
  } else if (text.includes(":")) {
    const colonIdx = text.indexOf(":");
    speaker = text.substring(0, colonIdx).trim();
    content = text.substring(colonIdx + 1).trim();
  }
  if (!speaker || speaker === "Narrator") {
    const oppTeam =
      storyProgress && storyProgress.currentTier !== undefined
        ? STORY_DATA.tiers[storyProgress.currentTier]
          ? STORY_DATA.tiers[storyProgress.currentTier].matches[
              storyProgress.currentMatch
            ]?.oppName ||
            G.oppName ||
            "Opponent"
          : G.oppName || "Opponent"
        : G.oppName || "Opponent";
    speaker = oppTeam;
  }
  $("dlgSpeaker").textContent = speaker;
  $("dlgText").textContent = content;
  dlg.classList.remove("hidden");
  const btn = $("dlgBtn");
  btn.onclick = null;
  btn.onclick = () => {
    sfx("tap");
    dlg.classList.add("hidden");
    if (callback) callback();
  };
}

function showStoryRoast(tierIdx, matchIdx, callback) {
  const tier = STORY_DATA.tiers[tierIdx];
  if (!tier) {
    if (callback) callback();
    return;
  }
  const match = tier.matches[matchIdx];
  if (!match) {
    if (callback) callback();
    return;
  }
  const roasts = match.roasts[storyLang] || match.roasts.en;
  const roast = roasts[Math.floor(Math.random() * roasts.length)];
  $("roastText").textContent = roast;
  $("roastBox").classList.remove("hidden");
  setTimeout(() => {
    $("roastBox").classList.add("hidden");
    if (callback) callback();
  }, 4000);
}

function showStoryTierComplete() {
  const tier = STORY_DATA.tiers[storyProgress.currentTier];
  if (!tier) {
    showStoryComplete();
    return;
  }
  if (!storyProgress.completedTiers.includes(storyProgress.currentTier)) {
    storyProgress.completedTiers.push(storyProgress.currentTier);
    if (!storyProgress.trophies) storyProgress.trophies = [];
    storyProgress.trophies.push(tier.id);
  }
  cloudSaveStory();
  showTrophyCelebration(
    getStoryTrophyIcon(storyProgress.currentTier),
    tier.name[storyLang] + " Complete!",
    tier.trophy ? tier.trophy[storyLang] || tier.name[storyLang] : "Champion",
    storyProgress.myTeam ? storyProgress.myTeam.name : "Your Team",
  );
}

function showStoryComplete() {
  showTrophyCelebration(
    getStoryTrophyIcon(7),
    "NATIONAL CHAMPION!",
    "You conquered every tier!",
    storyProgress.myTeam ? storyProgress.myTeam.name : "Your Team",
  );
}

function showTrophyCelebration(icon, title, sub, teamName) {
  $("trophyBigIcon").innerHTML = icon;
  $("trophyTitle").textContent = title;
  $("trophySub").textContent = sub;
  $("certTitle").textContent = "Certificate of Achievement";
  $("certName").textContent = teamName;
  $("certDesc").textContent = title;
  $("trophyCelebrate").classList.remove("hidden");
  sfx("win");
  confetti(80);
}
$("btnTrophyClose").onclick = () => {
  sfx("tap");
  $("trophyCelebrate").classList.add("hidden");
  if (!storyProgress.completedTiers.includes(storyProgress.currentTier)) {
    storyProgress.completedTiers.push(storyProgress.currentTier);
  }
  storyProgress.currentTier++;
  storyProgress.currentMatch = 0;
  cloudSaveStory();
  $("menuOverlay").classList.add("hidden");
  $("storyHome").classList.remove("hidden");
  renderStoryHome();
};

function showStoryTeamBuilder() {
  $("storyHome").classList.add("hidden");
  $("storyTeamBuilder").classList.remove("hidden");
  storyBuilderPicks = [];
  $("storyTeamName").value = "";
  $("storyPickCount").textContent = "0";
  $("btnStoryTeamConfirm").disabled = true;
  const pool = $("storyPlayerPool");
  pool.innerHTML = "";
  if (!STORY_DATA || !STORY_DATA.playerPool) return;
  STORY_DATA.playerPool.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "story-player-card";
    card.dataset.idx = i;
    const rc =
      p.role === "batter"
        ? '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z"/><path d="m9.6 10.4 4 4"/></svg>'
        : p.role === "bowler"
          ? '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0"/></svg>'
          : '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9M3 12h9V3"/><path d="m3 12 4.5 4.5M12 3 7.5 7.5" "/></svg>';
    card.innerHTML =
      '<div><div class="sp-name">' +
      rc +
      " " +
      p.name +
      '</div><div class="sp-info">' +
      p.country +
      " — " +
      p.role +
      "</div></div>" +
      '<div style="font-size:9px;opacity:.5;text-align:right">' +
      (p.battingStyle || "balanced").charAt(0).toUpperCase() +
      "/" +
      (p.bowlingStyle || "balanced").charAt(0).toUpperCase() +
      "</div>";
    card.onclick = () => toggleStoryPick(i, card);
    pool.appendChild(card);
  });
}
let storyBuilderPicks = [];
function toggleStoryPick(idx, el) {
  sfx("tap");
  if (storyBuilderPicks.includes(idx)) {
    storyBuilderPicks = storyBuilderPicks.filter((i) => i !== idx);
    el.classList.remove("picked");
  } else if (storyBuilderPicks.length < 11) {
    storyBuilderPicks.push(idx);
    el.classList.add("picked");
  }
  $("storyPickCount").textContent = storyBuilderPicks.length;
  $("btnStoryTeamConfirm").disabled = storyBuilderPicks.length !== 11;
}
$("btnStoryTeamConfirm").onclick = () => {
  if (storyBuilderPicks.length !== 11) return;
  sfx("tap");
  const teamName = $("storyTeamName").value.trim() || "My Team";
  const players = storyBuilderPicks.map((i) => {
    const src = STORY_DATA.playerPool[i];
    return {
      name: src.name,
      role: src.role,
      battingStyle: src.battingStyle || "balanced",
      bowlingStyle: src.bowlingStyle || "balanced",
    };
  });
  storyProgress.myTeam = { name: teamName, players: players };
  cloudSaveStory();
  $("storyTeamBuilder").classList.add("hidden");
  $("storyHome").classList.remove("hidden");
  renderStoryHome();
};
$("btnStoryTeamBack").onclick = () => {
  sfx("tap");
  $("storyTeamBuilder").classList.add("hidden");
  $("storyHome").classList.remove("hidden");
  renderStoryHome();
};

async function cloudSaveStory() {
  if (!storyProgress) return;
  storyProgress.user = getUsername() || "player";
  // M5/C9: ALWAYS keep a local backup first — cloud failures (broken endpoint,
  // offline) must never lose progress. Server, when reachable, wins on load.
  try {
    localStorage.setItem("hcp_story", JSON.stringify(storyProgress));
  } catch (e) {}
  try {
    const r = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: storyProgress.user,
        data: storyProgress,
        token: getClientToken(),
      }),
    });
    if (!r.ok) throw new Error("save status " + r.status);
  } catch (e) {
    // cloud unavailable — the local backup above already persisted
  }
}

async function cloudLoadStory() {
  const user = getUsername() || "player";
  let local = null;
  try {
    local = JSON.parse(localStorage.getItem("hcp_story"));
  } catch (e) {}
  try {
    const r = await fetch("/api/load?user=" + encodeURIComponent(user));
    if (r.ok) {
      const j = await r.json();
      if (j && j.data) {
        storyProgress = j.data;
        return true;
      }
    }
  } catch (e) {}
  if (local) {
    storyProgress = local;
    return true;
  }
  return false;
}

$("btnStoryBack").onclick = () => {
  sfx("tap");
  $("storyHome").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
  $("storyDialogue").classList.add("hidden");
};
$("btnStoryBack").className = "back-btn";
$("btnStoryRestart").onclick = async () => {
  sfx("tap");
  // v2.8: in-app sheet instead of the native confirm()
  const ok = await confirmDialog(
    "Restart story?",
    "Your career progress will be lost.",
    "Restart",
  );
  if (ok) {
    storyProgress = defaultStoryProgress();
    cloudSaveStory();
    renderStoryHome();
  }
};
function enterStoryMode() {
  ensureUsername(async () => {
    $("menuOverlay").classList.add("hidden");
    $("storyHome").classList.remove("hidden");
    await cloudLoadStory();
    if (!storyProgress) storyProgress = defaultStoryProgress();
    storyLang = storyProgress.language || "en";
    document
      .querySelectorAll("#storyLang .lang-btn")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.lang === storyLang),
      );
    renderStoryHome();
  });
}
document.querySelectorAll("#storyLang .lang-btn").forEach((b) => {
  b.onclick = () => {
    sfx("tap");
    storyLang = b.dataset.lang;
    document
      .querySelectorAll("#storyLang .lang-btn")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    if (storyProgress) {
      storyProgress.language = storyLang;
      cloudSaveStory();
    }
    renderStoryHome();
  };
});

(function () {
  const _nb = nextBall;
  nextBall = function () {
    _nb.apply(this, arguments);
    try {
      applyGestureRestrictions();
    } catch (e) {}
  };
})();

(function () {
  const _rb = revealBall;
  revealBall = function () {
    try {
      var wkBefore = curBat().wkts;
    } catch (e) {
      var wkBefore = 0;
    }
    _rb.apply(this, arguments);
    setTimeout(() => {
      try {
        if (curBat().wkts > wkBefore) revealBowlerRole(true);
        else if (curBat().balls % 6 === 0 && curBat().balls > 0)
          revealBowlerRole(false);
        applyGestureRestrictions();
      } catch (e) {}
    }, 900);
  };
})();

(function () {
  const _fm = finishMatch;
  finishMatch = function () {
    _fm.apply(this, arguments);
    // C6: gate on the story-match flag — casual offline matches used to write
    // into the story career whenever a story team existed.
    if (!G.storyMatch || !storyProgress || !storyProgress.myTeam) return;
    {
      const won = G.me.score > G.opp.score;
      const ti = storyProgress.currentTier,
        mi = storyProgress.currentMatch;
      const tier = STORY_DATA.tiers[ti];
      if (!storyProgress.matchResults) storyProgress.matchResults = [];
      if (!storyProgress.stats)
        storyProgress.stats = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          totalRuns: 0,
          totalWickets: 0,
        };
      // C10: upsert the result for (tier, match) instead of appending — a
      // replay of a lost match now UPDATES the record (dot turns green, no
      // double counting of progress), and stats only move when the outcome
      // actually changes.
      const idx = storyProgress.matchResults.findIndex(
        (r) => r.tier === ti && r.match === mi,
      );
      const prev = idx >= 0 ? storyProgress.matchResults[idx] : null;
      if (!prev) {
        storyProgress.matchResults.push({ tier: ti, match: mi, won: won });
        storyProgress.stats.matchesPlayed++;
      } else {
        storyProgress.matchResults[idx] = { tier: ti, match: mi, won: won };
      }
      if (won && (!prev || !prev.won)) {
        storyProgress.stats.wins++;
        if (prev) storyProgress.stats.losses--;
      } else if (!won && (!prev || prev.won)) {
        storyProgress.stats.losses++;
        if (prev) storyProgress.stats.wins--;
      }
      storyProgress.stats.totalRuns += G.me.score;
      storyProgress.stats.totalWickets += G.opp.wkts;
      cloudSaveStory();
      setTimeout(() => {
        if (won) {
          const n =
            tier && tier.matches[mi]
              ? tier.matches[mi].narrative.win[storyLang] ||
                tier.matches[mi].narrative.win.en
              : "";
          if (n)
            showStoryDialogue(n, () => {
              storyProgress.currentMatch++;
              advanceStoryAfterWin();
            });
          else advanceStoryAfterWin();
        } else {
          showStoryRoast(ti, mi, () => {
            const n =
              tier && tier.matches[mi]
                ? tier.matches[mi].narrative.lose[storyLang] ||
                  tier.matches[mi].narrative.lose.en
                : "";
            if (n)
              showStoryDialogue(n, () => {
                $("resultOverlay").classList.add("hidden");
                $("storyHome").classList.remove("hidden");
                renderStoryHome();
              });
            else {
              $("resultOverlay").classList.add("hidden");
              $("storyHome").classList.remove("hidden");
              renderStoryHome();
            }
          });
        }
      }, 1500);
    }
  };
  function advanceStoryAfterWin() {
    const tier = STORY_DATA.tiers[storyProgress.currentTier];
    if (!tier) {
      $("storyHome").classList.remove("hidden");
      $("menuOverlay").classList.add("hidden");
      renderStoryHome();
      return;
    }
    if (storyProgress.currentMatch >= tier.matches.length - 1) {
      storyProgress.currentMatch = 0;
      showStoryTierComplete();
    } else {
      storyProgress.currentMatch++;
      cloudSaveStory();
      $("resultOverlay").classList.add("hidden");
      $("storyHome").classList.remove("hidden");
      renderStoryHome();
    }
  }
})();

(function () {
  const _so = startOffline;
  startOffline = function () {
    _so.apply(this, arguments);
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
    }
  };
})();

(function () {
  const mg = document.querySelector(".mode-grid");
  if (mg) {
    mg.classList.remove("three-col");
    mg.style.gridTemplateColumns = "repeat(4, 1fr)";
    mg.style.maxWidth = "380px";
    const sb = document.createElement("div");
    sb.className = "mode-btn";
    sb.id = "modeStory";
    sb.innerHTML =
      '<span class="icon"><svg class="" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5C4 3.6 6 3.6 8 4.5V20c-2-.9-4-.9-6 0z"/><path d="M16 4.5c2-.9 4-.9 6 0V20c-2-.9-4-.9-6 0z"/><path d="M8 4.5c2-.9 4-.9 6 0V20c-2-.9-4-.9-6 0z"/></svg></span><span class="title">Story</span><span class="desc">Build your legacy</span>';
    sb.onclick = () => {
      ensureAudio();
      sfx("tap");
      haptic();
      enterStoryMode();
    };
    mg.appendChild(sb);
  }
})();
// ================================================================
// PLAYER SELECTION + INNINGS BREAK SYSTEM
// ================================================================

