/* ============================================================================
   FILE: public/js/26-spectate.js
   ROLE: SPECTATE MODE — watch live matches (real players via KV relay, bots
   simulated on-device). Host publishes a snapshot; spectators poll it. Eye
   icon + watcher count for the host; viewer sheet; preset comments both
   ways; bot spectators with canned lines. Depends on: G (03) at call-time.
============================================================================ */

/* ---------- shared ---------- */
async function specApi(action, extra) {
  try {
    const r = await fetch("/api/spectate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action }, extra || {})),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

/* ---------- spectator side ---------- */
let specTimer = null;
let specRoom = null;
let specSeenTs = 0;
const SPEC_PRESETS = [
  "Nice shot!",
  "What a ball!",
  "So close!",
  "Come on!",
  "Unbelievable!",
  "Good luck both!",
];
window.hcSpectate = async function (room, viaName) {
  if (!room) {
    toast("No live match to watch right now", "warn");
    return;
  }
  specStop(true);
  specRoom = String(room).toUpperCase().slice(0, 16);
  specSeenTs = 0;
  document
    .querySelectorAll(".overlay,.friends-overlay")
    .forEach((o) => o.classList.add("hidden"));
  if ($("storyHome")) $("storyHome").classList.add("hidden");
  if (typeof hideDock === "function") hideDock();
  $("specVs").textContent = viaName ? "via " + viaName : "room " + specRoom;
  $("specScore").textContent = "Connecting...";
  $("specMeta").textContent = "";
  $("specComments").innerHTML = "";
  const pr = $("specPresets");
  pr.innerHTML = "";
  SPEC_PRESETS.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "qmsg-btn";
    b.textContent = t;
    b.onclick = () => specComment(t);
    pr.appendChild(b);
  });
  $("spectateOverlay").classList.remove("hidden");
  if (typeof window.hcPresenceSet === "function")
    window.hcPresenceSet("watching", specRoom);
  try {
    await specApi("ping", { room: specRoom, name: getUsername() || "Guest" });
  } catch (e) {}
  await specTick();
  specTimer = setInterval(specTick, 3000);
};
async function specTick() {
  if (!specRoom) return;
  try {
    await specApi("ping", { room: specRoom, name: getUsername() || "Guest" });
  } catch (e) {}
  let d = null;
  try {
    const r = await fetch("/api/spectate?room=" + encodeURIComponent(specRoom));
    if (r.ok) d = await r.json();
  } catch (e) {}
  if (!specRoom) return;
  if (!d || !d.snap) {
    $("specScore").textContent = "Waiting for the host...";
    return;
  }
  const s = d.snap;
  const fmt = (p) => (p ? p.s + "/" + p.w + " (" + p.b + ")" : "-");
  $("specScore").textContent = fmt(s.a) + "  vs  " + fmt(s.b);
  $("specMeta").textContent =
    "Over " + (s.ov || "0.0") + (s.msg ? " · " + s.msg : "");
  const box = $("specComments");
  (d.comments || []).forEach((c) => {
    if (c.ts > specSeenTs) {
      const div = document.createElement("div");
      div.className = "float-msg";
      div.textContent = c.name + ": " + c.text;
      box.appendChild(div);
      while (box.children.length > 12) box.removeChild(box.firstChild);
    }
  });
  if (d.comments && d.comments.length)
    specSeenTs = Math.max.apply(
      null,
      d.comments.map((c) => c.ts || 0).concat([specSeenTs]),
    );
  box.scrollTop = box.scrollHeight;
}
async function specComment(text) {
  if (!specRoom) return;
  const t = String(text || "").slice(0, 48);
  if (!t) return;
  await specApi("comment", {
    room: specRoom,
    name: getUsername() || "Guest",
    text: t,
  });
  await specTick();
}
function specStop(silent) {
  if (specTimer) {
    clearInterval(specTimer);
    specTimer = null;
  }
  specRoom = null;
  const ov = $("spectateOverlay");
  if (ov) ov.classList.add("hidden");
  if (typeof window.hcPresenceSet === "function")
    window.hcPresenceSet("menu", null);
  if (!silent && typeof showMenu === "function") showMenu();
}
$("btnSpecLeave").onclick = () => {
  sfx("tap");
  specStop(false);
};

/* ---------- host side: publish + eye + bot spectators ---------- */
let specPubLast = 0;
let specEyeLast = 0;
let specSeenChat = 0;
window.__specSim = window.__specSim || { bots: [] };
const BOT_SPEC_LINES = [
  "Wow!",
  "What a match!",
  "This is intense!",
  "Nice!",
  "Unlucky!",
  "Come on!",
  "What a ball!",
  "So close!",
];
function spectateSnap() {
  const bat = typeof curBat === "function" ? curBat() : G.me;
  return {
    a: { s: G.me.score, w: G.me.wkts, b: G.me.balls },
    b: { s: G.opp.score, w: G.opp.wkts, b: G.opp.balls },
    iBat: !!G.iBat,
    ov: bat ? Math.floor(bat.balls / 6) + "." + (bat.balls % 6) : "0.0",
    msg: ($("status") && $("status").textContent) || "",
  };
}
/* Called once per ball from nextBall(): publishes (throttled), refreshes the
   eye count (throttled), and runs the bot-spectator simulation. */
window.spectateTick = function () {
  const now = Date.now();
  /* bot spectators join ANY live match (online or bot games) */
  try {
    const sim = window.__specSim;
    const balls = (G.me ? G.me.balls : 0) + (G.opp ? G.opp.balls : 0);
    if (
      sim.bots.length < 3 &&
      balls < 12 &&
      Math.random() < 0.12 &&
      typeof genBotName === "function"
    ) {
      sim.bots.push(genBotName());
      specRenderEye(sim.bots.length + (window.__specReal || 0));
    }
    if (
      sim.bots.length &&
      Math.random() < 0.09 &&
      typeof showFloatMsg === "function"
    ) {
      const who = sim.bots[(Math.random() * sim.bots.length) | 0];
      showFloatMsg(
        BOT_SPEC_LINES[(Math.random() * BOT_SPEC_LINES.length) | 0],
        true,
      );
      void who;
    }
  } catch (e) {}
  /* real relay only matters for online rooms */
  if (G.mode !== "online" || !G.roomId) return;
  if (now - specPubLast > 3000) {
    specPubLast = now;
    specApi("publish", { room: G.roomId, snap: spectateSnap() });
  }
  if (now - specEyeLast > 10000) {
    specEyeLast = now;
    (async () => {
      try {
        const r = await fetch(
          "/api/spectate?room=" + encodeURIComponent(G.roomId),
        );
        if (!r.ok) return;
        const d = await r.json();
        const real = (d.watchers || []).filter(
          (n) => n !== (typeof getUsername === "function" ? getUsername() : ""),
        );
        window.__specReal = real.length;
        window.__specRealNames = real;
        /* surface spectator comments as float bubbles */
        (d.comments || []).forEach((c) => {
          if (c.ts > specSeenChat && typeof showFloatMsg === "function") {
            showFloatMsg(c.name + ": " + c.text, true);
          }
        });
        if (d.comments && d.comments.length)
          specSeenChat = Math.max.apply(
            null,
            d.comments.map((c) => c.ts || 0).concat([specSeenChat]),
          );
        const sim = window.__specSim;
        specRenderEye(real.length + sim.bots.length);
      } catch (e) {}
    })();
  }
};
function specRenderEye(n) {
  const eye = $("watchEye");
  if (!eye) return;
  if (n > 0) {
    eye.classList.remove("hidden");
    const c = $("watchCount");
    if (c) c.textContent = n;
  } else {
    eye.classList.add("hidden");
  }
}
window.specResetHost = function () {
  window.__specSim = { bots: [] };
  window.__specReal = 0;
  window.__specRealNames = [];
  specPubLast = 0;
  specEyeLast = 0;
  specSeenChat = 0;
  specRenderEye(0);
};
$("watchEye").onclick = () => {
  sfx("tap");
  const names = ((window.__specRealNames || []).concat(
    (window.__specSim && window.__specSim.bots) || [],
  ));
  const c2 = $("watchCount2");
  if (c2) c2.textContent = names.length;
  const box = $("watchList");
  box.innerHTML = names.length
    ? names
        .map(
          (n) =>
            '<div class="watch-row"><span class="pdot on"></span><span>' +
            String(n).replace(/&/g, "&amp;").replace(/</g, "&lt;") +
            "</span></div>",
        )
        .join("")
    : '<div class="lb-empty">No watchers yet.</div>';
  $("watchOverlay").classList.remove("hidden");
};
$("btnCloseWatch").onclick = () => {
  sfx("tap");
  $("watchOverlay").classList.add("hidden");
};
