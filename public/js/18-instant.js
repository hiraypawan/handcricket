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
let mmSearch = null;

function stopQmSearch() {
  if (!mmSearch) return;
  try {
    mmSearch.cancelled = true;
    clearInterval(mmSearch.poll);
    clearTimeout(mmSearch.cut);
    (mmSearch.stages || []).forEach(clearTimeout);
  } catch (e) {}
  mmSearch = null;
}
/* Per-device matchmaking id: two guests both called "Player" (or two users
   with the same name) must still pair — identity is this id, names are
   display-only. */
function qmCid() {
  try {
    let c = localStorage.getItem("hcp_cid");
    if (!c) {
      c = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 16);
      localStorage.setItem("hcp_cid", c);
    }
    return c;
  } catch (e) {
    return "";
  }
}
/* Tell the pool I'm gone (bot fallback, match start, cancel) — otherwise my
   ghost entry can pair a stranger into an empty room for up to 20s. */
function qmLeave() {
  try {
    const me = (typeof getUsername === "function" && getUsername()) || "";
    if (!me) return;
    fetch("/api/quickmatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", user: me, cid: qmCid() }),
    }).catch(() => {});
  } catch (e) {}
}
function resetMatchmakingUI() {
  stopQmSearch();
  qmLeave();
  mmSearching = false;
  mmPersona = null;
  clearInterval(matchTimer);
  const bnb = $("btnMMBotNow");
  if (bnb) bnb.style.display = "none";
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

/* QUICK MATCHMAKING — real players first, bot fallback after.
   Seekers poll /api/quickmatch every 2s; anyone else seeking the same format
   matches instantly into a real P2P room (earlier seeker hosts). Nothing
   found by a random 9–14s cutoff → a bot persona with a real-looking name.
   window.__qmCutoffMs overrides the cutoff (used by the smoke suite). */
const MM_SEARCH_STAGES = [
  "Finding you an opponent...",
  "Comparing ratings...",
  "Confirming opponent...",
  "Still looking...",
];
function findOpponent() {
  /* Every seeker is a named real player — no anonymous "Player" entries.
     The name gate has no dismiss path, but this guards direct calls too. */
  const me0 = (typeof getUsername === "function" && getUsername()) || "";
  if (!me0.trim()) {
    if (typeof ensureUsername === "function") {
      ensureUsername(() => {
        if ((typeof getUsername === "function" && getUsername() || "").trim())
          findOpponent();
      });
    }
    return;
  }
  mmSearching = true;
  $("searchSpinner").style.display = "block";
  $("mmPersona").classList.add("hidden");
  const btn = $("btnMMPlayBot");
  btn.disabled = true;
  btn.textContent = "Searching...";
  if (typeof window.hcPresenceSet === "function")
    window.hcPresenceSet("seeking", null);
  const me = (typeof getUsername === "function" && getUsername()) || "";
  const teamSize = getTeamSize();
  /* Real pairs need overlap time (separate taps + KV propagation), so the
     hunt runs ~18-25s; a Play Bot Now shortcut appears after ~8s for solo
     players instead of forcing the full wait. */
  const cutoff =
    typeof window.__qmCutoffMs === "number"
      ? window.__qmCutoffMs
      : 18000 + Math.random() * 7000;
  const t0 = Date.now();
  const S = { cancelled: false, poll: null, cut: null, stages: [], seekers: 0 };
  mmSearch = S;
  const botNowBtn = $("btnMMBotNow");
  if (botNowBtn) {
    botNowBtn.style.display = "none";
    botNowBtn.onclick = () => {
      sfx("tap");
      goBot();
    };
  }
  S.stages.push(
    setTimeout(() => {
      if (!S.cancelled && botNowBtn) botNowBtn.style.display = "block";
    }, 8000),
  );
  const qmPost = async (action) => {
    try {
      const r = await fetch("/api/quickmatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user: me, teamSize, cid: qmCid() }),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  };
  /* Backgrounded mobile browsers throttle intervals to ~1/min — a user who
     flips to chat to coordinate "click now" would miss the whole window.
     Poll the moment the tab is visible again. */
  S.pollNow = async () => {
    if (S.cancelled) return;
    const j = await qmPost("poll");
    if (j && j.status === "matched") goReal(j);
  };
  const goReal = (m) => {
    if (S.cancelled) return;
    S.cancelled = true;
    clearInterval(S.poll);
    clearTimeout(S.cut);
    S.stages.forEach(clearTimeout);
    mmSearch = null;
    if (botNowBtn) botNowBtn.style.display = "none";
    /* tell ops this pair launched into P2P (vs. dying silently) */
    try {
      fetch("/api/quickmatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "joined", user: me, cid: qmCid() }),
      }).catch(() => {});
    } catch (e) {}
    joinRealMatch(m);
  };
  const goBot = () => {
    if (S.cancelled) return;
    S.cancelled = true;
    clearInterval(S.poll);
    mmSearch = null;
    qmLeave();
    if (botNowBtn) botNowBtn.style.display = "none";
    mmPersona = genBotProfile();
    renderMMPersona(mmPersona);
    mmSearching = false;
    $("searchSpinner").style.display = "none";
    $("matchStatus").textContent = "Opponent found — ready when you are.";
    btn.disabled = false;
    btn.textContent = "Start Match";
    sfx("tap");
  };
  let si = 0;
  const beat = () => {
    if (S.cancelled) return;
    $("matchStatus").textContent =
      MM_SEARCH_STAGES[si % MM_SEARCH_STAGES.length] +
      (S.seekers > 1 ? " • " + S.seekers + " searching" : "");
    si++;
    S.stages.push(setTimeout(beat, 1400));
  };
  beat();
  S.poll = setInterval(async () => {
    if (S.cancelled) return;
    if (Date.now() - t0 > cutoff) {
      goBot();
      return;
    }
    const j = await qmPost("poll");
    if (!j) return;
    if (typeof j.seekers === "number") S.seekers = j.seekers;
    if (j.status === "matched") goReal(j);
  }, 2000);
  qmPost("seek").then((j) => {
    if (j && j.status === "matched") goReal(j);
  });
  S.cut = setTimeout(goBot, cutoff + 800);
}
/* A real seeker was found: drop into the normal online flow (host creates
   the room, guest joins by code) — team select, roles, live toss follow. */
function joinRealMatch(m) {
  mmSearching = false;
  $("searchSpinner").style.display = "none";
  G.mode = "online";
  G.isBot = false;
  G.storyMatch = false;
  G.storyDifficulty = 0;
  G.teamSize = m.teamSize || getTeamSize();
  G.oppName = m.opp || "Opponent";
  G.myName = (typeof getUsername === "function" && getUsername()) || "Player";
  G.isHost = m.role !== "guest";
  G.roomId = m.room;
  G.wantRejoin = false;
  $("matchmakingOverlay").classList.add("hidden");
  $("menuOverlay").classList.add("hidden");
  $("waitingOverlay").classList.remove("hidden");
  $("connLog").innerHTML = "";
  const badge = $("connBadge");
  if (badge) badge.style.display = "none";
  if (typeof Peer === "undefined") {
    toast("Online play needs a connection — check your network and retry", "warn");
    $("waitingOverlay").classList.add("hidden");
    $("menuOverlay").classList.remove("hidden");
    return;
  }
  if (G.isHost) {
    $("waitTitle").textContent = "Opponent found!";
    $("waitDesc").textContent =
      (m.opp || "Opponent") + " is joining... keep this screen open.";
    connLog("Creating room " + m.room + "...");
  } else {
    $("waitTitle").textContent = "Opponent found!";
    $("waitDesc").textContent = "Joining " + (m.opp || "opponent") + "...";
    connLog("Joining " + m.room + "...");
  }
  startPeer(G.isHost, m.room);
}

$("btnMMCancel").onclick = () => {
  resetMatchmakingUI();
  destroyPeer();
  $("matchmakingOverlay").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
};
document.addEventListener("visibilitychange", () => {
  try {
    if (!document.hidden && mmSearch && !mmSearch.cancelled && mmSearching) {
      if (typeof mmSearch.pollNow === "function") mmSearch.pollNow();
    }
  } catch (e) {}
});
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
  stopQmSearch();
  qmLeave();
  mmSearching = false;
  clearInterval(matchTimer);
}
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
  resetMatchmakingUI();
  $("btnMMPlayBot").style.display = "block";
  if (typeof window.hcPresenceSet === "function") window.hcPresenceSet("seeking", null);
}
// Random toss + full offline rules (role screen for team formats).
function startQuickBotMatch(persona) {
  G.teamSize = getTeamSize();
  G.mode = "offline";
  G.isHost = true;
  G.isBot = true;
  G.roomId = null;
  G.specRoom = null;
  // carry the revealed player into the match so the scoreboard, the profile
  // card and the result screen all show the same opponent
  G.botProfile = persona || null;
  G.oppStats = persona ? personaStats(persona) : null;
  if (persona) G.oppName = persona.name;
  /* Team name is always "<username>'s Team" — derived, never asked. */
  G.myName =
    (typeof defaultTeamName === "function" && defaultTeamName()) ||
    getUsername() ||
    "Player";
  // never inherit a previous match's roster (e.g. a story XI)
  G.myPlayers = [];
  G.oppPlayers = [];
  $("matchmakingOverlay").classList.add("hidden");
  /* Live coin both sides watch — caller alternates every match. */
  startLiveToss({
    caller: tossTakeTurn(),
    meName: G.myName,
    oppName: G.oppName,
    oppIsBot: true,
    hi: false,
    onDone: (iBat) => {
      G.iBat = iBat;
      showRoleForOffline();
    },
  });
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

