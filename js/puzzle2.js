/* ============================================================================
   Épreuve 2 — Machine alien à spirale de Fibonacci (design original)
   Pavage de Fibonacci : carrés 1,1,2,3,5,8 (spirale). Le "cœur" de charge se
   remplit en spirale de tournesol (phyllotaxie de Fibonacci).
   Phase A : activer les cellules dans l'ordre croissant en suivant la spirale.
   Phase B : charger le cœur au nombre suivant (13) pour éveiller la machine.
   ============================================================================ */
window.Puzzle2 = (function () {
  const SVGNS = "http://www.w3.org/2000/svg";

  // rects en unités (y vers le bas) — pavage de Fibonacci
  const CELLS = [
    { v: 1, r: [0, 0, 1, 1] },
    { v: 1, r: [1, 0, 2, 1] },
    { v: 2, r: [0, -2, 2, 0] },
    { v: 3, r: [-3, -2, 0, 1] },
    { v: 5, r: [-3, 1, 2, 6] },
    { v: 8, r: [2, -2, 10, 6] }
  ];
  const ASC = [1, 1, 2, 3, 5, 8];       // ordre d'activation attendu
  const TARGET = 13;                     // charge finale = nombre suivant
  const CORE = { cx: 3.5, cy: 9.6, r: 2.6 };

  let refs, machineSvg, cellEls = [], coreGemsG, coreEl, chargeCount = 0, progress = 0, phase = "A", done = false;

  function el(name, attrs) {
    const e = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // gemmes en grille centrée dans une cellule
  function gemLayout(rect, v) {
    const [x0, y0, x1, y1] = rect;
    const w = x1 - x0, h = y1 - y0;
    const pad = Math.min(w, h) * 0.24;
    const aw = w - 2 * pad, ah = h - 2 * pad;
    const cols = Math.ceil(Math.sqrt(v));
    const rows = Math.ceil(v / cols);
    const gx = aw / cols, gy = ah / rows;
    const gr = Math.min(gx, gy) * 0.26;
    const pts = []; let n = 0;
    for (let ry = 0; ry < rows && n < v; ry++) {
      const inRow = Math.min(cols, v - n);
      const startX = x0 + pad + (aw - inRow * gx) / 2 + gx / 2;
      for (let c = 0; c < inRow; c++) { pts.push({ x: startX + c * gx, y: y0 + pad + gy / 2 + ry * gy, r: gr }); n++; }
    }
    return pts;
  }

  // gemmes du cœur : phyllotaxie (tournesol) — angle d'or 137.5°
  function coreLayout(n) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const gr = CORE.r * 0.17;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const rr = CORE.r * 0.82 * Math.sqrt((i + 0.5) / Math.max(n, 1));
      const th = i * golden;
      pts.push({ x: CORE.cx + rr * Math.cos(th), y: CORE.cy + rr * Math.sin(th), r: gr });
    }
    return pts;
  }

  // spirale logarithmique dorée superposée au pavage (décor)
  function goldenSpiralPath() {
    const ex = 1.0, ey = 0.3, A = 1.9, b = Math.log(1.618) / (Math.PI / 2);
    let d = "", first = true;
    for (let deg = 270; deg >= -360; deg -= 5) {
      const th = deg * Math.PI / 180;
      const r = A * Math.exp(b * th);
      if (r > 12) continue;
      const x = ex + r * Math.cos(th);
      const y = ey - r * Math.sin(th);
      d += (first ? "M" : "L") + x.toFixed(3) + " " + y.toFixed(3) + " ";
      first = false;
    }
    return d.trim();
  }

  function buildMachine(container) {
    machineSvg = el("svg", { viewBox: "-5 -4 17.5 18.4", class: "machine-svg", preserveAspectRatio: "xMidYMid meet" });
    machineSvg.innerHTML = `
      <defs>
        <linearGradient id="mBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a2f3a"/><stop offset="55%" stop-color="#1a1e28"/><stop offset="100%" stop-color="#0c0f16"/>
        </linearGradient>
        <radialGradient id="mScreen" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stop-color="#0c1a22"/><stop offset="100%" stop-color="#05090f"/>
        </radialGradient>
        <radialGradient id="coreG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3a2560"/><stop offset="100%" stop-color="#0a0714"/>
        </radialGradient>
        <filter id="mGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <style>
          .m-body { fill:url(#mBody); stroke:#414a5e; stroke-width:.14; }
          .m-screen { fill:url(#mScreen); stroke:#243244; stroke-width:.08; }
          .m-etch { stroke:#2f3d52; stroke-width:.05; fill:none; opacity:.7; }
          .cell-frame { fill:rgba(20,40,54,.22); stroke:#3a5a70; stroke-width:.06; transition:all .3s ease; }
          .cell.lit .cell-frame { fill:rgba(30,120,150,.2); stroke:#7fe6ff; stroke-width:.1; }
          .cell { cursor:pointer; }
          .cell.done { cursor:default; }
          .gem { fill:#2f5266; transition:fill .3s ease, filter .3s ease; }
          .cell.lit .gem { fill:#9fe8ff; filter:url(#mGlow); }
          .spiral { fill:none; stroke:#e9c46a; stroke-width:.09; opacity:.55; stroke-linecap:round;
                    filter:url(#mGlow); transition:opacity .5s ease, stroke-width .5s ease; }
          .machine-svg.awake .spiral { opacity:1; stroke-width:.15; }
          .core-ring { fill:url(#coreG); stroke:#5a4780; stroke-width:.1; transition:all .4s ease; }
          .core.armed .core-ring { stroke:#c39bff; stroke-width:.16; filter:url(#mGlow); }
          .core-dash { fill:none; stroke:#6a5a86; stroke-width:.06; stroke-dasharray:.5 .35; opacity:.8; }
          .core-gem { fill:#c9a0ff; filter:url(#mGlow); }
          .machine-svg.awake .core-ring { stroke:#e0c4ff; }
        </style>
      </defs>
    `;

    // corps + socle
    machineSvg.appendChild(el("path", { class: "m-body",
      d: "M -4.4 -3.4 Q -4.4 -3.8 -4 -3.8 L 11 -3.8 Q 11.4 -3.8 11.4 -3.4 L 11.4 12.4 L 9 14 L -2 14 L -4.4 12.4 Z" }));
    // écran (pavage)
    machineSvg.appendChild(el("rect", { class: "m-screen", x: -3.7, y: -2.7, width: 14.2, height: 9.4, rx: 0.4 }));

    // gravures aliens (originales)
    const etch = el("g", { class: "m-etch" });
    etch.appendChild(el("circle", { cx: -4, cy: 9.6, r: 0.22 }));
    etch.appendChild(el("circle", { cx: 11, cy: 9.6, r: 0.22 }));
    etch.appendChild(el("path", { d: "M -3.6 12.8 L 10.6 12.8" }));
    machineSvg.appendChild(etch);

    // cellules du pavage (compteurs visibles = indice implicite)
    cellEls = [];
    CELLS.forEach((c, i) => {
      const g = el("g", { class: "cell", "data-i": i });
      const [x0, y0, x1, y1] = c.r;
      g.appendChild(el("rect", { class: "cell-frame", x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 0.1 }));
      gemLayout(c.r, c.v).forEach(p => g.appendChild(el("circle", { class: "gem", cx: p.x, cy: p.y, r: p.r })));
      g.addEventListener("click", () => onCellClick(i));
      machineSvg.appendChild(g);
      cellEls.push(g);
    });

    // spirale dorée décorative
    machineSvg.appendChild(el("path", { class: "spiral", d: goldenSpiralPath() }));

    // cœur de charge (vide) + gemmes
    coreEl = el("g", { class: "core" });
    coreEl.appendChild(el("circle", { class: "core-ring", cx: CORE.cx, cy: CORE.cy, r: CORE.r }));
    coreEl.appendChild(el("circle", { class: "core-dash", cx: CORE.cx, cy: CORE.cy, r: CORE.r - 0.35 }));
    coreGemsG = el("g", { class: "core-gems" });
    coreEl.appendChild(coreGemsG);
    machineSvg.appendChild(coreEl);

    container.innerHTML = "";
    container.appendChild(machineSvg);
  }

  function msg(text, cls, hold) {
    const m = refs.messageEl;
    m.className = "message show " + (cls || "");
    m.textContent = text;
    clearTimeout(msg._t);
    if (hold !== true) msg._t = setTimeout(() => m.classList.remove("show"), 2000);
  }

  function onCellClick(i) {
    if (done || phase !== "A") return;
    const c = CELLS[i], g = cellEls[i];
    if (g.classList.contains("lit")) return;
    if (c.v === ASC[progress]) {
      g.classList.add("lit", "done");
      if (window.SFX) SFX.chevron();
      progress++;
      if (progress >= ASC.length) setTimeout(startPhaseB, 500);
      else msg("Cellule activée", "ok");
    } else {
      if (window.SFX) SFX.error();
      msg("Séquence instable — la matrice se réinitialise", "err");
      progress = 0;
      cellEls.forEach(e => e.classList.remove("lit", "done"));
    }
  }

  function startPhaseB() {
    phase = "B";
    coreEl.classList.add("armed");
    setCharge(0);
    refs.chargePanel.hidden = false;
    msg("Le cœur attend son flux — alimente-le.", "ok", true);
  }

  function renderCore() {
    coreGemsG.innerHTML = "";
    coreLayout(chargeCount).forEach(p =>
      coreGemsG.appendChild(el("circle", { class: "core-gem", cx: p.x, cy: p.y, r: p.r })));
  }

  function setCharge(n) {
    chargeCount = Math.max(0, Math.min(21, n));
    refs.countEl.textContent = chargeCount;
    renderCore();
    if (window.SFX) SFX.rotate();
  }

  function activate() {
    if (done || phase !== "B") return;
    if (chargeCount === TARGET) {
      done = true;
      refs.chargePanel.hidden = true;
      machineSvg.classList.add("awake");
      msg("La machine s'éveille…", "win", true);
      if (window.SFX) { SFX.kawoosh(); setTimeout(() => SFX.hum(), 700); }
      setTimeout(() => Reveal.show(), 2200);
    } else {
      if (window.SFX) SFX.error();
      msg("Surcharge instable — flux dissipé", "err");
      setCharge(0);
    }
  }

  return {
    init(r) {
      refs = r; progress = 0; phase = "A"; done = false; chargeCount = 0;
      buildMachine(refs.machineEl);
      refs.minusBtn.addEventListener("click", () => setCharge(chargeCount - 1));
      refs.plusBtn.addEventListener("click", () => setCharge(chargeCount + 1));
      refs.activateBtn.addEventListener("click", activate);
      refs.chargePanel.hidden = true;
      setTimeout(() => msg("Une machine ancienne sommeille. Réveille sa spirale.", "", true), 600);
    }
  };
})();
