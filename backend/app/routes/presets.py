from fastapi import APIRouter, HTTPException
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
        return {"success": True, "data": presets}
        
    except Exception as e:
        logger.error(f"❌ Error getting presets: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "Could not retrieve presets",
                "fallback": {
                    "styles": ["realistic", "cartoon", "abstract", "sci-fi"],
                    "qualities": ["low", "medium", "high"]
                }
            }
        )

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
            ],
            "vehicles": [
                "Retro flying car with chrome details",
                "Steampunk airship with brass fittings",
                "Futuristic hover bike with neon lights",
                "Vintage locomotive with coal tender",
                "Space shuttle with detailed cockpit"
            ],
            "fantasy": [
                "Magical crystal cave with glowing formations",
                "Floating island with waterfalls",
                "Ancient dragon's treasure hoard",
                "Mystical portal with swirling energy",
                "Enchanted library with floating books"
            ]
        }
        
        logger.info("💡 Preset prompts requested")
        return {"success": True, "data": preset_prompts}
        
    except Exception as e:
        logger.error(f"❌ Error getting preset prompts: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "Could not load preset prompts"
            }
        )

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
                "complexity": "High",
                "recommended_quality": "high",
                "suitable_formats": ["glb", "gltf", "obj"]
            },
            "cartoon": {
                "name": "Cartoon",
                "description": "Stylized, colorful models perfect for games and animation",
                "examples": ["Game assets", "Children's content", "Animation"],
                "renderTime": "2-8 minutes", 
                "complexity": "Medium",
                "recommended_quality": "medium",
                "suitable_formats": ["glb", "gltf"]
            },
            "abstract": {
                "name": "Abstract",
                "description": "Artistic and experimental 3D forms",
                "examples": ["Art installations", "Conceptual design", "Creative projects"],
                "renderTime": "3-10 minutes",
                "complexity": "Variable",
                "recommended_quality": "medium",
                "suitable_formats": ["obj", "ply", "glb"]
            },
            "sci-fi": {
                "name": "Sci-Fi",
                "description": "Futuristic and technological aesthetic",
                "examples": ["Spaceships", "Robots", "Future cities"],
                "renderTime": "4-12 minutes",
                "complexity": "High",
                "recommended_quality": "high",
                "suitable_formats": ["glb", "gltf", "obj"]
            },
            "organic": {
                "name": "Organic",
                "description": "Natural, flowing forms inspired by biology and nature",
                "examples": ["Plants", "Animals", "Natural structures"],
                "renderTime": "6-14 minutes",
                "complexity": "High",
                "recommended_quality": "high",
                "suitable_formats": ["glb", "obj"]
            },
            "geometric": {
                "name": "Geometric",
                "description": "Clean, mathematical shapes and patterns",
                "examples": ["Architectural elements", "Logos", "Abstract art"],
                "renderTime": "1-5 minutes",
                "complexity": "Low",
                "recommended_quality": "medium",
                "suitable_formats": ["obj", "ply", "glb"]
            },
            "minimalist": {
                "name": "Minimalist",
                "description": "Simple, clean designs with focus on essential elements",
                "examples": ["Modern furniture", "Simple objects", "Clean architecture"],
                "renderTime": "1-6 minutes",
                "complexity": "Low",
                "recommended_quality": "medium",
                "suitable_formats": ["obj", "glb"]
            },
            "detailed": {
                "name": "Detailed",
                "description": "High-detail models with intricate features and textures",
                "examples": ["Jewelry", "Mechanical parts", "Ornate decorations"],
                "renderTime": "8-20 minutes",
                "complexity": "Very High",
                "recommended_quality": "ultra",
                "suitable_formats": ["glb", "gltf"]
            }
        }
        
        if style_name.lower() not in style_details:
            available_styles = list(style_details.keys())
            raise HTTPException(
                status_code=404, 
                detail={
                    "error": "Style not found",
                    "message": f"Style '{style_name}' is not available",
                    "available_styles": available_styles
                }
            )
        
        logger.info(f"🎨 Style details requested for: {style_name}")
        return {
            "success": True,
            "data": style_details[style_name.lower()]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting style details: {e}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Internal server error",
                "message": f"Could not retrieve style details for '{style_name}'"
            }
        )

@router.get("/presets/combinations")
async def get_preset_combinations():
    """Get recommended style and quality combinations"""
    try:
        combinations = {
            "beginner_friendly": [
                {"style": "cartoon", "quality": "medium", "format": "glb"},
                {"style": "geometric", "quality": "medium", "format": "obj"},
                {"style": "minimalist", "quality": "low", "format": "obj"}
            ],
            "high_quality": [
                {"style": "realistic", "quality": "ultra", "format": "gltf"},
                {"style": "detailed", "quality": "ultra", "format": "glb"},
                {"style": "organic", "quality": "high", "format": "glb"}
            ],
            "fast_generation": [
                {"style": "geometric", "quality": "low", "format": "obj"},
                {"style": "minimalist", "quality": "medium", "format": "ply"},
                {"style": "cartoon", "quality": "low", "format": "glb"}
            ],
            "artistic": [
                {"style": "abstract", "quality": "medium", "format": "obj"},
                {"style": "organic", "quality": "high", "format": "ply"},
                {"style": "sci-fi", "quality": "high", "format": "gltf"}
            ]
        }
        
        logger.info("🔄 Preset combinations requested")
        return {"success": True, "data": combinations}
        
    except Exception as e:
        logger.error(f"❌ Error getting preset combinations: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "Could not retrieve preset combinations"
            }
        )

@router.get("/presets/validate")
async def validate_preset_combination(style: str, quality: str, format: str):
    """Validate if a preset combination is supported"""
    try:
        valid_styles = ["realistic", "cartoon", "abstract", "sci-fi", "organic", "geometric", "minimalist", "detailed"]
        valid_qualities = ["low", "medium", "high", "ultra"]
        valid_formats = ["glb", "gltf", "obj", "ply"]
        
        validation_result = {
            "valid": True,
            "warnings": [],
            "recommendations": []
        }
        
        # Validate individual parameters
        if style.lower() not in valid_styles:
            validation_result["valid"] = False
            validation_result["warnings"].append(f"Invalid style: {style}")
            
        if quality.lower() not in valid_qualities:
            validation_result["valid"] = False
            validation_result["warnings"].append(f"Invalid quality: {quality}")
            
        if format.lower() not in valid_formats:
            validation_result["valid"] = False
            validation_result["warnings"].append(f"Invalid format: {format}")
        
        # Add recommendations for valid combinations
        if validation_result["valid"]:
            if style.lower() == "detailed" and quality.lower() in ["low", "medium"]:
                validation_result["recommendations"].append("Consider using 'high' or 'ultra' quality for detailed style")
                
            if style.lower() == "realistic" and format.lower() == "ply":
                validation_result["recommendations"].append("GLB or GLTF formats work better with realistic style")
                
            if quality.lower() == "ultra" and style.lower() in ["geometric", "minimalist"]:
                validation_result["recommendations"].append("Ultra quality may be overkill for simple geometric styles")
        
        logger.info(f"✅ Validation requested for: {style}/{quality}/{format}")
        return {"success": True, "data": validation_result}
        
    except Exception as e:
        logger.error(f"❌ Error validating preset combination: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "Could not validate preset combination"
            }
        )