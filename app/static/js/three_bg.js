/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — Optimized Three.js Interactive 3D Background
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js is not loaded. Skipping 3D background initialization.');
        return;
    }

    // Create canvas if it doesn't exist
    let canvas = document.getElementById('threejs-bg');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'threejs-bg';
        document.body.appendChild(canvas);
    }

    // ─── Setup Scene, Camera, & Renderer ──────────────────────────────
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    // Performance-optimized WebGL settings
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: false, // Turn off antialiasing for massive performance boost
        powerPreference: "high-performance" 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1.0); // Lock pixel ratio to 1 to prevent rendering lag on high-DPI screens

    // ─── Create 3D Blocks (Roblox-style blocky studs) ─────────────────────
    const blockCount = 25; // More blocks for Roblox feel
    const blocks = [];
    const blockGroup = new THREE.Group();
    scene.add(blockGroup);

    // Only use cubes for authentic Roblox look
    const geometries = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.BoxGeometry(2.5, 1, 1),
        new THREE.BoxGeometry(1, 3, 1),
        new THREE.BoxGeometry(3, 1, 1)
    ];

    const colors = [
        0x00b06f, // Roblox Green
        0x0074bd, // Roblox Blue
        0xffcb00, // Warning Yellow
        0xe11d48, // Danger Red
        0x666666, // Gray
        0x2c2d2f  // Dark Gray
    ];

    // Switching to MeshLambertMaterial with stronger colors
    const materials = colors.map(color => {
        const mat = new THREE.MeshLambertMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        mat.flatShading = true;
        return mat;
    });

    for (let i = 0; i < blockCount; i++) {
        const geom = geometries[Math.floor(Math.random() * geometries.length)];
        const mat = materials[Math.floor(Math.random() * materials.length)];
        const mesh = new THREE.Mesh(geom, mat);

        // Randomly scatter blocks
        mesh.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 30
        );

        // Random rotations
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0
        );

        // Store speed values
        mesh.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.006,
            rotSpeedY: (Math.random() - 0.5) * 0.006,
            driftSpeedY: (Math.random() - 0.5) * 0.003,
            driftSpeedX: (Math.random() - 0.5) * 0.003,
            pushX: 0,
            pushY: 0,
            baseY: mesh.position.y,
            baseX: mesh.position.x,
            pulsePhase: Math.random() * Math.PI * 2
        };

        blockGroup.add(mesh);
        blocks.push(mesh);
    }

    // ─── Lighting (Simplified) ────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const colorLight = new THREE.PointLight(0x00b06f, 0.3);
    colorLight.position.set(0, 0, 10);
    scene.add(colorLight);

    // ─── Mouse Interaction with Push/Pull Effect ──────────────────────
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let mouseXNormalized = 0;
    let mouseYNormalized = 0;

    window.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth) - 0.5;
        targetY = (e.clientY / window.innerHeight) - 0.5;
        mouseXNormalized = targetX;
        mouseYNormalized = targetY;
    });

    // Click to create shockwave effect
    window.addEventListener('click', (e) => {
        const clickX = (e.clientX / window.innerWidth) * 2 - 1;
        const clickY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        blocks.forEach(block => {
            const distance = Math.sqrt(
                Math.pow(block.position.x - clickX * 25, 2) + 
                Math.pow(block.position.y - clickY * 20, 2)
            );
            
            if (distance < 15) {
                const force = (15 - distance) / 15;
                block.userData.pushX = (block.position.x - clickX * 25) * force * 0.5;
                block.userData.pushY = (block.position.y - clickY * 20) * force * 0.5;
            }
        });
    });

    // ─── Animation Loop (With Visibility Check) ────────────────────────
    let isTabVisible = true;
    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
    });

    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        // Skip rendering if tab is in background
        if (!isTabVisible) return;

        const time = clock.getElapsedTime();

        // Drift & Rotate blocks with enhanced effects
        blocks.forEach(block => {
            block.rotation.x += block.userData.rotSpeedX;
            block.rotation.y += block.userData.rotSpeedY;
            
            // Apply push forces
            if (block.userData.pushX !== 0 || block.userData.pushY !== 0) {
                block.position.x += block.userData.pushX;
                block.position.y += block.userData.pushY;
                block.userData.pushX *= 0.9;
                block.userData.pushY *= 0.9;
            }
            
            // Normal drift
            block.position.y += block.userData.driftSpeedY;
            block.position.x += block.userData.driftSpeedX;

            // Pulse effect
            block.userData.pulsePhase += 0.02;
            const scale = 1 + Math.sin(block.userData.pulsePhase) * 0.1;
            block.scale.set(scale, scale, scale);

            // Wrap boundaries
            if (block.position.y > 25) block.position.y = -25;
            if (block.position.y < -25) block.position.y = 25;
            if (block.position.x > 30) block.position.x = -30;
            if (block.position.x < -30) block.position.x = 30;
        });

        // Lerp camera shift based on cursor with enhanced movement
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        blockGroup.rotation.y = currentX * 0.5;
        blockGroup.rotation.x = currentY * 0.4;

        // Subtle breathing effect
        blockGroup.position.z = Math.sin(time * 0.5) * 2;

        // Animate color light position
        colorLight.position.x = Math.sin(time * 0.8) * 10;
        colorLight.position.y = Math.cos(time * 0.6) * 8;

        renderer.render(scene, camera);
    }

    animate();

    // ─── Resize Event ─────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
