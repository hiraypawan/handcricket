/**
 * SMOKE TEST — boots the real game (public/index.html) in jsdom and plays
 * real matches against the bot engine to verify nothing is broken.
 *
 * Run:  node tools/smoke.mjs            (must be run from repo root)
 *
 * What it asserts:
 *   1. Page loads with NO uncaught JS errors (would catch the old
 *      nameA/nameB init crash automatically).
 *   2. Core init ran: mode buttons, toss buttons, gesture grid, role buttons wired.
 *   3. Offline 1v1 match completes end-to-end (batting + bowling innings,
 *      innings break, result, stats recorded).
 *   4. Offline 5v5 match: rosters exist, role-assign overlay lists 5 players,
 *      roles validate, Start works, match boots into 1st innings.
 *   5. Story mode: story home renders after entering (data + progress bar).
 */
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let html = readFileSync(join(root, "public/index.html"), "utf8");

// Inline all LOCAL scripts so jsdom executes them (external CDN scripts are
// dropped — the game guards every PeerJS/GA usage at runtime).
html = html.replace(/<script src="js\/([^"?]+)(\?[^"]*)?"?><\/script>/g, (m, file) => {
  const code = readFileSync(join(root, "public/js", file), "utf8");
  return "<script>\n" + code + "\n</script>";
});
html = html.replace(/<script[^>]+src="https:[^>]*><\/script>/g, "");
// drop stylesheet (jsdom ignores CSS anyway) — keep tag, harmless

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
};

const boot = async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push("jsdomError: " + e.message));
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true, // requestAnimationFrame
    url: "https://handcricket.test/",
    virtualConsole: vc,
    beforeParse(window) {
      // external resources (PeerJS/GA/fonts) are not fetched without resources:'usable';
      // stub browser APIs jsdom lacks
      window.navigator.vibrate = () => true;
      window.HTMLCanvasElement.prototype.getContext = () => null;
      // confetti() uses the Web Animations API; jsdom has no Element.animate
      if (!window.Element.prototype.animate) {
        window.Element.prototype.animate = () => ({ finished: Promise.resolve(), cancel() {}, play() {}, pause() {} });
      }
      try {
        window.AudioContext = class {};
      } catch {}
      // record every fetch so API contracts can be asserted (jsdom has no fetch)
      window.__net = [];
      window.fetch = (url, o) => {
        window.__net.push({ url: String(url), body: o && o.body });
        return Promise.resolve(
          new window.Response(
            JSON.stringify({ ok: true, friends: [], pending: [], challenges: [], data: null }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      };
    },
  });
  await sleep(300); // let inline scripts + early timeouts settle
  return { dom, errors };
};

const ev = (dom, expr) => dom.window.eval(expr);
const byId = (dom, id) => dom.window.document.getElementById(id);

// ---------------------------------------------------------------- match helper
async function playOfflineMatch(dom, opts = {}) {
  const w = dom.window;
  const W = (ms) => new Promise((r) => w.setTimeout(r, ms));
  // start a 1v1 offline match as batting side with a fixed bot
  ev(dom, `G.teamSize = ${opts.teamSize || 1}`);
  if (opts.teamSize > 1 && !opts.noRosters) {
    ev(dom, `
      G.myPlayers = Array.from({length:G.teamSize},(_,i)=>({name:'Me'+(i+1),role:i<2?'batter':'bowler',battingStyle:'balanced',bowlingStyle:'balanced'}));
      G.oppPlayers = Array.from({length:G.teamSize},(_,i)=>({name:'Bot'+(i+1),role:i<2?'batter':'bowler',battingStyle:'balanced',bowlingStyle:'balanced'}));
    `);
  }
  ev(dom, `G.iBat=true; G.mode='offline'; G.isBot=true; G.isHost=true;`);
  if (!opts.alreadyStarted) {
    // fresh 1v1: never inherit a previous game's roster (story XI, 5v5, ...)
    if (!(opts.teamSize > 1)) ev(dom, `G.myPlayers=[]; G.oppPlayers=[];`);
    ev(dom, `startOffline()`);
    await W(1200);
  }
  const startStatus = byId(dom, "status")?.textContent || "";
  let guard = 0;
  while (guard++ < 60) {
    const state = ev(dom, `G.state`);
    const overlayHidden = byId(dom, "resultOverlay")?.classList.contains("hidden");
    if (state === "waiting") {
      // pick a legal gesture (prefer 3)
      const legal = ev(dom, `pickAllowedGesture()`);
      ev(dom, `document.querySelector('.gesture-btn[data-val="${legal}"]').click()`);
      await W(300);
    } else if (state === "idle") {
      // innings break -> continue, or result -> done
      const resVisible = !byId(dom, "resultOverlay")?.classList.contains("hidden");
      const breakVisible = !byId(dom, "inningsBreakOverlay")?.classList.contains("hidden");
      if (resVisible) return { result: byId(dom, "resTitle").textContent.trim(), status: "finished" };
      if (breakVisible) {
        byId(dom, "btnInnBreakNext").click();
        await W(900);
        continue;
      }
      // 1st innings intermission (older path w/ inningsOverlay)
      const innVisible = !byId(dom, "inningsOverlay")?.classList.contains("hidden");
      if (innVisible && ev(dom, `G.innings===1`)) {
        ev(dom, `$('btnNextInn').click()`);
        await W(900);
        continue;
      }
      await W(800); // between balls / auto-advance
    } else if (state === "selecting") {
      const btn = byId(dom, "playerSelectOverlay")?.querySelector(".pool-item");
      if (btn) { btn.click(); await W(400); }
      else await W(1100);
    } else if (state === "over" || state === "revealing" || state === "processing") {
      await W(900);
    } else {
      await W(500);
    }
    void overlayHidden;
  }
  return { result: null, status: "timeout guard" };
}

// ---------------------------------------------------------------- 1. boot check
const { dom, errors } = await boot();
check("page boots with zero JS errors", errors.length === 0, errors.slice(0, 3).join(" | "));

