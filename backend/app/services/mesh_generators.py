import open3d as o3d
import pymeshlab
import numpy as np
import os
import struct
import json
import base64
from typing import Dict, Any, List, Tuple
from pathlib import Path
import tempfile

class MeshGenerationService:
    def __init__(self):
        self.temp_dir = Path("temp_models")
        self.temp_dir.mkdir(exist_ok=True)
        
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
        
        # Export to multiple formats including GLB
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
    
    def create_generic_furniture(self, params: Dict[str, Any]) -> o3d.geometry.TriangleMesh:
        """Create generic furniture"""
        return o3d.geometry.TriangleMesh.create_box(width=1, height=1, depth=1)
    
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
    
    def create_glb_file(self, mesh: o3d.geometry.TriangleMesh, output_path: str) -> None:
        """Create a proper GLB file from Open3D mesh"""
        
        vertices = np.asarray(mesh.vertices)
        triangles = np.asarray(mesh.triangles)
        normals = np.asarray(mesh.vertex_normals) if mesh.has_vertex_normals() else None
        colors = np.asarray(mesh.vertex_colors) if mesh.has_vertex_colors() else None
        
        # Ensure we have valid triangles (multiple of 3 vertices)
        if len(vertices) % 3 != 0:
            # Pad vertices if necessary
            while len(vertices) % 3 != 0:
                vertices = np.append(vertices, [vertices[-1]], axis=0)
                if normals is not None:
                    normals = np.append(normals, [normals[-1]], axis=0)
                if colors is not None:
                    colors = np.append(colors, [colors[-1]], axis=0)
        
        # Calculate bounding box
        min_bounds = vertices.min(axis=0)
        max_bounds = vertices.max(axis=0)
        
        # Create binary data
        vertex_data = vertices.astype(np.float32).tobytes()
        index_data = triangles.flatten().astype(np.uint32).tobytes()
        
        if normals is not None:
            normal_data = normals.astype(np.float32).tobytes()
        else:
            normal_data = b''
        
        if colors is not None:
            color_data = colors.astype(np.float32).tobytes()
        else:
            color_data = b''
        
        # Create glTF JSON structure
        gltf_json = {
            "asset": {
                "generator": "3DCraft AI",
                "version": "2.0"
            },
            "scene": 0,
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0}],
            "meshes": [{
                "primitives": [{
                    "attributes": {
                        "POSITION": 0
                    },
                    "indices": 1,
                    "mode": 4  # TRIANGLES
                }]
            }],
            "accessors": [
                {
                    # Position accessor
                    "bufferView": 0,
                    "componentType": 5126,  # FLOAT
                    "count": len(vertices),
                    "type": "VEC3",
                    "min": min_bounds.tolist(),
                    "max": max_bounds.tolist()
                },
                {
                    # Index accessor
                    "bufferView": 1,
                    "componentType": 5125,  # UNSIGNED_INT
                    "count": len(triangles) * 3,
                    "type": "SCALAR"
                }
            ],
            "bufferViews": [
                {
                    # Position buffer view
                    "buffer": 0,
                    "byteOffset": 0,
                    "byteLength": len(vertex_data),
                    "target": 34962  # ARRAY_BUFFER
                },
                {
                    # Index buffer view
                    "buffer": 0,
                    "byteOffset": len(vertex_data),
                    "byteLength": len(index_data),
                    "target": 34963  # ELEMENT_ARRAY_BUFFER
                }
            ],
            "buffers": [{
                "byteLength": len(vertex_data) + len(index_data)
            }]
        }
        
        # Add normals if available
        if normals is not None:
            gltf_json["meshes"][0]["primitives"][0]["attributes"]["NORMAL"] = 2
            gltf_json["accessors"].append({
                "bufferView": 2,
                "componentType": 5126,  # FLOAT
                "count": len(normals),
                "type": "VEC3"
            })
            gltf_json["bufferViews"].append({
                "buffer": 0,
                "byteOffset": len(vertex_data) + len(index_data),
                "byteLength": len(normal_data),
                "target": 34962  # ARRAY_BUFFER
            })
            gltf_json["buffers"][0]["byteLength"] += len(normal_data)
        
        # Convert JSON to bytes
        json_str = json.dumps(gltf_json, separators=(',', ':'))
        json_bytes = json_str.encode('utf-8')
        
        # Pad JSON to 4-byte boundary
        json_padding = (4 - (len(json_bytes) % 4)) % 4
        json_bytes += b' ' * json_padding
        
        # Create binary data
        binary_data = vertex_data + index_data
        if normals is not None:
            binary_data += normal_data
        
        # Pad binary data to 4-byte boundary
        bin_padding = (4 - (len(binary_data) % 4)) % 4
        binary_data += b'\x00' * bin_padding
        
        # GLB header
        glb_header = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(json_bytes) + 8 + len(binary_data))
        
        # JSON chunk
        json_chunk_header = struct.pack('<II', len(json_bytes), 0x4E4F534A)  # JSON
        
        # BIN chunk
        bin_chunk_header = struct.pack('<II', len(binary_data), 0x004E4942)  # BIN
        
        # Write GLB file
        with open(output_path, 'wb') as f:
            f.write(glb_header)
            f.write(json_chunk_header)
            f.write(json_bytes)
            f.write(bin_chunk_header)
            f.write(binary_data)
    
    async def export_mesh(self, mesh: o3d.geometry.TriangleMesh, params: Dict[str, Any]) -> Dict[str, str]:
        """Export mesh to multiple formats including GLB"""
        
        model_id = params.get('model_id', 'temp_model')
        output_dir = self.temp_dir / model_id
        output_dir.mkdir(exist_ok=True)
        
        formats = {
            'obj': 'model.obj',
            'ply': 'model.ply',
            'stl': 'model.stl',
            'glb': 'model.glb'  # Added GLB support
        }
        
        file_paths = {}
        
        for format_name, filename in formats.items():
            file_path = output_dir / filename
            
            try:
                if format_name == 'glb':
                    # Use our custom GLB writer
                    self.create_glb_file(mesh, str(file_path))
                else:
                    # Use Open3D for other formats
                    o3d.io.write_triangle_mesh(str(file_path), mesh)
                
                file_paths[format_name] = str(file_path)
            except Exception as e:
                print(f"Failed to export {format_name}: {e}")
        
        return file_paths