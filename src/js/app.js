/**
 * AURA-NIÑO AGRO 2026 - MASTER APPLICATION CONTROLLER
 * Orquestador principal de estado, eventos, interfaz y sincronización de datos.
 */

import { fetchLiveWeatherAndSoil, searchLocationByName, KEY_LOCATIONS } from './api.js';
import { TIMELINE_STEPS, calculateAgroPrediction, calculatePointPrediction } from './simulation.js';
import { generateAgroAdvisory, generateTechnicalReportContent } from './agroEngine.js';
import { renderAllCharts } from './charts.js';
import {
  initAgroMap,
  flyToLocation,
  flyToCoordinates,
  updateMapSimulationState,
  toggleSatelliteBasemap,
  toggleBasinsLayer,
  toggleReliefLayer
} from './map.js';

// Estado global de la aplicación
const AppState = {
  currentLocationKey: 'necochea',
  currentCoords: { lat: -38.5545, lon: -58.7396 },
  currentStepIndex: 0,
  currentScenario: 'super',
  activeLayer: 'risk',
  isPlaying: false,
  playTimer: null,
  liveWeatherData: null,
  activePrediction: null
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  initUIEventListeners();
  initMapComponent();
  await updateAllState(true);
});

/**
 * Inicializa el componente de mapa
 */
function initMapComponent() {
  initAgroMap('agroMap', async (lat, lon, knownLocationKey) => {
    AppState.currentCoords = { lat, lon };
    if (knownLocationKey) {
      AppState.currentLocationKey = knownLocationKey;
      const select = document.getElementById('locationSelector');
      if (select) select.value = knownLocationKey;
    } else {
      AppState.currentLocationKey = null;
    }
    await updateAllState(false);
  });
}

/**
 * Actualiza todo el estado: clima en vivo, simulación hidrológica, gráficos y UI
 */
async function updateAllState(shouldFlyMap = false) {
  const step = TIMELINE_STEPS[AppState.currentStepIndex];
  const locationInfo = AppState.currentLocationKey
    ? KEY_LOCATIONS[AppState.currentLocationKey]
    : {
        name: `Punto Lote (${AppState.currentCoords.lat.toFixed(3)}, ${AppState.currentCoords.lon.toFixed(3)})`,
        basin: 'Cuenca local de drenaje',
        elevation: 25,
        regionalVulnerability: 0.8
      };

  // 1. Obtener datos de la API pública Open-Meteo
  AppState.liveWeatherData = await fetchLiveWeatherAndSoil(
    AppState.currentCoords.lat,
    AppState.currentCoords.lon
  );

  // 2. Calcular predicción agroclimática según relieve, napa y anomalía
  if (AppState.currentLocationKey === 'necochea' || AppState.currentLocationKey === 'tres_arroyos' || AppState.currentLocationKey === 'balcarce') {
    AppState.activePrediction = calculateAgroPrediction('sudeste_ba', AppState.currentStepIndex, AppState.currentScenario);
  } else if (AppState.currentLocationKey) {
    AppState.activePrediction = calculateAgroPrediction(AppState.currentLocationKey, AppState.currentStepIndex, AppState.currentScenario);
  } else {
    AppState.activePrediction = calculatePointPrediction(
      AppState.currentCoords.lat,
      AppState.currentCoords.lon,
      AppState.currentStepIndex,
      AppState.currentScenario
    );
  }

  // 3. Actualizar la cartografía Leaflet
  updateMapSimulationState(AppState.activeLayer, AppState.currentStepIndex, AppState.currentScenario);
  if (shouldFlyMap && AppState.currentLocationKey) {
    flyToLocation(AppState.currentLocationKey);
  }

  // 4. Actualizar la tarjeta de la Sonda Activa
  updateProbeCardUI(locationInfo, AppState.activePrediction, AppState.liveWeatherData);

  // 5. Actualizar el indicador temporal y badges
  updateTimelineUI(step);

  // 6. Actualizar las recomendaciones agronómicas para productores
  updateAgroAdvisoryUI(AppState.activePrediction, AppState.currentLocationKey);

  // 7. Actualizar los gráficos interactivos
  renderAllCharts(AppState.activePrediction, AppState.currentScenario, AppState.currentStepIndex);

  // 8. Actualizar la leyenda del mapa
  updateLegendUI();
}