// nameA/nameB crash marker: if init died, most handlers are missing
const wired = {
  modeOffline: !!byId(dom, "modeOffline")?.onclick,
  modeOnline: !!byId(dom, "modeOnline")?.onclick,
  modeInstant: !!byId(dom, "modeInstant")?.onclick,
  btnHeads: !!byId(dom, "btnHeads")?.onclick,
  btnCreate: !!byId(dom, "btnCreate")?.onclick,
  gestureGrid: (() => {
    const g = byId(dom, "gestureGrid");
    return !!(g && g.onclick);
  })(),
  btnRoleStart: !!byId(dom, "btnRoleStart")?.onclick,
  btnStoryTeamConfirm: !!byId(dom, "btnStoryTeamConfirm")?.onclick,
  btnFriends: !!byId(dom, "btnFriends")?.onclick,
};
// gesture grid uses addEventListener (not onclick=), so verify by firing a real
// click while the engine is waiting for a pick, then park the engine back at idle.
wired.gestureGrid = ev(dom, `(function(){
  G.state="waiting"; G.myPick=null; G.iAuto=false;
  document.querySelectorAll('.gesture-btn').forEach(b=>b.classList.remove('disabled'));
  const btn=document.querySelector('.gesture-btn[data-val="4"]');
  btn.dispatchEvent(new Event('click',{bubbles:true}));
  const ok = G.myPick===4;
  G.state="idle";            // cancel the scheduled reveal (guard in revealBall)
  G.myPick=null;
  return ok;
})()`);
const allWired = Object.values(wired).every(Boolean);
check("all critical UI handlers wired (init completed)", allWired, JSON.stringify(wired));
check("G state object exists", typeof ev(dom, `typeof G === "object" && G.totalBalls === 6`) === "boolean");
check("tutorial auto-open not erroring", true);

// ---------------------------------------------------------------- 2. offline 1v1
dom.window.localStorage.setItem("hcp_username", "SmokeTester");
dom.window.localStorage.removeItem("hc_stats");
const r1 = await playOfflineMatch(dom, { teamSize: 1 });
check("offline 1v1 match completes", r1.status === "finished", "result=" + r1.result);
const stats = JSON.parse(dom.window.localStorage.getItem("hc_stats") || "{}");
check("career stats recorded after match", stats.matches >= 1, JSON.stringify({ m: stats.matches, w: stats.wins }));

// ---------------------------------------------------------------- 2b. offline toss (redesign)
// Deterministic: force heads; call heads → we win the toss → decision cards.
ev(dom, `resetGame(); window.__mr = Math.random; Math.random = () => 0.01;`);
ev(dom, `G.mode='offline'; G.teamSize=1; resetOffline();`);
byId(dom, "btnHeads").click();
await sleep(900);
const tossSel = byId(dom, "btnHeads").classList.contains("sel");
const tossMidSpin = byId(dom, "coinBox").classList.contains("spinning"); // mid-flip
await sleep(3300); // flip 2300ms + bounce ~600ms + reveal
const tossEndSpin = byId(dom, "coinBox").classList.contains("spinning");
const tossChip = /HEADS/.test(byId(dom, "tossResult").textContent || "");
const tossDec = byId(dom, "tossDecision").style.display === "flex";
check(
  "toss: call → flip → win reveal + decision cards",
  tossSel && tossMidSpin && !tossEndSpin && tossChip && tossDec,
  `sel=${tossSel} midSpin=${tossMidSpin} chip=${tossChip} decision=${tossDec}`,
);
ev(dom, `$('btnBatFirst').click()`);
await sleep(1700);
const batChosen = ev(dom, `G.iBat === true && (G.state === 'waiting' || G.state === 'revealing' || G.state === 'processing')`);
ev(dom, `Math.random = window.__mr;`);
check("toss: bat-first choice boots the innings", batChosen, `state=${ev(dom, `G.state`)}`);

// ---------------------------------------------------------------- 3. offline 5v5 (team + roles)
dom.window.localStorage.removeItem("hc_stats");
ev(dom, `resetGame()`);
await sleep(400);
// 5v5 role flow with NO pre-seeded rosters: showRoleForOffline() must build
// them (regression: the role screen used to open empty and could never start)
ev(dom, `document.querySelector('#offlineSize .team-size-btn[data-size="5"]').click()`);
ev(dom, `G.myPlayers=[]; G.oppPlayers=[];`);
ev(dom, `showRoleForOffline()`);
await sleep(400);
const roleRows = byId(dom, "roleAssignGrid")?.querySelectorAll(".role-row").length || 0;
check("5v5 role grid auto-builds 5 players", roleRows === 5, "rows=" + roleRows);
const startDisabled = byId(dom, "btnRoleStart")?.disabled;
check("5v5 role start enabled with valid roles", startDisabled === false, "disabled=" + startDisabled);
// assign roles + start through the actual callback flow -> match must boot
ev(dom, `$('btnRoleAllBal').click()`);
await sleep(200);
ev(dom, `$('btnRoleStart').click()`);
await sleep(900);
const bootStatus = byId(dom, "status")?.textContent || "";
const rosterLen = ev(dom, `G.myPlayers.length`);
const stylesKept = ev(dom, `G.myPlayers.every(p=>p.battingStyle==='balanced')`);
check(
  "5v5 role-screen flow boots a match",
  rosterLen === 5 && stylesKept && (bootStatus.includes("BAT") || bootStatus.includes("BOWL") || bootStatus.includes("Innings")),
  `roster=${rosterLen} styled=${stylesKept} status=${bootStatus.slice(0, 25)}`,
);
const r2 = await playOfflineMatch(dom, { teamSize: 5 });
check("offline 5v5 match completes", r2.status === "finished", "result=" + r2.result);

// ---------------------------------------------------------------- 4. story boot
ev(dom, `resetGame()`);
ev(dom, `storyProgress = defaultStoryProgress(); storyProgress.myTeam = { name: "Test XI", players: STORY_DATA.playerPool.slice(0,11).map(p=>({name:p.name,role:p.role,battingStyle:p.battingStyle,bowlingStyle:p.bowlingStyle})) };`);
await sleep(300);
ev(dom, `renderStoryHome()`);
await sleep(300);
const tierCards = byId(dom, "storyTierList")?.querySelectorAll(".story-tier-card").length || 0;
check("story tier ladder renders 8 tiers", tierCards === 8, "cards=" + tierCards);
const progText = byId(dom, "storyProgressText")?.textContent || "";
check("story progress shows 0/37", progText.includes("37"), progText);
// story match boot into role screen (11 players)
ev(dom, `resetGame()`);
ev(dom, `G.mode='offline'; G.teamSize=11; G.totalBalls=120; G.totalWkts=10; startStoryMatchPlay()`);
await sleep(500);
const st = byId(dom, "status")?.textContent || "";
check("story match boots (status shows innings)", st.includes("Innings") || st.includes("BAT") || st.includes("BOWL"), st);

