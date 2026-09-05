/* Shared helpers for Cloudflare Pages Functions.
   Lives outside functions/ so it is never exposed as a route — Pages turns
   every file under functions/ into an endpoint.

   OWNERSHIP MODEL
   There is no login. Each browser generates a random `token` once and keeps it
   in localStorage; the server stores the first token that claims a name and
   rejects later writes that don't match. That is not authentication — a
   determined attacker who guesses the name *and* gets there first still owns
   it — but it stops the two attacks that were actually trivial:

     POST /api/profile {user:"victim", stats:{wins:99999}}   -> now 403
     POST /api/friends {action:"remove", user:"a", target:"b"} -> now 403

   A profile that has not been updated for RECLAIM_MS can be re-claimed, so
   clearing localStorage does not lock a player out of their own career
   forever. */

export const RECLAIM_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      /* Dynamic API data (leaderboard, profiles, friends) must never be
         served stale from a browser/proxy cache. */
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });

export const cors = () => new Response(null, { status: 204, headers: corsHeaders });

/* True when the KV binding is missing (production project without storage
   attached). Endpoints must fail CLOSED with 503 + degraded:true instead of
   throwing TypeError into a bare 500 — the client falls back to local data. */
export const noKV = (ctx) => !ctx.env || !ctx.env.KV;

export const normName = (u) => String(u || '').toLowerCase().trim().slice(0, 24);
export const profileKey = (u) => 'profile:' + normName(u);

const isToken = (t) => typeof t === 'string' && /^[A-Za-z0-9]{16,64}$/.test(t);

/* Decide whether `token` may write `profile:<name>`.
   Returns { ok, profile } or { ok:false, status, error }. */
export async function checkOwner(KV, user, token) {
  if (!KV) return { ok: true, profile: null }; // KV not bound (local unit runs)
  const key = profileKey(user);
  const raw = await KV.get(key);
  let profile = null;
  if (raw) {
    try { profile = JSON.parse(raw); } catch (e) { profile = null; }
  }
  const owner = profile && profile.token;

  // Unclaimed name: first valid token to arrive adopts it.
  if (!owner) {
    if (!isToken(token)) {
      return { ok: false, status: 400, error: 'Missing player token' };
    }
    return { ok: true, profile, key };
  }

  if (owner === token) return { ok: true, profile, key };

  // Stale career -> allow the player back in instead of bricking it.
  const age = Date.now() - (profile.updatedAt || 0);
  if (age > RECLAIM_MS && isToken(token)) {
    return { ok: true, profile, key, reclaimed: true };
  }

  return {
    ok: false,
    status: 403,
    error: 'That profile is claimed by another device',
    recoverable: true,
  };
}

/* ------------------------------------------------------------------ *
 * LEADERBOARD INDEX
 * One KV key holds the sorted top 50, so a leaderboard request is a
 * single read instead of a list + a get per player (the old path burned
 * up to 500 reads per page view).
 * ------------------------------------------------------------------ */
export const LB_KEY = 'leaderboard:top';
const LB_SIZE = 50;

export const lbRow = (name, stats, updatedAt) => {
  const wins = Number(stats.wins) || 0;
  const matches = Number(stats.matches) || 0;
  return {
    name,
    wins,
    matches,
    losses: Number(stats.losses) || 0,
    runs: Number(stats.runs) || 0,
    highestScore: Number(stats.highestScore) || 0,
    winPct: matches ? Math.round((wins / matches) * 100) : 0,
    updatedAt: updatedAt || 0,
  };
};

const sortRows = (rows) =>
  rows.sort(
    (a, b) => b.wins - a.wins || b.winPct - a.winPct || a.name.localeCompare(b.name),
  );

