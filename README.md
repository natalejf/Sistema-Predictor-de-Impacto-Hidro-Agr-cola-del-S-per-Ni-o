# Sistema de Predicción del Super Niño (SPSN)

> **Plataforma web geoespacial interactiva para la predicción, monitoreo y análisis hidroclimático del avance y la estela del fenómeno de Súper Niño (ENSO).**

🌐 **Acceso en línea (GitHub Pages):**  
👉 **[https://natalejf.github.io/Sistema-Predictor-de-Impacto-Hidro-Agr-cola-del-S-per-Ni-o/](https://natalejf.github.io/Sistema-Predictor-de-Impacto-Hidro-Agr-cola-del-S-per-Ni-o/)**

---

## 👨‍💻 Autor & Créditos
* **Creador:** **Juan Francisco Natale**
* **Desarrollado con:** Inteligencia Artificial (IA)
* **Perfil de LinkedIn:** [https://www.linkedin.com/in/juan-francisco-natale-a35668433/](https://www.linkedin.com/in/juan-francisco-natale-a35668433/)
* **APIs Integradas:**
  - **Open-Meteo Weather API** (telemetría meteorológica y humedad de suelo en tiempo real)
  - **CARTO Basemaps API** (cartografía base geoespacial oscura de alto rendimiento)
  - **Esri World Imagery** (imágenes satelitales de alta resolución)

---

## 🌾 Descripción del Proyecto

El **Sistema de Predicción del Super Niño (SPSN)** es una herramienta tecnológica para visualizar el corredor atmosférico de la tormenta del Niño, su desplazamiento temporal en el Océano Pacífico y Sudamérica, mapas de calor de riesgo de inundación por relieve y dinámica de desborde de cuencas fluviales.

---

## 🚀 Características Principales

1. **Mapa Interactivo Multicapa (Leaflet GIS):**
   * Capa de **Riesgo de Anegamiento & Inundación** (0 a 100%).
   * Capa de **Anomalías de Precipitación** (desviación porcentual y mm acumulados).
   * Capa de **Profundidad de Napa Freática** (metros bajo superficie del lote).
   * Capa de **Humedad en Perfil de Suelo** (0-100% capacidad de campo).
   * Capa de **Pérdida de Piso** (días/mes no laborables para pulverizadoras y cosechadoras).
   * Conmutador a cartografía satelital de alta resolución (Esri World Imagery).
   * Trazado vectorial de la **Red de Cuencas Hidrográficas** (Río Quequén Grande, Salado bonaerense, Paraná, Uruguay).
   * Líneas de cotas de relieve y parteaguas (Sistema de Tandilia y Ventania).

2. **Integración con API Pública y Gratuita (Open-Meteo):**
   * Consulta en vivo para cualquier coordenada del territorio argentino.
   * Telemetría en tiempo real: temperatura, humedad, viento, pronóstico a 7 días y humedad volumétrica de suelo (0-27 cm).

3. **Línea de Tiempo y Simulación Temporal:**
   * 6 etapas evolutivas: *Mes Actual*, *+1 Mes (Expansión)*, *+2 Meses (Pico Máximo Sur)*, *+3 Meses (Cosecha Gruesa)*, *+6 Meses (Declive)* y *+12 Meses (Post-Niño)*.
   * Reproductor animado automatizado (`Play/Pause`).
   * 3 Escenarios Climáticos: **Súper Niño Extremo (+2.5°C)**, **Niño Fuerte Canónico (+2.0°C)** y **Niño Modoki**.

4. **Motor de Decisiones para Productores:**
   * **Cebada Cervecera & Trigo Pan:** Manejo de Fusariosis, fungicidas dobles, anticipación de cosecha al 14% de humedad.
   * **Maíz:** Fraccionamiento nitrogenado para evitar lixiviación masiva, siembra en lomas.
   * **Soja:** Control de Enfermedades de Fin de Ciclo (EFC), anoxia radicular y equipamiento de tracción.
   * **Girasol (Sudeste):** Alerta por *Sclerotinia* (podredumbre de capítulo) y *Phomopsis*.
   * **Ganadería & Pasturas:** Prevención del efecto pateadero y pietín podal, manejo de corrales de sacrificio en loma.

5. **Gráficos Dinámicos (Chart.js):**
   * Precipitaciones proyectadas vs. Normal Histórica (1991-2020).
   * Evolución de cota de napa freática en metros.
   * Curva térmica del Índice Oceánico El Niño (ONI).

6. **Exportación de Informe Técnico:**
   * Generador de informe con formato listo para imprimir o guardar como PDF.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 Semántico** & **CSS3 Moderno** (Dark Glassmorphism, CSS Custom Properties).
* **JavaScript Moderno (ES6+)**.
* **Leaflet.js** (Sistemas de Información Geográfica y cartografía interactiva).
* **Chart.js** (Visualización interactiva de telemetría hidroclimática).
* **Open-Meteo API** (Meteorología y humedad de suelo en tiempo real).
* **Vite** (Compilador y servidor ultra-rápido).

---

## 💻 Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/natalejf/Sistema-Predictor-de-Impacto-Hidro-Agr-cola-del-S-per-Ni-o.git
   cd Sistema-Predictor-de-Impacto-Hidro-Agr-cola-del-S-per-Ni-o
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir en el navegador en `http://localhost:5173/`.

4. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
