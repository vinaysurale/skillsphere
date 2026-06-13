"""
Firebase Authentication Service
Replaces JWT-based auth with Firebase Auth
"""
from typing import Optional, Dict
from firebase_admin import auth
from fastapi import HTTPException, status
from app.services.firebase_db import UserDB
import re


class FirebaseAuthService:
    """Firebase Authentication wrapper"""
    
    @staticmethod
    def create_user(email: str, password: str, name: str) -> dict:
        """Create a new user with Firebase Auth"""
        try:
            # Validate email
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid email format"
                )
            
            # Create Firebase Auth user
            firebase_user = auth.create_user(
                email=email,
                password=password,
                display_name=name,
                email_verified=False
            )
            
            # Create user profile in database
            user_data = {
                'id': firebase_user.uid,
                'email': email,
                'name': name,
                'auth_provider': 'firebase',
                'avatar_url': firebase_user.photo_url or ''
            }
            
            UserDB.create(user_data)
            
            # Generate custom token
            custom_token = auth.create_custom_token(firebase_user.uid)
            
            return {
                'user': user_data,
                'firebase_token': custom_token.decode('utf-8'),
                'uid': firebase_user.uid
            }
            
        except auth.EmailAlreadyExistsError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}"
            )
    
    @staticmethod
    def verify_id_token(id_token: str) -> dict:
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.InvalidIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        except auth.ExpiredIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token expired"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}"
            )
    
    @staticmethod
    def get_user_from_token(id_token: str) -> dict:
        """Get user data from Firebase token"""
        decoded_token = FirebaseAuthService.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get user from database
        user = UserDB.get_by_id(uid)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    def update_user(uid: str, update_data: dict) -> dict:
        """Update Firebase Auth user"""
        try:
            # Update Firebase Auth profile
            auth_updates = {}
            if 'name' in update_data:
                auth_updates['display_name'] = update_data['name']
            if 'avatar_url' in update_data:
                auth_updates['photo_url'] = update_data['avatar_url']
            
            if auth_updates:
                auth.update_user(uid, **auth_updates)
            
            # Update database profile
            UserDB.update(uid, update_data)
            
            return UserDB.get_by_id(uid)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user: {str(e)}"
            )
    
    @staticmethod
    def delete_user(uid: str) -> bool:
        """Delete user from Firebase Auth and database"""
        try:
            # Delete from Firebase Auth
            auth.delete_user(uid)
            
            # Delete from database
            UserDB.delete(uid)
            
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user: {str(e)}"
            )
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email from Firebase Auth"""
        try:
            firebase_user = auth.get_user_by_email(email)
            user_data = UserDB.get_by_id(firebase_user.uid)
            return user_data
        except auth.UserNotFoundError:
            return None
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user: {str(e)}"
            )
    
    @staticmethod
    def create_custom_token(uid: str) -> str:
        """Create custom token for user"""
        try:
            custom_token = auth.create_custom_token(uid)
            return custom_token.decode('utf-8')
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create token: {str(e)}"
            )
    
    @staticmethod
    def verify_password_reset_token(token: str) -> str:
        """Verify password reset token and return email"""
        # Firebase handles password reset via email links
        # This is managed client-side with Firebase Auth SDK
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Password reset is handled client-side with Firebase Auth SDK"
        )
    
    @staticmethod
    def set_custom_claims(uid: str, claims: dict) -> bool:
        """Set custom claims for user (e.g., admin role)"""
        try:
            auth.set_custom_user_claims(uid, claims)
            return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to set custom claims: {str(e)}"
            )
    
    @staticmethod
    def sync_oauth_user(firebase_user_data: dict) -> dict:
        """Sync OAuth user from Firebase to database"""
        uid = firebase_user_data.get('uid')
        email = firebase_user_data.get('email')
        name = firebase_user_data.get('name') or firebase_user_data.get('displayName', 'User')
        avatar = firebase_user_data.get('photoURL', '')
        provider = firebase_user_data.get('providerId', 'firebase')
        
        # Check if user exists
        user = UserDB.get_by_id(uid)
        
        if not user:
            # Create new user
            user_data = {
                'id': uid,
                'email': email,
                'name': name,
                'auth_provider': provider,
                'avatar_url': avatar
            }
            user = UserDB.create(user_data)
        else:
            # Update existing user
            update_data = {
                'name': name,
                'avatar_url': avatar
            }
            user = UserDB.update(uid, update_data)
        
        return user
