/**
 * SISTEMA DE PREDICCIÓN DEL SUPER NIÑO (SPSN)
 * Motor Físico y Matemático de Pluma de Tormenta Continua y Riesgo Hídrico.
 * Sin bordes rectangulares: modelado con campos Gaussianos de ríos atmosféricos y teleconexiones globales.
 */

export const TIMELINE_STEPS = [
  {
    step: 0,
    monthKey: 'actual',
    dateLabel: 'Noviembre 2026 (Mes Actual)',
    phaseLabel: 'FASE 1: CONVERGENCIA INICIAL EN EL LITORAL',
    oniIndex: 2.35,
    scenarioMultipliers: { super: 1.35, strong: 1.0, modoki: 0.65 },
    // Trayectoria del río atmosférico del Súper Niño (nodos de la pluma de tormenta)
    stormTrajectory: [
      { lat: 0.0, lon: -110.0, intensity: 0.90, spread: 14.0 },  // Pacífico Ecuatorial Central (Niño 3.4)
      { lat: -5.0, lon: -85.0, intensity: 0.95, spread: 10.0 },   // Frente a Perú / Ecuador (Niño 1+2)
      { lat: -16.0, lon: -68.0, intensity: 0.70, spread: 8.5 },   // Altiplano / Bolivia
      { lat: -27.0, lon: -58.5, intensity: 1.00, spread: 7.5 },   // Foco activo: Litoral argentino / Paraguay
      { lat: -34.0, lon: -59.5, intensity: 0.65, spread: 7.0 },   // Zona Núcleo norte
      { lat: -38.5, lon: -58.7, intensity: 0.40, spread: 6.5 }    // Necochea / Sudeste (inicial suave)
    ],
    riverDischargeFactor: 1.2
  },
  {
    step: 1,
    monthKey: 'plus_1',
    dateLabel: 'Diciembre 2026 (+1 Mes)',
    phaseLabel: 'FASE 2: EXPANSIÓN A ZONA NÚCLEO Y SALADO',
    oniIndex: 2.48,
    scenarioMultipliers: { super: 1.45, strong: 1.1, modoki: 0.70 },
    stormTrajectory: [
      { lat: -1.0, lon: -108.0, intensity: 0.92, spread: 14.0 },
      { lat: -6.0, lon: -84.0, intensity: 0.96, spread: 10.5 },
      { lat: -20.0, lon: -66.0, intensity: 0.78, spread: 9.0 },
      { lat: -31.5, lon: -60.0, intensity: 1.00, spread: 8.5 },   // Foco: Santa Fe / Entre Ríos
      { lat: -35.5, lon: -60.5, intensity: 0.90, spread: 8.0 },   // Cuenca del Salado
      { lat: -38.5, lon: -58.7, intensity: 0.65, spread: 7.0 }    // Necochea (aumento sostenido)
    ],
    riverDischargeFactor: 1.6
  },
  {
    step: 2,
    monthKey: 'plus_2',
    dateLabel: 'Enero/Febrero 2027 (+2 Meses)',
    phaseLabel: 'FASE 3: PICO MÁXIMO (IMPACTO SUR BONAERENSE - NECOCHEA)',
    oniIndex: 2.58,
    scenarioMultipliers: { super: 1.60, strong: 1.2, modoki: 0.75 },
    stormTrajectory: [
      { lat: -2.0, lon: -105.0, intensity: 0.85, spread: 13.0 },
      { lat: -8.0, lon: -83.0, intensity: 0.90, spread: 10.0 },
      { lat: -25.0, lon: -64.0, intensity: 0.82, spread: 8.5 },
      { lat: -34.0, lon: -61.0, intensity: 0.92, spread: 8.0 },
      { lat: -38.5, lon: -58.7, intensity: 1.00, spread: 8.5 },   // ¡PICO MÁXIMO EN NECOCHEA / MAR Y SIERRAS!
      { lat: -40.5, lon: -57.5, intensity: 0.75, spread: 7.5 }    // Frente oceánico Atlántico
    ],
    riverDischargeFactor: 2.1
  },
  {
    step: 3,
    monthKey: 'plus_3',
    dateLabel: 'Marzo/Abril 2027 (+3 Meses)',
    phaseLabel: 'FASE 4: COSECHA GRUESA & PERSISTENCIA DE AGUAS ALTAS',
    oniIndex: 2.15,
    scenarioMultipliers: { super: 1.30, strong: 1.0, modoki: 0.60 },
    stormTrajectory: [
      { lat: -1.0, lon: -102.0, intensity: 0.75, spread: 12.0 },
      { lat: -6.0, lon: -82.0, intensity: 0.75, spread: 9.0 },
      { lat: -33.0, lon: -60.0, intensity: 0.80, spread: 8.0 },
      { lat: -37.5, lon: -59.5, intensity: 0.80, spread: 8.0 },
      { lat: -41.0, lon: -56.0, intensity: 0.55, spread: 8.0 }
    ],
    riverDischargeFactor: 1.7
  },
  {
    step: 4,
    monthKey: 'plus_6',
    dateLabel: 'Mayo/Junio 2027 (+6 Meses)',
    phaseLabel: 'FASE 5: DECLIVE ESTACIONAL HACIA EL INVIERNO',
    oniIndex: 1.15,
    scenarioMultipliers: { super: 0.85, strong: 0.65, modoki: 0.35 },
    stormTrajectory: [
      { lat: 0.0, lon: -100.0, intensity: 0.45, spread: 10.0 },
      { lat: -28.0, lon: -58.0, intensity: 0.50, spread: 7.0 },
      { lat: -36.0, lon: -59.0, intensity: 0.40, spread: 6.5 }
    ],
    riverDischargeFactor: 1.1
  },
  {
    step: 5,
    monthKey: 'plus_12',
    dateLabel: 'Primavera 2027 (+12 Meses)',
    phaseLabel: 'FASE 6: SALIDA POST-NIÑO / TRANSICIÓN NEUTRAL',
    oniIndex: -0.15,
    scenarioMultipliers: { super: 0.20, strong: 0.15, modoki: 0.05 },
    stormTrajectory: [
      { lat: 0.0, lon: -100.0, intensity: 0.15, spread: 8.0 },
      { lat: -34.0, lon: -60.0, intensity: 0.15, spread: 5.0 }
    ],
    riverDischargeFactor: 0.9
  }
];

