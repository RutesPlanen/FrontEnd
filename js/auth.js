const ROLE_ACCESS = {
    ADMIN:      ['/statistik.html', '/anmodninger.html', '/afhentninger.html', '/udgifter.html', '/restauranter.html', '/brugere.html'],
    RESTAURANT: ['/restaurant-dashboard.html'],
    CHAUFFEUR:  ['/chauffeur-dashboard.html', '/map.html', '/kosten.html']
};

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        localStorage.clear();
        return null;
    }
}

async function requireLogin() {
    document.body.style.visibility = 'hidden';

    const token = localStorage.getItem('token');
    const user = getUser();

    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }

    let res;
    try {
        res = await fetch(API_BASE + '/auth/validate', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }

    if (!res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }

    const allowed = ROLE_ACCESS[user.role] || [];
    if (!allowed.includes(window.location.pathname)) {
        window.location.href = allowed[0];
        return;
    }

    document.body.style.visibility = 'visible';
    if (typeof visPantBobbel === 'function') visPantBobbel();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    await requireLogin();
});
