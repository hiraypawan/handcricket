/* ============================================================================
 FILE: public/js/20-friends.js
 ROLE: FRIEND SYSTEM — localStorage+KV sync, friend list UI tabs, add/accept/reject/remove, bot friend requests, Play-friend flow.
============================================================================ */

/* ====== FRIEND SYSTEM ====== */
(function () {
  const LS_KEY = "hcp_friends";
  let myFriends = { friends: [], pending: [] };
  let currentTab = "list";

  function saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(myFriends));
    } catch (e) {}
  }
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        myFriends = JSON.parse(raw);
        if (!myFriends.friends) myFriends.friends = [];
        if (!myFriends.pending) myFriends.pending = [];
      } else {
        myFriends = { friends: [], pending: [] };
      }
    } catch (e) {
      myFriends = { friends: [], pending: [] };
    }
  }

  async function syncToServer() {
    try {
      const user = getUsername();
      if (!user) return;
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", user, data: myFriends }),
      });
    } catch (e) {}
  }
  async function syncFromServer() {
    try {
      const user = getUsername();
      if (!user) return;
      const resp = await fetch("/api/friends?user=" + encodeURIComponent(user));
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && data.friends) {
        const merged = { friends: [], pending: [] };
        const allNames = new Set();
        (data.friends || []).forEach((f) => {
          const k = f.name.toLowerCase();
          if (!allNames.has(k)) {
            merged.friends.push(f);
            allNames.add(k);
          }
        });
        (myFriends.friends || []).forEach((f) => {
          const k = f.name.toLowerCase();
          if (!allNames.has(k)) {
            merged.friends.push(f);
            allNames.add(k);
          }
        });
        const pendNames = new Set();
        (data.pending || []).forEach((f) => {
          const k = f.name.toLowerCase();
          if (!pendNames.has(k)) {
            merged.pending.push(f);
            pendNames.add(k);
          }
        });
        (myFriends.pending || []).forEach((f) => {
          const k = f.name.toLowerCase();
          if (!pendNames.has(k)) {
            merged.pending.push(f);
            pendNames.add(k);
          }
        });
        myFriends = merged;
        saveLocal();
      }
    } catch (e) {}
  }

  async function loadFriends() {
    loadLocal();
    await syncFromServer();
  }

  function renderFriendList() {
    const list = $("friendList");
    if (!list) return;
    if (currentTab === "list") {
      if (!myFriends.friends || myFriends.friends.length === 0) {
        list.innerHTML =
          '<div style="text-align:center;opacity:.5;padding:20px;font-size:13px">No friends yet. Play a match and add your opponent!</div>';
        return;
      }
      list.innerHTML = myFriends.friends
        .map(
          (f) =>
            '<div class="friend-item">' +
            '<div class="friend-avatar">' +
            (f.isBot ? "🤖" : f.avatar || "👤") +
            "</div>" +
            '<div class="friend-info"><div class="friend-name">' +
            escHtml(f.name) +
            (f.isBot ? '<span class="friend-bot-badge">BOT</span>' : "") +
            "</div>" +
            '<div class="friend-rank">' +
            (f.stats ? getRank(f.stats) : "") +
            "</div></div>" +
            '<div class="friend-actions">' +
            '<button class="fa-challenge" onclick="challengeFriend(\'' +
            escAttr(f.name) +
            "')\">Play</button>" +
            '<button class="fa-remove" onclick="removeFriend(\'' +
            escAttr(f.name) +
            "')\">✕</button>" +
            "</div></div>",
        )
        .join("");
    } else {
      if (!myFriends.pending || myFriends.pending.length === 0) {
        list.innerHTML =
          '<div style="text-align:center;opacity:.5;padding:20px;font-size:13px">No pending requests</div>';
        return;
      }
      list.innerHTML = myFriends.pending
        .map(
          (f) =>
            '<div class="friend-item pending-item">' +
            '<div class="friend-avatar">' +
            (f.isBot ? "🤖" : "👤") +
            "</div>" +
            '<div class="friend-info"><div class="friend-name">' +
            escHtml(f.name) +
            "</div>" +
            '<div class="friend-rank">' +
            (f.stats ? getRank(f.stats) : "New player") +
            "</div></div>" +
            '<div class="friend-actions">' +
            '<button class="fa-accept" onclick="acceptFriend(\'' +
            escAttr(f.name) +
            "')\">✓</button>" +
            '<button class="fa-reject" onclick="rejectFriend(\'' +
            escAttr(f.name) +
            "')\">✕</button>" +
            "</div></div>",
        )
        .join("");
    }
    updatePendingCount();
  }

  function updatePendingCount() {
    const el = $("pendingCount");
    const count = (myFriends.pending || []).length;
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? "inline" : "none";
    }
  }

  window.acceptFriend = function (name) {
    loadLocal();
    const idx = myFriends.pending.findIndex(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    );
    if (idx === -1) {
      showFloatMsg("Request not found", "true");
      return;
    }
    const req = myFriends.pending.splice(idx, 1)[0];
    myFriends.friends.push({
      name: req.name,
      stats: req.stats || null,
      since: Date.now(),
      isBot: req.isBot || false,
    });
    saveLocal();
    syncToServer();
    renderFriendList();
    sfx("win");
    showFloatMsg(name + " is now your friend! 🤝", "true");
  };
  window.rejectFriend = function (name) {
    loadLocal();
    myFriends.pending = myFriends.pending.filter(
      (f) => f.name.toLowerCase() !== name.toLowerCase(),
    );
    saveLocal();
    syncToServer();
    renderFriendList();
    showFloatMsg("Request removed", "true");
  };
  window.removeFriend = function (name) {
    if (!confirm("Remove " + name + " from friends?")) return;
    loadLocal();
    myFriends.friends = myFriends.friends.filter(
      (f) => f.name.toLowerCase() !== name.toLowerCase(),
    );
    saveLocal();
    syncToServer();
    renderFriendList();
    showFloatMsg(name + " removed from friends", "true");
  };
  // C8: "Play" on a friend used to be a dead end (nothing happened). Now it
  // starts a real online host room: you get a shareable invite link and wait
  // for your friend to open it (they join as the guest). Requires PeerJS — the
  // retry button handles transient network failures.
  window.challengeFriend = function (name) {
    ensureAudio();
    sfx("tap");
    $("friendsOverlay").classList.add("hidden");
    if (typeof Peer === "undefined") {
      alert("Online play needs a connection to the PeerJS server. Try again when online.");
      $("menuOverlay").classList.remove("hidden");
      return;
    }
    G.mode = "online";
    G.isBot = false;
    G.oppName = name;
    G.isHost = true;
    G.wantRejoin = false;
    G.myName = getUsername() || "Host";
    setUsername(G.myName);
    G.teamSize = getTeamSize();
    G.storyDifficulty = 0;
    G.storyMatch = false;
    $("onlineLobby").classList.add("hidden");
    $("menuOverlay").classList.add("hidden");
    $("waitingOverlay").classList.remove("hidden");
    $("connLog").innerHTML = "";
    $("connBadge").style.display = "none";
    $("waitTitle").textContent = "Challenge sent to " + name + "!";
    $("waitDesc").textContent = "Share the invite link — they'll join as your opponent.";
    connLog("Creating room to challenge " + name + "...");
    startPeer(true);
  };

  window.showFriends = async function () {
    await loadFriends();
    currentTab = "list";
    renderFriendList();
    $("friendsOverlay").classList.remove("hidden");
    const tabs = document.querySelectorAll(".ftab");
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === "list"));
  };

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // M16: friend names are user input rendered inside HTML attributes AND text —
  // escape everything (not just quotes) so payloads like `</button>XSS` can't
  // inject markup.
  function escAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".ftab");
    if (!tab) return;
    currentTab = tab.dataset.tab;
    document
      .querySelectorAll(".ftab")
      .forEach((t) =>
        t.classList.toggle("active", t.dataset.tab === currentTab),
      );
    renderFriendList();
  });

  window.showAddFriendBtn = function () {
    const user = getUsername();
    // M10: no friend-request prompts for story-career opponents.
    if (G.storyMatch) return;
    if (!user || !G.oppName || G.oppName === user || G.oppName === "Opp")
      return;
    loadLocal();
    const isAlready = (myFriends.friends || []).some(
      (f) => f.name.toLowerCase() === G.oppName.toLowerCase(),
    );
    const isPending = (myFriends.pending || []).some(
      (f) => f.name.toLowerCase() === G.oppName.toLowerCase(),
    );
    const btn = $("addFriendBtn");
    const btnInner = $("btnAddFriend");
    if (isAlready) {
      btn.style.display = "block";
      btnInner.textContent = "✓ Friends";
      btnInner.className = "add-friend-btn already";
    } else if (isPending) {
      btn.style.display = "block";
      btnInner.textContent = "✓ Request Sent";
      btnInner.className = "add-friend-btn already";
    } else {
      btn.style.display = "block";
      btnInner.textContent = "+ Add Friend";
      btnInner.className = "add-friend-btn";
    }
  };

  $("btnAddFriend").onclick = () => {
    const user = getUsername();
    const target = G.oppName;
    if (!user || !target) {
      showFloatMsg("Set your username first!", "true");
      return;
    }
    loadLocal();
    const isAlready = (myFriends.friends || []).some(
      (f) => f.name.toLowerCase() === target.toLowerCase(),
    );
    if (isAlready) {
      showFloatMsg("Already friends!", "true");
      return;
    }
    const isBot = G.isBot;
    const stats = G.oppStats || null;
    if (isBot) {
      myFriends.friends.push({
        name: target,
        stats: stats,
        since: Date.now(),
        isBot: true,
      });
      saveLocal();
      syncToServer();
      $("btnAddFriend").textContent = "✓ Friends (Bot accepted!)";
      $("btnAddFriend").className = "add-friend-btn already";
      sfx("win");
      showFloatEmoji("🎉", true);
      showFloatMsg("We are friends now! 🤝", true);
    } else {
      myFriends.pending.push({ name: target, stats: stats, since: Date.now() });
      saveLocal();
      syncToServer();
      $("btnAddFriend").textContent = "✓ Request Sent";
      $("btnAddFriend").className = "add-friend-btn already";
      showFloatMsg("Friend request sent! 📩", "true");
    }
    loadFriends();
  };

  $("btnFriends").onclick = () => {
    sfx("tap");
    showFriends();
  };
  $("btnCloseFriends").onclick = () => {
    $("friendsOverlay").classList.add("hidden");
  };

  setTimeout(() => loadFriends(), 500);

  window.checkBotChallenges = function () {};

  window.showFriendNotif = function (title, text, buttons) {
    const n = $("friendNotif");
    $("fnTitle").textContent = title;
    $("fnText").textContent = text;
    const btns = $("fnBtns");
    btns.innerHTML = "";
    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = b.cls;
      btn.textContent = b.label;
      btn.onclick = b.action;
      btns.appendChild(btn);
    });
    n.classList.remove("hidden");
    setTimeout(() => n.classList.add("hidden"), 12000);
  };
  window.hideFriendNotif = function () {
    $("friendNotif").classList.add("hidden");
  };

  window.maybeBotFriendRequest = function () {
    if (!G.isBot || G.storyMatch) return; // M10: story bosses don't befriend you
    if (Math.random() > 0.4) return;
    const user = getUsername();
    if (!user) return;
    const botName = G.oppName;
    const botStats = G.oppStats;
    setTimeout(() => {
      showFriendNotif(
        botName + " wants to be your friend! 🤖",
        "Accept friend request from this bot?",
        [
          {
            label: "Accept",
            cls: "fnb-accept",
            action: () => {
              loadLocal();
              const dup = myFriends.friends.some(
                (f) => f.name.toLowerCase() === botName.toLowerCase(),
              );
              if (!dup)
                myFriends.friends.push({
                  name: botName,
                  stats: botStats || null,
                  since: Date.now(),
                  isBot: true,
                });
              saveLocal();
              syncToServer();
              hideFriendNotif();
              sfx("win");
              showFloatEmoji("🎉", true);
              showFloatMsg("We are friends! 🤝", true);
            },
          },
          {
            label: "Reject",
            cls: "fnb-reject",
            action: () => {
              hideFriendNotif();
            },
          },
        ],
      );
    }, 3000);
  };

  window.maybeBotChallenge = function () {};
})();
