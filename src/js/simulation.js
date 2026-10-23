/**
 * AURA-NIÑO AGRO 2026 - SIMULATION & CLIMATIC PREDICTIVE ENGINE
 * Algoritmos de propagación temporal del fenómeno Súper Niño en Argentina,
 * modelado hidrológico por relieve y dinámica de napas freáticas.
 */

export const TIMELINE_STEPS = [
  {
    step: 0,
    monthKey: 'actual',
    dateLabel: 'Noviembre 2026 (Mes Actual)',
    phaseLabel: 'FASE: DESARROLLO INICIAL & CONVERGENCIA LITORAL',
    oniIndex: 2.35,
    summary: 'Foco inicial en Mesopotamia y Norte de Buenos Aires. En Necochea y sudeste bonaerense la recarga es moderada; lo peor del frente no impactó aún.',
    scenarios: {
      super: { oni: 2.35, globalRainAnomaly: 35, napaRiseGlobal: 0.25 },
      strong: { oni: 2.05, globalRainAnomaly: 25, napaRiseGlobal: 0.18 },
      modoki: { oni: 1.65, globalRainAnomaly: 15, napaRiseGlobal: 0.10 }
    }
  },
  {
    step: 1,
    monthKey: 'plus_1',
    dateLabel: 'Diciembre 2026 (+1 Mes)',
    phaseLabel: 'FASE: EXPANSIÓN HACIA LA ZONA NÚCLEO Y CUENCA DEL SALADO',
    oniIndex: 2.48,
    summary: 'Inestabilidad convectiva generalizada. Napas suben fuertemente en el centro bonaerense y sur de Santa Fe. Primeras tormentas intensas en Mar y Sierras.',
    scenarios: {
      super: { oni: 2.48, globalRainAnomaly: 65, napaRiseGlobal: 0.55 },
      strong: { oni: 2.15, globalRainAnomaly: 45, napaRiseGlobal: 0.40 },
      modoki: { oni: 1.70, globalRainAnomaly: 25, napaRiseGlobal: 0.20 }
    }
  },
  {
    step: 2,
    monthKey: 'plus_2',
    dateLabel: 'Enero/Febrero 2027 (+2 Meses)',
    phaseLabel: 'FASE: PICO MÁXIMO SÚPER NIÑO (IMPACTO SUR BONAERENSE)',
    oniIndex: 2.58,
    summary: '¡PICO CRÍTICO EN NECOCHEA Y SUDESTE! Colapso de drenaje por tosca subyacente. Lluvias torrenciales en la Cuenca del Quequén Grande. Anegamientos graves en bajos.',
    scenarios: {
      super: { oni: 2.58, globalRainAnomaly: 95, napaRiseGlobal: 0.95 },
      strong: { oni: 2.20, globalRainAnomaly: 60, napaRiseGlobal: 0.65 },
      modoki: { oni: 1.75, globalRainAnomaly: 30, napaRiseGlobal: 0.30 }
    }
  },
  {
    step: 3,
    monthKey: 'plus_3',
    dateLabel: 'Marzo/Abril 2027 (+3 Meses)',
    phaseLabel: 'FASE: COSECHA GRUESA & PERSISTENCIA DE AGUAS ALTAS',
    oniIndex: 2.15,
    summary: 'Dificultad severa de tránsito en lotes (pérdida de piso) durante la cosecha de soja y maíz. Encharcamientos prolongados y problemas en caminos rurales.',
    scenarios: {
      super: { oni: 2.15, globalRainAnomaly: 70, napaRiseGlobal: 0.85 },
      strong: { oni: 1.85, globalRainAnomaly: 45, napaRiseGlobal: 0.55 },
      modoki: { oni: 1.40, globalRainAnomaly: 20, napaRiseGlobal: 0.25 }
    }
  },
  {
    step: 4,
    monthKey: 'plus_6',
    dateLabel: 'Mayo/Junio 2027 (+6 Meses)',
    phaseLabel: 'FASE: DECLIVE DEL EVENTO & TRANSICIÓN HACIA EL INVIERNO',
    oniIndex: 1.15,
    summary: 'Disipación progresiva de la anomalía térmica del Pacífico. Perfil hídrico completamente cargado para implantación de trigo y cebada 2027.',
    scenarios: {
      super: { oni: 1.15, globalRainAnomaly: 25, napaRiseGlobal: 0.40 },
      strong: { oni: 0.90, globalRainAnomaly: 15, napaRiseGlobal: 0.25 },
      modoki: { oni: 0.60, globalRainAnomaly: 5, napaRiseGlobal: 0.10 }
    }
  },
  {
    step: 5,
    monthKey: 'plus_12',
    dateLabel: 'Primavera 2027 (+12 Meses)',
    phaseLabel: 'FASE: SALIDA POST-NIÑO / ESCENARIO NEUTRAL O RETORNO A NIÑA',
    oniIndex: -0.15,
    summary: 'Restablecimiento de la circulación atmosférica normal o descenso hacia fase fría. Las napas retroceden y los suelos equilibran su humedad.',
    scenarios: {
      super: { oni: -0.20, globalRainAnomaly: -5, napaRiseGlobal: -0.30 },
      strong: { oni: 0.00, globalRainAnomaly: 0, napaRiseGlobal: -0.20 },
      modoki: { oni: 0.10, globalRainAnomaly: 0, napaRiseGlobal: -0.10 }
    }
  }
];

