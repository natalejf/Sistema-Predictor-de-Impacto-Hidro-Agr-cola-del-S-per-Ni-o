/**
 * SISTEMA DE PREDICCIÓN DEL SUPER NIÑO (SPSN)
 * Controlador Central y Manejador de Estado Reactivo
 */

import { fetchLiveWeatherAndSoil, searchLocationByName, KEY_LOCATIONS } from './api.js';
import { TIMELINE_STEPS, evaluatePointConditions } from './simulation.js';
import { generateTechnicalReportContent } from './agroEngine.js';
import {
  initAgroMap,
  flyToCoordinates,
  updateSimulationTimeline,
  setActiveLayerMode
} from './map.js';

// Estado global de la aplicación
const AppState = {
  currentLocationKey: 'necochea',
  currentCoords: { lat: -38.5545, lon: -58.7396 },
  currentStepIndex: 0,
  currentScenario: 'super',
  activeLayerMode: 'plume',
  isPlaying: false,
  playTimer: null,
  liveWeatherData: null,
  activePrediction: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initMapComponent();
  initUIEventListeners();
  await updateAllState(true);
});

/**
 * Centra el mapa en una localidad clave
 */
function flyToLocation(key) {
  const loc = KEY_LOCATIONS[key];
  if (loc) {
    flyToCoordinates(loc.lat, loc.lon, loc.zoom || 8);
  }
}

/**
 * Inicializa el mapa y conecta los eventos de clic y cursor flotante
 */
function initMapComponent() {
  initAgroMap('agroMap',
    // Callback al hacer clic en cualquier punto del mapa
    async (lat, lon, knownLocationKey) => {
      AppState.currentCoords = { lat, lon };
      AppState.currentLocationKey = knownLocationKey || null;
      await updateAllState(false);
    },
    // Callback al mover el cursor o tocar (hover continuo en tiempo real)
    (lat, lon, pred) => {
      updateHoverPillUI(lat, lon, pred);
    }
  );
}

/**
 * Actualiza el estado completo: predicción hidrológica, medidores, ríos y Open-Meteo
 */
async function updateAllState(shouldFlyMap = false) {
  const step = TIMELINE_STEPS[AppState.currentStepIndex];

  // 1. Evaluar condiciones del lote en el motor continuo de relieve e inundaciones
  AppState.activePrediction = evaluatePointConditions(
    AppState.currentCoords.lat,
    AppState.currentCoords.lon,
    AppState.currentStepIndex,
    AppState.currentScenario
  );

  // 2. Obtener datos meteorológicos y de humedad de suelo en vivo desde Open-Meteo
  AppState.liveWeatherData = await fetchLiveWeatherAndSoil(
    AppState.currentCoords.lat,
    AppState.currentCoords.lon
  );

  // 3. Actualizar la simulación dinámica en el Canvas y la red de ríos
  updateSimulationTimeline(AppState.currentStepIndex, AppState.currentScenario);

  if (shouldFlyMap && AppState.currentLocationKey) {
    flyToLocation(AppState.currentLocationKey);
  }

  // 4. Actualizar la interfaz ejecutiva del Inspector de Riesgo
  updateInspectorUI(AppState.activePrediction, AppState.liveWeatherData);

  // 5. Actualizar el reproductor y la línea de tiempo inferior
  updateTimelineUI(step);
}

/**
 * Actualiza el indicador flotante tipo HUD que sigue al cursor
 */
function updateHoverPillUI(lat, lon, pred) {
  const pill = document.getElementById('hoverRiskPill');
  const dot = document.getElementById('hoverDot');
  const elPlace = document.getElementById('hoverPlace');
  const elStats = document.getElementById('hoverStats');

  if (!pill || !pred) return;

  const locName = AppState.currentLocationKey && KEY_LOCATIONS[AppState.currentLocationKey]
    ? KEY_LOCATIONS[AppState.currentLocationKey].name
    : `${lat.toFixed(2)}°S, ${lon.toFixed(2)}°W`;

  if (elPlace) elPlace.textContent = `📍 ${locName}`;
  if (elStats) {
    elStats.textContent = `Riesgo Inundación: ${pred.floodRiskPercent}% (${pred.statusLabel.split('/')[0].trim()}) | Crecida Río: ${pred.riverOverflowPercent}%`;
  }

  if (dot) {
    dot.style.background = pred.statusColor;
    dot.style.boxShadow = `0 0 10px ${pred.statusColor}`;
  }
}

