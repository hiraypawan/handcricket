/* ============================================================================
 FILE: public/js/19-chat.js
 ROLE: QUICK CHAT & BOT BANTER — quick messages & bot taunts float over the
 arena as TEXT + inline-SVG face chips (v2.5: no emoji glyphs anywhere).
 Exposes window.showFloatMsg / showFloatEmoji / botChat (same API as v2.4).
============================================================================ */

/* ====== SVG FACE CHIPS (hand-drawn strokes, not emoji) ====== */
const FACE_COLORS = {
  joy: "#fbbf24", laugh: "#fbbf24", cheer: "#fbbf24",
  grin: "#c4b5fd", cool: "#5eead4", think: "#c4b5fd",
  sad: "#fb7185", anger: "#fb7185",
  wow: "#93c5fd", panic: "#93c5fd", sweat: "#7dd3fc",
  peek: "#7ef0dd", shrug: "#94a3b8", flex: "#fbbf24", clap: "#fbbf24",
};
// legacy emoji tokens (old peers / old saves) -> v2.5 mood faces
const LEGACY_EMOJI_TO_MOOD = {
  "🔥": "cheer", "⚡": "cheer", "🏏": "cheer", "⚾": "cheer",
  "😮": "wow", "😱": "panic", "😰": "sweat", "😅": "sweat",
  "💪": "flex", "👍": "clap", "👏": "clap", "🤝": "joy",
  "😏": "grin", "🤔": "think", "😤": "anger", "😩": "sad", "😢": "sad",
  "🤣": "laugh", "😂": "laugh", "😎": "cool",
  "🤷": "shrug", "👀": "peek", "🍿": "sweat", "🤯": "panic",
  "🎉": "joy", "💎": "joy", "👑": "joy", "🏆": "joy", "⭐": "joy",
  "🥇": "joy", "🥈": "joy", "🥉": "joy", "💥": "cool", "🎯": "cool",
  "🎳": "cool", "🤖": "cheer", "👤": "cheer", "📖": "think", "🔄": "think",
};
const FACE_EYES = {
  joy: '<path d="M7.6 10q1.35-1.9 2.9 0"/><path d="M13.5 10q1.35-1.9 2.9 0"/>',
  cheer: '<path d="M7.6 10q1.35-1.9 2.9 0"/><path d="M13.5 10q1.35-1.9 2.9 0"/>',
  laugh: '<path d="M7.2 9.8q1.7-2 3.3 0"/><path d="M13.5 9.8q1.7-2 3.3 0"/>',
  flex: '<path d="M7.6 10q1.35-1.9 2.9 0"/><path d="M13.5 10q1.35-1.9 2.9 0"/>',
  clap: '<path d="M7.6 10q1.35-1.9 2.9 0"/><path d="M13.5 10q1.35-1.9 2.9 0"/>',
  grin: '<circle cx="9.1" cy="10.6" r="1"/><circle cx="14.9" cy="10.6" r="1"/><path d="M9.6 8.4q3-.6 4.8.4" opacity=".55"/>',
  cool: '<path d="M6.6 9.4h10.8v3H6.6z"/><path d="M6.6 9.4v-1M17.4 9.4v-1" opacity=".7"/>',
  think: '<circle cx="9.2" cy="10.6" r="1"/><path d="M13.6 9.4q1.4-.9 2.6.3" opacity=".8"/>',
  sad: '<circle cx="9.1" cy="10.6" r="1.05"/><circle cx="14.9" cy="10.6" r="1.05"/><path d="M15.7 10.9l.9 1.1" stroke-linecap="round"/>',
  anger: '<path d="M8 8.2l2.6.8M16 8.2l-2.6.8"/><circle cx="9.1" cy="11.2" r="1"/><circle cx="14.9" cy="11.2" r="1"/>',
  wow: '<circle cx="9.2" cy="9.8" r="1.2"/><circle cx="14.8" cy="9.8" r="1.2"/>',
  panic: '<circle cx="9.2" cy="9.6" r="1.2"/><circle cx="14.8" cy="9.6" r="1.2"/><path d="M9 7.6q.9-1.1 2-1M15 7.6q-.9-1.1-2-1" opacity=".6"/>',
  sweat: '<path d="M7.6 10.8q1.35 1.7 2.9 0"/><path d="M13.5 10.8q1.35 1.7 2.9 0"/><circle cx="16.6" cy="9" r="1" fill="currentColor" stroke="none" opacity=".85"/>',
  peek: '<circle cx="8.9" cy="10.4" r="1.8"/><circle cx="15.1" cy="10.4" r="1.8"/>',
  shrug: '<circle cx="9.2" cy="10.8" r=".9"/><circle cx="14.8" cy="10.8" r=".9"/>',
};
const FACE_MOUTHS = {
  joy: '<path d="M8.8 13.6q3.2 3.1 6.4 0" fill="none"/>',
  cheer: '<path d="M8.6 13.4q3.4 3.2 6.8 0" fill="none"/>',
  laugh: '<path d="M8 13.2q4 4.4 8 0Z" fill="currentColor" opacity=".9"/>',
  flex: '<path d="M8.8 13.4q3.2 3.2 6.4 0" fill="none"/><path d="M6.9 15.2q.6 1 1.8 1.6M17.1 15.2q-.6 1-1.8 1.6" fill="none" opacity=".7"/>',
  clap: '<path d="M8.8 13.6q3.2 3 6.4 0" fill="none"/><path d="M10 15.6h4M9.2 17.2h5.6" opacity=".8"/>',
  grin: '<path d="M8.8 14.4q3.2 2.1 6.4 0" fill="none"/><path d="M15.3 14.5q.5.3.5 1.1" fill="none" opacity=".7"/>',
  cool: '<path d="M9 14.2q3 2.6 6 0" fill="none"/>',
  think: '<path d="M9 15q1 1.2 2.1.1t2.2.1 2.7-1.4" fill="none"/>',
  sad: '<path d="M9 16.4q3-2.6 6 0" fill="none"/>',
  anger: '<path d="M8.8 16.2q3.2-2.5 6.4 0" fill="none"/>',
  wow: '<ellipse cx="12" cy="14.6" rx="1.9" ry="2.4" fill="none"/>',
  panic: '<path d="M10.2 14.4q1.8 1.9 3.6 0" fill="none"/><path d="M10 14.4h4M10.2 15.8h3.6" opacity=".75"/>',
  sweat: '<path d="M9.2 14.4q1.3 1.3 2.8 0t2.8 0" fill="none"/>',
  peek: '<path d="M9.6 14.6h4.8" stroke-linecap="round"/>',
  shrug: '<path d="M9.8 15.6q1 1.4 2.2 0 1.2 1.4 2.2 0" fill="none"/>',
};
function faceSVG(tok) {
  const eyes = FACE_EYES[tok] || FACE_EYES.cheer;
  const mouth = FACE_MOUTHS[tok] || FACE_MOUTHS.cheer;
  const c = FACE_COLORS[tok] || "#fbbf24";
  return (
    '<svg class="face-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
    'style="color:' + c + '">' +
    '<circle cx="12" cy="12" r="9.3" opacity=".9"/>' +
    eyes + mouth +
    "</svg>"
  );
}
function moodFromLegacy(emoji) {
  return (emoji && LEGACY_EMOJI_TO_MOOD[emoji]) || "cheer";
}
function escTxt(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ====== FLOAT BUBBLES ====== */
(function () {
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
      // v2.5: no emoji quick-fire buttons — only quick messages remain.
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
      showFloatMsg(msg, false, "cheer");
    });
  }
  function showFloatMsg(msg, isOpponent, faceTok) {
    const el = document.createElement("div");
    el.className = "float-msg " + (isOpponent ? "left" : "right");
    const face = faceTok ? '<span class="face-chip">' + faceSVG(faceTok) + "</span>" : "";
    const text = msg && String(msg).length ? "<span class='float-text'>" + escTxt(msg) + "</span>" : "";
    el.innerHTML = face + text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function showFloatEmoji(emoji, isOpponent) {
    // Legacy peer sent an emoji glyph — render it as a mood face chip.
    showFloatMsg("", isOpponent, moodFromLegacy(emoji));
  }
  window.showFloatMsg = showFloatMsg;
  window.showFloatEmoji = showFloatEmoji;

  /* ====== BOT CHAT DURING MATCHES ====== */
  /* v2.7.1 BANTER DIRECTION RULE: every line the bot speaks is ABOUT THE
     OTHER SIDE. When the bot is BATTING it roasts the (player) bowler; when
     the bot is BOWLING it reacts to the (player) batter. Never self-praise,
     never self-pity. Pools named onPlayer* fire for the player's action,
     onBot* for the bot's action (lines aimed at the player either way). */
  const BOT_CHAT = {
    // player is BATTING (bot bowls): react to the player's shot / wicket
    onPlayerSix: [
      { t: "Arre waah! Badhiya shot!", f: "wow" },
      { t: "Kya maar diya yaar!", f: "panic" },
      { t: "Ok ok, maan gaya — acha shot!", f: "sweat" },
    ],
    onPlayerFour: [
      { t: "Chalo, acha shot tha", f: "clap" },
      { t: "Boundary nice!", f: "clap" },
      { t: "Thik hai thik hai", f: "grin" },
    ],
    onPlayerOut: [
      { t: "Out! Ha ha, maza aaya!", f: "laugh" },
      { t: "Bye bye! Out ho gaya!", f: "laugh" },
      { t: "Meri ball, tera out!", f: "joy" },
    ],
    // bot is BATTING: roast the player's bowling (never "aise hota hai")
    onBotSix: [
      { t: "Aisi bowling se kaise rokoge?", f: "cool" },
      { t: "Teri ball toh makkhan hai!", f: "flex" },
      { t: "Bowler bhai, thoda dum laao!", f: "grin" },
    ],
    onBotFour: [
      { t: "Four easy — teri line hi galat hai!", f: "grin" },
      { t: "Boundary! Bowling mein mehnat kar!", f: "cool" },
      { t: "Aise hi chalta rahega tera over?", f: "peek" },
    ],
    onBotOut: [
      { t: "Ok ok, achhi ball thi teri", f: "shrug" },
      { t: "Waah bowling! Hairaan hun", f: "wow" },
      { t: "Tujhe bowling aati hai bhai!", f: "clap" },
    ],
    // dot balls: side-aware
    onDotBowling: [
      { t: "Bat lagta hi nahi tujhe!", f: "grin" },
      { t: "Dekha? Miss! Agla ball!", f: "peek" },
      { t: "Aise hi dot chahiye mujhe!", f: "cool" },
    ],
    onDotBatting: [
      { t: "Achhi ball thi teri", f: "shrug" },
      { t: "Ok ok, tight bowling", f: "think" },
      { t: "Teri ball maarna mushkil hai", f: "sweat" },
    ],
    // over breaks: side-aware
    onOverEndBowling: [
      { t: "Over khatam! Itne hi run?", f: "grin" },
      { t: "Mera over kaisa laga, batter sahab?", f: "cool" },
    ],
    onOverEndBatting: [
      { t: "Over mein kuch nahi mila tujhe!", f: "peek" },
      { t: "Ek over gaya, bowler thak gaya?", f: "grin" },
    ],
    // free hit: side-aware
    onFreeHitBowling: [
      { t: "Free hit? Maar ke dikha!", f: "grin" },
      { t: "Dekhta hun kaise maarta hai!", f: "peek" },
    ],
    onFreeHitBatting: [
      { t: "Ab bachke bowler, free hit!", f: "flex" },
      { t: "Teri kismat isi ball se!", f: "cool" },
    ],
    // match flow
    onMatchStart: [
      { t: "Chalo shuru karte hain!", f: "cheer" },
      { t: "Game on bhai!", f: "flex" },
      { t: "Ready ho jao!", f: "grin" },
    ],
    onPlayerWinning: [
      { t: "Abhi kuch nahi hua, wait karo", f: "grin" },
      { t: "Jeetna abhi baaki hai", f: "think" },
      { t: "Dekhte hain...", f: "peek" },
    ],
    onBotWinning: [
      { t: "Tera plan kya hai ab?", f: "grin" },
      { t: "Itna peeche hai tu? Catch up kar!", f: "cool" },
      { t: "Pressure mein hai tu!", f: "flex" },
    ],
    onOneToWinBotBowling: [
      { t: "Ek run chahiye tujhe? Rokunga!", f: "peek" },
      { t: "Last ball pressure, batter sahab!", f: "grin" },
    ],
    onOneToWinBotBatting: [
      { t: "Ek run chahiye — teri ball, mera shot!", f: "cool" },
      { t: "Ab dekh bowler, finish!", f: "flex" },
    ],
    onBigChaseBotBowling: [
      { t: "Bada target hai tere liye, good luck!", f: "grin" },
      { t: "Itna chase karna aasan nahi!", f: "cool" },
    ],
    onBigChaseBotBatting: [
      { t: "Itna bada score? Dekh tujhe defend karna!", f: "flex" },
      { t: "Bada target — dekh tujhe defend karna!", f: "cool" },
    ],
  };
  // exposed for the smoke suite: banter must never be self-directed
  window.BOT_CHAT_POOLS = BOT_CHAT;

  function pickBanter(eventType) {
    const msgs = BOT_CHAT[eventType];
    if (!msgs || msgs.length === 0) return null;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  window.botChatPick = pickBanter;
  function botChat(eventType) {
    if (
      !G.isBot ||
      (G.storyDifficulty !== undefined && G.storyDifficulty !== 0)
    )
      return;
    const pick = pickBanter(eventType);
    if (!pick) return;
    if (Math.random() > 0.5) return;
    setTimeout(
      () => {
        showFloatMsg(pick.t, true, pick.f);
      },
      800 + Math.random() * 1200,
    );
  }
  window.botChat = botChat;
})();
