/* Machine à états de l'Épreuve 1.
   Objectif : enclencher dans l'ordre les 4 runes grecques formant ΔΩΡΟ. */
(function () {
  const SEQUENCE = ["Δ", "Ω", "Ρ", "Ο"];   // δώρο = "cadeau"
  // Positions (index anneau) -> lettre. Doit correspondre à GREEK dans stargate.js.
  const GREEK = { 3: "Δ", 14: "Ω", 23: "Ρ", 32: "Ο" };

  let progress = 0;
  let solved = false;

  const $ = (id) => document.getElementById(id);
  const messageEl = $("message");
  const slots = Array.from(document.querySelectorAll(".glyph-slot"));

  function showMessage(text, cls, hold) {
    messageEl.className = "message show " + (cls || "");
    messageEl.textContent = text;
    if (hold !== true) {
      clearTimeout(showMessage._t);
      showMessage._t = setTimeout(() => messageEl.classList.remove("show"), 1800);
    }
  }

  function fillSlot(i, letter) {
    slots[i].textContent = letter;
    slots[i].classList.add("filled");
  }

  function clearSlots() {
    slots.forEach(s => { s.textContent = ""; s.classList.remove("filled"); });
  }

  function commit(index) {
    if (solved) return;
    const letter = GREEK[index] || null;
    const expected = SEQUENCE[progress];

    if (letter && letter === expected) {
      Gate.dipTop();                 // le chevron du haut descend / se verrouille / remonte
      Gate.lockChevron(progress);
      fillSlot(progress, letter);
      if (window.SFX) SFX.chevron();
      progress++;
      if (progress >= SEQUENCE.length) {
        solved = true;
        Gate.setInteractive(false);
        showMessage("Chevron enclenché — Verrouillage final", "ok", true);
        setTimeout(win, 900);
      } else {
        showMessage("Chevron enclenché", "ok");
      }
    } else {
      // erreur : reset
      if (window.SFX) SFX.error();
      showMessage("Connexion interrompue", "err");
      progress = 0;
      clearSlots();
      Gate.reset();
    }
  }

  function win() {
    showMessage("La porte s'ouvre…", "win", true);
    Gate.open(() => {
      showMessage("Franchis le vortex.", "win", true);
      Gate.armHorizon(() => {
        messageEl.classList.remove("show");
        Travel.play(() => Scene2.show());
      });
    });
  }

  // ---------- Câblage des écrans ----------
  function startGame() {
    $("screen-intro").classList.remove("active");
    $("screen-gate").classList.add("active");
    Gate.init($("gate-container"), commit);
    // rotation initiale aléatoire pour ne pas révéler les positions
    setTimeout(() => Gate.setInteractive(true), 400);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // bouton démarrer
    $("btn-start").addEventListener("click", () => {
      if (window.SFX) SFX.unlock();
      startGame();
    });

    // bouton son
    const st = $("sound-toggle"), icon = $("sound-icon");
    st.addEventListener("click", () => {
      if (!window.SFX) return;
      const m = !SFX.isMuted();
      SFX.setMuted(m);
      st.classList.toggle("muted", m);
      icon.textContent = m ? "✕" : "♪";
    });
  });
})();
