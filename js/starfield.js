/* Fond noir étoilé animé — Canvas, performant, respecte prefers-reduced-motion */
(function () {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, stars = [], shooters = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = canvas.width = Math.floor(innerWidth * DPR);
    h = canvas.height = Math.floor(innerHeight * DPR);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    buildStars();
  }

  function buildStars() {
    const count = Math.round((innerWidth * innerHeight) / 6500);
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.3 + 0.3) * DPR,
        base: Math.random() * 0.5 + 0.25,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.005,
        hue: Math.random() < 0.15 ? 45 : (Math.random() < 0.4 ? 205 : 210)
      });
    }
  }

  function spawnShooter() {
    if (reduced) return;
    const fromLeft = Math.random() < 0.5;
    shooters.push({
      x: fromLeft ? -50 : w + 50,
      y: Math.random() * h * 0.5,
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 5) * DPR,
      vy: (2 + Math.random() * 3) * DPR,
      life: 1
    });
  }

  let last = 0;
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    // léger halo bleu au centre
    const grad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.6);
    grad.addColorStop(0, "rgba(20,50,90,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      if (!reduced) s.tw += s.sp;
      const a = reduced ? s.base : s.base + Math.sin(s.tw) * 0.35;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.hue === 45
        ? `rgba(255,220,150,${Math.max(0, a)})`
        : `rgba(190,220,255,${Math.max(0, a)})`;
      ctx.fill();
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
      if (sh.life <= 0 || sh.x < -80 || sh.x > w + 80) { shooters.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 4, sh.y - sh.vy * 4);
      ctx.strokeStyle = `rgba(200,230,255,${sh.life})`;
      ctx.lineWidth = 1.6 * DPR;
      ctx.stroke();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
  if (!reduced) setInterval(() => { if (Math.random() < 0.5) spawnShooter(); }, 4200);
})();
