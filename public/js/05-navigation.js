/* ============================================================================
 FILE: public/js/05-navigation.js
 ROLE: SCREEN NAVIGATION — showMenu(), showStoryHome(), bottom TabBar controller (battle/team/arena/lounge/tournaments). Depends on: display helpers at call-time.
============================================================================ */

/* ====== BOTTOM TAB BAR CONTROLLER ====== */
function showMenu() {
  document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
    o.classList.add("hidden");
  });
  $("storyHome").classList.add("hidden");
  $("storyTeamBuilder").classList.add("hidden");
  $("storyDialogue").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
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
      // Show main menu
      showMenu();
    } else if (tab === "team") {
      // Show story mode
      showStoryHome();
    } else if (tab === "arena") {
      // Quick Match overlay — hide the home menu first so the two overlays
      // don't stack (C13), and prefill the honest quick-match screen.
      $("menuOverlay").classList.add("hidden");
      if ($("matchmakingOverlay")) {
        $("matchmakingOverlay").classList.remove("hidden");
        if (typeof startMatchmaking === "function") startMatchmaking();
      } else {
        showMenu();
      }
    } else if (tab === "lounge") {
      // Placeholder
      alert("Lounge — coming soon! Chat with friends and see live matches.");
    } else if (tab === "tournaments") {
      // Placeholder
      alert("Tournaments — coming soon! Compete in brackets and win trophies.");
    }
  },
};

