export onRequestPost = async (ctx) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await ctx.request.json();
    const { user, data } = body;

    if (!user || typeof user !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing or invalid data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const key = 'story:' + user.toLowerCase().trim();
    const value = JSON.stringify(data);

    await ctx.env.KV.put(key, value);

    return new Response(JSON.stringify({ ok: true, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Save failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

export onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
