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
  const AV_RBT = '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="8" width="15" height="11" rx="4"/><path d="M12 8V4.6"/><circle cx="12" cy="3.8" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="13.4" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="13.4" r="1.15" fill="currentColor" stroke="none"/><path d="M9.7 16.6h4.6"/></svg>';
const AV_PSN = '<svg class="uic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.2" r="3.6"/><path d="M4.8 20.4c1.1-3.7 3.9-5.6 7.2-5.6s6.1 1.9 7.2 5.6"/></svg>';
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

  /* v2.8 FRIEND PROTOCOL
     The server implements add/accept/reject/remove — and writes the request
     into the TARGET's record, which is the only way a second device can ever
     see it. The client used to POST {action:"sync"} for everything, which the
     server rejected with 400 "Invalid action", so every mutation was lost and
     friend requests never reached anyone. */
  async function api(action, extra) {
    const user = getUsername();
    if (!user) return null;
    try {
      const r = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.assign(
            { action, user, token: getClientToken() },
            extra || {},
          ),
        ),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  }
  /* Best-effort mirror of the local list (server merges it). Offline is fine —
     the local copy is the source of truth until the next successful call. */
  async function syncToServer() {
    return api("sync", { data: myFriends });
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

  /* ---- presence (online / last-seen) ---- */
  window.__friendStats = window.__friendStats || {};
  window.__friendIsBot = window.__friendIsBot || {};
  window.__presenceMap = window.__presenceMap || {};
  window.hcPresence = window.hcPresence || { state: "menu", room: null };
  window.hcPresenceSet = function (state, room) {
    window.hcPresence = { state: state || "menu", room: room || null };
    presenceBeat();
  };
  async function presenceBeat() {
    const u = typeof getUsername === "function" ? getUsername() : "";
    if (!u) return;
    try {
      await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: u,
          state: (window.hcPresence && window.hcPresence.state) || "menu",
          room: (window.hcPresence && window.hcPresence.room) || null,
        }),
      });
    } catch (e) {}
  }
  window.hcPresenceBeat = presenceBeat;
  setInterval(presenceBeat, 60000);
  function presenceLabel(online, lastSeen) {
    if (online) return { txt: "Online", on: true };
    const mins = Math.max(1, Math.round((Date.now() - (lastSeen || 0)) / 60000));
    if (!lastSeen) return { txt: "Offline", on: false };
    if (mins < 60) return { txt: mins + "m ago", on: false };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { txt: hrs + "h ago", on: false };
    return { txt: Math.floor(hrs / 24) + "d ago", on: false };
  }
  /* Real friends: server presence (unknown => allow). Bots: deterministic
     pseudo-presence so the list feels alive. */
  window.friendPresenceStatus = function (name) {
    const key = String(name || "").toLowerCase();
    const isBot = !!(window.__friendIsBot && window.__friendIsBot[key]);
    if (isBot && typeof botPresence === "function") {
      const b = botPresence(name);
      if (b.online) return { online: true, label: "Online", known: true, bot: true };
      return {
        online: false,
        label: b.lastMin < 60 ? b.lastMin + "m ago" : Math.floor(b.lastMin / 60) + "h ago",
        known: true,
        bot: true,
      };
    }
    const rec = window.__presenceMap && window.__presenceMap[key];
    if (!rec) return { online: true, label: "", known: false, bot: false };
    const lab = presenceLabel(rec.online, rec.lastSeen);
    return { online: !!rec.online, label: lab.txt, known: true, bot: false, state: rec.state, room: rec.room };
  };
  async function refreshPresence() {
    const names = ((myFriends.friends || []).map((f) => f.name) || []).filter(
      (n) => !(window.__friendIsBot && window.__friendIsBot[String(n).toLowerCase()]),
    );
    if (names.length && typeof getUsername === "function" && getUsername()) {
      try {
        const r = await fetch("/api/presence?names=" + encodeURIComponent(names.join(",")));
        if (r.ok) {
          const j = await r.json();
          if (j && j.presence) window.__presenceMap = j.presence;
        }
      } catch (e) {}
    }
    document.querySelectorAll("[data-pres]").forEach((el) => {
      const st = window.friendPresenceStatus(el.getAttribute("data-pres"));
      el.innerHTML =
        '<span class="pdot' + (st.online ? " on" : "") + '"></span>' +
        (st.label ? '<span class="ptxt">' + st.label + "</span>" : "");
      el.classList.toggle("off", !st.online && st.known);
    });
    document.querySelectorAll("[data-watchbtn]").forEach((btn) => {
      const st = window.friendPresenceStatus(btn.getAttribute("data-watchbtn"));
      btn.style.display = st.state === "playing" && st.room ? "" : "none";
    });
  }
  window.hcRefreshPresence = refreshPresence;

  function renderFriendList() {
    const list = $("friendList");
    if (!list) return;
    /* snapshots for profile fallback + bot flags for presence */
    try {
      (myFriends.friends || []).concat(myFriends.pending || []).forEach((f) => {
        const k = String(f.name || "").toLowerCase();
        if (!k) return;
        if (f.stats) window.__friendStats[k] = f.stats;
        if (f.isBot) window.__friendIsBot[k] = true;
      });
    } catch (e) {}
    if (currentTab === "list") {
      if (!myFriends.friends || myFriends.friends.length === 0) {
        list.innerHTML =
          '<div class="lb-empty">No friends yet.<br>Play a match and add your opponent, or share an invite from the Leaderboard.</div>';
        return;
      }
      list.innerHTML = myFriends.friends
        .map(
          (f) =>
            '<div class="friend-item' + (f.isBot ? " isBot" : "") + '" onclick="showUserProfile(\'' +
            escAttr(f.name) +
            '\')">' +
            (typeof avatarHtml === "function" ? avatarHtml(f.name || "?", 40, "friend-avatar") : '<div class="friend-avatar"><span class="av-letter">' +
            escHtml(((f.name || "?").trim().charAt(0) || "?").toUpperCase()) +
            "</span>" +
            AV_PSN +
            "</div>") +
            '<div class="friend-info"><div class="friend-name">' +
            escHtml(f.name) +
            "" +
            "</div>" +
            '<div class="friend-rank">' +
            (f.stats ? getRank(f.stats) : "") +
            "</div>" +
            '<div class="friend-presence" data-pres="' +
            escAttr(f.name) +
            '"></div></div>' +
            '<div class="friend-actions">' +
            '<button class="fa-watch" data-watchbtn="' +
            escAttr(f.name) +
            '" style="display:none" onclick="event.stopPropagation();hcWatchFriend(\'' +
            escAttr(f.name) +
            "')\">Watch</button>" +
            '<button class="fa-challenge" onclick="event.stopPropagation();challengeFriend(\'' +
            escAttr(f.name) +
            "')\">Play</button>" +
            '<button class="fa-remove" onclick="event.stopPropagation();removeFriend(\'' +
            escAttr(f.name) +
            "')\"><svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg></button>" +
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
            '<div class="friend-item pending-item' + (f.isBot ? ' isBot' : '') + '">' +
            (typeof avatarHtml === "function" ? avatarHtml(f.name || "?", 40, "friend-avatar") : '<div class="friend-avatar"><span class="av-letter">' +
            escHtml(((f.name || "?").trim().charAt(0) || "?").toUpperCase()) +
            "</span>" +
            AV_PSN +
            "</div>") +
            '<div class="friend-info"><div class="friend-name">' +
            escHtml(f.name) +
            "</div>" +
            '<div class="friend-rank">' +
            (f.stats ? getRank(f.stats) : "New player") +
            "</div></div>" +
            '<div class="friend-actions">' +
            '<button class="fa-accept" onclick="event.stopPropagation();acceptFriend(\'' +
            escAttr(f.name) +
            "')\"><svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4.5 12.5l5 5L19.5 7\"/></svg></button>" +
            '<button class="fa-reject" onclick="event.stopPropagation();rejectFriend(\'' +
            escAttr(f.name) +
            "')\"><svg class=\"uic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg></button>" +
            "</div></div>",
        )
        .join("");
    }
    updatePendingCount();
    try {
      refreshPresence();
    } catch (e) {}
  }

  function updatePendingCount() {
    const el = $("pendingCount");
    const count = (myFriends.pending || []).length + (pendingInvite ? 1 : 0);
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? "inline" : "none";
    }
  }

  window.acceptFriend = async function (name) {
    loadLocal();
    const idx = myFriends.pending.findIndex(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    );
    if (idx === -1) {
      toast("That request is no longer pending", "warn");
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
    // links BOTH sides server-side; on failure we still keep the local copy
    const res = await api("accept", { target: name });
    if (!res) toast("Saved locally — will sync when you are back online");
    renderFriendList();
    sfx("win");
    showFloatMsg(name + " is now your friend!", true, "joy");
    loadFriends().then(renderFriendList);
  };
  window.rejectFriend = async function (name) {
    loadLocal();
    myFriends.pending = myFriends.pending.filter(
      (f) => f.name.toLowerCase() !== name.toLowerCase(),
    );
    saveLocal();
    await api("reject", { target: name });
    renderFriendList();
    toast("Request removed");
  };
  window.removeFriend = async function (name) {
    const ok = await confirmDialog("Remove friend?", name + " will be removed from your list.", "Remove");
    if (!ok) return;
    loadLocal();
    myFriends.friends = myFriends.friends.filter(
      (f) => f.name.toLowerCase() !== name.toLowerCase(),
    );
    saveLocal();
    await api("remove", { target: name });
    renderFriendList();
    toast(name + " removed");
  };
  // C8: "Play" on a friend used to be a dead end (nothing happened). Now it
  // starts a real online host room: you get a shareable invite link and wait
  // for your friend to open it (they join as the guest). Requires PeerJS — the
  // retry button handles transient network failures.
  window.hcWatchFriend = function (name) {
    const st =
      typeof window.friendPresenceStatus === "function"
        ? window.friendPresenceStatus(name)
        : null;
    if (typeof hcSpectate === "function" && st && st.room) {
      hcSpectate(st.room, name);
    } else {
      toast(name + " is not in a live match right now", "warn");
    }
  };
  window.challengeFriend = function (name) {
    ensureAudio();
    sfx("tap");
    /* Play requests only go to friends who are online — real (presence) or
       bot (pseudo-presence). Unknown status fails open (old behavior). */
    try {
      const st =
        typeof window.friendPresenceStatus === "function"
          ? window.friendPresenceStatus(name)
          : null;
      if (st && st.known && !st.online) {
        toast(name + " is offline" + (st.label ? " (" + st.label + ")" : "") + " — try later", "warn");
        return;
      }
    } catch (e) {}
    $("friendsOverlay").classList.add("hidden");
    if (typeof Peer === "undefined") {
      toast("Online play needs a connection — check your network and retry", "warn");
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
    $("waitDesc").textContent =
      "Share the invite link — they'll join as your opponent. Keep this screen open.";
    connLog("Creating room to challenge " + name + "...");
    startPeer(true);
    /* v2.8: actually deliver something. The room id exists as soon as
       startPeer() runs, so the invite can be pushed into the friend's inbox
       (they see it the next time they open Friends — no live socket needed). */
    (async () => {
      try {
        const u = new URL(location.href);
        u.searchParams.set("room", G.roomId);
        await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: name,
            action: "invite",
            from: getUsername(),
            room: G.roomId,
            link: u.toString(),
            teamSize: G.teamSize,
          }),
        });
      } catch (e) {}
    })();
  };

  window.showFriends = async function () {
    await loadFriends();
    pollInbox(false);
    try {
      presenceBeat();
    } catch (e) {}
    currentTab = "list";
    renderFriendList();
    const pr = $("profileOverlay");
    if (pr) pr.classList.add("hidden");
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
      btnInner.textContent = "Friends";
      btnInner.className = "add-friend-btn already";
    } else if (isPending) {
      btn.style.display = "block";
      btnInner.textContent = "Request Sent";
      btnInner.className = "add-friend-btn already";
    } else {
      btn.style.display = "block";
      btnInner.textContent = "+ Add Friend";
      btnInner.className = "add-friend-btn";
    }
  };

  $("btnAddFriend").onclick = async () => {
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
    const isBot = !!G.isBot;
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
      $("btnAddFriend").textContent = "Friends (Bot accepted)";
      $("btnAddFriend").className = "add-friend-btn already";
      sfx("win");
      showFloatMsg("You are friends now!", true, "joy");
    } else {
      myFriends.pending.push({ name: target, stats: stats, since: Date.now(), sent: true });
      saveLocal();
      /* The request has to land in THEIR record — that is the whole point. */
      const res = await api("add", {
        target,
        isBot: false,
        targetStats: loadStats(),
      });
      $("btnAddFriend").textContent = "Request Sent";
      $("btnAddFriend").className = "add-friend-btn already";
      if (res && res.sent) showFloatMsg("Request sent to " + target + "!", true, "joy");
      else toast("Saved locally — will sync when you are back online");
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

  /* KV is eventually consistent, so a request sent a moment ago can take a few
     seconds to show up. The 20s poll hides that, but "is it broken?" is the
     obvious read — an explicit refresh makes the wait look deliberate. */
  const frb = $("btnFriendsRefresh");
  if (frb && !frb.__wired) {
    frb.__wired = true;
    frb.onclick = async () => {
      frb.classList.add("busy");
      frb.disabled = true;
      try {
        await loadFriends();
        await pollInbox(true);
      } catch (e) {}
      frb.classList.remove("busy");
      frb.disabled = false;
      if (typeof toast === "function") toast("Friend list refreshed", "good");
    };
  }

  setTimeout(() => loadFriends(), 500);

  /* v2.8 INBOUND INVITES + REQUESTS
     There is no realtime channel, so the inbox is polled: once shortly after
     boot, whenever Friends is opened, and every 20s while the tab is visible.
     An invite carries the room code, so accepting drops you straight into the
     host's lobby. */
  let invitePollTimer = null;
  async function pollInbox(notify) {
    const user = getUsername();
    if (!user) return;
    try {
      const r = await fetch("/api/challenges?user=" + encodeURIComponent(user));
      if (!r.ok) return;
      const j = await r.json();
      const invites = (j.challenges || []).filter(
        (c) => c.type === "invite" && !c.resolved && c.room,
      );
      if (!invites.length) return;
      const latest = invites[invites.length - 1];
      pendingInvite = latest;
      if (notify) {
        showFriendNotif(latest.from + " invited you to play", "Room " + latest.room + " — join now?", [
          {
            label: "Join",
            cls: "fnb-accept",
            action: () => {
              hideFriendNotif();
              joinInvite(latest);
            },
          },
          { label: "Not now", cls: "fnb-reject", action: () => hideFriendNotif() },
        ]);
      }
      updatePendingCount();
    } catch (e) {}
  }
  let pendingInvite = null;
  async function joinInvite(inv) {
    try {
      await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: getUsername(), action: "resolve", room: inv.room }),
      });
    } catch (e) {}
    pendingInvite = null;
    document.querySelectorAll(".overlay,.friends-overlay").forEach((o) => o.classList.add("hidden"));
    $("onlineLobby").classList.remove("hidden");
    $("nameInput").value = getUsername() || "";
    if (typeof setLobbyMode === "function") setLobbyMode(true, inv.room);
    showDock();
  }
  window.checkBotChallenges = function () {
    pollInbox(true);
    if (!invitePollTimer) {
      invitePollTimer = setInterval(() => {
        if (!document.hidden) pollInbox(true);
      }, 20000);
    }
  };

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
        botName + " wants to be your friend!",
        "Accept " + botName + "'s friend request?",
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
              showFloatMsg("You are friends now!", true, "joy");
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

  /* v2.8: was an empty stub that the engine called after every match. Now the
     opponent may ask for a rematch — reusing the same notification chrome as
     friend requests, and restarting against the SAME persona so the career you
     just saw is the one you play again. */
  window.maybeBotChallenge = function () {
    if (!G.isBot || G.storyMatch) return;
    if (Math.random() > 0.35) return;
    const p = G.botProfile;
    if (!p || !p.name) return;
    setTimeout(() => {
      showFriendNotif(p.name + " wants a rematch", "Same format, straight away?", [
        {
          label: "Rematch",
          cls: "fnb-accept",
          action: () => {
            hideFriendNotif();
            document
              .querySelectorAll(".overlay,.friends-overlay")
              .forEach((o) => o.classList.add("hidden"));
            showDock();
            if (typeof startQuickBotMatch === "function") startQuickBotMatch(p);
            else showMenu();
          },
        },
        { label: "Later", cls: "fnb-reject", action: () => hideFriendNotif() },
      ]);
    }, 2600);
  };
})();
