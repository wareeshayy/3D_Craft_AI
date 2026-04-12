import os
from typing import Optional

class Config:
    # Existing config...
    
    # HuggingFace Configuration
    HUGGINGFACE_API_TOKEN: Optional[str] = os.getenv("HUGGINGFACE_API_TOKEN")
    HUGGINGFACE_API_BASE_URL: str = "https://api-inference.huggingface.co/models"
    
    # Model configurations
    TEXT_TO_3D_MODEL: str = "microsoft/DiT-3D"  # Example model
    IMAGE_TO_3D_MODEL: str = "ashawkey/stable-dreamfusion"  # Example model
    TEXT_GENERATION_MODEL: str = "microsoft/DialoGPT-medium"
    IMAGE_GENERATION_MODEL: str = "runwayml/stable-diffusion-v1-5"
    
    # API Settings
    HUGGINGFACE_TIMEOUT: int = 300  # 5 minutes for 3D generation
    MAX_RETRIES: int = 3
    
    # Cache settings for HF models
    HF_CACHE_DIR: str = os.getenv("HF_CACHE_DIR", "./hf_cache")

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False