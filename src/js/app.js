/**
 * SISTEMA PREDICTOR DE IMPACTO HIDRO-AGRÍCOLA DEL SÚPER NIÑO (SPIHA-Niño)
 * Controlador Central y Manejador de Estado Reactivo
 */

import { fetchLiveWeatherAndSoil, searchLocationByName, KEY_LOCATIONS } from './api.js';
import { TIMELINE_STEPS, evaluatePointConditions } from './simulation.js';
import { generateTechnicalReportContent } from './agroEngine.js';
import {
  initAgroMap,
  flyToLocation,
  flyToCoordinates,
  updateSimulationTimeline,
  toggleSatelliteBasemap,
  setLayerMixerProperty
} from './map.js';

// Estado global de la aplicación
const AppState = {
  currentLocationKey: 'necochea',
  currentCoords: { lat: -38.5545, lon: -58.7396 },
  currentStepIndex: 0,
  currentScenario: 'super',
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
  const inspAdviceList = document.getElementById('inspAdviceList');

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

  // Pautas directas para el productor
  if (inspAdviceList) {
    const isNec = pred.isNecocheaZone;
    const isPeak = AppState.currentStepIndex === 2;

    inspAdviceList.innerHTML = `
      <li><strong>Cebada & Trigo:</strong> ${isPeak ? 'Trillar de inmediato al 14% de humedad; el temporal genera brotado en espiga y fusariosis.' : 'Monitorear sanidad de espiga y realizar fungicida doble anticipado.'}</li>
      <li><strong>Maíz & Soja:</strong> ${pred.floodRiskPercent > 60 ? 'Fraccionar fertilización nitrogenada en lomas para evitar lixiviación; evitar siembras en cubetas.' : 'Aprovechar la alta oferta hídrica en lomas bien canalizadas.'}</li>
      <li><strong>Logística & Hacienda:</strong> ${isNec ? 'Trasladar silo-bolsas a cabeceras de loma entoscadas con acceso firme hacia el Puerto Quequén.' : 'Retirar animales de cañadones y bajos ante riesgo de anegamiento repentino.'}</li>
    `;
  }

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
  const panelMixer = document.getElementById('panelMixer');
  const panelInspector = document.getElementById('panelInspector');
  const btnToggleMixer = document.getElementById('btnToggleMixer');
  const btnToggleInspector = document.getElementById('btnToggleInspector');
  const btnCloseMixer = document.getElementById('btnCloseMixer');
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

  btnToggleMixer?.addEventListener('click', () => togglePanel(panelMixer, btnToggleMixer));
  btnToggleInspector?.addEventListener('click', () => togglePanel(panelInspector, btnToggleInspector));
  btnCloseMixer?.addEventListener('click', () => togglePanel(panelMixer, btnToggleMixer));
  btnCloseInspector?.addEventListener('click', () => togglePanel(panelInspector, btnToggleInspector));

  // 4. Mezclador de Capas (Switches y Sliders de Opacidad)
  const chkFlood = document.getElementById('chkFloodHeatmap');
  const rngFlood = document.getElementById('rngFloodOpacity');
  const lblFlood = document.getElementById('lblFloodOpacity');

  if (chkFlood && rngFlood) {
    chkFlood.addEventListener('change', (e) => setLayerMixerProperty('floodHeatmap', 'enabled', e.target.checked));
    rngFlood.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      if (lblFlood) lblFlood.textContent = `${e.target.value}%`;
      setLayerMixerProperty('floodHeatmap', 'opacity', val);
    });
  }

  const chkPlume = document.getElementById('chkEnsoPlume');
  const rngPlume = document.getElementById('rngPlumeOpacity');
  const lblPlume = document.getElementById('lblPlumeOpacity');

  if (chkPlume && rngPlume) {
    chkPlume.addEventListener('change', (e) => setLayerMixerProperty('ensoPlume', 'enabled', e.target.checked));
    rngPlume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      if (lblPlume) lblPlume.textContent = `${e.target.value}%`;
      setLayerMixerProperty('ensoPlume', 'opacity', val);
    });
  }

  const chkRiver = document.getElementById('chkRiverFlow');
  const rngRiver = document.getElementById('rngRiverOpacity');
  const lblRiver = document.getElementById('lblRiverOpacity');

  if (chkRiver && rngRiver) {
    chkRiver.addEventListener('change', (e) => setLayerMixerProperty('riverFlow', 'enabled', e.target.checked));
    rngRiver.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 100;
      if (lblRiver) lblRiver.textContent = `${e.target.value}%`;
      setLayerMixerProperty('riverFlow', 'opacity', val);
    });
  }

  const chkSat = document.getElementById('chkSatellite');
  if (chkSat) {
    chkSat.addEventListener('change', (e) => toggleSatelliteBasemap(e.target.checked));
  }

  // 5. Selector de Escenarios
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

  // 7. Modales de Guía e Informe
  const guideModal = document.getElementById('guideModal');
  const btnOpenGuide = document.getElementById('btnOpenGuideModal');
  const btnCloseGuide = document.getElementById('btnCloseGuideModal');
  const btnGotItGuide = document.getElementById('btnGotItGuide');

  btnOpenGuide?.addEventListener('click', () => guideModal?.classList.remove('d-none'));
  btnCloseGuide?.addEventListener('click', () => guideModal?.classList.add('d-none'));
  btnGotItGuide?.addEventListener('click', () => guideModal?.classList.add('d-none'));

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
