from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .presentation.public_routers import router as public_router

app = FastAPI(
    title="BizTrack - Public API",
    version="1.0.0",
    description="Public endpoints for BizTrack"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router)

@app.get("/")
def read_root():
    return {
        "message": "BizTrack - Public API",
        "status": "running",
        "endpoints": {
            "plans": "/public/plans"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "BizTrack Public API"}

