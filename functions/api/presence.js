import { cors, json } from '../../lib/api/shared.js';

/* PRESENCE — who is online right now, and what are they doing.
   Browsers heartbeat every 60s (and on important screens). Records expire
   after 150s, so a closed tab goes "last seen Xm ago" on its own.
   Body/Query: { user } for GET ?names=a,b ; { user, state, room } for POST.
   states: menu | seeking | playing | watching. `room` is only shared back
   to names the requester asked about (i.e. their friends) — never broadcast. */
const keyOf = (u) => 'presence:' + String(u || '').toLowerCase().trim().slice(0, 24);

export const onRequestGet = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const url = new URL(ctx.request.url);
    const names = String(url.searchParams.get('names') || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 30);
    const out = {};
    for (const n of names) {
      try {
        const raw = await ctx.env.KV.get(keyOf(n));
        out[n] = raw ? JSON.parse(raw) : { online: false, lastSeen: 0, state: 'offline' };
      } catch (e) {
        out[n] = { online: false, lastSeen: 0, state: 'offline' };
      }
    }
    return json({ presence: out });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const body = await ctx.request.json();
    const { user, state, room } = body;
    if (!user) return json({ error: 'Missing user' }, 400);
    const rec = {
      online: true,
      lastSeen: Date.now(),
      state: ['menu', 'seeking', 'playing', 'watching'].includes(state) ? state : 'menu',
      room: room ? String(room).slice(0, 16) : null,
    };
    await ctx.env.KV.put(keyOf(user), JSON.stringify(rec), { expirationTtl: 150 });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
