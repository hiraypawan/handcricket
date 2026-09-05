/* ============================================================================
 FILE: public/js/14-online.js
 ROLE: P2P ONLINE (PeerJS) — genId, PEER_OPTS, host/join lobby buttons, startPeer/joinHost/setupConn/auto-rejoin/hello handshake, handleNet() protocol, resumeFromStage, team select + builder, online toss + pre-match countdown, startOnline(). Depends on: state (03), engine (09).
============================================================================ */

function genId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
const PEER_OPTS = {
  debug: 0,
  config: { iceServers: buildIceServers() },
};

/* ICE servers. The Metered "openrelay" TURN below is free, public and
   rate-limited — it is shared with every other app on the internet, so under
   load it fails and the player just sees "my friend can't join".
   Set these three Pages environment variables to swap in a real relay with no
   code change:
       HC_TURN_URLS       turn:relay.example.com:3478,turn:relay.example.com:3478?transport=tcp
       HC_TURN_USERNAME   <username>
       HC_TURN_CREDENTIAL <credential>
   They are injected by functions/api/config.js (or a static /hc-config.json). */
function buildIceServers() {
  const stun = [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:stun3.l.google.com:19302",
    "stun:stun4.l.google.com:19302",
  ].map(function (u) { return { urls: u }; });

  const cfg = (typeof window !== "undefined" && window.__hcTurn) || {};
  if (cfg.urls && cfg.username && cfg.credential) {
    const urls = String(cfg.urls).split(",").map(function (u) { return u.trim(); }).filter(Boolean);
    return stun.concat([{
      urls: urls,
      username: String(cfg.username),
      credential: String(cfg.credential),
    }]);
  }

  // Free fallback. Good enough to demo, not good enough to rely on.
  return stun.concat([
    { urls: "turn:openrelay.metered.us:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.us:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.us:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ]);
}
window.buildIceServers = buildIceServers;

/* Pull the relay config once at boot so a paid TURN takes effect without a
   rebuild. Silently ignored if the endpoint is absent. */
(function loadTurnConfig() {
  try {
    fetch("/api/config")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.turn && d.turn.urls) window.__hcTurn = d.turn;
      })
      .catch(function () {});
  } catch (e) {}
})();

/* v2.8: the lobby used to dead-end with alert("No room!") and had no way to
   type a code — if you lost the invite link you were stuck. */
