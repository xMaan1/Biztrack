import os
import base64
import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

def get_encryption_key() -> bytes:
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set")
    
    if len(encryption_key) < 32:
        raise ValueError("ENCRYPTION_KEY must be at least 32 characters long")
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'oauth_token_salt',
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(encryption_key.encode()))
    return key

def encrypt_token_data(token_data: dict) -> str:
    try:
        key = get_encryption_key()
        f = Fernet(key)
        token_json = json.dumps(token_data)
        encrypted_data = f.encrypt(token_json.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    except Exception as e:
        logger.error(f"Failed to encrypt token data: {e}")
        raise

def decrypt_token_data(encrypted_data: str) -> dict:
    try:
        key = get_encryption_key()
        f = Fernet(key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_bytes = f.decrypt(encrypted_bytes)
        return json.loads(decrypted_bytes.decode())
    except Exception as e:
        logger.error(f"Failed to decrypt token data: {e}")
        raise

