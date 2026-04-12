import torch
from transformers import pipeline, AutoTokenizer, AutoModel
import requests
import json
import numpy as np
from typing import Dict, Any, List, Optional, Union
import httpx
import asyncio
import aiohttp
import base64
import io
from PIL import Image
import time
import logging

logger = logging.getLogger(__name__)

class HuggingFaceAIService:
    def __init__(self, hf_token: str = None):
        self.hf_token = hf_token
        self.headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}
        self.api_base_url = "https://api-inference.huggingface.co/models"
        
        # Updated model configurations for best free 3D APIs
        self.models = {
            # 3D Generation Models (Free APIs)
            'text_to_3d': "stabilityai/stable-diffusion-2-1",  # Free via HF
            'image_to_3d': "ashawkey/stable-dreamfusion",  # Free via HF
            'instantmesh': "ashawkey/instantmesh",  # Free via HF
            'trellis': "microsoft/trellis",  # Free via HF
            
            # Chatbot Models (Free)
            'chatbot': "microsoft/DialoGPT-medium",  # Free chatbot
            'llama_chat': "meta-llama/Llama-3.1-8B-Instruct",  # Free via HF
            'mistral_chat': "mistralai/Mistral-7B-Instruct-v0.2",  # Free via HF
            
            # Image/Texture Generation
            'image_generation': "runwayml/stable-diffusion-v1-5",
            'texture_generation': "runwayml/stable-diffusion-v1-5",
            'text_generation': "microsoft/DialoGPT-medium"
        }
        
        # Initialize local models (download once, use offline)
        try:
            self.text_processor = pipeline(
                "text-generation", 
                model=self.models['text_generation'],
                device=0 if torch.cuda.is_available() else -1
            )
        except Exception as e:
            logger.warning(f"Failed to load local text processor: {e}")
            self.text_processor = None
    
    # ==================== EXISTING METHODS ====================
    
    async def enhance_prompt(self, user_prompt: str) -> str:
        """Enhanced version of your existing prompt enhancement"""
        enhancement_prompt = f"""
        Convert this description into detailed 3D modeling specifications:
        "{user_prompt}"
        
        Include: geometry type, materials, colors, dimensions, style.
        Make it specific and technical for 3D generation.
        """
        
        try:
            # Try HuggingFace API first for better results
            if self.hf_token:
                hf_result = await self._generate_text_via_api(enhancement_prompt)
                if hf_result:
                    return hf_result
            
            # Fallback to local model
            if self.text_processor:
                result = self.text_processor(
                    enhancement_prompt,
                    max_length=200,
                    num_return_sequences=1,
                    temperature=0.7
                )
                return result[0]['generated_text']
        except Exception as e:
            logger.warning(f"AI enhancement failed: {e}")
        
        # Final fallback to rule-based enhancement
        return self.rule_based_enhancement(user_prompt)
    
    def rule_based_enhancement(self, prompt: str) -> str:
        """Enhanced rule-based prompt enhancement with more categories"""
        enhancements = {
            # Furniture
            'chair': 'ergonomic wooden chair with four legs, curved backrest, smooth finish, realistic proportions, detailed joints',
            'table': 'rectangular wooden table with smooth surface, four sturdy legs, modern minimalist design, proper scale',
            'sofa': 'comfortable three-seat sofa with cushions, fabric upholstery, wooden frame, realistic proportions',
            
            # Vehicles
            'car': 'modern sedan car with four wheels, doors, windows, headlights, streamlined aerodynamic body, detailed chassis',
            'bike': 'mountain bike with frame, two wheels, handlebars, pedals, chain, detailed components',
            
            # Architecture
            'house': 'two-story residential house with walls, sloped roof, door, windows, chimney, foundation, detailed facade',
            'building': 'modern office building with glass windows, concrete structure, multiple floors, architectural details',
            
            # Organic
            'tree': 'deciduous tree with detailed bark texture, branching structure, full canopy of leaves, natural organic shape',
            'flower': 'detailed flower with layered petals, visible stamen, green stem, natural leaves, realistic colors',
            'plant': 'potted plant with detailed leaves, visible root system, organic growth pattern, natural textures',
            
            # Animals
            'dog': 'realistic dog with fur texture, four legs, tail, detailed facial features, proportional anatomy',
            'cat': 'domestic cat with soft fur, whiskers, detailed eyes, graceful proportions, natural pose',
            
            # Objects
            'lamp': 'table lamp with shade, base, cord, switch, realistic materials and proportions',
            'bottle': 'glass bottle with smooth surface, cap, label, transparent material, realistic reflections',
            'book': 'closed book with cover, pages, spine, realistic thickness and proportions'
        }
        
        # Enhanced keyword matching with context
        enhanced_prompt = prompt
        for keyword, enhancement in enhancements.items():
            if keyword.lower() in prompt.lower():
                enhanced_prompt = f"{prompt}. 3D Specifications: {enhancement}"
                break
        
        if enhanced_prompt == prompt:  # No specific match found
            enhanced_prompt = f"{prompt}. 3D model requirements: realistic proportions, appropriate materials, detailed geometry, proper scaling, professional quality finish."
        
        return enhanced_prompt
    
    async def generate_mesh_parameters(self, enhanced_prompt: str) -> Dict[str, Any]:
        """Enhanced mesh parameters with more detailed analysis"""
        parameters = {
            'geometry_type': self.detect_geometry_type(enhanced_prompt),
            'materials': self.detect_materials(enhanced_prompt),
            'colors': self.detect_colors(enhanced_prompt),
            'scale': self.detect_scale(enhanced_prompt),
            'complexity': self.detect_complexity(enhanced_prompt),
            'style': self.detect_style(enhanced_prompt),
            'lighting': self.detect_lighting_hints(enhanced_prompt),
            'texture_details': self.detect_texture_requirements(enhanced_prompt)
        }
        
        return parameters
    
    # Enhanced detection methods
    def detect_geometry_type(self, prompt: str) -> str:
        """Enhanced geometry type detection"""
        categories = {
            'furniture': ['chair', 'table', 'sofa', 'bed', 'desk', 'cabinet', 'shelf'],
            'vehicle': ['car', 'truck', 'bike', 'motorcycle', 'bus', 'plane', 'boat'],
            'architecture': ['house', 'building', 'tower', 'bridge', 'castle', 'church'],
            'organic': ['tree', 'plant', 'flower', 'leaf', 'branch', 'grass'],
            'character': ['person', 'human', 'animal', 'dog', 'cat', 'bird'],
            'object': ['bottle', 'cup', 'lamp', 'book', 'phone', 'computer'],
            'weapon': ['sword', 'gun', 'knife', 'bow', 'shield'],
            'food': ['apple', 'cake', 'bread', 'pizza', 'fruit']
        }
        
        for category, keywords in categories.items():
            if any(word in prompt.lower() for word in keywords):
                return category
        return 'generic'
    
    def detect_materials(self, prompt: str) -> List[str]:
        """Enhanced material detection"""
        material_keywords = {
            'wood': ['wood', 'wooden', 'timber', 'oak', 'pine', 'mahogany'],
            'metal': ['metal', 'steel', 'iron', 'aluminum', 'copper', 'brass'],
            'glass': ['glass', 'crystal', 'transparent', 'clear'],
            'plastic': ['plastic', 'polymer', 'synthetic'],
            'fabric': ['fabric', 'cloth', 'textile', 'cotton', 'leather'],
            'stone': ['stone', 'marble', 'granite', 'concrete', 'brick'],
            'ceramic': ['ceramic', 'porcelain', 'clay'],
            'rubber': ['rubber', 'elastic', 'flexible']
        }
        
        detected_materials = []
        for material, keywords in material_keywords.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                detected_materials.append(material)
        
        return detected_materials if detected_materials else ['default']
    
    def detect_colors(self, prompt: str) -> List[str]:
        """Enhanced color detection"""
        colors = {
            'red': ['red', 'crimson', 'scarlet', 'ruby'],
            'blue': ['blue', 'navy', 'azure', 'cyan'],
            'green': ['green', 'emerald', 'lime', 'forest'],
            'yellow': ['yellow', 'gold', 'amber', 'lemon'],
            'brown': ['brown', 'tan', 'beige', 'chocolate'],
            'black': ['black', 'dark', 'ebony'],
            'white': ['white', 'ivory', 'pearl', 'snow'],
            'gray': ['gray', 'grey', 'silver', 'ash'],
            'orange': ['orange', 'coral', 'peach'],
            'purple': ['purple', 'violet', 'lavender', 'magenta'],
            'pink': ['pink', 'rose', 'salmon']
        }
        
        detected_colors = []
        for color, keywords in colors.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                detected_colors.append(color)
        
        return detected_colors if detected_colors else ['natural']
    
    def detect_scale(self, prompt: str) -> str:
        """Enhanced scale detection"""
        scale_indicators = {
            'tiny': ['tiny', 'miniature', 'micro', 'small-scale'],
            'small': ['small', 'compact', 'mini', 'little'],
            'medium': ['medium', 'standard', 'normal', 'regular'],
            'large': ['large', 'big', 'oversized', 'giant'],
            'huge': ['huge', 'massive', 'enormous', 'gigantic']
        }
        
        for scale, keywords in scale_indicators.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                return scale
        return 'medium'
    
    def detect_complexity(self, prompt: str) -> str:
        """Enhanced complexity detection"""
        complexity_indicators = {
            'low': ['simple', 'basic', 'minimal', 'plain', 'clean'],
            'medium': ['standard', 'normal', 'moderate', 'regular'],
            'high': ['detailed', 'complex', 'intricate', 'elaborate', 'ornate'],
            'ultra': ['ultra-detailed', 'hyper-realistic', 'photorealistic', 'highly-detailed']
        }
        
        for level, keywords in complexity_indicators.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                return level
        return 'medium'
    
    def detect_style(self, prompt: str) -> str:
        """Detect artistic/design style"""
        styles = {
            'modern': ['modern', 'contemporary', 'minimalist', 'sleek'],
            'vintage': ['vintage', 'retro', 'classic', 'antique'],
            'industrial': ['industrial', 'mechanical', 'steampunk'],
            'organic': ['organic', 'natural', 'flowing', 'curved'],
            'geometric': ['geometric', 'angular', 'sharp', 'cubic'],
            'realistic': ['realistic', 'photorealistic', 'lifelike'],
            'stylized': ['stylized', 'cartoon', 'animated', 'artistic'],
            'futuristic': ['futuristic', 'sci-fi', 'cyberpunk', 'high-tech']
        }
        
        for style, keywords in styles.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                return style
        return 'realistic'
    
    def detect_lighting_hints(self, prompt: str) -> str:
        """Detect lighting preferences"""
        if any(word in prompt.lower() for word in ['bright', 'sunny', 'illuminated']):
            return 'bright'
        elif any(word in prompt.lower() for word in ['dark', 'shadowy', 'dim']):
            return 'dark'
        elif any(word in prompt.lower() for word in ['warm', 'golden']):
            return 'warm'
        elif any(word in prompt.lower() for word in ['cool', 'blue']):
            return 'cool'
        return 'neutral'
    
    def detect_texture_requirements(self, prompt: str) -> List[str]:
        """Detect texture requirements"""
        textures = []
        texture_keywords = {
            'smooth': ['smooth', 'polished', 'glossy'],
            'rough': ['rough', 'textured', 'bumpy'],
            'soft': ['soft', 'plush', 'fuzzy'],
            'hard': ['hard', 'solid', 'firm'],
            'shiny': ['shiny', 'reflective', 'metallic'],
            'matte': ['matte', 'flat', 'non-reflective']
        }
        
        for texture, keywords in texture_keywords.items():
            if any(keyword in prompt.lower() for keyword in keywords):
                textures.append(texture)
        
        return textures if textures else ['standard']
    
    # ==================== NEW 3D AI FEATURES ====================
    
    async def _make_api_request(self, model_name: str, payload: Dict[str, Any], timeout: int = 300) -> Optional[Dict[str, Any]]:
        """Make async request to HuggingFace API with retry logic"""
        url = f"{self.api_base_url}/{model_name}"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout)) as session:
            for attempt in range(3):  # 3 retries
                try:
                    async with session.post(url, json=payload, headers=self.headers) as response:
                        if response.status == 200:
                            return await response.json()
                        elif response.status == 503:
                            # Model is loading, wait and retry
                            wait_time = 2 ** attempt * 10  # 10s, 20s, 40s
                            logger.info(f"Model loading, waiting {wait_time}s before retry {attempt + 1}")
                            await asyncio.sleep(wait_time)
                        else:
                            error_text = await response.text()
                            logger.error(f"API Error {response.status}: {error_text}")
                            if attempt == 2:  # Last attempt
                                return None
                except asyncio.TimeoutError:
                    logger.warning(f"Request timeout on attempt {attempt + 1}")
                    if attempt == 2:
                        return None
                    await asyncio.sleep(2 ** attempt * 5)
        return None
    
    async def _generate_text_via_api(self, prompt: str, max_length: int = 150) -> Optional[str]:
        """Generate text using HuggingFace API"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_length": max_length,
                "temperature": 0.7,
                "do_sample": True,
                "top_p": 0.9
            }
        }
        
        result = await self._make_api_request(self.models['text_generation'], payload)
        if result and len(result) > 0:
            return result[0].get('generated_text', prompt)
        return None
    
    async def text_to_3d_generation(self, prompt: str, enhance: bool = True) -> Dict[str, Any]:
        """Generate 3D model from text prompt"""
        try:
            # Step 1: Enhance the prompt if requested
            final_prompt = prompt
            if enhance:
                enhanced = await self.enhance_prompt(prompt)
                final_prompt = enhanced
            
            # Step 2: Generate mesh parameters
            mesh_params = await self.generate_mesh_parameters(final_prompt)
            
            # Step 3: Try HuggingFace API for actual 3D generation
            if self.hf_token and self.models['text_to_3d']:
                payload = {
                    "inputs": final_prompt,
                    "parameters": {
                        "num_inference_steps": 50,
                        "guidance_scale": 7.5,
                        "resolution": 256
                    }
                }
                
                api_result = await self._make_api_request(self.models['text_to_3d'], payload)
                if api_result:
                    return {
                        "status": "success",
                        "method": "huggingface_api",
                        "original_prompt": prompt,
                        "enhanced_prompt": final_prompt,
                        "mesh_parameters": mesh_params,
                        "model_data": api_result,
                        "timestamp": time.time()
                    }
            
            # Fallback: Return enhanced parameters for procedural generation
            return {
                "status": "success",
                "method": "procedural_parameters",
                "original_prompt": prompt,
                "enhanced_prompt": final_prompt,
                "mesh_parameters": mesh_params,
                "message": "Ready for procedural 3D generation",
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Text-to-3D generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "original_prompt": prompt
            }
    
    async def image_to_3d_conversion(self, image_data: Union[str, bytes], description: Optional[str] = None) -> Dict[str, Any]:
        """Convert 2D image to 3D model"""
        try:
            # Handle different input formats
            if isinstance(image_data, str):
                # Assume base64 encoded image
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Analyze the image to generate parameters
            analysis = await self._analyze_image_for_3d(image_bytes, description)
            
            # Try HuggingFace API for image-to-3D
            if self.hf_token and self.models['image_to_3d']:
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {
                    "inputs": image_b64,
                    "parameters": {
                        "num_inference_steps": 64,
                        "guidance_scale": 3.0,
                        "num_views": 4
                    }
                }
                
                api_result = await self._make_api_request(self.models['image_to_3d'], payload, timeout=400)
                if api_result:
                    return {
                        "status": "success",
                        "method": "huggingface_api",
                        "image_analysis": analysis,
                        "model_data": api_result,
                        "description": description,
                        "timestamp": time.time()
                    }
            
            # Fallback: Return analysis for procedural generation
            return {
                "status": "success",
                "method": "image_analysis",
                "image_analysis": analysis,
                "description": description,
                "message": "Image analyzed, ready for procedural 3D conversion",
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Image-to-3D conversion failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def _analyze_image_for_3d(self, image_bytes: bytes, description: Optional[str]) -> Dict[str, Any]:
        """Analyze image to extract 3D generation parameters"""
        try:
            # Open and analyze the image
            image = Image.open(io.BytesIO(image_bytes))
            
            analysis = {
                "dimensions": image.size,
                "mode": image.mode,
                "format": image.format or "unknown",
                "dominant_colors": self._extract_dominant_colors(image),
                "estimated_geometry": "unknown",
                "complexity": "medium"
            }
            
            # If description provided, analyze it
            if description:
                analysis["geometry_hints"] = await self.generate_mesh_parameters(description)
            
            return analysis
            
        except Exception as e:
            logger.warning(f"Image analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_dominant_colors(self, image: Image.Image, num_colors: int = 5) -> List[str]:
        """Extract dominant colors from image"""
        try:
            # Resize image for faster processing
            image = image.resize((100, 100))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get pixel data
            pixels = list(image.getdata())
            
            # Simple color clustering (get most common colors)
            from collections import Counter
            color_counts = Counter(pixels)
            dominant = color_counts.most_common(num_colors)
            
            # Convert RGB tuples to color names (simplified)
            color_names = []
            for (r, g, b), count in dominant:
                color_name = self._rgb_to_color_name(r, g, b)
                if color_name not in color_names:
                    color_names.append(color_name)
            
            return color_names[:num_colors]
            
        except Exception as e:
            logger.warning(f"Color extraction failed: {e}")
            return ["unknown"]
    
    def _rgb_to_color_name(self, r: int, g: int, b: int) -> str:
        """Convert RGB to approximate color name"""
        if r > 200 and g > 200 and b > 200:
            return "white"
        elif r < 50 and g < 50 and b < 50:
            return "black"
        elif r > g and r > b:
            return "red"
        elif g > r and g > b:
            return "green"
        elif b > r and b > g:
            return "blue"
        elif r > 150 and g > 150 and b < 100:
            return "yellow"
        elif r > 100 and g < 100 and b > 100:
            return "purple"
        elif r > 150 and g > 100 and b < 100:
            return "orange"
        else:
            return "gray"
    
    async def generate_reference_image(self, prompt: str) -> Dict[str, Any]:
        """Generate reference image for 3D modeling"""
        try:
            if not self.hf_token:
                return {
                    "status": "error",
                    "message": "HuggingFace API token required for image generation"
                }
            
            payload = {
                "inputs": f"3D reference image: {prompt}, high quality, detailed, professional lighting",
                "parameters": {
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "width": 512,
                    "height": 512
                }
            }
            
            result = await self._make_api_request(self.models['image_generation'], payload)
            
            if result:
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
                else:
                    return {
                        "status": "success",
                        "image_data": result,
                        "prompt": prompt,
                        "timestamp": time.time()
                    }
            
            return {
                "status": "error",
                "message": "Failed to generate reference image"
            }
            
        except Exception as e:
            logger.error(f"Reference image generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def generate_texture(self, description: str, size: tuple = (512, 512)) -> Dict[str, Any]:
        """Generate texture for 3D models"""
        try:
            if not self.hf_token:
                return {
                    "status": "error",
                    "message": "HuggingFace API token required for texture generation"
                }
            
            texture_prompt = f"seamless texture pattern: {description}, tileable, high resolution, PBR material, no borders"
            
            payload = {
                "inputs": texture_prompt,
                "parameters": {
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5,
                    "width": size[0],
                    "height": size[1]
                }
            }
            
            result = await self._make_api_request(self.models['texture_generation'], payload)
            
            if result:
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
                else:
                    return {
                        "status": "success",
                        "texture_data": result,
                        "description": description,
                        "size": size,
                        "timestamp": time.time()
                    }
            
            return {
                "status": "error",
                "message": "Failed to generate texture"
            }
            
        except Exception as e:
            logger.error(f"Texture generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def generate_complete_3d_package(self, prompt: str) -> Dict[str, Any]:
        """Generate complete 3D asset package with model, texture, and reference"""
        try:
            # Generate all components concurrently
            tasks = {
                "model": self.text_to_3d_generation(prompt, enhance=True),
                "reference": self.generate_reference_image(prompt),
                "texture": self.generate_texture(prompt)
            }
            
            results = {}
            for key, task in tasks.items():
                try:
                    results[key] = await task
                except Exception as e:
                    results[key] = {"status": "error", "message": str(e)}
            
            # Determine overall status
            successful_components = sum(1 for result in results.values() if result.get("status") == "success")
            overall_status = "success" if successful_components > 0 else "error"
            
            return {
                "status": overall_status,
                "original_prompt": prompt,
                "components": results,
                "successful_components": successful_components,
                "total_components": len(tasks),
                "package_type": "complete_3d_asset",
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Complete 3D package generation failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "original_prompt": prompt
            }
    
    # ==================== CHATBOT FUNCTIONALITY ====================
    
    async def chat_with_bot(self, user_message: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Chat with AI bot about 3D models and generation"""
        try:
            # Prepare context about 3D generation
            context = """
            You are a helpful AI assistant for a 3D model generation platform. 
            You can help users with:
            - 3D model generation tips and prompts
            - Explaining different 3D file formats (GLB, OBJ, STL, PLY)
            - Troubleshooting generation issues
            - Suggesting improvements for prompts
            - General questions about 3D modeling
            """
            
            # Build conversation context
            conversation_context = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    conversation_context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            
            # Create the full prompt
            full_prompt = f"{context}\n\nConversation:\n{conversation_context}User: {user_message}\nAssistant:"
            
            # Try HuggingFace API first
            if self.hf_token:
                payload = {
                    "inputs": full_prompt,
                    "parameters": {
                        "max_length": 200,
                        "temperature": 0.7,
                        "do_sample": True,
                        "top_p": 0.9,
                        "repetition_penalty": 1.1
                    }
                }
                
                result = await self._make_api_request(self.models['llama_chat'], payload)
                if result and len(result) > 0:
                    response_text = result[0].get('generated_text', '')
                    # Extract just the assistant's response
                    if "Assistant:" in response_text:
                        response_text = response_text.split("Assistant:")[-1].strip()
                    
                    return {
                        "status": "success",
                        "response": response_text,
                        "model": "llama_chat",
                        "timestamp": time.time()
                    }
            
            # Fallback to local model
            if self.text_processor:
                result = self.text_processor(
                    full_prompt,
                    max_length=200,
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True
                )
                response_text = result[0]['generated_text']
                if "Assistant:" in response_text:
                    response_text = response_text.split("Assistant:")[-1].strip()
                
                return {
                    "status": "success",
                    "response": response_text,
                    "model": "local",
                    "timestamp": time.time()
                }
            
            # Final fallback
            return {
                "status": "success",
                "response": "I'm here to help with 3D model generation! What would you like to know?",
                "model": "fallback",
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Chatbot error: {str(e)}")
            return {
                "status": "error",
                "response": "Sorry, I'm having trouble responding right now. Please try again.",
                "error": str(e),
                "timestamp": time.time()
            }
    
    async def get_3d_generation_help(self, topic: str) -> Dict[str, Any]:
        """Get specific help about 3D generation topics"""
        help_topics = {
            "prompts": """
            **Better 3D Generation Prompts:**
            - Be specific: "wooden chair with armrests" vs "chair"
            - Include materials: "metal table with glass top"
            - Add style: "modern minimalist sofa"
            - Specify details: "detailed car with headlights and wheels"
            - Use technical terms: "low-poly", "high-detail", "realistic"
            """,
            "formats": """
            **3D File Formats:**
            - **GLB**: Best for web, includes materials and animations
            - **OBJ**: Universal format, good for 3D software
            - **STL**: For 3D printing, simple geometry
            - **PLY**: Good for point clouds and meshes
            """,
            "troubleshooting": """
            **Common Issues:**
            - **Blurry results**: Try "high detail", "sharp edges"
            - **Wrong proportions**: Add "realistic proportions"
            - **Missing details**: Be more specific in prompts
            - **Generation fails**: Try simpler prompts first
            """,
            "tips": """
            **Pro Tips:**
            - Start with simple prompts, then add details
            - Use reference images for better results
            - Try different styles: "realistic", "stylized", "low-poly"
            - Include lighting hints: "well-lit", "studio lighting"
            """
        }
        
        topic_lower = topic.lower()
        for key, content in help_topics.items():
            if key in topic_lower:
                return {
                    "status": "success",
                    "topic": key,
                    "content": content,
                    "timestamp": time.time()
                }
        
        return {
            "status": "success",
            "topic": "general",
            "content": help_topics["tips"],
            "timestamp": time.time()
        }

    def health_check(self) -> Dict[str, Any]:
        """Check service health and capabilities"""
        capabilities = {
            "local_text_processing": self.text_processor is not None,
            "huggingface_api": self.hf_token is not None,
            "text_to_3d": True,
            "image_to_3d": True,
            "texture_generation": self.hf_token is not None,
            "reference_generation": self.hf_token is not None,
            "prompt_enhancement": True,
            "chatbot": True,
            "3d_help": True
        }
        
        return {
            "status": "healthy",
            "capabilities": capabilities,
            "models": self.models,
            "timestamp": time.time()
        }