/* ============================================================================
 FILE: public/js/18-instant.js
 ROLE: QUICK MATCH (instant vs bot) + BOOT — quick match overlay wiring (was fake matchmaking), startBotMatch/startInstantMatch, global listeners, initial render + home hands, ?room= deep-link rejoin. Must load LAST of the main chain.
============================================================================ */

// C7/C14: QUICK MATCH is an honest, instant bot game — the old flow faked an
// 8-second "searching for a real player" countdown (with a cosmetic PeerJS
// peer nobody could join) and silently dropped you into a bot match. There is
// no matchmaking service; the overlay now says so and starts immediately.
$("btnMMCancel").onclick = () => {
  mmSearching = false;
  clearInterval(matchTimer);
  destroyPeer();
  $("matchmakingOverlay").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
};
$("btnMMPlayBot").onclick = () => {
  mmSearching = false;
  clearInterval(matchTimer);
  destroyPeer();
  $("matchmakingOverlay").classList.add("hidden");
  startQuickBotMatch();
};
function startMatchmaking() {
  mmSearching = false;
  clearInterval(matchTimer);
  G.teamSize = getTeamSize();
  G.mode = "offline";
  G.isHost = true;
  // reflect the currently selected format on this overlay's size buttons
  document.querySelectorAll("#mmSize .team-size-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.size, 10) === G.teamSize);
  });
  $("matchStatus").textContent = "Instant bot match — pick your format!";
  $("matchTimer").textContent = "";
  $("searchSpinner").style.display = "none";
  $("btnMMPlayBot").style.display = "block";
}
// Random toss + full offline rules (role screen for team formats).
function startQuickBotMatch() {
  G.teamSize = getTeamSize();
  G.mode = "offline";
  G.isHost = true;
  G.isBot = true;
  G.oppStats = null;
  G.botProfile = null;
  G.iBat = Math.random() < 0.5; // coin flip decides who bats first
  G.myName = getUsername() || "Player";
  G.oppName = "";
  // never inherit a previous match's roster (e.g. a story XI)
  G.myPlayers = [];
  G.oppPlayers = [];
  $("offlineSetup").classList.add("hidden");
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
      w.innerHTML = getHandSVG(v, cls === "left");
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
    }
    $("menuOverlay").classList.add("hidden");
    $("waitingOverlay").classList.remove("hidden");
    $("connLog").innerHTML = "";
    connLog("Host restored, recreating room...");
    startPeer(true, rid);
  } else {
    $("menuOverlay").classList.add("hidden");
    $("onlineLobby").classList.remove("hidden");
    $("nameInput").value = getUsername() || "";
    $("btnJoin").style.display = "block";
    $("btnCreate").style.display = "none";
    $("hostFormat").style.display = "none";
    $("joinerNote").style.display = "block";
    if (sess && sess.role === "join" && sess.room === rid) {
      $("nameInput").value = sess.name;
      G.wantRejoin = true;
    }
  }
})();
if (typeof checkBotChallenges === "function")
  setTimeout(checkBotChallenges, 5000);

