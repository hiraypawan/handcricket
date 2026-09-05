/* ============================================================================
   FILE: public/js/27-auth.js
   ROLE: GOOGLE SIGN-IN (optional) — Google Identity Services button, links
   the Google subject (sub) to the local career so progress + leaderboard
   survive across devices. Nothing here is required: the game works fully
   anonymous on the device-token model. Needs Pages env HC_GOOGLE_CLIENT_ID
   (see bottom). Depends on: nothing at load; setUsername/publish at call.
============================================================================ */

/* Set by the Pages dashboard (public Client ID, not a secret). Until the
   owner creates it, every function below no-ops and no button renders. */
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
  window.__hcGoogleId = id || "";
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
   screen. Silent no-op when no Client ID is configured. */
async function renderGoogleButtons() {
  try {
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
    if (gname && !getUsername()) {
      setUsername(gname);
      if (typeof updHomeUsername === "function") updHomeUsername();
    }
    toast("Google linked — progress is tied to your account", "ok");
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
