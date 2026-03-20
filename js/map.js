/* UrbanIQ — map.js
   Google Maps integration — drop YOUR_API_KEY below when ready.
   Until then, falls back to the canvas city renderer.
*/

const GMAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // ← paste key here
const GMAPS_READY   = GMAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

const MAP_INSTANCES = {}; // containerId → google.maps.Map
const MAP_MARKERS   = {}; // containerId → marker array
const MAP_STATE     = {}; // containerId → canvas state (fallback)

/* ═══════════════════════════════════════════════
   PUBLIC API — called from app.js
═══════════════════════════════════════════════ */

function renderMap(containerId = 'main-map') {
  if (GMAPS_READY) {
    initGoogleMap(containerId);
  } else {
    renderCanvasMap(containerId);
  }
}

function animateVehicles(containerId = 'main-map') {
  if (GMAPS_READY) {
    updateGoogleMapMarkers(containerId);
  } else {
    drawCity(containerId);
  }
}

/* ═══════════════════════════════════════════════
   GOOGLE MAPS
═══════════════════════════════════════════════ */

function loadGoogleMapsScript() {
  if (document.getElementById('gmaps-script')) return;
  const script = document.createElement('script');
  script.id  = 'gmaps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_API_KEY}&callback=onGoogleMapsLoaded&libraries=visualization`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

window.onGoogleMapsLoaded = function() {
  console.log('[UrbanIQ] Google Maps loaded ✓');
  // Re-render any map containers that are currently visible
  document.querySelectorAll('.map-canvas').forEach(el => {
    if (el.offsetParent !== null) renderMap(el.id);
  });
};

function initGoogleMap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Clear any previous canvas content
  if (!MAP_INSTANCES[containerId]) {
    el.innerHTML = '';
    el.style.padding = '0';

    const center = { lat: REAL?.lat || 19.1383, lng: REAL?.lon || 77.3210 };

    const mapOptions = {
      center,
      zoom: 14,
      mapTypeId: 'roadmap',
      styles: googleMapsStyle(),
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'cooperative',
    };

    const map = new google.maps.Map(el, mapOptions);
    MAP_INSTANCES[containerId] = map;
    MAP_MARKERS[containerId]   = [];

    // Add traffic layer
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    // Add transit layer
    const transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);

    // Plot initial vehicle markers
    placeVehicleMarkers(containerId, map);

    // Plot incident markers from alerts
    placeIncidentMarkers(containerId, map);

    console.log(`[UrbanIQ] Google Map initialised: ${containerId}`);
  } else {
    // Already exists — just update center if location changed
    MAP_INSTANCES[containerId].setCenter({ lat: REAL?.lat || 19.1383, lng: REAL?.lon || 77.3210 });
  }
}

function placeVehicleMarkers(containerId, map) {
  if (!map) return;
  const markers = MAP_MARKERS[containerId] || [];

  // Remove old vehicle markers
  markers.filter(m => m._type === 'vehicle').forEach(m => m.setMap(null));
  MAP_MARKERS[containerId] = markers.filter(m => m._type !== 'vehicle');

  const center = map.getCenter();
  const baseLat = center.lat();
  const baseLng = center.lng();
  const spread = 0.025; // ~2.5km radius

  S.vehicles.slice(0, 40).forEach(v => {
    const lat = baseLat + (v.y / 100 - 0.5) * spread * 2;
    const lng = baseLng + (v.x / 100 - 0.5) * spread * 2.5;

    const color = v.type === 'emergency' ? '#dc2626'
                : v.type === 'bus'       ? '#1d4ed8'
                : '#166534';
    const size  = v.type === 'bus' ? 10 : v.type === 'emergency' ? 11 : 7;

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.85,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
        scale: size,
      },
      title: `${v.type} — ${v.speed} km/h`,
    });
    marker._type = 'vehicle';
    marker._vid  = v.id;
    MAP_MARKERS[containerId].push(marker);
  });
}

function placeIncidentMarkers(containerId, map) {
  if (!map) return;
  const center = map.getCenter();
  const baseLat = center.lat();
  const baseLng = center.lng();
  const spread = 0.018;

  S.alerts.filter(a => a.sev === 'critical' && !a.dismissed).slice(0, 5).forEach((a, i) => {
    const lat = baseLat + (Math.sin(i * 1.7) * spread);
    const lng = baseLng + (Math.cos(i * 1.7) * spread * 1.5);

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-family:sans-serif;max-width:200px">
        <strong style="color:#dc2626">${a.title}</strong><br>
        <span style="font-size:12px;color:#555">${a.msg}</span><br>
        <span style="font-size:11px;color:#999">${a.time}</span>
      </div>`
    });

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
            <text x="14" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="#dc2626">!</text>
          </svg>`),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14),
      },
      title: a.title,
      zIndex: 999,
    });

    marker.addListener('click', () => infoWindow.open(map, marker));
    marker._type = 'incident';
    MAP_MARKERS[containerId].push(marker);
  });
}

