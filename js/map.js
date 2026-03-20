/* UrbanIQ — map.js: Beautiful canvas city map renderer */

const MAP_STATE = {};

function renderMap(containerId = 'main-map') {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Create or reuse canvas
  let canvas = el.querySelector('canvas.city-canvas');
  let legend = el.querySelector('.map-legend');

  if (!canvas) {
    el.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.className = 'city-canvas';
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:10px;';
    el.appendChild(canvas);

    legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = `
      <span class="leg-item"><span class="leg-dot" style="background:#1e3a5f"></span>Car</span>
      <span class="leg-item"><span class="leg-dot" style="background:#2563eb"></span>Bus</span>
      <span class="leg-item"><span class="leg-dot" style="background:#dc2626"></span>Emergency</span>
      <span class="leg-item"><span class="leg-dot" style="background:#16a34a"></span>Clear</span>
      <span class="leg-item"><span class="leg-dot" style="background:#f59e0b"></span>Moderate</span>
      <span class="leg-item"><span class="leg-dot" style="background:#ef4444"></span>Congested</span>`;
    el.appendChild(legend);
  }

  // Size canvas to container
  const W = el.clientWidth || 700;
  const H = el.clientHeight || 360;
  canvas.width = W;
  canvas.height = H;

  MAP_STATE[containerId] = { canvas, W, H };
  drawCity(containerId);
}

