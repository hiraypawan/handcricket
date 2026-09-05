# Hand Cricket Pro v2.8

Mobile-first cricket game (offline vs bot, quick match, online friend play,
and an 8-tier story career). Static Cloudflare Pages app — **zero build step**.

## Quick links
- **For AI/vibe coders:** read [`AI_CONTEXT.md`](./AI_CONTEXT.md) first — file
  map, load order, state model and edit rules.
- **Bug + audit history:** [`docs/`](./docs/) (`BUG_HUNT_FINDINGS.md` is the
  master report; `DIRECTORY_ANALYSIS.md`, `HAND_CRICKET_AUDIT.md` older).

## Stack
- Static site in `public/` — no bundler, no framework, plain scripts
- `public/index.html` — slim shell (markup + `<link>` + ordered `<script>`s)
- `public/css/app.css` — all styles
- `public/js/*` — modular game logic (22 files, numbered in load order)
- `functions/api/*` — Cloudflare Pages Functions + Workers KV (`KV`).
  ⚠️ This directory **must** stay at the repo root (a sibling of `public/`).
  Cloudflare only compiles Functions from `<root>/functions`; when it lived in
  `public/functions` every deploy shipped zero Functions *and* published the
  handler source as static files.
- Hands/ball UI: pure CSS/SVG (no external image assets)
- v2.5: one design-system stylesheet (`public/css/app.css`, dark night-stadium theme), all UI glyphs are inline SVG — no emoji chrome

## Local dev
```bash
npm install
npx wrangler pages dev public --kv KV
```
Open the printed URL (usually `http://localhost:8788`). You should see
`✨ Compiled Worker successfully` — that means `functions/` was picked up and
`/api/*` is live against a local (simulated) KV. If it prints
`No Functions. Shimming...`, the `functions/` directory has moved.

## Tests
```bash
node tools/smoke.mjs     # jsdom regression suite (no browser needed)
```
Boots the real page, plays full matches (1v1, 5v5 role flow, quick match),
and verifies story/casual isolation. Add a check whenever you fix something.

## Deploy to Cloudflare Pages
1. `npx wrangler login`
2. KV namespaces already exist — ids live in `wrangler.jsonc`. (To recreate:
   `npx wrangler kv:namespace create HC_KV` → paste id + `--preview` id.)
3. `npx wrangler pages deploy ./public --project-name handcricket`

## Story data
Edit `public/js/story-data.js`. Bump `?v=N` in its `<script src>` in
`public/index.html` after every change to bust caches.

## Versioning
Keep these four in step when you ship:
- `.home-version` in `public/index.html` (currently `v2.8.0`)
- `?v=` cache-buster on every `<script>`/`<link>` in `public/index.html`
- `version` in `package.json`
- the `# Hand Cricket Pro vX.Y` heading in this file
