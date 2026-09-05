# AI_CONTEXT.md — Hand Cricket Pro v2.8

> Read this first. It maps the whole codebase so an AI or vibe coder can make
> changes without guessing. Companion docs (audit history & known bugs):
> `docs/`. There is **no build step** — this is a static Cloudflare Pages
> site (`public/` is deployed as-is).

---

## 1. Top-level layout

```
handcricket/
├── public/                  ← THE WEBSITE (deployed 1:1, zero build)
│   ├── index.html           Slim shell: markup + <link> + 22 ordered <script>s
│   ├── css/app.css          THE single v2.5 design system: "Night Stadium" dark
│   │                       theme, responsive framing + every screen (edit visuals HERE).
│   │                       NOTE: old css/theme.css layer was deleted in v2.5.
│   ├── js/                  Game logic — see the numbered load order below
│   └── (no functions/ here — see below)
├── functions/               Cloudflare Pages Functions (KV-backed REST).
│                            MUST be at the repo root: Pages only compiles
│                            <root>/functions. Inside public/ it is deployed
│                            as static files and the API 404s.
├── tools/smoke.mjs          jsdom regression suite — RUN BEFORE/AFTER changes
├── docs/                    Analysis artifacts (audit, directory map, bug hunt)
├── AI_CONTEXT.md            ← you are here
├── wrangler.jsonc           Pages project + KV binding config
├── package.json             No deps for the app itself; jsdom only for tests
└── .github/workflows/       Deploy on push to main
```

## 2. `public/js/` — load order IS the architecture

All files are **classic (non-module) scripts** that share the global scope.
Order matters only for *load-time* statements; function declarations are
hoisted, so cross-file calls resolve at call time. Each file starts with a
`FILE:` header describing its role + dependencies.

| # | File | Owns |
|---|------|------|
| 1 | `story-data.js` | `STORY_DATA` — 8-tier career content (pure data) |
| 2 | `01-config.js` | IPL `TEAMS`, `ALL_PLAYERS`, role/gesture rules, bot name pools |
| 3 | `02-bot-ai.js` | `BotAI` — Markov+context bot predictor (`bowl()/bat()`) |
| 4 | `03-state.js` | `TIMER`/`CIRC`, **`G` (the single game-state object)**, `$`, session/snapshot/persist helpers, net vars |
| 5 | `04-hands.js` | `HandRenderer` / `getHandSVG` / `buildArenaHand` / `setHandGesture` / `handPump` / `enhanceGestureButtons` — **v2.7 articulated hands**: one persistent SVG skeleton per hand (3 phalanges/finger), joint angles tweened with rAF (staggered index→pinky), bold cream keyline, opponent mirrored, viewBox 200×300 |
| 6 | `05-navigation.js` | Home/menu show-hide, bottom `TabBar` |
| 7 | `06-sfx.js` | `ensureAudio`, `sfx()`, haptics |
| 8 | `07-display.js` | Scoreboard/HUD, flash, confetti, countdowns, leave dialog, shared toss-coin animation (`tossSpin`/`tossLand`/`tossSettle`) |
| 9 | `08-network.js` | `sendMsg`, `destroyPeer`, connection log |
| 10 | `09-engine.js` | **Match engine**: innings, ball resolution, scoring, roles rotation, per-player stats, result |
| 11 | `10-profiles.js` | Username, career stats (`hc_stats`), profile-card UI |
| 12 | `11-modes.js` | Home mode buttons (Offline/Online/Quick/Story entry), career strip |
| 13 | `12-tutorial.js` | How-to-play slides + team-size pickers. v2.5: NEVER auto-opens; only the home "How to Play" button opens it (`btnHowTo`) |
| 14 | `13-offline.js` | Bot-match bootstrap (ex-Offline menu): rosters, role screen, `startOffline()`. Offline menu + coin-toss screen removed — Quick/Story only; `G.mode='offline'` still means vs-bot internally |
| 15 | `14-online.js` | PeerJS P2P: host/join, protocol `handleNet`, team builder, toss |
| 16 | `15-roles.js` | Role styles (AGG/DEF/BAL), gesture restrictions, role overlay |
| 17 | `16-story.js` | Story career: tiers, dialogue, team builder, cloud save, **story→engine hooks** |
| 18 | `17-selection.js` | Batter/bowler rotation pickers + innings-break scorecard |
| 19 | `18-instant.js` | **Quick Match** (honest bot game, staged ~3s search, random toss) + boot-time init (loads last) |
| 20 | `19-chat.js` | Quick-chat + bot banter — float bubbles are TEXT + inline-SVG face chips (`faceSVG`, mood tokens). Legacy emoji tokens map via `LEGACY_EMOJI_TO_MOOD` (never rendered as emoji) |
| 21 | `20-friends.js` | Friend lists/sync, friend requests, challenge invite |