/**
 * Regiones agroclimáticas argentinas y parámetros hidrológicos de base
 */
export const AGRO_REGIONS = {
  sudeste_ba: {
    id: 'sudeste_ba',
    name: 'Sudeste Bonaerense / Necochea / Mar y Sierras',
    center: [-38.2, -59.0],
    elevationMsnm: 35,
    slopePercent: 1.2,
    baseWaterTableDepthM: 2.1,
    historicalMonthlyRainMm: [85, 95, 90, 80, 55, 45], // Nov a Abr
    toscaDepthCm: 55, // Presencia de horizonte petrocálcico limitante
    drainageCapacity: 'Media-Baja (Alivio hacia el Océano Atlántico)',
    // Coeficientes de respuesta por etapa del Niño (retraso histórico en el sudeste)
    ensoResponseCurve: [0.35, 0.70, 1.25, 1.05, 0.60, 0.10]
  },
  cuenca_salado: {
    id: 'cuenca_salado',
    name: 'Cuenca del Salado / Centro-Norte Bonaerense',
    center: [-35.8, -60.2],
    elevationMsnm: 55,
    slopePercent: 0.3, // Muy plana, casi sin pendiente
    baseWaterTableDepthM: 1.4,
    historicalMonthlyRainMm: [95, 110, 105, 95, 60, 40],
    toscaDepthCm: 150,
    drainageCapacity: 'Muy Deficiente (Grandes anegamientos históricos)',
    ensoResponseCurve: [0.75, 1.10, 1.20, 1.00, 0.50, 0.05]
  },
  zona_nucleo: {
    id: 'zona_nucleo',
    name: 'Zona Núcleo Pampeana (Pergamino, Marcos Juárez, V. Tuerto)',
    center: [-33.8, -61.2],
    elevationMsnm: 75,
    slopePercent: 0.8,
    baseWaterTableDepthM: 2.4,
    historicalMonthlyRainMm: [110, 125, 120, 100, 50, 35],
    toscaDepthCm: 200,
    drainageCapacity: 'Buena en lomas, cubetas y bajos con riesgo',
    ensoResponseCurve: [0.85, 1.15, 1.10, 0.85, 0.40, 0.0]
  },
  litoral_mesopotamia: {
    id: 'litoral_mesopotamia',
    name: 'Litoral & Mesopotamia (Entre Ríos, Corrientes, Santa Fe N.)',
    center: [-30.5, -59.5],
    elevationMsnm: 45,
    slopePercent: 1.0,
    baseWaterTableDepthM: 1.2,
    historicalMonthlyRainMm: [135, 150, 140, 130, 75, 55],
    toscaDepthCm: 250,
    drainageCapacity: 'Bajo por crecida de ríos Paraná y Uruguay',
    ensoResponseCurve: [1.30, 1.25, 1.05, 0.80, 0.35, -0.05]
  },
  oeste_pampeano: {
    id: 'oeste_pampeano',
    name: 'Oeste Pampeano & Córdoba Sur (La Pampa, Río Cuarto)',
    center: [-34.5, -64.0],
    elevationMsnm: 240,
    slopePercent: 1.8,
    baseWaterTableDepthM: 3.5,
    historicalMonthlyRainMm: [80, 95, 90, 75, 40, 25],
    toscaDepthCm: 180,
    drainageCapacity: 'Alta infiltración en suelos franco-arenosos',
    ensoResponseCurve: [0.50, 0.80, 0.90, 0.70, 0.30, 0.0]
  },
  noa_chaco: {
    id: 'noa_chaco',
    name: 'NOA & Chaco Seco/Húmedo (Salta, Tucumán, Santiago)',
    center: [-26.5, -63.5],
    elevationMsnm: 280,
    slopePercent: 1.1,
    baseWaterTableDepthM: 3.2,
    historicalMonthlyRainMm: [90, 140, 160, 110, 30, 15],
    toscaDepthCm: 300,
    drainageCapacity: 'Variable; riesgo de crecidas aluvionales de montaña',
    ensoResponseCurve: [0.60, 1.05, 1.15, 0.75, 0.20, 0.0]
  },
  cuyo_patagonia: {
    id: 'cuyo_patagonia',
    name: 'Cuyo & Comahue (Mendoza, San Juan, Río Negro)',
    center: [-35.5, -68.5],
    elevationMsnm: 750,
    slopePercent: 3.5,
    baseWaterTableDepthM: 4.5,
    historicalMonthlyRainMm: [25, 35, 30, 20, 15, 10],
    toscaDepthCm: 300,
    drainageCapacity: 'Escurrimiento rápido hacia valles irrigados',
    ensoResponseCurve: [0.40, 0.70, 0.85, 0.60, 0.20, 0.0]
  },
  uruguay_brasil_sur: {
    id: 'uruguay_brasil_sur',
    name: 'Uruguay & Río Grande do Sul (Cono Sur)',
    center: [-31.5, -54.5],
    elevationMsnm: 90,
    slopePercent: 1.5,
    baseWaterTableDepthM: 1.1,
    historicalMonthlyRainMm: [120, 145, 140, 130, 85, 70],
    toscaDepthCm: 220,
    drainageCapacity: 'Riesgo crítico de inundación en cuencas del Río Negro y Uruguay',
    ensoResponseCurve: [1.25, 1.30, 1.15, 0.90, 0.40, 0.0]
  },
  paraguay_chaco: {
    id: 'paraguay_chaco',
    name: 'Paraguay & Pantanal (Cuenca Alta del Plata)',
    center: [-24.0, -57.5],
    elevationMsnm: 110,
    slopePercent: 0.5,
    baseWaterTableDepthM: 1.0,
    historicalMonthlyRainMm: [140, 165, 150, 135, 70, 45],
    toscaDepthCm: 300,
    drainageCapacity: 'Extremadamente lenta, desbordes masivos de ríos',
    ensoResponseCurve: [1.35, 1.25, 1.05, 0.70, 0.25, -0.05]
  },
  costa_peru_ecuador: {
    id: 'costa_peru_ecuador',
    name: 'Costa de Perú & Ecuador (El Niño Costero)',
    center: [-6.5, -79.5],
    elevationMsnm: 40,
    slopePercent: 2.2,
    baseWaterTableDepthM: 1.8,
    historicalMonthlyRainMm: [30, 80, 160, 110, 15, 5],
    toscaDepthCm: 300,
    drainageCapacity: 'Huaicos e inundaciones torrenciales destructivas',
    ensoResponseCurve: [0.80, 1.40, 1.65, 1.20, 0.30, -0.10]
  },
  brasil_cerrado_norte: {
    id: 'brasil_cerrado_norte',
    name: 'Brasil Centro-Norte / Nordeste (Teleconexión Seca)',
    center: [-12.0, -48.0],
    elevationMsnm: 350,
    slopePercent: 1.0,
    baseWaterTableDepthM: 4.2,
    historicalMonthlyRainMm: [180, 210, 190, 140, 30, 10],
    toscaDepthCm: 300,
    drainageCapacity: 'El Niño genera sequía / lluvias deficitarias en esta zona',
    ensoResponseCurve: [-0.40, -0.65, -0.80, -0.50, -0.15, 0.0]
  }
};

