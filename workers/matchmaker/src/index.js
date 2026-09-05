/* handcricket-matchmaker — tiny Worker whose only job is owning the
   Matchmaker Durable Object class (Pages projects cannot define DO
   classes). The game talks to it exclusively through the MATCHMAKER
   binding on the Pages side; see lib/api/matchmaker-do.js. */
export { Matchmaker } from "../../../lib/api/matchmaker-do.js";

export default {
  async fetch() {
    return new Response("handcricket matchmaker — use POST /api/quickmatch", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
};