function showLobbyError(msg) {
  const el = $("lobbyError");
  if (!el) return;
  if (!msg) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = msg;
  el.classList.remove("hidden");
}
function normalizeRoomCode(v) {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
/* Code from the ?room= deep link, or from the code field. */
function resolveRoomCode() {
  const fromUrl = new URLSearchParams(location.search).get("room");
  if (fromUrl) return normalizeRoomCode(fromUrl);
  const field = $("roomCodeInput");
  return field ? normalizeRoomCode(field.value) : "";
}
function setLobbyMode(isJoiner, code) {
  const join = !!isJoiner;
  $("btnJoin").style.display = join ? "block" : "none";
  $("btnCreate").style.display = join ? "none" : "block";
  $("hostFormat").style.display = join ? "none" : "block";
  $("joinerNote").style.display = join ? "block" : "none";
  $("roomCodeWrap").style.display = join ? "block" : "none";
  const toggle = $("btnShowJoin");
  if (toggle) toggle.style.display = join ? "none" : "block";
  if (code && $("roomCodeInput")) $("roomCodeInput").value = code;
  showLobbyError("");
}

$("btnCreate").onclick = () => {
  sfx("tap");
  const nm = $("nameInput").value.trim() || getUsername() || "";
  if (!nm) {
    showLobbyError("Enter your name so your friend knows who they are playing.");
    $("nameInput").focus();
    return;
  }
  G.myName = nm;
  setUsername(G.myName);
  G.isHost = true;
  G.wantRejoin = false;
  G.teamSize = getTeamSize();
  showLobbyError("");
  $("onlineLobby").classList.add("hidden");
  $("waitingOverlay").classList.remove("hidden");
  $("connLog").innerHTML = "";
  $("connBadge").style.display = "none";
  connLog("Creating room...");
  startPeer(true);
};
$("btnJoin").onclick = () => {
  sfx("tap");
  const nm = $("nameInput").value.trim() || getUsername() || "";
  if (!nm) {
    showLobbyError("Enter your name first.");
    $("nameInput").focus();
    return;
  }
  const rid = resolveRoomCode();
  if (!rid) {
    showLobbyError("Enter the room code your friend shared.");
    if ($("roomCodeWrap").style.display === "none") setLobbyMode(true, "");
    $("roomCodeInput").focus();
    return;
  }
  if (rid.length < 4) {
    showLobbyError("That code looks too short — check it and try again.");
    return;
  }
  G.myName = nm;
  // the joiner never had setUsername() called, so their career and friend list
  // were written under an empty username
  setUsername(nm);
  G.isHost = false;
  showLobbyError("");
  const sess = loadSession();
  G.wantRejoin = !!(sess && sess.role === "join" && sess.room === rid);
  $("onlineLobby").classList.add("hidden");
  $("waitingOverlay").classList.remove("hidden");
  $("connLog").innerHTML = "";
  $("connBadge").style.display = "none";
  connLog("Joining " + rid + "...");
  startPeer(false, rid);
};
$("btnRetry").onclick = () => {
  sfx("tap");
  $("btnRetry").style.display = "none";
  $("connLog").innerHTML = "";
  $("connBadge").style.display = "none";
  connLog("Retrying...");
  destroyPeer();
  if (G.isHost) startPeer(true, G.roomId);
  else startPeer(false, G.roomId || resolveRoomCode());
};
$("btnCancelWait").onclick = () => {
  destroyPeer();
  $("waitingOverlay").classList.add("hidden");
  $("roomCodeShare").classList.add("hidden");
  $("btnCopyCode").style.display = "none";
  $("onlineLobby").classList.remove("hidden");
};
$("btnCopy").onclick = () => {
  const t = "Let's play Hand Cricket!\n" + $("shareBox").textContent;
  if (navigator.share) {
    navigator
      .share({ title: "Hand Cricket", text: t, url: $("shareBox").textContent })
      .catch(() => {
        navigator.clipboard.writeText(t);
        toast("Invite link copied", "ok");
      });
  } else {
    navigator.clipboard.writeText(t);
    toast("Invite link copied", "ok");
  }
};

$("btnCopyCode").onclick = () => {
  const code = G.roomId || "";
  if (!code) return;
  sfx("tap");
  try {
    navigator.clipboard.writeText(code);
    toast("Room code " + code + " copied", "ok");
  } catch (e) {
    toast("Room code: " + code);
  }
};

$("btnShowJoin").onclick = () => {
  sfx("tap");
  setLobbyMode(true, "");
  $("roomCodeInput").focus();
};

function startPeer(isHost, roomId) {
  G.isHost = isHost;
  G.roomId = roomId || genId();
  connGen = 0;
  joinAttempts = 0;
  readyGen = -1;
  const pid = isHost ? "hcp_" + G.roomId : "hcp_c_" + genId();
  connLog("Peer: " + pid);
  if (isHost) saveSession({ role: "host", room: G.roomId, name: G.myName });
  try {
    peer = new Peer(pid, PEER_OPTS);
  } catch (e) {
    connLog("Init failed", true);
    $("btnRetry").style.display = "block";
    return;
  }
  peer.on("open", () => {
    connLog("Server OK");
    if (isHost) {
      const u = new URL(location);
      u.searchParams.set("room", G.roomId);
      $("shareBox").textContent = u.toString();
      $("shareBox").style.display = "block";
      $("btnCopy").style.display = "block";
      $("roomCodeText").textContent = G.roomId;
      $("roomCodeShare").classList.remove("hidden");
      $("btnCopyCode").style.display = "block";
      $("waitTitle").textContent = "Waiting for friend...";
      $("waitDesc").textContent = "Share the code or the link:";
      connLog("Room: " + G.roomId);
      connLog("Waiting...");
    } else {
      $("waitTitle").textContent = "Joining...";
      $("waitDesc").textContent = "";
      $("shareBox").style.display = "none";
      $("btnCopy").style.display = "none";
      joinHost();
    }
  });
  peer.on("connection", (c) => {
    connLog("Incoming!");
    connGen++;
    conn = c;
    setupConn(c, connGen, false);
  });
  peer.on("error", (err) => {
    connLog(err.type, true);
    if (err.type === "peer-unavailable") {
      connLog("Room not found", true);
      $("btnRetry").style.display = "block";
    } else if (err.type === "unavailable-id") {
      setTimeout(() => {
        destroyPeer();
        startPeer(isHost, roomId);
      }, 2000);
    } else if (err.type === "network" || err.type === "server-error") {
      connLog("Server busy, retry 3s...", false, true);
      setTimeout(() => {
        destroyPeer();
        startPeer(isHost, roomId);
      }, 3000);
    } else $("btnRetry").style.display = "block";
  });
  peer.on("disconnected", () => {
    connLog("Reconnecting...", false, true);
    try {
      peer.reconnect();
    } catch (e) {
      setTimeout(() => {
        destroyPeer();
        startPeer(isHost, roomId);
      }, 2000);
    }
  });
}

function joinHost() {
  connGen++;
  joinAttempts++;
  const gen = connGen;
  connLog("Attempt " + joinAttempts + "/3...");
  conn = peer.connect("hcp_" + G.roomId, { reliable: true });
  setupConn(conn, gen, true);
}

function setupConn(c, gen, isJoiner) {
  c.on("data", (d) => {
    if (gen === connGen) handleNet(d);
  });
  c.on("close", () => {
    if (gen !== connGen) return;
    connLog("Closed", true);
    if (G.mode === "online") {
      stopTimer();
      clearWD();
      G.state = "idle";
      setBtns(false);
      if (G.isHost) {
        $("status").innerHTML =
          '<span class="hl">Friend left - waiting for rejoin...</span>';
      } else {
        $("status").innerHTML =
          '<span class="hl">Host lost - reconnecting...</span>';
        startAutoRejoin();
      }
    }
  });
  c.on("error", (e) => {
    if (gen !== connGen) return;
    connLog(e.type || "err", true);
    if (isJoiner && joinAttempts < 3) {
      connLog("Retry 2s...", false, true);
      setTimeout(joinHost, 2000);
    } else if (!isJoiner) {
      connLog("Waiting for friend retry...", false, true);
    } else $("btnRetry").style.display = "block";
  });
  let att = 0;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    att++;
    if (c.open) {
      clearInterval(pollTimer);
      pollTimer = null;
      if (gen === connGen) {
        connLog("OPEN!");
        connReady();
      }
    } else if (att >= 225) {
      clearInterval(pollTimer);
      pollTimer = null;
      if (gen === connGen) {
        connLog("Timeout", true);
        $("btnRetry").style.display = "block";
      }
    } else if (att % 25 === 0) {
      connLog((att * 200) / 1000 + "s...", false, true);
    }
  }, 200);
  c.on("open", () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (gen === connGen) {
      connLog("OPEN!");
      connReady();
    }
  });
}

