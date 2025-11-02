import os
from dotenv import load_dotenv

load_dotenv()

class ConnectionSettings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    POOL_SIZE = int(os.getenv("POOL_SIZE", "20"))
    MAX_OVERFLOW = int(os.getenv("MAX_OVERFLOW", "30"))
    POOL_PRE_PING = os.getenv("POOL_PRE_PING", "True").lower() == "true"
    POOL_RECYCLE = int(os.getenv("POOL_RECYCLE", "3600"))
    ECHO = os.getenv("ECHO", "False").lower() == "true"