## 2b. v2.8 changes you must not undo

| Area | What changed | Where |
|------|--------------|-------|
| **Deploy** | `functions/` moved from `public/functions/` to the repo root. Pages only compiles `<root>/functions`; the old path shipped zero Functions **and** exposed handler source at `/functions/api/*.js`. | `functions/api/*`, `.github/workflows/deploy.yml` (also fixed `--project-name handscricket` → `handcricket`) |
| **Friends** | The client now speaks the server protocol (`add` / `accept` / `reject` / `remove`). It used to POST `{action:"sync"}` for everything, which the server rejected with **400 "Invalid action"**, so no request ever reached a second device. `sync` is still accepted server-side as a merge, for old clients. | `20-friends.js`, `functions/api/friends.js` |
| **Invites** | "Play" on a friend creates a room **and** pushes an invite (with the code) into their inbox. The inbox is polled on boot, on opening Friends, and every 20s while visible — there is no realtime channel. | `20-friends.js` (`pollInbox`/`joinInvite`), `functions/api/challenges.js` |
| **Stats** | `outs` now comes from `result.myWickets` (times you were dismissed). It used to add `result.oppWickets` — the wickets you **took** — so Batting Avg was runs ÷ wickets-taken. Bowling "Dots Bowled" now counts `result.oppHist` (added to the engine result); it used to show your batting dots. | `09-engine.js`, `10-profiles.js` |
| **Stats keys** | Career is per-username (`hc_stats:<name>`, legacy global blob migrated on first `setUsername`). Player id is a stable `HC-######` derived from the name, not a re-randomised fake. Opponent names are escaped before `innerHTML`. | `10-profiles.js` |
| **Opponents** | Offline + Quick Match opponents are personas: clean Indian name, home city, style, career — all derived **deterministically from the name** (`genBotProfile(name)` + `personaStats()`), so the same player never shows two careers. No "BOT"/"Ultra Bot" labels remain in the UI. | `01-config.js`, `11-modes.js`, `13-offline.js`, `18-instant.js`, `07-display.js` |
| **Quick Match** | Two steps: **Find Opponent** → staged ~3s search → persona card → **Start Match**. Team name is always `<username>'s Team` via `defaultTeamName()` — never asked, never typed. | `18-instant.js`, `#mmPersona` |
| **Renames** | Username renames capped at 2 per device (`hcp_renames`; first naming free; programmatic switches exempt). Rename carries the career over and re-publishes (keeps the Google link). Counter shown in `#renameHint`. | `10-profiles.js`, `11-modes.js` |
| **My XI + no team select** | No IPL/team-select screen anywhere: every side fields its profile XI (`hcp_my_xi`, typed once via profile → My XI editor, also auto-opened on first naming), sliced to the matched format. Online exchange reuses the `team` message (key `"xi"`); role screen then toss follow directly. | `14-online.js` (`loadMyXI`/`mySquad`/`openMyXI`/`exchangeRosters`), `13-offline.js` |
| **Invite join** | The lobby has a room-code field (`#roomCodeInput`, normalised to `A-Z0-9`), so a lost invite link is not a dead end. Hosts see the 6-char code plus the link. Joiners now get `setUsername()` and are gated by `ensureUsername()`. | `14-online.js` (`setLobbyMode`/`resolveRoomCode`), `18-instant.js` boot |
| **Feedback** | `toast()` and `confirmDialog()` (in `07-display.js`) replace every native `alert()`/`confirm()`. Add a smoke check if you reintroduce one. | `07-display.js` |
| **Nav** | The dock is Profile · **Friends** · Play · Career · Help. The old "Arena" tab duplicated the home Quick Match tile; Friends had no root entry at all. Profile and Friends sheets now close each other, and overlays have explicit `z-index`. | `05-navigation.js`, `index.html`, `app.css` |
## v2.9 — ownership, scale, installability, retention

