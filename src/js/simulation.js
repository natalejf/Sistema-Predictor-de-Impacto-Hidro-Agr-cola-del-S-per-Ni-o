/**
 * SISTEMA PREDICTOR DE IMPACTO HIDRO-AGRÍCOLA DEL SÚPER NIÑO (SPIHA-Niño)
 * Motor Físico y Matemático Continuo para Simulación Global y Sudamericana.
 * Evalúa topografía, pendientes, cuencas fluviales, napas y anomalías ENSO en tiempo real.
 */

export const TIMELINE_STEPS = [
  {
    step: 0,
    monthKey: 'actual',
    dateLabel: 'Noviembre 2026 (Mes Actual)',
    phaseLabel: 'FASE 1: CONVERGENCIA INICIAL EN EL LITORAL',
    oniIndex: 2.35,
    scenarioMultipliers: { super: 1.35, strong: 1.0, modoki: 0.65 },
    // Foco geográfico principal del pulso húmedo (lat, lon, radio en grados)
    pulseCenter: [-28.0, -58.5],
    pulseRadius: 8.0,
    riverDischargeFactor: 1.2
  },
  {
    step: 1,
    monthKey: 'plus_1',
    dateLabel: 'Diciembre 2026 (+1 Mes)',
    phaseLabel: 'FASE 2: EXPANSIÓN A ZONA NÚCLEO Y SALADO',
    oniIndex: 2.48,
    scenarioMultipliers: { super: 1.45, strong: 1.1, modoki: 0.70 },
    pulseCenter: [-33.5, -60.5],
    pulseRadius: 9.5,
    riverDischargeFactor: 1.6
  },
  {
    step: 2,
    monthKey: 'plus_2',
    dateLabel: 'Enero/Febrero 2027 (+2 Meses)',
    phaseLabel: 'FASE 3: PICO MÁXIMO SÚPER NIÑO (IMPACTO SUR BONAERENSE)',
    oniIndex: 2.58,
    scenarioMultipliers: { super: 1.60, strong: 1.2, modoki: 0.75 },
    pulseCenter: [-38.0, -59.5], // Pico centrado en Sudeste Bonaerense / Necochea / Tandilia
    pulseRadius: 10.5,
    riverDischargeFactor: 2.1
  },
  {
    step: 3,
    monthKey: 'plus_3',
    dateLabel: 'Marzo/Abril 2027 (+3 Meses)',
    phaseLabel: 'FASE 4: COSECHA GRUESA & PERSISTENCIA DE AGUAS',
    oniIndex: 2.15,
    scenarioMultipliers: { super: 1.30, strong: 1.0, modoki: 0.60 },
    pulseCenter: [-35.0, -61.0],
    pulseRadius: 9.0,
    riverDischargeFactor: 1.7
  },
  {
    step: 4,
    monthKey: 'plus_6',
    dateLabel: 'Mayo/Junio 2027 (+6 Meses)',
    phaseLabel: 'FASE 5: DECLIVE ESTACIONAL HACIA EL INVIERNO',
    oniIndex: 1.15,
    scenarioMultipliers: { super: 0.90, strong: 0.7, modoki: 0.40 },
    pulseCenter: [-30.0, -58.0],
    pulseRadius: 6.0,
    riverDischargeFactor: 1.1
  },
  {
    step: 5,
    monthKey: 'plus_12',
    dateLabel: 'Primavera 2027 (+12 Meses)',
    phaseLabel: 'FASE 6: SALIDA POST-NIÑO / TRANSICIÓN NEUTRAL',
    oniIndex: -0.15,
    scenarioMultipliers: { super: 0.30, strong: 0.2, modoki: 0.10 },
    pulseCenter: [-34.0, -60.0],
    pulseRadius: 4.0,
    riverDischargeFactor: 0.9
  }
];

