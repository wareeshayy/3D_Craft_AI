# test_bpy.py
try:
    import bpy
    print("✅ bpy imported successfully!")
    print(f"Blender version: {bpy.app.version_string}")
    
    # Test basic functionality
    bpy.ops.mesh.primitive_cube_add()
    print("✅ Basic Blender operations working!")
    
except ImportError as e:
    print(f"❌ Failed to import bpy: {e}")
except Exception as e:
    print(f"❌ Error during bpy operations: {e}")