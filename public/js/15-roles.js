/* ============================================================================
 FILE: public/js/15-roles.js
 ROLE: ROLE SYSTEM — ROLE_COLORS/LABELS, getRoleBadgeHTML, applyGestureRestrictions/removeGestureRestrictions, revealBowlerRole, role assignment overlay (showRoleAssign/renderRoleGrid/getRoleLimits/validateRoles + buttons). Depends on: G, curBatter/curBowler (09).
============================================================================ */

const ROLE_COLORS = { aggressive: "agg", defensive: "def", balanced: "bal" };
const ROLE_LABELS = { aggressive: "AGG", defensive: "DEF", balanced: "BAL" };
const ROLE_LABELS_FULL = {
  aggressive: "Aggressive",
  defensive: "Defensive",
  balanced: "Balanced",
};

function getRoleBadgeHTML(style, type) {
  const cls = ROLE_COLORS[style] || "bal";
  const label = ROLE_LABELS[style] || "BAL";
  const icon =
    type === "bat"
      ? '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.8 3.8 20.2 9.2a2 2 0 0 1 0 2.8l-5.9 5.9a3.6 3.6 0 0 1-5 0l-.8-.8a3.6 3.6 0 0 1 0-5l5.9-5.9a2 2 0 0 1 2.8 0z"/><path d="m9.6 10.4 4 4"/></svg>'
      : '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0"/></svg>';
  return (
    '<span class="role-badge-inline ' +
    cls +
    '">' +
    icon +
    " " +
    label +
    "</span>"
  );
}

/* v2.8 ROLE LOCK EXPLANATIONS
   A greyed number used to give the player no clue why it was disabled. Every
   locked button now carries the reason, the arena shows a one-line summary of
   the active role, and tapping a locked number repeats the reason. */
const ROLE_LOCK_COPY = {
  aggressive: {
    bat: "Aggressive batter — only 4, 5, 6 allowed",
    bowl: "Aggressive bowler — only 4, 5, 6 allowed",
  },
  defensive: {
    bat: "Defensive batter — only 1, 2, 3 allowed",
    bowl: "Defensive bowler — only 1, 2, 3 allowed",
  },
  balanced: { bat: "", bowl: "" },
};

function setRoleHint(player, isBatting, lockedCount) {
  const el = $("roleHint");
  if (!el) return;
  const style = (isBatting ? player && player.battingStyle : player && player.bowlingStyle) || "balanced";
  if (!lockedCount || style === "balanced") {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  const cls = ROLE_COLORS[style] || "bal";
  const copy = (ROLE_LOCK_COPY[style] || {})[isBatting ? "bat" : "bowl"] || "";
  el.innerHTML =
    '<span class="role-legend"><span class="lg-' +
    cls +
    '">' +
    escHtml(player.name || "") +
    " \u00b7 " +
    (ROLE_LABELS_FULL[style] || "") +
    (isBatting ? " (batting)" : " (bowling)") +
    "</span><span>" +
    escHtml(copy) +
    "</span></span>";
  el.classList.remove("hidden");
}

function applyGestureRestrictions() {
  try {
    const isBatting = G.iBat;
    const myPlayer = isBatting ? curBatter() : curBowler();
    if (!myPlayer) {
      removeGestureRestrictions();
      return;
    }
    const allowed = getAllowedGestures(myPlayer, isBatting);
    const style =
      (isBatting ? myPlayer.battingStyle : myPlayer.bowlingStyle) || "balanced";
    const reason = (ROLE_LOCK_COPY[style] || {})[isBatting ? "bat" : "bowl"] || "";
    const btns = $("gestureGrid").querySelectorAll(".gesture-btn");
    let locked = 0;
    btns.forEach((b) => {
      const val = parseInt(b.dataset.val);
      const isAllowed = allowed.includes(val);
      const lock = !isAllowed && G.state === "waiting";
      b.classList.toggle("restricted", lock);
      if (lock) {
        locked++;
        b.dataset.lockReason = reason || "Locked by this player's role";
        b.setAttribute("aria-disabled", "true");
        b.title = b.dataset.lockReason;
      } else {
        b.removeAttribute("data-lock-reason");
        b.removeAttribute("aria-disabled");
        b.title = "";
      }
    });
    setRoleHint(myPlayer, isBatting, locked);
  } catch (e) {
    removeGestureRestrictions();
  }
}

function removeGestureRestrictions() {
  $("gestureGrid")
    .querySelectorAll(".gesture-btn")
    .forEach((b) => {
      b.classList.remove("restricted", "lock-hint");
      b.removeAttribute("data-lock-reason");
      b.removeAttribute("aria-disabled");
    });
  const el = $("roleHint");
  if (el) {
    el.classList.add("hidden");
    el.textContent = "";
  }
}

/* Tapping a locked number tells you why instead of doing nothing. */
(function () {
  const grid = $("gestureGrid");
  if (!grid) return;
  grid.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest && e.target.closest(".gesture-btn.restricted");
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      grid.querySelectorAll(".gesture-btn").forEach((b) => b.classList.remove("lock-hint"));
      btn.classList.add("lock-hint");
      if (typeof toast === "function") toast(btn.dataset.lockReason || "Locked by this player's role", "warn");
      if (typeof haptic === "function") haptic(12);
      setTimeout(() => btn.classList.remove("lock-hint"), 2200);
    },
    true,
  );
})();

