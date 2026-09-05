# Plan: Complete Audit & Fix — Hand Cricket Pro v2

## Status of Previously Reported Bugs (Re-verified 2026-09-05)

After reading all 20 JS modules, CSS, HTML, and backend API files, here is the **current truth**:

### Already Fixed (confirmed in code)
| Old ID | Issue | Status | Evidence |
|--------|-------|--------|----------|
| C1 | `$('nameB').onclick` crash | **FIXED** | `07-display.js:56-57` uses safe `if($('nameA'))` guard; `12-tutorial.js:94-95` confirms legacy handlers removed |
| C2 | `curBatter()`/`curBowler()` swapped | **FIXED** | `09-engine.js:11-18` correctly uses `G.iBat ? G.myPlayers : G.oppPlayers` for batter and inverse for bowler |
| C4 | Per-player stats never written | **FIXED** | `09-engine.js:266-275` (dotBall), `298-301` (noBall), `402-407` (free-hit), `434-438` (wicket), `447-456` (runs) all write to `currentBatterStats()`/`currentBowlerStats()` |
| C5 | Cloud save ESM syntax | **FIXED** | `save.js:1` and `load.js:1` both use `export const onRequestPost/Get`; local fallback at `16-story.js:482-494` writes localStorage BEFORE fetch and throws on non-2xx |
| C6 | `storyDifficulty` leaks | **FIXED** | `13-offline.js:124-125` resets `G.storyDifficulty=0; G.storyMatch=false` in `startOffline()` |
| C7 | Story career corruption | **FIXED** | `16-story.js:602` gates on `G.storyMatch`; `16-story.js:275` sets `G.storyMatch=true` only in `startStoryMatchPlay()` |
| C9 | Cloud save/load syntax | **FIXED** | Valid ESM confirmed |
| C10 | Story double-counting | **FIXED** | `16-story.js:621-630` uses upsert via `findIndex` instead of append |
| H1 | Instant match fake | **FIXED** | `18-instant.js:6-9,24-38` honest copy "Instant bot match", no fake timer |
| BUG1 | `showMenu()` undefined | **FIXED** | `05-navigation.js:7-17` defines `showMenu()` and `showStoryHome()` |
| BUG2 | Tab bar z-index | **FIXED** | CSS line 135: overlays at z-index 12; tab bar needs verification but menu overlay is now transparent |
| BUG3 | `showFriends` scope | **FIXED** | `20-friends.js:245` uses `window.showFriends` and `356` calls it correctly |
| BUG7 | `ensureUsername` callback | **FIXED** | No longer uses broken `_pendingCbs` array pattern |

### Still Open (verified bugs remaining)

| # | Severity | Issue | Location | Impact |
|---|----------|-------|----------|--------|
| R1 | HIGH | **Online joiner never sees role-assign overlay** | `14-online.js:507-535` — only host runs `showRoleAssign()` in `checkTeams()`. Joiner gets random roles assigned by host at line 512-520 | Asymmetric: joiner has zero agency over team composition in online matches |
| R2 | HIGH | **Opponent profile shows YOUR name** | `10-profiles.js:109-121` — `displayName` falls back to `G.myName` when viewing opponent; avatar row always prints your name | Confusing UX |
| R3 | HIGH | **Friend "Play" doesn't auto-share link** | `20-friends.js:215-243` — creates PeerJS room but never triggers `navigator.share` or clipboard copy automatically | User must manually find/copy the link |
| R4 | MEDIUM | **Daily challenge strip is decoration** | `index.html` daily-strip div — no JS writes to rank/chances/points | Misleading UI |
| R5 | MEDIUM | **Lounge & Tournaments tabs just alert()** | `05-navigation.js:54-57` | Broken UX |
| R6 | MEDIUM | **Hatrick stat counts 3+ wickets per match, not consecutive** | `10-profiles.js:93` | Meaningless stat |
| R7 | MEDIUM | **RR roster duplicate "Boult"/"Bolt"** | `01-config.js:99-100` | Same-name players break online role sync by name matching |
| R8 | MEDIUM | **Tutorial auto-shows during online rejoin** | `12-tutorial.js` | Mid-match overlay collision |
| R9 | LOW | **Coin balance always 2000** | `coinAdd` onclick alerts "coming soon" | Fake economy |
| R10 | LOW | **Version mismatch** — UI v2.1, package.json 2.0.0 | Various | Confusing |
| R11 | LOW | **No PWA manifest/SW, no SRI on CDN scripts** | `index.html` head | Offline/security |
| R12 | LOW | **Google Analytics unconditional** | `index.html:14-15` | Privacy |

---

## Answers to User's Specific Questions

### 1. Story Mode
- **Works correctly.** 8 tiers, 37 matches, EN/HI narratives, difficulty ramp 0.2→0.95. Cloud save with local fallback. Career stats properly gated on `G.storyMatch`. Trophy/tier progression with upsert (no double-counting). Team builder with 81-player pool.
- **Remaining issue:** Story language switch only persists via cloud (`16-story.js:558-561`). If cloud fails, language resets on next load. Add `localStorage.setItem('hcp_story_lang', storyLang)` as fallback.

### 2. Friend List & Invitation
- **Friend list CRUD works.** Add/remove/accept/reject with KV sync. Bot friend requests work (40% chance post-match).
- **Remaining issues:**
  - R3: "Play" button creates room but doesn't auto-trigger share/copy
  - `/api/challenges.js` exists and is valid but `checkBotChallenges` and `maybeBotChallenge` are empty stubs (`20-friends.js:366,435`)
  - Friend challenges between real humans require manual link sharing

