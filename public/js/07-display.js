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
/* SIDES ARE LOCKED: scoreboard LEFT (A) is always the OPPONENT, RIGHT (B)
   is always YOU (highlighted .you) — matching the arena (opp hand left,
   your hand right). Only indicators change with G.iBat; sides never swap. */
function updScore() {
  $("scoreA").textContent = G.opp.score;
  $("wicketsA").textContent = G.opp.wkts;
  $("ballsA").textContent = oversStr(G.opp.balls);
  $("scoreB").textContent = G.me.score;
  $("wicketsB").textContent = G.me.wkts;
  $("ballsB").textContent = oversStr(G.me.balls);
  $("batA").style.display = G.iBat ? "none" : "inline-block";
  $("batB").style.display = G.iBat ? "inline-block" : "none";
  updatePlayerDisplay();
  // Update player cards (pcLeft = opponent, pcRight = you)
  if ($("pcScoreA")) $("pcScoreA").textContent = G.opp.score;
  if ($("pcWktsA")) $("pcWktsA").textContent = G.opp.wkts;
  if ($("pcBallsA")) $("pcBallsA").textContent = G.opp.balls + " balls";
  if ($("pcScoreB")) $("pcScoreB").textContent = G.me.score;
  if ($("pcWktsB")) $("pcWktsB").textContent = G.me.wkts;
  if ($("pcBallsB")) $("pcBallsB").textContent = G.me.balls + " balls";
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
  const me = G.myName || "YOU",
    op = G.oppName || "Opponent";
  if ($("labelA")) $("labelA").textContent = op;
  if ($("labelB")) $("labelB").textContent = me;
  if ($("nameA")) $("nameA").textContent = op;
  if ($("nameB")) $("nameB").textContent = me;
  if ($("pcNameA")) $("pcNameA").textContent = op;
  if ($("pcNameB")) $("pcNameB").textContent = me;
  /* persistent YOU highlight on the right side */
  if ($("teamA")) $("teamA").classList.remove("you");
  if ($("teamB")) $("teamB").classList.add("you");
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
  const el = $("botLvl");
  if (!el) return;
  if (G.mode === "online") {
    el.textContent = "";
    return;
  }
  /* v2.8: the chip under the opponent's score used to read "Bot: 3". It now
     shows who they are — home city and rank — like any other player card. */
  const p = G.botProfile || null;
  const bits = [];
  if (p && p.city) bits.push(p.city);
  const rk = getRank(G.oppStats || p);
  if (rk) bits.push(rk);
  el.textContent = bits.join(" \u00b7 ");
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

/* ============================================================================
   SHARED LIVE TOSS — one coin both sides watch (quick, story, online).
   The CALLER alternates every match via hcp_toss_turn ("me"|"opp" calls
   NEXT); the first toss ever is random. Online: the host decides with
   tossTakeTurn() and sends {type:'toss_caller'} so both screens agree; the
   joiner mirrors with tossAlignTurn(). Never decide a caller per-device on
   both ends or the screens disagree.
   ============================================================================ */
function tossTakeTurn() {
  let cur = null;
  try {
    cur = localStorage.getItem("hcp_toss_turn");
  } catch (e) {}
  const caller =
    cur === "me" || cur === "opp" ? cur : Math.random() < 0.5 ? "me" : "opp";
  try {
    localStorage.setItem("hcp_toss_turn", caller === "me" ? "opp" : "me");
  } catch (e) {}
  return caller;
}
function tossAlignTurn(callerFromMyView) {
  try {
    localStorage.setItem(
      "hcp_toss_turn",
      callerFromMyView === "me" ? "opp" : "me",
    );
  } catch (e) {}
}
function tossEsc(x) {
  return String(x == null ? "" : x)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function tossResetSharedUI(meN, opN) {
  setStage("toss");
  $("tossOverlay").classList.remove("hidden");
  $("tossVs").textContent = meN + " vs " + opN;
  $("onlineTossBtns").style.display = "none";
  $("onlineTossDec").style.display = "none";
  ["btnOHeads", "btnOTails"].forEach((id) => {
    const b = $(id);
    b.disabled = false;
    b.classList.remove("sel");
  });
  const oBox = $("onlineCoinBox");
  if (oBox) oBox.classList.remove("spinning", "win", "lose");
  const oCoin = $("onlineCoin");
  if (oCoin) {
    oCoin.classList.remove("flipping", "landing");
    oCoin.style.transform = "";
    oCoin.style.removeProperty("--coin-total");
  }
  const sb = $("tossPreStats");
  if (sb) sb.style.display = "none";
  $("tossText").innerHTML = "";
}
/* Bot-mode live toss: the human AND the bot watch the same coin on this
   screen. o = {caller:'me'|'opp', meName, oppName, hi:bool,
   onDone(iBatMeFirst)}. Overlay buttons are steered into this flow and
   restored to the online handlers afterwards. */
function startLiveToss(o) {
  const gen = (window.__tossGen = (window.__tossGen || 0) + 1);
  const meN = o.meName || (typeof G !== "undefined" && G.myName) || "YOU";
  const opN = o.oppName || (typeof G !== "undefined" && G.oppName) || "Opponent";
  tossResetSharedUI(meN, opN);
  const T = {
    bot: true,
    gen,
    caller: o.caller,
    winner: null,
    done: false,
    onDone: o.onDone,
    meN,
    opN,
    hi: !!o.hi,
  };
  window.__toss = T;
  $("btnOHeads").onclick = () => botTossFlip("heads", T);
  $("btnOTails").onclick = () => botTossFlip("tails", T);
  $("btnOBat").onclick = () => botTossDecide("bat", T);
  $("btnOBowl").onclick = () => botTossDecide("bowl", T);
  if (o.caller === "me") {
    $("tossText").textContent = T.hi
      ? "Toss uchhalo! Heads ya Tails?"
      : "Your call — heads or tails?";
    $("onlineTossBtns").style.display = "block";
  } else {
    $("tossText").innerHTML =
      "<span class='toss-msg'>" + tossEsc(opN) + " is calling...</span>";
    setTimeout(() => {
      if (window.__toss !== T || T.done) return;
      botTossFlip(Math.random() < 0.5 ? "heads" : "tails", T);
    }, 1100);
  }
}
function botTossFlip(call, T) {
  if (!T || T.done || window.__toss !== T) return;
  sfx("coin");
  haptic(20);
  const btnCall = call === "heads" ? $("btnOHeads") : $("btnOTails");
  btnCall.classList.add("sel");
  $("btnOHeads").disabled = true;
  $("btnOTails").disabled = true;
  /* keep the buttons visible (disabled) so both sides see who called what */
  $("onlineTossBtns").style.display = "block";
  const res = Math.random() < 0.5 ? "heads" : "tails";
  T.winner = res === call ? T.caller : T.caller === "me" ? "opp" : "me";
  const oCoin = $("onlineCoin"),
    oBox = $("onlineCoinBox");
  oBox.classList.remove("win", "lose");
  oBox.classList.add("spinning");
  $("tossText").innerHTML =
    '<span class="toss-msg">' +
    (T.caller === "me"
      ? "You called <b>" + call + "</b>"
      : tossEsc(T.opN) + " called <b>" + call + "</b>") +
    " — flipping" +
    tossDotsHTML() +
    "</span>";
  tossSpin(oCoin, res === "heads");
  setTimeout(() => {
    if (window.__toss !== T || T.done) return;
    oBox.classList.remove("spinning");
    tossLand(oCoin, res === "heads");
    setTimeout(() => {
      if (window.__toss !== T || T.done) return;
      tossSettle(oCoin, res === "heads");
      if (T.winner === "me") {
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
          '<span class="toss-msg pop">' +
          tossEsc(T.opN) +
          " won the toss</span>" +
          '<span class="toss-msg sub">Choosing' +
          tossDotsHTML() +
          "</span>";
        setTimeout(() => {
          if (window.__toss !== T || T.done) return;
          botTossDecide(Math.random() < 0.5 ? "bat" : "bowl", T);
        }, 1400);
      }
    }, 600);
  }, 2300);
}
function botTossDecide(choice, T) {
  if (!T || T.done || window.__toss !== T) return;
  T.done = true;
  const iBat = T.winner === "me" ? choice === "bat" : choice === "bowl";
  const who = T.winner === "me" ? "You" : T.opN;
  sfx("go");
  $("onlineTossDec").style.display = "none";
  $("tossText").innerHTML =
    '<span class="toss-msg pop"><b>' +
    tossEsc(who) +
    "</b> chose to <b>" +
    (choice === "bat" ? "BAT" : "BOWL") +
    " first</b></span>";
  setTimeout(() => {
    endLiveToss();
    if (typeof T.onDone === "function") T.onDone(iBat);
  }, 1800);
}
function endLiveToss() {
  window.__toss = null;
  $("tossOverlay").classList.add("hidden");
  /* restore the online handlers for real P2P tosses */
  $("btnOHeads").onclick = () => callToss("heads");
  $("btnOTails").onclick = () => callToss("tails");
  $("btnOBat").onclick = () => decToss("bat");
  $("btnOBowl").onclick = () => decToss("bowl");
}

/* ============================================================================
   v2.8 IN-APP FEEDBACK — replaces every native alert()/confirm().
   Native dialogs block the render thread, ignore the theme and cannot be
   dismissed with the app's own chrome.
============================================================================ */
function toast(msg, kind) {
  const host = $("toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast" + (kind ? " toast-" + kind : "");
  el.textContent = String(msg == null ? "" : msg);
  host.appendChild(el);
  // keep at most 3 on screen
  while (host.children.length > 3) host.removeChild(host.firstChild);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

let confirmWired = false;
let confirmResolve = null;
/* Promise-based replacement for window.confirm(). Resolves false if the sheet
   is dismissed any other way. */
function confirmDialog(title, msg, yesLabel) {
  return new Promise((resolve) => {
    const ov = $("confirmOverlay");
    if (!ov) {
      resolve(true);
      return;
    }
    if (confirmResolve) confirmResolve(false);
    confirmResolve = resolve;
    $("confirmTitle").textContent = title || "Are you sure?";
    $("confirmMsg").textContent = msg || "";
    $("btnConfirmYes").textContent = yesLabel || "Yes";
    ov.classList.remove("hidden");
    if (!confirmWired) {
      confirmWired = true;
      const done = (v) => {
        ov.classList.add("hidden");
        const r = confirmResolve;
        confirmResolve = null;
        if (r) r(v);
      };
      $("btnConfirmYes").onclick = () => {
        sfx("tap");
        done(true);
      };
      $("btnConfirmNo").onclick = () => {
        sfx("tap");
        done(false);
      };
    }
  });
}
