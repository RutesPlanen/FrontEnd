const API_BASE = ['', '80', '8081'].includes(window.location.port)
    ? '/api'
    : 'http://localhost:8080/api';

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(API_BASE + path, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        ...options
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }

    if (!res.ok) throw new Error(await res.text());
    if (res.status === 204) return null;
    return res.json();
}

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.className = 'toast'), 3000);
}

function roleBadge(role) {
    const map    = { ADMIN: 'admin', RESTAURANT: 'restaurant', CHAUFFEUR: 'chauffeur' };
    const labels = { ADMIN: 'Admin', RESTAURANT: 'Restaurant', CHAUFFEUR: 'Chauffør' };
    return `<span class="badge badge-${map[role] ?? 'admin'}">${labels[role] ?? role}</span>`;
}

function statusBadge(status) {
    const map    = { PENDING: 'pending', PLANNED: 'planned', COMPLETED: 'completed' };
    const labels = { PENDING: 'Oprettet', PLANNED: 'Planlagt', COMPLETED: 'Afsluttet' };
    return `<span class="badge badge-${map[status] ?? 'pending'}">${labels[status] ?? status}</span>`;
}

function initSidebar() {
    document.querySelectorAll('.nav-item[data-page]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-page') === window.location.pathname);
    });

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            const initials = user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const el = document.getElementById('user-avatar');
            if (el) el.textContent = initials;
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = user.name;
            const roleMap = { ADMIN: 'Administrator', CHAUFFEUR: 'Chauffør', RESTAURANT: 'Restaurant' };
            const roleEl = document.getElementById('user-role');
            if (roleEl) roleEl.textContent = roleMap[user.role] || user.role || '';
        }
    } catch {}
}

async function visPantBobbel() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'ADMIN') return;
        const data = await apiFetch('/pickup-requests?status=PENDING');
        if (!data || data.length === 0) return;
        const poser = data.reduce((sum, r) => sum + (r.pantAmount || 0), 0);
        const tekst = poser > 0 ? `${poser} poser klar` : `${data.length} afhentninger klar`;
        const el = document.createElement('div');
        el.id = 'pant-bobbel';
        el.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/></svg> ${tekst}`;
        document.body.appendChild(el);
    } catch {}
}

document.addEventListener('DOMContentLoaded', initSidebar);
