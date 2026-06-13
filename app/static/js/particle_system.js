/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — Advanced Particle System & Visual Effects
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Floating Ambient Particles ───────────────────────────────────
    class ParticleSystem {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'particle-canvas';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '2';
            this.canvas.style.opacity = '0.4';
            document.body.appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.maxParticles = 50;
            this.mouseX = 0;
            this.mouseY = 0;
            
            this.resize();
            this.init();
            this.animate();
            
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        init() {
            for (let i = 0; i < this.maxParticles; i++) {
                this.particles.push(this.createParticle());
            }
        }

        createParticle() {
            const colors = ['#e22030', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
            return {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.5 + 0.2,
                pulseSpeed: Math.random() * 0.05 + 0.02,
                pulsePhase: Math.random() * Math.PI * 2
            };
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach((particle, index) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Mouse interaction
                const dx = this.mouseX - particle.x;
                const dy = this.mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    particle.x -= dx * force * 0.01;
                    particle.y -= dy * force * 0.01;
                }

                // Pulse effect
                particle.pulsePhase += particle.pulseSpeed;
                const scale = 1 + Math.sin(particle.pulsePhase) * 0.3;

                // Wrap around screen
                if (particle.x < 0) particle.x = this.canvas.width;
                if (particle.x > this.canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.canvas.height;
                if (particle.y > this.canvas.height) particle.y = 0;

                // Draw particle
                this.ctx.save();
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    particle.x, 
                    particle.y, 
                    particle.size * scale, 
                    0, 
                    Math.PI * 2
                );
                this.ctx.fill();
                
                // Glow effect
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
                this.ctx.fill();
                this.ctx.restore();

                // Connect nearby particles
                this.particles.slice(index + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 120) {
                        this.ctx.save();
                        this.ctx.globalAlpha = (1 - distance / 120) * 0.2;
                        this.ctx.strokeStyle = particle.color;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(particle.x, particle.y);
                        this.ctx.lineTo(otherParticle.x, otherParticle.y);
                        this.ctx.stroke();
                        this.ctx.restore();
                    }
                });
            });
        }
    }

    // Initialize particle system
    const particleSystem = new ParticleSystem();

    // ─── Button Hover Particle Burst ──────────────────────────────────
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            createButtonBurst(e.target);
        });
    });

    function createButtonBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = '#e22030';
            particle.style.borderRadius = '50%';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.boxShadow = '0 0 10px rgba(226, 32, 48, 0.8)';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 2 + Math.random() * 2;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;
            
            document.body.appendChild(particle);
            
            let x = centerX;
            let y = centerY;
            let opacity = 1;
            let scale = 1;
            
            function animateParticle() {
                x += dx;
                y += dy;
                opacity -= 0.025;
                scale += 0.05;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = opacity;
                particle.style.transform = `scale(${scale})`;
                
                if (opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                }
            }
            
            animateParticle();
        }
    }

    // ─── Text Typing Effect for Headers ───────────────────────────────
    function typeWriterEffect(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    // ─── Scroll-Based Reveal Animations ───────────────────────────────
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add particle burst on reveal
                if (entry.target.classList.contains('glass-card') || 
                    entry.target.classList.contains('stat-card')) {
                    createRevealBurst(entry.target);
                }
            }
        });
    }, observerOptions);

    // Apply to cards with initial hidden state
    document.querySelectorAll('.glass-card, .stat-card, .index-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    function createRevealBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = i % 2 === 0 ? '#e22030' : '#3b82f6';
            particle.style.borderRadius = '50%';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            const angle = (Math.PI * 2 * i) / 8;
            const velocity = 1.5;
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

    // ─── Skill Badge Shimmer Effect ───────────────────────────────────
    const badges = document.querySelectorAll('.badge, .skill-tag');
    
    badges.forEach(badge => {
        badge.style.position = 'relative';
        badge.style.overflow = 'hidden';
        
        badge.addEventListener('mouseenter', function() {
            const shimmer = document.createElement('div');
            shimmer.style.position = 'absolute';
            shimmer.style.top = '0';
            shimmer.style.left = '-100%';
            shimmer.style.width = '100%';
            shimmer.style.height = '100%';
            shimmer.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)';
            shimmer.style.animation = 'shimmerSlide 0.6s ease';
            
            this.appendChild(shimmer);
            
            setTimeout(() => shimmer.remove(), 600);
        });
    });

    // Add shimmer animation
    const shimmerStyle = document.createElement('style');
    shimmerStyle.textContent = `
        @keyframes shimmerSlide {
            0% { left: -100%; }
            100% { left: 100%; }
        }
    `;
    document.head.appendChild(shimmerStyle);

    // ─── Navigation Link Hover Effects ────────────────────────────────
    const navLinks = document.querySelectorAll('.navbar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const sparkles = 3;
            const rect = this.getBoundingClientRect();
            
            for (let i = 0; i < sparkles; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.style.position = 'fixed';
                    sparkle.style.width = '3px';
                    sparkle.style.height = '3px';
                    sparkle.style.background = '#ffffff';
                    sparkle.style.borderRadius = '50%';
                    sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
                    sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
                    sparkle.style.pointerEvents = 'none';
                    sparkle.style.zIndex = '10001';
                    sparkle.style.boxShadow = '0 0 6px #ffffff';
                    
                    document.body.appendChild(sparkle);
                    
                    let opacity = 1;
                    let y = parseFloat(sparkle.style.top);
                    
                    function animateSparkle() {
                        y -= 2;
                        opacity -= 0.05;
                        
                        sparkle.style.top = y + 'px';
                        sparkle.style.opacity = opacity;
                        
                        if (opacity > 0) {
                            requestAnimationFrame(animateSparkle);
                        } else {
                            sparkle.remove();
                        }
                    }
                    
                    animateSparkle();
                }, i * 50);
            }
        });
    });

    console.log('✨ Advanced particle system & visual effects initialized');
});
