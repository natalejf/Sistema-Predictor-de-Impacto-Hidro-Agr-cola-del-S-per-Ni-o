/**
 * SISTEMA DE PREDICCIÓN DEL SUPER NIÑO (SPSN)
 * Controlador Cartográfico Geoespacial y Motor de Renderizado en Canvas Dinámico.
 * Visualiza la estela y tormenta orgánica del Niño de forma continua sin bordes rectangulares.
 */

import L from 'leaflet';
import { TIMELINE_STEPS, MAJOR_RIVER_SYSTEMS, evaluatePointConditions } from './simulation.js';

let mapInstance = null;
let currentBasemap = null;
let satelliteBasemap = null;

// Capas
let heatCanvasLayer = null;
let riversLayerGroup = null;
let probeMarker = null;

// Capa activa única (plume | flood | rivers | satellite)
export let activeLayerMode = 'plume';

let currentStepIndex = 0;
let currentScenario = 'super';
let onPointSelectedCallback = null;
let onHoverCoordsCallback = null;

// Cartografía base con API Key oficial de CARTO
const CARTO_API_KEY = 'cb1_4t35_1_088aa67124f70f9d382d1599';
const BASEMAP_DARK = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const BASEMAP_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/**
 * Inicializa el mapa Leaflet
 */
