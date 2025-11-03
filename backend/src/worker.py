import asyncio
import logging
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)

class BackgroundWorker:
    def __init__(self):
        self.tasks: List[asyncio.Task] = []
        self.running = False
    
    async def start(self):
        self.running = True
        logger.info("Background worker started")
        
        while self.running:
            try:
                await self._process_tasks()
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in background worker: {str(e)}")
                await asyncio.sleep(60)
    
    async def _process_tasks(self):
        from .application.services import (
            EmailService,
            NotificationService,
            InventorySyncService
        )
        
        try:
            logger.info(f"Processing background tasks at {datetime.utcnow()}")
            
        except Exception as e:
            logger.error(f"Error processing background tasks: {str(e)}")
    
    async def stop(self):
        self.running = False
        logger.info("Background worker stopped")

worker = BackgroundWorker()

async def run_worker():
    await worker.start()

if __name__ == "__main__":
    asyncio.run(run_worker())

