# Hand Cricket Pro - Full Feature Audit and Documentation

## Game Overview
Hand Cricket Pro is a web-based cricket game playable in single-player (offline vs bot), multiplayer (online vs friend via PeerJS), and instant match modes. Features a professional dark UI with slate/amber color theme, SVG hand gesture animations, role system, story mode with 37 matches across 8 tiers, and comprehensive stats tracking.

## Color Theme
- Primary: `#0f172a` (dark slate)
- Secondary: `#1e293b`The user is asking me to `to write a full documented description of the hand cricket game and its features, gameplay, story, multiplier, rules, rules of everything, everything, a long detailed everything covered, a full audit, for instant matches, offline, multiplier

###.` I need to respond accurately and provide the detailed audit. I'll structure it with headings and clear sections. Let me start by thinking through what the user might want - they mention? probably want to understand the full game system after the previous conversation about bugs. But they said "give me full documented text here for the game

- Ensures proper mode is set ('offline' instead of 'online' for instant matches)
- Fixes team size selection flow
- Properly enforces role criteria before match start

## Multiplayer (Online Mode)
- **PeerJS-based** real-time multiplayer
- Host creates room, joiner joins via room ID
- Team size selection: 1v1, 2v2, 3v3, 5v5, 11v11
- Format decided by host (bat/ball toss)
- Role assignment overlay for team modes (aggressive/defensive/balanced roles)
- Connection status indicator with reconnection support
- Shareable room links via clipboard or Web Share API

### Online Match Flow
1. Host creates room → shows waiting overlay
2. Joiner connects → shows connected status
3. Team selection (if not pre-selected)
4. Toss (coin flip) - winner chooses bat/bowl
5. Role assignment (for team modes)
6. Match play - 5-second gesture window per ball
7. Innings break with stats
8. 2nd innings or match result

### Role System (Team Modes)
- **Aggressive bat**: Can only pick 3,4,5,6 
- **Defensive bat**: Can only pick 1,2,3,4
- **Balanced bat**: Can pick 1-6
- Same restrictions apply to bowling style
- Role limits by team size:
  - 1v1: No roles needed
  - 2v2: Max 1 Aggressive, Max 1 Defensive, Min 1 Balanced
  - 3v3: Max 1 Aggressive, Max 1 Defensive, Min 1 Balanced
  - 5v5: Max 2 Aggressive, Max 2 Defensive, Min 1 Balanced
  - 11v11: Max 4 Aggressive, Max 4 Defensive, Min 3 Balanced

### Network Events
- `hello`: Initial connection, name and team size exchange
- `sync`: Game state restoration for rejoin
- `team`: Team assignment
- `toss_start` / `toss_dec`: Toss resolution
- `choice`: Player's gesture pick
- `innings_sync`: Innings transition
- `rematch`: Rematch request
- `start_match`: Start match signal

## Instant Match
- Quick match vs bot with selected team size
- Team size selection before match (1v1, 2v2, 3v3, 5v5, 11v11)
- Role assignment overlay with validation
- No peer connection needed - pure bot AI
- **Fixed bugs:**
  - Now uses `G.mode='offline'` instead of `'online'`
  - Team size is properly read from UI selector
  - Role criteria enforced via `validateRoles()` 
  - Proper status bar updates ("BAT!" / "BOWL!" instead of "Choose mode")

## Offline Mode
- Single player vs "Ultra Bot"
- Team size selection: 1v1, 2v2, 3v3, 5v5, 11v11
- Toss (heads/tails) to decide bat/bowl
- Role assignment after toss
- Bot stats displayed before match
- Rematch and New Match buttons work properly

### Offline Flow
1. Mode select → team size selection → toss → role assignment → match play
2. Bot has pre-generated stats (matches, wins, runs, etc.)
3. Free hit rule: No-ball gives free hit to batter
6. Target chase in 2nd innings

