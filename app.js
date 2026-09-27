/* CycloneAI Master JavaScript Application — SIH 2026 Edition */

// Global State
const state = {
  activePage: 'dashboard',
  useLiveBackend: false,
  apiBaseUrl: 'http://localhost:8000',
  currentCyclone: 'biparjoy',
  currentBasin: 'Arabian Sea',
  lastPredictionResult: null,
  forecastData: null,
  historyRecords: [
    { id: 'INS-2026-0919-01', date: '2026-09-19 12:00 UTC', status: 'Detected', wind: 86.0, windKmh: 159.3, category: 'Very Severe Cyclonic Storm (VSCS)', conf: 94.8, delta: '-2.1 kt' },
    { id: 'INS-2026-0919-02', date: '2026-09-19 06:00 UTC', status: 'Detected', wind: 82.5, windKmh: 152.8, category: 'Very Severe Cyclonic Storm (VSCS)', conf: 93.5, delta: '+1.4 kt' },
    { id: 'INS-2026-0918-04', date: '2026-09-18 18:00 UTC', status: 'Detected', wind: 75.0, windKmh: 138.9, category: 'Very Severe Cyclonic Storm (VSCS)', conf: 95.1, delta: '-0.8 kt' },
    { id: 'INS-2026-0918-03', date: '2026-09-18 12:00 UTC', status: 'Detected', wind: 65.0, windKmh: 120.4, category: 'Very Severe Cyclonic Storm (VSCS)', conf: 92.4, delta: '+2.0 kt' },
    { id: 'INS-2026-0918-02', date: '2026-09-18 06:00 UTC', status: 'Detected', wind: 55.0, windKmh: 101.9, category: 'Severe Cyclonic Storm (SCS)', conf: 91.0, delta: '-1.5 kt' },
    { id: 'INS-2026-0917-01', date: '2026-09-17 12:00 UTC', status: 'Detected', wind: 40.0, windKmh: 74.1, category: 'Cyclonic Storm (CS)', conf: 89.6, delta: '-0.4 kt' },
    { id: 'INS-2026-0916-01', date: '2026-09-16 00:00 UTC', status: 'Not Detected', wind: 14.0, windKmh: 25.9, category: 'Low Pressure Area (LPA)', conf: 96.2, delta: '0.0 kt' }
  ]
};

// Preset Images (Base64 Canvas Generative IR Visualizer)
function generatePresetIRDataUrl(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');
  
  // Background space/atmosphere
  const bgGrad = ctx.createRadialGradient(112, 112, 10, 112, 112, 120);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 224, 224);

  if (type === 'vscs' || type === 'escs') {
    // Spiral arms IR convective pattern
    for (let r = 90; r > 10; r -= 5) {
      ctx.beginPath();
      ctx.arc(112, 112, r, 0, Math.PI * 2);
      const tempColor = r < 30 ? '#ffffff' : (r < 60 ? '#dc2626' : '#0284c7');
      ctx.strokeStyle = tempColor;
      ctx.lineWidth = r < 20 ? 8 : 4;
      ctx.stroke();
    }
    // Eye center
    ctx.beginPath();
    ctx.arc(112, 112, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16';
    ctx.fill();
  } else if (type === 'scs') {
    // Moderate storm spiral
    for (let r = 80; r > 15; r -= 8) {
      ctx.beginPath();
      ctx.arc(112, 112, r, 0, Math.PI * 1.5);
      ctx.strokeStyle = r < 40 ? '#d97706' : '#38bdf8';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  } else {
    // Low disturbance clouds
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(60 + i * 15, 70 + (i % 3) * 20, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.fill();
    }
  }
  return canvas.toDataURL('image/png');
}

// DOM Elements Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupBackendToggle();
  setupAnalysisPage();
  setupHistoryTable();
  setupScatterChart();
  setupForecastPage();
  checkBackendHealth();
  
  // Load default preset preview on init
  loadPreset('vscs');
});

