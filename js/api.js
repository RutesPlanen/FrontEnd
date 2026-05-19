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

document.addEventListener('DOMContentLoaded', initSidebar);
