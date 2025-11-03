import time
from fastapi import Request
import logging

from ...core.audit import audit_logger

logger = logging.getLogger(__name__)

class AuditMiddleware:
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            processing_time = time.time() - start_time
            
            user_id = None
            tenant_id = None
            
            if hasattr(request.state, 'user'):
                user_id = str(request.state.user.id)
            
            tenant_id = request.headers.get("X-Tenant-ID")
            
            try:
                audit_logger.log_http_request(
                    request=request,
                    response=response,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    processing_time=processing_time
                )
            except Exception as e:
                logger.error(f"Audit logging failed: {str(e)}")
            
            return response
            
        except Exception as e:
            logger.error(f"Audit middleware error: {str(e)}")
            raise

audit_middleware = AuditMiddleware()

