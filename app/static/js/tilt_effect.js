/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — 3D Parallax Tilt, Glow, Sound Synth & Click Physics
   ═══════════════════════════════════════════════════════════════════════ */

// Global state for Roblox Sound Synth
window.robloxMuted = localStorage.getItem('robloxMuted') === 'true';
window.audioContext = null;

// Synthesize retro bleep/oof sounds procedurally
window.playBleepSound = function(frequency, type = 'sine', duration = 0.1, volume = 0.05) {
    if (window.robloxMuted) return;
    try {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume context if suspended (browser security autoplays)
        if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }

        const ctx = window.audioContext;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Sound duration envelope
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (err) {
        console.warn('Web Audio playback blocked or unsupported:', err);
    }
};

// Toggle audio state
window.toggleRobloxMute = function() {
    window.robloxMuted = !window.robloxMuted;
    localStorage.setItem('robloxMuted', window.robloxMuted);
    updateMuteButtons();
    
    // Play test chime if unmuted
    if (!window.robloxMuted) {
        window.playBleepSound(440, 'sine', 0.15, 0.08);
    }
};

function updateMuteButtons() {
    const buttons = document.querySelectorAll('.sound-toggle-btn');
    buttons.forEach(btn => {
        if (window.robloxMuted) {
            btn.innerHTML = '🔇 Mute';
            btn.classList.add('muted');
        } else {
            btn.innerHTML = '🔊 Sound';
            btn.classList.remove('muted');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mute buttons state
    updateMuteButtons();

    // ─── 1. 3D Parallax Card Tilt & Border Glow ─────────────────────
    const cards = document.querySelectorAll('.glass-card, .stat-card, .index-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Cursor position relative to card boundaries
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set custom properties for border follow glow in CSS
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Normalize relative to card center (-0.5 to 0.5)
            const normX = (x / rect.width) - 0.5;
            const normY = (y / rect.height) - 0.5;

            // Maximum tilt angle in degrees
            const maxTilt = 10;
            
            const tiltX = -normY * maxTilt; // Rotate on X axis using vertical movement
            const tiltY = normX * maxTilt;  // Rotate on Y axis using horizontal movement

            // Apply 3D transform with slight scaling
            card.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        // Reset transition values on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.setProperty('--mouse-x', `-999px`);
            card.style.setProperty('--mouse-y', `-999px`);
        });

        // Smooth active state transition & hover sound
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out';
            window.playBleepSound(350, 'triangle', 0.05, 0.03); // Soft subtle bleep on hover
        });
    });

    // ─── 2. Interactivity Sounds for general UI elements ─────────────
    const interactives = document.querySelectorAll('button, a, input, select, textarea');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            // Hover sound
            if (!el.classList.contains('sound-toggle-btn')) {
                window.playBleepSound(400, 'sine', 0.04, 0.02);
            }
        });

        el.addEventListener('click', (e) => {
            // Click sound: classic retro pitch bend or oof style bleep
            if (el.classList.contains('sound-toggle-btn')) return;
            
            if (el.classList.contains('btn-danger') || el.id === 'navLoginBtn') {
                // Deeper click sound for alert/signout
                window.playBleepSound(220, 'square', 0.12, 0.05);
            } else {
                // Cheerful standard click
                window.playBleepSound(523.25, 'sine', 0.08, 0.06); // C5
                setTimeout(() => {
                    window.playBleepSound(659.25, 'sine', 0.06, 0.04); // E5
                }, 40);
            }
        });
    });

    // ─── 3. Global Mouse Click Gravity Particles ────────────────────
    
    // Create physical particles container
    const particleContainer = document.createElement('div');
    particleContainer.id = 'click-particle-container';
    particleContainer.style.position = 'fixed';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100vw';
    particleContainer.style.height = '100vh';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '99999';
    particleContainer.style.overflow = 'hidden';
    document.body.appendChild(particleContainer);

    let activeParticles = [];

    window.addEventListener('click', (e) => {
        // Skip clicking buttons if we only want aesthetic particles (but let's spawn them everywhere!)
        // Spawn 8-12 block particles
        const numParticles = 8 + Math.floor(Math.random() * 5);
        const colors = [
            '#e22030', // Roblox Red
            '#3b82f6', // Bright Blue
            '#10b981', // Green
            '#ffd369', // Yellow
            '#f9fafb', // White
            '#9ca3af'  // Grey
        ];

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'roblox-click-particle';
            
            // Random styling (size & colors)
            const size = 8 + Math.floor(Math.random() * 10);
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.position = 'absolute';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.borderRadius = '2px';
            particle.style.boxShadow = `0 0 5px ${color}88`;
            particle.style.transformOrigin = 'center';
            
            // Spawn location
            const startX = e.clientX - size/2;
            const startY = e.clientY - size/2;
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            particleContainer.appendChild(particle);

            // Add velocity & angle state
            activeParticles.push({
                el: particle,
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.8) * 14 - 3, // upward initial velocity
                rot: Math.random() * 360,
                vrot: (Math.random() - 0.5) * 15,
                opacity: 1.0,
                size: size
            });
        }
    });

    // Physics Update Loop
    function updateParticles() {
        const gravity = 0.45;
        const bounceCoeff = -0.55;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        for (let i = activeParticles.length - 1; i >= 0; i--) {
            const p = activeParticles[i];
            
            // Apply physics
            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vrot;
            p.opacity -= 0.015; // Fade rate

            // Boundary Collisions (Sides and floor bounce)
            if (p.x < 0) {
                p.x = 0;
                p.vx = -p.vx * 0.7;
            } else if (p.x > screenWidth - p.size) {
                p.x = screenWidth - p.size;
                p.vx = -p.vx * 0.7;
            }

            if (p.y > screenHeight - p.size) {
                p.y = screenHeight - p.size;
                p.vy = p.vy * bounceCoeff;
                p.vx *= 0.8; // friction
            }

            // Update DOM element
            if (p.opacity <= 0) {
                p.el.remove();
                activeParticles.splice(i, 1);
            } else {
                p.el.style.left = `${p.x}px`;
                p.el.style.top = `${p.y}px`;
                p.el.style.opacity = p.opacity;
                p.el.style.transform = `rotate(${p.rot}deg) scale(${p.opacity})`;
            }
        }

        requestAnimationFrame(updateParticles);
    }

    // Start physics loop
    updateParticles();
});
