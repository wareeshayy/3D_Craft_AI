from ..database.operations import db_ops
from ..models.schemas import GenerationCreate, GenerationStatus
from .ai_service import HuggingFaceAIService
from .mesh_service import MeshGenerationService
from .cloudinary_service import CloudinaryStorageService
import time
from typing import Dict, Any

class ModelGenerationService:
    def __init__(self):
        self.ai_service = HuggingFaceAIService()
        self.mesh_service = MeshGenerationService()
        self.storage_service = CloudinaryStorageService()
    
    async def start_generation(
        self,
        generation_data: GenerationCreate,
        user_id: str = None
    ) -> str:
        """Start 3D model generation process"""
        
        # Create generation record in database
        generation_id = await db_ops.create_generation(generation_data, user_id)
        
        # Start background processing (you can use asyncio.create_task for this)
        import asyncio
        asyncio.create_task(self._process_generation(generation_id, generation_data, user_id))
        
        return generation_id
    
    async def _process_generation(
        self,
        generation_id: str,
        generation_data: GenerationCreate,
        user_id: str = None
    ):
        """Background processing of 3D model generation"""
        
        start_time = time.time()
        
        try:
            # Update status to processing
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.PROCESSING,
                progress=10
            )
            
            # Step 1: Enhance prompt
            enhanced_prompt = await self.ai_service.enhance_prompt(generation_data.prompt)
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.PROCESSING,
                progress=30,
                enhanced_prompt=enhanced_prompt
            )
            
            # Step 2: Generate mesh parameters
            parameters = await self.ai_service.generate_mesh_parameters(enhanced_prompt)
            parameters.update({
                'original_prompt': generation_data.prompt,
                'style': generation_data.style,
                'complexity': generation_data.complexity,
                'model_id': generation_id
            })
            
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.PROCESSING,
                progress=50
            )
            
            # Step 3: Generate 3D mesh
            temp_files = await self.mesh_service.generate_3d_model(parameters)
            
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.PROCESSING,
                progress=70
            )
            
            # Step 4: Upload to Cloudinary
            file_urls = await self.storage_service.upload_model_files(generation_id, temp_files)
            preview_url = await self.storage_service.generate_and_upload_preview(
                generation_id, 
                parameters
            )
            
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.PROCESSING,
                progress=90
            )
            
            # Step 5: Create model record
            from ..models.schemas import Model3DCreate
            model_data = Model3DCreate(
                name=f"Generated Model - {generation_data.prompt[:50]}",
                description=f"Generated from: {generation_data.prompt}",
                prompt=generation_data.prompt,
                style=generation_data.style,
                complexity=generation_data.complexity,
                tags=self._extract_tags(generation_data.prompt),
                is_public=False
            )
            
            model_id = await db_ops.create_model(model_data, user_id or "anonymous")
            
            # Update model with files
            await db_ops.update_model_files(
                model_id,
                file_urls,
                preview_url,
                {
                    "vertices_count": parameters.get('vertex_count', 0),
                    "faces_count": parameters.get('face_count', 0),
                    "file_size": sum([os.path.getsize(f) for f in temp_files.values() if os.path.exists(f)]) / 1024 / 1024  # MB
                }
            )
            
            # Update generation as completed
            processing_time = time.time() - start_time
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.COMPLETED,
                progress=100,
                model_id=model_id
            )
            
            # Update user model count
            if user_id:
                await db_ops.update_user_model_count(user_id)
            
            # Cleanup temp files
            self.mesh_service.cleanup_temp_files(temp_files)
            
        except Exception as e:
            # Handle errors
            await db_ops.update_generation_status(
                generation_id,
                GenerationStatus.FAILED,
                error_message=str(e)
            )
            
            print(f"❌ Generation failed: {e}")
    
    def _extract_tags(self, prompt: str) -> list:
        """Extract tags from prompt"""
        keywords = ['furniture', 'vehicle', 'animal', 'building', 'nature', 'abstract']
        tags = []
        
        for keyword in keywords:
            if keyword in prompt.lower():
                tags.append(keyword)
        
        return tags[:5]  # Limit to 5 tags
    
    async def get_generation_status(self, generation_id: str) -> Dict[str, Any]:
        """Get generation status"""
        generation = await db_ops.get_generation_by_id(generation_id)
        
        if not generation:
            return {"status": "not_found"}
        
        # Convert ObjectId to string
        generation["id"] = str(generation["_id"])
        del generation["_id"]
        
        return generation

# Global service instance
generation_service = ModelGenerationService()