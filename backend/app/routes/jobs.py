from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any
import os
import logging
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory job storage (replace with database in production)
job_storage: Dict[str, Dict[str, Any]] = {}

@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """Get the status of a 3D generation job"""
    try:
        if job_id not in job_storage:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_storage[job_id]
        logger.info(f"📊 Job status requested for {job_id}: {job['status']}")
        
        return {
            "id": job_id,
            "status": job["status"],
            "progress": job["progress"],
            "prompt": job["prompt"],
            "style": job["style"],
            "quality": job["quality"],
            "modelUrl": job.get("modelUrl"),
            "errorMessage": job.get("errorMessage")
        }
    except Exception as e:
        logger.error(f"❌ Error getting job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/download")
async def download_model(job_id: str):
    """Download the generated 3D model"""
    try:
        if job_id not in job_storage:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_storage[job_id]
        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Job not completed yet")
        
        # Check if file exists
        file_path = f"outputs/{job_id}/model.glb"
        if not os.path.exists(file_path):
            # Create a demo file if the actual file doesn't exist
            os.makedirs(f"outputs/{job_id}", exist_ok=True)
            create_demo_glb_file(file_path)
        
        logger.info(f"📥 Model download requested for job {job_id}")
        
        return FileResponse(
            path=file_path,
            filename=f"3dcraft-{job_id}.glb",
            media_type="model/gltf-binary"
        )
    except Exception as e:
        logger.error(f"❌ Error downloading model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def update_job_status(job_id: str, status: str, progress: int, model_url: str = None, error_message: str = None):
    """Update job status in storage"""
    if job_id in job_storage:
        job_storage[job_id].update({
            "status": status,
            "progress": progress
        })
        if model_url:
            job_storage[job_id]["modelUrl"] = model_url
        if error_message:
            job_storage[job_id]["errorMessage"] = error_message

def create_job(job_id: str, prompt: str, style: str, quality: str):
    """Create a new job entry"""
    job_storage[job_id] = {
        "id": job_id,
        "prompt": prompt,
        "style": style,
        "quality": quality,
        "status": "pending",
        "progress": 0,
        "modelUrl": None,
        "errorMessage": None
    }

def create_demo_glb_file(file_path: str):
    """Create a demo GLB file for testing"""
    # This is a minimal GLB file structure
    # In production, replace this with your actual 3D generation output
    demo_content = b'glTF\x02\x00\x00\x00\x00\x04\x00\x00'  # Minimal GLB header
    
    with open(file_path, 'wb') as f:
        f.write(demo_content)
    
    logger.info(f"📦 Demo GLB file created at {file_path}")