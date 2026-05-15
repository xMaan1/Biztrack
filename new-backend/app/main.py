from fastapi import FastAPI

from app.api.routes import api_router
from app.config import settings
from app.logging_config import configure_logging

configure_logging(settings.log_level)

app = FastAPI(title="Biztrack API")
app.include_router(api_router, prefix="/api/v1")
