import { cors, json } from '../../lib/api/shared.js';

/* QUICK MATCHMAKING — real players first, bot fallback after.
   POST {action:'seek'|'poll'|'leave', user, teamSize}
   - seek: (re)registers the seeker for 20s and tries an immediate match.
   - poll: keep-alive + check whether a match was made for me.
   - leave: drop out of the pool.
   Matching prefers the same teamSize; a seeker waiting >6s accepts any
   size (and adopts the other side's format). The earlier seeker hosts.
   Matches are one-shot reads: the first poll that sees one consumes it. */
const POOL_KEY = 'quick:pool';
const matchKey = (u) => 'quick:match:' + String(u || '').toLowerCase().trim().slice(0, 24);
const SEEK_TTL_MS = 20000;

async function readPool(KV) {
  try {
    const raw = await KV.get(POOL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function prune(pool) {
  const now = Date.now();
  return pool.filter((s) => s && s.user && now - (s.ts || 0) < SEEK_TTL_MS);
}

function roomId() {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/* Deterministic room for a pair: two concurrent polls that both decide to
   match the same two seekers MUST converge on the same room, or the guest
   joins a room nobody hosts ("Room not found" forever). Same pair + same
   seek timestamps => same room, same roles, harmless double-write. */
function roomFor(a, b, tsA, tsB) {
  const pair = [a.toLowerCase(), b.toLowerCase()].sort().join('|') + '|' + Math.min(tsA, tsB);
  let h = 2166136261;
  for (let i = 0; i < pair.length; i++) {
    h ^= pair.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const C = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  let x = h >>> 0;
  for (let i = 0; i < 6; i++) {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    s += C[x % C.length];
  }
  return s;
}

async function readMatch(KV, user) {
  try {
    const raw = await KV.get(matchKey(user));
    if (!raw) return null;
    const m = JSON.parse(raw);
    return m && m.room ? m : null;
  } catch (e) {
    return null;
  }
}

async function tryMatch(KV, pool, me) {
  const now = Date.now();
  const mine = pool.find((s) => s.user.toLowerCase() === me.toLowerCase());
  if (!mine) return null;
  const waited = now - (mine.ts || now);
  const relaxed = waited > 6000;
  const others = pool
    .filter((s) => s.user.toLowerCase() !== me.toLowerCase())
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const peer =
    others.find((s) => Number(s.teamSize) === Number(mine.teamSize)) ||
    (relaxed ? others[0] : null);
  if (!peer) return null;
  /* Adopt, don't duplicate: if either side already holds a match record for
     THIS pair, return my side of it instead of minting a second room. */
  const peerRec = await readMatch(KV, peer.user);
  if (
    peerRec &&
    peerRec.opp &&
    peerRec.opp.toLowerCase() === me.toLowerCase() &&
    now - (peerRec.ts || 0) < 30000
  ) {
    const mineIsHost = peerRec.role !== 'host';
    return {
      room: peerRec.room,
      opp: peer.user,
      role: mineIsHost ? 'host' : 'guest',
      teamSize: peerRec.teamSize || mine.teamSize,
    };
  }
  const hostFirst = (peer.ts || 0) <= (mine.ts || 0);
  const room = roomFor(mine.user, peer.user, mine.ts || 0, peer.ts || 0);
  const hostRec = {
    room,
    opp: hostFirst ? mine.user : peer.user,
    role: 'host',
    teamSize: Number(hostFirst ? peer.teamSize : mine.teamSize) || 1,
    ts: now,
  };
  const guestRec = {
    room,
    opp: hostFirst ? peer.user : mine.user,
    role: 'guest',
    teamSize: hostRec.teamSize,
    ts: now,
  };
  const rest = pool.filter(
    (s) =>
      s.user.toLowerCase() !== me.toLowerCase() &&
      s.user.toLowerCase() !== peer.user.toLowerCase(),
  );
  await KV.put(POOL_KEY, JSON.stringify(rest));
  await KV.put(matchKey(hostFirst ? peer.user : mine.user), JSON.stringify(hostRec), {
    expirationTtl: 120,
  });
  await KV.put(matchKey(hostFirst ? mine.user : peer.user), JSON.stringify(guestRec), {
    expirationTtl: 120,
  });
  return hostFirst ? guestRec : hostRec;
}

export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const body = await ctx.request.json();
    const { action, user, teamSize } = body;
    if (!user || !action) return json({ error: 'Missing params' }, 400);
    const KV = ctx.env.KV;
    const me = String(user).trim().slice(0, 24);

    if (action === 'leave') {
      const pool = prune(await readPool(KV)).filter(
        (s) => s.user.toLowerCase() !== me.toLowerCase(),
      );
      await KV.put(POOL_KEY, JSON.stringify(pool));
      return json({ ok: true });
    }

    if (action === 'seek' || action === 'poll') {
      // collect a consumed match first (one-shot read)
      try {
        const raw = await KV.get(matchKey(me));
        if (raw) {
          await KV.delete(matchKey(me));
          const m = JSON.parse(raw);
          if (m && m.room) return json({ status: 'matched', room: m.room, opp: m.opp, role: m.role, teamSize: m.teamSize });
        }
      } catch (e) { /* fall through to pool */ }
      let pool = prune(await readPool(KV));
      const ix = pool.findIndex((s) => s.user.toLowerCase() === me.toLowerCase());
      const rec = { user: me, teamSize: Number(teamSize) || 1, ts: Date.now() };
      if (ix >= 0) pool[ix] = rec;
      else pool.push(rec);
      await KV.put(POOL_KEY, JSON.stringify(pool.slice(-50)));
      const m = await tryMatch(KV, pool, me);
      if (m) return json({ status: 'matched', room: m.room, opp: m.opp, role: m.role, teamSize: m.teamSize });
      return json({ status: 'waiting' });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
