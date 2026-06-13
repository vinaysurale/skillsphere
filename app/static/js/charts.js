/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Charts Module (Market Index Page)
   ═══════════════════════════════════════════════════════════════════ */

let trendChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadMarketData();
});

async function loadMarketData() {
    try {
        const [indexes, heatmap, emerging] = await Promise.all([
            apiFetch('/api/market/indexes'),
            apiFetch('/api/market/heatmap'),
            apiFetch('/api/market/emerging'),
        ]);

        renderIndexes(indexes.indexes || []);
        renderHeatmap(heatmap.heatmap || []);
        renderEmergingBubbles(emerging.emerging_skills || []);

        // Populate category dropdown
        const select = document.getElementById('trendCategory');
        if (select && indexes.indexes) {
            indexes.indexes.forEach(idx => {
                const opt = document.createElement('option');
                opt.value = idx.category;
                opt.textContent = idx.name;
                select.appendChild(opt);
            });

            // Load first category trend
            if (indexes.indexes.length) {
                select.value = indexes.indexes[0].category;
                loadTrend();
            }
        }
    } catch (err) {
        console.error('Market data error:', err);
    }
}

function renderIndexes(indexes) {
    const container = document.getElementById('marketIndexes');
    if (!container) return;

    container.innerHTML = indexes.map(idx => `
        <div class="index-card animate-in" onclick="selectIndex('${idx.category}')">
            <div class="index-name">${idx.name}</div>
            <div class="index-value">${idx.value.toFixed(0)}</div>
            <div class="index-change ${idx.direction}">
                ${idx.direction === 'up' ? '▲' : '▼'} ${Math.abs(idx.change).toFixed(2)}
                <span style="margin-left: 0.25rem;">(${idx.change_pct > 0 ? '+' : ''}${idx.change_pct.toFixed(2)}%)</span>
            </div>
            <div style="font-size: 0.6875rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                ${idx.skill_count} skills • Avg demand: ${idx.avg_demand}
            </div>
        </div>
    `).join('');
}

function selectIndex(category) {
    const select = document.getElementById('trendCategory');
    if (select) {
        select.value = category;
        loadTrend();
    }
}

async function loadTrend() {
    const category = document.getElementById('trendCategory')?.value;
    if (!category) return;

    try {
        const data = await apiFetch(`/api/market/trends/${encodeURIComponent(category)}?days=30`);
        renderTrendChart(data);
    } catch (err) {
        console.error('Trend error:', err);
    }
}

function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (trendChart) trendChart.destroy();

    const labels = (data.data || []).map(d => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const values = (data.data || []).map(d => d.value);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: data.category || 'Index',
                data: values,
                borderColor: '#4F46E5',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#4F46E5',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#6B7280', font: { size: 10 }, maxTicksLimit: 8 },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#6B7280', font: { size: 10 } },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1F2937',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: '#F9FAFB',
                    bodyColor: '#9CA3AF',
                    cornerRadius: 8,
                    padding: 12,
                },
            },
        },
    });
}

function renderHeatmap(heatmap) {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    const maxDemand = Math.max(...heatmap.map(h => h.avg_demand), 1);

    container.innerHTML = heatmap.map(h => {
        const intensity = h.avg_demand / maxDemand;
        const hue = 250 - (intensity * 120); // Purple to cyan
        const bg = `hsla(${hue}, 70%, 50%, ${0.1 + intensity * 0.25})`;
        const border = `hsla(${hue}, 70%, 50%, ${0.2 + intensity * 0.3})`;

        return `
            <div style="background: ${bg}; border: 1px solid ${border}; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;">
                <div>
                    <div style="font-weight: 600; font-size: 0.875rem;">${h.category}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${h.skill_count} skills</div>
                </div>
                <div style="display: flex; gap: 1.5rem; text-align: center;">
                    <div>
                        <div style="font-weight: 700; font-size: 0.9375rem; color: var(--text-accent);">${h.avg_demand}</div>
                        <div style="font-size: 0.625rem; color: var(--text-tertiary); text-transform: uppercase;">Demand</div>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.9375rem; color: var(--success);">${h.avg_growth}</div>
                        <div style="font-size: 0.625rem; color: var(--text-tertiary); text-transform: uppercase;">Growth</div>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.9375rem;">$${(h.avg_salary / 1000).toFixed(0)}k</div>
                        <div style="font-size: 0.625rem; color: var(--text-tertiary); text-transform: uppercase;">Salary</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderEmergingBubbles(skills) {
    const container = document.getElementById('emergingBubbles');
    if (!container) return;

    const colors = [
        'rgba(79, 70, 229, 0.7)',
        'rgba(124, 58, 237, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(6, 182, 212, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(244, 63, 94, 0.7)',
    ];

    container.innerHTML = skills.map((s, i) => {
        const size = Math.max(50, s.size * 2);
        const left = Math.min(85, Math.max(5, s.x)) ;
        const top = Math.min(85, Math.max(5, 100 - s.y));

        return `
            <div class="bubble" style="
                width: ${size}px;
                height: ${size}px;
                left: ${left}%;
                top: ${top}%;
                background: ${colors[i % colors.length]};
                transform: translate(-50%, -50%);
            " title="${s.name}: Growth +${s.growth_rate}% • ${s.maturity}">
                ${s.name}
            </div>
        `;
    }).join('');

    // Add axis labels
    container.innerHTML += `
        <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 0.6875rem; color: var(--text-tertiary);">Novelty →</div>
        <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: 0.6875rem; color: var(--text-tertiary);">Growth Rate →</div>
    `;
}
