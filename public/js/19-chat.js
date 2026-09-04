/* ============================================================================
 FILE: public/js/19-chat.js
 ROLE: EMOJI QUICK CHAT & BOT BANTER — emoji bar, quick messages (float bubbles over arena), BOT_CHAT taunt tables + botChat() during offline matches.
============================================================================ */

/* ====== EMOJI QUICK CHAT SYSTEM ====== */
(function () {
  const API = "/api";
  const emojiBar = $("emojiBar");
  const quickMsgs = $("quickMsgs");
  if (emojiBar) {
    emojiBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".emoji-btn");
      if (!btn) return;
      sfx("tap");
      haptic(10);
      if (btn.dataset.action === "msgs") {
        quickMsgs.classList.toggle("show");
        return;
      }
      const emoji = btn.dataset.emoji;
      if (!emoji) return;
      btn.classList.add("sent");
      setTimeout(() => btn.classList.remove("sent"), 400);
      quickMsgs.classList.remove("show");
      if (G.mode === "online" && conn && conn.open) {
        sendMsg({ type: "emoji", emoji, name: G.myName });
      }
      showFloatEmoji(emoji, false);
    });
  }
  if (quickMsgs) {
    quickMsgs.addEventListener("click", (e) => {
      const btn = e.target.closest(".qmsg-btn");
      if (!btn) return;
      sfx("tap");
      haptic(10);
      const msg = btn.dataset.msg;
      quickMsgs.classList.remove("show");
      if (G.mode === "online" && conn && conn.open) {
        sendMsg({ type: "quickmsg", msg, name: G.myName });
      }
      showFloatMsg(msg, false);
    });
  }
  function showFloatEmoji(emoji, isOpponent) {
    const el = document.createElement("div");
    el.className = "float-emoji " + (isOpponent ? "left" : "right");
    el.textContent = emoji;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function showFloatMsg(msg, isOpponent) {
    const el = document.createElement("div");
    el.className = "float-msg " + (isOpponent ? "left" : "right");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3100);
  }
  window.showFloatEmoji = showFloatEmoji;
  window.showFloatMsg = showFloatMsg;

  /* Extend handleNet for emoji/quickmsg */
  const origHandleNet = window._origHandleNet || handleNet;
  if (!window._origHandleNet) window._origHandleNet = origHandleNet;

  /* ====== BOT CHAT DURING MATCHES ====== */
  const BOT_CHAT = {
    onPlayerSix: [
      { t: "Arre waah! Badhiya shot!", e: "🔥" },
      { t: "Wah bhai wah!", e: "😮" },
      { t: "Kya maar diya!", e: "💪" },
    ],
    onPlayerFour: [
      { t: "Chalo, acha shot tha", e: "👏" },
      { t: "Boundary nice!", e: "👍" },
      { t: "Thik hai thik hai", e: "😏" },
    ],
    onPlayerOut: [
      { t: "Out! Ha ha, maza aaya!", e: "😤" },
      { t: "Bye bye! Out ho gaya!", e: "🤣" },
      { t: "Game over bhai!", e: "😂" },
    ],
    onBotSix: [
      { t: "Dekho bhai, aise hota hai!", e: "😎" },
      { t: "Six! Power game!", e: "🔥" },
      { t: "Mast shot tha!", e: "💪" },
    ],
    onBotFour: [
      { t: "Boundary! Simple game hai", e: "💪" },
      { t: "Four runs easy!", e: "😎" },
      { t: "Chalo score badh raha hai", e: "👍" },
    ],
    onBotOut: [
      { t: "Arre yaar, kismat kharab", e: "😩" },
      { t: "Out ho gaya main bhi...", e: "😢" },
      { t: "Naya batter aayega", e: "🤷" },
    ],
    onPlayerWinning: [
      { t: "Abhi kuch nahi hua, wait karo", e: "😏" },
      { t: "Jeetna abhi baaki hai", e: "🤔" },
      { t: "Dekhte hain...", e: "👀" },
    ],
    onBotWinning: [
      { t: "Haar mat mano bhai!", e: "🤣" },
      { t: "Jeetne wala hun main!", e: "😎" },
      { t: "Score dekho mera!", e: "💪" },
    ],
    onDot: [
      { t: "Koi nahi, agla ball dekho", e: "🤷" },
      { t: "Dot ball, focus bhai!", e: "👀" },
      { t: "Chalo agla aayega", e: "👍" },
    ],
    onOverEnd: [
      { t: "End of over, dhyan se!", e: "👀" },
      { t: "Over khatam! Ready?", e: "🏏" },
      { t: "Naya over, naya plan!", e: "🤔" },
    ],
    onFreeHit: [
      { t: "Free hit hai, maar de!", e: "⚡" },
      { t: "Free hit! Full power!", e: "🔥" },
      { t: "Ab toh maar de!", e: "💪" },
    ],
    onOneToWin: [
      { t: "Bas ek run! Pressure!", e: "😰" },
      { t: "Last ball jaisa hai!", e: "😱" },
      { t: "Ek run door!", e: "👀" },
    ],
    onBotLastBall: [
      { t: "Last ball, dekho kya hota hai!", e: "🍿" },
      { t: "Nervous ho raha hun!", e: "😰" },
      { t: "Ye ball decide karega!", e: "⚡" },
    ],
    onMatchStart: [
      { t: "Chalo shuru karte hain!", e: "🏏" },
      { t: "Game on bhai!", e: "🔥" },
      { t: "Ready ho jao!", e: "💪" },
    ],
    onBigChase: [
      { t: "Bahut target hai, mushkil hoga", e: "😅" },
      { t: "Bada chase hai ye toh!", e: "🤯" },
      { t: "Mehnat lagegi bhai!", e: "💪" },
    ],
  };
  function botChat(eventType) {
    if (
      !G.isBot ||
      (G.storyDifficulty !== undefined && G.storyDifficulty !== 0)
    )
      return;
    const msgs = BOT_CHAT[eventType];
    if (!msgs || msgs.length === 0) return;
    if (Math.random() > 0.5) return;
    const pick = msgs[Math.floor(Math.random() * msgs.length)];
    setTimeout(
      () => {
        showFloatMsg(pick.t, true);
        showFloatEmoji(pick.e, true);
      },
      800 + Math.random() * 1200,
    );
  }
  window.botChat = botChat;
})();
