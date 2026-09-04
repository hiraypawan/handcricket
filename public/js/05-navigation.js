/* ============================================================================
 FILE: public/js/05-navigation.js
 ROLE: SCREEN NAVIGATION — showMenu(), showStoryHome(), bottom TabBar controller (battle/team/arena/lounge/tournaments). Depends on: display helpers at call-time.
============================================================================ */

/* ====== BOTTOM TAB BAR CONTROLLER ====== */
/* The dock is a root-screen controller: it must never float over the live
   match arena (it would cover the gesture controls), so gameplay code hides
   it and these two root views bring it back. */
function hideDock() {
  const t = document.getElementById("tabBar");
  if (t) t.classList.add("hidden");
}
function showDock() {
  const t = document.getElementById("tabBar");
  if (t) t.classList.remove("hidden");
}
function showMenu() {
  document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
    o.classList.add("hidden");
  });
  $("storyHome").classList.add("hidden");
  $("storyTeamBuilder").classList.add("hidden");
  $("storyDialogue").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
  showDock();
  updHomeUsername();
  updHomeTrophies();
}
function showStoryHome() {
  document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
    o.classList.add("hidden");
  });
  $("menuOverlay").classList.add("hidden");
  $("storyHome").classList.remove("hidden");
  $("storyDialogue").classList.add("hidden");
  showDock();
  if (typeof renderStoryHome === "function") renderStoryHome();
}
const TabBar = {
  currentTab: "battle",
  switch(tab) {
    this.currentTab = tab;
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    sfx("tap");
    haptic(10);
    if (tab === "battle") {
      // Play — main menu
      showMenu();
    } else if (tab === "team") {
      // Career — story mode
      showStoryHome();
    } else if (tab === "arena") {
      // Arena — instant bot battle format picker (honest quick match)
      $("menuOverlay").classList.add("hidden");
      if ($("matchmakingOverlay")) {
        $("matchmakingOverlay").classList.remove("hidden");
        if (typeof startMatchmaking === "function") startMatchmaking();
      } else {
        showMenu();
      }
    } else if (tab === "lounge") {
      // Profile — same action as the home profile button
      const b = $("btnProfile");
      if (b) b.click();
      else showMenu();
    } else if (tab === "tournaments") {
      // Help — how to play (on demand, never auto-opens)
      showMenu();
      if (typeof openTutorial === "function") openTutorial();
    }
  },
};

