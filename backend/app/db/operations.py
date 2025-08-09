from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.schemas import (
    UserCreate, UserResponse, 
    Model3DCreate, Model3DResponse,
    GenerationCreate, GenerationResponse,
    GenerationStatus
)
from .connection import get_database

class DatabaseOperations:
    def __init__(self):
        self.db: AsyncIOMotorDatabase = get_database()
    
    # User Operations
    async def create_user(self, user_data: UserCreate, hashed_password: str) -> str:
        """Create a new user"""
        
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "subscription_tier": "free",
            "total_models": 0
        }
        
        result = await self.db.users.insert_one(user_doc)
        return str(result.inserted_id)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return await self.db.users.find_one({"email": email})
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"_id": ObjectId(user_id)})
    
    async def update_user_model_count(self, user_id: str, increment: int = 1):
        """Update user's model count"""
        await self.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"total_models": increment}}
        )
    
    # Model Operations
    async def create_model(self, model_data: Model3DCreate, owner_id: str) -> str:
        """Create a new 3D model record"""
        
        model_doc = {
            "name": model_data.name,
            "description": model_data.description,
            "prompt": model_data.prompt,
            "owner_id": owner_id,
            "style": model_data.style,
            "complexity": model_data.complexity,
            "tags": model_data.tags,
            "is_public": model_data.is_public,
            "created_at": datetime.utcnow(),
            
            # File information (will be updated after generation)
            "files": {},
            "preview_image": None,
            
            # Model statistics
            "vertices_count": None,
            "faces_count": None,
            "file_size": None,
            "download_count": 0
        }
        
        result = await self.db.models.insert_one(model_doc)
        return str(result.inserted_id)
    
    async def update_model_files(
        self, 
        model_id: str, 
        files: Dict[str, str], 
        preview_image: str,
        stats: Optional[Dict] = None
    ):
        """Update model with generated files"""
        
        update_data = {
            "files": files,
            "preview_image": preview_image,
            "updated_at": datetime.utcnow()
        }
        
        if stats:
            update_data.update(stats)
        
        await self.db.models.update_one(
            {"_id": ObjectId(model_id)},
            {"$set": update_data}
        )
    
    async def get_model_by_id(self, model_id: str) -> Optional[Dict]:
        """Get model by ID"""
        return await self.db.models.find_one({"_id": ObjectId(model_id)})
    
    async def get_user_models(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Dict]:
        """Get user's models with pagination"""
        
        cursor = self.db.models.find(
            {"owner_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def get_public_models(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get public models"""
        
        cursor = self.db.models.find(
            {"is_public": True}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def increment_download_count(self, model_id: str):
        """Increment model download count"""
        await self.db.models.update_one(
            {"_id": ObjectId(model_id)},
            {"$inc": {"download_count": 1}}
        )
    
    async def delete_model(self, model_id: str, user_id: str) -> bool:
        """Delete a model (only by owner)"""
        
        result = await self.db.models.delete_one({
            "_id": ObjectId(model_id),
            "owner_id": user_id
        })
        
        return result.deleted_count > 0
    
    # Generation Operations
    async def create_generation(
        self, 
        generation_data: GenerationCreate, 
        user_id: Optional[str] = None
    ) -> str:
        """Create a new generation record"""
        
        generation_doc = {
            "user_id": user_id,
            "model_id": None,  # Will be set after model creation
            "prompt": generation_data.prompt,
            "enhanced_prompt": None,
            "status": GenerationStatus.PENDING.value,
            "progress": 0.0,
            "error_message": None,
            
            # Processing details
            "ai_service_used": "huggingface",
            "processing_time": None,
            
            # Timestamps
            "started_at": datetime.utcnow(),
            "completed_at": None,
            
            # Generation parameters
            "style": generation_data.style,
            "complexity": generation_data.complexity,
            "formats": generation_data.formats
        }
        
        result = await self.db.generations.insert_one(generation_doc)
        return str(result.inserted_id)
    
    async def update_generation_status(
        self,
        generation_id: str,
        status: GenerationStatus,
        progress: float = None,
        error_message: str = None,
        enhanced_prompt: str = None,
        model_id: str = None
    ):
        """Update generation status"""
        
        update_data = {"status": status.value}
        
        if progress is not None:
            update_data["progress"] = progress
        
        if error_message:
            update_data["error_message"] = error_message
        
        if enhanced_prompt:
            update_data["enhanced_prompt"] = enhanced_prompt
        
        if model_id:
            update_data["model_id"] = model_id
        
        if status == GenerationStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()
        
        await self.db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": update_data}
        )
    
    async def get_generation_by_id(self, generation_id: str) -> Optional[Dict]:
        """Get generation by ID"""
        return await self.db.generations.find_one({"_id": ObjectId(generation_id)})
    
    async def get_user_generations(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[Dict]:
        """Get user's generations"""
        
        cursor = self.db.generations.find(
            {"user_id": user_id}
        ).sort("started_at", -1).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    # Analytics Operations
    async def log_api_usage(
        self,
        user_id: Optional[str],
        endpoint: str,
        method: str,
        processing_time: float,
        tokens_used: int = 0
    ):
        """Log API usage for analytics"""
        
        usage_doc = {
            "user_id": user_id,
            "endpoint": endpoint,
            "method": method,
            "processing_time": processing_time,
            "tokens_used": tokens_used,
            "cost": 0.0,  # Calculate based on your pricing
            "timestamp": datetime.utcnow()
        }
        
        await self.db.api_usage.insert_one(usage_doc)
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        
        # Count models
        total_models = await self.db.models.count_documents({"owner_id": user_id})
        
        # Count generations
        total_generations = await self.db.generations.count_documents({"user_id": user_id})
        
        # Get recent activity
        recent_models = await self.db.models.find(
            {"owner_id": user_id}
        ).sort("created_at", -1).limit(5).to_list(length=5)
        
        return {
            "total_models": total_models,
            "total_generations": total_generations,
            "recent_models": recent_models
        }

# Global database operations instance
db_ops = DatabaseOperations()