| Area | Change | Files |
| --- | --- | --- |
| **API ownership** | Every mutating endpoint requires a device token. The browser generates one on first run (`hcp_token`); the server records the first token to claim a name and returns 403 afterwards. Profiles idle >90 days can be re-claimed so clearing localStorage isn't a permanent lockout. **This is not authentication** — it stops drive-by tampering, not a determined attacker. | `lib/api/shared.js`, all of `functions/api/` |
| **Leaderboard index** | `leaderboard:top` holds the sorted top 50. A publish rewrites it (1 get + 1 put); a leaderboard read is 1 get. The old `list` + per-player `get` scan is now only the one-time seed path (`?refresh=1` forces a reseed). | `lib/api/shared.js`, `functions/api/leaderboard.js` |
| **Relay config** | `buildIceServers()` prefers `HC_TURN_URLS/USERNAME/CREDENTIAL` from `/api/config`, falling back to the free Metered openrelay. Set them in the Pages dashboard to swap relays with no rebuild. | `public/js/14-online.js`, `functions/api/config.js` |
| **Role sync** | Online styles now sync **by squad index**, not by name — the RR `Boult`/`Bolt` duplicate proved name matching was unsafe. Name is still sent for fallback with older peers. | `public/js/14-online.js` |
| **Analytics consent** | GA is not loaded until `hcp_consent === 'yes'`. A dismissible bar records accept *or* decline. | `public/index.html`, `public/js/21-shell.js` |
| **Installable** | Manifest + service worker (network-first, never caches `/api/`). Icons are generated PNGs, committed. | `public/manifest.webmanifest`, `public/sw.js`, `public/img/` |
| **Avatars** | Deterministic inline-SVG faces from a name hash — same name, same face, on every device. No image assets, no network. Replaces the bare initial in profile, persona, friend and leaderboard rows. | `public/js/22-avatars.js` |
| **Retention** | Daily streak (`hcp_activity`, one increment per calendar day), head-to-head per pairing (`hcp_h2h:<me>:<them>`), and "Auto-pick my XI" which fills legal role styles per `getRoleLimits()`. | `public/js/23-features.js`, hooks in `09-engine.js` |
| **Sharing** | Result screen renders the scorecard to a canvas and uses the Web Share API; falls back to download, then to a clipboard text summary. | `public/js/23-features.js` |
| **Arena life** | A crowd band drifts in the stands while a match is live; a ball trail plays on reveal. Both suppressed under `prefers-reduced-motion`. | `public/index.html`, `public/css/app.css`, `09-engine.js` |
| **Type ramp** | `--ink-soft`/`--ink-faint` widened from .62/.40 to .80/.45 — the two were 22 points apart, so secondary and tertiary text read as one tier. | `public/css/app.css` |

### Knockout cup (`24-tournaments.js`)
The dock tab labelled **Tournaments** used to open the tutorial. It now opens a
real 4- or 8-player single-elimination cup. It reuses the ordinary offline match
engine (`startQuickBotMatch`) rather than a second implementation, so roles, free
hits and career rules all behave. State persists in `hcp_cup`.

**Fix found by its own tests:** the first version only removed the opponent the
player actually beat, so the fixtures you don't play never resolved and a
4-player cup needed three wins. A knockout round now halves the field, always
including the beaten opponent — 4 players takes 2 wins, 8 takes 3.

### Match replay (`25-replay.js`)
The engine already records every ball in `G.me.hist` / `G.opp.hist`, so replay is
**playback, not simulation** — nothing re-rolls a result, so a replay can never
disagree with the match it came from. Last 5 matches kept in `hcp_replays`.
Ball values are `"DOT"`, `"NB"`, `"W"` and numeric runs.

### Not done, and why
- **SRI on the PeerJS CDN tag** — the sandbox has no outbound network, so the hash could not be computed. Guessing one would break online play outright. `21-shell.js` detects a failed load and labels the online buttons instead.
- **Server-authoritative online play** — PeerJS is peer-to-peer, so either client can still misreport a score. Needs a Durable Object per room. This is the one remaining architectural gap.

