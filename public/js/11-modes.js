/* ============================================================================
 FILE: public/js/11-modes.js
 ROLE: HOME MODE ENTRY — ensureUsername() gate + Offline/Online/Instant/Story mode button wiring, opponent persona pre-match stat card, btnProfile. Depends on: offline (13)/online (14)/instant (18)/story (16) entry functions at call-time.
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
  try {
    if (typeof refreshRenameHint === "function") refreshRenameHint();
  } catch (e) {}
  try {
    if (typeof renderGoogleButtons === "function") renderGoogleButtons();
  } catch (e) {}
  if (!window._pendingCbs) window._pendingCbs = [];
  window._pendingCbs.push(cb);
}
$("btnSaveUsername").onclick = () => {
  sfx("tap");
  const v = $("usernameInput").value.trim().slice(0, 24);
  if (!v) {
    $("usernameInput").focus();
    return;
  }
  /* Renames are capped at 2 per device (first naming is free). Programmatic
     identity switches (Google adopt) bypass this — it gates casual renames. */
  const prev =
    typeof getUsername === "function" ? getUsername() || "" : "";
  const isRename =
    !!prev && prev.toLowerCase() !== v.toLowerCase();
  if (isRename && typeof renamesLeft === "function" && renamesLeft() <= 0) {
    toast("No renames left (2 per device)", "warn");
    $("usernameInput").focus();
    return;
  }
  /* Rename (not just first set): carry the old career over explicitly so the
     new name never starts empty while the old record — and the Google link,
     which re-publishes below under the new name — stays intact. */
  const prevStats =
    typeof loadStats === "function" ? loadStats() : null;
  setUsername(v);
  if (isRename && typeof noteRename === "function") noteRename();
  try {
    if (
      prev &&
      prev.toLowerCase() !== v.toLowerCase() &&
      prevStats &&
      (prevStats.matches || 0) > 0
    ) {
      const cur =
        typeof loadStats === "function" ? loadStats() : null;
      if (!cur || (cur.matches || 0) === 0) {
        const base =
          typeof defaultStats === "function" ? defaultStats() : {};
        const merged = Object.assign({}, base, prevStats, { name: v });
        if (typeof saveStats === "function") saveStats(merged);
        else localStorage.setItem("hcp_stats", JSON.stringify(merged));
      }
      /* Re-link Google + push everything under the new name immediately so
         the account never looks logged out. */
      if (
        typeof hcGoogleToken === "function" &&
        hcGoogleToken() &&
        typeof publishProfile === "function"
      )
        publishProfile();
    }
  } catch (e) {}
  const isFresh = !prev;
  $("usernameOverlay").classList.add("hidden");
  updHomeUsername();
  /* First name ever: invite them to type their XI once. Delayed so any
     pending mode screen opens first; Back in the editor reveals it. */
  if (isFresh) {
    try {
      const hasXI =
        typeof loadMyXI === "function" ? !!loadMyXI() : true;
      if (!hasXI)
        setTimeout(() => {
          try {
            if (typeof openMyXI === "function") openMyXI();
          } catch (e) {}
        }, 900);
    } catch (e) {}
  }
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
$("btnUsernameBack").onclick = () => {
  sfx("tap");
  window._pendingCbs = null;
  $("usernameOverlay").classList.add("hidden");
};
$("btnEditName").onclick = () => {
  sfx("tap");
  $("usernameOverlay").classList.remove("hidden");
  $("usernameInput").value = getUsername();
  $("usernameInput").focus();
  window._pendingCbs = null;
  try {
    if (typeof refreshRenameHint === "function") refreshRenameHint();
  } catch (e) {}
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
    if (typeof setLobbyMode === "function") setLobbyMode(!!rid, rid || "");
    else if (rid) {
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
$("modeStory").onclick = () => {
  ensureAudio();
  sfx("tap");
  haptic();
  if (typeof enterStoryMode === "function") enterStoryMode();
};
$("btnProfile").onclick = () => {
  sfx("tap");
  showProfile();
};
