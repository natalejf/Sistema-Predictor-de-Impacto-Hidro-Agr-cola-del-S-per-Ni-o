/**
 * AURA-NIÑO AGRO 2026 - OPEN-METEO API & DATA INTEGRATION
 * Interfaz con la API pública y gratuita de Open-Meteo para datos meteorológicos y edáficos en vivo.
 */

const CACHE = new Map();

export const KEY_LOCATIONS = {
  necochea: {
    name: 'Necochea (Sudeste Bonaerense - Cuenca Quequén)',
    lat: -38.5545,
    lon: -58.7396,
    elevation: 16,
    basin: 'Cuenca del Río Quequén Grande',
    soilType: 'Molisol somero con tosca petrocálcica a 40-70cm',
    regionalVulnerability: 0.92
  },
  tres_arroyos: {
    name: 'Tres Arroyos (Sur Pampeano)',
    lat: -38.3762,
    lon: -60.2798,
    elevation: 98,
    basin: 'Cuenca del Río Claromecó y Quequén Salado',
    soilType: 'Argiudol típico con tosca discontinua',
    regionalVulnerability: 0.78
  },
  balcarce: {
    name: 'Balcarce / Tandil (Mar y Sierras)',
    lat: -37.8475,
    lon: -58.2552,
    elevation: 115,
    basin: 'Pie de sierras del Sistema de Tandilia',
    soilType: 'Argiudol lítico profundo en lomas, hidromórfico en valles',
    regionalVulnerability: 0.70
  },
  pergamino: {
    name: 'Pergamino (Zona Núcleo Norte)',
    lat: -33.8908,
    lon: -60.5736,
    elevation: 65,
    basin: 'Cuenca del Río Arrecifes',
    soilType: 'Argiudol típico de altísima aptitud agrícola',
    regionalVulnerability: 0.85
  },
  pehuajo: {
    name: 'Pehuajó / 9 de Julio (Cuenca Salado)',
    lat: -35.8133,
    lon: -61.8953,
    elevation: 84,
    basin: 'Cuenca Alta del Río Salado (Drenaje muy lento)',
    soilType: 'Hapludol / Natracualf susceptible a inundación prolongada',
    regionalVulnerability: 0.98
  },
  venado_tuerto: {
    name: 'Venado Tuerto (Sur Santa Fe)',
    lat: -33.7456,
    lon: -61.9688,
    elevation: 111,
    basin: 'Cuencas endorreicas pampeanas',
    soilType: 'Hapludol típico de loma, lagunas en cubetas',
    regionalVulnerability: 0.75
  },
  rosario: {
    name: 'Rosario / Litoral Sur',
    lat: -32.9468,
    lon: -60.6393,
    elevation: 31,
    basin: 'Valle de inundación del Río Paraná Inferior',
    soilType: 'Vertisol / Argiudol fluvial',
    regionalVulnerability: 0.82
  },
  gualeguaychu: {
    name: 'Gualeguaychú (Entre Ríos)',
    lat: -33.0104,
    lon: -58.5172,
    elevation: 20,
    basin: 'Baja Cuenca del Río Uruguay y Gualeguaychú',
    soilType: 'Vertisol arcilloso pesado (expansivo)',
    regionalVulnerability: 0.95
  },
  corrientes: {
    name: 'Corrientes (Litoral Norte)',
    lat: -27.4692,
    lon: -58.8306,
    elevation: 55,
    basin: 'Alto Paraná / Esteros del Iberá',
    soilType: 'Suelos arenosos y esteros aluviales',
    regionalVulnerability: 0.96
  },
  rio_cuarto: {
    name: 'Río Cuarto (Córdoba Sur)',
    lat: -33.1307,
    lon: -64.3499,
    elevation: 452,
    basin: 'Cuenca del Río Cuarto / Chocancharava',
    soilType: 'Hapludol éntico con textura franco-arenosa',
    regionalVulnerability: 0.62
  },
  uruguay_salto: {
    name: 'Salto / Paysandú (Litoral Uruguayo)',
    lat: -31.3833,
    lon: -57.9667,
    elevation: 48,
    basin: 'Bajo Río Uruguay (Alto riesgo de crecidas)',
    soilType: 'Vertisol / Brunosol de gran fertilidad',
    regionalVulnerability: 0.90
  },
  brasil_porto_alegre: {
    name: 'Porto Alegre (Río Grande do Sul, Brasil)',
    lat: -30.0346,
    lon: -51.2177,
    elevation: 10,
    basin: 'Cuenca del Lago Guaíba / Jacuí',
    soilType: 'Argisol aluvial muy susceptible a inundación histórica',
    regionalVulnerability: 0.96
  },
  paraguay_asuncion: {
    name: 'Asunción (Paraguay)',
    lat: -25.2637,
    lon: -57.5759,
    elevation: 43,
    basin: 'Valle del Río Paraguay',
    soilType: 'Alfisol y sedimentos aluviales',
    regionalVulnerability: 0.88
  },
  peru_piura: {
    name: 'Piura (Costa Norte de Perú)',
    lat: -5.1945,
    lon: -80.6328,
    elevation: 29,
    basin: 'Cuenca del Río Piura (Epicentro de El Niño Costero)',
    soilType: 'Fluvisol / Arenoso con riesgo de huaicos destructivos',
    regionalVulnerability: 0.98
  }
};

