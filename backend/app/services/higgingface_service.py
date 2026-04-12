import requests
import asyncio
import aiohttp
from typing import Dict, Any, Optional, Union, List
import base64
import io
from PIL import Image
import json
import time
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class HuggingFaceService:
    def __init__(self, config: Config):
        self.config = config
        self.api_token = config.HUGGINGFACE_API_TOKEN
        self.base_url = config.HUGGINGFACE_API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
    async def _make_request(self, model_name: str, payload: Dict[str, Any], 
                          timeout: int = None) -> Dict[str, Any]:
        """Make async request to HuggingFace API"""
        url = f"{self.base_url}/{model_name}"
        timeout = timeout or self.config.HUGGINGFACE_TIMEOUT
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            for attempt in range(self.config.MAX_RETRIES):
                try:
                    async with session.post(url, json=payload, headers=self.headers) as response:
                        if response.status == 200:
                            return await response.json()
                        elif response.status == 503:
                            # Model is loading, wait and retry
                            wait_time = 2 ** attempt
                            logger.info(f"Model loading, waiting {wait_time}s before retry {attempt + 1}")
                            await asyncio.sleep(wait_time)
                        else:
                            error_text = await response.text()
                            raise Exception(f"API Error {response.status}: {error_text}")
                except asyncio.TimeoutError:
                    if attempt == self.config.MAX_RETRIES - 1:
                        raise Exception("Request timed out after all retries")
                    await asyncio.sleep(2 ** attempt)
        
        raise Exception("Failed after all retries")

    async def text_to_3d(self, prompt: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate 3D model from text prompt"""
        try:
            payload = {
                "inputs": prompt,
                "parameters": parameters or {
                    "num_inference_steps": 50,
                    "guidance_scale": 7.5,
                    "resolution": 256
                }
            }
            
            logger.info(f"Generating 3D model from prompt: {prompt}")
            result = await self._make_request(self.config.TEXT_TO_3D_MODEL, payload)
            
            # Process the result - this depends on the specific model output format
            return {
                "status": "success",
                "model_data": result,
                "prompt": prompt,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Text-to-3D generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "prompt": prompt
            }

    async def image_to_3d(self, image_data: Union[str, bytes], parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Convert 2D image to 3D model"""
        try:
            # Handle different input formats
            if isinstance(image_data, str):
                # Assume base64 encoded image
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
                
            # Convert to base64 for API
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            payload = {
                "inputs": image_b64,
                "parameters": parameters or {
                    "num_inference_steps": 64,
                    "guidance_scale": 3.0,
                    "num_views": 4
                }
            }
            
            logger.info("Converting image to 3D model")
            result = await self._make_request(self.config.IMAGE_TO_3D_MODEL, payload)
            
            return {
                "status": "success",
                "model_data": result,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Image-to-3D conversion failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def generate_text_description(self, prompt: str, max_length: int = 150) -> Dict[str, Any]:
        """Generate enhanced text descriptions for 3D prompts"""
        try:
            payload = {
                "inputs": f"Enhance this 3D model description: {prompt}",
                "parameters": {
                    "max_length": max_length,
                    "temperature": 0.7,
                    "do_sample": True,
                    "top_p": 0.9
                }
            }
            
            result = await self._make_request(self.config.TEXT_GENERATION_MODEL, payload)
            
            # Extract generated text
            generated_text = result[0]['generated_text'] if result else prompt
            
            return {
                "status": "success",
                "original_prompt": prompt,
                "enhanced_prompt": generated_text,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Text generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "fallback_prompt": prompt
            }

    async def generate_reference_image(self, prompt: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate reference images for 3D modeling"""
        try:
            payload = {
                "inputs": prompt,
                "parameters": parameters or {
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "width": 512,
                    "height": 512
                }
            }
            
            logger.info(f"Generating reference image for: {prompt}")
            result = await self._make_request(self.config.IMAGE_GENERATION_MODEL, payload)
            
            # Handle binary image response
            if isinstance(result, bytes):
                image_b64 = base64.b64encode(result).decode('utf-8')
                return {
                    "status": "success",
                    "image_data": image_b64,
                    "format": "base64",
                    "prompt": prompt,
                    "timestamp": time.time()
                }
            
            return {
                "status": "success",
                "image_data": result,
                "prompt": prompt,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "prompt": prompt
            }

    async def generate_texture(self, description: str, size: tuple = (512, 512)) -> Dict[str, Any]:
        """Generate textures for 3D models"""
        try:
            texture_prompt = f"seamless texture, {description}, tileable, high quality, PBR material"
            
            payload = {
                "inputs": texture_prompt,
                "parameters": {
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "width": size[0],
                    "height": size[1]
                }
            }
            
            result = await self._make_request(self.config.IMAGE_GENERATION_MODEL, payload)
            
            if isinstance(result, bytes):
                texture_b64 = base64.b64encode(result).decode('utf-8')
                return {
                    "status": "success",
                    "texture_data": texture_b64,
                    "format": "base64",
                    "description": description,
                    "size": size,
                    "timestamp": time.time()
                }
                
            return {
                "status": "success",
                "texture_data": result,
                "description": description,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Texture generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "description": description
            }

    def health_check(self) -> Dict[str, Any]:
        """Check if HuggingFace API is accessible"""
        try:
            # Simple request to check API accessibility
            response = requests.get(
                f"{self.base_url}/bert-base-uncased",
                headers={"Authorization": f"Bearer {self.api_token}"},
                timeout=10
            )
            return {
                "status": "healthy" if response.status_code in [200, 503] else "unhealthy",
                "api_accessible": True,
                "timestamp": time.time()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "api_accessible": False,
                "error": str(e),
                "timestamp": time.time()
            }