function startAutoRejoin() {
  if (rejoinTimer) return;
  let n = 0;
  rejoinTimer = setInterval(() => {
    n++;
    if (n > 30) {
      stopRejoin();
      $("btnRetry").style.display = "block";
      return;
    }
    if (peer && !peer.destroyed) {
      joinHost();
    }
  }, 3000);
}
function connReady() {
  if (readyGen === connGen) return;
  readyGen = connGen;
  connLog("Hello...");
  sendHello(0);
}
function sendHello(att) {
  if (att >= 20) {
    connLog("Hello failed", true);
    $("btnRetry").style.display = "block";
    return;
  }
  if (conn && conn.open) {
    try {
      conn.send({
        type: "hello",
        name: G.myName,
        teamSize: G.teamSize,
        rejoin: G.wantRejoin,
        stats: loadStats(),
      });
      connLog("Sent!");
    } catch (e) {
      setTimeout(() => sendHello(att + 1), 500);
    }
  } else setTimeout(() => sendHello(att + 1), 500);
}

function handleNet(d) {
  if (!d || !d.type) return;
  if (d.type === "hello") {
    stopRejoin();
    G.oppName = d.name;
    if (!G.isHost) {
      G.teamSize = d.teamSize || G.teamSize;
    }
    G.oppStats = d.stats || null;
    const inProg = G.stage === "playing" || G.stage === "break";
    if (d.rejoin && G.isHost && inProg) {
      const snap = makeSnap();
      sendMsg({ type: "sync", snap: snap });
      $("waitingOverlay").classList.add("hidden");
      connLog("Resynced " + G.oppName);
      clearWD();
      stopTimer();
      G.state = "idle";
      setTimeout(resumeFromStage, 600);
    } else if (d.rejoin && !G.isHost) {
      normalHello();
    } else if (G.isHost && inProg && G.restored) {
      const snap = makeSnap();
      sendMsg({ type: "sync", snap: snap });
      $("waitingOverlay").classList.add("hidden");
      clearWD();
      stopTimer();
      G.state = "idle";
      setTimeout(resumeFromStage, 600);
    } else normalHello();
  } else if (d.type === "sync") {
    stopRejoin();
    restore(d.snap, false);
    saveSession({ role: "join", room: G.roomId, name: G.myName });
    $("waitingOverlay").classList.add("hidden");
    clearWD();
    stopTimer();
    G.state = "idle";
    setTimeout(resumeFromStage, 600);
  } else if (d.type === "team") {
    G.oppTeam = d.team;
    G.oppPlayers = (d.players || []).map(function (p) {
      return Object.assign({}, p, { bowlingStyle: undefined });
    });
    checkTeams();
  } else if (d.type === "roles") {
    if (d.players && G.oppPlayers.length) {
      d.players.forEach(function (dp) {
        var match = null;
        // Prefer the slot the sender assigned; only fall back to name for a
        // peer still running the old protocol.
        if (typeof dp.idx === "number" && G.oppPlayers[dp.idx]) {
          match = G.oppPlayers[dp.idx];
        } else {
          match = G.oppPlayers.find(function (p) {
            return p.name === dp.name;
          });
        }
        if (match && dp.battingStyle) match.battingStyle = dp.battingStyle;
      });
    }
  } else if (d.type === "toss_start") {
    runTossAnim(d.result, !d.hostWon);
  } else if (d.type === "toss_dec") {
    applyTossDec(d.choice, false);
  } else if (d.type === "choice") {
    G.oppPick = d.value;
    G.oppAuto = d.auto || false;
    checkReveal();
  } else if (d.type === "innings_sync") {
    startInnings(2);
  } else if (d.type === "rematch") {
    doRematch();
  } else if (d.type === "start_match") {
    showMC(false);
  } else if (d.type === "emoji") {
    if (typeof showFloatEmoji === "function") showFloatEmoji(d.emoji, true);
  } else if (d.type === "quickmsg") {
    if (typeof showFloatMsg === "function") showFloatMsg(d.msg, true);
  }
}
function normalHello() {
  connLog(G.oppName + " connected!");
  $("connBadge").style.display = "block";
  $("connName").textContent = G.isHost
    ? G.oppName + " joined!"
    : "Playing with " + G.oppName;
  $("waitTitle").textContent = "Connected!";
  $("waitDesc").textContent = "Starting...";
  $("shareBox").style.display = "none";
  $("btnCopy").style.display = "none";
  $("btnRetry").style.display = "none";
  if (!G.isHost) saveSession({ role: "join", room: G.roomId, name: G.myName });
  setTimeout(() => {
    $("waitingOverlay").classList.add("hidden");
    showTeamSel();
  }, 1500);
}

