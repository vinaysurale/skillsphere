/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Simulator Module
   ═══════════════════════════════════════════════════════════════════ */

let futureSkillIds = [];
let availableSkills = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;
    loadSimulatorData();
});

async function loadSimulatorData() {
    try {
        const [skillsData, portfolio] = await Promise.all([
            apiFetch('/api/skills'),
            apiFetch('/api/portfolio').catch(() => ({ skills: [] })),
        ]);

        availableSkills = skillsData.skills || [];
        const userSkillIds = new Set((portfolio.skills || []).map(s => s.skill_id));

        // Render current skills
        const currentEl = document.getElementById('currentSkillsTags');
        const currentSkills = (portfolio.skills || []);
        if (currentSkills.length) {
            currentEl.innerHTML = currentSkills.map(us =>
                `<span class="skill-tag matched">${us.skill?.icon || '💡'} ${us.skill?.name || ''}</span>`
            ).join('');
        } else {
            currentEl.innerHTML = '<span class="text-secondary" style="font-size: 0.875rem;">No skills in portfolio yet. <a href="/portfolio">Add some first!</a></span>';
        }

        // Populate future skills dropdown (exclude user's current skills)
        const select = document.getElementById('futureSkillSelect');
        if (select) {
            // Group by category
            const grouped = {};
            availableSkills.forEach(s => {
                if (!userSkillIds.has(s.id)) {
                    if (!grouped[s.category]) grouped[s.category] = [];
                    grouped[s.category].push(s);
                }
            });

            let html = '<option value="">Select a skill to add...</option>';
            for (const [cat, skills] of Object.entries(grouped).sort()) {
                html += `<optgroup label="${cat}">`;
                skills.sort((a, b) => b.demand_score - a.demand_score).forEach(s => {
                    html += `<option value="${s.id}" data-name="${s.name}" data-icon="${s.icon}">${s.icon} ${s.name} (Demand: ${s.demand_score})</option>`;
                });
                html += '</optgroup>';
            }
            select.innerHTML = html;

            select.addEventListener('change', () => {
                const id = select.value;
                if (!id || futureSkillIds.includes(id)) return;

                const option = select.options[select.selectedIndex];
                futureSkillIds.push(id);
                renderFutureTags();
                select.value = '';
            });
        }
    } catch (err) {
        console.error('Simulator data error:', err);
    }
}

function renderFutureTags() {
    const container = document.getElementById('futureSkillsTags');
    container.innerHTML = futureSkillIds.map(id => {
        const skill = availableSkills.find(s => s.id === id);
        if (!skill) return '';
        return `
            <span class="skill-tag">
                ${skill.icon || '💡'} ${skill.name}
                <button class="remove-btn" onclick="removeFutureSkill('${id}')">×</button>
            </span>
        `;
    }).join('');
}

function removeFutureSkill(id) {
    futureSkillIds = futureSkillIds.filter(i => i !== id);
    renderFutureTags();
}

async function runSimulation() {
    if (!futureSkillIds.length) {
        showToast('Please select at least one future skill', 'warning');
        return;
    }

    const btn = document.getElementById('simulateBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;"></div> Simulating...';

    const container = document.getElementById('simulationResults');
    container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto;"></div><p class="mt-1 text-secondary">Running career simulation...</p></div>';

    try {
        const result = await apiFetch('/api/simulator/simulate', {
            method: 'POST',
            body: JSON.stringify({ future_skill_ids: futureSkillIds }),
        });

        renderSimulationResults(result);
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><p class="text-danger">${err.message}</p></div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Run Simulation';
    }
}

function renderSimulationResults(result) {
    const container = document.getElementById('simulationResults');

    container.innerHTML = `
        <div class="grid-2 mb-3" style="gap: 1rem;">
            <div class="result-stat" style="background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-md); padding: 1.5rem;">
                <div class="result-value positive" style="font-size: 2.5rem;">${result.job_opportunity_change || '+0%'}</div>
                <div class="result-label">Job Opportunities</div>
            </div>
            <div class="result-stat" style="background: rgba(79, 70, 229, 0.08); border-radius: var(--radius-md); padding: 1.5rem;">
                <div class="result-value positive" style="font-size: 2.5rem;">${result.salary_growth || '+0%'}</div>
                <div class="result-label">Salary Growth</div>
            </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 0.5rem;">Market Competitiveness</div>
            <div class="flex items-center gap-sm">
                <span class="badge ${result.market_competitiveness === 'very high' ? 'badge-success' :
                    result.market_competitiveness === 'high' ? 'badge-info' :
                    result.market_competitiveness === 'medium' ? 'badge-warning' : 'badge-danger'}">
                    ${(result.market_competitiveness || 'N/A').toUpperCase()}
                </span>
                <span class="text-secondary" style="font-size: 0.8125rem;">
                    Est. time: ${result.time_to_achieve || 'N/A'}
                </span>
            </div>
        </div>

        ${result.new_roles_unlocked?.length ? `
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 0.5rem;">New Roles Unlocked</div>
                <div class="flex flex-wrap gap-sm">
                    ${result.new_roles_unlocked.map(r => `<span class="skill-tag matched">🎯 ${r}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${result.analysis ? `
            <div style="padding-top: 1rem; border-top: 1px solid var(--border);">
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 0.5rem;">AI Analysis</div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7;">${result.analysis}</p>
            </div>
        ` : ''}

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.5rem;">SKILLS ADDED</div>
            <div class="flex flex-wrap gap-sm">
                ${(result.future_skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        </div>
    `;
}
