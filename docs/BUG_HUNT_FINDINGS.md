# Hand Cricket Pro — Complete Bug Hunt & Incomplete-Feature Report

*Generated 2026-09-04 · Full source audit of `public/index.html` (3,181 lines), `public/src/story-data.js`, `public/functions/api/*` · All findings verified by static analysis with original line numbers*

---

## ⚠️ Executive summary

The bug hunt found **1 game-breaking crash, 3 broken gameplay subsystems, 6 broken/incomplete features, 3 dead backend endpoints, and a long tail of smaller defects**. The single most important discovery — and almost certainly the cause of the "can't click anything" reports — is a **fatal JavaScript error on page load** at `index.html:1531` that aborts initialization halfway through. Everything downstream of it never gets wired.

Story data is **structurally perfect** (verified programmatically: 81 players, 37 matches, 8 tiers, all narratives/roasts in EN+HI, difficulty curve 0.2→0.95). The defects are all in game logic and wiring, not content.

---

## 🔴 CRITICAL

### C1. Game dies on load — `nameA`/`nameB` handlers reference elements that don't exist  → most buttons dead

**Lines:** `public/index.html:1531-1532` (elements `id="nameA"`/`id="nameB"` do not exist anywhere in the HTML — verified by full-ID scan; only safe `if()` guards reference them at line 1383).

**What happens:** during initial script evaluation, `$('nameB').onclick = …` executes → `$()` is an unguarded `getElementById` → returns `null` → **`TypeError: Cannot set properties of null`** → the whole first `<script>` block aborts at line 1531. In the browser this means:

**Still alive (wired before line 1531):** bot name arrays, `BotAI`, global `G`, mode buttons **Offline/Online/Instant** (lines 1486–1505), Profile button (1506), tutorial (1524–1525, auto-pops at 800 ms), username save, leave/confirm dialogs (1453–1455), Team-size visuals, plus *all* hoisted function declarations (ball engine, story functions, etc. — they exist but many reference uninitialized `let/const` and throw when used).
Script blocks 2 & 3 still run: emoji chat, bot chat, and the Friends panel **are alive**.

**Dead (everything wired after line 1531 — never attached):**
- ⚫ Team-size selectors click logic (1534–1536) — tapping 2v2/11v11 does nothing
- ⚫ Heads/Tails buttons (1539–1540) → **Offline mode permanently stuck on the toss screen**
- ⚫ Bat/Bowl buttons (1542–1543), online Create/Join/Retry/Copy (1567–1571) → **online mode cannot start**
- ⚫ Team confirm, team builder save (1700–1738), online toss (1759–1768), Start match (1795)
- ⚫ **The gesture-grid listener (1843)** → even in modes that limp along, your taps on 1–6 do nothing
- ⚫ Next innings / rematch / main-menu buttons (1915–1921)
- ⚫ Role assignment buttons (2104–2163) → team-size>1 instant matches get stuck on the role screen
- ⚫ Story buttons (2454–2513), story language switcher (2524), the **Story mode button injection** (2556+) → **Story mode is not even reachable**, and opening the Team tab crashes inside `renderStoryHome()` because `storyProgress` (declared line 2167) is still in TDZ
- ⚫ Matchmaking Cancel / Play-vs-Bot (2769–2770)
- ⚫ Initial arena render, hands, home username/trophies (2823–2825) → arena hands are blank until something else re-renders

**Effectively:** *Offline* = stuck at toss; *Online* = stuck in lobby; *Instant* (1v1) = an unwinnable ghost match that auto-plays itself because you can't tap gestures; *Story* = unreachable/blank; *Friends/Profile* partially work.

**Fix (one line):** delete lines 1531–1532, or guard them (`const nb=$('nameB'); if(nb) nb.onclick=…`). The clickable player-name feature those lines belonged to was never built into the HTML.

> This is very likely the real cause of the "Not able to click anything" bug previously "fixed" with CSS `pointer-events` hacks — the JS was dead the whole time.

---

## 🟠 HIGH — gameplay engine defects (visible after C1 is fixed)

