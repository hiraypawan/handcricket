# Hand Cricket Pro v2 — Stabilization & Growth Plan

## Project Understanding

`D:\AgentsAI\Game` contains **two game versions**:
- `handcricket.html` (root) — v1, simple single-file SVG version
- `public/index.html` (~2,274 lines) — **v2, the active build**. Dark UI, v2.0 label, peer-to-peer + instant matchmaking + cloud story save + 7-tier career mode (37 matches), 1v1/2v2/3v3/5v5/11v11 sizes, role system (Aggressive/Defensive/Balanced with hidden bowling style), player select mid-match, innings break with per-player stats, Hinglish/English, Google Analytics, profile + trophies.

**Infra**: Cloudflare Pages (wrangler.jsonc with `pages_build_output_dir: ./public`) + Pages Functions at `public/functions/api/{save,load}.js` backed by KV namespace `KV` (placeholder id in wrangler.jsonc).

**v2 hand rendering**: HTML markup includes both a CSS finger scaffold and an `<img>`; `setHandGesture()` (line 810) tries `HandGesture/{1..6}.png` first and falls back to an inline SVG. PNG assets are **not present** in the repo, so users always see the SVG. The CSS finger scaffold is currently dead code.

**Data**: `STORY_DATA` is duplicated — `src/story-data.js` and `public/src/story-data.js` are identical. Only the public one is served. `public/src/story-data.js` is loaded via `<script src="src/story-data.js">` in `public/index.html`.

**Bot AI**: heavily extended — Markov-1, Markov-2, freq, sequence, repetition, anti-pattern, context prediction, defensive mode, phase detection. Tracks player patterns per session.

## Goals (in priority order)

1. **Make the v2 build actually shippable and stable** — fix the silent errors that vibe coding accumulated, kill the dead v1 + duplicate story-data, finish the half-built hand PNG/SVG fallback story, complete the matchmaking UI.
2. **Deliver the "real human hand 3D" upgrade** previously discussed (CSS 3D layered hand with optional PNG fallback).
3. **Add quality-of-life features** that match v2's expanded scope: tutorial, profile polish, better mobile UX.
4. **Ship a stable Cloudflare Pages deploy** that the user can point edgeone / custom domain at.

## Out of Scope (explicit)

- Server-side custom signaling (Cloudflare Workers broker) — PeerJS broker continues to be used.
- PWA install / service worker / offline shell — not requested.
- Rewriting in TypeScript, React, Vue, or any framework — keep single-file vanilla.
- Migrating KV/D1 to a different backend.
- 3D model / video hand assets (per earlier decision: CSS 3D is the upgrade path).

## Current Confirmed Issues

| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | Dead code: `handcricket.html` at root never served by Cloudflare Pages | repo root | Confusion, not deployed |
| 2 | Duplicate `STORY_DATA` file | `src/` vs `public/src/` | Build noise, drift risk |
| 3 | `handImgPlayer`/`handImgOpponent` reference `HandGesture/{n}.png` that don't exist | public/index.html L810–827, L386/389 | 6 broken image requests per ball reveal (browser console spam) |
| 4 | CSS finger scaffold (`.css-hand`/`.css-fingers`/`.css-finger`/`.home-hand`) defined but unused by `setHandGesture` | public/index.html L44–52, L154–172, L2226–2248 | Wasted bytes; home-hands cycle via JS construction but in-arena hands never use it |
| 5 | `BOT_EMOJI` array has duplicate entries (`'🗡️'` appears at index 17 and 19) | public/index.html L614 | Cosmetic but reflects careless editing |
| 6 | `BotAI.bat()` references `G.target` directly inside `bowl()` path context | public/index.html L747–754 | `G.target` is `null` during first innings → `needed = null - G.me.score = -G.me.score` → dead branch, not a crash but the `target!==null` guard is missing |
| 7 | `startBotMatch()` calls `showRoleAssign(G.myPlayers,'instant', cb)` but for `teamSize>1` the role-assign screen has no "1v1" path; for 1v1 it shows the countdown without roles | public/index.html L2213–2217 | 1v1 instant path skips roles correctly, but 2v2+ instant goes through the same role flow as offline — fine, but worth confirming |
| 8 | `matchmakingOverlay` spinner: `G.teamSize` set from a selector that may have been removed when overlay reopens | public/index.html L2179–2200 | None observed; flag for QA |
| 9 | `MODE_LABELS` referenced via `ROLE_LABELS` only — no global constant for "1v1 / 2v2 …" format display | n/a | Minor; all sizes hard-coded strings |
| 10 | `wrangler.jsonc` has `KV` placeholder id `YOUR_KV_NAMESPACE_ID` | wrangler.jsonc L7 | Deploy will fail until replaced with real namespace id |
| 11 | `peer-js@1.5.2` from unpkg via `<script src=...>` is loaded with `defer` (good) but no SRI hash | public/index.html L13 | Supply-chain risk; consider SRI |
| 12 | `home-username` appears even if user has no stored name (line 406 guard `display:none` exists, but trophy shelf shown only if `storyProgress.completedTiers.length>0`) | public/index.html L407, L913–927 | Edge case: first-time user on shared device sees no username but might see trophies if any |

