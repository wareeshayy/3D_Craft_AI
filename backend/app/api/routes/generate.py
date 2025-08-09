from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ...services.generation_service import generation_service
from ...services.cloudinary_service import CloudinaryStorageService

router = APIRouter(prefix="/api/generate", tags=["generation"])

@router.post("/text-to-3d")
async def generate_3d_model(
    prompt: str,
    style: str = "realistic",
    complexity: str = "medium", 
    formats: List[str] = Query(default=["obj", "ply"])
):
    """Generate 3D model from text description"""
    
    if not prompt or len(prompt.strip()) < 3:
        raise HTTPException(status_code=400, detail="Prompt must be at least 3 characters long")
    
    try:
        task_id = await generation_service.generate_model(
            prompt=prompt.strip(),
            style=style,
            complexity=complexity,
            formats=formats
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "status": "started",
            "message": "3D model generation started",
            "estimated_time": "30-60 seconds"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.get("/status/{task_id}")
async def get_generation_status(task_id: str):
    """Get generation status and progress"""
    
    try:
        status = await generation_service.get_model_info(task_id)
        
        if not status or status.get('status') == 'not_found':
            raise HTTPException(status_code=404, detail="Task not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.get("/model/{model_id}")
async def get_model_details(model_id: str):
    """Get detailed model information"""
    
    try:
        model_info = await generation_service.get_model_info(model_id)
        
        if not model_info or model_info.get('status') == 'not_found':
            raise HTTPException(status_code=404, detail="Model not found")
        
        return model_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@router.delete("/model/{model_id}")
async def delete_model(model_id: str):
    """Delete a model and all associated files"""
    
    try:
        success = await generation_service.delete_model(model_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete model")
        
        return {"success": True, "message": "Model deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/usage")
async def get_usage_stats():
    """Get Cloudinary usage statistics"""
    
    try:
        storage_service = CloudinaryStorageService()
        stats = await storage_service.get_usage_stats()
        
        return {
            "success": True,
            "usage": stats
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "usage": {}
        }