### C2. Batting/Bowling player lookup is swapped when the *opponent* bats

**Lines:** `curBowler()` `index.html:1404`, `curBatter()` `:1405`, consumers: `updatePlayerDisplay` (:1406), `applyGestureRestrictions` (:1997), `revealBowlerRole` (:2025), `pickAllowedGesture` (:1836), `selectPlayer`/`showPlayerSelect`.

**Code:** `curBatter(){ const bat = G.iBat ? G.me : G.opp; return G.myPlayers[G.batIdx] }` — when the bot/opponent is batting (`G.iBat=false`), the *human's* player list is indexed as the "current batter", and `curBowler()` indexes the *opponent's* list.

**User-visible result (any team-size > 1 match where you bowl):**
1. **Your gesture restrictions come from the OPPONENT's player** — e.g. when you bowl, your allowed picks (1–6 grid greys out numbers) are derived from the wrong roster's role, so an aggressive *enemy* bowler locks *you* into 3–6, or a defensive one bans your 5–6.
2. "Batting/Bowling" labels under the two hands show the wrong players/teams.
3. The post-wicket "bowler role reveal" banner reveals *your* batter instead of the bowler who took the wicket.
4. When you bat second after bowling first, your first-innings bowling picks were effectively role-random.

**Fix:** swap lists in the two helpers:
`curBatter(): return (G.iBat ? G.myPlayers : G.oppPlayers)[G.batIdx]`
`curBowler(): return (G.iBat ? G.oppPlayers : G.myPlayers)[G.bowlIdx]`
Then re-check every consumer's intent.

### C3. "Select next batter/bowler" writes to the wrong index slots

**Lines:** `showPlayerSelect` (:2668), `selectPlayer` (:2706), `autoSelectOpponent` (:2647).

- When **you** select a new *bowler* (`type==='bowl'`, `G.iBat=false`), `selectPlayer` falls into the `else` branch and writes **`G.batIdx = idx`** (your batting slot) instead of `G.bowlIdx` — your chosen bowler is never actually made current; the "used" player exclusion also reads the wrong index.
- The auto-select branch for the bot (when the bot needs a new batter/bowler) has analogous crossed indexes (`autoSelectOpponent('bat')` bumps `G.batIdx` on the wrong list in one innings orientation).
- Innings-break countdown / player-select flows: selecting works only by luck of symmetric rosters.

**User-visible result:** in team modes, after a wicket/over you can end up "selecting" a player who then never appears as the new batter/bowler, or the same player bats twice while others wait, with no coherent rotation.

**Fix:** make `selectPlayer`/`showPlayerSelect` use `batIdx` when selecting batters and `bowlIdx` when selecting bowlers, on the side that is actually batting/bowling (use corrected `curBatter/curBowler` from C2).

### C4. Per-player stats are never recorded — scorecards empty, "out" never tracked, dismissed batters can bat again

**Lines:** arrays created in `initPlayerStats` (:2627), read in `showPlayerSelect` (:2674) and `showInningsBreak` (:2721) — but **no code path ever writes runs/balls/wickets/out to them** (verified: the only `.runs +=`/`.balls +=`/`.out` writes in the file are the innings totals in `revealBall` and `defaultStats`/profile aggregation). Bowler `overs`, `wickets`, `dots` are also never accumulated.

**User-visible result:**
1. The **innings-break scorecard always shows zeroes** for every player (only the team totals row renders).
2. `stats[i].out` is never set → the player-select list treats dismissed batters as available → **the same batter can bat again after being out** (in team-size modes).
3. Bowler figures ("2w 14r") never appear anywhere.

**Fix:** in `revealBall` (and `dotBall`/`noBall`), also update `myBatStats`/`myBowlStats`/`oppBatStats`/`oppBowlStats` for the current batter/bowler: runs, balls, fours, sixes, `out=true` on dismissal (and set `G.batIdx` to next available before showing the selector).

### C5. `G.storyDifficulty` leaks into every other mode (never reset)

