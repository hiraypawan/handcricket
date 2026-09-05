/* ---------------------------------------------------------------------------
   25-replay.js — ball-by-ball replay of a finished match.

   The engine already records every ball in G.me.hist / G.opp.hist, so a replay
   is a playback problem, not a simulation one. This stores the last few matches
   and steps through the recorded balls, re-deriving the score the same way the
   live scoreboard does.

   Deliberately NOT a simulation: nothing here re-rolls a result, so a replay can
   never disagree with the match it came from.
   ------------------------------------------------------------------------ */
(function () {
  "use strict";

  const KEY = "hcp_replays";
  const KEEP = 5;

  function loadAll() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "null");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, KEEP)));
    } catch (e) {}
  }

  /* Store a finished match. Called from the engine alongside the stats update. */
  function record(result) {
    if (!result) return;
    const myHist = (result.myHist || []).slice();
    const oppHist = (result.oppHist || []).slice();
    if (!myHist.length && !oppHist.length) return;

    const entry = {
      id: Date.now() + ":" + Math.floor(Math.random() * 1e4),
      at: Date.now(),
      oppName: result.oppName || "Opponent",
      won: !!result.won,
      lost: !!result.lost,
      tied: !!result.tied,
      myRuns: result.myRuns || 0,
      myWickets: result.myWickets || 0,
      oppRuns: result.oppRuns || 0,
      oppWickets: result.oppWickets || 0,
      myHist,
      oppHist,
    };
    const list = loadAll();
    list.unshift(entry);
    saveAll(list);
    return entry.id;
  }

  /* ------------------------------------------------------------------ *
   * Scoring. Mirrors the engine's reading of a ball so the replay total
   * always equals the real total.
   * ------------------------------------------------------------------ */
  function ballRuns(h) {
    if (typeof h === "number") return h;
    const n = parseInt(h, 10);
    return isNaN(n) ? 0 : n;
  }

  function ballLabel(h) {
    if (h === "W") return "W";
    if (h === "NB") return "nb";
    if (h === "DOT") return "\u00B7";
    const n = ballRuns(h);
    return n === 4 ? "4" : n === 6 ? "6" : String(n);
  }

  function ballClass(h) {
    if (h === "W") return "rp-w";
    if (h === "NB") return "rp-nb";
    if (h === "DOT") return "rp-dot";
    const n = ballRuns(h);
    if (n === 6) return "rp-six";
    if (n === 4) return "rp-four";
    return "rp-run";
  }

  /* Both innings played out side by side, ball by ball. */
  function frames(entry) {
    const out = [];
    const a = entry.myHist || [];
    const b = entry.oppHist || [];
    const len = Math.max(a.length, b.length);
    let ra = 0, wa = 0, rb = 0, wb = 0;
    for (let i = 0; i < len; i++) {
      const ha = i < a.length ? a[i] : null;
      const hb = i < b.length ? b[i] : null;
      if (ha !== null) {
        ra += ballRuns(ha);
        if (ha === "W") wa++;
      }
      if (hb !== null) {
        rb += ballRuns(hb);
        if (hb === "W") wb++;
      }
      out.push({
        ball: i + 1,
        my: ha,
        opp: hb,
        myScore: ra + "/" + wa,
        oppScore: rb + "/" + wb,
      });
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Playback
   * ------------------------------------------------------------------ */
  let timer = null;

  function stopPlayback() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function play(entryId) {
    const entry = loadAll().filter(function (r) { return r.id === entryId; })[0];
    if (!entry) return;
    stopPlayback();

    const ov = document.getElementById("replayOverlay");
    const strip = document.getElementById("replayStrip");
    const score = document.getElementById("replayScore");
    const meta = document.getElementById("replayMeta");
    if (!ov || !strip || !score) return;

    document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
      o.classList.add("hidden");
    });
    ov.classList.remove("hidden");

    const closeBtn = document.getElementById("btnCloseReplay");
    if (closeBtn && !closeBtn.__wired) {
      closeBtn.__wired = true;
      closeBtn.onclick = function () {
        sfx("tap");
        stopPlayback();
        ov.classList.add("hidden");
        const res = document.getElementById("replayResult");
        if (res) res.classList.add("hidden");
      };
    }

    const fr = frames(entry);
    meta.textContent = "vs " + entry.oppName + " \u00B7 " + fr.length + " balls";

    let i = 0;
    const speed = Math.max(160, Math.min(520, Math.floor(9000 / Math.max(1, fr.length))));

    const paint = function () {
      const f = fr[i];
      score.innerHTML =
        '<span class="rp-you">YOU ' + f.myScore + "</span>" +
        '<span class="rp-sep">v</span>' +
        '<span class="rp-them">' + entry.oppName.toUpperCase().slice(0, 12) + " " + f.oppScore + "</span>";

      const cells = [];
      const from = Math.max(0, i - 11);
      for (let k = from; k <= i; k++) {
        const g = fr[k];
        if (g.my !== null) {
          cells.push('<span class="rp-ball ' + ballClass(g.my) + '">' + ballLabel(g.my) + "</span>");
        }
        if (g.opp !== null) {
          cells.push('<span class="rp-ball opp ' + ballClass(g.opp) + '">' + ballLabel(g.opp) + "</span>");
        }
      }
      strip.innerHTML = cells.join("");
      const last = strip.lastElementChild;
      if (last) last.classList.add("now");
    };

    paint();
    timer = setInterval(function () {
      i++;
      if (i >= fr.length) {
        stopPlayback();
        const res = document.getElementById("replayResult");
        if (res) {
          res.textContent = entry.won
            ? "You won by " + Math.max(0, entry.myRuns - entry.oppRuns) + " runs"
            : entry.lost
              ? entry.oppName + " won by " + Math.max(0, entry.oppRuns - entry.myRuns) + " runs"
              : "Match tied";
          res.classList.remove("hidden");
        }
        return;
      }
      paint();
    }, speed);
  }

  /* ------------------------------------------------------------------ *
   * The list of saved matches, rendered into the replay sheet.
   * ------------------------------------------------------------------ */
  function renderList() {
    const host = document.getElementById("replayList");
    if (!host) return;
    const list = loadAll();
    if (!list.length) {
      host.innerHTML =
        '<div class="lb-empty">No matches recorded yet. Finishing a match saves it here.</div>';
      return;
    }
    host.innerHTML = list
      .map(function (r) {
        const d = new Date(r.at);
        const when =
          String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
        const tag = r.won ? "WON" : r.lost ? "LOST" : "TIED";
        const cls = r.won ? "win" : r.lost ? "loss" : "draw";
        return (
          '<button class="rp-row" data-id="' + r.id + '">' +
          '<span class="rp-tag ' + cls + '">' + tag + "</span>" +
          '<span class="rp-who">' + escHtml(r.oppName) + "</span>" +
          '<span class="rp-sc">' + r.myRuns + "/" + r.myWickets + " v " + r.oppRuns + "/" + r.oppWickets + "</span>" +
          '<span class="rp-when">' + when + "</span>" +
          "</button>"
        );
      })
      .join("");
    host.querySelectorAll(".rp-row").forEach(function (b) {
      b.onclick = function () {
        sfx("tap");
        play(b.dataset.id);
      };
    });
  }

  function openReplays() {
    document.querySelectorAll(".overlay,.friends-overlay").forEach(function (o) {
      o.classList.add("hidden");
    });
    const ov = document.getElementById("replaysOverlay");
    if (ov) ov.classList.remove("hidden");
    const close = document.getElementById("btnCloseReplays");
    if (close && !close.__wired) {
      close.__wired = true;
      close.onclick = function () {
        sfx("tap");
        stopPlayback();
        ov.classList.add("hidden");
        if (typeof showMenu === "function") showMenu();
        if (typeof showDock === "function") showDock();
      };
    }
    renderList();
  }

  function count() {
    return loadAll().length;
  }

  window.hcRecordReplay = record;
  window.hcOpenReplays = openReplays;
  window.hcReplayCount = count;
  window.hcReplayFrames = frames;
  window.hcStopReplay = stopPlayback;
})();
