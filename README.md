# 🎮 SkillSphere AI - Bloomberg for Skills

[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange)](https://firebase.google.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![Roblox Theme](https://img.shields.io/badge/Theme-Authentic%20Roblox-00b06f)](https://www.roblox.com/)

A professional skill tracking and career development platform with an immersive 3D Roblox-themed interface, powered by Firebase and AI.

---

## ✨ Features

### 🎨 Authentic Roblox 3D Theme
- **Custom cursor** with animations (hide default, show only custom)
- **7 interactive 3D models** (Avatar, Rocket, Diamond, Portal, Gear, Trophy, Chart)
- **3D background** with 25+ floating cubes
- **Bold blocky UI** matching official Roblox design
- **Green & gray palette** (authentic Roblox colors)
- **Particle effects** and trail animations
- **Sound effects system** (15+ interactive sounds)
- **Press-down buttons** with 3D depth shadows
- **Horizontal shine effects** on cards

### 🔥 Firebase Integration
- **Firebase Realtime Database** - No database server needed
- **Firebase Authentication** - Built-in user management
- **OAuth Support** - Google, GitHub sign-in ready
- **Real-time sync** - Instant data updates
- **Cloud-hosted** - Perfect for Render deployment
- **Free tier** - 1GB storage, 10GB/month bandwidth

### 🎯 Core Features
- **Skill Portfolio Management** - Track and showcase skills
- **AI-Powered Gap Analysis** - Identify skill gaps with Gemini AI
- **Market Intelligence** - Real-time skill demand tracking
- **Career Path Simulator** - Explore different career trajectories
- **Learning Recommendations** - Personalized skill development
- **Resume Parsing** - Extract skills from PDF resumes
- **GitHub Integration** - Analyze repository skills

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Firebase Project (free tier available)
- Gemini API Key (optional, for AI features)

### Installation

```bash
# Clone repository
git clone https://github.com/vinaysurale/skillsphere.git
cd skillsphere

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials
```

### Firebase Setup

1. **Create Firebase Project**: https://console.firebase.google.com/
2. **Enable Realtime Database**: Database → Create Database → Test mode
3. **Enable Authentication**: Authentication → Email/Password
4. **Download Service Account**: Project Settings → Service Accounts → Generate New Private Key
5. **Update .env**:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Run Application

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000

---

## 📊 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Firebase Realtime Database** - NoSQL cloud database
- **Firebase Authentication** - User management & OAuth
- **Pydantic** - Data validation
- **Google Gemini AI** - AI-powered features

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **Three.js** - 3D graphics and models
- **Chart.js** - Data visualizations
- **Canvas API** - 2D widget rendering
- **Web Audio API** - Sound effects

### 3D & Animations
- **Custom cursor** with trail effects
- **Interactive 3D models** (drag, rotate, click)
- **Particle systems** (ambient, burst, trail)
- **Smooth animations** (60fps optimized)
- **Sound feedback** on all interactions

---

## 🎮 3D Theme Features

### Interactive Elements
- **Custom Roblox Cursor** - White arrow with hover/click states
- **3D Avatar** - Drag to rotate, click to wave
- **Rocket Model** - Bouncing animation, clickable
- **Diamond Model** - Glowing core, rotation animation
- **Portal Model** - Rotating rings with orbiting cubes
- **2D Widgets** - Gear, Trophy, Chart with animations

### Visual Effects
- **Particle trail** following cursor
- **Button particle bursts** on hover
- **Scroll reveal** animations with particles
- **Card shine effects** on hover
- **Floating background cubes** (25+ objects)
- **Click shockwave** effect on background

### Sound System
- **Button sounds** (hover/click)
- **Navigation sounds** (whoosh transitions)
- **Success/error chords**
- **Model interaction sounds**
- **Form input feedback**
- **Mute toggle** button

---

## 📁 Project Structure

```
skillsphere/
├── app/
│   ├── models/              # Data models (legacy SQLAlchemy)
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── auth_firebase.py # Firebase auth routes (NEW)
│   │   ├── skills.py        # Skill management
│   │   ├── portfolio.py     # Portfolio features
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── firebase_db.py   # Firebase database wrapper (NEW)
│   │   ├── firebase_auth_service.py  # Firebase auth (NEW)
│   │   ├── ai_service.py    # AI integrations
│   │   └── ...
│   ├── static/              # Frontend assets
│   │   ├── css/
│   │   │   └── roblox_3d.css   # Authentic Roblox theme
│   │   └── js/
│   │       ├── cursor_effects.js    # Custom cursor (NEW)
│   │       ├── particle_system.js   # Particle effects (NEW)
│   │       ├── sound_effects.js     # Sound system (NEW)
│   │       ├── roblox_models.js     # 3D models
│   │       └── three_bg.js          # 3D background
│   ├── templates/           # HTML templates
│   └── main.py              # Application entry
├── FIREBASE_MIGRATION_GUIDE.md  # Firebase setup guide
├── FIREBASE_SETUP_QUICK.md      # Quick start guide
├── ROBLOX_3D_FEATURES.md        # Theme documentation
├── CUSTOM_CURSOR_GUIDE.md       # Cursor implementation
└── requirements.txt
```

---

## 🌐 API Endpoints

### Authentication (Firebase)
```bash
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login with Firebase token
POST   /api/auth/sync-user       # Sync OAuth user
GET    /api/auth/me              # Get current user
PUT    /api/auth/profile         # Update profile
POST   /api/auth/logout          # Logout
GET    /api/auth/config          # Get Firebase config
DELETE /api/auth/account         # Delete account
```

### Skills
```bash
GET    /api/skills               # List all skills
POST   /api/skills               # Create skill
GET    /api/skills/{id}          # Get skill details
PUT    /api/skills/{id}          # Update skill
DELETE /api/skills/{id}          # Delete skill
```

### User Skills
```bash
GET    /api/user-skills          # Get user's skills
POST   /api/user-skills          # Add skill to user
PUT    /api/user-skills/{id}     # Update proficiency
DELETE /api/user-skills/{id}     # Remove skill
```

### Gap Analysis
```bash
POST   /api/gap-analysis         # Analyze skill gaps
POST   /api/gap-analysis/recommendations  # Get recommendations
```

### Market Intelligence
```bash
GET    /api/market/trends        # Get skill trends
GET    /api/market/demand        # Get demand metrics
GET    /api/market/salaries      # Get salary data
```

---

## 🔧 Configuration

### Environment Variables

```env
# Firebase (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Local Development
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Production (Render)
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# AI Features (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Application
SECRET_KEY=your-secret-key
```

---

## 🚀 Deployment

### Render Deployment

1. **Create Web Service** on Render
2. **Connect GitHub** repository
3. **Set Environment Variables**:
   - All Firebase credentials
   - GEMINI_API_KEY
   - SECRET_KEY

4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**No database service needed!** Firebase handles everything.

### Vercel Deployment (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📚 Documentation

- **[Firebase Migration Guide](FIREBASE_MIGRATION_GUIDE.md)** - Complete migration documentation
- **[Firebase Quick Setup](FIREBASE_SETUP_QUICK.md)** - Fast setup guide
- **[Roblox 3D Features](ROBLOX_3D_FEATURES.md)** - Theme documentation
- **[Custom Cursor Guide](CUSTOM_CURSOR_GUIDE.md)** - Cursor implementation
- **[Theme Comparison](THEME_COMPARISON.md)** - Before/after visual guide

---

## 🎨 Customization

### Change Primary Color
```css
/* In roblox_3d.css */
--primary: #00b06f;  /* Roblox Green - change to your color */
```

### Adjust Particle Count
```javascript
// In particle_system.js
this.maxParticles = 50;  // Reduce for better performance
```

### Modify 3D Block Count
```javascript
// In three_bg.js
const blockCount = 25;  // Adjust background complexity
```

### Change Cursor Style
```css
/* In roblox_3d.css */
.custom-cursor-core {
    /* Modify cursor appearance */
}
```

---

## 🧪 Testing

```bash
# Run tests (if available)
pytest

# Test Firebase connection
python -c "from app.services.firebase_db import FirebaseDB; FirebaseDB.initialize()"

# Test user creation
python -c "
from app.services.firebase_db import UserDB
user = UserDB.create({'name': 'Test', 'email': 'test@test.com'})
print(user)
"
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Firebase** - Cloud infrastructure
- **Three.js** - 3D graphics
- **Roblox** - Design inspiration
- **FastAPI** - Web framework
- **Google Gemini** - AI capabilities

---

## 📞 Contact

- **GitHub**: [@vinaysurale](https://github.com/vinaysurale)
- **Project**: [SkillSphere AI](https://github.com/vinaysurale/skillsphere)

---

## 🎯 Features Roadmap

- [x] Firebase Realtime Database integration
- [x] Firebase Authentication
- [x] Authentic Roblox 3D theme
- [x] Custom cursor with animations
- [x] 7 interactive 3D models
- [x] Particle effects system
- [x] Sound effects system
- [ ] Mobile responsive improvements
- [ ] Progressive Web App (PWA)
- [ ] Dark mode toggle
- [ ] More OAuth providers
- [ ] Skill certification system
- [ ] Team collaboration features
- [ ] Analytics dashboard

---

**Built with ❤️ and 3D magic** 🎮✨
