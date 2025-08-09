from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import asyncio
import random
import logging
from datetime import datetime
from uuid import uuid4
from fastapi.responses import FileResponse
import os
from pathlib import Path
import shutil
import subprocess
from PIL import Image
import io

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configuration
MODEL_STORAGE = "generated_models"
PREVIEW_STORAGE = "previews"
os.makedirs(MODEL_STORAGE, exist_ok=True)
os.makedirs(PREVIEW_STORAGE, exist_ok=True)

# In-memory storage for generation status
generation_status: Dict[str, Dict[str, Any]] = {}

# Models
class GenerationRequest(BaseModel):
    prompt: str
    style: str = "realistic"
    quality: str = "medium"
    format: List[str] = ["glb"]  # Default to GLB format
    reference_image: Optional[str] = None  # URL to reference image

class GenerationResponse(BaseModel):
    message_id: str
    status: str
    progress: int
    stage: str
    files: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    model_id: Optional[str] = None

class ModelDownloadRequest(BaseModel):
    model_id: str
    format: str = "glb"

# Endpoints
@router.post("/text-to-3d", response_model=GenerationResponse)
async def generate_3d_model(
    request: GenerationRequest, 
    background_tasks: BackgroundTasks
):
    """Endpoint to initiate 3D model generation from text prompt"""
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    message_id = str(uuid.uuid4())
    
    generation_status[message_id] = {
        "message_id": message_id,
        "status": "processing",
        "progress": 0,
        "stage": "Initializing",
        "request": request.dict(),
        "created_at": datetime.utcnow().isoformat(),
        "files": None,
        "error": None,
        "model_id": None
    }
    
    background_tasks.add_task(process_generation, message_id, request)
    
    return generation_status[message_id]

@router.post("/image-to-3d")
async def generate_from_image(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Endpoint to initiate 3D model generation from reference image"""
    try:
        # Save the uploaded image
        image_path = os.path.join(PREVIEW_STORAGE, f"upload_{uuid4()}.jpg")
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        message_id = str(uuid.uuid4())
        request = GenerationRequest(
            prompt="Generated from image",
            style="realistic",
            quality="high",
            reference_image=image_path
        )
        
        generation_status[message_id] = {
            "message_id": message_id,
            "status": "processing",
            "progress": 0,
            "stage": "Initializing",
            "request": request.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "files": None,
            "error": None,
            "model_id": None
        }
        
        background_tasks.add_task(process_generation, message_id, request)
        return generation_status[message_id]
    
    except Exception as e:
        logger.error(f"Image upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Image processing failed")

@router.get("/status/{message_id}", response_model=GenerationResponse)
async def get_generation_status(message_id: str):
    """Check the status of a generation task"""
    if message_id not in generation_status:
        raise HTTPException(status_code=404, detail="Generation not found")
    return generation_status[message_id]

@router.get("/download/{model_id}")
async def download_model(model_id: str, format: str = "glb"):
    """Download the generated 3D model"""
    model_path = Path(MODEL_STORAGE) / f"model-{model_id}.{format.lower()}"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model not found")
    
    return FileResponse(
        model_path,
        media_type="model/gltf-binary" if format == "glb" else "application/octet-stream",
        filename=f"3DCraft-model-{model_id}.{format}"
    )

@router.get("/preview/{model_id}")
async def get_preview(model_id: str):
    """Get the preview image for a model"""
    preview_path = Path(PREVIEW_STORAGE) / f"preview-{model_id}.jpg"
    if not preview_path.exists():
        raise HTTPException(status_code=404, detail="Preview not available")
    
    return FileResponse(preview_path)

# Generation Process
async def process_generation(message_id: str, request: GenerationRequest):
    """Background task to handle the model generation process"""
    try:
        stages = [
            ("Analyzing prompt", 10),
            ("Generating base geometry", 25),
            ("Refining mesh structure", 45),
            ("Applying textures", 65),
            ("Optimizing model", 80),
            ("Exporting formats", 95),
            ("Finalizing", 100)
        ]
        
        model_id = str(uuid4())
        generation_status[message_id]["model_id"] = model_id
        
        # Simulate generation process
        for stage_name, progress in stages:
            generation_status[message_id].update({
                "stage": stage_name,
                "progress": progress
            })
            
            await asyncio.sleep(random.uniform(1, 3))  # Simulate work
            
            # Random chance of failure for demo purposes (remove in production)
            if random.random() < 0.05:  # 5% chance of failure
                raise Exception("Simulated generation error")
        
        # Generate output files
        model_path = Path(MODEL_STORAGE) / f"model-{model_id}.glb"
        preview_path = Path(PREVIEW_STORAGE) / f"preview-{model_id}.jpg"
        
        # In a real implementation, this would call your Blender/AI generation
        await generate_sample_model(request.prompt, model_path, preview_path)
        
        # Update status with download URLs
        generation_status[message_id].update({
            "status": "completed",
            "progress": 100,
            "stage": "Completed",
            "files": {
                "download_url": f"/download/{model_id}",
                "preview_url": f"/preview/{model_id}",
                "available_formats": request.format
            },
            "completed_at": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        generation_status[message_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        })

async def generate_sample_model(prompt: str, model_path: Path, preview_path: Path):
    """Generate sample model files (replace with actual Blender/AI generation)"""
    try:
        # This would be replaced with actual Blender/AI generation
        # For now, we'll create placeholder files
        
        # Create a dummy GLB file
        with open(model_path, 'wb') as f:
            f.write(b"Dummy GLB file content")  # Replace with actual model data
            
        # Create a dummy preview image
        img = Image.new('RGB', (512, 512), color=(random.randint(0, 255), 
                                                 random.randint(0, 255), 
                                                 random.randint(0, 255)))
        img.save(preview_path)
        
        # In production, you would call something like:
        # subprocess.run([
        #     "blender",
        #     "--background",
        #     "--python",
        #     "blender_script.py",
        #     "--",
        #     prompt,
        #     str(model_path),
        #     str(preview_path)
        # ])
        
    except Exception as e:
        logger.error(f"Model generation failed: {str(e)}")
        raise