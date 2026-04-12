try:
    from .mesh_service import MeshGenerationService
    __all__ = ['MeshGenerationService']
except ImportError as e:
    print(f"Warning: Could not import mesh_service: {e}")
    __all__ = []