**Lines:** set in `startStoryMatchPlay` (:2361) — nowhere else resets it to 0. Used at `startOffline` (:1555) and `nextBall` (:1825): `BotAI.difficulty = G.storyDifficulty || …`.

**User-visible result:** after playing even one Story match (difficulty 0.2–0.95), every later **casual Offline match and Instant match silently plays at the story difficulty** — the National-tier bot (0.95) shows up in casual mode with no explanation. It also permanently disables bot chat for casual matches (see D4).

**Fix:** reset `G.storyDifficulty = 0` in `resetGame()` and at the start of `modeOffline`/`modeInstant` handlers.

### C6. Mode state never fully resets between sessions

**Lines:** `resetGame()` (:1922) resets the core, but the **story mode wrapper** (`finishMatch` override, :2578) fires on *every* offline match — `if (G.mode === "offline" && storyProgress && storyProgress.myTeam)` — i.e., once you've started Story mode, **every casual offline win/loss is also written into your story career** (push to `matchResults`, `stats.matchesPlayed++`, …), corrupting career stats and re-triggering story dialogue after casual matches. No flag distinguishes "story match" from "casual offline match".

**Fix:** introduce a `G.isStoryMatch` flag set in `startStoryMatchPlay`, cleared in `resetGame`/mode entry, and gate the wrapper on it.

---

## 🟠 HIGH — broken/incomplete features

### C7. Instant Match is a fake — and it lies about it
**Lines:** `modeInstant` handler (:1505), `startMatchmaking` (:2771–2792).

The mode literally sets `G.mode='offline'` (:1505), then `startMatchmaking()` runs an 8-second timer ("Searching for a real player…" → "Found opponent!") and calls `startBotMatch()` — a bot. There is no matchmaking service anywhere (only a cosmetic `roomId='mm_…'` PeerJS peer that nobody ever joins). Copy says "Find opponent now"; behavior is a bot match with a fake wait.

### C8. Friend "Play" button is a dead end
**Lines:** `window.challengeFriend` `index.html:3066-3072` (block 3).

Clicking **Play** on a friend only hides the friends overlay and sets `G.oppName` + `G.isBot=false` — it **never starts a match, never opens a room, and never contacts the friend**. The user lands back on the menu with nothing happening. The whole "challenge" concept (server `/api/challenges.js` exists) is unwired: `window.checkBotChallenges` and `window.maybeBotChallenge` are **empty functions** (:3138, :3177), called defensively at :1913 and end of block 1.

### C9. Cloud save/load endpoints are syntactically invalid (from previous audit — still open)
**Lines:** `public/functions/api/save.js:1` and `load.js:1`: `export onRequestPost/Get = …` — invalid ESM; every other handler uses `export const`. Verified with `node --input-type=module` import → `SyntaxError: Unexpected token 'export'`. Consequences:
- Cloud story saves and loads fail (page `fetch('/api/save')` at :2500, `'/api/load'` at :2506).
- **Local fallback is also broken:** `cloudSaveStory()` only writes `localStorage` inside the `catch` — a 404/500 response doesn't throw, so the local backup never happens → **story progress is not persisted anywhere** after the endpoints break.
- `wrangler pages deploy` will fail bundling the Functions directory — taking `/api/friends` down too (friends sync then also silently breaks).

### C10. Story career double-counting and wrong result markers on replay
**Lines:** story `finishMatch` wrapper (:2578+) and `renderStoryHome` (:2213).

`matchResults` is an append-only list. Lose a match → a `{tier, match, won:false}` entry is pushed and `currentMatch` does NOT advance; replay and win → a second entry for the same (tier, match) is pushed. Consequences:
- Progress "X / 37 matches" counts replays, so it inflates beyond 37 / shows wrong percent.
- The match-dot lookup uses `findIndex`, so the *first* (loss) record wins → the dot shows red even after you've won the replay.
- `storyProgress.stats.matchesPlayed/wins/losses` include every replay.

### C11. Innings-break 10-second countdown starts for the *bowling side* break too and can double-fire
**Lines:** `endInnings` (:1893), `showInningsBreak` (:2721), `btnInnBreakNext` (:1916).