// Red hidrográfica con caudales base y umbrales de desborde
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
    baseElevation: 18,
    bankfullCapacityMm: 130,
    criticalPeakStep: 2 // Enero/Febrero en Necochea
  },
  {
    id: 'quequen_salado',
    name: 'Río Quequén Salado',
    mouthName: 'Claromecó / Balneario Marisol',
    points: [
      [-37.8, -60.6],
      [-38.3, -60.4],
      [-38.9, -60.2]
    ],
    baseElevation: 25,
    bankfullCapacityMm: 125,
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
    baseElevation: 12,
    bankfullCapacityMm: 110,
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
    baseElevation: 15,
    bankfullCapacityMm: 160,
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
    baseElevation: 20,
    bankfullCapacityMm: 150,
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
    baseElevation: 8,
    bankfullCapacityMm: 140,
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
    baseElevation: 30,
    bankfullCapacityMm: 90,
    criticalPeakStep: 2
  }
];

/**
 * Función matemática fundamental: evalúa en CUALQUIER punto del mundo (lat, lon)
 * el impacto del Súper Niño, el relieve, el riesgo de inundación y el desborde fluvial.
 */
export function evaluatePointConditions(lat, lon, stepIndex = 0, scenarioKey = 'super') {
  const step = TIMELINE_STEPS[stepIndex] || TIMELINE_STEPS[0];
  const mult = step.scenarioMultipliers[scenarioKey] || 1.35;

  // 1. Teleconexión climática ENSO según latitud y longitud
  const ensoAnomaly = calculateEnsoAnomalyField(lat, lon, step, mult);

  // 2. Modelo de relieve y pendiente topográfica
  const topography = estimateTopographyAndDrainage(lat, lon);

  // 3. Proximidad a redes fluviales y desborde de cuencas
  const riverImpact = calculateRiverOverflowProximity(lat, lon, stepIndex, step.riverDischargeFactor);

  // 4. Dinámica de napa freática estimada (m bajo suelo)
  let napaDepthM = topography.baseNapaM - (ensoAnomaly.rainAnomalyRatio * 1.35 * topography.retentionFactor);
  if (napaDepthM < 0.25) napaDepthM = 0.25;
  napaDepthM = Math.round(napaDepthM * 100) / 100;

  // 5. ÍNDICE DE RIESGO DE INUNDACIÓN Y ANEGAMIENTO (0 a 100%)
  // Combina: exceso de lluvia (35%) + pendiente baja (25%) + napa cercana (20%) + desborde de río (20%)
  const rainScore = Math.min(100, Math.max(0, ensoAnomaly.rainAnomalyPercent * 0.75));
  const slopeScore = topography.slopeRisk; // 0 (loma escurrida) a 100 (cubeta plana/bajo)
  const napaScore = Math.min(100, Math.max(0, (1 - (napaDepthM / 2.5)) * 100));
  const riverScore = riverImpact.overflowRiskPercent;

  let floodRiskPercent = (rainScore * 0.35) + (slopeScore * 0.25) + (napaScore * 0.20) + (riverScore * 0.20);
  
  // En Necochea / Tres Arroyos: la tosca a 40-70cm eleva el riesgo en tormentas
  const isNecocheaZone = lat < -37.5 && lat > -39.0 && lon > -60.5 && lon < -58.0;
  if (isNecocheaZone && ensoAnomaly.rainAnomalyPercent > 40) {
    floodRiskPercent += 12; // Efecto tosca
  }

  floodRiskPercent = Math.min(100, Math.max(5, Math.round(floodRiskPercent)));

  // 6. Pérdida de piso agrícola (días por mes)
  let trafficabilityLossDays = Math.round((floodRiskPercent / 100) * 22);
  if (trafficabilityLossDays > 24) trafficabilityLossDays = 24;

  // 7. Humedad de suelo (% capacidad de campo)
  const soilMoisturePercent = Math.min(100, Math.round(55 + (floodRiskPercent * 0.45)));

  // 8. Estado y recomendación directa simplificada
  const statusInfo = getSimplifiedRiskStatus(floodRiskPercent, riverScore, isNecocheaZone, stepIndex);

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
    stepIndex,
    stepLabel: step.dateLabel,
    phaseLabel: step.phaseLabel,
    oniIndex: step.oniIndex,
    // Métricas principales directas
    floodRiskPercent,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    rainAnomalyPercent: Math.round(ensoAnomaly.rainAnomalyPercent),
    projectedRainMm: Math.round(topography.baseNormalRainMm * (1 + ensoAnomaly.rainAnomalyPercent / 100)),
    normalRainMm: topography.baseNormalRainMm,
    riverOverflowPercent: Math.round(riverScore),
    nearestRiverName: riverImpact.nearestRiverName,
    riverDistanceKm: Math.round(riverImpact.distanceKm),
    napaDepthM,
    soilMoisturePercent,
    trafficabilityLossDays,
    isNecocheaZone,
    // Recomendación ejecutiva breve
    quickRecommendation: statusInfo.recommendation
  };
}

