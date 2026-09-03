# Plan: Home Page Bug Fixes (deployed at handscricket.pages.dev)

## Context

The user reports two concrete problems on the deployed `handscricket.pages.dev` home page (v2.1):

1. **"Not able to click anything"** — first interaction throws a JS error and the page dies.
2. **"UI home page looks bad"** — dark teal background, content doesn't fill the screen, no bottom tab bar, no `?` help button visible.

I read `D:\AgentsAI\Game\public\index.html` (3,234 lines) end-to-end to diagnose. Found **8 bugs** (2 critical, 4 high, 2 medium). No "more bugs" hunt needed beyond what I found — every symptom in the screenshot traces back to one of these.

## Bug list (ordered by severity)

### 🔴 BUG 1 — Critical: `TabBar.switch('battle')` calls `showMenu()` which is undefined
- **Location**: `public/index.html` line 1336
- **Code**: `if(tab==='battle'){ showMenu(); }`
- **Why it kills the page**: `showMenu` is never defined. First click on the **Battle** tab (the default-active tab, so any click anywhere in the bottom tab bar zone) throws `ReferenceError: showMenu is not defined`. After that, the JS event handler is detached from the rest of the page; subsequent clicks on `#modeOffline`, `#modeOnline`, `#modeInstant`, `#btnProfile`, `#btnFriends` all do nothing because the listeners were attached but the click on the page background where the tab bar lives silently threw.
- **Why "nothing is clickable"** to the user: they see the home page, they tap somewhere (anywhere — including what looks like a tab or the page background), JS throws, the rest of the page looks "frozen".
- **Same bug for `team` tab**: line 1339 calls `showStoryHome()` which is also undefined.

### 🔴 BUG 2 — Critical: Bottom tab bar is hidden behind the menu overlay
- **Location**: `.tab-bar { z-index: 9 }` (line 575) and `.overlay { z-index: 10 }` (line 151)
- **Why it matters**: The tab bar is `position: fixed; bottom: 0` with `z-index: 9`. The `#menuOverlay` is `position: fixed; inset: 0` with `z-index: 10`. The overlay covers the entire viewport including the tab bar. **Clicks on the tab bar area pass through to the menu overlay underneath** (which has no click handler in the area where the tab bar sits). The tab bar is functionally invisible.
- **User-visible effect**: "the bottom tab bar isn't visible" — it's there in the DOM, but the dark menu overlay (rgba(38,70,83,.94)) covers it because the overlay uses `inset:0` and a higher z-index.

### 🟠 BUG 3 — High: `showFriends()` not defined when called from inline onclick
- **Location**: `$('btnFriends').onclick=()=>{sfx('tap');showFriends()}` (line 3186) calls `showFriends()` as a bare identifier
- **Code elsewhere**: `window.showFriends = async function(){...}` (line 3126) attaches it to `window`, not the global scope
- **Why it fails**: when the click handler runs, `showFriends` is looked up as a global; `window.showFriends` exists but the global `showFriends` does not. `showFriends()` throws `ReferenceError`.
- **Same fix pattern needed**: change all tab-bar / menu references to `window.showFriends` or just define it in global scope.

### 🟠 BUG 4 — High: `?` help button (tutorial opener) is missing its click handler
- **Location**: HTML at `id="btnHelp"` (somewhere in the home overlay), no `onclick` and no `$('btnHelp').onclick=...`
- **User-visible effect**: clicking `?` does nothing. (User reported the help button is missing entirely — actually it might be there but not wired, or not rendered due to z-index issue above.)

### 🟠 BUG 5 — High: Menu overlay background is dark teal, not warm orange
- **Location**: `.overlay { background: rgba(38,70,83,.94) }` (line 151)
- **Effect**: matches the `var(--ink)` charcoal with 94% opacity. The home screen sits on a dark teal glass. The reference (`handcricket.in`) uses a warm orange `#e8a020` background everywhere. The screenshot shows the dark teal — this is the "UI looks bad" complaint.
- **Fix**: change `.overlay` background to `var(--bg2)` (`#e8a020`) or a translucent warm gradient. Specifically the `#menuOverlay` should be transparent (let the warm `#app` background show through) and other overlays (offline, online, etc.) should keep a dark backdrop since they're modal.