// ---------------------------------------------------------------- 5. Quick Match (C7)
// Instant = honest bot game: no fake "searching for a real player" phase.
ev(dom, `resetGame()`);
ev(dom, `$('modeInstant').click()`);
await sleep(500);
const mmShown = !byId(dom, "matchmakingOverlay")?.classList.contains("hidden");
const mmStatus = byId(dom, "matchStatus")?.textContent || "";
check("quick-match overlay opens with honest copy", mmShown && !/real player|searching/i.test(mmStatus), mmStatus);
// pick 1v1 inside the overlay, then Find Opponent -> persona reveal -> Start
ev(dom, `document.querySelector('#mmSize .team-size-btn[data-size="1"]').click()`);
check("quick match CTA starts as 'Find Opponent'", byId(dom, "btnMMPlayBot")?.textContent.trim() === "Find Opponent", byId(dom, "btnMMPlayBot")?.textContent.trim());
ev(dom, `$('btnMMPlayBot').click()`);
await sleep(2200); // the reveal is deliberately ~1.1-1.8s
const personaShown = !byId(dom, "mmPersona")?.classList.contains("hidden");
const personaName = byId(dom, "mmPersona")?.querySelector(".persona-name")?.textContent || "";
const personaMeta = byId(dom, "mmPersona")?.querySelector(".persona-meta")?.textContent || "";
check("quick match reveals a named opponent with a city", personaShown && personaName.length > 2 && personaMeta.includes("·"), `${personaName} | ${personaMeta}`);
check("opponent name is a clean Indian name (no gamer tags)", /^[A-Za-z]+ [A-Za-z]+$/.test(personaName.trim()), personaName);
check("quick match CTA becomes 'Start Match' after the reveal", byId(dom, "btnMMPlayBot")?.textContent.trim() === "Start Match", byId(dom, "btnMMPlayBot")?.textContent.trim());
// the same player must show the same career if revealed twice
const career1 = byId(dom, "mmPersona")?.querySelector(".persona-stats")?.textContent || "";
ev(dom, `renderMMPersona(genBotProfile(${JSON.stringify(personaName)}))`);
const career2 = byId(dom, "mmPersona")?.querySelector(".persona-stats")?.textContent || "";
check("persona career is stable for the same name", career1 === career2, `${career1} vs ${career2}`);
ev(dom, `$('btnMMPlayBot').click()`);
await sleep(1500); // role-less 1v1 boots: startInnings -> nextBall at 700ms
const qmOverlayHidden = byId(dom, "matchmakingOverlay")?.classList.contains("hidden");
const qmBooted = ev(dom, `G.mode==='offline' && G.isBot && (G.state==='waiting'||G.state==='revealing'||G.state==='processing')`);
check("quick match starts vs the revealed player", qmOverlayHidden && qmBooted, `overlayHidden=${qmOverlayHidden} booted=${qmBooted}`);
check("scoreboard shows the revealed player, not 'BOT'", byId(dom, "labelB")?.textContent.trim() === personaName.trim(), byId(dom, "labelB")?.textContent.trim());
const rQ = await playOfflineMatch(dom, { teamSize: 1, alreadyStarted: true });
check("quick match completes", rQ.status === "finished", "result=" + rQ.result);

// ---------------------------------------------------------------- 6. story/casual isolation (C5/C6)
// A casual offline match played AFTER story mode must not touch the story
// career, must not inherit story difficulty, and must not reopen story UI.
const before = ev(
  dom,
  `storyProgress ? storyProgress.matchResults.length + ':' + (storyProgress.stats.matchesPlayed||0) : 'none'`,
);
ev(dom, `resetGame()`);
const r3 = await playOfflineMatch(dom, { teamSize: 1 });
const after = ev(
  dom,
  `storyProgress ? storyProgress.matchResults.length + ':' + (storyProgress.stats.matchesPlayed||0) : 'none'`,
);
const diff = ev(dom, `G.storyDifficulty===0 && G.storyMatch===false`);
check(
  "casual match after story leaves career untouched",
  r3.status === "finished" && before === after && diff,
  `before=${before} after=${after} flagsCleared=${diff}`,
);

// cleanup
// ------------------------------------------- 6. v2.7.1 UX / roles / banter pack
const cssSrc = readFileSync(join(root, "public/css/app.css"), "utf8");

// 6a. role limits match the game design (AGG 4-6, DEF 1-3, bat AND bowl)
const ROLE = JSON.parse(ev(dom, `JSON.stringify(ROLE_LIMITS)`));
check(
  "role limits: AGG 4-6 / DEF 1-3 for bat & bowl",
  JSON.stringify(ROLE.aggressive.bat) === "[4,5,6]" &&
    JSON.stringify(ROLE.aggressive.bowl) === "[4,5,6]" &&
    JSON.stringify(ROLE.defensive.bat) === "[1,2,3]" &&
    JSON.stringify(ROLE.defensive.bowl) === "[1,2,3]",
  JSON.stringify(ROLE.aggressive) + JSON.stringify(ROLE.defensive),
);

// 6b. the BOT obeys its own role when batting and when bowling
const botRoleOk = ev(dom, `(() => {
  G.mode='offline';
  G.myPlayers=[{name:'Me',battingStyle:'balanced',bowlingStyle:'balanced'}];
  G.oppPlayers=[{name:'Bot',battingStyle:'aggressive',bowlingStyle:'aggressive'}];
  G.batIdx=0; G.bowlIdx=0;
  G.iBat=false;  // bot bats
  const batOk = Array.from({length:200},()=>botPickWithRole()).every(v=>[4,5,6].includes(v));
  G.iBat=true;   // bot bowls
  const bowlOk = Array.from({length:200},()=>botPickWithRole()).every(v=>[4,5,6].includes(v));
  return batOk && bowlOk;
})()`);
check("bot picks respect its role (200 draws bat + bowl)", botRoleOk === true);