/**
 * Campo continuo de anomalía ENSO basado en teleconexiones meteorológicas
 */
function calculateEnsoAnomalyField(lat, lon, step, scenarioMultiplier) {
  // Distancia angular al pulso estacional activo del Súper Niño
  const dLat = lat - step.pulseCenter[0];
  const dLon = lon - step.pulseCenter[1];
  const dist = Math.hypot(dLat, dLon);

  // Intensidad Gaussiana del pulso regional
  const gaussian = Math.exp(-Math.pow(dist / step.pulseRadius, 2));

  // Base ENSO según la zona geográfica mundial
  let baseRegionalAnomaly = 0;

  // Cuenca del Plata y Región Pampeana (Teleconexión muy húmeda)
  if (lat < -20 && lat > -42 && lon > -68 && lon < -50) {
    baseRegionalAnomaly = 45 + (gaussian * 65);
  }
  // Costa de Perú y Ecuador (Niño Costero)
  else if (lat > -12 && lat < 2 && lon > -83 && lon < -75) {
    baseRegionalAnomaly = 60 + (step.step === 2 ? 80 : 30);
  }
  // Nordeste Brasileño y Amazonía (Teleconexión de déficit / sequía)
  else if (lat > -15 && lat < 5 && lon > -55 && lon < -35) {
    baseRegionalAnomaly = -35;
  }
  // Resto del mundo (modelo global proporcional a latitud tropical/subtropical)
  else {
    const isTropicalPacific = Math.abs(lat) < 20 && lon > -180 && lon < -80;
    baseRegionalAnomaly = isTropicalPacific ? 50 : 15 * Math.cos((lat * Math.PI) / 90);
  }

  const finalAnomalyPercent = baseRegionalAnomaly * scenarioMultiplier;
  const rainAnomalyRatio = Math.max(0, finalAnomalyPercent / 100);

  return {
    rainAnomalyPercent: finalAnomalyPercent,
    rainAnomalyRatio
  };
}

/**
 * Estimación del relieve, pendientes y retención hídrica por ubicación
 */
