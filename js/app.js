/* UrbanIQ — app.js: main application logic */

/* ── SECTION NAV ──────────────────────────────── */
function switchSection(id, btn){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  const sec=document.getElementById('sec-'+id);
  if(sec) sec.classList.add('active');
  if(btn) btn.classList.add('active');
  S.activeSection=id;
  onSectionActivate(id);
}

function onSectionActivate(id){
  switch(id){
    case 'dashboard':
      renderStats();
      setTimeout(()=>renderMap('main-map'),60);
      renderAlerts('alert-list-dash');
      renderRoadUsage();
      break;
    case 'traffic':
      renderRoadUsage();
      if(typeof renderTrafficRoadUsage==='function') renderTrafficRoadUsage();
      setTimeout(renderTrafficChart,60);
      renderHeatmap('traffic-heatmap');
      renderTrafficLights();
      setTimeout(()=>renderMap('traffic-map'),80);
      break;
    case 'navigation':
      setTimeout(()=>renderMap('nav-map'),60);
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

/* ── SUB-TABS ─────────────────────────────────── */
function showStab(btn, section, tab){
  const sec=document.getElementById(section); if(!sec) return;
  sec.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  sec.querySelectorAll('.stab-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  const panel=document.getElementById(tab);
  if(panel) panel.classList.add('active');
  // trigger renders on tab switch
  if(tab==='traf-lights') renderTrafficLights();
  if(tab==='traf-heatmap') renderHeatmap('traffic-heatmap');
  if(tab==='env-heat-panel') renderHeatmap('env-heatmap');
  if(tab==='adv-av') renderAVFleet();
  if(tab==='adv-drones') renderDrones();
  if(tab==='adv-tolls') renderTolls();
  if(tab==='adv-logistics') renderLogistics();
  if(tab==='adv-twin'){renderTwinCanvas();}
}

/* ── ROUTE PLANNING ───────────────────────────── */
function planRoute(){
  const from=document.getElementById('route-from')?.value.trim()||'Current Location';
  const to=document.getElementById('route-to')?.value.trim();
  const mode=document.getElementById('route-mode')?.value||'Fastest';
  if(!to){showToast('Please enter a destination','warning');return;}
  renderRoute(from,to,mode);
  showToast('Route calculated!','success');
}

function planEVRoute(){
  const from=document.getElementById('ev-from')?.value.trim()||'Current Location';
  const to=document.getElementById('ev-to')?.value.trim();
  if(!to){showToast('Please enter a destination','warning');return;}
  renderEVRoute();
  showToast('EV route with charging stops found!','success');
}

/* ── PARKING ──────────────────────────────────── */
function reserveParking(id){
  const p=S.parking.find(x=>x.id===id);
  if(!p) return;
  if(p.free===0){showToast('No spots available at '+p.name,'error');return;}
  showModal(`Reserve — ${p.name}`,`
    <p style="margin-bottom:12px">Available: <strong>${p.free}</strong> spots &nbsp;•&nbsp; ₹${p.price}/hr</p>
    <div class="form-row"><label>Duration (hours)</label><input id="park-dur" type="number" min="1" max="24" value="2" class="form-input"></div>
    <div class="form-row"><label>Vehicle Number</label><input id="park-veh" type="text" placeholder="MH-01-AB-1234" class="form-input"></div>
    <button class="btn-p btn-full" onclick="confirmParking(${id})" style="margin-top:8px">Confirm Reservation</button>`);
}

function confirmParking(id){
  const p=S.parking.find(x=>x.id===id);
  const dur=parseInt(document.getElementById('park-dur')?.value||2);
  if(p){p.free=Math.max(0,p.free-1);}
  closeModal();
  showToast(`Parking reserved at ${p?.name||'Lot'} for ${dur}h — ₹${p?Math.round(p.price*dur):0}`,'success');
  if(S.activeSection==='parking') renderParking();
  if(S.activeSection==='dashboard') renderStats();
}

/* ── TRACK BUS ────────────────────────────────── */
function trackBus(id){
  const b=S.buses.find(x=>x.id===id);
  if(!b) return;
  showModal(`Tracking: ${b.route}`,`
    <div style="margin-bottom:12px">
      <strong>${b.from}</strong> → <strong>${b.to}</strong>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <span class="tag ${b.delay?'tag-r':'tag-g'}">${b.delay?`+${b.delay}m delay`:'On Time'}</span>
      <span class="tag tag-b">ETA: ${b.eta} min</span>
      <span class="tag tag-p">Occupancy: ${b.occupancy}%</span>
      <span class="tag tag-o">${b.seats} seats free</span>
    </div>
    <div style="background:var(--g1);border-radius:8px;padding:12px;font-size:.8rem;color:var(--text-muted)">
      ${icon('map','sm-ic')} Bus is currently near <strong>${C(AREAS)}</strong>. Estimated arrival in ${b.eta} minutes.
    </div>
    <button class="btn-p btn-full" style="margin-top:12px" onclick="closeModal();showToast('You will be notified when bus arrives','success')">Set Arrival Alert</button>`);
}

/* ── EMERGENCY SOS ────────────────────────────── */
function triggerSOS(){
  const btn=document.getElementById('sos-btn');
  if(!btn) return;
  if(!S.sosArmed){
    S.sosArmed=true;
    btn.textContent='HOLD TO CONFIRM';
    btn.style.background='#f97316';
    showToast('Tap again within 3s to send SOS','warning');
    setTimeout(()=>{
      if(S.sosArmed){S.sosArmed=false;btn.innerHTML='SOS';btn.style.background='';}
    },3500);
  } else {
    S.sosArmed=false;
    btn.innerHTML=`${icon('check','md-ic')} SENT`;
    btn.style.background='#16a34a';
    showToast('🚨 SOS sent! Emergency services notified.','error');
    const newAlert={id:Date.now(),sev:'critical',ic:'emergency',
      title:'SOS Activated',msg:'User triggered SOS. Emergency services en route.',
      time:'just now',dismissed:false};
    S.alerts.unshift(newAlert);
    if(S.activeSection==='emergency') renderAlerts('alert-list');
    if(S.activeSection==='dashboard') renderAlerts('alert-list-dash');
    renderStats();
    setTimeout(()=>{if(btn){btn.innerHTML='SOS';btn.style.background='';}},5000);
  }
}

/* ── CITIZEN REPORT ───────────────────────────── */
function addReportPin(e){
  const inner=document.getElementById('report-map-inner'); if(!inner) return;
  const rect=inner.getBoundingClientRect();
  const x=e.clientX-rect.left, y=e.clientY-rect.top;
  const pins=document.getElementById('report-pins'); if(!pins) return;
  const pin=document.createElement('div');
  pin.style.cssText=`position:absolute;left:${x-10}px;top:${y-26}px;pointer-events:none;z-index:5;`;
  pin.innerHTML=`<svg width="20" height="28" viewBox="0 0 20 28"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18S20 17.5 20 10C20 4.5 15.5 0 10 0z" fill="#ef4444"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`;
  pins.appendChild(pin);
  S.reportPins.push({x,y,time:Date.now()});
  showToast('Report pin placed — fill details below','info');
}

function submitReport(){
  const type=document.getElementById('report-type')?.value;
  const desc=document.getElementById('report-desc')?.value.trim();
  if(!desc){showToast('Please describe the issue','warning');return;}
  if(!S.reportPins.length){showToast('Pin the location on the map first','warning');return;}
  S.citizenReports.push({type,desc,time:Date.now()});
  document.getElementById('report-desc').value='';
  S.reportPins=[];
  document.querySelectorAll('#report-pins div').forEach(p=>p.remove());
  const newAlert={id:Date.now(),sev:'info',ic:'users',
    title:`Citizen Report: ${type}`,msg:desc.slice(0,80)+(desc.length>80?'…':''),
    time:'just now',dismissed:false};
  S.alerts.unshift(newAlert);
  showToast('Report submitted! Thank you.','success');
}

/* ── CARPOOL / RIDESHARE ──────────────────────── */
function joinCarpool(id){
  const r=S.carpools.find(x=>x.id===id);
  if(!r) return;
  showModal(`Join Carpool — ${r.name}`,`
    <div style="margin-bottom:12px">
      ${icon('route','sm-ic')} <strong>${r.from}</strong> → <strong>${r.to}</strong>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <span class="tag tag-b">${icon('clock','xs-ic')} ${r.time}</span>
      <span class="tag tag-g">${r.seats} seat${r.seats>1?'s':''} available</span>
      <span class="tag tag-p">₹${r.price}</span>
      <span class="tag tag-y">★ ${r.rating}</span>
    </div>
    <div class="form-row"><label>Your Pickup Point</label><input type="text" class="form-input" placeholder="Your location"></div>
    <button class="btn-p btn-full" onclick="closeModal();showToast('Carpool joined! Driver will contact you.','success')" style="margin-top:8px">Confirm &amp; Join</button>`);
}

function bookRide(name){
  showModal(`Book ${name}`,`
    <div class="form-row"><label>Pickup</label><input type="text" id="ride-from" class="form-input" placeholder="Your location"></div>
    <div class="form-row"><label>Destination</label><input type="text" id="ride-to" class="form-input" placeholder="Where to?"></div>
    <div class="form-row"><label>Schedule</label>
      <select class="form-input"><option>Now</option><option>In 15 minutes</option><option>In 30 minutes</option><option>Schedule for later</option></select>
    </div>
    <div style="background:var(--g1);border-radius:8px;padding:10px;font-size:.8rem;margin-bottom:12px">
      Estimated fare: <strong>₹${R(40,200)}</strong> &nbsp;•&nbsp; Driver arrives in ~${R(3,12)} min
    </div>
    <button class="btn-p btn-full" onclick="closeModal();showToast('${name} booked! Driver en route.','success')">Confirm Booking</button>`);
}

/* ── DIGITAL TWIN ─────────────────────────────── */
let twinInterval=null;
function twinSimulate(mode){
  S.twinMode=mode;
  document.querySelectorAll('.twin-btn').forEach(b=>b.classList.remove('active'));
  const btn=document.querySelector(`[data-twin="${mode}"]`);
  if(btn) btn.classList.add('active');
  showToast(`Digital Twin: ${mode} simulation active`,'info');
  if(twinInterval) clearInterval(twinInterval);
  const speedMult=mode==='Rush Hour'?2:mode==='Emergency'?0.3:mode==='Night'?0.5:1;
  twinInterval=setInterval(()=>{
    S.vehicles.forEach(v=>{
      v.x=(v.x+v.dx*speedMult*v.speed*0.02+100)%100;
      v.y=(v.y+v.dy*speedMult*v.speed*0.02+100)%100;
    });
    renderTwinCanvas();
  },400);
}

/* ── TRAFFIC LIGHT CONTROL ────────────────────── */
function setAllLights(mode){
  S.trafficLights.forEach(tl=>{tl.mode=mode;});
  showToast(`All intersections set to ${mode} mode`,'success');
  if(S.activeSection==='traffic') renderTrafficLights();
}

/* ── VOICE NAV ────────────────────────────────── */
function toggleVoice(){
  S.voiceActive=!S.voiceActive;
  const btns=document.querySelectorAll('.voice-toggle-btn');
  btns.forEach(btn=>{
    btn.classList.toggle('btn-p',S.voiceActive);
    btn.classList.toggle('btn-ghost',!S.voiceActive);
    btn.textContent=S.voiceActive?'Voice: ON':'Voice: OFF';
  });
  showToast(S.voiceActive?'Voice navigation enabled':'Voice navigation disabled', S.voiceActive?'success':'info');
}

/* ── DARK MODE ────────────────────────────────── */
function toggleDark(){
  S.darkMode=!S.darkMode;
  document.body.classList.toggle('dark',S.darkMode);
  const btn=document.getElementById('dark-btn');
  if(btn) btn.textContent=S.darkMode?'Light Mode':'Dark Mode';
  showToast(S.darkMode?'Dark mode enabled':'Light mode enabled','info');
}

/* ── SETTINGS ─────────────────────────────────── */
function handleSetting(id, val){
  switch(id){
    case 'set-dark':    document.body.classList.toggle('dark',val); S.darkMode=val; break;
    case 'set-refresh': val?startRealtime():stopRealtime(); break;
    case 'set-anim':    S.mapRunning=val; break;
  }
  showToast('Setting saved','success');
}

/* ── PARKING FILTER ───────────────────────────── */
function filterParking(filter){
  document.querySelectorAll('.park-filter-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  renderParking(filter);
}

/* ── MODAL ────────────────────────────────────── */
function showModal(title, body){
  const ov=document.getElementById('modal-overlay'); if(!ov) return;
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=body;
  ov.classList.add('active');
}
function closeModal(){
  const ov=document.getElementById('modal-overlay');
  if(ov) ov.classList.remove('active');
}

/* ── TOAST ────────────────────────────────────── */
function showToast(msg, type='info'){
  const container=document.getElementById('toast-container'); if(!container) return;
  const toast=document.createElement('div');
  toast.className=`toast toast-${type}`;
  const ic=type==='success'?'check':type==='error'?'x':type==='warning'?'alert':'info';
  toast.innerHTML=`${icon(ic,'xs-ic')} <span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(()=>requestAnimationFrame(()=>toast.classList.add('show')));
  setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),320);},3500);
}

/* ── GLOBAL SEARCH ────────────────────────────── */
function handleSearch(e){
  if(e.key!=='Enter') return;
  const q=e.target.value.trim().toLowerCase();
  if(!q) return;
  const map={
    'dashboard':'dashboard','traffic':'traffic','nav':'navigation','route':'navigation',
    'bus':'transport','transport':'transport','carpool':'transport','ride':'transport',
    'park':'parking','emerg':'emergency','sos':'emergency','env':'environment',
    'air':'environment','citizen':'citizen','report':'citizen','analyt':'analytics',
    'advanc':'advanced','drone':'advanced','twin':'advanced','setting':'settings',
  };
  for(const [k,v] of Object.entries(map)){
    if(q.includes(k)){
      const btn=document.querySelector(`.nav-tab[onclick*="${v}"]`);
      switchSection(v, btn);
      showToast(`Navigated to ${v}`,'info');
      e.target.value='';
      return;
    }
  }
  showToast(`No results for "${q}"`,'warning');
}

/* ── REALTIME ─────────────────────────────────── */
let rtInterval=null;
let tickCount=0;

function realtimeUpdate(){
  tickCount++;

  // Move vehicles
  S.vehicles.forEach(v=>{
    v.x=(v.x+v.dx*v.speed*0.035+100)%100;
    v.y=(v.y+v.dy*v.speed*0.035+100)%100;
    if(Math.random()<0.01){v.dx=(RF(-0.4,0.4)||0.1);v.dy=(RF(-0.3,0.3)||0.1);}
    if(Math.random()<0.005) v.speed=R(20,90);
  });

  // Cycle traffic lights
  cycleTrafficLights();

  // Update env silently (every 2s)
  if(tickCount%2===0) updateEnvSilent();

  // Update buses silently
  if(tickCount%3===0) updateBusesSilent();

  // Live badge pulse
  const badge=document.getElementById('live-badge');
  if(badge) badge.style.opacity=(tickCount%2===0)?'1':'0.4';

  // Update map if visible
  if(S.mapRunning && S.activeSection==='dashboard') animateVehicles('main-map');
  if(S.mapRunning && S.activeSection==='traffic')   animateVehicles('traffic-map');
  if(S.mapRunning && S.activeSection==='navigation') animateVehicles('nav-map');

  // Refresh stats every 5s on dashboard
  if(tickCount%5===0 && S.activeSection==='dashboard') renderStats();

  // Refresh ticker every 10s
  if(tickCount%10===0) renderTicker();

  // Occasionally refresh parking
  if(tickCount%8===0){
    S.parking.forEach(p=>{p.free=Math.max(0,Math.min(p.total,p.free+R(-2,2)));});
    if(S.activeSection==='parking') renderParking();
  }
}

function startRealtime(){
  if(rtInterval) return;
  rtInterval=setInterval(realtimeUpdate,1000);
}
function stopRealtime(){
  if(rtInterval){clearInterval(rtInterval);rtInterval=null;}
}

/* ── INIT ─────────────────────────────────────── */
function init(){
  initAllData();
  renderNav();
  renderTicker();
  S.activeSection='dashboard';
  onSectionActivate('dashboard');
  startRealtime();
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeModal();});
  const si=document.getElementById('global-search');
  if(si) si.addEventListener('keydown',handleSearch);
  console.log('%cUrbanIQ ✓ — All systems go','color:#22c55e;font-weight:bold;font-size:13px');
}

window.addEventListener('DOMContentLoaded', init);
