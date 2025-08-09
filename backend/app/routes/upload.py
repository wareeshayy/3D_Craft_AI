from fastapi import APIRouter, File, UploadFile, HTTPException
import uuid
import shutil
import os
import logging
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload/model")
async def upload_model(model_file: UploadFile = File(...)):
    """Upload a 3D model file (GLB/GLTF)"""
    try:
        # Validate file type
        if not model_file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_extension = model_file.filename.lower().split('.')[-1]
        if file_extension not in ['glb', 'gltf']:
            raise HTTPException(
                status_code=400, 
                detail="Only GLB and GLTF files are allowed"
            )
        
        # Generate unique model ID
        model_id = str(uuid.uuid4())
        upload_dir = Path(f"uploads/{model_id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        file_path = upload_dir / model_file.filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(model_file.file, buffer)
        
        logger.info(f"📤 Model uploaded successfully: {model_file.filename} -> {model_id}")
        
        return {
            "modelId": model_id,
            "filename": model_file.filename,
            "previewUrl": f"/api/models/{model_id}/preview",
            "downloadUrl": f"/api/models/{model_id}/download",
            "message": "Model uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/reference")
async def upload_reference_image(reference_image: UploadFile = File(...)):
    """Upload a reference image for 3D generation"""
    try:
        # Validate file type
        if not reference_image.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_extension = reference_image.filename.lower().split('.')[-1]
        if file_extension not in ['jpg', 'jpeg', 'png', 'webp', 'bmp']:
            raise HTTPException(
                status_code=400, 
                detail="Only image files (JPG, PNG, WebP, BMP) are allowed"
            )
        
        # Check file size (max 10MB)
        content = await reference_image.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
        
        # Generate unique reference ID
        reference_id = str(uuid.uuid4())
        upload_dir = Path(f"uploads/references/{reference_id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        file_path = upload_dir / reference_image.filename
        
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        logger.info(f"🖼️ Reference image uploaded: {reference_image.filename} -> {reference_id}")
        
        return {
            "referenceId": reference_id,
            "filename": reference_image.filename,
            "url": f"/api/references/{reference_id}",
            "message": "Reference image uploaded successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Reference upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/models/{model_id}/download")
async def download_uploaded_model(model_id: str):
    """Download a previously uploaded model"""
    try:
        upload_dir = Path(f"uploads/{model_id}")
        if not upload_dir.exists():
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Find the model file in the directory
        model_files = list(upload_dir.glob("*.glb")) + list(upload_dir.glob("*.gltf"))
        if not model_files:
            raise HTTPException(status_code=404, detail="Model file not found")
        
        model_file = model_files[0]
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=str(model_file),
            filename=model_file.name,
            media_type="model/gltf-binary" if model_file.suffix == ".glb" else "model/gltf+json"
        )
        
    except Exception as e:
        logger.error(f"❌ Model download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))