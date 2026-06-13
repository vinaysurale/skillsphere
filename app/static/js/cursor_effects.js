/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — Advanced Custom Cursor & Mouse Trail Effects
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Custom Animated Cursor (Only Visible Cursor) ────────────────
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    
    // Create arrow cursor shape
    const cursorCore = document.createElement('div');
    cursorCore.className = 'custom-cursor-core';
    cursor.appendChild(cursorCore);
    
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Smooth cursor follow with minimal lag
    function animateCursor() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        cursorX += dx * 0.2; // Faster response
        cursorY += dy * 0.2;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create trail particles occasionally
        if (Math.random() > 0.92) {
            createCursorTrail(e.clientX, e.clientY);
        }
    });

    // Click effect
    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
        window.playBleepSound?.(600, 'sine', 0.05, 0.02);
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
    });

    // Hover state detection for interactive elements
    const interactiveElements = 'a, button, input, select, textarea, [role="button"], .btn, .glass-card, .stat-card, .index-card, .navbar-brand';
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveElements)) {
            cursor.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveElements)) {
            cursor.classList.remove('hovering');
        }
    });

    // ─── Cursor Trail Particles ───────────────────────────────────────
    function createCursorTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'custom-cursor-trail';
        trail.style.left = x + 'px';
        trail.style.top = y + 'px';
        
        // Create small white square for trail
        trail.style.width = '4px';
        trail.style.height = '4px';
        trail.style.background = 'white';
        trail.style.border = '1px solid black';
        trail.style.position = 'fixed';
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '9998';
        
        document.body.appendChild(trail);
        
        setTimeout(() => trail.remove(), 400);
    }

    // ─── Card Mouse Effects (Disabled for authentic Roblox) ────────────
    // Roblox UI doesn't use mouse-following glows

    // ─── Create Simple Floating Elements (Optional) ────────────────────
    // Minimal floating elements for Roblox aesthetic

    // ─── Simple Hover Tilt Effect (Minimal) ───────────────────────────
    // Disabled - Roblox UI doesn't use 3D tilt effects

    // ─── Simple Button Effect (Roblox Style) ──────────────────────────
    // Roblox buttons don't use magnetic effects, just simple hover

    // ─── Simplified Text Effects (Roblox Style) ───────────────────────
    // Roblox UI doesn't use glitch effects

    // ─── Page Load Particles Burst ────────────────────────────────────
    function createPageLoadBurst() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = `rgba(226, 32, 48, ${Math.random()})`;
            particle.style.borderRadius = '50%';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 5;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;
            
            document.body.appendChild(particle);
            
            let x = centerX;
            let y = centerY;
            let opacity = 1;
            
            function animateParticle() {
                x += dx;
                y += dy;
                opacity -= 0.02;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                }
            }
            
            animateParticle();
        }
    }
    
    // Trigger burst on page load with delay
    setTimeout(createPageLoadBurst, 300);

    // ─── Interactive Ripple Effect on Click ───────────────────────────
    document.addEventListener('click', (e) => {
        createRipple(e.clientX, e.clientY);
    });

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(226, 32, 48, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9998';
        ripple.style.animation = 'rippleExpand 0.6s ease-out';
        
        document.body.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // Add ripple animation to stylesheet dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleExpand {
            0% {
                width: 20px;
                height: 20px;
                opacity: 1;
            }
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ─── Smooth Scroll with Parallax ──────────────────────────────────
    let scrollY = 0;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        
        // Parallax effect for background elements
        const parallaxElements = document.querySelectorAll('.floating-3d-element');
        parallaxElements.forEach((element, index) => {
            const speed = (index + 1) * 0.5;
            element.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
        });
    });

    console.log('✨ Advanced cursor effects & mouse interactions initialized');
});
