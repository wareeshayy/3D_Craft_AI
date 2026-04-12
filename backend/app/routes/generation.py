from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import uuid
import logging
import asyncio
import os
from pathlib import Path
import json
import base64
import time
from pydantic import BaseModel

# Import services
try:
    from app.services.ai_service import HuggingFaceAIService
    ai_service = HuggingFaceAIService()
except ImportError:
    ai_service = None
    logging.warning("AI service not available")

try:
    from app.services.mesh_service import mesh_service
except ImportError:
    mesh_service = None
    logging.warning("Mesh service not available")

router = APIRouter()
logger = logging.getLogger(__name__)

# Simple job storage (in-memory for now)
job_storage = {}

def create_job(job_id: str, prompt: str, style: str, quality: str, additional_data: dict = None):
    """Create a new job entry"""
    job_storage[job_id] = {
        "id": job_id,
        "prompt": prompt,
        "style": style,
        "quality": quality,
        "status": "pending",
        "progress": 0,
        "created_at": time.time(),
        "additional_data": additional_data or {}
    }

def update_job_status(job_id: str, status: str, progress: int = None, result: dict = None):
    """Update job status"""
    if job_id in job_storage:
        job_storage[job_id]["status"] = status
        if progress is not None:
            job_storage[job_id]["progress"] = progress
        if result:
            job_storage[job_id]["result"] = result

