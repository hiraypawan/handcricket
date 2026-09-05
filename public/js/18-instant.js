/* ============================================================================
 FILE: public/js/18-instant.js
 ROLE: QUICK MATCH (instant vs bot) + BOOT — quick match overlay wiring (was fake matchmaking), startBotMatch/startInstantMatch, global listeners, initial render + home hands, ?room= deep-link rejoin. Must load LAST of the main chain.
============================================================================ */

// C7/C14: QUICK MATCH is an honest, instant bot game — the old flow faked an
// 8-second "searching for a real player" countdown (with a cosmetic PeerJS
// peer nobody could join) and silently dropped you into a bot match. There is
// no matchmaking service; the overlay now says so and starts immediately.
/* v2.8 QUICK MATCH — the opponent is a player with a name, a city and a
   career, revealed before the match starts. The persona is derived from the
   name, so re-matching the same player never shows a different record. */
let mmPersona = null;
let mmFindTimer = null;

function resetMatchmakingUI() {
  mmSearching = false;
  mmPersona = null;
  clearInterval(matchTimer);
  if (mmFindTimer) {
    clearTimeout(mmFindTimer);
    mmFindTimer = null;
  }
  $("matchStatus").textContent = "Pick your format — we will find you an opponent.";
  $("matchTimer").textContent = "";
  $("searchSpinner").style.display = "none";
  $("mmPersona").classList.add("hidden");
  $("mmPersona").innerHTML = "";
  const btn = $("btnMMPlayBot");
  btn.textContent = "Find Opponent";
  btn.disabled = false;
}

function renderMMPersona(p) {
  const st = personaStats(p);
  $("mmPersona").innerHTML =
    (typeof avatarHtml === "function" ? avatarHtml(p.name || "?", 62, "persona-avatar") : '<div class="persona-avatar">' + escHtml((p.name || "?").trim().charAt(0).toUpperCase()) + "</div>") +
    '<div class="persona-body"><div class="persona-name">' + escHtml(p.name) + "</div>" +
    '<div class="persona-meta">' + escHtml(p.city) + " \u00b7 " + escHtml(p.style) + "</div>" +
    '<div class="persona-stats">' +
    "<span>" + st.matches + " matches</span>" +
    "<span>" + st.winPct + "% wins</span>" +
    "<span>" + getRank(st) + "</span>" +
    "</div></div>";
  $("mmPersona").classList.remove("hidden");
}

/* Staged search: a real-feeling beat (~3s) instead of an instant reveal.
   Still an honest bot game (see header) — the stages describe rating
   matching, never "real players". One chained timer id so Cancel clears it. */
const MM_SEARCH_STAGES = [
  "Finding you an opponent...",
  "Comparing ratings...",
  "Confirming opponent...",
];
function findOpponent() {
  mmSearching = true;
  $("searchSpinner").style.display = "block";
  $("mmPersona").classList.add("hidden");
  const btn = $("btnMMPlayBot");
  btn.disabled = true;
  let stage = 0;
  const runStage = () => {
    mmFindTimer = null;
    if (!mmSearching) return;
    if (stage < MM_SEARCH_STAGES.length) {
      $("matchStatus").textContent = MM_SEARCH_STAGES[stage];
      btn.textContent = "Searching...";
      stage++;
      mmFindTimer = setTimeout(runStage, 850 + Math.random() * 350);
      return;
    }
    mmPersona = genBotProfile();
    renderMMPersona(mmPersona);
    mmSearching = false;
    $("searchSpinner").style.display = "none";
    $("matchStatus").textContent = "Opponent found — ready when you are.";
    btn.disabled = false;
    btn.textContent = "Start Match";
    sfx("tap");
  };
  runStage();
}

