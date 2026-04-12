import open3d as o3d
import pymeshlab
import numpy as np
import os
from typing import Dict, Any, List, Tuple
from pathlib import Path
import tempfile


class MeshGenerationService:
    def __init__(self):
        self.temp_dir = Path("temp_models")
        self.temp_dir.mkdir(exist_ok=True)
        
        # Try to import BlenderService
        try:
            from .blender_service import blender_service
            self.blender_service = blender_service
            self.has_blender = True
            print("✅ Blender service available - GLB export enabled")
        except ImportError:
            self.blender_service = None
            self.has_blender = False
            print("⚠️ Blender service not available - GLB export disabled")
        
        # Predefined geometry generators
        self.generators = {
            'furniture': self.generate_furniture,
            'vehicle': self.generate_vehicle,
            'architecture': self.generate_architecture,
            'organic': self.generate_organic,
            'generic': self.generate_generic
        }
    
    async def generate_3d_model(self, parameters: Dict[str, Any]) -> Dict[str, str]:
        """Main 3D model generation function"""
        
        geometry_type = parameters.get('geometry_type', 'generic')
        
        # Generate base mesh
        mesh = self.generators[geometry_type](parameters)
        
        # Process mesh
        processed_mesh = self.process_mesh(mesh, parameters)
        
        # Export to multiple formats
        file_paths = await self.export_mesh(processed_mesh, parameters)
        
        return file_paths
    
    def generate_furniture(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Generate furniture (chair, table, etc.)"""
        
        if 'chair' in params.get('original_prompt', '').lower():
            return self.create_chair(params)
        elif 'table' in params.get('original_prompt', '').lower():
            return self.create_table(params)
        else:
            return self.create_generic_furniture(params)
    
    def create_chair(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create a procedural chair"""
        
        # Chair seat (box)
        seat = o3d.geometry.TriangleMesh.create_box(width=0.5, height=0.05, depth=0.5)
        seat.translate([0, 0.4, 0])
        
        # Chair back
        back = o3d.geometry.TriangleMesh.create_box(width=0.5, height=0.6, depth=0.05)
        back.translate([0, 0.7, -0.225])
        
        # Chair legs (4 cylinders)
        legs = []
        positions = [(-0.2, 0, -0.2), (0.2, 0, -0.2), (-0.2, 0, 0.2), (0.2, 0, 0.2)]
        
        for pos in positions:
            leg = o3d.geometry.TriangleMesh.create_cylinder(radius=0.02, height=0.4)
            leg.translate([pos[0], 0.2, pos[2]])
            legs.append(leg)
        
        # Combine all parts
        chair = seat + back
        for leg in legs:
            chair += leg
        
        # Apply materials and colors
        chair = self.apply_material_colors(chair, params)
        
        return chair
    
    def create_table(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create a procedural table"""
        
        # Table top
        top = o3d.geometry.TriangleMesh.create_box(width=1.2, height=0.05, depth=0.8)
        top.translate([0, 0.7, 0])
        
        # Table legs
        legs = []
        positions = [(-0.5, 0, -0.35), (0.5, 0, -0.35), (-0.5, 0, 0.35), (0.5, 0, 0.35)]
        
        for pos in positions:
            leg = o3d.geometry.TriangleMesh.create_cylinder(radius=0.03, height=0.7)
            leg.translate([pos[0], 0.35, pos[2]])
            legs.append(leg)
        
        # Combine parts
        table = top
        for leg in legs:
            table += leg
        
        table = self.apply_material_colors(table, params)
        
        return table
    
    def create_generic_furniture(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create generic furniture"""
        return o3d.geometry.TriangleMesh.create_box(width=1, height=1, depth=1)
    
    def generate_vehicle(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Generate vehicle-like objects"""
        
        # Simple car body (elongated box)
        body = o3d.geometry.TriangleMesh.create_box(width=0.8, height=0.3, depth=2.0)
        body.translate([0, 0.15, 0])
        
        # Car roof (smaller box)
        roof = o3d.geometry.TriangleMesh.create_box(width=0.6, height=0.2, depth=1.0)
        roof.translate([0, 0.4, 0])
        
        # Wheels (4 cylinders)
        wheels = []
        positions = [(-0.3, 0, -0.7), (0.3, 0, -0.7), (-0.3, 0, 0.7), (0.3, 0, 0.7)]
        
        for pos in positions:
            wheel = o3d.geometry.TriangleMesh.create_cylinder(radius=0.15, height=0.1)
            wheel.translate([pos[0], 0.15, pos[2]])
            wheels.append(wheel)
        
        # Combine parts
        car = body + roof
        for wheel in wheels:
            car += wheel
        
        car = self.apply_material_colors(car, params)
        
        return car
    
    def generate_organic(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Generate organic shapes (trees, flowers, etc.)"""
        
        if 'tree' in params.get('original_prompt', '').lower():
            return self.create_tree(params)
        else:
            return self.create_organic_shape(params)
    
    def create_tree(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create a simple tree"""
        
        # Tree trunk (cylinder)
        trunk = o3d.geometry.TriangleMesh.create_cylinder(radius=0.1, height=1.0)
        trunk.translate([0, 0.5, 0])
        
        # Tree crown (sphere)
        crown = o3d.geometry.TriangleMesh.create_sphere(radius=0.5)
        crown.translate([0, 1.2, 0])
        
        # Combine parts
        tree = trunk + crown
        
        # Apply green color for leaves, brown for trunk
        tree = self.apply_material_colors(tree, params, trunk_indices=len(trunk.vertices))
        
        return tree
    
    def create_organic_shape(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create generic organic shape"""
        return o3d.geometry.TriangleMesh.create_sphere(radius=0.5)
    
    def generate_architecture(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Generate architectural objects"""
        return o3d.geometry.TriangleMesh.create_box(width=2, height=3, depth=1)
    
    def generate_generic(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Generate generic shapes"""
        
        complexity = params.get('complexity', 'medium')
        
        if complexity == 'low':
            return o3d.geometry.TriangleMesh.create_box(width=1, height=1, depth=1)
        elif complexity == 'high':
            return o3d.geometry.TriangleMesh.create_icosphere(radius=0.5, resolution=3)
        else:
            return o3d.geometry.TriangleMesh.create_sphere(radius=0.5)
    
    def apply_material_colors(self, mesh: o3d.geometry.TriangleMesh, params: Dict[str, Any], trunk_indices: int = None) -> o3d.geometry.TriangleMesh:
        """Apply colors based on detected materials"""
        
        colors = params.get('colors', ['brown'])
        materials = params.get('materials', ['default'])
        
        # Color mapping
        color_map = {
            'red': [1.0, 0.0, 0.0],
            'blue': [0.0, 0.0, 1.0],
            'green': [0.0, 1.0, 0.0],
            'yellow': [1.0, 1.0, 0.0],
            'brown': [0.6, 0.3, 0.1],
            'black': [0.1, 0.1, 0.1],
            'white': [1.0, 1.0, 1.0],
            'default': [0.7, 0.7, 0.7]
        }
        
        primary_color = color_map.get(colors[0], color_map['default'])
        
        # Apply uniform color
        mesh.paint_uniform_color(primary_color)
        
        return mesh
    
    def process_mesh(self, mesh: o3d.geometry.TriangleMesh, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Process mesh (smoothing, subdivision, etc.)"""
        
        # Remove duplicated vertices
        mesh.remove_duplicated_vertices()
        
        # Remove degenerate triangles
        mesh.remove_degenerate_triangles()
        
        # Compute normals
        mesh.compute_vertex_normals()
        mesh.compute_triangle_normals()
        
        # Optional: subdivide for higher quality
        complexity = params.get('complexity', 'medium')
        if complexity == 'high':
            mesh = mesh.subdivide_midpoint(number_of_iterations=1)
        
        return mesh
    
    async def export_mesh(self, mesh: o3d.geometry.TriangleMesh, params: Dict[str, Any]) -> Dict[str, str]:
        """Export mesh to multiple formats with Blender GLB support"""
        
        model_id = params.get('model_id', 'temp_model')
        output_dir = self.temp_dir / model_id
        output_dir.mkdir(exist_ok=True)
        
        # Define all desired formats
        all_formats = ['obj', 'ply', 'stl', 'glb']
        
        file_paths = {}
        
        # Use Blender for GLB if available
        if self.has_blender and 'glb' in all_formats:
            try:
                print("🔄 Using Blender for GLB export...")
                blender_files = await self.blender_service.create_model_from_open3d(
                    mesh, 
                    ['glb']
                )
                
                # Copy GLB file to our output directory
                if 'glb' in blender_files:
                    import shutil
                    source_glb = blender_files['glb']
                    target_glb = output_dir / 'model.glb'
                    
                    if os.path.exists(source_glb):
                        shutil.copy2(source_glb, target_glb)
                        file_paths['glb'] = str(target_glb)
                        print(f"✅ GLB exported via Blender: {target_glb}")
                    else:
                        print(f"⚠️ Blender GLB file not found: {source_glb}")
                
            except Exception as e:
                print(f"⚠️ Blender GLB export failed: {e}")
                print("Falling back to Open3D export (no GLB)")
        
        # Use Open3D for other formats
        open3d_formats = {
            'obj': 'model.obj',
            'ply': 'model.ply', 
            'stl': 'model.stl'
        }
        
        for format_name, filename in open3d_formats.items():
            file_path = output_dir / filename
            
            try:
                success = o3d.io.write_triangle_mesh(str(file_path), mesh)
                
                if success and os.path.exists(file_path):
                    file_paths[format_name] = str(file_path)
                    print(f"✅ {format_name.upper()} exported: {file_path}")
                else:
                    print(f"❌ Failed to export {format_name}")
                    
            except Exception as e:
                print(f"❌ Failed to export {format_name}: {e}")
        
        # Add file statistics
        file_paths['_stats'] = self._get_file_stats(file_paths, mesh)
        
        return file_paths
    
    def _get_file_stats(self, file_paths: Dict[str, str], mesh: o3d.geometry.TriangleMesh) -> Dict[str, Any]:
        """Get statistics about generated files"""
        
        stats = {
            'vertex_count': len(mesh.vertices),
            'triangle_count': len(mesh.triangles),
            'has_normals': mesh.has_vertex_normals(),
            'has_colors': mesh.has_vertex_colors(),
            'files': {}
        }
        
        for format_name, file_path in file_paths.items():
            if format_name.startswith('_'):
                continue
                
            try:
                if os.path.exists(file_path):
                    size = os.path.getsize(file_path)
                    stats['files'][format_name] = {
                        'size_bytes': size,
                        'size_kb': round(size / 1024, 2),
                        'path': file_path
                    }
            except Exception as e:
                print(f"⚠️ Error getting stats for {file_path}: {e}")
        
        return stats
    
    async def cleanup_temp_files(self, file_paths: Dict[str, str]):
        """Clean up temporary files"""
        for format_name, file_path in file_paths.items():
            if format_name.startswith('_'):
                continue
                
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"🗑️ Cleaned up: {file_path}")
            except Exception as e:
                print(f"⚠️ Failed to cleanup {file_path}: {e}")
        
        # Try to remove empty directories
        try:
            for format_name, file_path in file_paths.items():
                if format_name.startswith('_'):
                    continue
                    
                dir_path = os.path.dirname(file_path)
                if os.path.exists(dir_path) and not os.listdir(dir_path):
                    os.rmdir(dir_path)
                    print(f"🗑️ Cleaned up directory: {dir_path}")
                    break
        except Exception as e:
            print(f"⚠️ Failed to cleanup directory: {e}")
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported export formats"""
        formats = ['obj', 'ply', 'stl']
        
        if self.has_blender:
            formats.append('glb')
            
        return formats
    # At the end of mesh_service.py
mesh_service = MeshGenerationService()