/**
 * Actualiza la tarjeta de la Sonda en el panel izquierdo
 */
function updateProbeCardUI(locationInfo, pred, live) {
  const elCoords = document.getElementById('probeCoords');
  const elName = document.getElementById('probeLocationName');
  const elRisk = document.getElementById('probeRiskVal');
  const elNapa = document.getElementById('probeNapaVal');
  const elRain = document.getElementById('probeRainVal');
  const elTraffic = document.getElementById('probeTrafficVal');

  if (elCoords) elCoords.textContent = `${AppState.currentCoords.lat.toFixed(2)}°S, ${AppState.currentCoords.lon.toFixed(2)}°W`;
  if (elName) elName.textContent = locationInfo.name;
  if (elRisk) {
    elRisk.textContent = `${pred.riskIndex}% (${pred.riskLevel.split('/')[0].trim()})`;
    elRisk.className = `p-stat-val ${pred.riskIndex >= 70 ? 'text-red' : pred.riskIndex >= 45 ? 'text-amber' : 'text-green'}`;
  }
  if (elNapa) {
    elNapa.textContent = `${pred.napaDepthM} m`;
    elNapa.className = `p-stat-val ${pred.napaDepthM < 0.8 ? 'text-cyan' : 'text-bright'}`;
  }
  if (elRain) {
    elRain.textContent = `+${pred.rainAnomalyPercent}% (${pred.projectedRainMm} mm)`;
    elRain.className = `p-stat-val ${pred.rainAnomalyPercent > 50 ? 'text-blue' : 'text-bright'}`;
  }
  if (elTraffic) {
    elTraffic.textContent = `${pred.trafficabilityLossDays} días/mes`;
    elTraffic.className = `p-stat-val ${pred.trafficabilityLossDays > 12 ? 'text-amber' : 'text-bright'}`;
  }

  // Actualizar telemetry pills de la barra superior
  const elOni = document.getElementById('telemetryOniVal');
  if (elOni) elOni.textContent = `ONI: +${pred.oniVal.toFixed(2)} °C`;

  const elApiStatus = document.getElementById('telemetryApiStatus');
  if (elApiStatus && live) {
    elApiStatus.innerHTML = live.isLive
      ? `<span class="pulse-indicator bg-green"></span> OPEN-METEO ONLINE (${live.currentTemp}°C)`
      : `<span class="pulse-indicator bg-amber"></span> MODELO SMN SINÓPTICO`;
  }
}

/**
 * Actualiza la interfaz del reproductor de línea de tiempo
 */
function updateTimelineUI(step) {
  const elPhase = document.getElementById('timelinePhaseTag');
  const elDate = document.getElementById('timelineDisplayDate');
  const elEnso = document.getElementById('timelineEnsoIndex');
  const elRange = document.getElementById('timelineRange');
  const elStepIdx = document.getElementById('currentStepIdx');

  if (elPhase) elPhase.textContent = step.phaseLabel;
  if (elDate) elDate.textContent = step.dateLabel;
  if (elEnso) elEnso.textContent = `Índice Térmico ONI: +${AppState.activePrediction.oniVal.toFixed(2)} °C | Súper Niño`;
  if (elRange) elRange.value = AppState.currentStepIndex;
  if (elStepIdx) elStepIdx.textContent = AppState.currentStepIndex + 1;

  // Actualizar tildes visuales de la barra
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
 * Renderiza el acordeón de tarjetas de recomendación agronómica
 */
function updateAgroAdvisoryUI(pred, locationKey) {
  const container = document.getElementById('advisoryCards');
  const title = document.getElementById('advisoryTitle');
  const riskBadge = document.getElementById('advisoryRiskLevel');

  if (title) {
    title.textContent = `Decisiones: ${locationKey === 'necochea' ? 'Necochea & Mar y Sierras' : pred.regionName}`;
  }

  if (riskBadge) {
    riskBadge.textContent = pred.riskLevel;
    riskBadge.className = pred.riskIndex >= 70 ? 'badge-alert-high bg-red' : pred.riskIndex >= 45 ? 'badge-alert-high bg-amber' : 'badge-alert-high bg-green';
  }

  if (!container) return;

  const advisories = generateAgroAdvisory(pred, locationKey);
  container.innerHTML = advisories.map(adv => `
    <div class="crop-card">
      <div class="crop-card-header">
        <div class="crop-title-group">
          <span class="crop-icon-badge">${adv.icon}</span>
          <span class="crop-name">${adv.crop}</span>
        </div>
        <span class="crop-status-pill ${adv.statusClass}">${adv.status}</span>
      </div>
      <p class="crop-advisory-text">${adv.text}</p>
      <ul class="crop-actions-list">
        ${adv.actions.map(action => `<li class="crop-action-item">${action}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/**
 * Actualiza la leyenda inferior del mapa según la capa seleccionada
 */
function updateLegendUI() {
  const title = document.getElementById('legendTitle');
  const min = document.getElementById('legendMin');
  const mid = document.getElementById('legendMid');
  const max = document.getElementById('legendMax');
  const gradient = document.getElementById('legendGradient');
  const note = document.getElementById('legendNote');

  if (!title) return;

  if (AppState.activeLayer === 'risk') {
    title.textContent = 'Riesgo de Anegamiento & Inundación';
    min.textContent = 'Bajo (0%)';
    mid.textContent = 'Moderado (50%)';
    max.textContent = 'Crítico (100%)';
    gradient.style.background = 'linear-gradient(90deg, #10b981 0%, #3b82f6 40%, #f59e0b 70%, #ef4444 100%)';
    note.textContent = 'Basado en elevación, pendiente, proximidad de napa y tosca subsuperficial';
  } else if (AppState.activeLayer === 'rainfall') {
    title.textContent = 'Anomalía de Precipitación Súper Niño';
    min.textContent = '+0% Normal';
    mid.textContent = '+50%';
    max.textContent = '+120% Torrencial';
    gradient.style.background = 'linear-gradient(90deg, #10b981 0%, #06b6d4 40%, #2563eb 70%, #1e3a8a 100%)';
    note.textContent = 'Desviación porcentual respecto a la media histórica 1991-2020';
  } else if (AppState.activeLayer === 'water_table') {
    title.textContent = 'Profundidad de Napa Freática';
    min.textContent = 'Profunda (>2.5m)';
    mid.textContent = 'Cuidado (1.2m)';
    max.textContent = 'A flor de suelo (<0.4m)';
    gradient.style.background = 'linear-gradient(90deg, #0f766e 0%, #0284c7 50%, #06b6d4 100%)';
    note.textContent = 'Nivel estimado de saturación subterránea en metros bajo suelo';
  } else if (AppState.activeLayer === 'soil_moisture') {
    title.textContent = 'Humedad de Suelo (% Capacidad de Campo)';
    min.textContent = '50% Óptimo';
    mid.textContent = '80% Húmedo';
    max.textContent = '100% Saturado';
    gradient.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 60%, #047857 100%)';
    note.textContent = 'Humedad volumétrica en perfil 0-100cm integrado con Open-Meteo';
  } else if (AppState.activeLayer === 'trafficability') {
    title.textContent = 'Alerta de Pérdida de Piso (Días/Mes)';
    min.textContent = '0 - 5 días';
    mid.textContent = '10 - 15 días';
    max.textContent = '>20 días (Sin Tránsito)';
    gradient.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)';
    note.textContent = 'Días inhábiles para labores de cosecha, siembra y pulverización';
  }
}

/**
 * Inicializa todos los eventos de interacción de la UI
 */
function initUIEventListeners() {
  // Selector de Localidad
  const locationSelect = document.getElementById('locationSelector');
  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      AppState.currentLocationKey = e.target.value;
      const loc = KEY_LOCATIONS[AppState.currentLocationKey];
      if (loc) {
        AppState.currentCoords = { lat: loc.lat, lon: loc.lon };
        flyToLocation(AppState.currentLocationKey);
      }
    });
  }

  // Botón Foco Necochea Inmediato
  const btnFocusNecochea = document.getElementById('btnFocusNecochea');
  if (btnFocusNecochea) {
    btnFocusNecochea.addEventListener('click', () => {
      AppState.currentLocationKey = 'necochea';
      if (locationSelect) locationSelect.value = 'necochea';
      const loc = KEY_LOCATIONS.necochea;
      AppState.currentCoords = { lat: loc.lat, lon: loc.lon };
      flyToLocation('necochea');

      // Cambiar automáticamente a la pestaña especial de Necochea
      const necTabBtn = document.querySelector('[data-tab="necochea"]');
      if (necTabBtn) necTabBtn.click();
    });
  }

  // Capas de análisis (Layer buttons)
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeLayer = btn.getAttribute('data-layer');
      updateMapSimulationState(AppState.activeLayer, AppState.currentStepIndex, AppState.currentScenario);
      updateLegendUI();
    });
  });

  // Escenarios predictivos
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentScenario = btn.getAttribute('data-scenario');
      await updateAllState(false);
    });
  });

  // Switches cartográficos
  const chkSatellite = document.getElementById('chkBasemapSatellite');
  if (chkSatellite) {
    chkSatellite.addEventListener('change', (e) => {
      toggleSatelliteBasemap(e.target.checked);
    });
  }

  const chkBasins = document.getElementById('chkShowBasins');
  if (chkBasins) {
    chkBasins.addEventListener('change', (e) => {
      toggleBasinsLayer(e.target.checked);
    });
  }

  const chkRelief = document.getElementById('chkShowRelief');
  if (chkRelief) {
    chkRelief.addEventListener('change', (e) => {
      toggleReliefLayer(e.target.checked);
    });
  }

  // Controles de Línea de Tiempo
  const timelineRange = document.getElementById('timelineRange');
  if (timelineRange) {
    timelineRange.addEventListener('input', async (e) => {
      AppState.currentStepIndex = parseInt(e.target.value, 10);
      await updateAllState(false);
    });
  }

  // Ticks de la línea de tiempo
  document.querySelectorAll('.t-tick').forEach(tick => {
    tick.addEventListener('click', async () => {
      AppState.currentStepIndex = parseInt(tick.getAttribute('data-step'), 10);
      await updateAllState(false);
    });
  });

  const btnPrev = document.getElementById('btnPrevMonth');
  if (btnPrev) {
    btnPrev.addEventListener('click', async () => {
      if (AppState.currentStepIndex > 0) {
        AppState.currentStepIndex--;
        await updateAllState(false);
      }
    });
  }

  const btnNext = document.getElementById('btnNextMonth');
  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      if (AppState.currentStepIndex < TIMELINE_STEPS.length - 1) {
        AppState.currentStepIndex++;
        await updateAllState(false);
      }
    });
  }

  // Reproductor automático de evolución temporal
  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = btnPlayPause?.querySelector('.icon-play');
  const iconPause = btnPlayPause?.querySelector('.icon-pause');

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      AppState.isPlaying = !AppState.isPlaying;
      if (AppState.isPlaying) {
        iconPlay?.classList.add('d-none');
        iconPause?.classList.remove('d-none');
        AppState.playTimer = setInterval(async () => {
          AppState.currentStepIndex = (AppState.currentStepIndex + 1) % TIMELINE_STEPS.length;
          await updateAllState(false);
        }, 3200);
      } else {
        clearInterval(AppState.playTimer);
        iconPlay?.classList.remove('d-none');
        iconPause?.classList.add('d-none');
      }
    });
  }

  // Buscador predictivo global y regional
  const searchInput = document.getElementById('globalSearchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const btnClearSearch = document.getElementById('btnClearSearch');
  let searchDebounceTimer = null;

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length > 0 && btnClearSearch) {
        btnClearSearch.classList.remove('d-none');
      } else if (btnClearSearch) {
        btnClearSearch.classList.add('d-none');
      }

      clearTimeout(searchDebounceTimer);
      if (q.length < 2) {
        searchDropdown.classList.add('d-none');
        searchDropdown.innerHTML = '';
        return;
      }

      searchDebounceTimer = setTimeout(async () => {
        searchDropdown.innerHTML = '<div style="padding:10px; font-size:0.75rem; color:#94a3b8;">Buscando en API Open-Meteo...</div>';
        searchDropdown.classList.remove('d-none');

        const results = await searchLocationByName(q);
        if (results.length === 0) {
          searchDropdown.innerHTML = '<div style="padding:10px; font-size:0.75rem; color:#94a3b8;">No se encontraron localidades. Intenta con otro nombre.</div>';
          return;
        }

        searchDropdown.innerHTML = results.map(item => `
          <div class="search-result-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.name}">
            <span class="sr-name">📍 ${item.simpleName}</span>
            <span class="sr-detail">
              <span>${item.admin1 || ''} ${item.country ? '· ' + item.country : ''}</span>
              <span class="text-cyan">Elev: ${Math.round(item.elevation)} m</span>
            </span>
          </div>
        `).join('');

        searchDropdown.querySelectorAll('.search-result-item').forEach(itemEl => {
          itemEl.addEventListener('click', async () => {
            const lat = parseFloat(itemEl.getAttribute('data-lat'));
            const lon = parseFloat(itemEl.getAttribute('data-lon'));
            const name = itemEl.getAttribute('data-name');

            searchInput.value = name;
            searchDropdown.classList.add('d-none');

            // Volar y seleccionar coordenadas en el mapa
            AppState.currentLocationKey = null;
            AppState.currentCoords = { lat, lon };
            if (locationSelect) locationSelect.value = '';

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

    // Ocultar dropdown al hacer clic afuera
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.add('d-none');
      }
    });
  }

  // Tabs del panel lateral derecho
  document.querySelectorAll('.panel-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabTarget = btn.getAttribute('data-tab');
      if (tabTarget === 'decisions') document.getElementById('tabDecisions')?.classList.add('active');
      else if (tabTarget === 'telemetry') document.getElementById('tabTelemetry')?.classList.add('active');
      else if (tabTarget === 'necochea') document.getElementById('tabNecochea')?.classList.add('active');
      else if (tabTarget === 'guide') document.getElementById('tabGuide')?.classList.add('active');
    });
  });

  // Botón refrescar con Open-Meteo
  const btnRefreshOpenMeteo = document.getElementById('btnRefreshOpenMeteo');
  if (btnRefreshOpenMeteo) {
    btnRefreshOpenMeteo.addEventListener('click', async () => {
      btnRefreshOpenMeteo.classList.add('spin-on-click');
      await updateAllState(false);
      setTimeout(() => btnRefreshOpenMeteo.classList.remove('spin-on-click'), 600);
    });
  }

  // Modal de Exportación de Informe Técnico
  const btnExport = document.getElementById('btnExportReport');
  const modal = document.getElementById('exportModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const btnPrint = document.getElementById('btnPrintReport');
  const printableContainer = document.getElementById('printableReport');

  if (btnExport && modal) {
    btnExport.addEventListener('click', () => {
      const loc = AppState.currentLocationKey
        ? KEY_LOCATIONS[AppState.currentLocationKey]
        : { name: `Lote (${AppState.currentCoords.lat.toFixed(2)}, ${AppState.currentCoords.lon.toFixed(2)})` };

      printableContainer.innerHTML = generateTechnicalReportContent(
        AppState.activePrediction,
        AppState.liveWeatherData,
        loc
      );
      modal.classList.remove('d-none');
    });
  }

  const closeModal = () => modal?.classList.add('d-none');
  btnCloseModal?.addEventListener('click', closeModal);
  btnCancelModal?.addEventListener('click', closeModal);

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}