function estimateTopographyAndDrainage(lat, lon) {
  // Cuenca del Salado bonaerense (Extremadamente plana, cota < 60m, pendiente < 0.3%)
  const isSaladoBasin = lat < -34.5 && lat > -36.8 && lon > -62.5 && lon < -57.5;
  // Sudeste Bonaerense / Necochea / Cuenca del Quequén (Pendiente suave hacia el mar, tosca a 50cm)
  const isNecocheaQuequen = lat < -37.5 && lat > -39.0 && lon > -60.0 && lon < -58.2;
  // Valle del Río Paraná / Delta
  const isParanaValley = lat < -27.0 && lat > -34.5 && lon > -61.2 && lon < -59.5;
  // Cordillera de los Andes (Pendiente muy alta, escurre de inmediato)
  const isAndes = lon < -67.5 && lat < -22 && lat > -45;

  let slopeRisk = 40; // 0 = loma escurrida, 100 = depresión inundable
  let baseNapaM = 2.4;
  let baseNormalRainMm = 85;
  let retentionFactor = 1.0;

  if (isSaladoBasin) {
    slopeRisk = 85;
    baseNapaM = 1.3;
    baseNormalRainMm = 95;
    retentionFactor = 1.4;
  } else if (isNecocheaQuequen) {
    slopeRisk = 65;
    baseNapaM = 2.0;
    baseNormalRainMm = 80;
    retentionFactor = 1.25; // Tosca frena
  } else if (isParanaValley) {
    slopeRisk = 80;
    baseNapaM = 1.1;
    baseNormalRainMm = 115;
    retentionFactor = 1.3;
  } else if (isAndes) {
    slopeRisk = 10;
    baseNapaM = 5.0;
    baseNormalRainMm = 20;
    retentionFactor = 0.4;
  }

  return {
    slopeRisk,
    baseNapaM,
    baseNormalRainMm,
    retentionFactor
  };
}

/**
 * Calcula la distancia y el riesgo de desborde del río más cercano
 */
function calculateRiverOverflowProximity(lat, lon, stepIndex, dischargeFactor) {
  let minDistanceKm = 9999;
  let closestRiver = MAJOR_RIVER_SYSTEMS[0];

  MAJOR_RIVER_SYSTEMS.forEach(river => {
    river.points.forEach(pt => {
      // Conversión aproximada 1° lat ~ 111 km, 1° lon ~ 88 km en zona templada
      const dKm = Math.hypot((lat - pt[0]) * 111, (lon - pt[1]) * 88);
      if (dKm < minDistanceKm) {
        minDistanceKm = dKm;
        closestRiver = river;
      }
    });
  });

  // Factor de crecida del río en la etapa temporal actual
  const isPeakForRiver = Math.abs(stepIndex - closestRiver.criticalPeakStep) <= 1;
  const peakMultiplier = isPeakForRiver ? 1.5 : 0.8;
  const flowIntensity = dischargeFactor * peakMultiplier;

  // Riesgo disminuye con la distancia al cauce principal (dentro de 40 km hay influencia de llanura aluvial)
  let proximityFactor = Math.max(0, 1 - (minDistanceKm / 40));
  let overflowRiskPercent = Math.min(100, Math.round(proximityFactor * flowIntensity * 65));

  return {
    nearestRiverName: closestRiver.name,
    distanceKm: minDistanceKm,
    overflowRiskPercent
  };
}

function getSimplifiedRiskStatus(floodRisk, riverRisk, isNecochea, stepIndex) {
  if (floodRisk >= 75 || riverRisk >= 75) {
    return {
      label: 'CRÍTICO / ALTO RIESGO DE INUNDACIÓN',
      color: '#ef4444',
      recommendation: isNecochea && stepIndex === 2
        ? '¡Pico en Necochea! Mover hacienda de bajos a lomas; cosechar cebada/trigo de inmediato antes del temporal.'
        : 'Saturación hídrica severa. Retirar maquinaria pesada de cubetas bajas y proteger accesos viales.'
    };
  } else if (floodRisk >= 50) {
    return {
      label: 'ALERTA / RIESGO MODERADO A ALTO',
      color: '#f59e0b',
      recommendation: 'Ascenso rápido de napa. Monitorear desagües perimetrales y fraccionar nitrógeno para evitar lixiviación.'
    };
  } else if (floodRisk >= 30) {
    return {
      label: 'VIGILANCIA / CONDICIONES HÚMEDAS',
      color: '#3b82f6',
      recommendation: 'Buena recarga de perfil de suelo. Condiciones favorables en lomas; vigilar pronósticos semanales.'
    };
  } else {
    return {
      label: 'BAJO RIESGO / DRENAJE SEGURO',
      color: '#10b981',
      recommendation: 'Sin riesgo inminente de anegamiento. Lotes transitables con óptima ventana operativa.'
    };
  }
}
