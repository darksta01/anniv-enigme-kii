/* Révélation finale — écran festif « Joyeux anniversaire » + URL + clé copiable.
   Toutes les valeurs viennent de window.GIFT (config.js). */
window.Reveal = (function () {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show() {
    const gift = window.GIFT || { gameName: "le jeu", downloadUrl: "#", gameKey: "??" };
    const s = document.getElementById("screen-reveal");
    s.innerHTML = `
      <canvas class="confetti" id="confetti" aria-hidden="true"></canvas>
      <div class="reveal-box">
        <p class="reveal-kicker">// TRANSMISSION DÉCHIFFRÉE //</p>
        <h1 class="reveal-title">Joyeux anniversaire 🎉</h1>
        <p class="reveal-sub">Tu as ouvert la porte et réveillé la machine.<br/>Voici ton cadeau :</p>

        <div class="gift-card">
          <div class="gift-game">🎮 ${escapeHtml(gift.gameName)}</div>

          <div class="gift-row">
            <span class="gift-label">Téléchargement / connexion</span>
            <a class="gift-link" href="${encodeURI(gift.downloadUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(gift.downloadUrl)}</a>
          </div>

          <div class="gift-row">
            <span class="gift-label">Ta clé</span>
            <button class="gift-key" id="gift-key" title="Cliquer pour copier">
              <code>${escapeHtml(gift.gameKey)}</code>
              <span class="copy-hint" id="copy-hint">copier</span>
            </button>
          </div>
        </div>

        <p class="reveal-foot">Bonne chasse, voyageur. 🌌</p>
      </div>
    `;

    document.querySelectorAll(".screen.active").forEach(el => el.classList.remove("active"));
    const flash = document.getElementById("flash");
    flash.classList.add("fire");
    setTimeout(() => flash.classList.remove("fire"), 1200);
    s.classList.add("active");

    // copie de la clé
    const keyBtn = document.getElementById("gift-key");
    keyBtn.addEventListener("click", () => copyKey(gift.gameKey));

    if (!reduced) startConfetti();
  }

  function copyKey(key) {
    const hint = document.getElementById("copy-hint");
    const okmsg = () => { hint.textContent = "copié ✓"; setTimeout(() => (hint.textContent = "copier"), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(key).then(okmsg).catch(() => selectFallback());
    } else selectFallback();
    function selectFallback() {
      const code = document.querySelector("#gift-key code");
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      try { document.execCommand("copy"); okmsg(); } catch (e) { hint.textContent = "sélectionne & copie"; }
    }
  }

  function startConfetti() {
    const canvas = document.getElementById("confetti");
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w, h;
    function resize() { w = canvas.width = innerWidth * DPR; h = canvas.height = innerHeight * DPR; }
    resize(); window.addEventListener("resize", resize);
    const colors = ["#ff5d8f", "#ffd166", "#5fd0ff", "#8affc1", "#c9a0ff", "#ff9f45"];
    const P = [];
    for (let i = 0; i < 160; i++) P.push(spawn(true));
    function spawn(top) {
      return {
        x: Math.random() * w,
        y: top ? -Math.random() * h : Math.random() * h,
        r: (Math.random() * 5 + 3) * DPR,
        c: colors[(Math.random() * colors.length) | 0],
        vx: (Math.random() - 0.5) * 1.4 * DPR,
        vy: (Math.random() * 1.6 + 1.2) * DPR,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2
      };
    }
    let frames = 0;
    (function loop() {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > h + 20) Object.assign(p, spawn(true));
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      }
      frames++;
      if (frames < 60 * 10) requestAnimationFrame(loop);   // ~10 s puis s'arrête
      else ctx.clearRect(0, 0, w, h);
    })();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  return { show };
})();