| **Leaderboard** | `GET /api/leaderboard?limit&me` ranks `profile:*` by wins (ties → win%). Real players only: personas are generated in memory and never persisted, plus an `isPersona` guard. Home → **Leaderboard**; tapping a row opens that player's live profile. Client fetch uses `cache:no-store`, API sends `Cache-Control:no-store`. A solo/offline player always sees their LOCAL career row (with sync/offline note) even when the server is empty or unreachable. Join dials `hcp_<room>` with ~1min backoff (`JOIN_BACKOFF`/`scheduleJoinRetry`), presence-aware host-offline warning, keep-waiting Retry. | `functions/api/leaderboard.js`, `10-profiles.js`, `#leaderboardOverlay` |
| **Player profiles** | `showUserProfile(name)` fetches `/api/profile?user=` for **live** stats — used by friend rows and leaderboard rows. Action buttons `stopPropagation` so they don't also open the sheet. | `10-profiles.js`, `20-friends.js` |
| **Role locks** | Every greyed gesture number carries `data-lock-reason`; the arena shows a one-line role hint; tapping a locked number toasts the reason instead of doing nothing. | `15-roles.js`, `#roleHint` |
| **Scroll** | Sheets are the only scroller (`.friend-list` is no longer a nested scroller), `overscroll-behavior:contain`, and `padding-bottom` clears the dock. Short viewports shrink the coin and hide `#tossPreStats`. | `app.css` |
| **Rosters** | No duplicate names inside a squad — RR had both `Boult` and `Bolt`, which broke online role sync (it matches by name). | `01-config.js` |
| **Type** | No font size below 10px (was 7px). `.prof-id` was 9px at 2.33:1 contrast; it is now 11px on `--ink-soft`. | `app.css` |
| **Quick matchmaking** | Named seekers only (blank rejected server-side; client re-opens the name gate). Poll `POST /api/quickmatch` every 2s; STRICT same-format pairs only (earlier seeker hosts, room code shared) — never cross-format, so a 1v1 pick can never become T20. Relaxed cross-format pairs adopt the HOST's size — always announced (toast), reflected in every size picker (`syncSizeButtons`), and shown in the waiting room, so nobody "picks 1v1 and gets T20" silently. Rendezvous lives in the `handcricket-matchmaker` Worker (`Matchmaker` Durable Object, ONE global in-memory pool — zero replication lag, which KV reads cannot give: up to 60s stale per location). The Pages route calls it over HTTPS and falls back to the same core on KV. Identity is the per-device `hcp_cid`, never the display name. Rooms are deterministic per pair; existing records adopted, never duplicated; N seekers pair oldest-first. Bot fallback and match start both send `leave`. Nothing by a random 18–25s cutoff → bot persona fallback (Play Bot Now after ~8s). Waiting responses carry seeker count; backgrounded tabs re-poll on visible. Matched pairs ping `joined` (anonymous `quick:events` ring buffer tracks health). `tools/qm-sim.mjs` proves convergence on both backends. | `workers/matchmaker/`, `lib/api/qm-core.js`, `functions/api/quickmatch.js`, `18-instant.js` |
| **Presence** | Heartbeat `POST /api/presence` (60s interval + screen transitions); records TTL 150s. Friend rows show dot + Online/Xm ago; bots use deterministic pseudo-presence (`botPresence`). Play challenges are gated on known-offline. `window.hcPresenceSet(state, room)` drives it; `finishMatch` resets to menu. Every interaction stamps `hcp_seen`, which outranks stale data for 5 min on both paths — nobody you just played shows "offline 29m ago". | `functions/api/presence.js`, `20-friends.js` |
| **Spectate** | Host publishes snapshots (`spectate:<room>`, 45s TTL); spectators poll 3s; pings + capped comments; eye icon + count for the host, viewer sheet, preset comments; bot spectators simulated on-device. KV missing → everything no-ops silently. | `functions/api/spectate.js`, `26-spectate.js` |
| **Bot skill** | `BotAI.skillFor(career)` tiers Learner→Master (diff .15→.85); applied per ball in `nextBall` (story keeps authored difficulty); mistake gate scales blind guesses; role clamp downstream keeps rules equal; tier chip in `updBotLvl`. | `02-bot-ai.js`, `09-engine.js` |
| **Google sign-in** | Optional GIS button (username + profile sheets); Client ID ships as fallback (`HC_GOOGLE_CLIENT_ID` env overrides). Credential verified server-side (JWKS, KV-cached, aud-checked) and linked as `googleSub` for cross-device reclaim. Anonymous device-token play always works. Never commit the client SECRET — the button flow doesn't use it. | `27-auth.js`, `lib/api/shared.js`, `functions/api/profile.js` |
| **KV missing** | Every endpoint returns 503 + `degraded:true` instead of throwing 500s. Client falls back to local data everywhere (leaderboard local row, friends local list). If the board is empty in production, bind the KV namespace in the Pages dashboard. | `functions/api/*`, `lib/api/shared.js` |