/* Rewrite the top-50 index for one player. 1 get + 1 put. */
export async function updateLeaderboardIndex(KV, name, profile) {
  if (!KV) return null;
  const stats = profile && profile.stats;
  if (!stats || typeof stats !== 'object') return null;

  let idx = { rows: [], total: 0 };
  const raw = await KV.get(LB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rows)) idx = parsed;
    } catch (e) { /* rebuild from empty */ }
  }
  if (!Array.isArray(idx.rows)) idx.rows = [];

  const lower = name.toLowerCase();
  const had = idx.rows.some((r) => String(r.name).toLowerCase() === lower);
  idx.rows = idx.rows.filter((r) => String(r.name).toLowerCase() !== lower);

  const qualifies =
    (Number(stats.matches) || 0) > 0 && !stats.isPersona;
  if (qualifies) {
    idx.rows.push(lbRow(profile.name || name, stats, profile.updatedAt));
    if (!had) idx.total = (Number(idx.total) || 0) + 1;
  } else if (had) {
    idx.total = Math.max(0, (Number(idx.total) || 0) - 1);
  }

  sortRows(idx.rows);
  idx.rows = idx.rows.slice(0, LB_SIZE);
  idx.updatedAt = Date.now();

  await KV.put(LB_KEY, JSON.stringify(idx));
  return idx;
}

/* ------------------------------------------------------------------ *
 * GOOGLE ID-TOKEN VERIFICATION (optional sign-in)
 * Verifies a GIS credential against Google's JWKS so a player can reclaim
 * their career on a new device. Needs HC_GOOGLE_CLIENT_ID in env; without
 * it every token is rejected and the game stays anonymous-only. Certs are
 * cached in KV for 12h (memory fallback when KV is absent).
 * ------------------------------------------------------------------ */
/* Public OAuth Client ID fallback (matches 27-auth.js). The env var wins;
   this only lets token verification work before the dashboard var exists.
   Public value — never put the client SECRET anywhere in code. */
export const GOOGLE_CLIENT_ID_FALLBACK =
  "972270818286-73keh4u80nn5ll0pv9i2hk1nr1o7mf8i.apps.googleusercontent.com";

let __jwksCache = null;
function b64urlToBytes(s) {
  const b = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export async function verifyGoogleIdToken(idToken, clientId, KV) {
  try {
    if (!idToken || !clientId) return { ok: false };
    const parts = String(idToken).split('.');
    if (parts.length !== 3) return { ok: false };
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
    if (header.alg !== 'RS256' || !header.kid) return { ok: false };
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com')
      return { ok: false };
    if (payload.aud !== clientId) return { ok: false };
    if (!payload.exp || payload.exp * 1000 < Date.now() - 30000) return { ok: false };
    if (!payload.sub) return { ok: false };
    let jwks = __jwksCache && __jwksCache.exp > Date.now() ? __jwksCache.keys : null;
    if (!jwks && KV) {
      try {
        const raw = await KV.get('google:jwks');
        const c = raw ? JSON.parse(raw) : null;
        if (c && c.exp > Date.now() && Array.isArray(c.keys)) {
          jwks = c.keys;
          __jwksCache = c;
        }
      } catch (e) { /* refetch */ }
    }
    if (!jwks) {
      const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
      if (!r.ok) return { ok: false };
      const j = await r.json();
      jwks = j.keys || [];
      const entry = { keys: jwks, exp: Date.now() + 12 * 3600 * 1000 };
      __jwksCache = entry;
      if (KV) {
        try {
          await KV.put('google:jwks', JSON.stringify(entry), { expirationTtl: 43200 });
        } catch (e) { /* cache is best-effort */ }
      }
    }
    const jwk = (jwks || []).find((k) => k.kid === header.kid);
    if (!jwk) return { ok: false };
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), data);
    if (!ok) return { ok: false };
    return { ok: true, sub: String(payload.sub), name: payload.name || '', email: payload.email || '' };
  } catch (e) {
    return { ok: false };
  }
}

/* Drop a player from the index (used when a profile is reset). */
export async function dropFromLeaderboardIndex(KV, name) {
  if (!KV) return null;
  const raw = await KV.get(LB_KEY);
  if (!raw) return null;
  let idx;
  try { idx = JSON.parse(raw); } catch (e) { return null; }
  if (!idx || !Array.isArray(idx.rows)) return null;
  const lower = name.toLowerCase();
  const had = idx.rows.some((r) => String(r.name).toLowerCase() === lower);
  if (!had) return null;
  idx.rows = idx.rows.filter((r) => String(r.name).toLowerCase() !== lower);
  idx.total = Math.max(0, (Number(idx.total) || 0) - 1);
  idx.updatedAt = Date.now();
  await KV.put(LB_KEY, JSON.stringify(idx));
  return idx;
}
