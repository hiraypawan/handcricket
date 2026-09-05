import { cors, json } from '../../lib/api/shared.js';

/* SPECTATE — watch a live match without joining it.
   The HOST publishes a lightweight snapshot (score, overs, last balls);
   spectators poll it. No sockets, no realtime channel — 3s polling over KV.
   Keys expire on their own, so a finished match vanishes within a minute
   with zero cleanup code.
     POST {action:'publish', room, snap}        — host, every few balls
     POST {action:'ping', room, name}           — spectator heartbeat
     POST {action:'comment', room, name, text}  — spectator chat (<=48 chars)
     GET  ?room=                                 — {snap, comments, watchers}
   The room CODE is the only secret — never list rooms. */
const snapKey = (r) => 'spectate:' + String(r || '').toUpperCase().slice(0, 16);
const chatKey = (r) => 'spectate:' + String(r || '').toUpperCase().slice(0, 16) + ':chat';
const watchKey = (r) => 'spectate:' + String(r || '').toUpperCase().slice(0, 16) + ':watch';

export const onRequestGet = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const url = new URL(ctx.request.url);
    const room = url.searchParams.get('room');
    if (!room) return json({ error: 'Missing room' }, 400);
    const KV = ctx.env.KV;
    const [snapRaw, chatRaw, watchRaw] = await Promise.all([
      KV.get(snapKey(room)),
      KV.get(chatKey(room)),
      KV.get(watchKey(room)),
    ]);
    let comments = [];
    try {
      const arr = chatRaw ? JSON.parse(chatRaw) : [];
      if (Array.isArray(arr)) comments = arr.slice(-20);
    } catch (e) { /* ignore */ }
    let watchers = [];
    try {
      const map = watchRaw ? JSON.parse(watchRaw) : {};
      const now = Date.now();
      watchers = Object.keys(map || {}).filter((n) => now - (map[n] || 0) < 30000);
    } catch (e) { /* ignore */ }
    return json({
      snap: snapRaw ? JSON.parse(snapRaw) : null,
      comments,
      watchers,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const body = await ctx.request.json();
    const { action, room, name, snap, text } = body;
    if (!room || !action) return json({ error: 'Missing params' }, 400);
    const KV = ctx.env.KV;

    if (action === 'publish') {
      if (!snap || typeof snap !== 'object') return json({ error: 'Missing snap' }, 400);
      await KV.put(snapKey(room), JSON.stringify({ ...snap, ts: Date.now() }), {
        expirationTtl: 45,
      });
      return json({ ok: true });
    }

    if (action === 'ping') {
      if (!name) return json({ error: 'Missing name' }, 400);
      let map = {};
      try {
        map = JSON.parse((await KV.get(watchKey(room))) || '{}') || {};
      } catch (e) { map = {}; }
      map[String(name).slice(0, 24)] = Date.now();
      await KV.put(watchKey(room), JSON.stringify(map), { expirationTtl: 40 });
      return json({ ok: true });
    }

    if (action === 'comment') {
      if (!name) return json({ error: 'Missing name' }, 400);
      const clean = String(text || '').slice(0, 48).trim();
      if (!clean) return json({ error: 'Empty comment' }, 400);
      let arr = [];
      try {
        const raw = await KV.get(chatKey(room));
        arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) arr = [];
      } catch (e) { arr = []; }
      arr.push({ name: String(name).slice(0, 24), text: clean, ts: Date.now() });
      await KV.put(chatKey(room), JSON.stringify(arr.slice(-20)), {
        expirationTtl: 180,
      });
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