function resumeFromStage() {
  updAllNames();
  updScore();
  renderBalls();
  updFH();
  showLeave(true);
  if (G.stage === "playing") {
    $("status").innerHTML = '<span class="hl">Resumed!</span>';
    setTimeout(nextBall, 800);
  } else if (G.stage === "break") {
    if (G.isHost) {
      $("innTitle").textContent = "End of 1st Innings";
      const bn = G.iBat ? G.myName : G.oppName;
      const bat = G.iBat ? G.me : G.opp;
      $("innMsg").innerHTML =
        "<b>" +
        bn +
        '</b>: <span class="hl">' +
        bat.score +
        "/" +
        bat.wkts +
        "</span><br/>Target: <b>" +
        (G.target + 1) +
        "</b>";
      $("inningsOverlay").classList.remove("hidden");
    } else {
      $("status").innerHTML = '<span class="hl">Waiting for host...</span>';
    }
  } else if (G.stage === "over") {
    finishMatch();
  } else showTeamSel();
}

function showTeamSel() {
  setStage("teams");
  $("teamOverlay").classList.remove("hidden");
  $("teamVs").textContent = "vs " + G.oppName;
  $("teamWait").style.display = "none";
  $("btnConfirmTeam").disabled = false;
  const ts = $("teamSelect");
  ts.innerHTML = "";
  const addTeam = (k, isCustom) => {
    const b = document.createElement("div");
    b.className = "team-btn";
    b.dataset.team = k;
    if (isCustom) {
      b.innerHTML =
        '<div style="font-size:14px;font-weight:800">' +
        TEAMS[k].name +
        '</div><div style="font-size:9px;opacity:.8">Custom</div>';
    } else {
      b.innerHTML =
        '<div style="font-size:14px;font-weight:800">' +
        k.toUpperCase() +
        '</div><div style="font-size:9px;opacity:.8">' +
        TEAMS[k].name +
        "</div>";
    }
    b.onclick = () => selTeam(k);
    ts.appendChild(b);
  };
  Object.keys(TEAMS).forEach((k) => addTeam(k, false));
  const custom = getCustomTeams();
  custom.forEach((t) => {
    TEAMS["_custom_" + t.id] = t;
    addTeam("_custom_" + t.id, true);
  });
  const createBtn = document.createElement("div");
  createBtn.className = "team-btn";
  createBtn.innerHTML =
    '<div style="font-size:14px;font-weight:800">+</div><div style="font-size:9px;opacity:.8">Create Team</div>';
  createBtn.onclick = () => {
    $("teamOverlay").classList.add("hidden");
    $("teamBuilderOverlay").classList.remove("hidden");
    initTeamBuilder();
  };
  ts.appendChild(createBtn);
}
function selTeam(k) {
  sfx("tap");
  document
    .querySelectorAll(".team-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelector('.team-btn[data-team="' + k + '"]')
    .classList.add("active");
  G.myTeam = k;
  G.myPlayers = TEAMS[k].players.slice();
  const pl = $("playerList");
  pl.innerHTML = "";
  G.myPlayers.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "player-item";
    d.innerHTML =
      "<span>" +
      (i + 1) +
      ". " +
      p.name +
      '</span><span style="font-size:9px;opacity:.7">' +
      p.role +
      "</span>";
    pl.appendChild(d);
  });
}
$("btnConfirmTeam").onclick = () => {
  if (!G.myTeam) {
    toast("Pick a team first", "warn");
    return;
  }
  sfx("tap");
  sendMsg({
    type: "team",
    team: G.myTeam,
    players: G.myPlayers.map(function (p) {
      return Object.assign({}, p, { bowlingStyle: undefined });
    }),
  });
  $("teamWait").style.display = "block";
  $("btnConfirmTeam").disabled = true;
  checkTeams();
};
function checkTeams() {
  if (G.myTeam && G.oppTeam) {
    $("teamOverlay").classList.add("hidden");
    $("btnConfirmTeam").disabled = false;
    if (G.myPlayers.length > 1) {
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
      showRoleAssign(G.myPlayers, "online", function (players) {
        G.myPlayers = players;
        sendMsg({
          type: "roles",
          /* Synced BY INDEX. Matching on name looked fine until the RR squad
             shipped both "Boult" and "Bolt" — one duplicate name silently
             mis-assigned styles for the whole squad. The name rides along only
             so a mismatched squad can be detected and reported. */
          players: players.map(function (p, i) {
            return { idx: i, name: p.name, battingStyle: p.battingStyle };
          }),
        });
        startOnlineToss();
      });
    } else {
      startOnlineToss();
    }
  }
}

