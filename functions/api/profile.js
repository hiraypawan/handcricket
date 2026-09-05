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
    const key = 'profile:' + user.toLowerCase().trim();
    const raw = await ctx.env.KV.get(key);
    if (!raw) return new Response(JSON.stringify({ profile: null }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    return new Response(JSON.stringify({ profile: JSON.parse(raw) }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
};

export const onRequestPost = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const { user, stats, avatar } = body;
    if (!user) return new Response(JSON.stringify({ error: 'Missing user' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    const key = 'profile:' + user.toLowerCase().trim();
    const existing = await ctx.env.KV.get(key);
    const profile = existing ? JSON.parse(existing) : {};
    if (stats) profile.stats = stats;
    if (avatar) profile.avatar = avatar;
    profile.name = user;
    profile.updatedAt = Date.now();
    await ctx.env.KV.put(key, JSON.stringify(profile));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