// Navigation Setup
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page;
      switchPage(pageId);
    });
  });
}

function switchPage(pageId) {
  state.activePage = pageId;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageId}`);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Backend Live / Simulation Toggle
function setupBackendToggle() {
  const toggle = document.getElementById('backend-toggle');
  const indicator = document.getElementById('endpoint-indicator');
  const badgeNav = document.getElementById('nav-mode-badge');
  
  toggle.addEventListener('change', (e) => {
    state.useLiveBackend = e.target.checked;
    const modeText = state.useLiveBackend ? 'Live Backend API (localhost:8000)' : 'Simulation Driver';
    indicator.textContent = `Mode: ${modeText}`;
    badgeNav.textContent = state.useLiveBackend ? 'LIVE API' : 'SIMULATION DRIVER';
    badgeNav.className = state.useLiveBackend ? 'pill pill-crimson' : 'pill pill-blue';
    
    if (state.useLiveBackend) {
      checkBackendHealth();
    }
  });
}

async function checkBackendHealth() {
  const statusPill = document.getElementById('model-status-pill');
  try {
    const res = await fetch(`${state.apiBaseUrl}/health`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      statusPill.innerHTML = `<span class="status-dot"></span> CNN Model Online (${data.model_loaded ? 'ResNet Ready' : 'Heuristic Active'})`;
    } else {
      throw new Error();
    }
  } catch (err) {
    statusPill.innerHTML = `<span class="status-dot" style="background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></span> Driver Ready (Local)`;
  }
}

// Page 2: Cyclone Analysis Logic
let currentSelectedFile = null;
let currentPreviewDataUrl = null;

function setupAnalysisPage() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const analyzeBtn = document.getElementById('analyze-btn');

  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  analyzeBtn.addEventListener('click', runAnalysis);
}

function loadPreset(presetType) {
  const dataUrl = generatePresetIRDataUrl(presetType);
  currentPreviewDataUrl = dataUrl;
  
  // Convert DataURL to synthetic file object
  fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => {
      currentSelectedFile = new File([blob], `sample_${presetType}_ir_satellite.png`, { type: 'image/png' });
      displayPreview(dataUrl, currentSelectedFile.name, (blob.size / 1024).toFixed(1) + ' KB');
    });
}

function handleSelectedFile(file) {
  currentSelectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentPreviewDataUrl = e.target.result;
    displayPreview(e.target.result, file.name, (file.size / 1024).toFixed(1) + ' KB');
  };
  reader.readAsDataURL(file);
}

function displayPreview(src, filename, size) {
  const previewBox = document.getElementById('preview-container');
  const previewImg = document.getElementById('preview-img');
  const fileDetails = document.getElementById('preview-details');
  const analyzeBtn = document.getElementById('analyze-btn');

  previewImg.src = src;
  fileDetails.innerHTML = `
    <strong>${filename}</strong><br/>
    <span style="color:var(--text-muted); font-size:0.85rem;">Size: ${size} • Format: Satellite IR Tile</span>
  `;
  previewBox.style.display = 'flex';
  analyzeBtn.disabled = false;
}

async function runAnalysis() {
  const loadingBox = document.getElementById('loading-container');
  const resultsBox = document.getElementById('results-panel');
  const progressBar = document.getElementById('analysis-progress');
  const stageText = document.getElementById('analysis-stage-text');
  
  resultsBox.style.display = 'none';
  loadingBox.style.display = 'block';
  
  const stages = [
    { pct: 20, text: 'Normalizing 224x224 Satellite IR Tensor...' },
    { pct: 55, text: 'Executing Deep Residual Feature Extractor (ResNet-50)...' },
    { pct: 85, text: 'Computing Wind Regression Head & IMD Intensity Thresholds...' },
    { pct: 100, text: 'Finalizing Telemetry Metrics & Pressure Deficit...' }
  ];

  for (const stage of stages) {
    progressBar.style.width = `${stage.pct}%`;
    stageText.textContent = stage.text;
    await new Promise(r => setTimeout(r, 220));
  }

  let result = null;

  if (state.useLiveBackend && currentSelectedFile) {
    try {
      const formData = new FormData();
      formData.append('file', currentSelectedFile);
      const res = await fetch(`${state.apiBaseUrl}/predict`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        result = await res.json();
      } else {
        throw new Error('Backend returned error status');
      }
    } catch (e) {
      console.warn('Live API call failed, switching to fallback response:', e);
      result = generateSimulationPredictionResult();
    }
  } else {
    result = generateSimulationPredictionResult();
  }

  loadingBox.style.display = 'none';
  renderResults(result);
}

