from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription_tier = Column(String, default="free")  # free, pro, enterprise
    
    # Relationships
    models = relationship("Model3D", back_populates="owner")
    generations = relationship("Generation", back_populates="user")

class Model3D(Base):
    __tablename__ = "models"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    description = Column(Text)
    prompt = Column(Text)  # Original user prompt
    owner_id = Column(String, ForeignKey("users.id"))
    
    # Model Properties
    vertices_count = Column(Integer)
    faces_count = Column(Integer)
    file_size = Column(Float)  # In MB
    complexity_score = Column(Float)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    tags = Column(JSON)  # ["nature", "organic", "furniture"]
    style = Column(String)  # "realistic", "cartoon", "abstract"
    
    # File Information
    files = Column(JSON)  # {"obj": "url", "fbx": "url", "gltf": "url"}
    preview_image = Column(String)  # URL to preview image
    
    # Relationships
    owner = relationship("User", back_populates="models")
    generation = relationship("Generation", back_populates="model")

class Generation(Base):
    __tablename__ = "generations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    model_id = Column(String, ForeignKey("models.id"))
    
    # Generation Details
    prompt = Column(Text)
    enhanced_prompt = Column(Text)  # AI-enhanced version
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0-100
    
    # Processing Info
    ai_service_used = Column(String)  # "openai", "stability", etc.
    processing_time = Column(Float)  # In seconds
    error_message = Column(Text)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="generations")
    model = relationship("Model3D", back_populates="generation")

class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    endpoint = Column(String)
    method = Column(String)
    tokens_used = Column(Integer, default=0)
    processing_time = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    cost = Column(Float, default=0.0)  # In USD