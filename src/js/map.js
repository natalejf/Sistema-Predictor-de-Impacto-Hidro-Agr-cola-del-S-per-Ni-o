/**
 * AURA-NIÑO AGRO 2026 - GEOSPATIAL MAP CONTROLLER
 * Renderizado de capas cartográficas con Leaflet: Relieve, Cuencas,
 * Polígonos de Riesgo Dinámico y Marcadores Agropecuarios.
 */

import L from 'leaflet';
import { KEY_LOCATIONS } from './api.js';
import { calculateAgroPrediction, calculatePointPrediction } from './simulation.js';

let mapInstance = null;
let currentBasemap = null;
let satelliteBasemap = null;
let regionsLayerGroup = null;
let basinsLayerGroup = null;
let reliefLayerGroup = null;
let markersLayerGroup = null;
let probeMarker = null;

let onPointSelectedCallback = null;

// Cartografía base con API Key oficial de CARTO
const CARTO_API_KEY = 'cb1_4t35_1_088aa67124f70f9d382d1599';
const BASEMAP_DARK = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const BASEMAP_VOYAGER = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const BASEMAP_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Geometría aproximada de las cuencas y regiones agropecuarias argentinas
const REGION_BOUNDARIES = [
  {
    id: 'sudeste_ba',
    name: 'Sudeste Bonaerense (Necochea / Lobería / Tres Arroyos / Tandilia)',
    coords: [
      [-37.2, -59.5],
      [-37.0, -58.8],
      [-37.5, -57.7],
      [-38.1, -57.4],
      [-38.6, -58.6], // Necochea Costa
      [-39.0, -59.3],
      [-38.8, -60.5],
      [-38.0, -60.8],
      [-37.4, -60.2]
    ]
  },
  {
    id: 'cuenca_salado',
    name: 'Cuenca del Salado (Pehuajó, 9 de Julio, Chascomús)',
    coords: [
      [-35.0, -62.8],
      [-34.8, -60.5],
      [-35.3, -58.5],
      [-35.8, -57.3],
      [-36.8, -57.8],
      [-36.9, -60.0],
      [-36.5, -62.5],
      [-35.8, -63.2]
    ]
  },
  {
    id: 'zona_nucleo',
    name: 'Zona Núcleo Pampeana (Pergamino, Marcos Juárez, Venado Tuerto)',
    coords: [
      [-32.8, -62.8],
      [-32.4, -61.0],
      [-33.2, -59.8],
      [-34.4, -59.6],
      [-34.8, -61.2],
      [-34.2, -63.0]
    ]
  },
  {
    id: 'litoral_mesopotamia',
    name: 'Litoral & Mesopotamia (Entre Ríos, Corrientes, Santa Fe N.)',
    coords: [
      [-27.2, -59.0],
      [-27.5, -56.5],
      [-29.5, -57.0],
      [-31.0, -58.0],
      [-33.2, -58.4],
      [-33.0, -60.6],
      [-30.5, -60.8],
      [-28.5, -60.0]
    ]
  },
  {
    id: 'oeste_pampeano',
    name: 'Oeste Pampeano & Córdoba Sur (Río Cuarto, La Pampa)',
    coords: [
      [-32.5, -65.2],
      [-32.6, -63.5],
      [-35.2, -63.5],
      [-36.8, -64.2],
      [-36.5, -66.0],
      [-34.0, -65.8]
    ]
  }
];

// Red de cuencas fluviales clave (con la Cuenca del Río Quequén Grande destacada)
const BASINS_PATHS = [
  // Río Quequén Grande (Necochea)
  {
    name: 'Río Quequén Grande (Desembocadura Necochea)',
    coords: [
      [-37.65, -59.20], // Nacientes en Tandilia
      [-37.85, -59.00],
      [-38.10, -58.90],
      [-38.35, -58.80],
      [-38.56, -58.71]  // Océano Atlántico (Puerto Quequén)
    ],
    color: '#06b6d4',
    weight: 4
  },
  // Río Quequén Salado
  {
    name: 'Río Quequén Salado',
    coords: [
      [-37.8, -60.6],
      [-38.3, -60.4],
      [-38.9, -60.2]
    ],
    color: '#06b6d4',
    weight: 2
  },
  // Río Salado Bonaerense
  {
    name: 'Río Salado Bonaerense',
    coords: [
      [-34.8, -62.0],
      [-35.3, -60.5],
      [-35.8, -59.0],
      [-35.9, -57.5] // Bahía de Samborombón
    ],
    color: '#3b82f6',
    weight: 3
  },
  // Río Paraná
  {
    name: 'Río Paraná',
    coords: [
      [-27.4, -58.8],
      [-29.2, -59.6],
      [-31.7, -60.5],
      [-32.9, -60.6],
      [-34.0, -59.0]
    ],
    color: '#60a5fa',
    weight: 4
  },
  // Río Uruguay
  {
    name: 'Río Uruguay',
    coords: [
      [-28.0, -56.0],
      [-30.5, -57.6],
      [-31.8, -58.0],
      [-33.5, -58.4]
    ],
    color: '#38bdf8',
    weight: 3
  }
];

