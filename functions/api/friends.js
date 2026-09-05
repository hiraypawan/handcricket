import { checkOwner } from '../../lib/api/shared.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const EMPTY = () => ({ friends: [], pending: [], challenges: [] });

async function getFriends(KV, user) {
  const key = 'friends:' + user.toLowerCase().trim();
  const raw = await KV.get(key);
  if (!raw) return EMPTY();
  try {
    const d = JSON.parse(raw);
    return {
      friends: Array.isArray(d.friends) ? d.friends : [],
      pending: Array.isArray(d.pending) ? d.pending : [],
      challenges: Array.isArray(d.challenges) ? d.challenges : [],
    };
  } catch (e) { return EMPTY(); }
}

async function saveFriends(KV, user, data) {
  const key = 'friends:' + user.toLowerCase().trim();
  await KV.put(key, JSON.stringify(data));
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const sameName = (a, b) => String(a || '').toLowerCase().trim() === String(b || '').toLowerCase().trim();

/* The requester's own career numbers, so the recipient's list shows a real
   profile instead of a null snapshot. Client may pass it; KV is the fallback. */
async function statsFor(KV, user, provided) {
  if (provided && typeof provided === 'object') return provided;
  const raw = await KV.get('profile:' + user.toLowerCase().trim());
  if (!raw) return null;
  try { return JSON.parse(raw).stats || null; } catch (e) { return null; }
}

export const onRequestGet = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const user = url.searchParams.get('user');
    if (!user) return json({ error: 'Missing user' }, 400);
    const data = await getFriends(ctx.env.KV, user);

    /* A friend's stats are a snapshot taken when the link was made, so a player
       who had no career yet stays "Newcomer" forever. Backfill from their live
       profile record (bounded, so a big list cannot fan out into 100 reads). */
    let budget = 10;
    for (const f of data.friends) {
      if (budget <= 0) break;
      if (f.stats || !f.name) continue;
      budget--;
      const live = await statsFor(ctx.env.KV, f.name, null);
      if (live) f.stats = live;
    }
    return json(data);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestPost = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const { action, user, target, targetStats, isBot, data, token } = body;
    if (!user || !action) return json({ error: 'Missing params' }, 400);

    /* Ownership gate. Without this anyone could POST
       {action:'remove', user:'alice', target:'bob'} and silently delete a
       friendship that belongs to two other people. */
    const own = await checkOwner(ctx.env.KV, user, token);
    if (!own.ok) {
      return json({ error: own.error, recoverable: !!own.recoverable }, own.status);
    }

    const KV = ctx.env.KV;
    const userData = await getFriends(KV, user);
    const now = Date.now();

    /* ---- ADD: writes the request into the TARGET's record, so a real
       second device actually receives it. Bots auto-accept. ---- */
    if (action === 'add') {
      if (!target) return json({ error: 'Missing target' }, 400);
      const alreadyFriend = userData.friends.some(f => sameName(f.name, target));
      const alreadyPending = userData.pending.some(f => sameName(f.name, target));
      if (alreadyFriend) return json({ ok: true, msg: 'Already friends' });
      if (alreadyPending) return json({ ok: true, msg: 'Request already pending' });

      const myStats = await statsFor(KV, user, targetStats);

      if (isBot) {
        userData.friends.push({ name: target, stats: myStats, since: now, isBot: true });
        await saveFriends(KV, user, userData);
        return json({ ok: true, autoAccepted: true });
      }

      const targetData = await getFriends(KV, target);
      // do not stack duplicate requests
      targetData.pending = targetData.pending.filter(f => !sameName(f.name, user));
      targetData.pending.push({ name: user, stats: myStats, since: now });
      await saveFriends(KV, target, targetData);
      // mirror the "sent" state on the sender so both screens agree
      userData.pending.push({ name: target, stats: null, since: now, sent: true });
      await saveFriends(KV, user, userData);
      return json({ ok: true, sent: true });
    }

    /* ---- ACCEPT: links BOTH sides, pulling each player's live stats ---- */
    if (action === 'accept') {
      if (!target) return json({ error: 'Missing target' }, 400);
      const reqIdx = userData.pending.findIndex(f => sameName(f.name, target));
      if (reqIdx === -1) return json({ error: 'Request not found' }, 404);
      const req = userData.pending.splice(reqIdx, 1)[0];
      const theirStats = await statsFor(KV, target, req.stats);
      userData.friends = userData.friends.filter(f => !sameName(f.name, target));
      userData.friends.push({ name: req.name, stats: theirStats, since: now, isBot: req.isBot || false });
      await saveFriends(KV, user, userData);

      if (!req.isBot) {
        const targetData = await getFriends(KV, target);
        targetData.pending = targetData.pending.filter(f => !sameName(f.name, user));
        const alreadyFriend = targetData.friends.some(f => sameName(f.name, user));
        if (!alreadyFriend) {
          const myStats = await statsFor(KV, user, null);
          targetData.friends.push({ name: user, stats: myStats, since: now, isBot: false });
        }
        await saveFriends(KV, target, targetData);
      }
      return json({ ok: true });
    }

    /* ---- REJECT: clears the request on both sides ---- */
    if (action === 'reject') {
      if (!target) return json({ error: 'Missing target' }, 400);
      userData.pending = userData.pending.filter(f => !sameName(f.name, target));
      await saveFriends(KV, user, userData);
      const targetData = await getFriends(KV, target);
      targetData.pending = targetData.pending.filter(f => !sameName(f.name, user));
      await saveFriends(KV, target, targetData);
      return json({ ok: true });
    }

    /* ---- REMOVE: unfriends on both sides ---- */
    if (action === 'remove') {
      if (!target) return json({ error: 'Missing target' }, 400);
      userData.friends = userData.friends.filter(f => !sameName(f.name, target));
      userData.pending = userData.pending.filter(f => !sameName(f.name, target));
      await saveFriends(KV, user, userData);
      const targetData = await getFriends(KV, target);
      targetData.friends = targetData.friends.filter(f => !sameName(f.name, user));
      await saveFriends(KV, target, targetData);
      return json({ ok: true });
    }

    /* ---- SYNC (legacy client contract): union-merge the caller's local
       lists into the server record instead of 400ing. Server-only entries
       (requests another device received) are preserved. ---- */
    if (action === 'sync') {
      const incoming = data && typeof data === 'object' ? data : {};
      const merge = (serverList, localList) => {
        const out = [];
        const seen = new Set();
        [...(serverList || []), ...(localList || [])].forEach((f) => {
          if (!f || !f.name) return;
          const k = f.name.toLowerCase().trim();
          if (seen.has(k)) return;
          seen.add(k);
          out.push(f);
        });
        return out;
      };
      userData.friends = merge(userData.friends, incoming.friends);
      userData.pending = merge(userData.pending, incoming.pending);
      await saveFriends(KV, user, userData);
      return json({ ok: true, merged: true, friends: userData.friends.length, pending: userData.pending.length });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
