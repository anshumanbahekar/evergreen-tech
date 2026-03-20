// ===== STATE =====
const S = {
  vehicles: [], buses: [], trafficLights: [], parkingLots: [], alerts: [],
  envData: {}, twinVehicles: [], avFleet: [], drones: [],
  voiceActive: false, mapZoom: 1, twinMode: 'normal',
  reports: [], carpoolMatches: [], tickets: [],
  layers: { vehicles: true, buses: true, incidents: true },
  scores: { daily: 87, co2: 12.4, fuel: 8.2 },
  darkMode: false,
};

// ===== UTILS =====
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const RF = (a, b) => +(Math.random() * (b - a) + a).toFixed(1);
const C = arr => arr[R(0, arr.length - 1)];

const ROADS = ['Main Street', 'Park Avenue', 'Oak Boulevard', 'Tech Parkway', 'Harbor Road', 'Central Drive', 'Ring Road', 'Airport Expressway', 'North Highway', 'Coastal Drive'];
const AREAS = ['Downtown', 'Midtown', 'North District', 'East Quarter', 'Tech Park', 'Harbor Area', 'Suburb West', 'Airport Zone', 'Old Town', 'New City'];

// ===== DATA GENERATORS =====
function generateVehicles(n = 65) {
  S.vehicles = Array.from({ length: n }, (_, i) => ({
    id: i, x: R(3, 97), y: R(3, 97),
    dx: RF(-0.35, 0.35), dy: RF(-0.25, 0.25),
    type: C(['car','car','car','car','bus','emergency']),
    speed: R(20, 95)
  }));
}

function generateBuses() {
  const routes = [
    { num: '101', from: 'Central Station', to: 'Airport T2', stops: 12 },
    { num: '205', from: 'Harbor', to: 'Tech Park', stops: 8 },
    { num: '310', from: 'Old Town', to: 'University', stops: 15 },
    { num: '412', from: 'City Mall', to: 'Hospital', stops: 7 },
    { num: '520', from: 'Stadium', to: 'Downtown', stops: 10 },
    { num: '618', from: 'North Gate', to: 'South Bay', stops: 11 },
    { num: '724', from: 'Tech Park', to: 'Airport', stops: 9 },
  ];
  S.buses = routes.map((r, i) => ({
    ...r, id: i, eta: R(1, 14), occupancy: R(10, 95),
    delay: R(-2, 9), seats: R(20, 50), capacity: 50
  }));
}

function generateTrafficLights() {
  const intersections = ['Main/1st Ave', 'Park/Oak', 'Tech/Ring', 'Harbor/Blvd', 'Airport/Pkwy', 'Central/Ave', 'North/2nd', 'East/3rd', 'Market/4th', 'Stadium/5th', 'Mall/Drive', 'Bridge/St'];
  S.trafficLights = intersections.map((name, i) => ({
    id: i, name, phase: C(['red', 'green', 'yellow']),
    timer: R(5, 58), mode: C(['normal', 'ai', 'pedestrian', 'emergency']),
    waiting: R(0, 28)
  }));
}

function generateParking() {
  const lots = ['City Center P1', 'Mall Garage', 'Tech Park P2', 'Harbor Lot A', 'Airport P3', 'Central Park', 'Stadium Lot', 'Hospital P4', 'Old Town Sq', 'North Plaza', 'South Bay P5', 'East Market'];
  S.parkingLots = lots.map((name, i) => ({
    id: i, name, total: R(100, 480),
    available: R(0, 95), price: RF(20, 80),
    ev: C([true, false, false]), underground: C([true, false]),
    reserved: R(0, 20)
  }));
}

function generateAlerts() {
  S.alerts = [
    { t: 'critical', type: 'flame', title: 'Major Accident', desc: 'Multi-vehicle collision on Highway 5, 2 lanes blocked', time: '3m ago', id: 1 },
    { t: 'warning', type: 'alert', title: 'Heavy Congestion', desc: 'Peak traffic on Main Street — 45 min delay expected', time: '8m ago', id: 2 },
    { t: 'info', type: 'construction', title: 'Construction Zone', desc: 'Road works on Park Avenue until 18:00', time: '15m ago', id: 3 },
    { t: 'warning', type: 'droplets', title: 'Weather Alert', desc: 'Heavy rain forecast affecting visibility on Ring Road', time: '22m ago', id: 4 },
    { t: 'critical', type: 'alert', title: 'Road Closure', desc: 'Bridge Road closed due to emergency maintenance', time: '28m ago', id: 5 },
    { t: 'info', type: 'users', title: 'Event Traffic', desc: 'Stadium event tonight — expect delays 6–9 PM', time: '35m ago', id: 6 },
    { t: 'success', type: 'check', title: 'Incident Cleared', desc: 'Harbor Road reopened — traffic flow restored', time: '42m ago', id: 7 },
    { t: 'warning', type: 'road', title: 'Pothole Alert', desc: 'Large pothole reported on Oak Boulevard', time: '1h ago', id: 8 },
  ];
}

function generateEnv() {
  S.envData = {
    aqi: { value: R(40, 150), unit: 'AQI', name: 'Air Quality' },
    noise: { value: R(45, 82), unit: 'dB', name: 'Noise Level' },
    temp: { value: R(22, 38), unit: '°C', name: 'Temperature' },
    humidity: { value: R(32, 88), unit: '%', name: 'Humidity' },
    wind: { value: R(5, 38), unit: 'km/h', name: 'Wind Speed' },
    pm25: { value: RF(10, 78), unit: 'μg/m³', name: 'PM2.5' },
    co2: { value: R(380, 590), unit: 'ppm', name: 'CO₂ Level' },
    uhi: { value: RF(1, 5), unit: '°C', name: 'Urban Heat' },
  };
}

function initAllData() {
  generateVehicles();
  generateBuses();
  generateTrafficLights();
  generateParking();
  generateAlerts();
  generateEnv();
}
