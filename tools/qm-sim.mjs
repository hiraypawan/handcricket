/* Quick-match pairing simulation: boots the REAL server handler against a
   fake KV and asserts seekers converge — including the nasty cases:
   - two guests both called "Player" (same display name, different devices)
   - near-simultaneous polls from both sides (interleaved like real races)
   - one-shot consumption (second poll must not re-match)
   Run: node tools/qm-sim.mjs (also chained in `npm test`)
*/
import { onRequestPost as qm } from "../functions/api/quickmatch.js";

const store = new Map();
const KV = {
  get: async (k) => (store.has(k) ? store.get(k) : null),
  put: async (k, v) => void store.set(k, v),
  delete: async (k) => void store.delete(k),
};
const ctx = (body) => ({
  env: { KV },
  request: { json: async () => body },
});
const post = async (body) => (await qm(ctx(body))).json();

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
};

// 1. two guests, SAME display name, different devices
store.clear();
await post({ action: "seek", user: "Player", cid: "devA", teamSize: 1 });
await post({ action: "seek", user: "Player", cid: "devB", teamSize: 1 });
const [a, b] = await Promise.all([
  post({ action: "poll", user: "Player", cid: "devA", teamSize: 1 }),
  post({ action: "poll", user: "Player", cid: "devB", teamSize: 1 }),
]);
check(
  "same-name guests pair",
  a.status === "matched" &&
    b.status === "matched" &&
    a.room === b.room &&
    ((a.role === "host" && b.role === "guest") ||
      (a.role === "guest" && b.role === "host")),
  `A=${a.status}/${a.role} B=${b.status}/${b.role} roomA=${a.room} roomB=${b.room}`,
);

// 2. near-simultaneous polls, distinct names
store.clear();
await post({ action: "seek", user: "Asha", cid: "ca", teamSize: 1 });
await post({ action: "seek", user: "Dev", cid: "cb", teamSize: 1 });
const [c, d] = await Promise.all([
  post({ action: "poll", user: "Asha", cid: "ca", teamSize: 1 }),
  post({ action: "poll", user: "Dev", cid: "cb", teamSize: 1 }),
]);
check(
  "concurrent polls converge on one room",
  c.status === "matched" &&
    d.status === "matched" &&
    c.room === d.room &&
    c.opp === "Dev" &&
    d.opp === "Asha",
  `C=${c.room}/${c.role} D=${d.room}/${d.role}`,
);

// 3. one-shot: consumed records must not re-match
const c2 = await post({ action: "poll", user: "Asha", cid: "ca", teamSize: 1 });
check("consumed match does not re-fire", c2.status === "waiting", c2.status);

// 4. different formats wait (strict), then pair relaxed
store.clear();
await post({ action: "seek", user: "Solo1", cid: "s1", teamSize: 1 });
const solo = await post({ action: "poll", user: "Solo1", cid: "s1", teamSize: 1 });
check("lone seeker waits", solo.status === "waiting", solo.status);

console.log(failures === 0 ? "✅ QM-SIM: all checks passed" : `❌ QM-SIM: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
