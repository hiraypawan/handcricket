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
  const icon = type === "bat" ? "🏏" : "⚾";
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

function applyGestureRestrictions() {
  try {
    const isBatting = G.iBat;
    const myPlayer = isBatting ? curBatter() : curBowler();
    if (!myPlayer) {
      removeGestureRestrictions();
      return;
    }
    const allowed = getAllowedGestures(myPlayer, isBatting);
    const btns = $("gestureGrid").querySelectorAll(".gesture-btn");
    btns.forEach((b) => {
      const val = parseInt(b.dataset.val);
      const isAllowed = allowed.includes(val);
      b.classList.toggle("restricted", !isAllowed && G.state === "waiting");
    });
  } catch (e) {
    removeGestureRestrictions();
  }
}

function removeGestureRestrictions() {
  $("gestureGrid")
    .querySelectorAll(".gesture-btn")
    .forEach((b) => b.classList.remove("restricted"));
}

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
  if (ts === 2) return { maxAgg: 1, maxDef: 1, minBal: 1 };
  if (ts === 3) return { maxAgg: 1, maxDef: 1, minBal: 1 };
  if (ts === 5) return { maxAgg: 2, maxDef: 2, minBal: 1 };
  return { maxAgg: 4, maxDef: 4, minBal: 3 };
}
function validateRoles() {
  const ts = G.teamSize || 11;
  const lim = getRoleLimits(ts);
  if (!lim) {
    $("roleConstraints").textContent = "Single player — no roles needed";
    $("roleConstraints").style.color = "rgba(122,56,0,.5)";
    $("btnRoleStart").disabled = false;
    return true;
  }
  const bats = roleAssignPlayers.map((p) => p.battingStyle || "balanced");
  const aggCount = bats.filter((s) => s === "aggressive").length;
  const defCount = bats.filter((s) => s === "defensive").length;
  const balCount = bats.filter((s) => s === "balanced").length;
  const ok =
    aggCount <= lim.maxAgg && defCount <= lim.maxDef && balCount >= lim.minBal;
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
    ts +
    " (min " +
    lim.minBal +
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
    const remaining = n - aggCount - defCount - balCount;
    const needBal = minBal - balCount;
    if (remaining <= needBal) {
      style = "balanced";
    } else {
      const avail = [];
      if (aggCount < maxAgg) avail.push("aggressive");
      if (defCount < maxDef) avail.push("defensive");
      avail.push("balanced");
      style = avail[Math.floor(Math.random() * avail.length)];
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
