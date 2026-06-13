/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — Enhanced Sound Effects System
   ═══════════════════════════════════════════════════════════════════════ */

// Global sound manager
class RobloxSoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.masterVolume = 0.3;
        this.sounds = {};
        
        // Initialize on user interaction (required by browsers)
        document.addEventListener('click', () => this.init(), { once: true });
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sound system initialized');
        }
    }

    playBleep(frequency = 440, type = 'sine', duration = 0.1, volume = 0.15) {
        if (this.isMuted || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playChord(frequencies = [440, 554, 659], duration = 0.2, volume = 0.1) {
        if (this.isMuted || !this.audioContext) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playBleep(freq, 'sine', duration, volume);
            }, index * 50);
        });
    }

    playSuccess() {
        this.playChord([523, 659, 784], 0.15, 0.12); // C-E-G major chord
    }

    playError() {
        this.playChord([440, 415, 392], 0.2, 0.1); // Descending dissonant
    }

    playClick() {
        this.playBleep(800, 'square', 0.05, 0.08);
    }

    playHover() {
        this.playBleep(1200, 'sine', 0.03, 0.06);
    }

    playWhoosh() {
        if (this.isMuted || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playPowerUp() {
        if (this.isMuted || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    playCollect() {
        const notes = [659, 784, 988, 1319]; // E-G-B-E (up an octave)
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playBleep(note, 'square', 0.08, 0.1);
            }, i * 60);
        });
    }

    toggle() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// Initialize global sound manager
const soundManager = new RobloxSoundManager();

// Expose global functions for backward compatibility
window.playBleepSound = (freq, type, dur, vol) => soundManager.playBleep(freq, type, dur, vol);
window.toggleRobloxMute = () => {
    const isMuted = soundManager.toggle();
    const btn = document.querySelector('.sound-toggle-btn');
    if (btn) {
        btn.textContent = isMuted ? '🔇 Sound' : '🔊 Sound';
        btn.classList.toggle('muted', isMuted);
    }
    return isMuted;
};

