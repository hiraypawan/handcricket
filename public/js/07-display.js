/* ============================================================================
 FILE: public/js/07-display.js
 ROLE: IN-GAME HUD + TOSS COIN — scoreboard updates (updScore/updCenterCard/updAllNames/popScore/renderBalls), labels (gLabel/oversStr), flash(), number reveal, countdown (showCD), shake()/confetti(), gesture-grid setBtns(), showLeave(), updBotLvl(), watchdog armWD/clearWD, shared toss-coin animation (tossSpin/tossLand/tossSettle). Depends on: G (03), BotAI (02) at call-time.
============================================================================ */

function gLabel(v) {
  return v == null ? "-" : v === 6 ? "SIX!" : v + (v === 1 ? " run" : " runs");
}
function oversStr(b) {
  const ov = Math.floor(G.totalBalls / 6);
  return Math.floor(b / 6) + "." + (b % 6) + " / " + ov + " ov";
}
function updScore() {
  $("scoreA").textContent = G.me.score;
  $("wicketsA").textContent = G.me.wkts;
  $("ballsA").textContent = oversStr(G.me.balls);
  $("scoreB").textContent = G.opp.score;
  $("wicketsB").textContent = G.opp.wkts;
  $("ballsB").textContent = oversStr(G.opp.balls);
  $("batA").style.display = G.iBat ? "inline-block" : "none";
  $("batB").style.display = G.iBat ? "none" : "inline-block";
  updatePlayerDisplay();
  // Update player cards
  if ($("pcScoreA")) $("pcScoreA").textContent = G.me.score;
  if ($("pcWktsA")) $("pcWktsA").textContent = G.me.wkts;
  if ($("pcBallsA")) $("pcBallsA").textContent = G.me.balls + " balls";
  if ($("pcScoreB")) $("pcScoreB").textContent = G.opp.score;
  if ($("pcWktsB")) $("pcWktsB").textContent = G.opp.wkts;
  if ($("pcBallsB")) $("pcBallsB").textContent = G.opp.balls + " balls";
  if ($("pcBadgeA")) $("pcBadgeA").textContent = G.iBat ? "BATTING" : "BOWLING";
  if ($("pcBadgeB")) $("pcBadgeB").textContent = G.iBat ? "BOWLING" : "BATTING";
  // Update center card
  updCenterCard();
}
function updCenterCard() {
  const ov = G.me.balls > 0 ? oversStr(G.me.balls) : "0.0";
  const crr =
    G.me.balls > 0 ? (G.me.score / (G.me.balls / 6)).toFixed(1) : "0.0";
  const ballsLeft = Math.max(0, G.totalBalls - G.me.balls);
  const rrr =
    G.me.balls > 0 && G.target > 0
      ? ((G.target - G.me.score) / (ballsLeft / 6)).toFixed(1)
      : "0.0";
  const defend = Math.max(0, G.target - G.me.score);
  if ($("ccOver")) $("ccOver").textContent = ov;
  if ($("ccCRR")) $("ccCRR").textContent = crr;
  if ($("ccRRR")) $("ccRRR").textContent = rrr;
  if ($("ccDefend")) $("ccDefend").textContent = G.target > 0 ? defend : "-";
  if ($("ccBalls")) $("ccBalls").textContent = ballsLeft;
}
function updAllNames() {
  const a = G.myName || "YOU",
    b = G.oppName || "BOT";
  if ($("labelA")) $("labelA").textContent = a;
  if ($("labelB")) $("labelB").textContent = b;
  if ($("nameA")) $("nameA").textContent = a;
  if ($("nameB")) $("nameB").textContent = b;
  if ($("pcNameA")) $("pcNameA").textContent = a;
  if ($("pcNameB")) $("pcNameB").textContent = b;
}
function popScore(s) {
  const el = s === "A" ? $("scoreBoxA") : $("scoreBoxB");
  if (!el) return;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}
