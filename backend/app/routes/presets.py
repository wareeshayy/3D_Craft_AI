from fastapi import APIRouter
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/presets")
async def get_presets():
    """Get available styles and quality presets"""
    try:
        presets = {
            "styles": [
                "realistic",
                "cartoon", 
                "abstract",
                "sci-fi",
                "organic",
                "geometric",
                "minimalist",
                "detailed"
            ],
            "qualities": [
                "low",
                "medium", 
                "high",
                "ultra"
            ],
            "environments": [
                "daylight",
                "forest",
                "garden", 
                "landscape",
                "indoor",
                "studio",
                "night",
                "sunset"
            ],
            "formats": [
                "glb",
                "gltf",
                "obj",
                "ply"
            ]
        }
        
        logger.info("📋 Presets requested")
        return presets
        
    except Exception as e:
        logger.error(f"❌ Error getting presets: {e}")
        return {
            "styles": ["realistic", "cartoon", "abstract", "sci-fi"],
            "qualities": ["low", "medium", "high"]
        }

@router.get("/presets/prompts")
async def get_preset_prompts():
    """Get predefined prompts for quick generation"""
    try:
        preset_prompts = {
            "nature": [
                "A serene Japanese garden with cherry blossoms and a koi pond",
                "Ancient oak tree with twisted branches and moss",
                "Tropical paradise with palm trees and crystal clear water",
                "Mountain landscape with snow-capped peaks and alpine meadows",
                "Enchanted forest with magical glowing mushrooms"
            ],
            "architecture": [
                "Modern minimalist house with glass walls",
                "Gothic cathedral with flying buttresses",
                "Futuristic skyscraper with curved glass facade",
                "Cozy cottage with thatched roof and garden",
                "Ancient temple ruins overgrown with vines"
            ],
            "objects": [
                "Vintage steampunk mechanical clockwork",
                "Crystal geode with rainbow refractions", 
                "Ornate wooden treasure chest with gold details",
                "Sleek modern smartphone with holographic display",
                "Antique brass telescope on wooden tripod"
            ],
            "characters": [
                "Friendly cartoon robot with LED eyes",
                "Majestic dragon with iridescent scales",
                "Cute forest creature with big eyes",
                "Warrior knight in shining armor",
                "Mystical wizard with flowing robes"
            ]
        }
        
        logger.info("💡 Preset prompts requested")
        return preset_prompts
        
    except Exception as e:
        logger.error(f"❌ Error getting preset prompts: {e}")
        return {"error": "Could not load preset prompts"}

@router.get("/presets/styles/{style_name}")
async def get_style_details(style_name: str):
    """Get detailed information about a specific style"""
    try:
        style_details = {
            "realistic": {
                "name": "Realistic",
                "description": "Photorealistic 3D models with accurate materials and lighting",
                "examples": ["Architectural visualization", "Product design", "Scientific models"],
                "renderTime": "5-15 minutes",
                "complexity": "High"
            },
            "cartoon": {
                "name": "Cartoon",
                "description": "Stylized, colorful models perfect for games and animation",
                "examples": ["Game assets", "Children's content", "Animation"],
                "renderTime": "2-8 minutes", 
                "complexity": "Medium"
            },
            "abstract": {
                "name": "Abstract",
                "description": "Artistic and experimental 3D forms",
                "examples": ["Art installations", "Conceptual design", "Creative projects"],
                "renderTime": "3-10 minutes",
                "complexity": "Variable"
            },
            "sci-fi": {
                "name": "Sci-Fi",
                "description": "Futuristic and technological aesthetic",
                "examples": ["Spaceships", "Robots", "Future cities"],
                "renderTime": "4-12 minutes",
                "complexity": "High"
            }
        }
        
        if style_name not in style_details:
            raise HTTPException(status_code=404, detail="Style not found")
        
        logger.info(f"🎨 Style details requested for: {style_name}")
        return style_details[style_name]
        
    except Exception as e:
        logger.error(f"❌ Error getting style details: {e}")
        raise HTTPException(status_code=500, detail=str(e))