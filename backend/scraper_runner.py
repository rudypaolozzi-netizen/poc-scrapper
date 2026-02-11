import asyncio
import uuid
import logging
from dataclasses import dataclass
from typing import Dict, Any, Optional
import json

# Import the existing scraper
from maps_scraper import run_scraper

logger = logging.getLogger(__name__)

@dataclass
class ScraperTask:
    id: str
    params: Dict[str, Any]
    status: str
    queue: asyncio.Queue
    task: Optional[asyncio.Task] = None

# Store tasks in memory
TASKS: Dict[str, ScraperTask] = {}
CURRENT_TASK_ID: Optional[str] = None

class Args:
    def __init__(self, **kwargs):
        self.sector = kwargs.get("sector")
        self.city = kwargs.get("city")
        self.limit = int(kwargs.get("limit", 10))
        self.source = kwargs.get("source", "maps")

async def start_scraping_task(params: dict):
    global CURRENT_TASK_ID
    
    # Check if a task is already running
    if CURRENT_TASK_ID and CURRENT_TASK_ID in TASKS:
        task = TASKS[CURRENT_TASK_ID]
        if task.status == "running":
            raise ValueError("A task is already running")

    task_id = str(uuid.uuid4())
    queue = asyncio.Queue()
    
    # Create task object
    scraper_task = ScraperTask(
        id=task_id,
        params=params,
        status="running",
        queue=queue
    )
    TASKS[task_id] = scraper_task
    CURRENT_TASK_ID = task_id
    
    # Wrap in asyncio task
    async def task_wrapper():
        try:
            args = Args(**params)
            await run_scraper(args, queue)
            scraper_task.status = "completed"
        except asyncio.CancelledError:
            scraper_task.status = "stopped"
            await queue.put({"type": "error", "data": {"message": "Scraping stopped by user"}})
        except Exception as e:
            scraper_task.status = "error"
            await queue.put({"type": "error", "data": {"message": str(e)}})
            logger.error(f"Task {task_id} failed: {e}")
        finally:
             if TASKS.get(CURRENT_TASK_ID) == scraper_task:
                 pass # Keep current task ID until explicitly cleared or overwritten? 
                 # Actually single task constraint usually implies blocking start.
                 # But checking logic above handles "if status == running".
                 pass
    
    scraper_task.task = asyncio.create_task(task_wrapper())
    return task_id

async def stop_scraping_task(task_id: str):
    if task_id in TASKS:
        task = TASKS[task_id]
        if task.task and not task.task.done():
            task.task.cancel()
            try:
                await task.task
            except asyncio.CancelledError:
                pass
            task.status = "stopped"
            return True
    return False

def get_task(task_id: str):
    return TASKS.get(task_id)
