/* ═══════════════════════════════════════════════════════════════════
   SkillSphere AI — Auth Module (Firebase-Enabled)
   ═══════════════════════════════════════════════════════════════════ */

// Initialize Firebase
let firebaseAuth = null;
let firebaseInitialized = false;

async function initFirebase() {
    try {
        const config = await apiFetch('/api/auth/config');
        if (config && config.apiKey) {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(config);
                firebaseAuth = firebase.auth();
                firebaseInitialized = true;
                console.log("Firebase initialized successfully");
            }
        }
    } catch (err) {
        console.warn("Firebase config not loaded or Firebase not configured:", err);
    }
}

// Call on load
initFirebase();

async function handleSignup(e) {
    e.preventDefault();
    const btn = document.getElementById('signupBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Creating...';

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        if (firebaseInitialized && firebaseAuth) {
            // Register via Firebase
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            // Optionally update user display name in Firebase Auth
            await userCredential.user.updateProfile({ displayName: name });
            const token = await userCredential.user.getIdToken();
            localStorage.setItem('token', token);
            
            // Sync with backend by fetching profile (which will auto-register in SQLite)
            await apiFetch('/api/auth/me');
            
            showToast('Account created! Welcome to SkillSphere!', 'success');
            setTimeout(() => window.location.href = '/profile', 800);
        } else {
            // Fallback to local authentication
            const data = await apiFetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
            });

            localStorage.setItem('token', data.token);
            showToast('Account created! Welcome to SkillSphere!', 'success');
            setTimeout(() => window.location.href = '/profile', 800);
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Signing in...';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        if (firebaseInitialized && firebaseAuth) {
            // Login via Firebase
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const token = await userCredential.user.getIdToken();
            localStorage.setItem('token', token);
            
            // Sync with backend by fetching profile (which will auto-register/retrieve user)
            await apiFetch('/api/auth/me');

            showToast('Welcome back!', 'success');
            setTimeout(() => window.location.href = '/dashboard', 800);
        } else {
            // Fallback to local authentication
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem('token', data.token);
            showToast('Welcome back!', 'success');
            setTimeout(() => window.location.href = '/dashboard', 800);
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}