function updateGoogleMapMarkers(containerId) {
  const map = MAP_INSTANCES[containerId];
  if (!map) return;
  // Throttle — update every 3rd call
  if (!MAP_STATE[containerId]) MAP_STATE[containerId] = { frame: 0 };
  MAP_STATE[containerId].frame++;
  if (MAP_STATE[containerId].frame % 3 !== 0) return;

  const center = map.getCenter();
  const baseLat = center.lat();
  const baseLng = center.lng();
  const spread = 0.025;

  const vehicleMarkers = (MAP_MARKERS[containerId] || []).filter(m => m._type === 'vehicle');

  vehicleMarkers.forEach((marker, i) => {
    const v = S.vehicles[i];
    if (!v) return;
    const lat = baseLat + (v.y / 100 - 0.5) * spread * 2;
    const lng = baseLng + (v.x / 100 - 0.5) * spread * 2.5;
    marker.setPosition({ lat, lng });
  });
}

/* ── Google Maps visual style (green city theme) */
function googleMapsStyle() {
  return [
    { elementType: 'geometry',   stylers: [{ color: '#f0fdf4' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#86efac' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
    { featureType: 'park',  elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
    { featureType: 'poi',   stylers: [{ visibility: 'simplified' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#bbf7d0' }] },
  ];
}

/* ═══════════════════════════════════════════════
   CANVAS FALLBACK (used when no API key)
═══════════════════════════════════════════════ */

function renderCanvasMap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // Show "no key" banner + canvas map
  let banner = el.querySelector('.no-key-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'no-key-banner';
    banner.innerHTML = `
      <span>📍 Google Maps preview — add your API key in <code>js/map.js</code> to enable live maps</span>`;
    el.insertBefore(banner, el.firstChild);
  }

  let canvas = el.querySelector('canvas.city-canvas');
  let legend = el.querySelector('.map-legend');

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'city-canvas';
    canvas.style.cssText = 'width:100%;height:calc(100% - 30px);display:block;border-radius:0 0 10px 10px;';
    el.appendChild(canvas);

    legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = `
      <span class="leg-item"><span class="leg-dot" style="background:#1e3a5f"></span>Car</span>
      <span class="leg-item"><span class="leg-dot" style="background:#1d4ed8"></span>Bus</span>
      <span class="leg-item"><span class="leg-dot" style="background:#dc2626"></span>Emergency</span>
      <span class="leg-item"><span class="leg-dot" style="background:#16a34a"></span>Clear</span>
      <span class="leg-item"><span class="leg-dot" style="background:#f59e0b"></span>Moderate</span>
      <span class="leg-item"><span class="leg-dot" style="background:#ef4444"></span>Congested</span>`;
    el.appendChild(legend);
  }

  const W = el.clientWidth  || 700;
  const H = (el.clientHeight || 380) - 30;
  canvas.width  = W;
  canvas.height = H;
  MAP_STATE[containerId] = { canvas, W, H, frame: 0 };
  drawCity(containerId);
}

function drawCity(containerId) {
  const state = MAP_STATE[containerId];
  if (!state || !state.canvas) return;
  const { canvas, W, H } = state;
  const ctx = canvas.getContext('2d');

  /* background */
  ctx.fillStyle = '#e8f4e8';
  ctx.fillRect(0, 0, W, H);

  /* parks */
  const parks = [
    [W*.03,H*.04,W*.11,H*.15],[W*.54,H*.05,W*.1,H*.13],
    [W*.81,H*.54,W*.12,H*.18],[W*.03,H*.67,W*.1,H*.2],
    [W*.37,H*.61,W*.08,H*.14],
  ];
  parks.forEach(([x,y,w,h]) => {
    ctx.fillStyle = '#bbf7d0';
    roundRect(ctx, x, y, w, h, 5); ctx.fill();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x+w*(.18+i*.16), y+h*.45+(i%2)*h*.15, 3.5, 0, Math.PI*2);
      ctx.fill();
    }
  });

  /* city blocks */
  buildCityBlocks(W, H).forEach(b => {
    ctx.fillStyle = b.color;
    roundRect(ctx, b.x, b.y, b.w, b.h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.5;
    roundRect(ctx, b.x+1, b.y+1, b.w-2, b.h-2, 3); ctx.stroke();
  });

  /* roads */
  const hRoads = [H*.18, H*.38, H*.58, H*.78];
  const vRoads = [W*.18, W*.38, W*.58, W*.78];
  const congColors = ['#16a34a','#f59e0b','#ef4444'];

  // shadows
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 16;
  hRoads.forEach(y => { ctx.beginPath(); ctx.moveTo(0,y+2); ctx.lineTo(W,y+2); ctx.stroke(); });
  vRoads.forEach(x => { ctx.beginPath(); ctx.moveTo(x+2,0); ctx.lineTo(x+2,H); ctx.stroke(); });

  // asphalt
  hRoads.forEach(y => {
    const cong = R(0,2);
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.strokeStyle = congColors[cong]; ctx.lineWidth = 8; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([11,9]);
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.setLineDash([]);
  });
  vRoads.forEach(x => {
    const cong = R(0,2);
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    ctx.strokeStyle = congColors[cong]; ctx.lineWidth = 8; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([11,9]);
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    ctx.setLineDash([]);
  });

  /* intersections */
  hRoads.forEach(y => {
    vRoads.forEach(x => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x-7, y-7, 14, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x-9,y-5); ctx.lineTo(x-9,y+5);
      ctx.moveTo(x+9,y-5); ctx.lineTo(x+9,y+5);
      ctx.moveTo(x-5,y-9); ctx.lineTo(x+5,y-9);
      ctx.moveTo(x-5,y+9); ctx.lineTo(x+5,y+9);
      ctx.stroke();
    });
  });

  /* vehicles */
  S.vehicles.slice(0, 50).forEach(v => {
    const cx = (v.x/100)*W, cy = (v.y/100)*H;
    if (v.type === 'bus') {
      ctx.fillStyle = '#1d4ed8';
      ctx.shadowColor = 'rgba(29,78,216,0.35)'; ctx.shadowBlur = 5;
      roundRect(ctx, cx-5, cy-3, 10, 6, 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(cx-4, cy-2, 2, 2); ctx.fillRect(cx+2, cy-2, 2, 2);
    } else if (v.type === 'emergency') {
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = 'rgba(220,38,38,0.55)'; ctx.shadowBlur = 9;
      roundRect(ctx, cx-5, cy-3, 10, 6, 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (Math.floor(Date.now()/380) % 2 === 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(cx, cy-5, 2, 0, Math.PI*2); ctx.fill();
      }
    } else {
      ctx.fillStyle = v.speed > 60 ? '#0f172a' : '#1e3a5f';
      ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  /* incident markers */
  S.alerts.filter(a => a.sev==='critical' && !a.dismissed).slice(0,4).forEach((a,i) => {
    const cx = W*(0.22+i*0.19), cy = H*(0.28+(i%2)*0.38);
    const pulse = ((Date.now() % 1200) / 1200) * 8;
    ctx.strokeStyle = 'rgba(239,68,68,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 12+pulse, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#fee2e2'; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, cy);
  });

  /* HUD */
  ctx.fillStyle = 'rgba(15,23,42,0.55)';
  roundRect(ctx, 8, 8, 94, 36, 6); ctx.fill();
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 9px DM Mono,monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('● CANVAS PREVIEW', 14, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '8px DM Mono,monospace';
  ctx.fillText(`Add API key → live map`, 14, 35);
}

function buildCityBlocks(W, H) {
  const blocks = [];
  const xs = [0, W*.18+7, W*.38+7, W*.58+7, W*.78+7, W];
  const ys = [0, H*.18+7, H*.38+7, H*.58+7, H*.78+7, H];
  const colors = ['#dbeafe','#ede9fe','#fce7f3','#fff7ed','#dcfce7','#e0e7ff','#f0fdf4','#fef9c3','#ecfeff','#fdf2f8'];
  for (let r = 0; r < ys.length-1; r++) {
    for (let c = 0; c < xs.length-1; c++) {
      const x = xs[c], y = ys[r];
      const w = xs[c+1]-x-7, h = ys[r+1]-y-7;
      if (w > 8 && h > 8) blocks.push({ x, y, w, h, color: colors[(r*6+c)%colors.length] });
    }
  }
  return blocks;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);   ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);     ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

/* ── Load Google Maps script if key is present ── */
if (GMAPS_READY) {
  loadGoogleMapsScript();
  console.log('[UrbanIQ] Google Maps API key detected — will load live maps');
} else {
  console.info('[UrbanIQ] No Google Maps API key — using canvas preview. Set GMAPS_API_KEY in js/map.js');
}
