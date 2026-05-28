const bruger = JSON.parse(localStorage.getItem('user') || 'null');

function visRestaurantInfo() {
    const input = document.getElementById('restaurant-navn');
    if (bruger?.restaurant?.name) {
        input.value = bruger.restaurant.name;
    } else {
        input.value = '';
        document.getElementById('ingen-restaurant-advarsel').style.display = '';
        document.getElementById('submit-btn').disabled = true;
    }
}

async function loadMineAnmodninger() {
    const tbody = document.getElementById('anmodninger-list');
    try {
        const data = await apiFetch('/pickup-requests/mine');
        tbody.innerHTML = data.length
            ? data.map(r => `<tr>
          <td>${r.date ?? '—'}</td>
          <td>${r.pantAmount ?? '—'}</td>
          <td>${statusBadge(r.status)}</td>
          <td>${r.completedAt ? r.completedAt.substring(0, 16).replace('T', ' ') : '—'}</td>
          <td>
            ${r.status === 'PENDING'
                ? `<button class="btn-slet" onclick="sletAnmodning(${r.id}, this)">Slet</button>`
                : ''}
          </td>
        </tr>`).join('')
            : `<tr><td colspan="5" class="empty">Ingen anmodninger endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="5" class="empty">Kunne ikke hente anmodninger</td></tr>`;
    }
}

async function sletAnmodning(id, btn) {
    if (!confirm('Slet denne anmodning?')) return;
    btn.disabled = true;
    try {
        await apiFetch('/pickup-requests/' + id, { method: 'DELETE' });
        toast('Anmodning slettet');
        loadMineAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

document.getElementById('form-anmodning').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd = new FormData(e.target);
    const pantAmount = fd.get('pantAmount');
    try {
        await apiFetch('/pickup-requests', {
            method: 'POST',
            body: JSON.stringify({
                date: fd.get('date'),
                pantAmount: pantAmount ? Number(pantAmount) : null,
                status: 'PENDING'
            })
        });
        toast('Anmodning sendt!');
        e.target.reset();
        loadMineAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    visRestaurantInfo();
    loadMineAnmodninger();
});