### 3. Players & Bot Players
- **IPL rosters:** 8 teams (CSK/MI/RCB/KKR/DC/RR/SRH/PBKS), 11 players each, correct roles
- **Bot AI:** Real Markov + anti-pattern + context prediction. Difficulty scales 0→1. `BotAI.reset()` properly clears state.
- **Bot profiles:** Generated with realistic stats (matches, wins, SR, bowling avg). Names from Indian name pools with gaming prefixes/suffixes.
- **Remaining issue:** R7 — RR has both "Boult" and "Bolt" (duplicate Trent Boult)

### 4. Difficulty Scaling
- **Works correctly.** `BotAI.difficulty` set per-mode:
  - Offline casual: `Math.min(0.1 * teamSize, 0.5)` (`09-engine.js:217`)
  - Story: tier-specific 0.2→0.95 (`16-story.js:270`)
  - Reset to 0 for casual matches (`13-offline.js:124`)
- Bot adapts within a match: `ballCount/8` scaling factor + phase detection (start/middle/end)

### 5. Role System (Aggressive/Balanced/Defensive)
- **Works correctly across ALL modes:**
  - Offline: `13-offline.js:86-110` → `showRoleAssign()` for teamSize>1
  - Online: `14-online.js:522` → `showRoleAssign()` for host (JOINER MISSING — R1)
  - Story: `16-story.js:184` → `showRoleAssign()` with pre-set styles from player pool
  - Instant: `18-instant.js:54` → `showRoleForOffline()` → same offline path
- **Gesture restrictions work:** `15-roles.js:29-47` applies `.restricted` class; CSS `app.css:335-337` grays out + disables pointer events
- **Role limits per format enforced:** `15-roles.js:161-167` — 1v1 no limits, 2v2/3v3 max 1 AGG/1 DEF/min 1 BAL, 5v5 max 2/2/1, 11v11 max 4/4/3
- **Bowler role hidden until wicket/over:** `15-roles.js:56-76` reveal banner
- **Remaining issue:** R1 — joiner in online mode never sees the role assignment screen

### 6. UI Appeal Assessment

**What looks good:**
- Warm orange/gold palette (`--bg:#f0b840`, `--bg2:#e8a020`) matches reference
- SVG stadium backdrop with clouds, floodlights, trees, pitch
- Player cards with live score/balls/badges
- Center branding card with OVER/CRR/RRR
- Animated coin flip with 3D transform
- Gesture buttons with color-coded borders per number
- Tutorial overlay with dots navigation
- Profile card with tabbed stats (Overall/Batting/Bowling)
- Story home with trophy shelf, tier cards, match dots, progress bar

**What needs improvement vs handcricket.in reference:**
- Hands are flat SVG, not illustrated cartoon style (reference has thick-outlined cartoon hands)
- No illustrated avatars (reference has character portraits)
- Daily strip is fake decoration
- Lounge/Tournaments tabs are dead
- Coin economy is non-functional
- No tournament bracket mode
- Profile lacks illustrated design (avatar + pencil edit, star rank visual)

### 7. Sharing Link & Join Flow
- **Works:** Host creates room → URL gets `?room=XXX` → share via `navigator.share` or clipboard → joiner opens link → auto-detects room param → joins via PeerJS
- **Rejoin works:** Session snapshot in sessionStorage, host recreates peer on refresh, joiner auto-rejoins
- **Remaining:** R3 — friend challenge doesn't auto-share

---

## Fix Plan (Ordered by Priority)

### Phase 1: Critical Gameplay Fixes
1. **R1** — Give online joiner role-assign screen: after `d.type==='team'` in `handleNet()`, if joiner and teamSize>1, show `showRoleAssign(G.myPlayers, 'online', cb)` and send `{type:'roles', players:...}` back to host before proceeding to toss
2. **R2** — Fix opponent profile name: `10-profiles.js:109` change `displayName` logic to use `name` param when provided, not `G.myName`
3. **R7** — Remove duplicate "Bolt" from RR roster in `01-config.js:100`

### Phase 2: Feature Completion
4. **R3** — Auto-trigger share in `challengeFriend()`: after `startPeer(true)`, when peer opens and shareBox is populated, auto-call `navigator.share` or `navigator.clipboard.writeText`
5. **R5** — Replace Lounge/Tournaments `alert()` with placeholder screens showing "Coming Soon" with an icon and description
6. **R4** — Either wire daily challenge to real tracking or remove the strip entirely
7. **R6** — Fix hatrick to track consecutive wickets (reset counter on non-wicket ball)

### Phase 3: Polish
8. **R8** — Skip tutorial auto-show when `G.stage !== 'lobby'` or when arriving via `?room=` rejoin
9. **R9** — Wire coin balance to localStorage (start 2000, +50 win, -10 loss) or remove the display
10. **R10** — Bump package.json to 2.1.0
11. **R11** — Add PWA manifest, service worker stub, SRI hashes
12. **R12** — Add GA consent check

### Phase 4: Visual Enhancement (separate plan)
- Cartoon hand SVG replacement
- Illustrated avatars
- Profile card redesign
- Tournament bracket UI

## Validation
- JSDOM smoke test through full offline lifecycle
- Manual test: online 2v2 with two browsers, verify both see role-assign
- Manual test: friend Play flow triggers share dialog
- Manual test: story mode complete Gully tier (3 matches)
- Lighthouse mobile Performance ≥ 90

## Out of Scope
- Backend matchmaking server
- Real-time chat
- Tournament backend
- OAuth/sign-in flow
- 3D hand models

</content>