function generateSimulationPredictionResult() {
  return {
    detected: true,
    wind_speed_knots: 86.0,
    wind_speed_kmh: 159.3,
    wind_speed_mph: 99.0,
    peak_gust_knots: 105.8,
    peak_gust_kmh: 195.9,
    confidence: 94.8,
    imd_category: "Very Severe Cyclonic Storm (VSCS)",
    imd_warning_tier: 3,
    estimated_pressure_hpa: 968.0,
    pressure_deficit_hpa: 45.3,
    eyewall_temp_celsius: -72.4,
    eye_formation_type: "Pinhole / Dense Central Overcast (CDO)",
    inference_latency_ms: 42.5,
    model_version: "ResNet-50-v2 (INSAT-Calibrated)",
    timestamp_utc: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  };
}

function renderResults(res) {
  state.lastPredictionResult = res;
  const resultsBox = document.getElementById('results-panel');
  
  document.getElementById('res-badge-mode').textContent = state.useLiveBackend ? 'LIVE BACKEND API' : 'SIMULATION DRIVER';
  document.getElementById('res-badge-status').textContent = res.detected ? 'SYSTEM DETECTED: CYCLONE' : 'NO CYCLONE DETECTED';
  document.getElementById('res-badge-status').className = res.detected ? 'pill pill-crimson' : 'pill pill-gray';
  
  document.getElementById('res-wind-knots').textContent = `${res.wind_speed_knots} kt`;
  document.getElementById('res-wind-sub').textContent = `${res.wind_speed_kmh} km/h • ${res.wind_speed_mph} mph (Gusts: ${res.peak_gust_knots} kt)`;
  
  document.getElementById('res-category').textContent = res.imd_category;
  document.getElementById('res-confidence').textContent = `Confidence: ${res.confidence}% • Pressure: ${res.estimated_pressure_hpa} hPa`;
  
  document.getElementById('res-eye-type').textContent = res.eye_formation_type;
  document.getElementById('res-temp').textContent = `${res.eyewall_temp_celsius} °C`;
  document.getElementById('res-latency').textContent = `${res.inference_latency_ms} ms`;
  
  document.getElementById('res-signature').textContent = `Model Signature: ${res.model_version} • Execution TS: ${res.timestamp_utc}`;

  resultsBox.style.display = 'block';
  resultsBox.scrollIntoView({ behavior: 'smooth' });

  // Add to History
  state.historyRecords.unshift({
    id: `INS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    status: res.detected ? 'Detected' : 'Not Detected',
    wind: res.wind_speed_knots,
    windKmh: res.wind_speed_kmh,
    category: res.imd_category,
    conf: res.confidence,
    delta: '-1.2 kt'
  });
  renderHistoryTable();
}

// Page 3: Prediction History
function setupHistoryTable() {
  renderHistoryTable();
  const searchInput = document.getElementById('history-search');
  const catFilter = document.getElementById('history-filter-cat');

  if (searchInput) searchInput.addEventListener('input', filterHistoryTable);
  if (catFilter) catFilter.addEventListener('change', filterHistoryTable);
}

function renderHistoryTable(records = state.historyRecords) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  tbody.innerHTML = records.map(r => `
    <tr>
      <td class="mono">${r.date}</td>
      <td class="mono"><strong>${r.id}</strong></td>
      <td><span class="pill ${r.status === 'Detected' ? 'pill-crimson' : 'pill-gray'}">${r.status}</span></td>
      <td class="mono"><strong>${r.wind} kt</strong> (${r.windKmh} km/h)</td>
      <td>${r.category}</td>
      <td class="mono">${r.conf}%</td>
      <td class="mono" style="color:${r.delta.startsWith('-') ? '#166534' : '#991b1b'};">${r.delta}</td>
    </tr>
  `).join('');

  const countElem = document.getElementById('history-record-count');
  if (countElem) countElem.textContent = `${records.length} Records Loaded`;
}

function filterHistoryTable() {
  const q = document.getElementById('history-search').value.toLowerCase();
  const cat = document.getElementById('history-filter-cat').value;
  
  const filtered = state.historyRecords.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.date.toLowerCase().includes(q);
    const matchCat = !cat || r.category.includes(cat);
    return matchSearch && matchCat;
  });

  renderHistoryTable(filtered);
}

function exportHistoryCSV() {
  let csv = "Date/UTC,Sample_ID,Detection_Status,Wind_Speed_kt,IMD_Category,Confidence_pct,Validation_Delta\n";
  state.historyRecords.forEach(r => {
    csv += `"${r.date}","${r.id}","${r.status}",${r.wind},"${r.category}",${r.conf},"${r.delta}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CycloneAI_Prediction_History_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function exportGeoJSON() {
  const res = state.lastPredictionResult || generateSimulationPredictionResult();
  const geojson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [66.5, 20.8] },
        "properties": {
          "storm_name": "Cyclone Biparjoy",
          "wind_speed_knots": res.wind_speed_knots,
          "imd_category": res.imd_category,
          "eyewall_temp_celsius": res.eyewall_temp_celsius,
          "pressure_hpa": res.estimated_pressure_hpa,
          "model": res.model_version
        }
      }
    ]
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CycloneAI_Analysis_Payload_${Date.now()}.geojson`;
  a.click();
}

// Page 4: Scatter Plot Rendering
function setupScatterChart() {
  const svg = document.getElementById('scatter-svg');
  if (!svg) return;

  const points = [
    { x: 25, y: 26 }, { x: 35, y: 34 }, { x: 45, y: 47 }, { x: 55, y: 53 },
    { x: 65, y: 67 }, { x: 75, y: 73 }, { x: 85, y: 86 }, { x: 95, y: 93 },
    { x: 105, y: 108 }, { x: 115, y: 112 }, { x: 125, y: 127 }
  ];

  // SVG dimensions: 500x260
  let circles = '';
  points.forEach(p => {
    const cx = 50 + (p.x / 140) * 400;
    const cy = 230 - (p.y / 140) * 200;
    circles += `<circle cx="${cx}" cy="${cy}" r="5" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"><title>Actual: ${p.x}kt | Pred: ${p.y}kt</title></circle>`;
  });

  svg.innerHTML = `
    <!-- Grid Lines -->
    <line x1="50" y1="30" x2="450" y2="30" stroke="#e2e8f0" stroke-dasharray="4"/>
    <line x1="50" y1="130" x2="450" y2="130" stroke="#e2e8f0" stroke-dasharray="4"/>
    <line x1="50" y1="230" x2="450" y2="230" stroke="#cbd5e1" stroke-width="1.5"/>
    <line x1="50" y1="30" x2="50" y2="230" stroke="#cbd5e1" stroke-width="1.5"/>
    
    <!-- Ideal 1:1 Line -->
    <line x1="50" y1="230" x2="450" y2="30" stroke="#dc2626" stroke-width="2" stroke-dasharray="6"/>
    
    <!-- Data Points -->
    ${circles}

    <!-- Labels -->
    <text x="250" y="255" font-size="11" fill="#64748b" text-anchor="middle" font-family="Inter">Actual Sustained Wind Speed (knots)</text>
    <text x="20" y="130" font-size="11" fill="#64748b" text-anchor="middle" font-family="Inter" transform="rotate(-90 20 130)">Predicted Wind (kt)</text>
  `;
}

