import {
  corsHeaders,
  json,
  cors,
  normName,
  profileKey,
  checkOwner,
  updateLeaderboardIndex,
  verifyGoogleIdToken,
  GOOGLE_CLIENT_ID_FALLBACK,
} from '../../lib/api/shared.js';

/* GET stays public — a friend's career is meant to be viewable.
   POST now requires the claiming device's token, so nobody can inflate
   someone else's row on the leaderboard. */
export const onRequestGet = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const url = new URL(ctx.request.url);
    const user = url.searchParams.get('user');
    if (!user) return json({ error: 'Missing user' }, 400);
    const raw = await ctx.env.KV.get(profileKey(user));
    if (!raw) return json({ profile: null });
    const profile = JSON.parse(raw);
    delete profile.token; // never leak the ownership secret
    return json({ profile });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestPost = async (ctx) => {
  try {
    if (!ctx.env || !ctx.env.KV)
      return json({ error: 'Server storage is not configured yet', degraded: true }, 503);
    const body = await ctx.request.json();
    const { user, stats, avatar, token, idToken } = body;

    /* Google lookup: which in-game names are linked to this Google subject?
       Lets a fresh device re-adopt its in-game name instead of the Google
       account name. Verified token required; answer reveals only names the
       caller proved ownership of via Google. */
    if (body.action === 'lookup') {
      const aud =
        (ctx.env && ctx.env.HC_GOOGLE_CLIENT_ID) || GOOGLE_CLIENT_ID_FALLBACK;
      let sub = null;
      if (idToken && aud) {
        try {
          const v = await verifyGoogleIdToken(idToken, aud, ctx.env.KV);
          if (v.ok) sub = v.sub;
        } catch (e) { /* fall through to 401 */ }
      }
      if (!sub) return json({ error: 'Bad token' }, 401);
      let names = [];
      try {
        const raw = await ctx.env.KV.get('google:' + sub);
        const rec = raw ? JSON.parse(raw) : null;
        if (rec && Array.isArray(rec.names)) names = rec.names.slice(-5);
      } catch (e) { /* none linked yet */ }
      return json({ names });
    }

    if (!user) return json({ error: 'Missing user' }, 400);

    /* Optional Google link: a verified subject can reclaim its own career
       on a new device even with a fresh device token. */
    let gsub = null;
    const aud =
      (ctx.env && ctx.env.HC_GOOGLE_CLIENT_ID) || GOOGLE_CLIENT_ID_FALLBACK;
    if (idToken && aud) {
      try {
        const v = await verifyGoogleIdToken(idToken, aud, ctx.env.KV);
        if (v.ok) gsub = v.sub;
      } catch (e) { /* anonymous fallback below */ }
    }

    let own = await checkOwner(ctx.env.KV, user, token);
    if (!own.ok && gsub) {
      try {
        const raw = await ctx.env.KV.get(profileKey(user));
        const p = raw ? JSON.parse(raw) : null;
        if (p && p.googleSub === gsub) {
          own = { ok: true, profile: p, key: profileKey(user) };
        }
      } catch (e) { /* keep the original denial */ }
    }
    if (!own.ok) {
      return json({ error: own.error, recoverable: !!own.recoverable }, own.status);
    }

    const key = own.key || profileKey(user);
    const profile = own.profile || {};
    if (stats) profile.stats = stats;
    if (avatar) profile.avatar = avatar;
    if (gsub) profile.googleSub = gsub;
    profile.name = user;
    profile.token = token;
    profile.updatedAt = Date.now();

    await ctx.env.KV.put(key, JSON.stringify(profile));
    /* Maintain sub -> in-game-names so a new device can find its name. */
    if (gsub) {
      try {
        const gk = 'google:' + gsub;
        const graw = await ctx.env.KV.get(gk);
        const grec = graw ? JSON.parse(graw) : null;
        const list = grec && Array.isArray(grec.names) ? grec.names : [];
        const low = String(user).toLowerCase();
        const kept = list.filter((n) => String(n).toLowerCase() !== low);
        kept.push(user);
        await ctx.env.KV.put(
          gk,
          JSON.stringify({ names: kept.slice(-5), updatedAt: Date.now() }),
        );
      } catch (e) { /* index is best-effort */ }
    }
    await updateLeaderboardIndex(ctx.env.KV, normName(user), profile);

    return json({ ok: true, token: profile.token });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
export { corsHeaders };
