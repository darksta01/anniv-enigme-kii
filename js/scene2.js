/* Épreuve 2 — arrivée sur la planète désertique + machine alien.
   Scene2.show() construit le décor (plan fixe) et démarre Puzzle2. */
window.Scene2 = {
  show() {
    const s = document.getElementById("screen-scene2");
    s.innerHTML = `
      <div class="planet-scene">
        <!-- décor désertique (SVG plein cadre) -->
        <svg class="desert" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a1030"/>
              <stop offset="42%" stop-color="#5a2440"/>
              <stop offset="70%" stop-color="#a8534a"/>
              <stop offset="100%" stop-color="#d98a5a"/>
            </linearGradient>
            <radialGradient id="sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffe9c2"/>
              <stop offset="45%" stop-color="#ffb56b"/>
              <stop offset="100%" stop-color="#ffb56b00"/>
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="600" fill="url(#sky)"/>
          <circle cx="500" cy="330" r="150" fill="url(#sun)"/>
          <circle cx="500" cy="330" r="66" fill="#ffdca8" opacity="0.95"/>
          <circle cx="775" cy="135" r="26" fill="#e7c9d6" opacity="0.5"/>
          <!-- reliefs lointains -->
          <path d="M0 350 L150 300 L300 345 L460 305 L640 350 L820 312 L1000 348 L1000 600 L0 600 Z" fill="#5a2f3a" opacity="0.65"/>
          <!-- dunes -->
          <path d="M0 430 Q250 380 520 430 T1000 430 L1000 600 L0 600 Z" fill="#8a4a3a"/>
          <path d="M0 500 Q300 455 600 505 T1000 495 L1000 600 L0 600 Z" fill="#a25a44"/>
          <path d="M0 560 Q350 525 700 560 T1000 555 L1000 600 L0 600 Z" fill="#bd6f50"/>
          <ellipse cx="500" cy="600" rx="520" ry="90" fill="#3a1e28" opacity="0.35"/>
        </svg>

        <div class="scene2-ui">
          <div class="machine-host" id="machine-host"></div>
          <div id="message2" class="message" role="status" aria-live="polite"></div>

          <div class="charge-panel" id="charge-panel" hidden>
            <span class="charge-label">Flux</span>
            <button class="charge-btn" id="charge-minus" aria-label="Retirer">−</button>
            <span class="charge-count" id="charge-count">0</span>
            <button class="charge-btn" id="charge-plus" aria-label="Ajouter">+</button>
            <button class="charge-activate" id="charge-activate">Activer</button>
          </div>
        </div>
      </div>
    `;

    // activer l'écran
    document.querySelectorAll(".screen.active").forEach(el => el.classList.remove("active"));
    s.classList.add("active");

    Puzzle2.init({
      machineEl: document.getElementById("machine-host"),
      messageEl: document.getElementById("message2"),
      chargePanel: document.getElementById("charge-panel"),
      countEl: document.getElementById("charge-count"),
      minusBtn: document.getElementById("charge-minus"),
      plusBtn: document.getElementById("charge-plus"),
      activateBtn: document.getElementById("charge-activate")
    });
  }
};
