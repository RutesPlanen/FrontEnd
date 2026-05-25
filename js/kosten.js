// Forhåndsvisning af valgt billede
document.getElementById('image-input').addEventListener('change', function () {
    const preview = document.getElementById('image-preview');
    const file = this.files[0];
    if (!file) { preview.style.display = 'none'; return; }
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

async function loadExpenses() {
    const tbody = document.getElementById('expense-list');
    try {
        const data = await apiFetch('/expenses/mine');
        tbody.innerHTML = data.length
            ? data.map(e => `<tr>
          <td>${e.createdAt ? e.createdAt.substring(0, 10) : '—'}</td>
          <td>${e.category ?? '—'}</td>
          <td>${e.amount != null ? e.amount.toFixed(2) + ' kr.' : '—'}</td>
          <td>${e.description ?? '—'}</td>
          <td>${e.imageData
                ? `<img src="${e.imageData}" class="expense-img" onclick="visStorBillede(${e.id})" data-id="${e.id}" data-src="${e.imageData}" />`
                : '—'}</td>
          <td><button class="btn-slet" onclick="sletUdgift(${e.id}, this)">Slet</button></td>
        </tr>`).join('')
            : `<tr><td colspan="6" class="empty">Ingen udgifter endnu</td></tr>`;
    } catch {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Kunne ikke hente udgifter</td></tr>`;
    }
}

function visStorBillede(id) {
    const img = document.querySelector(`[data-id="${id}"]`);
    if (!img) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
    const bigImg = document.createElement('img');
    bigImg.src = img.dataset.src;
    bigImg.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;';
    overlay.appendChild(bigImg);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

async function sletUdgift(id, btn) {
    if (!confirm('Slet denne udgift?')) return;
    btn.disabled = true;
    try {
        await apiFetch('/expenses/' + id, { method: 'DELETE' });
        toast('Udgift slettet');
        loadExpenses();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
        btn.disabled = false;
    }
}

document.getElementById('form-expense').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd = new FormData(e.target);
    const imageInput = document.getElementById('image-input');
    const file = imageInput.files[0];

    try {
        let imageData = null;
        if (file) {
            imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = ev => resolve(ev.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        const body = {
            category: fd.get('category'),
            amount: Number(fd.get('amount')),
            description: fd.get('description') || null,
            imageData: imageData
        };

        await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(body) });
        toast('Udgift gemt');
        e.target.reset();
        document.getElementById('image-preview').style.display = 'none';
        loadExpenses();
    } catch (err) {
        toast('Fejl: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', loadExpenses);
