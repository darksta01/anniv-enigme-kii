/* Sons synthétisés via WebAudio — aucun fichier externe.
   Le contexte n'est créé qu'après un geste utilisateur (politique navigateur). */
(function () {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain, filterFreq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const flt = c.createBiquadFilter();
    flt.type = "lowpass";
    flt.frequency.setValueAtTime(filterFreq || 800, t0);
    const g = c.createGain();
    g.gain.setValueAtTime(gain || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt).connect(g).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  window.SFX = {
    unlock() { ensure(); },
    setMuted(m) { muted = m; },
    isMuted() { return muted; },
    // rotation de l'anneau : grondement grave court
    rotate() { noise(0.35, 0.06, 320); },
    // chevron qui s'enclenche : "clunk" métallique + note
    chevron() {
      noise(0.12, 0.25, 500);
      tone(180, 0.18, "square", 0.12, 90);
      tone(520, 0.1, "triangle", 0.06);
    },
    // erreur : buzz descendant
    error() {
      tone(220, 0.5, "sawtooth", 0.14, 60);
      noise(0.5, 0.1, 400);
    },
    // ouverture / kawoosh : grand woosh
    kawoosh() {
      noise(1.4, 0.35, 1600);
      tone(90, 1.2, "sine", 0.18, 320);
      tone(300, 1.0, "triangle", 0.1, 700);
    },
    // ronronnement du trou de ver (boucle courte one-shot)
    hum() { tone(70, 2.2, "sine", 0.05, 74); }
  };
})();
