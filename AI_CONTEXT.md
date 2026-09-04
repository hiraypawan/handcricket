# AI_CONTEXT.md — Hand Cricket Pro v2.2

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
│   ├── css/app.css          All styles (extracted from the old monolith)
│   ├── js/                  Game logic — see the numbered load order below
│   └── functions/           Cloudflare Pages Functions (KV-backed REST)
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
| 5 | `04-hands.js` | `HandRenderer` / `getHandSVG` / arena hands |
| 6 | `05-navigation.js` | Home/menu show-hide, bottom `TabBar` |
| 7 | `06-sfx.js` | `ensureAudio`, `sfx()`, haptics |
| 8 | `07-display.js` | Scoreboard/HUD, flash, confetti, countdowns, leave dialog |
| 9 | `08-network.js` | `sendMsg`, `destroyPeer`, connection log |
| 10 | `09-engine.js` | **Match engine**: innings, ball resolution, scoring, roles rotation, per-player stats, result |
| 11 | `10-profiles.js` | Username, career stats (`hc_stats`), profile-card UI |
| 12 | `11-modes.js` | Home mode buttons (Offline/Online/Quick/Story entry), career strip |
| 13 | `12-tutorial.js` | Tutorial slides + team-size pickers (single active format) |
| 14 | `13-offline.js` | Offline vs bot: rosters, toss, role screen, `startOffline()` |
| 15 | `14-online.js` | PeerJS P2P: host/join, protocol `handleNet`, team builder, toss |
| 16 | `15-roles.js` | Role styles (AGG/DEF/BAL), gesture restrictions, role overlay |
| 17 | `16-story.js` | Story career: tiers, dialogue, team builder, cloud save, **story→engine hooks** |
| 18 | `17-selection.js` | Batter/bowler rotation pickers + innings-break scorecard |
| 19 | `18-instant.js` | **Quick Match** (honest instant bot game) + boot-time init (loads last) |
| 20 | `19-chat.js` | Emoji quick-chat + bot banter |
| 21 | `20-friends.js` | Friend lists/sync, friend requests, challenge invite |

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

## 7. Known limitations (do not "fix" blindly)

- Online P2P needs two live browsers + PeerJS; the smoke suite cannot cover
  it. Host/join, innings-break sync, rematch deserve a manual pass.
- `PeerJS`, GA and fonts load from third-party CDNs (no SRI) — noted as M17.
- Story language preference syncs via `/api/save` (local-first backup now).
- `.kilo/plans/*` holds older UI-reference plans; `Reference_Img/` holds the
  target-app screenshots (https://www.handcricket.in/).

## 8. Versioning

UI version string in `public/index.html` (`.home-version`); bump cache-buster
query strings (`js/story-data.js?v=…`) whenever that data file changes.
