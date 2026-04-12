from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from pathlib import Path
from app.core.config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="3DCraft AI API",
    description="AI-powered 3D model generation service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:3001",  # Alternative React port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8080",  # Simple HTTP server
        "http://127.0.0.1:8080",
        "https://your-frontend-domain.com",  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
def create_directories():
    """Create required directories for uploads and outputs"""
    directories = ["uploads", "outputs", "temp"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        logger.info(f"📁 Directory ensured: {directory}")

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting 3DCraft AI Backend...")
    create_directories()
    logger.info("✅ 3DCraft AI Backend startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down 3DCraft AI Backend...")

@app.get("/")
async def root():
    return {
        "message": "🎨 3DCraft AI API is running!",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/api/health",
            "docs": "/docs",
            "generation": "/api/generate/text-to-3d",
            "job_status": "/api/jobs/{job_id}/status",
            "download": "/api/jobs/{job_id}/download",
            "upload": "/api/upload/model",
            "presets": "/api/presets",
            "auth": "/api/auth",
            "models": "/api/models"
        }
    }

# Import and include routers after app creation
try:
    from app.routes.health import router as health_router
    app.include_router(health_router, prefix="/api", tags=["health"])
    logger.info("✅ Health router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load health router: {e}")

try:
    from app.routes.generation import router as generation_router
    app.include_router(generation_router, prefix="/api", tags=["generation"])
    logger.info("✅ Generation router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load generation router: {e}")

# Add new routers for frontend integration
try:
    from app.routes.jobs import router as jobs_router
    app.include_router(jobs_router, prefix="/api", tags=["jobs"])
    logger.info("✅ Jobs router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load jobs router: {e}")

try:
    from app.routes.upload import router as upload_router
    app.include_router(upload_router, prefix="/api", tags=["upload"])
    logger.info("✅ Upload router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load upload router: {e}")

try:
    from app.routes.presets import router as presets_router
    app.include_router(presets_router, prefix="/api", tags=["presets"])
    logger.info("✅ Presets router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load presets router: {e}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "status": 404}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {"error": "Internal server error", "status": 500}

@app.get("/debug/services")
async def debug_services():
    try:
        from app.services.mesh_service import mesh_service
        return {"mesh_service": "imported successfully"}
    except ImportError as e:
        return {"error": f"Import failed: {e}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
