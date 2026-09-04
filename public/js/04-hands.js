/* ============================================================================
 FILE: public/js/04-hands.js
 ROLE: HAND RENDERER v2.7 — articulated vector hands. One persistent SVG
       skeleton per hand (3 phalanges/finger, 2 thumb), joint angles tweened
       with rAF so fingers genuinely curl/extend, staggered index->pinky.
       Exports the SAME public API as v2.6 (HandRenderer / getHandSVG /
       buildArenaHand / setHandGesture) plus handPump() and
       enhanceGestureButtons(). Depends on: nothing ($ from 03 at call-time).
 STYLE: bold cream keyline (paint-order:stroke) for phone-size legibility,
       flat warm skin, folded-finger curls, cuff per side (gold/violet),
       opponent mirrored. viewBox 200x300 — no horizontal stretch.
       Approved in the preview/ playground (port 8123) before landing.
============================================================================ */
(function (global) {
  "use strict";

  // ---- palette -------------------------------------------------------------
  var TONES = [
    { m: "#e9b189", d: "#c98a5c", l: "#f8cfa8" }, // warm tan (default)
    { m: "#f2c9a4", d: "#d3a276", l: "#ffe3c4" }, // light
    { m: "#c98d61", d: "#a56b40", l: "#e2ac7e" }, // medium brown
    { m: "#9c6b45", d: "#7b4f2e", l: "#bd8757" }, // deep brown
    { m: "#6f4a2e", d: "#54331c", l: "#8d6138" }  // darkest
  ];
  var CUFF = { player: "#f2b02e", opp: "#8b7cf6" };
  var OUT = "rgba(255,246,230,.95)"; // sticker keyline
  var OW = 5;                         // keyline width (viewBox units)

  // ---- skeleton ------------------------------------------------------------
  // Finger bases sit on the knuckle line; fan rots spread them naturally.
  var FINGERS = [
    { x: 70,  w: 25, len: 92,  rot: -8 },  // index
    { x: 95,  w: 26, len: 102, rot: -2 },  // middle
    { x: 119, w: 24, len: 92,  rot: 5 },   // ring
    { x: 138, w: 21, len: 76,  rot: 12 }   // pinky
  ];
  var KY = 136;              // knuckle line y
  var SPLIT = [0.46, 0.31, 0.23]; // proximal / middle / distal share of len

  // Joint angles (deg). Positive curls the phalanx clockwise (toward palm).
  var EXT = [-3, 6, 8];          // raised finger: near-straight, soft curve
  var CURL = [26, 116, 58];      // folded over the palm (visible lump + hook)
  var T_EXT = [-56, -12];        // thumb out
  var T_CURL = [84, 26];         // thumb wrapped horizontally over the folded fingers

  // Pose = finger angles x4, thumb angles, fan multiplier, wrist tilt
  function P(f0, f1, f2, f3, t, fan) {
    return { f: [f0, f1, f2, f3], t: t, fan: fan, wrist: 0 };
  }
  var POSES = {
    0: P(CURL, CURL, CURL, CURL, T_CURL, 0.90),  // fist (dot ball)
    1: P(EXT,  CURL, CURL, CURL, T_CURL, 0.92),
    2: P(EXT,  EXT,  CURL, CURL, T_CURL, 0.96),
    3: P(EXT,  EXT,  EXT,  CURL, T_CURL, 1.00),
    4: P(EXT,  EXT,  EXT,  EXT,  T_CURL, 1.04),
    5: P(EXT,  EXT,  EXT,  EXT,  T_EXT,  1.12),  // open palm (five)
    6: P(CURL, CURL, CURL, CURL, T_EXT,  0.90)   // thumb-up (six)
  };

  // ---- tiny path helpers ---------------------------------------------------
  // Tapered capsule from joint (0,0) upward to (0,-len): w0 base -> w1 tip.
  function phal(len, w0, w1) {
    var r1 = w1 / 2, r0 = w0 / 2;
    var yTip = -len + r1;
    return (
      "M" + (-r0) + " 0 " +
      "C" + (-r0) + " " + (-len * 0.42) + " " + (-r1) + " " + (-len * 0.6) + " " + (-r1) + " " + yTip + " " +
      "A" + r1 + " " + r1 + " 0 0 1 " + r1 + " " + yTip + " " +
      "C" + r1 + " " + (-len * 0.6) + " " + r0 + " " + (-len * 0.42) + " " + r0 + " 0 Z"
    );
  }
  function key(extra) {
    // bold keyline behind every filled shape
    return ' stroke="' + OUT + '" stroke-width="' + OW + '" stroke-linejoin="round" paint-order="stroke"' + (extra || "");
  }

  // ---- markup --------------------------------------------------------------
  function fingerMarkup(i, ang, skin, detail, tag) {
    var f = FINGERS[i];
    var l1 = f.len * SPLIT[0], l2 = f.len * SPLIT[1], l3 = f.len * SPLIT[2];
    var w0 = f.w, w1 = f.w * 0.86, w2 = f.w * 0.70;
    // folded fingers counter-rotate their fan so the knuckle lumps stay level
    var curlF = Math.max(0, Math.min(1, (ang[1] - EXT[1]) / (CURL[1] - EXT[1])));
    var rot = f.rot * (1 - 0.7 * curlF);
    var kIn = ' stroke="' + OUT + '" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke"';
    var crease = detail === "full"
      ? '<path d="M' + (-w0 * 0.30) + ' 1 L' + (w0 * 0.30) + ' 1" stroke="rgba(60,30,10,.26)" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
      : "";
    var nail = detail === "full"
      ? '<ellipse cx="0" cy="' + (-l3 * 0.66) + '" rx="' + (w2 * 0.26) + '" ry="' + (w2 * 0.30) + '" fill="rgba(255,240,220,.75)"/>'
      : "";
    var gloss = detail === "full"
      ? '<path d="M' + (-w0 * 0.18) + ' ' + (-l1 * 0.25) + ' L' + (-w1 * 0.16) + ' ' + (-l1 * 0.8) + '" stroke="rgba(255,255,255,.30)" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
      : "";
    return (
      '<g data-j="' + tag + 'f' + i + 'r" transform="rotate(' + rot + ' 0 0)">' +
        '<g data-j="' + tag + 'f' + i + 'p1" transform="rotate(' + ang[0] + ')">' +
          '<path d="' + phal(l1, w0, w1) + '" fill="' + skin.m + '"' + key() + '/>' + crease + gloss +
          '<g transform="translate(0 ' + (-l1) + ')">' +
            '<g data-j="' + tag + 'f' + i + 'p2" transform="rotate(' + ang[1] + ')">' +
              '<path d="' + phal(l2, w1, w2) + '" fill="' + skin.m + '"' + kIn + '/>' +
              '<g transform="translate(0 ' + (-l2) + ')">' +
                '<g data-j="' + tag + 'f' + i + 'p3" transform="rotate(' + ang[2] + ')">' +
                  '<path d="' + phal(l3, w2, w2 * 0.9) + '" fill="' + skin.m + '"' + kIn + '/>' + nail +
                '</g>' +
              '</g>' +
            '</g>' +
          '</g>' +
        '</g>' +
      '</g>'
    );
  }

  function thumbMarkup(ang, skin, detail, tag) {
    var l1 = 44, l2 = ang[0] > 60 ? 30 : 26, w0 = 22, w1 = 18;
    var wrapped = ang[0] > 60;             // fist: nail faces away from viewer
    var kIn = ' stroke="' + OUT + '" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke"';
    var nail = detail === "full" && !wrapped
      ? '<ellipse cx="0" cy="' + (-l2 * 0.66) + '" rx="' + (w1 * 0.26) + '" ry="' + (w1 * 0.30) + '" fill="rgba(255,240,220,.75)"/>'
      : "";
    return (
      // thenar webbing: blends the thumb root into the palm silhouette
      '<path d="M58 216 Q44 202 46 182 Q52 166 64 160 L78 176 Q68 196 68 214 Z" fill="' + skin.m + '"' + key() + '/>' +
      '<g transform="translate(58 178)">' +
        '<g data-j="' + tag + 't1" transform="rotate(' + ang[0] + ')">' +
          '<path d="' + phal(l1, w0, w1) + '" fill="' + skin.m + '"' + key() + '/>' +
          '<g transform="translate(0 ' + (-l1) + ')">' +
            '<g data-j="' + tag + 't2" transform="rotate(' + ang[1] + ')">' +
              '<path d="' + phal(l2, w1, w1 * 0.8) + '" fill="' + skin.m + '"' + kIn + '/>' + nail +
            '</g>' +
          '</g>' +
        '</g>' +
      '</g>'
    );
  }

  function inner(pose, o) {
    var skin = TONES[o.tone | 0] || TONES[0];
    var detail = o.detail || "full";
    var tag = o.tag || "h";
    var cuff = o.isPlayer ? CUFF.player : CUFF.opp;
    var fan = pose.fan;
    var s = "";

    // ground shadow
    s += '<ellipse cx="100" cy="290" rx="52" ry="6" fill="rgba(0,0,0,.22)"/>';

    // wrist + whole-hand tilt group
    s += '<g data-j="' + tag + 'wrist" transform="rotate(' + pose.wrist + ' 100 250)">';

    // forearm
    s += '<path d="M66 300 Q64 274 68 254 L132 254 Q136 274 134 300 Z" fill="' + skin.d + '"' + key() + '/>';
    // cuff
    s += '<path d="M62 258 Q60 242 66 236 L134 236 Q140 242 138 258 Q120 264 100 264 Q80 264 62 258 Z" fill="' + cuff + '"' + key() + '/>';
    s += '<path d="M68 244 Q100 240 132 244" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"/>';

    // fingers BEHIND palm edge so curled lumps sit over the palm top
    s += '<g>';
    for (var i = 0; i < 4; i++) {
      var f = FINGERS[i];
      var fx = 100 + (f.x - 100) * fan;
      s += '<g transform="translate(' + fx + ' ' + KY + ')">' + fingerMarkup(i, pose.f[i], skin, detail, tag) + '</g>';
    }
    s += '</g>';

    // palm (drawn after fingers so folded phalanges tuck behind its top edge)
    s += '<path d="M58 246 C48 210 48 168 60 142 Q78 126 100 126 Q122 126 140 142 C150 170 150 206 142 246 Q122 256 100 256 Q78 256 58 246 Z" fill="' + skin.m + '"' + key() + '/>';
    if (detail === "full") {
      // palm shading + creases (kept sparse so small sizes stay clean)
      s += '<path d="M64 236 C58 204 58 176 66 150" fill="none" stroke="' + skin.d + '" stroke-width="6" opacity=".35" stroke-linecap="round"/>';
      s += '<path d="M76 176 Q100 168 122 172" fill="none" stroke="rgba(60,30,10,.20)" stroke-width="2.4" stroke-linecap="round"/>';
      s += '<path d="M80 196 Q100 190 118 193" fill="none" stroke="rgba(60,30,10,.16)" stroke-width="2.4" stroke-linecap="round"/>';
      s += '<path d="M84 150 Q100 142 118 148" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="4" stroke-linecap="round"/>';
    }

    // thumb on top
    s += thumbMarkup(pose.t, skin, detail, tag);

    s += '</g>'; // wrist
    return s;
  }

  function poseFor(num) {
    return POSES[num] || POSES[0];
  }

  function svgOpen(o) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"' +
      (o.mirror ? ' style="transform:scaleX(-1)"' : '') +
      ' class="hand-v27">';
  }

  function draw(num, isPlayer, opts) {
    var o = opts || {};
    o.isPlayer = !!isPlayer;
    if (o.mirror === undefined) o.mirror = !isPlayer;
    if (o.tag === undefined) o.tag = isPlayer ? "p" : "o";
    var pose = poseFor(num);
    var s = svgOpen(o);
    if (o.mirror) {
      // keep mirror OUTSIDE all joint transforms: wrap instead of CSS
      s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="hand-v27"><g transform="translate(200 0) scale(-1 1)">';
    }
    s += inner(pose, o);
    if (o.mirror) s += '</g>';
    s += '</svg>';
    return s;
  }

  // ---- animation -----------------------------------------------------------
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutBack(t) { var c = 1.70158, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var REDUCED = false;
  try {
    REDUCED = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) { REDUCED = false; }

  function mount(host, isPlayer, opts) {
    var o = opts || {};
    o.isPlayer = !!isPlayer;
    if (o.mirror === undefined) o.mirror = !isPlayer;
    o.tag = isPlayer ? "p" : "o";
    host.innerHTML = draw(0, isPlayer, o);
    var cur = { f: [CURL.slice(), CURL.slice(), CURL.slice(), CURL.slice()], t: T_CURL.slice(), fan: POSES[0].fan, wrist: 0 };
    var raf = null;

    function apply(pose) {
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 3; j++) {
          var n = host.querySelector('[data-j="' + o.tag + 'f' + i + 'p' + (j + 1) + '"]');
          if (n) n.setAttribute("transform", "rotate(" + pose.f[i][j] + ")");
        }
      }
      var t1 = host.querySelector('[data-j="' + o.tag + 't1"]');
      var t2 = host.querySelector('[data-j="' + o.tag + 't2"]');
      if (t1) t1.setAttribute("transform", "rotate(" + pose.t[0] + ")");
      if (t2) t2.setAttribute("transform", "rotate(" + pose.t[1] + ")");
      var w = host.querySelector('[data-j="' + o.tag + 'wrist"]');
      if (w) w.setAttribute("transform", "rotate(" + pose.wrist + " 100 250)");
    }

    function set(num, so) {
      so = so || {};
      var target = poseFor(num);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (REDUCED || so.animate === false) {
        cur = { f: target.f.map(function (a) { return a.slice(); }), t: target.t.slice(), fan: target.fan, wrist: target.wrist };
        apply(cur);
        return;
      }
      var from = { f: cur.f.map(function (a) { return a.slice(); }), t: cur.t.slice(), fan: cur.fan, wrist: cur.wrist };
      var dur = so.duration || 240;
      var stag = so.stagger === undefined ? 42 : so.stagger;
      var ext = false;
      for (var q = 0; q < 4; q++) if (target.f[q][1] < from.f[q][1]) ext = true;
      var t0 = performance.now();
      var total = dur + stag * 3;
      function frame(now) {
        var e = now - t0;
        var pose = { f: [], t: [], fan: 0, wrist: 0 };
        var gT = Math.min(1, e / dur);
        pose.fan = lerp(from.fan, target.fan, easeInOut(gT));
        pose.wrist = lerp(from.wrist, target.wrist, easeInOut(gT));
        pose.t[0] = lerp(from.t[0], target.t[0], (ext ? easeOutBack : easeInOut)(gT));
        pose.t[1] = lerp(from.t[1], target.t[1], easeInOut(gT));
        for (var i = 0; i < 4; i++) {
          var lt = Math.max(0, Math.min(1, (e - i * stag) / dur));
          var ez = ext ? easeOutBack : easeInOut;
          pose.f[i] = [0, 1, 2].map(function (j) { return lerp(from.f[i][j], target.f[i][j], ez(lt)); });
        }
        apply(pose);
        if (e < total) { raf = requestAnimationFrame(frame); }
        else {
          cur = { f: target.f.map(function (a) { return a.slice(); }), t: target.t.slice(), fan: target.fan, wrist: target.wrist };
          apply(cur);
          raf = null;
        }
      }
      raf = requestAnimationFrame(frame);
    }

    return { set: set, svg: host.firstChild, apply: apply, get cur() { return cur; } };
  }

  global.HandV27 = {
    TONES: TONES, CUFF: CUFF, POSES: POSES, EXT: EXT, CURL: CURL,
    inner: inner, draw: draw, mount: mount, poseFor: poseFor, phal: phal
  };
})(typeof window !== "undefined" ? window : globalThis);

