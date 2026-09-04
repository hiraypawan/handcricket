# Hand Cricket Pro — Full Directory Analysis

*Generated: 2026-09-04 · Scope: entire `handcricket` repository at commit `2b04b9e` · All file/line references verified against current code*

---

## 1. TL;DR

| Area | Verdict |
|---|---|
| **What it is** | A single-page, mobile-first "hand cricket" (pick-a-number 1–6 vs. pick-a-number) game, version **v2.1**, with bot AI, P2P online play, fake matchmaking, and a bilingual story career mode |
| **Code health** | All 3 inline JS blocks and `story-data.js` parse cleanly; no duplicate DOM IDs; game logic is complete and coherent |
| **Biggest bug** | `public/functions/api/save.js` & `load.js` contain **invalid ESM syntax** (`export onRequestPost = …` — missing `const`) → **cloud save/load endpoints are broken** |
| **Biggest design lie** | "Instant Match" does an 8-second fake "searching…" spinner and then **always plays a bot** — there is no real matchmaking |
| **Stubs / dead code** | Challenge system is an empty skeleton (`/api/challenges.js` never called, handler no-ops), Lounge & Tournaments tabs are `alert()` placeholders, the home "daily strip" is static decoration |
| **Repo history** | A single squashed commit; `main` and the working branch are identical; CI auto-deploys to Cloudflare Pages (`handscricket.pages.dev`) |
| **Backend** | Cloudflare Pages Functions + Workers KV, fully open CORS and **no authentication** on any endpoint |

---

## 2. Repository inventory

```
handcricket/
├── .github/workflows/deploy.yml      CI: push to main → wrangler pages deploy (project "handscricket")
├── .kilo/plans/                      3 planning docs (v2 stabilization, home bug-fixes, UI polish)
├── Reference_Img/                    5 screenshots (982 KB + 4 smaller) of handcricket.in — UI polish reference
├── HAND_CRICKET_AUDIT.md             existing 258-line audit (features + past bug fixes) — partially outdated
├── README.md                         short overview; claims index.html ≈ 95 KB (actually ~239 KB)
├── package.json                      devDep: wrangler; scripts: dev / deploy (project name "handscricket")
├── package-lock.json                 wrangler lockfile (node_modules NOT installed)
├── wrangler.jsonc                    Pages output dir ./public; KV namespace "KV" bound (real IDs present)
└── public/
    ├── index.html                    3,181 lines / 239 KB — HTML + ALL CSS + ALL game JS inline (no build step)
    ├── src/story-data.js             1,930 lines / 124 KB — story mode data (81 players, 37 matches)
    └── functions/api/                Cloudflare Pages Functions (serverless)
        ├── _middleware.js            adds Cache-Control: no-store
        ├── save.js                   ❌ invalid syntax → cloud story-save endpoint broken
        ├── load.js                   ❌ invalid syntax → cloud story-load endpoint broken
        ├── profile.js                ✅ parses — but never called by the page (dead)
        ├── friends.js                ✅ parses — used by in-game friend system
        └── challenges.js             ✅ parses — never called by the page (dead)
```

**File sizes:** `index.html` 238,769 B · `story-data.js` 123,943 B · API handlers 1.4–5.5 KB each.

---

## 3. What the game is (verified game design)

Core loop (cricket rules abstracted): both sides secretly pick a number **1–6** each ball.
Same number = **batter out**; different = batter scores the picked number. 5-second
shot clock per ball; no-ball → **free hit** (batter cannot be out); innings length and
wickets scale with team size (`index.html:1553-1554`, `1797`, `2798-2799`):

| Team size | Balls (overs) | Wickets |
|---|---|---|
| 1v1 | 6 (1 over) | 1 |
| 2v2 / 3v3 / 5v5 | 12 / 18 / 30 (teamSize × 6) | teamSize |
| 11v11 | 120 (20 overs) | 10 |

Chase: 2nd innings wins at `target + 1`. Per-ball reveal, flash messages (SIX!/FOUR!/OUT!),
5 s circular timer (`TIMER=5`, `index.html:1194`), 12 s watchdog that auto-advances stuck balls.

### Game modes (all start from the home menu `index.html:796-800`)

1. **Offline (🤖 vs Ultra-Smart Bot)** — team-size pick → coin toss → role assignment → match.
   Bot gets a random gamer-style name/emoji/profile (`genBotName`/`genBotProfile`, lines ~1040-1041).
2. **Play with Friend (🌐 Online)** — real **PeerJS 1.5.2** P2P: host creates a room, joiner connects
   via 6-char code/link; host picks format; toss; 5 s gesture windows; network events
   (`hello/sync/team/toss_start/choice/innings_sync/rematch…`); session snapshots in
   `sessionStorage` for auto-rejoin (`makeSnap`/`restore`, `index.html:1204-1206`); retry loop
   every 3 s up to 30 tries. **This is the only real multiplayer path.**
