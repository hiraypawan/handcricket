# Hand Cricket Pro v2.2

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
- `public/functions/api/*` — Cloudflare Pages Functions + Workers KV (`KV`)
- Hands/ball UI: pure CSS/SVG (no external image assets)

## Local dev
```bash
npx wrangler pages dev ./public
```
Open the printed URL (usually `http://localhost:8788`).

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
- UI version span `.home-version` in `public/index.html` (currently `v2.2`)
- `<script src="js/story-data.js?v=N">` cache-buster
