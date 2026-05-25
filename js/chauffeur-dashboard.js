async function loadPendingAnmodninger() {
    const tbody = document.getElementById('anmodninger-list');
    try {
        const [pending, planned] = await Promise.all([
            apiFetch('/pickup-requests?status=PENDING'),
            apiFetch('/pickup-requests?status=PLANNED')
        ]);
        const combined = [...pending, ...planned].sort((a, b) =>
            (a.date ?? '').localeCompare(b.date ?? ''));

        tbody.innerHTML = combined.length
            ? combined.map(r => `<tr>
          <td>${r.restaurant?.name ?? '—'}</td>
          <td>${r.restaurant?.address ?? '—'}</td>
          <td>${r.restaurant?.phone ?? '—'}</td>
          <td>${r.date ?? '—'}</td>
          <td>${r.pantAmount ?? '—'}</td>
          <td>${statusBadge(r.status)}</td>
          <td>
            <button class="btn-afhentet" onclick="markerAfhentet(${r.id}, this)">
              ✓ Afhentet
            </button>
          </td>
        </tr>`).join('')
            : `<tr><td colspan="7" class="empty">Ingen ventende afhentninger</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="7" class="empty">Kunne ikke hente anmodninger</td></tr>`;
    }
}

async function markerAfhentet(id, btn) {
    btn.disabled = true;
    try {
        await apiFetch('/pickup-requests/' + id + '/afhentet', { method: 'PATCH', body: JSON.stringify({}) });
        toast('Afhentning registreret');
        loadPendingAnmodninger();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', loadPendingAnmodninger);