When the first innings ends, `showInningsBreak()` starts a 10s auto-timer. If the player taps "Start 2nd Innings" the timer is cleared — but if they let it run out **while the second innings break overlay for the other side's first innings is also showing** (online host flow), `startInnings(2)` can fire twice (no `G.innings` guard). Offline the flow works, but in online matches both players' breaks are not synchronized — the joiner never sees a break overlay at all (only "Waiting for host…", `endInnings` :1902) and gets no scorecard.

### C12. Opponent profile view shows the wrong name and a fake "Sign in" row
**Lines:** `showProfile` (:1924), `showOppProfile` (:1973), `ProfileTabs` (:1962).

`showProfile(name, stats)` renders the rank/badge/stats from `stats` but the avatar-name row always prints **`G.myName`** (your own name), so viewing an opponent's profile shows "Ravi vs you" with YOUR name in the header. The player ID is random per render (`G` + 6 random digits) — no persistent identity. "Sign in to save progress" is decorative; no sign-in flow exists and `/api/profile` is never called by the page.

### C13. Fake daily-challenge strip + placeholder tabs
**Lines:** daily strip `index.html:787-793`; TabBar `:1334-1339`.

- "RANK — / CHANCES 0/3 / POINTS 0 / First 3 matches played in Local Club" — **no JS ever writes to these values** (pure decoration).
- Lounge and Tournaments bottom tabs just `alert('coming soon…')`.
- TabBar `arena` tab shows the matchmaking overlay but **does not hide the main menu overlay first** (menu stays underneath/stacked).

### C14. Matchmaking "Play vs Bot Now" button is invisible until you look for it, and Cancel/Play-Bot are dead pre-C1
`btnMMPlayBot`/`btnMMCancel` (:850-851) exist and their handlers (:2769-2770) are wired post-crash; minor UX: the "Play vs Bot" escape hatch is always shown even during the "searching" phase and does nothing after the fake search ends (handler guards `if(!mmSearching) return` — after the 8 s auto-path sets `mmSearching=false`, the button is inert while "Found opponent!" waits 800 ms).

---

## 🟡 MEDIUM / LOW tail

