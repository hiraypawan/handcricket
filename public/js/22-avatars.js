/* ---------------------------------------------------------------------------
   22-avatars.js — deterministic generated avatars.

   Every avatar in the app used to be one initial inside a gradient circle, so
   a friend list looked like a row of identical placeholders. These are drawn
   from a hash of the name, which means:
     - the same name always produces the same face, on every device
     - no image assets to ship (it is inline SVG, crisp at any DPI)
     - no network, no licence, no binary in the repo

   The face is deliberately abstract (skin tone, hair shape, accessory, shirt)
   rather than a portrait — it reads as a person without pretending to be one.
   ------------------------------------------------------------------------ */
(function () {
  "use strict";

  const SKIN = ["#f2c9a0", "#e0a878", "#c98a5c", "#a86a3d", "#8a5230", "#6b3d21"];
  const HAIR = ["#1f1a17", "#3b2a20", "#5c3a21", "#8a5a2b", "#2b2b33", "#7a1f2b"];
  const SHIRT = ["#fbbf24", "#2dd4bf", "#a78bfa", "#fb7185", "#7dd3fc", "#4ade80", "#f97316", "#e879f9"];
  const BG = ["#123047", "#0f3b3a", "#2a1f4d", "#43202e", "#133a52", "#1d3a24", "#3d2410", "#33204a"];
  const HAIRSTYLES = 6;
  const ACCESSORIES = 5; // none, cap, band, glasses, beard

  function hash32(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* One hash, several non-overlapping slices, so changing the palette never
     reshuffles every face at once. */
  function parts(name) {
    const h = hash32(String(name || "?").toLowerCase().trim());
    return {
      skin: SKIN[(h >>> 3) % SKIN.length],
      hair: HAIR[(h >>> 9) % HAIR.length],
      shirt: SHIRT[(h >>> 15) % SHIRT.length],
      bg: BG[(h >>> 21) % BG.length],
      style: (h >>> 5) % HAIRSTYLES,
      acc: (h >>> 12) % ACCESSORIES,
    };
  }

  function hairPath(style, hair) {
    const f = 'fill="' + hair + '"';
    switch (style) {
      case 0: return '<path ' + f + ' d="M21 40c0-12 8-19 19-19s19 7 19 19c0-8-6-12-19-12S21 32 21 40z"/>';
      case 1: return '<path ' + f + ' d="M20 42c-1-14 9-22 20-22s21 8 20 22c-3-6-6-9-9-9-4 3-18 3-22 0-3 0-6 3-9 9z"/>';
      case 2: return '<path ' + f + ' d="M22 38c1-11 9-17 18-17s17 6 18 17c-4-4-8-6-12-5-4-3-14-3-18 0-2 1-4 3-6 5z"/>';
      case 3: return '<path ' + f + ' d="M19 44c0-15 10-24 21-24s21 9 21 24c0 0-4-13-21-13S19 44 19 44z"/>';
      case 4: return '<path ' + f + ' d="M24 34c2-8 8-13 16-13s14 5 16 13c-2-3-5-5-8-4-5 2-11 2-16 0-3-1-6 1-8 4z"/><circle ' + f + ' cx="40" cy="20" r="6"/>';
      default: return '<path ' + f + ' d="M23 40c0-11 8-18 17-18s17 7 17 18c-3-5-7-8-11-7-4 1-8 1-12 0-4-1-8 2-11 7z"/>';
    }
  }

  function accessory(acc, hair) {
    switch (acc) {
      case 1: // cap
        return '<path fill="' + hair + '" d="M19 33c0-8 9-14 21-14s21 6 21 14z"/><rect fill="' + hair + '" x="16" y="32" width="48" height="5" rx="2.5"/>';
      case 2: // headband
        return '<rect fill="#fb7185" x="19" y="31" width="42" height="6" rx="3"/>';
      case 3: // glasses
        return '<g fill="none" stroke="#1f2937" stroke-width="2.4"><circle cx="31" cy="45" r="6.4"/><circle cx="49" cy="45" r="6.4"/><path d="M37.4 45h5.2M24.6 44l-4-1.6M55.4 44l4-1.6"/></g>';
      case 4: // beard
        return '<path fill="' + hair + '" d="M27 52c0 10 6 16 13 16s13-6 13-16c-3 5-8 7-13 7s-10-2-13-7z" opacity=".92"/>';
      default:
        return "";
    }
  }

  /* Returns an <svg> string. `size` is the rendered box in px. */
  function avatarSvg(name, size) {
    const p = parts(name);
    const px = size || 44;
    const initial = String(name || "?").trim().charAt(0).toUpperCase();
    return (
      '<svg viewBox="0 0 80 80" width="' + px + '" height="' + px + '" role="img" ' +
      'aria-label="Avatar for ' + String(name || "").replace(/"/g, "&quot;") + '" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="80" height="80" fill="' + p.bg + '"/>' +
      '<circle cx="40" cy="34" r="11" fill="#fff" opacity=".05"/>' +
      // shoulders / shirt
      '<path fill="' + p.shirt + '" d="M12 80c0-15 12-24 28-24s28 9 28 24z"/>' +
      '<path fill="#000" opacity=".14" d="M12 80c0-15 12-24 28-24s28 9 28 24z" transform="translate(0,3)"/>' +
      // neck + head
      '<rect x="35" y="52" width="10" height="10" fill="' + p.skin + '"/>' +
      '<circle cx="40" cy="44" r="17" fill="' + p.skin + '"/>' +
      hairPath(p.style, p.hair) +
      // eyes
      '<circle cx="33.5" cy="45" r="2.1" fill="#1f2937"/>' +
      '<circle cx="46.5" cy="45" r="2.1" fill="#1f2937"/>' +
      // smile
      '<path d="M34 53q6 4.6 12 0" stroke="#1f2937" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      accessory(p.acc, p.hair) +
      "</svg>"
    );
  }

  /* Drop-in replacement for the old "<div class=avatar>initial</div>" markup. */
  function avatarHtml(name, size, extraClass) {
    const px = size || 44;
    return (
      '<div class="avatar-art ' + (extraClass || "") + '" style="width:' + px + "px;height:" + px + 'px">' +
      avatarSvg(name, px) +
      "</div>"
    );
  }

  window.avatarHtml = avatarHtml;
  window.avatarSvg = avatarSvg;
  window.avatarParts = parts;
})();
