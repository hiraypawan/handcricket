import {
  cors,
  json,
  lbRow,
  LB_KEY,
} from '../../lib/api/shared.js';

/* LEADERBOARD — most wins, real players only.
   Only humans ever reach `profile:<name>`: publishProfile() runs from
   updateStatsAfterMatch(), and bot/persona careers are generated in-memory and
   never written to KV. Anything flagged isPersona is filtered out as a second
   guard, so a persona can never climb the board.

   Reads the maintained `leaderboard:top` index — one KV get per request.
   The full scan below only runs once, to seed the index from careers that
   were published before the index existed. */
export const onRequestGet = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 50);
    const me = (url.searchParams.get('me') || '').toLowerCase().trim();
    const refresh = url.searchParams.get('refresh') === '1';

    let idx = null;
    if (!refresh) {
      const raw = await ctx.env.KV.get(LB_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.rows)) idx = parsed;
        } catch (e) { idx = null; }
      }
    }

    if (!idx) idx = await seedIndex(ctx.env.KV);

    const rows = Array.isArray(idx.rows) ? idx.rows : [];
    const leaders = rows.slice(0, limit);

    let myRow = null;
    if (me) {
      const hit = rows.findIndex((r) => String(r.name).toLowerCase() === me);
      if (hit >= 0) {
        myRow = { rank: hit + 1, ...rows[hit] };
      } else {
        // Outside the top 50 — still show their own numbers, rank unknown.
        const raw = await ctx.env.KV.get('profile:' + me);
        if (raw) {
          try {
            const p = JSON.parse(raw);
            if (p && p.stats && !p.stats.isPersona) {
              myRow = { rank: null, ...lbRow(p.name || me, p.stats, p.updatedAt) };
            }
          } catch (e) { /* ignore */ }
        }
      }
    }

    return json({ leaders, total: Number(idx.total) || rows.length, me: myRow });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

/* One-time backfill: scan profile:* and write the index. Bounded so a huge
   namespace can't time out a request. */
async function seedIndex(KV) {
  const rows = [];
  let cursor;
  let scanned = 0;
  do {
    const page = await KV.list({ prefix: 'profile:', limit: 200, cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const k of page.keys) {
      if (scanned++ >= 500) break;
      const raw = await KV.get(k.name);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch (e) { continue; }
      const st = p && p.stats;
      if (!st || typeof st !== 'object') continue;
      if (st.isPersona) continue;
      if ((Number(st.matches) || 0) <= 0) continue;
      rows.push(lbRow(p.name || k.name.replace(/^profile:/, ''), st, p.updatedAt));
    }
  } while (cursor && scanned < 500);

  rows.sort(
    (a, b) => b.wins - a.wins || b.winPct - a.winPct || a.name.localeCompare(b.name),
  );
  const idx = {
    rows: rows.slice(0, 50),
    total: rows.length,
    updatedAt: Date.now(),
    seeded: true,
  };
  try { await KV.put(LB_KEY, JSON.stringify(idx)); } catch (e) { /* read-only KV */ }
  return idx;
}

export const onRequestOptions = cors;
