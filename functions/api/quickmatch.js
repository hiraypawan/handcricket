import { cors, corsHeaders, json } from '../../lib/api/shared.js';
import { handleQuickmatch } from '../../lib/api/qm-core.js';

/* QUICK MATCHMAKING route — thin proxy with KV fallback.
   Preferred path: the Matchmaker Durable Object (single global instance, so
   every seeker shares one live pool with zero replication lag). If the DO
   binding is absent or errors, the same core runs against KV inline — solo
   and same-network pairing keep working, cross-network may lag. */
export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    let body = null;
    try {
      body = await ctx.request.json();
    } catch (e) {
      return json({ error: 'Missing params' }, 400);
    }
    if (ctx.env.MATCHMAKER) {
      try {
        const stub = ctx.env.MATCHMAKER.get(
          ctx.env.MATCHMAKER.idFromName('quickmatch-global'),
        );
        const r = await stub.fetch(
          new Request('https://do/quickmatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        );
        return new Response(await r.text(), {
          status: r.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) { /* fall through to KV core */ }
    }
    const KV = ctx.env.KV;
    const store = {
      get: (k) => KV.get(k),
      put: (k, v, opts) => KV.put(k, v, opts),
      delete: (k) => KV.delete(k),
    };
    const log = async (evt, extra) => {
      try {
        const raw = await KV.get('quick:events');
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(Object.assign({ t: Date.now(), evt }, extra || {}));
        await KV.put('quick:events', JSON.stringify(arr.slice(-80)), {
          expirationTtl: 3600,
        });
      } catch (e) { /* diagnostics never break matching */ }
    };
    const out = await handleQuickmatch(store, log, body);
    return json(out.body, out.code || 200);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
