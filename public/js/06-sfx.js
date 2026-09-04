/* ============================================================================
 FILE: public/js/06-sfx.js
 ROLE: SOUND & HAPTICS — WebAudio ctx, ensureAudio(), beep(), sfx(name) jingles (tap/tick/six/out/win/lose/coin…), haptic(vibrate). Depends on: nothing.
============================================================================ */

function ensureAudio() {
  if (!audioCtx)
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}
function beep(f, d, t, v) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = t || "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + (d || 0.12),
    );
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + (d || 0.12));
  } catch (e) {}
}
function sfx(n) {
  ensureAudio();
  const B = beep;
  if (n === "tap") B(600, 0.05, "square", 0.08);
  else if (n === "tick") B(900, 0.04);
  else if (n === "go") B(1200, 0.18, "triangle", 0.18);
  else if (n === "run") B(700, 0.1);
  else if (n === "six") {
    B(800, 0.1);
    setTimeout(() => B(1000, 0.1), 90);
    setTimeout(() => B(1300, 0.15), 180);
  } else if (n === "out") {
    B(300, 0.15, "sawtooth", 0.2);
    setTimeout(() => B(200, 0.25, "sawtooth", 0.2), 120);
  } else if (n === "win")
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => B(f, 0.18, "triangle", 0.18), i * 110),
    );
  else if (n === "lose")
    [400, 300, 220].forEach((f, i) =>
      setTimeout(() => B(f, 0.2, "sawtooth", 0.15), i * 130),
    );
  else if (n === "coin") {
    B(2400, 0.06, "sine", 0.15);
    setTimeout(() => B(2800, 0.08, "sine", 0.12), 80);
    setTimeout(() => B(3200, 0.04, "sine", 0.08), 160);
  } else if (n === "cd") B(800, 0.15);
  else if (n === "start") {
    B(1200, 0.2, "triangle", 0.2);
    setTimeout(() => B(1500, 0.3, "triangle", 0.2), 200);
  } else if (n === "nb") {
    B(400, 0.2, "sawtooth", 0.15);
    setTimeout(() => B(350, 0.15, "sawtooth", 0.15), 150);
  } else if (n === "fh") {
    B(1000, 0.1, "triangle", 0.18);
    setTimeout(() => B(1200, 0.1, "triangle", 0.18), 100);
  }
}
function haptic(ms) {
  if (navigator.vibrate)
    try {
      navigator.vibrate(ms || 15);
    } catch (e) {}
}

