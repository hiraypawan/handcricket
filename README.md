# Hand Cricket Pro v2

Mobile-first single-file cricket game with peer-to-peer, matchmaking, and a 7-tier story career mode.

## Stack
- Static single-file game: `public/index.html` (~95 KB, no build step)
- Story data: `public/src/story-data.js`
- Cloud save API: `public/functions/api/{save,load}.js` (Cloudflare Pages Functions + Workers KV)
- Hand visuals: pure CSS 3D (no external assets)

## Local dev
```bash
npx wrangler pages dev ./public
```
Open the printed URL (usually `http://localhost:8788`).

## Deploy to Cloudflare Pages
1. `npx wrangler login`
2. `npx wrangler kv:namespace create HC_KV` → paste the id into `wrangler.jsonc`
3. `npx wrangler kv:namespace create HC_KV --preview` → paste into a `preview_id` field (optional, only for preview environments)
4. `npx wrangler pages deploy ./public --project-name handcricket`
5. The first URL printed is your live site.

## Story data
Edit `public/src/story-data.js`. Bump `?v=N` in the `<script src>` on `public/index.html` after every change to bust caches.

## Hand assets (optional)
Drop six PNGs (1.png..6.png) into `public/assets/hands/` if you want a premium look. The current CSS 3D hand is the default; PNG fallback is opt-in (no code change required, just the files).

## Versioning
- `home-version` span in `public/index.html` (currently `v2.1`)
- `wrangler.jsonc` `compatibility_date`
- `<script src="src/story-data.js?v=N">` cache-bust