/**
 * Consulta la API pública Open-Meteo para una latitud y longitud dadas.
 */
export async function fetchLiveWeatherAndSoil(lat, lon) {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey);
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America%2FArgentina%2FBuenos_Aires`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const processed = processOpenMeteoPayload(data, lat, lon);
    CACHE.set(cacheKey, processed);
    return processed;
  } catch (err) {
    console.warn('Usando modelo agroclimático calibrado (Open-Meteo offline o fallback):', err.message);
    const fallback = generateSyntheticData(lat, lon);
    CACHE.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Normaliza los datos meteorológicos y procesa humedad de suelo.
 */
function processOpenMeteoPayload(raw, lat, lon) {
  const current = raw.current || {};
  const hourly = raw.hourly || {};
  const daily = raw.daily || {};

  // Promediar capas superficiales de humedad de suelo (0 a 27cm) en m³/m³
  const m1 = hourly.soil_moisture_0_to_1cm ? averageRecent(hourly.soil_moisture_0_to_1cm) : 0.32;
  const m2 = hourly.soil_moisture_1_to_3cm ? averageRecent(hourly.soil_moisture_1_to_3cm) : 0.34;
  const m3 = hourly.soil_moisture_3_to_9cm ? averageRecent(hourly.soil_moisture_3_to_9cm) : 0.36;
  const m4 = hourly.soil_moisture_9_to_27cm ? averageRecent(hourly.soil_moisture_9_to_27cm) : 0.38;

  const avgMoisture = (m1 + m2 + m3 + m4) / 4;
  // Convertir m³/m³ a porcentaje estimado de Capacidad de Campo (CC ~ 0.38 m3/m3 para molisoles bonaerenses)
  const fieldCapacityPercent = Math.min(100, Math.round((avgMoisture / 0.38) * 100));

  // Acumulado de lluvia próximos 7 días según pronóstico
  const rainNext7Days = daily.precipitation_sum
    ? daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0)
    : 45;

  return {
    source: 'Open-Meteo Live API',
    isLive: true,
    lat,
    lon,
    currentTemp: Math.round(current.temperature_2m ?? 21),
    humidity: Math.round(current.relative_humidity_2m ?? 75),
    windSpeed: Math.round(current.wind_speed_10m ?? 18),
    currentPrecip: current.precipitation ?? 0,
    soilMoisturePercent: fieldCapacityPercent,
    avgMoistureVolumetric: avgMoisture.toFixed(3),
    forecast7dRain: Math.round(rainNext7Days),
    forecastDaily: (daily.time || []).map((t, idx) => ({
      date: t,
      maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[idx] : 24,
      minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[idx] : 14,
      rain: daily.precipitation_sum ? daily.precipitation_sum[idx] : 0,
      rainProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 40
    }))
  };
}

function averageRecent(arr) {
  if (!arr || arr.length === 0) return 0.35;
  const slice = arr.slice(0, 24);
  const sum = slice.reduce((a, b) => a + (b || 0), 0);
  return sum / slice.length;
}

/**
 * Búsqueda de cualquier localidad del mundo / América Latina / Argentina
 * usando la API pública y gratuita de Geocodificación de Open-Meteo
 */
export async function searchLocationByName(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = encodeURIComponent(query.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cleanQuery}&count=6&language=es&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(r => ({
      name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ' (' + r.country + ')' : ''}`,
      simpleName: r.name,
      lat: r.latitude,
      lon: r.longitude,
      elevation: r.elevation || 50,
      country: r.country,
      countryCode: r.country_code,
      admin1: r.admin1
    }));
  } catch (err) {
    console.warn('Error en geocodificación Open-Meteo:', err);
    return [];
  }
}

