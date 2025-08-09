# Comprehensive export script for multiple formats
def export_all_formats(output_dir: str, model_name: str):
    formats = {
        'obj': lambda: bpy.ops.export_scene.obj(filepath=f"{output_dir}/{model_name}.obj"),
        'fbx': lambda: bpy.ops.export_scene.fbx(filepath=f"{output_dir}/{model_name}.fbx"),
        'gltf': lambda: bpy.ops.export_scene.gltf(filepath=f"{output_dir}/{model_name}.gltf"),
        'stl': lambda: bpy.ops.export_mesh.stl(filepath=f"{output_dir}/{model_name}.stl"),
        'ply': lambda: bpy.ops.export_mesh.ply(filepath=f"{output_dir}/{model_name}.ply")
    }
    
    for format_name, export_func in formats.items():
        try:
            export_func()
            print(f"✅ Exported {format_name.upper()}")
        except Exception as e:
            print(f"❌ Failed to export {format_name.upper()}: {e}")