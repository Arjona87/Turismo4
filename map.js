// Inicializar mapa
const map = L.map('map').setView([20.5, -103.5], 8);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Variables globales
let municipiosData = {};
let pueblosMagicosData = [];
let municipiosGeoJSON = null;

// Cargar datos desde municipios_data.json
async function loadMunicipiosData() {
    try {
        const response = await fetch('municipios_data.json');
        const data = await response.json();
        
        data.municipios.forEach(m => {
            municipiosData[m.nombre] = m;
            pueblosMagicosData.push({
                nombre: m.nombre,
                lat: m.lat,
                lng: m.lng
            });
        });
        
        console.log('Datos cargados:', Object.keys(municipiosData).length, 'pueblos');
        
        loadMunicipiosGeoJSON();
        addPueblosMagicosToMap();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Cargar GeoJSON de municipios
function loadMunicipiosGeoJSON() {
    fetch('jalisco_municipios.geojson')
        .then(response => response.json())
        .then(data => {
            municipiosGeoJSON = data;
            addMunicipiosToMap();
        })
        .catch(error => console.error('Error cargando GeoJSON:', error));
}

// Agregar municipios al mapa
function addMunicipiosToMap() {
    L.geoJSON(municipiosGeoJSON, {
        style: {
            color: '#999',
            weight: 1,
            opacity: 0.7,
            fillColor: '#f0f0f0',
            fillOpacity: 0.3
        },
        onEachFeature: function(feature, layer) {
            const nombreMunicipio = feature.properties.NOMGEO;
            
            layer.on('click', function() {
                showMunicipioInfo(nombreMunicipio);
            });
            
            layer.on('mouseover', function() {
                layer.setStyle({
                    fillOpacity: 0.5,
                    weight: 2
                });
                
                // Mostrar nombre en tooltip
                const popup = L.popup()
                    .setLatLng(layer.getBounds().getCenter())
                    .setContent(nombreMunicipio)
                    .openOn(map);
            });
            
            layer.on('mouseout', function() {
                layer.setStyle({
                    fillOpacity: 0.3,
                    weight: 1
                });
                map.closePopup();
            });
        }
    }).addTo(map);
}

// Agregar marcadores de Pueblos Mágicos
function addPueblosMagicosToMap() {
    const puebloMagicoIcon = L.icon({
        iconUrl: 'pueblo-magico-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
    
    pueblosMagicosData.forEach(pueblo => {
        const marker = L.marker([pueblo.lat, pueblo.lng], {
            icon: puebloMagicoIcon,
            zIndexOffset: 1000
        }).addTo(map);
        
        marker.on('click', function() {
            showMunicipioInfo(pueblo.nombre);
        });
        
        marker.bindTooltip(pueblo.nombre, {
            permanent: false,
            direction: 'top'
        });
    });
}

// Mostrar información del municipio en modal
function showMunicipioInfo(nombreMunicipio) {
    const data = municipiosData[nombreMunicipio];
    
    if (!data) {
        console.error('No se encontraron datos para:', nombreMunicipio);
        return;
    }
    
    const modalBody = document.getElementById('modalBody');
    
    // Construir HTML del modal
    let html = `
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 10px;">
            ${data.nombre}
        </h2>
        
        <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 16px;">📍</span>
                <span style="font-weight: bold; color: #333;">DESDE GUADALAJARA</span>
            </div>
            <div style="margin-left: 24px; color: #666; font-size: 14px;">
                ${data.distancia_tiempo}
            </div>
        </div>
        
        <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 16px;">🛡️</span>
                <span style="font-weight: bold; color: #333;">CONSEJOS DE SEGURIDAD</span>
            </div>
            <div style="margin-left: 24px; color: #666; font-size: 13px; line-height: 1.4;">
                ${data.consejos_seguridad}
            </div>
        </div>
        
        <div style="margin-bottom: 12px;">
            <a href="tel:911" style="display: block; background-color: #c41e3a; color: white; padding: 12px; text-align: center; text-decoration: none; font-weight: bold; border-radius: 4px; font-size: 14px;">
                📞 LLAMAR AL 911
            </a>
        </div>
        
        <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 16px;">🗺️</span>
                <span style="font-weight: bold; color: #333;">RUTA / VIAJE DESDE GDL</span>
            </div>
            <div style="margin-left: 24px;">
                <a href="${data.ruta_viaje}" target="_blank" style="color: #0066cc; text-decoration: none; font-size: 13px;">
                    ${data.ruta_viaje} →
                </a>
            </div>
        </div>
        
        <div style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 16px;">🌍</span>
                <span style="font-weight: bold; color: #333;">LINK TURISMO</span>
            </div>
            <div style="margin-left: 24px;">
                <a href="${data.link_turismo}" target="_blank" style="color: #0066cc; text-decoration: none; font-size: 13px;">
                    ${data.link_turismo} →
                </a>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    document.getElementById('infoModal').style.display = 'block';
}

// Cerrar modal
function closeModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Event listeners para cerrar modal
document.querySelector('.close-btn').addEventListener('click', closeModal);

document.getElementById('infoModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeModal();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Cargar datos al iniciar
window.addEventListener('load', function() {
    loadMunicipiosData();
});
