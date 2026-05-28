async function loadUdgifter() {
  const tbody = document.getElementById('expense-list');
  try {
    const data = await apiFetch('/expenses');
    tbody.innerHTML = data.length
      ? data.map(e => `<tr>
          <td>${e.createdAt ? e.createdAt.substring(0, 10) : '—'}</td>
          <td>${e.chauffeur?.name ?? '—'}</td>
          <td>${e.category ?? '—'}</td>
          <td>${e.amount != null ? e.amount.toFixed(2) + ' kr.' : '—'}</td>
          <td>${e.description ?? '—'}</td>
          <td>${e.imageData
            ? `<img src="${e.imageData}" class="expense-img"
                onclick="this.style.maxWidth='none';this.style.maxHeight='none'"
                title="Klik for at forstørre" />`
            : '—'}</td>
          <td><button class="btn-slet" onclick="sletUdgift(${e.id}, this)">Slet</button></td>
        </tr>`).join('')
      : `<tr><td colspan="7" class="empty">Ingen udgifter endnu</td></tr>`;
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Kunne ikke hente udgifter</td></tr>`;
  }
}

async function sletUdgift(id, btn) {
  if (!confirm('Slet denne udgift?')) return;
  btn.disabled = true;
  try {
    await apiFetch('/expenses/' + id, { method: 'DELETE' });
    toast('Udgift slettet');
    loadUdgifter();
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', loadUdgifter);