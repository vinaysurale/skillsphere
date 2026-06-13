"""
Firebase Realtime Database Service
Replaces SQLAlchemy for data persistence
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
import firebase_admin
from firebase_admin import credentials, db, auth
from app.config import settings
import json
import os


class FirebaseDB:
    """Firebase Realtime Database wrapper"""
    
    _initialized = False
    _db_ref = None
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        if cls._initialized:
            return
        
        try:
            # Try to initialize with service account
            if settings.FIREBASE_SERVICE_ACCOUNT_PATH and os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            elif settings.FIREBASE_CREDENTIALS_JSON:
                # Parse JSON string from environment variable
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)
            else:
                # Use default credentials (for local development)
                cred = credentials.ApplicationDefault()
            
            # Initialize with database URL
            database_url = f"https://{settings.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com"
            
            firebase_admin.initialize_app(cred, {
                'databaseURL': database_url
            })
            
            cls._db_ref = db.reference()
            cls._initialized = True
            print(f"✅ Firebase initialized with database: {database_url}")
            
        except Exception as e:
            print(f"❌ Firebase initialization error: {e}")
            # Initialize without credentials for development
            try:
                firebase_admin.initialize_app()
                cls._initialized = True
                print("⚠️ Firebase initialized without credentials (limited functionality)")
            except:
                print("❌ Could not initialize Firebase")
    
    @classmethod
    def get_ref(cls, path: str = ""):
        """Get database reference for a path"""
        cls.initialize()
        if path:
            return db.reference(path)
        return db.reference()


# ─── User Operations ──────────────────────────────────────────────────

class UserDB:
    """User data operations with Firebase"""
    
    @staticmethod
    def create(user_data: dict) -> dict:
        """Create a new user"""
        user_id = user_data.get('id') or str(uuid.uuid4())
        user_data['id'] = user_id
        user_data['created_at'] = datetime.utcnow().isoformat()
        user_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Set default values
        user_data.setdefault('college', '')
        user_data.setdefault('degree', '')
        user_data.setdefault('career_goal', '')
        user_data.setdefault('experience_level', 'Beginner')
        user_data.setdefault('auth_provider', 'local')
        user_data.setdefault('avatar_url', '')
        
        # Save to Firebase
        ref = FirebaseDB.get_ref(f'users/{user_id}')
        ref.set(user_data)
        
        return user_data
    
    @staticmethod
    def get_by_id(user_id: str) -> Optional[dict]:
        """Get user by ID"""
        ref = FirebaseDB.get_ref(f'users/{user_id}')
        return ref.get()
    
    @staticmethod
    def get_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        ref = FirebaseDB.get_ref('users')
        users = ref.order_by_child('email').equal_to(email).get()
        
        if users:
            # Return first match
            user_id = list(users.keys())[0]
            user_data = users[user_id]
            user_data['id'] = user_id
            return user_data
        return None
    
    @staticmethod
    def update(user_id: str, update_data: dict) -> dict:
        """Update user data"""
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        ref = FirebaseDB.get_ref(f'users/{user_id}')
        ref.update(update_data)
        
        return UserDB.get_by_id(user_id)
    
    @staticmethod
    def delete(user_id: str) -> bool:
        """Delete user"""
        ref = FirebaseDB.get_ref(f'users/{user_id}')
        ref.delete()
        
        # Also delete user's skills
        skills_ref = FirebaseDB.get_ref(f'user_skills/{user_id}')
        skills_ref.delete()
        
        return True
    
    @staticmethod
    def list_all(limit: int = 100) -> List[dict]:
        """List all users"""
        ref = FirebaseDB.get_ref('users')
        users_dict = ref.limit_to_first(limit).get() or {}
        
        users = []
        for user_id, user_data in users_dict.items():
            user_data['id'] = user_id
            users.append(user_data)
        
        return users


# ─── Skill Operations ─────────────────────────────────────────────────

class SkillDB:
    """Skill data operations with Firebase"""
    
    @staticmethod
    def create(skill_data: dict) -> dict:
        """Create a new skill"""
        skill_id = skill_data.get('id') or str(uuid.uuid4())
        skill_data['id'] = skill_id
        
        # Set defaults
        skill_data.setdefault('demand_score', 50.0)
        skill_data.setdefault('growth_score', 50.0)
        skill_data.setdefault('avg_salary', 0.0)
        skill_data.setdefault('description', '')
        skill_data.setdefault('icon', '💡')
        
        ref = FirebaseDB.get_ref(f'skills/{skill_id}')
        ref.set(skill_data)
        
        return skill_data
    
    @staticmethod
    def get_by_id(skill_id: str) -> Optional[dict]:
        """Get skill by ID"""
        ref = FirebaseDB.get_ref(f'skills/{skill_id}')
        skill = ref.get()
        if skill:
            skill['id'] = skill_id
        return skill
    
    @staticmethod
    def get_by_name(name: str) -> Optional[dict]:
        """Get skill by name"""
        ref = FirebaseDB.get_ref('skills')
        skills = ref.order_by_child('name').equal_to(name).get()
        
        if skills:
            skill_id = list(skills.keys())[0]
            skill_data = skills[skill_id]
            skill_data['id'] = skill_id
            return skill_data
        return None
    
    @staticmethod
    def list_all(category: Optional[str] = None) -> List[dict]:
        """List all skills, optionally filtered by category"""
        ref = FirebaseDB.get_ref('skills')
        
        if category:
            skills_dict = ref.order_by_child('category').equal_to(category).get() or {}
        else:
            skills_dict = ref.get() or {}
        
        skills = []
        for skill_id, skill_data in skills_dict.items():
            skill_data['id'] = skill_id
            skills.append(skill_data)
        
        return skills
    
    @staticmethod
    def update(skill_id: str, update_data: dict) -> dict:
        """Update skill"""
        ref = FirebaseDB.get_ref(f'skills/{skill_id}')
        ref.update(update_data)
        return SkillDB.get_by_id(skill_id)
    
    @staticmethod
    def delete(skill_id: str) -> bool:
        """Delete skill"""
        ref = FirebaseDB.get_ref(f'skills/{skill_id}')
        ref.delete()
        return True


# ─── User Skill Operations ────────────────────────────────────────────

class UserSkillDB:
    """User-Skill relationship operations"""
    
    @staticmethod
    def add_skill(user_id: str, skill_id: str, proficiency: float = 50.0, verified: bool = False) -> dict:
        """Add skill to user"""
        user_skill_data = {
            'user_id': user_id,
            'skill_id': skill_id,
            'proficiency': proficiency,
            'verified': verified,
            'added_at': datetime.utcnow().isoformat()
        }
        
        ref = FirebaseDB.get_ref(f'user_skills/{user_id}/{skill_id}')
        ref.set(user_skill_data)
        
        return user_skill_data
    
    @staticmethod
    def get_user_skills(user_id: str) -> List[dict]:
        """Get all skills for a user"""
        ref = FirebaseDB.get_ref(f'user_skills/{user_id}')
        skills_dict = ref.get() or {}
        
        skills = []
        for skill_id, skill_data in skills_dict.items():
            # Fetch skill details
            skill_details = SkillDB.get_by_id(skill_id)
            skill_data['skill'] = skill_details
            skills.append(skill_data)
        
        return skills
    
    @staticmethod
    def update_proficiency(user_id: str, skill_id: str, proficiency: float) -> dict:
        """Update skill proficiency"""
        ref = FirebaseDB.get_ref(f'user_skills/{user_id}/{skill_id}')
        ref.update({'proficiency': proficiency})
        
        return ref.get()
    
    @staticmethod
    def remove_skill(user_id: str, skill_id: str) -> bool:
        """Remove skill from user"""
        ref = FirebaseDB.get_ref(f'user_skills/{user_id}/{skill_id}')
        ref.delete()
        return True
    
    @staticmethod
    def verify_skill(user_id: str, skill_id: str, verified: bool = True) -> dict:
        """Verify or unverify a skill"""
        ref = FirebaseDB.get_ref(f'user_skills/{user_id}/{skill_id}')
        ref.update({'verified': verified})
        return ref.get()


# ─── Career Path Operations ───────────────────────────────────────────

class CareerPathDB:
    """Career path operations"""
    
    @staticmethod
    def create(career_data: dict) -> dict:
        """Create career path"""
        career_id = career_data.get('id') or str(uuid.uuid4())
        career_data['id'] = career_id
        
        career_data.setdefault('description', '')
        career_data.setdefault('avg_salary', 0.0)
        career_data.setdefault('demand_level', 'High')
        career_data.setdefault('icon', '🎯')
        
        ref = FirebaseDB.get_ref(f'career_paths/{career_id}')
        ref.set(career_data)
        
        return career_data
    
    @staticmethod
    def get_by_id(career_id: str) -> Optional[dict]:
        """Get career path by ID"""
        ref = FirebaseDB.get_ref(f'career_paths/{career_id}')
        career = ref.get()
        if career:
            career['id'] = career_id
            # Get required skills
            career['required_skills'] = CareerPathDB.get_required_skills(career_id)
        return career
    
    @staticmethod
    def list_all() -> List[dict]:
        """List all career paths"""
        ref = FirebaseDB.get_ref('career_paths')
        careers_dict = ref.get() or {}
        
        careers = []
        for career_id, career_data in careers_dict.items():
            career_data['id'] = career_id
            career_data['required_skills'] = CareerPathDB.get_required_skills(career_id)
            careers.append(career_data)
        
        return careers
    
    @staticmethod
    def add_required_skill(career_id: str, skill_id: str, importance: str = "Required") -> dict:
        """Add required skill to career path"""
        skill_data = {
            'skill_id': skill_id,
            'importance': importance
        }
        
        ref = FirebaseDB.get_ref(f'career_path_skills/{career_id}/{skill_id}')
        ref.set(skill_data)
        
        return skill_data
    
    @staticmethod
    def get_required_skills(career_id: str) -> List[dict]:
        """Get required skills for career path"""
        ref = FirebaseDB.get_ref(f'career_path_skills/{career_id}')
        skills_dict = ref.get() or {}
        
        skills = []
        for skill_id, skill_data in skills_dict.items():
            skill_details = SkillDB.get_by_id(skill_id)
            skill_data['skill'] = skill_details
            skills.append(skill_data)
        
        return skills


# Initialize Firebase on module import
FirebaseDB.initialize()