3. **Instant Match (⚡ "Find opponent now")** — ⚠️ **fake**: 8-second search animation, then
   "Found opponent!" → `startBotMatch()` (`index.html:2771-2792`). Always a bot. No matchmaking
   queue or signaling exists anywhere in the codebase.
4. **Story / Team tab** — 8-tier career ladder, **37 matches**, bilingual (English/Hinglish)
   dialogue, difficulty 0.2 → ~0.9, trophies & certificates, team of real IPL names (CSK, MI,
   RCB, KKR, DC, RR, SRH, PBKS rosters at `index.html:1018`) or built from an 81-player pool
   (`story-data.js:2-84`) or custom team builder.

### Rule/role system (`ROLE_LIMITS`, `index.html:1021`)
- **Aggressive batter**: may only pick 3,4,5,6 · **Defensive batter**: only 1,2,3,4 · **Balanced**: 1–6
- Same constraints mirrored for bowling style; per-player *batting* style is visible in team modes
  but *bowling* style is a hidden reveal
- Squad composition quotas per team size (e.g., 11v11 ≤4 aggressive, ≤4 defensive, ≥3 balanced)

### Bot AI (`BotAI`, `index.html:1027-1193`) — genuinely non-trivial
Weighted ensemble of predictors, difficulty-tunable (0–1): 2nd-order Markov transitions,
recent-frequency with recency weighting, consecutive-sequence detection (3-4-5, 6-5-4),
repetition detector, anti-pattern avoidance, context prediction (chase/defend mode, required
run rate, survival picks when batting deep), plus weighted random fallback favoring high
numbers when defending a total. Quality is decent for a single-file game.

### Screens / UI inventory (~200 DOM ids, verified no duplicates)
- Screens: menu home → offline setup (size + toss + role) → arena (scoreboards, center card,
  gesture grid, ball-dot row, target/free-hit banners) → innings break → result/roast → rematch
- Overlays: username, tutorial (slides, "don't show again"), online lobby, waiting, team select,
  team builder, role assign, player select (after wicket/over), leave-game confirm, profile,
  friends, trophies, story (home/tier list/dialogue/toss/certificate)
- Bottom tab bar (Home/Battle/Arena/Team/Lounge/Tournaments) with inline SVG icons
- Effects: WebAudio beeps + WebHaptics vibrate + CSS confetti + animated coin + CSS 3D hands

### Tech stack facts
- **Zero build step**; one HTML file, inline CSS + 3 inline `<script>` blocks + `story-data.js`
- 160 functions in `index.html` (minified one-liners style — readable but dense)
- Google Fonts (Luckiest Guy + Rubik), GA4 `G-M484S7S0KG`, PeerJS from unpkg (no SRI), no PWA
  manifest/service worker; `theme-color #e8a020`, warm home palette but **dark modals** (two
  competing CSS `:root` palettes — a known visual inconsistency documented in `.kilo/plans`)
- Storage keys: `hcp_username`, `hc_stats`, `hcp_story`, `hc_custom_teams`, `hc_tut_dismissed`,
  `hcp_friends` (localStorage); `hc_sess`, `hc_snap_<room>` (sessionStorage)

### Backend (Cloudflare Pages Functions + KV)
- KV namespace bound as `KV` in `wrangler.jsonc` (prod `7872bcfe…` + preview id)
- `_middleware.js` sets `Cache-Control: no-store` on all `/api/*`
- Endpoints: `GET/POST /api/save`, `/api/load` (story), `/api/profile`, `/api/friends` (add/accept/sync), `/api/challenges`
- Deploy CI: `.github/workflows/deploy.yml` on push to `main`; project name `handscricket` (extra "s") in both the workflow and `package.json`

---

## 4. Findings — severity-ordered

### 🔴 Critical

**C1 — Cloud save/load endpoints are syntactically invalid (broken)**
`public/functions/api/save.js:1` → `export onRequestPost = async (ctx) => {`
`public/functions/api/load.js:1` → `export onRequestGet = async (ctx) => {`

`export <identifier> = …` is not valid ESM (needs `export const`). Verified: dynamic-import
parse fails with `SyntaxError: Unexpected token 'export'`. Every other handler uses the correct
`export const onRequest*` form. The page calls exactly these two endpoints for cloud saves
(`index.html:2500` and `2506`), so:
- cloud story save/load silently fails (the `try/catch` swallows it), and
- `wrangler pages deploy` will fail to bundle the Functions directory, taking **all** `/api/*`
  down with it (friends sync breaks too).
**Fix (1 char each):** `export const onRequestPost = …` / `export const onRequestGet = …`