/**
 * Actualiza la tarjeta ejecutiva del inspector de riesgo en el panel derecho
 */
function updateInspectorUI(pred, live) {
  const locTitle = document.getElementById('inspLocationTitle');
  const locCoords = document.getElementById('inspCoords');
  const gaugeNumber = document.getElementById('gaugeNumber');
  const gaugeRing = document.getElementById('gaugeRing');
  const gaugeStatusText = document.getElementById('gaugeStatusText');
  const gaugeNote = document.getElementById('gaugeNote');

  const inspRain = document.getElementById('inspRainVal');
  const inspRiver = document.getElementById('inspRiverVal');
  const inspTraffic = document.getElementById('inspTrafficVal');
  const inspNapa = document.getElementById('inspNapaVal');

  const locInfo = AppState.currentLocationKey && KEY_LOCATIONS[AppState.currentLocationKey]
    ? KEY_LOCATIONS[AppState.currentLocationKey]
    : { name: `Lote en (${AppState.currentCoords.lat.toFixed(2)}°, ${AppState.currentCoords.lon.toFixed(2)}°)`, basin: pred.nearestRiverName };

  if (locTitle) locTitle.textContent = locInfo.name;
  if (locCoords) {
    locCoords.textContent = `${AppState.currentCoords.lat.toFixed(2)}°S, ${AppState.currentCoords.lon.toFixed(2)}°W · Cuenca: ${pred.nearestRiverName}`;
  }

  // Medidor central de riesgo circular
  if (gaugeNumber) gaugeNumber.textContent = `${pred.floodRiskPercent}%`;
  if (gaugeRing) {
    gaugeRing.style.borderColor = pred.statusColor;
    gaugeRing.style.boxShadow = `0 0 18px ${pred.statusColor}66, inset 0 0 12px ${pred.statusColor}33`;
  }
  if (gaugeStatusText) {
    gaugeStatusText.textContent = pred.statusLabel;
    gaugeStatusText.style.color = pred.statusColor;
  }
  if (gaugeNote) {
    gaugeNote.textContent = pred.isNecocheaZone
      ? 'Zona de tosca somera: el agua satura rápidamente en bajos y cañadones'
      : `Drenaje condicionado por proximidad al ${pred.nearestRiverName}`;
  }

  // Métricas numéricas
  if (inspRain) inspRain.textContent = `+${pred.rainAnomalyPercent}% (${pred.projectedRainMm} mm)`;
  if (inspRiver) {
    inspRiver.textContent = `${pred.riverOverflowPercent}% (${pred.riverOverflowPercent >= 70 ? 'Desborde activo' : 'Crecida'})`;
    inspRiver.className = `m-tile-val ${pred.riverOverflowPercent >= 70 ? 'text-red' : 'text-blue'}`;
  }
  if (inspTraffic) inspTraffic.textContent = `${pred.trafficabilityLossDays} días/mes`;
  if (inspNapa) inspNapa.textContent = `${pred.napaDepthM} m`;

  // Actualizar telemetry pills de cabecera
  const elOni = document.getElementById('telemetryOniVal');
  if (elOni) elOni.textContent = `ONI: +${pred.oniIndex.toFixed(2)} °C`;
}

/**
 * Actualiza la línea de tiempo interactiva
 */
function updateTimelineUI(step) {
  const elPhase = document.getElementById('timelinePhaseTag');
  const elDate = document.getElementById('timelineDisplayDate');
  const elRange = document.getElementById('timelineRange');
  const elStepIdx = document.getElementById('currentStepIdx');

  if (elPhase) elPhase.textContent = step.phaseLabel;
  if (elDate) elDate.textContent = step.dateLabel;
  if (elRange) elRange.value = AppState.currentStepIndex;
  if (elStepIdx) elStepIdx.textContent = AppState.currentStepIndex + 1;

  document.querySelectorAll('.t-tick').forEach(tick => {
    const s = parseInt(tick.getAttribute('data-step'), 10);
    if (s === AppState.currentStepIndex) {
      tick.classList.add('active');
    } else {
      tick.classList.remove('active');
    }
  });
}

/**
 * Actualiza la leyenda inferior del mapa según la capa activa
 */