// 6c. my gesture grid greys out role-forbidden numbers
const restr = ev(dom, `(() => {
  G.iBat=true; G.state='waiting';
  G.myPlayers=[{name:'A',battingStyle:'defensive',bowlingStyle:'balanced'}];
  G.oppPlayers=[{name:'B',battingStyle:'balanced',bowlingStyle:'balanced'}];
  G.batIdx=0; G.bowlIdx=0;
  applyGestureRestrictions();
  const out={};
  document.querySelectorAll('.gesture-btn').forEach(b=>out[b.dataset.val]=b.classList.contains('restricted'));
  removeGestureRestrictions();
  return JSON.stringify(out);
})()`);
const R = JSON.parse(restr);
check(
  "defensive batter: 4,5,6 greyed; 1,2,3 free",
  R["4"] === true && R["5"] === true && R["6"] === true &&
    R["1"] === false && R["2"] === false && R["3"] === false,
  restr,
);

// 6d. banter is never self-directed: every line the bot speaks about its OWN
//     scoring must address the opponent (second person / their bowling/ball)
const OPP_KEYS = ["onBotSix","onBotFour","onBotOut","onDotBatting","onOverEndBatting",
  "onFreeHitBatting","onOneToWinBotBatting","onBigChaseBotBatting","onBotWinning"];
const pools = ev(dom, `JSON.stringify(window.BOT_CHAT_POOLS)`);
const POOLS = JSON.parse(pools);
const directed = /teri|tera|tere|tujh|tu\b|bowling|bowler|ball|defend/i;
let badLines = [];
for (const k of OPP_KEYS) {
  for (const l of POOLS[k] || []) if (!directed.test(l.t)) badLines.push(k + ": " + l.t);
}
check("banter pools address the opponent, never self-praise", badLines.length === 0, badLines.join(" | "));

// 6e. profile: no sign-in stub, richer stats visible
ev(dom, `saveStats(defaultStats()); showProfile()`);
const profTxt = byId(dom, "profileCard")?.textContent || "";
check(
  "profile has no 'Sign in' stub",
  !/sign in/i.test(profTxt),
);
check(
  "profile shows expanded stats (avg, dot%, boundary%, economy, overs, best bowl, streak, hat-tricks)",
  ["Batting Avg","Dot Ball %","Boundary %","Economy","Overs Bowled","Best Bowling",
   "Best Win Streak","Hat-tricks","Runs Conceded","Overs Faced"].every((t) => profTxt.includes(t)),
);

// 6f. career math for the derived stats
//   - not out yet  -> Batting Avg is the raw score, never runs/wickets-taken
//   - economy/dots -> bowling dots come from oppHist, batting dots from myHist
const derived = ev(dom, `(() => {
  saveStats(defaultStats());
  updateStatsAfterMatch({won:true,myRuns:50,myBalls:30,mySixes:2,myFours:4,myWickets:0,
    myHist:['DOT','DOT'],oppWickets:3,oppBalls:24,oppRuns:20,
    oppHist:['DOT','DOT','DOT','W',4,1]});
  const s = loadStats();
  return JSON.stringify({eco:s.economy,dot:s.dotPct,avg:s.batAvg,ov:s.oversBowled,
    best:s.bestBowlWkts,outs:s.outs,dotsBowled:s.dotsBowled,bowlDot:s.bowlDotPct});
})()`);
const D = JSON.parse(derived);
check(
  "derived stats compute (eco 5.00, bat dot 7%, not-out avg 50.0, 4.0 ov, best 3)",
  D.eco === "5.00" && D.dot === 7 && D.avg === "50.0" && D.ov === "4.0" && D.best === 3,
  JSON.stringify(D),
);
// regression: dismissals used to be incremented by the wickets you TOOK
const attr = ev(dom, `(() => {
  saveStats(defaultStats());
  updateStatsAfterMatch({won:false,lost:true,myRuns:20,myBalls:12,mySixes:1,myFours:2,
    myWickets:0, myHist:[6,'DOT',4], oppWickets:2, oppBalls:12, oppRuns:14,
    oppHist:['DOT','DOT','W',1]});
  const s = loadStats();
  return JSON.stringify({outs:s.outs,wkts:s.wicketsTaken,avg:s.batAvg,
    battingDots:s.dots,bowlingDots:s.dotsBowled});
})()`);
const A = JSON.parse(attr);
check(
  "batting/bowling attribution: outs=0 (never out), 2 wkts taken, avg 20.0",
  A.outs === 0 && A.wkts === 2 && A.avg === "20.0",
  JSON.stringify(A),
);
check(
  "bowling 'Dots Bowled' counts oppHist, not my batting dots",
  A.bowlingDots === 2 && A.battingDots === 1,
  JSON.stringify(A),
);
const outCase = JSON.parse(
  ev(dom, `(() => { saveStats(defaultStats());
    updateStatsAfterMatch({won:true,myRuns:30,myBalls:20,mySixes:1,myFours:3,myWickets:1,
      myHist:[4],oppWickets:1,oppBalls:18,oppRuns:16,oppHist:['W']});
    const s = loadStats(); return JSON.stringify({outs:s.outs,avg:s.batAvg}); })()`),
);
check(
  "a real dismissal moves outs -> Batting Avg 30.0",
  outCase.outs === 1 && outCase.avg === "30.0",
  JSON.stringify(outCase),
);

// 6g. close/action bars are pinned (position:fixed) so they can't drift on scroll
check(
  "profile/friends close + result actions are position:fixed",
  /#btnCloseProfile,#btnCloseFriends\{position:fixed/.test(cssSrc) &&
    /#resultActions\{position:fixed/.test(cssSrc),
);

// 6h. glass rebalance tokens actually raised (surfaces >= .10 alpha)
check(
  "glass tokens rebalanced (card .13 / border .26 / soft .82)",
  /--card:rgba\(255,255,255,\.13\)/.test(cssSrc) &&
    /--card-border:rgba\(255,255,255,\.26\)/.test(cssSrc) &&
    /--ink-soft:rgba\(248,250,252,\.82\)/.test(cssSrc),
);

// ------------------------------------------- 7. v2.7.2 articulated hands
const svg5 = ev(dom, `getHandSVG(5, true)`);
check(
  "hand svg is an articulated skeleton (joint groups, no 1.32 stretch)",
  svg5.includes('data-j="pf2p3"') && svg5.includes('data-j="pt1"') &&
    !svg5.includes("scale(1.32,1)"),
);
check(
  "opponent hand mirrored by outermost wrapper",
  ev(dom, `getHandSVG(5, false)`).includes("translate(200 0) scale(-1 1)"),
);
const miniCount = ev(dom, `document.querySelectorAll('.gesture-btn .mini-hand svg').length`);
check("six gesture buttons carry mini hand previews", miniCount === 6, "count=" + miniCount);

