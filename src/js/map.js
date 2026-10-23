/**
 * SISTEMA PREDICTOR DE IMPACTO HIDRO-AGRÍCOLA DEL SÚPER NIÑO (SPIHA-Niño)
 * Controlador Cartográfico Geoespacial y Motor de Renderizado en Canvas Dinámico.
 * Permite superponer, mezclar y animar mapas de calor continuos globales y redes fluviales.
 */

import L from 'leaflet';
import { KEY_LOCATIONS } from './api.js';
import { TIMELINE_STEPS, MAJOR_RIVER_SYSTEMS, evaluatePointConditions } from './simulation.js';

let mapInstance = null;
let currentBasemap = null;
let satelliteBasemap = null;

// Capas de renderizado
let heatCanvasLayer = null;
let riversLayerGroup = null;
let probesLayerGroup = null;
let probeMarker = null;

// Configuración de capas y mezcla (Opacidades y visibilidad)
export const LayerMixerState = {
  floodHeatmap: { enabled: true, opacity: 0.65 },
  ensoPlume: { enabled: true, opacity: 0.50 },
  riverFlow: { enabled: true, opacity: 0.90 },
  soilMoisture: { enabled: false, opacity: 0.40 },
  basemapSatellite: false,
  showReliefContour: true
};

let currentStepIndex = 0;
let currentScenario = 'super';
let onPointSelectedCallback = null;
let onHoverCoordsCallback = null;

// Cartografía base con API Key oficial de CARTO
const CARTO_API_KEY = 'cb1_4t35_1_088aa67124f70f9d382d1599';
const BASEMAP_DARK = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const BASEMAP_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/**
 * Inicializa el mapa Leaflet con soporte global, móvil y capas dinámicas
 */