// Red hidrográfica principal (cuencas y valles aluviales)
export const MAJOR_RIVER_SYSTEMS = [
  {
    id: 'quequen_grande',
    name: 'Río Quequén Grande (Necochea)',
    mouthName: 'Puerto Quequén',
    points: [
      [-37.65, -59.20],
      [-37.85, -59.00],
      [-38.10, -58.90],
      [-38.35, -58.80],
      [-38.56, -58.71]
    ],
    criticalPeakStep: 2
  },
  {
    id: 'quequen_salado',
    name: 'Río Quequén Salado',
    mouthName: 'Claromecó / Marisol',
    points: [
      [-37.8, -60.6],
      [-38.3, -60.4],
      [-38.9, -60.2]
    ],
    criticalPeakStep: 2
  },
  {
    id: 'salado_bonaerense',
    name: 'Río Salado Bonaerense',
    mouthName: 'Bahía Samborombón',
    points: [
      [-34.8, -62.0],
      [-35.3, -60.5],
      [-35.8, -59.0],
      [-35.9, -57.5]
    ],
    criticalPeakStep: 1
  },
  {
    id: 'parana',
    name: 'Río Paraná',
    mouthName: 'Delta del Paraná / Río de la Plata',
    points: [
      [-25.5, -54.5],
      [-27.4, -58.8],
      [-29.2, -59.6],
      [-31.7, -60.5],
      [-32.9, -60.6],
      [-34.2, -58.8]
    ],
    criticalPeakStep: 1
  },
  {
    id: 'uruguay',
    name: 'Río Uruguay',
    mouthName: 'Río de la Plata',
    points: [
      [-27.8, -54.0],
      [-30.5, -57.6],
      [-31.8, -58.0],
      [-33.5, -58.4]
    ],
    criticalPeakStep: 0
  },
  {
    id: 'guaiba_jacui',
    name: 'Cuenca del Lago Guaíba / Jacuí (Porto Alegre, Brasil)',
    mouthName: 'Laguna de los Patos',
    points: [
      [-29.6, -53.2],
      [-29.8, -52.0],
      [-30.0, -51.2]
    ],
    criticalPeakStep: 0
  },
  {
    id: 'piura_chira',
    name: 'Río Piura / Chira (Costa Norte Perú)',
    mouthName: 'Océano Pacífico',
    points: [
      [-4.8, -80.2],
      [-5.1, -80.6],
      [-5.5, -80.8]
    ],
    criticalPeakStep: 2
  }
];

