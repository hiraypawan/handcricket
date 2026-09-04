/* ============================================================================
 FILE: public/js/04-hands.js
 ROLE: HAND RENDERER — HandRenderer (pure-CSS/SVG cartoon hands, STATES/PAL), getHandSVG(), buildArenaHand(), setHandGesture(). Depends on: nothing.
============================================================================ */

/* ====== HAND RENDERER — illustrated cartoon hands ====== */
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
  // Skin palettes
  PAL: {
    teal: {
      m: "#2a9d8f",
      l: "#3ec4b4",
      d: "#1a6b60",
      a: "#d4a574",
      wb: "#1a5c52",
    },
    orange: {
      m: "#c87850",
      l: "#da9470",
      d: "#8a5030",
      a: "#d4a574",
      wb: "#6a3818",
    },
  },
  draw(num, isLeft) {
    const pal = isLeft ? this.PAL.teal : this.PAL.orange;
    const s = this.STATES[num] || this.STATES[0];
    const sw = 5;
    const flip = isLeft ? -1 : 1;
    const ox = isLeft ? 200 : 0;
    let svg =
      '<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">';
    svg += '<g transform="translate(' + ox + ",0) scale(" + flip + ',1)">';
    // Shadow under hand
    svg += '<ellipse cx="100" cy="248" rx="45" ry="8" fill="rgba(0,0,0,.12)"/>';
    // ARM — skin tone forearm
    svg +=
      '<path d="M-8 110 Q-4 100 10 96 L90 96 Q100 96 104 104 L108 110 Q112 118 112 128 L112 160 Q112 170 104 174 L10 174 Q-2 174 -8 166 Z" fill="' +
      pal.a +
      '" stroke="#fff" stroke-width="' +
      sw +
      '" stroke-linejoin="round"/>';
    // WRISTBAND — team color
    svg +=
      '<rect x="76" y="104" width="34" height="56" rx="14" fill="' +
      pal.wb +
      '" stroke="#fff" stroke-width="' +
      sw +
      '" stroke-linejoin="round"/>';
    // Wristband stripes
    svg +=
      '<rect x="80" y="112" width="26" height="4" rx="2" fill="' +
      pal.m +
      '" opacity=".4"/>';
    svg +=
      '<rect x="80" y="122" width="26" height="4" rx="2" fill="' +
      pal.m +
      '" opacity=".4"/>';
    svg +=
      '<rect x="80" y="132" width="26" height="4" rx="2" fill="' +
      pal.m +
      '" opacity=".4"/>';
    svg +=
      '<rect x="80" y="142" width="26" height="4" rx="2" fill="' +
      pal.m +
      '" opacity=".4"/>';
    // PALM — organic curved shape
    svg +=
      '<path d="M76 170 Q72 120 82 108 Q90 100 100 96 Q118 90 132 96 Q148 104 152 120 Q156 136 154 152 Q152 164 146 170 Q134 180 118 184 Q100 186 86 180 Z" fill="' +
      pal.m +
      '" stroke="#fff" stroke-width="' +
      sw +
      '" stroke-linejoin="round"/>';
    // PALM HIGHLIGHT
    svg +=
      '<path d="M90 118 Q98 112 112 114 Q130 116 138 122" fill="none" stroke="' +
      pal.l +
      '" stroke-width="3" opacity=".3" stroke-linecap="round"/>';
    // PALM CREASES — knuckle lines
    svg +=
      '<path d="M84 128 Q96 122 110 126" fill="none" stroke="#fff" stroke-width="1.5" opacity=".2" stroke-linecap="round"/>';
    svg +=
      '<path d="M82 140 Q98 134 116 138" fill="none" stroke="#fff" stroke-width="1.5" opacity=".18" stroke-linecap="round"/>';
    svg +=
      '<path d="M86 152 Q100 148 120 150" fill="none" stroke="#fff" stroke-width="1.2" opacity=".15" stroke-linecap="round"/>';
    // FINGERS — each is a detailed cartoon shape
    // Finger data: [baseX, upTipY, downTipY, width, upHeight, downHeight, rotation, xSplay]
    const fingers = [
      { x: 84, tyu: 22, tyd: 52, w: 18, hu: 80, hd: 38, rot: -5 }, // index
      { x: 102, tyu: 14, tyd: 44, w: 19, hu: 88, hd: 42, rot: 0 }, // middle
      { x: 120, tyu: 24, tyd: 54, w: 17, hu: 74, hd: 36, rot: 4 }, // ring
      { x: 136, tyu: 40, tyd: 66, w: 14, hu: 56, hd: 28, rot: 8 }, // pinky
    ];
    for (let i = 0; i < 4; i++) {
      const f = fingers[i];
      if (s[i + 1]) {
        // FINGER UP — full length, team color
        const tipX = f.x + f.w / 2;
        // Main finger body (2 phalanges)
        svg +=
          '<path d="M' +
          f.x +
          " " +
          (f.tyu + f.hu) +
          " Q" +
          (f.x - 2) +
          " " +
          (f.tyu + f.hu * 0.5) +
          " " +
          tipX +
          " " +
          f.tyu +
          " Q" +
          (f.x + f.w + 2) +
          " " +
          (f.tyu + f.hu * 0.5) +
          " " +
          (f.x + f.w) +
          " " +
          (f.tyu + f.hu) +
          ' Z" fill="' +
          pal.m +
          '" stroke="#fff" stroke-width="' +
          sw +
          '" stroke-linejoin="round" transform="rotate(' +
          f.rot +
          " " +
          tipX +
          " " +
          (f.tyu + f.hu) +
          ')"/>';
        // Fingertip highlight
        svg +=
          '<ellipse cx="' +
          tipX +
          '" cy="' +
          (f.tyu + 8) +
          '" rx="' +
          f.w * 0.3 +
          '" ry="4" fill="' +
          pal.l +
          '" opacity=".25" transform="rotate(' +
          f.rot +
          " " +
          tipX +
          " " +
          (f.tyu + f.hu) +
          ')"/>';
        // Knuckle crease line
        svg +=
          '<line x1="' +
          (f.x + 3) +
          '" y1="' +
          (f.tyu + f.hu * 0.55) +
          '" x2="' +
          (f.x + f.w - 3) +
          '" y2="' +
          (f.tyu + f.hu * 0.55) +
          '" stroke="#fff" stroke-width="1.2" opacity=".18" stroke-linecap="round" transform="rotate(' +
          f.rot +
          " " +
          tipX +
          " " +
          (f.tyu + f.hu) +
          ')"/>';
        // Second knuckle crease
        svg +=
          '<line x1="' +
          (f.x + 4) +
          '" y1="' +
          (f.tyu + f.hu * 0.28) +
          '" x2="' +
          (f.x + f.w - 4) +
          '" y2="' +
          (f.tyu + f.hu * 0.28) +
          '" stroke="#fff" stroke-width="1" opacity=".12" stroke-linecap="round" transform="rotate(' +
          f.rot +
          " " +
          tipX +
          " " +
          (f.tyu + f.hu) +
          ')"/>';
      } else {
        // FINGER DOWN — curled, darker, shorter
        const cx = f.x;
        const cy = f.tyd;
        const cw = f.w;
        const ch = f.hd;
        svg +=
          '<path d="M' +
          cx +
          " " +
          (cy + ch) +
          " Q" +
          (cx + 2) +
          " " +
          (cy + ch * 0.3) +
          " " +
          (cx + cw / 2) +
          " " +
          cy +
          " Q" +
          (cx + cw - 2) +
          " " +
          (cy + ch * 0.3) +
          " " +
          (cx + cw) +
          " " +
          (cy + ch) +
          ' Z" fill="' +
          pal.d +
          '" stroke="#fff" stroke-width="' +
          sw +
          '" stroke-linejoin="round" opacity=".5" transform="rotate(' +
          f.rot * 0.3 +
          " " +
          (cx + cw / 2) +
          " " +
          (cy + ch) +
          ')"/>';
        // Curled knuckle bump
        svg +=
          '<ellipse cx="' +
          (cx + cw / 2) +
          '" cy="' +
          cy +
          '" rx="' +
          cw * 0.35 +
          '" ry="3" fill="' +
          pal.m +
          '" opacity=".3" transform="rotate(' +
          f.rot * 0.3 +
          " " +
          (cx + cw / 2) +
          " " +
          (cy + ch) +
          ')"/>';
      }
    }
    // THUMB
    if (s[0]) {
      // Thumb UP — extended from palm side
      svg +=
        '<path d="M78 148 Q68 128 64 108 Q62 92 68 84 Q76 78 82 86 Q88 96 86 112 Q84 128 80 142 Z" fill="' +
        pal.m +
        '" stroke="#fff" stroke-width="' +
        sw +
        '" stroke-linejoin="round"/>';
      // Thumb knuckle crease
      svg +=
        '<line x1="72" y1="100" x2="78" y2="106" stroke="#fff" stroke-width="1.2" opacity=".2" stroke-linecap="round"/>';
      // Thumbnail
      svg +=
        '<ellipse cx="70" cy="88" rx="5" ry="4" fill="' +
        pal.l +
        '" opacity=".2"/>';
    } else {
      // Thumb DOWN — curled against palm
      svg +=
        '<path d="M78 156 Q72 146 70 136 Q68 126 72 120 Q78 116 82 124 Q84 132 82 144 Z" fill="' +
        pal.d +
        '" stroke="#fff" stroke-width="' +
        sw +
        '" stroke-linejoin="round" opacity=".5"/>';
    }
    svg += "</g></svg>";
    return svg;
  },
};

// Backward compat
function getHandSVG(num, isPlayer) {
  return HandRenderer.draw(num === null ? null : num, isPlayer);
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