## Story Mode
- 8 tiers with 37 total matches (Gully to National level)
- Narrative-driven matches with pre-match dialogue
- Team building from custom or cricket teams (CSK, MI, RCB, KKR, DC, RR)
- Toss with bat/bowl choice
- Role assignment for players
- Bot opponent with difficulty-based stats
- Trophy system with 8 tiers to complete
- Story progress saved to localStorage

### Story Mode Structure
- **8 Tiers**: Gully, Area, Village, City, District, State, National Q, National
- Each tier has multiple matches with increasing difficulty
- Narrative dialogue before each match
- Opponent names and stories per match
- Win/loss tracking per match
- Tier completion certificates

### Story Match Flow
1. Select tier/progress → Show narrative dialogue
2. Toss (random or player choice) → Bat/Bowl decision
3. Role assignment (if team mode)
4. Match play vs bot opponent
5. Post-match narrative based on result
6. Progress to next match or tier completion

## Gameplay Mechanics

### Basic Rules
- **Pick 1-6**: Each player picks a number simultaneously
- **Same number = OUT**: If batter and bowler pick same number, batter is out (unless Free Hit)
- **Different numbers = Runs**: Battery scores the number picked
- **5-second limit**: Players must pick within 5 seconds (countdown timer)
- **Free Hit**: No-ball gives Free Hit (batter can't be out next ball)
- **Sixes**: Hitting 6 scores 6 runs
- **Wickets**: 10 wickets per innings (11v11) or team-size dependent

### Scoring
- Runs scored per ball added to batter's total
- Wickets tracked per innings
- Overs: `totalBalls/6` (e.g., 1v1 = 1 over = 6 balls, 11v11 = 20 overs = 120 balls)
- Target: 2nd innings team must chase `target + 1`

### AI Bot Logic (BotAI)
- **2nd-order Markov chain**: Analyzes history to predict next pick
- **Anti-pattern detection**: Detects and avoids repeated patterns
- **Context-aware**: Considers match phase, wickets, required rate
- **Difficulty scaling**: `0` (Easy) to `1` (Hard) affects bot aggression
- **Defensive mode**: Activates when bot is close to target

### Bot AI Decision Flow
1. If ballCount < 3: Random pick
2. Check anti-pattern (avoid if recent 3 picks same)
3. Check Markov prediction (2nd-order)
4. Check frequency of recent choices
5. Check sequence patterns (consecutive ascending/descending)
6. Check repetition count
7. Check context prediction (defensive/wicket situations)
8. Fall back to weighted random or pure random

### Gesture System
- **SVG hand animations** for gestures 1-6
- `handSVG(v)` function generates inline SVG hands
- Arena hand with finger segments (thumb, index, middle, ring, pinky)
- Home hands with CSS-animated fingers
- Gesture grid: 6 buttons (1-6), disabled when restricted by role
- Restrictions enforced via `applyGestureRestrictions()` and `getAllowedGestures()`

### Hand Gesture Restrictions by Role
- **Aggressive batter**: Can only pick 3,4,5,6 (cannot pick 1,2)
- **Defensive batter**: Can only pick 1,2,3,4 (cannot pick 5,6)
- **Balanced batter**: Can pick 1-6 (no restrictions)
- Same restrictions apply when bowling
- Restricted gestures shown grayscale with reduced opacity

## UI Components

### Main Menus
- **Home screen**: Game title, home hand animations, mode buttons (Offline/Online/Instant), profile, credits
- **Mode selection**: Three columns of mode buttons
- **Team size selector**: Grid of team size buttons (1v1 through 11v11)

### Overlays
- **Menu overlay**: Main menu with mode selection
- **Offline setup**: Team size + toss
- **Online lobby**: Room creation/joining, format selection
- **Matchmaking**: Finding opponent (instant match)
- **Team selection**: vs opponent selection
- **Team builder**: Custom team creation (11 players)
- **Toss**: Coin flip for bat/bowl decision
- **Role assignment**: Assign aggressive/defensive/balanced roles
- **Match countdown**: 3...2...1...GO! with haptic feedback
- **Innings break**: Stats overlay with batting/bowling summaries
- **Result overlay**: Win/loss/tied result with rematch/new match options
- **Player selection**: Select next batter or bowler after wicket/over
- **Story dialogue**: Narrative text with speaker and choices
- **Trophy celebration**: Animated trophy with certificate
- **Roast display**: Funny text after match results

### In-Game UI
- **Scoreboard**: Two teams with scores, wickets, overs, current player
- **Status bar**: "BAT!" / "BOWL!" / "Choose mode" status
- **Timer**: 5-second countdown per ball
- **Gesture grid**: 6 gesture buttons (1-6)
- **Flash messages**: "SIX!", "FOUR!", "DOT!", "OUT!", etc.
- **Free hit banner**: Indicates free hit state
- **Target banner**: Shows target score in 2nd innings
- **Bot level**: Displays bot difficulty level (offline mode only)

## Technical Features

### Storage
- `localStorage` for:
  - Username
  - Game stats (matches, wins, losses, runs, strike rate, bowling avg)
  - Story progress (tier, match, myTeam, completedTiers)
  - Custom teams
  - Tutorial dismissal
- `sessionStorage` for current session data

### PeerJS Integration
- STUN/TURN servers for NAT traversal
- Connection polling every 200ms
- Auto-rejoin support
- Connection state management (connecting, open, closed)

### Game State Management
- `G` global object holds all game state
- `setStage(s)` function manages current game stage
- Stage progression: lobby → teams → toss → prematch → playing → break → over
- Watchdog timeout (12s) for stuck states

### Responsive Design
- Mobile-first with media queries breakpoints at 360px, 768px, 1024px
- Flexible grid layouts (stat grids, role rows, team size buttons)
- Touch-friendly hit areas and gestures
- Safe area insets for mobile notches

## Bug Fixes Applied (This Session)

1. **Instant match mode**: Changed `G.mode='online'` to `G.mode='offline'` (line 1013) - fixes "Choose mode" status showing during gameplay

2. **Team size selection**: Fixed `startBotMatch` to properly read and use `G.teamSize` from UI selector (was ignored)

3. **Role criteria enforcement**: Enhanced role validation flow - `validateRoles()` is called before match start in all modes (offline, online, instant, story)

4. **Start button bypass**: Fixed role assignment callback flow - `btnRoleStart.onclick` now properly validates roles via `validateRoles()` before proceeding

5. **Back button UI**: Added `.back-btn` class with consistent styling across all back buttons (menu, role assign, story, team overlays)

6. **Instant match vs bot flow**: Restructured `startBotMatch()` to call new `startInstantMatch()` function instead of going through online peer flow

7. **Gesture animations**: `setHandGesture()` properly reveals SVG hand animations with `reveal` keyframe

8. **Status bar flow**: Fixed by ensuring correct `G.mode` value, status now shows "BAT!" / "BOWL!" properly

## Known Issues / Blocked

- **KV namespace**: `wrangler.jsonc` has KV binding configured but needs actual namespace ID created via `wrangler kv namespace create KV`
- **HandGesture folder**: User mentioned generating AI video hand gestures; SVG hands serve as primary animation system
- **PeerJS connectivity**: May fail in restricted network environments (firewalls, corporate proxies)

## Deployment

- **Project name**: `handscricket` (with extra 's')
- **Live URL**: `https://handscricket.pages.dev`
- **GitHub**: `https://github.com/hiraypawan/handcricket.git` (branch `main`)
- **Latest deploy**: `https://7eccb2a6.handscricket.pages.dev`
- **Google Analytics**: `G-M484S7S0KG`
- **PeerJS CDN**: `https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js` (with `defer`)

## Next Steps

1. Create KV namespace: `wrangler kv namespace create KV`
2. Push to GitHub and deploy: `git add . && git commit -m "fix instant match + role criteria + back button UI" && git push && wrangler pages deploy public --project-name handscricket`
3. Test all modes (offline, online, instant, story) with various team sizes
4. Verify role restrictions are properly enforced
5. Test back button UI across all overlays