/**
 * AURA-NIÑO AGRO 2026 - AGRO DECISION ENGINE
 * Matriz de recomendaciones agronómicas, sanitarias y logísticas
 * adaptadas por cultivo, tipo de suelo y etapa del Súper Niño.
 */

export function generateAgroAdvisory(prediction, locationKey = 'necochea') {
  const isNecochea = locationKey === 'necochea' || locationKey === 'tres_arroyos' || locationKey === 'balcarce';
  const { stepIndex, riskIndex, trafficabilityLossDays, diseaseRiskPercent, napaDepthM, rainAnomalyPercent } = prediction;

  const advisories = [];

  // ==========================================
  // 1. CULTIVOS DE INVIERNO: CEBADA Y TRIGO
  // ==========================================
  let finaStatus = 'NORMAL';
  let finaClass = 'bg-green';
  let finaText = '';
  let finaActions = [];

  if (stepIndex === 0) {
    // Noviembre: Llenado de grano
    finaStatus = diseaseRiskPercent > 65 ? 'RIESGO SANITARIO' : 'FAVORABLE';
    finaClass = diseaseRiskPercent > 65 ? 'bg-amber' : 'bg-green';
    finaText = isNecochea
      ? 'Etapa crítica de llenado de grano en el sudeste bonaerense. La napa a ' + napaDepthM + 'm aporta agua pero la alta humedad ambiental dispara el riesgo de enfermedades fúngicas foliares y de espiga.'
      : 'Monitoreo de llenado de grano y sanitación de hojas superiores (hoja bandera).';
    finaActions = [
      'Monitoreo urgente de Fusariosis de la espiga (Gibberella) y Mancha amarilla.',
      'Aplicar fungicidas a base de Carboxamidas + Triazoles respetando ventanas de al menos 36h sin lluvias.',
      'Controlar calibre y proteína en cebada cervecera; evitar cortes prematuros si hay pronóstico de lloviznas persistentes.'
    ];
  } else if (stepIndex === 1 || stepIndex === 2) {
    // Diciembre / Enero: Cosecha
    finaStatus = trafficabilityLossDays > 12 ? 'ALERTA COSECHA' : 'EN CURSO';
    finaClass = trafficabilityLossDays > 12 ? 'bg-red' : 'bg-amber';
    finaText = 'Momento decisivo de trilla. Con ' + trafficabilityLossDays + ' días estimados sin piso al mes, el riesgo de brotado en espiga y pérdida de calidad comercial (Falling Number en trigo) es severo.';
    finaActions = [
      'Priorizar cosecha apenas la humedad del grano baje al 14-14.5% sin esperar sobresecado en planta.',
      'Equipar cosechadoras con neumáticos radiales dobles o tracción asistida para reducir huellado en lotes húmedos.',
      'Trasladar grano de inmediato a plantas de acopio con secadora o almacenar en silo-bolsa exclusivamente sobre lomas entoscadas.'
    ];
  } else {
    // Post-cosecha / Nueva campaña
    finaStatus = 'RECARGA EXCELENTE';
    finaClass = 'bg-cyan';
    finaText = 'Perfiles de suelo con reserva hídrica al 100% para la implantación de la fina 2027. Gran potencial de rendimiento si se gestiona el drenaje.';
    finaActions = [
      'Análisis de nitrógeno en perfil (0-60cm): posible lixiviación de nitratos por lluvias torrenciales pasadas.',
      'Elegir lotes con buen declive para siembra temprana; evitar bajos saturados.',
      'Tratamiento profesional de semilla con fungicidas curasemillas de amplio espectro contra hongos de suelo.'
    ];
  }

  advisories.push({
    crop: 'Cebada Cervecera & Trigo Pan',
    icon: '🌾',
    status: finaStatus,
    statusClass: finaClass,
    text: finaText,
    actions: finaActions
  });

  // ==========================================
  // 2. MAÍZ (TEMPRANO Y TARDÍO)
  // ==========================================
  let maizStatus = 'ALTO RENDIMIENTO POTENCIAL';
  let maizClass = 'bg-green';
  let maizText = '';
  let maizActions = [];

  if (stepIndex <= 1) {
    // Siembra / Emergencia
    maizStatus = napaDepthM < 0.8 ? 'RIESGO ANOXIA' : 'POTENCIAL RÉCORD';
    maizClass = napaDepthM < 0.8 ? 'bg-amber' : 'bg-green';
    maizText = 'El Súper Niño ofrece condiciones excepcionales de agua para maíz en lomas, pero los lotes planos o con tosca somera corren riesgo de anoxia radicular temporal.';
    maizActions = [
      'Aumentar densidad de siembra en lomas bien drenadas para capitalizar la abundante oferta hídrica.',
      'Fraccionar la fertilización nitrogenada (30% a la siembra, 70% en V6) para mitigar el lavado por percolación profunda.',
      'En lotes quebrados, evitar sembrar los bajos que tengan antecedentes de retención de agua mayor a 72 horas.'
    ];
  } else if (stepIndex === 2 || stepIndex === 3) {
    // Floración y llenado
    maizStatus = 'LLENADO CRÍTICO';
    maizClass = 'bg-blue';
    maizText = 'Período crítico de definición de rendimiento. Buenas reservas de agua, pero monitorear pudriciones de raíz y tallo si los suelos permanecen anegados.';
    maizActions = [
      'Monitoreo de Roya común del maíz y Tizón foliar favorecidos por rocíos prolongados.',
      'Revisar el anclaje de raíces: el reblandecimiento del suelo puede provocar vuelco ante tormentas con ráfagas intensas.',
      'Planificar la logística de cosecha tardía asegurando contratos de flete con antelación.'
    ];
  } else {
    // Cosecha
    maizStatus = trafficabilityLossDays > 14 ? 'PROBLEMA DE PISO' : 'COSECHA';
    maizClass = trafficabilityLossDays > 14 ? 'bg-red' : 'bg-green';
    maizText = 'Cosecha de maíz con humedad de grano superior a la estándar. ' + trafficabilityLossDays + ' días de piso comprometido.';
    maizActions = [
      'Calibración de cabezales y regulación de picadores para evitar atascamientos por cañas húmedas.',
      'No ingresar con acoplados autodescargables llenos al lote para no generar compactación irreversible (huellones).'
    ];
  }

  advisories.push({
    crop: 'Maíz de Primera & Tardío',
    icon: '🌽',
    status: maizStatus,
    statusClass: maizClass,
    text: maizText,
    actions: maizActions
  });

  // ==========================================
  // 3. SOJA (1RA Y 2DA TRAS CEREAL)
  // ==========================================
  let sojaStatus = 'MONITOREO';
  let sojaClass = 'bg-green';
  let sojaText = '';
  let sojaActions = [];

  if (stepIndex === 0 || stepIndex === 1) {
    sojaStatus = 'SIEMBRA & NACIMIENTO';
    sojaClass = 'bg-green';
    sojaText = 'Siembra de primera en marcha. Para la soja de segunda (post-cebada/trigo), el exceso de agua puede dificultar el ingreso de la sembradora a tiempo.';
    sojaActions = [
      'Inocular con cepas de Bradyrhizobium tolerantes a baja tensión de oxígeno en el suelo.',
      'Elegir grupos de madurez (GM IV largo o V en el sur) que permitan aprovechar la longitud de la estación húmeda.',
      'Revisar drenajes perimetrales de cabeceras antes de que se intensifiquen las tormentas estivales.'
    ];
  } else if (stepIndex === 2 || stepIndex === 3) {
    sojaStatus = diseaseRiskPercent > 70 ? 'ALERTA SANITARIA / PISO' : 'LLENADO R5';
    sojaClass = diseaseRiskPercent > 70 ? 'bg-red' : 'bg-amber';
    sojaText = 'Enfermedades de Fin de Ciclo (EFC) y Mancha Ojo de Rana activadas por humedad constante. La proximidad de la napa a ' + napaDepthM + 'm asfixia nódulos fijadores.';
    sojaActions = [
      'Aplicación obligatoria de fungicidas con estrobirulinas + triazoles en estadio R3/R4.',
      'Monitoreo estricto de orugas defoliadoras y chinches que prosperan con microclimas cerrados y húmedos.',
      'Prever cosechas lentas: tener listas cadenas y cables de tiro para maquinaria en zonas bajas.'
    ];
  } else {
    sojaStatus = 'FINALIZACIÓN';
    sojaClass = 'bg-cyan';
    sojaText = 'Cierre de ciclo de cosecha gruesa. Evaluación de daños por encharcamiento en bajos.';
    sojaActions = [
      'Mapeo de rinde con GPS para georreferenciar áreas anegadas y planificar cultivos de servicio invernales.',
      'Acondicionamiento y aireación de silo-bolsas para evitar pudriciones internas por alta temperatura y humedad.'
    ];
  }

  advisories.push({
    crop: 'Soja de 1ra y 2da',
    icon: '🌱',
    status: sojaStatus,
    statusClass: sojaClass,
    text: sojaText,
    actions: sojaActions
  });

  // ==========================================
  // 4. GIRASOL (ESPECIAL SUDESTE Y COSTA)
  // ==========================================
  if (isNecochea) {
    let girasolStatus = diseaseRiskPercent > 70 ? 'ALERTA PODREDUMBRE' : 'CRECIMIENTO';
    let girasolClass = diseaseRiskPercent > 70 ? 'bg-red' : 'bg-green';
    let girasolText = 'El girasol en Necochea, Lobería y Tres Arroyos es sumamente sensible al exceso hídrico. El horizonte de tosca frena el agua superficial, exponiendo raíces y tallos.';
    let girasolActions = [
      'Alerta máxima por Podredumbre húmeda de capítulo (Sclerotinia) y Phomopsis ante lluvias repetidas en floración.',
      'Evitar lotes con baja permeabilidad y pendientes menores al 0.5% en la Cuenca del Quequén.',
      'Control de malezas en preemergencia: los excesos hídricos diluyen residuales y complican rescates mecánicos.'
    ];

    advisories.push({
      crop: 'Girasol (Sudeste Bonaerense)',
      icon: '🌻',
      status: girasolStatus,
      statusClass: girasolClass,
      text: girasolText,
      actions: girasolActions
    });
  }

  // ==========================================
  // 5. GANADERÍA, PASTURAS Y LOGÍSTICA
  // ==========================================
  advisories.push({
    crop: 'Ganadería, Suelo & Logística Rural',
    icon: '🐂',
    status: riskIndex > 65 ? 'MANEJO DE BAJOS' : 'PASTURAS ÓPTIMAS',
    statusClass: riskIndex > 65 ? 'bg-amber' : 'bg-green',
    text: 'Crecimiento explosivo de forraje por temperatura y agua, pero altísimo riesgo de pisoteo destructivo ("efecto pateadero") y pietín podal en hacienda.',
    actions: [
      'Retirar animales de potreros de cañadón y bajos antes del arribo de los temporales previstos.',
      'Instalar corrales de sacrificio en lomas con piso firme y suministrar rollos o silaje.',
      'Verificar estado de alcantarillas y puentes en caminos vecinales de tierra hacia acopios y el Puerto Quequén.'
    ]
  });

  return advisories;
}