The user-reported "6 errors" in the first session most likely correspond to issues 3 + 4 + 5 + 10: the broken PNG requests, the unused CSS being flagged by a linter or Lighthouse, duplicate array entry warning, and KV namespace id failure.

## Architecture (target steady state)

```
D:\AgentsAI\Game\
├── public\                  ← Cloudflare Pages root
│   ├── index.html           ← single-file game (only HTML file)
│   ├── src\story-data.js    ← only copy of story data
│   ├── functions\api\
│   │   ├── save.js          ← POST /api/save
│   │   └── load.js          ← GET /api/load?user=...
│   └── assets\hands\        ← optional PNG gestures (1..6.png) + optional Lottie JSON
├── src\story-data.js        ← DELETED (duplicate)
├── handcricket.html         ← DELETED (legacy v1)
├── wrangler.jsonc           ← KV id populated
├── package.json
└── .kilo\plans\             ← this file
```

## Ordered Implementation Tasks

### Phase 0 — Cleanup (do first, unblocks everything)

1. **Delete `D:\AgentsAI\Game\handcricket.html`** (v1 dead code).
2. **Delete `D:\AgentsAI\Game\src\story-data.js`** (duplicate).
3. **Populate `wrangler.jsonc`** `KV.id` with real Cloudflare namespace id (user must run `wrangler kv:namespace create HC_KV` and paste the id). Or document in README how to do it.
4. **Fix `BOT_EMOJI` duplicate** in public/index.html L614.

### Phase 1 — Hand rendering overhaul (the headline upgrade)

Goal: a real-feeling, perspective-tilted human hand using only CSS, with optional PNG fallback for premium feel.

1. **Decide hand asset strategy** (open question for the user — see Open Questions #1).
2. **Replace `setHandGesture()` in public/index.html L810–829**:
   - Remove the broken `img.src='HandGesture/'+v+'.png'` path until assets exist.
   - Drive both player and opponent hands from the existing CSS finger scaffold (`.css-hand`/`.css-fingers`/`.css-finger`/`.css-palm`) which already has per-finger down/up classes (see L162–169).
   - The mapping in `setGesture` (v1's L256 — verify in v2) is `{1:['index'],2:['index','middle'],3:['index','middle','ring'],4:['index','middle','ring','pinky'],5:['thumb','index','middle','ring','pinky'],6:['thumb']}`.
3. **Author the CSS** in the v2 stylesheet (after L372) to give `.css-hand`:
   - `perspective: 800px` on the wrapper
   - Each `.css-finger` is a 3D-tiltable column with a `.tip` that rotates `rotateX(0deg)` when up, `rotateX(75deg)` when down, with a `cubic-bezier(.5,1.6,.4,1)` transition of ~400ms and **staggered delays** `calc(var(--i) * 45ms)` per finger.
   - Layered gradients for skin tones (already partially present at L163), with darker edge stroke for depth.
   - A subtle radial-gradient ambient light behind the hand, color-shifting slightly with the gesture.
   - `will-change: transform` on each finger.
4. **Verify reveal animation** at L828 (`wrapperEl.classList.add('reveal')`) still composes well with the new CSS — the keyframe `rp` (L54) uses `translateZ`, which interacts with the new `perspective`. Re-test.
5. **Update `buildHomeHand()`** at L2226–2248 to share the same hand geometry (already uses `.css-hand`/`.css-fingers`) so home screen hands look identical to in-game hands.
6. **Optional PNG premium path** (if user wants): add a `public/assets/hands/` folder and let the user drop six PNGs. `setHandGesture` then attempts `img.src` first and only falls back to CSS if the image fails to load. Use `img.decode()` to swap the CSS out only after the image is ready (avoids flicker). This stays opt-in.

### Phase 2 — Bug fixes (silent errors + UX bugs)

1. **Guard `BotAI.bat()`** at L747 against `G.target == null` during first innings.
2. **Confirm the bot auto-restores from `G.restored`** at L2258 — the variable is referenced in the `handleNet('hello')` branch at L414 (v1) / analogous in v2; verify both branches set `G.restored = true` consistently.
3. **Add `SRI` hash** to the PeerJS `<script>` tag at L13. Fetch the unpkg SRI generator output once and pin the hash.
4. **Add `aria-label` to gesture buttons** for accessibility.
5. **Cache-bust story-data.js** by appending `?v=2` to the `<script src>` and updating on every release.

### Phase 3 — Matchmaking / online completion

1. **Verify matchmaking flow** end-to-end with two devices on the same WiFi: room create → search 8s → falls back to bot (intentional). Add a "find another player" button if user rejects bot fallback.
2. **Add a "Cancel & play vs bot" button** inside the `matchmakingOverlay` countdown so users don't have to wait 8s.
3. **Display opponent profile preview** in `matchmakingOverlay` when a real player is found (reuse `opp-profile-card` markup from L209).

### Phase 4 — Tutorial & onboarding (cold-start win)

1. **Add a one-time onboarding overlay** triggered from a `localStorage.hc_visited` flag:
   - 3 slides: "Tap a number", "Same number = OUT", "Different = runs".
   - Skip button + "Don't show again" checkbox.
2. **Add a `?` help button** in the bottom-right of `menuOverlay` that re-opens the tutorial.

### Phase 5 — Cloudflare Pages deploy (final mile)

1. **Create KV namespace**: `npx wrangler kv:namespace create HC_KV` → paste id into `wrangler.jsonc`.
2. **Verify wrangler config**: `pages_build_output_dir: "./public"`, `compatibility_date: "2025-09-01"`.
3. **Add a `functions/api/_middleware.js`** that sets `Cache-Control: no-store` on `/api/*` so stale story saves don't get served.
4. **Document deployment in `README.md`** (already in scope for project — out of plan to create if not asked; just update wrangler.jsonc comments).
5. **Test deploy**: `npx wrangler pages deploy ./public` (Cloudflare Pages direct) or use the existing Pages CI binding.
6. **Smoke test on a real mobile device** (iOS Safari + Android Chrome) — the iOS `100dvh` and safe-area handling need verification.

### Phase 6 — Analytics & privacy (lightweight)

1. **Confirm gtag ID** (already at L11: `G-M484S7S0KG`) belongs to this project. If it's a personal ID, the user should replace it with a fresh GA4 property.
2. **Add a `?utm_source=` param capture** so the user can track edgeone.dev vs cloudflare.dev traffic.

## Key Files & Functions Touched

| File | Lines (approx) | Change |
|---|---|---|
| `public/index.html` | 386, 389, 810–829, 614, 44–52, 154–172, 2226–2248 | Hand overhaul + bot fix + duplicate emoji |
| `public/index.html` | 11–13 | SRI on PeerJS |
| `public/index.html` | L406–407, L913 | Cold-start UX polish |
| `public/functions/api/_middleware.js` | new | Cache headers |
| `wrangler.jsonc` | L7 | Real KV id |
| `README.md` (optional) | new | Deploy steps |

## Open Questions (need user input before/while implementing)

1. **Hand asset strategy**: pure CSS 3D layered hand, or pure CSS + optional PNG fallback (user supplies 6 PNGs from Midjourney/Sora/3D render)? Recommendation: pure CSS 3D for v2.1, add PNG fallback in v2.2 once the user has assets ready.
2. **Should the 11v11 team size be kept?** 120 balls × 10 wickets is a 25-minute match. Casual users may bounce. Recommendation: cap at 5v5 in the public menu, keep 11v11 behind Story mode only.
3. **Hinglish story content**: present, but only 4 tiers in the snippet I read (gully/area/village/city). Should we add `District → State → National` to reach the 8 tiers the trophy shelf implies (L917)? Out of scope for this plan unless requested.
4. **Is the EdgeOne.dev deployment still live?** If yes, do we need a redirect, or do we publish a new Cloudflare URL and let DNS / link rot handle the rest? User decision.
5. **Should story save include opponent-side too (full match replay)?** Out of scope for this plan; would need a server schema change.

## Validation Plan

1. **Static check**: `node --check` on the extracted `<script>` block of `public/index.html` after every edit.
2. **JSDOM smoke test**: load the page, click `modeStory` → enter a tier → play a 2-ball sample match → assert `storyProgress.currentMatch` increments.
3. **Manual device test matrix** (2 Android devices, 1 iOS device): offline 1v1, story 2v2, online 5v5.
4. **Lighthouse audit** on the deployed Cloudflare URL: target Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 80.
5. **Bundle size budget**: `public/index.html` ≤ 110 KB, `public/src/story-data.js` ≤ 60 KB. The hand overhaul must not push the index over 120 KB (we'll inline only critical CSS, the rest in `<style>` stays where it is).
6. **Cloudflare Pages preview deploy** before prod: `wrangler pages dev ./public` and click through every overlay.

## Rollout / Migration

1. Phase 0–1 ship to a preview branch: `wrangler pages dev ./public` (localhost) for manual QA.
2. Phase 2–3 ship to a `preview` Pages environment.
3. Phase 4–6 ship to production after a 48-hour soak on preview.
4. Old edgeone.dev URL: leave up; add a banner overlay in v1 redirecting to the new URL (v1 is gone, so just a static HTML stub at the old URL).

## Risks

- **CSS 3D hand looks "flat" on weak Android GPUs.** Mitigation: keep the SVG fallback as a `prefers-reduced-motion` / `no-3d` alternative. Detect via `@supports (transform: rotateY(1deg))`.
- **`G.restored` typo on the v2 line that mirrors v1's L565.** If missed, refresh-rejoin will silently break. Mitigation: explicit unit-style check (a `console.assert` in dev) confirming the state machine transitions.
- **Cloudflare Pages Functions cold start on first save/load.** First request may be slow. Mitigation: keep function small; no extra deps.
- **PeerJS broker outage.** Outside our control; keep retry/backoff already present in `setupConn`.

## Definition of Done

- [ ] v1 root file + duplicate story-data deleted.
- [ ] KV namespace id populated; `wrangler pages dev ./public` boots without errors.
- [ ] In-arena hand and home-screen hand both driven by `.css-hand` scaffold; 3D look verified on iOS Safari + Android Chrome.
- [ ] Console: zero 404s on reveal; zero ReferenceErrors; zero deprecation warnings.
- [ ] Story mode: complete Gully tier (3 matches) on a fresh user, verify cloud save round-trip.
- [ ] Lighthouse mobile Performance ≥ 90.
- [ ] Public Cloudflare Pages URL reachable; opponent match between two phones on cellular succeeds.
