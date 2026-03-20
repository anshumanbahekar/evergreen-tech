/* UrbanIQ — ui.js: all rendering/drawing functions */

/* ── NAV ─────────────────────────────────────────── */
function renderNav() {
  const sections = [
    { id: 'dashboard',    label: 'Dashboard',    ic: 'chart' },
    { id: 'traffic',      label: 'Traffic',      ic: 'traffic' },
    { id: 'navigation',   label: 'Navigation',   ic: 'route' },
    { id: 'transport',    label: 'Transport',    ic: 'bus' },
    { id: 'parking',      label: 'Parking',      ic: 'parking' },
    { id: 'emergency',    label: 'Emergency',    ic: 'emergency' },
    { id: 'environment',  label: 'Environment',  ic: 'leaf' },
    { id: 'citizen',      label: 'Citizen',      ic: 'users' },
    { id: 'analytics',    label: 'Analytics',    ic: 'activity' },
    { id: 'advanced',     label: 'Advanced',     ic: 'robot' },
    { id: 'settings',     label: 'Settings',     ic: 'settings' },
  ];
  const nav = document.getElementById('nav-tabs');
  if (!nav) return;
  nav.innerHTML = sections.map(s =>
    `<button class="nav-tab${s.id === 'dashboard' ? ' active' : ''}" onclick="switchSection('${s.id}', this)">
      ${icon(s.ic, 'nav-ic')} ${s.label}
    </button>`
  ).join('');
}

/* ── TICKER ──────────────────────────────────────── */
function renderTicker() {
  const items = [
    'Traffic flow normal on Highway 7',
    'Bus Route 42 delayed by 8 mins due to congestion',
    'Air Quality: GOOD — AQI 47',
    'Parking Lot C reaching capacity (92%)',
    'Smart signal optimization active at 12 intersections',
    'EV Charging Zone A: 3 of 8 stations available',
    'Road works on Oak Ave — expect delays',
    'Emergency vehicle corridor active: 5th Ave',
    'Carpool matching: 14 new rides available',
    'Drone delivery corridor operational — Zone 3',
  ];
  const t = document.getElementById('ticker-text');
  if (t) t.textContent = items.join('   •   ') + '   •   ';
}

/* ── DASHBOARD STATS ─────────────────────────────── */
function renderStats() {
  const cards = [
    { label: 'Vehicles Online',  val: S.vehicles.length, unit: '',   trend: '+3%',  ic: 'car',        col: 'g' },
    { label: 'Active Incidents', val: S.alerts.filter(a=>a.sev==='critical').length, unit: '', trend: '-1', ic: 'alert', col: 'r' },
    { label: 'Buses On-Time',    val: S.buses.filter(b=>!b.delay).length, unit: `/${S.buses.length}`, trend: 'Live', ic: 'bus', col: 'b' },
    { label: 'Parking Free',     val: S.parking.reduce((a,p)=>a+p.free,0), unit: ' spots', trend: 'Live', ic: 'parking', col: 'o' },
    { label: 'AQI Index',        val: S.env.find(e=>e.id==='aqi')?.val || 47, unit: '', trend: 'Good', ic: 'leaf', col: 'g' },
    { label: 'Avg Speed',        val: Math.round(S.vehicles.reduce((a,v)=>a+v.speed,0)/Math.max(S.vehicles.length,1)), unit: ' km/h', trend: 'Normal', ic: 'activity', col: 'p' },
    { label: 'Smart Lights',     val: S.trafficLights.length, unit: ' active', trend: 'AI Mode', ic: 'zap', col: 'y' },
    { label: 'CO₂ Saved',        val: '1.2', unit: 't today', trend: '+0.2t', ic: 'recycle', col: 'g' },
  ];
  const el = document.getElementById('stat-cards');
  if (!el) return;
  el.innerHTML = cards.map(c => `
    <div class="stat-card stat-${c.col}">
      <div class="stat-icon">${icon(c.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${c.val}<span class="stat-unit">${c.unit}</span></div>
        <div class="stat-label">${c.label}</div>
      </div>
      <div class="stat-trend">${c.trend}</div>
    </div>
  `).join('');
}