> ⚠️ Rule: **never create load-time dependencies on later files.** If a file
> needs a value from a later file at parse time, reorder the `<script>` tags in
> `index.html` instead of hacking around it.

## 3. Core mental model — state & flow

- **One global state object:** `G` (in `03-state.js`). UI reads/writes it
  directly. Never duplicate game state in DOM or module vars.
- **`G.iBat` = "is MY team batting right now?"** (per-client in online mode).
- `curBatter()`/`curBowler()` (in `09-engine.js`) resolve rosters
  **side-aware**: batter comes from the batting side's XI, bowler from the
  bowling side's XI. Keep it that way — mixing sides was bug C2.
- **Rotation:** new batter after a wicket (from the batting side), new bowler
  at the end of each over (from the bowling side). You only ever *pick* for
  YOUR team (`showPlayerSelect`); the bot/opponent is auto-rotated
  (`autoSelectOpponent`). Both live in `17-selection.js`.
- **Per-ball lifecycle (offline):** `nextBall()` → state `waiting` → gesture
  click/`onTimeUp` → `triggerReveal()` → `revealBall()` (out/runs/free-hit,
  stats, rotation) → `nextBall()`… → `endInnings()` → innings break
  (`showInningsBreak`) → `startInnings(2)` → `finishMatch()`.
- **Modes:** `G.mode` = `offline` | `online`. Casual offline + Quick Match are
  both "offline vs bot"; Story is offline too but sets `G.storyMatch=true` so
  results land in the story career instead of nothing/casual (bugs C5/C6).

## 4. Storage keys (localStorage)

| Key | What |
|-----|------|
| `hcp_username` | Player name |
| `hc_stats` | Casual career stats (`loadStats()`/`saveStats()`) |
| `hcp_story` | Local story-career backup |
| `hc_sess` (sessionStorage) | Online room rejoin snapshot |
| `hc_tut_dismissed` / `hc_tut_skipped` | Tutorial opt-out |
| friends `hcp_friends_*` | Friend lists (see `20-friends.js`) |

## 5. Cloudflare Pages Functions (`public/functions/api/`)

KV namespace binding is **`KV`** (see `wrangler.jsonc`). Files export
`onRequestGet/Post/Options` (note: `export const onRequestX = …` — bare
`export onRequestX` is invalid ESM and breaks the whole Functions bundle —
bug C9 fixed). Endpoints: `/api/save`, `/api/load` (story), `/api/profile`,
`/api/friends`, `/api/challenges`.

## 6. Rules for safe edits

1. **No bundler, no import map, no build step.** Plain scripts only.
1b. **Sound policy:** `sfx()` only plays gameplay moments (whitelist in
    `06-sfx.js`) — UI taps/tick/run sounds are silent. Don't add sfx to menus.