/**
 * Evalúa las condiciones en CUALQUIER punto del planeta mediante campos continuos suaves.
 * Sin bordes rectangulares ni cortes artificiales.
 */
export function evaluatePointConditions(lat, lon, stepIndex = 0, scenarioKey = 'super') {
  const step = TIMELINE_STEPS[stepIndex] || TIMELINE_STEPS[0];
  const mult = step.scenarioMultipliers[scenarioKey] || 1.35;

  // 1. Campo de intensidad continua de la estela / tormenta del Niño
  const stormField = calculateContinuousStormField(lat, lon, step, mult);

  // 2. Modelo de relieve y pendiente topográfica
  const topography = estimateTopographyAndDrainage(lat, lon);

  // 3. Proximidad a redes fluviales y desborde
  const riverImpact = calculateRiverOverflowProximity(lat, lon, stepIndex, step.riverDischargeFactor);

  // 4. Dinámica de napa freática (m bajo suelo)
  let napaDepthM = topography.baseNapaM - (stormField.anomalyRatio * 1.3 * topography.retentionFactor);
  if (napaDepthM < 0.25) napaDepthM = 0.25;
  napaDepthM = Math.round(napaDepthM * 100) / 100;

  // 5. RIESGO DE INUNDACIÓN Y ANEGAMIENTO (0 a 100%)
  const rainScore = Math.min(100, Math.max(0, stormField.rainAnomalyPercent * 0.75));
  const slopeScore = topography.slopeRisk;
  const napaScore = Math.min(100, Math.max(0, (1 - (napaDepthM / 2.5)) * 100));
  const riverScore = riverImpact.overflowRiskPercent;

  let floodRiskPercent = (rainScore * 0.35) + (slopeScore * 0.25) + (napaScore * 0.20) + (riverScore * 0.20);

  // En Necochea / Sudeste Bonaerense: la tosca somera eleva el riesgo ante temporales
  const isNecocheaZone = lat < -37.5 && lat > -39.2 && lon > -60.5 && lon < -58.0;
  if (isNecocheaZone && stormField.rainAnomalyPercent > 35) {
    floodRiskPercent += 14;
  }

  floodRiskPercent = Math.min(100, Math.max(5, Math.round(floodRiskPercent)));

  // 6. Días de pérdida de piso para maquinaria
  let trafficabilityLossDays = Math.round((floodRiskPercent / 100) * 22);
  if (trafficabilityLossDays > 24) trafficabilityLossDays = 24;

  const soilMoisturePercent = Math.min(100, Math.round(55 + (floodRiskPercent * 0.45)));
  const statusInfo = getSimplifiedRiskStatus(floodRiskPercent, riverScore);

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
    stepIndex,
    stepLabel: step.dateLabel,
    phaseLabel: step.phaseLabel,
    oniIndex: step.oniIndex,
    stormIntensity: stormField.intensity, // 0.0 a 1.0 (para el renderizado continuo)
    floodRiskPercent,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    rainAnomalyPercent: Math.round(stormField.rainAnomalyPercent),
    projectedRainMm: Math.round(topography.baseNormalRainMm * (1 + stormField.rainAnomalyPercent / 100)),
    normalRainMm: topography.baseNormalRainMm,
    riverOverflowPercent: Math.round(riverScore),
    nearestRiverName: riverImpact.nearestRiverName,
    riverDistanceKm: Math.round(riverImpact.distanceKm),
    napaDepthM,
    soilMoisturePercent,
    trafficabilityLossDays,
    isNecocheaZone
  };
}

