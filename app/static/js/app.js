/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Core App Module
   Handles auth state, API calls, navigation, and global utilities
   ═══════════════════════════════════════════════════════════════════ */

// ─── API Helper ──────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || 'Something went wrong');
    }

    return res.json();
}

// ─── Auth State ──────────────────────────────────────────────────────

async function getUser() {
    try {
        const data = await apiFetch('/api/auth/me');
        return data.user;
    } catch {
        return null;
    }
}

async function requireAuth() {
    const user = await getUser();
    if (!user) {
        window.location.href = '/login';
        return null;
    }
    return user;
}

// ─── Toast Notifications ─────────────────────────────────────────────

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icons[type] || icons.info}</span>
        <span style="flex: 1; font-size: 0.875rem;">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ─── Navigation Highlight ────────────────────────────────────────────

function setActiveNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.navbar-nav a, .sidebar-nav a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (path === href || (href !== '/' && path.startsWith(href))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ─── Update Nav User Button ──────────────────────────────────────────

async function updateNavUser() {
    const navUser = document.getElementById('navUser');
    if (!navUser) return;

    const user = await getUser();
    if (user) {
        const initial = (user.name || user.email || '?')[0].toUpperCase();
        navUser.innerHTML = `
            <a href="/profile" class="navbar-user" style="color: var(--text-primary); gap: 0.5rem;">
                <div class="avatar">${initial}</div>
                <span style="font-size: 0.875rem; font-weight: 500;">${user.name || 'User'}</span>
            </a>
        `;
    }
}

// ─── Number Animation ────────────────────────────────────────────────

function animateNumber(element, target, duration = 1000, suffix = '') {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ─── Init ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    updateNavUser();
});
