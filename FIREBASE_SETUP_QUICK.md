# 🔥 Firebase Setup - Quick Start

## ✅ Firebase Realtime Database + Auth Ready!

Your application can now use **Firebase** instead of SQLite for Render deployment.

---

## 🚀 Quick Setup (3 Steps)

### 1. Firebase Console
1. Go to https://console.firebase.google.com/
2. Select project: `skillsphere-aa420`
3. Enable **Realtime Database** (Create Database → us-central1 → Test mode)
4. Enable **Authentication** → Email/Password
5. Generate **Service Account Key**: Project Settings → Service Accounts → Generate New Private Key
6. Download JSON, save as `firebase-service-account.json`

### 2. Update .env
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 3. Update main.py
```python
# Replace old auth import
from app.routers import auth_firebase as auth

# In lifespan function, remove create_tables(), add:
from app.services.firebase_db import FirebaseDB
FirebaseDB.initialize()
```

---

## 📊 Database Structure

### Users
- Path: `/users/{uid}`
- Fields: id, name, email, college, degree, career_goal, etc.

### Skills
- Path: `/skills/{skill_id}`
- Fields: id, name, category, demand_score, avg_salary

### User Skills
- Path: `/user_skills/{uid}/{skill_id}`
- Fields: proficiency, verified, added_at

### Career Paths
- Path: `/career_paths/{career_id}`
- Fields: id, name, description, avg_salary

---

## 🔐 API Endpoints

### Signup
```bash
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

### Login (with Firebase ID token)
```bash
POST /api/auth/login
{
  "id_token": "<firebase-id-token>"
}
```

### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <firebase-id-token>
```

### Update Profile
```bash
PUT /api/auth/profile
Authorization: Bearer <firebase-id-token>
{
  "name": "Jane Doe",
  "college": "MIT"
}
```

---

## 🌐 Render Deployment

### Environment Variables
```bash
FIREBASE_API_KEY=AIzaSyA7wtcF88c-ZJkwr_KJiZ5kcrGxYVXVNAc
FIREBASE_AUTH_DOMAIN=skillsphere-aa420.firebaseapp.com
FIREBASE_PROJECT_ID=skillsphere-aa420
FIREBASE_STORAGE_BUCKET=skillsphere-aa420.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=733635256061
FIREBASE_APP_ID=1:733635256061:web:9fdcf9e6a866b72f222894

# Service account as JSON string (no file needed!)
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

**Get JSON string:**
```bash
cat firebase-service-account.json | tr -d '\n'
# Copy output to FIREBASE_CREDENTIALS_JSON
```

---

## 💻 Frontend Integration

### 1. Add Firebase SDK
```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
  import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
  
  // Get config from backend
  const response = await fetch('/api/auth/config');
  const config = await response.json();
  
  const app = initializeApp(config);
  window.firebaseAuth = getAuth(app);
</script>
```

### 2. Sign Up
```javascript
import { createUserWithEmailAndPassword } from 'firebase/auth';

const userCred = await createUserWithEmailAndPassword(
  firebaseAuth, 
  email, 
  password
);

// Sync to database
await fetch('/api/auth/sync-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: userCred.user.uid,
    email: userCred.user.email,
    name: name
  })
});
```

### 3. Sign In
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCred = await signInWithEmailAndPassword(
  firebaseAuth,
  email,
  password
);

const idToken = await userCred.user.getIdToken();

// Verify with backend
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id_token: idToken })
});
```

### 4. Make Authenticated Requests
```javascript
const user = firebaseAuth.currentUser;
const idToken = await user.getIdToken();

const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

---

## 🔄 Migration from SQLAlchemy

### Old Code
```python
from app.database import get_db
from app.models.user import User

def get_user(user_id: str, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == user_id).first()
```

### New Code
```python
from app.services.firebase_db import UserDB

def get_user(user_id: str):
    return UserDB.get_by_id(user_id)
```

---

## 🎯 Key Benefits

✅ **No Database Server** - Firebase is cloud-hosted  
✅ **No Migrations** - Schema-less  
✅ **Built-in Auth** - OAuth ready  
✅ **Free Tier** - Perfect for testing  
✅ **Real-time Sync** - Instant updates  
✅ **Perfect for Render** - No extra services needed  

---

## 📁 Files Created

1. `app/services/firebase_db.py` - Database operations
2. `app/services/firebase_auth_service.py` - Auth operations
3. `app/routers/auth_firebase.py` - Auth endpoints
4. `FIREBASE_MIGRATION_GUIDE.md` - Full documentation

---

## 🧪 Test It

```bash
# Test Firebase connection
python -c "from app.services.firebase_db import FirebaseDB; FirebaseDB.initialize()"

# Test user creation
python -c "
from app.services.firebase_db import UserDB
user = UserDB.create({
    'name': 'Test',
    'email': 'test@test.com'
})
print(user)
"
```

---

## ✅ Checklist

- [ ] Firebase Realtime Database created
- [ ] Firebase Authentication enabled
- [ ] Service account key downloaded
- [ ] Environment variables set
- [ ] main.py updated
- [ ] Frontend Firebase SDK added
- [ ] Login/signup flows updated
- [ ] Deployed to Render

---

**Firebase is ready! Deploy to Render without any database server!** 🔥🚀