export function initAgroMap(containerId, onPointSelected, onHoverCoords) {
  onPointSelectedCallback = onPointSelected;
  onHoverCoordsCallback = onHoverCoords;

  mapInstance = L.map(containerId, {
    center: [-38.0, -59.5], // Centrado en la región bonaerense / Necochea
    zoom: 5,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: false,
    worldCopyJump: true
  });

  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  currentBasemap = L.tileLayer(BASEMAP_DARK, {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  satelliteBasemap = L.tileLayer(BASEMAP_SATELLITE, {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  });

  riversLayerGroup = L.layerGroup().addTo(mapInstance);

  // Inicializar capa Canvas continua para la tormenta del Niño y riesgo
  initCanvasHeatmapLayer();

  // Escuchar clics y movimiento del cursor
  mapInstance.on('click', (e) => {
    handleMapClick(e.latlng.lat, e.latlng.lng);
  });

  mapInstance.on('mousemove', (e) => {
    if (onHoverCoordsCallback) {
      const pred = evaluatePointConditions(e.latlng.lat, e.latlng.lng, currentStepIndex, currentScenario);
      onHoverCoordsCallback(e.latlng.lat, e.latlng.lng, pred);
    }
  });

  mapInstance.on('moveend zoomend', () => {
    redrawHeatmapCanvas();
  });

  // Render inicial
  redrawHeatmapCanvas();
  renderDynamicRivers();

  return mapInstance;
}

/**
 * Canvas layer para renderizar la tormenta del Niño y el riesgo hídrico
 */
function initCanvasHeatmapLayer() {
  const CanvasOverlay = L.Layer.extend({
    onAdd: function(map) {
      this._map = map;
      this._canvas = L.DomUtil.create('canvas', 'agro-simulation-canvas');
      this._canvas.style.position = 'absolute';
      this._canvas.style.top = '0';
      this._canvas.style.left = '0';
      this._canvas.style.pointerEvents = 'none';
      this._canvas.style.zIndex = '350';

      const size = this._map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;

      const animated = this._map.options.zoomAnimation && L.Browser.any3d;
      L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

      map._panes.overlayPane.appendChild(this._canvas);
      map.on('move', this._reset, this);
      map.on('resize', this._resize, this);
      this._reset();
    },

    onRemove: function(map) {
      map._panes.overlayPane.removeChild(this._canvas);
      map.off('move', this._reset, this);
      map.off('resize', this._resize, this);
    },

    _resize: function() {
      const size = this._map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;
      this._reset();
    },

    _reset: function() {
      const topLeft = this._map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._canvas, topLeft);
      redrawHeatmapCanvas();
    }
  });

  heatCanvasLayer = new CanvasOverlay();
  mapInstance.addLayer(heatCanvasLayer);
}

/**
 * Renderizado continuo en Canvas: Estela y Tormenta del Niño o Riesgo de Inundación
 * Dibuja campos radiales orgánicos y fluidos sin ningún corte cuadrado.
 */
export function redrawHeatmapCanvas() {
  if (!heatCanvasLayer || !heatCanvasLayer._canvas || !mapInstance) return;

  const canvas = heatCanvasLayer._canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const step = TIMELINE_STEPS[currentStepIndex] || TIMELINE_STEPS[0];
  const mult = step.scenarioMultipliers[currentScenario] || 1.35;

  // ========================================================
  // MODO 1: TORMENTA & ESTELA DEL SÚPER NIÑO (Río Atmosférico)
  // ========================================================
  if (activeLayerMode === 'plume') {
    // Dibujar cada nodo de la trayectoria de la tormenta con gradientes radiales fluidos
    step.stormTrajectory.forEach((node, i) => {
      const centerPoint = mapInstance.latLngToContainerPoint([node.lat, node.lon]);
      
      // Radio en píxeles proporcional al zoom y al spread del nodo
      const zoom = mapInstance.getZoom();
      const radiusPx = (node.spread * Math.pow(2, zoom)) / 5.2;

      if (radiusPx < 10) return;

      const intensity = node.intensity * (mult / 1.35);
      const gradient = ctx.createRadialGradient(
        centerPoint.x, centerPoint.y, 0,
        centerPoint.x, centerPoint.y, radiusPx
      );

      // Paleta orgánica de radar meteorológico: Núcleo denso -> frente convectivo -> borde difuso
      if (intensity > 0.85) {
        // Núcleo activo (Tormenta severa)
        gradient.addColorStop(0.0, `rgba(239, 68, 68, ${0.72 * intensity})`);   // Rojo núcleo
        gradient.addColorStop(0.3, `rgba(245, 158, 11, ${0.58 * intensity})`);  // Ámbar
        gradient.addColorStop(0.65, `rgba(6, 182, 212, ${0.35 * intensity})`);  // Cian lluvia
        gradient.addColorStop(1.0, 'rgba(6, 182, 212, 0)');                    // Cero transparente
      } else if (intensity > 0.55) {
        // Lluvias moderadas a fuertes
        gradient.addColorStop(0.0, `rgba(245, 158, 11, ${0.60 * intensity})`);
        gradient.addColorStop(0.4, `rgba(6, 182, 212, ${0.45 * intensity})`);
        gradient.addColorStop(0.75, `rgba(59, 130, 246, ${0.25 * intensity})`);
        gradient.addColorStop(1.0, 'rgba(59, 130, 246, 0)');
      } else {
        // Estela difusa del frente húmedo
        gradient.addColorStop(0.0, `rgba(6, 182, 212, ${0.40 * intensity})`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.20 * intensity})`);
        gradient.addColorStop(1.0, 'rgba(59, 130, 246, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerPoint.x, centerPoint.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ========================================================
  // MODO 2: MAPA DE RIESGO DE INUNDACIÓN (Relieve y Napa)
  // ========================================================
  else if (activeLayerMode === 'flood') {
    const bounds = mapInstance.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    const zoom = mapInstance.getZoom();
    const stepDeg = zoom >= 9 ? 0.12 : zoom >= 7 ? 0.25 : 0.6;
    const pixelRadius = Math.max(16, Math.round(42 / Math.pow(1.12, 6 - zoom)));

    for (let lat = south - stepDeg; lat <= north + stepDeg; lat += stepDeg) {
      for (let lon = west - stepDeg; lon <= east + stepDeg; lon += stepDeg) {
        const pred = evaluatePointConditions(lat, lon, currentStepIndex, currentScenario);
        if (pred.floodRiskPercent < 25) continue;

        const point = mapInstance.latLngToContainerPoint([lat, lon]);
        const alpha = (pred.floodRiskPercent / 100) * 0.70;
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pixelRadius);

        if (pred.floodRiskPercent >= 75) {
          grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
          grad.addColorStop(0.7, `rgba(220, 38, 38, ${alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else if (pred.floodRiskPercent >= 50) {
          grad.addColorStop(0, `rgba(245, 158, 11, ${alpha})`);
          grad.addColorStop(0.7, `rgba(217, 119, 6, ${alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          grad.addColorStop(0, `rgba(6, 182, 212, ${alpha * 0.8})`);
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pixelRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Renderiza los ríos y desbordes
 */
function renderDynamicRivers() {
  riversLayerGroup.clearLayers();

  const showRivers = activeLayerMode === 'rivers' || activeLayerMode === 'flood';
  if (!showRivers) return;

  const step = TIMELINE_STEPS[currentStepIndex] || TIMELINE_STEPS[0];
  const flowFactor = step.riverDischargeFactor;

  MAJOR_RIVER_SYSTEMS.forEach(river => {
    const isPeak = Math.abs(currentStepIndex - river.criticalPeakStep) <= 1;
    const isSuperPeak = currentStepIndex === river.criticalPeakStep;

    let riverColor = '#06b6d4';
    let baseWeight = 3;
    let pulseClass = '';

    if (isSuperPeak && flowFactor >= 1.6) {
      riverColor = '#ef4444'; // Desborde activo (Rojo)
      baseWeight = 7;
      pulseClass = 'river-overflow-active';
    } else if (isPeak || flowFactor >= 1.4) {
      riverColor = '#f59e0b'; // Alerta de crecida (Ámbar)
      baseWeight = 5;
    }

    if (isSuperPeak) {
      L.polyline(river.points, {
        color: '#ef4444',
        weight: 18,
        opacity: 0.28,
        lineCap: 'round'
      }).addTo(riversLayerGroup);
    }

    const polyline = L.polyline(river.points, {
      color: riverColor,
      weight: baseWeight,
      opacity: 0.9,
      className: pulseClass
    });

    polyline.bindTooltip(`
      <div style="font-family:'Outfit',sans-serif; padding:4px;">
        <strong style="color:${riverColor}; font-size:0.85rem;">🌊 ${river.name}</strong><br>
        <span style="color:#ffffff; font-size:0.75rem;">Desembocadura: ${river.mouthName}</span><br>
        <span style="color:${isSuperPeak ? '#ef4444' : '#38bdf8'}; font-weight:bold; font-size:0.7rem;">
          ${isSuperPeak ? '⚠️ ¡DESBORDE ACTIVO EN VALLES BAJOS!' : 'Caudal en ascenso'}
        </span>
      </div>
    `, { sticky: true });

    polyline.addTo(riversLayerGroup);
  });
}

/**
 * Manejador al hacer clic en cualquier punto del mapa
 * (Solo coloca la sonda activa del lote investigado)
 */
function handleMapClick(lat, lon) {
  if (!probeMarker) {
    const probeIcon = L.divIcon({
      className: 'agro-probe-marker',
      html: `<div style="width:20px; height:20px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 16px #ef4444;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    probeMarker = L.marker([lat, lon], { icon: probeIcon }).addTo(mapInstance);
  } else {
    probeMarker.setLatLng([lat, lon]);
  }

  if (onPointSelectedCallback) {
    onPointSelectedCallback(lat, lon);
  }
}

/**
 * Vuela el mapa hacia cualquier coordenada arbitraria
 */
export function flyToCoordinates(lat, lon, zoom = 8) {
  if (!mapInstance) return;
  mapInstance.flyTo([lat, lon], zoom, {
    duration: 1.4,
    easeLinearity: 0.25
  });
  handleMapClick(lat, lon);
}

/**
 * Cambia la capa activa (uno a la vez según lo solicitado por el usuario)
 */
export function setActiveLayerMode(mode) {
  activeLayerMode = mode;

  if (mode === 'satellite') {
    mapInstance.removeLayer(currentBasemap);
    satelliteBasemap.addTo(mapInstance);
  } else {
    mapInstance.removeLayer(satelliteBasemap);
    currentBasemap.addTo(mapInstance);
  }

  renderDynamicRivers();
  redrawHeatmapCanvas();
}

/**
 * Actualiza la etapa temporal
 */
export function updateSimulationTimeline(stepIdx, scenarioKey) {
  currentStepIndex = stepIdx;
  currentScenario = scenarioKey;
  renderDynamicRivers();
  redrawHeatmapCanvas();
}
