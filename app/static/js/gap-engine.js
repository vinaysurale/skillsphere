/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Gap Engine Module
   ═══════════════════════════════════════════════════════════════════ */

let selectedCareerPathId = null;
let currentFlashcards = [];
let activeFlashcardIdx = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    if (!user) return;
    loadCareerPaths();
    initResumeUpload();
});

async function loadCareerPaths() {
    try {
        const data = await apiFetch('/api/gap-analysis/career-paths');
        renderCareerPaths(data.career_paths || []);
    } catch (err) {
        console.error('Failed to load career paths:', err);
    }
}

function renderCareerPaths(paths) {
    const grid = document.getElementById('careerPathGrid');
    grid.innerHTML = paths.map(p => `
        <div class="index-card" onclick="selectCareerPath('${p.id}', this)" id="cp-${p.id}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${p.icon || '🎯'}</div>
            <div class="index-name">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                ${p.required_skills_count} skills • ${p.demand_level}
            </div>
            <div style="font-size: 0.75rem; color: var(--success); margin-top: 0.25rem; font-weight: 600;">
                $${(p.avg_salary / 1000).toFixed(0)}k avg
            </div>
        </div>
    `).join('');
}

async function selectCareerPath(id, el) {
    // Highlight selected
    document.querySelectorAll('.index-card').forEach(c => {
        c.style.borderColor = '';
        c.style.boxShadow = '';
    });
    el.style.borderColor = '#4F46E5';
    el.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.3)';

    selectedCareerPathId = id;

    // Show resume matcher card
    const resumeCard = document.getElementById('resumeCard');
    if (resumeCard) {
        resumeCard.classList.remove('hidden');
        // Reset parser output
        document.getElementById('resumeAnalysisOutput').style.display = 'none';
        document.getElementById('resumePlaceholderOutput').style.display = 'flex';
        document.getElementById('uploadStatus').textContent = '';
        document.getElementById('resumeFileInput').value = '';
    }

    try {
        const gap = await apiFetch(`/api/gap-analysis/analyze/${id}`);
        renderGapResults(gap);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderGapResults(gap) {
    const container = document.getElementById('gapResults');
    container.classList.remove('hidden');

    // Career info
    document.getElementById('gapCareerName').textContent =
        `${gap.career_path?.icon || ''} ${gap.career_path?.name || ''}`;
    document.getElementById('gapCareerDesc').textContent = gap.career_path?.description || '';

    // Completion
    animateNumber(document.getElementById('gapCompletion'), Math.round(gap.completion), 1000, '%');
    setTimeout(() => {
        document.getElementById('gapProgressFill').style.width = `${gap.completion}%`;
    }, 100);

    document.getElementById('gapMatchedCount').textContent = `${gap.matched_count} matched`;
    document.getElementById('gapMissingCount').textContent = `${gap.missing_count} missing`;

    // Matched skills
    const matchedEl = document.getElementById('matchedSkills');
    if (gap.matched?.length) {
        matchedEl.innerHTML = gap.matched.map(s => `
            <div class="skill-item" style="padding: 0.5rem; cursor: pointer;" onclick="openStudyQuest('${s.skill_id}')">
                <div class="skill-icon" style="background: rgba(16, 185, 129, 0.1);">${s.icon || '✅'}</div>
                <div class="skill-info">
                    <div class="skill-name">${s.name}</div>
                    <div class="skill-category">${s.importance} • ${s.proficiency?.toFixed(0)}% proficiency</div>
                </div>
                <span class="badge badge-success">${s.importance}</span>
            </div>
        `).join('');
    } else {
        matchedEl.innerHTML = '<p class="text-secondary" style="padding: 1rem; font-size: 0.875rem;">No matching skills yet. Start adding skills to your portfolio!</p>';
    }

    // Missing skills
    const missingEl = document.getElementById('missingSkills');
    if (gap.missing?.length) {
        missingEl.innerHTML = gap.missing.map(s => {
            const badgeClass = s.severity === 'critical' ? 'badge-danger' :
                               s.severity === 'moderate' ? 'badge-warning' : 'badge-info';
            return `
                <div class="skill-item" style="padding: 0.5rem; cursor: pointer;" onclick="openStudyQuest('${s.skill_id}')">
                    <div class="skill-icon" style="background: rgba(244, 63, 94, 0.1);">${s.icon || '❌'}</div>
                    <div class="skill-info">
                        <div class="skill-name">${s.name}</div>
                        <div class="skill-category">${s.category} • Demand: ${s.demand_score?.toFixed(0)}</div>
                    </div>
                    <span class="badge ${badgeClass}">${s.severity}</span>
                </div>
            `;
        }).join('');
    } else {
        missingEl.innerHTML = '<p style="padding: 1rem; color: var(--success); font-weight: 600;">🎉 You have all required skills!</p>';
    }

    // Learning priority
    const priorityEl = document.getElementById('learningPriority');
    if (gap.learning_priority?.length) {
        priorityEl.innerHTML = gap.learning_priority.map(lp => {
            const cls = lp.priority.includes('Critical') ? 'critical' :
                       lp.priority.includes('Recommended') ? 'recommended' : 'optional';
            return `
                <div class="priority-item ${cls}">
                    <div class="rank">${lp.rank}</div>
                    <span style="font-size: 1.25rem;">${lp.icon || '📘'}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${lp.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${lp.impact}</div>
                    </div>
                    <span class="badge ${cls === 'critical' ? 'badge-danger' : cls === 'recommended' ? 'badge-warning' : 'badge-info'}">${lp.priority}</span>
                </div>
            `;
        }).join('');
    }

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadRoadmap() {
    const container = document.getElementById('roadmapContent');
    container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto;"></div><p class="mt-1 text-secondary">Generating your personalized roadmap...</p></div>';

    try {
        const roadmap = await apiFetch('/api/recommendations/roadmap');
        renderRoadmap(roadmap);
    } catch (err) {
        container.innerHTML = `<p class="text-secondary">${err.message}</p>`;
    }
}

function renderRoadmap(roadmap) {
    const container = document.getElementById('roadmapContent');

    let html = `
        <div style="margin-bottom: 1rem;">
            <h4 style="font-size: 1.125rem; font-weight: 700;">${roadmap.roadmap_title || 'Learning Roadmap'}</h4>
            <p class="text-secondary" style="font-size: 0.875rem;">Estimated: ${roadmap.estimated_duration || 'N/A'}</p>
        </div>
    `;

    if (roadmap.phases?.length) {
        html += roadmap.phases.map(phase => `
            <div class="roadmap-phase">
                <div class="phase-marker">${phase.phase}</div>
                <h4>${phase.title}</h4>
                <div class="phase-duration">${phase.duration}</div>
                <p>${phase.description}</p>
                <div class="flex flex-wrap gap-sm mt-1">
                    ${(phase.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    if (roadmap.summary) {
        html += `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">${roadmap.summary}</p>`;
    }

    container.innerHTML = html;
}

/* ─── Study Quest Interactive Methods ─────────────────────────────── */
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

/* ─── Resume Parser Drag & Drop Handlers ────────────────────────────── */
function initResumeUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('resumeFileInput');
    
    if (!uploadZone) return;
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        }, false);
    });
    
    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            handleResumeFile(files[0]);
        }
    }, false);
    
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) {
            handleResumeFile(fileInput.files[0]);
        }
    });
}

