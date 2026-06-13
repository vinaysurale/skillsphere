"""
Firebase-based Authentication Router
Replaces SQLAlchemy auth with Firebase Auth + Realtime Database
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Response
from pydantic import BaseModel, EmailStr
from typing import Optional
from firebase_admin import auth
from app.services.firebase_auth_service import FirebaseAuthService
from app.services.firebase_db import UserDB

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─── Schemas ──────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    college: Optional[str] = ""
    degree: Optional[str] = ""


class FirebaseLoginRequest(BaseModel):
    """Client sends Firebase ID token after client-side authentication"""
    id_token: str


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    career_goal: Optional[str] = None
    experience_level: Optional[str] = None


class FirebaseSyncRequest(BaseModel):
    """Sync OAuth user from client-side Firebase Auth"""
    uid: str
    email: str
    name: Optional[str] = None
    photoURL: Optional[str] = None
    providerId: Optional[str] = "firebase"


# ─── Helpers ──────────────────────────────────────────────────────────

def get_firebase_token(request: Request) -> Optional[str]:
    """Extract Firebase ID token from cookie or Authorization header"""
    # Try cookie first
    token = request.cookies.get("firebase_token")
    if token:
        return token
    
    # Try Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    return None


def get_current_user(request: Request) -> dict:
    """
    Extract and validate current user from Firebase ID token.
    Supports both cookie and Authorization header.
    """
    token = get_firebase_token(request)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please provide Firebase ID token."
        )
    
    try:
        user_data = FirebaseAuthService.get_user_from_token(token)
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


# ─── Routes ───────────────────────────────────────────────────────────

@router.post("/signup")
def signup(data: SignupRequest, response: Response):
    """
    Register a new user with Firebase Authentication.
    Creates user in Firebase Auth and Realtime Database.
    """
    try:
        result = FirebaseAuthService.create_user(
            email=data.email,
            password=data.password,
            name=data.name
        )
        
        # Update additional profile fields
        if data.college or data.degree:
            update_data = {}
            if data.college:
                update_data['college'] = data.college
            if data.degree:
                update_data['degree'] = data.degree
            
            UserDB.update(result['uid'], update_data)
            result['user'] = UserDB.get_by_id(result['uid'])
        
        # Set cookie with custom token
        response.set_cookie(
            key="firebase_token",
            value=result['firebase_token'],
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,  # 7 days
        )
        
        return {
            "message": "Account created successfully",
            "user": result['user'],
            "firebase_token": result['firebase_token'],
            "uid": result['uid']
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
def login(data: FirebaseLoginRequest, response: Response):
    """
    Verify Firebase ID token and authenticate user.
    Client must perform Firebase Auth sign-in first, then send ID token here.
    """
    try:
        user_data = FirebaseAuthService.get_user_from_token(data.id_token)
        
        # Set cookie with ID token
        response.set_cookie(
            key="firebase_token",
            value=data.id_token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60,  # 1 hour (Firebase tokens expire after 1 hour)
        )
        
        return {
            "message": "Login successful",
            "user": user_data
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/sync-user")
def sync_oauth_user(data: FirebaseSyncRequest, response: Response):
    """
    Sync OAuth user from client-side Firebase Auth to database.
    Called after Google/GitHub/Facebook sign-in on client.
    """
    try:
        firebase_user_data = {
            'uid': data.uid,
            'email': data.email,
            'name': data.name,
            'photoURL': data.photoURL,
            'providerId': data.providerId
        }
        
        user = FirebaseAuthService.sync_oauth_user(firebase_user_data)
        
        # Generate custom token for this user
        custom_token = FirebaseAuthService.create_custom_token(data.uid)
        
        # Set cookie
        response.set_cookie(
            key="firebase_token",
            value=custom_token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,
        )
        
        return {
            "message": "User synced successfully",
            "user": user,
            "firebase_token": custom_token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )


@router.get("/me")
def get_me(request: Request, response: Response):
    """Get the current authenticated user profile. Auto-creates user if doesn't exist."""
    token = get_firebase_token(request)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please provide Firebase ID token."
        )
    
    try:
        # Verify token
        decoded_token = FirebaseAuthService.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Try to get user from database
        user = UserDB.get_by_id(uid)
        
        # If user doesn't exist, create them from Firebase Auth data
        if not user:
            firebase_user = auth.get_user(uid)
            user_data = {
                'id': uid,
                'email': firebase_user.email,
                'name': firebase_user.display_name or firebase_user.email.split('@')[0],
                'auth_provider': 'firebase',
                'avatar_url': firebase_user.photo_url or ''
            }
            user = UserDB.create(user_data)
        
        # Set cookie if using header auth
        if not request.cookies.get("firebase_token"):
            response.set_cookie(
                key="firebase_token",
                value=token,
                httponly=True,
                samesite="lax",
                max_age=60 * 60,
            )
        
        return {"user": user}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


@router.put("/profile")
def update_profile(data: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile fields in Firebase Realtime Database."""
    try:
        update_data = {}
        
        if data.name is not None:
            update_data['name'] = data.name
        if data.college is not None:
            update_data['college'] = data.college
        if data.degree is not None:
            update_data['degree'] = data.degree
        if data.graduation_year is not None:
            update_data['graduation_year'] = data.graduation_year
        if data.career_goal is not None:
            update_data['career_goal'] = data.career_goal
        if data.experience_level is not None:
            update_data['experience_level'] = data.experience_level
        
        updated_user = FirebaseAuthService.update_user(user['id'], update_data)
        
        return {
            "message": "Profile updated successfully",
            "user": updated_user
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )


@router.post("/logout")
def logout(response: Response):
    """Clear the Firebase auth cookie."""
    response.delete_cookie("firebase_token")
    return {"message": "Logged out successfully"}


@router.get("/config")
def get_firebase_config():
    """
    Get Firebase client configuration for frontend.
    Required for initializing Firebase Auth on client-side.
    """
    from app.config import settings
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
        "databaseURL": f"https://{settings.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com"
    }


@router.delete("/account")
def delete_account(user: dict = Depends(get_current_user), response: Response):
    """Delete user account from Firebase Auth and database."""
    try:
        FirebaseAuthService.delete_user(user['id'])
        response.delete_cookie("firebase_token")
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )
