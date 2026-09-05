const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

/* LEADERBOARD — most wins, real players only.
   Only humans ever reach `profile:<name>`: publishProfile() runs from
   updateStatsAfterMatch(), and bot/persona careers are generated in-memory and
   never written to KV. Anything flagged isPersona is filtered out as a second
   guard, so a persona can never climb the board. */
export const onRequestGet = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 50);
    const me = (url.searchParams.get('me') || '').toLowerCase().trim();

    const rows = [];
    let cursor;
    let scanned = 0;
    // KV list is paginated; cap the scan so a big namespace can't time out
    do {
      const page = await ctx.env.KV.list({ prefix: 'profile:', limit: 200, cursor });
      cursor = page.list_complete ? undefined : page.cursor;
      for (const k of page.keys) {
        if (scanned++ >= 500) break;
        const raw = await ctx.env.KV.get(k.name);
        if (!raw) continue;
        let p;
        try { p = JSON.parse(raw); } catch (e) { continue; }
        const st = p && p.stats;
        if (!st || typeof st !== 'object') continue;
        if (st.isPersona) continue;
        const wins = Number(st.wins) || 0;
        const matches = Number(st.matches) || 0;
        if (matches <= 0) continue;
        rows.push({
          name: p.name || k.name.replace(/^profile:/, ''),
          wins,
          matches,
          losses: Number(st.losses) || 0,
          runs: Number(st.runs) || 0,
          highestScore: Number(st.highestScore) || 0,
          winPct: matches ? Math.round((wins / matches) * 100) : 0,
          updatedAt: p.updatedAt || 0,
        });
      }
    } while (cursor && scanned < 500);

    rows.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct || a.name.localeCompare(b.name));
    const top = rows.slice(0, limit);
    const myRow = me ? rows.find((r) => r.name.toLowerCase() === me) : null;
    return json({
      leaders: top,
      total: rows.length,
      me: myRow ? { rank: rows.indexOf(myRow) + 1, ...myRow } : null,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = async () => new Response(null, { status: 204, headers: corsHeaders });
