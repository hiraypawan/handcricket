/* ============================================================================
   FILE: public/js/27-auth.js
   ROLE: GOOGLE SIGN-IN (optional) — Google Identity Services button, links
   the Google subject (sub) to the local career so progress + leaderboard
   survive across devices. Nothing here is required: the game works fully
   anonymous on the device-token model. Needs Pages env HC_GOOGLE_CLIENT_ID
   (see bottom). Depends on: nothing at load; setUsername/publish at call.
============================================================================ */

/* Public Client ID (not a secret — it ships in page source by design).
   Served from /api/config (Pages env HC_GOOGLE_CLIENT_ID wins); falls back
   to the built-in ID so sign-in works with zero dashboard steps. */
const HC_GOOGLE_ID_FALLBACK =
  "972270818286-73keh4u80nn5ll0pv9i2hk1nr1o7mf8i.apps.googleusercontent.com";
async function hcGoogleClientId() {
  if (window.__hcGoogleId !== undefined) return window.__hcGoogleId;
  let id = "";
  try {
    const r = await fetch("/api/config");
    if (r.ok) {
      const j = await r.json();
      id = (j && j.googleClientId) || "";
    }
  } catch (e) {}
  window.__hcGoogleId = id || HC_GOOGLE_ID_FALLBACK;
  return window.__hcGoogleId;
}
function hcGoogleLoad() {
  if (window.google && window.google.accounts) return Promise.resolve(true);
  if (window.__hcGoogleLoading) return window.__hcGoogleLoading;
  window.__hcGoogleLoading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(!!(window.google && window.google.accounts));
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return window.__hcGoogleLoading;
}
function hcGoogleStored() {
  try {
    return JSON.parse(localStorage.getItem("hcp_google") || "null");
  } catch (e) {
    return null;
  }
}
function hcGoogleToken() {
  try {
    return localStorage.getItem("hcp_google_token") || "";
  } catch (e) {
    return "";
  }
}
/* Render the Sign in with Google button into every .google-btn-slot on this
   screen. Silent no-op when no Client ID is configured. Save-progress notes
   hide once an account is linked. */
async function renderGoogleButtons() {
  try {
    const linked = !!hcGoogleStored();
    document.querySelectorAll(".save-note").forEach((el) => {
      el.style.display = linked ? "none" : "";
    });
    const id = await hcGoogleClientId();
    if (!id) return;
    const ok = await hcGoogleLoad();
    if (!ok || !window.google.accounts.id) return;
    window.google.accounts.id.initialize({
      client_id: id,
      callback: hcGoogleCredential,
      auto_select: false,
    });
    document.querySelectorAll(".google-btn-slot").forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 260,
      });
    });
  } catch (e) {}
}
/* Union of two careers (disjoint histories): totals summed, bests maxed. */
function mergeStats(a, b) {
  const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const base = typeof defaultStats === "function" ? defaultStats() : {};
  const A = Object.assign({}, base, a || {});
  const B = b || {};
  const out = {};
  ["matches", "wins", "losses", "ties", "runs", "ballsFaced", "sixes", "fours", "dots", "dotsBowled", "wicketsTaken", "ballsBowled", "runsConceded", "hatricks", "outs"].forEach(
    (k) => {
      out[k] = n(A[k]) + n(B[k]);
    },
  );
  ["highestScore", "bestWinStreak", "winStreak", "streak", "bestBowlWkts", "bestBowlRuns"].forEach(
    (k) => {
      out[k] = Math.max(n(A[k]), n(B[k]));
    },
  );
  out.name = A.name || B.name || "";
  return typeof deriveStats === "function" ? deriveStats(out) : out;
}
/* Multi-device restore: adopt whichever side (server vs this device) has the
   richer career, then push everything (career + Google link) and pull story. */
async function restoreGoogleProgress() {
  try {
    const u =
      (typeof getUsername === "function" && getUsername()) || "";
    if (!u) return;
    let server = null;
    try {
      const r = await fetch("/api/profile?user=" + encodeURIComponent(u));
      if (r.ok) {
        const j = await r.json();
        if (j && j.profile && j.profile.stats) server = j.profile.stats;
      }
    } catch (e) {}
    const local =
      (typeof loadStats === "function" && loadStats()) || null;
    const sm = (server && server.matches) || 0;
    const lm = (local && local.matches) || 0;
    if (server && sm > lm && typeof saveStats === "function") {
      saveStats(
        Object.assign(
          typeof defaultStats === "function" ? defaultStats() : {},
          server,
        ),
      );
      toast("Progress restored from your Google account", "ok");
    }
    if (typeof cloudLoadStory === "function") {
      try {
        await cloudLoadStory();
      } catch (e) {}
    }
    if (typeof publishProfile === "function") publishProfile();
    if (typeof updHomeUsername === "function") updHomeUsername();
  } catch (e) {}
}
function hcGoogleCredential(resp) {
  try {
    const cred = (resp && resp.credential) || "";
    const payload = JSON.parse(atob(cred.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload || !payload.sub) return;
    try {
      localStorage.setItem("hcp_google_token", cred);
      localStorage.setItem(
        "hcp_google",
        JSON.stringify({ sub: payload.sub, name: payload.name || "", picture: payload.picture || "" }),
      );
    } catch (e) {}
    const gname = String(payload.name || "").trim().slice(0, 24);
    const cur =
      (typeof getUsername === "function" && getUsername()) || "";
    if (gname && !cur) {
      setUsername(gname);
    } else if (gname && cur.toLowerCase() !== gname.toLowerCase()) {
      /* Guest played first: merge the guest career INTO the Google career
         so nothing is lost, then switch identity. */
      try {
        const guest =
          typeof loadStats === "function" ? loadStats() : null;
        setUsername(gname);
        const mine =
          typeof loadStats === "function" ? loadStats() : null;
        if (typeof saveStats === "function")
          saveStats(mergeStats(mine, guest));
        toast("Guest progress merged into " + gname, "ok");
      } catch (e) {
        setUsername(gname);
      }
    }
    restoreGoogleProgress();
    if (typeof updHomeUsername === "function") updHomeUsername();
    renderGoogleButtons();
  } catch (e) {}
}
function hcGoogleSignOut() {
  try {
    localStorage.removeItem("hcp_google");
    localStorage.removeItem("hcp_google_token");
    if (window.google && window.google.accounts)
      window.google.accounts.id.disableAutoSelect();
  } catch (e) {}
  toast("Google unlinked on this device");
  renderGoogleButtons();
}
window.hcGoogleSignOut = hcGoogleSignOut;
window.renderGoogleButtons = renderGoogleButtons;
