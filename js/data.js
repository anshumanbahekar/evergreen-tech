/* UrbanIQ — data.js: unified state & generators */

const R  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const RF = (a, b) => parseFloat((Math.random() * (b - a) + a).toFixed(1));
const C  = arr   => arr[Math.floor(Math.random() * arr.length)];

const ROADS = ['Main Street','Park Avenue','Oak Boulevard','Tech Parkway','Harbor Road','Central Drive','Ring Road','Airport Expressway','North Highway','Coastal Drive'];
const AREAS = ['Downtown','Midtown','North District','East Quarter','Tech Park','Harbor Area','Suburb West','Airport Zone','Old Town','New City'];
const NAMES = ['Amit K.','Priya S.','Ravi M.','Sunita P.','Deepak R.','Anita V.','Kiran T.','Neha B.','Suresh C.','Meera J.'];

const S = {
  vehicles: [], buses: [], trafficLights: [], parking: [], alerts: [],
  env: [], carpools: [], avFleet: [], drones: [], logistics: [], tolls: [],
  citizenReports: [], reportPins: [],
  activeSection: 'dashboard', mapRunning: true,
  voiceActive: false, sosArmed: false, twinMode: 'Normal', darkMode: false,
};

function generateVehicles(n=70){
  S.vehicles = Array.from({length:n},(_,i)=>({
    id:i, x:RF(2,98), y:RF(2,98),
    dx:(RF(-0.4,0.4)||0.15), dy:(RF(-0.3,0.3)||0.1),
    type:C(['car','car','car','car','car','bus','bus','emergency']),
    speed:R(20,90),
    plate:`MH-${R(10,99)}-${String.fromCharCode(R(65,90))}${String.fromCharCode(R(65,90))}-${R(1000,9999)}`
  }));
}

function generateBuses(){
  const routes=[
    {num:'101',from:'Central Station',to:'Airport T2'},
    {num:'205',from:'Harbor',to:'Tech Park'},
    {num:'310',from:'Old Town',to:'University'},
    {num:'412',from:'City Mall',to:'Hospital'},
    {num:'520',from:'Stadium',to:'Downtown'},
    {num:'618',from:'North Gate',to:'South Bay'},
    {num:'724',from:'Tech Park',to:'Airport'},
    {num:'830',from:'East Quarter',to:'West End'},
  ];
  S.buses=routes.map((r,i)=>({
    id:i, route:`Route ${r.num}`, ...r,
    eta:R(1,18), occupancy:R(10,98),
    delay:R(0,3)===0?0:R(2,12),
    seats:R(8,45), capacity:50, dismissed:false
  }));
}

function generateTrafficLights(){
  const names=['Main St/1st Ave','Park/Oak Blvd','Tech/Ring Rd','Harbor/Blvd',
    'Airport/Pkwy','Central/Ave','North/2nd','East/3rd',
    'Market/4th','Stadium/5th','Mall/Drive','Bridge/St'];
  S.trafficLights=names.map((name,i)=>({
    id:i,name,phase:C(['red','green','yellow']),
    timer:R(5,55),mode:C(['AI Adaptive','AI Adaptive','Fixed','Pedestrian','Emergency']),
    waiting:R(0,25)
  }));
}

function generateParking(){
  const lots=['City Center P1','Mall Garage','Tech Park P2','Harbor Lot A',
    'Airport P3','Central Park','Stadium Lot','Hospital P4',
    'Old Town Sq','North Plaza','South Bay P5','East Market'];
  S.parking=lots.map((name,i)=>{
    const total=R(100,450), free=R(0,total);
    return {id:i,name,total,free,price:RF(20,80),ev:C([true,false,false]),underground:C([true,false])};
  });
}

