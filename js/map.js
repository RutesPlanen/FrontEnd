let map;
let routeLayer;
let warehouseAddress = '';
let currentStops = [];
let startCoords = null;
let lagerCoords = null;

const BACKEND = 'http://localhost:8080/api';

function authHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
}

async function backendPost(path, body) {
    const res = await fetch(BACKEND + path, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

function initMap() {
    map = L.map('map').setView([55.6761, 12.5683], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

async function hentKonfig() {
    try {
        const cfg = await apiFetch('/map/config');
        warehouseAddress = cfg.warehouseAddress;
        document.getElementById('lager-tekst').textContent = warehouseAddress;
    } catch {
        document.getElementById('lager-tekst').textContent = 'Kunne ikke hente lageradresse';
    }
}

async function geocodeAddress(address) {
    const res = await apiFetch('/map/geocode?address=' + encodeURIComponent(address));
    if (!res.features || res.features.length === 0)
        throw new Error('Adresse ikke fundet: ' + address);
    const [lng, lat] = res.features[0].geometry.coordinates;
    return [lat, lng];
}

async function hentPendingRestauranter() {
    const [pending, planned] = await Promise.all([
        apiFetch('/pickup-requests?status=PENDING'),
        apiFetch('/pickup-requests?status=PLANNED')
    ]);
    return [...pending, ...planned];
}

async function beregnOptimalRute(koordinater) {
    const coords = koordinater.map(([lat, lng]) => [lng, lat]);
    const body = {
        jobs: coords.slice(1, -1).map(([lng, lat], i) => ({
            id: i + 1,
            location: [lng, lat]
        })),
        vehicles: [{
            id: 1,
            profile: 'driving-car',
            start: coords[0],
            end: coords[coords.length - 1]
        }]
    };
    return await backendPost('/map/optimize', body);
}

async function tegneRute(orderedCoords) {
    const coords = orderedCoords.map(([lat, lng]) => [lng, lat]);
    const data = await backendPost('/map/directions', { coordinates: coords });

    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.geoJSON(data, {
        style: { color: '#1a73e8', weight: 5, opacity: 0.85 }
    }).addTo(map);
    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

    const summary = data.features[0].properties.summary;
    return {
        distance: (summary.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(summary.duration / 60) + ' min'
    };
}

function clearMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
    });
}

function tilfoejMarkoer(coords, label, popupHtml, farve = '#1a73e8') {
    L.marker(coords).addTo(map)
        .bindPopup(popupHtml)
        .setIcon(L.divIcon({
            className: '',
            html: `<div style="background:${farve};color:white;width:28px;height:28px;
                border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-weight:700;font-size:12px;border:2px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,.3);">${label}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        }));
}

function renderStopListe(stops) {
    const ul = document.getElementById('stop-list');
    ul.innerHTML = '';
    ul.appendChild(laveItem('▶', '#34a853', 'Start', document.getElementById('start-input').value.trim(), false));
    stops.forEach((s, i) => {
        const li = document.createElement('li');
        li.className = 'stop-item';
        li.draggable = true;
        li.dataset.index = i;
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            <div class="stop-num">${i + 1}</div>
            <div class="stop-text">
                <strong>${s.navn}</strong>
                <span>${s.adresse}</span>
            </div>`;
        tilfoejDragEvents(li);
        ul.appendChild(li);
    });
    ul.appendChild(laveItem('🏭', '#ea4335', 'Lager', warehouseAddress, false));
}

function laveItem(label, farve, titel, undertekst, draggable) {
    const li = document.createElement('li');
    li.className = 'stop-item';
    li.draggable = draggable;
    li.innerHTML = `
        <span class="drag-handle" style="visibility:hidden">⠿</span>
        <div class="stop-num" style="background:${farve};font-size:0.65rem;">${label}</div>
        <div class="stop-text">
            <strong>${titel}</strong>
            <span>${undertekst}</span>
        </div>`;
    return li;
}

let dragSrc = null;

function tilfoejDragEvents(li) {
    li.addEventListener('dragstart', e => {
        dragSrc = li;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('.stop-item').forEach(el => el.classList.remove('drag-over'));
    });
    li.addEventListener('dragover', e => {
        e.preventDefault();
        if (li !== dragSrc) li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (!dragSrc || dragSrc === li) return;
        const fromIdx = parseInt(dragSrc.dataset.index);
        const toIdx = parseInt(li.dataset.index);
        if (isNaN(fromIdx) || isNaN(toIdx)) return;
        const [moved] = currentStops.splice(fromIdx, 1);
        currentStops.splice(toIdx, 0, moved);
        renderStopListe(currentStops);
        document.getElementById('btn-opdater').style.display = 'block';
    });
}

function setLoading(tekst) {
    document.getElementById('loading-bar').style.display = 'flex';
    document.getElementById('loading-tekst').textContent = tekst;
    document.getElementById('btn-beregn').disabled = true;
}

function stopLoading() {
    document.getElementById('loading-bar').style.display = 'none';
    document.getElementById('btn-beregn').disabled = false;
    document.getElementById('btn-beregn').textContent = 'Genberegn';
}

function visStats(stops, distance, duration) {
    document.getElementById('stat-stops').textContent = stops;
    document.getElementById('stat-distance').textContent = distance;
    document.getElementById('stat-duration').textContent = duration;
    document.getElementById('stats-bar').style.display = 'flex';
}

document.getElementById('btn-beregn').addEventListener('click', async () => {
    const startInput = document.getElementById('start-input').value.trim();
    if (!startInput) {
        toast('Indtast din startadresse', 'error');
        return;
    }

    document.getElementById('empty-msg').style.display = 'none';
    document.getElementById('stop-panel').style.display = 'none';
    document.getElementById('stats-bar').style.display = 'none';
    clearMarkers();
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }

    try {
        setLoading('Geocoder adresser…');
        [startCoords, lagerCoords] = await Promise.all([
            geocodeAddress(startInput),
            geocodeAddress(warehouseAddress)
        ]);

        setLoading('Henter afhentninger…');
        const anmodninger = await hentPendingRestauranter();

        if (!anmodninger || anmodninger.length === 0) {
            document.getElementById('empty-msg').style.display = 'block';
            stopLoading();
            return;
        }

        setLoading('Geocoder restauranter…');
        const resultater = await Promise.allSettled(
            anmodninger
                .filter(a => a.restaurant?.address)
                .map(async a => {
                    const coords = await geocodeAddress(a.restaurant.address);
                    return { navn: a.restaurant.name || 'Ukendt', adresse: a.restaurant.address, coords };
                })
        );

        currentStops = resultater
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        const fejlede = resultater.filter(r => r.status === 'rejected').length;
        if (fejlede > 0) toast(`${fejlede} adresse(r) kunne ikke geocodes`, 'error');

        if (currentStops.length === 0) {
            document.getElementById('empty-msg').style.display = 'block';
            stopLoading();
            return;
        }

        setLoading('Beregner optimal rækkefølge…');
        const alleKoords = [startCoords, ...currentStops.map(s => s.coords), lagerCoords];
        const optimering = await beregnOptimalRute(alleKoords);

        if (optimering.routes?.[0]?.steps) {
            const steps = optimering.routes[0].steps.filter(s => s.type === 'job');
            currentStops = steps.map(s => currentStops[s.id - 1]).filter(Boolean);
        }

        setLoading('Tegner rute…');
        const ruteKoords = [startCoords, ...currentStops.map(s => s.coords), lagerCoords];
        const { distance, duration } = await tegneRute(ruteKoords);

        tilfoejMarkoer(startCoords, '▶', '<strong>Din startposition</strong>', '#34a853');
        currentStops.forEach((s, i) =>
            tilfoejMarkoer(s.coords, i + 1, `<strong>${i + 1}. ${s.navn}</strong><br>${s.adresse}`));
        tilfoejMarkoer(lagerCoords, '🏭', `<strong>Lager</strong><br>${warehouseAddress}`, '#ea4335');

        visStats(currentStops.length, distance, duration);
        renderStopListe(currentStops);
        document.getElementById('stop-panel').style.display = 'block';
        document.getElementById('btn-opdater').style.display = 'none';

    } catch (err) {
        console.error(err);
        toast('Fejl: ' + err.message, 'error');
    } finally {
        stopLoading();
    }
});

document.getElementById('btn-opdater').addEventListener('click', async () => {
    if (!startCoords || !lagerCoords || currentStops.length === 0) return;

    document.getElementById('btn-opdater').style.display = 'none';
    clearMarkers();
    setLoading('Opdaterer rute…');

    try {
        const ruteKoords = [startCoords, ...currentStops.map(s => s.coords), lagerCoords];
        const { distance, duration } = await tegneRute(ruteKoords);

        tilfoejMarkoer(startCoords, '▶', '<strong>Din startposition</strong>', '#34a853');
        currentStops.forEach((s, i) =>
            tilfoejMarkoer(s.coords, i + 1, `<strong>${i + 1}. ${s.navn}</strong><br>${s.adresse}`));
        tilfoejMarkoer(lagerCoords, '🏭', `<strong>Lager</strong><br>${warehouseAddress}`, '#ea4335');

        visStats(currentStops.length, distance, duration);
        renderStopListe(currentStops);
    } catch (err) {
        toast('Fejl ved ruteopdatering: ' + err.message, 'error');
    } finally {
        stopLoading();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    hentKonfig();
});