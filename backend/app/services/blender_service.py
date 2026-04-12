import bpy
import subprocess
import os
import tempfile
import asyncio
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

class BlenderService:
    def __init__(self, blender_path: str = None):
        # Auto-detect Blender path if not provided
        self.blender_path = blender_path or self._find_blender_executable()
        self.scripts_dir = Path("blender_scripts")
        self.scripts_dir.mkdir(exist_ok=True)
        
        # Verify Blender is available
        if not self._verify_blender():
            raise Exception(f"Blender not found at {self.blender_path}")
    
    def _find_blender_executable(self) -> str:
        """Auto-detect Blender installation"""
        possible_paths = [
            "/usr/bin/blender",  # Linux
            "/Applications/Blender.app/Contents/MacOS/Blender",  # macOS
            "C:\\Program Files\\Blender Foundation\\Blender 3.6\\blender.exe",  # Windows
            "C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe",  # Windows newer
            "blender"  # If in PATH
        ]
        
        for path in possible_paths:
            if os.path.exists(path) or path == "blender":
                try:
                    result = subprocess.run([path, "--version"], 
                                          capture_output=True, text=True, timeout=10)
                    if result.returncode == 0:
                        return path
                except:
                    continue
        
        raise Exception("Blender executable not found. Please install Blender or specify path.")
    
    def _verify_blender(self) -> bool:
        """Verify Blender is working"""
        try:
            result = subprocess.run([self.blender_path, "--version"], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except:
            return False
    
    async def process_model(self, mesh_data: Dict, output_formats: List[str]) -> Dict[str, str]:
        """Process 3D model through Blender pipeline"""
        
        # Run in thread pool to avoid blocking
        return await asyncio.get_event_loop().run_in_executor(
            None, self._process_model_sync, mesh_data, output_formats
        )
    
    def _process_model_sync(self, mesh_data: Dict, output_formats: List[str]) -> Dict[str, str]:
        """Synchronous model processing"""
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create Blender script
            script_path = self.create_blender_script(mesh_data, temp_dir, output_formats)
            
            # Execute Blender headlessly
            cmd = [
                self.blender_path,
                "--background",
                "--python", script_path,
                "--",  # Pass arguments to script
                temp_dir
            ]
            
            print(f"🔄 Running Blender command: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                print(f"❌ Blender stderr: {result.stderr}")
                print(f"❌ Blender stdout: {result.stdout}")
                raise Exception(f"Blender processing failed: {result.stderr}")
            
            print(f"✅ Blender processing completed")
            
            return self.collect_output_files(temp_dir)
    
    def create_blender_script(self, mesh_data: Dict, output_dir: str, formats: List[str]) -> str:
        """Generate Blender Python script for processing"""
        
        # Extract mesh data safely
        vertices = mesh_data.get('vertices', [])
        faces = mesh_data.get('faces', [])
        normals = mesh_data.get('normals', [])
        materials = mesh_data.get('materials', {})
        colors = mesh_data.get('colors', [])
        
        script_content = f'''
import bpy
import bmesh
import os
import sys
import mathutils

def clear_scene():
    """Clear all existing objects"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)
    
    # Clear orphaned data
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block, do_unlink=True)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block, do_unlink=True)

def create_mesh():
    """Create mesh from data"""
    vertices = {vertices}
    faces = {faces}
    normals = {normals}
    
    # Create new mesh
    mesh = bpy.data.meshes.new("GeneratedMesh")
    
    # Create mesh geometry
    if vertices and faces:
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        
        # Add normals if available
        if normals and len(normals) == len(vertices):
            mesh.normals_split_custom_set_from_vertices(normals)
            mesh.use_auto_smooth = True
    else:
        # Fallback: create a simple cube if no valid data
        bpy.ops.mesh.primitive_cube_add()
        return bpy.context.active_object
    
    # Create object
    obj = bpy.data.objects.new("GeneratedModel", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    return obj

def apply_materials(obj):
    """Apply materials to object"""
    materials = {materials}
    colors = {colors}
    
    # Create basic material
    mat = bpy.data.materials.new(name="GeneratedMaterial")
    mat.use_nodes = True
    
    # Clear existing nodes
    mat.node_tree.nodes.clear()
    
    # Add principled BSDF
    bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
    output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    # Set color if available
    if colors:
        color = colors[0] if isinstance(colors[0], list) else [0.7, 0.7, 0.7, 1.0]
        if len(color) == 3:
            color.append(1.0)  # Add alpha
        bsdf.inputs['Base Color'].default_value = color
    else:
        bsdf.inputs['Base Color'].default_value = [0.7, 0.7, 0.7, 1.0]
    
    # Apply material to object
    obj.data.materials.append(mat)

def setup_scene():
    """Setup basic scene with lighting"""
    # Add basic lighting
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 5))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    
    # Set up camera
    bpy.ops.object.camera_add(location=(7, -7, 5))
    camera = bpy.context.active_object
    
    # Point camera at origin
    direction = mathutils.Vector((0, 0, 0)) - camera.location
    camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    
    bpy.context.scene.camera = camera

def export_formats(output_dir, formats):
    """Export in specified formats"""
    output_files = {{}}
    
    for fmt in formats:
        try:
            filepath = os.path.join(output_dir, f"model.{{fmt}}")
            
            if fmt == 'glb':
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    export_format='GLB',
                    export_texcoords=True,
                    export_normals=True,
                    export_materials='EXPORT',
                    export_colors=True,
                    use_selection=False,
                    export_extras=False,
                    export_cameras=False,
                    export_lights=False
                )
                output_files['glb'] = filepath
                
            elif fmt == 'gltf':
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    export_format='GLTF_SEPARATE',
                    export_texcoords=True,
                    export_normals=True,
                    export_materials='EXPORT',
                    export_colors=True,
                    use_selection=False
                )
                output_files['gltf'] = filepath
                
            elif fmt == 'obj':
                bpy.ops.export_scene.obj(
                    filepath=filepath,
                    use_selection=False,
                    use_mesh_modifiers=True,
                    use_smooth_groups=True,
                    use_materials=True
                )
                output_files['obj'] = filepath
                
            elif fmt == 'fbx':
                bpy.ops.export_scene.fbx(
                    filepath=filepath,
                    use_selection=False,
                    global_scale=1.0
                )
                output_files['fbx'] = filepath
                
            elif fmt == 'ply':
                bpy.ops.export_mesh.ply(
                    filepath=filepath,
                    use_selection=False,
                    use_mesh_modifiers=True
                )
                output_files['ply'] = filepath
                
            elif fmt == 'stl':
                bpy.ops.export_mesh.stl(
                    filepath=filepath,
                    use_selection=False,
                    use_mesh_modifiers=True
                )
                output_files['stl'] = filepath
                
            print(f"✅ Exported {{fmt}}: {{filepath}}")
            
        except Exception as e:
            print(f"❌ Failed to export {{fmt}}: {{e}}")
    
    return output_files

# Main execution
def main():
    output_dir = "{output_dir}"
    formats = {formats}
    
    print("🔄 Starting Blender processing...")
    
    # Clear scene
    clear_scene()
    
    # Create mesh
    obj = create_mesh()
    
    # Apply materials
    apply_materials(obj)
    
    # Setup scene
    setup_scene()
    
    # Export formats
    output_files = export_formats(output_dir, formats)
    
    print("✅ Blender processing completed")
    
    # Save file list for collection
    with open(os.path.join(output_dir, "output_files.json"), 'w') as f:
        import json
        json.dump(output_files, f)

if __name__ == "__main__":
    main()
'''
        
        script_path = os.path.join(output_dir, "blender_process.py")
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        return script_path
    
    def collect_output_files(self, temp_dir: str) -> Dict[str, str]:
        """Collect exported files from temporary directory"""
        output_files = {}
        
        # Try to read the file list created by Blender script
        file_list_path = os.path.join(temp_dir, "output_files.json")
        if os.path.exists(file_list_path):
            try:
                with open(file_list_path, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        # Fallback: scan directory for known formats
        known_formats = ['glb', 'gltf', 'obj', 'fbx', 'ply', 'stl']
        
        for fmt in known_formats:
            file_path = os.path.join(temp_dir, f"model.{fmt}")
            if os.path.exists(file_path):
                output_files[fmt] = file_path
        
        return output_files
    
    async def create_model_from_open3d(self, o3d_mesh, output_formats: List[str] = None) -> Dict[str, str]:
        """Convert Open3D mesh to various formats via Blender"""
        
        if output_formats is None:
            output_formats = ['glb', 'obj', 'ply']
        
        # Convert Open3D mesh to Blender-compatible format
        import numpy as np
        
        vertices = np.asarray(o3d_mesh.vertices).tolist()
        triangles = np.asarray(o3d_mesh.triangles).tolist()
        
        normals = []
        if o3d_mesh.has_vertex_normals():
            normals = np.asarray(o3d_mesh.vertex_normals).tolist()
        
        colors = []
        if o3d_mesh.has_vertex_colors():
            colors = np.asarray(o3d_mesh.vertex_colors).tolist()
        
        mesh_data = {
            'vertices': vertices,
            'faces': triangles,
            'normals': normals,
            'colors': colors,
            'materials': {'default': {'color': colors[0] if colors else [0.7, 0.7, 0.7]}}
        }
        
        return await self.process_model(mesh_data, output_formats)

# Global service instance
blender_service = BlenderService()