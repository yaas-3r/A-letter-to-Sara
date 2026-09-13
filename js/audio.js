/* =============================================================================
   audio.js  —  background music with gentle fades. No abrupt cuts.
   -----------------------------------------------------------------------------
   Put your track at:  assets/music/main.mp3
   It loops quietly and continues smoothly across every chapter.
   ========================================================================== */

const SaraAudio = (function () {
  const TARGET_VOLUME = 0.45;     // gentle, never overpowering
  const FADE_MS = 1600;           // length of each fade

  let audio = null;
  let fadeTimer = null;
  let wanted = false;             // does the user want music on?
  let available = false;          // did the file load?

  function init() {
    audio = new Audio("assets/music/main.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    audio.addEventListener("canplaythrough", () => { available = true; }, { once: true });
    audio.addEventListener("error", () => { available = false; });
  }

  function clearFade() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  }

  /* Smoothly ramp volume to a target, then optionally pause. */
  function fadeTo(target, thenPause) {
    if (!audio) return;
    clearFade();
    const start = audio.volume;
    const steps = 40;
    const stepTime = FADE_MS / steps;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      const t = i / steps;
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
      if (i >= steps) {
        clearFade();
        audio.volume = target;
        if (thenPause) audio.pause();
      }
    }, stepTime);
  }

  /* Start music (called after the first user gesture — the Begin button). */
  function start() {
    wanted = true;
    if (!audio) init();
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.then(() => fadeTo(TARGET_VOLUME, false))
                 .catch(() => { /* autoplay blocked or file missing — silently ignore */ });
    } else {
      fadeTo(TARGET_VOLUME, false);
    }
  }

  function pause() {
    wanted = false;
    fadeTo(0, true);
  }

  function toggle() {
    if (wanted) { pause(); return false; }
    start(); return true;
  }

  /* Lower the volume for the quiet final chapter, without stopping. */
  function soften() {
    if (wanted) fadeTo(TARGET_VOLUME * 0.4, false);
  }
  function restore() {
    if (wanted) fadeTo(TARGET_VOLUME, false);
  }

  function isOn() { return wanted; }

  return { init, start, pause, toggle, soften, restore, isOn };
})();

if (typeof window !== "undefined") window.SaraAudio = SaraAudio;
