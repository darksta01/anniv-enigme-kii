/* ============================================================================
   La Porte des étoiles — moteur SVG (dessin, rotation, chevrons, trou de ver)
   Design ORIGINAL inspiré de l'univers (anneau à chevrons + runes façon
   constellations). Les 4 lettres grecques sont de simples caractères Unicode.
   ============================================================================ */
window.Gate = (function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const CX = 400, CY = 400;
  const N = 39;                 // nombre de runes sur l'anneau
  const STEP = 360 / N;
  const R_RING = 278;           // rayon de placement des runes
  const CH_R = 352;             // rayon des chevrons
  const N_CH = 9;               // nombre de chevrons
  const LOCK_ORDER = [0, 8, 1, 7];  // ordre d'allumage des chevrons (4)

  // Positions (index sur l'anneau) des 4 runes grecques + leur lettre.
  // Réparties pour qu'elles ne soient pas voisines.
  const GREEK = { 3: "Δ", 14: "Ω", 23: "Ρ", 32: "Ο" };

  let svg, ringGroup, chevrons = [], horizon, kawooshRing;
  let rotation = 0;
  let interactive = false;
  let busy = false;
  let onCommit = null;          // callback(index) fourni par puzzle.js

  function el(name, attrs) {
    const e = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // RNG déterministe par graine (runes stables entre les chargements)
  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // --- Rune "constellation" originale dans une boîte centrée en (0,0) ---
  function makeRune(seed) {
    const g = el("g", { class: "rune-mark" });
    const r = rng(seed + 7);
    const nPts = 3 + Math.floor(r() * 3);
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      pts.push([(r() * 2 - 1) * 13, (r() * 2 - 1) * 15]);
    }
    // lignes reliant les points
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    if (r() < 0.4) d += " Z";
    g.appendChild(el("path", { d, class: "rune-line" }));
    // petites étoiles aux sommets
    for (const p of pts) {
      g.appendChild(el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: (r() * 1.4 + 1).toFixed(1), class: "rune-dot" }));
    }
    // arc décoratif occasionnel
    if (r() < 0.35) {
      g.appendChild(el("path", { d: `M -10 ${(r()*8-4).toFixed(1)} A 12 12 0 0 1 10 ${(r()*8-4).toFixed(1)}`, class: "rune-line thin" }));
    }
    return g;
  }

  function makeGreek(letter) {
    const g = el("g", { class: "greek" });
    const t = el("text", { x: 0, y: 0, "text-anchor": "middle", "dominant-baseline": "central", class: "greek-text" });
    t.textContent = letter;
    g.appendChild(t);
    return g;
  }

  // --- Chevron (bracket pointant vers le centre) ---
  function makeChevron(k) {
    const ang = -90 + k * (360 / N_CH);
    const rad = ang * Math.PI / 180;
    const x = CX + CH_R * Math.cos(rad);
    const y = CY + CH_R * Math.sin(rad);
    const g = el("g", { class: "chevron", transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + 90).toFixed(1)})` });
    // groupe interne animable (pour l'effet de descente/verrouillage)
    const inner = el("g", { class: "chev-inner" });
    // socle
    inner.appendChild(el("path", { d: "M -26 6 L 0 -30 L 26 6 L 16 6 L 0 -14 L -16 6 Z", class: "chev-base" }));
    // lumière (allumée = orange)
    inner.appendChild(el("path", { d: "M -15 2 L 0 -18 L 15 2 Z", class: "chev-light" }));
    g.appendChild(inner);
    return g;
  }

  function build(container) {
    svg = el("svg", { viewBox: "0 0 800 800", preserveAspectRatio: "xMidYMid meet" });
    svg.innerHTML = `
      <defs>
        <radialGradient id="ringMetal" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stop-color="#3a4152"/>
          <stop offset="55%" stop-color="#242938"/>
          <stop offset="100%" stop-color="#0d1018"/>
        </radialGradient>
        <radialGradient id="innerDark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a1622"/>
          <stop offset="100%" stop-color="#03060c"/>
        </radialGradient>
        <radialGradient id="ehGrad" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stop-color="#dff6ff"/>
          <stop offset="35%" stop-color="#5fd0ff"/>
          <stop offset="75%" stop-color="#2a7fd6"/>
          <stop offset="100%" stop-color="#0b2a55"/>
        </radialGradient>
        <filter id="chevGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ehTurb" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="14s" values="0.012 0.02;0.02 0.012;0.012 0.02" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <style>
          svg { cursor: default; }
          .housing-outer { fill: url(#ringMetal); stroke:#4a5064; stroke-width:2; }
          .housing-inner { fill: url(#innerDark); }
          .housing-notch { fill:#0c0f16; stroke:#3a4152; stroke-width:1; }
          .ring-band { fill:#161b26; stroke:#333a4a; stroke-width:1.5; }
          .rune-line { fill:none; stroke: var(--glyph, #9fdcff); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; opacity:.82; }
          .rune-line.thin { stroke-width:1.3; opacity:.55; }
          .rune-dot { fill: var(--glyph, #9fdcff); opacity:.9; }
          .glyph { cursor:pointer; }
          .glyph .rune-mark, .glyph .greek { transition: filter .2s ease; }
          .glyph:hover .rune-line { stroke:#eaffff; opacity:1; }
          .glyph:hover .rune-dot { fill:#eaffff; }
          /* runes grecques discrètes : mêmes tons que les autres, on ne les repère qu'à leur forme */
          .greek-text { fill:#aec8d9; font-family:"Cinzel", serif; font-weight:600; font-size:26px; opacity:.8; }
          .glyph.greek-glyph:hover .greek-text { fill:#eaffff; opacity:1; }
          .chev-base { fill:#20242f; stroke:#454b5c; stroke-width:1.5; }
          .chev-light { fill:#2a1c12; transition: fill .25s ease; }
          .chevron.engaged .chev-light { fill: var(--amber, #ff7a18); }
          .chevron.engaged { filter:url(#chevGlow); }
          .chevron.engaged .chev-base { stroke: var(--amber-glow,#ffb35c); }
          .chevron.top { cursor:pointer; }
          #horizon { opacity:0; }
          #horizon.live { cursor:pointer; animation: ehpulse 1.8s ease-in-out infinite; }
          @keyframes ehpulse { 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.35);} }
          .eh-fill { fill:url(#ehGrad); }
          .kawoosh-ring { fill:none; stroke:#cdeeff; stroke-width:4; opacity:0; }
          @media (prefers-reduced-motion: reduce){ .glyph.greek-glyph{animation:none;} }
        </style>
      </defs>
    `;

    // --- Housing extérieur ---
    svg.appendChild(el("circle", { cx: CX, cy: CY, r: 372, class: "housing-outer" }));
    svg.appendChild(el("circle", { cx: CX, cy: CY, r: 300, class: "housing-inner" }));
    // encoches décoratives sur le housing
    for (let i = 0; i < 36; i++) {
      const a = i * 10 * Math.PI / 180;
      const nx = CX + 336 * Math.cos(a), ny = CY + 336 * Math.sin(a);
      svg.appendChild(el("rect", { x: nx - 3, y: ny - 6, width: 6, height: 12, rx: 1.5,
        transform: `rotate(${i * 10} ${nx} ${ny})`, class: "housing-notch" }));
    }

    // --- Bande de l'anneau tournant + trou de ver au centre ---
    ringGroup = el("g", { id: "ring-group" });
    ringGroup.appendChild(el("circle", { cx: CX, cy: CY, r: 300, class: "ring-band" }));
    ringGroup.appendChild(el("circle", { cx: CX, cy: CY, r: 256, class: "ring-band" }));

    // trou de ver (event horizon) — au centre, caché au départ
    horizon = el("g", { id: "horizon" });
    horizon.appendChild(el("circle", { cx: CX, cy: CY, r: 250, class: "eh-fill", filter: "url(#ehTurb)" }));
    kawooshRing = el("circle", { cx: CX, cy: CY, r: 250, class: "kawoosh-ring" });

    // --- Runes ---
    for (let i = 0; i < N; i++) {
      const ang = -90 + i * STEP;
      const rad = ang * Math.PI / 180;
      const x = CX + R_RING * Math.cos(rad);
      const y = CY + R_RING * Math.sin(rad);
      const g = el("g", { class: "glyph", "data-index": i,
        transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + 90).toFixed(1)})` });
      if (GREEK[i]) { g.classList.add("greek-glyph"); g.appendChild(makeGreek(GREEK[i])); }
      else g.appendChild(makeRune(i));
      g.addEventListener("click", (ev) => { ev.stopPropagation(); onGlyphClick(i); });
      ringGroup.appendChild(g);
    }

    svg.appendChild(ringGroup);
    svg.appendChild(horizon);       // horizon au-dessus de l'anneau band, sous les chevrons
    svg.appendChild(kawooshRing);

    // --- Chevrons ---
    for (let k = 0; k < N_CH; k++) {
      const c = makeChevron(k);
      if (k === 0) { c.classList.add("top"); c.addEventListener("click", onTopChevronClick); }
      chevrons.push(c);
      svg.appendChild(c);
    }

    // --- Drag pour tourner l'anneau ---
    enableDrag();

    container.innerHTML = "";
    container.appendChild(svg);
    applyRotation();
  }

  function applyRotation() {
    ringGroup.setAttribute("transform", `rotate(${rotation} ${CX} ${CY})`);
  }

  // index de la rune actuellement au sommet
  function snapTopIndex() {
    // écran angle du glyph i = -90 + i*STEP + rotation ; on veut proche de -90
    let best = 0, bestDiff = 1e9;
    for (let i = 0; i < N; i++) {
      let d = ((i * STEP + rotation) % 360 + 360) % 360; // écart / haut
      d = Math.min(d, 360 - d);
      if (d < bestDiff) { bestDiff = d; best = i; }
    }
    return best;
  }

  function targetRotationFor(i) {
    // amener le glyph i au sommet : rotation = -i*STEP
    return ((-i * STEP) % 360 + 360) % 360;
  }

  function animateRotation(target, dur, cb) {
    const start = rotation;
    let delta = ((target - start + 540) % 360) - 180; // plus court chemin
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      rotation = start + delta * e;
      applyRotation();
      if (p < 1) requestAnimationFrame(step);
      else { rotation = ((target % 360) + 360) % 360; applyRotation(); cb && cb(); }
    })(performance.now());
  }

  function onGlyphClick(i) {
    if (!interactive || busy) return;
    busy = true;
    if (window.SFX) SFX.rotate();
    animateRotation(targetRotationFor(i), 650);      // visuel (best-effort)
    // logique découplée de l'animation (fiable même si l'onglet est en arrière-plan)
    setTimeout(() => { busy = false; onCommit && onCommit(i); }, 700);
  }

  function onTopChevronClick() {
    if (!interactive || busy) return;
    const i = snapTopIndex();
    busy = true;
    if (window.SFX) SFX.rotate();
    animateRotation(targetRotationFor(i), 450);
    setTimeout(() => { busy = false; onCommit && onCommit(i); }, 500);
  }

  function enableDrag() {
    let dragging = false, lastAng = 0, moved = false;
    function angleOf(ev) {
      const rect = svg.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - (rect.left + rect.width / 2);
      const py = (ev.touches ? ev.touches[0].clientY : ev.clientY) - (rect.top + rect.height / 2);
      return Math.atan2(py, px) * 180 / Math.PI;
    }
    function down(ev) {
      if (!interactive || busy) return;
      dragging = true; moved = false; lastAng = angleOf(ev);
    }
    function move(ev) {
      if (!dragging) return;
      const a = angleOf(ev);
      let d = a - lastAng;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      if (Math.abs(d) > 0.3) moved = true;
      rotation = (rotation + d + 360) % 360;
      lastAng = a;
      applyRotation();
      if (ev.cancelable) ev.preventDefault();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      if (moved) { // snap doux sur la rune la plus proche du sommet
        const i = snapTopIndex();
        animateRotation(targetRotationFor(i), 260);
        if (window.SFX) SFX.rotate();
      }
    }
    svg.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    svg.addEventListener("touchstart", down, { passive: true });
    svg.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }

  // ---- API publique ----
  return {
    init(container, commitCb) { onCommit = commitCb; build(container); },
    setInteractive(v) { interactive = v; },

    lockChevron(step) {
      const k = LOCK_ORDER[step];
      if (k == null) return;
      chevrons[k].classList.add("engaged");
    },

    // effet film : le chevron du haut descend vers le centre, se verrouille, remonte
    dipTop() {
      const inner = chevrons[0] && chevrons[0].querySelector(".chev-inner");
      if (!inner || !inner.animate) return;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      inner.animate(
        [
          { transform: "translateY(0px)" },
          { transform: "translateY(15px)", offset: 0.35 },
          { transform: "translateY(15px)", offset: 0.6 },   // maintien = verrouillage
          { transform: "translateY(0px)" }
        ],
        { duration: 600, easing: "cubic-bezier(.4,0,.2,1)" }
      );
    },

    reset() {
      chevrons.forEach(c => c.classList.remove("engaged"));
      horizon.style.opacity = "0";
      horizon.removeAttribute("style");
      horizon.style.opacity = "0";
      // petite secousse aléatoire de l'anneau
      const rand = Math.floor(Math.random() * N);
      animateRotation(targetRotationFor(rand), 700);
    },

    // rendre le trou de ver cliquable (après ouverture) pour franchir la porte
    armHorizon(cb) {
      horizon.style.cursor = "pointer";
      horizon.classList.add("live");
      horizon.addEventListener("click", cb, { once: true });
    },

    // ouverture : grand spin + kawoosh + trou de ver
    open(done) {
      interactive = false; busy = true;
      chevrons.forEach(c => c.classList.add("engaged"));   // tous les chevrons s'allument
      const start = rotation, spins = 360 * 3 + (360 - (start % 360)), t0 = performance.now(), dur = 2600;
      (function step(now) {                 // spin visuel (best-effort)
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        rotation = start + spins * e;
        applyRotation();
        if (p < 1) requestAnimationFrame(step);
        else { rotation = rotation % 360; applyRotation(); }
      })(performance.now());
      // séquence pilotée par le temps -> fiable même si l'onglet est en arrière-plan
      setTimeout(kawoosh, dur);
      setTimeout(() => { if (window.SFX) SFX.hum(); busy = false; done && done(); }, dur + 1050);
    }
  };

  function kawoosh() {
    if (window.SFX) SFX.kawoosh();
    // anneau de choc qui s'étend
    kawooshRing.style.opacity = "0.9";
    const t0 = performance.now();
    (function ring(now) {
      const p = Math.min(1, (now - t0) / 700);
      kawooshRing.setAttribute("r", 250 + p * 130);
      kawooshRing.style.opacity = String(0.9 * (1 - p));
      if (p < 1) requestAnimationFrame(ring);
    })(performance.now());

    // le trou de ver jaillit puis se stabilise
    horizon.style.opacity = "1";
    const b0 = performance.now();
    (function burst(now) {
      const p = Math.min(1, (now - b0) / 950);
      let s;
      if (p < 0.42) s = (p / 0.42) * 1.7;                 // jaillissement
      else s = 1.7 - ((p - 0.42) / 0.58) * 0.7;           // rétraction -> 1
      horizon.setAttribute("transform", `translate(${CX} ${CY}) scale(${s.toFixed(3)}) translate(${-CX} ${-CY})`);
      if (p < 1) requestAnimationFrame(burst);
      else horizon.setAttribute("transform", `translate(${CX} ${CY}) scale(1) translate(${-CX} ${-CY})`);
    })(performance.now());
  }
})();
