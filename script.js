// Configuración del mapa
const mapConfig = {
    center: [20.6596, -103.3496], // Centro de Jalisco (Guadalajara)
    zoom: 9,
    minZoom: 7,
    maxZoom: 15
};

// Inicializar el mapa
const map = L.map('map').setView(mapConfig.center, mapConfig.zoom);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Variable para almacenar los marcadores
let markers = [];

// URL de la hoja de cálculo en formato CSV
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1x8jI4RYM6nvhydMfxBn68x7shxyEuf_KWNC0iDq8mzw/export?format=csv&gid=0';

/**
 * Función para cargar y procesar los datos de la hoja de cálculo
 */
async function loadDataFromSheet() {
    try {
        console.log('Cargando datos de la hoja de cálculo...');
        
        // Hacer fetch a la URL de exportación CSV
        const response = await fetch(SPREADSHEET_URL);
        const csvText = await response.text();
        
        // Procesar el CSV
        const pueblos = parseCSV(csvText);
        
        console.log(`Se cargaron ${pueblos.length} pueblos mágicos`);
        
        // Agregar marcadores al mapa
        pueblos.forEach(pueblo => {
            addMarkerToMap(pueblo);
        });
        
        // Ajustar el mapa para mostrar todos los marcadores
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
        
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        alert('Error al cargar los datos de la hoja de cálculo. Por favor, recarga la página.');
    }
}

/**
 * Función para parsear el CSV
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const pueblos = [];
    
    // Saltar la primera línea (encabezados)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue; // Saltar líneas vacías
        
        // Parsear la línea CSV (manejo de comillas)
        const cells = parseCSVLine(line);
        
        if (cells.length >= 8 && cells[1]) {
            const pueblo = {
                id: cells[0],
                nombre: cells[1].trim(),
                latitud: parseFloat(cells[2]),
                longitud: parseFloat(cells[3]),
                consejos: cells[4] ? cells[4].trim().substring(0, 150) : '',
                distancia_tiempo: cells[5] ? cells[5].trim() : '',
                ruta: cells[6] ? cells[6].trim() : '',
                link: cells[7] ? cells[7].trim() : ''
            };
            
            // Validar que las coordenadas sean válidas
            if (!isNaN(pueblo.latitud) && !isNaN(pueblo.longitud)) {
                pueblos.push(pueblo);
            }
        }
    }
    
    return pueblos;
}

/**
 * Función para parsear una línea CSV respetando comillas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++; // Saltar el siguiente carácter
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

/**
 * Función para agregar un marcador al mapa
 */
function addMarkerToMap(pueblo) {
    // Crear un icono personalizado
    const customIcon = L.icon({
        iconUrl: 'icon.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'custom-marker'
    });
    
    // Crear el marcador
    const marker = L.marker([pueblo.latitud, pueblo.longitud], {
        icon: customIcon,
        title: pueblo.nombre
    }).addTo(map);
    
    // Crear el contenido del pop-up
    const popupHTML = createPopupContent(pueblo);
    
    // Agregar el pop-up al marcador
    marker.bindPopup(popupHTML, {
        maxWidth: 400,
        className: 'custom-popup'
    });
    
    // Agregar evento para abrir el pop-up al hacer clic
    marker.on('click', function() {
        this.openPopup();
    });
    
    // Guardar el marcador en la lista
    markers.push(marker);
}

/**
 * Función para crear el contenido HTML del pop-up
 */
function createPopupContent(pueblo) {
    const html = `
        <div class="popup-content">
            <div class="popup-title">${pueblo.nombre}</div>
            <div class="popup-info">
                <span class="popup-label">Desde Guadalajara:</span>
                <span class="popup-value">${pueblo.distancia_tiempo}</span>
            </div>
            ${pueblo.ruta ? `
            <div class="popup-info">
                <span class="popup-label">Ruta:</span>
                <span class="popup-value">${pueblo.ruta}</span>
            </div>
            ` : ''}
            ${pueblo.link ? `
            <div class="popup-link">
                <a href="${pueblo.link}" target="_blank" rel="noopener noreferrer">
                    🔗 Ver más información
                </a>
            </div>
            ` : ''}
        </div>
    `;
    
    return html;
}

/**
 * Función para limpiar los marcadores existentes
 */
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

/**
 * Función para recargar los datos
 */
function reloadData() {
    clearMarkers();
    loadDataFromSheet();
}

// Cargar los datos cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromSheet();
});

// Permitir recargar datos con Ctrl+R o F5
document.addEventListener('keydown', function(event) {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        reloadData();
    }
});