/* ── MAP ─────────────────────────────────────────── */
function renderMap(containerId = 'main-map') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const W = el.clientWidth || 600, H = el.clientHeight || 380;

  // Road grid definitions
  const roads = [
    // horizontal
    { x1:0,   y1:80,  x2:W,   y2:80,  w:14, cong: R(0,2) },
    { x1:0,   y1:180, x2:W,   y2:180, w:10, cong: R(0,2) },
    { x1:0,   y1:280, x2:W,   y2:280, w:10, cong: R(0,2) },
    // vertical
    { x1:100, y1:0,   x2:100, y2:H,   w:14, cong: R(0,2) },
    { x1:280, y1:0,   x2:280, y2:H,   w:10, cong: R(0,2) },
    { x1:460, y1:0,   x2:460, y2:H,   w:10, cong: R(0,2) },
  ];

  const congColors = ['#22c55e','#f59e0b','#ef4444'];

  let vehiclesSvg = S.vehicles.slice(0, 40).map(v => {
    const cx = (v.x / 100) * W;
    const cy = (v.y / 100) * H;
    const col = v.type === 'emergency' ? '#ef4444' : v.type === 'bus' ? '#3b82f6' : '#166534';
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${v.type==='bus'?6:4}" fill="${col}" opacity="0.85" class="map-vehicle" data-id="${v.id}"/>`;
  }).join('');

  let incidentsSvg = S.alerts.filter(a=>a.sev==='critical').slice(0,3).map((a,i) => {
    const cx = R(60,W-60), cy = R(40,H-40);
    return `<g transform="translate(${cx},${cy})">
      <circle r="10" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
      <text x="0" y="4" text-anchor="middle" font-size="10" fill="#ef4444">!</text>
    </g>`;
  }).join('');

  el.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="map-svg">
      <rect width="${W}" height="${H}" fill="#f0fdf4"/>
      <!-- City blocks -->
      ${[[110,90,160,80],[290,90,160,80],[110,190,160,80],[290,190,160,80],[110,290,160,70],[290,290,160,70]].map(
        ([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#dcfce7" stroke="#bbf7d0" stroke-width="1"/>`
      ).join('')}
      <!-- Roads -->
      ${roads.map(r => `<line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="${congColors[r.cong]}" stroke-width="${r.w}" stroke-linecap="round" opacity="0.8"/>`).join('')}
      <!-- Intersections -->
      ${[[100,80],[280,80],[460,80],[100,180],[280,180],[460,180],[100,280],[280,280],[460,280]].map(
        ([x,y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#fff" stroke="#16a34a" stroke-width="2"/>`
      ).join('')}
      <!-- Vehicles -->
      ${vehiclesSvg}
      <!-- Incidents -->
      ${incidentsSvg}
      <!-- Labels -->
      <text x="8" y="14" font-size="9" fill="#15803d" font-family="DM Mono,monospace">LIVE MAP</text>
      <circle cx="60" cy="10" r="4" fill="#22c55e"><animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/></circle>
    </svg>
    <div class="map-legend">
      <span class="leg-item"><span class="leg-dot" style="background:#166534"></span>Car</span>
      <span class="leg-item"><span class="leg-dot" style="background:#3b82f6"></span>Bus</span>
      <span class="leg-item"><span class="leg-dot" style="background:#ef4444"></span>Emergency</span>
      <span class="leg-item"><span class="leg-dot" style="background:#f59e0b"></span>Congested</span>
    </div>`;
}

function animateVehicles() {
  if (!S.mapRunning) return;
  S.vehicles.forEach(v => {
    v.x += v.dx * v.speed * 0.01;
    v.y += v.dy * v.speed * 0.01;
    if (v.x < 0) v.x = 100;
    if (v.x > 100) v.x = 0;
    if (v.y < 0) v.y = 100;
    if (v.y > 100) v.y = 0;
  });
  // Update dots without full re-render
  document.querySelectorAll('.map-vehicle').forEach((dot, i) => {
    const v = S.vehicles[i];
    if (!v) return;
    const el = dot.closest('svg');
    if (!el) return;
    const W = el.clientWidth || 600, H = el.clientHeight || 380;
    dot.setAttribute('cx', ((v.x / 100) * W).toFixed(1));
    dot.setAttribute('cy', ((v.y / 100) * H).toFixed(1));
  });
}

/* ── HEATMAP ─────────────────────────────────────── */
function renderHeatmap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cols = 12, rows = 8;
  let html = '<div class="heatmap-grid">';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = RF(0, 1);
      const alpha = (v * 0.85 + 0.05).toFixed(2);
      const hue = v > 0.7 ? '0' : v > 0.4 ? '40' : '120';
      html += `<div class="hmap-cell" style="background:hsla(${hue},80%,50%,${alpha})" title="${(v*100).toFixed(0)}%"></div>`;
    }
  }
  html += '</div>';
  el.innerHTML = html;
}

/* ── CANVAS LINE CHART ───────────────────────────── */
function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height = 200;
  const pad = { t: 20, r: 20, b: 36, l: 40 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#dcfce7';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (cH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }

  // X labels
  ctx.fillStyle = '#86efac';
  ctx.font = '10px DM Mono, monospace';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    const x = pad.l + (i / (labels.length - 1)) * cW;
    ctx.fillText(lbl, x, H - 6);
  });

  // Lines
  datasets.forEach(ds => {
    const max = Math.max(...datasets.flatMap(d => d.data)) * 1.1;
    ctx.strokeStyle = ds.color || '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ds.data.forEach((val, i) => {
      const x = pad.l + (i / (ds.data.length - 1)) * cW;
      const y = pad.t + cH - (val / max) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = ds.color || '#22c55e';
    ctx.beginPath();
    ds.data.forEach((val, i) => {
      const x = pad.l + (i / (ds.data.length - 1)) * cW;
      const y = pad.t + cH - (val / max) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + cW, pad.t + cH);
    ctx.lineTo(pad.l, pad.t + cH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function renderTrafficChart() {
  const labels = ['0','2','4','6','8','10','12','14','16','18','20','22'];
  const flow = [120,80,60,200,480,520,390,440,510,560,400,200];
  const speed = [65,70,72,55,38,35,45,40,36,32,48,60];
  drawLineChart('traffic-chart', labels, [
    { data: flow,  color: '#22c55e' },
    { data: speed, color: '#3b82f6' },
  ]);
}

/* ── ALERTS ──────────────────────────────────────── */
function renderAlerts(containerId = 'alert-list') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const visible = S.alerts.filter(a => !a.dismissed);
  if (!visible.length) {
    el.innerHTML = '<div class="empty-state">No active alerts</div>';
    return;
  }
  el.innerHTML = visible.map(a => `
    <div class="alert-item alert-${a.sev}" id="alert-${a.id}">
      <div class="alert-icon">${icon(a.sev === 'critical' ? 'alert' : a.sev === 'warning' ? 'info' : 'check')}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-sub">${a.msg} &nbsp;•&nbsp; ${a.time}</div>
      </div>
      <button class="btn-xs btn-ghost" onclick="dismissAlert(${a.id})">Dismiss</button>
    </div>
  `).join('');
}

function dismissAlert(id) {
  const a = S.alerts.find(x => x.id === id);
  if (a) a.dismissed = true;
  renderAlerts();
  renderAlerts('alert-list-dash');
}

/* ── ROAD USAGE ──────────────────────────────────── */
function renderRoadUsage() {
  const el = document.getElementById('road-usage');
  if (!el) return;
  const roads = ROADS.map(r => ({ name: r, usage: R(20, 98) }));
  el.innerHTML = roads.map(r => {
    const cls = r.usage > 75 ? 'bar-r' : r.usage > 50 ? 'bar-o' : 'bar-g';
    return `<div class="road-row">
      <span class="road-name">${r.name}</span>
      <div class="progress-wrap"><div class="progress-bar ${cls}" style="width:${r.usage}%"></div></div>
      <span class="road-pct">${r.usage}%</span>
    </div>`;
  }).join('');
}

/* ── TRAFFIC LIGHTS ──────────────────────────────── */
function renderTrafficLights() {
  const el = document.getElementById('tl-grid');
  if (!el) return;
  el.innerHTML = S.trafficLights.map(tl => {
    const phases = ['red','yellow','green'];
    return `
    <div class="tl-card" id="tl-${tl.id}">
      <div class="tl-label">${tl.name}</div>
      <div class="tl-pole">
        ${phases.map(p => `<div class="tl-light tl-${p}${tl.phase===p?' active':''}"></div>`).join('')}
      </div>
      <div class="tl-meta">
        <span class="tag tag-${tl.phase==='green'?'g':tl.phase==='yellow'?'y':'r'}">${tl.phase.toUpperCase()}</span>
        <span class="tl-timer">${tl.timer}s</span>
      </div>
      <div class="tl-mode">${icon('cpu','sm-ic')} ${tl.mode}</div>
    </div>`;
  }).join('');
}

function cycleTrafficLights() {
  const order = ['red','yellow','green'];
  S.trafficLights.forEach(tl => {
    tl.timer--;
    if (tl.timer <= 0) {
      const idx = order.indexOf(tl.phase);
      tl.phase = order[(idx + 1) % 3];
      tl.timer = tl.phase === 'green' ? R(20,45) : tl.phase === 'yellow' ? R(4,8) : R(15,35);
    }
    const card = document.getElementById(`tl-${tl.id}`);
    if (card) {
      card.querySelectorAll('.tl-light').forEach((l, i) => {
        l.classList.toggle('active', order[i] === tl.phase);
      });
      const timerEl = card.querySelector('.tl-timer');
      if (timerEl) timerEl.textContent = tl.timer + 's';
      const tagEl = card.querySelector('.tag');
      if (tagEl) {
        tagEl.className = `tag tag-${tl.phase==='green'?'g':tl.phase==='yellow'?'y':'r'}`;
        tagEl.textContent = tl.phase.toUpperCase();
      }
    }
  });
}

/* ── PARKING ─────────────────────────────────────── */
function renderParking() {
  const el = document.getElementById('parking-grid');
  if (!el) return;
  el.innerHTML = S.parking.map(p => {
    const pct = Math.round((p.free / p.total) * 100);
    const cls = pct < 15 ? 'park-full' : pct < 40 ? 'park-busy' : 'park-ok';
    return `
    <div class="park-card ${cls}">
      <div class="park-header">
        <span class="park-name">${p.name}</span>
        ${p.ev ? `<span class="tag tag-g">${icon('zap','xs-ic')} EV</span>` : ''}
        ${p.underground ? `<span class="tag tag-b">${icon('building','xs-ic')} UG</span>` : ''}
      </div>
      <div class="park-spots">
        <span class="park-free">${p.free}</span>
        <span class="park-total"> / ${p.total} free</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar ${pct<15?'bar-r':pct<40?'bar-o':'bar-g'}" style="width:${100-pct}%"></div>
      </div>
      <div class="park-footer">
        <span class="park-price">${icon('wallet','xs-ic')} ₹${p.price}/hr</span>
        <button class="btn-xs btn-p" onclick="reserveParking(${p.id})">Reserve</button>
      </div>
    </div>`;
  }).join('');
}

/* ── BUSES ───────────────────────────────────────── */
function renderBuses() {
  const el = document.getElementById('bus-list');
  if (!el) return;
  el.innerHTML = S.buses.map(b => `
    <div class="bus-item">
      <div class="bus-route">${icon('bus','sm-ic')} <strong>${b.route}</strong></div>
      <div class="bus-dest">${b.from} → ${b.to}</div>
      <div class="bus-meta">
        <span class="tag ${b.delay ? 'tag-r' : 'tag-g'}">${b.delay ? `${b.delay}m delay` : 'On Time'}</span>
        <span class="tag tag-b">${icon('clock','xs-ic')} ETA ${b.eta}m</span>
        <span class="tag tag-p">${icon('users','xs-ic')} ${b.occupancy}%</span>
        <span>${b.seats} seats</span>
      </div>
    </div>
  `).join('');
}

/* ── ENVIRONMENT ─────────────────────────────────── */
function renderEnv() {
  const el = document.getElementById('env-gauges');
  if (!el) return;
  el.innerHTML = S.env.map(e => {
    const pct = Math.min(100, Math.round((e.val / e.max) * 100));
    const bad = pct > e.warn;
    return `
    <div class="env-card">
      <div class="env-icon ${bad ? 'env-bad' : 'env-ok'}">${icon(e.icon)}</div>
      <div class="env-label">${e.label}</div>
      <div class="env-val">${e.val}<span class="env-unit">${e.unit}</span></div>
      <div class="progress-wrap env-bar">
        <div class="progress-bar ${bad?'bar-r':'bar-g'}" style="width:${pct}%"></div>
      </div>
      <div class="env-status">${bad ? `<span class="tag tag-r">High</span>` : `<span class="tag tag-g">Normal</span>`}</div>
    </div>`;
  }).join('');
}

/* ── CARPOOL ─────────────────────────────────────── */
function renderCarpool() {
  const el = document.getElementById('carpool-list');
  if (!el) return;
  const rides = Array.from({length: 5}, (_, i) => ({
    id: i + 1,
    name: ['Amit K.','Priya S.','Ravi M.','Sunita P.','Deepak R.'][i],
    from: C(AREAS), to: C(AREAS),
    time: `${R(7,9)}:${R(0,5)}0 AM`,
    seats: R(1, 3),
    price: R(30, 120),
  }));
  el.innerHTML = rides.map(r => `
    <div class="carpool-item">
      <div class="carpool-avatar">${r.name[0]}</div>
      <div class="carpool-body">
        <div class="carpool-name">${r.name}</div>
        <div class="carpool-route">${icon('route','xs-ic')} ${r.from} → ${r.to}</div>
        <div class="carpool-meta">
          <span class="tag tag-b">${icon('clock','xs-ic')} ${r.time}</span>
          <span class="tag tag-g">${icon('users','xs-ic')} ${r.seats} seat${r.seats>1?'s':''}</span>
          <span class="tag tag-p">${icon('wallet','xs-ic')} ₹${r.price}</span>
        </div>
      </div>
      <button class="btn-xs btn-p" onclick="joinCarpool(${r.id})">Join</button>
    </div>
  `).join('');
}

/* ── RIDE SHARE ──────────────────────────────────── */
function renderShareOptions() {
  const el = document.getElementById('share-options');
  if (!el) return;
  const opts = [
    { name: 'UrbanAuto',  type: 'Auto',   eta: R(3,7),  price: R(40,80),   ic: 'car' },
    { name: 'UrbanCab',   type: 'Cab',    eta: R(5,12), price: R(80,150),  ic: 'car2' },
    { name: 'UrbanBike',  type: 'Bike',   eta: R(2,5),  price: R(20,50),   ic: 'bike' },
    { name: 'UrbanPool',  type: 'Pool',   eta: R(8,15), price: R(30,60),   ic: 'users' },
    { name: 'UrbanElec',  type: 'EV Cab', eta: R(6,14), price: R(90,160),  ic: 'zap' },
  ];
  el.innerHTML = opts.map(o => `
    <div class="share-card">
      <div class="share-icon">${icon(o.ic)}</div>
      <div class="share-name">${o.name}</div>
      <div class="share-type">${o.type}</div>
      <div class="share-eta">${icon('clock','xs-ic')} ${o.eta} min</div>
      <div class="share-price">₹${o.price}</div>
      <button class="btn-sm btn-p" onclick="bookRide('${o.name}')">Book</button>
    </div>
  `).join('');
}

/* ── ANALYTICS ───────────────────────────────────── */
function renderAnalytics() {
  const el = document.getElementById('analytics-metrics');
  if (!el) return;
  const metrics = [
    { label: 'Daily Trips',      val: '1,24,320', trend: '+5.2%',  ic: 'route',        col: 'g' },
    { label: 'Avg Commute Time', val: '28 min',   trend: '-2 min', ic: 'clock',        col: 'b' },
    { label: 'Fuel Saved (L)',   val: '8,540',    trend: '+12%',   ic: 'fuel',         col: 'o' },
    { label: 'Accidents Today',  val: '3',         trend: '-2',    ic: 'alert',        col: 'r' },
    { label: 'Public Transit %', val: '42%',       trend: '+3%',   ic: 'bus',          col: 'p' },
    { label: 'Emissions Saved',  val: '2.1 t',     trend: '+0.4t', ic: 'leaf',         col: 'g' },
  ];
  el.innerHTML = metrics.map(m => `
    <div class="analytics-card stat-${m.col}">
      <div class="stat-icon">${icon(m.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${m.val}</div>
        <div class="stat-label">${m.label}</div>
      </div>
      <div class="stat-trend">${m.trend}</div>
    </div>
  `).join('');

  setTimeout(() => {
    drawLineChart('analytics-chart', ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], [
      { data: [112000,118000,124000,121000,129000,105000,98000], color: '#22c55e' },
      { data: [82000,88000,95000,91000,99000,75000,68000],       color: '#3b82f6' },
    ]);
  }, 50);
}

/* ── ADVANCED ────────────────────────────────────── */
function renderAdvanced() {
  renderAVFleet();
  renderDrones();
  renderTolls();
  renderLogistics();
  renderTwinCanvas();
}

function renderAVFleet() {
  const el = document.getElementById('av-fleet');
  if (!el) return;
  const vehicles = Array.from({length: 6}, (_, i) => ({
    id: `AV-${100+i}`, status: C(['Active','Charging','Standby']),
    battery: R(20,98), trips: R(4,28), zone: C(AREAS),
  }));
  el.innerHTML = vehicles.map(v => `
    <div class="av-card">
      <div class="av-id">${icon('robot','sm-ic')} ${v.id}</div>
      <div class="av-status"><span class="tag ${v.status==='Active'?'tag-g':v.status==='Charging'?'tag-b':'tag-o'}">${v.status}</span></div>
      <div class="av-battery">${icon('zap','xs-ic')} ${v.battery}%
        <div class="progress-wrap sm"><div class="progress-bar ${v.battery<30?'bar-r':'bar-g'}" style="width:${v.battery}%"></div></div>
      </div>
      <div class="av-meta">${v.trips} trips today &nbsp;•&nbsp; ${v.zone}</div>
    </div>
  `).join('');
}

function renderDrones() {
  const el = document.getElementById('drone-list');
  if (!el) return;
  const drones = Array.from({length: 5}, (_, i) => ({
    id: `DR-${200+i}`, mission: C(['Delivery','Surveillance','Emergency','Inspection']),
    alt: R(50,200), battery: R(30,95), eta: R(2,20),
  }));
  el.innerHTML = drones.map(d => `
    <div class="drone-item">
      ${icon('drone','sm-ic')}
      <div class="drone-body">
        <span class="drone-id">${d.id}</span>
        <span class="tag tag-b">${d.mission}</span>
        <span class="tag tag-g">${icon('activity','xs-ic')} ${d.alt}m alt</span>
        <span class="tag tag-p">${icon('zap','xs-ic')} ${d.battery}%</span>
        <span class="tag tag-o">${icon('clock','xs-ic')} ${d.eta}m ETA</span>
      </div>
    </div>
  `).join('');
}

function renderTolls() {
  const el = document.getElementById('toll-list');
  if (!el) return;
  const tolls = ROADS.slice(0, 6).map((r, i) => ({
    name: r, rate: R(20,80), vehicles: R(200,800), revenue: R(5000,40000),
  }));
  el.innerHTML = tolls.map(t => `
    <div class="toll-item">
      <div class="toll-name">${icon('road','xs-ic')} ${t.name}</div>
      <div class="toll-meta">
        <span>₹${t.rate}/vehicle</span>
        <span>${icon('car','xs-ic')} ${t.vehicles.toLocaleString()} today</span>
        <span class="tag tag-g">₹${t.revenue.toLocaleString()} revenue</span>
      </div>
    </div>
  `).join('');
}

function renderLogistics() {
  const el = document.getElementById('logistics-list');
  if (!el) return;
  const trucks = Array.from({length: 5}, (_, i) => ({
    id: `TRK-${300+i}`, cargo: C(['Electronics','Food','Medicine','Fuel','Packages']),
    status: C(['En Route','Loading','Unloading','Waiting']),
    eta: R(10, 120), weight: R(2, 22),
  }));
  el.innerHTML = trucks.map(t => `
    <div class="logistics-item">
      ${icon('package','sm-ic')}
      <div class="logistics-body">
        <span class="logistics-id">${t.id}</span>
        <span class="tag tag-b">${t.cargo}</span>
        <span class="tag ${t.status==='En Route'?'tag-g':t.status==='Waiting'?'tag-r':'tag-o'}">${t.status}</span>
        <span>${t.weight}t &nbsp;•&nbsp; ETA ${t.eta}m</span>
      </div>
    </div>
  `).join('');
}

function renderTwinCanvas() {
  const canvas = document.getElementById('twin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = canvas.height = 260;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Roads
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();

  // Vehicles
  S.vehicles.slice(0, 20).forEach(v => {
    const cx = (v.x / 100) * W, cy = (v.y / 100) * H;
    ctx.fillStyle = v.type === 'bus' ? '#3b82f6' : '#166534';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 12px DM Mono, monospace';
  ctx.fillText('DIGITAL TWIN — LIVE', 10, 20);
}

/* ── CITIZEN REPORT MAP ──────────────────────────── */
function renderReportMap() {
  const el = document.getElementById('report-map');
  if (!el) return;
  el.innerHTML = `
    <div class="report-map-inner" onclick="addReportPin(event)" id="report-map-svg">
      <svg width="100%" height="100%" viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="260" fill="#f0fdf4"/>
        <line x1="0" y1="130" x2="400" y2="130" stroke="#22c55e" stroke-width="8"/>
        <line x1="200" y1="0" x2="200" y2="260" stroke="#22c55e" stroke-width="8"/>
        <text x="10" y="20" font-size="10" fill="#16a34a" font-family="DM Mono">Tap to pin report</text>
      </svg>
      <div id="report-pins"></div>
    </div>`;
}

/* ── SETTINGS ────────────────────────────────────── */
function renderSettings() {
  const el = document.getElementById('settings-body');
  if (!el) return;
  const groups = [
    {
      title: 'Display',
      items: [
        { label: 'Dark Mode',          id: 'set-dark',    val: false },
        { label: 'Live Map Animation', id: 'set-anim',    val: true  },
        { label: 'Show Vehicle Labels',id: 'set-vlabel',  val: false },
        { label: 'High Contrast Mode', id: 'set-hc',      val: false },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { label: 'Critical Alerts',    id: 'set-alert-c', val: true  },
        { label: 'Traffic Updates',    id: 'set-alert-t', val: true  },
        { label: 'Bus Delays',         id: 'set-alert-b', val: true  },
        { label: 'Parking Alerts',     id: 'set-alert-p', val: false },
      ]
    },
    {
      title: 'Data',
      items: [
        { label: 'Auto-Refresh (1s)',   id: 'set-refresh', val: true  },
        { label: 'AI Predictions',      id: 'set-ai',      val: true  },
        { label: 'Share Anonymous Data',id: 'set-share',   val: false },
      ]
    }
  ];
  el.innerHTML = groups.map(g => `
    <div class="settings-group card">
      <div class="card-title">${g.title}</div>
      ${g.items.map(item => `
        <div class="settings-row">
          <span>${item.label}</span>
          <label class="toggle">
            <input type="checkbox" id="${item.id}" ${item.val ? 'checked' : ''} onchange="handleSetting('${item.id}', this.checked)">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
      `).join('')}
    </div>
  `).join('');
}

/* ── ROUTE RESULT ────────────────────────────────── */
function renderRoute(from, to, mode) {
  const el = document.getElementById('route-result');
  if (!el) return;
  const dist = RF(2.5, 18).toFixed(1);
  const mins = R(8, 45);
  const steps = [
    `Head ${C(['north','south','east','west'])} on ${C(ROADS)}`,
    `Turn ${C(['left','right'])} onto ${C(ROADS)}`,
    `Continue straight for ${RF(0.5,3).toFixed(1)} km`,
    `Turn ${C(['left','right'])} onto ${C(ROADS)}`,
    `Arrive at destination`,
  ];
  el.innerHTML = `
    <div class="route-summary">
      ${icon('route','sm-ic')} <strong>${from}</strong> → <strong>${to}</strong>
      &nbsp;•&nbsp; ${dist} km &nbsp;•&nbsp; ${mins} min &nbsp;•&nbsp;
      <span class="tag tag-g">${mode}</span>
    </div>
    <ol class="route-steps">
      ${steps.map(s => `<li>${s}</li>`).join('')}
    </ol>
  `;
}

function renderEVRoute() {
  const el = document.getElementById('ev-route-result');
  if (!el) return;
  const stations = Array.from({length: 3}, (_, i) => ({
    name: `EV Station ${C(AREAS)}`, slots: R(1,6), dist: RF(0.5,5).toFixed(1)
  }));
  el.innerHTML = `
    <div class="card" style="margin-top:1rem">
      <div class="card-title">${icon('zap','sm-ic')} Charging Stops Along Route</div>
      ${stations.map(s => `
        <div class="ev-station-item">
          ${icon('zap','sm-ic')} <strong>${s.name}</strong>
          <span class="tag tag-g">${s.slots} slots</span>
          <span class="tag tag-b">${s.dist} km away</span>
          <button class="btn-xs btn-p" onclick="showToast('Slot reserved at ${s.name}','success')">Reserve</button>
        </div>
      `).join('')}
    </div>`;
}

/* ── EMERGENCY CONTACTS ──────────────────────────── */
function renderEmergencyContacts() {
  const el = document.getElementById('emergency-contacts');
  if (!el) return;
  const contacts = [
    { name: 'Police',        num: '100',  ic: 'alert',     col: 'r' },
    { name: 'Ambulance',     num: '108',  ic: 'ambulance', col: 'r' },
    { name: 'Fire Brigade',  num: '101',  ic: 'flame',     col: 'o' },
    { name: 'Traffic Control', num: '103', ic: 'traffic',  col: 'b' },
    { name: 'Road Helpline', num: '1800-XXX', ic: 'road',  col: 'g' },
  ];
  el.innerHTML = contacts.map(c => `
    <div class="emergency-contact stat-${c.col}">
      <div class="stat-icon">${icon(c.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${c.num}</div>
        <div class="stat-label">${c.name}</div>
      </div>
      <a href="tel:${c.num}" class="btn-sm btn-d">${icon('phone','xs-ic')} Call</a>
    </div>
  `).join('');
}
