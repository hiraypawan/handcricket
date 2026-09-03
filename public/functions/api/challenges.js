const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestGet = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const user = url.searchParams.get('user');
    if (!user) return new Response(JSON.stringify({ error: 'Missing user' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    const key = 'challenges:' + user.toLowerCase().trim();
    const raw = await ctx.env.KV.get(key);
    if (!raw) return new Response(JSON.stringify({ challenges: [] }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    return new Response(JSON.stringify({ challenges: JSON.parse(raw) }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
};

export const onRequestPost = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const { user, action, botName, botStats } = body;
    if (!user || !action) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    const KV = ctx.env.KV;
    const key = 'challenges:' + user.toLowerCase().trim();

    if (action === 'send') {
      const raw = await KV.get(key);
      const challenges = raw ? JSON.parse(raw) : [];
      if (challenges.some(c => c.botName === botName && !c.resolved)) {
        return new Response(JSON.stringify({ ok: true, msg: 'Already pending' }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      challenges.push({ botName, botStats: botStats || null, since: Date.now(), resolved: false });
      await KV.put(key, JSON.stringify(challenges));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'resolve') {
      const raw = await KV.get(key);
      if (!raw) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const challenges = JSON.parse(raw);
      const idx = challenges.findIndex(c => c.botName === botName && !c.resolved);
      if (idx !== -1) challenges[idx].resolved = true;
      await KV.put(key, JSON.stringify(challenges));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
