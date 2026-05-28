async function loadRestaurantDropdown() {
    const sel = document.getElementById('restaurant-select');
    try {
        const data = await apiFetch('/restaurants');
        sel.innerHTML = '<option value="">Vælg restaurant</option>' +
            data.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    } catch {
        sel.innerHTML = '<option value="">Kunne ikke hente restauranter</option>';
    }
}

async function loadAnmodninger() {
    const tbody = document.getElementById('anmodninger-list');
    try {
        const data = await apiFetch('/pickup-requests');
        tbody.innerHTML = data.length
            ? data.map(r => `<tr>
          <td>${r.restaurant?.name ?? '—'}</td>
          <td>${r.date ?? '—'}</td>
          <td>${r.pantAmount ?? '—'}</td>
          <td>${statusBadge(r.status)}</td>
          <td>${r.completedAt ? r.completedAt.substring(0, 16).replace('T', ' ') : '—'}</td>
          <td>
            ${r.status !== 'COMPLETED'
                ? `<button class="btn-edit" onclick="planlagAnmodning(${r.id}, this)">Planlæg</button>`
                : ''}
            <button class="btn-slet" onclick="sletAnmodning(${r.id}, this)">Slet</button>
          </td>
        </tr>`).join('')
            : `<tr><td colspan="6" class="empty">Ingen anmodninger endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Kunne ikke hente anmodninger</td></tr>`;
    }
}

async function planlagAnmodning(id, btn) {
    btn.disabled = true;
    try {
        await apiFetch('/pickup-requests/' + id, {
            method: 'PUT',
            body: JSON.stringify({ status: 'PLANNED' })
        });
        toast('Anmodning markeret som planlagt');
        loadAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

async function sletAnmodning(id, btn) {
    if (!confirm('Slet denne anmodning?')) return;
    btn.disabled = true;
    try {
        await apiFetch('/pickup-requests/' + id, { method: 'DELETE' });
        toast('Anmodning slettet');
        loadAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

async function opretAnmodning() {
    const btn = document.getElementById('anm-submit');
    btn.disabled = true;
    const restaurantId = document.getElementById('restaurant-select').value;
    const dato = document.getElementById('anm-dato').value;
    const poser = document.getElementById('anm-poser').value;
    const status = document.getElementById('anm-status').value;

    try {
        await apiFetch('/pickup-requests', {
            method: 'POST',
            body: JSON.stringify({
                restaurant: { id: Number(restaurantId) },
                date: dato,
                pantAmount: poser ? Number(poser) : null,
                status: status
            })
        });
        toast('Anmodning oprettet');
        document.getElementById('restaurant-select').value = '';
        document.getElementById('anm-dato').value = '';
        document.getElementById('anm-poser').value = '';
        document.getElementById('anm-status').value = 'PENDING';
        loadAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRestaurantDropdown();
    loadAnmodninger();
});