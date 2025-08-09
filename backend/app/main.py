from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting 3DCraft AI Backend...")

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
            "generation": "/api/generate",
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
    app.include_router(generation_router, prefix="/api/generate", tags=["generation"])
    logger.info("✅ Generation router loaded")
except ImportError as e:
    logger.warning(f"⚠️ Could not load generation router: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)