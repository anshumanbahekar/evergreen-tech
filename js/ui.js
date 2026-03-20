/* UrbanIQ — ui.js: all render functions */

/* ── NAV ──────────────────────────────────────── */
function renderNav(){
  const tabs=[
    {id:'dashboard',  label:'Dashboard',   ic:'chart'},
    {id:'traffic',    label:'Traffic',     ic:'traffic'},
    {id:'navigation', label:'Navigation',  ic:'route'},
    {id:'transport',  label:'Transport',   ic:'bus'},
    {id:'parking',    label:'Parking',     ic:'parking'},
    {id:'emergency',  label:'Emergency',   ic:'emergency'},
    {id:'environment',label:'Environment', ic:'leaf'},
    {id:'citizen',    label:'Citizen',     ic:'users'},
    {id:'analytics',  label:'Analytics',  ic:'activity'},
    {id:'advanced',   label:'Advanced',    ic:'robot'},
    {id:'settings',   label:'Settings',    ic:'settings'},
  ];
  const el=document.getElementById('nav-tabs');
  if(!el) return;
  el.innerHTML=tabs.map(t=>`
    <button class="nav-tab${t.id==='dashboard'?' active':''}" onclick="switchSection('${t.id}',this)">
      ${icon(t.ic,'nav-ic')} ${t.label}
    </button>`).join('');
}

/* ── TICKER ───────────────────────────────────── */
function renderTicker(){
  const el=document.getElementById('ticker-text');
  if(!el) return;
  const items=[
    'Traffic flow normal on Highway 7',
    `Bus Route 101 ETA: ${R(2,8)} min`,
    `Air Quality Index: ${S.env.find(e=>e.id==='aqi')?.val||47} — ${S.env.find(e=>e.id==='aqi')?.val>100?'Moderate':'Good'}`,
    `Parking Lot C: ${S.parking[2]?.free||45} spots available`,
    'Smart signal optimization active at 12 intersections',
    `EV Charging: ${R(3,8)} of 10 stations available`,
    'Road works on Oak Ave — expect delays',
    `${S.vehicles.filter(v=>v.type==='emergency').length} emergency vehicles active`,
    `${S.carpools.length} carpool matches available now`,
    'Drone delivery corridor operational — Zone 3',
    `Temperature: ${S.env.find(e=>e.id==='temp')?.val||32}°C`,
    `${S.trafficLights.filter(t=>t.mode==='AI Adaptive').length} intersections on AI control`,
  ];
  el.textContent = items.join('   •   ') + '   •   ';
}

/* ── STAT CARDS ───────────────────────────────── */
function renderStats(){
  const el=document.getElementById('stat-cards');
  if(!el) return;
  const totalFree = S.parking.reduce((a,p)=>a+p.free, 0);
  const onTime = S.buses.filter(b=>!b.delay).length;
  const avgSpeed = S.vehicles.length
    ? Math.round(S.vehicles.reduce((a,v)=>a+v.speed,0)/S.vehicles.length) : 0;
  const activeAlerts = S.alerts.filter(a=>!a.dismissed&&(a.sev==='critical'||a.sev==='warning')).length;
  const aqiVal = S.env.find(e=>e.id==='aqi')?.val||47;
  const cards=[
    {label:'Vehicles Live',  val:S.vehicles.length,             unit:'',         trend:'+3 last hr', ic:'car',      col:'g'},
    {label:'Active Alerts',  val:activeAlerts,                  unit:'',         trend:S.alerts.filter(a=>a.sev==='critical'&&!a.dismissed).length+' critical', ic:'alert', col:'r'},
    {label:'Buses On-Time',  val:onTime,                        unit:`/${S.buses.length}`,    trend:'Live',     ic:'bus',      col:'b'},
    {label:'Parking Free',   val:totalFree,                     unit:' spots',   trend:'Live',     ic:'parking',  col:'o'},
    {label:'AQI Index',      val:aqiVal,                        unit:'',         trend:aqiVal<100?'Good':'Moderate', ic:'leaf', col:'g'},
    {label:'Avg Speed',      val:avgSpeed,                      unit:' km/h',    trend:'Normal',   ic:'activity', col:'p'},
    {label:'Smart Lights',   val:S.trafficLights.length,        unit:' active',  trend:'AI Mode',  ic:'zap',      col:'y'},
    {label:'CO₂ Saved',      val:'1.2',                         unit:'t today',  trend:'+0.2t',    ic:'recycle',  col:'g'},
  ];
  el.innerHTML=cards.map(c=>`
    <div class="stat-card stat-${c.col}">
      <div class="stat-icon">${icon(c.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${c.val}<span class="stat-unit">${c.unit}</span></div>
        <div class="stat-label">${c.label}</div>
      </div>
      <div class="stat-trend">${c.trend}</div>
    </div>`).join('');
}