/**
 * Genera el informe técnico para exportar / imprimir
 */
export function generateTechnicalReportContent(prediction, liveData, locationInfo) {
  const dateStr = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div class="report-document">
      <div class="report-meta-header" style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="color:#ffffff; font-size:1.15rem; margin:0;">SISTEMA PREDICTOR DE IMPACTO HIDRO-AGRÍCOLA DEL SÚPER NIÑO</h2>
          <span style="background:rgba(16,185,129,0.2); color:#34d399; padding:4px 10px; border-radius:4px; font-weight:bold; font-size:0.75rem;">SPIHA-NIÑO AGRO 2026</span>
        </div>
        <p style="color:#94a3b8; font-size:0.8rem; margin-top:4px;">Generado el ${dateStr} | Ubicación: <strong>${locationInfo.name}</strong></p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:16px;">
        <div style="background:rgba(255,255,255,0.04); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.7rem; color:#94a3b8;">FASE TEMPORAL</div>
          <div style="font-size:0.95rem; font-weight:bold; color:#38bdf8;">${prediction.stepLabel}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.7rem; color:#94a3b8;">ÍNDICE ONI DEL NIÑO</div>
          <div style="font-size:0.95rem; font-weight:bold; color:#ef4444;">+${(prediction.oniIndex ?? prediction.oniVal ?? 2.4).toFixed(2)} °C (Súper Niño)</div>
        </div>
        <div style="background:rgba(255,255,255,0.04); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.7rem; color:#94a3b8;">RIESGO HIDROLÓGICO</div>
          <div style="font-size:0.95rem; font-weight:bold; color:#f59e0b;">${prediction.floodRiskPercent ?? prediction.riskIndex ?? 50}% (${prediction.statusLabel ?? prediction.riskLevel ?? 'ALERTA'})</div>
        </div>
      </div>

      <div style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.3); border-radius:8px; padding:12px; margin-bottom:16px;">
        <h4 style="color:#67e8f9; margin-top:0; margin-bottom:6px; font-size:0.85rem;">Diagnóstico Hídrico & Dinámica de Suelos</h4>
        <p style="color:#e2e8f0; font-size:0.78rem; line-height:1.45; margin:0;">
          Para la zona de <strong>${locationInfo.name}</strong>, el modelo simula precipitaciones acumuladas de <strong>${prediction.projectedRainMm} mm/mes</strong> (+${prediction.rainAnomalyPercent}% sobre la media normal histórica de ${prediction.normalRainMm} mm).
          La napa freática se proyecta a una cota crítica de <strong>${prediction.napaDepthM} metros</strong> bajo superficie, estimando <strong>${prediction.trafficabilityLossDays} días de pérdida de piso</strong> para el tránsito de cosechadoras y pulverizadoras.
        </p>
      </div>

      <h4 style="color:#ffffff; font-size:0.85rem; margin-bottom:8px;">Síntesis de Recomendaciones para el Productor:</h4>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:0.78rem; color:#cbd5e1;">
        <div style="padding:8px; background:rgba(255,255,255,0.02); border-left:3px solid #10b981;">
          <strong>Trigo / Cebada:</strong> Control estricto de Fusariosis y hongos foliares con carboxamidas. Cosechar anticipadamente apenas se alcance 14% de humedad.
        </div>
        <div style="padding:8px; background:rgba(255,255,255,0.02); border-left:3px solid #3b82f6;">
          <strong>Maíz & Soja:</strong> Fraccionar nitrógeno para evitar lixiviación. Evitar siembras en cubetas y bajos sin salida superficial de agua.
        </div>
        <div style="padding:8px; background:rgba(255,255,255,0.02); border-left:3px solid #f59e0b;">
          <strong>Logística & Silo-Bolsas:</strong> Mover granos embolsados a cabeceras de loma firmes con acceso entoscado permanente hacia caminos principales.
        </div>
      </div>

      <div style="margin-top:20px; font-size:0.68rem; color:#64748b; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
        Fuente de datos en vivo: Open-Meteo Weather API & Modelo Integrado de Drenaje Topográfico AURA-NIÑO Argentina.
      </div>
    </div>
  `;
}
