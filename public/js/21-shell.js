/* ---------------------------------------------------------------------------
   21-shell.js — installability + consent + third-party failure handling.

   Nothing here touches gameplay. It exists so the three things that only matter
   outside the dev server have one obvious home:
     1. service worker registration (offline / installable)
     2. the analytics consent prompt (GA stays off until accepted)
     3. a clear message when PeerJS fails to load, instead of a dead "Play with
        a friend" button
   ------------------------------------------------------------------------ */
(function () {
  "use strict";

  /* ---- 1. Service worker ---------------------------------------------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* offline play is a bonus, not a requirement — fail silently */
      });
    });
  }

  /* ---- 2. Analytics consent ------------------------------------------- */
  function consentDecision(accepted) {
    try {
      localStorage.setItem("hcp_consent", accepted ? "yes" : "no");
    } catch (e) {}
    const bar = document.getElementById("consentBar");
    if (bar) bar.classList.add("hidden");
    if (accepted && typeof gtag === "function") {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=G-M484S7S0KG";
      document.head.appendChild(s);
      gtag("config", "G-M484S7S0KG");
      window.__gaLoaded = true;
    }
  }
  window.hcConsent = consentDecision;

  function maybeAskConsent() {
    let decided = null;
    try {
      decided = localStorage.getItem("hcp_consent");
    } catch (e) {}
    if (decided === "yes" || decided === "no") return;

    const bar = document.createElement("div");
    bar.id = "consentBar";
    bar.className = "consent-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Analytics consent");
    bar.innerHTML =
      '<div class="cb-text">We use anonymous analytics to see which modes get ' +
      "played. Nothing is shared and no account is needed.</div>" +
      '<div class="cb-actions">' +
      '<button type="button" class="cb-btn cb-no" id="cbNo">Decline</button>' +
      '<button type="button" class="cb-btn cb-yes" id="cbYes">Accept</button>' +
      "</div>";
    document.body.appendChild(bar);
    document.getElementById("cbYes").onclick = function () {
      consentDecision(true);
    };
    document.getElementById("cbNo").onclick = function () {
      consentDecision(false);
    };
  }

  /* ---- 3. PeerJS failure ---------------------------------------------- *
   * PeerJS comes from a CDN. If that request is blocked (school wifi, an
   * adblocker, a CDN outage) every online button previously just sat there.
   * Say what happened and leave offline modes untouched. */
  function flagPeerFailure() {
    if (typeof window.Peer === "function") return false;
    const btn = document.getElementById("btnOnline");
    const hint = document.getElementById("onlineHint");
    if (btn) {
      btn.setAttribute(
        "title",
        "Online needs the PeerJS library, which could not be loaded. Offline modes still work.",
      );
    }
    if (hint) {
      hint.textContent = "Online unavailable — connection library blocked";
      hint.classList.add("show");
    }
    return true;
  }
  window.hcPeerAvailable = function () {
    return typeof window.Peer === "function";
  };

  window.addEventListener("load", function () {
    setTimeout(maybeAskConsent, 1200);
    // PeerJS is `defer`, so it should be present by `load`; give it a moment
    // in case a slow CDN resolves late.
    setTimeout(flagPeerFailure, 3000);
  });
})();
