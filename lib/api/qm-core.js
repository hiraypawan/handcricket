/* QUICK-MATCH RENDEZVOUS CORE — runtime-agnostic (no imports, no globals).
   Runs against ANY async {get,put,delete} store:
   - Cloudflare KV (eventually consistent across colos — fine for solo play,
     unreliable for cross-device pairing inside a ~25s window), or
   - a Durable Object's in-memory Map (single global instance: every request
     worldwide sees the same state instantly — the correct rendezvous).
   Identity is the per-device cid, never the display name. Rooms are
   deterministic per pair so concurrent deciders converge. Matches are
   one-shot reads. */

export const POOL_KEY = 'quick:pool';
export const EVENTS_KEY = 'quick:events';
export const SEEK_TTL_MS = 20000;

export const matchKey = (id) =>
  'quick:match:' + String(id || '').toLowerCase().slice(0, 40);

/* Stable session id: per-device client id when present, else the name. */
export const sidOf = (s) =>
  String((s && s.cid) || ('name:' + ((s && s.user) || '')))
    .toLowerCase()
    .slice(0, 40);

export function roomFor(a, b, tsA, tsB) {
  const pair =
    [a.toLowerCase(), b.toLowerCase()].sort().join('|') +
    '|' +
    Math.min(tsA, tsB);
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

export async function readPool(store) {
  try {
    const raw = await store.get(POOL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function prune(pool, now) {
  const t = now || Date.now();
  return pool.filter((s) => s && s.user && t - (s.ts || 0) < SEEK_TTL_MS);
}

export async function readMatch(store, id) {
  try {
    const raw = await store.get(matchKey(id));
    if (!raw) return null;
    const m = JSON.parse(raw);
    return m && m.room ? m : null;
  } catch (e) {
    return null;
  }
}

/* Anonymous ops log (NO usernames). Best-effort: never break matching. */
export async function logEvent(store, evt, extra) {
  try {
    const raw = await store.get(EVENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(Object.assign({ t: Date.now(), evt }, extra || {}));
    await store.put(EVENTS_KEY, JSON.stringify(arr.slice(-80)));
  } catch (e) { /* diagnostics never break matching */ }
}

export async function tryMatch(store, pool, me, myCid, now) {
  const t = now || Date.now();
  const mySid = (myCid || 'name:' + me).toLowerCase().slice(0, 40);
  const mine = pool.find((s) => sidOf(s) === mySid);
  if (!mine) return null;
  const others = pool
    .filter((s) => sidOf(s) !== mySid)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  /* STRICT format rule: only the exact format pairs, never cross-format.
     Adopting another size silently produced "I picked 1v1 but got T20"
     matches — a 1v1 seeker plays 1v1 or a bot, full stop. */
  let peer = null;
  for (const cand of others) {
    const sameSize = Number(cand.teamSize) === Number(mine.teamSize);
    if (!sameSize) continue;
    const rec = await readMatch(store, sidOf(cand));
    const forMe = myCid
      ? rec && rec.oppCid === myCid
      : rec && rec.opp && rec.opp.toLowerCase() === me.toLowerCase();
    if (forMe) {
      if (t - (rec.ts || 0) < 30000) {
        const mineIsHost = rec.role !== 'host';
        return {
          room: rec.room,
          opp: cand.user,
          role: mineIsHost ? 'host' : 'guest',
          teamSize: rec.teamSize || mine.teamSize,
        };
      }
      continue;
    }
    if (rec && t - (rec.ts || 0) < 30000) continue;
    peer = cand;
    break;
  }
  if (!peer) return null;
  const hostFirst = (peer.ts || 0) <= (mine.ts || 0);
  const room = roomFor(sidOf(mine), sidOf(peer), mine.ts || 0, peer.ts || 0);
  const hostSid = hostFirst ? sidOf(peer) : mySid;
  const guestSid = hostFirst ? mySid : sidOf(peer);
  const hostRec = {
    room,
    opp: hostFirst ? mine.user : peer.user,
    oppCid: hostFirst ? mine.cid || null : peer.cid || null,
    role: 'host',
    teamSize: Number(hostFirst ? peer.teamSize : mine.teamSize) || 1,
    ts: t,
  };
  const guestRec = {
    room,
    opp: hostFirst ? peer.user : mine.user,
    oppCid: hostFirst ? peer.cid || null : mine.cid || null,
    role: 'guest',
    teamSize: hostRec.teamSize,
    ts: t,
  };
  const rest = pool.filter(
    (s) => sidOf(s) !== mySid && sidOf(s) !== sidOf(peer),
  );
  await store.put(POOL_KEY, JSON.stringify(rest));
  await store.put(matchKey(hostSid), JSON.stringify(hostRec));
  await store.put(matchKey(guestSid), JSON.stringify(guestRec));
  return hostFirst ? guestRec : hostRec;
}

/* Full request handler. Returns {code, body} — callers wrap as Response.
   log(info) is fire-and-forget diagnostics. */
export async function handleQuickmatch(store, log, body) {
  const { action, user, teamSize } = body || {};
  if (!action) return { code: 400, body: { error: 'Missing params' } };
  const me = String(user || '').trim().slice(0, 24);
  const cid = body.cid
    ? String(body.cid).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32) || null
    : null;
  const mySid = (cid || 'name:' + me).toLowerCase().slice(0, 40);

  if (action === 'leave') {
    if (!me) return { code: 400, body: { error: 'Missing params' } };
    const pool = prune(await readPool(store)).filter(
      (s) => sidOf(s) !== mySid,
    );
    await store.put(POOL_KEY, JSON.stringify(pool.slice(-50)));
    return { code: 200, body: { ok: true } };
  }

  if (action === 'joined') {
    if (!me) return { code: 400, body: { error: 'Missing params' } };
    const pool = prune(await readPool(store)).filter(
      (s) => sidOf(s) !== mySid,
    );
    await store.put(POOL_KEY, JSON.stringify(pool.slice(-50)));
    await log('joined', { size: Number(teamSize) || 0 });
    return { code: 200, body: { ok: true } };
  }

  if (action === 'seek' || action === 'poll') {
    /* Named real players only — blank guests can't pair or be displayed. */
    if (!me) return { code: 400, body: { error: 'Missing user' } };
    try {
      const raw = await store.get(matchKey(mySid));
      if (raw) {
        await store.delete(matchKey(mySid));
        const m = JSON.parse(raw);
        if (m && m.room) {
          await log('consumed', { role: m.role || '?' });
          return {
            code: 200,
            body: {
              status: 'matched',
              room: m.room,
              opp: m.opp,
              role: m.role,
              teamSize: m.teamSize,
            },
          };
        }
      }
    } catch (e) { /* fall through to pool */ }
    let pool = prune(await readPool(store));
    const ix = pool.findIndex((s) => sidOf(s) === mySid);
    const rec = { user: me, cid: cid || null, teamSize: Number(teamSize) || 1, ts: Date.now() };
    if (ix >= 0) pool[ix] = rec;
    else pool.push(rec);
    await store.put(POOL_KEY, JSON.stringify(pool.slice(-50)));
    if (action === 'seek') {
      await log('seek', {
        size: Number(teamSize) || 0,
        pool: pool.length,
        v: body.v || '?',
      });
    }
    const m = await tryMatch(store, pool, me, cid);
    if (m) {
      await log('matched', {
        role: m.role || '?',
        size: m.teamSize || 0,
        pool: pool.length,
      });
      return {
        code: 200,
        body: {
          status: 'matched',
          room: m.room,
          opp: m.opp,
          role: m.role,
          teamSize: m.teamSize,
        },
      };
    }
    return { code: 200, body: { status: 'waiting', seekers: pool.length } };
  }

  return { code: 400, body: { error: 'Unknown action' } };
}
