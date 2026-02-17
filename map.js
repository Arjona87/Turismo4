/**
 * Dashboard Turismo - Jalisco
 * Script principal para la gestión del mapa interactivo
 * 
 * Funcionalidades:
 * - Carga del mapa base con Leaflet
 * - Renderizado de municipios desde GeoJSON
 * - Interactividad: hover transparente y click para mostrar información
 * - Pop-ups con información turística de cada municipio
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

let map;
let geojsonLayer;
let municipiosData = {};
let currentActiveFeature = null;
let pueblosMagicosData = [];
let pueblosMagicosMarkers = [];

// Colores y estilos
const STYLES = {
    default: {
        color: '#666',
        weight: 2,
        opacity: 0.7,
        fillColor: '#d0d0d0',
        fillOpacity: 0.7
    },
    hover: {
        color: '#2a5298',
        weight: 2.5,
        opacity: 1,
        fillColor: '#2a5298',
        fillOpacity: 0.3
    },
    active: {
        color: '#1e3c72',
        weight: 3,
        opacity: 1,
        fillColor: '#2a5298',
        fillOpacity: 0.5
    }
};

// ============================================
// INICIALIZACIÓN DEL MAPA
// ============================================

function initMap() {
    // Crear mapa centrado en Jalisco
    // Coordenadas aproximadas del centro de Jalisco
    map = L.map('map').setView([20.5, -103.5], 8);

    // Agregar capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 7
    }).addTo(map);

    // Cargar datos de municipios
    loadMunicipiosData();
    
    // Cargar y mostrar Pueblos Mágicos
    loadPueblosMagicos();
}

// ============================================
// CARGAR Y MOSTRAR PUEBLOS MÁGICOS
// ============================================

function loadPueblosMagicos() {
    fetch('pueblos_magicos.json')
        .then(response => response.json())
        .then(data => {
            pueblosMagicosData = data.pueblos_magicos;
            addPueblosMagicosToMap();
        })
        .catch(error => console.error('Error cargando pueblos_magicos.json:', error));
}

function addPueblosMagicosToMap() {
    // Crear ícono personalizado para Pueblos Mágicos
    const puebloMagicoIcon = L.icon({
        iconUrl: 'pueblo-magico-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    // Agregar marcador para cada Pueblo Mágico
    pueblosMagicosData.forEach(pueblo => {
        const marker = L.marker([pueblo.lat, pueblo.lng], {
            icon: puebloMagicoIcon,
            title: pueblo.nombre,
            zIndexOffset: 1000 // Asegurar que los íconos estén por encima de los polígonos
        }).addTo(map);

        // Agregar tooltip con el nombre del Pueblo Mágico
        marker.bindTooltip(pueblo.nombre, {
            permanent: false,
            direction: 'top',
            className: 'pueblo-magico-tooltip'
        });

        // Agregar evento de click para mostrar información del municipio
        marker.on('click', function() {
            showMunicipioInfo(pueblo.municipio);
        });

        pueblosMagicosMarkers.push(marker);
    });
}

// ============================================
// CARGAR DATOS DE MUNICIPIOS
// ============================================

function loadMunicipiosData() {
    // Cargar información de distancia y tiempo
    fetch('municipios_info.json')
        .then(response => response.json())
        .then(data => {
            municipiosData = data.municipios;
            // Cargar GeoJSON después de obtener los datos
            loadGeoJSON();
        })
        .catch(error => console.error('Error cargando municipios_info.json:', error));
}

// ============================================
// CARGAR GEOJSON DE MUNICIPIOS
// ============================================

function loadGeoJSON() {
    fetch('jalisco_municipios.geojson')
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: getFeatureStyle,
                onEachFeature: onEachFeature
            }).addTo(map);

            // Ajustar vista al mapa cargado
            if (geojsonLayer.getLayers().length > 0) {
                map.fitBounds(geojsonLayer.getBounds(), { padding: [50, 50] });
            }
        })
        .catch(error => console.error('Error cargando GeoJSON:', error));
}

// ============================================
// OBTENER ESTILO DE CARACTERÍSTICA
// ============================================

function getFeatureStyle(feature) {
    return STYLES.default;
}

// ============================================
// PROCESAR CADA CARACTERÍSTICA DEL GEOJSON
// ============================================

function onEachFeature(feature, layer) {
    const municipioNombre = feature.properties.NOMGEO;

    // Agregar eventos de mouse
    layer.on('mouseover', function() {
        this.setStyle(STYLES.hover);
        this.bringToFront();
        
        // Mostrar nombre del municipio en tooltip
        this.bindTooltip(municipioNombre, {
            permanent: false,
            direction: 'center',
            className: 'municipio-tooltip'
        }).openTooltip();
    });

    layer.on('mouseout', function() {
        // Restaurar estilo anterior si no está activo
        if (currentActiveFeature !== this) {
            this.setStyle(STYLES.default);
        }
        this.closeTooltip();
    });

    // Evento de click para mostrar información
    layer.on('click', function() {
        // Remover estilo activo del municipio anterior
        if (currentActiveFeature && currentActiveFeature !== this) {
            currentActiveFeature.setStyle(STYLES.default);
        }

        // Establecer nuevo municipio como activo
        currentActiveFeature = this;
        this.setStyle(STYLES.active);

        // Mostrar modal con información
        showMunicipioInfo(municipioNombre);
    });
}

// ============================================
// MOSTRAR INFORMACIÓN DEL MUNICIPIO
// ============================================

function showMunicipioInfo(municipioNombre) {
    // Obtener datos del municipio
    const info = municipiosData[municipioNombre] || {
        distancia_km: 'N/A',
        tiempo_horas: 'N/A',
        tiempo_minutos: 'N/A'
    };

    // Construir contenido del modal
    const modalBody = document.getElementById('modalBody');
    
    // Texto de recomendaciones de viaje (seguridad)
    const recomendacionesTexto = `abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz`;

    const tiempoFormato = `${info.tiempo_horas} horas (${info.tiempo_minutos} minutos)`;

    modalBody.innerHTML = `
        <h2>${municipioNombre}</h2>
        
        <div class="info-section">
            <div class="info-label">📍 Distancia desde Guadalajara</div>
            <div class="info-value">${info.distancia_km} km en carretera</div>
        </div>

        <div class="info-section">
            <div class="info-label">⏱️ Tiempo estimado de viaje</div>
            <div class="info-value">${tiempoFormato}</div>
        </div>

        <div class="info-section">
            <div class="info-label">🌟 Más información</div>
            <div class="info-value">
                <a href="https://pueblosmagicos.mexicodesconocido.com.mx/jalisco" target="_blank">
                    Pueblos Mágicos de Jalisco →
                </a>
            </div>
        </div>

        <div class="recomendaciones">
            <div class="recomendaciones-title">🛡️ Recomendaciones de Viaje (Seguridad)</div>
            <div class="recomendaciones-text">${recomendacionesTexto}</div>
        </div>
    `;

    // Mostrar modal
    const modal = document.getElementById('infoModal');
    modal.style.display = 'block';
}

// ============================================
// CERRAR MODAL
// ============================================

function closeModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'none';

    // Remover estilo activo del municipio
    if (currentActiveFeature) {
        currentActiveFeature.setStyle(STYLES.default);
        currentActiveFeature = null;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar mapa cuando el DOM esté listo
    initMap();

    // Cerrar modal al hacer click en el botón X
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Cerrar modal al hacer click fuera del contenido
    const modal = document.getElementById('infoModal');
    if (modal) {
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});

// ============================================
// ESTILOS PARA TOOLTIPS
// ============================================

// Agregar estilos CSS dinámicamente para los tooltips
const style = document.createElement('style');
style.textContent = `
    .municipio-tooltip {
        background-color: rgba(30, 60, 114, 0.9) !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 8px 12px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }

    .municipio-tooltip::before {
        border-top-color: rgba(30, 60, 114, 0.9) !important;
    }

    .pueblo-magico-tooltip {
        background-color: rgba(139, 0, 139, 0.9) !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 8px 12px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }

    .pueblo-magico-tooltip::before {
        border-top-color: rgba(139, 0, 139, 0.9) !important;
    }
`;
document.head.appendChild(style);