/**
 * Algoritmo predictivo de riesgo hidrológico, napa y transitabilidad
 */
export function calculateAgroPrediction(regionId, stepIndex, scenarioKey = 'super') {
  const step = TIMELINE_STEPS[stepIndex] || TIMELINE_STEPS[0];
  const region = AGRO_REGIONS[regionId] || AGRO_REGIONS.sudeste_ba;
  const scenario = step.scenarios[scenarioKey] || step.scenarios.super;

  // Factor de amplificación según el escenario
  const scenMultiplier = scenarioKey === 'super' ? 1.35 : scenarioKey === 'strong' ? 1.0 : 0.65;
  const regionalResponse = region.ensoResponseCurve[stepIndex];

  // Anomalía porcentual de lluvia para la región
  const rainAnomalyPercent = Math.round(scenario.globalRainAnomaly * regionalResponse * scenMultiplier);
  
  // Lluvia mensual promedio + anomalía
  const baseRain = region.historicalMonthlyRainMm[Math.min(stepIndex, region.historicalMonthlyRainMm.length - 1)];
  const projectedRainMm = Math.round(baseRain * (1 + rainAnomalyPercent / 100));

  // Modelo de ascenso de napa freática (en metros bajo el suelo)
  // Menor valor = más cerca de la superficie = más peligro
  const napaAscentM = (scenario.napaRiseGlobal * regionalResponse * (scenMultiplier * 0.9));
  let currentNapaM = region.baseWaterTableDepthM - napaAscentM;
  if (currentNapaM < 0.25) currentNapaM = 0.25; // Muy cerca de superficie o a flor de suelo
  currentNapaM = Math.round(currentNapaM * 100) / 100;

  // Índice de Riesgo de Anegamiento (0 a 100%)
  // Factores: Pendiente baja (+), Napa somera (+), Anomalía pluvial (+), Tosca cercana (+)
  const slopeFactor = Math.max(0, 1 - (region.slopePercent / 3)); // 0 a 1
  const napaDangerFactor = Math.max(0, 1 - (currentNapaM / 2.5)); // 0 a 1
  const rainDangerFactor = Math.min(1, Math.max(0, rainAnomalyPercent / 120)); // 0 a 1
  const toscaFactor = region.toscaDepthCm < 80 ? 0.25 : 0.05; // La tosca en Necochea agrava

  let riskIndex = (slopeFactor * 30) + (napaDangerFactor * 35) + (rainDangerFactor * 25) + (toscaFactor * 100);
  riskIndex = Math.min(100, Math.max(5, Math.round(riskIndex)));

  // Días de pérdida de piso (días al mes donde maquinaria no puede entrar)
  let trafficabilityLossDays = Math.round((riskIndex / 100) * 22);
  if (trafficabilityLossDays > 24) trafficabilityLossDays = 24;

  // Saturación de perfil radicular (0-100%)
  const soilMoisturePercent = Math.min(100, Math.round(60 + (riskIndex * 0.4)));

  // Presión fitosanitaria (hongos)
  const diseaseRiskPercent = Math.min(100, Math.round(40 + (rainAnomalyPercent * 0.5) + (soilMoisturePercent * 0.2)));

  return {
    regionId,
    regionName: region.name,
    stepIndex,
    stepLabel: step.dateLabel,
    phaseLabel: step.phaseLabel,
    oniVal: scenario.oni,
    projectedRainMm,
    normalRainMm: baseRain,
    rainAnomalyPercent,
    napaDepthM: currentNapaM,
    riskIndex,
    riskLevel: getRiskLevelString(riskIndex),
    trafficabilityLossDays,
    soilMoisturePercent,
    diseaseRiskPercent,
    drainageInfo: region.drainageCapacity,
    toscaDepthCm: region.toscaDepthCm
  };
}

