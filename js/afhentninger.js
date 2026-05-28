async function loadChauffeurDropdown() {
    const sel = document.getElementById('chauffeur-select');
    try {
        const data = await apiFetch('/users');
        const chauffoerer = data.filter(u => u.role === 'CHAUFFEUR');
        sel.innerHTML = '<option value="">Vælg chauffør</option>' +
            chauffoerer.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    } catch {
        sel.innerHTML = '<option value="">Kunne ikke hente chauffører</option>';
    }
}

async function loadAnmodningDropdown() {
    const sel = document.getElementById('anmodning-select');
    try {
        const data = await apiFetch('/pickup-requests');
        sel.innerHTML = '<option value="">Vælg anmodning</option>' +
            data.map(r => `<option value="${r.id}">#${r.id} – ${r.restaurant?.name ?? '?'} (${r.date})</option>`).join('');
    } catch {
        sel.innerHTML = '<option value="">Kunne ikke hente anmodninger</option>';
    }
}

async function loadAfhentninger() {
    const tbody = document.getElementById('afhentninger-list');
    try {
        const data = await apiFetch('/pickups');
        tbody.innerHTML = data.length
            ? data.map(p => `<tr>
          <td>#${p.pickupRequest?.id ?? '—'}</td>
          <td>${p.chauffeur?.name ?? '—'}</td>
          <td>${p.cost != null ? p.cost + ' kr.' : '—'}</td>
          <td>${p.registeredAt ? p.registeredAt.substring(0, 16).replace('T', ' ') : '—'}</td>
          <td>${p.note ?? '—'}</td>
        </tr>`).join('')
            : `<tr><td colspan="5" class="empty">Ingen afhentninger endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="5" class="empty">Kunne ikke hente afhentninger</td></tr>`;
    }
}

async function registrerAfhentning() {
    const btn = document.getElementById('afh-submit');
    const anmodningId = document.getElementById('anmodning-select').value;
    const chauffoerId = document.getElementById('chauffeur-select').value;
    const cost = document.getElementById('afh-cost').value;
    const note = document.getElementById('afh-note').value;

    if (!anmodningId || !chauffoerId) {
        toast('Vælg både anmodning og chauffør', 'error');
        return;
    }

    btn.disabled = true;
    const body = {
        pickupRequest: { id: Number(anmodningId) },
        chauffeur: { id: Number(chauffoerId) }
    };
    if (cost !== '') body.cost = Number(cost);
    if (note !== '') body.note = note;

    try {
        await apiFetch('/pickups', { method: 'POST', body: JSON.stringify(body) });
        toast('Afhentning registreret');
        document.getElementById('anmodning-select').selectedIndex = 0;
        document.getElementById('chauffeur-select').selectedIndex = 0;
        document.getElementById('afh-cost').value = '';
        document.getElementById('afh-note').value = '';
        loadAfhentninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadChauffeurDropdown();
    loadAnmodningDropdown();
    loadAfhentninger();
});
