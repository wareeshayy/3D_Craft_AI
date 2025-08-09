import torch
from transformers import pipeline, AutoTokenizer, AutoModel
import requests
import json
import numpy as np
from typing import Dict, Any, List
import httpx

class HuggingFaceAIService:
    def __init__(self, hf_token: str = None):
        self.hf_token = hf_token
        self.headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}
        
        # Initialize local models (download once, use offline)
        self.text_processor = pipeline(
            "text-generation", 
            model="microsoft/DialoGPT-medium",
            device=0 if torch.cuda.is_available() else -1
        )
    
    async def enhance_prompt(self, user_prompt: str) -> str:
        """Enhance user prompt for better 3D generation"""
        enhancement_prompt = f"""
        Convert this description into detailed 3D modeling specifications:
        "{user_prompt}"
        
        Include: geometry type, materials, colors, dimensions, style.
        Make it specific and technical.
        """
        
        try:
            # Use local model for enhancement
            result = self.text_processor(
                enhancement_prompt,
                max_length=200,
                num_return_sequences=1,
                temperature=0.7
            )
            return result[0]['generated_text']
        except:
            # Fallback to rule-based enhancement
            return self.rule_based_enhancement(user_prompt)
    
    def rule_based_enhancement(self, prompt: str) -> str:
        """Simple rule-based prompt enhancement"""
        enhancements = {
            'chair': 'wooden chair with four legs, backrest, smooth finish, realistic proportions',
            'table': 'rectangular table with wooden surface, four legs, modern design',
            'car': 'sedan car with four wheels, doors, windows, streamlined body',
            'house': 'residential house with walls, roof, door, windows, foundation',
            'tree': 'deciduous tree with trunk, branches, leaves, natural organic shape',
            'flower': 'flower with petals, stem, leaves, natural colors'
        }
        
        # Simple keyword matching
        for keyword, enhancement in enhancements.items():
            if keyword.lower() in prompt.lower():
                return f"{prompt}. Details: {enhancement}"
        
        return f"{prompt}. 3D model with realistic proportions, appropriate materials, and detailed geometry."
    
    async def generate_mesh_parameters(self, enhanced_prompt: str) -> Dict[str, Any]:
        """Generate 3D mesh parameters from enhanced prompt"""
        
        # Extract keywords for procedural generation
        parameters = {
            'geometry_type': self.detect_geometry_type(enhanced_prompt),
            'materials': self.detect_materials(enhanced_prompt),
            'colors': self.detect_colors(enhanced_prompt),
            'scale': self.detect_scale(enhanced_prompt),
            'complexity': self.detect_complexity(enhanced_prompt)
        }
        
        return parameters
    
    def detect_geometry_type(self, prompt: str) -> str:
        """Detect primary geometry type"""
        if any(word in prompt.lower() for word in ['chair', 'table', 'furniture']):
            return 'furniture'
        elif any(word in prompt.lower() for word in ['car', 'vehicle', 'bike']):
            return 'vehicle'
        elif any(word in prompt.lower() for word in ['house', 'building', 'structure']):
            return 'architecture'
        elif any(word in prompt.lower() for word in ['tree', 'plant', 'flower']):
            return 'organic'
        else:
            return 'generic'
    
    def detect_materials(self, prompt: str) -> List[str]:
        """Detect materials from prompt"""
        materials = []
        if 'wood' in prompt.lower():
            materials.append('wood')
        if 'metal' in prompt.lower():
            materials.append('metal')
        if 'glass' in prompt.lower():
            materials.append('glass')
        if 'plastic' in prompt.lower():
            materials.append('plastic')
        
        return materials if materials else ['default']
    
    def detect_colors(self, prompt: str) -> List[str]:
        """Detect colors from prompt"""
        colors = ['red', 'blue', 'green', 'yellow', 'brown', 'black', 'white']
        detected = [color for color in colors if color in prompt.lower()]
        return detected if detected else ['brown']
    
    def detect_scale(self, prompt: str) -> str:
        """Detect object scale"""
        if any(word in prompt.lower() for word in ['small', 'tiny', 'mini']):
            return 'small'
        elif any(word in prompt.lower() for word in ['large', 'big', 'huge']):
            return 'large'
        else:
            return 'medium'
    
    def detect_complexity(self, prompt: str) -> str:
        """Detect desired complexity level"""
        if any(word in prompt.lower() for word in ['simple', 'basic', 'minimal']):
            return 'low'
        elif any(word in prompt.lower() for word in ['detailed', 'complex', 'intricate']):
            return 'high'
        else:
            return 'medium'