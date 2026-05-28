async function loadRestauranter() {
    const tbody = document.getElementById('restauranter-list');
    try {
        const data = await apiFetch('/restaurants');
        tbody.innerHTML = data.length
            ? data.map(r => `<tr>
          <td>${r.name}</td>
          <td>${r.address ?? '—'}</td>
          <td>${r.phone ?? '—'}</td>
          <td>
            <button class="btn-edit"
              data-id="${r.id}"
              data-name="${escHtml(r.name)}"
              data-address="${escHtml(r.address ?? '')}"
              data-phone="${escHtml(r.phone ?? '')}"
            >Rediger</button>
            <button class="btn-slet" onclick="sletRestaurant(${r.id}, this)">Slet</button>
          </td>
        </tr>`).join('')
            : `<tr><td colspan="4" class="empty">Ingen restauranter endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="4" class="empty">Kunne ikke hente restauranter</td></tr>`;
    }
}

function startRedigering(id, name, address, phone) {
    document.getElementById('edit-id').value = id;
    document.getElementById('input-name').value = name;
    document.getElementById('input-address').value = address;
    document.getElementById('input-phone').value = phone;
    document.getElementById('form-title').textContent = 'Rediger restaurant';
    document.getElementById('submit-btn').textContent = 'Gem';
    document.getElementById('cancel-btn').style.display = '';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function afbrydRedigering() {
    document.getElementById('edit-id').value = '';
    document.getElementById('input-name').value = '';
    document.getElementById('input-address').value = '';
    document.getElementById('input-phone').value = '';
    document.getElementById('form-title').textContent = 'Opret restaurant';
    document.getElementById('submit-btn').textContent = 'Opret';
    document.getElementById('cancel-btn').style.display = 'none';
}

async function sletRestaurant(id, btn) {
    if (!confirm('Slet denne restaurant?')) return;
    btn.disabled = true;
    try {
        await apiFetch('/restaurants/' + id, { method: 'DELETE' });
        toast('Restaurant slettet');
        loadRestauranter();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

async function submitRestaurant() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    const id = document.getElementById('edit-id').value;
    const body = {
        name: document.getElementById('input-name').value,
        address: document.getElementById('input-address').value || null,
        phone: document.getElementById('input-phone').value || null
    };
    if (!body.name) { toast('Navn er påkrævet', 'error'); btn.disabled = false; return; }
    try {
        if (id) {
            await apiFetch('/restaurants/' + id, { method: 'PUT', body: JSON.stringify(body) });
            toast('Restaurant opdateret');
        } else {
            await apiFetch('/restaurants', { method: 'POST', body: JSON.stringify(body) });
            toast('Restaurant oprettet');
        }
        afbrydRedigering();
        loadRestauranter();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    loadRestauranter();
    document.getElementById('restauranter-list').addEventListener('click', e => {
        const btn = e.target.closest('.btn-edit');
        if (!btn) return;
        startRedigering(btn.dataset.id, btn.dataset.name, btn.dataset.address, btn.dataset.phone);
    });
});