function getCustomTeams() {
  try {
    return JSON.parse(localStorage.getItem("hc_custom_teams")) || [];
  } catch (e) {
    return [];
  }
}
function saveCustomTeams(t) {
  localStorage.setItem("hc_custom_teams", JSON.stringify(t));
}
let builderPicks = [];
function initTeamBuilder() {
  builderPicks = [];
  $("teamNameInput").value = "";
  updatePickCount();
  const pool = $("playerPool");
  pool.innerHTML = "";
  ALL_PLAYERS.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "pool-item";
    d.dataset.idx = i;
    const roleCls =
      p.role === "batter" ? "batter" : p.role === "bowler" ? "bowler" : "all";
    d.innerHTML =
      "<span>" +
      p.name +
      '</span><span class="role-badge ' +
      roleCls +
      '">' +
      p.role +
      "</span>";
    d.onclick = () => togglePoolPick(i, d);
    pool.appendChild(d);
  });
}
function togglePoolPick(idx, el) {
  if (builderPicks.includes(idx)) {
    builderPicks = builderPicks.filter((i) => i !== idx);
    el.classList.remove("picked");
  } else if (builderPicks.length < 11) {
    builderPicks.push(idx);
    el.classList.add("picked");
  }
  updatePickCount();
}
function updatePickCount() {
  $("pickCount").textContent = builderPicks.length + "/11";
}
$("btnSaveTeam").onclick = () => {
  if (builderPicks.length !== 11) {
    toast("Pick exactly 11 players", "warn");
    return;
  }
  const name = $("teamNameInput").value.trim() || "My Team";
  const players = builderPicks.map((i) => ALL_PLAYERS[i]);
  const id = Date.now().toString(36);
  const teams = getCustomTeams();
  teams.push({ id, name, players });
  saveCustomTeams(teams);
  TEAMS["_custom_" + id] = { name: name, players: players };
  sfx("tap");
  $("teamBuilderOverlay").classList.add("hidden");
  showTeamSel();
};
$("btnBackTB").onclick = () => {
  $("teamBuilderOverlay").classList.add("hidden");
  showTeamSel();
};