function drawCity(containerId) {
  const state = MAP_STATE[containerId];
  if (!state) return;
  const { canvas, W, H } = state;
  const ctx = canvas.getContext('2d');

  /* ── BACKGROUND: city base ──────────────────── */
  ctx.fillStyle = '#e8f4e8';
  ctx.fillRect(0, 0, W, H);

  /* ── PARKS / GREEN AREAS ─────────────────────── */
  const parks = [
    [W*.04, H*.05, W*.12, H*.16],
    [W*.55, H*.06, W*.1, H*.14],
    [W*.82, H*.55, W*.12, H*.18],
    [W*.04, H*.68, W*.1, H*.2],
    [W*.38, H*.62, W*.08, H*.14],
  ];
  parks.forEach(([x,y,w,h]) => {
    ctx.fillStyle = '#bbf7d0';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    // Tree dots
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x + w*(.15 + i*.14), y + h*.4 + (i%2)*h*.2, 4, 0, Math.PI*2);
      ctx.fill();
    }
  });

  /* ── CITY BLOCKS (buildings) ─────────────────── */
  const blocks = buildCityBlocks(W, H);
  blocks.forEach(b => {
    // Block base
    ctx.fillStyle = b.color;
    roundRect(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    // Subtle building grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.5;
    roundRect(ctx, b.x+1, b.y+1, b.w-2, b.h-2, 3);
    ctx.stroke();
  });

  /* ── MAIN ROADS (arterials) ──────────────────── */
  const congColors = { 0: '#16a34a', 1: '#f59e0b', 2: '#ef4444' };

  // Horizontals
  const hRoads = [H*.18, H*.38, H*.58, H*.78];
  const vRoads = [W*.18, W*.38, W*.58, W*.78];

  // Road shadows first
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 16;
  [...hRoads, ...vRoads].forEach((pos, i) => {
    ctx.beginPath();
    if (i < hRoads.length) { ctx.moveTo(0, pos+2); ctx.lineTo(W, pos+2); }
    else { ctx.moveTo(pos+2, 0); ctx.lineTo(pos+2, H); }
    ctx.stroke();
  });

  // Road fill
  hRoads.forEach((y, i) => {
    const cong = R(0, 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    // Lane color overlay
    ctx.strokeStyle = congColors[cong];
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.globalAlpha = 1;
    // Center dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.setLineDash([]);
  });

  vRoads.forEach((x, i) => {
    const cong = R(0, 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.strokeStyle = congColors[cong];
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.setLineDash([]);
  });

  /* ── INTERSECTIONS ───────────────────────────── */
  hRoads.forEach(y => {
    vRoads.forEach(x => {
      // Intersection box
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x-7, y-7, 14, 14);
      // White stop lines
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x-9, y-5); ctx.lineTo(x-9, y+5);
      ctx.moveTo(x+9, y-5); ctx.lineTo(x+9, y+5);
      ctx.moveTo(x-5, y-9); ctx.lineTo(x+5, y-9);
      ctx.moveTo(x-5, y+9); ctx.lineTo(x+5, y+9);
      ctx.stroke();
    });
  });

  /* ── VEHICLES ────────────────────────────────── */
  S.vehicles.slice(0, 55).forEach(v => {
    const cx = (v.x / 100) * W;
    const cy = (v.y / 100) * H;

    if (v.type === 'bus') {
      // Bus: rounded rectangle
      ctx.fillStyle = '#1d4ed8';
      ctx.shadowColor = 'rgba(29,78,216,0.4)';
      ctx.shadowBlur = 4;
      roundRect(ctx, cx-5, cy-3, 10, 6, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(cx-4, cy-2, 2, 2);
      ctx.fillRect(cx+2, cy-2, 2, 2);
    } else if (v.type === 'emergency') {
      // Emergency: bright red with glow
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = 'rgba(220,38,38,0.6)';
      ctx.shadowBlur = 8;
      roundRect(ctx, cx-5, cy-3, 10, 6, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Flashing light
      if (Math.floor(Date.now() / 400) % 2 === 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(cx, cy-4, 2, 0, Math.PI*2); ctx.fill();
      }
    } else {
      // Car: small circle with direction indicator
      ctx.fillStyle = v.speed > 60 ? '#0f172a' : '#1e3a5f';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  /* ── INCIDENT MARKERS ────────────────────────── */
  S.alerts.filter(a => a.sev === 'critical' && !a.dismissed).slice(0, 4).forEach((a, i) => {
    const cx = W * (0.25 + i * 0.18);
    const cy = H * (0.3 + (i % 2) * 0.35);
    // Pulse ring
    ctx.strokeStyle = 'rgba(239,68,68,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 14 + (Date.now() % 1000) / 100, 0, Math.PI*2); ctx.stroke();
    // Red circle
    ctx.fillStyle = '#fee2e2';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // ! symbol
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, cy);
  });

  /* ── LIVE LABEL ──────────────────────────────── */
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(8, 8, 80, 20);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 9px DM Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('● LIVE MAP', 14, 18);

  // Vehicle count badge
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(8, 32, 100, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = '9px DM Mono, monospace';
  ctx.fillText(`${S.vehicles.length} vehicles active`, 12, 41);
}

function buildCityBlocks(W, H) {
  const blocks = [];
  const hRoads = [H*.18, H*.38, H*.58, H*.78];
  const vRoads = [W*.18, W*.38, W*.58, W*.78];
  const colors = ['#dbeafe','#ede9fe','#fce7f3','#fff7ed','#dcfce7','#e0e7ff','#f0fdf4','#fef9c3'];

  const xs = [0, ...vRoads.map(x => x+7), W];
  const ys = [0, ...hRoads.map(y => y+7), H];

  for (let r = 0; r < ys.length-1; r++) {
    for (let c = 0; c < xs.length-1; c++) {
      const x = xs[c] + (c===0?0:0);
      const y = ys[r] + (r===0?0:0);
      const w = xs[c+1] - x - 7;
      const h = ys[r+1] - y - 7;
      if (w > 8 && h > 8) {
        blocks.push({ x, y, w, h, color: colors[(r*xs.length+c) % colors.length] });
      }
    }
  }
  return blocks;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function animateVehicles(containerId = 'main-map') {
  const state = MAP_STATE[containerId];
  if (!state) { renderMap(containerId); return; }
  const { canvas, W, H } = state;
  const ctx = canvas.getContext('2d');

  // Only redraw vehicles and incidents (partial redraw for perf)
  // For simplicity, redraw full city every 2nd frame
  if (!state.frame) state.frame = 0;
  state.frame++;
  if (state.frame % 2 === 0) {
    drawCity(containerId);
  } else {
    // Quick vehicle-only pass
    // Redraw just the upper layer
    drawCity(containerId);
  }
}
