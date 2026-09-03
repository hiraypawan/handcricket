const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFriends(KV, user) {
  const key = 'friends:' + user.toLowerCase().trim();
  const raw = await KV.get(key);
  if (!raw) return { friends: [], pending: [], challenges: [] };
  try { return JSON.parse(raw); } catch(e) { return { friends: [], pending: [], challenges: [] }; }
}

async function saveFriends(KV, user, data) {
  const key = 'friends:' + user.toLowerCase().trim();
  await KV.put(key, JSON.stringify(data));
}

export const onRequestGet = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const user = url.searchParams.get('user');
    if (!user) return new Response(JSON.stringify({ error: 'Missing user' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    const data = await getFriends(ctx.env.KV, user);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
};

export const onRequestPost = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const { action, user, target, targetStats, isBot } = body;
    if (!user || !action) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

    const KV = ctx.env.KV;
    const userData = await getFriends(KV, user);
    const now = Date.now();

    if (action === 'add') {
      const alreadyFriend = userData.friends.some(f => f.name.toLowerCase() === target.toLowerCase());
      const alreadyPending = userData.pending.some(f => f.name.toLowerCase() === target.toLowerCase());
      if (alreadyFriend) return new Response(JSON.stringify({ ok: true, msg: 'Already friends' }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      if (alreadyPending) return new Response(JSON.stringify({ ok: true, msg: 'Request already pending' }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      if (isBot) {
        userData.friends.push({ name: target, stats: targetStats || null, since: now, isBot: true });
        await saveFriends(KV, user, userData);
        return new Response(JSON.stringify({ ok: true, autoAccepted: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const targetData = await getFriends(KV, target);
      targetData.pending.push({ name: user, stats: targetStats || null, since: now });
      await saveFriends(KV, target, targetData);
      return new Response(JSON.stringify({ ok: true, sent: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'accept') {
      const reqIdx = userData.pending.findIndex(f => f.name.toLowerCase() === target.toLowerCase());
      if (reqIdx === -1) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const req = userData.pending.splice(reqIdx, 1)[0];
      userData.friends.push({ name: req.name, stats: req.stats, since: now, isBot: req.isBot || false });
      await saveFriends(KV, user, userData);

      const targetData = await getFriends(KV, target);
      const alreadyFriend = targetData.friends.some(f => f.name.toLowerCase() === user.toLowerCase());
      if (!alreadyFriend) {
        const profileRaw = await KV.get('profile:' + user.toLowerCase().trim());
        const myStats = profileRaw ? JSON.parse(profileRaw).stats : null;
        targetData.friends.push({ name: user, stats: myStats, since: now, isBot: false });
        await saveFriends(KV, target, targetData);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'reject') {
      userData.pending = userData.pending.filter(f => f.name.toLowerCase() !== target.toLowerCase());
      await saveFriends(KV, user, userData);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'remove') {
      userData.friends = userData.friends.filter(f => f.name.toLowerCase() !== target.toLowerCase());
      await saveFriends(KV, user, userData);
      const targetData = await getFriends(KV, target);
      targetData.friends = targetData.friends.filter(f => f.name.toLowerCase() !== user.toLowerCase());
      await saveFriends(KV, target, targetData);
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
