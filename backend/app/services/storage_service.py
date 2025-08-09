import os
import shutil
from pathlib import Path
from typing import Dict, List
import uuid
from PIL import Image
import tempfile

class LocalStorageService:
    def __init__(self, base_path: str = "backend/static"):
        self.base_path = Path(base_path)
        self.models_dir = self.base_path / "models"
        self.previews_dir = self.base_path / "previews"
        
        # Create directories
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.previews_dir.mkdir(parents=True, exist_ok=True)
    
    async def store_model_files(self, model_id: str, temp_files: Dict[str, str]) -> Dict[str, str]:
        """Store model files and return URLs"""
        
        model_dir = self.models_dir / model_id
        model_dir.mkdir(exist_ok=True)
        
        stored_urls = {}
        
        for format_name, temp_path in temp_files.items():
            if os.path.exists(temp_path):
                # Copy to permanent storage
                filename = f"model.{format_name}"
                permanent_path = model_dir / filename
                shutil.copy2(temp_path, permanent_path)
                
                # Generate URL
                stored_urls[format_name] = f"/static/models/{model_id}/{filename}"
        
        return stored_urls
    
    async def generate_preview_image(self, model_id: str, obj_path: str) -> str:
        """Generate a simple preview image (placeholder for now)"""
        
        # For now, create a simple colored square as preview
        # Later, you can integrate with Open3D rendering
        
        preview_path = self.previews_dir / f"{model_id}.png"
        
        # Create a simple preview image
        img = Image.new('RGB', (400, 400), color=(100, 150, 200))
        img.save(preview_path)
        
        return f"/static/previews/{model_id}.png"
    
    def cleanup_temp_files(self, temp_files: Dict[str, str]):
        """Clean up temporary files"""
        for file_path in temp_files.values():
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Failed to cleanup {file_path}: {e}")