/* =============================================================================
   atmosphere.js  —  floating rose petals + soft glowing particles.
   -----------------------------------------------------------------------------
   Drawn on a single lightweight canvas so it stays smooth on phones.
   Respects prefers-reduced-motion (falls back to a still, calm sky).
   ========================================================================== */

const SaraAtmosphere = (function () {
  let canvas, ctx, w, h, raf;
  let petals = [], particles = [];
  let running = false;
  let intensity = 1;             // 1 = normal, <1 = calmer (final chapter)
  const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rose = "#B76E79", accent = "#D8A7A7", blush = "#F6E7E7";

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makePetal() {
    return {
      x: rand(0, innerWidth),
      y: rand(-innerHeight, 0),
      size: rand(9, 20),
      speed: rand(0.25, 0.8),
      drift: rand(-0.4, 0.4),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.012, 0.012),
      sway: rand(0.4, 1.2),
      swayPhase: rand(0, Math.PI * 2),
      opacity: rand(0.35, 0.8),
      color: Math.random() > 0.5 ? rose : accent
    };
  }

  function makeParticle() {
    return {
      x: rand(0, innerWidth),
      y: rand(0, innerHeight),
      r: rand(1, 3),
      speed: rand(0.15, 0.5),
      drift: rand(-0.25, 0.25),
      opacity: rand(0.2, 0.6),
      pulse: rand(0, Math.PI * 2)
    };
  }

  function seed() {
    const count = innerWidth < 620 ? 12 : 20;      // fewer on small phones
    petals = Array.from({ length: count }, makePetal);
    particles = Array.from({ length: Math.round(count * 1.6) }, makeParticle);
  }

  /* Draw one soft petal as two overlapping teardrop curves */
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.opacity * intensity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    const s = p.size;
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.5, -s * 0.5, s * 0.5, s * 0.4, 0, s * 0.6);
    ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.5, -s * 0.5, 0, -s * 0.5);
    ctx.fill();
    // subtle inner vein highlight
    ctx.globalAlpha = p.opacity * 0.35 * intensity;
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.12, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(p, t) {
    const tw = 0.6 + 0.4 * Math.sin(t * 0.002 + p.pulse);
    ctx.save();
    ctx.globalAlpha = p.opacity * tw * intensity;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
    g.addColorStop(0, "rgba(255,246,235,0.9)");
    g.addColorStop(1, "rgba(216,167,167,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (const p of particles) {
      p.y -= p.speed * intensity;
      p.x += p.drift * intensity;
      if (p.y < -10) { p.y = innerHeight + 10; p.x = rand(0, innerWidth); }
      drawParticle(p, t);
    }

    for (const p of petals) {
      p.y += p.speed * intensity;
      p.x += (p.drift + Math.sin(t * 0.001 + p.swayPhase) * p.sway * 0.3) * intensity;
      p.rot += p.rotSpeed;
      if (p.y > innerHeight + 30) { Object.assign(p, makePetal(), { y: -30, x: rand(0, innerWidth) }); }
      if (p.x < -40) p.x = innerWidth + 40;
      if (p.x > innerWidth + 40) p.x = -40;
      drawPetal(p);
    }

    raf = requestAnimationFrame(frame);
  }

  function drawStill() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of particles) drawParticle(p, 0);
    for (const p of petals) drawPetal(p);
  }

  function start() {
    canvas = document.getElementById("atmosphere");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    seed();
    running = true;
    window.addEventListener("resize", () => { resize(); seed(); if (reduce) drawStill(); });
    if (reduce) { drawStill(); return; }   // calm, static scene
    raf = requestAnimationFrame(frame);
  }

  /* Slow everything down for the quiet finale. */
  function calm() {
    intensity = 0.35;
    if (reduce) drawStill();
  }
  function normal() {
    intensity = 1;
    if (reduce) drawStill();
  }

  return { start, calm, normal };
})();

if (typeof window !== "undefined") window.SaraAtmosphere = SaraAtmosphere;
