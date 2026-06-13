/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Portfolio Module
   ═══════════════════════════════════════════════════════════════════ */

let allSkills = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;

    await loadAllSkills();
    await loadPortfolio();
});

async function loadAllSkills() {
    try {
        const data = await apiFetch('/api/skills');
        allSkills = data.skills || [];
        populateSkillSelect();
    } catch (err) {
        console.error('Failed to load skills:', err);
    }
}

function populateSkillSelect() {
    const select = document.getElementById('skillSelect');
    if (!select) return;

    // Group by category
    const grouped = {};
    allSkills.forEach(s => {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
    });

    let html = '<option value="">Select a skill...</option>';
    for (const [cat, skills] of Object.entries(grouped).sort()) {
        html += `<optgroup label="${cat}">`;
        skills.sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
            html += `<option value="${s.id}">${s.icon} ${s.name} (Demand: ${s.demand_score})</option>`;
        });
        html += '</optgroup>';
    }
    select.innerHTML = html;
}

async function loadPortfolio() {
    try {
        const portfolio = await apiFetch('/api/portfolio');
        updateGauge(portfolio.score || 0);
        updateGrade(portfolio.grade || 'F');
        updateMeta(portfolio);
        renderUserSkills(portfolio.skills || []);
        renderAnalysis(portfolio);
    } catch (err) {
        console.error('Portfolio load error:', err);
    }
}

function updateGauge(score) {
    const circle = document.getElementById('gaugeCircle');
    const circumference = 2 * Math.PI * 85; // ~534
    const offset = circumference - (score / 100) * circumference;

    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 100);

    animateNumber(document.getElementById('portfolioScoreValue'), Math.round(score));
}

function updateGrade(grade) {
    const el = document.getElementById('portfolioGrade');
    const colors = {
        'A+': 'var(--success)', 'A': 'var(--success)',
        'B+': '#3B82F6', 'B': '#3B82F6',
        'C': 'var(--warning)', 'D': '#F97316', 'F': 'var(--danger)',
    };
    el.innerHTML = `Grade: <span style="color: ${colors[grade] || 'var(--text-secondary)'};">${grade}</span>`;
}

function updateMeta(portfolio) {
    const el = document.getElementById('portfolioMeta');
    el.textContent = `${portfolio.total_skills || 0} skills • ${portfolio.categories_covered || 0}/${portfolio.total_categories || 0} categories`;
}