| # | Finding | Lines |
|---|---|---|
| M1 | `getTeamSize()` reads the **first** `.team-size-btn.active` in DOM order — each of the three size selectors (offline/online/mm) keeps its own `active`, so hidden selectors from a previous screen can determine the match size | :1449 |
| M2 | `hatricks` increments whenever you take **3+ wickets in a match**, not 3 in a row (and only once per match) — stat is meaningless | :1442 |
| M3 | Dots counting fallback (`result.myBalls − mySixes − myFours − myRuns`) goes negative for high-scoring matches; `NB` entries are counted as dots | :1438-1440 |
| M4 | Bot AI "level" display: `BotAI.level()` returns "Expert" purely by ball count/phase — shows Easy→Expert every match regardless of actual difficulty; plus instant-mode matches label `Bot: …` from stale state | BotAI :1190 |
| M5 | Story-language switch persists via cloud only; if cloud fails, chosen language is not saved locally (see C9) | :2524 |
| M6 | RR roster contains both "Boult" and "Bolt" (two Trent Boult entries); PBKS "Chahar" vs CSK "Chahar" duplicates fine but same-name players confuse role sync by name in online mode (`d.players` matched by `p.name`, :1674) — two same-named players on one side break role sync | TEAMS :1018 |
| M7 | Version drift: UI says `v2.1` (:803), `package.json` 2.0.0, README "~95 KB" (actual 239 KB), audit doc outdated; story data cache-buster still `?v=2` | |
| M8 | README instructions for KV namespace are outdated (real KV ids already in `wrangler.jsonc`) | README |
| M9 | Tutorial auto-shows 800 ms after every load until "Don't show again" is ticked — but "don't show" is only stored when the checkbox was ticked at close; users who hit Skip keep seeing it. Also shows even when a user is arriving via a share link to rejoin a room (in-progress online match) — mid-match overlay collision | :1522-1525 |
| M10 | `maybeBotFriendRequest` fires for **story-mode** opponents too (any `G.isBot` match), so boss opponents randomly ask to be your friend mid-career | b3 :3171 |
| M11 | Online: no keep-alive/disconnect detection beyond PeerJS close events; `armWD` watchdog treats a silent opponent as a missed pick and auto-plays balls, so a frozen opponent turns the match into a bot-vs-bot ghost game | :1400 |
| M12 | `botChat` unreachable events: `onDot` can never fire (`bVal===0` impossible), `onOneToWin`, `onBotLastBall`, `onMatchStart`, `onBigChase`, `onPlayerWinning`, `onBotWinning` are never emitted anywhere | b2 :2947 |
| M13 | `mmSearching` is never declared (`let`/`var` absent) — works only via implicit global | :2769-2784 |
| M14 | "Found opponent!" after fake search shows even in a bot match that then says "YOU vs BOT" — plus instant team-size>1 matches open the role screen with no pre-match toss | :2771+ |
| M15 | Hitting 6 on a **free-hit ball** counts +6 but free-hit is consumed only when numbers differ — same-number free-hit adds runs with `flash("FREE HIT! +n")`, fine — however free-hit same-number adds **the matched number** rather than a free run; inconsistent with the "can't be out" promise wording in tutorial | :1844-1870 |
| M16 | `escAttr` only escapes quotes — friend names containing `</button>` style payloads are not XSS-safe in `renderFriendList` HTML strings (names are user input) | b3 :3090 |
| M17 | No PWA manifest/service worker; fonts/GA/PeerJS from third-party CDNs without SRI | index head |
| M18 | `resetGame()` doesn't restore `status`, `offlineBotStats`, `botLvl`, `matchStatsBox` or re-hide `waitingOverlay`/`tossOverlay`/`mcOverlay` — stale overlays can reappear after "Main Menu" in some flows | :1922 |
| M19 | Google Analytics loads even when no network game is running; no consent — note if privacy matters | head :14 |

---

## ✅ What is genuinely solid (verified, not broken)

- Story content: 8 tiers × 37 matches, EN/HI narratives, roasts, 81-player pool with full styles, per-tier difficulty ramp 0.2→0.95 — programmatically validated, zero missing keys.
- Bot AI: real 2nd-order Markov + anti-pattern + context logic — legitimate.
- Core ball resolution, free-hit, innings math, chase target logic, overs/wickets scaling — coherent.
- Hand renderer (SVG cartoon hands), coin-flip animations, flash/confetti/sfx/haptics systems — complete.
- Emoji/quick-chat + bot banter subsystems — fully wired (except dead event types).
- Friends list add/remove/accept/reject with KV sync — works client-side & server-side (aside from challenge stub & C1).
- Tutorial slides, username flow, custom team builder, role-assignment UI & squad-limit validation — complete.
- Rejoin/session snapshot logic for online rooms — thoughtful and mostly correct.

---

## 🔧 Suggested fix order (smallest blast radius first)

1. **C1**: delete/guard lines 1531–1532 → page initializes; most features come alive instantly. Test all five flows afterwards.
2. **C9**: add `const` to the two API files → cloud story save works again (adds local fallback for non-2xx too).
3. **C2 + C3 + C4**: repair `curBatter/curBowler`, `selectPlayer`/`autoSelectOpponent`, and wire per-player stats into `revealBall` → team modes become correct cricket.
4. **C5 + C6**: `G.storyDifficulty` reset; add `isStoryMatch` flag.
5. **C7/C8/C10/C11/C12/C13**: product decisions (real matchmaking vs honest copy; finish challenges or remove Play button; story replay semantics).
6. Long tail (M1–M19) as hygiene passes.

---
*Analysis method: full read of all script blocks (prettified for inspection), ID-cross-reference scan of all 234 DOM ids vs 222 `$()` uses, `node --check` + dynamic ESM import of every API file, programmatic validation of story-data.js, and targeted greps for stat writes/state resets.*