function renderBalls() {
  $("ballsRow").innerHTML = "";
  const bat = G.iBat ? G.me : G.opp;
  const max = Math.min(G.totalBalls, 36);
  for (let i = 0; i < max; i++) {
    const d = document.createElement("div");
    d.className = "ball-dot";
    if (i < bat.hist.length) {
      d.classList.add("done");
      const h = bat.hist[i];
      if (h === "W") {
        d.classList.add("wicket");
        d.textContent = "W";
      } else if (h === 6) {
        d.classList.add("six");
        d.textContent = "6";
      } else if (h === "NB") {
        d.classList.add("noball");
        d.textContent = "NB";
      } else if (h === "DOT") {
        d.classList.add("dotball");
        d.textContent = ".";
      } else d.textContent = h;
    }
    $("ballsRow").appendChild(d);
  }
}
function updFH() {
  $("fhBanner").classList.toggle("show", G.freeHit);
}
function flash(t, c) {
  const f = $("flash");
  f.className = "flash " + (c || "");
  f.textContent = t;
  void f.offsetWidth;
  f.classList.add("show");
  setTimeout(() => f.classList.remove("show"), 1100);
}
const NR_WORDS = {
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
  6: "SIX",
};
function showNumberReveal(val) {
  const nr = $("numberReveal");
  const num = $("nrNum");
  const txt = $("nrText");
  if (!nr || val == null) return;
  num.textContent = val;
  txt.textContent = NR_WORDS[val] || "";
  nr.classList.remove("show");
  void nr.offsetWidth;
  nr.classList.add("show");
  setTimeout(() => nr.classList.remove("show"), 1200);
}
function showCD(n) {
  const c = $("countdown");
  c.textContent = n;
  c.classList.remove("go");
  void c.offsetWidth;
  c.classList.add("go");
}
function shake() {
  const a = $("app");
  a.classList.remove("shake");
  void a.offsetWidth;
  a.classList.add("shake");
  haptic(40);
  setTimeout(() => a.classList.remove("shake"), 500);
}
function confetti(n) {
  const cols = [
    "#f59e0b",
    "#d97706",
    "#ef4444",
    "#34d399",
    "#60a5fa",
    "#a855f7",
  ];
  const ar = document.querySelector(".arena");
  for (let i = 0; i < (n || 30); i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.background = cols[Math.floor(Math.random() * cols.length)];
    const a = Math.random() * Math.PI * 2,
      d = 120 + Math.random() * 200,
      dx = Math.cos(a) * d,
      dy = Math.sin(a) * d,
      r = Math.random() * 720;
    c.animate(
      [
        { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
        {
          transform:
            "translate(calc(-50% + " +
            dx +
            "px),calc(-50% + " +
            dy +
            "px)) scale(1.2) rotate(" +
            r +
            "deg)",
          opacity: 0,
        },
      ],
      {
        duration: 900 + Math.random() * 400,
        easing: "cubic-bezier(.2,.7,.3,1)",
      },
    );
    ar.appendChild(c);
    setTimeout(() => c.remove(), 1400);
  }
}
function setBtns(en) {
  $("gestureGrid")
    .querySelectorAll(".gesture-btn")
    .forEach((b) => {
      b.classList.toggle("disabled", !en);
      b.classList.remove("selected");
    });
}
function showLeave(s) {
  $("leaveBtn").style.display = s ? "block" : "none";
}
function updBotLvl() {
  if (G.mode === "offline") $("botLvl").textContent = "Bot: " + BotAI.level();
  else $("botLvl").textContent = "";
}
function armWD() {
  clearWD();
  G.watchdog = setTimeout(() => {
    if (G.state === "revealing" || G.state === "processing") nextBall();
  }, WATCHDOG);
}
function clearWD() {
  if (G.watchdog) {
    clearTimeout(G.watchdog);
    G.watchdog = null;
  }
}

/* ================= TOSS COIN ANIMATION (shared: offline + online) =================
   One continuous flip: JS picks --coin-total so the spin ENDS on the winning
   face (6 full turns for heads, 6.5 for tails) — the old code always stopped
   heads-up then snapped the coin to tails mid-air (looked broken).
   Timeline: tossSpin (2.3s flip) → tossLand (0.55s bounce) → tossSettle. */
function tossSpin(coinEl, isHeads) {
  if (!coinEl) return;
  coinEl.classList.remove("flipping", "landing");
  coinEl.style.setProperty("--coin-total", (isHeads ? 2160 : 2340) + "deg");
  void coinEl.offsetWidth; // restart animation
  coinEl.classList.add("flipping");
}
function tossLand(coinEl, isHeads) {
  if (!coinEl) return;
  coinEl.classList.remove("flipping");
  coinEl.style.setProperty("--coin-total", (isHeads ? 2160 : 2340) + "deg");
  void coinEl.offsetWidth;
  coinEl.classList.add("landing");
}
function tossSettle(coinEl, isHeads) {
  if (!coinEl) return;
  coinEl.classList.remove("flipping", "landing");
  coinEl.style.transform = isHeads ? "rotateY(0deg)" : "rotateY(180deg)";
}
// Small reusable builders for the result reveal
function tossChipHTML(faceRes) {
  const ico =
    faceRes === "tails"
      ? '<svg class="uic" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9z" fill="currentColor"/></svg>'
      : '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M5.2 8.4c4.5 2 9.1 2 13.6 0M5.2 15.6c4.5-2 9.1-2 13.6 0"/></svg>';
  return (
    '<span class="toss-face-chip' +
    (faceRes === "tails" ? " t" : "") +
    ' pop">' +
    ico +
    (faceRes === "tails" ? "TAILS" : "HEADS") +
    "</span>"
  );
}
function tossDotsHTML() {
  return '<span class="toss-dots"><i></i><i></i><i></i></span>';
}