function renderUserSkills(skills) {
    const container = document.getElementById('userSkillsList');
    if (!skills.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💼</div>
                <h3>No skills in portfolio</h3>
                <p>Select skills above to build your portfolio</p>
            </div>
        `;
        return;
    }

    container.innerHTML = skills.map(us => `
        <div class="skill-item" id="skill-${us.skill_id}">
            <div class="skill-icon">${us.skill?.icon || '💡'}</div>
            <div class="skill-info">
                <div class="skill-name">
                    ${us.skill?.name || 'Unknown'}
                    ${us.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
                </div>
                <div class="skill-category">${us.skill?.category || ''}</div>
            </div>
            <div style="flex: 1; max-width: 180px;">
                <div class="flex items-center justify-between" style="font-size: 0.75rem; margin-bottom: 0.25rem;">
                    <span class="text-secondary">Proficiency</span>
                    <span style="font-weight: 700;" id="profLabel-${us.skill_id}">${us.proficiency?.toFixed(0)}%</span>
                </div>
                <input type="range" class="proficiency-slider" min="10" max="100" value="${us.proficiency || 50}"
                       onchange="updateProficiency('${us.skill_id}', this.value)"
                       oninput="document.getElementById('profLabel-${us.skill_id}').textContent = this.value + '%'">
            </div>
            <button class="btn btn-ghost btn-icon" onclick="removeSkill('${us.skill_id}')" title="Remove">✕</button>
        </div>
    `).join('');
}

function renderAnalysis(portfolio) {
    // Strengths
    const strengthsEl = document.getElementById('strengthsList');
    if (portfolio.strengths?.length) {
        strengthsEl.innerHTML = portfolio.strengths.map(s => `
            <div class="skill-item" style="padding: 0.5rem;">
                <span style="font-size: 1.25rem;">${s.icon || '💪'}</span>
                <div>
                    <div style="font-weight: 600; font-size: 0.875rem;">${s.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${s.reason}</div>
                </div>
            </div>
        `).join('');
    }

    // Weaknesses
    const weakEl = document.getElementById('weaknessesList');
    if (portfolio.weaknesses?.length) {
        weakEl.innerHTML = portfolio.weaknesses.map(s => `
            <div class="skill-item" style="padding: 0.5rem; cursor: pointer;" onclick="openStudyQuest('${s.skill_id}')" title="Click to resolve weakness">
                <span style="font-size: 1.25rem;">${s.icon || '⚠️'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem;">${s.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${s.reason}</div>
                </div>
                <span class="badge badge-warning" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;">Resolve ➜</span>
            </div>
        `).join('');
    }

    // Missing Critical
    const missingEl = document.getElementById('missingList');
    if (portfolio.missing_critical?.length) {
        missingEl.innerHTML = portfolio.missing_critical.map(s => `
            <div class="skill-item" style="padding: 0.5rem; cursor: pointer;" onclick="openStudyQuest('${s.skill_id}')" title="Click to learn skill">
                <span style="font-size: 1.25rem;">${s.icon || '🔴'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.875rem;">${s.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">${s.category} • Demand: ${s.demand_score}</div>
                </div>
                <span class="badge badge-danger" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;">Learn ➜</span>
            </div>
        `).join('');
    }
}

async function addSkillToPortfolio() {
    const select = document.getElementById('skillSelect');
    const proficiency = document.getElementById('proficiencyRange').value;
    const skillId = select.value;

    if (!skillId) {
        showToast('Please select a skill', 'warning');
        return;
    }

    try {
        await apiFetch('/api/portfolio/skills', {
            method: 'POST',
            body: JSON.stringify({ skill_id: skillId, proficiency: parseFloat(proficiency) }),
        });
        showToast('Skill added to portfolio!', 'success');
        await loadPortfolio();
        select.value = '';
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function updateProficiency(skillId, value) {
    try {
        await apiFetch(`/api/portfolio/skills/${skillId}`, {
            method: 'PUT',
            body: JSON.stringify({ proficiency: parseFloat(value) }),
        });
        await loadPortfolio();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function removeSkill(skillId) {
    try {
        await apiFetch(`/api/portfolio/skills/${skillId}`, { method: 'DELETE' });
        showToast('Skill removed', 'info');
        await loadPortfolio();
        if (document.getElementById('graphViewTab').classList.contains('active')) {
            drawSkillGraph();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/* ─── GitHub Verification ─────────────────────────────────────────── */
async function verifyGitHubSkills() {
    const input = document.getElementById('githubUsernameInput');
    const btn = document.getElementById('githubVerifyBtn');
    const username = input.value.trim();
    
    if (!username) {
        showToast('Please enter a GitHub username', 'warning');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Scanning...';
    
    try {
        const response = await apiFetch('/api/portfolio/verify-github', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        
        showToast(response.message, 'success');
        await loadPortfolio();
        input.value = '';
        if (document.getElementById('graphViewTab').classList.contains('active')) {
            drawSkillGraph();
        }
    } catch (err) {
        showToast(err.message || 'Verification failed', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Verify';
    }
}

/* ─── Tabs & Graph Switching ───────────────────────────────────────── */
function switchPortfolioView(view) {
    const listTab = document.getElementById('listViewTab');
    const graphTab = document.getElementById('graphViewTab');
    const listView = document.getElementById('portfolioListView');
    const graphView = document.getElementById('portfolioGraphView');
    
    if (view === 'list') {
        listTab.classList.add('active');
        graphTab.classList.remove('active');
        listView.classList.add('active');
        graphView.classList.remove('active');
    } else {
        listTab.classList.remove('active');
        graphTab.classList.add('active');
        listView.classList.remove('active');
        graphView.classList.add('active');
        drawSkillGraph();
    }
}

let activeNetwork = null;

async function drawSkillGraph() {
    const container = document.getElementById('skillGraphContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);">Building graph network...</div>';
    
    try {
        const portfolio = await apiFetch('/api/portfolio');
        const userSkillsMap = {};
        if (portfolio.skills) {
            portfolio.skills.forEach(us => {
                userSkillsMap[us.skill_id] = us;
            });
        }
        
        const skillsData = await apiFetch('/api/skills');
        const dbSkills = skillsData.skills || [];
        
        // Build unique categories
        const categories = [...new Set(dbSkills.map(s => s.category))];
        
        const nodes = [];
        const edges = [];
        
        // 1. Add Category Center Nodes
        categories.forEach((cat, index) => {
            nodes.push({
                id: `cat-${cat}`,
                label: cat,
                color: {
                    background: '#7C3AED',
                    border: '#A855F7',
                    highlight: { background: '#A855F7', border: '#C084FC' }
                },
                shape: 'dot',
                size: 25,
                font: { color: '#ffffff', size: 14, face: 'Inter' }
            });
        });
        
        // 2. Add Skill Nodes & Connect to Categories
        dbSkills.forEach(s => {
            const hasSkill = userSkillsMap[s.id];
            let bgColor = '#1E293B';
            let borderColor = '#475569';
            let fontColor = '#9CA3AF';
            let label = s.name;
            let size = 14;
            
            if (hasSkill) {
                if (hasSkill.verified) {
                    bgColor = '#065F46';
                    borderColor = '#10B981';
                    fontColor = '#34D399';
                    label = `${s.icon} ${s.name} (✓)`;
                    size = 20;
                } else {
                    bgColor = '#1E3A8A';
                    borderColor = '#3B82F6';
                    fontColor = '#93C5FD';
                    label = `${s.icon} ${s.name}`;
                    size = 18;
                }
            } else {
                label = `${s.icon} ${s.name}`;
            }
            
            nodes.push({
                id: s.id,
                label: label,
                color: {
                    background: bgColor,
                    border: borderColor,
                    highlight: { background: '#312E81', border: '#4F46E5' }
                },
                shape: 'dot',
                size: size,
                font: { color: fontColor, size: 12, face: 'Inter' }
            });
            
            // Edge from Skill to Category
            edges.push({
                from: `cat-${s.category}`,
                to: s.id,
                color: { color: 'rgba(255,255,255,0.06)', highlight: '#4F46E5' },
                width: 1
            });
        });
        
        // Initialize vis network
        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
        
        const options = {
            physics: {
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0.1
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                hideEdgesOnDrag: true
            }
        };
        
        container.innerHTML = '';
        activeNetwork = new vis.Network(container, data, options);
        
    } catch (err) {
        console.error('Failed to draw skill network graph:', err);
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--danger);">Failed to load Network Graph.</div>';
    }
}

/* ─── Study Quest Interactive Methods ─────────────────────────────── */
let currentFlashcards = [];
let activeFlashcardIdx = 0;

async function openStudyQuest(skillId) {
    try {
        const data = await apiFetch(`/api/gap-analysis/study-materials/${skillId}`);
        
        document.getElementById('studySkillIcon').textContent = data.skill.icon || '📘';
        document.getElementById('studySkillName').textContent = data.skill.name;
        document.getElementById('studySkillCategory').textContent = data.skill.category;
        document.getElementById('studySkillDesc').textContent = data.skill.description || 'Learn foundational elements of this skill to fill your gap.';
        
        // Render materials
        const materialsList = document.getElementById('studyMaterialsList');
        materialsList.innerHTML = data.materials.map(m => `
            <div class="study-resource-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.9375rem;">${m.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                        ${m.type} • ${m.duration} • Difficulty: <span style="font-weight:600;color:var(--text-accent);">${m.difficulty}</span>
                    </div>
                </div>
                <a href="${m.url}" target="_blank" class="btn btn-secondary btn-sm">Start Learning ➜</a>
            </div>
        `).join('');
        
        // Setup flashcards
        currentFlashcards = data.flashcards || [];
        activeFlashcardIdx = 0;
        showFlashcard();
        
        // Show modal
        const modal = document.getElementById('studyModal');
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        
        switchStudyTab('study');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function closeStudyModal() {
    const modal = document.getElementById('studyModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
}

function switchStudyTab(tab) {
    const tabStudy = document.getElementById('tabStudy');
    const tabQuest = document.getElementById('tabQuest');
    const contentStudy = document.getElementById('studyTabContent');
    const contentQuest = document.getElementById('questTabContent');
    
    if (tab === 'study') {
        tabStudy.classList.add('active');
        tabQuest.classList.remove('active');
        contentStudy.classList.add('active');
        contentQuest.classList.remove('active');
    } else {
        tabQuest.classList.add('active');
        tabStudy.classList.remove('active');
        contentQuest.classList.add('active');
        contentStudy.classList.remove('active');
    }
}

function showFlashcard() {
    if (!currentFlashcards.length) return;
    
    const card = currentFlashcards[activeFlashcardIdx];
    document.getElementById('cardQuestion').textContent = card.question;
    document.getElementById('cardAnswer').textContent = card.answer;
    document.getElementById('flashcardProgress').textContent = `Card ${activeFlashcardIdx + 1} of ${currentFlashcards.length}`;
    
    // Reset flip
    document.getElementById('flashcardDeck').classList.remove('flipped');
}

function flipFlashcard() {
    document.getElementById('flashcardDeck').classList.toggle('flipped');
}

function nextFlashcard() {
    if (activeFlashcardIdx < currentFlashcards.length - 1) {
        activeFlashcardIdx++;
        showFlashcard();
    } else {
        showToast("You've completed this Flashcard Quest! 🎉", "success");
    }
}

function prevFlashcard() {
    if (activeFlashcardIdx > 0) {
        activeFlashcardIdx--;
        showFlashcard();
    }
}