function getRiskLevelString(index) {
  if (index >= 80) return 'CRÍTICO / ALTO RIESGO';
  if (index >= 60) return 'ELEVADO / PRECAUCIÓN';
  if (index >= 40) return 'MODERADO';
  return 'BAJO / FAVORABLE';
}

/**
 * Calcula la predicción para coordenadas arbitrarias (cuando el usuario hace clic en el mapa)
 */
export function calculatePointPrediction(lat, lon, stepIndex, scenarioKey = 'super') {
  // Encontrar la región de referencia más cercana
  let closestRegion = AGRO_REGIONS.sudeste_ba;
  let minDistance = 999999;

  for (const reg of Object.values(AGRO_REGIONS)) {
    const dist = Math.hypot(lat - reg.center[0], lon - reg.center[1]);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = reg;
    }
  }

  // Si está en el hemisferio norte o zona ecuatorial/tropical
  const isNorthernHemisphere = lat > 0;
  const isNecocheaCoast = lat < -38.0 && lat > -39.0 && lon > -59.5 && lon < -58.0;

  const result = calculateAgroPrediction(closestRegion.id, stepIndex, scenarioKey);

  if (isNecocheaCoast) {
    result.customNote = 'Zona Costera Cuenca del Quequén Grande (Necochea): Mayor incidencia de brisa marina, nieblas y retención en bajos de tosca.';
  } else if (closestRegion.id === 'costa_peru_ecuador') {
    result.customNote = 'Pacífico Ecuatorial / Región Niño 1+2: Calentamiento marino anómalo directo y riesgo crítico de aluviones/huaicos.';
  } else if (closestRegion.id === 'brasil_cerrado_norte') {
    result.customNote = 'Teleconexión Seca del Súper Niño: Déficit pluvial en el noreste brasileño y Amazonía.';
  } else if (isNorthernHemisphere) {
    result.customNote = 'Hemisferio Norte: Teleconexiones del ENSO invertidas estacionalmente.';
  }

  return {
    ...result,
    regionName: `Lote / Coordenadas (${lat.toFixed(2)}°, ${lon.toFixed(2)}°) [Ref: ${closestRegion.name}]`,
    isCustomPoint: true,
    lat: lat.toFixed(4),
    lon: lon.toFixed(4)
  };
}
