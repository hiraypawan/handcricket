/* ---------------------------------------------------------------------------
   24-tournaments.js — single-elimination knockout cup.

   Reuses the ordinary offline match engine: a tournament is a bracket of
   personas where each round calls startQuickBotMatch(), and finishing a match
   advances the bracket. No second match implementation, so anything the normal
   game gets (roles, free hits, story-free career rules) the cup gets too.

   State lives in localStorage under hcp_cup so a cup survives a reload or a
   phone sleeping mid-bracket. Opponents are deterministic personas — the same
   bracket always contains the same names, which is what makes a bracket feel
   like a real draw rather than a random queue.
   ------------------------------------------------------------------------ */
(function () {
  "use strict";

  const KEY = "hcp_cup";
  const ROUND_NAMES = { 2: "Final", 4: "Semi-final", 8: "Quarter-final" };

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function save(cup) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cup));
    } catch (e) {}
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  /* A seeded draw. Opponent names are generated once and stored, so reloading
     mid-cup shows the same bracket rather than reshuffling it. */
  function makeCup(size) {
    const n = size === 8 ? 8 : 4;
    const names = [];
    const seen = {};
    // Guard against a name collision producing two identical slots.
    let guard = 0;
    while (names.length < n - 1 && guard++ < 200) {
      const p =
        typeof genFlavorName === "function" && Math.random() < 0.5
          ? genBotProfile(genFlavorName())
          : genBotProfile();
      if (!p || seen[p.name]) continue;
      seen[p.name] = 1;
      names.push(p.name);
    }
    while (names.length < n - 1) names.push("Player " + (names.length + 2));

    const me = (typeof getUsername === "function" && getUsername()) || "You";
    const draw = [me].concat(names);

    return {
      size: n,
      draw,
      // results[i] = name of the winner of slot pair i in the current round
      remaining: draw.slice(),
      round: n, // 8 -> 4 -> 2
      champion: null,
      wins: 0,
      createdAt: Date.now(),
    };
  }

  function nextOpponent(cup) {
    // The player is always still in `remaining`; pick any other survivor.
    const me = cup.draw[0];
    return cup.remaining.filter(function (n) { return n !== me; })[0] || null;
  }

  function roundLabel(cup) {
    return ROUND_NAMES[cup.remaining.length] || "Round of " + cup.remaining.length;
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */
  function render() {
    const host = document.getElementById("cupBracket");
    if (!host) return;
    const cup = load();

    if (!cup) {
      host.innerHTML =
        '<div class="cup-empty">No cup running.</div>' +
        '<div class="cup-sizes">' +
        '<button class="cup-size" data-size="4">4 players<span>Semi-final + Final</span></button>' +
        '<button class="cup-size" data-size="8">8 players<span>Three rounds</span></button>' +
        "</div>";
      host.querySelectorAll(".cup-size").forEach(function (b) {
        b.onclick = function () {
          sfx("tap");
          save(makeCup(parseInt(b.dataset.size, 10)));
          render();
        };
      });
      return;
    }

    if (cup.champion) {
      const won = cup.champion === cup.draw[0];
      host.innerHTML =
        '<div class="cup-done ' + (won ? "won" : "lost") + '">' +
        '<div class="cup-trophy">' + (won ? "&#127942;" : "&#127941;") + "</div>" +
        '<div class="cup-champ">' + escHtml(cup.champion) + " won the cup</div>" +
        '<div class="cup-sub">' +
        (won ? "You went through unbeaten in " + cup.wins + " matches." : "You won " + cup.wins + " match" + (cup.wins === 1 ? "" : "es") + " on the way.") +
        "</div></div>" +
        '<button class="cup-again" id="cupAgain">New cup</button>';
      const again = document.getElementById("cupAgain");
      if (again) {
        again.onclick = function () {
          sfx("tap");
          clear();
          render();
        };
      }
      return;
    }

    const opp = nextOpponent(cup);
    const me = cup.draw[0];

    let slots = "";
    // Show the current round as pairs; eliminated names drop out entirely so the
    // bracket reads as a shrinking field instead of a wall of grey.
    const live = cup.remaining.slice();
    for (let i = 0; i < live.length; i += 2) {
      const a = live[i];
      const b = live[i + 1];
      slots +=
        '<div class="cup-match' + (a === me || b === me ? " mine" : "") + '">' +
        '<div class="cup-slot' + (a === me ? " me" : "") + '">' + escHtml(a) + "</div>" +
        '<div class="cup-vsep">vs</div>' +
        '<div class="cup-slot' + (b === me ? " me" : "") + '">' + escHtml(b || "—") + "</div>" +
        "</div>";
    }

    host.innerHTML =
      '<div class="cup-head"><div class="cup-round">' + roundLabel(cup) + "</div>" +
      '<div class="cup-field">' + live.length + " players left</div></div>" +
      '<div class="cup-grid">' + slots + "</div>" +
      (opp
        ? '<button class="cup-play" id="cupPlay">Play ' + escHtml(opp) + "</button>"
        : "") +
      '<button class="cup-quit" id="cupQuit">Abandon cup</button>';

    const play = document.getElementById("cupPlay");
    if (play) {
      play.onclick = function () {
        sfx("tap");
        startCupMatch(opp);
      };
    }
    const quit = document.getElementById("cupQuit");
    if (quit) {
      quit.onclick = function () {
        sfx("tap");
        if (typeof confirmDialog === "function") {
          confirmDialog("Abandon this cup?", "Your progress in it will be lost.", [
            { label: "Keep playing", cls: "fnb-reject", action: function () {} },
            { label: "Abandon", cls: "fnb-accept", action: function () { clear(); render(); } },
          ]);
        } else {
          clear();
          render();
        }
      };
    }
  }

  function startCupMatch(oppName) {
    if (typeof genBotProfile !== "function" || typeof startQuickBotMatch !== "function") return;
    const cup = load();
    if (!cup) return;
    // Ramp difficulty through the rounds: a quarter-final is easier than a final.
    const roundsLeft = Math.log2(cup.remaining.length);
    const persona = genBotProfile(oppName);
    const base = 0.3 + (3 - roundsLeft) * 0.16;
    if (persona) persona.cupDifficulty = Math.min(0.9, Math.max(0.3, base));
    document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
      o.classList.add("hidden");
    });
    startQuickBotMatch(persona);
  }

  /* ------------------------------------------------------------------ *
   * Called from the engine when a match ends.
   * Returns true if a cup match was resolved (the engine can then say so).
   * ------------------------------------------------------------------ */
  function onMatchEnd(result) {
    const cup = load();
    if (!cup || cup.champion) return false;
    // Only count it if a cup match is actually the one being played.
    const opp = nextOpponent(cup);
    if (!opp) return false;
    const playedName = (result && result.oppName) || (typeof G !== "undefined" ? G.botProfile && G.botProfile.name : "") || "";
    if (playedName && playedName !== opp) return false;

    if (result && result.won) {
      cup.wins = (cup.wins || 0) + 1;
      /* The fixtures that don't involve the player still resolve — otherwise a
         4-player cup needs three wins instead of two and stops being a bracket.
         A knockout round halves the field, so this many leave, always including
         the opponent just beaten. */
      const before = cup.remaining.length;
      const leaves = Math.max(1, Math.floor(before / 2));
      const others = cup.remaining.filter(function (n) {
        return n !== cup.draw[0] && n !== opp;
      });
      const cut = [opp].concat(others.slice(0, leaves - 1));
      cup.remaining = cup.remaining.filter(function (n) { return cut.indexOf(n) === -1; });
    } else if (result && result.lost) {
      cup.remaining = cup.remaining.filter(function (n) { return n !== cup.draw[0]; });
      cup.champion = opp;
      save(cup);
      announce(false, cup, opp);
      return true;
    } else {
      // Tie: replay the same fixture rather than eliminating anyone.
      save(cup);
      if (typeof toast === "function") toast("Tied — the fixture will be replayed", "warn");
      return true;
    }

    if (cup.remaining.length <= 1) cup.champion = cup.draw[0];
    save(cup);
    if (cup.champion) announce(true, cup, cup.champion);
    return true;
  }

  function announce(won, cup, name) {
    if (typeof showFriendNotif !== "function") return;
    setTimeout(function () {
      showFriendNotif(
        won ? "You won the cup!" : name + " took the cup",
        won
          ? "Undefeated in " + cup.wins + " matches. Start another?"
          : "You won " + cup.wins + " on the way. Run it back?",
        [
          {
            label: won ? "New cup" : "Rematch",
            cls: "fnb-accept",
            action: function () {
              hideFriendNotif();
              clear();
              openCup();
            },
          },
          { label: "Later", cls: "fnb-reject", action: function () { hideFriendNotif(); } },
        ],
      );
    }, 1800);
  }

  function openCup() {
    document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
      o.classList.add("hidden");
    });
    const ov = document.getElementById("cupOverlay");
    if (ov) ov.classList.remove("hidden");
    const close = document.getElementById("btnCloseCup");
    if (close && !close.__wired) {
      close.__wired = true;
      close.onclick = function () {
        sfx("tap");
        ov.classList.add("hidden");
        if (typeof showMenu === "function") showMenu();
        if (typeof showDock === "function") showDock();
      };
    }
    render();
  }

  function hasActiveCup() {
    const cup = load();
    return !!(cup && !cup.champion);
  }

  window.hcOpenCup = openCup;
  window.hcRenderCup = render;
  window.hcCupMatchEnd = onMatchEnd;
  window.hcHasActiveCup = hasActiveCup;
  window.hcCupClear = clear;
})();