document.addEventListener('DOMContentLoaded', () => {
    // ─── Button Sound Effects ─────────────────────────────────────────
    
    // Primary buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mouseenter', () => soundManager.playHover());
        btn.addEventListener('click', () => soundManager.playClick());
    });

    // Secondary buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.addEventListener('mouseenter', () => soundManager.playBleep(900, 'sine', 0.03, 0.05));
        btn.addEventListener('click', () => soundManager.playBleep(700, 'square', 0.05, 0.07));
    });

    // ─── Navigation Sound Effects ─────────────────────────────────────
    
    document.querySelectorAll('.navbar-nav a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            soundManager.playBleep(1400, 'sine', 0.02, 0.04);
        });
        
        link.addEventListener('click', () => {
            soundManager.playWhoosh();
        });
    });

    // Logo click
    const logo = document.querySelector('.navbar-brand');
    if (logo) {
        logo.addEventListener('click', () => {
            soundManager.playPowerUp();
        });
    }

    // ─── Card Interaction Sounds ──────────────────────────────────────
    
    document.querySelectorAll('.glass-card, .stat-card, .index-card').forEach(card => {
        let hasPlayed = false;
        
        card.addEventListener('mouseenter', () => {
            if (!hasPlayed) {
                soundManager.playBleep(600, 'triangle', 0.05, 0.06);
                hasPlayed = true;
                setTimeout(() => hasPlayed = false, 200);
            }
        });
    });

    // ─── Form Input Sounds ────────────────────────────────────────────
    
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('focus', () => {
            soundManager.playBleep(1000, 'sine', 0.03, 0.05);
        });
        
        input.addEventListener('blur', () => {
            soundManager.playBleep(800, 'sine', 0.03, 0.05);
        });
    });

    // ─── Badge/Tag Sounds ─────────────────────────────────────────────
    
    document.querySelectorAll('.badge, .skill-tag').forEach(badge => {
        badge.addEventListener('mouseenter', () => {
            soundManager.playBleep(1600, 'triangle', 0.02, 0.04);
        });
    });

    // ─── Success/Error Toast Sounds ───────────────────────────────────
    
    // Watch for toast notifications
    const toastObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.classList && node.classList.contains('toast')) {
                    if (node.classList.contains('success')) {
                        soundManager.playSuccess();
                    } else if (node.classList.contains('error')) {
                        soundManager.playError();
                    } else {
                        soundManager.playBleep(800, 'sine', 0.1, 0.08);
                    }
                }
            });
        });
    });

    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toastObserver.observe(toastContainer, { childList: true });
    }

    // ─── Progress Bar Milestone Sounds ────────────────────────────────
    
    document.querySelectorAll('.progress-fill').forEach(progressBar => {
        const observer = new MutationObserver(() => {
            const width = parseFloat(progressBar.style.width || 0);
            if (width === 100) {
                soundManager.playCollect();
            } else if (width % 25 === 0 && width > 0) {
                soundManager.playBleep(440 + width * 5, 'square', 0.08, 0.08);
            }
        });
        
        observer.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
    });

    // ─── Page Transition Sounds ───────────────────────────────────────
    
    window.addEventListener('beforeunload', () => {
        soundManager.playWhoosh();
    });

    // Page load sound
    window.addEventListener('load', () => {
        setTimeout(() => {
            soundManager.playChord([523, 659, 784, 1047], 0.15, 0.08);
        }, 500);
    });

    // ─── Scroll Sounds (Throttled) ────────────────────────────────────
    
    let lastScrollSound = 0;
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
        const now = Date.now();
        const scrollY = window.scrollY;
        const scrollDelta = Math.abs(scrollY - lastScrollY);
        
        // Only play sound if scrolled more than 200px and 300ms has passed
        if (scrollDelta > 200 && now - lastScrollSound > 300) {
            soundManager.playBleep(400 + scrollDelta, 'sine', 0.02, 0.03);
            lastScrollSound = now;
            lastScrollY = scrollY;
        }
    });

    // ─── Interactive Element Sounds ───────────────────────────────────
    
    // Checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                soundManager.playBleep(1200, 'square', 0.05, 0.08);
            } else {
                soundManager.playBleep(800, 'square', 0.05, 0.08);
            }
        });
    });

    // Radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            soundManager.playBleep(1000, 'sine', 0.05, 0.07);
        });
    });

    // Dropdowns
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            soundManager.playBleep(900, 'triangle', 0.06, 0.07);
        });
    });

    // ─── 3D Model Interaction Sounds ──────────────────────────────────
    
    document.querySelectorAll('.roblox-3d-model').forEach(model => {
        model.addEventListener('mousedown', () => {
            const modelType = model.getAttribute('data-model');
            
            if (modelType === 'avatar') {
                soundManager.playBleep(150, 'square', 0.06, 0.08);
            } else if (modelType === 'rocket') {
                soundManager.playWhoosh();
            } else if (modelType === 'diamond') {
                soundManager.playCollect();
            } else if (modelType === 'portal') {
                soundManager.playChord([400, 500, 600], 0.1, 0.08);
            } else if (modelType === 'gear') {
                soundManager.playBleep(440, 'triangle', 0.08, 0.08);
            } else if (modelType === 'trophy') {
                soundManager.playSuccess();
            } else if (modelType === 'chart') {
                soundManager.playBleep(800, 'sine', 0.06, 0.07);
            }
        });
    });

    // ─── Ticker Tape Sounds ───────────────────────────────────────────
    
    const tickerItems = document.querySelectorAll('.ticker-item');
    tickerItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            const isTrendUp = item.querySelector('.trend-up');
            if (isTrendUp) {
                soundManager.playBleep(1200 + index * 100, 'sine', 0.04, 0.05);
            } else {
                soundManager.playBleep(800 - index * 50, 'sine', 0.04, 0.05);
            }
        });
    });

    // ─── Keyboard Shortcuts with Sound ────────────────────────────────
    
    document.addEventListener('keydown', (e) => {
        // Escape key
        if (e.key === 'Escape') {
            soundManager.playBleep(600, 'square', 0.08, 0.08);
        }
        
        // Enter key
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            soundManager.playClick();
        }
        
        // Tab key
        if (e.key === 'Tab') {
            soundManager.playBleep(1100, 'sine', 0.02, 0.04);
        }
        
        // Arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            soundManager.playBleep(900, 'triangle', 0.02, 0.03);
        }
    });

    // ─── Sound Toggle Button Setup ────────────────────────────────────
    
    const soundBtn = document.querySelector('.sound-toggle-btn');
    if (soundBtn) {
        soundBtn.addEventListener('mouseenter', () => {
            if (!soundManager.isMuted) {
                soundManager.playHover();
            }
        });
    }

    console.log('🔊 Enhanced sound effects system loaded');
});

// Export for external use
window.soundManager = soundManager;
