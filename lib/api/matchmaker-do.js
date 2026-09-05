/* MATCHMAKER DURABLE OBJECT — the strongly-consistent rendezvous.
   Every request worldwide routes to ONE instance, so all seekers share one
   in-memory pool with zero replication lag (Cloudflare KV reads can serve
   up to 60s-stale values per location — structurally fatal for a ~25s
   matchmaking window). Entries carry their own timestamps and are pruned
   lazily, so an isolate restart simply drops stale seekers who re-seek on
   their next 2s poll. Ops events mirror to KV when bound (best-effort). */
import { DurableObject } from "cloudflare:workers";
import { handleQuickmatch, EVENTS_KEY } from "./qm-core.js";

export class Matchmaker extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.mem = new Map();
  }

  async fetch(request) {
    const mem = this.mem;
    const store = {
      get: async (k) => (mem.has(k) ? mem.get(k) : null),
      put: async (k, v) => void mem.set(k, v),
      delete: async (k) => void mem.delete(k),
    };
    const log = async (evt, extra) => {
      try {
        const KV = this.env && this.env.KV;
        if (!KV) return;
        const raw = await KV.get(EVENTS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(Object.assign({ t: Date.now(), evt }, extra || {}));
        await KV.put(EVENTS_KEY, JSON.stringify(arr.slice(-80)), {
          expirationTtl: 3600,
        });
      } catch (e) { /* diagnostics never break matching */ }
    };
    try {
      const body = await request.json();
      const out = await handleQuickmatch(store, log, body);
      return Response.json(out.body, { status: out.code || 200 });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }
}
