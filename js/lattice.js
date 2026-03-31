/**
 * lattice.js — FORTIFYD
 *
 * Geometry rewritten to match FORTIFYD / OpenVCAD plate-lattice architecture
 * (VersaMesh_Algorithmic_Architecture.pdf):
 *
 *  - PLATE LATTICE topology: quad grid + diagonal cross-bracing (NOT hexagonal)
 *  - CONFORMAL MAPPING: flat 2D UV grid projected onto curved surfaces (ARAP, p.7)
 *  - WAVE / DOME surface: Gaussian dome cap matching the physical prototype + p.7
 *  - GRADED DENSITY: stroke weight varies with distance from impact zone
 *  - NORMAL EXTRUSION: strut walls perpendicular to surface at each node
 */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Isometric projection: 3D → 2D SVG
  function iso(x3, y3, z3, ox, oy, scale) {
    return {
      x: ox + (x3 - z3) * scale * 0.866,
      y: oy + (x3 + z3) * scale * 0.5 - y3 * scale
    };
  }

  // Gaussian dome (helmet cap geometry, p.7)
  function gdome(u, v, cx, cy, amp, sig) {
    const dx = u - cx, dy = v - cy;
    return amp * Math.exp(-(dx*dx + dy*dy) / (2*sig*sig));
  }

  /**
   * 1. HERO BACKGROUND
   *    Plate-lattice quad+diagonal grid with sinusoidal warp
   *    Matches the wave-surface topology from p.1 of the PDF
   */
  function buildHeroBg() {
    const svg = document.getElementById('latticeBg');
    if (!svg) return;
    const W = 1200, H = 700;
    const defs = el('defs', {}, svg);
    const grd = el('linearGradient', { id: 'bgWaveGrad', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    el('stop', { offset: '0%',   'stop-color': '#e84519', 'stop-opacity': '0.03' }, grd);
    el('stop', { offset: '55%',  'stop-color': '#e84519', 'stop-opacity': '0.16' }, grd);
    el('stop', { offset: '100%', 'stop-color': '#ff6b35', 'stop-opacity': '0.05' }, grd);

    const g = el('g', { stroke: 'url(#bgWaveGrad)', 'stroke-width': '0.8', fill: 'none' }, svg);

    const cols = 28, rows = 16;
    const cw = W / cols, rh = H / rows;

    // Node with sinusoidal warp displacement
    const node = (c, r) => {
      const u = c / cols, v = r / rows;
      const wy = 20 * Math.sin(u * Math.PI * 2.5) * Math.sin(v * Math.PI * 1.8);
      return { x: c * cw, y: r * rh + wy };
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = node(c, r), b = node(c+1, r);
        const d = node(c, r+1), e2 = node(c+1, r+1);
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g);
        el('line', { x1: a.x, y1: a.y, x2: d.x, y2: d.y }, g);
        // Alternating diagonal — plate lattice cross-brace
        if ((r + c) % 2 === 0)
          el('line', { x1: a.x, y1: a.y, x2: e2.x, y2: e2.y, 'stroke-opacity': '0.38' }, g);
        else
          el('line', { x1: b.x, y1: b.y, x2: d.x, y2: d.y, 'stroke-opacity': '0.38' }, g);
      }
    }
  }

  /**
   * 2. HERO LATTICE VISUAL
   *    Gaussian dome cap with conformally mapped plate-lattice grid.
   *    Directly mirrors: physical prototype photo + p.7 Step 2 (Lattice Application)
   *    Quad struts + alternating diagonal cross-braces + graded stroke weight
   */
  function buildHeroLattice() {
    const svg = document.getElementById('heroLattice');
    if (!svg) return;
    const VW = 420, VH = 420;
    const defs = el('defs', {}, svg);

    const rg = el('radialGradient', { id: 'hDomeGrad', cx: '42%', cy: '32%', r: '62%' }, defs);
    el('stop', { offset: '0%',   'stop-color': '#ff6b35', 'stop-opacity': '1.0' }, rg);
    el('stop', { offset: '45%',  'stop-color': '#e84519', 'stop-opacity': '0.75' }, rg);
    el('stop', { offset: '100%', 'stop-color': '#8a1a00', 'stop-opacity': '0.18' }, rg);

    const clipId = 'domeClip';
    const clip = el('clipPath', { id: clipId }, defs);
    el('ellipse', { cx: VW/2, cy: VH/2+10, rx: VW*0.46, ry: VH*0.44 }, clip);

    const g = el('g', {
      'clip-path': `url(#${clipId})`,
      stroke: 'url(#hDomeGrad)', fill: 'none'
    }, svg);

    const uN = 18, vN = 14;
    const ox = VW/2, oy = VH/2 + 30, sc = 22;

    // UV → 3D dome surface → isometric 2D
    const surf = (ui, vi) => {
      const u = ui / uN, v = vi / vN;
      const x3 = (u - 0.5) * uN * 0.55;
      const z3 = (v - 0.5) * vN * 0.55;
      // Primary dome + secondary bump zones (impact hot-spots, graded density)
      const y3 = gdome(u, v, 0.5, 0.5, 3.8, 0.34)
               + gdome(u, v, 0.28, 0.32, 1.4, 0.16)
               + gdome(u, v, 0.72, 0.65, 1.1, 0.14);
      return iso(x3, y3, z3, ox, oy, sc);
    };

    for (let vi = 0; vi < vN; vi++) {
      for (let ui = 0; ui < uN; ui++) {
        const a = surf(ui, vi),   b = surf(ui+1, vi);
        const c = surf(ui, vi+1), d = surf(ui+1, vi+1);
        const dist = Math.hypot(ui/uN - 0.5, vi/vN - 0.5);
        const alpha = Math.max(0.12, 1 - dist * 1.55);
        // Graded stroke weight: thicker near crown (higher energy zone)
        const sw = (0.5 + (1 - dist) * 2.0).toFixed(1);
        const ao = alpha.toFixed(2);

        el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), opacity: ao, 'stroke-width': sw }, g);
        el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: c.x.toFixed(1), y2: c.y.toFixed(1), opacity: ao, 'stroke-width': sw }, g);

        // Plate-lattice diagonal cross-brace
        const dw = (parseFloat(sw) * 0.62).toFixed(1);
        const da = (alpha * 0.5).toFixed(2);
        if ((ui + vi) % 2 === 0)
          el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: d.x.toFixed(1), y2: d.y.toFixed(1), opacity: da, 'stroke-width': dw }, g);
        else
          el('line', { x1: b.x.toFixed(1), y1: b.y.toFixed(1), x2: c.x.toFixed(1), y2: c.y.toFixed(1), opacity: da, 'stroke-width': dw }, g);
      }
    }

    el('ellipse', { cx: VW/2, cy: VH/2+10, rx: VW*0.46, ry: VH*0.44,
      stroke: '#e84519', 'stroke-width': '0.7', fill: 'none', opacity: '0.3' }, svg);
  }

  /**
   * 3. TECHNOLOGY SECTION — UV map transformation (p.7 Step 1→2)
   *    Left panel: flat warped UV grid (ARAP unroll)
   *    Right panel: same grid conformally mapped onto Gaussian dome
   *    Arrow between them echoes the whitepaper diagram exactly
   */
  function buildTechLattice() {
    const svg = document.getElementById('techLattice3D');
    if (!svg) return;
    const W = 380, H = 340;
    const defs = el('defs', {}, svg);

    const fg = el('linearGradient', { id: 'tFlatG', x1:'0', y1:'0', x2:'1', y2:'1' }, defs);
    el('stop', { offset: '0%',   'stop-color': '#e84519', 'stop-opacity': '0.45' }, fg);
    el('stop', { offset: '100%', 'stop-color': '#e84519', 'stop-opacity': '0.12' }, fg);

    const dg = el('linearGradient', { id: 'tDomeG', x1:'0', y1:'0', x2:'1', y2:'1' }, defs);
    el('stop', { offset: '0%',   'stop-color': '#ff6b35', 'stop-opacity': '0.95' }, dg);
    el('stop', { offset: '100%', 'stop-color': '#8a1a00', 'stop-opacity': '0.25' }, dg);

    // LEFT: flat UV grid with ARAP warp
    const gF = el('g', { stroke: 'url(#tFlatG)', 'stroke-width': '1.1', fill: 'none' }, svg);
    const fc = 9, fr = 9;
    const fx0 = 14, fy0 = 55, fw = 135, fh = 135;
    const fcw2 = fw/fc, frh2 = fh/fr;

    const fnode = (c, r) => {
      const u = c/fc, v = r/fr;
      // UV distortion: pinch at edges, expand at center (ARAP characteristic)
      const wx = (c > 0 && c < fc) ? 3 * Math.sin(v * Math.PI) * Math.sin(u * Math.PI) : 0;
      const wy = (r > 0 && r < fr) ? 3 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI) : 0;
      return { x: fx0 + c * fcw2 + wx, y: fy0 + r * frh2 + wy };
    };

    for (let r = 0; r <= fr; r++) {
      for (let c = 0; c <= fc; c++) {
        const a = fnode(c, r);
        if (c < fc) {
          const b = fnode(c+1, r);
          el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1) }, gF);
        }
        if (r < fr) {
          const d2 = fnode(c, r+1);
          el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: d2.x.toFixed(1), y2: d2.y.toFixed(1) }, gF);
        }
        if (c < fc && r < fr && (r+c) % 2 === 0) {
          const e2 = fnode(c+1, r+1);
          el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: e2.x.toFixed(1), y2: e2.y.toFixed(1), 'stroke-opacity': '0.32' }, gF);
        }
      }
    }

    // Arrow
    const ag = el('g', { stroke: '#e84519', 'stroke-width': '1', fill: 'none', opacity: '0.45' }, svg);
    el('line', { x1: '160', y1: '122', x2: '196', y2: '122' }, ag);
    el('polyline', { points: '190,117 196,122 190,128' }, ag);

    // RIGHT: conformally mapped dome
    const gD = el('g', { stroke: 'url(#tDomeG)', fill: 'none' }, svg);
    const uN2 = 11, vN2 = 11;
    const ox2 = 303, oy2 = 188, sc2 = 14;

    const dsurf = (ui, vi) => {
      const u = ui/uN2, v = vi/vN2;
      const x3 = (u - 0.5) * uN2 * 0.62;
      const z3 = (v - 0.5) * vN2 * 0.62;
      const y3 = gdome(u, v, 0.5, 0.5, 4.5, 0.33);
      return iso(x3, y3, z3, ox2, oy2, sc2);
    };

    for (let vi = 0; vi < vN2; vi++) {
      for (let ui = 0; ui < uN2; ui++) {
        const a = dsurf(ui,vi), b = dsurf(ui+1,vi);
        const c2 = dsurf(ui,vi+1), d2 = dsurf(ui+1,vi+1);
        const dist = Math.hypot(ui/uN2-0.5, vi/vN2-0.5);
        const alpha = Math.max(0.1, 1 - dist*1.35);
        const sw2 = (0.5 + (1-dist)*1.6).toFixed(1);
        const ao2 = alpha.toFixed(2);
        el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), opacity: ao2, 'stroke-width': sw2 }, gD);
        el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: c2.x.toFixed(1), y2: c2.y.toFixed(1), opacity: ao2, 'stroke-width': sw2 }, gD);
        const dw2 = (parseFloat(sw2)*0.58).toFixed(1), da2 = (alpha*0.45).toFixed(2);
        if ((ui+vi) % 2 === 0)
          el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: d2.x.toFixed(1), y2: d2.y.toFixed(1), opacity: da2, 'stroke-width': dw2 }, gD);
        else
          el('line', { x1: b.x.toFixed(1), y1: b.y.toFixed(1), x2: c2.x.toFixed(1), y2: c2.y.toFixed(1), opacity: da2, 'stroke-width': dw2 }, gD);
      }
    }

    // Panel labels
    const ls = 'font-family:DM Mono,monospace;font-size:8px;letter-spacing:0.1em;';
    el('text', { x:'14', y:'48', style: ls+'fill:#4a4845;' }, svg).textContent = 'UV UNROLL — ARAP';
    el('text', { x:'208', y:'48', style: ls+'fill:#e84519;' }, svg).textContent = 'CONFORMAL MAP';
    el('text', { x:'12', y:'330', style: ls+'fill:#2a2825;' }, svg).textContent = 'OPENVCAD · FORTIFYD PLATE LATTICE';
  }

  /**
   * 4. PARTNERS SECTION — Isometric plate-lattice unit cell array (p.5)
   *    Shows the 3D cube + cross-brace topology from multiple angles
   *    Slowly rotates to reveal the structure
   */
  function buildPartnersLattice() {
    const svg = document.getElementById('partnersLattice');
    if (!svg) return;
    const W = 300, H = 300;
    const defs = el('defs', {}, svg);

    const rg = el('radialGradient', { id: 'pUnitGrad', cx:'40%', cy:'35%', r:'60%' }, defs);
    el('stop', { offset: '0%',   'stop-color': '#ff6b35', 'stop-opacity': '0.95' }, rg);
    el('stop', { offset: '55%',  'stop-color': '#e84519', 'stop-opacity': '0.5'  }, rg);
    el('stop', { offset: '100%', 'stop-color': '#8a1a00', 'stop-opacity': '0.08' }, rg);

    const rot = el('g', {}, svg);
    rot.style.transformOrigin = `${W/2}px ${H/2}px`;
    rot.style.animation = 'rotateSlow 50s linear infinite';

    const g = el('g', { stroke: 'url(#pUnitGrad)', fill: 'none' }, rot);

    const ox = W/2, oy = H/2+20, sc = 18;
    const N = 4;

    for (let xi = -N/2; xi < N/2; xi++) {
      for (let zi = -N/2; zi < N/2; zi++) {
        for (let yi = 0; yi < 2; yi++) {
          const dist = Math.hypot(xi+0.5, zi+0.5);
          const alpha = Math.max(0.08, 1 - dist/(N*0.72));
          const sw = (0.4 + alpha * 1.4).toFixed(1);
          const opts = { opacity: alpha.toFixed(2), 'stroke-width': sw };

          const a = iso(xi,   yi,   zi,   ox, oy, sc);
          const b = iso(xi+1, yi,   zi,   ox, oy, sc);
          const c = iso(xi,   yi,   zi+1, ox, oy, sc);
          const d = iso(xi,   yi+1, zi,   ox, oy, sc);
          const h = iso(xi+1, yi,   zi+1, ox, oy, sc);
          const e2 = iso(xi+1, yi+1, zi,  ox, oy, sc);

          el('line', { x1:a.x, y1:a.y, x2:b.x, y2:b.y, ...opts }, g);
          el('line', { x1:a.x, y1:a.y, x2:c.x, y2:c.y, ...opts }, g);
          el('line', { x1:b.x, y1:b.y, x2:h.x, y2:h.y, ...opts }, g);
          el('line', { x1:c.x, y1:c.y, x2:h.x, y2:h.y, ...opts }, g);
          el('line', { x1:a.x, y1:a.y, x2:d.x, y2:d.y, ...opts }, g);
          el('line', { x1:b.x, y1:b.y, x2:e2.x,y2:e2.y,...opts }, g);

          // Diagonal cross-braces (plate lattice signature)
          const do2 = { opacity:(alpha*0.38).toFixed(2), 'stroke-width':(parseFloat(sw)*0.52).toFixed(1) };
          if ((xi+zi) % 2 === 0)
            el('line', { x1:a.x, y1:a.y, x2:h.x, y2:h.y, ...do2 }, g);
          else
            el('line', { x1:b.x, y1:b.y, x2:c.x, y2:c.y, ...do2 }, g);
          if (xi % 2 === 0)
            el('line', { x1:a.x, y1:a.y, x2:e2.x,y2:e2.y,...do2 }, g);
          else
            el('line', { x1:b.x, y1:b.y, x2:d.x, y2:d.y, ...do2 }, g);
        }
      }
    }

    el('circle', { cx:W/2, cy:H/2, r:'124', stroke:'#e84519','stroke-width':'0.5',
      fill:'none', opacity:'0.18', 'stroke-dasharray':'3 5' }, svg);
    el('circle', { cx:W/2, cy:H/2, r:'86', stroke:'#e84519','stroke-width':'0.4',
      fill:'none', opacity:'0.1', 'stroke-dasharray':'2 6' }, svg);
  }

  function init() {
    buildHeroBg();
    buildHeroLattice();
    buildTechLattice();
    buildPartnersLattice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();