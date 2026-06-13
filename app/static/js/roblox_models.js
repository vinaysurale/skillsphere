/* ═══════════════════════════════════════════════════════════════════════
   SkillSphere AI — Optimized Procedural Roblox 3D Models
   Runs WebGL for the hero avatar and high-speed Canvas 2D for widgets.
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const modelContainers = document.querySelectorAll('.roblox-3d-model');
    modelContainers.forEach(container => {
        const modelType = container.getAttribute('data-model') || 'avatar';
        if (modelType === 'avatar') {
            init3DAvatar(container);
        } else if (['rocket', 'diamond', 'portal'].includes(modelType)) {
            init3DModel(container, modelType);
        } else {
            init2DWidget(container, modelType);
        }
    });
});

// ─── 1. HIGH PERFORMANCE THREE.JS WEBGL AVATAR ──────────────────────

function init3DAvatar(container) {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js is not loaded. Skipping 3D Avatar initialization.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    let width = container.clientWidth || 240;
    let height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    
    // Orthographic or perspective camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 7.5);

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: false, // Turn off antialiasing for maximum speed
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1.0); // Lock pixel ratio to 1 for smooth rendering

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const colorLight = new THREE.DirectionalLight(0xe22030, 0.3);
    colorLight.position.set(-5, -3, 2);
    scene.add(colorLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Interaction variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotationY = 0;
    let dragRotationX = 0;
    let hoverState = false;
    let clickAnimationTime = 0;
    let isClickAnimating = false;
    let modelObjects = {};

    // Build Character Avatar
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd369 }); // Yellow skin
    skinMat.flatShading = true;
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x0f52ba }); // Blue shirt
    shirtMat.flatShading = true;
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x138808 }); // Green pants
    pantsMat.flatShading = true;
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x111111 }); // Hat
    hatMat.flatShading = true;
    const faceMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.8), shirtMat);
    modelGroup.add(torso);
    modelObjects.torso = torso;

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.4, 0);
    modelGroup.add(headGroup);
    modelObjects.headGroup = headGroup;

    // Head Mesh
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), skinMat);
    headGroup.add(head);

    // Face Detail
    const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), faceMat);
    eyeLeft.position.set(-0.22, 0.1, 0.51);
    headGroup.add(eyeLeft);

    const eyeRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), faceMat);
    eyeRight.position.set(0.22, 0.1, 0.51);
    headGroup.add(eyeRight);

    const mouthCenter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.1), faceMat);
    mouthCenter.position.set(0, -0.18, 0.51);
    headGroup.add(mouthCenter);

    const mouthLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.1), faceMat);
    mouthLeft.position.set(-0.15, -0.14, 0.51);
    headGroup.add(mouthLeft);

    const mouthRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.1), faceMat);
    mouthRight.position.set(0.15, -0.14, 0.51);
    headGroup.add(mouthRight);

    // Cap/Hat
    const capBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), hatMat);
    capBase.position.y = 0.55;
    headGroup.add(capBase);

    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), hatMat);
    capTop.position.y = 0.8;
    headGroup.add(capTop);

    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.6), hatMat);
    capBrim.position.set(0, 0.5, 0.7);
    capBrim.rotation.x = 0.08;
    headGroup.add(capBrim);

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-1.1, 0.8, 0);
    modelGroup.add(leftArmPivot);
    modelObjects.leftArmPivot = leftArmPivot;

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), skinMat);
    leftArm.position.y = -0.8;
    leftArmPivot.add(leftArm);

    // Right Arm Pivot
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(1.1, 0.8, 0);
    modelGroup.add(rightArmPivot);
    modelObjects.rightArmPivot = rightArmPivot;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), skinMat);
    rightArm.position.y = -0.8;
    rightArmPivot.add(rightArm);

    // Left Leg
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.8, 0.65), pantsMat);
    leftLeg.position.set(-0.45, -1.8, 0);
    modelGroup.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.8, 0.65), pantsMat);
    rightLeg.position.set(0.45, -1.8, 0);
    modelGroup.add(rightLeg);

    // Events
    container.addEventListener('mouseenter', () => { hoverState = true; });
    container.addEventListener('mouseleave', () => { 
        hoverState = false; 
        isDragging = false; 
    });

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        window.playBleepSound(150, 'square', 0.06, 0.03); // Play bleep

        if (!isClickAnimating) {
            isClickAnimating = true;
            clickAnimationTime = 0;
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            dragRotationY += deltaMove.x * 0.01;
            dragRotationX += deltaMove.y * 0.01;
            dragRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, dragRotationX));
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Global Head Tracking
    let globalMouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
        if (!hoverState) {
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            globalMouse.x = (e.clientX - centerX) / window.innerWidth;
            globalMouse.y = (e.clientY - centerY) / window.innerHeight;
        }
    });

    // Render loop
    let clock = new THREE.Clock();
    let isTabVisible = true;
    document.addEventListener('visibilitychange', () => { isTabVisible = !document.hidden; });

    function renderAvatar() {
        requestAnimationFrame(renderAvatar);
        if (!isTabVisible) return;

        const time = clock.getElapsedTime();

        if (!isDragging) {
            dragRotationY *= 0.95;
            dragRotationX *= 0.95;
        }

        modelGroup.rotation.y = dragRotationY;
        modelGroup.rotation.x = dragRotationX;

        // Idle animation
        modelGroup.position.y = Math.sin(time * 2) * 0.04;
        
        if (modelObjects.leftArmPivot) {
            modelObjects.leftArmPivot.rotation.z = Math.sin(time * 2) * 0.05;
        }
        if (modelObjects.rightArmPivot && !isClickAnimating) {
            modelObjects.rightArmPivot.rotation.z = -Math.sin(time * 2) * 0.05;
        }

        // Head tracking
        if (modelObjects.headGroup) {
            let targetHeadY = globalMouse.x * 1.2;
            let targetHeadX = globalMouse.y * 0.8;
            targetHeadY = Math.max(-0.5, Math.min(0.5, targetHeadY));
            targetHeadX = Math.max(-0.3, Math.min(0.3, targetHeadX));
            modelObjects.headGroup.rotation.y += (targetHeadY - modelObjects.headGroup.rotation.y) * 0.1;
            modelObjects.headGroup.rotation.x += (targetHeadX - modelObjects.headGroup.rotation.x) * 0.1;
        }

        // Click waving
        if (isClickAnimating) {
            clickAnimationTime += 0.05;
            const waveAngle = Math.sin(clickAnimationTime * 15) * 0.8;
            if (modelObjects.rightArmPivot) {
                modelObjects.rightArmPivot.rotation.z = -1.8 + waveAngle * 0.3;
                modelObjects.rightArmPivot.rotation.x = waveAngle * 0.4;
            }
            if (clickAnimationTime > Math.PI) {
                isClickAnimating = false;
                clickAnimationTime = 0;
            }
        }

        renderer.render(scene, camera);
    }
    renderAvatar();

    window.addEventListener('resize', () => {
        width = container.clientWidth || 240;
        height = container.clientHeight || 300;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}


// ─── 2. ADDITIONAL 3D MODELS (ROCKET, DIAMOND, PORTAL) ──────────────

function init3DModel(container, modelType) {
    if (typeof THREE === 'undefined') {
        console.warn('Three.js is not loaded. Skipping 3D Model initialization.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    let width = container.clientWidth || 200;
    let height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1.0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const colorLight = new THREE.PointLight(0xe22030, 0.5);
    colorLight.position.set(0, 0, 3);
    scene.add(colorLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotationY = 0;
    let hoverState = false;

    // Build different models
    if (modelType === 'rocket') {
        buildRocket(modelGroup);
    } else if (modelType === 'diamond') {
        buildDiamond(modelGroup);
    } else if (modelType === 'portal') {
        buildPortal(modelGroup);
    }

    // Events
    container.addEventListener('mouseenter', () => { hoverState = true; });
    container.addEventListener('mouseleave', () => { 
        hoverState = false; 
        isDragging = false; 
    });

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        window.playBleepSound?.(200, 'square', 0.06, 0.03);
    });

    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x
            };
            dragRotationY += deltaMove.x * 0.01;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Render loop
    let clock = new THREE.Clock();
    let isTabVisible = true;
    document.addEventListener('visibilitychange', () => { isTabVisible = !document.hidden; });

    function render3DModel() {
        requestAnimationFrame(render3DModel);
        if (!isTabVisible) return;

        const time = clock.getElapsedTime();

        if (!isDragging) {
            dragRotationY += 0.01;
        }

        modelGroup.rotation.y = dragRotationY;

        // Model-specific animations
        if (modelType === 'rocket') {
            modelGroup.position.y = Math.sin(time * 2) * 0.2;
        } else if (modelType === 'diamond') {
            modelGroup.rotation.x = Math.sin(time) * 0.2;
            modelGroup.position.y = Math.sin(time * 1.5) * 0.15;
        } else if (modelType === 'portal') {
            modelGroup.rotation.z = time * 0.5;
        }

        renderer.render(scene, camera);
    }
    render3DModel();

    window.addEventListener('resize', () => {
        width = container.clientWidth || 200;
        height = container.clientHeight || 200;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

// Build Rocket Model
function buildRocket(group) {
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xe22030 });
    bodyMat.flatShading = true;
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    windowMat.flatShading = true;
    const finMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    finMat.flatShading = true;

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3, 6), bodyMat);
    group.add(body);

    // Nose Cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 6), bodyMat);
    nose.position.y = 2.1;
    group.add(nose);

    // Window
    const window1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6), windowMat);
    window1.position.y = 0.8;
    window1.position.z = 0.62;
    group.add(window1);

    // Fins
    for (let i = 0; i < 3; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.8), finMat);
        fin.position.y = -1.2;
        const angle = (i * Math.PI * 2) / 3;
        fin.position.x = Math.cos(angle) * 0.6;
        fin.position.z = Math.sin(angle) * 0.6;
        fin.rotation.y = angle;
        group.add(fin);
    }

    // Exhaust
    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    exhaust.position.y = -1.8;
    group.add(exhaust);
}

// Build Diamond Model
function buildDiamond(group) {
    const diamondMat = new THREE.MeshLambertMaterial({ 
        color: 0x3b82f6,
        emissive: 0x1e40af,
        emissiveIntensity: 0.3
    });
    diamondMat.flatShading = true;

    const topPyramid = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 6), diamondMat);
    topPyramid.position.y = 0.75;
    group.add(topPyramid);

    const bottomPyramid = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 6), diamondMat);
    bottomPyramid.position.y = -0.75;
    bottomPyramid.rotation.z = Math.PI;
    group.add(bottomPyramid);

    // Glowing core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    group.add(core);
}

// Build Portal Model
function buildPortal(group) {
    const portalMat = new THREE.MeshLambertMaterial({ 
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4
    });
    portalMat.flatShading = true;

    // Outer ring
    const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.2, 6, 12),
        portalMat
    );
    group.add(outerRing);

    // Inner ring
    const innerRingMat = new THREE.MeshLambertMaterial({ color: 0xe22030 });
    innerRingMat.flatShading = true;
    const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.15, 6, 12),
        innerRingMat
    );
    group.add(innerRing);

    // Center portal effect
    const center = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 12),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, opacity: 0.7, transparent: true })
    );
    group.add(center);

    // Decorative cubes
    for (let i = 0; i < 6; i++) {
        const cubeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
        cubeMat.flatShading = true;
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.15),
            cubeMat
        );
        const angle = (i * Math.PI * 2) / 6;
        cube.position.x = Math.cos(angle) * 1.5;
        cube.position.y = Math.sin(angle) * 1.5;
        group.add(cube);
    }
}

// ─── 3. HIGH SPEED CANVAS 2D WIDGETS (DASHBOARD) ────────────────────

function init2DWidget(container, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let angle = 0;
    let time = 0;
    let hoverState = false;
    let isClickAnimating = false;
    let clickTimer = 0;

    container.addEventListener('mouseenter', () => { hoverState = true; });
    container.addEventListener('mouseleave', () => { hoverState = false; });
    container.addEventListener('mousedown', () => {
        isClickAnimating = true;
        clickTimer = 0;
        // Bleep sound
        window.playBleepSound(440, 'triangle', 0.08, 0.04);
    });

    let isTabVisible = true;
    document.addEventListener('visibilitychange', () => { isTabVisible = !document.hidden; });

    function drawLoop() {
        requestAnimationFrame(drawLoop);
        if (!isTabVisible) return;

        time += 0.015;
        
        // Spin speed modifiers
        let spinSpeed = hoverState ? 0.08 : 0.025;
        if (isClickAnimating) {
            spinSpeed = 0.2;
            clickTimer += 0.04;
            if (clickTimer > Math.PI) {
                isClickAnimating = false;
                clickTimer = 0;
            }
        }
        angle += spinSpeed;

        if (type === 'gear') {
            drawGear2D(ctx, angle);
        } else if (type === 'trophy') {
            drawTrophy2D(ctx, angle, time, isClickAnimating, clickTimer);
        } else if (type === 'chart') {
            drawChart2D(ctx, time, hoverState);
        }
    }

    drawLoop();
}

// Procedural Canvas 2D Drawing Functions (Optimized)

function drawGear2D(ctx, angle) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(angle);
    
    // Teeth
    ctx.fillStyle = '#94a3b8'; // Metallic grey
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.fillRect(-6, -26, 12, 10);
    }

    // Outer gear circle
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Red core
    ctx.fillStyle = '#e22030'; // Roblox Red
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Spindle
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-3, -3, 6, 6);

    ctx.restore();
}

function drawTrophy2D(ctx, angle, time, isClickAnimating, clickTimer) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    
    // Bouncing float animation
    let yOffset = Math.sin(time * 3.5) * 3;
    if (isClickAnimating) {
        yOffset -= Math.sin(clickTimer) * 12; // Hop up
    }
    
    ctx.translate(32, 32 + yOffset);
    ctx.rotate(angle);

    // Gold Star Trophy (Blocky Roblox style)
    ctx.fillStyle = '#f59e0b'; // Gold
    ctx.fillRect(-12, -12, 24, 24);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-12, -12, 24, 24);

    // Stem & Base
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-3, 12, 6, 8); // stem
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, 19, 20, 5); // base

    ctx.restore();
}

function drawChart2D(ctx, time, hoverState) {
    ctx.clearRect(0, 0, 64, 64);
    
    const baseHeights = [18, 36, 26];
    const colors = ['#e22030', '#3b82f6', '#10b981'];
    const xPositions = [12, 28, 44];
    
    // Draw base plate
    ctx.fillStyle = '#171d32';
    ctx.fillRect(8, 52, 48, 4);
    
    const speed = hoverState ? 6 : 2.5;
    for (let i = 0; i < 3; i++) {
        const wave = Math.sin(time * speed + i * 1.5) * 4;
        const h = baseHeights[i] + wave;
        ctx.fillStyle = colors[i];
        // Draw Roblox-style block columns
        ctx.fillRect(xPositions[i], 52 - h, 8, h);
    }
}