export function initAgroMap(containerId, onPointSelected, onHoverCoords) {
  onPointSelectedCallback = onPointSelected;
  onHoverCoordsCallback = onHoverCoords;

  mapInstance = L.map(containerId, {
    center: [-38.0, -59.5], // Centrado en Buenos Aires / Necochea / Región Pampeana
    zoom: 6,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: false,
    worldCopyJump: true
  });

  // Control de zoom adaptado para desktop y mobile
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // Basemap oscuro de CARTO
  currentBasemap = L.tileLayer(BASEMAP_DARK, {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  satelliteBasemap = L.tileLayer(BASEMAP_SATELLITE, {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  });

  // Grupos de capas vectoriales y sondas
  riversLayerGroup = L.layerGroup().addTo(mapInstance);
  probesLayerGroup = L.layerGroup().addTo(mapInstance);

  // Inicializar capa Canvas continua para Mapas de Calor y Pluma del Niño
  initCanvasHeatmapLayer();

  // Renderizar ríos iniciales y marcadores de cabecera
  renderDynamicRivers();
  renderKeyLocationPins();

  // Eventos de interacción: Clic y movimiento de ratón
  mapInstance.on('click', (e) => {
    handleMapClick(e.latlng.lat, e.latlng.lng);
  });

  mapInstance.on('mousemove', (e) => {
    if (onHoverCoordsCallback) {
      const pred = evaluatePointConditions(e.latlng.lat, e.latlng.lng, currentStepIndex, currentScenario);
      onHoverCoordsCallback(e.latlng.lat, e.latlng.lng, pred);
    }
  });

  // Re-renderizar el canvas cuando el mapa se mueva o cambie de zoom
  mapInstance.on('moveend zoomend', () => {
    redrawHeatmapCanvas();
  });

  return mapInstance;
}

/**
 * Crea una capa Canvas personalizada en Leaflet que cubre la pantalla
 * y renderiza el campo continuo de calor de inundaciones y pluma del Niño
 */
function initCanvasHeatmapLayer() {
  const CanvasOverlay = L.Layer.extend({
    onAdd: function(map) {
      this._map = map;
      this._canvas = L.DomUtil.create('canvas', 'agro-simulation-canvas');
      this._canvas.style.position = 'absolute';
      this._canvas.style.top = '0';
      this._canvas.style.left = '0';
      this._canvas.style.pointerEvents = 'none'; // Permite clics transparentes al mapa
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
 * Renderizado de alto rendimiento en Canvas: Mapa de Calor Continuo y Pluma del Niño
 */
export function redrawHeatmapCanvas() {
  if (!heatCanvasLayer || !heatCanvasLayer._canvas || !mapInstance) return;

  const canvas = heatCanvasLayer._canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = mapInstance.getBounds();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  // Resolución de cuadrícula adaptada al zoom para máxima fluidez a 60 FPS
  const zoom = mapInstance.getZoom();
  const stepDeg = zoom >= 10 ? 0.08 : zoom >= 8 ? 0.16 : zoom >= 6 ? 0.35 : 0.75;

  const floodEnabled = LayerMixerState.floodHeatmap.enabled;
  const floodOpacity = LayerMixerState.floodHeatmap.opacity;
  const plumeEnabled = LayerMixerState.ensoPlume.enabled;
  const plumeOpacity = LayerMixerState.ensoPlume.opacity;

  if (!floodEnabled && !plumeEnabled) return;

  // Recorrer el área visible de la pantalla
  for (let lat = south; lat <= north; lat += stepDeg) {
    for (let lon = west; lon <= east; lon += stepDeg) {
      const pred = evaluatePointConditions(lat, lon, currentStepIndex, currentScenario);
      const point = mapInstance.latLngToContainerPoint([lat, lon]);

      // Tamaño del píxel de interpolación
      const pixelRadius = Math.max(12, Math.round(38 / Math.pow(1.15, 6 - zoom)));

      // 1. Renderizar Pluma del Súper Niño (Atmospheric River)
      if (plumeEnabled && pred.rainAnomalyPercent > 20) {
        const pAlpha = (pred.rainAnomalyPercent / 140) * plumeOpacity;
        const gradPlume = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pixelRadius * 1.5);
        gradPlume.addColorStop(0, `rgba(6, 182, 212, ${pAlpha})`);
        gradPlume.addColorStop(0.5, `rgba(59, 130, 246, ${pAlpha * 0.5})`);
        gradPlume.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = gradPlume;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pixelRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Renderizar Mapa de Calor de Riesgo de Inundación y Anegamiento
      if (floodEnabled && pred.floodRiskPercent >= 25) {
        const fAlpha = (pred.floodRiskPercent / 100) * floodOpacity;
        const gradRisk = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, pixelRadius);

        if (pred.floodRiskPercent >= 75) {
          // Crítico / Desborde activo (Rojo Carmesí)
          gradRisk.addColorStop(0, `rgba(239, 68, 68, ${fAlpha})`);
          gradRisk.addColorStop(0.6, `rgba(220, 38, 38, ${fAlpha * 0.7})`);
          gradRisk.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else if (pred.floodRiskPercent >= 50) {
          // Alerta / Moderado a Alto (Ámbar / Naranja)
          gradRisk.addColorStop(0, `rgba(245, 158, 11, ${fAlpha})`);
          gradRisk.addColorStop(0.6, `rgba(217, 119, 6, ${fAlpha * 0.6})`);
          gradRisk.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          // Vigilancia (Cian / Azul Hídrico)
          gradRisk.addColorStop(0, `rgba(6, 182, 212, ${fAlpha * 0.8})`);
          gradRisk.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = gradRisk;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pixelRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Dibuja la red fluvial y sus desbordes dinámicos según la etapa de la línea de tiempo
 */
function renderDynamicRivers() {
  riversLayerGroup.clearLayers();
  if (!LayerMixerState.riverFlow.enabled) return;

  const step = TIMELINE_STEPS[currentStepIndex] || TIMELINE_STEPS[0];
  const flowFactor = step.riverDischargeFactor;
  const opacity = LayerMixerState.riverFlow.opacity;

  MAJOR_RIVER_SYSTEMS.forEach(river => {
    // Verificar si esta cuenca está en su pico estacional
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

    // Dibujar llanura aluvial de inundación si hay desborde
    if (isSuperPeak) {
      const overflowBuffer = L.polyline(river.points, {
        color: '#ef4444',
        weight: 18,
        opacity: 0.25 * opacity,
        lineCap: 'round'
      }).addTo(riversLayerGroup);
    }

    // Trazo principal del río
    const polyline = L.polyline(river.points, {
      color: riverColor,
      weight: baseWeight,
      opacity: opacity,
      className: pulseClass
    });

    polyline.bindTooltip(`
      <div style="font-family:'Outfit',sans-serif; padding:4px;">
        <strong style="color:${riverColor}; font-size:0.85rem;">🌊 ${river.name}</strong><br>
        <span style="color:#ffffff; font-size:0.75rem;">Desembocadura: ${river.mouthName}</span><br>
        <span style="color:#cbd5e1; font-size:0.7rem;">Caudal Súper Niño: <strong>${Math.round(flowFactor * 100)}% de capacidad</strong></span><br>
        <span style="color:${isSuperPeak ? '#ef4444' : '#38bdf8'}; font-size:0.7rem;">
          ${isSuperPeak ? '⚠️ ¡ALERTA DE DESBORDE ACTIVO EN VALLES!' : 'Caudal en ascenso'}
        </span>
      </div>
    `, { sticky: true });

    polyline.addTo(riversLayerGroup);
  });
}

/**
 * Renderiza los pines clave (Necochea destacado con pulso radar)
 */
function renderKeyLocationPins() {
  probesLayerGroup.clearLayers();

  Object.entries(KEY_LOCATIONS).forEach(([key, loc]) => {
    const isNecochea = key === 'necochea';

    const customIcon = L.divIcon({
      className: `agro-marker-pin ${isNecochea ? 'agro-marker-necochea' : ''}`,
      html: `
        <div class="agro-marker-pulse" style="background:${isNecochea ? 'rgba(6,182,212,0.45)' : 'rgba(16,185,129,0.3)'};"></div>
        <div class="agro-marker-core" style="background:${isNecochea ? '#06b6d4' : '#10b981'};"></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([loc.lat, loc.lon], { icon: customIcon });

    marker.bindTooltip(`
      <strong style="color:#ffffff;">📍 ${loc.name}</strong><br>
      <span style="color:#67e8f9; font-size:0.72rem;">Haz clic para diagnóstico completo</span>
    `, { sticky: true });

    marker.on('click', () => {
      handleMapClick(loc.lat, loc.lon, key);
    });

    marker.addTo(probesLayerGroup);
  });
}

/**
 * Manejador central al seleccionar cualquier punto o lote
 */
function handleMapClick(lat, lon, knownLocationKey = null) {
  if (!probeMarker) {
    const probeIcon = L.divIcon({
      className: 'agro-probe-marker',
      html: `<div style="width:22px; height:22px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 16px #ef4444;"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    probeMarker = L.marker([lat, lon], { icon: probeIcon }).addTo(mapInstance);
  } else {
    probeMarker.setLatLng([lat, lon]);
  }

  if (onPointSelectedCallback) {
    onPointSelectedCallback(lat, lon, knownLocationKey);
  }
}

/**
 * Vuela el mapa a una ubicación clave
 */
export function flyToLocation(key) {
  const loc = KEY_LOCATIONS[key];
  if (!loc || !mapInstance) return;

  const targetZoom = key === 'necochea' ? 9 : 8;
  mapInstance.flyTo([loc.lat, loc.lon], targetZoom, {
    duration: 1.4,
    easeLinearity: 0.25
  });

  handleMapClick(loc.lat, loc.lon, key);
}

/**
 * Vuela el mapa hacia cualquier coordenada del mundo
 */
export function flyToCoordinates(lat, lon, zoom = 9) {
  if (!mapInstance) return;
  mapInstance.flyTo([lat, lon], zoom, {
    duration: 1.4,
    easeLinearity: 0.25
  });
  handleMapClick(lat, lon, null);
}

/**
 * Actualiza el estado global de simulación (etapa temporal y escenario)
 */
export function updateSimulationTimeline(stepIdx, scenarioKey) {
  currentStepIndex = stepIdx;
  currentScenario = scenarioKey;
  renderDynamicRivers();
  redrawHeatmapCanvas();
}

/**
 * Alterna mapa satelital Esri
 */
export function toggleSatelliteBasemap(showSatellite) {
  LayerMixerState.basemapSatellite = showSatellite;
  if (showSatellite) {
    mapInstance.removeLayer(currentBasemap);
    satelliteBasemap.addTo(mapInstance);
  } else {
    mapInstance.removeLayer(satelliteBasemap);
    currentBasemap.addTo(mapInstance);
  }
}

/**
 * Actualiza la opacidad y visibilidad de las capas mezclables
 */
export function setLayerMixerProperty(layerName, property, value) {
  if (LayerMixerState[layerName]) {
    LayerMixerState[layerName][property] = value;
    if (layerName === 'riverFlow') {
      renderDynamicRivers();
    }
    redrawHeatmapCanvas();
  }
}
