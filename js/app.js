/* UrbanIQ — app.js: main application logic */

/* ── SECTION NAV ─────────────────────────────────── */
function switchSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  S.activeSection = id;
  onSectionActivate(id);
}

function onSectionActivate(id) {
  switch (id) {
    case 'dashboard':
      renderStats();
      setTimeout(() => renderMap('main-map'), 50);
      renderAlerts('alert-list-dash');
      break;
    case 'traffic':
      renderRoadUsage();
      setTimeout(renderTrafficChart, 50);
      renderHeatmap('traffic-heatmap');
      renderTrafficLights();
      break;
    case 'navigation':
      // ready on demand
      break;
    case 'transport':
      renderBuses();
      renderCarpool();
      renderShareOptions();
      break;
    case 'parking':
      renderParking();
      break;
    case 'emergency':
      renderAlerts('alert-list');
      renderEmergencyContacts();
      break;
    case 'environment':
      renderEnv();
      renderHeatmap('env-heatmap');
      break;
    case 'citizen':
      renderReportMap();
      break;
    case 'analytics':
      renderAnalytics();
      break;
    case 'advanced':
      renderAdvanced();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

/* ── SUB-TABS ────────────────────────────────────── */
function showStab(btn, section, tab) {
  const sec = document.getElementById(section);
  if (!sec) return;
  sec.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  sec.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById(tab);
  if (panel) panel.classList.add('active');
}

/* ── ROUTE PLANNING ──────────────────────────────── */
function planRoute() {
  const from = document.getElementById('route-from')?.value.trim() || 'Current Location';
  const to   = document.getElementById('route-to')?.value.trim();
  const mode = document.getElementById('route-mode')?.value || 'Fastest';
  if (!to) { showToast('Please enter a destination', 'warning'); return; }
  renderRoute(from, to, mode);
  showToast('Route calculated!', 'success');
}

function planEVRoute() {
  const from = document.getElementById('ev-from')?.value.trim() || 'Current Location';
  const to   = document.getElementById('ev-to')?.value.trim();
  if (!to) { showToast('Please enter an EV destination', 'warning'); return; }
  renderEVRoute();
  showToast('EV route with charging stops found!', 'success');
}

/* ── PARKING ─────────────────────────────────────── */
function reserveParking(id) {
  const p = S.parking.find(x => x.id === id);
  if (!p) return;
  if (p.free === 0) { showToast('No spots available at ' + p.name, 'error'); return; }
  showModal(
    `Reserve at ${p.name}`,
    `<div class="modal-reserve">
      <p>Available: <strong>${p.free}</strong> spots &nbsp;•&nbsp; ₹${p.price}/hr</p>
      <div class="form-row">
        <label>Duration (hours)</label>
        <input id="park-dur" type="number" min="1" max="24" value="2" class="form-input">
      </div>
      <div class="form-row">
        <label>Vehicle Number</label>
        <input id="park-veh" type="text" placeholder="MH-01-AB-1234" class="form-input">
      </div>
      <button class="btn-p btn-full" onclick="confirmParking(${id})">Confirm Reservation</button>
    </div>`
  );
}

function confirmParking(id) {
  const p = S.parking.find(x => x.id === id);
  const dur = parseInt(document.getElementById('park-dur')?.value || 2);
  if (p) { p.free = Math.max(0, p.free - 1); }
  closeModal();
  showToast(`Parking reserved at ${p?.name || 'Lot'} for ${dur}h`, 'success');
  if (S.activeSection === 'parking') renderParking();
}

/* ── EMERGENCY SOS ───────────────────────────────── */
function triggerSOS() {
  const btn = document.getElementById('sos-btn');
  if (!btn) return;

  if (!S.sosArmed) {
    S.sosArmed = true;
    btn.textContent = 'HOLD TO CONFIRM';
    btn.style.background = '#f97316';
    showToast('Hold button again to send SOS', 'warning');
    setTimeout(() => {
      S.sosArmed = false;
      if (btn) { btn.innerHTML = `${icon('emergency','md-ic')} SOS`; btn.style.background = ''; }
    }, 4000);
  } else {
    S.sosArmed = false;
    btn.innerHTML = `${icon('check','md-ic')} SOS SENT`;
    btn.style.background = '#16a34a';
    showToast('🚨 SOS dispatched! Emergency services notified.', 'error');
    S.alerts.unshift({
      id: Date.now(), title: 'SOS Activated', sev: 'critical',
      msg: 'User triggered SOS. Emergency services en route.', time: 'just now', dismissed: false,
    });
    setTimeout(() => {
      if (btn) { btn.innerHTML = `${icon('emergency','md-ic')} SOS`; btn.style.background = ''; }
    }, 5000);
  }
}

/* ── CITIZEN REPORTS ─────────────────────────────── */
function addReportPin(e) {
  const container = document.getElementById('report-map-svg');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pin = document.createElement('div');
  pin.className = 'report-pin';
  pin.style.cssText = `position:absolute;left:${x-10}px;top:${y-24}px;width:20px;height:28px;pointer-events:none;`;
  pin.innerHTML = `<svg viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#ef4444"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`;
  const pins = document.getElementById('report-pins');
  if (pins) pins.appendChild(pin);
  S.reportPins.push({ x, y, time: Date.now() });
  showToast('Report pin placed. Fill in details below.', 'info');
}

function submitReport() {
  const type  = document.getElementById('report-type')?.value;
  const desc  = document.getElementById('report-desc')?.value.trim();
  if (!desc) { showToast('Please describe the issue', 'warning'); return; }
  if (!S.reportPins.length) { showToast('Pin the location on the map first', 'warning'); return; }
  S.citizenReports.push({ type, desc, time: Date.now() });
  document.getElementById('report-desc').value = '';
  showToast('Report submitted! Thank you.', 'success');
}

/* ── CARPOOL / RIDESHARE ─────────────────────────── */
function joinCarpool(id) {
  showModal('Join Carpool', `
    <p>You are joining this carpool ride.</p>
    <p>Confirm your pickup point and contact the driver.</p>
    <button class="btn-p btn-full" onclick="closeModal();showToast('Carpool joined!','success')">Confirm</button>
  `);
}

function bookRide(name) {
  showModal(`Book ${name}`, `
    <p>Your ride with <strong>${name}</strong> is being arranged.</p>
    <div class="form-row">
      <label>Pickup</label>
      <input type="text" class="form-input" placeholder="Your location">
    </div>
    <div class="form-row">
      <label>Drop</label>
      <input type="text" class="form-input" placeholder="Destination">
    </div>
    <button class="btn-p btn-full" onclick="closeModal();showToast('${name} booked! Driver en route.','success')">Confirm Booking</button>
  `);
}

/* ── DIGITAL TWIN ────────────────────────────────── */
let twinInterval = null;
function twinSimulate(mode) {
  S.twinMode = mode;
  document.querySelectorAll('.twin-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-twin="${mode}"]`);
  if (btn) btn.classList.add('active');
  showToast(`Digital Twin: ${mode} simulation active`, 'info');
  if (twinInterval) clearInterval(twinInterval);
  twinInterval = setInterval(() => {
    S.vehicles.forEach(v => {
      v.x = (v.x + v.dx * (mode === 'Rush Hour' ? 1.5 : mode === 'Emergency' ? 0.3 : 1)) % 100;
      v.y = (v.y + v.dy * (mode === 'Rush Hour' ? 1.5 : mode === 'Emergency' ? 0.3 : 1)) % 100;
      if (v.x < 0) v.x += 100;
      if (v.y < 0) v.y += 100;
    });
    renderTwinCanvas();
  }, 500);
}

/* ── TRAFFIC LIGHT BULK CONTROL ──────────────────── */
function setAllLights(mode) {
  S.trafficLights.forEach(tl => { tl.mode = mode; });
  showToast(`All lights set to ${mode} mode`, 'success');
}

/* ── VOICE NAVIGATION ────────────────────────────── */
function toggleVoice() {
  S.voiceActive = !S.voiceActive;
  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.classList.toggle('btn-p', S.voiceActive);
    btn.classList.toggle('btn-ghost', !S.voiceActive);
    btn.querySelector('.voice-label') && (btn.querySelector('.voice-label').textContent = S.voiceActive ? 'Voice ON' : 'Voice');
  }
  showToast(S.voiceActive ? 'Voice navigation enabled' : 'Voice navigation disabled', S.voiceActive ? 'success' : 'info');
}

/* ── DARK MODE ───────────────────────────────────── */
function toggleDark() {
  document.body.classList.toggle('dark');
  showToast(document.body.classList.contains('dark') ? 'Dark mode on' : 'Light mode on', 'info');
}

/* ── SETTINGS ────────────────────────────────────── */
function handleSetting(id, val) {
  switch (id) {
    case 'set-dark':    document.body.classList.toggle('dark', val); break;
    case 'set-refresh': val ? startRealtime() : stopRealtime(); break;
    case 'set-anim':    S.mapRunning = val; break;
  }
  showToast(`Setting updated`, 'success');
}

/* ── MODAL ───────────────────────────────────────── */
function showModal(title, body) {
  const overlay = document.getElementById('modal-overlay');
  const mtitle  = document.getElementById('modal-title');
  const mbody   = document.getElementById('modal-body');
  if (!overlay) return;
  if (mtitle) mtitle.textContent = title;
  if (mbody)  mbody.innerHTML = body;
  overlay.classList.add('active');
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

/* ── TOAST ───────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon(type==='success'?'check':type==='error'?'x':type==='warning'?'alert':'info','xs-ic')} <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── REALTIME UPDATE ─────────────────────────────── */
let realtimeInterval = null;

function realtimeUpdate() {
  // Update vehicle positions
  S.vehicles.forEach(v => {
    v.x = (v.x + v.dx * v.speed * 0.04 + 100) % 100;
    v.y = (v.y + v.dy * v.speed * 0.04 + 100) % 100;
    if (Math.random() < 0.02) v.speed = R(20, 80);
  });

  // Update env values
  S.env.forEach(e => {
    e.val = Math.max(e.min || 0, Math.min(e.max, e.val + RF(-1, 1)));
    e.val = Math.round(e.val * 10) / 10;
  });

  // Update bus ETAs
  S.buses.forEach(b => {
    b.eta = Math.max(1, b.eta - 1);
    if (b.eta <= 1) b.eta = R(3, 20);
  });

  // Update parking
  S.parking.forEach(p => {
    const delta = R(-1, 1);
    p.free = Math.max(0, Math.min(p.total, p.free + delta));
  });

  // Cycle traffic lights
  cycleTrafficLights();

  // Animate map if visible
  if (S.mapRunning && S.activeSection === 'dashboard') {
    animateVehicles();
  }

  // Live badge
  const badge = document.getElementById('live-badge');
  if (badge) {
    badge.classList.toggle('pulse', Math.floor(Date.now() / 500) % 2 === 0);
  }

  // Update stat cards if on dashboard
  if (S.activeSection === 'dashboard') {
    renderStats();
  }
  if (S.activeSection === 'environment') {
    renderEnv();
  }
  if (S.activeSection === 'transport') {
    renderBuses();
  }
}

function startRealtime() {
  if (realtimeInterval) return;
  realtimeInterval = setInterval(realtimeUpdate, 1000);
}

function stopRealtime() {
  if (realtimeInterval) { clearInterval(realtimeInterval); realtimeInterval = null; }
}

/* ── SEARCH ──────────────────────────────────────── */
function handleGlobalSearch(e) {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;
  const map = {
    'traffic': 'traffic', 'buses': 'transport', 'bus': 'transport',
    'parking': 'parking', 'alerts': 'emergency', 'air': 'environment',
    'analytics': 'analytics', 'drone': 'advanced', 'settings': 'settings',
  };
  for (const [k, v] of Object.entries(map)) {
    if (q.includes(k)) {
      const btn = document.querySelector(`.nav-tab:nth-child(${['dashboard','traffic','navigation','transport','parking','emergency','environment','citizen','analytics','advanced','settings'].indexOf(v)+1})`);
      switchSection(v, btn);
      showToast(`Navigated to ${v}`, 'info');
      return;
    }
  }
  showToast(`Searching for "${q}"…`, 'info');
}

/* ── INIT ────────────────────────────────────────── */
function init() {
  initAllData();
  renderNav();
  renderTicker();

  // Initial section
  S.activeSection = 'dashboard';
  onSectionActivate('dashboard');

  // Realtime
  startRealtime();

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Global search
  const searchInput = document.getElementById('global-search');
  if (searchInput) searchInput.addEventListener('keydown', handleGlobalSearch);

  console.log('%cUrbanIQ initialized ✓', 'color:#22c55e;font-weight:bold;font-size:14px');
}

window.addEventListener('DOMContentLoaded', init);