// Bowler role reveal after wicket or over
function revealBowlerRole(isWicket) {
  const bowler = curBowler(); // side-aware (C2): always the bowling side's bowler
  if (!bowler || !bowler.bowlingStyle || bowler.bowlingStyle === "balanced")
    return;
  const style = bowler.bowlingStyle;
  const cls = ROLE_COLORS[style];
  const label = ROLE_LABELS_FULL[style];
  const reason = isWicket ? "Wicket taken!" : "Over completed!";
  const banner = $("roleRevealBanner");
  banner.innerHTML =
    reason +
    " " +
    bowler.name +
    ' was bowling — <span class="hl-' +
    cls +
    '">' +
    label +
    " Style</span>";
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), 2500);
}

// Role assignment overlay
let roleAssignCallback = null;
let roleAssignPlayers = [];
let roleAssignMode = "story"; // 'story', 'offline', 'online', 'instant'

function showRoleAssign(players, mode, callback) {
  roleAssignPlayers = players;
  roleAssignMode = mode;
  roleAssignCallback = callback;
  renderRoleGrid();
  $("roleAssignOverlay").classList.remove("hidden");

  /* v2.9: "Auto-pick my XI". In 5v5 and 11v11 this screen asks for six or
     twenty-two decisions before the match starts, which is why team formats
     felt like homework. One tap fills a legal squad — openers attack, the tail
     defends, and getRoleLimits() is respected. Everything stays editable
     afterwards, so it is a starting point, not a lock-in. */
  const autoBtn = $("btnAutoRoles");
  if (autoBtn) {
    autoBtn.style.display = roleAssignPlayers.length > 1 ? "inline-block" : "none";
    autoBtn.onclick = () => {
      sfx("tap");
      if (typeof hcAutoPickRoles !== "function") return;
      roleAssignPlayers = hcAutoPickRoles(roleAssignPlayers, G.teamSize || roleAssignPlayers.length);
      renderRoleGrid();
      if (typeof toast === "function") toast("Squad styles auto-picked — tap any row to change", "good");
    };
  }
}

function renderRoleGrid() {
  const grid = $("roleAssignGrid");
  grid.innerHTML = "";
  roleAssignPlayers.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "role-row";
    const batStyle = p.battingStyle || "balanced";
    const bowlStyle = p.bowlingStyle || "balanced";
    const showBowl = true;
    row.innerHTML =
      '<div class="num">' +
      (i + 1) +
      "</div>" +
      '<div><div class="pname">' +
      p.name +
      '</div><div class="ptype">' +
      p.role +
      "</div></div>" +
      '<div class="role-select">' +
      '<button data-role="aggressive" data-idx="' +
      i +
      '" data-field="battingStyle" class="' +
      (batStyle === "aggressive" ? "sel-agg" : "") +
      '">AGG</button>' +
      '<button data-role="defensive" data-idx="' +
      i +
      '" data-field="battingStyle" class="' +
      (batStyle === "defensive" ? "sel-def" : "") +
      '">DEF</button>' +
      '<button data-role="balanced" data-idx="' +
      i +
      '" data-field="battingStyle" class="' +
      (batStyle === "balanced" ? "sel-bal" : "") +
      '">BAL</button>' +
      "</div>" +
      (showBowl
        ? '<div class="role-bowl-select">' +
          '<button data-role="aggressive" data-idx="' +
          i +
          '" data-field="bowlingStyle" class="' +
          (bowlStyle === "aggressive" ? "sel-agg" : "") +
          '">A</button>' +
          '<button data-role="defensive" data-idx="' +
          i +
          '" data-field="bowlingStyle" class="' +
          (bowlStyle === "defensive" ? "sel-def" : "") +
          '">D</button>' +
          '<button data-role="balanced" data-idx="' +
          i +
          '" data-field="bowlingStyle" class="' +
          (bowlStyle === "balanced" ? "sel-bal" : "") +
          '">B</button>' +
          "</div>"
        : '<div style="width:52px"></div>');
    grid.appendChild(row);
  });
  grid.querySelectorAll("button[data-role]").forEach((btn) => {
    btn.onclick = () => {
      sfx("tap");
      const idx = parseInt(btn.dataset.idx);
      const field = btn.dataset.field;
      const role = btn.dataset.role;
      roleAssignPlayers[idx][field] = role;
      renderRoleGrid();
      validateRoles();
    };
  });
  validateRoles();
}

