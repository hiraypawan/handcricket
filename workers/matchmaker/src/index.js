/* handcricket-matchmaker — tiny Worker owning the Matchmaker Durable Object.
   Pages projects cannot define DO classes, so this Worker hosts it; the
   game reaches it over plain HTTPS (see MATCHMAKER_URL in
   functions/api/quickmatch.js). No binding setup needed on either side. */
export { Matchmaker } from "../../../lib/api/matchmaker-do.js";

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "POST" && url.pathname === "/match") {
        const stub = env.MATCHMAKER.get(
          env.MATCHMAKER.idFromName("quickmatch-global"),
        );
        return stub.fetch(request);
      }
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
    return new Response("handcricket matchmaker — use POST /api/quickmatch", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
};