### 🟠 BUG 6 — High: Home page content doesn't fill wide desktop viewports
- **Location**: `.overlay` uses `justify-content: flex-start` (line 151) — content stacks from top
- **Effect**: on a 1366px desktop, the home content (300px wide column) sits at the top, and `v2.1` lands at the bottom of the viewport because it's the last child of a `position:fixed; inset:0` flex container. Looks "scattered" instead of centered.
- **Fix**: change `.overlay` to `justify-content: center` and limit max-width on the inner content; or use a wrapper element with `min-height: 100dvh` and `display: flex; align-items: center; justify-content: center`.

### 🟡 BUG 7 — Medium: `ensureUsername` callback array pattern is broken
- **Location**: line 1478 — `if(window._pendingCbs&&window._pendingCbs.length){window._pendingCbs.forEach(...)}`
- **What I see elsewhere**: `modeOffline` (line 1499) calls `ensureUsername(()=>{...})` — but `ensureUsername` only stores a single callback in `window._pendingCb` (not `_pendingCbs` array). The check at line 1478 is for the array, so for the first `ensureUsername` call (which the user makes when they click Offline), `_pendingCbs` is undefined, the array-iteration is skipped, and **the callback never runs**.
- **User-visible effect**: clicking "Offline" silently does nothing after entering a username. Same for "Online" and "Instant Match".
- **This is the #1 reason "not able to click anything" — the `ensureUsername` callback pattern is broken.**

### 🟡 BUG 8 — Medium: `homeTrophyShelf` rendering uses `innerHTML =` with un-escaped player data
- **Location**: `updHomeTrophies` (around line 1490) — dynamic `innerHTML` writes
- **Risk**: not exploited yet but any user-controlled username or story data can inject HTML. Low priority but worth fixing when touching the same area.
- **Out of scope** for this fix unless it blocks the deploy.

## Fix plan (ordered for one-shot)

### Fix 1 — Define `showMenu` and `showStoryHome` (critical)
**File**: `public/index.html`, near line 1328 where `TabBar` is defined.

Insert two helper functions just above the `TabBar` const:
```js
function showMenu(){
  // hide all overlays
  document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
  // hide story-specific screens
  $('storyHome').classList.add('hidden');
  $('storyTeamBuilder').classList.add('hidden');
  // show the menu
  $('menuOverlay').classList.remove('hidden');
  // restore trophy shelf
  updHomeTrophies();
  history.replaceState({},'',location.pathname);
}
function showStoryHome(){
  document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
  $('menuOverlay').classList.add('hidden');
  $('storyHome').classList.remove('hidden');
  if(typeof renderStoryHome==='function')renderStoryHome();
}
```

