from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        from bson import ObjectId
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# User Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    is_active: bool
    created_at: datetime
    subscription_tier: str = "free"
    total_models: int = 0
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Model3D Schemas
class Model3DCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    prompt: str = Field(..., min_length=3)
    style: str = "realistic"
    complexity: str = "medium"
    tags: List[str] = []
    is_public: bool = False

class Model3DResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: Optional[str]
    prompt: str
    owner_id: str
    style: str
    complexity: str
    tags: List[str]
    is_public: bool
    created_at: datetime
    
    # File information
    files: Dict[str, str] = {}
    preview_image: Optional[str] = None
    
    # Model statistics
    vertices_count: Optional[int] = None
    faces_count: Optional[int] = None
    file_size: Optional[float] = None
    download_count: int = 0
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Generation Schemas
class GenerationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerationCreate(BaseModel):
    prompt: str = Field(..., min_length=3)
    style: str = "realistic"
    complexity: str = "medium"
    formats: List[str] = ["obj", "ply"]

class GenerationResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: Optional[str] = None
    model_id: Optional[str] = None
    prompt: str
    enhanced_prompt: Optional[str] = None
    status: GenerationStatus
    progress: float = 0.0
    error_message: Optional[str] = None
    
    # Processing details
    ai_service_used: str = "huggingface"
    processing_time: Optional[float] = None
    
    # Timestamps
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# API Usage Schema
class APIUsage(BaseModel):
    id: str = Field(alias="_id")
    user_id: Optional[str] = None
    endpoint: str
    method: str
    processing_time: float
    tokens_used: int = 0
    cost: float = 0.0
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }