# Plan: UI/Visual Polish to Match `handcricket.in` (reference_img)

## Context

The reference (`https://www.handcricket.in/`) is a finished, mobile-first React SPA. Our project (`D:\AgentsAI\Game`, v2) is the same gameplay wrapped in a **hybrid** theme because the CSS contains **two competing `:root` token blocks**:

- **Line 18** (the warm palette): `--bg:#f0b840`, `--bg2:#e8a020`, `--card:#fffaf0`, `--ink:#264653`, `--ink2:#7a3800`, `--coral:#e76f51`, `--orange:#f4a361`. Used by `#app`, `.scoreboard`, `.home-title`, `.arena-stadium`, etc.
- **Line 346** (the dark palette, **wins** because it appears later): `--accent:#f59e0b`, `--accent2:#d97706`, `--green:#34d399`, `--red:#ef4444`, `--blue:#60a5fa`, `--text:#f1f5f9`. Used by `.role-assign`, `.story-home`, `.trophy-cert`, `.inn-break-side`, `.ftab`, `.flash`, `.add-friend-btn`, **all overlay buttons** (`.overlay button`), `.profile-card h3`, etc.

Net result: home/arena is warm orange, but every modal/popup/result screen is dark slate with amber accents. The reference is uniformly warm + illustrated. This is the core visual gap.

This plan is **UI/visual only** — no backend changes other than extending `save.js`/`load.js` to round-trip a `coins` field, no game logic changes, no AI retuning.

The reference's design system (extracted from `https://www.handcricket.in/` HTML):
- **Colors**: `#264653` charcoalblue (ink), `#e76f51` gold, `#f4a361` orange, `#e9c46a` warm yellow, `#2a9d8f` tealgreen, `#fffaf0` cream
- **Fonts**: `Luckiest Guy` (display, all caps titles with text-stroke) + `Rubik`/`Baloo 2` (body) — already in our `<head>`
- **Iconography**: cartoon hand illustrations (large, teal/orange skin, thick white outline, knuckle creases), stadium floodlight props, illustrated ball+bats score cards, "HAND CRICKET.IO" branded center card
- **Layout**: 5-tab bottom bar (Lounge / Open Arena / Battle / Team / Tournaments), with active tab indicator
- **Profile**: avatar+pencil+globe edit row, Rookie rank card, tabbed OVERALL/BATTING/BOWLING, illustrated stat cards with icon (bat, W%, trophy, gauge)
- **Coin economy**: 🪙 balance top-right with `+` button, daily challenge strip (rank/chances/points)

## What we already have (do NOT rebuild)

- `.arena-stadium` SVG container + cloud layer + light props
- 1-6 colored gesture buttons (`#4caf50` / `#2196f3` / `#ffc107`)
- `Luckiest Guy` + `Rubik` font preloads (in `<head>`)
- `.home-hands` cycle animation
- Story mode, profile, stats, role system, all backend functions
- `.help-btn`, `.tutorial`, `.mode-grid`, friends system, `BotAI`, `STORY_DATA`
- Two existing `:root` blocks (will be merged, not duplicated)
- The result overlay already has Rematch / New Match / Main Menu buttons

## Visual gaps to close (in priority order)

### A. Merge the two `:root` blocks (the root cause)

The simplest single change that will re-tint the entire app:
- Delete the second `:root` block (line 346). Keep the warm one.
- Add `--accent: var(--orange)` alias so every existing `var(--accent)` reference resolves to the warm orange.
- Add `--text: var(--ink)` so any `var(--text)` keeps dark navy text (instead of light slate) in dark context.
- Replace the `--green` in the second block with the warm tealgreen `#2a9d8f`.
- Replace `--red` with `#e63946` (warm red).

Result: `.role-assign`, `.story-home`, `.trophy-cert`, `.inn-break-side`, `.flash`, `.ftab`, all `.overlay button` styles automatically pick up the warm palette. Single CSS change, biggest visual impact.

### B. Hand visuals (the headline problem)

The current `.arena-hand` is a small flat CSS layered hand. The reference uses large illustrated cartoon hands with thick white outline, knuckle creases, teal/orange skin. Build a `HandRenderer` library in pure JS that emits inline SVG. (User choice: build from scratch, no asset deps.)

`HandRenderer.draw(v, side)` returns an SVG `<svg viewBox="0 0 200 200">` string with:
- 200×200 viewBox, palm at (100, 130), wrist cuff at (100, 175)
- Each finger is two rounded phalanges; thumb is one phalange, rotated 30° outward from palm
- All shapes have `stroke="#fffaf0" stroke-width="6" stroke-linejoin="round"`, fill is the side-specific skin color
- Knuckle creases: 3 short curved paths on the palm
- Wrist cuff: a small rounded rect with `#7a3800` fill
- Side `'L'` (left side of arena, opponent's hand): skin color tealgreen `#3b8070`, drawn mirrored
- Side `'R'` (right side, your hand): skin color orange `#c87850`, normal orientation
- v=6: closed fist with only the thumb up
- v=1..5: index→all-fingers as per the existing `ARENA_FINGERS` map

Animations (CSS keyframes, defined in the same `<style>` block):
- `@keyframes handSlideIn`: starts at `translateX(±100%) scale(.7) opacity:0`, ends at `translateX(0) scale(1) opacity:1`, 600ms, `cubic-bezier(.34,1.56,.64,1)` (bouncy settle)
- `@keyframes handIdle`: gentle vertical bob, `translateY(0) → translateY(-6px) → translateY(0)`, 3s ease-in-out infinite
- Each new gesture triggers a quick reset → slide-in (so finger-changes feel snappy, not continuous idle)

Replace the current `setHandGesture()` to:
1. Build the new SVG via `HandRenderer.draw(v, side)` where side comes from which wrapper we're rendering (player = 'R', opponent = 'L')
2. Inject via `innerHTML`, then toggle `.idle` and `.sliding` classes to trigger the animation
3. Keep the old PNG `<img>` element but mark it `display:none` permanently (so the same DOM structure is preserved for any existing event listeners)

### C. Center "HAND CRICKET.IO" branding card

Add `<div class="center-card">` inside `.arena` (between the two player sides), positioned absolute, centered. Three stacked regions:
- **Brand strip**: small "HAND CRICKET.IO" wordmark in `Luckiest Guy`, color `var(--coral)`, ~12px font
- **Stats strip**: 3 columns "OVER 0.0 | CRR 0.0 | RRR 0.0" in dark navy 11px font, `var(--ink)` text on `var(--card)` background
- **Target strip**: 2 columns "RUNS TO DEFEND 4" | "BALLS REMAINING 6" with 18px bold numerals, `var(--coral)` color

Add `updCenterCard()` function called from `updScore()`:
- OVER = `oversStr(G.me.balls).split(' ')[0]` (e.g. "0.3")
- CRR = `G.me.balls ? ((G.me.score / G.me.balls) * 6).toFixed(1) : '0.0'`
- RRR = only meaningful in 2nd innings: `G.target !== null && (G.totalBalls - G.me.balls) > 0 ? ((G.target + 1 - G.me.score) / ((G.totalBalls - G.me.balls) / 6)).toFixed(1) : '0.0'`
- RUNS TO DEFEND = `G.target !== null ? G.target + 1 - G.me.score : '—'`
- BALLS REMAINING = `G.totalBalls - G.me.balls`

The card is `display:none` until `updCenterCard()` is first called after a match starts (it'll be visible from the first ball).

### D. Player score cards (left + right)

Replace the current `.scoreboard` layout with two `.player-card` blocks flanking the center card:
- **Position**: absolute, top of arena, full width
- **Left card** (opponent): green tint background, "CERTIFIED" small badge + ⚽ ball icon
- **Right card** (you): orange tint background, 🏏 bat icon
- Each card: top-row icon+username (e.g. "G510526"), big number `<score>/<wkts>` (24px Luckiest Guy), green online dot
- Wire `updScore()` to update these new card text nodes
- Both cards float above the stadium SVG (z-index:1)

### E. Bottom tab bar (5 tabs: 3 real + 2 placeholders)

User chose: 3 real tabs + 2 "coming soon" placeholders.

Add `<div id="bottomTabBar">` fixed to the bottom of the screen, with safe-area padding. 5 tabs:

| Tab | Routes to | Real? |
|---|---|---|
| 🛋️ Lounge | `coming-soon-overlay` | placeholder |
| 🏟️ Open Arena | `matchmakingOverlay` (current instant match) | real |
| ⚔️ Battle | `menuOverlay` (default) | real |
| 🏏 Team | `storyHome` (current story mode) | real |
| 🏆 Tournaments | `coming-soon-overlay` | placeholder |

Each tab is a `<button class="tab-button">` with:
- 28×28 inline SVG icon (line drawings inspired by reference: lounge=couch, arena=stadium, battle=fist-bump, team=people, trophy=cup)
- Label below
- Active state: bottom border `3px solid var(--coral)`, font-weight 800, color `var(--coral)`
- Inactive: color `var(--ink2)`, no border

Click handlers:
- Lounge → open new `#placeholderOverlay` with title "Lounge", body "Global chat coming soon", Close button
- Open Arena → hide menu, show `matchmakingOverlay`, call `startMatchmaking()`
- Battle → hide all overlays, show `menuOverlay`
- Team → hide all overlays, show `storyHome`, call `renderStoryHome()`
- Tournaments → open `#placeholderOverlay` with title "Tournaments", body "Country Cup coming soon", Close button

Active tab state persists in `localStorage.hc_active_tab` (default `'battle'`).

### F. Coin balance (top-right, syncs to Cloudflare KV)

User chose: extend the existing story save. The coin value rides along with `storyProgress` JSON.

Add `<div class="coin-balance">` to the home overlay top-right:
- Layout: 🪙 emoji + value (`var(--coin-font, 'Luckiest Guy')` 18px, color `var(--gold)`) + `+` button (cream background, dark navy text)
- Click `+`: toast "Watch an ad to earn 100 coins — coming soon"
- Render from `getCoins()` → reads from `storyProgress.coins` (default 2000 if absent)

Wire `addCoins(delta)` to be called:
- +50 on match win in `updateStatsAfterMatch` after `saveStats(s)` succeeds
- -10 on match loss in the same function
- +5 per six in `updateStatsAfterMatch`
- After every change, call `cloudSaveStory()` so the coin delta persists to KV

Extend the existing `save.js`/`load.js` backend: no API change needed because `save.js` already serializes the entire `data` object as JSON. The frontend just needs to include `coins: G.coins` in the save payload when `cloudSaveStory` builds its request. (Confirmed by re-reading `save.js` line 27-28: `value = JSON.stringify(data)` — pure pass-through, no schema.)

### G. Daily Challenge strip (mock display)

User chose: mock. Add `<div class="daily-strip">` below the profile button on home:
- Layout: 3 mini stat boxes in a row
  - "🏅 RANK —" (always `—` for now)
  - "🎯 CHANCES 0/3" (always `0/3`)
  - "💎 POINTS 0" (always `0`)
- Each box: cream background, 2px charcoal border, icon + text inline
- Below the strip: a thin caption "First 3 matches played in Local Club" in 9px

### H. Profile card restyle

Keep `#profileCard` data, restructure the HTML template to:
- **Header strip** (full width, `var(--ink)` bg, cream text, 14px tall, padding 8px): "MY PROFILE" left, red `✕` close right
- **Top row** (dark navy card): avatar circle (left) + username with ✏️ edit pencil (middle) + 🌍 globe with ✏️ edit (right) — keep current edit flows
- **Rookie rank card** (warm orange card, 80px tall): 🌟 wood-textured star icon (left) + "Rookie" title (16px Luckiest Guy, `var(--ink)`) + star count badge `0 ★` (right)
- **Tab strip** (3 tabs): OVERALL | BATTING | BOWLING. Active tab is white background, others grey. Click handler swaps the inner stat-card grid content
- **4 stat cards** in 2×2 grid (under tabs):
  - 🏏 Matches Played (with the bat icon)
  - "W%" Win PCT (with W% icon)
  - 🏆 Matches Won (with trophy icon)
  - 📊 High Score (with gauge icon)
- **Google Sign-in button** at bottom (placeholder): white background, multi-color "G" logo, "Sign in" text, `onclick="alert('Google sign-in coming soon')"`

### I. "Collecting coins" pre-match overlay

Add `<div id="collectOverlay" class="overlay hidden">` with:
- Two avatar cards (left/right) with player code, name, 🪙 balance
- Center: large spinning coin with 3D flip animation, amount in the middle
- Caption below: "COLLECTING COINS" in `Luckiest Guy`
- 1.5s duration, then auto-proceed to first ball

Trigger from `startInnings(n)` between the role-assign callback and the actual match start. For 1v1 quick match, show a slimmer version (just the coin, no avatars).

### J. Match options row above tab bar

Add `<div class="match-options">` to home, with 3 illustrated cards:
- 🏟️ "Local Club" (entry: 1000 🪙) — current offline mode
- ⚔️ "BATTLE" (highlighted) — current instant match
- 🥊 "1v1 Fist" (free) — current offline 1v1

Each card is a rounded rectangle (96px tall) with the icon, label, and a small "Entry: X 🪙" footer. Clicking routes to the corresponding mode.

### K. Color tokens unification + final polish

The big `:root` merge (item A) is the foundation. After all 10 items are in:
- Audit for any orphan hardcoded color literals (grep for `#0f172a`, `#f59e0b`, `#7a3800`, `#1a1a1a`) in non-overlay contexts
- Replace with `var(--*)` references
- Add `-webkit-text-stroke: 1.5px var(--ink)` filter to large titles (mimics reference's outlined text look)
- Add a subtle stadium-fog gradient at the bottom of the arena for depth
- Increase `font-family: "Luckiest Guy"` weight on overlay titles to match the reference

## Implementation phases

### Phase 0 — Pre-flight
- Re-read the current `:root` blocks and the existing `setHandGesture` / `updScore` / `startInnings` / `updateStatsAfterMatch` to confirm line numbers
- Run the existing JSDOM smoke test to capture a baseline (zero errors expected)

### Phase 1 — Token unification (the one-line change)
- Delete the second `:root` block
- Add an alias `--accent: var(--orange)` so legacy `var(--accent)` references stay warm
- Run smoke test, expect zero visual regressions on home/arena
- Confirm story/role/result screens now use warm tones

### Phase 2 — HandRenderer library + arena hand overhaul
- Write `HandRenderer.draw(v, side)` returning SVG string
- Add CSS keyframes `handSlideIn`, `handIdle`
- Update `setHandGesture()` to use the new renderer
- Verify on `setHandGesture($('handImgPlayer'),$('handPlayer'),null)` and `setHandGesture(..., 3)` callsites
- Smoke test: SVG must contain `<svg`, `stroke="#fffaf0"`, and the correct number of finger elements

### Phase 3 — Center "HAND CRICKET.IO" card
- Add `.center-card` markup inside `.arena`
- Add `updCenterCard()` function
- Wire into `updScore()`

### Phase 4 — Player cards (left + right)
- Replace current `.team` markup with new `.player-card` blocks
- Style to match reference (rounded, cream fill, 2px charcoal border, soft shadow)
- Wire `updScore()` to update them

### Phase 5 — Bottom tab bar
- Add `<div id="bottomTabBar">` to `<body>`
- Add 5 tabs with inline SVG icons
- Wire tab clicks to overlay routes
- Add 2 `#placeholderOverlay` elements (Lounge, Tournaments)

### Phase 6 — Coin balance + KV sync
- Add `<div class="coin-balance">` to home
- Add `getCoins()`, `addCoins()`, `setCoins()` helpers (local + KV)
- Extend `cloudSaveStory()` to include `coins`
- Wire into `updateStatsAfterMatch`

### Phase 7 — Daily challenge strip (mock)
- Add `<div class="daily-strip">` markup
- Static display, no logic

### Phase 8 — Profile card restyle
- Replace `#profileCard` template
- Add tab strip with OVERALL/BATTING/BOWLING
- 2×2 stat grid
- Google sign-in placeholder

### Phase 9 — "Collecting coins" overlay
- Add `<div id="collectOverlay">` to `<body>`
- Add 3D coin-flip animation (CSS `transform: rotateY`)
- Wire into `startInnings(n)`

### Phase 10 — Match options row + final polish
- Add `<div class="match-options">` to home with 3 cards
- Final color audit
- Text-stroke on titles
- Stadium-fog overlay

## Open questions (decided)

✅ **Hand rendering**: build cartoon SVG from scratch
✅ **Tab bar scope**: 3 real + 2 placeholders
✅ **Coin balance**: sync via Cloudflare KV (extends story save)
✅ **Daily challenge**: mock display

## Open questions (still pending)

1. **Coin entry cost for Local Club**: the reference shows 1000 🪙 entry. We don't have an entry-fee system. Options:
   - (a) Just display the cost as flavor text, don't actually deduct (recommended for v2.1)
   - (b) Implement real coin-deduction-on-entry (cancellable, no real-money implications)
2. **Are the 5 reference images representative of the final reference look**, or is the live site different? The live HTML uses Icons8 illustrations, the screenshots show custom illustrated cartoon hands. The user said the screenshots are the target. We'll match the screenshots, not the live site.
3. **Open Arena tab activation**: should it just open the matchmaking overlay (current behavior) or also start matchmaking automatically? Recommendation: open the overlay only, let user click the existing "Play vs Bot Now" or wait.

## Validation

- **JS smoke test** (JSDOM, reuse existing script at `C:\Users\pawan\AppData\Local\Temp\kilo\smoke.js`): verify `HandRenderer.draw(1, 'L')` returns a valid SVG string with `viewBox="0 0 200 200"`, contains `stroke="#fffaf0"`, has at least 5 finger-shape elements.
- **CSS sanity check**: grep for orphan colors `#0f172a` and `#f59e0b` outside of `:root` blocks — should return zero results after phase 10.
- **Visual regression**: hand-comparison with the 5 reference images. The new hand must be visibly illustrated (white outline, knuckle creases, large), not flat CSS.
- **No new console errors** in JSDOM through full offline lifecycle.
- **Bundle size** budget: keep `public/index.html` under 200 KB even after adding `HandRenderer` (~6 KB), `bottomTabBar` (~3 KB), 5 SVG icons (~1 KB), and the new center/player cards (~1 KB). Current size is 179 KB, so plenty of room.

## Out of scope (explicit)

- Real leaderboard / chat / tournaments backend
- Google Sign-in OAuth wiring
- 3D mode (we're 2D-only)
- Rewriting to React (keep single-file vanilla)
- Cloudflare Workers signaling server
- Real-money entry-fee system
- Daily-challenge real tracking
- Real "CERTIFIED 100% GUARANTEED" badge logic
- Local Club matchmaking
- Country Cup tournaments
- Chat system

## Definition of Done

- All 10 phases complete, each via a JSDOM smoke test that confirms zero new errors
- The two `:root` blocks merged
- `HandRenderer` library in place, hand visuals visibly illustrated (white outline, knuckle creases)
- 5-tab bottom bar with 3 real + 2 placeholder screens
- Coin balance syncs to KV; survives a hard refresh
- Daily challenge strip + match options row visible on home
- Profile card restyled with new layout
- "Collecting coins" overlay shows briefly before the first ball
- Bundle size under 200 KB
- The 5 reference images no longer feel like a different app