### 🟠 High

**H1 — "Instant Match" is theater; there is no real matchmaking.** `startMatchmaking()`
(`index.html:2771`) spins a fake 8 s "Searching for a real player…" timer, prints "Found
opponent!", and launches a bot. `modeInstant` even forces `G.mode='offline'` first
(`index.html:1505`). If real quick-play was intended, this needs a queue/signaling backend;
otherwise the button/copy should honestly say "Quick match vs bot".

**H2 — Challenge system is an empty skeleton.**
- `window.challengeFriend(name)` (`index.html:3066-3072`) only closes the overlay and sets
  `G.oppName` — it never opens a match, sends a challenge, or calls `/api/challenges`.
- Accept/notification hooks are no-ops: `window.checkBotChallenges=function(){}` (`:3138`) and
  `window.maybeBotChallenge=function(){}` (`:3177`), called defensively at `:1913`.
- `/api/challenges.js` and `/api/profile.js` are **never fetched** by the page (only
  `/api/save`, `/api/load`, `/api/friends` appear in fetch calls) — dead server code.
Either finish the flow (accept → auto-start bot/peer match with recorded result) or remove the UI.

**H3 — No authentication on any API.** Any user can POST to `/api/save`, `/api/profile`, or
`/api/friends` with `user: "anyone"` and overwrite that person's story progress, stats, or
friend list. Casual game, so severity is moderate — but a simple per-user write token or
signed-username check would fix it.

### 🟡 Medium

**M1 — Lounge & Tournaments tabs are placeholder alerts** (`index.html:1334-1339`): the tab bar
promises 5 destinations; 2 are `alert()` stubs. Home "daily strip" (`index.html:787-793`) shows
RANK — / CHANCES 0/3 / POINTS 0 and **nothing in JS ever updates it** — pure decoration.

**M2 — Visual identity split.** Two competing `:root` palettes: warm cream/orange for
home/arena (`#f0b840` era) vs dark slate/amber for every modal/overlay. Both remain in the same
file; overlays consistently feel like a different app (documented in
`.kilo/plans/ui-polish-to-match-handcricket-in.md`).

**M3 — README/version drift:** README says ~95 KB and "no functions for friends/challenges",
story cache-buster is `?v=2` with no visible bump procedure, home footer says `v2.1`
(`index.html:803`) while `package.json` says `2.0.0`. The audit doc also repeats "KV id is
placeholder" though real IDs are now in `wrangler.jsonc`.

### 🟢 Low / hygiene
- **No node_modules / .wrangler in repo** — clean; `npm i` then `npm run dev` (wrangler) needed.
- External CDNs without SRI (PeerJS from unpkg, GA, fonts) — fine for casual play.
- `history`/`git log`: **one squashed commit only** — no provenance of the "8 bug fixes" in the
  audit; local branch `arena/01a06b9a-handcricket` == `main` == `origin/main` content-wise.
- Roster naming nits: RR lists both "Boult" and "Bolt" as separate bowlers (`index.html:1018`);
  PBKS "Bolt" is likely also a leftover. Cosmetic.
- `Reference_Img/` (3 MB of PNGs) and `.kilo/plans/` are committed working artifacts — fine, but
  candidates for `.gitignore` if the repo goes public.
- GA is loaded on every page view of an offline-capable game — expected, but noteworthy if
  privacy matters to players.

---

## 5. Verified-good list (so you know what NOT to touch)

- All 3 inline scripts + `story-data.js` pass `node --check`; no duplicate element IDs
- Core ball engine (`nextBall`/reveal/processing/free-hit/innings math) is coherent across modes
- `BotAI` implements real prediction (not random), difficulty-aware, defensive-mode aware
- Offline flow, role validation (`validateRoles`, gesture disable/enable), player-select
  rotation, innings break stats, result/roast/rematch: all wired end-to-end with matching DOM
- Friends system (add/accept/sync + bot friends) is implemented client **and** server-side and used
- Rejoin resilience for online rooms (snapshots + polling + retry UI) is genuinely thoughtful
- Accessibility touches: touch targets, `pointer-events:auto` fix from last commit, haptics

---

## 6. Recommended priority order

1. **Fix C1** (two `const`s) — then `npm run deploy` actually works and cloud story save lives.
2. Decide the fate of Instant Match: ship real queueing (big) **or** rebrand UI copy to
   "Quick Match vs Bot" (small).
3. Finish or delete the challenge skeleton (H2) and remove/adjust stubs + dead endpoints.
4. Add per-user write tokens to `/api/*` (H3) if cloud saves matter.
5. Unify the two CSS palettes (M2) — biggest visible quality win per effort.
6. Sync README / audit / version numbers (M3), prune `Reference_Img` from Git if unneeded.
