# app/__init__.py
"""
3DCraft AI Application Package
"""

__version__ = "1.0.0"

# app/services/__init__.py  
"""
3DCraft AI Services Package
Contains all service modules for 3D generation
"""

# Import services for easier access
try:
    from .mesh_service import mesh_service, MeshService
    __all__ = ['mesh_service', 'MeshService']
except ImportError as e:
    print(f"Warning: Could not import mesh_service: {e}")
    __all__ = []

# app/routes/__init__.py
"""
3DCraft AI Routes Package  
Contains all API route modules
"""

# Import routers for easier access
try:
    from .generation import router as generation_router
    from .health import router as health_router
    
    __all__ = ['generation_router', 'health_router']
except ImportError as e:
    print(f"Warning: Could not import routers: {e}")
    __all__ = []