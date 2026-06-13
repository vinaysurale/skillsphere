/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Optimized Roblox Dashboard Module
   ═══════════════════════════════════════════════════════════════════ */

let performanceChart = null;
let categoryBreakdownChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;

    // Highlight active sidebar navigation
    setActiveSidebarNav();

    document.getElementById('dashWelcome').textContent =
        `Welcome back, ${user.name || 'there'}! Here's your skill overview.`;

    loadDashboard(user);
});

function setActiveSidebarNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-nav a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (path === href || (href !== '/' && path.startsWith(href))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function loadDashboard(user) {
    try {
        // Load portfolio data
        const portfolio = await apiFetch('/api/portfolio');

        // Update top stats
        animateNumber(document.getElementById('statPortfolioScore'), Math.round(portfolio.score || 0));
        animateNumber(document.getElementById('statTotalSkills'), portfolio.total_skills || 0);
        animateNumber(document.getElementById('statCategories'), portfolio.categories_covered || 0);

        // Bind Goal Completion
        if (user.career_goal) {
            try {
                const gap = await apiFetch('/api/gap-analysis/analyze-by-goal');
                animateNumber(document.getElementById('statGapCompletion'), Math.round(gap.completion || 0), 1000, '%');
            } catch {
                document.getElementById('statGapCompletion').textContent = '0%';
            }
        } else {
            document.getElementById('statGapCompletion').textContent = '—';
        }

        // Render Developer-Portal style Top Skills Grid
        renderRobloxSkillsGrid(portfolio.skills || []);

        // Render Bar Performance Chart
        renderPerformanceChart();

        // Render Category Breakdown Doughnut
        renderCategoryBreakdown(portfolio.skills || []);

    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// ─── Render Top Skills Grid (Roblox Game Card style) ──────────────────

function renderRobloxSkillsGrid(skills) {
    const container = document.getElementById('robloxSkillsGrid');
    if (!container) return;

    if (!skills || !skills.length) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: span 3; padding: 2rem 0;">
                <p style="font-size: 0.85rem; color: #9ca3af;">No skills in your portfolio yet.</p>
                <a href="/portfolio" class="btn btn-roblox-red btn-sm mt-1" style="text-decoration: none;">Add Skills</a>
            </div>
        `;
        return;
    }

    // Sort by demand score descending
    const sorted = [...skills].sort((a, b) =>
        (b.skill?.demand_score || 0) - (a.skill?.demand_score || 0)
    );

    // Take top 6
    const topSkills = sorted.slice(0, 6);
    const colorClasses = ['c-red', 'c-blue', 'c-green', 'c-gold', 'c-purple', 'c-orange'];

    container.innerHTML = topSkills.map((us, idx) => {
        const colorClass = colorClasses[idx % colorClasses.length];
        const name = us.skill?.name || 'Unknown';
        const rating = ((us.skill?.demand_score || 50) / 20 + 0.5).toFixed(1); // normalized out of 5
        const demandCount = Math.round((us.skill?.demand_score || 10) * 120); // mock active players
        const salary = us.skill?.salary_avg ? `$${Math.round(us.skill.salary_avg / 1000)}k` : 'N/A';
        const icon = us.skill?.icon || '💡';

        return `
            <div class="roblox-skill-card ${colorClass} glass-card animate-in">
                <div class="card-header">
                    <div class="skill-title" style="font-size: 0.85rem; font-weight: 900;">${name}</div>
                    <div class="skill-icon-bg">${icon}</div>
                </div>
                <div style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin: 0.25rem 0;">
                    ${us.proficiency?.toFixed(0)}% <span style="font-size: 0.7rem; color: #9ca3af; font-weight: 600;">Prof.</span>
                </div>
                <div class="skill-stats">
                    <div class="stat-badge" style="color: #ffcb00;">⭐ ${rating}</div>
                    <div class="stat-badge" style="color: #10b981;">${salary}</div>
                </div>
            </div>
        `;
    }).join('');

    // Re-bind tilt effect for the new dynamically loaded cards
    if (window.initializeTiltEffect) {
        window.initializeTiltEffect();
    }
}

// ─── Render Daily Performance Chart (Mockup Bar Chart style) ─────────

function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (performanceChart) performanceChart.destroy();

    // Data mapped directly to match the Developer Portal mockup: Thursday has a red peak
    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                data: [32, 45, 38, 85, 42, 50, 62],
                backgroundColor: [
                    '#515457', // Mon
                    '#515457', // Tue
                    '#515457', // Wed
                    '#ff4b57', // Thu (Roblox Red Peak)
                    '#515457', // Fri
                    '#515457', // Sat
                    '#515457'  // Sun
                ],
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 24
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10, weight: '700' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#6b7280',
                        font: { size: 9 },
                        callback: function(value) {
                            return value + 'k';
                        }
                    }
                }
            }
        }
    });
}

// ─── Render Domain Distribution Doughnut (Monetization style) ────────

function renderCategoryBreakdown(skills) {
    const ctx = document.getElementById('categoryBreakdownChart');
    if (!ctx) return;

    if (categoryBreakdownChart) categoryBreakdownChart.destroy();

    // Group skills by category segments
    let aiCount = 0;
    let cloudCount = 0;
    let systemsCount = 0;

    skills.forEach(us => {
        const cat = (us.skill?.category || '').toLowerCase();
        if (cat.includes('ai') || cat.includes('machine') || cat.includes('data')) {
            aiCount++;
        } else if (cat.includes('cloud') || cat.includes('devops') || cat.includes('docker') || cat.includes('kubernetes')) {
            cloudCount++;
        } else {
            systemsCount++;
        }
    });

    // Handle empty state defaults
    const total = aiCount + cloudCount + systemsCount;
    const aiPercent = total ? Math.round((aiCount / total) * 100) : 40;
    const cloudPercent = total ? Math.round((cloudCount / total) * 100) : 35;
    const systemsPercent = total ? Math.round((systemsCount / total) * 100) : 25;

    // Update legends text
    document.getElementById('legend-ai').textContent = `AI & Machine Learning (${aiPercent}%)`;
    document.getElementById('legend-cloud').textContent = `Cloud & DevOps (${cloudPercent}%)`;
    document.getElementById('legend-dev').textContent = `Systems & Web (${systemsPercent}%)`;

    categoryBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['AI & ML', 'Cloud & DevOps', 'Systems & Web'],
            datasets: [{
                data: [aiPercent, cloudPercent, systemsPercent],
                backgroundColor: ['#ff4b57', '#3b82f6', '#10b981'],
                hoverOffset: 4,
                borderWidth: 2,
                borderColor: '#161b2e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false }
            }
        }
    });
}
