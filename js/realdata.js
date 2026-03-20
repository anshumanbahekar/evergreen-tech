/* UrbanIQ — realdata.js: Real API integrations */
/* APIs used (all FREE, no key required):
   - Open-Meteo Weather: https://api.open-meteo.com
   - Open-Meteo Air Quality: https://air-quality-api.open-meteo.com
   - Browser Geolocation API
*/

const REAL = {
  lat: 19.1383,  // Nanded, Maharashtra (default — user's location)
  lon: 77.3210,
  city: 'Nanded',
  loaded: { weather: false, airquality: false },
  lastFetch: 0,
};

/* ── GEOLOCATION ──────────────────────────────── */
function initGeolocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      REAL.lat = pos.coords.latitude;
      REAL.lon = pos.coords.longitude;
      REAL.city = 'Your Location';
      console.log(`[UrbanIQ] Location acquired: ${REAL.lat.toFixed(4)}, ${REAL.lon.toFixed(4)}`);
      fetchAllRealData();
      reverseGeocode(REAL.lat, REAL.lon);
    },
    err => {
      console.warn('[UrbanIQ] Geolocation denied, using Nanded defaults');
      fetchAllRealData();
    },
    { timeout: 6000 }
  );
}

/* ── REVERSE GEOCODE (Open-Meteo geocoding) ───── */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1&language=en`
    );
  } catch(e) {}
}

/* ── FETCH ALL ────────────────────────────────── */
async function fetchAllRealData() {
  await Promise.all([
    fetchRealWeather(),
    fetchRealAirQuality(),
  ]);
  updateLocationLabel();
}

/* ── WEATHER (Open-Meteo) ─────────────────────── */
async function fetchRealWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${REAL.lat}&longitude=${REAL.lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
      `precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code,` +
      `surface_pressure,visibility` +
      `&hourly=temperature_2m,precipitation_probability,wind_speed_10m` +
      `&timezone=auto&forecast_days=1`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const c = data.current;

    // Update S.env with real values
    const envMap = {
      temp:  { val: c.temperature_2m,       unit: '°C',   label: 'Temperature' },
      humid: { val: c.relative_humidity_2m, unit: '%',    label: 'Humidity' },
      wind:  { val: c.wind_speed_10m,       unit: 'km/h', label: 'Wind Speed' },
    };

    S.env.forEach(e => {
      if (envMap[e.id]) {
        e.val = envMap[e.id].val;
        e._real = true;
      }
    });

    // Store raw for display
    REAL.weather = {
      temp:        c.temperature_2m,
      feelsLike:   c.apparent_temperature,
      humidity:    c.relative_humidity_2m,
      windSpeed:   c.wind_speed_10m,
      windDir:     c.wind_direction_10m,
      rain:        c.rain,
      pressure:    c.surface_pressure,
      visibility:  c.visibility,
      weatherCode: c.weather_code,
      weatherDesc: wmoDescription(c.weather_code),
      hourlyTemps: data.hourly?.temperature_2m?.slice(0,24) || [],
      hourlyRain:  data.hourly?.precipitation_probability?.slice(0,24) || [],
      fetchedAt:   new Date().toLocaleTimeString(),
    };

    REAL.loaded.weather = true;
    console.log(`[UrbanIQ] Real weather: ${REAL.weather.temp}°C, ${REAL.weather.weatherDesc}`);

    // Update UI if env section is active
    if (S.activeSection === 'environment') renderEnv();
    renderWeatherWidget();
    showToast(`Live weather loaded: ${REAL.weather.temp}°C, ${REAL.weather.weatherDesc}`, 'success');

  } catch(e) {
    console.warn('[UrbanIQ] Weather fetch failed:', e.message);
    showToast('Weather data unavailable — using estimates', 'warning');
  }
}

/* ── AIR QUALITY (Open-Meteo) ─────────────────── */
async function fetchRealAirQuality() {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${REAL.lat}&longitude=${REAL.lon}` +
      `&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,` +
      `sulphur_dioxide,european_aqi,us_aqi` +
      `&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('AQ API error');
    const data = await res.json();
    const c = data.current;

    REAL.airQuality = {
      pm25:    c.pm2_5,
      pm10:    c.pm10,
      co:      (c.carbon_monoxide / 1000).toFixed(2), // μg/m³ → mg/m³
      no2:     c.nitrogen_dioxide,
      o3:      c.ozone,
      so2:     c.sulphur_dioxide,
      euAqi:   c.european_aqi,
      usAqi:   c.us_aqi,
      fetchedAt: new Date().toLocaleTimeString(),
    };

    // Update S.env with real AQ values
    S.env.forEach(e => {
      if (e.id === 'aqi')  { e.val = c.european_aqi || c.us_aqi || e.val; e._real = true; }
      if (e.id === 'pm25') { e.val = parseFloat(c.pm2_5?.toFixed(1) || e.val); e._real = true; }
    });

    REAL.loaded.airquality = true;
    console.log(`[UrbanIQ] Real AQI: EU=${c.european_aqi}, US=${c.us_aqi}, PM2.5=${c.pm2_5}`);

    if (S.activeSection === 'environment') renderEnv();
    showToast(`Live air quality: AQI ${c.european_aqi || c.us_aqi}`, 'info');

  } catch(e) {
    console.warn('[UrbanIQ] Air quality fetch failed:', e.message);
  }
}

/* ── WEATHER WIDGET (dashboard) ──────────────── */
function renderWeatherWidget() {
  const el = document.getElementById('weather-widget');
  if (!el || !REAL.weather) return;
  const w = REAL.weather;
  const aq = REAL.airQuality;
  const aqiColor = !aq ? '#6b7280'
    : aq.euAqi <= 20 ? '#16a34a'
    : aq.euAqi <= 40 ? '#22c55e'
    : aq.euAqi <= 60 ? '#f59e0b'
    : aq.euAqi <= 80 ? '#f97316'
    : '#ef4444';
  const aqiLabel = !aq ? 'N/A'
    : aq.euAqi <= 20 ? 'Good'
    : aq.euAqi <= 40 ? 'Fair'
    : aq.euAqi <= 60 ? 'Moderate'
    : aq.euAqi <= 80 ? 'Poor'
    : 'Very Poor';

  el.innerHTML = `
    <div class="weather-widget-inner">
      <div class="wx-main">
        <div class="wx-icon">${weatherEmoji(w.weatherCode)}</div>
        <div class="wx-temp">${w.temp}<span class="wx-unit">°C</span></div>
        <div class="wx-desc">${w.weatherDesc}</div>
        <div class="wx-loc">${REAL.city} &nbsp;•&nbsp; Updated ${w.fetchedAt}</div>
      </div>
      <div class="wx-grid">
        <div class="wx-stat"><span class="wx-stat-val">${w.feelsLike}°C</span><span class="wx-stat-lbl">Feels Like</span></div>
        <div class="wx-stat"><span class="wx-stat-val">${w.humidity}%</span><span class="wx-stat-lbl">Humidity</span></div>
        <div class="wx-stat"><span class="wx-stat-val">${w.windSpeed} km/h</span><span class="wx-stat-lbl">Wind</span></div>
        <div class="wx-stat"><span class="wx-stat-val">${w.rain} mm</span><span class="wx-stat-lbl">Rain</span></div>
        <div class="wx-stat"><span class="wx-stat-val">${w.pressure} hPa</span><span class="wx-stat-lbl">Pressure</span></div>
        <div class="wx-stat"><span class="wx-stat-val">${(w.visibility/1000).toFixed(1)} km</span><span class="wx-stat-lbl">Visibility</span></div>
      </div>
      ${aq ? `
      <div class="aq-strip" style="border-top:1px solid var(--g3);padding-top:12px;margin-top:4px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="font-size:.75rem;font-weight:800;color:var(--text-muted)">LIVE AIR QUALITY</div>
          <span class="tag" style="background:${aqiColor}20;color:${aqiColor};border-color:${aqiColor}40">
            AQI ${aq.euAqi} — ${aqiLabel}
          </span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:.72rem;font-weight:600;color:var(--text-secondary)">
          <span>PM2.5: <strong>${aq.pm25} μg/m³</strong></span>
          <span>PM10: <strong>${aq.pm10} μg/m³</strong></span>
          <span>NO₂: <strong>${aq.no2?.toFixed(1)} μg/m³</strong></span>
          <span>O₃: <strong>${aq.o3?.toFixed(1)} μg/m³</strong></span>
          <span>SO₂: <strong>${aq.so2?.toFixed(1)} μg/m³</strong></span>
        </div>
      </div>` : ''}
      <div class="real-badge">
        ${icon('check','xs-ic')} Live data from Open-Meteo
      </div>
    </div>`;
}

/* ── ENV SECTION: mark real vs simulated ─────── */
const _origRenderEnv = typeof renderEnv === 'function' ? renderEnv : null;
function renderEnvWithReal() {
  // Call original
  if (_origRenderEnv) _origRenderEnv();
  // Overlay real badge on real values
  setTimeout(() => {
    S.env.forEach(e => {
      if (e._real) {
        const card = document.getElementById(`env-${e.id}`);
        if (card) {
          const existing = card.querySelector('.real-data-badge');
          if (!existing) {
            const badge = document.createElement('div');
            badge.className = 'real-data-badge';
            badge.innerHTML = `${icon('check','xs-ic')} Live`;
            badge.title = 'This value is from real Open-Meteo API data';
            card.appendChild(badge);
          }
        }
      }
    });
  }, 50);
}

/* ── PERIODIC REFRESH (every 10 min) ─────────── */
function startRealDataRefresh() {
  setInterval(() => {
    fetchAllRealData();
  }, 10 * 60 * 1000);
}

/* ── WMO WEATHER CODE DESCRIPTIONS ───────────── */
function wmoDescription(code) {
  const codes = {
    0:'Clear Sky', 1:'Mainly Clear', 2:'Partly Cloudy', 3:'Overcast',
    45:'Foggy', 48:'Icy Fog',
    51:'Light Drizzle', 53:'Moderate Drizzle', 55:'Dense Drizzle',
    61:'Slight Rain', 63:'Moderate Rain', 65:'Heavy Rain',
    71:'Slight Snow', 73:'Moderate Snow', 75:'Heavy Snow',
    77:'Snow Grains', 80:'Slight Showers', 81:'Moderate Showers', 82:'Violent Showers',
    85:'Slight Snow Showers', 86:'Heavy Snow Showers',
    95:'Thunderstorm', 96:'Thunderstorm w/ Hail', 99:'Thunderstorm w/ Heavy Hail',
  };
  return codes[code] || `Code ${code}`;
}

function weatherEmoji(code) {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2 || code === 3) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '⛈️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

/* ── UPDATE LOCATION LABEL IN UI ─────────────── */
function updateLocationLabel() {
  const el = document.getElementById('location-label');
  if (el) el.textContent = `${REAL.city} (${REAL.lat.toFixed(2)}°N, ${REAL.lon.toFixed(2)}°E)`;
}

/* ── INIT ─────────────────────────────────────── */
function initRealData() {
  initGeolocation();
  startRealDataRefresh();
}
