from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import logging
from pathlib import Path
import json
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/models")
async def list_models(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    style: Optional[str] = Query(None),
    quality: Optional[str] = Query(None)
):
    """List all generated 3D models with pagination and filtering"""
    try:
        from .jobs import job_storage
        
        # Filter completed jobs
        completed_jobs = [
            job for job in job_storage.values() 
            if job["status"] == "completed"
        ]
        
        # Apply filters
        if style:
            completed_jobs = [job for job in completed_jobs if job["style"] == style]
        if quality:
            completed_jobs = [job for job in completed_jobs if job["quality"] == quality]
        
        # Pagination
        total = len(completed_jobs)
        models = completed_jobs[offset:offset + limit]
        
        # Format response
        model_list = []
        for job in models:
            model_list.append({
                "id": job["id"],
                "prompt": job["prompt"],
                "style": job["style"],
                "quality": job["quality"],
                "modelUrl": job.get("modelUrl"),
                "downloadUrl": f"/api/jobs/{job['id']}/download",
                "previewUrl": f"/api/models/{job['id']}/preview",
                "createdAt": datetime.now().isoformat()  # Add actual timestamp in production
            })
        
        logger.info(f"📋 Listed {len(model_list)} models (total: {total})")
        
        return {
            "models": model_list,
            "total": total,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + limit < total
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_id}")
async def get_model_details(model_id: str):
    """Get detailed information about a specific model"""
    try:
        from .jobs import job_storage
        
        if model_id not in job_storage:
            raise HTTPException(status_code=404, detail="Model not found")
        
        job = job_storage[model_id]
        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Model not ready")
        
        # Get file info
        output_path = Path(f"outputs/{model_id}/model.glb")
        file_size = 0
        if output_path.exists():
            file_size = output_path.stat().st_size
        
        model_details = {
            "id": model_id,
            "prompt": job["prompt"],
            "style": job["style"],
            "quality": job["quality"],
            "status": job["status"],
            "modelUrl": job.get("modelUrl"),
            "downloadUrl": f"/api/jobs/{model_id}/download",
            "previewUrl": f"/api/models/{model_id}/preview",
            "fileSize": file_size,
            "format": "GLB",
            "createdAt": datetime.now().isoformat(),
            "metadata": {
                "vertices": "Unknown",  # Add actual mesh info in production
                "triangles": "Unknown",
                "materials": "Unknown"
            }
        }
        
        logger.info(f"📄 Model details requested: {model_id}")
        return model_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting model details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_id}/preview")
async def get_model_preview(model_id: str):
    """Get a preview image or thumbnail of the 3D model"""
    try:
        # Check if model exists
        from .jobs import job_storage
        if model_id not in job_storage:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Look for preview image
        preview_path = Path(f"outputs/{model_id}/preview.png")
        
        if not preview_path.exists():
            # Generate preview if it doesn't exist
            await generate_model_preview(model_id)
        
        if preview_path.exists():
            return FileResponse(
                path=str(preview_path),
                filename=f"preview-{model_id}.png",
                media_type="image/png"
            )
        else:
            # Return placeholder image
            raise HTTPException(status_code=404, detail="Preview not available")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting model preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a generated 3D model"""
    try:
        from .jobs import job_storage
        
        if model_id not in job_storage:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Remove files
        output_dir = Path(f"outputs/{model_id}")
        if output_dir.exists():
            import shutil
            shutil.rmtree(output_dir)
        
        # Remove from job storage
        del job_storage[model_id]
        
        logger.info(f"🗑️ Model deleted: {model_id}")
        
        return {"message": "Model deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_model_preview(model_id: str):
    """Generate a preview image for the 3D model"""
    try:
        # TODO: Implement preview generation using Blender or Three.js
        # This could render the GLB file to a PNG thumbnail
        
        # For now, create a placeholder
        output_dir = Path(f"outputs/{model_id}")
        preview_path = output_dir / "preview.png"
        
        # Create a simple placeholder image (1x1 pixel)
        placeholder_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01]\xcc\'\xde\x00\x00\x00\x00IEND\xaeB`\x82'
        
        with open(preview_path, 'wb') as f:
            f.write(placeholder_png)
        
        logger.info(f"🖼️ Preview generated for model {model_id}")
        
    except Exception as e:
        logger.error(f"❌ Preview generation failed: {e}")

@router.get("/models/stats")
async def get_model_stats():
    """Get statistics about generated models"""
    try:
        from .jobs import job_storage
        
        total_jobs = len(job_storage)
        completed = len([j for j in job_storage.values() if j["status"] == "completed"])
        processing = len([j for j in job_storage.values() if j["status"] == "processing"])
        failed = len([j for j in job_storage.values() if j["status"] == "failed"])
        
        # Style breakdown
        style_counts = {}
        for job in job_storage.values():
            style = job["style"]
            style_counts[style] = style_counts.get(style, 0) + 1
        
        stats = {
            "totalJobs": total_jobs,
            "completed": completed,
            "processing": processing,
            "failed": failed,
            "successRate": (completed / total_jobs * 100) if total_jobs > 0 else 0,
            "styleBreakdown": style_counts,
            "averageGenerationTime": "5.2 minutes"  # Calculate actual average
        }
        
        logger.info("📊 Model statistics requested")
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting model stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))