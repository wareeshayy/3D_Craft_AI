import bpy
import subprocess
import os
import tempfile
from pathlib import Path

class BlenderService:
    def __init__(self, blender_path: str = "/usr/bin/blender"):
        self.blender_path = blender_path
        self.scripts_dir = Path("blender_scripts")
    
    async def process_model(self, mesh_data: Dict, output_formats: List[str]) -> Dict[str, str]:
        """Process 3D model through Blender pipeline"""
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create Blender script
            script_path = self.create_blender_script(mesh_data, temp_dir, output_formats)
            
            # Execute Blender headlessly
            cmd = [
                self.blender_path,
                "--background",
                "--python", script_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Blender processing failed: {result.stderr}")
            
            return self.collect_output_files(temp_dir)
    
    def create_blender_script(self, mesh_data: Dict, output_dir: str, formats: List[str]) -> str:
        """Generate Blender Python script for processing"""
        script_content = f"""
import bpy
import bmesh
import os

# Clear existing mesh
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Create mesh from data
mesh_data = {mesh_data}
mesh = bpy.data.meshes.new("generated_mesh")
obj = bpy.data.objects.new("GeneratedModel", mesh)

# Add to scene
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# Create mesh geometry
bm = bmesh.new()
# Add vertices, faces, etc. from mesh_data
bm.to_mesh(mesh)
bm.free()

# Apply materials
{self.generate_material_script(mesh_data.get('materials', {}))}

# Setup lighting
{self.generate_lighting_script()}

# Export in multiple formats
output_dir = "{output_dir}"
{''.join([self.generate_export_script(fmt, output_dir) for fmt in formats])}
"""
        
        script_path = os.path.join(output_dir, "process_model.py")
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        return script_path