function updateMiniLegend(mode) {
  const header = document.getElementById('miniLegendHeader');
  const grad = document.getElementById('miniLegendGradient');
  const labels = document.querySelectorAll('.mini-legend-labels span');
  if (!header || !grad) return;

  if (mode === 'plume') {
    header.textContent = 'Tormenta del Súper Niño';
    grad.style.background = 'linear-gradient(90deg, rgba(6,182,212,0.4), rgba(245,158,11,0.7), rgba(239,68,68,0.95))';
    if (labels[0]) labels[0].textContent = 'Normal';
    if (labels[1]) labels[1].textContent = 'Lluvias Fuertes';
    if (labels[2]) labels[2].textContent = 'Tormenta Severa';
  } else if (mode === 'flood') {
    header.textContent = 'Riesgo de Inundación (Relieve)';
    grad.style.background = 'linear-gradient(90deg, #06b6d4, #f59e0b, #ef4444)';
    if (labels[0]) labels[0].textContent = 'Bajo (<25%)';
    if (labels[1]) labels[1].textContent = 'Moderado (50%)';
    if (labels[2]) labels[2].textContent = 'Crítico (>75%)';
  } else if (mode === 'rivers') {
    header.textContent = 'Caudal de Ríos y Cuencas';
    grad.style.background = 'linear-gradient(90deg, #06b6d4, #f59e0b, #ef4444)';
    if (labels[0]) labels[0].textContent = 'Caudal Normal';
    if (labels[1]) labels[1].textContent = 'Alerta Crecida';
    if (labels[2]) labels[2].textContent = 'Desborde Activo';
  } else if (mode === 'satellite') {
    header.textContent = 'Satélite Esri Alta Resolución';
    grad.style.background = 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)';
    if (labels[0]) labels[0].textContent = 'Cobertura';
    if (labels[1]) labels[1].textContent = 'Drenaje';
    if (labels[2]) labels[2].textContent = 'Océano';
  }
}

/**
 * Inicializa todos los eventos de la interfaz
 */