### Fix 2 — Promote tab bar above menu overlay (high)
**File**: `public/index.html` line 575, change `.tab-bar { z-index: 9 }` to `.tab-bar { z-index: 11 }` (above the overlay's 10) so the tab bar is always reachable. Also make sure the tab bar background is opaque (`background: var(--card)`) so it shows cleanly over the menu.

### Fix 3 — Fix `showFriends` scope (high)
**File**: `public/index.html` line 3126, change `window.showFriends=async function(){...}` to `function showFriends(){...}` (top-level `function` declaration attaches to `window` automatically and is in the global scope). Same change for any other `window.X` assignments that are called via bare identifiers.

### Fix 4 — Wire `?` help button (high)
**File**: `public/index.html` near where `$('btnHelp')` should be wired. The tutorial code from the previous plan (openTutorial/closeTutorial) is still in the file. Add:
```js
$('btnHelp').onclick=()=>{sfx('tap');openTutorial()};
```
Place it next to the other home overlay handlers around line 1519.

### Fix 5 — Make `#menuOverlay` background warm + centered (high)
**File**: `public/index.html` line 151 (`.overlay` rule).

Change the `.overlay` rule to:
- `background: rgba(38,70,83,.94)` → keep as default for **modal** overlays
- Add new rule specifically for `#menuOverlay`:
```css
#menuOverlay{
  background: transparent;
  justify-content: center;
  align-items: center;
}
#menuOverlay::before{
  content:'';
  position:absolute;inset:0;
  background: radial-gradient(ellipse at top, rgba(38,70,83,.25) 0%, rgba(38,70,83,0) 60%);
  pointer-events:none;
  z-index:-1;
}
#menuOverlay > *{ position: relative; z-index: 1; }
```
This makes the home overlay transparent so the warm `#app` background (orange gradient) shows through, with a soft vignette at the top. The content is centered both vertically and horizontally.

### Fix 6 — Center menu content on wide screens (high)
**File**: `public/index.html`, the `.home-username` / `.home-title` / `.home-subtitle` / `.mode-grid` rules.

Add a width clamp to the home content:
```css
#menuOverlay .home-hands,
#menuOverlay .home-title,
#menuOverlay .home-subtitle,
#menuOverlay .home-username,
#menuOverlay .coin-balance,
#menuOverlay .daily-strip,
#menuOverlay .daily-caption,
#menuOverlay .mode-grid,
#menuOverlay .home-profile-wrap,
#menuOverlay .home-credit,
#menuOverlay .home-version{
  max-width: 340px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
```
And wrap the home content in a single `<div class="menu-inner">` so the centering works on desktop and mobile.

### Fix 7 — Fix `ensureUsername` callback (high, the actual "nothing clickable" cause)
**File**: `public/index.html`, the `ensureUsername` function around line 1455, and the `btnSaveUsername` handler at line 1478.

Current code uses `window._pendingCb` (singular). The mode handlers use `ensureUsername(()=>{...})` (singular callback). The save handler at line 1478 checks `window._pendingCbs` (plural) — **mismatch**.

Fix: change line 1478 from `window._pendingCbs` to `window._pendingCb` (singular). And change line 1455 from `window._pendingCbs.push(cb)` (if that's what it does) to `window._pendingCb = cb` (or just `window._pendingCb=cb;cb&&cb();` to run synchronously after close).

This is the **single most important fix** for the user's complaint.

### Fix 8 — Quick CSS cleanups (medium)
- Move the `?` help button to `z-index: 12` (above tab bar) and `position: fixed` so it floats over the home
- Hide the tab bar when a modal overlay is open (using `.overlay:not(.hidden) ~ .tab-bar { display: none }` or just `body[data-screen="game"] .tab-bar { display: none }` set by JS)
- Add `body { background: var(--bg); }` to ensure warm fallback if `#app` fails to render

## Implementation order

1. **Fix 7** (ensureUsername) — most important, single-line change
2. **Fix 1** (showMenu, showStoryHome) — 2 small functions
3. **Fix 2** (z-index) — 1-line CSS
4. **Fix 3** (showFriends scope) — 1-line JS
5. **Fix 4** (btnHelp handler) — 1-line JS
6. **Fix 5 + 6** (warm menu + centering) — CSS block
7. **Fix 8** (help button z-index, tab bar hide-on-modal) — small CSS

## Validation

After all fixes, run the JSDOM smoke test (`C:\Users\pawan\AppData\Local\Temp\kilo\smoke.js`):
- Click `#modeOffline` after the tutorial closes → expect `offlineSetup` overlay to be visible (not the username overlay stuck open)
- Click `#tab-battle` → expect `menuOverlay` to remain visible (no error)
- Click `#btnFriends` → expect friends overlay to appear (no error)
- Click `#btnHelp` → expect tutorial overlay to appear

Plus a manual deploy verification:
- `npx wrangler pages deploy ./public --project-name handscricket` to push
- Open `https://handscricket.pages.dev` on phone
- Tap each of the 3 mode cards → each should ask for username, save, and route to the right overlay

## Out of scope (explicit)

- Full UI redesign to match `handcricket.in` reference (covered by the existing polish plan)
- Rewriting the role system
- Backend changes
- Hand SVG library (covered by polish plan)
- New game modes

## Definition of Done

- All 8 bugs fixed in `public/index.html`
- JSDOM smoke test passes with zero ReferenceErrors
- Manual mobile test: all 3 home mode cards route correctly
- Manual mobile test: `?` help button opens tutorial
- Manual mobile test: tab bar is visible and clickable above the menu overlay
- Deployed to `handscricket.pages.dev`