function startOnlineToss() {
  setStage("toss");
  $("tossOverlay").classList.remove("hidden");
  $("tossVs").textContent = G.myName + " vs " + G.oppName;
  $("onlineTossBtns").style.display = "none";
  $("onlineTossDec").style.display = "none";
  $("btnOHeads").disabled = false;
  $("btnOTails").disabled = false;
  $("btnOHeads").classList.remove("sel");
  $("btnOTails").classList.remove("sel");
  const oBox = $("onlineCoinBox");
  if (oBox) oBox.classList.remove("spinning", "win", "lose");
  const oCoin = $("onlineCoin");
  if (oCoin) {
    oCoin.classList.remove("flipping", "landing");
    oCoin.style.transform = "";
    oCoin.style.removeProperty("--coin-total");
  }
  $("tossText").innerHTML = "";
  const sb = $("tossPreStats");
  if (G.oppStats) {
    const s = G.oppStats;
    sb.style.display = "block";
    sb.innerHTML =
      '<div class="pre-stats-box"><div class="pre-stats-title">' +
      G.oppName +
      "</div>" +
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
  } else {
    sb.style.display = "none";
  }
  if (G.isHost) {
    $("tossText").textContent = "Call it!";
    $("onlineTossBtns").style.display = "block";
  } else {
    $("tossText").textContent = G.oppName + " is calling...";
  }
}
$("btnOHeads").onclick = () => callToss("heads");
$("btnOTails").onclick = () => callToss("tails");
function callToss(c) {
  sfx("coin");
  haptic(20);
  const btnCall = c === "heads" ? $("btnOHeads") : $("btnOTails");
  btnCall.classList.add("sel");
  $("btnOHeads").disabled = true;
  $("btnOTails").disabled = true;
  const res = Math.random() < 0.5 ? "heads" : "tails";
  const hostWon = res === c;
  sendMsg({ type: "toss_start", call: c, result: res, hostWon: hostWon });
  runTossAnim(res, hostWon);
}
function runTossAnim(res, winnerIsMe) {
  const w = winnerIsMe ? G.myName : G.oppName;
  const oCoin = $("onlineCoin");
  const oBox = $("onlineCoinBox");
  oBox.classList.remove("win", "lose");
  oBox.classList.add("spinning");
  $("tossText").innerHTML =
    '<span class="toss-msg">Flipping the coin' + tossDotsHTML() + "</span>";
  tossSpin(oCoin, res === "heads");
  setTimeout(() => {
    oBox.classList.remove("spinning");
    tossLand(oCoin, res === "heads");
    setTimeout(() => {
      tossSettle(oCoin, res === "heads");
      if (winnerIsMe) {
        oBox.classList.add("win");
        sfx("win");
        haptic(30);
        $("tossText").innerHTML =
          tossChipHTML(res) +
          '<span class="toss-msg pop">You won the toss!</span>' +
          '<span class="toss-msg sub">Pick bat or bowl first</span>';
        $("onlineTossDec").style.display = "block";
      } else {
        oBox.classList.add("lose");
        sfx("lose");
        $("tossText").innerHTML =
          tossChipHTML(res) +
          '<span class="toss-msg pop"><span class="bot-nm">' +
          w +
          "</span> won the toss</span>" +
          '<span class="toss-msg sub">Waiting for their call' +
          tossDotsHTML() +
          "</span>";
      }
    }, 600);
  }, 2300);
}
$("btnOBat").onclick = () => decToss("bat");
$("btnOBowl").onclick = () => decToss("bowl");
function decToss(c) {
  sfx("tap");
  sendMsg({ type: "toss_dec", choice: c });
  applyTossDec(c, true);
}
function applyTossDec(c, isMy) {
  G.iBat = isMy ? c === "bat" : c === "bowl";
  setStage("prematch");
  $("onlineTossDec").style.display = "none";
  const who = isMy ? G.myName : G.oppName;
  sfx("go");
  $("tossText").innerHTML =
    '<span class="toss-msg pop" style="font-size:15px"><b>' +
    who +
    "</b> chose to <b>" +
    (c === "bat" ? "BAT first</b> <svg class=\"uic bats\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z\"/><path d=\"m9.6 10.4 4 4\"/></svg>" : "BOWL first</b> <svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\"/><path d=\"M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0\"/></svg>") +
    "</span>";
  setTimeout(() => {
    $("tossOverlay").classList.add("hidden");
    showPreMC();
  }, 2200);
}
function showPreMC() {
  setStage("prematch");
  $("mcOverlay").classList.remove("hidden");
  $("mcTitle").textContent = "Ready!";
  $("mcNum").textContent = "3";
  $("mcPlayers").textContent = G.myName + " vs " + G.oppName;
  const sb = $("preMatchStats");
  if (G.oppStats) {
    const s = G.oppStats;
    const rk = getRank(s);
    sb.style.display = "block";
    sb.innerHTML =
      '<div class="pre-stats-box"><div class="pre-stats-title">' +
      G.oppName +
      ' <span class="pre-rank">' +
      rk +
      "</span></div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Career Stats</div>' +
      '<div class="pre-stat-row"><span>Matches</span><b>' +
      s.matches +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Wins</span><b>' +
      s.wins +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Win Rate</span><b>' +
      s.winPct +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Best Streak</span><b>' +
      s.bestWinStreak +
      "</b></div>" +
      "</div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Batting</div>' +
      '<div class="pre-stat-row"><span>Runs</span><b>' +
      s.runs +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Strike Rate</span><b>' +
      s.strikeRate +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Best Score</span><b>' +
      s.highestScore +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Sixes</span><b>' +
      s.sixes +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Fours</span><b>' +
      s.fours +
      "</b></div>" +
      "</div>" +
      '<div class="pre-stats-section"><div class="pre-section-label">Bowling</div>' +
      '<div class="pre-stat-row"><span>Wickets</span><b>' +
      s.wicketsTaken +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Bowling Avg</span><b>' +
      s.bowlingAvg +
      "</b></div>" +
      '<div class="pre-stat-row"><span>Dots</span><b>' +
      s.dots +
      "</b></div>" +
      "</div></div>";
  } else {
    sb.style.display = "none";
  }
  if (G.isHost) {
    $("mcHost").style.display = "block";
    $("mcWait").style.display = "none";
  } else {
    $("mcHost").style.display = "none";
    $("mcWait").style.display = "block";
  }
}
$("btnStart").onclick = () => {
  sfx("tap");
  sendMsg({ type: "start_match" });
  showMC(true);
};
function showMC() {
  $("mcHost").style.display = "none";
  $("mcWait").style.display = "none";
  $("mcTitle").textContent = "Starting!";
  let c = 3;
  $("mcNum").textContent = c;
  sfx("cd");
  const iv = setInterval(() => {
    c--;
    if (c > 0) {
      $("mcNum").textContent = c;
      sfx("cd");
      haptic(20);
    } else {
      clearInterval(iv);
      $("mcNum").textContent = "GO!";
      sfx("start");
      haptic(40);
      setTimeout(() => {
        $("mcOverlay").classList.add("hidden");
        startOnline();
      }, 800);
    }
  }, 1000);
}
function startOnline() {
  G.totalBalls = G.teamSize === 11 ? 120 : G.teamSize * 6;
  G.totalWkts = G.teamSize === 1 ? 1 : G.teamSize === 11 ? 10 : G.teamSize;
  G.freeHit = false;
  setStage("playing");
  updAllNames();
  updScore();
  renderBalls();
  updFH();
  showLeave(true);
  startInnings(1);
}