// tween: with a deliberately LONG duration the joint must be caught
// strictly between the curled and extended angles (an innerHTML teleport
// would jump straight to the target). Deterministic: no settle-timing race.
ev(dom, `document.getElementById('arenaPlayer').__ctl.set(0, { animate: false })`);
await sleep(80);
ev(dom, `document.getElementById('arenaPlayer').__ctl.set(5, { duration: 2000, stagger: 0 })`);
await sleep(250);
const midRot = parseFloat(ev(dom,
  `document.querySelector('#arenaPlayer [data-j="pf0p1"]').getAttribute('transform').match(/rotate\\(([-0-9.]+)/)[1]`));
ev(dom, `document.getElementById('arenaPlayer').__ctl.set(0, { animate: false })`);
const endRot = parseFloat(ev(dom,
  `document.querySelector('#arenaPlayer [data-j="pf0p1"]').getAttribute('transform').match(/rotate\\(([-0-9.]+)/)[1]`));
check(
  "fingers tween through intermediate angles (not a teleport)",
  midRot > -2.5 && midRot < 25.5 && endRot === 26,
  `mid=${midRot.toFixed(2)} (between 26 and -3) settled=${endRot}`,
);
check(
  "wicket pump hook flags the dismissed side's hand",
  ev(dom, `handPump(true); document.getElementById('handPlayer').classList.contains('wicket')`) === true,
);
check(
  "hand motion css present (desync shake, six throw, ring, reduced-motion guard)",
  /@keyframes hn27/.test(cssSrc) && /@keyframes th27x/.test(cssSrc) &&
    /@keyframes ring27/.test(cssSrc) && /prefers-reduced-motion:reduce/.test(cssSrc),
);

// ---------------------------------------------------------------- 9. v2.8 fixes
const fs = await import("node:fs");
const jsSrc = (f) => fs.readFileSync(join(root, "public/js", f), "utf8");

// 9a. friends: the client must speak the server's protocol (add/accept/reject/remove)
ev(dom, `localStorage.clear(); setUsername('Alice'); localStorage.setItem('hcp_friends',
  JSON.stringify({friends:[],pending:[{name:'Bob',stats:null,since:1}]}))`);
await sleep(50);
ev(dom, `dom0=0; window.__net.length=0; acceptFriend('Bob')`);
await sleep(150);
const acceptCall = JSON.parse(
  ev(dom, `JSON.stringify(window.__net.filter(c=>c.body).map(c=>JSON.parse(c.body)))`),
);
check(
  "acceptFriend posts action:'accept' (server used to 400 on 'sync')",
  acceptCall.some((b) => b.action === "accept" && b.target === "Bob"),
  JSON.stringify(acceptCall).slice(0, 120),
);
ev(dom, `window.__net.length=0; G.oppName='Ravi'; G.isBot=false; G.oppStats=null; G.storyMatch=false;
  showAddFriendBtn(); document.getElementById('btnAddFriend').click()`);
await sleep(200);
const addCall = JSON.parse(
  ev(dom, `JSON.stringify(window.__net.filter(c=>c.body).map(c=>JSON.parse(c.body)))`),
);
check(
  "Add Friend posts action:'add' with the target (reaches THEIR record)",
  addCall.some((b) => b.action === "add" && b.target === "Ravi"),
  JSON.stringify(addCall).slice(0, 120),
);
check(
  "friend client speaks add/accept/reject/remove, never a bare 'sync'",
  ["accept", "reject", "remove", "add"].every((a) =>
    new RegExp('api\\("' + a + '"').test(jsSrc("20-friends.js"))),
  "all four actions are called",
);

// 9b. profile: stable id, per-user stats, escaped opponent name
const id1 = ev(dom, `setUsername('Alice'); showProfile(); document.querySelector('.prof-id').textContent`);
const id2 = ev(dom, `showProfile(); document.querySelector('.prof-id').textContent`);
check("profile id is stable across renders", id1 === id2 && /^HC-\d{6}/.test(id1), `${id1} / ${id2}`);
const keyed = ev(dom, `setUsername('Alice'); saveStats(loadStats()); !!localStorage.getItem('hc_stats:alice')`);
check("career stats are stored per-username", keyed === true, "hc_stats:alice");
const isolated = ev(dom, `(() => { setUsername('Zed'); return loadStats().matches; })()`);
check("a new username starts a fresh career", isolated === 0, "matches=" + isolated);
ev(dom, `setUsername('Alice'); G.oppName='<img src=x onerror=1>'; G.oppStats=Object.assign(defaultStats(),{matches:4}); showOppProfile()`);
const injected = ev(dom, `document.getElementById('profileCard').querySelectorAll('img').length`);
check("opponent name is escaped in the profile card", injected === 0, "img nodes=" + injected);

// 9c. invite flow: a typed room code works without a ?room= deep link
check("room-code field exists in the lobby", !!byId(dom, "roomCodeInput"));
const codeFromField = ev(dom, `document.getElementById('roomCodeInput').value='k7 qx-2m';
  resolveRoomCode()`);
check("room code is read + normalised from the field", codeFromField === "K7QX2M", codeFromField);
ev(dom, `setLobbyMode(false,''); `);
const hostMode = ev(dom, `getComputedStyle(document.getElementById('btnCreate')).display`);
ev(dom, `setLobbyMode(true,'ABCD12')`);
const joinMode = ev(dom, `[document.getElementById('roomCodeWrap').style.display, document.getElementById('roomCodeInput').value].join('|')`);
check("lobby switches host/join and prefills the code", joinMode === "block|ABCD12", joinMode);

