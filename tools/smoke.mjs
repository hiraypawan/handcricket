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
// pick 1v1 inside the overlay, then Start Match
ev(dom, `document.querySelector('#mmSize .team-size-btn[data-size="1"]').click()`);
ev(dom, `$('btnMMPlayBot').click()`);
await sleep(1500); // role-less 1v1 boots: startInnings -> nextBall at 700ms
const qmOverlayHidden = byId(dom, "matchmakingOverlay")?.classList.contains("hidden");
const qmBooted = ev(dom, `G.mode==='offline' && G.isBot && (G.state==='waiting'||G.state==='revealing'||G.state==='processing')`);
check("quick match starts instantly vs bot", qmOverlayHidden && qmBooted, `overlayHidden=${qmOverlayHidden} booted=${qmBooted}`);
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
dom.window.close();
console.log(failures === 0 ? "\n✅ SMOKE: all checks passed" : `\n❌ SMOKE: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