/* ================= v2.6-COMPATIBLE PUBLIC API ================= */
const HandRenderer = {
  draw: function (num, isPlayer, opts) {
    return HandV27.draw(num === null || num === undefined ? 0 : num, !!isPlayer, opts);
  },
  mount: HandV27.mount,
  POSES: HandV27.POSES,
};

function getHandSVG(num, isPlayer, opts) {
  return HandV27.draw(num === null || num === undefined ? 0 : num, !!isPlayer, opts);
}

// Build the skeleton ONCE per arena hand; later poses tween the joints.
function buildArenaHand(host) {
  if (!host || host.__ctl) return;
  host.__ctl = HandV27.mount(host, host.id === "arenaPlayer");
}

// v2.7: gesture change = joint tween + gesture-weighted reveal on the wrapper.
function setHandGesture(imgEl, wrapperEl, v) {
  const arena = wrapperEl && wrapperEl.querySelector(".arena-hand");
  if (!arena) return;
  if (!arena.__ctl) buildArenaHand(arena);
  wrapperEl.classList.remove("shake", "reveal", "reveal-six", "reveal-dot", "wicket");
  if (v === null || v === undefined) {
    arena.__ctl.set(0, { animate: false });
    return;
  }
  arena.__ctl.set(v, { duration: 240, stagger: 42 });
  void wrapperEl.offsetWidth;
  wrapperEl.classList.add(v === 6 ? "reveal-six" : v === 0 ? "reveal-dot" : "reveal");
  setTimeout(
    () => wrapperEl.classList.remove("reveal", "reveal-six", "reveal-dot"),
    720,
  );
}

// Wicket: the dismissed side's hand fist-pumps with a red ring (engine hook).
function handPump(isMyBatterOut) {
  const w = document.getElementById(isMyBatterOut ? "handPlayer" : "handOpponent");
  if (!w) return;
  w.classList.remove("wicket");
  void w.offsetWidth;
  w.classList.add("wicket");
  setTimeout(() => w.classList.remove("wicket"), 820);
}

// Mini hand previews inside the six gesture buttons (teaches new players
// what each number looks like). Numbers stay as labels underneath.
function enhanceGestureButtons() {
  document.querySelectorAll(".gesture-btn").forEach((b) => {
    if (b.querySelector(".mini-hand")) return;
    const v = parseInt(b.dataset.val, 10);
    if (isNaN(v)) return;
    const span = document.createElement("span");
    span.className = "mini-hand";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = HandV27.draw(v, true, { detail: "mini" });
    b.insertBefore(span, b.firstChild);
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", enhanceGestureButtons);
} else {
  enhanceGestureButtons();
}
