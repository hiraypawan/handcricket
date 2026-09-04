/* ============================================================================
 FILE: public/js/12-tutorial.js
 ROLE: TUTORIAL & SETUP WIRING — TUTORIAL_SLIDES, renderTutSlide/openTutorial/closeTutorial, back buttons, team-size button wiring. Depends on: G at call-time.
============================================================================ */

const TUTORIAL_SLIDES = [
  {
    title: "Pick a number",
    body: "You and your opponent both pick a number from 1 to 6. Pick quickly — you only get 5 seconds per ball.",
  },
  {
    title: "Same number = OUT",
    body: "If both numbers match, the batter is OUT (unless it is a Free Hit). Different numbers = runs for the batter.",
  },
  {
    title: "Free Hit & Sixes",
    body: "No-balls give a Free Hit: the batter can never be out on the next ball. Hitting a 6 is a SIX! Watch the wicket count, then chase the target in the 2nd innings.",
  },
];
let tutIdx = 0;
function renderTutSlide() {
  const s = TUTORIAL_SLIDES[tutIdx];
  const isLast = tutIdx === TUTORIAL_SLIDES.length - 1;
  $("tutSlide").innerHTML =
    '<div class="tut-title"><span class="tut-num">' +
    (tutIdx + 1) +
    "</span>" +
    s.title +
    '</div><div class="tut-body">' +
    s.body +
    '</div><div class="tut-dots">' +
    TUTORIAL_SLIDES.map(
      (_, i) => '<div class="d' + (i === tutIdx ? " on" : "") + '"></div>',
    ).join("") +
    "</div>" +
    '<button class="tut-next" id="tutNextBtn">' +
    (isLast ? "Start Playing" : "Next") +
    "</button>" +
    '<label class="tut-dont"><input type="checkbox" id="tutDontShow"/> Don\'t show again</label>';
  $("tutNextBtn").onclick = () => {
    sfx("tap");
    if (tutIdx < TUTORIAL_SLIDES.length - 1) {
      tutIdx++;
      renderTutSlide();
    } else closeTutorial();
  };
}
function openTutorial() {
  $("menuOverlay").classList.add("hidden");
  tutIdx = 0;
  renderTutSlide();
  $("tutorialOverlay").classList.remove("hidden");
}
function closeTutorial() {
  const dont = $("tutDontShow") && $("tutDontShow").checked;
  $("tutorialOverlay").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
  try {
    if (dont) localStorage.setItem("hc_tut_dismissed", "1");
  } catch (e) {}
}
$("tutSkip").onclick = () => {
  sfx("tap");
  // M9: skipping should stop the tutorial from auto-popping on every load.
  try {
    localStorage.setItem("hc_tut_skipped", "1");
  } catch (e) {}
  closeTutorial();
};
try {
  if (
    !localStorage.getItem("hc_tut_dismissed") &&
    !localStorage.getItem("hc_tut_skipped")
  ) {
    setTimeout(() => {
      if (!$("menuOverlay").classList.contains("hidden")) openTutorial();
    }, 800);
  }
} catch (e) {}
$("btnBack1").onclick = () => {
  $("offlineSetup").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
};
$("btnBack1").className = "back-btn";
$("btnBack2").onclick = () => {
  $("onlineLobby").classList.add("hidden");
  $("menuOverlay").classList.remove("hidden");
};
$("btnBack2").className = "back-btn";
$("btnCloseProfile").onclick = () => {
  $("profileOverlay").classList.add("hidden");
};

// NOTE: legacy nameA/nameB click-to-open-profile handlers were removed — the
// HTML never contained id="nameA"/id="nameB", and unguarded $() access here
// used to throw TypeError and kill ALL subsequent initialization (critical bug C1).

// Team-size selectors (#offlineSize / #onlineSize / #mmSize): picking a size in
// ANY screen deactivates the others, so getTeamSize() (first .active) is always
// the user's latest choice instead of a stale value from a hidden screen (M1).
function wireTeamSizeButtons() {
  const all = document.querySelectorAll(".team-size-btn");
  all.forEach((b) => {
    b.onclick = () => {
      all.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      G.teamSize = parseInt(b.dataset.size, 10);
      sfx("tap");
    };
  });
}
wireTeamSizeButtons();