function initUIEventListeners() {
  // 1. Buscador global y regional con autocompletado
  const searchInput = document.getElementById('globalSearchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const btnClearSearch = document.getElementById('btnClearSearch');
  let searchDebounce = null;

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length > 0 && btnClearSearch) btnClearSearch.classList.remove('d-none');
      else if (btnClearSearch) btnClearSearch.classList.add('d-none');

      clearTimeout(searchDebounce);
      if (q.length < 2) {
        searchDropdown.classList.add('d-none');
        searchDropdown.innerHTML = '';
        return;
      }

      searchDebounce = setTimeout(async () => {
        searchDropdown.innerHTML = '<div style="padding:8px 12px; font-size:0.72rem; color:#94a3b8;">Buscando en API Open-Meteo...</div>';
        searchDropdown.classList.remove('d-none');

        const results = await searchLocationByName(q);
        if (results.length === 0) {
          searchDropdown.innerHTML = '<div style="padding:8px 12px; font-size:0.72rem; color:#94a3b8;">No se encontraron localidades.</div>';
          return;
        }

        searchDropdown.innerHTML = results.map(r => `
          <div class="search-result-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}">
            <span class="sr-name">📍 ${r.simpleName}</span>
            <span class="sr-detail">
              <span>${r.admin1 || ''} ${r.country ? '· ' + r.country : ''}</span>
              <span class="text-cyan">Elev: ${Math.round(r.elevation)} m</span>
            </span>
          </div>
        `).join('');

        searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', async () => {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lon = parseFloat(item.getAttribute('data-lon'));
            const name = item.getAttribute('data-name');

            searchInput.value = name;
            searchDropdown.classList.add('d-none');

            AppState.currentLocationKey = null;
            AppState.currentCoords = { lat, lon };
            flyToCoordinates(lat, lon, 9);
            await updateAllState(false);
          });
        });
      }, 350);
    });

    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchDropdown.classList.add('d-none');
        btnClearSearch.classList.add('d-none');
      });
    }

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.add('d-none');
      }
    });
  }

  // 2. Botón Foco Necochea Inmediato
  const btnFocusNecochea = document.getElementById('btnFocusNecochea');
  if (btnFocusNecochea) {
    btnFocusNecochea.addEventListener('click', async () => {
      AppState.currentLocationKey = 'necochea';
      const loc = KEY_LOCATIONS.necochea;
      AppState.currentCoords = { lat: loc.lat, lon: loc.lon };
      flyToLocation('necochea');
      await updateAllState(false);
    });
  }

  // 3. Toggles de Cajones Laterales (Mobile & Desktop)
  const panelLayers = document.getElementById('panelLayers');
  const panelInspector = document.getElementById('panelInspector');
  const btnToggleLayers = document.getElementById('btnToggleLayers');
  const btnToggleInspector = document.getElementById('btnToggleInspector');
  const btnCloseLayers = document.getElementById('btnCloseLayers');
  const btnCloseInspector = document.getElementById('btnCloseInspector');

  const togglePanel = (panel, btn) => {
    if (!panel) return;
    const isHidden = panel.classList.contains('panel-hidden');
    if (isHidden) {
      panel.classList.remove('panel-hidden');
      btn?.classList.add('active-btn');
    } else {
      panel.classList.add('panel-hidden');
      btn?.classList.remove('active-btn');
    }
  };

  btnToggleLayers?.addEventListener('click', () => togglePanel(panelLayers, btnToggleLayers));
  btnToggleInspector?.addEventListener('click', () => togglePanel(panelInspector, btnToggleInspector));
  btnCloseLayers?.addEventListener('click', () => togglePanel(panelLayers, btnToggleLayers));
  btnCloseInspector?.addEventListener('click', () => togglePanel(panelInspector, btnToggleInspector));

  // 4. Selector de Capas Únicas (una por una)
  const layerRadioButtons = document.querySelectorAll('.layer-radio-btn');
  layerRadioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-layer-mode');
      if (!mode) return;

      layerRadioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      AppState.activeLayerMode = mode;
      setActiveLayerMode(mode);
      updateMiniLegend(mode);
    });
  });

  // 5. Selector de Escenarios ENSO
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentScenario = btn.getAttribute('data-scenario');
      await updateAllState(false);
    });
  });

  // 6. Línea de Tiempo y Reproductor de Avance
  const timelineRange = document.getElementById('timelineRange');
  if (timelineRange) {
    timelineRange.addEventListener('input', async (e) => {
      AppState.currentStepIndex = parseInt(e.target.value, 10);
      await updateAllState(false);
    });
  }

  document.querySelectorAll('.t-tick').forEach(tick => {
    tick.addEventListener('click', async () => {
      AppState.currentStepIndex = parseInt(tick.getAttribute('data-step'), 10);
      await updateAllState(false);
    });
  });

  const btnPrev = document.getElementById('btnPrevMonth');
  const btnNext = document.getElementById('btnNextMonth');

  btnPrev?.addEventListener('click', async () => {
    if (AppState.currentStepIndex > 0) {
      AppState.currentStepIndex--;
      await updateAllState(false);
    }
  });

  btnNext?.addEventListener('click', async () => {
    if (AppState.currentStepIndex < TIMELINE_STEPS.length - 1) {
      AppState.currentStepIndex++;
      await updateAllState(false);
    }
  });

  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');

  btnPlayPause?.addEventListener('click', () => {
    AppState.isPlaying = !AppState.isPlaying;
    if (AppState.isPlaying) {
      iconPlay?.classList.add('d-none');
      iconPause?.classList.remove('d-none');
      AppState.playTimer = setInterval(async () => {
        AppState.currentStepIndex = (AppState.currentStepIndex + 1) % TIMELINE_STEPS.length;
        await updateAllState(false);
      }, 3000);
    } else {
      clearInterval(AppState.playTimer);
      iconPlay?.classList.remove('d-none');
      iconPause?.classList.add('d-none');
    }
  });

  // 7. Modal de Informe Técnico
  const exportModal = document.getElementById('exportModal');
  const btnExport = document.getElementById('btnExportReport');
  const btnCloseExport = document.getElementById('btnCloseExportModal');
  const btnCancelExport = document.getElementById('btnCancelExportModal');
  const btnPrint = document.getElementById('btnPrintReport');
  const printContainer = document.getElementById('printableReport');

  btnExport?.addEventListener('click', () => {
    if (printContainer && AppState.activePrediction) {
      const loc = AppState.currentLocationKey && KEY_LOCATIONS[AppState.currentLocationKey]
        ? KEY_LOCATIONS[AppState.currentLocationKey]
        : { name: `Lote en (${AppState.currentCoords.lat.toFixed(2)}°, ${AppState.currentCoords.lon.toFixed(2)}°)` };

      printContainer.innerHTML = generateTechnicalReportContent(
        AppState.activePrediction,
        AppState.liveWeatherData,
        loc
      );
      exportModal?.classList.remove('d-none');
    }
  });

  btnCloseExport?.addEventListener('click', () => exportModal?.classList.add('d-none'));
  btnCancelExport?.addEventListener('click', () => exportModal?.classList.add('d-none'));
  btnPrint?.addEventListener('click', () => window.print());
}
