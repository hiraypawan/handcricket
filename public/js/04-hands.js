/* ============================================================================
 FILE: public/js/04-hands.js
 ROLE: HAND RENDERER — HandRenderer (flat modern vector hands), getHandSVG(),
       buildArenaHand(), setHandGesture(). Depends on: nothing.
 STYLE (v2.5): natural skin tones, soft shading, articulated capsule fingers
       that fan outward when raised, subtle outline, coloured cuff per side.
============================================================================ */

const HandRenderer = {
  // Finger state map: [thumb, index, middle, ring, pinky] — 1=up 0=down
  STATES: {
    0: [0, 0, 0, 0, 0],
    1: [0, 1, 0, 0, 0],
    2: [0, 1, 1, 0, 0],
    3: [0, 1, 1, 1, 0],
    4: [0, 1, 1, 1, 1],
    5: [1, 1, 1, 1, 1],
    6: [1, 0, 0, 0, 0],
  },
  // Poses for fingers: [knuckleX, width, upLength] — drawn from the knuckle
  // line (y=138) upward; knuckles fan slightly for a natural spread.
  FINGERS: [
    { x: 88, w: 23, len: 104, rot: -7 }, // index
    { x: 113, w: 24, len: 114, rot: -2 }, // middle
    { x: 137, w: 23, len: 103, rot: 4 }, // ring
    { x: 158, w: 20, len: 88, rot: 12 }, // pinky
  ],
  KNUCKLE_Y: 138,

  // Skin + cuff palettes (right/player = gold cuff, left/opponent = violet)
  PAL: {
    skin: {
      m: "#e2a375",
      mid: "#cf8b5b",
      d: "#b57045",
      outline: "rgba(122,63,28,.38)",
      gloss: "rgba(255,240,222,.6)",
      nail: "rgba(255,228,205,.95)",
    },
    cuff: { player: "#f2b02e", opp: "#8b7cf6" },
  },

  draw(num, isPlayer) {
    const s = this.STATES[num] || this.STATES[0];
    const skin = this.PAL.skin;
    const cuff = isPlayer ? this.PAL.cuff.player : this.PAL.cuff.opp;
    const tag = isPlayer ? "p" : "o"; // unique gradient ids per side
    // Per-shape vertical shading: objectBoundingBox maps light->deep on each
    // finger/palm/forearm, so the whole hand reads rounded under one light.
    const SF = "url(#sk" + tag + ")";
    const CF = "url(#cf" + tag + ")";
    const defs =
      '<defs><linearGradient id="sk' + tag + '" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f6c08e"/><stop offset="0.45" stop-color="#e6a676"/>' +
      '<stop offset="1" stop-color="#b9774a"/>' +
      "</linearGradient>" +
      '<linearGradient id="cf' + tag + '" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">' +
      (isPlayer
        ? '<stop offset="0" stop-color="#ffd675"/><stop offset="1" stop-color="#dc9b18"/>'
        : '<stop offset="0" stop-color="#a699fa"/><stop offset="1" stop-color="#6856dd"/>') +
      "</linearGradient></defs>";
    const up = (x, y, w, h, r, extra) =>
      ['<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"',
        ' fill="' + SF + '" stroke="' + skin.outline + '" stroke-width="1.4"',
        extra ? ' ' + extra : '',
        "/>",]
        .join("");
    const g = (inner, tx, flip) =>
      '<g transform="translate(' + (tx || 0) + ',0) scale(' + (flip ? -1 : 1) + ',1)">' + inner + "</g>";
    const mirror = !isPlayer;
    const tx = mirror ? 240 : 0;
    const fl = mirror ? -1 : 1;

    let svg =
      '<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">';
    svg += defs;
    svg +=
      '<g transform="translate(' + tx + ',0) scale(' + fl + ',1)">'; // mirror wrapper
    // Zoom the art ~32% horizontally about its centre so the hand fills the
    // 240x300 canvas side-to-side (was using only ~47% of the width).
    svg += '<g transform="translate(120,0) scale(1.32,1) translate(-120,0)">';
    svg += '<g>';

    // soft ground shadow
    svg +=
      '<ellipse cx="120" cy="288" rx="62" ry="7" fill="rgba(0,0,0,.18)"/>';

    // ---- wrist / forearm (drawn from bottom up, hidden behind cuff) ----
    svg +=
      '<path d="M74 300 Q72 270 76 250 L164 250 Q168 270 166 300 Z" fill="' +
      SF + '" stroke="' + skin.outline + '" stroke-width="1.2"/>';
    // forearm side shading for volume
    svg +=
      '<path d="M82 300 Q80 278 84 262" stroke="rgba(0,0,0,.14)" stroke-width="3" fill="none" stroke-linecap="round"/>';

    // ---- cuff (coloured band with accent stripe) ----
    svg +=
      '<path d="M76 248 Q74 232 80 224 L160 224 Q166 232 164 248 Z" fill="' +
      CF + '" stroke="' + skin.outline + '" stroke-width="1.4"/>';
    svg +=
      '<path d="M80 230 Q120 226 160 230" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>';
    svg +=
      '<path d="M82 240 Q120 237 158 240" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round"/>';

    // ---- palm (soft rounded, wider at knuckles, narrower at wrist) ----
    svg +=
      '<path d="M66 232 Q62 176 74 144 Q92 126 120 126 Q148 126 166 144 Q178 176 174 232 Q150 240 120 240 Q90 240 66 232 Z"' +
      ' fill="' + SF + '" stroke="' + skin.outline + '" stroke-width="1.4"/>';
    // palm gloss (upper-left light)
    svg +=
      '<path d="M84 152 Q104 138 124 138 Q142 140 154 152" fill="none" stroke="' +
      skin.gloss + '" stroke-width="8" opacity=".55" stroke-linecap="round"/>';
    // palm creases
    svg +=
      '<path d="M84 168 Q108 160 128 162" fill="none" stroke="rgba(122,63,28,.16)" stroke-width="2" stroke-linecap="round"/>';
    svg +=
      '<path d="M88 186 Q108 180 126 182" fill="none" stroke="rgba(122,63,28,.13)" stroke-width="2" stroke-linecap="round"/>';
    svg +=
      '<path d="M96 202 Q112 198 126 200" fill="none" stroke="rgba(122,63,28,.1)" stroke-width="2" stroke-linecap="round"/>';

    // ---- fingers ----
    const K = this.KNUCKLE_Y;
    for (let i = 0; i < this.FINGERS.length; i++) {
      const f = this.FINGERS[i];
      const cx = f.x;
      if (s[i + 1]) {
        // RAISED finger — full-length capsule with rounded tip + nail
        const tipY = K - f.len;
        svg +=
          '<g transform="rotate(' + f.rot + " " + cx + " " + K + ')">';
        svg += up(cx - f.w / 2, tipY + 6, f.w, f.len - 6, f.w / 2);
        // tip gloss
        svg +=
          '<ellipse cx="' + cx + '" cy="' + (tipY + 14) + '" rx="' + f.w * 0.3 +
          '" ry="' + f.w * 0.16 + '" fill="' + skin.gloss + '" opacity=".65"/>';
        // nail
        svg +=
          '<ellipse cx="' + cx + '" cy="' + (tipY + 8) + '" rx="' + f.w * 0.26 +
          '" ry="' + f.w * 0.3 + '" fill="' + skin.nail + '" opacity=".9"/>';
        // knuckle crease
        svg +=
          '<path d="M' + (cx - f.w * 0.34) + " " + (K - 10) + " L" + (cx + f.w * 0.34) +
          " " + (K - 10) + '" stroke="rgba(122,63,28,.18)" stroke-width="1.4" stroke-linecap="round"/>';
        svg += "</g>";
      } else {
        // CURLED finger — compact knuckle bump
        svg +=
          '<g transform="rotate(' + f.rot * 0.4 + " " + cx + " " + K + ')">';
        svg +=
          '<rect x="' + (cx - f.w / 2) + '" y="' + (K - 24) + '" width="' + f.w +
          '" height="26" rx="' + f.w / 2 + '" fill="' + SF +
          '" stroke="' + skin.outline + '" stroke-width="1.3"/>';
        svg +=
          '<ellipse cx="' + cx + '" cy="' + (K - 20) + '" rx="' + f.w * 0.24 +
          '" ry="4" fill="' + skin.gloss + '" opacity=".4"/>';
        svg += "</g>";
      }
    }

    // ---- thumb (raised only for states 5 & 6; curled otherwise) ----
    const tx2 = 70;
    const ty2 = 150;
    if (s[0]) {
      // raised thumb — capsule angled up-left
      svg +=
        '<g transform="rotate(-38 ' + tx2 + " " + ty2 + ')">';
      svg += up(tx2 - 10, ty2 - 66, 20, 70, 10);
      svg +=
        '<ellipse cx="' + tx2 + '" cy="' + (ty2 - 62) + '" rx="4.5" ry="6" fill="' +
        skin.nail + '" opacity=".9"/>';
      svg += "</g>";
      // thumb base shading
      svg +=
        '<ellipse cx="72" cy="158" rx="12" ry="10" fill="' + skin.d + '" opacity=".25"/>';
    } else {
      // curled thumb across the palm base
      svg +=
        '<g transform="rotate(18 74 178)">';
      svg += up(64, 150, 19, 52, 9.5);
      svg +=
        '<ellipse cx="73" cy="156" rx="4" ry="5" fill="' + skin.nail + '" opacity=".8"/>';
      svg += "</g>";
    }

    svg += "</g>";
    svg += "</g>"; // close zoom
    svg += "</g>"; // close mirror
    svg += "</svg>";
    return svg;
  },
};

// Backward-compatible aliases (used across modules & the smoke suite)
function getHandSVG(num, isPlayer) {
  return HandRenderer.draw(num === null || num === undefined ? null : num, !!isPlayer);
}

function buildArenaHand(host) {
  if (!host || host.dataset.built) return;
  host.dataset.built = "1";
  const isPlayer = host.id === "arenaPlayer";
  host.innerHTML = getHandSVG(null, isPlayer);
}
function setHandGesture(imgEl, wrapperEl, v) {
  const arena = wrapperEl.querySelector(".arena-hand");
  if (!arena) return;
  const isPlayer = arena.id === "arenaPlayer";
  if (v === null || v === undefined) {
    arena.innerHTML = getHandSVG(null, isPlayer);
    wrapperEl.classList.remove("shake", "reveal");
    return;
  }
  arena.innerHTML = getHandSVG(v, isPlayer);
  wrapperEl.classList.remove("shake", "reveal");
  void wrapperEl.offsetWidth;
  wrapperEl.classList.add("reveal");
  setTimeout(() => wrapperEl.classList.remove("reveal"), 650);
}