1c. **No emoji glyphs as UI (v2.5).** Buttons, icons, chrome, avatars and
    floating taunts must be inline SVG or typography. New visuals belong in
    `app.css` + inline `<svg>`; mood art lives in `19-chat.js` `faceSVG()`.
    The only emoji left in code is the `LEGACY_EMOJI_TO_MOOD` mapping table
    (parses old peers' messages into SVG faces — never renders emoji).
1d. **How-to-play never auto-opens** (v2.5). It is reachable only via the
    home "How to Play" button (`btnHowTo` -> `openTutorial()` in 12-tutorial).
2. Prefer editing inside the module that owns the feature (map above).
3. Keep all user-supplied strings HTML-escaped (`escHtml`/`escAttr`) —
   friend names are untrusted input (M16).
4. Keep **per-player stats arrays** (`G.myBatStats/myBowlStats/oppBatStats/
   oppBowlStats`) in sync with every scoring path in `09-engine.js`.
5. Story hooks live in `16-story.js` wrappers — gate everything on
   `G.storyMatch`, never on `G.mode`.
6. **Test** with `node tools/smoke.mjs` (jsdom boots the real page, plays
   offline + quick + 5v5 role-screen matches, checks story isolation).
   Add a check for every new fix. Keep `tools/` out of `public/`.
6b. **Bottom dock = root-screen only (v2.6.1).** `#tabBar` is absolute at the
    bottom of `#app` (z14) — if it stays visible during a live match it
    covers the gesture controls. `showMenu()` / `showStoryHome()` call
    `showDock()`; `startInnings()` and the online mid-match restore path call
    `hideDock()`. Never show the dock inside gameplay, and never add bottom
    padding to `#app` instead.
6c. **Arena band + hand skeleton invariants (v2.7.2).** `.arena` is
    `flex-end`/`space-between`; hands live in a bottom band capped at
    `max-height:46%` and may never rise above it (they collide with
    `.timer-wrap`/`.countdown` 36% and `.flash` 32%). The hand SVG is
    `viewBox="0 0 200 300"` with **no horizontal stretch** (the old
    `scale(1.32,1)` zoom is gone — do not reintroduce it). Joint groups carry
    `data-j="<tag>f<finger>p<phalanx>"` / `data-j="<tag>t1|t2"` /
    `data-j="<tag>wrist"` (`tag` = `p` player, `o` opponent); the tween writes
    `rotate()` onto those nodes, so never rewrite their transforms from CSS.
    The mirror wrapper (`translate(200 0) scale(-1 1)`) must stay OUTERMOST so
    opponent hands flip correctly. `setHandGesture()` mounts the skeleton on
    first call (`host.__ctl`) — do not `innerHTML`-swap arena hands anymore;
    gesture changes must go through the controller so fingers animate.
    On <=420px-wide screens `.player-card` is hidden (scoreboard carries it).
6d. **Mid-match centre brand card removed (v2.6.2).** `#centerCard` stays in
    the DOM (code keeps writing it) but `display:none` — do not re-show it
    during matches; the top scoreboard, overs `x.y`, target banner and
    status line carry all that info. The home tagline
    "Street Cricket Reimagined" was deleted on request — the brand is just
    "Hand Cricket Pro".
6e. **Glass contrast policy (v2.6.2).** Theme is dark glass, but panels must
    stay readable: neutral surfaces use >= ~.11 white alpha with borders
    >= ~.22 (see the v2.6.2 block at the end of app.css). If a new panel
    looks washed out over the stadium glow, raise its alpha/border there —
    never drop the scrim behind `#menuOverlay`.
6f. **Overlay content must never shrink (v2.6.3).** `.overlay` and the
    role/story/friends/trophy overlays are flex columns; their direct
    children carry `flex-shrink:0` because a shrinking stat card
    (`profile-card`, `overflow:hidden`) used to get squeezed and silently
    clipped at half height with no scrollbar. If content is taller than the
    screen the overlay itself scrolls. Keep result actions inside
    `#resultActions` (sticky glass pill) and close buttons sticky — they
    must stay reachable while stats scroll underneath.

## 6g. v2.7.1 UX/roles/banter invariants

- **Role limits are the game design, not tuning knobs:** `ROLE_LIMITS` in
  `01-config.js` = AGG `[4,5,6]`, DEF `[1,2,3]`, BAL `[1..6]`, for **bat and
  bowl**. The bot obeys them too via `botPickWithRole()` in `09-engine.js`
  (clamps `BotAI.bat()/bowl()` into the bot's allowed set). My own auto-pick
  on timeout uses `pickAllowedGesture()`. Never let any picker bypass these.
- **Squad composition caps (`getRoleLimits` in `15-roles.js`):** batting
  styles are capped BOTH ways — e.g. 5v5 = max 2 AGG / max 2 DEF / 1–3 BAL,
  11v11 = max 4 / max 4 / 3–7 BAL. All-balanced squads are REJECTED (Start
  stays disabled). `validateRoles()` measures `roleAssignPlayers.length`,
  never the possibly-stale `G.teamSize`. Random + auto-pick respect the caps.
- **Sides are LOCKED:** scoreboard LEFT (A) = opponent, RIGHT (B) = you
  (`.you` highlight), matching the arena (opp hand left, your hand right).
  `updScore`/`updAllNames`/`updatePlayerDisplay`/`popScore` all assume this —
  never swap sides by innings again.
- **Live toss everywhere (`startLiveToss` in `07-display.js`):** quick, story
  and rematches all flip the shared `#tossOverlay` coin that BOTH sides
  watch; the winner always picks (bot auto-picks after a beat). The CALLER
  alternates via `hcp_toss_turn` (`tossTakeTurn`/`tossAlignTurn`) — random
  first, then strict alternation, including across rematches. Online: the
  host decides and sends `{type:'toss_caller'}`; the joiner mirrors (with
  pending-message guard for race). Never decide callers per-device.
- **Preset squads are fictional** (`TEAMS` in `01-config.js`) — no real
  cricketer names. Players type their own XI in the team builder
  ("Type my XI" mode → same `{id,name,players}` shape as pool picks).
  Story `playerPool` keeps authored names (narratives reference them).
- **Banter direction rule (`19-chat.js`):** every bot line is ABOUT THE OTHER
  SIDE. When the bot bats it roasts the player's bowling; when it bowls it
  reacts to the player's batting. No self-praise, no self-pity. Pools:
  `onPlayer*` fire for the player's action, `onBot*` for the bot's action,
  and dot/over/free-hit/one-to-win/big-chase have `...Bowling` / `...Batting`
  variants keyed on `G.iBat`. `window.BOT_CHAT_POOLS` + `window.botChatPick`
  exist for the smoke suite; keep them.
- **Close / action bars are `position:sticky` (in-flow):** `#btnCloseProfile`,
  `#btnCloseFriends`, `#resultActions`. Fixed was tried for all three, but
  fixed inside a backdrop-filtered overlay hung taps on iOS Safari AND pinned
  the result bar mid-screen over half the stats. Sticky keeps bars pinned to
  the viewport bottom while content scrolls underneath, with normal
  hit-testing everywhere. Overlays reserve bottom padding so content clears
  the bar.
- **Glass balance:** surfaces/borders/muted text were raised in the v2.7.1
  block at the end of `app.css` (`--card:.13`, `--card-border:.26`,
  `--ink-soft:.82`). If a panel reads washed out, raise it THERE.
- **One-page game:** `html,body,#app` are `100dvh; overflow:hidden`; overlays
  scroll internally only. Short-screen compaction lives in `@media
  (max-height:700px)` / `(max-height:560px)`. Never add page-level scroll.
- **Career stats:** `defaultStats()` gained `outs` and `bestBowlWkts`;
  `loadStats()` derives `economy`, `dotPct`, `boundaryPct`, `batAvg`,
  `oversBowled`, `oversFaced`. `winPct` is a bare number (the card appends
  `%`). Profile renders Overall/Batting/Bowling grids — add new cards there.

## 7. Known limitations (do not "fix" blindly)

- Online P2P needs two live browsers + PeerJS; the smoke suite cannot cover
  it. Host/join, innings-break sync, rematch deserve a manual pass.
- `PeerJS`, GA and fonts load from third-party CDNs (no SRI) — noted as M17.
- Story language preference syncs via `/api/save` (local-first backup now).
- `.kilo/plans/*` holds older UI-reference plans; `Reference_Img/` holds the
  target-app screenshots (https://www.handcricket.in/).

## 8. Versioning

UI version string in `public/index.html` (`.home-version`). **Every local
`<script src="js/…">` and the stylesheet carry `?v=<version>`** — bump ALL of
them together with `.home-version` on any release, or proxies/browsers keep
serving stale modules (this bit us in v2.7.2: unbusted tags + a Last-Modified-only
dev server served old hands from cache). For local previews use
`tools/serve-dev.py <port> <dir>` which sends `Cache-Control: no-store`.
