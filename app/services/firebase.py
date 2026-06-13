import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

logger = logging.getLogger(__name__)

firebase_app = None

def initialize_firebase():
    global firebase_app
    if firebase_app is not None:
        return firebase_app

    # Check if Firebase was already initialized by another module (e.g., firebase_db.py)
    if firebase_admin._apps:
        firebase_app = firebase_admin.get_app()
        logger.info("Firebase Admin SDK already initialized by another module, reusing.")
        return firebase_app

    # Try to initialize Firebase
    try:
        # Option 1: Firebase credentials JSON string from env
        if settings.FIREBASE_CREDENTIALS_JSON:
            try:
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)
                firebase_app = firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized using FIREBASE_CREDENTIALS_JSON.")
                return firebase_app
            except Exception as e:
                logger.error(f"Failed to initialize Firebase from JSON string: {e}")

        # Option 2: Path to service account file
        if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                firebase_app = firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK initialized using file: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
                return firebase_app
            else:
                logger.warning(f"Firebase service account file not found at: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")

        # Option 3: Default initialization (e.g. if running in GCP environment with Application Default Credentials)
        try:
            firebase_app = firebase_admin.initialize_app()
            logger.info("Firebase Admin SDK initialized using default credentials.")
            return firebase_app
        except Exception:
            pass

        logger.warning("Firebase Admin SDK is not initialized. Firebase features will be disabled or fail. Please configure Firebase settings in .env.")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin SDK: {e}")
    
    return None

# Attempt initialization on import
initialize_firebase()

def verify_firebase_token(token: str) -> dict | None:
    """Verify a Firebase ID token and return its decoded claims."""
    # Ensure initialized
    initialize_firebase()
    if not firebase_admin._apps:
        logger.error("Cannot verify token: Firebase Admin SDK is not initialized.")
        return None
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        return None
