/**
 * AURA-NIÑO AGRO 2026 - CHARTS & TELEMETRY CONTROLLER
 * Renderizado de gráficos interactivos con Chart.js para telemetría hidrológica.
 */

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let rainChartInstance = null;
let napaChartInstance = null;
let ensoChartInstance = null;

const CHART_DEFAULTS = {
  color: '#94a3b8',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  font: {
    family: "'Outfit', sans-serif",
    size: 10
  }
};

/**
 * Inicializa o actualiza los 3 gráficos de telemetría
 */
export function renderAllCharts(regionData, scenarioKey = 'super', currentStepIdx = 0) {
  renderRainfallChart(regionData, scenarioKey, currentStepIdx);
  renderNapaChart(regionData, scenarioKey, currentStepIdx);
  renderEnsoChart(scenarioKey, currentStepIdx);
}

function renderRainfallChart(regionData, scenarioKey, currentStepIdx) {
  const ctx = document.getElementById('chartRainfall');
  if (!ctx) return;

  const labels = ['Nov', 'Dic', 'Ene', 'Feb/Mar', 'May/Jun', 'Post-Niño'];
  const normals = [85, 100, 95, 85, 55, 45]; // Base promedio mensual pampeano

  // Proyecciones según multiplicador de escenario
  const scenMul = scenarioKey === 'super' ? 1.75 : scenarioKey === 'strong' ? 1.45 : 1.15;
  const projected = normals.map((n, i) => {
    // Pico en Ene/Feb para el sur
    const peakFactor = (i === 1 || i === 2) ? 1.25 : 1.0;
    return Math.round(n * scenMul * peakFactor);
  });

  if (rainChartInstance) {
    rainChartInstance.data.datasets[0].data = projected;
    rainChartInstance.data.datasets[1].data = normals;
    rainChartInstance.update();
    return;
  }

  rainChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Proyección Súper Niño (mm)',
          data: projected,
          backgroundColor: labels.map((_, i) => i === currentStepIdx ? '#06b6d4' : 'rgba(6, 182, 212, 0.55)'),
          borderColor: '#22d3ee',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Media Histórica (1991-2020)',
          data: normals,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 8, font: { size: 9 }, color: '#cbd5e1' }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 16, 27, 0.9)',
          borderColor: '#06b6d4',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        },
        y: {
          grid: { color: CHART_DEFAULTS.borderColor },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        }
      }
    }
  });
}

function renderNapaChart(regionData, scenarioKey, currentStepIdx) {
  const ctx = document.getElementById('chartNapa');
  if (!ctx) return;

  const labels = ['Nov', 'Dic', 'Ene', 'Feb/Mar', 'May/Jun', 'Post-Niño'];
  // Profundidad de napa en metros bajo superficie (0m = superficie del suelo)
  const napaCurve = scenarioKey === 'super'
    ? [2.1, 1.4, 0.45, 0.60, 1.3, 2.2]
    : scenarioKey === 'strong'
    ? [2.1, 1.6, 0.85, 1.00, 1.5, 2.3]
    : [2.1, 1.8, 1.25, 1.40, 1.8, 2.4];

  if (napaChartInstance) {
    napaChartInstance.data.datasets[0].data = napaCurve;
    napaChartInstance.update();
    return;
  }

  napaChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Profundidad de Napa (m bajo suelo)',
          data: napaCurve,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: labels.map((_, i) => i === currentStepIdx ? '#ffffff' : '#10b981'),
          pointBorderColor: '#10b981',
          pointRadius: labels.map((_, i) => i === currentStepIdx ? 6 : 3)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          reverse: true, // 0 en la parte superior para mostrar cercanía a superficie
          title: { display: true, text: 'Superficie (0m) ➔ Profundidad', font: { size: 9 }, color: '#94a3b8' },
          grid: { color: CHART_DEFAULTS.borderColor },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        },
        x: {
          grid: { display: false },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 16, 27, 0.9)',
          borderColor: '#10b981',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `Profundidad: ${ctx.parsed.y} metros bajo suelo`
          }
        }
      }
    }
  });
}

function renderEnsoChart(scenarioKey, currentStepIdx) {
  const ctx = document.getElementById('chartEnso');
  if (!ctx) return;

  const labels = ['Nov', 'Dic', 'Ene', 'Feb/Mar', 'May/Jun', 'Post-Niño'];
  const onis = scenarioKey === 'super'
    ? [2.35, 2.48, 2.58, 2.15, 1.15, -0.20]
    : scenarioKey === 'strong'
    ? [2.05, 2.15, 2.20, 1.85, 0.90, 0.00]
    : [1.65, 1.70, 1.75, 1.40, 0.60, 0.10];

  if (ensoChartInstance) {
    ensoChartInstance.data.datasets[0].data = onis;
    ensoChartInstance.update();
    return;
  }

  ensoChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Índice ONI (°C)',
          data: onis,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: labels.map((_, i) => i === currentStepIdx ? '#ffffff' : '#ef4444'),
          pointBorderColor: '#ef4444',
          pointRadius: labels.map((_, i) => i === currentStepIdx ? 6 : 3)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          suggestedMin: -0.5,
          suggestedMax: 3.0,
          grid: { color: CHART_DEFAULTS.borderColor },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        },
        x: {
          grid: { display: false },
          ticks: { color: CHART_DEFAULTS.color, font: CHART_DEFAULTS.font }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 16, 27, 0.9)',
          borderColor: '#ef4444',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `Anomalía ONI: +${ctx.parsed.y} °C`
          }
        }
      }
    }
  });
}
