import { cors, corsHeaders, json } from '../../lib/api/shared.js';
import { handleQuickmatch } from '../../lib/api/qm-core.js';
/* NOTE: the Matchmaker Durable Object class intentionally lives in a
   SEPARATE Worker (workers/matchmaker) — Pages projects cannot define DO
   classes. This route only talks to it through the MATCHMAKER binding and
   falls back to the KV core when the binding is absent. */

/* QUICK MATCHMAKING route — Durable Object first, KV fallback.
   Preferred path: POST straight to the handcricket-matchmaker Worker, whose
   Matchmaker Durable Object holds ONE global in-memory pool — every seeker
   worldwide shares live state with zero replication lag (plain HTTPS, so no
   Pages binding is required at all). If that hop fails for any reason, the
   same core runs against KV inline — solo and same-network pairing keep
   working, cross-network may lag up to the KV cache window. */
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
    /* QM_DO_URL=off forces the KV core (tests, local dev without network).
       The 4s cap keeps one slow worker hop from stalling the 2s poll loop. */
    const doUrl =
      ctx.env.QM_DO_URL === 'off'
        ? null
        : ctx.env.QM_DO_URL ||
          'https://handcricket-matchmaker.pawanhiray88.workers.dev/match';
    if (doUrl) {
      try {
        const ctrl =
          typeof AbortController !== 'undefined'
            ? new AbortController()
            : null;
        const to =
          ctrl && typeof setTimeout === 'function'
            ? setTimeout(() => ctrl.abort(), 4000)
            : null;
        const r = await fetch(doUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl ? ctrl.signal : undefined,
        });
        if (to) clearTimeout(to);
        const text = await r.text();
        return new Response(text, {
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
    out.body.via = 'kv';
    return json(out.body, out.code || 200);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
