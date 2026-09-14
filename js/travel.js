/* Voyage interstellaire — tunnel d'étoiles (warp) entre l'épreuve 1 et l'épreuve 2.
   API : Travel.play(onArrive)  — onArrive() est appelé pendant le flash, quand
   l'écran est masqué, pour construire l'épreuve 2 « en coulisse ». */
window.Travel = (function () {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function play(onArrive) {
    const canvas = document.getElementById("tunnel");
    const flash = document.getElementById("flash");
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, cx, cy;

    function resize() {
      w = canvas.width = Math.floor(innerWidth * DPR);
      h = canvas.height = Math.floor(innerHeight * DPR);
      cx = w / 2; cy = h / 2;
    }
    resize();
    canvas.classList.add("active");
    if (window.SFX) SFX.kawoosh();

    // Cas réduit : simple flash + arrivée
    if (reduced) {
      flash.classList.add("fire");
      setTimeout(() => { onArrive && onArrive(); }, 350);
      setTimeout(() => { flash.classList.remove("fire"); canvas.classList.remove("active"); }, 1200);
      return;
    }

    const N = Math.round(420 * (innerWidth * innerHeight) / (1280 * 720));
    const stars = [];
    for (let i = 0; i < Math.max(220, N); i++) stars.push(reset({}));
    function reset(s) {
      s.x = (Math.random() * 2 - 1);
      s.y = (Math.random() * 2 - 1);
      s.z = Math.random() * 0.8 + 0.2;
      s.pz = s.z;
      return s;
    }

    const t0 = performance.now();
    let running = true, arrived = false;

    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000;
      const speed = 0.006 + t * 0.02;                 // accélération du warp
      ctx.fillStyle = "rgba(2,4,12,0.35)";            // traînée
      ctx.fillRect(0, 0, w, h);

      const scale = Math.min(w, h) * 0.9;
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0.02) { reset(s); continue; }
        const sx = cx + (s.x / s.z) * scale;
        const sy = cy + (s.y / s.z) * scale;
        const px = cx + (s.x / s.pz) * scale;
        const py = cy + (s.y / s.pz) * scale;
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) { reset(s); continue; }
        const a = Math.min(1, (1 - s.z) * 1.2);
        ctx.strokeStyle = `rgba(${180 + Math.floor(40 * a)},${220},255,${a})`;
        ctx.lineWidth = Math.max(1, (1 - s.z) * 3) * DPR;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // séquence pilotée par le temps (fiable même en arrière-plan)
    setTimeout(() => { flash.classList.add("fire"); }, 2600);
    setTimeout(() => { if (!arrived) { arrived = true; onArrive && onArrive(); } }, 2950);
    setTimeout(() => { canvas.style.transition = "opacity .7s ease"; canvas.style.opacity = "0"; }, 3050);
    setTimeout(() => {
      running = false;
      canvas.classList.remove("active");
      canvas.style.opacity = ""; canvas.style.transition = "";
      ctx.clearRect(0, 0, w, h);
      flash.classList.remove("fire");
    }, 3950);
  }

  return { play };
})();