$("btnMMCancel").onclick = () => {
  resetMatchmakingUI();
  destroyPeer();
  $("matchmakingOverlay").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
};
$("btnMMPlayBot").onclick = () => {
  if (!mmPersona) {
    findOpponent();
    return;
  }
  resetMatchmakingUI2();
  destroyPeer();
  $("matchmakingOverlay").classList.add("hidden");
  startQuickBotMatch(mmPersona);
};
/* keep the revealed persona when the match actually starts */
function resetMatchmakingUI2() {
  mmSearching = false;
  clearInterval(matchTimer);
  if (mmFindTimer) {
    clearTimeout(mmFindTimer);
    mmFindTimer = null;
  }
}
function teamDisplayName() {
  try {
    const v = ($("mmTeamName") && $("mmTeamName").value) || "";
    if (v.trim()) return v.trim().slice(0, 16);
    return localStorage.getItem("hcp_teamname") || "";
  } catch (e) {
    return "";
  }
}
function startMatchmaking() {
  mmSearching = false;
  clearInterval(matchTimer);
  try {
    const saved = localStorage.getItem("hcp_teamname") || "";
    if (saved && $("mmTeamName") && !$("mmTeamName").value) $("mmTeamName").value = saved;
  } catch (e) {}
  G.teamSize = getTeamSize();
  G.mode = "offline";
  G.isHost = true;
  // reflect the currently selected format on this overlay's size buttons
  document.querySelectorAll("#mmSize .team-size-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.size, 10) === G.teamSize);
  });
  resetMatchmakingUI();
  $("btnMMPlayBot").style.display = "block";
}
// Random toss + full offline rules (role screen for team formats).
function startQuickBotMatch(persona) {
  G.teamSize = getTeamSize();
  G.mode = "offline";
  G.isHost = true;
  G.isBot = true;
  // carry the revealed player into the match so the scoreboard, the profile
  // card and the result screen all show the same opponent
  G.botProfile = persona || null;
  G.oppStats = persona ? personaStats(persona) : null;
  if (persona) G.oppName = persona.name;
  G.iBat = Math.random() < 0.5; // coin flip decides who bats first
  /* Renamable T20/quick team: typed name wins, else username, else YOU. */
  const tn = teamDisplayName();
  if (tn) {
    try {
      localStorage.setItem("hcp_teamname", tn);
    } catch (e) {}
  }
  G.myName = tn || getUsername() || "Player";
  G.oppName = "";
  // never inherit a previous match's roster (e.g. a story XI)
  G.myPlayers = [];
  G.oppPlayers = [];
  showRoleForOffline();
}

document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
["touchstart", "click"].forEach((ev) =>
  document.addEventListener(ev, () => ensureAudio(), { passive: true }),
);
updScore();
renderBalls();
updHomeUsername();
updHomeTrophies();
try {
  buildArenaHand($("arenaPlayer"));
  buildArenaHand($("arenaOpponent"));
} catch (e) {}
try {
  const hc = document.getElementById("homeHands");
  if (hc) {
    function buildHomeHand(v, cls) {
      const w = document.createElement("div");
      w.className = "home-hand " + cls;
      w.innerHTML = getHandSVG(v, cls === "right");
      return w;
    }
    let seq = [6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6];
    let si = 0;
    function cycleHands() {
      hc.innerHTML = "";
      hc.appendChild(buildHomeHand(seq[si], "left"));
      hc.appendChild(buildHomeHand(seq[(si + 5) % seq.length], "right"));
      si = (si + 1) % seq.length;
    }
    cycleHands();
    setInterval(cycleHands, 1200);
  }
  const pc = document.getElementById("particles");
  if (pc) {
    for (let i = 0; i < 25; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 12 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      p.style.width = p.style.height = 2 + Math.random() * 3 + "px";
      pc.appendChild(p);
    }
  }
} catch (e) {}

(function () {
  const rid = new URLSearchParams(location.search).get("room");
  if (!rid) return;
  G.mode = "online";
  const sess = loadSession();
  if (sess && sess.role === "host" && sess.room === rid) {
    G.isHost = true;
    G.roomId = rid;
    G.myName = sess.name;
    const snap = loadSnap(rid);
    if (
      snap &&
      (snap.stage === "playing" ||
        snap.stage === "break" ||
        snap.stage === "over")
    ) {
      restore(snap, true);
      G.restored = true;
      if (
        snap.stage === "playing" ||
        snap.stage === "break" ||
        snap.stage === "over"
      ) {
        if (typeof hideDock === "function") hideDock();
      }
    }
    $("menuOverlay").classList.add("hidden");
    $("waitingOverlay").classList.remove("hidden");
    $("connLog").innerHTML = "";
    connLog("Host restored, recreating room...");
    startPeer(true, rid);
  } else {
    /* v2.8: a brand-new player opening an invite link used to land in the
       lobby with no username at all — their career and friend list were then
       written under an empty key. Ask for a name first, then show the lobby. */
    const openLobby = () => {
      $("menuOverlay").classList.add("hidden");
      $("onlineLobby").classList.remove("hidden");
      $("nameInput").value = getUsername() || "";
      if (typeof setLobbyMode === "function") setLobbyMode(true, rid);
      else {
        $("btnJoin").style.display = "block";
        $("btnCreate").style.display = "none";
        $("hostFormat").style.display = "none";
        $("joinerNote").style.display = "block";
      }
      if (sess && sess.role === "join" && sess.room === rid) {
        $("nameInput").value = sess.name;
        G.wantRejoin = true;
      }
    };
    if (getUsername()) openLobby();
    else ensureUsername(openLobby);
  }
})();
if (typeof checkBotChallenges === "function")
  setTimeout(checkBotChallenges, 5000);