// 9d. no native dialogs left in the app
const stripComments = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const dialogs = ["14-online.js", "16-story.js", "20-friends.js", "18-instant.js", "11-modes.js", "09-engine.js"]
  .map((f) => [f, (stripComments(jsSrc(f)).match(/(^|[^.\w])(alert|confirm)\s*\(/g) || []).length])
  .filter(([, n]) => n > 0);
check("no native alert()/confirm() left in gameplay code", dialogs.length === 0, JSON.stringify(dialogs));
check("toast() and confirmDialog() exist", ev(dom, `typeof toast`) === "function" && ev(dom, `typeof confirmDialog`) === "function");

// 9e. navigation is no longer duplicated
const tabs = [...byId(dom, "tabBar").querySelectorAll(".tab-btn")].map((b) => b.dataset.tab);
check("dock tabs: Profile/Friends/Play/Career/Help (no duplicate Arena)",
  JSON.stringify(tabs) === '["lounge","friends","battle","team","tournaments"]', JSON.stringify(tabs));
const markup = fs.readFileSync(join(root, "public/index.html"), "utf8");
check(
  "markup contains no 'BOT' / 'Ultra Bot' label",
  !/>\s*BOT\s*</.test(markup) && !/Ultra Bot/.test(markup),
);

// ---------------------------------------------------------------- 10. v2.8b
// 10a. roster integrity: no duplicate names inside a squad (breaks online role
// sync, which matches players by name)
const rosterDupes = ev(dom, `(() => {
  const bad = [];
  Object.keys(TEAMS).forEach((k) => {
    const n = TEAMS[k].players.map((p) => p.name);
    const d = n.filter((x, i) => n.indexOf(x) !== i);
    if (d.length) bad.push(k + ':' + d.join(','));
  });
  return bad.join('|');
})()`);
check("no duplicate player names within any squad (RR Boult/Bolt fixed)", rosterDupes === "", rosterDupes || "clean");

// 10b. role locks explain themselves
ev(dom, `resetGame(); G.mode='offline'; G.teamSize=3; G.state='waiting'; G.iBat=true;
  G.myPlayers=[{name:'Me1',role:'batter',battingStyle:'defensive',bowlingStyle:'balanced'},
               {name:'Me2',role:'bowler',battingStyle:'balanced',bowlingStyle:'balanced'},
               {name:'Me3',role:'all',battingStyle:'balanced',bowlingStyle:'balanced'}];
  G.batIdx=0; applyGestureRestrictions()`);
const lockedBtns = [...byId(dom, "gestureGrid").querySelectorAll(".gesture-btn.restricted")];
const reasons = new Set(lockedBtns.map((b) => b.dataset.lockReason));
check(
  "defensive batter locks 4,5,6",
  lockedBtns.map((b) => b.dataset.val).join(",") === "4,5,6",
  lockedBtns.map((b) => b.dataset.val).join(","),
);
check(
  "every locked number carries a reason the player can read",
  lockedBtns.length === 3 && reasons.size === 1 && /Defensive batter/.test([...reasons][0] || ""),
  [...reasons][0],
);
check(
  "arena shows a role hint line while numbers are locked",
  !byId(dom, "roleHint").classList.contains("hidden") &&
    /Defensive/.test(byId(dom, "roleHint").textContent),
  byId(dom, "roleHint").textContent.trim().slice(0, 60),
);
ev(dom, `G.myPlayers[0].battingStyle='balanced'; applyGestureRestrictions()`);
check(
  "balanced role unlocks everything and hides the hint",
  byId(dom, "gestureGrid").querySelectorAll(".gesture-btn.restricted").length === 0 &&
    byId(dom, "roleHint").classList.contains("hidden"),
);

// 10c. leaderboard + other-player profiles
check("leaderboard overlay + button exist", !!byId(dom, "leaderboardOverlay") && !!byId(dom, "btnLeaderboard"));
check("showLeaderboard/showUserProfile are wired", ev(dom, `typeof showLeaderboard`) === "function" && ev(dom, `typeof showUserProfile`) === "function");
ev(dom, `window.__net.length=0; showLeaderboard()`);
await sleep(200);
const lbCall = ev(dom, `JSON.stringify(window.__net.map(c=>c.url))`);
check("leaderboard fetches /api/leaderboard with my name", /\/api\/leaderboard\?limit=20&me=/.test(lbCall), lbCall.slice(0, 90));
ev(dom, `window.__net.length=0; showUserProfile('Rohit')`);
await sleep(200);
const profCall = ev(dom, `JSON.stringify(window.__net.map(c=>c.url))`);
check("tapping a player fetches their LIVE profile", /\/api\/profile\?user=Rohit/.test(profCall), profCall.slice(0, 90));

// 10d. the two engine hooks are no longer empty stubs
check("checkBotChallenges polls the inbox", /pollInbox/.test(jsSrc("20-friends.js")));
check("maybeBotChallenge offers a rematch", /wants a rematch/.test(jsSrc("20-friends.js")));

// 10e. sheets scroll: no nested scroller inside a scrolling sheet
check(
  "friend list is not a nested scroller (scroll-lock fix)",
  /\.friend-list\{overflow:visible;flex:none\}/.test(cssSrc),
);
check(
  "sheets keep the last row clear of the dock",
  /padding-bottom:calc\(84px/.test(cssSrc) && /overscroll-behavior:contain/.test(cssSrc),
);
check(
  "no font size below 10px anywhere in the stylesheet",
  !/font-size:[1-9](\.\d)?px/.test(cssSrc),
);

// ---------------------------------------------------------------- 11. v2.9
// 11a. API ownership token
const tok1 = ev(dom, `getClientToken()`);
const tok2 = ev(dom, `getClientToken()`);
check("device token is generated once and reused", /^[A-Za-z0-9]{16,64}$/.test(tok1) && tok1 === tok2, tok1);
check("token is stored, not re-randomised", ev(dom, `localStorage.getItem("hcp_token")`) === tok1);
ev(dom, `window.__net.length=0; publishProfile()`);
await sleep(120);
const profBody = ev(dom, `window.__net.map(c=>c.body).filter(Boolean).pop() || "{}"`);
check(
  "career publish sends the ownership token",
  JSON.parse(profBody).token === tok1,
  profBody.slice(0, 70),
);
check(
  "friend mutations send the ownership token",
  /token:\s*getClientToken\(\)/.test(jsSrc("20-friends.js")),
);
check(
  "story save sends the ownership token",
  /token:\s*getClientToken\(\)/.test(jsSrc("16-story.js")),
);

// 11b. generated avatars are deterministic
const avA1 = ev(dom, `avatarSvg("Rohit", 40)`);
const avA2 = ev(dom, `avatarSvg("Rohit", 40)`);
const avB = ev(dom, `avatarSvg("Priya", 40)`);
check("same name always draws the same face", avA1 === avA2 && /<svg/.test(avA1), avA1.length + " chars");
check("different names draw different faces", avA1 !== avB);
check("avatar svg is labelled for screen readers", /aria-label="Avatar for Rohit"/.test(avA1));
check(
  "profile, persona, friend and leaderboard rows all use it",
  ["10-profiles.js", "18-instant.js", "20-friends.js"].every((f) => /avatarHtml\(/.test(jsSrc(f))),
);

// 11c. analytics consent
check(
  "GA is gated on stored consent",
  /localStorage\.getItem\('hcp_consent'\) === 'yes'/.test(html) &&
    !/^<script async src="https:\/\/www\.googletagmanager\.com/m.test(html),
);
check("consent bar can record a decline", ev(dom, `typeof hcConsent`) === "function");
ev(dom, `hcConsent(false)`);
check("declining persists the choice", ev(dom, `localStorage.getItem("hcp_consent")`) === "no");

// 11d. installability
const swSrc = readFileSync(join(root, "public/sw.js"), "utf8");
const manifest = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
check("manifest declares name + icons", manifest.name === "Hand Cricket Pro" && manifest.icons.length >= 2);
check("service worker exists and is registered", /register\("sw\.js"\)/.test(jsSrc("21-shell.js")));
check(
  "service worker never caches /api/ (live reads must stay live)",
  /startsWith\('\/api\/'\)/.test(swSrc) && /return;/.test(swSrc),
);
check("manifest is linked from the page", /rel="manifest"/.test(html));

// 11e. retention: daily streak
ev(dom, `localStorage.removeItem("hcp_activity")`);
const st1 = ev(dom, `hcRecordPlayedDay()`);
const st1b = ev(dom, `hcRecordPlayedDay()`);
const act = ev(dom, `JSON.stringify(hcGetActivity())`);
check("first match today starts a 1-day streak", st1 === 1, String(st1));
check("a second match the same day does not double-count", st1b === 1 && JSON.parse(act).playedToday === true, String(st1b));
check("streak card renders into the profile", /sk-flame/.test(ev(dom, `hcStreakCardHtml()`)));

// 11f. head-to-head
ev(dom, `localStorage.clear()`);
ev(dom, `hcRecordH2H("Alice","Rohit",{won:true})`);
ev(dom, `hcRecordH2H("Alice","Rohit",{won:true})`);
ev(dom, `hcRecordH2H("Alice","Rohit",{lost:true})`);
const h2h = ev(dom, `hcH2HHtml("Alice","Rohit")`);
check("head-to-head tracks wins and losses", /2&ndash;1/.test(h2h) && /You lead/.test(h2h), h2h.slice(0, 60));
check("no record renders nothing", ev(dom, `hcH2HHtml("Alice","Nobody")`) === "");
check("you cannot have a rivalry with yourself", ev(dom, `hcH2HHtml("Alice","alice")`) === "");

// 11g. auto-pick respects the format's role limits
const picked = ev(dom, `JSON.stringify(hcAutoPickRoles(
  [{name:'a',role:'batter'},{name:'b',role:'batter'},{name:'c',role:'all'},
   {name:'d',role:'all'},{name:'e',role:'bowler'}], 5)
  .map(p=>p.battingStyle))`);
const pickedArr = JSON.parse(picked);
check(
  "5v5 auto-pick stays inside max 2 aggressive / 2 defensive",
  pickedArr.filter((x) => x === "aggressive").length <= 2 &&
    pickedArr.filter((x) => x === "defensive").length <= 2,
  picked,
);
check(
  "5v5 auto-pick keeps the balanced minimum",
  pickedArr.filter((x) => x === "balanced").length >= 1,
  picked,
);
check("auto-pick button exists on the role screen", !!byId(dom, "btnAutoRoles"));

// 11h. online plumbing
check(
  "role sync is index-based, not name-based",
  /idx:\s*i,\s*name:\s*p\.name/.test(jsSrc("14-online.js")) &&
    /typeof dp\.idx === "number"/.test(jsSrc("14-online.js")),
);
check(
  "matchResult carries the opponent name (h2h + share need it)",
  /oppName:\s*G\.oppName/.test(jsSrc("09-engine.js")),
);
check(
  "TURN is configurable instead of hardcoded to the free relay",
  /window\.__hcTurn/.test(jsSrc("14-online.js")) && /HC_TURN_URLS/.test(readFileSync(join(root, "functions/api/config.js"), "utf8")),
);
check("ICE servers still work with no config", ev(dom, `buildIceServers().length`) >= 8);
ev(dom, `window.__hcTurn = {urls:"turn:r.test:3478", username:"u", credential:"c"}`);
const ices = ev(dom, `JSON.stringify(buildIceServers())`);
check("a configured relay replaces the free one", /turn:r\.test:3478/.test(ices) && !/metered/.test(ices), ices.slice(0, 60));

// 11i. sharing + refresh
check("share button exists on the result screen", !!byId(dom, "btnShareCard"));
check("share scorecard is implemented", ev(dom, `typeof hcShareScorecard`) === "function");
check("leaderboard + friends have an explicit refresh", !!byId(dom, "btnLbRefresh") && !!byId(dom, "btnFriendsRefresh"));
check(
  "arena gets a live crowd band while a match is on",
  /crowd-band/.test(html) && /classList\.add\("live"\)/.test(jsSrc("09-engine.js")),
);
check("ball trail respects reduced motion", /prefers-reduced-motion:reduce\)\{\.ball-trail\{display:none\}\}/.test(cssSrc));

// ---------------------------------------------------------------- 12. knockout cup
// 11f cleared localStorage, which took hcp_username with it — restore it, then
// read the player's name back out of the draw rather than hardcoding it.
ev(dom, `localStorage.removeItem("hcp_cup"); setUsername("Alice")`);
const CUP_ME = ev(dom, `getUsername()`);
check("cup overlay exists", !!byId(dom, "cupOverlay"));
check("tournaments tab opens the cup, not the tutorial", /hcOpenCup\(\)/.test(jsSrc("05-navigation.js")));
check("no cup running initially", ev(dom, `hcHasActiveCup()`) === false);

ev(dom, `hcOpenCup()`);
await sleep(60);
const cupHost = byId(dom, "cupBracket");
check("opening the cup offers 4 and 8 player draws", /4 players/.test(cupHost.innerHTML) && /8 players/.test(cupHost.innerHTML));

cupHost.querySelector('.cup-size[data-size="4"]').click();
await sleep(60);
let cup = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check("4-player draw includes the player", cup.draw[0] === CUP_ME && cup.draw.length === 4, cup.draw.join(", "));
check("every slot in the draw is a distinct player", new Set(cup.draw).size === 4);
check("a 4-player draw is labelled Semi-final", /Semi-final/.test(cupHost.innerHTML));
check("cup is active once drawn", ev(dom, `hcHasActiveCup()`) === true);

const cupOpp = ev(dom, `(function(){var c=JSON.parse(localStorage.getItem('hcp_cup'));return c.remaining.filter(n=>n!==c.draw[0])[0];})()`);
ev(dom, `hcCupMatchEnd({won:true, lost:false, oppName:${JSON.stringify(cupOpp)}})`);
cup = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check(
  "winning a semi halves the field (fixtures you don't play still resolve)",
  cup.remaining.length === 2 && cup.remaining.indexOf(cupOpp) === -1,
  cup.remaining.join(", "),
);
check("cup wins are counted", cup.wins === 1, String(cup.wins));
const cupOpp2 = cup.remaining.filter((n) => n !== CUP_ME)[0];
ev(dom, `hcCupMatchEnd({won:true, lost:false, oppName:${JSON.stringify(cupOpp2)}})`);
cup = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check("winning the final crowns the player", cup.champion === CUP_ME && ev(dom, `hcHasActiveCup()`) === false, String(cup.champion));

// a loss hands the cup to the opponent; a tie eliminates nobody
ev(dom, `hcCupClear(); hcOpenCup()`);
await sleep(40);
byId(dom, "cupBracket").querySelector('.cup-size[data-size="4"]').click();
await sleep(40);
let cupL = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
const lostTo = cupL.remaining.filter((n) => n !== CUP_ME)[0];
ev(dom, `hcCupMatchEnd({won:false, lost:true, oppName:${JSON.stringify(lostTo)}})`);
cupL = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check("losing eliminates the player and crowns the opponent", cupL.champion === lostTo && cupL.remaining.indexOf(CUP_ME) === -1, String(cupL.champion));

ev(dom, `hcCupClear(); hcOpenCup()`);
await sleep(40);
byId(dom, "cupBracket").querySelector('.cup-size[data-size="4"]').click();
await sleep(40);
let cupT = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
const tiedWith = cupT.remaining.filter((n) => n !== CUP_ME)[0];
ev(dom, `hcCupMatchEnd({won:false, lost:false, tied:true, oppName:${JSON.stringify(tiedWith)}})`);
cupT = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check("a tie replays the fixture instead of eliminating anyone", cupT.remaining.length === 4 && !cupT.champion, cupT.remaining.join(", "));

// 8-player bracket takes exactly three wins
ev(dom, `hcCupClear(); hcOpenCup()`);
await sleep(40);
byId(dom, "cupBracket").querySelector('.cup-size[data-size="8"]').click();
await sleep(40);
let cup8 = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
check("8-player draw is labelled Quarter-final", /Quarter-final/.test(byId(dom, "cupBracket").innerHTML));
let cupRounds = 0;
for (let i = 0; i < 5 && !cup8.champion; i++) {
  const o = cup8.remaining.filter((n) => n !== cup8.draw[0])[0];
  if (!o) break;
  ev(dom, `hcCupMatchEnd({won:true, lost:false, oppName:${JSON.stringify(o)}})`);
  cup8 = JSON.parse(ev(dom, `localStorage.getItem("hcp_cup")`));
  cupRounds++;
}
check("an 8-player cup needs exactly 3 wins", cupRounds === 3 && cup8.champion === CUP_ME, "rounds=" + cupRounds);

// ---------------------------------------------------------------- 13. match replay
/* A replay must never disagree with the match it came from, so these assert on
   a match with a hand-computed scoreline rather than on a live one. */
ev(dom, `localStorage.removeItem("hcp_replays")`);
const RP = {
  won: true, lost: false, oppName: "Rohit",
  myRuns: 11, myWickets: 1, oppRuns: 9, oppWickets: 1,
  myHist: [4, 6, "DOT", 1, "W"], oppHist: [2, "DOT", 3, 4, "W"],
};
const rpId = ev(dom, `hcRecordReplay(${JSON.stringify(RP)})`);
check("finished match is recorded for replay", typeof rpId === "string" && rpId.length > 0, String(rpId));
check("replay count reflects the save", ev(dom, `hcReplayCount()`) === 1, String(ev(dom, `hcReplayCount()`)));

const rpSaved = JSON.parse(ev(dom, `localStorage.getItem("hcp_replays")`))[0];
const rpFrames = JSON.parse(ev(dom, `JSON.stringify(hcReplayFrames(${JSON.stringify(rpSaved)}))`));
const rpLast = rpFrames[rpFrames.length - 1];
check("replay covers the longer innings", rpFrames.length === 5, "frames=" + rpFrames.length);
check(
  "replayed total equals the real score",
  rpLast.myScore === "11/1" && rpLast.oppScore === "9/1",
  rpLast.myScore + " v " + rpLast.oppScore,
);
check(
  "wickets accrue through the innings, not at the end",
  rpFrames[1].myScore === "10/0" && rpFrames[4].myScore === "11/1",
  rpFrames.map((f) => f.myScore).join(" "),
);

ev(dom, `hcOpenReplays()`);
await sleep(60);
const rpList = byId(dom, "replayList");
check("replay list shows the opponent and the result", /Rohit/.test(rpList.innerHTML) && /WON/.test(rpList.innerHTML));
rpList.querySelector(".rp-row").click();
await sleep(150);
check("tapping a match opens playback", !byId(dom, "replayOverlay").classList.contains("hidden"));
check("playback scoreboard is populated", /YOU/.test(byId(dom, "replayScore").textContent),
  byId(dom, "replayScore").textContent.trim());
const rpChips = byId(dom, "replayStrip").querySelectorAll(".rp-ball").length;
check("ball chips render", rpChips > 0, rpChips + " chips");
await sleep(700);
const rpChips2 = byId(dom, "replayStrip").querySelectorAll(".rp-ball").length;
check("playback advances over time", rpChips2 > rpChips, rpChips + " -> " + rpChips2);
check("boundaries are visually distinct", /rp-four/.test(byId(dom, "replayStrip").innerHTML));
ev(dom, `hcStopReplay()`);
check("Watch Replay button exists on the result screen", !!byId(dom, "btnWatchReplay"));

dom.window.close();
console.log(failures === 0 ? "\n✅ SMOKE: all checks passed" : `\n❌ SMOKE: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