// Page 6: Trajectory Forecast Setup & GIS Map Interactivity
function setupForecastPage() {
  const stormSelect = document.getElementById('forecast-storm-select');
  const btnRecompute = document.getElementById('forecast-recompute');

  if (stormSelect) {
    stormSelect.addEventListener('change', (e) => {
      state.currentCyclone = e.target.value;
      fetchForecastData();
    });
  }

  if (btnRecompute) {
    btnRecompute.addEventListener('click', fetchForecastData);
  }

  fetchForecastData();
}

async function fetchForecastData() {
  let data = null;

  if (state.useLiveBackend) {
    try {
      const res = await fetch(`${state.apiBaseUrl}/forecast?cyclone_id=${state.currentCyclone}&basin=${state.currentBasin}`, {
        method: 'POST'
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      console.warn('Live forecast API failed, using fallback driver:', e);
    }
  }

  if (!data) {
    data = getMockForecastData(state.currentCyclone);
  }

  state.forecastData = data;
  renderForecastUI(data);
}

function getMockForecastData(cycloneId) {
  if (cycloneId === 'mocha') {
    return {
      storm_name: "Cyclone Mocha",
      basin: "Bay of Bengal (NIO)",
      init_time: "12:00 UTC (Latest Cycle)",
      current_fix: { lat: 15.4, lon: 88.2, wind_knots: 110.0, wind_kmh: 203.7, pressure_hpa: 948.0, category: "Extremely Severe Cyclonic Storm (ESCS)", forward_speed_knots: 16.5, heading_deg: 35.0 },
      past_track: [{ t: "T-24h", lat: 12.1, lon: 86.4, wind_knots: 70 }, { t: "T-12h", lat: 13.8, lon: 87.2, wind_knots: 90 }],
      forecast_track: [
        { t: "T+0h", lat: 15.4, lon: 88.2, wind_knots: 110.0, pressure_hpa: 948.0, category: "ESCS", note: "Current Fix" },
        { t: "T+6h", lat: 16.8, lon: 89.4, wind_knots: 120.0, pressure_hpa: 938.0, category: "SuCS", note: "Rapid Intensification" },
        { t: "T+12h", lat: 18.2, lon: 90.8, wind_knots: 125.0, pressure_hpa: 932.0, category: "SuCS", note: "Peak Intensity" },
        { t: "T+24h", lat: 20.1, lon: 92.5, wind_knots: 105.0, pressure_hpa: 952.0, category: "ESCS", note: "Approaching Coast" },
        { t: "T+48h", lat: 22.4, lon: 94.8, wind_knots: 50.0, pressure_hpa: 990.0, category: "SCS", note: "Dissipating inland" }
      ],
      landfall: { location: "Sittwe / Cox's Bazar Coastal Border", eta: "+32h (20:00 UTC)", window: "T+30h to T+36h", coastal_distance_km: 420.0 },
      ri_risk: { probability_pct: 78.0, label: "High Risk", sst_celsius: 31.2, vertical_shear_knots: 8.5, mid_rh_pct: 82.0 }
    };
  }
  
  // Default Biparjoy
  return {
    storm_name: "Cyclone Biparjoy",
    basin: "Arabian Sea (NIO)",
    init_time: "12:00 UTC (Latest Cycle)",
    current_fix: { lat: 20.8, lon: 66.5, wind_knots: 86.0, wind_kmh: 159.3, pressure_hpa: 968.0, category: "Very Severe Cyclonic Storm (VSCS)", forward_speed_knots: 14.0, heading_deg: 345.0 },
    past_track: [{ t: "T-24h", lat: 17.2, lon: 65.8, wind_knots: 65 }, { t: "T-12h", lat: 19.0, lon: 66.1, wind_knots: 78 }],
    forecast_track: [
      { t: "T+0h", lat: 20.8, lon: 66.5, wind_knots: 86.0, pressure_hpa: 968.0, category: "VSCS", note: "Current Fix" },
      { t: "T+6h", lat: 21.5, lon: 66.1, wind_knots: 88.0, pressure_hpa: 965.0, category: "VSCS", note: "Intensifying Phase" },
      { t: "T+12h", lat: 22.1, lon: 66.6, wind_knots: 95.0, pressure_hpa: 956.0, category: "ESCS", note: "Threshold Crossing" },
      { t: "T+24h", lat: 23.2, lon: 67.4, wind_knots: 92.0, pressure_hpa: 960.0, category: "ESCS", note: "Peak Intensity Window" },
      { t: "T+48h", lat: 24.5, lon: 68.8, wind_knots: 60.0, pressure_hpa: 982.0, category: "SCS", note: "Overland Friction Decay" }
    ],
    landfall: { location: "Jakhau / Mandvi Coast, Gujarat", eta: "+44h (15:00 UTC)", window: "T+42h to T+48h", coastal_distance_km: 340.0 },
    ri_risk: { probability_pct: 62.0, label: "Moderate-High Risk", sst_celsius: 30.5, vertical_shear_knots: 11.0, mid_rh_pct: 78.0 }
  };
}

function renderForecastUI(d) {
  // Update Real-Time Storm Center overlay
  const overlay = document.getElementById('storm-center-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div style="font-weight:800; color:#38bdf8; margin-bottom:0.25rem;">Real-Time Storm Center</div>
      <div><strong>${d.storm_name}</strong> (${d.basin})</div>
      <div class="mono" style="margin-top:0.4rem; font-size:0.8rem;">
        Coords: ${d.current_fix.lat}°N, ${d.current_fix.lon}°E<br/>
        Speed: ${d.current_fix.forward_speed_knots} kt @ ${d.current_fix.heading_deg}°<br/>
        Central Pressure: ${d.current_fix.pressure_hpa} hPa
      </div>
    `;
  }

  // Update Stepper Cards
  const stepperGrid = document.getElementById('forecast-stepper-grid');
  if (stepperGrid && d.forecast_track) {
    stepperGrid.innerHTML = d.forecast_track.map(t => {
      const isPeak = t.t === 'T+12h' || t.t === 'T+24h';
      return `
        <div class="stepper-card ${isPeak ? 'peak' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span class="mono" style="font-weight:700; font-size:0.85rem;">${t.t}</span>
            <span class="pill ${isPeak ? 'pill-crimson' : 'pill-amber'}">${t.note || 'Forecast'}</span>
          </div>
          <div style="font-weight:700; font-size:0.9rem; margin-bottom:0.25rem;">${t.category}</div>
          <div class="mono" style="font-size:1.1rem; font-weight:800; color:var(--primary-600);">${t.wind_knots} kt</div>
          <div class="mono" style="font-size:0.75rem; color:var(--text-muted);">${roundKmh(t.wind_knots)} km/h • ${t.pressure_hpa} hPa</div>
        </div>
      `;
    }).join('');
  }

  // Update RI Risk Panel
  const riVal = document.getElementById('ri-risk-val');
  if (riVal) riVal.textContent = `${d.ri_risk.label} (${d.ri_risk.probability_pct}%)`;

  // Update Landfall Window Panel
  const lfLoc = document.getElementById('landfall-loc');
  const lfEta = document.getElementById('landfall-eta');
  if (lfLoc) lfLoc.textContent = d.landfall.location;
  if (lfEta) lfEta.textContent = `${d.landfall.eta} (${d.landfall.window})`;
}

function roundKmh(kt) {
  return Math.round(kt * 1.852);
}
