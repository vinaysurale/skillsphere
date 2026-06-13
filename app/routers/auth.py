from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.services.firebase import verify_firebase_token


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─── Schemas ──────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    college: str | None = None
    degree: str | None = None
    graduation_year: int | None = None
    career_goal: str | None = None
    experience_level: str | None = None


# ─── Helpers ──────────────────────────────────────────────────────────

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract and validate the current user from the JWT cookie or header."""
    # Check both cookie names (access_token for local JWT, firebase_token for Firebase)
    token = request.cookies.get("access_token") or request.cookies.get("firebase_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 1. Try Firebase Auth Verification first
    firebase_payload = verify_firebase_token(token)
    if firebase_payload:
        email = firebase_payload.get("email")
        if email:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Auto-register Firebase user in local SQLite DB
                user = User(
                    name=firebase_payload.get("name", email.split("@")[0]),
                    email=email,
                    auth_provider="firebase",
                    avatar_url=firebase_payload.get("picture", "")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user

    # 2. Fallback to Local JWT Auth
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user



# ─── Routes ───────────────────────────────────────────────────────────

@router.post("/signup")
def signup(data: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        auth_provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create token and set cookie
    token = create_access_token({"sub": user.id})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
    )

    return {"message": "Account created successfully", "user": user.to_dict(), "token": token}


@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return {"message": "Login successful", "user": user.to_dict(), "token": token}


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return {"user": user.to_dict()}


@router.put("/profile")
def update_profile(
    data: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile fields."""
    if data.name is not None:
        user.name = data.name
    if data.college is not None:
        user.college = data.college
    if data.degree is not None:
        user.degree = data.degree
    if data.graduation_year is not None:
        user.graduation_year = data.graduation_year
    if data.career_goal is not None:
        user.career_goal = data.career_goal
    if data.experience_level is not None:
        user.experience_level = data.experience_level

    db.commit()
    db.refresh(user)

    return {"message": "Profile updated", "user": user.to_dict()}


@router.post("/logout")
def logout(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}


@router.get("/config")
def get_firebase_config():
    """Retrieve public Firebase client configuration."""
    from app.config import settings
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
    }

