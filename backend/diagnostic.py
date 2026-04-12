#!/usr/bin/env python3
"""
3DCraft AI Import Diagnostic Script
This script helps diagnose import issues and file structure problems
"""

import os
import sys
from pathlib import Path
import importlib.util
import ast

def check_file_structure():
    """Check the expected file structure"""
    print("🔍 CHECKING FILE STRUCTURE...")
    print("=" * 50)
    
    expected_files = [
        "main.py",
        "app/__init__.py",
        "app/routes/__init__.py",
        "app/routes/generation.py",
        "app/routes/jobs.py",
        "app/routes/health.py",
        "app/routes/upload.py",
        "app/routes/presets.py",
        "app/services/__init__.py",
        "app/services/mesh_service.py",
        "app/services/mesh_generators.py", 
        "app/services/generation_service.py",
        "app/services/blender_service.py"
    ]
    
    missing_files = []
    existing_files = []
    
    for file_path in expected_files:
        if os.path.exists(file_path):
            existing_files.append(file_path)
            print(f"✅ {file_path}")
        else:
            missing_files.append(file_path)
            print(f"❌ {file_path}")
    
    print(f"\n📊 SUMMARY: {len(existing_files)} files found, {len(missing_files)} missing")
    
    if missing_files:
        print(f"\n⚠️  MISSING FILES:")
        for file in missing_files:
            print(f"   - {file}")
    
    return existing_files, missing_files

def analyze_imports(file_path):
    """Analyze imports in a Python file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(f"import {alias.name}")
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    imports.append(f"from {module} import {alias.name}")
        
        return imports
    except Exception as e:
        print(f"❌ Error analyzing {file_path}: {e}")
        return []

def check_router_imports():
    """Check what each router imports"""
    print("\n🔍 CHECKING ROUTER IMPORTS...")
    print("=" * 50)
    
    routers = [
        "app/routes/generation.py",
        "app/routes/jobs.py", 
        "app/routes/upload.py"
    ]
    
    for router_path in routers:
        if os.path.exists(router_path):
            print(f"\n📄 {router_path}:")
            imports = analyze_imports(router_path)
            service_imports = [imp for imp in imports if 'service' in imp.lower()]
            
            if service_imports:
                for imp in service_imports:
                    print(f"  ✅ {imp}")
            else:
                print(f"  ⚠️  No service imports found!")
        else:
            print(f"\n❌ {router_path} not found")

def check_service_files():
    """Check service files and their key functions"""
    print("\n🔍 CHECKING SERVICE FILES...")
    print("=" * 50)
    
    services = [
        "app/services/mesh_service.py",
        "app/services/mesh_generators.py",
        "app/services/generation_service.py", 
        "app/services/blender_service.py"
    ]
    
    for service_path in services:
        if os.path.exists(service_path):
            print(f"\n📄 {service_path}:")
            try:
                with open(service_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Look for key function definitions
                tree = ast.parse(content)
                functions = []
                classes = []
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        functions.append(node.name)
                    elif isinstance(node, ast.ClassDef):
                        classes.append(node.name)
                
                if classes:
                    print(f"  📝 Classes: {', '.join(classes)}")
                if functions:
                    key_functions = [f for f in functions if any(keyword in f.lower() 
                                   for keyword in ['generate', 'create', 'mesh', 'glb', 'export'])]
                    if key_functions:
                        print(f"  🔧 Key Functions: {', '.join(key_functions)}")
                
            except Exception as e:
                print(f"  ❌ Error reading file: {e}")
        else:
            print(f"\n❌ {service_path} not found")

def check_python_path():
    """Check Python path and module loading"""
    print("\n🔍 CHECKING PYTHON PATH...")
    print("=" * 50)
    
    print("Current working directory:", os.getcwd())
    print("Python path includes:")
    for path in sys.path[:5]:  # Show first 5 paths
        print(f"  - {path}")
    
    # Try to import key modules
    modules_to_test = [
        "app",
        "app.services",
        "app.routes"
    ]
    
    print("\n🧪 TESTING MODULE IMPORTS...")
    for module_name in modules_to_test:
        try:
            spec = importlib.util.find_spec(module_name)
            if spec:
                print(f"  ✅ {module_name} - found at {spec.origin}")
            else:
                print(f"  ❌ {module_name} - not found")
        except Exception as e:
            print(f"  ❌ {module_name} - error: {e}")

def generate_fix_suggestions(missing_files):
    """Generate suggestions to fix issues"""
    print("\n🛠️  SUGGESTED FIXES...")
    print("=" * 50)
    
    if missing_files:
        print("1. CREATE MISSING FILES:")
        for file_path in missing_files:
            if file_path.endswith("__init__.py"):
                print(f"   touch {file_path}")
            else:
                print(f"   # Create {file_path} with appropriate content")
    
    print("\n2. ENSURE PROPER IMPORTS IN ROUTERS:")
    print("   Make sure your route files import the services they need:")
    print("   ```python")
    print("   # In app/routes/generation.py")
    print("   from app.services.mesh_service import MeshService")
    print("   from app.services.generation_service import GenerationService")
    print("   ```")
    
    print("\n3. CHECK SERVICE IMPLEMENTATIONS:")
    print("   Ensure your service files have the correct functions:")
    print("   - mesh_service.py: create_mesh(), export_glb()")
    print("   - generation_service.py: generate_3d_model()")
    print("   - mesh_generators.py: generate_primitive_mesh()")
    
    print("\n4. RESTART THE APPLICATION:")
    print("   After making changes, restart your FastAPI server:")
    print("   uvicorn main:app --reload")

def main():
    """Run all diagnostics"""
    print("🚀 3DCraft AI DIAGNOSTIC TOOL")
    print("=" * 50)
    
    existing_files, missing_files = check_file_structure()
    check_router_imports()
    check_service_files()
    check_python_path()
    generate_fix_suggestions(missing_files)
    
    print("\n" + "=" * 50)
    print("✅ DIAGNOSTIC COMPLETE!")
    print("\nIf issues persist after following suggestions:")
    print("1. Check your service file implementations")
    print("2. Verify the glTF generation code")
    print("3. Test individual service functions")

if __name__ == "__main__":
    main()