/* ── MAP ──────────────────────────────────────── */



/* ── HEATMAP ──────────────────────────────────── */
function renderHeatmap(id){
  const el=document.getElementById(id); if(!el) return;
  const cols=14, rows=8;
  el.innerHTML=`<div class="heatmap-grid" style="grid-template-columns:repeat(${cols},1fr)">
    ${Array.from({length:cols*rows},()=>{
      const v=Math.random();
      const h=v>0.7?'0':v>0.4?'38':'120';
      const a=(v*0.8+0.1).toFixed(2);
      return `<div class="hmap-cell" style="background:hsla(${h},85%,48%,${a})" title="${(v*100).toFixed(0)}%"></div>`;
    }).join('')}
  </div>`;
}

/* ── CANVAS CHART ─────────────────────────────── */
function drawLineChart(canvasId, labels, datasets){
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  canvas.width=canvas.offsetWidth||500;
  canvas.height=200;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const pad={t:18,r:18,b:32,l:44};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  ctx.clearRect(0,0,W,H);
  const allVals=datasets.flatMap(d=>d.data);
  const maxV=Math.max(...allVals)*1.1||1;
  // grid
  ctx.strokeStyle='#dcfce7'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad.t+(cH/4)*i;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.fillStyle='#86efac'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='right';
    ctx.fillText(Math.round(maxV*(1-i/4)),pad.l-4,y+4);
  }
  // x labels
  ctx.fillStyle='#86efac'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='center';
  labels.forEach((lbl,i)=>{
    const x=pad.l+(i/(labels.length-1))*cW;
    ctx.fillText(lbl,x,H-4);
  });
  // lines + fills
  datasets.forEach(ds=>{
    ctx.strokeStyle=ds.color||'#22c55e';
    ctx.lineWidth=2.5; ctx.lineJoin='round';
    ctx.beginPath();
    ds.data.forEach((val,i)=>{
      const x=pad.l+(i/(ds.data.length-1))*cW;
      const y=pad.t+cH-(val/maxV)*cH;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.1; ctx.fillStyle=ds.color||'#22c55e';
    ctx.beginPath();
    ds.data.forEach((val,i)=>{
      const x=pad.l+(i/(ds.data.length-1))*cW;
      const y=pad.t+cH-(val/maxV)*cH;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.lineTo(pad.l+cW,pad.t+cH); ctx.lineTo(pad.l,pad.t+cH);
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
}

function renderTrafficChart(){
  drawLineChart('traffic-chart',
    ['0','2','4','6','8','10','12','14','16','18','20','22'],
    [
      {data:[120,80,60,210,490,530,410,450,520,570,410,200],color:'#22c55e'},
      {data:[65,70,72,52,36,33,44,40,34,30,46,62],color:'#3b82f6'},
    ]
  );
}

/* ── ALERTS ───────────────────────────────────── */
function renderAlerts(containerId='alert-list'){
  const el=document.getElementById(containerId); if(!el) return;
  const visible=S.alerts.filter(a=>!a.dismissed);
  if(!visible.length){el.innerHTML='<div class="empty-state">No active alerts</div>';return;}
  el.innerHTML=visible.map(a=>`
    <div class="alert-item alert-${a.sev}" id="al-${a.id}">
      <div class="alert-icon">${icon(a.ic||'alert')}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-sub">${a.msg} &nbsp;•&nbsp; <em>${a.time}</em></div>
      </div>
      <button class="btn-xs btn-ghost" onclick="dismissAlert(${a.id})">✕</button>
    </div>`).join('');
}

function dismissAlert(id){
  const a=S.alerts.find(x=>x.id===id);
  if(a) a.dismissed=true;
  document.querySelectorAll(`#al-${id}`).forEach(el=>{
    el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='.3s';
    setTimeout(()=>el.remove(),300);
  });
  setTimeout(()=>renderStats(),350);
}

/* ── ROAD USAGE ───────────────────────────────── */
function renderRoadUsage(){
  const el=document.getElementById('road-usage'); if(!el) return;
  const data=ROADS.map(r=>({name:r,pct:R(15,98)}));
  el.innerHTML=data.map(d=>`
    <div class="road-row">
      <span class="road-name">${d.name}</span>
      <div class="progress-wrap"><div class="progress-bar ${d.pct>75?'bar-r':d.pct>50?'bar-o':'bar-g'}" style="width:${d.pct}%"></div></div>
      <span class="road-pct">${d.pct}%</span>
    </div>`).join('');
}

/* ── TRAFFIC LIGHTS ───────────────────────────── */
function renderTrafficLights(){
  const el=document.getElementById('tl-grid'); if(!el) return;
  el.innerHTML=S.trafficLights.map(tl=>`
    <div class="tl-card" id="tl-${tl.id}">
      <div class="tl-label">${tl.name}</div>
      <div class="tl-pole">
        <div class="tl-light tl-red${tl.phase==='red'?' active':''}"></div>
        <div class="tl-light tl-yellow${tl.phase==='yellow'?' active':''}"></div>
        <div class="tl-light tl-green${tl.phase==='green'?' active':''}"></div>
      </div>
      <div class="tl-meta">
        <span class="tag ${tl.phase==='green'?'tag-g':tl.phase==='yellow'?'tag-y':'tag-r'}">${tl.phase.toUpperCase()}</span>
        <span class="tl-timer">${tl.timer}s</span>
      </div>
      <div class="tl-mode">${tl.mode}</div>
      <div class="tl-waiting">${icon('users','xs-ic')} ${tl.waiting} waiting</div>
    </div>`).join('');
}

function cycleTrafficLights(){
  const order=['red','yellow','green'];
  S.trafficLights.forEach(tl=>{
    tl.timer--;
    if(tl.timer<=0){
      const idx=order.indexOf(tl.phase);
      tl.phase=order[(idx+1)%3];
      tl.timer=tl.phase==='green'?R(20,45):tl.phase==='yellow'?R(4,7):R(15,35);
      tl.waiting=R(0,25);
    }
    const card=document.getElementById(`tl-${tl.id}`); if(!card) return;
    ['red','yellow','green'].forEach((p,i)=>{
      card.querySelectorAll('.tl-light')[i]?.classList.toggle('active',tl.phase===p);
    });
    const t=card.querySelector('.tl-timer'); if(t) t.textContent=tl.timer+'s';
    const tag=card.querySelector('.tag');
    if(tag){tag.className=`tag ${tl.phase==='green'?'tag-g':tl.phase==='yellow'?'tag-y':'tag-r'}`;tag.textContent=tl.phase.toUpperCase();}
    const w=card.querySelector('.tl-waiting'); if(w) w.innerHTML=`${icon('users','xs-ic')} ${tl.waiting} waiting`;
  });
}

/* ── PARKING ──────────────────────────────────── */
function renderParking(filter=''){
  const el=document.getElementById('parking-grid'); if(!el) return;
  let lots=S.parking;
  if(filter==='ev') lots=lots.filter(p=>p.ev);
  if(filter==='ug') lots=lots.filter(p=>p.underground);
  el.innerHTML=lots.map(p=>{
    const pct=Math.round((p.free/p.total)*100);
    const cls=pct<10?'park-full':pct<35?'park-busy':'park-ok';
    const barcls=pct<10?'bar-r':pct<35?'bar-o':'bar-g';
    return `
    <div class="park-card ${cls}">
      <div class="park-header">
        <span class="park-name">${p.name}</span>
        ${p.ev?`<span class="tag tag-g">${icon('zap','xs-ic')} EV</span>`:''}
        ${p.underground?`<span class="tag tag-b">UG</span>`:''}
      </div>
      <div class="park-spots"><span class="park-free">${p.free}</span><span class="park-total"> / ${p.total} free</span></div>
      <div class="progress-wrap"><div class="progress-bar ${barcls}" style="width:${Math.max(2,100-pct)}%"></div></div>
      <div class="park-footer">
        <span class="park-price">${icon('wallet','xs-ic')} ₹${p.price}/hr</span>
        <button class="btn-xs btn-p" onclick="reserveParking(${p.id})">Reserve</button>
      </div>
    </div>`}).join('');
}

/* ── BUSES ────────────────────────────────────── */
function renderBuses(){
  const el=document.getElementById('bus-list'); if(!el) return;
  el.innerHTML=S.buses.map(b=>`
    <div class="bus-item">
      <div class="bus-route">${icon('bus','sm-ic')} <strong>${b.route}</strong> &nbsp;
        <span class="tag ${b.delay?'tag-r':'tag-g'}">${b.delay?`+${b.delay}m delay`:'On Time'}</span>
      </div>
      <div class="bus-dest">${b.from} → ${b.to}</div>
      <div class="bus-meta">
        <span class="tag tag-b">${icon('clock','xs-ic')} ETA ${b.eta}m</span>
        <span class="tag tag-p">${icon('users','xs-ic')} ${b.occupancy}%</span>
        <span class="tag tag-o">${b.seats} seats free</span>
        <button class="btn-xs btn-ghost" onclick="trackBus(${b.id})">Track</button>
      </div>
    </div>`).join('');
}

function updateBusesSilent(){
  S.buses.forEach(b=>{
    b.eta=Math.max(1,b.eta-1);
    if(b.eta<=1){b.eta=R(3,20);b.delay=R(0,3)===0?0:R(2,10);}
    b.occupancy=Math.max(5,Math.min(100,b.occupancy+R(-3,3)));
    b.seats=Math.max(0,Math.min(50,b.seats+R(-2,2)));
    const el=document.querySelector(`#bus-list .bus-item:nth-child(${b.id+1})`);
    if(el){
      const tag=el.querySelector('.tag');
      if(tag){tag.className=`tag ${b.delay?'tag-r':'tag-g'}`;tag.textContent=b.delay?`+${b.delay}m delay`:'On Time';}
      const etaTag=el.querySelectorAll('.tag')[1];
      if(etaTag) etaTag.innerHTML=`${icon('clock','xs-ic')} ETA ${b.eta}m`;
    }
  });
}

/* ── ENV ──────────────────────────────────────── */
function renderEnv(){
  const el=document.getElementById('env-gauges'); if(!el) return;
  el.innerHTML=S.env.map(e=>{
    const pct=Math.min(100,Math.round((e.val/e.max)*100));
    const bad=e.val>=e.warn;
    return `
    <div class="env-card" id="env-${e.id}">
      <div class="env-icon ${bad?'env-bad':'env-ok'}">${icon(e.ic)}</div>
      <div class="env-label">${e.label}</div>
      <div class="env-val">${e.val}<span class="env-unit">${e.unit}</span></div>
      <div class="progress-wrap env-bar"><div class="progress-bar ${bad?'bar-r':'bar-g'}" style="width:${pct}%"></div></div>
      <div class="env-status"><span class="tag ${bad?'tag-r':'tag-g'}">${bad?'High':'Normal'}</span></div>
    </div>`}).join('');
}

function updateEnvSilent(){
  S.env.forEach(e=>{
    e.val=Math.max(e.min,Math.min(e.max,parseFloat((e.val+RF(-1.5,1.5)).toFixed(1))));
    const card=document.getElementById(`env-${e.id}`); if(!card) return;
    const bad=e.val>=e.warn;
    const pct=Math.min(100,Math.round((e.val/e.max)*100));
    const valEl=card.querySelector('.env-val');
    if(valEl) valEl.innerHTML=`${e.val}<span class="env-unit">${e.unit}</span>`;
    const bar=card.querySelector('.progress-bar');
    if(bar){bar.className=`progress-bar ${bad?'bar-r':'bar-g'}`;bar.style.width=pct+'%';}
    const iconEl=card.querySelector('.env-icon');
    if(iconEl) iconEl.className=`env-icon ${bad?'env-bad':'env-ok'}`;
    const tag=card.querySelector('.tag');
    if(tag){tag.className=`tag ${bad?'tag-r':'tag-g'}`;tag.textContent=bad?'High':'Normal';}
  });
}

/* ── CARPOOL ──────────────────────────────────── */
function renderCarpool(){
  const el=document.getElementById('carpool-list'); if(!el) return;
  el.innerHTML=S.carpools.map(r=>`
    <div class="carpool-item">
      <div class="carpool-avatar">${r.name[0]}</div>
      <div class="carpool-body">
        <div class="carpool-name">${r.name} <span class="tag tag-y">★ ${r.rating}</span></div>
        <div class="carpool-route">${icon('route','xs-ic')} ${r.from} → ${r.to}</div>
        <div class="carpool-meta">
          <span class="tag tag-b">${icon('clock','xs-ic')} ${r.time}</span>
          <span class="tag tag-g">${icon('users','xs-ic')} ${r.seats} seat${r.seats>1?'s':''}</span>
          <span class="tag tag-p">${icon('wallet','xs-ic')} ₹${r.price}</span>
        </div>
      </div>
      <button class="btn-sm btn-p" onclick="joinCarpool(${r.id})">Join</button>
    </div>`).join('');
}

/* ── RIDE SHARE ───────────────────────────────── */
function renderShareOptions(){
  const el=document.getElementById('share-options'); if(!el) return;
  const opts=[
    {name:'UrbanAuto', type:'Auto',   eta:R(3,7),  price:R(40,80),  ic:'car'},
    {name:'UrbanCab',  type:'Cab',    eta:R(5,12), price:R(80,160), ic:'car2'},
    {name:'UrbanBike', type:'Bike',   eta:R(2,5),  price:R(20,50),  ic:'bike'},
    {name:'UrbanPool', type:'Pool',   eta:R(8,18), price:R(30,65),  ic:'users'},
    {name:'UrbanEV',   type:'EV Cab', eta:R(6,14), price:R(90,170), ic:'zap'},
  ];
  el.innerHTML=opts.map(o=>`
    <div class="share-card">
      <div class="share-icon">${icon(o.ic)}</div>
      <div class="share-name">${o.name}</div>
      <div class="share-type">${o.type}</div>
      <div class="share-eta">${icon('clock','xs-ic')} ${o.eta} min</div>
      <div class="share-price">₹${o.price}</div>
      <button class="btn-sm btn-p" onclick="bookRide('${o.name}')">Book</button>
    </div>`).join('');
}

/* ── ANALYTICS ────────────────────────────────── */
function renderAnalytics(){
  const el=document.getElementById('analytics-metrics'); if(!el) return;
  const metrics=[
    {label:'Daily Trips',       val:'1,24,320', trend:'+5.2%',  ic:'route',    col:'g'},
    {label:'Avg Commute Time',  val:'28 min',   trend:'-2 min', ic:'clock',    col:'b'},
    {label:'Fuel Saved (L)',    val:'8,540',    trend:'+12%',   ic:'fuel',     col:'o'},
    {label:'Accidents Today',   val:'3',        trend:'-2',     ic:'alert',    col:'r'},
    {label:'Public Transit %',  val:'42%',      trend:'+3%',    ic:'bus',      col:'p'},
    {label:'Emissions Saved',   val:'2.1 t',    trend:'+0.4t',  ic:'leaf',     col:'g'},
  ];
  el.innerHTML=metrics.map(m=>`
    <div class="stat-card stat-${m.col}">
      <div class="stat-icon">${icon(m.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${m.val}</div>
        <div class="stat-label">${m.label}</div>
      </div>
      <div class="stat-trend">${m.trend}</div>
    </div>`).join('');
  setTimeout(()=>drawLineChart('analytics-chart',['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],[
    {data:[112000,118000,124000,121000,129000,105000,98000],color:'#22c55e'},
    {data:[82000,88000,95000,91000,99000,75000,68000],color:'#3b82f6'},
  ]),50);
}

/* ── ADVANCED ─────────────────────────────────── */
function renderAdvanced(){
  renderAVFleet();
  renderDrones();
  renderTolls();
  renderLogistics();
  renderTwinCanvas();
}

function renderAVFleet(){
  const el=document.getElementById('av-fleet'); if(!el) return;
  el.innerHTML=S.avFleet.map(v=>`
    <div class="av-card">
      <div class="av-id">${icon('robot','sm-ic')} ${v.id}</div>
      <div class="av-status"><span class="tag ${v.status==='Active'?'tag-g':v.status==='Charging'?'tag-b':'tag-o'}">${v.status}</span></div>
      <div class="av-battery">${icon('zap','xs-ic')} ${v.battery}%
        <div class="progress-wrap sm"><div class="progress-bar ${v.battery<30?'bar-r':v.battery<60?'bar-o':'bar-g'}" style="width:${v.battery}%"></div></div>
      </div>
      <div class="av-meta">${v.trips} trips &nbsp;•&nbsp; ${v.km} km &nbsp;•&nbsp; ${v.zone}</div>
    </div>`).join('');
}

function renderDrones(){
  const el=document.getElementById('drone-list'); if(!el) return;
  el.innerHTML=S.drones.map(d=>`
    <div class="drone-item">
      <div style="flex-shrink:0">${icon('drone','sm-ic')}</div>
      <div class="drone-body">
        <span class="drone-id">${d.id}</span>
        <span class="tag tag-b">${d.mission}</span>
        <span class="tag ${d.status==='In Flight'?'tag-g':d.status==='Charging'?'tag-b':'tag-o'}">${d.status}</span>
        <span class="tag tag-p">${d.altitude}m</span>
        <span class="tag tag-y">${icon('zap','xs-ic')} ${d.battery}%</span>
        <span class="tag tag-o">${icon('clock','xs-ic')} ${d.eta}m</span>
      </div>
    </div>`).join('');
}

function renderTolls(){
  const el=document.getElementById('toll-list'); if(!el) return;
  el.innerHTML=S.tolls.map(t=>`
    <div class="toll-item">
      <div class="toll-name">${icon('road','xs-ic')} ${t.road}</div>
      <div class="toll-meta">
        <span>₹${t.rate}/vehicle</span>
        <span class="tag tag-b">${icon('car','xs-ic')} ${t.vehicles.toLocaleString()}</span>
        <span class="tag tag-g">₹${t.revenue.toLocaleString()} revenue</span>
        <span class="tag tag-p">FASTag ${t.fastag}%</span>
      </div>
    </div>`).join('');
}

function renderLogistics(){
  const el=document.getElementById('logistics-list'); if(!el) return;
  el.innerHTML=S.logistics.map(t=>`
    <div class="logistics-item">
      <div style="flex-shrink:0">${icon('package','sm-ic')}</div>
      <div class="logistics-body">
        <span class="logistics-id">${t.id}</span>
        <span class="tag tag-b">${t.cargo}</span>
        <span class="tag ${t.status==='En Route'?'tag-g':t.status==='Waiting'?'tag-r':'tag-o'}">${t.status}</span>
        <span>${t.from} → ${t.to}</span>
        <span class="tag tag-p">${t.weight}t &nbsp;•&nbsp; ETA ${t.eta}m</span>
      </div>
    </div>`).join('');
}

function renderTwinCanvas(){
  const canvas=document.getElementById('twin-canvas'); if(!canvas) return;
  canvas.width=canvas.offsetWidth||500; canvas.height=260;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  ctx.fillStyle='#f0fdf4'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#bbf7d0'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.strokeStyle='#22c55e'; ctx.lineWidth=12;
  ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
  ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(0,H/4);ctx.lineTo(W,H/4);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H*.75);ctx.lineTo(W,H*.75);ctx.stroke();
  ctx.beginPath();ctx.moveTo(W/4,0);ctx.lineTo(W/4,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(W*.75,0);ctx.lineTo(W*.75,H);ctx.stroke();
  S.vehicles.slice(0,25).forEach(v=>{
    const cx=(v.x/100)*W, cy=(v.y/100)*H;
    ctx.fillStyle=v.type==='bus'?'#3b82f6':v.type==='emergency'?'#ef4444':'#166534';
    ctx.beginPath(); ctx.arc(cx,cy,v.type==='bus'?6:4,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#15803d'; ctx.font='bold 11px DM Mono,monospace';
  ctx.fillText(`DIGITAL TWIN — ${S.twinMode.toUpperCase()} MODE`,10,18);
}

/* ── EMERGENCY CONTACTS ───────────────────────── */
function renderEmergencyContacts(){
  const el=document.getElementById('emergency-contacts'); if(!el) return;
  const contacts=[
    {name:'Police',         num:'100',      ic:'alert',     col:'r'},
    {name:'Ambulance',      num:'108',      ic:'ambulance', col:'r'},
    {name:'Fire Brigade',   num:'101',      ic:'flame',     col:'o'},
    {name:'Traffic Control',num:'103',      ic:'traffic',   col:'b'},
    {name:'Road Helpline',  num:'1033',     ic:'road',      col:'g'},
  ];
  el.innerHTML=contacts.map(c=>`
    <div class="emergency-contact stat-${c.col}">
      <div class="stat-icon">${icon(c.ic)}</div>
      <div class="stat-body">
        <div class="stat-val">${c.num}</div>
        <div class="stat-label">${c.name}</div>
      </div>
      <a href="tel:${c.num}" class="btn-sm btn-d" onclick="showToast('Calling ${c.name}...','info');return false">${icon('phone','xs-ic')} Call</a>
    </div>`).join('');
}

/* ── CITIZEN REPORT MAP ───────────────────────── */
function renderReportMap(){
  const el=document.getElementById('report-map'); if(!el) return;
  el.innerHTML=`
    <div id="report-map-inner" style="width:100%;height:100%;position:relative;cursor:crosshair;background:#f0fdf4;border-radius:10px;overflow:hidden" onclick="addReportPin(event)">
      <svg width="100%" height="100%" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="300" fill="#f0fdf4"/>
        <rect x="130" y="10" width="230" height="80" rx="5" fill="#dcfce7" stroke="#bbf7d0"/>
        <rect x="130" y="110" width="230" height="80" rx="5" fill="#dcfce7" stroke="#bbf7d0"/>
        <rect x="130" y="210" width="230" height="80" rx="5" fill="#dcfce7" stroke="#bbf7d0"/>
        <line x1="0" y1="100" x2="500" y2="100" stroke="#22c55e" stroke-width="10"/>
        <line x1="0" y1="200" x2="500" y2="200" stroke="#22c55e" stroke-width="8"/>
        <line x1="120" y1="0" x2="120" y2="300" stroke="#22c55e" stroke-width="10"/>
        <line x1="370" y1="0" x2="370" y2="300" stroke="#22c55e" stroke-width="8"/>
        <text x="10" y="16" font-size="9" fill="#15803d" font-family="DM Mono" font-weight="bold">Click to pin report location</text>
      </svg>
      <div id="report-pins"></div>
    </div>`;
}

/* ── SETTINGS ─────────────────────────────────── */
function renderSettings(){
  const el=document.getElementById('settings-body'); if(!el) return;
  const groups=[
    {title:'Display',items:[
      {label:'Dark Mode',           id:'set-dark',    val:false},
      {label:'Live Map Animation',  id:'set-anim',    val:true},
      {label:'High Contrast Mode',  id:'set-hc',      val:false},
    ]},
    {title:'Notifications',items:[
      {label:'Critical Alerts',     id:'set-alert-c', val:true},
      {label:'Traffic Updates',     id:'set-alert-t', val:true},
      {label:'Bus Delays',          id:'set-alert-b', val:true},
      {label:'Parking Alerts',      id:'set-alert-p', val:false},
    ]},
    {title:'Data & AI',items:[
      {label:'Auto-Refresh (1s)',   id:'set-refresh', val:true},
      {label:'AI Predictions',      id:'set-ai',      val:true},
      {label:'Share Anonymous Data',id:'set-share',   val:false},
    ]},
  ];
  el.innerHTML=groups.map(g=>`
    <div class="settings-group card">
      <div class="card-title">${g.title}</div>
      ${g.items.map(item=>`
        <div class="settings-row">
          <span>${item.label}</span>
          <label class="toggle">
            <input type="checkbox" id="${item.id}" ${item.val?'checked':''} onchange="handleSetting('${item.id}',this.checked)">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>`).join('')}
    </div>`).join('');
}

/* ── ROUTE RESULT ─────────────────────────────── */
function renderRoute(from, to, mode){
  const el=document.getElementById('route-result'); if(!el) return;
  const dist=RF(2.5,18), mins=R(8,45);
  const roads2=[C(ROADS),C(ROADS),C(ROADS)];
  const dirs=['left','right','straight'];
  el.innerHTML=`
    <div style="background:var(--g1);border:1.5px solid var(--g3);border-radius:10px;padding:14px;margin-top:12px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:.85rem;font-weight:700">
        ${icon('route','sm-ic')} ${from} → ${to}
        <span class="tag tag-g">${dist} km</span>
        <span class="tag tag-b">${mins} min</span>
        <span class="tag tag-p">${mode}</span>
      </div>
      <ol class="route-steps">
        <li>Head ${C(['north','south','east','west'])} on <strong>${roads2[0]}</strong></li>
        <li>Turn ${C(dirs)} onto <strong>${roads2[1]}</strong> — continue ${RF(0.5,3)} km</li>
        <li>Take exit toward <strong>${C(AREAS)}</strong></li>
        <li>Turn ${C(['left','right'])} onto <strong>${roads2[2]}</strong></li>
        <li>Arrive at <strong>${to}</strong> on the ${C(['left','right'])}</li>
      </ol>
    </div>`;
}

function renderEVRoute(){
  const el=document.getElementById('ev-route-result'); if(!el) return;
  const stations=Array.from({length:3},()=>({
    name:`EV Station — ${C(AREAS)}`, slots:R(1,8), dist:RF(0.5,5), wait:R(5,20)
  }));
  el.innerHTML=`
    <div class="card" style="margin-top:1rem">
      <div class="card-title">${icon('zap','sm-ic')} Charging Stops Along Route</div>
      ${stations.map(s=>`
        <div class="ev-station-item">
          ${icon('zap','xs-ic')} <strong>${s.name}</strong>
          <span class="tag tag-g">${s.slots} slots</span>
          <span class="tag tag-b">${s.dist} km</span>
          <span class="tag tag-o">${s.wait} min wait</span>
          <button class="btn-xs btn-p" onclick="showToast('Slot reserved at ${s.name}','success')">Reserve</button>
        </div>`).join('')}
    </div>`;
}