@router.post("/text-to-3d")
async def generate_3d_model(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    style: str = Form(default="realistic"),
    quality: str = Form(default="medium"),
    reference_image: Optional[UploadFile] = File(None)
):
    """Generate a 3D model from text prompt"""
    try:
        # Validate inputs
        if not prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        if len(prompt) > 1000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 1000 characters)")
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Handle reference image if provided
        reference_path = None
        if reference_image and reference_image.filename:
            # Validate image file
            if not reference_image.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                raise HTTPException(status_code=400, detail="Invalid image format")
            
            # Save reference image
            ref_dir = Path(f"uploads/references/{job_id}")
            ref_dir.mkdir(parents=True, exist_ok=True)
            reference_path = ref_dir / reference_image.filename
            
            with open(reference_path, "wb") as buffer:
                content = await reference_image.read()
                buffer.write(content)
            
            logger.info(f"🖼️ Reference image saved: {reference_image.filename}")
        
        # Create job entry
        create_job(job_id, prompt, style, quality)
        
        # Start background generation task
        background_tasks.add_task(
            process_3d_generation,
            job_id,
            prompt,
            style,
            quality,
            str(reference_path) if reference_path else None
        )
        
        logger.info(f"🎯 3D generation job started: {job_id}")
        logger.info(f"📝 Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")
        logger.info(f"🎨 Style: {style}, Quality: {quality}")
        
        return {
            "jobId": job_id,
            "message": "3D model generation started",
            "status": "pending",
            "estimatedTime": get_estimated_time(quality)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Generation request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

async def process_3d_generation(
    job_id: str,
    prompt: str, 
    style: str,
    quality: str,
    reference_image_path: Optional[str] = None
):
    """Background task to process 3D model generation"""
    try:
        logger.info(f"🔄 Starting 3D generation for job {job_id}")
        
        # Update job status to processing
        update_job_status(job_id, "processing", 5)
        
        # Simulate your AI pipeline steps
        steps = [
            ("Analyzing prompt", 15),
            ("Processing reference image", 25) if reference_image_path else ("Generating base geometry", 25),
            ("Creating 3D mesh", 45),
            ("Applying materials", 65),
            ("Optimizing model", 80),
            ("Exporting GLB", 95),
            ("Finalizing", 100)
        ]
        
        for step_name, progress in steps:
            logger.info(f"🔧 {step_name}... ({progress}%)")
            update_job_status(job_id, "processing", progress)
            
            # Simulate processing time based on quality
            wait_time = {
                "low": 0.5,
                "medium": 1.0, 
                "high": 2.0,
                "ultra": 3.0
            }.get(quality, 1.0)
            
            await asyncio.sleep(wait_time)
        
        # Create output directory
        output_dir = Path(f"outputs/{job_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        model_path = output_dir / "model.glb"
        
        # TODO: Replace this with your actual 3D generation logic
        # For now, create a demo GLB file
        await generate_actual_model(prompt, style, quality, reference_image_path, str(model_path))
        
        # Mark job as completed
        update_job_status(job_id, "completed", 100, f"model-{job_id}.glb")
        
        logger.info(f"✅ 3D generation completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"❌ 3D generation failed for job {job_id}: {e}")
        update_job_status(job_id, "failed", 0, error_message=str(e))

async def generate_actual_model(
    prompt: str,
    style: str, 
    quality: str,
    reference_image_path: Optional[str],
    output_path: str
):
    """
    Your actual 3D model generation logic goes here.
    This is where you'll integrate your AI pipeline.
    """
    try:
        # TODO: Implement your 3D generation pipeline
        # Examples of what might go here:
        
        # 1. Process prompt with LLM
        # processed_prompt = await process_with_llm(prompt)
        
        # 2. Generate base geometry
        # geometry = await generate_geometry(processed_prompt, style)
        
        # 3. Apply materials and textures
        # textured_model = await apply_materials(geometry, style, quality)
        
        # 4. Optimize and export
        # optimized_model = await optimize_model(textured_model, quality)
        # await export_glb(optimized_model, output_path)
        
        # For demonstration, create a simple GLB file
        create_demo_glb_file(output_path, prompt, style)
        
        logger.info(f"🎨 Model generated successfully: {output_path}")
        
    except Exception as e:
        logger.error(f"❌ Model generation failed: {e}")
        raise

def create_demo_glb_file(output_path: str, prompt: str, style: str):
    """Create a demo GLB file (replace with your actual generation)"""
    # This creates a minimal valid GLB file
    # Replace this entire function with your actual 3D generation code
    
    try:
        # Create basic glTF JSON
        gltf_json = {
            "asset": {
                "version": "2.0",
                "generator": "3DCraft AI",
                "copyright": f"Generated from: {prompt[:50]}"
            },
            "scenes": [{"nodes": [0]}],
            "scene": 0,
            "nodes": [{"mesh": 0, "name": f"{style}_model"}],
            "meshes": [{
                "primitives": [{
                    "attributes": {"POSITION": 0},
                    "indices": 1
                }]
            }],
            "accessors": [
                {
                    "bufferView": 0,
                    "componentType": 5126,  # FLOAT
                    "count": 8,
                    "type": "VEC3",
                    "max": [1.0, 1.0, 1.0],
                    "min": [-1.0, -1.0, -1.0]
                },
                {
                    "bufferView": 1,
                    "componentType": 5123,  # UNSIGNED_SHORT
                    "count": 36,
                    "type": "SCALAR"
                }
            ],
            "bufferViews": [
                {"buffer": 0, "byteOffset": 0, "byteLength": 96, "target": 34962},
                {"buffer": 0, "byteOffset": 96, "byteLength": 72, "target": 34963}
            ],
            "buffers": [{"byteLength": 168}]
        }
        
        # Create cube vertices and indices
        vertices = array.array('f', [
            -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0,
            -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0
        ])
        
        indices = array.array('H', [
            0,1,2, 0,2,3, 4,7,6, 4,6,5, 0,4,5, 0,5,1,
            2,6,7, 2,7,3, 0,3,7, 0,7,4, 1,5,6, 1,6,2
        ])
        
        # Convert to bytes
        json_bytes = json.dumps(gltf_json, separators=(',', ':')).encode('utf-8')
        vertex_bytes = vertices.tobytes()
        index_bytes = indices.tobytes()
        
        # Pad JSON to 4-byte boundary
        json_padding = (4 - (len(json_bytes) % 4)) % 4
        json_bytes += b' ' * json_padding
        
        # Binary data
        binary_data = vertex_bytes + index_bytes
        binary_padding = (4 - (len(binary_data) % 4)) % 4
        binary_data += b'\x00' * binary_padding
        
        # GLB header
        magic = b'glTF'
        version = struct.pack('<I', 2)
        json_length = len(json_bytes)
        bin_length = len(binary_data)
        total_length = 12 + 8 + json_length + 8 + bin_length
        
        # Write GLB file
        with open(output_path, 'wb') as f:
            # GLB header
            f.write(magic)
            f.write(version)
            f.write(struct.pack('<I', total_length))
            
            # JSON chunk
            f.write(struct.pack('<I', json_length))
            f.write(b'JSON')
            f.write(json_bytes)
            
            # Binary chunk
            f.write(struct.pack('<I', bin_length))
            f.write(b'BIN\x00')
            f.write(binary_data)
        
        logger.info(f"📦 Demo GLB file created: {output_path}")
        
    except Exception as e:
        logger.error(f"❌ Failed to create demo GLB: {e}")
        raise

def get_estimated_time(quality: str) -> str:
    """Get estimated generation time based on quality"""
    time_estimates = {
        "low": "30-60 seconds",
        "medium": "1-2 minutes",
        "high": "2-4 minutes", 
        "ultra": "4-8 minutes"
    }
    return time_estimates.get(quality, "1-2 minutes")

@router.get("/styles")
async def get_available_styles():
    """Get list of available 3D styles"""
    return {
        "styles": [
            {"id": "realistic", "name": "Realistic", "description": "Photorealistic 3D models"},
            {"id": "cartoon", "name": "Cartoon", "description": "Stylized cartoon-like models"},
            {"id": "low_poly", "name": "Low Poly", "description": "Geometric low-polygon style"},
            {"id": "sci_fi", "name": "Sci-Fi", "description": "Futuristic science fiction style"},
            {"id": "fantasy", "name": "Fantasy", "description": "Magical and fantastical elements"},
            {"id": "minimalist", "name": "Minimalist", "description": "Clean, simple designs"},
            {"id": "abstract", "name": "Abstract", "description": "Artistic abstract forms"}
        ]
    }

@router.get("/quality-options")
async def get_quality_options():
    """Get available quality settings"""
    return {
        "quality_levels": [
            {
                "id": "low",
                "name": "Low (Fast)", 
                "description": "Quick generation, basic detail",
                "estimated_time": "30-60 seconds",
                "vertices": "~1K",
                "use_case": "Prototyping, previews"
            },
            {
                "id": "medium",
                "name": "Medium (Balanced)",
                "description": "Good balance of speed and quality", 
                "estimated_time": "1-2 minutes",
                "vertices": "~5K",
                "use_case": "General use, web display"
            },
            {
                "id": "high", 
                "name": "High (Detailed)",
                "description": "High detail, slower generation",
                "estimated_time": "2-4 minutes", 
                "vertices": "~20K",
                "use_case": "Professional work, printing"
            },
            {
                "id": "ultra",
                "name": "Ultra (Premium)",
                "description": "Maximum detail and quality",
                "estimated_time": "4-8 minutes",
                "vertices": "~50K+", 
                "use_case": "High-end production, detailed work"
            }
        ]
    }

# Additional helper functions for your 3D pipeline

async def process_with_llm(prompt: str) -> dict:
    """
    Process the text prompt with an LLM to extract 3D-relevant features
    TODO: Integrate with your LLM service (OpenAI, Anthropic, etc.)
    """
    # Placeholder for LLM processing
    return {
        "processed_prompt": prompt,
        "detected_objects": [],
        "style_hints": [],
        "complexity_score": 0.5
    }

async def generate_geometry(prompt_data: dict, style: str) -> dict:
    """
    Generate base 3D geometry from processed prompt
    TODO: Integrate with your 3D generation model
    """
    # Placeholder for geometry generation
    return {
        "vertices": [],
        "faces": [],
        "normals": [],
        "uvs": []
    }

async def apply_materials(geometry: dict, style: str, quality: str) -> dict:
    """
    Apply materials and textures to the 3D model
    TODO: Integrate with your material generation pipeline
    """
    # Placeholder for material application
    return {
        **geometry,
        "materials": [],
        "textures": []
    }

async def optimize_model(model: dict, quality: str) -> dict:
    """
    Optimize the 3D model based on quality settings
    TODO: Implement model optimization (decimation, LOD, etc.)
    """
    # Placeholder for model optimization
    return model

async def export_glb(model: dict, output_path: str):
    """
    Export the 3D model to GLB format
    TODO: Implement proper GLB export with your model data
    """
    # For now, use the demo GLB creation
    create_demo_glb_file(output_path, "Generated model", "default")

# Advanced generation endpoints

@router.post("/text-to-3d/advanced")
async def generate_3d_model_advanced(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    style: str = Form(default="realistic"),
    quality: str = Form(default="medium"),
    reference_image: Optional[UploadFile] = File(None),
    # Advanced parameters
    seed: Optional[int] = Form(None),
    guidance_scale: float = Form(default=7.5),
    num_inference_steps: int = Form(default=50),
    negative_prompt: str = Form(default=""),
    mesh_resolution: int = Form(default=512)
):
    """Advanced 3D model generation with additional parameters"""
    try:
        # Validate advanced inputs
        if guidance_scale < 1.0 or guidance_scale > 20.0:
            raise HTTPException(status_code=400, detail="Guidance scale must be between 1.0 and 20.0")
        
        if num_inference_steps < 10 or num_inference_steps > 150:
            raise HTTPException(status_code=400, detail="Inference steps must be between 10 and 150")
        
        if mesh_resolution not in [128, 256, 512, 1024]:
            raise HTTPException(status_code=400, detail="Mesh resolution must be 128, 256, 512, or 1024")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Handle reference image
        reference_path = None
        if reference_image and reference_image.filename:
            if not reference_image.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp')):
                raise HTTPException(status_code=400, detail="Invalid image format")
            
            ref_dir = Path(f"uploads/references/{job_id}")
            ref_dir.mkdir(parents=True, exist_ok=True)
            reference_path = ref_dir / reference_image.filename
            
            with open(reference_path, "wb") as buffer:
                content = await reference_image.read()
                buffer.write(content)
        
        # Create job with advanced parameters
        job_data = {
            "prompt": prompt,
            "style": style,
            "quality": quality,
            "seed": seed,
            "guidance_scale": guidance_scale,
            "num_inference_steps": num_inference_steps,
            "negative_prompt": negative_prompt,
            "mesh_resolution": mesh_resolution,
            "reference_image": str(reference_path) if reference_path else None
        }
        
        create_job(job_id, prompt, style, quality, additional_data=job_data)
        
        # Start advanced background task
        background_tasks.add_task(
            process_advanced_3d_generation,
            job_id,
            job_data
        )
        
        logger.info(f"🚀 Advanced 3D generation job started: {job_id}")
        
        return {
            "jobId": job_id,
            "message": "Advanced 3D model generation started",
            "status": "pending",
            "estimatedTime": get_estimated_time_advanced(quality, num_inference_steps),
            "parameters": {
                "guidance_scale": guidance_scale,
                "inference_steps": num_inference_steps,
                "mesh_resolution": mesh_resolution,
                "seed": seed
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Advanced generation request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Advanced generation failed: {str(e)}")

async def process_advanced_3d_generation(job_id: str, job_data: dict):
    """Process advanced 3D generation with detailed parameters"""
    try:
        logger.info(f"🔄 Starting advanced 3D generation for job {job_id}")
        
        update_job_status(job_id, "processing", 5)
        
        # Advanced processing steps
        steps = [
            ("Initializing AI pipeline", 10),
            ("Processing text prompt with LLM", 20),
            ("Analyzing reference image", 30) if job_data.get("reference_image") else ("Generating concept", 30),
            ("Creating base 3D structure", 45),
            ("Refining geometry", 60),
            ("Applying advanced materials", 75),
            ("High-quality texturing", 85),
            ("Final optimization", 95),
            ("Exporting high-res GLB", 100)
        ]
        
        for step_name, progress in steps:
            logger.info(f"🔧 {step_name}... ({progress}%)")
            update_job_status(job_id, "processing", progress)
            
            # More detailed wait times for advanced processing
            base_wait = {
                "low": 0.8,
                "medium": 1.5,
                "high": 3.0,
                "ultra": 5.0
            }.get(job_data["quality"], 1.5)
            
            # Factor in inference steps
            step_multiplier = job_data["num_inference_steps"] / 50.0
            wait_time = base_wait * step_multiplier
            
            await asyncio.sleep(wait_time)
        
        # Create output
        output_dir = Path(f"outputs/{job_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        model_path = output_dir / "model.glb"
        
        # Generate with advanced parameters
        await generate_advanced_model(job_data, str(model_path))
        
        update_job_status(job_id, "completed", 100, f"model-{job_id}.glb")
        logger.info(f"✅ Advanced 3D generation completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"❌ Advanced 3D generation failed for job {job_id}: {e}")
        update_job_status(job_id, "failed", 0, error_message=str(e))

async def generate_advanced_model(job_data: dict, output_path: str):
    """Generate model with advanced parameters"""
    try:
        # TODO: Use advanced parameters in your generation pipeline
        # - job_data["seed"] for reproducible generation
        # - job_data["guidance_scale"] for prompt adherence
        # - job_data["num_inference_steps"] for quality/speed tradeoff
        # - job_data["negative_prompt"] for avoiding unwanted features
        # - job_data["mesh_resolution"] for output resolution
        
        # For now, create enhanced demo GLB
        create_demo_glb_file(output_path, job_data["prompt"], job_data["style"])
        
        logger.info(f"🎨 Advanced model generated: {output_path}")
        
    except Exception as e:
        logger.error(f"❌ Advanced model generation failed: {e}")
        raise

def get_estimated_time_advanced(quality: str, inference_steps: int) -> str:
    """Get estimated time for advanced generation"""
    base_times = {
        "low": 45,
        "medium": 90,
        "high": 180,
        "ultra": 360
    }
    
    base_seconds = base_times.get(quality, 90)
    # Factor in inference steps (50 is baseline)
    adjusted_seconds = base_seconds * (inference_steps / 50.0)
    
    if adjusted_seconds < 60:
        return f"{int(adjusted_seconds)} seconds"
    elif adjusted_seconds < 3600:
        minutes = int(adjusted_seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        hours = int(adjusted_seconds / 3600)
        minutes = int((adjusted_seconds % 3600) / 60)
        return f"{hours}h {minutes}m"

# Batch generation endpoint

@router.post("/text-to-3d/batch")
async def generate_3d_models_batch(
    background_tasks: BackgroundTasks,
    prompts: list[str] = Form(...),
    style: str = Form(default="realistic"),
    quality: str = Form(default="medium")
):
    """Generate multiple 3D models from a batch of prompts"""
    try:
        if len(prompts) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 prompts per batch")
        
        if not prompts or any(not p.strip() for p in prompts):
            raise HTTPException(status_code=400, detail="All prompts must be non-empty")
        
        # Generate batch job ID
        batch_id = str(uuid.uuid4())
        job_ids = []
        
        # Create individual jobs for each prompt
        for i, prompt in enumerate(prompts):
            job_id = f"{batch_id}-{i}"
            job_ids.append(job_id)
            create_job(job_id, prompt, style, quality)
            
            # Start background task for each
            background_tasks.add_task(
                process_3d_generation,
                job_id,
                prompt,
                style,
                quality,
                None
            )
        
        logger.info(f"📦 Batch generation started: {batch_id} ({len(prompts)} models)")
        
        return {
            "batchId": batch_id,
            "jobIds": job_ids,
            "message": f"Batch generation of {len(prompts)} models started",
            "status": "pending",
            "estimatedTime": f"{len(prompts)} × {get_estimated_time(quality)}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Batch generation request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")

# Model variation endpoint

@router.post("/text-to-3d/variations")
async def generate_model_variations(
    background_tasks: BackgroundTasks,
    base_job_id: str = Form(...),
    num_variations: int = Form(default=3),
    variation_strength: float = Form(default=0.3)
):
    """Generate variations of an existing 3D model"""
    try:
        if base_job_id not in job_storage:
            raise HTTPException(status_code=404, detail="Base job not found")
        
        if num_variations < 1 or num_variations > 5:
            raise HTTPException(status_code=400, detail="Number of variations must be between 1 and 5")
        
        if variation_strength < 0.1 or variation_strength > 1.0:
            raise HTTPException(status_code=400, detail="Variation strength must be between 0.1 and 1.0")
        
        base_job = job_storage[base_job_id]
        
        if base_job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Base job must be completed")
        
        # Generate variation jobs
        variation_batch_id = str(uuid.uuid4())
        variation_job_ids = []
        
        for i in range(num_variations):
            var_job_id = f"{variation_batch_id}-var-{i}"
            variation_job_ids.append(var_job_id)
            
            # Create variation job with modified prompt
            varied_prompt = f"{base_job['prompt']} (variation {i+1})"
            create_job(var_job_id, varied_prompt, base_job["style"], base_job["quality"])
            
            # Start variation generation
            background_tasks.add_task(
                process_variation_generation,
                var_job_id,
                base_job_id,
                variation_strength,
                i
            )
        
        logger.info(f"🔄 Generating {num_variations} variations of job {base_job_id}")
        
        return {
            "variationBatchId": variation_batch_id,
            "variationJobIds": variation_job_ids,
            "baseJobId": base_job_id,
            "message": f"Generating {num_variations} model variations",
            "status": "pending",
            "variationStrength": variation_strength
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Variation generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Variation generation failed: {str(e)}")

async def process_variation_generation(
    job_id: str,
    base_job_id: str,
    variation_strength: float,
    variation_index: int
):
    """Process generation of model variations"""
    try:
        logger.info(f"🔄 Starting variation {variation_index} for job {job_id}")
        
        update_job_status(job_id, "processing", 10)
        
        base_job = job_storage[base_job_id]
        
        # Variation-specific steps
        steps = [
            ("Loading base model", 20),
            ("Applying variation seed", 40),
            ("Modifying geometry", 60),
            ("Adjusting materials", 80),
            ("Exporting variation", 100)
        ]
        
        for step_name, progress in steps:
            logger.info(f"🔧 {step_name}... ({progress}%)")
            update_job_status(job_id, "processing", progress)
            await asyncio.sleep(0.8)  # Variations are faster
        
        # Create output
        output_dir = Path(f"outputs/{job_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        model_path = output_dir / "model.glb"
        
        # Generate variation (for now, create demo)
        create_demo_glb_file(str(model_path), f"{base_job['prompt']} (variation {variation_index})", base_job["style"])
        
        update_job_status(job_id, "completed", 100, f"model-{job_id}.glb")
        logger.info(f"✅ Variation {variation_index} completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"❌ Variation generation failed for job {job_id}: {e}")
        update_job_status(job_id, "failed", 0, error_message=str(e))
        
        
        


# Router already defined above

class TextTo3DRequest(BaseModel):
    prompt: str
    enhance_prompt: bool = True
    parameters: Optional[Dict[str, Any]] = None

class ImageTo3DRequest(BaseModel):
    image_data: str  # base64 encoded
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class TextureGenerationRequest(BaseModel):
    description: str
    size: tuple = (512, 512)
    parameters: Optional[Dict[str, Any]] = None

@router.post("/text-to-3d")
async def generate_3d_from_text(request: TextTo3DRequest):
    """Generate 3D model from text with enhanced prompting"""
    try:
        result = await ai_service.enhanced_text_to_3d_generation(
            prompt=request.prompt,
            enhance_prompt=request.enhance_prompt
        )
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "3D model generated successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-3D generation failed: {str(e)}")

@router.post("/image-to-3d")
async def generate_3d_from_image(request: ImageTo3DRequest):
    """Convert 2D image to 3D model"""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.image_data)
        
        result = await ai_service.image_to_3d_with_enhancement(
            image_data=image_bytes,
            description=request.description
        )
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "3D model generated from image successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image-to-3D conversion failed: {str(e)}")

@router.post("/image-to-3d/upload")
async def upload_image_to_3d(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    """Upload image file and convert to 3D"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        result = await ai_service.image_to_3d_with_enhancement(
            image_data=image_data,
            description=description
        )
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "3D model generated from uploaded image successfully",
                    "filename": file.filename,
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Generation failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload and conversion failed: {str(e)}")

@router.post("/generate-texture")
async def generate_texture(request: TextureGenerationRequest):
    """Generate texture from description"""
    try:
        result = await ai_service.hf_service.generate_texture(
            description=request.description,
            size=request.size
        )
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Texture generated successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Texture generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Texture generation failed: {str(e)}")

@router.post("/generate-reference-image")
async def generate_reference_image(prompt: str):
    """Generate reference image for 3D modeling"""
    try:
        result = await ai_service.hf_service.generate_reference_image(prompt)
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Reference image generated successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Reference image generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reference image generation failed: {str(e)}")

@router.post("/enhance-prompt")
async def enhance_prompt(prompt: str, max_length: int = 150):
    """Enhance text prompt for better 3D generation"""
    try:
        result = await ai_service.hf_service.generate_text_description(prompt, max_length)
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Prompt enhanced successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Prompt enhancement failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt enhancement failed: {str(e)}")

@router.post("/generate-complete-asset")
async def generate_complete_3d_asset(prompt: str):
    """Generate complete 3D asset package (model + textures + reference)"""
    try:
        result = await ai_service.generate_3d_asset_package(prompt)
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Complete 3D asset package generated successfully",
                    "data": result
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Asset package generation failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complete asset generation failed: {str(e)}")

@router.get("/status")
async def get_generation_status():
    """Get status of all generation services"""
    try:
        status = ai_service.get_generation_status()
        return JSONResponse(
            status_code=200,
            content={
                "message": "Generation services status",
                "data": status
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

# ==================== CHATBOT ROUTES ====================

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    model: str
    timestamp: float

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with AI assistant about 3D generation"""
    try:
        result = await ai_service.chat_with_bot(
            user_message=request.message,
            conversation_history=request.conversation_history
        )
        
        if result["status"] == "success":
            return ChatResponse(
                response=result["response"],
                model=result.get("model", "unknown"),
                timestamp=result["timestamp"]
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Chat failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/help/{topic}")
async def get_3d_help(topic: str):
    """Get help about specific 3D generation topics"""
    try:
        result = await ai_service.get_3d_generation_help(topic)
        
        if result["status"] == "success":
            return JSONResponse(
                status_code=200,
                content={
                    "topic": result["topic"],
                    "content": result["content"],
                    "timestamp": result["timestamp"]
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Help failed"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Help request failed: {str(e)}")        