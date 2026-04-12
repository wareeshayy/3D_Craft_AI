try:
    from .health import router as health_router
    from .jobs import router as jobs_router
    from .upload import router as upload_router  
    from .presets import router as presets_router
    # Skip generation for now due to BOM error
    __all__ = ['health_router', 'jobs_router', 'upload_router', 'presets_router']
except ImportError as e:
    print(f"Warning: Could not import routers: {e}")
    __all__ = []