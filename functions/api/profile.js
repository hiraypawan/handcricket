import {
  corsHeaders,
  json,
  cors,
  normName,
  profileKey,
  checkOwner,
  updateLeaderboardIndex,
} from '../../lib/api/shared.js';

/* GET stays public — a friend's career is meant to be viewable.
   POST now requires the claiming device's token, so nobody can inflate
   someone else's row on the leaderboard. */
export const onRequestGet = async (ctx) => {
  try {
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
    const body = await ctx.request.json();
    const { user, stats, avatar, token } = body;
    if (!user) return json({ error: 'Missing user' }, 400);

    const own = await checkOwner(ctx.env.KV, user, token);
    if (!own.ok) {
      return json({ error: own.error, recoverable: !!own.recoverable }, own.status);
    }

    const key = own.key || profileKey(user);
    const profile = own.profile || {};
    if (stats) profile.stats = stats;
    if (avatar) profile.avatar = avatar;
    profile.name = user;
    profile.token = token;
    profile.updatedAt = Date.now();

    await ctx.env.KV.put(key, JSON.stringify(profile));
    await updateLeaderboardIndex(ctx.env.KV, normName(user), profile);

    return json({ ok: true, token: profile.token });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
};

export const onRequestOptions = cors;
export { corsHeaders };