function generateAlerts(){
  S.alerts=[
    {id:1,sev:'critical',ic:'flame',       title:'Major Accident',    msg:'Multi-vehicle collision on Highway 5, 2 lanes blocked',   time:'3m ago', dismissed:false},
    {id:2,sev:'warning', ic:'alert',       title:'Heavy Congestion',  msg:'Peak traffic on Main Street — 45 min delay expected',    time:'8m ago', dismissed:false},
    {id:3,sev:'info',    ic:'construction',title:'Construction Zone', msg:'Road works on Park Avenue until 18:00',                   time:'15m ago',dismissed:false},
    {id:4,sev:'warning', ic:'droplets',    title:'Weather Alert',     msg:'Heavy rain forecast affecting Ring Road visibility',      time:'22m ago',dismissed:false},
    {id:5,sev:'critical',ic:'alert',       title:'Road Closure',      msg:'Bridge Road closed due to emergency maintenance',         time:'28m ago',dismissed:false},
    {id:6,sev:'info',    ic:'users',       title:'Event Traffic',     msg:'Stadium event tonight — expect delays 6–9 PM',            time:'35m ago',dismissed:false},
    {id:7,sev:'success', ic:'check',       title:'Incident Cleared',  msg:'Harbor Road reopened — traffic flow restored',            time:'42m ago',dismissed:false},
    {id:8,sev:'warning', ic:'road',        title:'Pothole Alert',     msg:'Large pothole reported on Oak Boulevard',                 time:'1h ago', dismissed:false},
  ];
}

function generateEnv(){
  S.env=[
    {id:'aqi',  label:'Air Quality', val:R(40,150), min:0,   max:300, warn:100, unit:'AQI',   ic:'leaf'},
    {id:'noise',label:'Noise Level', val:R(45,82),  min:0,   max:120, warn:70,  unit:'dB',    ic:'activity'},
    {id:'temp', label:'Temperature', val:R(22,38),  min:0,   max:50,  warn:40,  unit:'°C',    ic:'thermometer'},
    {id:'humid',label:'Humidity',    val:R(32,88),  min:0,   max:100, warn:80,  unit:'%',     ic:'droplets'},
    {id:'wind', label:'Wind Speed',  val:R(5,38),   min:0,   max:80,  warn:50,  unit:'km/h',  ic:'wind'},
    {id:'pm25', label:'PM 2.5',      val:RF(10,78), min:0,   max:150, warn:55,  unit:'μg/m³', ic:'leaf'},
    {id:'co2',  label:'CO₂ Level',   val:R(380,590),min:300, max:800, warn:500, unit:'ppm',   ic:'recycle'},
    {id:'uhi',  label:'Urban Heat',  val:RF(1,5),   min:0,   max:10,  warn:4,   unit:'°C',    ic:'thermometer'},
  ];
}

function generateCarpools(){
  S.carpools=Array.from({length:8},(_,i)=>({
    id:i+1, name:C(NAMES), from:C(AREAS), to:C(AREAS),
    time:`${R(6,9)}:${['00','15','30','45'][R(0,3)]} AM`,
    seats:R(1,3), price:R(30,120), rating:RF(3.5,5.0)
  }));
}

function generateAVFleet(){
  S.avFleet=Array.from({length:8},(_,i)=>({
    id:`AV-${100+i}`, status:C(['Active','Active','Active','Charging','Standby']),
    battery:R(18,99), trips:R(4,28), zone:C(AREAS), km:R(80,420)
  }));
}

function generateDrones(){
  S.drones=Array.from({length:6},(_,i)=>({
    id:`DR-${200+i}`, mission:C(['Delivery','Surveillance','Emergency','Inspection','Mapping']),
    altitude:R(50,200), battery:R(25,98), eta:R(2,25),
    status:C(['In Flight','In Flight','Charging','Standby'])
  }));
}

function generateLogistics(){
  S.logistics=Array.from({length:6},(_,i)=>({
    id:`TRK-${300+i}`, cargo:C(['Electronics','Food','Medicine','Fuel','Packages','Textiles']),
    status:C(['En Route','En Route','Loading','Unloading','Waiting']),
    eta:R(10,180), weight:R(2,22), from:C(AREAS), to:C(AREAS)
  }));
}

function generateTolls(){
  S.tolls=ROADS.map((road,i)=>({
    id:i, road, rate:R(20,80), vehicles:R(200,900),
    revenue:R(5000,50000), fastag:R(60,98)
  }));
}

function initAllData(){
  generateVehicles(); generateBuses(); generateTrafficLights();
  generateParking(); generateAlerts(); generateEnv();
  generateCarpools(); generateAVFleet(); generateDrones();
  generateLogistics(); generateTolls();
}