/**
 * Inicializa el mapa de Leaflet
 */
export function initAgroMap(containerId, onPointSelected) {
  onPointSelectedCallback = onPointSelected;

  // Centrado en el corazón agrícola de Argentina
  mapInstance = L.map(containerId, {
    center: [-36.8, -60.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 13,
    zoomControl: false
  });

  // Control de Zoom personalizado en esquina superior derecha
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // Basemap oscuro por defecto
  currentBasemap = L.tileLayer(BASEMAP_DARK, {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  satelliteBasemap = L.tileLayer(BASEMAP_SATELLITE, {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  });

  // Grupos de capas
  regionsLayerGroup = L.layerGroup().addTo(mapInstance);
  basinsLayerGroup = L.layerGroup().addTo(mapInstance);
  reliefLayerGroup = L.layerGroup().addTo(mapInstance);
  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  // Cargar elementos vectoriales
  renderBasins();
  renderReliefContours();
  renderLocationMarkers();

  // Escuchar clics en el mapa para sondear cualquier lote
  mapInstance.on('click', (e) => {
    handleMapClick(e.latlng.lat, e.latlng.lng);
  });

  return mapInstance;
}

/**
 * Cambia el mapa base a Satélite o CartoDB
 */
export function toggleSatelliteBasemap(showSatellite) {
  if (showSatellite) {
    mapInstance.removeLayer(currentBasemap);
    satelliteBasemap.addTo(mapInstance);
  } else {
    mapInstance.removeLayer(satelliteBasemap);
    currentBasemap.addTo(mapInstance);
  }
}

export function toggleBasinsLayer(visible) {
  if (visible) {
    mapInstance.addLayer(basinsLayerGroup);
  } else {
    mapInstance.removeLayer(basinsLayerGroup);
  }
}

export function toggleReliefLayer(visible) {
  if (visible) {
    mapInstance.addLayer(reliefLayerGroup);
  } else {
    mapInstance.removeLayer(reliefLayerGroup);
  }
}

/**
 * Vuela el mapa hacia una ubicación clave (ej. Necochea)
 */
export function flyToLocation(key) {
  const loc = KEY_LOCATIONS[key];
  if (!loc || !mapInstance) return;

  const targetZoom = key === 'necochea' ? 9 : 8;
  mapInstance.flyTo([loc.lat, loc.lon], targetZoom, {
    duration: 1.5,
    easeLinearity: 0.25
  });

  handleMapClick(loc.lat, loc.lon, key);
}

/**
 * Actualiza la coloración de las regiones según la métrica activa, etapa y escenario
 */
export function updateMapSimulationState(activeLayer, stepIdx, scenarioKey) {
  regionsLayerGroup.clearLayers();

  REGION_BOUNDARIES.forEach(region => {
    const prediction = calculateAgroPrediction(region.id, stepIdx, scenarioKey);
    const style = getRegionStyle(activeLayer, prediction);

    const polygon = L.polygon(region.coords, style);

    // Tooltip flotante al pasar el cursor
    polygon.bindTooltip(`
      <div style="font-family:'Outfit',sans-serif; padding:4px;">
        <strong style="color:#ffffff; font-size:0.85rem;">${region.name}</strong><br>
        <span style="color:#67e8f9; font-size:0.75rem;">Riesgo Hídrico: ${prediction.riskIndex}% (${prediction.riskLevel})</span><br>
        <span style="color:#94a3b8; font-size:0.7rem;">Napa estimada: ${prediction.napaDepthM} m | Lluvia: +${prediction.rainAnomalyPercent}%</span>
      </div>
    `, { sticky: true, className: 'agro-tooltip' });

    polygon.on('click', () => {
      handleMapClick(region.coords[0][0], region.coords[0][1]);
    });

    polygon.addTo(regionsLayerGroup);
  });
}

function getRegionStyle(layer, pred) {
  let fillColor = '#10b981';
  let fillOpacity = 0.45;

  if (layer === 'risk') {
    if (pred.riskIndex >= 80) fillColor = '#ef4444';
    else if (pred.riskIndex >= 60) fillColor = '#f59e0b';
    else if (pred.riskIndex >= 40) fillColor = '#3b82f6';
    else fillColor = '#10b981';
    fillOpacity = 0.2 + (pred.riskIndex / 100) * 0.45;
  } else if (layer === 'rainfall') {
    if (pred.rainAnomalyPercent > 80) fillColor = '#1e3a8a';
    else if (pred.rainAnomalyPercent > 50) fillColor = '#2563eb';
    else if (pred.rainAnomalyPercent > 20) fillColor = '#06b6d4';
    else fillColor = '#10b981';
    fillOpacity = 0.5;
  } else if (layer === 'water_table') {
    if (pred.napaDepthM < 0.6) fillColor = '#06b6d4';
    else if (pred.napaDepthM < 1.2) fillColor = '#0284c7';
    else fillColor = '#0f766e';
    fillOpacity = 0.48;
  } else if (layer === 'soil_moisture') {
    fillColor = pred.soilMoisturePercent > 90 ? '#047857' : '#10b981';
    fillOpacity = (pred.soilMoisturePercent / 100) * 0.6;
  } else if (layer === 'trafficability') {
    fillColor = pred.trafficabilityLossDays > 15 ? '#b91c1c' : '#d97706';
    fillOpacity = 0.52;
  }

  return {
    fillColor,
    fillOpacity,
    color: fillColor,
    weight: 2,
    dashArray: '3, 4',
    lineCap: 'round'
  };
}

/**
 * Dibuja las cuencas hidrográficas
 */
function renderBasins() {
  basinsLayerGroup.clearLayers();

  BASINS_PATHS.forEach(basin => {
    const polyline = L.polyline(basin.coords, {
      color: basin.color,
      weight: basin.weight,
      opacity: 0.85,
      dashArray: basin.weight === 4 ? null : '4, 6'
    });

    polyline.bindTooltip(`
      <strong style="color:#67e8f9;">${basin.name}</strong><br>
      <span style="font-size:0.7rem; color:#cbd5e1;">Eje de drenaje hidrológico</span>
    `, { sticky: true });

    polyline.addTo(basinsLayerGroup);
  });
}

/**
 * Dibuja líneas de nivel y relieve de las sierras de Tandilia / Ventania
 */
function renderReliefContours() {
  reliefLayerGroup.clearLayers();

  // Sistema de Tandilia (Balcarce, Tandil, Sierra de los Padres)
  const tandiliaRidge = [
    [-37.2, -59.4],
    [-37.5, -58.7],
    [-37.8, -58.2],
    [-38.0, -57.8]
  ];

  const ridgeLine = L.polyline(tandiliaRidge, {
    color: '#f59e0b',
    weight: 3,
    opacity: 0.6,
    dashArray: '2, 6'
  }).bindTooltip('<strong>Sistema de Tandilia (150-280 msnm)</strong><br><span style="font-size:0.7rem;">Parteaguas de cuencas hacia el Atlántico y el Salado</span>', { sticky: true });

  ridgeLine.addTo(reliefLayerGroup);
}

/**
 * Renderiza los pines con pulsos radar de las ciudades clave
 */
function renderLocationMarkers() {
  markersLayerGroup.clearLayers();

  Object.entries(KEY_LOCATIONS).forEach(([key, loc]) => {
    const isNecochea = key === 'necochea';

    const customIcon = L.divIcon({
      className: `agro-marker-pin ${isNecochea ? 'agro-marker-necochea' : ''}`,
      html: `
        <div class="agro-marker-pulse" style="background:${isNecochea ? 'rgba(6,182,212,0.45)' : 'rgba(16,185,129,0.3)'};"></div>
        <div class="agro-marker-core" style="background:${isNecochea ? '#06b6d4' : '#10b981'};"></div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([loc.lat, loc.lon], { icon: customIcon });

    marker.bindPopup(`
      <div class="map-popup-header">
        <span class="popup-title">${loc.name}</span>
        <span class="popup-tag">${loc.basin}</span>
      </div>
      <div class="popup-grid">
        <div class="popup-stat-item">
          <span class="popup-stat-lbl">Elevación</span>
          <span class="popup-stat-val text-cyan">${loc.elevation} msnm</span>
        </div>
        <div class="popup-stat-item">
          <span class="popup-stat-lbl">Vulnerabilidad</span>
          <span class="popup-stat-val text-red">${Math.round(loc.regionalVulnerability * 100)}%</span>
        </div>
      </div>
      <p style="font-size:0.72rem; color:#94a3b8; margin:0 0 8px 0;"><strong>Suelo:</strong> ${loc.soilType}</p>
      <button class="btn btn-primary btn-xs w-100" id="btnPopupProbe-${key}">
        Inspeccionar Lote con Sonda
      </button>
    `);

    marker.on('popupopen', () => {
      const btn = document.getElementById(`btnPopupProbe-${key}`);
      if (btn) {
        btn.addEventListener('click', () => {
          mapInstance.closePopup();
          handleMapClick(loc.lat, loc.lon, key);
        });
      }
    });

    marker.addTo(markersLayerGroup);
  });
}

/**
 * Manejador central al seleccionar cualquier punto o ciudad
 */
function handleMapClick(lat, lon, knownLocationKey = null) {
  // Mover o crear la sonda activa
  if (!probeMarker) {
    const probeIcon = L.divIcon({
      className: 'agro-probe-marker',
      html: `<div style="width:20px; height:20px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 15px #ef4444;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    probeMarker = L.marker([lat, lon], { icon: probeIcon }).addTo(mapInstance);
  } else {
    probeMarker.setLatLng([lat, lon]);
  }

  if (onPointSelectedCallback) {
    onPointSelectedCallback(lat, lon, knownLocationKey);
  }
}