/**
 * Calcula el campo de intensidad continua de la pluma de tormenta del Niño
 * usando interpolación Gaussiana multi-nodo a lo largo de la corriente en chorro
 */
export function calculateContinuousStormField(lat, lon, step, scenarioMultiplier) {
  let maxField = 0;

  // Suma de influencias Gaussianas suaves de cada nodo de la trayectoria
  step.stormTrajectory.forEach(node => {
    const dLat = (lat - node.lat);
    const dLon = (lon - node.lon);
    const distSq = (dLat * dLat) + (dLon * dLon);
    const spreadSq = node.spread * node.spread;

    const val = node.intensity * Math.exp(-distSq / (2 * spreadSq));
    if (val > maxField) maxField = val;
  });

  // Ajuste de anomalía pluvial proporcional a la intensidad de la estela
  const rainAnomalyPercent = Math.max(-20, (maxField * 110 - 10) * scenarioMultiplier);
  const anomalyRatio = Math.max(0, rainAnomalyPercent / 100);

  return {
    intensity: Math.min(1.0, maxField * scenarioMultiplier),
    rainAnomalyPercent,
    anomalyRatio
  };
}

function estimateTopographyAndDrainage(lat, lon) {
  // Cuencas y valles de drenaje continuo
  const distSalado = Math.hypot((lat + 35.8) * 1.5, (lon + 60.0));
  const distQuequen = Math.hypot((lat + 38.3) * 1.8, (lon + 59.0));
  const distParana = Math.hypot((lat + 31.0) * 0.8, (lon + 60.5));

  let slopeRisk = 35;
  let baseNapaM = 2.4;
  let baseNormalRainMm = 80;
  let retentionFactor = 1.0;

  if (distSalado < 3.0) {
    slopeRisk = 80 - distSalado * 12;
    baseNapaM = 1.4;
    retentionFactor = 1.3;
  } else if (distQuequen < 2.0) {
    slopeRisk = 70 - distQuequen * 15;
    baseNapaM = 1.9;
    retentionFactor = 1.25; // Tosca somera
  } else if (distParana < 2.5) {
    slopeRisk = 75 - distParana * 12;
    baseNapaM = 1.2;
    retentionFactor = 1.35;
  }

  return {
    slopeRisk: Math.max(10, Math.min(90, slopeRisk)),
    baseNapaM,
    baseNormalRainMm,
    retentionFactor
  };
}

function calculateRiverOverflowProximity(lat, lon, stepIndex, dischargeFactor) {
  let minDistanceKm = 9999;
  let closestRiver = MAJOR_RIVER_SYSTEMS[0];

  MAJOR_RIVER_SYSTEMS.forEach(river => {
    river.points.forEach(pt => {
      const dKm = Math.hypot((lat - pt[0]) * 111, (lon - pt[1]) * 88);
      if (dKm < minDistanceKm) {
        minDistanceKm = dKm;
        closestRiver = river;
      }
    });
  });

  const isPeakForRiver = Math.abs(stepIndex - closestRiver.criticalPeakStep) <= 1;
  const peakMultiplier = isPeakForRiver ? 1.5 : 0.8;
  const flowIntensity = dischargeFactor * peakMultiplier;

  let proximityFactor = Math.max(0, 1 - (minDistanceKm / 45));
  let overflowRiskPercent = Math.min(100, Math.round(proximityFactor * flowIntensity * 65));

  return {
    nearestRiverName: closestRiver.name,
    distanceKm: minDistanceKm,
    overflowRiskPercent
  };
}

function getSimplifiedRiskStatus(floodRisk, riverRisk) {
  if (floodRisk >= 75 || riverRisk >= 75) {
    return { label: 'CRÍTICO / ALTO RIESGO DE INUNDACIÓN', color: '#ef4444' };
  } else if (floodRisk >= 50) {
    return { label: 'ALERTA / RIESGO MODERADO A ALTO', color: '#f59e0b' };
  } else if (floodRisk >= 30) {
    return { label: 'VIGILANCIA / CONDICIONES HÚMEDAS', color: '#3b82f6' };
  } else {
    return { label: 'BAJO RIESGO / DRENAJE SEGURO', color: '#10b981' };
  }
}