async function handleResumeFile(file) {
    if (!selectedCareerPathId) {
        showToast('Please select a career path first', 'warning');
        return;
    }
    
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        showToast('Only PDF files are supported', 'error');
        return;
    }
    
    const uploadStatus = document.getElementById('uploadStatus');
    const parserOutput = document.getElementById('resumeAnalysisOutput');
    const placeholder = document.getElementById('resumePlaceholderOutput');
    const matchPercent = document.getElementById('resumeMatchPercent');
    const summaryText = document.getElementById('resumeSummaryText');
    const strengthsList = document.getElementById('resumeStrengthsList');
    
    uploadStatus.textContent = `Analyzing ${file.name}...`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('career_path_id', selectedCareerPathId);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/gap-analysis/parse-resume', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to parse resume');
        }
        
        const data = await response.json();
        
        // Populate results
        animateNumber(matchPercent, Math.round(data.match_percentage), 1000, '%');
        summaryText.textContent = data.resume_summary;
        
        if (data.strengths && data.strengths.length) {
            strengthsList.innerHTML = data.strengths.map(s => `<li>${s}</li>`).join('');
        } else {
            strengthsList.innerHTML = '<li>General alignment. Focus on critical skills to strengthen profile.</li>';
        }
        
        placeholder.style.display = 'none';
        parserOutput.style.display = 'flex';
        uploadStatus.textContent = 'Parsing complete!';
        showToast('Resume parsed successfully!', 'success');
        
    } catch (err) {
        showToast(err.message, 'error');
        uploadStatus.textContent = 'Parsing failed.';
    }
}
