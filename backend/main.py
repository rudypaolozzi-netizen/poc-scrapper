from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import os
import scraper_runner

app = FastAPI(title="Scraper Dashboard")

# CORS config - Allow everything for MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartRequest(BaseModel):
    source: str
    sector: str = "Coiffeur"
    city: str = None
    limit: int = 10

@app.post("/api/scrape/start")
async def start_scrape(req: StartRequest):
    try:
        # Convert to dict, explicitly handling optional city
        params = req.dict()
        if not params.get("city"):
            params["city"] = "Paris" # Default fallback if missing
            
        task_id = await scraper_runner.start_scraping_task(params)
        return {"task_id": task_id, "status": "running"}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scrape/stream/{task_id}")
async def stream_scrape(task_id: str):
    task = scraper_runner.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        while True:
            # Check if task finished/cancelled/errored and queue is empty
            if task.status in ["completed", "stopped", "error"] and task.queue.empty():
                 yield f"event: done\ndata: {json.dumps({'message': 'Finished', 'found': len(task.results or [])})}\n\n"
                 break

            try:
                # Wait for next event with timeout for keepalive
                event = await asyncio.wait_for(task.queue.get(), timeout=1.0)
                yield f"event: {event.get('type', 'message')}\ndata: {json.dumps(event.get('data', {}))}\n\n"
                
                # Check for termination event from scraper wrapper
                if event.get("type") in ["done", "error"]:
                    break
            except asyncio.TimeoutError:
                # Send keepalive comment to keep connection open
                yield ": keepalive\n\n"
                continue
            except Exception as e:
                yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.delete("/api/scrape/stop/{task_id}")
async def stop_scrape(task_id: str):
    success = await scraper_runner.stop_scraping_task(task_id)
    if success:
         return {"status": "stopped"}
    raise HTTPException(status_code=404, detail="Task not found or already stopped")

@app.get("/api/scrape/results/{task_id}")
async def get_results(task_id: str):
    task = scraper_runner.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Simple logic: assume scraper wrote to liste_email.csv in CWD
    file_path = "liste_email.csv"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="text/csv", filename=f"results_{task_id}.csv")
    
    # Fallback: maybe file was not created yet or empty?
    raise HTTPException(status_code=404, detail="Results file not found (might be empty or scraped failed)")

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0"}
