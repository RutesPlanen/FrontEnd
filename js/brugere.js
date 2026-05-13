async function loadRestaurantDropdownBrugere() {
    const sel = document.getElementById('input-restaurant');
    try {
        const data = await apiFetch('/restaurants');
        sel.innerHTML = '<option value="">Ingen</option>' +
            data.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    } catch {}
}

function toggleRestaurantFelt() {
    const rolle = document.getElementById('input-role').value;
    document.getElementById('restaurant-felt').style.display = rolle === 'RESTAURANT' ? '' : 'none';
}

async function loadBrugere() {
    const tbody = document.getElementById('brugere-list');
    try {
        const data = await apiFetch('/users');
        tbody.innerHTML = data.length
            ? data.map(u => `<tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${roleBadge(u.role)}</td>
          <td>${u.restaurant?.name ?? '—'}</td>
          <td>${u.active === false
                ? '<span class="badge badge-pending">Deaktiveret</span>'
                : '<span class="badge badge-completed">Aktiv</span>'}</td>
          <td>
            <button class="btn-edit" onclick="startRedigering(${u.id})">Rediger</button>
            ${u.active !== false
                ? `<button class="btn-slet" onclick="deaktiverBruger(${u.id}, this)">Deaktiver</button>`
                : `<button class="btn-edit" onclick="aktiverBruger(${u.id}, this)">Aktiver</button>`}
          </td>
        </tr>`).join('')
            : `<tr><td colspan="6" class="empty">Ingen brugere endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Kunne ikke hente brugere</td></tr>`;
    }
}

let allebrugereCache = [];

async function startRedigering(id) {
    if (!allebrugereCache.length) {
        allebrugereCache = await apiFetch('/users');
    }
    const u = allebrugereCache.find(x => x.id === id);
    if (!u) return;
    document.getElementById('edit-id').value = id;
    document.getElementById('input-name').value = u.name;
    document.getElementById('input-email').value = u.email;
    document.getElementById('input-role').value = u.role;
    toggleRestaurantFelt();
    if (u.restaurant) {
        document.getElementById('input-restaurant').value = u.restaurant.id;
    }
    document.getElementById('form-title').textContent = 'Rediger bruger';
    document.getElementById('submit-btn').textContent = 'Gem';
    document.getElementById('cancel-btn').style.display = '';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function afbrydRedigering() {
    document.getElementById('edit-id').value = '';
    document.getElementById('form-bruger').reset();
    document.getElementById('form-title').textContent = 'Opret bruger';
    document.getElementById('submit-btn').textContent = 'Opret';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('restaurant-felt').style.display = 'none';
}

async function deaktiverBruger(id, btn) {
    if (!confirm('Deaktiver denne bruger?')) return;
    btn.disabled = true;
    try {
        await apiFetch('/users/' + id + '/deaktiver', { method: 'PATCH', body: JSON.stringify({}) });
        toast('Bruger deaktiveret');
        allebrugereCache = [];
        loadBrugere();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

async function aktiverBruger(id, btn) {
    btn.disabled = true;
    try {
        await apiFetch('/users/' + id, { method: 'PUT', body: JSON.stringify({ active: true }) });
        toast('Bruger aktiveret');
        allebrugereCache = [];
        loadBrugere();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

document.getElementById('form-bruger').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    const id = document.getElementById('edit-id').value;
    const fd = new FormData(e.target);
    const restaurantId = fd.get('restaurant_id');
    const body = {
        name: fd.get('name'),
        email: fd.get('email'),
        role: fd.get('role')
    };
    const pw = fd.get('password');
    if (pw) body.password = pw;
    if (restaurantId) body.restaurant = { id: Number(restaurantId) };

    try {
        if (id) {
            await apiFetch('/users/' + id, { method: 'PUT', body: JSON.stringify(body) });
            toast('Bruger opdateret');
        } else {
            await apiFetch('/users', { method: 'POST', body: JSON.stringify(body) });
            toast('Bruger oprettet');
        }
        afbrydRedigering();
        allebrugereCache = [];
        loadBrugere();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadRestaurantDropdownBrugere();
    loadBrugere();
});
