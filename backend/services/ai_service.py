import openai
import requests
import json
from typing import Dict, Any, Optional
from fastapi import HTTPException

class AIService:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
    
    async def generate_3d_description(self, user_prompt: str) -> Dict[str, Any]:
        """Enhanced 3D model description using GPT-4"""
        system_prompt = """
        You are a 3D modeling expert. Convert user descriptions into detailed 3D model specifications.
        Return JSON with: geometry, materials, lighting, animations, dimensions.
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def generate_3d_mesh(self, description: Dict[str, Any]) -> str:
        """Generate 3D mesh data from description"""
        # Integration with 3D generation API (OpenAI's future 3D API or alternatives)
        # For now, return structured mesh data
        return self.create_procedural_mesh(description)