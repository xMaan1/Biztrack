"""
Backend Application Runner
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print("=" * 60)
    print(f"Starting {settings.APP_NAME} Backend")
    print(f"Server: http://{settings.HOST}:{settings.PORT}")
    print(f"API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"Environment: {settings.ENVIRONMENT}")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
