import asyncio
import logging
from datetime import datetime, timedelta
from typing import Callable, Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ScheduledTask:
    def __init__(
        self,
        name: str,
        func: Callable,
        interval: Optional[timedelta] = None,
        cron: Optional[str] = None,
        run_on_startup: bool = False
    ):
        self.name = name
        self.func = func
        self.interval = interval
        self.cron = cron
        self.run_on_startup = run_on_startup
        self.status = TaskStatus.PENDING
        self.last_run: Optional[datetime] = None
        self.next_run: Optional[datetime] = None
        self.run_count = 0
        self.error_count = 0
    
    async def execute(self):
        self.status = TaskStatus.RUNNING
        self.last_run = datetime.utcnow()
        
        try:
            if asyncio.iscoroutinefunction(self.func):
                await self.func()
            else:
                self.func()
            
            self.status = TaskStatus.COMPLETED
            self.run_count += 1
            
            if self.interval:
                self.next_run = datetime.utcnow() + self.interval
            
            logger.info(f"Task '{self.name}' completed successfully")
            
        except Exception as e:
            self.status = TaskStatus.FAILED
            self.error_count += 1
            logger.error(f"Task '{self.name}' failed: {str(e)}")
            raise

class TaskScheduler:
    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.running = False
        self._scheduler_task: Optional[asyncio.Task] = None
    
    def register_task(
        self,
        name: str,
        func: Callable,
        interval: Optional[timedelta] = None,
        cron: Optional[str] = None,
        run_on_startup: bool = False
    ):
        task = ScheduledTask(
            name=name,
            func=func,
            interval=interval,
            cron=cron,
            run_on_startup=run_on_startup
        )
        
        if task.run_on_startup:
            task.next_run = datetime.utcnow()
        elif interval:
            task.next_run = datetime.utcnow() + interval
        
        self.tasks[name] = task
        logger.info(f"Registered scheduled task: {name}")
    
    async def start(self):
        self.running = True
        self._scheduler_task = asyncio.create_task(self._run_scheduler())
        logger.info("Task scheduler started")
    
    async def stop(self):
        self.running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("Task scheduler stopped")
    
    async def _run_scheduler(self):
        while self.running:
            try:
                now = datetime.utcnow()
                
                for task in self.tasks.values():
                    if task.status == TaskStatus.RUNNING:
                        continue
                    
                    if task.next_run and now >= task.next_run:
                        asyncio.create_task(task.execute())
                
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"Error in scheduler loop: {str(e)}")
                await asyncio.sleep(10)
    
    def get_task_status(self, name: str) -> Optional[Dict[str, Any]]:
        task = self.tasks.get(name)
        if not task:
            return None
        
        return {
            "name": task.name,
            "status": task.status.value,
            "last_run": task.last_run.isoformat() if task.last_run else None,
            "next_run": task.next_run.isoformat() if task.next_run else None,
            "run_count": task.run_count,
            "error_count": task.error_count
        }
    
    def get_all_tasks_status(self) -> Dict[str, Dict[str, Any]]:
        return {
            name: self.get_task_status(name)
            for name in self.tasks.keys()
        }

scheduler = TaskScheduler()

