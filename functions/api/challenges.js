const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

async function readList(KV, user) {
  const key = 'challenges:' + user.toLowerCase().trim();
  const raw = await KV.get(key);
  if (!raw) return [];
  try {
    const l = JSON.parse(raw);
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

export const onRequestGet = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const url = new URL(ctx.request.url);
    const user = url.searchParams.get('user');
    if (!user) return json({ error: 'Missing user' }, 400);
    const challenges = await readList(ctx.env.KV, user);
    return json({ challenges });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const body = await ctx.request.json();
    const { user, action, botName, botStats, from, link, room, teamSize } = body;
    if (!user || !action) return json({ error: 'Missing params' }, 400);
    const KV = ctx.env.KV;
    const key = 'challenges:' + user.toLowerCase().trim();

    /* legacy bot challenge */
    if (action === 'send') {
      const challenges = await readList(KV, user);
      if (challenges.some(c => c.botName === botName && !c.resolved)) {
        return json({ ok: true, msg: 'Already pending' });
      }
      challenges.push({ botName, botStats: botStats || null, since: Date.now(), resolved: false });
      await KV.put(key, JSON.stringify(challenges));
      return json({ ok: true });
    }

    /* FRIEND INVITE: a real room link delivered to the target's inbox, so
       "Play" on a friend reaches them even with no live socket. */
    if (action === 'invite') {
      if (!from || !room) return json({ error: 'Missing from/room' }, 400);
      const challenges = await readList(KV, user);
      // one live invite per room, and only a few recent ones
      const fresh = challenges.filter(c => c.resolved || Date.now() - (c.since || 0) < 3600000);
      if (fresh.some(c => c.type === 'invite' && c.room === room && !c.resolved)) {
        return json({ ok: true, msg: 'Invite already pending' });
      }
      fresh.push({
        type: 'invite',
        from,
        room,
        link: link || null,
        teamSize: teamSize || 1,
        since: Date.now(),
        resolved: false,
      });
      await KV.put(key, JSON.stringify(fresh.slice(-20)));
      return json({ ok: true, sent: true });
    }

    if (action === 'resolve') {
      const challenges = await readList(KV, user);
      const idx = challenges.findIndex(c =>
        !c.resolved && ((room && c.room === room) || (botName && c.botName === botName)),
      );
      if (idx !== -1) challenges[idx].resolved = true;
      await KV.put(key, JSON.stringify(challenges));
      return json({ ok: true });
    }

    if (action === 'clear') {
      await KV.put(key, JSON.stringify([]));
      return json({ ok: true });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