function getRoleLimits(ts) {
  if (ts <= 1) return null;
  if (ts === 2) return { maxAgg: 1, maxDef: 1, minBal: 1, maxBal: 1 };
  if (ts === 3) return { maxAgg: 1, maxDef: 1, minBal: 1, maxBal: 2 };
  if (ts === 5) return { maxAgg: 2, maxDef: 2, minBal: 1, maxBal: 3 };
  return { maxAgg: 4, maxDef: 4, minBal: 3, maxBal: 7 };
}
function validateRoles() {
  /* Validate the squad actually on screen — not G.teamSize, which can be
     stale (or belong to another mode) when this overlay opens. */
  const n = (roleAssignPlayers && roleAssignPlayers.length) || G.teamSize || 11;
  const lim = getRoleLimits(n);
  if (!lim) {
    $("roleConstraints").textContent = "Single player — no roles needed";
    $("roleConstraints").style.color = "rgba(148,163,184,.75)";
    $("btnRoleStart").disabled = false;
    return true;
  }
  const bats = roleAssignPlayers.map((p) => p.battingStyle || "balanced");
  const aggCount = bats.filter((s) => s === "aggressive").length;
  const defCount = bats.filter((s) => s === "defensive").length;
  const balCount = bats.filter((s) => s === "balanced").length;
  const ok =
    aggCount <= lim.maxAgg &&
    defCount <= lim.maxDef &&
    balCount >= lim.minBal &&
    balCount <= lim.maxBal;
  $("roleConstraints").textContent =
    "Aggressive: " +
    aggCount +
    "/" +
    lim.maxAgg +
    " | Defensive: " +
    defCount +
    "/" +
    lim.maxDef +
    " | Balanced: " +
    balCount +
    "/" +
    n +
    " (" +
    lim.minBal +
    "-" +
    lim.maxBal +
    ")";
  $("roleConstraints").style.color = ok ? "var(--teal)" : "#c1121f";
  $("btnRoleStart").disabled = !ok;
  return ok;
}

$("btnRoleAllBal").onclick = () => {
  sfx("tap");
  roleAssignPlayers.forEach((p) => {
    p.battingStyle = "balanced";
    p.bowlingStyle = "balanced";
  });
  renderRoleGrid();
};
$("btnRoleRandom").onclick = () => {
  sfx("tap");
  const ts = G.teamSize || 11;
  const lim = getRoleLimits(ts);
  const styles = ["aggressive", "defensive", "balanced"];
  const n = roleAssignPlayers.length;
  let aggCount = 0,
    defCount = 0,
    balCount = 0;
  roleAssignPlayers.forEach((p) => {
    let style;
    const maxAgg = lim ? lim.maxAgg : 4;
    const maxDef = lim ? lim.maxDef : 4;
    const minBal = lim ? lim.minBal : 1;
    const maxBal = lim ? lim.maxBal : n;
    const remaining = n - aggCount - defCount - balCount;
    const needBal = minBal - balCount;
    if (remaining <= needBal) {
      style = "balanced";
    } else {
      const avail = [];
      if (aggCount < maxAgg) avail.push("aggressive");
      if (defCount < maxDef) avail.push("defensive");
      if (balCount < maxBal) avail.push("balanced");
      style = avail.length
        ? avail[Math.floor(Math.random() * avail.length)]
        : "balanced";
    }
    p.battingStyle = style;
    p.bowlingStyle = styles[Math.floor(Math.random() * 3)];
    if (style === "aggressive") aggCount++;
    else if (style === "defensive") defCount++;
    else balCount++;
  });
  renderRoleGrid();
};
$("btnRoleReal").onclick = () => {
  sfx("tap");
  roleAssignPlayers.forEach((p) => {
    if (p._realBattingStyle) p.battingStyle = p._realBattingStyle;
    else if (p.role === "batter") p.battingStyle = "aggressive";
    else if (p.role === "bowler") p.battingStyle = "defensive";
    else p.battingStyle = "balanced";
    if (p._realBowlingStyle) p.bowlingStyle = p._realBowlingStyle;
    else if (p.role === "bowler") p.bowlingStyle = "aggressive";
    else if (p.role === "batter") p.bowlingStyle = "balanced";
    else p.bowlingStyle = "balanced";
  });
  renderRoleGrid();
};
$("btnRoleStart").onclick = () => {
  sfx("tap");
  if (!validateRoles()) return;
  $("roleAssignOverlay").classList.add("hidden");
  if (roleAssignCallback) roleAssignCallback(roleAssignPlayers);
};
$("btnRoleBack").onclick = () => {
  sfx("tap");
  $("roleAssignOverlay").classList.add("hidden");
};
$("btnRoleBack").className = "back-btn";

// ---- STORY MODE ----
